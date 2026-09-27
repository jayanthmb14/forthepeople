/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Home page — the data shapes the server loaders (home-data.ts) hand to
//  the home components. Plain JSON only (they cross the server → client
//  boundary), no Prisma types, safe to import from client components.
// ═══════════════════════════════════════════════════════════════════════

/** A market price the ticker and the "Prices today" cards show. */
export type MarketKey = "gold24" | "gold22" | "silver" | "sensex" | "nifty" | "usdInr" | "crude";

export interface MarketFigure {
  key: MarketKey;
  /** The newest value, already in the unit shown (gold per gram, silver per kg). */
  value: number;
  decimals: number;
  currency: "INR" | "USD" | null;
  unit: "gram" | "kg" | "barrel" | null;
  /** Change since the trading day before `day`; null when the source gave only one day. */
  change: { pct: number; abs: number; direction: "up" | "down" | "flat"; prevDay: string } | null;
  /** Trading day of the value, "YYYY-MM-DD" (IST). */
  day: string;
  /** Exact time of the value when the source gives one (Yahoo), else null. */
  asOf: string | null;
  source: "ibja" | "yahoo";
  sourceUrl: string;
  /** The last ~30 daily values, oldest first, for the small trend line. */
  spark: number[];
  /** Whole days between `day` and today (IST) when the page was built. */
  ageDays: number;
  /** Older than a market's normal weekend / holiday gap. */
  old: boolean;
}

/** One mandi (crop market) price in the ticker. */
export interface CropTick {
  /** Commodity as the source publishes it ("Tomato", "Paddy(Common)"). */
  commodity: string;
  /** page_home key under "crops." for a translated name, or null (show as published). */
  cropKey: string | null;
  market: string;
  /** Typical (modal) price in rupees per quintal, as published. */
  perQuintal: number;
  /** Date of the price, "YYYY-MM-DD" (IST). */
  day: string;
  ageDays: number;
  old: boolean;
  stateSlug: string;
  districtSlug: string;
}

/** Live facts for one district on the home map (same rules as the district pages). */
export interface MapDistrictStat {
  population: { value: number; dataset: string | null; estimate: boolean } | null;
  /** Projects being built (the Projects page's "being built" count); null = no projects listed. */
  building: number | null;
  /** Report card grade; `expired` = older than its own validity. */
  grade: { grade: string; date: string; expired: boolean } | null;
  /** Newest reading or story we hold for the district (ISO), or null. */
  newest: string | null;
}

/** "10 districts live · 7 states · 5,874 data points · 36 dashboards · updated …" */
export interface PlatformStats {
  activeDistricts: number;
  activeStates: number;
  modulesPerDistrict: number;
  /** Rows of district data we hold for the live districts; null when the count failed. */
  dataPoints: number | null;
  /** When we last collected anything (ISO), or null. */
  lastUpdate: string | null;
}

/** A live district card / map pin. */
export interface HomeDistrict {
  slug: string;
  name: string;
  nameLocal: string | null;
  tagline: string | null;
  stateSlug: string;
  stateName: string;
  goLiveDate: string | null;
}

/** One headline national figure in the "Explore all of India" band. */
export interface IndiaFigure {
  id: "states" | "seats" | "languages" | "area";
  /** page_home keys for the label and the value ("india.figStates"). */
  labelKey: string;
  valueKey: string;
  values: Record<string, number>;
  source: string;
  sourceUrl: string | null;
  /** When the figure was last checked against its source (ISO). */
  asOf: string;
}
