/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Exam rules (src/lib/dedupe/exam-rules.ts): government organisers only,
 * one row per exam per place, which copy wins.
 */
import { describe, expect, it } from "vitest";
import {
  classifyExamBody,
  correctPlacement,
  examPlacement,
  examsForDisplay,
  groupSameExams,
  isGovernmentExam,
  planExamMerge,
  storedExamScope,
  type ExamRow,
} from "@/lib/dedupe/exam-rules";

let seq = 0;
function exam(over: Partial<ExamRow>): ExamRow {
  seq++;
  return {
    id: `e${String(seq).padStart(3, "0")}`,
    level: "national",
    scope: "NATIONAL",
    stateId: null,
    districtId: null,
    title: "Exam",
    shortName: null,
    department: "Dept",
    organizingBody: null,
    category: null,
    status: "NOTIFICATION_OUT",
    vacancies: null,
    qualification: null,
    ageLimit: null,
    applicationFee: null,
    selectionProcess: null,
    payScale: null,
    applyUrl: null,
    notificationUrl: null,
    syllabusUrl: null,
    announcedDate: null,
    notificationDate: null,
    startDate: null,
    endDate: null,
    admitCardDate: null,
    examDate: null,
    resultDate: null,
    sourceUrls: null,
    lastVerifiedAt: null,
    needsVerification: false,
    updatedAt: new Date("2026-05-01"),
    ...over,
  };
}

describe("classifyExamBody — government organisers only (one rule)", () => {
  it("accepts commissions, agencies, boards, police and PSUs", () => {
    for (const body of ["UPSC", "Staff Selection Commission", "NTA", "IBPS", "Railway Recruitment Board", "KPSC",
      "Karnataka Examinations Authority", "CBSE", "Tamil Nadu Uniformed Services Recruitment Board", "DSSSB",
      "Brihanmumbai Municipal Corporation", "High Court of Karnataka", "West Bengal Joint Entrance Examinations Board",
      "SGPGIMS", "MPSC"]) {
      expect(isGovernmentExam({ organizingBody: body }), body).toBe(true);
    }
    expect(isGovernmentExam({ title: "TN Police Constable (Grade II) Recruitment 2026" })).toBe(true);
    expect(isGovernmentExam({ title: "Karnataka 2nd PUC Result 2026" })).toBe(true);
    expect(isGovernmentExam({ title: "CUET UG 2026", organizingBody: "Unknown" })).toBe(true);
    expect(isGovernmentExam({ title: "Common University Entrance Test 2026" })).toBe(true);
  });

  it("rejects private universities, consortiums, companies and college exams", () => {
    expect(classifyExamBody({ title: "Presidency University Admission Tests" })).toBe("non-government");
    expect(classifyExamBody({ title: "Presidential Admission Tests" })).toBe("non-government");
    expect(classifyExamBody({ title: "Presi admission tests" })).toBe("non-government");
    expect(classifyExamBody({ title: "COMEDK-UGET 2026", organizingBody: "COMEDK" })).toBe("non-government");
    expect(classifyExamBody({ title: "Calcutta University 5th Semester Result 2026" })).toBe("non-government");
    expect(classifyExamBody({ title: "Hiring drive", organizingBody: "Acme Solutions Pvt Ltd" })).toBe("non-government");
  });

  it("says unknown when nothing identifies the organiser (the sync then stores nothing)", () => {
    expect(classifyExamBody({ title: "Some Test 2026" })).toBe("unknown");
    expect(isGovernmentExam({ title: "Some Test 2026", organizingBody: "Unknown" })).toBe(false);
  });
});

describe("placement — one row per exam per place", () => {
  it("national: no state, no district; state: no district; district keeps both", () => {
    expect(examPlacement("NATIONAL", "s1", "d1")).toEqual({ level: "national", scope: "NATIONAL", stateId: null, districtId: null });
    expect(examPlacement("STATE", "s1", "d1")).toEqual({ level: "state", scope: "STATE", stateId: "s1", districtId: null });
    expect(examPlacement("DISTRICT", "s1", "d1")).toEqual({ level: "district", scope: "DISTRICT", stateId: "s1", districtId: "d1" });
  });

  it("reads old rows correctly (level decides; seed rows have scope NATIONAL by default)", () => {
    expect(storedExamScope({ level: "national", scope: "NATIONAL", stateId: "s1", districtId: "d1" })).toBe("NATIONAL");
    expect(storedExamScope({ level: "state", scope: "NATIONAL", stateId: "s1", districtId: null })).toBe("STATE");
    expect(storedExamScope({ level: "state", scope: "NATIONAL", stateId: "ka", districtId: "new-delhi" })).toBe("STATE");
    expect(correctPlacement({ level: "national", scope: "NATIONAL", stateId: "s1", districtId: "d1" }).misplaced).toBe(true);
    expect(correctPlacement({ level: "national", scope: "NATIONAL", stateId: null, districtId: null }).misplaced).toBe(false);
  });
});

