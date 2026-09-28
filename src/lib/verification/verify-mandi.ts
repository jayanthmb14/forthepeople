/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Verifier: mandi (crop) prices — AGMARKNET vs the CEDA mirror
//
// For each district: the newest market day we show, and on that day the
// (at most) three commodities with the most market rows. Each is compared
// with CEDA's district figure for the same day: our average modal price
// within ±15 % of CEDA's modal, or inside CEDA's min–max (±5 %).
// CEDA mirrors AGMARKNET, so a match gives "single-source" with reason
// "same-publisher" (our copy is right); a day CEDA does not have gives
// "second-source-no-data". At most 12 price requests per run, 2 s apart,
// and none after three districts in a row came back empty.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { shownCropPrices } from "@/lib/data-filters";
import { agmarknetDistrictNames } from "@/scraper/lib/district-aliases";
import { compareModalPrice, decideStatus, fmtNumber, istDayKey, MANDI_RELATIVE_TOLERANCE } from "./compare";
import { DeadlineError, errText, fetchJson } from "./http";
import {
  CEDA_BASE,
  CEDA_SOURCE,
  matchCommodity,
  matchPlace,
  parseCedaCommodities,
  parseCedaDistricts,
  parseCedaPrices,
  parseCedaStates,
  type CedaPlace,
} from "./mandi-check";
import type { SourceCheck, VerificationRecord, VerifierOutput, VerifyContext } from "./types";

const MAX_COMMODITIES_PER_DISTRICT = 3;
const MAX_PRICE_REQUESTS = 12;
const PRIMARY_SOURCE = "AGMARKNET / data.gov.in";

const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

