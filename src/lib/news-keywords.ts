/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// News pipeline — PURE helpers (no DB, no network), unit-tested in
// tests/news-keywords.test.ts. Used by src/scraper/jobs/news.ts.
//
//   classifyModule() / categorize()  keyword classifier, WHOLE WORDS only
//   districtAliases() / mentionsDistrict() / mentionsOtherState()
//   buildNewsQueries() / newsFeedsFor()  state-aware sources
//
// Why whole words (Sept 2026 audit): substring matching sent "first" to
// police ("fir"), "damage" to water ("dam"), "drain" to weather ("rain"),
// "camp" to leaders ("mp"). Why state-aware: every district's queries said
// "Karnataka", so Hyderabad, Delhi and Pune pulled in Karnataka stories.
// ═══════════════════════════════════════════════════════════

// ── Keyword matching ────────────────────────────────────────
// A keyword matches as a whole word (or phrase), with an optional plural
// "s"/"es". A trailing "*" makes it a prefix: "inaugurat*" matches
// "inaugurated" and "inauguration".
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordPattern(keyword: string): string {
  const open = keyword.endsWith("*");
  const word = escapeRe((open ? keyword.slice(0, -1) : keyword).trim()).replace(/\s+/g, "\\s+");
  return open ? `\\b${word}` : `\\b${word}(?:s|es)?\\b`;
}

export function compileKeywords(keywords: readonly string[]): RegExp {
  return new RegExp(keywords.map(keywordPattern).join("|"), "i");
}

// NOTE: precedence matters — first match wins. "transport" sits ABOVE crops
// and generic categories so that specific train/metro keywords like
// "vande bharat" or "mumbai local" win over incidental "agri" mentions.
// Sept 2026 audit (v5.4): "police" moved above infrastructure/transport so a
// crime story wins over where it happened ("Man sleeping in auto-rickshaw
// murdered" was filed under Transport). Words that mostly name something
// else were dropped: "auto" (auto-rickshaw is not a bus route), "crore" and
// "lakh" (a fraud victim's loss is not a budget), "candidate" (job
// candidates), "house" (a death "at a relative's house" is not housing).
export const MODULE_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["leaders",        ["mla", "mp", "minister", "collector", "superintendent of police", "deputy commissioner", "dc", "elected", "appointed", "appointment", "sworn in", "cabinet", "official"]],
  ["police",         ["police", "police station", "arrest*", "fir", "crime", "murder*", "theft", "robbery", "accused", "case registered", "custody", "ips officer", "fraud", "scam*", "cheat*", "fake"]],
  ["infrastructure", ["road", "bridge", "highway", "nh", "overbridge", "underpass", "construction", "inaugurat*", "flyover", "project"]],
  ["transport",      [
    "bus", "transport", "ksrtc", "bmtc", "railway", "metro", "taxi", "autorickshaw", "road accident", "traffic",
    "vande bharat", "shatabdi", "rajdhani", "duronto", "tejas", "jan shatabdi",
    "local train", "mumbai local", "suburban", "suburban rail", "wr local", "cr local",
    "best bus", "best undertaking", "monorail", "metro line",
    "commuter", "overcrowding", "overcrowded", "stampede at station",
    "train", "railway station", "metro station", "bus station", "bus stand", "irctc",
  ]],
  ["budget",         ["budget", "fund", "funding", "allocation", "grant", "expenditure", "revenue", "deficit", "treasury"]],
  ["water",          ["dam", "reservoir", "water level", "krishnaraja sagar", "krs", "kabini", "irrigation", "cauvery", "drinking water supply"]],
  ["crops",          ["crop", "farmer", "paddy", "sugarcane", "mandi price", "apmc", "harvest*", "agri*", "ragi", "tomato price", "onion price"]],
  ["weather",        ["rain", "rainfall", "flood*", "drought", "cyclone", "storm", "temperature", "imd", "monsoon", "heatwave"]],
  ["elections",      ["election", "vote", "voting", "voter", "polling", "bjp", "congress", "jds", "bypoll", "constituency", "electoral"]],
  ["education",      ["school", "college", "university", "exam", "examination", "result", "student", "teacher", "sslc", "puc result"]],
  ["health",         ["hospital", "health", "doctor", "disease", "dengue", "malaria", "covid", "vaccination", "primary health centre", "phc"]],
  ["schemes",        ["scheme", "yojana", "pmay", "mgnrega", "welfare", "beneficiary", "beneficiaries", "pension", "ration card", "anna bhagya"]],
  ["housing",        ["housing", "flat", "apartment", "slum", "eviction", "shelter"]],
  ["power",          ["power cut", "electricity", "outage", "load shedding", "substation", "bescom", "mescom", "voltage", "power supply"]],
  ["courts",         ["court", "hc order", "high court", "supreme court", "verdict", "judgment", "bail", "hearing", "legal"]],
  ["jjm",            ["jal jeevan", "jjm", "tap water", "household water connection", "piped water"]],
  ["gram-panchayat", ["panchayat", "gram sabha", "village council", "grama panchayati", "taluk panchayat", "zilla panchayat"]],
  ["alerts",         ["alert", "red alert", "orange alert", "warning", "emergency", "disaster", "rescue", "ndrf"]],
  ["sugar-factory",  ["sugar factory", "sugar mill", "sugarcane crushing", "mandya sugar", "mysore sugar"]],
  ["rti",            ["rti", "right to information", "public information officer"]],
];

