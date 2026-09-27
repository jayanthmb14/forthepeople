/**
 * Pune infrastructure seed — 13 verified projects (Prompt 3/6, Seed B).
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * SCOPE: 13 projects covering Metro, Road, Water, Airport. Project 14
 * (Pune-Nashik Semi-High Speed Rail) is DEFERRED per prompt's "skip if
 * unverifiable" directive — has on-off history, no recent 2026-confirmed
 * status in the sources reviewed. Better to ship 13 verified than 14
 * with one uncertain.
 *
 * FIELD MAPPING (prompt → schema):
 *   name, description            → name, description
 *   sector                       → category (schema uses "category"; values
 *                                  aligned with existing Mumbai infra rows:
 *                                  METRO / ROAD / WATER / AIRPORT / RAIL)
 *   approvedCost / budget        → budget (rupees)
 *   status (free-text)           → status (schema is free-text String)
 *   executingAgency              → executingAgency
 *   foundationLaidOn / ...Date   → startDate (primary), actualStartDate,
 *                                  completionDate (mapped per project)
 *   targetCompletionDate         → expectedEnd / revisedEndDate
 *   completionPercent            → progressPct
 *   length / stationCount / etc  → packed into description (no schema col)
 *
 * EXTRA LEGAL-HYGIENE FIELDS (not in schema — packed into sourceUrls Json):
 *   sourceSecondary              → sourceUrls.secondary { publication, url }
 *   disclaimer                   → sourceUrls.disclaimer (string)
 *   subJudice                    → sourceUrls.subJudice (boolean)
 *   hasPublicOpposition          → sourceUrls.hasPublicOpposition (boolean)
 *   environmentalClearanceStatus → sourceUrls.environmentalClearance (string)
 *
 * All amounts in RUPEES. Status values use UPPER_SNAKE_CASE consistent
 * with Mumbai's newer rows (e.g., UNDER_CONSTRUCTION, OPERATIONAL).
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}) → skip-if-exists.
 */

import { PrismaClient } from "../src/generated/prisma";
import { findSameNamed } from "../src/lib/dedupe/match";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type SourceUrls = {
  primary: { publication: string; url: string };
  secondary?: { publication: string; url: string };
  disclaimer: string;
  subJudice: boolean;
  hasPublicOpposition: boolean;
  environmentalClearance: string;
};

type InfraRec = {
  name: string;
  category: string;
  status: string;
  description: string; // packed with length/stations/extras as appropriate
  budget?: number;
  progressPct?: number;
  executingAgency?: string;
  contractor?: string;
  startDate?: Date;
  actualStartDate?: Date;
  expectedEnd?: Date;
  revisedEndDate?: Date;
  completionDate?: Date;
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  announcedDate?: Date;
  approvedDate?: Date;
  originalBudget?: number;
  revisedBudget?: number;
  shortName?: string;
  scope?: string;
  source: string; // "Publication | URL"
  sourceUrls: SourceUrls;
};

