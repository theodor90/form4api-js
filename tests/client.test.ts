import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  Form4ApiClient,
  AuthError,
  PlanError,
  NotFoundError,
  RateLimitError,
  InsiderApiError,
} from "../src/index.js";

const BASE = "http://test.local";

const TRANSACTION = {
  ticker: "AAPL",
  companyName: "Apple Inc.",
  insiderName: "Tim Cook",
  insiderCik: "0001234567",
  insiderTitle: "Chief Executive Officer",
  isDirector: false,
  isOfficer: true,
  is10PctOwner: false,
  accessionNumber: "0000000001-25-000001",
  securityTitle: "Common Stock",
  transactionCode: "P",
  isOpenMarket: true,
  is10b5Plan: false,
  sharesAmount: 1000,
  pricePerShare: 175.5,
  totalValue: 175500,
  sharesOwnedAfter: 50000,
  directIndirect: "D",
  isDerivative: false,
  transactionDate: "2025-06-01T00:00:00",
  periodOfReport: "2025-05-31T00:00:00",
};

const INSIDER = {
  cik: "0001234567",
  name: "Tim Cook",
  isDirector: true,
  isOfficer: true,
  isTenPercentOwner: false,
  officerTitle: "CEO",
  totalFilings: 42,
};

const COMPANY = {
  cik: "0000320193",
  name: "Apple Inc.",
  ticker: "AAPL",
  exchange: "NASDAQ",
  totalFilings: 300,
  activeInsiders: 12,
  sicDescription: "Electronic Computers",
  stateOfIncorporation: "CA",
  website: null,
};

const SIGNAL = {
  ticker: "AAPL",
  companyName: "Apple Inc.",
  signalDate: "2025-06-01T00:00:00",
  buySellRatio: 3.0,
  isClusterBuy: true,
  isClusterSell: false,
  insiderCount: 4,
};

const WEBHOOK_CREATED = {
  subscriptionId: 1,
  url: "https://example.com/hook",
  eventTypes: ["TransactionFiled"],
  secret: "whsec_abc123",
  createdAt: "2025-06-01T00:00:00",
  warning: null,
};

const WEBHOOK_SUB = {
  subscriptionId: 1,
  url: "https://example.com/hook",
  eventTypes: ["TransactionFiled"],
  createdAt: "2025-06-01T00:00:00",
  isActive: true,
};

const WEBHOOK_EVENT = {
  deliveryId: 1,
  subscriptionId: 1,
  eventType: "TransactionFiled",
  attemptCount: 1,
  deliveredAt: "2025-06-01T00:00:01",
  nextRetryAt: null,
  lastStatusCode: 200,
  isDead: false,
  payload: "{}",
};

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new Form4ApiClient({ apiKey: "fapi_test", baseUrl: BASE });
}

// ── transactions ─────────────────────────────────────────────────────────────

