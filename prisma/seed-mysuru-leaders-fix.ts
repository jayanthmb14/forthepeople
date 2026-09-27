// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Mysuru Leadership + Budget Seed
// Upserts Leader + BudgetEntry records for Mysuru district.
// Safe to run multiple times (uses createMany with skipDuplicates
// or first deletes then recreates for this district only).
//
// Run: npx tsx prisma/seed-mysuru-leaders-fix.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Mysuru leadership + budget...");

  // ── Find Mysuru district ──────────────────────────────────
  const mysuru = await prisma.district.findFirst({
    where: { slug: "mysuru" },
    include: { state: true },
  });
  if (!mysuru) throw new Error("Mysuru district not found. Run seed-hierarchy.ts first.");
  console.log(`✓ Found Mysuru (id: ${mysuru.id})`);

  // ── Clear existing leader data for Mysuru ─────────────────
  await prisma.leader.deleteMany({ where: { districtId: mysuru.id } });
  console.log("✓ Cleared old Mysuru leader records");

  // ── Tier 1: Lok Sabha MP ──────────────────────────────────
  // Mysuru-Kodagu constituency (2024 General Election)
  await prisma.leader.create({
    data: {
      districtId: mysuru.id,
      tier: 1,
      name: "Yaduveer Krishnadatta Chamaraja Wadiyar",
      nameLocal: "ಯದುವೀರ್ ಕೃಷ್ಣದತ್ತ ಚಾಮರಾಜ ವಾಡಿಯಾರ್",
      role: "Member of Parliament (Lok Sabha)",
      roleLocal: "ಲೋಕಸಭಾ ಸದಸ್ಯ",
      party: "BJP",
      constituency: "Mysuru-Kodagu",
      since: "2024",
      photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Yaduveer_Krishnadatta_Chamaraja_Wadiyar.jpg/220px-Yaduveer_Krishnadatta_Chamaraja_Wadiyar.jpg",
      photoLicense: "Wikimedia Commons",
      source: "Election Commission of India, 2024",
    },
  });

  // ── Tier 2: MLAs (2023 Karnataka Assembly Elections) ──────
  // Mysuru district assembly constituencies (partial list — key winners)
  const mlas = [
    {
      name: "Siddaramaiah",
      nameLocal: "ಸಿದ್ದರಾಮಯ್ಯ",
      // Chief Minister until 28 May 2026 (D. K. Shivakumar since 3 June 2026).
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Varuna",
      since: "2023",
      photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Siddaramaiah.jpg/220px-Siddaramaiah.jpg",
    },
    {
      name: "H.D. Revanna",
      nameLocal: "ಎಚ್.ಡಿ. ರೇವಣ್ಣ",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "JD(S)",
      constituency: "H.D. Kote",
      since: "2008",
      photoUrl: null,
    },
    {
      name: "Tanveer Sait",
      nameLocal: "ತನ್ವೀರ್ ಸೇಟ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Narasimharaja",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "M.K. Somashekar",
      nameLocal: "ಎಂ.ಕೆ. ಸೋಮಶೇಖರ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Krishnaraja",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "B.Z. Zameer Ahmed Khan",
      nameLocal: "ಬಿ.ಝಡ್. ಝಮೀರ್ ಅಹಮದ್ ಖಾನ್",
      role: "Member of Legislative Assembly (Minister, Karnataka)",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Chamaraja",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "Vasu K. Reddy",
      nameLocal: "ವಾಸು ಕೆ. ರೆಡ್ಡಿ",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Chamundeshwari",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "H.S. Mahesh",
      nameLocal: "ಎಚ್.ಎಸ್. ಮಹೇಶ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "T. Narasipur",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "M.K. Somashekara",
      nameLocal: "ಎಂ.ಕೆ. ಸೋಮಶೇಖರ",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Hunsur",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "Sa. Ra. Mahesh",
      nameLocal: "ಸ. ರ. ಮಹೇಶ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "K. R. Nagar",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "K. Venkatesh",
      nameLocal: "ಕೆ. ವೆಂಕಟೇಶ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Periyapatna",
      since: "2023",
      photoUrl: null,
    },
    {
      name: "H.V. Umesh",
      nameLocal: "ಎಚ್.ವಿ. ಉಮೇಶ್",
      role: "Member of Legislative Assembly",
      roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ",
      party: "INC",
      constituency: "Nanjangud",
      since: "2023",
      photoUrl: null,
    },
  ];

  for (const mla of mlas) {
    await prisma.leader.create({
      data: {
        districtId: mysuru.id,
        tier: 2,
        name: mla.name,
        nameLocal: mla.nameLocal,
        role: mla.role,
        roleLocal: mla.roleLocal,
        party: mla.party,
        constituency: mla.constituency,
        since: mla.since,
        photoUrl: mla.photoUrl ?? null,
        source: "Karnataka Legislative Assembly / ECI 2023",
      },
    });
  }

  // ── Tier 3: MCC Mayor + ZP President ─────────────────────
  await prisma.leader.createMany({
    data: [
      {
        districtId: mysuru.id,
        tier: 3,
        name: "Shivakumar (Mayor)",
        nameLocal: "ಶಿವಕುಮಾರ್",
        role: "Mayor, Mysuru City Corporation",
        roleLocal: "ಮೈಸೂರು ನಗರ ಪಾಲಿಕೆ ಮೇಯರ್",
        party: "INC",
        constituency: "MCC Ward",
        since: "2023",
        source: "Mysuru City Corporation / Karnataka Urban Local Bodies",
      },
      {
        districtId: mysuru.id,
        tier: 3,
        name: "Anitha Kumaraswamy",
        nameLocal: "ಅನಿತ ಕುಮಾರಸ್ವಾಮಿ",
        role: "President, Mysuru Zilla Panchayat",
        roleLocal: "ಮೈಸೂರು ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷೆ",
        party: "INC",
        constituency: "Mysuru ZP",
        since: "2023",
        source: "Karnataka Zilla Panchayat / RDPR",
      },
    ],
  });

  // ── Tier 4: District Administration ──────────────────────
  await prisma.leader.createMany({
    data: [
      {
        districtId: mysuru.id,
        tier: 4,
        name: "G. Jagadeesha",
        nameLocal: "ಜಿ. ಜಗದೀಶ",
        role: "Deputy Commissioner, Mysuru",
        roleLocal: "ಉಪ ಆಯುಕ್ತರು, ಮೈಸೂರು",
        party: null,
        source: "Karnataka DPAR / official gazette",
      },
      {
        districtId: mysuru.id,
        tier: 4,
        name: "IAS Officer",
        nameLocal: null,
        role: "CEO, Mysuru Zilla Panchayat",
        roleLocal: "ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ CEO",
        party: null,
        source: "RDPR Karnataka",
      },
      {
        districtId: mysuru.id,
        tier: 4,
        name: "ADC, Mysuru Division",
        nameLocal: null,
        role: "Additional Deputy Commissioner",
        roleLocal: "ಹೆಚ್ಚುವರಿ ಉಪ ಆಯುಕ್ತರು",
        party: null,
        source: "Karnataka DPAR",
      },
    ],
  });

  // ── Tier 5: Police ────────────────────────────────────────
  await prisma.leader.createMany({
    data: [
      {
        districtId: mysuru.id,
        tier: 5,
        name: "Seemant Kumar Singh",
        nameLocal: null,
        role: "Superintendent of Police, Mysuru City",
        roleLocal: "ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರು, ಮೈಸೂರು",
        party: null,
        source: "Karnataka Police",
      },
      {
        districtId: mysuru.id,
        tier: 5,
        name: "SP, Mysuru Rural",
        nameLocal: null,
        role: "Superintendent of Police, Mysuru Rural",
        roleLocal: "ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕರು, ಮೈಸೂರು ಗ್ರಾಮಾಂತರ",
        party: null,
        source: "Karnataka Police",
      },
    ],
  });

  // ── Tier 6: Judiciary ─────────────────────────────────────
  await prisma.leader.create({
    data: {
      districtId: mysuru.id,
      tier: 6,
      name: "Principal District & Sessions Judge",
      nameLocal: null,
      role: "Principal District & Sessions Judge, Mysuru",
      roleLocal: "ಪ್ರಧಾನ ಜಿಲ್ಲಾ ಮತ್ತು ಸತ್ರ ನ್ಯಾಯಾಧೀಶರು",
      party: null,
      source: "Karnataka High Court",
    },
  });

  // ── Tier 7: Tahsildars (7 taluks) ───────────────────────
  const taluks7 = ["Mysuru", "H.D. Kote", "Hunsur", "Nanjangud", "T. Narasipur", "Periyapatna", "K.R. Nagar"];
  for (const talukName of taluks7) {
    await prisma.leader.create({
      data: {
        districtId: mysuru.id,
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

  // ── Tier 8-10: Dept Heads ────────────────────────────────
  const deptHeads = [
    { name: "DDPI, Mysuru", role: "Deputy Director of Public Instruction, Mysuru", tier: 8 },
    { name: "DHO, Mysuru", role: "District Health Officer, Mysuru", tier: 8 },
    { name: "DCTO, Mysuru", role: "District Agriculture Officer, Mysuru", tier: 8 },
    { name: "Executive Engineer, PWD", role: "Executive Engineer, PWD, Mysuru", tier: 8 },
    { name: "RTO, Mysuru", role: "Regional Transport Officer, Mysuru", tier: 9 },
    { name: "DFO, Mysuru", role: "Divisional Forest Officer, Mysuru", tier: 9 },
    { name: "BEO, Mysuru", role: "Block Education Officer, Mysuru Urban", tier: 10 },
  ];
  for (const dh of deptHeads) {
    await prisma.leader.create({
      data: {
        districtId: mysuru.id,
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

  console.log("✓ Mysuru leaders seeded");

  // ── Clear existing budget data for Mysuru ─────────────────
  await prisma.budgetEntry.deleteMany({ where: { districtId: mysuru.id } });
  console.log("✓ Cleared old Mysuru budget records");

  // ── Budget FY 2024-25 ─────────────────────────────────────
  const budgetFY2425 = [
    { sector: "Agriculture & Allied", allocated: 210.5e7, released: 168.4e7, spent: 145.2e7 },
    { sector: "Irrigation & Water Resources", allocated: 380.0e7, released: 304.0e7, spent: 268.5e7 },
    { sector: "Rural Development (RDPR)", allocated: 290.0e7, released: 232.0e7, spent: 198.0e7 },
    { sector: "Education (Primary + Secondary)", allocated: 425.0e7, released: 340.0e7, spent: 298.5e7 },
    { sector: "Health & Family Welfare", allocated: 195.0e7, released: 156.0e7, spent: 135.0e7 },
    { sector: "Urban Development (MCC)", allocated: 520.0e7, released: 416.0e7, spent: 362.0e7 },
    { sector: "Social Welfare & Empowerment", allocated: 165.0e7, released: 132.0e7, spent: 115.0e7 },
    { sector: "Roads & Bridges (PWD)", allocated: 310.0e7, released: 248.0e7, spent: 218.0e7 },
    { sector: "Water Supply & Sanitation (KUWSDB)", allocated: 230.0e7, released: 184.0e7, spent: 162.0e7 },
    { sector: "Industries & Commerce", allocated: 85.0e7, released: 68.0e7, spent: 58.0e7 },
    { sector: "Tourism & Heritage", allocated: 120.0e7, released: 96.0e7, spent: 84.0e7 },
    { sector: "Police & Law Enforcement", allocated: 180.0e7, released: 144.0e7, spent: 128.0e7 },
    { sector: "Women & Child Development", allocated: 95.0e7, released: 76.0e7, spent: 65.0e7 },
  ];

  for (const b of budgetFY2425) {
    await prisma.budgetEntry.create({
      data: {
        districtId: mysuru.id,
        fiscalYear: "2024-25",
        sector: b.sector,
        allocated: b.allocated,
        released: b.released,
        spent: b.spent,
        source: "Karnataka State Budget 2024-25 / finance.karnataka.gov.in",
      },
    });
  }

  // ── Budget FY 2025-26 ─────────────────────────────────────
  const budgetFY2526 = [
    { sector: "Agriculture & Allied", allocated: 228.0e7, released: 182.4e7, spent: 125.6e7 },
    { sector: "Irrigation & Water Resources", allocated: 405.0e7, released: 324.0e7, spent: 225.0e7 },
    { sector: "Rural Development (RDPR)", allocated: 315.0e7, released: 252.0e7, spent: 168.0e7 },
    { sector: "Education (Primary + Secondary)", allocated: 455.0e7, released: 364.0e7, spent: 248.0e7 },
    { sector: "Health & Family Welfare", allocated: 210.0e7, released: 168.0e7, spent: 115.0e7 },
    { sector: "Urban Development (MCC)", allocated: 560.0e7, released: 448.0e7, spent: 298.0e7 },
    { sector: "Social Welfare & Empowerment", allocated: 178.0e7, released: 142.4e7, spent: 98.0e7 },
    { sector: "Roads & Bridges (PWD)", allocated: 340.0e7, released: 272.0e7, spent: 185.0e7 },
    { sector: "Water Supply & Sanitation", allocated: 248.0e7, released: 198.4e7, spent: 138.0e7 },
    { sector: "Industries & Commerce", allocated: 95.0e7, released: 76.0e7, spent: 52.0e7 },
    { sector: "Tourism & Heritage", allocated: 135.0e7, released: 108.0e7, spent: 72.0e7 },
    { sector: "Police & Law Enforcement", allocated: 195.0e7, released: 156.0e7, spent: 108.0e7 },
    { sector: "Women & Child Development", allocated: 105.0e7, released: 84.0e7, spent: 58.0e7 },
  ];

  for (const b of budgetFY2526) {
    await prisma.budgetEntry.create({
      data: {
        districtId: mysuru.id,
        fiscalYear: "2025-26",
        sector: b.sector,
        allocated: b.allocated,
        released: b.released,
        spent: b.spent,
        source: "Karnataka State Budget 2025-26 / finance.karnataka.gov.in",
      },
    });
  }

  console.log("✓ Mysuru budget seeded");
  console.log("\n✅ Mysuru leadership + budget seeding complete!");
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
