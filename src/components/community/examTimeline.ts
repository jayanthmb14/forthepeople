/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Exam timeline — the six dates every government exam goes through
// ═══════════════════════════════════════════════════════════════════════
//    📢 notification → 📝 applications open → ⏰ last date to apply
//    → 🎫 admit card → ✍️ exam → 🏆 result
//
//  Pure helpers (no React) used by the Exams page, its detail sheet and
//  ExamStepper. Dates are the boards' published dates as stored; a missing
//  date stays missing ("not announced"), never guessed. Days are counted in
//  India time (IST), so "today" matches the reader's calendar.

export interface ExamDates {
  status: string;
  announcedDate?: string | null;
  notificationDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  admitCardDate?: string | null;
  examDate?: string | null;
  resultDate?: string | null;
}

export const EXAM_STEPS = ["notification", "applyOpen", "lastDate", "admitCard", "exam", "result"] as const;
export type ExamStepKey = (typeof EXAM_STEPS)[number];

export const STEP_EMOJI: Record<ExamStepKey, string> = {
  notification: "📢",
  applyOpen: "📝",
  lastDate: "⏰",
  admitCard: "🎫",
  exam: "✍️",
  result: "🏆",
};

/** Where an exam is now. Order matters: it is the order of the steps. */
export const EXAM_PHASES = ["announced", "applyOpen", "applyClosed", "examSoon", "resultWait", "done"] as const;
export type ExamPhase = (typeof EXAM_PHASES)[number];

export const PHASE_EMOJI: Record<ExamPhase, string> = {
  announced: "📢",
  applyOpen: "📝",
  applyClosed: "⏳",
  examSoon: "🎫",
  resultWait: "✍️",
  done: "🏆",
};

const IST_OFFSET_MS = 5.5 * 3_600_000;
const DAY_MS = 86_400_000;

/** Day number in India time (whole days since 1970 in IST). */
function istDay(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
}

function validMs(d: string | null | undefined): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Calendar days from today to `date` in IST (0 = today, 1 = tomorrow, −1 = yesterday). */
export function calendarDaysUntil(now: number, date: string): number {
  const ms = validMs(date);
  return ms === null ? NaN : istDay(ms) - istDay(now);
}

export interface ExamStep {
  key: ExamStepKey;
  date: string | null;
  /** "done" = the date has passed (or is today for one-day steps before now); "next" = the first date still to come. */
  state: "done" | "next" | "later" | "tba";
  /** Calendar days from today (IST); null when the date is not announced. */
  days: number | null;
}

/** The six steps with their dates and state relative to `now`. */
export function examSteps(e: ExamDates, now: number): ExamStep[] {
  const dates: Record<ExamStepKey, string | null> = {
    notification: e.notificationDate ?? e.announcedDate ?? null,
    applyOpen: e.startDate ?? null,
    lastDate: e.endDate ?? null,
    admitCard: e.admitCardDate ?? null,
    exam: e.examDate ?? null,
    result: e.resultDate ?? null,
  };
  let nextTaken = false;
  return EXAM_STEPS.map((key) => {
    const date = validMs(dates[key]) === null ? null : dates[key];
    if (!date) return { key, date: null, state: "tba" as const, days: null };
    const days = calendarDaysUntil(now, date);
    if (days < 0) return { key, date, state: "done" as const, days };
    if (!nextTaken) {
      nextTaken = true;
      return { key, date, state: "next" as const, days };
    }
    return { key, date, state: "later" as const, days };
  });
}

/** The first step whose date is today or later, or null when none is announced. */
export function nextExamStep(e: ExamDates, now: number): ExamStep | null {
  return examSteps(e, now).find((s) => s.state === "next") ?? null;
}

/** The most recent step date that has passed (the start of the current wait), or null. */
export function lastPassedDate(e: ExamDates, now: number): string | null {
  const done = examSteps(e, now).filter((s) => s.state === "done" && s.date);
  return done.length ? (done[done.length - 1].date as string) : null;
}

const STATUS_PHASE: Record<string, ExamPhase> = {
  upcoming: "announced",
  NOTIFICATION_OUT: "announced",
  open: "applyOpen",
  APPLICATIONS_OPEN: "applyOpen",
  closed: "applyClosed",
  APPLICATIONS_CLOSED: "applyClosed",
  ADMIT_CARD_OUT: "examSoon",
  EXAM_SCHEDULED: "examSoon",
  RESULT_PENDING: "resultWait",
  results: "done",
  RESULT_OUT: "done",
  COMPLETED: "done",
};

/**
 * Where the exam is now. A published date that has passed wins over the
 * stored status (statuses can lag the calendar); without dates the status
 * decides. Never moves an exam backwards from what its status says.
 */
export function examPhase(e: ExamDates, now: number): ExamPhase {
  const passed = (d: string | null | undefined) => {
    const ms = validMs(d);
    return ms !== null && calendarDaysUntil(now, d as string) < 0;
  };
  const reached = (d: string | null | undefined) => {
    const ms = validMs(d);
    return ms !== null && calendarDaysUntil(now, d as string) <= 0;
  };
  let byDate: ExamPhase = "announced";
  if (reached(e.resultDate)) byDate = "done";
  else if (passed(e.examDate)) byDate = "resultWait";
  else if (reached(e.admitCardDate)) byDate = "examSoon";
  else if (passed(e.endDate)) byDate = "applyClosed";
  else if (reached(e.startDate)) byDate = "applyOpen";
  const byStatus = STATUS_PHASE[e.status] ?? "announced";
  return EXAM_PHASES.indexOf(byDate) >= EXAM_PHASES.indexOf(byStatus) ? byDate : byStatus;
}

/** True while people can still apply or the notice is just out. */
export function canApply(phase: ExamPhase): boolean {
  return phase === "announced" || phase === "applyOpen";
}