describe("transactions", () => {
  it("list returns typed array", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () => HttpResponse.json([TRANSACTION])),
    );
    const client = makeClient();
    const result = await client.transactions.list({ ticker: "AAPL" });
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe("AAPL");
    expect(result[0].companyName).toBe("Apple Inc.");
    expect(result[0].transactionCode).toBe("P");
  });

  it("list sends X-Api-Key header", async () => {
    let capturedKey: string | null = null;
    server.use(
      http.get(`${BASE}/v1/transactions`, ({ request }) => {
        capturedKey = request.headers.get("x-api-key");
        return HttpResponse.json([]);
      }),
    );
    await makeClient().transactions.list();
    expect(capturedKey).toBe("fapi_test");
  });

  it("list returns new D1-D5 fields", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () => HttpResponse.json([TRANSACTION])),
    );
    const [txn] = await makeClient().transactions.list();
    expect(txn.isOpenMarket).toBe(true);
    expect(txn.is10b5Plan).toBe(false);
    expect(txn.totalValue).toBe(175500);
    expect(txn.insiderTitle).toBe("Chief Executive Officer");
    expect(txn.isDirector).toBe(false);
    expect(txn.isOfficer).toBe(true);
    expect(txn.is10PctOwner).toBe(false);
  });

  it("list forwards exclude10b5 filter", async () => {
    let url: URL | null = null;
    server.use(
      http.get(`${BASE}/v1/transactions`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );
    await makeClient().transactions.list({ exclude10b5: true });
    expect(url!.searchParams.get("exclude_10b5")).toBe("true");
  });

  it("list forwards granular filtering params as snake_case", async () => {
    let url: URL | null = null;
    server.use(
      http.get(`${BASE}/v1/transactions`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );
    await makeClient().transactions.list({
      codes: "P,S",
      excludeCodes: "A,M",
      category: "open_market",
      excludeCategory: "derivatives",
      excludeDerivative: true,
      significant: true,
      minValue: 100000,
      maxValue: 5000000,
      minShares: 100,
      maxShares: 10000,
    });
    expect(url!.searchParams.get("codes")).toBe("P,S");
    expect(url!.searchParams.get("exclude_codes")).toBe("A,M");
    expect(url!.searchParams.get("category")).toBe("open_market");
    expect(url!.searchParams.get("exclude_category")).toBe("derivatives");
    expect(url!.searchParams.get("exclude_derivative")).toBe("true");
    expect(url!.searchParams.get("significant")).toBe("true");
    expect(url!.searchParams.get("min_value")).toBe("100000");
    expect(url!.searchParams.get("max_value")).toBe("5000000");
    expect(url!.searchParams.get("min_shares")).toBe("100");
    expect(url!.searchParams.get("max_shares")).toBe("10000");
  });

  it("paginate yields pages until empty", async () => {
    let call = 0;
    server.use(
      http.get(`${BASE}/v1/transactions`, () => {
        call++;
        return HttpResponse.json(call === 1 ? [TRANSACTION] : []);
      }),
    );
    const pages: (typeof TRANSACTION)[][] = [];
    for await (const page of makeClient().transactions.paginate({ ticker: "AAPL", perPage: 1 })) {
      pages.push(page as never);
    }
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(1);
  });

  it("paginate stops when batch is smaller than perPage", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () => HttpResponse.json([TRANSACTION])),
    );
    const pages = [];
    for await (const page of makeClient().transactions.paginate({ perPage: 50 })) {
      pages.push(page);
    }
    expect(pages).toHaveLength(1);
  });
});

// ── insiders ──────────────────────────────────────────────────────────────────

describe("insiders", () => {
  it("get returns typed insider", async () => {
    server.use(
      http.get(`${BASE}/v1/insiders/0001234567`, () => HttpResponse.json(INSIDER)),
    );
    const result = await makeClient().insiders.get("0001234567");
    expect(result.name).toBe("Tim Cook");
    expect(result.isOfficer).toBe(true);
    expect(result.officerTitle).toBe("CEO");
  });

  it("transactions returns typed array", async () => {
    server.use(
      http.get(`${BASE}/v1/insiders/0001234567/transactions`, () =>
        HttpResponse.json([TRANSACTION]),
      ),
    );
    const result = await makeClient().insiders.transactions("0001234567");
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe("AAPL");
  });
});

// ── companies ─────────────────────────────────────────────────────────────────

describe("companies", () => {
  it("get returns typed company", async () => {
    server.use(
      http.get(`${BASE}/v1/companies/AAPL`, () => HttpResponse.json(COMPANY)),
    );
    const result = await makeClient().companies.get("AAPL");
    expect(result.ticker).toBe("AAPL");
    expect(result.totalFilings).toBe(300);
    expect(result.activeInsiders).toBe(12);
  });

  it("insiders returns typed array", async () => {
    server.use(
      http.get(`${BASE}/v1/companies/AAPL/insiders`, () => HttpResponse.json([INSIDER])),
    );
    const result = await makeClient().companies.insiders("AAPL");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Tim Cook");
  });
});

// ── signals ───────────────────────────────────────────────────────────────────

