/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Jal Jeevan Mission dashboard — request encoding, parsers and checks
// (pure: no DB, no network).
//
// Source: the public JJM dashboard, https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx
// (Ministry of Jal Shakti). Its page loads its numbers from ASP.NET page
// methods, POST JSON, no login and no captcha (checked 27 Sep 2026):
//
//   POST …/JJMIndia.aspx/BindDistrictMap     the map: one row per state
//        (StCode11 "0", Param "0") or per district of a state (StCode11 =
//        the state's code, Param "1"): Name, Value = rural homes with a tap
//        connection today, Total = rural homes, Per = Value ÷ Total in %.
//   POST …/JJMIndia.aspx/Bind_table_graph    the table under the map, same
//        units, plus HCPWS_01042019 = homes that already had a tap on
//        15 Aug 2019 (when the mission started) and LastSevenDays.
//
// Every argument is sent through the page's own encodeTxt() (escape, shift
// each character by 1, escape again, append "1"). Cat "0" = households,
// SubCat "0" = "as on today" (SubCat "1" = as on 15 Aug 2019).
//
// Double check: a district is written only when the map and the table
// (two separate endpoints) give the same homes and taps, and Per agrees
// with Value ÷ Total. JJM covers RURAL homes only; fully urban districts
// (Chennai, Hyderabad, Kolkata, Mumbai, New Delhi) are not in its lists.
// ═══════════════════════════════════════════════════════════

export const JJM_BASE = "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx";
export const JJM_PUBLIC_URL = "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx";
/** JJMStatus.source for rows written by this collector (the dedupe key). */
export const JJM_SOURCE = "Jal Jeevan Mission dashboard (ejalshakti.gov.in) — district total, rural homes";

/** The dashboard's own encodeTxt(): escape → shift each char by 1 → escape → append "1". */
export function encodeJjmParam(value: string | number, shift = 1): string {
  const once = escape(String(value));
  const shifted = Array.from(once, (c) => String.fromCharCode(c.charCodeAt(0) + shift)).join("");
  return escape(shifted) + String(shift);
}

/** Request body for BindDistrictMap / Bind_table_graph. */
export function jjmRequestBody(stateCode: string, level: "states" | "districts"): string {
  return JSON.stringify({
    StCode11: encodeJjmParam(level === "states" ? "0" : stateCode),
    Cat: encodeJjmParam("0"),
    SubCat: encodeJjmParam("0"),
    Param: encodeJjmParam(level === "states" ? "0" : "1"),
  });
}

export interface JjmRow {
  /** State or district code on the dashboard (KeyValue). */
  code: string;
  name: string;
  /** Rural homes with a tap connection, as on the day of the reading. */
  withTap: number;
  /** All rural homes. */
  households: number;
  /** Coverage % as the dashboard prints it. */
  pct: number;
  /** Homes that already had a tap on 15 Aug 2019 (table endpoint only). */
  withTapAtStart?: number | null;
}

const int = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isInteger(v) && v >= 0 ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/,/g, "").trim();
  return /^\d+$/.test(s) ? Number(s) : null;
};
const num = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const s = v.replace(/,/g, "").trim();
  return /^\d+(\.\d+)?$/.test(s) ? Number(s) : null;
};

/**
 * Parse a BindDistrictMap or Bind_table_graph response ({ d: [...] }).
 * Rows with a missing or non-numeric figure are dropped, never filled in.
 * Returns null when the body is not the expected shape at all.
 */
export function parseJjmRows(body: unknown): JjmRow[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { d?: unknown }).d)) return null;
  const out: JjmRow[] = [];
  for (const r of (body as { d: Array<Record<string, unknown>> }).d) {
    if (!r || typeof r !== "object") continue;
    const name = typeof r.Name === "string" ? r.Name.replace(/\s+/g, " ").trim() : "";
    const code = typeof r.KeyValue === "string" ? r.KeyValue.trim() : "";
    const withTap = int(r.Value);
    const households = int(r.Total);
    const pct = num(r.Per);
    if (!name || !code || withTap === null || households === null || pct === null) continue;
    out.push({
      code,
      name,
      withTap,
      households,
      pct,
      withTapAtStart: "HCPWS_01042019" in r ? int(r.HCPWS_01042019) : null,
    });
  }
  return out;
}

/** Problems with one district row; an empty list means it may be written. */
export function jjmRowProblems(r: JjmRow): string[] {
  const p: string[] = [];
  if (r.households < 100) p.push(`only ${r.households} homes listed`);
  if (r.withTap > r.households) p.push(`more taps (${r.withTap}) than homes (${r.households})`);
  if (r.pct < 0 || r.pct > 100) p.push(`coverage ${r.pct}% outside 0–100`);
  if (r.households > 0) {
    const derived = (r.withTap / r.households) * 100;
    // The dashboard rounds to 2 decimals.
    if (Math.abs(derived - r.pct) > 0.05) p.push(`printed ${r.pct}% but ${r.withTap} ÷ ${r.households} = ${derived.toFixed(2)}%`);
  }
  if (r.withTapAtStart != null && r.withTapAtStart > r.households) p.push("more taps in 2019 than homes today");
  return p;
}

/**
 * Cross-check the map row against the table row for the same district.
 * Returns the problems (empty = both endpoints agree).
 */
export function jjmCrossCheck(map: JjmRow, table: JjmRow | null): string[] {
  if (!table) return ["district missing from the table endpoint"];
  const p: string[] = [];
  if (map.households !== table.households) p.push(`homes differ: map ${map.households}, table ${table.households}`);
  if (map.withTap !== table.withTap) p.push(`taps differ: map ${map.withTap}, table ${table.withTap}`);
  return p;
}
