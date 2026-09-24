# Changelog

## 1.6.0 — 2026-09-24

- Regenerated `src/generated.ts` from the current OpenAPI spec (backend
  insiderapi #313). `TransactionResponse.transactionCode` narrows from
  `string` to the 22 SEC transaction-code letters plus `"Unknown"`;
  `TransactionResponse.valueQuality` narrows from `string | null` to
  `"ImplausiblePrice" | "ImplausibleValue" | null`; and `CongressTradeDto`'s
  `assetType` / `ownerType` / `transactionType` each narrow to their real
  value sets. Wire values are unchanged — this is a type-only change. It's a
  **minor**, not a patch, because it can break a build for existing code that
  compares one of these fields against a string literal outside the new
  union (TypeScript rejects that comparison at compile time) or assigns the
  field to a locally-declared narrower type; code that just reads, logs, or
  passes the value through is unaffected. `valueQuality` still accepts
  `null`.
- ~22 operations now declare 400/404 responses in the spec (no
  client-visible behavior change — this SDK's error handling was already
  generic per status code).
- No SDK-level change from the 429 response's new daily rate-limit headers
  (`X-RateLimit-Limit-Day` / `-Remaining-Day` / `-Reset-Day`): `RateLimitError`
  only ever surfaced `Retry-After` as `retryAfter`, and there's no existing
  pattern in `client.ts`/`errors.ts` for surfacing the `X-RateLimit-*`
  family (including the pre-existing non-daily ones) at all, so nothing was
  added rather than adding one ad hoc.

## 1.5.0 — 2026-09-24

- `transactions.list()` accepts `filedFrom` / `filedTo` (YYYY-MM-DD) to filter
  on the date a filing became public, separate from `from` / `to`, which filter
  on the transaction's own date.
- `ticker` on `transactions.list()` accepts up to 25 comma-separated symbols,
  e.g. `ticker: "AAPL,MSFT,NVDA"`.
- `Transaction` gained `acceptedAt` (precise SEC acceptance time, nullable) and
  `documentUrl`.
- Regenerated `src/generated.ts` from the current OpenAPI spec: filings gain
  `acceptedAt` / `documentUrl`, Form 144 gains `filerCik` /
  `securitiesClassTitle` / `documentUrl`, list endpoints document the `limit`
  alias for `per_page`, and webhook event types list all five names including
  `ConvergenceSignal`.

## Earlier versions

Not tracked in this file. See the npm release history.
