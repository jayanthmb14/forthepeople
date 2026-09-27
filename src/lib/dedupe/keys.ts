/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Canonical keys — when are two rows "the same thing"? (pure, no DB)
//
// Sept 2026: duplicates came from writers that each had their own idea of
// "same" (substring of the first three words, exact electionType string,
// one copy of a national exam per district). Every writer and the daily
// duplicate guard (src/lib/dedupe/guard.ts) now use the keys below.
//
//   foldText()              lower-case ASCII words: no punctuation or
//                           diacritics, "&" → "and", "1st"/"second" → digits,
//                           roman numerals after "phase/line/group/class…",
//                           in brackets or before a year → digits.
//   canonicalName()         foldText + abbreviations ("NH" → "national
//                           highway", "PMAY" → …) + old city names
//                           ("Bangalore" → "bengaluru") + project aliases
//                           ("Atal Setu" / "Sewri–Nhava Sheva" / "MTHL").
//   nameKey()               canonicalName as a sorted word set without
//                           filler words — the EXACT key duplicates share.
//   examKey()/examKeys()    body + exam words + year: "NEET 2026",
//                           "NEET (UG) 2026", "NEET UG 2026" → "nta:neet ug|2026".
//   canonicalExamStatus()   every legacy status → the canonical set;
//                           anything unknown → "UNVERIFIED".
//   canonicalElectionType() "LokSabha" / "Lok Sabha" / "LS" → "LOK_SABHA" …
//   similarity()            0–1 score for FUZZY candidates. Fuzzy matches
//                           are never merged automatically — a person looks.
//
// To teach it a new alias, add it to ABBREVIATIONS / PHRASE_ALIASES /
// EXAM_PHRASES below and a line to tests/dedupe-keys.test.ts.
// ═══════════════════════════════════════════════════════════

// ── Text folding ────────────────────────────────────────────

const ROMAN_VALUE: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12,
};
const ROMAN_RE = /^(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)([a-c]?)$/;

/** Words after which a roman numeral is a number ("Phase II", "Group IV", "Class X"). */
const ROMAN_TRIGGERS = new Set([
  "phase", "stage", "line", "grade", "group", "class", "paper", "part", "tier", "level", "unit",
  "block", "sector", "zone", "division", "round", "section", "standard", "std", "semester", "sem",
  "batch", "cycle", "shift", "term", "session", "package", "reach", "corridor", "schedule", "type",
  "category", "cadre", "puc", "nda", "cds", "volume", "chapter", "no",
]);

const ORDINAL_WORDS: Record<string, string> = {
  first: "1", second: "2", third: "3", fourth: "4", fifth: "5", sixth: "6",
};

const isYear = (t: string) => /^(19|20)\d{2}$/.test(t);

/**
 * Lower-case ASCII words separated by single spaces. Diacritics, quotes and
 * punctuation removed; "&" → "and"; "2nd"/"second" → "2"; roman numerals
 * that are clearly numbers → digits ("Phase-IIA" → "phase 2a").
 */
