import type { Form4ApiClient } from "../client.js";
import type { WebhookCreated, WebhookEvent, WebhookEventParams, WebhookSubscription } from "../types.js";

export class WebhooksResource {
  constructor(private readonly client: Form4ApiClient) {}

  async create(url: string, eventTypes: string[]): Promise<WebhookCreated> {
    return this.client._post<WebhookCreated>("/v1/webhooks", { url, eventTypes });
  }

  async list(): Promise<WebhookSubscription[]> {
    return this.client._get<WebhookSubscription[]>("/v1/webhooks");
  }

  async delete(subscriptionId: number): Promise<void> {
    return this.client._delete(`/v1/webhooks/${subscriptionId}`);
  }

  async events(params: WebhookEventParams = {}): Promise<WebhookEvent[]> {
    const q: Record<string, string> = {};
    if (params.since !== undefined) q["since"] = params.since;
    return this.client._get<WebhookEvent[]>("/v1/webhooks/events", q);
  }
}
