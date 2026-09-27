/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// MGNREGA "At a glance" — form helpers, parser and checks
// (pure: no DB, no network).
//
// Source: Ministry of Rural Development, NREGASoft. The public "At a
// glance" page, linked from https://nrega.dord.gov.in/ (Dashboard → At a
// Glance), is an ASP.NET form with no login and no captcha (checked
// 27 Sep 2026):
//
//   GET  …/netnrega/nrega_ataglance/At_a_glance.aspx      state list
//   POST the same page, __EVENTTARGET=ddl_state           district list
//   POST the same page, ddl_dist + btproceed="View Detail" → an <iframe> src:
//        all_lvl_details_new.aspx?district_code=…&page=d&fin_year=…&Digest=…
//   GET  that page (slow: about 20 s)                     the figures
//
// The figures page is one table (#GridView1): "State : KARNATAKA
// District :MANDYA" / "As on 27-09-2026", job cards, then one column per
// financial year (newest first) for persondays, households, wages,
// works and money. Money is printed in ₹ lakh; we store whole rupees
// (CLAUDE.md). Counts printed "in lakhs" keep that unit in their name.
//
// Checks (a year that fails is dropped; the newest year must pass):
//   • Total expenditure = wages + material & skilled wages + admin,
//     within ₹1 lakh (the page rounds each figure);
//   • printed Material % = material ÷ (wages + material), printed
//     Admin % = admin ÷ total (FY 2021-22 fails this on the source itself
//     in every district we checked: its admin figure is last year's);
//   • no negative numbers, percentages within range, wage rate
//     ₹100–₹1,000 a day where work happened;
//   • the header names the district and state we asked for, the "As on"
//     date is within the last 10 days, and the first column is the
//     current financial year of that date.
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { normName } from "./source-districts";

export const NREGA_GLANCE_URL = "https://mnregaweb4.dord.gov.in/netnrega/nrega_ataglance/At_a_glance.aspx";
export const NREGA_PUBLIC_URL = "https://nrega.dord.gov.in/MGNREGA_new/Nrega_home.aspx";
export const NREGA_SOURCE = "MGNREGA “At a glance” (Ministry of Rural Development, NREGASoft)";

// ── ASP.NET form helpers ─────────────────────────────────────

/**
 * Hidden inputs plus the selected value of every <select>: what a browser
 * would post. Like a browser, a <select> with no options is not sent at
 * all (NREGA answers "The Values specified are wrong" to empty ones).
 */
export function aspNetFormFields(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const f: Record<string, string> = {};
  $("input[type=hidden]").each((_, e) => {
    const name = $(e).attr("name");
    if (name) f[name] = $(e).attr("value") ?? "";
  });
  $("select").each((_, e) => {
    const name = $(e).attr("name");
    if (!name) return;
    const sel = $(e).find("option[selected]").attr("value") ?? $(e).find("option").first().attr("value");
    if (sel !== undefined) f[name] = sel;
  });
  return f;
}

export interface FormOption {
  value: string;
  label: string;
}

/** The options of <select name=…>, without the "ALL" / "Select" placeholder. */
export function selectOptions(html: string, name: string): FormOption[] {
  const $ = cheerio.load(html);
  return $(`select[name="${name}"] option`)
    .map((_, e) => ({ value: ($(e).attr("value") ?? "").trim(), label: $(e).text().replace(/\s+/g, " ").trim() }))
    .get()
    .filter((o) => o.value && o.label && !/^(all|select|--)/i.test(o.value) && !/^(all|select)/i.test(o.label));
}

/** The figures page the "View Detail" button points the iframe at, as an absolute URL, or null. */
export function glanceIframeUrl(html: string, pageUrl = NREGA_GLANCE_URL): string | null {
  const $ = cheerio.load(html);
  const src = ($("#iframenregabullten").attr("src") ?? "").trim();
  if (!src || !/all_lvl_details/i.test(src)) return null;
  try {
    const u = new URL(src, pageUrl);
    return u.host.endsWith("dord.gov.in") || u.host.endsWith("nic.in") ? u.toString() : null;
  } catch {
    return null;
  }
}

// ── Figures page ─────────────────────────────────────────────

