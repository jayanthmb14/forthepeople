/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// State e-procurement portals on NIC's GePNIC software — which bodies
// we follow, parsers and checks (pure: no DB, no network).
//
// Maharashtra, Tamil Nadu, West Bengal and Delhi publish their tenders
// on GePNIC portals (…/nicgep/app). Their "Tenders by Organisation"
// pages need no login and no captcha (checked 27 Sep 2026):
//
//   GET ?page=FrontEndTendersByOrganisation&service=page
//       every organisation with its count of active tenders, each a
//       session link (JSESSIONID cookie)
//   GET that link → ALL of the organisation's active tenders on one page:
//       e-Published date, closing date, opening date, "[title] [ref no]
//       [tender id]", organisation chain, and a session link to
//   GET FrontEndViewTender → the tender's own page: tender type and
//       category, value, EMD and fee in ₹, location, pincode, dates.
//
// The portals' search pages (by location, keyword) need a captcha; we do
// not use them. The CPPP all-India "latest active tenders" list has no
// location at all, and Karnataka's KPPP and Telangana run other software,
// so they are not covered here.
//
// Which organisations count for a district is a short, hand-checked list
// (GEPNIC_ORGS in src/lib/constants/tender-portals.ts): the bodies whose
// whole area is that district. Regional bodies that also cover other
// districts are left out rather than guessed.
//
// A tender is written only from its own page, and only when that page
// agrees with the listing (same tender id, same closing date, same
// organisation). Dates on the portals are Indian time.
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { normName } from "./source-districts";
import type { GepnicPortal } from "@/lib/constants/tender-portals";

// The portal list and the followed bodies are plain data shared with the
// source panels and the tender switch (src/lib/constants/tender-portals.ts).
export { GEPNIC_ORGS, GEPNIC_PORTALS, type FollowedOrg, type GepnicPortal } from "@/lib/constants/tender-portals";

export const orgListUrl = (p: GepnicPortal) => `${p.app}?page=FrontEndTendersByOrganisation&service=page`;

// ── Dates ────────────────────────────────────────────────────

const MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

/** "25-Sep-2026 11:00 AM" (Indian time) → Date, or null ("NA", blank, malformed). */
export function parseIstDateTime(s: string | null | undefined): Date | null {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i.exec((s ?? "").replace(/ /g, " ").trim());
  if (!m) return null;
  const mon = MONTHS[m[2].toUpperCase()];
  if (mon === undefined) return null;
  let h = m[4] ? Number(m[4]) : 0;
  const min = m[5] ? Number(m[5]) : 0;
  if (m[6]) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (m[6].toUpperCase() === "PM" ? 12 : 0);
  }
  if (h > 23 || min > 59) return null;
  const day = Number(m[1]);
  // IST = UTC+5:30
  const d = new Date(Date.UTC(Number(m[3]), mon, day, h, min) - 330 * 60_000);
  // Reject roll-overs such as 31-Feb.
  const back = new Date(d.getTime() + 330 * 60_000);
  return back.getUTCDate() === day && back.getUTCMonth() === mon ? d : null;
}

// ── Organisation list ────────────────────────────────────────

export interface OrgLink {
  name: string;
  count: number;
  /** Absolute URL of the session link. */
  href: string;
}

export function parseOrgList(html: string, app: string): OrgLink[] {
  const $ = cheerio.load(html);
  const out: OrgLink[] = [];
  $("tr").each((_, tr) => {
    const tds = $(tr).children("td");
    if (tds.length !== 3) return;
    const sno = $(tds[0]).text().trim();
    const name = $(tds[1]).text().replace(/\s+/g, " ").trim();
    const a = $(tds[2]).find("a").first();
    const count = Number(a.text().trim() || $(tds[2]).text().trim());
    const href = a.attr("href") ?? "";
    if (!/^\d+$/.test(sno) || !name || !Number.isInteger(count) || !/FrontEndTendersByOrganisation/.test(href)) return;
    out.push({ name, count, href: new URL(href, app).toString() });
  });
  return out;
}

// ── An organisation's active tenders ─────────────────────────

export interface ListedTender {
  tenderId: string;
  refNo: string | null;
  title: string;
  publishedAt: Date | null;
  closingAt: Date | null;
  openingAt: Date | null;
  orgChain: string[];
  /** Absolute URL of the tender's session link. */
  href: string;
}

const TENDER_ID = /^\d{4}_[A-Za-z0-9]+_\d+_\d+$/;

export function parseOrgTenders(html: string, app: string): ListedTender[] {
  const $ = cheerio.load(html);
  const out: ListedTender[] = [];
  $("table#table tr").each((_, tr) => {
    const tds = $(tr).children("td");
    if (tds.length < 6) return;
    const a = $(tds[4]).find("a[href*='FrontEndViewTender']").first();
    if (a.length === 0) return;
    const cellText = $(tds[4]).text().replace(/\s+/g, " ").trim();
    const groups = Array.from(cellText.matchAll(/\[([^\]]*)\]/g), (m) => m[1].trim());
    const tenderId = groups.length > 0 ? groups[groups.length - 1] : "";
    if (!TENDER_ID.test(tenderId)) return;
    const title = a.text().replace(/\s+/g, " ").trim().replace(/^\[/, "").replace(/\]$/, "").trim();
    out.push({
      tenderId,
      refNo: groups.length >= 3 ? groups[groups.length - 2] || null : null,
      title,
      publishedAt: parseIstDateTime($(tds[1]).text()),
      closingAt: parseIstDateTime($(tds[2]).text()),
      openingAt: parseIstDateTime($(tds[3]).text()),
      orgChain: $(tds[5]).text().split("||").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean),
      href: new URL(a.attr("href") ?? "", app).toString(),
    });
  });
  return out;
}

