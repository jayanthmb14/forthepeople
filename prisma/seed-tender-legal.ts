// Seeds disclaimer clauses into TenderEducationContent with docType='disclaimer'.
// Run AFTER Vercel's build has applied the new docType + stateSlug columns.
//
//   npx tsx prisma/seed-tender-legal.ts
//
// Idempotent — uses slug as the upsert key. Safe to re-run whenever the
// clauses are edited. Adds:
//   - UNIVERSAL clauses (stateSlug=null): cover GFR 2017, GODL-India,
//     RTI §4, DPDP Act 2023, Advocates Act §33, support contact.
//   - KARNATAKA clauses (stateSlug='karnataka'): KTPPA 1999 notes.
//
// To add a new state's clauses: append rows with stateSlug matching that
// state's slug. Content composes in the disclaimer page — universal first,
// then state-specific.

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

type Clause = {
  slug: string;
  section: string;
  orderIndex: number;
  title: string;
  bodyMd: string;
  stateSlug: string | null;
};

const CLAUSES: Clause[] = [
  // ── Universal (all states) ────────────────────────────────────────────
  {
    slug: "disclaimer-universal-source-data",
    section: "DISCLAIMER_SOURCE_DATA",
    orderIndex: 1,
    stateSlug: null,
    title: "1. Source data only",
    bodyMd:
      "Every tender shown here is aggregated from a **public Government of India or state-level procurement portal**. No data is generated, inferred, or editorialised by ForThePeople.in.",
  },
  {
    slug: "disclaimer-universal-not-official",
    section: "DISCLAIMER_NOT_OFFICIAL",
    orderIndex: 2,
    stateSlug: null,
    title: "2. Not an official government service",
    bodyMd:
      "ForThePeople.in is an **independent civic platform** operated by Jayanth M B. For binding legal status of any tender, always verify on the source portal. We carry no government authority.",
  },
  {
    slug: "disclaimer-universal-factual-flags",
    section: "DISCLAIMER_FACTUAL_FLAGS",
    orderIndex: 3,
    stateSlug: null,
    title: "3. Factual red-flag labels",
    bodyMd:
      "Labels such as *'single bidder'*, *'short window'*, or *'price close to estimate'* are **mathematical observations** computed from published data. They are compared against rules like GFR 2017 Rule 173, CVC guidelines, or state procurement acts. **They are not allegations.** Legitimate reasons may exist for any individual case.",
  },
  {
    slug: "disclaimer-universal-eligibility-informational",
    section: "DISCLAIMER_ELIGIBILITY",
    orderIndex: 4,
    stateSlug: null,
    title: "4. Eligibility wizard is informational",
    bodyMd:
      "The 'Can I apply?' wizard runs **entirely in your browser** and matches against tender-published criteria. **Nothing on this page is legal advice under the Advocates Act §33.** Consult an enrolled advocate for interpretation of any tender clause.",
  },
  {
    slug: "disclaimer-universal-personal-data",
    section: "DISCLAIMER_PII",
    orderIndex: 5,
    stateSlug: null,
    title: "5. Personal data protection (DPDP Act 2023)",
    bodyMd:
      "We automatically redact Aadhaar numbers, phone numbers, personal email addresses, and individual PAN numbers from any ingested document before storage. Company PANs are retained as public procurement records. If you believe personal data has leaked through our redactor, contact support@forthepeople.in immediately.",
  },
  {
    slug: "disclaimer-universal-takedown",
    section: "DISCLAIMER_TAKEDOWN",
    orderIndex: 6,
    stateSlug: null,
    title: "6. Takedown & grievance",
    bodyMd:
      "**7-working-day SLA** per IT Rules 2021. Email **support@forthepeople.in** with subject line *Takedown Request: Tender [id]*. Winning bidders in awarded tenders may request 7-year anonymisation of individual-person records. Decisions are logged.",
  },
  {
    slug: "disclaimer-universal-licence",
    section: "DISCLAIMER_LICENCE",
    orderIndex: 7,
    stateSlug: null,
    title: "7. Licence",
    bodyMd:
      "Aggregated tender data is republished under the **Government Open Data Licence — India (GODL-India, February 2017)** and the **Copyright Act §52(1)(q)** government-works exemption. Original source URLs and publish timestamps are preserved on every record.",
  },

  // ── Karnataka-specific ────────────────────────────────────────────────
  {
    slug: "disclaimer-karnataka-ktppa",
    section: "DISCLAIMER_KTPPA",
    orderIndex: 1,
    stateSlug: "karnataka",
    title: "Karnataka Transparency in Public Procurements Act 1999",
    bodyMd:
      "For tenders published by Karnataka state bodies, we follow the **KTPPA 1999** definition of transparency obligations. Section 4 of the Act requires every department to publish procurement notices; Section 8 covers grievance redressal by the Karnataka Procurement Regulatory Authority (KPRA). **Bidders or observers who identify procedural irregularities may approach the KPRA directly** — we are not a complaint-forwarding service.",
  },
  {
    slug: "disclaimer-karnataka-portals",
    section: "DISCLAIMER_KARNATAKA_PORTALS",
    orderIndex: 2,
    stateSlug: "karnataka",
    title: "Karnataka portal sources",
    bodyMd:
      "Data for Karnataka tenders is aggregated from: **KPPP (eproc.karnataka.gov.in)** for all state and municipal bodies; **CPPP (eprocure.gov.in)** for central departments with Karnataka scope; **IREPS (ireps.gov.in)** for South Western Railway; **defproc.gov.in** for DRDO labs; **eprocurebel.co.in** for Bharat Electronics; and **eproc.hal-india.co.in** for Hindustan Aeronautics. Each tender card links back to its source.",
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    let ok = 0;
    for (const c of CLAUSES) {
      await prisma.tenderEducationContent.upsert({
        where: { slug: c.slug },
        update: {
          section: c.section,
          orderIndex: c.orderIndex,
          title: c.title,
          bodyMd: c.bodyMd,
          docType: "disclaimer",
          stateSlug: c.stateSlug,
        },
        create: {
          slug: c.slug,
          section: c.section,
          orderIndex: c.orderIndex,
          title: c.title,
          bodyMd: c.bodyMd,
          docType: "disclaimer",
          stateSlug: c.stateSlug,
          translationPending: true,
        },
      });
      ok++;
    }
    console.log(`[seed-tender-legal] upserted ${ok} disclaimer clause(s)`);
    console.log(
      `  universal: ${CLAUSES.filter((c) => c.stateSlug === null).length}, ` +
        `karnataka: ${CLAUSES.filter((c) => c.stateSlug === "karnataka").length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
