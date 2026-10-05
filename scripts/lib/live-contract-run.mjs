// Stage 6 runner. release-check.mjs copies this file into the temp consumer
// project, so `import "form4api"` below resolves to the INSTALLED tarball, never
// to src/. It never prints the API key.
//
// argv: <contract.mjs file URL> <live-calls.json path> <spec URL>
// env:  FORM4API_TEST_KEY
import { readFileSync } from "node:fs";
import { Form4ApiClient } from "form4api";

const [contractUrl, callsPath, specUrl] = process.argv.slice(2);
const key = process.env.FORM4API_TEST_KEY ?? "";
const { validateResponse, responseSchemaFor } = await import(contractUrl);

const redact = (s) => (key ? String(s).split(key).join("***") : String(s));
const out = (s) => console.log(redact(s));

// Parity map: "VERB /openapi/path" -> how to call the SDK method. An operation
// with no entry here (or whose method is missing on the installed client)
// is a parity gap and fails the stage.
const SDK = {
  "GET /v1/stats": { path: "stats.get", call: (c) => c.stats.get() },
  "GET /v1/transactions": {
    path: "transactions.list",
    call: (c, p) => c.transactions.list({ ticker: p.ticker, perPage: p.limit }),
  },
  "GET /v1/filings": { path: "filings.list", call: (c, p) => c.filings.list({ ticker: p.ticker, limit: p.limit }) },
  "GET /v1/companies/{ticker}": { path: "companies.get", call: (c, p) => c.companies.get(p.ticker) },
  "GET /v1/companies/{ticker}/insiders": { path: "companies.insiders", call: (c, p) => c.companies.insiders(p.ticker) },
  "GET /v1/insiders": { path: "insiders.list", call: (c, p) => c.insiders.list({ name: p.name }) },
  "GET /v1/signals": { path: "signals.list", call: (c, p) => c.signals.list({ perPage: p.limit }) },
  "GET /v1/congress/trades": { path: "congress.trades", call: (c, p) => c.congress.trades({ ticker: p.ticker }) },
  "GET /v1/search": { path: "search", call: (c, p) => c.search(p.q) },
  // GET /v1/keys/usage is deliberately not in contract/live-calls.json: it is in
  // codegen SKIP_OPERATIONS and the spec declares no 200 schema, so there is no SDK
  // method to call and nothing to validate. Usage is covered by the MCP check_usage tool.
};

function hasMethod(client, dotted) {
  let o = client;
  for (const part of dotted.split(".")) {
    if (o == null) return false;
    o = o[part];
  }
  return typeof o === "function";
}

const calls = JSON.parse(readFileSync(callsPath, "utf8"));
const res = await fetch(specUrl);
if (!res.ok) {
  out(`FAIL cannot fetch spec ${specUrl}: HTTP ${res.status}`);
  process.exit(1);
}
const spec = await res.json();
const client = new Form4ApiClient({ apiKey: key, maxRetries: 1 });

let failures = 0;
const fail = (id, msg) => {
  failures++;
  out(`  FAIL ${id}: ${msg}`);
};

// Parity check first, for every entry, so one run lists every gap.
const runnable = [];
for (const entry of calls) {
  const [verb, path] = entry.method.split(" ");
  const sdk = SDK[entry.method];
  if (!sdk || !hasMethod(client, sdk.path)) {
    fail(
      entry.id,
      `PARITY: ${entry.method} has no method in the installed form4api SDK` +
        (sdk ? ` (expected client.${sdk.path}())` : ""),
    );
    continue;
  }
  try {
    responseSchemaFor(spec, verb, path);
  } catch (e) {
    fail(entry.id, `SPEC: ${e.message}`);
    continue;
  }
  runnable.push({ entry, verb, path, sdk });
}

for (const { entry, verb, path, sdk } of runnable) {
  let data;
  try {
    data = await sdk.call(client, entry.params ?? {});
  } catch (e) {
    fail(entry.id, `SDK call client.${sdk.path}() threw ${e?.constructor?.name}: ${e?.message}`);
    continue;
  }
  const { ok, errors } = validateResponse(spec, verb, path, data);
  if (!ok) {
    const shown = errors.slice(0, 8).map((e) => `      - ${e}`).join("\n");
    fail(entry.id, `response violates the 200 schema of ${entry.method} (${errors.length} error(s))\n${shown}`);
    continue;
  }
  // Regression: disclosureLagDays went nullable on 2026-10-05. The live data
  // must still contain a row exercising it, or this check proves nothing.
  if (entry.id === "congress-sony") {
    const hit = Array.isArray(data) && data.some((r) => r.disclosureLagDays === null && r.dateQuality != null);
    if (!hit) {
      fail(entry.id, "regression: expected at least one row with disclosureLagDays null and a non-null dateQuality, found none");
      continue;
    }
  }
  out(`  ok   ${entry.id} (${entry.method} -> client.${sdk.path}())`);
}

out(`${calls.length} call(s) listed, ${runnable.length} mapped to an SDK method, ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
