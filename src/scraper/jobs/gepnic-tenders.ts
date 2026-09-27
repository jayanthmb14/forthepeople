/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Government contracts (tenders) from the state GePNIC portals
// Schedule: every 2 hours via /api/cron/scrape-tenders (vercel.json).
//
// Sept 2026 (v5.1): the tender orchestrator (src/scraper/tender-
// orchestrator.ts) never ran (TenderScraperRun has 0 rows) and its
// engines target search pages behind captchas; the 12 seeded tenders all
// closed in May. This job follows a short list of district bodies on
// the Maharashtra, Tamil Nadu, West Bengal and Delhi portals (see
// src/scraper/lib/gepnic.ts for the list, the pages used and why) and
// writes one Tender per tender, from the tender's own page.
//
// Per portal (portals run side by side; requests to one portal are
// 2.5 s apart):
//   1. the "Tenders by Organisation" page (starts the session);
//   2. per followed organisation: its list of active tenders;
//   3. the tender pages of tenders we do not have yet, or whose closing
//      date moved (a corrigendum), newest first, within the time budget
//      and a fair share per organisation; the rest follow next run;
//   4. each page must agree with the listing (tender id, closing date,
//      organisation) or the tender is skipped;
//   5. our tenders of that organisation that have passed their closing
//      date are marked BID_CLOSED.
// Money is whole rupees (Tender.*Inr). "Tender value" left blank or
// 0.00 by the portal is stored as null, never 0. No person's name from
// the page is stored.
// ═══════════════════════════════════════════════════════════
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { CookieSession } from "../lib/source-fetch";
import { normName, type CollectorDistrict } from "../lib/source-districts";
import {
  GEPNIC_ORGS,
  GEPNIC_PORTALS,
  detailProblems,
  orgListUrl,
  parseOrgList,
  parseOrgTenders,
  parseTenderDetail,
  procurementTypeOf,
  workTypeOf,
  type FollowedOrg,
  type GepnicPortal,
  type ListedTender,
  type TenderDetail,
} from "../lib/gepnic";
import type { RunFailure } from "../lib/run-log";

export interface TendersRunResult {
  /** Organisations we tried to read. */
  attempted: number;
  created: number;
  updated: number;
  skipped: number;
  closed: number;
  /** Tenders listed but left for the next run (time budget). */
  pending: number;
  notCovered: string[];
  failures: RunFailure[];
  changedSlugs: string[];
  budgetExhausted: boolean;
  perDistrict: Record<string, { listed: number; created: number; updated: number; pending: number }>;
}

interface Entry {
  district: CollectorDistrict;
  org: FollowedOrg;
}

function contentHash(d: TenderDetail): string {
  const canonical = JSON.stringify([d.tenderId, d.title, d.valueInr?.toString() ?? null, d.bidEndAt?.toISOString() ?? null, d.tenderType, d.tenderCategory]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 32);
}

async function upsertAuthority(portal: GepnicPortal, e: Entry): Promise<string> {
  const a = await prisma.tenderAuthority.upsert({
    where: { shortCode: e.org.shortCode },
    create: {
      shortCode: e.org.shortCode,
      name: e.org.org,
      authorityType: e.org.authorityType,
      state: e.district.stateName,
      district: e.district.name,
      websiteUrl: orgListUrl(portal),
    },
    update: { name: e.org.org, authorityType: e.org.authorityType, state: e.district.stateName, district: e.district.name },
    select: { id: true },
  });
  return a.id;
}

async function writeTender(portal: GepnicPortal, e: Entry, authorityId: string, d: TenderDetail, now: Date): Promise<"created" | "updated"> {
  const status = d.bidEndAt!.getTime() > now.getTime() ? "OPEN_FOR_BIDS" : "BID_CLOSED";
  const data = {
    sourceUrl: orgListUrl(portal),
    nitRefNumber: d.refNo?.slice(0, 200) ?? null,
    title: d.title.slice(0, 500),
    description: d.description?.slice(0, 5000) ?? null,
    workType: workTypeOf(d.tenderCategory),
    procurementType: procurementTypeOf(d.tenderType),
    authorityId,
    estimatedValueInr: d.valueInr,
    tenderFeeInr: d.feeInr,
    emdAmountInr: d.emdInr,
    publishedAt: d.publishedAt!,
    bidSubmissionStart: d.bidStartAt,
    bidSubmissionEnd: d.bidEndAt!,
    preBidMeetingAt: d.preBidAt,
    technicalOpeningAt: d.bidOpeningAt,
    numberOfCovers: d.covers,
    locationState: e.district.stateName,
    locationDistrict: e.district.name,
    locationPincode: d.pincode,
    lastCheckedAt: now,
    contentHash: contentHash(d),
  };
  const existing = await prisma.tender.findUnique({
    where: { sourcePortal_sourceTenderId: { sourcePortal: portal.host, sourceTenderId: d.tenderId } },
    select: { id: true, status: true },
  });
  if (existing) {
    await prisma.tender.update({
      where: { id: existing.id },
      data: { ...data, status, ...(existing.status !== status ? { statusChangedAt: now } : {}) },
    });
    return "updated";
  }
  await prisma.tender.create({
    data: { ...data, sourcePortal: portal.host, sourceTenderId: d.tenderId, status, statusChangedAt: now },
  });
  return "created";
}

