/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Schools — UDISE+ district statistics
// Schedule: weekly via /api/cron/scrape-schools (vercel.json).
//
// Sept 2026 (v5.1): replaces jobs/schools.ts, which asked data.gov.in
// for a resource id that never answered (28 runs, 0 rows). The School
// table is one row per school and was seeded by hand; no public source
// lists every school without a captcha (UDISE+ "Know your school"
// region search needs one, so we do not use it). What UDISE+ does
// publish openly is each district's official totals: schools, teachers,
// students, schools by management, and the share of schools with
// working electricity, water, girls' toilets, computers, internet, …
//
// Per run (all on api.udiseplus.gov.in, 2 s apart):
//   1. the school-year list → newest year and the one before;
//   2. the state list, then each needed state's education districts;
//   3. per district: its UDISE+ part(s) (Bengaluru Urban and Mumbai have
//      two), the figures for the newest year and the year before;
//   4. every check in src/scraper/lib/udise.ts must pass for every part,
//      then ONE snapshot per district goes to Redis
//      (src/scraper/lib/district-snapshot.ts, kind "udise").
// If the newest year has no figures yet for a district, the year before
// is used and labelled as such. A failed request or check writes nothing.
// ═══════════════════════════════════════════════════════════
import { fetchSource, parseJsonSafe } from "../lib/source-fetch";
import { pickByName, sourceDistrictNames, sourceStateNames, udiseParts, type CollectorDistrict } from "../lib/source-districts";
import { writeDistrictSnapshot } from "../lib/district-snapshot";
import {
  UDISE_API,
  UDISE_PUBLIC_URL,
  UDISE_SOURCE,
  parseUdiseHighlights,
  parseUdiseRegions,
  parseUdiseYears,
  sumUdiseParts,
  udiseAvailablePct,
  udiseHighlightsBody,
  udiseProblems,
  type UdisePartStats,
  type UdiseRegion,
  type UdiseSnapshotData,
  type UdiseYear,
} from "../lib/udise";
import type { RunFailure } from "../lib/run-log";

const GAP_MS = 2_000;

export interface UdiseRunResult {
  attempted: number;
  created: number;
  changed: number;
  confirmed: number;
  notCovered: string[];
  failures: RunFailure[];
  changedSlugs: string[];
  budgetExhausted: boolean;
  summary: Record<string, { year: string; schools: number; teachers: number; students: number; parts: string[] }>;
}

async function getJson(path: string, deadlineMs: number, init?: { body: string }): Promise<unknown | string> {
  const res = await fetchSource(UDISE_API + path, {
    method: init ? "POST" : "GET",
    headers: { Accept: "application/json", ...(init ? { "Content-Type": "application/json" } : {}) },
    body: init?.body,
    timeoutMs: 20_000,
    minGapMs: GAP_MS,
    deadlineMs,
  });
  if (!res.ok) return `${path.split("/")[0]}: ${res.error ?? `HTTP ${res.status}`}`;
  const json = parseJsonSafe(res.text);
  return json ?? `${path.split("/")[0]}: not JSON`;
}

type Highlights = { parsed: ReturnType<typeof parseUdiseHighlights>; available: Record<string, number | null> };
async function highlights(yearId: number, code: string, deadlineMs: number): Promise<Highlights | string> {
  const body = await getJson("kpi/edu-highlights", deadlineMs, { body: udiseHighlightsBody(yearId, code) });
  if (typeof body === "string") return body;
  return { parsed: parseUdiseHighlights(body), available: udiseAvailablePct(body) };
}

/** Figures for every part for one year; null when any part has none published. */
async function yearFigures(
  parts: UdiseRegion[],
  yearId: number,
  deadlineMs: number,
): Promise<Array<{ part: UdiseRegion; h: Highlights }> | null | string> {
  const out: Array<{ part: UdiseRegion; h: Highlights }> = [];
  for (const part of parts) {
    const h = await highlights(yearId, part.code, deadlineMs);
    if (typeof h === "string") return h;
    if (!h.parsed) return null;
    if (h.parsed.stats.udiseCode !== part.code) return `asked for ${part.code}, got ${h.parsed.stats.udiseCode}`;
    out.push({ part, h });
  }
  return out;
}

