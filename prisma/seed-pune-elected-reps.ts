/**
 * Pune elected representatives + governance addendum seed (Prompt 4/6).
 *
 * ForThePeople.in — independent citizen platform by Jayanth M B.
 *
 * SCOPE — 25 records:
 *   • 21 MLAs covering the 21 Vidhan Sabha seats in Pune district
 *     (1 row is SEAT VACANT placeholder for Baramati pending the April 23,
 *     2026 by-election result certification by ECI).
 *   • 3 Lok Sabha MPs whose constituencies contain Pune VS seats
 *     (Supriya Sule / Baramati, Dr. Amol Kolhe / Shirur, Shrirang Barne / Maval).
 *     The 4th MP — Murlidhar Mohol / Pune LS — is already seeded from
 *     Prompt 2/6 (seed-pune-leaders.ts). Not duplicated here.
 *   • 1 governance addendum — Ravi Landge, PCMC Mayor. Same record also
 *     exists in seed-pune-leaders.ts; idempotency guard prevents duplicate.
 *
 * TIER CONVENTION (per Prompt 2 calibration + Mumbai seed-file intent):
 *   tier 1 = Lok Sabha MP
 *   tier 2 = MLA
 *   tier 3 = Municipal Corp (Mayor / Commissioner) — Landge addendum here
 *
 * ROLE STRINGS:
 *   - MPs: "Member of Parliament (Lok Sabha)" (matches existing Mohol
 *     record + Mumbai seed file convention; prompt spec's comma form
 *     "Member of Parliament, Lok Sabha" harmonized to parens form for
 *     cross-record consistency).
 *   - MLAs: "Member of Legislative Assembly" (per prompt spec).
 *   - Vacant seat: "Member of Legislative Assembly (Seat Vacant)".
 *
 * BARAMATI SEAT HANDLING (CRITICAL):
 *   Ajit Pawar died 2026-01-28. By-election VOTING April 23, 2026 —
 *   result not yet certified by ECI at time of this seed being written.
 *   Sunetra Ajit Pawar is the principal candidate (MVA did not field
 *   against her, Congress withdrew Aakash More) but that is NOT the
 *   same as "won". Data integrity rule: seed the seat as VACANT, not
 *   as Sunetra's. Once ECI certifies the result, update in a follow-up
 *   seed — the idempotency guard will skip the vacant row if the new
 *   record has a different `name`, so you'd either update the vacant
 *   row's name/party in a patch script, or add a new row (and set the
 *   vacant one's active=false).
 *
 * PARTY FORMAT:
 *   Short forms per prompt spec (BJP, INC, NCP, NCP-SP, SHS, SHS-UBT,
 *   IND, RPI (A), etc.). Note: Mumbai's existing rows use "Shiv Sena (UBT)"
 *   / "Shiv Sena (Shinde)" format. This seed follows prompt's shorter
 *   forms ("SHS-UBT" / "SHS") — flagged for cross-district party-format
 *   reconciliation in a later pass.
 *
 * IDEMPOTENT. Uses findFirst({districtId, name, role}) → skip-if-exists.
 * Landge record overlaps with seed-pune-leaders.ts: safe, skip triggers
 * on whichever seed runs second.
 */

import { PrismaClient } from "@ftp/prisma-client";
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
  party?: string | null;
  constituency?: string | null;
  since?: string | null;
  source: string;
  roleDescription: string;
  active?: boolean;
};

