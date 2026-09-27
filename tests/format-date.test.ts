/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Kannada dates are written day first with full month names
 * (src/i18n/format-date.ts; Sept 2026 language audit).
 */
import { describe, expect, it } from "vitest";
import { dateFormatter, formatDate } from "../src/i18n/format-date";

const KN = "kn-IN-u-nu-latn";
const HI = "hi-IN-u-nu-latn";
const EN = "en-IN-u-nu-latn";
const D = new Date("2026-09-27T10:00:00Z"); // 27 Sep 2026, 3:30 pm IST
const IST = { timeZone: "Asia/Kolkata" } as const;

describe("formatDate (Kannada)", () => {
  it("writes day, full month, year with spaces (not 'ಸೆಪ್ಟೆಂ 27,2026')", () => {
    expect(formatDate(D, KN, { ...IST, day: "numeric", month: "short", year: "numeric" })).toBe("27 ಸೆಪ್ಟೆಂಬರ್ 2026");
    expect(formatDate(D, KN, { ...IST, day: "numeric", month: "long", year: "numeric" })).toBe("27 ಸೆಪ್ಟೆಂಬರ್ 2026");
    expect(formatDate(D, KN, { ...IST, dateStyle: "medium" })).toBe("27 ಸೆಪ್ಟೆಂಬರ್ 2026");
  });

  it("uses the full month name without a year too ('ಆಗ' reads as 'then')", () => {
    expect(formatDate(new Date("2026-08-23T06:00:00Z"), KN, { ...IST, day: "numeric", month: "short" })).toBe("23 ಆಗಸ್ಟ್");
    expect(formatDate(D, KN, { ...IST, month: "short", year: "numeric" })).toBe("ಸೆಪ್ಟೆಂಬರ್ 2026");
  });

  it("keeps the weekday and the time", () => {
    expect(formatDate(D, KN, { ...IST, weekday: "long", day: "numeric", month: "long", year: "numeric" })).toBe("ಭಾನುವಾರ, 27 ಸೆಪ್ಟೆಂಬರ್ 2026");
    expect(formatDate(D, KN, { ...IST, day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })).toMatch(/^27 ಸೆಪ್ಟೆಂಬರ್ 2026, 3:30/);
  });

  it("formats trading days given as UTC dates", () => {
    expect(dateFormatter(KN, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date("2026-06-22T00:00:00Z"))).toBe("22 ಜೂನ್ 2026");
  });
});

describe("formatDate (other languages unchanged)", () => {
  it("matches toLocaleDateString for Hindi and English", () => {
    for (const intl of [HI, EN]) {
      for (const opts of [{ day: "numeric", month: "short", year: "numeric" }, { day: "numeric", month: "short" }, { dateStyle: "medium" }, {}] as Intl.DateTimeFormatOptions[]) {
        expect(formatDate(D, intl, { ...IST, ...opts })).toBe(D.toLocaleDateString(intl, { ...IST, ...opts }));
      }
    }
  });

  it("fills in the default date fields like toLocaleDateString", () => {
    expect(formatDate(D, KN, IST)).toBe(D.toLocaleDateString(KN, IST));
  });
});
