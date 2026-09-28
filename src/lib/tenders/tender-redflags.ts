// Deterministic, SQL-based red-flag computation.
// Every flag is a mathematical observation, not an adjective. Runtime
// output is written to TenderRedFlag with a factualStatement + referenceRule.
// NEVER involves an LLM.

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { NOT_STUB_TENDER } from "@/lib/data-filters";

type FlagRow = {
  tenderId: string;
  flagType: string;
  factualStatement: string;
  referenceRule: string | null;
  computedValue: Record<string, unknown>;
};

// ── Compute all flags for one tender ──────────────────────────────────────
export async function computeFlagsForTender(tenderId: string): Promise<FlagRow[]> {
  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    include: { awards: true, authority: { select: { id: true } } },
  });
  if (!tender) return [];
  const flags: FlagRow[] = [];

  // 1. SHORT_WINDOW — (closing − published) < 21 days (GFR Rule 173)
  const windowDays = (tender.bidSubmissionEnd.getTime() - tender.publishedAt.getTime()) / 86400_000;
  if (windowDays >= 0 && windowDays < 21) {
    flags.push({
      tenderId,
      flagType: "SHORT_WINDOW",
      factualStatement: `Publish → closing: ${windowDays.toFixed(1)} days. GFR Rule 173 minimum for open tenders: 21 days.`,
      referenceRule: "GFR_173_MIN_21_DAYS",
      computedValue: { actualDays: Number(windowDays.toFixed(2)), baseline: 21 },
    });
  }

  // 2. PRICE_HIT_RATE — winning bid > 98% of estimated value
  if (tender.awards.length > 0 && tender.estimatedValueInr && tender.estimatedValueInr > BigInt(0)) {
    for (const a of tender.awards) {
      const hitRate = Number(a.awardedAmountInr) * 100 / Number(tender.estimatedValueInr);
      if (hitRate > 98) {
        flags.push({
          tenderId,
          flagType: "PRICE_HIT_RATE",
          factualStatement: `Winning bid is ${hitRate.toFixed(1)}% of estimated value.`,
          referenceRule: "CVC_HIGH_HIT_RATE",
          computedValue: { hitRate: Number(hitRate.toFixed(2)), baseline: 98 },
        });
        break;
      }
    }
  }

  // 3. SINGLE_BIDDER — awards present but bidders array size <= 1
  if (tender.status === "AWARDED" || tender.awards.length > 0) {
    const bidderCount = await prisma.tenderBidder.count({ where: { tenderId } });
    if (bidderCount > 0 && bidderCount === 1) {
      // Baseline: median bidder count across same category in last 12 months
      const baselineRows = await prisma.tender.findMany({
        where: {
          categoryId: tender.categoryId,
          id: { not: tenderId },
          publishedAt: { gte: new Date(Date.now() - 365 * 86400_000) },
          // Seeded placeholders are not peers (data-filters.ts).
          ...NOT_STUB_TENDER,
        },
        select: { _count: { select: { bidders: true } } },
      });
      const counts = baselineRows.map((r) => r._count.bidders).filter((c) => c > 0).sort((a, b) => a - b);
      const median = counts.length > 0 ? counts[Math.floor(counts.length / 2)] : null;
      flags.push({
        tenderId,
        flagType: "SINGLE_BIDDER",
        factualStatement: median
          ? `1 bid received. Median for similar tenders in this category: ${median}.`
          : `1 bid received.`,
        referenceRule: "CVC_SINGLE_BIDDER",
        computedValue: { actual: 1, medianBaseline: median },
      });
    }
  }

  // 4. REPEAT_WINNER — same winner > 3 times from this authority in last 24 months
  if (tender.awards.length > 0) {
    for (const a of tender.awards) {
      const priorCount = await prisma.tenderAward.count({
        where: {
          tender: { authorityId: tender.authorityId },
          winnerName: a.winnerName,
          awardedAt: { gte: new Date(Date.now() - 730 * 86400_000) },
          id: { not: a.id },
        },
      });
      const totalFromBuyer = await prisma.tenderAward.count({
        where: { tender: { authorityId: tender.authorityId }, awardedAt: { gte: new Date(Date.now() - 730 * 86400_000) } },
      });
      if (priorCount >= 3 && totalFromBuyer > 0) {
        flags.push({
          tenderId,
          flagType: "REPEAT_WINNER",
          factualStatement: `Vendor has won ${priorCount + 1} of the last ${totalFromBuyer + 1} awards from this buyer.`,
          referenceRule: "CVC_REPEAT_VENDOR",
          computedValue: { winnerName: a.winnerName, priorWins: priorCount, totalFromBuyer },
        });
        break;
      }
    }
  }

  // 5. RESTRICTIVE_TURNOVER — declared min turnover > 85th percentile of similar
  const elig = tender.eligibility as { minAnnualTurnoverInr?: number } | null;
  if (elig?.minAnnualTurnoverInr && tender.categoryId) {
    const peers = await prisma.tender.findMany({
      where: {
        categoryId: tender.categoryId,
        id: { not: tenderId },
        publishedAt: { gte: new Date(Date.now() - 365 * 86400_000) },
        ...NOT_STUB_TENDER,
      },
      select: { eligibility: true },
    });
    const peerTurnovers = peers
      .map((p) => (p.eligibility as { minAnnualTurnoverInr?: number } | null)?.minAnnualTurnoverInr)
      .filter((v): v is number => typeof v === "number" && v > 0)
      .sort((a, b) => a - b);
    if (peerTurnovers.length >= 5) {
      const p85 = peerTurnovers[Math.floor(peerTurnovers.length * 0.85)];
      if (elig.minAnnualTurnoverInr > p85) {
        flags.push({
          tenderId,
          flagType: "RESTRICTIVE_TURNOVER",
          factualStatement: `Required turnover exceeds 85th percentile for similar tenders in this category.`,
          referenceRule: "CVC_RESTRICTIVE_ELIGIBILITY",
          computedValue: { required: elig.minAnnualTurnoverInr, percentile85: p85, sampleSize: peerTurnovers.length },
        });
      }
    }
  }

  // 6. RETENDERED — same authority + title substring within 180 days, earlier cancelled
  if (tender.status !== "CANCELLED") {
    const prior = await prisma.tender.findFirst({
      where: {
        authorityId: tender.authorityId,
        status: "CANCELLED",
        id: { not: tenderId },
        publishedAt: { gte: new Date(Date.now() - 180 * 86400_000) },
        ...NOT_STUB_TENDER,
        title: { contains: tender.title.split(" ").slice(0, 3).join(" "), mode: "insensitive" },
      },
      select: { id: true, statusChangedAt: true },
    });
    if (prior) {
      flags.push({
        tenderId,
        flagType: "RETENDERED",
        factualStatement: `Re-tendered after earlier cancellation dated ${prior.statusChangedAt.toLocaleDateString("en-IN")}.`,
        referenceRule: null,
        computedValue: { priorTenderId: prior.id, priorStatusChangedAt: prior.statusChangedAt.toISOString() },
      });
    }
  }

  // 7. DIRECT_NOMINATION — procurementType is SINGLE
  if (tender.procurementType === "SINGLE") {
    flags.push({
      tenderId,
      flagType: "DIRECT_NOMINATION",
      factualStatement: `Awarded via nomination; no open tender.`,
      referenceRule: "GFR_194_SINGLE_SOURCE",
      computedValue: { procurementType: "SINGLE" },
    });
  }

  return flags;
}

