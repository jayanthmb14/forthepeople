/**
 * Karnataka MPI data — NITI Aayog National MPI 2023 Progress Review
 *
 * SOURCE:
 *   NITI Aayog (2023). India. National Multidimensional Poverty Index:
 *   A Progress Review 2023. NITI Aayog, Government of India, New Delhi.
 *   PDF: https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf
 *   Local audit copy: scripts/data-pdfs/niti-mpi-2023.pdf (22 MB, 410 pp)
 *   Extracted 2026-04-21 from bar chart (p. 132) + overview table (p. 128).
 *
 * METHODOLOGY:
 *   H  = Headcount Ratio (% of population multidimensionally poor)
 *   A  = Intensity (average deprivation share among the poor, %)
 *   MPI = H × A / 10000 (Alkire-Foster method)
 *   Values verified by MPI arithmetic for every row.
 *
 * SPELLING NOTE (applies to all state MPI seeds, not just Karnataka):
 *   Government sources use different English transliterations of the same
 *   district name. When seeding, the slug in code MUST match the slug in DB
 *   (which reflects our canonical hierarchy), NOT the PDF's spelling.
 *   Known Karnataka variants:
 *     NITI PDF "Bagalkote"  → DB "bagalkot"  (Census 2011 spelling)
 *     NITI PDF "Bangalore"  → DB "bengaluru-urban" / "bengaluru-rural"
 *     NITI PDF "Mysore"     → DB "mysuru"
 *     NITI PDF "Tumkur"     → DB "tumakuru"
 *     NITI PDF "Shimoga"    → DB "shivamogga"
 *     NITI PDF "Gulbarga"   → DB "kalaburagi"
 *     NITI PDF "Bellary"    → DB "ballari"
 *     NITI PDF "Bijapur"    → DB "vijayapura"
 *   Always verify slugs against DB before seeding a new state.
 *
 * WHAT'S SEEDED:
 *   - 30 districts × 2 time periods = 60 district-level MPI profiles
 *     (Vijayanagara excluded — bifurcated from Ballari in 2021, post-NFHS-5)
 *   - Karnataka state × 4 rows: total 2019-21, total 2015-16, rural 2019-21,
 *     urban 2019-21
 *   - District rank (within Karnataka) computed at seed time by sorting
 *     H 2019-21 ascending. Bengaluru Urban = rank 1 (best), Yadgir = rank 30.
 *
 * IDEMPOTENT: re-running the seed upserts by (districtId/stateId, year, dataset).
 */

import { PrismaClient, Prisma } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

