/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 15 v9 Phase F — curated UI copy for active districts and
 * full state-name lookup for the supporters section (Phase H).
 *
 * Pure data file — extend manually as new districts launch.
 */

export interface DistrictMeta {
  /** Native-script rendering of the district name. */
  nativeScript: string;
  /** One-line tagline shown in the row, blue (production pattern). */
  tagline: string;
  /** 3 emoji-prefixed bullets shown below the tagline. */
  bullets: string[];
}

export const DISTRICT_META: Record<string, DistrictMeta> = {
  mandya: {
    nativeScript: "ಮಂಡ್ಯ",
    tagline: "Sugar Capital of Karnataka",
    bullets: [
      "🏭 Sugar Capital of Karnataka",
      "🌊 Home of KRS Dam",
      "🌾 Kaveri Basin Heartland",
    ],
  },
  "bengaluru-urban": {
    nativeScript: "ಬೆಂಗಳೂರು ನಗರ",
    tagline: "Silicon Valley of India",
    bullets: [
      "💻 Startup Capital of India",
      "🌳 Garden City",
      "🔬 ISRO & HAL Headquarters",
    ],
  },
  mysuru: {
    nativeScript: "ಮೈಸೂರು",
    tagline: "City of Palaces",
    bullets: [
      "🏆 India's Cleanest City",
      "🏛️ City of Palaces",
      "🎪 Dasara Heritage",
    ],
  },
  hyderabad: {
    nativeScript: "హైదరాబాద్",
    tagline: "City of Pearls",
    bullets: ["💎 City of Pearls", "🧬 Genome Valley", "🏰 Nizam Heritage"],
  },
  chennai: {
    nativeScript: "சென்னை",
    tagline: "Gateway to South India",
    bullets: [
      "🚗 Detroit of India",
      "🏖️ Marina Beach",
      "🏥 India's Health Capital",
    ],
  },
  mumbai: {
    nativeScript: "मुंबई",
    tagline: "Financial Capital of India",
    bullets: [
      "💰 Financial Capital of India",
      "🎬 Bollywood",
      "🌊 Gateway of India",
    ],
  },
  lucknow: {
    nativeScript: "लखनऊ",
    tagline: "City of Nawabs",
    bullets: [
      "🏛️ City of Nawabs",
      "🧵 Chikankari Heritage",
      "🍢 Kebab Capital",
    ],
  },
  kolkata: {
    nativeScript: "কলকাতা",
    tagline: "Cultural Capital of India",
    bullets: [
      "🎭 Cultural Capital of India",
      "🏆 Nobel Laureate City",
      "🎊 Durga Puja UNESCO Heritage",
    ],
  },
  "new-delhi": {
    nativeScript: "नई दिल्ली",
    tagline: "Capital of India",
    bullets: [
      "🇮🇳 National Capital",
      "🏛️ UNESCO World Heritage",
      "🏗️ Lutyens Architecture",
    ],
  },
  pune: {
    nativeScript: "पुणे",
    tagline: "Oxford of the East",
    bullets: [
      "🚗 Auto + IT Hub",
      "🎓 Oxford of the East",
      "🌊 Khadakwasla Reservoir",
    ],
  },
};

/**
 * Full state-name lookup for the supporters section (Session 15 Phase H Fix #11).
 * Keys are 2-letter codes that may appear on Supporter records (legacy data).
 * If the supporter's stateSlug or stateName is already populated by the API,
 * prefer that over this lookup. This table is the fallback for code-only values.
 */
export const STATE_FULL_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CG: "Chhattisgarh",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  OD: "Odisha",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TG: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  UT: "Uttarakhand",
  WB: "West Bengal",
  AN: "Andaman & Nicobar Islands",
  CH: "Chandigarh",
  DN: "Dadra & Nagar Haveli and Daman & Diu",
  DL: "Delhi",
  JK: "Jammu & Kashmir",
  LA: "Ladakh",
  LD: "Lakshadweep",
  PY: "Puducherry",
};
