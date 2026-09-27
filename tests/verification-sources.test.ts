/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Data verification: Karnataka reservoir portal + CEDA mirror parsers and
// the per-dataset summary (src/lib/verification/dams-check.ts,
// mandi-check.ts, summary.ts). Fixtures are real replies from
// 27 Sep 2026, trimmed. No network, no database.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { findSameDam, parseKarnatakaReservoirs, recheckDam } from "@/lib/verification/dams-check";
import {
  matchCommodity,
  matchPlace,
  parseCedaCommodities,
  parseCedaDistricts,
  parseCedaPrices,
  parseCedaStates,
  placeKey,
} from "@/lib/verification/mandi-check";
import { latestPerKey, rowSources, summarise, uncheckedSummaries } from "@/lib/verification/summary";
import type { StoredCheckRow } from "@/lib/verification/types";

const fx = (name: string): unknown => JSON.parse(readFileSync(path.join(__dirname, "fixtures", "verification", name), "utf8"));

describe("Karnataka Water Resources portal", () => {
  const list = parseKarnatakaReservoirs(fx("karnataka-wrd.json"));

  it("parses the GeoJSON-in-a-string reply", () => {
    expect(list.length).toBe(5);
    const krs = list.find((r) => r.name === "K.R.Sagara Dam")!;
    expect(krs.percentFull).toBe(55);
    expect(krs.date?.toISOString()).toBe("2026-09-27T00:00:00.000Z");
    expect(parseKarnatakaReservoirs({ d: "not json" })).toEqual([]);
    expect(parseKarnatakaReservoirs(null)).toEqual([]);
  });
  it("finds the same dam under any of our spellings", () => {
    expect(findSameDam("Krishna Raja Sagara (KRS)", list)?.name).toBe("K.R.Sagara Dam");
    expect(findSameDam("KRS Dam (Krishnaraja Sagara)", list)?.name).toBe("K.R.Sagara Dam");
    expect(findSameDam("Hemavathi Reservoir", list)?.name).toBe("Hemavathy Dam");
    expect(findSameDam("Tungabhadra Dam", list)).toBeNull();
  });
  const opts = { sourceLabel: "Karnataka Water Resources Department (read again)", independent: false, url: "https://water.karnataka.gov.in/ReservoirPublic" };
  it("same Indian day, within ±2 points → agreed (our IST-midnight date = the portal's day)", () => {
    const krs = findSameDam("KRS", list)!;
    const r = recheckDam({ storagePct: 55, recordedAt: new Date("2026-09-26T18:30:00Z") }, krs, opts);
    expect(r.check.agreed).toBe(true);
    expect(r.reason).toBeNull();
    expect(r.check.independent).toBe(false);
  });
  it("same day, off by more than 2 points → disagreement", () => {
    const r = recheckDam({ storagePct: 50, recordedAt: new Date("2026-09-27T00:00:00Z") }, findSameDam("KRS", list)!, opts);
    expect(r.check.agreed).toBe(false);
  });
  it("our reading is older than the portal's → not compared, flagged as behind", () => {
    const r = recheckDam({ storagePct: 90, recordedAt: new Date("2026-03-16T18:30:00Z") }, findSameDam("KRS", list)!, opts);
    expect(r.check.agreed).toBeNull();
    expect(r.reason).toBe("stored-older-than-source");
  });
});

describe("CEDA mirror", () => {
  const states = parseCedaStates(fx("ceda-states.json"));
  const districts = parseCedaDistricts(fx("ceda-districts-karnataka.json"));
  const commodities = parseCedaCommodities(fx("ceda-commodities.json"));

  it("matches states and districts by name, with our AGMARKNET aliases", () => {
    expect(matchPlace(states, ["Karnataka"])?.id).toBe(29);
    expect(matchPlace(states, ["Delhi"])?.name).toBe("NCT of Delhi");
    expect(placeKey("Tamil Nadu")).toBe("tamilnadu");
    expect(matchPlace(districts, ["Mysore", "Mysuru"])?.id).toBe(577);
    expect(matchPlace(districts, ["Bangalore", "Bengaluru Urban"])?.name).toBe("Bangalore");
    expect(matchPlace(districts, ["Chennai"])).toBeNull();
  });
  it("matches AGMARKNET commodity names", () => {
    expect(matchCommodity(commodities, "Tomato")?.id).toBe(78);
    expect(matchCommodity(commodities, "Paddy(Common)")?.name).toBe("Paddy(Dhan)(Common)");
    expect(matchCommodity(commodities, "Unobtainium")).toBeNull();
  });
  it("parses daily prices and drops broken rows", () => {
    const p = parseCedaPrices(fx("ceda-prices-tomato-mandya.json"));
    expect(p.length).toBe(3);
    expect(p[0]).toEqual({ day: new Date("2025-10-30T00:00:00Z"), min: 1500, max: 1500, modal: 1500 });
    expect(parseCedaPrices({ data: [{ t: "2025-10", p_min: 1, p_max: 2, p_modal: 1 }, { t: "2025-10-01", p_min: 5, p_max: 2, p_modal: 3 }] })).toEqual([]);
    expect(parseCedaPrices({})).toEqual([]);
  });
});

