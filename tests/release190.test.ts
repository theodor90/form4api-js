import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Form4ApiClient, InsiderApiError, NotFoundError } from "../src/index.js";

const BASE = "http://test.local";
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function makeClient() {
  return new Form4ApiClient({ apiKey: "test-key", baseUrl: BASE, maxRetries: 0 });
}

const ROW = {
  subscriptionId: 7,
  url: "https://example.com/hook",
  eventTypes: ["TransactionFiled"],
  createdAt: "2026-10-01T00:00:00Z",
  isActive: false,
  isReadOnly: false,
  disabledAt: "2026-10-05T00:00:00Z",
  disabledReason: "delivery_failures",
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastStatusCode: null,
  lastErrorClass: null,
  authHeaderName: null,
  urlWarning: null,
};

describe("webhooks.update (1.9.0)", () => {
  it("sends PATCH with {url} to the subscription path and returns the parsed row", async () => {
    let method = "";
    let path = "";
    let body: unknown;
    let contentType: string | null = null;
    server.use(
      http.patch(`${BASE}/v1/webhooks/:id`, async ({ request, params }) => {
        method = request.method;
        path = new URL(request.url).pathname;
        contentType = request.headers.get("content-type");
        body = await request.json();
        expect(params["id"]).toBe("7");
        return HttpResponse.json({ ...ROW, url: "https://abc.ngrok.io/h", urlWarning: "Temporary tunnel host" });
      }),
    );
    const sub = await makeClient().webhooks.update(7, "https://abc.ngrok.io/h");
    expect(method).toBe("PATCH");
    expect(path).toBe("/v1/webhooks/7");
    expect(contentType).toContain("application/json");
    expect(body).toEqual({ url: "https://abc.ngrok.io/h" });
    expect(sub.subscriptionId).toBe(7);
    expect(sub.url).toBe("https://abc.ngrok.io/h");
    expect(sub.urlWarning).toBe("Temporary tunnel host");
    expect(sub.disabledReason).toBe("delivery_failures");
    expect(sub.lastAttemptAt).toBeNull();
  });

  it("raises InsiderApiError with the error code on a 400", async () => {
    server.use(
      http.patch(`${BASE}/v1/webhooks/:id`, () =>
        HttpResponse.json(
          { error: { code: "INSECURE_URL", message: "URL must use HTTPS" } },
          { status: 400 },
        ),
      ),
    );
    const err = await makeClient()
      .webhooks.update(7, "http://example.com/h")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(InsiderApiError);
    expect((err as InsiderApiError).statusCode).toBe(400);
    expect((err as InsiderApiError).errorCode).toBe("INSECURE_URL");
  });

  it("raises NotFoundError on a 404", async () => {
    server.use(
      http.patch(`${BASE}/v1/webhooks/:id`, () =>
        HttpResponse.json({ error: { code: "NOT_FOUND", message: "nope" } }, { status: 404 }),
      ),
    );
    await expect(makeClient().webhooks.update(99, "https://example.com/h")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});

describe("urlWarning (1.9.0)", () => {
  it("is present on the create response", async () => {
    server.use(
      http.post(`${BASE}/v1/webhooks`, () =>
        HttpResponse.json({
          subscriptionId: 8,
          url: "https://x.trycloudflare.com/h",
          eventTypes: ["ClusterBuy"],
          secret: "s",
          createdAt: "2026-10-13T00:00:00Z",
          warning: "Store the secret securely",
          urlWarning: "Temporary tunnel host",
        }),
      ),
    );
    const created = await makeClient().webhooks.create("https://x.trycloudflare.com/h", ["ClusterBuy"]);
    expect(created.urlWarning).toBe("Temporary tunnel host");
  });

  it("is present (string and null) on list items", async () => {
    server.use(
      http.get(`${BASE}/v1/webhooks`, () =>
        HttpResponse.json([{ ...ROW, urlWarning: "Temporary tunnel host" }, { ...ROW, subscriptionId: 9 }]),
      ),
    );
    const subs = await makeClient().webhooks.list();
    expect(subs[0].urlWarning).toBe("Temporary tunnel host");
    expect(subs[1].urlWarning).toBeNull();
  });
});
