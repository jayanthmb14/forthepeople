/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * NJDG court dashboards: parsers, checks and sums (src/lib/courts/*).
 * Fixtures are trimmed copies of what NJDG served for Mandya and the High
 * Court of Karnataka on 27 Sep 2026.
 */
import { describe, expect, it } from "vitest";
import {
  parseDashboardPage,
  parseDisposedDashboard,
  parseNjdgJson,
  parsePendingDashboard,
  splitCounts,
  toCount,
  tookLowerYears,
  type DashboardPage,
} from "@/lib/courts/parse";
import {
  buildUnit,
  closeEnough,
  courtStatReadDate,
  courtStatRows,
  courtStatSource,
  istYear,
  summarise,
  type CourtUnitSnapshot,
  type CourtsSnapshot,
} from "@/lib/courts/snapshot";
import { hasNjdgSource, highCourtFor, njdgUnitsFor, NJDG_DISTRICT_UNITS } from "@/lib/courts/sources";
import { INDIA_STATES, getActiveDistricts } from "@/lib/constants/districts";

const MANDYA_PAGE = `
<script type="text/javascript">
$(document).ready(function(){
  charts('24073','25715','49788','41201','42905','84106','','','','','','','','','','');
  preTrialLitigationChart('0','1','1','0');
  pendingAgewiseBarChart('Less than one year','17128~10302~5855~5921~1995','17190~10526~6739~7185~1265','lessthan1','"(41%)"~"(25%)"~"(15%)"~"(16%)"~"(4%)"');
});
</script>
<tr><td>Cases Instituted in Last Month</td>
<td><a href="#" onclick="fetchStateData('ins',2);" data-bs-toggle="modal">1462</a></td>
<td><a href="#" onclick="fetchStateData('ins',3);" data-bs-toggle="modal">2392</a></td>
<td><a href="#" onclick="fetchStateData('ins',1);" data-bs-toggle="modal">3854</a></td></tr>
<tr><td>Cases Disposed in Last Month</td>
<td><a href="#" onclick="fetchStateData('disp',2);" data-bs-toggle="modal">1120</a></td>
<td><a href="#" onclick="fetchStateData('disp',3);" data-bs-toggle="modal">1929</a></td>
<td><a href="#" onclick="fetchStateData('disp',1);" data-bs-toggle="modal">3049</a></td></tr>
<input type="hidden" name="app_token" id='app_token' value="70fa56a2d2f95751484207a618b48e5a17d9375f0fd924aabfc7ed9c3b18d946">`;

const HC_PAGE = `
charts(165645,29271,194916,272619,58415,331034,'','','','','','','','','','');
pendingAgewiseBarChart('Less than one year','106974~69413~35762~43749~16721','29144~15978~7303~5195~795','lessthan1','"(41%)"');
<td><a href="#" onclick="fetchStateData('ins',2);" aria-label="8121" data-bs-toggle="modal">8121</a></td>
<td><a href="#" onclick="fetchStateData('ins',3);" aria-label="2903" data-bs-toggle="modal">2903</a></td>
<td><a href="#" onclick="fetchStateData('ins',1);" aria-label="11024" data-bs-toggle="modal">11024</a></td>
<a href="#" onclick="fetchStateData('insCurr',2);" data-bs-toggle="modal">71,942</a>
<a href="#" onclick="javascript:fetchStateData('insCurr','3')" data-bs-toggle="modal">23,143</a>
<a href="#" onclick="javascript:fetchStateData('insCurr','1')" data-bs-toggle="modal">95,085</a>
<a href="#" onclick="javascript:fetchStateData('dispCurr','2')" data-bs-toggle="modal">72,105</a>
<a href="#" onclick="javascript:fetchStateData('dispCurr','3')" data-bs-toggle="modal">22,703</a>
<a href="#" onclick="javascript:fetchStateData('dispCurr','1')" data-bs-toggle="modal">94,808</a>`;

const PENDING_JSON = `



 {"insyear":"2026~2025~2024~2023~2022~2021~2020~2019~2018","ins_count":"31722~42572~43370~41091~48589~81010~36925~35681~36172","disp_count":"33374~44585~41626~42303~45920~78523~29842~34457~31947","agewise_count":"34318~20828~12594~13106~3213~44~3","app_token":"34ee"}`;

const DISPOSED_JSON = `{"dispYear":"\\"Within#1#year\\"~\\"1-2#year\\"~\\"2-3#year\\"~\\"3-4#year\\"~\\"4-5#year\\"~\\"6-7#year\\"~\\"5-6#year\\"~\\"7-8#year\\"~\\"8-9#year\\"~\\"9-10#year\\"~\\"10-11#year\\"~\\"11-12#year\\"~\\"12-13#year\\"~\\"13-14#year\\"~\\"14-15#year\\"~\\"15-16#year\\"~\\"16-17#year\\"~\\"More#Than#21#Years\\"~\\"18-19#year\\"~\\"17-18#year\\"~\\"19-20#year\\"~\\"20-21#year\\"","dispCount":"24012~4810~3683~3022~1900~1711~1588~1160~844~581~436~300~206~100~77~60~31~21~17~12~8~6"}`;

const FETCHED_AT = "2026-09-27T02:15:00.000Z";

function mandyaUnit(overrides: Partial<{ page: DashboardPage }> = {}): CourtUnitSnapshot {
  const page = overrides.page ?? parseDashboardPage(MANDYA_PAGE)!;
  const pending = parsePendingDashboard(parseNjdgJson(PENDING_JSON)!);
  const decided = parseDisposedDashboard(parseNjdgJson(DISPOSED_JSON)!, 2025);
  const built = buildUnit({ name: "Mandya", kind: "district", url: "u", page, pending, decided, fetchedAt: FETCHED_AT });
  if ("error" in built) throw new Error(built.error);
  return built.unit;
}

describe("numbers", () => {
  it("reads Indian-grouped counts and rejects anything else", () => {
    expect(toCount("1,12,25,992")).toBe(11225992);
    expect(toCount("84106")).toBe(84106);
    expect(toCount(12)).toBe(12);
    expect(toCount("")).toBeNull();
    expect(toCount("-5")).toBeNull();
    expect(toCount("12.5")).toBeNull();
    expect(toCount(null)).toBeNull();
  });
  it("splits ~ lists, and fails the whole list on one bad item", () => {
    expect(splitCounts("1~2~3")).toEqual([1, 2, 3]);
    expect(splitCounts('"4"~"5"')).toEqual([4, 5]);
    expect(splitCounts("1~x~3")).toBeNull();
    expect(splitCounts("")).toBeNull();
  });
  it("parses NJDG JSON that starts with blank lines", () => {
    expect(parseNjdgJson("\n\n  {\"a\":1}")).toEqual({ a: 1 });
    expect(parseNjdgJson("<html>")).toBeNull();
  });
});

describe("district page", () => {
  const p = parseDashboardPage(MANDYA_PAGE)!;
  it("reads pending civil / criminal / total", () => {
    expect(p.pending).toEqual({ civil: 41201, criminal: 42905, total: 84106 });
  });
  it("reads the age table (civil and criminal, 5 bands)", () => {
    expect(p.age?.civil).toEqual([17128, 10302, 5855, 5921, 1995]);
    expect(p.age?.criminal).toEqual([17190, 10526, 6739, 7185, 1265]);
  });
  it("reads last month's instituted and disposed", () => {
    expect(p.lastMonth.instituted).toEqual({ civil: 1462, criminal: 2392, total: 3854 });
    expect(p.lastMonth.disposed).toEqual({ civil: 1120, criminal: 1929, total: 3049 });
  });
  it("keeps the session token", () => {
    expect(p.appToken).toMatch(/^70fa56/);
  });
  it("fills an empty civil cell from total − criminal (a criminal-only court)", () => {
    const html = `fetchStateData('ins',2);">\n</a> fetchStateData('ins',3);" x>2083</a> fetchStateData('ins',1);" x>2083</a>
      fetchStateData('disp',2);">\n</a> fetchStateData('disp',3);">\n</a> fetchStateData('disp',1);">9</a> charts('0','0','0','0','5','5')`;
    const q = parseDashboardPage(html)!;
    expect(q.lastMonth.instituted).toEqual({ civil: 0, criminal: 2083, total: 2083 });
    expect(q.lastMonth.disposed).toBeNull(); // two cells empty: not usable
  });
  it("returns null when the totals are missing", () => {
    expect(parseDashboardPage("<html>Invalid Request</html>")).toBeNull();
  });
});

describe("High Court page", () => {
  const p = parseDashboardPage(HC_PAGE)!;
  it("reads unquoted totals and the current year", () => {
    expect(p.pending.total).toBe(331034);
    expect(p.currentYear.instituted?.total).toBe(95085);
    expect(p.currentYear.disposed).toEqual({ civil: 72105, criminal: 22703, total: 94808 });
    expect(p.lastMonth.disposed).toBeNull(); // not in the fixture: missing, not 0
  });
  it("builds a High Court unit with this year so far", () => {
    const built = buildUnit({ name: "High Court of Karnataka", kind: "high-court", url: "u", page: p, fetchedAt: FETCHED_AT });
    expect("unit" in built).toBe(true);
    if ("unit" in built) {
      expect(built.unit.years).toEqual([{ year: 2026, instituted: 95085, disposed: 94808 }]);
      expect(built.unit.checks.find((c) => c.id === "ageAddsUp")?.ok).toBe(true);
    }
  });
});

describe("dashboards", () => {
  it("reads the yearly series oldest first, and the 7-band age count", () => {
    const d = parsePendingDashboard(parseNjdgJson(PENDING_JSON)!)!;
    expect(d.years[0]).toEqual({ year: 2018, instituted: 36172, disposed: 31947 });
    expect(d.years.at(-1)).toEqual({ year: 2026, instituted: 31722, disposed: 33374 });
    expect(d.ageBands7?.reduce((s, n) => s + n, 0)).toBe(84106);
  });
  it("rejects a series whose lists do not line up", () => {
    expect(parsePendingDashboard({ insyear: "2026~2025", ins_count: "1", disp_count: "1~2" })).toBeNull();
  });
  it("maps time-taken labels to their lower bound", () => {
    expect(tookLowerYears('"Within#1#year"')).toBe(0);
    expect(tookLowerYears("4-5#year")).toBe(4);
    expect(tookLowerYears("More#Than#21#Years")).toBe(21);
    expect(tookLowerYears("Unknown")).toBeNull();
  });
  it("groups last year's decided cases by time taken", () => {
    const d = parseDisposedDashboard(parseNjdgJson(DISPOSED_JSON)!, 2025)!;
    expect(d.total).toBe(44585);
    expect(d.took).toEqual([24012, 8493, 4922, 5884, 1274]);
  });
  it("refuses to guess an unknown label", () => {
    expect(parseDisposedDashboard({ dispYear: "Within#1#year~Odd", dispCount: "1~2" }, 2025)).toBeNull();
  });
});

describe("checks", () => {
  it("passes all three checks for Mandya", () => {
    const u = mandyaUnit();
    expect(u.checks.map((c) => [c.id, c.ok])).toEqual([
      ["ageMatches", true],
      ["ageAddsUp", true],
      ["decidedMatches", true],
    ]);
    // The dashboard's 7 bands, collapsed to 5, and the long tail.
    expect(u.age).toEqual([34318, 20828, 12594, 13106, 3260]);
    expect(u.ageLong).toEqual({ over20: 47, over30: 3 });
    expect(u.decided?.total).toBe(44585);
  });
  it("drops a unit whose civil + criminal is not the total", () => {
    const page = { ...parseDashboardPage(MANDYA_PAGE)!, pending: { civil: 1, criminal: 1, total: 3 } };
    expect(buildUnit({ name: "X", kind: "district", url: "u", page, fetchedAt: FETCHED_AT })).toEqual({
      error: "X: civil 1 + criminal 1 ≠ total 3",
    });
  });
  it("drops an empty unit instead of showing 0 cases", () => {
    const page = { ...parseDashboardPage(MANDYA_PAGE)!, pending: { civil: 0, criminal: 0, total: 0 } };
    expect("error" in buildUnit({ name: "X", kind: "district", url: "u", page, fetchedAt: FETCHED_AT })).toBe(true);
  });
  it("hides a civil / criminal age split that does not add up", () => {
    const base = parseDashboardPage(MANDYA_PAGE)!;
    const page = { ...base, age: { civil: base.age!.civil, criminal: [1, 1, 1, 1, 1] as [number, number, number, number, number] } };
    const u = mandyaUnit({ page });
    expect(u.ageSplit).toBeNull();
    expect(u.age).not.toBeNull(); // the dashboard's bands still add up
    expect(u.checks.find((c) => c.id === "ageAddsUp")?.ok).toBe(false);
  });
  it("tolerates NJDG's own few-case gap between its two tables", () => {
    const base = parseDashboardPage(MANDYA_PAGE)!;
    const criminal = [...base.age!.criminal] as [number, number, number, number, number];
    criminal[0] += 2;
    const u = mandyaUnit({ page: { ...base, age: { civil: base.age!.civil, criminal } } });
    expect(u.ageSplit).not.toBeNull();
  });
  it("allows 1 % drift between two NJDG requests", () => {
    expect(closeEnough(84106, 84106)).toBe(true);
    expect(closeEnough(84106, 84900)).toBe(true);
    expect(closeEnough(84106, 86000)).toBe(false);
    expect(closeEnough(10, 14)).toBe(true); // small counts: ±5
  });
});

describe("summary", () => {
  it("adds units up and derives the plain-words figures", () => {
    const s = summarise([mandyaUnit()], FETCHED_AT)!;
    expect(s.pending.total).toBe(84106);
    expect(s.age).toEqual([34318, 20828, 12594, 13106, 3260]);
    expect(s.olderThan1).toBe(84106 - 34318);
    expect(s.olderThan5).toBe(13106 + 3260);
    expect(s.olderThan10).toBe(3260);
    expect(s.lastFullYear).toEqual({ year: 2025, instituted: 42572, disposed: 44585 });
    expect(s.thisYear?.year).toBe(2026);
    expect(s.perTenLastYear).toBeCloseTo(10.47, 2);
    expect(s.yearsToClear).toBeCloseTo(84106 / 44585, 5);
    expect(s.allChecksOk).toBe(true);
  });
  it("sums two units and keeps only the years both report", () => {
    const a = mandyaUnit();
    const b = { ...mandyaUnit(), name: "B", years: a.years.filter((y) => y.year >= 2024) };
    const s = summarise([a, b], FETCHED_AT)!;
    expect(s.pending.total).toBe(2 * 84106);
    expect(s.years.map((y) => y.year)).toEqual([2024, 2025, 2026]);
  });
  it("gives no age figures when one unit has none", () => {
    const s = summarise([mandyaUnit(), { ...mandyaUnit(), age: null, ageLong: null, ageSplit: null }], FETCHED_AT)!;
    expect(s.age).toBeNull();
    expect(s.ageLong).toBeNull();
    expect(s.ageCivil).toBeNull();
    expect(s.olderThan5).toBeNull();
  });
  it("returns null with no units", () => {
    expect(summarise([], FETCHED_AT)).toBeNull();
  });
});

describe("CourtStat rows", () => {
  const snap: CourtsSnapshot = {
    v: 1,
    district: "mandya",
    state: "karnataka",
    fetchedAt: FETCHED_AT,
    units: [mandyaUnit()],
    missing: [],
    highCourt: null,
    highCourtFetchedAt: null,
  };
  it("writes this year's filed / decided so far and today's waiting", () => {
    expect(courtStatRows(snap)).toEqual([
      { courtName: "Mandya", year: 2026, filed: 31722, disposed: 33374, pending: 84106, source: "NJDG district dashboard · read 2026-09-27" },
    ]);
  });
  it("round-trips the read date through the source text", () => {
    expect(courtStatReadDate(courtStatSource(FETCHED_AT))).toBe("2026-09-27");
    expect(courtStatReadDate("NJDG / ecourts.gov.in")).toBeNull();
    expect(courtStatReadDate(null)).toBeNull();
  });
  it("uses the Indian calendar year", () => {
    expect(istYear("2026-12-31T20:00:00Z")).toBe(2027);
  });
});

describe("sources", () => {
  it("maps every live district to at least one NJDG unit, and each live state to its High Court", () => {
    const live = INDIA_STATES.flatMap((s) => getActiveDistricts(s.slug).map((d) => ({ state: s.slug, district: d.slug })));
    expect(live.length).toBeGreaterThan(0);
    for (const { state, district } of live) {
      expect(hasNjdgSource(district), district).toBe(true);
      expect(highCourtFor(state), state).not.toBeNull();
    }
  });
  it("never lists the same NJDG unit twice", () => {
    const keys = Object.values(NJDG_DISTRICT_UNITS).flat().map((u) => `${u.stateCode}/${u.distCode}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("knows each live state's High Court", () => {
    expect(highCourtFor("karnataka")?.stateCode).toBe("29~3");
    expect(highCourtFor("nowhere")).toBeNull();
    expect(njdgUnitsFor("mumbai").length).toBe(4);
  });
});
