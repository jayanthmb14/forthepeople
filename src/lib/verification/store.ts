/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Data verification — database reads and writes (server only)
//
// Writes happen only from the verify-data cron:
//   - DataVerification rows (history; pruned after 120 days);
//   - NewsActionQueue items (dataType "verify-leaders" …) for a human to
//     review — de-duplicated by headline while pending, or for 30 days
//     after a rejection. Nothing here ever edits the data being checked.
// Reads (the public summary) degrade to "table not ready" when
// `npm run db:push` has not created the table yet (Prisma P2021).
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import type { ReviewRequest, StoredCheckRow, VerificationRecord } from "./types";

const RETENTION_DAYS = 120;
const REJECTED_QUIET_DAYS = 30;

/** True for "the table does not exist" (Prisma P2021, or Postgres 42P01 through a raw query). */
export function isMissingTableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") return true;
    const meta = err.meta as { code?: unknown } | undefined;
    if (err.code === "P2010" && meta?.code === "42P01") return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /DataVerification.*does not exist|relation "DataVerification" does not exist/i.test(msg);
}

/** Whether the DataVerification table exists (false before db:push). Other errors propagate. */
export async function verificationTableReady(): Promise<boolean> {
  try {
    await prisma.dataVerification.findFirst({ select: { id: true } });
    return true;
  } catch (err) {
    if (isMissingTableError(err)) return false;
    throw err;
  }
}

/**
 * Write review items. Returns datasetKey → NewsActionQueue id (new or the
 * existing pending/recently rejected item with the same headline).
 */
export async function queueReviews(
  reviews: readonly ReviewRequest[],
  max = 25,
): Promise<{ ids: Map<string, string>; created: number; existing: number; dropped: number }> {
  const ids = new Map<string, string>();
  let created = 0;
  let existing = 0;
  let dropped = 0;
  const quietSince = new Date(Date.now() - REJECTED_QUIET_DAYS * 86_400_000);
  for (const r of reviews) {
    const headline = r.headline.slice(0, 300);
    const found = await prisma.newsActionQueue.findFirst({
      where: {
        dataType: r.dataType,
        headline,
        OR: [{ status: "pending" }, { status: "rejected", reviewedAt: { gte: quietSince } }],
      },
      select: { id: true },
    });
    let id = found?.id ?? null;
    if (found) existing++;
    else if (created >= max) {
      dropped++;
      continue;
    } else {
      const row = await prisma.newsActionQueue.create({
        data: {
          districtId: r.districtId,
          dataType: r.dataType,
          extractedData: r.data as Prisma.InputJsonValue,
          sourceUrl: r.sourceUrl.slice(0, 500),
          headline,
          confidence: r.confidence,
          status: "pending",
        },
        select: { id: true },
      });
      id = row.id;
      created++;
    }
    if (id) for (const k of r.recordKeys) ids.set(k, id);
  }
  return { ids, created, existing, dropped };
}

/** Write one run's rows. Returns how many were written. */
export async function writeRecords(runId: string, records: readonly VerificationRecord[]): Promise<number> {
  let written = 0;
  for (let i = 0; i < records.length; i += 200) {
    const chunk = records.slice(i, i + 200);
    const res = await prisma.dataVerification.createMany({
      data: chunk.map((r) => {
        const second = r.sources[0];
        return {
          runId,
          datasetKey: r.datasetKey.slice(0, 250),
          dataset: r.dataset,
          kind: r.kind,
          stateSlug: r.stateSlug,
          districtSlug: r.districtSlug,
          entityType: r.entityType ?? null,
          entityId: r.entityId ?? null,
          dataDate: r.dataDate ?? null,
          primarySource: r.primarySource.slice(0, 250),
          primaryValue: r.primaryValue,
          secondarySource: second?.source ?? null,
          secondaryValue: second?.value ?? null,
          sources: r.sources.length > 0 ? (r.sources as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          agreed: r.agreed,
          tolerance: r.tolerance ?? null,
          status: r.status,
          reason: r.reason,
          notes: r.notes ? r.notes.slice(0, 2000) : null,
          reviewItemId: r.reviewItemId ?? null,
        };
      }),
    });
    written += res.count;
  }
  return written;
}

/** Delete rows older than the retention window. */
export async function pruneVerifications(days = RETENTION_DAYS): Promise<number> {
  const res = await prisma.dataVerification.deleteMany({ where: { checkedAt: { lt: new Date(Date.now() - days * 86_400_000) } } });
  return res.count;
}

/**
 * Rows for one district and/or state from the last `sinceDays` days,
 * newest first. `available: false` when the table does not exist yet.
 */
export async function readVerificationRows(filter: {
  districtSlug?: string | null;
  stateSlug?: string | null;
  sinceDays?: number;
}): Promise<{ available: boolean; rows: StoredCheckRow[] }> {
  const since = new Date(Date.now() - (filter.sinceDays ?? 30) * 86_400_000);
  try {
    const rows = await prisma.dataVerification.findMany({
      where: {
        checkedAt: { gte: since },
        ...(filter.districtSlug ? { districtSlug: filter.districtSlug } : {}),
        ...(filter.stateSlug ? { stateSlug: filter.stateSlug } : {}),
      },
      orderBy: { checkedAt: "desc" },
      select: {
        datasetKey: true,
        dataset: true,
        kind: true,
        status: true,
        reason: true,
        primarySource: true,
        agreed: true,
        sources: true,
        secondarySource: true,
        dataDate: true,
        checkedAt: true,
      },
      take: 5000,
    });
    return { available: true, rows };
  } catch (err) {
    if (isMissingTableError(err)) return { available: false, rows: [] };
    throw err;
  }
}
