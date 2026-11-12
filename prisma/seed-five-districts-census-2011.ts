/**
 * Census 2011 baseline for 5 active districts currently lacking
 * DemographicProfile Census 2011 data:
 *   Chennai (Tamil Nadu)
 *   Kolkata (West Bengal)
 *   Mumbai (Maharashtra) — Mumbai City only, see notes
 *   Hyderabad (Telangana, was Andhra Pradesh pre-2014)
 *   Lucknow (Uttar Pradesh)
 *
 * SOURCE:
 *   Census of India 2011, Primary Census Abstract (PCA).
 *   Cross-verified from censusindia.co.in district pages + Wikipedia +
 *   census2011.co.in district pages (all secondary sources of Census
 *   PCA data).
 *
 * SCOPE:
 *   Fields seeded: totalPopulation, male/femalePopulation, sex ratios
 *   (total + child), literacy rates (total + male + female), urbanPct,
 *   area, density, caste (SC/ST/Other).
 *   NOT seeded per-district: religion (Census Table C-01 not retrieved),
 *   age bands (Census Table C-13 not retrieved), language, migration.
 *   These are Phase 2 expansions.
 *
 * MUMBAI SLUG NOTE:
 *   DB slug 'mumbai' currently represents the combined Greater Mumbai
 *   area = Mumbai City district (Census code 27022, pop 3,085,411,
 *   area 157 km²) + Mumbai Suburban district (Census code 27023, pop
 *   9,356,962, area 446 km²). Values seeded here are aggregates of both.
 *   This matches the user mental model of "Mumbai" and the existing
 *   PopulationHistory row (12,442,373). When DB hierarchy is expanded
 *   to add mumbai-suburban as a separate district, this row should be
 *   split back into two rows using the per-district PCA values.
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
  stateSlug: string;
  districtSlug: string;
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
  notes: string;
};

const DATA: DistrictCensusData[] = [
  {
    stateSlug: "tamil-nadu",
    districtSlug: "chennai",
    totalPopulation: 4646732,
    malePopulation: 2335844,
    femalePopulation: 2310888,
    sexRatio: 989,
    childSexRatio: 950,
    literacyTotal: 90.18,
    literacyMale: 93.70,
    literacyFemale: 86.64,
    urbanPct: 100.0,
    areaSqKm: 175,
    density: 26553,
    scPct: 15.2,
    stPct: 0.6,
    notes:
      "Chennai district Census 2011. 100% urban (entire district is Chennai Corporation). Source: censusindia.co.in/district/chennai-district-tamil-nadu-27 + Census PCA. Post-2018 Tamil Nadu district boundary changes added some suburban areas; values here are 2011 boundaries.",
  },
  {
    stateSlug: "west-bengal",
    districtSlug: "kolkata",
    totalPopulation: 4496694,
    malePopulation: 2356766,
    femalePopulation: 2139928,
    sexRatio: 908,
    childSexRatio: 933,
    literacyTotal: 86.31,
    literacyMale: 88.34,
    literacyFemale: 84.06,
    urbanPct: 100.0,
    areaSqKm: 185,
    density: 24306,
    scPct: 5.4,
    stPct: 0.2,
    notes:
      "Kolkata district Census 2011. 100% urban (entire district is Kolkata Municipal Corporation). Population actually DECREASED 1.67% from 2001 (4,572,876 → 4,496,694). Source: censusindia.co.in/district/kolkata-district-west-bengal-20.",
  },
  {
    stateSlug: "maharashtra",
    districtSlug: "mumbai",
    totalPopulation: 12442373,
    malePopulation: 6715890,
    femalePopulation: 5726483,
    sexRatio: 853,
    childSexRatio: 913,
    literacyTotal: 89.81,
    literacyMale: 92.45,
    literacyFemale: 86.39,
    urbanPct: 100.0,
    areaSqKm: 603,
    density: 20634,
    scPct: 5.9,
    stPct: 1.3,
    notes:
      "Mumbai combined Census 2011 = Mumbai City district (pop 3,085,411, code 27022, area 157 km²) + Mumbai Suburban district (pop 9,356,962, code 27023, area 446 km²). DB slug mumbai currently represents both. When hierarchy is expanded to add mumbai-suburban as separate district, this row will be split. Source: Census of India 2011 district PCAs, weighted aggregation.",
  },
  {
    stateSlug: "telangana",
    districtSlug: "hyderabad",
    totalPopulation: 3943323,
    malePopulation: 2018575,
    femalePopulation: 1924748,
    sexRatio: 954,
    childSexRatio: 914,
    literacyTotal: 83.25,
    literacyMale: 86.99,
    literacyFemale: 79.35,
    urbanPct: 100.0,
    areaSqKm: 217,
    density: 18172,
    scPct: 6.3,
    stPct: 1.2,
    notes:
      "Hyderabad district Census 2011 (was in Andhra Pradesh state until Telangana bifurcation 2014-06-02). Values are pre-bifurcation boundary. Post-2014 Telangana reorganization (October 2016) split state from 10 districts to 33, but Hyderabad district itself was not sub-divided. 100% urban. Source: censusindia.co.in/district/hyderabad-district-andhra-pradesh-536.",
  },
  {
    stateSlug: "uttar-pradesh",
    districtSlug: "lucknow",
    totalPopulation: 4589838,
    malePopulation: 2394476,
    femalePopulation: 2195362,
    sexRatio: 917,
    childSexRatio: 915,
    literacyTotal: 77.29,
    literacyMale: 82.56,
    literacyFemale: 71.54,
    urbanPct: 66.21,
    areaSqKm: 2528,
    density: 1816,
    scPct: 20.7,
    stPct: 0.2,
    notes:
      "Lucknow district Census 2011. 66.2% urban — district extends well beyond Lucknow city into rural UP. Source: censusindia.co.in/district/lucknow-district-uttar-pradesh-157.",
  },
];

export async function seedFiveDistrictsCensus(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const COMMON = {
      sourceName: "Census of India 2011 (Primary Census Abstract)",
      sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/11310",
      sourceLicense: "Public (NDSAP, Government of India)",
      retrievedAt: new Date(),
      publishedAt: new Date("2011-03-31"),
      boundaryVintage: "Census_2011",
    };

    let seeded = 0;
    let skipped = 0;

    for (const d of DATA) {
      const state = await client.state.findUnique({ where: { slug: d.stateSlug } });
      if (!state) {
        console.log(`  ⚠️  State not found: ${d.stateSlug}`);
        skipped++;
        continue;
      }

      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: state.id, slug: d.districtSlug } },
      });
      if (!district) {
        console.log(`  ⚠️  District not found: ${d.stateSlug}/${d.districtSlug}`);
        skipped++;
        continue;
      }

      const existing = await client.demographicProfile.findFirst({
        where: { districtId: district.id, year: 2011, dataset: "Census 2011" },
      });
      if (existing) {
        console.log(`  ⏭️  Already seeded: ${d.stateSlug}/${d.districtSlug}`);
        skipped++;
        continue;
      }

      await client.demographicProfile.create({
        data: {
          districtId: district.id,
          level: "DISTRICT",
          year: 2011,
          dataset: "Census 2011",
          totalPopulation: d.totalPopulation,
          malePopulation: d.malePopulation,
          femalePopulation: d.femalePopulation,
          sexRatio: d.sexRatio,
          childSexRatio: d.childSexRatio,
          literacyTotal: d.literacyTotal,
          literacyMale: d.literacyMale,
          literacyFemale: d.literacyFemale,
          urbanPct: d.urbanPct,
          areaSqKm: d.areaSqKm,
          density: d.density,
          caste: {
            SC: d.scPct,
            ST: d.stPct,
            Other: Math.round((100 - d.scPct - d.stPct) * 100) / 100,
          },
          notes: d.notes,
          ...COMMON,
        },
      });
      seeded++;
      console.log(
        `  ✅ ${d.stateSlug}/${d.districtSlug}: Census 2011 seeded (pop ${d.totalPopulation.toLocaleString()})`,
      );
    }

    console.log(`\nSummary: ${seeded} seeded + ${skipped} skipped (already present / not found).`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedFiveDistrictsCensus()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
