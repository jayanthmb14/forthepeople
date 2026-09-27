/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// NDMA SACHET — official disaster alerts (pure parsers + matching)
//
// SACHET is the National Disaster Management Authority's Common Alerting
// Protocol (CAP) system. IMD, CWC and the State Disaster Management
// Authorities publish through it.
//   RSS (all India):  https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml
//     one <item> per alert thread; <guid> = the thread id
//   CAP message:      …/FetchXMLFile?identifier=<guid>
//     sender, status, msgType, and one <cap:info> per language with event,
//     severity, urgency, onset, expires, headline, description, areaDesc
//     and a "Polygon URL" parameter
//   Polygon:          …/FetchPolygonXMLFile?identifier=<guid>
//     <polygon>lat,lng lat,lng …</polygon>, one per area
//
// Matching an alert to one of our districts (matchAlertToDistrict):
//   1. the district's STATE must be named by the alert (sender such as
//      "Karnataka-SDMA", or areaDesc such as "… districts of Tamil Nadu" /
//      "Ganga, Haridwar, Haridwar, Uttarakhand") — this stops "Hyderabad"
//      or "Aurangabad" style clashes;
//   2. then the district's name (or an alias) as whole words in the
//      English headline or areaDesc → match "name";
//   3. only when the alert has NO English text (a Hindi- or Kannada-only
//      nowcast, where names cannot be matched) and the caller has the
//      polygons: the district HQ point inside an alert polygon → match
//      "polygon". Not used for English alerts, because a district ring can
//      enclose another district (Hyderabad sits inside Ranga Reddy's outer
//      boundary), and the English text already names the districts.
// Descriptions and instructions are not searched: they carry signatures
// such as "Mantralaya, Mumbai" that are not the affected area.
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { mentionsName } from "./district-aliases";

export const SACHET_RSS_URL = "https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml";
export const SACHET_CAP_URL = (guid: string) =>
  `https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=${encodeURIComponent(guid)}`;
export const SACHET_POLYGON_URL = (guid: string) =>
  `https://sachet.ndma.gov.in/cap_public_website/FetchPolygonXMLFile?identifier=${encodeURIComponent(guid)}`;
/** Every LocalAlert written from SACHET has a sourceUrl starting with this. */
export const SACHET_SOURCE_PREFIX = "https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=";

// ── RSS ──────────────────────────────────────────────────────

export interface SachetItem {
  guid: string;
  title: string;
  link: string;
  pubDate: Date | null;
  /** Issuing office from <author>, e.g. "IMD Chennai", "CWC". */
  office: string | null;
  category: string | null;
}

export function parseSachetRss(xml: string): SachetItem[] {
  const $ = cheerio.load(xml, { xmlMode: true });
  const out: SachetItem[] = [];
  $("item").each((_, el) => {
    const it = $(el);
    const guid = it.find("guid").first().text().trim();
    if (!/^[\w-]+$/.test(guid)) return;
    const pub = new Date(it.find("pubDate").first().text().trim());
    const author = it.find("author").first().text().trim();
    out.push({
      guid,
      title: it.find("title").first().text().replace(/\s+/g, " ").trim(),
      link: it.find("link").first().text().trim() || SACHET_CAP_URL(guid),
      pubDate: Number.isNaN(pub.getTime()) ? null : pub,
      office: /\(([^)]+)\)\s*$/.exec(author)?.[1]?.trim() ?? null,
      category: it.find("category").first().text().trim() || null,
    });
  });
  return out;
}

// ── CAP message ──────────────────────────────────────────────

export interface CapInfo {
  language: string;
  category: string | null;
  event: string | null;
  urgency: string | null;
  severity: string | null;
  certainty: string | null;
  effective: Date | null;
  onset: Date | null;
  expires: Date | null;
  headline: string | null;
  description: string | null;
  instruction: string | null;
  areaDescs: string[];
  polygonUrl: string | null;
}

export interface CapAlert {
  identifier: string;
  sender: string;
  sent: Date | null;
  status: string;
  msgType: string;
  infos: CapInfo[];
}

const date = (s: string) => {
  const d = new Date(s.trim());
  return s.trim() && !Number.isNaN(d.getTime()) ? d : null;
};
const textOrNull = (s: string) => s.replace(/\s+/g, " ").trim() || null;

