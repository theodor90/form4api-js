import type { Form4ApiClient } from "../client.js";
import type { Company, Insider } from "../types.js";

export class CompaniesResource {
  constructor(private readonly client: Form4ApiClient) {}

  async get(ticker: string): Promise<Company> {
    return this.client._get<Company>(`/v1/companies/${ticker}`);
  }

  async insiders(ticker: string): Promise<Insider[]> {
    return this.client._get<Insider[]>(`/v1/companies/${ticker}/insiders`);
  }
}
