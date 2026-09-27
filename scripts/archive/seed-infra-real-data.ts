/**
 * ForThePeople.in — Seed real infrastructure project metadata
 * Run: npx tsx scripts/archive/seed-infra-real-data.ts [--dry-run]
 *
 * Strategy:
 *   - 31 major projects across 9 active districts.
 *   - FUZZY MATCH existing InfraProject rows by shortName / title
 *     (case-insensitive). UPDATE only — fill NULL fields.
 *   - NEVER overwrite existing non-null values.
 *   - If no match: CREATE a new row.
 *   - Writes an InfraUpdate row (updateType="SEED", newsUrl="seed-data")
 *     for each affected project to record provenance.
 *   - logUpdate() per district.
 *
 * No AI calls. Pure DB writes with the same fill-only semantics that
 * the news pipeline uses, so nothing the news cron has already enriched
 * gets trampled.
 */

import "../_env";
import { PrismaClient, Prisma } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../../src/lib/update-log";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

// ═══════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════

type KP = { name: string; role: string | null; party: string | null; context: string | null };
interface SeedProject {
  districtSlug: string;
  name: string;
  shortName: string;
  category: string;
  status: string;
  description?: string;
  scope?: "DISTRICT" | "STATE" | "NATIONAL";
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  executingAgency?: string;
  keyPeople?: KP[];
  originalBudget?: number;
  revisedBudget?: number;
  progressPct?: number;
  startDate?: string;
  originalEndDate?: string;
  revisedEndDate?: string;
  completionDate?: string;
}

