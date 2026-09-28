// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Telangana Data Seed — Hyderabad District
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-hyderabad-data.ts
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
  console.log("🏛️  Seeding Hyderabad district data...\n");

  const telangana = await prisma.state.findUnique({ where: { slug: "telangana" } });
  if (!telangana) throw new Error("Telangana state not found. Run seed-hierarchy.ts first.");

  const district = await prisma.district.findFirst({
    where: { slug: "hyderabad", stateId: telangana.id },
  });
  if (!district) throw new Error("Hyderabad district not found. Run seed-hierarchy.ts first.");

  const did = district.id;
  console.log(`✓ Found Hyderabad (id: ${did})\n`);

  // ═══ A. LEADERSHIP ═══
  const leaderCount = await prisma.leader.count({ where: { districtId: did } });
  if (leaderCount === 0) {
    console.log("Seeding leadership...");
    await prisma.leader.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Asaduddin Owaisi", role: "Member of Parliament (Lok Sabha)", party: "AIMIM", tier: 1, constituency: "Hyderabad", source: "results.eci.gov.in" },
      { districtId: did, name: "Mumtaz Ahmed Khan", role: "MLA, Charminar", party: "AIMIM", tier: 2, constituency: "Charminar", source: "tslegislature.gov.in" },
      { districtId: did, name: "Mohammed Mushtaq Malik", role: "MLA, Yakutpura", party: "AIMIM", tier: 2, constituency: "Yakutpura", source: "tslegislature.gov.in" },
      { districtId: did, name: "Akbaruddin Owaisi", role: "MLA, Chandrayangutta", party: "AIMIM", tier: 2, constituency: "Chandrayangutta", source: "tslegislature.gov.in" },
      { districtId: did, name: "Ahmed bin Abdullah Balala", role: "MLA, Malakpet", party: "AIMIM", tier: 2, constituency: "Malakpet", source: "tslegislature.gov.in" },
      { districtId: did, name: "R. Prakash Reddy", role: "MLA, Amberpet", party: "INC", tier: 2, constituency: "Amberpet", source: "tslegislature.gov.in" },
      { districtId: did, name: "M. Padma Devender Reddy", role: "MLA, Musheerabad", party: "INC", tier: 2, constituency: "Musheerabad", source: "tslegislature.gov.in" },
      { districtId: did, name: "Feroz Khan", role: "MLA, Nampally", party: "INC", tier: 2, constituency: "Nampally", source: "tslegislature.gov.in" },
      { districtId: did, name: "Kausar Mohiuddin", role: "MLA, Karwan", party: "AIMIM", tier: 2, constituency: "Karwan", source: "tslegislature.gov.in" },
      { districtId: did, name: "T. Raja Singh Lodh", role: "MLA, Goshamahal", party: "BJP", tier: 2, constituency: "Goshamahal", source: "tslegislature.gov.in" },
      { districtId: did, name: "Mohd. Mubeen", role: "MLA, Bahadurpura", party: "AIMIM", tier: 2, constituency: "Bahadurpura", source: "tslegislature.gov.in" },
      { districtId: did, name: "T. Padma Rao Goud", role: "MLA, Secunderabad", party: "INC", tier: 2, constituency: "Secunderabad", source: "tslegislature.gov.in" },
      { districtId: did, name: "Danam Nagender", role: "MLA, Khairatabad", party: "INC", tier: 2, constituency: "Khairatabad", source: "tslegislature.gov.in" },
      { districtId: did, name: "Maganti Gopinath", role: "MLA, Jubilee Hills", party: "INC", tier: 2, constituency: "Jubilee Hills", source: "tslegislature.gov.in" },
      { districtId: did, name: "Arikepudi Gandhi", role: "MLA, Sanathnagar", party: "INC", tier: 2, constituency: "Sanathnagar", source: "tslegislature.gov.in" },
      { districtId: did, name: "T. Prakash Goud", role: "MLA, Rajendranagar", party: "INC", tier: 2, constituency: "Rajendranagar", source: "tslegislature.gov.in" },
      { districtId: did, name: "Jishnu Dev Varma", role: "Governor of Telangana", tier: 4, source: "rajbhavan.telangana.gov.in" },
      { districtId: did, name: "A. Revanth Reddy", role: "Chief Minister of Telangana", party: "INC", tier: 4, source: "cm.telangana.gov.in" },
      { districtId: did, name: "VERIFY: Collector & District Magistrate", role: "Collector & District Magistrate, Hyderabad", tier: 4, source: "hyderabad.telangana.gov.in" },
      { districtId: did, name: "VERIFY: Commissioner of Police", role: "Commissioner of Police, Hyderabad", tier: 5, source: "hyderabadpolice.gov.in" },
      { districtId: did, name: "VERIFY: Chief Justice, Telangana HC", role: "Chief Justice, Telangana High Court", tier: 6, source: "tshc.gov.in" },
    ] });
    console.log("  ✓ Leadership seeded");
  } else { console.log(`  ⏭ Leadership already seeded (${leaderCount})`); }

  // ═══ B. BUDGET ═══
  const budgetCount = await prisma.budgetEntry.count({ where: { districtId: did } });
  if (budgetCount === 0) {
    console.log("Seeding budget...");
    await prisma.budgetEntry.createMany({ skipDuplicates: true, data: [
      { districtId: did, fiscalYear: "2026-27", sector: "Municipal Admin & Urban Development", allocated: 179070000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "Education", allocated: 180000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "Health & Medical", allocated: 120000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "Hyderabad Metro Rail", allocated: 11000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "Roads & Buildings", allocated: 80000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "Police & Home Affairs", allocated: 100000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2026-27", sector: "IT & Communications", allocated: 15000000000, released: 0, spent: 0, source: "finance.telangana.gov.in" },
      { districtId: did, fiscalYear: "2025-26", sector: "GHMC — Infrastructure", allocated: 30000000000, released: 0, spent: 0, source: "ghmc.gov.in" },
      { districtId: did, fiscalYear: "2025-26", sector: "GHMC — Solid Waste Management", allocated: 15000000000, released: 0, spent: 0, source: "ghmc.gov.in" },
      { districtId: did, fiscalYear: "2025-26", sector: "GHMC — Roads", allocated: 25000000000, released: 0, spent: 0, source: "ghmc.gov.in" },
    ] });
    console.log("  ✓ Budget seeded");
  } else { console.log(`  ⏭ Budget already seeded (${budgetCount})`); }

  // ═══ C. INFRASTRUCTURE PROJECTS ═══
  const infraCount = await prisma.infraProject.count({ where: { districtId: did } });
  if (infraCount === 0) {
    console.log("Seeding infrastructure...");
    await prisma.infraProject.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Hyderabad Metro Phase II — Old City & Airport Line", category: "Metro Rail", budget: 11000000000, fundsReleased: 3500000000, progressPct: 15, status: "In Progress", contractor: "L&T / State Govt", startDate: new Date("2024-06-01"), expectedEnd: new Date("2029-12-31"), source: "hmrl.co.in" },
      { districtId: did, name: "H-CITI Urban Infrastructure Scheme", category: "Roads", budget: 26540000000, fundsReleased: 8000000000, progressPct: 30, status: "In Progress", contractor: "Various", startDate: new Date("2024-01-01"), expectedEnd: new Date("2027-12-31"), source: "ghmc.gov.in" },
      { districtId: did, name: "Elevated Corridor I — Paradise to Shamirpet", category: "Flyover", budget: 15000000000, fundsReleased: 2000000000, progressPct: 10, status: "In Progress", contractor: "NHAI", startDate: new Date("2024-09-01"), expectedEnd: new Date("2028-06-30"), source: "roads.telangana.gov.in" },
      { districtId: did, name: "Regional Ring Road (RRR) — 340 km", category: "Mega Project", budget: 550000000000, fundsReleased: 15000000000, progressPct: 5, status: "Land Acquisition", contractor: "NHAI / State Govt", startDate: new Date("2024-01-01"), expectedEnd: new Date("2032-12-31"), source: "nhai.gov.in" },
      { districtId: did, name: "Musi Riverfront Development", category: "Mega Project", budget: 150000000000, fundsReleased: 5000000000, progressPct: 5, status: "Planning", startDate: new Date("2024-06-01"), expectedEnd: new Date("2030-12-31"), source: "telangana.gov.in" },
      { districtId: did, name: "Pharma City at Mucherla", category: "Industrial", budget: 640000000000, fundsReleased: 20000000000, progressPct: 10, status: "In Progress", contractor: "TSIIC", startDate: new Date("2018-01-01"), expectedEnd: new Date("2030-12-31"), source: "tsiic.telangana.gov.in" },
      { districtId: did, name: "TIMS Hospitals (6,582 new beds)", category: "Health", budget: 15000000000, fundsReleased: 8000000000, progressPct: 50, status: "In Progress", startDate: new Date("2023-01-01"), expectedEnd: new Date("2026-12-31"), source: "health.telangana.gov.in" },
      { districtId: did, name: "Godavari Drinking Water Supply Project", category: "Water", budget: 80000000000, fundsReleased: 25000000000, progressPct: 30, status: "In Progress", contractor: "HMWSSB", startDate: new Date("2021-01-01"), expectedEnd: new Date("2027-12-31"), source: "hyderabadwater.gov.in" },
      { districtId: did, name: "Musi River Cleanup & Restoration", category: "Water", budget: 30000000000, fundsReleased: 3000000000, progressPct: 10, status: "In Progress", startDate: new Date("2024-01-01"), expectedEnd: new Date("2030-12-31"), source: "hmda.gov.in" },
      { districtId: did, name: "2BHK Housing Scheme — Hyderabad", category: "Housing", budget: 50000000000, fundsReleased: 30000000000, progressPct: 55, status: "In Progress", startDate: new Date("2015-01-01"), expectedEnd: new Date("2027-12-31"), source: "housing.telangana.gov.in" },
      { districtId: did, name: "SRDP Flyovers & Underpasses", category: "Flyover", budget: 20000000000, fundsReleased: 12000000000, progressPct: 60, status: "In Progress", startDate: new Date("2020-01-01"), expectedEnd: new Date("2026-12-31"), source: "ghmc.gov.in" },
      { districtId: did, name: "Budvel Multi-Level Interchange", category: "Flyover", budget: 4880000000, fundsReleased: 2000000000, progressPct: 40, status: "In Progress", startDate: new Date("2023-06-01"), expectedEnd: new Date("2026-12-31"), source: "ghmc.gov.in" },
    ] });
    console.log("  ✓ Infrastructure seeded");
  } else { console.log(`  ⏭ Infrastructure already seeded (${infraCount})`); }

  // ═══ D. POLICE STATIONS ═══
  const policeCount = await prisma.policeStation.count({ where: { districtId: did } });
  if (policeCount === 0) {
    console.log("Seeding police stations...");
    await prisma.policeStation.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Nampally PS", address: "Nampally, Hyderabad 500001", phone: "040-27853252", lat: 17.385, lng: 78.487 },
      { districtId: did, name: "Abids PS", address: "Abids, Hyderabad 500001", phone: "040-27854814", lat: 17.392, lng: 78.475 },
      { districtId: did, name: "Afzalgunj PS", address: "Afzalgunj, Hyderabad 500002", phone: "040-24515293", lat: 17.371, lng: 78.473 },
      { districtId: did, name: "Charminar PS", address: "Charminar, Hyderabad 500002", phone: "040-24515888", lat: 17.362, lng: 78.475 },
      { districtId: did, name: "Falaknuma PS", address: "Falaknuma, Hyderabad 500053", phone: "040-24515155", lat: 17.337, lng: 78.462 },
      { districtId: did, name: "Hussainialam PS", address: "Hussainialam, Hyderabad 500064", phone: "040-24515533", lat: 17.359, lng: 78.467 },
      { districtId: did, name: "Kacheguda PS", address: "Kacheguda, Hyderabad 500027", phone: "040-27854133", lat: 17.383, lng: 78.494 },
      { districtId: did, name: "Musheerabad PS", address: "Musheerabad, Hyderabad 500048", phone: "040-27853855", lat: 17.405, lng: 78.489 },
      { districtId: did, name: "Narayanguda PS", address: "Narayanguda, Hyderabad 500029", phone: "040-27854920", lat: 17.392, lng: 78.486 },
      { districtId: did, name: "Sultan Bazaar PS", address: "Sultan Bazaar, Hyderabad 500095", phone: "040-27854050", lat: 17.386, lng: 78.482 },
      { districtId: did, name: "Golconda PS", address: "Golconda, Hyderabad 500008", phone: "040-23521000", lat: 17.383, lng: 78.401 },
      { districtId: did, name: "Bahadurpura PS", address: "Bahadurpura, Hyderabad 500064", phone: "040-24515250", lat: 17.350, lng: 78.445 },
      { districtId: did, name: "Saidabad PS", address: "Saidabad, Hyderabad 500059", phone: "040-24061050", lat: 17.353, lng: 78.503 },
      { districtId: did, name: "Malakpet PS", address: "Malakpet, Hyderabad 500036", phone: "040-24061100", lat: 17.370, lng: 78.500 },
      { districtId: did, name: "Mangalhat PS", address: "Mangalhat, Hyderabad 500012", phone: "040-23220678", lat: 17.400, lng: 78.458 },
      { districtId: did, name: "Habeebnagar PS", address: "Habeebnagar, Hyderabad 500012", phone: "040-23223625", lat: 17.408, lng: 78.451 },
    ] });
    console.log("  ✓ Police stations seeded");
  } else { console.log(`  ⏭ Police stations already seeded (${policeCount})`); }

  // ═══ E. SCHOOLS ═══
  const schoolCount = await prisma.school.count({ where: { districtId: did } });
  if (schoolCount === 0) {
    console.log("Seeding schools...");
    await prisma.school.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Govt High School, Nampally", type: "Government", level: "High School", address: "Nampally, Hyderabad 500001", students: 800, teachers: 35 },
      { districtId: did, name: "Telangana Model School, Amberpet", type: "Government", level: "High School", address: "Amberpet, Hyderabad 500013", students: 500, teachers: 25 },
      { districtId: did, name: "Kendriya Vidyalaya, Picket", type: "Central", level: "Senior Secondary", address: "Picket, Secunderabad 500026", students: 1800, teachers: 75 },
      { districtId: did, name: "Kendriya Vidyalaya, Golconda", type: "Central", level: "Senior Secondary", address: "Golconda, Hyderabad 500008", students: 1500, teachers: 65 },
      { districtId: did, name: "Hyderabad Public School, Begumpet", type: "Private", level: "Senior Secondary", address: "Begumpet, Hyderabad 500016", students: 3500, teachers: 200 },
      { districtId: did, name: "St. George's Grammar School", type: "Private", level: "Senior Secondary", address: "Abids, Hyderabad 500001", students: 2000, teachers: 110 },
      { districtId: did, name: "Osmania University", type: "University", level: "University", address: "Amberpet, Hyderabad 500007", students: 30000, teachers: 1200 },
      { districtId: did, name: "University of Hyderabad", type: "University", level: "University", address: "Gachibowli, Hyderabad 500046", students: 5500, teachers: 400 },
      { districtId: did, name: "IIIT Hyderabad", type: "University", level: "University", address: "Gachibowli, Hyderabad 500032", students: 2500, teachers: 150 },
      { districtId: did, name: "Indian School of Business (ISB)", type: "University", level: "University", address: "Gachibowli, Hyderabad 500111", students: 900, teachers: 120 },
      { districtId: did, name: "NALSAR University of Law", type: "University", level: "University", address: "Shameerpet, Hyderabad 500101", students: 800, teachers: 60 },
      { districtId: did, name: "Nizam College (Autonomous)", type: "Government", level: "College", address: "Basheerbagh, Hyderabad 500001", students: 4000, teachers: 150 },
    ] });
    console.log("  ✓ Schools seeded");
  } else { console.log(`  ⏭ Schools already seeded (${schoolCount})`); }

  // ═══ F. GOVERNMENT OFFICES ═══
  const officeCount = await prisma.govOffice.count({ where: { districtId: did } });
  if (officeCount === 0) {
    console.log("Seeding government offices...");
    await prisma.govOffice.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Collectorate, Hyderabad", department: "Revenue", type: "Collectorate", address: "Tank Bund Road, Hyderabad 500063", phone: "040-23222585", latitude: 17.410, longitude: 78.475 },
      { districtId: did, name: "GHMC Head Office", department: "Municipal", type: "Corporation", address: "Tank Bund Road, Hyderabad 500063", phone: "040-21111111", latitude: 17.412, longitude: 78.476 },
      { districtId: did, name: "HMDA Office", department: "Urban Development", type: "Development Authority", address: "Khairatabad, Hyderabad 500004", phone: "040-23390391", latitude: 17.398, longitude: 78.464 },
      { districtId: did, name: "Telangana Secretariat", department: "General Administration", type: "Secretariat", address: "Khairatabad, Hyderabad 500022", phone: "040-23452896", latitude: 17.398, longitude: 78.455 },
      { districtId: did, name: "Telangana High Court", department: "Judiciary", type: "High Court", address: "Ghansi Bazaar, Hyderabad 500002", phone: "040-24512349", latitude: 17.375, longitude: 78.474 },
      { districtId: did, name: "TGSPDCL Head Office", department: "Power", type: "Power Company", address: "Mint Compound, Hyderabad 500063", phone: "040-23423104", latitude: 17.405, longitude: 78.478 },
      { districtId: did, name: "HMWSSB Head Office", department: "Water", type: "Water Board", address: "Khairatabad, Hyderabad 500004", phone: "040-23390516", latitude: 17.399, longitude: 78.463 },
      { districtId: did, name: "TSRTC Bus Bhavan", department: "Transport", type: "Transport", address: "Musheerabad, Hyderabad 500048", phone: "040-27614410", latitude: 17.403, longitude: 78.497 },
      { districtId: did, name: "HMRL Corporate Office", department: "Metro Rail", type: "Metro Rail", address: "Begumpet, Hyderabad 500016", phone: "040-23391800", latitude: 17.438, longitude: 78.463 },
      { districtId: did, name: "RTO Hyderabad", department: "Transport", type: "RTO", address: "Khairatabad, Hyderabad 500004", phone: "040-23391516", latitude: 17.398, longitude: 78.462 },
      { districtId: did, name: "Passport Seva Kendra", department: "External Affairs", type: "Passport Office", address: "Tolichowki, Hyderabad 500008", phone: "1800-258-1800", latitude: 17.393, longitude: 78.417 },
    ] });
    console.log("  ✓ Government offices seeded");
  } else { console.log(`  ⏭ Offices already seeded (${officeCount})`); }

  // ═══ G. SCHEMES ═══
  const schemeCount = await prisma.scheme.count({ where: { districtId: did } });
  if (schemeCount === 0) {
    console.log("Seeding schemes...");
    await prisma.scheme.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "PM-KISAN", category: "Central", level: "Central", applyUrl: "https://pmkisan.gov.in", source: "pmkisan.gov.in" },
      { districtId: did, name: "PMAY-Urban (Housing for All)", category: "Central", level: "Central", applyUrl: "https://pmaymis.gov.in", source: "pmaymis.gov.in" },
      { districtId: did, name: "Ayushman Bharat / PM-JAY", category: "Central", level: "Central", applyUrl: "https://pmjay.gov.in", source: "pmjay.gov.in" },
      { districtId: did, name: "Kalyana Lakshmi / Shadi Mubarak", category: "State", level: "State", applyUrl: "https://telanganaepass.cgg.gov.in", source: "telangana.gov.in" },
      { districtId: did, name: "Aasara Pensions", category: "State", level: "State", applyUrl: "https://meeseva.telangana.gov.in", source: "telangana.gov.in" },
      { districtId: did, name: "KCR Kit — Maternity Benefit", category: "State", level: "State", applyUrl: "https://kcrkit.telangana.gov.in", source: "kcrkit.telangana.gov.in" },
      { districtId: did, name: "Dharani — Land Registration Portal", category: "State", level: "State", applyUrl: "https://dharani.telangana.gov.in" },
      { districtId: did, name: "TS-iPASS — Industrial Clearance", category: "State", level: "State", applyUrl: "https://ipass.telangana.gov.in", source: "ipass.telangana.gov.in" },
      { districtId: did, name: "2BHK Housing Scheme", category: "State", level: "State", applyUrl: "https://housing.telangana.gov.in", source: "housing.telangana.gov.in" },
      { districtId: did, name: "T-Hub — Startup Support", category: "State", level: "State", applyUrl: "https://t-hub.co", source: "t-hub.co" },
      { districtId: did, name: "Mee Seva — Citizen Services", category: "State", level: "State", applyUrl: "https://meeseva.telangana.gov.in" },
    ] });
    console.log("  ✓ Schemes seeded");
  } else { console.log(`  ⏭ Schemes already seeded (${schemeCount})`); }

  // ═══ H. ELECTION RESULTS ═══
  const electionCount = await prisma.electionResult.count({ where: { districtId: did } });
  if (electionCount === 0) {
    console.log("Seeding elections...");
    await prisma.electionResult.createMany({ skipDuplicates: true, data: [
      { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Hyderabad", winnerName: "Asaduddin Owaisi", winnerParty: "AIMIM", winnerVotes: 661981, runnerUpName: "Madhavi Latha Kompella", runnerUpParty: "BJP", runnerUpVotes: 323894, margin: 338087, turnoutPct: 49.28, source: "results.eci.gov.in" },
      // 2023 Telangana Assembly — APPROXIMATE vote counts
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Charminar", winnerName: "Mumtaz Ahmed Khan", winnerParty: "AIMIM", winnerVotes: 85000, runnerUpParty: "INC", runnerUpVotes: 25000, margin: 60000, turnoutPct: 45.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Chandrayangutta", winnerName: "Akbaruddin Owaisi", winnerParty: "AIMIM", winnerVotes: 95000, runnerUpParty: "BJP", runnerUpVotes: 20000, margin: 75000, turnoutPct: 46.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Amberpet", winnerName: "R. Prakash Reddy", winnerParty: "INC", winnerVotes: 72000, runnerUpParty: "BRS", runnerUpVotes: 55000, margin: 17000, turnoutPct: 52.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Goshamahal", winnerName: "T. Raja Singh Lodh", winnerParty: "BJP", winnerVotes: 82000, runnerUpParty: "INC", runnerUpVotes: 60000, margin: 22000, turnoutPct: 55.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Secunderabad", winnerName: "T. Padma Rao Goud", winnerParty: "INC", winnerVotes: 78000, runnerUpParty: "BRS", runnerUpVotes: 58000, margin: 20000, turnoutPct: 52.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Khairatabad", winnerName: "Danam Nagender", winnerParty: "INC", winnerVotes: 75000, runnerUpParty: "BRS", runnerUpVotes: 55000, margin: 20000, turnoutPct: 50.0, source: "results.eci.gov.in" },
    ] });
    console.log("  ✓ Elections seeded");
  } else { console.log(`  ⏭ Elections already seeded (${electionCount})`); }

  // ═══ I. RTI TEMPLATES ═══
  const rtiCount = await prisma.rtiTemplate.count({ where: { districtId: did } });
  if (rtiCount === 0) {
    console.log("Seeding RTI templates...");
    await prisma.rtiTemplate.createMany({ skipDuplicates: true, data: [
      { districtId: did, topic: "GHMC Services & Property Tax", department: "GHMC", pioAddress: "CPIO, GHMC Head Office, Tank Bund, Hyderabad 500063", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Status of property tax assessment for [address]\n2. Civic works undertaken in [ward] in FY 2025-26\n3. Grievance resolution timeline for complaint [number]" },
      { districtId: did, topic: "HMWSSB Water Supply", department: "HMWSSB", pioAddress: "CPIO, HMWSSB Head Office, Khairatabad, Hyderabad 500004", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Water supply schedule for [area/colony]\n2. Quality test results for drinking water in [zone] for last 6 months\n3. Status of pending water connection [number]" },
      { districtId: did, topic: "TGSPDCL Electricity", department: "TGSPDCL", pioAddress: "CPIO, TGSPDCL Head Office, Mint Compound, Hyderabad 500063", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Power outage frequency for [area] in last 3 months\n2. Status of new electricity connection [number]\n3. Planned maintenance shutdowns for [substation]" },
      { districtId: did, topic: "Hyderabad Police", department: "Hyderabad City Police", pioAddress: "CPIO, Office of CP, Hyderabad 500004", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. FIR statistics for [police station] in last 6 months\n2. Crime statistics for [area] in FY 2025-26\n3. Status of complaint [number]" },
    ] });
    console.log("  ✓ RTI templates seeded");
  } else { console.log(`  ⏭ RTI already seeded (${rtiCount})`); }

  // ═══ J. FAMOUS PERSONALITIES ═══
  const famousCount = await prisma.famousPersonality.count({ where: { districtId: did } });
  if (famousCount === 0) {
    console.log("Seeding famous personalities...");
    await prisma.famousPersonality.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "P.V. Sindhu", nameLocal: "పి.వి. సింధు", category: "Sports", bio: "Badminton champion — Olympic silver (2016) and bronze (2020) medalist, World Champion (2019)", birthYear: 1995, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/P._V._Sindhu", source: "wikipedia" },
      { districtId: did, name: "Mohammed Azharuddin", nameLocal: "మహమ్మద్ అజహరుద్దీన్", category: "Sports", bio: "Former India cricket captain — 99 Tests, 22 centuries, one of India's most elegant batsmen", birthYear: 1963, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Mohammad_Azharuddin", source: "wikipedia" },
      { districtId: did, name: "Nawab Mir Osman Ali Khan", nameLocal: "నవాబ్ మీర్ ఉస్మాన్ అలీ ఖాన్", category: "Historical", bio: "Last Nizam of Hyderabad — once considered the richest person in the world", birthYear: 1886, deathYear: 1967, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Mir_Osman_Ali_Khan", source: "wikipedia" },
      { districtId: did, name: "Sania Mirza", nameLocal: "సానియా మీర్జా", category: "Sports", bio: "Tennis champion — former World No. 1 in doubles, 6 Grand Slam titles, grew up in Hyderabad", birthYear: 1986, bornInDistrict: false, wikiUrl: "https://en.wikipedia.org/wiki/Sania_Mirza", source: "wikipedia" },
    ] });
    console.log("  ✓ Famous personalities seeded");
  } else { console.log(`  ⏭ Famous personalities already seeded (${famousCount})`); }

  // ═══ K. LOCAL INDUSTRIES ═══
  const industryCount = await prisma.localIndustry.count({ where: { districtId: did } });
  if (industryCount === 0) {
    console.log("Seeding industries...");
    await prisma.localIndustry.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "HITEC City", type: "IT Park", category: "IT Park", details: { employees: 800000, description: "India's premier IT hub — Microsoft, Google, Amazon, Meta, Apple" }, source: "telangana.gov.in" },
      { districtId: did, name: "Genome Valley", type: "Biotech Cluster", category: "Pharma", details: { employees: 100000, description: "India's largest biotech cluster — Bharat Biotech, Dr. Reddy's" }, source: "tsiic.telangana.gov.in" },
      { districtId: did, name: "Financial District", type: "Commercial Hub", category: "Commercial", details: { employees: 200000, description: "GCCs of Deloitte, HSBC, Bank of America, Wells Fargo" }, source: "hmda.gov.in" },
      { districtId: did, name: "T-Hub", type: "Incubator", category: "Startup", details: { employees: 5000, description: "India's largest startup incubator — 2000+ startups" }, source: "t-hub.co" },
      { districtId: did, name: "Laad Bazaar / Charminar", type: "Market", category: "Heritage", details: { employees: 25000, description: "World-famous for bangles, pearls, and perfumes since 16th century" }, source: "ghmc.gov.in" },
      { districtId: did, name: "Begum Bazaar", type: "Market", category: "Heritage", details: { employees: 50000, description: "One of India's largest wholesale markets — 6000+ shops" }, source: "ghmc.gov.in" },
    ] });
    console.log("  ✓ Industries seeded");
  } else { console.log(`  ⏭ Industries already seeded (${industryCount})`); }

  // ═══ L. BUS ROUTES ═══
  const busCount = await prisma.busRoute.count({ where: { districtId: did } });
  if (busCount === 0) {
    console.log("Seeding bus routes...");
    await prisma.busRoute.createMany({ skipDuplicates: true, data: [
      { districtId: did, routeNumber: "5K", origin: "Secunderabad (JBS)", destination: "Charminar", via: "Koti, Sultan Bazaar", operator: "TSRTC", busType: "City Ordinary", frequency: "Every 5 min" },
      { districtId: did, routeNumber: "10H", origin: "Secunderabad (JBS)", destination: "Mehdipatnam", via: "Khairatabad, Lakdi Ka Pul", operator: "TSRTC", busType: "City Ordinary", frequency: "Every 8 min" },
      { districtId: did, routeNumber: "65", origin: "MGBS", destination: "Dilsukhnagar", via: "Chaderghat, Malakpet", operator: "TSRTC", busType: "City Ordinary", frequency: "Every 6 min" },
      { districtId: did, routeNumber: "127", origin: "MGBS", destination: "Miyapur", via: "Ameerpet, Kukatpally", operator: "TSRTC", busType: "Metro Express", frequency: "Every 8 min" },
      { districtId: did, routeNumber: "290", origin: "MGBS", destination: "Shamshabad Airport", via: "Aramghar, Shamshabad", operator: "TSRTC", busType: "Airport Express", frequency: "Every 30 min" },
      { districtId: did, routeNumber: "86", origin: "Secunderabad", destination: "Gachibowli", via: "Ameerpet, HITEC City", operator: "TSRTC", busType: "City Ordinary", frequency: "Every 10 min" },
    ] });
    console.log("  ✓ Bus routes seeded");
  } else { console.log(`  ⏭ Bus routes already seeded (${busCount})`); }

  // ═══ M. TRAIN SCHEDULES ═══
  const trainCount = await prisma.trainSchedule.count({ where: { districtId: did } });
  if (trainCount === 0) {
    console.log("Seeding trains...");
    await prisma.trainSchedule.createMany({ skipDuplicates: true, data: [
      { districtId: did, trainNumber: "12723", trainName: "Telangana Express", origin: "Secunderabad", destination: "New Delhi", stationName: "Secunderabad Junction (SC)", departureTime: "12:50", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12702", trainName: "Hussainsagar Express", origin: "Secunderabad", destination: "Mumbai CSMT", stationName: "Secunderabad Junction (SC)", departureTime: "14:45", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12728", trainName: "Godavari Express", origin: "Secunderabad", destination: "Visakhapatnam", stationName: "Secunderabad Junction (SC)", departureTime: "16:40", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12760", trainName: "Charminar Express", origin: "Hyderabad Deccan", destination: "Chennai Central", stationName: "Hyderabad Deccan (HYB)", departureTime: "18:20", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12608", trainName: "Lalbagh Express", origin: "Secunderabad", destination: "Bengaluru", stationName: "Secunderabad Junction (SC)", departureTime: "16:30", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12786", trainName: "Secunderabad Rajdhani", origin: "Secunderabad", destination: "New Delhi", stationName: "Secunderabad Junction (SC)", departureTime: "06:00", daysOfWeek: ["Wed","Sat"] },
    ] });
    console.log("  ✓ Train schedules seeded");
  } else { console.log(`  ⏭ Trains already seeded (${trainCount})`); }

  // ═══ N. SERVICE GUIDES ═══
  const serviceCount = await prisma.serviceGuide.count({ where: { districtId: did } });
  if (serviceCount === 0) {
    console.log("Seeding service guides...");
    await prisma.serviceGuide.createMany({ skipDuplicates: true, data: [
      { districtId: did, serviceName: "Birth / Death Certificate", category: "Civil", office: "GHMC / MeeSeva", documentsNeeded: ["Hospital records", "Parent Aadhaar"], fees: "₹50", timeline: "7-15 days", onlinePortal: "https://meeseva.telangana.gov.in" },
      { districtId: did, serviceName: "Property Registration", category: "Property", office: "IGRS Telangana / Dharani", documentsNeeded: ["Sale deed", "EC", "Aadhaar", "PAN"], fees: "Varies", timeline: "1-3 days", onlinePortal: "https://dharani.telangana.gov.in" },
      { districtId: did, serviceName: "Driving License", category: "Transport", office: "RTA Telangana", documentsNeeded: ["Aadhaar", "Address proof", "Medical cert"], fees: "₹400", timeline: "30+ days", onlinePortal: "https://transport.telangana.gov.in" },
      { districtId: did, serviceName: "Ration Card", category: "Civil", office: "Civil Supplies", documentsNeeded: ["Aadhaar", "Address proof", "Income certificate"], fees: "₹50", timeline: "15-30 days", onlinePortal: "https://epds.telangana.gov.in" },
      { districtId: did, serviceName: "Building Permission", category: "Property", office: "GHMC / HMDA", documentsNeeded: ["Survey number", "Site plan", "Title deed"], fees: "Varies", timeline: "15-30 days", onlinePortal: "https://dps.ghmc.gov.in" },
    ] });
    console.log("  ✓ Service guides seeded");
  } else { console.log(`  ⏭ Services already seeded (${serviceCount})`); }

  // ═══ O. COURT STATS ═══
  const courtCount = await prisma.courtStat.count({ where: { districtId: did } });
  if (courtCount === 0) {
    console.log("Seeding court stats...");
    await prisma.courtStat.createMany({ skipDuplicates: true, data: [
      // APPROXIMATE — verify from njdg.ecourts.gov.in
      { districtId: did, courtName: "Telangana High Court", year: 2025, filed: 50000, disposed: 45000, pending: 280000, avgDays: 365, source: "njdg.ecourts.gov.in" },
      { districtId: did, courtName: "City Civil Courts, Hyderabad", year: 2025, filed: 25000, disposed: 22000, pending: 85000, avgDays: 540, source: "njdg.ecourts.gov.in" },
      { districtId: did, courtName: "Metropolitan Criminal Courts", year: 2025, filed: 38000, disposed: 35000, pending: 120000, avgDays: 450, source: "njdg.ecourts.gov.in" },
    ] });
    console.log("  ✓ Court stats seeded");
  } else { console.log(`  ⏭ Courts already seeded (${courtCount})`); }

  console.log("\n🎉 Hyderabad district data seeding complete!");
  console.log("   NOTE: Some leadership entries marked VERIFY — update with real names.");
  console.log("   NOTE: Assembly 2023 vote counts are approximate — verify from results.eci.gov.in");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
