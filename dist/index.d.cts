interface Transaction {
    ticker: string;
    companyName: string;
    insiderName: string;
    insiderCik: string;
    insiderRole: string | null;
    accessionNumber: string;
    securityTitle: string;
    transactionCode: string;
    sharesAmount: number;
    pricePerShare: number | null;
    totalValue: number | null;
    sharesOwnedAfter: number | null;
    directIndirect: string | null;
    isDerivative: boolean;
    isOpenMarket: boolean;
    is10b5Plan: boolean;
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
    isOpenMarket?: boolean;
    is10b5Plan?: boolean;
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

declare class CompaniesResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    get(ticker: string): Promise<Company>;
    insiders(ticker: string): Promise<Insider[]>;
}

declare class InsidersResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    get(cik: string): Promise<Insider>;
    transactions(cik: string, params?: InsiderTransactionParams): Promise<Transaction[]>;
}

declare class SignalsResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    list(params?: SignalListParams): Promise<InsiderSignal[]>;
    paginate(params?: Omit<SignalListParams, "page">): AsyncGenerator<InsiderSignal[]>;
}

declare class TransactionsResource {
    private readonly client;
    constructor(client: Form4ApiClient);
    list(params?: TransactionListParams): Promise<Transaction[]>;
    paginate(params?: Omit<TransactionListParams, "page">): AsyncGenerator<Transaction[]>;
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
    readonly requiredPlan: string | undefined;
    constructor(message: string, requiredPlan?: string);
}
declare class NotFoundError extends InsiderApiError {
    constructor(message: string, errorCode?: string | null);
}
declare class RateLimitError extends InsiderApiError {
    readonly retryAfter: number | undefined;
    constructor(message: string, retryAfter?: number);
}

export { AuthError, type Company, type CreatedKey, Form4ApiClient, type Form4ApiClientOptions, type Insider, InsiderApiError, type InsiderSignal, type InsiderTransactionParams, NotFoundError, PlanError, RateLimitError, type SignalListParams, type Transaction, type TransactionListParams, type WebhookCreated, type WebhookEvent, type WebhookEventParams, type WebhookSubscription };
