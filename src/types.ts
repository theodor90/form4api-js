import type { InstitutionalOwnershipDto } from "./generated.js";

export interface Transaction {
  ticker: string;
  companyName: string;
  insiderName: string;
  insiderCik: string;
  insiderTitle: string | null;
  isDirector: boolean;
  isOfficer: boolean;
  is10PctOwner: boolean;
  accessionNumber: string;
  securityTitle: string;
  transactionCode: string;
  isOpenMarket: boolean;
  is10b5Plan: boolean;
  sharesAmount: number;
  pricePerShare: number | null;
  totalValue: number | null;
  sharesOwnedAfter: number | null;
  directIndirect: string | null;
  isDerivative: boolean;
  transactionDate: string;
  periodOfReport: string;
  /** Precise UTC SEC-acceptance instant, nullable. */
  acceptedAt: string | null;
  /** Public SEC document URL. */
  documentUrl: string;
  /** When the filing became public on EDGAR (Filing.FiledAt). */
  filedAt: string;
  /** Post-trade returns as FRACTIONS (0.109 = +10.9%). Null until that horizon is computed. */
  return1d: number | null;
  return1w: number | null;
  return1m: number | null;
  return3m: number | null;
  return6m: number | null;
  /** Set when the price or value looks implausible; null otherwise. */
  valueQuality: "ImplausiblePrice" | "ImplausibleValue" | null;
  /** Institutional (13F) ownership context for the company. May be absent. */
  institutionalOwnership?: InstitutionalOwnershipDto;
}

export interface Insider {
  cik: string;
  name: string;
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  officerTitle: string | null;
  totalFilings: number;
}

export interface Company {
  cik: string;
  name: string;
  ticker: string | null;
  exchange: string | null;
  totalFilings: number;
  activeInsiders: number;
  sicDescription: string | null;
  stateOfIncorporation: string | null;
  website: string | null;
}

export interface InsiderSignal {
  ticker: string | null;
  companyName: string;
  signalDate: string;
  buySellRatio: number;
  isClusterBuy: boolean;
  isClusterSell: boolean;
  insiderCount: number;
}

/** One custom HTTP header sent with every webhook delivery. The value is write-only; the API never returns it. */
export interface WebhookAuthHeader {
  /** HTTP header name, 1-64 token characters. Reserved names (Host, Content-Type, Cookie, X-Insider-*, ...) are rejected. */
  name: string;
  /** Header value, 1-1024 printable ASCII characters. */
  value: string;
}

export interface WebhookCreated {
  subscriptionId: number;
  url: string;
  eventTypes: string[];
  secret: string;
  createdAt: string;
  warning: string | null;
  /** True for Free-plan subscriptions (informational; events are still delivered). */
  isReadOnly?: boolean;
  /** Name of the custom auth header, if one was set. The value is never returned. */
  authHeaderName?: string | null;
  /** Set when the URL's host is a temporary tunnel or test host (ngrok, trycloudflare, webhook.site, ...); null otherwise. A warning only; the subscription is created either way. */
  urlWarning?: string | null;
}

export interface WebhookSubscription {
  subscriptionId: number;
  url: string;
  eventTypes: string[];
  createdAt: string;
  isActive: boolean;
  /** True for Free-plan subscriptions (informational; events are still delivered). */
  isReadOnly: boolean | null;
  /** When the subscription was disabled; null while active. */
  disabledAt: string | null;
  /** Why it was disabled, e.g. "delivery_failures"; null while active. */
  disabledReason: string | null;
  /** When the most recent delivery attempt finished; null if none yet. */
  lastAttemptAt: string | null;
  /** When the most recent 2xx attempt finished. */
  lastSuccessAt: string | null;
  /** HTTP status of the most recent attempt; null when no response was received. */
  lastStatusCode: number | null;
  /** Why the most recent attempt failed (HTTP_4XX, HTTP_5XX, TIMEOUT, DNS, TLS, ...); null if it succeeded or none made. */
  lastErrorClass: string | null;
  /** Name of the custom auth header sent with deliveries; null if none. The value is never returned. */
  authHeaderName: string | null;
  /** Set when the URL's host is a temporary tunnel or test host (ngrok, trycloudflare, webhook.site, ...); null otherwise. A warning only. */
  urlWarning: string | null;
}

export interface WebhookEnableResult {
  subscriptionId: number;
  isActive: boolean;
}

