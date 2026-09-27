/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Courts — read NJDG's public dashboards (pure: no network, no DB)
//
// NJDG draws its dashboards from values it prints into the page:
//   charts('24073','25715','49788','41201','42905','84106', …)
//       → older-than-1-year civil, criminal, total; pending civil,
//         criminal, total (the High Court page drops the quotes)
//   pendingAgewiseBarChart('Less than one year','17128~…','17190~…', …)
//       → pending by age, civil then criminal:
//         <1 year, 1–3, 3–5, 5–10, >10 years
//   fetchStateData('ins',2) … >1462<     (2 = civil, 3 = criminal, 1 = total)
//       ins / disp          instituted / disposed "in last month"
//       insCurr / dispCurr  instituted / disposed in the current year (HC page)
// and its JSON endpoints answer with a few blank lines, then JSON whose
// lists are "~"-separated strings ("2026~2025~…").
//
// Every parser returns null for a figure it cannot read. Nothing is
// guessed: a missing figure stays missing (CLAUDE.md, no fabrication).
// ═══════════════════════════════════════════════════════════

/** Civil + criminal + total, as NJDG prints them. */
export interface SplitCount {
  civil: number;
  criminal: number;
  total: number;
}

/** Pending cases by age: [<1 year, 1–3, 3–5, 5–10, >10 years]. */
export type AgeBands = [number, number, number, number, number];

/** Cases instituted and disposed in one calendar year. */
export interface YearFlow {
  year: number;
  instituted: number;
  disposed: number;
}

/** What the district (or High Court) page itself shows. */
export interface DashboardPage {
  pending: SplitCount;
  age: { civil: AgeBands; criminal: AgeBands } | null;
  lastMonth: { instituted: SplitCount | null; disposed: SplitCount | null };
  /** High Court page only: this calendar year so far. */
  currentYear: { instituted: SplitCount | null; disposed: SplitCount | null };
  /** The session token NJDG expects on its JSON endpoints ("" when absent). */
  appToken: string;
}

/** What the "Pending" dashboard JSON adds. */
export interface PendingDashboard {
  years: YearFlow[];
  /** Pending by age, 7 bands: <1, 1–3, 3–5, 5–10, 10–20, 20–30, >30 years. */
  ageBands7: number[] | null;
}

/** How long the cases disposed in one year took, from the "Disposed" dashboard. */
export interface DecidedYear {
  year: number;
  /** Every case disposed that year (sum of the bands). */
  total: number;
  /** Cases by time taken: [<1 year, 1–3, 3–5, 5–10, >10 years]. */
  took: AgeBands;
}

