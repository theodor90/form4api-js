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
  requiredPlan;
  constructor(message, requiredPlan) {
    super(message, 402, "PLAN_REQUIRED");
    this.name = "PlanError";
    this.requiredPlan = requiredPlan;
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

// src/resources/companies.ts
var CompaniesResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
  async get(ticker) {
    return this.client._get(`/v1/companies/${ticker}`);
  }
  async insiders(ticker) {
    return this.client._get(`/v1/companies/${ticker}/insiders`);
  }
};

// src/resources/insiders.ts
var InsidersResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
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
var SignalsResource = class {
  constructor(client) {
    this.client = client;
  }
  client;
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

// src/client.ts
var DEFAULT_BASE_URL = "https://api.form4api.com";
var RETRY_DELAYS_MS = [500, 1e3, 2e3];
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
        const required = body["requiredPlan"] ?? void 0;
        throw new PlanError(message, required);
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
  InsiderApiError,
  NotFoundError,
  PlanError,
  RateLimitError
};
