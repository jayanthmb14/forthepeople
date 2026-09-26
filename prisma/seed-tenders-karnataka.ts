// ═══════════════════════════════════════════════════════════════════════════
// Tenders Module — Karnataka seed
// Seeds: TenderScraperConfig × 6, TenderAuthority × 30, TenderCategory × 20,
//        TenderEducationContent × 10, Tender × 12 (stub rows pending live
//        scraper verification — see note below)
// Run: npx tsx prisma/seed-tenders-karnataka.ts
//
// NOTE ON TENDER ROWS (2026-04-19 seeding):
// Live WebFetch attempts against KPPP (eproc.karnataka.gov.in) and CPPP
// (eprocure.gov.in) failed on first attempts — KPPP timed out, CPPP returns
// a CAPTCHA wall. Per the Phase 1 runbook fallback rule, tender rows are
// seeded as stub placeholders with:
//   - rawHtmlSnapshot = "STUB_PENDING_SCRAPER_VERIFICATION"
//   - sourceUrl pointing to the real portal listing URL
// Phase 2's live KPPP/NICGEP engines will upsert-replace these rows with
// verified data on first successful run.
// ═══════════════════════════════════════════════════════════════════════════

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const STUB_MARKER = "STUB_PENDING_SCRAPER_VERIFICATION";
const now = new Date();
function daysFromNow(d: number) {
  return new Date(now.getTime() + d * 86400_000);
}

// ── Scraper configs ───────────────────────────────────────────────────────
const SCRAPER_CONFIGS = [
  { portalCode: "KPPP",    portalName: "Karnataka eProcurement",            baseUrl: "https://eproc.karnataka.gov.in",    engineType: "kppp-seam",    scrapeIntervalMinutes: 30, rateLimitSeconds: 3, maxRequestsPerDay: 8000, appliesToStates: ["karnataka"] },
  { portalCode: "CPPP",    portalName: "Central Public Procurement Portal", baseUrl: "https://eprocure.gov.in/eprocure/app", engineType: "nicgep",    scrapeIntervalMinutes: 45, rateLimitSeconds: 3, maxRequestsPerDay: 6000, appliesToStates: ["karnataka","telangana","delhi","maharashtra","west-bengal","tamil-nadu","uttar-pradesh"] },
  { portalCode: "IREPS",   portalName: "Indian Railways ePS",               baseUrl: "https://www.ireps.gov.in",          engineType: "ireps",        scrapeIntervalMinutes: 60, rateLimitSeconds: 4, maxRequestsPerDay: 4000, appliesToStates: ["karnataka"] },
  { portalCode: "DEFPROC", portalName: "Defence Procurement (MoD)",         baseUrl: "https://defproc.gov.in",            engineType: "nicgep",       scrapeIntervalMinutes: 60, rateLimitSeconds: 3, maxRequestsPerDay: 4000, appliesToStates: ["karnataka"] },
  { portalCode: "BEL_NIC", portalName: "Bharat Electronics Ltd eProc",      baseUrl: "https://eprocurebel.co.in/nicgep/app", engineType: "nicgep",    scrapeIntervalMinutes: 60, rateLimitSeconds: 3, maxRequestsPerDay: 3000, appliesToStates: ["karnataka"] },
  { portalCode: "HAL_TW",  portalName: "Hindustan Aeronautics Ltd (TenderWizard)", baseUrl: "https://eproc.hal-india.co.in", engineType: "tenderwizard", scrapeIntervalMinutes: 60, rateLimitSeconds: 4, maxRequestsPerDay: 2000, appliesToStates: ["karnataka"] },
];