const RECORDS: LeaderRecord[] = [
  // ══════════════════════════════════════════════════════════
  //   21 MLAs — Pune district Vidhan Sabha seats (2024 term)
  // ══════════════════════════════════════════════════════════

  // ── Pune LS constituency (6 VS seats) ─────────────────────
  {
    name: "Bapusaheb Tukaram Pathare",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP-SP",
    constituency: "Vadgaon Sheri",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Vadgaon Sheri with 133,689 votes (47.07% vote share), margin of 4,710 over Sunil Vijay Tingre (NCP). Constituency falls under Pune Lok Sabha. NCP-SP = Nationalist Congress Party (Sharadchandra Pawar faction).",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/vadgaon-sheri-assembly-elections-mh-208/",
  },
  {
    name: "Siddharth Shirole",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Shivajinagar",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Shivajinagar with margin of 72,721 votes over Dattatrey Bahirat (INC). Constituency falls under Pune Lok Sabha. Re-elected for second consecutive term.",
    source: "Republic World / ECI 2024 | https://www.republicworld.com/elections/shivajinagar-kothrud-khadakwasala-parvati-hadapsar-pune-cantonment-sc-kasba-peth-election-results-2024-live",
  },
  {
    name: "Chandrakant Bachhu Patil",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Kothrud",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Kothrud with margin of 112,041 votes over Chandrakant Balbhim Mokate (SHS-UBT). Maharashtra BJP state unit president. Constituency falls under Pune Lok Sabha.",
    source: "Hindustan Times / ECI 2024 | https://www-hindustantimes-com.translate.goog/india-news/pune-election-2024-results-ajit-pawar-baramati-chandrakant-patil-yugendra-pawar-sharad-pawar-live-updates-latest-news-101732316552705.html",
  },
  {
    name: "Madhuri Satish Misal",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Parvati",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Parvati with 118,193 votes and margin of ~52,275 over Ashwini Nithin Kadam (NCP-SP). Constituency falls under Pune Lok Sabha. Long-serving BJP MLA retained seat.",
    source: "Hindustan Times / ECI 2024 | https://www-hindustantimes-com.translate.goog/india-news/pune-election-2024-results-ajit-pawar-baramati-chandrakant-patil-yugendra-pawar-sharad-pawar-live-updates-latest-news-101732316552705.html",
  },
  {
    name: "Sunil Dnyandev Kamble",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Pune Cantonment (SC)",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Pune Cantonment (SC reserved) with 76,032 votes and margin of 10,320 over Ramesh Anandrao Bhagwe (INC). Constituency falls under Pune Lok Sabha. Reserved for Scheduled Castes.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/pune-cantonment-assembly-elections-mh-214/",
  },
  {
    name: "Hemant Narayan Rasane",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Kasba Peth",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Kasba Peth with 90,046 votes and margin of 19,423 over Ravindra Hemraj Dhangekar (INC). Constituency falls under Pune Lok Sabha. Dhangekar had won the seat in a 2023 by-poll after Mukta Tilak's death.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/kasba-peth-assembly-elections-mh-215/",
  },

  // ── Baramati LS constituency (6 VS seats — 5 seated + 1 vacant) ──
  {
    name: "Rahul Subhashrao Kul",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Daund",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Daund with margin of 13,889 votes over Rameshappa Kisanrao Thorat (NCP-SP). Constituency falls under Baramati Lok Sabha. Sitting MLA retained seat.",
    source: "Hindustan Times / ECI 2024 | https://www-hindustantimes-com.translate.goog/india-news/pune-election-2024-results-ajit-pawar-baramati-chandrakant-patil-yugendra-pawar-sharad-pawar-live-updates-latest-news-101732316552705.html",
  },
  {
    name: "Dattatraya Vithoba Bharane",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Indapur",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Indapur with 117,236 votes and margin of 19,410 over Harshavardhan Shahajirao Patil (NCP-SP). Constituency falls under Baramati Lok Sabha. Long-serving NCP MLA.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/indapur-assembly-elections-mh-200/",
  },

  // ─── ⚠️  SEAT VACANT — By-election in progress April 23, 2026 ───
  // FLAG: This row must be updated once ECI certifies the by-election
  // result (expected late April 2026). Jayanth: after ECI declaration,
  // write a one-off patch script that either (a) updates this row's
  // name/party/since to the certified winner, or (b) sets active=false
  // on this row and adds a new row for the winner.
  {
    name: "(Baramati — seat vacant)",
    role: "Member of Legislative Assembly (Seat Vacant)",
    tier: 2,
    party: null,
    constituency: "Baramati",
    since: null,
    active: false,
    roleDescription:
      "SEAT VACANT since January 28, 2026. Previous MLA: Ajit Pawar (NCP), won 2024 with 181,132 votes (66.13%), margin of 100,899 over Yugendra Srinivas Pawar (NCP-SP). Ajit Pawar died January 28, 2026 in plane crash at Baramati airport. By-election voting: April 23, 2026 — ECI results expected late April 2026. Sunetra Ajit Pawar (NCP) is the principal candidate; NCP-SP did not field against her; Congress withdrew Aakash More. This record will be updated once ECI certifies by-election result.",
    source: "Outlook India | https://www.outlookindia.com/national/maharashtra-bypolls-baramati-rahuri-bypolls-see-low-morning-turnout",
  },

  {
    name: "Vijay Shivatare",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "SHS",
    constituency: "Purandar",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Purandar with margin of 24,188 votes over Sanjay Chandrkant Jagtap (INC). Constituency falls under Baramati Lok Sabha. Former Water Resources Minister. SHS = Shiv Sena (Shinde faction).",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/purandar-assembly-elections-mh-202/",
  },
  {
    name: "Shankar Hiraman Mandekar",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Bhor",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Bhor with margin of 19,638 votes over Sangram Anantrao Thopte (INC). Constituency falls under Baramati Lok Sabha.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/bhor-assembly-elections-mh-203/",
  },
  {
    name: "Bhimrao Dhondiba Tapkir",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Khadakwasla",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Khadakwasla with 163,131 votes (49.94% vote share) and margin of 52,322 over Sachin Shivajirao Dodke (NCP-SP). Constituency falls under Baramati Lok Sabha.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/khadakwasala-assembly-elections-mh-211/",
  },

  // ── Shirur LS constituency (6 VS seats) ───────────────────
  {
    name: "Sharaddada Bhimaji Sonawane",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "IND",
    constituency: "Junnar",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Junnar as Independent with margin of 6,664 votes. Constituency falls under Shirur Lok Sabha. Defeated sitting MLA Atul Benke (NCP). Junnar is birthplace of Chhatrapati Shivaji Maharaj.",
    source: "Hindustan Times / ECI 2024 | https://www-hindustantimes-com.translate.goog/india-news/pune-election-2024-results-ajit-pawar-baramati-chandrakant-patil-yugendra-pawar-sharad-pawar-live-updates-latest-news-101732316552705.html",
  },
  {
    name: "Dilip Dattatray Walse-Patil",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Ambegaon",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Ambegaon with margin of 1,523 votes over Devdatta Jayvantrao Nikam (NCP-SP). Constituency falls under Shirur Lok Sabha. Former Speaker of Maharashtra Assembly. Veteran NCP leader.",
    source: "Hindustan Times / ECI 2024 | https://www-hindustantimes-com.translate.goog/india-news/pune-election-2024-results-ajit-pawar-baramati-chandrakant-patil-yugendra-pawar-sharad-pawar-live-updates-latest-news-101732316552705.html",
  },
  {
    name: "Babaji Ramchandra Kale",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "SHS-UBT",
    constituency: "Khed-Alandi",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Khed-Alandi with margin of 40,766 votes over Dilip Dattatray Mohite (NCP). Constituency falls under Shirur Lok Sabha. Khed-Alandi includes the sacred town of Alandi (Sant Dnyaneshwar's samadhi). SHS-UBT = Shiv Sena (Uddhav Balasaheb Thackeray faction).",
    source: "Republic World / ECI 2024 | https://www.republicworld.com/elections/pune-election-results-2024-live-updates-junnar-ambegaon-khed-alandi-shirur-daund-indapur-baramati-winner",
  },
  {
    name: "Dnyaneshwar Aba Katke",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Shirur",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Shirur with margin of 74,550 votes over Ashok Raosaheb Pawar (NCP-SP). Constituency falls under Shirur Lok Sabha. Also known as 'Mauli Aba Katke'.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/shirur-assembly-elections-mh-198/",
  },
  {
    name: "Mahesh Kisan Landge",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Bhosari",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Bhosari with 213,624 votes (56.91% vote share) and margin of 63,765 over Ajit Damodar Gavhane (NCP-SP). Constituency falls under Shirur Lok Sabha. Re-elected for third consecutive term.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/bhosari-assembly-elections-mh-207/",
  },
  {
    name: "Chetan Vitthal Tupe",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Hadapsar",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Hadapsar with 134,810 votes and margin of 7,122 over Prashant Sudam Jagtap (NCP-SP). Constituency falls under Shirur Lok Sabha.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/hadapsar-assembly-elections-mh-213/",
  },

  // ── Maval LS constituency (3 Pune VS seats + 3 Raigad seats) ──
  {
    name: "Sunil Shankarrao Shelke",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Maval",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Maval with 191,255 votes (68.53% vote share) and margin of 108,565 over Anna Bhegde (IND). Constituency falls under Maval Lok Sabha. One of the largest margins of victory in Pune district.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/maval-assembly-elections-mh-204/",
  },
  {
    name: "Shankar Jagtap",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "BJP",
    constituency: "Chinchwad",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Chinchwad with 235,323 votes (60.51% vote share) and margin of 103,865 over Kalate Rahul Tanaji (NCP-SP). Constituency falls under Maval Lok Sabha. Replaced sitting BJP MLA in candidate selection — debut win.",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/chinchwad-assembly-elections-mh-205/",
  },
  {
    name: "Anna Dadu Bansode",
    role: "Member of Legislative Assembly",
    tier: 2,
    party: "NCP",
    constituency: "Pimpri (SC)",
    since: "2024",
    roleDescription:
      "Won 2024 Maharashtra Assembly Election from Pimpri (SC) with 109,239 votes (53.71% vote share) and margin of 36,664 over Dr. Sulakshana Shilwant Dhar (NCP-SP). Constituency falls under Maval Lok Sabha. Reserved for Scheduled Castes. Switched from Shiv Sena to NCP after 2019.",
    source: "Punekar News / ECI 2024 | https://www.punekarnews.in/pune-ajit-pawar-led-ncps-anna-bansode-wins-pimpri-defeats-dr-sulakshana-dhar/",
  },

  // ══════════════════════════════════════════════════════════
  //   3 Lok Sabha MPs covering Pune district VS seats
  //   (Mohol/Pune LS already in seed-pune-leaders.ts — not dup'd)
  // ══════════════════════════════════════════════════════════
  {
    name: "Supriya Sule",
    role: "Member of Parliament (Lok Sabha)",
    tier: 1,
    party: "NCP-SP",
    constituency: "Baramati",
    since: "2009",
    roleDescription:
      "Member of Parliament for Baramati Lok Sabha since 2009 (4 consecutive terms). Re-elected 2024 with 158,333 vote margin over Sunetra Ajit Pawar (NCP). NCP-SP Working President. Daughter of Sharad Pawar. Baramati LS includes Daund, Indapur, Baramati, Purandar, Bhor, Khadakwasla VS seats (all Pune district).",
    source: "OneIndia / ECI 2024 | https://www.oneindia.com/baramati-lok-sabha-elections-mh-28/",
  },
  {
    name: "Dr. Amol Ramsing Kolhe",
    role: "Member of Parliament (Lok Sabha)",
    tier: 1,
    party: "NCP-SP",
    constituency: "Shirur",
    since: "2019",
    roleDescription:
      "Member of Parliament for Shirur Lok Sabha since 2019 (2 consecutive terms). Won 2024 with 140,951 vote margin over Adhalrao Shivaji Dattatrey (NCP). Actor-turned-politician known for portraying Chhatrapati Shivaji Maharaj (Raja Shivchhatrapati) and Chhatrapati Sambhaji (Swarajyarakshak Sambhaji). MBBS from KEM Mumbai. Shirur LS includes Junnar, Ambegaon, Khed-Alandi, Shirur, Bhosari, Hadapsar VS seats (all Pune district).",
    source: "Wikipedia / ECI 2024 | https://en.wikipedia.org/wiki/Amol_Kolhe",
  },
  {
    name: "Shrirang Appa Chandu Barne",
    role: "Member of Parliament (Lok Sabha)",
    tier: 1,
    party: "SHS",
    constituency: "Maval",
    since: "2014",
    roleDescription:
      "Member of Parliament for Maval Lok Sabha since 2014 (3 consecutive terms). Won 2024 with 96,615 vote margin over Sanjog Bhiku Waghere Patil (SHS-UBT). Maval LS includes Maval, Chinchwad, Pimpri VS seats (Pune district) plus Panvel, Karjat, Uran (Raigad district).",
    source: "Wikipedia / ECI 2024 | https://en.wikipedia.org/wiki/Maval_Lok_Sabha_constituency",
  },

  // ══════════════════════════════════════════════════════════
  //   Governance addendum — Ravi Landge (PCMC Mayor, tier 3)
  //   Note: Also in seed-pune-leaders.ts (Prompt 2). Idempotency
  //   guard prevents a duplicate row whichever seed runs second.
  // ══════════════════════════════════════════════════════════
  {
    name: "Ravi Landge",
    role: "Mayor, Pimpri-Chinchwad Municipal Corporation",
    tier: 3,
    party: "BJP",
    since: "2026",
    roleDescription:
      "Elected Mayor of Pimpri-Chinchwad following the January 2026 civic elections. Approved PCMC FY 2026-27 budget of ₹9,322.17 crore (₹414.22 crore increase over previous year) on March 24, 2026. Party affiliation (BJP) inferred from Lokmat Times coverage context — verify if contradicted by other sources.",
    source:
      "Lokmat Times | https://www.lokmattimes.com/pune/pimpri-chinchwad-civic-body-approves-rs9322-crore-budget-major-push-for-water-roads-and-urban-projects-a525/",
  },
];

export async function seedPuneElectedReps(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    const mh = await client.state.findUniqueOrThrow({
      where: { slug: "maharashtra" },
    });
    const pune = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: mh.id, slug: "pune" } },
    });
    console.log(`Seeding Pune elected reps + addendum (districtId=${pune.id})...`);

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
          active: rec.active ?? true,
          lastVerifiedAt: new Date(),
        },
      });
      const label = rec.party ? `${rec.party}` : "—";
      console.log(
        `  ✅ tier=${rec.tier}  ${rec.name} (${label}) — ${rec.constituency ?? rec.role}`,
      );
      created++;
    }

    console.log(
      `\nSummary: ${created} created + ${skipped} skipped = ${RECORDS.length} total target.`,
    );

    // Informational tier/party distribution
    const tierCount: Record<number, number> = {};
    const partyCount: Record<string, number> = {};
    for (const r of RECORDS) {
      tierCount[r.tier] = (tierCount[r.tier] ?? 0) + 1;
      const p = r.party ?? "(null)";
      partyCount[p] = (partyCount[p] ?? 0) + 1;
    }
    console.log(
      `Tier distribution: ${Object.entries(tierCount)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([t, c]) => `${t}:${c}`)
        .join(", ")}`,
    );
    console.log(
      `Party distribution: ${Object.entries(partyCount)
        .sort(([, a], [, b]) => b - a)
        .map(([p, c]) => `${p}:${c}`)
        .join(", ")}`,
    );
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneElectedReps()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