// v5.4: "crime" sits above "development" ("loses Rs 3.73 crore in fake
// investment scheme" is a crime, not development) and "market" left
// agriculture ("biggest housing market" is not farming).
export const CATEGORY_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["politics",       ["election", "mla", "mp", "bjp", "congress", "party", "minister", "vote", "rally"]],
  ["crime",          ["arrest*", "murder*", "theft", "robbery", "fraud", "police", "fir", "accused", "scam*", "cheat*", "fake"]],
  ["development",    ["project", "scheme", "fund", "tender", "launch*", "inaugurat*", "development"]],
  ["agriculture",    ["crop", "farmer", "agri*", "harvest", "sugar", "paddy", "mandi"]],
  ["health",         ["hospital", "health", "doctor", "disease", "covid", "dengue", "treatment"]],
  ["education",      ["school", "college", "exam", "result", "student", "education", "teacher"]],
  ["infrastructure", ["road", "bridge", "water", "power", "electricity", "construction", "nh"]],
  ["weather",        ["rain", "flood", "drought", "storm", "temperature", "weather"]],
];

const MODULE_MATCHERS = MODULE_KEYWORDS.map(([m, kws]) => [m, compileKeywords(kws)] as const);
const CATEGORY_MATCHERS = CATEGORY_KEYWORDS.map(([c, kws]) => [c, compileKeywords(kws)] as const);

/**
 * Sport and festival events: no data page fits them, and their words
 * ("Road World Championships", "Kambala track work") sent them to
 * Infrastructure or Leaders. They stay in the news list as "general".
 */
const EVENT_RE = compileKeywords(["championship", "tournament", "world cup", "kambala", "marathon", "sports meet"]);

/** First module whose keywords appear as whole words in the headline; "news" when none. */
export function classifyModule(headline: string): string {
  if (EVENT_RE.test(headline)) return "news";
  for (const [module, re] of MODULE_MATCHERS) if (re.test(headline)) return module;
  return "news";
}

/** Broad category for the news list; "general" when none. */
export function categorize(headline: string): string {
  if (EVENT_RE.test(headline)) return "general";
  for (const [cat, re] of CATEGORY_MATCHERS) if (re.test(headline)) return cat;
  return "general";
}

