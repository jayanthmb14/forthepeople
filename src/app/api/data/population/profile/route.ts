/**
 * ForThePeople.in — Demographic profile endpoint
 *
 * GET /api/data/population/profile?district=<slug>&state=<slug>&year=<yyyy>&dataset=<name>
 *
 * Returns the full DemographicProfile for a district, plus the list of all
 * (year, dataset) pairs available so the UI can offer a dataset selector.
 * Public, cacheable, no auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { censusOnlyProfile, reconcileCensusProfile } from "@/lib/census-2011";
import { loadCensus2011 } from "@/lib/census-2011-db";

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district");
  const stateSlug = sp.get("state");
  const yearParam = sp.get("year");
  const datasetParam = sp.get("dataset");

  if (!districtSlug || !stateSlug) {
    return NextResponse.json(
      { error: "district and state params required" },
      { status: 400 },
    );
  }

  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) {
    return NextResponse.json({ error: "State not found" }, { status: 404 });
  }

  const district = await prisma.district.findUnique({
    where: { stateId_slug: { stateId: state.id, slug: districtSlug } },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  // The checked Census 2011 row (PopulationHistory). Its core numbers win
  // over the hand-seeded profile's (Sept 2026 audit, src/lib/census-2011.ts).
  const [allDatasets, census] = await Promise.all([
    prisma.demographicProfile.findMany({
      where: { districtId: district.id },
      select: { year: true, dataset: true },
      orderBy: [{ year: "desc" }, { dataset: "asc" }],
    }),
    loadCensus2011(district.id),
  ]);

  if (allDatasets.length === 0 && !census) {
    return NextResponse.json({
      data: null,
      allDatasets: [],
      meta: {
        lastUpdated: null,
        dataAgeDays: null,
        boundaryVintage: null,
      },
    });
  }

  const explicitYear = yearParam ? Number.parseInt(yearParam, 10) : null;
  const explicitDataset = datasetParam ?? null;

  // Primary profile selection:
  //   - If caller specified year and/or dataset, honour those filters.
  //   - Otherwise default to Census 2011 (the richest single-profile baseline).
  //   - If no Census 2011 row exists, fall back to the most recent profile.
  const where: { districtId: string; year?: number; dataset?: string } = {
    districtId: district.id,
  };
  if (explicitYear != null && Number.isFinite(explicitYear)) where.year = explicitYear;
  if (explicitDataset) where.dataset = explicitDataset;
  if (explicitYear == null && !explicitDataset) where.dataset = "Census 2011";

  let primary = await prisma.demographicProfile.findFirst({
    where,
    orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
  });

  // Fallback: prefer rows with real data, avoid empty NFHS-5 placeholders.
  // Dataset constraint is deliberately dropped here — the primary findFirst
  // already tried `dataset = "Census 2011"` and returned null.
  if (!primary && explicitYear == null && !explicitDataset) {
    primary = await prisma.demographicProfile.findFirst({
      where: {
        districtId: district.id,
        OR: [
          { totalPopulation: { not: null } },
          { dataset: "Census 2011" },
        ],
      },
      orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
    });
  }

  // No Census 2011 profile row but a checked Census row (Pune): build the
  // core Census profile from it rather than falling back to another
  // dataset or saying "not available".
  let data: ReturnType<typeof censusOnlyProfile> | NonNullable<typeof primary> | null = primary;
  const noCensusProfile = explicitYear == null && !explicitDataset && primary?.dataset !== "Census 2011";
  if (census && noCensusProfile) {
    data = censusOnlyProfile(district.id, census);
    if (!allDatasets.some((d) => d.dataset === "Census 2011")) allDatasets.push({ year: 2011, dataset: "Census 2011" });
  } else if (primary) {
    data = reconcileCensusProfile(primary, census);
  }

  // Overlay economicClass from the latest NITI MPI profile so the page's
  // MPI section renders even when the primary row is Census 2011.
  // Only overlay when no explicit filter was given (we want /profile?dataset=X
  // to return exactly that row without mutation).
  if (data && explicitYear == null && !explicitDataset) {
    const mpi = await prisma.demographicProfile.findFirst({
      where: { districtId: district.id, dataset: "NITI MPI 2023" },
      orderBy: [{ year: "desc" }],
    });
    if (mpi?.economicClass != null && data.economicClass == null) {
      data = { ...data, economicClass: mpi.economicClass };
    }
  }

  const publishedAt = data?.publishedAt ?? data?.retrievedAt ?? null;
  const dataAgeDays = publishedAt
    ? Math.floor((Date.now() - publishedAt.getTime()) / 86_400_000)
    : null;

  return NextResponse.json({
    data,
    allDatasets,
    meta: {
      lastUpdated: data?.updatedAt?.toISOString() ?? null,
      dataAgeDays,
      boundaryVintage: data?.boundaryVintage ?? null,
    },
  });
}
