/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it, vi } from "vitest";

// data-filters imports collector modules that pull in the Prisma client.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { ACTIVE_TRANSPORT, BORN_HERE_PERSONALITY, isOfficialStaffingRow } from "@/lib/data-filters";
import { cleanSchoolAddress, schoolForDisplay } from "@/lib/school-rows";

describe("listed schools (Sept 2026 audit)", () => {
  it("keeps only the address before a note", () => {
    expect(cleanSchoolAddress("Wellesley Road, Shivajinagar, Pune 411005 | Founded 1854. ~3,500 students.")).toBe(
      "Wellesley Road, Shivajinagar, Pune 411005",
    );
    expect(
      cleanSchoolAddress("Gat No. 1270, Lavale, Pune — 412115. // Private university … // Primary source: FLAME | https://www.flame.edu.in/"),
    ).toBe("Gat No. 1270, Lavale, Pune — 412115.");
    expect(cleanSchoolAddress("St Mark's Road, Bengaluru 560001")).toBe("St Mark's Road, Bengaluru 560001");
    expect(cleanSchoolAddress(null)).toBeNull();
  });

  it("hides per-school counts unless the school has a UDISE+ code", () => {
    const seeded = { id: "a", udiseCode: null, address: "x", students: 3000, teachers: 118, studentTeacherRatio: 25 };
    expect(schoolForDisplay(seeded)).toMatchObject({ students: null, teachers: null, studentTeacherRatio: null });
    const checked = { ...seeded, udiseCode: "29200100101" };
    expect(schoolForDisplay(checked)).toMatchObject({ students: 3000, teachers: 118, studentTeacherRatio: 25 });
  });
});

describe("staffing rows", () => {
  it("shows only rows whose source is a government site", () => {
    expect(isOfficialStaffingRow({ sourceUrl: "https://news.google.com/rss/articles/CBM123" })).toBe(false);
    expect(isOfficialStaffingRow({ sourceUrl: null })).toBe(false);
    expect(isOfficialStaffingRow({ sourceUrl: "https://hfwcom.karnataka.gov.in/staff.pdf" })).toBe(true);
    expect(isOfficialStaffingRow({ sourceUrl: "https://mysore.nic.in/en/departments/" })).toBe(true);
    expect(isOfficialStaffingRow({ sourceUrl: "https://example.com/?u=karnataka.gov.in" })).toBe(false);
  });
});

describe("row filters", () => {
  it("famous people must be born in the district and active", () => {
    expect(BORN_HERE_PERSONALITY).toEqual({ active: true, bornInDistrict: true });
  });
  it("transport rows must be active", () => {
    expect(ACTIVE_TRANSPORT).toEqual({ active: true });
  });
});
