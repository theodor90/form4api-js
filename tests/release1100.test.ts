import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Form4ApiClient, NotFoundError } from "../src/index.js";
import type { CompanyPeersResponse, CompanyPeerResponse } from "../src/index.js";

const BASE = "http://test.local";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new Form4ApiClient({ apiKey: "test-key", baseUrl: BASE, maxRetries: 0 });
}

const PEER: CompanyPeerResponse = {
  ticker: "DELL",
  name: "Dell Technologies Inc.",
  cik: "0001571996",
  sicCode: "3571",
  filings12m: 42,
  matchLevel: "sic4",
};

const BODY: CompanyPeersResponse = {
  ticker: "AAPL",
  sicCode: "3571",
  sicDescription: "Electronic Computers",
  basis: "sic4",
  peers: [PEER],
};

describe("companies.peers (1.10.0)", () => {
  it("fetches the peers path and returns the parsed response", async () => {
    let path = "";
    let search = "";
    server.use(
      http.get(`${BASE}/v1/companies/:ticker/peers`, ({ request }) => {
        const url = new URL(request.url);
        path = url.pathname;
        search = url.search;
        return HttpResponse.json(BODY);
      }),
    );
    const res = await makeClient().companies.peers("AAPL");
    expect(path).toBe("/v1/companies/AAPL/peers");
    expect(search).toBe("");
    expect(res.basis).toBe("sic4");
    expect(res.sicDescription).toBe("Electronic Computers");
    expect(res.peers[0]).toEqual(PEER);
  });

  it("passes limit through as a query parameter", async () => {
    let limit: string | null = null;
    server.use(
      http.get(`${BASE}/v1/companies/:ticker/peers`, ({ request }) => {
        limit = new URL(request.url).searchParams.get("limit");
        return HttpResponse.json(BODY);
      }),
    );
    await makeClient().companies.peers("AAPL", { limit: 5 });
    expect(limit).toBe("5");
  });

  it("returns an empty list with basis none for a company without a SIC code", async () => {
    server.use(
      http.get(`${BASE}/v1/companies/:ticker/peers`, () =>
        HttpResponse.json({ ticker: "XYZ", sicCode: null, sicDescription: null, basis: "none", peers: [] }),
      ),
    );
    const res = await makeClient().companies.peers("XYZ");
    expect(res.sicCode).toBeNull();
    expect(res.basis).toBe("none");
    expect(res.peers).toEqual([]);
  });

  it("maps a 404 to NotFoundError", async () => {
    server.use(
      http.get(`${BASE}/v1/companies/:ticker/peers`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "Unknown ticker" } }, { status: 404 }),
      ),
    );
    await expect(makeClient().companies.peers("ZZZZ")).rejects.toBeInstanceOf(NotFoundError);
  });
});