// ── Authorities (Karnataka-relevant, with hierarchy stubbed) ──────────────
type AuthoritySeed = { shortCode: string; name: string; authorityType: string; state?: string; district?: string; websiteUrl?: string; parentShortCode?: string };
const AUTHORITIES: AuthoritySeed[] = [
  // State departments & PSUs
  { shortCode: "KA_PWD",    name: "Public Works, Ports & Inland Water Transport Department (Karnataka)", authorityType: "STATE_DEPT", state: "Karnataka", websiteUrl: "https://publicworks.karnataka.gov.in" },
  { shortCode: "KA_RDPR",   name: "Rural Development & Panchayat Raj Department (Karnataka)", authorityType: "STATE_DEPT", state: "Karnataka" },
  { shortCode: "KA_UDD",    name: "Urban Development Department (Karnataka)", authorityType: "STATE_DEPT", state: "Karnataka" },
  { shortCode: "KA_FIN",    name: "Finance Department (Karnataka)", authorityType: "STATE_DEPT", state: "Karnataka" },
  { shortCode: "KRIDL",     name: "Karnataka Rural Infrastructure Development Limited", authorityType: "PARASTATAL", state: "Karnataka" },
  { shortCode: "KSRTC",     name: "Karnataka State Road Transport Corporation", authorityType: "PARASTATAL", state: "Karnataka", websiteUrl: "https://ksrtc.in" },
  { shortCode: "KUIDFC",    name: "Karnataka Urban Infrastructure Development & Finance Corporation", authorityType: "PARASTATAL", state: "Karnataka" },
  // Bengaluru (Urban) ULBs and parastatals
  { shortCode: "BBMP",      name: "Bruhat Bengaluru Mahanagara Palike", authorityType: "ULB", state: "Karnataka", district: "Bengaluru Urban", websiteUrl: "https://bbmp.gov.in" },
  { shortCode: "BDA",       name: "Bangalore Development Authority", authorityType: "PARASTATAL", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "BESCOM",    name: "Bangalore Electricity Supply Company Limited", authorityType: "PARASTATAL", state: "Karnataka", district: "Bengaluru Urban", websiteUrl: "https://bescom.karnataka.gov.in" },
  { shortCode: "BWSSB",     name: "Bangalore Water Supply and Sewerage Board", authorityType: "PARASTATAL", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "BMTC",      name: "Bangalore Metropolitan Transport Corporation", authorityType: "PARASTATAL", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "BMRCL",     name: "Bangalore Metro Rail Corporation Limited", authorityType: "PARASTATAL", state: "Karnataka", district: "Bengaluru Urban" },
  // Mysuru ULBs
  { shortCode: "MYS_MCC",   name: "Mysuru City Corporation", authorityType: "ULB", state: "Karnataka", district: "Mysuru" },
  { shortCode: "MUDA",      name: "Mysuru Urban Development Authority", authorityType: "PARASTATAL", state: "Karnataka", district: "Mysuru" },
  { shortCode: "MYS_ZP",    name: "Mysuru Zilla Panchayat", authorityType: "PANCHAYAT", state: "Karnataka", district: "Mysuru" },
  { shortCode: "CNNL",      name: "Cauvery Neeravari Nigam Limited", authorityType: "PARASTATAL", state: "Karnataka" },
  // Mandya ULBs
  { shortCode: "MDY_CMC",   name: "Mandya City Municipal Council", authorityType: "ULB", state: "Karnataka", district: "Mandya" },
  { shortCode: "MDY_ZP",    name: "Mandya Zilla Panchayat", authorityType: "PANCHAYAT", state: "Karnataka", district: "Mandya" },
  { shortCode: "MYSUGAR",   name: "Mandya Sugar Company Limited (MySugar)", authorityType: "PARASTATAL", state: "Karnataka", district: "Mandya" },
  // Central / Defence / PSUs operating in Karnataka
  { shortCode: "HAL",       name: "Hindustan Aeronautics Limited", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban", websiteUrl: "https://hal-india.co.in" },
  { shortCode: "BEL",       name: "Bharat Electronics Limited", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "BEML",      name: "BEML Limited", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "ITI",       name: "ITI Limited", authorityType: "PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "DRDO_CABS", name: "DRDO — Centre for Airborne Systems", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "DRDO_LRDE", name: "DRDO — Electronics & Radar Development Establishment", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "DRDO_ADE",  name: "DRDO — Aeronautical Development Establishment", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "DRDO_GTRE", name: "DRDO — Gas Turbine Research Establishment", authorityType: "DEFENCE_PSU", state: "Karnataka", district: "Bengaluru Urban" },
  { shortCode: "SWR_BNG",   name: "South Western Railway — Bengaluru Division", authorityType: "RAILWAY", state: "Karnataka", district: "Bengaluru Urban", parentShortCode: "SWR" },
  { shortCode: "SWR_MYS",   name: "South Western Railway — Mysuru Division", authorityType: "RAILWAY", state: "Karnataka", district: "Mysuru", parentShortCode: "SWR" },
  { shortCode: "SWR",       name: "South Western Railway Zone", authorityType: "RAILWAY", state: "Karnataka" },
];

// ── Categories (NIC 2008 top-level relevant to civic tenders) ─────────────
const CATEGORIES = [
  { slug: "roads-bridges",       name: "Roads & Bridges",                        nicCode: "F4210" },
  { slug: "buildings-civil",     name: "Buildings & Civil Works",                nicCode: "F4100" },
  { slug: "water-supply",        name: "Water Supply",                           nicCode: "E3600" },
  { slug: "sewerage-sanitation", name: "Sewerage & Sanitation",                  nicCode: "E3700" },
  { slug: "electrical-works",    name: "Electrical Works",                       nicCode: "F4321" },
  { slug: "power-transmission",  name: "Power Transmission & Distribution",      nicCode: "D3510" },
  { slug: "it-services",         name: "IT Services & Software",                 nicCode: "J6201" },
  { slug: "consultancy",         name: "Consultancy Services",                   nicCode: "M7110" },
  { slug: "medical-supplies",    name: "Medical Supplies & Equipment",           nicCode: "G4649" },
  { slug: "education",           name: "Education — Supplies & Works",           nicCode: "P8510" },
  { slug: "agriculture",         name: "Agriculture Works & Supplies",           nicCode: "A0129" },
  { slug: "transport",           name: "Transport Services",                     nicCode: "H4922" },
  { slug: "defence-electronics", name: "Defence Electronics & Systems",          nicCode: "C2651" },
  { slug: "telecom",             name: "Telecommunications",                     nicCode: "J6110" },
  { slug: "security-services",   name: "Security & Housekeeping Services",       nicCode: "N8010" },
  { slug: "printing-stationery", name: "Printing & Stationery",                  nicCode: "C1811" },
  { slug: "food-catering",       name: "Food & Catering Supplies",               nicCode: "I5629" },
  { slug: "vehicles-hire",       name: "Vehicle Hire & Transport Contracts",     nicCode: "H4923" },
  { slug: "research-development",name: "Research & Development Services",        nicCode: "M7219" },
  { slug: "rail-works",          name: "Railway Works & Supplies",               nicCode: "H4911" },
];

// ── Education content (10 sections, English — Kannada later via AI) ───────
const EDUCATION: Array<{ slug: string; section: string; orderIndex: number; title: string; bodyMd: string }> = [
  { slug: "what-is-tender", section: "WHAT_IS_TENDER", orderIndex: 1,
    title: "What is a government tender?",
    bodyMd: `When the government wants to build a road, buy laptops, or hire someone to clean a park, they don't just hand out the work. By law, they publish a public notice called a **tender**, inviting anyone qualified to submit a sealed bid.

This is a legal requirement. The **General Financial Rules (GFR) 2017** and state-level rules like the **Karnataka Transparency in Public Procurements Act 1999** make it compulsory for almost every government purchase above ₹1 lakh to go through an open tender.

The goal is simple: fair competition, lowest price, best quality. Anyone — a solo freelancer, a small business, a big company — can participate, as long as they meet the eligibility criteria.`,
  },
  { slug: "can-i-apply", section: "CAN_I_APPLY", orderIndex: 2,
    title: "Can I apply if I'm just one person?",
    bodyMd: `Yes. **Sole proprietors, consultants, and freelancers regularly win government tenders.**

The government has three kinds of "buyers":
1. **GeM (Government e-Marketplace)** — great for small orders under ₹25,000. Anyone with a PAN + GST can register.
2. **CPPP / KPPP** — full tenders with EMD, DSC, and sealed bids. Higher barrier but much larger values.
3. **Direct purchases** — limited tender (3+ quotes) for small-value items under ₹1 lakh.

If you're an **MSME (registered on Udyam)** or a **DPIIT-recognised Startup**, the rules bend heavily in your favour: EMD exempted, turnover relaxed, 15% price preference, and 358 items reserved exclusively for micro & small enterprises.`,
  },
  { slug: "dsc", section: "DSC", orderIndex: 3,
    title: "What is DSC and do I need one?",
    bodyMd: `A **Digital Signature Certificate (DSC)** is a USB-token-based digital ID. Think of it as your online signature, but legally binding under the **IT Act 2000**.

You need a **Class-3 DSC** to bid on any CPPP, KPPP, or NIC-based portal. Prices range from ₹849 to ₹2,500 for 1–3 year validity.

Issuers (Certifying Authorities licensed by CCA):
- **eMudhra** — most popular, fastest turnaround
- **Capricorn** — competitive pricing
- **Sify** — good for volume users
- **nCode** — government-preferred in many states

Getting one takes 2–3 working days: submit PAN + Aadhaar eKYC + video verification + address proof. A USB token costs ₹400–800 extra (one-time).`,
  },
  { slug: "emd", section: "EMD", orderIndex: 4,
    title: "What is EMD and how do I pay it?",
    bodyMd: `**EMD = Earnest Money Deposit.** It's a refundable security deposit, usually **2–5% of the tender's estimated value**, that proves you're serious.

You pay it when submitting the bid. If you win, it's retained (and often converted to performance security). If you lose, it's refunded — usually within 30–60 days of tender finalisation.

Payment modes accepted:
- Demand Draft (DD) payable to the tender authority
- Fixed Deposit Receipt (FDR) pledged to the authority
- Bank Guarantee (BG) from a scheduled bank
- NEFT / RTGS / BSD (Bidder's Security Deposit) on most portals

**⚠️ MSEs and DPIIT-recognised Startups are fully exempt from EMD.** Claim this — don't lock up your working capital unnecessarily.`,
  },
  { slug: "msme", section: "MSME", orderIndex: 5,
    title: "MSME registration gives you real benefits",
    bodyMd: `**Udyam Registration is FREE at udyamregistration.gov.in.** Takes 10 minutes with Aadhaar OTP. No agent needed.

Once registered as a Micro or Small Enterprise, you unlock these in government tenders:

| Benefit | What it means |
|---------|---------------|
| **EMD exemption** | Full waiver. Zero security deposit. |
| **Tender fee exemption** | Free tender document download. |
| **L1+15% price matching** | If you bid within 115% of the lowest price, you get matched orders up to 25% of the tender value. |
| **358 reserved items** | Some items can only be bought from MSEs. |
| **Turnover relaxation** | Eligibility turnover limits are relaxed or waived. |
| **Prior experience relaxation** | "5 similar works in last 3 years" often reduced to 1 or waived. |

If you're a sole proprietor with even ₹1 lakh annual turnover, you qualify as "Micro". **There is no downside** to registering.`,
  },
  { slug: "startup", section: "STARTUP", orderIndex: 6,
    title: "Startup India benefits are bigger than most people realise",
    bodyMd: `If your company is under 10 years old and recognised by **DPIIT (Department for Promotion of Industry and Internal Trade)**, the tender playing field tilts heavily your way.

**All-India benefits:**
- Prior turnover requirement **waived** (for tenders where turnover is "similar" to the work's scope)
- Prior experience requirement **waived** for most categories
- EMD **fully exempted**
- L1+15% price matching preference
- **Performance security reduced to 25%** of normal amount (i.e., 0.75% instead of 3%)

**Getting DPIIT recognition is free** at startupindia.gov.in. Requirements:
- Private Limited / LLP / Partnership
- Under 10 years since incorporation
- Turnover under ₹100 Cr in any year so far
- Working on innovation / scalable model / employment generation

Recognition is usually issued within 2 working days of online application.`,
  },
  { slug: "process", section: "PROCESS", orderIndex: 7,
    title: "What does the tender process actually look like?",
    bodyMd: `The full lifecycle, in order:

1. **NIT published** — Notice Inviting Tender goes live on the portal. A PDF describes what's wanted, eligibility, deadlines, EMD, etc.
2. **Pre-bid meeting (optional)** — bidders ask questions. Clarifications become binding on all parties.
3. **Corrigendum (sometimes)** — authority changes the tender terms. Always re-read the NIT after any corrigendum.
4. **Bid submission** — you upload your technical + financial bid, digitally signed (DSC), before the deadline.
5. **Technical opening** — authority reviews whether you meet eligibility. Only qualified bidders move on.
6. **Financial opening** — sealed financial bids are opened. Lowest eligible quote (L1) wins.
7. **Letter of Award (LoA)** — authority informs the winner.
8. **Contract signing + performance security** — you furnish 3% (or 0.75% if startup) of contract value.
9. **Execution** — work begins.
10. **Completion & final payment** — after successful delivery.

Most portals publish **Award of Contract (AoC)** documents publicly — which is why platforms like this one can compute red flags and track how your tax money is being spent.`,
  },
  { slug: "first-gem", section: "FIRST_GEM", orderIndex: 8,
    title: "My first GeM order — a 7-step guide",
    bodyMd: `GeM (Government e-Marketplace at gem.gov.in) is the easiest entry point. Orders under ₹25,000 don't even need a DSC.

1. **Register as a Seller** at gem.gov.in with PAN + Aadhaar + GST + bank account. Free.
2. **Complete your profile** — upload Udyam certificate, DPIIT certificate, MSE bank solvency (if any).
3. **Browse categories** — find items you can supply. GeM has ~20,000 categories.
4. **List your products** — specs, photos, MRP, discount structure, delivery time.
5. **Wait for bid invitations** or **quote on open bids** — government buyers send RFQs to matching sellers.
6. **Submit your quote** — include GST, delivery, warranty. Compete on price.
7. **Fulfil the order** — deliver, generate e-invoice, and collect payment directly via GeM.

GeM payments typically arrive in 10 working days of successful delivery. Disputes go through GeM's grievance redressal.`,
  },
  { slug: "first-cppp", section: "FIRST_CPPP", orderIndex: 9,
    title: "My first CPPP bid — a 10-step guide",
    bodyMd: `CPPP (Central Public Procurement Portal, eprocure.gov.in) is where serious tenders — roads, IT projects, consultancies, big supplies — are published.

1. **Get a Class-3 DSC** (₹1,200–2,500, eMudhra / Capricorn). Needed for every step. 2–3 days.
2. **Install Java JRE** (1.8 or higher). CPPP applets require Java. Use 64-bit.
3. **Register as a Bidder** at eprocure.gov.in → "Online Bidder Enrollment". Link your DSC.
4. **Search tenders** — filter by state, department, value range, closing date.
5. **Download the tender document** (NIT + BOQ + tech spec) as PDF. Usually free.
6. **Read everything carefully** — specifically EMD amount, eligibility, BOQ line items, special conditions.
7. **Pay tender fee + EMD** if not exempt. Mode and account given in NIT.
8. **Prepare your bid** — fill BOQ, upload required documents (PAN, GST, Udyam, turnover certs, past experience certs).
9. **Encrypt + submit** via the applet, sign digitally with DSC, before the deadline.
10. **Wait for technical opening**, then **financial opening** (both schedules in NIT). If L1, you'll be notified.

Tip: track the same tender's corrigenda and opening dates on this dashboard — you'll get alerts we post here.`,
  },
  { slug: "glossary", section: "GLOSSARY", orderIndex: 10,
    title: "Glossary of 50+ procurement terms",
    bodyMd: `| Term | Meaning |
|------|---------|
| **NIT** | Notice Inviting Tender — the formal public invitation |
| **BOQ** | Bill of Quantities — itemised list of work/supplies with rates |
| **EMD** | Earnest Money Deposit — refundable bid security |
| **BSD** | Bidder's Security Deposit — alternate online form of EMD |
| **PBG / PSD** | Performance Bank Guarantee / Security Deposit — retained during contract |
| **DSC** | Digital Signature Certificate — Class-3 for e-tendering |
| **AoC** | Award of Contract — document naming the winning bidder + price |
| **L1 / L2 / L3** | Lowest / 2nd-lowest / 3rd-lowest bidder |
| **H1** | Highest bidder (used in reverse auctions / sale tenders) |
| **QCBS** | Quality-cum-Cost Based Selection — weighted technical + price scoring |
| **EOI** | Expression of Interest — pre-qualification stage |
| **RFP** | Request for Proposal — technical + commercial solicitation |
| **RFQ** | Request for Quotation — price-only solicitation |
| **Corrigendum** | Formal amendment to an already-published tender |
| **Pre-bid meeting** | Optional Q&A with prospective bidders |
| **Single cover** | Price bid opened directly |
| **Two cover** | Technical bid evaluated first, then financial bid |
| **Three cover** | Eligibility + technical + financial opened separately |
| **Reverse auction** | Online price-descent auction after initial bids |
| **Rate contract** | Pre-agreed price list; departments order as needed |
| **Udyam** | MSME registration under Udyam Registration portal |
| **DPIIT** | Department for Promotion of Industry and Internal Trade |
| **MSE** | Micro & Small Enterprise (subset of MSME) |
| **PPP** | Public Private Partnership (construction/infra model) |
| **Turnkey** | Single contractor handles design + build + commissioning |
| **GeM** | Government e-Marketplace (gem.gov.in) |
| **CPPP** | Central Public Procurement Portal (eprocure.gov.in) |
| **KPPP** | Karnataka Public Procurement Portal (eproc.karnataka.gov.in) |
| **IREPS** | Indian Railways ePS (ireps.gov.in) |
| **GFR** | General Financial Rules — central govt procurement rulebook |
| **CVC** | Central Vigilance Commission — procurement ethics oversight |
| **KTPPA** | Karnataka Transparency in Public Procurements Act 1999 |
| **GeM SPA** | GeM Seller Panel Agreement |
| **NICGEP** | NIC's Government eProcurement template (used by CPPP etc.) |
| **JSESSIONID** | Web session token (important for re-fetching pages) |
| **ViewState** | JSF/JBoss Seam session state (KPPP-specific) |
| **Contractor class** | State-assigned tier (Class I/II/III) based on past work value |
| **Similar work** | Past project in same category of comparable value |
| **Earnest** | Synonym for EMD |
| **Security Deposit** | Post-award guarantee retained by buyer |
| **Annual turnover** | Company's last audited revenue, often a minimum eligibility |
| **Net worth** | Company's assets minus liabilities (eligibility criterion) |
| **Joint venture (JV)** | Two+ bidders combining for a single bid |
| **Consortium** | Similar to JV; common in large PPP/turnkey tenders |
| **Solvency certificate** | Bank's letter attesting your financial capacity |
| **Conditional bid** | Bid with caveats — usually rejected outright |
| **Unbalanced bid** | Unusually high/low line-items within BOQ — often flagged |
| **Deviation sheet** | List of clauses you can't comply with (informs rejection) |
| **Techno-commercial** | Evaluation covering technical + commercial aspects |
| **Mobilisation advance** | Pre-work advance payment against BG |
| **Retention money** | Small % held back till defect-liability period ends |`,
  },
];

// ── Stub tenders spread across 3 pilot districts ──────────────────────────
type TenderSeed = {
  sourcePortal: string;
  sourceTenderId: string;
  sourceUrl: string;
  title: string;
  description: string;
  workType: string;
  procurementType: string;
  authorityShortCode: string;
  categorySlug: string;
  estimatedValueInr: bigint;
  tenderFeeInr: bigint;
  emdAmountInr: bigint;
  performanceSecurityPct: number;
  publishedAt: Date;
  bidSubmissionEnd: Date;
  technicalOpeningAt?: Date;
  eligibility: { minAnnualTurnoverInr: number | null; yearsRequired: number | null; similarWorkExp: string | null; registrationTypes: string[] };
  mseReserved: boolean;
  startupExempt: boolean;
  status: string;
  numberOfCovers: number;
  locationState: string;
  locationDistrict: string;
  locationTaluk?: string;
  // For seed extras:
  addCorrigendum?: boolean;
  addAward?: { winnerName: string; awardedAmountInr: bigint };
  nicCode?: string;
};

const TENDERS: TenderSeed[] = [
  // ── BENGALURU (5) ──
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-BBMP-2026-04-001", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Resurfacing of arterial roads — BBMP East Zone (Package 3)", description: "Bituminous concrete overlay on 12.8 km of arterial roads in Mahadevapura & K.R. Puram divisions.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "BBMP", categorySlug: "roads-bridges",
    estimatedValueInr: BigInt("185000000"), tenderFeeInr: BigInt("10000"), emdAmountInr: BigInt("3700000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-8), bidSubmissionEnd: daysFromNow(14), technicalOpeningAt: daysFromNow(16),
    eligibility: { minAnnualTurnoverInr: 100_000_000, yearsRequired: 5, similarWorkExp: "1 similar work ≥ ₹7.4 Cr in last 5 years", registrationTypes: ["Class I Contractor (Karnataka PWD)"] },
    mseReserved: false, startupExempt: false, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Bengaluru Urban", locationTaluk: "Bengaluru East", nicCode: "F4210" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-BWSSB-2026-04-014", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Supply & installation of SCADA telemetry for 24 BWSSB pumping stations", description: "Turnkey SCADA system for real-time flow, pressure, and energy monitoring across 24 pump stations.",
    workType: "TURNKEY", procurementType: "OPEN", authorityShortCode: "BWSSB", categorySlug: "water-supply",
    estimatedValueInr: BigInt("62500000"), tenderFeeInr: BigInt("5000"), emdAmountInr: BigInt("1250000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-18), bidSubmissionEnd: daysFromNow(4), technicalOpeningAt: daysFromNow(6),
    eligibility: { minAnnualTurnoverInr: 30_000_000, yearsRequired: 3, similarWorkExp: "1 SCADA project ≥ ₹2.5 Cr", registrationTypes: ["Private Limited", "LLP", "Partnership"] },
    mseReserved: false, startupExempt: true, status: "OPEN_FOR_BIDS", numberOfCovers: 3,
    locationState: "Karnataka", locationDistrict: "Bengaluru Urban", addCorrigendum: true, nicCode: "E3600" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-BESCOM-2026-03-221", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Smart prepaid meter supply — 50,000 units for BESCOM Bengaluru South", description: "Three-phase smart prepaid energy meters with GPRS/NB-IoT communication.",
    workType: "GOODS", procurementType: "OPEN", authorityShortCode: "BESCOM", categorySlug: "electrical-works",
    estimatedValueInr: BigInt("325000000"), tenderFeeInr: BigInt("10000"), emdAmountInr: BigInt("6500000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-40), bidSubmissionEnd: daysFromNow(-10),
    eligibility: { minAnnualTurnoverInr: 200_000_000, yearsRequired: 5, similarWorkExp: "1 similar order ≥ ₹13 Cr", registrationTypes: ["BIS-certified manufacturers only"] },
    mseReserved: false, startupExempt: false, status: "AWARDED", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Bengaluru Urban",
    addAward: { winnerName: "Secure Meters Limited", awardedAmountInr: BigInt("318500000") }, nicCode: "C2651" },
  { sourcePortal: "DEFPROC", sourceTenderId: "DEFPROC-DRDO-CABS-2026-002", sourceUrl: "https://defproc.gov.in",
    title: "AESA radar sub-component fabrication (Class-III)", description: "Precision-machined waveguide sub-components for airborne AESA radar R&D programme.",
    workType: "GOODS", procurementType: "LIMITED", authorityShortCode: "DRDO_CABS", categorySlug: "defence-electronics",
    estimatedValueInr: BigInt("48000000"), tenderFeeInr: BigInt("5000"), emdAmountInr: BigInt("960000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-12), bidSubmissionEnd: daysFromNow(9),
    eligibility: { minAnnualTurnoverInr: 100_000_000, yearsRequired: 7, similarWorkExp: "DRDO / HAL / BEL supply record", registrationTypes: ["MoD vendor-registered firms only"] },
    mseReserved: false, startupExempt: false, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Bengaluru Urban", nicCode: "C2651" },
  { sourcePortal: "HAL_TW", sourceTenderId: "HAL-TW-2026-04-077", sourceUrl: "https://eproc.hal-india.co.in",
    title: "Housekeeping & facility management — HAL Bengaluru complex (2-year contract)", description: "Comprehensive housekeeping, horticulture, and facility management services.",
    workType: "SERVICES", procurementType: "OPEN", authorityShortCode: "HAL", categorySlug: "security-services",
    estimatedValueInr: BigInt("28000000"), tenderFeeInr: BigInt("2500"), emdAmountInr: BigInt("560000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-5), bidSubmissionEnd: daysFromNow(22),
    eligibility: { minAnnualTurnoverInr: 20_000_000, yearsRequired: 3, similarWorkExp: "1 similar contract ≥ ₹1 Cr/year", registrationTypes: ["ESI+EPF compliant", "PSARA licenced (for security component)"] },
    mseReserved: true, startupExempt: true, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Bengaluru Urban", nicCode: "N8010" },
  // ── MYSURU (4) ──
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-MYSMCC-2026-04-033", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Underground drainage rehabilitation — Mysuru ward 42 & 43", description: "Rehabilitation of 6.2 km of aging UGD lines and construction of 42 manholes.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "MYS_MCC", categorySlug: "sewerage-sanitation",
    estimatedValueInr: BigInt("52000000"), tenderFeeInr: BigInt("5000"), emdAmountInr: BigInt("1040000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-7), bidSubmissionEnd: daysFromNow(17),
    eligibility: { minAnnualTurnoverInr: 25_000_000, yearsRequired: 5, similarWorkExp: "1 UGD project ≥ ₹2 Cr", registrationTypes: ["Class II Contractor"] },
    mseReserved: false, startupExempt: false, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mysuru", locationTaluk: "Mysuru", nicCode: "E3700" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-MUDA-2026-03-105", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Layout formation — MUDA Kesare extension (Phase 2)", description: "Formation of sites, internal roads, drainage, and electrification for 312 residential sites.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "MUDA", categorySlug: "buildings-civil",
    estimatedValueInr: BigInt("215000000"), tenderFeeInr: BigInt("10000"), emdAmountInr: BigInt("4300000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-45), bidSubmissionEnd: daysFromNow(-15),
    eligibility: { minAnnualTurnoverInr: 120_000_000, yearsRequired: 7, similarWorkExp: "1 layout formation ≥ ₹8 Cr", registrationTypes: ["Class I Contractor"] },
    mseReserved: false, startupExempt: false, status: "CANCELLED", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mysuru", nicCode: "F4100" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-CNNL-2026-04-008", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Desilting of Visvesvaraya Canal — Mysuru reach (14.3 km)", description: "Mechanical desilting, embankment restoration, and concrete lining repair on Visvesvaraya Canal.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "CNNL", categorySlug: "water-supply",
    estimatedValueInr: BigInt("41000000"), tenderFeeInr: BigInt("5000"), emdAmountInr: BigInt("820000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-6), bidSubmissionEnd: daysFromNow(1), // short window — triggers short-window red flag in Phase 6
    eligibility: { minAnnualTurnoverInr: 20_000_000, yearsRequired: 3, similarWorkExp: "1 canal work ≥ ₹1.5 Cr", registrationTypes: ["Class II Contractor"] },
    mseReserved: false, startupExempt: false, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mysuru", nicCode: "F4210" },
  { sourcePortal: "IREPS", sourceTenderId: "IREPS-SWR-MYS-2026-04-019", sourceUrl: "https://www.ireps.gov.in",
    title: "Track renewal — Mysuru–Hassan section km 12 to km 24", description: "Supply and laying of PSC sleepers, fastenings, and ballast regulation.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "SWR_MYS", categorySlug: "rail-works",
    estimatedValueInr: BigInt("138000000"), tenderFeeInr: BigInt("10000"), emdAmountInr: BigInt("2760000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-10), bidSubmissionEnd: daysFromNow(18),
    eligibility: { minAnnualTurnoverInr: 150_000_000, yearsRequired: 5, similarWorkExp: "Approved Railway contractor — Class I", registrationTypes: ["Railways-approved contractors only"] },
    mseReserved: false, startupExempt: false, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mysuru", nicCode: "H4911" },
  // ── MANDYA (3) ──
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-MDYCMC-2026-04-042", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Solid waste management — door-to-door collection, Mandya CMC (3-year contract)", description: "Ward-wise garbage collection, primary transfer to MCF, and awareness programmes across 35 wards.",
    workType: "SERVICES", procurementType: "OPEN", authorityShortCode: "MDY_CMC", categorySlug: "sewerage-sanitation",
    estimatedValueInr: BigInt("96000000"), tenderFeeInr: BigInt("5000"), emdAmountInr: BigInt("1920000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-9), bidSubmissionEnd: daysFromNow(16), technicalOpeningAt: daysFromNow(18),
    eligibility: { minAnnualTurnoverInr: 50_000_000, yearsRequired: 3, similarWorkExp: "1 SWM contract ≥ ₹3 Cr/year", registrationTypes: ["Swachh Bharat-empanelled agencies"] },
    mseReserved: false, startupExempt: true, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mandya", locationTaluk: "Mandya", addCorrigendum: true, nicCode: "E3700" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-MYSUGAR-2026-03-088", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Supply of evaporator tubes — MySugar Refinery crushing season 2026-27", description: "Carbon steel seamless evaporator tubes (OD 38.1 mm, 14 SWG) — 28 MT.",
    workType: "GOODS", procurementType: "OPEN", authorityShortCode: "MYSUGAR", categorySlug: "agriculture",
    estimatedValueInr: BigInt("11500000"), tenderFeeInr: BigInt("2500"), emdAmountInr: BigInt("230000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-30), bidSubmissionEnd: daysFromNow(-20),
    eligibility: { minAnnualTurnoverInr: 15_000_000, yearsRequired: 3, similarWorkExp: "1 sugar mill supply order ≥ ₹50 L", registrationTypes: ["ISO 9001 certified manufacturer"] },
    mseReserved: true, startupExempt: true, status: "AWARDED", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mandya",
    addAward: { winnerName: "Tubes India Manufacturing Pvt Ltd", awardedAmountInr: BigInt("11420000") }, nicCode: "A0129" },
  { sourcePortal: "KPPP", sourceTenderId: "KPPP-MDYZP-2026-04-017", sourceUrl: "https://eproc.karnataka.gov.in/eproc-g1/pages/tenders.seam",
    title: "Construction of anganwadi buildings — Mandya ZP (12 locations, turnkey)", description: "Design-build-commission of 12 model anganwadi centres under Integrated Child Development Services.",
    workType: "WORKS", procurementType: "OPEN", authorityShortCode: "MDY_ZP", categorySlug: "buildings-civil",
    estimatedValueInr: BigInt("34500000"), tenderFeeInr: BigInt("2500"), emdAmountInr: BigInt("690000"), performanceSecurityPct: 3,
    publishedAt: daysFromNow(-4), bidSubmissionEnd: daysFromNow(24),
    eligibility: { minAnnualTurnoverInr: 15_000_000, yearsRequired: 3, similarWorkExp: "1 govt building ≥ ₹1 Cr", registrationTypes: ["Class III Contractor (Rural)"] },
    mseReserved: true, startupExempt: true, status: "OPEN_FOR_BIDS", numberOfCovers: 2,
    locationState: "Karnataka", locationDistrict: "Mandya", nicCode: "F4100" },
];

// ── Seed runner ───────────────────────────────────────────────────────────
export async function seedTendersKarnataka(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📜 Seeding Tenders module (Karnataka pilot)...");

    // 1. Scraper configs
    for (const cfg of SCRAPER_CONFIGS) {
      await client.tenderScraperConfig.upsert({
        where: { portalCode: cfg.portalCode },
        update: cfg,
        create: cfg,
      });
    }
    console.log(`  ✓ ${SCRAPER_CONFIGS.length} scraper configs`);

    // 2. Authorities — first pass without parents, second pass links parents
    const authIdByCode = new Map<string, string>();
    for (const a of AUTHORITIES) {
      const row = await client.tenderAuthority.upsert({
        where: { shortCode: a.shortCode },
        update: { name: a.name, authorityType: a.authorityType, state: a.state, district: a.district, websiteUrl: a.websiteUrl },
        create: { shortCode: a.shortCode, name: a.name, authorityType: a.authorityType, state: a.state, district: a.district, websiteUrl: a.websiteUrl },
      });
      authIdByCode.set(a.shortCode, row.id);
    }
    for (const a of AUTHORITIES) {
      if (a.parentShortCode && authIdByCode.has(a.parentShortCode)) {
        await client.tenderAuthority.update({
          where: { shortCode: a.shortCode },
          data: { parentAuthorityId: authIdByCode.get(a.parentShortCode) },
        });
      }
    }
    console.log(`  ✓ ${AUTHORITIES.length} authorities`);

    // 3. Categories
    const catIdBySlug = new Map<string, string>();
    for (const c of CATEGORIES) {
      const row = await client.tenderCategory.upsert({
        where: { slug: c.slug },
        update: { name: c.name, nicCode: c.nicCode },
        create: { slug: c.slug, name: c.name, nicCode: c.nicCode },
      });
      catIdBySlug.set(c.slug, row.id);
    }
    console.log(`  ✓ ${CATEGORIES.length} categories`);

    // 4. Education content
    for (const e of EDUCATION) {
      await client.tenderEducationContent.upsert({
        where: { slug: e.slug },
        update: { section: e.section, orderIndex: e.orderIndex, title: e.title, bodyMd: e.bodyMd },
        create: { slug: e.slug, section: e.section, orderIndex: e.orderIndex, title: e.title, bodyMd: e.bodyMd, translationPending: true },
      });
    }
    console.log(`  ✓ ${EDUCATION.length} education sections`);

    // 5. Tenders
    let seeded = 0;
    for (const t of TENDERS) {
      const authId = authIdByCode.get(t.authorityShortCode);
      if (!authId) { console.warn(`    ⚠️ skipping tender ${t.sourceTenderId}: authority ${t.authorityShortCode} not found`); continue; }
      const catId = catIdBySlug.get(t.categorySlug);

      const existing = await client.tender.findUnique({ where: { sourcePortal_sourceTenderId: { sourcePortal: t.sourcePortal, sourceTenderId: t.sourceTenderId } } });
      const baseData = {
        sourcePortal: t.sourcePortal,
        sourceTenderId: t.sourceTenderId,
        sourceUrl: t.sourceUrl,
        title: t.title,
        description: t.description,
        workType: t.workType,
        procurementType: t.procurementType,
        authorityId: authId,
        categoryId: catId,
        nicCode: t.nicCode,
        estimatedValueInr: t.estimatedValueInr,
        tenderFeeInr: t.tenderFeeInr,
        emdAmountInr: t.emdAmountInr,
        performanceSecurityPct: t.performanceSecurityPct,
        publishedAt: t.publishedAt,
        bidSubmissionEnd: t.bidSubmissionEnd,
        technicalOpeningAt: t.technicalOpeningAt,
        eligibility: t.eligibility,
        mseReserved: t.mseReserved,
        startupExempt: t.startupExempt,
        mseEmdExempt: t.mseReserved || t.startupExempt,
        status: t.status,
        numberOfCovers: t.numberOfCovers,
        locationState: t.locationState,
        locationDistrict: t.locationDistrict,
        locationTaluk: t.locationTaluk,
        rawHtmlSnapshot: STUB_MARKER,
      };

      const tender = existing
        ? await client.tender.update({ where: { id: existing.id }, data: baseData })
        : await client.tender.create({ data: baseData });

      // Corrigendum (optional)
      if (t.addCorrigendum) {
        await client.tenderCorrigendum.upsert({
          where: { tenderId_sequenceNo: { tenderId: tender.id, sequenceNo: 1 } },
          update: {},
          create: {
            tenderId: tender.id,
            sequenceNo: 1,
            issuedAt: daysFromNow(-2),
            changeType: "DEADLINE_EXTENSION",
            summaryPlain: "Bid submission deadline extended by 7 days in response to pre-bid queries.",
            diffJson: { field: "bidSubmissionEnd", from: t.bidSubmissionEnd.toISOString(), to: new Date(t.bidSubmissionEnd.getTime() + 7 * 86400_000).toISOString() },
          },
        });
      }

      // Award (optional)
      if (t.addAward) {
        const existingAward = await client.tenderAward.findFirst({ where: { tenderId: tender.id } });
        const hitRate = Number((Number(t.addAward.awardedAmountInr) * 100 / Number(t.estimatedValueInr)).toFixed(2));
        if (!existingAward) {
          await client.tenderAward.create({
            data: {
              tenderId: tender.id,
              awardedAt: daysFromNow(-3),
              winnerName: t.addAward.winnerName,
              winnerIsCompany: true,
              awardedAmountInr: t.addAward.awardedAmountInr,
              priceHitRatePct: hitRate,
              l1Rank: 1,
            },
          });
        }
        // Contract for awarded ones
        await client.tenderContract.upsert({
          where: { tenderId: tender.id },
          update: {},
          create: {
            tenderId: tender.id,
            contractValueInr: t.addAward.awardedAmountInr,
            contractSignedAt: daysFromNow(-1),
            contractPeriodDays: 180,
            expectedCompletionAt: daysFromNow(180),
            implementationStatus: "NOT_STARTED",
          },
        });
      }

      seeded++;
    }
    console.log(`  ✓ ${seeded} tenders (stub-marked; Phase 2 scrapers will replace with live data)`);

    console.log("\n✅ Tenders Karnataka seed complete.\n");
    console.log("   Run these to verify:");
    console.log("   npx prisma studio → check Tender, TenderAuthority, TenderCategory, TenderEducationContent\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (typeof require !== "undefined" && require.main === module) {
  seedTendersKarnataka().catch((e) => { console.error(e); process.exit(1); });
}
