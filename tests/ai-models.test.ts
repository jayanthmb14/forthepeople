/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Model chain rules (src/lib/ai-models.ts): which models a call may try,
// in what order, and the rule that the paid backstop keeps the last slot.
import { describe, expect, it } from "vitest";
import {
  ALL_CHAIN_MODELS,
  FACT_CHECK_MODELS,
  TIER1_FREE_MODELS,
  TIER1_PAID_BACKSTOP,
  TIER2_MODELS,
  estimateCost,
  findExpiringModels,
  getModelForPurpose,
  planChain,
  selectChain,
  tierForPurpose,
} from "@/lib/ai-models";

const none = new Set<string>();

describe("tierForPurpose / getModelForPurpose", () => {
  it("routes purposes to tiers", () => {
    expect(tierForPurpose("news-analysis")).toBe("tier1");
    expect(tierForPurpose("classify")).toBe("tier1");
    expect(tierForPurpose("something-new")).toBe("tier1");
    expect(tierForPurpose("insight")).toBe("tier2");
    expect(tierForPurpose("document-large")).toBe("tier2");
    expect(tierForPurpose("fact-check")).toBe("fact-check");
  });

  it("names the first model of each tier", () => {
    expect(getModelForPurpose("news-analysis")).toBe("typesafe/jev-router");
    expect(getModelForPurpose("insight")).toBe("openai/gpt-5.6-luna");
    expect(getModelForPurpose("fact-check")).toBe("anthropic/claude-sonnet-5");
  });
});

describe("planChain + selectChain", () => {
  it("tier 1 without paid fallback: the free models in order", () => {
    const chain = selectChain(planChain("news-analysis", { paidFallback: false }), { live: null, broken: none });
    expect(chain).toEqual([...TIER1_FREE_MODELS]);
    expect(chain).not.toContain(TIER1_PAID_BACKSTOP);
  });

  it("tier 1 with paid fallback: the paid backstop keeps the LAST slot even under the cap", () => {
    const chain = selectChain(planChain("news-analysis", { paidFallback: true }), { live: null, broken: none });
    expect(chain).toHaveLength(4);
    expect(chain[chain.length - 1]).toBe(TIER1_PAID_BACKSTOP);
    expect(chain.slice(0, 3)).toEqual(TIER1_FREE_MODELS.slice(0, 3));
  });

  it("the paid backstop is reachable even when every free model is broken", () => {
    const broken = new Set<string>(TIER1_FREE_MODELS);
    const chain = selectChain(planChain("classify", { paidFallback: true }), { live: null, broken });
    expect(chain).toEqual([TIER1_PAID_BACKSTOP]);
  });

  it("skips circuit-broken and non-live models", () => {
    const live = new Set<string>([...ALL_CHAIN_MODELS].filter((m) => m !== "openrouter/free"));
    const broken = new Set<string>(["typesafe/jev-router"]);
    const chain = selectChain(planChain("news-analysis", { paidFallback: false }), { live, broken });
    expect(chain).toEqual(["google/gemma-4-26b-a4b-it:free"]);
  });

  it("tier 2 tries luna, then flash-lite, then the free chain", () => {
    const chain = selectChain(planChain("insight", { paidFallback: false }), { live: null, broken: none });
    expect(chain.slice(0, 2)).toEqual([...TIER2_MODELS]);
    expect(chain[2]).toBe(TIER1_FREE_MODELS[0]);
    expect(chain).toHaveLength(4);
  });

  it("fact-check never falls back to a free model", () => {
    const chain = selectChain(planChain("fact-check", { paidFallback: true }), { live: null, broken: none });
    expect(chain).toEqual([...FACT_CHECK_MODELS]);
    expect(chain.some((m) => m.endsWith(":free") || m === "openrouter/free")).toBe(false);
  });

  it("a pinned model goes first and survives discovery", () => {
    const pinned = "some/brand-new-model";
    const plan = planChain("news-analysis", { paidFallback: false, pinned });
    const chain = selectChain(plan, { live: new Set<string>(TIER1_FREE_MODELS), broken: none, pinned });
    expect(chain[0]).toBe(pinned);
    expect(chain).toHaveLength(4);
  });

  it("returns an empty chain when nothing is usable", () => {
    const chain = selectChain(planChain("news-analysis", { paidFallback: false }), {
      live: new Set<string>(),
      broken: none,
    });
    expect(chain).toEqual([]);
  });
});

describe("findExpiringModels", () => {
  const now = new Date("2026-09-27T12:00:00Z");

  it("flags models expiring within 30 days, soonest first", () => {
    const out = findExpiringModels(
      ["a", "b", "c", "d"],
      { a: "2026-10-20", b: "2026-12-31", c: "2026-10-01", d: null },
      now,
    );
    expect(out.map((e) => e.model)).toEqual(["c", "a"]);
    expect(out[1]).toEqual({ model: "a", expiresOn: "2026-10-20", daysLeft: 22 });
  });

  it("includes models already past their date and ignores bad dates", () => {
    const out = findExpiringModels(["x", "y"], { x: "2026-09-01", y: "not-a-date" }, now);
    expect(out).toHaveLength(1);
    expect(out[0].daysLeft).toBeLessThan(0);
  });

  it("no chain model has a known expiry today", () => {
    expect(findExpiringModels(ALL_CHAIN_MODELS, {}, now)).toEqual([]);
  });
});

describe("estimateCost", () => {
  it("prices paid models and returns 0 for free or unknown ones", () => {
    const usage = { prompt_tokens: 1_000_000, completion_tokens: 1_000_000, total_tokens: 2_000_000 };
    expect(estimateCost("google/gemini-3.1-flash-lite", usage).usd).toBeCloseTo(1.75);
    expect(estimateCost("google/gemma-4-26b-a4b-it:free", usage).usd).toBe(0);
    expect(estimateCost("unknown/model", usage).usd).toBe(0);
    expect(estimateCost("openai/gpt-oss-20b", undefined)).toEqual({ usd: 0, inr: 0 });
  });
});
