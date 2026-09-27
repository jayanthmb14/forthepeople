/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// DataVerification rows → one summary per dataset (pure)
//
// Used by GET /api/data/verification. Only the newest row per datasetKey
// counts, and within a dataset only rows from the newest run (36 h
// window), so a crop that dropped off the page does not linger.
//
// Dataset status (cross-source and source-recheck rows only):
//   any "disagreement"                     → disagreement
//   every compared row "verified"          → verified
//   something compared, not all verified   → single-source
//   nothing compared                       → unchecked
// Placeholders, missing offices and staleness are reported alongside
// (counts, stale, reasons) — they do not change what the sources said.
// ═══════════════════════════════════════════════════════════
import {
  CROSS_CHECKED_DATASETS,
  type DatasetVerificationSummary,
  type PublicStatus,
  type ReasonCode,
  type SourceCheck,
  type StoredCheckRow,
} from "./types";

const WINDOW_MS = 36 * 3600_000;
const CROSS_KINDS = new Set(["cross-source", "source-recheck"]);

/** Reasons in the order the panel should mention them (most important first). */
const REASON_ORDER: ReasonCode[] = [
  "sources-disagree",
  "sources-split",
  "office-missing",
  "name-placeholder",
  "late",
  "stored-older-than-source",
  "stored-too-old",
  "second-source-failed",
  "second-source-no-data",
  "not-in-second-source",
  "times-too-far-apart",
  "source-older-than-stored",
  "same-publisher",
  "no-second-source",
  "no-stored-data",
  "no-date",
  "not-collected",
  "sources-agree",
  "on-time",
];

/** Newest row per datasetKey. */
export function latestPerKey(rows: readonly StoredCheckRow[]): StoredCheckRow[] {
  const sorted = [...rows].sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());
  const seen = new Set<string>();
  return sorted.filter((r) => {
    if (seen.has(r.datasetKey)) return false;
    seen.add(r.datasetKey);
    return true;
  });
}

/** The outside checks stored on a row (the `sources` JSON), tolerating old or odd shapes. */
export function rowSources(row: StoredCheckRow): SourceCheck[] {
  const s = row.sources;
  if (!Array.isArray(s)) return [];
  return s
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object" && typeof (x as { source?: unknown }).source === "string")
    .map((x) => ({
      source: String(x.source),
      value: typeof x.value === "string" ? x.value : null,
      agreed: typeof x.agreed === "boolean" ? x.agreed : null,
      independent: x.independent !== false,
      url: typeof x.url === "string" ? x.url : null,
      asOf: typeof x.asOf === "string" ? x.asOf : null,
    }));
}

/** AND over known answers: false if any false, true if ≥ 1 true and none false, null if none known. */
function combine(values: Array<boolean | null>): boolean | null {
  if (values.some((v) => v === false)) return false;
  return values.some((v) => v === true) ? true : null;
}

function datasetStatus(cross: readonly StoredCheckRow[]): PublicStatus {
  const compared = cross.filter((r) => r.status !== "unchecked");
  if (compared.length === 0) return "unchecked";
  if (compared.some((r) => r.status === "disagreement")) return "disagreement";
  if (compared.every((r) => r.status === "verified")) return "verified";
  return "single-source";
}

/** A summary for a dataset nobody has checked yet (or when the table does not exist). */
export function uncheckedSummary(dataset: string): DatasetVerificationSummary {
  return {
    dataset,
    status: "unchecked",
    checks: [],
    lastCheckedAt: null,
    dataDate: null,
    stale: null,
    counts: { verified: 0, singleSource: 0, disagreement: 0, unchecked: 0, placeholder: 0, missing: 0 },
    reasons: [],
  };
}

/** Summaries for every cross-checked dataset, all "unchecked". */
export function uncheckedSummaries(): DatasetVerificationSummary[] {
  return CROSS_CHECKED_DATASETS.map(uncheckedSummary);
}

/**
 * Summarise stored rows (for one district or one state) per dataset. The
 * cross-checked datasets are always present (as "unchecked" when no row
 * exists); freshness-only datasets appear when they have rows.
 */
