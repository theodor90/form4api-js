interface Transaction {
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
}
interface Insider {
    cik: string;
    name: string;
    isDirector: boolean;
    isOfficer: boolean;
    isTenPercentOwner: boolean;
    officerTitle: string | null;
    totalFilings: number;
}
interface Company {
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
interface InsiderSignal {
    ticker: string | null;
    companyName: string;
    signalDate: string;
    buySellRatio: number;
    isClusterBuy: boolean;
    isClusterSell: boolean;
    insiderCount: number;
}
interface WebhookCreated {
    subscriptionId: number;
    url: string;
    eventTypes: string[];
    secret: string;
    createdAt: string;
    warning: string | null;
}
interface WebhookSubscription {
    subscriptionId: number;
    url: string;
    eventTypes: string[];
    createdAt: string;
    isActive: boolean;
}
interface WebhookEvent {
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
interface CreatedKey {
    key: string;
    plan: string;
    message: string;
}
interface TransactionListParams {
    ticker?: string;
    cik?: string;
    insiderCik?: string;
    code?: string;
    from?: string;
    to?: string;
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
    /** Minimum trade value in USD (shares × price). Pro plan or higher. */
    minValue?: number;
    /** Maximum trade value in USD. Pro plan or higher. */
    maxValue?: number;
    /** Minimum number of shares. Pro plan or higher. */
    minShares?: number;
    /** Maximum number of shares. Pro plan or higher. */
    maxShares?: number;
    page?: number;
    perPage?: number;
}
interface InsiderTransactionParams {
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
}
interface SignalListParams {
    ticker?: string;
    clusterBuy?: boolean;
    clusterSell?: boolean;
    page?: number;
    perPage?: number;
}
interface WebhookEventParams {
    since?: string;
}
interface PaginateOptions {
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

interface AmendmentMetrics {
    supersededTransactions: number;
}
interface ClusterInsiderEntry {
    insiderCik: string;
    insiderName: string;
    role: string | null;
    trades: ClusterTradeEntry[];
}
interface ClusterTradeEntry {
    transactionDate: string;
    code: string;
    shares: number;
    pricePerShare: number | null;
    value: number | null;
}
interface CompanyResponse {
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
interface CongressPoliticianProfileResponse {
    bioguideId: string | null;
    slug: string;
    fullName: string;
    party: string | null;
    chamber: string;
    state: string;
    totalTrades: number;
    buys: number;
    sells: number;
    lastTradeDisclosedAt: string | null;
    topTickers: CongressTickerCountDto[];
    recentTrades: CongressTradeDto[];
}
interface CongressPoliticianRefDto {
    bioguideId: string | null;
    slug: string;
    fullName: string;
    party: string | null;
    chamber: string;
    state: string;
}
interface CongressPoliticianRollupDto {
    bioguideId: string | null;
    slug: string;
    fullName: string;
    party: string | null;
    chamber: string;
    state: string;
    totalTrades: number;
    buys: number;
    sells: number;
    lastTradeDisclosedAt: string | null;
}
interface CongressTickerCountDto {
    ticker: string;
    tradeCount: number;
}
interface CongressTickerPoliticianEntryDto {
    bioguideId: string | null;
    slug: string;
    fullName: string;
    party: string | null;
    chamber: string;
    state: string;
    tradeCount: number;
    buys: number;
    sells: number;
}
interface CongressTickerRollupResponse {
    ticker: string;
    totalTrades: number;
    buys: number;
    sells: number;
    politicians: CongressTickerPoliticianEntryDto[];
}
interface CongressTradeDto {
    politician: CongressPoliticianRefDto;
    ticker: string | null;
    assetName: string;
    assetType: string;
    ownerType: string;
    transactionType: string;
    amountLow: number | null;
    amountHigh: number | null;
    transactionDate: string;
    disclosureDate: string;
    disclosureLagDays: number;
}
interface ConvergenceCongressLegDto {
    bioguideId: string | null;
    fullName: string;
    party: string | null;
    transactionType: string;
    amountLow: number | null;
    amountHigh: number | null;
    transactionDate: string;
    disclosureDate: string;
    disclosureLagDays: number;
}
interface ConvergenceEntryDto {
    ticker: string;
    companyName: string | null;
    insider: ConvergenceInsiderSideDto;
    congress: ConvergenceCongressLegDto[];
    firstSeen: string;
    lastSeen: string;
    strength: number;
}
interface ConvergenceInsiderSideDto {
    insiderCount: number;
    signalDate: string;
}
interface CorpusStats {
    filings: number;
    transactions: number;
    companies: number;
    holdings: number;
    form144Filings: number;
    form13FFilings: number;
    historyStart: string | null;
    latestQuarterAum: number;
    ingestionLatency: IngestionLatencyStats;
}
interface CoverageMetrics {
    companiesTracked: number;
    transactionsTotal: number;
    form4Filings: number;
    form144Filings: number;
    form13FFilings: number;
    tickersWithPriceData: number;
    cusipResolvedPct: number | null;
}
interface CreateKeyRequest {
    /** Free-form label for the key (e.g. "my-app", "backtest-script"). Optional; defaults to "default". Purely descriptive. */
    label: string | null;
    /** Requested plan name ("Free", "Starter", "Pro", "Business", "Enterprise"). Ignored — always created as Free — unless the request also carries a valid X-Admin-Key header. */
    plan: string | null;
}
interface CreateWebhookRequest {
    /** Destination URL for event deliveries. Must be HTTPS and resolve to a public (non-private, non-loopback) address — validated at creation and re-validated at delivery time. */
    url: string | null;
    /** Event types to subscribe to: "TransactionFiled", "ClusterBuy", "ClusterSell", "CongressTradeFiled" (STOCK Act trade ingested — payload includes disclosureLagDays, see the endpoint description). At least one is required. Some event types require a minimum plan (independent of the subscription count cap): CongressTradeFiled requires Starter or higher; requesting it on a lower plan rejects the whole request with 402 PLAN_REQUIRED. */
    eventTypes: string[] | null;
}
interface DataQualityResponse {
    asOf: string;
    freshness: FreshnessMetrics;
    coverage: CoverageMetrics;
    returns: ReturnsCoverage;
    amendments: AmendmentMetrics;
}
interface DirectoryEntryResponse {
    cik: string;
    name: string;
    primaryTicker: string | null;
    primaryCompanyName: string | null;
    isDirector: boolean;
    isOfficer: boolean;
    isTenPercentOwner: boolean;
    officerTitle: string | null;
    transactionCount: number;
    lastFiledAt: string | null;
    filerGroupSize: number;
}
interface DirectoryLetter {
    letter: string;
    count: number;
}
interface ExcludedTradeEntry {
    insiderCik: string;
    insiderName: string;
    transactionDate: string;
    code: string;
    shares: number;
    reason: string;
}
interface FilingResponse {
    accessionNumber: string;
    companyTicker: string | null;
    companyName: string;
    periodOfReport: string;
    filedAt: string;
    amendmentType: string;
    transactionCount: number;
}
interface Form144Response {
    accessionNumber: string;
    ticker: string;
    companyName: string;
    insiderName: string;
    relationship: string | null;
    broker: string | null;
    sharesProposed: number;
    aggregateMarketValue: number | null;
    approxSaleDate: string | null;
    exchange: string | null;
    acquiredDate: string | null;
    natureOfAcquisition: string | null;
    isUnder10b5Plan: boolean;
    filedAt: string;
    noticeDate: string | null;
}
interface Form4HealthCheck {
    status: string;
    latestProcessedAt: string | null;
    ageMinutes: number | null;
    withinActivityWindow: boolean;
    thresholdMinutes: number;
}
interface FreshnessMetrics {
    latestForm4ProcessedAt: string | null;
    medianIngestionLatencySeconds: number | null;
    p95IngestionLatencySeconds: number | null;
    ingestionLatencySampleSize: number;
    latestPriceBarDate: string | null;
    priceDataDaysBehind: number | null;
}
interface HoldingResponse {
    manager: string;
    managerCik: string;
    reportPeriod: string;
    issuerName: string;
    ticker: string | null;
    cusip: string;
    titleOfClass: string;
    value: number;
    shares: number;
    shareType: string;
    investmentDiscretion: string;
    votingSole: number;
    votingShared: number;
    votingNone: number;
    accessionNumber: string;
    filedAt: string;
}
interface IngestionHealthResponse {
    status: string;
    asOf: string;
    form4: Form4HealthCheck;
    queue: QueueHealthCheck;
    prices: PricesHealthCheck;
}
interface IngestionLatencyStats {
    p50Seconds: number;
    p95Seconds: number;
    sampleCount: number;
    window: string;
}
interface Insider10b5Split {
    totalUnderPlan: number;
    totalDiscretionary: number;
    pctUnder10b5Plan: number;
}
interface InsiderCareer {
    firstTransaction: string | null;
    lastTransaction: string | null;
    totalTransactions: number;
    totalBoughtUsd: number;
    totalSoldUsd: number;
    netUsd: number;
    companies: InsiderCompanyEntry[];
    transactionTypeBreakdown: InsiderTxCodeBreakdown;
    tenB5Plan: Insider10b5Split;
    returns: InsiderReturnsSummary;
}
interface InsiderCompanyEntry {
    ticker: string;
    companyName: string;
    transactionCount: number;
    firstSeen: string;
}
interface InsiderDirectoryResponse {
    total: number;
    letters: DirectoryLetter[];
    letter: string | null;
    letterTotal: number;
    page: number;
    perPage: number;
    refreshedAt: string | null;
    entries: DirectoryEntryResponse[];
}
interface InsiderLeaderboardResponse {
    insiders: LeaderboardEntry[];
    methodology: string;
}
interface InsiderResponse {
    cik: string;
    name: string;
    isDirector: boolean;
    isOfficer: boolean;
    isTenPercentOwner: boolean;
    officerTitle: string | null;
    totalFilings: number;
}
interface InsiderReturnsSummary {
    openMarketTransactionsWithReturns: number;
    avgReturn1d: number | null;
    avgReturn1w: number | null;
    avgReturn1m: number | null;
    avgReturn3m: number | null;
    avgReturn6m: number | null;
}
interface InsiderScorecardResponse {
    insiderCik: string;
    insiderName: string;
    scoredBuyCount: number;
    sampleSufficient: boolean;
    hitRate3m: number | null;
    avgReturn3m: number | null;
    medianReturn3m: number | null;
    scoredBuyCount6m: number;
    sampleSufficient6m: boolean;
    hitRate6m: number | null;
    avgReturn6m: number | null;
    medianReturn6m: number | null;
    bestBuy: ScorecardTradeRef;
    worstBuy: ScorecardTradeRef;
    lastTradeAt: string | null;
    methodology: string;
}
interface InsiderSummaryResponse {
    cik: string;
    name: string;
    officerTitle: string | null;
    isDirector: boolean;
    isOfficer: boolean;
    isTenPercentOwner: boolean;
    career: InsiderCareer;
}
interface InsiderTxCodeBreakdown {
    p: number;
    s: number;
    f: number;
    m: number;
    a: number;
    g: number;
    other: number;
}
interface InstitutionalOwnershipDto {
    quarter: string;
    totalAumUsd: number;
    deltaQoqPct: number | null;
    trend: string;
    topHolders: TopHolderDto[];
    coverageIncomplete: boolean;
}
interface LeaderboardEntry {
    insiderCik: string;
    insiderName: string;
    scoredBuyCount: number;
    hitRate: number;
    avgReturn: number;
    lastTradeAt: string | null;
}
interface ManagerResponse {
    name: string;
    cik: string;
    latestReportPeriod: string;
    latestAum: number;
    latestPositionCount: number;
    latestFiledAt: string;
    latestAccessionNumber: string;
}
interface PricesHealthCheck {
    status: string;
    latestBarDate: string | null;
    daysBehind: number | null;
}
interface QueueHealthCheck {
    status: string;
    pendingCount: number;
    oldestPendingAgeMinutes: number | null;
}
interface RatioBasis {
    windowDays: number;
    buyShares: number;
    sellShares: number;
    buySellRatio: number;
}
interface ReturnsCoverage {
    eligibleTransactions: number;
    fullyComputed: number;
    coveragePct: number;
}
interface ScorecardTradeRef {
    ticker: string;
    filedAt: string;
    return3m: number | null;
}
interface SentimentMonthEntry {
    period: string;
    score: number;
    buyValue: number;
    sellValue: number;
    buyCount: number;
    sellCount: number;
}
interface SentimentResponse {
    ticker: string;
    companyName: string;
    monthly: SentimentMonthEntry[];
}
interface SignalCriteria {
    clusterWindowDays: number;
    clusterThreshold: number;
    ratioWindowDays: number;
    clusterCountsExclude10b5: boolean;
}
interface SignalExplanation {
    ticker: string | null;
    companyName: string;
    signalDate: string;
    isClusterBuy: boolean;
    isClusterSell: boolean;
    insiderCount: number;
    buySellRatio: number;
    criteria: SignalCriteria;
    clusterBuyers: ClusterInsiderEntry[];
    clusterSellers: unknown[];
    excluded: ExcludedTradeEntry[];
    ratio: RatioBasis;
    note: string;
}
interface SignalResponse {
    ticker: string | null;
    companyName: string;
    signalDate: string;
    buySellRatio: number;
    isClusterBuy: boolean;
    isClusterSell: boolean;
    insiderCount: number;
}
interface TestimonialSubmitRequest {
    authorName: string;
    authorTitle: string | null;
    authorCompany: string | null;
    authorEmail: string | null;
    rating: number;
    quote: string;
    videoUrl: string | null;
    linkUrl: string | null;
    consentPublic: boolean;
    referralSource?: string;
}
interface TopHolderDto {
    managerCik: string;
    managerName: string;
    shares: number;
    value: number;
}
interface TransactionResponse {
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
    return1d: number | null;
    return1w: number | null;
    return1m: number | null;
    return3m: number | null;
    return6m: number | null;
    valueQuality: string | null;
    institutionalOwnership?: InstitutionalOwnershipDto;
}
interface UptimeDayBucket {
    date: string;
    expected: number;
    healthy: number;
    uptimePct: number;
}
interface UptimeHistoryResponse {
    windowDays: number;
    start: string;
    overallPct: number;
    days: UptimeDayBucket[];
}
interface WaitlistRequest {
    plan: string;
    interval?: string;
    source?: string;
}
interface ListForm144Params {
    /** Company ticker symbol, case-insensitive (e.g. "AAPL"). Omit to search across all companies. */
    ticker?: string;
    /** Case-insensitive substring match against the insider's name as filed on the Form 144 (formatting varies by broker — e.g. matches "Timothy D Cook" or "COOK, TIM"). */
    insider_name?: string;
    /** Inclusive start of the filed-date window, format YYYY-MM-DD. */
    from?: string;
    /** Inclusive end of the filed-date window, format YYYY-MM-DD. */
    to?: string;
    /** When true, excludes notices filed under a Rule 10b5-1 trading plan — isolates discretionary sale intent. */
    exclude_10b5?: boolean;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Filings per page. Defaults to 50, maximum 100. */
    per_page?: number;
}
interface ListHoldingsParams {
    /** Company/issuer ticker symbol, case-insensitive (e.g. "AAPL"). Resolved via both the issuer's own Companies row (if it files Form 4) and CUSIP-to-ticker mapping (covers ETFs, ADRs, and non-Form-4 issuers) — using either alone misses roughly half of relevant holdings. */
    ticker?: string;
    /** Exact 9-character CUSIP identifier for the security. Use instead of `ticker` when you already have the CUSIP (e.g. from another holding row). */
    cusip?: string;
    /** Institutional manager's SEC CIK (leading zeros optional/stripped). Filters to positions reported by a single 13F filer. */
    manager_cik?: string;
    /** Exact 13F report period (calendar quarter end date), format YYYY-MM-DD (e.g. "2025-06-30"). Omit to include all reported quarters. */
    quarter?: string;
    /** Minimum reported position value in USD. */
    min_value?: number;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Positions per page. Defaults to 50, maximum 100. */
    per_page?: number;
}
interface ListManagersParams {
    /** Case-insensitive substring match against the institutional manager's name (e.g. "Berkshire", "blackrock"). Omit to list all managers. */
    name?: string;
    /** Minimum total reported 13F-HR position value (AUM), in USD, as of the manager's latest filing. */
    min_aum?: number;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Managers per page. Defaults to 50, maximum 100. */
    per_page?: number;
}
interface ListInsidersParams {
    /** Case-insensitive substring match against the insider's full name (e.g. "Musk", "cook"). Must be at least 2 characters — shorter values return a 400 QUERY_TOO_SHORT error. Omit to list all insiders alphabetically. */
    name?: string;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Number of insiders per page. Defaults to 20, maximum 500. */
    per_page?: number;
}
interface GetInsiderDirectoryParams {
    /** Single letter A-Z to list, or "#" for names that do not begin with a letter. Omit to get the A-Z rail and totals without any rows. */
    letter?: string;
    /** 1-based page number within the letter. Defaults to 1. */
    page?: number;
    /** Rows per page. Defaults to 200, maximum 500. */
    per_page?: number;
}
interface GetInsiderLeaderboardParams {
    /** "3m" or "6m" — the post-trade return horizon to score and rank by. Defaults to "3m". */
    horizon?: string;
    /** "hit_rate" (% of scored buys with a positive return) or "avg_return" (mean scored return). Defaults to "hit_rate". */
    order?: string;
    /** Minimum number of scored buys an insider must have to be ranked. Defaults to 5; values below 5 are silently raised to 5 (the scorecard sample-sufficiency floor). */
    min_trades?: number;
    /** Maximum number of insiders to return. Defaults to 25, maximum 100. */
    limit?: number;
}
interface ListCompaniesParams {
    /** Sort order: "name" (alphabetical, default) or "totalfilings" (most SEC filings first). Case-insensitive; unrecognized values fall back to "name". */
    sort?: string;
    /** Maximum number of companies to return. Defaults to 50, maximum 50. */
    limit?: number;
}
interface ListFilingsParams {
    /** Company ticker symbol, case-insensitive (e.g. "AAPL"). */
    ticker?: string;
    /** Company CIK (SEC identifier), e.g. "0000320193". Leading zeros optional. */
    cik?: string;
    /** Inclusive start of the filed-date window, format YYYY-MM-DD. */
    from?: string;
    /** Inclusive end of the filed-date window, format YYYY-MM-DD. */
    to?: string;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Filings per page. Defaults to 20, maximum 100. `limit` is accepted as an alias; if both are given, per_page wins. */
    per_page?: number;
    /** Alias for per_page. Accepted because every caller who hit this path before it existed sent `limit`. */
    limit?: number;
}
interface GetRecentFilingsParams {
    /** Restrict results to a single company ticker, case-insensitive (e.g. "AAPL"). Omit to return recent filings across all companies. */
    ticker?: string;
    /** Number of filings to return. Defaults to 20, maximum 100. */
    per_page?: number;
}
interface ExplainSignalParams {
    /** Exact signal date to explain, format YYYY-MM-DD. Omit to explain the company's most recent signal. Returns 404 SIGNAL_NOT_FOUND if no signal exists for the given (or most recent) date. */
    date?: string;
}
interface GetSentimentParams {
    /** Number of trailing months to include, ending with the current month. Defaults to 24, maximum 60. */
    months?: number;
}
interface GetConvergenceSignalsParams {
    /** Ticker symbol, case-insensitive exact match (e.g. "AAPL"). Omit to scan every ticker. */
    ticker?: string;
    /** Trailing-day window: an insider cluster-buy date and a congressional purchase date must fall within this many days of EACH OTHER (either order) to count as a qualifying pair. Defaults to 30, clamped to [1, 90]. */
    window_days?: number;
    /** How far back from now the MORE RECENT of a qualifying pair's two dates must fall to still count as a current convergence (the less-recent date in a pair can be older, as long as it's within window_days of a recent partner). Defaults to 180, clamped to [1, 730]. */
    lookback_days?: number;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Converged tickers per page. Defaults to 100, maximum 500. */
    per_page?: number;
}
interface ListCongressTradesParams {
    /** Ticker symbol, case-insensitive exact match (e.g. "AAPL"). */
    ticker?: string;
    /** Politician's bioguide ID, exact match (e.g. "P000197"). */
    politician?: string;
    /** Party as disclosed by the source, case-insensitive exact match (e.g. "D", "R", "Democratic"). Free-text — not a fixed enum, so this matches whatever string the source reported. */
    party?: string;
    /** "House" or "Senate", case-insensitive. COVERAGE: this dataset currently holds House PTRs only — Senate eFD blocks datacenter traffic, so chamber=Senate is a valid filter over data we do not yet have and returns an empty array with the response header X-Coverage-Note: chamber-not-covered. */
    chamber?: string;
    /** Two-letter US state/territory code, case-insensitive exact match (e.g. "CA"). */
    state?: string;
    /** "purchase", "sale", "partial_sale", or "exchange", case-insensitive. */
    transaction_type?: string;
    /** Minimum disclosed amount, range-aware: matches trades whose AmountLow >= this value. Never matched against a fabricated midpoint — see the amountLow/amountHigh honesty rule. */
    min_amount?: number;
    /** Inclusive start of the transaction-date window, format YYYY-MM-DD. */
    transaction_date_from?: string;
    /** Inclusive end of the transaction-date window, format YYYY-MM-DD. */
    transaction_date_to?: string;
    /** Inclusive start of the disclosure-date window, format YYYY-MM-DD. Subject to the plan-clamped floor below — a Free/Starter caller cannot page back further than their plan allows even by passing an older date here. */
    disclosure_date_from?: string;
    /** Inclusive end of the disclosure-date window, format YYYY-MM-DD. */
    disclosure_date_to?: string;
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Trades per page. Defaults to 100, maximum 500. */
    per_page?: number;
}
interface ListCongressPoliticiansParams {
    /** 1-based page number. Defaults to 1. */
    page?: number;
    /** Politicians per page. Defaults to 100, maximum 500. */
    per_page?: number;
}
interface GetCongressPoliticianParams {
    /** Number of most-traded tickers to include. Defaults to 10, maximum 50. */
    top_tickers?: number;
    /** Number of most recent trades to include. Defaults to 20, maximum 100. */
    recent_trades?: number;
}
interface GetCongressTickerRollupParams {
    /** Trailing window in days ending now, applied to transactionDate. Omit for all-time. */
    window_days?: number;
}
declare class GeneratedCompaniesResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * List companies with a public ticker, sorted by name or total filings
     * Returns a single page of companies that have a tracked public ticker — for browsing or building a company picker, not for searching by name or CIK (there is no full-text search here; use GET /v1/companies/{ticker} to fetch one company by its exact ticker). Each entry includes the company's CIK, name, ticker, exchange, total filing count, and distinct insider count. There is no page parameter — this endpoint always returns the top `limit` companies by the chosen sort order. Not plan-gated.
     */
    list(params?: ListCompaniesParams): Promise<CompanyResponse[]>;
}
declare class GeneratedCongressResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Get one politician's congressional trading profile (Pro plan+)
     * Returns one politician's profile — identity fields, total/buy/sell trade counts, most recent trade's disclosure date, their top N most-traded tickers (by trade count), and their N most recent trades (same shape as GET /v1/congress/trades). Use this for a one-call politician overview rather than paging /v1/congress/trades?politician= yourself. Accepts either a bioguide ID (e.g. "P000197") or the politician's URL slug (e.g. "nancy-pelosi") in the path, matched case-insensitively against whichever field applies. Returns 404 NOT_FOUND if neither matches. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
     */
    politician(idOrSlug: string, params?: GetCongressPoliticianParams): Promise<CongressPoliticianProfileResponse>;
    /**
     * Ranked rollup of politicians by congressional trade activity (Pro plan+)
     * Returns a paginated list of politicians who have at least one non-superseded congressional trade, each with total/buy/sell counts (sells include both Sale and PartialSale; Exchange trades count only toward total) and their most recent trade's disclosure date. Ordered by total trade count descending, ties broken by most recently disclosed. Use this to discover active traders; for one politician's full profile (including their most-traded tickers and recent trades) use GET /v1/congress/politicians/{idOrSlug}. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
     */
    politicians(params?: ListCongressPoliticiansParams): Promise<CongressPoliticianRollupDto[]>;
    /**
     * Which politicians traded a ticker, with net buy/sell counts (Pro plan+)
     * Returns every politician who has a non-superseded congressional trade in the given ticker, each with their trade/buy/sell counts, plus ticker-level totals. Optional window_days restricts to trades with a transactionDate in the trailing N days; omit for all-time. A ticker with no congress trades returns 200 with an empty politicians array and zero counts rather than 404 — there is no separate ticker/company entity in this dataset to 404 against. Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live — no caching.
     */
    ticker(ticker: string, params?: GetCongressTickerRollupParams): Promise<CongressTickerRollupResponse>;
    /**
     * Query congressional STOCK Act trades (Free+, plan-clamped disclosure window)
     * Returns a paginated JSON list of congressional periodic-transaction-report trades, most recently DISCLOSED first, with non-superseded rows only (amended-away rows never appear). COVERAGE — HOUSE ONLY TODAY: every trade in this dataset comes from the U.S. House Clerk's PTR index. Senate eFD (efdsearch.senate.gov) returns 403 to datacenter traffic, so no Senate filings are ingested yet. chamber=Senate remains a valid filter but matches nothing and returns the response header X-Coverage-Note: chamber-not-covered, so an empty result is never ambiguous. Scanning by chamber should treat that header as "not covered", not as "no trades". PLAN-CLAMPED WINDOW: this endpoint is open to every plan, but how far back you can see is clamped on disclosureDate — Free sees only trades disclosed in the last 30 days, Starter the last 366 days, Pro/Business/Enterprise unlimited history. Passing an older disclosure_date_from than your plan allows does not extend the window — the floor always wins. Filters: ticker, politician (bioguideId, exact), party (free-text, case-insensitive exact match — not a fixed enum), chamber (House|Senate — see the coverage note above), state (2-letter code), transaction_type (purchase|sale|partial_sale|exchange), min_amount (range-aware — matches AmountLow >= value, never a fabricated midpoint), transaction_date_from/to, disclosure_date_from/to. Every row always carries BOTH amountLow and amountHigh (STOCK Act discloses ranges, never exact figures) and disclosureLagDays = (disclosureDate - transactionDate) — the STOCK Act allows up to 45 days of lag, so "real-time" here means minutes-after-disclosure, not minutes-after-trade. For per-politician or per-ticker rollups use GET /v1/congress/politicians, /v1/congress/politicians/{idOrSlug}, or /v1/congress/tickers/{ticker} (all Pro+). Query runs live against the database — no caching.
     */
    trades(params?: ListCongressTradesParams): Promise<CongressTradeDto[]>;
}
declare class GeneratedDataQualityResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Public data-quality, freshness and coverage metrics for the whole dataset
     * Returns public, keyless metrics on data freshness, ingestion latency, corpus coverage, and post-trade returns coverage — use this to check whether the dataset is current before relying on it (e.g. confirm Form 4 ingestion isn't stalled, or that price data isn't stale), not to look up any single company, insider, or transaction. Includes: most recent Form 4 processed timestamp and median/p95 filing-accepted-to-processed latency in seconds, latest price-bar date and how many days behind it is, total companies/transactions tracked plus filing counts by form type (4, 144, 13F-HR), the percentage of 13F CUSIPs resolved to a ticker, and the percentage of eligible transactions with fully computed post-trade returns. Takes no parameters. Cached for 30 minutes; no API key or plan required.
     */
    get(): Promise<DataQualityResponse>;
}
declare class GeneratedFilingsResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Get a single Form 4 filing by its exact SEC accession number
     * Returns one filing's metadata — accession number, company ticker/name, period of report, filed date, amendment type (Original/Amendment), and the count of non-superseded transactions it contains. Use this to look up a specific filing you already have the accession number for (e.g. from GET /v1/filings/recent or GET /v1/transactions); it does not return the individual transaction rows themselves — pull those via GET /v1/transactions filtered by ticker/cik and date. Returns 404 NOT_FOUND if the accession number isn't tracked. Not plan-gated. Query runs live against the database — no caching.
     */
    get(accession: string): Promise<FilingResponse>;
    /**
     * List Form 4 filings with optional ticker, CIK and date filters
     * Returns a paginated list of Form 4 filings, newest filed first. Filter by ticker, cik, and a from/to filed-date window. Each entry carries the accession number, company ticker/name, period of report, filed date, amendment type (Original/Amendment), and the count of non-superseded transactions in that filing. Use this for a company's filing HISTORY; use GET /v1/filings/recent for a live newest-first feed (it has no page parameter), and GET /v1/transactions when you want the individual trades rather than the filings that contain them. `limit` is accepted as an alias for `per_page`. Not plan-gated.
     */
    list(params?: ListFilingsParams): Promise<FilingResponse[]>;
    /**
     * Get the most recently filed Form 4s, optionally filtered by ticker
     * Returns the most recently filed Form 4s across all companies, newest first, optionally restricted to a single ticker. Use this to monitor new insider activity as it's ingested (e.g. a live "latest filings" feed) rather than for historical or bulk queries — for date-range or filter-heavy queries use GET /v1/transactions with from/to instead. Each entry includes the accession number, company ticker/name, period of report, filed date, amendment type, and the count of non-superseded transactions in that filing. There is no page parameter — this always returns the newest per_page filings, not an arbitrary offset. Not plan-gated.
     */
    recent(params?: GetRecentFilingsParams): Promise<FilingResponse[]>;
}
declare class GeneratedForm144Resource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * List Form 144 'notice of proposed sale' filings (Business plan+)
     * Returns a paginated list of Form 144 notices — an insider's SEC filing declaring intent to sell restricted/control stock, filed BEFORE the actual sale (which later shows up as a Form 4 TransactionCode=S, typically ~2 days after). Use this as a leading indicator of upcoming insider selling; the isUnder10b5Plan flag on each row separates pre-scheduled 10b5-1 disposals from discretionary intent. Each row includes accession number, ticker/company, insider name/relationship, broker, shares proposed, aggregate market value, approximate sale date, exchange, and filed/notice dates. For a bulk historical pull use GET /v1/form144/export instead. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching.
     */
    list(params?: ListForm144Params): Promise<Form144Response[]>;
}
declare class GeneratedHoldingsResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * List institutional holdings from Form 13F-HR (Business plan+)
     * Returns a paginated list of individual position rows from Form 13F-HR institutional holdings reports (quarterly disclosures by managers with $100M+ AUM), most recent report period and highest value first. Each row includes the manager name/CIK, report period, issuer name/ticker, CUSIP, security class, position value and share count, share/voting authority type, and the source filing's accession number and filed date. A single security can appear multiple times per manager when sub-managers each report it separately (e.g. Berkshire's subsidiaries). Use GET /v1/managers instead when you want one row per manager (their latest filing + total AUM) rather than position-level detail. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching; 13F data itself is inherently quarter-lagged (SEC filing deadline is 45 days after quarter end).
     */
    list(params?: ListHoldingsParams): Promise<HoldingResponse[]>;
    /**
     * List institutional managers with their latest 13F-HR (Business plan+)
     * Returns one row per institutional manager (13F filer), summarising their MOST RECENT 13F-HR filing — manager name/CIK, report period, total reported position value (AUM) and entry count, filed date, and accession number — ranked by AUM descending. Use this for manager-level discovery ("who are the biggest 13F filers?", "rank Apple's institutional holders") before drilling into position detail via GET /v1/holdings?manager_cik=. Amended (IsAmendment=true) filings are excluded from the 'latest' pick. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Query runs live against the database — no caching; 13F data is inherently quarter-lagged (SEC deadline is 45 days after quarter end).
     */
    managers(params?: ListManagersParams): Promise<ManagerResponse[]>;
}
declare class GeneratedInsidersResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Browse insiders alphabetically by surname
     * Returns the A-Z rail with a count per letter, plus one page of insiders under the
  requested letter. Omit `letter` to get the rail and totals with no rows.
  
  Names come from EDGAR surname-first ("HENNEMAN JOHN B III"), so alphabetical order
  is order by surname. Casing in the source is inconsistent and is not normalised here.
  
  This lists only insiders with at least 3 non-superseded transactions, capped at the
  5,000 most active — the same set as the insiders sitemap shard, so the two cannot
  drift. To find someone outside that set, use GET /v1/insiders?name= which searches
  every filer. Rebuilt daily; `refreshedAt` reports when. Not plan-gated.
  
  One row per FILER GROUP. A fund group files a single Form 4 listing several
  reporting owners — the fund, its GP, its management company — and each is a real
  EDGAR filer with its own CIK. Listing all of them spent about 11% of this capped
  surface describing the same actors more than once, so browse shows one per group
  and `filerGroupSize` says how many others share those exact transactions. The
  others are not hidden: each keeps its own profile and is still returned by
  GET /v1/insiders?name=.
     */
    directory(params?: GetInsiderDirectoryParams): Promise<InsiderDirectoryResponse>;
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
    leaderboard(params?: GetInsiderLeaderboardParams): Promise<InsiderLeaderboardResponse>;
    /**
     * Search insiders (officers, directors, 10% owners) by name
     * Searches insiders by name and returns a paginated list of matches with each insider's CIK, title, director/officer/10%-owner flags, and total filing count. Use this to resolve a person's name to their CIK before fetching their transaction history, career summary, or scorecard — the CIK returned here feeds directly into GET /v1/insiders/{cik}/transactions, /summary, and /scorecard. Omitting the name filter returns insiders in alphabetical order rather than performing a search. Not plan-gated — available on the Free tier.
     */
    list(params?: ListInsidersParams): Promise<InsiderResponse[]>;
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
    scorecard(cik: string): Promise<InsiderScorecardResponse>;
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
    summary(cik: string): Promise<InsiderSummaryResponse>;
}
declare class GeneratedSignalsResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Insider cluster-buy x congressional-purchase convergence (Pro plan+)
     * Returns the tickers where an insider cluster-buy (InsiderSignal.IsClusterBuy) and at least one non-superseded congressional PURCHASE happened within window_days of EACH OTHER, restricted to convergences where the MORE RECENT of the pair's two dates is within a trailing lookback_days (so this surfaces CURRENT convergences, not ancient history). DEFINITION: for each result, insider.signalDate is the SignalDate of the qualifying cluster-buy signal with the most recent date (insider.insiderCount is that same signal's count — never summed or maxed across multiple signals), and congress is every non-superseded congressional purchase that paired with at least one qualifying cluster-buy (not every purchase in the window — only the ones that actually paired). firstSeen/lastSeen are the earliest/most recent dates among all qualifying insider and congress dates for that ticker. STRENGTH is documented arithmetic, NOT a black-box or predictive/ML score: strength = (distinct congressional purchasers among the qualifying legs) x (the representative signal's insiderCount) — a plain multiplication of two observed counts, nothing more. HONESTY: every congress leg always carries both amountLow and amountHigh (STOCK Act discloses ranges, never exact figures — never combined into a fabricated midpoint) and disclosureLagDays = (disclosureDate - transactionDate); congressional trades are disclosed up to 45 days after the actual trade under the STOCK Act, so this endpoint is detection/monitoring of what insiders AND members of Congress have DISCLOSED buying, not a claim of predictive edge, alpha, or win rate — no performance numbers are computed or implied anywhere in this response. window_days and lookback_days are both caller-overridable with clamps (see each parameter's own description for the exact bounds). Requires Pro plan or higher (402 PLAN_REQUIRED on Free/Starter). Query runs live against the database — no caching.
     */
    convergence(params?: GetConvergenceSignalsParams): Promise<ConvergenceEntryDto[]>;
    /**
     * Explain why a signal fired: the insiders and trades counted, what was excluded, and the criteria (Business plan+)
     * Reconstructs the full evidence behind one company's insider signal from GET /v1/signals: the detection criteria (5-day cluster window, 3-insider threshold, 90-day ratio window, 10b5-1 exclusion), the list of cluster buyers and sellers (each with their role and individual trades in the window), trades that were excluded from the cluster count and why (10b5-1 plan or superseded by amendment), and the raw buy/sell share totals behind the 90-day ratio. Use this to audit or debug a specific signal rather than to scan many companies (use GET /v1/signals for that). This is a LIVE reconstruction from current non-superseded data, computed on every request (no caching) — it can differ slightly from the originally stored signal if trades were amended afterward. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Returns 404 COMPANY_NOT_FOUND if the ticker isn't tracked, 404 SIGNAL_NOT_FOUND if no signal exists for the given/most-recent date, or 400 INVALID_DATE if `date` isn't YYYY-MM-DD.
     */
    explain(ticker: string, params?: ExplainSignalParams): Promise<SignalExplanation>;
    /**
     * Monthly insider sentiment score for a ticker (Business plan+)
     * Returns a monthly time series of an MSPR-style insider sentiment score for one company: for each month, (buyValue - sellValue) / (buyValue + sellValue) * 100, alongside the raw buy/sell USD totals and trade counts. Only open-market P/S trades are counted, and — unlike Finnhub's MSPR — 10b5-1 plan trades and derivative transactions are excluded, so the score reflects discretionary conviction rather than pre-scheduled or compensation-driven activity. Use this for a trend view of buying/selling pressure over time; for a single point-in-time cluster/ratio snapshot use GET /v1/signals instead. Score is on a -100 (all selling) to +100 (all buying) scale — NOT a fraction, unlike the return fields on other endpoints. Requires Business plan or higher (402 PLAN_REQUIRED on Free/Starter/Pro). Returns 404 NOT_FOUND if the ticker isn't tracked. Cached for 60 seconds per (ticker, months) combination.
     */
    sentiment(ticker: string, params?: GetSentimentParams): Promise<SentimentResponse>;
}
declare class GeneratedStatsResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Public corpus-wide statistics — no API key required
     * Returns headline dataset totals: filing count, transaction count, tracked companies, institutional holdings rows, Form 144 and Form 13F-HR filing counts, the earliest filing date in the corpus, the most recent quarter's total 13F-HR reported AUM in USD, and measured ingestion latency (median/p95 seconds from SEC acceptance to our processing, trailing 7 days). Use this for corpus-wide totals (e.g. a marketing/status widget), not for per-company or per-insider data — those live under GET /v1/companies and GET /v1/insiders. For freshness and coverage-quality metrics (is ingestion stalled, is price data stale) use GET /v1/data-quality instead. Takes no parameters. No API key or plan required. Cached for ~12 hours.
     */
    get(): Promise<CorpusStats>;
}
declare class GeneratedStatusResource {
    protected readonly client: Form4ApiClient;
    constructor(client: Form4ApiClient);
    /**
     * Measured uptime history for the public status page — trailing 90-day daily breakdown
     * Returns a daily breakdown of measured API uptime over a trailing 90-day window, computed from an internal heartbeat probe that runs every 5 minutes and performs the same DB-connectivity check as GET /health/ready. Each day in the `days` array reports the number of 5-minute slots expected to have elapsed (288 for a complete past day, pro-rated for the feature's first day and for today's partial day), how many of those slots recorded a healthy heartbeat, and the resulting uptime percentage for that day — plus an overall percentage (`overallPct`) across the whole window. `start` is the earliest date included: either the date of the very first heartbeat ever recorded, or 89 days before today once more than 90 days of history exist. Days before that are never returned. Use this to render an uptime history / status bar; for live corpus freshness use GET /v1/data-quality instead. Takes no parameters. Cached for ~5 minutes; no API key or plan required.
     */
    history(): Promise<UptimeHistoryResponse>;
}