/** A CAP 1.2 message (with or without the "cap:" prefix) → structured alert, or null. */
export function parseCapAlert(xml: string): CapAlert | null {
  const $ = cheerio.load(xml.replace(/<(\/?)cap:/g, "<$1"), { xmlMode: true });
  const alert = $("alert").first();
  if (alert.length === 0) return null;
  const child = (el: ReturnType<typeof $>, tag: string) => el.children(tag).first().text();
  const infos: CapInfo[] = [];
  alert.children("info").each((_, node) => {
    const info = $(node);
    let polygonUrl: string | null = null;
    info.children("parameter").each((_, p) => {
      const name = $(p).children("valueName").text().trim().toLowerCase();
      const value = $(p).children("value").text().trim();
      if (name === "polygon url" && /^https:\/\/sachet\.ndma\.gov\.in\//.test(value)) polygonUrl = value;
    });
    infos.push({
      language: child(info, "language").trim() || "en-IN",
      category: textOrNull(child(info, "category")),
      event: textOrNull(child(info, "event")),
      urgency: textOrNull(child(info, "urgency")),
      severity: textOrNull(child(info, "severity")),
      certainty: textOrNull(child(info, "certainty")),
      effective: date(child(info, "effective")),
      onset: date(child(info, "onset")),
      expires: date(child(info, "expires")),
      headline: textOrNull(child(info, "headline")),
      description: textOrNull(child(info, "description")),
      instruction: textOrNull(child(info, "instruction")),
      areaDescs: info
        .children("area")
        .map((_, a) => $(a).children("areaDesc").text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean),
      polygonUrl,
    });
  });
  return {
    identifier: child(alert, "identifier").trim(),
    sender: child(alert, "sender").trim(),
    sent: date(child(alert, "sent")),
    status: child(alert, "status").trim(),
    msgType: child(alert, "msgType").trim(),
    infos,
  };
}

/** The English info block, else the first one. */
export function englishInfo(cap: CapAlert): CapInfo | null {
  return cap.infos.find((i) => /^en\b/i.test(i.language)) ?? cap.infos[0] ?? null;
}

/** The first non-English info block (for titleLocal), or null. */
export function localInfo(cap: CapAlert): CapInfo | null {
  return cap.infos.find((i) => !/^en\b/i.test(i.language) && i.headline) ?? null;
}

// ── Severity + type ──────────────────────────────────────────

/** CAP severity → LocalAlert.severity (the words the alerts page ranks). */
export function capSeverity(severity: string | null | undefined): "critical" | "high" | "medium" | "low" | "info" {
  switch ((severity ?? "").trim().toLowerCase()) {
    case "extreme":
      return "critical";
    case "severe":
      return "high";
    case "moderate":
      return "medium";
    case "minor":
      return "low";
    default:
      return "info";
  }
}

/** CAP event text → LocalAlert.type (keys the alerts page translates). */
export function capAlertType(event: string | null | undefined, category?: string | null): string {
  const e = (event ?? "").toLowerCase();
  if (/flood|inundat/.test(e)) return "flood";
  if (/cyclone|depression|storm surge/.test(e)) return "cyclone";
  if (/heat/.test(e)) return "heat_wave";
  if (/cold/.test(e)) return "cold_wave";
  if (/thunder|lightning|squall|gust/.test(e)) return "thunderstorm";
  if (/heavy|cloudburst/.test(e)) return "heavy_rain";
  if (/rain/.test(e)) return "weather"; // "Moderate Rain" is not "Heavy rain"
  if (/landslide|avalanche/.test(e)) return "landslide";
  if (/earthquake|tsunami/.test(e)) return "earthquake";
  if (/fire/.test(e)) return "fire";
  if (/(^|\b)met(\b|$)/i.test(category ?? "") || /weather|wind|fog|dust|hail/.test(e)) return "weather";
  return "natural_disaster";
}

// ── Matching ─────────────────────────────────────────────────

export interface DistrictForMatch {
  slug: string;
  stateName: string;
  /** District name + aliases, from alertDistrictNames(). */
  names: string[];
  /** District HQ, from DISTRICT_CENTROIDS (for the polygon test). */
  hq?: { lat: number; lng: number } | null;
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

/** Signatures that name a place without it being the affected area. */
const SIGNATURES = [/mantralaya,?\s*mumbai/gi];

/** Does the alert name this state (sender, areaDesc or headline)? */
export function alertNamesState(cap: CapAlert, stateName: string): boolean {
  const s = squash(stateName);
  if (!s) return false;
  const aliases = s === "delhi" ? ["delhi", "nctofdelhi"] : [s];
  const info = englishInfo(cap);
  const hay = [cap.sender, ...(info?.areaDescs ?? []), info?.headline ?? ""].map(squash);
  return hay.some((h) => aliases.some((a) => h.includes(a)));
}

/**
 * "name" when the English headline or areaDesc names the district (and the
 * alert names its state); "polygon" when a polygon holds the district HQ
 * (state still required); otherwise null.
 */
export function matchAlertToDistrict(
  cap: CapAlert,
  d: DistrictForMatch,
  polygons: Array<Array<[number, number]>> = [],
): "name" | "polygon" | null {
  if (!alertNamesState(cap, d.stateName)) return null;
  const info = englishInfo(cap);
  let text = [info?.headline ?? "", ...(info?.areaDescs ?? [])].join(" | ");
  for (const sig of SIGNATURES) text = text.replace(sig, " ");
  if (d.names.some((n) => mentionsName(text, n))) return "name";
  if (needsPolygon(cap) && d.hq && polygons.some((poly) => pointInPolygon(d.hq!.lat, d.hq!.lng, poly))) return "polygon";
  return null;
}

/** True when the alert has no English text, so only its polygon can place it. */
export function needsPolygon(cap: CapAlert): boolean {
  return !cap.infos.some((i) => /^en\b/i.test(i.language));
}

// ── Polygons ─────────────────────────────────────────────────

/** Polygon XML → polygons as [lat, lng] rings. Malformed pairs are dropped. */
export function parsePolygons(xml: string): Array<Array<[number, number]>> {
  const out: Array<Array<[number, number]>> = [];
  const re = /<polygon>([\s\S]*?)<\/polygon>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const ring: Array<[number, number]> = [];
    for (const pair of m[1].trim().split(/\s+/)) {
      const [lat, lng] = pair.split(",").map(Number);
      if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) ring.push([lat, lng]);
    }
    if (ring.length >= 3) out.push(ring);
  }
  return out;
}

/** Ray casting: is (lat, lng) inside the ring? */
export function pointInPolygon(lat: number, lng: number, ring: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Is a CAP message something to show (a real, current, non-cancelled alert)? */
export function isLiveAlert(cap: CapAlert, info: CapInfo | null, nowMs: number): boolean {
  if (!info) return false;
  if (!/^actual$/i.test(cap.status)) return false;
  if (/^cancel$/i.test(cap.msgType)) return false;
  return !info.expires || info.expires.getTime() > nowMs;
}
