/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Data verification — comparison and tolerance rules (pure)
//
// Every "do these two sources agree?" decision lives here, so the rules
// are unit-tested (tests/verification-compare.test.ts) and the same
// everywhere:
//   weather   current temperature within ±3 °C, readings ≤ 90 min apart
//   dams      % full within ±2 points, same reading day (IST)
//   mandi     our average modal price within ±15 % of the second source's
//             district modal, or inside its min–max range (±5 %)
//   leaders   the same person (spelling variants, initials and titles allowed)
// and the verdict for a row (decideStatus): "verified" needs TWO
// independent sources that agree — the one we show counts when it is an
// outside feed (OpenWeather, AGMARKNET), not when it was typed in by hand.
// ═══════════════════════════════════════════════════════════
import type { DatasetStatus } from "@/lib/freshness";
import { levenshtein } from "@/lib/text/levenshtein";
import type { ReasonCode, RowStatus, SourceCheck } from "./types";

export { levenshtein };

// ── Numbers ─────────────────────────────────────────────────

export const WEATHER_TOLERANCE_C = 3;
/** Two readings further apart than this are not compared (weather moves). */
export const WEATHER_MAX_GAP_MIN = 90;
/** A stored reading older than this is "too old to check" (the freshness check flags it). */
export const WEATHER_MAX_STORED_AGE_MIN = 180;
export const DAM_TOLERANCE_POINTS = 2;
export const MANDI_RELATIVE_TOLERANCE = 0.15;
export const MANDI_RANGE_SLACK = 0.05;

/** |a − b| ≤ tol, for finite numbers only. */
export function withinAbs(a: number, b: number, tol: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol + 1e-9;
}

/** |a − b| ≤ frac × |b| (b is the reference), for finite numbers only; b = 0 needs a = 0. */
export function withinRel(a: number, b: number, frac: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  if (b === 0) return a === 0;
  return Math.abs(a - b) <= frac * Math.abs(b) + 1e-9;
}

export interface TemperatureComparison {
  /** null = not compared (readings too far apart in time). */
  agreed: boolean | null;
  diff: number;
  gapMinutes: number;
}

/**
 * Compare two temperature readings. They are compared only when their
 * measurement times are at most WEATHER_MAX_GAP_MIN apart.
 */
export function compareTemperature(
  a: { temperature: number; recordedAt: Date },
  b: { temperature: number; recordedAt: Date },
  tolC = WEATHER_TOLERANCE_C,
): TemperatureComparison {
  const gapMinutes = Math.abs(a.recordedAt.getTime() - b.recordedAt.getTime()) / 60_000;
  const diff = Math.round(Math.abs(a.temperature - b.temperature) * 10) / 10;
  if (!Number.isFinite(gapMinutes) || gapMinutes > WEATHER_MAX_GAP_MIN) return { agreed: null, diff, gapMinutes };
  return { agreed: withinAbs(a.temperature, b.temperature, tolC), diff, gapMinutes };
}

/** Dam % full within ±DAM_TOLERANCE_POINTS. */
export function compareDamPercent(stored: number, other: number, tolPoints = DAM_TOLERANCE_POINTS): boolean {
  return withinAbs(stored, other, tolPoints);
}

export interface PriceComparison {
  agreed: boolean;
  /** Mean of our modal prices for the commodity that day (₹/quintal). */
  storedMean: number;
  /** (ours − theirs) ÷ theirs, in %, rounded to one decimal. */
  diffPct: number;
}

/**
 * Our market modal prices for one commodity and day vs the second source's
 * DISTRICT figures (it aggregates all markets). Agreed when our average
 * modal is within ±15 % of their modal, or inside their min–max (±5 %).
 */
export function compareModalPrice(
  storedModals: number[],
  ref: { min: number; max: number; modal: number },
  relTol = MANDI_RELATIVE_TOLERANCE,
  slack = MANDI_RANGE_SLACK,
): PriceComparison | null {
  const vals = storedModals.filter((v) => Number.isFinite(v) && v > 0);
  if (vals.length === 0 || !(ref.modal > 0)) return null;
  const storedMean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const diffPct = Math.round(((storedMean - ref.modal) / ref.modal) * 1000) / 10;
  const inRange =
    ref.min > 0 && ref.max >= ref.min && storedMean >= ref.min * (1 - slack) && storedMean <= ref.max * (1 + slack);
  return { agreed: withinRel(storedMean, ref.modal, relTol) || inRange, storedMean, diffPct };
}