export interface WebhookTestResult {
  delivered: boolean;
  /** HTTP status from the receiver; 0 when no response was received. */
  statusCode: number;
  durationMs: number;
  /** Null on a normal send; otherwise INSECURE_URL, PRIVATE_ADDRESS, UNRESOLVABLE_HOST or NETWORK_ERROR. */
  error: string | null;
}

export interface WebhookAuthHeaderResult {
  subscriptionId: number;
  authHeaderName: string;
}

export interface WebhookEvent {
  deliveryId: number;
  subscriptionId: number;
  eventType: string;
  attemptCount: number;
  deliveredAt: string | null;
  nextRetryAt: string | null;
  lastStatusCode: number | null;
  isDead: boolean;
  payload: string;
}

export interface CreatedKey {
  key: string;
  plan: string;
  message: string;
}

// ── request param shapes ──────────────────────────────────────────────────────

export interface TransactionListParams {
  /** Ticker symbol, case-insensitive. Also accepts a comma-separated list of up to 25 symbols, e.g. "AAPL,MSFT", to match any of them in one call. */
  ticker?: string;
  cik?: string;
  insiderCik?: string;
  code?: string;
  /** Start date, inclusive (YYYY-MM-DD). Filters on transactionDate. */
  from?: string;
  /** End date, inclusive (YYYY-MM-DD). Filters on transactionDate. */
  to?: string;
  /** Inclusive start of the filed-date window (YYYY-MM-DD). Filters on Filing.FiledAt (when the filing became public), not transactionDate. */
  filedFrom?: string;
  /** Inclusive end of the filed-date window (YYYY-MM-DD). Filters on Filing.FiledAt. */
  filedTo?: string;
  exclude10b5?: boolean;
  /** Comma-separated transaction codes to include, e.g. "P,S". */
  codes?: string;
  /** Comma-separated transaction codes to exclude, e.g. "A,M,F,G". */
  excludeCodes?: string;
  /** Include only one category: open_market | grants | derivatives | gifts | other. */
  category?: string;
  /** Exclude an entire category, e.g. "derivatives". */
  excludeCategory?: string;
  /** Drop derivative-security rows. */
  excludeDerivative?: boolean;
  /** Preset: open-market only, no 10b5-1 plans, no derivatives. */
  significant?: boolean;
  /** Minimum trade value in USD (shares × price). Available on every plan. */
  minValue?: number;
  /** Maximum trade value in USD. Pro plan or higher. */
  maxValue?: number;
  /** Minimum number of shares. Pro plan or higher. */
  minShares?: number;
  /** Maximum number of shares. Pro plan or higher. */
  maxShares?: number;
  /** Pro+ only. Minimum post-trade return as a FRACTION (0.2 = +20%). Rows with no computed return for that horizon are excluded. */
  minReturn1d?: number;
  maxReturn1d?: number;
  minReturn1w?: number;
  maxReturn1w?: number;
  minReturn1m?: number;
  maxReturn1m?: number;
  minReturn3m?: number;
  maxReturn3m?: number;
  minReturn6m?: number;
  maxReturn6m?: number;
  /** Pro+ only. true: only rows with all five return horizons computed; false: only rows missing at least one. */
  hasReturns?: boolean;
  /** Trailing quarter-over-quarter trend in institutional (13F) ownership of the company. */
  instOwnershipTrend?: "increasing" | "decreasing" | "stable";
  /** Filter by the insider's role. */
  role?: "officer" | "director" | "ten_percent_owner";
  /** Result ordering: "date" (default, newest transaction first) or "value" (largest first, applied before pagination). */
  sort?: "date" | "value";
  page?: number;
  /** Results per page (canonical). The backend also accepts a `limit` alias, but `perPage` is the name this SDK sends. */
  perPage?: number;
}

export interface InsiderTransactionParams {
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export interface SignalListParams {
  ticker?: string;
  clusterBuy?: boolean;
  clusterSell?: boolean;
  page?: number;
  perPage?: number;
}

export interface WebhookEventParams {
  since?: string;
}

export interface SearchParams {
  /** Maximum number of results per section (companies, insiders), applied independently to each. Defaults to 8, clamped to 1-20. */
  limit?: number;
}

// ── pagination ────────────────────────────────────────────────────────────────

export interface PaginateOptions {
  /**
   * Stop after yielding this many pages, even if more data is available.
   * Default: unbounded — `paginate()` keeps requesting pages until the API
   * returns a short/empty page or (since the backend's 2026-08-01 plan-gated
   * pagination depth) rejects the next page with a `PaginationLimitError`.
   * Set this to give a script a deterministic stopping point without relying
   * on hitting the plan's depth limit.
   */
  maxPages?: number;
}
