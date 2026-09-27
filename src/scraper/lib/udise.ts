/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// UDISE+ district school statistics — parsers and checks
// (pure: no DB, no network).
//
// Source: UDISE+ (Unified District Information System for Education
// Plus, Ministry of Education), the public dashboard at
// https://dashboard.udiseplus.gov.in/. The dashboard reads the
// "open-services" API; these four calls need no login, key or captcha
// (checked 27 Sep 2026):
//
//   GET  …/open-services/v1.1/acad-year-master/public   school years, newest first
//   GET  …/open-services/v1.1/states/<yearId>           state codes
//   GET  …/open-services/v1.1/districts/<state>/<yearId> education districts
//   POST …/open-services/v1.1/kpi/edu-highlights        one district's figures
//        { yearId, regionCode: <district code>, regionType: 12, valueType: 1 }
//
// Field meanings are the dashboard's own labels (report "Education
// highlights"): totSch "Total Number of Schools", ttch "Total Number of
// teachers", tenrF2Sec "Total Number of Enrolments (Foundational to
// Secondary)" (pre-school to class 12), tschGovt / tschGovtAided /
// tschPvtUnaided / tschOth schools by management, elecPerFun
// "Percentage of schools having functional electricity connection", …
//
// Checks before anything is stored (every one must pass):
//   • schools by management add up to the total, and so do schools by
//     category (1–5, 1–8, 6–8, …): two independent breakdowns;
//   • teachers by management add up to the total teachers;
//   • students by stage AND students by management add up to the total;
//   • 3 ≤ students per teacher ≤ 80; every % within 0–100; "functional"
//     never above "has";
//   • school count within ±30 % of the previous school year (catches a
//     wrong district code).
// ═══════════════════════════════════════════════════════════

export const UDISE_API = "https://api.udiseplus.gov.in/open-services/v1.1/";
export const UDISE_PUBLIC_URL = "https://dashboard.udiseplus.gov.in/";
export const UDISE_SOURCE = "UDISE+ (Ministry of Education)";
/** regionType for one district on the UDISE+ API. */
export const UDISE_DISTRICT_REGION = 12;

export interface UdiseYear {
  yearId: number;
  /** "2025-26" */
  label: string;
}
export interface UdiseRegion {
  code: string;
  name: string;
}

type Json = Record<string, unknown>;
const dataArray = (body: unknown): Json[] | null => {
  if (!body || typeof body !== "object") return null;
  const b = body as { status?: unknown; data?: unknown };
  if (b.status !== true || !Array.isArray(b.data)) return null;
  return b.data.filter((x): x is Json => !!x && typeof x === "object");
};

/** School years, newest first. */
export function parseUdiseYears(body: unknown): UdiseYear[] | null {
  const rows = dataArray(body);
  if (!rows) return null;
  return rows
    .map((r) => ({ yearId: Number(r.yearId), label: String(r.yearDesc ?? "").trim() }))
    .filter((y) => Number.isInteger(y.yearId) && /^\d{4}-\d{2}$/.test(y.label))
    .sort((a, b) => b.yearId - a.yearId);
}

/** States (`udiseStateCode` / `udiseStateName`) or districts (`udiseDistrictCode` / `udiseDistrictName`). */
export function parseUdiseRegions(body: unknown, level: "state" | "district"): UdiseRegion[] | null {
  const rows = dataArray(body);
  if (!rows) return null;
  const codeKey = level === "state" ? "udiseStateCode" : "udiseDistrictCode";
  const nameKey = level === "state" ? "udiseStateName" : "udiseDistrictName";
  return rows
    .map((r) => ({ code: String(r[codeKey] ?? "").trim(), name: String(r[nameKey] ?? "").replace(/\s+/g, " ").trim() }))
    .filter((r) => /^\d{2,4}$/.test(r.code) && r.name);
}

export function udiseHighlightsBody(yearId: number, districtCode: string): string {
  return JSON.stringify({ yearId, regionCode: districtCode, regionType: UDISE_DISTRICT_REGION, valueType: 1 });
}