// ── District / state matching ───────────────────────────────
// Other names people write for our districts (old names, English spellings).
const DISTRICT_ALIASES: Record<string, string[]> = {
  "bengaluru": ["bangalore"],
  "mysuru": ["mysore"],
  "mumbai": ["bombay"],
  "kolkata": ["calcutta"],
  "chennai": ["madras"],
  "mangaluru": ["mangalore"],
  "belagavi": ["belgaum"],
  "kalaburagi": ["gulbarga"],
  "vijayapura": ["bijapur"],
  "tiruchirappalli": ["trichy", "tiruchirapalli"],
  "thiruvananthapuram": ["trivandrum"],
  "gurugram": ["gurgaon"],
  "prayagraj": ["allahabad"],
};

/**
 * The name to search for: "Bengaluru Urban" → "Bengaluru" (papers rarely
 * write the administrative "Urban"/"Rural" suffix).
 */
export function searchName(districtName: string): string {
  const trimmed = districtName.trim().replace(/\s+/g, " ");
  const base = trimmed.replace(/\s+(urban|rural)$/i, "");
  return base || trimmed;
}

/** Lower-case names that refer to this district, full name first. */
export function districtAliases(districtName: string): string[] {
  const full = districtName.trim().toLowerCase().replace(/\s+/g, " ");
  const base = searchName(districtName).toLowerCase();
  return [...new Set([full, base, ...(DISTRICT_ALIASES[base] ?? [])])].filter(Boolean);
}

/**
 * Names of OTHER districts that contain one of our names: "Bengaluru
 * Rural" and "Bengaluru South district" (Ramanagara, renamed 2025) are not
 * Bengaluru Urban. They are removed before matching (Sept 2026 audit).
 */
const OTHER_DISTRICT_NAMES: Record<string, RegExp> = {
  bengaluru: /\b(bengaluru|bangalore)\s+rural\b|\bbengaluru\s+south\s+district\b/gi,
};

/**
 * A wider place that contains the district: "Delhi" (the whole National
 * Capital Territory) for New Delhi. It counts only when the text names no
 * other part of it — "schools in NE, east Delhi" and "arrests in central
 * district" are other Delhi districts (Sept 2026 audit: the old alias
 * "delhi" let any Delhi story into New Delhi's feed).
 */
const WIDER_PLACE: Record<string, { name: string; otherParts: RegExp }> = {
  "new delhi": {
    name: "delhi",
    otherParts:
      /\b(north|south|east|west|central|outer|north[\s-]?east|north[\s-]?west|south[\s-]?east|south[\s-]?west)\s+delhi\b|\b(central|north|south|east|west|shahdara)\s+district\b|\bshahdara\b/i,
  },
};

/** True when the text names the district (any alias) as whole words. */
export function mentionsDistrict(text: string, districtName: string): boolean {
  const base = searchName(districtName).toLowerCase();
  const other = OTHER_DISTRICT_NAMES[base];
  const t = other ? text.replace(other, " ") : text;
  const re = new RegExp(districtAliases(districtName).map((a) => `\\b${escapeRe(a).replace(/\s+/g, "\\s+")}\\b`).join("|"), "i");
  if (re.test(t)) return true;
  const wider = WIDER_PLACE[base];
  return Boolean(wider && new RegExp(`\\b${escapeRe(wider.name)}\\b`, "i").test(t) && !wider.otherParts.test(t));
}

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Puducherry", "Chandigarh", "Andaman and Nicobar", "Lakshadweep", "Dadra and Nagar Haveli", "Daman and Diu",
] as const;

/**
 * True when the text names ANOTHER state or UT — e.g. "High Court of
 * Karnataka …" arriving in the Hyderabad feed. Such items always go to the
 * AI, which decides isAboutDistrict.
 * v5.4 (Sept 2026 audit): also when the own state is named too. "Delhi
 * Confidential: Centre's lawyer defends Karnataka Congress government"
 * reached New Delhi's feed because naming Delhi switched the check off.
 */
