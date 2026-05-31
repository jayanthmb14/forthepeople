// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Safe Hierarchy Seeder
// Upserts State → District → Taluk WITHOUT deleting any data.
// Safe to run on production Neon DB.
//
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-hierarchy.ts
// Or:  npx tsx prisma/seed-hierarchy.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Upserting hierarchy (no deletes)...");

  // ── Karnataka State ──────────────────────────────────────
  const karnataka = await prisma.state.upsert({
    where: { slug: "karnataka" },
    update: { active: true },
    create: { name: "Karnataka", nameLocal: "ಕರ್ನಾಟಕ", slug: "karnataka", active: true, capital: "Bengaluru" },
  });
  console.log("✓ Karnataka state");

  // ── Districts ────────────────────────────────────────────
  const districtDefs = [
    {
      slug: "mandya",
      name: "Mandya", nameLocal: "ಮಂಡ್ಯ",
      tagline: "Sugar Capital of Karnataka", taglineLocal: "ಕರ್ನಾಟಕದ ಸಕ್ಕರೆ ನಗರ",
      population: 1940428, area: 4961, talukCount: 7, villageCount: 1291,
      literacy: 72.8, sexRatio: 982, density: 391.2, avgRainfall: 695,
      taluks: [
        { slug: "mandya",        name: "Mandya",        nameLocal: "ಮಂಡ್ಯ",          tagline: "Sugar Capital of Karnataka",    pop: 516098, area: 727, villages: 193 },
        { slug: "maddur",        name: "Maddur",        nameLocal: "ಮದ್ದೂರು",         tagline: "Gateway to Old Mysore",         pop: 290000, area: 686, villages: 174 },
        { slug: "malavalli",     name: "Malavalli",     nameLocal: "ಮಳವಳ್ಳಿ",         tagline: "Land of Temples & Tanks",       pop: 270000, area: 705, villages: 187 },
        { slug: "srirangapatna", name: "Srirangapatna", nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",    tagline: "Tipu Sultan's Island Fortress", pop: 225000, area: 581, villages: 135 },
        { slug: "nagamangala",   name: "Nagamangala",   nameLocal: "ನಾಗಮಂಗಲ",         tagline: "Heart of the Deccan Plateau",   pop: 220000, area: 791, villages: 200 },
        { slug: "kr-pete",       name: "K R Pete",      nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",     tagline: "Jewel of the Kaveri Basin",     pop: 235000, area: 727, villages: 210 },
        { slug: "pandavapura",   name: "Pandavapura",   nameLocal: "ಪಾಂಡವಪುರ",        tagline: "Where the Pandavas Rested",     pop: 175000, area: 744, villages: 192 },
      ],
    },
    {
      slug: "mysuru",
      name: "Mysuru", nameLocal: "ಮೈಸೂರು",
      tagline: "City of Palaces", taglineLocal: "ಅರಮನೆಗಳ ನಗರ",
      population: 3248000, area: 6854, talukCount: 7, villageCount: 2629,
      literacy: 72.64, sexRatio: 984, density: 474, avgRainfall: 750,
      taluks: [
        { slug: "mysuru-taluk",  name: "Mysuru",       nameLocal: "ಮೈಸೂರು",                  tagline: "Heritage Capital of Karnataka",       pop: 1800000, area: 1654, villages: 362 },
        { slug: "hunsur",        name: "Hunsur",        nameLocal: "ಹನ್ಸೂರು",                 tagline: "Coffee & Cardamom Country",           pop: 320000,  area: 862,  villages: 284 },
        { slug: "nanjangud",     name: "Nanjangud",     nameLocal: "ನಂಜನಗೂಡು",               tagline: "Temple Town on the Kapila",           pop: 325000,  area: 936,  villages: 325 },
        { slug: "t-narasipur",   name: "T. Narasipur",  nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",    tagline: "Triveni Sangama — Three Rivers Meet", pop: 260000,  area: 1005, villages: 348 },
        { slug: "hd-kote",       name: "H.D. Kote",     nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",           tagline: "Gateway to Nagarahole",              pop: 220000,  area: 2374, villages: 370 },
        { slug: "periyapatna",   name: "Periyapatna",   nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",           tagline: "Land of Turmeric and Pepper",         pop: 210000,  area: 782,  villages: 260 },
        { slug: "kr-nagar",      name: "K.R. Nagar",    nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",           tagline: "Cauvery Heartland",                  pop: 215000,  area: 1079, villages: 305 },
      ],
    },
    {
      slug: "bengaluru-urban",
      name: "Bengaluru Urban", nameLocal: "ಬೆಂಗಳೂರು ನಗರ",
      tagline: "Silicon Valley of India", taglineLocal: "ಭಾರತದ ಸಿಲಿಕಾನ್ ಕಣಿವೆ",
      population: 12765000, area: 741, talukCount: 4, villageCount: 532,
      literacy: 88.48, sexRatio: 916, density: 17232, avgRainfall: 970,
      taluks: [
        { slug: "bengaluru-north", name: "Bengaluru North", nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",  tagline: "Gateway to the Airport",   pop: 3800000, area: 198, villages: 145 },
        { slug: "bengaluru-south", name: "Bengaluru South", nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ", tagline: "Heart of the Garden City", pop: 4200000, area: 186, villages: 120 },
        { slug: "bengaluru-east",  name: "Bengaluru East",  nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",  tagline: "IT Corridor Hub",          pop: 3100000, area: 194, villages: 150 },
        { slug: "anekal",          name: "Anekal",          nameLocal: "ಆನೇಕಲ್",           tagline: "Electronics City Gateway", pop: 1665000, area: 163, villages: 117 },
      ],
    },
  ];

  for (const def of districtDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: karnataka.id, slug: def.slug } },
      update: { active: true },
      create: {
        stateId: karnataka.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline, taglineLocal: def.taglineLocal,
        active: true,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density, avgRainfall: def.avgRainfall,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} taluks`);
  }

  // ── Delhi (Union Territory) ──────────────────────────────
  console.log("\n🌱 Upserting Delhi (UT) hierarchy...");

  const delhi = await prisma.state.upsert({
    where: { slug: "delhi" },
    update: { active: true },
    create: { name: "Delhi", nameLocal: "दिल्ली", slug: "delhi", active: true, capital: "New Delhi" },
  });
  console.log("✓ Delhi state (UT)");

  const delhiDistrictDefs = [
    {
      slug: "new-delhi", name: "New Delhi", nameLocal: "नई दिल्ली",
      tagline: "Seat of India's Government", active: true,
      population: 142004, area: 35.0, talukCount: 0, villageCount: 0,
      literacy: 89.38, sexRatio: 902, density: 4057,
      taluks: [{ slug: "new-delhi-subdivision", name: "New Delhi Subdivision", nameLocal: "नई दिल्ली उपखंड", tagline: "Administrative Subdivision", pop: 142004, area: 35.0, villages: 0 }],
    },
    {
      slug: "central-delhi", name: "Central Delhi", nameLocal: "मध्य दिल्ली",
      tagline: "Heart of Old Delhi", active: false,
      population: 578671, area: 25.0, talukCount: 0, villageCount: 0,
      literacy: 83.14, sexRatio: 883, density: 23147,
      taluks: [
        { slug: "kotwali", name: "Kotwali", nameLocal: "कोतवाली", tagline: "Old Delhi Core", pop: 300000, area: 13.0, villages: 0 },
        { slug: "daryaganj", name: "Daryaganj", nameLocal: "दरियागंज", tagline: "Book Market Hub", pop: 278671, area: 12.0, villages: 0 },
      ],
    },
    {
      slug: "north-delhi", name: "North Delhi", nameLocal: "उत्तर दिल्ली",
      tagline: "University & Civil Lines Hub", active: false,
      population: 887978, area: 60.0, talukCount: 0, villageCount: 0,
      literacy: 84.75, sexRatio: 895, density: 14800,
      taluks: [
        { slug: "civil-lines", name: "Civil Lines", nameLocal: "सिविल लाइन्स", tagline: "Administrative Quarter", pop: 300000, area: 20.0, villages: 0 },
        { slug: "sadar-bazaar", name: "Sadar Bazaar", nameLocal: "सदर बाज़ार", tagline: "Wholesale Market Hub", pop: 300000, area: 20.0, villages: 0 },
        { slug: "model-town", name: "Model Town", nameLocal: "मॉडल टाउन", tagline: "Planned Residential Colony", pop: 287978, area: 20.0, villages: 0 },
      ],
    },
    {
      slug: "north-west-delhi", name: "North West Delhi", nameLocal: "उत्तर पश्चिम दिल्ली",
      tagline: "Delhi's Largest District", active: false,
      population: 3651261, area: 440.0, talukCount: 0, villageCount: 0,
      literacy: 82.47, sexRatio: 866, density: 8303,
      taluks: [
        { slug: "narela", name: "Narela", nameLocal: "नरेला", tagline: "Industrial Growth Zone", pop: 1200000, area: 150.0, villages: 0 },
        { slug: "rohini", name: "Rohini", nameLocal: "रोहिणी", tagline: "Sub-City of Delhi", pop: 1500000, area: 150.0, villages: 0 },
        { slug: "kanjhawala", name: "Kanjhawala", nameLocal: "कांझावला", tagline: "Rural-Urban Fringe", pop: 951261, area: 140.0, villages: 0 },
      ],
    },
    {
      slug: "north-east-delhi", name: "North East Delhi", nameLocal: "उत्तर पूर्व दिल्ली",
      tagline: "Densest District in India", active: false,
      population: 2241624, area: 60.0, talukCount: 0, villageCount: 0,
      literacy: 80.90, sexRatio: 886, density: 37360,
      taluks: [
        { slug: "seelampur", name: "Seelampur", nameLocal: "सीलमपुर", tagline: "Trans-Yamuna Settlement", pop: 800000, area: 20.0, villages: 0 },
        { slug: "seemapuri", name: "Seemapuri", nameLocal: "सीमापुरी", tagline: "Resettlement Colony", pop: 741624, area: 20.0, villages: 0 },
        { slug: "karawal-nagar", name: "Karawal Nagar", nameLocal: "करावल नगर", tagline: "Rapidly Urbanizing Zone", pop: 700000, area: 20.0, villages: 0 },
      ],
    },
    {
      slug: "east-delhi", name: "East Delhi", nameLocal: "पूर्व दिल्ली",
      tagline: "Trans-Yamuna Gateway", active: false,
      population: 1707725, area: 64.0, talukCount: 0, villageCount: 0,
      literacy: 86.05, sexRatio: 881, density: 26683,
      taluks: [
        { slug: "gandhi-nagar", name: "Gandhi Nagar", nameLocal: "गांधी नगर", tagline: "Garment Market Hub", pop: 570000, area: 21.0, villages: 0 },
        { slug: "preet-vihar", name: "Preet Vihar", nameLocal: "प्रीत विहार", tagline: "East Delhi Commercial Centre", pop: 570000, area: 21.0, villages: 0 },
        { slug: "vivek-vihar", name: "Vivek Vihar", nameLocal: "विवेक विहार", tagline: "Residential & Industrial Mix", pop: 567725, area: 22.0, villages: 0 },
      ],
    },
    {
      slug: "south-delhi", name: "South Delhi", nameLocal: "दक्षिण दिल्ली",
      tagline: "Affluent South & Diplomatic Enclave", active: false,
      population: 2731929, area: 250.0, talukCount: 0, villageCount: 0,
      literacy: 86.48, sexRatio: 898, density: 10928,
      taluks: [
        { slug: "defence-colony", name: "Defence Colony", nameLocal: "डिफेंस कॉलोनी", tagline: "Upscale Residential Area", pop: 910000, area: 83.0, villages: 0 },
        { slug: "hauz-khas", name: "Hauz Khas", nameLocal: "हौज़ खास", tagline: "Heritage & Culture Hub", pop: 910000, area: 83.0, villages: 0 },
        { slug: "mehrauli", name: "Mehrauli", nameLocal: "महरौली", tagline: "Qutub Minar Precinct", pop: 911929, area: 84.0, villages: 0 },
      ],
    },
    {
      slug: "south-west-delhi", name: "South West Delhi", nameLocal: "दक्षिण पश्चिम दिल्ली",
      tagline: "Dwarka & Airport Hub", active: false,
      population: 2292958, area: 420.0, talukCount: 0, villageCount: 0,
      literacy: 85.51, sexRatio: 844, density: 5460,
      taluks: [
        { slug: "dwarka", name: "Dwarka", nameLocal: "द्वारका", tagline: "Planned Sub-City", pop: 800000, area: 140.0, villages: 0 },
        { slug: "kapashera", name: "Kapashera", nameLocal: "कापशेरा", tagline: "Airport Periphery", pop: 700000, area: 140.0, villages: 0 },
        { slug: "najafgarh", name: "Najafgarh", nameLocal: "नजफगढ़", tagline: "Agricultural Hinterland", pop: 792958, area: 140.0, villages: 0 },
      ],
    },
    {
      slug: "south-east-delhi", name: "South East Delhi", nameLocal: "दक्षिण पूर्व दिल्ली",
      tagline: "Sarita Vihar & Badarpur Corridor", active: false,
      population: 1534795, area: 44.0, talukCount: 0, villageCount: 0,
      literacy: 85.11, sexRatio: 897, density: 34882,
      taluks: [
        { slug: "sarita-vihar", name: "Sarita Vihar", nameLocal: "सरिता विहार", tagline: "Residential Hub", pop: 512000, area: 15.0, villages: 0 },
        { slug: "kalkaji", name: "Kalkaji", nameLocal: "कालकाजी", tagline: "Temple & Market Area", pop: 512000, area: 15.0, villages: 0 },
        { slug: "okhla", name: "Okhla", nameLocal: "ओखला", tagline: "Industrial Estate", pop: 510795, area: 14.0, villages: 0 },
      ],
    },
    {
      slug: "west-delhi", name: "West Delhi", nameLocal: "पश्चिम दिल्ली",
      tagline: "Industrial & Residential Hub", active: false,
      population: 2543243, area: 129.0, talukCount: 0, villageCount: 0,
      literacy: 83.18, sexRatio: 876, density: 19714,
      taluks: [
        { slug: "rajouri-garden", name: "Rajouri Garden", nameLocal: "राजौरी गार्डन", tagline: "Commercial & Retail Hub", pop: 850000, area: 43.0, villages: 0 },
        { slug: "punjabi-bagh", name: "Punjabi Bagh", nameLocal: "पंजाबी बाग", tagline: "Affluent West Delhi", pop: 850000, area: 43.0, villages: 0 },
        { slug: "patel-nagar", name: "Patel Nagar", nameLocal: "पटेल नगर", tagline: "Central West Delhi", pop: 843243, area: 43.0, villages: 0 },
      ],
    },
    {
      slug: "shahdara", name: "Shahdara", nameLocal: "शाहदरा",
      tagline: "East Bank of the Yamuna", active: false,
      population: 1693005, area: 55.0, talukCount: 0, villageCount: 0,
      literacy: 85.31, sexRatio: 882, density: 30782,
      taluks: [
        { slug: "shahdara-subdivision", name: "Shahdara", nameLocal: "शाहदरा", tagline: "Historic Trans-Yamuna", pop: 850000, area: 28.0, villages: 0 },
        { slug: "seemapuri-east", name: "Seemapuri East", nameLocal: "सीमापुरी पूर्व", tagline: "Eastern Periphery", pop: 843005, area: 27.0, villages: 0 },
      ],
    },
  ];

  for (const def of delhiDistrictDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: delhi.id, slug: def.slug } },
      update: { active: def.active },
      create: {
        stateId: delhi.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline,
        active: def.active,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} subdivisions`);
  }

  // ── Maharashtra State ─────────────────────────────────────
  console.log("\n🌱 Upserting Maharashtra hierarchy...");

  const maharashtra = await prisma.state.upsert({
    where: { slug: "maharashtra" },
    update: { active: true },
    create: { name: "Maharashtra", nameLocal: "महाराष्ट्र", slug: "maharashtra", active: true, capital: "Mumbai" },
  });
  console.log("✓ Maharashtra state");

  // Maharashtra hierarchy — 34 districts after decision A (Mumbai stays
  // combined; Mumbai City / Mumbai Suburban split deferred to Phase 2).
  // Aurangabad slug is DELETED via scripts/migrate-aurangabad-to-chhatrapati-sambhajinagar.ts
  // after this seed runs (new slug chhatrapati-sambhajinagar added below).
  // Source URLs per district are inline comments (no schema column for URLs
  // — data-carrying rows like Leader/Budget/DemographicProfile store their
  // own sourceUrl in the relevant tables).
  const maharashtraDistrictDefs = [
    {
      slug: "mumbai", name: "Mumbai", nameLocal: "मुंबई",
      tagline: "Financial Capital of India", active: true,
      population: 12442373, area: 603, talukCount: 0, villageCount: 0,
      literacy: 89.73, sexRatio: 832, density: 20634,
      taluks: [
        { slug: "andheri", name: "Andheri", nameLocal: "अंधेरी", tagline: "Western Suburbs Hub", pop: 2000000, area: 75, villages: 0 },
        { slug: "bandra", name: "Bandra", nameLocal: "बांद्रा", tagline: "Queen of the Suburbs", pop: 1500000, area: 60, villages: 0 },
        { slug: "borivali", name: "Borivali", nameLocal: "बोरिवली", tagline: "Gateway to Sanjay Gandhi National Park", pop: 1200000, area: 80, villages: 0 },
        { slug: "kurla", name: "Kurla", nameLocal: "कुर्ला", tagline: "Central Suburbs Junction", pop: 1100000, area: 50, villages: 0 },
        { slug: "dadar", name: "Dadar", nameLocal: "दादर", tagline: "Heart of Mumbai", pop: 800000, area: 40, villages: 0 },
        { slug: "colaba", name: "Colaba", nameLocal: "कुलाबा", tagline: "South Mumbai Heritage", pop: 600000, area: 30, villages: 0 },
        { slug: "fort-town", name: "Fort/Town", nameLocal: "फोर्ट/टाउन", tagline: "Historic Business District", pop: 400000, area: 25, villages: 0 },
        { slug: "malad", name: "Malad", nameLocal: "मालाड", tagline: "Western Suburbs Growth Centre", pop: 1500000, area: 70, villages: 0 },
      ],
    },
    // Pune (active, 14 tehsils — source: https://pune.gov.in/en/tehsil/)
    {
      slug: "pune", name: "Pune", nameLocal: "पुणे",
      tagline: "Oxford of the East", active: true,
      population: 9426959, area: 15643, talukCount: 14, villageCount: 1866,
      literacy: 87.19, sexRatio: 915, density: 603,
      taluks: [
        { slug: "pune-city", name: "Pune City", nameLocal: "पुणे शहर", tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "haveli",    name: "Haveli",    nameLocal: "हवेली",    tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "khed",      name: "Khed",      nameLocal: "खेड",     tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "junnar",    name: "Junnar",    nameLocal: "जुन्नर",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "ambegaon",  name: "Ambegaon",  nameLocal: "आंबेगाव",  tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "maval",     name: "Maval",     nameLocal: "मावळ",    tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "mulshi",    name: "Mulshi",    nameLocal: "मुळशी",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "shirur",    name: "Shirur",    nameLocal: "शिरूर",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "purandar",  name: "Purandar",  nameLocal: "पुरंदर",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "velhe",     name: "Velhe",     nameLocal: "वेल्हे",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "bhor",      name: "Bhor",      nameLocal: "भोर",     tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "baramati",  name: "Baramati",  nameLocal: "बारामती",  tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "indapur",   name: "Indapur",   nameLocal: "इंदापूर",   tagline: undefined, pop: undefined, area: undefined, villages: undefined },
        { slug: "daund",     name: "Daund",     nameLocal: "दौंड",    tagline: undefined, pop: undefined, area: undefined, villages: undefined },
      ],
    },
    // Nagpur (unchanged) — source: https://nagpur.gov.in
    {
      slug: "nagpur", name: "Nagpur", nameLocal: "नागपूर",
      tagline: "Orange City", active: false,
      population: 4653570, area: 9892, talukCount: 14, villageCount: 1969,
      literacy: 88.54, sexRatio: 948, density: 470,
      taluks: [],
    },
    // Nashik (unchanged) — source: https://nashik.gov.in
    {
      slug: "nashik", name: "Nashik", nameLocal: "नाशिक",
      tagline: "Wine Capital of India", active: false,
      population: 6107187, area: 15530, talukCount: 15, villageCount: 1982,
      literacy: 82.31, sexRatio: 931, density: 393,
      taluks: [],
    },

    // ── 30 additional Maharashtra districts (new) ────────────
    // All inactive; Marathi names per canonical authoritative list from Jayanth.
    // source URLs inline (unverified — HEAD-check results reported separately).

    { slug: "ahilyanagar",              name: "Ahilyanagar",              nameLocal: "अहिल्यानगर",        active: false, taluks: [] }, // source: https://ahilyanagar.nic.in — renamed 2024 from Ahmednagar
    { slug: "akola",                    name: "Akola",                    nameLocal: "अकोला",             active: false, taluks: [] }, // source: https://akola.gov.in
    { slug: "amravati",                 name: "Amravati",                 nameLocal: "अमरावती",            active: false, taluks: [] }, // source: https://amravati.gov.in
    { slug: "chhatrapati-sambhajinagar", name: "Chhatrapati Sambhajinagar", nameLocal: "छत्रपती संभाजीनगर", active: false, taluks: [] }, // source: https://aurangabad.gov.in — renamed 2023 from Aurangabad (old slug deleted by migration script)
    { slug: "beed",                     name: "Beed",                     nameLocal: "बीड",              active: false, taluks: [] }, // source: https://beed.gov.in
    { slug: "bhandara",                 name: "Bhandara",                 nameLocal: "भंडारा",            active: false, taluks: [] }, // source: https://bhandara.gov.in
    { slug: "buldhana",                 name: "Buldhana",                 nameLocal: "बुलढाणा",           active: false, taluks: [] }, // source: https://buldhana.nic.in
    { slug: "chandrapur",               name: "Chandrapur",               nameLocal: "चंद्रपूर",           active: false, taluks: [] }, // source: https://chanda.nic.in
    { slug: "dharashiv",                name: "Dharashiv",                nameLocal: "धाराशिव",            active: false, taluks: [] }, // source: https://osmanabad.gov.in — renamed 2023 from Osmanabad
    { slug: "dhule",                    name: "Dhule",                    nameLocal: "धुळे",              active: false, taluks: [] }, // source: https://dhule.gov.in
    { slug: "gadchiroli",               name: "Gadchiroli",               nameLocal: "गडचिरोली",          active: false, taluks: [] }, // source: https://gadchiroli.gov.in
    { slug: "gondia",                   name: "Gondia",                   nameLocal: "गोंदिया",           active: false, taluks: [] }, // source: https://gondia.gov.in
    { slug: "hingoli",                  name: "Hingoli",                  nameLocal: "हिंगोली",           active: false, taluks: [] }, // source: https://hingoli.nic.in
    { slug: "jalgaon",                  name: "Jalgaon",                  nameLocal: "जळगाव",             active: false, taluks: [] }, // source: https://jalgaon.gov.in
    { slug: "jalna",                    name: "Jalna",                    nameLocal: "जालना",             active: false, taluks: [] }, // source: https://jalna.gov.in
    { slug: "kolhapur",                 name: "Kolhapur",                 nameLocal: "कोल्हापूर",          active: false, taluks: [] }, // source: https://kolhapur.gov.in
    { slug: "latur",                    name: "Latur",                    nameLocal: "लातूर",             active: false, taluks: [] }, // source: https://latur.gov.in
    { slug: "nanded",                   name: "Nanded",                   nameLocal: "नांदेड",             active: false, taluks: [] }, // source: https://nanded.gov.in
    { slug: "nandurbar",                name: "Nandurbar",                nameLocal: "नंदुरबार",          active: false, taluks: [] }, // source: https://nandurbar.gov.in
    { slug: "palghar",                  name: "Palghar",                  nameLocal: "पालघर",             active: false, taluks: [] }, // source: https://palghar.gov.in
    { slug: "parbhani",                 name: "Parbhani",                 nameLocal: "परभणी",             active: false, taluks: [] }, // source: https://parbhani.gov.in
    { slug: "raigad",                   name: "Raigad",                   nameLocal: "रायगड",             active: false, taluks: [] }, // source: https://raigad.gov.in
    { slug: "ratnagiri",                name: "Ratnagiri",                nameLocal: "रत्नागिरी",          active: false, taluks: [] }, // source: https://ratnagiri.gov.in
    { slug: "sangli",                   name: "Sangli",                   nameLocal: "सांगली",             active: false, taluks: [] }, // source: https://sangli.nic.in
    { slug: "satara",                   name: "Satara",                   nameLocal: "सातारा",             active: false, taluks: [] }, // source: https://satara.gov.in
    { slug: "sindhudurg",               name: "Sindhudurg",               nameLocal: "सिंधुदुर्ग",         active: false, taluks: [] }, // source: https://sindhudurg.nic.in
    { slug: "solapur",                  name: "Solapur",                  nameLocal: "सोलापूर",            active: false, taluks: [] }, // source: https://solapur.gov.in
    { slug: "thane",                    name: "Thane",                    nameLocal: "ठाणे",              active: false, taluks: [] }, // source: https://thane.gov.in
    { slug: "wardha",                   name: "Wardha",                   nameLocal: "वर्धा",             active: false, taluks: [] }, // source: https://wardha.gov.in
    { slug: "washim",                   name: "Washim",                   nameLocal: "वाशीम",             active: false, taluks: [] }, // source: https://washim.nic.in
    { slug: "yavatmal",                 name: "Yavatmal",                 nameLocal: "यवतमाळ",            active: false, taluks: [] }, // source: https://yavatmal.nic.in
  ];

  for (const def of maharashtraDistrictDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: maharashtra.id, slug: def.slug } },
      update: { active: def.active },
      create: {
        stateId: maharashtra.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline,
        active: def.active,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} subdivisions`);
  }

  // ── West Bengal State ────────────────────────────────────
  console.log("\n🌱 Upserting West Bengal hierarchy...");

  const westBengal = await prisma.state.upsert({
    where: { slug: "west-bengal" },
    update: { active: true },
    create: { name: "West Bengal", nameLocal: "পশ্চিমবঙ্গ", slug: "west-bengal", active: true, capital: "Kolkata" },
  });
  console.log("✓ West Bengal state");

  const westBengalDistrictDefs = [
    {
      slug: "kolkata", name: "Kolkata", nameLocal: "কলকাতা",
      tagline: "City of Joy", active: true,
      population: 4486679, area: 185, talukCount: 0, villageCount: 0,
      literacy: 87.14, sexRatio: 899, density: 24252,
      taluks: [
        { slug: "kolkata-north", name: "Kolkata North", nameLocal: "উত্তর কলকাতা", tagline: "Heritage North Kolkata", pop: 1100000, area: 40, villages: 0 },
        { slug: "kolkata-south", name: "Kolkata South", nameLocal: "দক্ষিণ কলকাতা", tagline: "Modern South Kolkata", pop: 1200000, area: 50, villages: 0 },
        { slug: "kolkata-central", name: "Kolkata Central", nameLocal: "মধ্য কলকাতা", tagline: "Commercial Heart", pop: 900000, area: 35, villages: 0 },
        { slug: "kolkata-east", name: "Kolkata East", nameLocal: "পূর্ব কলকাতা", tagline: "Salt Lake & Rajarhat", pop: 800000, area: 35, villages: 0 },
        { slug: "kolkata-west-port", name: "Kolkata West (Port)", nameLocal: "পশ্চিম কলকাতা (বন্দর)", tagline: "Port & Industrial Zone", pop: 486679, area: 25, villages: 0 },
      ],
    },
    {
      slug: "howrah", name: "Howrah", nameLocal: "হাওড়া",
      tagline: "Twin City of Kolkata", active: false,
      population: 4841638, area: 1467, talukCount: 2, villageCount: 782,
      literacy: 83.85, sexRatio: 935, density: 3300,
      taluks: [],
    },
    {
      slug: "darjeeling", name: "Darjeeling", nameLocal: "দার্জিলিং",
      tagline: "Queen of the Hills", active: false,
      population: 1846823, area: 3149, talukCount: 4, villageCount: 697,
      literacy: 79.92, sexRatio: 971, density: 586,
      taluks: [],
    },
    {
      slug: "murshidabad", name: "Murshidabad", nameLocal: "মুর্শিদাবাদ",
      tagline: "Land of the Nawabs", active: false,
      population: 7103807, area: 5324, talukCount: 5, villageCount: 2210,
      literacy: 67.53, sexRatio: 957, density: 1334,
      taluks: [],
    },
    {
      slug: "bardhaman", name: "Bardhaman", nameLocal: "বর্ধমান",
      tagline: "Rice Bowl of Bengal", active: false,
      population: 7717563, area: 7024, talukCount: 6, villageCount: 2600,
      literacy: 77.15, sexRatio: 943, density: 1099,
      taluks: [],
    },
  ];

  for (const def of westBengalDistrictDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: westBengal.id, slug: def.slug } },
      update: { active: def.active },
      create: {
        stateId: westBengal.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline,
        active: def.active,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} subdivisions`);
  }

  // ── Tamil Nadu State ─────────────────────────────────────
  console.log("\n🌱 Upserting Tamil Nadu hierarchy...");

  const tamilNadu = await prisma.state.upsert({
    where: { slug: "tamil-nadu" },
    update: { active: true },
    create: { name: "Tamil Nadu", nameLocal: "தமிழ்நாடு", slug: "tamil-nadu", active: true, capital: "Chennai" },
  });
  console.log("✓ Tamil Nadu state");

  const tamilNaduDistrictDefs = [
    {
      slug: "chennai", name: "Chennai", nameLocal: "சென்னை",
      tagline: "Gateway to South India", active: true,
      population: 4646732, area: 426, talukCount: 3, villageCount: 0,
      literacy: 90.33, sexRatio: 951, density: 10908,
      taluks: [
        { slug: "egmore-nungambakkam", name: "Egmore-Nungambakkam", nameLocal: "எழும்பூர்-நுங்கம்பாக்கம்", tagline: "Central Chennai Hub", pop: 1800000, area: 140, villages: 0 },
        { slug: "mambalam-guindy", name: "Mambalam-Guindy", nameLocal: "மாம்பலம்-கிண்டி", tagline: "South Chennai Commercial Belt", pop: 1700000, area: 150, villages: 0 },
        { slug: "madhavaram", name: "Madhavaram", nameLocal: "மாதவரம்", tagline: "North Chennai Growth Corridor", pop: 1146732, area: 136, villages: 0 },
      ],
    },
    {
      slug: "coimbatore", name: "Coimbatore", nameLocal: "கோயம்புத்தூர்",
      tagline: "Manchester of South India", active: false,
      population: 3458045, area: 4723, talukCount: 6, villageCount: 1201,
      literacy: 84.42, sexRatio: 998, density: 732,
      taluks: [],
    },
    {
      slug: "madurai", name: "Madurai", nameLocal: "மதுரை",
      tagline: "Temple City", active: false,
      population: 3038252, area: 3741, talukCount: 7, villageCount: 663,
      literacy: 82.13, sexRatio: 990, density: 812,
      taluks: [],
    },
    {
      slug: "tiruchirappalli", name: "Tiruchirappalli", nameLocal: "திருச்சிராப்பள்ளி",
      tagline: "Rock Fort City", active: false,
      population: 2722290, area: 4404, talukCount: 8, villageCount: 917,
      literacy: 82.19, sexRatio: 1010, density: 618,
      taluks: [],
    },
    {
      slug: "salem", name: "Salem", nameLocal: "சேலம்",
      tagline: "Steel City of Tamil Nadu", active: false,
      population: 3482056, area: 5245, talukCount: 9, villageCount: 1006,
      literacy: 72.22, sexRatio: 954, density: 664,
      taluks: [],
    },
  ];

  for (const def of tamilNaduDistrictDefs) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: tamilNadu.id, slug: def.slug } },
      update: { active: def.active },
      create: {
        stateId: tamilNadu.id,
        name: def.name, nameLocal: def.nameLocal,
        slug: def.slug,
        tagline: def.tagline,
        active: def.active,
        population: def.population, area: def.area,
        talukCount: def.talukCount, villageCount: def.villageCount,
        literacy: def.literacy, sexRatio: def.sexRatio,
        density: def.density,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          name: t.name, nameLocal: t.nameLocal, slug: t.slug,
          tagline: t.tagline,
          population: t.pop, area: t.area, villageCount: t.villages,
        },
      });
    }
    console.log(`✓ ${def.name} + ${def.taluks.length} taluks`);
  }

  // ── Telangana State ─────────────────────────────────────
  console.log("\n🌱 Upserting Telangana hierarchy...");

  const telangana = await prisma.state.upsert({
    where: { slug: "telangana" },
    update: { active: true },
    create: { name: "Telangana", nameLocal: "తెలంగాణ", slug: "telangana", active: true, capital: "Hyderabad" },
  });
  console.log("✓ Telangana state");

  const telanganaDistricts = [
    {
      slug: "hyderabad",
      name: "Hyderabad", nameLocal: "హైదరాబాద్",
      tagline: "City of Pearls", taglineLocal: "ముత్యాల నగరం",
      population: 4500000, area: 217, talukCount: 16, villageCount: 0,
      literacy: 83.25, sexRatio: 954, density: 18172,
      active: true,
      taluks: [
        { slug: "charminar",     name: "Charminar",     nameLocal: "చార్మినార్",     tagline: "Icon of Hyderabad",         pop: 260000, area: 8,  villages: 0 },
        { slug: "secunderabad",  name: "Secunderabad",  nameLocal: "సికింద్రాబాద్",   tagline: "Twin City",                pop: 305000, area: 15, villages: 0 },
        { slug: "nampally",      name: "Nampally",      nameLocal: "నాంపల్లి",       tagline: "Administrative Center",     pop: 245000, area: 11, villages: 0 },
        { slug: "khairatabad",   name: "Khairatabad",   nameLocal: "ఖైరతాబాద్",      tagline: "Legislative District",      pop: 210000, area: 9,  villages: 0 },
        { slug: "amberpet",      name: "Amberpet",      nameLocal: "అంబర్‌పేట్",      tagline: "Heart of Central Hyderabad", pop: 320000, area: 12, villages: 0 },
        { slug: "asifnagar",     name: "Asifnagar",     nameLocal: "ఆసిఫ్‌నగర్",      tagline: "Old City Gateway",          pop: 280000, area: 15, villages: 0 },
        { slug: "bahadurpura",   name: "Bahadurpura",   nameLocal: "బహదూర్‌పురా",     tagline: "Historic Old City",         pop: 468000, area: 22, villages: 0 },
        { slug: "bandlaguda",    name: "Bandlaguda",    nameLocal: "బండ్లగూడ",        tagline: "Southern Growth Corridor",  pop: 350000, area: 30, villages: 0 },
        { slug: "golkonda",      name: "Golkonda",      nameLocal: "గోల్కొండ",        tagline: "Fort of Diamonds",          pop: 310000, area: 20, villages: 0 },
        { slug: "himayatnagar",  name: "Himayatnagar",  nameLocal: "హిమాయత్‌నగర్",    tagline: "Commercial Hub",            pop: 220000, area: 10, villages: 0 },
        { slug: "musheerabad",   name: "Musheerabad",   nameLocal: "ముషీరాబాద్",      tagline: "Cultural Crossroads",       pop: 295000, area: 14, villages: 0 },
        { slug: "saidabad",      name: "Saidabad",      nameLocal: "సాయిదాబాద్",      tagline: "Musi River Banks",          pop: 275000, area: 16, villages: 0 },
        { slug: "ameerpet",      name: "Ameerpet",      nameLocal: "అమీర్‌పేట్",      tagline: "Coaching Hub of India",     pop: 59000,  area: 4,  villages: 0 },
        { slug: "tirumalagiri",  name: "Tirumalagiri",  nameLocal: "తిరుమలగిరి",      tagline: "Cantonment Heritage",       pop: 180000, area: 12, villages: 0 },
        { slug: "maredpally",    name: "Maredpally",    nameLocal: "మారేడ్‌పల్లి",     tagline: "Secunderabad Core",         pop: 195000, area: 10, villages: 0 },
        { slug: "shaikpet",      name: "Shaikpet",      nameLocal: "షైక్‌పేట్",        tagline: "HITEC City Gateway",        pop: 230000, area: 18, villages: 0 },
      ],
    },
    {
      slug: "warangal", name: "Warangal", nameLocal: "వరంగల్",
      tagline: "City of Orugallu", population: 3522644, area: 2175,
      literacy: 65.11, sexRatio: 998, density: 1620, active: false,
      talukCount: 0, villageCount: 0, taluks: [],
    },
    {
      slug: "nizamabad", name: "Nizamabad", nameLocal: "నిజామాబాద్",
      tagline: "Turmeric City", population: 2551335, area: 4288,
      literacy: 60.13, sexRatio: 1040, density: 595, active: false,
      talukCount: 0, villageCount: 0, taluks: [],
    },
    {
      slug: "karimnagar", name: "Karimnagar", nameLocal: "కరీంనగర్",
      tagline: "Silver Filigree City", population: 3776269, area: 11823,
      literacy: 56.45, sexRatio: 1008, density: 319, active: false,
      talukCount: 0, villageCount: 0, taluks: [],
    },
    {
      slug: "khammam", name: "Khammam", nameLocal: "ఖమ్మం",
      tagline: "Gateway to Dandakaranya", population: 2798164, area: 4453,
      literacy: 63.56, sexRatio: 1017, density: 628, active: false,
      talukCount: 0, villageCount: 0, taluks: [],
    },
  ];

  for (const def of telanganaDistricts) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: telangana.id, slug: def.slug } },
      update: { active: def.active ?? false },
      create: {
        stateId: telangana.id,
        slug: def.slug,
        name: def.name,
        nameLocal: def.nameLocal,
        tagline: def.tagline,
        population: def.population,
        area: def.area,
        talukCount: def.talukCount ?? 0,
        villageCount: def.villageCount ?? 0,
        literacy: def.literacy,
        sexRatio: def.sexRatio,
        density: def.density,
        active: def.active ?? false,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          slug: t.slug,
          name: t.name,
          nameLocal: t.nameLocal,
          tagline: t.tagline,
          population: t.pop,
          area: t.area,
          villageCount: t.villages,
        },
      });
    }
    if (def.taluks.length > 0) {
      console.log(`✓ ${def.name} + ${def.taluks.length} mandals`);
    } else {
      console.log(`✓ ${def.name} (inactive — no mandals seeded)`);
    }
  }

  // ── Assam State ──────────────────────────────────────────
  const assam = await prisma.state.upsert({
    where: { slug: "assam" },
    update: { active: true },
    create: { name: "Assam", nameLocal: "অসম", slug: "assam", active: true, capital: "Dispur" },
  });
  console.log("✓ Assam state");

  const assamDistricts = [
    {
      slug: "dima-hasao",
      name: "Dima Hasao", nameLocal: "ডিমা হাছাও",
      tagline: "The Land of Blue Hills", taglineLocal: "The Land of Blue Hills",
      population: 214102, area: 4888, talukCount: 4, villageCount: 695,
      literacy: 77.54, sexRatio: 933, density: 44, avgRainfall: 2200,
      active: true,
      taluks: [
        { slug: "haflong", name: "Haflong", nameLocal: "হাফলং", tagline: "Switzerland of the East", pop: 85000, area: 1200, villages: 150 },
        { slug: "mahur", name: "Mahur", nameLocal: "মাহুৰ", tagline: "Gateway to the Hills", pop: 45000, area: 1100, villages: 180 },
        { slug: "maibong", name: "Maibong", nameLocal: "মাইবং", tagline: "Historic Capital of Dimasa Kingdom", pop: 50000, area: 1300, villages: 200 },
        { slug: "umrangso", name: "Umrangso", nameLocal: "উমৰাংছু", tagline: "Industrial and Hydel Hub", pop: 34102, area: 1288, villages: 165 },
      ]
    }
  ];

  for (const def of assamDistricts) {
    const district = await prisma.district.upsert({
      where: { stateId_slug: { stateId: assam.id, slug: def.slug } },
      update: { active: def.active ?? false },
      create: {
        stateId: assam.id,
        slug: def.slug,
        name: def.name,
        nameLocal: def.nameLocal,
        tagline: def.tagline,
        population: def.population,
        area: def.area,
        talukCount: def.talukCount ?? 0,
        villageCount: def.villageCount ?? 0,
        literacy: def.literacy,
        sexRatio: def.sexRatio,
        density: def.density,
        active: def.active ?? false,
      },
    });

    for (const t of def.taluks) {
      await prisma.taluk.upsert({
        where: { districtId_slug: { districtId: district.id, slug: t.slug } },
        update: {},
        create: {
          districtId: district.id,
          slug: t.slug,
          name: t.name,
          nameLocal: t.nameLocal,
          tagline: t.tagline,
          population: t.pop,
          area: t.area,
          villageCount: t.villages,
        },
      });
    }
    if (def.taluks.length > 0) {
      console.log(`✓ ${def.name} + ${def.taluks.length} revenue circles`);
    } else {
      console.log(`✓ ${def.name} (inactive — no revenue circles seeded)`);
    }
  }

  console.log("\n✅ Hierarchy upsert complete — no data deleted.");
}


main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