describe("summarise", () => {
  const t0 = new Date("2026-09-28T02:20:00Z");
  const row = (over: Partial<StoredCheckRow>): StoredCheckRow => ({
    datasetKey: "weather:mandya",
    dataset: "weather",
    kind: "cross-source",
    status: "verified",
    reason: "sources-agree",
    primarySource: "OpenWeatherMap",
    agreed: true,
    sources: [{ source: "Open-Meteo", value: "25.6 °C", agreed: true, independent: true }],
    secondarySource: "Open-Meteo",
    dataDate: new Date("2026-09-28T02:00:00Z"),
    checkedAt: t0,
    ...over,
  });

  it("keeps only the newest row per datasetKey", () => {
    const old = row({ status: "disagreement", agreed: false, checkedAt: new Date(t0.getTime() - 86_400_000) });
    expect(latestPerKey([old, row({})]).map((r) => r.status)).toEqual(["verified"]);
  });
  it("weather verified by two sources, with the shown source and the check", () => {
    const [w] = summarise([row({}), row({ datasetKey: "freshness:weather:mandya", kind: "freshness", status: "fresh", reason: "on-time", sources: null, agreed: null })]);
    expect(w.dataset).toBe("weather");
    expect(w.status).toBe("verified");
    expect(w.checks).toEqual([
      { source: "OpenWeatherMap", role: "shown", agreed: true, independent: true, checkedAt: t0.toISOString() },
      { source: "Open-Meteo", role: "check", agreed: true, independent: true, checkedAt: t0.toISOString() },
    ]);
    expect(w.stale).toBe(false);
    expect(w.reasons).toEqual(["sources-agree"]);
  });
  it("leaders: one disagreement makes the dataset 'disagreement'; placeholders and missing offices are counted", () => {
    const base = { dataset: "leaders", primarySource: "manual-research" };
    const rows = [
      row({ ...base, datasetKey: "leaders:mandya:governor:1", sources: [{ source: "Wikipedia", agreed: true }, { source: "Wikidata", agreed: true }] }),
      row({ ...base, datasetKey: "leaders:mandya:chief-minister:2", status: "disagreement", reason: "sources-disagree", agreed: false, sources: [{ source: "Wikipedia", agreed: false }, { source: "Wikidata", agreed: false }] }),
      row({ ...base, datasetKey: "leaders:mandya:placeholder:3", kind: "placeholder", status: "placeholder", reason: "name-placeholder", sources: null, agreed: null }),
      row({ ...base, datasetKey: "freshness:leaders:mandya", kind: "freshness", status: "stale", reason: "late", sources: null, agreed: null }),
    ];
    const s = summarise(rows).find((x) => x.dataset === "leaders")!;
    expect(s.status).toBe("disagreement");
    expect(s.counts).toEqual({ verified: 1, singleSource: 0, disagreement: 1, unchecked: 0, placeholder: 1, missing: 0 });
    expect(s.checks.map((c) => [c.source, c.role, c.agreed])).toEqual([
      ["manual-research", "shown", false],
      ["Wikipedia", "check", false],
      ["Wikidata", "check", false],
    ]);
    expect(s.stale).toBe(true);
    expect(s.reasons).toEqual(["sources-disagree", "name-placeholder", "late"]);
  });
  it("a same-publisher re-read gives 'single-source'; unchecked rows alone give 'unchecked'", () => {
    const dams = row({ dataset: "dams", datasetKey: "dams:mandya:krs", kind: "source-recheck", status: "single-source", reason: "same-publisher", sources: [{ source: "WRD (read again)", agreed: true, independent: false }] });
    const mandi = row({ dataset: "mandi", datasetKey: "mandi:mandya:tomato", status: "unchecked", reason: "no-stored-data", agreed: null, sources: [] });
    const out = summarise([dams, mandi]);
    expect(out.find((x) => x.dataset === "dams")).toMatchObject({ status: "single-source", reasons: ["same-publisher"] });
    expect(out.find((x) => x.dataset === "dams")!.checks[1]).toMatchObject({ role: "check", independent: false });
    expect(out.find((x) => x.dataset === "mandi")).toMatchObject({ status: "unchecked", reasons: ["no-stored-data"] });
  });
  it("rows from an older run of the same dataset drop out (36 h window)", () => {
    const gone = row({ datasetKey: "weather:mysuru", status: "disagreement", agreed: false, checkedAt: new Date(t0.getTime() - 3 * 86_400_000) });
    expect(summarise([row({}), gone]).find((x) => x.dataset === "weather")!.status).toBe("verified");
  });
  it("always lists the cross-checked datasets", () => {
    expect(summarise([]).map((s) => [s.dataset, s.status])).toEqual([
      ["weather", "unchecked"],
      ["mandi", "unchecked"],
      ["dams", "unchecked"],
      ["leaders", "unchecked"],
    ]);
    expect(uncheckedSummaries().length).toBe(4);
  });
  it("tolerates odd stored JSON", () => {
    expect(rowSources(row({ sources: "nope" }))).toEqual([]);
    expect(rowSources(row({ sources: [null, { value: 1 }, { source: "A" }] }))).toEqual([
      { source: "A", value: null, agreed: null, independent: true, url: null, asOf: null },
    ]);
  });
});