const RECORDS: InfraRec[] = [
  // ── 1. Pune Metro Purple Line (Line 1) ─────────────────────
  {
    name: "Pune Metro Purple Line (Line 1)",
    shortName: "Metro Line 1",
    category: "METRO",
    status: "OPERATIONAL",
    description:
      "16.59 km corridor PCMC Bhavan → Swargate. 14 stations: 9 elevated + 5 underground. Inaugurated by PM Modi March 6, 2022; full operations August 2023. [Length: 16.59 km | Stations: 14 | Phase 1 approved cost: ₹11,000 cr combined with Aqua Line, JICA + EIB + AFD funded]",
    budget: 110000000000,
    progressPct: 100,
    executingAgency:
      "Maharashtra Metro Rail Corporation Limited (MahaMetro) — 50:50 State + Central JV",
    startDate: new Date("2016-12-24"),
    completionDate: new Date("2023-08-01"),
    announcedBy: "Narendra Modi",
    announcedByRole: "Prime Minister",
    scope: "DISTRICT",
    source:
      "Wikipedia | https://en.wikipedia.org/wiki/Pune_Metro",
    sourceUrls: {
      primary: {
        publication: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Pune_Metro",
      },
      secondary: {
        publication: "MahaMetro Official",
        url: "https://punemetrorail.org",
      },
      disclaimer:
        "Route, stations, and operational dates per Pune Metro published information. Ridership and fare data not captured in this row.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "EIA clearance obtained, operational",
    },
  },

  // ── 2. Pune Metro Aqua Line (Line 2) ───────────────────────
  {
    name: "Pune Metro Aqua Line (Line 2)",
    shortName: "Metro Line 2",
    category: "METRO",
    status: "OPERATIONAL",
    description:
      "14.66 km fully elevated east-west corridor Vanaz → Ramwadi. 16 stations. Operational since March 2022; full service since August 2023. [Length: 14.66 km | Stations: 16]",
    progressPct: 100,
    executingAgency: "MahaMetro",
    startDate: new Date("2016-12-24"),
    completionDate: new Date("2023-08-01"),
    scope: "DISTRICT",
    source:
      "Wikipedia | https://en.wikipedia.org/wiki/Pune_Metro",
    sourceUrls: {
      primary: {
        publication: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Pune_Metro",
      },
      secondary: {
        publication: "MahaMetro Official",
        url: "https://punemetrorail.org",
      },
      disclaimer:
        "Route and operational dates per MahaMetro published information.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "EIA clearance obtained, operational",
    },
  },

  // ── 3. Pune Metro Pink Line (Line 3) ───────────────────────
  {
    name: "Pune Metro Pink Line (Line 3) — Hinjawadi to Shivajinagar",
    shortName: "Metro Line 3",
    category: "METRO",
    status: "UNDER_CONSTRUCTION",
    description:
      "23.3 km fully elevated corridor, 23 stations, linking Pune's IT hub in Hinjawadi to central Shivajinagar. India's first metro on PPP DBFOT basis under Central Govt's New Metro Rail Policy 2017. Executed as 'Pune IT City Metro Rail Limited' SPV by Tata Realty + Siemens JV. Funding: Private partner 60% (30% equity + 70% debt); Public 40% (Centre + State + PMRDA). [Length: 23.3 km | Stations: 23 | Approved cost: ₹8,313 cr]",
    budget: 83130000000,
    progressPct: 75,
    executingAgency:
      "Originally PMRDA; transferred to MahaMetro October 2025",
    startDate: new Date("2018-12-01"),
    actualStartDate: new Date("2021-11-01"),
    expectedEnd: new Date("2026-03-31"),
    scope: "DISTRICT",
    source:
      "Pune Pulse | https://www.mypunepulse.com/hinjawadi-shivajinagar-metro-expansion-to-be-executed-by-mahametro-23-stations-to-be-completed-by-march-2026/",
    sourceUrls: {
      primary: {
        publication: "Pune Pulse",
        url: "https://www.mypunepulse.com/hinjawadi-shivajinagar-metro-expansion-to-be-executed-by-mahametro-23-stations-to-be-completed-by-march-2026/",
      },
      secondary: {
        publication: "PMRDA Official",
        url: "https://www.pmrda.gov.in/en/pune-metro-line-3/",
      },
      disclaimer:
        "Completion percent and target date approximate — project has faced multiple schedule revisions due to COVID-19 and construction logistics. Trial run July 2025.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "EIA obtained; MIDC land allotted",
    },
  },

  // ── 4. Pune Metro Phase 2 — 5-corridor expansion ───────────
  {
    name: "Pune Metro Phase 2 — 5-corridor expansion",
    shortName: "Metro Phase 2",
    category: "METRO",
    status: "APPROVED_DPR_PENDING",
    description:
      "5 new corridors approved by PMC, DPRs submitted to State + Central governments. Adds ~70 km: (a) Khadakwasla → Kharadi via Swargate & Hadapsar (25.862 km); (b) Paudphata → Manikbagh via Warje (6.118 km); (c) Vanaz → Chandni Chowk (1.112 km); (d) Ramwadi → Wagholi (11.633 km); (e) Kharadi → Pune Airport (newly proposed).",
    executingAgency: "MahaMetro (expected)",
    scope: "DISTRICT",
    source:
      "YoMetro | https://yometro.com/pune-metro-24",
    sourceUrls: {
      primary: {
        publication: "YoMetro",
        url: "https://yometro.com/pune-metro-24",
      },
      secondary: {
        publication: "MahaMetro Official",
        url: "https://punemetrorail.org",
      },
      disclaimer:
        "DPRs under review. Alignments, station counts, costs may change at final approval.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "Pending — DPR stage",
    },
  },

  // ── 5. Pune Outer Ring Road (MSRDC) ────────────────────────
  {
    name: "Pune Outer Ring Road",
    shortName: "Outer Ring Road",
    category: "ROAD",
    status: "UNDER_CONSTRUCTION",
    description:
      "~173 km 8-lane access-controlled expressway. Diverts inter-state heavy vehicle traffic from Pune city center. Connects highways to Mumbai-Pune, Bengaluru, Solapur, Nashik. Eastern 71.35 km + Western 65.45 km. Touches 83 villages across Maval, Khed, Haveli, Purandar, Bhor, Mulshi talukas. Features: 8 tunnels totaling 11.29 km; 500m bridge over Khadakwasla Dam backwaters; 9 contractor packages. Land acquired ~98% (~1,740 hectares). [Length: 173 km | Lanes: 8 | Approved cost: ₹42,000 cr]",
    budget: 420000000000,
    progressPct: 5,
    executingAgency:
      "Maharashtra State Road Development Corporation (MSRDC)",
    actualStartDate: new Date("2025-05-01"),
    expectedEnd: new Date("2027-12-31"),
    scope: "DISTRICT",
    source:
      "CityAir | https://cityair.in/pune-ring-road-latest-update.html",
    sourceUrls: {
      primary: {
        publication: "CityAir",
        url: "https://cityair.in/pune-ring-road-latest-update.html",
      },
      secondary: {
        publication: "1acre.in",
        url: "https://1acre.in/map-layers/maharashtra/pune-ring-roads",
      },
      disclaimer:
        "Land acquisition under RFCTLARR Act 2013. Individual parcel-level compensation disputes outside scope of this summary.",
      subJudice: false,
      hasPublicOpposition: true,
      environmentalClearance:
        "Environmental clearance obtained, construction underway",
    },
  },

  // ── 6. Pune Inner Ring Road (PMRDA) ────────────────────────
  {
    name: "Pune Inner Ring Road",
    shortName: "Inner Ring Road",
    category: "ROAD",
    status: "PLANNED_LAND_ACQUISITION",
    description:
      "83.12 km inner loop connecting PMC and PCMC suburban areas. Reserves 5-meter section for future Metro tracks — first such integrated road+metro design in India. Plans: 42 connecting roads, 17 bridges, 10 tunnels. Touches 44 villages across Khed, Haveli, Mulshi, Maval talukas. [Length: 83.12 km | Approved cost: ₹14,200 cr]",
    budget: 142000000000,
    progressPct: 5,
    executingAgency: "PMRDA",
    expectedEnd: new Date("2028-12-31"),
    scope: "DISTRICT",
    source:
      "CityAir | https://cityair.in/pune-ring-road-latest-update.html",
    sourceUrls: {
      primary: {
        publication: "CityAir",
        url: "https://cityair.in/pune-ring-road-latest-update.html",
      },
      secondary: {
        publication: "PMRDA Official",
        url: "https://www.pmrda.gov.in/en/inner-ring-road/",
      },
      disclaimer:
        "Land acquisition at early stage. Acquisition percentages and farmer consent may change. Target completion 2028–2030. Refer to PMRDA portal for authoritative updates.",
      subJudice: false,
      hasPublicOpposition: true,
      environmentalClearance: "In progress",
    },
  },

  // ── 7. Mula-Mutha River Rejuvenation ───────────────────────
  {
    name: "Mula-Mutha River Rejuvenation Project",
    shortName: "Mula-Mutha Rejuvenation",
    category: "WATER",
    status: "UNDER_CONSTRUCTION",
    description:
      "JICA-funded cleanup via 11 sewage treatment plants (7–127 MLD each) and ~53 km sewage lines. Inaugurated by PM Modi March 6, 2022. Funding: 85% Central + 15% State; JICA loan. [JICA scope cost: ₹990 cr; larger ₹1,470 cr includes bank development]",
    budget: 9900000000,
    progressPct: 70,
    executingAgency: "Pune Municipal Corporation (PMC)",
    startDate: new Date("2022-03-06"),
    expectedEnd: new Date("2026-12-31"),
    announcedBy: "Narendra Modi",
    announcedByRole: "Prime Minister",
    scope: "DISTRICT",
    source:
      "The Bridge Chronicle | https://www.thebridgechronicle.com/news/mula-mutha-river-clean-up-project-70-complete-awaits-critical-funding",
    sourceUrls: {
      primary: {
        publication: "The Bridge Chronicle",
        url: "https://www.thebridgechronicle.com/news/mula-mutha-river-clean-up-project-70-complete-awaits-critical-funding",
      },
      secondary: {
        publication: "Pune Pulse",
        url: "https://www.mypunepulse.com/punes-mula-mutha-river-issues-reach-delhi-rejuvenation-project-to-be-completed-by-2026/",
      },
      disclaimer:
        "Project rejuvenation (STP construction) is distinct from the proposed riverfront development — the latter is subject to documented NGO opposition. Completion percent per PMC publication September 2024; may vary at seed time. Central funding delayed since April 2024; ~₹100 cr contractor dues pending.",
      subJudice: false,
      hasPublicOpposition: true,
      environmentalClearance:
        "MoEFCC clearance obtained; Jal Shakti Ministry monitoring",
    },
  },

  // ── 8. Chhatrapati Sambhaji Raje International Airport ─────
  {
    name: "Chhatrapati Sambhaji Raje International Airport (Purandar)",
    shortName: "Purandar Airport",
    category: "AIRPORT",
    status: "APPROVED_CONSTRUCTION_PENDING",
    description:
      "Greenfield international airport in Purandar taluka, 40–45 km from Pune. Named after Sambhaji Maharaj (born at Purandar fort). Supplements the saturated Lohegaon airport. 75 MPPA capacity; 2 parallel 4,000m × 60m runways; cargo terminal; MRO + Flying Training Organisation; multi-modal connectivity. [Capacity: 75 MPPA | Runways: 2 × 4000m | Area: 2,832 ha original / 1,285 ha revised | Land acquisition cost: ₹4,000 cr]",
    budget: 40000000000,
    executingAgency:
      "Pune (Purandar) International Airport Limited (PIAL) — SPV (CIDCO 51% + MADC 19% + MIDC + PMRDA 30%)",
    approvedDate: new Date("2026-02-10"),
    expectedEnd: new Date("2029-12-31"),
    scope: "DISTRICT",
    source:
      "Punekar News | https://www.punekarnews.in/maharashtra-cabinet-approves-purandar-international-airport-land-acquisition-to-finish-by-june-2026/",
    sourceUrls: {
      primary: {
        publication: "Punekar News",
        url: "https://www.punekarnews.in/maharashtra-cabinet-approves-purandar-international-airport-land-acquisition-to-finish-by-june-2026/",
      },
      secondary: {
        publication: "MADC Official",
        url: "https://www.madcindia.org/pune_overview",
      },
      disclaimer:
        "Maharashtra Cabinet approved February 10, 2026. Land acquisition under RFCTLARR Act 2013. Farmer opposition documented since 2016. Nodal agency: Maharashtra Airport Development Company (MADC). Construction start target 2026-05; operational target 2027–2029. Total cost not yet finalized.",
      subJudice: false,
      hasPublicOpposition: true,
      environmentalClearance:
        "DGCA clearance obtained; MoD NOC reinstated after 2022 cancellation; environmental clearance July 2024",
    },
  },

  // ── 9. Pune Lohegaon Airport Terminal 2 ────────────────────
  {
    name: "Pune International Airport (Lohegaon) — Terminal 2 Expansion",
    shortName: "Lohegaon T2",
    category: "AIRPORT",
    status: "OPERATIONAL",
    description:
      "52,000 sqm second terminal (twice old terminal size); 9 MPPA capacity; 5 aerobridges; 34 counters + 25 self-check-in; 5 baggage carousels. Complements saturated main terminal until Purandar becomes operational. International direct flights to Netherlands and Germany planned mid-2026.",
    progressPct: 100,
    executingAgency: "Airports Authority of India (AAI)",
    scope: "DISTRICT",
    source:
      "Wikipedia | https://en.wikipedia.org/wiki/Pune_Airport",
    sourceUrls: {
      primary: {
        publication: "Wikipedia",
        url: "https://en.wikipedia.org/wiki/Pune_Airport",
      },
      secondary: {
        publication: "Airports Authority of India",
        url: "https://aai.aero/",
      },
      disclaimer:
        "Airport operated by AAI. Terminal 2 figures per AAI published information.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "Operational — all clearances in place",
    },
  },

  // ── 10. 33 Missing Link Roads ──────────────────────────────
  {
    name: "33 Missing Link Roads — PMC Decongestion Program",
    shortName: "Missing Link Roads",
    category: "ROAD",
    status: "UNDER_IMPLEMENTATION",
    description:
      "PMC multi-year rolling program to complete 33 'missing link' road connections decongesting arterial routes. Priority: 15 high-traffic + 17 additional roads. Funded via successive PMC budgets — ₹1,200 cr allocated FY 2025-26, continued in FY 2026-27.",
    budget: 12000000000,
    executingAgency: "Pune Municipal Corporation",
    scope: "DISTRICT",
    source:
      "Saudaghar (PMC) | https://www.saudaghar.com/news-details/pmc-to-present-%E2%82%B911601-crore-budget-for-2025-26-in-march",
    sourceUrls: {
      primary: {
        publication: "Saudaghar (PMC)",
        url: "https://www.saudaghar.com/news-details/pmc-to-present-%E2%82%B911601-crore-budget-for-2025-26-in-march",
      },
      secondary: {
        publication: "The Bridge Chronicle",
        url: "https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97",
      },
      disclaimer:
        "Multi-year program. Project-level details (specific road names, per-road completion) not captured in this summary. Refer to PMC Roads Department for project-wise status.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "Urban road program — not individually assessed",
    },
  },

  // ── 11. Pavana-Indrayani River Rejuvenation ────────────────
  {
    name: "Pavana-Indrayani River Rejuvenation",
    shortName: "Pavana-Indrayani",
    category: "WATER",
    status: "FUNDING_STAGE",
    description:
      "Second-phase river rejuvenation alongside Mula-Mutha. Pavana passes through Pimpri-Chinchwad; Indrayani is sacred to Alandi (Sant Dnyaneshwar's samadhi). CM Fadnavis announced 'origin-to-confluence' cleanup. Funding: 60% JICA (pending approval) + 40% state. [Approved cost: ₹671 cr]",
    budget: 6710000000,
    executingAgency: "PMRDA",
    scope: "DISTRICT",
    source:
      "Pune Pulse | https://www.mypunepulse.com/pune-news-three-phase-river-rejuvenation-project-launched-for-pavana-indrayani-and-mula-mutha-uday-samant/",
    sourceUrls: {
      primary: {
        publication: "Pune Pulse",
        url: "https://www.mypunepulse.com/pune-news-three-phase-river-rejuvenation-project-launched-for-pavana-indrayani-and-mula-mutha-uday-samant/",
      },
      secondary: {
        publication: "PMRDA Official",
        url: "https://www.pmrda.gov.in",
      },
      disclaimer:
        "JICA loan approval pending. Timelines, scope, cost subject to revision post-funding confirmation.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "Assessment under PMRDA review",
    },
  },

  // ── 12. PCMC Tertiary Treatment Plants (100 MLD + 10 MLD) ──
  {
    name: "PCMC Tertiary Sewage Treatment Plants (100 MLD + 10 MLD)",
    shortName: "PCMC TTPs",
    category: "WATER",
    status: "PLANNED_PPP_STAGE",
    description:
      "PCMC tertiary treatment initiative announced in FY 2026-27 budget. 100 MLD capacity TTP for agricultural/industrial reuse + 10 MLD TTP for non-potable residential use. Both on PPP basis. Aims to prevent river pollution.",
    executingAgency:
      "Pimpri-Chinchwad Municipal Corporation via PPP",
    scope: "DISTRICT",
    source:
      "Free Press Journal | https://www.freepressjournal.in/pune/9322-crore-budget-presented-by-pcmc-no-increase-in-property-tax-or-water-charges-in-pimpri-chinchwad-heres-all-you-need-to-know",
    sourceUrls: {
      primary: {
        publication: "Free Press Journal",
        url: "https://www.freepressjournal.in/pune/9322-crore-budget-presented-by-pcmc-no-increase-in-property-tax-or-water-charges-in-pimpri-chinchwad-heres-all-you-need-to-know",
      },
      secondary: {
        publication: "PCMC Budget Document 2026-27 (as presented to Standing Committee February 28, 2026)",
        url: "https://www.pcmcindia.gov.in",
      },
      disclaimer:
        "Project announced in PCMC FY 2026-27 budget. PPP tender and technical specifications pending. Cost and timeline not yet public.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance: "Clearance pending — announcement stage",
    },
  },

  // ── 13. Pavana Water Pipeline ──────────────────────────────
  {
    name: "Pavana Water Pipeline — Parallel line from Pavana Dam to Nigdi",
    shortName: "Pavana Pipeline",
    category: "WATER",
    status: "FUNDED_PLANNING_STAGE",
    description:
      "Parallel pipeline from Pavana Dam to Nigdi (PCMC area) to enhance water supply capacity and reduce leakages. Current city receives 658 MLD; pipeline strengthens distribution. [Approved cost: ₹100 cr; FY 2026-27 allocation: ₹40 cr]",
    budget: 1000000000,
    executingAgency: "Pimpri-Chinchwad Municipal Corporation",
    scope: "DISTRICT",
    source:
      "Lokmat Times | https://www.lokmattimes.com/pune/pimpri-chinchwad-civic-body-approves-rs9322-crore-budget-major-push-for-water-roads-and-urban-projects-a525/",
    sourceUrls: {
      primary: {
        publication: "Lokmat Times",
        url: "https://www.lokmattimes.com/pune/pimpri-chinchwad-civic-body-approves-rs9322-crore-budget-major-push-for-water-roads-and-urban-projects-a525/",
      },
      secondary: {
        publication: "PCMC Official",
        url: "https://www.pcmcindia.gov.in",
      },
      disclaimer:
        "Allocation per PCMC FY 2026-27 budget. Construction timeline and tender details pending.",
      subJudice: false,
      hasPublicOpposition: false,
      environmentalClearance:
        "Water resources clearance via Pavana Dam allocation",
    },
  },
];

