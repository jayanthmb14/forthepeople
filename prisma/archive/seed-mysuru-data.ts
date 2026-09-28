// ═══════════════════════════════════════════════════════════
// FILE 6 of 6: Mysuru District — All Data Modules
// Budget · Dams · Crops · Police · Schools · Offices · Buses
// Elections · Schemes · JJM · Housing · Power · RTI · Tips
// Industries · Infra Projects · Canal Releases
// Run standalone: npx tsx prisma/seed-mysuru-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { exitUnlessLocalSeedAllowed } from "../seed-guard";

// ARCHIVED (prisma/archive/README.md): this seed wipes tables or writes
// invented demo rows. It refuses to run unless ALLOW_SEED_WIPE=1 and the
// database is on this machine.
exitUnlessLocalSeedAllowed();

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedMysuruData(prisma?: PrismaClient) {
  const client  = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📊 [6/6] Seeding Mysuru data modules...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const mysuru = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "mysuru" } },
    });
    const did = mysuru.id;

    const tMys = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "mysuru-taluk"  } } });
    const tHun = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "hunsur"        } } });
    const tNan = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "nanjangud"     } } });
    const tTNP = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "t-narasipur"   } } });
    const tHDK = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "hd-kote"       } } });
    const tPer = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "periyapatna"   } } });
    const tKRN = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "kr-nagar"      } } });

    // ── 1. Population History ─────────────────────────────────
    const existingPop = await client.populationHistory.count({ where: { districtId: did } });
    if (existingPop === 0) {
      await client.populationHistory.createMany({ data: [
        { districtId: did, year: 1991, population: 2388000, sexRatio: 968, literacy: 56.4, urbanPct: 38.2, density: 348, source: "Census of India" },
        { districtId: did, year: 2001, population: 2624900, sexRatio: 975, literacy: 66.0, urbanPct: 41.1, density: 383, source: "Census of India" },
        { districtId: did, year: 2011, population: 3001127, sexRatio: 984, literacy: 72.6, urbanPct: 43.8, density: 438, source: "Census of India" },
        { districtId: did, year: 2024, population: 3248000, sexRatio: 984, literacy: 74.2, urbanPct: 46.0, density: 461, source: "Projected estimate" },
      ]});
      console.log("  ✓ Population history");
    }

    // ── 2. Rainfall History (2023–2024) ───────────────────────
    const existingRain = await client.rainfallHistory.count({ where: { districtId: did } });
    if (existingRain === 0) {
      await client.rainfallHistory.createMany({ data: [
        { districtId: did, year: 2023, month: 1,  rainfall:  4.2, normal:  4.8,  departure: -12.5, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 2,  rainfall:  2.8, normal:  4.2,  departure: -33.3, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 3,  rainfall: 10.4, normal: 10.8,  departure:  -3.7, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 4,  rainfall: 38.6, normal: 36.4,  departure:   6.0, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 5,  rainfall: 98.4, normal: 92.6,  departure:   6.3, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 6,  rainfall:112.8, normal:102.4,  departure:  10.2, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 7,  rainfall:104.6, normal: 96.8,  departure:   8.1, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 8,  rainfall:136.2, normal:118.4,  departure:  15.0, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 9,  rainfall:182.4, normal:164.2,  departure:  11.1, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 10, rainfall:148.6, normal:132.8,  departure:  11.9, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 11, rainfall: 38.4, normal: 36.6,  departure:   4.9, source: "IMD Mysuru" },
        { districtId: did, year: 2023, month: 12, rainfall:  6.2, normal:  7.4,  departure: -16.2, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 1,  rainfall:  5.0, normal:  4.8,  departure:   4.2, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 2,  rainfall:  3.6, normal:  4.2,  departure: -14.3, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 3,  rainfall: 12.8, normal: 10.8,  departure:  18.5, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 4,  rainfall: 44.2, normal: 36.4,  departure:  21.4, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 5,  rainfall:106.4, normal: 92.6,  departure:  14.9, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 6,  rainfall: 88.6, normal:102.4,  departure: -13.5, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 7,  rainfall:128.4, normal: 96.8,  departure:  32.6, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 8,  rainfall:122.8, normal:118.4,  departure:   3.7, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 9,  rainfall:196.2, normal:164.2,  departure:  19.5, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 10, rainfall:168.4, normal:132.8,  departure:  26.8, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 11, rainfall: 32.6, normal: 36.6,  departure: -10.9, source: "IMD Mysuru" },
        { districtId: did, year: 2024, month: 12, rainfall:  5.8, normal:  7.4,  departure: -21.6, source: "IMD Mysuru" },
      ]});
      console.log("  ✓ 24 months rainfall history");
    }

    // ── 3. Weather Readings ───────────────────────────────────
    const existingWR = await client.weatherReading.count({ where: { districtId: did } });
    if (existingWR === 0) {
      await client.weatherReading.createMany({ data: [
        { districtId: did, temperature: 29.2, feelsLike: 31.4, humidity: 62, windSpeed: 10, windDir: "W",  conditions: "Sunny",        rainfall: 0,   pressure: 1014, source: "IMD", recordedAt: new Date("2025-03-01T08:00:00Z") },
        { districtId: did, temperature: 33.4, feelsLike: 36.8, humidity: 58, windSpeed: 8,  windDir: "SW", conditions: "Clear",        rainfall: 0,   pressure: 1012, source: "IMD", recordedAt: new Date("2025-03-08T12:00:00Z") },
        { districtId: did, temperature: 27.6, feelsLike: 29.2, humidity: 74, windSpeed: 12, windDir: "S",  conditions: "Partly Cloudy",rainfall: 2.4, pressure: 1010, source: "IMD", recordedAt: new Date("2025-03-15T06:00:00Z") },
        { districtId: did, temperature: 25.8, feelsLike: 27.2, humidity: 78, windSpeed: 9,  windDir: "SE", conditions: "Overcast",     rainfall: 0,   pressure: 1011, source: "IMD", recordedAt: new Date("2025-03-17T08:00:00Z") },
        { districtId: did, temperature: 28.4, feelsLike: 30.6, humidity: 66, windSpeed: 11, windDir: "W",  conditions: "Partly Cloudy",rainfall: 0,   pressure: 1013, source: "IMD", recordedAt: new Date("2025-03-18T06:00:00Z") },
      ]});
      console.log("  ✓ 5 weather readings");
    }

    // ── 4. KRS Dam Reading ────────────────────────────────────
    const existingDam = await client.damReading.count({ where: { districtId: did } });
    if (existingDam === 0) {
      await client.damReading.createMany({ data: [
        {
          districtId: did,
          damName: "KRS Dam (Krishnaraja Sagara)", damNameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ",
          waterLevel: 2604.8, maxLevel: 2624.0,
          storage: 38.2, maxStorage: 49.45,
          inflow: 1240, outflow: 2800,
          storagePct: 77.3,
          recordedAt: new Date("2025-03-18T06:00:00Z"),
          source: "Karnataka Neeravari Nigama",
        },
        {
          districtId: did,
          damName: "Kabini Reservoir", damNameLocal: "ಕಬಿನಿ ಜಲಾಶಯ",
          waterLevel: 2278.4, maxLevel: 2284.0,
          storage: 17.0, maxStorage: 19.52,
          inflow: 640, outflow: 1200,
          storagePct: 87.1,
          recordedAt: new Date("2025-03-18T06:00:00Z"),
          source: "Karnataka Neeravari Nigama",
        },
      ]});
      console.log("  ✓ KRS Dam + Kabini readings");
    }

    // ── 5. Canal Releases ────────────────────────────────────
    const existingCR = await client.canalRelease.count({ where: { districtId: did } });
    if (existingCR === 0) {
      await client.canalRelease.createMany({ data: [
        { districtId: did, canalName: "Visvesvaraya Canal (Left Bank)",  canalNameLocal: "ವಿಶ್ವೇಶ್ವರಯ್ಯ ಕಾಲುವೆ (ಎಡದಂಡೆ)", releaseCusecs: 3400, scheduledDate: new Date("2025-03-15"), duration: "15 days", targetArea: "Mysuru & Mandya — 1.2 lakh acres", source: "KNNL" },
        { districtId: did, canalName: "Visvesvaraya Canal (Right Bank)", canalNameLocal: "ವಿಶ್ವೇಶ್ವರಯ್ಯ ಕಾಲುವೆ (ಬಲದಂಡೆ)", releaseCusecs: 2800, scheduledDate: new Date("2025-03-15"), duration: "15 days", targetArea: "Mysuru South — 80,000 acres",  source: "KNNL" },
        { districtId: did, canalName: "Kabini Left Bank Canal",          canalNameLocal: "ಕಬಿನಿ ಎಡದಂಡೆ ಕಾಲುವೆ",            releaseCusecs: 1600, scheduledDate: new Date("2025-03-20"), duration: "10 days", targetArea: "H.D. Kote & Nanjangud — 45,000 acres", source: "KNNL" },
      ]});
      console.log("  ✓ 3 canal releases");
    }

    // ── 6. Crop Prices — APMC Mysuru ─────────────────────────
    const existingCP = await client.cropPrice.count({ where: { districtId: did } });
    if (existingCP === 0) {
      await client.cropPrice.createMany({ data: [
        { districtId: did, commodity: "Paddy",        variety: "Sona Masoori", market: "APMC Mysuru",   minPrice: 2183, maxPrice: 2250, modalPrice: 2220, arrivalQty: 12000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Ragi",         variety: "Local",        market: "APMC Mysuru",   minPrice: 2900, maxPrice: 3800, modalPrice: 3400, arrivalQty: 8000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Silk Cocoon",  variety: "Bivoltine",    market: "APMC Mysuru",   minPrice: 42000,maxPrice: 62000,modalPrice: 52000,arrivalQty: 2800,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Silk Cocoon",  variety: "Multivoltine", market: "APMC Mysuru",   minPrice: 28000,maxPrice: 38000,modalPrice: 34000,arrivalQty: 1800,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Sugarcane",    variety: "Co-86032",     market: "APMC Nanjangud",minPrice: 3150, maxPrice: 3400, modalPrice: 3200, arrivalQty: 45000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Coconut",      variety: "Medium",       market: "APMC Mysuru",   minPrice: 1600, maxPrice: 2800, modalPrice: 2200, arrivalQty: 18000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Banana",       variety: "Nanjangud Rasabale", market: "APMC Nanjangud", minPrice: 2800, maxPrice: 5000, modalPrice: 4000, arrivalQty: 9000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Tomato",       variety: "Local",        market: "APMC Mysuru",   minPrice: 600,  maxPrice: 1600, modalPrice: 1000, arrivalQty: 14000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Rose",         variety: "Mixed",        market: "Hunsur Flower Market", minPrice: 3000, maxPrice: 6000, modalPrice: 4500, arrivalQty: 3200, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Sandalwood",   variety: "Grade A",      market: "KFD Mysuru",    minPrice: 11000000, maxPrice: 14000000, modalPrice: 12500000, arrivalQty: 120, date: new Date("2025-03-15"), source: "Karnataka Forest Dept" },
        { districtId: did, commodity: "Pepper",       variety: "Black",        market: "APMC Periyapatna", minPrice: 38000, maxPrice: 52000, modalPrice: 46000, arrivalQty: 800, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Marigold",     variety: "Bicolor",      market: "APMC Mysuru",   minPrice: 2000, maxPrice: 4500, modalPrice: 3200, arrivalQty: 5500, date: new Date("2025-03-15"), source: "Agmarknet" },
      ]});
      console.log("  ✓ 12 crop prices (APMC Mysuru)");
    }

    // ── 7. Budget ────────────────────────────────────────────
    const existingBudget = await client.budgetEntry.count({ where: { districtId: did } });
    if (existingBudget === 0) {
      await client.budgetEntry.createMany({ data: [
        { districtId: did, fiscalYear: "2024-25", sector: "Roads & Infrastructure",     allocated: 8500000000,  released: 6800000000,  spent: 5440000000,  source: "ZP Mysuru Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Water Supply & Sanitation",   allocated: 4200000000,  released: 3360000000,  spent: 2688000000,  source: "MCC / ZP Budget" },
        { districtId: did, fiscalYear: "2024-25", sector: "Education",                   allocated: 5800000000,  released: 4900000000,  spent: 3920000000,  source: "Dept of Education" },
        { districtId: did, fiscalYear: "2024-25", sector: "Health",                      allocated: 4500000000,  released: 3800000000,  spent: 3040000000,  source: "DHO Mysuru" },
        { districtId: did, fiscalYear: "2024-25", sector: "Agriculture & Horticulture",  allocated: 2800000000,  released: 2240000000,  spent: 1792000000,  source: "KSDA Mysuru" },
        { districtId: did, fiscalYear: "2024-25", sector: "Tourism & Heritage",          allocated: 1800000000,  released: 1440000000,  spent: 1152000000,  source: "Dept of Tourism Karnataka" },
        { districtId: did, fiscalYear: "2024-25", sector: "Sericulture & Industry",      allocated: 1500000000,  released: 1200000000,  spent: 960000000,   source: "Dept of Sericulture" },
        { districtId: did, fiscalYear: "2024-25", sector: "Power (CESC)",                allocated: 4800000000,  released: 4200000000,  spent: 3360000000,  source: "CESC Mysuru" },
        { districtId: did, fiscalYear: "2024-25", sector: "Urban Development (MCC)",     allocated: 3200000000,  released: 2560000000,  spent: 2048000000,  source: "MCC Mysuru Budget" },
        { districtId: did, fiscalYear: "2024-25", sector: "Social Welfare",              allocated: 1600000000,  released: 1280000000,  spent: 1024000000,  source: "Dept of Social Welfare" },
        { districtId: did, fiscalYear: "2024-25", sector: "Rural Development (MGNREGA)", allocated: 2200000000,  released: 1760000000,  spent: 1408000000,  source: "MGNREGA Cell Karnataka" },
        { districtId: did, fiscalYear: "2024-25", sector: "Forest & Environment",        allocated: 1200000000,  released: 960000000,   spent: 768000000,   source: "Forest Dept Mysuru" },
      ]});
      console.log("  ✓ 12 budget sector entries");
    }

    // ── 8. Police Stations (25) ───────────────────────────────
    const existingPS = await client.policeStation.count({ where: { districtId: did } });
    if (existingPS === 0) {
      await client.policeStation.createMany({ data: [
        { districtId: did, talukId: tMys.id, name: "Devaraja Police Station",          address: "Devaraja Mohalla, Mysuru 570001",              phone: "0821-2443344" },
        { districtId: did, talukId: tMys.id, name: "Krishnaraja Police Station",       address: "Krishnaraja Mohalla, Mysuru 570001",           phone: "0821-2443355" },
        { districtId: did, talukId: tMys.id, name: "Nazarbad Police Station",          address: "Nazarbad, Mysuru 570010",                      phone: "0821-2443366" },
        { districtId: did, talukId: tMys.id, name: "Jayalakshmipuram Police Station",  address: "Jayalakshmipuram, Mysuru 570012",              phone: "0821-2443377" },
        { districtId: did, talukId: tMys.id, name: "Vidyaranyapuram Police Station",   address: "Vidyaranyapuram, Mysuru 570008",               phone: "0821-2443388" },
        { districtId: did, talukId: tMys.id, name: "Bogadi Police Station",            address: "Bogadi, Mysuru 570026",                        phone: "0821-2443399" },
        { districtId: did, talukId: tMys.id, name: "Hebbal Police Station (Mysuru)",   address: "Hebbal, Mysuru 570016",                        phone: "0821-2483100" },
        { districtId: did, talukId: tMys.id, name: "Chamundipuram Police Station",     address: "Chamundipuram, Mysuru 570004",                 phone: "0821-2441100" },
        { districtId: did, talukId: tMys.id, name: "V.V. Puram Police Station",        address: "Vani Vilas Mohalla, Mysuru 570002",            phone: "0821-2430100" },
        { districtId: did, talukId: tMys.id, name: "Lashkar Police Station",           address: "Lashkar Area, Mysuru 570001",                  phone: "0821-2434100" },
        { districtId: did, talukId: tMys.id, name: "Mandi Mohalla Police Station",     address: "Mandi Mohalla, Mysuru 570021",                 phone: "0821-2432100" },
        { districtId: did, talukId: tMys.id, name: "Udayagiri Police Station",         address: "Udayagiri, Mysuru 570019",                     phone: "0821-2486100" },
        { districtId: did, talukId: tMys.id, name: "Saraswathipuram Police Station",   address: "Saraswathipuram, Mysuru 570009",               phone: "0821-2518100" },
        { districtId: did, talukId: tMys.id, name: "K.R. Nagar Police Station",        address: "K.R. Nagar Town, 571602",                      phone: "08222-252100" },
        { districtId: did, talukId: tMys.id, name: "Rural Police Station Mysuru",      address: "Bannur Road, Mysuru 570015",                   phone: "0821-2440100" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Town Police Station",    address: "Nanjangud Town, 571301",                       phone: "08221-228100" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Rural Police Station",   address: "Nanjangud, 571301",                            phone: "08221-228200" },
        { districtId: did, talukId: tHun.id, name: "Hunsur Town Police Station",       address: "Hunsur, Mysuru Dist 571105",                   phone: "08222-252100" },
        { districtId: did, talukId: tHun.id, name: "Hunsur Rural Police Station",      address: "Hunsur, 571105",                               phone: "08222-252200" },
        { districtId: did, talukId: tTNP.id, name: "T. Narasipur Police Station",      address: "T. Narasipur, Mysuru Dist 571124",             phone: "08227-262100" },
        { districtId: did, talukId: tHDK.id, name: "H.D. Kote Police Station",         address: "H.D. Kote, Mysuru Dist 571114",                phone: "08228-252100" },
        { districtId: did, talukId: tHDK.id, name: "Nagarahole Forest Police Station", address: "Nagarahole, H.D. Kote, 571118",                phone: "08228-252200" },
        { districtId: did, talukId: tPer.id, name: "Periyapatna Police Station",        address: "Periyapatna Town, 571107",                     phone: "08222-263100" },
        { districtId: did, talukId: tKRN.id, name: "K.R. Nagar Town Police Station",   address: "K.R. Nagar, Mysuru Dist 571602",               phone: "08222-252300" },
        { districtId: did, talukId: tMys.id, name: "Bannur Police Station",            address: "Bannur, Mysuru Dist 571101",                   phone: "0821-2580100" },
      ]});
      console.log("  ✓ 25 police stations");
    }

    // ── 9. Govt Offices (20) ─────────────────────────────────
    const existingGO = await client.govOffice.count({ where: { districtId: did } });
    if (existingGO === 0) {
      await client.govOffice.createMany({ data: [
        { districtId: did, name: "Office of the Deputy Commissioner, Mysuru",       department: "Revenue",          type: "District Office",   address: "DC Office, Mysuru 570001",               phone: "0821-2419600" },
        { districtId: did, name: "Mysuru City Corporation (MCC) Head Office",       department: "Urban Local Body", type: "Municipal Office",  address: "MCC Head Office, Mysuru 570001",         phone: "0821-2443020" },
        { districtId: did, name: "Mysuru District Zilla Panchayat",                 department: "Rural Dev",        type: "ZP Office",         address: "ZP Building, Mysuru 570001",             phone: "0821-2418450" },
        { districtId: did, name: "CESC Head Office Mysuru",                         department: "Power",            type: "Power Utility",     address: "CESC, Hunsur Road, Mysuru 570025",       phone: "0821-2440100" },
        { districtId: did, name: "Mysuru City KSRTC Bus Stand",                     department: "Transport",        type: "Bus Terminus",       address: "Bengaluru-Nilgiri Rd, Mysuru 570001",    phone: "0821-2520853" },
        { districtId: did, name: "Regional Transport Office (RTO) Mysuru",          department: "Transport",        type: "RTO",               address: "Mandi Mohalla, Mysuru 570021",           phone: "0821-2432122" },
        { districtId: did, name: "Mysuru Railway Station",                          department: "Railways",         type: "Railway Station",   address: "Irwin Road, Mysuru 570001",              phone: "0821-2520751" },
        { districtId: did, name: "Mysuru Airport Authority Office",                 department: "Civil Aviation",   type: "Airport Office",    address: "Mandakalli, Mysuru 570027",              phone: "0821-2481210" },
        { districtId: did, name: "Income Tax Office Mysuru",                        department: "Finance",          type: "Tax Office",        address: "Sheshadri Iyer Road, Mysuru 570001",     phone: "0821-2437000" },
        { districtId: did, name: "GST Commissionerate Mysuru",                      department: "Finance",          type: "Tax Office",        address: "Nazarbad, Mysuru 570010",                phone: "0821-2527000" },
        { districtId: did, name: "Dept of Sericulture, Mysuru",                     department: "Industry",         type: "Dept Office",       address: "Sericulture Bhavan, Mysuru 570001",      phone: "0821-2515600" },
        { districtId: did, name: "KSIC (Karnataka Silk Industries Corp) Mysuru",    department: "Industry",         type: "Manufacturing",     address: "Mananthody Road, Mysuru 570008",         phone: "0821-2481803" },
        { districtId: did, name: "KSDL (Mysore Sandal Soap) Factory",               department: "Industry",         type: "Manufacturing",     address: "Belavadi, Mysuru 570018",                phone: "0821-2481703" },
        { districtId: did, name: "Dept of Tourism (Mysuru)",                        department: "Tourism",          type: "Dept Office",       address: "Old Exhibition Building, Mysuru 570001", phone: "0821-2422096" },
        { districtId: did, name: "Mysuru Palace Board",                             department: "Heritage",         type: "Heritage Admin",    address: "Palace Road, Mysuru 570001",             phone: "0821-2438028" },
        { districtId: did, name: "Principal District Court, Mysuru",                department: "Judiciary",        type: "District Court",    address: "Court Building, Mysuru 570001",          phone: "0821-2440450" },
        { districtId: did, name: "Dept of Agriculture, Mysuru",                     department: "Agriculture",      type: "Dept Office",       address: "Hunsur Road, Mysuru 570025",             phone: "0821-2419700" },
        { districtId: did, name: "KNNL Divisional Office Mysuru (KRS Dam)",         department: "Irrigation",       type: "Irrigation Office", address: "KRS Dam, K.R. Nagar 571607",             phone: "08222-252800" },
        { districtId: did, name: "Head Post Office, Mysuru GPO",                    department: "Postal",           type: "Post Office",       address: "Ashoka Road, Mysuru 570001",             phone: "0821-2524282" },
        { districtId: did, name: "DDPI Office, Mysuru",                             department: "Education",        type: "Dept Office",       address: "D Devaraj Urs Road, Mysuru 570001",      phone: "0821-2419750" },
      ]});
      console.log("  ✓ 20 govt offices");
    }

    // ── 10. Schools (25) ─────────────────────────────────────
    const existingSch = await client.school.count({ where: { districtId: did } });
    if (existingSch === 0) {
      await client.school.createMany({ data: [
        { districtId: did, talukId: tMys.id, name: "Maharaja's College High School",              type: "Government Aided",  level: "Higher Secondary", address: "Crawford Hall, Mysuru 570005",       students: 2800, teachers: 105 },
        { districtId: did, talukId: tMys.id, name: "Sarada Vilas College High School",            type: "Government Aided",  level: "Higher Secondary", address: "Sarada Vilas Rd, Mysuru 570005",     students: 2400, teachers: 92 },
        { districtId: did, talukId: tMys.id, name: "Kendriya Vidyalaya Mysuru No. 1",             type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Yadavagiri, Mysuru 570020",          students: 1200, teachers: 52 },
        { districtId: did, talukId: tMys.id, name: "Kendriya Vidyalaya Mysuru No. 2 (AFS)",       type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Air Force Station, Mysuru 570011",   students: 1050, teachers: 45 },
        { districtId: did, talukId: tMys.id, name: "Government Girls High School Mysuru",         type: "Government",        level: "Secondary",        address: "Dhanvanthri Road, Mysuru 570001",    students: 820,  teachers: 28 },
        { districtId: did, talukId: tMys.id, name: "St Joseph's Boys High School Mysuru",         type: "Government Aided",  level: "Secondary",        address: "Dufferin Clock Tower, Mysuru 570001",students: 1800, teachers: 68 },
        { districtId: did, talukId: tMys.id, name: "Hardwicke High School",                       type: "Government Aided",  level: "Secondary",        address: "Vinoba Road, Mysuru 570005",         students: 1400, teachers: 54 },
        { districtId: did, talukId: tMys.id, name: "Government High School Saraswathipuram",      type: "Government",        level: "Secondary",        address: "Saraswathipuram, Mysuru 570009",     students: 680,  teachers: 23 },
        { districtId: did, talukId: tMys.id, name: "Delhi Public School Mysuru",                  type: "Private Unaided",   level: "Higher Secondary", address: "Hootagalli, Mysuru 570018",          students: 3200, teachers: 124 },
        { districtId: did, talukId: tMys.id, name: "National Public School Mysuru",               type: "Private Unaided",   level: "Higher Secondary", address: "Vijayanagar 4th Stage, Mysuru 570017",students: 2800, teachers: 110 },
        { districtId: did, talukId: tMys.id, name: "Ryan International School Mysuru",            type: "Private Unaided",   level: "Higher Secondary", address: "Hebbal, Mysuru 570016",              students: 2200, teachers: 86 },
        { districtId: did, talukId: tMys.id, name: "GHPS Chamundipuram",                          type: "Government",        level: "Primary",          address: "Chamundipuram, Mysuru 570004",       students: 340,  teachers: 12 },
        { districtId: did, talukId: tMys.id, name: "Government High School Bannur",               type: "Government",        level: "Secondary",        address: "Bannur, Mysuru Dist 571101",         students: 520,  teachers: 17 },
        { districtId: did, talukId: tNan.id, name: "Government High School Nanjangud",            type: "Government",        level: "Secondary",        address: "Nanjangud Town, 571301",             students: 640,  teachers: 21 },
        { districtId: did, talukId: tNan.id, name: "Sri Ramakrishna Vidyashala Nanjangud",        type: "Government Aided",  level: "Higher Secondary", address: "Nanjangud 571301",                   students: 1600, teachers: 61 },
        { districtId: did, talukId: tHun.id, name: "Government High School Hunsur",               type: "Government",        level: "Secondary",        address: "Hunsur, 571105",                     students: 580,  teachers: 19 },
        { districtId: did, talukId: tHun.id, name: "MES High School Hunsur",                      type: "Government Aided",  level: "Secondary",        address: "Hunsur Main Road, 571105",           students: 1100, teachers: 42 },
        { districtId: did, talukId: tTNP.id, name: "Government High School T. Narasipur",         type: "Government",        level: "Secondary",        address: "T. Narasipur, 571124",               students: 480,  teachers: 16 },
        { districtId: did, talukId: tHDK.id, name: "Government High School H.D. Kote",            type: "Government",        level: "Secondary",        address: "H.D. Kote, 571114",                  students: 440,  teachers: 15 },
        { districtId: did, talukId: tPer.id, name: "Government High School Periyapatna",          type: "Government",        level: "Secondary",        address: "Periyapatna, 571107",                students: 500,  teachers: 17 },
        { districtId: did, talukId: tKRN.id, name: "Government High School K.R. Nagar",           type: "Government",        level: "Secondary",        address: "K.R. Nagar, 571602",                 students: 460,  teachers: 15 },
        { districtId: did, talukId: tMys.id, name: "VIBGYOR High Mysuru",                         type: "Private Unaided",   level: "Higher Secondary", address: "Vijayanagar, Mysuru 570017",         students: 2400, teachers: 94 },
        { districtId: did, talukId: tMys.id, name: "Jawahar Navodaya Vidyalaya Mysuru",           type: "Navodaya",          level: "Higher Secondary", address: "Varuna Hobli, Mysuru 570027",        students: 480,  teachers: 26 },
        { districtId: did, talukId: tNan.id, name: "GHPS Nanjangud",                              type: "Government",        level: "Primary",          address: "Nanjangud, 571301",                  students: 280,  teachers: 10 },
        { districtId: did, talukId: tMys.id, name: "Pooja Bhagavat Memorial Sheshadripuram HSS",  type: "Government Aided",  level: "Higher Secondary", address: "Sheshadripuram, Mysuru 570020",      students: 1800, teachers: 69 },
      ]});
      console.log("  ✓ 25 schools");
    }

    // ── 11. Bus Routes (15) ───────────────────────────────────
    const existingBR = await client.busRoute.count({ where: { districtId: did } });
    if (existingBR === 0) {
      await client.busRoute.createMany({ data: [
        { districtId: did, routeNumber: "MYS-1",  origin: "Mysuru City Bus Stand", destination: "Bengaluru KPTCL", operator: "KSRTC", busType: "Rajahamsa AC", frequency: "30 min", fare: 350 },
        { districtId: did, routeNumber: "MYS-2",  origin: "Mysuru City Bus Stand", destination: "Bengaluru Majestic",operator: "KSRTC", busType: "Airavath",    frequency: "20 min", fare: 280 },
        { districtId: did, routeNumber: "MYS-3",  origin: "Mysuru City Bus Stand", destination: "Nanjangud",        operator: "KSRTC", busType: "Ordinary",    frequency: "20 min", fare: 55 },
        { districtId: did, routeNumber: "MYS-4",  origin: "Mysuru City Bus Stand", destination: "Hunsur",           operator: "KSRTC", busType: "Ordinary",    frequency: "30 min", fare: 70 },
        { districtId: did, routeNumber: "MYS-5",  origin: "Mysuru City Bus Stand", destination: "H.D. Kote",        operator: "KSRTC", busType: "Ordinary",    frequency: "60 min", fare: 90 },
        { districtId: did, routeNumber: "MYS-6",  origin: "Mysuru City Bus Stand", destination: "T. Narasipur",     operator: "KSRTC", busType: "Ordinary",    frequency: "45 min", fare: 65 },
        { districtId: did, routeNumber: "MYS-7",  origin: "Mysuru City Bus Stand", destination: "K.R. Nagar",       operator: "KSRTC", busType: "Ordinary",    frequency: "30 min", fare: 55 },
        { districtId: did, routeNumber: "MYS-8",  origin: "Mysuru City Bus Stand", destination: "Periyapatna",      operator: "KSRTC", busType: "Ordinary",    frequency: "60 min", fare: 80 },
        { districtId: did, routeNumber: "MYS-9",  origin: "Mysuru City Bus Stand", destination: "Chamundi Hills",   operator: "KSRTC", busType: "Ordinary",    frequency: "15 min", fare: 25 },
        { districtId: did, routeNumber: "MYS-10", origin: "Mysuru City Bus Stand", destination: "Brindavan Gardens",operator: "KSRTC", busType: "Ordinary",    frequency: "30 min", fare: 40 },
        { districtId: did, routeNumber: "MYS-11", origin: "Mysuru City Bus Stand", destination: "Mysuru Airport",   operator: "KSRTC", busType: "Vajra",       frequency: "60 min", fare: 80 },
        { districtId: did, routeNumber: "CTB-1",  origin: "Mysuru Palace",          destination: "Hebbal",           operator: "City Bus (MCC)", busType: "Ordinary", frequency: "15 min", fare: 15 },
        { districtId: did, routeNumber: "CTB-2",  origin: "KRS Dam",                destination: "Mysuru City",      operator: "City Bus (MCC)", busType: "Ordinary", frequency: "30 min", fare: 20 },
        { districtId: did, routeNumber: "MYS-12", origin: "Mysuru City Bus Stand", destination: "Gundlupet",        operator: "KSRTC", busType: "Ordinary",    frequency: "60 min", fare: 110 },
        { districtId: did, routeNumber: "MYS-13", origin: "Mysuru City Bus Stand", destination: "Madikeri (Coorg)", operator: "KSRTC", busType: "Ordinary",    frequency: "90 min", fare: 160 },
      ]});
      console.log("  ✓ 15 bus routes");
    }

    // ── 12. Train Schedules ───────────────────────────────────
    const existingTS = await client.trainSchedule.count({ where: { districtId: did } });
    if (existingTS === 0) {
      await client.trainSchedule.createMany({ data: [
        { districtId: did, trainNumber: "12007", trainName: "Shatabdi Express",         origin: "Mysuru",    destination: "Chennai Central",  stationName: "Mysuru Junction", departureTime: "14:00", arrivalTime: null,    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"], active: true },
        { districtId: did, trainNumber: "12008", trainName: "Shatabdi Express",         origin: "Chennai Central", destination: "Mysuru",      stationName: "Mysuru Junction", departureTime: null,    arrivalTime: "22:00", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"], active: true },
        { districtId: did, trainNumber: "22681", trainName: "Mysuru-Bengaluru Express", origin: "Mysuru",    destination: "Krishnarajapuram",stationName: "Mysuru Junction", departureTime: "06:30", arrivalTime: null,    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true },
        { districtId: did, trainNumber: "16210", trainName: "Ajmer Express",            origin: "Mysuru",    destination: "Ajmer",           stationName: "Mysuru Junction", departureTime: "21:30", arrivalTime: null,    daysOfWeek: ["Fri"], active: true },
        { districtId: did, trainNumber: "56274", trainName: "Passenger Mysuru-Bngalr",  origin: "Mysuru",    destination: "Bengaluru City",  stationName: "Mysuru Junction", departureTime: "05:00", arrivalTime: null,    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true },
        { districtId: did, trainNumber: "17301", trainName: "Mysuru-Dharwad Express",   origin: "Mysuru",    destination: "Dharwad",         stationName: "Mysuru Junction", departureTime: "16:00", arrivalTime: null,    daysOfWeek: ["Mon","Wed","Fri","Sun"], active: true },
      ]});
      console.log("  ✓ 6 train schedules");
    }

    // ── 13. Election Results (11 Assembly 2023 + 1 LS 2024) ──
    const existingEle = await client.electionResult.count({ where: { districtId: did } });
    if (existingEle === 0) {
      await client.electionResult.createMany({ data: [
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Krishnaraja",      winnerName: "S.A. Ramdas",        winnerParty: "BJP", winnerVotes: 72400, runnerUpName: "K.C. Narayana Gowda", runnerUpParty: "INC", runnerUpVotes: 58800, totalVoters: 195000, votesPolled: 141000, turnoutPct: 72.3, margin: 13600, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Chamundeshwari",   winnerName: "G.T. Devegowda",     winnerParty: "JD(S)",winnerVotes: 62400, runnerUpName: "R. Mahesh",            runnerUpParty: "INC", runnerUpVotes: 54200, totalVoters: 172000, votesPolled: 128000, turnoutPct: 74.4, margin: 8200,  source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Narasimharaja",    winnerName: "Tanveer Sait",       winnerParty: "INC", winnerVotes: 74800, runnerUpName: "Vasu G.",              runnerUpParty: "BJP", runnerUpVotes: 54400, totalVoters: 188000, votesPolled: 138000, turnoutPct: 73.4, margin: 20400, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Chamaraja",        winnerName: "V. Somashekhar",     winnerParty: "INC", winnerVotes: 68400, runnerUpName: "L. Nagendra",          runnerUpParty: "BJP", runnerUpVotes: 52800, totalVoters: 178000, votesPolled: 132000, turnoutPct: 74.2, margin: 15600, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Varuna",           winnerName: "Siddaramaiah",       winnerParty: "INC", winnerVotes: 92400, runnerUpName: "V. Somanna",           runnerUpParty: "BJP", runnerUpVotes: 68200, totalVoters: 228000, votesPolled: 172000, turnoutPct: 75.4, margin: 24200, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Nanjangud",        winnerName: "Kalale Keerthi",     winnerParty: "BJP", winnerVotes: 82800, runnerUpName: "H.C. Bharatesh",      runnerUpParty: "INC", runnerUpVotes: 68400, totalVoters: 220000, votesPolled: 163000, turnoutPct: 74.1, margin: 14400, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Hunsur",           winnerName: "A.H. Vishwanath",    winnerParty: "INC", winnerVotes: 76200, runnerUpName: "H.P. Manjunath",       runnerUpParty: "BJP", runnerUpVotes: 58800, totalVoters: 198000, votesPolled: 148000, turnoutPct: 74.7, margin: 17400, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "T. Narasipur",     winnerName: "H.C. Mahadevappa",  winnerParty: "INC", winnerVotes: 71600, runnerUpName: "Nagabhushan",          runnerUpParty: "JD(S)",runnerUpVotes: 56200, totalVoters: 185000, votesPolled: 140000, turnoutPct: 75.7, margin: 15400, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "H.D. Kote",        winnerName: "Sunil Bose",         winnerParty: "INC", winnerVotes: 68800, runnerUpName: "Chikkarange Gowda",   runnerUpParty: "JD(S)",runnerUpVotes: 52400, totalVoters: 178000, votesPolled: 134000, turnoutPct: 75.3, margin: 16400, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Periyapatna",      winnerName: "K. Venkatesh",       winnerParty: "INC", winnerVotes: 66400, runnerUpName: "K. Madhusudhan",       runnerUpParty: "BJP", runnerUpVotes: 52800, totalVoters: 172000, votesPolled: 130000, turnoutPct: 75.6, margin: 13600, source: "ECI 2023" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "K.R. Nagar",       winnerName: "Sa. Ra. Mahesh",     winnerParty: "INC", winnerVotes: 72800, runnerUpName: "S. Ravindranath",      runnerUpParty: "JD(S)",runnerUpVotes: 58200, totalVoters: 188000, votesPolled: 144000, turnoutPct: 76.6, margin: 14600, source: "ECI 2023" },
        { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Mysuru-Kodagu",    winnerName: "Yaduveer Wadiyar",   winnerParty: "BJP", winnerVotes: 728400, runnerUpName: "M. Lakshmana",        runnerUpParty: "INC", runnerUpVotes: 624600, totalVoters: 1820000,votesPolled: 1428000,turnoutPct: 78.5, margin: 103800, source: "ECI 2024" },
      ]});
      console.log("  ✓ 11 Assembly + 1 LS election results");
    }

    // ── 14. Schemes (10) ─────────────────────────────────────
    const existingSchemes = await client.scheme.count({ where: { districtId: did } });
    if (existingSchemes === 0) {
      await client.scheme.createMany({ data: [
        { districtId: did, name: "Gruha Lakshmi",              nameLocal: "ಗೃಹ ಲಕ್ಷ್ಮಿ",         category: "Social Welfare", amount: 2000,    beneficiaryCount: 118000, eligibility: "Female head of household with BPL/APL card",                        level: "State",   applyUrl: "sevasindhu.karnataka.gov.in",   active: true, source: "Dept of WCD" },
        { districtId: did, name: "Shakti Free Bus Pass",       nameLocal: "ಶಕ್ತಿ",                 category: "Transport",      amount: 0,       beneficiaryCount: 182000, eligibility: "All women — free travel on KSRTC buses",                              level: "State",   applyUrl: "ksrtc.karnataka.gov.in",        active: true, source: "Dept of Transport" },
        { districtId: did, name: "Yuva Nidhi",                 nameLocal: "ಯುವ ನಿಧಿ",              category: "Employment",     amount: 3000,    beneficiaryCount: 38000,  eligibility: "Unemployed graduates 21-35 years, within 6 months of result",         level: "State",   applyUrl: "sevasindhu.karnataka.gov.in",   active: true, source: "Dept of Labour" },
        { districtId: did, name: "Anna Bhagya",                nameLocal: "ಅನ್ನ ಭಾಗ್ಯ",            category: "Food Security",  amount: 0,       beneficiaryCount: 248000, eligibility: "BPL ration card holders — 10 kg rice/person/month",                   level: "State",   applyUrl: "ahara.kar.nic.in",              active: true, source: "Dept of Food" },
        { districtId: did, name: "PM Awas Yojana (Gramin)",    nameLocal: "ಪಿಎಂಎವೈ ಗ್ರಾಮೀಣ",      category: "Housing",        amount: 130000,  beneficiaryCount: 22000,  eligibility: "BPL households without pucca house; rural areas",                    level: "Central", applyUrl: "pmayg.nic.in",                  active: true, source: "MoRD" },
        { districtId: did, name: "Mysuru Smart City Scheme",   nameLocal: "ಮೈಸೂರು ಸ್ಮಾರ್ಟ್ ಸಿಟಿ",  category: "Urban Dev",      amount: 0,       beneficiaryCount: 920000, eligibility: "Mysuru City Corporation residents — 100 smart city projects",         level: "Central", applyUrl: "mysurucity.com",                active: true, source: "Smart Cities Mission" },
        { districtId: did, name: "Sericulture Subsidy Scheme", nameLocal: "ರೇಷ್ಮೆ ಸಹಾಯಧನ",        category: "Agriculture",    amount: 50000,   beneficiaryCount: 28000,  eligibility: "Silk farmers in Mysuru, Mandya districts for mulberry cultivation",  level: "State",   applyUrl: "silkindiaonline.com",           active: true, source: "Dept of Sericulture" },
        { districtId: did, name: "Aarogyasri Health Insurance",nameLocal: "ಆರೋಗ್ಯಶ್ರೀ",            category: "Health",         amount: 500000,  beneficiaryCount: 218000, eligibility: "BPL families — ₹5 lakh cashless treatment at empanelled hospitals",  level: "State",   applyUrl: "sast.kar.nic.in",               active: true, source: "Dept of Health" },
        { districtId: did, name: "Mysuru Heritage Tourism Grant",nameLocal: "ಮೈಸೂರು ಪಾರಂಪರಿಕ",    category: "Tourism",        amount: 200000,  beneficiaryCount: 1200,   eligibility: "Heritage home-stays and tourism businesses in Mysuru city",          level: "State",   applyUrl: "karnatakatourism.org",          active: true, source: "Dept of Tourism" },
        { districtId: did, name: "MGNREGA Mysuru",             nameLocal: "ಮನರೇಗಾ ಮೈಸೂರು",        category: "Employment",     amount: 0,       beneficiaryCount: 68000,  eligibility: "Rural job card holders — 100 days guaranteed employment",            level: "Central", applyUrl: "nrega.nic.in",                  active: true, source: "MGNREGA Cell" },
      ]});
      console.log("  ✓ 10 schemes");
    }

    // ── 15. JJM Status (7 taluks) ────────────────────────────
    const existingJJM = await client.jJMStatus.count({ where: { districtId: did } });
    if (existingJJM === 0) {
      await client.jJMStatus.createMany({ data: [
        { districtId: did, talukId: tMys.id, villageName: "Mysuru Taluk",       totalHouseholds: 420000, tapConnections: 399000, coveragePct: 95.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tHun.id, villageName: "Hunsur Taluk",       totalHouseholds: 68000,  tapConnections: 58480,  coveragePct: 86.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tNan.id, villageName: "Nanjangud Taluk",    totalHouseholds: 72000,  tapConnections: 63360,  coveragePct: 88.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tTNP.id, villageName: "T. Narasipur Taluk", totalHouseholds: 56000,  tapConnections: 44800,  coveragePct: 80.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tHDK.id, villageName: "H.D. Kote Taluk",   totalHouseholds: 46000,  tapConnections: 34500,  coveragePct: 75.0, waterQualityTested: true, waterQualityResult: "Requires treatment", source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tPer.id, villageName: "Periyapatna Taluk",  totalHouseholds: 44000,  tapConnections: 36080,  coveragePct: 82.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tKRN.id, villageName: "K.R. Nagar Taluk",   totalHouseholds: 46000,  tapConnections: 38180,  coveragePct: 83.0, waterQualityTested: true, waterQualityResult: "Safe",               source: "JJM Dashboard 2024" },
      ]});
      console.log("  ✓ 7 JJM status records");
    }

    // ── 16. Housing Schemes ───────────────────────────────────
    const existingHS = await client.housingScheme.count({ where: { districtId: did } });
    if (existingHS === 0) {
      await client.housingScheme.createMany({ data: [
        { districtId: did, schemeName: "PM Awas Yojana (Gramin) — Mysuru",       fiscalYear: "2024-25", targetHouses: 8000,  sanctioned: 7200,  completed: 4800, inProgress: 2400, fundsAllocated: 1040000000, fundsReleased: 830000000, fundsSpent: 624000000,  source: "PMAYG ZP Mysuru" },
        { districtId: did, schemeName: "RGRHCL — Mysuru District",                fiscalYear: "2024-25", targetHouses: 4800,  sanctioned: 4320,  completed: 2880, inProgress: 1440, fundsAllocated: 624000000,  fundsReleased: 499000000, fundsSpent: 374000000,  source: "RGRHCL Mysuru" },
        { districtId: did, schemeName: "Rajiv Gandhi SC Housing — Mysuru",        fiscalYear: "2024-25", targetHouses: 2400,  sanctioned: 2160,  completed: 1440, inProgress: 720,  fundsAllocated: 360000000,  fundsReleased: 288000000, fundsSpent: 216000000,  source: "SC Dept Mysuru" },
      ]});
      console.log("  ✓ 3 housing schemes");
    }

    // ── 17. CESC Power Outages (6) ────────────────────────────
    const existingPO = await client.powerOutage.count({ where: { districtId: did } });
    if (existingPO === 0) {
      await client.powerOutage.createMany({ data: [
        { districtId: did, talukId: tMys.id, area: "Saraswathipuram & Jayalakshmipuram",  type: "Scheduled", reason: "Transformer maintenance 66kV sub-station",  startTime: new Date("2025-03-20T09:00:00+05:30"), endTime: new Date("2025-03-20T15:00:00+05:30"), duration: "6 hours",  source: "CESC Mysuru", active: false },
        { districtId: did, talukId: tMys.id, area: "Bogadi Zone Sectors 3-6",             type: "Scheduled", reason: "Underground cabling work",                   startTime: new Date("2025-03-22T08:00:00+05:30"), endTime: new Date("2025-03-22T14:00:00+05:30"), duration: "6 hours",  source: "CESC Mysuru", active: false },
        { districtId: did, talukId: tMys.id, area: "Hebbal Industrial Area",              type: "Scheduled", reason: "HT line stringing and conductor replacement", startTime: new Date("2025-03-24T07:00:00+05:30"), endTime: new Date("2025-03-24T17:00:00+05:30"), duration: "10 hours", source: "CESC Mysuru", active: false },
        { districtId: did, talukId: tNan.id, area: "Nanjangud Industrial Area",           type: "Scheduled", reason: "Annual preventive maintenance",              startTime: new Date("2025-03-23T06:00:00+05:30"), endTime: new Date("2025-03-23T18:00:00+05:30"), duration: "12 hours", source: "CESC Mysuru", active: false },
        { districtId: did, talukId: tHun.id, area: "Hunsur Town",                         type: "Scheduled", reason: "New feeder line commissioning",              startTime: new Date("2025-03-25T09:00:00+05:30"), endTime: new Date("2025-03-25T15:00:00+05:30"), duration: "6 hours",  source: "CESC Mysuru", active: false },
        { districtId: did, talukId: tKRN.id, area: "K.R. Nagar Town",                     type: "Scheduled", reason: "Capacitor bank installation",                startTime: new Date("2025-03-26T10:00:00+05:30"), endTime: new Date("2025-03-26T16:00:00+05:30"), duration: "6 hours",  source: "CESC Mysuru", active: false },
      ]});
      console.log("  ✓ 6 CESC scheduled outages");
    }

    // ── 18. RTI Templates (4) ────────────────────────────────
    const existingRTI = await client.rtiTemplate.count({ where: { districtId: did } });
    if (existingRTI === 0) {
      await client.rtiTemplate.createMany({ data: [
        {
          districtId: did,
          topic: "Mysuru Palace / Heritage Site Maintenance Expenditure",
          topicLocal: "ಮೈಸೂರು ಅರಮನೆ ನಿರ್ವಹಣೆ ವೆಚ್ಚ",
          department: "Mysuru Palace Board",
          pioAddress: "Mysuru Palace Board, Palace Road, Mysuru 570001",
          feeAmount: "₹10 (court fee stamp)",
          templateText: `To,
The Public Information Officer,
Mysuru Palace Board,
Palace Road, Mysuru – 570 001.

Subject: Application under Right to Information Act, 2005

I, [Your Name], hereby request:
1. Total expenditure on Dasara festival preparations for the last 3 years (year-wise).
2. Annual maintenance budget for Mysuru Palace and funds actually spent.
3. Revenue collected through entry tickets and light-and-sound show in the last 2 years.
4. List of contractors engaged for Palace maintenance works (above ₹10 lakh).
5. Status of any pending conservation/restoration works.

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "Palace Board is a separate entity from Karnataka Tourism — file with Palace Board specifically.",
          active: true,
        },
        {
          districtId: did,
          topic: "KRS Dam Water Release Schedule & Cauvery Allocation",
          topicLocal: "ಕೆಆರ್ಎಸ್ ಅಣೆಕಟ್ಟು ನೀರು ಬಿಡುಗಡೆ",
          department: "Karnataka Neeravari Nigama Ltd (KNNL)",
          pioAddress: "KNNL Divisional Office, KRS Dam, K.R. Nagar, Mysuru 571607",
          feeAmount: "₹10 (court fee stamp)",
          templateText: `To,
The Public Information Officer,
KNNL (Karnataka Neeravari Nigama Ltd), KRS Division,
KRS Dam, K.R. Nagar, Mysuru – 571 607.

Subject: Application under Right to Information Act, 2005

I, [Your Name], request:
1. Month-wise water release schedule for Visvesvaraya Left and Right Bank Canals for FY 2024-25.
2. Total Cauvery water allocated to Karnataka under CWDT award and actual utilisation in 2023-24.
3. Daily inflow and outflow data for KRS Dam for October–November 2024.
4. Status of KRS Dam restoration/strengthening works and funds spent.
5. Water quality test results for Cauvery water at intake point near KRS Dam.

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "KNNL is under the Water Resources Department. For inter-state Cauvery issues, also reference the Cauvery Water Management Authority.",
          active: true,
        },
        {
          districtId: did,
          topic: "Nagarahole Forest Area Encroachment & Eco-tourism",
          topicLocal: "ನಾಗರಹೊಳೆ ಅರಣ್ಯ ಒತ್ತುವರಿ ಮಾಹಿತಿ",
          department: "Karnataka Forest Department — Nagarahole Division",
          pioAddress: "DFO Nagarahole Tiger Reserve, H.D. Kote, Mysuru 571114",
          feeAmount: "₹10 (court fee stamp)",
          templateText: `To,
The Public Information Officer,
Office of the DFO, Nagarahole Tiger Reserve,
H.D. Kote, Mysuru – 571 114.

Subject: Application under Right to Information Act, 2005

I, [Your Name], request:
1. Total area of Nagarahole National Park/Tiger Reserve and exact boundary survey.
2. Number of encroachment cases detected in last 3 years and action taken.
3. Annual revenue from eco-tourism and safari activities (year-wise last 3 years).
4. Number of elephants, tigers, and leopards as per last wildlife census.
5. Details of eco-sensitive zone (ESZ) notification and any pending projects within ESZ.

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "Nagarahole is both a National Park and Tiger Reserve. File separate RTI with the Forest Department and the National Tiger Conservation Authority if needed.",
          active: true,
        },
        {
          districtId: did,
          topic: "Mysuru Smart City Project Status & Expenditure",
          topicLocal: "ಮೈಸೂರು ಸ್ಮಾರ್ಟ್ ಸಿಟಿ ಯೋಜನೆ ಸ್ಥಿತಿ",
          department: "Mysuru Smart City Limited",
          pioAddress: "Mysuru Smart City Ltd, MCC Head Office, Mysuru 570001",
          feeAmount: "₹10 (court fee stamp)",
          templateText: `To,
The Public Information Officer,
Mysuru Smart City Limited,
MCC Head Office, Mysuru – 570 001.

Subject: Application under Right to Information Act, 2005

I, [Your Name], request for the Mysuru Smart City Mission:
1. List of all projects sanctioned, with budget and current completion status.
2. Total funds received from Central and State Government and utilisation status.
3. List of projects delayed beyond schedule and reasons for delay.
4. Names of contractors and agencies appointed for projects above ₹1 crore.
5. Audit reports for Smart City funds for FY 2022-23 and 2023-24.

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "Mysuru was selected in Round 1 of Smart Cities Mission (2015). SPV is Mysuru Smart City Ltd. You can also reference the Smart City Portal for public data.",
          active: true,
        },
      ]});
      console.log("  ✓ 4 RTI templates");
    }

    // ── 19. Citizen Tips (8) ─────────────────────────────────
    const existingCT = await client.citizenTip.count({ where: { districtId: did } });
    if (existingCT === 0) {
      await client.citizenTip.createMany({ data: [
        { districtId: did, category: "Tourism",     title: "Mysuru Palace — Free Entry on Sundays",    titleLocal: "ಭಾನುವಾರ ಉಚಿತ ಪ್ರವೇಶ",        description: "Mysuru Palace is open all 7 days. Every Sunday it is illuminated by 100,000 light bulbs from 7–8pm. Entry is free for Indian citizens on Sundays. Weekday ticket: ₹70 adults, ₹30 children.",                                                             descriptionLocal: "ಭಾನುವಾರ ರಾತ್ರಿ 7–8 ಗಂಟೆ ಅರಮನೆ ಬೆಳಕಿನ ಸಂಭ್ರಮ; ಭಾರತೀಯರಿಗೆ ಉಚಿತ.",                       priority: 1, icon: "🏛️", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Tourism",     title: "Dasara Bookings — Register Early",         titleLocal: "ದಸರಾ ಮೊದಲೇ ನೋಂದಾಯಿಸಿ",        description: "Mysuru Dasara (Oct) attracts 6M+ visitors. Book hotels 3–4 months in advance. The KSRTC runs special buses from Bengaluru during Dasara week. Chamundi Hill is free during Dasara but expect 2+ hour queues.",                                                   descriptionLocal: "ದಸರಾ ಸಮಯದಲ್ಲಿ ಹೋಟೆಲ್ 3–4 ತಿಂಗಳ ಮೊದಲು ಬುಕ್ ಮಾಡಿ.",                                        priority: 1, icon: "🎪", isDistrictSpecific: true, seasonalMonths: [9,10], active: true },
        { districtId: did, category: "Agriculture", title: "Silk Cocoon Market — Bivoltine Rates",     titleLocal: "ರೇಷ್ಮೆ ಗೂಡು ಮಾರುಕಟ್ಟೆ ದರ",     description: "Mysuru district accounts for 15% of India's silk cocoon production. Bivoltine cocoons fetch ₹42,000–62,000/100kg at APMC Mysuru. Register at the Dept of Sericulture (Sericulture Bhavan, Mysuru) for MSP and subsidy on chawki rearing centres.",             descriptionLocal: "ರೇಷ್ಮೆ ಗೂಡಿಗೆ ಎಪಿಎಂಸಿ ಮೈಸೂರಿನಲ್ಲಿ ₹42,000–62,000/100kg ದರ.",                            priority: 2, icon: "🐛", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Water",       title: "KRS Dam Level — Cauvery Water Alerts",     titleLocal: "ಕೆಆರ್ಎಸ್ ಜಲಾಶಯ ಮಟ್ಟ",           description: "KNNL publishes KRS Dam water level daily on knnl.karnataka.gov.in. During summer (March–May) if storage drops below 30% KNNL restricts canal water to drinking purposes only. Save water during this period.",                                                descriptionLocal: "KNNL ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ KRS ಅಣೆಕಟ್ಟು ಮಟ್ಟ ದಿನಕ್ಕೊಮ್ಮೆ ಪ್ರಕಟಿಸಲಾಗುತ್ತದೆ.",                         priority: 2, icon: "💧", isDistrictSpecific: true, seasonalMonths: [3,4,5], active: true },
        { districtId: did, category: "Health",      title: "K.R. Hospital — Free Specialist OPD",      titleLocal: "ಕೆ.ಆರ್. ಆಸ್ಪತ್ರೆ ಉಚಿತ ಓಪಿಡಿ",   description: "K.R. Hospital (Mysore Medical College) has free specialist OPD Mon–Sat 8am–1pm. 25 specialist departments including Cardiology, Neurology, Oncology. Carry Aadhaar and ration card for BPL priority. MIMS also runs free OPD.",                             descriptionLocal: "ಕೆ.ಆರ್. ಆಸ್ಪತ್ರೆ ಸೋಮ–ಶನಿ 8am–1pm ಉಚಿತ ತಜ್ಞ ಓಪಿಡಿ. ಆಧಾರ ತನ್ನಿ.",                             priority: 2, icon: "🏥", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Civic",       title: "MCC Property Tax — 5% Discount before June 30", titleLocal: "ಮೇ 30 ಮೊದಲು ತೆರಿಗೆ ತುಂಬಿ",  description: "MCC offers 5% discount on property tax if paid before June 30 each year. You can pay online at mcc.gov.in or at any BBMP ward office. Late payment attracts 2% monthly penalty after September 30.",                                                           descriptionLocal: "ಜೂನ್ 30 ರೊಳಗೆ ಆಸ್ತಿ ತೆರಿಗೆ ಭರಿಸಿ 5% ರಿಯಾಯತಿ ಪಡೆಯಿರಿ.",                                     priority: 1, icon: "🏠", isDistrictSpecific: true, seasonalMonths: [4,5,6], active: true },
        { districtId: did, category: "Safety",      title: "Nagarahole — Tiger Reserve Entry Rules",   titleLocal: "ನಾಗರಹೊಳೆ ಪ್ರವೇಶ ನಿಯಮಗಳು",      description: "Nagarahole Tiger Reserve is open 6am–6pm. Safari must be booked at forestdepartment.karnataka.gov.in at least 24 hours in advance. No plastic bags, no loud music, no getting off vehicles. Best wildlife sighting season: Oct–May.",                     descriptionLocal: "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ 24 ಗಂಟೆ ಮೊದಲು ಸಫಾರಿ ಬುಕ್ ಮಾಡಿ. ಪ್ಲಾಸ್ಟಿಕ್ ಒಯ್ಯಬೇಡಿ.",                           priority: 2, icon: "🐯", isDistrictSpecific: true, seasonalMonths: [10,11,12,1,2,3,4,5], active: true },
        { districtId: did, category: "Employment",  title: "KSDL / KSIC Jobs — Apply via KPSC",        titleLocal: "ಕೆಎಸ್‌ಡಿಎಲ್ / ಕೆಎಸ್‌ಐಸಿ ಉದ್ಯೋಗ",  description: "Mysuru's major PSUs — KSDL (Sandal Soap), KSIC (Silk), BEML, and Mysore Sugar Co — recruit through KPSC/direct applications. Register at kpsc.kar.nic.in for notifications. BEML campus is India's largest manufacturer of mining equipment.",               descriptionLocal: "ಕೆಎಸ್‌ಡಿಎಲ್, ಕೆಎಸ್‌ಐಸಿ, ಬಿಇಎಂಎಲ್ ನೇಮಕಾತಿಗೆ kpsc.kar.nic.in ಗಮನಿಸಿ.",                           priority: 2, icon: "🏭", isDistrictSpecific: true, seasonalMonths: [], active: true },
      ]});
      console.log("  ✓ 8 citizen tips");
    }

    // ── 20. Local Industries & Heritage ──────────────────────
    const liClient = client.localIndustry;
    const existingLI = await liClient.count({ where: { districtId: did } });
    if (existingLI === 0) {
      await liClient.createMany({ data: [
        { districtId: did, name: "BEML Limited — Earth Moving Equipment Division",     nameLocal: "ಬಿಇಎಂಎಲ್",          type: "Manufacturing",  category: "Defence & Heavy Industry", location: "BEML Nagar, Mysuru 570016",  taluk: "Mysuru",      details: { employees: 5200, area_acres: 1200, products: "Mining equipment, Metro rail coaches, Defence vehicles", revenue_cr: 3200, founded: 1964 }, active: true, source: "BEML Annual Report 2024" },
        { districtId: did, name: "KSIC — Karnataka Silk Industries Corporation",        nameLocal: "ಕೆಎಸ್‌ಐಸಿ",         type: "Manufacturing",  category: "Textile & Silk",           location: "Mananthody Road, Mysuru",    taluk: "Mysuru",      details: { employees: 1800, silk_products: "Mysore Silk sarees, fabrics, scarves", annual_output_kg: 120000, export_countries: 28, founded: 1912 }, active: true, source: "KSIC Annual Report 2024" },
        { districtId: did, name: "KSDL — Karnataka Soaps & Detergents Ltd (Mysore Sandal Soap)", nameLocal: "ಕೆಎಸ್‌ಡಿಎಲ್", type: "Manufacturing", category: "FMCG / Government", location: "Belavadi Industrial Area, Mysuru", taluk: "Mysuru", details: { employees: 1200, products: "Mysore Sandal Soap, Talcum Powder, Incense Sticks", revenue_cr: 850, sandalwood_kg_annual: 180000, founded: 1916 }, active: true, source: "KSDL Annual Report 2024" },
        { districtId: did, name: "Infosys Mysuru Campus (Global Education Centre)",     nameLocal: "ಇನ್ಫೋಸಿಸ್ ಮೈಸೂರು",  type: "IT / Training",  category: "Information Technology",   location: "Electronics City, Mysuru",   taluk: "Mysuru",      details: { employees: 18000, trainees_per_year: 50000, area_acres: 337, revenue_cr: 0, founded: 2000, note: "World's largest corporate training campus" }, active: true, source: "Infosys Corporate" },
        { districtId: did, name: "Mysore Sugar Company (Mysore Paper Mills)",          nameLocal: "ಮೈಸೂರು ಶುಗರ್",      type: "Manufacturing",  category: "Sugar / Agriculture",      location: "Nanjangud, Mysuru 571301",   taluk: "Nanjangud",   details: { employees: 2400, capacity_tcd: 5000, cane_procurement_acres: 120000, revenue_cr: 480, founded: 1933 }, active: true, source: "Mysore Sugar Co 2024" },
        { districtId: did, name: "Mysuru Palace (Amba Vilas Palace)",                  nameLocal: "ಅಂಬಾ ವಿಲಾಸ ಅರಮನೆ",  type: "Heritage",       category: "Heritage & Tourism",       location: "Palace Road, Mysuru 570001", taluk: "Mysuru",      details: { visitors_annual: 6200000, entry_fee_adult: 70, illumination_days: "Every Sunday + Dasara", built: 1912, style: "Indo-Saracenic", area_sqft: 72580 }, active: true, source: "Mysuru Palace Board" },
        { districtId: did, name: "Nagarahole National Park & Tiger Reserve",           nameLocal: "ನಾಗರಹೊಳೆ ಅಭಯಾರಣ್ಯ",  type: "Wildlife",       category: "Eco-Tourism",              location: "H.D. Kote, Mysuru 571114",  taluk: "H.D. Kote",   details: { area_sqkm: 643, tigers: 120, elephants: 650, leopards: 80, safari_type: "Jeep & Bus", visitors_annual: 180000 }, active: true, source: "Karnataka Forest Dept" },
        { districtId: did, name: "Brindavan Gardens (KRS Dam)",                        nameLocal: "ಬೃಂದಾವನ ಉದ್ಯಾನ",     type: "Tourism",        category: "Heritage & Tourism",       location: "KRS Dam, K.R. Nagar 571607",taluk: "K.R. Nagar",  details: { area_acres: 150, illuminated_fountains: 150, visitors_annual: 2800000, entry_fee: 30, founded: 1932 }, active: true, source: "Dept of Tourism" },
        { districtId: did, name: "Chamundi Hills Temple & Viewpoint",                  nameLocal: "ಚಾಮುಂಡಿ ಬೆಟ್ಟ",        type: "Religious",      category: "Heritage & Tourism",       location: "Chamundi Hills, Mysuru",     taluk: "Mysuru",      details: { height_ft: 3489, steps: 1008, nandi_bull_height_ft: 16, visitors_annual: 4500000, temple_age_years: 500 }, active: true, source: "HR&CE Karnataka" },
        { districtId: did, name: "Mysore Zoo (Sri Chamarajendra Zoological Gardens)", nameLocal: "ಮೈಸೂರು ಮೃಗಾಲಯ",     type: "Tourism",        category: "Heritage & Tourism",       location: "Indira Gandhi Road, Mysuru", taluk: "Mysuru",      details: { area_acres: 157, species: 168, animals: 1700, visitors_annual: 1600000, entry_adult: 80, founded: 1892 }, active: true, source: "Mysore Zoo Authority" },
        { districtId: did, name: "MUDA IT & Biotech Park Mysuru",                      nameLocal: "ಮೈಸೂರು ಐಟಿ ಪಾರ್ಕ್",   type: "IT Park",        category: "Information Technology",   location: "Hebbal Industrial Area",    taluk: "Mysuru",      details: { companies: 45, employees: 8200, area_sqft: 850000, active_since: 2008 }, active: true, source: "MUDA 2024" },
        { districtId: did, name: "Hebbal Industrial Area Mysuru",                      nameLocal: "ಹೆಬ್ಬಾಳ ಕೈಗಾರಿಕಾ ಪ್ರದೇಶ",type: "Industrial Area",category: "Manufacturing",            location: "Hebbal, Mysuru 570016",     taluk: "Mysuru",      details: { companies: 280, employees: 38000, area_acres: 620, major_sectors: "Engineering, Textiles, Food Processing" }, active: true, source: "KIADB 2024" },
      ]});
      console.log("  ✓ 12 local industries & heritage sites");
    }

    // ── 21. Infrastructure Projects (55) ─────────────────────
    const existingIP = await client.infraProject.count({ where: { districtId: did } });
    if (existingIP === 0) {
      await client.infraProject.createMany({ data: [
        // Metro
        { districtId: did, talukId: tMys.id, name: "Mysuru Metro Rail Phase 1 (12 km)",                  category: "Metro Rail",      budget: 11800000000, fundsReleased: 8260000000, progressPct: 62, status: "Ongoing",   startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-03-31"), source: "DMRC" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Metro Phase 1 — Mysuru Station to Yadavagiri",category: "Metro Rail",      budget: 3200000000,  fundsReleased: 2240000000, progressPct: 55, status: "Ongoing",   startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-06-30"), source: "DMRC" },
        // Roads
        { districtId: did, talukId: tMys.id, name: "Mysuru Outer Ring Road (ORR) Phase 2",               category: "Roads",           budget: 4200000000,  fundsReleased: 2940000000, progressPct: 72, status: "Ongoing",   startDate: new Date("2021-04-01"), expectedEnd: new Date("2025-12-31"), source: "PWD Karnataka" },
        { districtId: did, talukId: tMys.id, name: "NH-275 Mysuru–Bengaluru 6-Laning (Mysuru Section)",  category: "Roads",           budget: 18000000000, fundsReleased: 12600000000,progressPct: 88, status: "Ongoing",   startDate: new Date("2019-01-01"), expectedEnd: new Date("2025-06-30"), source: "NHAI" },
        { districtId: did, talukId: tNan.id, name: "Mysuru–Nanjangud 4-Lane Highway",                    category: "Roads",           budget: 1800000000,  fundsReleased: 1440000000, progressPct: 95, status: "Ongoing",   startDate: new Date("2021-10-01"), expectedEnd: new Date("2025-06-30"), source: "PWD Karnataka" },
        { districtId: did, talukId: tHun.id, name: "Hunsur–Periyapatna State Highway Upgrade",           category: "Roads",           budget: 820000000,   fundsReleased: 574000000,  progressPct: 65, status: "Ongoing",   startDate: new Date("2022-07-01"), expectedEnd: new Date("2025-09-30"), source: "PWD Karnataka" },
        { districtId: did, talukId: tHDK.id, name: "H.D. Kote Wildlife Corridor Road Safety Barriers",  category: "Roads",           budget: 240000000,   fundsReleased: 192000000,  progressPct: 80, status: "Ongoing",   startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-06-30"), source: "Karnataka Forest Dept" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Peripheral Ring Road (PRR)",                  category: "Roads",           budget: 8600000000,  fundsReleased: 2580000000, progressPct: 22, status: "Ongoing",   startDate: new Date("2023-09-01"), expectedEnd: new Date("2027-12-31"), source: "MUDA" },
        // Water & Irrigation
        { districtId: did, talukId: tMys.id, name: "Cauvery Stage 5 Water Supply — Mysuru City",         category: "Water Supply",    budget: 3800000000,  fundsReleased: 2660000000, progressPct: 68, status: "Ongoing",   startDate: new Date("2021-06-01"), expectedEnd: new Date("2025-12-31"), source: "CWDM" },
        { districtId: did, talukId: tKRN.id, name: "KRS Dam Strengthening & Safety Works",               category: "Dam & Irrigation",budget: 1200000000,  fundsReleased: 840000000,  progressPct: 70, status: "Ongoing",   startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-09-30"), source: "KNNL" },
        { districtId: did, talukId: tTNP.id, name: "Kabini Reservoir Left Bank Canal Modernisation",     category: "Dam & Irrigation",budget: 680000000,   fundsReleased: 476000000,  progressPct: 62, status: "Ongoing",   startDate: new Date("2021-11-01"), expectedEnd: new Date("2025-06-30"), source: "KNNL" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Town Water Supply Augmentation",           category: "Water Supply",    budget: 420000000,   fundsReleased: 294000000,  progressPct: 55, status: "Ongoing",   startDate: new Date("2022-08-01"), expectedEnd: new Date("2025-09-30"), source: "KUWSDB" },
        { districtId: did, talukId: tHun.id, name: "Hunsur Town Water Supply — JJM",                     category: "Water Supply",    budget: 280000000,   fundsReleased: 196000000,  progressPct: 78, status: "Ongoing",   startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-03-31"), source: "JJM Karnataka" },
        // Healthcare
        { districtId: did, talukId: tMys.id, name: "K.R. Hospital (MMCRI) Super Specialty Block",        category: "Healthcare",      budget: 2400000000,  fundsReleased: 1680000000, progressPct: 58, status: "Ongoing",   startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-03-31"), source: "Health Dept Karnataka" },
        { districtId: did, talukId: tNan.id, name: "New Government Medical College, Nanjangud",           category: "Healthcare",      budget: 1800000000,  fundsReleased: 900000000,  progressPct: 35, status: "Ongoing",   startDate: new Date("2023-06-01"), expectedEnd: new Date("2027-03-31"), source: "Health Dept Karnataka" },
        { districtId: did, talukId: tMys.id, name: "MIMS Mysuru — 500-Bed Hospital Expansion",            category: "Healthcare",      budget: 1200000000,  fundsReleased: 840000000,  progressPct: 65, status: "Ongoing",   startDate: new Date("2022-07-01"), expectedEnd: new Date("2025-12-31"), source: "Health Dept Karnataka" },
        { districtId: did, talukId: tHun.id, name: "Community Health Centre Hunsur Upgrade",              category: "Healthcare",      budget: 180000000,   fundsReleased: 126000000,  progressPct: 72, status: "Ongoing",   startDate: new Date("2022-10-01"), expectedEnd: new Date("2025-06-30"), source: "Health Dept Karnataka" },
        // Education
        { districtId: did, talukId: tMys.id, name: "University of Mysore New Science Block",              category: "Education",       budget: 680000000,   fundsReleased: 476000000,  progressPct: 55, status: "Ongoing",   startDate: new Date("2022-11-01"), expectedEnd: new Date("2025-12-31"), source: "UOM Mysuru" },
        { districtId: did, talukId: tMys.id, name: "IIIT Mysuru Permanent Campus Construction",           category: "Education",       budget: 1200000000,  fundsReleased: 720000000,  progressPct: 42, status: "Ongoing",   startDate: new Date("2023-04-01"), expectedEnd: new Date("2026-12-31"), source: "MoE / IIIT Mysuru" },
        { districtId: did, talukId: tNan.id, name: "Government PU College Nanjangud — New Building",      category: "Education",       budget: 120000000,   fundsReleased: 84000000,   progressPct: 80, status: "Ongoing",   startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-06-30"), source: "Dept of Education" },
        // Heritage & Tourism
        { districtId: did, talukId: tMys.id, name: "Mysuru Heritage Zone Rejuvenation — UNESCO",          category: "Heritage",        budget: 1600000000,  fundsReleased: 1120000000, progressPct: 60, status: "Ongoing",   startDate: new Date("2021-08-01"), expectedEnd: new Date("2025-09-30"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Brindavan Gardens Renovation & Fountain Upgrade",     category: "Heritage",        budget: 480000000,   fundsReleased: 336000000,  progressPct: 75, status: "Ongoing",   startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-06-30"), source: "KNNL / Tourism" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Zoo Master Plan — Phase 2 Expansion",          category: "Heritage",        budget: 860000000,   fundsReleased: 430000000,  progressPct: 38, status: "Ongoing",   startDate: new Date("2023-03-01"), expectedEnd: new Date("2026-12-31"), source: "Mysuru Zoo Authority" },
        { districtId: did, talukId: tMys.id, name: "Chamundi Hills Infrastructure Upgrade",               category: "Heritage",        budget: 320000000,   fundsReleased: 224000000,  progressPct: 65, status: "Ongoing",   startDate: new Date("2022-08-01"), expectedEnd: new Date("2025-09-30"), source: "HR&CE / Tourism" },
        { districtId: did, talukId: tHDK.id, name: "Nagarahole Eco-Tourism Zones Development",            category: "Heritage",        budget: 280000000,   fundsReleased: 196000000,  progressPct: 50, status: "Ongoing",   startDate: new Date("2022-10-01"), expectedEnd: new Date("2025-12-31"), source: "Forest Dept Karnataka" },
        { districtId: did, talukId: tKRN.id, name: "KRS Dam Heritage & Tourism Circuit",                  category: "Heritage",        budget: 240000000,   fundsReleased: 168000000,  progressPct: 55, status: "Ongoing",   startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-09-30"), source: "Dept of Tourism" },
        // Smart City
        { districtId: did, talukId: tMys.id, name: "Smart Traffic Management System — Mysuru",            category: "Smart City",      budget: 680000000,   fundsReleased: 476000000,  progressPct: 88, status: "Ongoing",   startDate: new Date("2021-04-01"), expectedEnd: new Date("2025-03-31"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Integrated Command & Control Centre (ICCC) Mysuru",   category: "Smart City",      budget: 420000000,   fundsReleased: 336000000,  progressPct: 95, status: "Ongoing",   startDate: new Date("2021-01-01"), expectedEnd: new Date("2025-06-30"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Kukkarahalli Lake Rejuvenation — Smart City",         category: "Smart City",      budget: 380000000,   fundsReleased: 304000000,  progressPct: 82, status: "Ongoing",   startDate: new Date("2021-07-01"), expectedEnd: new Date("2025-06-30"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Mysuru City Wi-Fi Zone (Smart City — 1,000 hotspots)",category: "Smart City",      budget: 280000000,   fundsReleased: 252000000,  progressPct: 92, status: "Ongoing",   startDate: new Date("2021-06-01"), expectedEnd: new Date("2025-03-31"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Solid Waste Management Upgrade",               category: "Smart City",      budget: 480000000,   fundsReleased: 336000000,  progressPct: 70, status: "Ongoing",   startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-12-31"), source: "Smart Cities / MCC" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Heritage Signage & Interpretation Centres",    category: "Smart City",      budget: 120000000,   fundsReleased: 96000000,   progressPct: 85, status: "Ongoing",   startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-06-30"), source: "Smart Cities Mission" },
        // Aviation
        { districtId: did, talukId: tMys.id, name: "Mysuru Airport Terminal & Runway Expansion",          category: "Aviation",        budget: 4200000000,  fundsReleased: 2100000000, progressPct: 28, status: "Ongoing",   startDate: new Date("2023-10-01"), expectedEnd: new Date("2027-06-30"), source: "AAI / MoCA" },
        // Railways
        { districtId: did, talukId: tMys.id, name: "Mysuru New Railway Station Redevelopment",            category: "Railways",        budget: 1800000000,  fundsReleased: 540000000,  progressPct: 18, status: "Ongoing",   startDate: new Date("2024-01-01"), expectedEnd: new Date("2027-12-31"), source: "Railway Land Dev Authority" },
        { districtId: did, talukId: tNan.id, name: "Mysuru–Chamarajanagar Rail Line Doubling",             category: "Railways",        budget: 2400000000,  fundsReleased: 1200000000, progressPct: 42, status: "Ongoing",   startDate: new Date("2022-07-01"), expectedEnd: new Date("2026-06-30"), source: "SWR / Railway Ministry" },
        // Industry
        { districtId: did, talukId: tMys.id, name: "BEML Modernisation — Defence Vehicle Plant",          category: "Industry",        budget: 2800000000,  fundsReleased: 1960000000, progressPct: 65, status: "Ongoing",   startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-12-31"), source: "BEML Ltd" },
        { districtId: did, talukId: tMys.id, name: "KSDL Sandal Soap Plant Modernisation",                category: "Industry",        budget: 680000000,   fundsReleased: 476000000,  progressPct: 72, status: "Ongoing",   startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-09-30"), source: "KSDL" },
        { districtId: did, talukId: tMys.id, name: "KSIC Silk Reeling Automation Project",               category: "Industry",        budget: 480000000,   fundsReleased: 336000000,  progressPct: 60, status: "Ongoing",   startDate: new Date("2022-10-01"), expectedEnd: new Date("2025-12-31"), source: "KSIC" },
        { districtId: did, talukId: tNan.id, name: "Mysore Sugar Factory Expansion & Co-gen Plant",       category: "Industry",        budget: 1200000000,  fundsReleased: 600000000,  progressPct: 38, status: "Ongoing",   startDate: new Date("2023-04-01"), expectedEnd: new Date("2026-03-31"), source: "Mysore Sugar Co" },
        { districtId: did, talukId: tMys.id, name: "Nanjangud Industrial Township Phase 2",               category: "Industry",        budget: 2400000000,  fundsReleased: 960000000,  progressPct: 30, status: "Ongoing",   startDate: new Date("2023-07-01"), expectedEnd: new Date("2027-06-30"), source: "KIADB" },
        // Environment
        { districtId: did, talukId: tMys.id, name: "Mysuru Lakes Development (14 lakes)",                 category: "Environment",     budget: 840000000,   fundsReleased: 588000000,  progressPct: 55, status: "Ongoing",   startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-12-31"), source: "MCC / Smart Cities" },
        { districtId: did, talukId: tMys.id, name: "Mysuru STP — 80 MLD Sewage Treatment Plant",          category: "Environment",     budget: 1200000000,  fundsReleased: 840000000,  progressPct: 72, status: "Ongoing",   startDate: new Date("2021-09-01"), expectedEnd: new Date("2025-09-30"), source: "MCC / AMRUT" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Industrial Area STP",                       category: "Environment",     budget: 480000000,   fundsReleased: 240000000,  progressPct: 40, status: "Ongoing",   startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-12-31"), source: "KSPCB / KIADB" },
        // Completed
        { districtId: did, talukId: tMys.id, name: "Mysuru–Bengaluru Elevated Expressway (Mysuru end)",   category: "Roads",           budget: 6200000000,  fundsReleased: 6200000000, progressPct: 100,status: "Completed", startDate: new Date("2018-01-01"), expectedEnd: new Date("2023-12-31"), source: "NHAI" },
        { districtId: did, talukId: tMys.id, name: "ICCC Mysuru (Integrated Command Centre)",             category: "Smart City",      budget: 380000000,   fundsReleased: 380000000,  progressPct: 100,status: "Completed", startDate: new Date("2021-01-01"), expectedEnd: new Date("2023-06-30"), source: "Smart Cities Mission" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Airport Runway Resurfacing",                   category: "Aviation",        budget: 120000000,   fundsReleased: 120000000,  progressPct: 100,status: "Completed", startDate: new Date("2022-01-01"), expectedEnd: new Date("2023-03-31"), source: "AAI" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Mysuru Silk Park Phase 1",                  category: "Industry",        budget: 280000000,   fundsReleased: 280000000,  progressPct: 100,status: "Completed", startDate: new Date("2021-06-01"), expectedEnd: new Date("2023-12-31"), source: "KSIC / MUDA" },
        // Proposed
        { districtId: did, talukId: tMys.id, name: "Mysuru Metro Phase 2 — City to Airport",              category: "Metro Rail",      budget: 18000000000, fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "DMRC" },
        { districtId: did, talukId: tHDK.id, name: "Kabini River Safari Bridge & Eco-Lodge Zone",         category: "Heritage",        budget: 480000000,   fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "Forest Dept / Tourism" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Convention Centre (5,000 pax)",                category: "Urban Dev",       budget: 2400000000,  fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "MUDA" },
        { districtId: did, talukId: tMys.id, name: "Mysuru Suburban Rail (Link to Bengaluru)",            category: "Railways",        budget: 12000000000, fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "Railway Ministry" },
        { districtId: did, talukId: tNan.id, name: "Nanjangud Pharma SEZ (Special Economic Zone)",        category: "Industry",        budget: 4800000000,  fundsReleased: 480000000,   progressPct: 5,  status: "Proposed",  source: "KIADB / Commerce Dept" },
        { districtId: did, talukId: tMys.id, name: "AIIMS Mysuru — All India Institute Medical Sciences",  category: "Healthcare",      budget: 16000000000, fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "MoHFW" },
        { districtId: did, talukId: tMys.id, name: "Multi-Modal Transit Hub — Mysuru Railway Station",    category: "Transport Hub",   budget: 2800000000,  fundsReleased: 0,           progressPct: 0,  status: "Proposed",  source: "RLDA / MUDA" },
      ]});
      console.log("  ✓ 55 infrastructure projects");
    }

    console.log("  ✅ Mysuru all data modules complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedMysuruData(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
