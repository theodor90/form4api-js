# Changelog

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
