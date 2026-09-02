import type { Form4ApiClient } from "../client.js";
import type { InsiderSignal, PaginateOptions, SignalListParams } from "../types.js";
import { GeneratedSignalsResource } from "../generated.js";
import { isPaginationDepthError, PaginationLimitError } from "../errors.js";

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

  /**
   * Pages through /v1/signals until the data runs out (a short or empty
   * page) or the calling key's plan-gated pagination depth is exceeded — see
   * `TransactionsResource.paginate` for the full rationale. That 402 is NOT
   * swallowed; it becomes a `PaginationLimitError` after every page already
   * yielded has been delivered to the caller. Pass `maxPages` to stop
   * deliberately before that happens.
   */
  async *paginate(
    params: Omit<SignalListParams, "page"> = {},
    options: PaginateOptions = {},
  ): AsyncGenerator<InsiderSignal[]> {
    const perPage = params.perPage ?? 100;
    const maxPages = options.maxPages;
    let page = 1;
    let pagesYielded = 0;
    while (true) {
      if (maxPages !== undefined && pagesYielded >= maxPages) break;

      let batch: InsiderSignal[];
      try {
        batch = await this.list({ ...params, page, perPage });
      } catch (err) {
        if (isPaginationDepthError(err)) {
          throw new PaginationLimitError(
            `signals.paginate() stopped after yielding ${pagesYielded} page(s) — ${err.message}`,
            pagesYielded,
            err,
          );
        }
        throw err;
      }

      if (batch.length === 0) break;
      yield batch;
      pagesYielded++;
      if (batch.length < perPage) break;
      page++;
    }
  }
}
