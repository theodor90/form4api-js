// Validates a parsed API response against the 200-response schema of one
// operation in an OpenAPI 3.0 spec.
//
// Used by scripts/release-check.mjs (stage 6, live) and by
// tests/contract.test.ts (offline, against a fixture), so the validator that
// guards a release is itself covered by a test that runs in CI without a key.
//
// Rules:
//  - Strict about types and nullability: no coercion, `nullable: true` is the
//    ONLY way null is accepted, and every `required` property must be present.
//  - Additional properties are allowed (the API may grow fields; the SDK must
//    not break on them).
//  - `$ref` into #/components/schemas is resolved by embedding `components`
//    in the root schema handed to ajv.
//  - Unknown `format`s are ignored, known ones (date-time, int32, int64, ...)
//    are checked via ajv-formats.
import Ajv from "ajv";
import addFormats from "ajv-formats";

/** Returns the 200 JSON schema for `VERB /path`, or throws a clear error. */
export function responseSchemaFor(spec, verb, path) {
  const op = spec?.paths?.[path]?.[verb.toLowerCase()];
  if (!op) throw new Error(`operation ${verb.toUpperCase()} ${path} is not in the spec`);
  const schema = op.responses?.["200"]?.content?.["application/json"]?.schema;
  if (!schema) {
    throw new Error(
      `operation ${verb.toUpperCase()} ${path} (${op.operationId ?? "?"}) declares no 200 application/json schema in the spec, so its response cannot be contract-checked`,
    );
  }
  return schema;
}

/**
 * @param {object} spec  parsed OpenAPI document
 * @param {string} verb  e.g. "GET"
 * @param {string} path  OpenAPI path template, e.g. "/v1/companies/{ticker}"
 * @param {unknown} data parsed response body
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateResponse(spec, verb, path, data) {
  const schema = responseSchemaFor(spec, verb, path);
  const ajv = new Ajv({
    allErrors: true,
    strict: false, // OpenAPI-only keywords (example, xml, ...) and the embedded `components`
    coerceTypes: false,
  });
  addFormats(ajv);
  const root = { ...schema, components: spec.components ?? {} };
  const validate = ajv.compile(root);
  const ok = validate(data);
  if (ok) return { ok: true, errors: [] };
  const errors = (validate.errors ?? []).map((e) => {
    const where = e.instancePath || "(root)";
    const extra = e.params && Object.keys(e.params).length ? ` ${JSON.stringify(e.params)}` : "";
    return `${where}: ${e.message}${extra}`;
  });
  return { ok: false, errors };
}