export async function verifyMandi(ctx: VerifyContext): Promise<VerifierOutput> {
  const out: VerifierOutput = { records: [], reviews: [], errors: [] };
  let states: CedaPlace[] | null = null;
  let commodities: CedaPlace[] | null = null;
  const districtsByState = new Map<number, CedaPlace[]>();
  let cedaDown: string | null = null;
  let priceRequests = 0;
  // CEDA's daily series lags (it stopped on 30 Oct 2025): after three
  // districts in a row with nothing that recent, stop asking this run.
  let emptyDistrictsInARow = 0;

  const ceda = async <T>(path: string, parse: (j: unknown) => T, body?: unknown): Promise<T> => {
    const json = await fetchJson<unknown>(`${CEDA_BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      timeoutMs: 20_000,
      deadlineMs: ctx.deadlineMs,
    });
    return parse(json);
  };

  for (const d of ctx.districts) {
    if (Date.now() > ctx.deadlineMs - 5_000) {
      out.errors.push("mandi: time budget used up");
      break;
    }
    // Only the prices the crops page shows (shownCropPrices): New Delhi has
    // no mandi of its own, Bengaluru Urban shows Bangalore APMC only — the
    // check must not report on rows the page hides.
    const shown = shownCropPrices(d.slug);
    const newest = await prisma.cropPrice.findFirst({ where: { districtId: d.id, ...shown }, orderBy: { date: "desc" }, select: { date: true } });
    const base = { dataset: "mandi" as const, stateSlug: d.stateSlug, districtSlug: d.slug, entityType: "CropPrice", tolerance: `±${MANDI_RELATIVE_TOLERANCE * 100} % of the district modal, or within its min–max` };
    if (!newest) {
      out.records.push({ ...base, datasetKey: `mandi:${d.slug}`, kind: "cross-source", entityId: null, dataDate: null, primarySource: PRIMARY_SOURCE, primaryValue: null, sources: [], agreed: null, status: "unchecked", reason: "no-stored-data", notes: "No mandi prices stored for this district." });
      continue;
    }
    const rows = await prisma.cropPrice.findMany({
      where: { districtId: d.id, date: newest.date, ...shown },
      select: { id: true, commodity: true, market: true, modalPrice: true },
      take: 300,
    });
    const byCommodity = new Map<string, typeof rows>();
    for (const r of rows) byCommodity.set(r.commodity, [...(byCommodity.get(r.commodity) ?? []), r]);
    const picked = [...byCommodity.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, MAX_COMMODITIES_PER_DISTRICT);
    const day = istDayKey(newest.date);

    // CEDA lookups for this district (lazy, shared across districts).
    let place: { state: CedaPlace; district: CedaPlace } | null = null;
    let lookupNote: string | null = null;
    if (!cedaDown && emptyDistrictsInARow < 3) {
      try {
        states ??= await ceda("/api/states", parseCedaStates);
        commodities ??= await ceda("/api/commodities", parseCedaCommodities);
        const st = matchPlace(states, [d.stateName]);
        if (st) {
          if (!districtsByState.has(st.id)) districtsByState.set(st.id, await ceda(`/api/districts?state_id=${st.id}`, parseCedaDistricts));
          const dist = matchPlace(districtsByState.get(st.id) ?? [], [...agmarknetDistrictNames(d.slug, d.name), d.name]);
          if (dist) place = { state: st, district: dist };
          else lookupNote = `CEDA has no district named like ${d.name}.`;
        } else lookupNote = `CEDA has no state named ${d.stateName}.`;
      } catch (err) {
        if (err instanceof DeadlineError) {
          out.errors.push("mandi: time budget used up");
          break;
        }
        cedaDown = errText(err);
        out.errors.push(`mandi/ceda: ${cedaDown}`);
      }
    }

    let districtHasNoData = false;
    for (const [commodity, list] of picked) {
      const modals = list.map((r) => r.modalPrice);
      const mean = modals.reduce((s, v) => s + v, 0) / modals.length;
      const shown = `${rupees(mean)} modal (${list.length} market${list.length === 1 ? "" : "s"})`;
      const rec: Omit<VerificationRecord, "sources" | "agreed" | "status" | "reason" | "notes"> = {
        ...base,
        datasetKey: `mandi:${d.slug}:${slugify(commodity)}`,
        kind: "cross-source",
        entityId: list[0].id,
        dataDate: newest.date,
        primarySource: PRIMARY_SOURCE,
        primaryValue: `${commodity}: ${shown}`,
      };
      const cedaCheck = (value: string | null, agreed: boolean | null): SourceCheck => ({
        source: CEDA_SOURCE,
        value,
        agreed,
        independent: false,
        url: CEDA_BASE,
        asOf: value ? newest.date.toISOString() : null,
      });

      if (cedaDown || !place || districtHasNoData || emptyDistrictsInARow >= 3) {
        const reason = cedaDown
          ? "second-source-failed"
          : emptyDistrictsInARow >= 3 || districtHasNoData
            ? "second-source-no-data"
            : "not-in-second-source";
        const note = cedaDown
          ? `CEDA: ${cedaDown}`
          : reason === "second-source-no-data"
            ? `CEDA has no prices for ${d.name} on ${day}${emptyDistrictsInARow >= 3 ? " (it has nothing this recent for other districts either)" : ""}.`
            : lookupNote ?? `CEDA has no district matching ${d.name}.`;
        out.records.push({ ...rec, sources: [cedaCheck(null, null)], agreed: null, status: "single-source", reason, notes: note });
        continue;
      }
      const com = matchCommodity(commodities ?? [], commodity);
      if (!com) {
        out.records.push({ ...rec, sources: [cedaCheck(null, null)], agreed: null, status: "single-source", reason: "not-in-second-source", notes: `CEDA has no commodity matching "${commodity}".` });
        continue;
      }
      if (priceRequests >= MAX_PRICE_REQUESTS) {
        out.records.push({ ...rec, sources: [cedaCheck(null, null)], agreed: null, status: "single-source", reason: "second-source-no-data", notes: "Request cap for this run reached." });
        continue;
      }
      try {
        priceRequests++;
        const from = new Date(newest.date.getTime() - 3 * 86_400_000);
        const prices = await ceda("/api/prices", parseCedaPrices, {
          state_id: place.state.id,
          district_id: place.district.id,
          commodity_id: com.id,
          calculation_type: "d",
          start_date: istDayKey(from),
          end_date: day,
        });
        const ref = prices.find((p) => istDayKey(p.day) === day);
        if (!ref) {
          // An empty reply means CEDA has nothing that recent for this district: skip its other commodities.
          if (prices.length === 0) {
            districtHasNoData = true;
            emptyDistrictsInARow++;
          }
          out.records.push({ ...rec, sources: [cedaCheck(null, null)], agreed: null, status: "single-source", reason: "second-source-no-data", notes: `CEDA has no ${com.name} price for ${d.name} on ${day}.` });
          continue;
        }
        emptyDistrictsInARow = 0;
        const cmp = compareModalPrice(modals, ref);
        const check = cedaCheck(`${rupees(ref.modal)} modal (${rupees(ref.min)}–${rupees(ref.max)})`, cmp ? cmp.agreed : null);
        const verdict = decideStatus([check], { primaryCounts: true });
        out.records.push({
          ...rec,
          sources: [check],
          agreed: verdict.agreed,
          status: verdict.status,
          reason: verdict.reason,
          notes: cmp ? `${commodity} on ${day}: ours ${shown}, CEDA ${check.value} (${cmp.diffPct > 0 ? "+" : ""}${fmtNumber(cmp.diffPct)} %).` : "Not comparable.",
        });
      } catch (err) {
        if (err instanceof DeadlineError) {
          out.errors.push("mandi: time budget used up");
          break;
        }
        out.errors.push(`mandi/${d.slug}/${slugify(commodity)}: ${errText(err)}`);
        out.records.push({ ...rec, sources: [cedaCheck(null, null)], agreed: null, status: "single-source", reason: "second-source-failed", notes: `CEDA: ${errText(err)}` });
      }
    }
  }
  ctx.log(`mandi: ${out.records.length} checks, ${priceRequests} CEDA price requests (${out.records.filter((r) => r.agreed === true).length} match, ${out.records.filter((r) => r.status === "disagreement").length} disagree)`);
  return out;
}
