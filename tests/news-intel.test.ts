/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// News intelligence planning + answer parsing (src/lib/news-intel.ts).
import { describe, expect, it } from "vitest";
import {
  NEWS_INTEL_MODULES,
  buildNewsIntelPrompt,
  parseNewsIntelAnswer,
  planNewsIntelRun,
} from "@/lib/news-intel";

const d = (iso: string) => new Date(iso);

describe("planNewsIntelRun", () => {
  it("skips districts without news newer than their last success", () => {
    const plan = planNewsIntelRun(
      ["a", "b", "c", "d"],
      new Map([
        ["a", d("2026-09-27T06:00:00Z")],
        ["b", d("2026-09-27T06:00:00Z")],
        ["c", d("2026-09-27T06:00:00Z")],
      ]),
      new Map([
        ["a", d("2026-09-27T08:00:00Z")], // analysed after the news -> skip
        ["b", d("2026-09-26T08:00:00Z")], // news is newer -> work
      ]),
      new Map(),
    );
    expect(plan.noNewNews.sort()).toEqual(["a", "d"]);
    expect(plan.order.sort()).toEqual(["b", "c"]);
  });

  it("orders least-recently-attempted first; never-attempted before all", () => {
    const news = new Map(["a", "b", "c"].map((id) => [id, d("2026-09-27T06:00:00Z")]));
    const plan = planNewsIntelRun(
      ["a", "b", "c"],
      news,
      new Map(),
      new Map([
        ["a", d("2026-09-27T04:00:00Z")],
        ["b", d("2026-09-20T04:00:00Z")],
      ]),
    );
    expect(plan.order).toEqual(["c", "b", "a"]);
  });
});

describe("parseNewsIntelAnswer", () => {
  const ids = ["n1", "n2", "n3"];

  it("reads {insights:{module:{…}}} and maps indices to news ids", () => {
    const out = parseNewsIntelAnswer(
      {
        insights: {
          water: { headline: "KRS dam nears full", summary: "Storage is high.", sentiment: "positive", confidence: 0.9, relevantNewsIndices: [2, 2, 9] },
          crops: { headline: "Tomato prices fall", summary: "Farmers affected.", sentiment: "negative", confidence: "0.7", relevantNewsIndices: ["1"] },
        },
      },
      NEWS_INTEL_MODULES,
      ids,
    );
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ module: "water", newsIds: ["n2"], sentiment: "positive", confidence: 0.9 });
    expect(out[1]).toMatchObject({ module: "crops", newsIds: ["n1"], confidence: 0.7 });
  });

  it("accepts an array form and top-level module keys", () => {
    const arr = parseNewsIntelAnswer(
      { insights: [{ module: "Power", headline: "Outage", summary: "Planned cut.", relevantNewsIndices: [3] }] },
      NEWS_INTEL_MODULES,
      ids,
    );
    expect(arr.map((i) => i.module)).toEqual(["power"]);
    expect(arr[0].sentiment).toBe("neutral");
    expect(arr[0].confidence).toBe(0.5);

    const top = parseNewsIntelAnswer(
      { health: { headline: "Dengue up", summary: "Cases rise.", relevantNewsIndices: [1] } },
      NEWS_INTEL_MODULES,
      ids,
    );
    expect(top.map((i) => i.module)).toEqual(["health"]);
  });

  it("drops unknown modules, sourceless entries and empty text", () => {
    const out = parseNewsIntelAnswer(
      {
        insights: {
          sports: { headline: "x", summary: "y", relevantNewsIndices: [1] },
          water: { headline: "x", summary: "y", relevantNewsIndices: [] },
          crops: { headline: "", summary: "y", relevantNewsIndices: [1] },
          police: { noRelevantNews: true },
        },
      },
      NEWS_INTEL_MODULES,
      ids,
    );
    expect(out).toEqual([]);
  });

  it("returns [] for non-objects and an empty answer", () => {
    expect(parseNewsIntelAnswer(null, NEWS_INTEL_MODULES, ids)).toEqual([]);
    expect(parseNewsIntelAnswer([1, 2], NEWS_INTEL_MODULES, ids)).toEqual([]);
    expect(parseNewsIntelAnswer({ insights: {} }, NEWS_INTEL_MODULES, ids)).toEqual([]);
  });
});

describe("buildNewsIntelPrompt", () => {
  it("numbers the articles and names district, state and every module", () => {
    const { systemPrompt, userPrompt } = buildNewsIntelPrompt({
      districtName: "Pune",
      stateName: "Maharashtra",
      modules: NEWS_INTEL_MODULES,
      articles: [
        { id: "a", title: "Water cut in Kothrud", url: "u1" },
        { id: "b", title: "PMC budget", summary: "Details", url: "u2" },
      ],
      contextLines: [],
    });
    expect(systemPrompt).toContain("Pune district, Maharashtra");
    expect(userPrompt).toContain("[1] Water cut in Kothrud");
    expect(userPrompt).toContain("[2] PMC budget\nDetails");
    for (const m of NEWS_INTEL_MODULES) expect(userPrompt).toContain(m);
  });
});
