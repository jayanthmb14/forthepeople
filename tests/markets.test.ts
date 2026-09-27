/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Pure helpers behind /prices and the market ticker (src/lib/markets/compute.ts).
 */
import { describe, expect, it } from "vitest";
import {
  ageInDays,
  beforeNow,
  chartWindow,
  cleanSeries,
  ddmmyyyyToIso,
  isStale,
  latestWithChange,
  minusMonths,
  parseIbjaHtml,
  parseYahooChart,
  pointOnOrBefore,
  scaleSeries,
} from "@/lib/markets/compute";

const q = (o: unknown) => JSON.stringify(o).replace(/"/g, "&quot;");

// A trimmed copy of the two hidden fields on ibjarates.com (27 Sep 2026).
const IBJA_HTML = `
<input type="hidden" name="HdnGold" id="HdnGold" value="${q({
  labels: ["22/09/2026", "23/09/2026", "24/09/2026", "25/09/2026"],
  purity999: [152132, 152016, 150785, 152113],
  purity916: [139353, 139247, 138119, 139336],
})}" />
<input type="hidden" name="HdnGoldLabel" id="HdnGoldLabel" />
<input type="hidden" name="HdnSilver" id="HdnSilver" value="${q({
  labels: ["22/09/2026", "23/09/2026", "24/09/2026", "25/09/2026"],
  silverRate: [232922, 232766, 228248, 232350],
})}" />`;

describe("IBJA parser", () => {
  it("reads gold 999 / 916 (per 10 g) and silver from silverRate (per kg)", () => {
    const s = parseIbjaHtml(IBJA_HTML);
    expect(s.gold999Per10g.at(-1)).toEqual({ d: "2026-09-25", v: 152113 });
    expect(s.gold916Per10g.at(-1)).toEqual({ d: "2026-09-25", v: 139336 });
    expect(s.silverPerKg).toHaveLength(4);
    expect(s.silverPerKg.at(-1)).toEqual({ d: "2026-09-25", v: 232350 });
  });

  it("returns empty series for a page without the fields", () => {
    const s = parseIbjaHtml("<html><body>Rates are not published</body></html>");
    expect(s.gold999Per10g).toEqual([]);
    expect(s.silverPerKg).toEqual([]);
  });

  it("gold per gram = per 10 g ÷ 10", () => {
    const s = parseIbjaHtml(IBJA_HTML);
    expect(scaleSeries(s.gold999Per10g, 10).at(-1)?.v).toBeCloseTo(15211.3, 5);
  });

  it("dd/mm/yyyy → yyyy-mm-dd", () => {
    expect(ddmmyyyyToIso("5/9/2026")).toBe("2026-09-05");
    expect(ddmmyyyyToIso("2026-09-05")).toBeNull();
  });
});

describe("Yahoo parser", () => {
  it("builds daily closes in the exchange's day and drops nulls", () => {
    // 03:45 UTC = 09:15 IST (NSE open); gmtoffset 19800 = IST.
    const json = {
      chart: {
        result: [
          {
            meta: { regularMarketTime: Date.parse("2026-09-25T10:02:14Z") / 1000, regularMarketPrice: 23140.5, gmtoffset: 19800, currency: "INR" },
            timestamp: [
              Date.parse("2026-09-23T03:45:00Z") / 1000,
              Date.parse("2026-09-24T03:45:00Z") / 1000,
              Date.parse("2026-09-25T03:45:00Z") / 1000,
            ],
            indicators: { quote: [{ close: [23300, null, 23140.5] }] },
          },
        ],
      },
    };
    const y = parseYahooChart(json);
    expect(y?.points).toEqual([
      { d: "2026-09-23", v: 23300 },
      { d: "2026-09-25", v: 23140.5 },
    ]);
    expect(y?.asOf).toBe("2026-09-25T10:02:14.000Z");
    expect(y?.currency).toBe("INR");
  });

  it("puts an FX bar stamped 23:00 UTC on the next London day", () => {
    const json = {
      chart: {
        result: [
          {
            meta: { gmtoffset: 3600 },
            timestamp: [Date.parse("2026-06-24T23:00:00Z") / 1000],
            indicators: { quote: [{ close: [94.44] }] },
          },
        ],
      },
    };
    expect(parseYahooChart(json)?.points[0].d).toBe("2026-06-25");
  });

  it("returns null for an error body", () => {
    expect(parseYahooChart({ chart: { result: null, error: { code: "Too Many Requests" } } })).toBeNull();
    expect(parseYahooChart(null)).toBeNull();
  });
});

describe("series arithmetic", () => {
  const pts = cleanSeries([
    { d: "2026-06-24", v: 100 },
    { d: "2026-06-25", v: 101 },
    { d: "2026-08-25", v: 110 },
    { d: "2026-09-17", v: 118 },
    { d: "2026-09-18", v: 119 },
    { d: "2026-09-24", v: 121 },
    { d: "2026-09-25", v: 120 },
    { d: "2026-09-25", v: 125 }, // same day twice → the later value wins
  ]);

  it("cleanSeries sorts, de-duplicates and drops bad values", () => {
    expect(cleanSeries([{ d: "2026-01-02", v: 2 }, { d: "2026-01-01", v: null }, { d: "2026-01-01", v: -1 }, { d: "x", v: 3 }])).toEqual([
      { d: "2026-01-02", v: 2 },
    ]);
    expect(pts.at(-1)).toEqual({ d: "2026-09-25", v: 125 });
  });

  it("latestWithChange compares with the previous trading day", () => {
    const lw = latestWithChange(pts);
    expect(lw?.previous?.d).toBe("2026-09-24");
    expect(lw?.change?.abs).toBe(4);
    expect(lw?.change?.direction).toBe("up");
  });

  it("pointOnOrBefore picks the last trading day on or before the date", () => {
    expect(pointOnOrBefore(pts, "2026-09-18")?.v).toBe(119);
    expect(pointOnOrBefore(pts, "2026-09-20")?.d).toBe("2026-09-18");
    expect(pointOnOrBefore(pts, "2026-01-01")).toBeNull();
  });

  it("beforeNow gives 1 week, 1 month and 3 months back", () => {
    const rows = beforeNow(pts);
    expect(rows.map((r) => [r.span, r.before.d])).toEqual([
      ["week", "2026-09-18"],
      ["month", "2026-08-25"],
      ["quarter", "2026-06-25"],
    ]);
    expect(rows[2].change.pct).toBeCloseTo(((125 - 101) / 101) * 100, 6);
  });

  it("beforeNow leaves out a span the series does not reach", () => {
    const short = cleanSeries([{ d: "2026-09-01", v: 1 }, { d: "2026-09-25", v: 2 }]);
    expect(beforeNow(short).map((r) => r.span)).toEqual(["week"]);
  });

  it("chartWindow starts at the 3-month point", () => {
    expect(chartWindow(pts)[0].d).toBe("2026-06-25");
  });

  it("minusMonths clamps to the end of a shorter month", () => {
    expect(minusMonths("2026-05-31", 3)).toBe("2026-02-28");
    expect(minusMonths("2026-01-15", 1)).toBe("2025-12-15");
  });

  it("age and staleness count days in India", () => {
    const mondayMorning = Date.parse("2026-09-28T02:00:00Z"); // Mon 28 Sep, 07:30 IST
    expect(ageInDays("2026-09-25", mondayMorning)).toBe(3);
    expect(ageInDays("2026-09-25", Date.parse("2026-09-27T18:00:00Z"))).toBe(2); // Sun 23:30 IST
    expect(isStale("2026-09-25", mondayMorning)).toBe(false);
    expect(isStale("2026-09-20", mondayMorning)).toBe(true);
  });
});