export interface UdisePartStats {
  /** The education district as UDISE+ names it, e.g. "BENGALURU U NORTH". */
  udiseName: string;
  udiseCode: string;
  schools: number;
  teachers: number;
  /** Pre-school to class 12 (UDISE+ "Foundational to Secondary"). */
  students: number;
  schoolsByManagement: { government: number; governmentAided: number; privateUnaided: number; other: number };
  teachersByManagement: { government: number; governmentAided: number; privateUnaided: number; other: number };
  studentsByStage: { foundational: number; preparatory: number; middle: number; secondary: number };
  /** % of schools with each facility (null when UDISE+ does not publish it). */
  facilitiesPct: {
    electricityFunctional: number | null;
    drinkingWaterFunctional: number | null;
    toiletFunctional: number | null;
    girlsToiletFunctional: number | null;
    boysToiletFunctional: number | null;
    handwash: number | null;
    computerFunctional: number | null;
    internet: number | null;
    libraryOrReadingCorner: number | null;
    playground: number | null;
    rampWithHandrail: number | null;
    smartClassroomFunctional: number | null;
  };
}

const count = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 && Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n) : null;
};
/** A count that UDISE+ leaves null when it is zero (tschOth, tenrF2SecOth). */
const countOrZero = (v: unknown): number | null => (v === null || v === undefined ? 0 : count(v));
const pct = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export interface ParsedUdise {
  stats: UdisePartStats;
  /** Internal sums the checks compare against the totals. */
  sums: {
    schoolsByCategory: number | null;
    studentsByManagement: number | null;
  };
  yearId: number;
}

/** The single district record of an edu-highlights reply, or null when absent/malformed. */
export function parseUdiseHighlights(body: unknown): ParsedUdise | null {
  const rows = dataArray(body);
  if (!rows || rows.length !== 1) return null;
  const r = rows[0];
  const schools = count(r.totSch);
  const teachers = count(r.ttch);
  const students = count(r.tenrF2Sec);
  const code = String(r.regionCode ?? "").trim();
  const name = String(r.regionName ?? "").replace(/\s+/g, " ").trim();
  if (schools === null || teachers === null || students === null || !code || !name) return null;

  const catKeys = ["tsch1to5", "tsch1to8", "tsch6to8", "tsch1to10", "tsch6to10", "tsch9to10", "tsch1to12", "tsch6to12", "tsch9to12", "tsch11to12", "tschPpri"];
  const catVals = catKeys.map((k) => countOrZero(r[k]));
  const schoolsByCategory = catVals.some((v) => v === null) ? null : catVals.reduce<number>((s, v) => s + (v as number), 0);
  const enrMgmt = ["tenrF2SecGov", "tenrF2SecGovAided", "tenrF2SecPvtUnaided", "tenrF2SecOth"].map((k) => countOrZero(r[k]));
  const studentsByManagement = enrMgmt.some((v) => v === null) ? null : enrMgmt.reduce<number>((s, v) => s + (v as number), 0);

  const sg = countOrZero(r.tschGovt), sa = countOrZero(r.tschGovtAided), sp = countOrZero(r.tschPvtUnaided), so = countOrZero(r.tschOth);
  const tg = countOrZero(r.ttchGovt), ta = countOrZero(r.ttchGovtAided), tp = countOrZero(r.ttchPvtUnaided), to = countOrZero(r.ttchOth);
  const ef = count(r.tenrF), ep = count(r.tenrP), em = count(r.tenrM), es = count(r.tenrS);
  if ([sg, sa, sp, so, tg, ta, tp, to, ef, ep, em, es].some((v) => v === null)) return null;

  return {
    yearId: Number(r.yearId),
    sums: { schoolsByCategory, studentsByManagement },
    stats: {
      udiseName: name,
      udiseCode: code,
      schools,
      teachers,
      students,
      schoolsByManagement: { government: sg!, governmentAided: sa!, privateUnaided: sp!, other: so! },
      teachersByManagement: { government: tg!, governmentAided: ta!, privateUnaided: tp!, other: to! },
      studentsByStage: { foundational: ef!, preparatory: ep!, middle: em!, secondary: es! },
      facilitiesPct: {
        electricityFunctional: pct(r.elecPerFun),
        drinkingWaterFunctional: pct(r.waterPerFun),
        toiletFunctional: pct(r.toiletPerFun),
        girlsToiletFunctional: pct(r.toiletGPerFun),
        boysToiletFunctional: pct(r.toiletBPerFun),
        handwash: pct(r.handwashPer),
        computerFunctional: pct(r.compPerFun),
        internet: pct(r.internetPer),
        libraryOrReadingCorner: pct(r.libBbnkRcorPer),
        playground: pct(r.pgroundPer),
        rampWithHandrail: pct(r.rampWithHandrailPer),
        smartClassroomFunctional: pct(r.smartPerFun),
      },
    },
  };
}

