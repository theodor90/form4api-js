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

export interface WebhookCreated {
  subscriptionId: number;
  url: string;
  eventTypes: string[];
  secret: string;
  createdAt: string;
  warning: string | null;
}

export interface WebhookSubscription {
  subscriptionId: number;
  url: string;
  eventTypes: string[];
  createdAt: string;
  isActive: boolean;
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
