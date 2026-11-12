// One-shot seeder for the current infrastructure-migration announcement.
// Safe to re-run — it upserts the singleton row. Admins can tweak via
// /en/admin?tab=announcement afterwards; re-running this script will
// overwrite their edits, so only run it when bootstrapping or intentionally
// resetting to the template.
//
//   npx tsx prisma/seed-site-announcement.ts

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const SINGLETON_ID = "site-announcement-singleton";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const row = await prisma.siteAnnouncement.upsert({
      where: { id: SINGLETON_ID },
      update: {
        enabled: true,
        variant: "critical",
        displayMode: "modal",
        title: "Temporary service notice — infrastructure migration",
        bodyMd:
`We're moving ForThePeople.in's database and cache to a new hosting setup between now and 25 April 2026. During this window you may notice some pages behaving a little differently than usual.

None of this affects your data or any payment or contribution you've made. It's purely behind-the-scenes infrastructure work — the kind we'd rather tell you about than pretend isn't happening.`,
        bulletsJson: [
          "Some dashboards showing outdated or incomplete numbers",
          "Brief errors or blank sections on a few pages",
          "Slightly slower load times while caches rebuild",
        ],
        highlightText: "Normal service resumes from 26 April 2026.",
        footerNote: "If something looks seriously wrong, please report it via the feedback link in the footer — it helps us prioritise the post-migration cleanup.",
        ctaButtonText: "I understand — continue to site",
        storageKey: "ftp_site_announcement_v1",
        autoHideAfter: new Date("2026-04-25T18:30:00.000Z"), // 26-Apr-2026 00:00 IST
      },
      create: {
        id: SINGLETON_ID,
        enabled: true,
        variant: "critical",
        displayMode: "modal",
        title: "Temporary service notice — infrastructure migration",
        bodyMd:
`We're moving ForThePeople.in's database and cache to a new hosting setup between now and 25 April 2026. During this window you may notice some pages behaving a little differently than usual.

None of this affects your data or any payment or contribution you've made. It's purely behind-the-scenes infrastructure work — the kind we'd rather tell you about than pretend isn't happening.`,
        bulletsJson: [
          "Some dashboards showing outdated or incomplete numbers",
          "Brief errors or blank sections on a few pages",
          "Slightly slower load times while caches rebuild",
        ],
        highlightText: "Normal service resumes from 26 April 2026.",
        footerNote: "If something looks seriously wrong, please report it via the feedback link in the footer — it helps us prioritise the post-migration cleanup.",
        ctaButtonText: "I understand — continue to site",
        storageKey: "ftp_site_announcement_v1",
        autoHideAfter: new Date("2026-04-25T18:30:00.000Z"),
      },
    });
    console.log(`✅ Seeded SiteAnnouncement (enabled=${row.enabled}, autoHideAfter=${row.autoHideAfter?.toISOString()})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
