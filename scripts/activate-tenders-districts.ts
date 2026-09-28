// Keeps the per-district tenders switch (District.tendersActive) in line
// with what the collector reads: ON for every active district in
// GEPNIC_ORGS whose state has a GePNIC portal
// (src/lib/constants/tender-portals.ts), OFF for every other district.
// The tender pages already stay locked where no collector reads the district
// (tendersCollectedFor), so this only makes the stored flag agree.
//
// Dry run by default: prints what would change and writes nothing.
//   npx tsx scripts/activate-tenders-districts.ts            # dry run
//   npx tsx scripts/activate-tenders-districts.ts --confirm  # write
//
// Before --confirm: do the legal / robots check on the state portals
// (docs/OWNER-TODO.md §6). Idempotent — re-running is safe.
// See docs/TENDERS-ACTIVATION.md.

import "./_env"; // MUST be first: loads .env + .env.local before any module reads process.env
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { tendersCollectedFor } from "../src/lib/constants/tender-portals";

const CONFIRM = process.argv.includes("--confirm");

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    const districts = await prisma.district.findMany({
      where: { active: true },
      select: { id: true, slug: true, name: true, tendersActive: true, state: { select: { slug: true } } },
      orderBy: { name: "asc" },
    });
    const turnOn = districts.filter((d) => !d.tendersActive && tendersCollectedFor(d.state.slug, d.slug));
    const turnOff = districts.filter((d) => d.tendersActive && !tendersCollectedFor(d.state.slug, d.slug));

    for (const d of turnOn) console.log(`  ON   ${d.name} (${d.state.slug}/${d.slug})`);
    for (const d of turnOff) console.log(`  OFF  ${d.name} (${d.state.slug}/${d.slug}) — no collector reads it`);
    if (!turnOn.length && !turnOff.length) {
      console.log("[activate-tenders] the flag already matches the collector; nothing to do");
      return;
    }
    if (!CONFIRM) {
      console.log(`[activate-tenders] dry run: ${turnOn.length} to switch on, ${turnOff.length} to switch off. Re-run with --confirm to write.`);
      return;
    }

    const on = await prisma.district.updateMany({ where: { id: { in: turnOn.map((d) => d.id) } }, data: { tendersActive: true } });
    const off = await prisma.district.updateMany({ where: { id: { in: turnOff.map((d) => d.id) } }, data: { tendersActive: false } });
    console.log(`[activate-tenders] switched on ${on.count}, switched off ${off.count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