// District MPI values (slug matches DB). Last entry: "bagalkot" (not "bagalkote"
// from NITI PDF) — Census 2011 spelling, see SPELLING NOTE above.
const KARNATAKA_DISTRICTS_MPI = [
  { slug: "yadgir",           h15: 41.67, a15: 46.99, mpi15: 0.196, h19: 25.38, a19: 45.59, mpi19: 0.116 },
  { slug: "uttara-kannada",   h15: 13.21, a15: 42.64, mpi15: 0.056, h19:  4.59, a19: 40.29, mpi19: 0.018 },
  { slug: "udupi",            h15: 10.32, a15: 41.24, mpi15: 0.043, h19:  4.13, a19: 36.51, mpi19: 0.015 },
  { slug: "tumakuru",         h15: 12.71, a15: 41.26, mpi15: 0.052, h19:  4.69, a19: 37.28, mpi19: 0.017 },
  { slug: "shivamogga",       h15: 12.64, a15: 40.95, mpi15: 0.052, h19:  3.39, a19: 38.41, mpi19: 0.013 },
  { slug: "ramanagara",       h15:  8.73, a15: 38.38, mpi15: 0.033, h19:  0.88, a19: 40.51, mpi19: 0.004 },
  { slug: "raichur",          h15: 31.65, a15: 45.54, mpi15: 0.144, h19: 20.19, a19: 44.61, mpi19: 0.090 },
  { slug: "mysuru",           h15:  7.79, a15: 41.16, mpi15: 0.032, h19:  2.30, a19: 36.82, mpi19: 0.008 },
  { slug: "mandya",           h15:  6.30, a15: 43.52, mpi15: 0.027, h19:  2.47, a19: 35.55, mpi19: 0.009 },
  { slug: "koppal",           h15: 24.31, a15: 42.50, mpi15: 0.103, h19: 18.04, a19: 43.35, mpi19: 0.078 },
  { slug: "kolar",            h15:  9.53, a15: 40.26, mpi15: 0.038, h19:  1.78, a19: 39.11, mpi19: 0.007 },
  { slug: "kodagu",           h15:  8.64, a15: 43.75, mpi15: 0.038, h19:  4.67, a19: 39.01, mpi19: 0.018 },
  { slug: "haveri",           h15: 15.28, a15: 41.12, mpi15: 0.063, h19: 11.38, a19: 39.19, mpi19: 0.045 },
  { slug: "hassan",           h15:  6.33, a15: 40.43, mpi15: 0.026, h19:  2.43, a19: 38.76, mpi19: 0.009 },
  { slug: "kalaburagi",       h15: 21.10, a15: 44.44, mpi15: 0.094, h19: 18.63, a19: 40.44, mpi19: 0.075 },
  { slug: "gadag",            h15: 19.50, a15: 43.28, mpi15: 0.084, h19: 15.32, a19: 40.64, mpi19: 0.062 },
  { slug: "dharwad",          h15:  9.53, a15: 40.27, mpi15: 0.038, h19:  5.71, a19: 39.07, mpi19: 0.022 },
  { slug: "davanagere",       h15: 11.46, a15: 42.59, mpi15: 0.049, h19:  5.95, a19: 38.68, mpi19: 0.023 },
  { slug: "dakshina-kannada", h15:  6.69, a15: 40.32, mpi15: 0.027, h19:  1.71, a19: 36.72, mpi19: 0.006 },
  { slug: "chitradurga",      h15: 14.81, a15: 41.29, mpi15: 0.061, h19:  5.84, a19: 39.23, mpi19: 0.023 },
  { slug: "chikkamagaluru",   h15:  9.98, a15: 41.81, mpi15: 0.042, h19:  3.74, a19: 39.80, mpi19: 0.015 },
  { slug: "chikkaballapur",   h15: 13.41, a15: 42.07, mpi15: 0.056, h19:  3.39, a19: 39.89, mpi19: 0.014 },
  { slug: "chamarajanagar",   h15: 18.45, a15: 42.02, mpi15: 0.078, h19:  5.15, a19: 40.83, mpi19: 0.021 },
  { slug: "vijayapura",       h15: 21.90, a15: 42.57, mpi15: 0.093, h19: 16.30, a19: 41.71, mpi19: 0.068 },
  { slug: "bidar",            h15: 18.99, a15: 41.64, mpi15: 0.079, h19: 11.25, a19: 40.00, mpi19: 0.045 },
  { slug: "ballari",          h15: 22.91, a15: 46.48, mpi15: 0.106, h19: 12.22, a19: 42.66, mpi19: 0.052 },
  { slug: "belagavi",         h15: 12.26, a15: 39.94, mpi15: 0.049, h19:  9.41, a19: 39.60, mpi19: 0.037 },
  { slug: "bengaluru-rural",  h15:  7.03, a15: 40.01, mpi15: 0.028, h19:  0.99, a19: 36.71, mpi19: 0.004 },
  { slug: "bengaluru-urban",  h15:  2.05, a15: 41.03, mpi15: 0.008, h19:  1.47, a19: 45.68, mpi19: 0.007 },
  { slug: "bagalkot",         h15: 19.94, a15: 43.41, mpi15: 0.087, h19: 10.85, a19: 40.74, mpi19: 0.044 },
] as const;

// Karnataka state aggregates (page 128 snapshot box).
const KARNATAKA_STATE_MPI = {
  total_h15: 12.77, total_a15: 42.76, total_mpi15: 0.055,
  total_h19:  7.58, total_a19: 41.21, total_mpi19: 0.031,
  rural_h15: 18.45, rural_a15: 42.87, rural_mpi15: 0.079,
  rural_h19: 10.33, rural_a19: 41.36, rural_mpi19: 0.043,
  urban_h15:  4.92, urban_a15: 42.22, urban_mpi15: 0.021,
  urban_h19:  3.22, urban_a19: 40.47, urban_mpi19: 0.013,
};

type CommonProvenance = {
  sourceName: string;
  sourceUrl: string;
  sourceLicense: string;
  retrievedAt: Date;
  publishedAt: Date;
};

async function upsertProfile(
  client: DBClient,
  data: Prisma.DemographicProfileUncheckedCreateInput,
): Promise<boolean> {
  const existing = await client.demographicProfile.findFirst({
    where: {
      districtId: data.districtId as string,
      year: data.year as number,
      dataset: data.dataset as string,
    },
  });
  if (existing) return false;
  await client.demographicProfile.create({ data });
  return true;
}

async function upsertStateProfile(
  client: DBClient,
  stateId: string,
  year: number,
  dataset: string,
  economicClass: Prisma.InputJsonValue,
  notes: string,
  common: CommonProvenance,
): Promise<boolean> {
  const existing = await client.demographicProfile.findFirst({
    where: { stateId, level: "STATE", year, dataset },
  });
  if (existing) return false;
  await client.demographicProfile.create({
    data: {
      stateId,
      level: "STATE",
      year,
      dataset,
      economicClass,
      notes,
      ...common,
    },
  });
  return true;
}

