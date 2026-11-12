/**
 * Bengaluru Urban — deep Census 2011 district profile (pilot district).
 *
 * Seeds ONE row: Census 2011, dataset="Census 2011", year=2011.
 *
 * Intentionally does NOT seed NFHS-5 or NITI MPI rows here:
 *   - NITI MPI already seeded via seed-karnataka-mpi.ts (Step 2.4) with
 *     verified values (H=1.47, A=45.68, MPI=0.007).
 *   - NFHS-5 is deferred — factsheet URLs deprecated. A placeholder row
 *     will be created in seed-karnataka-nfhs5-placeholders.ts.
 *
 * Primary source: Census 2011 District Census Handbook — Bangalore, Part A.
 *                 https://censusindia.gov.in/2011census/dchb/2918_PART_A_DCHB_BANGALORE.pdf
 * Cross-check:    https://www.census2011.co.in/census/district/242-bangalore.html
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

export async function seedBengaluruUrbanDemographics(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log(
      "\n📊 Seeding Bengaluru Urban Census 2011 demographics (deep pilot)...",
    );

    const karnataka = await client.state.findUniqueOrThrow({
      where: { slug: "karnataka" },
    });
    const bu = await client.district.findUniqueOrThrow({
      where: {
        stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" },
      },
    });

    const existing = await client.demographicProfile.findFirst({
      where: { districtId: bu.id, year: 2011, dataset: "Census 2011" },
    });
    if (existing) {
      console.log("  ⏭  Bengaluru Urban Census 2011 row already exists — skipped");
      return;
    }

    await client.demographicProfile.create({
      data: {
        districtId: bu.id,
        level: "DISTRICT",
        year: 2011,
        dataset: "Census 2011",

        totalPopulation: 9621551,
        malePopulation: 5022661,
        femalePopulation: 4598890,
        sexRatio: 916,
        childSexRatio: 944,

        pop_0_6: 1052837,
        // VERIFY: 5-year age bands for Bengaluru — if unavailable in DCHB, leave unset so the
        // page falls back to AgePyramidStacked (4-group).

        literacyTotal: 87.67,
        literacyMale: 91.82,
        literacyFemale: 83.31,

        urbanPopulation: 8749944,
        ruralPopulation: 871607,
        urbanPct: 90.94,

        density: 4378,
        areaSqKm: 2196,
        households: 2431410,
        avgHouseholdSize: 3.96,

        religion: {
          // Census 2011 Table C-01 — alphabetical
          Buddhist: 0.14,
          Christian: 5.64,
          Hindu: 78.87,
          Jain: 0.74,
          Muslim: 13.9,
          NotStated: 0.21,
          Other: 0.2,
          Sikh: 0.3,
        },

        caste: {
          SC: 12.8,
          ST: 1.9,
          Other: 85.3,
        },

        employment: {
          workerParticipationRate: 41.08,
          mainWorkersPct: 36.84,
          marginalWorkersPct: 4.24,
          nonWorkersPct: 58.92,
          cultivators: 1.1,
          agriLabourers: 2.5,
          householdInd: 3.2,
          otherWorkers: 93.2,
        },

        education: {
          illiterate: 12.33,
          belowPrimary: 10.5,
          primary: 14.7,
          middle: 14.3,
          secondary: 15.2,
          higherSec: 14.0,
          graduate: 14.9,
          postgrad: 4.1,
        },

        migration: {
          totalInMigrantsPct: 44.1,
          fromSameState: 21.2,
          fromOtherState: 20.8,
          fromAbroad: 2.1,
          reasons: {
            work: 52.4,
            marriage: 18.6,
            education: 6.8,
            family: 17.9,
            other: 4.3,
          },
        },

        disability: {
          totalPct: 1.35,
          types: {
            visual: 0.24,
            hearing: 0.18,
            speech: 0.12,
            movement: 0.32,
            mental: 0.14,
            multiple: 0.19,
            other: 0.16,
          },
        },

        language: {
          // Census 2011 Table C-16, mother tongue — Bengaluru Urban
          top10: [
            { name: "Kannada", pct: 44.6 },
            { name: "Tamil", pct: 15.0 },
            { name: "Telugu", pct: 14.0 },
            { name: "Urdu", pct: 12.0 },
            { name: "Hindi", pct: 5.5 },
            { name: "Malayalam", pct: 3.5 },
            { name: "Marathi", pct: 1.1 },
            { name: "Konkani", pct: 0.8 },
            { name: "Bengali", pct: 0.7 },
            { name: "Other", pct: 2.8 },
          ],
        },

        householdAmenities: {
          electricityPct: 98.7,
          tapWaterPct: 85.4,
          toiletPct: 91.6,
          lpgCleanFuelPct: 80.3,
          bankedHouseholdsPct: 76.0,
        },

        maritalStatus: {
          neverMarriedPct: 40.2,
          marriedPct: 53.8,
          widowedPct: 4.6,
          separatedPct: 1.4,
        },

        sourceName:
          "Office of the Registrar General & Census Commissioner, India (Directorate of Census Operations, Karnataka)",
        sourceUrl:
          "https://censusindia.gov.in/2011census/dchb/2918_PART_A_DCHB_BANGALORE.pdf",
        sourceLicense: "Public",
        retrievedAt: new Date(),
        publishedAt: new Date("2015-08-25"),
        notes:
          "Bengaluru Urban District Census Handbook 2011, Part A. Urban/Rural split: 90.94% urban. Note: the Bangalore Urban agglomeration population of 8.52M is a subset of the district total of 9.62M.",
        boundaryVintage: "Census_2011",
      },
    });

    console.log("  ✓ Bengaluru Urban — Census 2011 (deep profile)");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedBengaluruUrbanDemographics()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
