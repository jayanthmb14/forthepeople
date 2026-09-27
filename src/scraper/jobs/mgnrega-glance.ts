/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Rural jobs scheme (MGNREGA) — district "At a glance"
// Schedule: daily via /api/cron/scrape-mgnrega (vercel.json).
//
// Sept 2026 (v5.1): replaces jobs/mgnrega.ts, which asked data.gov.in
// for a made-up resource id (156 runs, 0 rows) and filled a missing
// "funds used" with 85 % of the total. The village-council page showed
// four seeded panchayats with round numbers.
//
// NREGASoft's report menu (MISreport4.aspx) now needs a captcha, so we
// do not use it, and panchayat-wise figures are not reachable. What is
// open is the district "At a glance" page (src/scraper/lib/nrega.ts):
// job cards, persondays, households that worked, 100-day households,
// wage rate, works, and money spent, for this and the last five
// financial years, "As on" a stated day.
//
// Per run, per state: GET the form, POST the state; per district: POST
// the district with "View Detail", GET the figures page (≈20 s). All
// requests 2.5 s apart; stalest districts first. The checks in lib/nrega.ts must pass for the
// page and for the newest year; older years whose own figures do not add
// up are dropped and listed. One Redis snapshot per district
// (kind "mgnrega", src/scraper/lib/district-snapshot.ts). Urban
// districts (no MGNREGA) are "not covered"; nothing is written on failure.
// ═══════════════════════════════════════════════════════════
import { fetchSource } from "../lib/source-fetch";
import { pickByName, sourceDistrictNames, sourceStateNames, stalestFirst, type CollectorDistrict } from "../lib/source-districts";
import { snapshotAges, writeDistrictSnapshot } from "../lib/district-snapshot";
import {
  NREGA_GLANCE_URL,
  NREGA_PUBLIC_URL,
  NREGA_SOURCE,
  aspNetFormFields,
  glanceIframeUrl,
  nregaGlanceProblems,
  parseNregaGlance,
  selectOptions,
  toNregaSnapshot,
  type NregaSnapshotData,
} from "../lib/nrega";
import type { RunFailure } from "../lib/run-log";

export interface MgnregaRunResult {
  attempted: number;
  created: number;
  changed: number;
  confirmed: number;
  notCovered: string[];
  failures: RunFailure[];
  changedSlugs: string[];
  budgetExhausted: boolean;
  summary: Record<string, { asOf: string; fy: string; persondaysLakh: number | null; totalExpenditureRupees: number | null; droppedYears: string[] }>;
}

/** A tiny cookie jar + form poster for one ASP.NET session. */
class GlanceSession {
  private cookies = new Map<string, string>();
  constructor(private deadlineMs: number) {}

  private header() {
    return Array.from(this.cookies, ([k, v]) => `${k}=${v}`).join("; ");
  }
  private keep(pairs: string[]) {
    for (const p of pairs) {
      const i = p.indexOf("=");
      if (i > 0) this.cookies.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
    }
  }

  async get(url: string, timeoutMs = 25_000): Promise<string> {
    const res = await fetchSource(url, {
      headers: { Cookie: this.header(), Referer: NREGA_GLANCE_URL },
      timeoutMs,
      deadlineMs: this.deadlineMs,
    });
    this.keep(res.cookies);
    if (!res.ok) throw new Error(`${new URL(url).pathname.split("/").pop()}: ${res.error ?? `HTTP ${res.status}`}`);
    return res.text;
  }

  /** Post the form in `html` back with some fields changed. */
  async post(html: string, set: Record<string, string>, target = ""): Promise<string> {
    const fields = { ...aspNetFormFields(html), ...set, __EVENTTARGET: target, __EVENTARGUMENT: "" };
    const res = await fetchSource(NREGA_GLANCE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: this.header(),
        Referer: NREGA_GLANCE_URL,
      },
      body: new URLSearchParams(fields).toString(),
      timeoutMs: 25_000,
      deadlineMs: this.deadlineMs,
    });
    this.keep(res.cookies);
    if (!res.ok) throw new Error(`form (${target || "View Detail"}): ${res.error ?? `HTTP ${res.status}`}`);
    return res.text;
  }
}

