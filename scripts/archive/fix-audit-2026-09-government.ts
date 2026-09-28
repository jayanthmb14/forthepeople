/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Fix the data rows the September 2026 audit found wrong in the GOVERNMENT
 * area (leaders, offices, certificate guides, police stations, citizen tips).
 * Rule: verified or hidden. Every new value was checked on 28 Sep 2026
 * against the page named in `source` (official .gov.in / .nic.in pages first,
 * reputed reports only when no official page could be read). A value that
 * could not be confirmed is hidden: the field set to null, the row set to
 * active = false (Leader, GovOffice, ServiceGuide, CitizenTip have it), or
 * the row deleted when the whole row is unfounded (PoliceStation has no
 * `active`; three invented or duplicate office rows).
 *
 * The code fixes that stop these errors coming back are in the same branch
 * (v54/fix-government): src/lib/government-checks.ts, src/lib/related-news.ts,
 * src/lib/insight-age.ts, state-config officeHours / municipalBodies, the
 * offices/services APIs now drop active = false rows, /api/data/tips serves
 * nothing.
 *
 * DRY RUN by default: prints every change (table, id, field, current → new,
 * source) and exits. Pass --confirm to apply, all in ONE transaction.
 *
 *   npx tsx scripts/fix-audit-2026-09-government.ts             # dry run
 *   npx tsx scripts/fix-audit-2026-09-government.ts --confirm   # apply
 *
 * Rows are matched by id. `was` holds the values seen on the check date; a
 * row whose current value is neither `was` nor the new value is SKIPPED and
 * flagged (changed since check — look at it by hand). A deleted row that is
 * already gone, or a field already holding the new value, is skipped, so a
 * second run changes nothing. Deletes also check `was` first. Any delete
 * count mismatch rolls the whole run back.
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRM = process.argv.includes("--confirm");
const CHECKED = "2026-09-28";

type Table = "Leader" | "GovOffice" | "ServiceGuide" | "PoliceStation" | "CitizenTip";
type FieldValue = string | number | boolean | null | string[];

interface Fix {
  table: Table;
  id: string;
  /** update = corrected value; hide = value cleared or row set inactive; delete = row removed. */
  op: "update" | "hide" | "delete";
  /** Audit finding index in the government findings file. */
  finding: number;
  label: string;
  set?: Record<string, FieldValue>;
  /** Values seen on the check date (for deletes: identifying fields). */
  was: Record<string, FieldValue>;
  why: string;
  source: string;
}

