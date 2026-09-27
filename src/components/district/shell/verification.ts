/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Double-verification status per dataset — pure helpers for the
// verification panel ("Check this data"). No React, no database: safe to
// unit test (tests/district-verification.test.ts).
//
// Source: GET /api/data/verification?district=<slug>&state=<slug>, built by
// the verification work (v5.1). Expected rows:
//   { dataset, checks: [{ source, agreed, checkedAt }], status }
//   status: "verified" | "single-source" | "disagreement" | "unchecked"
// `dataset` is the dataset key used by /api/data/freshness
// (src/lib/freshness.ts DATASETS: "weather", "dams", "mandi", "budget", …);
// a module slug is accepted for a module's main dataset too.
//
// The panel feature-detects the API: a 404 / 500 / network error / a body it
// does not understand gives null, and the panel shows exactly what it
// showed before (dates and "how we get it" only).

export type VerificationStatus = "verified" | "single-source" | "disagreement" | "unchecked";

export interface VerificationCheck {
  source: string;
  agreed: boolean;
  checkedAt: string | null;
}

export interface DatasetVerification {
  dataset: string;
  checks: VerificationCheck[];
  status: VerificationStatus;
}

/** Dataset key (lower case) → its verification. */
export type VerificationMap = Record<string, DatasetVerification>;

const STATUSES: ReadonlySet<string> = new Set(["verified", "single-source", "disagreement", "unchecked"]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The row list, whether the API returns an array or wraps it. */
function rowsOf(json: unknown): unknown[] | null {
  if (Array.isArray(json)) return json;
  if (!isRecord(json)) return null;
  for (const k of ["datasets", "data", "verification"]) {
    const v = json[k];
    if (Array.isArray(v)) return v;
    if (isRecord(v) && Array.isArray(v.datasets)) return v.datasets;
  }
  return null;
}

function normaliseCheck(raw: unknown): VerificationCheck | null {
  if (!isRecord(raw)) return null;
  const source = typeof raw.source === "string" ? raw.source.trim() : "";
  if (!source) return null;
  const checkedAt =
    typeof raw.checkedAt === "string" && !Number.isNaN(new Date(raw.checkedAt).getTime()) ? raw.checkedAt : null;
  return { source, agreed: raw.agreed === true, checkedAt };
}

/**
 * Parse the API body. Returns null when it is not a verification payload
 * (so the panel falls back to its old behaviour), else a map by dataset key.
 */
export function normaliseVerification(json: unknown): VerificationMap | null {
  const rows = rowsOf(json);
  if (!rows) return null;
  const out: VerificationMap = {};
  for (const raw of rows) {
    if (!isRecord(raw)) continue;
    const dataset = typeof raw.dataset === "string" ? raw.dataset.trim() : "";
    if (!dataset) continue;
    const checks = Array.isArray(raw.checks)
      ? raw.checks.map(normaliseCheck).filter((c): c is VerificationCheck => c !== null)
      : [];
    const status = typeof raw.status === "string" && STATUSES.has(raw.status) ? (raw.status as VerificationStatus) : "unchecked";
    out[dataset.toLowerCase()] = { dataset, checks, status };
  }
  return out;
}

/** The verification for one dataset of the freshness list, if any. */
export function verificationFor(
  map: VerificationMap | null,
  d: { key: string; module: string; primary: boolean },
): DatasetVerification | null {
  if (!map) return null;
  return map[d.key.toLowerCase()] ?? (d.primary ? (map[d.module.toLowerCase()] ?? null) : null);
}

/** Newest check date among a dataset's checks (ISO), or null. */
export function newestCheck(v: DatasetVerification): string | null {
  let best: string | null = null;
  for (const c of v.checks) {
    if (c.checkedAt && (!best || new Date(c.checkedAt).getTime() > new Date(best).getTime())) best = c.checkedAt;
  }
  return best;
}

/** How many datasets are in each status. */
export function summariseVerification(list: ReadonlyArray<DatasetVerification | null>): Record<VerificationStatus, number> {
  const out: Record<VerificationStatus, number> = { verified: 0, "single-source": 0, disagreement: 0, unchecked: 0 };
  for (const v of list) if (v) out[v.status] += 1;
  return out;
}
