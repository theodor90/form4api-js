# form4api

TypeScript SDK for [Form4API](https://www.form4api.com) — real-time SEC Form 4 insider trading, Form 144 intent-to-sell, institutional 13F-HR, and congressional STOCK Act trading data, including the insider/Congress convergence signal.

[![npm version](https://img.shields.io/npm/v/form4api.svg)](https://www.npmjs.com/package/form4api)
[![npm downloads](https://img.shields.io/npm/dm/form4api.svg)](https://www.npmjs.com/package/form4api)
[![license](https://img.shields.io/npm/l/form4api.svg)](https://github.com/theodor90/form4api-js/blob/main/LICENSE)

Works in Node.js 18+ and any modern browser via native `fetch`. Fully typed. `verifyWebhook` uses Web Crypto, so it runs in Node, browsers and edge runtimes too.

## Installation

```bash
npm install form4api
```

## Quick start

```typescript
import { Form4ApiClient } from "form4api";

const client = new Form4ApiClient({ apiKey: "YOUR_API_KEY" });

// Recent open-market purchases at Apple
const buys = await client.transactions.list({ ticker: "AAPL", code: "P", perPage: 5 });
for (const txn of buys) {
  console.log(txn.insiderName, txn.insiderTitle, txn.sharesAmount, "@", txn.pricePerShare);
}

// Company overview
const company = await client.companies.get("MSFT");
console.log(company.name, company.activeInsiders, "active insiders");
console.log(company.sicDescription, company.stateOfIncorporation);

// Insider detail
const insider = await client.insiders.get("0001234567");
console.log(insider.name, insider.officerTitle);

// Cluster-buy signals (Business plan)
const signals = await client.signals.list({ clusterBuy: true });
for (const sig of signals) {
  console.log(sig.companyName, sig.insiderCount, "buyers");
}
```

## Resources

### `client.transactions`

```typescript
const txns = await client.transactions.list({
  ticker?: string;
  cik?: string;
  insiderCik?: string;
  code?: string;          // "P" = purchase, "S" = sale
  from?: string;          // ISO date "2025-01-01"
  to?: string;
  exclude10b5?: boolean;  // omit trades filed under a 10b5-1 plan
  codes?: string;            // comma-separated include, e.g. "P,S"
  excludeCodes?: string;     // comma-separated exclude, e.g. "A,M,F,G"
  category?: string;         // open_market | grants | derivatives | gifts | other
  excludeCategory?: string;  // drop a whole category, e.g. "derivatives"
  excludeDerivative?: boolean; // drop derivative-security rows
  significant?: boolean;     // preset: open-market, no 10b5-1, no derivatives
  minValue?: number;         // USD trade value (shares x price) — every plan
  maxValue?: number;         // Pro+
  minShares?: number;        // Pro+
  maxShares?: number;        // Pro+
  // Post-trade return filters — Pro+ (403 on Free/Starter). Returns are
  // FRACTIONS: 0.2 = +20%. Rows with no computed return for the horizon are excluded.
  minReturn1d?: number;  maxReturn1d?: number;   // also 1w, 1m, 3m, 6m
  hasReturns?: boolean;      // Pro+: true = all five horizons computed
  instOwnershipTrend?: "increasing" | "decreasing" | "stable"; // 13F ownership trend
  role?: "officer" | "director" | "ten_percent_owner";
  sort?: "date" | "value";   // default "date"; "value" = largest trade first
  page?: number;
  perPage?: number;       // max 100 for /v1/transactions (500 for other list endpoints)
});

// Paginate (async generator) — stops on a short/empty page, or throws
// PaginationLimitError if the key's plan-gated pagination depth is hit
// (Free: 20 pages, Starter: 100, Pro+: unlimited). Pages already yielded
// are still delivered before that error is thrown. Pass maxPages to stop
// deliberately before that ever happens.
try {
  for await (const page of client.transactions.paginate({ ticker: "AAPL" }, { maxPages: 20 })) {
    // page: Transaction[]
  }
} catch (err) {
  if (err instanceof PaginationLimitError) {
    console.log(`Stopped after ${err.pagesYielded} pages — upgrade to go deeper`);
  }
}
```

**`Transaction` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | `string` | Stock ticker |
| `companyName` | `string` | Company name |
| `insiderName` | `string` | Insider's full name |
| `insiderCik` | `string` | Insider CIK |
| `insiderTitle` | `string \| null` | Officer title as reported on the Form 4 |
| `isDirector` | `boolean` | Director relationship flag |
| `isOfficer` | `boolean` | Officer relationship flag |
| `is10PctOwner` | `boolean` | 10% owner relationship flag |
| `accessionNumber` | `string` | SEC accession number |
| `securityTitle` | `string` | Security type |
| `transactionCode` | `string` | Transaction code (P/S/A/D/…) |
| `isOpenMarket` | `boolean` | `true` when code is P or S (not grants/awards) |
| `is10b5Plan` | `boolean` | Filed under a Rule 10b5-1 pre-scheduled trading plan |
| `sharesAmount` | `number` | Shares transacted |
| `pricePerShare` | `number \| null` | Price per share |
| `totalValue` | `number \| null` | `sharesAmount × pricePerShare` in USD |
| `sharesOwnedAfter` | `number \| null` | Holdings after transaction |
| `directIndirect` | `string \| null` | "D" (direct) or "I" (indirect) |
| `isDerivative` | `boolean` | Derivative security flag |
| `transactionDate` | `string` | ISO datetime |
| `periodOfReport` | `string` | ISO datetime |
| `filedAt` | `string` | When the filing became public on EDGAR |
| `return1d`, `return1w`, `return1m`, `return3m`, `return6m` | `number \| null` | Post-trade returns as fractions (0.109 = +10.9%); `null` until computed |
| `valueQuality` | `"ImplausiblePrice" \| "ImplausibleValue" \| null` | Set when the price or value looks implausible |
| `institutionalOwnership` | `InstitutionalOwnershipDto \| undefined` | 13F ownership context for the company |

### `client.insiders`

```typescript
const insider = await client.insiders.get(cik: string);
const txns = await client.insiders.transactions(cik: string, { from?, to?, page?, perPage? });
```

### `client.companies`

```typescript
const company = await client.companies.get(ticker: string);
const insiders = await client.companies.insiders(ticker: string);
```

**`Company` fields:** `cik`, `name`, `ticker`, `exchange`, `totalFilings`, `activeInsiders`, `sicDescription`, `stateOfIncorporation`, `website`

### `client.signals` *(Business plan)*

```typescript
const signals = await client.signals.list({
  ticker?: string;
  clusterBuy?: boolean;   // only cluster-buy signals
  clusterSell?: boolean;  // only cluster-sell signals
  page?: number;
  perPage?: number;
});

// Paginate (async generator) — same plan-gated depth limit and
// PaginationLimitError behavior as client.transactions.paginate() above.
for await (const page of client.signals.paginate({ clusterBuy: true }, { maxPages: 20 })) {
  // page: InsiderSignal[]
}
```

### `client.webhooks`

```typescript
const sub = await client.webhooks.create(url, eventTypes, {
  authHeader?: { name: string; value: string },  // sent with every delivery
});
const subs = await client.webhooks.list();
await client.webhooks.delete(subscriptionId: number);
const events = await client.webhooks.events({ since?: string });

await client.webhooks.update(id, url);        // change the URL; returns the WebhookSubscription incl. urlWarning
await client.webhooks.enable(id);             // { subscriptionId, isActive } - undo an auto-disable
await client.webhooks.test(id);               // { delivered, statusCode, durationMs, error }
await client.webhooks.setAuthHeader(id, { name, value });  // { subscriptionId, authHeaderName }
await client.webhooks.deleteAuthHeader(id);   // 204, resolves with no value
```

**Event types** (exact names, case-insensitive on input):

| Event | Plan |
|---|---|
| `"TransactionFiled"` | Free |
| `"ClusterBuy"` | Free |
| `"ClusterSell"` | Free |
| `"CongressTradeFiled"` | Starter+ |
| `"ConvergenceSignal"` | Pro+ |

Payloads are compact PascalCase references with no envelope (the body is the
bare object), for example `{ FilingId, AccessionNumber }` for
`TransactionFiled`. The event name is in the `X-Event-Type` header, not the
body. `CongressTradeFiled` and `ConvergenceSignal` carry the full event body.

`list()` returns delivery health for each subscription: `isActive`,
`disabledAt`/`disabledReason` (`"delivery_failures"` when the system
auto-disabled it; re-enable with `enable(id)`), `lastAttemptAt`,
`lastSuccessAt`, `lastStatusCode`, `lastErrorClass`, `isReadOnly` and
`authHeaderName`. All of these are nullable. The auth header value is
write-only and never returned.

**Moving a webhook to a new URL.** `update(id, url)` changes the delivery URL
and keeps the id, secret, event types and auth header. It does not re-enable a
subscription the system disabled, so call `enable(id)` afterwards if needed.
The `last*` health fields come back `null` because they described the old URL.

```typescript
// Started on a tunnel, now moving to a stable endpoint
const moved = await client.webhooks.update(sub.subscriptionId, "https://example.com/hooks/form4api");
if (!moved.isActive) await client.webhooks.enable(moved.subscriptionId);
```

**`urlWarning`.** `create()`, `update()` and each `list()` item carry
`urlWarning`: a string when the URL's host is a temporary tunnel or test host
(trycloudflare, ngrok, webhook.site, loca.lt, serveo), otherwise `null`. It is a
warning only; the subscription is saved either way, and deliveries stop when the
tunnel closes. URLs over 500 characters are rejected with 400 `INVALID_URL`.

**Verifying deliveries.** Each delivery carries
`X-Insider-Signature: sha256=<hex HMAC-SHA256(secret, raw body)>`. Use the raw
request body, not re-serialised JSON. `verifyWebhook` is async (Web Crypto), so
`await` it:

```typescript
import { verifyWebhook } from "form4api";

const ok = await verifyWebhook(rawBody, req.headers["x-insider-signature"], process.env.WEBHOOK_SECRET!);
if (!ok) return res.status(401).end();
```

### `client.search()`

```typescript
const results = await client.search(q: string, { limit?: number });
// results.companies: { ticker, name, cik }[]
// results.insiders:  { cik, name, title: string | null, ticker: string | null }[]
```

Combined name search across companies (matched by ticker or name) and
insiders (matched by name) — for resolving free-text input to a specific
ticker or CIK, e.g. a site search box. `q` must be 2-64 characters after
trimming, or the call throws `InsiderApiError` with `errorCode`
`"QUERY_TOO_SHORT"` or `"QUERY_TOO_LONG"`. Insiders are matched by splitting
`q` on whitespace and requiring every token to match the name, so
`"tim cook"` matches the SEC-style `"Cook Timothy D"`. `limit` applies
independently to each of the two result lists (default 8, max 20). Each
insider's `ticker` is a ticker associated with that insider and may be
`null`. Free tier, not plan-gated.

## Full resource surface

Every endpoint that returns typed JSON has a method here, including every
plan-gated one. The exceptions are the CSV exports, the account/billing
bootstrap calls and the usage endpoints, which have no typed response and are
not wrapped. Resources generated from the OpenAPI spec sit alongside the
hand-written ones above:

| Resource | Methods |
|---|---|
| `client.transactions` | `.list()`, `.paginate()` |
| `client.insiders` | `.get(cik)`, `.list()`, `.directory()`, `.transactions(cik)`, `.summary(cik)` *(Pro)*, `.scorecard(cik)` *(Pro)*, `.leaderboard()` *(Business)* |
| `client.companies` | `.get(ticker)`, `.insiders(ticker)`, `.list()` |
| `client.signals` | `.list()`, `.paginate()`, `.explain(ticker)`, `.sentiment(ticker)` — Business; `.convergence()` — Pro |
| `client.congress` | `.trades()`, `.politicians()` *(Pro)*, `.politician(idOrSlug)` *(Pro)*, `.ticker(ticker)` *(Pro)* |
| `client.form144` | `.list()` — Business |
| `client.holdings` | `.list()`, `.managers()` — Business |
| `client.ownership` | `.schedule13dg()` — Business (Schedule 13D/13G >5% ownership crossings; filters `ticker`, `form_type`, `is_amendment`, `page`, `per_page`) |
| `client.filings` | `.list()`, `.recent()`, `.get(accessionNumber)` |
| `client.stats` | `.get()` — public, no key required |
| `client.dataQuality` | `.get()` — public, no key required |
| `client.status` | `.history()` |
| `client.webhooks` | `.create()`, `.list()`, `.update(id, url)`, `.delete(id)`, `.events()`, `.enable(id)`, `.test(id)`, `.setAuthHeader(id, header)`, `.deleteAuthHeader(id)` |
| `client.search(q, { limit? })` | Name search for companies and insiders. Free tier |

**Congress date quality.** Each congress trade (and convergence leg) has
`disclosureLagDays: number | null` and `dateQuality: string | null`. When the
filing's own dates are impossible or implausible, the lag is `null` and
`dateQuality` is one of `"transaction_after_disclosure"`,
`"future_transaction_date"` or `"implausible_lag"`; the raw dates are still
returned. A lag over 45 days is not a legal finding.

```ts
const trades = await client.congress.trades({ ticker: "NVDA" });
for (const t of trades) {
  const lag = t.disclosureLagDays === null ? `dates unreliable (${t.dateQuality})` : `${t.disclosureLagDays}d`;
  console.log(t.politician.fullName, t.transactionDate, lag);
}
```

Post-trade returns (1d/1w/1m/3m/6m) come back on transaction rows as
fractions, and the `minReturn*` / `maxReturn*` / `hasReturns` screening filters
are parameters on `client.transactions.list()` and `.paginate()`
*(returns visible on every plan; the filters are Pro+)*.

Calling an endpoint your key isn't entitled to throws `PlanError` (HTTP 402)
carrying `requiredPlan`, `currentPlan`, and `upgradeUrl` rather than failing
opaquely.

For the full parameter reference see the [REST docs](https://form4api.com/docs).
For LLM workflows, `form4api-mcp` exposes the same endpoints as tools.

## Error handling

```typescript
import { AuthError, PlanError, PaginationLimitError, RateLimitError, NotFoundError } from "form4api";

try {
  const signals = await client.signals.list();
} catch (err) {
  if (err instanceof PlanError) {
    console.log(`Upgrade to ${err.requiredPlan}`);
  } else if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfter}s`);
  } else if (err instanceof AuthError) {
    console.log("Invalid API key");
  }
}
```

### Pagination limits

`transactions.paginate()` and `signals.paginate()` keep requesting pages until
the data runs out — or, since the backend's 2026-08-01 plan-gated pagination
depth (Free: 20 pages, Starter: 100, Pro+: unlimited), until the next page is
rejected with a 402. That 402 is never swallowed: it surfaces mid-iteration as
`PaginationLimitError`, thrown only after every page already yielded has been
delivered to your loop — `pagesYielded` tells you exactly how many, and the
original `PlanError` is preserved as `err.cause`.

```typescript
try {
  for await (const page of client.transactions.paginate({ ticker: "AAPL" })) {
    // ...
  }
} catch (err) {
  if (err instanceof PaginationLimitError) {
    console.log(`Stopped after ${err.pagesYielded} pages — ${err.message}`);
  }
}
```

Pass `maxPages` in the second argument to stop deliberately before the plan's
depth limit is ever reached:

```typescript
for await (const page of client.transactions.paginate({ ticker: "AAPL" }, { maxPages: 10 })) {
  // ...
}
```

The client retries `5xx` errors and network failures up to 2 times (configurable via `maxRetries`). `4xx` responses are surfaced immediately without retry.

```typescript
const client = new Form4ApiClient({
  apiKey: "YOUR_API_KEY",
  maxRetries: 3,   // default: 2
  timeout: 10_000, // ms, default: 30000
});
```

## License

MIT
