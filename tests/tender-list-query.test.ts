/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { NOT_STUB_TENDER } from "@/lib/data-filters";
import { parseTenderQuery } from "@/lib/tenders/list-query";

const NOW = new Date("2026-09-28T06:00:00Z");
const parse = (qs: string) => parseTenderQuery(new URLSearchParams(qs), "Pune", NOW);

describe("parseTenderQuery (GET /api/tenders/<district>)", () => {
  it("answers 400 for numbers that are not whole numbers (they used to throw a 500 or send NaN)", () => {
    for (const qs of ["valueMin=1.5", "valueMax=abc", "valueMin=-3", "page=abc", "page=2x", "pageSize=1e3", "daysToDeadline=seven", "daysToDeadline=99999"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
    }
  });

  it("builds the same where / order as before for good values", () => {
    const r = parse("status=LIVE&page=2&pageSize=20&valueMin=1000000&valueMax=50000000&category=works&mseReserved=true&search=%20road%20");
    expect(r).toEqual({
      ok: true,
      query: {
        page: 2,
        pageSize: 20,
        where: {
          locationDistrict: "Pune",
          ...NOT_STUB_TENDER,
          bidSubmissionEnd: { gte: NOW },
          estimatedValueInr: { gte: BigInt(1000000), lte: BigInt(50000000) },
          category: { slug: "works" },
          mseReserved: true,
          title: { contains: "road", mode: "insensitive" },
        },
        orderBy: { bidSubmissionEnd: "asc" },
      },
    });
  });

  it("keeps the defaults and clamps page and page size", () => {
    const r = parse("");
    expect(r.ok && r.query).toMatchObject({ page: 1, pageSize: 20, where: { bidSubmissionEnd: { gte: NOW } } });
    const clamped = parse("page=0&pageSize=500&sortBy=value");
    expect(clamped.ok && clamped.query).toMatchObject({ page: 1, pageSize: 100, orderBy: { estimatedValueInr: "desc" } });
  });

  it("caps the deadline window by days, on top of the status bucket", () => {
    const r = parse("status=CLOSING_SOON&daysToDeadline=1");
    expect(r.ok && r.query.where.bidSubmissionEnd).toEqual({ gte: NOW, lte: new Date(NOW.getTime() + 86400_000) });
  });
});
