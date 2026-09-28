/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Exam rows written from the news (src/lib/exam-news.ts): a link is kept
// only when it is official and written in the article text, and a news
// mention never confirms an exam (only the official collector does).
import { describe, expect, it } from "vitest";
import {
  examUpdateFromNews,
  mergeSourceUrls,
  newExamFromNews,
  officialExamUrlFromArticle,
  type ExamNewsFacts,
  type StoredExamForNews,
} from "@/lib/exam-news";

describe("officialExamUrlFromArticle", () => {
  const headline = "NEET UG 2026 result declared; check scores at neet.nta.nic.in";

  it("drops the news article's own link (NEET UG 2026 got the Google News URL)", () => {
    const gn = "https://news.google.com/rss/articles/CBMi4wFBVV95cUxQ";
    expect(officialExamUrlFromArticle(gn, `NEET UG 2026 result declared ${gn}`)).toBeNull();
  });

  it("drops an official portal the headline never mentions (a guessed https://ibps.in)", () => {
    expect(officialExamUrlFromArticle("https://ibps.in", "IBPS PO 2026 notification out for 5,208 posts")).toBeNull();
    expect(officialExamUrlFromArticle("https://ssc.gov.in", "SSC CGL 2026 exam date announced")).toBeNull();
  });

  it("keeps an official link that is written in the article text", () => {
    expect(officialExamUrlFromArticle("https://neet.nta.nic.in", headline)).toBe("https://neet.nta.nic.in");
    expect(officialExamUrlFromArticle("https://www.neet.nta.nic.in/", headline)).toBe("https://www.neet.nta.nic.in/");
  });

  it("drops a longer path the text does not contain, and non-official or empty values", () => {
    expect(officialExamUrlFromArticle("https://neet.nta.nic.in/results/2026", headline)).toBeNull();
    expect(officialExamUrlFromArticle("https://www.example.com/neet", "see www.example.com/neet")).toBeNull();
    expect(officialExamUrlFromArticle(null, headline)).toBeNull();
    expect(officialExamUrlFromArticle("", headline)).toBeNull();
    expect(officialExamUrlFromArticle(42, headline)).toBeNull();
  });
});

const facts: ExamNewsFacts = {
  examName: "NEET UG 2026",
  shortName: "NEET UG 2026",
  category: "CENTRAL",
  status: "RESULT_OUT",
  organizingBody: "NTA",
  officialBody: { organizingBody: "NTA", department: "National Testing Agency" },
  vacancies: null,
  applyUrl: null,
  notificationUrl: null,
  notificationDate: null,
  startDate: null,
  endDate: null,
  admitCardDate: null,
  examDate: new Date("2026-05-03"),
  resultDate: new Date("2026-06-14"),
};

const stored: StoredExamForNews = {
  level: "national",
  scope: "NATIONAL",
  stateId: null,
  districtId: null,
  title: "NEET (UG) 2026",
  status: "EXAM_SCHEDULED",
  shortName: "NEET UG 2026",
  organizingBody: "NTA",
  category: "CENTRAL",
  applyUrl: null,
  notificationUrl: "https://neet.nta.nic.in",
  vacancies: null,
  notificationDate: new Date("2026-02-07"),
  startDate: null,
  endDate: null,
  admitCardDate: null,
  examDate: new Date("2026-05-03"),
  resultDate: null,
  sourceUrls: ["https://news.example/a"],
};

describe("newExamFromNews", () => {
  it("creates a row that waits for the official check and invents no date", () => {
    const row = newExamFromNews(facts, "https://news.example/b");
    expect(row.needsVerification).toBe(true);
    expect("lastVerifiedAt" in row).toBe(false);
    // No notification or opening date in the news → no "announced" date (it was the sync day).
    expect(row.announcedDate).toBeNull();
    expect(newExamFromNews({ ...facts, startDate: new Date("2026-02-08") }, "u").announcedDate).toEqual(new Date("2026-02-08"));
    expect(row.sourceUrls).toEqual(["https://news.example/b"]);
    expect(row.department).toBe("National Testing Agency");
  });
});

describe("examUpdateFromNews", () => {
  it("never confirms the exam", () => {
    const { patch } = examUpdateFromNews(stored, facts, "https://news.example/b");
    expect(patch).not.toHaveProperty("lastVerifiedAt");
    expect(patch).not.toHaveProperty("needsVerification");
  });

  it("moves status forward, fills empty fields only and appends the source", () => {
    const { patch, facts: n, moved } = examUpdateFromNews(stored, facts, "https://news.example/b");
    expect(patch.status).toBe("RESULT_OUT");
    expect(patch.resultDate).toEqual(new Date("2026-06-14"));
    expect(patch).not.toHaveProperty("examDate"); // already stored
    expect(patch).not.toHaveProperty("notificationUrl");
    expect(patch.sourceUrls).toEqual(["https://news.example/a", "https://news.example/b"]);
    expect(n).toBe(2);
    expect(moved).toBe(false);
  });

  it("does not move status backwards and counts nothing when nothing is new", () => {
    const { patch, facts: n } = examUpdateFromNews({ ...stored, status: "RESULT_OUT", resultDate: new Date("2026-06-14") }, { ...facts, status: "EXAM_SCHEDULED" }, "https://news.example/a");
    expect(patch).toEqual({ sourceUrls: ["https://news.example/a"] });
    expect(n).toBe(0);
  });
});

describe("mergeSourceUrls", () => {
  it("appends once and keeps the last 10", () => {
    const many = Array.from({ length: 10 }, (_, i) => `u${i}`);
    expect(mergeSourceUrls(many, "u3")).toHaveLength(10);
    expect(mergeSourceUrls(many, "new")).toEqual([...many.slice(1), "new"]);
    expect(mergeSourceUrls(null, "x")).toEqual(["x"]);
  });
});
