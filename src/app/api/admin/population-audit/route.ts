/**
 * ForThePeople.in — Admin Population Audit endpoint.
 *
 * Returns per-district completeness grid for the demographic profile system.
 * Read-only, admin-auth gated, always fresh (revalidate=0).
 */

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const revalidate = 0;

function isPresent(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return v.length > 0;
  return Object.keys(v as Record<string, unknown>).length > 0;
}

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const districts = await prisma.district.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      active: true,
      state: { select: { slug: true, name: true } },
      demographicProfiles: {
        select: {
          id: true,
          dataset: true,
          year: true,
          level: true,
          sourceName: true,
          sourceUrl: true,
          notes: true,
          religion: true,
          caste: true,
          employment: true,
          education: true,
          migration: true,
          disability: true,
          language: true,
          householdAmenities: true,
          maritalStatus: true,
          economicClass: true,
        },
        orderBy: [{ year: "desc" }, { dataset: "asc" }],
      },
    },
    orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
  });

  const rows = districts.map((d) => {
    const profiles = d.demographicProfiles;
    const census = profiles.find((p) => p.dataset === "Census 2011");
    const nfhs5 = profiles.find((p) => p.dataset === "NFHS-5");
    const mpi = profiles.find((p) => p.dataset === "NITI MPI 2023");

    // NFHS-5 status: "data" if any of the expected JSONB keys is populated,
    // "placeholder" if the row exists but all such keys are null, "none" otherwise.
    let nfhs5Status: "data" | "placeholder" | "none" = "none";
    if (nfhs5) {
      const anyPresent =
        isPresent(nfhs5.householdAmenities) ||
        isPresent(nfhs5.maritalStatus) ||
        isPresent(nfhs5.religion) ||
        isPresent(nfhs5.caste);
      nfhs5Status = anyPresent ? "data" : "placeholder";
    }

    // Dimension flags: true if ANY profile for the district has that JSONB populated.
    const hasAny = <K extends keyof (typeof profiles)[number]>(key: K) =>
      profiles.some((p) => isPresent(p[key]));

    return {
      stateSlug: d.state.slug,
      stateName: d.state.name,
      districtSlug: d.slug,
      districtName: d.name,
      active: d.active,
      census2011: Boolean(census),
      nfhs5: nfhs5Status,
      mpi: Boolean(mpi),
      religion: hasAny("religion"),
      caste: hasAny("caste"),
      employment: hasAny("employment"),
      education: hasAny("education"),
      migration: hasAny("migration"),
      disability: hasAny("disability"),
      language: hasAny("language"),
      householdAmenities: hasAny("householdAmenities"),
      maritalStatus: hasAny("maritalStatus"),
      economicClass: hasAny("economicClass"),
      profiles,
    };
  });

  const summary = {
    totalDistricts: rows.length,
    activeDistricts: rows.filter((r) => r.active).length,
    lockedDistricts: rows.filter((r) => !r.active).length,
    districtsWithAnyProfile: rows.filter((r) => r.profiles.length > 0).length,
    districtsWithCensus2011: rows.filter((r) => r.census2011).length,
    districtsWithNFHS5: rows.filter((r) => r.nfhs5 !== "none").length,
    districtsWithNFHS5Placeholder: rows.filter((r) => r.nfhs5 === "placeholder").length,
    districtsWithNFHS5Data: rows.filter((r) => r.nfhs5 === "data").length,
    districtsWithMPI: rows.filter((r) => r.mpi).length,
    districtsWithZeroProfiles: rows.filter((r) => r.profiles.length === 0).length,
  };

  return NextResponse.json({ summary, districts: rows });
}
