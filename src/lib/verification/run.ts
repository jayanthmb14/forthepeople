/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Data verification — one run of every verifier (server only)
//
// Called by GET /api/cron/verify-data (daily). Order and time caps:
//   freshness  (database only)            ≤ 40 s
//   leaders    (Wikipedia, Wikidata)      ≤ 70 s
//   weather    (Open-Meteo / OpenWeather) ≤ 40 s
//   dams       (Karnataka WRD portal)     ≤ 25 s
//   mandi      (CEDA mirror)              ≤ 60 s
// never past the run's overall deadline (the route gives 240 s). A
// verifier that throws is reported and the others still run. Then:
// review items → rows (with the review item ids) → prune old rows →
// one admin alert when new review items were created.
// ═══════════════════════════════════════════════════════════
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { sendAdminAlert } from "@/lib/admin-alerts";
import { errText } from "./http";
import { pruneVerifications, queueReviews, writeRecords } from "./store";
import type { DistrictRef, RowStatus, VerifierOutput, VerifyContext } from "./types";
import { verifyDams } from "./verify-dams";
import { verifyFreshness } from "./verify-freshness";
import { verifyLeaders } from "./verify-leaders";
import { verifyMandi } from "./verify-mandi";
import { verifyWeather } from "./verify-weather";

export const VERIFIERS = {
  freshness: { run: verifyFreshness, capMs: 40_000 },
  leaders: { run: verifyLeaders, capMs: 70_000 },
  weather: { run: verifyWeather, capMs: 40_000 },
  dams: { run: verifyDams, capMs: 25_000 },
  mandi: { run: verifyMandi, capMs: 60_000 },
} as const;

export type VerifierName = keyof typeof VERIFIERS;
export const VERIFIER_NAMES = Object.keys(VERIFIERS) as VerifierName[];

export interface RunReport {
  runId: string;
  districts: number;
  written: number;
  byStatus: Partial<Record<RowStatus, number>>;
  reviewsCreated: number;
  reviewsExisting: number;
  reviewsDropped: number;
  pruned: number;
  errors: string[];
  verifiers: Record<string, { records: number; errors: number; ms: number; failed?: string }>;
}

export async function runVerification(opts: {
  deadlineMs: number;
  only?: VerifierName[];
  districtSlugs?: string[];
  log?: (m: string) => void;
}): Promise<RunReport> {
  const log = opts.log ?? ((m: string) => console.log(`[verify-data] ${m}`));
  const runId = `vr_${randomUUID()}`;
  const rows = await prisma.district.findMany({
    where: { active: true, ...(opts.districtSlugs?.length ? { slug: { in: opts.districtSlugs } } : {}) },
    select: { id: true, slug: true, name: true, stateId: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });
  const districts: DistrictRef[] = rows.map((d) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    stateId: d.stateId,
    stateSlug: d.state.slug,
    stateName: d.state.name,
  }));

  const report: RunReport = {
    runId,
    districts: districts.length,
    written: 0,
    byStatus: {},
    reviewsCreated: 0,
    reviewsExisting: 0,
    reviewsDropped: 0,
    pruned: 0,
    errors: [],
    verifiers: {},
  };
  const outputs: VerifierOutput[] = [];
  const names = opts.only?.length ? VERIFIER_NAMES.filter((n) => opts.only?.includes(n)) : VERIFIER_NAMES;

  for (const name of names) {
    const started = Date.now();
    if (started > opts.deadlineMs - 3_000) {
      report.errors.push(`${name}: not started (time budget used up)`);
      continue;
    }
    const ctx: VerifyContext = {
      districts,
      deadlineMs: Math.min(opts.deadlineMs, started + VERIFIERS[name].capMs),
      now: new Date(),
      log,
    };
    try {
      const out = await VERIFIERS[name].run(ctx);
      outputs.push(out);
      report.errors.push(...out.errors);
      report.verifiers[name] = { records: out.records.length, errors: out.errors.length, ms: Date.now() - started };
    } catch (err) {
      const msg = errText(err);
      report.errors.push(`${name}: ${msg}`);
      report.verifiers[name] = { records: 0, errors: 1, ms: Date.now() - started, failed: msg };
      log(`${name} failed: ${msg}`);
    }
  }

  const records = outputs.flatMap((o) => o.records);
  const reviews = outputs.flatMap((o) => o.reviews);

  if (reviews.length > 0) {
    try {
      const q = await queueReviews(reviews);
      report.reviewsCreated = q.created;
      report.reviewsExisting = q.existing;
      report.reviewsDropped = q.dropped;
      for (const r of records) r.reviewItemId = q.ids.get(r.datasetKey) ?? null;
    } catch (err) {
      report.errors.push(`review queue: ${errText(err)}`);
    }
  }

  report.written = await writeRecords(runId, records);
  for (const r of records) report.byStatus[r.status] = (report.byStatus[r.status] ?? 0) + 1;

  try {
    report.pruned = await pruneVerifications();
  } catch (err) {
    report.errors.push(`prune: ${errText(err)}`);
  }

  if (report.reviewsCreated > 0) {
    await sendAdminAlert({
      level: "warning",
      title: `Data check: ${report.reviewsCreated} new item${report.reviewsCreated === 1 ? "" : "s"} to review`,
      message:
        "The daily data check found figures that do not match other sources (or names that are placeholders). " +
        "Nothing was changed. The items are in the review queue (NewsActionQueue, dataType verify-leaders).",
      module: "verification",
      details: {
        run: runId,
        disagreements: report.byStatus.disagreement ?? 0,
        placeholders: report.byStatus.placeholder ?? 0,
        missing: report.byStatus.missing ?? 0,
      },
    }).catch(() => false);
  }

  log(`run ${runId}: ${report.written} rows, ${JSON.stringify(report.byStatus)}, ${report.reviewsCreated} new review items, ${report.errors.length} errors`);
  return report;
}
