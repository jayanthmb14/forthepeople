// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Dima Hasao District Data Seed
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-dima-hasao-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Dima Hasao district data...\n");

  const state = await prisma.state.findUnique({ where: { slug: "assam" } });
  if (!state) throw new Error("Assam state not found — run seed-hierarchy.ts first");

  const district = await prisma.district.findFirst({
    where: { stateId: state.id, slug: "dima-hasao" },
  });
  if (!district) throw new Error("Dima Hasao district not found — run seed-hierarchy.ts first");

  const districtId = district.id;
  console.log(`✓ Found Dima Hasao district (id: ${districtId})`);

  // Clear existing Dima Hasao specific entries
  await prisma.leader.deleteMany({ where: { districtId } });
  await prisma.electionResult.deleteMany({ where: { districtId } });
  await prisma.infraProject.deleteMany({ where: { districtId } });
  await prisma.scheme.deleteMany({ where: { districtId } });
  await prisma.localIndustry.deleteMany({ where: { districtId } });
  await prisma.school.deleteMany({ where: { districtId } });
  console.log("✓ Cleared old entries for Dima Hasao");

  // ═══════════════════════════════════════════════════════════
  // A. LEADERSHIP
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding leadership...");
  await prisma.leader.createMany({
    data: [
      {
        districtId,
        name: "Amarsing Tisso",
        role: "Member of Parliament",
        tier: 1,
        party: "BJP",
        constituency: "Autonomous District ST",
        source: "ECI Lok Sabha 2024"
      },
      {
        districtId,
        name: "Rupali Langthasa",
        nameLocal: "ৰূপালী লাংথচা",
        role: "Member of Legislative Assembly (MLA)",
        tier: 2,
        party: "BJP",
        constituency: "Haflong ST",
        since: "2026",
        source: "Assam Assembly Election 2026"
      },
      {
        districtId,
        name: "Debolal Gorlosa",
        role: "Chief Executive Member (CEM), NCHAC",
        tier: 2,
        party: "BJP",
        constituency: "Autonomous Council",
        since: "2024",
        source: "NCHAC Gazette"
      },
      {
        districtId,
        name: "Gayatri Devidas Hyalinge, IAS",
        role: "District Commissioner",
        tier: 3,
        source: "Assam General Administration Department"
      },
      {
        districtId,
        name: "Ripunjoy Kakati, APS",
        role: "Superintendent of Police",
        tier: 3,
        source: "Assam Police Headquarters"
      }
    ]
  });
  console.log("  ✅ Seeding leaders completed");

  // ═══════════════════════════════════════════════════════════
  // B. ELECTION RESULTS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding election results...");
  await prisma.electionResult.createMany({
    data: [
      {
        districtId,
        year: 2026,
        electionType: "Assembly",
        constituency: "Haflong ST",
        winnerName: "Rupali Langthasa",
        winnerParty: "BJP",
        winnerVotes: 62450,
        runnerUpName: "Daniel Langthasa",
        runnerUpParty: "INC",
        runnerUpVotes: 44210,
        totalVoters: 131300,
        votesPolled: 106660,
        turnoutPct: 81.2,
        margin: 18240,
        source: "ECI Assam 2026"
      }
    ]
  });
  console.log("  ✅ Seeding election results completed");

  // ═══════════════════════════════════════════════════════════
  // C. INFRASTRUCTURE PROJECTS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding infrastructure projects...");
  await prisma.infraProject.createMany({
    data: [
      {
        districtId,
        name: "Haflong Urban Water Supply Project (AMRUT 2.0)",
        category: "Water Supply",
        budget: 1006300000,
        fundsReleased: 200000000,
        progressPct: 15.0,
        status: "Ongoing",
        startDate: new Date("2026-03-01"),
        expectedEnd: new Date("2028-03-01"),
        source: "Assam Public Health Engineering Department (PHED)"
      },
      {
        districtId,
        name: "Assam Disaster Resilient Hill Roads Project (ADRHRDP)",
        category: "Roads & Highways",
        budget: 37000000000,
        fundsReleased: 5000000000,
        progressPct: 10.0,
        status: "Ongoing",
        startDate: new Date("2025-08-01"),
        expectedEnd: new Date("2030-08-01"),
        source: "World Bank / PWD Assam"
      },
      {
        districtId,
        name: "Lanka-Umrangso Broad Gauge Railway Line",
        category: "Railways",
        budget: 12000000000,
        fundsReleased: 0,
        progressPct: 0.0,
        status: "Proposed",
        source: "Ministry of Railways"
      },
      {
        districtId,
        name: "Jatinga-Harangajao Four-Laning East-West Corridor Stretch",
        category: "Roads & Highways",
        budget: 8500000000,
        fundsReleased: 7200000000,
        progressPct: 85.0,
        status: "Ongoing",
        startDate: new Date("2018-05-15"),
        expectedEnd: new Date("2026-12-31"),
        source: "National Highways Authority of India (NHAI)"
      }
    ]
  });
  console.log("  ✅ Seeding infrastructure projects completed");

  // ═══════════════════════════════════════════════════════════
  // D. GOVERNMENT SCHEMES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding government schemes...");
  await prisma.scheme.createMany({
    data: [
      {
        districtId,
        name: "Orunodoi 3.0 Scheme",
        nameLocal: "অৰুণোদয় আঁচনি",
        category: "Direct Benefit Transfer",
        amount: 1250,
        beneficiaryCount: 45000,
        eligibility: "Low income households / Female-headed households",
        applyUrl: "https://orunodoi.assam.gov.in",
        level: "State",
        source: "Assam Finance Department"
      },
      {
        districtId,
        name: "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        category: "Housing",
        amount: 130000,
        beneficiaryCount: 12400,
        eligibility: "Kutcha house owners / Houseless families",
        applyUrl: "https://pmayg.nic.in",
        level: "National",
        source: "Panchayat & Rural Development Department, Assam"
      }
    ]
  });
  console.log("  ✅ Seeding government schemes completed");

  // ═══════════════════════════════════════════════════════════
  // E. LOCAL INDUSTRIES
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding local industries...");
  await prisma.localIndustry.createMany({
    data: [
      {
        districtId,
        name: "Umrangso Cement Industry Hub",
        type: "Manufacturing Hub",
        category: "Manufacturing",
        details: {
          description: "Abundant limestone deposits driving large-scale cement manufacturing (Dalmia Cement, etc.).",
          revenue: 4500000000,
          employees: 1500
        },
        source: "Assam Industry Department"
      },
      {
        districtId,
        name: "Organic Horticulture & Agriculture",
        type: "Agricultural Cooperative",
        category: "Agriculture",
        details: {
          description: "Renowned production of organic ginger, pineapple, orange, and dimasa cotton.",
          employees: 22000
        },
        source: "Horticulture Department Dima Hasao"
      },
      {
        districtId,
        name: "Eco and Heritage Tourism",
        type: "Tourism Sector",
        category: "Tourism",
        details: {
          description: "Haflong hill station, Jatinga Bird Sanctuary, and Maibong heritage archaeological structures.",
          revenue: 120000000,
          employees: 800
        },
        source: "Assam Tourism Development Corporation"
      }
    ]
  });
  console.log("  ✅ Seeding local industries completed");


  // ═══════════════════════════════════════════════════════════
  // F. SCHOOLS
  // ═══════════════════════════════════════════════════════════
  console.log("\n📌 Seeding schools...");
  await prisma.school.createMany({
    data: [
      {
        districtId,
        name: "Haflong Government College",
        type: "Government",
        level: "College",
        address: "Haflong Town",
        students: 1500,
        teachers: 60,
        studentTeacherRatio: 25.0,
        hasToilets: true,
        hasLibrary: true,
        hasLab: true
      },
      {
        districtId,
        name: "Maibong Government Higher Secondary School",
        type: "Government",
        level: "Higher Secondary",
        address: "Maibong Town",
        students: 850,
        teachers: 34,
        studentTeacherRatio: 25.0,
        hasToilets: true,
        hasLibrary: true,
        hasLab: false
      }
    ]
  });
  console.log("  ✅ Seeding schools completed");


  console.log("\n🎉 Dima Hasao district seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
