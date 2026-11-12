/**
 * NFHS-5 placeholder rows for Karnataka's 3 ACTIVE districts.
 *
 * WHY PLACEHOLDERS?
 *   NFHS-5 (2019-21) district factsheets were originally at
 *   rchiips.org/nfhs/NFHS-5_FCTS/. After IIPS site reorganization (verified
 *   2026-04-21), that path returns 404 and rchiips.org redirects to /rch/.
 *   The current IIPS host (nfhsiips.in) requires guest-login, which is not
 *   automatable. Harvard Dataverse has a mirrored CSV (doi:10.7910/DVN/42WNZF,
 *   CC-BY-4.0) that we may ingest in Phase 2.
 *
 *   Rather than leaving these districts as a silent gap, we seed explicit
 *   placeholder rows with all quantitative fields absent and a detailed
 *   `notes` field. This makes the Admin Audit grid show "NFHS-5 pending"
 *   rather than treating absence as forgetfulness. The chart components
 *   (ReligionDonut, HouseholdAmenitiesWaffle, etc.) handle null JSONB
 *   gracefully via their canRender* guards.
 *
 * SCOPE:
 *   3 districts, all currently ACTIVE on the platform:
 *     - bengaluru-urban
 *     - mandya
 *     - mysuru
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

const ACTIVE_DISTRICTS = ["bengaluru-urban", "mandya", "mysuru"];

const NFHS5_NOTES =
  "NFHS-5 (2019-21) district factsheet. Data NOT YET LOADED — original " +
  "rchiips.org URLs deprecated after IIPS site reorganization " +
  "(verified 2026-04-21). Will be populated via one of: (a) nfhsiips.in " +
  "guest-login manual download, (b) Harvard Dataverse CSV mirror " +
  "(doi:10.7910/DVN/42WNZF, CC-BY-4.0), (c) data.gov.in when/if NDSAP " +
  "catalog is restored. Tracked in docs/MODULE-POPULATION.md § Phase 2.";

export async function seedKarnatakaNFHS5Placeholders(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log(
      "\n📊 Seeding NFHS-5 placeholder rows for active Karnataka districts...",
    );

    const karnataka = await client.state.findUniqueOrThrow({
      where: { slug: "karnataka" },
    });

    let seeded = 0;
    let skipped = 0;

    for (const slug of ACTIVE_DISTRICTS) {
      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: karnataka.id, slug } },
      });
      if (!district) {
        console.log(`  ⚠️  District not found: ${slug} — skipped`);
        skipped++;
        continue;
      }

      const existing = await client.demographicProfile.findFirst({
        where: {
          districtId: district.id,
          year: 2020,
          dataset: "NFHS-5",
        },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await client.demographicProfile.create({
        data: {
          districtId: district.id,
          level: "DISTRICT",
          year: 2020, // NFHS-5 fieldwork midpoint (2019-21)
          dataset: "NFHS-5",
          // All quantitative fields intentionally null — placeholder.
          // JSONB fields: not set (null, not {}) — canRender* guards will
          // return false and chart components will show EmptyBlock.
          sourceName:
            "International Institute for Population Sciences (IIPS), Mumbai",
          sourceUrl: null,
          sourceLicense: "Public (when available)",
          retrievedAt: new Date(),
          publishedAt: null,
          notes: NFHS5_NOTES,
          boundaryVintage: "Census_2011",
        },
      });
      console.log(`  ✓ ${slug} — NFHS-5 placeholder created`);
      seeded++;
    }

    console.log(
      `  ✅ NFHS-5 placeholders: ${seeded} seeded, ${skipped} skipped`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedKarnatakaNFHS5Placeholders()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
