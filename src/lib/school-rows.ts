/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The schools listed one by one (School table), as a page may show them.
// Sept 2026 audit: every listed row was typed into a seed script with no
// UDISE code — enrolment and teacher counts were estimates (the same
// "3,000 students · 118 teachers" on two different schools), and the Pune
// seed packed descriptions, source links and disclaimers into the address.
// Pure helpers, no DB.

/** The address alone: anything after " // " or " | " is a note, not an address. */
export function cleanSchoolAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  const first = address.split(/\s+(?:\/\/|\|)\s+/)[0]?.trim() ?? "";
  return first.length > 0 ? first : null;
}

/** Per-school counts are shown only for a school identified by its UDISE+ code. */
export function schoolForDisplay<
  S extends { udiseCode: string | null; address: string | null; students: number | null; teachers: number | null; studentTeacherRatio: number | null },
>(s: S): S {
  const checked = Boolean(s.udiseCode && s.udiseCode.trim());
  return {
    ...s,
    address: cleanSchoolAddress(s.address),
    students: checked ? s.students : null,
    teachers: checked ? s.teachers : null,
    studentTeacherRatio: checked ? s.studentTeacherRatio : null,
  };
}
