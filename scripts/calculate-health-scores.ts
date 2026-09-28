// ═══════════════════════════════════════════════════════════
// Calculate district health scores for all active districts
// Usage: npx tsx scripts/calculate-health-scores.ts
// ═══════════════════════════════════════════════════════════
import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { prisma } from "../src/lib/db";
import { calculateDistrictHealthScore } from "../src/lib/health-score";

async function main() {
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, name: true },
  });

  console.log(`\n📊 Calculating health scores for ${districts.length} districts...\n`);

  for (const d of districts) {
    process.stdout.write(`  ${d.name}... `);
    try {
      await calculateDistrictHealthScore(d.id);
      process.stdout.write(`✓\n`);
    } catch (err) {
      process.stdout.write(`✗ ${err instanceof Error ? err.message : String(err)}\n`);
    }
  }

  console.log(`\n✅ Done`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
