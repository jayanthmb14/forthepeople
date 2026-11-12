/**
 * Four-state batch MPI seed — Tamil Nadu, West Bengal, Uttar Pradesh, Maharashtra
 *
 * SOURCE:
 *   NITI Aayog (2023). India. National Multidimensional Poverty Index:
 *   A Progress Review 2023. NITI Aayog, Government of India, New Delhi.
 *   PDF: https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf
 *   Local audit copy: scripts/data-pdfs/niti-mpi-2023.pdf
 *   Extracted 2026-04-22 from state snapshot boxes (Total + Rural + Urban
 *   × NFHS-4 + NFHS-5).
 *
 * SCOPE (deliberately limited — Delhi pattern):
 *   State-level MPI for Total + Rural + Urban breakdowns × 2 periods =
 *   6 rows per state. District-level NOT seeded for any of these 4 states
 *   — DB hierarchy has only 5 districts per state (onboarding pattern).
 *   District MPI requires hierarchy expansion first (separate task).
 *
 *   Every numeric value verified by MPI = H × A / 10000 arithmetic.
 *
 * PLACEHOLDERS:
 *   5 NFHS-5 placeholder rows per state (for the 5 DB districts). Same
 *   pattern as Delhi/Karnataka.
 *
 * TRACKING ROW:
 *   1 per state marking "district data pending, DB hierarchy incomplete".
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

type Triple = { H: number; A: number; MPI: number };
type StateMPIValues = {
  total: { "2019_21": Triple; "2015_16": Triple };
  rural: { "2019_21": Triple; "2015_16": Triple };
  urban: { "2019_21": Triple; "2015_16": Triple };
};

const STATE_DATA: Record<string, StateMPIValues> = {
  "tamil-nadu": {
    total: { "2019_21": { H: 2.20, A: 38.70, MPI: 0.009 }, "2015_16": { H: 4.76, A: 39.97, MPI: 0.019 } },
    rural: { "2019_21": { H: 2.90, A: 38.84, MPI: 0.011 }, "2015_16": { H: 7.18, A: 40.21, MPI: 0.029 } },
    urban: { "2019_21": { H: 1.41, A: 38.37, MPI: 0.005 }, "2015_16": { H: 2.37, A: 39.25, MPI: 0.009 } },
  },
  "west-bengal": {
    total: { "2019_21": { H: 11.89, A: 42.35, MPI: 0.050 }, "2015_16": { H: 21.29, A: 45.50, MPI: 0.097 } },
    rural: { "2019_21": { H: 15.15, A: 42.26, MPI: 0.064 }, "2015_16": { H: 25.66, A: 45.39, MPI: 0.116 } },
    urban: { "2019_21": { H: 5.04, A: 42.92, MPI: 0.022 }, "2015_16": { H: 11.56, A: 46.02, MPI: 0.053 } },
  },
  "uttar-pradesh": {
    total: { "2019_21": { H: 22.93, A: 44.83, MPI: 0.103 }, "2015_16": { H: 37.68, A: 47.60, MPI: 0.179 } },
    rural: { "2019_21": { H: 26.35, A: 44.89, MPI: 0.118 }, "2015_16": { H: 44.29, A: 47.66, MPI: 0.211 } },
    urban: { "2019_21": { H: 11.57, A: 44.36, MPI: 0.051 }, "2015_16": { H: 17.72, A: 47.14, MPI: 0.084 } },
  },
  maharashtra: {
    total: { "2019_21": { H: 7.81, A: 41.77, MPI: 0.033 }, "2015_16": { H: 14.80, A: 43.76, MPI: 0.065 } },
    rural: { "2019_21": { H: 11.49, A: 41.94, MPI: 0.048 }, "2015_16": { H: 22.74, A: 43.98, MPI: 0.100 } },
    urban: { "2019_21": { H: 3.07, A: 40.96, MPI: 0.013 }, "2015_16": { H: 5.54, A: 42.69, MPI: 0.024 } },
  },
};

const EXPECTED_DISTRICT_COUNTS: Record<string, number> = {
  "tamil-nadu": 38,
  "west-bengal": 23,
  "uttar-pradesh": 75,
  maharashtra: 36,
};

const NFHS5_PLACEHOLDER_NOTES =
  "NFHS-5 (2019-21) district factsheet. Data NOT YET LOADED — original rchiips.org URLs deprecated after IIPS site reorganization (verified 2026-04-21). Will be populated via Harvard Dataverse CSV mirror (doi:10.7910/DVN/42WNZF, CC-BY-4.0) or nfhsiips.in guest-login manual download. Tracked in docs/MODULE-POPULATION.md § Phase 2.";

export async function seedFourStatesMPI(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  const results: Record<
    string,
    { stateRows: number; placeholders: number; tracking: number; skipped: number }
  > = {};

  try {
    for (const [stateSlug, data] of Object.entries(STATE_DATA)) {
      console.log("\n========================================");
      console.log(`  ${stateSlug.toUpperCase()}`);
      console.log("========================================");

      const state = await client.state.findUniqueOrThrow({ where: { slug: stateSlug } });
      const stateName = state.name;

      const COMMON_MPI = {
        sourceName: "NITI Aayog, Government of India",
        sourceUrl:
          "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf",
        sourceLicense: "Public",
        retrievedAt: new Date(),
        publishedAt: new Date("2023-07-17"),
      };

      // Helper to upsert a state MPI row
      async function upsertStateMPI(params: {
        year: number;
        dataset: string;
        scope: "total" | "rural" | "urban";
        values: Triple;
        note: string;
      }): Promise<boolean> {
        const existing = await client.demographicProfile.findFirst({
          where: {
            stateId: state.id,
            level: "STATE",
            year: params.year,
            dataset: params.dataset,
          },
        });
        if (existing) return false;

        await client.demographicProfile.create({
          data: {
            stateId: state.id,
            level: "STATE",
            year: params.year,
            dataset: params.dataset,
            economicClass: {
              mpiHeadcount: params.values.H,
              mpiIntensity: params.values.A,
              mpi: params.values.MPI,
              scope: params.scope,
              source: `NITI Aayog 2023 (${params.year === 2021 ? "NFHS-5" : "NFHS-4 baseline"})`,
            },
            notes: params.note,
            ...COMMON_MPI,
          },
        });
        return true;
      }

      // 6 state MPI rows: total/rural/urban × 2019-21/2015-16
      let stateSeeded = 0;

      if (
        await upsertStateMPI({
          year: 2021,
          dataset: "NITI MPI 2023",
          scope: "total",
          values: data.total["2019_21"],
          note: `${stateName} state total, 2019-21. NITI MPI 2023 state snapshot.`,
        })
      )
        stateSeeded++;

      if (
        await upsertStateMPI({
          year: 2016,
          dataset: "NITI MPI 2021 Baseline",
          scope: "total",
          values: data.total["2015_16"],
          note: `${stateName} state total, 2015-16 baseline.`,
        })
      )
        stateSeeded++;

      if (
        await upsertStateMPI({
          year: 2021,
          dataset: "NITI MPI 2023 Rural",
          scope: "rural",
          values: data.rural["2019_21"],
          note: `${stateName} rural, 2019-21.`,
        })
      )
        stateSeeded++;

      if (
        await upsertStateMPI({
          year: 2016,
          dataset: "NITI MPI 2021 Baseline Rural",
          scope: "rural",
          values: data.rural["2015_16"],
          note: `${stateName} rural, 2015-16 baseline.`,
        })
      )
        stateSeeded++;

      if (
        await upsertStateMPI({
          year: 2021,
          dataset: "NITI MPI 2023 Urban",
          scope: "urban",
          values: data.urban["2019_21"],
          note: `${stateName} urban, 2019-21.`,
        })
      )
        stateSeeded++;

      if (
        await upsertStateMPI({
          year: 2016,
          dataset: "NITI MPI 2021 Baseline Urban",
          scope: "urban",
          values: data.urban["2015_16"],
          note: `${stateName} urban, 2015-16 baseline.`,
        })
      )
        stateSeeded++;

      // Tracking row
      let trackingSeeded = 0;
      {
        const existing = await client.demographicProfile.findFirst({
          where: {
            stateId: state.id,
            level: "STATE",
            year: 2021,
            dataset: "NITI MPI 2023 District Data Pending",
          },
        });
        if (!existing) {
          await client.demographicProfile.create({
            data: {
              stateId: state.id,
              level: "STATE",
              year: 2021,
              dataset: "NITI MPI 2023 District Data Pending",
              economicClass: {
                status: "pending",
                reason: `DB hierarchy has only 5 of ${EXPECTED_DISTRICT_COUNTS[stateSlug]} ${stateName} districts. District-level MPI deferred pending hierarchy expansion.`,
                source: "NITI Aayog 2023 PDF",
              },
              notes: `TRACKING ROW: ${stateName} district-level MPI data available in NITI PDF but not seeded due to incomplete DB hierarchy. Phase 2: expand district hierarchy, then re-extract and seed.`,
              sourceName: "Internal tracking (ForThePeople.in)",
              sourceUrl: null,
              sourceLicense: "N/A",
              retrievedAt: new Date(),
              publishedAt: null,
            },
          });
          trackingSeeded = 1;
        }
      }

      // NFHS-5 placeholders for whichever districts ARE in DB
      const NFHS5_COMMON = {
        sourceName: "International Institute for Population Sciences (IIPS), Mumbai",
        sourceUrl: null,
        sourceLicense: "Public (when available)",
        retrievedAt: new Date(),
        publishedAt: null,
        boundaryVintage: "Census_2011",
      };

      const districts = await client.district.findMany({
        where: { stateId: state.id },
        select: { id: true, slug: true },
      });

      let placeholdersSeeded = 0;
      let placeholdersSkipped = 0;

      for (const d of districts) {
        const existing = await client.demographicProfile.findFirst({
          where: { districtId: d.id, year: 2020, dataset: "NFHS-5" },
        });
        if (existing) {
          placeholdersSkipped++;
          continue;
        }

        await client.demographicProfile.create({
          data: {
            districtId: d.id,
            level: "DISTRICT",
            year: 2020,
            dataset: "NFHS-5",
            notes: NFHS5_PLACEHOLDER_NOTES,
            ...NFHS5_COMMON,
          },
        });
        placeholdersSeeded++;
      }

      results[stateSlug] = {
        stateRows: stateSeeded,
        placeholders: placeholdersSeeded,
        tracking: trackingSeeded,
        skipped: placeholdersSkipped,
      };

      console.log(
        `  ✅ ${stateName}: ${stateSeeded} state MPI + ${trackingSeeded} tracking + ${placeholdersSeeded} placeholders. ${placeholdersSkipped} skipped.`,
      );
    }

    // Summary
    console.log("\n========================================");
    console.log("  BATCH COMPLETE");
    console.log("========================================");
    let grandTotal = 0;
    for (const [slug, r] of Object.entries(results)) {
      const total = r.stateRows + r.tracking + r.placeholders;
      grandTotal += total;
      console.log(
        `  ${slug}: ${total} rows (${r.stateRows} state + ${r.tracking} tracking + ${r.placeholders} placeholders)`,
      );
    }
    console.log(`  TOTAL: ${grandTotal} new rows`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedFourStatesMPI()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
