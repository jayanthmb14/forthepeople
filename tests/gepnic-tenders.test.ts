/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// State GePNIC tender portals: parsers and checks (src/scraper/lib/gepnic.ts).
// Fixtures are real mahatenders.gov.in pages from 27 Sep 2026, trimmed.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  GEPNIC_ORGS,
  GEPNIC_PORTALS,
  detailProblems,
  parseIstDateTime,
  parseOrgList,
  parseOrgTenders,
  parseRupees,
  parseTenderDetail,
  procurementTypeOf,
  workTypeOf,
} from "@/scraper/lib/gepnic";

const page = (name: string) => readFileSync(path.join(__dirname, "fixtures/collectors", name), "utf8");
const APP = GEPNIC_PORTALS.maharashtra.app;

describe("parseIstDateTime (portal dates are Indian time)", () => {
  it("converts to UTC", () => {
    expect(parseIstDateTime("25-Sep-2026 11:00 AM")!.toISOString()).toBe("2026-09-25T05:30:00.000Z");
    expect(parseIstDateTime("02-Oct-2026 05:00 PM")!.toISOString()).toBe("2026-10-02T11:30:00.000Z");
    expect(parseIstDateTime("01-Jan-2027 12:15 AM")!.toISOString()).toBe("2026-12-31T18:45:00.000Z");
  });
  it("rejects NA and impossible dates", () => {
    expect(parseIstDateTime("NA")).toBeNull();
    expect(parseIstDateTime("31-Feb-2026 10:00 AM")).toBeNull();
    expect(parseIstDateTime("")).toBeNull();
  });
});

describe("organisation list and an organisation's tenders", () => {
  it("reads organisations with their counts and absolute links", () => {
    const orgs = parseOrgList(page("gepnic-orgs-maharashtra.html"), APP);
    const pmc = orgs.find((o) => o.name === "Pune Municipal Corporation")!;
    expect(pmc.count).toBe(463);
    expect(pmc.href).toMatch(/^https:\/\/mahatenders\.gov\.in\/nicgep\/app\?component=%24DirectLink&page=FrontEndTendersByOrganisation/);
    expect(orgs.find((o) => o.name === "RDD-CEO-PUNE")!.count).toBe(65);
  });

  it("every followed organisation is a known portal + district pair", () => {
    for (const [slug, orgs] of Object.entries(GEPNIC_ORGS)) {
      expect(orgs.length).toBeGreaterThan(0);
      for (const o of orgs) expect(o.shortCode).toMatch(/^[A-Z]{2}_[A-Z0-9_]+$/);
      expect(slug).toMatch(/^[a-z-]+$/);
    }
  });

  it("reads the listing rows: id, ref no, title, IST dates, organisation chain", () => {
    const rows = parseOrgTenders(page("gepnic-org-tenders-zp-pune.html"), APP);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      tenderId: "2026_RDPUN_1341329_1",
      refNo: "gpmarunji/2026/27-1",
      title: "light maintance",
      orgChain: ["RDD-CEO-PUNE", "PUNE-Dy. CEO V.P.", "MULSHI", "MARUNJI"],
    });
    expect(rows[0].closingAt!.toISOString()).toBe("2026-10-02T11:30:00.000Z");
    expect(rows[0].href).toMatch(/page=FrontEndViewTender/);
  });
});

describe("a tender's own page", () => {
  const d = parseTenderDetail(page("gepnic-tender-2026_RDPUN_1341329_1.html"))!;

  it("reads type, category, money in whole rupees, place and dates", () => {
    expect(d).toMatchObject({
      tenderId: "2026_RDPUN_1341329_1",
      refNo: "gpmarunji/2026/27-1",
      title: "light maintance",
      description: null, // same as the title on this tender
      tenderType: "Open Tender",
      tenderCategory: "Services",
      valueInr: BigInt(3_000_000),
      emdInr: BigInt(30_000),
      feeInr: BigInt(2_000),
      covers: 2,
      location: "marunji",
      pincode: "411057",
    });
    expect(d.orgChain[0]).toBe("RDD-CEO-PUNE");
    expect(d.publishedAt!.toISOString()).toBe("2026-09-25T05:30:00.000Z");
    expect(d.bidEndAt!.toISOString()).toBe("2026-10-02T11:30:00.000Z");
    expect(d.preBidAt).toBeNull(); // "NA" on the portal
  });

  it("agrees with its listing row; disagreement is caught", () => {
    const listed = parseOrgTenders(page("gepnic-org-tenders-zp-pune.html"), APP)[0];
    const now = new Date("2026-09-27T12:00:00Z");
    expect(detailProblems(listed, d, "RDD-CEO-PUNE", now)).toEqual([]);
    expect(detailProblems({ ...listed, tenderId: "2026_RDPUN_1_1" }, d, "RDD-CEO-PUNE", now)).not.toEqual([]);
    expect(detailProblems({ ...listed, closingAt: new Date("2026-10-09T11:30:00Z") }, d, "RDD-CEO-PUNE", now)).not.toEqual([]);
    expect(detailProblems(listed, d, "Pune Municipal Corporation", now)).not.toEqual([]);
  });

  it("returns null for a page that is not a tender", () => {
    expect(parseTenderDetail("<html><body>Session expired</body></html>")).toBeNull();
  });
});

describe("value helpers", () => {
  it("treats blank, NA and 0.00 as not published, never zero", () => {
    expect(parseRupees("30,00,000")).toBe(BigInt(3_000_000));
    expect(parseRupees("0.00")).toBeNull();
    expect(parseRupees("NA")).toBeNull();
    expect(parseRupees(undefined)).toBeNull();
  });
  it("maps the portal's words, keeping unknown ones as published", () => {
    expect(workTypeOf("Works")).toBe("WORKS");
    expect(workTypeOf("Goods")).toBe("GOODS");
    expect(workTypeOf("Services")).toBe("SERVICES");
    expect(workTypeOf("Works and Services")).toBe("WORKS AND SERVICES");
    expect(procurementTypeOf("Open Tender")).toBe("OPEN");
    expect(procurementTypeOf("Limited")).toBe("LIMITED");
    expect(procurementTypeOf("Something New")).toBe("SOMETHING NEW");
  });
});
