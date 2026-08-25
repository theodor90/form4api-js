import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Form4ApiClient } from "../src/index.js";

// Covers the resource families generated from the OpenAPI spec.
//
// Before these existed, all 6 Pro-gated endpoints and 9 of the 10
// Business-gated ones were unreachable from this SDK: a customer paying $149
// for Business could not call Form 144 or 13F holdings from the client library
// at all and had to hand-roll HTTP. These tests pin that the generated methods
// are wired to the client and hit the paths the spec declares — a generator
// that emits a method nobody attached is worth nothing.

const BASE = "http://test.local";
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new Form4ApiClient({ apiKey: "test-key", baseUrl: BASE, maxRetries: 0 });
}

/** Captures the URL the SDK actually requested, so path and query are both asserted. */
function captureGet(path: string, body: unknown) {
  let seen: URL | undefined;
  server.use(
    http.get(`${BASE}${path}`, ({ request }) => {
      seen = new URL(request.url);
      return HttpResponse.json(body);
    }),
  );
  return () => seen;
}

describe("generated resource families", () => {
  // The two methods that arrived by derivation rather than by a hand-written
  // METHOD_NAMES entry. Codegen could not run at all between 2026-08-04 and
  // 2026-08-25, so these are the first endpoints to reach this SDK without
  // anyone naming them — worth pinning that they are wired to the right paths
  // and not just present on the class.
  it("filings.list hits /v1/filings and forwards its filters", async () => {
    const seen = captureGet("/v1/filings", [{ accessionNumber: "0001-24-000001" }]);
    const res = await makeClient().filings.list({ ticker: "AAPL", per_page: 5 });

    expect(res).toEqual([{ accessionNumber: "0001-24-000001" }]);
    expect(seen()!.pathname).toBe("/v1/filings");
    expect(seen()!.searchParams.get("ticker")).toBe("AAPL");
    expect(seen()!.searchParams.get("per_page")).toBe("5");
  });

  it("filings.list is a different endpoint from filings.recent", async () => {
    // Derivation gave both the resource-stripped name; if it had collapsed
    // them, one would silently shadow the other.
    const seen = captureGet("/v1/filings/recent", []);
    await makeClient().filings.recent();
    expect(seen()!.pathname).toBe("/v1/filings/recent");
  });

  it("insiders.directory hits /v1/insiders/directory and forwards letter", async () => {
    const seen = captureGet("/v1/insiders/directory", { letters: [], insiders: [] });
    const res = await makeClient().insiders.directory({ letter: "S", per_page: 200 });

    expect(res).toEqual({ letters: [], insiders: [] });
    expect(seen()!.pathname).toBe("/v1/insiders/directory");
    expect(seen()!.searchParams.get("letter")).toBe("S");
  });

  it("insiders.directory does not shadow insiders.list", async () => {
    const seen = captureGet("/v1/insiders", []);
    await makeClient().insiders.list();
    expect(seen()!.pathname).toBe("/v1/insiders");
  });

  it("form144.list hits /v1/forms144 path and forwards query params", async () => {
    const seen = captureGet("/v1/form144", [{ ticker: "AAPL" }]);
    const res = await makeClient().form144.list({ ticker: "AAPL", per_page: 5 });

    expect(res).toEqual([{ ticker: "AAPL" }]);
    expect(seen()!.pathname).toBe("/v1/form144");
    expect(seen()!.searchParams.get("ticker")).toBe("AAPL");
    // Numbers are stringified for the query string, not dropped.
    expect(seen()!.searchParams.get("per_page")).toBe("5");
  });

  it("holdings.list and holdings.managers are distinct endpoints", async () => {
    const seenHoldings = captureGet("/v1/holdings", []);
    await makeClient().holdings.list();
    expect(seenHoldings()!.pathname).toBe("/v1/holdings");

    const seenManagers = captureGet("/v1/managers", []);
    await makeClient().holdings.managers();
    expect(seenManagers()!.pathname).toBe("/v1/managers");
  });

  it("congress exposes all four spec operations", async () => {
    const client = makeClient();

    const trades = captureGet("/v1/congress/trades", []);
    await client.congress.trades();
    expect(trades()!.pathname).toBe("/v1/congress/trades");

    const politicians = captureGet("/v1/congress/politicians", []);
    await client.congress.politicians();
    expect(politicians()!.pathname).toBe("/v1/congress/politicians");

    const politician = captureGet("/v1/congress/politicians/nancy-pelosi", {});
    await client.congress.politician("nancy-pelosi");
    expect(politician()!.pathname).toBe("/v1/congress/politicians/nancy-pelosi");

    const ticker = captureGet("/v1/congress/tickers/NVDA", {});
    await client.congress.ticker("NVDA");
    expect(ticker()!.pathname).toBe("/v1/congress/tickers/NVDA");
  });

  it("encodes path parameters rather than interpolating them raw", async () => {
    const seen = captureGet("/v1/congress/politicians/a%2Fb", {});
    await makeClient().congress.politician("a/b");
    // A raw interpolation would have produced /v1/congress/politicians/a/b and
    // silently hit a different route.
    expect(seen()!.pathname).toBe("/v1/congress/politicians/a%2Fb");
  });

  it("omits undefined params instead of sending the string 'undefined'", async () => {
    const seen = captureGet("/v1/form144", []);
    await makeClient().form144.list({ ticker: "AAPL", insider_name: undefined });

    expect(seen()!.searchParams.get("ticker")).toBe("AAPL");
    expect(seen()!.searchParams.has("insider_name")).toBe(false);
  });

  it("keeps the hand-written surface working alongside inherited methods", async () => {
    const client = makeClient();

    // Curated, hand-written — must not have been renamed by codegen.
    const get = captureGet("/v1/companies/AAPL", { ticker: "AAPL" });
    await client.companies.get("AAPL");
    expect(get()!.pathname).toBe("/v1/companies/AAPL");

    // Inherited from the generated base on the same object.
    const list = captureGet("/v1/companies", []);
    await client.companies.list();
    expect(list()!.pathname).toBe("/v1/companies");
  });

  it("exposes the previously unreachable paid-tier endpoints", async () => {
    const client = makeClient();

    const scorecard = captureGet("/v1/insiders/0001234567/scorecard", {});
    await client.insiders.scorecard("0001234567");
    expect(scorecard()!.pathname).toBe("/v1/insiders/0001234567/scorecard");

    const convergence = captureGet("/v1/signals/convergence", []);
    await client.signals.convergence();
    expect(convergence()!.pathname).toBe("/v1/signals/convergence");

    const sentiment = captureGet("/v1/signals/sentiment/NVDA", {});
    await client.signals.sentiment("NVDA");
    expect(sentiment()!.pathname).toBe("/v1/signals/sentiment/NVDA");
  });
});