describe("planExamMerge — NEET copies become one national row", () => {
  const neet2026 = ["d1", "d2", "d3"].map((d, i) =>
    exam({ title: "NEET 2026", shortName: "NEET 2026", organizingBody: "Unknown", status: "RESULT_PENDING", districtId: d, stateId: `s${i}`,
      sourceUrls: ["https://news/a"], updatedAt: new Date("2026-05-29"), lastVerifiedAt: new Date("2026-05-29") }));
  const neetUg = ["d1", "d2", "d3"].map((d, i) =>
    exam({ title: "NEET (UG) 2026", shortName: "NEET UG 2026", organizingBody: "NBE", department: "NBE", status: "EXAM_SCHEDULED",
      districtId: d, stateId: `s${i}`, sourceUrls: ["https://news/b"], examDate: new Date("2026-05-03"),
      updatedAt: new Date("2026-07-21"), lastVerifiedAt: new Date("2026-07-21") }));

  it("groups all six copies as one exam", () => {
    const groups = groupSameExams([...neet2026, ...neetUg]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(6);
  });

  it("keeps the best copy, moves it to the national placement, keeps the furthest status and fixes the body", () => {
    const plan = planExamMerge([...neet2026, ...neetUg]);
    expect(plan.removeIds).toHaveLength(5);
    expect(neetUg.map((r) => r.id)).toContain(plan.keepId);
    expect(plan.patch).toMatchObject({
      districtId: null,
      stateId: null,
      status: "RESULT_PENDING",
      organizingBody: "NTA",
      department: "National Testing Agency",
    });
    expect([...(plan.patch.sourceUrls as string[])].sort()).toEqual(["https://news/a", "https://news/b"]);
  });

  it("fills empty fields from the other copies but never overwrites", () => {
    const a = exam({ title: "SSC CGL 2026", organizingBody: "SSC", applyUrl: "https://ssc.gov.in", examDate: new Date("2026-09-01"), sourceUrls: ["u1"] });
    const b = exam({ title: "Combined Graduate Level Examination 2026", organizingBody: "SSC", vacancies: 14000, examDate: new Date("2026-09-02") });
    const plan = planExamMerge([a, b]);
    expect(plan.keepId).toBe(a.id);
    expect(plan.patch.vacancies).toBe(14000);
    expect(plan.patch.examDate).toBeUndefined();
    expect(plan.conflicts.join()).toMatch(/examDate/);
  });

  it("normalises a legacy status even for a single row", () => {
    const plan = planExamMerge([exam({ title: "WBPSC Clerkship 2026", level: "state", scope: "NATIONAL", stateId: "wb", status: "upcoming" })]);
    expect(plan.removeIds).toEqual([]);
    expect(plan.patch).toMatchObject({ status: "UNVERIFIED", scope: "STATE" });
  });

  it("never merges different years or different places", () => {
    const n26 = exam({ title: "NEET UG 2026" });
    const n27 = exam({ title: "NEET UG 2027" });
    expect(groupSameExams([n26, n27])).toHaveLength(2);
    const kaPgcet = exam({ title: "PGCET 2026", level: "state", scope: "STATE", stateId: "ka" });
    const tnPgcet = exam({ title: "PGCET 2026", level: "state", scope: "STATE", stateId: "tn" });
    expect(groupSameExams([kaPgcet, tnPgcet])).toHaveLength(2);
  });
});

describe("examsForDisplay — what a district page lists", () => {
  it("shows one row per exam and hides non-government exams", () => {
    const rows = [
      exam({ title: "NEET 2026", districtId: "d1", status: "RESULT_PENDING" }),
      exam({ title: "NEET (UG) 2026", shortName: "NEET UG 2026", districtId: "d2", status: "EXAM_SCHEDULED", organizingBody: "NBE" }),
      exam({ title: "Presidency University Admission Tests", level: "state", scope: "NATIONAL", stateId: "wb", districtId: "kol" }),
      exam({ title: "UPSC CSE 2026", organizingBody: "UPSC" }),
    ];
    const shown = examsForDisplay(rows);
    expect(shown.map((e) => e.title).sort()).toEqual(["NEET (UG) 2026", "UPSC CSE 2026"].sort());
    expect(shown.find((e) => e.title.startsWith("NEET"))?.status).toBe("RESULT_PENDING");
  });
});
