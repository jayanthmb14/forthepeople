/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Courts — one district's NJDG snapshot: build, check, sum up (pure)
//
// A snapshot is what the courts page shows: for every NJDG unit of the
// district, the cases waiting (civil / criminal), how old they are, the
// cases filed and decided each year, how long last year's decided cases
// took, and the state's High Court on its own. It is built by the
// collector (src/scraper/jobs/courts-njdg.ts), stored in Redis
// (src/lib/courts/store.ts) and read by /api/data/court-pendency.
//
// "Checked two ways" — every unit is checked before it is kept:
//   hard (the unit is dropped, nothing is written):
//     • civil + criminal must equal the total NJDG prints;
//     • the total must be above 0 and below 1 crore;
//   soft (kept, and the page says which checks passed):
//     • ageMatches      the "Pending" dashboard's age count — a second
//                       request — adds up to the same total (±1 %). These
//                       bands are the ones the page shows ("how old");
//     • ageAddsUp       the civil / criminal age table on the district page
//                       adds up too, within 0.5 % or 25 cases (NJDG's two
//                       tables differ by a handful of cases; more than that
//                       and the civil / criminal split is not shown);
//     • decidedMatches  the "Disposed" dashboard's count for last year —
//                       a third request — equals last year's figure in the
//                       yearly series (±1 %).
// ═══════════════════════════════════════════════════════════

import type { AgeBands, DashboardPage, DecidedYear, PendingDashboard, SplitCount, YearFlow } from "./parse";

export const SNAPSHOT_VERSION = 1;

/** CourtStat.source prefix for rows this collector writes (older rows are hand seeds). */
export const COURTSTAT_SOURCE_PREFIX = "NJDG district dashboard";

/** A total above this is not a district (India's biggest district courts hold ~10 lakh). */
const MAX_PENDING = 10_000_000;

export type CheckId = "ageAddsUp" | "ageMatches" | "decidedMatches";

export interface CourtCheck {
  id: CheckId;
  ok: boolean;
  /** The figure on the page. */
  expected: number;
  /** The second count it was compared with. */
  found: number;
}

export interface CourtUnitSnapshot {
  /** NJDG's name for the unit (English proper noun). */
  name: string;
  /** "district" = district & taluka courts; "high-court" = the state's High Court. */
  kind: "district" | "high-court";
  /** A page on NJDG a citizen can open to check these figures. */
  url: string;
  pending: SplitCount;
  /** Cases waiting by age (all cases); sums to pending.total. */
  age: AgeBands | null;
  /** Of the >10 years band: waiting more than 20 and more than 30 years. */
  ageLong: { over20: number; over30: number } | null;
  /** The same by civil / criminal, from the district page's own table. */
  ageSplit: { civil: AgeBands; criminal: AgeBands } | null;
  lastMonth: { instituted: SplitCount | null; disposed: SplitCount | null };
  /** Cases filed and decided per calendar year (the current year is "so far"). */
  years: YearFlow[];
  /** How long last year's decided cases took (district units only). */
  decided: DecidedYear | null;
  checks: CourtCheck[];
}

export interface CourtsSnapshot {
  v: typeof SNAPSHOT_VERSION;
  district: string;
  state: string;
  /** When we read NJDG (ISO). NJDG refreshes its dashboards daily. */
  fetchedAt: string;
  units: CourtUnitSnapshot[];
  /** Units NJDG did not answer for on this read; the totals leave them out. */
  missing: string[];
  highCourt: CourtUnitSnapshot | null;
  /** When the High Court figures were read (they are shared by a state's districts). */
  highCourtFetchedAt: string | null;
}

// ── helpers ────────────────────────────────────────────────

const sum = (xs: readonly number[]) => xs.reduce((s, n) => s + n, 0);

/** Within max(abs, pct of expected) — NJDG refreshes between two requests. */
export function closeEnough(expected: number, found: number, pct = 0.01, abs = 5): boolean {
  return Math.abs(expected - found) <= Math.max(abs, expected * pct);
}

function validSplit(s: SplitCount | null): SplitCount | null {
  if (!s) return null;
  return s.civil + s.criminal === s.total ? s : null;
}

