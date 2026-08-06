// Generates typed resource methods and response interfaces from the Form4API
// OpenAPI spec. Modelled on form4api-mcp/codegen/generate.mjs, which has been
// generating that repo's tool definitions from the same spec since v1.9.
//
// WHY THIS EXISTS
// Both SDKs exposed 5 of 12+ endpoint families. All 6 Pro-gated endpoints and 9
// of the 10 Business-gated ones were unreachable: a customer paying $149 could
// not call Form 144, 13F holdings, managers, sentiment, explain or convergence
// from the client library at all. Hand-writing 23 methods twice would have
// fixed it once and guaranteed the same drift returned with the next endpoint.
//
// WHAT IT DOES NOT DO
// It does not regenerate the five hand-written resource families. Those are a
// PUBLISHED public API (npm `form4api`); regenerating them would rename methods
// and break every existing user. Hand-written classes instead EXTEND the
// generated bases, so they inherit new spec-derived methods while keeping their
// curated surface. Move an operation out of HANDLED_BY_HANDWRITTEN when you
// want codegen to own it — same migration path the MCP repo documents.
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const OUTPUT_PATH = path.join(REPO_ROOT, 'src/generated.ts')
const SPEC_URL = process.env.FORM4API_OPENAPI_URL ?? 'https://api.form4api.com/openapi/v1.json'

// Operations with no typed response, or that do not belong in an SDK.
// The response-less ones are OpenAPI Stage 1b: they return anonymous objects
// server-side, so there is no schema to generate against. This list should
// shrink as those gain DTOs.
const SKIP_OPERATIONS = new Set([
  'HealthLive', 'HealthReady', 'HealthIngestion', // infra probes
  'CreateCheckout', 'CreateBillingPortal', 'CreateApiKey', // account bootstrap
  'ExportTransactions', 'ExportForm144', // CSV streams, not JSON
  'InsiderTradingAlias', // 301 redirect to /v1/transactions
  'GetFeaturedTestimonials', 'SubmitTestimonial', 'JoinUpgradeWaitlist', // marketing
  // Stage 1b — anonymous server-side responses, no schema to bind to.
  'GetInsiderLeaderboard', 'GetKeyUsage', 'GetKeyActivity', 'GetUsageHistory',
  'ListWebhooks', 'GetWebhookEvents', 'CreateWebhook', 'DeleteWebhook',
])

// Operations already exposed by a hand-written resource. Generating these would
// produce a second method for the same endpoint under a different name.
const HANDLED_BY_HANDWRITTEN = new Set([
  'ListTransactions',       // → transactions.list()
  'GetInsider',             // → insiders.get()
  'GetInsiderTransactions', // → insiders.transactions()
  'GetCompany',             // → companies.get()
  'GetCompanyInsiders',     // → companies.insiders()
  'GetSignals',             // → signals.list()
])

// OpenAPI tag → the resource class it belongs to. Explicit rather than derived:
// tags are prose ("Institutional Holdings (13F-HR)") and a heuristic would be
// one rename away from silently reshaping the public API.
const TAG_TO_RESOURCE = {
  'Companies': 'companies',
  'Congress': 'congress',
  'Data Quality': 'dataQuality',
  'Filings': 'filings',
  'Form 144': 'form144',
  'Insiders': 'insiders',
  'Institutional Holdings (13F-HR)': 'holdings',
  'Signals & Sentiment': 'signals',
  'Stats': 'stats',
  'Status': 'status',
  'Transactions': 'transactions',
}

// operationId → method name. Explicit for the same reason as tags: a derived
// name is a rename away from a breaking change, and there are few enough
// operations that spelling them out is cheaper than debugging a heuristic.
const METHOD_NAMES = {
  ListCompanies: 'list',
  ListCongressTrades: 'trades',
  ListCongressPoliticians: 'politicians',
  GetCongressPolitician: 'politician',
  GetCongressTickerRollup: 'ticker',
  GetDataQuality: 'get',
  GetRecentFilings: 'recent',
  GetFiling: 'get',
  ListForm144: 'list',
  ListInsiders: 'list',
  GetInsiderSummary: 'summary',
  GetInsiderScorecard: 'scorecard',
  ListHoldings: 'list',
  ListManagers: 'managers',
  ExplainSignal: 'explain',
  GetSentiment: 'sentiment',
  GetConvergenceSignals: 'convergence',
  GetPublicStats: 'get',
  GetStatusHistory: 'history',
}

const RESERVED = new Set(['default', 'function', 'class', 'new', 'delete'])

function tsName(raw) {
  const clean = raw.replace(/[^A-Za-z0-9_]/g, '')
  return RESERVED.has(clean) ? `${clean}_` : clean
}

/** OpenAPI schema → TypeScript type expression. Unknown shapes degrade to
 *  `unknown` rather than guessing — a wrong type is worse than an opaque one. */
function tsTypeFor(schema, required = true) {
  if (!schema) return 'unknown'
  let t
  if (schema.$ref) {
    t = tsName(schema.$ref.split('/').pop())
  } else if (schema.type === 'array') {
    t = `${tsTypeFor(schema.items)}[]`
  } else if (Array.isArray(schema.enum) && schema.enum.length) {
    t = schema.enum.map((v) => JSON.stringify(v)).join(' | ')
  } else {
    switch (schema.type) {
      case 'string': t = 'string'; break
      case 'integer':
      case 'number': t = 'number'; break
      case 'boolean': t = 'boolean'; break
      case 'object': t = 'Record<string, unknown>'; break
      default: t = 'unknown'
    }
  }
  const nullable = schema.nullable === true || (Array.isArray(schema.type) && schema.type.includes('null'))
  return nullable && required ? `${t} | null` : t
}

