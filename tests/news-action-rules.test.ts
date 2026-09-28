/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// What the news pipeline may do with a classified article: generic "news"
// items and police items that are not crimes are dropped (never queued);
// leaders / police / power always go to admin review, never to the tables.
import { describe, expect, it } from "vitest";
import { decideNewsAction, isCrimeCategory } from "@/lib/news-action-rules";

const base = { extractedData: {}, confidence: 0.95, isAboutDistrict: true };

describe("decideNewsAction", () => {
  it("skips articles not about the district or below 0.60", () => {
    expect(decideNewsAction({ ...base, targetModule: "alerts", isAboutDistrict: false }).kind).toBe("skip");
    expect(decideNewsAction({ ...base, targetModule: "alerts", isAboutDistrict: undefined }).kind).toBe("skip");
    expect(decideNewsAction({ ...base, targetModule: "alerts", confidence: 0.5 }).kind).toBe("skip");
  });

  it("never queues the generic news module", () => {
    expect(decideNewsAction({ ...base, targetModule: "news" })).toEqual({ kind: "drop", reason: "generic-news" });
    expect(decideNewsAction({ ...base, targetModule: "News", confidence: 0.7 })).toEqual({ kind: "drop", reason: "generic-news" });
  });

  it("queues every leader item, however confident — news never writes Leader rows", () => {
    const d = decideNewsAction({ ...base, targetModule: "leaders", extractedData: { personName: "D K Shivakumar", role: "Chief Minister", party: "BJP" } });
    expect(d).toEqual({ kind: "queue", reason: "review-only" });
    expect(decideNewsAction({ ...base, targetModule: "power" })).toEqual({ kind: "queue", reason: "review-only" });
  });

  it("queues every schemes item — a headline figure is not a district's beneficiary count", () => {
    // "9.8 crore farmers get PM Kisan instalment" is a national figure; it
    // used to overwrite Scheme.beneficiaryCount (and its source) at ≥ 0.85.
    const d = decideNewsAction({ ...base, targetModule: "schemes", extractedData: { schemeName: "PM Kisan", beneficiaryCount: 98_000_000 } });
    expect(d).toEqual({ kind: "queue", reason: "review-only" });
    expect(decideNewsAction({ ...base, targetModule: "Schemes", confidence: 0.99 })).toEqual({ kind: "queue", reason: "review-only" });
  });

  it("drops police items that are not crimes, queues real crime items", () => {
    for (const cat of ["transfer", "personnel reshuffle", "administrative", "staffing-shortage", "road_accident", "traffic violation", "lost-property", undefined, ""]) {
      expect(decideNewsAction({ ...base, targetModule: "police", extractedData: { crimeCategory: cat, count: 4 } }).kind, String(cat)).toBe("drop");
    }
    for (const cat of ["theft", "murder", "drug-trafficking", "cybercrime bomb threat", "POCSO (sexual offense against minors)", "vandalism"]) {
      expect(decideNewsAction({ ...base, targetModule: "police", extractedData: { crimeCategory: cat, count: 4 } }).kind, cat).toBe("queue");
    }
  });

  it("queues mid-confidence items and executes confident ones of other modules", () => {
    expect(decideNewsAction({ ...base, targetModule: "infrastructure", confidence: 0.7 })).toEqual({ kind: "queue", reason: "mid-confidence" });
    expect(decideNewsAction({ ...base, targetModule: "infrastructure" })).toEqual({ kind: "execute" });
  });
});

describe("isCrimeCategory", () => {
  it("tells crimes from police news that is not a crime", () => {
    expect(isCrimeCategory("attempted murder")).toBe(true);
    expect(isCrimeCategory("police establishment")).toBe(false);
    expect(isCrimeCategory("transfer of inspectors")).toBe(false);
    expect(isCrimeCategory(42)).toBe(false);
  });
});
