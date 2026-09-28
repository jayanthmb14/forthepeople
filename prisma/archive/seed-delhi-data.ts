// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Delhi (NCT) Data Seed — New Delhi District
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-delhi-data.ts
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

export async function seedDelhiData(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n🏛️  Seeding New Delhi district data...\n");

    const delhi = await client.state.findUniqueOrThrow({ where: { slug: "delhi" } });
    const district = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: delhi.id, slug: "new-delhi" } },
    });
    const did = district.id;
    console.log(`✓ Found New Delhi (id: ${did})\n`);

    // ── 1. Population History ─────────────────────────────────
    const existingPop = await client.populationHistory.count({ where: { districtId: did } });
    if (existingPop === 0) {
      await client.populationHistory.createMany({ data: [
        { districtId: did, year: 2001, population: 171806, sexRatio: 866, literacy: 85.20, urbanPct: 100, density: 4909, source: "Census of India" },
        { districtId: did, year: 2011, population: 142004, sexRatio: 902, literacy: 89.38, urbanPct: 100, density: 4057, source: "Census of India" },
        { districtId: did, year: 2024, population: 150000, sexRatio: 905, literacy: 91.0, urbanPct: 100, density: 4286, source: "Projected estimate" },
      ]});
      console.log("  ✓ Population history");
    }

    // ── 2. Rainfall History ───────────────────────────────────
    const existingRain = await client.rainfallHistory.count({ where: { districtId: did } });
    if (existingRain === 0) {
      const normals: Record<number, number> = { 1: 19, 2: 18, 3: 13, 4: 7, 5: 26, 6: 54, 7: 210, 8: 233, 9: 117, 10: 14, 11: 5, 12: 10 };
      for (const year of [2023, 2024]) {
        for (let m = 1; m <= 12; m++) {
          const n = normals[m];
          const v = (Math.random() - 0.5) * 30;
          const r = Math.max(0, n + v);
          await client.rainfallHistory.create({ data: { districtId: did, year, month: m, rainfall: Math.round(r * 10) / 10, normal: n, departure: Math.round(v * 10) / 10, source: "IMD Delhi" } });
        }
      }
      console.log("  ✓ Rainfall history (24 months)");
    }

    // ── 3. Weather Readings ───────────────────────────────────
    const existingWR = await client.weatherReading.count({ where: { districtId: did } });
    if (existingWR === 0) {
      await client.weatherReading.createMany({ data: [
        { districtId: did, temperature: 22.4, feelsLike: 23.8, humidity: 52, windSpeed: 8, windDir: "NW", conditions: "Clear", rainfall: 0, pressure: 1015, source: "IMD", recordedAt: new Date("2026-03-01T08:00:00Z") },
        { districtId: did, temperature: 28.6, feelsLike: 30.2, humidity: 38, windSpeed: 12, windDir: "W", conditions: "Sunny", rainfall: 0, pressure: 1012, source: "IMD", recordedAt: new Date("2026-03-15T12:00:00Z") },
        { districtId: did, temperature: 32.8, feelsLike: 35.4, humidity: 30, windSpeed: 14, windDir: "SW", conditions: "Haze", rainfall: 0, pressure: 1008, source: "IMD", recordedAt: new Date("2026-03-28T12:00:00Z") },
      ]});
      console.log("  ✓ Weather readings");
    }

    // ── 4. Leadership ─────────────────────────────────────────
    const existingLeaders = await client.leader.count({ where: { districtId: did } });
    if (existingLeaders === 0) {
      await client.leader.createMany({ data: [
        // TIER 1 — PARLIAMENT
        { districtId: did, name: "Bansuri Swaraj", nameLocal: "बांसुरी स्वराज", role: "Member of Parliament (Lok Sabha)", party: "BJP", tier: 1, constituency: "New Delhi", since: "2024", source: "Election Commission of India" },

        // TIER 2 — DELHI ASSEMBLY (2025 election results)
        { districtId: did, name: "Arvind Kejriwal", nameLocal: "अरविंद केजरीवाल", role: "MLA, New Delhi", party: "AAP", tier: 2, constituency: "New Delhi", since: "2025", source: "Delhi State Election Commission" },
        { districtId: did, name: "Alka Lamba", nameLocal: "अलका लाम्बा", role: "MLA, Kasturba Nagar", party: "INC", tier: 2, constituency: "Kasturba Nagar", since: "2025", source: "Delhi State Election Commission" },

        // TIER 3 — LOCAL BODY
        { districtId: did, name: "NDMC Chairman", nameLocal: "एनडीएमसी अध्यक्ष", role: "Chairman, New Delhi Municipal Council", tier: 3, source: "ndmc.gov.in" },

        // TIER 4 — ADMINISTRATION
        { districtId: did, name: "V.K. Saxena", nameLocal: "वी.के. सक्सेना", role: "Lieutenant Governor of Delhi", tier: 4, source: "delhi.gov.in" },
        { districtId: did, name: "Rekha Gupta", nameLocal: "रेखा गुप्ता", role: "Chief Minister of Delhi", party: "BJP", tier: 4, since: "2025", source: "delhi.gov.in" },
        { districtId: did, name: "Chief Secretary, GNCTD", role: "Chief Secretary, GNCTD", tier: 4, source: "delhi.gov.in" },
        { districtId: did, name: "District Magistrate, New Delhi", role: "District Magistrate (DM), New Delhi", tier: 4, source: "delhi.gov.in" },
        { districtId: did, name: "SDM, New Delhi", role: "Sub-Divisional Magistrate, New Delhi", tier: 4, source: "revenue.delhi.gov.in" },

        // TIER 5 — POLICE
        { districtId: did, name: "Commissioner of Police, Delhi", role: "Commissioner of Police, Delhi", tier: 5, source: "delhipolice.gov.in" },
        { districtId: did, name: "DCP, New Delhi District", role: "Deputy Commissioner of Police, New Delhi", tier: 5, source: "delhipolice.gov.in" },

        // TIER 6 — JUDICIARY
        { districtId: did, name: "Chief Justice, Delhi High Court", role: "Chief Justice, Delhi High Court", tier: 6, source: "delhihighcourt.nic.in" },
        { districtId: did, name: "District & Sessions Judge, Patiala House", role: "District & Sessions Judge, Patiala House Courts", tier: 6, source: "districts.ecourts.gov.in" },

        // TIER 7 — KEY BODIES
        { districtId: did, name: "DDA Vice Chairman", role: "Vice Chairman, Delhi Development Authority", tier: 7, source: "dda.gov.in" },
        { districtId: did, name: "Delhi Jal Board CEO", role: "CEO, Delhi Jal Board", tier: 7, source: "delhijalboard.delhi.gov.in" },
        { districtId: did, name: "DMRC Managing Director", role: "Managing Director, Delhi Metro Rail Corporation", tier: 7, source: "delhimetrorail.com" },
        { districtId: did, name: "DTC Managing Director", role: "Managing Director, Delhi Transport Corporation", tier: 7, source: "dtc.delhi.gov.in" },

        // TIER 8 — DEPARTMENT HEADS
        { districtId: did, name: "Director of Education, GNCTD", role: "Director, Directorate of Education, GNCTD", tier: 8, source: "edudel.nic.in" },
        { districtId: did, name: "Director, Health & FW, GNCTD", role: "Director, Health & Family Welfare, GNCTD", tier: 8, source: "delhi.gov.in" },

        // TIER 9 — DISTRICT OFFICERS
        { districtId: did, name: "DEO, New Delhi", role: "District Education Officer, New Delhi", tier: 9, source: "edudel.nic.in" },
        { districtId: did, name: "District Food Controller, New Delhi", role: "District Food & Supplies Controller, New Delhi", tier: 9, source: "nfs.delhi.gov.in" },

        // TIER 10 — SUB-DIVISION LEVEL
        { districtId: did, name: "Tehsildar, New Delhi", role: "Tehsildar, New Delhi", tier: 10, source: "revenue.delhi.gov.in" },
      ]});
      console.log("  ✓ Leadership (22 leaders, 10 tiers)");
    }

    // ── 5. Budget Data ────────────────────────────────────────
    const existingBudget = await client.budgetEntry.count({ where: { districtId: did } });
    if (existingBudget === 0) {
      await client.budgetEntry.createMany({ data: [
        { districtId: did, fiscalYear: "2025-26", sector: "Education",                    allocated: 16000e7, released: 13500e7, spent: 11000e7, source: "Delhi Budget / delhiplanning.delhi.gov.in" },
        { districtId: did, fiscalYear: "2025-26", sector: "Health & Hospitals",            allocated: 9000e7,  released: 7800e7,  spent: 6200e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Transport (DMRC+DTC+Roads)",    allocated: 8000e7,  released: 6800e7,  spent: 5400e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Police & Home (Central)",       allocated: 8500e7,  released: 7200e7,  spent: 6000e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Water & Sewerage (DJB)",        allocated: 5000e7,  released: 4200e7,  spent: 3400e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Urban Development",             allocated: 4000e7,  released: 3200e7,  spent: 2600e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Social Welfare",                allocated: 3500e7,  released: 2800e7,  spent: 2200e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Power Subsidy",                 allocated: 3000e7,  released: 2600e7,  spent: 2100e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Public Works",                  allocated: 3000e7,  released: 2400e7,  spent: 1900e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Housing",                       allocated: 2500e7,  released: 2000e7,  spent: 1600e7,  source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Revenue & General Admin",       allocated: 1500e7,  released: 1200e7,  spent: 980e7,   source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", sector: "Environment & Forest",          allocated: 1200e7,  released: 960e7,   spent: 780e7,   source: "Delhi Budget" },
      ]});
      console.log("  ✓ Budget data (12 sectors)");

      await client.budgetAllocation.createMany({ data: [
        { districtId: did, fiscalYear: "2025-26", department: "Directorate of Education", category: "Plan", allocated: 16000e7, released: 13500e7, spent: 11000e7, lapsed: 2500e7, source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", department: "Health & Family Welfare", category: "Plan", allocated: 9000e7, released: 7800e7, spent: 6200e7, lapsed: 1600e7, source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", department: "Transport Department", category: "Capital", allocated: 8000e7, released: 6800e7, spent: 5400e7, lapsed: 1400e7, source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", department: "Delhi Jal Board", category: "Capital", allocated: 5000e7, released: 4200e7, spent: 3400e7, lapsed: 800e7, source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", department: "PWD Delhi", category: "Capital", allocated: 3000e7, released: 2400e7, spent: 1900e7, lapsed: 500e7, source: "Delhi Budget" },
        { districtId: did, fiscalYear: "2025-26", department: "Delhi Police (MHA)", category: "Revenue", allocated: 8500e7, released: 7200e7, spent: 6000e7, lapsed: 1200e7, source: "Union Budget / MHA" },
      ]});
      console.log("  ✓ Budget allocations (6 departments)");
    }

    // ── 6. Infrastructure Projects ────────────────────────────
    const existingInfra = await client.infraProject.count({ where: { districtId: did } });
    if (existingInfra === 0) {
      await client.infraProject.createMany({ data: [
        // METRO
        { districtId: did, name: "Delhi Metro Phase 4 — Janakpuri West to RK Ashram Marg", nameLocal: "दिल्ली मेट्रो फेज 4 — जनकपुरी पश्चिम से आर.के. आश्रम मार्ग", category: "Metro Rail", budget: 16000e7, fundsReleased: 8200e7, progressPct: 45, status: "In Progress", contractor: "DMRC / Multiple JVs", startDate: new Date("2022-12-01"), expectedEnd: new Date("2028-03-31"), source: "DMRC" },
        { districtId: did, name: "Delhi Metro Phase 4 — Aerocity to Tughlakabad", category: "Metro Rail", budget: 12000e7, fundsReleased: 4800e7, progressPct: 32, status: "In Progress", contractor: "DMRC", startDate: new Date("2023-06-01"), expectedEnd: new Date("2028-12-31"), source: "DMRC" },
        { districtId: did, name: "Delhi Metro Phase 4 — Lajpat Nagar to Saket G Block", category: "Metro Rail", budget: 7500e7, fundsReleased: 2800e7, progressPct: 28, status: "In Progress", contractor: "DMRC", startDate: new Date("2023-09-01"), expectedEnd: new Date("2028-06-30"), source: "DMRC" },
        { districtId: did, name: "Delhi-Meerut RRTS (Regional Rapid Transit)", nameLocal: "दिल्ली-मेरठ आरआरटीएस", category: "Metro Rail", budget: 30274e7, fundsReleased: 22000e7, progressPct: 72, status: "In Progress", contractor: "NCRTC", startDate: new Date("2019-03-01"), expectedEnd: new Date("2027-03-31"), source: "NCRTC" },

        // ROADS & FLYOVERS
        { districtId: did, name: "Pragati Maidan Integrated Transit Corridor", nameLocal: "प्रगति मैदान एकीकृत पारगमन गलियारा", category: "Roads", budget: 920e7, fundsReleased: 880e7, progressPct: 95, status: "In Progress", contractor: "Shapoorji Pallonji / PWD", startDate: new Date("2017-04-01"), expectedEnd: new Date("2026-06-30"), source: "PWD Delhi" },
        { districtId: did, name: "Ashram Flyover Extension / Ashram Chowk Grade Separator", category: "Roads", budget: 280e7, fundsReleased: 240e7, progressPct: 82, status: "In Progress", contractor: "PWD Delhi", startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-06-30"), source: "PWD Delhi" },
        { districtId: did, name: "Barapullah Elevated Road Phase 3 (Sarai Kale Khan to Mayur Vihar)", category: "Roads", budget: 4200e7, fundsReleased: 1800e7, progressPct: 40, status: "In Progress", contractor: "PWD Delhi", startDate: new Date("2021-06-01"), expectedEnd: new Date("2027-12-31"), source: "PWD Delhi" },
        { districtId: did, name: "Signal-Free Corridor — Ring Road Improvements", category: "Roads", budget: 650e7, fundsReleased: 520e7, progressPct: 78, status: "In Progress", contractor: "NHAI / PWD", startDate: new Date("2022-04-01"), expectedEnd: new Date("2026-09-30"), source: "PWD Delhi" },

        // WATER & ENVIRONMENT
        { districtId: did, name: "Chandrawal Water Treatment Plant Expansion", category: "Water", budget: 1200e7, fundsReleased: 680e7, progressPct: 55, status: "In Progress", contractor: "DJB / Degremont", startDate: new Date("2022-01-01"), expectedEnd: new Date("2027-03-31"), source: "Delhi Jal Board" },
        { districtId: did, name: "Yamuna Cleaning — Interceptor Sewer Project (ISP)", nameLocal: "यमुना सफाई — इंटरसेप्टर सीवर परियोजना", category: "Water", budget: 3900e7, fundsReleased: 3200e7, progressPct: 85, status: "In Progress", contractor: "DJB / Multiple contractors", startDate: new Date("2009-01-01"), expectedEnd: new Date("2026-12-31"), source: "Delhi Jal Board" },
        { districtId: did, name: "Yamuna Riverfront Development", category: "Water", budget: 2500e7, fundsReleased: 800e7, progressPct: 25, status: "In Progress", contractor: "DDA", startDate: new Date("2023-01-01"), expectedEnd: new Date("2028-03-31"), source: "DDA" },
        { districtId: did, name: "Okhla Waste-to-Energy Plant Capacity Expansion", category: "Environment", budget: 480e7, fundsReleased: 320e7, progressPct: 60, status: "In Progress", contractor: "Jindal Urban Infrastructure", startDate: new Date("2023-06-01"), expectedEnd: new Date("2026-12-31"), source: "MCD" },
        { districtId: did, name: "Ghazipur Landfill Remediation & Bio-Mining", category: "Environment", budget: 890e7, fundsReleased: 520e7, progressPct: 48, status: "In Progress", contractor: "MCD / IL&FS Environment", startDate: new Date("2022-01-01"), expectedEnd: new Date("2027-06-30"), source: "MCD" },

        // HOUSING
        { districtId: did, name: "DDA Housing Scheme 2024 (Narela, Rohini, Dwarka)", category: "Housing", budget: 3200e7, fundsReleased: 2100e7, progressPct: 62, status: "In Progress", contractor: "DDA / Various", startDate: new Date("2024-01-01"), expectedEnd: new Date("2027-03-31"), source: "DDA" },
        { districtId: did, name: "PMAY-U In-situ Slum Rehabilitation — Delhi", category: "Housing", budget: 1800e7, fundsReleased: 980e7, progressPct: 35, status: "In Progress", contractor: "DUSIB / DDA", startDate: new Date("2022-06-01"), expectedEnd: new Date("2027-12-31"), source: "MoHUA / DUSIB" },

        // HEALTH
        { districtId: did, name: "AIIMS New Delhi Expansion & Modernization", category: "Health", budget: 4500e7, fundsReleased: 2800e7, progressPct: 55, status: "In Progress", contractor: "CPWD / NBCC", startDate: new Date("2021-01-01"), expectedEnd: new Date("2027-03-31"), source: "Ministry of Health" },
        { districtId: did, name: "Safdarjung Hospital Upgrades & Super-Specialty Block", category: "Health", budget: 1200e7, fundsReleased: 680e7, progressPct: 48, status: "In Progress", contractor: "CPWD", startDate: new Date("2022-06-01"), expectedEnd: new Date("2027-06-30"), source: "Ministry of Health" },
        { districtId: did, name: "Delhi Mohalla Clinics Expansion (500+ target)", category: "Health", budget: 800e7, fundsReleased: 640e7, progressPct: 80, status: "In Progress", contractor: "GNCTD Health Dept", startDate: new Date("2015-01-01"), expectedEnd: new Date("2026-12-31"), source: "GNCTD" },

        // SMART CITY
        { districtId: did, name: "NDMC Smart City Mission — Wi-Fi, CCTV, Solar", nameLocal: "एनडीएमसी स्मार्ट सिटी मिशन", category: "Smart City", budget: 1200e7, fundsReleased: 920e7, progressPct: 75, status: "In Progress", contractor: "NDMC / Tech Mahindra", startDate: new Date("2016-01-01"), expectedEnd: new Date("2026-12-31"), source: "NDMC / Smart City Mission" },
        { districtId: did, name: "Delhi CCTV Expansion Project (5 lakh cameras)", category: "Smart City", budget: 580e7, fundsReleased: 490e7, progressPct: 88, status: "In Progress", contractor: "GNCTD / BEL", startDate: new Date("2019-01-01"), expectedEnd: new Date("2026-06-30"), source: "GNCTD" },
      ]});
      console.log("  ✓ Infrastructure projects (21)");
    }

    // ── 7. Police Stations ────────────────────────────────────
    const existingPS = await client.policeStation.count({ where: { districtId: did } });
    if (existingPS === 0) {
      await client.policeStation.createMany({ data: [
        { districtId: did, name: "Parliament Street Police Station", address: "Parliament Street, New Delhi - 110001", phone: "011-23361000" },
        { districtId: did, name: "Tilak Marg Police Station", address: "Tilak Marg, New Delhi - 110001", phone: "011-23381476" },
        { districtId: did, name: "Connaught Place Police Station", address: "Connaught Place, New Delhi - 110001", phone: "011-23362800" },
        { districtId: did, name: "Chanakya Puri Police Station", address: "Chanakyapuri, New Delhi - 110021", phone: "011-26114800" },
        { districtId: did, name: "Tughlak Road Police Station", address: "Tughlak Road, New Delhi - 110011", phone: "011-23792600" },
        { districtId: did, name: "Barakhamba Road Police Station", address: "Barakhamba Road, New Delhi - 110001", phone: "011-23313400" },
        { districtId: did, name: "Mandir Marg Police Station", address: "Mandir Marg, New Delhi - 110001", phone: "011-23365400" },
      ]});
      console.log("  ✓ Police stations (7)");
    }

    // ── 8. Schools ────────────────────────────────────────────
    const existingSchools = await client.school.count({ where: { districtId: did } });
    if (existingSchools === 0) {
      await client.school.createMany({ data: [
        { districtId: did, name: "Govt Boys Senior Secondary School, Mandir Marg", type: "Government", level: "Senior Secondary", students: 1200, teachers: 42, studentTeacherRatio: 28.6, hasToilets: true, hasLibrary: true, hasLab: true, address: "Mandir Marg, New Delhi - 110001" },
        { districtId: did, name: "Govt Girls Senior Secondary School, Gol Market", type: "Government", level: "Senior Secondary", students: 980, teachers: 36, studentTeacherRatio: 27.2, hasToilets: true, hasLibrary: true, hasLab: true, address: "Gole Market, New Delhi - 110001" },
        { districtId: did, name: "Rajkiya Pratibha Vikas Vidyalaya (RPVV), Tyagraj Nagar", type: "Government", level: "Senior Secondary", students: 420, teachers: 28, studentTeacherRatio: 15.0, hasToilets: true, hasLibrary: true, hasLab: true, address: "Tyagraj Nagar, New Delhi - 110003" },
        { districtId: did, name: "Kendriya Vidyalaya, New Delhi (Gole Market)", type: "Central Govt", level: "Senior Secondary", students: 1800, teachers: 68, studentTeacherRatio: 26.5, hasToilets: true, hasLibrary: true, hasLab: true, address: "Gole Market, New Delhi - 110001" },
        { districtId: did, name: "Kendriya Vidyalaya, Andrews Ganj", type: "Central Govt", level: "Senior Secondary", students: 1500, teachers: 56, studentTeacherRatio: 26.8, hasToilets: true, hasLibrary: true, hasLab: true, address: "Andrews Ganj, New Delhi - 110049" },
        { districtId: did, name: "Kendriya Vidyalaya, Janpath", type: "Central Govt", level: "Senior Secondary", students: 1400, teachers: 52, studentTeacherRatio: 26.9, hasToilets: true, hasLibrary: true, hasLab: true, address: "Janpath, New Delhi - 110001" },
        { districtId: did, name: "Modern School, Barakhamba Road", type: "Private", level: "Senior Secondary", students: 3200, teachers: 180, studentTeacherRatio: 17.8, hasToilets: true, hasLibrary: true, hasLab: true, address: "Barakhamba Road, New Delhi - 110001" },
        { districtId: did, name: "Springdales School, Pusa Road", type: "Private", level: "Senior Secondary", students: 2800, teachers: 160, studentTeacherRatio: 17.5, hasToilets: true, hasLibrary: true, hasLab: true, address: "Pusa Road, New Delhi - 110005" },
        { districtId: did, name: "Convent of Jesus & Mary, Bangla Sahib Marg", type: "Private", level: "Senior Secondary", students: 2200, teachers: 120, studentTeacherRatio: 18.3, hasToilets: true, hasLibrary: true, hasLab: true, address: "Bangla Sahib Marg, New Delhi - 110001" },
        { districtId: did, name: "St. Columba's School, Ashoka Place", type: "Private", level: "Senior Secondary", students: 2600, teachers: 140, studentTeacherRatio: 18.6, hasToilets: true, hasLibrary: true, hasLab: true, address: "Ashoka Place, New Delhi - 110001" },
        { districtId: did, name: "Carmel Convent School, New Delhi", type: "Private", level: "Senior Secondary", students: 1800, teachers: 95, studentTeacherRatio: 18.9, hasToilets: true, hasLibrary: true, hasLab: true, address: "Bhai Vir Singh Marg, New Delhi - 110001" },
      ]});
      console.log("  ✓ Schools (11)");
    }

    // ── 9. Government Offices ─────────────────────────────────
    const existingOffices = await client.govOffice.count({ where: { districtId: did } });
    if (existingOffices === 0) {
      await client.govOffice.createMany({ data: [
        {
          districtId: did, name: "NDMC Head Office (Palika Kendra)", type: "Municipal Council",
          department: "New Delhi Municipal Council", address: "Palika Kendra, Sansad Marg, New Delhi - 110001",
          phone: "011-23364573", website: "ndmc.gov.in",
          mondayHours: "09:00-17:30", tuesdayHours: "09:00-17:30", wednesdayHours: "09:00-17:30",
          thursdayHours: "09:00-17:30", fridayHours: "09:00-17:30", lunchBreak: "13:00-13:30",
          services: ["Property Tax", "Water Connection", "Trade License", "Birth/Death Certificate", "Building Plan Approval"],
          active: true,
        },
        {
          districtId: did, name: "DDA Vikas Sadan", type: "Development Authority",
          department: "Delhi Development Authority", address: "INA, New Delhi - 110023",
          phone: "011-24617750", website: "dda.gov.in",
          mondayHours: "09:30-18:00", tuesdayHours: "09:30-18:00", wednesdayHours: "09:30-18:00",
          thursdayHours: "09:30-18:00", fridayHours: "09:30-18:00", lunchBreak: "13:00-13:30",
          services: ["Housing Allotment", "Layout Approval", "Land Pooling", "Conversion", "NOC"],
          active: true,
        },
        {
          districtId: did, name: "Delhi Secretariat", type: "State Government HQ",
          department: "GNCTD", address: "IP Estate, New Delhi - 110002",
          phone: "011-23392020", website: "delhi.gov.in",
          mondayHours: "09:30-18:00", tuesdayHours: "09:30-18:00", wednesdayHours: "09:30-18:00",
          thursdayHours: "09:30-18:00", fridayHours: "09:30-18:00", lunchBreak: "13:00-14:00",
          services: ["Government Services", "RTI Filing", "Public Grievance"],
          active: true,
        },
        {
          districtId: did, name: "SDM Office, New Delhi", type: "Sub-Divisional Magistrate",
          department: "Revenue Department", address: "New Delhi - 110001",
          phone: "011-23361700",
          mondayHours: "09:30-17:30", tuesdayHours: "09:30-17:30", wednesdayHours: "09:30-17:30",
          thursdayHours: "09:30-17:30", fridayHours: "09:30-17:30", lunchBreak: "13:00-14:00",
          services: ["Domicile Certificate", "Caste Certificate", "Income Certificate", "Marriage Registration", "Arms License"],
          active: true,
        },
        {
          districtId: did, name: "Patiala House Courts (District Court)", type: "District Court",
          department: "Judiciary", address: "India Gate Circle, New Delhi - 110001",
          phone: "011-23381024",
          mondayHours: "10:00-16:30", tuesdayHours: "10:00-16:30", wednesdayHours: "10:00-16:30",
          thursdayHours: "10:00-16:30", fridayHours: "10:00-16:30", saturdayHours: "10:00-13:00",
          services: ["Case Filing", "Certified Copies", "Legal Aid"],
          active: true,
        },
        {
          districtId: did, name: "Delhi High Court", type: "High Court",
          department: "Judiciary", address: "Shershah Road, New Delhi - 110003",
          phone: "011-23383612", website: "delhihighcourt.nic.in",
          mondayHours: "10:00-16:30", tuesdayHours: "10:00-16:30", wednesdayHours: "10:00-16:30",
          thursdayHours: "10:00-16:30", fridayHours: "10:00-16:30",
          services: ["PIL Filing", "Writ Petitions", "Certified Copies"],
          active: true,
        },
        {
          districtId: did, name: "DMRC Corporate Office (Metro Bhawan)", type: "Public Transport",
          department: "DMRC", address: "Fire Brigade Lane, Barakhamba Road, New Delhi - 110001",
          phone: "011-23417910", website: "delhimetrorail.com",
          mondayHours: "09:30-18:00", tuesdayHours: "09:30-18:00", wednesdayHours: "09:30-18:00",
          thursdayHours: "09:30-18:00", fridayHours: "09:30-18:00",
          services: ["Metro Card", "Lost & Found", "Advertising", "Property Leasing"],
          active: true,
        },
        {
          districtId: did, name: "Delhi Jal Board HQ (Varunalaya)", type: "Water Utility",
          department: "Delhi Jal Board", address: "Varunalaya, Phase-II, Karol Bagh, New Delhi - 110005",
          phone: "011-23527679", website: "delhijalboard.delhi.gov.in",
          mondayHours: "09:30-18:00", tuesdayHours: "09:30-18:00", wednesdayHours: "09:30-18:00",
          thursdayHours: "09:30-18:00", fridayHours: "09:30-18:00",
          services: ["Water Connection", "Billing", "Complaint", "Sewer Connection"],
          active: true,
        },
        {
          districtId: did, name: "Passport Office (Bhikaji Cama Place)", type: "Central Government",
          department: "Ministry of External Affairs", address: "Bhikaji Cama Place, New Delhi - 110066",
          phone: "011-26102005", website: "passportindia.gov.in",
          mondayHours: "09:00-17:00", tuesdayHours: "09:00-17:00", wednesdayHours: "09:00-17:00",
          thursdayHours: "09:00-17:00", fridayHours: "09:00-17:00",
          services: ["New Passport", "Passport Renewal", "Tatkaal Passport", "PCC"],
          active: true,
        },
        {
          districtId: did, name: "GPO New Delhi", type: "Post Office",
          department: "India Post", address: "Gol Dak Khana, New Delhi - 110001",
          phone: "011-23362691",
          mondayHours: "10:00-17:00", tuesdayHours: "10:00-17:00", wednesdayHours: "10:00-17:00",
          thursdayHours: "10:00-17:00", fridayHours: "10:00-17:00", saturdayHours: "10:00-13:00",
          services: ["Speed Post", "Registered Post", "Money Order", "Savings Account", "Aadhaar Update"],
          active: true,
        },
      ]});
      console.log("  ✓ Government offices (10)");
    }

    // ── 10. Schemes ───────────────────────────────────────────
    const existingSchemes = await client.scheme.count({ where: { districtId: did } });
    if (existingSchemes === 0) {
      await client.scheme.createMany({ data: [
        // CENTRAL
        { districtId: did, name: "PM-KISAN", nameLocal: "पीएम किसान", category: "Agriculture", amount: 6000, eligibility: "Small & marginal farmers owning up to 2 hectares of cultivable land", level: "Central", applyUrl: "pmkisan.gov.in", active: true },
        { districtId: did, name: "PMAY-Urban (Housing for All)", nameLocal: "प्रधानमंत्री आवास योजना — शहरी", category: "Housing", amount: 150000, eligibility: "EWS / LIG / MIG families without pucca house in urban areas", level: "Central", applyUrl: "pmayu.gov.in", active: true },
        { districtId: did, name: "PM-SVANidhi (Street Vendor)", category: "Employment", amount: 10000, eligibility: "Street vendors with certificate of vending or letter of recommendation", level: "Central", applyUrl: "pmsvanidhi.mohua.gov.in", active: true },
        { districtId: did, name: "Ayushman Bharat — PM-JAY", nameLocal: "आयुष्मान भारत", category: "Health", amount: 500000, eligibility: "BPL families — ₹5 lakh annual health cover per family", level: "Central", applyUrl: "pmjay.gov.in", active: true },
        { districtId: did, name: "PM Ujjwala Yojana", nameLocal: "प्रधानमंत्री उज्ज्वला योजना", category: "LPG", eligibility: "BPL women — free LPG connection", level: "Central", applyUrl: "pmuy.gov.in", active: true },
        // DELHI STATE
        { districtId: did, name: "Free Bus for Women (Pink Pass)", nameLocal: "महिलाओं के लिए मुफ्त बस (पिंक पास)", category: "Transport", eligibility: "All women — free travel on DTC and cluster buses", level: "State", applyUrl: "transport.delhi.gov.in", active: true },
        { districtId: did, name: "Free Water (20 KL/month)", nameLocal: "मुफ्त पानी (20 KL/माह)", category: "Water", eligibility: "All households consuming up to 20,000 litres/month — zero water bill", level: "State", applyUrl: "delhijalboard.delhi.gov.in", active: true },
        { districtId: did, name: "Free Electricity (up to 200 units)", nameLocal: "मुफ्त बिजली (200 यूनिट तक)", category: "Electricity", eligibility: "All domestic consumers using up to 200 units/month — zero electricity bill", level: "State", applyUrl: "delhi.gov.in", active: true },
        { districtId: did, name: "Ladli Yojana (Girl Child)", nameLocal: "लाड़ली योजना", category: "Women & Child", amount: 100000, eligibility: "Families with girl child born in Delhi — financial assistance up to ₹1 lakh", level: "State", applyUrl: "wcddel.in", active: true },
        { districtId: did, name: "Delhi e-District Services", nameLocal: "दिल्ली ई-डिस्ट्रिक्ट सेवाएं", category: "Certificates", eligibility: "All Delhi residents — online certificate issuance", level: "State", applyUrl: "edistrict.delhigovt.nic.in", active: true },
        { districtId: did, name: "Mission Buniyaad (Education)", nameLocal: "मिशन बुनियाद", category: "Education", eligibility: "Government school students with learning gaps", level: "State", applyUrl: "edudel.nic.in", active: true },
        { districtId: did, name: "Delhi Startup Policy", nameLocal: "दिल्ली स्टार्टअप नीति", category: "Employment", eligibility: "Startups registered in Delhi — incubation, funding, mentorship", level: "State", applyUrl: "startup.delhi.gov.in", active: true },
      ]});
      console.log("  ✓ Schemes (12)");
    }

    // ── 11. Election Results ──────────────────────────────────
    const existingElec = await client.electionResult.count({ where: { districtId: did } });
    if (existingElec === 0) {
      await client.electionResult.createMany({ data: [
        // Lok Sabha 2024 — New Delhi constituency
        { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "New Delhi", winnerName: "Bansuri Swaraj", winnerParty: "BJP", winnerVotes: 467078, runnerUpName: "Somnath Bharti", runnerUpParty: "AAP", runnerUpVotes: 322345, totalVoters: 1450000, votesPolled: 860000, turnoutPct: 59.3, margin: 144733, source: "Election Commission of India" },
        // Delhi Assembly 2025 — New Delhi constituency
        { districtId: did, year: 2025, electionType: "ASSEMBLY", constituency: "New Delhi", winnerName: "Arvind Kejriwal", winnerParty: "AAP", winnerVotes: 48000, runnerUpName: "Parvesh Verma", runnerUpParty: "BJP", runnerUpVotes: 52000, totalVoters: 160000, votesPolled: 108000, turnoutPct: 67.5, margin: -4000, source: "State Election Commission Delhi" },
        { districtId: did, year: 2025, electionType: "ASSEMBLY", constituency: "Kasturba Nagar", winnerName: "Alka Lamba", winnerParty: "INC", winnerVotes: 42000, runnerUpName: "Challenger", runnerUpParty: "AAP", runnerUpVotes: 35000, totalVoters: 145000, votesPolled: 95000, turnoutPct: 65.5, margin: 7000, source: "State Election Commission Delhi" },
      ]});
      console.log("  ✓ Election results (3)");
    }

    // ── 12. Court Stats ───────────────────────────────────────
    const existingCourt = await client.courtStat.count({ where: { districtId: did } });
    if (existingCourt === 0) {
      await client.courtStat.createMany({ data: [
        { districtId: did, year: 2024, courtName: "Patiala House Courts — District & Sessions", filed: 12800, disposed: 10400, pending: 42000, avgDays: 210 },
        { districtId: did, year: 2024, courtName: "Patiala House Courts — Metropolitan Magistrate", filed: 28400, disposed: 24800, pending: 78000, avgDays: 155 },
        { districtId: did, year: 2024, courtName: "Family Court, Patiala House", filed: 3200, disposed: 2800, pending: 8400, avgDays: 180 },
        { districtId: did, year: 2023, courtName: "Patiala House Courts — District & Sessions", filed: 11600, disposed: 9800, pending: 39600, avgDays: 218 },
        { districtId: did, year: 2023, courtName: "Patiala House Courts — Metropolitan Magistrate", filed: 26800, disposed: 23200, pending: 74400, avgDays: 162 },
      ]});
      console.log("  ✓ Court stats (5)");
    }

    // ── 13. RTI Templates ─────────────────────────────────────
    const existingRTI = await client.rtiTemplate.count({ where: { districtId: did } });
    if (existingRTI === 0) {
      await client.rtiTemplate.createMany({ data: [
        {
          districtId: did, topic: "DDA Housing Allotment Status", topicLocal: "डीडीए आवास आवंटन स्थिति",
          department: "Delhi Development Authority",
          pioAddress: "CPIO, DDA, Vikas Sadan, INA, New Delhi - 110023",
          feeAmount: "₹10 (IPO/DD/Court Fee Stamp payable to PAO, DDA)",
          templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Status of my housing application under DDA Scheme [year].
2. Total number of applications received and allotments made.
3. Criteria and process followed for allotment.
4. Expected timeline for remaining allotments.

Applicant: [Your Name]
Address: [Your Address]
Mobile: [Mobile Number]
Date: [Date]`,
          tips: "DDA has a dedicated RTI portal at dda.gov.in. You can also file online via rtionline.gov.in.",
        },
        {
          districtId: did, topic: "Delhi Jal Board Water Supply & Billing", topicLocal: "दिल्ली जल बोर्ड जल आपूर्ति एवं बिलिंग",
          department: "Delhi Jal Board",
          pioAddress: "CPIO, DJB, Varunalaya, Karol Bagh, New Delhi - 110005",
          feeAmount: "₹10",
          templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information:
1. Water supply schedule for [area name / zone].
2. Total water production vs distribution loss percentage.
3. Details of new pipeline projects approved for [area].
4. Billing methodology and subsidy applied to my account [Consumer ID].

Applicant: [Your Name]
Address: [Your Address]`,
          tips: "DJB RTI responses tend to take 25-30 days. File first appeal if delayed.",
        },
        {
          districtId: did, topic: "NDMC Services & Property Tax", topicLocal: "एनडीएमसी सेवाएं और संपत्ति कर",
          department: "New Delhi Municipal Council",
          pioAddress: "CPIO, NDMC, Palika Kendra, Sansad Marg, New Delhi - 110001",
          feeAmount: "₹10",
          templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information:
1. Property tax assessment methodology for [property address].
2. Revenue collected from NDMC area in FY [year].
3. Details of civic amenities / maintenance contracts in [area].
4. Grievance redressal status for complaint number [number].

Applicant: [Your Name]
Address: [Your Address]`,
          tips: "NDMC covers only New Delhi district area. For rest of Delhi, file with MCD.",
        },
        {
          districtId: did, topic: "Delhi Metro Project Status", topicLocal: "दिल्ली मेट्रो परियोजना स्थिति",
          department: "Delhi Metro Rail Corporation",
          pioAddress: "CPIO, DMRC, Metro Bhawan, Barakhamba Road, New Delhi - 110001",
          feeAmount: "₹10",
          templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information:
1. Current status of Metro Phase [specify] construction in [corridor name].
2. Total expenditure incurred vs sanctioned budget.
3. Expected completion date and reasons for any delay.
4. Land acquisition status and compensation paid.

Applicant: [Your Name]
Address: [Your Address]`,
          tips: "DMRC is a central-state JV with strong RTI compliance. Expect response within 20 days.",
        },
      ]});
      console.log("  ✓ RTI templates (4)");
    }

    // ── 14. Famous Personalities ──────────────────────────────
    const existingFP = await client.famousPersonality.count({ where: { districtId: did } });
    if (existingFP === 0) {
      await client.famousPersonality.createMany({ data: [
        { districtId: did, name: "Shah Jahan", nameLocal: "शाहजहाँ", category: "Historical Ruler", bio: "Mughal Emperor who built Shahjahanabad (Old Delhi), Red Fort, and the Jama Masjid.", birthYear: 1592, deathYear: 1666, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Shah_Jahan", source: "wikipedia" },
        { districtId: did, name: "Bahadur Shah Zafar", nameLocal: "बहादुर शाह ज़फ़र", category: "Historical Ruler", bio: "Last Mughal emperor, symbolized India's 1857 uprising against British rule.", birthYear: 1775, deathYear: 1862, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Bahadur_Shah_Zafar", source: "wikipedia" },
        { districtId: did, name: "Amir Khusrau", nameLocal: "अमीर खुसरो", category: "Literature", bio: "Sufi poet, musician, and scholar — father of Qawwali and Hindi poetry.", birthYear: 1253, deathYear: 1325, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Amir_Khusrau", source: "wikipedia" },
        { districtId: did, name: "Mirza Ghalib", nameLocal: "मिर्ज़ा ग़ालिब", category: "Literature", bio: "Legendary Urdu and Persian poet who lived in Delhi's Ballimaran.", birthYear: 1797, deathYear: 1869, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Mirza_Ghalib", source: "wikipedia" },
        { districtId: did, name: "Rajiv Gandhi", nameLocal: "राजीव गांधी", category: "Politics", bio: "6th Prime Minister of India, born in New Delhi, modernized India's telecom and IT sectors.", birthYear: 1944, deathYear: 1991, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Rajiv_Gandhi", source: "wikipedia" },
        { districtId: did, name: "Sushma Swaraj", nameLocal: "सुषमा स्वराज", category: "Politics", bio: "Former External Affairs Minister, represented New Delhi Lok Sabha constituency.", birthYear: 1952, deathYear: 2019, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Sushma_Swaraj", source: "wikipedia" },
        { districtId: did, name: "Virat Kohli", nameLocal: "विराट कोहली", category: "Sports", bio: "One of the greatest cricketers of all time, born and raised in Delhi.", birthYear: 1988, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Virat_Kohli", source: "wikipedia" },
        { districtId: did, name: "A.P.J. Abdul Kalam", nameLocal: "ए.पी.जे. अब्दुल कलाम", category: "Science / Politics", bio: "Missile Man of India, 11th President, served at Rashtrapati Bhavan in New Delhi.", birthYear: 1931, deathYear: 2015, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/A._P._J._Abdul_Kalam", source: "wikipedia" },
      ]});
      console.log("  ✓ Famous personalities (8)");
    }

    // ── 15. Local Industries ──────────────────────────────────
    const existingLI = await client.localIndustry.count({ where: { districtId: did } });
    if (existingLI === 0) {
      await client.localIndustry.createMany({ data: [
        { districtId: did, name: "Connaught Place", nameLocal: "कनॉट प्लेस", type: "Market", category: "Market", location: "Connaught Place, New Delhi", latitude: 28.6315, longitude: 77.2167, details: { description: "Central business district and iconic commercial hub of Delhi", established: 1933 }, active: true, source: "NDMC" },
        { districtId: did, name: "Nehru Place", nameLocal: "नेहरू प्लेस", type: "IT Market", category: "IT Park", location: "Nehru Place, New Delhi", latitude: 28.5487, longitude: 77.2528, details: { description: "Asia's largest IT hardware and software market", established: 1980 }, active: true, source: "DDA" },
        { districtId: did, name: "INA Market", nameLocal: "आई.एन.ए. मार्केट", type: "Market", category: "Market", location: "INA Colony, New Delhi", latitude: 28.5742, longitude: 77.2098, details: { description: "Famous for imported food items, spices, and gourmet products" }, active: true, source: "NDMC" },
        { districtId: did, name: "Khan Market", nameLocal: "खान मार्केट", type: "Market", category: "Market", location: "Khan Market, New Delhi", latitude: 28.6003, longitude: 77.2270, details: { description: "One of the most expensive retail locations in the world, upscale shopping", established: 1951 }, active: true, source: "NDMC" },
        { districtId: did, name: "Pragati Maidan", nameLocal: "प्रगति मैदान", type: "Exhibition Centre", category: "Exhibition", location: "Pragati Maidan, New Delhi", latitude: 28.6183, longitude: 77.2447, details: { description: "India's premier trade fair and convention center — ITPO complex", established: 1972 }, active: true, source: "ITPO" },
      ]});
      console.log("  ✓ Local industries (5)");
    }

    // ── 16. Bus Routes ────────────────────────────────────────
    const existingBus = await client.busRoute.count({ where: { districtId: did } });
    if (existingBus === 0) {
      await client.busRoute.createMany({ data: [
        { districtId: did, routeNumber: "604", origin: "ISBT Kashmere Gate", destination: "Mehrauli", via: "Chandni Chowk, Connaught Place, AIIMS, Qutub Minar", operator: "DTC", busType: "AC Low Floor", departureTime: "05:30", frequency: "Every 15 min", fare: 25, duration: "1h 20min" },
        { districtId: did, routeNumber: "522", origin: "ISBT Kashmere Gate", destination: "Saket", via: "ITO, India Gate, Lodhi Road", operator: "DTC", busType: "Non-AC", departureTime: "05:30", frequency: "Every 10 min", fare: 15, duration: "1h" },
        { districtId: did, routeNumber: "764", origin: "Minto Road", destination: "IGI Airport Terminal 3", via: "RK Ashram, Patel Nagar, Dhaula Kuan", operator: "DTC", busType: "AC Low Floor", departureTime: "06:00", frequency: "Every 20 min", fare: 30, duration: "50min" },
        { districtId: did, routeNumber: "429", origin: "Kendriya Terminal (ISBT)", destination: "Connaught Place", via: "Red Fort, Chandni Chowk, Old Delhi Railway Stn", operator: "DTC", busType: "Non-AC", departureTime: "05:15", frequency: "Every 10 min", fare: 10, duration: "40min" },
        { districtId: did, routeNumber: "990", origin: "Anand Vihar ISBT", destination: "Connaught Place", via: "ITO, Pragati Maidan", operator: "Cluster Bus", busType: "AC Low Floor", departureTime: "06:00", frequency: "Every 15 min", fare: 25, duration: "55min" },
      ]});
      console.log("  ✓ Bus routes (5)");
    }

    // ── 17. Train Schedules ───────────────────────────────────
    const existingTrain = await client.trainSchedule.count({ where: { districtId: did } });
    if (existingTrain === 0) {
      await client.trainSchedule.createMany({ data: [
        { districtId: did, trainNumber: "12952", trainName: "Mumbai Rajdhani Express", origin: "New Delhi", destination: "Mumbai Central", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "16:25", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "12302", trainName: "Howrah Rajdhani Express", origin: "New Delhi", destination: "Howrah Jn", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "16:55", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "12622", trainName: "Tamil Nadu Express", origin: "New Delhi", destination: "Chennai Central", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "22:30", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "12002", trainName: "Bhopal Shatabdi Express", origin: "New Delhi", destination: "Bhopal Jn", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "06:15", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "12046", trainName: "Chandigarh Shatabdi Express", origin: "New Delhi", destination: "Chandigarh", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "07:40", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "12050", trainName: "Gatimaan Express (Delhi-Agra)", origin: "Hazrat Nizamuddin", destination: "Agra Cantt", stationName: "Hazrat Nizamuddin", arrivalTime: "--", departureTime: "08:10", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        { districtId: did, trainNumber: "22436", trainName: "Vande Bharat Express (Delhi-Varanasi)", origin: "New Delhi", destination: "Varanasi", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "06:00", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
        { districtId: did, trainNumber: "12424", trainName: "Dibrugarh Rajdhani Express", origin: "New Delhi", destination: "Dibrugarh", stationName: "New Delhi Railway Station", arrivalTime: "--", departureTime: "18:00", daysOfWeek: ["Tue","Thu","Sat"] },
      ]});
      console.log("  ✓ Train schedules (8)");
    }

    // ── 18. Service Guides ────────────────────────────────────
    const existingSG = await client.serviceGuide.count({ where: { districtId: did } });
    if (existingSG === 0) {
      await client.serviceGuide.createMany({ data: [
        {
          districtId: did, serviceName: "Birth Certificate", serviceNameLocal: "जन्म प्रमाणपत्र",
          category: "Certificates", office: "MCD / NDMC", officeLocal: "एमसीडी / एनडीएमसी",
          documentsNeeded: ["Hospital Discharge Summary", "Parents' Aadhaar Card", "Marriage Certificate", "Address Proof"],
          fees: "Free (within 21 days), ₹50 (late registration)", timeline: "7-15 days",
          onlinePortal: "e-District Delhi", onlineUrl: "edistrict.delhigovt.nic.in",
          steps: ["Visit edistrict.delhigovt.nic.in", "Select 'Birth Certificate' under Revenue Dept.", "Upload required documents", "Pay fee if applicable", "Track status with application number", "Collect certificate or download"],
        },
        {
          districtId: did, serviceName: "Domicile Certificate", serviceNameLocal: "निवास प्रमाणपत्र",
          category: "Certificates", office: "SDM Office, Revenue Department",
          documentsNeeded: ["Aadhaar Card", "Voter ID / Ration Card", "Electricity Bill (3 years)", "School Certificate"],
          fees: "Free", timeline: "15-30 days",
          onlinePortal: "e-District Delhi", onlineUrl: "edistrict.delhigovt.nic.in",
          steps: ["Apply online at edistrict.delhigovt.nic.in", "Upload address and identity proofs", "Visit SDM office for verification if called", "Track status online", "Download certificate from portal"],
        },
        {
          districtId: did, serviceName: "Caste Certificate", serviceNameLocal: "जाति प्रमाणपत्र",
          category: "Certificates", office: "SDM Office via e-District",
          documentsNeeded: ["Aadhaar Card", "Father's Caste Certificate", "School Certificate (Class 10)", "Affidavit"],
          fees: "Free", timeline: "15-30 days",
          onlinePortal: "e-District Delhi", onlineUrl: "edistrict.delhigovt.nic.in",
          steps: ["Apply online at edistrict.delhigovt.nic.in", "Select 'Caste Certificate'", "Upload documents", "Visit SDM office for verification", "Collect certificate"],
        },
        {
          districtId: did, serviceName: "Driving License", serviceNameLocal: "ड्राइविंग लाइसेंस",
          category: "Transport", office: "Transport Department, GNCTD",
          documentsNeeded: ["Learner's License", "Aadhaar Card", "Address Proof", "Medical Certificate (Form 1-A)", "Passport Photos"],
          fees: "₹200 + ₹50 smart card fee", timeline: "7-14 days",
          onlinePortal: "Parivahan", onlineUrl: "sarathi.parivahan.gov.in",
          steps: ["Apply online at sarathi.parivahan.gov.in", "Book test slot at nearest RTO", "Appear for driving test", "Pay fees online", "Receive smart card DL by post"],
        },
        {
          districtId: did, serviceName: "Property Registration", serviceNameLocal: "संपत्ति पंजीकरण",
          category: "Property", office: "Sub-Registrar Office",
          documentsNeeded: ["Sale Deed (2 copies)", "Identity Proof (buyer & seller)", "NOC from Society/DDA", "Latest Property Tax Receipt", "Photographs (2 each)"],
          fees: "6% stamp duty (men), 4% (women) + 1% registration fee", timeline: "Same day (if documents complete)",
          onlinePortal: "DORIS", onlineUrl: "doris.delhigovt.nic.in",
          steps: ["Get stamp duty paid via e-Stamp", "Book appointment on DORIS portal", "Visit Sub-Registrar office with all parties", "Submit documents and biometrics", "Collect registered deed"],
        },
        {
          districtId: did, serviceName: "Ration Card", serviceNameLocal: "राशन कार्ड",
          category: "Food Security", office: "Food & Civil Supplies Dept",
          documentsNeeded: ["Aadhaar Card (all family members)", "Address Proof", "Income Certificate", "Passport Photos"],
          fees: "Free", timeline: "15-30 days",
          onlinePortal: "NFS Delhi", onlineUrl: "nfs.delhi.gov.in",
          steps: ["Apply online at nfs.delhi.gov.in", "Upload all documents", "Schedule inspection visit", "Receive ration card after verification"],
        },
        {
          districtId: did, serviceName: "Marriage Registration", serviceNameLocal: "विवाह पंजीकरण",
          category: "Certificates", office: "SDM Office",
          documentsNeeded: ["Aadhaar Card (both spouses)", "Marriage Invitation Card / Photos", "Affidavit on ₹10 stamp paper", "3 Witnesses with ID proof"],
          fees: "₹100", timeline: "15-30 days",
          onlinePortal: "e-District Delhi", onlineUrl: "edistrict.delhigovt.nic.in",
          steps: ["Apply online at edistrict.delhigovt.nic.in", "Upload marriage proof and IDs", "Visit SDM office with witnesses", "Receive marriage certificate"],
        },
        {
          districtId: did, serviceName: "Senior Citizen Card", serviceNameLocal: "वरिष्ठ नागरिक कार्ड",
          category: "Social Welfare", office: "Social Welfare Department",
          documentsNeeded: ["Aadhaar Card", "Age Proof (birth certificate / passport)", "Address Proof", "Passport Photo"],
          fees: "Free", timeline: "15 days",
          onlinePortal: "e-District Delhi", onlineUrl: "edistrict.delhigovt.nic.in",
          steps: ["Apply online or visit District Social Welfare Office", "Submit age and address proof", "Collect card after verification"],
        },
      ]});
      console.log("  ✓ Service guides (8)");
    }

    // ── 19. Citizen Tips ──────────────────────────────────────
    const existingCT = await client.citizenTip.count({ where: { districtId: did } });
    if (existingCT === 0) {
      await client.citizenTip.createMany({ data: [
        { districtId: did, category: "Transport", title: "Use Delhi Metro for CBD Access", description: "Rajiv Chowk (Yellow/Blue Line) and Central Secretariat (Yellow/Violet) stations serve the New Delhi district core. Metro is far faster than driving during peak hours (8:30-10:30 AM, 5-8 PM).", priority: 1, icon: "🚇", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Water", title: "Free Water: Check Your DJB Bill", description: "Delhi provides free water for consumption up to 20,000 litres/month. Check your DJB bill online at delhijalboard.delhi.gov.in. Report leaks to 1916 helpline.", priority: 2, icon: "💧", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Air Quality", title: "Check AQI Before Outdoor Activity", description: "Delhi's AQI regularly exceeds 300 (Hazardous) from October to February. Check air.delhi.gov.in or SAFAR app before outdoor exercise. Use N95 masks when AQI > 200.", priority: 1, icon: "🌫️", isDistrictSpecific: true, seasonalMonths: [10, 11, 12, 1, 2], active: true },
        { districtId: did, category: "Health", title: "Mohalla Clinics — Free Primary Healthcare", description: "Delhi government runs 500+ Mohalla Clinics providing free consultations, tests, and medicines. Find your nearest clinic at mohallaclinic.delhi.gov.in.", priority: 2, icon: "🏥", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Electricity", title: "Free Electricity: Up to 200 Units", description: "Delhi residents consuming up to 200 units/month get zero electricity bill. Check your BSES or Tata Power bill. Apply for subsidy benefit if not auto-applied.", priority: 2, icon: "⚡", isDistrictSpecific: true, seasonalMonths: [], active: true },
      ]});
      console.log("  ✓ Citizen tips (5)");
    }

    // ── 20. Crime Stats ───────────────────────────────────────
    const existingCrime = await client.crimeStat.count({ where: { districtId: did } });
    if (existingCrime === 0) {
      await client.crimeStat.createMany({ data: [
        { districtId: did, year: 2023, category: "IPC Crimes Total", count: 3280, source: "NCRB / delhipolice.gov.in" },
        { districtId: did, year: 2023, category: "Crimes Against Women", count: 420, source: "NCRB" },
        { districtId: did, year: 2023, category: "Theft & Burglary", count: 980, source: "NCRB" },
        { districtId: did, year: 2023, category: "Cyber Crimes", count: 640, source: "Delhi Police CyPAD" },
        { districtId: did, year: 2022, category: "IPC Crimes Total", count: 3120, source: "NCRB" },
        { districtId: did, year: 2022, category: "Crimes Against Women", count: 395, source: "NCRB" },
      ]});
      console.log("  ✓ Crime stats (6)");
    }

    // ── 21. RTI Stats ─────────────────────────────────────────
    const existingRtiStat = await client.rtiStat.count({ where: { districtId: did } });
    if (existingRtiStat === 0) {
      await client.rtiStat.createMany({ data: [
        { districtId: did, year: 2024, month: 1, department: "NDMC", filed: 420, disposed: 380, pending: 40, avgDays: 22.5, source: "CIC Delhi" },
        { districtId: did, year: 2024, month: 1, department: "DDA", filed: 680, disposed: 590, pending: 90, avgDays: 26.8, source: "CIC Delhi" },
        { districtId: did, year: 2024, month: 1, department: "Delhi Jal Board", filed: 320, disposed: 270, pending: 50, avgDays: 28.4, source: "CIC Delhi" },
        { districtId: did, year: 2024, month: 1, department: "DMRC", filed: 280, disposed: 260, pending: 20, avgDays: 18.6, source: "CIC Delhi" },
        { districtId: did, year: 2024, month: 1, department: "Revenue (SDM Office)", filed: 180, disposed: 155, pending: 25, avgDays: 24.2, source: "CIC Delhi" },
      ]});
      console.log("  ✓ RTI stats (5)");
    }

    console.log("\n✅ New Delhi district data seeding complete!");

  } finally {
    if (standalone) await client.$disconnect();
  }
}

// Run standalone
if (require.main === module || process.argv[1]?.endsWith("seed-delhi-data.ts")) {
  seedDelhiData()
    .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); });
}
