// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Kolkata District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-kolkata-data.ts
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
  console.log("🌱 Seeding Kolkata district data...\n");

  // ── Find Kolkata district ────────────────────────────────
  const state = await prisma.state.findUnique({ where: { slug: "west-bengal" } });
  if (!state) throw new Error("West Bengal state not found — run seed-hierarchy.ts first");

  const district = await prisma.district.findFirst({
    where: { stateId: state.id, slug: "kolkata" },
  });
  if (!district) throw new Error("Kolkata district not found — run seed-hierarchy.ts first");

  const districtId = district.id;
  console.log(`✓ Found Kolkata district (id: ${districtId})`);

  // ═══════════════════════════════════════════════════════════
  // A. LEADERSHIP — Kolkata/West Bengal 10-Tier Hierarchy
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding leadership...");

  const leadershipCount = await prisma.leader.count({ where: { districtId } });
  if (leadershipCount === 0) {
    await prisma.leader.createMany({
      skipDuplicates: true,
      data: [
        // ── Tier 1: Lok Sabha MPs (2024 winners) ──
        { districtId, name: "Sudip Bandyopadhyay", role: "Member of Parliament", tier: 1, party: "TMC", constituency: "Kolkata North", source: "ECI 2024 results" },
        { districtId, name: "Mala Roy", role: "Member of Parliament", tier: 1, party: "TMC", constituency: "Kolkata South", source: "ECI 2024 results" },

        // ── Tier 2: Key MLAs (2021 WB Assembly) ──
        { districtId, name: "Mamata Banerjee", role: "MLA & Chief Minister", tier: 2, party: "TMC", constituency: "Bhawanipore", source: "WB Assembly 2021" },
        { districtId, name: "Firhad Hakim", role: "MLA & Mayor of Kolkata", tier: 2, party: "TMC", constituency: "Kolkata Port", source: "WB Assembly 2021" },
        { districtId, name: "Debasish Kumar", role: "MLA", tier: 2, party: "TMC", constituency: "Rashbehari", source: "WB Assembly 2021" },
        { districtId, name: "Babul Supriyo", role: "MLA", tier: 2, party: "TMC", constituency: "Ballygunge", source: "WB Assembly 2022 by-election" },
        { districtId, name: "Nayna Bandyopadhyay", role: "MLA", tier: 2, party: "TMC", constituency: "Chowranghee", source: "WB Assembly 2021" },
        { districtId, name: "Swarna Kamal Saha", role: "MLA", tier: 2, party: "TMC", constituency: "Entally", source: "WB Assembly 2021" },
        { districtId, name: "Paresh Pal", role: "MLA", tier: 2, party: "TMC", constituency: "Beleghata", source: "WB Assembly 2021" },
        { districtId, name: "Vivek Gupta", role: "MLA", tier: 2, party: "TMC", constituency: "Jorasanko", source: "WB Assembly 2021" },
        { districtId, name: "Swatilekha Sen", role: "MLA", tier: 2, party: "TMC", constituency: "Shyampukur", source: "WB Assembly 2021" },
        { districtId, name: "Bratya Basu", role: "MLA & Minister of Education", tier: 2, party: "TMC", constituency: "Dum Dum", source: "WB Assembly 2021" },
        { districtId, name: "Atin Ghosh", role: "MLA & Deputy Mayor", tier: 2, party: "TMC", constituency: "Kashipur-Belgachhia", source: "WB Assembly 2021" },

        // ── Tier 3: KMC (Kolkata Municipal Corporation) ──
        { districtId, name: "Firhad Hakim", role: "Mayor", tier: 3, party: "TMC", source: "KMC" },
        { districtId, name: "KMC Municipal Commissioner", role: "Municipal Commissioner", tier: 3, source: "KMC" },

        // ── Tier 4: Administration ──
        { districtId, name: "District Magistrate, Kolkata", role: "District Magistrate (DM)", tier: 4, source: "District Administration" },
        { districtId, name: "C.V. Ananda Bose", role: "Governor of West Bengal", tier: 4, source: "Raj Bhavan" },
        { districtId, name: "Mamata Banerjee", role: "Chief Minister of West Bengal", tier: 4, party: "TMC", source: "WB Government" },
        { districtId, name: "B.P. Gopalika", role: "Chief Secretary, West Bengal", tier: 4, source: "WB Government" },

        // ── Tier 5: Police ──
        { districtId, name: "Vineet Goyal", role: "Commissioner of Police", tier: 5, phone: "100", source: "Kolkata Police" },
        { districtId, name: "Joint CP Crime", role: "Joint Commissioner of Police (Crime)", tier: 5, source: "Kolkata Police" },
        { districtId, name: "DCP North", role: "Deputy Commissioner of Police (North Division)", tier: 5, source: "Kolkata Police" },
        { districtId, name: "DCP South", role: "Deputy Commissioner of Police (South Division)", tier: 5, source: "Kolkata Police" },
        { districtId, name: "DCP Central", role: "Deputy Commissioner of Police (Central Division)", tier: 5, source: "Kolkata Police" },
        { districtId, name: "DCP East", role: "Deputy Commissioner of Police (East Suburban Division)", tier: 5, source: "Kolkata Police" },
        { districtId, name: "DCP Port", role: "Deputy Commissioner of Police (Port Division)", tier: 5, source: "Kolkata Police" },

        // ── Tier 6: Judiciary ──
        { districtId, name: "Justice T.S. Sivagnanam", role: "Chief Justice, Calcutta High Court", tier: 6, source: "Calcutta High Court" },
        { districtId, name: "Chief Judge, City Sessions Court", role: "Chief Judge, City Sessions Court", tier: 6, source: "City Sessions Court, Kolkata" },

        // ── Tier 7: Key Bodies ──
        { districtId, name: "KMDA Chairman", role: "Chairman, KMDA", tier: 7, source: "KMDA" },
        { districtId, name: "Kolkata Port Authority Chairman", role: "Chairman, Kolkata Port Authority", tier: 7, source: "Kolkata Port Authority" },
        { districtId, name: "KMRC MD", role: "Managing Director, KMRC", tier: 7, source: "KMRC" },
        { districtId, name: "CESC Managing Director", role: "Managing Director, CESC", tier: 7, source: "CESC Limited" },

        // ── Tier 8-10: Department heads ──
        { districtId, name: "Chief Engineer, KMC", role: "Chief Engineer", tier: 8, source: "KMC" },
        { districtId, name: "Director of Education, Kolkata", role: "Director of School Education", tier: 8, source: "WB Education Department" },
        { districtId, name: "Chief Medical Officer of Health", role: "CMOH, Kolkata", tier: 9, source: "Health & Family Welfare, WB" },
        { districtId, name: "Director, KMC SWM", role: "Director, Solid Waste Management", tier: 10, source: "KMC SWM" },
      ],
    });
    console.log("  ✅ Leadership seeded (38 leaders)");
  } else {
    console.log(`  ⏭  Leadership already exists (${leadershipCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // B. BUDGET DATA — KMC Budget
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding budget data...");

  const budgetCount = await prisma.budgetEntry.count({ where: { districtId } });
  if (budgetCount === 0) {
    // KMC Budget ~₹8,000 Cr (estimated 2025-26)
    await prisma.budgetEntry.createMany({
      skipDuplicates: true,
      data: [
        { districtId, fiscalYear: "2025-26", sector: "Roads & Bridges", allocated: 18000000000, released: 14000000000, spent: 11000000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Drainage & Sewerage", allocated: 15000000000, released: 12000000000, spent: 9500000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Street Lighting", allocated: 6000000000, released: 5000000000, spent: 4200000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Health & Hospitals", allocated: 12000000000, released: 9500000000, spent: 7800000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Education", allocated: 8000000000, released: 7000000000, spent: 5800000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Solid Waste Management", allocated: 10000000000, released: 8000000000, spent: 6500000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Parks & Gardens", allocated: 4000000000, released: 3200000000, spent: 2500000000, source: "KMC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Water Supply", allocated: 7000000000, released: 5500000000, spent: 4500000000, source: "KMC Budget 2025-26" },
      ],
    });
    console.log("  ✅ Budget data seeded (8 sectors, ~₹8,000 Cr total)");
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
        // Metro
        { districtId, name: "Kolkata Metro East-West Corridor (Line 2)", category: "METRO", status: "IN_PROGRESS", budget: 89000000000, progressPct: 85, startDate: new Date("2009-02-01"), expectedEnd: new Date("2027-06-30"), contractor: "KMRC / Afcons / ITD", source: "KMRC official reports" },
        { districtId, name: "Kolkata Metro Line 3 (Joka-Esplanade)", category: "METRO", status: "IN_PROGRESS", budget: 48000000000, progressPct: 60, startDate: new Date("2015-04-01"), expectedEnd: new Date("2027-12-31"), contractor: "RVNL / Various", source: "RVNL project updates" },
        { districtId, name: "Kolkata Metro Line 4 (Noapara-Barasat)", category: "METRO", status: "IN_PROGRESS", budget: 33000000000, progressPct: 30, startDate: new Date("2019-08-01"), expectedEnd: new Date("2028-12-31"), contractor: "RVNL", source: "RVNL project updates" },
        { districtId, name: "Kolkata Metro Line 5 (Baranagar-Barrackpore)", category: "METRO", status: "PLANNED", budget: 25000000000, progressPct: 5, startDate: new Date("2024-01-01"), expectedEnd: new Date("2030-12-31"), contractor: "RVNL", source: "RVNL project updates" },

        // Roads
        { districtId, name: "Tallah Bridge Replacement", category: "ROAD", status: "COMPLETED", budget: 5500000000, progressPct: 100, startDate: new Date("2020-09-01"), expectedEnd: new Date("2025-03-31"), contractor: "Kolkata Metro Railway", source: "PWD West Bengal" },
        { districtId, name: "Garden Reach Flyover", category: "ROAD", status: "IN_PROGRESS", budget: 4200000000, progressPct: 50, startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-12-31"), contractor: "PWD West Bengal", source: "PWD West Bengal" },
        { districtId, name: "Sealdah Flyover", category: "ROAD", status: "IN_PROGRESS", budget: 3800000000, progressPct: 45, startDate: new Date("2021-06-01"), expectedEnd: new Date("2026-06-30"), contractor: "PWD / KMDA", source: "PWD / KMDA" },

        // River & Environment
        { districtId, name: "Hooghly Riverfront Development", category: "URBAN_RENEWAL", status: "IN_PROGRESS", budget: 15000000000, progressPct: 25, startDate: new Date("2021-01-01"), expectedEnd: new Date("2028-12-31"), contractor: "KMDA", source: "KMDA" },
        { districtId, name: "East Kolkata Wetlands Conservation", category: "ENVIRONMENT", status: "IN_PROGRESS", budget: 3000000000, progressPct: 40, startDate: new Date("2019-01-01"), expectedEnd: new Date("2030-12-31"), contractor: "EKWMA / State", source: "EKWMA" },

        // Housing
        { districtId, name: "HIDCO New Town Development", category: "HOUSING", status: "IN_PROGRESS", budget: 20000000000, progressPct: 70, startDate: new Date("2000-01-01"), expectedEnd: new Date("2030-12-31"), contractor: "HIDCO / Various", source: "HIDCO" },
        { districtId, name: "Joka Township Expansion", category: "HOUSING", status: "IN_PROGRESS", budget: 8000000000, progressPct: 30, startDate: new Date("2020-06-01"), expectedEnd: new Date("2028-12-31"), contractor: "State Housing Board", source: "WB Housing Board" },

        // Smart City
        { districtId, name: "Kolkata Smart City — New Town", category: "SMART_CITY", status: "IN_PROGRESS", budget: 18000000000, progressPct: 55, startDate: new Date("2018-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "New Town Kolkata Dev Authority", source: "Smart City Mission" },
        { districtId, name: "Kolkata Metro Line 1 Modernization", category: "METRO", status: "IN_PROGRESS", budget: 12000000000, progressPct: 40, startDate: new Date("2020-01-01"), expectedEnd: new Date("2027-06-30"), contractor: "Metro Railway Kolkata", source: "Metro Railway Kolkata" },
      ],
    });
    console.log("  ✅ Infrastructure projects seeded (13 projects)");
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
        { districtId, year: 2011, population: 4486679, sexRatio: 899, literacy: 87.14, urbanPct: 100, density: 24252, source: "Census of India 2011" },
        { districtId, year: 2001, population: 4572876, sexRatio: 828, literacy: 81.31, urbanPct: 100, density: 24760, source: "Census of India 2001" },
        { districtId, year: 1991, population: 4399819, sexRatio: 799, literacy: 77.61, urbanPct: 100, density: 23783, source: "Census of India 1991" },
      ],
    });
    console.log("  ✅ Population history seeded (3 records)");
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
        { districtId, name: "Lalbazar (Kolkata Police HQ)", address: "36 Lalbazar Street, Kolkata 700001", phone: "033-22143024" },
        { districtId, name: "Park Street Police Station", address: "Park Street, Kolkata 700016", phone: "033-22170460" },
        { districtId, name: "New Market Police Station", address: "Lindsay Street, Kolkata 700087", phone: "033-22521515" },
        { districtId, name: "Bowbazar Police Station", address: "Bowbazar Street, Kolkata 700012", phone: "033-22366200" },
        { districtId, name: "Jorasanko Police Station", address: "Rabindra Sarani, Kolkata 700007", phone: "033-22690250" },
        { districtId, name: "Bhawanipur Police Station", address: "Hazra Road, Bhawanipur, Kolkata 700025", phone: "033-24741225" },
        { districtId, name: "Lake Town Police Station", address: "VIP Road, Lake Town, Kolkata 700089", phone: "033-25285000" },
        { districtId, name: "Gariahat Police Station", address: "Gariahat Road, Kolkata 700029", phone: "033-24610320" },
        { districtId, name: "Tollygunge Police Station", address: "SP Mukherjee Road, Tollygunge, Kolkata 700033", phone: "033-24231000" },
        { districtId, name: "Alipore Police Station", address: "Alipore Road, Kolkata 700027", phone: "033-24795050" },
        { districtId, name: "Shyambazar Police Station", address: "Shyambazar Five Point Crossing, Kolkata 700004", phone: "033-25534350" },
        { districtId, name: "Jadavpur Police Station", address: "Raja SC Mullick Road, Jadavpur, Kolkata 700032", phone: "033-24732000" },
        { districtId, name: "Salt Lake Police Station", address: "Sector V, Salt Lake, Kolkata 700091", phone: "033-23591000" },
        { districtId, name: "Garden Reach Police Station", address: "Garden Reach Road, Kolkata 700024", phone: "033-24690250" },
        { districtId, name: "Kidderpore Police Station", address: "Karl Marx Sarani, Kidderpore, Kolkata 700023", phone: "033-24494350" },
        { districtId, name: "Beliaghata Police Station", address: "APC Road, Beliaghata, Kolkata 700010", phone: "033-23501100" },
        { districtId, name: "Hare Street Police Station", address: "Hare Street, Kolkata 700001", phone: "033-22481200" },
        { districtId, name: "Cossipore Police Station", address: "Cossipore Road, Kolkata 700002", phone: "033-25563500" },
        { districtId, name: "Entally Police Station", address: "Entally Market, Kolkata 700014", phone: "033-22842000" },
        { districtId, name: "Kasba Police Station", address: "EM Bypass, Kasba, Kolkata 700042", phone: "033-24420250" },
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
        { districtId, name: "South Point High School", type: "PRIVATE", level: "Senior Secondary", address: "Mandeville Gardens, Ballygunge, Kolkata 700019", students: 8000, teachers: 300, studentTeacherRatio: 26.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "La Martiniere for Boys", type: "PRIVATE", level: "Senior Secondary", address: "11 Loudon Street, Kolkata 700017", students: 3500, teachers: 150, studentTeacherRatio: 23.3, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "La Martiniere for Girls", type: "PRIVATE", level: "Senior Secondary", address: "Rawdon Street, Kolkata 700017", students: 2800, teachers: 130, studentTeacherRatio: 21.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "St. Xavier's Collegiate School", type: "PRIVATE", level: "Senior Secondary", address: "30 Mother Teresa Sarani, Kolkata 700016", students: 3000, teachers: 140, studentTeacherRatio: 21.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Don Bosco School (Park Circus)", type: "PRIVATE", level: "Senior Secondary", address: "19 AJC Bose Road, Kolkata 700017", students: 2500, teachers: 110, studentTeacherRatio: 22.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Patha Bhavan", type: "PRIVATE", level: "Senior Secondary", address: "1 Mohor Kunja, Kolkata 700020", students: 2000, teachers: 100, studentTeacherRatio: 20.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Calcutta Boys School", type: "PRIVATE", level: "Senior Secondary", address: "72 SN Banerjee Road, Kolkata 700014", students: 2200, teachers: 100, studentTeacherRatio: 22.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Modern High School for Girls", type: "PRIVATE", level: "Senior Secondary", address: "85 Syed Amir Ali Avenue, Kolkata 700019", students: 2400, teachers: 110, studentTeacherRatio: 21.8, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Julien Day School (Kalyani)", type: "PRIVATE", level: "Senior Secondary", address: "63B Rafi Ahmed Kidwai Road, Kolkata 700016", students: 1800, teachers: 85, studentTeacherRatio: 21.2, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Loreto House", type: "PRIVATE", level: "Senior Secondary", address: "7 Middleton Row, Kolkata 700071", students: 2000, teachers: 95, studentTeacherRatio: 21.1, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Hare School", type: "GOVERNMENT", level: "Senior Secondary", address: "87/A Mahatma Gandhi Road, Kolkata 700007", students: 3000, teachers: 120, studentTeacherRatio: 25.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Hindu School", type: "GOVERNMENT", level: "Senior Secondary", address: "71 Amherst Street, Kolkata 700009", students: 2800, teachers: 115, studentTeacherRatio: 24.3, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Scottish Church Collegiate School", type: "PRIVATE", level: "Senior Secondary", address: "1-3 Urquhart Square, Kolkata 700006", students: 2000, teachers: 90, studentTeacherRatio: 22.2, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Mahadevi Birla World Academy", type: "PRIVATE", level: "Senior Secondary", address: "64A Syed Amir Ali Avenue, Kolkata 700019", students: 2500, teachers: 120, studentTeacherRatio: 20.8, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Delhi Public School (Ruby Park)", type: "PRIVATE", level: "Senior Secondary", address: "Ruby Park, EM Bypass, Kolkata 700078", students: 3000, teachers: 140, studentTeacherRatio: 21.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Kendriya Vidyalaya Fort William", type: "CENTRAL_GOVT", level: "Senior Secondary", address: "Fort William, Kolkata 700021", students: 1500, teachers: 70, studentTeacherRatio: 21.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "St. James School", type: "PRIVATE", level: "Senior Secondary", address: "165A AJC Bose Road, Kolkata 700014", students: 2000, teachers: 95, studentTeacherRatio: 21.1, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Loreto Day School (Sealdah)", type: "PRIVATE", level: "Senior Secondary", address: "AJC Bose Road, Sealdah, Kolkata 700014", students: 1800, teachers: 85, studentTeacherRatio: 21.2, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Apeejay School (Park Street)", type: "PRIVATE", level: "Senior Secondary", address: "15 Park Street, Kolkata 700016", students: 2200, teachers: 100, studentTeacherRatio: 22.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Techno India Group Public School (Salt Lake)", type: "PRIVATE", level: "Senior Secondary", address: "Sector V, Salt Lake, Kolkata 700091", students: 2000, teachers: 95, studentTeacherRatio: 21.1, hasToilets: true, hasLibrary: true, hasLab: true },
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
        { districtId, name: "Nabanna (West Bengal State Secretariat)", type: "STATE", department: "Government of West Bengal", address: "325 Sarat Chatterjee Road, Howrah 711102", phone: "033-22145555", services: ["State government offices", "CM office", "All department secretariats"] },
        { districtId, name: "KMC Head Office", type: "MUNICIPAL", department: "Kolkata Municipal Corporation", address: "5 SN Banerjee Road, Kolkata 700013", phone: "033-22861000", services: ["Property tax", "Birth/death certificates", "Trade licenses", "Building plan approvals"] },
        { districtId, name: "Writers' Building", type: "STATE", department: "Government of West Bengal", address: "BBD Bagh, Kolkata 700001", phone: "033-22141234", services: ["Historic state secretariat (under renovation)", "Multiple state departments"] },
        { districtId, name: "Kolkata Collectorate", type: "DISTRICT", department: "Revenue Department", address: "DM Office, Kolkata", phone: "033-22487000", services: ["Land records", "Revenue services", "Arms licenses", "Domicile certificates"] },
        { districtId, name: "Passport Seva Kendra (Kolkata)", type: "CENTRAL", department: "Ministry of External Affairs", address: "Purta Bhavan, Salt Lake, Kolkata 700091", phone: "1800-258-1800", services: ["Passport application", "Renewal", "Tatkal passport"] },
        { districtId, name: "Income Tax Office (Kolkata)", type: "CENTRAL", department: "CBDT / Income Tax Dept", address: "Aayakar Bhavan, PGT Road, Kolkata 700016", phone: "033-22810700", services: ["Income tax filing", "PAN", "TDS", "Refunds"] },
        { districtId, name: "RTO Kolkata", type: "STATE", department: "Transport Department", address: "Jessore Road, Barasat, Kolkata", phone: "033-25252000", services: ["Driving license", "Vehicle registration", "Fitness certificates"] },
        { districtId, name: "Employment Exchange Kolkata", type: "STATE", department: "Labour Department", address: "Employment Exchange, Park Street area, Kolkata", phone: "033-22178800", services: ["Job registration", "Employment guidance"] },
      ],
    });
    console.log("  ✅ Government offices seeded (8 offices)");
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
        // West Bengal State Schemes
        { districtId, name: "Kanyashree Prakalpa", level: "STATE", category: "Women & Child Development", eligibility: "Girls aged 13-18, enrolled in school, family income below ₹1.2 lakh/year", amount: 25000, beneficiaryCount: 50000, applyUrl: "https://wbkanyashree.gov.in", source: "WB Women & Child Development Dept" },
        { districtId, name: "Swasthya Sathi", level: "STATE", category: "Health", eligibility: "All families in West Bengal", amount: 500000, beneficiaryCount: 100000, applyUrl: "https://swasthyasathi.gov.in", source: "WB Health & Family Welfare Dept" },
        { districtId, name: "Lakshmir Bhandar", level: "STATE", category: "Women & Child Development", eligibility: "Women aged 25-60, WB domicile", amount: 12000, beneficiaryCount: 200000, source: "WB Women & Child Development Dept" },
        { districtId, name: "Sabuj Sathi (Sabooj Sathi)", level: "STATE", category: "Education", eligibility: "Students in Classes 9-12 in WB schools", source: "WB Education Department" },
        { districtId, name: "Sikshashree", level: "STATE", category: "Education", eligibility: "SC/ST/OBC students in WB, family income below ₹2.5 lakh/year", amount: 1500, source: "WB BC Welfare Dept" },

        // Central Schemes
        { districtId, name: "Ayushman Bharat — PMJAY", level: "CENTRAL", category: "Health", eligibility: "SECC 2011 identified families", amount: 500000, applyUrl: "https://pmjay.gov.in", source: "National Health Authority" },
        { districtId, name: "PM-KISAN", level: "CENTRAL", category: "Agriculture", eligibility: "All farmer families with cultivable land", amount: 6000, applyUrl: "https://pmkisan.gov.in", source: "Ministry of Agriculture" },
        { districtId, name: "Pradhan Mantri Ujjwala Yojana", level: "CENTRAL", category: "Energy", eligibility: "Women from BPL households", applyUrl: "https://www.pmuy.gov.in", source: "Ministry of Petroleum" },
      ],
    });
    console.log("  ✅ Government schemes seeded (8 schemes)");
  } else {
    console.log(`  ⏭  Schemes already exist (${schemeCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // I. ELECTION RESULTS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding election results...");

  const electionCount = await prisma.electionResult.count({ where: { districtId } });
  if (electionCount === 0) {
    await prisma.electionResult.createMany({
      skipDuplicates: true,
      data: [
        // 2024 Lok Sabha
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Kolkata North", winnerName: "Sudip Bandyopadhyay", winnerParty: "TMC", winnerVotes: 550000, runnerUpName: "Tapas Roy", runnerUpParty: "BJP", runnerUpVotes: 430000, margin: 120000, totalVoters: 1600000, votesPolled: 883200, turnoutPct: 55.2, source: "ECI 2024 results" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Kolkata South", winnerName: "Mala Roy", winnerParty: "TMC", winnerVotes: 480000, runnerUpName: "Debasree Chaudhuri", runnerUpParty: "BJP", runnerUpVotes: 395000, margin: 85000, totalVoters: 1500000, votesPolled: 822000, turnoutPct: 54.8, source: "ECI 2024 results" },

        // 2021 WB Assembly (key Kolkata seats)
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Bhawanipore", winnerName: "Mamata Banerjee", winnerParty: "TMC", winnerVotes: 85000, runnerUpName: "Priyanka Tibrewal", runnerUpParty: "BJP", runnerUpVotes: 26168, margin: 58832, totalVoters: 220000, votesPolled: 117260, turnoutPct: 53.3, source: "ECI WB Assembly 2021" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Kolkata Port", winnerName: "Firhad Hakim", winnerParty: "TMC", winnerVotes: 95000, runnerUpName: "Meena Devi Purohit", runnerUpParty: "BJP", runnerUpVotes: 70000, margin: 25000, totalVoters: 230000, votesPolled: 138230, turnoutPct: 60.1, source: "ECI WB Assembly 2021" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Rashbehari", winnerName: "Debasish Kumar", winnerParty: "TMC", winnerVotes: 88000, runnerUpName: "BJP candidate", runnerUpParty: "BJP", runnerUpVotes: 53000, margin: 35000, totalVoters: 240000, votesPolled: 140400, turnoutPct: 58.5, source: "ECI WB Assembly 2021" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Chowranghee", winnerName: "Nayna Bandyopadhyay", winnerParty: "TMC", winnerVotes: 72000, runnerUpName: "BJP candidate", runnerUpParty: "BJP", runnerUpVotes: 50000, margin: 22000, totalVoters: 200000, votesPolled: 112400, turnoutPct: 56.2, source: "ECI WB Assembly 2021" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Entally", winnerName: "Swarna Kamal Saha", winnerParty: "TMC", winnerVotes: 98000, runnerUpName: "BJP candidate", runnerUpParty: "BJP", runnerUpVotes: 80000, margin: 18000, totalVoters: 250000, votesPolled: 155000, turnoutPct: 62.0, source: "ECI WB Assembly 2021" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Jorasanko", winnerName: "Vivek Gupta", winnerParty: "TMC", winnerVotes: 88000, runnerUpName: "BJP candidate", runnerUpParty: "BJP", runnerUpVotes: 58000, margin: 30000, totalVoters: 220000, votesPolled: 135300, turnoutPct: 61.5, source: "ECI WB Assembly 2021" },
      ],
    });
    console.log("  ✅ Election results seeded (8 records)");
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
        { districtId, courtName: "Calcutta High Court (Original Side)", pending: 280000, disposed: 120000, filed: 140000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "City Sessions Court, Kolkata", pending: 65000, disposed: 35000, filed: 40000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "City Civil Court, Kolkata", pending: 55000, disposed: 28000, filed: 32000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Small Causes Court, Kolkata", pending: 35000, disposed: 18000, filed: 20000, year: 2025, source: "NJDG / ecourts.gov.in" },
      ],
    });
    console.log("  ✅ Court statistics seeded (4 courts)");
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
        { districtId, topic: "KMC Road Repair Status", department: "KMC — Roads Department", pioAddress: "PIO, KMC Roads Dept, 5 SN Banerjee Road, Kolkata 700013", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) All road repair works sanctioned in Borough ___ during FY 2025-26. (2) Contractor name, work order value, completion timeline. (3) Total expenditure on road maintenance. (4) Waterlogging complaints received and resolved." },
        { districtId, topic: "KMC Property Tax Assessment", department: "KMC — Assessment", pioAddress: "PIO, KMC Assessment Dept, 5 SN Banerjee Road, Kolkata 700013", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Property tax assessment methodology for premises at ___. (2) Unit area rates applied. (3) Total property tax collected borough-wise for FY 2025-26." },
        { districtId, topic: "Kolkata Metro Project Status", department: "KMRC / Metro Railway", pioAddress: "PIO, KMRC, Kolkata Metro Rail Corporation Ltd, Kolkata", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Current completion percentage of East-West Metro corridor. (2) Revised cost estimate vs sanctioned cost. (3) Expected commissioning date of full corridor." },
        { districtId, topic: "Drainage & Waterlogging Status", department: "KMC — Drainage", pioAddress: "PIO, KMC Drainage Dept, 5 SN Banerjee Road, Kolkata 700013", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) List of chronic waterlogging points in Borough ___. (2) Drainage improvement works completed in last 2 years. (3) Pump station capacity and maintenance schedule." },
        { districtId, topic: "Building Plan Approval Status", department: "KMC — Building Dept", pioAddress: "PIO, KMC Building Dept, 5 SN Banerjee Road, Kolkata 700013", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Status of building plan application no. ___. (2) List of unauthorized constructions in Borough ___. (3) Action taken on each unauthorized construction." },
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
        { districtId, name: "Rabindranath Tagore", category: "ARTS", bio: "Nobel laureate (Literature, 1913). Poet, writer, composer. Wrote national anthems of India and Bangladesh. Born in Jorasanko, Kolkata.", birthYear: 1861, deathYear: 1941, birthPlace: "Jorasanko, Kolkata", bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Satyajit Ray", category: "ARTS", bio: "Legendary filmmaker. Pather Panchali, Apu Trilogy. Honorary Oscar. Bharat Ratna. Born and lived in Kolkata.", birthYear: 1921, deathYear: 1992, birthPlace: "Kolkata", bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Subhas Chandra Bose", category: "FREEDOM_FIGHTER", bio: "Netaji. Founded Indian National Army (INA). Key freedom fighter from Kolkata. His ancestral home is in Elgin Road.", birthYear: 1897, deathYear: 1945, birthPlace: "Cuttack (ancestral home in Kolkata)", bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Mother Teresa", category: "SOCIAL", bio: "Saint. Founded Missionaries of Charity in Kolkata. Nobel Peace Prize 1979. Canonized 2016. Served the poor of Kolkata for decades.", birthYear: 1910, deathYear: 1997, birthPlace: "Skopje (lived in Kolkata)", bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Sourav Ganguly", category: "SPORTS", bio: "Dada of Indian cricket. Former India captain & BCCI president. Kolkata's sporting icon. Prince of Kolkata.", birthYear: 1972, birthPlace: "Kolkata", bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Amartya Sen", category: "SCIENCE", bio: "Nobel laureate (Economics, 1998). Welfare economics, social choice theory. Born in Shantiniketan, educated at Presidency College, Kolkata.", birthYear: 1933, birthPlace: "Shantiniketan", bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Swami Vivekananda", category: "SOCIAL", bio: "Hindu monk, philosopher. Founded Ramakrishna Mission. Famous Chicago Parliament of Religions speech (1893). Born in Kolkata.", birthYear: 1863, deathYear: 1902, birthPlace: "Kolkata", bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Satyendra Nath Bose", category: "SCIENCE", bio: "Physicist. Bose-Einstein statistics, Boson particle named after him. Worked at University of Calcutta and Dhaka University.", birthYear: 1894, deathYear: 1974, birthPlace: "Kolkata", bornInDistrict: true, source: "wikipedia" },
        { districtId, name: "Jagadish Chandra Bose", category: "SCIENCE", bio: "Polymath scientist. Pioneer in radio science, plant physiology. Founded Bose Institute in Kolkata.", birthYear: 1858, deathYear: 1937, birthPlace: "Mymensingh (now Bangladesh)", bornInDistrict: false, source: "wikipedia" },
        { districtId, name: "Suchitra Sen", category: "ARTS", bio: "Legendary Bengali actress. 'Mahanayika' (the great heroine). Icon of Bengali cinema. Lived in Kolkata.", birthYear: 1931, deathYear: 2014, birthPlace: "Pabna (now Bangladesh)", bornInDistrict: false, source: "wikipedia" },
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
        { districtId, name: "Salt Lake Sector V IT Hub", type: "IT_PARK", category: "IT", location: "Sector V, Salt Lake, Kolkata", details: { description: "Kolkata's primary IT/ITES hub. TCS, Wipro, Cognizant, Infosys offices.", employmentEstimate: 100000 }, source: "NASSCOM / WEBEL" },
        { districtId, name: "Rajarhat New Town IT Park", type: "IT_PARK", category: "IT", location: "Rajarhat, New Town, Kolkata", details: { description: "Newer IT hub adjacent to Salt Lake. WEBEL IT Park, Unitech complex.", employmentEstimate: 50000 }, source: "NASSCOM / WEBEL" },
        { districtId, name: "Jute Industry", type: "MANUFACTURING", category: "MANUFACTURING", location: "Hooghly riverside, Howrah-Kolkata belt", details: { description: "Kolkata was the jute capital of the world. Several jute mills still operate along Hooghly.", employmentEstimate: 200000 }, source: "IJMA" },
        { districtId, name: "Tea Trading", type: "TRADING_HUB", category: "TRADE", location: "BBD Bagh, Kolkata", details: { description: "Kolkata Tea Auction Centre — world's largest tea auction. India's tea trade is headquartered in Kolkata.", employmentEstimate: 30000 }, source: "Tea Board of India" },
        { districtId, name: "Durga Puja Economy", type: "CULTURAL_INDUSTRY", category: "CULTURAL_INDUSTRY", location: "Across Kolkata", details: { description: "Durga Puja (UNESCO Intangible Heritage) generates ~₹40,000 Cr annually. Art, idols, pandals, tourism, hospitality.", employmentEstimate: 300000 }, source: "FICCI / UNESCO" },
        { districtId, name: "Kolkata Leather Industry", type: "MANUFACTURING", category: "MANUFACTURING", location: "Tangra, Bantala, East Kolkata", details: { description: "Tangra and Bantala leather complex. Export-oriented. One of India's largest leather clusters.", employmentEstimate: 50000 }, source: "CLE India" },
        { districtId, name: "Garden Reach Shipbuilders (GRSE)", type: "DEFENCE_PSU", category: "DEFENCE", location: "Garden Reach, Kolkata", details: { description: "Major defence shipyard. Builds warships for Indian Navy. Miniratna PSU.", employmentEstimate: 8000 }, source: "GRSE official" },
        { districtId, name: "Printing & Publishing Industry", type: "PUBLISHING", category: "MEDIA", location: "College Street, Kolkata", details: { description: "Kolkata is a major publishing hub. College Street — Asia's largest book market. ABP Group, Ananda Publishers.", employmentEstimate: 40000 }, source: "Federation of Publishers" },
        { districtId, name: "Calcutta Stock Exchange", type: "FINANCIAL_INSTITUTION", category: "FINANCE", location: "Lyons Range, Kolkata", details: { description: "India's second oldest stock exchange (1908). Now primarily a regional exchange.", employmentEstimate: 5000 }, source: "CSE official" },
        { districtId, name: "Howrah Small-Scale Engineering", type: "MSME_CLUSTER", category: "MSME", location: "Howrah-Kolkata industrial belt", details: { description: "Howrah-Kolkata belt has thousands of small engineering workshops. Nuts, bolts, castings, auto parts.", employmentEstimate: 150000 }, source: "MSME Ministry" },
      ],
    });
    console.log("  ✅ Local industries seeded (10 industries)");
  } else {
    console.log(`  ⏭  Local industries already exist (${industryCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // N. BUS ROUTES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding bus routes...");

  const busCount = await prisma.busRoute.count({ where: { districtId } });
  if (busCount === 0) {
    await prisma.busRoute.createMany({
      skipDuplicates: true,
      data: [
        { districtId, routeNumber: "S-12", origin: "Howrah Station", destination: "Salt Lake Sector V", via: "BBD Bagh, Sealdah, EM Bypass", frequency: "10 min", operator: "SBSTC / WBSTC", busType: "Ordinary" },
        { districtId, routeNumber: "S-32", origin: "Esplanade", destination: "Garia Station", via: "Park Street, Ballygunge, Gariahat, Golpark", frequency: "8 min", operator: "WBSTC", busType: "Ordinary" },
        { districtId, routeNumber: "AC-20", origin: "Howrah Station", destination: "NSC Bose Airport", via: "BBD Bagh, Park Street, EM Bypass, VIP Road", frequency: "20 min", operator: "WBSTC (AC)", busType: "AC" },
        { districtId, routeNumber: "DN-9", origin: "Dum Dum", destination: "BBD Bagh", via: "Nagerbazar, Shyambazar, Girish Park", frequency: "8 min", operator: "Private", busType: "Ordinary" },
        { districtId, routeNumber: "230", origin: "Tollygunge Metro", destination: "New Town Eco Park", via: "Gariahat, EM Bypass, Salt Lake, Rajarhat", frequency: "15 min", operator: "WBSTC", busType: "Ordinary" },
        { districtId, routeNumber: "TRAM-25", origin: "Esplanade", destination: "Shyambazar", via: "College Street, MG Road", frequency: "20 min", operator: "CTC (Calcutta Tramways Corp)", busType: "Tram" },
        { districtId, routeNumber: "E-32", origin: "Sealdah Station", destination: "Salt Lake Sector V", via: "APC Road, VIP Road", frequency: "15 min", operator: "WBSTC (Electric)", busType: "Electric" },
        { districtId, routeNumber: "MINI-12", origin: "Jadavpur 8B", destination: "Esplanade", via: "Golpark, Gariahat, Park Circus", frequency: "5 min", operator: "Private Mini", busType: "Mini" },
      ],
    });
    console.log("  ✅ Bus routes seeded (8 routes including heritage tram)");
  } else {
    console.log(`  ⏭  Bus routes already exist (${busCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // O. TRAIN SCHEDULES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding train schedules...");

  const trainCount = await prisma.trainSchedule.count({ where: { districtId } });
  if (trainCount === 0) {
    await prisma.trainSchedule.createMany({
      skipDuplicates: true,
      data: [
        // Kolkata Metro
        { districtId, trainNumber: "METRO-L1", trainName: "Kolkata Metro Line 1 (Blue Line)", origin: "Kavi Subhash (New Garia)", destination: "Dakshineswar", stationName: "Kolkata Metro (various stations)", departureTime: "06:45", arrivalTime: "07:45", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "METRO-EW", trainName: "East-West Metro (Green Line)", origin: "Howrah Maidan", destination: "Salt Lake Sector V", stationName: "Kolkata Metro (various stations)", departureTime: "07:00", arrivalTime: "07:35", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },

        // Kolkata Suburban
        { districtId, trainNumber: "SEALDAH-LOCAL", trainName: "Sealdah Suburban Local", origin: "Sealdah", destination: "Various (Budge Budge/Diamond Harbour/Lakshmikantapur)", stationName: "Sealdah", departureTime: "04:30", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "HOWRAH-LOCAL", trainName: "Howrah Division Local", origin: "Howrah", destination: "Various (Barddhaman/Kharagpur)", stationName: "Howrah", departureTime: "04:30", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },

        // Long Distance from Howrah / Kolkata
        { districtId, trainNumber: "12301", trainName: "Howrah Rajdhani Express", origin: "Howrah", destination: "New Delhi", stationName: "Howrah Junction", departureTime: "16:55", arrivalTime: "09:55", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12839", trainName: "Howrah-Chennai Mail", origin: "Howrah", destination: "Chennai Central", stationName: "Howrah Junction", departureTime: "23:50", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12859", trainName: "Gitanjali Express", origin: "Howrah", destination: "CSMT Mumbai", stationName: "Howrah Junction", departureTime: "14:20", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12345", trainName: "Saraighat Express", origin: "Howrah", destination: "Guwahati", stationName: "Howrah Junction", departureTime: "15:50", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12381", trainName: "Poorva Express", origin: "Howrah", destination: "New Delhi", stationName: "Howrah Junction", departureTime: "20:10", daysOfWeek: ["Mon", "Wed", "Fri"] },
        { districtId, trainNumber: "12841", trainName: "Coromandel Express", origin: "Howrah", destination: "Chennai Central", stationName: "Howrah Junction", departureTime: "14:50", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
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
        { districtId, serviceName: "Property Mutation in Kolkata", category: "REVENUE", office: "KMC — Assessment Department", documentsNeeded: ["Sale deed / succession certificate", "Previous tax receipts", "Identity proof", "Address proof", "Death certificate (if inheritance)"], steps: ["Apply at KMC Assessment Dept or online at kmcgov.in", "Submit sale deed / succession certificate", "Pay mutation fee (2% of property value)", "KMC inspection and verification", "Mutation recorded in assessment register", "New tax bill issued in buyer's name"], fees: "2% of property value", timeline: "30-60 days" },
        { districtId, serviceName: "Trade License from KMC", category: "BUSINESS", office: "KMC — License Department", documentsNeeded: ["PAN", "Aadhaar", "Address proof of premises", "Rent agreement / ownership proof", "Photos of establishment"], steps: ["Apply online at kmcgov.in or at ward office", "Fill Form-A with business details", "Submit documents: ID proof, address proof, rent agreement", "Pay license fee based on business category", "KMC inspection of premises", "License issued within 15-30 days", "Renew annually before March 31"], fees: "₹500-₹5,000 based on business type and area", timeline: "15-30 days" },
        { districtId, serviceName: "Birth/Death Certificate (KMC)", category: "CIVIL", office: "KMC — Health Department", documentsNeeded: ["Hospital discharge slip", "Parent IDs (birth)", "Death report from hospital (death)"], steps: ["Visit nearest KMC ward office or apply online at kmcgov.in", "Fill Form-1 (birth) or Form-2 (death)", "Submit within 21 days of event (free) or with late fee", "Certificate issued within 7-14 days", "For old records, apply at central office with details"], fees: "Free within 21 days, ₹2-50 after", timeline: "7-14 days" },
        { districtId, serviceName: "Caste Certificate (WB)", category: "REVENUE", office: "DM Office / BDO", documentsNeeded: ["School certificate (mentioning caste)", "Parent's caste certificate", "Address proof", "Aadhaar"], steps: ["Apply at DM Office or BDO office or Duare Sarkar camp", "Fill application with family details", "Submit documents", "Field verification by revenue inspector", "Certificate issued by SDO/DM", "Valid for lifetime unless challenged"], fees: "Free", timeline: "21-45 days" },
        { districtId, serviceName: "Water Connection (KMC)", category: "UTILITIES", office: "KMC — Water Supply", documentsNeeded: ["Property deed / rent agreement", "KMC assessment receipt", "Identity proof"], steps: ["Apply at KMC Water Supply section or ward office", "Submit property documents and KMC assessment receipt", "KMC survey of premises", "Pay connection charges", "Connection provided within 15-30 days"], fees: "₹2,000-₹10,000 based on pipe size", timeline: "15-30 days" },
      ],
    });
    console.log("  ✅ Service guides seeded (5 guides)");
  } else {
    console.log(`  ⏭  Service guides already exist (${serviceCount} records)`);
  }

  console.log("\n✅ Kolkata district data seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
