import { AuthError, InsiderApiError, NotFoundError, PlanError, RateLimitError } from "./errors.js";
import { CompaniesResource } from "./resources/companies.js";
import { InsidersResource } from "./resources/insiders.js";
import { SignalsResource } from "./resources/signals.js";
import { TransactionsResource } from "./resources/transactions.js";
import { WebhooksResource } from "./resources/webhooks.js";

const DEFAULT_BASE_URL = "https://api.form4api.com";
const RETRY_DELAYS_MS = [500, 1000, 2000];

// Sent as the User-Agent so the backend can attribute traffic to the JS SDK
// channel (the admin dashboard buckets by client). Keep in sync with the
// "version" field in package.json on each release.
const SDK_VERSION = "1.1.3";
const USER_AGENT = `form4api-js/${SDK_VERSION}`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Form4ApiClientOptions {
  apiKey: string;
  baseUrl?: string;
  /** Maximum number of retries on network errors or 5xx responses. Default: 2 */
  maxRetries?: number;
  /** Request timeout in milliseconds. Default: 30000 */
  timeout?: number;
}

export class Form4ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;
  private readonly timeout: number;

  readonly transactions: TransactionsResource;
  readonly insiders: InsidersResource;
  readonly companies: CompaniesResource;
  readonly signals: SignalsResource;
  readonly webhooks: WebhooksResource;

  constructor({
    apiKey,
    baseUrl = DEFAULT_BASE_URL,
    maxRetries = 2,
    timeout = 30_000,
  }: Form4ApiClientOptions) {
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

  async _get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await this._fetch("GET", url.toString());
    return this._parse<T>(res);
  }

  async _post<T>(path: string, body?: unknown): Promise<T> {
    const res = await this._fetch("POST", this.baseUrl + path, body);
    return this._parse<T>(res);
  }

  async _delete(path: string): Promise<void> {
    const res = await this._fetch("DELETE", this.baseUrl + path);
    if (!res.ok && res.status !== 204) {
      await this._throwError(res);
    }
  }

  // Executes a fetch with timeout and retry on network errors / 5xx.
  // 4xx responses are returned immediately without retry.
  private async _fetch(method: string, url: string, body?: unknown): Promise<Response> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 2_000);
      }

      const controller = new AbortController();
      const timer = setTimeout(
        () => controller.abort(new Error("Request timed out")),
        this.timeout,
      );

      try {
        const res = await fetch(url, {
          method,
          headers: {
            "X-Api-Key": this.apiKey,
            "User-Agent": USER_AGENT,
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        // 4xx: surface immediately, no retry
        if (res.status < 500) return res;

        // 5xx on final attempt: return and let _parse/_throwError handle it
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

  private async _parse<T>(res: Response): Promise<T> {
    if (res.ok) {
      return res.json() as Promise<T>;
    }
    await this._throwError(res);
    throw new Error("unreachable");
  }

  private async _throwError(res: Response): Promise<never> {
    let body: Record<string, unknown> = {};
    try {
      body = (await res.json()) as Record<string, unknown>;
    } catch {
      // ignore parse failure
    }
    const error = (body["error"] as Record<string, unknown> | undefined) ?? {};
    const code = (error["code"] as string | undefined) ?? null;
    const message =
      (error["message"] as string | undefined) ??
      `HTTP ${res.status}`;

    switch (res.status) {
      case 401:
        throw new AuthError(message, code);
      case 402: {
        const required = (body["requiredPlan"] as string | undefined) ?? undefined;
        throw new PlanError(message, required);
      }
      case 404:
        throw new NotFoundError(message, code);
      case 429: {
        const retryAfter = res.headers.get("Retry-After");
        throw new RateLimitError(
          message,
          retryAfter !== null ? parseInt(retryAfter, 10) : undefined,
        );
      }
      default:
        throw new InsiderApiError(message, res.status, code);
    }
  }
}
