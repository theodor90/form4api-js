import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
// @ts-expect-error - plain .mjs helper shared with scripts/release-check.mjs, no type declarations
import { validateResponse, responseSchemaFor } from "../scripts/lib/contract.mjs";

/**
 * Offline test of the validator behind release:check stage 6 (live contract).
 *
 * The live stage needs an API key and so cannot run in CI. This test proves the
 * validator itself would have caught the drift that motivated it: on 2026-10-05
 * `disclosureLagDays` became nullable on the live API. A spec in which that
 * field is NOT nullable must reject a row carrying `null`; the real
 * (nullable) spec must accept it.
 */
const read = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

const PATH = "/v1/congress/trades";

describe("live-contract validator", () => {
  const spec = read("congress-spec.json");
  const rows = read("congress-row-null-lag.json");

  it("accepts a row with disclosureLagDays null when the spec says nullable, and ignores extra fields", () => {
    const r = validateResponse(spec, "GET", PATH, rows);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("FAILS the same row against a spec copy where disclosureLagDays is not nullable", () => {
    const strict = structuredClone(spec);
    delete strict.components.schemas.CongressTradeDto.properties.disclosureLagDays.nullable;
    const r = validateResponse(strict, "GET", PATH, rows);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/disclosureLagDays: must be integer/);
  });

  it("is strict about types: a string where an integer is declared fails", () => {
    const bad = structuredClone(rows);
    bad[0].disclosureLagDays = "12";
    expect(validateResponse(spec, "GET", PATH, bad).ok).toBe(false);
  });

  it("is strict about presence: a missing required field fails", () => {
    const bad = structuredClone(rows);
    delete bad[0].dateQuality;
    const r = validateResponse(spec, "GET", PATH, bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join("\n")).toMatch(/dateQuality/);
  });

  it("errors clearly for an operation that is missing or has no 200 schema", () => {
    expect(() => responseSchemaFor(spec, "GET", "/v1/nope")).toThrow(/not in the spec/);
    const noSchema = structuredClone(spec);
    noSchema.paths[PATH].get.responses["200"] = { description: "OK" };
    expect(() => responseSchemaFor(noSchema, "GET", PATH)).toThrow(/no 200 application\/json schema/);
  });
});
