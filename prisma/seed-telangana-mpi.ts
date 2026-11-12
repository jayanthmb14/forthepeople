/**
 * Telangana state MPI — NITI Aayog National MPI 2023 Progress Review
 *
 * SOURCE: scripts/data-pdfs/niti-mpi-2023.pdf (local audit copy)
 *         https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf
 *         Extracted 2026-04-22 from position 296,523 (state snapshot box).
 *
 * SCOPE:
 *   State-level MPI for Total + Rural + Urban × NFHS-5 (2019-21) and
 *   NFHS-4 (2015-16). 6 state rows + 1 tracking row + 5 NFHS-5 placeholders
 *   for the 5 DB districts.
 *
 *   District-level MPI NOT seeded — Telangana was formed in 2014, and in
 *   October 2016 the state reorganized from 10 → 33 districts. All 5 DB
 *   slugs (hyderabad, karimnagar, khammam, nizamabad, warangal) represent
 *   PRE-2016 administrative units that no longer exist as single entities
 *   in NITI 2023 NFHS-5 data. Seeding district MPI requires:
 *     (a) Expanding DB hierarchy to post-2016 33-district structure, AND
 *     (b) Careful handling of the pre-2016 slugs (redirect, rename, or
 *         deprecate), AND
 *     (c) Re-extraction from NITI PDF with post-2016 district names.
 *
 *   This is tracked as Phase 2 Telangana reorganization work.
 *
 * ARITHMETIC VERIFIED: All 6 rows pass MPI = H × A / 10000 check.
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

const TELANGANA_DATA: {
  total: { "2019_21": Triple; "2015_16": Triple };
  rural: { "2019_21": Triple; "2015_16": Triple };
  urban: { "2019_21": Triple; "2015_16": Triple };
} = {
  total: {
    "2019_21": { H: 5.88, A: 40.85, MPI: 0.024 },
    "2015_16": { H: 13.18, A: 43.29, MPI: 0.057 },
  },
  rural: {
    "2019_21": { H: 7.51, A: 40.88, MPI: 0.031 },
    "2015_16": { H: 19.51, A: 43.33, MPI: 0.085 },
  },
  urban: {
    "2019_21": { H: 2.73, A: 40.70, MPI: 0.011 },
    "2015_16": { H: 4.92, A: 43.06, MPI: 0.021 },
  },
};

const NFHS5_PLACEHOLDER_NOTES =
  "NFHS-5 (2019-21) district factsheet. Data NOT YET LOADED — original rchiips.org URLs deprecated after IIPS site reorganization (verified 2026-04-21). For Telangana, NFHS-5 district data also must be reconciled with post-2016 state reorganization (10 → 33 districts). Will be populated via Harvard Dataverse CSV mirror (doi:10.7910/DVN/42WNZF, CC-BY-4.0) or nfhsiips.in guest-login download. Tracked in docs/MODULE-POPULATION.md § Phase 2.";

const TRACKING_NOTES =
  "TRACKING ROW: Telangana district-level MPI NOT seeded due to October 2016 state reorganization (10 → 33 districts). All 5 DB slugs (hyderabad, karimnagar, khammam, nizamabad, warangal) represent pre-2016 administrative units. NITI 2023 data uses post-2016 33-district structure. Seeding requires (a) DB hierarchy expansion to post-2016 structure, (b) handling of pre-2016 slug redirects/renames, and (c) re-extraction from NITI PDF with post-2016 district names. Phase 2 Telangana-specific work.";

export async function seedTelanganaMPI(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const state = await client.state.findUniqueOrThrow({ where: { slug: "telangana" } });
    console.log(`Seeding Telangana (stateId=${state.id})...`);

    const COMMON_MPI = {
      sourceName: "NITI Aayog, Government of India",
      sourceUrl:
        "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf",
      sourceLicense: "Public",
      retrievedAt: new Date(),
      publishedAt: new Date("2023-07-17"),
    };

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

    let stateSeeded = 0;

    if (
      await upsertStateMPI({
        year: 2021,
        dataset: "NITI MPI 2023",
        scope: "total",
        values: TELANGANA_DATA.total["2019_21"],
        note: "Telangana state total, 2019-21. NITI MPI 2023 state snapshot.",
      })
    )
      stateSeeded++;
    if (
      await upsertStateMPI({
        year: 2016,
        dataset: "NITI MPI 2021 Baseline",
        scope: "total",
        values: TELANGANA_DATA.total["2015_16"],
        note: "Telangana state total, 2015-16 baseline.",
      })
    )
      stateSeeded++;
    if (
      await upsertStateMPI({
        year: 2021,
        dataset: "NITI MPI 2023 Rural",
        scope: "rural",
        values: TELANGANA_DATA.rural["2019_21"],
        note: "Telangana rural, 2019-21.",
      })
    )
      stateSeeded++;
    if (
      await upsertStateMPI({
        year: 2016,
        dataset: "NITI MPI 2021 Baseline Rural",
        scope: "rural",
        values: TELANGANA_DATA.rural["2015_16"],
        note: "Telangana rural, 2015-16 baseline.",
      })
    )
      stateSeeded++;
    if (
      await upsertStateMPI({
        year: 2021,
        dataset: "NITI MPI 2023 Urban",
        scope: "urban",
        values: TELANGANA_DATA.urban["2019_21"],
        note: "Telangana urban, 2019-21.",
      })
    )
      stateSeeded++;
    if (
      await upsertStateMPI({
        year: 2016,
        dataset: "NITI MPI 2021 Baseline Urban",
        scope: "urban",
        values: TELANGANA_DATA.urban["2015_16"],
        note: "Telangana urban, 2015-16 baseline.",
      })
    )
      stateSeeded++;

    // Tracking row (Telangana-specific reorganization note)
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
              reason:
                "Telangana underwent October 2016 reorganization (10 → 33 districts). All 5 DB slugs are pre-2016 units. NITI 2023 data uses post-2016 structure. District MPI requires hierarchy expansion + slug reconciliation.",
              source: "NITI Aayog 2023 PDF",
            },
            notes: TRACKING_NOTES,
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

    // NFHS-5 placeholders
    const districts = await client.district.findMany({
      where: { stateId: state.id },
      select: { id: true, slug: true },
    });

    const NFHS5_COMMON = {
      sourceName: "International Institute for Population Sciences (IIPS), Mumbai",
      sourceUrl: null,
      sourceLicense: "Public (when available)",
      retrievedAt: new Date(),
      publishedAt: null,
      boundaryVintage: "Census_2011",
    };

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

    console.log(
      `  ✅ Telangana: ${stateSeeded} state MPI + ${trackingSeeded} tracking + ${placeholdersSeeded} placeholders. ${placeholdersSkipped} skipped.`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedTelanganaMPI()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
