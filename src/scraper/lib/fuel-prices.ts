/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Petrol and diesel prices — parsers and the double-check (pure, no I/O)
//
// Official sources (checked 27 Sep 2026; none needs a login or a captcha):
//
//   A. PPAC home page, https://ppac.gov.in/ — the Petroleum Planning &
//      Analysis Cell (Ministry of Petroleum and Natural Gas). Its "What's
//      New" line reads, for example:
//        "RSP of Petrol in Delhi as per IOCL outlet as on
//         25-September-2026, Rs. 102.12/ltr"          (and one for diesel)
//      and links the day's metro table (B).
//   B. PPAC "RSP of Petrol and Diesel in Metro Cities since 16.6.2017"
//      (PP_9_a_DailyPriceMSHSD_Metro_<dd.mm.yyyy>.pdf): one row per day,
//      petrol and diesel at IOCL outlets in Delhi, Mumbai, Chennai and
//      Kolkata, rupees per litre, newest day first.
//   C. BPCL "Price Build-up of Petrol / Diesel at Delhi at BPCL Retail Pump
//      Outlets" (bharatpetroleum.in/pdf/MS_Delhi_Price_Web_Upload.pdf and
//      HSD_…): the Delhi retail selling price and the day it took effect —
//      a second oil company's own publication.
//   (IOCL's own price page, iocl.com/petrol-diesel-price, sits behind a
//    JavaScript bot check, so it is not used.)
//
// The double-check (verifyFuel): the prices are stored only when
//   - A, B and C could all be read;
//   - B's newest day is A's "as on" day and not in the future;
//   - B's Delhi petrol and diesel equal A's to the paisa, and C's Delhi
//     price (in effect on or before that day) equals them too;
//   - every price is a plausible rupees-per-litre figure (40–250) and each
//     metro is within 0.8–1.4 × Delhi.
// Delhi is then double-checked (PPAC/IOCL and BPCL agree); Mumbai, Chennai
// and Kolkata come from the PPAC table alone (one official source) and are
// labelled that way. Anything else → nothing is written.
// ═══════════════════════════════════════════════════════════

export type Fuel = "petrol" | "diesel";
export const FUEL_CITIES = ["Delhi", "Mumbai", "Chennai", "Kolkata"] as const;
export type FuelCity = (typeof FUEL_CITIES)[number];

export const PPAC_HOME_URL = "https://ppac.gov.in/";
export const PPAC_METRO_PAGE_URL =
  "https://ppac.gov.in/retail-selling-price-rsp-of-petrol-diesel-and-domestic-lpg/rsp-of-petrol-and-diesel-in-metro-cities-since-16-6-2017";
export const BPCL_PRICES_PAGE_URL = "https://www.bharatpetroleum.in/our-businesses/fuels-and-services/petro-prices.aspx";
export const BPCL_BUILDUP_URL: Record<Fuel, string> = {
  petrol: "https://www.bharatpetroleum.in/pdf/MS_Delhi_Price_Web_Upload.pdf",
  diesel: "https://www.bharatpetroleum.in/pdf/HSD_Delhi_Price_Web_Upload.pdf",
};

/** A plausible retail price, rupees per litre. */
const MIN_RSP = 40;
const MAX_RSP = 250;
/** A metro's price relative to Delhi's (state taxes differ, not by this much). */
const METRO_RATIO: [number, number] = [0.8, 1.4];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

/** "25-Sep-26", "1-Aug-26", "25-September-2026" → "YYYY-MM-DD"; null otherwise. */
export function fuelDay(s: string): string | null {
  const m = /^\s*(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s,]*(\d{2}|\d{4})\s*$/.exec(s);
  if (!m) return null;
  const month = MONTHS[m[2].toLowerCase()];
  const day = Number(m[1]);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  if (!month || day < 1 || day > 31) return null;
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  // Reject 31-Feb and the like.
  return new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso ? iso : null;
}

/** "102.12" → 102.12 when it looks like a price in rupees and paise; else null. */
function rupees(s: string): number | null {
  const t = s.replace(/,/g, "").trim();
  if (!/^\d{1,3}\.\d{1,2}$/.test(t)) return null;
  return Number(t);
}