declare class CompaniesResource extends GeneratedCompaniesResource {
    constructor(client: Form4ApiClient);
    get(ticker: string): Promise<Company>;
    insiders(ticker: string): Promise<Insider[]>;
}

declare class InsidersResource extends GeneratedInsidersResource {
    constructor(client: Form4ApiClient);
    get(cik: string): Promise<Insider>;
    transactions(cik: string, params?: InsiderTransactionParams): Promise<Transaction[]>;
}

declare class SignalsResource extends GeneratedSignalsResource {
    constructor(client: Form4ApiClient);
    list(params?: SignalListParams): Promise<InsiderSignal[]>;
    /**
     * Pages through /v1/signals until the data runs out (a short or empty
     * page) or the calling key's plan-gated pagination depth is exceeded — see
     * `TransactionsResource.paginate` for the full rationale. That 402 is NOT
     * swallowed; it becomes a `PaginationLimitError` after every page already
     * yielded has been delivered to the caller. Pass `maxPages` to stop
     * deliberately before that happens.
     */
    paginate(params?: Omit<SignalListParams, "page">, options?: PaginateOptions): AsyncGenerator<InsiderSignal[]>;
}

declare class TransactionsResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    list(params?: TransactionListParams): Promise<Transaction[]>;
    /**
     * Pages through /v1/transactions until the data runs out (a short or empty
     * page) or, since the backend's 2026-08-01 plan-gated pagination depth
     * (Free: 20 pages, Starter: 100, Pro+: unlimited), the next page is
     * rejected with 402. That 402 is NOT swallowed — a scripted caller who
     * silently stopped there would see what looks like "no more data" and
     * never learn their dataset was truncated. Instead this throws
     * `PaginationLimitError` mid-iteration, after every page already yielded
     * has been delivered to the caller. Pass `maxPages` to stop deliberately
     * before that ever happens.
     */
    paginate(params?: Omit<TransactionListParams, "page">, options?: PaginateOptions): AsyncGenerator<Transaction[]>;
}

