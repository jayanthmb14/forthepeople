/**
 * Read-only audit of Supporter rows with spam-looking names.
 * Filters in JS to avoid Postgres regex escaping issues.
 */

import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

function isSuspicious(name: string): { flag: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (/\d/.test(name)) reasons.push("digits");
  if (/[|\/\\]/.test(name)) reasons.push("pipe/slash");
  if (/[%@₹]/.test(name)) reasons.push("promo-symbol");
  if (name.length > 40) reasons.push(`length=${name.length}`);
  if (/\p{Extended_Pictographic}/u.test(name)) reasons.push("emoji");
  if (/since\s+\d{4}/i.test(name)) reasons.push("since-year");
  if (/p\.?a\.?|p\.?m\.?/i.test(name)) reasons.push("p.a/p.m");
  return { flag: reasons.length > 0, reasons };
}

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const all = await p.supporter.findMany({
    select: { id: true, name: true, email: true, tier: true, amount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const bad = all.map(r => ({ ...r, ...isSuspicious(r.name) })).filter(r => r.flag);

  console.log(`Total Supporter rows: ${all.length}`);
  console.log(`Suspicious rows: ${bad.length} (${((bad.length / Math.max(all.length, 1)) * 100).toFixed(1)}%)\n`);

  for (const r of bad.slice(0, 30)) {
    console.log(`  [${r.tier ?? "?"}/₹${r.amount}] "${r.name}" [${r.reasons.join(", ")}] (${r.email ?? "no-email"})`);
  }
  if (bad.length > 30) console.log(`  ... + ${bad.length - 30} more`);

  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
