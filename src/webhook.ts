// Verifies webhook signatures with Web Crypto rather than node:crypto, because
// this package also runs in browsers and edge runtimes (Cloudflare Workers,
// Vercel Edge, Deno, Bun): a static `import "node:crypto"` here would break
// bundlers for every browser consumer of the client, which never calls this.
// The price is that verification is async (SubtleCrypto has no sync API).

type SubtleLike = {
  importKey(...args: unknown[]): Promise<unknown>;
  verify(...args: unknown[]): Promise<boolean>;
};

async function getSubtle(): Promise<SubtleLike> {
  const global = (globalThis as { crypto?: { subtle?: SubtleLike } }).crypto?.subtle;
  if (global) return global;
  // Node 18 only exposes Web Crypto as a global behind a flag. The specifier is
  // held in a variable so bundlers do not try to resolve it for browser builds.
  const specifier = "node:crypto";
  const mod = (await import(specifier)) as { webcrypto: { subtle: SubtleLike } };
  return mod.webcrypto.subtle;
}

const SIGNATURE_PATTERN = /^sha256=([0-9a-f]{64})$/;

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Verifies the `X-Insider-Signature` header on a webhook delivery.
 *
 * The header is `sha256=<lowercase hex HMAC-SHA256(secret, raw body)>`. Pass
 * the RAW request body exactly as received (string or bytes), not a
 * re-serialised JSON object, or the signature will not match. Resolves to
 * `false` for a missing or malformed header. The comparison is done by
 * `SubtleCrypto.verify`, which is constant-time.
 *
 * Async because it uses Web Crypto, so it also works in browsers and edge
 * runtimes. In Node it works on 20+ directly and on 18 via a `node:crypto`
 * fallback. Always `await` it: a bare `if (verifyWebhook(...))` is truthy.
 *
 * ```ts
 * const ok = await verifyWebhook(rawBody, req.headers["x-insider-signature"], process.env.WEBHOOK_SECRET!);
 * if (!ok) return res.status(401).end();
 * ```
 */
export async function verifyWebhook(
  rawBody: string | Uint8Array,
  signatureHeader: string | null | undefined,
  secret: string,
): Promise<boolean> {
  if (typeof signatureHeader !== "string") return false;
  const match = SIGNATURE_PATTERN.exec(signatureHeader);
  if (!match) return false;

  const encoder = new TextEncoder();
  const subtle = await getSubtle();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const data = typeof rawBody === "string" ? encoder.encode(rawBody) : rawBody;
  return subtle.verify("HMAC", key, hexToBytes(match[1]), data);
}
