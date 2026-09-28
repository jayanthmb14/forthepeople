// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Additional Districts
// Run ONLY after verifying pilot districts work perfectly.
//
// Usage: npx tsx scripts/activate-expansion-districts.ts [state-slug] [district-slug]
//
// Examples:
//   npx tsx scripts/activate-expansion-districts.ts maharashtra pune
//   npx tsx scripts/activate-expansion-districts.ts west-bengal howrah
//   npx tsx scripts/activate-expansion-districts.ts tamil-nadu coimbatore
//   npx tsx scripts/activate-expansion-districts.ts --all-maharashtra
//   npx tsx scripts/activate-expansion-districts.ts --all-west-bengal
//   npx tsx scripts/activate-expansion-districts.ts --all-tamil-nadu
//
// After running:
//   1. Update src/lib/constants/districts.ts → set activated district active: true
//   2. Seed data for the newly activated district
//   3. git commit + git push to deploy
// ═══════════════════════════════════════════════════════════
import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function activateDistrict(stateSlug: string, districtSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) { console.log(`  ⚠️  State "${stateSlug}" not found`); return; }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, stateId: state.id },
  });
  if (!district) { console.log(`  ⚠️  District "${districtSlug}" not found in ${stateSlug}`); return; }
  if (district.active) { console.log(`  ✓ ${district.name} already active`); return; }

  await prisma.district.update({ where: { id: district.id }, data: { active: true } });
  console.log(`  ✅ ${district.name} (${stateSlug}) — ACTIVATED`);
}

async function activateAllInState(stateSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) { console.log(`  ⚠️  State "${stateSlug}" not found`); return; }

  const districts = await prisma.district.findMany({
    where: { stateId: state.id, active: false },
  });

  for (const d of districts) {
    await prisma.district.update({ where: { id: d.id }, data: { active: true } });
    console.log(`  ✅ ${d.name} — ACTIVATED`);
  }
  console.log(`\n  Activated ${districts.length} districts in ${state.name}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/activate-expansion-districts.ts <state-slug> <district-slug>');
    console.log('  npx tsx scripts/activate-expansion-districts.ts --all-<state-slug>');
    process.exit(0);
  }

  if (args[0].startsWith('--all-')) {
    const stateSlug = args[0].replace('--all-', '');
    console.log(`🔓 Activating ALL districts in ${stateSlug}...\n`);
    await activateAllInState(stateSlug);
  } else if (args.length >= 2) {
    console.log(`🔓 Activating ${args[1]} in ${args[0]}...\n`);
    await activateDistrict(args[0], args[1]);
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('  1. Update src/lib/constants/districts.ts → set activated district active: true');
  console.log('  2. Seed data for the district (create prisma/seed-<district>-data.ts)');
  console.log('  3. git add -A && git commit && git push origin main');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
