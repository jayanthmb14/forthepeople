/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Fix the MONEY-area rows the September 2026 content audit found wrong,
 * invented or stale (budgets, projects, industries, tenders, schemes).
 * Rule: verified or hidden. Every new value was checked against the page
 * cited next to it (government portals first, reputed news only when
 * nothing official exists); anything that could not be confirmed is
 * hidden: set to null, set active=false where the table has that flag,
 * or the row deleted when the whole row was unfounded (seeded budgets,
 * sugar seasons, placeholder tenders).
 *
 * The code fixes that stop these rows coming back (and hide them even
 * before this runs) are in the same branch: SHOWN_BUDGET_ENTRY,
 * SHOWN_BUDGET_ALLOCATION, VERIFIED_SUGAR_SEASON, NOT_STUB_TENDER in
 * src/lib/data-filters.ts; project-facts.ts; amount-basis.ts.
 *
 * DRY RUN by default: prints every change (table, id, field, current →
 * new, source) and exits. Pass --confirm to apply, all in one transaction.
 *
 *   npx tsx scripts/fix-audit-2026-09-money.ts            # dry run
 *   npx tsx scripts/fix-audit-2026-09-money.ts --confirm  # apply
 *   npx tsx scripts/fix-audit-2026-09-money.ts --only=Scheme   # one table
 *
 * Rows are matched by id (looked up with read-only SQL on 28 Sep 2026), so
 * the run is exact and idempotent: a row already deleted, or a field that
 * already holds the new value, is skipped. If a field now holds neither
 * the value seen on the check date nor the new one, that whole fix is
 * skipped and reported (CHANGED SINCE CHECK) — look at it by hand. Deletes
 * check the row's key fields the same way.
 *
 * Updates run one by one; deletes run as one deleteMany per table (sugar
 * seasons first); the whole run rolls back if any table deletes a
 * different number of rows than planned. Deleting a Tender also deletes
 * its awards, corrigenda, bidders, documents and flags (onDelete: Cascade).
 * The Leader table is never touched.
 */
import "./_env";
import { PrismaClient, Prisma } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRM = process.argv.includes("--confirm");
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length) ?? null;
const CHECKED = "2026-09-28";

type Table =
  | "BudgetEntry"
  | "BudgetAllocation"
  | "InfraProject"
  | "SugarFactory"
  | "SugarFactorySeason"
  | "LocalIndustry"
  | "Tender"
  | "Scheme";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

interface Fix {
  /** Index of the finding in the audit's money.json. */
  finding: number;
  table: Table;
  id: string;
  /** update = a checked new value; hide = null / active=false / 0 = "not published"; delete = the whole row was unfounded. */
  kind: "update" | "hide" | "delete";
  /** New values. Dates as "YYYY-MM-DD" (IST midnight). Money in whole rupees. JSON columns take objects/arrays. */
  set?: Record<string, Json>;
  /** Values seen on the check date (for deletes: the row's key fields). */
  was?: Record<string, Json>;
  label: string;
  why: string;
  /** The page that backs the change (or says nothing traceable exists). */
  source: string;
}

/** DateTime columns: "YYYY-MM-DD" becomes IST midnight. */
const DATE_FIELDS = new Set([
  "startDate", "expectedEnd", "completionDate", "revisedEndDate", "originalEndDate", "actualStartDate", "announcedDate",
]);
/** Json columns: null is written as a database NULL. */
const JSON_FIELDS = new Set(["keyPeople", "details", "sourceUrls"]);
/** Deletes run in this order (children first). */
const DELETE_ORDER: Table[] = ["SugarFactorySeason", "Tender", "BudgetEntry", "BudgetAllocation", "Scheme", "LocalIndustry", "InfraProject", "SugarFactory"];

// ═══════════════════════════════════════════════════════════════════════
//  Rows looked up with read-only SQL on the check date
// ═══════════════════════════════════════════════════════════════════════

