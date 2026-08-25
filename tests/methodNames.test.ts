import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// The generator derives a method name when METHOD_NAME_OVERRIDES has no entry,
// instead of throwing as it used to. That throw is why this SDK could not
// regenerate at all between 2026-08-04 (/v1/filings) and 2026-08-25
// (/v1/insiders/directory) — a new backend endpoint took codegen down until
// someone hand-added a line, and with CI billing-blocked nobody saw it.
//
// So the rule is now load-bearing and lives here rather than only inside the
// generator. Deriving a name wrong is worse than not deriving one: the method
// ships, someone imports it, and correcting it later is a breaking rename.
// @ts-expect-error - plain .mjs codegen helper, no type declarations
import { deriveMethodName } from "../codegen/methodName.mjs";

describe("deriveMethodName", () => {
  it("drops the resource, because the method already lives on it", () => {
    // filings.getRecentFilings() says "filings" twice.
    expect(deriveMethodName("GetRecentFilings", "filings")).toBe("recent");
    expect(deriveMethodName("GetInsiderScorecard", "insiders")).toBe("scorecard");
    expect(deriveMethodName("GetConvergenceSignals", "signals")).toBe("convergence");
    expect(deriveMethodName("GetStatusHistory", "status")).toBe("history");
  });

  it("falls back to the verb when the resource was the whole name", () => {
    // What makes companies.list() and filings.get() read correctly.
    expect(deriveMethodName("ListCompanies", "companies")).toBe("list");
    expect(deriveMethodName("ListInsiders", "insiders")).toBe("list");
    expect(deriveMethodName("GetFiling", "filings")).toBe("get");
    expect(deriveMethodName("GetDataQuality", "dataQuality")).toBe("get");
  });

  it("derives the two endpoints that had been breaking codegen", () => {
    expect(deriveMethodName("ListFilings", "filings")).toBe("list");
    expect(deriveMethodName("GetInsiderDirectory", "insiders")).toBe("directory");
  });

  it("matches on exact or simple plural only, never a prefix", () => {
    // A looser test would strip "Sentiment" for a resource called "signals"
    // and collapse two different endpoints onto signals.get().
    expect(deriveMethodName("GetSentiment", "signals")).toBe("sentiment");
    expect(deriveMethodName("ListManagers", "holdings")).toBe("managers");
  });

  it("handles a resource carrying digits", () => {
    expect(deriveMethodName("ListForm144", "form144")).toBe("list");
  });

  it("camelCases a multi-word remainder", () => {
    expect(deriveMethodName("GetCongressTickerRollup", "congress")).toBe("tickerRollup");
  });
});

describe("already-published names stay pinned", () => {
  // Every name that has shipped is kept as an explicit override even where the
  // derived value agrees, so no upstream operationId rename can quietly change
  // a method someone has already imported. Two of these would derive to
  // something else entirely, which is the case the override list exists for.
  const source = readFileSync(join("codegen", "generate.mjs"), "utf8");
  const overrides = source.slice(source.indexOf("const METHOD_NAME_OVERRIDES"));
  const block = overrides.slice(0, overrides.indexOf("\n}"));

  it("keeps the two names the derivation would get wrong", () => {
    expect(block).toContain("GetCongressTickerRollup: 'ticker'");
    expect(block).toContain("GetPublicStats: 'get'");
  });

  it("still pins every previously published name", () => {
    for (const id of [
      "ListCompanies",
      "ListCongressTrades",
      "GetInsiderLeaderboard",
      "ListHoldings",
      "ExplainSignal",
      "GetSentiment",
    ]) {
      expect(block, `${id} must stay pinned`).toContain(`${id}:`);
    }
  });
});
