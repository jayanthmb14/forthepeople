/**
 * Unit tests for src/lib/validators/supporter-message.ts — the free-text
 * message filter on Supporter / Contribution records.
 */
import { describe, it, expect } from "vitest";
import { validateSupporterMessage } from "@/lib/validators/supporter-message";

describe("validateSupporterMessage", () => {
  it("treats empty input as a valid, null message", () => {
    expect(validateSupporterMessage(null)).toEqual({ ok: true, cleaned: null });
    expect(validateSupporterMessage(undefined)).toEqual({ ok: true, cleaned: null });
    expect(validateSupporterMessage("")).toEqual({ ok: true, cleaned: null });
    expect(validateSupporterMessage("   ")).toEqual({ ok: true, cleaned: null });
  });

  it("rejects non-string input", () => {
    expect(validateSupporterMessage(123)).toEqual({ ok: false, reason: "Message must be text." });
  });

  it("accepts ordinary prose (including emoji) and normalises whitespace", () => {
    expect(validateSupporterMessage("Great   work, keep going! 🇮🇳")).toEqual({
      ok: true,
      cleaned: "Great work, keep going! 🇮🇳",
    });
  });

  it("enforces the 5–280 character window", () => {
    expect(validateSupporterMessage("Hi").ok).toBe(false);
    expect(validateSupporterMessage("x".repeat(281)).ok).toBe(false);
    expect(validateSupporterMessage("x".repeat(280)).ok).toBe(true);
  });

  it("rejects phone numbers, URLs, TLDs and rate / promo language", () => {
    const bad = [
      "Call 9876543210 for details",
      "reach me on +91 98765",
      "Returns of 14% p.a guaranteed",
      "visit https://example.com",
      "see www.example",
      "mail me at foo.in",
      "best interest rate in town",
      "great investment opportunity",
      "easy loan approval",
      "ping me on whatsapp",
      "contact us at the office",
    ];
    for (const msg of bad) {
      expect(validateSupporterMessage(msg).ok, msg).toBe(false);
    }
  });
});
