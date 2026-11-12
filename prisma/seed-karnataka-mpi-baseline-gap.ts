/**
 * Karnataka state MPI gap fix — Rural/Urban 2015-16 baseline rows.
 *
 * SOURCE: NITI Aayog National MPI 2023 PDF, Karnataka state snapshot.
 * Extracted 2026-04-22 from position 209,096 of NITI PDF.
 *
 * Backfills 2 rows missed in original Karnataka seed (seed-karnataka-mpi.ts
 * covered only 2019-21 rural/urban; this adds 2015-16 baseline counterparts).
 * Makes Karnataka structurally consistent with TN/WB/UP/Maharashtra state
 * MPI matrices (6 rows each: Total + Rural + Urban × 2019-21 + 2015-16).
 *
 * Arithmetic verified:
 *   Rural 2015-16: H=18.45, A=42.87, MPI=0.079 (H×A/10000 = 0.07909 ✓)
 *   Urban 2015-16: H=4.92,  A=42.22, MPI=0.021 (H×A/10000 = 0.02077 ✓)
 *
 * IDEMPOTENT.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

export async function seedKarnatakaBaselineGap(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });

    const COMMON = {
      sourceName: "NITI Aayog, Government of India",
      sourceUrl:
        "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf",
      sourceLicense: "Public",
      retrievedAt: new Date(),
      publishedAt: new Date("2023-07-17"),
    };

    let seeded = 0;

    // Rural 2015-16 baseline
    {
      const existing = await client.demographicProfile.findFirst({
        where: {
          stateId: karnataka.id,
          level: "STATE",
          year: 2016,
          dataset: "NITI MPI 2021 Baseline Rural",
        },
      });
      if (!existing) {
        await client.demographicProfile.create({
          data: {
            stateId: karnataka.id,
            level: "STATE",
            year: 2016,
            dataset: "NITI MPI 2021 Baseline Rural",
            economicClass: {
              mpiHeadcount: 18.45,
              mpiIntensity: 42.87,
              mpi: 0.079,
              scope: "rural",
              source: "NITI Aayog 2023 (NFHS-4 baseline)",
            },
            notes:
              "Karnataka rural, 2015-16 baseline. NITI MPI 2023 state snapshot. Backfill of original Karnataka seed to match TN/WB/UP/Maharashtra structural pattern.",
            ...COMMON,
          },
        });
        seeded++;
      }
    }

    // Urban 2015-16 baseline
    {
      const existing = await client.demographicProfile.findFirst({
        where: {
          stateId: karnataka.id,
          level: "STATE",
          year: 2016,
          dataset: "NITI MPI 2021 Baseline Urban",
        },
      });
      if (!existing) {
        await client.demographicProfile.create({
          data: {
            stateId: karnataka.id,
            level: "STATE",
            year: 2016,
            dataset: "NITI MPI 2021 Baseline Urban",
            economicClass: {
              mpiHeadcount: 4.92,
              mpiIntensity: 42.22,
              mpi: 0.021,
              scope: "urban",
              source: "NITI Aayog 2023 (NFHS-4 baseline)",
            },
            notes:
              "Karnataka urban, 2015-16 baseline. NITI MPI 2023 state snapshot. Backfill of original Karnataka seed to match TN/WB/UP/Maharashtra structural pattern.",
            ...COMMON,
          },
        });
        seeded++;
      }
    }

    console.log(
      `✅ Karnataka baseline gap filled: ${seeded} rows seeded (0 if already present).`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedKarnatakaBaselineGap()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
