// ═══════════════════════════════════════════════════════════
// seed-expansion.ts — Expand from Mandya to 3 districts
// Adds: Bengaluru Urban + Mysuru (Files 1-6 + ext A/B/C)
//
// Run: npx tsx prisma/seed-expansion.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

import { seedBengaluruHierarchy } from "../seed-bengaluru-hierarchy";
import { seedBengaluruLeaders } from "../seed-bengaluru-leaders";
import { seedBengaluruData } from "./seed-bengaluru-data";
import { seedBengaluruDataExtA } from "../seed-bengaluru-data-ext-a";
import { seedBengaluruDataExtB } from "../seed-bengaluru-data-ext-b";
import { seedBengaluruDataExtC } from "./seed-bengaluru-data-ext-c";
import { seedMysuruHierarchy } from "../seed-mysuru-hierarchy";
import { seedMysuruLeaders } from "../seed-mysuru-leaders";
import { seedMysuruData } from "./seed-mysuru-data";
import { exitUnlessLocalSeedAllowed } from "../seed-guard";

// ARCHIVED (prisma/archive/README.md): this seed wipes tables or writes
// invented demo rows. It refuses to run unless ALLOW_SEED_WIPE=1 and the
// database is on this machine.
exitUnlessLocalSeedAllowed();

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║  ForThePeople.in — District Expansion Seed       ║");
    console.log("║  Adding: Bengaluru Urban + Mysuru                ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    // ── BENGALURU URBAN ───────────────────────────────────
    console.log("━━━ BENGALURU URBAN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedBengaluruHierarchy(prisma);
    await seedBengaluruLeaders(prisma);
    await seedBengaluruData(prisma);
    await seedBengaluruDataExtA(prisma);
    await seedBengaluruDataExtB(prisma);
    await seedBengaluruDataExtC(prisma);

    // ── MYSURU ────────────────────────────────────────────
    console.log("━━━ MYSURU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    await seedMysuruHierarchy(prisma);
    await seedMysuruLeaders(prisma);
    await seedMysuruData(prisma);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║  ✅  Expansion seed complete!                     ║");
    console.log("║  Districts now live: Mandya + Bengaluru + Mysuru  ║");
    console.log("╚══════════════════════════════════════════════════╝");
  } catch (err) {
    console.error("\n❌ Expansion seed failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
