/**
 * ForThePeople.in — Manual-research data fill for Mysuru infrastructure
 * Run: npx tsx scripts/archive/fill-mysuru-infra.ts [--dry-run]
 *
 * Same semantics as fill-mandya-infra.ts:
 *   - Fuzzy match against existing rows by name (primary + alternates)
 *   - UPDATE only null fields, never overwrite concrete data
 *   - Mirror originalBudget → revisedBudget → budget when those are null
 *   - Category override only when current is null / empty / "General"
 *   - Status upgrade only forward in the lifecycle
 *   - One InfraUpdate per fill with updateType="MANUAL_RESEARCH"
 *
 * Zero AI calls.
 */

import "../_env";
import { PrismaClient, Prisma } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../../src/lib/update-log";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

type KP = { name: string; role: string | null; party: string | null; context: string | null };
interface Fill {
  match: string;
  matchAlt?: string[];
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  executingAgency?: string;
  description?: string;
  category?: string;
  originalBudget?: number;
  status?: string;
  keyPeople?: KP[];
}

const DATA: Fill[] = [
  { match: "Mysuru Metro Rail Phase 1", matchAlt: ["Mysuru Metro Rail Phase"],
    announcedBy: "B.S. Yediyurappa", announcedByRole: "Former Chief Minister, Karnataka", party: "BJP",
    executingAgency: "K-RIDE", category: "Metro",
    description: "12 km light metro connecting Mysuru Railway Station to key city areas, first phase to reduce road congestion in India's heritage city." },

  { match: "Mysuru Station to Yadavagiri", matchAlt: ["Mysuru Metro Phase 1 — Mysuru Station"],
    executingAgency: "K-RIDE", category: "Metro",
    description: "Metro corridor from Mysuru Junction to Yadavagiri covering the central business district and government office area." },

  { match: "Mysuru Metro Phase 2", matchAlt: ["City to Airport"],
    executingAgency: "K-RIDE / JICA", category: "Metro",
    description: "Extended metro from city centre to Mandakalli Airport, JICA-funded DPR for improved airport connectivity." },

  { match: "Mysuru Peripheral Ring Road", matchAlt: ["Mysuru PRR"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister, Road Transport", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "116 km ring road around Mysuru to divert heavy through-traffic, reduce city congestion and connect satellite towns." },

  { match: "Mysuru Outer Ring Road (ORR) Phase 2", matchAlt: ["Mysuru Outer Ring Road", "Mysuru ORR"],
    executingAgency: "NHAI", category: "Roads",
    description: "Phase 2 of outer ring road connecting Nanjangud Road to Hunsur Road for industrial traffic orbital movement." },

  { match: "Mysuru Airport Terminal", matchAlt: ["Runway Expansion"],
    announcedBy: "Jyotiraditya Scindia", announcedByRole: "Union Civil Aviation Minister", party: "BJP",
    executingAgency: "AAI", category: "Airport",
    description: "New terminal, extended runway and night landing facilities at Mandakalli Airport for larger aircraft operations." },

  { match: "Mysuru Airport Height Clearance",
    executingAgency: "AAI / MUDA", category: "Airport",
    description: "Height restriction enforcement around Mandakalli Airport flight path ensuring safe aircraft approach corridors." },

  { match: "Chamundi Hills Infrastructure", matchAlt: ["Chamundi Hills"],
    executingAgency: "MUDA", category: "Tourism",
    description: "Road, footpath, lighting, parking and heritage conservation upgrades around Chamundeswari Temple on Chamundi Hill." },

  { match: "Chamundi Hill temple",
    executingAgency: "Muzrai Department", category: "Heritage",
    description: "Temple complex construction works halted by Karnataka High Court pending heritage impact assessment of the sacred hill." },

  { match: "New Railway Station Redevelopment", matchAlt: ["Mysuru New Railway Station"],
    announcedBy: "Ashwini Vaishnaw", announcedByRole: "Union Railway Minister", party: "BJP",
    executingAgency: "South Western Railway / IRSDC", category: "Rail",
    description: "World-class redevelopment of Mysuru Junction with modern amenities, commercial spaces and heritage architecture preservation." },

  { match: "Mysuru–Chamarajanagar Rail", matchAlt: ["Mysuru-Chamarajanagar", "Chamarajanagar Rail Line"],
    executingAgency: "South Western Railway", category: "Rail",
    description: "Doubling of single-track rail line to Chamarajanagar to increase train frequency and reduce delays." },

  { match: "Mysuru Suburban Rail", matchAlt: ["Link to Bengaluru"],
    announcedBy: "B.S. Yediyurappa", announcedByRole: "Former CM", party: "BJP",
    executingAgency: "K-RIDE", category: "Rail",
    description: "Suburban rail connecting Mysuru to Bengaluru via Mandya and Ramanagara for daily commuters." },

  { match: "Mysuru–Bengaluru Elevated Expressway", matchAlt: ["Mysuru-Bengaluru Elevated", "Mysuru end"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "Mysuru-end section of the 118 km 10-lane expressway reducing inter-city travel from 3 hours to 75 minutes." },

  { match: "NH-275 Mysuru–Bengaluru 6-Laning", matchAlt: ["NH-275 Mysuru", "6-Laning (Mysuru Section)"],
    executingAgency: "NHAI", category: "Roads",
    description: "6-laning of NH-275 at Mysuru end to handle increased traffic from the new expressway." },

  { match: "Mysuru–Nanjangud 4-Lane Highway", matchAlt: ["Mysuru-Nanjangud"],
    executingAgency: "Karnataka PWD", category: "Roads",
    description: "Four-laning of the 24 km road to Nanjangud's industrial area for heavy goods vehicle traffic." },

  { match: "Hunsur–Periyapatna", matchAlt: ["Hunsur-Periyapatna"],
    executingAgency: "Karnataka PWD", category: "Roads",
    description: "Widening and resurfacing of state highway between Hunsur and Periyapatna taluks for rural connectivity." },

  { match: "Hyder Ali Road",
    executingAgency: "Mysuru City Corporation", category: "Roads",
    description: "Widening of Hyder Ali Road in central Mysuru to ease traffic near the heritage market area." },

  { match: "Mysuru Road Elevated Corridor",
    executingAgency: "Karnataka PWD / NHAI", category: "Roads",
    description: "Elevated road corridor to grade-separate heavy traffic intersections and reduce signal wait times." },

  { match: "Mysuru Road Flyover Extension",
    executingAgency: "Karnataka PWD", category: "Flyover",
    description: "Flyover extension to eliminate bottlenecks at key junctions as part of traffic decongestion plan." },

  { match: "Mysuru Flyover Projects",
    executingAgency: "Karnataka PWD", category: "Flyover",
    description: "Multiple flyovers at KRS Road, Hunsur Road and Nanjangud Road junctions to reduce signal delays." },

  { match: "Kukkarahalli Junction", matchAlt: ["Kukkarahalli Junction (LC1)", "Four lane underpass at Kukkarahalli"],
    executingAgency: "South Western Railway / Karnataka PWD", category: "Roads",
    description: "Four-lane underpass replacing the dangerous Kukkarahalli level crossing near the university area." },

  { match: "Rail Underbridge near Kukkarahalli",
    executingAgency: "South Western Railway / Karnataka PWD", category: "Rail",
    description: "Railway underbridge near Kukkarahalli Lake replacing level crossing for the high-traffic university zone." },

  { match: "H.D. Kote Wildlife", matchAlt: ["Wildlife Corridor Road Safety"],
    executingAgency: "Karnataka Forest Department / PWD", category: "Environment",
    description: "Road safety barriers along wildlife corridors near H.D. Kote preventing animal-vehicle collisions near Nagarahole and Bandipur." },

  { match: "Cauvery Stage 5 Water Supply", matchAlt: ["Cauvery Stage 5"],
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister, Karnataka", party: "INC",
    executingAgency: "KUWS&DB", category: "Water",
    description: "Fifth stage Cauvery water supply targeting 450 MLD capacity for Mysuru's expanding population." },

  { match: "Nanjangud Town Water Supply",
    executingAgency: "KUWS&DB", category: "Water",
    description: "Water supply augmentation for Nanjangud town serving growing industrial area and residents." },

  { match: "Hunsur Town Water Supply",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "Karnataka Rural Water Supply / JJM", category: "Water",
    description: "Piped drinking water to every Hunsur household under Jal Jeevan Mission national scheme." },

  { match: "KRS Dam Strengthening", matchAlt: ["Dam Safety Works"],
    executingAgency: "Karnataka Water Resources Department", category: "Water",
    description: "Structural strengthening of the 93-year-old KRS Dam ensuring long-term safety for Mysuru and Mandya districts." },

  { match: "KRS Dam Heritage & Tourism",
    executingAgency: "Karnataka Tourism Department", category: "Tourism",
    description: "Tourism circuit around KRS Dam with heritage walks, viewpoints, boating and Srirangapatna connectivity." },

  { match: "Brindavan Gardens Renovation", matchAlt: ["Fountain Upgrade"],
    executingAgency: "CNNL", category: "Tourism",
    description: "Complete renovation of iconic Brindavan Gardens with new musical fountains, LED lighting and landscaping." },

  { match: "Mysuru STP", matchAlt: ["80 MLD Sewage Treatment"],
    executingAgency: "KUWS&DB", category: "Sewage",
    description: "80 MLD STP treating urban wastewater before discharge to prevent Kabini and Cauvery river pollution." },

  { match: "Nanjangud Industrial Area STP",
    executingAgency: "KSPCB / KIADB", category: "Sewage",
    description: "Industrial effluent treatment plant for Nanjangud's pharma and food processing cluster." },

  { match: "Mysuru Solid Waste",
    executingAgency: "MCC / Smart City SPV", category: "Environment",
    description: "Solid waste processing upgrade to maintain Mysuru's record as India's cleanest city." },

  { match: "Mysuru Lakes Development", matchAlt: ["14 lakes"],
    executingAgency: "MUDA / MCC", category: "Parks & Lakes",
    description: "Restoration of 14 urban lakes including desilting, fencing, walking paths and biodiversity conservation." },

  { match: "Kukkarahalli Lake Rejuvenation",
    executingAgency: "Mysuru Smart City SPV", category: "Parks & Lakes",
    description: "Rejuvenation of Kukkarahalli Lake with walkways, biodiversity zone, bird sanctuary and water quality improvement." },

  { match: "Heritage Zone Rejuvenation", matchAlt: ["UNESCO"],
    executingAgency: "MUDA / ASI / Karnataka Heritage Commission", category: "Heritage",
    description: "Heritage precinct rejuvenation around Mysore Palace, Devaraja Market and Chamaraja Circle supporting UNESCO bid." },

  { match: "Heritage Signage", matchAlt: ["Interpretation Centres"],
    executingAgency: "Mysuru Smart City SPV", category: "Heritage",
    description: "Heritage signage in English and Kannada with interpretation centres at key monuments for tourists." },

  { match: "Nagarahole Eco-Tourism",
    executingAgency: "Karnataka Forest Department / Jungle Lodges", category: "Tourism",
    description: "Eco-tourism infrastructure in Nagarahole National Park with nature trails, watch towers and safari routes." },

  { match: "Kabini River Safari", matchAlt: ["Kabini Safari"],
    executingAgency: "Karnataka Forest Department", category: "Tourism",
    description: "Safari bridge across Kabini River and eco-lodge zone near Nagarahole for premium wildlife tourism." },

  { match: "Mysuru Zoo Master Plan", matchAlt: ["Zoo Master Plan"],
    executingAgency: "Sri Chamarajendra Zoological Gardens", category: "Tourism",
    description: "Phase 2 of India's oldest zoo with new enclosures, nocturnal house and conservation breeding centre." },

  { match: "Smart Traffic Management", matchAlt: ["Traffic Management System — Mysuru"],
    executingAgency: "Mysuru Smart City SPV / Traffic Police", category: "Traffic",
    description: "AI-based adaptive traffic signals at 50+ junctions with CCTV monitoring and violation detection." },

  { match: "Integrated Command & Control Centre", matchAlt: ["ICCC Mysuru"],
    executingAgency: "Mysuru Smart City SPV", category: "Telecom",
    description: "Central command centre integrating CCTV, traffic, emergency response and city services monitoring." },

  { match: "Wi-Fi Zone", matchAlt: ["1,000 hotspots"],
    executingAgency: "Mysuru Smart City SPV", category: "Telecom",
    description: "Free public Wi-Fi at 1,000 hotspots covering tourist areas, bus stops, parks and government offices." },

  { match: "IIIT Mysuru",
    executingAgency: "Ministry of Education / IIIT Foundation", category: "Education",
    description: "Permanent IIIT Mysuru campus with academic blocks, hostels and research labs for IT education." },

  { match: "University of Mysore New Science",
    executingAgency: "University of Mysore / UGC", category: "Education",
    description: "New science block at Manasagangothri campus with advanced labs for physics, chemistry and biotech." },

  { match: "New Government Medical College, Nanjangud", matchAlt: ["Medical College, Nanjangud"],
    executingAgency: "Karnataka Health Department", category: "Hospital",
    description: "New medical college in Nanjangud with 150-seat intake and teaching hospital addressing doctor shortage." },

  { match: "K.R. Hospital", matchAlt: ["MMCRI Super Specialty"],
    executingAgency: "MMCRI", category: "Hospital",
    description: "Super specialty block with cardiology, neurology and oncology as referral centre for southern Karnataka." },

  { match: "Community Health Centre Hunsur",
    executingAgency: "Karnataka Health Department", category: "Hospital",
    description: "Hunsur CHC upgrade with additional beds, diagnostic equipment and specialist quarters for rural healthcare." },

  { match: "MIMS Mysuru", matchAlt: ["500-Bed Hospital"],
    executingAgency: "JSS Academy / Private", category: "Hospital",
    description: "Expansion to 500 beds with specialty wings, trauma centre and medical education facilities." },

  { match: "Kidwai Cancer", matchAlt: ["Kidwai Cancer Centre"],
    executingAgency: "Kidwai Memorial Institute / Karnataka Health", category: "Hospital",
    description: "Satellite cancer centre in Mysuru for chemo, radiation and screening closer to southern Karnataka patients." },

  { match: "AIIMS Mysuru",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "Ministry of Health & Family Welfare", category: "Hospital",
    description: "Proposed AIIMS providing world-class tertiary healthcare and medical education for southern Karnataka." },

  { match: "Nanjangud Industrial Township",
    executingAgency: "KIADB", category: "Industry",
    description: "Phase 2 expansion with industrial plots, effluent treatment and power for pharma and food processing." },

  { match: "Nanjangud Pharma SEZ", matchAlt: ["Special Economic Zone"],
    executingAgency: "KIADB / Ministry of Commerce", category: "Industry",
    description: "Pharma SEZ leveraging existing cluster of Jubilant, Cipla and other companies in Nanjangud." },

  { match: "KSDL Sandal Soap", matchAlt: ["Sandal Soap Plant"],
    executingAgency: "KSDL", category: "Industry",
    description: "Modernisation of the iconic Mysuru Sandal Soap factory with new production lines and automation." },

  { match: "KSIC Silk Reeling", matchAlt: ["Silk Reeling Automation"],
    executingAgency: "KSIC", category: "Industry",
    description: "Silk reeling and weaving automation at KSIC Mysuru improving productivity of GI-tagged Mysuru silk." },

  { match: "Mysore Sugar Factory", matchAlt: ["Co-gen Plant"],
    executingAgency: "Mysore Sugar Company Ltd", category: "Industry",
    description: "Sugar factory crushing capacity expansion and bagasse co-generation plant for renewable energy." },

  { match: "BEML Modernisation", matchAlt: ["Defence Vehicle Plant"],
    executingAgency: "BEML Limited (Ministry of Defence)", category: "Industry",
    description: "Mysuru BEML plant upgrade for metro coaches, defence vehicles and construction equipment manufacturing." },

  { match: "Mysuru Silk Park", matchAlt: ["Nanjangud Mysuru Silk Park"],
    executingAgency: "KSIC / KIADB", category: "Industry",
    description: "Silk production park in Nanjangud showcasing Mysuru's silk heritage with weaving units and retail." },

  { match: "Second IT Hub",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "Karnataka IT/BT Department / STPI", category: "Telecom",
    description: "Developing Mysuru as Karnataka's second IT hub with parks, incubators and talent centres." },

  { match: "Film City",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "Karnataka Film Chamber", category: "Industry",
    description: "Film city near Mysuru for Kannada and South Indian productions with studios and post-production." },

  { match: "Permanent Cocoon Market",
    executingAgency: "Karnataka Sericulture Department", category: "Industry",
    description: "Permanent cocoon market for silkworm cocoon trading replacing temporary structures for sericulture." },

  { match: "New Fire Stations",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "Karnataka State Fire & Emergency Services", category: "Other",
    description: "New fire stations improving emergency response in Mysuru, Kodagu and Chikkamagaluru districts." },

  { match: "Regional Drug Testing",
    executingAgency: "CDSCO / Karnataka Drug Control", category: "Other",
    description: "Drug testing lab in Mysuru for pharma products from Nanjangud cluster, reducing Bengaluru dependency." },

  { match: "Public Toilets Hygiene",
    executingAgency: "MCC / Swachh Bharat Mission", category: "Sewage",
    description: "Public toilet upgrades with automated cleaning and accessibility to maintain Swachh city ranking." },

  { match: "Mysuru Flex Waste",
    executingAgency: "Mysuru City Corporation", category: "Environment",
    description: "Citywide flex banner and plastic waste removal as part of Mysuru's zero-waste programme." },

  { match: "New Mysuru Plan",
    executingAgency: "MUDA", category: "Other",
    description: "Comprehensive 20-year urban master plan covering zoning, transport corridors and green spaces." },

  { match: "Greater Mysuru City Corporation",
    executingAgency: "Karnataka Urban Development Department", category: "Other",
    description: "Expansion of city corporation limits to include surrounding gram panchayats for unified governance." },

  { match: "Dr. Ambedkar Bhavan",
    executingAgency: "Karnataka Social Welfare Department", category: "Heritage",
    description: "Cultural and community centre construction, delayed 14 years with August 2026 completion deadline." },

  { match: "Additional Truck Terminal",
    executingAgency: "MUDA / Karnataka Transport", category: "Roads",
    description: "New truck terminal relocating heavy vehicles from city centre to reduce congestion and pollution." },

  { match: "Multi-Modal Transit Hub", matchAlt: ["Mysuru Railway Station Transit Hub"],
    executingAgency: "South Western Railway / MUDA", category: "Rail",
    description: "Integrated transit hub connecting rail, bus, metro and taxi with commercial development." },

  { match: "Mysuru Convention Centre", matchAlt: ["5,000 pax"],
    executingAgency: "MUDA", category: "Tourism",
    description: "5,000-capacity convention and exhibition centre for conferences, trade fairs and MICE tourism." },

  { match: "AI Clean City", matchAlt: ["Mysuru AI Clean"],
    executingAgency: "Mysuru Smart City SPV", category: "Environment",
    description: "AI-powered smart bins, route optimization for garbage trucks and real-time cleanliness tracking." },

  { match: "Bengaluru-Mysuru Infrastructure Corridor", matchAlt: ["Bengaluru–Mysuru Infrastructure Corridor"],
    executingAgency: "Karnataka Infrastructure Development Department", category: "Roads",
    description: "Integrated corridor covering expressway, rail, utilities and industrial zones along the 140 km stretch." },

  { match: "Kabini Reservoir Left Bank", matchAlt: ["Kabini Left Bank Canal"],
    executingAgency: "Karnataka Water Resources / CNNL", category: "Irrigation",
    description: "Canal lining and automated gates improving irrigation efficiency for Mysuru district farmlands." },
];

// Noise rows to remove from Mysuru
const DELETE_NAME_PATTERNS: RegExp[] = [
  /Metro\s*light\s*and\s*metro\s*neo/i,
];

const STATUS_RANK: Record<string, number> = {
  PROPOSED: 0, APPROVED: 1, TENDER_ISSUED: 2, UNDER_CONSTRUCTION: 3,
  ON_TRACK: 3, DELAYED: 4, STALLED: 4, COMPLETED: 5, CANCELLED: 99,
};

async function applyFill(districtId: string, districtName: string, fill: Fill): Promise<{ matched: boolean; filledFields: string[]; projectName: string | null }> {
  const tokens = [fill.match, ...(fill.matchAlt ?? [])];
  let row: Awaited<ReturnType<typeof prisma.infraProject.findFirst>> = null;
  for (const t of tokens) {
    row = await prisma.infraProject.findFirst({
      where: { districtId, name: { contains: t, mode: "insensitive" } },
    });
    if (row) break;
  }
  if (!row) return { matched: false, filledFields: [], projectName: null };

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
  if (fill.originalBudget != null) {
    setIfEmpty("revisedBudget", fill.originalBudget);
    setIfEmpty("budget", fill.originalBudget);
  }

  const curCategory = (row as { category?: string | null }).category ?? null;
  if (fill.category && (curCategory == null || curCategory === "" || curCategory.toLowerCase() === "general")) {
    (patch as Record<string, unknown>).category = fill.category;
    filled.push("category");
  }

  if (fill.keyPeople && fill.keyPeople.length > 0) {
    const curKp = (row as { keyPeople?: unknown }).keyPeople;
    const hasKp = Array.isArray(curKp) && (curKp as unknown[]).length > 0;
    if (!hasKp) {
      (patch as Record<string, unknown>).keyPeople = fill.keyPeople;
      filled.push("keyPeople");
    }
  }

  if (fill.status) {
    const curRank = STATUS_RANK[(row.status ?? "").toUpperCase()] ?? -1;
    const newRank = STATUS_RANK[fill.status] ?? -1;
    if (newRank > curRank && curRank !== 99) {
      (patch as Record<string, unknown>).status = fill.status;
      filled.push("status");
    }
  }

  if (filled.length === 0) return { matched: true, filledFields: [], projectName: row.name };

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
      source: "api", actorLabel: "manual-research",
      tableName: "InfraProject", recordId: row.id, action: "update",
      districtId, districtName, moduleName: "infrastructure",
      description: `Mysuru manual-research fill: ${row.name} ← ${filled.length} fields`,
      recordCount: 1, details: { filledFields: filled },
    });
  }

  return { matched: true, filledFields: filled, projectName: row.name };
}

