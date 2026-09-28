// ═══════════════════════════════════════════════════════════
// Script: Generate initial AI insights for all districts
// Usage: npx tsx scripts/generate-all-insights.ts
// Generates every MODULE_INSIGHT_CONFIGS module × N districts through
// generateInsight() (callAIJSON, purpose "insight" = the Tier-2 chain),
// with a 2-second delay between calls
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { MODULE_INSIGHT_CONFIGS } from "../src/lib/insight-config";
import { generateInsight } from "../src/lib/insight-generator";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
  });

  console.log(`\n🚀 Generating insights for ${districts.length} districts × ${MODULE_INSIGHT_CONFIGS.length} modules`);
  console.log(`   Total calls: ~${districts.length * MODULE_INSIGHT_CONFIGS.length}\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  for (const district of districts) {
    console.log(`\n── ${district.name} (${district.state.name}) ──`);

    for (const config of MODULE_INSIGHT_CONFIGS) {
      // Check if a fresh insight already exists
      const existing = await prisma.aIModuleInsight.findUnique({
        where: { districtId_module: { districtId: district.id, module: config.module } },
        select: { expiresAt: true },
      });

      if (existing && existing.expiresAt > new Date()) {
        process.stdout.write(`  ⏭  ${config.module} (fresh)\n`);
        skipped++;
        continue;
      }

      process.stdout.write(`  ⏳ ${config.module}...`);
      const ok = await generateInsight(
        config,
        district.id,
        district.slug,
        district.name,
        district.state.slug,
        district.state.name
      );

      if (ok) {
        process.stdout.write(` ✓\n`);
        succeeded++;
      } else {
        process.stdout.write(` ✗ (failed)\n`);
        failed++;
      }

      // 2-second delay to respect rate limits
      await sleep(2000);
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Done in ${duration}s`);
  console.log(`   Succeeded: ${succeeded}, Failed: ${failed}, Skipped: ${skipped}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
