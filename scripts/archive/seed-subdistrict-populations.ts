/**
 * ForThePeople.in — Sub-district population seeder
 * Updates population + area on ALL Taluk records in DB for active districts.
 * Works for ALL states: taluks, mandals, blocks, zones.
 * Source: Census of India 2011 (approximate where noted)
 * Run: npx tsx scripts/archive/seed-subdistrict-populations.ts
 */
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// Population data keyed by [stateSlug][districtSlug][talukSlug]
// Source: Census of India 2011, seed-hierarchy.ts values
const POPULATION_DATA: Record<string, Record<string, Record<string, { population: number; area: number }>>> = {
  karnataka: {
    mandya: {
      "mandya":        { population: 516098, area: 727 },
      "maddur":        { population: 290000, area: 686 },
      "malavalli":     { population: 270000, area: 705 },
      "srirangapatna": { population: 225000, area: 581 },
      "nagamangala":   { population: 220000, area: 791 },
      "kr-pete":       { population: 235000, area: 727 },
      "pandavapura":   { population: 175000, area: 744 },
    },
    mysuru: {
      "mysuru-taluk":  { population: 1800000, area: 1654 },
      "hunsur":        { population: 320000, area: 862 },
      "nanjangud":     { population: 325000, area: 936 },
      "t-narasipur":   { population: 260000, area: 1005 },
      "hd-kote":       { population: 220000, area: 2374 },
      "periyapatna":   { population: 210000, area: 782 },
      "kr-nagar":      { population: 215000, area: 1079 },
    },
    "bengaluru-urban": {
      "bengaluru-north": { population: 3800000, area: 198 },
      "bengaluru-south": { population: 4200000, area: 186 },
      "bengaluru-east":  { population: 3100000, area: 194 },
      "anekal":          { population: 1665000, area: 163 },
    },
  },
  telangana: {
    hyderabad: {
      "charminar":     { population: 260000, area: 8 },
      "secunderabad":  { population: 305000, area: 15 },
      "nampally":      { population: 245000, area: 11 },
      "khairatabad":   { population: 210000, area: 9 },
      "amberpet":      { population: 320000, area: 12 },
      "asifnagar":     { population: 280000, area: 15 },
      "bahadurpura":   { population: 468000, area: 22 },
      "bandlaguda":    { population: 350000, area: 30 },
      "golkonda":      { population: 310000, area: 20 },
      "himayatnagar":  { population: 220000, area: 10 },
      "musheerabad":   { population: 295000, area: 14 },
      "saidabad":      { population: 275000, area: 16 },
      "ameerpet":      { population: 59000, area: 4 },
      "tirumalagiri":  { population: 180000, area: 12 },
      "maredpally":    { population: 195000, area: 10 },
      "shaikpet":      { population: 230000, area: 18 },
    },
  },
  delhi: {
    "new-delhi": {
      "connaught-place":        { population: 350000, area: 12 },
      "chanakyapuri":           { population: 280000, area: 11 },
      "lodhi-road":             { population: 543000, area: 12 },
      // seed-hierarchy alternative slug:
      "new-delhi-subdivision":  { population: 142004, area: 35 },
    },
  },
  maharashtra: {
    mumbai: {
      "andheri":       { population: 2000000, area: 75 },
      "bandra":        { population: 1500000, area: 60 },
      "borivali":      { population: 1200000, area: 80 },
      "kurla":         { population: 1100000, area: 50 },
      "dadar":         { population: 800000, area: 40 },
      "colaba":        { population: 600000, area: 30 },
      "fort-town":     { population: 400000, area: 25 },
      "malad":         { population: 1500000, area: 70 },
      // districts.ts alternative slugs:
      "south-mumbai":     { population: 3100000, area: 68 },
      "western-suburbs":  { population: 4500000, area: 175 },
      "eastern-suburbs":  { population: 2200000, area: 120 },
      "navi-mumbai-zone": { population: 1500000, area: 160 },
      "north-mumbai":     { population: 1142373, area: 80 },
    },
  },
  "west-bengal": {
    kolkata: {
      "kolkata-north":     { population: 1100000, area: 40 },
      "kolkata-south":     { population: 1200000, area: 50 },
      "kolkata-central":   { population: 900000, area: 35 },
      "kolkata-east":      { population: 800000, area: 35 },
      "kolkata-west-port": { population: 486679, area: 25 },
    },
  },
  "tamil-nadu": {
    chennai: {
      "egmore-nungambakkam": { population: 1800000, area: 140 },
      "mambalam-guindy":     { population: 1700000, area: 150 },
      "madhavaram":          { population: 1146732, area: 136 },
      // districts.ts alternative slugs:
      "chennai-north":       { population: 1200000, area: 110 },
      "chennai-south":       { population: 1400000, area: 130 },
      "chennai-central":     { population: 1100000, area: 95 },
      "chennai-west":        { population: 946732, area: 91 },
    },
  },
  "uttar-pradesh": {
    lucknow: {
      "lucknow-city":      { population: 2800000, area: 350 },
      "mohanlalganj":      { population: 800000, area: 750 },
      "malihabad":         { population: 400000, area: 680 },
      "bakshi-ka-talab":   { population: 600000, area: 748 },
    },
  },
};

async function main() {
  console.log("🏘️  Seeding sub-district population data...\n");

  let totalUpdated = 0;
  let totalSkipped = 0;

  // Get all active districts with their taluks
  const activeDistricts = await prisma.district.findMany({
    where: { active: true },
    include: {
      state: { select: { slug: true, name: true } },
      taluks: { select: { id: true, slug: true, name: true, population: true, area: true } },
    },
  });

  for (const district of activeDistricts) {
    const stateSlug = district.state.slug;
    const districtSlug = district.slug;
    const popData = POPULATION_DATA[stateSlug]?.[districtSlug];

    if (!popData) {
      console.log(`⏭  ${district.name} (${district.state.name}) — no population data configured`);
      continue;
    }

    console.log(`── ${district.name} (${district.state.name}) ──`);
    let districtUpdated = 0;
    let districtSkipped = 0;

    for (const taluk of district.taluks) {
      const data = popData[taluk.slug];
      if (!data) {
        console.log(`  ⚠ ${taluk.slug} — not found in population data, skipping`);
        districtSkipped++;
        totalSkipped++;
        continue;
      }

      // Only update if population is missing or zero
      if (taluk.population && taluk.population > 0 && taluk.area && taluk.area > 0) {
        console.log(`  ⏭ ${taluk.slug} — already has population (${taluk.population.toLocaleString()})`);
        districtSkipped++;
        totalSkipped++;
        continue;
      }

      await prisma.taluk.update({
        where: { id: taluk.id },
        data: {
          population: data.population,
          area: data.area,
        },
      });
      console.log(`  ✓ ${taluk.slug}: ${data.population.toLocaleString()} pop, ${data.area} km²`);
      districtUpdated++;
      totalUpdated++;
    }

    console.log(`  → ${districtUpdated} updated, ${districtSkipped} skipped\n`);
  }

  console.log(`\n🎉 Done! Updated: ${totalUpdated}, Skipped: ${totalSkipped}`);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
