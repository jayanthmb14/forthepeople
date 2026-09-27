/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { CONFIRM_DAYS, examConfirmation, examPhase, isOfficialUrl, nextExamStep, officialLink } from "@/components/community/examTimeline";

const NOW = new Date("2026-09-27T06:00:00Z").getTime();
const daysBefore = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

describe("isOfficialUrl", () => {
  it("accepts government domains and named recruiters, not news sites", () => {
    expect(isOfficialUrl("https://ssc.nic.in/notice.pdf")).toBe(true);
    expect(isOfficialUrl("upsc.gov.in")).toBe(true);
    expect(isOfficialUrl("https://www.ibps.in/crp")).toBe(true);
    expect(isOfficialUrl("https://news.google.com/rss/articles/x")).toBe(false);
    expect(isOfficialUrl("https://timesofindia.indiatimes.com/x")).toBe(false);
    expect(isOfficialUrl("")).toBe(false);
    expect(isOfficialUrl(null)).toBe(false);
  });
  it("prefers the notice, then the apply page", () => {
    expect(officialLink({ notificationUrl: "https://news.google.com/x", applyUrl: "https://ssc.gov.in/apply" })).toBe("https://ssc.gov.in/apply");
  });
});

describe("examConfirmation", () => {
  it("is confirmed only when re-checked within 30 days AND backed by an official link", () => {
    expect(examConfirmation({ lastVerifiedAt: daysBefore(3), notificationUrl: "https://ssc.gov.in/n.pdf" }, NOW).confirmed).toBe(true);
    expect(examConfirmation({ lastVerifiedAt: daysBefore(CONFIRM_DAYS + 1), notificationUrl: "https://ssc.gov.in/n.pdf" }, NOW).confirmed).toBe(false);
    expect(examConfirmation({ lastVerifiedAt: daysBefore(3), notificationUrl: "https://news.google.com/x" }, NOW).confirmed).toBe(false);
    const never = examConfirmation({ lastVerifiedAt: null, notificationUrl: "https://ssc.gov.in/n.pdf" }, NOW);
    expect(never.confirmed).toBe(false);
    expect(never.checkedDays).toBeNull();
  });
});

describe("exam dates", () => {
  it("finds the next date and the phase from the calendar", () => {
    const e = { status: "upcoming", startDate: daysBefore(2), endDate: new Date(NOW + 5 * 86_400_000).toISOString() };
    expect(examPhase(e, NOW)).toBe("applyOpen");
    expect(nextExamStep(e, NOW)?.key).toBe("lastDate");
  });
});
