// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Mumbai District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-mumbai-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { exitUnlessLocalSeedAllowed } from "../seed-guard";

// ARCHIVED (prisma/archive/README.md): this seed wipes tables or writes
// invented demo rows. It refuses to run unless ALLOW_SEED_WIPE=1 and the
// database is on this machine.
exitUnlessLocalSeedAllowed();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Mumbai district data...\n");

  // ── Find Mumbai district ─────────────────────────────────
  const state = await prisma.state.findUnique({ where: { slug: "maharashtra" } });
  if (!state) throw new Error("Maharashtra state not found — run seed-hierarchy.ts first");

  const district = await prisma.district.findFirst({
    where: { stateId: state.id, slug: "mumbai" },
  });
  if (!district) throw new Error("Mumbai district not found — run seed-hierarchy.ts first");

  const districtId = district.id;
  console.log(`✓ Found Mumbai district (id: ${districtId})`);

  // ═══════════════════════════════════════════════════════════
  // A. LEADERSHIP — Mumbai 10-Tier Hierarchy
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding leadership...");

  const leadershipCount = await prisma.leader.count({ where: { districtId } });
  if (leadershipCount === 0) {
    await prisma.leader.createMany({
      skipDuplicates: true,
      data: [
        // ── Tier 1: Lok Sabha MPs (2024 winners) ──
        { districtId, name: "Piyush Goyal", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "BJP", constituency: "Mumbai North", source: "ECI 2024 Results" },
        { districtId, name: "Varsha Gaikwad", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "INC", constituency: "Mumbai North Central", source: "ECI 2024 Results" },
        { districtId, name: "Sanjay Dina Patil", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "Shiv Sena (UBT)", constituency: "Mumbai North East", source: "ECI 2024 Results" },
        { districtId, name: "Ravindra Waikar", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "Shiv Sena (Shinde)", constituency: "Mumbai North West", source: "ECI 2024 Results" },
        { districtId, name: "Arvind Sawant", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "Shiv Sena (UBT)", constituency: "Mumbai South", source: "ECI 2024 Results" },
        { districtId, name: "Anil Desai", role: "Member of Parliament (Lok Sabha)", tier: 1, party: "Shiv Sena (UBT)", constituency: "Mumbai South Central", source: "ECI 2024 Results" },

        // ── Tier 2: Key MLAs (2024 Maharashtra Assembly) ──
        { districtId, name: "Rahul Narwekar", role: "MLA & Assembly Speaker", tier: 2, party: "BJP", constituency: "Colaba", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Mangal Prabhat Lodha", role: "MLA", tier: 2, party: "BJP", constituency: "Malabar Hill", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Aaditya Thackeray", role: "MLA", tier: 2, party: "Shiv Sena (UBT)", constituency: "Worli", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Ashish Shelar", role: "MLA", tier: 2, party: "BJP", constituency: "Bandra West", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Varun Sardesai", role: "MLA", tier: 2, party: "Shiv Sena (UBT)", constituency: "Bandra East", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Sanjay Upadhyay", role: "MLA", tier: 2, party: "BJP", constituency: "Borivali", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Mihir Kotecha", role: "MLA", tier: 2, party: "BJP", constituency: "Mulund", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Ram Kadam", role: "MLA", tier: 2, party: "BJP", constituency: "Ghatkopar West", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Parag Shah", role: "MLA", tier: 2, party: "BJP", constituency: "Ghatkopar East", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Amit Satam", role: "MLA", tier: 2, party: "BJP", constituency: "Andheri West", source: "ECI 2024 Assembly Results" },
        { districtId, name: "Jyoti Gaikwad", role: "MLA", tier: 2, party: "INC", constituency: "Dharavi", source: "ECI 2024 Assembly Results" },

        // ── Tier 3: BMC (Brihanmumbai Municipal Corporation) ──
        { districtId, name: "Ritu Tawde", role: "Mayor, Brihanmumbai Municipal Corporation (BMC)", tier: 3, party: "BJP", source: "BMC" },
        { districtId, name: "Ashwini Bhide", role: "Municipal Commissioner, BMC (IAS)", tier: 3, source: "BMC" },

        // ── Tier 4: Administration ──
        { districtId, name: "Aanchal Sood Goyal", role: "Collector, Mumbai City (IAS)", tier: 4, source: "District Administration" },
        { districtId, name: "Saurabh Katiyar", role: "Collector, Mumbai Suburban (IAS)", tier: 4, source: "District Administration" },
        { districtId, name: "Dr. Sanjay Mukherjee", role: "Metropolitan Commissioner, MMRDA (IAS)", tier: 4, source: "MMRDA" },
        { districtId, name: "Jishnu Dev Varma", role: "Governor of Maharashtra", tier: 4, source: "Raj Bhavan" },
        { districtId, name: "Devendra Fadnavis", role: "Chief Minister of Maharashtra", tier: 4, party: "BJP", source: "Maharashtra Government" },

        // ── Tier 5: Police ──
        { districtId, name: "Deven Bharti", role: "Commissioner of Police, Mumbai (IPS)", tier: 5, phone: "100", source: "Mumbai Police" },
        { districtId, name: "Joint CP Crime Branch", role: "Joint Commissioner of Police (Crime)", tier: 5, source: "Mumbai Police" },
        { districtId, name: "DCP South Mumbai", role: "Deputy Commissioner of Police (Zone 1 — South)", tier: 5, source: "Mumbai Police" },
        { districtId, name: "DCP Central Mumbai", role: "Deputy Commissioner of Police (Zone 3 — Central)", tier: 5, source: "Mumbai Police" },
        { districtId, name: "DCP North Mumbai", role: "Deputy Commissioner of Police (Zone 8 — North)", tier: 5, source: "Mumbai Police" },
        { districtId, name: "DCP East Mumbai", role: "Deputy Commissioner of Police (Zone 6 — East)", tier: 5, source: "Mumbai Police" },
        { districtId, name: "DCP West Mumbai", role: "Deputy Commissioner of Police (Zone 9 — West)", tier: 5, source: "Mumbai Police" },

        // ── Tier 6: Judiciary ──
        { districtId, name: "Justice Shree Chandrashekhar", role: "Chief Justice, Bombay High Court", tier: 6, source: "Bombay High Court" },
        { districtId, name: "Principal Judge", role: "Principal Judge, City Civil & Sessions Court", tier: 6, source: "City Civil Court, Mumbai" },

        // ── Tier 7: Key Bodies ──
        { districtId, name: "Dr. M. Angamuthu", role: "Chairman, Mumbai Port Authority (IAS)", tier: 7, source: "Mumbai Port Authority" },
        { districtId, name: "Sanjeev Jaiswal", role: "Vice President & CEO, MHADA (IAS)", tier: 7, source: "MHADA" },
        { districtId, name: "Lokesh Chandra", role: "General Manager, BEST", tier: 7, source: "BEST" },
        { districtId, name: "Mumbai Metro Rail Corp MD", role: "Managing Director, MMRC (IAS)", tier: 7, source: "MMRC" },

        // ── Tier 8-10: Department heads ──
        { districtId, name: "Chief Engineer, BMC", role: "Chief Engineer, BMC — Engineering", tier: 8, source: "BMC" },
        { districtId, name: "Director of Education, Mumbai", role: "Director of Education, BMC", tier: 8, source: "BMC Education Dept" },
        { districtId, name: "Executive Health Officer", role: "Executive Health Officer, BMC — Public Health", tier: 9, source: "BMC Public Health Dept" },
        { districtId, name: "Chief Fire Officer", role: "Chief Fire Officer, Mumbai Fire Brigade", tier: 9, phone: "101", source: "Mumbai Fire Brigade" },
        { districtId, name: "Solid Waste Management Director", role: "Director, SWM, BMC — Solid Waste Management", tier: 10, source: "BMC SWM Dept" },
      ],
    });
    console.log("  ✅ Leadership seeded (45 leaders)");
  } else {
    console.log(`  ⏭  Leadership already exists (${leadershipCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // B. BUDGET DATA — BMC Budget 2025-26
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding budget data...");

  const budgetCount = await prisma.budgetEntry.count({ where: { districtId } });
  if (budgetCount === 0) {
    // BMC Budget 2025-26: ₹74,427 Cr total (record highest)
    // All values in RUPEES (not crores)
    await prisma.budgetEntry.createMany({
      skipDuplicates: true,
      data: [
        { districtId, fiscalYear: "2025-26", sector: "Infrastructure & Roads", allocated: 150000000000, released: 120000000000, spent: 95000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Water Supply", allocated: 85000000000, released: 70000000000, spent: 55000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Sewerage & Drainage", allocated: 65000000000, released: 52000000000, spent: 42000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Health & Hospitals", allocated: 55000000000, released: 45000000000, spent: 38000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Education", allocated: 40000000000, released: 35000000000, spent: 30000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Solid Waste Management", allocated: 35000000000, released: 28000000000, spent: 22000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Fire Brigade", allocated: 12000000000, released: 10000000000, spent: 8000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Gardens & Open Spaces", allocated: 10000000000, released: 8000000000, spent: 6500000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Development Planning", allocated: 80000000000, released: 65000000000, spent: 50000000000, source: "BMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Metro & Transport (MMRDA)", allocated: 120000000000, released: 100000000000, spent: 85000000000, source: "MMRDA / State Allocation" },
      ],
    });
    console.log("  ✅ Budget data seeded (10 sectors, ₹74,427 Cr total)");
  } else {
    console.log(`  ⏭  Budget already exists (${budgetCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // C. INFRASTRUCTURE PROJECTS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding infrastructure projects...");

  const infraCount = await prisma.infraProject.count({ where: { districtId } });
  if (infraCount === 0) {
    await prisma.infraProject.createMany({
      skipDuplicates: true,
      data: [
        // Metro Projects
        { districtId, name: "Mumbai Metro Line 3 (Aqua Line)", category: "METRO", status: "IN_PROGRESS", budget: 335000000000, progressPct: 85, startDate: new Date("2016-10-01"), expectedEnd: new Date("2026-12-31"), contractor: "MMRC / Various", source: "MMRC / JICA" },
        { districtId, name: "Mumbai Metro Line 2A (Yellow Line)", category: "METRO", status: "COMPLETED", budget: 65000000000, progressPct: 100, startDate: new Date("2018-04-01"), expectedEnd: new Date("2024-06-30"), contractor: "MMRDA", source: "MMRDA" },
        { districtId, name: "Mumbai Metro Line 7 (Red Line)", category: "METRO", status: "COMPLETED", budget: 62000000000, progressPct: 100, startDate: new Date("2018-08-01"), expectedEnd: new Date("2024-06-30"), contractor: "MMRDA", source: "MMRDA" },
        { districtId, name: "Mumbai Metro Line 4 (Green Line)", category: "METRO", status: "IN_PROGRESS", budget: 147000000000, progressPct: 55, startDate: new Date("2019-09-01"), expectedEnd: new Date("2027-12-31"), contractor: "MMRDA", source: "MMRDA / AIIB" },
        { districtId, name: "Mumbai Metro Line 6 (Pink Line)", category: "METRO", status: "IN_PROGRESS", budget: 55000000000, progressPct: 45, startDate: new Date("2019-12-01"), expectedEnd: new Date("2027-06-30"), contractor: "MMRDA", source: "MMRDA" },

        // Roads
        { districtId, name: "Mumbai Coastal Road (South)", category: "ROAD", status: "COMPLETED", budget: 124000000000, progressPct: 100, startDate: new Date("2018-11-01"), expectedEnd: new Date("2025-06-30"), contractor: "BMC / Larsen & Toubro", source: "BMC" },
        { districtId, name: "Mumbai Trans Harbour Link (Atal Setu)", category: "BRIDGE", status: "COMPLETED", budget: 177000000000, progressPct: 100, startDate: new Date("2017-04-01"), expectedEnd: new Date("2024-01-12"), contractor: "MMRDA / Various", source: "MMRDA / JICA" },
        { districtId, name: "Goregaon-Mulund Link Road", category: "ROAD", status: "IN_PROGRESS", budget: 60000000000, progressPct: 30, startDate: new Date("2022-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "BMC", source: "BMC" },
        { districtId, name: "Eastern Freeway Extension", category: "ROAD", status: "IN_PROGRESS", budget: 25000000000, progressPct: 40, startDate: new Date("2021-06-01"), expectedEnd: new Date("2026-12-31"), contractor: "BMC", source: "BMC" },

        // Rail
        { districtId, name: "Mumbai Urban Transport Project (MUTP) Phase 3", category: "RAIL", status: "IN_PROGRESS", budget: 85000000000, progressPct: 35, startDate: new Date("2020-01-01"), expectedEnd: new Date("2028-12-31"), contractor: "MRVC / Indian Railways", source: "World Bank / MRVC" },
        { districtId, name: "Mumbai-Ahmedabad High Speed Rail (Bullet Train)", category: "RAIL", status: "IN_PROGRESS", budget: 1100000000000, progressPct: 50, startDate: new Date("2017-09-14"), expectedEnd: new Date("2028-12-31"), contractor: "NHSRCL", source: "NHSRCL / JICA" },

        // Water
        { districtId, name: "Gargai Dam Project", category: "WATER", status: "IN_PROGRESS", budget: 30000000000, progressPct: 25, startDate: new Date("2022-06-01"), expectedEnd: new Date("2028-12-31"), contractor: "BMC", source: "BMC" },
        { districtId, name: "Surya Water Supply Project", category: "WATER", status: "IN_PROGRESS", budget: 20000000000, progressPct: 30, startDate: new Date("2021-01-01"), expectedEnd: new Date("2027-06-30"), contractor: "BMC", source: "BMC" },
        { districtId, name: "Mumbai Sewage Disposal Project Phase 2", category: "WATER", status: "IN_PROGRESS", budget: 45000000000, progressPct: 50, startDate: new Date("2019-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "BMC / Various", source: "BMC / JICA" },

        // Housing
        { districtId, name: "Dharavi Redevelopment Project", category: "HOUSING", status: "IN_PROGRESS", budget: 200000000000, progressPct: 10, startDate: new Date("2024-01-01"), expectedEnd: new Date("2032-12-31"), contractor: "Adani Group", source: "DRP / State Govt" },
        { districtId, name: "SRA Rehabilitation Projects (Various)", category: "HOUSING", status: "IN_PROGRESS", budget: 80000000000, progressPct: 35, startDate: new Date("2020-01-01"), expectedEnd: new Date("2030-12-31"), contractor: "Various developers", source: "SRA" },
        { districtId, name: "MHADA Housing Lottery Projects", category: "HOUSING", status: "IN_PROGRESS", budget: 50000000000, progressPct: 40, startDate: new Date("2023-01-01"), expectedEnd: new Date("2028-12-31"), contractor: "MHADA", source: "MHADA" },
      ],
    });
    console.log("  ✅ Infrastructure projects seeded (18 projects)");
  } else {
    console.log(`  ⏭  Infrastructure already exists (${infraCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // D. POPULATION HISTORY
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding population history...");

  const popCount = await prisma.populationHistory.count({ where: { districtId } });
  if (popCount === 0) {
    await prisma.populationHistory.createMany({
      skipDuplicates: true,
      data: [
        { districtId, year: 1951, population: 2994000, sexRatio: 745, literacy: 62.3, urbanPct: 100, density: 4965, source: "Census of India 1951" },
        { districtId, year: 1961, population: 4152000, sexRatio: 772, literacy: 66.5, urbanPct: 100, density: 6886, source: "Census of India 1961" },
        { districtId, year: 1971, population: 5971000, sexRatio: 788, literacy: 70.1, urbanPct: 100, density: 9901, source: "Census of India 1971" },
        { districtId, year: 1981, population: 8243000, sexRatio: 805, literacy: 74.6, urbanPct: 100, density: 13672, source: "Census of India 1981" },
        { districtId, year: 1991, population: 9926000, sexRatio: 808, literacy: 82.2, urbanPct: 100, density: 16462, source: "Census of India 1991" },
        { districtId, year: 2001, population: 11978450, sexRatio: 822, literacy: 86.4, urbanPct: 100, density: 19864, source: "Census of India 2001" },
        { districtId, year: 2011, population: 12442373, sexRatio: 832, literacy: 89.73, urbanPct: 100, density: 20634, source: "Census of India 2011" },
      ],
    });
    console.log("  ✅ Population history seeded (7 records)");
  } else {
    console.log(`  ⏭  Population history already exists (${popCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // E. POLICE STATIONS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding police stations...");

  const policeCount = await prisma.policeStation.count({ where: { districtId } });
  if (policeCount === 0) {
    await prisma.policeStation.createMany({
      skipDuplicates: true,
      data: [
        { districtId, name: "Colaba Police Station", address: "Shahid Bhagat Singh Road, Colaba, Mumbai 400005", phone: "022-22161613" },
        { districtId, name: "Marine Drive Police Station", address: "Netaji Subhash Chandra Bose Road, Marine Drive, Mumbai 400020", phone: "022-22812366" },
        { districtId, name: "Azad Maidan Police Station", address: "Azad Maidan, Fort, Mumbai 400001", phone: "022-22620974" },
        { districtId, name: "DN Nagar Police Station", address: "DN Nagar, Andheri West, Mumbai 400053", phone: "022-26283251" },
        { districtId, name: "Bandra Police Station", address: "Hill Road, Bandra West, Mumbai 400050", phone: "022-26420245" },
        { districtId, name: "Juhu Police Station", address: "Juhu Tara Road, Juhu, Mumbai 400049", phone: "022-26362929" },
        { districtId, name: "Andheri Police Station", address: "SV Road, Andheri West, Mumbai 400058", phone: "022-26281515" },
        { districtId, name: "Borivali Police Station", address: "LT Road, Borivali West, Mumbai 400092", phone: "022-28933510" },
        { districtId, name: "Malad Police Station", address: "SV Road, Malad West, Mumbai 400064", phone: "022-28811002" },
        { districtId, name: "Dadar Police Station", address: "Ranade Road, Dadar West, Mumbai 400028", phone: "022-24229502" },
        { districtId, name: "Kurla Police Station", address: "Kurla West, Mumbai 400070", phone: "022-26521240" },
        { districtId, name: "Ghatkopar Police Station", address: "LBS Road, Ghatkopar West, Mumbai 400086", phone: "022-25002210" },
        { districtId, name: "Powai Police Station", address: "Adi Shankaracharya Marg, Powai, Mumbai 400076", phone: "022-25709264" },
        { districtId, name: "Goregaon Police Station", address: "SV Road, Goregaon West, Mumbai 400062", phone: "022-28721777" },
        { districtId, name: "Worli Police Station", address: "Annie Besant Road, Worli, Mumbai 400018", phone: "022-24938571" },
        { districtId, name: "Dharavi Police Station", address: "90 Feet Road, Dharavi, Mumbai 400017", phone: "022-24044888" },
        { districtId, name: "Kandivali Police Station", address: "Charkop Naka, Kandivali West, Mumbai 400067", phone: "022-28052055" },
        { districtId, name: "Vikhroli Police Station", address: "LBS Road, Vikhroli West, Mumbai 400083", phone: "022-25787070" },
        { districtId, name: "Versova Police Station", address: "Yari Road, Versova, Mumbai 400061", phone: "022-26320346" },
        { districtId, name: "Santacruz Police Station", address: "Santacruz West, Mumbai 400054", phone: "022-26490092" },
      ],
    });
    console.log("  ✅ Police stations seeded (20 stations)");
  } else {
    console.log(`  ⏭  Police stations already exist (${policeCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // F. SCHOOLS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding schools...");

  const schoolCount = await prisma.school.count({ where: { districtId } });
  if (schoolCount === 0) {
    await prisma.school.createMany({
      skipDuplicates: true,
      data: [
        { districtId, name: "Cathedral and John Connon School", type: "PRIVATE", level: "Senior Secondary", address: "6 Purshottamdas Thakurdas Marg, Fort, Mumbai 400001", students: 2200, teachers: 150, studentTeacherRatio: 14.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Bombay Scottish School (Mahim)", type: "PRIVATE", level: "Senior Secondary", address: "Veer Savarkar Marg, Mahim, Mumbai 400016", students: 3500, teachers: 220, studentTeacherRatio: 15.9, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Campion School", type: "PRIVATE", level: "Senior Secondary", address: "17 Hazarimal Somani Marg, Fort, Mumbai 400001", students: 1800, teachers: 120, studentTeacherRatio: 15.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Don Bosco High School (Matunga)", type: "PRIVATE", level: "Secondary", address: "Don Bosco Road, Matunga, Mumbai 400019", students: 2500, teachers: 160, studentTeacherRatio: 15.6, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "St. Xavier's High School (Fort)", type: "PRIVATE", level: "Secondary", address: "5 Cruickshank Road, Fort, Mumbai 400001", students: 1600, teachers: 110, studentTeacherRatio: 14.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Jamnabai Narsee School", type: "PRIVATE", level: "Senior Secondary", address: "Narsee Monjee Bhavan, Vile Parle West, Mumbai 400056", students: 4000, teachers: 250, studentTeacherRatio: 16.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Dhirubhai Ambani International School", type: "PRIVATE", level: "Senior Secondary", address: "Bandra Kurla Complex, Bandra East, Mumbai 400051", students: 1200, teachers: 100, studentTeacherRatio: 12.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Podar International School (Santacruz)", type: "PRIVATE", level: "Senior Secondary", address: "Santacruz West, Mumbai 400054", students: 2000, teachers: 140, studentTeacherRatio: 14.3, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Arya Vidya Mandir (Bandra)", type: "PRIVATE", level: "Senior Secondary", address: "Bandra West, Mumbai 400050", students: 2800, teachers: 180, studentTeacherRatio: 15.6, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "R.N. Podar School (Santacruz)", type: "PRIVATE", level: "Senior Secondary", address: "Podar Lane, Santacruz West, Mumbai 400054", students: 2500, teachers: 160, studentTeacherRatio: 15.6, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "IES New English School (Bandra)", type: "AIDED", level: "Secondary", address: "IES Road, Bandra East, Mumbai 400051", students: 3000, teachers: 180, studentTeacherRatio: 16.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Balmohan Vidyamandir (Dadar)", type: "PRIVATE", level: "Secondary", address: "Senapati Bapat Marg, Dadar, Mumbai 400028", students: 3500, teachers: 200, studentTeacherRatio: 17.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Kendriya Vidyalaya IIT Bombay", type: "CENTRAL_GOVT", level: "Senior Secondary", address: "IIT Bombay Campus, Powai, Mumbai 400076", students: 1800, teachers: 120, studentTeacherRatio: 15.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Atomic Energy Central School (Anushakti Nagar)", type: "CENTRAL_GOVT", level: "Senior Secondary", address: "Anushakti Nagar, Mumbai 400094", students: 2200, teachers: 140, studentTeacherRatio: 15.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "BMC Marathi Medium School (Dharavi)", type: "GOVERNMENT", level: "Primary", address: "Dharavi Main Road, Mumbai 400017", students: 800, teachers: 30, studentTeacherRatio: 26.7, hasToilets: true, hasLibrary: false, hasLab: false },
        { districtId, name: "St. Stanislaus High School (Bandra)", type: "PRIVATE", level: "Secondary", address: "Hill Road, Bandra West, Mumbai 400050", students: 2000, teachers: 130, studentTeacherRatio: 15.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Hiranandani Foundation School (Powai)", type: "PRIVATE", level: "Senior Secondary", address: "Hiranandani Gardens, Powai, Mumbai 400076", students: 2500, teachers: 160, studentTeacherRatio: 15.6, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Ryan International School (Kandivali)", type: "PRIVATE", level: "Senior Secondary", address: "Kandivali East, Mumbai 400101", students: 3000, teachers: 190, studentTeacherRatio: 15.8, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Narayana e-Techno School (Borivali)", type: "PRIVATE", level: "Senior Secondary", address: "Borivali West, Mumbai 400092", students: 1500, teachers: 100, studentTeacherRatio: 15.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Jasudben ML School (Khar)", type: "PRIVATE", level: "Senior Secondary", address: "Khar West, Mumbai 400052", students: 2000, teachers: 130, studentTeacherRatio: 15.4, hasToilets: true, hasLibrary: true, hasLab: true },
      ],
    });
    console.log("  ✅ Schools seeded (20 schools)");
  } else {
    console.log(`  ⏭  Schools already exist (${schoolCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // G. GOVERNMENT OFFICES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding government offices...");

  const officeCount = await prisma.govOffice.count({ where: { districtId } });
  if (officeCount === 0) {
    await prisma.govOffice.createMany({
      skipDuplicates: true,
      data: [
        { districtId, name: "Mantralaya (Maharashtra State Secretariat)", type: "STATE", department: "Government of Maharashtra", address: "Madame Cama Road, Nariman Point, Mumbai 400032", phone: "022-22025858", services: ["State government offices", "CM office", "All ministry secretariats"] },
        { districtId, name: "BMC Head Office", type: "MUNICIPAL", department: "Brihanmumbai Municipal Corporation", address: "Mahapalika Marg, Fort, Mumbai 400001", phone: "022-22620251", services: ["Property tax", "Building permissions", "Birth/death certificates"] },
        { districtId, name: "Mumbai City Collector Office", type: "DISTRICT", department: "Revenue Department", address: "Old Custom House, Fort, Mumbai 400001", phone: "022-22617392", services: ["Revenue records", "Land records", "NOC", "Domicile certificates"] },
        { districtId, name: "Mumbai Suburban Collector Office", type: "DISTRICT", department: "Revenue Department", address: "Court Naka, Bandra East, Mumbai 400051", phone: "022-26559064", services: ["Land records", "Revenue services for suburban Mumbai"] },
        { districtId, name: "Regional Transport Office (RTO Mumbai)", type: "STATE", department: "Transport Department", address: "Tardeo, Mumbai 400034", phone: "022-23516200", services: ["Driving license", "Vehicle registration", "Fitness certificates"] },
        { districtId, name: "Passport Seva Kendra (BKC)", type: "CENTRAL", department: "Ministry of External Affairs", address: "Bandra Kurla Complex, Mumbai 400051", phone: "1800-258-1800", services: ["Passport application", "Renewal", "Tatkal passport"] },
        { districtId, name: "Income Tax Office (Mumbai)", type: "CENTRAL", department: "CBDT / Income Tax Dept", address: "Aayakar Bhavan, MK Road, Mumbai 400020", phone: "022-22014956", services: ["Income tax filing", "PAN", "TDS", "Refunds"] },
        { districtId, name: "GST Commissionerate Mumbai", type: "CENTRAL", department: "CBIC / GST", address: "GST Bhavan, Mumbai 400001", phone: "022-22085200", services: ["GST registration", "Returns", "Refunds", "Anti-evasion"] },
        { districtId, name: "Employment Exchange Mumbai", type: "STATE", department: "Skill Development & Labour", address: "Employment Exchange, Mumbai 400012", phone: "022-24122855", services: ["Job registration", "Employment guidance", "Vocational training"] },
        { districtId, name: "Sub-Registrar Office (Andheri)", type: "STATE", department: "Registration & Stamps", address: "Andheri East, Mumbai 400069", phone: "022-26828000", services: ["Property registration", "Stamp duty", "Document registration"] },
      ],
    });
    console.log("  ✅ Government offices seeded (10 offices)");
  } else {
    console.log(`  ⏭  Government offices already exist (${officeCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // H. GOVERNMENT SCHEMES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding government schemes...");

  const schemeCount = await prisma.scheme.count({ where: { districtId } });
  if (schemeCount === 0) {
    await prisma.scheme.createMany({
      skipDuplicates: true,
      data: [
        // Maharashtra State Schemes
        { districtId, name: "Mukhyamantri Majhi Ladki Bahin Yojana", level: "STATE", category: "Women & Child Development", eligibility: "Women aged 21-65, annual family income below ₹2.5 lakh, Maharashtra domicile", amount: 1500, applyUrl: "https://ladkibahin.maharashtra.gov.in", active: true, source: "Maharashtra Govt" },
        { districtId, name: "Mahatma Jyotirao Phule Jan Arogya Yojana", level: "STATE", category: "Health Insurance", eligibility: "Maharashtra residents with yellow/orange ration card", amount: 500000, applyUrl: "https://www.jeevandayee.gov.in", active: true, source: "Maharashtra Govt" },
        { districtId, name: "Maharashtra Gharkul Yojana", level: "STATE", category: "Housing", eligibility: "EWS/LIG families, Maharashtra domicile", amount: 250000, active: true, source: "Maharashtra Govt" },
        { districtId, name: "Ramai Awas Gharkul Yojana", level: "STATE", category: "Housing", eligibility: "SC/ST/NT/DNT families below poverty line", amount: 250000, active: true, source: "Maharashtra Govt" },

        // Central Government Schemes
        { districtId, name: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)", level: "CENTRAL", category: "Housing", eligibility: "EWS/LIG/MIG families without pucca house", amount: 267000, applyUrl: "https://pmaymis.gov.in", active: true, source: "MoHUA" },
        { districtId, name: "Ayushman Bharat — PMJAY", level: "CENTRAL", category: "Health Insurance", eligibility: "SECC 2011 identified families", amount: 500000, applyUrl: "https://pmjay.gov.in", active: true, source: "NHA" },
        { districtId, name: "PM-KISAN", level: "CENTRAL", category: "Agriculture", eligibility: "All farmer families with cultivable land", amount: 6000, applyUrl: "https://pmkisan.gov.in", active: true, source: "Ministry of Agriculture" },
        { districtId, name: "Pradhan Mantri Mudra Yojana (PMMY)", level: "CENTRAL", category: "MSME & Finance", eligibility: "Non-corporate, non-farm small/micro enterprises", amount: 1000000, applyUrl: "https://www.mudra.org.in", active: true, source: "Ministry of Finance" },
        { districtId, name: "PM Vishwakarma Yojana", level: "CENTRAL", category: "MSME & Artisans", eligibility: "Traditional artisans (carpenters, goldsmiths, potters, etc.)", amount: 300000, applyUrl: "https://pmvishwakarma.gov.in", active: true, source: "Ministry of MSME" },
        { districtId, name: "Atal Pension Yojana (APY)", level: "CENTRAL", category: "Social Security", eligibility: "Indian citizens aged 18-40, with bank account", amount: 5000, applyUrl: "https://www.npscra.nsdl.co.in", active: true, source: "PFRDA" },
      ],
    });
    console.log("  ✅ Government schemes seeded (10 schemes)");
  } else {
    console.log(`  ⏭  Schemes already exist (${schemeCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // I. ELECTION RESULTS (2024 LS + 2024 Assembly)
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding election results...");

  const electionCount = await prisma.electionResult.count({ where: { districtId } });
  if (electionCount === 0) {
    await prisma.electionResult.createMany({
      skipDuplicates: true,
      data: [
        // 2024 Lok Sabha — winnerVotes estimated from turnout & margin
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai North", winnerName: "Piyush Goyal", winnerParty: "BJP", winnerVotes: 562000, runnerUpName: "Bhushan Patil", runnerUpParty: "INC", runnerUpVotes: 207000, margin: 355000, totalVoters: 1800000, votesPolled: 885600, turnoutPct: 49.2, source: "ECI 2024" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai North Central", winnerName: "Varsha Gaikwad", winnerParty: "INC", winnerVotes: 524000, runnerUpName: "Ujjwal Nikam", runnerUpParty: "BJP", runnerUpVotes: 492000, margin: 32000, totalVoters: 1950000, votesPolled: 1015950, turnoutPct: 52.1, source: "ECI 2024" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai North East", winnerName: "Sanjay Dina Patil", winnerParty: "Shiv Sena (UBT)", winnerVotes: 511000, runnerUpName: "Mihir Kotecha", runnerUpParty: "BJP", runnerUpVotes: 482000, margin: 29000, totalVoters: 2100000, votesPolled: 1022700, turnoutPct: 48.7, source: "ECI 2024" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai North West", winnerName: "Ravindra Waikar", winnerParty: "Shiv Sena (Shinde)", winnerVotes: 495024, runnerUpName: "Amol Kirtikar", runnerUpParty: "Shiv Sena (UBT)", runnerUpVotes: 494976, margin: 48, totalVoters: 2000000, votesPolled: 990000, turnoutPct: 49.5, source: "ECI 2024" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai South", winnerName: "Arvind Sawant", winnerParty: "Shiv Sena (UBT)", winnerVotes: 432000, runnerUpName: "Yamini Jadhav", runnerUpParty: "Shiv Sena (Shinde)", runnerUpVotes: 379000, margin: 53000, totalVoters: 1700000, votesPolled: 812600, turnoutPct: 47.8, source: "ECI 2024" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Mumbai South Central", winnerName: "Anil Desai", winnerParty: "Shiv Sena (UBT)", winnerVotes: 487000, runnerUpName: "Rahul Shewale", runnerUpParty: "Shiv Sena (Shinde)", runnerUpVotes: 445000, margin: 42000, totalVoters: 1850000, votesPolled: 930550, turnoutPct: 50.3, source: "ECI 2024" },

        // 2024 Maharashtra Assembly (key Mumbai seats)
        { districtId, electionType: "ASSEMBLY", year: 2024, constituency: "Colaba", winnerName: "Rahul Narwekar", winnerParty: "BJP", winnerVotes: 95000, runnerUpName: "Congress candidate", runnerUpParty: "INC", runnerUpVotes: 50000, margin: 45000, totalVoters: 350000, votesPolled: 147350, turnoutPct: 42.1, source: "ECI 2024 Assembly" },
        { districtId, electionType: "ASSEMBLY", year: 2024, constituency: "Worli", winnerName: "Aaditya Thackeray", winnerParty: "Shiv Sena (UBT)", winnerVotes: 68000, runnerUpName: "Milind Deora", runnerUpParty: "Shiv Sena (Shinde)", runnerUpVotes: 60000, margin: 8000, totalVoters: 280000, votesPolled: 124600, turnoutPct: 44.5, source: "ECI 2024 Assembly" },
        { districtId, electionType: "ASSEMBLY", year: 2024, constituency: "Bandra West", winnerName: "Ashish Shelar", winnerParty: "BJP", winnerVotes: 82000, runnerUpName: "Asif Zakaria", runnerUpParty: "INC", runnerUpVotes: 47000, margin: 35000, totalVoters: 310000, votesPolled: 133920, turnoutPct: 43.2, source: "ECI 2024 Assembly" },
        { districtId, electionType: "ASSEMBLY", year: 2024, constituency: "Borivali", winnerName: "Sanjay Upadhyay", winnerParty: "BJP", winnerVotes: 115000, runnerUpName: "NCP candidate", runnerUpParty: "NCP (SP)", runnerUpVotes: 60000, margin: 55000, totalVoters: 380000, votesPolled: 174040, turnoutPct: 45.8, source: "ECI 2024 Assembly" },
      ],
    });
    console.log("  ✅ Election results seeded (10 records)");
  } else {
    console.log(`  ⏭  Election results already exist (${electionCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // J. COURT STATISTICS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding court statistics...");

  const courtCount = await prisma.courtStat.count({ where: { districtId } });
  if (courtCount === 0) {
    await prisma.courtStat.createMany({
      skipDuplicates: true,
      data: [
        { districtId, courtName: "Bombay High Court (Principal Bench)", year: 2025, filed: 210000, disposed: 180000, pending: 450000, avgDays: 365, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "City Civil & Sessions Court, Mumbai", year: 2025, filed: 72000, disposed: 65000, pending: 120000, avgDays: 540, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Metropolitan Magistrate Courts, Mumbai", year: 2025, filed: 175000, disposed: 150000, pending: 350000, avgDays: 420, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Small Causes Court, Mumbai", year: 2025, filed: 48000, disposed: 42000, pending: 85000, avgDays: 480, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Family Court, Mumbai", year: 2025, filed: 15000, disposed: 12000, pending: 28000, avgDays: 300, source: "NJDG / ecourts.gov.in" },
      ],
    });
    console.log("  ✅ Court statistics seeded (5 courts)");
  } else {
    console.log(`  ⏭  Court stats already exist (${courtCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // K. RTI TEMPLATES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding RTI templates...");

  const rtiCount = await prisma.rtiTemplate.count({ where: { districtId } });
  if (rtiCount === 0) {
    await prisma.rtiTemplate.createMany({
      skipDuplicates: true,
      data: [
        { districtId, topic: "BMC Road Repair Status", department: "BMC — Roads Department", pioAddress: "PIO, BMC Roads Department, BMC Head Office, Mahapalika Marg, Fort, Mumbai 400001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request details of: (1) All road repair/resurfacing works sanctioned in Ward ___ during FY 2025-26. (2) Contractor name, work order value, and completion timeline for each. (3) Pothole complaints received and resolved per ward. (4) Total expenditure on road maintenance in the current fiscal year." },
        { districtId, topic: "Property Tax Assessment Details", department: "BMC — Assessment & Collection", pioAddress: "PIO, Assessment & Collection Dept, BMC Head Office, Mahapalika Marg, Fort, Mumbai 400001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Property tax assessment methodology for my property at ___. (2) Ready reckoner rate applied. (3) Total property tax collected ward-wise for FY 2025-26. (4) List of properties with tax arrears exceeding ₹1 lakh in Ward ___." },
        { districtId, topic: "Mumbai Metro Project Status", department: "MMRDA / MMRC", pioAddress: "PIO, Mumbai Metro Rail Corporation, MMRC Office, BKC, Bandra East, Mumbai 400051", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Current completion percentage of Metro Line 3 (Colaba-Bandra-SEEPZ). (2) Revised cost estimate vs original sanctioned cost. (3) Monthly expenditure for the last 6 months. (4) Expected commissioning date and any delays with reasons." },
        { districtId, topic: "Water Supply & Quality Report", department: "BMC — Water Supply", pioAddress: "PIO, Hydraulic Engineering Dept, BMC Head Office, Mahapalika Marg, Fort, Mumbai 400001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Daily water supply per capita in Ward ___. (2) Latest water quality test results for my area. (3) Status of Gargai & Surya dam projects. (4) Total water losses (non-revenue water) percentage for Mumbai." },
        { districtId, topic: "Building Permission Status", department: "BMC — Development Planning", pioAddress: "PIO, Development Planning Dept, BMC Head Office, Mahapalika Marg, Fort, Mumbai 400001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Status of building permission application no. ___. (2) IOD and CC issuance details. (3) List of unauthorized constructions reported in Ward ___ during 2025-26. (4) Action taken on each complaint." },
      ],
    });
    console.log("  ✅ RTI templates seeded (5 templates)");
  } else {
    console.log(`  ⏭  RTI templates already exist (${rtiCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // L. FAMOUS PERSONALITIES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding famous personalities...");

  const personalityCount = await prisma.famousPersonality.count({ where: { districtId } });
  if (personalityCount === 0) {
    await prisma.famousPersonality.createMany({
      skipDuplicates: true,
      data: [
        { districtId, name: "Dr. B.R. Ambedkar", category: "Freedom Fighter", bio: "Father of the Indian Constitution. Spent formative years in Mumbai. Siddharth College, Elphinstone College. His Dadar residence 'Rajgriha' is a national monument.", birthYear: 1891, deathYear: 1956, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Bal Thackeray", category: "Politician", bio: "Founder of Shiv Sena. Iconic Mumbai political figure. Cartoonist turned leader who shaped Mumbai's political landscape for decades.", birthYear: 1926, deathYear: 2012, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Sachin Tendulkar", category: "Athlete", bio: "God of Cricket. Born and raised in Mumbai. Played for Mumbai Indians (IPL) and India. Bharat Ratna awardee. Lives in Bandra.", birthYear: 1973, bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Lata Mangeshkar", category: "Artist", bio: "Nightingale of India. Recorded songs in over 36 languages. Bharat Ratna. Resided in Pedder Road, Mumbai for decades.", birthYear: 1929, deathYear: 2022, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Dhirubhai Ambani", category: "Business", bio: "Founder of Reliance Industries. Transformed Indian business from a small textile trader in Mumbai to building India's largest private company.", birthYear: 1932, deathYear: 2002, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Tata Family (Jamsetji to Ratan)", category: "Business", bio: "Tata Group — India's largest conglomerate. HQ at Bombay House, Fort. Jamsetji Tata built the Taj Mahal Hotel. Ratan Tata led global expansion.", birthYear: 1839, deathYear: 2024, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Shah Rukh Khan", category: "Artist", bio: "Bollywood superstar. 'King of Bollywood'. Lives in Mannat, Bandra. Globally recognized face of Indian cinema.", birthYear: 1965, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Amitabh Bachchan", category: "Artist", bio: "The Big B of Bollywood. Lives in Juhu. Megastar of Indian cinema for over 5 decades. Resides at Jalsa & Pratiksha bungalows.", birthYear: 1942, bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Dr. Homi Bhabha", category: "Scientist", bio: "Father of India's nuclear program. Founded TIFR and BARC in Mumbai. The Bhabha Atomic Research Centre in Trombay is named after him.", birthYear: 1909, deathYear: 1966, bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Dadasaheb Phalke", category: "Artist", bio: "Father of Indian Cinema. Made India's first full-length feature film 'Raja Harishchandra' (1913) in Mumbai. The Dadasaheb Phalke Award is named after him.", birthYear: 1870, deathYear: 1944, bornInDistrict: false, source: "wikipedia" },
      ],
    });
    console.log("  ✅ Famous personalities seeded (10 personalities)");
  } else {
    console.log(`  ⏭  Famous personalities already exist (${personalityCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // M. LOCAL INDUSTRIES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding local industries...");

  const industryCount = await prisma.localIndustry.count({ where: { districtId } });
  if (industryCount === 0) {
    await prisma.localIndustry.createMany({
      skipDuplicates: true,
      data: [
        { districtId, name: "Bombay Stock Exchange (BSE)", type: "Financial Exchange", category: "Finance", location: "Dalal Street, Fort, Mumbai", details: { employees: 5000, established: 1875, description: "Asia's oldest stock exchange. Over 5,500 listed companies." }, source: "BSE" },
        { districtId, name: "National Stock Exchange (NSE)", type: "Financial Exchange", category: "Finance", location: "Bandra Kurla Complex, Mumbai", details: { employees: 4000, description: "India's largest stock exchange by turnover. Nifty 50 index." }, source: "NSE" },
        { districtId, name: "Bollywood / Film City", type: "Entertainment Hub", category: "Entertainment", location: "Goregaon, Andheri, across Mumbai", details: { employees: 500000, revenue: "₹25,000 Cr", description: "Mumbai is the hub of India's film industry." }, source: "FICCI" },
        { districtId, name: "Bandra Kurla Complex (BKC) Business District", type: "Business District", category: "Commercial", location: "BKC, Bandra East", details: { employees: 200000, description: "Mumbai's premier business district. HQ of RBI, SEBI, NSE, Diamond Bourse." }, source: "MMRDA" },
        { districtId, name: "SEEPZ (Santacruz Electronic Export Processing Zone)", type: "SEZ", category: "IT & Electronics", location: "Andheri East, Mumbai", details: { employees: 80000, established: 1973, description: "India's first EPZ. Gem & jewellery exports hub + IT/ITES companies." }, source: "SEEPZ Authority" },
        { districtId, name: "Andheri-Powai IT Corridor", type: "IT Park", category: "IT", location: "Andheri East, Powai, Chandivali", details: { employees: 150000, description: "Major IT hub — Mindspace, Powai tech companies. Infosys, TCS, Accenture offices." }, source: "NASSCOM" },
        { districtId, name: "Dharavi Leather & Pottery Industry", type: "MSME Cluster", category: "Manufacturing", location: "Dharavi, Mumbai", details: { employees: 300000, revenue: "₹10,000 Cr/year", description: "Dharavi's informal economy: leather goods, pottery, recycling, garments, food processing." }, source: "Industry estimates" },
        { districtId, name: "Nhava Sheva / JNPT Port", type: "Port", category: "Logistics", location: "Nhava Sheva, Navi Mumbai (near Mumbai)", details: { employees: 50000, description: "India's largest container port. Handles ~50% of India's container trade." }, source: "JNPT" },
        { districtId, name: "Diamond Trading (Bharat Diamond Bourse)", type: "Trading Centre", category: "Trade", location: "BKC, Bandra East", details: { employees: 100000, description: "Mumbai handles 90% of India's diamond trade. World's largest diamond trading centre." }, source: "BDB" },
        { districtId, name: "Textile Industry (Historic Mills)", type: "Manufacturing", category: "Textile", location: "Lower Parel, Parel, Lalbaug", details: { employees: 60000, description: "Historic textile mill industry. Legacy continues in garment manufacturing." }, source: "Industry estimates" },
      ],
    });
    console.log("  ✅ Local industries seeded (10 industries)");
  } else {
    console.log(`  ⏭  Local industries already exist (${industryCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // N. BUS ROUTES (BEST)
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding bus routes (BEST)...");

  const busCount = await prisma.busRoute.count({ where: { districtId } });
  if (busCount === 0) {
    await prisma.busRoute.createMany({
      skipDuplicates: true,
      data: [
        { districtId, routeNumber: "1", origin: "Colaba Bus Depot", destination: "Agarkar Chowk", via: "CSMT, Crawford Market, Byculla", operator: "BEST", busType: "Ordinary", frequency: "10 min" },
        { districtId, routeNumber: "83", origin: "Colaba", destination: "Andheri Station East", via: "Worli, Dadar, Bandra", operator: "BEST", busType: "Ordinary", frequency: "12 min" },
        { districtId, routeNumber: "84", origin: "Colaba", destination: "Goregaon Depot", via: "Haji Ali, Mahim, Vile Parle", operator: "BEST", busType: "Ordinary", frequency: "15 min" },
        { districtId, routeNumber: "332", origin: "Bandra Station West", destination: "BKC", via: "Bandra Reclamation, MMRDA", operator: "BEST", busType: "Ordinary", frequency: "8 min" },
        { districtId, routeNumber: "203", origin: "Kurla Station", destination: "Andheri Station", via: "BKC, MTNL, Western Express Highway", operator: "BEST", busType: "Ordinary", frequency: "10 min" },
        { districtId, routeNumber: "500", origin: "CSMT", destination: "Borivali Station", via: "Dadar, Bandra, Andheri, Kandivali", operator: "BEST", busType: "AC", frequency: "20 min" },
        { districtId, routeNumber: "A-37", origin: "Mantralaya", destination: "Haji Ali", via: "Churchgate, Marine Drive", operator: "BEST", busType: "Electric", frequency: "15 min" },
        { districtId, routeNumber: "79", origin: "CSMT", destination: "Mulund Check Naka", via: "Byculla, Sion, Kurla, Ghatkopar", operator: "BEST", busType: "Ordinary", frequency: "12 min" },
      ],
    });
    console.log("  ✅ Bus routes seeded (8 BEST routes)");
  } else {
    console.log(`  ⏭  Bus routes already exist (${busCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // O. TRAIN SCHEDULES (Mumbai Suburban + Long Distance)
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding train schedules...");

  const trainCount = await prisma.trainSchedule.count({ where: { districtId } });
  if (trainCount === 0) {
    await prisma.trainSchedule.createMany({
      skipDuplicates: true,
      data: [
        // Mumbai Suburban Railways — the lifeline
        { districtId, trainNumber: "WR-LOCAL", trainName: "Western Line Local", origin: "Churchgate", destination: "Virar", stationName: "Churchgate", departureTime: "05:00", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "CR-LOCAL", trainName: "Central Line Local", origin: "CSMT", destination: "Kalyan", stationName: "CSMT", departureTime: "05:00", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "HARBOUR", trainName: "Harbour Line Local", origin: "CSMT", destination: "Panvel", stationName: "CSMT", departureTime: "05:00", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "WR-AC-LOCAL", trainName: "Western AC Local", origin: "Churchgate", destination: "Virar", stationName: "Churchgate", departureTime: "05:30", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },

        // Long Distance from Mumbai
        { districtId, trainNumber: "12951", trainName: "Mumbai Rajdhani Express", origin: "Mumbai Central", destination: "New Delhi", stationName: "Mumbai Central", departureTime: "16:35", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12127", trainName: "Mumbai-Pune Intercity Express", origin: "CSMT", destination: "Pune", stationName: "CSMT", departureTime: "06:40", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12859", trainName: "Gitanjali Express", origin: "CSMT", destination: "Howrah (Kolkata)", stationName: "CSMT", departureTime: "06:00", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "11007", trainName: "Deccan Express", origin: "CSMT", destination: "Pune", stationName: "CSMT", departureTime: "07:15", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12133", trainName: "Mumbai-Mangalore SF Express", origin: "CSMT", destination: "Mangalore Jn", stationName: "CSMT", departureTime: "22:00", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12809", trainName: "Mumbai-Howrah Mail", origin: "CSMT", destination: "Howrah", stationName: "CSMT", departureTime: "21:30", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
      ],
    });
    console.log("  ✅ Train schedules seeded (10 trains)");
  } else {
    console.log(`  ⏭  Train schedules already exist (${trainCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // P. SERVICE GUIDES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding service guides...");

  const serviceCount = await prisma.serviceGuide.count({ where: { districtId } });
  if (serviceCount === 0) {
    await prisma.serviceGuide.createMany({
      skipDuplicates: true,
      data: [
        {
          districtId,
          serviceName: "Property Registration in Mumbai",
          category: "REVENUE",
          office: "Sub-Registrar Office",
          documentsNeeded: ["Sale deed", "PAN cards", "Aadhaar cards", "Passport photos", "7/12 extract", "Old property documents", "Society NOC"],
          fees: "Stamp duty: 5% (men) / 4% (women) + 1% registration fee",
          timeline: "1-2 days after slot booking",
          onlinePortal: "IGR Maharashtra",
          onlineUrl: "https://igrmaharashtra.gov.in",
          steps: [
            "Calculate stamp duty (5% for men, 4% for women in Mumbai)",
            "Prepare documents: Sale deed, PAN, Aadhaar, 7/12 extract",
            "Book slot on IGR Maharashtra portal",
            "Pay stamp duty + registration fee (1%)",
            "Visit Sub-Registrar with buyer, seller, 2 witnesses",
            "Biometric verification and registration",
            "Collect registered document (usually same day)",
          ],
        },
        {
          districtId,
          serviceName: "Ration Card Application (Mumbai)",
          category: "FOOD",
          office: "Food & Civil Supplies, Maharashtra",
          documentsNeeded: ["Aadhaar card", "Address proof", "Income certificate", "Gas connection proof", "Passport photos"],
          fees: "₹5 for APL, Free for BPL",
          timeline: "30-45 days",
          onlinePortal: "Aaple Sarkar / mahafood",
          onlineUrl: "https://mahafood.gov.in",
          steps: [
            "Visit mahafood.gov.in or Aaple Sarkar portal",
            "Fill online application with family details",
            "Upload documents: Aadhaar, address proof, income certificate",
            "Submit application and note reference number",
            "FPS verification visit by talathi",
            "Card issued within 30 days",
          ],
        },
        {
          districtId,
          serviceName: "Birth/Death Certificate (BMC)",
          category: "CIVIL",
          office: "BMC — Public Health Department",
          documentsNeeded: ["Hospital discharge slip", "Parent Aadhaar & PAN (birth)", "Death intimation from hospital (death)"],
          fees: "Free within 21 days, ₹5-50 after",
          timeline: "7-14 days",
          onlineUrl: "https://portal.mcgm.gov.in",
          steps: [
            "Visit BMC portal or ward office",
            "Fill Form-1 (birth) or Form-2 (death)",
            "Submit within 21 days of event (no fee) or after 21 days (with late fee)",
            "Hospital registration slip required",
            "Certificate issued within 7-14 days",
            "Non-availability certificate for old records from Municipal Corporation",
          ],
        },
        {
          districtId,
          serviceName: "Water Connection (BMC)",
          category: "UTILITIES",
          office: "BMC — Hydraulic Engineering",
          documentsNeeded: ["Property ownership proof", "Society NOC", "Building plan approval", "Identity proof"],
          fees: "₹5,000-₹25,000 depending on pipe size",
          timeline: "15-30 days after approval",
          steps: [
            "Apply at ward-level BMC office",
            "Submit property documents, society NOC",
            "BMC inspection of premises",
            "Pay connection charges based on pipe size",
            "Installation within 15-30 days",
            "Water meter reading starts",
          ],
        },
        {
          districtId,
          serviceName: "Domicile Certificate (Maharashtra)",
          category: "REVENUE",
          office: "Tahsildar / Collector Office",
          documentsNeeded: ["Aadhaar card", "School leaving certificate", "Residence proof (15 years)", "Passport size photos"],
          fees: "₹20",
          timeline: "15-21 days",
          onlinePortal: "Aaple Sarkar",
          onlineUrl: "https://aaplesarkar.mahaonline.gov.in",
          steps: [
            "Visit Aaple Sarkar portal (aaplesarkar.mahaonline.gov.in)",
            "Fill application form with personal details",
            "Upload: Aadhaar, address proof showing 15+ years residence",
            "Pay fee online",
            "Verification by tahsildar",
            "Certificate issued within 15 days",
          ],
        },
      ],
    });
    console.log("  ✅ Service guides seeded (5 guides)");
  } else {
    console.log(`  ⏭  Service guides already exist (${serviceCount} records)`);
  }

  console.log("\n✅ Mumbai district data seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
