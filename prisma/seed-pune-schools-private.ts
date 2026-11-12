/**
 * Pune Schools — 4 notable PRIVATE higher-ed institutions.
 *
 * Adds PRIVATE-type examples for color-coding / filter coverage.
 * Schema pattern matches seed-pune-schools.ts (address field packs
 * address + description + primary + secondary + disclaimer via " // ").
 *
 * IDEMPOTENT — findFirst by (districtId, name) + skip.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const RECORDS = [
  {
    name: "Symbiosis International (Deemed University)",
    nameLocal: null,
    type: "PRIVATE",
    level: "University",
    address: [
      "Gram Lavale, Taluka Mulshi, Pune — 412115 (main Lavale campus; additional campuses at Viman Nagar, Kirkee, Hinjawadi).",
      "Private deemed-to-be-university established 2002. 40+ constituent institutes across law, management, liberal arts, health sciences, design, and telecom management.",
      "Primary source: Symbiosis International Official | https://www.siu.edu.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/Symbiosis_International_University",
      "Disclaimer: Private deemed university under UGC / MHRD recognition. Admissions via SET / SNAP / SLAT national entrance tests.",
    ].join(" // "),
  },
  {
    name: "Symbiosis Institute of Business Management (SIBM Pune)",
    nameLocal: null,
    type: "PRIVATE",
    level: "Higher Education",
    address: [
      "Gram Lavale, Taluka Mulshi, Pune — 412115.",
      "Constituent institute of Symbiosis International University; established 1978. Full-time MBA programme; routinely ranked among India's top 25 B-schools by NIRF.",
      "Primary source: SIBM Pune Official | https://www.sibm.edu/",
      "Secondary source: NIRF Management Rankings | https://www.nirfindia.org/Rankings/2024/ManagementRanking.html",
      "Disclaimer: Admissions via SNAP test. Part of SIU. Flagship MBA batch ~180 students.",
    ].join(" // "),
  },
  {
    name: "MIT World Peace University (MIT-WPU)",
    nameLocal: null,
    type: "PRIVATE",
    level: "University",
    address: [
      "Survey No. 124, Paud Road, Kothrud, Pune — 411038.",
      "Private university founded 2017 under MIT Group of Institutions (founded 1983 by Prof. Vishwanath D. Karad). Schools of Engineering, Management, Economics, Government, Liberal Arts, Science, Media, Law.",
      "Primary source: MIT-WPU Official | https://mitwpu.edu.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/MIT_World_Peace_University",
      "Disclaimer: Private university under Maharashtra State Private Universities Act. Not to be confused with MIT USA.",
    ].join(" // "),
  },
  {
    name: "FLAME University",
    nameLocal: null,
    type: "PRIVATE",
    level: "University",
    address: [
      "Gat No. 1270, Lavale, Off Pune Bangalore Highway, Pune — 412115.",
      "Private liberal-education university established 2015. Undergraduate programmes in liberal arts + liberal education model (majors + minors + discover); postgraduate in business, communication, applied psychology.",
      "Primary source: FLAME University Official | https://www.flame.edu.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/FLAME_University",
      "Disclaimer: Private university under Maharashtra State Private Universities Act. Admissions via FEAT entrance + interview.",
    ].join(" // "),
  },
];

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  let added = 0, skipped = 0;
  for (const r of RECORDS) {
    const existing = await p.school.findFirst({
      where: { districtId: pune.id, name: r.name },
    });
    if (existing) { skipped++; continue; }
    await p.school.create({ data: { districtId: pune.id, ...r } });
    console.log(`  ✅ [${r.type}/${r.level}] ${r.name}`);
    added++;
  }

  console.log(`\nPrivate schools: ${added} added, ${skipped} skipped`);
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
