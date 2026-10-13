import type { Form4ApiClient } from "../client.js";
import type {
  WebhookAuthHeader,
  WebhookAuthHeaderResult,
  WebhookCreated,
  WebhookEnableResult,
  WebhookEvent,
  WebhookEventParams,
  WebhookSubscription,
  WebhookTestResult,
} from "../types.js";

export class WebhooksResource {
  constructor(private readonly client: Form4ApiClient) {}

  /**
   * Registers a webhook. `eventTypes` are exact names: TransactionFiled,
   * ClusterBuy, ClusterSell, CongressTradeFiled (Starter+), ConvergenceSignal
   * (Pro+). Pass `authHeader` to have one custom header (for example
   * `Authorization: Bearer ...`) sent with every delivery. The signing secret
   * in the response is shown once.
   */
  async create(
    url: string,
    eventTypes: string[],
    options: { authHeader?: WebhookAuthHeader } = {},
  ): Promise<WebhookCreated> {
    const body: Record<string, unknown> = { url, eventTypes };
    if (options.authHeader !== undefined) body["authHeader"] = options.authHeader;
    return this.client._post<WebhookCreated>("/v1/webhooks", body);
  }

  async list(): Promise<WebhookSubscription[]> {
    return this.client._get<WebhookSubscription[]>("/v1/webhooks");
  }

  async delete(subscriptionId: number): Promise<void> {
    return this.client._delete(`/v1/webhooks/${subscriptionId}`);
  }

  /** Re-enables a subscription the system auto-disabled after delivery failures. */
  async enable(subscriptionId: number): Promise<WebhookEnableResult> {
    return this.client._post<WebhookEnableResult>(`/v1/webhooks/${subscriptionId}/enable`);
  }

  /**
   * Sends one synthetic delivery to the subscription's URL now (payload has
   * `"test": true`). A failed send is reported in the result (`delivered:
   * false`, `error`), not thrown.
   */
  async test(subscriptionId: number): Promise<WebhookTestResult> {
    return this.client._post<WebhookTestResult>(`/v1/webhooks/${subscriptionId}/test`);
  }

  /** Sets or replaces the custom auth header sent with deliveries. The value is write-only. */
  async setAuthHeader(
    subscriptionId: number,
    header: WebhookAuthHeader,
  ): Promise<WebhookAuthHeaderResult> {
    return this.client._put<WebhookAuthHeaderResult>(
      `/v1/webhooks/${subscriptionId}/auth-header`,
      header,
    );
  }

  /** Removes the custom auth header. Idempotent; resolves with no value (204). */
  async deleteAuthHeader(subscriptionId: number): Promise<void> {
    return this.client._delete(`/v1/webhooks/${subscriptionId}/auth-header`);
  }

  async events(params: WebhookEventParams = {}): Promise<WebhookEvent[]> {
    const q: Record<string, string> = {};
    if (params.since !== undefined) q["since"] = params.since;
    return this.client._get<WebhookEvent[]>("/v1/webhooks/events", q);
  }
}
