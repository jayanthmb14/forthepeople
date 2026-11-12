/**
 * Delhi district Census 2011 baseline — all 11 districts.
 *
 * SOURCE:
 *   Census of India 2011, Primary Census Abstract (PCA), NCT of Delhi.
 *   Official: https://censusindia.gov.in (Registrar General & Census Commissioner, India)
 *   Delhi DES mirror: https://des.delhi.gov.in/des/population-census-2011
 *   District-level verified against Wikipedia district articles and
 *   censusindia.co.in aggregated pages (which source to Census PCA).
 *
 * SCOPE:
 *   Census 2011 district-level baseline for all 11 current Delhi districts.
 *   Fields seeded (where verified): totalPopulation, malePopulation,
 *   femalePopulation, sexRatio, childSexRatio, literacyTotal, literacyMale,
 *   literacyFemale, urbanPct, areaSqKm, density, scPct, stPct.
 *
 *   Religion and caste (beyond SC/ST) NOT seeded per-district — Census 2011
 *   Table C-01 district data was not retrieved this session. State-level
 *   religion available in Delhi state profile row; per-district deferred
 *   to Phase 2 (would require downloading Table C-01 from NADA catalog).
 *
 * POST-2011 DISTRICTS (created 2012):
 *   Shahdara: carved from parts of North East Delhi + East Delhi
 *   South East Delhi: carved from parts of South Delhi + New Delhi
 *   Both get DemographicProfile rows with dataset="Census 2011 Pre-Bifurcation"
 *   and explanatory notes — same honesty pattern as tracking rows.
 *
 * SUM-CHECK VERIFIED:
 *   Sum of 9 district populations = 16,787,941 = Delhi state total exactly.
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

type DistrictCensusData = {
  totalPopulation: number;
  malePopulation: number;
  femalePopulation: number;
  sexRatio: number;
  childSexRatio: number;
  literacyTotal: number;
  literacyMale: number;
  literacyFemale: number;
  urbanPct: number;
  areaSqKm: number;
  density: number;
  scPct: number;
  stPct: number;
  sources: string[];
};

const DELHI_DISTRICTS: Record<string, DistrictCensusData | null> = {
  "central-delhi": {
    totalPopulation: 582320,
    malePopulation: 307821,
    femalePopulation: 274499,
    sexRatio: 892,
    childSexRatio: 905,
    literacyTotal: 85.14,
    literacyMale: 90.02,
    literacyFemale: 79.56,
    urbanPct: 100.0,
    areaSqKm: 21,
    density: 27730,
    scPct: 17.0,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/173-central-delhi.html",
      "Census of India 2011 PCA, NCT of Delhi",
    ],
  },
  "east-delhi": {
    totalPopulation: 1709346,
    malePopulation: 907500,
    femalePopulation: 801846,
    sexRatio: 884,
    childSexRatio: 871,
    literacyTotal: 89.31,
    literacyMale: 93.13,
    literacyFemale: 84.99,
    urbanPct: 99.79,
    areaSqKm: 64,
    density: 26683,
    scPct: 16.5,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/171-east-delhi.html",
      "https://www.censusindia.co.in/district/east-district-delhi-93",
    ],
  },
  "new-delhi": {
    totalPopulation: 142004,
    malePopulation: 77942,
    femalePopulation: 64062,
    sexRatio: 822,
    childSexRatio: 894,
    literacyTotal: 88.34,
    literacyMale: 92.24,
    literacyFemale: 83.56,
    urbanPct: 100.0,
    areaSqKm: 22,
    density: 6454,
    scPct: 15.0,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/172-new-delhi.html",
    ],
  },
  "north-delhi": {
    totalPopulation: 887978,
    malePopulation: 475002,
    femalePopulation: 412976,
    sexRatio: 869,
    childSexRatio: 873,
    literacyTotal: 86.85,
    literacyMale: 90.89,
    literacyFemale: 82.20,
    urbanPct: 98.0,
    areaSqKm: 61,
    density: 14557,
    scPct: 18.7,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/169-north-delhi.html",
      "https://www.censusindia.co.in/district/north-district-delhi-91",
    ],
  },
  "north-east-delhi": {
    totalPopulation: 2241624,
    malePopulation: 1188425,
    femalePopulation: 1053199,
    sexRatio: 886,
    childSexRatio: 880,
    literacyTotal: 83.09,
    literacyMale: 88.78,
    literacyFemale: 76.67,
    urbanPct: 99.04,
    areaSqKm: 62,
    density: 36155,
    scPct: 16.67,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/170-north-east-delhi.html",
      "https://en.wikipedia.org/wiki/North_East_Delhi",
    ],
  },
  "north-west-delhi": {
    totalPopulation: 3656539,
    malePopulation: 1960922,
    femalePopulation: 1695617,
    sexRatio: 865,
    childSexRatio: 865,
    literacyTotal: 84.45,
    literacyMale: 89.66,
    literacyFemale: 78.41,
    urbanPct: 94.15,
    areaSqKm: 443,
    density: 8254,
    scPct: 19.1,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/168-north-west-delhi.html",
      "https://www.censusindia.co.in/district/north-west-district-delhi-90",
    ],
  },
  "shahdara": null,
  "south-delhi": {
    totalPopulation: 2731929,
    malePopulation: 1467428,
    femalePopulation: 1264501,
    sexRatio: 862,
    childSexRatio: 885,
    literacyTotal: 86.57,
    literacyMale: 91.73,
    literacyFemale: 80.55,
    urbanPct: 99.55,
    areaSqKm: 250,
    density: 10928,
    scPct: 15.5,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/176-south-delhi.html",
      "https://www.censusindia.co.in/district/south-district-delhi-98",
    ],
  },
  "south-east-delhi": null,
  "south-west-delhi": {
    totalPopulation: 2292958,
    malePopulation: 1246046,
    femalePopulation: 1046912,
    sexRatio: 840,
    childSexRatio: 845,
    literacyTotal: 88.28,
    literacyMale: 93.14,
    literacyFemale: 82.50,
    urbanPct: 93.73,
    areaSqKm: 421,
    density: 5445,
    scPct: 13.9,
    stPct: 0,
    sources: [
      "https://en.wikipedia.org/wiki/South_West_Delhi_district",
      "https://www.censusindia.co.in/district/south-west-district-delhi-97",
    ],
  },
  "west-delhi": {
    totalPopulation: 2543243,
    malePopulation: 1356240,
    femalePopulation: 1187003,
    sexRatio: 875,
    childSexRatio: 872,
    literacyTotal: 86.98,
    literacyMale: 91.00,
    literacyFemale: 82.39,
    urbanPct: 99.75,
    areaSqKm: 129,
    density: 19625,
    scPct: 14.80,
    stPct: 0,
    sources: [
      "https://www.census2011.co.in/census/district/174-west-delhi.html",
      "https://en.wikipedia.org/wiki/West_Delhi",
    ],
  },
};

const POST_2011_NOTES: Record<string, string> = {
  "shahdara":
    "Shahdara district was created in 2012 by bifurcation from North East Delhi and East Delhi. Census 2011 did NOT enumerate Shahdara as a separate district. For Census 2011 demographic data, see the parent districts (north-east-delhi, east-delhi). NFHS-5 2019-21 would enumerate Shahdara separately but that data is not currently seeded.",
  "south-east-delhi":
    "South East Delhi district was created in 2012 by bifurcation from South Delhi and New Delhi. Census 2011 did NOT enumerate South East Delhi as a separate district. For Census 2011 demographic data, see the parent districts (south-delhi, new-delhi). NFHS-5 2019-21 would enumerate South East Delhi separately but that data is not currently seeded.",
};

export async function seedDelhiCensus(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const delhi = await client.state.findUniqueOrThrow({ where: { slug: "delhi" } });
    console.log(`Seeding Delhi Census 2011 baseline (stateId=${delhi.id})...`);

    const COMMON = {
      sourceName: "Census of India 2011 (Primary Census Abstract, NCT of Delhi)",
      sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/11310",
      sourceLicense: "Public (NDSAP, Government of India)",
      retrievedAt: new Date(),
      publishedAt: new Date("2011-03-31"),
      boundaryVintage: "Census_2011",
    };

    let seeded = 0;
    let unavailable = 0;
    let skipped = 0;

    for (const [slug, data] of Object.entries(DELHI_DISTRICTS)) {
      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: delhi.id, slug } },
      });
      if (!district) {
        console.log(`  ⚠️  District not found: ${slug}`);
        skipped++;
        continue;
      }

      const existing = await client.demographicProfile.findFirst({
        where: {
          districtId: district.id,
          year: 2011,
          dataset: { startsWith: "Census 2011" },
        },
      });
      if (existing) {
        skipped++;
        continue;
      }

      if (data === null) {
        await client.demographicProfile.create({
          data: {
            districtId: district.id,
            level: "DISTRICT",
            year: 2011,
            dataset: "Census 2011 Pre-Bifurcation",
            notes: POST_2011_NOTES[slug],
            sourceName: "Census of India 2011 — district boundary note",
            sourceUrl: "https://censusindia.gov.in",
            sourceLicense: "Public",
            retrievedAt: new Date(),
            publishedAt: null,
            boundaryVintage: "Post_2012_Bifurcation",
          },
        });
        unavailable++;
        console.log(`  📋 ${slug}: DATA_UNAVAILABLE row seeded (post-2011 district)`);
      } else {
        await client.demographicProfile.create({
          data: {
            districtId: district.id,
            level: "DISTRICT",
            year: 2011,
            dataset: "Census 2011",
            totalPopulation: data.totalPopulation,
            malePopulation: data.malePopulation,
            femalePopulation: data.femalePopulation,
            sexRatio: data.sexRatio,
            childSexRatio: data.childSexRatio,
            literacyTotal: data.literacyTotal,
            literacyMale: data.literacyMale,
            literacyFemale: data.literacyFemale,
            urbanPct: data.urbanPct,
            areaSqKm: data.areaSqKm,
            density: data.density,
            caste: {
              SC: data.scPct,
              ST: data.stPct,
              Other: 100 - data.scPct - data.stPct,
            },
            notes: `Census 2011 baseline for ${slug}. Sources: ${data.sources.join("; ")}. Religion breakdown NOT seeded at district level — use state-level Delhi religion profile (Hindu 81.68%, Muslim 12.86%, Sikh 3.40%, Jain 0.99%, Christian 0.87%, Buddhist 0.11%). Per-district religion deferred to Phase 2 (requires Census 2011 Table C-01 download).`,
            ...COMMON,
          },
        });
        seeded++;
        console.log(
          `  ✅ ${slug}: Census 2011 seeded (pop ${data.totalPopulation.toLocaleString()})`,
        );
      }
    }

    console.log(
      `\n  Summary: ${seeded} verified + ${unavailable} post-2011 unavailable + ${skipped} skipped.`,
    );

    const sumCheck = Object.values(DELHI_DISTRICTS)
      .filter((d): d is DistrictCensusData => d !== null)
      .reduce((s, d) => s + d.totalPopulation, 0);
    console.log(
      `  Sum-check: 9-district population total = ${sumCheck.toLocaleString()} (expected 16,787,941)`,
    );
    if (sumCheck !== 16787941) {
      console.log(`  ⚠️  WARNING: Sum-check failed! Off by ${sumCheck - 16787941}`);
    } else {
      console.log(`  ✓ Sum-check matches Delhi state total exactly.`);
    }
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedDelhiCensus()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
