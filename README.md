# form4api

TypeScript SDK for [Form4API](https://www.form4api.com) — real-time SEC Form 4 insider trading data.

[![npm version](https://img.shields.io/npm/v/form4api.svg)](https://www.npmjs.com/package/form4api)
[![npm downloads](https://img.shields.io/npm/dm/form4api.svg)](https://www.npmjs.com/package/form4api)
[![license](https://img.shields.io/npm/l/form4api.svg)](https://github.com/theodor90/form4api-js/blob/main/LICENSE)

Works in Node.js 18+ and any modern browser via native `fetch`. Fully typed.

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
  minValue?: number;         // USD trade value (shares x price) — Pro+
  maxValue?: number;         // Pro+
  minShares?: number;        // Pro+
  maxShares?: number;        // Pro+
  page?: number;
  perPage?: number;       // max 100 for /v1/transactions (500 for other list endpoints)
});

// Paginate (async generator)
for await (const page of client.transactions.paginate({ ticker: "AAPL" })) {
  // page: Transaction[]
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

// Paginate (async generator)
for await (const page of client.signals.paginate({ clusterBuy: true })) {
  // page: InsiderSignal[]
}
```

### `client.webhooks`

```typescript
const sub = await client.webhooks.create(url: string, eventTypes: string[]);
const subs = await client.webhooks.list();
await client.webhooks.delete(subscriptionId: number);
const events = await client.webhooks.events({ since?: string });
```

**Event types:** `"TransactionFiled"`, `"ClusterBuy"`, `"ClusterSell"`

## Full resource surface

Every plan-gated endpoint the API exposes has a typed method here. Resources
generated from the OpenAPI spec sit alongside the hand-written ones above:

| Resource | Methods |
|---|---|
| `client.transactions` | `.list()`, `.paginate()` |
| `client.insiders` | `.get(cik)`, `.list()`, `.directory()`, `.transactions(cik)`, `.summary(cik)` *(Pro)*, `.scorecard(cik)` *(Pro)*, `.leaderboard()` *(Business)* |
| `client.companies` | `.get(ticker)`, `.insiders(ticker)`, `.list()` |
| `client.signals` | `.list()`, `.paginate()`, `.explain(ticker)`, `.sentiment(ticker)` — Business; `.convergence()` — Pro |
| `client.congress` | `.trades()`, `.politicians()` *(Pro)*, `.politician(idOrSlug)` *(Pro)*, `.ticker(ticker)` *(Pro)* |
| `client.form144` | `.list()` — Business |
| `client.holdings` | `.list()`, `.managers()` — Business |
| `client.filings` | `.list()`, `.recent()`, `.get(accessionNumber)` |
| `client.stats` | `.get()` — public, no key required |
| `client.dataQuality` | `.get()` — public, no key required |
| `client.status` | `.history()` |
| `client.webhooks` | `.create()`, `.list()`, `.delete(id)`, `.events()` |

Post-trade returns (1d/1w/1m/3m/6m) come back on transaction rows, and the
`minReturn*` screening filters are parameters on `client.transactions.list()`
*(returns visible free; screening Pro)*.

Calling an endpoint your key isn't entitled to throws `PlanError` (HTTP 402)
carrying `requiredPlan`, `currentPlan`, and `upgradeUrl` rather than failing
opaquely.

For the full parameter reference see the [REST docs](https://form4api.com/docs).
For LLM workflows, `form4api-mcp` exposes the same endpoints as tools.

## Error handling

```typescript
import { AuthError, PlanError, RateLimitError, NotFoundError } from "form4api";

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
