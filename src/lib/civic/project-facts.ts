/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Project facts — plain answers about one infrastructure project
// ═══════════════════════════════════════════════════════════════════════
//  Pure helpers (no React, no database) used by the Projects page and
//  safe to unit test (tests/project-facts.test.ts):
//
//    projectStage(status)   the ~45 status spellings in the database →
//                           announced | approved | building | completed |
//                           stalled | cancelled
//    projectKind(cat, name) the ~90 category spellings → one short closed
//                           list (road, rail, metro, water, …)
//    isNonProject(p)        a clear, safe rule for rows that are news
//                           items, not building work (a road RENAMING, a
//                           one-day railway MAINTENANCE BLOCK)
//    oneLine(description)   the first plain sentence of the description
//    projectPoints(p, all)  our own helpful points, computed only from the
//                           row: deadline passed, budget revised, no news
//                           for N days, progress not reported, only one
//                           source, may be the same as another row
//
//  Nothing here invents a figure: a point appears only when the data
//  needed for it is present.

export type ProjectStage = "announced" | "approved" | "building" | "completed" | "stalled" | "cancelled";

export type ProjectKind =
  | "road"
  | "bridge"
  | "metro"
  | "rail"
  | "airport"
  | "port"
  | "water"
  | "sewage"
  | "power"
  | "housing"
  | "health"
  | "education"
  | "parks"
  | "industry"
  | "city"
  | "other";

/** The fields these helpers read. InfraProject rows from the API fit it. */
export interface ProjectLike {
  id?: string;
  name: string;
  category?: string | null;
  status?: string | null;
  description?: string | null;
  budget?: number | null;
  originalBudget?: number | null;
  revisedBudget?: number | null;
  costOverrunPct?: number | null;
  expectedEnd?: string | Date | null;
  originalEndDate?: string | Date | null;
  revisedEndDate?: string | Date | null;
  lastNewsAt?: string | Date | null;
  lastVerifiedAt?: string | Date | null;
  progressPct?: number | null;
  delayMonths?: number | null;
  sourceUrls?: unknown;
  updates?: Array<{ date?: string | Date | null; newsUrl?: string | null }> | null;
}

const DAY = 86_400_000;

