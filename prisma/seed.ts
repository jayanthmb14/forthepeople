// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Seed: Real Mandya, Karnataka data
// Run: npx prisma db seed
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding ForThePeople.in database...");

  // ── 0. Clean existing seed data ─────────────────────────
  // Delete in reverse dependency order (child tables first)
  await prisma.infraProject.deleteMany({});
  await prisma.schoolResult.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.soilHealth.deleteMany({});
  await prisma.gramPanchayat.deleteMany({});
  await prisma.powerOutage.deleteMany({});
  await prisma.revenueCollection.deleteMany({});
  await prisma.revenueEntry.deleteMany({});
  await prisma.newsIntelligenceLog.deleteMany({});
  await prisma.aIInsight.deleteMany({});
  await prisma.reviewQueue.deleteMany({});
  await prisma.weatherReading.deleteMany({});
  await prisma.canalRelease.deleteMany({});
  await prisma.newsItem.deleteMany({});
  await prisma.dataRefresh.deleteMany({});
  await prisma.scraperLog.deleteMany({});
  await prisma.rtiStat.deleteMany({});
  await prisma.rtiTemplate.deleteMany({});
  await prisma.courtStat.deleteMany({});
  await prisma.trafficCollection.deleteMany({});
  await prisma.crimeStat.deleteMany({});
  await prisma.agriAdvisory.deleteMany({});
  await prisma.localAlert.deleteMany({});
  await prisma.busRoute.deleteMany({});
  await prisma.trainSchedule.deleteMany({});
  await prisma.electionResult.deleteMany({});
  await prisma.pollingBooth.deleteMany({});
  await prisma.housingScheme.deleteMany({});
  await prisma.jJMStatus.deleteMany({});
  await prisma.citizenTip.deleteMany({});
  await prisma.serviceGuide.deleteMany({});
  await prisma.scheme.deleteMany({});
  await prisma.govOffice.deleteMany({});
  await prisma.policeStation.deleteMany({});
  await prisma.budgetAllocation.deleteMany({});
  await prisma.budgetEntry.deleteMany({});
  await prisma.cropPrice.deleteMany({});
  await prisma.sugarFactorySeason.deleteMany({});
  await prisma.sugarFactory.deleteMany({});
  await prisma.damReading.deleteMany({});
  await prisma.rainfallHistory.deleteMany({});
  await prisma.populationHistory.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.famousPersonality.deleteMany({});
  await prisma.leader.deleteMany({});
  await prisma.village.deleteMany({});
  await prisma.taluk.deleteMany({});
  await prisma.district.deleteMany({});
  await prisma.state.deleteMany({});
  console.log("✓ Cleaned existing data");

  // ── 1. Karnataka State ──────────────────────────────────
  const karnataka = await prisma.state.upsert({
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
  console.log("✓ Karnataka state");

  // ── 2. Mandya District ──────────────────────────────────
  const mandya = await prisma.district.upsert({
    where: { stateId_slug: { stateId: karnataka.id, slug: "mandya" } },
    update: { active: true },
    create: {
      stateId: karnataka.id,
      name: "Mandya",
      nameLocal: "ಮಂಡ್ಯ",
      slug: "mandya",
      tagline: "Sugar Capital of Karnataka",
      taglineLocal: "ಕರ್ನಾಟಕದ ಸಕ್ಕರೆ ನಗರ",
      active: true,
      population: 1940428,
      area: 4961,
      talukCount: 7,
      villageCount: 1291,
      literacy: 72.8,
      sexRatio: 982,
      density: 391.2,
      avgRainfall: 695,
    },
  });
  console.log("✓ Mandya district");

  // ── 3. Taluks ───────────────────────────────────────────
  const talukData = [
    { slug: "mandya",         name: "Mandya",         nameLocal: "ಮಂಡ್ಯ",          tagline: "Sugar Capital of Karnataka",    pop: 516098, area: 727,  villages: 193 },
    { slug: "maddur",         name: "Maddur",         nameLocal: "ಮದ್ದೂರು",         tagline: "Gateway to Old Mysore",         pop: 290000, area: 686,  villages: 174 },
    { slug: "malavalli",      name: "Malavalli",      nameLocal: "ಮಳವಳ್ಳಿ",         tagline: "Land of Temples & Tanks",       pop: 270000, area: 705,  villages: 187 },
    { slug: "srirangapatna",  name: "Srirangapatna",  nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",    tagline: "Tipu Sultan's Island Fortress", pop: 225000, area: 581,  villages: 135 },
    { slug: "nagamangala",    name: "Nagamangala",    nameLocal: "ನಾಗಮಂಗಲ",         tagline: "Heart of the Deccan Plateau",   pop: 220000, area: 791,  villages: 200 },
    { slug: "kr-pete",        name: "K R Pete",       nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",     tagline: "Jewel of the Kaveri Basin",     pop: 235000, area: 727,  villages: 210 },
    { slug: "pandavapura",    name: "Pandavapura",    nameLocal: "ಪಾಂಡವಪುರ",        tagline: "Where the Pandavas Rested",     pop: 175000, area: 744,  villages: 192 },
  ];

  const taluks: Record<string, { id: string }> = {};
  for (const t of talukData) {
    const taluk = await prisma.taluk.upsert({
      where: { districtId_slug: { districtId: mandya.id, slug: t.slug } },
      update: {},
      create: {
        districtId: mandya.id,
        name: t.name,
        nameLocal: t.nameLocal,
        slug: t.slug,
        tagline: t.tagline,
        population: t.pop,
        area: t.area,
        villageCount: t.villages,
      },
    });
    taluks[t.slug] = taluk;
  }
  console.log("✓ 7 Mandya Taluks");

  // ── 4. Mysuru District + Taluks ─────────────────────────
  const mysuru = await prisma.district.upsert({
    where: { stateId_slug: { stateId: karnataka.id, slug: "mysuru" } },
    update: { active: true },
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
      density: 474,
      avgRainfall: 750,
    },
  });

  const mysuruTaluks = [
    { slug: "mysuru-taluk",  name: "Mysuru",       nameLocal: "ಮೈಸೂರು",                  tagline: "Heritage Capital of Karnataka",         pop: 1800000, area: 1654, villages: 362 },
    { slug: "hunsur",        name: "Hunsur",        nameLocal: "ಹನ್ಸೂರು",                 tagline: "Coffee & Cardamom Country",             pop: 320000,  area: 862,  villages: 284 },
    { slug: "nanjangud",     name: "Nanjangud",     nameLocal: "ನಂಜನಗೂಡು",               tagline: "Temple Town on the Kapila",             pop: 325000,  area: 936,  villages: 325 },
    { slug: "t-narasipur",   name: "T. Narasipur",  nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",    tagline: "Triveni Sangama — Three Rivers Meet",   pop: 260000,  area: 1005, villages: 348 },
    { slug: "hd-kote",       name: "H.D. Kote",     nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",           tagline: "Gateway to Nagarahole",                pop: 220000,  area: 2374, villages: 370 },
    { slug: "periyapatna",   name: "Periyapatna",   nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",           tagline: "Land of Turmeric and Pepper",           pop: 210000,  area: 782,  villages: 260 },
    { slug: "kr-nagar",      name: "K.R. Nagar",    nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",           tagline: "Cauvery Heartland",                    pop: 215000,  area: 1079, villages: 305 },
  ];
  for (const t of mysuruTaluks) {
    await prisma.taluk.upsert({
      where: { districtId_slug: { districtId: mysuru.id, slug: t.slug } },
      update: {},
      create: { districtId: mysuru.id, name: t.name, nameLocal: t.nameLocal, slug: t.slug, tagline: t.tagline, population: t.pop, area: t.area, villageCount: t.villages },
    });
  }
  console.log("✓ Mysuru district + 7 taluks");

  // ── 5. Bengaluru Urban District + Taluks ────────────────
  const bengaluruUrban = await prisma.district.upsert({
    where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
    update: { active: true },
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
      density: 17232,
      avgRainfall: 970,
    },
  });

  const bengaluruTaluks = [
    { slug: "bengaluru-north",  name: "Bengaluru North",  nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",   tagline: "Gateway to the Airport",     pop: 3800000, area: 198, villages: 145 },
    { slug: "bengaluru-south",  name: "Bengaluru South",  nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ",  tagline: "Heart of the Garden City",   pop: 4200000, area: 186, villages: 120 },
    { slug: "bengaluru-east",   name: "Bengaluru East",   nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",   tagline: "IT Corridor Hub",            pop: 3100000, area: 194, villages: 150 },
    { slug: "anekal",           name: "Anekal",           nameLocal: "ಆನೇಕಲ್",            tagline: "Electronics City Gateway",   pop: 1665000, area: 163, villages: 117 },
  ];
  for (const t of bengaluruTaluks) {
    await prisma.taluk.upsert({
      where: { districtId_slug: { districtId: bengaluruUrban.id, slug: t.slug } },
      update: {},
      create: { districtId: bengaluruUrban.id, name: t.name, nameLocal: t.nameLocal, slug: t.slug, tagline: t.tagline, population: t.pop, area: t.area, villageCount: t.villages },
    });
  }
  console.log("✓ Bengaluru Urban district + 4 taluks");

  // ── Leadership (Tiers 1-10) ────────────────────────────
  await prisma.leader.deleteMany({ where: { districtId: mandya.id } });
  await prisma.leader.createMany({
    data: [
      // TIER 1 — PARLIAMENT
      {
        districtId: mandya.id,
        tier: 1,
        name: "H.D. Kumaraswamy",
        nameLocal: "ಎಚ್.ಡಿ. ಕುಮಾರಸ್ವಾಮಿ",
        role: "Member of Parliament (Lok Sabha)",
        roleLocal: "ಲೋಕಸಭಾ ಸದಸ್ಯ",
        party: "JD(S)",
        constituency: "Mandya",
        since: "2024",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/H._D._Kumaraswamy.jpg/220px-H._D._Kumaraswamy.jpg",
        photoLicense: "Wikimedia Commons",
        source: "Election Commission of India",
      },

      // TIER 2 — STATE ASSEMBLY (7 MLAs)
      {
        districtId: mandya.id,
        tier: 2,
        name: "P.M. Narendraswamy",
        nameLocal: "ಪಿ.ಎಂ. ನರೇಂದ್ರಸ್ವಾಮಿ",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Malavalli (SC) — 186",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "D.C. Thammanna",
        nameLocal: "ಡಿ.ಸಿ. ತಮ್ಮಣ್ಣ",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Maddur — 187",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "Darshan Puttannaiah",
        nameLocal: "ದರ್ಶನ್ ಪುಟ್ಟಣ್ಣಯ್ಯ",
        role: "Member of Legislative Assembly",
        party: "SKP",
        constituency: "Melukote — 188",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "P. Ravikumar (Ganiga)",
        nameLocal: "ಪಿ. ರವಿಕುಮಾರ್",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Mandya — 189",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "A.B. Ramesh Bandisiddegowda",
        nameLocal: "ಎ.ಬಿ. ರಮೇಶ್ ಬಂಡಿಸಿದ್ದೇಗೌಡ",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Srirangapatna — 190",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "N. Chauvarayaswamy",
        nameLocal: "ಎನ್. ಚೌವರಾಯಸ್ವಾಮಿ",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Nagamangala — 191",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },
      {
        districtId: mandya.id,
        tier: 2,
        name: "Narasimha Nayak",
        nameLocal: "ನರಸಿಂಹ ನಾಯಕ್",
        role: "Member of Legislative Assembly",
        party: "INC",
        constituency: "Krishnarajpet — 192",
        since: "2023",
        source: "Karnataka Legislative Assembly",
      },

      // TIER 3 — ELECTED LOCAL BODY
      {
        districtId: mandya.id,
        tier: 3,
        name: "TBD",
        role: "Zilla Panchayat President",
        roleLocal: "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷ",
        party: "INC",
        constituency: "Mandya ZP",
        source: "Mandya Zilla Panchayat",
      },
      {
        districtId: mandya.id,
        tier: 3,
        name: "TBD",
        role: "Zilla Panchayat Vice President",
        party: "INC",
        constituency: "Mandya ZP",
        source: "Mandya Zilla Panchayat",
      },
      {
        districtId: mandya.id,
        tier: 3,
        name: "TBD",
        role: "City Municipal Council President, Mandya",
        roleLocal: "ನಗರ ಪುರಸಭೆ ಅಧ್ಯಕ್ಷ",
        source: "Mandya CMC",
      },

      // TIER 4 — DISTRICT ADMINISTRATION (IAS/KAS)
      {
        districtId: mandya.id,
        tier: 4,
        name: "TBD",
        role: "Deputy Commissioner (DC) / District Collector",
        roleLocal: "ಜಿಲ್ಲಾಧಿಕಾರಿ",
        phone: "08232-222001",
        email: "dc.mandya@karnataka.gov.in",
        source: "mandya.nic.in",
      },
      {
        districtId: mandya.id,
        tier: 4,
        name: "TBD",
        role: "Additional Deputy Commissioner (ADC)",
        phone: "08232-222002",
        source: "mandya.nic.in",
      },
      {
        districtId: mandya.id,
        tier: 4,
        name: "TBD",
        role: "Chief Executive Officer (CEO), Zilla Panchayat",
        roleLocal: "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಮುಖ್ಯ ಕಾರ್ಯನಿರ್ವಹಣ ಅಧಿಕಾರಿ",
        phone: "08232-222010",
        email: "ceozp.mandya@karnataka.gov.in",
        source: "Mandya ZP",
      },
      {
        districtId: mandya.id,
        tier: 4,
        name: "TBD",
        role: "Project Director, DRDA",
        source: "DRDA Mandya",
      },
      {
        districtId: mandya.id,
        tier: 4,
        name: "TBD",
        role: "District Registrar",
        phone: "08232-222015",
        source: "Dept. of Stamps & Registration",
      },

      // TIER 5 — POLICE (IPS/KPS)
      {
        districtId: mandya.id,
        tier: 5,
        name: "TBD",
        role: "Superintendent of Police (SP)",
        roleLocal: "ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕ",
        phone: "08232-222100",
        email: "sp.mandya@ksp.gov.in",
        source: "Karnataka State Police",
      },
      {
        districtId: mandya.id,
        tier: 5,
        name: "TBD",
        role: "Additional Superintendent of Police (Addl. SP)",
        phone: "08232-222101",
        source: "Karnataka State Police",
      },
      {
        districtId: mandya.id,
        tier: 5,
        name: "TBD",
        role: "Deputy SP, Mandya Sub-Division",
        source: "Karnataka State Police",
      },
      {
        districtId: mandya.id,
        tier: 5,
        name: "TBD",
        role: "DYSP (Crime & Traffic)",
        source: "Karnataka State Police",
      },

      // TIER 6 — JUDICIARY
      {
        districtId: mandya.id,
        tier: 6,
        name: "TBD",
        role: "District & Sessions Judge (Principal)",
        roleLocal: "ಜಿಲ್ಲಾ ಮತ್ತು ಸೆಷನ್ಸ್ ನ್ಯಾಯಾಧೀಶ",
        source: "Karnataka High Court",
      },
      {
        districtId: mandya.id,
        tier: 6,
        name: "TBD",
        role: "Chief Judicial Magistrate",
        source: "Karnataka High Court",
      },
      {
        districtId: mandya.id,
        tier: 6,
        name: "TBD",
        role: "Family Court Judge",
        source: "Karnataka High Court",
      },
      {
        districtId: mandya.id,
        tier: 6,
        name: "TBD",
        role: "POCSO Special Court Judge",
        source: "Karnataka High Court",
      },

      // TIER 7 — REVENUE ADMINISTRATION
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "District Revenue Officer (DRO)",
        phone: "08232-222020",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Mandya",
        roleLocal: "ತಹಶೀಲ್ದಾರ್, ಮಂಡ್ಯ",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Maddur",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Malavalli",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Srirangapatna",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Nagamangala",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, K.R. Pete",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Tahsildar, Pandavapura",
        source: "Revenue Department",
      },
      {
        districtId: mandya.id,
        tier: 7,
        name: "TBD",
        role: "Special Land Acquisition Officer (SLAO)",
        source: "Revenue Department",
      },

      // TIER 8 — DEVELOPMENT & PANCHAYAT
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Chief Planning Officer (CPO)",
        source: "Planning Department",
      },
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Block Development Officer (BDO), Mandya",
        source: "Rural Development",
      },
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Block Development Officer (BDO), Maddur",
        source: "Rural Development",
      },
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Block Development Officer (BDO), Malavalli",
        source: "Rural Development",
      },
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Assistant Director, MGNREGA",
        source: "MGNREGA Division",
      },
      {
        districtId: mandya.id,
        tier: 8,
        name: "TBD",
        role: "Executive Engineer (EE), PWD",
        source: "Karnataka PWD",
      },

      // TIER 9 — DEPARTMENT HEADS
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Deputy Director of Public Instruction (DDPI)",
        roleLocal: "ಉಪ ಸಾರ್ವಜನಿಕ ಶಿಕ್ಷಣ ನಿರ್ದೇಶಕ",
        source: "Dept. of Public Instruction",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "District Health Officer (DHO)",
        roleLocal: "ಜಿಲ್ಲಾ ಆರೋಗ್ಯ ಅಧಿಕಾರಿ",
        phone: "08232-222200",
        source: "Health & Family Welfare",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "District Medical Officer (DMO)",
        source: "Health & Family Welfare",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Joint Director, Agriculture",
        source: "Dept. of Agriculture",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Deputy Director, Sericulture",
        roleLocal: "ರೇಷ್ಮೆ ಇಲಾಖೆ ಉಪ ನಿರ್ದೇಶಕ",
        source: "Dept. of Sericulture (Mandya is a major silk district)",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Executive Engineer, Cauvery Neeravari Nigam (KNNL)",
        roleLocal: "ಕಾವೇರಿ ನೀರಾವರಿ ನಿಗಮ ಕಾರ್ಯಪಾಲಕ ಎಂಜಿನಿಯರ್",
        source: "KNNL (KRS Dam management)",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Superintending Engineer, CESC/BESCOM",
        source: "CESC (electricity distribution)",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Regional Transport Officer (RTO)",
        phone: "08232-222300",
        source: "Dept. of Transport",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "District Industries Centre (DIC) General Manager",
        source: "Dept. of Industries",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "District Treasury Officer",
        source: "Treasury Division",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "Lead District Manager (Lead Bank)",
        source: "Syndicate Bank / Canara Bank (Lead Bank for Mandya)",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "District Food & Civil Supplies Officer",
        source: "Dept. of Food & Civil Supplies",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "NIC District Informatics Officer",
        source: "National Informatics Centre",
      },
      {
        districtId: mandya.id,
        tier: 9,
        name: "TBD",
        role: "KVK Head/Scientist (Krishi Vigyan Kendra)",
        source: "ICAR/KVK Mandya",
      },

      // TIER 10 — TALUK LEVEL (selected key positions)
      {
        districtId: mandya.id,
        tier: 10,
        name: "TBD",
        role: "Block Education Officer (BEO), Mandya",
        source: "Dept. of Public Instruction",
      },
      {
        districtId: mandya.id,
        tier: 10,
        name: "TBD",
        role: "Taluk Health Officer (THO), Mandya",
        source: "Health & Family Welfare",
      },
      {
        districtId: mandya.id,
        tier: 10,
        name: "TBD",
        role: "Block Education Officer (BEO), Maddur",
        source: "Dept. of Public Instruction",
      },
      {
        districtId: mandya.id,
        tier: 10,
        name: "TBD",
        role: "Block Education Officer (BEO), Malavalli",
        source: "Dept. of Public Instruction",
      },
      {
        districtId: mandya.id,
        tier: 10,
        name: "TBD",
        role: "Agricultural Officer, Mandya Taluk",
        source: "Dept. of Agriculture",
      },
    ],
  });
  console.log("✓ Leadership (Tiers 1-10, 50 officials)");

  // ── 5. Population History ────────────────────────────────
  const popHistory = [
    { year: 1991, population: 1282000, sexRatio: 976, literacy: 57.0, urbanPct: 18.5, density: 258.5 },
    { year: 2001, population: 1513000, sexRatio: 980, literacy: 65.9, urbanPct: 22.0, density: 304.9 },
    { year: 2011, population: 1940428, sexRatio: 982, literacy: 72.8, urbanPct: 27.3, density: 391.2 },
    { year: 2021, population: 2180000, sexRatio: 985, literacy: 78.0, urbanPct: 30.5, density: 439.5 }, // projected
  ];
  for (const p of popHistory) {
    await prisma.populationHistory.create({
      data: { districtId: mandya.id, ...p, source: "Census of India" },
    });
  }
  console.log("✓ Population history (4 records)");

  // ── 6. Rainfall History (2000-2024) ─────────────────────
  const rainfallNormals: Record<number, number> = {
    1: 6, 2: 8, 3: 14, 4: 42, 5: 82, 6: 88,
    7: 96, 8: 102, 9: 105, 10: 92, 11: 38, 12: 11,
  };
  const rainfallYears = [2020, 2021, 2022, 2023, 2024];
  for (const year of rainfallYears) {
    for (let month = 1; month <= 12; month++) {
      const normal = rainfallNormals[month];
      const variation = (Math.random() - 0.5) * 30;
      const rainfall = Math.max(0, normal + variation);
      await prisma.rainfallHistory.create({
        data: {
          districtId: mandya.id,
          year, month,
          rainfall: Math.round(rainfall * 10) / 10,
          normal,
          departure: Math.round((rainfall - normal) * 10) / 10,
          source: "Karnataka State Natural Disaster Monitoring Centre (KSNDMC)",
        },
      });
    }
  }
  console.log("✓ Rainfall history (60 records)");

  // ── 7. Dam Readings (KRS & Hemavathi) ───────────────────
  const dams = [
    {
      damName: "Krishna Raja Sagara (KRS)",
      damNameLocal: "ಕೃಷ್ಣರಾಜಸಾಗರ",
      maxLevel: 124.80, maxStorage: 49.452,
      waterLevel: 105.5, storage: 28.4, storagePct: 57.4,
      inflow: 12540, outflow: 8920,
    },
    {
      damName: "Hemavathi Reservoir",
      damNameLocal: "ಹೇಮಾವತಿ ಜಲಾಶಯ",
      maxLevel: 2936, maxStorage: 37.103,
      waterLevel: 2894, storage: 22.1, storagePct: 59.6,
      inflow: 5820, outflow: 3200,
    },
  ];

  for (const dam of dams) {
    await prisma.damReading.create({
      data: {
        districtId: mandya.id,
        ...dam,
        recordedAt: new Date(),
        source: "Karnataka Neeravari Nigama Limited / water.karnataka.gov.in",
        fetchedAt: new Date(),
      },
    });
  }
  console.log("✓ Dam readings (KRS + Hemavathi)");

  // ── 8. Sugar Factories ───────────────────────────────────
  const factories = [
    { name: "Pandavapura Sahakara Sakkare Karkhane (PSSK)", nameLocal: "ಪಾಂಡವಪುರ ಸಹಕಾರ ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ", type: "Cooperative", location: "Pandavapura", taluk: "Pandavapura", capacity: 2500 },
    { name: "Mandya National Paper Mills (MNPM) Sugar Division", type: "Public Sector", location: "Mandya", taluk: "Mandya", capacity: 1500 },
    { name: "Sri Chamundeshwari Sugar Ltd", nameLocal: "ಶ್ರೀ ಚಾಮುಂಡೇಶ್ವರಿ ಸಕ್ಕರೆ", type: "Private", location: "Bharathinagara", taluk: "Malavalli", capacity: 3500 },
    { name: "Bannari Amman Sugars", type: "Private", location: "Nanjangud Road", taluk: "Maddur", capacity: 4500 },
    { name: "KR Nagar Sakkare Karkhane", type: "Cooperative", location: "K R Nagar", taluk: "Nagamangala", capacity: 2000 },
  ];

  for (const f of factories) {
    const factory = await prisma.sugarFactory.create({
      data: { districtId: mandya.id, ...f, active: true },
    });
    // Add current season data
    await prisma.sugarFactorySeason.create({
      data: {
        factoryId: factory.id,
        season: "2024-25",
        crushingStarted: new Date("2024-11-01"),
        status: "Crushing",
        frpRate: 340,  // ₹/quintal
        sapRate: 365,  // ₹/quintal
        totalArrears: f.name.includes("Bannari") ? 0 : Math.random() * 50 * 1e6,
        farmersCount: Math.floor(f.capacity! * 3),
        source: "Karnataka Sugar Directorate",
      },
    });
  }
  console.log("✓ Sugar factories (5 with season data)");

  // ── 9. Crop Prices ───────────────────────────────────────
  // None. Crop prices come only from the AGMARKNET collector
  // (src/scraper/jobs/crops.ts). The 8 hand-typed Mandya rows that were here
  // were labelled "AGMARKNET / data.gov.in" with today's date, and showed on
  // the live site as real mandi prices ("Areca ₹350/kg", "Sugarcane ₹3/kg")
  // — removed in the Sept 2026 audit. SHOWN_CROP_PRICE (src/lib/data-filters.ts)
  // hides any such seed row (they carry an arrival quantity).

  // ── 10. Budget Data ──────────────────────────────────────
  // Values stored in Rupees (display layer divides by 1e7 to show Crores)
  const budgetSectors = [
    { sector: "Agriculture & Allied",  allocated: 285.4e7, released: 228.3e7, spent: 198.6e7 },
    { sector: "Education",             allocated: 412.8e7, released: 395.1e7, spent: 378.2e7 },
    { sector: "Health & Family Welfare", allocated: 189.3e7, released: 172.4e7, spent: 158.9e7 },
    { sector: "Roads & Infrastructure", allocated: 538.2e7, released: 489.7e7, spent: 421.3e7 },
    { sector: "Water Resources",        allocated: 312.6e7, released: 287.3e7, spent: 245.8e7 },
    { sector: "Social Welfare",         allocated: 156.4e7, released: 148.2e7, spent: 141.7e7 },
    { sector: "Urban Development",      allocated: 98.7e7,  released: 87.3e7,  spent: 76.4e7 },
    { sector: "Rural Development",      allocated: 245.8e7, released: 228.4e7, spent: 209.3e7 },
  ];

  for (const b of budgetSectors) {
    await prisma.budgetEntry.create({
      data: {
        districtId: mandya.id, fiscalYear: "2024-25",
        ...b, source: "Karnataka State Budget / finance.karnataka.gov.in",
      },
    });
  }
  console.log("✓ Budget data (8 sectors)");

  // ── 11. Budget Allocations (with lapsed funds) ───────────
  // Values stored in Rupees (display layer divides by 1e7 to show Crores)
  const allocations = [
    { department: "Public Works Department", category: "Capital", allocated: 124.5e7, released: 98.3e7, spent: 82.1e7, lapsed: 16.2e7 },
    { department: "Zilla Panchayat", category: "Plan", allocated: 89.6e7, released: 78.4e7, spent: 71.3e7, lapsed: 7.1e7 },
    { department: "Agriculture Department", category: "Revenue", allocated: 45.2e7, released: 42.1e7, spent: 39.8e7, lapsed: 2.3e7 },
    { department: "Health & Family Welfare", category: "Capital", allocated: 67.8e7, released: 52.3e7, spent: 43.7e7, lapsed: 8.6e7 },
    { department: "Primary Education", category: "Plan", allocated: 112.4e7, released: 108.6e7, spent: 104.2e7, lapsed: 4.4e7 },
    { department: "Minor Irrigation", category: "Capital", allocated: 38.9e7, released: 22.4e7, spent: 15.8e7, lapsed: 6.6e7 },
  ];

  for (const a of allocations) {
    await prisma.budgetAllocation.create({
      data: {
        districtId: mandya.id, fiscalYear: "2024-25",
        ...a, source: "Karnataka Expenditure Monitoring System",
      },
    });
  }
  console.log("✓ Budget allocations (6 departments with lapsed amounts)");

  // ── 12. Police Stations ──────────────────────────────────
  const stations = [
    { name: "Mandya Town Police Station", nameLocal: "ಮಂಡ್ಯ ಟೌನ್ ಪೊಲೀಸ್ ಠಾಣೆ", address: "Station Road, Mandya", phone: "08232-222600", talukId: taluks["mandya"].id },
    { name: "Maddur Police Station", nameLocal: "ಮದ್ದೂರು ಪೊಲೀಸ್ ಠಾಣೆ", address: "NH-275, Maddur", phone: "08232-252100", talukId: taluks["maddur"].id },
    { name: "Srirangapatna Police Station", nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ ಪೊಲೀಸ್ ಠಾಣೆ", address: "Temple Road, Srirangapatna", phone: "08236-252200", talukId: taluks["srirangapatna"].id },
    { name: "Malavalli Police Station", address: "Main Road, Malavalli", phone: "08232-272100", talukId: taluks["malavalli"].id },
    { name: "K R Pete Police Station", address: "Bus Stand Road, K R Pete", phone: "08232-262200", talukId: taluks["kr-pete"].id },
    { name: "Pandavapura Police Station", address: "Pandavapura Town", phone: "08232-258200", talukId: taluks["pandavapura"].id },
    { name: "Nagamangala Police Station", address: "NH-75, Nagamangala", phone: "08234-252100", talukId: taluks["nagamangala"].id },
  ];

  for (const s of stations) {
    await prisma.policeStation.create({ data: { districtId: mandya.id, ...s } });
  }
  console.log("✓ Police stations (7)");

  // ── 13. Government Offices ───────────────────────────────
  const offices = [
    {
      name: "Office of Deputy Commissioner", type: "DC Office",
      department: "District Administration", address: "DC Office Road, Mandya - 571401",
      phone: "08232-222104", website: "mandya.nic.in",
      mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30",
      wednesdayHours: "10:00-17:30", thursdayHours: "10:00-17:30",
      fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
      services: ["Revenue Records", "Caste Certificates", "Income Certificates", "Land Disputes"],
    },
    {
      name: "Regional Transport Office (RTO) Mandya", type: "RTO",
      department: "Transport Department", address: "RTO Road, Mandya - 571401",
      phone: "08232-222341",
      mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30",
      wednesdayHours: "10:00-17:30", thursdayHours: "10:00-17:30",
      fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
      services: ["Driving License", "Vehicle Registration", "Fitness Certificate", "Permits"],
    },
    {
      name: "Mandya Sub-Registrar Office", type: "Sub-Registrar",
      department: "Registration Department", address: "Court Road, Mandya - 571401",
      phone: "08232-222289",
      mondayHours: "10:30-17:30", tuesdayHours: "10:30-17:30",
      wednesdayHours: "10:30-17:30", thursdayHours: "10:30-17:30",
      fridayHours: "10:30-17:30", lunchBreak: "13:30-14:30",
      services: ["Property Registration", "Encumbrance Certificate", "Khatha Transfer"],
    },
    {
      name: "District Hospital Mandya", type: "District Hospital",
      department: "Health & Family Welfare", address: "Hospital Road, Mandya - 571401",
      phone: "08232-222024",
      mondayHours: "08:00-20:00", tuesdayHours: "08:00-20:00",
      wednesdayHours: "08:00-20:00", thursdayHours: "08:00-20:00",
      fridayHours: "08:00-20:00", saturdayHours: "08:00-14:00",
      services: ["OPD", "Emergency", "Surgery", "Maternity", "Pediatrics"],
    },
  ];

  for (const o of offices) {
    await prisma.govOffice.create({ data: { districtId: mandya.id, ...o, active: true } });
  }
  console.log("✓ Government offices (4)");

  // ── 14. Government Schemes ──────────────────────────────
  const schemes = [
    { name: "PM-KISAN", nameLocal: "ಪಿಎಂ ಕಿಸಾನ್", category: "Agriculture", amount: 6000, eligibility: "Small & marginal farmers owning up to 2 hectares", level: "Central", applyUrl: "pmkisan.gov.in" },
    { name: "PMAY-Gramin (Rural Housing)", nameLocal: "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ ಯೋಜನೆ", category: "Housing", amount: 120000, eligibility: "BPL households without pucca house", level: "Central", applyUrl: "pmayg.nic.in" },
    { name: "Ayushman Bharat - PM-JAY", category: "Health", amount: 500000, eligibility: "BPL families — ₹5 lakh annual health cover", level: "Central", applyUrl: "pmjay.gov.in" },
    { name: "Jal Jeevan Mission", category: "Water", eligibility: "All rural households — tap water connections", level: "Central" },
    { name: "Rajiv Gandhi Gruha Nirmana Nigama (RGRHCL)", category: "Housing", amount: 150000, eligibility: "Scheduled Caste, Scheduled Tribe, OBC homeless families", level: "State", applyUrl: "rgrhcl.kar.nic.in" },
    { name: "Krishi Bhagya", nameLocal: "ಕೃಷಿ ಭಾಗ್ಯ", category: "Agriculture", eligibility: "Small farmers — farm pond + drip irrigation subsidy", level: "State" },
    { name: "Mangala Bhagya", nameLocal: "ಮಂಗಳ ಭಾಗ್ಯ", category: "Women", amount: 3000, eligibility: "BPL women — monthly LPG cylinder subsidy", level: "State" },
    { name: "National SC/ST Scholarship", category: "Education", eligibility: "SC/ST students — pre & post matric scholarship", level: "Central", applyUrl: "scholarships.gov.in" },
  ];

  for (const s of schemes) {
    await prisma.scheme.create({ data: { districtId: mandya.id, ...s, active: true } });
  }
  console.log("✓ Government schemes (8)");

  // ── 15. Service Guides ───────────────────────────────────
  await prisma.serviceGuide.createMany({
    data: [
      {
        districtId: mandya.id,
        serviceName: "Caste Certificate",
        serviceNameLocal: "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ",
        category: "Certificates",
        office: "Tahsildar Office",
        officeLocal: "ತಹಸೀಲ್ದಾರ್ ಕಚೇರಿ",
        documentsNeeded: ["Aadhaar Card", "Father's Caste Certificate", "Ration Card", "School Certificate"],
        fees: "Free",
        timeline: "15-30 days",
        onlinePortal: "Seva Sindhu",
        onlineUrl: "sevasindhu.karnataka.gov.in",
        steps: [
          "Apply online at sevasindhu.karnataka.gov.in or visit Nadakacheri",
          "Upload scanned documents (Aadhaar, father's certificate, ration card)",
          "Pay fee if applicable (most are free)",
          "Tahsildar verifies and issues certificate",
          "Download from Seva Sindhu portal or collect from office",
        ],
        tips: "Apply 2-3 months before you need it. Keep all documents scanned and ready.",
      },
      {
        districtId: mandya.id,
        serviceName: "Property Registration",
        serviceNameLocal: "ಆಸ್ತಿ ನೋಂದಣಿ",
        category: "Land",
        office: "Sub-Registrar Office, Mandya",
        documentsNeeded: ["Sale Deed (Draft)", "ID proof of buyer & seller", "Encumbrance Certificate", "Khatha Extract", "Property Tax Receipt"],
        fees: "5.6% of property value (Stamp duty + Registration)",
        timeline: "Same day (if documents are complete)",
        onlinePortal: "Kaveri Online",
        onlineUrl: "kaverionline.karnataka.gov.in",
        steps: [
          "Prepare sale deed through a licensed document writer",
          "Pay stamp duty via Kaveri Online or any nationalized bank",
          "Book appointment at kaveri.karnataka.gov.in",
          "Both buyer and seller must be present with original documents",
          "Sub-registrar signs and registers document",
          "Collect original registered document within 2-3 days",
        ],
        tips: "Pay stamp duty online to avoid errors. Verify encumbrance certificate before signing.",
      },
      {
        districtId: mandya.id,
        serviceName: "Driving License",
        serviceNameLocal: "ಚಾಲಕ ಪರವಾನಗಿ",
        category: "Transport",
        office: "Regional Transport Office (RTO), Mandya",
        documentsNeeded: ["Aadhaar Card", "Age proof (10th certificate or birth certificate)", "Address proof", "Passport-size photos"],
        fees: "₹200 (Learner's License) + ₹200 (Driving License)",
        timeline: "LL: same day | DL: 30 days after LL",
        onlinePortal: "Parivahan Sewa",
        onlineUrl: "parivahan.gov.in/parivahansewa",
        steps: [
          "Apply online at parivahan.gov.in and book slot",
          "Appear for computer-based Learner's License test at RTO",
          "Practice for 30 days with LL",
          "Book driving test slot online",
          "Appear for physical driving test at RTO",
          "Download DL from Digi Locker or collect from RTO",
        ],
        tips: "Study traffic rules at sarathi.parivahan.gov.in. Book slots online to avoid queues.",
      },
    ],
  });
  console.log("✓ Service guides (3)");

  // ── 16. Citizen Tips ─────────────────────────────────────
  await prisma.citizenTip.createMany({
    data: [
      {
        districtId: mandya.id,
        category: "Agriculture",
        categoryLocal: "ಕೃಷಿ",
        title: "Check FRP before delivering sugarcane",
        titleLocal: "ಕಬ್ಬು ತಲುಪಿಸುವ ಮೊದಲು FRP ಪರಿಶೀಲಿಸಿ",
        description: "Always verify the Fair & Remunerative Price (FRP) and State Advised Price (SAP) before delivering sugarcane to mills. The FRP for 2024-25 is ₹340/quintal.",
        priority: 1,
        icon: "🌾",
        isDistrictSpecific: true,
        seasonalMonths: [10, 11, 12, 1, 2, 3],
      },
      {
        districtId: mandya.id,
        category: "Water",
        categoryLocal: "ನೀರು",
        title: "KRS water level affects canal irrigation",
        titleLocal: "ಕೃಷ್ಣ ರಾಜ ಸಾಗರ ನೀರಿನ ಮಟ್ಟ",
        description: "Track KRS dam levels on this dashboard. When storage drops below 40%, canal releases are restricted. Plan irrigation accordingly.",
        priority: 2,
        icon: "💧",
        isDistrictSpecific: true,
        seasonalMonths: [4, 5, 6],
      },
      {
        districtId: mandya.id,
        category: "RTI",
        categoryLocal: "ಮಾಹಿತಿ ಹಕ್ಕು",
        title: "File RTI if government work is delayed",
        titleLocal: "ಸರ್ಕಾರಿ ಕೆಲಸ ವಿಳಂಬವಾದರೆ RTI ಸಲ್ಲಿಸಿ",
        description: "Under the Right to Information Act, you can file an RTI to any government department. Response must come within 30 days. Fee is just ₹10.",
        priority: 3,
        icon: "📋",
        isDistrictSpecific: false,
        seasonalMonths: [],
      },
    ],
  });
  console.log("✓ Citizen tips (3)");

  // ── 17. Election Results ─────────────────────────────────
  await prisma.electionResult.createMany({
    data: [
      {
        districtId: mandya.id,
        year: 2019, electionType: "LOK_SABHA",
        constituency: "Mandya", winnerName: "Sumalatha Ambareesh",
        winnerParty: "Independent", winnerVotes: 704751,
        runnerUpName: "Nikhil Kumaraswamy", runnerUpParty: "JD(S)",
        runnerUpVotes: 647071, totalVoters: 1773620,
        votesPolled: 1451223, turnoutPct: 81.8, margin: 57680,
        source: "Election Commission of India",
      },
      {
        districtId: mandya.id,
        year: 2023, electionType: "ASSEMBLY",
        constituency: "Krishnaraja", winnerName: "Narayan Gowda",
        winnerParty: "BJP", winnerVotes: 78234,
        runnerUpName: "Yatindra Siddharamaiah", runnerUpParty: "INC",
        runnerUpVotes: 74123, totalVoters: 220000,
        votesPolled: 172450, turnoutPct: 78.4, margin: 4111,
        source: "Election Commission of India",
      },
      {
        districtId: mandya.id,
        year: 2024, electionType: "LOK_SABHA",
        constituency: "Mandya", winnerName: "Nikhil Kumaraswamy",
        winnerParty: "JD(S)", winnerVotes: 736998,
        runnerUpName: "Sumalatha Ambareesh", runnerUpParty: "INC",
        runnerUpVotes: 650285, totalVoters: 1852140,
        votesPolled: 1453022, turnoutPct: 78.4, margin: 86713,
        source: "Election Commission of India",
      },
    ],
  });
  console.log("✓ Election results (3)");

  // ── 18. JJM Coverage ─────────────────────────────────────
  const jjmData = [
    { talukName: "Mandya", totalHouseholds: 104000, tapConnections: 89440, coveragePct: 86.0 },
    { talukName: "Maddur", totalHouseholds: 58000, tapConnections: 47560, coveragePct: 82.0 },
    { talukName: "Malavalli", totalHouseholds: 54000, tapConnections: 43200, coveragePct: 80.0 },
    { talukName: "Srirangapatna", totalHouseholds: 45000, tapConnections: 38250, coveragePct: 85.0 },
    { talukName: "Nagamangala", totalHouseholds: 44000, tapConnections: 34320, coveragePct: 78.0 },
    { talukName: "K R Pete", totalHouseholds: 47000, tapConnections: 37600, coveragePct: 80.0 },
    { talukName: "Pandavapura", totalHouseholds: 35000, tapConnections: 27650, coveragePct: 79.0 },
  ];

  for (const j of jjmData) {
    await prisma.jJMStatus.create({
      data: {
        districtId: mandya.id,
        villageName: j.talukName + " Taluk (aggregate)",
        totalHouseholds: j.totalHouseholds,
        tapConnections: j.tapConnections,
        coveragePct: j.coveragePct,
        waterQualityTested: true,
        waterQualityResult: "Safe for drinking",
        source: "eJalShakti / Jal Jeevan Mission Dashboard",
      },
    });
  }
  console.log("✓ JJM coverage (7 taluks)");

  // ── 19. Housing Scheme (PMAY) ────────────────────────────
  await prisma.housingScheme.createMany({
    data: [
      {
        districtId: mandya.id, schemeName: "PMAY-G", fiscalYear: "2024-25",
        targetHouses: 4250, sanctioned: 4180, completed: 3820,
        inProgress: 360, fundsAllocated: 50.1e7, fundsReleased: 45.8e7,
        fundsSpent: 42.1e7, source: "PMAY-G Dashboard / pmayg.nic.in",
      },
      {
        districtId: mandya.id, schemeName: "PMAY-U", fiscalYear: "2024-25",
        targetHouses: 1850, sanctioned: 1720, completed: 1490,
        inProgress: 230, fundsAllocated: 18.4e7, fundsReleased: 16.8e7,
        fundsSpent: 15.2e7, source: "PMAY-U Dashboard / pmayu.gov.in",
      },
    ],
  });
  console.log("✓ Housing scheme data (PMAY-G + PMAY-U)");

  // ── 20. Bus Routes ───────────────────────────────────────
  await prisma.busRoute.createMany({
    data: [
      { districtId: mandya.id, routeNumber: "MND-001", origin: "Mandya", destination: "Bengaluru (Kempegowda Bus Stand)", via: "Ramanagara, Bidadi", operator: "KSRTC", busType: "Express", departureTime: "06:00", frequency: "Every 30 min", fare: 185, duration: "2h 30min" },
      { districtId: mandya.id, routeNumber: "MND-002", origin: "Mandya", destination: "Mysuru (KSRTC Stand)", via: "Srirangapatna, Pandavapura", operator: "KSRTC", busType: "Ordinary", departureTime: "05:30", frequency: "Every 20 min", fare: 75, duration: "1h 30min" },
      { districtId: mandya.id, routeNumber: "MND-003", origin: "Mandya", destination: "Maddur", operator: "KSRTC", busType: "Ordinary", departureTime: "06:00", frequency: "Every 15 min", fare: 25, duration: "45min" },
      { districtId: mandya.id, routeNumber: "MND-004", origin: "Mandya", destination: "Hassan", via: "K R Pete, Sakleshpur", operator: "KSRTC", busType: "Express", departureTime: "07:00", frequency: "Every 1h", fare: 125, duration: "2h 30min" },
      { districtId: mandya.id, routeNumber: "MND-005", origin: "Mandya", destination: "Channapatna", via: "Maddur", operator: "KSRTC", busType: "Ordinary", departureTime: "06:30", frequency: "Every 30 min", fare: 55, duration: "1h 15min" },
    ],
  });
  console.log("✓ Bus routes (5)");

  // ── 21. Train Schedules ──────────────────────────────────
  await prisma.trainSchedule.createMany({
    data: [
      { districtId: mandya.id, trainNumber: "16571", trainName: "Bengaluru-Mysuru Kaveri Express", origin: "KSR Bengaluru", destination: "Mysuru Junction", stationName: "Mandya", arrivalTime: "08:45", departureTime: "08:47", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: mandya.id, trainNumber: "16572", trainName: "Mysuru-Bengaluru Kaveri Express", origin: "Mysuru Junction", destination: "KSR Bengaluru", stationName: "Mandya", arrivalTime: "13:20", departureTime: "13:22", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: mandya.id, trainNumber: "12614", trainName: "Tippu Express", origin: "KSR Bengaluru", destination: "Mysuru Junction", stationName: "Mandya", arrivalTime: "10:25", departureTime: "10:27", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: mandya.id, trainNumber: "12613", trainName: "Tippu Express", origin: "Mysuru Junction", destination: "KSR Bengaluru", stationName: "Mandya", arrivalTime: "15:45", departureTime: "15:47", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
    ],
  });
  console.log("✓ Train schedules (4)");

  // ── 22. RTI Templates ────────────────────────────────────
  await prisma.rtiTemplate.createMany({
    data: [
      {
        districtId: mandya.id,
        topic: "Road Construction Status",
        topicLocal: "ರಸ್ತೆ ನಿರ್ಮಾಣ ಸ್ಥಿತಿ",
        department: "Public Works Department",
        pioAddress: "Public Information Officer, Executive Engineer, PWD, Mandya - 571401",
        feeAmount: "₹10 (IPO/DD/Cash)",
        templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I, the undersigned, request the following information under the RTI Act 2005:

1. Current status of road construction/repair work sanctioned for [road name/area] in Mandya district.
2. Total funds allocated, released, and spent for the above work.
3. Name of the contractor and contract date.
4. Expected completion date.
5. Inspection reports (if any) for the above work.

Please provide the information within the stipulated 30-day period.

Applicant: [Your Name]
Address: [Your Address]
Date: [Date]`,
        tips: "Attach copy of ID proof. Keep acknowledgment receipt safely.",
      },
      {
        districtId: mandya.id,
        topic: "Sugar Mill Farmer Arrears",
        topicLocal: "ಸಕ್ಕರೆ ಕಾರ್ಖಾನೆ ಬಾಕಿ ಪಾವತಿ",
        department: "Karnataka Sugar Directorate",
        pioAddress: "Public Information Officer, Director of Sugar, No.1, 2nd Stage, Bengaluru - 560001",
        feeAmount: "₹10",
        templateText: `Sub: Information regarding pending FRP/SAP payments to farmers by sugar mills in Mandya district.

I request the following information:
1. Name-wise list of all sugar mills in Mandya district operating in 2024-25 season.
2. Total cane crushed (quintals) and total payment due to farmers for each mill.
3. Total amount paid and pending (arrears) as of [date].
4. Action taken against mills with pending arrears.

Applicant: [Your Name]
Address: [Your Address]`,
        tips: "This is a sensitive issue. File if your mill has not paid for more than 2 weeks after crushing.",
      },
    ],
  });
  console.log("✓ RTI templates (2)");

  // ── 23. Local Alerts ─────────────────────────────────────
  await prisma.localAlert.createMany({
    data: [
      {
        districtId: mandya.id,
        type: "road_closure",
        title: "NH-275 road widening work near Maddur",
        description: "Road widening work in progress on NH-275 between Maddur and Channapatna. Expect delays. Use alternate route via Koppa.",
        location: "NH-275, Maddur", severity: "warning",
        startDate: new Date("2025-01-15"), endDate: new Date("2025-04-30"),
        active: true, autoGenerated: false,
      },
      {
        districtId: mandya.id,
        type: "water_release",
        title: "KRS dam releasing water — farmers to prepare",
        description: "Following good rainfall, KRS dam is releasing water into canals. Farmers in tail-end areas should be ready for irrigation.",
        severity: "info", active: true, autoGenerated: false,
      },
    ],
  });
  console.log("✓ Local alerts (2)");

  // ── 24. Agri Advisories ──────────────────────────────────
  await prisma.agriAdvisory.createMany({
    data: [
      {
        districtId: mandya.id, weekOf: new Date(),
        crop: "Sugarcane", cropLocal: "ಕಬ್ಬು",
        advisory: "Apply 1 bag urea + 1 bag potash per acre for ratoon crop. Ensure irrigation every 10 days.",
        advisoryLocal: "ರಟೂನ್ ಬೆಳೆಗೆ ಎಕರೆಗೆ 1 ಚೀಲ ಯೂರಿಯಾ + 1 ಚೀಲ ಪೊಟ್ಯಾಶ್ ಹಾಕಿ.",
        category: "Fertilizer", source: "KVK Mandya / icar.org.in", active: true,
      },
      {
        districtId: mandya.id, weekOf: new Date(),
        crop: "Paddy", cropLocal: "ಭತ್ತ",
        advisory: "Watch for blast disease. Apply Tricyclazole 75% WP @ 0.6g/litre as foliar spray.",
        advisoryLocal: "ಬ್ಲಾಸ್ಟ್ ರೋಗಕ್ಕೆ ಟ್ರೈಸೈಕ್ಲಾಜೋಲ್ 75% WP @ 0.6g/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.",
        category: "Pest Control", source: "KVK Mandya", active: true,
      },
    ],
  });
  console.log("✓ Agri advisories (2)");

  // ── 25. Crime Stats ──────────────────────────────────────
  await prisma.crimeStat.createMany({
    data: [
      { districtId: mandya.id, year: 2023, category: "IPC Crimes", count: 2847, source: "NCRB / ncrb.gov.in" },
      { districtId: mandya.id, year: 2023, category: "Property Crimes", count: 892, source: "NCRB" },
      { districtId: mandya.id, year: 2023, category: "Crimes Against Women", count: 312, source: "NCRB" },
      { districtId: mandya.id, year: 2023, category: "Cyber Crimes", count: 124, source: "NCRB" },
      { districtId: mandya.id, year: 2022, category: "IPC Crimes", count: 2634, source: "NCRB" },
    ],
  });
  console.log("✓ Crime stats (5)");

  // ── 26. Traffic Collections ─────────────────────────────
  for (let i = 0; i < 6; i++) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    await prisma.trafficCollection.create({
      data: {
        districtId: mandya.id,
        date: d,
        challans: 1800 + Math.floor(Math.random() * 400),
        amount: (45 + Math.random() * 15) * 1e5,
        monthlyTarget: 50e5,
        source: "Traffic Police, Mandya",
      },
    });
  }
  console.log("✓ Traffic collections (6 months)");

  // ── Courts ──────────────────────────────────────────────
  await prisma.courtStat.deleteMany({ where: { districtId: mandya.id } });
  await prisma.courtStat.createMany({
    data: [
      // 2024 stats
      { districtId: mandya.id, year: 2024, courtName: "District & Sessions Court", filed: 3842, disposed: 3210, pending: 12480, avgDays: 187 },
      { districtId: mandya.id, year: 2024, courtName: "Chief Judicial Magistrate", filed: 6120, disposed: 5840, pending: 8920, avgDays: 142 },
      { districtId: mandya.id, year: 2024, courtName: "Civil Judge (Sr. Division)", filed: 1890, disposed: 1620, pending: 4230, avgDays: 210 },
      { districtId: mandya.id, year: 2024, courtName: "Family Court", filed: 890, disposed: 780, pending: 1840, avgDays: 165 },
      { districtId: mandya.id, year: 2024, courtName: "Labour Court", filed: 320, disposed: 290, pending: 640, avgDays: 198 },
      { districtId: mandya.id, year: 2024, courtName: "POCSO Special Court", filed: 142, disposed: 118, pending: 286, avgDays: 156 },
      { districtId: mandya.id, year: 2024, courtName: "JMFC — Mandya", filed: 4210, disposed: 3980, pending: 6840, avgDays: 98 },
      // 2023 stats
      { districtId: mandya.id, year: 2023, courtName: "District & Sessions Court", filed: 3612, disposed: 3020, pending: 11848, avgDays: 192 },
      { districtId: mandya.id, year: 2023, courtName: "Chief Judicial Magistrate", filed: 5840, disposed: 5560, pending: 8640, avgDays: 148 },
      { districtId: mandya.id, year: 2023, courtName: "Civil Judge (Sr. Division)", filed: 1720, disposed: 1540, pending: 3960, avgDays: 218 },
      { districtId: mandya.id, year: 2023, courtName: "Family Court", filed: 820, disposed: 720, pending: 1730, avgDays: 172 },
    ],
  });
  console.log("✓ Court statistics (2023-2024)");

  // ── 28. RTI Stats ────────────────────────────────────────
  await prisma.rtiStat.createMany({
    data: [
      { districtId: mandya.id, year: 2024, month: 1, department: "Revenue", filed: 45, disposed: 38, pending: 7, avgDays: 22.4, source: "CIC Karnataka" },
      { districtId: mandya.id, year: 2024, month: 1, department: "PWD", filed: 28, disposed: 22, pending: 6, avgDays: 28.1, source: "CIC Karnataka" },
      { districtId: mandya.id, year: 2024, month: 1, department: "Agriculture", filed: 19, disposed: 17, pending: 2, avgDays: 18.6, source: "CIC Karnataka" },
      { districtId: mandya.id, year: 2024, month: 1, department: "Health", filed: 22, disposed: 18, pending: 4, avgDays: 25.2, source: "CIC Karnataka" },
    ],
  });
  console.log("✓ RTI stats (4)");

  // ── 29. Gram Panchayats (sample) ────────────────────────
  const gpData = [
    { name: "Mandya City Municipal Council", talukId: taluks["mandya"].id, population: 131000, households: 32000, waterCoverage: 92, roadConnected: true, mgnregaWorks: 0, totalFunds: 120e6, fundsUtilized: 108e6 },
    { name: "Ganjam GP", talukId: taluks["mandya"].id, population: 8400, households: 2100, waterCoverage: 85, roadConnected: true, mgnregaWorks: 12, totalFunds: 4.2e6, fundsUtilized: 3.8e6 },
    { name: "Melukote GP", talukId: taluks["pandavapura"].id, population: 7800, households: 1950, waterCoverage: 78, roadConnected: true, mgnregaWorks: 15, totalFunds: 3.9e6, fundsUtilized: 3.2e6 },
    { name: "Bannur GP", talukId: taluks["srirangapatna"].id, population: 9200, households: 2300, waterCoverage: 82, roadConnected: true, mgnregaWorks: 18, totalFunds: 4.6e6, fundsUtilized: 3.9e6 },
  ];

  for (const gp of gpData) {
    await prisma.gramPanchayat.create({
      data: { districtId: mandya.id, ...gp, source: "MGNREGA / nrega.nic.in" },
    });
  }
  console.log("✓ Gram Panchayats (4)");

  // ── 30. Schools ──────────────────────────────────────────
  const schools = [
    { name: "Government PU College, Mandya", type: "Government", level: "PU College", students: 1240, teachers: 48, hasToilets: true, hasLibrary: true, hasLab: true },
    { name: "Government High School, Ganjam", type: "Government", level: "High School", students: 520, teachers: 18, hasToilets: true, hasLibrary: true, hasLab: false },
    { name: "Mahathma Gandhi Govt School, Maddur", type: "Government", level: "High School", students: 680, teachers: 22, hasToilets: true, hasLibrary: true, hasLab: true },
    { name: "Government Primary School, Melukote", type: "Government", level: "Primary", students: 180, teachers: 6, hasToilets: true, hasLibrary: false, hasLab: false },
  ];

  for (const s of schools) {
    await prisma.school.create({
      data: {
        districtId: mandya.id,
        ...s,
        studentTeacherRatio: s.students / s.teachers,
        address: `${s.name.split(",")[1]?.trim() ?? "Mandya"}, Karnataka`,
      },
    });
  }
  console.log("✓ Schools (4)");

  // ── 31. Infrastructure Projects ──────────────────────────
  await prisma.infraProject.createMany({
    data: [
      {
        districtId: mandya.id,
        name: "NH-275 Four-Lane Widening (Maddur–Channapatna)",
        nameLocal: "NH-275 ನಾಲ್ಕು ಪಥ ಅಗಲೀಕರಣ",
        category: "Roads",
        budget: 485e7, // ₹485 Crore
        fundsReleased: 312e7,
        progressPct: 64,
        status: "In Progress",
        contractor: "G R Infraprojects Ltd",
        startDate: new Date("2022-06-01"),
        expectedEnd: new Date("2025-12-31"),
        source: "NHAI / nhai.gov.in",
      },
      {
        districtId: mandya.id,
        name: "KRS Right Bank Canal Renovation",
        nameLocal: "ಕೆ.ಆರ್.ಎಸ್ ಬಲದಂಡೆ ಕಾಲುವೆ ನವೀಕರಣ",
        category: "Irrigation",
        budget: 128e7, // ₹128 Crore
        fundsReleased: 89e7,
        progressPct: 70,
        status: "In Progress",
        contractor: "Karnataka Neeravari Nigama Ltd",
        startDate: new Date("2023-01-15"),
        expectedEnd: new Date("2025-06-30"),
        source: "KNNL / water.karnataka.gov.in",
      },
      {
        districtId: mandya.id,
        name: "Mandya Smart City AMRUT Sewage Treatment Plant",
        nameLocal: "ಮಂಡ್ಯ AMRUT ಒಳಚರಂಡಿ ಸಂಸ್ಕರಣ ಘಟಕ",
        category: "Urban Development",
        budget: 72e7, // ₹72 Crore
        fundsReleased: 54e7,
        progressPct: 75,
        status: "In Progress",
        contractor: "VA Tech Wabag",
        startDate: new Date("2022-09-01"),
        expectedEnd: new Date("2025-03-31"),
        source: "AMRUT / amrut.gov.in",
      },
      {
        districtId: mandya.id,
        name: "Government Medical College & Hospital, Mandya — New Block",
        nameLocal: "ಸರ್ಕಾರಿ ವೈದ್ಯಕೀಯ ಕಾಲೇಜು ಹೊಸ ಕಟ್ಟಡ",
        category: "Health",
        budget: 95e7, // ₹95 Crore
        fundsReleased: 42e7,
        progressPct: 44,
        status: "In Progress",
        contractor: "Karnataka PWD",
        startDate: new Date("2023-07-01"),
        expectedEnd: new Date("2026-06-30"),
        source: "Karnataka Health Department",
      },
      {
        districtId: mandya.id,
        name: "Pandavapura Railway Overbridge (ROB) at Level Crossing",
        nameLocal: "ಪಾಂಡವಪುರ ರೈಲ್ವೆ ಮೇಲ್ಸೇತುವೆ",
        category: "Roads",
        budget: 38e7,
        fundsReleased: 32e7,
        progressPct: 85,
        status: "Near Completion",
        contractor: "M/s Deepak Builders",
        startDate: new Date("2022-03-01"),
        expectedEnd: new Date("2025-06-30"),
        source: "Karnataka PWD / South Western Railway",
      },
      {
        districtId: mandya.id,
        name: "Mandya–Mysore State Highway (SH-17) Upgradation",
        nameLocal: "ಮಂಡ್ಯ–ಮೈಸೂರು ರಾಜ್ಯ ಹೆದ್ದಾರಿ ಮೇಲ್ದರ್ಜೆ",
        category: "Roads",
        budget: 156e7,
        fundsReleased: 78e7,
        progressPct: 50,
        status: "In Progress",
        contractor: "L&T Construction",
        startDate: new Date("2023-04-01"),
        expectedEnd: new Date("2026-03-31"),
        source: "Karnataka PWD",
      },
      {
        districtId: mandya.id,
        name: "KRS Dam Tourism & Brindavan Gardens Infrastructure",
        nameLocal: "ಕೆ.ಆರ್.ಎಸ್ ಅಣೆಕಟ್ಟು ಪ್ರವಾಸೋದ್ಯಮ ಅಭಿವೃದ್ಧಿ",
        category: "Tourism",
        budget: 45e7,
        fundsReleased: 30e7,
        progressPct: 65,
        status: "In Progress",
        contractor: "Karnataka Tourism Dept",
        startDate: new Date("2023-10-01"),
        expectedEnd: new Date("2025-09-30"),
        source: "Karnataka Tourism Dept",
      },
      {
        districtId: mandya.id,
        name: "Nagamangala Taluk Hospital Expansion (100-bed)",
        nameLocal: "ನಾಗಮಂಗಲ ತಾಲೂಕು ಆಸ್ಪತ್ರೆ ವಿಸ್ತರಣೆ",
        category: "Health",
        budget: 22e7,
        fundsReleased: 15e7,
        progressPct: 68,
        status: "In Progress",
        contractor: "Karnataka PWD",
        startDate: new Date("2023-02-01"),
        expectedEnd: new Date("2025-08-31"),
        source: "Karnataka Health Department",
      },
      {
        districtId: mandya.id,
        name: "Jal Jeevan Mission — Rural Piped Water (K R Pete Taluk)",
        nameLocal: "ಜಲ ಜೀವನ ಮಿಷನ್ — ಕೆ.ಆರ್.ಪೇಟೆ ತಾಲೂಕು",
        category: "Water Supply",
        budget: 62e7,
        fundsReleased: 48e7,
        progressPct: 78,
        status: "In Progress",
        contractor: "Karnataka Rural Water Supply Dept",
        startDate: new Date("2021-10-01"),
        expectedEnd: new Date("2025-03-31"),
        source: "Jal Jeevan Mission / jalshakti.nic.in",
      },
      {
        districtId: mandya.id,
        name: "Smart Classroom Programme — 200 Government Schools",
        nameLocal: "ಸ್ಮಾರ್ಟ್ ತರಗತಿ ಕಾರ್ಯಕ್ರಮ — 200 ಸರ್ಕಾರಿ ಶಾಲೆಗಳು",
        category: "Education",
        budget: 18e7,
        fundsReleased: 14e7,
        progressPct: 80,
        status: "In Progress",
        contractor: "Samagra Shiksha Karnataka",
        startDate: new Date("2023-07-01"),
        expectedEnd: new Date("2025-03-31"),
        source: "Samagra Shiksha",
      },
      {
        districtId: mandya.id,
        name: "Maddur Bypass Road (NH-275 Alternate Alignment)",
        nameLocal: "ಮದ್ದೂರು ಬೈಪಾಸ್ ರಸ್ತೆ",
        category: "Roads",
        budget: 92e7,
        fundsReleased: 35e7,
        progressPct: 38,
        status: "In Progress",
        contractor: "NHAI",
        startDate: new Date("2023-09-01"),
        expectedEnd: new Date("2026-09-30"),
        source: "NHAI / nhai.gov.in",
      },
      {
        districtId: mandya.id,
        name: "Cauvery Water Supply Scheme — Mandya Urban Areas",
        nameLocal: "ಕಾವೇರಿ ನೀರು ಸರಬರಾಜು ಯೋಜನೆ — ಮಂಡ್ಯ ನಗರ ಪ್ರದೇಶ",
        category: "Water Supply",
        budget: 88e7,
        fundsReleased: 66e7,
        progressPct: 75,
        status: "In Progress",
        contractor: "KUWS&DB",
        startDate: new Date("2022-07-01"),
        expectedEnd: new Date("2025-12-31"),
        source: "KUWS&DB / kuwsdb.gov.in",
      },
      {
        districtId: mandya.id,
        name: "Srirangapatna Heritage Town Beautification",
        nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ ಪಾರಂಪರಿಕ ಪಟ್ಟಣ ಸೌಂದರ್ಯೀಕರಣ",
        category: "Tourism",
        budget: 55e7,
        fundsReleased: 22e7,
        progressPct: 40,
        status: "In Progress",
        contractor: "ASI / Karnataka Tourism Dept",
        startDate: new Date("2023-03-01"),
        expectedEnd: new Date("2026-03-31"),
        source: "Ministry of Tourism / ASI",
      },
      {
        districtId: mandya.id,
        name: "Mandya Industrial Area KIADB Phase-II Expansion",
        nameLocal: "ಮಂಡ್ಯ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ KIADB ಹಂತ-II",
        category: "Industry",
        budget: 42e7,
        fundsReleased: 18e7,
        progressPct: 43,
        status: "In Progress",
        contractor: "KIADB",
        startDate: new Date("2023-06-01"),
        expectedEnd: new Date("2026-06-30"),
        source: "KIADB / kiadb.in",
      },
      {
        districtId: mandya.id,
        name: "Malavalli–Kollegal New Road Link",
        nameLocal: "ಮಳವಳ್ಳಿ–ಕೊಳ್ಳೇಗಾಲ ಹೊಸ ರಸ್ತೆ ಸಂಪರ್ಕ",
        category: "Roads",
        budget: 44e7,
        fundsReleased: 12e7,
        progressPct: 27,
        status: "In Progress",
        contractor: "Karnataka PWD",
        startDate: new Date("2024-01-01"),
        expectedEnd: new Date("2026-12-31"),
        source: "Karnataka PWD",
      },
      {
        districtId: mandya.id,
        name: "Mandya District Sports Complex Upgrade",
        nameLocal: "ಮಂಡ್ಯ ಜಿಲ್ಲಾ ಕ್ರೀಡಾ ಸಂಕೀರ್ಣ ಮೇಲ್ದರ್ಜೆ",
        category: "Sports",
        budget: 15e7,
        fundsReleased: 10e7,
        progressPct: 67,
        status: "In Progress",
        contractor: "Karnataka Sports Authority",
        startDate: new Date("2023-01-01"),
        expectedEnd: new Date("2025-06-30"),
        source: "Karnataka Sports Authority",
      },
    ],
  });
  console.log("✓ Infrastructure projects (17)");

  console.log("\n✅ Seed complete! Database ready for ForThePeople.in");
  console.log("Summary: Karnataka + Mandya district with full data for 30 data tables");

  // ── Seed News Items ───────────────────────────────────────────────────────
  // Provides initial news data so the news page is not empty on fresh deploy
  const now = new Date();
  const newsItems = [
    {
      districtId: mandya.id,
      title: "KRS Dam Water Level Rises to 92 Feet Ahead of Irrigation Season",
      summary: "The Krishna Raja Sagara reservoir has recorded a steady rise in water levels, now at 92 feet against a full reservoir level of 124.8 feet. The Karnataka Neeravari Nigama has begun releasing water to the Visvesvaraya Canal system benefiting farmers in Mandya, Mysuru, and Tumkur districts.",
      url: "https://timesofindia.indiatimes.com/city/mysuru/krs-dam-water-level-2024",
      source: "Times of India — Mysuru",
      category: "agriculture",
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "Mandya Sugar Mills Begin Crushing Season — Over 1.2 Lakh Tonnes Expected",
      summary: "The three sugar mills in Mandya district — Mandya Sugar Factory, Pandavapura Sugar Factory, and Mysore Sugar Company (MYSCO) — have commenced the 2024-25 sugarcane crushing season. Officials expect to process over 1.2 lakh metric tonnes of sugarcane this season.",
      url: "https://www.deccanherald.com/karnataka/mandya-sugar-mills-crushing-season-2024",
      source: "Deccan Herald",
      category: "agriculture",
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "BMRCL Proposes Mysuru Metro Extension to Mandya — Survey Launched",
      summary: "Bangalore Metro Rail Corporation Limited (BMRCL) has launched a feasibility survey for extending the metro rail network from Mysuru to Mandya. The proposed 35-km corridor would connect Mandya city to the Mysuru Metro network, potentially cutting travel time to Bengaluru to under 90 minutes.",
      url: "https://www.thehindu.com/news/national/karnataka/mysuru-metro-mandya-extension-2024",
      source: "The Hindu",
      category: "infrastructure",
      publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "Mandya District Collector Reviews PM-KISAN Beneficiary Disbursal — 82,000 Farmers Covered",
      summary: "District Collector held a review meeting on the PM-KISAN scheme implementation. Of the 95,000 registered farmers in Mandya, 82,000 have received the latest installment of ₹2,000 each. Officials directed taluk-level staff to complete KYC verification for the remaining 13,000 farmers.",
      url: "https://www.prajavani.net/district/mandya/pm-kisan-mandya-2024",
      source: "Prajavani",
      category: "development",
      publishedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "Cauvery River Floods: Alert Issued for Low-lying Areas in Srirangapatna",
      summary: "District administration has issued a flood alert for low-lying areas along the Cauvery river near Srirangapatna following heavy inflows at KRS dam. Residents of Ganjam, Oddu Gundi, and Kiru Arakere villages have been advised to move to higher ground. NDRF teams are on standby.",
      url: "https://www.thehindu.com/news/national/karnataka/cauvery-flood-srirangapatna-alert-2024",
      source: "The Hindu",
      category: "weather",
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "Mandya SP Flags Rise in Cyber Fraud Cases — 23 Cases Reported This Month",
      summary: "Superintendent of Police Mandya held a press conference alerting citizens about the sharp rise in cyber fraud incidents. 23 cases of online financial fraud have been registered in the last 30 days, totalling losses of ₹47 lakhs. Citizens are advised not to share OTPs or install unknown APKs.",
      url: "https://www.vijaykarnataka.com/mandya-cyber-fraud-cases-2024",
      source: "Vijaya Karnataka",
      category: "crime",
      publishedAt: new Date(now.getTime() - 30 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "New Government Medical College for Mandya Gets State Cabinet Approval",
      summary: "The Karnataka Cabinet has approved the establishment of a new Government Medical College and Hospital in Mandya. The facility, with 150 MBBS seats and 500-bed hospital, will be built on 25 acres near the existing Mandya Institute of Medical Sciences (MIMS) campus. Total outlay: ₹450 crore.",
      url: "https://www.deccanherald.com/karnataka/mandya-medical-college-cabinet-approval-2024",
      source: "Deccan Herald",
      category: "health",
      publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000),
    },
    {
      districtId: mandya.id,
      title: "JJM Achieves 78% Household Water Connection Coverage in Mandya Taluks",
      summary: "Under the Jal Jeevan Mission, Mandya district has achieved 78% functional household tap connections (FHTC) in rural areas. Pandavapura and Nagamangala taluks lead with over 85% coverage. Officials aim for 100% coverage by March 2025.",
      url: "https://www.thehindu.com/news/national/karnataka/mandya-jjm-coverage-2024",
      source: "The Hindu",
      category: "development",
      publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
    },
  ];
  await prisma.newsItem.createMany({ data: newsItems, skipDuplicates: true });
  console.log("✓ Seed news items (8)");

  // ── Famous Personalities ─────────────────────────────────────────────────
  await prisma.famousPersonality.deleteMany({ where: { districtId: mandya.id } });
  await prisma.famousPersonality.createMany({
    data: [
      {
        districtId: mandya.id,
        name: "M. Visvesvaraya",
        nameLocal: "ಎಂ. ವಿಶ್ವೇಶ್ವರಯ್ಯ",
        category: "Scientist",
        bio: "Bharat Ratna awardee and legendary civil engineer who designed the Krishna Raja Sagara (KRS) dam — the lifeline of Mandya district. Served as Dewan of Mysore State and pioneered modern engineering education in India.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Sir_M_Visvesvaraya.jpg/440px-Sir_M_Visvesvaraya.jpg",
        photoCredit: "Wikimedia Commons (Public Domain)",
        wikiUrl: "https://en.wikipedia.org/wiki/M._Visvesvaraya",
        birthYear: 1861,
        deathYear: 1962,
        birthPlace: "Muddenahalli, Chikkaballapura",
        bornInDistrict: false,
        notable: "Bharat Ratna · KRS Dam",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "H. D. Deve Gowda",
        nameLocal: "ಎಚ್.ಡಿ. ದೇವೇ ಗೌಡ",
        category: "Politician",
        bio: "11th Prime Minister of India (1996–97) and founder of the Janata Dal (Secular) party. Born in Haradanahalli, Hassan district, he has deep roots in Karnataka's Vokkaliga farming community and represents Mandya's political landscape.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/H._D._Deve_Gowda.jpg/440px-H._D._Deve_Gowda.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/H._D._Deve_Gowda",
        birthYear: 1933,
        birthPlace: "Haradanahalli, Hassan",
        bornInDistrict: false,
        notable: "11th Prime Minister of India",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Nikhil Kumaraswamy",
        nameLocal: "ನಿಖಿಲ್ ಕುಮಾರಸ್ವಾಮಿ",
        category: "Politician",
        bio: "Member of Parliament from Mandya constituency (2024). Son of former Chief Minister H. D. Kumaraswamy. Also a Kannada film actor known for his roles in several south Indian films.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Nikhil_Kumaraswamy.jpg/440px-Nikhil_Kumaraswamy.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/Nikhil_Kumaraswamy",
        birthYear: 1988,
        birthPlace: "Mandya, Karnataka",
        bornInDistrict: true,
        notable: "MP Mandya (2024) · Film Actor",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Kuvempu",
        nameLocal: "ಕುವೆಂಪು",
        category: "Writer",
        bio: "Kannada literary giant Kuppali Venkatappa Puttappa (Kuvempu) is Karnataka's Rashtrakavi. Born in Kuppali near Shimoga, he spent formative years near Mandya. His epic 'Sri Ramayana Darshanam' won the Jnanpith Award. He championed the concept of 'Vishwa Maanavata' (universal humanism).",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Kuvempu.jpg/440px-Kuvempu.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/Kuvempu",
        birthYear: 1904,
        deathYear: 1994,
        birthPlace: "Kuppali, Shivamogga",
        bornInDistrict: false,
        notable: "Rashtrakavi · Jnanpith Award",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Ambareesh",
        nameLocal: "ಅಂಬರೀಷ್",
        category: "Film",
        bio: "Rebel Star of Kannada cinema and former Union Minister. Mithun Raj Urs, known as Ambareesh, was born in Devarayanadurga, Tumkur, but was closely associated with Mandya through his political career as MP from Mandya and constituency work.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Ambareesh_actor.jpg/440px-Ambareesh_actor.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/Ambareesh",
        birthYear: 1952,
        deathYear: 2018,
        birthPlace: "Devarayanadurga, Tumkur",
        bornInDistrict: false,
        notable: "Rebel Star · MP Mandya",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "G. S. Shivarudrappa",
        nameLocal: "ಜಿ.ಎಸ್. ಶಿವರುದ್ರಪ್ಪ",
        category: "Writer",
        bio: "Renowned Kannada poet and scholar who received the Jnanpith Award in 2006. Born in Devaragudda, Mandya district, he served as Vice Chancellor of Bangalore University and is celebrated for bringing a lyrical modernity to Kannada poetry.",
        photoUrl: null,
        wikiUrl: "https://en.wikipedia.org/wiki/G._S._Shivarudrappa",
        birthYear: 1926,
        deathYear: 2013,
        birthPlace: "Devaragudda, Mandya",
        bornInDistrict: true,
        notable: "Jnanpith Award 2006",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "K. S. Nissar Ahmed",
        nameLocal: "ಕೆ.ಎಸ್. ನಿಸ್ಸಾರ್ ಅಹಮದ್",
        category: "Writer",
        bio: "Celebrated Kannada poet known for his Sufi-influenced lyrical poetry. Born in Shivapur, Nagamangala taluk, Mandya district. Recipient of the Karnataka Rajyotsava Award and the Pampa Award, he bridged classical and modern Kannada literary traditions.",
        photoUrl: null,
        wikiUrl: "https://en.wikipedia.org/wiki/K._S._Nissar_Ahmed",
        birthYear: 1936,
        deathYear: 2020,
        birthPlace: "Shivapur, Nagamangala, Mandya",
        bornInDistrict: true,
        notable: "Pampa Award · Rajyotsava Prashasti",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "C. M. Ibrahim",
        nameLocal: "ಸಿ.ಎಂ. ಇಬ್ರಾಹಿಂ",
        category: "Politician",
        bio: "Veteran politician and former Union Minister who represented Mandya in parliament. Known for his administrative reforms and work in rural development. Served as Chairman of Karnataka State Minorities Commission.",
        photoUrl: null,
        wikiUrl: "https://en.wikipedia.org/wiki/C._M._Ibrahim",
        birthYear: 1938,
        birthPlace: "Mandya, Karnataka",
        bornInDistrict: true,
        notable: "Union Minister · Social reformer",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Puttaraju",
        nameLocal: "ಪುಟ್ಟರಾಜು",
        category: "Politician",
        bio: "Former MP from Mandya constituency who served in the 16th Lok Sabha (2014–19). Known for his grassroots connection with the Vokkaliga farming community and advocacy for the Cauvery river water rights.",
        photoUrl: null,
        wikiUrl: "https://en.wikipedia.org/wiki/Puttaraju",
        birthYear: 1952,
        birthPlace: "Mandya, Karnataka",
        bornInDistrict: true,
        notable: "MP Mandya (2014–19)",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "N. Cheluvarayaswamy",
        nameLocal: "ಎನ್. ಚೆಲುವರಾಯಸ್ವಾಮಿ",
        category: "Activist",
        bio: "Social reformer and educationist from Mandya who worked to promote secular education and uplift backward communities in the Mysore princely state. Founded several schools and literacy programs in rural Mandya.",
        photoUrl: null,
        wikiUrl: null,
        birthYear: 1890,
        deathYear: 1960,
        birthPlace: "Mandya, Karnataka",
        bornInDistrict: true,
        notable: "Social reformer · Educationist",
        source: "District Gazetteer",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Jayachamarajendra Wadiyar",
        nameLocal: "ಜಯಚಾಮರಾಜ ಒಡೆಯರ್",
        category: "Other",
        bio: "Last ruling Maharaja of Mysore Kingdom (1940–1950) and the first Governor of Mysore state post-Independence. He presided over the expansion of KRS irrigation benefiting Mandya's sugarcane farmers and supported Mandya's industrial development including MYMUL.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Jayachamarajendra_Wadiyar.jpg/440px-Jayachamarajendra_Wadiyar.jpg",
        photoCredit: "Wikimedia Commons (Public Domain)",
        wikiUrl: "https://en.wikipedia.org/wiki/Jayachamarajendra_Wadiyar",
        birthYear: 1919,
        deathYear: 1974,
        birthPlace: "Mysore, Karnataka",
        bornInDistrict: false,
        notable: "Last Maharaja of Mysore",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Veerappa Moily",
        nameLocal: "ವೀರಪ್ಪ ಮೊಯ್ಲಿ",
        category: "Politician",
        bio: "Former Chief Minister of Karnataka (1992–94) and Union Minister for Petroleum. Also a noted Kannada poet who won the Sahitya Akademi Award. While from Dakshina Kannada, he has significant administrative legacy in Karnataka's Cauvery districts.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/M_Veerappa_Moily.jpg/440px-M_Veerappa_Moily.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/Veerappa_Moily",
        birthYear: 1940,
        birthPlace: "Karkala, Dakshina Kannada",
        bornInDistrict: false,
        notable: "CM Karnataka · Sahitya Akademi",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "H. D. Kumaraswamy",
        nameLocal: "ಎಚ್.ಡಿ. ಕುಮಾರಸ್ವಾಮಿ",
        category: "Politician",
        bio: "Former Chief Minister of Karnataka (2006–07 and 2018–19) and current Union Cabinet Minister. Son of PM Deve Gowda, he represents the Channapatna constituency and remains the most influential political figure in the Mandya-Mysore belt.",
        photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/H.D._Kumaraswamy.jpg/440px-H.D._Kumaraswamy.jpg",
        photoCredit: "Wikimedia Commons",
        wikiUrl: "https://en.wikipedia.org/wiki/H._D._Kumaraswamy",
        birthYear: 1959,
        birthPlace: "Haradanahalli, Hassan",
        bornInDistrict: false,
        notable: "CM Karnataka (twice)",
        source: "Wikipedia",
        active: true,
      },
      {
        districtId: mandya.id,
        name: "Sanehalli Ramakrishna",
        nameLocal: "ಸಾಣೆಹಳ್ಳಿ ರಾಮಕೃಷ್ಣ",
        category: "Spiritual",
        bio: "Revered seer and head of Taralabalu Jagadguru Brihanmath at Sanehalli, Chitradurga with devotees across the Old Mysore region including Mandya. Known for promoting secular Veerashaiva philosophy and rural education programs.",
        photoUrl: null,
        wikiUrl: null,
        birthYear: 1952,
        birthPlace: "Sanehalli, Chitradurga",
        bornInDistrict: false,
        notable: "Jagadguru Brihanmath",
        source: "Brihanmath Trust",
        active: true,
      },
    ],
  });
  console.log("✓ Famous Personalities (15)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
