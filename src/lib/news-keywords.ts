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

// NOTE: precedence matters — first match wins. "transport" sits ABOVE crops,
// police and generic categories so that specific train/metro keywords like
// "vande bharat" or "mumbai local" win over incidental "agri"/"crime" mentions.
export const MODULE_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["leaders",        ["mla", "mp", "minister", "collector", "superintendent of police", "deputy commissioner", "dc", "elected", "appointed", "appointment", "sworn in", "cabinet", "official"]],
  ["infrastructure", ["road", "bridge", "highway", "nh", "overbridge", "underpass", "construction", "inaugurat*", "flyover", "project"]],
  ["transport",      [
    "bus", "transport", "ksrtc", "bmtc", "railway", "metro", "taxi", "auto", "autorickshaw", "road accident", "traffic",
    "vande bharat", "shatabdi", "rajdhani", "duronto", "tejas", "jan shatabdi",
    "local train", "mumbai local", "suburban", "suburban rail", "wr local", "cr local",
    "best bus", "best undertaking", "monorail", "metro line",
    "commuter", "overcrowding", "overcrowded", "stampede at station",
    "train", "railway station", "metro station", "bus station", "bus stand", "irctc",
  ]],
  ["budget",         ["budget", "fund", "funding", "crore", "lakh", "allocation", "grant", "expenditure", "revenue", "deficit", "treasury"]],
  ["water",          ["dam", "reservoir", "water level", "krishnaraja sagar", "krs", "kabini", "irrigation", "cauvery", "drinking water supply"]],
  ["crops",          ["crop", "farmer", "paddy", "sugarcane", "mandi price", "apmc", "harvest*", "agri*", "ragi", "tomato price", "onion price"]],
  ["weather",        ["rain", "rainfall", "flood*", "drought", "cyclone", "storm", "temperature", "imd", "monsoon", "heatwave"]],
  ["police",         ["police", "police station", "arrest*", "fir", "crime", "murder", "theft", "robbery", "accused", "case registered", "custody", "ips officer"]],
  ["elections",      ["election", "vote", "voting", "voter", "polling", "candidate", "bjp", "congress", "jds", "bypoll", "constituency", "electoral"]],
  ["education",      ["school", "college", "university", "exam", "examination", "result", "student", "teacher", "sslc", "puc result"]],
  ["health",         ["hospital", "health", "doctor", "disease", "dengue", "malaria", "covid", "vaccination", "primary health centre", "phc"]],
  ["schemes",        ["scheme", "yojana", "pmay", "mgnrega", "welfare", "beneficiary", "beneficiaries", "pension", "ration card", "anna bhagya"]],
  ["housing",        ["housing", "house", "flat", "apartment", "slum", "eviction", "shelter"]],
  ["power",          ["power cut", "electricity", "outage", "load shedding", "substation", "bescom", "mescom", "voltage", "power supply"]],
  ["courts",         ["court", "hc order", "high court", "supreme court", "verdict", "judgment", "bail", "hearing", "legal"]],
  ["jjm",            ["jal jeevan", "jjm", "tap water", "household water connection", "piped water"]],
  ["gram-panchayat", ["panchayat", "gram sabha", "village council", "grama panchayati", "taluk panchayat", "zilla panchayat"]],
  ["alerts",         ["alert", "red alert", "orange alert", "warning", "emergency", "disaster", "rescue", "ndrf"]],
  ["sugar-factory",  ["sugar factory", "sugar mill", "sugarcane crushing", "mandya sugar", "mysore sugar"]],
  ["rti",            ["rti", "right to information", "public information officer"]],
];

export const CATEGORY_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["politics",       ["election", "mla", "mp", "bjp", "congress", "party", "minister", "vote", "rally"]],
  ["development",    ["project", "scheme", "fund", "tender", "launch*", "inaugurat*", "development"]],
  ["agriculture",    ["crop", "farmer", "agri*", "harvest", "sugar", "paddy", "mandi", "market"]],
  ["crime",          ["arrest*", "murder", "theft", "robbery", "fraud", "police", "fir", "accused"]],
  ["health",         ["hospital", "health", "doctor", "disease", "covid", "dengue", "treatment"]],
  ["education",      ["school", "college", "exam", "result", "student", "education", "teacher"]],
  ["infrastructure", ["road", "bridge", "water", "power", "electricity", "construction", "nh"]],
  ["weather",        ["rain", "flood", "drought", "storm", "temperature", "weather"]],
];

const MODULE_MATCHERS = MODULE_KEYWORDS.map(([m, kws]) => [m, compileKeywords(kws)] as const);
const CATEGORY_MATCHERS = CATEGORY_KEYWORDS.map(([c, kws]) => [c, compileKeywords(kws)] as const);

/** First module whose keywords appear as whole words in the headline; "news" when none. */
export function classifyModule(headline: string): string {
  for (const [module, re] of MODULE_MATCHERS) if (re.test(headline)) return module;
  return "news";
}

/** Broad category for the news list; "general" when none. */
export function categorize(headline: string): string {
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
  "new delhi": ["delhi"],
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

/** True when the text names the district (any alias) as whole words. */
export function mentionsDistrict(text: string, districtName: string): boolean {
  const re = new RegExp(districtAliases(districtName).map((a) => `\\b${escapeRe(a).replace(/\s+/g, "\\s+")}\\b`).join("|"), "i");
  return re.test(text);
}

export const INDIAN_STATES_AND_UTS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Puducherry", "Chandigarh", "Andaman and Nicobar", "Lakshadweep", "Dadra and Nagar Haveli", "Daman and Diu",
] as const;

/**
 * True when the text names ANOTHER state or UT but not the district's own
 * state — e.g. "High Court of Karnataka …" arriving in the Hyderabad feed.
 * Such items always go to the AI, which decides isAboutDistrict.
 */
export function mentionsOtherState(text: string, ownStateName: string): boolean {
  const own = ownStateName.trim().toLowerCase();
  const has = (name: string) => new RegExp(`\\b${escapeRe(name).replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
  if (own && has(own)) return false;
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
