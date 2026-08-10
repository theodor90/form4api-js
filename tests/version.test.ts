import { readFileSync } from "node:fs";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import { SDK_VERSION } from "../src/version.js";
import { Form4ApiClient } from "../src/index.js";

/**
 * The SDK sends `User-Agent: form4api-js/<version>` so the backend can attribute
 * traffic to the JS SDK channel and answer "who is still on an old version"
 * before a breaking change.
 *
 * That is only useful if the version is TRUE. It previously was not: the
 * constant was hand-maintained with a comment asking the releaser to keep it in
 * sync with package.json, and it drifted — the code said 1.1.3 while the
 * published package was 1.2.0. Nothing caught it, because the one signal that
 * would have (the admin client-versions view) shows nothing for a client that
 * has never appeared in production traffic at all.
 *
 * `codegen/version.mjs` now generates it on every build. These tests cover the
 * remaining gap: a committed `src/version.ts` that has gone stale between
 * builds, and a User-Agent that stops being sent.
 */
const BASE = "http://version-test.local";

describe("SDK version reporting", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  let seenUserAgent: string | null = null;

  const server = setupServer(
    http.get(`${BASE}/v1/transactions`, ({ request }) => {
      seenUserAgent = request.headers.get("User-Agent");
      return HttpResponse.json([]);
    }),
  );

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    seenUserAgent = null;
  });
  afterAll(() => server.close());

  it("matches the version in package.json", () => {
    expect(SDK_VERSION).toBe(pkg.version);
  });

  it("is a strict major.minor.patch the backend can parse", () => {
    // The backend accepts exactly three numeric segments of 1-3 digits and
    // stores anything else as a null version — which silently drops the release
    // from the upgrade-notification list rather than failing loudly.
    expect(SDK_VERSION).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  it("is sent as the User-Agent on every request", async () => {
    const client = new Form4ApiClient({ apiKey: "test-key", baseUrl: BASE });

    await client.transactions.list({ ticker: "AAPL" });

    expect(seenUserAgent).toBe(`form4api-js/${pkg.version}`);
  });
});
