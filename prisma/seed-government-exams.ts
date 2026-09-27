// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Government Exam Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-government-exams.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient, type Prisma } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { canonicalExamStatus, sameExam } from "../src/lib/dedupe/keys";
import { examBucket, examPlacement, type ExamScope } from "../src/lib/dedupe/exam-rules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * Sept 2026: rows go to their one place (national: no state, no district;
 * state: the state, no district — src/lib/dedupe/exam-rules.ts), statuses in
 * the canonical set ("upcoming" → UNVERIFIED), and an exam already stored in
 * that place under any spelling is skipped (canonical exam key). The old
 * createMany wrote national exams as level "state" and re-ran into copies.
 */
async function createExams(scope: ExamScope, stateId: string | null, rows: Prisma.GovernmentExamCreateManyInput[]) {
  const placement = examPlacement(scope, stateId, null);
  const bucket = examBucket(placement);
  const stored = (await prisma.governmentExam.findMany({ take: 5000 })).filter((r) => examBucket(r) === bucket);
  const fresh: Prisma.GovernmentExamCreateManyInput[] = [];
  for (const r of rows) {
    const id = { title: r.title, shortName: r.shortName ?? null, organizingBody: r.organizingBody ?? r.department };
    if (stored.some((s) => sameExam(s, id)) || fresh.some((f) => sameExam({ title: f.title, shortName: f.shortName ?? null, organizingBody: f.organizingBody ?? f.department }, id))) continue;
    fresh.push({ ...r, ...placement, status: canonicalExamStatus(r.status ?? null, r.title) });
  }
  if (fresh.length) await prisma.governmentExam.createMany({ data: fresh });
  console.log(`    ${fresh.length} added, ${rows.length - fresh.length} already stored`);
}

