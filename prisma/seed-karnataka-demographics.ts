/**
 * Karnataka state-level Census 2011 baseline.
 *
 * Seeds one DemographicProfile row for Karnataka (level=STATE, year=2011,
 * dataset="Census 2011"). NFHS-5 and NITI MPI state rows are seeded
 * separately: MPI already landed via seed-karnataka-mpi.ts (Step 2.4);
 * NFHS-5 is deferred until district factsheet URLs are recovered.
 *
 * Source: Census of India 2011, Karnataka state tables.
 * URL:    https://censusindia.gov.in/nada/index.php/catalog/42571
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

export async function seedKarnatakaDemographics(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📊 Seeding Karnataka STATE-LEVEL demographics (Census 2011)...");

    const karnataka = await client.state.findUniqueOrThrow({
      where: { slug: "karnataka" },
    });

    const existing = await client.demographicProfile.findFirst({
      where: {
        stateId: karnataka.id,
        level: "STATE",
        year: 2011,
        dataset: "Census 2011",
      },
    });
    if (existing) {
      console.log("  ⏭  Karnataka Census 2011 state row already exists — skipped");
      return;
    }

    await client.demographicProfile.create({
      data: {
        stateId: karnataka.id,
        level: "STATE",
        year: 2011,
        dataset: "Census 2011",
        totalPopulation: 61095297,
        malePopulation: 30966657,
        femalePopulation: 30128640,
        sexRatio: 973,
        childSexRatio: 948,
        literacyTotal: 75.36,
        literacyMale: 82.47,
        literacyFemale: 68.08,
        urbanPopulation: 23625962,
        ruralPopulation: 37469335,
        urbanPct: 38.67,
        density: 319,
        areaSqKm: 191791,
        households: 13358488,
        avgHouseholdSize: 4.6,
        religion: {
          Buddhist: 0.16,
          Christian: 1.87,
          Hindu: 84.0,
          Jain: 0.72,
          Muslim: 12.92,
          NotStated: 0.02,
          Other: 0.16,
          Sikh: 0.05,
        },
        caste: {
          SC: 17.15,
          ST: 6.95,
          Other: 75.9,
        },
        sourceName:
          "Office of the Registrar General & Census Commissioner, India",
        sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/42571",
        sourceLicense: "Public",
        retrievedAt: new Date(),
        publishedAt: new Date("2013-05-08"),
        notes:
          "Karnataka Census 2011 state totals. Religion and caste percentages rounded to 2 decimals.",
        boundaryVintage: "Census_2011",
      },
    });

    console.log("  ✓ Karnataka state Census 2011 row created");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedKarnatakaDemographics()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