export interface NregaYear {
  /** "2026-2027" */
  fy: string;
  labourBudgetLakhPersondays: number | null;
  persondaysLakh: number | null;
  pctOfLabourBudget: number | null;
  womenPersondaysPct: number | null;
  scPersondaysPct: number | null;
  stPersondaysPct: number | null;
  avgDaysPerHousehold: number | null;
  avgWagePerDayRupees: number | null;
  households100Days: number | null;
  householdsWorkedLakh: number | null;
  individualsWorkedLakh: number | null;
  differentlyAbledWorked: number | null;
  gpsWithNilExpenditure: number | null;
  worksTakenUpLakh: number | null;
  ongoingWorksLakh: number | null;
  completedWorks: number | null;
  totalExpenditureRupees: number | null;
  wagesRupees: number | null;
  materialSkilledRupees: number | null;
  adminExpenditureRupees: number | null;
  paymentsWithin15DaysPct: number | null;
  /** As printed, for the checks only. */
  printed: { materialPct: number | null; adminPct: number | null };
}

export interface NregaGlance {
  stateName: string;
  districtName: string;
  /** YYYY-MM-DD, the page's "As on" date. */
  asOf: string;
  blocks: number | null;
  gps: number | null;
  jobCardsIssuedLakh: number | null;
  workersLakh: number | null;
  activeJobCardsLakh: number | null;
  activeWorkersLakh: number | null;
  /** Newest financial year first. */
  years: NregaYear[];
}

