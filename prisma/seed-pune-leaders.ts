/**
 * Pune leadership seed — 17 verified officials (Prompt 2/6, Seed A).
 *
 * ForThePeople.in — independent citizen transparency platform by Jayanth M B.
 *
 * SCOPE:
 *   District-level governance (no MLAs, no Rajya Sabha, no Baramati/Maval/
 *   Shirur MPs — those come in Prompt 4 Elections). Leaders grouped by the
 *   codebase's existing tier convention (see prisma/archive/seed-mumbai-data.ts):
 *     Tier 1 — Lok Sabha MP
 *     Tier 3 — Municipal Corporation (Mayor + Commissioner, PMC and PCMC)
 *     Tier 4 — Administration + state-level political (Collector, Div Comm,
 *              ZP CEO, Guardian Minister/DCM)
 *     Tier 5 — Police commissionerates + Rural SP
 *     Tier 6 — Judiciary
 *   Total: 1 + 7 + 5 + 3 + 1 = 17.
 *
 * CALIBRATION NOTES (from Prompt 2 decision block):
 *   - No `category` column — using integer `tier`.
 *   - No `sourceUrl` column — `source` holds "Publication | URL" (pipe-delimited).
 *   - Extra facts (cadre, batch, predecessor, portfolios, appointment context)
 *     are packed into `roleDescription`. Free-text `since` stores appointment
 *     year where known.
 *   - No fabricated data: `phone`, `email`, `photoUrl`, `photoLicense`,
 *     `nameLocal`, `roleLocal`, `talukId` are null for every record.
 *   - `active` defaults to true (not set explicitly).
 *
 * IDEMPOTENT. Uses findFirst({districtId, name, role}) → skip-if-exists
 * because Leader has no natural unique constraint.
 *
 * Data verified as of April 2026. `lastVerifiedAt` set to seed execution time.
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

type LeaderRecord = {
  name: string;
  role: string;
  tier: number;
  party?: string;
  constituency?: string;
  since?: string;
  source: string;
  roleDescription: string;
};

const RECORDS: LeaderRecord[] = [
  // ── Tier 1 — Lok Sabha MP (1) ─────────────────────────────
  {
    name: "Murlidhar Kisan Mohol",
    role: "Member of Parliament (Lok Sabha)",
    tier: 1,
    party: "BJP",
    constituency: "Pune",
    since: "2024",
    source:
      "Wikipedia | https://en.wikipedia.org/wiki/Murlidhar_Mohol",
    roleDescription:
      "Elected MP for Pune constituency in the 2024 general election with a margin of 1,23,038 over Ravindra Dhangekar (INC). Currently Union Minister of State for Cooperation and Civil Aviation. Previously served as Mayor of Pune (2019-2022). DOB: 9 November 1974.",
  },

  // ── Tier 3 — Municipal Corp: PMC + PCMC (7) ───────────────
  {
    name: "Naval Kishore Ram",
    role: "Municipal Commissioner, Pune Municipal Corporation",
    tier: 3,
    since: "2025",
    source:
      "Free Press Journal | https://www.freepressjournal.in/pune/who-is-naval-kishore-ram-the-new-commissioner-of-pune-municipal-corporation-who-will-take-charge-on-may-31",
    roleDescription:
      "IAS officer. Appointed May 31, 2025; succeeded Dr. Rajendra Bhosale (retired). Prior role: Deputy Secretary, Prime Minister's Office. Previously served as Pune District Collector (April 2018).",
  },
  {
    name: "Prajeet Nair",
    role: "Additional Municipal Commissioner (Estate), Pune Municipal Corporation",
    tier: 3,
    since: "2026",
    source:
      "Pune Pulse | https://www.mypunepulse.com/pune-prajeet-nair-assumes-charge-as-additional-municipal-commissioner-of-pmc/",
    roleDescription:
      "IAS 2017 batch. Appointed April 7, 2026. Prior role: District Collector, Gondia.",
  },
  {
    name: "Shantanu Goel",
    role: "Additional Municipal Commissioner, Pune Municipal Corporation",
    tier: 3,
    since: "2026",
    source:
      "Whispers In The Corridors | https://whispersinthecorridors.com/detail/34985-Maharashtra-Govt-assigns-new-postings-to-26-IAS-officers",
    roleDescription:
      "IAS officer. Appointed April 2026 as part of Maharashtra government's 26-officer reshuffle.",
  },
  {
    name: "Dr. Vijay Suryawanshi",
    role: "Municipal Commissioner, Pimpri-Chinchwad Municipal Corporation",
    tier: 3,
    since: "2026",
    source:
      "Pune Pulse | https://www.mypunepulse.com/ias-officer-dr-vijay-suryawanshi-appointed-new-pcmc-commissioner/",
    roleDescription:
      "IAS 2006 batch. Appointed March 11, 2026. Prior role: Divisional Commissioner, Konkan Division. Previously MMRDA Additional Metropolitan Commissioner, Kalyan-Dombivli MC Commissioner, Collector Raigad and Collector Gondia.",
  },
  {
    name: "Manjusha Nagpure",
    role: "Mayor, Pune Municipal Corporation",
    tier: 3,
    party: "BJP",
    since: "2026",
    source:
      "Wikipedia (PMC) | https://en.wikipedia.org/wiki/Pune_Municipal_Corporation",
    roleDescription:
      "Elected Mayor of Pune Municipal Corporation in February 2026 following the PMC election held January 15, 2026; BJP secured 119 of 165 seats.",
  },
  {
    name: "Parshuram Wadekar",
    role: "Deputy Mayor, Pune Municipal Corporation",
    tier: 3,
    party: "RPI (A)",
    since: "2026",
    source:
      "Wikipedia (PMC) | https://en.wikipedia.org/wiki/Pune_Municipal_Corporation",
    roleDescription:
      "Elected Deputy Mayor of Pune Municipal Corporation in February 2026. Republican Party of India (Athawale) — coalition partner with BJP.",
  },
  {
    name: "Ravi Landge",
    role: "Mayor, Pimpri-Chinchwad Municipal Corporation",
    tier: 3,
    party: "BJP",
    since: "2026",
    source:
      "Lokmat Times | https://www.lokmattimes.com/pune/pimpri-chinchwad-civic-body-approves-rs9322-crore-budget-major-push-for-water-roads-and-urban-projects-a525/",
    roleDescription:
      "Elected Mayor of Pimpri-Chinchwad following the January 2026 civic elections. Approved PCMC FY 2026-27 budget of ₹9,322.17 crore (₹414.22 crore increase over previous year) on March 24, 2026.",
  },

  // ── Tier 4 — Administration + State Political (5) ─────────
  {
    name: "Jitendra Dudi",
    role: "District Collector",
    tier: 4,
    since: "2025",
    source:
      "Indian Masterminds | https://indianmasterminds.com/news/maharashtra-ias-suhas-diwase-promoted-to-secy-jitendra-dudi-appointed-as-new-pune-collector-103700/",
    roleDescription:
      "IAS 2016 batch (Rajasthan home state). Appointed January 2025; succeeded Dr. Suhas Diwase who was promoted to Secretary / Jamavbandi Commissioner.",
  },
  {
    name: "Dr. Chandrakant Sulochana Laxmanrao Pulkundwar",
    role: "Divisional Commissioner, Pune Division",
    tier: 4,
    source:
      "Divisional Commissioner Office, Pune | https://divcommpune.in/divisional-commissioner-office-pune/",
    roleDescription:
      "IAS officer. Pune Division covers Pune, Satara, Sangli, Kolhapur, and Solapur districts.",
  },
  {
    name: "Kavita Dwivedi",
    role: "Additional Divisional Commissioner, Pune Division",
    tier: 4,
    source:
      "Indian Bureaucracy | https://www.indianbureaucracy.com/kavita-dwivedi-ias-posted-as-addl-divisional-commissioner-pune-division-maharashtra/",
    roleDescription: "IAS officer.",
  },
  {
    name: "U A Jadhav",
    role: "Chief Executive Officer, Pune Zilla Parishad",
    tier: 4,
    since: "2026",
    source:
      "Whispers In The Corridors | https://whispersinthecorridors.com/detail/34985-Maharashtra-Govt-assigns-new-postings-to-26-IAS-officers",
    roleDescription:
      "IAS officer. Appointed April 2026 as part of Maharashtra's 26-officer reshuffle.",
  },
  {
    name: "Sunetra Ajit Pawar",
    role: "Guardian Minister, Pune District",
    tier: 4,
    party: "NCP",
    since: "2026",
    source:
      "The Print | https://theprint.in/politics/new-deputy-cm-sunetra-pawar-now-takes-over-husband-ajits-guardian-ministership-for-pune-beed/2844608/",
    roleDescription:
      "Also Deputy Chief Minister of Maharashtra — first woman Deputy CM in state history. Appointed Guardian Minister February 3, 2026 following the death of her husband Ajit Pawar (6-term Deputy CM, 1959–2026) on January 28, 2026 in a plane crash at Baramati. Portfolios: Excise, Minority Affairs, Sports and Youth Welfare.",
  },

  // ── Tier 5 — Police (3) ──────────────────────────────────
  {
    name: "Amitesh Kumar",
    role: "Commissioner of Police, Pune City",
    tier: 5,
    since: "2024",
    source:
      "Pune City Police | https://www.punepolice.gov.in/about-us/senior-officers",
    roleDescription:
      "IPS 1995 batch. Appointed February 1, 2024. Jurisdiction: PMC area (~790 km²), 30 police stations, approximately 8,750 personnel.",
  },
  {
    name: "Vinoy Kumar Choubey",
    role: "Commissioner of Police, Pimpri-Chinchwad",
    tier: 5,
    source:
      "Maharashtra Home Department | https://home.maharashtra.gov.in/en/cp-and-sp-offices-2/",
    roleDescription:
      "IPS officer. Jurisdiction: PCMC area (separate commissionerate from Pune City).",
  },
  {
    name: "Sandeep Singh Gill",
    role: "Superintendent of Police, Pune Rural",
    tier: 5,
    source:
      "Pune Rural Police | https://puneruralpolice.gov.in/senior-officers",
    roleDescription:
      "IPS officer. Jurisdiction: all of Pune district outside PMC and PCMC areas.",
  },

  // ── Tier 6 — Judiciary (1) ───────────────────────────────
  {
    name: "Mahendra K. Mahajan",
    role: "Principal District & Sessions Judge, Pune",
    tier: 6,
    source:
      "Pune District Courts (eCourts) | https://pune.dcourts.gov.in/",
    roleDescription:
      "Heads the Pune District Court (Shivajinagar). Appeals go to the Bombay High Court, Principal Seat at Mumbai — no Pune High Court bench exists despite active lawyer demand.",
  },
];

export async function seedPuneLeaders(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune leaders (districtId=${pune.id})...`);

    let created = 0;
    let skipped = 0;

    for (const rec of RECORDS) {
      const existing = await client.leader.findFirst({
        where: {
          districtId: pune.id,
          name: rec.name,
          role: rec.role,
        },
      });
      if (existing) {
        console.log(`  ⏭️  ${rec.name} — ${rec.role} (already present)`);
        skipped++;
        continue;
      }

      await client.leader.create({
        data: {
          districtId: pune.id,
          name: rec.name,
          role: rec.role,
          tier: rec.tier,
          party: rec.party ?? null,
          constituency: rec.constituency ?? null,
          since: rec.since ?? null,
          source: rec.source,
          roleDescription: rec.roleDescription,
          lastVerifiedAt: new Date(),
        },
      });
      console.log(`  ✅ tier=${rec.tier}  ${rec.name} — ${rec.role}`);
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );

    // Tier distribution (informational)
    const tierCount: Record<number, number> = {};
    for (const r of RECORDS) tierCount[r.tier] = (tierCount[r.tier] ?? 0) + 1;
    console.log(
      `Tier distribution: ${Object.entries(tierCount)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([t, c]) => `${t}:${c}`)
        .join(", ")}`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneLeaders()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
