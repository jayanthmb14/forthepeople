/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { isEligibilityTest, withoutEligibilityTestPosts } from "@/lib/exams/eligibility-test";

describe("eligibility tests have no posts", () => {
  it("recognises TET-style exams", () => {
    expect(isEligibilityTest({ title: "TN TET (Tamil Nadu Teacher Eligibility Test) 2026" })).toBe(true);
    expect(isEligibilityTest({ title: "WB TET (Teacher Eligibility Test) 2026 — Primary & Upper Primary" })).toBe(true);
    expect(isEligibilityTest({ title: "Karnataka Teacher Eligibility Test", shortName: "KARTET 2026" })).toBe(true);
    expect(isEligibilityTest({ title: "CTET July 2026" })).toBe(true);
  });

  it("leaves recruitment exams alone", () => {
    expect(isEligibilityTest({ title: "TN Police Constable (Grade II) Recruitment 2026" })).toBe(false);
    expect(isEligibilityTest({ title: "IBPS Clerk 2026" })).toBe(false);
    expect(isEligibilityTest({ title: "Quartet of exams", shortName: null })).toBe(false);
  });

  it("drops the post count", () => {
    expect(withoutEligibilityTestPosts({ title: "WB TET 2026", vacancies: 11000 }).vacancies).toBeNull();
    const clerk = { title: "IBPS Clerk 2026", vacancies: 11403 };
    expect(withoutEligibilityTestPosts(clerk)).toBe(clerk);
  });
});
