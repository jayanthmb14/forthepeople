// ═══════════════════════════════════════════════════════════
// FILE 4 of 6: Mysuru District + 7 Taluks + Villages
// Run standalone: npx tsx prisma/seed-mysuru-hierarchy.ts
// Or imported by seed-expansion.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedMysuruHierarchy(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📍 [4/6] Seeding Mysuru District hierarchy...");

    // ── Karnataka State (upsert — already exists) ────────────
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

    // ── Mysuru District ───────────────────────────────────────
    const mysuru = await client.district.upsert({
      where: { stateId_slug: { stateId: karnataka.id, slug: "mysuru" } },
      update: {
        active: true,
        population: 3248000,
        area: 6854,
        talukCount: 7,
        villageCount: 2629,
        literacy: 72.64,
        sexRatio: 984,
        density: 461,
        avgRainfall: 780,
      },
      create: {
        stateId: karnataka.id,
        name: "Mysuru",
        nameLocal: "ಮೈಸೂರು",
        slug: "mysuru",
        tagline: "City of Palaces",
        taglineLocal: "ಅರಮನೆಗಳ ನಗರ",
        active: true,
        population: 3248000,
        area: 6854,
        talukCount: 7,
        villageCount: 2629,
        literacy: 72.64,
        sexRatio: 984,
        density: 461,
        avgRainfall: 780,
      },
    });
    console.log(`  ✓ Mysuru district (id: ${mysuru.id})`);

    // ── 7 Taluks ─────────────────────────────────────────────
    const talukData = [
      {
        slug: "mysuru-taluk",
        name: "Mysuru",
        nameLocal: "ಮೈಸೂರು",
        tagline: "Heritage Capital of Karnataka",
        population: 1800000,
        area: 1654,
        villageCount: 362,
        villages: [
          { slug: "mysuru-city",   name: "Mysuru City",    nameLocal: "ಮೈಸೂರು ನಗರ",     population: 920000, pincode: "570001" },
          { slug: "bogadi",        name: "Bogadi",         nameLocal: "ಬೊಗಾಡಿ",           population: 42000,  pincode: "570026" },
          { slug: "hebbal-mysuru", name: "Hebbal",         nameLocal: "ಹೆಬ್ಬಾಳ",           population: 38000,  pincode: "570016" },
          { slug: "nanjangud-road",name: "Nanjangud Road", nameLocal: "ನಂಜನಗೂಡು ರಸ್ತೆ",   population: 28000,  pincode: "570008" },
          { slug: "bannur",        name: "Bannur",         nameLocal: "ಬನ್ನೂರು",            population: 22000,  pincode: "571101" },
        ],
      },
      {
        slug: "hunsur",
        name: "Hunsur",
        nameLocal: "ಹನ್ಸೂರು",
        tagline: "Coffee & Cardamom Country",
        population: 320000,
        area: 862,
        villageCount: 284,
        villages: [
          { slug: "hunsur-town",   name: "Hunsur",         nameLocal: "ಹನ್ಸೂರು",           population: 55000,  pincode: "571105" },
          { slug: "bettadapura",   name: "Bettadapura",    nameLocal: "ಬೆಟ್ಟದಪುರ",         population: 12000,  pincode: "571108" },
          { slug: "sargur",        name: "Sargur",         nameLocal: "ಸರ್ಗೂರು",            population: 18000,  pincode: "571109" },
          { slug: "kathriguppe",   name: "Kathriguppe",    nameLocal: "ಕತ್ತ್ರಿಗುಪ್ಪೆ",       population: 9000,   pincode: "571107" },
          { slug: "bilikere",      name: "Bilikere",       nameLocal: "ಬಿಳಿಕೆರೆ",           population: 14000,  pincode: "571104" },
        ],
      },
      {
        slug: "nanjangud",
        name: "Nanjangud",
        nameLocal: "ನಂಜನಗೂಡು",
        tagline: "Temple Town on the Kapila",
        population: 325000,
        area: 936,
        villageCount: 325,
        villages: [
          { slug: "nanjangud-town",name: "Nanjangud",      nameLocal: "ನಂಜನಗೂಡು",          population: 78000,  pincode: "571301" },
          { slug: "tagadur",       name: "Tagadur",        nameLocal: "ತಾಗಡೂರು",            population: 8000,   pincode: "571312" },
          { slug: "natanahalli",   name: "Natanahalli",    nameLocal: "ನಾಟನಹಳ್ಳಿ",          population: 6500,   pincode: "571302" },
          { slug: "gundlupet-jn",  name: "Gundlupet Jn",  nameLocal: "ಗುಂಡ್ಲುಪೇಟೆ ಜಂಕ್ಷನ್", population: 11000,  pincode: "571111" },
          { slug: "hullahalli",    name: "Hullahalli",     nameLocal: "ಹುಲ್ಲಹಳ್ಳಿ",          population: 7500,   pincode: "571304" },
        ],
      },
      {
        slug: "t-narasipur",
        name: "T. Narasipur",
        nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",
        tagline: "Triveni Sangama — Three Rivers Meet",
        population: 260000,
        area: 1005,
        villageCount: 348,
        villages: [
          { slug: "t-narasipur-town",name: "T. Narasipur",nameLocal: "ತಿ. ನರಸೀಪುರ",        population: 32000,  pincode: "571124" },
          { slug: "muguru",         name: "Muguru",        nameLocal: "ಮುಗೂರು",             population: 7000,   pincode: "571127" },
          { slug: "hosa-holalu",    name: "Hosa Holalu",   nameLocal: "ಹೊಸ ಹೊಳಲು",          population: 5500,   pincode: "571123" },
          { slug: "sathegala",      name: "Sathegala",     nameLocal: "ಸಾತೆಗಾಲ",            population: 8000,   pincode: "571126" },
          { slug: "kalale",         name: "Kalale",        nameLocal: "ಕಳಲೆ",               population: 6000,   pincode: "571122" },
        ],
      },
      {
        slug: "hd-kote",
        name: "H.D. Kote",
        nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",
        tagline: "Gateway to Nagarahole",
        population: 220000,
        area: 2374,
        villageCount: 370,
        villages: [
          { slug: "hd-kote-town",  name: "H.D. Kote",      nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",       population: 28000,  pincode: "571114" },
          { slug: "nagarahole",    name: "Nagarahole",      nameLocal: "ನಾಗರಹೊಳೆ",           population: 5000,   pincode: "571118" },
          { slug: "antarsante",    name: "Antarsante",      nameLocal: "ಅಂತರ್ಸಂತೆ",          population: 8000,   pincode: "571116" },
          { slug: "kuttoor",       name: "Kuttoor",         nameLocal: "ಕುತ್ತೂರು",            population: 6500,   pincode: "571115" },
          { slug: "manchala",      name: "Manchala",        nameLocal: "ಮಂಚಾಲ",              population: 4500,   pincode: "571117" },
        ],
      },
      {
        slug: "periyapatna",
        name: "Periyapatna",
        nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",
        tagline: "Land of Turmeric and Pepper",
        population: 210000,
        area: 782,
        villageCount: 260,
        villages: [
          { slug: "periyapatna-town",name: "Periyapatna",  nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",        population: 38000,  pincode: "571107" },
          { slug: "shivapura-mys",  name: "Shivapura",     nameLocal: "ಶಿವಪುರ",             population: 7000,   pincode: "571119" },
          { slug: "hosaholalu",     name: "Hosaholalu",    nameLocal: "ಹೊಸಹೊಳಲು",           population: 5500,   pincode: "571120" },
          { slug: "balehonnur-jn",  name: "Balehonnur Jn", nameLocal: "ಬಾಳೆಹೊನ್ನೂರು ಜಂಕ್ಷನ್", population: 9000,   pincode: "571108" },
          { slug: "hannur",         name: "Hannur",        nameLocal: "ಹಣ್ಣೂರು",             population: 6000,   pincode: "571121" },
        ],
      },
      {
        slug: "kr-nagar",
        name: "K.R. Nagar",
        nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",
        tagline: "Cauvery Heartland",
        population: 215000,
        area: 1079,
        villageCount: 305,
        villages: [
          { slug: "kr-nagar-town", name: "K.R. Nagar",     nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",         population: 34000,  pincode: "571602" },
          { slug: "arakere-mys",   name: "Arakere",         nameLocal: "ಅರಕೆರೆ",              population: 8000,   pincode: "571604" },
          { slug: "yedatore",      name: "Yedatore",        nameLocal: "ಯಡತೊರೆ",              population: 7500,   pincode: "571603" },
          { slug: "bherya",        name: "Bherya",          nameLocal: "ಭೇರ್ಯ",               population: 5500,   pincode: "571605" },
          { slug: "krishnarajasagara", name: "KRS Dam Area", nameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ",     population: 12000,  pincode: "571607" },
        ],
      },
    ];

    const taluks: Record<string, { id: string }> = {};
    for (const t of talukData) {
      const taluk = await client.taluk.upsert({
        where: { districtId_slug: { districtId: mysuru.id, slug: t.slug } },
        update: { population: t.population, area: t.area, villageCount: t.villageCount },
        create: {
          districtId: mysuru.id,
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

    console.log("  ✓ 7 taluks + 35 key localities seeded");
    console.log("  ✅ Mysuru hierarchy complete\n");

    return { mysuru, taluks };
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedMysuruHierarchy(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
