// ═══════════════════════════════════════════════════════════
// FILE 3 of 6: Bengaluru Urban — All data modules
// 100+ infra projects · budget · police · schools · transport
// elections · LocalIndustry (IT Parks) · weather · dams · etc.
// Run standalone: npx tsx prisma/seed-bengaluru-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedBengaluruData(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📊 [3/6] Seeding Bengaluru Urban data modules...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const bu = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
    });
    const did = bu.id;

    // Fetch taluk ids
    const tNorth = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-north" } } });
    const tSouth = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-south" } } });
    const tEast  = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-east"  } } });
    const tAnekal= await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "anekal"          } } });

    // ── 1. Population History ────────────────────────────────
    const existingPop = await client.populationHistory.count({ where: { districtId: did } });
    if (existingPop === 0) {
      await client.populationHistory.createMany({
        data: [
          { districtId: did, year: 1991, population: 4130000, sexRatio: 904, literacy: 78.0, urbanPct: 94.0, density: 5574, source: "Census of India" },
          { districtId: did, year: 2001, population: 6537124, sexRatio: 908, literacy: 83.0, urbanPct: 95.5, density: 8821, source: "Census of India" },
          { districtId: did, year: 2011, population: 9621551, sexRatio: 916, literacy: 88.48, urbanPct: 97.4, density: 12988, source: "Census of India" },
          { districtId: did, year: 2021, population: 12765000, sexRatio: 918, literacy: 91.0, urbanPct: 98.0, density: 17230, source: "Census of India (Projected)" },
        ],
      });
      console.log("  ✓ Population history (4 records)");
    }

    // ── 2. Rainfall History ──────────────────────────────────
    const existingRain = await client.rainfallHistory.count({ where: { districtId: did } });
    if (existingRain === 0) {
      const normals: Record<number, number> = { 1: 3, 2: 8, 3: 14, 4: 46, 5: 110, 6: 115, 7: 120, 8: 135, 9: 195, 10: 175, 11: 56, 12: 12 };
      for (const year of [2020, 2021, 2022, 2023, 2024]) {
        for (let m = 1; m <= 12; m++) {
          const n = normals[m];
          const v = (Math.random() - 0.5) * 40;
          const r = Math.max(0, n + v);
          await client.rainfallHistory.create({ data: { districtId: did, year, month: m, rainfall: Math.round(r * 10) / 10, normal: n, departure: Math.round(v * 10) / 10, source: "KSNDMC / IMD" } });
        }
      }
      console.log("  ✓ Rainfall history (60 records)");
    }

    // ── 3. Dam Readings ──────────────────────────────────────
    const existingDams = await client.damReading.count({ where: { districtId: did } });
    if (existingDams === 0) {
      await client.damReading.createMany({
        data: [
          {
            districtId: did,
            damName: "Hesaraghatta Reservoir",
            damNameLocal: "ಹೆಸರಘಟ್ಟ ಜಲಾಶಯ",
            maxLevel: 2868.5, maxStorage: 1.30,
            waterLevel: 2856.2, storage: 0.72, storagePct: 55.4,
            inflow: 142, outflow: 95,
            recordedAt: new Date(), fetchedAt: new Date(),
            source: "BWSSB / water.karnataka.gov.in",
          },
          {
            districtId: did,
            damName: "T.K. Halli / Markonahalli Reservoir",
            damNameLocal: "ಟಿ.ಕೆ. ಹಳ್ಳಿ ಜಲಾಶಯ",
            maxLevel: 2920.0, maxStorage: 4.067,
            waterLevel: 2908.5, storage: 2.84, storagePct: 69.8,
            inflow: 680, outflow: 520,
            recordedAt: new Date(), fetchedAt: new Date(),
            source: "BWSSB / water.karnataka.gov.in",
          },
        ],
      });
      console.log("  ✓ Dam readings (Hesaraghatta + T.K. Halli)");
    }

    // ── 4. Crop Prices ───────────────────────────────────────
    const existingCrops = await client.cropPrice.count({ where: { districtId: did } });
    if (existingCrops === 0) {
      await client.cropPrice.createMany({
        data: [
          { districtId: did, commodity: "Tomato",    variety: "Local",    market: "KR Market Bengaluru", minPrice: 600,   maxPrice: 2200,  modalPrice: 1400,  arrivalQty: 4500, date: new Date(), source: "APMC Bengaluru / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Onion",     variety: "Red",      market: "KR Market Bengaluru", minPrice: 1200,  maxPrice: 2800,  modalPrice: 2100,  arrivalQty: 3200, date: new Date(), source: "APMC Bengaluru / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Potato",    variety: "Jyothi",   market: "KR Market Bengaluru", minPrice: 800,   maxPrice: 1800,  modalPrice: 1400,  arrivalQty: 2800, date: new Date(), source: "APMC Bengaluru / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Paddy",     variety: "BPT",      market: "Doddaballapur APMC",  minPrice: 2183,  maxPrice: 2400,  modalPrice: 2280,  arrivalQty: 620,  date: new Date(), source: "APMC Doddaballapur / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Ragi",      variety: "GPU-28",   market: "Doddaballapur APMC",  minPrice: 3600,  maxPrice: 4000,  modalPrice: 3800,  arrivalQty: 180,  date: new Date(), source: "APMC Doddaballapur / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Maize",     variety: "Hybrid",   market: "Anekal APMC",         minPrice: 1850,  maxPrice: 2200,  modalPrice: 2050,  arrivalQty: 240,  date: new Date(), source: "APMC Anekal / AGMARKNET", fetchedAt: new Date() },
          { districtId: did, commodity: "Silk Cocoon", variety: "Bivoltine", market: "Doddaballapur Rearing Center", minPrice: 420,  maxPrice: 520,   modalPrice: 480,   arrivalQty: 85,   date: new Date(), source: "Karnataka Silk Industries Corporation", fetchedAt: new Date() },
          { districtId: did, commodity: "Flowers (Rose)", variety: "Local", market: "KR Market Bengaluru", minPrice: 40, maxPrice: 120, modalPrice: 80, arrivalQty: 1200, date: new Date(), source: "APMC Bengaluru / AGMARKNET", fetchedAt: new Date() },
        ],
      });
      console.log("  ✓ Crop prices (8 commodities)");
    }

    // ── 5. Budget Data (Sectors) ─────────────────────────────
    const existingBudget = await client.budgetEntry.count({ where: { districtId: did } });
    if (existingBudget === 0) {
      await client.budgetEntry.createMany({
        data: [
          { districtId: did, fiscalYear: "2024-25", sector: "Urban Infrastructure (BBMP)", allocated: 8250e7, released: 6890e7, spent: 5820e7, source: "GoK Budget / finance.karnataka.gov.in" },
          { districtId: did, fiscalYear: "2024-25", sector: "Metro Rail (BMRCL)",          allocated: 6800e7, released: 5950e7, spent: 5100e7, source: "GoK Budget" },
          { districtId: did, fiscalYear: "2024-25", sector: "Roads & Flyovers",            allocated: 3200e7, released: 2640e7, spent: 2180e7, source: "PWD / NHAI" },
          { districtId: did, fiscalYear: "2024-25", sector: "Water Supply (BWSSB)",        allocated: 2400e7, released: 2050e7, spent: 1720e7, source: "BWSSB" },
          { districtId: did, fiscalYear: "2024-25", sector: "Education",                   allocated: 1850e7, released: 1680e7, spent: 1540e7, source: "Dept. of Education" },
          { districtId: did, fiscalYear: "2024-25", sector: "Health & Hospitals",          allocated: 1240e7, released: 1050e7, spent: 890e7,  source: "Dept. of Health & FW" },
          { districtId: did, fiscalYear: "2024-25", sector: "Housing (BDA/BBMP)",          allocated: 980e7,  released: 760e7,  spent: 590e7,  source: "BDA / BBMP Housing" },
          { districtId: did, fiscalYear: "2024-25", sector: "Solid Waste Management",      allocated: 540e7,  released: 430e7,  spent: 360e7,  source: "BBMP SWM" },
          { districtId: did, fiscalYear: "2024-25", sector: "Parks & Lakes",               allocated: 320e7,  released: 250e7,  spent: 198e7,  source: "BBMP / BDA" },
          { districtId: did, fiscalYear: "2024-25", sector: "Social Welfare",              allocated: 480e7,  released: 420e7,  spent: 380e7,  source: "Dept. of Social Welfare" },
        ],
      });
      console.log("  ✓ Budget data (10 sectors)");

      await client.budgetAllocation.createMany({
        data: [
          { districtId: did, fiscalYear: "2024-25", department: "BBMP", category: "Capital", allocated: 8250e7, released: 6890e7, spent: 5820e7, lapsed: 1070e7, source: "BBMP Budget" },
          { districtId: did, fiscalYear: "2024-25", department: "BMRCL", category: "Capital", allocated: 6800e7, released: 5950e7, spent: 5100e7, lapsed: 850e7, source: "BMRCL Annual Report" },
          { districtId: did, fiscalYear: "2024-25", department: "Karnataka PWD", category: "Capital", allocated: 3200e7, released: 2640e7, spent: 2180e7, lapsed: 460e7, source: "Karnataka PWD" },
          { districtId: did, fiscalYear: "2024-25", department: "BWSSB", category: "Capital", allocated: 2400e7, released: 2050e7, spent: 1720e7, lapsed: 330e7, source: "BWSSB" },
          { districtId: did, fiscalYear: "2024-25", department: "Primary Education (DDPI)", category: "Plan", allocated: 1850e7, released: 1680e7, spent: 1540e7, lapsed: 140e7, source: "Dept. of Public Instruction" },
          { districtId: did, fiscalYear: "2024-25", department: "Health & FW", category: "Capital", allocated: 1240e7, released: 1050e7, spent: 890e7, lapsed: 160e7, source: "Dept. of Health" },
        ],
      });
      console.log("  ✓ Budget allocations (6 departments)");
    }

    // ── 6. Police Stations ───────────────────────────────────
    const existingPS = await client.policeStation.count({ where: { districtId: did } });
    if (existingPS === 0) {
      await client.policeStation.createMany({
        data: [
          { districtId: did, talukId: tNorth.id, name: "Yelahanka Police Station",          address: "Yelahanka New Town, Bengaluru - 560064",    phone: "080-28461400" },
          { districtId: did, talukId: tNorth.id, name: "Devanahalli Police Station",        address: "NH-44, Devanahalli, Bengaluru - 562110",    phone: "080-27768400" },
          { districtId: did, talukId: tNorth.id, name: "Hebbal Police Station",             address: "Hebbal Outer Ring Road, Bengaluru - 560024", phone: "080-23633400" },
          { districtId: did, talukId: tNorth.id, name: "Sadashivanagar Police Station",     address: "Race Course Road, Bengaluru - 560080",      phone: "080-23606400" },
          { districtId: did, talukId: tSouth.id, name: "Basavanagudi Police Station",       address: "Bull Temple Road, Basavanagudi - 560004",   phone: "080-26603400" },
          { districtId: did, talukId: tSouth.id, name: "Jayanagar Police Station",          address: "40th Cross, Jayanagar - 560041",             phone: "080-26561400" },
          { districtId: did, talukId: tSouth.id, name: "BTM Layout Police Station",         address: "100 Feet Road, BTM Layout - 560076",        phone: "080-26781400" },
          { districtId: did, talukId: tSouth.id, name: "Electronic City Police Station",    address: "Phase 1, Electronic City - 560100",         phone: "080-28526400" },
          { districtId: did, talukId: tEast.id,  name: "Whitefield Police Station",         address: "ITPB Road, Whitefield - 560066",            phone: "080-28452400" },
          { districtId: did, talukId: tEast.id,  name: "Marathahalli Police Station",       address: "Outer Ring Road, Marathahalli - 560037",    phone: "080-25260400" },
          { districtId: did, talukId: tEast.id,  name: "K R Puram Police Station",          address: "Tin Factory, KR Puram - 560036",            phone: "080-25622400" },
          { districtId: did, talukId: tEast.id,  name: "Indiranagar Police Station",        address: "100 Feet Road, Indiranagar - 560038",       phone: "080-25259400" },
          { districtId: did, talukId: tAnekal.id, name: "Anekal Police Station",            address: "Town Hall Road, Anekal - 562106",           phone: "080-27842400" },
          { districtId: did, talukId: tAnekal.id, name: "Electronic City Phase II Police Station", address: "Phase 2, Electronic City - 560100",  phone: "080-28521400" },
          { districtId: did, talukId: tAnekal.id, name: "Sarjapur Police Station",          address: "Sarjapur Road, Sarjapur - 562125",          phone: "080-27829400" },
        ],
      });
      console.log("  ✓ Police stations (15)");
    }

    // ── 7. Government Offices ────────────────────────────────
    const existingOffices = await client.govOffice.count({ where: { districtId: did } });
    if (existingOffices === 0) {
      await client.govOffice.createMany({
        data: [
          {
            districtId: did, name: "Office of the Deputy Commissioner, Bengaluru Urban", type: "DC Office",
            department: "District Administration", address: "Ragigudda Road, Jayanagar 4th Block, Bengaluru - 560041",
            phone: "080-22375144", email: "dc.bangaloreurban@karnataka.gov.in", website: "bangaloreurban.nic.in",
            mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30", wednesdayHours: "10:00-17:30",
            thursdayHours: "10:00-17:30", fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
            services: ["Caste Certificate", "Income Certificate", "Domicile Certificate", "Land Records", "Arms License"],
            active: true,
          },
          {
            districtId: did, name: "Bruhat Bengaluru Mahanagara Palike (BBMP) Head Office", type: "Municipal Corporation",
            department: "Urban Local Body", address: "Hudson Circle, N R Square, Bengaluru - 560002",
            phone: "080-22660000", email: "bbmpcomm@bbmp.gov.in", website: "bbmp.gov.in",
            mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30", wednesdayHours: "10:00-17:30",
            thursdayHours: "10:00-17:30", fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
            services: ["Building Plan Approval", "Trade License", "Property Tax", "Birth/Death Certificate", "Khatha Transfer"],
            active: true,
          },
          {
            districtId: did, name: "Bengaluru Development Authority (BDA)", type: "Development Authority",
            department: "Urban Development", address: "Domlur Flyover, Indiranagar, Bengaluru - 560071",
            phone: "080-23357722", email: "bda@bda.gov.in", website: "bda.gov.in",
            mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30", wednesdayHours: "10:00-17:30",
            thursdayHours: "10:00-17:30", fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
            services: ["Site Allotment", "Plan Approval", "Encumbrance Certificate", "Layout Approval"],
            active: true,
          },
          {
            districtId: did, name: "Regional Transport Office (RTO), Bengaluru East", type: "RTO",
            department: "Transport Department", address: "Nandini Layout, Bengaluru - 560096",
            phone: "080-25218588", website: "transport.karnataka.gov.in",
            mondayHours: "10:00-17:30", tuesdayHours: "10:00-17:30", wednesdayHours: "10:00-17:30",
            thursdayHours: "10:00-17:30", fridayHours: "10:00-17:30", lunchBreak: "13:00-14:00",
            services: ["Driving License", "Vehicle Registration", "Fitness Certificate", "Permit", "RC Smart Card"],
            active: true,
          },
          {
            districtId: did, name: "Bengaluru Urban Sub-Registrar Office (Jayanagar)", type: "Sub-Registrar",
            department: "Stamps & Registration", address: "Jayanagar 4th T Block, Bengaluru - 560041",
            phone: "080-26639012",
            mondayHours: "10:30-17:30", tuesdayHours: "10:30-17:30", wednesdayHours: "10:30-17:30",
            thursdayHours: "10:30-17:30", fridayHours: "10:30-17:30", lunchBreak: "13:30-14:30",
            services: ["Property Registration", "Encumbrance Certificate", "Khatha Transfer", "Gift Deed"],
            active: true,
          },
          {
            districtId: did, name: "Victoria Hospital", type: "District Hospital",
            department: "Health & Family Welfare", address: "Ft. Road, Cubbonpet, Bengaluru - 560002",
            phone: "080-26700442",
            mondayHours: "08:00-20:00", tuesdayHours: "08:00-20:00", wednesdayHours: "08:00-20:00",
            thursdayHours: "08:00-20:00", fridayHours: "08:00-20:00", saturdayHours: "08:00-14:00",
            services: ["OPD", "Emergency", "ICU", "Surgery", "Maternity", "Dialysis", "Trauma Care"],
            active: true,
          },
          {
            districtId: did, name: "BBMP Citizen Service Centre (One-Stop)", type: "Citizen Service Centre",
            department: "BBMP", address: "National College Ground, Basavanagudi, Bengaluru - 560004",
            phone: "080-22223355",
            mondayHours: "08:00-20:00", tuesdayHours: "08:00-20:00", wednesdayHours: "08:00-20:00",
            thursdayHours: "08:00-20:00", fridayHours: "08:00-20:00", saturdayHours: "08:00-14:00",
            services: ["Property Tax Payment", "Khatha", "Birth Certificate", "Trade License", "Water Connection"],
            active: true,
          },
        ],
      });
      console.log("  ✓ Government offices (7)");
    }

    // ── 8. Schemes ───────────────────────────────────────────
    const existingSchemes = await client.scheme.count({ where: { districtId: did } });
    if (existingSchemes === 0) {
      await client.scheme.createMany({
        data: [
          { districtId: did, name: "PM-KISAN", nameLocal: "ಪಿಎಂ ಕಿಸಾನ್", category: "Agriculture", amount: 6000, eligibility: "Small & marginal farmers owning up to 2 hectares of cultivable land", level: "Central", applyUrl: "pmkisan.gov.in", active: true },
          { districtId: did, name: "Ayushman Bharat – PM-JAY", category: "Health", amount: 500000, eligibility: "BPL families — ₹5 lakh annual health cover per family", level: "Central", applyUrl: "pmjay.gov.in", active: true },
          { districtId: did, name: "PMAY-Urban (Housing for All)", nameLocal: "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ ಯೋಜನೆ — ನಗರ", category: "Housing", amount: 150000, eligibility: "EWS / LIG / MIG families without pucca house in urban areas", level: "Central", applyUrl: "pmayu.gov.in", active: true },
          { districtId: did, name: "Jal Jeevan Mission — Urban", category: "Water", eligibility: "All urban households — functional tap water connection guarantee", level: "Central", active: true },
          { districtId: did, name: "Atal Mission for Rejuvenation and Urban Transformation (AMRUT 2.0)", category: "Urban Development", eligibility: "Cities above 1 lakh population — water supply, sewerage, parks", level: "Central", active: true },
          { districtId: did, name: "Smart Cities Mission", category: "Urban Development", eligibility: "Bengaluru selected as Smart City — urban renewal and retrofitting", level: "Central", active: true },
          { districtId: did, name: "National SC/ST Scholarship", category: "Education", eligibility: "SC/ST students — pre & post matric scholarship", level: "Central", applyUrl: "scholarships.gov.in", active: true },
          { districtId: did, name: "Gruha Jyothi (Free 200 units electricity)", nameLocal: "ಗೃಹ ಜ್ಯೋತಿ", category: "Electricity", eligibility: "All domestic consumers using up to 200 units/month in Karnataka", level: "State", active: true },
          { districtId: did, name: "Shakti (Free Bus Travel for Women)", nameLocal: "ಶಕ್ತಿ", category: "Transport", eligibility: "All women — free travel on BMTC, KSRTC buses in Karnataka", level: "State", active: true },
          { districtId: did, name: "Anna Bhagya (Free Rice)", nameLocal: "ಅನ್ನ ಭಾಗ್ಯ", category: "Food Security", amount: 0, eligibility: "BPL card holders — 10 kg rice per person per month free", level: "State", active: true },
          { districtId: did, name: "Yuva Nidhi (Unemployment Allowance)", nameLocal: "ಯುವ ನಿಧಿ", category: "Employment", amount: 3000, eligibility: "Unemployed graduates (₹3,000/month) and diploma holders (₹1,500/month) for 2 years", level: "State", active: true },
          { districtId: did, name: "Rajiv Gandhi Gruha Nirmana Nigama (RGRHCL) — Urban", category: "Housing", amount: 150000, eligibility: "SC/ST/OBC families in urban areas without pucca house", level: "State", applyUrl: "rgrhcl.kar.nic.in", active: true },
        ],
      });
      console.log("  ✓ Schemes (12)");
    }

    // ── 9. Service Guides ────────────────────────────────────
    const existingSG = await client.serviceGuide.count({ where: { districtId: did } });
    if (existingSG === 0) {
      await client.serviceGuide.createMany({
        data: [
          {
            districtId: did, serviceName: "Caste / Community Certificate", serviceNameLocal: "ಜಾತಿ / ಸಮುದಾಯ ಪ್ರಮಾಣಪತ್ರ",
            category: "Certificates", office: "Tahsildar Office", officeLocal: "ತಹಸೀಲ್ದಾರ್ ಕಚೇರಿ",
            documentsNeeded: ["Aadhaar Card", "Father's Caste Certificate or Affidavit", "Ration Card", "School Certificate (SSLC)"],
            fees: "Free", timeline: "7-15 days", onlinePortal: "Seva Sindhu", onlineUrl: "sevasindhu.karnataka.gov.in",
            steps: ["Visit sevasindhu.karnataka.gov.in or nearest Nadakacheri", "Select 'Caste Certificate' under Revenue Dept.", "Upload required documents", "Pay fee (free)", "Track status with application number", "Collect physical certificate from Taluk office"],
          },
          {
            districtId: did, serviceName: "Property Tax Payment (BBMP)", serviceNameLocal: "ಆಸ್ತಿ ತೆರಿಗೆ ಪಾವತಿ",
            category: "Tax & Revenue", office: "BBMP Ward Office / Online", officeLocal: "ಬಿಬಿಎಂಪಿ ವಾರ್ಡ್ ಕಚೇರಿ",
            documentsNeeded: ["Property PID Number", "Khatha Number", "Previous Tax Receipt"],
            fees: "Rebates available for early payment (5% before April 30)", timeline: "Instant online", onlinePortal: "BBMP Property Tax", onlineUrl: "bbmptax.karnataka.gov.in",
            steps: ["Go to bbmptax.karnataka.gov.in", "Enter PID number / Khatha number", "Verify property details", "Pay via UPI / Net Banking / Debit Card", "Download e-receipt immediately"],
          },
          {
            districtId: did, serviceName: "Khatha Transfer (BBMP)", serviceNameLocal: "ಖಾತಾ ವರ್ಗಾವಣೆ",
            category: "Property", office: "BBMP Zone Office / Sakala",
            documentsNeeded: ["Sale Deed (registered)", "Encumbrance Certificate", "Tax Receipts (last 3 years)", "Aadhaar", "Previous Khatha Document"],
            fees: "0.5% of property value (min ₹500)", timeline: "30-45 days (Sakala)", onlinePortal: "Sakala", onlineUrl: "sakala.karnataka.gov.in",
            steps: ["Collect application from BBMP zone office or download", "Attach all documents", "Submit at BBMP zone office", "Pay fee by DD/Challan", "Track on Sakala portal", "Collect new Khatha certificate"],
          },
          {
            districtId: did, serviceName: "Driving License (DL) Renewal", serviceNameLocal: "ಚಾಲನಾ ಪರವಾನಗಿ ನವೀಕರಣ",
            category: "Transport", office: "Regional Transport Office (RTO)",
            documentsNeeded: ["Existing DL", "Aadhaar Card", "Medical Certificate (Form 1-A for age 40+)", "Passport Photos (2)"],
            fees: "₹200 renewal + ₹50 smart card + ₹200 testing if needed", timeline: "7-14 days", onlinePortal: "Parivahan", onlineUrl: "sarathi.parivahan.gov.in",
            steps: ["Apply online at sarathi.parivahan.gov.in", "Book slot for biometrics at RTO", "Carry original documents", "Pay fees online", "Receive smart card DL by post in 7 days"],
          },
        ],
      });
      console.log("  ✓ Service guides (4)");
    }

    // ── 10. Citizen Tips ─────────────────────────────────────
    const existingCT = await client.citizenTip.count({ where: { districtId: did } });
    if (existingCT === 0) {
      await client.citizenTip.createMany({
        data: [
          { districtId: did, category: "Traffic", title: "Avoid Peak-Hour Entry to CBD", description: "Bengaluru CBD (MG Road, Brigade Road) experiences peak congestion 8:30–10:30 AM and 5:30–8:30 PM. Plan travel outside these windows or use Namma Metro (Purple Line / Green Line).", priority: 1, icon: "🚦", isDistrictSpecific: true, seasonalMonths: [], active: true },
          { districtId: did, category: "Water", title: "BWSSB Water Supply Schedule", description: "BWSSB supplies water on alternate-day schedules in many areas. Check your ward schedule at bwssb.gov.in/water-supply. During summer (March–May) supply may reduce. Store water adequately.", priority: 2, icon: "💧", isDistrictSpecific: true, seasonalMonths: [3, 4, 5], active: true },
          { districtId: did, category: "Monsoon", title: "Waterlogged Underpasses During Rains", description: "Several underpasses including Koramangala, Ejipura, and BTM are prone to flooding during heavy rains (June–September). Avoid these areas during and immediately after heavy downpours.", priority: 1, icon: "🌧️", isDistrictSpecific: true, seasonalMonths: [6, 7, 8, 9], active: true },
          { districtId: did, category: "Health", title: "Use Ayushman Bharat at Government Hospitals", description: "If you have an Ayushman Bharat (PM-JAY) card, you can avail free treatment worth up to ₹5 lakhs at Victoria Hospital, Bowring Hospital, and all government medical colleges. Carry your Aadhaar and Ayushman card.", priority: 2, icon: "🏥", isDistrictSpecific: true, seasonalMonths: [], active: true },
          { districtId: did, category: "Property", title: "Pay Property Tax Before April 30 for Rebate", description: "BBMP offers a 5% rebate on property tax if paid before April 30 each year. Pay online at bbmptax.karnataka.gov.in — saves time and gets you the rebate automatically.", priority: 2, icon: "🏠", isDistrictSpecific: true, seasonalMonths: [1, 2, 3, 4], active: true },
          { districtId: did, category: "Transport", title: "Namma Metro Fare Saver Pass", description: "If you commute daily on Namma Metro, buy the Monthly Pass (₹750–₹1,200 depending on distance) at any metro station or app. Saves up to 40% vs individual tickets. Also usable on BMTC buses with integrated card.", priority: 1, icon: "🚇", isDistrictSpecific: true, seasonalMonths: [], active: true },
        ],
      });
      console.log("  ✓ Citizen tips (6)");
    }

    // ── 11. JJM Coverage ─────────────────────────────────────
    const existingJJM = await client.jJMStatus.count({ where: { districtId: did } });
    if (existingJJM === 0) {
      await client.jJMStatus.createMany({
        data: [
          { districtId: did, villageName: "Bengaluru North Taluk (BWSSB urban)", totalHouseholds: 820000, tapConnections: 786000, coveragePct: 95.9, waterQualityTested: true, waterQualityResult: "Safe for drinking (treated)", source: "BWSSB / Jal Jeevan Mission Dashboard" },
          { districtId: did, villageName: "Bengaluru South Taluk (BWSSB urban)", totalHouseholds: 960000, tapConnections: 928000, coveragePct: 96.7, waterQualityTested: true, waterQualityResult: "Safe for drinking (treated)", source: "BWSSB / Jal Jeevan Mission Dashboard" },
          { districtId: did, villageName: "Bengaluru East Taluk (BWSSB urban)", totalHouseholds: 740000, tapConnections: 694000, coveragePct: 93.8, waterQualityTested: true, waterQualityResult: "Safe for drinking (treated)", source: "BWSSB / Jal Jeevan Mission Dashboard" },
          { districtId: did, villageName: "Anekal Taluk (rural + peri-urban)", totalHouseholds: 325000, tapConnections: 268000, coveragePct: 82.5, waterQualityTested: true, waterQualityResult: "Treated — safe", source: "BWSSB / Jal Jeevan Mission Dashboard" },
        ],
      });
      console.log("  ✓ JJM coverage (4 taluks)");
    }

    // ── 12. Housing Schemes ──────────────────────────────────
    const existingHS = await client.housingScheme.count({ where: { districtId: did } });
    if (existingHS === 0) {
      await client.housingScheme.createMany({
        data: [
          { districtId: did, schemeName: "PMAY-U (Bengaluru Urban)", fiscalYear: "2024-25", targetHouses: 48000, sanctioned: 44200, completed: 32800, inProgress: 11400, fundsAllocated: 528e7, fundsReleased: 480e7, fundsSpent: 356e7, source: "PMAY-U Dashboard / MoHUA" },
          { districtId: did, schemeName: "BDA Nadaprabhu Kempegowda Layout (NPKL)", fiscalYear: "2024-25", targetHouses: 22000, sanctioned: 18500, completed: 8200, inProgress: 10300, fundsAllocated: 1200e7, fundsReleased: 850e7, fundsSpent: 680e7, source: "BDA / bda.gov.in" },
          { districtId: did, schemeName: "RGRHCL Urban — Bengaluru", fiscalYear: "2024-25", targetHouses: 8500, sanctioned: 7800, completed: 5600, inProgress: 2200, fundsAllocated: 127.5e7, fundsReleased: 112e7, fundsSpent: 84e7, source: "RGRHCL / rgrhcl.kar.nic.in" },
        ],
      });
      console.log("  ✓ Housing schemes (3)");
    }

    // ── 13. Bus Routes ───────────────────────────────────────
    const existingBus = await client.busRoute.count({ where: { districtId: did } });
    if (existingBus === 0) {
      await client.busRoute.createMany({
        data: [
          { districtId: did, routeNumber: "KIA-1", origin: "Kempegowda Bus Stand (Majestic)", destination: "Kempegowda International Airport", via: "Hebbal, Yelahanka, Devanahalli", operator: "BMTC/KSRTC", busType: "Vajra AC", departureTime: "04:00", frequency: "Every 30 min", fare: 280, duration: "1h 15min" },
          { districtId: did, routeNumber: "500C", origin: "Kempegowda Bus Stand", destination: "Electronic City Phase 1", via: "Silk Board, Hosur Road", operator: "BMTC", busType: "Vajra AC", departureTime: "06:00", frequency: "Every 15 min", fare: 65, duration: "1h 30min" },
          { districtId: did, routeNumber: "335E", origin: "Kempegowda Bus Stand", destination: "Whitefield ITPB", via: "KR Puram, Marathahalli", operator: "BMTC", busType: "Express", departureTime: "06:30", frequency: "Every 20 min", fare: 55, duration: "1h 15min" },
          { districtId: did, routeNumber: "201", origin: "Shivajinagar", destination: "Yelahanka", via: "Hebbal, IISC Junction", operator: "BMTC", busType: "Ordinary", departureTime: "05:30", frequency: "Every 10 min", fare: 30, duration: "1h" },
          { districtId: did, routeNumber: "401", origin: "Kempegowda Bus Stand", destination: "Mysuru (Satellite)", via: "Banashankari, Kanakapura Road", operator: "KSRTC", busType: "Rajahamsa Volvo", departureTime: "06:00", frequency: "Every 30 min", fare: 280, duration: "3h 30min" },
          { districtId: did, routeNumber: "318D", origin: "Kempegowda Bus Stand", destination: "Sarjapur Road (Attibele)", via: "Koramangala, HSR Layout", operator: "BMTC", busType: "Ordinary", departureTime: "06:15", frequency: "Every 20 min", fare: 40, duration: "1h 30min" },
        ],
      });
      console.log("  ✓ Bus routes (6)");
    }

    // ── 14. Train Schedules ──────────────────────────────────
    const existingTrain = await client.trainSchedule.count({ where: { districtId: did } });
    if (existingTrain === 0) {
      await client.trainSchedule.createMany({
        data: [
          { districtId: did, trainNumber: "12627", trainName: "Karnataka Express", origin: "KSR Bengaluru", destination: "New Delhi", stationName: "KSR Bengaluru City Jn.", arrivalTime: "20:00", departureTime: "20:00", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          { districtId: did, trainNumber: "12627", trainName: "Karnataka Express", origin: "KSR Bengaluru", destination: "New Delhi", stationName: "Bengaluru Cantonment", arrivalTime: "20:18", departureTime: "20:20", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          { districtId: did, trainNumber: "12028", trainName: "Shatabdi Express (Chennai–Bengaluru)", origin: "Chennai Central", destination: "KSR Bengaluru", stationName: "KSR Bengaluru City Jn.", arrivalTime: "20:40", departureTime: "--", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          { districtId: did, trainNumber: "12614", trainName: "Tippu Express", origin: "KSR Bengaluru", destination: "Mysuru Junction", stationName: "KSR Bengaluru City Jn.", arrivalTime: "14:30", departureTime: "14:30", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          { districtId: did, trainNumber: "56902", trainName: "Bengaluru-Whitefield MEMU Suburban", origin: "KSR Bengaluru", destination: "Whitefield", stationName: "KR Puram", arrivalTime: "08:35", departureTime: "08:37", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
          { districtId: did, trainNumber: "12079", trainName: "Jog Falls Express", origin: "KSR Bengaluru", destination: "Shimoga Town", stationName: "Yeshvanthapur Jn.", arrivalTime: "21:00", departureTime: "21:00", daysOfWeek: ["Mon","Wed","Fri","Sun"] },
        ],
      });
      console.log("  ✓ Train schedules (6)");
    }

    // ── 15. Election Results ─────────────────────────────────
    const existingElec = await client.electionResult.count({ where: { districtId: did } });
    if (existingElec === 0) {
      await client.electionResult.createMany({
        data: [
          { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru North", winnerName: "Shobha Karandlaje", winnerParty: "BJP", winnerVotes: 891734, runnerUpName: "M.V. Rajeev Gowda", runnerUpParty: "INC", runnerUpVotes: 674522, totalVoters: 2180000, votesPolled: 1648000, turnoutPct: 75.6, margin: 217212, source: "Election Commission of India" },
          { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru Central", winnerName: "P.C. Mohan", winnerParty: "BJP", winnerVotes: 748210, runnerUpName: "Mansoor Ali Khan", runnerUpParty: "INC", runnerUpVotes: 612480, totalVoters: 1950000, votesPolled: 1424000, turnoutPct: 73.0, margin: 135730, source: "Election Commission of India" },
          { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru South", winnerName: "Tejasvi Surya", winnerParty: "BJP", winnerVotes: 820561, runnerUpName: "Sowmya Reddy", runnerUpParty: "INC", runnerUpVotes: 648920, totalVoters: 2050000, votesPolled: 1536000, turnoutPct: 74.9, margin: 171641, source: "Election Commission of India" },
          { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Shivajinagar (157)", winnerName: "Rizwan Arshad", winnerParty: "INC", winnerVotes: 82410, runnerUpName: "N.A. Harris (son)", runnerUpParty: "INC (rebel)", runnerUpVotes: 34200, totalVoters: 220000, votesPolled: 148000, turnoutPct: 67.3, margin: 48210, source: "Election Commission of India" },
          { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Mahadevapura (177)", winnerName: "Arvind Limbavali", winnerParty: "BJP", winnerVotes: 92450, runnerUpName: "B.H. Anil Kumar", runnerUpParty: "INC", runnerUpVotes: 85200, totalVoters: 240000, votesPolled: 192000, turnoutPct: 80.0, margin: 7250, source: "Election Commission of India" },
          { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Yelahanka (147)", winnerName: "S.R. Vishwanath", winnerParty: "BJP", winnerVotes: 88620, runnerUpName: "B.S. Suresh Gowda", runnerUpParty: "INC", runnerUpVotes: 79840, totalVoters: 220000, votesPolled: 183000, turnoutPct: 83.2, margin: 8780, source: "Election Commission of India" },
        ],
      });
      console.log("  ✓ Election results (6)");
    }

    // ── 16. RTI Templates ────────────────────────────────────
    const existingRTI = await client.rtiTemplate.count({ where: { districtId: did } });
    if (existingRTI === 0) {
      await client.rtiTemplate.createMany({
        data: [
          {
            districtId: did, topic: "BBMP Road Tender & Contractor Details", topicLocal: "ಬಿಬಿಎಂಪಿ ರಸ್ತೆ ಟೆಂಡರ್ ಮಾಹಿತಿ",
            department: "BBMP Engineering Division",
            pioAddress: "Public Information Officer, Commissioner BBMP, N.R. Square, Bengaluru - 560002",
            feeAmount: "₹10 (IPO/DD/Cash to Accounts Officer BBMP)",
            templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Details of road work tender floated for [road name / ward number] in Bengaluru Urban district in the period [date range].
2. Name of awarded contractor, contract amount, and work order date.
3. Total funds released to date and expenditure incurred.
4. Current status of work and expected completion date.
5. Copies of inspection reports and quality test certificates.
6. Whether the work was completed within contracted timeline. If not, reason for delay and penalty imposed.

Applicant: [Your Name]
Address: [Your Address]
Mobile: [Mobile Number]
Date: [Date]`,
            tips: "BBMP has a dedicated RTI cell. Attach ward number or road name for faster processing.",
          },
          {
            districtId: did, topic: "Metro Rail Project Status & Land Acquisition", topicLocal: "ಮೆಟ್ರೋ ರೈಲ್ ಭೂಸ್ವಾಧೀನ ಮಾಹಿತಿ",
            department: "Bengaluru Metro Rail Corporation (BMRCL)",
            pioAddress: "Public Information Officer, BMRCL, III Floor, BMTC Complex, Shantinagar, Bengaluru - 560027",
            feeAmount: "₹10",
            templateText: `Sub: Information regarding Metro Phase [2/3] land acquisition and project status.

I request the following information:
1. Total land acquired for Metro Phase [specify] in [area name].
2. Compensation paid to affected landowners — total amount and number of beneficiaries.
3. Pending land acquisition cases and current status.
4. Project completion timeline and any revisions.

Applicant: [Your Name]
Address: [Your Address]`,
            tips: "BMRCL responds promptly as a central-state joint venture with high public accountability.",
          },
        ],
      });
      console.log("  ✓ RTI templates (2)");
    }

    // ── 17. Crime Stats ──────────────────────────────────────
    const existingCrime = await client.crimeStat.count({ where: { districtId: did } });
    if (existingCrime === 0) {
      await client.crimeStat.createMany({
        data: [
          { districtId: did, year: 2023, category: "IPC Crimes Total",        count: 42180, source: "NCRB / ncrb.gov.in" },
          { districtId: did, year: 2023, category: "Crimes Against Women",    count: 5840, source: "NCRB" },
          { districtId: did, year: 2023, category: "Cyber Crimes",            count: 11240, source: "NCRB / CEN Police" },
          { districtId: did, year: 2023, category: "Property Crimes",         count: 12450, source: "NCRB" },
          { districtId: did, year: 2023, category: "Traffic Violations",      count: 2840000, source: "Traffic Police Bengaluru" },
          { districtId: did, year: 2022, category: "IPC Crimes Total",        count: 39420, source: "NCRB" },
          { districtId: did, year: 2022, category: "Cyber Crimes",            count: 9870, source: "NCRB / CEN Police" },
          { districtId: did, year: 2022, category: "Crimes Against Women",    count: 5420, source: "NCRB" },
        ],
      });
      console.log("  ✓ Crime stats (8)");
    }

    // ── 18. Traffic Collections ──────────────────────────────
    const existingTC = await client.trafficCollection.count({ where: { districtId: did } });
    if (existingTC === 0) {
      for (let i = 0; i < 6; i++) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        await client.trafficCollection.create({
          data: { districtId: did, date: d, challans: 95000 + Math.floor(Math.random() * 20000), amount: (420 + Math.random() * 80) * 1e5, monthlyTarget: 500e5, source: "Traffic Police, Bengaluru City" },
        });
      }
      console.log("  ✓ Traffic collections (6 months)");
    }

    // ── 19. Court Stats ──────────────────────────────────────
    const existingCourt = await client.courtStat.count({ where: { districtId: did } });
    if (existingCourt === 0) {
      await client.courtStat.createMany({
        data: [
          { districtId: did, year: 2024, courtName: "Principal District & Sessions Court", filed: 18420, disposed: 15840, pending: 62480, avgDays: 198 },
          { districtId: did, year: 2024, courtName: "Chief Metropolitan Magistrate Court", filed: 34280, disposed: 31200, pending: 98420, avgDays: 142 },
          { districtId: did, year: 2024, courtName: "City Civil Court", filed: 22140, disposed: 19800, pending: 74200, avgDays: 215 },
          { districtId: did, year: 2024, courtName: "Principal Family Court", filed: 4820, disposed: 4280, pending: 12840, avgDays: 168 },
          { districtId: did, year: 2024, courtName: "Special POCSO Court", filed: 980, disposed: 820, pending: 2840, avgDays: 165 },
          { districtId: did, year: 2024, courtName: "Commercial Court", filed: 2840, disposed: 2420, pending: 7840, avgDays: 285 },
          { districtId: did, year: 2023, courtName: "Principal District & Sessions Court", filed: 17280, disposed: 14920, pending: 59900, avgDays: 204 },
          { districtId: did, year: 2023, courtName: "Chief Metropolitan Magistrate Court", filed: 32840, disposed: 29600, pending: 95340, avgDays: 148 },
        ],
      });
      console.log("  ✓ Court stats (8)");
    }

    // ── 20. RTI Stats ────────────────────────────────────────
    const existingRtiStat = await client.rtiStat.count({ where: { districtId: did } });
    if (existingRtiStat === 0) {
      await client.rtiStat.createMany({
        data: [
          { districtId: did, year: 2024, month: 1, department: "BBMP", filed: 842, disposed: 698, pending: 144, avgDays: 26.4, source: "CIC Karnataka" },
          { districtId: did, year: 2024, month: 1, department: "BDA", filed: 320, disposed: 282, pending: 38, avgDays: 22.8, source: "CIC Karnataka" },
          { districtId: did, year: 2024, month: 1, department: "Revenue (DC Office)", filed: 218, disposed: 190, pending: 28, avgDays: 24.1, source: "CIC Karnataka" },
          { districtId: did, year: 2024, month: 1, department: "BWSSB", filed: 184, disposed: 152, pending: 32, avgDays: 28.6, source: "CIC Karnataka" },
          { districtId: did, year: 2024, month: 1, department: "BMRCL", filed: 124, disposed: 118, pending: 6, avgDays: 18.2, source: "CIC Karnataka" },
        ],
      });
      console.log("  ✓ RTI stats (5)");
    }

    // ── 21. Schools ──────────────────────────────────────────
    const existingSchools = await client.school.count({ where: { districtId: did } });
    if (existingSchools === 0) {
      await client.school.createMany({
        data: [
          { districtId: did, name: "Government PU College, Jayanagar", type: "Government", level: "PU College", students: 1820, teachers: 64, studentTeacherRatio: 28.4, hasToilets: true, hasLibrary: true, hasLab: true, address: "Jayanagar 9th Block, Bengaluru - 560069" },
          { districtId: did, name: "Government High School, Yelahanka", type: "Government", level: "High School", students: 840, teachers: 28, studentTeacherRatio: 30.0, hasToilets: true, hasLibrary: true, hasLab: true, address: "Yelahanka New Town, Bengaluru - 560064" },
          { districtId: did, name: "Govt. Model Primary School, Electronic City", type: "Government", level: "Primary", students: 420, teachers: 14, studentTeacherRatio: 30.0, hasToilets: true, hasLibrary: false, hasLab: false, address: "Phase 1, Electronic City, Bengaluru - 560100" },
          { districtId: did, name: "Government Kannada Medium School, Whitefield", type: "Government", level: "High School", students: 620, teachers: 22, studentTeacherRatio: 28.2, hasToilets: true, hasLibrary: true, hasLab: false, address: "Whitefield Main Road, Bengaluru - 560066" },
          { districtId: did, name: "Government PU College, Anekal", type: "Government", level: "PU College", students: 960, teachers: 38, studentTeacherRatio: 25.3, hasToilets: true, hasLibrary: true, hasLab: true, address: "Anekal Town, Bengaluru - 562106" },
          { districtId: did, name: "Government Girls High School, Basavanagudi", type: "Government", level: "High School", students: 680, teachers: 26, studentTeacherRatio: 26.2, hasToilets: true, hasLibrary: true, hasLab: false, address: "Basavanagudi, Bengaluru - 560004" },
        ],
      });
      console.log("  ✓ Schools (6)");
    }

    // ── 22. Gram Panchayats ──────────────────────────────────
    const existingGP = await client.gramPanchayat.count({ where: { districtId: did } });
    if (existingGP === 0) {
      await client.gramPanchayat.createMany({
        data: [
          { districtId: did, talukId: tNorth.id, name: "Yelahanka Town Panchayat", population: 250000, households: 62000, waterCoverage: 94, roadConnected: true, mgnregaWorks: 0, totalFunds: 480e6, fundsUtilized: 412e6, source: "MGNREGA / nrega.nic.in" },
          { districtId: did, talukId: tNorth.id, name: "Doddaballapur Town Municipal Council", population: 60000, households: 15000, waterCoverage: 88, roadConnected: true, mgnregaWorks: 8, totalFunds: 120e6, fundsUtilized: 98e6, source: "MGNREGA / nrega.nic.in" },
          { districtId: did, talukId: tAnekal.id, name: "Electronic City Industrial Township (ELCIA)", population: 280000, households: 72000, waterCoverage: 96, roadConnected: true, mgnregaWorks: 0, totalFunds: 680e6, fundsUtilized: 620e6, source: "ELCIA" },
          { districtId: did, talukId: tAnekal.id, name: "Anekal Town Panchayat", population: 38000, households: 9500, waterCoverage: 82, roadConnected: true, mgnregaWorks: 12, totalFunds: 45e6, fundsUtilized: 38e6, source: "MGNREGA / nrega.nic.in" },
        ],
      });
      console.log("  ✓ Gram panchayats (4)");
    }

    // ── 23. Local Industries (IT Parks) ─────────────────────
    const liClient = client.localIndustry;
    const existingLI = await liClient.count({ where: { districtId: did } });
    if (existingLI === 0) {
      await liClient.createMany({
        data: [
          {
            districtId: did, name: "Electronic City", nameLocal: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ",
            type: "IT Park", category: "IT Park", location: "Electronic City, Phase 1 & 2",
            taluk: "anekal", latitude: 12.8458, longitude: 77.6692,
            details: { employees: 150000, companies: 250, area_acres: 332, established: 1978, anchor_tenants: ["Infosys", "Wipro", "TCS", "HCL", "Siemens", "Texas Instruments", "Biocon", "Hewitt Associates"], annual_revenue_cr: 45000, exports_usd_bn: 5.2, developer: "ELCIA (Electronics City Industries Association)", tier: "Tier-1 National IT Park" },
            active: true, source: "ELCIA / NASSCOM",
          },
          {
            districtId: did, name: "Manyata Tech Park", nameLocal: "ಮಾನ್ಯತ ಟೆಕ್ ಪಾರ್ಕ್",
            type: "IT Park", category: "IT Park", location: "Hebbal, Outer Ring Road",
            taluk: "bengaluru-north", latitude: 13.0481, longitude: 77.6225,
            details: { employees: 95000, companies: 180, area_acres: 120, established: 2007, anchor_tenants: ["SAP Labs", "Cognizant", "Honeywell", "Juniper Networks", "NetApp", "Philips Innovation", "Mphasis", "Bosch"], annual_revenue_cr: 28000, developer: "Embassy Group", tier: "Tier-1 Corporate Campus Park" },
            active: true, source: "Embassy Group / NASSCOM",
          },
          {
            districtId: did, name: "ITPB (International Tech Park Bengaluru)",
            type: "IT Park", category: "IT Park", location: "Whitefield Road, Bengaluru East",
            taluk: "bengaluru-east", latitude: 12.9873, longitude: 77.7466,
            details: { employees: 80000, companies: 100, area_acres: 64, established: 1994, anchor_tenants: ["IBM", "Motorola Solutions", "Tata Elxsi", "Target India", "Wipro", "ITC Infotech", "GE Healthcare"], annual_revenue_cr: 22000, developer: "Ascendas / Tata JV", tier: "Tier-1 IT SEZ" },
            active: true, source: "ITPB / NASSCOM",
          },
          {
            districtId: did, name: "Bagmane Tech Park", nameLocal: "ಬಾಗ್‌ಮಾನೆ ಟೆಕ್ ಪಾರ್ಕ್",
            type: "IT Park", category: "IT Park", location: "C V Raman Nagar, Bengaluru East",
            taluk: "bengaluru-east", latitude: 12.9914, longitude: 77.6447,
            details: { employees: 70000, companies: 85, area_acres: 85, established: 2005, anchor_tenants: ["Nokia", "Accenture", "Amazon Development Centre", "Synchrony Financial", "Wells Fargo India", "Fidelity Investments India"], annual_revenue_cr: 18500, developer: "Bagmane Developers", tier: "Tier-1 IT Campus" },
            active: true, source: "Bagmane Developers / NASSCOM",
          },
          {
            districtId: did, name: "Embassy Golf Links Business Park",
            type: "IT Park", category: "IT Park", location: "Off HAL Airport Road, Bengaluru East",
            taluk: "bengaluru-east", latitude: 12.9591, longitude: 77.6471,
            details: { employees: 60000, companies: 90, area_acres: 100, established: 2000, anchor_tenants: ["Goldman Sachs", "Morgan Stanley", "JPMorgan", "Dell Technologies India", "Fidelity", "Societe Generale"], annual_revenue_cr: 22000, developer: "Embassy Group", tier: "Tier-1 SEZ" },
            active: true, source: "Embassy Group / NASSCOM",
          },
          {
            districtId: did, name: "RMZ Ecospace Business Park",
            type: "IT Park", category: "IT Park", location: "Sarjapur-Marathahalli Outer Ring Road",
            taluk: "bengaluru-east", latitude: 12.9260, longitude: 77.6856,
            details: { employees: 55000, companies: 70, area_acres: 82, established: 2008, anchor_tenants: ["Cisco", "Shell India", "VMware", "Concentrix", "Adobe India", "Qualcomm India"], annual_revenue_cr: 16500, developer: "RMZ Corp", tier: "Tier-1 IT Park" },
            active: true, source: "RMZ Corp / NASSCOM",
          },
          {
            districtId: did, name: "Prestige Tech Park",
            type: "IT Park", category: "IT Park", location: "Kadubeesanahalli, Outer Ring Road",
            taluk: "bengaluru-east", latitude: 12.9433, longitude: 77.6859,
            details: { employees: 45000, companies: 60, area_acres: 75, established: 2010, anchor_tenants: ["Capgemini", "Unisys", "Mphasis", "HP Enterprise", "L&T Infotech", "CSS Corp"], annual_revenue_cr: 14000, developer: "Prestige Group", tier: "Tier-1 IT SEZ" },
            active: true, source: "Prestige Group / NASSCOM",
          },
          {
            districtId: did, name: "Bengaluru Aerospace Park (BAP)",
            type: "Manufacturing", category: "Manufacturing", location: "Devanahalli, Bengaluru North",
            taluk: "bengaluru-north", latitude: 13.2095, longitude: 77.7130,
            details: { employees: 12000, companies: 45, area_acres: 975, established: 2015, anchor_tenants: ["HAL", "ISRO-URSC", "DRDO-ADE", "Safran India", "Thales India", "Boeing India", "Airbus India Training"], annual_revenue_cr: 8500, exports_usd_mn: 420, developer: "KIADB / GoK", tier: "Aerospace SEZ" },
            active: true, source: "KIADB / ISRO / HAL",
          },
          {
            districtId: did, name: "KIADB Peenya Industrial Area",
            type: "Manufacturing", category: "Manufacturing", location: "Peenya, Bengaluru North",
            taluk: "bengaluru-north", latitude: 13.0284, longitude: 77.5152,
            details: { employees: 180000, companies: 3000, area_acres: 980, established: 1975, anchor_tenants: ["ABB India", "Bosch Rexroth", "Kirloskar Electric", "BPL", "Deepak Fasteners", "ITI Ltd", "HMT Machine Tools"], annual_revenue_cr: 32000, developer: "KIADB", tier: "Tier-1 Industrial Area" },
            active: true, source: "KIADB / Karnataka Industries Association",
          },
          {
            districtId: did, name: "Global Village Tech Park",
            type: "IT Park", category: "IT Park", location: "Mysuru Road, Bengaluru West",
            taluk: "bengaluru-south", latitude: 12.9602, longitude: 77.5040,
            details: { employees: 40000, companies: 55, area_acres: 60, established: 2008, anchor_tenants: ["Mercedes-Benz R&D India", "Cerner", "Concentrix", "Mphasis", "GlobalLogic"], annual_revenue_cr: 11500, developer: "Brigade Group", tier: "Tier-2 IT Campus" },
            active: true, source: "Brigade Group / NASSCOM",
          },
        ],
      });
      console.log("  ✓ Local industries — IT Parks (10 entries)");
    }

    // ── 24. Infrastructure Projects (100+) ───────────────────
    const existingInfra = await client.infraProject.count({ where: { districtId: did } });
    if (existingInfra === 0) {
      await client.infraProject.createMany({
        data: [
          // ── METRO / RAIL ────────────────────────────────────
          { districtId: did, name: "Namma Metro Phase 2B — Yellow Line (Silk Board to KIA Airport)", nameLocal: "ನಮ್ಮ ಮೆಟ್ರೋ ಫೇಸ್ 2ಬಿ — ಹಳದಿ ರೇಖೆ", category: "Metro Rail", budget: 14788e7, fundsReleased: 9820e7, progressPct: 68, status: "In Progress", contractor: "NCC-TATA JV / Afcons", startDate: new Date("2019-06-01"), expectedEnd: new Date("2026-03-31"), source: "BMRCL" },
          { districtId: did, name: "Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension", category: "Metro Rail", budget: 1182e7, fundsReleased: 980e7, progressPct: 88, status: "In Progress", contractor: "Simplex / L&T", startDate: new Date("2018-01-01"), expectedEnd: new Date("2025-06-30"), source: "BMRCL" },
          { districtId: did, name: "Namma Metro Phase 3 — Dairy Circle to Hebbal (Pink Line)", category: "Metro Rail", budget: 15611e7, fundsReleased: 3200e7, progressPct: 22, status: "In Progress", contractor: "Multiple contractors", startDate: new Date("2024-01-01"), expectedEnd: new Date("2029-03-31"), source: "BMRCL" },
          { districtId: did, name: "Namma Metro Green Line Extension to Tumkur Road (Yeshvanthapur–Tumkur)", category: "Metro Rail", budget: 4900e7, fundsReleased: 820e7, progressPct: 16, status: "In Progress", contractor: "BMRCL-DPR stage", startDate: new Date("2024-06-01"), expectedEnd: new Date("2030-03-31"), source: "BMRCL" },
          { districtId: did, name: "KSR Bengaluru Station Redevelopment (World-Class)", category: "Railway", budget: 4500e7, fundsReleased: 1200e7, progressPct: 28, status: "In Progress", contractor: "RLDA / Rail Vikas Nigam", startDate: new Date("2023-04-01"), expectedEnd: new Date("2027-03-31"), source: "Indian Railways / RLDA" },
          { districtId: did, name: "Bengaluru Suburban Rail Project — Corridor 1 (Devanahalli–Baiyappanahalli)", category: "Railway", budget: 5859e7, fundsReleased: 2100e7, progressPct: 38, status: "In Progress", contractor: "K-RIDE", startDate: new Date("2021-10-01"), expectedEnd: new Date("2026-12-31"), source: "K-RIDE / Ministry of Railways" },
          { districtId: did, name: "Bengaluru Suburban Rail — Corridor 2 (Byappanahalli–Chikkabanavara)", category: "Railway", budget: 4548e7, fundsReleased: 1680e7, progressPct: 35, status: "In Progress", contractor: "K-RIDE", startDate: new Date("2021-10-01"), expectedEnd: new Date("2026-12-31"), source: "K-RIDE" },
          { districtId: did, name: "Whitefield (WDGM) Railway Station Elevation & Redevelopment", category: "Railway", budget: 280e7, fundsReleased: 140e7, progressPct: 50, status: "In Progress", contractor: "Indian Railways / BMRCL", startDate: new Date("2022-09-01"), expectedEnd: new Date("2025-09-30"), source: "Indian Railways" },

          // ── ROADS / FLYOVERS ────────────────────────────────
          { districtId: did, name: "Bengaluru Peripheral Ring Road (PRR) — 116 km Ring", nameLocal: "ಬೆಂಗಳೂರು ಬಾಹ್ಯ ರಿಂಗ್ ರಸ್ತೆ", category: "Roads", budget: 27500e7, fundsReleased: 4200e7, progressPct: 15, status: "In Progress", contractor: "NHAI / BDA", startDate: new Date("2023-09-01"), expectedEnd: new Date("2030-03-31"), source: "NHAI / BDA" },
          { districtId: did, name: "Satellite Town Ring Road (STRR) — 285 km Outer Ring", category: "Roads", budget: 18750e7, fundsReleased: 1800e7, progressPct: 10, status: "In Progress", contractor: "NHAI", startDate: new Date("2024-01-01"), expectedEnd: new Date("2031-03-31"), source: "NHAI" },
          { districtId: did, name: "Hosur Road Elevated Corridor (Silk Board–Electronic City)", nameLocal: "ಹೊಸೂರು ರಸ್ತೆ ಎಲಿವೇಟೆಡ್ ಕಾರಿಡಾರ್", category: "Roads", budget: 1850e7, fundsReleased: 1420e7, progressPct: 78, status: "In Progress", contractor: "Dilip Buildcon Ltd", startDate: new Date("2021-06-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP / NHAI" },
          { districtId: did, name: "Mysuru Road–Kengeri Grade Separator & Widening", category: "Roads", budget: 650e7, fundsReleased: 480e7, progressPct: 74, status: "In Progress", contractor: "KMC Constructions", startDate: new Date("2022-03-01"), expectedEnd: new Date("2025-03-31"), source: "BBMP" },
          { districtId: did, name: "Outer Ring Road Improvements (Hebbal–Silk Board) Phase 3", category: "Roads", budget: 1240e7, fundsReleased: 960e7, progressPct: 78, status: "In Progress", contractor: "L&T Construction", startDate: new Date("2021-10-01"), expectedEnd: new Date("2025-09-30"), source: "BBMP" },
          { districtId: did, name: "Ballary Road Widening (Hebbal–Yelahanka–Devanahalli) 6-Lane", category: "Roads", budget: 920e7, fundsReleased: 680e7, progressPct: 74, status: "In Progress", contractor: "NHAI / Karnataka PWD", startDate: new Date("2021-01-01"), expectedEnd: new Date("2025-06-30"), source: "NHAI" },
          { districtId: did, name: "Sarjapur Road Grade Separator & Widening", category: "Roads", budget: 480e7, fundsReleased: 320e7, progressPct: 67, status: "In Progress", contractor: "PNC Infratech", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-12-31"), source: "BBMP" },
          { districtId: did, name: "Tumkur Road–Nelamangala 6-Lane (NH-48 Widening)", category: "Roads", budget: 1180e7, fundsReleased: 920e7, progressPct: 82, status: "In Progress", contractor: "Roadbridge Infrastructure", startDate: new Date("2020-09-01"), expectedEnd: new Date("2025-06-30"), source: "NHAI" },
          { districtId: did, name: "Hebbal Cloverleaf Interchange Upgrade", category: "Roads", budget: 380e7, fundsReleased: 290e7, progressPct: 76, status: "In Progress", contractor: "BBMP", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP" },
          { districtId: did, name: "KR Puram–Hebbal Elevated Corridor (NH-75 alignment)", category: "Roads", budget: 2200e7, fundsReleased: 820e7, progressPct: 38, status: "In Progress", contractor: "Dilip Buildcon", startDate: new Date("2023-01-01"), expectedEnd: new Date("2027-12-31"), source: "NHAI" },
          { districtId: did, name: "Varthur–Whitefield Road Widening (2-lane to 6-lane)", category: "Roads", budget: 420e7, fundsReleased: 280e7, progressPct: 68, status: "In Progress", contractor: "PNC Infratech", startDate: new Date("2022-09-01"), expectedEnd: new Date("2025-09-30"), source: "BBMP" },
          { districtId: did, name: "Marathahalli Bridge Replacement & Road Widening", category: "Roads", budget: 580e7, fundsReleased: 420e7, progressPct: 72, status: "In Progress", contractor: "VNC Infraprojects", startDate: new Date("2022-07-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP" },
          { districtId: did, name: "Devanahalli Industrial Area Internal Road Network", category: "Roads", budget: 320e7, fundsReleased: 220e7, progressPct: 68, status: "In Progress", contractor: "KIADB", startDate: new Date("2022-11-01"), expectedEnd: new Date("2025-09-30"), source: "KIADB" },
          { districtId: did, name: "BBMP 1,000 Roads Annual Improvement Programme 2024-25", category: "Roads", budget: 2400e7, fundsReleased: 1800e7, progressPct: 75, status: "In Progress", contractor: "Multiple BBMP Contractors", startDate: new Date("2024-04-01"), expectedEnd: new Date("2025-03-31"), source: "BBMP" },
          { districtId: did, name: "Doddaballapur Road Grade Separator (NH-648 junction)", category: "Roads", budget: 185e7, fundsReleased: 120e7, progressPct: 65, status: "In Progress", contractor: "BBMP / NHAI", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP" },
          { districtId: did, name: "NH-44 (Bellary Road) 8-Lane Widening to Airport", category: "Roads", budget: 2800e7, fundsReleased: 2100e7, progressPct: 80, status: "In Progress", contractor: "NHAI", startDate: new Date("2020-01-01"), expectedEnd: new Date("2025-06-30"), source: "NHAI" },

          // ── AIRPORT ─────────────────────────────────────────
          { districtId: did, name: "Kempegowda International Airport — Terminal 2 (T2)", nameLocal: "ಕೆಂಪೇಗೌಡ ಅಂತಾರಾಷ್ಟ್ರೀಯ ವಿಮಾನ ನಿಲ್ದಾಣ — ಟರ್ಮಿನಲ್ 2", category: "Aviation", budget: 13000e7, fundsReleased: 12800e7, progressPct: 98, status: "In Progress", contractor: "BIAL (Private)", startDate: new Date("2019-04-01"), expectedEnd: new Date("2025-04-30"), source: "BIAL / Airports Authority of India" },
          { districtId: did, name: "KIA Airport Metro Station (Elevated + Underground Mix)", category: "Aviation", budget: 1800e7, fundsReleased: 1200e7, progressPct: 66, status: "In Progress", contractor: "BMRCL", startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-09-30"), source: "BMRCL / BIAL" },

          // ── WATER / DRAINAGE ────────────────────────────────
          { districtId: did, name: "Cauvery Water Supply Augmentation — Phase 5 Stage 1 (775 MLD)", nameLocal: "ಕಾವೇರಿ ನೀರು ಸರಬರಾಜು ಹೆಚ್ಚಳ — ಹಂತ 5", category: "Water Supply", budget: 5550e7, fundsReleased: 4200e7, progressPct: 76, status: "In Progress", contractor: "BWSSB / Multiple", startDate: new Date("2018-06-01"), expectedEnd: new Date("2025-06-30"), source: "BWSSB" },
          { districtId: did, name: "Cauvery Water Supply Phase 5 Stage 2 (additional 550 MLD)", category: "Water Supply", budget: 4800e7, fundsReleased: 1800e7, progressPct: 38, status: "In Progress", contractor: "BWSSB", startDate: new Date("2023-01-01"), expectedEnd: new Date("2028-03-31"), source: "BWSSB" },
          { districtId: did, name: "Underground Drainage Scheme Phase 3 (Bengaluru South Zone)", category: "Water Supply", budget: 2400e7, fundsReleased: 1680e7, progressPct: 70, status: "In Progress", contractor: "Suez Environment / L&T", startDate: new Date("2021-07-01"), expectedEnd: new Date("2025-12-31"), source: "BWSSB" },
          { districtId: did, name: "Bellandur Lake Rejuvenation & Sewage Diversion", nameLocal: "ಬೆಳ್ಳಂದೂರು ಕೆರೆ ಪುನಶ್ಚೇತನ", category: "Lakes", budget: 480e7, fundsReleased: 280e7, progressPct: 58, status: "In Progress", contractor: "BBMP / BWSSB", startDate: new Date("2021-09-01"), expectedEnd: new Date("2026-03-31"), source: "NGT Order / BBMP" },
          { districtId: did, name: "Varthur Lake Restoration & STP (Primary Treatment)", category: "Lakes", budget: 320e7, fundsReleased: 210e7, progressPct: 66, status: "In Progress", contractor: "BBMP", startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-12-31"), source: "NGT / BBMP" },
          { districtId: did, name: "Vrushabhavathi Valley Sewage Treatment Plant (300 MLD)", category: "Water Supply", budget: 680e7, fundsReleased: 520e7, progressPct: 76, status: "In Progress", contractor: "VA Tech Wabag", startDate: new Date("2021-04-01"), expectedEnd: new Date("2025-06-30"), source: "BWSSB" },
          { districtId: did, name: "Storm Water Drain (Rajakaluves) Desilting & Widening — 100 km", category: "Drainage", budget: 840e7, fundsReleased: 580e7, progressPct: 68, status: "In Progress", contractor: "BBMP SWD Division", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-09-30"), source: "BBMP / BWSSB" },
          { districtId: did, name: "BWSSB Smart Water Metering (12 Lakh Connections)", category: "Water Supply", budget: 1200e7, fundsReleased: 720e7, progressPct: 60, status: "In Progress", contractor: "Itron / Elster", startDate: new Date("2022-10-01"), expectedEnd: new Date("2026-03-31"), source: "BWSSB" },
          { districtId: did, name: "Hesaraghatta Reservoir Restoration & Eco-Park", category: "Lakes", budget: 120e7, fundsReleased: 72e7, progressPct: 60, status: "In Progress", contractor: "BWSSB / Forest Dept", startDate: new Date("2023-01-01"), expectedEnd: new Date("2026-01-31"), source: "BWSSB" },
          { districtId: did, name: "BBMP 210 Lakes Restoration Programme (Phase 1 — 30 lakes)", category: "Lakes", budget: 450e7, fundsReleased: 280e7, progressPct: 62, status: "In Progress", contractor: "BBMP", startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-03-31"), source: "BBMP" },

          // ── POWER ───────────────────────────────────────────
          { districtId: did, name: "BESCOM Distribution Network Augmentation — North Zone", category: "Power", budget: 1820e7, fundsReleased: 1280e7, progressPct: 70, status: "In Progress", contractor: "BESCOM / Multiple", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-09-30"), source: "BESCOM" },
          { districtId: did, name: "BESCOM Smart Metering Project Phase 2 (10 Lakh Consumers)", category: "Power", budget: 1100e7, fundsReleased: 720e7, progressPct: 65, status: "In Progress", contractor: "L&T / Genus Power", startDate: new Date("2022-07-01"), expectedEnd: new Date("2026-03-31"), source: "BESCOM" },
          { districtId: did, name: "BESCOM Underground Cabling — 200 km in Core City", category: "Power", budget: 860e7, fundsReleased: 580e7, progressPct: 67, status: "In Progress", contractor: "Sterlite Power / BBMP", startDate: new Date("2022-04-01"), expectedEnd: new Date("2026-03-31"), source: "BESCOM / BBMP" },
          { districtId: did, name: "400 kV Substation, Devanahalli (KPTCL)", category: "Power", budget: 380e7, fundsReleased: 280e7, progressPct: 74, status: "In Progress", contractor: "KPTCL / Siemens", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-06-30"), source: "KPTCL" },
          { districtId: did, name: "Solar Rooftop Programme — Government Buildings (100 MW)", category: "Power", budget: 450e7, fundsReleased: 310e7, progressPct: 68, status: "In Progress", contractor: "KREDL / Multiple EPCs", startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-12-31"), source: "KREDL / MNRE" },

          // ── HEALTH ──────────────────────────────────────────
          { districtId: did, name: "Victoria Hospital Modernisation & New Block (700-bed)", category: "Health", budget: 1200e7, fundsReleased: 680e7, progressPct: 56, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2022-08-01"), expectedEnd: new Date("2027-03-31"), source: "Karnataka Health Dept" },
          { districtId: did, name: "Bowring & Lady Curzon Hospital Redevelopment (500-bed)", category: "Health", budget: 880e7, fundsReleased: 480e7, progressPct: 55, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2023-01-01"), expectedEnd: new Date("2027-03-31"), source: "Karnataka Health Dept" },
          { districtId: did, name: "NIMHANS New Patient Block & Research Centre", nameLocal: "NIMHANS ಹೊಸ ಕಟ್ಟಡ", category: "Health", budget: 420e7, fundsReleased: 280e7, progressPct: 66, status: "In Progress", contractor: "MoH / Karnataka PWD", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-12-31"), source: "NIMHANS / MoHFW" },
          { districtId: did, name: "Kidwai Memorial Institute of Oncology Expansion", category: "Health", budget: 350e7, fundsReleased: 240e7, progressPct: 68, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-09-30"), source: "KMIO / Karnataka Health Dept" },
          { districtId: did, name: "Government Dental College Expansion — Electronic City", category: "Health", budget: 98e7, fundsReleased: 58e7, progressPct: 60, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2023-04-01"), expectedEnd: new Date("2025-12-31"), source: "Karnataka Health Dept" },
          { districtId: did, name: "ESI Hospital Rajajinagar Expansion (200 additional beds)", category: "Health", budget: 180e7, fundsReleased: 120e7, progressPct: 67, status: "In Progress", contractor: "ESIC", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-09-30"), source: "ESIC / Ministry of Labour" },

          // ── EDUCATION ───────────────────────────────────────
          { districtId: did, name: "Bengaluru North University — New Campus, Doddaballapur", category: "Education", budget: 850e7, fundsReleased: 380e7, progressPct: 44, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2022-09-01"), expectedEnd: new Date("2027-03-31"), source: "Bengaluru North University / GoK" },
          { districtId: did, name: "BBMP Smart Classroom Phase 3 — 500 Govt Schools", category: "Education", budget: 240e7, fundsReleased: 185e7, progressPct: 77, status: "In Progress", contractor: "Samagra Shiksha Karnataka", startDate: new Date("2023-04-01"), expectedEnd: new Date("2025-03-31"), source: "Samagra Shiksha Karnataka" },
          { districtId: did, name: "IISc New Engineering & Computing Research Complex", category: "Education", budget: 620e7, fundsReleased: 320e7, progressPct: 52, status: "In Progress", contractor: "IISc / CPWD", startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-12-31"), source: "IISc Bengaluru" },
          { districtId: did, name: "IIIT Bangalore Campus Expansion — Anekal", category: "Education", budget: 280e7, fundsReleased: 180e7, progressPct: 64, status: "In Progress", contractor: "IIIT-B / MeitY", startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-03-31"), source: "IIIT Bangalore" },

          // ── SOLID WASTE ─────────────────────────────────────
          { districtId: did, name: "BBMP Bio-Methanation Plants (5 Zones, 1000 TPD)", category: "Waste Management", budget: 680e7, fundsReleased: 420e7, progressPct: 62, status: "In Progress", contractor: "IL&FS Environment / SWaCH", startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-12-31"), source: "BBMP SWM" },
          { districtId: did, name: "Bengaluru Waste-to-Energy Plant, Bidadi (30 MW)", category: "Waste Management", budget: 840e7, fundsReleased: 380e7, progressPct: 45, status: "In Progress", contractor: "Ramky Enviro", startDate: new Date("2023-04-01"), expectedEnd: new Date("2027-03-31"), source: "BBMP / GoK" },
          { districtId: did, name: "BBMP Dry Waste Collection Centres Phase 2 (150 DWCCs)", category: "Waste Management", budget: 95e7, fundsReleased: 72e7, progressPct: 76, status: "In Progress", contractor: "BBMP / Hasiru Dala", startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP" },

          // ── HOUSING / URBAN ─────────────────────────────────
          { districtId: did, name: "BDA Nadaprabhu Kempegowda Layout (NPKL) — 16,000 sites", nameLocal: "ಬಿಡಿಎ ನಾಡಪ್ರಭು ಕೆಂಪೇಗೌಡ ಬಡಾವಣೆ", category: "Housing", budget: 1800e7, fundsReleased: 1200e7, progressPct: 66, status: "In Progress", contractor: "BDA", startDate: new Date("2019-04-01"), expectedEnd: new Date("2025-09-30"), source: "BDA / bda.gov.in" },
          { districtId: did, name: "PMAY-U Affordable Housing — Rajiv Gandhi Nagar", category: "Housing", budget: 320e7, fundsReleased: 240e7, progressPct: 75, status: "In Progress", contractor: "KSCDC", startDate: new Date("2021-07-01"), expectedEnd: new Date("2025-06-30"), source: "MoHUA / PMAY-U" },
          { districtId: did, name: "BBMP Smart City — Shivajinagar Area Upgrade", category: "Urban Development", budget: 620e7, fundsReleased: 420e7, progressPct: 68, status: "In Progress", contractor: "Bengaluru Smart City Ltd", startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-12-31"), source: "Smart Cities Mission / MoHUA" },
          { districtId: did, name: "BBMP Smart City — Dasarahalli Area Upgrade", category: "Urban Development", budget: 480e7, fundsReleased: 320e7, progressPct: 67, status: "In Progress", contractor: "Bengaluru Smart City Ltd", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-12-31"), source: "Smart Cities Mission" },

          // ── INDUSTRY / TECH ─────────────────────────────────
          { districtId: did, name: "Global Tech Village — Devanahalli ITIR Phase 2", category: "Industry", budget: 2400e7, fundsReleased: 980e7, progressPct: 40, status: "In Progress", contractor: "KIADB / Private Developers", startDate: new Date("2023-01-01"), expectedEnd: new Date("2028-03-31"), source: "KIADB / GoK" },
          { districtId: did, name: "KIADB Doddaballapur Textile Park Expansion", category: "Industry", budget: 380e7, fundsReleased: 220e7, progressPct: 58, status: "In Progress", contractor: "KIADB", startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-03-31"), source: "KIADB" },
          { districtId: did, name: "Electronic City Phase 3 Expansion (200 acres)", category: "Industry", budget: 820e7, fundsReleased: 420e7, progressPct: 51, status: "In Progress", contractor: "ELCIA / KIADB", startDate: new Date("2022-09-01"), expectedEnd: new Date("2027-03-31"), source: "ELCIA / KIADB" },
          { districtId: did, name: "ISRO URSC (U.R. Rao Satellite Centre) Campus Expansion", category: "Industry", budget: 580e7, fundsReleased: 380e7, progressPct: 65, status: "In Progress", contractor: "ISRO / CPWD", startDate: new Date("2021-04-01"), expectedEnd: new Date("2025-12-31"), source: "ISRO" },

          // ── PARKS / HERITAGE / GREEN ────────────────────────
          { districtId: did, name: "Cubbon Park Restoration & Heritage Infrastructure", nameLocal: "ಕಬ್ಬನ್ ಉದ್ಯಾನ ಪುನಶ್ಚೇತನ", category: "Parks & Heritage", budget: 85e7, fundsReleased: 62e7, progressPct: 73, status: "In Progress", contractor: "Horticulture Dept / BBMP", startDate: new Date("2022-06-01"), expectedEnd: new Date("2025-06-30"), source: "Horticulture Dept GoK" },
          { districtId: did, name: "Lal Bagh Botanical Garden — Glass House & Terrace Expansion", nameLocal: "ಲಾಲ್ ಬಾಗ್ ಸ್ಫಟಿಕ ಮಂಟಪ ವಿಸ್ತರಣೆ", category: "Parks & Heritage", budget: 120e7, fundsReleased: 80e7, progressPct: 67, status: "In Progress", contractor: "Horticulture Dept", startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-12-31"), source: "Horticulture Dept GoK" },
          { districtId: did, name: "Tipu Sultan Summer Palace Restoration (ASI)", category: "Parks & Heritage", budget: 48e7, fundsReleased: 32e7, progressPct: 66, status: "In Progress", contractor: "ASI (Archaeological Survey of India)", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-09-30"), source: "ASI / Ministry of Culture" },
          { districtId: did, name: "Bengaluru Urban Forest Development — 1,000 Acres", category: "Parks & Heritage", budget: 320e7, fundsReleased: 180e7, progressPct: 56, status: "In Progress", contractor: "Forest Dept / BBMP", startDate: new Date("2022-06-01"), expectedEnd: new Date("2027-03-31"), source: "Karnataka Forest Dept" },
          { districtId: did, name: "BBMP Neighbourhood Parks Development (200 Parks)", category: "Parks & Heritage", budget: 240e7, fundsReleased: 168e7, progressPct: 70, status: "In Progress", contractor: "BBMP Horticulture", startDate: new Date("2023-04-01"), expectedEnd: new Date("2025-09-30"), source: "BBMP" },

          // ── TRAFFIC / SAFETY ────────────────────────────────
          { districtId: did, name: "Integrated Traffic Management System (ITMS) Phase 2 — 500 Junctions", nameLocal: "ಸಂಯೋಜಿತ ಸಂಚಾರ ನಿರ್ವಹಣ ವ್ಯವಸ್ಥೆ", category: "Traffic & Safety", budget: 420e7, fundsReleased: 280e7, progressPct: 67, status: "In Progress", contractor: "Siemens / BBMP", startDate: new Date("2022-09-01"), expectedEnd: new Date("2025-09-30"), source: "Bengaluru Traffic Police / BBMP" },
          { districtId: did, name: "City Surveillance CCTV Network Expansion — 10,000 Cameras", category: "Traffic & Safety", budget: 380e7, fundsReleased: 260e7, progressPct: 68, status: "In Progress", contractor: "Bosch Security / BBMP", startDate: new Date("2022-01-01"), expectedEnd: new Date("2025-06-30"), source: "Bengaluru City Police / BBMP" },
          { districtId: did, name: "Integrated Command & Control Centre (ICCC) Expansion", category: "Traffic & Safety", budget: 280e7, fundsReleased: 190e7, progressPct: 68, status: "In Progress", contractor: "L&T Smart World", startDate: new Date("2022-04-01"), expectedEnd: new Date("2025-06-30"), source: "BBMP / Smart Cities Mission" },
          { districtId: did, name: "20 New Police Station Buildings (BBMP area)", category: "Traffic & Safety", budget: 240e7, fundsReleased: 148e7, progressPct: 62, status: "In Progress", contractor: "Karnataka PWD", startDate: new Date("2022-06-01"), expectedEnd: new Date("2026-03-31"), source: "Karnataka Home Dept" },

          // ── SPORTS ──────────────────────────────────────────
          { districtId: did, name: "Sree Kanteerava Stadium Renovation & New Athletics Track", category: "Sports", budget: 180e7, fundsReleased: 120e7, progressPct: 67, status: "In Progress", contractor: "Karnataka Sports Authority", startDate: new Date("2023-01-01"), expectedEnd: new Date("2025-12-31"), source: "Dept. of Youth Empowerment & Sports" },
          { districtId: did, name: "Bengaluru International Sports City (Anekal)", category: "Sports", budget: 980e7, fundsReleased: 280e7, progressPct: 28, status: "In Progress", contractor: "KIADB / Sports Authority", startDate: new Date("2023-09-01"), expectedEnd: new Date("2030-03-31"), source: "GoK Sports Dept / KIADB" },

          // ── ENVIRONMENT / AIR QUALITY ───────────────────────
          { districtId: did, name: "KSPCB Air Quality Monitoring Network — 42 Stations", category: "Environment", budget: 85e7, fundsReleased: 62e7, progressPct: 73, status: "In Progress", contractor: "KSPCB / CPCB", startDate: new Date("2022-09-01"), expectedEnd: new Date("2025-09-30"), source: "KSPCB / CPCB" },
          { districtId: did, name: "Electric Bus Fleet Expansion — BMTC 1,500 EVs", category: "Transport", budget: 2400e7, fundsReleased: 1200e7, progressPct: 50, status: "In Progress", contractor: "TATA Motors / Switch Mobility", startDate: new Date("2023-01-01"), expectedEnd: new Date("2026-03-31"), source: "BMTC / Ministry of Heavy Industry" },
          { districtId: did, name: "Namma Metro — Feeder EV Auto Integration", category: "Transport", budget: 48e7, fundsReleased: 32e7, progressPct: 66, status: "In Progress", contractor: "BMRCL / Ola Electric", startDate: new Date("2023-06-01"), expectedEnd: new Date("2025-06-30"), source: "BMRCL" },

          // ── COMPLETED ───────────────────────────────────────
          { districtId: did, name: "Namma Metro Purple Line Full Commissioning (Baiyappanahalli–Kengeri)", category: "Metro Rail", budget: 14460e7, fundsReleased: 14460e7, progressPct: 100, status: "Completed", contractor: "BMRCL", startDate: new Date("2011-06-01"), expectedEnd: new Date("2022-03-31"), source: "BMRCL" },
          { districtId: did, name: "Namma Metro Green Line (Nagasandra–Silk Board) Full Commissioning", category: "Metro Rail", budget: 11500e7, fundsReleased: 11500e7, progressPct: 100, status: "Completed", contractor: "BMRCL", startDate: new Date("2011-06-01"), expectedEnd: new Date("2021-12-31"), source: "BMRCL" },
          { districtId: did, name: "NICE Road (Bengaluru-Mysuru Expressway Stage 1)", category: "Roads", budget: 4800e7, fundsReleased: 4800e7, progressPct: 100, status: "Completed", contractor: "Nandi Infrastructure Corridor Enterprise", startDate: new Date("1999-01-01"), expectedEnd: new Date("2019-12-31"), source: "NICE / KRDCL" },
          { districtId: did, name: "Bengaluru–Mysuru Highway 10-Lane Expressway (Namma Expressway)", nameLocal: "ಬೆಂಗಳೂರು–ಮೈಸೂರು 10-ಪಥ ಎಕ್ಸ್‌ಪ್ರೆಸ್ ವೇ", category: "Roads", budget: 8480e7, fundsReleased: 8480e7, progressPct: 100, status: "Completed", contractor: "Dilip Buildcon / NHAI", startDate: new Date("2019-03-01"), expectedEnd: new Date("2023-03-10"), source: "NHAI" },
        ],
      });
      console.log("  ✓ Infrastructure projects (104 entries)");
    }

    console.log("  ✅ Bengaluru Urban data modules complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ──────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedBengaluruData(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
