/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// MGNREGA "At a glance" form helpers, parser and checks
// (src/scraper/lib/nrega.ts). Fixtures are real pages from
// mnregaweb4.dord.gov.in on 27 Sep 2026, trimmed.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  aspNetFormFields,
  financialYearOf,
  glanceIframeUrl,
  nregaGlanceProblems,
  nregaYearProblems,
  parseNregaGlance,
  selectOptions,
  toNregaSnapshot,
} from "@/scraper/lib/nrega";
import { pickByName, sourceDistrictNames, stalestFirst } from "@/scraper/lib/source-districts";

const page = (name: string) => readFileSync(path.join(__dirname, "fixtures/collectors", name), "utf8");

describe("the ASP.NET form", () => {
  const form = page("nrega-form-karnataka.html");

  it("reads the state and district lists without placeholders", () => {
    const states = selectOptions(form, "ddl_state");
    expect(states.find((s) => s.label === "KARNATAKA")?.value).toBe("15");
    expect(states.some((s) => s.value === "ALL")).toBe(false);
    const dists = selectOptions(form, "ddl_dist");
    expect(dists.find((d) => d.label === "MANDYA")?.value).toBe("1521");
    expect(pickByName(dists, (d) => d.label, sourceDistrictNames("nrega", "bengaluru-urban", "Bengaluru Urban"))?.label).toBe("BENGALURU");
    expect(pickByName(dists, (d) => d.label, sourceDistrictNames("nrega", "mysuru", "Mysuru"))?.value).toBe("1522");
  });

  it("posts back the hidden fields and the selected values", () => {
    const f = aspNetFormFields(form);
    expect(f).toHaveProperty("__VIEWSTATE");
    expect(f).toHaveProperty("__EVENTVALIDATION");
    expect(f.ddl_state).toBe("15");
  });

  it("finds the figures page behind View Detail, on the NREGA host only", () => {
    const url = glanceIframeUrl(page("nrega-view-mandya.html"))!;
    expect(url).toMatch(/^https:\/\/mnregaweb4\.dord\.gov\.in\/netnrega\/nrega_ataglance\/all_lvl_details_new\.aspx\?district_code=1521/);
    expect(glanceIframeUrl('<iframe id="iframenregabullten" src=""></iframe>')).toBeNull();
    expect(glanceIframeUrl('<iframe id="iframenregabullten" src="https://evil.example/all_lvl_details.aspx"></iframe>')).toBeNull();
  });
});

describe("parseNregaGlance (Mandya, as on 27-09-2026)", () => {
  const g = parseNregaGlance(page("nrega-glance-mandya.html"))!;

  it("reads the header and the job-card block", () => {
    expect(g).toMatchObject({ stateName: "KARNATAKA", districtName: "MANDYA", asOf: "2026-09-27", blocks: 7, gps: 233 });
    expect(g).toMatchObject({ jobCardsIssuedLakh: 2.96, workersLakh: 5.91, activeJobCardsLakh: 1.03, activeWorkersLakh: 1.67 });
  });

  it("reads six financial years, newest first, money in whole rupees", () => {
    expect(g.years.map((y) => y.fy)).toEqual(["2026-2027", "2025-2026", "2024-2025", "2023-2024", "2022-2023", "2021-2022"]);
    expect(g.years[0]).toMatchObject({
      labourBudgetLakhPersondays: 6.1,
      persondaysLakh: 1.92,
      pctOfLabourBudget: 31.48,
      womenPersondaysPct: 70.2,
      avgWagePerDayRupees: 362.33,
      households100Days: 1,
      householdsWorkedLakh: 0.16,
      completedWorks: 1608,
      totalExpenditureRupees: 308_180_000,
      wagesRupees: 71_288_000,
      materialSkilledRupees: 221_960_000,
      adminExpenditureRupees: 14_932_000,
      paymentsWithin15DaysPct: 97.87,
    });
  });

  it("passes the page checks and the newest year's checks", () => {
    expect(nregaGlanceProblems(g, { state: "KARNATAKA", district: "MANDYA" }, "2026-09-27")).toEqual([]);
    expect(nregaYearProblems(g.years[0])).toEqual([]);
  });

  it("drops FY 2021-22, whose own admin figure does not add up on the source", () => {
    const { data, newestYearProblems } = toNregaSnapshot(g);
    expect(newestYearProblems).toEqual([]);
    expect(data.years.map((y) => y.fy)).toEqual(["2026-2027", "2025-2026", "2024-2025", "2023-2024", "2022-2023"]);
    expect(data.droppedYears.map((y) => y.fy)).toEqual(["2021-2022"]);
    expect(data.years[0]).not.toHaveProperty("printed");
  });

  it("rejects the wrong district, an old page or a misaligned column", () => {
    expect(nregaGlanceProblems(g, { state: "KARNATAKA", district: "MYSURU" }, "2026-09-27")).not.toEqual([]);
    expect(nregaGlanceProblems(g, { state: "KARNATAKA", district: "MANDYA" }, "2026-10-20")).not.toEqual([]);
    expect(nregaGlanceProblems({ ...g, years: g.years.slice(1) }, { state: "KARNATAKA", district: "MANDYA" }, "2026-09-27")).not.toEqual([]);
    expect(nregaYearProblems({ ...g.years[0], wagesRupees: 1 })).not.toEqual([]);
    expect(nregaYearProblems({ ...g.years[0], pctOfLabourBudget: 400 })).not.toEqual([]);
    expect(nregaYearProblems({ ...g.years[0], adminExpenditureRupees: 30_000_000 })).not.toEqual([]);
  });

  it("returns null for a page without the table", () => {
    expect(parseNregaGlance("<html><body>Service unavailable</body></html>")).toBeNull();
  });
});

describe("financialYearOf", () => {
  it("uses the April–March year", () => {
    expect(financialYearOf("2026-09-27")).toBe("2026-2027");
    expect(financialYearOf("2027-03-31")).toBe("2026-2027");
    expect(financialYearOf("2027-04-01")).toBe("2027-2028");
  });
});

describe("stalestFirst (slow collectors start with the oldest snapshot)", () => {
  it("puts never-fetched first, then oldest, keeping ties in order", () => {
    const items = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }];
    const ages = { a: "2026-09-27T05:00:00Z", b: null, c: "2026-09-26T05:00:00Z", d: null };
    expect(stalestFirst(items, ages).map((x) => x.slug)).toEqual(["b", "d", "c", "a"]);
  });
});
