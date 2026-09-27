/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Data verification — shared types (pure; no DB, no network)
//
// A verifier compares something we SHOW (a stored row) with one or more
// OTHER sources and produces VerificationRecords. The cron writes them to
// the DataVerification table; /api/data/verification summarises them per
// dataset for the "Check this data" panel. See docs/VERIFICATION.md.
// ═══════════════════════════════════════════════════════════

/** Dataset keys — the same keys as src/lib/freshness.ts DATASETS, so the panel can join them. */
export type VerifiedDataset = "weather" | "mandi" | "dams" | "leaders" | "news" | "alerts" | "projects" | "exams";

/** The datasets that have a cross-source check (the rest only get a freshness check). */
export const CROSS_CHECKED_DATASETS: readonly VerifiedDataset[] = ["weather", "mandi", "dams", "leaders"];

/**
 * What kind of check a row is.
 *  cross-source    stored value vs one or more other sources
 *  source-recheck  stored value vs a fresh read of the SAME publisher (catches copy errors, not wrong facts)
 *  freshness       is the newest row as new as the dataset's rule expects?
 *  placeholder     a name field that holds "[Verify at …]", "[Name Not Available]", "SP, Mysuru Rural" …
 *  coverage        a state-level office we should show but do not (e.g. no Chief Minister row)
 */
export type CheckKind = "cross-source" | "source-recheck" | "freshness" | "placeholder" | "coverage";

/**
 * Row status.
 *  verified       at least two independent sources (counting the one we show) agree
 *  single-source  only one source could be consulted, or the second one is the same publisher
 *  disagreement   a source that answered gives a different value (outside the tolerance)
 *  unchecked      could not compare (source down, no overlapping date, stored value too old …)
 *  fresh / stale  freshness checks only
 *  placeholder    placeholder checks only
 *  missing        coverage checks only
 */
export type RowStatus =
  | "verified"
  | "single-source"
  | "disagreement"
  | "unchecked"
  | "fresh"
  | "stale"
  | "placeholder"
  | "missing";

/** The four statuses the public summary reports per dataset. */
export type PublicStatus = "verified" | "single-source" | "disagreement" | "unchecked";

/**
 * Machine reason codes (the UI translates them; English notes are for the admin only).
 * Keep this list in sync with docs/VERIFICATION.md.
 */
export type ReasonCode =
  | "sources-agree"
  | "sources-disagree"
  | "second-source-no-data"
  | "second-source-failed"
  | "no-second-source"
  | "same-publisher"
  | "stored-too-old"
  | "stored-older-than-source"
  | "source-older-than-stored"
  | "times-too-far-apart"
  | "no-stored-data"
  | "not-in-second-source"
  | "late"
  | "on-time"
  | "no-date"
  | "not-collected"
  | "name-placeholder"
  | "office-missing";

/** One outside source consulted for a check. */
export interface SourceCheck {
  /** Display name, e.g. "Wikipedia", "Open-Meteo", "Karnataka Water Resources Department (re-read)". */
  source: string;
  /** What that source says, as text ("27.4 °C", "D. K. Shivakumar"); null when it had no answer. */
  value: string | null;
  /** true = matches what we show; false = does not; null = could not compare. */
  agreed: boolean | null;
  /** false when this source is the same publisher as the value we show (a re-read, not a second source). */
  independent: boolean;
  url?: string | null;
  /** ISO date/time the source's value is for (reading time, "since" date). */
  asOf?: string | null;
}

/** One check result, ready to be written as a DataVerification row. */
export interface VerificationRecord {
  datasetKey: string;
  dataset: VerifiedDataset;
  kind: CheckKind;
  stateSlug: string | null;
  districtSlug: string | null;
  entityType?: string | null;
  entityId?: string | null;
  dataDate?: Date | null;
  primarySource: string;
  primaryValue: string | null;
  sources: SourceCheck[];
  agreed: boolean | null;
  tolerance?: string | null;
  status: RowStatus;
  reason: ReasonCode | null;
  notes?: string | null;
  /** Filled in by the store when a review item was written for this row. */
  reviewItemId?: string | null;
}

/** One entry of the public summary: { dataset, checks, status } plus a few extras the panel may use. */
export interface DatasetVerificationSummary {
  dataset: string;
  status: PublicStatus;
  checks: Array<{
    source: string;
    /** "shown" = the source of what we display; "check" = a source we compared it with. */
    role: "shown" | "check";
    agreed: boolean | null;
    independent: boolean;
    checkedAt: string;
  }>;
  lastCheckedAt: string | null;
  /** Newest data date among the checked rows (ISO), if known. */
  dataDate: string | null;
  /** From the freshness check: true = older than the dataset's rule allows; null = not checked. */
  stale: boolean | null;
  counts: {
    verified: number;
    singleSource: number;
    disagreement: number;
    unchecked: number;
    placeholder: number;
    missing: number;
  };
  /** Distinct reason codes behind the status (for the panel's one-line explanation). */
  reasons: ReasonCode[];
}

/** The subset of a DataVerification row the summary needs (keeps summary.ts free of Prisma types). */
export interface StoredCheckRow {
  datasetKey: string;
  dataset: string;
  kind: string;
  status: string;
  reason: string | null;
  primarySource: string;
  agreed: boolean | null;
  sources: unknown;
  secondarySource: string | null;
  dataDate: Date | null;
  checkedAt: Date;
}

/** An active district, as the verifiers need it. */
export interface DistrictRef {
  id: string;
  slug: string;
  name: string;
  stateId: string;
  stateSlug: string;
  stateName: string;
}

/**
 * A request for a human to look at something (written to NewsActionQueue,
 * the admin review queue). Never applied automatically.
 */
export interface ReviewRequest {
  districtId: string;
  /** NewsActionQueue.dataType, e.g. "verify-leaders". */
  dataType: string;
  /** One line for the admin (≤ 300 chars); also the de-duplication key. */
  headline: string;
  sourceUrl: string;
  /** 0.9 when two outside sources agree with each other against us; 0.5 otherwise. */
  confidence: number;
  data: Record<string, unknown>;
  /** datasetKeys of the records this item is about (they get its id in reviewItemId). */
  recordKeys: string[];
}

/** What one verifier returns. */
export interface VerifierOutput {
  records: VerificationRecord[];
  reviews: ReviewRequest[];
  /** Short failure notes ("wikidata: timeout"); a verifier that fails completely throws instead. */
  errors: string[];
}

/** Shared inputs of every verifier. */
export interface VerifyContext {
  districts: DistrictRef[];
  /** Epoch ms; no new request starts after it. */
  deadlineMs: number;
  now: Date;
  log: (msg: string) => void;
}