declare class WebhooksResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    create(url: string, eventTypes: string[]): Promise<WebhookCreated>;
    list(): Promise<WebhookSubscription[]>;
    delete(subscriptionId: number): Promise<void>;
    events(params?: WebhookEventParams): Promise<WebhookEvent[]>;
}

interface Form4ApiClientOptions {
    apiKey: string;
    baseUrl?: string;
    /** Maximum number of retries on network errors or 5xx responses. Default: 2 */
    maxRetries?: number;
    /** Request timeout in milliseconds. Default: 30000 */
    timeout?: number;
}
declare class Form4ApiClient {
    private readonly baseUrl;
    private readonly apiKey;
    private readonly maxRetries;
    private readonly timeout;
    readonly transactions: TransactionsResource;
    readonly insiders: InsidersResource;
    readonly companies: CompaniesResource;
    readonly signals: SignalsResource;
    readonly webhooks: WebhooksResource;
    readonly congress: GeneratedCongressResource;
    readonly filings: GeneratedFilingsResource;
    readonly form144: GeneratedForm144Resource;
    readonly holdings: GeneratedHoldingsResource;
    readonly stats: GeneratedStatsResource;
    readonly status: GeneratedStatusResource;
    readonly dataQuality: GeneratedDataQualityResource;
    constructor({ apiKey, baseUrl, maxRetries, timeout, }: Form4ApiClientOptions);
    _get<T>(path: string, params?: Record<string, string>): Promise<T>;
    _post<T>(path: string, body?: unknown): Promise<T>;
    _delete(path: string): Promise<void>;
    private _fetch;
    private _parse;
    private _throwError;
}

