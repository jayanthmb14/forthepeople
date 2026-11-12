/**
 * Pune GovOffice — 8 verified district offices.
 *
 * Type enum (mirrors Mumbai's 4-value uppercase set):
 *   DISTRICT (2): Collectorate, ZP
 *   MUNICIPAL (2): PMC, PCMC
 *   STATE (3): 2 Police commissionerates, RTO
 *   CENTRAL (1): Income Tax Office
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}).
 *
 * Refs: Forthepeople/27-Pune-Module-Population-2026-04-24.md
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

const RECORDS = [
  {
    name: "Office of the District Collector (Pune Collectorate)",
    department: "District Administration, Government of Maharashtra",
    type: "DISTRICT",
    address: "Council Hall, Pune 411001",
    website: "https://pune.gov.in",
  },
  {
    name: "Pune Municipal Corporation Headquarters",
    department: "Pune Municipal Corporation",
    type: "MUNICIPAL",
    address: "Shivajinagar, Pune 411005",
    website: "https://pmc.gov.in",
  },
  {
    name: "Pimpri-Chinchwad Municipal Corporation Headquarters",
    department: "Pimpri-Chinchwad Municipal Corporation",
    type: "MUNICIPAL",
    address: "PCMC Building, Mumbai-Pune Road, Pimpri 411018",
    website: "https://pcmcindia.gov.in",
  },
  {
    name: "Pune Zilla Parishad Office",
    department: "Rural Local Government, Maharashtra ZP",
    type: "DISTRICT",
    address: "Zilla Parishad Pune, Shivaji Road",
    website: "https://www.punezp.gov.in",
  },
  {
    name: "Pune City Police Commissionerate",
    department: "Maharashtra Police",
    type: "STATE",
    address: "Pune City Commissionerate, Shivajinagar, Pune 411005",
    website: "https://home.maharashtra.gov.in",
  },
  {
    name: "Pimpri-Chinchwad Police Commissionerate",
    department: "Maharashtra Police",
    type: "STATE",
    address: "Pimpri-Chinchwad Commissionerate, Chinchwad, Pune 411019",
    website: "https://home.maharashtra.gov.in",
  },
  {
    name: "Regional Transport Office (RTO), Pune",
    department: "Maharashtra Transport Department",
    type: "STATE",
    address: "RTO Office, Sangamwadi, Pune 411001",
    website: "https://mahatranscom.in",
  },
  {
    name: "Income Tax Office (Pune)",
    department: "CBDT / Income Tax Department",
    type: "CENTRAL",
    address: "Aayakar Bhavan, 12 Sadhu Vaswani Road, Pune 411001",
    website: "https://www.incometax.gov.in",
  },
];

export async function seedPuneOffices(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;
  try {
    const pune = await client.district.findFirstOrThrow({ where: { slug: "pune" } });
    let created = 0;
    let skipped = 0;
    for (const r of RECORDS) {
      const exists = await client.govOffice.findFirst({
        where: { districtId: pune.id, name: r.name },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await client.govOffice.create({
        data: {
          districtId: pune.id,
          name: r.name,
          department: r.department,
          type: r.type,
          address: r.address,
          website: r.website,
          services: [],
        },
      });
      console.log(`  ✅ [${r.type}] ${r.name}`);
      created++;
    }
    console.log(`GovOffice: created=${created} skipped=${skipped}`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneOffices().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