const paise = (n: number) => Math.round(n * 100);
export const samePrice = (a: number, b: number) => paise(a) === paise(b);
const plausible = (n: number) => Number.isFinite(n) && n >= MIN_RSP && n <= MAX_RSP;

// ── A. PPAC home page ──────────────────────────────────────────────────

export interface PpacHomeLine {
  fuel: Fuel;
  day: string;
  rsp: number;
  /** The PDF the line links to (the day's metro table), when it is on ppac.gov.in. */
  href: string | null;
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/** Only PPAC's own https links count as its publications. */
function ppacLink(href: string | undefined | null): string | null {
  if (!href) return null;
  try {
    const u = new URL(decode(href), PPAC_HOME_URL);
    return u.protocol === "https:" && u.hostname === "ppac.gov.in" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * The "RSP of Petrol/Diesel in Delhi as per IOCL outlet as on …, Rs. …/ltr"
 * lines. A fuel whose line is missing, or says two different things, is
 * left out.
 */
export function parsePpacHome(html: string): Partial<Record<Fuel, PpacHomeLine>> {
  const out: Partial<Record<Fuel, PpacHomeLine>> = {};
  const bad = new Set<Fuel>();
  const re = /<a\b[^>]*>([^<]*RSP of (Petrol|Diesel) in Delhi as per IOCL outlet as on [^<]*)</gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = decode(m[1]).replace(/\s+/g, " ");
    const fuel = m[2].toLowerCase() as Fuel;
    const parts = /as on\s+(\d{1,2}-[A-Za-z]+-\d{4})\s*,\s*Rs\.?\s*([\d,]+\.\d{1,2})\s*\/\s*(?:ltr|litre|liter)/i.exec(text);
    const day = parts ? fuelDay(parts[1]) : null;
    const rsp = parts ? rupees(parts[2]) : null;
    if (!day || rsp === null) {
      bad.add(fuel);
      continue;
    }
    const href = ppacLink(/\bhref="([^"]+)"/i.exec(m[0])?.[1]);
    const prev = out[fuel];
    if (prev && (prev.day !== day || !samePrice(prev.rsp, rsp))) bad.add(fuel);
    else out[fuel] = { fuel, day, rsp, href: prev?.href ?? href };
  }
  for (const f of bad) delete out[f];
  return out;
}

/**
 * Links to the metro table PDF: the "Current" link on the metro page and
 * any "DailyPriceMSHSD_Metro" link on the home page (PPAC posts the home
 * link hours before it updates the metro page).
 */
export function ppacMetroPdfLinks(html: string): string[] {
  const out: string[] = [];
  const re = /href="([^"]*DailyPriceMSHSD_Metro[^"]*\.pdf)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const link = ppacLink(m[1]);
    if (link && !out.includes(link)) out.push(link);
  }
  return out;
}