declare class InsiderApiError extends Error {
    readonly statusCode: number;
    readonly errorCode: string | null;
    constructor(message: string, statusCode: number, errorCode?: string | null);
}
declare class AuthError extends InsiderApiError {
    constructor(message: string, errorCode?: string | null);
}
declare class PlanError extends InsiderApiError {
    /** Minimum plan that unlocks the endpoint, e.g. "Business". */
    readonly requiredPlan: string | undefined;
    /** The plan the calling key is currently on, e.g. "Free". */
    readonly currentPlan: string | undefined;
    /** Where to upgrade. */
    readonly upgradeUrl: string | undefined;
    constructor(message: string, requiredPlan?: string, currentPlan?: string, upgradeUrl?: string);
}
declare class NotFoundError extends InsiderApiError {
    constructor(message: string, errorCode?: string | null);
}
declare class RateLimitError extends InsiderApiError {
    readonly retryAfter: number | undefined;
    constructor(message: string, retryAfter?: number);
}
/**
 * Thrown by `paginate()` (on `transactions` and `signals`) when the backend
 * rejects the next page because the calling key's plan has reached its
 * pagination depth limit (Free: 20 pages, Starter: 100, Pro+: unlimited).
 *
 * Pages already yielded before this point were real, complete pages — this
 * error only means iteration stopped early, not that any data already
 * delivered to the caller was wrong. `pagesYielded` tells you exactly how
 * many. The original `PlanError` is preserved as `cause`.
 *
 * **Extends `PlanError` deliberately.** Before this type existed, `paginate()`
 * threw a plain `PlanError` at the depth limit, so code written as
 * `catch (e) { if (e instanceof PlanError) ... }` was the documented way to
 * handle it. Subclassing keeps every one of those handlers working while
 * letting new code catch the narrower type — and it is the truthful
 * relationship anyway, since this IS a 402 PLAN_REQUIRED. Making it a sibling
 * would break existing callers for no gain.
 */