/** Functional-vs-available pairs as published (the "has" figure, for the ≤ check). */
export function udiseAvailablePct(body: unknown): Record<string, number | null> {
  const rows = dataArray(body);
  const r = rows && rows.length === 1 ? rows[0] : {};
  return {
    electricityFunctional: pct(r.elecPer),
    drinkingWaterFunctional: pct(r.waterPer),
    toiletFunctional: pct(r.toiletPer),
    girlsToiletFunctional: pct(r.toiletGPer),
    boysToiletFunctional: pct(r.toiletBPer),
    computerFunctional: pct(r.compPer),
  };
}

/**
 * Problems with one education district's figures; empty = safe to store.
 * `available` is udiseAvailablePct() of the same reply; `previousSchools`
 * the school count a year earlier (null when not published).
 */
export function udiseProblems(p: ParsedUdise, available: Record<string, number | null>, previousSchools: number | null): string[] {
  const s = p.stats;
  const out: string[] = [];
  if (s.schools <= 0) out.push("no schools listed");
  if (s.teachers <= 0) out.push("no teachers listed");
  if (s.students <= 0) out.push("no students listed");
  const m = s.schoolsByManagement;
  if (m.government + m.governmentAided + m.privateUnaided + m.other !== s.schools)
    out.push(`schools by management add up to ${m.government + m.governmentAided + m.privateUnaided + m.other}, not ${s.schools}`);
  if (p.sums.schoolsByCategory === null || p.sums.schoolsByCategory !== s.schools)
    out.push(`schools by category add up to ${p.sums.schoolsByCategory}, not ${s.schools}`);
  const t = s.teachersByManagement;
  if (t.government + t.governmentAided + t.privateUnaided + t.other !== s.teachers)
    out.push(`teachers by management add up to ${t.government + t.governmentAided + t.privateUnaided + t.other}, not ${s.teachers}`);
  const st = s.studentsByStage;
  if (st.foundational + st.preparatory + st.middle + st.secondary !== s.students)
    out.push(`students by stage add up to ${st.foundational + st.preparatory + st.middle + st.secondary}, not ${s.students}`);
  if (p.sums.studentsByManagement === null || p.sums.studentsByManagement !== s.students)
    out.push(`students by management add up to ${p.sums.studentsByManagement}, not ${s.students}`);
  if (s.teachers > 0) {
    const ptr = s.students / s.teachers;
    if (ptr < 3 || ptr > 80) out.push(`${ptr.toFixed(1)} students per teacher`);
  }
  for (const [k, v] of Object.entries(s.facilitiesPct)) {
    if (v !== null && (v < 0 || v > 100)) out.push(`${k} ${v}% outside 0–100`);
    const has = available[k];
    if (v !== null && has !== null && has !== undefined && v > has + 0.01) out.push(`${k}: functional ${v}% above available ${has}%`);
  }
  if (previousSchools !== null && previousSchools > 0) {
    const change = Math.abs(s.schools - previousSchools) / previousSchools;
    if (change > 0.3) out.push(`school count moved ${Math.round(change * 100)}% in a year (${previousSchools} → ${s.schools})`);
  }
  return out;
}

export interface UdiseSnapshotData {
  /** School year, e.g. "2025-26". */
  year: string;
  yearId: number;
  /** One entry per UDISE+ education district (Bengaluru Urban and Mumbai have two). */
  parts: UdisePartStats[];
  /** Counts summed over the parts (percentages are per part only). */
  totals: { schools: number; teachers: number; students: number; governmentSchools: number };
  /** The same totals a year earlier, when UDISE+ has them. */
  previousYear: { year: string; schools: number; teachers: number; students: number } | null;
}

/** Sum the counts of one or more parts. */
export function sumUdiseParts(parts: UdisePartStats[]): UdiseSnapshotData["totals"] {
  return parts.reduce(
    (a, p) => ({
      schools: a.schools + p.schools,
      teachers: a.teachers + p.teachers,
      students: a.students + p.students,
      governmentSchools: a.governmentSchools + p.schoolsByManagement.government,
    }),
    { schools: 0, teachers: 0, students: 0, governmentSchools: 0 },
  );
}
