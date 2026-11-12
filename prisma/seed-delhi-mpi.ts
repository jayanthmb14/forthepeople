/**
 * Delhi state MPI — NITI Aayog National MPI 2023 Progress Review
 *
 * SOURCE:
 *   NITI Aayog (2023). India. National Multidimensional Poverty Index:
 *   A Progress Review 2023. NITI Aayog, Government of India, New Delhi.
 *   PDF: https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf
 *   Local audit copy: scripts/data-pdfs/niti-mpi-2023.pdf
 *   Extracted 2026-04-22 from Delhi chapter (pages 316-317, Overview
 *   of Districts table).
 *
 * SCOPE (deliberately limited):
 *   State-level TOTAL MPI for both NFHS-5 (2019-21) and NFHS-4 (2015-16).
 *
 *   District-level MPI is NOT seeded. NITI's 2023 PDF renders Delhi's
 *   district NFHS-5 (2019-21) data partially (7 of 11 districts, with
 *   ambiguous name-to-value mapping). Delhi's tiny districts may not
 *   meet NFHS-5 district-level statistical reliability thresholds,
 *   explaining the partial publication. District MPI deferred to Phase 2
 *   (potential future sources: data.gov.in CSV mirror, NITI 2021 Baseline
 *   PDF, NFHS-5 microdata via academic request).
 *
 *   Rural/Urban splits NOT available for Delhi in the 2023 PDF (only
 *   present for larger states). State TOTAL rows only.
 *
 * PLACEHOLDERS:
 *   NFHS-5 placeholder rows created for all 11 Delhi districts. Empty
 *   JSONB with explanatory notes. Same pattern as Karnataka's 3
 *   placeholders — makes admin audit grid show amber (⏳) per district
 *   instead of silent absence.
 *
 * IDEMPOTENT: re-running upserts by (districtId/stateId, year, dataset).
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

export async function seedDelhiMPIAndPlaceholders(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const delhi = await client.state.findUniqueOrThrow({ where: { slug: "delhi" } });
    console.log(`Seeding Delhi (stateId=${delhi.id})...`);

    const COMMON_MPI = {
      sourceName: "NITI Aayog, Government of India",
      sourceUrl:
        "https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf",
      sourceLicense: "Public",
      retrievedAt: new Date(),
      publishedAt: new Date("2023-07-17"),
    };

    let stateSeeded = 0;

    // State total NFHS-5 (2019-21) current
    {
      const existing = await client.demographicProfile.findFirst({
        where: { stateId: delhi.id, level: "STATE", year: 2021, dataset: "NITI MPI 2023" },
      });
      if (!existing) {
        await client.demographicProfile.create({
          data: {
            stateId: delhi.id,
            level: "STATE",
            year: 2021,
            dataset: "NITI MPI 2023",
            economicClass: {
              mpiHeadcount: 2.29,
              mpiIntensity: 44.66,
              mpi: 0.01,
              scope: "total",
              source: "NITI Aayog 2023 (NFHS-5)",
            },
            notes:
              "Delhi state total, 2019-21. NITI MPI 2023, Overview of Districts table (pages 316-317). Rural/Urban splits not published for Delhi in this PDF.",
            ...COMMON_MPI,
          },
        });
        stateSeeded++;
      }
    }

    // State total NFHS-4 (2015-16) baseline
    {
      const existing = await client.demographicProfile.findFirst({
        where: { stateId: delhi.id, level: "STATE", year: 2016, dataset: "NITI MPI 2021 Baseline" },
      });
      if (!existing) {
        await client.demographicProfile.create({
          data: {
            stateId: delhi.id,
            level: "STATE",
            year: 2016,
            dataset: "NITI MPI 2021 Baseline",
            economicClass: {
              mpiHeadcount: 4.68,
              mpiIntensity: 42.43,
              mpi: 0.02,
              scope: "total",
              source: "NITI Aayog 2023 (NFHS-4 baseline)",
            },
            notes:
              "Delhi state total, 2015-16 baseline. Same source as current NFHS-5; extracted from Overview of Districts table.",
            ...COMMON_MPI,
          },
        });
        stateSeeded++;
      }
    }

    // Tracking row — explicit "district MPI pending" marker
    {
      const existing = await client.demographicProfile.findFirst({
        where: {
          stateId: delhi.id,
          level: "STATE",
          year: 2021,
          dataset: "NITI MPI 2023 District Data Pending",
        },
      });
      if (!existing) {
        await client.demographicProfile.create({
          data: {
            stateId: delhi.id,
            level: "STATE",
            year: 2021,
            dataset: "NITI MPI 2023 District Data Pending",
            economicClass: {
              status: "pending",
              reason:
                "NITI 2023 PDF publishes Delhi district NFHS-5 data for only 7 of 11 districts with ambiguous mapping.",
              source: "NITI Aayog 2023 PDF, Delhi chapter pages 316-317",
            },
            notes:
              "TRACKING ROW: Delhi district-level MPI data intentionally not seeded due to partial coverage in NITI 2023 PDF. Phase 2: seek data.gov.in CSV mirror, NITI 2021 Baseline PDF, or NFHS-5 microdata academic access.",
            sourceName: "Internal tracking (ForThePeople.in)",
            sourceUrl: null,
            sourceLicense: "N/A",
            retrievedAt: new Date(),
            publishedAt: null,
          },
        });
      }
    }

    // NFHS-5 placeholders for all 11 Delhi districts
    const DELHI_DISTRICT_SLUGS = [
      "central-delhi",
      "east-delhi",
      "new-delhi",
      "north-delhi",
      "north-east-delhi",
      "north-west-delhi",
      "shahdara",
      "south-delhi",
      "south-east-delhi",
      "south-west-delhi",
      "west-delhi",
    ];

    const NFHS5_COMMON = {
      sourceName: "International Institute for Population Sciences (IIPS), Mumbai",
      sourceUrl: null,
      sourceLicense: "Public (when available)",
      retrievedAt: new Date(),
      publishedAt: null,
      boundaryVintage: "Census_2011",
    };

    const NFHS5_NOTES =
      "NFHS-5 (2019-21) district factsheet. Data NOT YET LOADED — original rchiips.org URLs deprecated after IIPS site reorganization (verified 2026-04-21). Will be populated via one of: (a) nfhsiips.in guest-login manual download, (b) Harvard Dataverse CSV mirror (doi:10.7910/DVN/42WNZF, CC-BY-4.0), (c) data.gov.in when/if NDSAP catalog is restored. Tracked in docs/MODULE-POPULATION.md § Phase 2.";

    let placeholdersSeeded = 0;
    let placeholdersSkipped = 0;

    for (const slug of DELHI_DISTRICT_SLUGS) {
      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: delhi.id, slug } },
      });
      if (!district) {
        console.log(`  ⚠️  District not found: ${slug} — SKIPPED (check hierarchy)`);
        placeholdersSkipped++;
        continue;
      }

      const existing = await client.demographicProfile.findFirst({
        where: { districtId: district.id, year: 2020, dataset: "NFHS-5" },
      });
      if (existing) {
        placeholdersSkipped++;
        continue;
      }

      await client.demographicProfile.create({
        data: {
          districtId: district.id,
          level: "DISTRICT",
          year: 2020,
          dataset: "NFHS-5",
          notes: NFHS5_NOTES,
          ...NFHS5_COMMON,
        },
      });
      placeholdersSeeded++;
    }

    console.log(
      `  ✅ Delhi: ${stateSeeded} state MPI rows + 1 tracking row + ${placeholdersSeeded} NFHS-5 placeholders. ${placeholdersSkipped} skipped.`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedDelhiMPIAndPlaceholders()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
