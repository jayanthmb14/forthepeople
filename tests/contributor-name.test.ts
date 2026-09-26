/**
 * Unit tests for src/lib/validators/contributor-name.ts — the name filter
 * used by payment verify, admin supporter create and community suggestions.
 */
import { describe, it, expect } from "vitest";
import { validateContributorName } from "@/lib/validators/contributor-name";

describe("validateContributorName", () => {
  it("accepts a normal personal name and collapses whitespace", () => {
    expect(validateContributorName("Jayanth M B")).toEqual({ ok: true, cleaned: "Jayanth M B" });
    expect(validateContributorName("  Ravi   Kumar ")).toEqual({ ok: true, cleaned: "Ravi Kumar" });
  });

  it("accepts Indic letters, hyphens, apostrophes and periods", () => {
    // Names made only of base letters (Unicode \p{L}) pass today.
    expect(validateContributorName("ಕಮಲ").ok).toBe(true); // Kannada: ka-ma-la
    expect(validateContributorName("कमल").ok).toBe(true); // Devanagari: ka-ma-la
    expect(validateContributorName("Mary-Ann O'Neil Jr.").ok).toBe(true);
  });

  // KNOWN BUG (found while writing these tests, 2026-09-27): NAME_REGEX only
  // allows \p{L}, so any Indic name that uses a vowel sign / matra (\p{M}) —
  // e.g. "ರವಿ" (ra + vi) or "राम" (ra + aa + ma) — is REJECTED with
  // "Name can only contain letters…". Fix in src/lib/validators/contributor-name.ts:
  //   const NAME_REGEX = /^[\p{L}\p{M}\s.\-']+$/u;
  // Un-todo this test once that lands.
  it.todo("accepts Indic names that use vowel signs (matras), e.g. ರವಿ ಕುಮಾರ್ / राम प्रसाद");

  it("rejects non-string input", () => {
    expect(validateContributorName(42)).toEqual({ ok: false, reason: "Name must be text." });
    expect(validateContributorName(null).ok).toBe(false);
  });

  it("enforces the 2–40 character length window", () => {
    expect(validateContributorName("A").ok).toBe(false);
    expect(validateContributorName("A".repeat(41)).ok).toBe(false);
    expect(validateContributorName("A".repeat(40)).ok).toBe(true);
  });

  it("rejects digits, symbols and promotional characters", () => {
    expect(validateContributorName("Ravi 9876543210").ok).toBe(false);
    expect(validateContributorName("Best Rates 12%").ok).toBe(false);
    expect(validateContributorName("@jayanth").ok).toBe(false);
    expect(validateContributorName("Ravi | Kumar").ok).toBe(false);
  });

  it("rejects business names by suffix", () => {
    const r = validateContributorName("Apex Ventures");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/personal name/);
    expect(validateContributorName("SML Finance").ok).toBe(false);
  });

  it("does not false-positive on names that contain 'p.a'-like substrings", () => {
    expect(validateContributorName("Anupam").ok).toBe(true);
    expect(validateContributorName("Deepak").ok).toBe(true);
  });

  it("rejects URL-ish and TLD text even when it passes the character regex", () => {
    expect(validateContributorName("www.example").ok).toBe(false);
    expect(validateContributorName("visit site.in").ok).toBe(false);
  });
});