// ── Dates ───────────────────────────────────────────────────

const IST_OFFSET_MS = 330 * 60_000;

/**
 * The Indian calendar day of an instant, "YYYY-MM-DD". Market days and
 * reservoir days are Indian days: our collectors store them either as UTC
 * midnight or as IST midnight (18:30 UTC the day before) — both map to the
 * same key here.
 */
export function istDayKey(d: Date): string {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** "2025-10-30" → that day at UTC midnight, or null. */
export function parseIsoDay(s: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((s ?? "").trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCDate() === Number(m[3]) ? d : null;
}

// ── Verdict ─────────────────────────────────────────────────

export interface Verdict {
  status: RowStatus;
  agreed: boolean | null;
  reason: ReasonCode;
}

/**
 * Decide a cross-source row's status from its outside checks.
 *
 *  - a source that answered and disagrees        → "disagreement"
 *  - no outside source at all                    → "single-source" (no-second-source)
 *  - outside sources, none could answer          → "single-source" (noAnswerReason)
 *  - all answers agree and ≥ 2 independent
 *    sources agree (the shown one counts only
 *    when `primaryCounts`)                       → "verified"
 *  - all answers agree but fewer than 2          → "single-source"
 *    ("same-publisher" when every answer was a re-read of the same publisher)
 */
export function decideStatus(
  checks: SourceCheck[],
  opts: { primaryCounts: boolean; noAnswerReason?: ReasonCode },
): Verdict {
  const noAnswerReason = opts.noAnswerReason ?? "second-source-no-data";
  if (checks.length === 0) return { status: "single-source", agreed: null, reason: "no-second-source" };
  const answered = checks.filter((c) => c.agreed !== null);
  if (answered.length === 0) return { status: "single-source", agreed: null, reason: noAnswerReason };
  if (answered.some((c) => c.agreed === false)) {
    // One independent source confirms us and another does not (e.g. Wikidata
    // still lists last year's office holder): not a disagreement with us —
    // confirmed by one source, and the caller still raises a review item.
    if (answered.some((c) => c.agreed === true && c.independent)) {
      return { status: "single-source", agreed: true, reason: "sources-split" };
    }
    return { status: "disagreement", agreed: false, reason: "sources-disagree" };
  }
  const independentAgreeing = answered.filter((c) => c.independent).length + (opts.primaryCounts ? 1 : 0);
  if (independentAgreeing >= 2) return { status: "verified", agreed: true, reason: "sources-agree" };
  if (answered.every((c) => !c.independent)) return { status: "single-source", agreed: true, reason: "same-publisher" };
  return { status: "single-source", agreed: true, reason: noAnswerReason };
}

/**
 * A freshness judgement (src/lib/freshness.ts judgeDataset) → row status:
 * current/reference → fresh, late → stale, unknown date / nothing
 * collected → unchecked.
 */
export function freshnessVerdict(status: DatasetStatus): { status: RowStatus; reason: ReasonCode } {
  switch (status) {
    case "current":
    case "reference":
      return { status: "fresh", reason: "on-time" };
    case "late":
      return { status: "stale", reason: "late" };
    case "unknown":
      return { status: "unchecked", reason: "no-date" };
    case "not_collected":
      return { status: "unchecked", reason: "not-collected" };
  }
}

// ── Names ───────────────────────────────────────────────────

const TITLES = new Set([
  "shri", "sri", "shree", "smt", "shrimati", "kumari", "km", "selvi", "thiru", "thirumathi",
  "dr", "mr", "mrs", "ms", "prof", "hon", "honble", "justice", "adv", "capt", "col", "gen", "retd",
  "ias", "ips", "ifs", "irs", "mla", "mp",
]);

/** Lower-case latin tokens of a person's name, without titles, punctuation or "(…)" notes. */
export function nameTokens(name: string): string[] {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !TITLES.has(t));
}


function tokenMatches(short: string, long: string): boolean {
  if (short === long) return true;
  if (short.length === 1) return long.startsWith(short);
  return short.length >= 5 && long.length >= 5 && levenshtein(short, long) <= 1;
}

/**
 * True when two strings name the same person. Allows spelling variants
 * ("Thaavar Chand Gehlot" / "Thawar Chand Gehlot"), initials and spacing
 * ("D.K. Shivakumar" / "D. K. Shivakumar" / "DK Shivakumar"), titles
 * ("Vishak G Iyer, IAS"), word order ("Yogi Adityanath" / "Adityanath
 * Yogi") and a missing middle name ("Rajendra Arlekar"). A lone surname
 * never matches a full name.
 */
export function namesMatch(a: string, b: string): boolean {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const sa = ta.join("");
  const sb = tb.join("");
  if (sa === sb) return true;
  if (Math.min(sa.length, sb.length) >= 8 && 1 - levenshtein(sa, sb) / Math.max(sa.length, sb.length) >= 0.85) return true;

  return subsetMatch(ta, tb) || subsetMatch(tb, ta);
}

/**
 * Every word of `short` matches a different word of `long` (an initial
 * matches a word with that first letter; words of 5+ letters may differ
 * by one letter). Needs at least one full word, and a lone word must be
 * 6+ letters, so a bare surname never matches a full name.
 */
function subsetMatch(short: string[], long: string[]): boolean {
  if (short.length > long.length) return false;
  if (!short.some((t) => t.length > 1)) return false;
  if (short.length === 1 && short[0].length < 6) return false;
  const used = new Set<number>();
  // Full words first, so an initial cannot take the word a full token needs.
  const order = [...short].sort((x, y) => y.length - x.length);
  for (const t of order) {
    const idx = long.findIndex((l, i) => !used.has(i) && tokenMatches(t, l));
    if (idx < 0) return false;
    used.add(idx);
  }
  return true;
}

/** True when `name` matches any of the candidate spellings. */
export function namesMatchAny(name: string, candidates: readonly string[]): boolean {
  return candidates.some((c) => namesMatch(name, c));
}

// ── Placeholders ────────────────────────────────────────────

const PLACEHOLDER_RE =
  /[[\]]|verify at|not available|to be (updated|announced|confirmed|notified)|\btb[ad]\b|\bvacant\b|placeholder|update soon|awaited/i;
const WHOLE_PLACEHOLDER_RE = /^\s*(n\/?a|nil|none|unknown|-+|—|–|\?+|name|officer)\s*$/i;

/** Words that make up a job title, not a person's name. */
const ROLE_WORDS = new Set([
  "deputy", "commissioner", "collector", "district", "magistrate", "superintendent", "of", "police",
  "sp", "dc", "dm", "adc", "acp", "dcp", "cp", "ssp", "additional", "addl", "joint", "assistant",
  "officer", "chief", "executive", "ceo", "zilla", "zila", "panchayat", "parishad", "division",
  "urban", "rural", "city", "the", "and", "municipal", "corporation", "mayor", "president",
  "secretary", "member", "head", "in", "charge", "incharge", "office", "department", "dept",
  "ias", "ips", "sub", "divisional", "tahsildar", "tehsildar", "west", "east", "north", "south", "central",
]);

/**
 * True when a leader's name field holds a placeholder instead of a person:
 * "[Verify at mandya.nic.in]", "[Name Not Available]", "Vacant", or a
 * name made only of job-title and place words ("Deputy Commissioner,
 * Bengaluru Urban", "SP, Mysuru Rural", "ADC, Mysuru Division").
 * `placeWords` = the district's and state's names (and slugs).
 */
export function isPlaceholderName(name: string | null | undefined, placeWords: readonly string[] = []): boolean {
  const n = (name ?? "").trim();
  if (!n) return true;
  if (PLACEHOLDER_RE.test(n) || WHOLE_PLACEHOLDER_RE.test(n)) return true;
  const toks = n.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  // A name in another script cannot be judged this way; do not flag it.
  if (toks.length === 0) return false;
  const place = new Set(placeWords.flatMap((w) => w.toLowerCase().split(/[^a-z]+/)).filter(Boolean));
  return toks.every((t) => ROLE_WORDS.has(t) || place.has(t));
}

// ── Formatting (admin notes and review headlines; English on purpose) ──

export function fmtNumber(n: number, digits = 1): string {
  return Number.isFinite(n) ? String(Math.round(n * 10 ** digits) / 10 ** digits) : "—";
}

/** "3 Jun 2026" (the Indian calendar day). */
export function fmtDay(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return "unknown date";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