declare class PaginationLimitError extends PlanError {
    /** Number of pages successfully yielded by paginate() before this error. */
    readonly pagesYielded: number;
    constructor(message: string, pagesYielded: number, cause: unknown);
}

export { type AmendmentMetrics, AuthError, type ClusterInsiderEntry, type ClusterTradeEntry, type Company, type CompanyResponse, type CongressPoliticianProfileResponse, type CongressPoliticianRefDto, type CongressPoliticianRollupDto, type CongressTickerCountDto, type CongressTickerPoliticianEntryDto, type CongressTickerRollupResponse, type CongressTradeDto, type ConvergenceCongressLegDto, type ConvergenceEntryDto, type ConvergenceInsiderSideDto, type CorpusStats, type CoverageMetrics, type CreateKeyRequest, type CreateWebhookRequest, type CreatedKey, type DataQualityResponse, type DirectoryEntryResponse, type DirectoryLetter, type ExcludedTradeEntry, type ExplainSignalParams, type FilingResponse, type Form144Response, Form4ApiClient, type Form4ApiClientOptions, type Form4HealthCheck, type FreshnessMetrics, GeneratedCompaniesResource, GeneratedCongressResource, GeneratedDataQualityResource, GeneratedFilingsResource, GeneratedForm144Resource, GeneratedHoldingsResource, GeneratedInsidersResource, GeneratedSignalsResource, GeneratedStatsResource, GeneratedStatusResource, type GetCongressPoliticianParams, type GetCongressTickerRollupParams, type GetConvergenceSignalsParams, type GetInsiderDirectoryParams, type GetInsiderLeaderboardParams, type GetRecentFilingsParams, type GetSentimentParams, type HoldingResponse, type IngestionHealthResponse, type IngestionLatencyStats, type Insider, type Insider10b5Split, InsiderApiError, type InsiderCareer, type InsiderCompanyEntry, type InsiderDirectoryResponse, type InsiderLeaderboardResponse, type InsiderResponse, type InsiderReturnsSummary, type InsiderScorecardResponse, type InsiderSignal, type InsiderSummaryResponse, type InsiderTransactionParams, type InsiderTxCodeBreakdown, type InstitutionalOwnershipDto, type LeaderboardEntry, type ListCompaniesParams, type ListCongressPoliticiansParams, type ListCongressTradesParams, type ListFilingsParams, type ListForm144Params, type ListHoldingsParams, type ListInsidersParams, type ListManagersParams, type ManagerResponse, NotFoundError, type PaginateOptions, PaginationLimitError, PlanError, type PricesHealthCheck, type QueueHealthCheck, RateLimitError, type RatioBasis, type ReturnsCoverage, type ScorecardTradeRef, type SentimentMonthEntry, type SentimentResponse, type SignalCriteria, type SignalExplanation, type SignalListParams, type SignalResponse, type TestimonialSubmitRequest, type TopHolderDto, type Transaction, type TransactionListParams, type TransactionResponse, type UptimeDayBucket, type UptimeHistoryResponse, type WaitlistRequest, type WebhookCreated, type WebhookEvent, type WebhookEventParams, type WebhookSubscription };