/** The dd.mm.yyyy day in a metro table's file name, as "YYYY-MM-DD". */
export function metroPdfDay(url: string): string | null {
  const m = /_Metro_(\d{2})\.(\d{2})\.(\d{4})\.pdf/i.exec(url);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

// ── B. PPAC metro table (PDF text lines, see pdf-text.ts) ─────────────────

export interface PpacMetroRow {
  day: string;
  petrol: Record<FuelCity, number>;
  diesel: Record<FuelCity, number>;
}

export interface PpacMetroTable {
  /** "Table Posted: 25-Sep-26", when printed. */
  posted: string | null;
  newest: PpacMetroRow;
  /** Rows read (all days in the file). */
  rows: number;
}

const isCity = (s: string): s is FuelCity => (FUEL_CITIES as readonly string[]).includes(s);

/**
 * Read the table: the header row gives the order of the cities (petrol
 * half, then diesel half); each data row is
 *   day, 4 petrol prices, day, 4 diesel prices.
 * Returns the newest day. Null when the header is missing, a city is
 * missing, or the newest day is printed twice with different prices.
 */
export function parsePpacMetroTable(lines: string[][]): PpacMetroTable | null {
  let order: { petrol: FuelCity[]; diesel: FuelCity[] } | null = null;
  let posted: string | null = null;
  const rows: PpacMetroRow[] = [];
  for (const cells of lines) {
    if (!posted && /^table posted:?$/i.test(cells[0] ?? "") && cells[1]) posted = fuelDay(cells[1]);
    if (!order && cells.length === 8 && cells.every(isCity)) {
      const petrol = cells.slice(0, 4) as FuelCity[];
      const diesel = cells.slice(4) as FuelCity[];
      if (FUEL_CITIES.every((c) => petrol.includes(c) && diesel.includes(c))) order = { petrol, diesel };
      continue;
    }
    if (!order || cells.length !== 10) continue;
    const d1 = fuelDay(cells[0]);
    const d2 = fuelDay(cells[5]);
    const p = cells.slice(1, 5).map(rupees);
    const d = cells.slice(6, 10).map(rupees);
    if (!d1 || d1 !== d2 || p.some((x) => x === null) || d.some((x) => x === null)) continue;
    const row: PpacMetroRow = { day: d1, petrol: {} as Record<FuelCity, number>, diesel: {} as Record<FuelCity, number> };
    order.petrol.forEach((c, i) => (row.petrol[c] = p[i] as number));
    order.diesel.forEach((c, i) => (row.diesel[c] = d[i] as number));
    rows.push(row);
  }
  if (!order || rows.length === 0) return null;
  const newestDay = rows.reduce((max, r) => (r.day > max ? r.day : max), rows[0].day);
  const same = rows.filter((r) => r.day === newestDay);
  const newest = same[0];
  const conflict = same.some((r) => FUEL_CITIES.some((c) => !samePrice(r.petrol[c], newest.petrol[c]) || !samePrice(r.diesel[c], newest.diesel[c])));
  if (conflict) return null;
  return { posted, newest, rows: rows.length };
}

// ── C. BPCL price build-up (PDF text lines) ───────────────────────────────

export interface BpclBuildUp {
  fuel: Fuel;
  /** The day the price took effect ("Effective 1-Aug-26"). */
  effective: string;
  /** "Retail Selling Price at Delhi (Rounded)", rupees per litre. */
  rsp: number;
}

export function parseBpclBuildUp(lines: string[][]): BpclBuildUp | null {
  const flat = lines.map((l) => l.join(" "));
  const title = flat.find((l) => /Price Build-up of (Petrol|Diesel) at Delhi at BPCL/i.test(l));
  const fuel = title ? (/Petrol/i.test(title) ? "petrol" : "diesel") : null;
  const effIdx = flat.findIndex((l) => /^Effective$/i.test(l.trim()));
  let effective: string | null = null;
  if (effIdx >= 0) {
    for (const l of flat.slice(effIdx + 1, effIdx + 4)) {
      effective = fuelDay(l);
      if (effective) break;
    }
  }
  const rspLine = lines.find((l) => l.some((c) => /Retail Selling Price at Delhi/i.test(c)));
  const rsp = rspLine ? rupees(rspLine[rspLine.length - 1]) : null;
  if (!fuel || !effective || rsp === null) return null;
  return { fuel, effective, rsp };
}

// ── The double-check ───────────────────────────────────────────────────

export interface FuelCityPrice {
  city: FuelCity;
  petrol: number;
  diesel: number;
  /** "double" = PPAC (IOCL outlet) and BPCL agree; "single" = the PPAC table only. */
  check: "double" | "single";
}

/** What the collector stores (Redis "ftp:data:fuel") and the site reads. */
export interface FuelSnapshot {
  kind: "fuel";
  /** PPAC's "as on" day, "YYYY-MM-DD": prices in force from 6 am that day. */
  asOf: string;
  /** Rupees per litre at IOCL retail outlets (PPAC), Delhi first. */
  cities: FuelCityPrice[];
  sources: {
    ppacHome: string;
    ppacTable: string;
    bpcl: Record<Fuel, string>;
  };
  /** The day BPCL's Delhi prices took effect. */
  bpclEffective: Record<Fuel, string>;
  /** When we fetched and checked it (ISO). */
  fetchedAt: string;
}

export interface FuelInputs {
  home: Partial<Record<Fuel, PpacHomeLine>>;
  table: PpacMetroTable | null;
  tableUrl: string | null;
  bpcl: Partial<Record<Fuel, BpclBuildUp | null>>;
  /** Today in India, "YYYY-MM-DD". */
  today: string;
  fetchedAt: string;
}

export type FuelCheck = { ok: true; snapshot: FuelSnapshot } | { ok: false; problems: string[] };

export function verifyFuel(input: FuelInputs): FuelCheck {
  const problems: string[] = [];
  const { home, table, bpcl, today } = input;
  const fuels: Fuel[] = ["petrol", "diesel"];

  for (const f of fuels) if (!home[f]) problems.push(`PPAC home page: no readable Delhi ${f} line`);
  if (!table) problems.push("PPAC metro table: could not be read");
  if (!input.tableUrl) problems.push("PPAC metro table: no link found");
  for (const f of fuels) if (!bpcl[f]) problems.push(`BPCL ${f} price build-up: could not be read`);
  if (problems.length) return { ok: false, problems };

  const day = home.petrol!.day;
  const row = table!.newest;
  if (home.diesel!.day !== day) problems.push(`PPAC home page: petrol is as on ${day}, diesel as on ${home.diesel!.day}`);
  if (row.day !== day) problems.push(`PPAC metro table's newest day is ${row.day}, the home page says ${day}`);
  if (day > today) problems.push(`PPAC day ${day} is after today (${today})`);

  for (const f of fuels) {
    const a = home[f]!.rsp;
    const b = row[f].Delhi;
    const c = bpcl[f]!;
    if (!samePrice(a, b)) problems.push(`Delhi ${f}: PPAC home page ₹${a} ≠ PPAC table ₹${b}`);
    if (!samePrice(a, c.rsp)) problems.push(`Delhi ${f}: PPAC (IOCL) ₹${a} ≠ BPCL ₹${c.rsp}`);
    if (c.effective > day) problems.push(`BPCL ${f} price takes effect ${c.effective}, after PPAC's day ${day}`);
    for (const city of FUEL_CITIES) {
      const v = row[f][city];
      if (!plausible(v)) problems.push(`${city} ${f} ₹${v} is not a plausible price`);
      const ratio = v / row[f].Delhi;
      if (city !== "Delhi" && (ratio < METRO_RATIO[0] || ratio > METRO_RATIO[1])) problems.push(`${city} ${f} ₹${v} is far from Delhi's ₹${row[f].Delhi}`);
    }
  }
  if (problems.length) return { ok: false, problems };

  return {
    ok: true,
    snapshot: {
      kind: "fuel",
      asOf: day,
      cities: FUEL_CITIES.map((city) => ({
        city,
        petrol: row.petrol[city],
        diesel: row.diesel[city],
        check: city === "Delhi" ? "double" : "single",
      })),
      sources: { ppacHome: PPAC_HOME_URL, ppacTable: input.tableUrl!, bpcl: { ...BPCL_BUILDUP_URL } },
      bpclEffective: { petrol: bpcl.petrol!.effective, diesel: bpcl.diesel!.effective },
      fetchedAt: input.fetchedAt,
    },
  };
}

const storedPrice = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n > 0;

/** True when a stored value has the shape the pages expect (never render half a record). */
export function isFuelSnapshot(v: unknown): v is FuelSnapshot {
  const s = v as FuelSnapshot | null;
  return Boolean(
    s &&
      s.kind === "fuel" &&
      typeof s.asOf === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.asOf) &&
      Array.isArray(s.cities) &&
      s.cities.length > 0 &&
      s.cities.every((c) => isCity(c.city) && storedPrice(c.petrol) && storedPrice(c.diesel) && (c.check === "double" || c.check === "single")) &&
      Boolean(s.sources) &&
      typeof s.sources.ppacTable === "string",
  );
}
