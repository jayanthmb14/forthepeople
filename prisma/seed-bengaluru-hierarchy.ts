// ═══════════════════════════════════════════════════════════
// FILE 1 of 6: Bengaluru Urban — District + Taluks + Villages
// Run standalone: npx tsx prisma/seed-bengaluru-hierarchy.ts
// Or imported by seed-expansion.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

export async function seedBengaluruHierarchy(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📍 [1/6] Seeding Bengaluru Urban hierarchy...");

    // ── Karnataka State (upsert — already exists from Mandya seed) ──
    const karnataka = await client.state.upsert({
      where: { slug: "karnataka" },
      update: { active: true },
      create: {
        name: "Karnataka",
        nameLocal: "ಕರ್ನಾಟಕ",
        slug: "karnataka",
        active: true,
        capital: "Bengaluru",
      },
    });
    console.log("  ✓ Karnataka state (upserted)");

    // ── Bengaluru Urban District ─────────────────────────────────
    const bengaluruUrban = await client.district.upsert({
      where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
      update: {
        active: true,
        population: 12765000,
        area: 741,
        talukCount: 4,
        villageCount: 532,
        literacy: 88.48,
        sexRatio: 916,
        density: 17230,
        avgRainfall: 970,
      },
      create: {
        stateId: karnataka.id,
        name: "Bengaluru Urban",
        nameLocal: "ಬೆಂಗಳೂರು ನಗರ",
        slug: "bengaluru-urban",
        tagline: "Silicon Valley of India",
        taglineLocal: "ಭಾರತದ ಸಿಲಿಕಾನ್ ಕಣಿವೆ",
        active: true,
        population: 12765000,
        area: 741,
        talukCount: 4,
        villageCount: 532,
        literacy: 88.48,
        sexRatio: 916,
        density: 17230,
        avgRainfall: 970,
      },
    });
    console.log(`  ✓ Bengaluru Urban district (id: ${bengaluruUrban.id})`);

    // ── 4 Taluks ────────────────────────────────────────────────
    const talukData = [
      {
        slug: "bengaluru-north",
        name: "Bengaluru North",
        nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",
        tagline: "Gateway to the Airport",
        population: 3800000,
        area: 198,
        villageCount: 145,
        villages: [
          { slug: "yelahanka",           name: "Yelahanka",           nameLocal: "ಯಲಹಂಕ",                   population: 250000, pincode: "560064" },
          { slug: "devanahalli",         name: "Devanahalli",         nameLocal: "ದೇವನಹಳ್ಳಿ",                population: 45000,  pincode: "562110" },
          { slug: "doddaballapur",       name: "Doddaballapur",       nameLocal: "ದೊಡ್ಡಬಳ್ಳಾಪುರ",            population: 60000,  pincode: "561203" },
          { slug: "hesaraghatta",        name: "Hesaraghatta",        nameLocal: "ಹೆಸರಘಟ್ಟ",                 population: 18000,  pincode: "560088" },
          { slug: "chikkaballapur-road", name: "Chikkaballapur Road", nameLocal: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ ರಸ್ತೆ",      population: 32000,  pincode: "562101" },
        ],
      },
      {
        slug: "bengaluru-south",
        name: "Bengaluru South",
        nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ",
        tagline: "Heart of the Garden City",
        population: 4200000,
        area: 186,
        villageCount: 120,
        villages: [
          { slug: "jayanagar",       name: "Jayanagar",       nameLocal: "ಜಯನಗರ",              population: 450000, pincode: "560041" },
          { slug: "basavanagudi",    name: "Basavanagudi",    nameLocal: "ಬಸವನಗುಡಿ",           population: 120000, pincode: "560004" },
          { slug: "btm-layout",      name: "BTM Layout",      nameLocal: "ಬಿ.ಟಿ.ಎಂ ಲೇಔಟ್",    population: 280000, pincode: "560076" },
          { slug: "bannerghatta-road", name: "Bannerghatta Road", nameLocal: "ಬನ್ನೇರಘಟ್ಟ ರಸ್ತೆ", population: 320000, pincode: "560083" },
          { slug: "kanakapura-road", name: "Kanakapura Road", nameLocal: "ಕನಕಪುರ ರಸ್ತೆ",       population: 195000, pincode: "560062" },
        ],
      },
      {
        slug: "bengaluru-east",
        name: "Bengaluru East",
        nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",
        tagline: "IT Corridor Hub",
        population: 3100000,
        area: 194,
        villageCount: 150,
        villages: [
          { slug: "whitefield",   name: "Whitefield",   nameLocal: "ವೈಟ್‌ಫೀಲ್ಡ್",           population: 380000, pincode: "560066" },
          { slug: "kr-puram",     name: "K R Puram",    nameLocal: "ಕೆ.ಆರ್.ಪುರ",             population: 420000, pincode: "560036" },
          { slug: "marathahalli", name: "Marathahalli", nameLocal: "ಮರಾಠಾಹಳ್ಳಿ",             population: 350000, pincode: "560037" },
          { slug: "hsr-layout",   name: "HSR Layout",   nameLocal: "ಎಚ್.ಎಸ್.ಆರ್ ಲೇಔಟ್",    population: 200000, pincode: "560102" },
          { slug: "indiranagar",  name: "Indiranagar",  nameLocal: "ಇಂದಿರಾನಗರ",              population: 180000, pincode: "560038" },
        ],
      },
      {
        slug: "anekal",
        name: "Anekal",
        nameLocal: "ಆನೇಕಲ್",
        tagline: "Electronics City Gateway",
        population: 1665000,
        area: 163,
        villageCount: 117,
        villages: [
          { slug: "electronic-city", name: "Electronic City", nameLocal: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ", population: 280000, pincode: "560100" },
          { slug: "chandapura",      name: "Chandapura",      nameLocal: "ಚಂದಾಪುರ",              population: 95000,  pincode: "562106" },
          { slug: "anekal-town",     name: "Anekal Town",     nameLocal: "ಆನೇಕಲ್ ಪಟ್ಟಣ",        population: 38000,  pincode: "562106" },
          { slug: "sarjapur",        name: "Sarjapur",        nameLocal: "ಸರ್ಜಾಪುರ",             population: 120000, pincode: "562125" },
          { slug: "attibele",        name: "Attibele",        nameLocal: "ಅತ್ತಿಬೆಲೆ",            population: 55000,  pincode: "562107" },
        ],
      },
    ];

    const taluks: Record<string, { id: string }> = {};
    for (const t of talukData) {
      const taluk = await client.taluk.upsert({
        where: { districtId_slug: { districtId: bengaluruUrban.id, slug: t.slug } },
        update: { population: t.population, area: t.area, villageCount: t.villageCount },
        create: {
          districtId: bengaluruUrban.id,
          name: t.name,
          nameLocal: t.nameLocal,
          slug: t.slug,
          tagline: t.tagline,
          population: t.population,
          area: t.area,
          villageCount: t.villageCount,
        },
      });
      taluks[t.slug] = taluk;

      // Villages for this taluk
      for (const v of t.villages) {
        await client.village.upsert({
          where: { talukId_slug: { talukId: taluk.id, slug: v.slug } },
          update: {},
          create: {
            talukId: taluk.id,
            name: v.name,
            nameLocal: v.nameLocal,
            slug: v.slug,
            population: v.population,
            pincode: v.pincode,
          },
        });
      }
      console.log(`  ✓ Taluk: ${t.name} (${t.villages.length} villages)`);
    }

    console.log("  ✓ 4 taluks + 20 key localities seeded");
    console.log("  ✅ Bengaluru Urban hierarchy complete\n");

    return { bengaluruUrban, taluks };
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ───────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedBengaluruHierarchy(client)
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => client.$disconnect());
}
