/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Petrol and diesel prices (src/scraper/lib/fuel-prices.ts, pdf-text.ts):
 * reading PPAC's "as on" lines and metro table and BPCL's Delhi price
 * build-up, and the double-check that decides whether anything is stored.
 * Fixtures in tests/fixtures/collectors/ are real replies from 27 Sep 2026,
 * trimmed (the PDFs as their inflated page content, drawing removed).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { contentTextRuns, pdfLines, pdfTextRuns } from "@/scraper/lib/pdf-text";
import {
  fuelDay,
  isFuelSnapshot,
  metroPdfDay,
  parseBpclBuildUp,
  parsePpacHome,
  parsePpacMetroTable,
  ppacMetroPdfLinks,
  verifyFuel,
  type FuelInputs,
} from "@/scraper/lib/fuel-prices";

const fx = (name: string) => readFileSync(path.join(__dirname, "fixtures/collectors", name), "latin1");
const utf8 = (name: string) => readFileSync(path.join(__dirname, "fixtures/collectors", name), "utf8");
const linesOf = (content: string) => pdfLines(contentTextRuns(content));

/** A minimal one-stream PDF around a page content stream (Flate, like the real files). */
function pdfOf(content: string, extra = ""): Buffer {
  const body = deflateSync(Buffer.from(content, "latin1"));
  return Buffer.concat([
    Buffer.from(`%PDF-1.7\r\n%\xb5\xb5\r\n${extra}4 0 obj\r\n<</Filter/FlateDecode/Length ${body.length}>>\r\nstream\r\n`, "latin1"),
    body,
    Buffer.from("\r\nendstream\r\nendobj\r\n%%EOF\r\n", "latin1"),
  ]);
}

const METRO = fx("ppac-metro-2026-09-25.p1.txt");
const BPCL_MS = fx("bpcl-ms-delhi-2026-08-01.txt");
const BPCL_HSD = fx("bpcl-hsd-delhi-2026-08-01.txt");
const HOME = utf8("ppac-home-2026-09-27.html");
const METRO_PAGE = utf8("ppac-metro-page-2026-09-27.html");

describe("pdf-text", () => {
  it("reads a Flate content stream into positioned lines, top to bottom", () => {
    const lines = pdfLines(pdfTextRuns(pdfOf(BPCL_MS)));
    expect(lines[0]).toEqual(["Price Build-up of Petrol at Delhi at BPCL Retail Pump Outlets"]);
    expect(lines).toContainEqual(["4", "Retail Selling Price at Delhi (Rounded)", "Rs/ltr", "102.12"]);
  });

  it("skips font programs and gives nothing for a file that is not a PDF", () => {
    const font = "1 0 obj\r\n<</Length1 12/Filter/FlateDecode/Length 3>>\r\nstream\r\nxyz\r\nendstream\r\nendobj\r\n";
    expect(pdfLines(pdfTextRuns(pdfOf(BPCL_HSD, font)))[0][0]).toContain("Price Build-up of Diesel");
    expect(pdfTextRuns(Buffer.from("<html>Access denied</html>"))).toEqual([]);
  });

  it("joins the kerned pieces of a TJ array and keeps escaped brackets", () => {
    const runs = contentTextRuns("BT 1 0 0 1 10 700 Tm [(25-)9(Sep-)9(26)] TJ ET BT 1 0 0 1 10 680 Tm (Rs \\(ltr\\)) Tj ET");
    expect(runs.map((r) => [r.text, r.y])).toEqual([
      ["25-Sep-26", 700],
      ["Rs (ltr)", 680],
    ]);
  });
});

describe("dates", () => {
  it("reads the three date styles the sources print", () => {
    expect(fuelDay("25-Sep-26")).toBe("2026-09-25");
    expect(fuelDay("1-Aug-26")).toBe("2026-08-01");
    expect(fuelDay("25-September-2026")).toBe("2026-09-25");
    expect(fuelDay("31-Feb-26")).toBeNull();
    expect(fuelDay("Effective")).toBeNull();
  });
  it("reads the day in a metro table's file name", () => {
    expect(metroPdfDay("https://ppac.gov.in/uploads/page-images/1790341801_PP_9_a_DailyPriceMSHSD_Metro_25.09.2026.pdf")).toBe("2026-09-25");
  });
});