/** BudgetEntry rows (read-only SQL, 28 Sep 2026): [id, fiscalYear, sector, allocated (rupees), source]. */
const BUDGET_ENTRY_ROWS: Record<string, Array<[string, string, string, number, string | null]>> = {
  "bengaluru-urban": [
    ["cmnakaty7001g1axn3xmrkpvn", "2024-25", "BBMP — Education (Schools)", 4200000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakatwt001f1axnvqu0vyuq", "2024-25", "BBMP — Public Health & Hospitals", 6800000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakatty001d1axn8r4f96bn", "2024-25", "BBMP — Roads & Infrastructure", 32000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakatvg001e1axn2o2fyjlc", "2024-25", "BBMP — Solid Waste Management", 8500000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakau4l001i1axn3fqrvn1i", "2024-25", "BDA — Housing Projects", 8000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakatzu001h1axn2agcz432", "2024-25", "BDA — Layout Development", 12000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaua8001m1axnqqd6ick2", "2024-25", "BESCOM — Power Infrastructure", 22000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaubj001n1axn2rzzlhdv", "2024-25", "BMTC — Transport", 6500000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakau8w001l1axniihhy6mo", "2024-25", "BWSSB — Sewerage (STP)", 9500000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakau7k001k1axnd5dtt7q0", "2024-25", "BWSSB — Water Supply", 18000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaufy001q1axnpqjufvj8", "2024-25", "Education (Primary — State)", 5800000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauho001r1axn34xrrm9b", "2024-25", "Health (State — PHC/CHC)", 3900000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauj1001s1axne22mujvs", "2024-25", "Industries & IT Parks", 2800000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauem001p1axn7ac6wndz", "2024-25", "Lake Rejuvenation (BBMP)", 3200000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakau66001j1axns7e1lwqs", "2024-25", "Namma Metro (BMRCL)", 45000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauns001v1axn2aye1q5f", "2024-25", "Police & Law Enforcement", 4500000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaulq001u1axnsyz4hwxh", "2024-25", "Revenue & Registration", 850000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaud9001o1axnighvvz3r", "2024-25", "Smart City Bengaluru", 5000000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaukd001t1axnwtnjc3x6", "2024-25", "Social Welfare", 2200000000, "BBMP Budget 2024-25 / BDA / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaut5001z1axnhkj9w6yn", "2025-26", "BBMP — Education (Schools)", 4600000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaurv001y1axnviw3ftnv", "2025-26", "BBMP — Public Health & Hospitals", 7400000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaup5001w1axnav09irzv", "2025-26", "BBMP — Roads & Infrastructure", 35000000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauqi001x1axn28pe8y41", "2025-26", "BBMP — Solid Waste Management", 9200000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakaux400211axn65ydms44", "2025-26", "BDA — Housing Projects", 8800000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauvs00201axnhps1durp", "2025-26", "BDA — Layout Development", 13500000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav3j00251axn29s2bvfb", "2025-26", "BESCOM — Power Infrastructure", 24000000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav4v00261axn3bzgm2is", "2025-26", "BMTC — Transport", 7200000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav2700241axnva0kplhh", "2025-26", "BWSSB — Sewerage (STP)", 10500000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav0u00231axnk239atij", "2025-26", "BWSSB — Water Supply", 20000000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav9000291axnocq52o7z", "2025-26", "Education (Primary — State)", 6400000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakavac002a1axnz7r4fbxg", "2025-26", "Health (State — PHC/CHC)", 4300000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakavbp002b1axnlbdacxpl", "2025-26", "Industries & IT Parks", 3100000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav7l00281axn3uhz8614", "2025-26", "Lake Rejuvenation (BBMP)", 3800000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakauyg00221axn3vd8hzqk", "2025-26", "Namma Metro (BMRCL)", 52000000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakavfo002e1axncg1vi6z0", "2025-26", "Police & Law Enforcement", 5000000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakavec002d1axn45m2i715", "2025-26", "Revenue & Registration", 950000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakav6800271axnmpo8bxwj", "2025-26", "Smart City Bengaluru", 5500000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmnakavd2002c1axngkcfh66n", "2025-26", "Social Welfare", 2450000000, "BBMP Budget 2025-26 / BMRCL / Karnataka State Budget / finance.karnataka.gov.in"],
  ],
  "chennai": [
    ["cmnfm3r6z001351xn3xgrweff", "2025-26", "Health & Hospitals", 8000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6z001751xnadd1fqp2", "2025-26", "Metro & Transport (CMRL/MTC)", 20000000000, "Central + State Allocation"],
    ["cmnfm3r6z001551xn0mkjm0ad", "2025-26", "Parks & Playgrounds", 4000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6y001051xn0ebx74s8", "2025-26", "Roads & Bridges", 15000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6z001251xng825r1e4", "2025-26", "Solid Waste Management", 10000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6z001151xnzadx96eh", "2025-26", "Storm Water Drains", 12000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6z001451xnfc3i7axc", "2025-26", "Street Lighting", 5000000000, "GCC Budget 2025-26"],
    ["cmnfm3r6z001651xn4ts2e7o0", "2025-26", "Water Supply (CMWSSB)", 12000000000, "TN State / CMWSSB Budget"],
  ],
  "hyderabad": [
    ["cmnrsybv6000syaxnahv5m9qo", "2025-26", "GHMC — Infrastructure", 30000000000, "ghmc.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000uyaxnyxvud4w7", "2025-26", "GHMC — Roads", 25000000000, "ghmc.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000tyaxn0gbx9z6e", "2025-26", "GHMC — Solid Waste Management", 15000000000, "ghmc.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000myaxnpwszydzd", "2026-27", "Education", 180000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000nyaxnlasciiuj", "2026-27", "Health & Medical", 120000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000oyaxnq9yh4366", "2026-27", "Hyderabad Metro Rail", 11000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000ryaxnjmzxjyy2", "2026-27", "IT & Communications", 15000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv5000lyaxn78qkvfi4", "2026-27", "Municipal Admin & Urban Development", 179070000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000qyaxn461hi5ut", "2026-27", "Police & Home Affairs", 100000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
    ["cmnrsybv6000pyaxn1sr436lj", "2026-27", "Roads & Buildings", 80000000000, "finance.telangana.gov.in (estimated from state avg utilisation)"],
  ],
  "kolkata": [
    ["cmnfm3ngi00114exn1snedxdg", "2025-26", "Drainage & Sewerage", 15000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00144exnuekoovjq", "2025-26", "Education", 8000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00134exn8y2d1vym", "2025-26", "Health & Hospitals", 12000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00164exn4zqy9vsz", "2025-26", "Parks & Gardens", 4000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngh00104exnh497v4ux", "2025-26", "Roads & Bridges", 18000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00154exnh4p04it2", "2025-26", "Solid Waste Management", 10000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00124exnd0ta8392", "2025-26", "Street Lighting", 6000000000, "KMC Budget 2025-26"],
    ["cmnfm3ngi00174exnvwd1z99w", "2025-26", "Water Supply", 7000000000, "KMC Budget 2025-26"],
  ],
  "lucknow": [
    ["cmntdqt8l000llnxndppqz7ki", "2025-26", "Agriculture", 25000000000, "UP Finance Department"],
    ["cmntdqt8j000elnxnurynlaqt", "2025-26", "Education", 150000000000, "UP Finance Department (budget.up.nic.in)"],
    ["cmntdqt8l000flnxnni47v78e", "2025-26", "Health & Medical", 95000000000, "UP Finance Department"],
    ["cmntdqt8l000nlnxnvw1e1ja0", "2025-26", "Lucknow Metro (LMRC)", 20000000000, "UP Finance Department"],
    ["cmntdqt8l000ilnxnk2qww1yh", "2025-26", "Municipal Administration (LMC)", 55000000000, "UP Finance Department"],
    ["cmntdqt8l000glnxn6fxp9qp5", "2025-26", "Police & Home Affairs", 85000000000, "UP Finance Department"],
    ["cmntdqt8l000hlnxn3jyz4zrt", "2025-26", "Roads & PWD", 70000000000, "UP Finance Department"],
    ["cmntdqt8l000mlnxnphhlupih", "2025-26", "Social Welfare", 35000000000, "UP Finance Department"],
    ["cmntdqt8l000jlnxn8cckwge2", "2025-26", "Urban Development (LDA)", 45000000000, "UP Finance Department"],
    ["cmntdqt8l000klnxnvcwxdun2", "2025-26", "Water Supply (Jal Kal)", 30000000000, "UP Finance Department"],
  ],
  "mandya": [
    ["cmmv9nbyf0047ubxnkhiiwj0w", "2024-25", "Agriculture & Allied", 2854000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc040048ubxn4ge4vkeh", "2024-25", "Education", 4128000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc1p0049ubxns9ty4ep0", "2024-25", "Health & Family Welfare", 1893000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc3a004aubxn4pwyysi0", "2024-25", "Roads & Infrastructure", 5382000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc9p004eubxn8xk2zy2r", "2024-25", "Rural Development", 2458000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc6j004cubxny6o5mb0m", "2024-25", "Social Welfare", 1564000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc83004dubxnmu2q3rf5", "2024-25", "Urban Development", 987000000, "Karnataka State Budget / finance.karnataka.gov.in"],
    ["cmmv9nc4w004bubxnshei2xk8", "2024-25", "Water Resources", 3126000000, "Karnataka State Budget / finance.karnataka.gov.in"],
  ],
  "mumbai": [
    ["cmnfm3fl9001e3rxn1bf3ohit", "2025-26", "Development Planning", 80000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl9001a3rxnrk0ntyyc", "2025-26", "Education", 40000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl9001c3rxn1k7khqg8", "2025-26", "Fire Brigade", 12000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl9001d3rxnoxxktzl2", "2025-26", "Gardens & Open Spaces", 10000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl900193rxnpjimni48", "2025-26", "Health & Hospitals", 55000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl700163rxnmmvnxi0y", "2025-26", "Infrastructure & Roads", 150000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl9001f3rxnb7z8qu0o", "2025-26", "Metro & Transport (MMRDA)", 120000000000, "MMRDA / State Allocation"],
    ["cmnfm3fl900183rxnxr5fl9xw", "2025-26", "Sewerage & Drainage", 65000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl9001b3rxn49hqwz82", "2025-26", "Solid Waste Management", 35000000000, "BMC Budget 2025-26"],
    ["cmnfm3fl900173rxnmogxffat", "2025-26", "Water Supply", 85000000000, "BMC Budget 2025-26"],
  ],
  "mysuru": [
    ["cmnakamdo000y0mxn238dox5u", "2024-25", "Agriculture & Allied", 2105000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamia00110mxnwhpe4rnk", "2024-25", "Education (Primary + Secondary)", 4250000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamjk00120mxnsirlzegt", "2024-25", "Health & Family Welfare", 1950000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamtw00170mxn4ul1haon", "2024-25", "Industries & Commerce", 850000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamf3000z0mxnlfo5snao", "2024-25", "Irrigation & Water Resources", 3800000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamwk00190mxn9qsztxbj", "2024-25", "Police & Law Enforcement", 1800000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamot00150mxnfytmh5zm", "2024-25", "Roads & Bridges (PWD)", 3100000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamgd00100mxnuf75nxn1", "2024-25", "Rural Development (RDPR)", 2900000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakammb00140mxn6ricmo0j", "2024-25", "Social Welfare & Empowerment", 1650000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamv800180mxnai8ie4hl", "2024-25", "Tourism & Heritage", 1200000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakaml000130mxnkfg2p2m2", "2024-25", "Urban Development (MCC)", 5200000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamsk00160mxnl6qtu8dg", "2024-25", "Water Supply & Sanitation (KUWSDB)", 2300000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamxu001a0mxnmn1s3mq4", "2024-25", "Women & Child Development", 950000000, "Karnataka State Budget 2024-25 / finance.karnataka.gov.in"],
    ["cmnakamza001b0mxnc2lsp3ip", "2025-26", "Agriculture & Allied", 2280000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan3j001e0mxnikis4du4", "2025-26", "Education (Primary + Secondary)", 4550000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan4s001f0mxnz3w89evs", "2025-26", "Health & Family Welfare", 2100000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakanbe001k0mxnyhi8phh5", "2025-26", "Industries & Commerce", 950000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan0o001c0mxnb29om4fu", "2025-26", "Irrigation & Water Resources", 4050000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakane0001m0mxnqy5eovsc", "2025-26", "Police & Law Enforcement", 1950000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan8q001i0mxne94latqa", "2025-26", "Roads & Bridges (PWD)", 3400000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan27001d0mxnu9269gjm", "2025-26", "Rural Development (RDPR)", 3150000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan7g001h0mxn4ut320fa", "2025-26", "Social Welfare & Empowerment", 1780000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakancp001l0mxn4a4qqoae", "2025-26", "Tourism & Heritage", 1350000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakan63001g0mxnlshr8xs7", "2025-26", "Urban Development (MCC)", 5600000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakana3001j0mxnvkz3idw3", "2025-26", "Water Supply & Sanitation", 2480000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
    ["cmnakanfa001n0mxno9fodo36", "2025-26", "Women & Child Development", 1050000000, "Karnataka State Budget 2025-26 / finance.karnataka.gov.in"],
  ],
  "new-delhi": [
    ["cmnf0n51k000m1dxnm5erdd86", "2025-26", "Education", 160000000000, "Delhi Budget / delhiplanning.delhi.gov.in"],
    ["cmnf0n51l000x1dxnt9tezzmy", "2025-26", "Environment & Forest", 12000000000, "Delhi Budget"],
    ["cmnf0n51l000n1dxns8os06p7", "2025-26", "Health & Hospitals", 90000000000, "Delhi Budget"],
    ["cmnf0n51l000v1dxnorlqla76", "2025-26", "Housing", 25000000000, "Delhi Budget"],
    ["cmnf0n51l000p1dxn4fsck8yj", "2025-26", "Police & Home (Central)", 85000000000, "Delhi Budget"],
    ["cmnf0n51l000t1dxnkq2pp1gq", "2025-26", "Power Subsidy", 30000000000, "Delhi Budget"],
    ["cmnf0n51l000u1dxnk182ndfw", "2025-26", "Public Works", 30000000000, "Delhi Budget"],
    ["cmnf0n51l000w1dxnbjk0ea5k", "2025-26", "Revenue & General Admin", 15000000000, "Delhi Budget"],
    ["cmnf0n51l000s1dxnnxumauo4", "2025-26", "Social Welfare", 35000000000, "Delhi Budget"],
    ["cmnf0n51l000o1dxnqnoks7jp", "2025-26", "Transport (DMRC+DTC+Roads)", 80000000000, "Delhi Budget"],
    ["cmnf0n51l000r1dxnpw79m1q9", "2025-26", "Urban Development", 40000000000, "Delhi Budget"],
    ["cmnf0n51l000q1dxn1lifxg8u", "2025-26", "Water & Sewerage (DJB)", 50000000000, "Delhi Budget"],
  ],
  "pune": [
    ["cmobrvx2z0004soxnfadcp5p6", "2026-27", "General Administration & Welfare", 145761200000, "Aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26 budgets (Pune district). See BudgetAllocation model for per-body breakdown."],
    ["cmobrvwzx0003soxnyda0scug", "2026-27", "Health & Hospitals", 11000000000, "Aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26 budgets (Pune district). See BudgetAllocation model for per-body breakdown."],
    ["cmobrvwpt0000soxnmh18c3wl", "2026-27", "Infrastructure & Roads", 27000000000, "Aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26 budgets (Pune district). See BudgetAllocation model for per-body breakdown."],
    ["cmobrvwtp0001soxn52s3cdi3", "2026-27", "Sewerage & Drainage", 11666100000, "Aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26 budgets (Pune district). See BudgetAllocation model for per-body breakdown."],
    ["cmobrvwws0002soxnrjhx8gp6", "2026-27", "Water Supply", 4000000000, "Aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26 budgets (Pune district). See BudgetAllocation model for per-body breakdown."],
  ],
};

/** BudgetAllocation rows with no source link (read-only SQL, 28 Sep 2026): [id, fiscalYear, department, allocated, source]. */
const BUDGET_ALLOCATION_ROWS: Record<string, Array<[string, string, string, number, string]>> = {
  "bengaluru-urban": [
    ["cmmvn6pn10059muxnmmn5qbsk", "2024-25", "BBMP", 82500000000, "BBMP Budget"],
    ["cmmvn6pn1005amuxnkm8drcgm", "2024-25", "BMRCL", 68000000000, "BMRCL Annual Report"],
    ["cmmvn6pn1005cmuxnrtpd9dvf", "2024-25", "BWSSB", 24000000000, "BWSSB"],
    ["cmmvn6pn1005emuxnwfj57al5", "2024-25", "Health & FW", 12400000000, "Dept. of Health"],
    ["cmmvn6pn1005bmuxnl0x7bckv", "2024-25", "Karnataka PWD", 32000000000, "Karnataka PWD"],
    ["cmmvn6pn1005dmuxn611s22u1", "2024-25", "Primary Education (DDPI)", 18500000000, "Dept. of Public Instruction"],
  ],
  "mandya": [
    ["cmmv9ncem004hubxnlgj6f8rc", "2024-25", "Agriculture Department", 452000000, "Karnataka Expenditure Monitoring System"],
    ["cmmv9ncg6004iubxn2a9viqh0", "2024-25", "Health & Family Welfare", 678000000, "Karnataka Expenditure Monitoring System"],
    ["cmmv9ncje004kubxnsdjeia9c", "2024-25", "Minor Irrigation", 389000000, "Karnataka Expenditure Monitoring System"],
    ["cmmv9nchs004jubxnoyw8f4yr", "2024-25", "Primary Education", 1124000000, "Karnataka Expenditure Monitoring System"],
    ["cmmv9ncbe004fubxnhqk3jkx0", "2024-25", "Public Works Department", 1245000000, "Karnataka Expenditure Monitoring System"],
    ["cmmv9ncd1004gubxnleeuvrvy", "2024-25", "Zilla Panchayat", 896000000, "Karnataka Expenditure Monitoring System"],
  ],
  "new-delhi": [
    ["cmnf0n56500111dxnpanzlmix", "2025-26", "Delhi Jal Board", 50000000000, "Delhi Budget"],
    ["cmnf0n56500131dxnzbpf5k71", "2025-26", "Delhi Police (MHA)", 85000000000, "Union Budget / MHA"],
    ["cmnf0n565000y1dxn1s0uldls", "2025-26", "Directorate of Education", 160000000000, "Delhi Budget"],
    ["cmnf0n565000z1dxnll6qg1ro", "2025-26", "Health & Family Welfare", 90000000000, "Delhi Budget"],
    ["cmnf0n56500121dxny3pn8y0m", "2025-26", "PWD Delhi", 30000000000, "Delhi Budget"],
    ["cmnf0n56500101dxnxv0ldpeq", "2025-26", "Transport Department", 80000000000, "Delhi Budget"],
  ],
};

/** Pune FY 2025-26 rows: notes as stored (read-only SQL, 28 Sep 2026). The last paragraph is the made-up utilisation "estimate". */
const PUNE_ESTIMATE_NOTE = "\n\nFY 2025-26 utilization estimate: 78% released, 65% spent — defensible approximation pending CAG audit publication. Source string flags estimate status.";
const PUNE_2025_26: Array<{ id: string; body: string; allocated: number; released: number; spent: number; source: string; sourceUrl: string }> = [
  { id: "cmobqkrq30002ofxng1otek77", body: "Presented by Shekhar Singh, Municipal Commissioner, on 2025-02-20.\n\nHighlights: ₹1,962.72 cr development projects; ₹1,898 cr BSUP (Basic Services to Urban Poor); ₹753.56 cr special construction schemes; ₹417 cr PMPML public transport; ₹300 cr water supply; ₹83 cr Gender Budget; ₹62.09 cr schemes for persons with disabilities; ₹136.52 cr operation of 8 ward offices; ₹200 cr green bond raised (Harit Setu financing); no property tax or water tax hike.\n\nSecondary source: PCMC Official | https://www.pcmcindia.gov.in\n\nDisclaimer: Figures as presented by PCMC Commissioner to the Standing Committee February 20, 2025.", allocated: 96752700000, released: 75467106000, spent: 62889255000, source: "Punekar News", sourceUrl: "https://www.punekarnews.in/pune-pcmc-presents-rs-9675-27-crore-budget-for-2025-26-with-no-hike-in-property-or-water-tax-focus-on-development-and-welfare/" },
  { id: "cmobqkri10000ofxni1bqxgya", body: "Presented by Dr. Rajendra Bhosale, Municipal Commissioner & Administrator, on 2025-03-04.\n\nHighlights: ₹623 cr for 32 newly included villages; ₹1,200 cr for 33 missing link roads (15 high-traffic + 17 additional); no property tax hike.\n\nActual revenue collection by January 2026: ₹7,701 crore (61% of budgeted). Reported shortfall due to real estate slowdown + election code-of-conduct restrictions. Figures per PMC mid-year review.\n\nSecondary source: The Bridge Chronicle | https://www.thebridgechronicle.com/pune/pune-budget-2026-27-13995-crore-roads-water-infrastructure-merged-villages-agn97\n\nDisclaimer: Figures as presented by PMC Commissioner to the Standing Committee. Mid-year collection figures indicative and subject to quarterly revision by PMC's Finance Department.", allocated: 126180000000, released: 98420400000, spent: 82017000000, source: "Lokmat Times", sourceUrl: "https://www.lokmattimes.com/pune/pmc-budget-2025-26-rs-12618-crore-allocated-for-infrastructure-healthcare-and-cleanliness-no-tax-hike-for-pune-residents-a510/" },
  { id: "cmobqkrx50004ofxn0odoojqh", body: "Presented on 2025-03-20 by Pune ZP Administration (then-CEO Gajanan Patil; current CEO U A Jadhav).\n\nHighlights: ₹58 cr increase over previous year; ₹24.26 cr Social Welfare (20% reserve allocation); ₹8 cr Disabled welfare; ₹12.13 cr Women & Child Welfare (10% reserve allocation); ₹14 cr Education; ~45,000 beneficiaries under direct benefit schemes; ₹1 cr Educational Quality Development — NASA + ISRO exposure program for 75 ZP school students selected via IUCAA screening of ~58,000 candidates.\n\nOutstanding: Pune ZP has requested ₹136 crore from PMC for infrastructure in 32 villages merged into PMC limits.\n\nSecondary source: Punekar News | https://www.punekarnews.in/pune-zilla-parishad-to-send-75-students-to-nasa-and-isro-in-2025-26/\n\nDisclaimer: Pune ZP annual budget as approved by administrative committee. For current official figures, refer to https://www.punezp.gov.in", allocated: 2920000000, released: 2277600000, spent: 1898000000, source: "Saamana", sourceUrl: "https://www.saamana.com/pune-zilla-parishad-292-crore-budget-for-development/" },
];

// ═══════════════════════════════════════════════════════════════════════
//  1. Budgets (findings 0–9)
// ═══════════════════════════════════════════════════════════════════════

/** Why and source for each district's seeded sector rows. */
const BUDGET_ENTRY_GROUPS: Record<string, { finding: number; why: string; source: string }> = {
  hyderabad: {
    finding: 0,
    why: "Statewide Telangana department totals filed under Hyderabad district, with 'spent' made up from a state average utilisation. No district-level budget is published.",
    source: "https://prsindia.org/budgets/states/telangana-budget-analysis-2026-27 (statewide figures only)",
  },
  "bengaluru-urban": {
    finding: 1,
    why: "Seeded sectors: every 2025-26 row exactly ~44% spent and every 2024-25 row ~70% spent (fixed ratios, not accounts); BMRCL contradicts the department row. No sector-wise spending is published.",
    source: "https://www.lokmattimes.com/politics/bbmp-unveils-2024-25-budget-prioritizing-brand-bengaluru-and-tackling-traffic-woes-a475 (BBMP 2024-25: Rs 12,371.63 cr as presented)",
  },
  mysuru: {
    finding: 2,
    why: "Hand-typed sectors (released = 0.8 x allocated in every row), attributed to the statewide Karnataka budget, which publishes no Mysuru sector spending.",
    source: "none traceable — prisma/seed-mysuru-leaders-fix.ts; Karnataka State Budget has no district sector spending",
  },
  mandya: {
    finding: 3,
    why: "Demo sector rows hand-typed in prisma/seed.ts with no link; could not be traced to any published document.",
    source: "none traceable — prisma/seed.ts",
  },
  "new-delhi": {
    finding: 4,
    why: "Invented round NCT-wide figures shown as New Delhi district's (Education Rs 16,000 cr vs NCT Rs 19,291 cr), with made-up spent/lapsed; Delhi Police is not in the Delhi budget.",
    source: "https://theprint.in/economy/delhi-budget-2025-26-infra-boost-clean-yamuna-push-education-healthcare-see-reduced-allocations/2565159/",
  },
  mumbai: {
    finding: 5,
    why: "Invented round BMC sectors (Health Rs 5,500 cr vs ~Rs 7,379 cr reported; MMRDA is not BMC money) with made-up spending.",
    source: "https://www.tribuneindia.com/news/business/bmc-proposes-rs-74427-41-crore-budget-for-2025-26-up-14-19-from-last-year/amp",
  },
  kolkata: {
    finding: 6,
    why: "8 round KMC sectors adding up to Rs 8,000 cr; the KMC 2025-26 budget estimates Rs 5,639.56 cr under six heads. Spending invented.",
    source: "https://www.kmcgov.in/KMCPortal/downloads/Budget_English_2025_2026.pdf",
  },
  chennai: {
    finding: 7,
    why: "Invented round GCC sectors (storm water drains Rs 1,200 cr vs Rs 1,032.25 cr) with made-up spending.",
    source: "https://www.thenewsminute.com/tamil-nadu/chennai-corporation-budget-2025-26-focus-remains-on-swds-roads-infrastructure",
  },
  lucknow: {
    finding: 8,
    why: "Invented district figures (Rs 61,000 cr for one district, ~7.5% of the whole UP budget) credited to the state finance department, which publishes no district sector budget.",
    source: "https://www.tribuneindia.com/news/business/uttar-pradesh-presents-rs8-08-lakh-cr-budget-for-fy-2025-26-focus-on-ai-infrastructure-and-social-welfare",
  },
  pune: {
    finding: 9,
    why: "Sector split 'aggregated from PMC FY 2026-27 + PCMC FY 2026-27 + ZP FY 2025-26' mixes years (and a residual 'General Administration' bucket). The per-body rows (BudgetAllocation, with links) stay.",
    source: "the rows' own source string; per-body budgets: BudgetAllocation rows with news links",
  },
};

const BUDGET_ALLOCATION_GROUPS: Record<string, { finding: number; why: string; source: string }> = {
  "bengaluru-urban": {
    finding: 1,
    why: "Hand-typed department rows with no link (BBMP Rs 8,250 cr given vs the Rs 12,371.63 cr budget presented; BMRCL Rs 6,800 cr vs Rs 4,500 cr in the sector rows); spent/lapsed made up.",
    source: "https://www.lokmattimes.com/politics/bbmp-unveils-2024-25-budget-prioritizing-brand-bengaluru-and-tackling-traffic-woes-a475",
  },
  mandya: {
    finding: 3,
    why: "Department rows with 'lapsed' amounts from a 'Karnataka Expenditure Monitoring System' that could not be found; no link; hand-typed in prisma/seed.ts.",
    source: "none traceable — prisma/seed.ts",
  },
  "new-delhi": {
    finding: 4,
    why: "Invented round department rows (spent and lapsed made up); NCT-wide, not New Delhi district.",
    source: "https://theprint.in/economy/delhi-budget-2025-26-infra-boost-clean-yamuna-push-education-healthcare-see-reduced-allocations/2565159/",
  },
};

function budgetFixes(): Fix[] {
  const out: Fix[] = [];
  for (const [slug, rows] of Object.entries(BUDGET_ENTRY_ROWS)) {
    const g = BUDGET_ENTRY_GROUPS[slug];
    if (!g) throw new Error(`No reason recorded for BudgetEntry rows of ${slug}`);
    for (const [id, fiscalYear, sector, allocated, source] of rows) {
      out.push({ finding: g.finding, table: "BudgetEntry", id, kind: "delete", was: { fiscalYear, sector, allocated, source }, label: `${slug} · FY ${fiscalYear} · ${sector}`, why: g.why, source: g.source });
    }
  }
  for (const [slug, rows] of Object.entries(BUDGET_ALLOCATION_ROWS)) {
    const g = BUDGET_ALLOCATION_GROUPS[slug];
    if (!g) throw new Error(`No reason recorded for BudgetAllocation rows of ${slug}`);
    for (const [id, fiscalYear, department, allocated, source] of rows) {
      out.push({ finding: g.finding, table: "BudgetAllocation", id, kind: "delete", was: { fiscalYear, department, allocated, source, sourceUrl: null }, label: `${slug} · FY ${fiscalYear} · ${department}`, why: g.why, source: g.source });
    }
  }
  // Pune FY 2025-26: the allocation is published (news links kept); "spent"
  // and "released" were a flat 65% / 78% "estimate" → 0 = "not published yet".
  for (const r of PUNE_2025_26) {
    out.push({
      finding: 9,
      table: "BudgetAllocation",
      id: r.id,
      kind: "hide",
      set: { released: 0, spent: 0, remarks: r.body },
      was: { released: r.released, spent: r.spent, remarks: r.body + PUNE_ESTIMATE_NOTE, allocated: r.allocated },
      label: `pune · FY 2025-26 · ${r.source} row — spent/released`,
      why: "Spent and released were exactly 65% / 78% of the allocation, a 'defensible approximation' in the notes shown as real spending. FY 2025-26 spending is not published: shown as 'not published yet'; the estimate note is removed.",
      source: `the row's own notes; allocation stays as published (${r.sourceUrl})`,
    });
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════
//  2. Infrastructure projects (findings 11–18)
// ═══════════════════════════════════════════════════════════════════════

const INFRA_FIXES: Fix[] = [
  {
    finding: 11, table: "InfraProject", id: "cmmvn6tlf008qmuxnvthf2glk", kind: "hide",
    label: "Bengaluru Urban · Namma Metro Phase 2A & 2B — overrun, announcer, party",
    set: { costOverrun: null, costOverrunPct: null, announcedBy: null, announcedByRole: null, party: null },
    was: { costOverrun: 1107100000000, costOverrunPct: 297.847726661286, announcedBy: "JICA", announcedByRole: "Central Government", party: "JICA", budget: 147881010000, originalBudget: 147881010000, revisedBudget: 147881010000 },
    why: "'+Rs 1,10,710 cr (+298%)' with the same budget on every field — a stale news figure. JICA is the lender, not the announcer or a party.",
    source: "https://pib.gov.in/PressReleasePage.aspx?PRID=1712859 (sanctioned cost Rs 14,788.101 cr; no revision)",
  },
  {
    finding: 11, table: "InfraProject", id: "cmmvn6tlf008rmuxnn3epep1x", kind: "hide",
    label: "Bengaluru Urban · Namma Metro Phase 3 — overrun, announcer, party",
    set: { costOverrun: null, costOverrunPct: null, announcedBy: null, announcedByRole: null, party: null },
    was: { costOverrun: -334700000000, costOverrunPct: -90.04573580844767, announcedBy: "Japan International Cooperation Agency", announcedByRole: "Agency", party: "Japan International Cooperation Agency", budget: 156110000000, originalBudget: 156110000000, revisedBudget: 156110000000 },
    why: "'-Rs 33,470 cr (-90%)' with the same Rs 15,611 cr on every budget field — stale. JICA (a lender) shown as announcer and party.",
    source: "the row's own budgets (Rs 15,611 cr sanctioned on all three fields); finding 12 for the lender",
  },
  {
    finding: 11, table: "InfraProject", id: "cmonxprem001h04kyv5polx6r", kind: "hide",
    label: "Lucknow · AI City project — overrun, party (same class)",
    set: { costOverrun: null, costOverrunPct: null, party: null },
    was: { costOverrun: 33120000000, costOverrunPct: 900, party: "Uttar Pradesh government", originalBudget: 3680000000, revisedBudget: 3680000000 },
    why: "'+900%' with the same budget on both fields (a 10x figure from news); 'Uttar Pradesh government' is not a political party.",
    source: "the row's own budgets (original = revised = Rs 368 cr)",
  },
  {
    finding: 12, table: "InfraProject", id: "cmnyyt84j0026krxn4zsjg9oe", kind: "hide",
    label: "Bengaluru Urban · Namma Metro Phase 2 — party",
    set: { party: null }, was: { party: "Jindal Steel" },
    why: "'Announced by BMRCL (Jindal Steel)': a steel company in the party field.",
    source: "rule: party is a political party or empty",
  },
  {
    finding: 12, table: "InfraProject", id: "cmpz38mqt000p04l5k2q20haw", kind: "hide",
    label: "Hyderabad · CRMP Phase-II — party",
    set: { party: null }, was: { party: "Telangana government" },
    why: "'Telangana government (Telangana government)': a government is not a political party.",
    source: "rule: party is a political party or empty",
  },
  {
    finding: 12, table: "InfraProject", id: "cmsjyzje6002l04kwri7w9scz", kind: "hide",
    label: "Kolkata · Kolkata ring road — party",
    set: { party: null }, was: { party: "West Bengal government" },
    why: "'West Bengal government (West Bengal government)': a government is not a political party.",
    source: "rule: party is a political party or empty",
  },
  {
    finding: 12, table: "InfraProject", id: "cmq93eodx002o04jvhe9ffzdg", kind: "hide",
    label: "Kolkata · Kolkata Port Terminal Project — party (same class)",
    set: { party: null }, was: { party: "JSW Infra" },
    why: "A company in the party field.",
    source: "rule: party is a political party or empty",
  },
  {
    finding: 12, table: "InfraProject", id: "cmnfm3rdn001a51xn39osuzvu", kind: "hide",
    label: "Chennai · Peripheral Ring Road — announcer, party, contractor",
    set: { announcedBy: null, announcedByRole: null, party: null, contractor: null },
    was: { announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP", contractor: "NHAI / Various" },
    why: "The PRR is a Tamil Nadu (TNRDC / Highways, JICA-aided) project, not an NHAI one: 'Nitin Gadkari (BJP)' and contractor 'NHAI / Various' are unsupported. Executing agency (TN Highways / TNRDC) stays.",
    source: "https://www.nbmcw.com/news/chennai-peripheral-ring-road-to-become-tamil-nadus-1st-10-lane-expressway.html",
  },
  {
    finding: 13, table: "InfraProject", id: "cmnyyrpru001okrxn8v9x82rw", kind: "update",
    label: "Bengaluru Urban · Green Line extension Yelachenahalli–Silk Institute — people",
    set: {
      announcedBy: null, announcedByRole: null, announcedDate: null,
      keyPeople: [
        { name: "B.S. Yediyurappa", role: "Chief Minister, Karnataka", party: null, context: "Inaugurated the line on 14 Jan 2021" },
        { name: "Hardeep Singh Puri", role: "Union Minister of State, Housing and Urban Affairs", party: null, context: "Joined the inauguration by video" },
      ],
    },
    was: {
      announcedBy: "CM Bommai", announcedByRole: "Chief Minister, Karnataka", announcedDate: "2026-04-15",
      keyPeople: [{ name: "CM Bommai", role: "Chief Minister, Karnataka", party: null, context: "presented at the breakthrough of the tunnel boring machine Urja" }],
    },
    why: "Bommai became CM only in July 2021 and TBM 'Urja' is a Pink Line tunnel machine; this elevated line was inaugurated on 14 Jan 2021 by CM Yediyurappa. The 'announced Apr 2026' date was the news-sync date.",
    source: "https://www.thenewsminute.com/karnataka/yelachenahalli-kanakapura-road-bengaluru-metro-line-inaugurated-cm-yediyurappa-141483",
  },
  {
    finding: 14, table: "InfraProject", id: "cmmvn6tlf008zmuxna5j2fwra", kind: "update",
    label: "Bengaluru Urban · Electronic City Elevated Expressway — contractor",
    set: { contractor: "Bangalore Elevated Tollway Ltd (Soma Enterprise, NCC and Maytas Infra consortium)" },
    was: { contractor: "Dilip Buildcon Ltd" },
    why: "Built on a BOT basis by the Soma–NCC–Maytas consortium (BETL), opened Jan 2010 — not Dilip Buildcon.",
    source: "https://www.business-standard.com/article/press-releases/bangalore-elevated-tollway-project-inaugurated-110012200105_1.html",
  },
  {
    finding: 14, table: "InfraProject", id: "cmmvn6tlf008smuxni0jt8029", kind: "hide",
    label: "Bengaluru Urban · Green Line extension Nagasandra–Madavara — contractor, start",
    set: { contractor: null, startDate: null },
    was: { contractor: "BMRCL-DPR stage", startDate: "2024-06-01" },
    why: "'BMRCL-DPR stage' is not a contractor, and a Jun 2024 start for a line opened in Nov 2024 is wrong; neither could be verified.",
    source: "none — hidden until verified",
  },
  {
    finding: 15, table: "InfraProject", id: "cmmv9ng2w006zubxn3abbcmb2", kind: "update",
    label: "Mandya · Bengaluru–Mysuru Expressway (NH-275) — contractor",
    set: { contractor: "Dilip Buildcon Ltd" }, was: { contractor: "G R Infraprojects Ltd" },
    why: "Dilip Buildcon was awarded both packages (Bengaluru–Nidaghatta and Nidaghatta–Mysuru); the Bengaluru Urban row already says so.",
    source: "https://swarajyamag.com/infrastructure/bengaluru-mysuru-expressway-will-be-completed-by-october-2022-nitin-gadkari",
  },
  {
    finding: 16, table: "InfraProject", id: "cmnfmsj1i002x10o34yyomegd", kind: "hide",
    label: "Mumbai · Versova–Bhayander Coastal Road — dates, progress, key person",
    set: { startDate: null, actualStartDate: null, announcedDate: null, originalEndDate: null, revisedEndDate: null, progressPct: null, keyPeople: null },
    was: {
      startDate: "2018-10-01", actualStartDate: "2018-10-01", announcedDate: "2018-10-01", originalEndDate: "2023-12-31", revisedEndDate: "2025-06-30", progressPct: 0,
      keyPeople: [{ name: "Iqbal Singh Chahal", role: "Former Municipal Commissioner", party: null, context: "Execution oversight" }],
    },
    why: "Dates copied from the southern Coastal Road: full construction began Jan 2026 with completion targeted Dec 2028 (expectedEnd already says so), so 'deadline passed 15 months ago' was false. 0% progress and the old commissioner are unverified.",
    source: "https://swarajyamag.com/news-brief/versova-bhayandar-coastal-road-construction-begins-after-mangrove-cell-clearance",
  },
  {
    finding: 17, table: "InfraProject", id: "cmnfm3frn001h3rxnu534k656", kind: "update",
    label: "Mumbai · Metro Line 2A — key people, short name, plan dates after completion",
    set: { keyPeople: null, shortName: "Metro Line 2A", originalEndDate: null, revisedEndDate: null },
    was: {
      shortName: "Metro Line 3", originalEndDate: "2025-12-31", revisedEndDate: "2027-12-31",
      keyPeople: [
        { name: "Ashwini Bhide", role: "MD, MMRC", party: null, context: "Project head" },
        { name: "Devendra Fadnavis", role: "Former CM", party: "BJP", context: "Approved during tenure" },
      ],
    },
    why: "Line 2A is an MMRDA line (MMRC / Ashwini Bhide run Line 3); Fadnavis is the current CM, not 'Former CM'; short name said 'Metro Line 3'. Completed Jan 2023, so an amber 'revised end Dec 2027' is wrong (finding 18).",
    source: "ForThePeople leaders data (/api/data/leaders?state=maharashtra&district=mumbai: Fadnavis, Chief Minister since 5 Dec 2024); the row's own executingAgency MMRDA and completionDate",
  },
  {
    finding: 17, table: "InfraProject", id: "cmnfm3frn001j3rxna5plvh2x", kind: "update",
    label: "Mumbai · Metro Line 4 — key people, short name",
    set: { keyPeople: null, shortName: "Metro Line 4" },
    was: {
      shortName: "Metro Line 3",
      keyPeople: [
        { name: "Ashwini Bhide", role: "MD, MMRC", party: null, context: "Project head" },
        { name: "Devendra Fadnavis", role: "Former CM", party: "BJP", context: "Approved during tenure" },
      ],
    },
    why: "Line 4 is an MMRDA line (MMRC / Ashwini Bhide run Line 3); Fadnavis is the current CM; short name said 'Metro Line 3'.",
    source: "ForThePeople leaders data (/api/data/leaders?state=maharashtra&district=mumbai); the row's own executingAgency MMRDA",
  },
  {
    finding: 18, table: "InfraProject", id: "cmnfm3rdn001951xnw22wrweh", kind: "hide",
    label: "Chennai · Metro Phase 1 Extension — progress and dates after completion",
    set: { progressPct: null, expectedEnd: null, originalEndDate: null, actualStartDate: null, announcedDate: null },
    was: { progressPct: 70, expectedEnd: "2026-12-31", originalEndDate: "2028-12-31", actualStartDate: "2022-01-01", announcedDate: "2022-01-01" },
    why: "Opened Feb 2021 but showed 'Completed · 70%', end dates in 2026/2028 and a start and announcement in 2022 (after it opened) — from Phase 2 news.",
    source: "the row's own status COMPLETED and completionDate 14 Feb 2021",
  },
  {
    finding: 18, table: "InfraProject", id: "cmnyy5uie000qdpxnmttrg14h", kind: "hide",
    label: "Hyderabad · Hyderabad Metro Rail — progress after completion",
    set: { progressPct: null }, was: { progressPct: 80 },
    why: "'Completed · 80%'.",
    source: "the row's own status COMPLETED (completion Feb 2020)",
  },
  {
    finding: 18, table: "InfraProject", id: "cmnfm3frn001g3rxnckhr9t6p", kind: "hide",
    label: "Mumbai · Metro Line 3 (Aqua Line) — progress and end date after completion",
    set: { progressPct: null, expectedEnd: null }, was: { progressPct: 85, expectedEnd: "2026-12-31" },
    why: "Opened Oct 2025 but showed 'Completed · 85%' and an expected end of Dec 2026.",
    source: "the row's own status COMPLETED and completionDate Oct 2025",
  },
];

// ═══════════════════════════════════════════════════════════════════════
//  3. Sugar factories and local industries (findings 19, 20, 30–34)
// ═══════════════════════════════════════════════════════════════════════

const SUGAR_SOURCE = "https://www.anekantprakashan.com/sugar-factories-in-mandya/district (not official) + https://www.bannari.com/BASL/Sugar_Bannari.html";

const INDUSTRY_FIXES: Fix[] = [
  {
    finding: 19, table: "SugarFactory", id: "cmmv9nbeg003vubxne6low9xt", kind: "hide",
    label: "Mandya · Bannari Amman Sugars → active=false", set: { active: false }, was: { active: true, name: "Bannari Amman Sugars" },
    why: "Bannari Amman's Karnataka mills are at Alaganchi (Nanjangud, Mysuru district) and Kunthur (Kollegal); none is in Mandya. Hidden (reversible), not deleted.",
    source: SUGAR_SOURCE,
  },
  {
    finding: 19, table: "SugarFactory", id: "cmmv9nbi8003xubxnljhfx2y0", kind: "hide",
    label: "Mandya · KR Nagar Sakkare Karkhane → active=false", set: { active: false }, was: { active: true, name: "KR Nagar Sakkare Karkhane" },
    why: "K.R. Nagar is a Mysuru-district taluk, not in Nagamangala; no such Mandya mill is listed.",
    source: SUGAR_SOURCE,
  },
  {
    finding: 19, table: "SugarFactory", id: "cmmv9nb7y003rubxnc2ttg2xy", kind: "hide",
    label: "Mandya · 'Mandya National Paper Mills (MNPM) Sugar Division' → active=false", set: { active: false }, was: { active: true, name: "Mandya National Paper Mills (MNPM) Sugar Division" },
    why: "MNPM is a paper mill, not a sugar factory.",
    source: SUGAR_SOURCE,
  },
  {
    finding: 19, table: "SugarFactory", id: "cmmv9nbb3003tubxnaoovbow4", kind: "update",
    label: "Mandya · Sri Chamundeshwari Sugar Ltd — taluk", set: { taluk: "Maddur" }, was: { taluk: "Malavalli" },
    why: "The mill is at K.M. Doddi (Bharathinagar), Maddur taluk, not Malavalli.",
    source: "https://chamundeswarisugars.in/index.php?section=aboutus ('K.M.Doddi, Maddur Taluk, Mandya District')",
  },
  ...[
    ["cmmv9nbgm003wubxne3ievix3", "Bannari Amman Sugars"],
    ["cmmv9nb6b003qubxnw3bigpmm", "Pandavapura SSK"],
    ["cmmv9nb9i003subxnjbebrq3m", "MNPM Sugar Division"],
    ["cmmv9nbcu003uubxn2tqcgniu", "Sri Chamundeshwari Sugar"],
    ["cmmv9nbjv003yubxnpjdqgszq", "KR Nagar Sakkare Karkhane"],
  ].map(([id, mill]): Fix => ({
    finding: 20, table: "SugarFactorySeason", id, kind: "delete",
    label: `Mandya · ${mill} · season 2024-25`,
    was: { season: "2024-25", status: "Crushing", source: "Karnataka Sugar Directorate", frpRate: 340, sapRate: 365 },
    why: "Seeded season (prisma/seed.ts): the same season, 'Crushing' status, start date, FRP and SAP for every mill, updated Mar 2026 for a season that ended in 2025; Bannari's 0 arrears read as 'Paid in full'. No real figures to keep.",
    source: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2125471 (2025-26 FRP is Rs 355/qtl; the 2024-25 rows are two seasons old)",
  })),
  {
    finding: 30, table: "LocalIndustry", id: "cmmvn79gz00rpmuxngmajloqt", kind: "hide",
    label: "Mysuru · KSDL — revenue",
    set: { details: { founded: 1916, products: "Mysore Sandal Soap, Talcum Powder, Incense Sticks", employees: 1200, sandalwood_kg_annual: 180000 } },
    was: { details: { founded: 1916, products: "Mysore Sandal Soap, Talcum Powder, Incense Sticks", employees: 1200, revenue_cr: 850, sandalwood_kg_annual: 180000 } },
    why: "Revenue Rs 850 cr ('KSDL Annual Report 2024') is about half the reported FY 2024-25 turnover (~Rs 1,700 cr, from a CM's-office post, not the annual report). Hidden until read from KSDL's own report.",
    source: "https://x.com/CMofKarnataka/status/1981715381644398888 (turnover ~Rs 1,700 cr, FY 2024-25)",
  },
  {
    finding: 30, table: "LocalIndustry", id: "cmmvn79gz00rrmuxn9uwbvu3d", kind: "hide",
    label: "Mysuru · 'Mysore Sugar Company (Mysore Paper Mills)' → active=false", set: { active: false }, was: { active: true, name: "Mysore Sugar Company (Mysore Paper Mills)" },
    why: "Mysore Sugar Co. is in Mandya town (Mandya district) and is not Mysore Paper Mills (Bhadravati); placed at Nanjangud, Mysuru with unsourced figures.",
    source: "https://www.anekantprakashan.com/sugar-factories-in-mandya/district ('The Mysore Sugar Co. Ltd., Sugar Town, Mandya')",
  },
  {
    finding: 30, table: "LocalIndustry", id: "cmmvn79gz00rqmuxnpbfoot1t", kind: "hide",
    label: "Mysuru · Infosys Mysuru Campus — revenue 0",
    set: { details: { note: "World's largest corporate training campus", founded: 2000, employees: 18000, area_acres: 337, trainees_per_year: 50000 } },
    was: { details: { note: "World's largest corporate training campus", founded: 2000, employees: 18000, area_acres: 337, revenue_cr: 0, trainees_per_year: 50000 } },
    why: "'Revenue Rs 0 Cr' — a training campus has no separate revenue; 0 is not a figure.",
    source: "rule: a zero is 'not reported'",
  },
  {
    finding: 31, table: "LocalIndustry", id: "cmnfm3ta4004c51xnlfjjo654", kind: "update",
    label: "Chennai · Automobile Industry Hub — description",
    set: { details: { description: "Chennai = Detroit of India. Hyundai, Ford (plant being revived to make engines for export), Renault-Nissan, BMW, Daimler, Royal Enfield plants.", employmentEstimate: 350000 } },
    was: { details: { description: "Chennai = Detroit of India. Hyundai, Ford (now Tata), Renault-Nissan, BMW, Daimler, Royal Enfield plants.", employmentEstimate: 350000 } },
    why: "Ford kept its Chennai (Maraimalai Nagar) plant and is reviving it for export engines; Tata bought Ford's Sanand plant in Gujarat. (The unsourced job estimate is no longer shown by the page.)",
    source: "https://www.business-standard.com/industry/auto/back-in-the-driver-s-seat-ford-india-s-timeline-and-chennai-plant-revival-124091600337_1.html",
  },
  {
    finding: 32, table: "LocalIndustry", id: "cmnfm3hij004q3rxnq0fodib8", kind: "update",
    label: "Mumbai · Bandra Kurla Complex — description",
    set: { details: { employees: 200000, description: "Mumbai's premier business district. Home to SEBI, NSE and the Bharat Diamond Bourse." } },
    was: { details: { employees: 200000, description: "Mumbai's premier business district. HQ of RBI, SEBI, NSE, Diamond Bourse." } },
    why: "The RBI's central office is at Fort, not BKC.",
    source: "https://en.wikipedia.org/wiki/Reserve_Bank_of_India (Central Office, Fort, Mumbai)",
  },
  {
    finding: 32, table: "LocalIndustry", id: "cmnfm3hij004r3rxn1x417du0", kind: "update",
    label: "Mumbai · SEEPZ — description",
    set: { details: { employees: 80000, description: "Export processing zone for electronics, set up in 1973. Gem & jewellery exports hub + IT/ITES companies.", established: 1973 } },
    was: { details: { employees: 80000, description: "India's first EPZ. Gem & jewellery exports hub + IT/ITES companies.", established: 1973 } },
    why: "India's (and Asia's) first EPZ was Kandla (1965); SEEPZ was set up in 1973 as an electronics EPZ.",
    source: "https://sezindia.gov.in/introduction",
  },
  {
    finding: 33, table: "LocalIndustry", id: "cmod2ug0f000529xnbptt8ogt", kind: "update",
    label: "Pune · Talegaon MIDC — anchor tenants",
    set: { details: { sectors: ["Automotive", "Steel Processing", "Food Packaging"], companies: 150, area_acres: 3200, anchor_tenants: ["Hyundai Motor India (former GM plant; production began 2025)", "John Deere", "Posco", "Tetra Pak", "Mercedes-Benz Truck"], employees_approx: 35000 } },
    was: { details: { sectors: ["Automotive", "Steel Processing", "Food Packaging"], companies: 150, area_acres: 3200, anchor_tenants: ["General Motors (plant mothballed)", "John Deere", "Posco", "Tetra Pak", "Mercedes-Benz Truck"], employees_approx: 35000 } },
    why: "Hyundai Motor India bought GM's Talegaon plant and began production there in 2025; it is no longer a mothballed GM plant.",
    source: "https://www.autocarpro.in/news/hyundai-motor-india-begins-production-at-new-talegaon-manufacturing-facility-129023",
  },
  {
    finding: 34, table: "LocalIndustry", id: "cmnfm3pbm00474exnp6vabiop", kind: "update",
    label: "Kolkata · Calcutta Stock Exchange — description, jobs estimate",
    set: { details: { description: "Stock exchange founded in 1908. No trading since April 2013; it is exiting the stock-exchange business." } },
    was: { details: { description: "India's second oldest stock exchange (1908). Now primarily a regional exchange.", employmentEstimate: 5000 } },
    why: "Trading has been suspended since 2013 and the CSE applied (Feb 2025) to exit the exchange business; 'now primarily a regional exchange' is wrong. The '5,000 jobs' estimate has no source (removed).",
    source: "https://www.business-standard.com/markets/news/calcutta-stock-exchange-last-diwali-2025-sebi-exit-approval-125101900183_1.html",
  },
];

// ═══════════════════════════════════════════════════════════════════════
//  4. Tenders (finding 22)
// ═══════════════════════════════════════════════════════════════════════

const STUB = "STUB_PENDING_SCRAPER_VERIFICATION";
const TENDER_FIXES: Fix[] = [
  ["cmo5gvy1e0021poxn61l7vxl2", "DEFPROC-DRDO-CABS-2026-002", "Bengaluru Urban"],
  ["cmo5gvy4x0022poxnwkvu9zea", "HAL-TW-2026-04-077", "Bengaluru Urban"],
  ["cmo5gvyjb0026poxn46waoboo", "IREPS-SWR-MYS-2026-04-019", "Mysuru"],
  ["cmo5gvx59001vpoxny8xmk5zw", "KPPP-BBMP-2026-04-001", "Bengaluru Urban"],
  ["cmo5gvxlp001ypoxnn6y8g9er", "KPPP-BESCOM-2026-03-221", "Bengaluru Urban"],
  ["cmo5gvx8w001wpoxnyq8fsmrp", "KPPP-BWSSB-2026-04-014", "Bengaluru Urban"],
  ["cmo5gvyfo0025poxnj2wkb30e", "KPPP-CNNL-2026-04-008", "Mysuru"],
  ["cmo5gvymv0027poxnm6drzt3s", "KPPP-MDYCMC-2026-04-042", "Mandya"],
  ["cmo5gvzec002cpoxnw6hmriao", "KPPP-MDYZP-2026-04-017", "Mandya"],
  ["cmo5gvybz0024poxnw5f5wr3i", "KPPP-MUDA-2026-03-105", "Mysuru"],
  ["cmo5gvy8i0023poxneo9253iv", "KPPP-MYSMCC-2026-04-033", "Mysuru"],
  ["cmo5gvyyj0029poxnfdj50jwk", "KPPP-MYSUGAR-2026-03-088", "Mandya"],
].map(([id, sourceTenderId, district]): Fix => ({
  finding: 22, table: "Tender", id, kind: "delete",
  label: `${district} · ${sourceTenderId}`,
  was: { sourceTenderId, rawHtmlSnapshot: STUB, locationDistrict: district },
  why: "Placeholder tender inserted by prisma/seed-tenders-karnataka.ts ('stub placeholders pending live scraper verification'): invented title, value and status (some 'AWARDED'), shown as real in the Awarded/Archive tabs.",
  source: "prisma/seed-tenders-karnataka.ts header; no real Karnataka tender has been collected",
}));

// ═══════════════════════════════════════════════════════════════════════
//  5. Schemes (findings 23–28)
// ═══════════════════════════════════════════════════════════════════════

const PM_KISAN_RULE = "All land-holding farmer families (exclusions apply: income-tax payers, serving or retired officials, professionals, constitutional post holders)";
const PM_KISAN_SOURCE = "pmkisan.gov.in | https://pmkisan.gov.in/";
const MJPJAY_RULE = "All ration-card-holder families in Maharashtra (yellow, orange and white cards)";
const MJPJAY_SOURCE = "https://zpdharashiv.maharashtra.gov.in/en/scheme/pradhan-mantri-jan-arogya-yojana-and-mahatma-jyotirao-phule-jan-arogya-yojana/ (GR 28 Jul 2023: all ration card holders, Rs 5 lakh a family a year from 1 Jul 2024)";

const SCHEME_FIXES: Fix[] = [
  {
    finding: 23, table: "Scheme", id: "cmnfm3oha00324exnf90y7mwg", kind: "update",
    label: "Kolkata · Lakshmir Bhandar → Annapurna Bhandar",
    set: {
      name: "Annapurna Bhandar",
      amount: 3000,
      eligibility: "Women from low-income households that do not pay income tax (Lakshmir Bhandar beneficiaries are being moved to it)",
      source: "The Week, 27 May 2026 | https://www.theweek.in/news/india/2026/05/27/west-bengal-women-s-welfare-scheme-annapurna-bhandar-application-forms-out-here-s-who-will-benefit.html",
    },
    was: { name: "Lakshmir Bhandar", amount: 12000, eligibility: "Women aged 25-60, WB domicile", source: "WB Women & Child Development Dept" },
    why: "Replaced by Annapurna Bhandar (Rs 3,000 a month; registration from 1 Jun 2026); Lakshmir Bhandar beneficiaries are being verified and moved. The page reads the amount as a month (amount-basis.ts).",
    source: "https://www.theweek.in/news/india/2026/05/27/west-bengal-women-s-welfare-scheme-annapurna-bhandar-application-forms-out-here-s-who-will-benefit.html",
  },
  {
    finding: 24, table: "Scheme", id: "cmnfm3oha00304exncighb9bo", kind: "update",
    label: "Kolkata · Kanyashree Prakalpa — eligibility",
    set: { eligibility: "Girls aged 13-19 enrolled in school or equivalent; no family-income limit since 2018-19" },
    was: { eligibility: "Girls aged 13-18, enrolled in school, family income below ₹1.2 lakh/year" },
    why: "The Rs 1.2 lakh family-income ceiling was withdrawn by the order of 26 Sep 2018.",
    source: "https://wbxpress.com/withdrawal-family-income-criteria-kanyashree/",
  },
  {
    finding: 24, table: "Scheme", id: "cmnfm3oha00314exn9zj3xo4i", kind: "update",
    label: "Kolkata · Swasthya Sathi — eligibility",
    set: { eligibility: "Families in West Bengal; from July 2026 its beneficiaries are being moved into Ayushman Bharat PM-JAY" },
    was: { eligibility: "All families in West Bengal" },
    why: "Ayushman Bharat launches in West Bengal from July 2026 and Swasthya Sathi beneficiaries are being incorporated into it.",
    source: "https://newsonair.gov.in/ayushman-bharat-scheme-to-be-launched-in-west-bengal-from-july-2026/",
  },
  {
    finding: 25, table: "Scheme", id: "cmnrsydox002fyaxn0nsnd4pj", kind: "hide",
    label: "Hyderabad · KCR Kit → active=false", set: { active: false }, was: { active: true, name: "KCR Kit — Maternity Benefit" },
    why: "The government stopped the KCR Kit scheme (kits renamed MCH kits); it was shown as running.",
    source: "https://www.thehansindia.com/news/cities/hyderabad/ktr-pans-cong-govt-for-axing-kcr-kit-scheme-990154",
  },
  {
    finding: 25, table: "Scheme", id: "cmnrsydox002gyaxnyyb0hx9g", kind: "update",
    label: "Hyderabad · Dharani → Bhu Bharati",
    set: {
      name: "Bhu Bharati — Land Records Portal",
      eligibility: "All Telangana land owners — online land records (replaced Dharani on 14 Apr 2025)",
      applyUrl: "https://bhubharati.telangana.gov.in",
      source: "Revenue Department, Telangana | https://bhubharati.telangana.gov.in",
    },
    was: { name: "Dharani — Land Registration Portal", eligibility: "All Telangana land owners — online land records", applyUrl: "https://dharani.telangana.gov.in", source: null },
    why: "Bhu Bharati officially replaced the Dharani portal on 14 Apr 2025 (Bhu Bharati Act 2024).",
    source: "https://www.thehansindia.com/telangana/its-official-bhu-bharathi-to-replace-dharani-today-962443 + https://bhubharati.telangana.gov.in ('official website of the Revenue Department, Government of Telangana')",
  },
  {
    finding: 25, table: "Scheme", id: "cmnrsydox002iyaxng3v1xdu9", kind: "update",
    label: "Hyderabad · 2BHK Housing Scheme → Indiramma Indlu",
    set: {
      name: "Indiramma Indlu (Housing)",
      amount: 500000,
      eligibility: "Economically backward families in Telangana",
      applyUrl: null,
      source: "Kamareddy district (Govt of Telangana) | https://kamareddy.telangana.gov.in/scheme/indiramma-indlu-scheme/",
    },
    was: { name: "2BHK Housing Scheme", amount: null, eligibility: "EWS families in Telangana without own house", applyUrl: "https://housing.telangana.gov.in", source: "housing.telangana.gov.in" },
    why: "The government launched Indiramma houses in place of 2BHK houses (Rs 5 lakh assistance, 2024); 62,600 unbuilt 2BHKs were cancelled. The apply link is not confirmed, so it is left empty.",
    source: "https://kamareddy.telangana.gov.in/scheme/indiramma-indlu-scheme/ (Rs 5 lakh; 'Telangana Economically backward families') + https://www.deccanchronicle.com/news/state-government-cancels-62600-2bhk-houses-to-get-indiramma-houses-899467",
  },
  ...[
    ["cmmv9nd37004wubxnol164nmk", "Mandya", "Small & marginal farmers owning up to 2 hectares"],
    ["cmmvn6q7o0061muxnx5jt62n0", "Bengaluru Urban", "Small & marginal farmers owning up to 2 hectares of cultivable land"],
    ["cmnf0n6nd002g1dxnhsoatel7", "New Delhi", "Small & marginal farmers owning up to 2 hectares of cultivable land"],
  ].map(([id, district, old]): Fix => ({
    finding: 26, table: "Scheme", id, kind: "update",
    label: `${district} · PM-KISAN — eligibility`,
    set: { eligibility: PM_KISAN_RULE, source: PM_KISAN_SOURCE },
    was: { eligibility: old, source: null },
    why: "The 2-hectare cap was removed in 2019; the scheme covers all land-holding farmer families, subject to exclusions.",
    source: "https://pmkisan.gov.in/ ('provided to all land holding farmer families')",
  })),
  {
    finding: 27, table: "Scheme", id: "cmnfm3se0003d51xns5jw1wqb", kind: "update",
    label: "Chennai · Moovalur Ramamirtham (Pudhumai Penn) — eligibility, department",
    set: { eligibility: "Girls who studied Classes 6-12 in government schools, during higher education", source: "TN Social Welfare & Women Empowerment Dept | https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn" },
    was: { eligibility: "Girl students from BC/MBC/SC/ST communities in higher education", source: "TN BC/MBC Welfare Dept" },
    why: "No community criterion: girls who studied Classes 6-12 in government schools get Rs 1,000 a month; run by the Social Welfare & Women Empowerment Dept.",
    source: "https://www.tnsocialwelfare.tn.gov.in/en/specilisationswoman-welfare/pudhumai-penn",
  },
  {
    finding: 27, table: "Scheme", id: "cmnfm3se0003b51xnsoci5eks", kind: "update",
    label: "Chennai · CMCHIS — eligibility",
    set: { eligibility: "Families with annual income up to ₹1,20,000" },
    was: { eligibility: "Families with annual income below ₹72,000" },
    why: "The income limit was raised from Rs 72,000 to Rs 1.2 lakh.",
    source: "https://www.myscheme.gov.in/schemes/cmchis",
  },
  ...[
    ["cmnfm3gn4003k3rxn1j7wpsue", "Mumbai"],
    ["cmocx56150001r2xnjnuk34z1", "Pune"],
  ].map(([id, district]): Fix => ({
    finding: 28, table: "Scheme", id, kind: "update",
    label: `${district} · Mahatma Jyotirao Phule Jan Arogya Yojana — eligibility`,
    set: { eligibility: MJPJAY_RULE },
    was: { eligibility: "Maharashtra residents with yellow/orange ration card" },
    why: "Since 1 Jul 2024 the integrated scheme covers all ration-card-holder families (white cards too), Rs 5 lakh a family a year.",
    source: MJPJAY_SOURCE,
  })),
];

const ALL_FIXES: Fix[] = [...budgetFixes(), ...INFRA_FIXES, ...INDUSTRY_FIXES, ...TENDER_FIXES, ...SCHEME_FIXES];

// ═══════════════════════════════════════════════════════════════════════
//  Engine
// ═══════════════════════════════════════════════════════════════════════

/** Prisma delegate name for a table ("InfraProject" → "infraProject"). */
const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);

/** A stored timestamp as its IST calendar day, "YYYY-MM-DD". */
const istDay = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);

/** "YYYY-MM-DD" → Date at IST midnight (how the seeds stored dates). */
const istMidnight = (d: string) => new Date(`${d}T00:00:00+05:30`);

/** JSON with keys sorted, so jsonb key order never matters. */
function stable(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
}

function toDbValue(field: string, v: Json): unknown {
  if (v === null && JSON_FIELDS.has(field)) return Prisma.DbNull;
  if (v !== null && DATE_FIELDS.has(field) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return istMidnight(v);
  return v;
}

/** Compare a stored value with a planned one, tolerant of dates, numbers, bigint and jsonb. */
function same(current: unknown, planned: Json): boolean {
  if (current === null || current === undefined) return planned === null;
  if (planned === null) return false;
  if (current instanceof Date) {
    if (typeof planned === "string" && /^\d{4}-\d{2}-\d{2}$/.test(planned)) return istDay(current) === planned;
    return typeof planned === "string" && new Date(planned).getTime() === current.getTime();
  }
  if (typeof planned === "number") return Math.abs(Number(current) - planned) < 1e-6;
  if (typeof planned === "object") return stable(current) === stable(planned);
  if (typeof planned === "boolean") return current === planned;
  return String(current) === String(planned);
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return istDay(v);
  if (typeof v === "string") return JSON.stringify(v.length > 90 ? v.slice(0, 87) + "…" : v);
  if (typeof v === "object") {
    const s = stable(v);
    return s.length > 140 ? s.slice(0, 137) + "…" : s;
  }
  return String(v);
}

type Tally = { update: number; hide: number; delete: number; done: number; gone: number; drift: number };

async function main() {
  // Guard: one fix per row, and every update names at least one field.
  const seen = new Set<string>();
  for (const f of ALL_FIXES) {
    const key = `${f.table}:${f.id}`;
    if (seen.has(key)) throw new Error(`Duplicate fix for ${key}`);
    seen.add(key);
    if (f.kind !== "delete" && (!f.set || Object.keys(f.set).length === 0)) throw new Error(`Update without fields: ${key}`);
    if ((f.table as string) === "Leader") throw new Error("Leader is out of scope for this script");
  }

  const fixes = ONLY ? ALL_FIXES.filter((f) => f.table === ONLY) : ALL_FIXES;
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const plan: Array<{ fix: Fix; data?: Record<string, unknown> }> = [];
  const counts: Record<string, Tally> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, hide: 0, delete: 0, done: 0, gone: 0, drift: 0 });
  const drifted: string[] = [];

  console.log(`Money-area fixes from the Sept 2026 audit — ${CONFIRM ? "APPLYING" : "DRY RUN"} (checked ${CHECKED})`);
  try {
    let lastTable = "";
    let lastReason = "";
    for (const f of fixes) {
      if (f.table !== lastTable) {
        lastTable = f.table;
        lastReason = "";
        console.log(`\n══ ${f.table} ══`);
      }
      const reason = `${f.why}\n${f.source}`;
      if (reason !== lastReason) {
        lastReason = reason;
        console.log(`\n  [finding ${f.finding}] why:    ${f.why}`);
        console.log(`  source: ${f.source}`);
      }
      const rows = (await p.$queryRawUnsafe(`SELECT * FROM "${f.table}" WHERE id = $1`, f.id)) as Array<Record<string, unknown>>;
      const row = rows[0];
      const head = `  • ${f.kind.toUpperCase().padEnd(6)} ${f.table} ${f.id} — ${f.label}`;
      if (!row) {
        console.log(`${head}\n      → row not found (already deleted?) — skipped`);
        tally(f.table).gone++;
        continue;
      }
      // Rows changed since the check are left alone (deletes and updates alike).
      const changed = Object.entries(f.was ?? {}).filter(([field, was]) => {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        const planned = f.set && field in f.set ? f.set[field] : undefined;
        return !same(row[field], was) && !(planned !== undefined && same(row[field], planned));
      });
      if (changed.length > 0) {
        console.log(head);
        for (const [field, was] of changed) console.log(`      ${field}: now ${show(row[field])}, was ${show(was)} on ${CHECKED} — CHANGED SINCE CHECK`);
        console.log("      → skipped; review by hand");
        tally(f.table).drift++;
        drifted.push(`${f.table} ${f.id} (${f.label})`);
        continue;
      }
      if (f.kind === "delete") {
        console.log(`${head}\n      → delete row`);
        plan.push({ fix: f });
        tally(f.table).delete++;
        continue;
      }
      const data: Record<string, unknown> = {};
      const lines: string[] = [];
      for (const [field, planned] of Object.entries(f.set!)) {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        if (same(row[field], planned)) {
          lines.push(`      ${field}: ${show(row[field])} (already)`);
          continue;
        }
        const cur = row[field];
        if (typeof cur === "string" && typeof planned === "string" && planned.length > 0 && cur.startsWith(planned)) {
          lines.push(`      ${field}: remove the trailing text ${show(cur.slice(planned.length).trim())}`);
        } else {
          lines.push(`      ${field}: ${show(cur)} → ${show(planned)}`);
        }
        data[field] = toDbValue(field, planned);
      }
      console.log(head);
      for (const l of lines) console.log(l);
      if (Object.keys(data).length === 0) {
        console.log("      → already applied — skipped");
        tally(f.table).done++;
        continue;
      }
      plan.push({ fix: f, data });
      tally(f.table)[f.kind]++;
    }

    console.log("\n══ Summary ══");
    const total: Tally = { update: 0, hide: 0, delete: 0, done: 0, gone: 0, drift: 0 };
    for (const [t, c] of Object.entries(counts)) {
      for (const k of Object.keys(total) as Array<keyof Tally>) total[k] += c[k];
      console.log(
        `${t.padEnd(20)} update ${String(c.update).padStart(3)}   hide ${String(c.hide).padStart(3)}   delete ${String(c.delete).padStart(3)}   already done ${String(c.done).padStart(3)}   not found ${String(c.gone).padStart(3)}   changed-since-check ${String(c.drift).padStart(3)}`,
      );
    }
    console.log(
      `${"TOTAL".padEnd(20)} update ${String(total.update).padStart(3)}   hide ${String(total.hide).padStart(3)}   delete ${String(total.delete).padStart(3)}   already done ${String(total.done).padStart(3)}   not found ${String(total.gone).padStart(3)}   changed-since-check ${String(total.drift).padStart(3)}`,
    );
    console.log("(hide = field set to null / active=false / spend 0 = 'not published'; delete = whole row unfounded)");
    if (drifted.length) console.log(`\nChanged since check (skipped):\n  ${drifted.join("\n  ")}`);
    console.log(`\nTotal changes to apply: ${plan.length}`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply (one transaction).");
      return;
    }
    if (plan.length === 0) {
      console.log("Nothing to do.");
      return;
    }
    type Delegate = {
      update: (a: unknown) => Promise<unknown>;
      deleteMany: (a: unknown) => Promise<{ count: number }>;
    };
    const deletesByTable = new Map<Table, string[]>();
    for (const { fix } of plan) {
      if (fix.kind !== "delete") continue;
      deletesByTable.set(fix.table, [...(deletesByTable.get(fix.table) ?? []), fix.id]);
    }
    await p.$transaction(
      async (tx) => {
        const model = (table: string) => (tx as unknown as Record<string, Delegate>)[delegateName(table)];
        for (const { fix, data } of plan) {
          if (fix.kind !== "delete") await model(fix.table).update({ where: { id: fix.id }, data });
        }
        // Deletes in one statement per table, children first; any count mismatch rolls the whole run back.
        for (const table of DELETE_ORDER) {
          const ids = deletesByTable.get(table);
          if (!ids?.length) continue;
          const { count } = await model(table).deleteMany({ where: { id: { in: ids } } });
          if (count !== ids.length) throw new Error(`${table}: expected to delete ${ids.length} rows, deleted ${count} — rolled back`);
        }
      },
      { timeout: 600_000, maxWait: 30_000 },
    );
    console.log(`\nDone: applied ${plan.length} changes in one transaction.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