export function foldText(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
  s = s.replace(/&amp;/g, "&").replace(/[’‘`´]/g, "'").replace(/'s\b/g, "").replace(/'/g, "");
  s = s.replace(/&/g, " and ");
  // "(II)" → " 2 " before brackets disappear
  s = s.replace(/\(\s*(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\s*\)/g, (_m, r: string) => ` ${ROMAN_VALUE[r]} `);
  s = s.replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1");
  s = s.replace(/[^a-z0-9]+/g, " ").trim();
  if (!s) return "";
  const words = s.split(" ");
  const out: string[] = [];
  const converted = new Set<number>();
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const m = ROMAN_RE.exec(w);
    // "Group II & IIA": a numeral right after "and"/"or"/"to" that follows a converted one
    const listed = (words[i - 1] === "and" || words[i - 1] === "or" || words[i - 1] === "to") && converted.has(i - 2);
    if (m && (ROMAN_TRIGGERS.has(words[i - 1] ?? "") || isYear(words[i + 1] ?? "") || listed)) {
      out.push(`${ROMAN_VALUE[m[1]]}${m[2]}`);
      converted.add(i);
      continue;
    }
    out.push(ORDINAL_WORDS[w] ?? w);
  }
  return out.join(" ");
}

// ── Names ───────────────────────────────────────────────────

/** Single-word abbreviations and old names → the words they stand for. */
const ABBREVIATIONS: Record<string, string> = {
  // roads, bridges, works
  nh: "national highway", sh: "state highway", orr: "outer ring road", prr: "peripheral ring road",
  rob: "road over bridge", rub: "road under bridge", fob: "foot over bridge",
  stp: "sewage treatment plant", wtp: "water treatment plant", rd: "road", overbridge: "over bridge",
  // government words
  govt: "government", gov: "government", dept: "department", dist: "district", hq: "headquarters",
  hosp: "hospital", ps: "police station", phc: "primary health centre", chc: "community health centre",
  center: "centre", harbor: "harbour", intl: "international", natl: "national",
  // schemes
  pm: "pradhan mantri", pmay: "pradhan mantri awas yojana", pmgsy: "pradhan mantri gram sadak yojana",
  mgnrega: "mahatma gandhi national rural employment guarantee",
  mgnregs: "mahatma gandhi national rural employment guarantee",
  nrega: "mahatma gandhi national rural employment guarantee",
  jjm: "jal jeevan mission", sbm: "swachh bharat mission",
  aiims: "all india institute of medical sciences",
  // projects
  mthl: "mumbai trans harbour link",
  // renamed cities (new name wins)
  bangalore: "bengaluru", bengalooru: "bengaluru", mysore: "mysuru", bombay: "mumbai", madras: "chennai",
  calcutta: "kolkata", gurgaon: "gurugram", trivandrum: "thiruvananthapuram", poona: "pune",
  belgaum: "belagavi", mangalore: "mangaluru", hubli: "hubballi", shimoga: "shivamogga",
  tumkur: "tumakuru", gulbarga: "kalaburagi", bellary: "ballari", bijapur: "vijayapura",
  baroda: "vadodara", allahabad: "prayagraj", pondicherry: "puducherry", cochin: "kochi",
  calicut: "kozhikode", orissa: "odisha", uttaranchal: "uttarakhand",
};

/**
 * Multi-word aliases, applied after abbreviations (longest first). The same
 * real-world project under different names ends up with one name.
 */
const PHRASE_ALIASES: Array<[RegExp, string]> = [
  // Mumbai Trans Harbour Link = Atal Setu = Sewri–Nhava Sheva sea link
  [/\b(?:atal bihari vajpayee )?sewri nhava sheva(?: atal setu| trans harbour link| sea link| bridge| link)?\b/g, "mumbai trans harbour link"],
  [/\batal setu\b/g, "mumbai trans harbour link"],
  [/\b(?:mumbai )?trans harbour link\b/g, "mumbai trans harbour link"],
  [/\brajiv gandhi sea link\b/g, "bandra worli sea link"],
  [/\b(?:hindu hrudaysamrat balasaheb thackeray )?(?:maharashtra )?samruddhi mahamarg\b/g, "mumbai nagpur expressway"],
  [/\bnagpur mumbai (?:super communication )?expressway\b/g, "mumbai nagpur expressway"],
  [/\bnamma metro\b/g, "bengaluru metro"],
  [/\bfly over\b/g, "flyover"],
  [/\bunder pass\b/g, "underpass"],
  [/\bawas yojana g(?:ramin)?\b/g, "awas yojana gramin"],
  [/\bawas yojana u(?:rban)?\b/g, "awas yojana urban"],
];

const STOP_WORDS = new Set(["the", "of", "a", "an", "and", "at", "in", "on", "for", "to", "by", "with", "from", "near"]);
/** Words that never tell two names apart ("X Project" = "X"). Used by nameKey only. */
const FILLER_WORDS = new Set(["project", "projects", "scheme", "schemes", "programme", "program"]);

function expandWords(folded: string): string {
  if (!folded) return "";
  let s = folded
    .split(" ")
    .map((w) => ABBREVIATIONS[w] ?? w)
    .join(" ");
  // "nh275" / "sh17" → "national highway 275"
  s = s.replace(/\b(nh|sh)(\d+[a-z]?)\b/g, (_m, p: string, n: string) => `${ABBREVIATIONS[p]} ${n}`);
  for (const [re, to] of PHRASE_ALIASES) s = s.replace(re, to);
  return s.replace(/\s+/g, " ").trim();
}

function uniqueInOrder(words: string[]): string[] {
  const seen = new Set<string>();
  return words.filter((w) => (seen.has(w) ? false : (seen.add(w), true)));
}

/** Readable canonical form: folded, abbreviations expanded, aliases applied, stop words and repeats removed. */
export function canonicalName(input: string | null | undefined): string {
  const words = expandWords(foldText(input)).split(" ").filter((w) => w && !STOP_WORDS.has(w));
  return uniqueInOrder(words).join(" ");
}

/** The significant words of a name (canonical, no filler), as a sorted unique list. */
export function nameTokens(input: string | null | undefined): string[] {
  const words = canonicalName(input).split(" ").filter((w) => w && !FILLER_WORDS.has(w));
  return [...new Set(words)].sort();
}

/**
 * EXACT duplicate key for a name: two rows in the same place whose names
 * give the same nameKey are the same thing. "" when the name is empty.
 */
export function nameKey(input: string | null | undefined): string {
  return nameTokens(input).join(" ");
}

/** A 6-digit Indian PIN code in an address, or null. */
export function pinCode(address: string | null | undefined): string | null {
  const m = /\b([1-9]\d{2})\s?(\d{3})\b/.exec(address ?? "");
  return m ? `${m[1]}${m[2]}` : null;
}

/** Constituency key: canonical name without seat numbers or SC/ST reservation marks. */
export function constituencyKey(input: string | null | undefined): string {
  return nameTokens(input)
    .filter((w) => !/^\d+$/.test(w) && w !== "sc" && w !== "st" && w !== "constituency")
    .join(" ");
}

/**
 * URL key: scheme-less, lower-case host without "www.", no fragment, no
 * tracking parameters (utm_*, fbclid, gclid, ocid, ref), no trailing slash.
 */
export function urlKey(input: string | null | undefined): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !/^(utm_|fbclid$|gclid$|ocid$|ref$|cmpid$|ito$)/i.test(k))
      .sort(([a], [b]) => a.localeCompare(b));
    const q = params.length ? `?${params.map(([k, v]) => `${k}=${v}`).join("&")}` : "";
    const path = u.pathname.replace(/\/+$/, "");
    return `${u.hostname.toLowerCase().replace(/^www\./, "")}${path}${q}`;
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/[#].*$/, "").replace(/\/+$/, "");
  }
}

// ── Similarity (fuzzy candidates only) ──────────────────────

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const cur = [i + 1];
    for (let j = 0; j < b.length; j++) {
      cur.push(Math.min(cur[j] + 1, prev[j + 1] + 1, prev[j] + (a[i] === b[j] ? 0 : 1)));
    }
    prev = cur;
  }
  return prev[b.length];
}

const hasDigit = (w: string) => /\d/.test(w);

/**
 * How alike two names are, 0–1, on their canonical words: the best of the
 * Dice word overlap, the edit-distance ratio of the sorted word strings, and
 * 0.88 when one name's 3+ words all appear in the other. When both names
 * carry numbers and the numbers differ ("Phase 1" / "Phase 2", "Line 2A" /
 * "Line 3") the score is capped at 0.6: those are different things.
 */
export function similarity(a: string | null | undefined, b: string | null | undefined): number {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return 0;
  const sa = new Set(ta);
  const sb = new Set(tb);
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const dice = (2 * inter) / (sa.size + sb.size);
  const ja = ta.join(" ");
  const jb = tb.join(" ");
  const lev = 1 - levenshtein(ja, jb) / Math.max(ja.length, jb.length);
  const minSize = Math.min(sa.size, sb.size);
  const subset = minSize >= 3 && inter === minSize ? 0.88 : 0;
  let score = Math.max(dice, lev, subset);
  const na = ta.filter(hasDigit);
  const nb = tb.filter(hasDigit);
  if (na.length && nb.length && (na.length !== nb.length || na.some((w) => !nb.includes(w)))) {
    score = Math.min(score, 0.6);
  }
  return Math.round(score * 1000) / 1000;
}

// ── Exams ───────────────────────────────────────────────────

/** Organising bodies → the short token the exam key uses. Full names first. */
const EXAM_BODY_PHRASES: Array<[RegExp, string]> = [
  [/\bunion public service commission\b/, "upsc"],
  [/\bstaff selection commission\b/, "ssc"],
  [/\bnational testing agency\b/, "nta"],
  [/\binstitute of banking personnel selection\b/, "ibps"],
  [/\brailway recruitment cell\b/, "rrc"],
  [/\brailway recruitment boards?\b/, "rrb"],
  [/\bstate bank of india\b/, "sbi"],
  [/\breserve bank of india\b/, "rbi"],
  [/\bcentral board of secondary education\b/, "cbse"],
  [/\bnational board of examinations?(?: in medical sciences)?\b/, "nbems"],
  [/\bkarnataka examinations? authority\b/, "kea"],
  [/\bkarnataka school examination and assessment board\b/, "kseab"],
  [/\bdelhi subordinate services selection board\b/, "dsssb"],
  [/\bkerala public service commission\b/, "keralapsc"],
  [/\bkarnataka public service commission\b/, "kpsc"],
  [/\bmaharashtra public service commission\b/, "mpsc"],
  [/\btamil nadu public service commission\b/, "tnpsc"],
  [/\btelangana(?: state)? public service commission\b/, "tspsc"],
  [/\bandhra pradesh public service commission\b/, "appsc"],
  [/\buttar pradesh public service commission\b/, "uppsc"],
  [/\bwest bengal public service commission\b/, "wbpsc"],
  [/\bbihar public service commission\b/, "bpsc"],
  [/\brajasthan public service commission\b/, "rpsc"],
  [/\bgujarat public service commission\b/, "gpsc"],
  [/\bodisha public service commission\b/, "opsc"],
  [/\bmadhya pradesh public service commission\b/, "mppsc"],
];
const EXAM_BODY_TOKENS = new Set([
  "upsc", "ssc", "nta", "ibps", "rrb", "rrc", "sbi", "rbi", "cbse", "nbems", "kea", "kseab", "dsssb",
  "keralapsc", "kpsc", "mpsc", "tnpsc", "tspsc", "appsc", "uppsc", "upsssc", "wbpsc", "bpsc", "rpsc",
  "gpsc", "opsc", "mppsc", "hpsc", "hppsc", "ppsc", "jpsc", "cgpsc", "ukpsc", "apsc", "nabard",
  "isro", "drdo", "epfo", "esic", "kvs", "nvs", "nios", "icmr", "csir", "ugc", "wbjeeb", "tnusrb", "tslprb",
]);
const BODY_TOKEN_ALIASES: Record<string, string> = { nbe: "nbems", tgpsc: "tspsc" };

/** Words that describe a stage or a document, not which exam it is. */
const EXAM_FILLER = new Set([
  "exam", "exams", "examination", "examinations", "recruitment", "recruitments", "notification",
  "notifications", "result", "results", "admit", "card", "hall", "ticket", "answer", "key",
  "application", "applications", "apply", "registration", "registrations", "online", "form", "forms",
  "official", "released", "declared", "out", "published", "announced", "schedule", "date", "dates",
  "various", "posts", "post", "vacancy", "vacancies", "service", "services", "live", "update",
  "updates", "latest", "news", "board",
]);

/** Exam names written several ways → one set of words. Applied to folded text. */
const EXAM_PHRASES: Array<[RegExp, string]> = [
  [/\bnational eligibility cum entrance test\b/g, "neet"],
  [/\bcommon university entrance test\b/g, "cuet"],
  [/\bjoint entrance exam(?:ination)? main[s]?\b/g, "jee main"],
  [/\bjee mains\b/g, "jee main"],
  [/\bcombined graduate level\b/g, "cgl"],
  [/\bcombined higher secondary level(?: 10 2)?\b/g, "chsl"],
  [/\bchsl 10 2\b/g, "chsl"],
  [/\bmulti tasking(?: non technical)? staff\b/g, "mts"],
  [/\bsub inspector in delhi police and (?:central armed police forces|capfs?)\b/g, "cpo"],
  [/\bnational defence academy\b/g, "nda"],
  [/\bnaval academy\b/g, "na"],
  [/\bcombined defence services\b/g, "cds"],
  [/\bprobationary officers?\b/g, "po"],
  [/\bspecialist officers?\b/g, "so"],
  [/\bregional rural banks?\b/g, "rrb"],
  [/\bnon technical popular categor(?:y|ies)\b/g, "ntpc"],
  [/\bassistant loco pilots?\b/g, "alp"],
  [/\bteachers? eligibility test\b/g, "tet"],
  [/\bjunior engineers?\b/g, "je"],
  [/\b(cbse|icse|isc) (10|12)\b/g, "$1 class $2"],
  [/\bpre university(?: course)?\b/g, "puc"],
  [/\b(i{1,2}|[12]) puc\b/g, "puc $1"],
  [/\bpuc ii\b/g, "puc 2"],
  [/\bpuc i\b/g, "puc 1"],
];

function examBodyFrom(text: string): string {
  const f = foldText(text);
  if (!f || f === "unknown" || f === "na" || f === "none") return "";
  for (const [re, token] of EXAM_BODY_PHRASES) if (re.test(f)) return token;
  for (const w of f.split(" ")) {
    const t = BODY_TOKEN_ALIASES[w] ?? w;
    if (EXAM_BODY_TOKENS.has(t)) return t;
  }
  return "";
}

interface ExamWords {
  words: string[];
  year: string | null;
  /** Body forced by a well-known exam (NEET UG → NTA), else null. */
  aliasBody: string | null;
}

function examWords(text: string | null | undefined): ExamWords | null {
  let f = foldText(text);
  if (!f) return null;
  for (const [re, token] of EXAM_BODY_PHRASES) f = f.replace(new RegExp(re.source, "g"), token);
  for (const [re, to] of EXAM_PHRASES) f = f.replace(re, to);
  // "2026-27" → the first year
  const raw = f.split(" ").filter(Boolean);
  let year: string | null = null;
  const words: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const w = raw[i];
    if (isYear(w)) {
      if (!year) year = w;
      const next = raw[i + 1];
      if (next && (/^\d{2}$/.test(next) || isYear(next))) i++;
      continue;
    }
    const t = BODY_TOKEN_ALIASES[w] ?? w;
    if (STOP_WORDS.has(t) || EXAM_FILLER.has(t)) continue;
    words.push(t);
  }
  let aliasBody: string | null = null;
  let out = uniqueInOrder(words);
  if (out.includes("neet")) {
    const variant = out.includes("mds") ? "mds" : out.includes("pg") ? "pg" : out.includes("ss") || out.includes("super") ? "ss" : "ug";
    out = out.filter((w) => !["ug", "pg", "mds", "ss", "super", "speciality", "specialty", "nta", "nbems"].includes(w));
    out.push(variant);
    aliasBody = variant === "ug" ? "nta" : "nbems";
  } else if (out.includes("cuet")) {
    const variant = out.includes("pg") ? "pg" : "ug";
    out = out.filter((w) => w !== "ug" && w !== "pg" && w !== "nta");
    out.push(variant);
    aliasBody = "nta";
  } else if (out.includes("jee") && out.includes("main")) {
    out = out.filter((w) => w !== "nta");
    aliasBody = "nta";
  } else if (out.includes("upsc") && out.includes("civil")) {
    out = out.filter((w) => w !== "civil").concat(out.includes("cse") ? [] : ["cse"]);
  }
  if (!out.length) return null;
  return { words: out, year, aliasBody };
}

export interface ExamIdentity {
  title?: string | null;
  shortName?: string | null;
  organizingBody?: string | null;
}

/** The body token an exam's keys use: a well-known exam's own body, the organising body, or one named in the exam's name. */
export function examBody(e: ExamIdentity): string {
  for (const text of [e.shortName, e.title]) {
    const w = examWords(text);
    if (w?.aliasBody) return w.aliasBody;
  }
  return examBodyFrom(e.organizingBody ?? "") || examBodyFrom(e.shortName ?? "") || examBodyFrom(e.title ?? "");
}

function keyFor(text: string | null | undefined, body: string): string | null {
  const w = examWords(text);
  if (!w) return null;
  const words = [...new Set(w.words.filter((x) => x !== body))].sort();
  if (!words.length) return null;
  return `${body}:${words.join(" ")}|${w.year ?? ""}`;
}

/**
 * The exam's primary key ("body:words|year") from its short name, else its
 * title. "NEET 2026" / "NEET (UG) 2026" / "NEET UG 2026" → "nta:neet ug|2026".
 */
export function examKey(e: ExamIdentity): string | null {
  const body = examBody(e);
  return keyFor(e.shortName, body) ?? keyFor(e.title, body);
}

/** Every key an exam answers to (short name and title). Two exams are the same when their key sets meet. */
export function examKeys(e: ExamIdentity): string[] {
  const body = examBody(e);
  const keys = new Set<string>();
  for (const text of [e.shortName, e.title]) {
    const k = keyFor(text, body);
    if (k) keys.add(k);
  }
  return [...keys];
}

/** True when two exams share a canonical key. */
export function sameExam(a: ExamIdentity, b: ExamIdentity): boolean {
  const kb = new Set(examKeys(b));
  return examKeys(a).some((k) => kb.has(k));
}

/** Official body for well-known exams whose body the news often gets wrong (NEET UG is NTA, not NBE). */
export const KNOWN_EXAM_BODIES: Record<string, { organizingBody: string; department: string }> = {
  nta: { organizingBody: "NTA", department: "National Testing Agency" },
  nbems: { organizingBody: "NBEMS", department: "National Board of Examinations in Medical Sciences" },
};

// ── Exam status ─────────────────────────────────────────────

export const EXAM_STATUSES = [
  "NOTIFICATION_OUT",
  "APPLICATIONS_OPEN",
  "APPLICATIONS_CLOSED",
  "ADMIT_CARD_OUT",
  "EXAM_SCHEDULED",
  "RESULT_PENDING",
  "RESULT_OUT",
  "COMPLETED",
] as const;
export type CanonicalExamStatus = (typeof EXAM_STATUSES)[number] | "UNVERIFIED";

/** Order of the exam lifecycle; a write never moves an exam to a lower rank. UNVERIFIED is below everything. */
export const EXAM_STATUS_RANK: Record<CanonicalExamStatus, number> = {
  UNVERIFIED: -1,
  NOTIFICATION_OUT: 1,
  APPLICATIONS_OPEN: 3,
  APPLICATIONS_CLOSED: 4,
  ADMIT_CARD_OUT: 5,
  EXAM_SCHEDULED: 5,
  RESULT_PENDING: 6,
  RESULT_OUT: 7,
  COMPLETED: 8,
};

const STATUS_WORDS: Array<[RegExp, CanonicalExamStatus]> = [
  [/^(applications? (are )?open|registrations? (is |are )?open|open|apply now|apply online)$/, "APPLICATIONS_OPEN"],
  [/^(applications? closed|registrations? closed|closed|last date over)$/, "APPLICATIONS_CLOSED"],
  [/^(admit cards?( out| released| issued)?|hall tickets?( out| released)?)$/, "ADMIT_CARD_OUT"],
  [/^(exams? scheduled|scheduled|exam date announced)$/, "EXAM_SCHEDULED"],
  [/^(results? pending|awaiting results?|exam held|exam conducted|conducted|answer key( out| released)?)$/, "RESULT_PENDING"],
  [/^(results?|results? out|results? declared|results? announced|results? released|declared)$/, "RESULT_OUT"],
  [/^(completed|complete|over|concluded|finished)$/, "COMPLETED"],
  [/^(notification( out| released| issued| published)?|notified)$/, "NOTIFICATION_OUT"],
];

/**
 * Any stored or extracted status → the canonical set. "upcoming" /
 * "expected" never said a notification was published, so they become
 * UNVERIFIED (shown as "dates not confirmed"). A bare "published",
 * "released", "out" or "announced" is read from the exam's title
 * ("… Result 2026" → RESULT_OUT); without a hint it is UNVERIFIED.
 */
export function canonicalExamStatus(raw: string | null | undefined, titleHint?: string | null): CanonicalExamStatus {
  const upper = (raw ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  if ((EXAM_STATUSES as readonly string[]).includes(upper) || upper === "UNVERIFIED") return upper as CanonicalExamStatus;
  const f = foldText(raw);
  if (!f) return "UNVERIFIED";
  for (const [re, status] of STATUS_WORDS) if (re.test(f)) return status;
  if (/^(published|released|out|announced|issued)$/.test(f)) {
    const hint = foldText(titleHint);
    if (/\bresults?\b|\bmerit list\b|\bscore ?card\b/.test(hint)) return "RESULT_OUT";
    if (/\badmit cards?\b|\bhall tickets?\b/.test(hint)) return "ADMIT_CARD_OUT";
    if (/\banswer key\b/.test(hint)) return "RESULT_PENDING";
    if (f === "announced" || /\bnotification\b|\brecruitment\b/.test(hint)) return "NOTIFICATION_OUT";
  }
  return "UNVERIFIED";
}

/** Rank of any status string (legacy words included) for the "never downgrade" rule. */
export function examStatusRank(raw: string | null | undefined, titleHint?: string | null): number {
  return EXAM_STATUS_RANK[canonicalExamStatus(raw, titleHint)];
}

// ── Elections ───────────────────────────────────────────────

export const ELECTION_TYPES = [
  "LOK_SABHA",
  "ASSEMBLY",
  "RAJYA_SABHA",
  "LEGISLATIVE_COUNCIL",
  "MUNICIPAL",
  "PANCHAYAT",
] as const;
export type ElectionType = (typeof ELECTION_TYPES)[number];

/**
 * Any election-type spelling → the one stored value. "LokSabha", "Lok
 * Sabha", "LS", "Parliament" → LOK_SABHA; "Assembly", "Vidhan Sabha",
 * "State Assembly" → ASSEMBLY; … null when it cannot be told.
 */
export function canonicalElectionType(raw: string | null | undefined): ElectionType | null {
  const folded = foldText(raw);
  if (!folded) return null;
  const upper = folded.replace(/\s+/g, "_").toUpperCase();
  if ((ELECTION_TYPES as readonly string[]).includes(upper)) return upper as ElectionType;
  const k = folded.replace(/\s+/g, "");
  if (/^(ls|pc)$/.test(k) || /loksabha|parliament|generalelection|^general$/.test(k)) return "LOK_SABHA";
  if (/rajyasabha/.test(k)) return "RAJYA_SABHA";
  if (/vidhanparishad|legislativecouncil|^mlc$/.test(k)) return "LEGISLATIVE_COUNCIL";
  if (/assembly|vidhansabha|^ac$|^mla$|legislative/.test(k)) return "ASSEMBLY";
  if (/municipal|corporation|^ulb$|urbanlocal|nagarpalika|nagarnigam|nagarpanchayat|bbmp|ward|civic/.test(k)) return "MUNICIPAL";
  if (/panchayat|zilla|zila|gram|^zp$|^tp$|^gp$/.test(k)) return "PANCHAYAT";
  return null;
}

/** Duplicate key for one election result row (one row per constituency per election). */
export function electionResultKey(r: { districtId: string; year: number; electionType: string; constituency: string }): string | null {
  const type = canonicalElectionType(r.electionType);
  const seat = constituencyKey(r.constituency);
  if (!type || !seat) return null;
  return `${r.districtId}|${r.year}|${type}|${seat}`;
}
