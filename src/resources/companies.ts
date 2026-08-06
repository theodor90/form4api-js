import type { Form4ApiClient } from "../client.js";
import type { Company, Insider } from "../types.js";
import { GeneratedCompaniesResource } from "../generated.js";

// Extends the generated base rather than replacing it: spec-derived methods
// (list, and whatever the API grows next) arrive by regenerating, while the
// curated signatures below stay exactly as published on npm. Move an operation
// out of HANDLED_BY_HANDWRITTEN in codegen/generate.mjs to let codegen own it.
export class CompaniesResource extends GeneratedCompaniesResource {
  constructor(client: Form4ApiClient) {
    super(client);
  }

  async get(ticker: string): Promise<Company> {
    return this.client._get<Company>(`/v1/companies/${ticker}`);
  }

  async insiders(ticker: string): Promise<Insider[]> {
    return this.client._get<Insider[]>(`/v1/companies/${ticker}/insiders`);
  }
}
