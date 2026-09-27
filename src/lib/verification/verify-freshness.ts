/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Verifier: freshness — is each dataset as new as it should be?
//
// Uses the same counts and dates as the pages (collectDatasetDates) and
// the same rules as the stale notice (src/lib/freshness.ts →
// judgeDataset/ruleFor), so "stale" here means exactly what the page's
// amber notice says. One row per district per dataset below:
//   fresh     newer than the dataset's maximum age
//   stale     older (reason "late")
//   unchecked no date published (reason "no-date") or nothing collected
//             for this district (reason "not-collected")
// No network; one aggregate query set per district.
// ═══════════════════════════════════════════════════════════
import { collectDatasetDates } from "@/lib/dataset-dates";
import { judgeDataset, ruleFor } from "@/lib/freshness";
import type { ReasonCode, RowStatus, VerifiedDataset, VerifierOutput, VerifyContext } from "./types";
import { fmtDay } from "./compare";

/** dataset (freshness key) → key in collectDatasetDates(). */
export const FRESHNESS_TARGETS: ReadonlyArray<{ dataset: VerifiedDataset; datesKey: string }> = [
  { dataset: "weather", datesKey: "weather" },
  { dataset: "mandi", datesKey: "crops" },
  { dataset: "dams", datesKey: "dams" },
  { dataset: "leaders", datesKey: "leaders" },
  { dataset: "news", datesKey: "news" },
  { dataset: "alerts", datesKey: "alerts" },
  { dataset: "projects", datesKey: "infrastructure" },
  { dataset: "exams", datesKey: "exams" },
];

/** A freshness judgement → row status + reason (pure). */
export function freshnessVerdict(status: ReturnType<typeof judgeDataset>["status"]): { status: RowStatus; reason: ReasonCode } {
  switch (status) {
    case "current":
    case "reference":
      return { status: "fresh", reason: "on-time" };
    case "late":
      return { status: "stale", reason: "late" };
    case "unknown":
      return { status: "unchecked", reason: "no-date" };
    case "not_collected":
      return { status: "unchecked", reason: "not-collected" };
  }
}

export async function verifyFreshness(ctx: VerifyContext): Promise<VerifierOutput> {
  const out: VerifierOutput = { records: [], reviews: [], errors: [] };
  for (const d of ctx.districts) {
    if (Date.now() > ctx.deadlineMs - 2_000) {
      out.errors.push("freshness: time budget used up");
      break;
    }
    const dates = await collectDatasetDates(d.id, d.stateId);
    for (const t of FRESHNESS_TARGETS) {
      const info = dates[t.datesKey];
      if (!info) continue;
      const dataDate = info.newest ? new Date(info.newest) : null;
      const rule = ruleFor(t.dataset);
      const j = judgeDataset({ rows: info.rows, dataDate, rule, now: ctx.now });
      const v = freshnessVerdict(j.status);
      out.records.push({
        datasetKey: `freshness:${t.dataset}:${d.slug}`,
        dataset: t.dataset,
        kind: "freshness",
        stateSlug: d.stateSlug,
        districtSlug: d.slug,
        entityType: null,
        entityId: null,
        dataDate,
        primarySource: "our database",
        primaryValue: dataDate ? fmtDay(dataDate) : null,
        sources: [],
        agreed: null,
        tolerance: rule.maxAgeHours === null ? null : `≤ ${rule.maxAgeHours >= 48 ? `${Math.round(rule.maxAgeHours / 24)} days` : `${rule.maxAgeHours} h`}`,
        status: v.status,
        reason: v.reason,
        notes:
          j.status === "late"
            ? `${info.rows} rows; newest ${fmtDay(dataDate)} — ${j.ageDays} days old, ${j.lateByDays} days late.`
            : `${info.rows} rows; newest ${dataDate ? fmtDay(dataDate) : "undated"}.`,
      });
    }
  }
  const stale = out.records.filter((r) => r.status === "stale");
  ctx.log(`freshness: ${out.records.length} checks, ${stale.length} stale`);
  return out;
}
