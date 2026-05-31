// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Kamrup Metro District Data Seed
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-kamrup-metro-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Kamrup Metro district data...\n");

  const state = await prisma.state.findUnique({ where: { slug: "assam" } });
  if (!state) throw new Error("Assam state not found — run seed-hierarchy.ts first");

  const district = await prisma.district.findFirst({
    where: { stateId: state.id, slug: "guwahati" },
  });
  if (!district) throw new Error("Kamrup Metro district not found — run seed-hierarchy.ts first");

  const districtId = district.id;
  console.log(`✓ Found Kamrup Metro district (id: ${districtId})`);

  // Clear and re-seed Kamrup Metro data in a transaction
  await prisma.$transaction(async (tx) => {
    // Clear existing Kamrup Metro specific entries
    await tx.leader.deleteMany({ where: { districtId } });
    await tx.electionResult.deleteMany({ where: { districtId } });
    await tx.infraProject.deleteMany({ where: { districtId } });
    await tx.scheme.deleteMany({ where: { districtId } });
    await tx.localIndustry.deleteMany({ where: { districtId } });
    await tx.school.deleteMany({ where: { districtId } });
    console.log("✓ Cleared old entries for Kamrup Metro");

    // ═══════════════════════════════════════════════════════════
    // A. LEADERSHIP
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding leadership...");
    await tx.leader.createMany({
      data: [
        {
          districtId,
          name: "Bijuli Kalita Medhi",
          role: "Member of Parliament (MP)",
          tier: 1,
          party: "BJP",
          constituency: "Guwahati",
          since: "2024",
          source: "ECI Lok Sabha 2024"
        },
        {
          districtId,
          name: "Himanta Biswa Sarma",
          nameLocal: "হিমন্ত বিশ্ব শৰ্মা",
          role: "Member of Legislative Assembly (MLA) & Chief Minister of Assam",
          tier: 2,
          party: "BJP",
          constituency: "Jalukbari",
          since: "2001",
          source: "Assam Assembly Election 2026"
        },
        {
          districtId,
          name: "Siddhartha Bhattacharya",
          role: "Member of Legislative Assembly (MLA)",
          tier: 2,
          party: "BJP",
          constituency: "Guwahati East",
          since: "2016",
          source: "Assam Assembly Election 2026"
        },
        {
          districtId,
          name: "Atul Bora",
          role: "Member of Legislative Assembly (MLA)",
          tier: 2,
          party: "AGP",
          constituency: "Dispur",
          since: "2016",
          source: "Assam Assembly Election 2026"
        },
        {
          districtId,
          name: "Mrigen Sarania",
          role: "Mayor, Guwahati Municipal Corporation (GMC)",
          tier: 3,
          party: "BJP",
          since: "2022",
          source: "Guwahati Municipal Corporation Portal"
        },
        {
          districtId,
          name: "Sumit Sattawan, IAS",
          role: "District Commissioner (DC)",
          tier: 3,
          source: "Assam General Administration Department"
        },
        {
          districtId,
          name: "Diganta Barah, IPS",
          role: "Commissioner of Police",
          tier: 3,
          source: "Assam Police Portal"
        }
      ]
    });
    console.log("  ✅ Seeding leaders completed");

    // ═══════════════════════════════════════════════════════════
    // B. ELECTION RESULTS
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding election results...");
    await tx.electionResult.createMany({
      data: [
        {
          districtId,
          year: 2026,
          electionType: "Assembly",
          constituency: "Jalukbari",
          winnerName: "Himanta Biswa Sarma",
          winnerParty: "BJP",
          winnerVotes: 98560,
          runnerUpName: "Ramen Chandra Borthakur",
          runnerUpParty: "INC",
          runnerUpVotes: 23140,
          totalVoters: 165000,
          votesPolled: 125800,
          turnoutPct: 76.24,
          margin: 75420,
          source: "ECI Assam 2026"
        },
        {
          districtId,
          year: 2026,
          electionType: "Assembly",
          constituency: "Guwahati East",
          winnerName: "Siddhartha Bhattacharya",
          winnerParty: "BJP",
          winnerVotes: 71450,
          runnerUpName: "Ashima Bordoloi",
          runnerUpParty: "INC",
          runnerUpVotes: 32180,
          totalVoters: 142000,
          votesPolled: 108500,
          turnoutPct: 76.41,
          margin: 39270,
          source: "ECI Assam 2026"
        }
      ]
    });
    console.log("  ✅ Seeding election results completed");

    // ═══════════════════════════════════════════════════════════
    // C. INFRASTRUCTURE PROJECTS
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding infrastructure projects...");
    await tx.infraProject.createMany({
      data: [
        {
          districtId,
          name: "Guwahati-North Guwahati Brahmaputra Bridge",
          category: "Roads & Highways",
          budget: 26080000000,
          fundsReleased: 22000000000,
          progressPct: 88.0,
          status: "Ongoing",
          startDate: new Date("2019-03-01"),
          expectedEnd: new Date("2026-10-31"),
          source: "Assam PWD (Roads) / SPV"
        },
        {
          districtId,
          name: "South Guwahati JICA Assisted Water Supply Project",
          category: "Water Supply",
          budget: 14270000000,
          fundsReleased: 11000000000,
          progressPct: 75.0,
          status: "Ongoing",
          startDate: new Date("2011-08-01"),
          expectedEnd: new Date("2027-03-31"),
          source: "Guwahati Metropolitan Development Authority (GMDA)"
        },
        {
          districtId,
          name: "Guwahati Ring Road and 6-Lane Brahmaputra Bridge",
          category: "Roads & Highways",
          budget: 57880000000,
          fundsReleased: 120000000,
          progressPct: 5.0,
          status: "Ongoing",
          startDate: new Date("2026-01-15"),
          expectedEnd: new Date("2029-12-31"),
          source: "National Highways Authority of India (NHAI)"
        }
      ]
    });
    console.log("  ✅ Seeding infrastructure projects completed");

    // ═══════════════════════════════════════════════════════════
    // D. GOVERNMENT SCHEMES
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding government schemes...");
    await tx.scheme.createMany({
      data: [
        {
          districtId,
          name: "Orunodoi 3.0 Scheme",
          nameLocal: "অৰুণোদয় আঁচনি",
          category: "Direct Benefit Transfer",
          amount: 1250,
          beneficiaryCount: 185000,
          eligibility: "Low income households / Female-headed households",
          applyUrl: "https://orunodoi.assam.gov.in",
          level: "State",
          source: "Assam Finance Department"
        },
        {
          districtId,
          name: "Pradhan Mantri Awas Yojana - Urban (PMAY-U)",
          category: "Housing",
          amount: 150000,
          beneficiaryCount: 16800,
          eligibility: "Economically Weaker Section (EWS) / LIG households",
          applyUrl: "https://pmay-urban.gov.in",
          level: "National",
          source: "Housing & Urban Affairs Department, Assam"
        }
      ]
    });
    console.log("  ✅ Seeding government schemes completed");

    // ═══════════════════════════════════════════════════════════
    // E. LOCAL INDUSTRIES
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding local industries...");
    await tx.localIndustry.createMany({
      data: [
        {
          districtId,
          name: "Guwahati Tea Auction Centre (GTAC)",
          type: "Trading Hub",
          category: "Agriculture",
          details: {
            description: "One of the largest tea auction centers in the world, facilitating trade of Assam tea.",
            revenue: 120000000000,
            employees: 5000
          },
          source: "GTAC Board Report"
        },
        {
          districtId,
          name: "Guwahati Refinery (IOCL)",
          type: "Refinery",
          category: "Energy",
          details: {
            description: "India's first public sector refinery in Noonmati, processing crude from Assam oil fields.",
            revenue: 85000000000,
            employees: 1200
          },
          source: "Indian Oil Corporation Limited"
        },
        {
          districtId,
          name: "IT & Software Technology Park (Borjhar)",
          type: "Technology Center",
          category: "Information Technology",
          details: {
            description: "Software Technology Parks of India (STPI) hub boosting tech startups and IT services in the Northeast.",
            revenue: 2800000000,
            employees: 3200
          },
          source: "STPI Borjhar annual log"
        }
      ]
    });
    console.log("  ✅ Seeding local industries completed");

    // ═══════════════════════════════════════════════════════════
    // F. SCHOOLS
    // ═══════════════════════════════════════════════════════════
    console.log("\n📌 Seeding schools...");
    await tx.school.createMany({
      data: [
        {
          districtId,
          name: "Cotton University",
          type: "Government",
          level: "University",
          address: "Panbazar, Guwahati",
          students: 5500,
          teachers: 244,
          studentTeacherRatio: 22.5,
          hasToilets: true,
          hasLibrary: true,
          hasLab: true
        },
        {
          districtId,
          name: "Guwahati Collegiate School",
          type: "Government",
          level: "Higher Secondary",
          address: "Panbazar, Guwahati",
          students: 1100,
          teachers: 45,
          studentTeacherRatio: 24.4,
          hasToilets: true,
          hasLibrary: true,
          hasLab: true
        }
      ]
    });
    console.log("  ✅ Seeding schools completed");
  });

  console.log("\n🎉 Kamrup Metro district seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
