/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  News topics → citizen actions (the "What you can do" page)
// ═══════════════════════════════════════════════════════════════════════
//  A plain rule table, no AI. Each news story is put in ONE topic:
//    1. the first topic (in the order below) whose keywords appear in the
//       headline;
//    2. else the topic of the module the news pipeline tagged it with
//       (NewsItem.targetModule);
//    3. else the topic of its keyword category (NewsItem.category);
//    4. else no topic (general news does not move any action).
//  The page then lifts the actions of the busiest topics to the top, with
//  the headline that triggered them. Keywords are whole words (a trailing
//  "*" allows any ending: "inundat*" matches "inundated"); Indian-script
//  keywords match anywhere in the text.
//
//  Pure data + functions: safe to import on the server (the API route) and
//  in the browser (the page reads the emoji, links and area patterns).

export type NewsTopicId =
  | "dengue"
  | "flood"
  | "heat"
  | "cyber"
  | "water"
  | "air"
  | "waste"
  | "roads"
  | "traffic"
  | "power"
  | "farming"
  | "health"
  | "elections"
  | "schemes"
  | "schools"
  | "safety"
  | "civic";

export interface NewsTopicRule {
  id: NewsTopicId;
  emoji: string;
  /** Headline words that put a story in this topic (checked in table order). */
  keywords: string[];
  /** NewsItem.targetModule values that fall back to this topic. */
  modules?: string[];
  /** NewsItem.category values that fall back to this topic. */
  categories?: string[];
  /** The module page with more on this (slug), if any. */
  module?: string;
  /** A national helpline for this topic, when there is a real one. */
  helpline?: string;
  /** An official website for this topic, when there is one. */
  site?: string;
  /** Titles of the page's own action groups that this topic lifts to the top. */
  areas?: RegExp;
}