export async function seedKarnatakaMPI(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📊 Seeding Karnataka MPI (NITI 2023)...");

    const karnataka = await client.state.findUniqueOrThrow({
      where: { slug: "karnataka" },
    });

    // Rank districts by H 2019-21 ASC (lower H = better rank, rank 1 = best).
    const rankMap = new Map<string, number>();
    [...KARNATAKA_DISTRICTS_MPI]
      .sort((a, b) => a.h19 - b.h19)
      .forEach((d, i) => rankMap.set(d.slug, i + 1));

    const COMMON: CommonProvenance = {
      sourceName: "NITI Aayog, Government of India",
      sourceUrl:
        "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf",
      sourceLicense: "Public",
      retrievedAt: new Date(),
      publishedAt: new Date("2023-07-17"),
    };

    let districtRowsCreated = 0;
    let districtsSkipped = 0;

    for (const d of KARNATAKA_DISTRICTS_MPI) {
      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: karnataka.id, slug: d.slug } },
      });
      if (!district) {
        console.log(`  ⚠️  District not found: ${d.slug} — SKIPPED`);
        districtsSkipped++;
        continue;
      }

      const rank = rankMap.get(d.slug)!;

      // 2019-21 (current, from NFHS-5)
      const c19 = await upsertProfile(client, {
        districtId: district.id,
        level: "DISTRICT",
        year: 2021,
        dataset: "NITI MPI 2023",
        economicClass: {
          mpiHeadcount: d.h19,
          mpiIntensity: d.a19,
          mpi: d.mpi19,
          districtRankInState: rank,
          totalDistrictsInState: KARNATAKA_DISTRICTS_MPI.length,
          source: "NITI Aayog 2023 (NFHS-5)",
        },
        notes: `NITI MPI 2023 Progress Review, district bar chart p. 132. District rank ${rank}/${KARNATAKA_DISTRICTS_MPI.length} within Karnataka (H ascending, lower is better).`,
        ...COMMON,
      });
      if (c19) districtRowsCreated++;

      // 2015-16 (baseline, from NFHS-4)
      const c15 = await upsertProfile(client, {
        districtId: district.id,
        level: "DISTRICT",
        year: 2016,
        dataset: "NITI MPI 2021 Baseline",
        economicClass: {
          mpiHeadcount: d.h15,
          mpiIntensity: d.a15,
          mpi: d.mpi15,
          source: "NITI Aayog 2023 (NFHS-4 baseline)",
        },
        notes:
          "NFHS-4 (2015-16) baseline from NITI MPI 2023 Progress Review.",
        ...COMMON,
      });
      if (c15) districtRowsCreated++;
    }

    // State rows (4 total)
    const K = KARNATAKA_STATE_MPI;

    const s1 = await upsertStateProfile(
      client,
      karnataka.id,
      2021,
      "NITI MPI 2023",
      {
        mpiHeadcount: K.total_h19,
        mpiIntensity: K.total_a19,
        mpi: K.total_mpi19,
        scope: "total",
        source: "NITI Aayog 2023 (NFHS-5)",
      },
      "Karnataka state total, 2019-21. NITI MPI 2023, p. 128.",
      COMMON,
    );
    const s2 = await upsertStateProfile(
      client,
      karnataka.id,
      2016,
      "NITI MPI 2021 Baseline",
      {
        mpiHeadcount: K.total_h15,
        mpiIntensity: K.total_a15,
        mpi: K.total_mpi15,
        scope: "total",
        source: "NITI Aayog 2023 (NFHS-4 baseline)",
      },
      "Karnataka state total, 2015-16 baseline.",
      COMMON,
    );
    const s3 = await upsertStateProfile(
      client,
      karnataka.id,
      2021,
      "NITI MPI 2023 Rural",
      {
        mpiHeadcount: K.rural_h19,
        mpiIntensity: K.rural_a19,
        mpi: K.rural_mpi19,
        scope: "rural",
        source: "NITI Aayog 2023 (NFHS-5)",
      },
      "Karnataka rural, 2019-21. Split available at state level only.",
      COMMON,
    );
    const s4 = await upsertStateProfile(
      client,
      karnataka.id,
      2021,
      "NITI MPI 2023 Urban",
      {
        mpiHeadcount: K.urban_h19,
        mpiIntensity: K.urban_a19,
        mpi: K.urban_mpi19,
        scope: "urban",
        source: "NITI Aayog 2023 (NFHS-5)",
      },
      "Karnataka urban, 2019-21. Split available at state level only.",
      COMMON,
    );
    const stateRowsCreated = [s1, s2, s3, s4].filter(Boolean).length;

    console.log(
      `  ✅ Karnataka MPI: ${districtRowsCreated} district rows created, ${stateRowsCreated} state rows created, ${districtsSkipped} districts skipped.`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedKarnatakaMPI()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
