import { createHmac } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Form4ApiClient, verifyWebhook } from "../src/index.js";

const BASE = "http://test.local";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new Form4ApiClient({ apiKey: "test-key", baseUrl: BASE, maxRetries: 0 });
}

function captureTransactions() {
  const seen: URL[] = [];
  server.use(
    http.get(`${BASE}/v1/transactions`, ({ request }) => {
      seen.push(new URL(request.url));
      return HttpResponse.json([]);
    }),
  );
  return seen;
}

describe("transactions.list new filters (1.8.0)", () => {
  it("sends return, trend, role and sort filters with the API's snake_case names", async () => {
    const seen = captureTransactions();
    await makeClient().transactions.list({
      minReturn1d: 0.01, maxReturn1d: 0.5,
      minReturn1w: 0.02, maxReturn1w: 0.6,
      minReturn1m: 0.03, maxReturn1m: 0.7,
      minReturn3m: 0.04, maxReturn3m: 0.8,
      minReturn6m: 0.05, maxReturn6m: 0.9,
      hasReturns: true,
      instOwnershipTrend: "increasing",
      role: "ten_percent_owner",
      sort: "value",
    });
    const q = seen[0].searchParams;
    expect(q.get("min_return_1d")).toBe("0.01");
    expect(q.get("max_return_1d")).toBe("0.5");
    expect(q.get("min_return_1w")).toBe("0.02");
    expect(q.get("max_return_1w")).toBe("0.6");
    expect(q.get("min_return_1m")).toBe("0.03");
    expect(q.get("max_return_1m")).toBe("0.7");
    expect(q.get("min_return_3m")).toBe("0.04");
    expect(q.get("max_return_3m")).toBe("0.8");
    expect(q.get("min_return_6m")).toBe("0.05");
    expect(q.get("max_return_6m")).toBe("0.9");
    expect(q.get("has_returns")).toBe("true");
    expect(q.get("inst_ownership_trend")).toBe("increasing");
    expect(q.get("role")).toBe("ten_percent_owner");
    expect(q.get("sort")).toBe("value");
  });

  it("sends a zero threshold and hasReturns=false rather than dropping them", async () => {
    const seen = captureTransactions();
    await makeClient().transactions.list({ minReturn3m: 0, hasReturns: false });
    expect(seen[0].searchParams.get("min_return_3m")).toBe("0");
    expect(seen[0].searchParams.get("has_returns")).toBe("false");
  });

  it("paginate forwards the new filters", async () => {
    const seen = captureTransactions();
    for await (const _page of makeClient().transactions.paginate({ sort: "value", role: "officer" })) {
      // an empty first page ends iteration
    }
    expect(seen).toHaveLength(1);
    expect(seen[0].searchParams.get("sort")).toBe("value");
    expect(seen[0].searchParams.get("role")).toBe("officer");
  });
});