/** Order matters: the first matching topic wins (dengue before health, cyber before safety). */
export const NEWS_TOPICS: NewsTopicRule[] = [
  {
    id: "dengue",
    emoji: "🦟",
    keywords: ["dengue", "malaria", "chikungunya", "mosquito*", "zika", "ಡೆಂಗ್ಯೂ", "ಡೆಂಗಿ", "डेंगू", "मलेरिया"],
    module: "health",
    helpline: "108",
    areas: /health|clean|waste|sanitation/i,
  },
  {
    id: "flood",
    emoji: "🌊",
    keywords: ["flood*", "waterlog*", "inundat*", "heavy rain*", "cloudburst", "landslide*", "cyclone*", "red alert", "orange alert", "ಪ್ರವಾಹ", "बाढ़", "जलभराव"],
    modules: ["alerts"],
    module: "alerts",
    helpline: "112",
    areas: /flood|drain|waterlog|disaster/i,
  },
  {
    id: "heat",
    emoji: "🥵",
    keywords: ["heatwave*", "heat wave*", "heatstroke", "heat stroke", "sunstroke", "scorching", "hottest", "ಬಿಸಿಗಾಳಿ"],
    module: "weather",
    helpline: "108",
    areas: /environment|green|water/i,
  },
  {
    id: "cyber",
    emoji: "📱",
    keywords: ["cyber*", "online fraud*", "otp", "scam*", "digital arrest", "phishing", "upi fraud*", "loan app*", "sextortion", "ಸೈಬರ್", "साइबर"],
    module: "police",
    helpline: "1930",
    site: "https://cybercrime.gov.in",
    areas: /tech|safety|civic/i,
  },
  {
    id: "water",
    emoji: "💧",
    keywords: [
      "water crisis", "water shortage", "water scarcity", "drinking water", "water supply", "tanker*", "borewell*", "pipeline*",
      "water leak*", "pipe leak*", "reservoir*", "dam", "dams", "krs", "lake*", "groundwater", "ಕುಡಿಯುವ ನೀರು", "ನೀರಿನ", "पेयजल", "पानी",
    ],
    modules: ["water", "jjm"],
    module: "water",
    areas: /water|river|lake/i,
  },
  {
    id: "air",
    emoji: "🌫️",
    keywords: ["air quality", "aqi", "smog", "air pollution", "stubble burning", "crop burning", "pollution", "प्रदूषण"],
    module: "weather",
    areas: /air|pollution|environment/i,
  },
  {
    id: "waste",
    emoji: "🗑️",
    keywords: ["garbage", "waste", "dumping", "landfill*", "sanitation", "swachh", "plastic*", "sewage", "sewer*", "drain*", "ಕಸ ವಿಲೇವಾರಿ", "कचरा"],
    areas: /clean|waste|sanitation/i,
  },
  {
    id: "roads",
    emoji: "🕳️",
    keywords: ["pothole*", "road repair*", "bad road*", "road condition*", "road work*", "flyover*", "bridge*", "highway*", "ಗುಂಡಿ", "गड्ढ*"],
    modules: ["infrastructure"],
    module: "infrastructure",
    areas: /road|traffic|transport|commute|infrastructure/i,
  },
  {
    id: "traffic",
    emoji: "🚦",
    keywords: ["accident*", "traffic", "helmet*", "drunk driving", "speeding", "road safety", "collision*", "hit-and-run", "overturn*", "ಅಪಘಾತ", "दुर्घटना"],
    modules: ["transport"],
    module: "transport",
    helpline: "112",
    areas: /traffic|road|transport|commute/i,
  },
  {
    id: "power",
    emoji: "⚡",
    keywords: ["power cut*", "power outage*", "outage*", "load shedding", "electricity", "transformer*", "power supply", "blackout*", "ವಿದ್ಯುತ್", "बिजली"],
    modules: ["power"],
    module: "power",
    areas: /power|energy|environment/i,
  },
  {
    id: "farming",
    emoji: "🌾",
    keywords: ["farmer*", "crop*", "paddy", "sugarcane", "harvest*", "fertiliser*", "fertilizer*", "urea", "seed*", "mandi*", "apmc", "msp", "drought*", "ರೈತ", "किसान"],
    modules: ["crops", "sugar-factory", "soil"],
    categories: ["agriculture"],
    module: "farm",
    areas: /agri|farm|land/i,
  },
  {
    id: "health",
    emoji: "🩺",
    keywords: ["hospital*", "doctor*", "disease*", "vaccin*", "outbreak*", "cholera", "fever", "health", "covid", "rabies", "dog bite*", "food poisoning", "ಆಸ್ಪತ್ರೆ", "अस्पताल"],
    modules: ["health"],
    categories: ["health"],
    module: "health",
    helpline: "108",
    areas: /health/i,
  },
  {
    id: "elections",
    emoji: "🗳️",
    keywords: ["election*", "voter*", "polling", "bypoll*", "by-election*", "electoral roll*", "voter id", "ballot*", "ಚುನಾವಣೆ", "चुनाव"],
    modules: ["elections"],
    module: "elections",
    helpline: "1950",
    site: "https://voters.eci.gov.in",
    areas: /civic|democra|engagement/i,
  },
  {
    id: "schemes",
    emoji: "📋",
    keywords: ["scheme*", "yojana", "pension*", "ration", "subsid*", "beneficiar*", "welfare", "pmay", "guarantee*"],
    modules: ["schemes", "housing"],
    module: "schemes",
    areas: /housing|civic/i,
  },
  {
    id: "schools",
    emoji: "🎒",
    keywords: ["school*", "exam", "exams", "examination*", "sslc", "puc", "student*", "teacher*", "college*", "admission*", "scholarship*", "ಶಾಲೆ", "स्कूल"],
    modules: ["education", "exams"],
    categories: ["education"],
    module: "schools",
    areas: /education/i,
  },
  {
    id: "safety",
    emoji: "🛡️",
    keywords: ["murder*", "theft*", "robbery", "robberies", "assault*", "chain snatch*", "crime*", "burglary", "harass*", "missing", "police", "ಕಳ್ಳತನ", "चोरी"],
    modules: ["police", "courts"],
    categories: ["crime"],
    module: "police",
    helpline: "112",
    areas: /safety|civic/i,
  },
  {
    id: "civic",
    emoji: "🏛️",
    keywords: ["gram sabha", "ward committee*", "panchayat*", "council meeting*", "corporation", "rti", "corruption", "bribe*", "lokayukta", "budget", "ಪಂಚಾಯಿತಿ", "पंचायत"],
    modules: ["gram-panchayat", "rti", "budget", "leaders"],
    categories: ["politics"],
    module: "file-rti",
    areas: /civic|democra|engagement/i,
  },
];

const RULE_BY_ID = new Map(NEWS_TOPICS.map((r) => [r.id, r]));
export function topicRule(id: string): NewsTopicRule | undefined {
  return RULE_BY_ID.get(id as NewsTopicId);
}

const ASCII = /^[\x20-\x7e]+$/;
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** One regex per topic: whole words for Latin keywords, plain text for Indian scripts. */
const MATCHERS: Array<{ id: NewsTopicId; re: RegExp }> = NEWS_TOPICS.map((r) => {
  const parts = r.keywords.map((kw) => {
    const open = kw.endsWith("*");
    const word = escapeRe(open ? kw.slice(0, -1) : kw);
    if (!ASCII.test(kw)) return word;
    return open ? `\\b${word}` : `\\b${word}\\b`;
  });
  return { id: r.id, re: new RegExp(parts.join("|"), "i") };
});

/** The one topic of a story, or null for general news. */
export function topicOf(story: { title: string; targetModule?: string | null; category?: string | null }): NewsTopicId | null {
  const title = story.title ?? "";
  for (const m of MATCHERS) if (m.re.test(title)) return m.id;
  const mod = story.targetModule?.toLowerCase();
  if (mod && mod !== "news") {
    const byModule = NEWS_TOPICS.find((r) => r.modules?.includes(mod));
    if (byModule) return byModule.id;
  }
  const cat = story.category?.toLowerCase();
  if (cat && cat !== "general") {
    const byCategory = NEWS_TOPICS.find((r) => r.categories?.includes(cat));
    if (byCategory) return byCategory.id;
  }
  return null;
}
