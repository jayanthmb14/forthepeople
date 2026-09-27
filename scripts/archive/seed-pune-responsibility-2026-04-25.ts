/**
 * Seed Pune responsibility items from scripts/archive/pune-responsibility-2026-04-25.json.
 *
 * Idempotent: wipes existing Pune ResponsibilityItem rows first, then
 * re-creates from the JSON. Phones marked "verify_before_use" are stored as
 * null with phoneVerified=false so admin can review before public exposure.
 */

import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "fs";
import path from "path";
import "dotenv/config";

type ResearchItem = {
  action: string;
  why_pune_specific: string;
  report_to?: {
    name?: string;
    url?: string;
    phone?: string;
  };
  source_notes?: string;
};

type ResearchSection = {
  section: string;
  icon: string;
  items: ResearchItem[];
};

const VERIFY_MARKER = "verify_before_use";

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  const jsonPath = path.join(process.cwd(), "scripts", "archive", "pune-responsibility-2026-04-25.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Research file missing: ${jsonPath}`);
  }

  const research: ResearchSection[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`Loaded research — ${research.length} sections, ${research.reduce((s, x) => s + (x.items?.length ?? 0), 0)} items`);

  // Idempotent: wipe existing Pune items first.
  const deleted = await p.responsibilityItem.deleteMany({ where: { districtId: pune.id } });
  console.log(`Cleared ${deleted.count} existing Pune responsibility items (idempotent re-run)\n`);

  let created = 0;
  let unverifiedPhones = 0;

  for (let secIdx = 0; secIdx < research.length; secIdx++) {
    const section = research[secIdx];
    for (let itemIdx = 0; itemIdx < section.items.length; itemIdx++) {
      const item = section.items[itemIdx];
      const r = item.report_to ?? {};

      const isPhoneVerifyMarker = r.phone === VERIFY_MARKER;
      const phone = isPhoneVerifyMarker ? null : (r.phone || null);
      const phoneVerified = !isPhoneVerifyMarker && phone !== null;
      if (isPhoneVerifyMarker) unverifiedPhones++;

      await p.responsibilityItem.create({
        data: {
          districtId: pune.id,
          section: section.section,
          sectionIcon: section.icon,
          sectionOrder: secIdx + 1,
          action: item.action,
          whyRelevant: item.why_pune_specific,
          reportToName: r.name || null,
          reportToUrl: r.url || null,
          reportToPhone: phone,
          phoneVerified,
          sourceNotes: item.source_notes || null,
          itemOrder: itemIdx + 1,
          active: true,
        },
      });
      created++;
    }
    console.log(`  ${section.icon} ${section.section} — ${section.items.length} items`);
  }

  console.log(`\n✓ Created ${created} responsibility items for Pune across ${research.length} sections`);
  console.log(`✓ ${unverifiedPhones} phone(s) marked unverified — review in /admin/responsibility before public exposure`);
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