async function main() {
  console.log("🌱 Seeding Government Exam data...\n");

  // ── Resolve state IDs ────────────────────────────────────
  const delhi = await prisma.state.findUnique({ where: { slug: "delhi" } });
  const maharashtra = await prisma.state.findUnique({ where: { slug: "maharashtra" } });
  const westBengal = await prisma.state.findUnique({ where: { slug: "west-bengal" } });
  const tamilNadu = await prisma.state.findUnique({ where: { slug: "tamil-nadu" } });

  if (!delhi || !maharashtra || !westBengal || !tamilNadu) {
    throw new Error("One or more states not found — run seed-hierarchy.ts first");
  }
  console.log("✓ Found all 4 states\n");

  // Check per-state to avoid re-seeding but allow adding new states
  const existingNational = await prisma.governmentExam.count({ where: { stateId: null } });
  const existingDelhi = await prisma.governmentExam.count({ where: { stateId: delhi.id } });
  const existingMH = await prisma.governmentExam.count({ where: { stateId: maharashtra.id } });
  const existingWB = await prisma.governmentExam.count({ where: { stateId: westBengal.id } });
  const existingTN = await prisma.governmentExam.count({ where: { stateId: tamilNadu.id } });
  const skipNational = existingNational >= 15; // we seed 20 national, but some may exist already
  const skipDelhi = existingDelhi > 0;
  const skipMH = existingMH > 0;
  const skipWB = existingWB > 0;
  const skipTN = existingTN > 0;

  // ═══════════════════════════════════════════════════════════
  // CENTRAL / NATIONAL EXAMS (stored once: level "national", no state, no district)
  // ═══════════════════════════════════════════════════════════
  if (skipNational) {
    console.log(`📌 National exams: ⏭  already seeded (${existingNational} records)`);
  } else {
    console.log("📌 Seeding national-level exams...");

  await createExams("NATIONAL", null, [
      // ── UPSC ──
      {
        level: "state", title: "UPSC Civil Services Examination (CSE) 2026",
        department: "Union Public Service Commission (UPSC)",
        vacancies: 1056, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "21-32 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview/Personality Test",
        payScale: "IAS/IPS/IFS: Level 10 — ₹56,100-₹1,77,500",
        applyUrl: "https://upsconline.nic.in",
        notificationUrl: "https://upsc.gov.in",
        status: "upcoming",
        announcedDate: new Date("2026-02-01"),
        startDate: new Date("2026-02-15"),
        endDate: new Date("2026-03-10"),
        examDate: new Date("2026-06-01"),
      },
      {
        level: "state", title: "UPSC Engineering Services Examination (ESE) 2026",
        department: "Union Public Service Commission (UPSC)",
        vacancies: 232, qualification: "B.E./B.Tech in relevant engineering discipline",
        ageLimit: "21-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹200, SC/ST/PwD/Women: Nil",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview",
        payScale: "Level 10 — ₹56,100-₹1,77,500",
        applyUrl: "https://upsconline.nic.in",
        status: "upcoming",
        announcedDate: new Date("2026-03-15"),
        examDate: new Date("2026-06-22"),
      },
      {
        level: "state", title: "UPSC Combined Defence Services (CDS) Examination 2026 (II)",
        department: "Union Public Service Commission (UPSC)",
        vacancies: 459, qualification: "Graduation (IMA/OTA); B.E. (Naval Academy); Graduation with Physics/Maths (Air Force)",
        ageLimit: "19-25 yrs (varies by academy)",
        applicationFee: "Gen/OBC: ₹200, SC/ST: Nil",
        selectionProcess: "Written Exam → SSB Interview",
        payScale: "Level 10 — ₹56,100 (entry)",
        applyUrl: "https://upsconline.nic.in",
        status: "upcoming",
        examDate: new Date("2026-09-06"),
      },
      {
        level: "state", title: "UPSC NDA & Naval Academy Examination 2026 (II)",
        department: "Union Public Service Commission (UPSC)",
        vacancies: 400, qualification: "Class 12 passed (10+2)",
        ageLimit: "16.5-19.5 yrs",
        applicationFee: "Gen/OBC: ₹100, SC/ST: Nil",
        selectionProcess: "Written Exam → SSB Interview → Medical",
        payScale: "Stipend during training; Level 10 on commission",
        applyUrl: "https://upsconline.nic.in",
        status: "upcoming",
        examDate: new Date("2026-09-07"),
      },

      // ── SSC ──
      {
        level: "state", title: "SSC Combined Graduate Level (CGL) Examination 2026",
        department: "Staff Selection Commission (SSC)",
        vacancies: 17727, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "18-32 yrs (varies by post; relaxation for SC/ST/OBC/PwD)",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "Tier 1 (CBE) → Tier 2 (CBE) → Document Verification",
        payScale: "Level 4 to Level 7 — ₹25,500-₹81,100 (varies by post)",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        announcedDate: new Date("2026-04-01"),
        startDate: new Date("2026-04-15"),
        endDate: new Date("2026-05-15"),
        examDate: new Date("2026-07-15"),
      },
      {
        level: "state", title: "SSC Combined Higher Secondary Level (CHSL) 2026",
        department: "Staff Selection Commission (SSC)",
        vacancies: 6000, qualification: "Class 12 passed (10+2)",
        ageLimit: "18-27 yrs (Gen); relaxation for reserved categories",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "Tier 1 (CBE) → Tier 2 (CBE + Skill Test)",
        payScale: "Level 2 to Level 4 — ₹19,900-₹63,200 (LDC/DEO/PA/SA)",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        examDate: new Date("2026-08-01"),
      },
      {
        level: "state", title: "SSC Multi-Tasking Staff (MTS) 2026",
        department: "Staff Selection Commission (SSC)",
        vacancies: 8326, qualification: "Class 10 passed (Matriculation)",
        ageLimit: "18-25 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "CBE (Session 1 + Session 2)",
        payScale: "Level 1 — ₹18,000-₹56,900",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        examDate: new Date("2026-10-01"),
      },
      {
        level: "state", title: "SSC Junior Engineer (JE) Examination 2026",
        department: "Staff Selection Commission (SSC)",
        vacancies: 968, qualification: "Diploma/B.E./B.Tech in Civil/Mechanical/Electrical/Electronics",
        ageLimit: "18-32 yrs (varies by department)",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "Paper 1 (CBE) → Paper 2 (Written)",
        payScale: "Level 6 — ₹35,400-₹1,12,400",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        examDate: new Date("2026-09-15"),
      },

      // ── Railway (RRB) ──
      {
        level: "state", title: "RRB NTPC (Non-Technical Popular Categories) 2026",
        department: "Railway Recruitment Boards (RRB)",
        vacancies: 11558, qualification: "Graduation (for senior posts); Class 12 (for junior posts)",
        ageLimit: "18-33 yrs (varies by post; relaxation for reserved)",
        applicationFee: "Gen/OBC: ₹500, SC/ST/PwD/Women/Minorities/EBC: ₹250",
        selectionProcess: "CBT Stage 1 → CBT Stage 2 → Typing Skill Test (for some) → Document Verification",
        payScale: "Level 2 to Level 6 — ₹19,900-₹1,12,400",
        applyUrl: "https://www.rrbcdg.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-15"),
      },
      {
        level: "state", title: "RRB Group D (Level 1) Recruitment 2026",
        department: "Railway Recruitment Boards (RRB)",
        vacancies: 32898, qualification: "Class 10 passed + ITI (in some trades)",
        ageLimit: "18-33 yrs (Gen); relaxation for reserved categories",
        applicationFee: "Gen/OBC: ₹500, SC/ST/PwD/Women/Minorities/EBC: ₹250",
        selectionProcess: "CBT → Physical Efficiency Test (PET) → Document Verification → Medical",
        payScale: "Level 1 — ₹18,000-₹56,900",
        applyUrl: "https://www.rrbcdg.gov.in",
        status: "upcoming",
        examDate: new Date("2026-11-01"),
      },
      {
        level: "state", title: "RRB ALP (Assistant Loco Pilot) & Technician 2026",
        department: "Railway Recruitment Boards (RRB)",
        vacancies: 5696, qualification: "Class 10 + ITI or Diploma in relevant trade",
        ageLimit: "18-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹500, SC/ST/PwD/Women/Minorities/EBC: ₹250",
        selectionProcess: "CBT Stage 1 → CBT Stage 2 → Computer-Based Aptitude Test → Document Verification",
        payScale: "Level 2 — ₹19,900-₹63,200",
        applyUrl: "https://www.rrbcdg.gov.in",
        status: "upcoming",
        examDate: new Date("2026-09-20"),
      },
      {
        level: "state", title: "RRB Junior Engineer (JE) 2026",
        department: "Railway Recruitment Boards (RRB)",
        vacancies: 7951, qualification: "Diploma/B.E./B.Tech in relevant engineering branch",
        ageLimit: "18-36 yrs (varies; relaxation for reserved)",
        applicationFee: "Gen/OBC: ₹500, SC/ST/PwD/Women/Minorities/EBC: ₹250",
        selectionProcess: "CBT Stage 1 → CBT Stage 2 → Document Verification → Medical",
        payScale: "Level 6 — ₹35,400-₹1,12,400",
        applyUrl: "https://www.rrbcdg.gov.in",
        status: "upcoming",
        examDate: new Date("2026-10-15"),
      },

      // ── Banking ──
      {
        level: "state", title: "IBPS PO (Probationary Officer) 2026",
        department: "Institute of Banking Personnel Selection (IBPS)",
        vacancies: 4455, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "20-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹850, SC/ST/PwD: ₹175",
        selectionProcess: "Prelims (MCQ) → Mains (MCQ + Descriptive) → Interview",
        payScale: "JMGS-I: ₹36,000-₹63,840 (basic)",
        applyUrl: "https://ibps.in",
        status: "upcoming",
        examDate: new Date("2026-10-10"),
      },
      {
        level: "state", title: "IBPS Clerk 2026",
        department: "Institute of Banking Personnel Selection (IBPS)",
        vacancies: 6128, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "20-28 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹850, SC/ST/PwD: ₹175",
        selectionProcess: "Prelims (MCQ) → Mains (MCQ) → Provisional Allotment",
        payScale: "₹19,900-₹47,920 (basic)",
        applyUrl: "https://ibps.in",
        status: "upcoming",
        examDate: new Date("2026-08-20"),
      },
      {
        level: "state", title: "IBPS SO (Specialist Officer) 2026",
        department: "Institute of Banking Personnel Selection (IBPS)",
        vacancies: 1600, qualification: "Graduation/PG in relevant specialization (IT/Law/Agriculture/HR/Marketing)",
        ageLimit: "20-30 yrs (varies by post)",
        applicationFee: "Gen/OBC: ₹850, SC/ST/PwD: ₹175",
        selectionProcess: "Prelims → Mains → Interview",
        payScale: "JMGS-I / MMGS-II: ₹36,000-₹78,230",
        applyUrl: "https://ibps.in",
        status: "upcoming",
        examDate: new Date("2026-11-15"),
      },
      {
        level: "state", title: "IBPS RRB (Regional Rural Banks) Officer & Office Assistant 2026",
        department: "Institute of Banking Personnel Selection (IBPS)",
        vacancies: 9995, qualification: "Bachelor's degree (Officer); Class 12 (Office Assistant)",
        ageLimit: "18-30 yrs (Office Assistant); 21-32 yrs (Officer Scale I)",
        applicationFee: "Gen/OBC: ₹850, SC/ST/PwD: ₹175",
        selectionProcess: "Prelims → Mains → Interview (Officer only)",
        payScale: "Officer Scale I: ₹36,000; Office Assistant: ₹15,000-₹26,000",
        applyUrl: "https://ibps.in",
        status: "upcoming",
        examDate: new Date("2026-08-01"),
      },
      {
        level: "state", title: "SBI PO (Probationary Officer) 2026",
        department: "State Bank of India (SBI)",
        vacancies: 2000, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "21-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹750, SC/ST/PwD: ₹125",
        selectionProcess: "Prelims → Mains → Interview → Group Exercise",
        payScale: "JMGS-I: ₹41,960-₹63,840 (basic)",
        applyUrl: "https://sbi.co.in/careers",
        status: "upcoming",
        examDate: new Date("2026-06-15"),
      },
      {
        level: "state", title: "SBI Clerk (Junior Associate) 2026",
        department: "State Bank of India (SBI)",
        vacancies: 8773, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "20-28 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹750, SC/ST/PwD: ₹125",
        selectionProcess: "Prelims → Mains → Local Language Test",
        payScale: "₹19,900-₹47,920 (basic)",
        applyUrl: "https://sbi.co.in/careers",
        status: "upcoming",
        examDate: new Date("2026-07-20"),
      },
      {
        level: "state", title: "RBI Grade B Officer 2026",
        department: "Reserve Bank of India (RBI)",
        vacancies: 294, qualification: "Master's degree or equivalent with 60% (Gen) / 55% (SC/ST/PwD)",
        ageLimit: "21-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹850, SC/ST/PwD: ₹100",
        selectionProcess: "Phase I (MCQ) → Phase II (Descriptive + MCQ) → Interview",
        payScale: "₹55,200-₹1,03,300 (basic)",
        applyUrl: "https://opportunities.rbi.org.in",
        status: "upcoming",
        examDate: new Date("2026-07-01"),
      },
  ]);
  console.log("  ✅ National exams seeded (20 exams — UPSC, SSC, RRB, Banking)");
  }

  // ═══════════════════════════════════════════════════════════
  // DELHI STATE EXAMS
  // ═══════════════════════════════════════════════════════════
  if (skipDelhi) {
    console.log(`\n📌 Delhi exams: ⏭  already seeded (${existingDelhi} records)`);
  } else {
    console.log("\n📌 Seeding Delhi exams...");

  await createExams("STATE", delhi.id, [
      {
        level: "state", stateId: delhi.id,
        title: "DSSSB TGT / PGT / PRT Recruitment 2026",
        department: "Delhi Subordinate Services Selection Board (DSSSB)",
        vacancies: 12000, qualification: "B.Ed + Graduation (TGT); B.Ed + PG (PGT); D.El.Ed/JBT (PRT)",
        ageLimit: "18-30 yrs (PRT); 21-32 yrs (TGT/PGT); relaxation for reserved",
        applicationFee: "Gen: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "One-Tier (CBT) → Document Verification → Skill Test (if applicable)",
        payScale: "PRT: Level 7 (₹44,900); TGT: Level 7; PGT: Level 8 (₹47,600)",
        applyUrl: "https://dsssb.delhi.gov.in",
        status: "upcoming",
        announcedDate: new Date("2026-03-15"),
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-04-30"),
        examDate: new Date("2026-07-01"),
      },
      {
        level: "state", stateId: delhi.id,
        title: "DSSSB Junior Clerk / LDC / Steno / Patwari 2026",
        department: "Delhi Subordinate Services Selection Board (DSSSB)",
        vacancies: 5500, qualification: "Class 12 (Clerk/LDC); Graduation (Patwari); Shorthand skill (Steno)",
        ageLimit: "18-27 yrs (Gen); relaxation for reserved categories",
        applicationFee: "Gen: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "One-Tier (CBT) → Skill Test (Typing/Shorthand) → DV",
        payScale: "Level 2-4 — ₹19,900-₹63,200",
        applyUrl: "https://dsssb.delhi.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-15"),
      },
      {
        level: "state", stateId: delhi.id,
        title: "DSSSB Fire Operator / Nursing Officer / Lab Technician 2026",
        department: "Delhi Subordinate Services Selection Board (DSSSB)",
        vacancies: 2300, qualification: "Varies by post — Class 12 + relevant diploma/certification",
        ageLimit: "18-27 yrs (varies by post)",
        applicationFee: "Gen: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "CBT → Physical Test (Fire Operator) → DV",
        payScale: "Level 4-6 — ₹25,500-₹1,12,400",
        applyUrl: "https://dsssb.delhi.gov.in",
        status: "upcoming",
        examDate: new Date("2026-09-01"),
      },
      {
        level: "state", stateId: delhi.id,
        title: "Delhi Police Constable Recruitment 2026",
        department: "Delhi Police / SSC",
        vacancies: 6433, qualification: "Class 12 passed",
        ageLimit: "18-25 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "CBT → Physical Endurance & Measurement Test → DV → Medical",
        payScale: "Level 3 — ₹21,700-₹69,100",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        examDate: new Date("2026-10-01"),
      },
      {
        level: "state", stateId: delhi.id,
        title: "Delhi Police Head Constable (Ministerial) 2026",
        department: "Delhi Police / SSC",
        vacancies: 835, qualification: "Class 12 + Typing speed 30 WPM (English) / 25 WPM (Hindi)",
        ageLimit: "18-25 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen/OBC: ₹100, SC/ST/PwD/Women: Nil",
        selectionProcess: "CBT → Skill Test (Typing) → DV → Medical",
        payScale: "Level 4 — ₹25,500-₹81,100",
        applyUrl: "https://ssc.nic.in",
        status: "upcoming",
        examDate: new Date("2026-11-15"),
      },
      {
        level: "state", stateId: delhi.id,
        title: "Delhi Jal Board JE / AE Recruitment 2026",
        department: "Delhi Jal Board (DJB)",
        vacancies: 380, qualification: "Diploma (JE) / B.E./B.Tech (AE) in Civil/Mechanical/Electrical",
        ageLimit: "18-30 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹500, SC/ST: ₹250",
        selectionProcess: "Written Exam → Interview → DV",
        payScale: "JE: Level 6 (₹35,400); AE: Level 7 (₹44,900)",
        applyUrl: "https://delhijalboard.delhi.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-01"),
      },
  ]);
  console.log("  ✅ Delhi exams seeded (6 exams — DSSSB, Delhi Police, DJB)");
  }

  // ═══════════════════════════════════════════════════════════
  // MAHARASHTRA STATE EXAMS
  // ═══════════════════════════════════════════════════════════
  if (skipMH) {
    console.log(`\n📌 Maharashtra exams: ⏭  already seeded (${existingMH} records)`);
  } else {
    console.log("\n📌 Seeding Maharashtra exams...");

  await createExams("STATE", maharashtra.id, [
      {
        level: "state", stateId: maharashtra.id,
        title: "MPSC State Service Examination (Rajyaseva) 2026",
        department: "Maharashtra Public Service Commission (MPSC)",
        vacancies: 431, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "19-38 yrs (Gen); +5 SC/ST/OBC; No limit for PwD",
        applicationFee: "Gen: ₹524, SC/ST/PwD/EWS: ₹324",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview/Personality Test",
        payScale: "Deputy Collector: Level S-20 — ₹56,100; DSP: Level S-20; Tahsildar: Level S-17",
        applyUrl: "https://mpsc.gov.in",
        status: "upcoming",
        announcedDate: new Date("2026-01-15"),
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-03-01"),
        examDate: new Date("2026-05-15"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "MPSC Combined Examination (Group B) 2026",
        department: "Maharashtra Public Service Commission (MPSC)",
        vacancies: 800, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "19-38 yrs (Gen); relaxation for reserved categories",
        applicationFee: "Gen: ₹524, SC/ST/PwD/EWS: ₹324",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview",
        payScale: "Level S-15 to S-17 — ₹41,800-₹56,100",
        applyUrl: "https://mpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-06-20"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "MPSC Combined Examination (Group C) 2026 — Tax Inspector / Clerk / Typist",
        department: "Maharashtra Public Service Commission (MPSC)",
        vacancies: 4000, qualification: "Bachelor's degree (Tax Inspector); Class 12 + Typing (Clerk/Typist)",
        ageLimit: "18-38 yrs (Gen); relaxation for reserved categories",
        applicationFee: "Gen: ₹524, SC/ST/PwD/EWS: ₹324",
        selectionProcess: "Prelims (MCQ) → Mains (MCQ) → DV",
        payScale: "Level S-8 to S-14 — ₹25,500-₹41,800",
        applyUrl: "https://mpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-07-15"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "MPSC Engineering Services 2026",
        department: "Maharashtra Public Service Commission (MPSC)",
        vacancies: 600, qualification: "B.E./B.Tech in Civil/Mechanical/Electrical/Electronics",
        ageLimit: "21-38 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹524, SC/ST/PwD/EWS: ₹324",
        selectionProcess: "Prelims → Mains → Interview",
        payScale: "Level S-15 to S-20 — ₹41,800-₹56,100",
        applyUrl: "https://mpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-10"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "Maharashtra Police Constable Recruitment 2026",
        department: "Maharashtra Police",
        vacancies: 18331, qualification: "Class 12 passed (HSC)",
        ageLimit: "18-28 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹450, SC/ST/PwD: ₹250",
        selectionProcess: "Written Test (100 marks) → Physical Test → DV → Medical",
        payScale: "₹21,700-₹69,100",
        applyUrl: "https://mahapolice.gov.in",
        status: "upcoming",
        examDate: new Date("2026-09-01"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "Maharashtra Talathi Recruitment 2026",
        department: "Maharashtra Revenue Department",
        vacancies: 4710, qualification: "Bachelor's degree + Marathi typing (30 WPM) + MS-CIT",
        ageLimit: "18-38 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹500, SC/ST: ₹250",
        selectionProcess: "Online Exam → DV → Appointment",
        payScale: "Level S-8 — ₹25,500-₹61,500",
        applyUrl: "https://maharecruitment.mahaonline.gov.in",
        status: "upcoming",
        examDate: new Date("2026-10-15"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "MHADA Junior Engineer / Clerk Recruitment 2026",
        department: "Maharashtra Housing & Area Development Authority (MHADA)",
        vacancies: 350, qualification: "Diploma (JE); Graduation + Typing (Clerk)",
        ageLimit: "18-38 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹500, SC/ST: ₹250",
        selectionProcess: "Written Exam → DV → Interview (JE only)",
        payScale: "JE: Level S-13 (₹38,600); Clerk: Level S-8 (₹25,500)",
        applyUrl: "https://mhada.gov.in",
        status: "upcoming",
        examDate: new Date("2026-11-01"),
      },
      {
        level: "state", stateId: maharashtra.id,
        title: "BMC Recruitment 2026 — Various Posts",
        department: "Brihanmumbai Municipal Corporation (BMC)",
        vacancies: 1200, qualification: "Varies — Class 10 (peon) to Graduation (clerk/AE)",
        ageLimit: "18-38 yrs (varies by post)",
        applicationFee: "Gen: ₹500, SC/ST: ₹250",
        selectionProcess: "Written Exam → Skill/Physical Test → DV",
        payScale: "₹18,000-₹56,100 (varies by post)",
        applyUrl: "https://portal.mcgm.gov.in",
        status: "upcoming",
        examDate: new Date("2026-12-01"),
      },
  ]);
  console.log("  ✅ Maharashtra exams seeded (8 exams — MPSC, Police, Talathi, MHADA, BMC)");
  }

  // ═══════════════════════════════════════════════════════════
  // WEST BENGAL STATE EXAMS
  // ═══════════════════════════════════════════════════════════
  if (skipWB) {
    console.log(`\n📌 West Bengal exams: ⏭  already seeded (${existingWB} records)`);
  } else {
    console.log("\n📌 Seeding West Bengal exams...");

  await createExams("STATE", westBengal.id, [
      {
        level: "state", stateId: westBengal.id,
        title: "WBPSC Civil Service (Executive) Examination 2026",
        department: "West Bengal Public Service Commission (WBPSC)",
        vacancies: 200, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "21-36 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹210, SC/ST/PwD: ₹50",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview/Personality Test",
        payScale: "WBCS (Exe): Level 16 — ₹47,600-₹1,51,100 (SDO, BDO, etc.)",
        applyUrl: "https://wbpsc.gov.in",
        status: "upcoming",
        announcedDate: new Date("2026-02-01"),
        startDate: new Date("2026-02-15"),
        endDate: new Date("2026-03-15"),
        examDate: new Date("2026-06-01"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WBPSC Judicial Service Examination 2026",
        department: "West Bengal Public Service Commission (WBPSC)",
        vacancies: 100, qualification: "LLB from a recognized university + enrolled advocate",
        ageLimit: "23-35 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹210, SC/ST: ₹50",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Viva Voce",
        payScale: "Level 17 — ₹51,600-₹1,63,100",
        applyUrl: "https://wbpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-07-15"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WBPSC Clerkship Examination 2026",
        department: "West Bengal Public Service Commission (WBPSC)",
        vacancies: 3000, qualification: "Bachelor's degree + Computer literacy",
        ageLimit: "18-32 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹210, SC/ST/PwD: ₹50",
        selectionProcess: "Prelims (MCQ) → Mains (Written + Typing) → DV",
        payScale: "Level 8 — ₹22,700-₹58,500",
        applyUrl: "https://wbpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-20"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WBPSC Miscellaneous Service Recruitment Exam (MSRE) 2026",
        department: "West Bengal Public Service Commission (WBPSC)",
        vacancies: 500, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "21-36 yrs (Gen); relaxation for reserved",
        applicationFee: "Gen: ₹210, SC/ST/PwD: ₹50",
        selectionProcess: "Prelims → Mains → Interview",
        payScale: "Level 13-15 — ₹36,100-₹44,900",
        applyUrl: "https://wbpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-09-15"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WB TET (Teacher Eligibility Test) 2026 — Primary & Upper Primary",
        department: "West Bengal Board of Primary Education (WBBPE)",
        vacancies: 11000, qualification: "D.El.Ed/B.Ed from NCTE-recognized institute",
        ageLimit: "18-40 yrs (varies; relaxation for reserved)",
        applicationFee: "Gen: ₹200, SC/ST: ₹100",
        selectionProcess: "TET Exam (Primary: Paper I; Upper Primary: Paper II) → Merit List → Counselling",
        payScale: "Primary: ₹27,000; Upper Primary: ₹30,000 (approx. starting)",
        applyUrl: "https://wbbpe.org",
        status: "upcoming",
        examDate: new Date("2026-06-15"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WB Police Constable Recruitment 2026",
        department: "West Bengal Police Recruitment Board (WBPRB)",
        vacancies: 8632, qualification: "Class 10 passed (Madhyamik)",
        ageLimit: "18-27 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹200, SC/ST: Nil",
        selectionProcess: "Prelims (Written) → Physical Measurement Test → Physical Efficiency Test → Final Written → Interview → Medical",
        payScale: "₹22,700-₹58,500",
        applyUrl: "https://wbpolice.gov.in",
        status: "upcoming",
        examDate: new Date("2026-10-01"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "WB Police SI (Sub-Inspector) Recruitment 2026",
        department: "West Bengal Police Recruitment Board (WBPRB)",
        vacancies: 1000, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "20-27 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹200, SC/ST: Nil",
        selectionProcess: "Prelims → Physical Test → Mains → Interview → Medical",
        payScale: "Level 12 — ₹33,200-₹96,300",
        applyUrl: "https://wbpolice.gov.in",
        status: "upcoming",
        examDate: new Date("2026-11-15"),
      },
      {
        level: "state", stateId: westBengal.id,
        title: "KMC Recruitment 2026 — Various Posts",
        department: "Kolkata Municipal Corporation (KMC)",
        vacancies: 500, qualification: "Varies — Class 10 to Graduation",
        ageLimit: "18-40 yrs (varies by post)",
        applicationFee: "Gen: ₹200, SC/ST: ₹100",
        selectionProcess: "Written Test → Interview → DV",
        payScale: "₹18,000-₹44,900 (varies by post)",
        applyUrl: "https://kmcgov.in",
        status: "upcoming",
        examDate: new Date("2026-12-01"),
      },
  ]);
  console.log("  ✅ West Bengal exams seeded (8 exams — WBPSC, WB TET, WB Police, KMC)");
  }

  // ═══════════════════════════════════════════════════════════
  // TAMIL NADU STATE EXAMS
  // ═══════════════════════════════════════════════════════════
  if (skipTN) {
    console.log(`\n📌 Tamil Nadu exams: ⏭  already seeded (${existingTN} records)`);
  } else {
    console.log("\n📌 Seeding Tamil Nadu exams...");

  await createExams("STATE", tamilNadu.id, [
      {
        level: "state", stateId: tamilNadu.id,
        title: "TNPSC Group I Services Examination 2026",
        department: "Tamil Nadu Public Service Commission (TNPSC)",
        vacancies: 92, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "21-37 yrs (Gen); +5 SC/ST; +3 OBC; No limit for PwD",
        applicationFee: "₹200 (online); SC/ST/PwD/Destitute Widows: Nil",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Interview/Oral Test",
        payScale: "Deputy Collector: Level 22 — ₹56,100; DSP: Level 22; District Registrar: Level 22",
        applyUrl: "https://tnpsc.gov.in",
        status: "upcoming",
        announcedDate: new Date("2026-01-20"),
        startDate: new Date("2026-02-01"),
        endDate: new Date("2026-03-01"),
        examDate: new Date("2026-05-20"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TNPSC Group II & IIA Services Examination 2026",
        department: "Tamil Nadu Public Service Commission (TNPSC)",
        vacancies: 5529, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "18-37 yrs (Gen); relaxation for reserved categories",
        applicationFee: "₹150 (online); SC/ST/PwD/Destitute Widows: Nil",
        selectionProcess: "Prelims (MCQ) → Mains (Written) → Oral Test (Group II only)",
        payScale: "Group II: Level 17-20 (₹47,600-₹56,100); Group IIA: Level 14-16 (₹40,900-₹47,600)",
        applyUrl: "https://tnpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-06-15"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TNPSC Group IV (Combined Civil Services IV) 2026",
        department: "Tamil Nadu Public Service Commission (TNPSC)",
        vacancies: 9351, qualification: "Class 10 passed (SSLC) for VAO; Class 12 (HSC) for Typist/Junior Assistant",
        ageLimit: "18-37 yrs (Gen); relaxation for reserved",
        applicationFee: "₹100; SC/ST/PwD/Destitute Widows: Nil",
        selectionProcess: "Single Paper (MCQ — 200 questions, 3 hours) → DV → Certificate Verification",
        payScale: "VAO: Level 8 (₹19,500); Junior Assistant: Level 6; Typist: Level 6",
        applyUrl: "https://tnpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-07-20"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TNPSC Engineering Services (Combined Engineering) 2026",
        department: "Tamil Nadu Public Service Commission (TNPSC)",
        vacancies: 572, qualification: "B.E./B.Tech in relevant engineering discipline",
        ageLimit: "21-37 yrs (Gen); relaxation for reserved",
        applicationFee: "₹200; SC/ST/PwD: Nil",
        selectionProcess: "Written Exam (Objective + Descriptive) → Oral Test",
        payScale: "AE: Level 17 (₹47,600); JE: Level 14 (₹40,900)",
        applyUrl: "https://tnpsc.gov.in",
        status: "upcoming",
        examDate: new Date("2026-08-10"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TN TRB Direct Recruitment — PG Assistants / BT Assistants 2026",
        department: "Tamil Nadu Teachers Recruitment Board (TN TRB)",
        vacancies: 6000, qualification: "PG + B.Ed (PG Assistant); UG + B.Ed (BT Assistant)",
        ageLimit: "18-40 yrs (Gen); relaxation for reserved",
        applicationFee: "₹500 (Gen); SC/ST/PwD: ₹250",
        selectionProcess: "Written Exam (MCQ — 150 questions) → Certificate Verification → Counselling",
        payScale: "PG Asst: Level 17 (₹47,600); BT Asst: Level 14 (₹40,900)",
        applyUrl: "https://trb.tn.gov.in",
        status: "upcoming",
        examDate: new Date("2026-06-01"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TN TET (Tamil Nadu Teacher Eligibility Test) 2026",
        department: "Tamil Nadu Teachers Recruitment Board (TN TRB)",
        vacancies: 15000, qualification: "D.T.Ed/D.El.Ed (Paper I); B.Ed (Paper II)",
        ageLimit: "No upper age limit",
        applicationFee: "₹500 (Gen); SC/ST/PwD: ₹250",
        selectionProcess: "Paper I (Primary) / Paper II (Upper Primary) → Qualifying score 60% (Gen) / 55% (Reserved)",
        payScale: "Eligibility certificate — required for appointment as teacher",
        applyUrl: "https://trb.tn.gov.in",
        status: "upcoming",
        examDate: new Date("2026-05-01"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TN Police Constable (Grade II) Recruitment 2026",
        department: "Tamil Nadu Uniformed Services Recruitment Board (TNUSRB)",
        vacancies: 6244, qualification: "Class 10 passed (SSLC) + Higher Qualification preferred",
        ageLimit: "18-24 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹250, SC/ST/PwD: Nil",
        selectionProcess: "Written Exam (OMR) → Physical Test (Endurance/Measurement) → DV → Medical",
        payScale: "₹19,500-₹62,000",
        applyUrl: "https://tnusrb.tn.gov.in",
        status: "upcoming",
        examDate: new Date("2026-09-01"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TN Police SI (Sub-Inspector of Police) Recruitment 2026",
        department: "Tamil Nadu Uniformed Services Recruitment Board (TNUSRB)",
        vacancies: 969, qualification: "Bachelor's degree from a recognized university",
        ageLimit: "20-30 yrs (Gen); +5 SC/ST; +3 OBC",
        applicationFee: "Gen: ₹500, SC/ST/PwD: Nil",
        selectionProcess: "Written Exam → Physical Test → Viva Voce → DV → Medical",
        payScale: "₹36,900-₹1,16,600",
        applyUrl: "https://tnusrb.tn.gov.in",
        status: "upcoming",
        examDate: new Date("2026-10-15"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "GCC (Greater Chennai Corporation) Recruitment 2026",
        department: "Greater Chennai Corporation (GCC)",
        vacancies: 600, qualification: "Varies — Class 8 to Graduation",
        ageLimit: "18-30 yrs (varies by post)",
        applicationFee: "₹200 (Gen); SC/ST: ₹100",
        selectionProcess: "Written Test → Skill Test → DV",
        payScale: "₹15,700-₹47,600 (varies by post)",
        applyUrl: "https://chennaicorporation.gov.in",
        status: "upcoming",
        examDate: new Date("2026-11-01"),
      },
      {
        level: "state", stateId: tamilNadu.id,
        title: "TANGEDCO AE / JA Recruitment 2026",
        department: "Tamil Nadu Generation & Distribution Corporation (TANGEDCO)",
        vacancies: 2900, qualification: "B.E./B.Tech (AE); Diploma (JA)",
        ageLimit: "21-30 yrs (AE); 18-30 yrs (JA); relaxation for reserved",
        applicationFee: "₹500 (Gen); SC/ST: ₹250",
        selectionProcess: "Online CBT → DV → Certificate Verification",
        payScale: "AE: Level 17 (₹47,600); JA: Level 8 (₹19,500)",
        applyUrl: "https://tangedco.gov.in",
        status: "upcoming",
        examDate: new Date("2026-07-01"),
      },
  ]);
  console.log("  ✅ Tamil Nadu exams seeded (10 exams — TNPSC, TN TRB, TNUSRB, GCC, TANGEDCO)");
  }

  const total = await prisma.governmentExam.count();
  console.log(`\n✅ Government Exam seeding complete! Total: ${total} exams.`);
}

main()
  .catch((e) => { console.error("❌ Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
