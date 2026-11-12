/**
 * Pune RtiTemplate — 5 templates for high-demand topics.
 *
 * Addresses confirmed via official websites (PMC, PCMC, Pune Collectorate,
 * ZP Pune, Pune Metro). Fee amounts per RTI Act 2005 standard (₹10 IPO/DD).
 *
 * IDEMPOTENT — findFirst by (districtId, topic) + skip.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const templates = [
  {
    topic: "PMC Road Tender & Contractor Details",
    topicLocal: "पीएमसी रस्ता निविदा आणि कंत्राटदार तपशील",
    department: "Pune Municipal Corporation — Roads Department",
    pioAddress: "Public Information Officer, Roads Department, Pune Municipal Corporation, Shivajinagar, Pune — 411005",
    feeAmount: "₹10 (IPO / DD / cash to Accounts Officer PMC)",
    templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Tender details for road work at [road name / ward number] in PMC limits during [date range].
2. Name of awarded contractor, contract value, and date of work order.
3. Total funds released and expenditure incurred till date.
4. Quality test / inspection reports and third-party audit copies.
5. Current progress status and revised completion date (if delayed).
6. Penalty / liquidated damages imposed for delay, if any.

Applicant: [Your Name]
Address: [Your Address]
Mobile: [Mobile]
Date: [Date]`,
    templateTextLocal: null,
    tips: "Attach ward number or nearest landmark. PMC RTI cell processes most road-works queries within 30 days.",
  },
  {
    topic: "PCMC Property Tax Assessment Details",
    topicLocal: "पीसीएमसी मालमत्ता कर मूल्यांकन तपशील",
    department: "Pimpri-Chinchwad Municipal Corporation — Property Tax Department",
    pioAddress: "Public Information Officer, Property Tax Department, PCMC Main Building, Pimpri — 411018",
    feeAmount: "₹10",
    templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Property tax assessment details for property ID / zone number [ID] for FY [year].
2. Basis of assessment — ARV (Annual Rateable Value) calculation and applicable rates.
3. Past 3 years of demand, payments, and outstanding dues for this property.
4. Any notices issued and their status.
5. Rebates / concessions applied, if any.

Applicant: [Your Name]
Address: [Your Address]
Date: [Date]`,
    templateTextLocal: null,
    tips: "Include property ID (visible on past receipts). PCMC e-RTI portal also available.",
  },
  {
    topic: "Pune Metro (Maha-Metro) Project Status & Land Acquisition",
    topicLocal: "पुणे मेट्रो प्रकल्प स्थिती आणि भूसंपादन",
    department: "Maharashtra Metro Rail Corporation Limited (Maha-Metro)",
    pioAddress: "Public Information Officer, Maha-Metro, Metro Bhavan, Mangalwar Peth, Pune — 411011",
    feeAmount: "₹10",
    templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Current construction status of [Purple / Aqua / Pink] line and station-wise percentage completion.
2. Total land acquired to date, pending acquisitions, and compensation paid.
3. Contractor details and contract value for Phase [1 / 2].
4. Cost overruns and revised project cost vs. original DPR.
5. Expected commissioning date for each section.

Applicant: [Your Name]
Address: [Your Address]
Date: [Date]`,
    templateTextLocal: null,
    tips: "Maha-Metro publishes periodic progress reports. Specify the line/corridor in query 1.",
  },
  {
    topic: "Pune Collectorate Land Records & 7/12 Extract",
    topicLocal: "पुणे जिल्हाधिकारी कार्यालय — जमीन अभिलेख आणि ७/१२ उतारा",
    department: "Office of the District Collector, Pune",
    pioAddress: "Public Information Officer, District Collectorate, Council Hall, Pune — 411001",
    feeAmount: "₹10",
    templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. Certified copy of 7/12 extract and 8-A register for survey number [SN] in village [village name], taluka [taluka].
2. Mutation entries for the said land for past 10 years.
3. Pending revenue cases / encumbrances, if any.
4. Conversion (NA) order copy if land is non-agricultural.

Applicant: [Your Name]
Address: [Your Address]
Date: [Date]`,
    templateTextLocal: null,
    tips: "7/12 is also available free on Mahabhulekh (bhulekh.mahabhumi.gov.in). Use RTI for certified/historical records.",
  },
  {
    topic: "Pune Zilla Parishad — School Infrastructure & Funds Utilization",
    topicLocal: "पुणे जिल्हा परिषद — शाळा पायाभूत सुविधा आणि निधी वापर",
    department: "Pune Zilla Parishad — Education Department",
    pioAddress: "Public Information Officer, Education Department, Pune Zilla Parishad, Kumbhar Wada, Pune — 411011",
    feeAmount: "₹10",
    templateText: `Sub: Application under Right to Information Act, 2005

Dear Public Information Officer,

I request the following information under the RTI Act 2005:

1. List of ZP primary schools in [taluka] with current enrollment and teacher-strength.
2. Infrastructure status — toilets, drinking water, electricity, boundary wall, playground — for each school.
3. Samagra Shiksha / PM POSHAN funds allocated and utilized for FY [year].
4. Mid-day-meal vendor / contractor names and contract value.
5. Details of schools declared "zero enrollment" or "single teacher".

Applicant: [Your Name]
Address: [Your Address]
Date: [Date]`,
    templateTextLocal: null,
    tips: "ZP Pune covers ~3,500 schools. Filter by taluka to get manageable data.",
  },
];

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  let added = 0, skipped = 0;
  for (const t of templates) {
    const existing = await p.rtiTemplate.findFirst({
      where: { districtId: pune.id, topic: t.topic },
    });
    if (existing) { skipped++; continue; }
    await p.rtiTemplate.create({ data: { districtId: pune.id, active: true, ...t } });
    console.log(`  ✅ ${t.topic}`);
    added++;
  }

  console.log(`\nRtiTemplate: ${added} added, ${skipped} skipped`);
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
