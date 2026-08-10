// src/errors.ts
var InsiderApiError = class extends Error {
  statusCode;
  errorCode;
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.name = "InsiderApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
};
var AuthError = class extends InsiderApiError {
  constructor(message, errorCode = null) {
    super(message, 401, errorCode);
    this.name = "AuthError";
  }
};
var PlanError = class extends InsiderApiError {
  /** Minimum plan that unlocks the endpoint, e.g. "Business". */
  requiredPlan;
  /** The plan the calling key is currently on, e.g. "Free". */
  currentPlan;
  /** Where to upgrade. */
  upgradeUrl;
  constructor(message, requiredPlan, currentPlan, upgradeUrl) {
    super(message, 402, "PLAN_REQUIRED");
    this.name = "PlanError";
    this.requiredPlan = requiredPlan;
    this.currentPlan = currentPlan;
    this.upgradeUrl = upgradeUrl;
  }
};
var NotFoundError = class extends InsiderApiError {
  constructor(message, errorCode = null) {
    super(message, 404, errorCode);
    this.name = "NotFoundError";
  }
};
var RateLimitError = class extends InsiderApiError {
  retryAfter;
  constructor(message, retryAfter) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};

// src/generated.ts
function toQuery(params) {
  if (!params) return void 0;
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== void 0 && v !== null) out[k] = String(v);
  }
  return out;
}
var GeneratedCompaniesResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * List companies with a public ticker, sorted by name or total filings
   * Returns a single page of companies that have a tracked public ticker — for browsing or building a company picker, not for searching by name or CIK (there is no full-text search here; use GET /v1/companies/{ticker} to fetch one company by its exact ticker). Each entry includes the company's CIK, name, ticker, exchange, total filing count, and distinct insider count. There is no page parameter — this endpoint always returns the top `limit` companies by the chosen sort order. Not plan-gated.
   */
  async list(params) {
    return this.client._get(`/v1/companies`, toQuery(params));
  }
};
var GeneratedCongressResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Get one politician's congressional trading profile (Pro plan+)
   * Returns one politician's profile — identity fields, total/buy/sell trade counts, most recent trade's disclosure date, their top N most-traded tickers (by trade count), and their N most recent trades (same shape as GET /v1/congress/trades). Use this for a one-call politician overview rather than paging /v1/congress/trades?politician= yourself. Accepts either a bioguide ID (e.g. "P000197") or the politician's URL slug (e.g. "nancy-pelosi") in the path, matched case-insensitively against whichever field applies. Returns 404 NOT_FOUND if neither matches. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
   */
  async politician(idOrSlug, params) {
    return this.client._get(`/v1/congress/politicians/${encodeURIComponent(idOrSlug)}`, toQuery(params));
  }
  /**
   * Ranked rollup of politicians by congressional trade activity (Pro plan+)
   * Returns a paginated list of politicians who have at least one non-superseded congressional trade, each with total/buy/sell counts (sells include both Sale and PartialSale; Exchange trades count only toward total) and their most recent trade's disclosure date. Ordered by total trade count descending, ties broken by most recently disclosed. Use this to discover active traders; for one politician's full profile (including their most-traded tickers and recent trades) use GET /v1/congress/politicians/{idOrSlug}. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
   */
  async politicians(params) {
    return this.client._get(`/v1/congress/politicians`, toQuery(params));
  }
  /**
   * Which politicians traded a ticker, with net buy/sell counts (Pro plan+)
   * Returns every politician who has a non-superseded congressional trade in the given ticker, each with their trade/buy/sell counts, plus ticker-level totals. Optional window_days restricts to trades with a transactionDate in the trailing N days; omit for all-time. A ticker with no congress trades returns 200 with an empty politicians array and zero counts rather than 404 — there is no separate ticker/company entity in this dataset to 404 against. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
   */
  async ticker(ticker, params) {
    return this.client._get(`/v1/congress/tickers/${encodeURIComponent(ticker)}`, toQuery(params));
  }
  /**
   * Query congressional STOCK Act trades (Free+, plan-clamped disclosure window)
   * Returns a paginated JSON list of congressional periodic-transaction-report trades, most recently DISCLOSED first, with non-superseded rows only (amended-away rows never appear). PLAN-CLAMPED WINDOW: this endpoint is open to every plan, but how far back you can see is clamped on disclosureDate — Free sees only trades disclosed in the last 30 days, Starter the last 366 days, Pro/Business/Enterprise unlimited history. Passing an older disclosure_date_from than your plan allows does not extend the window — the floor always wins. Filters: ticker, politician (bioguideId, exact), party (free-text, case-insensitive exact match — not a fixed enum), chamber (House|Senate), state (2-letter code), transaction_type (purchase|sale|partial_sale|exchange), min_amount (range-aware — matches AmountLow >= value, never a fabricated midpoint), transaction_date_from/to, disclosure_date_from/to. Every row always carries BOTH amountLow and amountHigh (STOCK Act discloses ranges, never exact figures) and disclosureLagDays = (disclosureDate - transactionDate) — the STOCK Act allows up to 45 days of lag, so "real-time" here means minutes-after-disclosure, not minutes-after-trade. For per-politician or per-ticker rollups use GET /v1/congress/politicians, /v1/congress/politicians/{idOrSlug}, or /v1/congress/tickers/{ticker} (all Pro+). Query runs live against the database — no caching.
   */
  async trades(params) {
    return this.client._get(`/v1/congress/trades`, toQuery(params));
  }
};
var GeneratedDataQualityResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Public data-quality, freshness and coverage metrics for the whole dataset
   * Returns public, keyless metrics on data freshness, ingestion latency, corpus coverage, and post-trade returns coverage — use this to check whether the dataset is current before relying on it (e.g. confirm Form 4 ingestion isn't stalled, or that price data isn't stale), not to look up any single company, insider, or transaction. Includes: most recent Form 4 processed timestamp and median/p95 filing-accepted-to-processed latency in seconds, latest price-bar date and how many days behind it is, total companies/transactions tracked plus filing counts by form type (4, 144, 13F-HR), the percentage of 13F CUSIPs resolved to a ticker, and the percentage of eligible transactions with fully computed post-trade returns. Takes no parameters. Cached for 30 minutes; no API key or plan required.
   */
  async get() {
    return this.client._get(`/v1/data-quality`);
  }
};
var GeneratedFilingsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Get a single Form 4 filing by its exact SEC accession number
   * Returns one filing's metadata — accession number, company ticker/name, period of report, filed date, amendment type (Original/Amendment), and the count of non-superseded transactions it contains. Use this to look up a specific filing you already have the accession number for (e.g. from GET /v1/filings/recent or GET /v1/transactions); it does not return the individual transaction rows themselves — pull those via GET /v1/transactions filtered by ticker/cik and date. Returns 404 NOT_FOUND if the accession number isn't tracked. Not plan-gated. Query runs live against the database — no caching.
   */
  async get(accession) {
    return this.client._get(`/v1/filings/${encodeURIComponent(accession)}`);
  }
  /**
   * Get the most recently filed Form 4s, optionally filtered by ticker
   * Returns the most recently filed Form 4s across all companies, newest first, optionally restricted to a single ticker. Use this to monitor new insider activity as it's ingested (e.g. a live "latest filings" feed) rather than for historical or bulk queries — for date-range or filter-heavy queries use GET /v1/transactions with from/to instead. Each entry includes the accession number, company ticker/name, period of report, filed date, amendment type, and the count of non-superseded transactions in that filing. There is no page parameter — this always returns the newest per_page filings, not an arbitrary offset. Not plan-gated.
   */
  async recent(params) {
    return this.client._get(`/v1/filings/recent`, toQuery(params));
  }
};
var GeneratedForm144Resource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * List Form 144 'notice of proposed sale' filings (Business plan+)
   * Returns a paginated list of Form 144 notices — an insider's SEC filing declaring intent to sell restricted/control stock, filed BEFORE the actual sale (which later shows up as a Form 4 TransactionCode=S, typically ~2 days after). Use this as a leading indicator of upcoming insider selling; the isUnder10b5Plan flag on each row separates pre-scheduled 10b5-1 disposals from discretionary intent. Each row includes accession number, ticker/company, insider name/relationship, broker, shares proposed, aggregate market value, approximate sale date, exchange, and filed/notice dates. For a bulk historical pull use GET /v1/form144/export instead. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching.
   */
  async list(params) {
    return this.client._get(`/v1/form144`, toQuery(params));
  }
};
var GeneratedHoldingsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * List institutional holdings from Form 13F-HR (Business plan+)
   * Returns a paginated list of individual position rows from Form 13F-HR institutional holdings reports (quarterly disclosures by managers with $100M+ AUM), most recent report period and highest value first. Each row includes the manager name/CIK, report period, issuer name/ticker, CUSIP, security class, position value and share count, share/voting authority type, and the source filing's accession number and filed date. A single security can appear multiple times per manager when sub-managers each report it separately (e.g. Berkshire's subsidiaries). Use GET /v1/managers instead when you want one row per manager (their latest filing + total AUM) rather than position-level detail. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching; 13F data itself is inherently quarter-lagged (SEC filing deadline is 45 days after quarter end).
   */
  async list(params) {
    return this.client._get(`/v1/holdings`, toQuery(params));
  }
  /**
   * List institutional managers with their latest 13F-HR (Business plan+)
   * Returns one row per institutional manager (13F filer), summarising their MOST RECENT 13F-HR filing — manager name/CIK, report period, total reported position value (AUM) and entry count, filed date, and accession number — ranked by AUM descending. Use this for manager-level discovery ("who are the biggest 13F filers?", "rank Apple's institutional holders") before drilling into position detail via GET /v1/holdings?manager_cik=. Amended (IsAmendment=true) filings are excluded from the 'latest' pick. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching; 13F data is inherently quarter-lagged (SEC deadline is 45 days after quarter end).
   */
  async managers(params) {
    return this.client._get(`/v1/managers`, toQuery(params));
  }
};
var GeneratedInsidersResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
     * Ranked leaderboard of insiders by buy track-record (Business plan+)
     * Returns the top insiders ranked by historical buy performance — same scored-buy methodology as
  GET /v1/insiders/{cik}/scorecard, applied across the whole corpus rather than one insider. Use
  this to discover which insiders have the best track record; use the per-insider scorecard once
  you have a specific CIK. Scores use absolute return (NOT market-adjusted) — a hit is a scored
  buy with a positive 3m (or 6m) return anchored at the filing-date close. Only discretionary
  open-market buys (P-code, not 10b5-1, not derivative) with a matured return are counted.
  Insiders with fewer than min_trades (floor 5) scored buys are excluded. Requires Business plan
  or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Results are cached for 1 hour per unique
  parameter combination.
     */
  async leaderboard(params) {
    return this.client._get(`/v1/insiders/leaderboard`, toQuery(params));
  }
  /**
   * Search insiders (officers, directors, 10% owners) by name
   * Searches insiders by name and returns a paginated list of matches with each insider's CIK, title, director/officer/10%-owner flags, and total filing count. Use this to resolve a person's name to their CIK before fetching their transaction history, career summary, or scorecard — the CIK returned here feeds directly into GET /v1/insiders/{cik}/transactions, /summary, and /scorecard. Omitting the name filter returns insiders in alphabetical order rather than performing a search. Not plan-gated — available on the Free tier.
   */
  async list(params) {
    return this.client._get(`/v1/insiders`, toQuery(params));
  }
  /**
     * Get insider buy track-record scorecard (Pro plan+)
     * Returns the historical hit rate and average/median return of an insider's discretionary
  open-market buys (TransactionCode=P, excluding 10b5-1 plans and derivatives), plus their best
  and worst scored buy. Scores use absolute return (NOT market-adjusted) anchored at the
  filing-date close. A 'hit' is a scored buy whose 3m (or 6m) return is positive. Use this over
  GET /v1/insiders/{cik}/summary when you specifically want a scored track record (with a
  sample-sufficiency guard) rather than raw totals; use GET /v1/insiders/leaderboard (Business+)
  to rank many insiders by this same methodology. Score fields (hitRate3m, avgReturn3m, etc.) are
  null when the insider has fewer than 5 matured scored buys (sampleSufficient=false), preventing
  misleading statistics from small samples. Requires Pro plan or higher (402 PLAN_REQUIRED on
  Free/Starter). Returns 404 NOT_FOUND if the CIK isn't tracked. Computed live — no caching.
  Note: all return fields (HitRate3m, AvgReturn3m, MedianReturn3m, etc.) are stored
  as FRACTIONS — 0.05 means +5%, -0.10 means -10%.
     */
  async scorecard(cik) {
    return this.client._get(`/v1/insiders/${encodeURIComponent(cik)}/scorecard`);
  }
  /**
     * Get aggregate career summary for an insider (Pro plan+)
     * Aggregate career roll-up for a single insider: first/last transaction dates, total transactions,
  total bought/sold/net USD, transaction-code breakdown (P/S/F/M/A/G/other counts), the top 10
  companies traded (by activity), the 10b5-1 vs discretionary split, and average post-trade returns
  across discretionary open-market (non-10b5-1) buy/sell trades. Use this for a one-call career
  overview rather than paging through GET /v1/insiders/{cik}/transactions yourself; for a scored
  hit-rate track record on buys specifically, use GET /v1/insiders/{cik}/scorecard instead.
  Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Returns 404 NOT_FOUND if the CIK
  isn't tracked. Computed live from current data — no caching. Note: all return fields (AvgReturn1d,
  AvgReturn1w, etc.) are stored as FRACTIONS — 0.05 means +5%.
     */
  async summary(cik) {
    return this.client._get(`/v1/insiders/${encodeURIComponent(cik)}/summary`);
  }
};
var GeneratedSignalsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Insider cluster-buy x congressional-purchase convergence (Pro plan+)
   * Returns the tickers where an insider cluster-buy (InsiderSignal.IsClusterBuy) and at least one non-superseded congressional PURCHASE happened within window_days of EACH OTHER, restricted to convergences where the MORE RECENT of the pair's two dates is within a trailing lookback_days (so this surfaces CURRENT convergences, not ancient history). DEFINITION: for each result, insider.signalDate is the SignalDate of the qualifying cluster-buy signal with the most recent date (insider.insiderCount is that same signal's count — never summed or maxed across multiple signals), and congress is every non-superseded congressional purchase that paired with at least one qualifying cluster-buy (not every purchase in the window — only the ones that actually paired). firstSeen/lastSeen are the earliest/most recent dates among all qualifying insider and congress dates for that ticker. STRENGTH is documented arithmetic, NOT a black-box or predictive/ML score: strength = (distinct congressional purchasers among the qualifying legs) x (the representative signal's insiderCount) — a plain multiplication of two observed counts, nothing more. HONESTY: every congress leg always carries both amountLow and amountHigh (STOCK Act discloses ranges, never exact figures — never combined into a fabricated midpoint) and disclosureLagDays = (disclosureDate - transactionDate); congressional trades are disclosed up to 45 days after the actual trade under the STOCK Act, so this endpoint is detection/monitoring of what insiders AND members of Congress have DISCLOSED buying, not a claim of predictive edge, alpha, or win rate — no performance numbers are computed or implied anywhere in this response. window_days and lookback_days are both caller-overridable with clamps (see each parameter's own description for the exact bounds). Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live against the database — no caching.
   */
  async convergence(params) {
    return this.client._get(`/v1/signals/convergence`, toQuery(params));
  }
  /**
   * Explain why a signal fired: the insiders and trades counted, what was excluded, and the criteria (Business plan+)
   * Reconstructs the full evidence behind one company's insider signal from GET /v1/signals: the detection criteria (5-day cluster window, 3-insider threshold, 90-day ratio window, 10b5-1 exclusion), the list of cluster buyers and sellers (each with their role and individual trades in the window), trades that were excluded from the cluster count and why (10b5-1 plan or superseded by amendment), and the raw buy/sell share totals behind the 90-day ratio. Use this to audit or debug a specific signal rather than to scan many companies (use GET /v1/signals for that). This is a LIVE reconstruction from current non-superseded data, computed on every request (no caching) — it can differ slightly from the originally stored signal if trades were amended afterward. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Returns 404 COMPANY_NOT_FOUND if the ticker isn't tracked, 404 SIGNAL_NOT_FOUND if no signal exists for the given/most-recent date, or 400 INVALID_DATE if `date` isn't YYYY-MM-DD.
   */
  async explain(ticker, params) {
    return this.client._get(`/v1/signals/${encodeURIComponent(ticker)}/explain`, toQuery(params));
  }
  /**
   * Monthly insider sentiment score for a ticker (Business plan+)
   * Returns a monthly time series of an MSPR-style insider sentiment score for one company: for each month, (buyValue - sellValue) / (buyValue + sellValue) * 100, alongside the raw buy/sell USD totals and trade counts. Only open-market P/S trades are counted, and — unlike Finnhub's MSPR — 10b5-1 plan trades and derivative transactions are excluded, so the score reflects discretionary conviction rather than pre-scheduled or compensation-driven activity. Use this for a trend view of buying/selling pressure over time; for a single point-in-time cluster/ratio snapshot use GET /v1/signals instead. Score is on a -100 (all selling) to +100 (all buying) scale — NOT a fraction, unlike the return fields on other endpoints. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Returns 404 NOT_FOUND if the ticker isn't tracked. Cached for 60 seconds per (ticker, months) combination.
   */
  async sentiment(ticker, params) {
    return this.client._get(`/v1/signals/sentiment/${encodeURIComponent(ticker)}`, toQuery(params));
  }
};
var GeneratedStatsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Public corpus-wide statistics — no API key required
   * Returns headline dataset totals: filing count, transaction count, tracked companies, institutional holdings rows, Form 144 and Form 13F-HR filing counts, the earliest filing date in the corpus, the most recent quarter's total 13F-HR reported AUM in USD, and measured ingestion latency (median/p95 seconds from SEC acceptance to our processing, trailing 7 days). Use this for corpus-wide totals (e.g. a marketing/status widget), not for per-company or per-insider data — those live under GET /v1/companies and GET /v1/insiders. For freshness and coverage-quality metrics (is ingestion stalled, is price data stale) use GET /v1/data-quality instead. Takes no parameters. No API key or plan required. Cached for ~12 hours.
   */
  async get() {
    return this.client._get(`/v1/stats`);
  }
};
var GeneratedStatusResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  /**
   * Measured uptime history for the public status page — trailing 90-day daily breakdown
   * Returns a daily breakdown of measured API uptime over a trailing 90-day window, computed from an internal heartbeat probe that runs every 5 minutes and performs the same DB-connectivity check as GET /health/ready. Each day in the `days` array reports the number of 5-minute slots expected to have elapsed (288 for a complete past day, pro-rated for the feature's first day and for today's partial day), how many of those slots recorded a healthy heartbeat, and the resulting uptime percentage for that day — plus an overall percentage (`overallPct`) across the whole window. `start` is the earliest date included: either the date of the very first heartbeat ever recorded, or 89 days before today once more than 90 days of history exist. Days before that are never returned. Use this to render an uptime history / status bar; for live corpus freshness use GET /v1/data-quality instead. Takes no parameters. Cached for ~5 minutes; no API key or plan required.
   */
  async history() {
    return this.client._get(`/v1/status/history`);
  }
};

