import type { Form4ApiClient } from "../client.js";
import type { Insider, InsiderTransactionParams, Transaction } from "../types.js";
import { GeneratedInsidersResource } from "../generated.js";

// See CompaniesResource for why this extends rather than replaces. Inherits
// list(), summary() and scorecard() — the last two are Pro-gated endpoints that
// were previously unreachable from this SDK entirely.
export class InsidersResource extends GeneratedInsidersResource {
  constructor(client: Form4ApiClient) {
    super(client);
  }

  async get(cik: string): Promise<Insider> {
    return this.client._get<Insider>(`/v1/insiders/${cik}`);
  }

  async transactions(cik: string, params: InsiderTransactionParams = {}): Promise<Transaction[]> {
    const q: Record<string, string> = {};
    if (params.from !== undefined) q["from"] = params.from;
    if (params.to !== undefined) q["to"] = params.to;
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 50);
    return this.client._get<Transaction[]>(`/v1/insiders/${cik}/transactions`, q);
  }
}