// ── Sources (read on 28 Sep 2026 unless noted) ──────────────────────────
const SRC = {
  DKS_CM: "https://www.etvbharat.com/en/state/dk-shivakumar-takes-oath-as-karnataka-chief-minister-latest-update-june-3-2026-enn26060300133 (DKS sworn in as CM 3 Jun 2026; the site's own state tier shows him as CM)",
  PC_MOHAN: "https://en.wikipedia.org/wiki/P._C._Mohan (MP for Bangalore Central since 16 May 2009; the seat was created in the 2008 delimitation)",
  BEST_GM: "https://en.wikipedia.org/wiki/Lokesh_Chandra_(civil_servant) (GM of BEST 5 Jun 2021 – 2 Jun 2023); https://egov.eletsonline.com/2024/12/12-ias-transferred-in-maharashtra-p-anbalgan-named-industries-secretary-harshdeep-kamble-appointed-gm-best/ (later GMs). The current GM could not be confirmed, so the row is hidden, not replaced.",
  HELPLINE_100: "src/components/district/civic/CitizenParts.tsx (100 is the old police emergency code, removed from the site's helplines: no official page confirms it); no mumbaipolice.gov.in page gives the CP office number",
  CHALUVA: "https://www.prajavani.net/district/mandya/minister-n-cheluvarayaswamy-announces-137-crore-grant-for-mandya-agriculture-3693755 (spells ಎನ್.ಚಲುವರಾಯಸ್ವಾಮಿ; so do Kannada Wikipedia and Varthabharati)",
  BANSURI: "https://delhi.gov.in/profile/ms-bansuri-swaraj (lists a different phone; +91-11-23034444 appears on no official page and not in the row's cited Wikipedia / PRS pages)",
  LKO_HC: "https://delhihighcourt.nic.in/files/announcements/publicnotice_3qd3ppdm.pdf (High Court at Lucknow works from the new building at Vibhuti Khand, Gomti Nagar since 04.10.2016; postal address High Court at Lucknow, Vibhuti Khand, Gomti Nagar, Lucknow 226010)",
  RPO_BLR: "https://portal2.passportindia.gov.in/AppOnlineProject/onlineHtml/rpo/bangalore.html (RPO Bengaluru in its own premises at 80 Feet Road, Koramangala 8th Block, Bengaluru 560095 since April 2007; seen via search, the page did not load directly) + https://www.mea.gov.in/regional-passport-offices (RPO Bengaluru, 080-25706100)",
  HYD_COLL: "https://hyderabad.telangana.gov.in/contact-us/ (Hyderabad District Collector Office, 6-2-10, Lakdikapul, Hyderabad-500004)",
  KOL_PVD: "https://transport.wb.gov.in/about-us/department-at-a-glance/pvd/ (the Public Vehicles Department at 38, Beltala Road, Kolkata-700020 is the Regional Transport Authority for Kolkata; Barasat is North 24 Parganas: https://north24parganas.gov.in/motorvehicle/)",
  KRS: "https://www.indiatvnews.com/pincode/karnataka/mandya/krishnaraja-sagar (PIN 571607 is Krishnaraja Sagar, Srirangapatna taluk, MANDYA district); https://pincode.net.in/all-areas-under-post-office-krishna-raja-nagar-krishnarajanagara-mysuru-karnataka-571602 (K.R. Nagar is 571602, Mysuru)",
  RTO_BLR_EAST: "https://www.godigit.com/rto-office/karnataka/bangalore/indiranagar-rto-office-ka-03 (Bangalore East RTO, KA-03, BDA Complex, Indiranagar 560038; other listings say it moved to Kasturi Nagar) — neither Nandini Layout (north-west Bengaluru) nor Whitefield; no transport.karnataka.gov.in page could be read",
  KIA: "https://en.wikipedia.org/wiki/Kempegowda_International_Airport (in Bengaluru Rural district; owned and run by Bengaluru International Airport Ltd, not an 'airport authority')",
  MUM_SUB_COLL: "https://mumbaisuburban.gov.in/contact-us/ (Collector Office Mumbai Suburban District, 10th Floor, Administrative Building, Near Chetna College, Government Colony, Bandra (East), Mumbai – 400 051)",
  GBA: "https://en.wikipedia.org/wiki/Greater_Bengaluru_Authority (BBMP replaced by the GBA and five city corporations, fully in force 2 Sep 2025; GBA HQ Kempegowda Civic Hall, Hudson Circle, Bengaluru 560002; official site gba.karnataka.gov.in, which loads)",
  BBMP_GONE: "https://en.wikipedia.org/wiki/Bruhat_Bengaluru_Mahanagara_Palike (dissolved; final notification of the five corporations 2 Sep 2025). The new corporations' office addresses and services could not be confirmed, so the BBMP rows are hidden, not rewritten.",
  KA_REG_FEE: "https://www.deccanherald.com/india/karnataka/property-deals-to-cost-more-registration-fee-hiked-to-2-2-3704857 (30 Aug 2025, quoting the Inspector General of Registration: 5% stamp duty + 0.6% other duties/cess + registration fee raised from 1% to 2% from 31 Aug 2025 = 7.6%)",
  DL_DELHI: "https://transport.delhi.gov.in/transport/permanent-driving-licence (fee under CMVR Rule 32: Permanent Driving Licence 200 + 200 (Smart Card) = 400)",
  DL_RENEW: "https://transport.delhi.gov.in/transport/renewal-driving-licence (CMVR Rule 32: renewal within grace period 200 + 200 smart card = 400; after grace period 300 + 1000 for each year or part + 200 smart card)",
  DL_LEARNER: "https://transport.delhi.gov.in/transport/learner-licence (CMVR Rule 32: learner's licence 150 + learner's test 50 + driving test 300 = 500 for one class) + https://transport.delhi.gov.in/transport/permanent-driving-licence (DL 200 + 200 smart card)",
  TS_REG: "https://registration.telangana.gov.in (Telangana Registration & Stamps Department, IGRS); https://newsonair.gov.in/telangana-cm-launches-bhu-bharathi-portal-to-ensure-land-security-transparency (Dharani replaced by Bhu Bharati for land records, Apr 2025)",
  MUM_STAMP: "https://www.99acres.com/articles/stamp-duty-and-registration-charges-in-mumbai.html + https://www.bajajfinserv.in/stamp-duty-and-property-registration-charges-mumbai (Mumbai stamp duty 6% men / 5% women incl. 1% metro cess; registration fee 1% capped at ₹30,000). No igrmaharashtra.gov.in page states the rates; several reputed sources agree.",
  TIPS: "Hand-seeded Mar 2026 (no source column). Mysuru tip names BBMP (Bengaluru's dissolved body) as Mysuru's tax office; Bengaluru tip sends people to BBMP; 'free entry on Sundays' at Mysuru Palace and the 2024-25 FRP are unchecked/stale. None could be traced to an official page as a set.",
} as const;