// src/resources/companies.ts
var CompaniesResource = class extends GeneratedCompaniesResource {
  constructor(client) {
    super(client);
  }
  async get(ticker) {
    return this.client._get(`/v1/companies/${ticker}`);
  }
  async insiders(ticker) {
    return this.client._get(`/v1/companies/${ticker}/insiders`);
  }
};

// src/resources/insiders.ts
var InsidersResource = class extends GeneratedInsidersResource {
  constructor(client) {
    super(client);
  }
  async get(cik) {
    return this.client._get(`/v1/insiders/${cik}`);
  }
  async transactions(cik, params = {}) {
    const q = {};
    if (params.from !== void 0) q["from"] = params.from;
    if (params.to !== void 0) q["to"] = params.to;
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 50);
    return this.client._get(`/v1/insiders/${cik}/transactions`, q);
  }
};

// src/resources/signals.ts
var SignalsResource = class extends GeneratedSignalsResource {
  constructor(client) {
    super(client);
  }
  async list(params = {}) {
    const q = {};
    if (params.ticker !== void 0) q["ticker"] = params.ticker;
    if (params.clusterBuy !== void 0) q["cluster_buy"] = String(params.clusterBuy);
    if (params.clusterSell !== void 0) q["cluster_sell"] = String(params.clusterSell);
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 100);
    return this.client._get("/v1/signals", q);
  }
  async *paginate(params = {}) {
    let page = 1;
    const perPage = params.perPage ?? 100;
    while (true) {
      const batch = await this.list({ ...params, page, perPage });
      if (batch.length === 0) break;
      yield batch;
      if (batch.length < perPage) break;
      page++;
    }
  }
};

