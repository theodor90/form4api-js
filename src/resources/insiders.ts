import type { Form4ApiClient } from "../client.js";
import type { Insider, InsiderTransactionParams, Transaction } from "../types.js";

export class InsidersResource {
  constructor(private readonly client: Form4ApiClient) {}

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