/**
 * True once the red-flag computer has written any flag. Until then a
 * "flagged" count of 0 would mean "never checked", not "nothing found", so
 * the tender pages say "not checked yet" instead (Sept 2026: no job runs
 * recomputeAllFlags; the only caller is the manual
 * scripts/tenders-redflags.ts).
 */
export async function redFlagsComputed(): Promise<boolean> {
  return (await prisma.tenderRedFlag.findFirst({ select: { id: true } })) !== null;
}

// ── Batch: compute + persist for all tenders needing (re)computation ──────
export async function recomputeAllFlags(options: { limit?: number } = {}): Promise<{ processed: number; written: number }> {
  // Target: published tenders with published/closing window in last 180 days
  const tenders = await prisma.tender.findMany({
    where: { publishedAt: { gte: new Date(Date.now() - 180 * 86400_000) }, ...NOT_STUB_TENDER },
    select: { id: true },
    take: options.limit ?? 500,
    orderBy: { publishedAt: "desc" },
  });

  let written = 0;
  for (const { id } of tenders) {
    const flags = await computeFlagsForTender(id);
    // Replace the tender's current flags wholesale so no stale ones linger.
    await prisma.tenderRedFlag.deleteMany({ where: { tenderId: id } });
    for (const f of flags) {
      await prisma.tenderRedFlag.create({
        data: {
          tenderId: id,
          flagType: f.flagType,
          factualStatement: f.factualStatement,
          referenceRule: f.referenceRule,
          computedValue: f.computedValue as Prisma.InputJsonValue,
        },
      });
      written++;
    }
  }
  return { processed: tenders.length, written };
}