// src/resources/transactions.ts
var TransactionsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  async list(params = {}) {
    const q = {};
    if (params.ticker !== void 0) q["ticker"] = params.ticker;
    if (params.cik !== void 0) q["cik"] = params.cik;
    if (params.insiderCik !== void 0) q["insider_cik"] = params.insiderCik;
    if (params.code !== void 0) q["code"] = params.code;
    if (params.from !== void 0) q["from"] = params.from;
    if (params.to !== void 0) q["to"] = params.to;
    if (params.exclude10b5 !== void 0) q["exclude_10b5"] = String(params.exclude10b5);
    if (params.codes !== void 0) q["codes"] = params.codes;
    if (params.excludeCodes !== void 0) q["exclude_codes"] = params.excludeCodes;
    if (params.category !== void 0) q["category"] = params.category;
    if (params.excludeCategory !== void 0) q["exclude_category"] = params.excludeCategory;
    if (params.excludeDerivative !== void 0) q["exclude_derivative"] = String(params.excludeDerivative);
    if (params.significant !== void 0) q["significant"] = String(params.significant);
    if (params.minValue !== void 0) q["min_value"] = String(params.minValue);
    if (params.maxValue !== void 0) q["max_value"] = String(params.maxValue);
    if (params.minShares !== void 0) q["min_shares"] = String(params.minShares);
    if (params.maxShares !== void 0) q["max_shares"] = String(params.maxShares);
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 50);
    return this.client._get("/v1/transactions", q);
  }
  async *paginate(params = {}) {
    let page = 1;
    const perPage = params.perPage ?? 50;
    while (true) {
      const batch = await this.list({ ...params, page, perPage });
      if (batch.length === 0) break;
      yield batch;
      if (batch.length < perPage) break;
      page++;
    }
  }
};

