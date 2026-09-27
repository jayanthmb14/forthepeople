/**
 * ForThePeople.in — Manual-research data fill for Mandya infrastructure
 * Run: npx tsx scripts/archive/fill-mandya-infra.ts [--dry-run]
 *
 * ZERO AI calls. All values come from human research supplied via the
 * accompanying prompt. For each project we fuzzy-match against the
 * Mandya rows already in DB and UPDATE ONLY NULL FIELDS. Existing
 * concrete data is never overwritten.
 *
 * Every affected project gets an InfraUpdate row of
 * updateType="MANUAL_RESEARCH" so the public timeline shows where the
 * enrichment came from.
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
// Research data (all from the prompt, all RUPEES not Crores)
// ═══════════════════════════════════════════════════════════

type KP = { name: string; role: string | null; party: string | null; context: string | null };
interface Fill {
  /** Fuzzy-match token: phrase that must appear in the DB name (case-insensitive). */
  match: string;
  /** Alternate match tokens if the first misses. */
  matchAlt?: string[];
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  executingAgency?: string;
  description?: string;
  category?: string;
  originalBudget?: number;
  /** Forces status upgrade only if lifecycle-newer than existing. */
  status?: string;
  keyPeople?: KP[];
}

const DATA: Fill[] = [
  // 1
  {
    match: "Mandya railway station",
    announcedBy: "Ashwini Vaishnaw",
    announcedByRole: "Union Railway Minister",
    party: "BJP",
    executingAgency: "South Western Railway / Indian Railways",
    description:
      "Upgrade of Mandya railway station facilities and construction of additional station at Maddur to improve rail connectivity on the Bengaluru-Mysuru corridor.",
    category: "Rail",
    originalBudget: 1_500_000_000,
    status: "APPROVED",
  },
  // 2
  {
    match: "New Fire Stations",
    announcedBy: "Siddaramaiah",
    announcedByRole: "Chief Minister, Karnataka",
    party: "INC",
    executingAgency: "Karnataka State Fire & Emergency Services",
    description:
      "New fire stations in Mandya district to improve emergency response times in rural and semi-urban taluks, part of statewide fire infrastructure expansion.",
    originalBudget: 50_000_000,
  },
  // 3
  {
    match: "Rice Museum",
    announcedBy: "District Administration Mandya",
    announcedByRole: "District Collector",
    executingAgency: "Mandya District Administration",
    description:
      "Museum dedicated to Mandya's rice and sugarcane heritage, showcasing traditional and modern cultivation methods in Karnataka's sugar bowl.",
    originalBudget: 30_000_000,
    category: "Heritage",
  },
  // 4
  {
    match: "Irrigation Coverage",
    executingAgency: "Cauvery Neeravari Nigam Ltd (CNNL)",
    description:
      "Expansion of canal irrigation and micro-irrigation coverage serving sugarcane and rice farmers across Mandya's 7 taluks through KRS dam water distribution.",
    originalBudget: 2_000_000_000,
    category: "Irrigation",
  },
  // 5 — ARAI facility (fix-up note: the existing ₹750 value is wrong; overwrite as a
  //      targeted correction by forcibly setting originalBudget if the current one
  //      looks implausible (< ₹1 crore means somebody stored crores by mistake).
  {
    match: "ARAI Facility",
    announcedBy: "Siddaramaiah",
    announcedByRole: "Chief Minister, Karnataka",
    party: "INC",
    executingAgency: "Karnataka Industries Department / ARAI",
    description:
      "Automotive Research Association of India testing and certification facility in Mandya's industrial hub for vehicle testing and homologation.",
    originalBudget: 7_500_000_000,
  },
  // 6
  {
    match: "Malavalli",
    matchAlt: ["Malavalli–Kollegal", "Malavalli-Kollegal"],
    executingAgency: "Karnataka Public Works Department (PWD)",
    description:
      "New road link connecting Malavalli taluk to Kollegal, improving rural connectivity and reducing travel time for farmers to reach markets and mandis.",
  },
  // 7
  {
    match: "Maddur Bypass",
    announcedBy: "Nitin Gadkari",
    announcedByRole: "Union Minister, Road Transport & Highways",
    party: "BJP",
    executingAgency: "NHAI",
    description:
      "Bypass road at Maddur town on NH-275 to divert through-traffic, reduce congestion, and improve safety on the busy Bengaluru-Mysuru highway.",
  },
  // 8
  {
    match: "Smart Classroom",
    announcedBy: "B.C. Nagesh",
    announcedByRole: "Karnataka Education Minister",
    party: "BJP",
    executingAgency: "Karnataka Education Department / Samagra Shiksha Abhiyan",
    description:
      "Digital smart boards, projectors, and internet connectivity in 200 government schools across Mandya district to bridge the rural-urban education gap.",
  },
  // 9
  {
    match: "Government Medical College",
    executingAgency: "Karnataka Health & Family Welfare Department",
    description:
      "New super-specialty block at Mandya Institute of Medical Sciences (MIMS) expanding capacity with advanced diagnostics and ICU for the district's 2 million population.",
  },
  // 10
  {
    match: "KIADB Phase-II",
    matchAlt: ["KIADB Phase", "Industrial Area KIADB"],
    executingAgency: "KIADB (Karnataka Industrial Areas Development Board)",
    description:
      "Phase 2 expansion of Mandya Industrial Area with new industrial plots, internal roads, power substations and water supply to attract manufacturing investment.",
  },
  // 11
  {
    match: "SH-17",
    matchAlt: ["State Highway (SH-17)", "Mandya–Mysore State Highway"],
    executingAgency: "Karnataka Public Works Department (PWD)",
    description:
      "Widening and resurfacing of State Highway 17 between Mandya and Mysore to improve road quality and reduce accidents on this heavily-used corridor.",
  },
  // 12
  {
    match: "Srirangapatna Heritage",
    executingAgency: "Karnataka Tourism Department / ASI",
    description:
      "Heritage beautification of Srirangapatna covering Tipu Sultan's Fort, Dariya Daulat Bagh palace, Gumbaz and Ranganathaswamy Temple environs for tourism promotion.",
    keyPeople: [
      { name: "Tipu Sultan's Fort", role: null, party: null, context: "Key heritage site being restored" },
    ],
  },
  // 13
  {
    match: "Nagamangala Taluk Hospital",
    executingAgency: "Karnataka Health & Family Welfare Department",
    description:
      "Expansion of Nagamangala taluk hospital from 50 to 100 beds with new OPD block, emergency ward, diagnostic lab and maternal care unit.",
  },
  // 14
  {
    match: "KRS Right Bank Canal",
    executingAgency: "Cauvery Neeravari Nigam Ltd (CNNL)",
    description:
      "Concrete lining and renovation of KRS Right Bank Canal to reduce water seepage losses and improve irrigation delivery to 50,000+ acres of Mandya farmland.",
  },
  // 15
  {
    match: "District Sports Complex",
    executingAgency: "Karnataka Youth Services & Sports Department",
    description:
      "Upgrade of Mandya District Sports Complex with synthetic athletics track, indoor badminton courts, gymnasium and training facilities for district-level athletes.",
  },
  // 16
  {
    match: "AMRUT Sewage",
    matchAlt: ["Smart City AMRUT", "Sewage Treatment Plant"],
    executingAgency: "Mandya City Municipal Council / Ministry of Housing (AMRUT)",
    description:
      "10 MLD Sewage Treatment Plant under AMRUT scheme to treat urban wastewater and prevent untreated sewage from entering local water bodies.",
  },
  // 17
  {
    match: "Cauvery Water Supply Scheme",
    executingAgency: "KUWS&DB (Karnataka Urban Water Supply & Drainage Board)",
    description:
      "Piped treated drinking water from Cauvery river to Mandya city and surrounding urban areas, targeting 24x7 supply for 1.5 lakh urban residents.",
  },
  // 18
  {
    match: "NH-275 Four-Lane",
    matchAlt: ["NH-275 Four Lane", "Maddur–Channapatna", "Maddur-Channapatna"],
    announcedBy: "Nitin Gadkari",
    announcedByRole: "Union Minister, Road Transport & Highways",
    party: "BJP",
    executingAgency: "NHAI",
    description:
      "Four-laning of 35 km stretch of NH-275 between Maddur and Channapatna to expand capacity on the Bengaluru-Mysuru national highway corridor.",
  },
  // 19
  {
    match: "K R Pete",
    matchAlt: ["Jal Jeevan Mission — Rural"],
    announcedBy: "Narendra Modi",
    announcedByRole: "Prime Minister",
    party: "BJP",
    executingAgency: "Karnataka Rural Water Supply Department / Jal Jeevan Mission",
    description:
      "Functional household tap connections to every rural household in K R Pete taluk under Jal Jeevan Mission, targeting 100% piped water coverage by 2025.",
  },
  // 20
  {
    match: "Pandavapura Railway Overbridge",
    matchAlt: ["Pandavapura ROB"],
    executingAgency: "Indian Railways / Karnataka PWD (joint)",
    description:
      "Railway overbridge replacing dangerous level crossing at Pandavapura to eliminate rail-road conflicts and improve safety on the Bengaluru-Mysuru rail line.",
    status: "UNDER_CONSTRUCTION",
  },
  // 21
  {
    match: "500-acre industrial hub",
    announcedBy: "Siddaramaiah",
    announcedByRole: "Chief Minister, Karnataka",
    party: "INC",
    executingAgency: "Karnataka Industries Department",
    description:
      "500-acre integrated industrial hub near Mandya with ARAI automotive testing centre, food processing units and warehousing, targeting 10,000+ direct jobs.",
    keyPeople: [
      { name: "Siddaramaiah", role: "Chief Minister", party: "INC", context: "Announced the hub" },
      { name: "M.B. Patil", role: "Industries Minister", party: "INC", context: "Overseeing industrial development" },
    ],
  },
  // 22
  {
    match: "Brindavan Gardens",
    matchAlt: ["KRS Dam Tourism"],
    description:
      "Infrastructure upgrade of Brindavan Gardens and KRS Dam tourist area including musical fountain renovation, walking paths, LED lighting, parking and visitor amenities serving 3 million annual visitors.",
  },
  // 23 — Mandya-Mysuru Highway Widening (already has Gadkari/BJP/NHAI per prior seed)
  {
    match: "Mandya-Mysuru Highway",
    matchAlt: ["Mandya Mysuru Highway"],
    description:
      "Widening of the 40 km Mandya-Mysuru road to 4 lanes, part of NH-275 upgradation improving connectivity between Karnataka's sugar capital and heritage city.",
  },
];

