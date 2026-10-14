# Changelog

## Unreleased

## 1.10.0 — 2026-10-14

- **`companies.peers(ticker, { limit })`.** Similar companies in the same SIC
  industry (`GET /v1/companies/{ticker}/peers`), ranked by Form 4 filings in
  the trailing 12 months. Same 4-digit SIC first, topped up from the 2-digit
  prefix; inactive peers come last; the company itself is excluded. `limit`
  defaults to 10 and is clamped to 1-25 by the API. Returns
  `CompanyPeersResponse` (`basis`: `sic4`, `sic2`, `mixed` or `none`) with
  `CompanyPeerResponse` rows (`ticker`, `name`, `cik`, `sicCode`, `filings12m`,
  `matchLevel`). A company with no SIC code returns an empty list; an unknown
  ticker throws `NotFoundError`. Available on every plan. Both types are
  exported.

## 1.9.0 — 2026-10-13

- **`webhooks.update(id, url)`.** Changes the delivery URL of a webhook
  subscription (`PATCH /v1/webhooks/{id}`) and returns the updated
  `WebhookSubscription`. The id, secret, event types and auth header are kept.
  The URL is checked the same way as on create (HTTPS, public address, at most
  500 characters); a rejected URL throws `InsiderApiError` with the code in
  `errorCode` (`INVALID_REQUEST`, `INVALID_URL`, `INSECURE_URL`,
  `PRIVATE_ADDRESS` or `UNRESOLVABLE_HOST`). It works on disabled
  subscriptions but does not re-enable them, so call `enable(id)` afterwards.
  The `last*` health fields come back `null`. Available on every plan.
- **`urlWarning`.** `WebhookSubscription` and `WebhookCreated` gain
  `urlWarning`: a string when the URL's host is a temporary tunnel or test host
  (trycloudflare, ngrok, webhook.site, loca.lt, serveo), otherwise `null`. It
  is a warning only.
- `webhooks.create()` now gets a 400 `INVALID_URL` for URLs over 500
  characters (API change).

## 1.8.0 — 2026-10-13

- **Webhooks.** New methods: `webhooks.enable(id)` (re-enable a subscription the
  system auto-disabled), `webhooks.test(id)` (send one synthetic delivery; a
  failed send comes back as `delivered: false` with an `error`, it does not
  throw), `webhooks.setAuthHeader(id, { name, value })` and
  `webhooks.deleteAuthHeader(id)` (resolves with no value on 204).
  `webhooks.create(url, eventTypes, { authHeader })` takes an optional custom
  header that is sent with every delivery. `WebhookSubscription` gains
  `isReadOnly`, `disabledAt`, `disabledReason`, `lastAttemptAt`,
  `lastSuccessAt`, `lastStatusCode`, `lastErrorClass` and `authHeaderName`, all
  nullable. The auth header value is write-only and never returned.
- **`verifyWebhook(rawBody, signatureHeader, secret)`.** Checks the
  `X-Insider-Signature: sha256=<hex>` header on a delivery, matching the Python
  SDK's `verify_webhook`. It is async (Web Crypto, constant-time compare), so
  `await` it. It runs in Node, browsers and edge runtimes.
- **Schedule 13D/13G.** New `client.ownership.schedule13dg()` for
  `GET /v1/ownership/13d-13g` (Business plan). The endpoint existed in the API
  but had no method because the `Ownership` tag was missing from the generator.
- **`transactions.list()` / `paginate()` filters.** Added `minReturn1d/1w/1m/3m/6m`,
  `maxReturn1d/1w/1m/3m/6m`, `hasReturns` (all Pro+), `instOwnershipTrend`
  (`"increasing" | "decreasing" | "stable"`), `role`
  (`"officer" | "director" | "ten_percent_owner"`) and `sort`
  (`"date" | "value"`). Returns are fractions (0.2 = +20%).
- **`Transaction` type** now includes `filedAt`, `return1d`, `return1w`,
  `return1m`, `return3m`, `return6m`, `valueQuality` and
  `institutionalOwnership`, which the API already returned.
- Fixed the `minValue` doc comment: it is available on every plan, not Pro+.
  `maxValue`, `minShares`, `maxShares` and the return filters are Pro+.
- Added `"engines": { "node": ">=18" }` to `package.json` to match the README.
- Regenerated `src/generated.ts` from the live spec (new `ListSchedule13DGParams`,
  `WebhookAuthHeaderRequest`, and `filedAt` on `TransactionResponse`; some
  endpoint descriptions updated).

## 1.7.0 — 2026-10-05

- **Congress date quality (backend insiderapi #330/#331).** Regenerated
  `src/generated.ts` from the live spec. On `CongressTradeDto` and
  `ConvergenceCongressLegDto`, `disclosureLagDays` narrows from `number` to
  `number | null`, and a new `dateQuality: string | null` is added. The
  source's own dates are sometimes impossible or implausible; when so,
  `disclosureLagDays` is `null` and `dateQuality` names the reason:
  `"transaction_after_disclosure"`, `"future_transaction_date"` or
  `"implausible_lag"` (a free-form string in the spec, not an enum, so it is
  typed `string` and new codes will not break a build). A null lag with a code
  means the filing's own dates are impossible; the raw `transactionDate` and
  `disclosureDate` are still returned and flagged rows are never dropped. On
  convergence legs `dateQuality` is always `null` in practice (flagged trades
  are excluded from convergence) but is modelled per the schema. A lag over 45
  days is not a legal finding. This is a **minor**, not a patch, because
  `disclosureLagDays` becoming nullable can break a build for code that does
  arithmetic on it without a null check. Webhook payloads
  (`CongressTradeFiled`, `ConvergenceSignal`) carry the same two fields in
  PascalCase (`DisclosureLagDays`, `DateQuality`); this SDK has no webhook
  payload types, so nothing to change there.
- The endpoint JSDoc for `congress.trades()` and `signals.convergence()`
  picks up the new descriptions, and the `webhooks.create()` `eventTypes`
  doc now notes `disclosureLagDays` is null when `dateQuality` is set. The
  `upgradeUrl` doc comment on the error body type is reworded (spec drift, no
  type change).

Also in this release (previously unreleased):

- New `client.search(q, { limit? })`: combined name search across
  companies (matched by ticker or name) and insiders (matched by name), for
  resolving free-text input to a specific ticker or CIK, e.g. a site search
  box. `q` must be 2-64 characters after trimming (the API returns 400
  `QUERY_TOO_SHORT` / `QUERY_TOO_LONG` otherwise); `limit` applies
  independently to each of the two result lists (default 8, max 20). Free
  tier, not plan-gated. Response types `SearchResponse` /
  `SearchCompanyResult` / `SearchInsiderResult` are spec-derived
  (`src/generated.ts`); the method itself is hand-written, and sits on the
  client rather than a resource, to match the Python SDK's
  `client.search(q, limit=...)`.

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
