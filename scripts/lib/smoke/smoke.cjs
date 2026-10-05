// Stage 5b: CommonJS consumer, run inside the temp project against the INSTALLED package.
const { createServer } = require("node:http");
const { Form4ApiClient, AuthError, RateLimitError, InsiderApiError } = require("form4api");

const expected = process.env.EXPECTED_VERSION;
const installed = require("./node_modules/form4api/package.json").version;

async function main() {
  if (installed !== expected) throw new Error(`installed package.json says ${installed}, expected ${expected}`);
  if (typeof Form4ApiClient !== "function") throw new Error("Form4ApiClient is not exported as a class (CJS)");
  for (const E of [AuthError, RateLimitError, InsiderApiError]) {
    if (typeof E !== "function") throw new Error("an error class is not exported (CJS)");
  }

  let ua = null;
  const server = createServer((req, res) => {
    ua = req.headers["user-agent"] || null;
    res.setHeader("content-type", "application/json");
    res.end("[]");
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  try {
    const { port } = server.address();
    const client = new Form4ApiClient({ apiKey: "smoke", baseUrl: `http://127.0.0.1:${port}`, maxRetries: 0 });
    const rows = await client.transactions.list({ ticker: "AAPL" });
    if (!Array.isArray(rows)) throw new Error("transactions.list did not return an array");
  } finally {
    server.close();
  }
  if (ua !== `form4api-js/${expected}`) throw new Error(`User-Agent was ${JSON.stringify(ua)}, expected form4api-js/${expected}`);
  console.log(`cjs ok: form4api ${installed}, User-Agent ${ua}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
