/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Tap water at home — Jal Jeevan Mission dashboard, district totals
// Schedule: daily via /api/cron/scrape-jjm (vercel.json).
//
// Sept 2026 (v5.1): replaces jobs/jjm.ts, which POSTed to
// ejalshakti.gov.in/JJM/API/Reports/GetHHTPConn (404 since at least
// April; 28 runs, 0 rows). The JJMStatus rows on the site were a March
// seed with round numbers ("Mandya Taluk (aggregate) 104,000 homes").
//
// Per run (about 1 + 2 × states requests, 2.5 s apart):
//   1. the state list from the dashboard map → each state's code;
//   2. per state that has one of our districts: the district map AND the
//      district table (two endpoints; see src/scraper/lib/jjm.ts);
//   3. per district: match its name (src/scraper/lib/source-districts.ts),
//      check the figures (taps ≤ homes, % = taps ÷ homes, both endpoints
//      agree) and upsert ONE JJMStatus row, keyed by (districtId,
//      source = JJM_SOURCE). villageName = the district's name as JJM
//      prints it, talukId = null: it is the district total.
// A district JJM does not list (urban) is reported as "not covered" and
// nothing is written. A failed request or a failed check writes nothing.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { fetchSource, parseJsonSafe } from "../lib/source-fetch";
import { pickByName, sourceDistrictNames, sourceStateNames, type CollectorDistrict } from "../lib/source-districts";
import {
  JJM_BASE,
  JJM_SOURCE,
  jjmCrossCheck,
  jjmRequestBody,
  jjmRowProblems,
  parseJjmRows,
  type JjmRow,
} from "../lib/jjm";
import type { RunFailure } from "../lib/run-log";

export interface JjmRunResult {
  /** Districts JJM lists and we tried to write. */
  attempted: number;
  created: number;
  /** Rows whose figures changed. */
  changed: number;
  /** Rows re-confirmed with the same figures (updatedAt moves to today). */
  confirmed: number;
  notCovered: string[];
  failures: RunFailure[];
  /** Slugs whose row was created or changed (cache busting, update log). */
  changedSlugs: string[];
  budgetExhausted: boolean;
  /** What was written, per slug (for the route's JSON reply). */
  figures: Record<string, { households: number; withTap: number; pct: number; jjmName: string }>;
}

async function postJjm(method: "BindDistrictMap" | "Bind_table_graph", body: string, deadlineMs: number): Promise<JjmRow[] | string> {
  const res = await fetchSource(`${JJM_BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8", Accept: "application/json" },
    body,
    timeoutMs: 25_000,
    deadlineMs,
  });
  if (!res.ok) return `${method}: ${res.error ?? `HTTP ${res.status}`}`;
  const rows = parseJjmRows(parseJsonSafe(res.text));
  if (!rows) return `${method}: unexpected reply`;
  return rows;
}

export async function collectJjmCoverage(
  districts: CollectorDistrict[],
  opts: { deadlineMs: number; log: (m: string) => void },
): Promise<JjmRunResult> {
  const out: JjmRunResult = {
    attempted: 0,
    created: 0,
    changed: 0,
    confirmed: 0,
    notCovered: [],
    failures: [],
    changedSlugs: [],
    budgetExhausted: false,
    figures: {},
  };

  const states = await postJjm("BindDistrictMap", jjmRequestBody("0", "states"), opts.deadlineMs);
  if (typeof states === "string") throw new Error(`state list: ${states}`);
  if (states.length < 20) throw new Error(`state list has only ${states.length} rows`);

  const byState = new Map<string, CollectorDistrict[]>();
  for (const d of districts) byState.set(d.stateSlug, [...(byState.get(d.stateSlug) ?? []), d]);

  for (const [stateSlug, group] of byState) {
    const stateRow = pickByName(states, (s) => s.name, sourceStateNames(stateSlug, group[0].stateName));
    if (!stateRow) {
      // e.g. Delhi: no rural homes under JJM.
      out.notCovered.push(...group.map((d) => d.slug));
      opts.log(`${stateSlug}: state not on the JJM dashboard`);
      continue;
    }
    if (Date.now() > opts.deadlineMs) {
      out.budgetExhausted = true;
      break;
    }

    const body = jjmRequestBody(stateRow.code, "districts");
    const map = await postJjm("BindDistrictMap", body, opts.deadlineMs);
    const table = typeof map === "string" ? map : await postJjm("Bind_table_graph", body, opts.deadlineMs);
    if (typeof map === "string" || typeof table === "string") {
      const err = typeof map === "string" ? map : (table as string);
      for (const d of group) out.failures.push({ district: d.slug, error: err });
      opts.log(`${stateSlug}: ${err}`);
      continue;
    }

    for (const d of group) {
      const row = pickByName(map, (r) => r.name, sourceDistrictNames("jjm", d.slug, d.name));
      if (!row) {
        out.notCovered.push(d.slug);
        continue;
      }
      out.attempted++;
      const problems = [...jjmRowProblems(row), ...jjmCrossCheck(row, table.find((t) => t.code === row.code) ?? null)];
      if (problems.length > 0) {
        out.failures.push({ district: d.slug, error: `rejected: ${problems.join("; ")}` });
        opts.log(`${d.slug}: rejected (${problems.join("; ")})`);
        continue;
      }

      const data = {
        villageName: row.name,
        talukId: null,
        totalHouseholds: row.households,
        tapConnections: row.withTap,
        coveragePct: row.pct,
        source: JJM_SOURCE,
      };
      try {
        const existing = await prisma.jJMStatus.findFirst({
          where: { districtId: d.id, source: JJM_SOURCE },
          select: { id: true, totalHouseholds: true, tapConnections: true },
        });
        if (!existing) {
          await prisma.jJMStatus.create({ data: { districtId: d.id, ...data } });
          out.created++;
          out.changedSlugs.push(d.slug);
        } else {
          // Always update: updatedAt is the page's "as of", and the dashboard
          // re-confirmed these figures today.
          await prisma.jJMStatus.update({ where: { id: existing.id }, data });
          if (existing.totalHouseholds !== row.households || existing.tapConnections !== row.withTap) {
            out.changed++;
            out.changedSlugs.push(d.slug);
          } else {
            out.confirmed++;
          }
        }
        out.figures[d.slug] = { households: row.households, withTap: row.withTap, pct: row.pct, jjmName: row.name };
        opts.log(`${d.slug}: ${row.withTap}/${row.households} homes (${row.pct}%)`);
      } catch (err) {
        out.failures.push({ district: d.slug, error: err instanceof Error ? err.message : String(err) });
      }
    }
  }
  return out;
}
