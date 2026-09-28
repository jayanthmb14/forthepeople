// ═══════════════════════════════════════════════════════════
// Script: Classify existing news articles by module (callAI, Tier-1 chain)
// Usage: npx tsx scripts/classify-news.ts
// ═══════════════════════════════════════════════════════════
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { callAI } from "../src/lib/ai-provider";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const VALID_MODULES = [
  "leaders", "infrastructure", "budget", "water", "crops", "weather",
  "police", "elections", "education", "health", "transport", "schemes",
  "housing", "power", "courts", "industries", "jjm", "gram-panchayat",
  "alerts", "famous-personalities", "citizen-corner", "offices", "rti",
  "sugar-factory", "soil", "population", "news",
];

async function main() {
  const unclassified = await prisma.newsItem.findMany({
    where: { targetModule: null },
    include: { district: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  if (unclassified.length === 0) {
    console.log("✅ All news articles already classified.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n📰 Classifying ${unclassified.length} unclassified articles...\n`);

  let classified = 0;
  let failed = 0;

  // Process in batches of 15
  for (let i = 0; i < unclassified.length; i += 15) {
    const batch = unclassified.slice(i, i + 15);
    const districtName = batch[0].district?.name ?? "Unknown";

    process.stdout.write(`  Batch ${Math.floor(i / 15) + 1}/${Math.ceil(unclassified.length / 15)} (${districtName})... `);

    const prompt = `Classify these news articles for ${districtName} district.
For each article, determine which module of a civic transparency website it belongs to.

Available modules: leaders, infrastructure, budget, water, crops, weather, police, elections,
education, health, transport, schemes, housing, power, courts, industries, jjm, gram-panchayat,
alerts, famous-personalities, citizen-corner, offices, rti, sugar-factory, soil, population, news

Articles:
${batch.map((n, idx) => `${idx + 1}. "${n.title}" (${n.source})`).join("\n")}

Return ONLY a JSON array:
[{"index":1,"targetModule":"police","moduleAction":"Crime stats updated"}]

Use "news" if the article doesn't clearly fit another module.`;

    const response = await callAI({
      systemPrompt: "You are a news classifier. Return ONLY a JSON array. No markdown, no explanation.",
      userPrompt: prompt,
      jsonMode: true,
      maxTokens: 4096,
      temperature: 0.1,
    });

    try {
      const text = response.text.trim().replace(/```(?:json)?\n?/g, "").trim();
      const results = JSON.parse(text) as Array<{
        index: number;
        targetModule: string;
        moduleAction: string;
      }>;

      for (const result of results) {
        const article = batch[result.index - 1];
        if (!article) continue;

        const mod = VALID_MODULES.includes(result.targetModule) ? result.targetModule : "news";
        await prisma.newsItem.update({
          where: { id: article.id },
          data: {
            targetModule: mod,
            moduleAction: result.moduleAction ?? null,
            classifiedBy: "opus",
            classifiedAt: new Date(),
          },
        });
        classified++;
      }
      process.stdout.write(`✓ (${results.length} classified)\n`);
    } catch {
      process.stdout.write(`✗ (parse error)\n`);
      failed++;
    }

    await sleep(2000);
  }

  console.log(`\n✅ Done: ${classified} classified, ${failed} batches failed`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