async function runPortal(
  portal: GepnicPortal,
  entries: Entry[],
  out: TendersRunResult,
  opts: { deadlineMs: number; log: (m: string) => void; maxDetails: number },
): Promise<void> {
  const session = new CookieSession({ deadlineMs: opts.deadlineMs, referer: orgListUrl(portal) });
  const now = new Date();
  let orgs;
  try {
    orgs = parseOrgList(await session.request(orgListUrl(portal), { timeoutMs: 30_000 }), portal.app);
  } catch (err) {
    for (const e of entries) out.failures.push({ district: e.district.slug, error: err instanceof Error ? err.message : String(err) });
    return;
  }
  if (orgs.length === 0) {
    for (const e of entries) out.failures.push({ district: e.district.slug, error: `${portal.host}: organisation list unreadable` });
    return;
  }

  let detailsLeft = opts.maxDetails;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const stats = (out.perDistrict[e.district.slug] ??= { listed: 0, created: 0, updated: 0, pending: 0 });
    const link = orgs.find((o) => normName(o.name) === normName(e.org.org));
    if (!link) {
      // Not on today's list = no active tenders right now; not an error.
      opts.log(`${portal.host}: ${e.org.org} has no active tenders listed`);
      continue;
    }
    if (Date.now() > opts.deadlineMs) {
      out.budgetExhausted = true;
      break;
    }
    out.attempted++;
    try {
      const authorityId = await upsertAuthority(portal, e);
      const listed = parseOrgTenders(await session.request(link.href, { timeoutMs: 45_000 }), portal.app).filter(
        (t) => normName(t.orgChain[0] ?? "") === normName(e.org.org),
      );
      stats.listed += listed.length;
      if (listed.length === 0 && link.count > 0) throw new Error(`${e.org.org}: list said ${link.count} tenders, page had none`);

      const known = await prisma.tender.findMany({
        where: { sourcePortal: portal.host, sourceTenderId: { in: listed.map((t) => t.tenderId) } },
        select: { sourceTenderId: true, bidSubmissionEnd: true },
      });
      const knownEnd = new Map(known.map((k) => [k.sourceTenderId, k.bidSubmissionEnd.getTime()]));
      const todo: ListedTender[] = listed
        .filter((t) => {
          const end = knownEnd.get(t.tenderId);
          return end === undefined || !t.closingAt || Math.abs(end - t.closingAt.getTime()) > 60_000;
        })
        .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

      // Fair share of this run's tender pages for each remaining organisation.
      const share = Math.max(5, Math.floor(detailsLeft / (entries.length - i)));
      let done = 0;
      for (const t of todo) {
        if (done >= share || detailsLeft <= 0 || Date.now() + 5_000 > opts.deadlineMs) break;
        done++;
        detailsLeft--;
        const d = parseTenderDetail(await session.request(t.href, { timeoutMs: 30_000 }));
        const problems = d ? detailProblems(t, d, e.org.org, now) : ["tender page unreadable"];
        if (!d || problems.length > 0) {
          out.skipped++;
          opts.log(`${t.tenderId}: skipped (${problems.join("; ")})`);
          continue;
        }
        const res = await writeTender(portal, e, authorityId, d, now);
        if (res === "created") {
          out.created++;
          stats.created++;
        } else {
          out.updated++;
          stats.updated++;
        }
        if (!out.changedSlugs.includes(e.district.slug)) out.changedSlugs.push(e.district.slug);
      }
      const pending = todo.length - done;
      stats.pending += pending;
      out.pending += pending;
      if (pending > 0) out.budgetExhausted = true;

      const closed = await prisma.tender.updateMany({
        where: { sourcePortal: portal.host, authorityId, status: "OPEN_FOR_BIDS", bidSubmissionEnd: { lt: now } },
        data: { status: "BID_CLOSED", statusChangedAt: now },
      });
      out.closed += closed.count;
      opts.log(`${portal.host}: ${e.org.org} — ${listed.length} listed, ${done} pages read, ${pending} left for next run`);
    } catch (err) {
      out.failures.push({ district: e.district.slug, error: err instanceof Error ? err.message : String(err) });
      opts.log(`${portal.host}: ${e.org.org} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export async function collectGepnicTenders(
  districts: CollectorDistrict[],
  opts: { deadlineMs: number; log: (m: string) => void; maxDetailsPerPortal?: number },
): Promise<TendersRunResult> {
  const out: TendersRunResult = {
    attempted: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    closed: 0,
    pending: 0,
    notCovered: [],
    failures: [],
    changedSlugs: [],
    budgetExhausted: false,
    perDistrict: {},
  };
  const byPortal = new Map<string, { portal: GepnicPortal; entries: Entry[] }>();
  for (const d of districts) {
    const portal = GEPNIC_PORTALS[d.stateSlug];
    const orgs = GEPNIC_ORGS[d.slug];
    if (!portal || !orgs) {
      out.notCovered.push(d.slug);
      continue;
    }
    const slot = byPortal.get(portal.host) ?? { portal, entries: [] };
    for (const org of orgs) slot.entries.push({ district: d, org });
    byPortal.set(portal.host, slot);
  }
  await Promise.all(
    Array.from(byPortal.values(), ({ portal, entries }) =>
      runPortal(portal, entries, out, { ...opts, maxDetails: opts.maxDetailsPerPortal ?? 80 }),
    ),
  );
  return out;
}