export async function seedPuneInfra(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune infrastructure (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      // Same project under another spelling counts as present (src/lib/dedupe/match.ts).
      const existing = findSameNamed(
        await client.infraProject.findMany({ where: { districtId: pune.id }, select: { name: true, shortName: true } }),
        { name: rec.name },
      );
      if (existing) {
        console.log(`  ⏭️  ${rec.name} — already present`);
        skipped++;
        continue;
      }

      await client.infraProject.create({
        data: {
          districtId: pune.id,
          name: rec.name,
          category: rec.category,
          status: rec.status,
          description: rec.description,
          budget: rec.budget ?? null,
          progressPct: rec.progressPct ?? null,
          executingAgency: rec.executingAgency ?? null,
          contractor: rec.contractor ?? null,
          startDate: rec.startDate ?? null,
          actualStartDate: rec.actualStartDate ?? null,
          expectedEnd: rec.expectedEnd ?? null,
          revisedEndDate: rec.revisedEndDate ?? null,
          completionDate: rec.completionDate ?? null,
          announcedBy: rec.announcedBy ?? null,
          announcedByRole: rec.announcedByRole ?? null,
          party: rec.party ?? null,
          announcedDate: rec.announcedDate ?? null,
          approvedDate: rec.approvedDate ?? null,
          originalBudget: rec.originalBudget ?? null,
          revisedBudget: rec.revisedBudget ?? null,
          shortName: rec.shortName ?? null,
          scope: rec.scope ?? "DISTRICT",
          source: rec.source,
          sourceUrls: rec.sourceUrls as unknown as object,
          lastVerifiedAt: new Date(),
        },
      });
      console.log(`  ✅ [${rec.category}/${rec.status}] ${rec.name}`);
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );

    // Flag stats (informational)
    const oppCount = RECORDS.filter((r) => r.sourceUrls.hasPublicOpposition).length;
    const subJudiceCount = RECORDS.filter((r) => r.sourceUrls.subJudice).length;
    console.log(
      `Flags: hasPublicOpposition=${oppCount}, subJudice=${subJudiceCount}`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneInfra()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