const num = (s: string | undefined): number | null => {
  if (s === undefined) return null;
  const t = s.replace(/&nbsp;| /g, "").replace(/,/g, "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};
const rupeesFromLakh = (v: number | null) => (v === null ? null : Math.round(v * 100_000));

type YearKey = Exclude<keyof NregaYear, "fy" | "printed"> | "materialPct" | "adminPct" | "totalExpLakh" | "wagesLakh" | "materialLakh" | "adminLakh";
const YEAR_ROWS: Array<[RegExp, YearKey]> = [
  [/^approved labour budget/i, "labourBudgetLakhPersondays"],
  [/^persondays of central liability/i, "persondaysLakh"],
  [/^% of total lb/i, "pctOfLabourBudget"],
  [/^sc persondays/i, "scPersondaysPct"],
  [/^st persondays/i, "stPersondaysPct"],
  [/^women persondays/i, "womenPersondaysPct"],
  [/^average days of employment/i, "avgDaysPerHousehold"],
  [/^average wage rate/i, "avgWagePerDayRupees"],
  [/100 days of wage employment/i, "households100Days"],
  [/^total households worked/i, "householdsWorkedLakh"],
  [/^total individuals worked/i, "individualsWorkedLakh"],
  [/^differently abled/i, "differentlyAbledWorked"],
  [/nil exp/i, "gpsWithNilExpenditure"],
  [/works takenup/i, "worksTakenUpLakh"],
  [/^number of ongoing works/i, "ongoingWorksLakh"],
  [/^number of completed works/i, "completedWorks"],
  [/^total exp\s*\(/i, "totalExpLakh"],
  [/^wages\s*\(/i, "wagesLakh"],
  [/^material and skilled wages/i, "materialLakh"],
  [/^material\s*\(%\)/i, "materialPct"],
  [/^total adm expenditure/i, "adminLakh"],
  [/^admin exp\s*\(%\)/i, "adminPct"],
  [/payments ge\w*rated within 15 days/i, "paymentsWithin15DaysPct"],
];

/** Parse the district figures page. Returns null when the table or its header is missing. */
export function parseNregaGlance(html: string): NregaGlance | null {
  const $ = cheerio.load(html);
  const table = $("#GridView1");
  if (table.length === 0) return null;
  const rows = table.find("tr").toArray().map((tr) =>
    $(tr)
      .children("td,th")
      .toArray()
      .map((c) => $(c).text().replace(/ /g, " ").replace(/\s+/g, " ").trim()),
  );

  const head = rows[0]?.join(" ") ?? "";
  const hm = /State\s*:\s*(.+?)\s+District\s*:\s*(.+?)\s+As on\s+(\d{2})-(\d{2})-(\d{4})/i.exec(head);
  if (!hm) return null;
  const asOf = `${hm[5]}-${hm[4]}-${hm[3]}`;

  const single = (re: RegExp) => {
    const r = rows.find((x) => x.length === 2 && re.test(x[0]));
    return r ? num(r[1]) : null;
  };

  const fyRow = rows.find((x) => /progress/i.test(x[0] ?? "") && x.some((c) => /^FY\s*\d{4}-\d{4}$/i.test(c)));
  if (!fyRow) return null;
  const fyCols = fyRow
    .map((c, i) => ({ i, fy: /^FY\s*(\d{4}-\d{4})$/i.exec(c)?.[1] ?? null }))
    .filter((c): c is { i: number; fy: string } => c.fy !== null);

  const values = new Map<YearKey, Array<number | null>>();
  for (const r of rows) {
    const hit = YEAR_ROWS.find(([re]) => re.test(r[0] ?? ""));
    if (!hit || values.has(hit[1])) continue;
    values.set(hit[1], fyCols.map((c) => num(r[c.i])));
  }
  const v = (k: YearKey, idx: number) => values.get(k)?.[idx] ?? null;

  const years: NregaYear[] = fyCols.map((c, idx) => ({
    fy: c.fy,
    labourBudgetLakhPersondays: v("labourBudgetLakhPersondays", idx),
    persondaysLakh: v("persondaysLakh", idx),
    pctOfLabourBudget: v("pctOfLabourBudget", idx),
    womenPersondaysPct: v("womenPersondaysPct", idx),
    scPersondaysPct: v("scPersondaysPct", idx),
    stPersondaysPct: v("stPersondaysPct", idx),
    avgDaysPerHousehold: v("avgDaysPerHousehold", idx),
    avgWagePerDayRupees: v("avgWagePerDayRupees", idx),
    households100Days: v("households100Days", idx),
    householdsWorkedLakh: v("householdsWorkedLakh", idx),
    individualsWorkedLakh: v("individualsWorkedLakh", idx),
    differentlyAbledWorked: v("differentlyAbledWorked", idx),
    gpsWithNilExpenditure: v("gpsWithNilExpenditure", idx),
    worksTakenUpLakh: v("worksTakenUpLakh", idx),
    ongoingWorksLakh: v("ongoingWorksLakh", idx),
    completedWorks: v("completedWorks", idx),
    totalExpenditureRupees: rupeesFromLakh(v("totalExpLakh", idx)),
    wagesRupees: rupeesFromLakh(v("wagesLakh", idx)),
    materialSkilledRupees: rupeesFromLakh(v("materialLakh", idx)),
    adminExpenditureRupees: rupeesFromLakh(v("adminLakh", idx)),
    paymentsWithin15DaysPct: v("paymentsWithin15DaysPct", idx),
    printed: { materialPct: v("materialPct", idx), adminPct: v("adminPct", idx) },
  }));

  return {
    stateName: hm[1].trim(),
    districtName: hm[2].trim(),
    asOf,
    blocks: single(/^total no\. of blocks/i),
    gps: single(/^total no\. of gps/i),
    jobCardsIssuedLakh: single(/jobcards issued/i),
    workersLakh: single(/^total no\. of workers/i),
    activeJobCardsLakh: single(/^total no\. of active job cards/i),
    activeWorkersLakh: single(/^total no\. of active workers/i),
    years,
  };
}

/** Indian financial year of a YYYY-MM-DD date: "2026-09-27" → "2026-2027", "2027-02-01" → "2026-2027". */
export function financialYearOf(isoDate: string): string {
  const [y, m] = isoDate.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${start}-${start + 1}`;
}

const LAKH = 100_000;

/** Problems with one financial year's column; empty = keep it. */
export function nregaYearProblems(y: NregaYear): string[] {
  const p: string[] = [];
  const nums = Object.entries(y).filter(([k, x]) => k !== "fy" && k !== "printed" && typeof x === "number") as Array<[string, number]>;
  for (const [k, x] of nums) if (x < 0) p.push(`${k} negative`);
  for (const k of ["womenPersondaysPct", "scPersondaysPct", "stPersondaysPct", "paymentsWithin15DaysPct"] as const) {
    const x = y[k];
    if (x !== null && x > 100) p.push(`${k} ${x}% above 100`);
  }
  if (y.pctOfLabourBudget !== null && y.pctOfLabourBudget > 300) p.push(`% of labour budget ${y.pctOfLabourBudget}`);

  const { totalExpenditureRupees: t, wagesRupees: w, materialSkilledRupees: m, adminExpenditureRupees: a } = y;
  if (t === null || w === null || m === null || a === null) {
    p.push("money figures missing");
  } else {
    if (Math.abs(t - (w + m + a)) > LAKH) p.push(`total ₹${t} ≠ wages + material + admin ₹${w + m + a}`);
    if (y.printed.materialPct !== null && w + m > 0 && Math.abs((m / (w + m)) * 100 - y.printed.materialPct) > 0.6)
      p.push(`material % printed ${y.printed.materialPct}, works out to ${((m / (w + m)) * 100).toFixed(2)}`);
    if (y.printed.adminPct !== null && t > 0 && Math.abs((a / t) * 100 - y.printed.adminPct) > 0.6)
      p.push(`admin % printed ${y.printed.adminPct}, works out to ${((a / t) * 100).toFixed(2)}`);
  }
  // Not checked: "% of Total LB" against persondays ÷ budget. In some
  // states (Pune, Maharashtra) the % counts state-funded days that the
  // "central liability" persondays row leaves out, so it is not an identity.
  if (y.persondaysLakh && y.persondaysLakh > 0 && y.avgWagePerDayRupees !== null && (y.avgWagePerDayRupees < 100 || y.avgWagePerDayRupees > 1000))
    p.push(`wage ₹${y.avgWagePerDayRupees} a day`);
  return p;
}

/**
 * Problems with the page as a whole (wrong district, stale, misaligned);
 * empty = usable. `today` is YYYY-MM-DD.
 */
export function nregaGlanceProblems(g: NregaGlance, want: { state: string; district: string }, today: string): string[] {
  const p: string[] = [];
  if (normName(g.districtName) !== normName(want.district)) p.push(`page is for ${g.districtName}, asked for ${want.district}`);
  if (normName(g.stateName) !== normName(want.state)) p.push(`page is for ${g.stateName}, asked for ${want.state}`);
  const age = (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${g.asOf}T00:00:00Z`)) / 86_400_000;
  if (!Number.isFinite(age) || age < -1 || age > 10) p.push(`"As on ${g.asOf}" is not recent`);
  if (g.years.length < 2) p.push("fewer than two financial years");
  else if (g.years[0].fy !== financialYearOf(g.asOf)) p.push(`first column is FY ${g.years[0].fy}, expected ${financialYearOf(g.asOf)}`);
  if (g.blocks !== null && g.gps !== null && (g.blocks <= 0 || g.gps < g.blocks)) p.push(`${g.blocks} blocks, ${g.gps} panchayats`);
  return p;
}

/**
 * What is stored: the page's figures minus the check-only fields, years
 * that failed dropped. For the page that shows it: "…Lakh" counts are
 * rounded by the source to 0.01 lakh (1,000), so a small district can
 * read 0 — show "fewer than 1,000", never "0 people".
 */
export interface NregaSnapshotData extends Omit<NregaGlance, "years"> {
  years: Array<Omit<NregaYear, "printed">>;
  /** Financial years left out because the page's own figures did not add up. */
  droppedYears: Array<{ fy: string; reason: string }>;
}

export function toNregaSnapshot(g: NregaGlance): { data: NregaSnapshotData; newestYearProblems: string[] } {
  const kept: NregaSnapshotData["years"] = [];
  const dropped: NregaSnapshotData["droppedYears"] = [];
  let newestYearProblems: string[] = [];
  g.years.forEach((y, i) => {
    const probs = nregaYearProblems(y);
    if (i === 0) newestYearProblems = probs;
    if (probs.length > 0) {
      dropped.push({ fy: y.fy, reason: probs.join("; ") });
      return;
    }
    const { printed: _printed, ...rest } = y;
    void _printed;
    kept.push(rest);
  });
  const { years: _years, ...head } = g;
  void _years;
  return { data: { ...head, years: kept, droppedYears: dropped }, newestYearProblems };
}