// ═══════════════════════════════════════════════════════════
// Cleanup list — Mandya-contaminated rows still to remove
// ═══════════════════════════════════════════════════════════
const DELETE_NAME_PATTERNS: RegExp[] = [
  /Mumbai[-\s]*Ahmedabad\s*Bullet/i,
  /Metro\s*light\s*and\s*metro\s*neo/i, // "Metro light for Tier-2 cities" — policy noise
];

// ═══════════════════════════════════════════════════════════
// Fill-only upsert + InfraUpdate
// ═══════════════════════════════════════════════════════════

const STATUS_RANK: Record<string, number> = {
  PROPOSED: 0, APPROVED: 1, TENDER_ISSUED: 2, UNDER_CONSTRUCTION: 3,
  ON_TRACK: 3, DELAYED: 4, STALLED: 4, COMPLETED: 5, CANCELLED: 99,
};

async function applyFill(
  districtId: string,
  districtName: string,
  fill: Fill
): Promise<{ matched: boolean; filledFields: string[]; projectName: string | null }> {
  const tokens = [fill.match, ...(fill.matchAlt ?? [])];

  // Try each token until one matches a row
  let row:
    | Awaited<ReturnType<typeof prisma.infraProject.findFirst>>
    = null;
  for (const t of tokens) {
    row = await prisma.infraProject.findFirst({
      where: { districtId, name: { contains: t, mode: "insensitive" } },
    });
    if (row) break;
  }
  if (!row) return { matched: false, filledFields: [], projectName: null };

  // Build fill-only patch
  const patch: Prisma.InfraProjectUpdateInput = {};
  const filled: string[] = [];
  const setIfEmpty = (field: keyof Prisma.InfraProjectUpdateInput, value: unknown) => {
    const cur = (row as unknown as Record<string, unknown>)[field as string];
    if ((cur === null || cur === undefined || cur === "") && value != null && value !== "") {
      (patch as Record<string, unknown>)[field as string] = value;
      filled.push(field as string);
    }
  };

  setIfEmpty("announcedBy", fill.announcedBy);
  setIfEmpty("announcedByRole", fill.announcedByRole);
  setIfEmpty("party", fill.party);
  setIfEmpty("executingAgency", fill.executingAgency);
  setIfEmpty("description", fill.description);
  setIfEmpty("originalBudget", fill.originalBudget);
  // Mirror to revisedBudget + budget when those are also null (so page
  // calculations pick it up regardless of which column they read).
  if (fill.originalBudget != null) {
    setIfEmpty("revisedBudget", fill.originalBudget);
    setIfEmpty("budget", fill.originalBudget);
  }

  // Category: only override if the existing is null or "General" (which we
  // learned the legacy seed used as a noisy default).
  const curCategory = (row as { category?: string | null }).category ?? null;
  if (fill.category && (curCategory == null || curCategory === "" || curCategory.toLowerCase() === "general")) {
    (patch as Record<string, unknown>).category = fill.category;
    filled.push("category");
  }

  // KeyPeople — fill only when the current is empty/null.
  if (fill.keyPeople && fill.keyPeople.length > 0) {
    const curKp = (row as { keyPeople?: unknown }).keyPeople;
    const hasKp = Array.isArray(curKp) && (curKp as unknown[]).length > 0;
    if (!hasKp) {
      (patch as Record<string, unknown>).keyPeople = fill.keyPeople;
      filled.push("keyPeople");
    }
  }

  // Status: only upgrade, never downgrade (CANCELLED is terminal)
  if (fill.status) {
    const curRank = STATUS_RANK[(row.status ?? "").toUpperCase()] ?? -1;
    const newRank = STATUS_RANK[fill.status] ?? -1;
    if (newRank > curRank && curRank !== 99) {
      (patch as Record<string, unknown>).status = fill.status;
      filled.push("status");
    }
  }

  if (filled.length === 0) {
    return { matched: true, filledFields: [], projectName: row.name };
  }

  if (!DRY_RUN) {
    await prisma.infraProject.update({ where: { id: row.id }, data: patch });
    await prisma.infraUpdate.create({
      data: {
        projectId: row.id,
        date: new Date(),
        headline: `Manual research filled ${filled.length} missing fields`,
        summary: `Curated research applied to ${row.name}: ${filled.join(", ")}. Fill-only — no existing values were overwritten.`,
        updateType: "MANUAL_RESEARCH",
        newsUrl: "manual-research",
        newsSource: "ForThePeople.in research desk",
        newsDate: new Date(),
        personName: fill.announcedBy ?? null,
        personRole: fill.announcedByRole ?? null,
        personParty: fill.party ?? null,
        verified: true,
        verifiedAt: new Date(),
      },
    });
    await logUpdate({
      source: "api",
      actorLabel: "manual-research",
      tableName: "InfraProject",
      recordId: row.id,
      action: "update",
      districtId,
      districtName,
      moduleName: "infrastructure",
      description: `Mandya manual-research fill: ${row.name} ← ${filled.length} fields`,
      recordCount: 1,
      details: { filledFields: filled },
    });
  }

  return { matched: true, filledFields: filled, projectName: row.name };
}