const SEEDS: SeedProject[] = [
  // ── MUMBAI (maharashtra) ────────────────────────────────
  { districtSlug: "mumbai", name: "Mumbai Metro Line 3 (Aqua Line)", shortName: "Metro Line 3", category: "Metro",
    description: "33.5 km underground metro with 27 stations connecting Colaba to SEEPZ, designed to cut South-Central Mumbai commute by ~40 minutes for an estimated 1.7 million daily commuters.",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "MMRC (Mumbai Metro Rail Corporation)",
    keyPeople: [
      { name: "Ashwini Bhide", role: "MD, MMRC", party: null, context: "Project head" },
      { name: "Devendra Fadnavis", role: "Former CM", party: "BJP", context: "Approved during tenure" },
    ],
    originalBudget: 330_000_000_000, revisedBudget: 372_760_000_000,
    status: "UNDER_CONSTRUCTION", progressPct: 62,
    startDate: "2016-03-01", originalEndDate: "2025-12-31", revisedEndDate: "2027-12-31" },

  { districtSlug: "mumbai", name: "Mumbai Coastal Road", shortName: "Coastal Road", category: "Road",
    description: "10.58 km coastal freeway between Marine Drive and the Bandra-Worli Sea Link, intended to compress the South-West Mumbai commute from ~90 minutes to ~10 minutes.",
    announcedBy: "Devendra Fadnavis", announcedByRole: "Chief Minister, Maharashtra", party: "BJP",
    executingAgency: "BMC",
    keyPeople: [{ name: "Iqbal Singh Chahal", role: "Former Municipal Commissioner", party: null, context: "Execution oversight" }],
    originalBudget: 126_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 85,
    startDate: "2018-10-01", originalEndDate: "2023-12-31", revisedEndDate: "2025-06-30" },

  { districtSlug: "mumbai", name: "Mumbai Trans Harbour Link (MTHL / Atal Setu)", shortName: "Trans Harbour Link", category: "Bridge",
    description: "21.8 km sea bridge across Thane Creek connecting Sewri (Mumbai) to Nhava Sheva (Navi Mumbai). India's longest sea bridge, opened to traffic in January 2024.",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "MMRDA",
    originalBudget: 177_000_000_000, status: "COMPLETED", progressPct: 100, completionDate: "2024-01-12" },

  { districtSlug: "mumbai", name: "Dharavi Redevelopment Project", shortName: "Dharavi Redevelopment", category: "Housing",
    description: "Redevelopment of ~600 acres of Dharavi (Asia's largest informal settlement) into permanent housing for ~1 million residents, with surplus land released for commercial use.",
    announcedBy: "Eknath Shinde", announcedByRole: "Chief Minister, Maharashtra", party: "Shiv Sena",
    executingAgency: "Adani Group (PPP with DRPPL)",
    keyPeople: [{ name: "Gautam Adani", role: "Chairman, Adani Group", party: null, context: "Selected developer" }],
    originalBudget: 200_000_000_000, status: "APPROVED", originalEndDate: "2031-12-31" },

  { districtSlug: "mumbai", name: "Mumbai-Ahmedabad Bullet Train", shortName: "Bullet Train", category: "Rail",
    description: "508 km high-speed rail corridor between Mumbai and Ahmedabad targeting 320 km/h operating speeds, intended to bring the journey down from ~7 hours to ~2 hours.",
    scope: "STATE",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "NHSRCL",
    keyPeople: [{ name: "Vivek Kumar Gupta", role: "MD, NHSRCL", party: null, context: "Project head" }],
    originalBudget: 1_100_000_000_000, revisedBudget: 1_600_000_000_000,
    status: "UNDER_CONSTRUCTION", progressPct: 30,
    startDate: "2017-09-14", originalEndDate: "2023-12-31", revisedEndDate: "2028-12-31" },

  { districtSlug: "mumbai", name: "Mumbai Metro Line 2A (Dahisar to DN Nagar)", shortName: "Metro Line 2A", category: "Metro",
    description: "18.6 km elevated metro between Dahisar and DN Nagar with 17 stations, serving the western suburbs corridor and integrating with WR suburban rail.",
    executingAgency: "MMRDA",
    originalBudget: 65_000_000_000, status: "COMPLETED", progressPct: 100, completionDate: "2024-04-01" },

  { districtSlug: "mumbai", name: "Goregaon-Mulund Link Road", shortName: "Goregaon Mulund Link", category: "Road",
    description: "12.2 km east-west arterial connecting Goregaon to Mulund through twin tunnels under Sanjay Gandhi National Park, cutting the existing 75-minute crossing to ~25 minutes.",
    executingAgency: "BMC",
    originalBudget: 63_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 40 },

  { districtSlug: "mumbai", name: "Sewri-Nhava Sheva Sea Bridge", shortName: "Sewri Nhava", category: "Bridge",
    description: "Sea bridge linking Mumbai's Sewri docks to Nhava Sheva — see also Trans Harbour Link / Atal Setu.",
    executingAgency: "MMRDA",
    status: "COMPLETED", progressPct: 100 },

  // ── BENGALURU URBAN (karnataka) ─────────────────────────
  { districtSlug: "bengaluru-urban", name: "Bengaluru Metro Phase 2 (Green + Purple Extensions)", shortName: "Metro Phase 2", category: "Metro",
    description: "73.95 km Namma Metro extension across the Green and Purple lines (62 new stations) to connect Whitefield, Silk Board, Kanakapura Road and Kengeri to the city's core network.",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister, Karnataka", party: "INC",
    executingAgency: "BMRCL",
    originalBudget: 267_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 70,
    startDate: "2018-01-01", originalEndDate: "2025-12-31" },

  { districtSlug: "bengaluru-urban", name: "Bengaluru Suburban Rail Project (BSRP)", shortName: "Suburban Rail", category: "Rail",
    description: "148 km commuter rail network across four corridors connecting Bengaluru to satellite towns (KSR City, Whitefield, Yelahanka, Devanahalli) with 57 stations.",
    announcedBy: "B.S. Yediyurappa", announcedByRole: "Former CM Karnataka", party: "BJP",
    executingAgency: "K-RIDE",
    originalBudget: 158_760_000_000, status: "UNDER_CONSTRUCTION", progressPct: 15,
    startDate: "2021-06-01", originalEndDate: "2027-12-31" },

  { districtSlug: "bengaluru-urban", name: "Peripheral Ring Road Bengaluru", shortName: "Peripheral Ring Road", category: "Road",
    description: "73 km eight-lane access-controlled ring road on the city's periphery, intended to divert through-traffic away from the urban core. Repeatedly delayed over land acquisition.",
    executingAgency: "BDA",
    originalBudget: 210_000_000_000, status: "DELAYED", progressPct: 5 },

  { districtSlug: "bengaluru-urban", name: "Bengaluru-Mysuru Expressway", shortName: "Mysuru Expressway", category: "Road",
    description: "118 km ten-lane expressway between Bengaluru and Mysuru that brought travel time down from ~3.5 hours to ~75 minutes. Inaugurated March 2023.",
    scope: "STATE",
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister, Road Transport", party: "BJP",
    executingAgency: "NHAI",
    originalBudget: 84_000_000_000, status: "COMPLETED", progressPct: 100, completionDate: "2023-03-12" },

  { districtSlug: "bengaluru-urban", name: "NICE Road", shortName: "NICE Road", category: "Road",
    description: "44 km tolled peripheral expressway built and operated by NICE under a BOT concession. Bypasses the city core for traffic between Hosur Road, Mysuru Road, Tumakuru Road.",
    executingAgency: "Nandi Infrastructure Corridor Enterprises",
    status: "COMPLETED", progressPct: 100 },

  { districtSlug: "bengaluru-urban", name: "Bengaluru Airport Terminal 2", shortName: "Airport Terminal 2", category: "Airport",
    description: "255,000 sq m \"Terminal in a Garden\" addition at Kempegowda International Airport, expanding annual capacity from 25M to 70M passengers. Commercial operations started Nov 2022.",
    executingAgency: "BIAL",
    originalBudget: 50_000_000_000, status: "COMPLETED", progressPct: 100, completionDate: "2022-11-11" },

  // ── HYDERABAD (telangana) ───────────────────────────────
  { districtSlug: "hyderabad", name: "Hyderabad Metro Rail", shortName: "Metro Rail", category: "Metro",
    description: "70 km, three-line elevated metro across Hyderabad's tech corridors (Miyapur-LB Nagar, JBS-MGBS, Nagole-Raidurg). One of the world's largest PPP urban rail projects.",
    executingAgency: "L&T Metro Rail Hyderabad",
    originalBudget: 205_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 80, startDate: "2012-01-01" },

  { districtSlug: "hyderabad", name: "Regional Ring Road (RRR) Hyderabad", shortName: "Regional Ring Road", category: "Road",
    description: "338 km eight-lane outer-orbit expressway encircling the Hyderabad metropolitan region (~30 km outside the existing ORR), connecting 12 satellite towns.",
    announcedBy: "K. Chandrashekar Rao", announcedByRole: "Former CM Telangana", party: "BRS",
    executingAgency: "NHAI + Telangana R&B",
    originalBudget: 160_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 25 },

  { districtSlug: "hyderabad", name: "Musi Riverfront Development", shortName: "Musi Riverfront", category: "Water",
    description: "55 km riverfront restoration of the Musi river through central Hyderabad — sewage interception, parks, embankments, housing rehabilitation for displaced settlements.",
    announcedBy: "Revanth Reddy", announcedByRole: "Chief Minister, Telangana", party: "INC",
    executingAgency: "HMDA",
    originalBudget: 150_000_000_000, status: "PROPOSED" },

  // ── CHENNAI (tamil-nadu) ────────────────────────────────
  { districtSlug: "chennai", name: "Chennai Metro Phase 2", shortName: "Metro Phase 2", category: "Metro",
    description: "118.9 km, three-corridor metro expansion connecting Madhavaram, SIPCOT and Sholinganallur with 128 stations across north-south and east-west axes of Chennai.",
    executingAgency: "CMRL",
    originalBudget: 630_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 20,
    startDate: "2022-01-01", originalEndDate: "2028-12-31" },

  { districtSlug: "chennai", name: "Chennai Peripheral Ring Road", shortName: "Peripheral Ring Road", category: "Road",
    description: "133 km six-lane access-controlled bypass between Ennore Port and Mamallapuram, designed to remove inter-state freight traffic from Chennai's inner road network.",
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI",
    originalBudget: 100_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 35 },

  // ── NEW DELHI (delhi) ───────────────────────────────────
  { districtSlug: "new-delhi", name: "Delhi Metro Phase 4", shortName: "Metro Phase 4", category: "Metro",
    description: "65.2 km Delhi Metro extension across six corridors (e.g. Janakpuri West-RK Ashram, Aerocity-Tughlakabad), adding 45 stations to relieve airport, ring-road and outer-Delhi bottlenecks.",
    executingAgency: "DMRC",
    originalBudget: 249_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 25, startDate: "2022-01-01" },

  { districtSlug: "new-delhi", name: "Delhi-Meerut RRTS (Namo Bharat)", shortName: "RRTS", category: "Rail",
    description: "82 km regional rapid transit corridor between Sarai Kale Khan (Delhi) and Modipuram (Meerut), with trains running up to 180 km/h. India's first operational RRTS.",
    scope: "STATE",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "NCRTC",
    originalBudget: 305_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 60 },

  { districtSlug: "new-delhi", name: "Dwarka Expressway", shortName: "Dwarka Expressway", category: "Road",
    description: "29 km eight-lane access-controlled expressway between Shiv-Murti (Delhi) and Kherki Daula (Gurugram), India's first urban elevated expressway. Inaugurated March 2024.",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "NHAI",
    originalBudget: 90_000_000_000, status: "COMPLETED", completionDate: "2024-03-11" },

  // ── KOLKATA (west-bengal) ───────────────────────────────
  { districtSlug: "kolkata", name: "Kolkata Metro East-West Corridor", shortName: "East-West Metro", category: "Metro",
    description: "16.6 km east-west metro between Howrah Maidan and Salt Lake Sector V, including India's first under-river metro tunnel beneath the Hooghly. 12 stations.",
    executingAgency: "KMRC",
    originalBudget: 88_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 55,
    startDate: "2009-01-01", revisedEndDate: "2026-12-31" },

  { districtSlug: "kolkata", name: "Joka-BBD Bagh Metro (Purple Line)", shortName: "Joka Metro", category: "Metro",
    description: "16 km elevated metro between Joka and BBD Bagh with 14 stations, connecting south-west Kolkata's residential belts to the central business district.",
    executingAgency: "RVNL",
    originalBudget: 47_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 40 },

  // ── MANDYA (karnataka) ──────────────────────────────────
  { districtSlug: "mandya", name: "KRS Dam Renovation", shortName: "KRS Dam", category: "Water",
    description: "Strengthening and instrumentation of the 1932-built Krishna Raja Sagara dam — Mandya's main irrigation source covering ~1.25 lakh hectares of paddy and sugarcane.",
    executingAgency: "Karnataka Water Resources Department",
    originalBudget: 5_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 60 },

  { districtSlug: "mandya", name: "Mandya-Mysuru Highway Widening", shortName: "Mandya Mysuru Highway", category: "Road",
    description: "Six-laning of the 60 km NH-275 stretch between Mandya and Mysuru as part of the Bengaluru-Mysuru Expressway corridor — completed alongside the main expressway in 2023.",
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI",
    status: "COMPLETED", progressPct: 100 },

  // ── MYSURU (karnataka) ──────────────────────────────────
  { districtSlug: "mysuru", name: "Mysuru Ring Road", shortName: "Ring Road", category: "Road",
    description: "47 km outer ring road encircling Mysuru city, designed to keep heavy vehicles off the heritage core and reduce intra-city congestion across the eight inbound highways.",
    executingAgency: "NHAI",
    originalBudget: 35_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 30 },

  { districtSlug: "mysuru", name: "Chamundi Hill Development", shortName: "Chamundi Hill", category: "Tourism",
    description: "Pilgrimage and tourism upgrade for Chamundi Hill — staircase repair, ropeway feasibility, traffic management and amenities for the ~3 million annual visitors.",
    executingAgency: "MUDA",
    status: "UNDER_CONSTRUCTION", progressPct: 50 },

  // ── LUCKNOW (uttar-pradesh) ─────────────────────────────
  { districtSlug: "lucknow", name: "Lucknow Metro", shortName: "Lucknow Metro", category: "Metro",
    description: "23 km North-South metro corridor (Munshipulia to CCS Airport) with 22 stations, India's fastest-built metro project to be commissioned within 4.5 years from groundbreaking.",
    executingAgency: "UPMRC",
    originalBudget: 67_000_000_000, status: "UNDER_CONSTRUCTION", progressPct: 70, startDate: "2014-09-01" },

  { districtSlug: "lucknow", name: "Lucknow-Agra Expressway", shortName: "Agra Expressway", category: "Road",
    description: "302 km six-lane access-controlled expressway between Lucknow and Agra (extendable to eight lanes), reducing the inter-city journey from ~7 hours to ~3.5 hours.",
    scope: "STATE",
    announcedBy: "Akhilesh Yadav", announcedByRole: "Former CM, UP", party: "SP",
    executingAgency: "UPEIDA",
    originalBudget: 145_000_000_000, status: "COMPLETED", completionDate: "2016-11-21" },

  { districtSlug: "lucknow", name: "Gomti Riverfront Development", shortName: "Gomti Riverfront", category: "Water",
    description: "8 km Gomti riverfront beautification across central Lucknow — promenades, fountains, parks, sewage diversion. Stalled by litigation since the 2017 government change.",
    announcedBy: "Akhilesh Yadav", announcedByRole: "Former CM, UP", party: "SP",
    executingAgency: "Lucknow Development Authority",
    originalBudget: 15_280_000_000, status: "STALLED", progressPct: 60 },
];

