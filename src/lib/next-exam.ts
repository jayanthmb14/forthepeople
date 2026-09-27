/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The "Next exam" line on a district overview — PURE, unit-tested in
// tests/next-exam.test.ts.
//
// Sept 2026 audit: the overview showed "Next exam: Maharashtra Talathi
// Recruitment 2026, 15 Oct 2026" (4,710 posts) for Mumbai and Pune, and TN
// Police SI / WB Police Constable dates for Chennai and Kolkata — seed rows
// from April with status UNVERIFIED, needsVerification true and no source.
// The published Talathi exam is 25 Oct 2026 with 1,539 posts. A date is
// shown only when the row is not waiting for a check and names a source.

export interface ExamLike {
  level?: string | null;
  title: string;
  status?: string | null;
  examDate?: string | null;
  endDate?: string | null;
  needsVerification?: boolean | null;
  sourceUrls?: unknown;
  notificationUrl?: string | null;
  lastVerifiedAt?: string | null;
}

/** A row whose dates may be shown as fact: checked, and with a source to follow. */
export function isExamDateTrusted(exam: ExamLike): boolean {
  if (exam.needsVerification === true) return false;
  if ((exam.status ?? "").toUpperCase() === "UNVERIFIED") return false;
  const sources = Array.isArray(exam.sourceUrls) ? exam.sourceUrls.filter((u) => typeof u === "string" && u) : [];
  return sources.length > 0 || Boolean(exam.notificationUrl) || Boolean(exam.lastVerifiedAt);
}

/**
 * The next state or district exam (or open application deadline) among
 * trusted rows. National exams are left out: they are not news about this
 * district.
 */
export function pickNextExam<T extends ExamLike>(
  data: { districtExams?: T[]; stateExams?: T[] } | undefined,
  now: number = Date.now(),
): { exam: T; date: string; kind: "exam" | "apply" } | null {
  if (!data) return null;
  const local = [...(data.districtExams ?? []), ...(data.stateExams ?? []).filter((e) => e.level !== "national")];
  const upcoming: Array<{ exam: T; date: string; kind: "exam" | "apply" }> = [];
  for (const exam of local) {
    if (!isExamDateTrusted(exam)) continue;
    if (exam.examDate && new Date(exam.examDate).getTime() >= now) upcoming.push({ exam, date: exam.examDate, kind: "exam" });
    else if (exam.endDate && new Date(exam.endDate).getTime() >= now) upcoming.push({ exam, date: exam.endDate, kind: "apply" });
  }
  upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming[0] ?? null;
}
