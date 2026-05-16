# form4api

TypeScript SDK for [Form4API](https://form4api.com) — real-time SEC Form 4 insider trading data.

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
const buys = await client.transactions.list({ ticker: "AAPL", code: "P", isOpenMarket: true });
for (const txn of buys) {
  console.log(txn.insiderName, txn.insiderRole, txn.sharesAmount, "@", txn.pricePerShare);
}

// Company overview
const company = await client.companies.get("MSFT");
console.log(company.name, company.activeInsiders, "active insiders");

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
  code?: string;         // "P" = purchase, "S" = sale
  from?: string;         // ISO date "2025-01-01"
  to?: string;
  isOpenMarket?: boolean; // filter to open-market trades only
  is10b5Plan?: boolean;   // filter to 10b5-1 plan trades
  page?: number;
  perPage?: number;       // max 500
});

// Paginate (async iterator)
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
| `sharesAmount` | `number` | Shares transacted |
| `pricePerShare` | `number \| null` | Price per share |
| `totalValue` | `number \| null` | `sharesAmount × pricePerShare` |
| `sharesOwnedAfter` | `number \| null` | Holdings after transaction |
| `directIndirect` | `string \| null` | "D" or "I" |
| `isDerivative` | `boolean` | Derivative security flag |
| `isOpenMarket` | `boolean` | Open-market transaction (not grant/award) |
| `is10b5Plan` | `boolean` | Filed under a 10b5-1 trading plan |
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

### `client.signals` *(Business plan)*

```typescript
const signals = await client.signals.list({
  ticker?: string;
  clusterBuy?: boolean;   // only cluster-buy signals
  clusterSell?: boolean;  // only cluster-sell signals
  page?: number;
  perPage?: number;
});

// Paginate
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