// ═══════════════════════════════════════════════════════════
// Upsert logic (fill-only, never clobber)
// ═══════════════════════════════════════════════════════════

function parseDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function upsertSeed(
  seed: SeedProject,
  districtId: string,
  districtName: string
): Promise<"created" | "updated" | "skipped"> {
  // Fuzzy match
  const namePrefix = seed.name.split(/\s+/).slice(0, 3).join(" ");
  const existing = await prisma.infraProject.findFirst({
    where: {
      districtId,
      OR: [
        { shortName: { equals: seed.shortName, mode: "insensitive" } },
        { name: { contains: seed.shortName, mode: "insensitive" } },
        { name: { contains: namePrefix, mode: "insensitive" } },
      ],
    },
  });

  const startDate = parseDate(seed.startDate);
  const originalEndDate = parseDate(seed.originalEndDate);
  const revisedEndDate = parseDate(seed.revisedEndDate);
  const completionDate = parseDate(seed.completionDate);

  if (!existing) {
    // CREATE path
    if (DRY_RUN) return "created";
    const created = await prisma.infraProject.create({
      data: {
        districtId,
        name: seed.name,
        shortName: seed.shortName,
        description: seed.description ?? null,
        category: seed.category,
        scope: seed.scope ?? "DISTRICT",
        status: seed.status,
        announcedBy: seed.announcedBy ?? null,
        announcedByRole: seed.announcedByRole ?? null,
        party: seed.party ?? null,
        executingAgency: seed.executingAgency ?? null,
        keyPeople: seed.keyPeople
          ? (seed.keyPeople as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        originalBudget: seed.originalBudget ?? null,
        revisedBudget: seed.revisedBudget ?? seed.originalBudget ?? null,
        budget: seed.originalBudget ?? null,
        progressPct: seed.progressPct ?? null,
        actualStartDate: startDate,
        startDate,
        originalEndDate,
        expectedEnd: originalEndDate,
        revisedEndDate,
        completionDate,
        announcedDate: startDate ?? new Date(),
        source: "seed-data",
        sourceUrls: ["seed-data"] as unknown as Prisma.InputJsonValue,
        lastVerifiedAt: new Date(),
        verificationCount: 1,
      },
    });
    await prisma.infraUpdate.create({
      data: {
        projectId: created.id,
        date: new Date(),
        headline: `Seed record created for ${seed.name}`,
        summary: "Project seeded with curated metadata (announced-by, executing agency, budget figures, timeline). News-driven updates will supersede these fields as articles appear.",
        updateType: "SEED",
        personName: seed.announcedBy ?? null,
        personRole: seed.announcedByRole ?? null,
        personParty: seed.party ?? null,
        budgetChange: seed.originalBudget ?? null,
        progressPct: seed.progressPct ?? null,
        statusChange: seed.status,
        newsUrl: "seed-data",
        newsSource: "ForThePeople.in curated seed",
        newsDate: new Date(),
        verified: false,
      },
    });
    return "created";
  }

  // UPDATE path — fill-only, never clobber
  const patch: Prisma.InfraProjectUpdateInput = {};
  const setIfEmpty = <K extends keyof Prisma.InfraProjectUpdateInput>(k: K, v: unknown) => {
    const cur = (existing as unknown as Record<string, unknown>)[k as string];
    if ((cur === null || cur === undefined) && v !== null && v !== undefined) {
      (patch as Record<string, unknown>)[k as string] = v;
    }
  };
  setIfEmpty("shortName", seed.shortName);
  setIfEmpty("description", seed.description);
  setIfEmpty("scope", seed.scope);
  setIfEmpty("announcedBy", seed.announcedBy);
  setIfEmpty("announcedByRole", seed.announcedByRole);
  setIfEmpty("party", seed.party);
  setIfEmpty("executingAgency", seed.executingAgency);
  setIfEmpty("originalBudget", seed.originalBudget);
  setIfEmpty("revisedBudget", seed.revisedBudget ?? seed.originalBudget);
  setIfEmpty("budget", seed.originalBudget);
  setIfEmpty("progressPct", seed.progressPct);
  setIfEmpty("actualStartDate", startDate);
  setIfEmpty("startDate", startDate);
  setIfEmpty("originalEndDate", originalEndDate);
  setIfEmpty("expectedEnd", originalEndDate);
  setIfEmpty("revisedEndDate", revisedEndDate);
  setIfEmpty("completionDate", completionDate);
  setIfEmpty("announcedDate", startDate);

  // keyPeople is JSON — fill only if null/empty, never override non-empty arrays
  const curKp = (existing as unknown as { keyPeople?: unknown }).keyPeople;
  const hasExistingKp = Array.isArray(curKp) && (curKp as unknown[]).length > 0;
  if (!hasExistingKp && seed.keyPeople && seed.keyPeople.length > 0) {
    (patch as Record<string, unknown>).keyPeople = seed.keyPeople;
  }

  // Status: only upgrade to a more advanced state, never downgrade
  const STATUS_RANK: Record<string, number> = {
    PROPOSED: 0, APPROVED: 1, TENDER_ISSUED: 2, UNDER_CONSTRUCTION: 3,
    ON_TRACK: 3, DELAYED: 4, STALLED: 4, COMPLETED: 5, CANCELLED: 99,
  };
  const curRank = STATUS_RANK[(existing.status ?? "").toUpperCase()] ?? -1;
  const seedRank = STATUS_RANK[seed.status] ?? -1;
  if (seedRank > curRank && curRank !== 99) (patch as Record<string, unknown>).status = seed.status;

  if (Object.keys(patch).length === 0) {
    return "skipped";
  }

  if (DRY_RUN) return "updated";

  await prisma.infraProject.update({ where: { id: existing.id }, data: patch });

  await prisma.infraUpdate.create({
    data: {
      projectId: existing.id,
      date: new Date(),
      headline: `Seed enrichment for ${existing.name} — filled ${Object.keys(patch).join(", ")}`,
      summary: `Curated seed values applied (fill-only, no overwrite). Fields populated: ${Object.keys(patch).join(", ")}.`,
      updateType: "SEED",
      personName: seed.announcedBy ?? null,
      personRole: seed.announcedByRole ?? null,
      personParty: seed.party ?? null,
      newsUrl: "seed-data",
      newsSource: "ForThePeople.in curated seed",
      newsDate: new Date(),
      verified: false,
    },
  });

  await logUpdate({
    source: "api",
    actorLabel: "seed-script",
    tableName: "InfraProject",
    recordId: existing.id,
    action: "update",
    districtId,
    districtName,
    moduleName: "infrastructure",
    description: `Seeded ${seed.shortName}: filled ${Object.keys(patch).length} fields`,
    recordCount: 1,
    details: { patchedFields: Object.keys(patch) },
  });

  return "updated";
}

// ═══════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log(`🌱 Real-infra seed ${DRY_RUN ? "(DRY-RUN)" : ""} — ${SEEDS.length} projects across 9 districts\n`);

  // Pre-fetch all active districts once
  const dRows = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
  });
  const bySlug = new Map(dRows.map((d) => [d.slug, d]));

  const perDistrict: Record<string, { updated: number; created: number; skipped: number }> = {};

  for (const seed of SEEDS) {
    const d = bySlug.get(seed.districtSlug);
    if (!d) {
      console.log(`  ⏭  ${seed.districtSlug} not active — skipping "${seed.name}"`);
      continue;
    }
    const result = await upsertSeed(seed, d.id, d.name);
    perDistrict[d.slug] ??= { updated: 0, created: 0, skipped: 0 };
    perDistrict[d.slug][result]++;
    const marker = result === "created" ? "✨" : result === "updated" ? "✅" : "⏭";
    console.log(`  ${marker} [${d.slug}] ${seed.shortName.padEnd(26)} ${result}`);
  }

  // Summary table
  console.log(`\n📊 Summary ${DRY_RUN ? "(DRY-RUN, no writes)" : ""}\n`);
  console.log(`| District         | Updated | Created | Skipped | With People Now |`);
  console.log(`|------------------|---------|---------|---------|-----------------|`);
  for (const d of dRows) {
    const r = perDistrict[d.slug] ?? { updated: 0, created: 0, skipped: 0 };
    const withPeople = await prisma.infraProject.count({
      where: { districtId: d.id, NOT: { announcedBy: null } },
    });
    console.log(
      `| ${d.slug.padEnd(16)} | ${String(r.updated).padStart(7)} | ${String(r.created).padStart(7)} | ${String(r.skipped).padStart(7)} | ${String(withPeople).padStart(15)} |`
    );
  }
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