export async function collectMgnregaGlance(
  districts: CollectorDistrict[],
  opts: { deadlineMs: number; log: (m: string) => void; today?: string },
): Promise<MgnregaRunResult> {
  const out: MgnregaRunResult = {
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
  // The page's "As on" date is Indian time.
  const today = opts.today ?? new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

  const session = new GlanceSession(opts.deadlineMs);
  const home = await session.get(NREGA_GLANCE_URL);
  const stateOptions = selectOptions(home, "ddl_state");
  if (stateOptions.length < 20) throw new Error(`state list has ${stateOptions.length} entries`);

  // Stalest districts first, so a run that hits its time budget does not
  // leave the same districts behind every day.
  const ordered = stalestFirst(districts, await snapshotAges("mgnrega", districts.map((d) => d.slug)));
  const byState = new Map<string, CollectorDistrict[]>();
  for (const d of ordered) byState.set(d.stateSlug, [...(byState.get(d.stateSlug) ?? []), d]);

  for (const [stateSlug, group] of byState) {
    const state = pickByName(stateOptions, (o) => o.label, sourceStateNames(stateSlug, group[0].stateName));
    if (!state) {
      out.notCovered.push(...group.map((d) => d.slug));
      opts.log(`${stateSlug}: not in the NREGA state list`);
      continue;
    }
    if (Date.now() > opts.deadlineMs) {
      out.budgetExhausted = true;
      break;
    }
    let statePage: string;
    try {
      statePage = await session.post(home, { ddl_state: state.value }, "ddl_state");
    } catch (err) {
      for (const d of group) out.failures.push({ district: d.slug, error: err instanceof Error ? err.message : String(err) });
      continue;
    }
    const distOptions = selectOptions(statePage, "ddl_dist");

    for (const d of group) {
      const opt = pickByName(distOptions, (o) => o.label, sourceDistrictNames("nrega", d.slug, d.name));
      if (!opt) {
        out.notCovered.push(d.slug);
        continue;
      }
      // Each district needs up to about 45 s; do not start one we cannot finish.
      if (Date.now() + 45_000 > opts.deadlineMs) {
        out.budgetExhausted = true;
        break;
      }
      out.attempted++;
      try {
        // Choosing the district and pressing "View Detail" in one post works
        // (the district list is already in the state page's form).
        const viewPage = await session.post(statePage, { ddl_state: state.value, ddl_dist: opt.value, btproceed: "View Detail" });
        const figuresUrl = glanceIframeUrl(viewPage);
        if (!figuresUrl) throw new Error("the View Detail page did not link a figures page");
        const html = await session.get(figuresUrl, 60_000);
        const g = parseNregaGlance(html);
        if (!g) throw new Error("figures table not found");

        const pageProblems = nregaGlanceProblems(g, { state: state.label, district: opt.label }, today);
        const { data, newestYearProblems } = toNregaSnapshot(g);
        const problems = [...pageProblems, ...newestYearProblems.map((p) => `FY ${g.years[0]?.fy}: ${p}`)];
        if (problems.length > 0) {
          out.failures.push({ district: d.slug, error: `rejected: ${problems.join("; ")}` });
          opts.log(`${d.slug}: rejected (${problems.join("; ")})`);
          continue;
        }

        const res = await writeDistrictSnapshot<NregaSnapshotData>({
          kind: "mgnrega",
          districtSlug: d.slug,
          source: NREGA_SOURCE,
          sourceUrl: NREGA_PUBLIC_URL,
          period: data.years[0].fy,
          asOf: data.asOf,
          fetchedAt: new Date().toISOString(),
          data,
        });
        if (res === "created") out.created++;
        else if (res === "changed") out.changed++;
        else out.confirmed++;
        if (res !== "confirmed") out.changedSlugs.push(d.slug);
        out.summary[d.slug] = {
          asOf: data.asOf,
          fy: data.years[0].fy,
          persondaysLakh: data.years[0].persondaysLakh,
          totalExpenditureRupees: data.years[0].totalExpenditureRupees,
          droppedYears: data.droppedYears.map((y) => y.fy),
        };
        opts.log(
          `${d.slug}: as on ${data.asOf}, FY ${data.years[0].fy} ${data.years[0].persondaysLakh} lakh persondays` +
            (data.droppedYears.length ? `; dropped ${data.droppedYears.map((y) => y.fy).join(", ")}` : ""),
        );
      } catch (err) {
        out.failures.push({ district: d.slug, error: err instanceof Error ? err.message : String(err) });
        opts.log(`${d.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return out;
}