describe("PPAC", () => {
  it("home page: the Delhi 'as on' lines and their table link", () => {
    const home = parsePpacHome(HOME);
    expect(home.petrol).toEqual({
      fuel: "petrol",
      day: "2026-09-25",
      rsp: 102.12,
      href: "https://ppac.gov.in/download.php?file=importantnews/1790314188_PP_9_a_DailyPriceMSHSD_Metro_25.09.2026.pdf",
    });
    expect(home.diesel?.rsp).toBe(95.2);
    expect(home.diesel?.day).toBe("2026-09-25");
  });

  it("home page: two lines that disagree leave that fuel out", () => {
    const twice = HOME.replace("</body>", '<a href="/x">RSP of Petrol in Delhi as per IOCL outlet as on 25-September-2026, Rs. 102.21/ltr</a></body>');
    const home = parsePpacHome(twice);
    expect(home.petrol).toBeUndefined();
    expect(home.diesel?.rsp).toBe(95.2);
  });

  it("finds the table links on the metro page and the home page, PPAC's own only", () => {
    expect(ppacMetroPdfLinks(METRO_PAGE)).toEqual(["https://ppac.gov.in/uploads/page-images/1790341801_PP_9_a_DailyPriceMSHSD_Metro_25.09.2026.pdf"]);
    expect(ppacMetroPdfLinks(HOME)).toHaveLength(2);
    expect(ppacMetroPdfLinks('<a href="https://evil.example/x_DailyPriceMSHSD_Metro_25.09.2026.pdf">')).toEqual([]);
  });

  it("metro table: the newest row, cities in the header's order", () => {
    const t = parsePpacMetroTable(linesOf(METRO));
    expect(t).not.toBeNull();
    expect(t!.posted).toBe("2026-09-25");
    expect(t!.rows).toBe(4);
    expect(t!.newest).toEqual({
      day: "2026-09-25",
      petrol: { Delhi: 102.12, Mumbai: 111.21, Chennai: 107.77, Kolkata: 113.51 },
      diesel: { Delhi: 95.2, Mumbai: 97.83, Chennai: 99.55, Kolkata: 99.82 },
    });
  });

  it("metro table: no header → nothing; a newest day printed twice with different prices → nothing", () => {
    const lines = linesOf(METRO);
    expect(parsePpacMetroTable(lines.filter((l) => l[0] !== "Delhi"))).toBeNull();
    const clash = [...lines, ["25-Sep-26", "102.13", "111.21", "107.77", "113.51", "25-Sep-26", "95.20", "97.83", "99.55", "99.82"]];
    expect(parsePpacMetroTable(clash)).toBeNull();
  });
});

describe("BPCL price build-up", () => {
  it("reads the Delhi retail price and the day it took effect", () => {
    expect(parseBpclBuildUp(linesOf(BPCL_MS))).toEqual({ fuel: "petrol", effective: "2026-08-01", rsp: 102.12 });
    expect(parseBpclBuildUp(linesOf(BPCL_HSD))).toEqual({ fuel: "diesel", effective: "2026-08-01", rsp: 95.2 });
  });
  it("gives nothing when the retail price line is missing", () => {
    expect(parseBpclBuildUp(linesOf(BPCL_MS).filter((l) => !l.join(" ").includes("Retail Selling Price")))).toBeNull();
  });
});

describe("verifyFuel — stored only when the sources agree", () => {
  const base = (): FuelInputs => ({
    home: parsePpacHome(HOME),
    table: parsePpacMetroTable(linesOf(METRO)),
    tableUrl: "https://ppac.gov.in/uploads/page-images/1790341801_PP_9_a_DailyPriceMSHSD_Metro_25.09.2026.pdf",
    bpcl: { petrol: parseBpclBuildUp(linesOf(BPCL_MS)), diesel: parseBpclBuildUp(linesOf(BPCL_HSD)) },
    today: "2026-09-28",
    fetchedAt: "2026-09-28T07:00:00.000Z",
  });

  it("all three agree → Delhi double-checked, the other metros from PPAC's table", () => {
    const r = verifyFuel(base());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.snapshot.asOf).toBe("2026-09-25");
    expect(r.snapshot.cities[0]).toEqual({ city: "Delhi", petrol: 102.12, diesel: 95.2, check: "double" });
    expect(r.snapshot.cities.slice(1).map((c) => [c.city, c.check])).toEqual([
      ["Mumbai", "single"],
      ["Chennai", "single"],
      ["Kolkata", "single"],
    ]);
    expect(r.snapshot.bpclEffective).toEqual({ petrol: "2026-08-01", diesel: "2026-08-01" });
    expect(isFuelSnapshot(r.snapshot)).toBe(true);
  });

  it("BPCL one paisa off → nothing stored", () => {
    const i = base();
    i.bpcl.diesel = { ...i.bpcl.diesel!, rsp: 95.21 };
    const r = verifyFuel(i);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problems.join(" ")).toContain("BPCL");
  });

  it("the table is from another day than the home page → nothing stored", () => {
    const i = base();
    i.table = { ...i.table!, newest: { ...i.table!.newest, day: "2026-09-24" } };
    expect(verifyFuel(i).ok).toBe(false);
  });

  it("a price that takes effect later, a day in the future, or a missing source → nothing stored", () => {
    const later = base();
    later.bpcl.petrol = { ...later.bpcl.petrol!, effective: "2026-10-01" };
    expect(verifyFuel(later).ok).toBe(false);

    const future = base();
    future.today = "2026-09-24";
    expect(verifyFuel(future).ok).toBe(false);

    const missing = base();
    missing.bpcl.petrol = null;
    expect(verifyFuel(missing).ok).toBe(false);

    const noTable = base();
    noTable.table = null;
    expect(verifyFuel(noTable).ok).toBe(false);
  });

  it("an implausible metro price → nothing stored", () => {
    const i = base();
    i.table = { ...i.table!, newest: { ...i.table!.newest, petrol: { ...i.table!.newest.petrol, Mumbai: 11.21 } } };
    expect(verifyFuel(i).ok).toBe(false);
  });

  it("a stored value of the wrong shape is never shown", () => {
    expect(isFuelSnapshot(null)).toBe(false);
    expect(isFuelSnapshot({ kind: "fuel", asOf: "2026-09-25", cities: [{ city: "Delhi", petrol: "102", diesel: 95.2, check: "double" }], sources: { ppacTable: "x" } })).toBe(false);
  });
});