describe("signals", () => {
  it("list returns typed array", async () => {
    server.use(
      http.get(`${BASE}/v1/signals`, () => HttpResponse.json([SIGNAL])),
    );
    const result = await makeClient().signals.list({ ticker: "AAPL" });
    expect(result).toHaveLength(1);
    expect(result[0].isClusterBuy).toBe(true);
    expect(result[0].buySellRatio).toBe(3.0);
  });

  it("list forwards clusterBuy filter", async () => {
    let url: URL | null = null;
    server.use(
      http.get(`${BASE}/v1/signals`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );
    await makeClient().signals.list({ clusterBuy: true });
    expect(url!.searchParams.get("cluster_buy")).toBe("true");
  });

  it("list forwards clusterSell filter", async () => {
    let url: URL | null = null;
    server.use(
      http.get(`${BASE}/v1/signals`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([]);
      }),
    );
    await makeClient().signals.list({ clusterSell: true });
    expect(url!.searchParams.get("cluster_sell")).toBe("true");
  });

  it("paginate yields pages until empty", async () => {
    let call = 0;
    server.use(
      http.get(`${BASE}/v1/signals`, () => {
        call++;
        return HttpResponse.json(call === 1 ? [SIGNAL] : []);
      }),
    );
    const pages = [];
    for await (const page of makeClient().signals.paginate({ perPage: 1 })) {
      pages.push(page);
    }
    expect(pages).toHaveLength(1);
    expect(pages[0]).toHaveLength(1);
  });

  it("paginate stops when batch is smaller than perPage", async () => {
    server.use(
      http.get(`${BASE}/v1/signals`, () => HttpResponse.json([SIGNAL])),
    );
    const pages = [];
    for await (const page of makeClient().signals.paginate({ perPage: 100 })) {
      pages.push(page);
    }
    expect(pages).toHaveLength(1);
  });
});

// ── webhooks ──────────────────────────────────────────────────────────────────

describe("webhooks", () => {
  it("create returns typed response with secret", async () => {
    server.use(
      http.post(`${BASE}/v1/webhooks`, () => HttpResponse.json(WEBHOOK_CREATED)),
    );
    const result = await makeClient().webhooks.create("https://example.com/hook", [
      "TransactionFiled",
    ]);
    expect(result.subscriptionId).toBe(1);
    expect(result.secret).toBe("whsec_abc123");
  });

  it("list returns subscription array", async () => {
    server.use(
      http.get(`${BASE}/v1/webhooks`, () => HttpResponse.json([WEBHOOK_SUB])),
    );
    const result = await makeClient().webhooks.list();
    expect(result).toHaveLength(1);
    expect(result[0].isActive).toBe(true);
  });

  it("delete resolves without error on 204", async () => {
    server.use(
      http.delete(`${BASE}/v1/webhooks/1`, () => new HttpResponse(null, { status: 204 })),
    );
    await expect(makeClient().webhooks.delete(1)).resolves.toBeUndefined();
  });

  it("events returns typed array", async () => {
    server.use(
      http.get(`${BASE}/v1/webhooks/events`, () => HttpResponse.json([WEBHOOK_EVENT])),
    );
    const result = await makeClient().webhooks.events();
    expect(result).toHaveLength(1);
    expect(result[0].eventType).toBe("TransactionFiled");
    expect(result[0].isDead).toBe(false);
  });
});

// ── error handling ─────────────────────────────────────────────────────────────

describe("error handling", () => {
  it("401 throws AuthError", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () =>
        HttpResponse.json(
          { error: { code: "INVALID_API_KEY", message: "Invalid key" } },
          { status: 401 },
        ),
      ),
    );
    await expect(makeClient().transactions.list()).rejects.toThrow(AuthError);
  });

  it("402 throws PlanError", async () => {
    server.use(
      http.get(`${BASE}/v1/signals`, () =>
        HttpResponse.json(
          { error: { code: "PLAN_REQUIRED", message: "Business plan required" } },
          { status: 402 },
        ),
      ),
    );
    const err = await makeClient()
      .signals.list()
      .catch((e) => e);
    expect(err).toBeInstanceOf(PlanError);
    expect(err.statusCode).toBe(402);
  });

  it("404 throws NotFoundError", async () => {
    server.use(
      http.get(`${BASE}/v1/insiders/9999999999`, () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Not found" } },
          { status: 404 },
        ),
      ),
    );
    await expect(makeClient().insiders.get("9999999999")).rejects.toThrow(NotFoundError);
  });

  it("429 throws RateLimitError with retryAfter", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () =>
        HttpResponse.json(
          { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests" } },
          { status: 429, headers: { "Retry-After": "60" } },
        ),
      ),
    );
    const err = await makeClient()
      .transactions.list()
      .catch((e) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.retryAfter).toBe(60);
  });

  it("500 throws InsiderApiError", async () => {
    server.use(
      http.get(`${BASE}/v1/transactions`, () =>
        new HttpResponse("Internal error", { status: 500 }),
      ),
    );
    const err = await makeClient()
      .transactions.list()
      .catch((e) => e);
    expect(err).toBeInstanceOf(InsiderApiError);
    expect(err.statusCode).toBe(500);
  });
});
