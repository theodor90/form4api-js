export interface Transaction {
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
  isOpenMarket?: boolean;
  is10b5Plan?: boolean;
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