export function mentionsOtherState(text: string, ownStateName: string): boolean {
  const own = ownStateName.trim().toLowerCase();
  const has = (name: string) => new RegExp(`\\b${escapeRe(name).replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
  return INDIAN_STATES_AND_UTS.some((s) => s.toLowerCase() !== own && has(s));
}

// ── Sources ─────────────────────────────────────────────────
/** Google News search queries for one district, in its own state. */
export function buildNewsQueries(districtName: string, stateName: string): string[] {
  const name = searchName(districtName);
  const state = stateName.trim();
  const stateInName = !state || name.toLowerCase().includes(state.toLowerCase());
  const where = stateInName ? `"${name}"` : `"${name}" ${state}`;
  return [where, `"${name}" district news`, `${where} latest`];
}

export interface NewsFeed {
  url: string;
  sourceName: string;
  /**
   * true = the feed covers a whole state (or several), so only items that
   * name the district are kept. false = the feed is about this city.
   */
  filterByDistrict: boolean;
}

const HINDU = "https://www.thehindu.com/news";
// The Hindu state sections that exist (checked 2026-09-27); every other
// state uses the "other-states" section, filtered by district name.
const HINDU_STATE_SECTIONS: Record<string, string> = {
  "karnataka": `${HINDU}/national/karnataka/feeder/default.rss`,
  "tamil-nadu": `${HINDU}/national/tamil-nadu/feeder/default.rss`,
  "telangana": `${HINDU}/national/telangana/feeder/default.rss`,
  "andhra-pradesh": `${HINDU}/national/andhra-pradesh/feeder/default.rss`,
  "kerala": `${HINDU}/national/kerala/feeder/default.rss`,
  "delhi": `${HINDU}/cities/Delhi/feeder/default.rss`,
};
const HINDU_OTHER_STATES = `${HINDU}/national/other-states/feeder/default.rss`;
// City sections, keyed by district slug (checked 2026-09-27).
const HINDU_CITY_SECTIONS: Record<string, string> = {
  "bengaluru-urban": `${HINDU}/cities/bangalore/feeder/default.rss`,
  "chennai": `${HINDU}/cities/chennai/feeder/default.rss`,
  "hyderabad": `${HINDU}/cities/Hyderabad/feeder/default.rss`,
  "new-delhi": `${HINDU}/cities/Delhi/feeder/default.rss`,
  "mumbai": `${HINDU}/cities/mumbai/feeder/default.rss`,
  "kolkata": `${HINDU}/cities/kolkata/feeder/default.rss`,
  "dakshina-kannada": `${HINDU}/cities/Mangalore/feeder/default.rss`,
  "coimbatore": `${HINDU}/cities/Coimbatore/feeder/default.rss`,
  "madurai": `${HINDU}/cities/Madurai/feeder/default.rss`,
  "ernakulam": `${HINDU}/cities/Kochi/feeder/default.rss`,
  "thiruvananthapuram": `${HINDU}/cities/Thiruvananthapuram/feeder/default.rss`,
  "visakhapatnam": `${HINDU}/cities/Visakhapatnam/feeder/default.rss`,
  "tiruchirappalli": `${HINDU}/cities/Tiruchirapalli/feeder/default.rss`,
  "puducherry": `${HINDU}/cities/puducherry/feeder/default.rss`,
};

/**
 * Fixed RSS feeds for one district: its city section (if The Hindu has one),
 * its state section (filtered by district name), and a Google News search
 * for "<district> <state> government". Duplicate URLs are removed.
 */
export function newsFeedsFor(districtSlug: string, districtName: string, stateSlug: string, stateName: string): NewsFeed[] {
  const feeds: NewsFeed[] = [];
  const city = HINDU_CITY_SECTIONS[districtSlug];
  if (city) feeds.push({ url: city, sourceName: "The Hindu", filterByDistrict: false });
  const state = HINDU_STATE_SECTIONS[stateSlug] ?? HINDU_OTHER_STATES;
  if (state !== city) feeds.push({ url: state, sourceName: "The Hindu", filterByDistrict: true });
  const q = `${searchName(districtName)} ${stateName} government`.trim();
  feeds.push({
    url: `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`,
    sourceName: "Google News",
    filterByDistrict: false,
  });
  return feeds;
}
