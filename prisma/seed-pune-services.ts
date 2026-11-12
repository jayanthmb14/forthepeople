/**
 * Pune ServiceGuide — 5 verified citizen services.
 *
 * Categories (UPPERCASE, mirrors Mumbai):
 *   CIVIL (2): Birth/Death certificate, Ration card
 *   REVENUE (1): Property tax (PMC)
 *   TRANSPORT (1): Driving Licence / RTO — new category, scalable
 *   UTILITIES (1): PMC Water Connection
 *
 * IDEMPOTENT. Uses findFirst({districtId, serviceName}).
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
    serviceName: "Birth/Death Certificate (PMC/PCMC)",
    category: "CIVIL",
    office: "PMC Health Department / PCMC Health Department",
    documentsNeeded: [
      "Hospital discharge slip",
      "Parent Aadhaar card",
      "Address proof",
      "Marriage certificate (birth only, if applicable)",
    ],
    fees: "Free within 21 days; ₹5-50 late fee after",
    timeline: "15 days after document submission",
    onlinePortal: "PMC eSeva / PCMC Sarathi",
    onlineUrl: "https://bdc.pmc.gov.in/",
    steps: [
      "Visit PMC/PCMC ward office or apply online",
      "Upload required documents",
      "Pay fee online or at counter",
      "Collect certificate after 15 days via portal or office",
    ],
    tips: "Apply within 21 days of birth/death to avoid late fee. Digital copy download available once issued.",
  },
  {
    serviceName: "Property Tax Payment (PMC)",
    category: "REVENUE",
    office: "PMC Property Tax Department",
    documentsNeeded: [
      "Property ID / Assessment Number",
      "Owner PAN",
      "Previous tax receipt (if available)",
    ],
    fees: "Per assessed value of property",
    timeline: "Online instant; office visit 1 working day",
    onlinePortal: "PMC Property Tax Portal",
    onlineUrl: "https://propertytax.punecorporation.org/",
    steps: [
      "Locate Property ID via portal search",
      "View current tax assessment",
      "Pay online via net banking / UPI / card",
      "Download receipt",
    ],
    tips: "Early-bird discount available if paid before cut-off date. PCMC uses separate portal for PCMC properties.",
  },
  {
    serviceName: "Driving Licence / Vehicle Registration (Pune RTO)",
    category: "TRANSPORT",
    office: "Pune RTO, Sangamwadi",
    documentsNeeded: [
      "Aadhaar card",
      "Age proof",
      "Address proof",
      "Medical certificate (Form 1A)",
      "Passport-size photos",
    ],
    fees: "₹200 learner licence; ₹1,000 permanent; vehicle registration varies by class",
    timeline: "30 days from driving test for permanent licence",
    onlinePortal: "Parivahan Sewa",
    onlineUrl: "https://parivahan.gov.in/",
    steps: [
      "Apply online for learner licence slot",
      "Pass written test (computer-based)",
      "Practice for 30 days minimum",
      "Book driving test slot",
      "Pass test; receive permanent licence",
    ],
    tips: "Book test slots early — Pune RTO has long waiting lists. Carry all original documents to test day.",
  },
  {
    serviceName: "Ration Card Application (Civil Supplies)",
    category: "CIVIL",
    office: "Tehsildar / Taluka Office, Pune",
    documentsNeeded: [
      "Aadhaar cards of all family members",
      "Income certificate",
      "Residence proof",
      "Family photograph",
      "Affidavit declaring no other ration card",
    ],
    fees: "₹5 application fee (BPL free)",
    timeline: "45 days",
    onlinePortal: "Maharashtra Food & Civil Supplies",
    onlineUrl: "https://mahafood.gov.in/",
    steps: [
      "Download application form or apply online",
      "Attach supporting documents",
      "Submit at Tehsildar office",
      "Inspector verification visit",
      "Card issued at Tehsildar office",
    ],
    tips: "Income threshold for AAY/BPL categories applies — check current limits. Head-of-family Aadhaar must be in Maharashtra domicile.",
  },
  {
    serviceName: "PMC Water Connection Application",
    category: "UTILITIES",
    office: "PMC Water Supply Department",
    documentsNeeded: [
      "Property ownership papers",
      "Society NOC (for flats)",
      "Approved plumber quotation",
      "Property tax payment receipt",
    ],
    fees: "Based on connection size (½ inch, ¾ inch, 1 inch) — contact PMC Water Dept for current rates",
    timeline: "60 days",
    onlinePortal: "PMC Water Supply",
    onlineUrl: "https://www.pmc.gov.in/",
    steps: [
      "Submit application with documents",
      "Site inspection by PMC engineer",
      "Pay connection charge",
      "Plumbing work by approved contractor",
      "Meter installation by PMC",
    ],
    tips: "Apply well before monsoon (June onwards) to avoid delays. PCMC uses separate process for PCMC areas.",
  },
];

export async function seedPuneServices(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;
  try {
    const pune = await client.district.findFirstOrThrow({ where: { slug: "pune" } });
    let created = 0;
    let skipped = 0;
    for (const r of RECORDS) {
      const exists = await client.serviceGuide.findFirst({
        where: { districtId: pune.id, serviceName: r.serviceName },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await client.serviceGuide.create({
        data: { districtId: pune.id, ...r, active: true },
      });
      console.log(`  ✅ [${r.category}] ${r.serviceName}`);
      created++;
    }
    console.log(`ServiceGuide: created=${created} skipped=${skipped}`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneServices().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
