import type { Form4ApiClient } from "../client.js";
import type { InsiderSignal, SignalListParams } from "../types.js";
import { GeneratedSignalsResource } from "../generated.js";

// See CompaniesResource for why this extends rather than replaces. Inherits
// explain(), sentiment() and convergence() — all previously unreachable from
// this SDK despite being paid-tier features.
export class SignalsResource extends GeneratedSignalsResource {
  constructor(client: Form4ApiClient) {
    super(client);
  }

  async list(params: SignalListParams = {}): Promise<InsiderSignal[]> {
    const q: Record<string, string> = {};
    if (params.ticker !== undefined) q["ticker"] = params.ticker;
    if (params.clusterBuy !== undefined) q["cluster_buy"] = String(params.clusterBuy);
    if (params.clusterSell !== undefined) q["cluster_sell"] = String(params.clusterSell);
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 100);
    return this.client._get<InsiderSignal[]>("/v1/signals", q);
  }

  async *paginate(params: Omit<SignalListParams, "page"> = {}): AsyncGenerator<InsiderSignal[]> {
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
}