// ── A tender's own page ──────────────────────────────────────

/** Every "caption → field" pair on the page (first occurrence of a caption wins). */
export function detailFields(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const f: Record<string, string> = {};
  $("td.td_caption").each((_, td) => {
    const label = $(td).text().replace(/ /g, " ").replace(/\s+/g, " ").replace(/\s*₹\s*/g, " ₹").trim();
    const val = $(td).nextAll("td.td_field").first();
    if (!label || val.length === 0 || label in f) return;
    f[label] = val.text().replace(/ /g, " ").replace(/\s+/g, " ").trim();
  });
  return f;
}

export interface TenderDetail {
  tenderId: string;
  refNo: string | null;
  title: string;
  description: string | null;
  orgChain: string[];
  tenderType: string;
  tenderCategory: string;
  valueInr: bigint | null;
  emdInr: bigint | null;
  feeInr: bigint | null;
  covers: number | null;
  location: string | null;
  pincode: string | null;
  publishedAt: Date | null;
  bidStartAt: Date | null;
  bidEndAt: Date | null;
  bidOpeningAt: Date | null;
  preBidAt: Date | null;
}

/** "30,00,000" → 3000000n; "NA", "0.00", "", "Refer Document" → null (not published ≠ zero). */
export function parseRupees(s: string | undefined): bigint | null {
  const t = (s ?? "").replace(/[,\s₹]/g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return BigInt(Math.round(n));
}

const pick = (f: Record<string, string>, ...labels: string[]) => {
  for (const l of labels) {
    const hit = Object.keys(f).find((k) => k.toLowerCase().startsWith(l.toLowerCase()));
    if (hit && f[hit] && !/^(NA|N\/A|-)$/i.test(f[hit])) return f[hit];
  }
  return undefined;
};

export function parseTenderDetail(html: string): TenderDetail | null {
  const f = detailFields(html);
  const tenderId = pick(f, "Tender ID") ?? "";
  const title = pick(f, "Title") ?? "";
  const tenderType = pick(f, "Tender Type") ?? "";
  const tenderCategory = pick(f, "Tender Category") ?? "";
  if (!TENDER_ID.test(tenderId) || !title || !tenderType || !tenderCategory) return null;
  const description = pick(f, "Work Description") ?? null;
  const covers = Number(pick(f, "No. of Covers"));
  const pin = (pick(f, "Pincode") ?? "").replace(/\s/g, "");
  return {
    tenderId,
    refNo: pick(f, "Tender Reference Number") ?? null,
    title,
    description: description && description !== title ? description : null,
    orgChain: (pick(f, "Organisation Chain") ?? "").split("||").map((s) => s.trim()).filter(Boolean),
    tenderType,
    tenderCategory,
    valueInr: parseRupees(pick(f, "Tender Value in")),
    emdInr: parseRupees(pick(f, "EMD Amount in")),
    feeInr: parseRupees(pick(f, "Tender Fee in")),
    covers: Number.isInteger(covers) && covers > 0 && covers < 10 ? covers : null,
    location: pick(f, "Location") ?? null,
    pincode: /^\d{6}$/.test(pin) ? pin : null,
    publishedAt: parseIstDateTime(pick(f, "Published Date")),
    bidStartAt: parseIstDateTime(pick(f, "Bid Submission Start Date")),
    bidEndAt: parseIstDateTime(pick(f, "Bid Submission End Date")),
    bidOpeningAt: parseIstDateTime(pick(f, "Bid Opening Date")),
    preBidAt: parseIstDateTime(pick(f, "Pre Bid Meeting Date")),
  };
}

/** Tender.workType from the portal's "Tender Category"; unknown values are kept as published. */
export function workTypeOf(category: string): string {
  const c = category.trim().toLowerCase();
  if (c === "works") return "WORKS";
  if (c === "goods") return "GOODS";
  if (c === "services") return "SERVICES";
  if (c.startsWith("consult")) return "CONSULTANCY";
  return category.trim().toUpperCase().slice(0, 40);
}

/** Tender.procurementType from the portal's "Tender Type"; unknown values are kept as published. */
export function procurementTypeOf(type: string): string {
  const t = type.trim().toLowerCase();
  if (/^open/.test(t) || t === "global tenders") return "OPEN";
  if (/^limited/.test(t)) return "LIMITED";
  if (/single/.test(t)) return "SINGLE";
  if (/^eoi|expression of interest/.test(t)) return "EOI";
  if (/auction/.test(t)) return "REVERSE_AUCTION";
  return type.trim().toUpperCase().slice(0, 40);
}

/** Does the tender's own page agree with the listing row? Empty = yes. */
export function detailProblems(listed: ListedTender, d: TenderDetail, orgName: string, now: Date): string[] {
  const p: string[] = [];
  if (d.tenderId !== listed.tenderId) p.push(`page is ${d.tenderId}, listing said ${listed.tenderId}`);
  if (!d.bidEndAt) p.push("no bid submission end date");
  else if (listed.closingAt && Math.abs(d.bidEndAt.getTime() - listed.closingAt.getTime()) > 60_000)
    p.push(`closing date differs (page ${d.bidEndAt.toISOString()}, listing ${listed.closingAt.toISOString()})`);
  if (!d.publishedAt) p.push("no published date");
  else {
    if (d.publishedAt.getTime() > now.getTime() + 86_400_000) p.push("published in the future");
    if (d.bidEndAt && d.bidEndAt.getTime() < d.publishedAt.getTime()) p.push("closes before it was published");
  }
  if (normName(d.orgChain[0] ?? "") !== normName(orgName)) p.push(`organisation is ${d.orgChain[0] ?? "?"}, expected ${orgName}`);
  return p;
}
