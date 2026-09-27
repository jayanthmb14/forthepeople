/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The supporter APIs must never send a phone number or e-mail address as a
// supporter's name (seen on /contributors, 27 Sep 2026). One shared rule:
// src/lib/supporter-name.ts, used by /api/data/contributors,
// /api/payment/contributors, the payment webhook and the components.
import { describe, expect, it } from "vitest";
import { ANONYMOUS_NAME, MASKED_NAME, looksLikeContactInfo, publicDisplayName, publicName } from "@/lib/supporter-name";
import { CONTRIBUTOR_CACHE_KEYS, CONTRIBUTOR_KEYS } from "@/lib/supporter-cache";

describe("publicDisplayName (what the APIs send)", () => {
  it("masks phone numbers", () => {
    for (const n of ["+91 98765 43210", "+919876543210", "9876543210", "98765-43210", "  +91 98765 43210  "]) {
      expect(publicDisplayName(n, true), n).toBe(MASKED_NAME);
    }
  });
  it("masks e-mail addresses, also inside text", () => {
    expect(publicDisplayName("someone@example.com", true)).toBe(MASKED_NAME);
    expect(publicDisplayName("Ravi ravi.k@gmail.com", true)).toBe(MASKED_NAME);
  });
  it("masks a phone number inside a name and names with fewer than 2 letters", () => {
    expect(publicDisplayName("Call 9876543210", true)).toBe(MASKED_NAME);
    expect(publicDisplayName("A", true)).toBe(MASKED_NAME);
    expect(publicDisplayName("123", true)).toBe(MASKED_NAME);
  });
  it("keeps real names, in any script", () => {
    expect(publicDisplayName("Preethaam", true)).toBe("Preethaam");
    expect(publicDisplayName("  Micah Alex ", true)).toBe("Micah Alex");
    expect(publicDisplayName("ಜಯಂತ್", true)).toBe("ಜಯಂತ್");
    expect(publicDisplayName("Team 42", true)).toBe("Team 42");
  });
  it("sends Anonymous for supporters who did not opt in, or gave no name", () => {
    expect(publicDisplayName("Preethaam", false)).toBe(ANONYMOUS_NAME);
    expect(publicDisplayName("+91 98765 43210", false)).toBe(ANONYMOUS_NAME);
    expect(publicDisplayName("", true)).toBe(ANONYMOUS_NAME);
    expect(publicDisplayName(null, true)).toBe(ANONYMOUS_NAME);
  });
});

describe("publicName (what the components show)", () => {
  it("returns null for placeholders and contact details", () => {
    expect(publicName("Supporter")).toBeNull();
    expect(publicName("anonymous")).toBeNull();
    expect(publicName("+91 98765 43210")).toBeNull();
    expect(publicName("Preethaam")).toBe("Preethaam");
    expect(looksLikeContactInfo("Preethaam")).toBe(false);
  });
});

describe("supporter list cache keys", () => {
  it("clears the keys the list routes write", () => {
    expect(CONTRIBUTOR_CACHE_KEYS).toContain(CONTRIBUTOR_KEYS.payment);
    expect(CONTRIBUTOR_CACHE_KEYS).toContain(CONTRIBUTOR_KEYS.all);
    expect(CONTRIBUTOR_CACHE_KEYS).toContain(CONTRIBUTOR_KEYS.topTier);
    expect(CONTRIBUTOR_CACHE_KEYS).toContain(CONTRIBUTOR_KEYS.leaderboard);
    // Versions bumped past the lists that could hold unmasked names.
    expect(CONTRIBUTOR_KEYS.payment).not.toBe("ftp:contributors:v7");
    expect(CONTRIBUTOR_KEYS.topTier).not.toBe("ftp:contributors:top-tier:v3");
  });
});