async function main() {
  console.log(`🛠  Mysuru manual-research fill ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  const mysuru = await prisma.district.findFirst({ where: { slug: "mysuru" }, select: { id: true, name: true } });
  if (!mysuru) throw new Error("Mysuru not found");

  // Cleanup lingering noise
  let deletes = 0;
  const cands = await prisma.infraProject.findMany({ where: { districtId: mysuru.id }, select: { id: true, name: true } });
  for (const pattern of DELETE_NAME_PATTERNS) {
    for (const c of cands) if (pattern.test(c.name)) {
      console.log(`  🗑  DELETE "${c.name}"  — matched cleanup pattern ${pattern}`);
      if (!DRY_RUN) await prisma.infraProject.delete({ where: { id: c.id } });
      deletes++;
    }
  }

  let matched = 0, filled = 0, nop = 0, missing = 0;
  console.log(`\n| Project                                   | Fields filled              | Status  |`);
  console.log(`|-------------------------------------------|----------------------------|---------|`);
  for (const fill of DATA) {
    const r = await applyFill(mysuru.id, mysuru.name, fill);
    if (!r.matched) {
      console.log(`| ${fill.match.padEnd(41).slice(0, 41)} | no DB match                | MISS    |`);
      missing++; continue;
    }
    matched++;
    if (r.filledFields.length === 0) {
      console.log(`| ${(r.projectName ?? fill.match).padEnd(41).slice(0, 41)} | (already complete)         | ⏭ nop  |`);
      nop++;
    } else {
      console.log(`| ${(r.projectName ?? fill.match).padEnd(41).slice(0, 41)} | ${r.filledFields.join(", ").padEnd(26).slice(0, 26)} | ✅      |`);
      filled++;
    }
  }

  console.log(`\nSummary: ${matched}/${DATA.length} matched · ${filled} filled · ${nop} complete · ${missing} missing · ${deletes} deleted`);

  const remaining = await prisma.infraProject.findMany({
    where: { districtId: mysuru.id },
    select: { name: true, description: true, executingAgency: true, category: true },
  });
  console.log(`\n📊 Mysuru coverage after fill:`);
  console.log(`   total rows        : ${remaining.length}`);
  console.log(`   missing desc.     : ${remaining.filter((r) => !r.description).length}`);
  console.log(`   missing agency    : ${remaining.filter((r) => !r.executingAgency).length}`);
  console.log(`   generic category  : ${remaining.filter((r) => !r.category || r.category.toLowerCase() === "general").length}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
