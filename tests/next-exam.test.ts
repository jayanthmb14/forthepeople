/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The overview's "Next exam" line (src/lib/next-exam.ts).
import { describe, expect, it } from "vitest";
import { isExamDateTrusted, pickNextExam } from "@/lib/next-exam";

const NOW = Date.parse("2026-09-28T00:00:00Z");

describe("pickNextExam (Sept 2026 audit)", () => {
  it("never shows an unverified seed row as the next exam", () => {
    const talathi = {
      level: "state", title: "Maharashtra Talathi Recruitment 2026", status: "UNVERIFIED",
      examDate: "2026-10-14T18:30:00.000Z", needsVerification: true, sourceUrls: null,
    };
    expect(isExamDateTrusted(talathi)).toBe(false);
    expect(pickNextExam({ stateExams: [talathi], districtExams: [] }, NOW)).toBeNull();
  });

  it("shows the soonest checked state exam with a source", () => {
    const checked = {
      level: "state", title: "MPSC Group B 2026", status: "EXAM_SCHEDULED", examDate: "2026-11-02T00:00:00Z",
      needsVerification: false, sourceUrls: ["https://mpsc.gov.in/notice"],
    };
    const later = { ...checked, title: "Later exam", examDate: "2026-12-02T00:00:00Z" };
    const national = { ...checked, level: "national", title: "UPSC", examDate: "2026-10-01T00:00:00Z" };
    const pick = pickNextExam({ stateExams: [later, national, checked], districtExams: [] }, NOW);
    expect(pick?.exam.title).toBe("MPSC Group B 2026");
    expect(pick?.kind).toBe("exam");
  });

  it("a row without any source is not trusted even when not flagged", () => {
    expect(isExamDateTrusted({ title: "X", status: "EXAM_SCHEDULED", needsVerification: false, sourceUrls: [] })).toBe(false);
    expect(isExamDateTrusted({ title: "X", status: "EXAM_SCHEDULED", needsVerification: false, notificationUrl: "https://x.gov.in/n.pdf" })).toBe(true);
  });
});