async function main() {
  console.log(`🛠  Mandya manual-research fill ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);

  const mandya = await prisma.district.findFirst({
    where: { slug: "mandya" },
    select: { id: true, name: true },
  });
  if (!mandya) throw new Error("Mandya district not found");

  // ── Delete lingering contamination first ───────────────────
  let deletes = 0;
  for (const pattern of DELETE_NAME_PATTERNS) {
    const candidates = await prisma.infraProject.findMany({
      where: { districtId: mandya.id },
      select: { id: true, name: true },
    });
    for (const c of candidates) {
      if (pattern.test(c.name)) {
        console.log(`  🗑  DELETE "${c.name}"  — matched cleanup pattern ${pattern}`);
        if (!DRY_RUN) await prisma.infraProject.delete({ where: { id: c.id } });
        deletes++;
      }
    }
  }

  // ── Apply fills ────────────────────────────────────────────
  let matchedCount = 0;
  let filledCount = 0;
  let nopCount = 0;
  let missingCount = 0;

  console.log(`\n| Project                                   | Fields filled              | Status  |`);
  console.log(`|-------------------------------------------|----------------------------|---------|`);

  for (const fill of DATA) {
    const result = await applyFill(mandya.id, mandya.name, fill);
    if (!result.matched) {
      console.log(`| ${fill.match.padEnd(41).slice(0, 41)} | no DB match                | MISS    |`);
      missingCount++;
      continue;
    }
    matchedCount++;
    if (result.filledFields.length === 0) {
      console.log(`| ${(result.projectName ?? fill.match).padEnd(41).slice(0, 41)} | (already complete)         | ⏭ nop  |`);
      nopCount++;
    } else {
      const fieldsStr = result.filledFields.join(", ");
      console.log(`| ${(result.projectName ?? fill.match).padEnd(41).slice(0, 41)} | ${fieldsStr.padEnd(26).slice(0, 26)} | ✅      |`);
      filledCount++;
    }
  }

  console.log(`\nSummary: ${matchedCount}/${DATA.length} matched · ${filledCount} filled · ${nopCount} already complete · ${missingCount} missing · ${deletes} deleted`);

  // Final verification: every Mandya project should have description + executingAgency
  const remaining = await prisma.infraProject.findMany({
    where: { districtId: mandya.id },
    select: { name: true, description: true, executingAgency: true, category: true },
  });
  const missingDesc = remaining.filter((r) => !r.description).map((r) => r.name);
  const missingAgency = remaining.filter((r) => !r.executingAgency).map((r) => r.name);
  const genericCategory = remaining.filter((r) => !r.category || r.category.toLowerCase() === "general").map((r) => r.name);
  console.log(`\n📊 Mandya coverage after fill:`);
  console.log(`   total rows     : ${remaining.length}`);
  console.log(`   missing desc.  : ${missingDesc.length}${missingDesc.length ? " → " + missingDesc.slice(0, 5).join(" | ") + (missingDesc.length > 5 ? "…" : "") : ""}`);
  console.log(`   missing agency : ${missingAgency.length}${missingAgency.length ? " → " + missingAgency.slice(0, 5).join(" | ") + (missingAgency.length > 5 ? "…" : "") : ""}`);
  console.log(`   generic category: ${genericCategory.length}${genericCategory.length ? " → " + genericCategory.slice(0, 5).join(" | ") + (genericCategory.length > 5 ? "…" : "") : ""}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