/** Calendar year in India for an ISO time. */
export function istYear(iso: string): number {
  const d = new Date(iso);
  return Number(d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" }));
}

// ── build ──────────────────────────────────────────────────

export interface UnitInput {
  name: string;
  kind: CourtUnitSnapshot["kind"];
  url: string;
  page: DashboardPage;
  pending?: PendingDashboard | null;
  decided?: DecidedYear | null;
  /** ISO time of the read (for the High Court's "this year so far"). */
  fetchedAt: string;
}

/**
 * Check one unit and turn it into its snapshot. Returns an error string
 * (and no unit) when a hard check fails — the caller then writes nothing.
 */
export function buildUnit(input: UnitInput): { unit: CourtUnitSnapshot } | { error: string } {
  const { page } = input;
  const p = page.pending;
  if (p.civil + p.criminal !== p.total) {
    return { error: `${input.name}: civil ${p.civil} + criminal ${p.criminal} ≠ total ${p.total}` };
  }
  if (p.total <= 0) return { error: `${input.name}: NJDG shows no pending cases (empty unit)` };
  if (p.total > MAX_PENDING) return { error: `${input.name}: ${p.total} pending is not plausible for one unit` };

  const checks: CourtCheck[] = [];

  // How old: the Pending dashboard's 7 bands (a second request) when they
  // add up to the total, collapsed to 5; else the page's own table.
  let age: AgeBands | null = null;
  let ageLong: CourtUnitSnapshot["ageLong"] = null;
  const b7 = input.pending?.ageBands7;
  if (b7) {
    const found = sum(b7);
    const ok = closeEnough(p.total, found);
    checks.push({ id: "ageMatches", ok, expected: p.total, found });
    if (ok) {
      age = [b7[0], b7[1], b7[2], b7[3], b7[4] + b7[5] + b7[6]];
      ageLong = { over20: b7[5] + b7[6], over30: b7[6] };
    }
  }

  // Civil / criminal by age, from the district page. NJDG's two tables
  // can differ by a handful of cases (Mysuru, 27 Sep 2026: criminal 64,733
  // in the header, 64,735 in the age table), so up to 0.5 % or 25 cases
  // still counts as adding up.
  let ageSplit = page.age;
  if (ageSplit) {
    const found = sum(ageSplit.civil) + sum(ageSplit.criminal);
    const ok =
      closeEnough(p.civil, sum(ageSplit.civil), 0.005, 25) && closeEnough(p.criminal, sum(ageSplit.criminal), 0.005, 25);
    checks.push({ id: "ageAddsUp", ok, expected: p.total, found });
    if (!ok) ageSplit = null; // never show a split that does not add up
    else if (!age) age = ageSplit.civil.map((n, i) => n + ageSplit!.criminal[i]) as AgeBands;
  }

  // Years: from the Pending dashboard (district units) or the HC page's
  // "current year" block.
  let years: YearFlow[] = [];
  if (input.pending?.years?.length) {
    years = input.pending.years.filter((y) => y.instituted >= 0 && y.disposed >= 0);
  } else if (input.kind === "high-court") {
    const ins = validSplit(page.currentYear.instituted);
    const disp = validSplit(page.currentYear.disposed);
    if (ins && disp) years = [{ year: istYear(input.fetchedAt), instituted: ins.total, disposed: disp.total }];
  }

  // Last year's decided cases (third request) against the yearly series.
  let decided = input.decided ?? null;
  if (decided) {
    const inSeries = years.find((y) => y.year === decided!.year);
    if (inSeries) {
      const ok = closeEnough(inSeries.disposed, decided.total);
      checks.push({ id: "decidedMatches", ok, expected: inSeries.disposed, found: decided.total });
      if (!ok) decided = null; // two NJDG counts disagree: show neither split
    }
  }

  return {
    unit: {
      name: input.name,
      kind: input.kind,
      url: input.url,
      pending: p,
      age,
      ageLong,
      ageSplit,
      lastMonth: { instituted: validSplit(page.lastMonth.instituted), disposed: validSplit(page.lastMonth.disposed) },
      years,
      decided,
      checks,
    },
  };
}

// ── sum up for the page ────────────────────────────────────

export interface CourtsSummary {
  pending: SplitCount;
  /** Cases waiting by age; null unless every unit has it. */
  age: AgeBands | null;
  /** Waiting more than 20 / 30 years (inside the >10 band). */
  ageLong: { over20: number; over30: number } | null;
  ageCivil: AgeBands | null;
  ageCriminal: AgeBands | null;
  olderThan1: number | null;
  olderThan5: number | null;
  olderThan10: number | null;
  lastMonth: { instituted: number | null; disposed: number | null };
  /** Years every unit reports, summed; oldest first. */
  years: YearFlow[];
  /** The last complete calendar year, if reported. */
  lastFullYear: YearFlow | null;
  /** This calendar year so far, if reported. */
  thisYear: YearFlow | null;
  /** How long last year's decided cases took, if every unit reports it. */
  decided: DecidedYear | null;
  /** Decided for every 10 filed in the last full year. */
  perTenLastYear: number | null;
  /** Decided for every 10 filed last month. */
  perTenLastMonth: number | null;
  /** Years to decide today's pile at last year's pace, with no new cases. */
  yearsToClear: number | null;
  checks: CourtCheck[];
  allChecksOk: boolean;
}

function sumBands(list: AgeBands[]): AgeBands {
  const out: AgeBands = [0, 0, 0, 0, 0];
  for (const b of list) for (let i = 0; i < 5; i++) out[i] += b[i];
  return out;
}

function sumOrNull(values: Array<number | null | undefined>): number | null {
  if (values.length === 0 || values.some((v) => v === null || v === undefined)) return null;
  return sum(values as number[]);
}

/** Add the district's units together (the High Court is never added). */
export function summarise(units: readonly CourtUnitSnapshot[], fetchedAt: string): CourtsSummary | null {
  if (units.length === 0) return null;
  const pending: SplitCount = {
    civil: sum(units.map((u) => u.pending.civil)),
    criminal: sum(units.map((u) => u.pending.criminal)),
    total: sum(units.map((u) => u.pending.total)),
  };

  const age = units.every((u) => u.age !== null) ? sumBands(units.map((u) => u.age!)) : null;
  const ageLong = units.every((u) => u.ageLong !== null)
    ? { over20: sum(units.map((u) => u.ageLong!.over20)), over30: sum(units.map((u) => u.ageLong!.over30)) }
    : null;
  const withSplit = units.every((u) => u.ageSplit !== null);
  const ageCivil = withSplit ? sumBands(units.map((u) => u.ageSplit!.civil)) : null;
  const ageCriminal = withSplit ? sumBands(units.map((u) => u.ageSplit!.criminal)) : null;

  // Years every unit reports.
  const yearSets = units.map((u) => new Map(u.years.map((y) => [y.year, y])));
  const common = [...(yearSets[0]?.keys() ?? [])].filter((y) => yearSets.every((m) => m.has(y))).sort((a, b) => a - b);
  const years: YearFlow[] = common.map((year) => ({
    year,
    instituted: sum(yearSets.map((m) => m.get(year)!.instituted)),
    disposed: sum(yearSets.map((m) => m.get(year)!.disposed)),
  }));
  const nowYear = istYear(fetchedAt);
  const thisYear = years.find((y) => y.year === nowYear) ?? null;
  const lastFullYear = years.find((y) => y.year === nowYear - 1) ?? null;

  const decidedList = units.map((u) => u.decided);
  const decided =
    decidedList.every((d) => d !== null) && new Set(decidedList.map((d) => d!.year)).size === 1
      ? {
          year: decidedList[0]!.year,
          total: sum(decidedList.map((d) => d!.total)),
          took: sumBands(decidedList.map((d) => d!.took)),
        }
      : null;

  const lmIns = sumOrNull(units.map((u) => u.lastMonth.instituted?.total));
  const lmDisp = sumOrNull(units.map((u) => u.lastMonth.disposed?.total));
  const checks = units.flatMap((u) => u.checks);

  return {
    pending,
    age,
    ageLong,
    ageCivil,
    ageCriminal,
    olderThan1: age ? age[1] + age[2] + age[3] + age[4] : null,
    olderThan5: age ? age[3] + age[4] : null,
    olderThan10: age ? age[4] : null,
    lastMonth: { instituted: lmIns, disposed: lmDisp },
    years,
    lastFullYear,
    thisYear,
    decided,
    perTenLastYear: lastFullYear && lastFullYear.instituted > 0 ? (lastFullYear.disposed / lastFullYear.instituted) * 10 : null,
    perTenLastMonth: lmIns && lmIns > 0 && lmDisp !== null ? (lmDisp / lmIns) * 10 : null,
    yearsToClear: lastFullYear && lastFullYear.disposed > 0 ? pending.total / lastFullYear.disposed : null,
    checks,
    allChecksOk: checks.length > 0 && checks.every((c) => c.ok),
  };
}

// ── CourtStat rows (the durable copy) ──────────────────────

export interface CourtStatRow {
  courtName: string;
  year: number;
  filed: number;
  disposed: number;
  pending: number;
  source: string;
}

/** "NJDG district dashboard · read 2026-09-27" (IST date). */
export function courtStatSource(fetchedAt: string): string {
  const d = new Date(fetchedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return `${COURTSTAT_SOURCE_PREFIX} · read ${d}`;
}

/** The read date back out of a CourtStat.source written by courtStatSource(). */
export function courtStatReadDate(source: string | null | undefined): string | null {
  if (!source?.startsWith(COURTSTAT_SOURCE_PREFIX)) return null;
  return /read (\d{4}-\d{2}-\d{2})/.exec(source)?.[1] ?? null;
}

/**
 * One CourtStat row per district unit for the current year: cases filed
 * and decided so far this year, and the cases waiting today. Past years
 * are not written — NJDG does not publish how many were waiting at the
 * end of a past year, and CourtStat.pending cannot be left empty.
 */
export function courtStatRows(snapshot: CourtsSnapshot): CourtStatRow[] {
  const year = istYear(snapshot.fetchedAt);
  const source = courtStatSource(snapshot.fetchedAt);
  const rows: CourtStatRow[] = [];
  for (const u of snapshot.units) {
    const flow = u.years.find((y) => y.year === year);
    if (!flow) continue;
    rows.push({ courtName: u.name, year, filed: flow.instituted, disposed: flow.disposed, pending: u.pending.total, source });
  }
  return rows;
}
