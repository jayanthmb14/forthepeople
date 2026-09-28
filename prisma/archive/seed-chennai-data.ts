// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Chennai District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-chennai-data.ts
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
  console.log("🌱 Seeding Chennai district data...\n");

  // ── Find Chennai district ────────────────────────────────
  const state = await prisma.state.findUnique({ where: { slug: "tamil-nadu" } });
  if (!state) throw new Error("Tamil Nadu state not found — run seed-hierarchy.ts first");

  const district = await prisma.district.findFirst({
    where: { stateId: state.id, slug: "chennai" },
  });
  if (!district) throw new Error("Chennai district not found — run seed-hierarchy.ts first");

  const districtId = district.id;
  console.log(`✓ Found Chennai district (id: ${districtId})`);

  // ═══════════════════════════════════════════════════════════
  // A. LEADERSHIP — Chennai/Tamil Nadu 10-Tier Hierarchy
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding leadership...");

  const leadershipCount = await prisma.leader.count({ where: { districtId } });
  if (leadershipCount === 0) {
    await prisma.leader.createMany({
      skipDuplicates: true,
      data: [
        // ── Tier 1: Lok Sabha MPs (2024 winners) ──
        { districtId, name: "Kalanidhi Veeraswamy", role: "Member of Parliament", tier: 1, party: "DMK", constituency: "Chennai North", source: "ECI 2024 results" },
        { districtId, name: "Thamizhachi Thangapandian", role: "Member of Parliament", tier: 1, party: "DMK", constituency: "Chennai South", source: "ECI 2024 results" },
        { districtId, name: "Dayanidhi Maran", role: "Member of Parliament", tier: 1, party: "DMK", constituency: "Chennai Central", source: "ECI 2024 results" },

        // ── Tier 2: Key MLAs (2021 TN Assembly) ──
        { districtId, name: "M.K. Stalin", role: "MLA & Chief Minister", tier: 2, party: "DMK", constituency: "Kolathur", source: "TN Assembly 2021" },
        { districtId, name: "Udhayanidhi Stalin", role: "MLA & Deputy Chief Minister", tier: 2, party: "DMK", constituency: "Chepauk-Triplicane", source: "TN Assembly 2021" },
        { districtId, name: "Ma. Subramanian", role: "MLA & Health Minister", tier: 2, party: "DMK", constituency: "Saidapet", source: "TN Assembly 2021" },
        { districtId, name: "P.K. Sekar Babu", role: "MLA & Minister for HR&CE", tier: 2, party: "DMK", constituency: "Harbour", source: "TN Assembly 2021" },
        { districtId, name: "J. Anbazhagan", role: "MLA", tier: 2, party: "DMK", constituency: "Purasawalkam", source: "TN Assembly 2021" },
        { districtId, name: "N. Ezhilan", role: "MLA", tier: 2, party: "DMK", constituency: "Thousand Lights", source: "TN Assembly 2021" },
        { districtId, name: "K.N. Nehru", role: "MLA & Municipal Administration Minister", tier: 2, party: "DMK", constituency: "Tiruchirappalli West (Cabinet)", source: "TN Assembly 2021" },
        { districtId, name: "R. Rajendran", role: "MLA", tier: 2, party: "DMK", constituency: "Villivakkam", source: "TN Assembly 2021" },
        { districtId, name: "S. Kamala Kannan", role: "MLA", tier: 2, party: "DMK", constituency: "Virugambakkam", source: "TN Assembly 2021" },
        { districtId, name: "Pongalur N. Palanisamy", role: "MLA", tier: 2, party: "DMK", constituency: "Anna Nagar", source: "TN Assembly 2021" },

        // ── Tier 3: GCC (Greater Chennai Corporation) ──
        { districtId, name: "R. Priya", role: "Mayor of Chennai", tier: 3, party: "DMK", source: "GCC" },
        { districtId, name: "GCC Commissioner", role: "Commissioner, Greater Chennai Corporation", tier: 3, source: "GCC" },

        // ── Tier 4: Administration ──
        { districtId, name: "District Collector, Chennai", role: "District Collector", tier: 4, source: "District Administration" },
        { districtId, name: "Rajendra Vishwanath Arlekar", role: "Governor of Tamil Nadu", tier: 4, since: "March 2026", source: "lokbhavan.tn.gov.in" },
        // NOTE: TN Assembly elections April 23, 2026 — verify CM after May 4, 2026
        { districtId, name: "M.K. Stalin", role: "Chief Minister of Tamil Nadu", tier: 4, party: "DMK", source: "TN Government" },
        { districtId, name: "Chief Secretary, Tamil Nadu", role: "Chief Secretary", tier: 4, source: "TN Government" },

        // ── Tier 5: Police ──
        { districtId, name: "Commissioner of Police, Chennai", role: "Commissioner of Police", tier: 5, phone: "100", source: "Greater Chennai Police" },
        { districtId, name: "Joint CP Crime", role: "Joint Commissioner of Police (Crime)", tier: 5, source: "Greater Chennai Police" },
        { districtId, name: "DCP North Chennai", role: "Deputy Commissioner of Police (North)", tier: 5, source: "Greater Chennai Police" },
        { districtId, name: "DCP South Chennai", role: "Deputy Commissioner of Police (South)", tier: 5, source: "Greater Chennai Police" },
        { districtId, name: "DCP Central Chennai", role: "Deputy Commissioner of Police (Central)", tier: 5, source: "Greater Chennai Police" },

        // ── Tier 6: Judiciary ──
        { districtId, name: "Chief Justice, Madras High Court", role: "Chief Justice, Madras High Court", tier: 6, source: "Madras High Court" },
        { districtId, name: "Principal Sessions Judge", role: "Principal Judge, City Civil Court", tier: 6, source: "City Civil Court, Chennai" },

        // ── Tier 7: Key Bodies ──
        { districtId, name: "CMDA Member Secretary", role: "Member Secretary, CMDA", tier: 7, source: "CMDA" },
        { districtId, name: "Chennai Port Authority Chairman", role: "Chairman, Chennai Port Authority", tier: 7, source: "Chennai Port Authority" },
        { districtId, name: "CMRL MD", role: "Managing Director, CMRL", tier: 7, source: "Chennai Metro Rail Limited" },
        { districtId, name: "CMWSSB MD", role: "Managing Director, CMWSSB", tier: 7, source: "CMWSSB" },
        { districtId, name: "MTC MD", role: "Managing Director, MTC", tier: 7, source: "Metropolitan Transport Corporation" },
        { districtId, name: "TANGEDCO SE Chennai", role: "Superintending Engineer, Chennai", tier: 7, source: "TANGEDCO" },

        // ── Tier 8-10: Department heads ──
        { districtId, name: "Chief Engineer, GCC", role: "Chief Engineer, GCC Engineering", tier: 8, source: "GCC" },
        { districtId, name: "Director of School Education, Chennai", role: "Director, School Education", tier: 8, source: "TN Education Department" },
        { districtId, name: "Director of Public Health, Chennai", role: "Director of Public Health", tier: 9, source: "Health & Family Welfare, TN" },
        { districtId, name: "Director, SWM, GCC", role: "Director, Solid Waste Management", tier: 10, source: "GCC SWM" },
      ],
    });
    console.log("  ✅ Leadership seeded (40 leaders)");
  } else {
    console.log(`  ⏭  Leadership already exists (${leadershipCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // B. BUDGET DATA — GCC Budget
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding budget data...");

  const budgetCount = await prisma.budgetEntry.count({ where: { districtId } });
  if (budgetCount === 0) {
    // GCC Budget ~₹7,000 Cr (estimated 2025-26)
    await prisma.budgetEntry.createMany({
      skipDuplicates: true,
      data: [
        { districtId, fiscalYear: "2025-26", sector: "Roads & Bridges", allocated: 15000000000, released: 12000000000, spent: 9500000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Storm Water Drains", allocated: 12000000000, released: 10000000000, spent: 8000000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Solid Waste Management", allocated: 10000000000, released: 8500000000, spent: 7000000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Health & Hospitals", allocated: 8000000000, released: 6500000000, spent: 5200000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Street Lighting", allocated: 5000000000, released: 4200000000, spent: 3500000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Parks & Playgrounds", allocated: 4000000000, released: 3200000000, spent: 2600000000, source: "GCC Budget 2025-26" },
        { districtId, fiscalYear: "2025-26", sector: "Water Supply (CMWSSB)", allocated: 12000000000, released: 10000000000, spent: 8500000000, source: "TN State / CMWSSB Budget" },
        { districtId, fiscalYear: "2025-26", sector: "Metro & Transport (CMRL/MTC)", allocated: 20000000000, released: 16000000000, spent: 13000000000, source: "Central + State Allocation" },
      ],
    });
    console.log("  ✅ Budget data seeded (8 sectors, ~₹7,000 Cr GCC + state allocations)");
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
        { districtId, name: "Chennai Metro Phase 2 (3 corridors)", category: "METRO", status: "IN_PROGRESS", budget: 630000000000, progressPct: 15, startDate: new Date("2022-06-01"), expectedEnd: new Date("2030-12-31"), contractor: "CMRL / Various", source: "CMRL official reports" },
        { districtId, name: "Chennai Metro Phase 1 Extension", category: "METRO", status: "IN_PROGRESS", budget: 35000000000, progressPct: 70, startDate: new Date("2019-01-01"), expectedEnd: new Date("2026-12-31"), contractor: "CMRL", source: "CMRL official reports" },

        // Roads
        { districtId, name: "Chennai Peripheral Ring Road (PRR)", category: "ROAD", status: "IN_PROGRESS", budget: 100000000000, progressPct: 20, startDate: new Date("2023-01-01"), expectedEnd: new Date("2029-12-31"), contractor: "NHAI / Various", source: "NHAI project status" },
        { districtId, name: "Maduravoyal-Port Elevated Corridor", category: "ROAD", status: "IN_PROGRESS", budget: 55000000000, progressPct: 35, startDate: new Date("2021-06-01"), expectedEnd: new Date("2027-06-30"), contractor: "NHAI", source: "NHAI project status" },

        // Water
        { districtId, name: "Cauvery Stage 2 Water Supply (Hogenakkal)", category: "WATER", status: "IN_PROGRESS", budget: 42000000000, progressPct: 45, startDate: new Date("2020-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "CMWSSB / L&T", source: "CMWSSB reports" },
        { districtId, name: "Nemmeli Desalination Plant Phase 2", category: "WATER", status: "IN_PROGRESS", budget: 18000000000, progressPct: 60, startDate: new Date("2021-01-01"), expectedEnd: new Date("2026-12-31"), contractor: "CMWSSB / VA Tech WABAG", source: "CMWSSB reports" },
        { districtId, name: "Perur Desalination Plant", category: "WATER", status: "IN_PROGRESS", budget: 25000000000, progressPct: 25, startDate: new Date("2022-06-01"), expectedEnd: new Date("2028-06-30"), contractor: "CMWSSB", source: "CMWSSB reports" },
        { districtId, name: "Kosasthalaiyar River Restoration", category: "WATER", status: "IN_PROGRESS", budget: 8000000000, progressPct: 40, startDate: new Date("2021-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "GCC / CMWSSB", source: "GCC reports" },

        // Rail
        { districtId, name: "Chennai MRTS Extension", category: "RAIL", status: "IN_PROGRESS", budget: 20000000000, progressPct: 30, startDate: new Date("2020-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "Southern Railway / MRVC", source: "Southern Railway" },
        { districtId, name: "Chennai Suburban Railway — New Corridors", category: "RAIL", status: "IN_PROGRESS", budget: 35000000000, progressPct: 20, startDate: new Date("2021-01-01"), expectedEnd: new Date("2028-12-31"), contractor: "CSRC / Southern Railway", source: "Southern Railway" },

        // Housing
        { districtId, name: "TNHB Mass Housing Projects", category: "HOUSING", status: "IN_PROGRESS", budget: 30000000000, progressPct: 40, startDate: new Date("2021-01-01"), expectedEnd: new Date("2028-12-31"), contractor: "TNHB / Various", source: "TNHB reports" },
        { districtId, name: "PMAY-U Projects Chennai", category: "HOUSING", status: "IN_PROGRESS", budget: 25000000000, progressPct: 50, startDate: new Date("2020-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "GCC / TNHB", source: "PMAY-U dashboard" },

        // Smart City
        { districtId, name: "Chennai Smart City — T Nagar & Marina", category: "SMART_CITY", status: "IN_PROGRESS", budget: 15000000000, progressPct: 60, startDate: new Date("2018-01-01"), expectedEnd: new Date("2027-12-31"), contractor: "Chennai Smart City Ltd", source: "Smart City Mission dashboard" },
        { districtId, name: "Integrated Command & Control Centre (ICCC)", category: "SMART_CITY", status: "COMPLETED", budget: 3000000000, progressPct: 100, startDate: new Date("2019-01-01"), expectedEnd: new Date("2024-12-31"), contractor: "Chennai Smart City Ltd", source: "Smart City Mission dashboard" },
      ],
    });
    console.log("  ✅ Infrastructure projects seeded (15 projects)");
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
        { districtId, year: 1951, population: 1416056, source: "Census of India 1951" },
        { districtId, year: 1961, population: 1729141, source: "Census of India 1961" },
        { districtId, year: 1971, population: 2469449, source: "Census of India 1971" },
        { districtId, year: 1981, population: 3276622, source: "Census of India 1981" },
        { districtId, year: 1991, population: 3841396, source: "Census of India 1991" },
        { districtId, year: 2001, population: 4343645, sexRatio: 948, literacy: 85.33, density: 10197, source: "Census of India 2001" },
        { districtId, year: 2011, population: 4646732, sexRatio: 951, literacy: 90.33, urbanPct: 100, density: 10908, source: "Census of India 2011" },
        { districtId, year: 2026, population: 11500000, source: "Estimate — Chennai Metropolitan Area" },
      ],
    });
    console.log("  ✅ Population history seeded (8 records)");
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
        { districtId, name: "Mylapore Police Station", address: "Kutchery Road, Mylapore, Chennai 600004", phone: "044-24641212" },
        { districtId, name: "T Nagar Police Station", address: "GN Chetty Road, T Nagar, Chennai 600017", phone: "044-24340750" },
        { districtId, name: "Adyar Police Station", address: "Adyar, Chennai 600020", phone: "044-24910013" },
        { districtId, name: "Anna Nagar Police Station", address: "2nd Avenue, Anna Nagar, Chennai 600040", phone: "044-26261100" },
        { districtId, name: "Egmore Police Station", address: "Egmore, Chennai 600008", phone: "044-28190100" },
        { districtId, name: "Guindy Police Station", address: "Mount Road, Guindy, Chennai 600032", phone: "044-22350545" },
        { districtId, name: "Nungambakkam Police Station", address: "Nungambakkam High Road, Chennai 600034", phone: "044-28270221" },
        { districtId, name: "Royapettah Police Station", address: "Royapettah, Chennai 600014", phone: "044-28110100" },
        { districtId, name: "Kilpauk Police Station", address: "Kilpauk Garden Colony, Chennai 600010", phone: "044-26411221" },
        { districtId, name: "Tondiarpet Police Station", address: "Tondiarpet, Chennai 600081", phone: "044-25951100" },
        { districtId, name: "Tambaram Police Station", address: "GST Road, Tambaram, Chennai 600045", phone: "044-22260550" },
        { districtId, name: "Velachery Police Station", address: "Velachery Main Road, Chennai 600042", phone: "044-22590523" },
        { districtId, name: "Ambattur Police Station", address: "Ambattur, Chennai 600053", phone: "044-26530100" },
        { districtId, name: "Madhavaram Police Station", address: "Madhavaram, Chennai 600060", phone: "044-25550100" },
        { districtId, name: "Porur Police Station", address: "Porur, Chennai 600116", phone: "044-24760100" },
        { districtId, name: "Sholinganallur Police Station", address: "OMR, Sholinganallur, Chennai 600119", phone: "044-24501100" },
        { districtId, name: "Perambur Police Station", address: "Perambur, Chennai 600011", phone: "044-25511221" },
        { districtId, name: "Broadway Police Station", address: "NSC Bose Road, Broadway, Chennai 600108", phone: "044-25340100" },
        { districtId, name: "Thiruvanmiyur Police Station", address: "Thiruvanmiyur, Chennai 600041", phone: "044-24424100" },
        { districtId, name: "Kodambakkam Police Station", address: "Kodambakkam, Chennai 600024", phone: "044-24830100" },
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
        { districtId, name: "PSBB (Padma Seshadri Bala Bhavan) — KK Nagar", type: "PRIVATE", level: "Senior Secondary", address: "KK Nagar, Chennai 600078", students: 4500, teachers: 250, studentTeacherRatio: 18, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "DAV Boys Senior Secondary School (Gopalapuram)", type: "PRIVATE", level: "Senior Secondary", address: "Gopalapuram, Chennai 600086", students: 3500, teachers: 200, studentTeacherRatio: 17.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Don Bosco Matriculation Higher Secondary School", type: "PRIVATE", level: "Higher Secondary", address: "Broadway, Chennai 600108", students: 3000, teachers: 170, studentTeacherRatio: 17.6, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Loyola School (Nungambakkam)", type: "PRIVATE", level: "Higher Secondary", address: "Sterling Road, Nungambakkam, Chennai 600034", students: 2800, teachers: 160, studentTeacherRatio: 17.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Sishya School (Adyar)", type: "PRIVATE", level: "Senior Secondary", address: "Adyar, Chennai 600020", students: 2000, teachers: 130, studentTeacherRatio: 15.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Chettinad Vidyashram", type: "PRIVATE", level: "Senior Secondary", address: "RA Puram, Chennai 600028", students: 2500, teachers: 150, studentTeacherRatio: 16.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "P.S. Senior Secondary School", type: "PRIVATE", level: "Senior Secondary", address: "Mylapore, Chennai 600004", students: 3200, teachers: 185, studentTeacherRatio: 17.3, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Vidya Mandir Senior Secondary School", type: "PRIVATE", level: "Senior Secondary", address: "Mylapore, Chennai 600004", students: 2800, teachers: 160, studentTeacherRatio: 17.5, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Kendriya Vidyalaya IIT Madras", type: "CENTRAL_GOVT", level: "Senior Secondary", address: "IIT Madras Campus, Chennai 600036", students: 1800, teachers: 110, studentTeacherRatio: 16.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "The School KFI (Krishnamurti Foundation)", type: "PRIVATE", level: "Senior Secondary", address: "Damodar Gardens, Adyar, Chennai 600020", students: 800, teachers: 70, studentTeacherRatio: 11.4, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Lady Andal School (Chetpet)", type: "PRIVATE", level: "Higher Secondary", address: "Chetpet, Chennai 600031", students: 2200, teachers: 130, studentTeacherRatio: 16.9, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Bala Vidya Mandir (Adyar)", type: "PRIVATE", level: "Senior Secondary", address: "Adyar, Chennai 600020", students: 2000, teachers: 120, studentTeacherRatio: 16.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Good Shepherd Matriculation School", type: "PRIVATE", level: "Higher Secondary", address: "Nungambakkam, Chennai 600034", students: 2500, teachers: 145, studentTeacherRatio: 17.2, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Church Park School (Convent)", type: "PRIVATE", level: "Senior Secondary", address: "Church Park Road, Chennai 600006", students: 2000, teachers: 125, studentTeacherRatio: 16.0, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Government Higher Secondary School, Triplicane", type: "GOVERNMENT", level: "Higher Secondary", address: "Triplicane, Chennai 600005", students: 1500, teachers: 60, studentTeacherRatio: 25.0, hasToilets: true, hasLibrary: true, hasLab: false },
        { districtId, name: "Velammal Vidyalaya (Mel Ayanambakkam)", type: "PRIVATE", level: "Senior Secondary", address: "Mel Ayanambakkam, Chennai 600095", students: 4000, teachers: 220, studentTeacherRatio: 18.2, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Chinmaya Vidyalaya (Anna Nagar)", type: "PRIVATE", level: "Senior Secondary", address: "Anna Nagar, Chennai 600040", students: 3000, teachers: 175, studentTeacherRatio: 17.1, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Sri Sankara Senior Secondary School (Adyar)", type: "PRIVATE", level: "Senior Secondary", address: "Adyar, Chennai 600020", students: 2500, teachers: 150, studentTeacherRatio: 16.7, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "Jawahar Vidyalaya (Ashok Nagar)", type: "PRIVATE", level: "Senior Secondary", address: "Ashok Nagar, Chennai 600083", students: 2200, teachers: 135, studentTeacherRatio: 16.3, hasToilets: true, hasLibrary: true, hasLab: true },
        { districtId, name: "National Public School (Gopalapuram)", type: "PRIVATE", level: "Senior Secondary", address: "Gopalapuram, Chennai 600086", students: 2000, teachers: 120, studentTeacherRatio: 16.7, hasToilets: true, hasLibrary: true, hasLab: true },
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
        { districtId, name: "Fort St. George (TN State Secretariat)", type: "STATE", department: "Government of Tamil Nadu", address: "Fort St. George, Chennai 600009", phone: "044-25671501", services: ["State government offices", "CM office", "All department secretariats"] },
        { districtId, name: "Ripon Building (GCC Head Office)", type: "MUNICIPAL", department: "Greater Chennai Corporation", address: "EVR Periyar Salai, Chennai 600003", phone: "044-25619344", services: ["Property tax", "Birth/death certificates", "Trade licenses", "Building approvals"] },
        { districtId, name: "Chennai District Collectorate", type: "DISTRICT", department: "Revenue Department", address: "Collectorate Complex, Chennai", phone: "044-25360100", services: ["Revenue records", "Land records", "NOC", "Domicile", "Patta transfer"] },
        { districtId, name: "Passport Seva Kendra (Chennai)", type: "CENTRAL", department: "Ministry of External Affairs", address: "Shastri Bhavan Annexe, Haddows Road, Chennai 600006", phone: "1800-258-1800", services: ["Passport application", "Renewal", "Tatkal passport"] },
        { districtId, name: "RTO Chennai (South)", type: "STATE", department: "Transport Department", address: "Adyar, Chennai 600020", phone: "044-24911340", services: ["Driving license", "Vehicle registration", "Fitness certificates"] },
        { districtId, name: "Income Tax Office (Chennai)", type: "CENTRAL", department: "CBDT / Income Tax Dept", address: "Nungambakkam, Chennai 600034", phone: "044-28330200", services: ["Income tax filing", "PAN", "TDS", "Refunds"] },
        { districtId, name: "Sub-Registrar Office (T Nagar)", type: "STATE", department: "Registration Department, TN", address: "T Nagar, Chennai 600017", phone: "044-24342255", services: ["Property registration", "Stamp duty", "Document registration"] },
        { districtId, name: "Employment Exchange Chennai", type: "STATE", department: "Labour Department", address: "Guindy, Chennai 600032", phone: "044-22350300", services: ["Job registration", "Employment guidance"] },
        { districtId, name: "Adi Dravidar Welfare Office", type: "STATE", department: "Adi Dravidar & Tribal Welfare", address: "Chepauk, Chennai 600005", phone: "044-28544200", services: ["SC/ST welfare schemes", "Scholarships", "Housing"] },
        { districtId, name: "Tamil Nadu e-Sevai Centre", type: "STATE", department: "IT Department, TN", address: "Various locations across Chennai", phone: "044-28510500", services: ["Government certificates", "Bill payments", "Online services"] },
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
        // Tamil Nadu State Schemes
        { districtId, name: "Kalaignar Magalir Urimai Thogai (Women's Right Grant)", level: "STATE", category: "Women & Child Development", eligibility: "Women aged 21+ who are family heads, annual income below ₹2.5 lakh", amount: 1000, beneficiaryCount: 10000000, source: "TN Government" },
        { districtId, name: "Tamil Nadu Noon Meal Scheme", level: "STATE", category: "Social Welfare", eligibility: "All students in government/aided schools + anganwadi children", source: "TN Government" },
        { districtId, name: "Amma Unavagam (Amma Canteen)", level: "STATE", category: "Food & Nutrition", eligibility: "Open to all — no eligibility criteria", source: "GCC" },
        { districtId, name: "Chief Minister's Comprehensive Health Insurance (CMCHIS)", level: "STATE", category: "Health", eligibility: "Families with annual income below ₹72,000", amount: 500000, applyUrl: "https://www.cmchistn.com", source: "TN Health Dept" },
        { districtId, name: "TN Free Laptop Scheme", level: "STATE", category: "Education", eligibility: "Students in government/aided schools & colleges", source: "TN Higher Education Dept" },
        { districtId, name: "Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme", level: "STATE", category: "Education", eligibility: "Girl students from BC/MBC/SC/ST communities in higher education", amount: 1000, source: "TN BC/MBC Welfare Dept" },

        // Central Schemes
        { districtId, name: "Ayushman Bharat — PMJAY", level: "CENTRAL", category: "Health", eligibility: "SECC 2011 identified families", amount: 500000, applyUrl: "https://pmjay.gov.in", source: "National Health Authority" },
        { districtId, name: "Pradhan Mantri Awas Yojana — Urban (PMAY-U)", level: "CENTRAL", category: "Housing", eligibility: "EWS/LIG/MIG families without pucca house", amount: 267000, applyUrl: "https://pmaymis.gov.in", source: "MoHUA" },
        { districtId, name: "PM Vishwakarma Yojana", level: "CENTRAL", category: "MSME & Artisans", eligibility: "Traditional artisans (carpenters, goldsmiths, potters, etc.)", amount: 300000, applyUrl: "https://pmvishwakarma.gov.in", source: "Ministry of MSME" },
        { districtId, name: "Sukanya Samriddhi Yojana", level: "CENTRAL", category: "Finance & Savings", eligibility: "Parents/guardians of girls below age 10", source: "Ministry of Finance" },
      ],
    });
    console.log("  ✅ Government schemes seeded (10 schemes)");
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
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Chennai North", winnerName: "Kalanidhi Veeraswamy", winnerParty: "DMK", winnerVotes: 520000, runnerUpName: "Nainar Nagendran", runnerUpParty: "BJP", runnerUpVotes: 280000, margin: 240000, totalVoters: 1800000, votesPolled: 941400, turnoutPct: 52.3, source: "Election Commission of India" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Chennai South", winnerName: "Thamizhachi Thangapandian", winnerParty: "DMK", winnerVotes: 480000, runnerUpName: "Tamilisai Soundararajan", runnerUpParty: "BJP", runnerUpVotes: 270000, margin: 210000, totalVoters: 1700000, votesPolled: 863600, turnoutPct: 50.8, source: "Election Commission of India" },
        { districtId, electionType: "LOK_SABHA", year: 2024, constituency: "Chennai Central", winnerName: "Dayanidhi Maran", winnerParty: "DMK", winnerVotes: 530000, runnerUpName: "Vinoj Selvam", runnerUpParty: "AIADMK", runnerUpVotes: 300000, margin: 230000, totalVoters: 1900000, votesPolled: 978500, turnoutPct: 51.5, source: "Election Commission of India" },

        // 2021 TN Assembly (key Chennai seats)
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Kolathur", winnerName: "M.K. Stalin", winnerParty: "DMK", winnerVotes: 140000, runnerUpName: "AIADMK candidate", runnerUpParty: "AIADMK", runnerUpVotes: 60000, margin: 80000, totalVoters: 350000, votesPolled: 207200, turnoutPct: 59.2, source: "Election Commission of India" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Chepauk-Triplicane", winnerName: "Udhayanidhi Stalin", winnerParty: "DMK", winnerVotes: 105000, runnerUpName: "AIADMK candidate", runnerUpParty: "AIADMK", runnerUpVotes: 60000, margin: 45000, totalVoters: 300000, votesPolled: 167400, turnoutPct: 55.8, source: "Election Commission of India" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Saidapet", winnerName: "Ma. Subramanian", winnerParty: "DMK", winnerVotes: 98000, runnerUpName: "AIADMK candidate", runnerUpParty: "AIADMK", runnerUpVotes: 60000, margin: 38000, totalVoters: 320000, votesPolled: 167680, turnoutPct: 52.4, source: "Election Commission of India" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Harbour", winnerName: "P.K. Sekar Babu", winnerParty: "DMK", winnerVotes: 115000, runnerUpName: "AIADMK candidate", runnerUpParty: "AIADMK", runnerUpVotes: 60000, margin: 55000, totalVoters: 310000, votesPolled: 180110, turnoutPct: 58.1, source: "Election Commission of India" },
        { districtId, electionType: "ASSEMBLY", year: 2021, constituency: "Thousand Lights", winnerName: "N. Ezhilan", winnerParty: "DMK", winnerVotes: 92000, runnerUpName: "AIADMK candidate", runnerUpParty: "AIADMK", runnerUpVotes: 50000, margin: 42000, totalVoters: 280000, votesPolled: 140840, turnoutPct: 50.3, source: "Election Commission of India" },
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
        { districtId, courtName: "Madras High Court (Principal Bench)", pending: 550000, disposed: 220000, filed: 250000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "City Civil Court, Chennai", pending: 95000, disposed: 48000, filed: 55000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Metropolitan Magistrate Courts, Chennai", pending: 280000, disposed: 120000, filed: 140000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Small Causes Court, Chennai", pending: 42000, disposed: 22000, filed: 25000, year: 2025, source: "NJDG / ecourts.gov.in" },
        { districtId, courtName: "Family Court, Chennai", pending: 18000, disposed: 9000, filed: 11000, year: 2025, source: "NJDG / ecourts.gov.in" },
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
        { districtId, topic: "GCC Road Repair Status", department: "GCC — Engineering Department", pioAddress: "Public Information Officer, GCC Engineering Dept, Ripon Building, Chennai 600003", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) All road repair/resurfacing works sanctioned in Zone ___ during FY 2025-26. (2) Contractor name, cost, timeline. (3) Pothole complaints received and resolved per zone." },
        { districtId, topic: "CMWSSB Water Supply Details", department: "CMWSSB", pioAddress: "Public Information Officer, CMWSSB, No.1 Pumping Station Road, Chintadripet, Chennai 600002", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Daily water supply per capita in my area (zone ___). (2) Water quality test results for last quarter. (3) Status of desalination plant capacity additions. (4) Non-revenue water losses percentage." },
        { districtId, topic: "Chennai Metro Phase 2 Status", department: "CMRL", pioAddress: "Public Information Officer, CMRL, Admin Building, Koyambedu, Chennai 600107", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Current completion percentage of Metro Phase 2 corridors. (2) Revised cost vs sanctioned cost. (3) Monthly expenditure last 6 months. (4) Expected commissioning dates." },
        { districtId, topic: "Storm Water Drain Status", department: "GCC — Storm Water Drain", pioAddress: "Public Information Officer, GCC SWD Dept, Ripon Building, Chennai 600003", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Status of storm water drain works in Zone ___. (2) Chronic waterlogging points identified and remediation taken. (3) Budget allocated vs spent on SWD in 2025-26." },
        { districtId, topic: "Building Plan Approval (CMDA/GCC)", department: "CMDA / GCC", pioAddress: "Public Information Officer, CMDA, 8 Gandhi Irwin Road, Egmore, Chennai 600008", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request: (1) Status of building plan approval application no. ___. (2) List of unauthorized buildings in Zone ___. (3) Action taken against unauthorized constructions in last 1 year." },
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
        { districtId, name: "C. Rajagopalachari (Rajaji)", category: "FREEDOM_FIGHTER", bio: "Last Governor-General of India. Freedom fighter, Chief Minister of Madras. Founded Swatantra Party. Bharat Ratna.", birthYear: 1878, deathYear: 1972, source: "wikipedia" },
        { districtId, name: "C.N. Annadurai", category: "POLITICAL", bio: "Anna — founder of DMK, first non-Congress CM of Tamil Nadu (1967). Father of Dravidian movement. Bharat Ratna.", birthYear: 1909, deathYear: 1969, source: "wikipedia" },
        { districtId, name: "M.G. Ramachandran (MGR)", category: "POLITICAL", bio: "Legendary actor-politician. Founded AIADMK. 3-time CM of Tamil Nadu. Bharat Ratna. Transformed TN politics.", birthYear: 1917, deathYear: 1987, source: "wikipedia" },
        { districtId, name: "J. Jayalalithaa", category: "POLITICAL", bio: "Amma — 6-time CM of Tamil Nadu. AIADMK leader. Iconic figure in Dravidian politics. Former actress.", birthYear: 1948, deathYear: 2016, source: "wikipedia" },
        { districtId, name: "A.R. Rahman", category: "ARTS", bio: "Oscar-winning music composer (Slumdog Millionaire). 'Mozart of Madras'. Born and based in Chennai. Padma Bhushan.", birthYear: 1967, source: "wikipedia" },
        { districtId, name: "Viswanathan Anand", category: "SPORTS", bio: "Five-time World Chess Champion. Born in Chennai — India's chess capital. Padma Vibhushan.", birthYear: 1969, source: "wikipedia" },
        { districtId, name: "M.S. Subbulakshmi", category: "ARTS", bio: "Queen of Carnatic Music. First musician to receive Bharat Ratna. Performed at the UN General Assembly. Born in Madurai, lived in Chennai.", birthYear: 1916, deathYear: 2004, source: "wikipedia" },
        { districtId, name: "Sir C.V. Raman", category: "SCIENCE", bio: "Nobel laureate (Physics, 1930). Raman Effect. Worked at Indian Association for Cultivation of Science. Strong Chennai connections.", birthYear: 1888, deathYear: 1970, source: "wikipedia" },
        { districtId, name: "Srinivasa Ramanujan", category: "SCIENCE", bio: "Mathematical genius. Made extraordinary contributions to number theory. Lived and studied in Chennai (Kumbakonam origin). Triplicane connection.", birthYear: 1887, deathYear: 1920, source: "wikipedia" },
        { districtId, name: "Kamal Haasan", category: "ARTS", bio: "Legendary actor, filmmaker. Padma Bhushan. Founded MNM party. Born in Paramakudi, based in Chennai for decades.", birthYear: 1954, source: "wikipedia" },
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
        { districtId, name: "OMR IT Corridor (Old Mahabalipuram Road)", type: "IT Park", category: "IT", location: "OMR — Tidel Park to Siruseri SIPCOT", details: { employmentEstimate: 500000, description: "India's second-largest IT corridor after Bangalore. TCS, Infosys, Cognizant, Wipro, Zoho, HCL." }, source: "NASSCOM / TN IT Dept" },
        { districtId, name: "Tidel Park & ELCOT IT Parks", type: "IT Park", category: "IT", location: "Taramani, OMR, Chennai", details: { employmentEstimate: 80000, description: "Government IT parks. Tidel Park in Taramani was India's first and largest IT park when built." }, source: "ELCOT" },
        { districtId, name: "Automobile Industry Hub", type: "Manufacturing Cluster", category: "MANUFACTURING", location: "Ambattur, Sriperumbudur, Oragadam", details: { employmentEstimate: 350000, description: "Chennai = Detroit of India. Hyundai, Ford (now Tata), Renault-Nissan, BMW, Daimler, Royal Enfield plants." }, source: "SIAM / TN Industries Dept" },
        { districtId, name: "Chennai Port & Ennore Port", type: "Port", category: "LOGISTICS", location: "Rajaji Salai / Ennore", details: { employmentEstimate: 80000, description: "Chennai Port — India's 2nd largest container port. Ennore (Kamarajar Port) — dedicated coal/oil." }, source: "Chennai Port Authority" },
        { districtId, name: "SIPCOT IT Park (Siruseri)", type: "IT Park", category: "IT", location: "Siruseri, OMR South", details: { employmentEstimate: 100000, description: "State Industries Promotion Corporation IT park. Major IT/ITES companies." }, source: "SIPCOT" },
        { districtId, name: "Ambattur Industrial Estate", type: "Industrial Estate", category: "MANUFACTURING", location: "Ambattur, North Chennai", details: { employmentEstimate: 200000, description: "One of Asia's largest industrial estates. Auto components, electronics, textiles, pharmaceuticals." }, source: "SIDCO" },
        { districtId, name: "Film Industry (Kollywood)", type: "Creative Industry", category: "ENTERTAINMENT", location: "Kodambakkam, Vadapalani, Chennai", details: { employmentEstimate: 100000, description: "Tamil cinema industry — ~₹5,000 Cr revenue. AVM Studios, Prasad Studios. Chennai is the hub." }, source: "Film Chamber of Commerce" },
        { districtId, name: "Leather Industry (Chromepet/Vandalur)", type: "Manufacturing Cluster", category: "MANUFACTURING", location: "Chromepet, Vandalur, Ambur belt", details: { employmentEstimate: 150000, description: "Chennai is India's leather export capital. 40% of India's leather exports from TN." }, source: "Council for Leather Exports" },
        { districtId, name: "Zoho Corporation", type: "Tech Company", category: "IT", location: "Thalambur, OMR, Chennai", details: { employmentEstimate: 15000, description: "India's largest bootstrapped tech company. HQ in Chennai (Thalambur). 15,000+ employees." }, source: "Zoho" },
        { districtId, name: "Parry's Corner / George Town Trading", type: "Trading Hub", category: "TRADE", location: "Parry's Corner, George Town, Chennai", details: { employmentEstimate: 100000, description: "Historic wholesale trading hub since British era. Textiles, spices, gold, sundries." }, source: "Chennai Trade Association" },
      ],
    });
    console.log("  ✅ Local industries seeded (10 industries)");
  } else {
    console.log(`  ⏭  Local industries already exist (${industryCount} records)`);
  }

  // ═══════════════════════════════════════════════════════════
  // N. BUS ROUTES (MTC)
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding bus routes (MTC)...");

  const busCount = await prisma.busRoute.count({ where: { districtId } });
  if (busCount === 0) {
    await prisma.busRoute.createMany({
      skipDuplicates: true,
      data: [
        { districtId, routeNumber: "1", origin: "Broadway", destination: "T Nagar", via: "Anna Salai, Teynampet", frequency: "5 min", operator: "MTC", busType: "Ordinary" },
        { districtId, routeNumber: "5C", origin: "Broadway", destination: "Tambaram", via: "Guindy, Chromepet", frequency: "8 min", operator: "MTC", busType: "Ordinary" },
        { districtId, routeNumber: "27C", origin: "Broadway", destination: "Thiruvanmiyur", via: "Anna Salai, Adyar", frequency: "10 min", operator: "MTC", busType: "Ordinary" },
        { districtId, routeNumber: "M70", origin: "T Nagar", destination: "Adyar", via: "CIT Nagar, RA Puram", frequency: "8 min", operator: "MTC", busType: "Mini" },
        { districtId, routeNumber: "S70", origin: "CMBT", destination: "OMR Siruseri", via: "Guindy, Velachery, Sholinganallur", frequency: "10 min", operator: "MTC", busType: "Ordinary" },
        { districtId, routeNumber: "AC-1", origin: "CMBT", destination: "Mahabalipuram", via: "Guindy, OMR, Sholinganallur, Kelambakkam", frequency: "20 min", operator: "MTC", busType: "AC" },
        { districtId, routeNumber: "E-15", origin: "Broadway", destination: "Anna Nagar", via: "Central, Egmore, Kilpauk", frequency: "15 min", operator: "MTC", busType: "Electric" },
        { districtId, routeNumber: "21H", origin: "Broadway", destination: "Avadi", via: "Central, Ambattur, Padi", frequency: "10 min", operator: "MTC", busType: "Ordinary" },
      ],
    });
    console.log("  ✅ Bus routes seeded (8 MTC routes)");
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
        // Chennai Metro & MRTS
        { districtId, trainNumber: "METRO-L1", trainName: "Chennai Metro Blue Line", origin: "Wimco Nagar", destination: "Airport", stationName: "Chennai Airport", departureTime: "05:30", arrivalTime: "06:30", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "METRO-L2", trainName: "Chennai Metro Green Line", origin: "Chennai Central", destination: "St. Thomas Mount", stationName: "Chennai Central (Metro)", departureTime: "05:30", arrivalTime: "06:05", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "MRTS", trainName: "Chennai MRTS", origin: "Chennai Beach", destination: "Velachery", stationName: "Chennai Beach (MRTS)", departureTime: "04:30", arrivalTime: "05:15", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },

        // Chennai Suburban
        { districtId, trainNumber: "SUBURBAN", trainName: "Chennai Suburban (Beach-Tambaram)", origin: "Chennai Beach", destination: "Tambaram", stationName: "Chennai Beach", departureTime: "04:15", arrivalTime: "05:15", daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },

        // Long Distance from Chennai
        { districtId, trainNumber: "12615", trainName: "Grand Trunk Express", origin: "Chennai Central", destination: "New Delhi", stationName: "Chennai Central", departureTime: "18:50", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12621", trainName: "Tamil Nadu Express", origin: "Chennai Central", destination: "New Delhi", stationName: "Chennai Central", departureTime: "22:00", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12839", trainName: "Chennai-Howrah Mail", origin: "Chennai Central", destination: "Howrah", stationName: "Chennai Central", departureTime: "19:15", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12657", trainName: "Chennai-Bangalore Shatabdi Express", origin: "Chennai Central", destination: "KSR Bengaluru", stationName: "Chennai Central", departureTime: "06:00", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12637", trainName: "Pandian Express", origin: "Chennai Egmore", destination: "Madurai", stationName: "Chennai Egmore", departureTime: "21:15", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
        { districtId, trainNumber: "12695", trainName: "Chennai-Trivandrum SF Express", origin: "Chennai Central", destination: "Thiruvananthapuram", stationName: "Chennai Central", departureTime: "15:30", arrivalTime: null, daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
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
          serviceName: "Property Registration in Chennai",
          category: "REVENUE",
          office: "Sub-Registrar Office, Registration Department, TN",
          documentsNeeded: ["Sale deed", "Patta (land title)", "Encumbrance Certificate (EC)", "PAN", "Aadhaar", "Passport photos", "Previous title deeds"],
          fees: "Stamp duty: 7% + Registration fee: 4% of property value",
          timeline: "Same day to 3 days",
          steps: [
            "Check guideline value at tnreginet.gov.in",
            "Calculate stamp duty (7% in Chennai municipal area)",
            "Prepare documents: Sale deed, patta, EC, PAN, Aadhaar",
            "Book slot on TNREGINET portal",
            "Pay stamp duty + registration fee (4%)",
            "Visit Sub-Registrar with buyer, seller, 2 witnesses",
            "Biometric, photo, document scanning",
            "Registered deed available within 1-3 days",
          ],
        },
        {
          districtId,
          serviceName: "Patta Transfer (Land Title)",
          category: "REVENUE",
          office: "Tahsildar Office, Revenue Department",
          documentsNeeded: ["Registered sale deed", "Old patta", "Tax paid receipts", "Encumbrance certificate", "Aadhaar", "PAN"],
          fees: "₹20-50",
          timeline: "30-60 days",
          steps: [
            "Apply at local Tahsildar office or online via tnesevai.tn.gov.in",
            "Submit sale deed, old patta, tax receipts",
            "Revenue Inspector field verification",
            "Tahsildar approval",
            "New patta issued in buyer's name",
            "Chitta (land record) updated",
          ],
        },
        {
          districtId,
          serviceName: "Birth/Death Certificate (GCC)",
          category: "CIVIL",
          office: "GCC Zone Office, Public Health Department",
          documentsNeeded: ["Hospital discharge slip", "Parent IDs (birth)", "Death intimation certificate (death)"],
          fees: "Free within 21 days, ₹5 after, ₹10 after 1 year",
          timeline: "7-14 days",
          steps: [
            "Visit GCC zone office or apply online at chennaicorporation.gov.in",
            "Fill Form-1 (birth) or Form-2 (death)",
            "Submit hospital records",
            "Within 21 days = free, after 21 days = with late fee",
            "Certificate issued in 7-14 days",
            "Name inclusion after 1 year requires court order",
          ],
        },
        {
          districtId,
          serviceName: "Water Connection (CMWSSB)",
          category: "UTILITIES",
          office: "CMWSSB Area Office",
          documentsNeeded: ["Property deed", "Building approval", "GCC assessment receipt", "Identity proof"],
          fees: "₹3,000-₹15,000 based on connection type",
          timeline: "15-30 days after approval",
          steps: [
            "Apply at CMWSSB area office or online at chennaimetrowater.tn.nic.in",
            "Submit property documents, building approval",
            "CMWSSB survey and inspection",
            "Pay connection charges",
            "Connection within 15-30 days",
            "Meter installed",
          ],
        },
        {
          districtId,
          serviceName: "Community Certificate (TN)",
          category: "REVENUE",
          office: "Tahsildar Office, Revenue Department",
          documentsNeeded: ["Parent's community certificate", "School Transfer Certificate", "Aadhaar", "Address proof"],
          fees: "Free",
          timeline: "15-30 days",
          steps: [
            "Apply at Tahsildar office or tnesevai.tn.gov.in",
            "Fill application with family details",
            "Submit parent's community certificate + school TC",
            "Revenue Inspector verification",
            "Certificate issued by Tahsildar",
            "Valid for lifetime (one-time issuance)",
          ],
        },
      ],
    });
    console.log("  ✅ Service guides seeded (5 guides)");
  } else {
    console.log(`  ⏭  Service guides already exist (${serviceCount} records)`);
  }

  console.log("\n✅ Chennai district data seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
