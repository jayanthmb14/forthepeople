/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Verifier: dams — the % full we show vs the source, read again now
//
// For every dam a district shows (its newest reading per dam name):
//   - Karnataka: re-read the Water Resources Department portal (one
//     download for all districts) and compare the same day's % full
//     (±2 points). Same publisher → "single-source" at best; a newer day
//     on the portal means our copy is behind ("stored-older-than-source").
//   - Other states: no second source yet → "single-source" /
//     "no-second-source".
// See dams-check.ts for the sources that were tried and why.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { KARNATAKA_DAM_SOURCE } from "@/scraper/jobs/dams";
import { decideStatus, fmtNumber, DAM_TOLERANCE_POINTS } from "./compare";
import { findSameDam, parseKarnatakaReservoirs, recheckDam, type PortalReservoir } from "./dams-check";
import { errText, politeFetch } from "./http";
import type { VerifierOutput, VerifyContext } from "./types";

const KARNATAKA_PORTAL = "https://water.karnataka.gov.in/CommonXyZABC.aspx/GetReservoirLocs";
const KARNATAKA_PUBLIC_PAGE = "https://water.karnataka.gov.in/ReservoirPublic";

async function loadKarnataka(deadlineMs: number): Promise<PortalReservoir[]> {
  const res = await politeFetch(KARNATAKA_PORTAL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Referer: KARNATAKA_PUBLIC_PAGE },
    body: "{}",
    timeoutMs: 20_000,
    deadlineMs,
  });
  if (!res.ok) throw new Error(`Karnataka water portal HTTP ${res.status}`);
  const list = parseKarnatakaReservoirs(await res.json());
  if (list.length === 0) throw new Error("Karnataka water portal reply had no reservoirs");
  return list;
}

export async function verifyDams(ctx: VerifyContext): Promise<VerifierOutput> {
  const out: VerifierOutput = { records: [], reviews: [], errors: [] };
  const rows = await prisma.damReading.findMany({
    where: { districtId: { in: ctx.districts.map((d) => d.id) } },
    orderBy: { recordedAt: "desc" },
    select: { id: true, districtId: true, damName: true, storagePct: true, recordedAt: true, source: true },
    take: 500,
  });
  // Newest reading per district + dam name.
  const newest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const k = `${r.districtId}|${r.damName}`;
    if (!newest.has(k)) newest.set(k, r);
  }
  if (newest.size === 0) {
    ctx.log("dams: no stored readings");
    return out;
  }

  const needsKarnataka = [...newest.values()].some((r) => ctx.districts.find((d) => d.id === r.districtId)?.stateSlug === "karnataka");
  let karnataka: PortalReservoir[] | null = null;
  let karnatakaError: string | null = null;
  if (needsKarnataka) {
    try {
      karnataka = await loadKarnataka(ctx.deadlineMs);
    } catch (err) {
      karnatakaError = errText(err);
      out.errors.push(`dams/karnataka-portal: ${karnatakaError}`);
    }
  }

  for (const r of newest.values()) {
    const d = ctx.districts.find((x) => x.id === r.districtId);
    if (!d) continue;
    const key = `dams:${d.slug}:${r.damName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const base = {
      datasetKey: key,
      dataset: "dams" as const,
      stateSlug: d.stateSlug,
      districtSlug: d.slug,
      entityType: "DamReading",
      entityId: r.id,
      dataDate: r.recordedAt,
      primarySource: r.source,
      primaryValue: `${fmtNumber(r.storagePct)}% full`,
      tolerance: `±${DAM_TOLERANCE_POINTS} points`,
    };

    if (d.stateSlug !== "karnataka") {
      out.records.push({ ...base, kind: "cross-source", sources: [], agreed: null, status: "single-source", reason: "no-second-source", notes: "No second reservoir source for this state yet." });
      continue;
    }
    const sameSource = r.source === KARNATAKA_DAM_SOURCE;
    const label = sameSource ? `${KARNATAKA_DAM_SOURCE} (read again)` : KARNATAKA_DAM_SOURCE;
    if (!karnataka) {
      const check = { source: label, value: null, agreed: null, independent: !sameSource, url: KARNATAKA_PUBLIC_PAGE, asOf: null };
      out.records.push({ ...base, kind: sameSource ? "source-recheck" : "cross-source", sources: [check], agreed: null, status: "single-source", reason: "second-source-failed", notes: `Portal: ${karnatakaError ?? "not read"}` });
      continue;
    }
    const portal = findSameDam(r.damName, karnataka);
    if (!portal) {
      out.records.push({ ...base, kind: sameSource ? "source-recheck" : "cross-source", sources: [], agreed: null, status: "single-source", reason: "not-in-second-source", notes: `"${r.damName}" is not on the portal.` });
      continue;
    }
    const re = recheckDam(r, portal, { sourceLabel: label, independent: !sameSource, url: KARNATAKA_PUBLIC_PAGE });
    const verdict = decideStatus([re.check], { primaryCounts: true, noAnswerReason: re.reason ?? "second-source-no-data" });
    // Our copy is behind the portal: not a disagreement about the facts, but the page is out of date.
    const status = re.reason === "stored-older-than-source" ? "unchecked" : verdict.status;
    out.records.push({
      ...base,
      kind: sameSource ? "source-recheck" : "cross-source",
      sources: [re.check],
      agreed: verdict.agreed,
      status,
      reason: re.reason ?? verdict.reason,
      notes: re.note,
    });
  }
  ctx.log(`dams: ${out.records.length} checks (${out.records.filter((r) => r.agreed === true).length} match the portal, ${out.records.filter((r) => r.status === "disagreement").length} disagree)`);
  return out;
}