export async function collectUdiseSchools(
  districts: CollectorDistrict[],
  opts: { deadlineMs: number; log: (m: string) => void },
): Promise<UdiseRunResult> {
  const out: UdiseRunResult = {
    attempted: 0,
    created: 0,
    changed: 0,
    confirmed: 0,
    notCovered: [],
    failures: [],
    changedSlugs: [],
    budgetExhausted: false,
    summary: {},
  };

  const yearsBody = await getJson("acad-year-master/public", opts.deadlineMs);
  const years = typeof yearsBody === "string" ? null : parseUdiseYears(yearsBody);
  if (!years || years.length < 2) throw new Error(typeof yearsBody === "string" ? yearsBody : "school-year list unreadable");
  const [latest, previous] = years as [UdiseYear, UdiseYear];

  const statesBody = await getJson(`states/${latest.yearId}`, opts.deadlineMs);
  const states = typeof statesBody === "string" ? null : parseUdiseRegions(statesBody, "state");
  if (!states || states.length < 20) throw new Error(typeof statesBody === "string" ? statesBody : "state list unreadable");

  const byState = new Map<string, CollectorDistrict[]>();
  for (const d of districts) byState.set(d.stateSlug, [...(byState.get(d.stateSlug) ?? []), d]);

  for (const [stateSlug, group] of byState) {
    if (Date.now() > opts.deadlineMs) {
      out.budgetExhausted = true;
      break;
    }
    const state = pickByName(states, (s) => s.name, sourceStateNames(stateSlug, group[0].stateName));
    if (!state) {
      out.notCovered.push(...group.map((d) => d.slug));
      opts.log(`${stateSlug}: state not in UDISE+ list`);
      continue;
    }
    const listBody = await getJson(`districts/${state.code}/${latest.yearId}`, opts.deadlineMs);
    const list = typeof listBody === "string" ? null : parseUdiseRegions(listBody, "district");
    if (!list || list.length === 0) {
      const err = typeof listBody === "string" ? listBody : "district list unreadable";
      for (const d of group) out.failures.push({ district: d.slug, error: err });
      continue;
    }

    for (const d of group) {
      if (Date.now() > opts.deadlineMs) {
        out.budgetExhausted = true;
        break;
      }
      const wanted = udiseParts(d.slug);
      let parts: UdiseRegion[];
      if (wanted) {
        const found = wanted.map((n) => pickByName(list, (r) => r.name, [n]));
        if (found.some((f) => !f)) {
          out.failures.push({ district: d.slug, error: `UDISE+ part missing: ${wanted.filter((_, i) => !found[i]).join(", ")}` });
          continue;
        }
        parts = found as UdiseRegion[];
      } else {
        const one = pickByName(list, (r) => r.name, sourceDistrictNames("udise", d.slug, d.name));
        if (!one) {
          out.notCovered.push(d.slug);
          continue;
        }
        parts = [one];
      }
      out.attempted++;

      // Newest year; fall back one year if it is not published yet.
      let year = latest;
      let yearBefore: UdiseYear | null = previous;
      let now = await yearFigures(parts, latest.yearId, opts.deadlineMs);
      if (now === null) {
        year = previous;
        yearBefore = years[2] ?? null;
        now = await yearFigures(parts, previous.yearId, opts.deadlineMs);
      }
      if (now === null || typeof now === "string") {
        out.failures.push({ district: d.slug, error: now ?? "no figures published" });
        continue;
      }
      const before = yearBefore ? await yearFigures(parts, yearBefore.yearId, opts.deadlineMs) : null;
      const beforeByCode = new Map(
        (Array.isArray(before) ? before : []).map((b) => [b.part.code, b.h.parsed!.stats]),
      );

      const problems: string[] = [];
      for (const { part, h } of now) {
        const prevSchools = beforeByCode.get(part.code)?.schools ?? null;
        for (const p of udiseProblems(h.parsed!, h.available, prevSchools)) problems.push(`${part.name}: ${p}`);
      }
      if (problems.length > 0) {
        out.failures.push({ district: d.slug, error: `rejected: ${problems.join("; ")}` });
        opts.log(`${d.slug}: rejected (${problems.join("; ")})`);
        continue;
      }

      const partStats: UdisePartStats[] = now.map((x) => x.h.parsed!.stats);
      const prevParts = Array.isArray(before) && before.length === parts.length ? before.map((b) => b.h.parsed!.stats) : null;
      const prevTotals = prevParts ? sumUdiseParts(prevParts) : null;
      const data: UdiseSnapshotData = {
        year: year.label,
        yearId: year.yearId,
        parts: partStats,
        totals: sumUdiseParts(partStats),
        previousYear:
          prevTotals && yearBefore
            ? { year: yearBefore.label, schools: prevTotals.schools, teachers: prevTotals.teachers, students: prevTotals.students }
            : null,
      };
      try {
        const res = await writeDistrictSnapshot<UdiseSnapshotData>({
          kind: "udise",
          districtSlug: d.slug,
          source: UDISE_SOURCE,
          sourceUrl: UDISE_PUBLIC_URL,
          period: year.label,
          // UDISE+ publishes a school year, not a day.
          asOf: null,
          fetchedAt: new Date().toISOString(),
          data,
        });
        if (res === "created") out.created++;
        else if (res === "changed") out.changed++;
        else out.confirmed++;
        if (res !== "confirmed") out.changedSlugs.push(d.slug);
        out.summary[d.slug] = { year: year.label, ...data.totals, parts: partStats.map((p) => p.udiseName) };
        opts.log(`${d.slug}: ${year.label} ${data.totals.schools} schools, ${data.totals.teachers} teachers, ${data.totals.students} students (${res})`);
      } catch (err) {
        out.failures.push({ district: d.slug, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  return out;
}
