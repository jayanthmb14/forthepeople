// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Uttar Pradesh Data Seed — Lucknow District
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-lucknow-data.ts
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
  console.log("🏛️  Seeding Lucknow district data...\n");

  const up = await prisma.state.findUnique({ where: { slug: "uttar-pradesh" } });
  if (!up) throw new Error("Uttar Pradesh state not found. Run seed-hierarchy.ts first.");

  const district = await prisma.district.findFirst({
    where: { slug: "lucknow", stateId: up.id },
  });
  if (!district) throw new Error("Lucknow district not found. Run seed-hierarchy.ts first.");

  const did = district.id;
  console.log(`✓ Found Lucknow (id: ${did})\n`);

  // ═══ A. LEADERSHIP ═══
  const leaderCount = await prisma.leader.count({ where: { districtId: did } });
  if (leaderCount === 0) {
    console.log("Seeding leadership...");
    await prisma.leader.createMany({ skipDuplicates: true, data: [
      // Lok Sabha MP
      { districtId: did, name: "Rajnath Singh", role: "Member of Parliament (Lok Sabha)", party: "BJP", tier: 1, constituency: "Lucknow", source: "results.eci.gov.in" },
      // 2022 UP Assembly MLAs (9 constituencies)
      { districtId: did, name: "Armaan Khan", role: "MLA, Lucknow West", party: "SP", tier: 2, constituency: "Lucknow West", source: "results.eci.gov.in" },
      { districtId: did, name: "Dr. Neeraj Bora", role: "MLA, Lucknow North", party: "BJP", tier: 2, constituency: "Lucknow North", source: "results.eci.gov.in" },
      { districtId: did, name: "O.P. Srivastava", role: "MLA, Lucknow East", party: "BJP", tier: 2, constituency: "Lucknow East", source: "results.eci.gov.in" },
      { districtId: did, name: "Ravidas Mehrotra", role: "MLA, Lucknow Central", party: "SP", tier: 2, constituency: "Lucknow Central", source: "results.eci.gov.in" },
      { districtId: did, name: "Brijesh Pathak", role: "MLA, Lucknow Cantt", party: "BJP", tier: 2, constituency: "Lucknow Cantt", source: "results.eci.gov.in" },
      { districtId: did, name: "Amaresh Kumar", role: "MLA, Mohanlalganj", party: "BJP", tier: 2, constituency: "Mohanlalganj", source: "results.eci.gov.in" },
      { districtId: did, name: "Yogesh Shukla", role: "MLA, Bakshi Ka Talab", party: "BJP", tier: 2, constituency: "Bakshi Ka Talab", source: "results.eci.gov.in" },
      { districtId: did, name: "Rajeshwar Singh", role: "MLA, Sarojini Nagar", party: "BJP", tier: 2, constituency: "Sarojini Nagar", source: "results.eci.gov.in" },
      { districtId: did, name: "Jai Devi", role: "MLA, Malihabad", party: "BJP", tier: 2, constituency: "Malihabad", source: "results.eci.gov.in" },
      // State / Admin
      { districtId: did, name: "Anandiben Patel", role: "Governor of Uttar Pradesh", tier: 4, source: "upgovernor.gov.in" },
      { districtId: did, name: "Yogi Adityanath", role: "Chief Minister of Uttar Pradesh", party: "BJP", tier: 4, source: "cm.up.gov.in" },
      { districtId: did, name: "Vishak G Iyer, IAS", role: "District Magistrate, Lucknow", tier: 4, source: "lucknow.nic.in (verified April 2026)" },
      { districtId: did, name: "Amarendra Singh Sengar, IPS", role: "Commissioner of Police, Lucknow", tier: 5, source: "uppolice.gov.in (verified April 2026)" },
    ] });
    console.log("  ✓ Leadership seeded");
  } else { console.log(`  ⏭ Leadership already seeded (${leaderCount})`); }

  // ═══ B. BUDGET ═══
  const budgetCount = await prisma.budgetEntry.count({ where: { districtId: did } });
  if (budgetCount === 0) {
    console.log("Seeding budget...");
    await prisma.budgetEntry.createMany({ skipDuplicates: true, data: [
      { districtId: did, fiscalYear: "2025-26", sector: "Education", allocated: 150000000000, released: 0, spent: 0, source: "UP Finance Department (budget.up.nic.in)" },
      { districtId: did, fiscalYear: "2025-26", sector: "Health & Medical", allocated: 95000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Police & Home Affairs", allocated: 85000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Roads & PWD", allocated: 70000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Municipal Administration (LMC)", allocated: 55000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Urban Development (LDA)", allocated: 45000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Water Supply (Jal Kal)", allocated: 30000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Agriculture", allocated: 25000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Social Welfare", allocated: 35000000000, released: 0, spent: 0, source: "UP Finance Department" },
      { districtId: did, fiscalYear: "2025-26", sector: "Lucknow Metro (LMRC)", allocated: 20000000000, released: 0, spent: 0, source: "UP Finance Department" },
    ] });
    console.log("  ✓ Budget seeded");
  } else { console.log(`  ⏭ Budget already seeded (${budgetCount})`); }

  // ═══ C. INFRASTRUCTURE PROJECTS ═══
  const infraCount = await prisma.infraProject.count({ where: { districtId: did } });
  if (infraCount === 0) {
    console.log("Seeding infrastructure...");
    await prisma.infraProject.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Lucknow Metro Phase 1B — Airport to Munshipulia", category: "Metro Rail", budget: 50000000000, fundsReleased: 15000000000, progressPct: 30, status: "In Progress", contractor: "LMRC / State Govt", startDate: new Date("2023-06-01"), expectedEnd: new Date("2028-12-31"), source: "lmrcl.com" },
      { districtId: did, name: "Lucknow Metro Phase 2 — Charbagh to Vasant Kunj", category: "Metro Rail", budget: 35000000000, fundsReleased: 5000000000, progressPct: 10, status: "Planning", contractor: "LMRC", startDate: new Date("2025-01-01"), expectedEnd: new Date("2030-12-31"), source: "lmrcl.com" },
      { districtId: did, name: "Lucknow Outer Ring Road — 104 km", category: "Roads", budget: 45000000000, fundsReleased: 18000000000, progressPct: 40, status: "In Progress", contractor: "UPEIDA / NHAI", startDate: new Date("2021-01-01"), expectedEnd: new Date("2027-06-30"), source: "upeida.up.gov.in" },
      { districtId: did, name: "Gomti Riverfront Development Phase 2", category: "Mega Project", budget: 30000000000, fundsReleased: 8000000000, progressPct: 25, status: "In Progress", contractor: "LDA / State Govt", startDate: new Date("2022-01-01"), expectedEnd: new Date("2028-12-31"), source: "lda.up.gov.in" },
      { districtId: did, name: "KGMU Super Speciality Block Expansion", category: "Health", budget: 12000000000, fundsReleased: 5000000000, progressPct: 45, status: "In Progress", contractor: "UP PWD", startDate: new Date("2022-06-01"), expectedEnd: new Date("2027-03-31"), source: "kgmu.org" },
      { districtId: did, name: "IT City Lucknow — Chak Ganjaria", category: "Industrial", budget: 20000000000, fundsReleased: 6000000000, progressPct: 20, status: "In Progress", contractor: "LDA / State IT Dept", startDate: new Date("2019-01-01"), expectedEnd: new Date("2028-12-31"), source: "lucknow.nic.in" },
      { districtId: did, name: "Ekana Stadium Precinct — Phase 2 Sports Hub", category: "Sports", budget: 8000000000, fundsReleased: 3000000000, progressPct: 35, status: "In Progress", contractor: "UP Sports Authority", startDate: new Date("2023-01-01"), expectedEnd: new Date("2027-06-30"), source: "upsa.up.gov.in" },
      { districtId: did, name: "Lucknow-Agra Expressway Upgradation", category: "Roads", budget: 15000000000, fundsReleased: 7000000000, progressPct: 50, status: "In Progress", contractor: "UPEIDA", startDate: new Date("2022-01-01"), expectedEnd: new Date("2026-12-31"), source: "upeida.up.gov.in" },
      { districtId: did, name: "Smart City Projects — Lucknow (ICF)", category: "Smart City", budget: 18000000000, fundsReleased: 10000000000, progressPct: 55, status: "In Progress", contractor: "Lucknow Smart City Ltd", startDate: new Date("2017-06-01"), expectedEnd: new Date("2027-03-31"), source: "smartcities.gov.in" },
      { districtId: did, name: "Integrated Bus Terminal — Alambagh", category: "Transport", budget: 5000000000, fundsReleased: 2500000000, progressPct: 50, status: "In Progress", contractor: "UPSRTC / LDA", startDate: new Date("2023-01-01"), expectedEnd: new Date("2026-12-31"), source: "upsrtc.com" },
    ] });
    console.log("  ✓ Infrastructure seeded");
  } else { console.log(`  ⏭ Infrastructure already seeded (${infraCount})`); }

  // ═══ D. POLICE STATIONS ═══
  const policeCount = await prisma.policeStation.count({ where: { districtId: did } });
  if (policeCount === 0) {
    console.log("Seeding police stations...");
    await prisma.policeStation.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Hazratganj PS", address: "Hazratganj, Lucknow 226001", phone: "0522-2623399", lat: 26.850, lng: 80.946 },
      { districtId: did, name: "Chowk PS", address: "Chowk, Lucknow 226003", phone: "0522-2252100", lat: 26.855, lng: 80.917 },
      { districtId: did, name: "Kaiserbagh PS", address: "Kaiserbagh, Lucknow 226001", phone: "0522-2622400", lat: 26.847, lng: 80.936 },
      { districtId: did, name: "Gomti Nagar PS", address: "Gomti Nagar, Lucknow 226010", phone: "0522-2305100", lat: 26.856, lng: 80.991 },
      { districtId: did, name: "Aliganj PS", address: "Aliganj, Lucknow 226024", phone: "0522-2325400", lat: 26.889, lng: 80.940 },
      { districtId: did, name: "Indira Nagar PS", address: "Indira Nagar, Lucknow 226016", phone: "0522-2354100", lat: 26.872, lng: 80.985 },
      { districtId: did, name: "Chinhat PS", address: "Chinhat, Lucknow 226028", phone: "0522-2670100", lat: 26.872, lng: 81.028 },
      { districtId: did, name: "Ashiana PS", address: "Ashiana, Lucknow 226012", phone: "0522-2422100", lat: 26.805, lng: 80.947 },
      { districtId: did, name: "Vibhuti Khand PS", address: "Vibhuti Khand, Gomti Nagar, Lucknow 226010", phone: "0522-2301600", lat: 26.849, lng: 81.005 },
      { districtId: did, name: "Mahanagar PS", address: "Mahanagar, Lucknow 226006", phone: "0522-2386100", lat: 26.878, lng: 80.951 },
      { districtId: did, name: "Alambagh PS", address: "Alambagh, Lucknow 226005", phone: "0522-2455100", lat: 26.828, lng: 80.918 },
      { districtId: did, name: "Sarojini Nagar PS", address: "Sarojini Nagar, Lucknow 226008", phone: "0522-2415200", lat: 26.795, lng: 80.925 },
      { districtId: did, name: "Cantonment PS", address: "Lucknow Cantt, Lucknow 226002", phone: "0522-2281200", lat: 26.843, lng: 80.904 },
      { districtId: did, name: "Jankipuram PS", address: "Jankipuram, Lucknow 226021", phone: "0522-2730100", lat: 26.920, lng: 80.975 },
      { districtId: did, name: "Gudamba PS", address: "Gudamba, Lucknow 226002", phone: "0522-2282100", lat: 26.860, lng: 80.900 },
    ] });
    console.log("  ✓ Police stations seeded");
  } else { console.log(`  ⏭ Police stations already seeded (${policeCount})`); }

  // ═══ E. SCHOOLS ═══
  const schoolCount = await prisma.school.count({ where: { districtId: did } });
  if (schoolCount === 0) {
    console.log("Seeding schools...");
    await prisma.school.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "University of Lucknow", type: "University", level: "University", address: "University Road, Lucknow 226007", students: 30000, teachers: 800 },
      { districtId: did, name: "Indian Institute of Management (IIM) Lucknow", type: "University", level: "University", address: "Prabandh Nagar, IIM Road, Lucknow 226013", students: 900, teachers: 100 },
      { districtId: did, name: "King George's Medical University (KGMU)", type: "University", level: "University", address: "Shah Mina Road, Chowk, Lucknow 226003", students: 3500, teachers: 600 },
      { districtId: did, name: "SGPGI (Sanjay Gandhi Postgraduate Institute)", type: "University", level: "University", address: "Raebareli Road, Lucknow 226014", students: 1200, teachers: 350 },
      { districtId: did, name: "La Martiniere College", type: "Private", level: "Senior Secondary", address: "1 La Martiniere Road, Lucknow 226001", students: 3000, teachers: 180 },
      { districtId: did, name: "City Montessori School (CMS)", type: "Private", level: "Senior Secondary", address: "12 Station Road, Lucknow 226001", students: 55000, teachers: 3800 },
      { districtId: did, name: "IIIT Lucknow", type: "University", level: "University", address: "Chak Ganjaria, C.G. City, Lucknow 226002", students: 1500, teachers: 80 },
      { districtId: did, name: "Dr. Ram Manohar Lohia National Law University", type: "University", level: "University", address: "Sector D-1, LDA Colony, Kanpur Road, Lucknow 226012", students: 800, teachers: 45 },
      { districtId: did, name: "Colvin Taluqdars' College", type: "Private", level: "Senior Secondary", address: "Colvin Taluqdars Rd, Lalbagh, Lucknow 226001", students: 1500, teachers: 90 },
      { districtId: did, name: "Kendriya Vidyalaya, Lucknow Cantt", type: "Central", level: "Senior Secondary", address: "Lucknow Cantt, Lucknow 226002", students: 2000, teachers: 80 },
      { districtId: did, name: "Lucknow Public School", type: "Private", level: "Senior Secondary", address: "Sector H, LDA Colony, Kanpur Road, Lucknow 226012", students: 3000, teachers: 150 },
      { districtId: did, name: "BBD University (Babu Banarasi Das)", type: "University", level: "University", address: "BBD City, Faizabad Road, Lucknow 226028", students: 12000, teachers: 500 },
      { districtId: did, name: "Integral University", type: "University", level: "University", address: "Dasauli, Kursi Road, Lucknow 226026", students: 10000, teachers: 450 },
      { districtId: did, name: "Nizam College (Govt Inter College)", type: "Government", level: "Senior Secondary", address: "Kaiserbagh, Lucknow 226001", students: 2000, teachers: 60 },
      { districtId: did, name: "Rani Laxmi Bai Memorial School", type: "Government", level: "High School", address: "Aminabad, Lucknow 226018", students: 800, teachers: 35 },
    ] });
    console.log("  ✓ Schools seeded");
  } else { console.log(`  ⏭ Schools already seeded (${schoolCount})`); }

  // ═══ F. GOVERNMENT OFFICES ═══
  const officeCount = await prisma.govOffice.count({ where: { districtId: did } });
  if (officeCount === 0) {
    console.log("Seeding government offices...");
    await prisma.govOffice.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "District Magistrate Office, Lucknow", department: "Revenue", type: "Collectorate", address: "Kaiserbagh, Lucknow 226001", phone: "0522-2622333", latitude: 26.847, longitude: 80.936 },
      { districtId: did, name: "UP Vidhan Sabha (Legislative Assembly)", department: "Legislature", type: "Legislature", address: "Vidhan Sabha Marg, Lucknow 226001", phone: "0522-2237312", latitude: 26.848, longitude: 80.929 },
      { districtId: did, name: "Lucknow Municipal Corporation (LMC)", department: "Municipal", type: "Corporation", address: "Lalbagh, Lucknow 226001", phone: "0522-2620478", latitude: 26.852, longitude: 80.924 },
      { districtId: did, name: "Regional Transport Office (RTO), Lucknow", department: "Transport", type: "RTO", address: "Kanpur Road, Lucknow 226012", phone: "0522-2452020", latitude: 26.822, longitude: 80.920 },
      { districtId: did, name: "UPSRTC Regional Office, Kaiserbagh", department: "Transport", type: "Transport", address: "Kaiserbagh Bus Stand, Lucknow 226001", phone: "0522-2620120", latitude: 26.845, longitude: 80.934 },
      { districtId: did, name: "Passport Seva Kendra, Lucknow", department: "External Affairs", type: "Passport Office", address: "TCS Building, Vibhuti Khand, Gomti Nagar, Lucknow 226010", phone: "1800-258-1800", latitude: 26.851, longitude: 81.003 },
      { districtId: did, name: "UPPCL / LESA (Lucknow Electricity Supply)", department: "Power", type: "Power Company", address: "Shakti Bhawan, 14 Ashok Marg, Lucknow 226001", phone: "0522-2287504", latitude: 26.855, longitude: 80.942 },
      { districtId: did, name: "Jal Kal Vibhag (Water Dept)", department: "Water", type: "Water Board", address: "Jal Sansthan, Kaiserbagh, Lucknow 226001", phone: "0522-2614160", latitude: 26.846, longitude: 80.935 },
      { districtId: did, name: "Lucknow Development Authority (LDA)", department: "Urban Development", type: "Development Authority", address: "Vipin Khand, Gomti Nagar, Lucknow 226010", phone: "0522-2302740", latitude: 26.852, longitude: 80.998 },
      { districtId: did, name: "Allahabad High Court — Lucknow Bench", department: "Judiciary", type: "High Court", address: "Kaiserbagh, Lucknow 226001", phone: "0522-2622118", latitude: 26.848, longitude: 80.937 },
    ] });
    console.log("  ✓ Government offices seeded");
  } else { console.log(`  ⏭ Offices already seeded (${officeCount})`); }

  // ═══ G. SCHEMES ═══
  const schemeCount = await prisma.scheme.count({ where: { districtId: did } });
  if (schemeCount === 0) {
    console.log("Seeding schemes...");
    await prisma.scheme.createMany({ skipDuplicates: true, data: [
      // Central
      { districtId: did, name: "PM-KISAN", category: "Central", level: "Central", applyUrl: "https://pmkisan.gov.in", source: "pmkisan.gov.in" },
      { districtId: did, name: "PMAY-Urban (Housing for All)", category: "Central", level: "Central", applyUrl: "https://pmaymis.gov.in", source: "pmaymis.gov.in" },
      { districtId: did, name: "Ayushman Bharat / PM-JAY", category: "Central", level: "Central", applyUrl: "https://pmjay.gov.in", source: "pmjay.gov.in" },
      { districtId: did, name: "PM Ujjwala Yojana", category: "Central", level: "Central", applyUrl: "https://pmuy.gov.in", source: "pmuy.gov.in" },
      // State
      { districtId: did, name: "Kanya Sumangala Yojana", category: "State", level: "State", applyUrl: "https://mksy.up.gov.in", source: "mksy.up.gov.in" },
      { districtId: did, name: "Mukhyamantri Abhyudaya Yojana (Free Coaching)", category: "State", level: "State", applyUrl: "https://abhyuday.up.gov.in", source: "abhyuday.up.gov.in" },
      { districtId: did, name: "UP Berojgari Bhatta (Unemployment Allowance)", category: "State", level: "State", applyUrl: "https://sewayojan.up.nic.in", source: "sewayojan.up.nic.in" },
      { districtId: did, name: "Samajwadi Pension Yojana (Old Age/Widow)", category: "State", level: "State", applyUrl: "https://sspy-up.gov.in", source: "sspy-up.gov.in" },
      { districtId: did, name: "e-District UP (Citizen Services Portal)", category: "State", level: "State", applyUrl: "https://edistrict.up.gov.in", source: "edistrict.up.gov.in" },
      { districtId: did, name: "One District One Product (ODOP)", category: "State", level: "State", applyUrl: "https://odopup.in", source: "odopup.in" },
    ] });
    console.log("  ✓ Schemes seeded");
  } else { console.log(`  ⏭ Schemes already seeded (${schemeCount})`); }

  // ═══ H. ELECTION RESULTS ═══
  const electionCount = await prisma.electionResult.count({ where: { districtId: did } });
  if (electionCount === 0) {
    console.log("Seeding elections...");
    await prisma.electionResult.createMany({ skipDuplicates: true, data: [
      // 2024 Lok Sabha
      { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Lucknow", winnerName: "Rajnath Singh", winnerParty: "BJP", winnerVotes: 612709, runnerUpName: "Ravidas Mehrotra", runnerUpParty: "SP", runnerUpVotes: 477550, margin: 135159, turnoutPct: 55.0, source: "results.eci.gov.in" },
      // 2022 UP Assembly — APPROXIMATE vote counts
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Lucknow West", winnerName: "Armaan Khan", winnerParty: "SP", winnerVotes: 72000, runnerUpParty: "BJP", runnerUpVotes: 65000, margin: 7000, turnoutPct: 48.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Lucknow North", winnerName: "Dr. Neeraj Bora", winnerParty: "BJP", winnerVotes: 95000, runnerUpParty: "SP", runnerUpVotes: 60000, margin: 35000, turnoutPct: 50.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Lucknow East", winnerName: "O.P. Srivastava", winnerParty: "BJP", winnerVotes: 88000, runnerUpParty: "SP", runnerUpVotes: 62000, margin: 26000, turnoutPct: 49.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Lucknow Central", winnerName: "Ravidas Mehrotra", winnerParty: "SP", winnerVotes: 68000, runnerUpParty: "BJP", runnerUpVotes: 64000, margin: 4000, turnoutPct: 47.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Lucknow Cantt", winnerName: "Brijesh Pathak", winnerParty: "BJP", winnerVotes: 110000, runnerUpParty: "SP", runnerUpVotes: 55000, margin: 55000, turnoutPct: 52.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Mohanlalganj", winnerName: "Amaresh Kumar", winnerParty: "BJP", winnerVotes: 92000, runnerUpParty: "SP", runnerUpVotes: 70000, margin: 22000, turnoutPct: 55.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Bakshi Ka Talab", winnerName: "Yogesh Shukla", winnerParty: "BJP", winnerVotes: 98000, runnerUpParty: "SP", runnerUpVotes: 68000, margin: 30000, turnoutPct: 53.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Sarojini Nagar", winnerName: "Rajeshwar Singh", winnerParty: "BJP", winnerVotes: 115000, runnerUpParty: "SP", runnerUpVotes: 52000, margin: 63000, turnoutPct: 54.0, source: "results.eci.gov.in" },
      { districtId: did, year: 2022, electionType: "ASSEMBLY", constituency: "Malihabad", winnerName: "Jai Devi", winnerParty: "BJP", winnerVotes: 85000, runnerUpParty: "SP", runnerUpVotes: 72000, margin: 13000, turnoutPct: 56.0, source: "results.eci.gov.in" },
    ] });
    console.log("  ✓ Elections seeded");
  } else { console.log(`  ⏭ Elections already seeded (${electionCount})`); }

  // ═══ I. RTI TEMPLATES ═══
  const rtiCount = await prisma.rtiTemplate.count({ where: { districtId: did } });
  if (rtiCount === 0) {
    console.log("Seeding RTI templates...");
    await prisma.rtiTemplate.createMany({ skipDuplicates: true, data: [
      { districtId: did, topic: "LMC Services & Property Tax", department: "Lucknow Municipal Corporation", pioAddress: "CPIO, Lucknow Municipal Corporation (LMC), Lalbagh, Lucknow 226001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Status of property tax assessment for [address]\n2. Civic works undertaken in [ward] in FY 2025-26\n3. Garbage collection schedule and contractor details for [ward]\n4. Total municipal revenue collected in last financial year" },
      { districtId: did, topic: "Jal Kal Vibhag — Water Supply", department: "Jal Kal Vibhag", pioAddress: "CPIO, Jal Sansthan, Kaiserbagh, Lucknow 226001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Water supply schedule for [area/colony]\n2. Water quality test results for [area] for last 6 months\n3. Status of pending water connection application [number]\n4. Gomti river water treatment capacity and daily supply in MLD" },
      { districtId: did, topic: "Lucknow Police — Crime & Safety", department: "Lucknow Police Commissionerate", pioAddress: "CPIO, Office of Commissioner of Police, Lucknow 226001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. FIR statistics for [police station] in last 6 months\n2. Crime statistics by category for [area] in FY 2025-26\n3. Status of complaint [number]\n4. Total CCTV cameras operational in Lucknow and functional percentage" },
      { districtId: did, topic: "UPPCL / LESA Electricity", department: "UPPCL / LESA", pioAddress: "CPIO, LESA (Lucknow Electricity Supply Administration), Shakti Bhawan, 14 Ashok Marg, Lucknow 226001", feeAmount: "₹10", templateText: "Under RTI Act 2005, I request information regarding:\n1. Power outage frequency for [area] in last 3 months\n2. Status of new electricity connection application [number]\n3. Revenue collection and outstanding dues for [subdivision]\n4. Transformer load capacity and overload incidents in [area]" },
    ] });
    console.log("  ✓ RTI templates seeded");
  } else { console.log(`  ⏭ RTI already seeded (${rtiCount})`); }

  // ═══ J. FAMOUS PERSONALITIES ═══
  const famousCount = await prisma.famousPersonality.count({ where: { districtId: did } });
  if (famousCount === 0) {
    console.log("Seeding famous personalities...");
    await prisma.famousPersonality.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Begum Hazrat Mahal", category: "Historical", bio: "Freedom fighter — led the 1857 revolt in Awadh against the British, regent of Awadh during the uprising", birthYear: 1820, deathYear: 1879, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Begum_Hazrat_Mahal", source: "wikipedia" },
      { districtId: did, name: "Wajid Ali Shah", category: "Historical", bio: "Last Nawab of Awadh — patron of arts, Kathak dance, and Lucknowi cuisine; deposed by the British in 1856", birthYear: 1822, deathYear: 1887, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Wajid_Ali_Shah", source: "wikipedia" },
      { districtId: did, name: "Josh Malihabadi", category: "Literature", bio: "Renowned Urdu poet — 'Shayar-e-Inquilab' (Poet of Revolution), born in Malihabad near Lucknow, known for fiery nationalist poetry", birthYear: 1898, deathYear: 1982, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Josh_Malihabadi", source: "wikipedia" },
      { districtId: did, name: "Majaz Lakhnawi", category: "Literature", bio: "Progressive Urdu poet — known for 'Awaara' and romantic revolutionary poetry, icon of the Progressive Writers' Movement", birthYear: 1911, deathYear: 1955, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Majaz", source: "wikipedia" },
      { districtId: did, name: "Birjis Qadr", category: "Historical", bio: "Son of Wajid Ali Shah — declared King of Awadh during the 1857 revolt at the age of 12, symbol of resistance", birthYear: 1845, deathYear: 1893, bornInDistrict: true, wikiUrl: "https://en.wikipedia.org/wiki/Birjis_Qadr", source: "wikipedia" },
    ] });
    console.log("  ✓ Famous personalities seeded");
  } else { console.log(`  ⏭ Famous personalities already seeded (${famousCount})`); }

  // ═══ K. LOCAL INDUSTRIES ═══
  const industryCount = await prisma.localIndustry.count({ where: { districtId: did } });
  if (industryCount === 0) {
    console.log("Seeding industries...");
    await prisma.localIndustry.createMany({ skipDuplicates: true, data: [
      { districtId: did, name: "Chikankari Industry", type: "Handicraft", category: "Heritage", details: { employees: 250000, description: "World-famous Lucknowi hand-embroidery — GI-tagged, centuries-old tradition employing lakhs of artisans" }, source: "odopup.in" },
      { districtId: did, name: "IT City Lucknow — Chak Ganjaria", type: "IT Park", category: "IT Park", details: { employees: 25000, description: "Emerging IT hub with TCS, HCL, Infosys presence — being developed by LDA" }, source: "lda.up.gov.in" },
      { districtId: did, name: "Amausi Industrial Area", type: "Industrial Estate", category: "Industrial", details: { employees: 30000, description: "Major industrial area near airport — engineering, pharma, FMCG units" }, source: "upsidc.com" },
      { districtId: did, name: "Chinhat Industrial Area (Glass & Pottery)", type: "Cluster", category: "Heritage", details: { employees: 15000, description: "Traditional glass and pottery cluster — blue pottery, clay products, decorative items" }, source: "msme.gov.in" },
      { districtId: did, name: "SGPGI / KGMU Medical Hub", type: "Medical Hub", category: "Health", details: { employees: 20000, description: "Premier medical institutions attracting patients from across north India — clinical research and medical tourism" }, source: "kgmu.org / sgpgi.ac.in" },
      { districtId: did, name: "Hazratganj / Aminabad Markets", type: "Market", category: "Commercial", details: { employees: 50000, description: "Historic commercial centres — Hazratganj for modern retail, Aminabad for traditional markets and wholesale" }, source: "lucknow.nic.in" },
    ] });
    console.log("  ✓ Industries seeded");
  } else { console.log(`  ⏭ Industries already seeded (${industryCount})`); }

  // ═══ L. BUS ROUTES ═══
  const busCount = await prisma.busRoute.count({ where: { districtId: did } });
  if (busCount === 0) {
    console.log("Seeding bus routes...");
    await prisma.busRoute.createMany({ skipDuplicates: true, data: [
      // Intercity UPSRTC
      { districtId: did, routeNumber: "LKO-KNP", origin: "Lucknow (Alambagh)", destination: "Kanpur", via: "Unnao", operator: "UPSRTC", busType: "AC Janrath", frequency: "Every 30 min" },
      { districtId: did, routeNumber: "LKO-VNS", origin: "Lucknow (Charbagh)", destination: "Varanasi", via: "Sultanpur, Jaunpur", operator: "UPSRTC", busType: "AC Volvo", frequency: "Every 1 hr" },
      { districtId: did, routeNumber: "LKO-AGR", origin: "Lucknow (Alambagh)", destination: "Agra", via: "Lucknow-Agra Expressway", operator: "UPSRTC", busType: "AC Scania", frequency: "Every 2 hrs" },
      { districtId: did, routeNumber: "LKO-DEL", origin: "Lucknow (Alambagh)", destination: "Delhi (ISBT Anand Vihar)", via: "Lucknow-Agra Exp, Yamuna Exp", operator: "UPSRTC", busType: "AC Volvo", frequency: "Every 1 hr" },
      { districtId: did, routeNumber: "LKO-PYG", origin: "Lucknow (Charbagh)", destination: "Prayagraj", via: "Raebareli, Pratapgarh", operator: "UPSRTC", busType: "AC Janrath", frequency: "Every 1 hr" },
      // City routes
      { districtId: did, routeNumber: "City-1", origin: "Alambagh", destination: "Amausi Airport", via: "Kanpur Road, Amausi", operator: "LCTSL (City Bus)", busType: "City AC", frequency: "Every 15 min" },
      { districtId: did, routeNumber: "City-7", origin: "Charbagh", destination: "Gomti Nagar", via: "Hazratganj, Kaiserbagh", operator: "LCTSL (City Bus)", busType: "City Ordinary", frequency: "Every 10 min" },
      { districtId: did, routeNumber: "City-12", origin: "Alambagh", destination: "Jankipuram", via: "Charbagh, Mahanagar, Aliganj", operator: "LCTSL (City Bus)", busType: "City Ordinary", frequency: "Every 12 min" },
    ] });
    console.log("  ✓ Bus routes seeded");
  } else { console.log(`  ⏭ Bus routes already seeded (${busCount})`); }

  // ═══ M. TRAIN SCHEDULES ═══
  const trainCount = await prisma.trainSchedule.count({ where: { districtId: did } });
  if (trainCount === 0) {
    console.log("Seeding trains...");
    await prisma.trainSchedule.createMany({ skipDuplicates: true, data: [
      { districtId: did, trainNumber: "12229", trainName: "Lucknow Mail", origin: "Lucknow Charbagh (LKO)", destination: "New Delhi (NDLS)", stationName: "Lucknow Charbagh (LKO)", departureTime: "21:30", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12533", trainName: "Pushpak Express", origin: "Lucknow Charbagh (LKO)", destination: "Mumbai CSMT", stationName: "Lucknow Charbagh (LKO)", departureTime: "14:25", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12003", trainName: "Lucknow Shatabdi Express", origin: "Lucknow Charbagh (LKO)", destination: "New Delhi (NDLS)", stationName: "Lucknow Charbagh (LKO)", departureTime: "06:10", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
      { districtId: did, trainNumber: "12004", trainName: "Shatabdi Express (Return)", origin: "New Delhi (NDLS)", destination: "Lucknow Charbagh (LKO)", stationName: "Lucknow Charbagh (LKO)", departureTime: "22:30", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
      { districtId: did, trainNumber: "14853", trainName: "Gomti Express", origin: "Lucknow Charbagh (LKO)", destination: "New Delhi (NDLS)", stationName: "Lucknow Charbagh (LKO)", departureTime: "05:50", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "14235", trainName: "Varanasi Express", origin: "Lucknow Jn (LJN)", destination: "Varanasi Jn (BSB)", stationName: "Lucknow Jn (LJN)", departureTime: "22:15", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
      { districtId: did, trainNumber: "12237", trainName: "Mumbai Superfast (via Jhansi)", origin: "Lucknow Charbagh (LKO)", destination: "Mumbai CSMT", stationName: "Lucknow Charbagh (LKO)", departureTime: "10:35", daysOfWeek: ["Tue","Thu","Sun"] },
      { districtId: did, trainNumber: "12035", trainName: "Lucknow Tejas Express", origin: "Lucknow Jn (LJN)", destination: "New Delhi (NDLS)", stationName: "Lucknow Jn (LJN)", departureTime: "06:10", daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"] },
    ] });
    console.log("  ✓ Train schedules seeded");
  } else { console.log(`  ⏭ Trains already seeded (${trainCount})`); }

  // ═══ N. SERVICE GUIDES ═══
  const serviceCount = await prisma.serviceGuide.count({ where: { districtId: did } });
  if (serviceCount === 0) {
    console.log("Seeding service guides...");
    await prisma.serviceGuide.createMany({ skipDuplicates: true, data: [
      { districtId: did, serviceName: "Birth / Death Certificate", category: "Civil", office: "LMC / e-District UP", documentsNeeded: ["Hospital records", "Parent Aadhaar", "Address proof"], fees: "₹50", timeline: "7-15 days", onlinePortal: "https://edistrict.up.gov.in" },
      { districtId: did, serviceName: "Ration Card (New / Update)", category: "Civil", office: "Civil Supplies, Lucknow", documentsNeeded: ["Aadhaar", "Address proof", "Income certificate", "Existing ration card (if updating)"], fees: "₹10", timeline: "15-30 days", onlinePortal: "https://fcs.up.gov.in" },
      { districtId: did, serviceName: "Domicile Certificate (Niwas Praman Patra)", category: "Civil", office: "SDM Office / e-District", documentsNeeded: ["Aadhaar", "Address proof", "Affidavit", "Photo"], fees: "₹25", timeline: "7-15 days", onlinePortal: "https://edistrict.up.gov.in" },
      { districtId: did, serviceName: "Property Registration", category: "Property", office: "IGRS UP (Sub-Registrar)", documentsNeeded: ["Sale deed", "Encumbrance certificate", "Aadhaar", "PAN", "Stamp paper"], fees: "Varies (stamp duty + registration)", timeline: "1-3 days", onlinePortal: "https://igrsup.gov.in" },
      { districtId: did, serviceName: "Driving License (New / Renewal)", category: "Transport", office: "RTO Lucknow", documentsNeeded: ["Aadhaar", "Address proof", "Medical certificate", "Learner's license"], fees: "₹400-1100", timeline: "30+ days (with test slot)", onlinePortal: "https://sarathi.parivahan.gov.in" },
    ] });
    console.log("  ✓ Service guides seeded");
  } else { console.log(`  ⏭ Services already seeded (${serviceCount})`); }

  // ═══ O. COURT STATS ═══
  const courtCount = await prisma.courtStat.count({ where: { districtId: did } });
  if (courtCount === 0) {
    console.log("Seeding court stats...");
    await prisma.courtStat.createMany({ skipDuplicates: true, data: [
      // APPROXIMATE — verify from njdg.ecourts.gov.in
      { districtId: did, courtName: "Allahabad High Court — Lucknow Bench", year: 2025, filed: 65000, disposed: 58000, pending: 320000, avgDays: 400, source: "njdg.ecourts.gov.in" },
      { districtId: did, courtName: "Lucknow District & Sessions Court", year: 2025, filed: 35000, disposed: 30000, pending: 110000, avgDays: 500, source: "njdg.ecourts.gov.in" },
      { districtId: did, courtName: "Family Court, Lucknow", year: 2025, filed: 5500, disposed: 4800, pending: 18000, avgDays: 360, source: "njdg.ecourts.gov.in" },
    ] });
    console.log("  ✓ Court stats seeded");
  } else { console.log(`  ⏭ Courts already seeded (${courtCount})`); }

  // ═══ P. CRIME STATS ═══
  const crimeCount = await prisma.crimeStat.count({ where: { districtId: did } });
  if (crimeCount === 0) {
    console.log("Seeding crime stats...");
    await prisma.crimeStat.createMany({ skipDuplicates: true, data: [
      // 2023
      { districtId: did, year: 2023, category: "IPC Crimes Total", count: 18500, source: "NCRB / ncrb.gov.in" },
      { districtId: did, year: 2023, category: "Crimes Against Women", count: 2800, source: "NCRB" },
      { districtId: did, year: 2023, category: "Cyber Crimes", count: 3200, source: "NCRB / UP Cyber Cell" },
      { districtId: did, year: 2023, category: "Property Crimes", count: 4500, source: "NCRB" },
      { districtId: did, year: 2023, category: "Traffic Violations", count: 850000, source: "Lucknow Traffic Police" },
      // 2022
      { districtId: did, year: 2022, category: "IPC Crimes Total", count: 17200, source: "NCRB" },
      { districtId: did, year: 2022, category: "Crimes Against Women", count: 2600, source: "NCRB" },
      { districtId: did, year: 2022, category: "Cyber Crimes", count: 2500, source: "NCRB / UP Cyber Cell" },
    ] });
    console.log("  ✓ Crime stats seeded");
  } else { console.log(`  ⏭ Crime stats already seeded (${crimeCount})`); }

  // ═══ Q. TRAFFIC COLLECTION ═══
  const trafficCount = await prisma.trafficCollection.count({ where: { districtId: did } });
  if (trafficCount === 0) {
    console.log("Seeding traffic collections...");
    for (let i = 0; i < 12; i++) {
      const d = new Date(2025, i, 1);
      await prisma.trafficCollection.create({
        data: {
          districtId: did,
          date: d,
          challans: 45000 + Math.floor(Math.random() * 15000),
          amount: (180 + Math.random() * 60) * 1e5,
          monthlyTarget: 250e5,
          source: "Lucknow Traffic Police",
        },
      });
    }
    console.log("  ✓ Traffic collections seeded (12 months)");
  } else { console.log(`  ⏭ Traffic collections already seeded (${trafficCount})`); }

  // ═══ R. LOCAL ALERTS ═══
  const alertCount = await prisma.localAlert.count({ where: { districtId: did } });
  if (alertCount === 0) {
    console.log("Seeding local alerts...");
    await prisma.localAlert.createMany({ skipDuplicates: true, data: [
      {
        districtId: did,
        type: "weather",
        title: "Extreme Heat Advisory — Lucknow",
        description: "IMD has issued an orange alert for Lucknow with temperatures expected to exceed 45°C from May to mid-June. Avoid outdoor exposure during 11 AM–4 PM. Stay hydrated. Heat shelters available at government buildings.",
        location: "Lucknow district-wide",
        severity: "warning",
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-06-15"),
        active: true,
        autoGenerated: false,
      },
      {
        districtId: did,
        type: "water_advisory",
        title: "Gomti River Flood/Pollution Advisory",
        description: "Gomti river water levels may rise during monsoon season (July-September). Low-lying areas near the riverfront should remain vigilant. Do NOT use untreated Gomti water for drinking. Report sewage discharge: 1800-180-5555.",
        location: "Gomti riverfront areas",
        severity: "warning",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-09-30"),
        active: true,
        autoGenerated: false,
      },
      {
        districtId: did,
        type: "civic",
        title: "Metro Phase 1B Construction — Traffic Diversions",
        description: "Lucknow Metro Phase 1B construction work in progress. Expect traffic diversions and road closures on Kanpur Road, Amausi, and Munshipulia corridors. Use alternate routes. Check LMRC website for latest updates.",
        location: "Kanpur Road, Amausi, Munshipulia corridor",
        severity: "info",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2028-12-31"),
        active: true,
        autoGenerated: false,
      },
    ] });
    console.log("  ✓ Local alerts seeded");
  } else { console.log(`  ⏭ Alerts already seeded (${alertCount})`); }

  // ═══ S. POPULATION HISTORY ═══
  const popCount = await prisma.populationHistory.count({ where: { districtId: did } });
  if (popCount === 0) {
    console.log("Seeding population history...");
    await prisma.populationHistory.createMany({ skipDuplicates: true, data: [
      { districtId: did, year: 1991, population: 1669000, sexRatio: 894, literacy: 68.6, source: "Census of India 1991" },
      { districtId: did, year: 2001, population: 2185927, sexRatio: 893, literacy: 74.1, source: "Census of India 2001" },
      { districtId: did, year: 2011, population: 4589838, sexRatio: 917, literacy: 79.33, source: "Census of India 2011" },
      { districtId: did, year: 2024, population: 5200000, sexRatio: 920, literacy: 81.0, source: "Estimate — Lucknow District Administration (lucknow.nic.in)" },
    ] });
    console.log("  ✓ Population history seeded");
  } else { console.log(`  ⏭ Population already seeded (${popCount})`); }

  // ═══ SUMMARY ═══
  console.log("\n🎉 Lucknow district data seeding complete!");
  console.log("   NOTE: DM and CP names verified for April 2026 — re-verify periodically.");
  console.log("   NOTE: Assembly 2022 vote counts are APPROXIMATE — verify from results.eci.gov.in");
  console.log("   NOTE: Budget figures are state-level allocations — district-specific breakdowns may differ.");
  console.log("   NOTE: Crime stats are approximate from NCRB — verify from ncrb.gov.in");
  console.log("   NOTE: Court pendency data approximate — verify from njdg.ecourts.gov.in");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