describe("webhooks (1.8.0)", () => {
  it("create sends authHeader only when given", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${BASE}/v1/webhooks`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          subscriptionId: 1, url: "https://x.test/h", eventTypes: [], secret: "s", createdAt: "", warning: null,
        });
      }),
    );
    await makeClient().webhooks.create("https://x.test/h", ["ClusterBuy"]);
    await makeClient().webhooks.create("https://x.test/h", ["ClusterBuy"], {
      authHeader: { name: "Authorization", value: "Bearer t" },
    });
    expect(bodies[0]).toEqual({ url: "https://x.test/h", eventTypes: ["ClusterBuy"] });
    expect(bodies[1]).toEqual({
      url: "https://x.test/h",
      eventTypes: ["ClusterBuy"],
      authHeader: { name: "Authorization", value: "Bearer t" },
    });
  });

  it("list exposes the delivery-health fields", async () => {
    server.use(
      http.get(`${BASE}/v1/webhooks`, () =>
        HttpResponse.json([
          {
            subscriptionId: 7, url: "https://x.test/h", eventTypes: ["ClusterBuy"],
            createdAt: "2026-10-01T00:00:00", isActive: false, isReadOnly: false,
            disabledAt: "2026-10-05T00:00:00", disabledReason: "delivery_failures",
            lastAttemptAt: "2026-10-05T00:00:00", lastSuccessAt: null,
            lastStatusCode: 503, lastErrorClass: "HTTP_5XX", authHeaderName: "Authorization",
          },
        ]),
      ),
    );
    const [sub] = await makeClient().webhooks.list();
    expect(sub.disabledReason).toBe("delivery_failures");
    expect(sub.lastStatusCode).toBe(503);
    expect(sub.lastErrorClass).toBe("HTTP_5XX");
    expect(sub.authHeaderName).toBe("Authorization");
  });

  it("enable POSTs to /enable", async () => {
    server.use(
      http.post(`${BASE}/v1/webhooks/7/enable`, () => HttpResponse.json({ subscriptionId: 7, isActive: true })),
    );
    expect(await makeClient().webhooks.enable(7)).toEqual({ subscriptionId: 7, isActive: true });
  });

  it("test POSTs to /test and returns a failed send as data, not an error", async () => {
    server.use(
      http.post(`${BASE}/v1/webhooks/7/test`, () =>
        HttpResponse.json({ delivered: false, statusCode: 0, durationMs: 12, error: "NETWORK_ERROR" }),
      ),
    );
    const r = await makeClient().webhooks.test(7);
    expect(r.delivered).toBe(false);
    expect(r.error).toBe("NETWORK_ERROR");
  });

  it("setAuthHeader PUTs name and value", async () => {
    let body: unknown;
    server.use(
      http.put(`${BASE}/v1/webhooks/7/auth-header`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ subscriptionId: 7, authHeaderName: "Authorization" });
      }),
    );
    const r = await makeClient().webhooks.setAuthHeader(7, { name: "Authorization", value: "Bearer t" });
    expect(body).toEqual({ name: "Authorization", value: "Bearer t" });
    expect(r).toEqual({ subscriptionId: 7, authHeaderName: "Authorization" });
  });

  it("deleteAuthHeader resolves on 204 without parsing a body", async () => {
    server.use(
      http.delete(`${BASE}/v1/webhooks/7/auth-header`, () => new HttpResponse(null, { status: 204 })),
    );
    await expect(makeClient().webhooks.deleteAuthHeader(7)).resolves.toBeUndefined();
  });

  it("setAuthHeader surfaces a 400 as an error", async () => {
    server.use(
      http.put(`${BASE}/v1/webhooks/7/auth-header`, () =>
        HttpResponse.json({ error: { code: "INVALID_AUTH_HEADER", message: "reserved" } }, { status: 400 }),
      ),
    );
    await expect(
      makeClient().webhooks.setAuthHeader(7, { name: "Host", value: "x" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("ownership (1.8.0)", () => {
  it("ownership.schedule13dg hits /v1/ownership/13d-13g and forwards filters", async () => {
    let url: URL | undefined;
    server.use(
      http.get(`${BASE}/v1/ownership/13d-13g`, ({ request }) => {
        url = new URL(request.url);
        return HttpResponse.json([{ accessionNumber: "0001-26-000001" }]);
      }),
    );
    const res = await makeClient().ownership.schedule13dg({ ticker: "AAPL", form_type: "13D", is_amendment: false });
    expect(res).toHaveLength(1);
    expect(url!.pathname).toBe("/v1/ownership/13d-13g");
    expect(url!.searchParams.get("ticker")).toBe("AAPL");
    expect(url!.searchParams.get("form_type")).toBe("13D");
    expect(url!.searchParams.get("is_amendment")).toBe("false");
  });
});

describe("verifyWebhook", () => {
  const secret = "whsec_test";
  const body = '{"FilingId":1,"AccessionNumber":"0001-26-000001"}';
  const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");

  it("accepts a valid signature for a string or Buffer body", async () => {
    expect(await verifyWebhook(body, sig, secret)).toBe(true);
    expect(await verifyWebhook(Buffer.from(body), sig, secret)).toBe(true);
  });

  it("rejects a tampered body, wrong secret, and malformed or missing headers", async () => {
    expect(await verifyWebhook(body + " ", sig, secret)).toBe(false);
    expect(await verifyWebhook(body, sig, "other")).toBe(false);
    expect(await verifyWebhook(body, sig.slice(7), secret)).toBe(false);
    expect(await verifyWebhook(body, "", secret)).toBe(false);
    expect(await verifyWebhook(body, undefined, secret)).toBe(false);
    expect(await verifyWebhook(body, sig.toUpperCase(), secret)).toBe(false);
    expect(await verifyWebhook(body, sig + "00", secret)).toBe(false);
  });
});