const L = (id: string, finding: number, label: string, set: Record<string, FieldValue>, was: Record<string, FieldValue>, why: string, source: string, op: Fix["op"] = "update"): Fix =>
  ({ table: "Leader", id, op, finding, label, set, was, why, source });

// ── The reviewed list ───────────────────────────────────────────────────
const FIXES: Fix[] = [
  // Leader
  L("cmnakakte00010mxnp6z9488x", 0, "Mysuru · Siddaramaiah (MLA, Varuna) · Kannada role", { roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ" }, { roleLocal: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)" },
    "The Kannada role still said '(Chief Minister)'; he resigned as CM on 28 May 2026. Set to the plain MLA role every other MLA row uses.", SRC.DKS_CM),
  L("cmnakars600011axnrdfzk0u3", 22, "Bengaluru Urban · P.C. Mohan (MP) · in this job since", { since: "2009" }, { since: "2004" },
    "MP for Bangalore Central since 2009; the seat did not exist before 2008 (he was MLA for Chickpet 1999–2008).", SRC.PC_MOHAN),
  L("cmnfm3feu000z3rxn9olhcp4z", 23, "Mumbai · Lokesh Chandra · General Manager, BEST", { active: false }, { active: true, name: "Lokesh Chandra" },
    "HIDE (active=false): he left BEST in June 2023; who holds the post now could not be confirmed.", SRC.BEST_GM, "hide"),
  L("cmnfm3feu000o3rxnjg5cg4bd", 24, "Mumbai · Deven Bharti (CP) · phone", { phone: null }, { phone: "100" },
    "HIDE (null): 100 is the old police emergency code, not the Commissioner's office number.", SRC.HELPLINE_100, "hide"),
  L("cmmv9n835000fubxnznikgoc2", 25, "Mandya · N. Chaluvarayaswamy · Kannada name", { nameLocal: "ಎನ್. ಚಲುವರಾಯಸ್ವಾಮಿ" }, { nameLocal: "ಎನ್. ಚೌವರಾಯಸ್ವಾಮಿ" },
    "The Kannada spelling read 'Chauvarayaswamy'.", SRC.CHALUVA),
  L("cmnf0n4vn00001dxnceqpxgxh", 35, "New Delhi · Bansuri Swaraj (MP) · phone", { phone: null }, { phone: "+91-11-23034444" },
    "HIDE (null): the number is on no official page and not in the row's cited sources.", SRC.BANSURI, "hide"),

  // GovOffice — corrected addresses
  { table: "GovOffice", id: "cmntdqtsf001rlnxncu1o5sz5", op: "update", finding: 8, label: "Lucknow · Allahabad High Court — Lucknow Bench · address",
    set: { address: "Vibhuti Khand, Gomti Nagar, Lucknow 226010" }, was: { address: "Kaiserbagh, Lucknow 226001" },
    why: "The bench left Kaiserbagh for Vibhuti Khand, Gomti Nagar in Oct 2016.", source: SRC.LKO_HC },
  { table: "GovOffice", id: "cmmvn6u4b00cpmuxnezojkafm", op: "update", finding: 9, label: "Bengaluru Urban · Regional Passport Office · address",
    set: { address: "80 Feet Road, Koramangala 8th Block, Bengaluru 560095" }, was: { address: "Rajajinagar 5th Block, Bengaluru 560010" },
    why: "The RPO is in Koramangala, not Rajajinagar.", source: SRC.RPO_BLR },
  { table: "GovOffice", id: "cmnrsydia001zyaxnxa4hpxwj", op: "update", finding: 10, label: "Hyderabad · Collectorate · address",
    set: { address: "6-2-10, Lakdikapul, Hyderabad 500004" }, was: { address: "Tank Bund Road, Hyderabad 500063" },
    why: "The row copied the GHMC head office address.", source: SRC.HYD_COLL },
  { table: "GovOffice", id: "cmnfm3obe002y4exnfst5t99q", op: "update", finding: 11, label: "Kolkata · RTO Kolkata · name and address",
    set: { name: "Public Vehicles Department (RTO), Kolkata", address: "38 Beltala Road, Kolkata 700020" },
    was: { name: "RTO Kolkata", address: "Jessore Road, Barasat, Kolkata" },
    why: "Barasat is North 24 Parganas' motor vehicles office; Kolkata's is the PVD at Beltala Road.", source: SRC.KOL_PVD },
  { table: "GovOffice", id: "cmnfm3ggu003c3rxnjhcufkgu", op: "update", finding: 15, label: "Mumbai · Mumbai Suburban Collector Office · address",
    set: { address: "10th Floor, Administrative Building, Near Chetna College, Government Colony, Bandra (East), Mumbai 400051" },
    was: { address: "Court Naka, Bandra East, Mumbai 400051" },
    why: "'Court Naka' is a Thane landmark and is not in the official address.", source: SRC.MUM_SUB_COLL },
  { table: "GovOffice", id: "cmmvn6q0u005vmuxni4k1mln7", op: "update", finding: 2, label: "Bengaluru Urban · BBMP Head Office → GBA Head Office",
    set: { name: "Greater Bengaluru Authority (GBA) Head Office", type: "City Authority", website: "gba.karnataka.gov.in" },
    was: { name: "Bruhat Bengaluru Mahanagara Palike (BBMP) Head Office", type: "Municipal Corporation", website: "bbmp.gov.in" },
    why: "BBMP was dissolved on 2 Sep 2025; the GBA sits in the same Hudson Circle head office (address unchanged).", source: SRC.GBA },

  // GovOffice — hidden (active=false)
  ...([
    ["cmmvn6u4b00cwmuxn50zvcmby", "Bruhat Bengaluru Mahanagara Palike — East Zone"],
    ["cmmvn6u4b00cymuxnl9gwqqtl", "Bruhat Bengaluru Mahanagara Palike — North Zone"],
    ["cmmvn6u4b00cvmuxnt0c8wrrm", "Bruhat Bengaluru Mahanagara Palike — South Zone"],
    ["cmmvn6u4b00cxmuxn1pnmtnwe", "Bruhat Bengaluru Mahanagara Palike — West Zone"],
    ["cmmvn6q0u0060muxnnjw63hvj", "BBMP Citizen Service Centre (One-Stop)"],
    ["cmmvn6u4b00dimuxnb47k5tj6", "BBMP Solid Waste Management Department"],
    ["cmmvn6u4b00dlmuxnr2kw8glr", "BBMP Town Planning Department"],
    ["cmmvn6u4b00dkmuxn5dj0xid9", "AADHAAR Enrolment Centre — BBMP"],
  ] as const).map(([id, name]): Fix => ({
    table: "GovOffice", id, op: "hide", finding: 2, label: `Bengaluru Urban · ${name}`,
    set: { active: false }, was: { active: true, name },
    why: "HIDE (active=false): BBMP no longer exists; the replacing corporation office could not be confirmed." +
      (id === "cmmvn6u4b00dkmuxn5dj0xid9" ? " Its phone 1947 is UIDAI's national helpline, not this centre." : ""),
    source: SRC.BBMP_GONE,
  })),
  { table: "GovOffice", id: "cmmvn6u4b00d5muxnq92lwhpx", op: "hide", finding: 13, label: "Bengaluru Urban · Regional Transport Office — Bengaluru East (Whitefield)",
    set: { active: false }, was: { active: true, name: "Regional Transport Office — Bengaluru East", address: "Whitefield, Bengaluru 560066" },
    why: "HIDE (active=false): listed twice with two addresses; listings put the East RTO (KA-03) in Indiranagar / Kasturi Nagar, not Whitefield. Correct address not confirmed.",
    source: SRC.RTO_BLR_EAST },

  // GovOffice — deleted (whole row unfounded)
  { table: "GovOffice", id: "cmmvn6q0u005xmuxnmhtv37nk", op: "delete", finding: 13, label: "Bengaluru Urban · Regional Transport Office (RTO), Bengaluru East (Nandini Layout)",
    was: { name: "Regional Transport Office (RTO), Bengaluru East", address: "Nandini Layout, Bengaluru - 560096" },
    why: "DELETE: duplicate of the East RTO row with a second, wrong address (Nandini Layout is north-west Bengaluru).", source: SRC.RTO_BLR_EAST },
  { table: "GovOffice", id: "cmmvn6u4b00cjmuxn0zcl70cx", op: "delete", finding: 14, label: "Bengaluru Urban · Kempegowda International Airport Authority Office",
    was: { name: "Kempegowda International Airport Authority Office", address: "Devanahalli, Bengaluru 562110" },
    why: "DELETE: no such 'authority office'; the airport is in Bengaluru Rural district and run by BIAL.", source: SRC.KIA },
  { table: "GovOffice", id: "cmmvn77fi00owmuxnytcyi6lh", op: "delete", finding: 12, label: "Mysuru · KNNL Divisional Office Mysuru (KRS Dam)",
    was: { name: "KNNL Divisional Office Mysuru (KRS Dam)", address: "KRS Dam, K.R. Nagar 571607" },
    why: "DELETE: mixes KRS (Mandya district, PIN 571607) with K.R. Nagar (Mysuru, 571602); the KRS dam is not in Mysuru district and no such office could be confirmed.",
    source: SRC.KRS },

  // ServiceGuide — corrected fees / portal
  { table: "ServiceGuide", id: "cmmv9ndhd0055ubxnov8u7c8x", op: "update", finding: 3, label: "Mandya · Property Registration · fees",
    set: { fees: "About 7.6% of the property's value: 5% stamp duty, 0.6% cess and other duties, and a 2% registration fee (raised from 1% on 31 Aug 2025)" },
    was: { fees: "5.6% of property value (Stamp duty + Registration)" },
    why: "5.6% was the stamp duty alone; the 2% registration fee (from 31 Aug 2025) was left out.", source: SRC.KA_REG_FEE },
  { table: "ServiceGuide", id: "cmnf0n839003x1dxnl3xt197e", op: "update", finding: 18, label: "New Delhi · Driving License · fees",
    set: { fees: "₹200 + ₹200 smart card fee (₹400 in all)" }, was: { fees: "₹200 + ₹50 smart card fee" },
    why: "The smart card fee is ₹200, not ₹50.", source: SRC.DL_DELHI },
  { table: "ServiceGuide", id: "cmmvn6qec006gmuxneb5loblp", op: "update", finding: 19, label: "Bengaluru Urban · Driving License (DL) Renewal · fees",
    set: { fees: "₹200 + ₹200 smart card (₹400) within the grace period; after it, ₹300 + ₹1,000 for each year or part of a year late + ₹200 smart card (CMVR Rule 32)" },
    was: { fees: "₹200 renewal + ₹50 smart card + ₹200 testing if needed" },
    why: "Smart card is ₹200 (not ₹50); the '₹200 testing' fee is not in Rule 32 (late renewal is charged per year instead).", source: SRC.DL_RENEW },
  { table: "ServiceGuide", id: "cmmv9ndhd0056ubxn8pbzb8em", op: "update", finding: 19, label: "Mandya · Driving License · fees",
    set: { fees: "Learner's licence ₹150 + learner's test ₹50 + driving test ₹300 (one class of vehicle); driving licence ₹200 + ₹200 smart card (CMVR Rule 32)" },
    was: { fees: "₹200 (Learner's License) + ₹200 (Driving License)" },
    why: "Left out the ₹300 driving test and the ₹200 smart card; the learner's licence is ₹150 + ₹50 test.", source: SRC.DL_LEARNER },
  { table: "ServiceGuide", id: "cmnrsyf3p003jyaxn53zr8pj3", op: "update", finding: 20, label: "Hyderabad · Property Registration · office and portal",
    set: { office: "IGRS Telangana (Registration & Stamps Department)", onlinePortal: "IGRS Telangana", onlineUrl: "https://registration.telangana.gov.in" },
    was: { office: "IGRS Telangana / Dharani", onlinePortal: "https://dharani.telangana.gov.in", onlineUrl: null },
    why: "Dharani was retired in Apr 2025 (Bhu Bharati replaced it for land records); property registration is on IGRS Telangana.", source: SRC.TS_REG },
  { table: "ServiceGuide", id: "cmnfm3i17005f3rxnc3td3ter", op: "update", finding: 21, label: "Mumbai · Property Registration · fees and steps",
    set: {
      fees: "Stamp duty 6% (men) / 5% (women buying alone), including 1% metro cess; registration fee 1%, capped at ₹30,000",
      steps: [
        "Calculate stamp duty (6% for men, 5% for women buying alone in Mumbai, including 1% metro cess)",
        "Prepare documents: Sale deed, PAN, Aadhaar, 7/12 extract",
        "Book slot on IGR Maharashtra portal",
        "Pay stamp duty + registration fee (1%, capped at ₹30,000)",
        "Visit Sub-Registrar with buyer, seller, 2 witnesses",
        "Biometric verification and registration",
        "Collect registered document (usually same day)",
      ],
    },
    was: {
      fees: "Stamp duty: 5% (men) / 4% (women) + 1% registration fee",
      steps: [
        "Calculate stamp duty (5% for men, 4% for women in Mumbai)",
        "Prepare documents: Sale deed, PAN, Aadhaar, 7/12 extract",
        "Book slot on IGR Maharashtra portal",
        "Pay stamp duty + registration fee (1%)",
        "Visit Sub-Registrar with buyer, seller, 2 witnesses",
        "Biometric verification and registration",
        "Collect registered document (usually same day)",
      ],
    },
    why: "Left out Mumbai's 1% metro cess and the ₹30,000 cap on the registration fee (the steps repeated the old rates).", source: SRC.MUM_STAMP },

  // ServiceGuide — hidden
  { table: "ServiceGuide", id: "cmmvn6qec006fmuxnxdks9ihl", op: "hide", finding: 2, label: "Bengaluru Urban · Khatha Transfer (BBMP)",
    set: { active: false }, was: { active: true, serviceName: "Khatha Transfer (BBMP)" },
    why: "HIDE (active=false): the guide sends people to BBMP zone offices, which no longer exist; the current process could not be confirmed.", source: SRC.BBMP_GONE },
  { table: "ServiceGuide", id: "cmmvn6qec006emuxn77hhy4tv", op: "hide", finding: 2, label: "Bengaluru Urban · Property Tax Payment (BBMP)",
    set: { active: false }, was: { active: true, serviceName: "Property Tax Payment (BBMP)" },
    why: "HIDE (active=false): names BBMP ward offices and a BBMP rebate; the current body and portal could not be confirmed.", source: SRC.BBMP_GONE },

  // PoliceStation — deleted (no `active` column)
  { table: "PoliceStation", id: "cmmvn6tws00b7muxnt5qfwvsz", op: "delete", finding: 16, label: "Bengaluru Urban · Devanahalli Police Station",
    was: { name: "Devanahalli Police Station", address: "Devanahalli Town, Bengaluru Rural 562110" },
    why: "DELETE: Devanahalli is in Bengaluru Rural district (the row's own address says so); it was counted as a Bengaluru Urban station. Bengaluru Rural is not a district on the site.",
    source: "The row's own address; https://en.wikipedia.org/wiki/Devanahalli (Bengaluru Rural district)" },
  { table: "PoliceStation", id: "cmnfm3rud002451xnz8570xsg", op: "delete", finding: 17, label: "Chennai · Tambaram Police Station",
    was: { name: "Tambaram Police Station", address: "GST Road, Tambaram, Chennai 600045" },
    why: "DELETE: Tambaram is in Chengalpattu district, policed by the Tambaram City Police Commissionerate (since 1 Jan 2022), not Greater Chennai Police.",
    source: "https://theprint.in/india/tn-cm-inaugurates-2-new-police-commissionerates-for-suburban-chennai/792953/ ; https://en.wikipedia.org/wiki/Tambaram" },

  // CitizenTip — hidden (all 22 hand-seeded rows; the API also serves none now)
  ...([
    ["cmmvn6ql1006kmuxns2xwoaol", "Use Ayushman Bharat at Government Hospitals"],
    ["cmmvn6ql1006jmuxnbjttqtw3", "Waterlogged Underpasses During Rains"],
    ["cmmvn6ql1006lmuxntqn48fc1", "Pay Property Tax Before April 30 for Rebate"],
    ["cmmvn6ql1006hmuxncy87yksp", "Avoid Peak-Hour Entry to CBD"],
    ["cmmvn6ql1006mmuxnaxekcydi", "Namma Metro Fare Saver Pass"],
    ["cmmvn6ql1006imuxngaemo1j2", "BWSSB Water Supply Schedule"],
    ["cmmv9ndm30057ubxn8mco25dg", "Check FRP before delivering sugarcane"],
    ["cmmv9ndm30059ubxn5xqcs7m1", "File RTI if government work is delayed"],
    ["cmmv9ndm30058ubxnnmzp8u3f", "KRS water level affects canal irrigation"],
    ["cmmvn79ae00rhmuxn2ryd7zog", "Silk Cocoon Market — Bivoltine Rates"],
    ["cmmvn79ae00rkmuxnfczrjerb", "MCC Property Tax — 5% Discount before June 30"],
    ["cmmvn79ae00rmmuxndojximd5", "KSDL / KSIC Jobs — Apply via KPSC"],
    ["cmmvn79ae00rjmuxn9eo9hrzg", "K.R. Hospital — Free Specialist OPD"],
    ["cmmvn79ae00rlmuxn6wyoecop", "Nagarahole — Tiger Reserve Entry Rules"],
    ["cmmvn79ae00rgmuxnbdnt7qug", "Dasara Bookings — Register Early"],
    ["cmmvn79ae00rfmuxn8vv924i6", "Mysuru Palace — Free Entry on Sundays"],
    ["cmmvn79ae00rimuxnitoxvm7m", "KRS Dam Level — Cauvery Water Alerts"],
    ["cmnf0n89u00441dxn0goicoda", "Check AQI Before Outdoor Activity"],
    ["cmnf0n89u00461dxnlwalo2ni", "Free Electricity: Up to 200 Units"],
    ["cmnf0n89u00451dxnkd5eh4f1", "Mohalla Clinics — Free Primary Healthcare"],
    ["cmnf0n89u00421dxn32e2qr61", "Use Delhi Metro for CBD Access"],
    ["cmnf0n89u00431dxn77lnfvyc", "Free Water: Check Your DJB Bill"],
  ] as const).map(([id, title]): Fix => ({
    table: "CitizenTip", id, op: "hide", finding: 34, label: `CitizenTip · ${title}`,
    set: { active: false }, was: { active: true, title },
    why: "HIDE (active=false): unsourced seeded tip; several of these rows are wrong (BBMP as Mysuru's tax office, BBMP rebate, stale FRP).",
    source: SRC.TIPS,
  })),
];

