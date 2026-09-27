/**
 * Maharashtra STATE-level Infrastructure Projects
 *
 * 10 major mega-projects of Maharashtra significance (not confined to a
 * single district). Anchored to Pune districtId for storage but marked
 * `scope: "STATE"` so state-aware UI can aggregate.
 *
 * Dedup-checked against existing DB:
 *   - Mumbai Trans Harbour Link (Atal Setu) — already in DB, NOT repeated
 *   - Mumbai-Ahmedabad Bullet Train — already in DB, NOT repeated
 *   - Mumbai Coastal Road (South) / Versova-Bhayander — already in DB, NOT repeated
 *   - Mumbai-Pune Expressway — already in DB, NOT repeated
 *   - Pune Outer/Inner Ring Road — district-scope, NOT state-level
 *
 * IDEMPOTENT — findFirst by (districtId, name, scope) + skip.
 */

import { PrismaClient } from "../src/generated/prisma";
import { findSameNamed } from "../src/lib/dedupe/match";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const rows = [
  {
    name: "Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg",
    shortName: "Samruddhi Expressway",
    nameLocal: "हिंदुहृदयसम्राट बाळासाहेब ठाकरे महाराष्ट्र समृद्धी महामार्ग",
    category: "Roads & Highways",
    status: "Under Construction",
    budget: 55335_00_00_000, // ₹55,335 cr
    progressPct: 85,
    executingAgency: "Maharashtra State Road Development Corporation (MSRDC)",
    announcedBy: "Devendra Fadnavis", announcedByRole: "Chief Minister (then)", party: "BJP",
    actualStartDate: new Date("2019-01-01"),
    expectedEnd: new Date("2026-12-31"),
    description: "701-km access-controlled expressway Mumbai ↔ Nagpur via 10 districts. Phases 1 (Nagpur-Shirdi) + 2 (Shirdi-Bharvir) operational; final leg Igatpuri-Amane under construction.",
    source: "MSRDC | https://www.msrdc.org/Site/Home",
    sourceUrls: { primary: "https://www.msrdc.org/Site/Home", secondary: "https://en.wikipedia.org/wiki/Samruddhi_Mahamarg" },
  },
  {
    name: "Navi Mumbai International Airport (NMIA)",
    shortName: "NMIA",
    nameLocal: "नवी मुंबई आंतरराष्ट्रीय विमानतळ",
    category: "Aviation",
    status: "Under Construction",
    budget: 16700_00_00_000, // ₹16,700 cr
    progressPct: 80,
    executingAgency: "NMIAL (Adani Airports + CIDCO JV)",
    announcedBy: "Prithviraj Chavan", announcedByRole: "Chief Minister (then)", party: "INC",
    actualStartDate: new Date("2021-10-01"),
    expectedEnd: new Date("2025-12-31"),
    description: "Greenfield international airport at Ulwe, Navi Mumbai. First phase (Terminal 1, 20 MPPA capacity) targeted for operations late 2025; eventual capacity 90 MPPA across two terminals.",
    source: "CIDCO | https://cidco.maharashtra.gov.in/Airport.aspx",
    sourceUrls: { primary: "https://cidco.maharashtra.gov.in/Airport.aspx", secondary: "https://en.wikipedia.org/wiki/Navi_Mumbai_International_Airport" },
  },
  {
    name: "Vadhavan Port",
    shortName: "Vadhavan Port",
    nameLocal: "वाढवण बंदर",
    category: "Ports & Shipping",
    status: "Approved",
    budget: 76220_00_00_000, // ₹76,220 cr
    progressPct: 5,
    executingAgency: "Vadhavan Port Project Ltd (JNPA 74% + MMB 26%)",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    announcedDate: new Date("2024-06-19"),
    approvedDate: new Date("2024-06-19"),
    expectedEnd: new Date("2034-12-31"),
    description: "All-weather greenfield deep-draft mega-port at Vadhavan, Palghar district. 298 MTPA capacity; targets top-10 global port status. Union cabinet approval June 2024.",
    source: "JNPA | https://www.jnport.gov.in",
    sourceUrls: { primary: "https://www.jnport.gov.in", secondary: "https://en.wikipedia.org/wiki/Vadhavan_Port" },
  },
  {
    name: "Shaktipeeth Expressway (Proposed)",
    shortName: "Shaktipeeth Expressway",
    nameLocal: "शक्तिपीठ महामार्ग",
    category: "Roads & Highways",
    status: "Planned",
    budget: 86300_00_00_000, // ₹86,300 cr
    progressPct: 0,
    executingAgency: "Maharashtra State Road Development Corporation (MSRDC)",
    announcedBy: "Eknath Shinde", announcedByRole: "Chief Minister (then)", party: "Shiv Sena",
    announcedDate: new Date("2024-01-01"),
    expectedEnd: new Date("2030-12-31"),
    description: "Proposed 802-km expressway Pavnar (Wardha) → Sindhudurg, connecting 3 Shakti Peethas + 12 districts. Project under protest from farmers in Kolhapur/Sangli over land acquisition; status uncertain.",
    source: "MSRDC | https://www.msrdc.org/Site/Home",
    sourceUrls: {
      primary: "https://www.msrdc.org/Site/Home",
      disclaimer: "Project faces organized farmer opposition in Western Maharashtra. Final alignment and timeline subject to change.",
      hasPublicOpposition: true,
    },
  },
  {
    name: "Versova-Bandra Sea Link",
    shortName: "Versova-Bandra Sea Link",
    nameLocal: "वर्सोवा-वांद्रे सी लिंक",
    category: "Bridges",
    status: "Under Construction",
    budget: 11332_00_00_000, // ₹11,332 cr
    progressPct: 55,
    executingAgency: "Maharashtra State Road Development Corporation (MSRDC)",
    actualStartDate: new Date("2018-04-01"),
    expectedEnd: new Date("2028-12-31"),
    description: "17.17-km cable-stayed bridge over Arabian Sea from Versova to Bandra, extending the existing Bandra-Worli Sea Link. Part of Mumbai's Western Coastal Connector corridor.",
    source: "MSRDC | https://www.msrdc.org/Site/Home",
    sourceUrls: { primary: "https://www.msrdc.org/Site/Home", secondary: "https://en.wikipedia.org/wiki/Versova%E2%80%93Bandra_Sea_Link" },
  },
  {
    name: "Mumbai Metro Line 3 (Aqua Line)",
    shortName: "Mumbai Metro Line 3",
    nameLocal: "मुंबई मेट्रो लाईन ३",
    category: "Metro & Rail",
    status: "Partially Operational",
    budget: 37276_00_00_000, // ₹37,276 cr
    progressPct: 90,
    executingAgency: "Mumbai Metro Rail Corporation Limited (MMRC)",
    actualStartDate: new Date("2016-08-01"),
    completionDate: new Date("2024-10-07"), // Phase 1 opened
    description: "33.5-km fully-underground metro line Cuffe Parade ↔ Aarey JVLR. Phase 1 (Aarey-BKC) opened October 2024; Phase 2A (BKC-Acharya Atre Chowk) opened March 2025; full line end of 2026.",
    source: "MMRC | https://www.mmrcl.com/",
    sourceUrls: { primary: "https://www.mmrcl.com/", secondary: "https://en.wikipedia.org/wiki/Line_3_(Mumbai_Metro)" },
  },
  {
    name: "Thane Creek Bridge III",
    shortName: "Thane Creek Bridge III",
    nameLocal: "ठाणे खाडी पूल ३",
    category: "Bridges",
    status: "Operational",
    budget: 774_00_00_000, // ₹774 cr
    progressPct: 100,
    executingAgency: "National Highways Authority of India (NHAI)",
    completionDate: new Date("2024-10-01"),
    description: "1.8-km parallel bridge on Mumbai-Pune NH-48 across Thane Creek. Added 8 additional lanes, easing chronic congestion at the Airoli bottleneck.",
    source: "NHAI | https://nhai.gov.in/",
    sourceUrls: { primary: "https://nhai.gov.in/" },
  },
  {
    name: "Nagpur Metro Phase 2",
    shortName: "Nagpur Metro Phase 2",
    nameLocal: "नागपूर मेट्रो फेज २",
    category: "Metro & Rail",
    status: "Under Construction",
    budget: 6708_00_00_000, // ₹6,708 cr
    progressPct: 35,
    executingAgency: "Maharashtra Metro Rail Corporation (Maha-Metro)",
    actualStartDate: new Date("2023-01-01"),
    expectedEnd: new Date("2027-12-31"),
    description: "43.8-km extension of Nagpur Metro across 4 corridors: MIHAN, Hingna, Kamptee, Kanhan. Approved by Union Cabinet Feb 2023; adds 32 stations.",
    source: "Maha-Metro | https://www.metrorailnagpur.com/",
    sourceUrls: { primary: "https://www.metrorailnagpur.com/" },
  },
  {
    name: "Jalyukt Shivar Abhiyan 2.0",
    shortName: "Jalyukt Shivar 2.0",
    nameLocal: "जलयुक्त शिवार अभियान २.०",
    category: "Water & Irrigation",
    status: "Ongoing",
    budget: 650_00_00_000, // ₹650 cr (FY allocation)
    progressPct: 45,
    executingAgency: "Maharashtra Water Conservation Department",
    announcedBy: "Eknath Shinde", announcedByRole: "Chief Minister (then)", party: "Shiv Sena",
    announcedDate: new Date("2022-12-01"),
    description: "Relaunched water conservation programme — watershed treatment, desilting, farm ponds, check dams across ~5,000 drought-prone villages. Phase 2 targets 5 lakh hectare treatment.",
    source: "Maharashtra Govt Water Conservation Dept | https://mahawss.nic.in/",
    sourceUrls: {
      primary: "https://mahawss.nic.in/",
      disclaimer: "Phase 1 (2014-19) faced CAG audit findings re: impact measurement. Phase 2 redesigned with convergence and third-party verification.",
    },
  },
  {
    name: "Western Dedicated Freight Corridor (Maharashtra Section)",
    shortName: "WDFC Maharashtra",
    nameLocal: "पश्चिम समर्पित माल वाहतूक कॉरिडॉर",
    category: "Freight Rail",
    status: "Partially Operational",
    budget: 21500_00_00_000, // approx MH section
    progressPct: 90,
    executingAgency: "Dedicated Freight Corridor Corporation of India (DFCCIL)",
    actualStartDate: new Date("2008-10-01"),
    expectedEnd: new Date("2026-06-30"),
    description: "1,506-km freight-only double-track electrified railway JNPT Mumbai ↔ Dadri. Maharashtra segment (Vaitarna → Vasai → JNPT) extensively operational; final JNPT-Vaitarna terminal links in commissioning.",
    source: "DFCCIL | https://dfccil.com/",
    sourceUrls: { primary: "https://dfccil.com/", secondary: "https://en.wikipedia.org/wiki/Western_Dedicated_Freight_Corridor" },
  },
];

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  let added = 0, skipped = 0;
  for (const r of rows) {
    // Same project under another spelling counts as present (src/lib/dedupe/match.ts).
    const existing = findSameNamed(
      await p.infraProject.findMany({ where: { districtId: pune.id }, select: { name: true, shortName: true } }),
      { name: r.name },
    );
    if (existing) {
      console.log(`  ⏭️  ${r.shortName} — already present`);
      skipped++;
      continue;
    }
    await p.infraProject.create({ data: { districtId: pune.id, scope: "STATE", ...r } });
    console.log(`  ✅ [${r.category}] ${r.shortName} — ${r.status}`);
    added++;
  }

  console.log(`\nMH State Infra: ${added} added, ${skipped} skipped`);
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