export function summarise(rows: readonly StoredCheckRow[]): DatasetVerificationSummary[] {
  const latest = latestPerKey(rows);
  const byDataset = new Map<string, StoredCheckRow[]>();
  for (const r of latest) byDataset.set(r.dataset, [...(byDataset.get(r.dataset) ?? []), r]);

  const names = [...new Set<string>([...CROSS_CHECKED_DATASETS, ...byDataset.keys()])];
  return names.map((dataset) => {
    const all = byDataset.get(dataset) ?? [];
    if (all.length === 0) return uncheckedSummary(dataset);
    const newest = Math.max(...all.map((r) => r.checkedAt.getTime()));
    const rowsNow = all.filter((r) => r.checkedAt.getTime() >= newest - WINDOW_MS);

    const cross = rowsNow.filter((r) => CROSS_KINDS.has(r.kind));
    const fresh = rowsNow.filter((r) => r.kind === "freshness" && (r.status === "fresh" || r.status === "stale"));

    // Checks: the source we show (when there are only one or two of them — a
    // feed), then every outside source, each with its combined answer.
    const checks: DatasetVerificationSummary["checks"] = [];
    const shownSources = [...new Set(cross.map((r) => r.primarySource))];
    if (shownSources.length > 0 && shownSources.length <= 2) {
      for (const s of shownSources) {
        const own = cross.filter((r) => r.primarySource === s);
        checks.push({
          source: s,
          role: "shown",
          agreed: combine(own.map((r) => r.agreed)),
          independent: true,
          checkedAt: new Date(Math.max(...own.map((r) => r.checkedAt.getTime()))).toISOString(),
        });
      }
    }
    const outside = new Map<string, { agreed: Array<boolean | null>; independent: boolean; at: number }>();
    for (const r of cross) {
      const srcs = rowSources(r);
      const list = srcs.length > 0 ? srcs : r.secondarySource ? [{ source: r.secondarySource, agreed: r.agreed, independent: true } as SourceCheck] : [];
      for (const s of list) {
        const e = outside.get(s.source) ?? { agreed: [], independent: s.independent, at: 0 };
        e.agreed.push(s.agreed);
        e.independent = e.independent && s.independent;
        e.at = Math.max(e.at, r.checkedAt.getTime());
        outside.set(s.source, e);
      }
    }
    for (const [source, e] of outside) {
      checks.push({ source, role: "check", agreed: combine(e.agreed), independent: e.independent, checkedAt: new Date(e.at).toISOString() });
    }

    const count = (pred: (r: StoredCheckRow) => boolean) => rowsNow.filter(pred).length;
    const reasons = new Set<ReasonCode>();
    const status = datasetStatus(cross);
    for (const r of rowsNow) {
      if (!r.reason) continue;
      if (r.kind === "freshness" && r.status !== "stale") continue;
      if (CROSS_KINDS.has(r.kind) && status === "disagreement" && r.status !== "disagreement") continue;
      reasons.add(r.reason as ReasonCode);
    }
    const dates = rowsNow.map((r) => r.dataDate?.getTime() ?? 0).filter((t) => t > 0);

    return {
      dataset,
      status,
      checks,
      lastCheckedAt: new Date(newest).toISOString(),
      dataDate: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
      stale: fresh.length === 0 ? null : fresh.some((r) => r.status === "stale"),
      counts: {
        verified: count((r) => CROSS_KINDS.has(r.kind) && r.status === "verified"),
        singleSource: count((r) => CROSS_KINDS.has(r.kind) && r.status === "single-source"),
        disagreement: count((r) => CROSS_KINDS.has(r.kind) && r.status === "disagreement"),
        unchecked: count((r) => CROSS_KINDS.has(r.kind) && r.status === "unchecked"),
        placeholder: count((r) => r.kind === "placeholder"),
        missing: count((r) => r.kind === "coverage"),
      },
      reasons: REASON_ORDER.filter((c) => reasons.has(c)),
    };
  });
}
