import type { Form4ApiClient } from "../client.js";
import type { Transaction, TransactionListParams } from "../types.js";

export class TransactionsResource {
  constructor(private readonly client: Form4ApiClient) {}

  async list(params: TransactionListParams = {}): Promise<Transaction[]> {
    const q: Record<string, string> = {};
    if (params.ticker !== undefined) q["ticker"] = params.ticker;
    if (params.cik !== undefined) q["cik"] = params.cik;
    if (params.insiderCik !== undefined) q["insider_cik"] = params.insiderCik;
    if (params.code !== undefined) q["code"] = params.code;
    if (params.from !== undefined) q["from"] = params.from;
    if (params.to !== undefined) q["to"] = params.to;
    if (params.exclude10b5 !== undefined) q["exclude_10b5"] = String(params.exclude10b5);
    q["page"] = String(params.page ?? 1);
    q["per_page"] = String(params.perPage ?? 50);
    return this.client._get<Transaction[]>("/v1/transactions", q);
  }

  async *paginate(params: Omit<TransactionListParams, "page"> = {}): AsyncGenerator<Transaction[]> {
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
}