function toTime(v: string | Date | null | undefined): number | null {
  if (!v) return null;
  const t = v instanceof Date ? v.getTime() : new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

// ─────────────────────────────────────────────────────────────────────
//  Stage
// ─────────────────────────────────────────────────────────────────────

/** Any status spelling → one of six stages. Unknown or empty → "announced". */
export function projectStage(raw: string | null | undefined): ProjectStage {
  const s = (raw ?? "").trim().toUpperCase().replace(/[^A-Z]+/g, "_").replace(/^_|_$/g, "");
  if (!s) return "announced";
  if (/CANCEL|SCRAP|SHELV|DROPPED|WITHDRAWN|ABANDON/.test(s)) return "cancelled";
  if (/^(COMPLETED?|INAUGURATED|COMMISSIONED|OPERATIONAL|OPENED|DONE|FINISHED)$/.test(s)) return "completed";
  if (/STALL|HALT|SUSPEND|ON_HOLD|STUCK/.test(s)) return "stalled";
  if (
    /UNDER_CONSTRUCTION|IN_PROGRESS|ONGOING|^ACTIVE$|ON_TRACK|ADVANCING|UNDER_IMPLEMENTATION|NEARS_COMPLETION|PARTIALLY_OPERATIONAL|^DELAYED$|DEADLINE_UPDATED|WORK_STARTED|UNDER_WAY|UNDERWAY/.test(s)
  )
    return "building";
  if (/^APPROVED|SANCTION|TENDER|AWARDED|^FUNDED/.test(s)) return "approved";
  return "announced";
}

/** Sort order for "being built first": building, stalled, approved, announced, completed, cancelled. */
export const STAGE_ORDER: Record<ProjectStage, number> = {
  building: 0,
  stalled: 1,
  approved: 2,
  announced: 3,
  completed: 4,
  cancelled: 5,
};

// ─────────────────────────────────────────────────────────────────────
//  Kind (category)
// ─────────────────────────────────────────────────────────────────────

const KIND_RULES: Array<[ProjectKind, RegExp]> = [
  ["airport", /\b(airport|aviation|terminal\s*\d|runway)\b/],
  ["port", /\b(port|harbou?r|jetty)\b/],
  ["metro", /\b(metro|rrts|rapid\s*transit)\b/],
  ["rail", /\b(rail|railways?|train|trains|bullet\s*train|suburban)\b/],
  ["bridge", /\b(bridge|bridges|flyovers?|over\s*bridge|overbridge|underpass|rob|fob|interchange|setu|sea\s*link)\b/],
  ["city", /\b(bus|buses|bus\s*fleet|truck\s*terminal|e-?autos?|ev\s*autos?)\b/],
  ["sewage", /\b(sewage|sewer|stp|drains?|drainage|sanitation|waste|landfill|stormwater|flood)\b/],
  ["industry", /\b(industr\w*|factory|manufactur\w*|it\s*(park|city|region|investment|infrastructure|hub)|logistics|market|pharma|textile|investment)\b/],
  ["parks", /\b(parks?|gardens?|heritage|tourism|museum|memorial|stadium|sports?|culture|cultural|entertainment|wetlands?|safari|beautification)\b/],
  ["water", /\b(water|jjm|irrigation|dam|canal|desalination|river|riverfront|pipeline|lake|lakes)\b/],
  ["power", /\b(power|electric\w*|energy|gas|cng|lng|fuel|solar|street\s*lights?|ev)\b/],
  ["housing", /\b(housing|pmay|township|redevelopment|slum|flats|homes|2bhk)\b/],
  ["health", /\b(health\w*|hospitals?|medical|clinics?|aiims|medcity|oxygen)\b/],
  ["education", /\b(education|schools?|colleges?|university|classrooms?)\b/],
  ["road", /\b(roads?|highways?|expressway|freeway|bypass|ring\s*road|corridor|traffic|nh[-\s]?\d+|sh[-\s]?\d+|link\s*road)\b/],
  ["city", /\b(smart\s*city|urban|governance|planning|building|cctv|safe\s*city|fire|emergency|telecom|wi-?fi|bus\s*shelter|convention|parliament|command|transport\s*hub|supercomputer)\b/],
];

function kindFrom(text: string): ProjectKind | null {
  const s = text.toLowerCase().replace(/[_/&]+/g, " ");
  for (const [kind, re] of KIND_RULES) if (re.test(s)) return kind;
  return null;
}

/**
 * Category spelling → one closed list. When the category says nothing
 * useful ("Other", "Mega Project", "Infrastructure Corridor"), the
 * project name decides; otherwise "other".
 */
export function projectKind(category: string | null | undefined, name?: string | null): ProjectKind {
  const generic =
    !category ||
    /^(other|others|mega\s*project|misc\w*|general|environment|infrastructure(\s*corridor)?|urban\s*infrastructure|transport)$/i.test(category.trim());
  const fromCategory = generic ? null : kindFrom(category);
  if (fromCategory) return fromCategory;
  const fromName = name ? kindFrom(name) : null;
  return fromName ?? "other";
}

// ─────────────────────────────────────────────────────────────────────
//  Rows that are not building projects
// ─────────────────────────────────────────────────────────────────────

/**
 * A clear, safe rule, on the NAME only: a renaming ("Donald Trump Avenue
 * Renaming") or a railway maintenance block is a news item, not a
 * construction project. Anything less clear stays on the page.
 */
export const NON_PROJECT_RE = /\b(renam(e|ed|es|ing)|maintenance\s+block)\b/i;

export function isNonProject(p: Pick<ProjectLike, "name">): boolean {
  return NON_PROJECT_RE.test(p.name ?? "");
}

// ─────────────────────────────────────────────────────────────────────
//  Words and dates
// ─────────────────────────────────────────────────────────────────────

/** First sentence of a description, cut at a word boundary to `max` characters. */
export function oneLine(description: string | null | undefined, max = 160): string | null {
  if (!description) return null;
  const text = description.replace(/\s+/g, " ").trim();
  if (!text) return null;
  // End of the first sentence: ". " followed by a capital letter or digit.
  const m = /^(.+?[.!?])\s+(?=[A-Z0-9“"(])/.exec(text);
  const first = m ? m[1] : text;
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[,;:–—-]\s*$/, "")}…`;
}

/** The date the work is due to finish: revised, else original, else expected. */
export function finishDate(p: ProjectLike): string | Date | null {
  return p.revisedEndDate ?? p.originalEndDate ?? p.expectedEnd ?? null;
}

/** The newest information of any kind: a news report, our own check, or a tracked update. */
export function lastUpdateAt(p: ProjectLike): number | null {
  const times = [toTime(p.lastNewsAt), toTime(p.lastVerifiedAt), ...(p.updates ?? []).map((u) => toTime(u.date ?? null))].filter(
    (t): t is number => t !== null,
  );
  return times.length ? Math.max(...times) : null;
}

/** Whole days since a time (0 = today). */
export function daysAgo(time: number | null, now: number = Date.now()): number | null {
  return time === null ? null : Math.max(0, Math.floor((now - time) / DAY));
}

/** Latest reported budget in rupees: revised, else original, else the plain budget. */
export function budgetNow(p: ProjectLike): number | null {
  const v = p.revisedBudget ?? p.originalBudget ?? p.budget ?? null;
  return v !== null && Number.isFinite(v) && v > 0 ? v : null;
}

/** Change from the first to the latest budget, in %, when both are known. */
export function budgetChangePct(p: ProjectLike): number | null {
  if (p.costOverrunPct != null && Number.isFinite(p.costOverrunPct)) return p.costOverrunPct;
  const first = p.originalBudget ?? null;
  const now = p.revisedBudget ?? null;
  if (!first || !now || first <= 0) return null;
  return ((now - first) / first) * 100;
}

/** Distinct source links for a row: its own list plus every news update's link. */
export function sourceCount(p: ProjectLike): number {
  const urls = new Set<string>();
  const own = Array.isArray(p.sourceUrls) ? (p.sourceUrls as unknown[]) : [];
  for (const u of own) if (typeof u === "string" && /^https?:\/\//i.test(u.trim())) urls.add(u.trim());
  for (const u of p.updates ?? []) if (u.newsUrl && /^https?:\/\//i.test(u.newsUrl)) urls.add(u.newsUrl);
  return urls.size;
}

// ─────────────────────────────────────────────────────────────────────
//  Our points
// ─────────────────────────────────────────────────────────────────────

export type ProjectPoint =
  | { kind: "deadlinePassed"; months: number }
  | { kind: "budgetUp"; pct: number }
  | { kind: "budgetDown"; pct: number }
  | { kind: "noNews"; days: number }
  | { kind: "noNewsEver" }
  | { kind: "noNewsNoSource" }
  | { kind: "progressUnknown" }
  | { kind: "noSource" }
  | { kind: "oneSource" }
  | { kind: "maybeSame"; name: string }
  | { kind: "sameDescription"; name: string };

/** News older than this many days earns "No news for N days". */
export const NO_NEWS_DAYS = 90;
/** Budget changes smaller than this (in %) are not called out. */
const BUDGET_POINT_PCT = 5;

const STOP = new Set(["the", "and", "of", "to", "in", "at", "for", "a", "an", "project", "projects", "scheme", "new", "with", "from", "on", "by", "km"]);
const ROMAN: Record<string, string> = { i: "1", ii: "2", iii: "3", iv: "4", v: "5" };

function tokens(text: string | null | undefined): Set<string> {
  const out = new Set<string>();
  for (const w of (text ?? "").toLowerCase().split(/[^a-z0-9]+/)) {
    if (!w || STOP.has(w)) continue;
    out.add(ROMAN[w] ?? w);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let both = 0;
  for (const w of a) if (b.has(w)) both++;
  return both / (a.size + b.size - both);
}

/**
 * Another row in the same list that looks like the same project (nearly
 * the same name), or that carries the same description (usually a
 * copy-paste error, so one of the two descriptions is wrong).
 */
export function lookalike(p: ProjectLike, all: ProjectLike[]): { kind: "maybeSame" | "sameDescription"; name: string } | null {
  const name = tokens(p.name);
  const desc = tokens(p.description);
  for (const o of all) {
    if (o === p || (p.id && o.id === p.id)) continue;
    if (name.size >= 2 && jaccard(name, tokens(o.name)) >= 0.8) return { kind: "maybeSame", name: o.name };
    const od = tokens(o.description);
    if (desc.size >= 6 && od.size >= 6 && jaccard(desc, od) >= 0.75) return { kind: "sameDescription", name: o.name };
  }
  return null;
}

/**
 * Our own points about a project, most useful first. Each one needs its
 * data: no finish date → no "deadline passed"; no budgets → no "revised".
 */
export function projectPoints(p: ProjectLike, all: ProjectLike[] = [], now: number = Date.now()): ProjectPoint[] {
  const out: ProjectPoint[] = [];
  const stage = projectStage(p.status);
  const open = stage !== "completed" && stage !== "cancelled";

  const due = toTime(finishDate(p));
  if (open && due !== null && due < now) {
    out.push({ kind: "deadlinePassed", months: Math.max(1, Math.round((now - due) / (30.44 * DAY))) });
  }

  const change = budgetChangePct(p);
  if (change !== null && Math.abs(change) >= BUDGET_POINT_PCT) {
    out.push(change > 0 ? { kind: "budgetUp", pct: Math.round(change) } : { kind: "budgetDown", pct: Math.round(-change) });
  }

  const sources = sourceCount(p);
  const news = toTime(p.lastNewsAt);
  if (news === null && sources === 0) out.push({ kind: "noNewsNoSource" });
  else {
    if (stage !== "cancelled") {
      if (news === null) out.push({ kind: "noNewsEver" });
      else {
        const days = daysAgo(news, now) ?? 0;
        if (days > NO_NEWS_DAYS) out.push({ kind: "noNews", days });
      }
    }
    if (sources === 0) out.push({ kind: "noSource" });
    else if (sources === 1) out.push({ kind: "oneSource" });
  }

  if (stage === "building" && (p.progressPct === null || p.progressPct === undefined)) out.push({ kind: "progressUnknown" });

  const look = all.length ? lookalike(p, all) : null;
  if (look) out.push(look);

  return out;
}

/** True when the point is about a delay (drives the "late or stalled" count). */
export function isLate(p: ProjectLike, now: number = Date.now()): boolean {
  const stage = projectStage(p.status);
  if (stage === "stalled") return true;
  if (stage === "completed" || stage === "cancelled") return false;
  if ((p.delayMonths ?? 0) > 0 || /^DELAYED$/i.test((p.status ?? "").trim())) return true;
  const due = toTime(finishDate(p));
  return due !== null && due < now;
}