// src/resources/webhooks.ts
var WebhooksResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  async create(url, eventTypes) {
    return this.client._post("/v1/webhooks", { url, eventTypes });
  }
  async list() {
    return this.client._get("/v1/webhooks");
  }
  async delete(subscriptionId) {
    return this.client._delete(`/v1/webhooks/${subscriptionId}`);
  }
  async events(params = {}) {
    const q = {};
    if (params.since !== void 0) q["since"] = params.since;
    return this.client._get("/v1/webhooks/events", q);
  }
};

// src/version.ts
var SDK_VERSION = "1.2.0";

// src/client.ts
var DEFAULT_BASE_URL = "https://api.form4api.com";
var RETRY_DELAYS_MS = [500, 1e3, 2e3];
var USER_AGENT = `form4api-js/${SDK_VERSION}`;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var Form4ApiClient = class {
  baseUrl;
  apiKey;
  maxRetries;
  timeout;
  transactions;
  insiders;
  companies;
  signals;
  webhooks;
  congress;
  filings;
  form144;
  holdings;
  stats;
  status;
  dataQuality;
  constructor({
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    maxRetries = 2,
    timeout = 3e4
  }) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.maxRetries = maxRetries;
    this.timeout = timeout;
    this.transactions = new TransactionsResource(this);
    this.insiders = new InsidersResource(this);
    this.companies = new CompaniesResource(this);
    this.signals = new SignalsResource(this);
    this.webhooks = new WebhooksResource(this);
    this.congress = new GeneratedCongressResource(this);
    this.filings = new GeneratedFilingsResource(this);
    this.form144 = new GeneratedForm144Resource(this);
    this.holdings = new GeneratedHoldingsResource(this);
    this.stats = new GeneratedStatsResource(this);
    this.status = new GeneratedStatusResource(this);
    this.dataQuality = new GeneratedDataQualityResource(this);
  }
  // ── internal request helpers ───────────────────────────────────────────────
  async _get(path, params) {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await this._fetch("GET", url.toString());
    return this._parse(res);
  }
  async _post(path, body) {
    const res = await this._fetch("POST", this.baseUrl + path, body);
    return this._parse(res);
  }
  async _delete(path) {
    const res = await this._fetch("DELETE", this.baseUrl + path);
    if (!res.ok && res.status !== 204) {
      await this._throwError(res);
    }
  }
  // Executes a fetch with timeout and retry on network errors / 5xx.
  // 4xx responses are returned immediately without retry.
  async _fetch(method, url, body) {
    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2e3);
      }
      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(new Error("Request timed out")),
        this.timeout
      );
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "X-Api-Key": this.apiKey,
            "User-Agent": USER_AGENT,
            ...body !== void 0 ? { "Content-Type": "application/json" } : {}
          },
          body: body !== void 0 ? JSON.stringify(body) : void 0,
          signal: controller.signal
        });
        if (res.status < 500) return res;
        if (attempt === this.maxRetries) return res;
        lastError = new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (attempt === this.maxRetries) throw err;
        lastError = err;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }
  async _parse(res) {
    if (res.ok) {
      return res.json();
    }
    await this._throwError(res);
    throw new Error("unreachable");
  }
  async _throwError(res) {
    let body = {};
    try {
      body = await res.json();
    } catch {
    }
    const error = body["error"] ?? {};
    const code = error["code"] ?? null;
    const message = error["message"] ?? `HTTP ${res.status}`;
    switch (res.status) {
      case 401:
        throw new AuthError(message, code);
      case 402: {
        const required = error["requiredPlan"] ?? void 0;
        const current = error["currentPlan"] ?? void 0;
        const upgradeUrl = error["upgradeUrl"] ?? void 0;
        throw new PlanError(message, required, current, upgradeUrl);
      }
      case 404:
        throw new NotFoundError(message, code);
      case 429: {
        const retryAfter = res.headers.get("Retry-After");
        throw new RateLimitError(
          message,
          retryAfter !== null ? parseInt(retryAfter, 10) : void 0
        );
      }
      default:
        throw new InsiderApiError(message, res.status, code);
    }
  }
};
export {
  AuthError,
  Form4ApiClient,
  GeneratedCompaniesResource,
  GeneratedCongressResource,
  GeneratedDataQualityResource,
  GeneratedFilingsResource,
  GeneratedForm144Resource,
  GeneratedHoldingsResource,
  GeneratedInsidersResource,
  GeneratedSignalsResource,
  GeneratedStatsResource,
  GeneratedStatusResource,
  InsiderApiError,
  NotFoundError,
  PlanError,
  RateLimitError
};
