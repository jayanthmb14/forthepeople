/**
 * Pune schools seed — 3 aggregate admin-body rows + 5 notable institutions.
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * SCOPE: Pune has 3,546+ ZP primary schools alone plus thousands more
 * under PMC and private/aided. Individual-school seeding at scale is out
 * of scope for this prompt. This seed captures (a) administrative-body
 * aggregates so a user sees "the district runs ~this much education"
 * at a glance, and (b) 5 flagship higher-ed institutions that users
 * expect to see listed.
 *
 * SCHEMA GAPS FLAGGED:
 *   - No description/source/sourceSecondary/disclaimer columns on School.
 *   - No `administrativeBody` column.
 *   - No `schoolCount` column for aggregate rows — using `students` /
 *     `teachers` (populated only for aggregates) and storing ancillary
 *     prose in `address`.
 *   These are packed into `address` (free-text) to keep data honest while
 *   avoiding a schema migration.
 *
 * TYPE / LEVEL values: free-text in schema (Mumbai uses mixed-case:
 * "PRIVATE", "GOVERNMENT", "AIDED", "Kendriya Vidyalaya", "University",
 * levels "Primary"/"Secondary"/"Senior Secondary"/"College"/"University").
 * This seed introduces `type: "AGGREGATE"` for the 3 admin-body rows and
 * uses existing Mumbai conventions for the 5 institutions.
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}) → skip-if-exists.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type SchoolRec = {
  name: string;
  nameLocal?: string;
  type: string;
  level: string;
  students?: number;
  teachers?: number;
  studentTeacherRatio?: number;
  address: string; // packed: actual-address :: description :: primary source :: secondary source :: disclaimer
  udiseCode?: string;
};

const RECORDS: SchoolRec[] = [
  // ══════════════════════════════════════════════════════════
  //   Administrative aggregates (3 rows)
  // ══════════════════════════════════════════════════════════

  {
    name: "Pune Zilla Parishad — Primary Education Department",
    type: "AGGREGATE",
    level: "Primary",
    students: 238395,
    teachers: 11228,
    studentTeacherRatio: 21.2, // 238395 / 11228 = 21.23
    address: [
      "Aggregate record — Pune ZP runs 3,546 primary schools (Classes 1-7) across 14 talukas.",
      "Programs: PM POSHAN mid-day meal (Classes 1-8); free textbooks + uniforms (EWS); helper/reader/traveling allowances for differently-abled students.",
      "Primary source: Pune Zilla Parishad Official | https://www.punezp.gov.in/en/primary-education-2/",
      "Secondary source: Pune ZP FY 2025-26 budget cites 45,000 beneficiaries under direct benefit schemes.",
      "Disclaimer: School counts and enrolment figures drawn from Pune ZP published information. For taluka-level breakdown, refer to punezp.gov.in.",
    ].join(" // "),
  },

  {
    name: "Pune Zilla Parishad — Secondary Education Department",
    type: "AGGREGATE",
    level: "Secondary",
    address: [
      "Aggregate record — Pune ZP Secondary Education manages all government-approved secondary schools in the district: aided, unaided, permanently unaided, self-financed. Covers standards 5-10, 5-12, 8-10, 8-12 across multiple mediums.",
      "Education Officer (Secondary) heads both Pay Unit and Education Department, working under the Maharashtra School Education Department.",
      "Primary source: Pune Zilla Parishad Official | https://www.punezp.gov.in/en/secondary-education-2/",
      "Secondary source: Maharashtra School Education Department — https://school.maharashtra.gov.in/",
      "Disclaimer: Individual school counts not published at aggregate level. Refer to punezp.gov.in secondary education page for authoritative structure.",
    ].join(" // "),
  },

  {
    name: "Pune Municipal Corporation — Education Department",
    type: "AGGREGATE",
    level: "Mixed (Primary + Secondary)",
    address: [
      "Aggregate record — PMC operates primary and secondary schools across 15 ward offices.",
      "State government announced CBSE syllabus adoption in government schools; basic infrastructure readiness (security cameras, compound walls) is a priority per PMC FY 2025-26 and 2026-27 budgets.",
      "Primary source: Pune Municipal Corporation Official | https://www.pmc.gov.in/en/b/secondary-and-technical-education-school-list",
      "Secondary source: PMC Budget FY 2026-27 | https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97",
      "Disclaimer: PMC school list updated periodically. For current list, refer to pmc.gov.in.",
    ].join(" // "),
  },

  // ══════════════════════════════════════════════════════════
  //   Notable higher-ed institutions (5 rows)
  // ══════════════════════════════════════════════════════════

  {
    name: "Savitribai Phule Pune University (SPPU)",
    nameLocal: "सावित्रीबाई फुले पुणे विद्यापीठ",
    type: "University",
    level: "University",
    address: [
      "Ganeshkhind Road, Pune — 411007.",
      "State university founded 1949; renamed 2014 in honour of Savitribai Phule.",
      "Affiliates ~800 colleges across Pune, Ahilyanagar, and Nashik districts.",
      "Primary source: SPPU Official | https://www.unipune.ac.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/Savitribai_Phule_Pune_University",
      "Disclaimer: Affiliated-college count varies annually; refer to unipune.ac.in for current figures.",
    ].join(" // "),
  },

  {
    name: "Fergusson College",
    type: "AIDED",
    level: "College",
    address: [
      "Fergusson College Road, Shivajinagar, Pune — 411004.",
      "Autonomous college run by the Deccan Education Society; founded 1885. Associated historically with Lokmanya Bal Gangadhar Tilak, Gopal Krishna Gokhale, and B. R. Ambedkar.",
      "Primary source: Fergusson College Official | https://www.fergusson.edu/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/Fergusson_College",
      "Disclaimer: Affiliated with SPPU; grants own degrees under autonomous status.",
    ].join(" // "),
  },

  {
    name: "College of Engineering, Pune (COEP Technological University)",
    type: "GOVERNMENT",
    level: "University",
    address: [
      "Wellesley Road, Shivajinagar, Pune — 411005.",
      "Unitary state technological university (since 2022); founded 1854 as Poona Engineering Class and Mechanical School — among India's oldest engineering institutions.",
      "Primary source: COEP Technological University Official | https://www.coeptech.ac.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/College_of_Engineering,_Pune",
      "Disclaimer: Offers undergraduate, graduate and doctoral programmes across engineering and allied disciplines.",
    ].join(" // "),
  },

  {
    name: "Film and Television Institute of India (FTII)",
    type: "CENTRAL_GOVT",
    level: "Higher Education",
    address: [
      "Law College Road, Pune — 411004.",
      "Autonomous institute under the Ministry of Information and Broadcasting, Government of India; founded 1960 on the premises of erstwhile Prabhat Film Company studios.",
      "Primary source: FTII Official | https://ftii.ac.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/Film_and_Television_Institute_of_India",
      "Disclaimer: Offers postgraduate diplomas in film and television. Admissions via national-level JET entrance exam.",
    ].join(" // "),
  },

  {
    name: "National Defence Academy (NDA)",
    type: "CENTRAL_GOVT",
    level: "University",
    address: [
      "Khadakwasla, Pune district — 411023.",
      "Joint-services (Army / Navy / Air Force) pre-commissioning training institution of the Indian Armed Forces; founded 1954. Premier tri-service academy; cadets complete 3-year training before branch-specific academies.",
      "Primary source: NDA Official | https://www.nda.nic.in/",
      "Secondary source: Wikipedia | https://en.wikipedia.org/wiki/National_Defence_Academy_(India)",
      "Disclaimer: Admissions via UPSC NDA & NA examination held twice yearly. Under Ministry of Defence. Located in Pune district (Khadakwasla taluk).",
    ].join(" // "),
  },
];

export async function seedPuneSchools(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune schools (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      const existing = await client.school.findFirst({
        where: { districtId: pune.id, name: rec.name },
      });
      if (existing) {
        console.log(`  ⏭️  ${rec.name} — already present`);
        skipped++;
        continue;
      }

      await client.school.create({
        data: {
          districtId: pune.id,
          name: rec.name,
          nameLocal: rec.nameLocal ?? null,
          type: rec.type,
          level: rec.level,
          students: rec.students ?? null,
          teachers: rec.teachers ?? null,
          studentTeacherRatio: rec.studentTeacherRatio ?? null,
          address: rec.address,
          udiseCode: rec.udiseCode ?? null,
        },
      });
      console.log(`  ✅ [${rec.type}/${rec.level}] ${rec.name}`);
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneSchools()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
