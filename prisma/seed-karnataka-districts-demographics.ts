/**
 * Karnataka districts — Census 2011 baseline (core profile for 29 districts).
 *
 * SCOPE:
 *   - 29 districts: all Karnataka districts EXCEPT Bengaluru Urban (deep pilot,
 *     seeded separately in seed-bengaluru-urban-demographics.ts) and EXCEPT
 *     Vijayanagara (bifurcated from Ballari in 2021 — no Census 2011 row exists).
 *   - Ballari row corresponds to the 2011 undivided Ballari district (pre-2021).
 *
 * SOURCES:
 *   - Census 2011 Table A-1 (population)
 *   - Table C-01 (religion)
 *   - Table A-5 (SC/ST)
 *   - Cross-verified at https://censusindia.gov.in/nada/index.php/catalog/42571
 *
 * SLUG NOTE:
 *   The original playbook used "bagalkote" (NITI PDF spelling, with trailing e).
 *   DB slug is "bagalkot" (Census 2011 spelling, matches canonical hierarchy).
 *   Corrected in this file — see prisma/seed-karnataka-mpi.ts for the same
 *   correction and the full SPELLING NOTE.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type DistrictRow = {
  slug: string;
  name: string;
  totalPopulation: number;
  sexRatio: number;
  literacyTotal: number;
  urbanPct: number;
  density: number;
  areaSqKm: number;
  religion: Record<string, number>;
  caste: Record<string, number>;
};

// 29 districts — Bengaluru Urban (deep pilot) and Vijayanagara (post-2021 bifurcation)
// are intentionally absent. First entry's slug corrected to "bagalkot" (see header).
const DISTRICT_DATA: DistrictRow[] = [
  { slug: "bagalkot",         name: "Bagalkot",         totalPopulation: 1889752, sexRatio:  984, literacyTotal: 68.82, urbanPct: 28.97, density: 288,  areaSqKm:  6575, religion: { Buddhist: 0.01, Christian: 0.26, Hindu: 81.83, Jain: 0.31, Muslim: 17.40, NotStated: 0.15, Other: 0.01, Sikh: 0.03 }, caste: { SC: 18.03, ST:  2.90, Other: 79.07 } },
  { slug: "ballari",          name: "Ballari",          totalPopulation: 2452595, sexRatio:  987, literacyTotal: 67.85, urbanPct: 41.71, density: 300,  areaSqKm:  8447, religion: { Buddhist: 0.02, Christian: 0.48, Hindu: 82.21, Jain: 0.06, Muslim: 16.88, NotStated: 0.13, Other: 0.19, Sikh: 0.03 }, caste: { SC: 19.16, ST: 18.64, Other: 62.20 } },
  { slug: "belagavi",         name: "Belagavi",         totalPopulation: 4779661, sexRatio:  973, literacyTotal: 73.48, urbanPct: 25.10, density: 356,  areaSqKm: 13415, religion: { Buddhist: 0.02, Christian: 0.75, Hindu: 85.25, Jain: 1.57, Muslim: 11.64, NotStated: 0.09, Other: 0.02, Sikh: 0.65 }, caste: { SC: 11.05, ST:  5.53, Other: 83.42 } },
  { slug: "bengaluru-rural",  name: "Bengaluru Rural",  totalPopulation:  990923, sexRatio:  946, literacyTotal: 77.93, urbanPct: 17.22, density: 441,  areaSqKm:  2259, religion: { Buddhist: 0.03, Christian: 1.66, Hindu: 88.83, Jain: 0.15, Muslim:  9.18, NotStated: 0.13, Other: 0.01, Sikh: 0.01 }, caste: { SC: 18.85, ST:  6.00, Other: 75.15 } },
  { slug: "bidar",            name: "Bidar",            totalPopulation: 1703300, sexRatio:  952, literacyTotal: 70.51, urbanPct: 24.67, density: 312,  areaSqKm:  5448, religion: { Buddhist: 0.05, Christian: 0.59, Hindu: 76.35, Jain: 0.09, Muslim: 21.26, NotStated: 0.05, Other: 1.58, Sikh: 0.03 }, caste: { SC: 20.11, ST: 12.28, Other: 67.61 } },
  { slug: "chamarajanagar",   name: "Chamarajanagar",   totalPopulation: 1020791, sexRatio:  993, literacyTotal: 61.43, urbanPct: 17.02, density: 181,  areaSqKm:  5648, religion: { Buddhist: 0.02, Christian: 0.15, Hindu: 93.54, Jain: 0.13, Muslim:  6.04, NotStated: 0.09, Other: 0.02, Sikh: 0.01 }, caste: { SC: 24.75, ST: 12.50, Other: 62.75 } },
  { slug: "chikkaballapur",   name: "Chikkaballapur",   totalPopulation: 1254377, sexRatio:  962, literacyTotal: 69.76, urbanPct: 23.13, density: 295,  areaSqKm:  4244, religion: { Buddhist: 0.01, Christian: 0.57, Hindu: 87.36, Jain: 0.05, Muslim: 11.86, NotStated: 0.12, Other: 0.02, Sikh: 0.01 }, caste: { SC: 24.05, ST:  8.68, Other: 67.27 } },
  { slug: "chikkamagaluru",   name: "Chikkamagaluru",   totalPopulation: 1137961, sexRatio: 1005, literacyTotal: 79.25, urbanPct: 21.20, density: 158,  areaSqKm:  7201, religion: { Buddhist: 0.03, Christian: 1.78, Hindu: 84.90, Jain: 0.24, Muslim: 12.89, NotStated: 0.13, Other: 0.02, Sikh: 0.01 }, caste: { SC: 19.42, ST:  3.49, Other: 77.09 } },
  { slug: "chitradurga",      name: "Chitradurga",      totalPopulation: 1659456, sexRatio:  969, literacyTotal: 73.71, urbanPct: 20.02, density: 205,  areaSqKm:  8440, religion: { Buddhist: 0.36, Christian: 0.27, Hindu: 91.13, Jain: 0.07, Muslim:  7.82, NotStated: 0.25, Other: 0.07, Sikh: 0.03 }, caste: { SC: 23.52, ST: 17.68, Other: 58.80 } },
  { slug: "dakshina-kannada", name: "Dakshina Kannada", totalPopulation: 2089649, sexRatio: 1018, literacyTotal: 88.57, urbanPct: 47.67, density: 457,  areaSqKm:  4866, religion: { Buddhist: 0.01, Christian: 7.10, Hindu: 67.86, Jain: 0.26, Muslim: 24.26, NotStated: 0.15, Other: 0.26, Sikh: 0.10 }, caste: { SC:  6.87, ST:  3.04, Other: 90.09 } },
  { slug: "davanagere",       name: "Davangere",        totalPopulation: 1945497, sexRatio:  972, literacyTotal: 75.74, urbanPct: 32.38, density: 340,  areaSqKm:  5925, religion: { Buddhist: 0.10, Christian: 0.33, Hindu: 83.10, Jain: 0.03, Muslim: 15.98, NotStated: 0.15, Other: 0.27, Sikh: 0.04 }, caste: { SC: 19.18, ST: 11.08, Other: 69.74 } },
  { slug: "dharwad",          name: "Dharwad",          totalPopulation: 1847023, sexRatio:  971, literacyTotal: 80.00, urbanPct: 56.68, density: 435,  areaSqKm:  4260, religion: { Buddhist: 0.01, Christian: 0.90, Hindu: 77.77, Jain: 0.82, Muslim: 20.09, NotStated: 0.15, Other: 0.15, Sikh: 0.11 }, caste: { SC: 10.34, ST:  6.11, Other: 83.55 } },
  { slug: "gadag",            name: "Gadag",            totalPopulation: 1064570, sexRatio:  983, literacyTotal: 75.07, urbanPct: 35.72, density: 231,  areaSqKm:  4656, religion: { Buddhist: 0.01, Christian: 0.13, Hindu: 86.31, Jain: 0.26, Muslim: 13.04, NotStated: 0.19, Other: 0.03, Sikh: 0.04 }, caste: { SC: 11.99, ST:  9.23, Other: 78.78 } },
  { slug: "hassan",           name: "Hassan",           totalPopulation: 1776421, sexRatio: 1005, literacyTotal: 75.89, urbanPct: 21.33, density: 261,  areaSqKm:  6814, religion: { Buddhist: 0.01, Christian: 1.11, Hindu: 91.75, Jain: 0.15, Muslim:  6.73, NotStated: 0.19, Other: 0.02, Sikh: 0.04 }, caste: { SC: 21.25, ST:  2.16, Other: 76.59 } },
  { slug: "haveri",           name: "Haveri",           totalPopulation: 1597668, sexRatio:  960, literacyTotal: 77.59, urbanPct: 22.67, density: 331,  areaSqKm:  4823, religion: { Buddhist: 0.02, Christian: 0.10, Hindu: 88.53, Jain: 0.14, Muslim: 10.99, NotStated: 0.16, Other: 0.02, Sikh: 0.04 }, caste: { SC: 13.42, ST: 10.64, Other: 75.94 } },
  { slug: "kalaburagi",       name: "Kalaburagi",       totalPopulation: 2566326, sexRatio:  971, literacyTotal: 64.85, urbanPct: 31.21, density: 233,  areaSqKm: 10951, religion: { Buddhist: 0.02, Christian: 1.81, Hindu: 81.52, Jain: 0.41, Muslim: 15.88, NotStated: 0.20, Other: 0.13, Sikh: 0.03 }, caste: { SC: 23.07, ST:  5.07, Other: 71.86 } },
  { slug: "kodagu",           name: "Kodagu",           totalPopulation:  554519, sexRatio: 1019, literacyTotal: 82.52, urbanPct: 14.72, density: 135,  areaSqKm:  4102, religion: { Buddhist: 0.06, Christian: 8.00, Hindu: 82.42, Jain: 0.47, Muslim:  8.77, NotStated: 0.18, Other: 0.06, Sikh: 0.04 }, caste: { SC: 13.06, ST:  8.68, Other: 78.26 } },
  { slug: "kolar",            name: "Kolar",            totalPopulation: 1536401, sexRatio:  978, literacyTotal: 74.39, urbanPct: 31.93, density: 385,  areaSqKm:  3979, religion: { Buddhist: 0.05, Christian: 0.83, Hindu: 89.04, Jain: 0.07, Muslim:  9.77, NotStated: 0.21, Other: 0.02, Sikh: 0.01 }, caste: { SC: 30.53, ST:  6.10, Other: 63.37 } },
  { slug: "koppal",           name: "Koppal",           totalPopulation: 1389920, sexRatio:  983, literacyTotal: 67.28, urbanPct: 16.53, density: 250,  areaSqKm:  5565, religion: { Buddhist: 0.06, Christian: 0.14, Hindu: 84.71, Jain: 0.30, Muslim: 14.43, NotStated: 0.29, Other: 0.06, Sikh: 0.01 }, caste: { SC: 18.03, ST: 19.40, Other: 62.57 } },
  { slug: "mandya",           name: "Mandya",           totalPopulation: 1805769, sexRatio:  985, literacyTotal: 70.14, urbanPct: 16.08, density: 365,  areaSqKm:  4961, religion: { Buddhist: 0.01, Christian: 0.20, Hindu: 94.95, Jain: 0.18, Muslim:  4.58, NotStated: 0.08, Other: 0.00, Sikh: 0.00 }, caste: { SC: 15.33, ST:  1.35, Other: 83.32 } },
  { slug: "mysuru",           name: "Mysuru",           totalPopulation: 3001127, sexRatio:  982, literacyTotal: 72.79, urbanPct: 41.39, density: 476,  areaSqKm:  6307, religion: { Buddhist: 0.27, Christian: 0.98, Hindu: 87.53, Jain: 0.15, Muslim: 10.84, NotStated: 0.15, Other: 0.04, Sikh: 0.04 }, caste: { SC: 18.13, ST:  8.97, Other: 72.90 } },
  { slug: "raichur",          name: "Raichur",          totalPopulation: 1928812, sexRatio:  992, literacyTotal: 59.56, urbanPct: 22.28, density: 228,  areaSqKm:  8440, religion: { Buddhist: 0.03, Christian: 0.43, Hindu: 82.45, Jain: 0.21, Muslim: 16.47, NotStated: 0.19, Other: 0.16, Sikh: 0.06 }, caste: { SC: 20.76, ST: 19.03, Other: 60.21 } },
  { slug: "ramanagara",       name: "Ramanagara",       totalPopulation: 1082636, sexRatio:  977, literacyTotal: 69.22, urbanPct: 20.38, density: 329,  areaSqKm:  3516, religion: { Buddhist: 0.01, Christian: 0.26, Hindu: 84.53, Jain: 0.14, Muslim: 14.95, NotStated: 0.09, Other: 0.01, Sikh: 0.01 }, caste: { SC: 16.18, ST:  1.55, Other: 82.27 } },
  { slug: "shivamogga",       name: "Shivamogga",       totalPopulation: 1755512, sexRatio:  995, literacyTotal: 80.45, urbanPct: 35.31, density: 207,  areaSqKm:  8477, religion: { Buddhist: 0.10, Christian: 0.72, Hindu: 87.30, Jain: 0.34, Muslim: 11.26, NotStated: 0.25, Other: 0.02, Sikh: 0.01 }, caste: { SC: 17.38, ST:  3.82, Other: 78.80 } },
  { slug: "tumakuru",         name: "Tumakuru",         totalPopulation: 2678980, sexRatio:  984, literacyTotal: 75.14, urbanPct: 22.34, density: 253,  areaSqKm: 10597, religion: { Buddhist: 0.03, Christian: 0.32, Hindu: 90.20, Jain: 0.10, Muslim:  9.11, NotStated: 0.22, Other: 0.01, Sikh: 0.01 }, caste: { SC: 18.23, ST:  7.16, Other: 74.61 } },
  { slug: "udupi",            name: "Udupi",            totalPopulation: 1177361, sexRatio: 1094, literacyTotal: 86.24, urbanPct: 29.09, density: 329,  areaSqKm:  3582, religion: { Buddhist: 0.01, Christian: 3.26, Hindu: 88.30, Jain: 0.04, Muslim:  8.16, NotStated: 0.18, Other: 0.02, Sikh: 0.02 }, caste: { SC:  6.54, ST:  5.48, Other: 87.98 } },
  { slug: "uttara-kannada",   name: "Uttara Kannada",   totalPopulation: 1437169, sexRatio:  975, literacyTotal: 84.06, urbanPct: 30.66, density: 140,  areaSqKm: 10291, religion: { Buddhist: 0.02, Christian: 0.78, Hindu: 75.32, Jain: 0.17, Muslim: 23.35, NotStated: 0.12, Other: 0.18, Sikh: 0.06 }, caste: { SC:  7.90, ST:  2.01, Other: 90.09 } },
  { slug: "vijayapura",       name: "Vijayapura",       totalPopulation: 2177331, sexRatio:  956, literacyTotal: 67.15, urbanPct: 23.24, density: 207,  areaSqKm: 10494, religion: { Buddhist: 0.00, Christian: 0.47, Hindu: 78.98, Jain: 0.31, Muslim: 19.94, NotStated: 0.14, Other: 0.10, Sikh: 0.06 }, caste: { SC: 20.79, ST:  4.11, Other: 75.10 } },
  { slug: "yadgir",           name: "Yadgir",           totalPopulation: 1174271, sexRatio:  986, literacyTotal: 51.83, urbanPct: 19.18, density: 226,  areaSqKm:  5196, religion: { Buddhist: 0.03, Christian: 0.11, Hindu: 84.02, Jain: 0.09, Muslim: 15.57, NotStated: 0.14, Other: 0.03, Sikh: 0.01 }, caste: { SC: 22.17, ST: 11.89, Other: 65.94 } },
  // Intentionally excluded:
  //   - "bengaluru-urban" (deep pilot, seeded in seed-bengaluru-urban-demographics.ts)
  //   - "vijayanagara"   (bifurcated from Ballari in 2021 — no Census 2011 row exists)
];

export async function seedKarnatakaDistrictsDemographics(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log(
      `\n📊 Seeding ${DISTRICT_DATA.length} Karnataka districts — Census 2011 baseline...`,
    );

    const karnataka = await client.state.findUniqueOrThrow({
      where: { slug: "karnataka" },
    });

    let seeded = 0;
    let skipped = 0;

    for (const d of DISTRICT_DATA) {
      const district = await client.district.findUnique({
        where: { stateId_slug: { stateId: karnataka.id, slug: d.slug } },
      });
      if (!district) {
        console.log(
          `  ⚠️  District not found in DB: ${d.slug} — skipping (check hierarchy slug)`,
        );
        skipped++;
        continue;
      }

      const existing = await client.demographicProfile.findFirst({
        where: {
          districtId: district.id,
          year: 2011,
          dataset: "Census 2011",
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
          year: 2011,
          dataset: "Census 2011",
          totalPopulation: d.totalPopulation,
          sexRatio: d.sexRatio,
          literacyTotal: d.literacyTotal,
          urbanPct: d.urbanPct,
          density: d.density,
          areaSqKm: d.areaSqKm,
          religion: d.religion,
          caste: d.caste,
          sourceName:
            "Office of the Registrar General & Census Commissioner, India",
          sourceUrl: "https://censusindia.gov.in/nada/index.php/catalog/42571",
          sourceLicense: "Public",
          retrievedAt: new Date(),
          publishedAt: new Date("2015-08-25"),
          notes: `${d.name} Census 2011 core profile.${d.slug === "ballari" ? " Note: Ballari was bifurcated in 2021 to create Vijayanagara — this row reflects the undivided 2011 district." : ""}`,
          boundaryVintage: "Census_2011",
        },
      });
      seeded++;
    }

    console.log(
      `  ✅ Karnataka districts: ${seeded} seeded, ${skipped} skipped`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedKarnatakaDistrictsDemographics()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
