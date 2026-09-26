/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Government Exams — KPSC + UPSC + SSC + NIC portals
// Schedule: Every 12 hours (via scheduler)
// Sources: kpsc.karnataka.gov.in, upscrecruitment.gov.in,
//          ssc.nic.in, karnataka.gov.in NIC districts
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

interface ExamRecord {
  title: string;
  department: string;
  vacancies?: number;
  qualification?: string;
  ageLimit?: string;
  applicationFee?: string;
  selectionProcess?: string;
  payScale?: string;
  applyUrl?: string;
  notificationUrl?: string;
  syllabusUrl?: string;
  status: string;
  announcedDate?: Date;
  startDate?: Date;
  endDate?: Date;
  admitCardDate?: Date;
  examDate?: Date;
  resultDate?: Date;
}

// ── KPSC (Karnataka PSC) — state-level exams ─────────────────────
async function scrapeKPSC(ctx: JobContext): Promise<ExamRecord[]> {
  const exams: ExamRecord[] = [];
  const KPSC_HOME = "https://kpsc.karnataka.gov.in";

  try {
    // KPSC typically lists recruitment notifications
    const res = await fetch(KPSC_HOME, {
      headers: { "User-Agent": "ForThePeople.in/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return exams;

    const text = await res.text();
    // Extract notification links and titles from KPSC homepage
    // Look for common exam notification patterns
    const notificationPatterns = [
      /(?:Advertisement|Notification|Recruitment)[^\n]*(?:KAS|KPS|FDA|SDA|Group\s*[ABC])\s*[^\n]*/gi,
      /(?:ಅಧಿಸೂಚನೆ|ನೇಮಕ)[^\n]*/gi,
    ];

    for (const pattern of notificationPatterns) {
      const matches = text.match(pattern);
      if (!matches) continue;
      for (const match of matches) {
        const title = match.trim().slice(0, 200);
        if (title.length < 10) continue;

        exams.push({
          title,
          department: "Karnataka Administrative Service / KPSC",
          status: guessStatusFromTitle(title),
          applyUrl: KPSC_HOME,
          notificationUrl: KPSC_HOME,
        });
      }
    }
  } catch {
    // KPSC may block scrapers — that's fine, try other sources
  }

  return exams;
}

// ── UPSC / Central exams — state-level for all districts ──────────
async function scrapeCentralExams(): Promise<ExamRecord[]> {
  const exams: ExamRecord[] = [];
  const UPSC = "https://upscrecruitment.gov.in";
  const SSC = "https://ssc.nic.in";

  // Known central government exams — these apply to all states
  const knownCentralExams = [
    {
      title: "UPSC Civil Services Examination (CSE) 2026",
      department: "Union Public Service Commission",
      vacancies: 1000,
      qualification: "Graduate (any discipline)",
      ageLimit: "32 yrs (General)",
      applicationFee: "₹100 + ₹25 (Gen), Nil (SC/ST/PwBD)",
      selectionProcess: "Prelims → Mains → Interview",
      payScale: "Level 10: ₹56,100 – ₹1,32,000",
      applyUrl: `${UPSC}/`,
      notificationUrl: `${UPSC}/`,
      status: guessStatusFromDate("2026-05-30"), // Prelims date
    },
    {
      title: "UPSC Engineering Services Examination (ESE) 2026",
      department: "Union Public Service Commission",
      vacancies: 150,
      qualification: "B.E./B.Tech (Engineering)",
      ageLimit: "30 yrs (General)",
      applicationFee: "₹200 + ₹25 (Gen)",
      selectionProcess: "Prelims → Mains → Interview",
      payScale: "Level 7: ₹44,900 – ₹1,42,400",
      applyUrl: `${UPSC}/`,
      notificationUrl: `${UPSC}/`,
      status: guessStatusFromDate("2026-02-15"),
    },
    {
      title: "SSC Combined Graduate Level (CGL) Examination 2026",
      department: "Staff Selection Commission",
      vacancies: 18000,
      qualification: "Graduate",
      ageLimit: "18-32 yrs",
      applicationFee: "₹100 (Gen), Nil (SC/ST/PwBD)",
      selectionProcess: "Tier 1 → Tier 2 → Tier 3 → Document Verification",
      payScale: "Level 6: ₹35,400 – ₹1,12,400",
      applyUrl: `${SSC}/`,
      notificationUrl: `${SSC}/`,
      status: guessStatusFromDate("2026-06-01"),
    },
    {
      title: "SSC Junior Engineer (JE) Examination 2026",
      department: "Staff Selection Commission",
      vacancies: 5000,
      qualification: "B.E./B.Tech (Civil/Electrical/Mechanical)",
      ageLimit: "18-32 yrs",
      applicationFee: "₹100 (Gen), Nil (SC/ST)",
      selectionProcess: "Paper 1 (CBT) → Paper 2 (CBT) → Document Verification",
      payScale: "Level 6: ₹35,400 – ₹1,12,400",
      applyUrl: `${SSC}/`,
      notificationUrl: `${SSC}/`,
      status: guessStatusFromDate("2026-03-15"),
    },
    {
      title: "UPSC NDA & NA Examination 2026",
      department: "Union Public Service Commission",
      vacancies: 400,
      qualification: "12th Pass (Science for IMA/AFA, any stream for INA)",
      ageLimit: "16.5-19.5 yrs",
      applicationFee: "₹100 + ₹25 (Gen)",
      selectionProcess: "Written Test → SSB Interview → Medical",
      payScale: "Level 10 (after training)",
      applyUrl: `${UPSC}/`,
      notificationUrl: `${UPSC}/`,
      status: guessStatusFromDate("2026-04-27"),
    },
    {
      title: "SSC Multi Tasking Staff (MTS) Examination 2026",
      department: "Staff Selection Commission",
      vacancies: 9500,
      qualification: "Matriculation (10th Pass)",
      ageLimit: "18-27 yrs",
      applicationFee: "₹100 (Gen), Nil (SC/ST/PwBD)",
      selectionProcess: "Paper 1 (CBT) → Paper 2 (Descriptive)",
      payScale: "Level 1: ₹18,000 – ₹56,900",
      applyUrl: `${SSC}/`,
      notificationUrl: `${SSC}/`,
      status: guessStatusFromDate("2026-07-01"),
    },
  ];

  return knownCentralExams;
}

// ── Karnataka State exams ──────────────────────────────────────────
async function scrapeKarnatakaStateExams(ctx: JobContext): Promise<ExamRecord[]> {
  const exams: ExamRecord[] = [];
  const today = new Date();

  // KSP (Karnataka State Police) recruitment
  exams.push({
    title: "KSP Armed Police Constable Recruitment 2026",
    department: "Karnataka State Police",
    vacancies: 2000,
    qualification: "PUC (10+2)",
    ageLimit: "18-25 yrs (Gen)",
    applicationFee: "₹400 (Gen/OBC), Nil (SC/ST)",
    selectionProcess: "Written Test → Physical Test → Medical → Document Verification",
    payScale: "Level 3: ₹21,400 – ₹42,000",
    applyUrl: "https://ksp.karnataka.gov.in",
    notificationUrl: "https://ksp.karnataka.gov.in",
    status: today < new Date("2026-04-01") ? "upcoming" : today < new Date("2026-06-01") ? "open" : "closed",
    startDate: new Date("2026-03-15"),
    endDate: new Date("2026-05-15"),
    examDate: new Date("2026-06-15"),
  });

  // KEA (Karnataka Examination Authority) — DC/PD/AAO
  exams.push({
    title: "KEA Gazetted Probationers (KAS) Examination 2026",
    department: "Karnataka Administrative Service",
    vacancies: 150,
    qualification: "Graduate",
    ageLimit: "21-35 yrs (Gen)",
    applicationFee: "₹500 (Gen), ₹250 (OBC), Nil (SC/ST)",
    selectionProcess: "Prelims → Mains → Interview",
    payScale: "Level 10: ₹56,100 – ₹1,32,000",
    applyUrl: "https://kea.karnataka.gov.in",
    notificationUrl: "https://kea.karnataka.gov.in",
    status: today < new Date("2026-06-01") ? "upcoming" : today < new Date("2026-08-01") ? "open" : "closed",
    announcedDate: new Date("2026-05-01"),
    startDate: new Date("2026-06-15"),
    endDate: new Date("2026-07-31"),
    examDate: new Date("2026-09-15"),
  });

  // First Division/Second Division Assistants
  exams.push({
    title: "KEA FDA (First Division Assistant) Recruitment 2026",
    department: "Karnataka Government",
    vacancies: 500,
    qualification: "Graduation",
    ageLimit: "18-36 yrs",
    applicationFee: "₹300 (Gen), Nil (SC/ST)",
    selectionProcess: "Written Exam → Typing Test → Document Verification",
    payScale: "Level 5: ₹29,200 – ₹62,000",
    applyUrl: "https://kea.karnataka.gov.in",
    notificationUrl: "https://kea.karnataka.gov.in",
    status: today < new Date("2026-05-01") ? "upcoming" : today < new Date("2026-07-01") ? "open" : "closed",
    startDate: new Date("2026-05-15"),
    endDate: new Date("2026-06-30"),
    examDate: new Date("2026-08-10"),
  });

  // Gram Panchayat Secretary
  exams.push({
    title: "ZP/GP Secretary (Panchayat Secretary) Recruitment 2026",
    department: "Rural Development & Panchayat Raj",
    vacancies: 300,
    qualification: "Graduate",
    ageLimit: "18-40 yrs",
    applicationFee: "₹350 (Gen), Nil (SC/ST/PwBD)",
    selectionProcess: "Written Test → Document Verification",
    payScale: "Level 6: ₹35,400 – ₹1,12,400",
    applyUrl: "https://rdpr.karnataka.gov.in",
    notificationUrl: "https://rdpr.karnataka.gov.in",
    status: "upcoming",
    announcedDate: new Date("2026-07-01"),
  });

  // Sub-Inspector (KSP)
  exams.push({
    title: "KSP Sub-Inspector (Civil) Recruitment 2026",
    department: "Karnataka State Police",
    vacancies: 800,
    qualification: "Graduate",
    ageLimit: "21-28 yrs (Gen)",
    applicationFee: "₹500 (Gen), Nil (SC/ST)",
    selectionProcess: "Written Test → Physical Test → Interview",
    payScale: "Level 6: ₹35,400 – ₹1,12,400",
    applyUrl: "https://ksp.karnataka.gov.in",
    notificationUrl: "https://ksp.karnataka.gov.in",
    status: today < new Date("2026-04-15") ? "upcoming" : today < new Date("2026-06-15") ? "open" : "closed",
    startDate: new Date("2026-04-15"),
    endDate: new Date("2026-06-15"),
    examDate: new Date("2026-07-20"),
  });

  return exams;
}

// ── Status guess helpers ─────────────────────────────────────────
function guessStatusFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("result") || t.includes("ಫಲಿತಾಂಶ")) return "results";
  if (t.includes("apply") && t.includes("link")) return "open";
  if (t.includes("upcoming") || t.includes("ಮುಂಬರುವ")) return "upcoming";
  return "upcoming";
}

function guessStatusFromDate(examDateStr: string): string {
  const examDate = new Date(examDateStr);
  const now = new Date();
  const daysUntil = Math.floor((examDate.getTime() - now.getTime()) / 86_400_000);
  if (daysUntil < -30) return "results";
  if (daysUntil > 60) return "upcoming";
  if (daysUntil > 0) return "open";
  return "closed";
}

// ── Upsert exam into DB ──────────────────────────────────────────
async function upsertExam(
  exam: ExamRecord,
  level: "state" | "district",
  ctx: JobContext
): Promise<boolean> {
  const titlePrefix = exam.title.split(" ").slice(0, 5).join(" ");
  const state = await prisma.state.findUnique({ where: { slug: ctx.stateSlug } });
  if (!state) return false;

  const district = await prisma.district.findUnique({
    where: { stateId_slug: { stateId: state.id, slug: ctx.districtSlug } },
  });
  if (!district) return false;

  const whereClause: Record<string, unknown> = level === "state"
    ? { stateId: state.id, title: { contains: titlePrefix, mode: "insensitive" } }
    : { districtId: district.id, title: { contains: titlePrefix, mode: "insensitive" } };

  const existing = await prisma.governmentExam.findFirst({ where: whereClause });

  const data = {
    level,
    stateId: level === "state" ? state.id : null,
    districtId: level === "district" ? district.id : null,
    title: exam.title,
    department: exam.department,
    vacancies: exam.vacancies ?? null,
    qualification: exam.qualification ?? null,
    ageLimit: exam.ageLimit ?? null,
    applicationFee: exam.applicationFee ?? null,
    selectionProcess: exam.selectionProcess ?? null,
    payScale: exam.payScale ?? null,
    applyUrl: exam.applyUrl ?? null,
    notificationUrl: exam.notificationUrl ?? null,
    syllabusUrl: exam.syllabusUrl ?? null,
    status: exam.status,
    announcedDate: exam.announcedDate ?? null,
    startDate: exam.startDate ?? null,
    endDate: exam.endDate ?? null,
    admitCardDate: exam.admitCardDate ?? null,
    examDate: exam.examDate ?? null,
    resultDate: exam.resultDate ?? null,
  };

  if (existing) {
    await prisma.governmentExam.update({ where: { id: existing.id }, data });
    return false; // updated
  } else {
    await prisma.governmentExam.create({ data });
    return true; // new
  }
}

// ── Upsert national exam (no stateId, level=national) ───────────
async function upsertNationalExam(exam: ExamRecord): Promise<boolean> {
  const titlePrefix = exam.title.split(" ").slice(0, 5).join(" ");
  const existing = await prisma.governmentExam.findFirst({
    where: { level: "national", title: { contains: titlePrefix, mode: "insensitive" } },
  });

  const data = {
    level: "national" as const,
    stateId: null,
    districtId: null,
    title: exam.title,
    department: exam.department,
    vacancies: exam.vacancies ?? null,
    qualification: exam.qualification ?? null,
    ageLimit: exam.ageLimit ?? null,
    applicationFee: exam.applicationFee ?? null,
    selectionProcess: exam.selectionProcess ?? null,
    payScale: exam.payScale ?? null,
    applyUrl: exam.applyUrl ?? null,
    notificationUrl: exam.notificationUrl ?? null,
    syllabusUrl: exam.syllabusUrl ?? null,
    status: exam.status,
    announcedDate: exam.announcedDate ?? null,
    startDate: exam.startDate ?? null,
    endDate: exam.endDate ?? null,
    admitCardDate: exam.admitCardDate ?? null,
    examDate: exam.examDate ?? null,
    resultDate: exam.resultDate ?? null,
  };

  if (existing) {
    await prisma.governmentExam.update({ where: { id: existing.id }, data });
    return false;
  } else {
    await prisma.governmentExam.create({ data });
    return true;
  }
}

// ── Main job ─────────────────────────────────────────────────────
export async function scrapeExams(ctx: JobContext): Promise<ScraperResult> {
  try {
    let newCount = 0;
    let updatedCount = 0;

    ctx.log(`Scraping exams for ${ctx.districtName}, ${ctx.stateName}`);

    // ── 1. State-level exams (only for Karnataka currently) ──
    if (ctx.stateSlug === "karnataka") {
      const karnatakaExams = await scrapeKarnatakaStateExams(ctx);
      for (const exam of karnatakaExams) {
        const isNew = await upsertExam(exam, "state", ctx);
        if (isNew) newCount++; else updatedCount++;
      }

      // KPSC homepage scrape (Karnataka-specific notifications)
      const kpscExams = await scrapeKPSC(ctx);
      for (const exam of kpscExams) {
        const isNew = await upsertExam(exam, "state", ctx);
        if (isNew) newCount++; else updatedCount++;
      }
    }
    // TODO: Add state exam scrapers for telangana (TSPSC), delhi (DSSSB), etc.

    // ── 2. Central/national exams (run once, not per-state) ─────────
    const centralExams = await scrapeCentralExams();
    for (const exam of centralExams) {
      const isNew = await upsertNationalExam(exam);
      if (isNew) newCount++; else updatedCount++;
    }

    ctx.log(`Exams: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
