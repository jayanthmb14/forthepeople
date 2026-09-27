/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// A Teacher Eligibility Test (TET, CTET, KARTET …) only certifies that a
// candidate may apply for teaching posts; it has no vacancies of its own
// (ctet.nic.in: qualifying "does not confer a right" to a job). The exam
// seed gave TN TET 2026 "15,000 posts" and WB TET 2026 "11,000" (Sept 2026
// audit), so a post count on an eligibility test is never shown.

/** True for a teacher (or other) eligibility test, by its title or short name. */
export function isEligibilityTest(e: { title: string; shortName?: string | null }): boolean {
  const text = `${e.title} ${e.shortName ?? ""}`;
  return /\b[A-Z]*TET\b/.test(text) || /eligibility test/i.test(text);
}

/** The exam with no post count when it is an eligibility test. */
export function withoutEligibilityTestPosts<E extends { title: string; shortName?: string | null; vacancies: number | null }>(e: E): E {
  return isEligibilityTest(e) && e.vacancies !== null ? { ...e, vacancies: null } : e;
}