// ── Engine ──────────────────────────────────────────────────────────────
const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);

function same(current: unknown, planned: FieldValue): boolean {
  if (current === null || current === undefined) return planned === null;
  if (planned === null) return false;
  if (Array.isArray(planned)) return Array.isArray(current) && JSON.stringify(current) === JSON.stringify(planned);
  if (typeof planned === "number") return Math.abs(Number(current) - planned) < 1e-9;
  if (typeof planned === "boolean") return current === planned;
  return String(current) === planned;
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return `[${v.length} items] ${JSON.stringify(v).slice(0, 90)}${JSON.stringify(v).length > 90 ? "…" : ""}`;
  if (typeof v === "string") return JSON.stringify(v.length > 110 ? v.slice(0, 107) + "…" : v);
  return String(v);
}

type Planned = { fix: Fix; data?: Record<string, unknown> };

async function main() {
  const seen = new Set<string>();
  for (const f of FIXES) {
    const key = `${f.table}:${f.id}`;
    if (seen.has(key)) throw new Error(`Duplicate fix for ${key}`);
    seen.add(key);
    if (f.op !== "delete" && (!f.set || Object.keys(f.set).length === 0)) throw new Error(`No fields to set: ${key}`);
  }

  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const plan: Planned[] = [];
  type Count = { update: number; hide: number; delete: number; done: number; gone: number; drift: number };
  const counts: Record<string, Count> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, hide: 0, delete: 0, done: 0, gone: 0, drift: 0 });
  const drifted: string[] = [];

  try {
    let currentTable = "";
    for (const f of FIXES) {
      if (f.table !== currentTable) {
        currentTable = f.table;
        console.log(`\n══ ${f.table} ══`);
      }
      const rows = (await p.$queryRawUnsafe(`SELECT * FROM "${f.table}" WHERE id = $1`, f.id)) as Array<Record<string, unknown>>;
      const row = rows[0];
      console.log(`\n• ${f.op.toUpperCase()} ${f.table} ${f.id} — ${f.label}  [finding ${f.finding}]`);
      console.log(`  why:    ${f.why}`);
      console.log(`  source: ${f.source} (checked ${CHECKED})`);
      if (!row) {
        console.log("  → row not found (already deleted?) — skipped");
        tally(f.table).gone++;
        continue;
      }
      // Every fix first checks the row still holds what we saw (identity fields for deletes).
      const changed = Object.entries(f.was).filter(([field, v]) => {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        const planned = f.set?.[field];
        return !same(row[field], v) && !(planned !== undefined && same(row[field], planned));
      });
      if (changed.length > 0) {
        for (const [field, v] of changed) console.log(`    ${field}: now ${show(row[field])}, was ${show(v)} on ${CHECKED} — CHANGED SINCE CHECK`);
        console.log("  → SKIPPED: changed since the check; review by hand");
        tally(f.table).drift++;
        drifted.push(`${f.table} ${f.id} (${f.label})`);
        continue;
      }
      if (f.op === "delete") {
        console.log(`  → delete row (${show(row.name ?? row.title ?? "")})`);
        plan.push({ fix: f });
        tally(f.table).delete++;
        continue;
      }
      const data: Record<string, unknown> = {};
      for (const [field, planned] of Object.entries(f.set!)) {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        if (same(row[field], planned)) {
          console.log(`    ${field}: ${show(row[field])} (already ${show(planned)})`);
          continue;
        }
        console.log(`    ${field}: ${show(row[field])} → ${show(planned)}`);
        data[field] = planned;
      }
      if (Object.keys(data).length === 0) {
        console.log("  → already applied — skipped");
        tally(f.table).done++;
        continue;
      }
      plan.push({ fix: f, data });
      tally(f.table)[f.op === "hide" ? "hide" : "update"]++;
    }

    console.log("\n══ Summary ══");
    for (const [t, c] of Object.entries(counts)) {
      console.log(
        `${t.padEnd(14)} update ${String(c.update).padStart(3)}   hide ${String(c.hide).padStart(3)}   delete ${String(c.delete).padStart(3)}   already done ${String(c.done).padStart(3)}   not found ${String(c.gone).padStart(3)}   changed-since-check ${String(c.drift).padStart(3)}`,
      );
    }
    const n = (op: Fix["op"]) => plan.filter((x) => x.fix.op === op).length;
    console.log(`Total changes to apply: ${plan.length} (update ${n("update")}, hide ${n("hide")}, delete ${n("delete")})`);
    if (drifted.length) console.log(`Flagged (changed since check, not touched):\n  - ${drifted.join("\n  - ")}`);

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
    const deletesByTable = new Map<string, string[]>();
    for (const { fix } of plan) if (fix.op === "delete") deletesByTable.set(fix.table, [...(deletesByTable.get(fix.table) ?? []), fix.id]);
    await p.$transaction(
      async (tx) => {
        const model = (table: string) => (tx as unknown as Record<string, Delegate>)[delegateName(table)];
        for (const { fix, data } of plan) if (fix.op !== "delete") await model(fix.table).update({ where: { id: fix.id }, data });
        for (const [table, ids] of deletesByTable) {
          const { count } = await model(table).deleteMany({ where: { id: { in: ids } } });
          if (count !== ids.length) throw new Error(`${table}: expected to delete ${ids.length} rows, deleted ${count} — rolled back`);
        }
      },
      { timeout: 120_000, maxWait: 30_000 },
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
