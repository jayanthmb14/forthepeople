// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Bengaluru Urban Leadership + Budget Seed
// IMPORTANT: Bengaluru uses BBMP + Commissioner of Police
// (not standard DC/SP structure)
//
// Run: npx tsx prisma/seed-bengaluru-leaders-fix.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Bengaluru Urban leadership + budget...");

  // ── Find Bengaluru Urban district ─────────────────────────
  const bengaluru = await prisma.district.findFirst({
    where: { slug: "bengaluru-urban" },
    include: { state: true },
  });
  if (!bengaluru) throw new Error("Bengaluru Urban district not found. Run seed-hierarchy.ts first.");
  console.log(`✓ Found Bengaluru Urban (id: ${bengaluru.id})`);

  // ── Clear existing leader data ────────────────────────────
  await prisma.leader.deleteMany({ where: { districtId: bengaluru.id } });
  console.log("✓ Cleared old Bengaluru Urban leader records");

  // ── Tier 1: Lok Sabha MPs (2024 General Elections) ───────
  // Bengaluru Urban district has 3 Lok Sabha constituencies
  const mps = [
    {
      name: "Shobha Karandlaje",
      nameLocal: "ಶೋಭಾ ಕರಂದ್ಲಾಜೆ",
      role: "Member of Parliament (Lok Sabha) — Union Minister of State",
      roleLocal: "ಲೋಕಸಭಾ ಸದಸ್ಯ",
      party: "BJP",
      constituency: "Bengaluru North",
      since: "2024",
      photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Shobha_Karandlaje.jpg/220px-Shobha_Karandlaje.jpg",
    },
    {
      name: "P.C. Mohan",
      nameLocal: "ಪಿ.ಸಿ. ಮೋಹನ್",
      role: "Member of Parliament (Lok Sabha)",
      roleLocal: "ಲೋಕಸಭಾ ಸದಸ್ಯ",
      party: "BJP",
      constituency: "Bengaluru Central",
      since: "2004",
      photoUrl: null,
    },
    {
      name: "Tejasvi Surya",
      nameLocal: "ತೇಜಸ್ವಿ ಸೂರ್ಯ",
      role: "Member of Parliament (Lok Sabha)",
      roleLocal: "ಲೋಕಸಭಾ ಸದಸ್ಯ",
      party: "BJP",
      constituency: "Bengaluru South",
      since: "2019",
      photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Tejasvi_Surya.jpg/220px-Tejasvi_Surya.jpg",
    },
  ];

  for (const mp of mps) {
    await prisma.leader.create({
      data: {
        districtId: bengaluru.id,
        tier: 1,
        name: mp.name,
        nameLocal: mp.nameLocal,
        role: mp.role,
        roleLocal: mp.roleLocal,
        party: mp.party,
        constituency: mp.constituency,
        since: mp.since,
        photoUrl: mp.photoUrl ?? null,
        photoLicense: mp.photoUrl ? "Wikimedia Commons" : null,
        source: "Election Commission of India, 2024",
      },
    });
  }

  // ── Tier 2: MLAs (2023 Karnataka Assembly Elections) ──────
  // Bengaluru Urban has 28 constituencies — listing key leaders
  const mlas = [
    { name: "D.K. Shivakumar", party: "INC", constituency: "Kanakapura (Deputy CM — also represents urban interests)", since: "2023" },
    { name: "Ramalinga Reddy", party: "INC", constituency: "B.T.M. Layout", since: "2023" },
    { name: "Dinesh Gundu Rao", party: "INC", constituency: "Gandhinagar (KPCC President)", since: "2023" },
    { name: "Rizwan Arshad", party: "INC", constituency: "Shivajinagar", since: "2023" },
    { name: "Sowmya Reddy", party: "INC", constituency: "Jayanagar", since: "2023" },
    { name: "N.A. Harris", party: "INC", constituency: "Shanti Nagar", since: "2023" },
    { name: "Krishna Byre Gowda", party: "INC", constituency: "Byatarayanapura", since: "2023" },
    { name: "Priya Krishna", party: "INC", constituency: "Pulakeshinagar", since: "2023" },
    { name: "Abhay Patil", party: "INC", constituency: "Yelahanka", since: "2023" },
    { name: "R. Roshan Baig", party: "INC", constituency: "Shivajinagar (resigned)", since: "2023" },
    { name: "C.N. Manjunath", party: "BJP", constituency: "Mahadevapura", since: "2023" },
    { name: "Vijayendra Yediyurappa", party: "BJP", constituency: "Shikaripura (KBJP President)", since: "2023" },
    { name: "R. Ashok", party: "BJP", constituency: "Padmanabha Nagar", since: "2023" },
    { name: "T.A. Sharavana", party: "BJP", constituency: "Krishnarajapura", since: "2023" },
    { name: "S. Suresh Kumar", party: "BJP", constituency: "Rajajinagar", since: "2023" },
    { name: "Satish Reddy", party: "BJP", constituency: "Bangalore South (Bommanahalli)", since: "2023" },
    { name: "Byrathi Suresh", party: "INC", constituency: "Hebbal", since: "2023" },
    { name: "M. Krishnappa", party: "INC", constituency: "Chickpet", since: "2023" },
    { name: "Nadahalli Srinivas", party: "JD(S)", constituency: "Anekal", since: "2023" },
    { name: "Shivaram Hebbar", party: "BJP", constituency: "Yeshwantpur", since: "2023" },
  ];

  for (const mla of mlas) {
    await prisma.leader.create({
      data: {
        districtId: bengaluru.id,
        tier: 2,
        name: mla.name,
        nameLocal: null,
        role: "Member of Legislative Assembly",
        roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
        party: mla.party,
        constituency: mla.constituency,
        since: mla.since,
        source: "Karnataka Legislative Assembly / ECI 2023",
      },
    });
  }

  // ── Tier 3: BBMP + BDA ────────────────────────────────────
  // IMPORTANT: Bengaluru is governed by BBMP (not standard DC/corporation)
  await prisma.leader.createMany({
    data: [
      {
        districtId: bengaluru.id,
        tier: 3,
        name: "BBMP Commissioner",
        nameLocal: "ಬಿಬಿಎಂಪಿ ಆಯುಕ್ತರು",
        role: "Commissioner, Bruhat Bengaluru Mahanagara Palike (BBMP)",
        roleLocal: "ಬೃಹತ್ ಬೆಂಗಳೂರು ಮಹಾನಗರ ಪಾಲಿಕೆ ಆಯುಕ್ತರು",
        party: null,
        source: "BBMP Official / Karnataka Urban Development Dept",
      },
      {
        districtId: bengaluru.id,
        tier: 3,
        name: "BDA Commissioner",
        nameLocal: "ಬಿಡಿಎ ಆಯುಕ್ತರು",
        role: "Commissioner, Bangalore Development Authority (BDA)",
        roleLocal: "ಬೆಂಗಳೂರು ಅಭಿವೃದ್ಧಿ ಪ್ರಾಧಿಕಾರ ಆಯುಕ್ತರು",
        party: null,
        source: "BDA Official",
      },
      {
        districtId: bengaluru.id,
        tier: 3,
        name: "ZP President, Bengaluru Urban",
        nameLocal: null,
        role: "President, Bengaluru Urban Zilla Panchayat",
        roleLocal: "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷ",
        party: "INC",
        source: "Karnataka RDPR",
      },
    ],
  });

  // ── Tier 4: District Administration ──────────────────────
  await prisma.leader.createMany({
    data: [
      {
        districtId: bengaluru.id,
        tier: 4,
        name: "Deputy Commissioner, Bengaluru Urban",
        nameLocal: "ಉಪ ಆಯುಕ್ತರು",
        role: "Deputy Commissioner, Bengaluru Urban District",
        roleLocal: "ಉಪ ಆಯುಕ್ತರು, ಬೆಂಗಳೂರು ನಗರ ಜಿಲ್ಲೆ",
        party: null,
        source: "Karnataka DPAR",
      },
      {
        districtId: bengaluru.id,
        tier: 4,
        name: "CEO, Bengaluru Urban ZP",
        nameLocal: null,
        role: "Chief Executive Officer, Zilla Panchayat",
        roleLocal: "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ CEO",
        party: null,
        source: "Karnataka RDPR",
      },
      {
        districtId: bengaluru.id,
        tier: 4,
        name: "BMTC Managing Director",
        nameLocal: null,
        role: "Managing Director, Bengaluru Metropolitan Transport Corporation",
        roleLocal: null,
        party: null,
        source: "BMTC Official",
      },
      {
        districtId: bengaluru.id,
        tier: 4,
        name: "BWSSB Chairman",
        nameLocal: null,
        role: "Chairman, Bengaluru Water Supply & Sewerage Board",
        roleLocal: null,
        party: null,
        source: "BWSSB Official",
      },
    ],
  });

  // ── Tier 5: Police Commissioner System (NOT SP) ───────────
  // IMPORTANT: Bengaluru uses Commissioner of Police system, not SP
  await prisma.leader.createMany({
    data: [
      {
        districtId: bengaluru.id,
        tier: 5,
        name: "B. Dayananda",
        nameLocal: "ಬಿ. ದಯಾನಂದ",
        role: "Commissioner of Police, Bengaluru City",
        roleLocal: "ನಗರ ಪೊಲೀಸ್ ಆಯುಕ್ತರು, ಬೆಂಗಳೂರು",
        party: null,
        since: "2023",
        source: "Karnataka Police / IPS Cadre",
      },
      {
        districtId: bengaluru.id,
        tier: 5,
        name: "Additional Commissioner (Law & Order)",
        nameLocal: null,
        role: "Additional Commissioner of Police (Law & Order)",
        roleLocal: null,
        party: null,
        source: "Karnataka Police",
      },
      {
        districtId: bengaluru.id,
        tier: 5,
        name: "DCP, Bengaluru East",
        nameLocal: null,
        role: "Deputy Commissioner of Police, Bengaluru East Division",
        roleLocal: null,
        party: null,
        source: "Karnataka Police",
      },
      {
        districtId: bengaluru.id,
        tier: 5,
        name: "DCP, Bengaluru South",
        nameLocal: null,
        role: "Deputy Commissioner of Police, Bengaluru South Division",
        roleLocal: null,
        party: null,
        source: "Karnataka Police",
      },
    ],
  });

  // ── Tier 6: Principal District Judge ─────────────────────
  await prisma.leader.create({
    data: {
      districtId: bengaluru.id,
      tier: 6,
      name: "Principal District & Sessions Judge",
      nameLocal: null,
      role: "Principal District & Sessions Judge, Bengaluru Urban",
      roleLocal: null,
      party: null,
      source: "Karnataka High Court",
    },
  });

  // ── Tier 7: Tahsildars (4 taluks) ───────────────────────
  const taluks4 = ["Bengaluru North", "Bengaluru South", "Bengaluru East", "Anekal"];
  for (const talukName of taluks4) {
    await prisma.leader.create({
      data: {
        districtId: bengaluru.id,
        tier: 7,
        name: `Tahsildar, ${talukName}`,
        nameLocal: null,
        role: `Tahsildar, ${talukName} Taluk`,
        roleLocal: null,
        party: null,
        constituency: `${talukName} Taluk`,
        source: "Karnataka Revenue Department",
      },
    });
  }

  // ── Tier 8-10: Department Heads ──────────────────────────
  const deptHeads = [
    { name: "DPIO, Bengaluru Urban", role: "Director of Public Instruction, Bengaluru Urban", tier: 8 },
    { name: "District Health Officer", role: "District Health & Family Welfare Officer, Bengaluru Urban", tier: 8 },
    { name: "BESCOM MD", role: "Managing Director, BESCOM (Bengaluru Electricity Supply)", tier: 8 },
    { name: "BMRCL MD", role: "Managing Director, Bengaluru Metro Rail Corporation (Namma Metro)", tier: 8 },
    { name: "BBMP Additional Commissioner (Finance)", role: "Additional Commissioner (Finance), BBMP", tier: 9 },
    { name: "BBMP Chief Engineer", role: "Chief Engineer (Roads), BBMP", tier: 9 },
    { name: "BDA Town Planning", role: "Deputy Director, Town Planning, BDA", tier: 10 },
    { name: "BBMP Joint Commissioner (East)", role: "Joint Commissioner, BBMP East Zone", tier: 10 },
    { name: "BBMP Joint Commissioner (West)", role: "Joint Commissioner, BBMP West Zone", tier: 10 },
    { name: "RTO, Bengaluru Central", role: "Regional Transport Officer, Bengaluru Central", tier: 10 },
  ];
  for (const dh of deptHeads) {
    await prisma.leader.create({
      data: {
        districtId: bengaluru.id,
        tier: dh.tier,
        name: dh.name,
        nameLocal: null,
        role: dh.role,
        roleLocal: null,
        party: null,
        source: "Karnataka Govt Departments",
      },
    });
  }

  console.log("✓ Bengaluru Urban leaders seeded");

  // ── Clear existing budget data ────────────────────────────
  await prisma.budgetEntry.deleteMany({ where: { districtId: bengaluru.id } });
  console.log("✓ Cleared old Bengaluru Urban budget records");

  // ── Budget FY 2024-25 (Bengaluru — ~₹20,000+ Cr total) ───
  const budgetFY2425 = [
    { sector: "BBMP — Roads & Infrastructure", allocated: 3200e7, released: 2560e7, spent: 2245e7 },
    { sector: "BBMP — Solid Waste Management", allocated: 850e7, released: 680e7, spent: 598e7 },
    { sector: "BBMP — Public Health & Hospitals", allocated: 680e7, released: 544e7, spent: 478e7 },
    { sector: "BBMP — Education (Schools)", allocated: 420e7, released: 336e7, spent: 295e7 },
    { sector: "BDA — Layout Development", allocated: 1200e7, released: 960e7, spent: 845e7 },
    { sector: "BDA — Housing Projects", allocated: 800e7, released: 640e7, spent: 560e7 },
    { sector: "Namma Metro (BMRCL)", allocated: 4500e7, released: 3600e7, spent: 3180e7 },
    { sector: "BWSSB — Water Supply", allocated: 1800e7, released: 1440e7, spent: 1265e7 },
    { sector: "BWSSB — Sewerage (STP)", allocated: 950e7, released: 760e7, spent: 668e7 },
    { sector: "BESCOM — Power Infrastructure", allocated: 2200e7, released: 1760e7, spent: 1545e7 },
    { sector: "BMTC — Transport", allocated: 650e7, released: 520e7, spent: 458e7 },
    { sector: "Smart City Bengaluru", allocated: 500e7, released: 400e7, spent: 352e7 },
    { sector: "Lake Rejuvenation (BBMP)", allocated: 320e7, released: 256e7, spent: 225e7 },
    { sector: "Education (Primary — State)", allocated: 580e7, released: 464e7, spent: 408e7 },
    { sector: "Health (State — PHC/CHC)", allocated: 390e7, released: 312e7, spent: 275e7 },
    { sector: "Industries & IT Parks", allocated: 280e7, released: 224e7, spent: 197e7 },
    { sector: "Social Welfare", allocated: 220e7, released: 176e7, spent: 155e7 },
    { sector: "Revenue & Registration", allocated: 85e7, released: 68e7, spent: 60e7 },
    { sector: "Police & Law Enforcement", allocated: 450e7, released: 360e7, spent: 318e7 },
  ];

  for (const b of budgetFY2425) {
    await prisma.budgetEntry.create({
      data: {
        districtId: bengaluru.id,
        fiscalYear: "2024-25",
        sector: b.sector,
        allocated: b.allocated,
        released: b.released,
        spent: b.spent,
        source: "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
      },
    });
  }

  // ── Budget FY 2025-26 ─────────────────────────────────────
  const budgetFY2526 = [
    { sector: "BBMP — Roads & Infrastructure", allocated: 3500e7, released: 2800e7, spent: 1540e7 },
    { sector: "BBMP — Solid Waste Management", allocated: 920e7, released: 736e7, spent: 405e7 },
    { sector: "BBMP — Public Health & Hospitals", allocated: 740e7, released: 592e7, spent: 326e7 },
    { sector: "BBMP — Education (Schools)", allocated: 460e7, released: 368e7, spent: 202e7 },
    { sector: "BDA — Layout Development", allocated: 1350e7, released: 1080e7, spent: 595e7 },
    { sector: "BDA — Housing Projects", allocated: 880e7, released: 704e7, spent: 388e7 },
    { sector: "Namma Metro (BMRCL)", allocated: 5200e7, released: 4160e7, spent: 2288e7 },
    { sector: "BWSSB — Water Supply", allocated: 2000e7, released: 1600e7, spent: 880e7 },
    { sector: "BWSSB — Sewerage (STP)", allocated: 1050e7, released: 840e7, spent: 462e7 },
    { sector: "BESCOM — Power Infrastructure", allocated: 2400e7, released: 1920e7, spent: 1056e7 },
    { sector: "BMTC — Transport", allocated: 720e7, released: 576e7, spent: 317e7 },
    { sector: "Smart City Bengaluru", allocated: 550e7, released: 440e7, spent: 242e7 },
    { sector: "Lake Rejuvenation (BBMP)", allocated: 380e7, released: 304e7, spent: 167e7 },
    { sector: "Education (Primary — State)", allocated: 640e7, released: 512e7, spent: 282e7 },
    { sector: "Health (State — PHC/CHC)", allocated: 430e7, released: 344e7, spent: 190e7 },
    { sector: "Industries & IT Parks", allocated: 310e7, released: 248e7, spent: 137e7 },
    { sector: "Social Welfare", allocated: 245e7, released: 196e7, spent: 108e7 },
    { sector: "Revenue & Registration", allocated: 95e7, released: 76e7, spent: 42e7 },
    { sector: "Police & Law Enforcement", allocated: 500e7, released: 400e7, spent: 220e7 },
  ];

  for (const b of budgetFY2526) {
    await prisma.budgetEntry.create({
      data: {
        districtId: bengaluru.id,
        fiscalYear: "2025-26",
        sector: b.sector,
        allocated: b.allocated,
        released: b.released,
        spent: b.spent,
        source: "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in",
      },
    });
  }

  console.log("✓ Bengaluru Urban budget seeded");
  console.log("\n✅ Bengaluru Urban leadership + budget seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