/** "1,23,456" / "84106" / 84106 → 84106; anything else → null. */
export function toCount(value: unknown): number | null {
  if (typeof value === "number") return Number.isInteger(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const s = value.replace(/[,\s]/g, "");
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

/** "17128~10302~5855" → [17128, 10302, 5855]; null when any item is not a count. */
export function splitCounts(value: unknown): number[] | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parts = value.split("~").map((p) => toCount(p.replace(/"/g, "")));
  return parts.every((p): p is number => p !== null) ? parts : null;
}

/** NJDG's JSON answers start with blank lines; parse from the first "{". */
export function parseNjdgJson(text: string): Record<string, unknown> | null {
  const i = text.indexOf("{");
  if (i < 0) return null;
  try {
    const v: unknown = JSON.parse(text.slice(i));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The arguments of the first call `name(...)` in the page, as strings. */
function callArgs(html: string, name: string): string[] | null {
  const re = new RegExp(`${name}\\(([^)]*)\\)`);
  const m = re.exec(html);
  if (!m) return null;
  // Arguments are simple literals: '123', 123, 'a~b', "(41%)"~… — split on
  // commas that are outside quotes.
  const out: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (const ch of m[1]) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function toBands(v: string | undefined): AgeBands | null {
  const n = splitCounts(v);
  return n && n.length === 5 ? (n as AgeBands) : null;
}

/** Numbers behind fetchStateData('<key>', 2|3|1) links → civil / criminal / total. */
function linkedSplit(html: string, key: string): SplitCount | null {
  const re = new RegExp(`fetchStateData\\('${key}',\\s*'?([123])'?\\)[^>]*>\\s*([\\d,]+)\\s*<`, "g");
  const got: Record<string, number> = {};
  for (const m of html.matchAll(re)) {
    const n = toCount(m[2]);
    // First occurrence wins (the page repeats some tables in hidden tabs).
    if (n !== null && got[m[1]] === undefined) got[m[1]] = n;
  }
  const [civil, criminal, total] = [got["2"], got["3"], got["1"]];
  // NJDG leaves a cell empty when a court has no cases of that kind (the
  // Mumbai CMM courts have no civil side). With the other two printed,
  // the empty one follows from total = civil + criminal; with two or
  // more missing, the row is not usable.
  if (civil !== undefined && criminal !== undefined && total !== undefined) return { civil, criminal, total };
  if (civil === undefined && criminal !== undefined && total !== undefined && total >= criminal) {
    return { civil: total - criminal, criminal, total };
  }
  if (criminal === undefined && civil !== undefined && total !== undefined && total >= civil) {
    return { civil, criminal: total - civil, total };
  }
  if (total === undefined && civil !== undefined && criminal !== undefined) return { civil, criminal, total: civil + criminal };
  return null;
}

/**
 * Parse the NJDG district page (or the HC-NJDG High Court page).
 * Returns null when the pending totals cannot be read: without them the
 * page is not usable at all.
 */
export function parseDashboardPage(html: string): DashboardPage | null {
  const chart = callArgs(html, "charts");
  if (!chart || chart.length < 6) return null;
  const civil = toCount(chart[3]);
  const criminal = toCount(chart[4]);
  const total = toCount(chart[5]);
  if (civil === null || criminal === null || total === null) return null;

  const ageArgs = callArgs(html, "pendingAgewiseBarChart");
  const ageCivil = toBands(ageArgs?.[1]);
  const ageCriminal = toBands(ageArgs?.[2]);

  const token = /name=["']app_token["'][^>]*value=["']([0-9a-f]*)["']/i.exec(html)?.[1] ?? "";

  return {
    pending: { civil, criminal, total },
    age: ageCivil && ageCriminal ? { civil: ageCivil, criminal: ageCriminal } : null,
    lastMonth: { instituted: linkedSplit(html, "ins"), disposed: linkedSplit(html, "disp") },
    currentYear: { instituted: linkedSplit(html, "insCurr"), disposed: linkedSplit(html, "dispCurr") },
    appToken: token,
  };
}

/** Parse the "Pending" dashboard JSON (newPendDashboard, active_tab=pending). */
export function parsePendingDashboard(json: Record<string, unknown>): PendingDashboard | null {
  const years = splitCounts(json.insyear);
  const ins = splitCounts(json.ins_count);
  const disp = splitCounts(json.disp_count);
  if (!years || !ins || !disp || years.length === 0 || years.length !== ins.length || years.length !== disp.length) return null;
  const flows: YearFlow[] = years
    .map((year, i) => ({ year, instituted: ins[i], disposed: disp[i] }))
    .filter((f) => f.year >= 1950 && f.year <= 2100)
    .sort((a, b) => a.year - b.year);
  const age7 = splitCounts(json.agewise_count);
  return { years: flows, ageBands7: age7 && age7.length === 7 ? age7 : null };
}

/**
 * The lower bound in years of one "time taken" label from the Disposed
 * dashboard: "Within#1#year" → 0, "4-5#year" → 4, "More#Than#21#Years" → 21.
 */
export function tookLowerYears(label: string): number | null {
  const s = label.replace(/[#"]/g, " ").trim().toLowerCase();
  if (/^within\s+1\s+year/.test(s)) return 0;
  const range = /^(\d+)\s*-\s*(\d+)\s*year/.exec(s);
  if (range) return Number(range[1]);
  const more = /^more\s+than\s+(\d+)\s*year/.exec(s);
  if (more) return Number(more[1]);
  return null;
}

/** Band index for a lower bound in years: 0 → <1, 1–2 → 1–3, 3–4 → 3–5, 5–9 → 5–10, 10+ → >10. */
function bandOf(lower: number): number {
  if (lower < 1) return 0;
  if (lower < 3) return 1;
  if (lower < 5) return 2;
  if (lower < 10) return 3;
  return 4;
}

/** Parse the "Disposed" dashboard JSON for one year (time taken to decide). */
export function parseDisposedDashboard(json: Record<string, unknown>, year: number): DecidedYear | null {
  const labels = typeof json.dispYear === "string" ? json.dispYear.split("~") : null;
  const counts = splitCounts(json.dispCount);
  if (!labels || !counts || labels.length !== counts.length || labels.length === 0) return null;
  const took: AgeBands = [0, 0, 0, 0, 0];
  for (let i = 0; i < labels.length; i++) {
    const lower = tookLowerYears(labels[i]);
    if (lower === null) return null; // an unknown label: do not guess its band
    took[bandOf(lower)] += counts[i];
  }
  const total = took.reduce((s, n) => s + n, 0);
  return total > 0 ? { year, total, took } : null;
}