function docComment(lines, indent = '  ') {
  const body = lines.filter(Boolean)
  if (!body.length) return ''
  if (body.length === 1) return `${indent}/** ${body[0]} */\n`
  return `${indent}/**\n${body.map((l) => `${indent} * ${l}`).join('\n')}\n${indent} */\n`
}

function renderInterface(name, schema) {
  const props = schema.properties ?? {}
  const required = new Set(schema.required ?? [])
  const fields = Object.entries(props).map(([prop, ps]) => {
    const optional = required.has(prop) ? '' : '?'
    const doc = docComment([ps.description], '  ')
    return `${doc}  ${tsName(prop)}${optional}: ${tsTypeFor(ps, required.has(prop))};`
  })
  const doc = docComment([schema.description], '')
  return `${doc}export interface ${tsName(name)} {\n${fields.join('\n')}\n}\n`
}

function pathParamsOf(template) {
  return [...template.matchAll(/\{([^}]+)\}/g)].map((m) => m[1])
}

function renderMethod(op, method, template) {
  const name = METHOD_NAMES[op.operationId]
  if (!name) throw new Error(`No METHOD_NAMES entry for ${op.operationId}`)

  const pathParams = pathParamsOf(template)
  const params = op.parameters ?? []
  const query = params.filter((p) => p.in === 'query')

  const returnType = tsTypeFor(
    op.responses?.['200']?.content?.['application/json']?.schema,
  )

  const args = pathParams.map((p) => `${tsName(p)}: string`)
  const optionsType = query.length ? `${tsName(op.operationId)}Params` : null
  if (optionsType) args.push(`params?: ${optionsType}`)

  const url = '`' + template.replace(/\{([^}]+)\}/g, (_, p) => `\${encodeURIComponent(${tsName(p)})}`) + '`'
  const call = optionsType
    ? `this.client._get<${returnType}>(${url}, toQuery(params))`
    : `this.client._get<${returnType}>(${url})`

  const doc = docComment([op.summary, op.description && op.description !== op.summary ? op.description : null])
  return { name, code: `${doc}  async ${name}(${args.join(', ')}): Promise<${returnType}> {\n    return ${call};\n  }\n`, optionsType, query, operationId: op.operationId }
}

function renderParamsInterface(operationId, query) {
  const fields = query.map((p) => {
    const doc = docComment([p.description], '  ')
    return `${doc}  ${tsName(p.name)}?: ${tsTypeFor(p.schema, false)};`
  })
  return `export interface ${tsName(operationId)}Params {\n${fields.join('\n')}\n}\n`
}

async function main() {
  console.log(`Fetching OpenAPI spec from ${SPEC_URL}`)
  const spec = SPEC_URL.startsWith('http')
    ? await (await fetch(SPEC_URL)).json()
    : JSON.parse(await fs.readFile(SPEC_URL, 'utf8'))

  const schemas = spec.components?.schemas ?? {}
  const interfaces = Object.entries(schemas).map(([n, s]) => renderInterface(n, s))

  const byResource = new Map()
  const paramInterfaces = []
  let generated = 0
  const skipped = []

  for (const [template, item] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(item)) {
      if (!['get'].includes(method)) continue
      const id = op.operationId
      if (!id) continue
      if (SKIP_OPERATIONS.has(id)) { skipped.push(`${id} (skipped)`); continue }
      if (HANDLED_BY_HANDWRITTEN.has(id)) { skipped.push(`${id} (hand-written)`); continue }

      const tag = (op.tags ?? [])[0]
      const resource = TAG_TO_RESOURCE[tag]
      if (!resource) { skipped.push(`${id} (no resource for tag "${tag}")`); continue }

      const m = renderMethod(op, method, template)
      if (m.optionsType) paramInterfaces.push(renderParamsInterface(m.operationId, m.query))
      if (!byResource.has(resource)) byResource.set(resource, [])
      byResource.get(resource).push(m)
      generated++
    }
  }

  const classes = [...byResource.entries()].sort().map(([resource, methods]) => {
    const cls = `Generated${resource[0].toUpperCase()}${resource.slice(1)}Resource`
    const body = methods.sort((a, b) => a.name.localeCompare(b.name)).map((m) => m.code).join('\n')
    return `export class ${cls} {\n  constructor(protected readonly client: Form4ApiClient) {}\n\n${body}}\n`
  })

  const header = `// AUTOGENERATED by codegen/generate.mjs — do not edit by hand.
// Regenerate with \`npm run codegen\`; \`npm run codegen:check\` gates CI.
//
// Source of truth is the Form4API OpenAPI document. Hand-written resources in
// src/resources/ extend these bases, so a new backend endpoint reaches the SDK
// by regenerating rather than by hand-writing it in two languages.
/* eslint-disable */
import type { Form4ApiClient } from "./client.js";

/**
 * Drops undefined entries and stringifies the rest for the query string.
 * Generic over the param type because the generated interfaces have no index
 * signature — a TS interface does not implicitly satisfy Record<string, unknown>.
 */
function toQuery<T extends object>(params?: T): Record<string, string> | undefined {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) out[k] = String(v);
  }
  return out;
}
`

  const out = [header, ...interfaces, ...paramInterfaces, ...classes].join('\n')
  await fs.writeFile(OUTPUT_PATH, out, 'utf8')

  console.log(`Wrote ${OUTPUT_PATH}`)
  console.log(`  ${Object.keys(schemas).length} interfaces, ${generated} methods across ${byResource.size} resources`)
  for (const s of skipped) console.log(`  skipped: ${s}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
