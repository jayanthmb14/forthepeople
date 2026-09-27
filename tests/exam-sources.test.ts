/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Official exam parsers + the status rule (src/scraper/lib/exam-sources.ts).
// The HTML below keeps the structure of upsc.gov.in pages (27 Sep 2026);
// the SSC JSON keeps the shape of ssc.gov.in/api/admin/5.1/liveExams.
import { describe, expect, it } from "vitest";
import {
  isCurrentExamTitle,
  officialExamStatus,
  parseOfficialDate,
  parseSscLiveExams,
  parseUpscActiveList,
  parseUpscExamPage,
  type OfficialExam,
} from "@/scraper/lib/exam-sources";

const LIST_HTML = `
<div class="view-content">
  <div class="views-row"><div class="views-field views-field-field-exam-name"><div class="field-content">
    <a href="/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027"><ul class="arrows"><li>Engineering Services (Preliminary) Examination, 2027</li></ul></a>
  </div></div></div>
  <div class="views-row"><div class="views-field views-field-field-exam-name"><div class="field-content">
    <a href="/examinations/Central%20Armed%20Police%20Forces%20%28ACs%29%20Examination%2C%202024"><ul class="arrows"><li>Central Armed Police Forces (ACs) Examination, 2024</li></ul></a>
  </div></div></div>
  <div class="views-row"><div class="views-field views-field-field-exam-name"><div class="field-content">
    <a href="https://example.com/elsewhere">Not an exam link</a>
  </div></div></div>
</div>`;

const NOTIFICATION_PAGE = `
<h1 class="heading1">Engineering Services (Preliminary) Examination, 2027</h1>
<table class="views-table cols-6">
  <thead><tr>
    <th>Date of Notification</th>
    <th><span class="date-display-single" content="2026-09-16T00:00:00+05:30">16/09/2026</span></th>
  </tr></thead>
  <tbody>
    <tr><th><strong>Date of Commencement of Examination</strong></th>
        <td><span class="date-display-single" content="2027-01-31T00:00:00+05:30">31/01/2027</span></td></tr>
    <tr><th><strong>Duration of Examination</strong></th><td>One Day</td></tr>
    <tr><th><strong>Last Date for Receipt of Applications</strong></th>
        <td><span class="date-display-single" content="2026-10-06T18:00:00+05:30">06/10/2026 - 6:00pm</span></td></tr>
    <tr><th>Download Notification</th>
        <td><ul class="arrows"><li>Notice<a href="https://www.upsc.gov.in/sites/default/files/Notif-ESEP-2027-Engl-160926.pdf">(1.54 MB)</a></li></ul></td></tr>
  </tbody>
</table>`;

const DOCUMENTS_PAGE = `
<h1 class="heading1">Civil Services (Main) Examination, 2026</h1>
<table class="views-table cols-3 table"><tbody>
  <tr><td class="views-field views-field-field-exam-doc-type">Important Notice</td>
      <td><a href="https://www.upsc.gov.in/sites/default/files/WindowCAF-CSM-26.pdf">x</a></td>
      <td><span class="date-display-single" content="2026-06-19T00:00:00+05:30">19/06/2026</span></td></tr>
  <tr><td class="views-field views-field-field-exam-doc-type">e - Admit Card</td><td></td>
      <td><span class="date-display-single" content="2026-08-14T00:00:00+05:30">14/08/2026</span></td></tr>
  <tr><td class="views-field views-field-field-exam-doc-type">Question Paper</td>
      <td><a href="https://www.upsc.gov.in/sites/default/files/QP-CSM-26.pdf">x</a></td>
      <td><span class="date-display-single" content="2026-09-01T00:00:00+05:30">01/09/2026</span></td></tr>
</tbody></table>`;

const NOW = Date.parse("2026-09-27T12:00:00+05:30");

describe("parseUpscActiveList", () => {
  it("returns absolute official links for exam entries only", () => {
    const list = parseUpscActiveList(LIST_HTML);
    expect(list).toHaveLength(2);
    expect(list[0]).toEqual({
      title: "Engineering Services (Preliminary) Examination, 2027",
      url: "https://www.upsc.gov.in/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027",
    });
  });

  it("drops exams whose newest year is older than last year", () => {
    const now = new Date(NOW);
    expect(isCurrentExamTitle("Engineering Services (Preliminary) Examination, 2027", now)).toBe(true);
    expect(isCurrentExamTitle("Combined Defence Services Examination (II), 2025", now)).toBe(true);
    expect(isCurrentExamTitle("Central Armed Police Forces (ACs) Examination, 2024", now)).toBe(false);
  });
});

describe("parseUpscExamPage", () => {
  it("reads the notification-stage dates and the notice PDF", () => {
    const e = parseUpscExamPage(NOTIFICATION_PAGE, "https://www.upsc.gov.in/examinations/x", "fallback");
    expect(e.title).toBe("Engineering Services (Preliminary) Examination, 2027");
    expect(e.shortName).toBe("UPSC Engineering Services (Preliminary) Examination, 2027");
    expect(e.notificationDate?.toISOString()).toBe("2026-09-15T18:30:00.000Z");
    expect(e.endDate?.toISOString()).toBe("2026-10-06T12:30:00.000Z");
    expect(e.examDate?.toISOString()).toBe("2027-01-30T18:30:00.000Z");
    expect(e.notificationUrl).toBe("https://www.upsc.gov.in/sites/default/files/Notif-ESEP-2027-Engl-160926.pdf");
    expect(officialExamStatus(e, NOW)).toBe("APPLICATIONS_OPEN");
  });

  it("reads what a later-stage page has published", () => {
    const e = parseUpscExamPage(DOCUMENTS_PAGE, "https://www.upsc.gov.in/examinations/y", "fallback");
    expect(e.admitCardDate?.toISOString()).toBe("2026-08-13T18:30:00.000Z");
    expect(e.examHeld).toBe(true);
    // An "Important Notice" is not the exam notification.
    expect(e.notificationUrl).toBeNull();
    expect(officialExamStatus(e, NOW)).toBe("RESULT_PENDING");
  });
});

describe("parseSscLiveExams", () => {
  const json = {
    statusCode: "200",
    data: [
      {
        examName: "Combined Higher Secondary Level (10+2) Examination 2026",
        applicationStartDate: "2026-09-07",
        applicationEndDate: "2026-10-07T17:30:00.000Z",
        examDate: null,
        fee: "100",
        minAge: 18,
        maxAge: 27,
        isActive: true,
        attachments: [],
        examNames: { examName: "Combined Higher Secondary Level (10+2) Examination,2026" },
      },
      { examName: "Old exam", isActive: false },
      { examName: "", isActive: true },
    ],
  };

  it("keeps active exams with SSC's own dates, fee and ages", () => {
    const [e, ...rest] = parseSscLiveExams(json);
    expect(rest).toHaveLength(0);
    expect(e.title).toBe("Combined Higher Secondary Level (10+2) Examination,2026");
    expect(e.startDate?.toISOString()).toBe("2026-09-06T18:30:00.000Z"); // IST midnight
    expect(e.endDate?.toISOString()).toBe("2026-10-07T17:30:00.000Z");
    expect(e.ageLimit).toBe("18–27 years");
    expect(e.applicationFee).toBe("₹100");
    expect(e.pageUrl).toBe("https://ssc.gov.in");
    expect(officialExamStatus(e, NOW)).toBe("APPLICATIONS_OPEN");
  });

  it("returns [] for an unexpected reply", () => {
    expect(parseSscLiveExams({ statusCode: "203", error: "Query params are missing" })).toEqual([]);
    expect(parseSscLiveExams(null)).toEqual([]);
  });
});

describe("officialExamStatus", () => {
  const base: OfficialExam = {
    body: "UPSC",
    department: "Union Public Service Commission",
    title: "T",
    shortName: "UPSC T",
    pageUrl: "https://www.upsc.gov.in/examinations/t",
    notificationUrl: null,
    notificationDate: null,
    startDate: null,
    endDate: null,
    examDate: null,
    admitCardDate: null,
    resultDate: null,
    examHeld: false,
    resultOut: false,
    ageLimit: null,
    applicationFee: null,
  };
  const d = (s: string) => new Date(s);

  it("never says open without both an opening and a closing date", () => {
    expect(officialExamStatus({ ...base, endDate: d("2026-10-06T18:00:00+05:30") }, NOW)).toBeNull();
    expect(officialExamStatus({ ...base, startDate: d("2026-09-01T00:00:00+05:30") }, NOW)).toBe("NOTIFICATION_OUT");
    expect(
      officialExamStatus({ ...base, startDate: d("2026-09-01T00:00:00+05:30"), endDate: d("2026-10-06T18:00:00+05:30") }, NOW),
    ).toBe("APPLICATIONS_OPEN");
  });

  it("moves on once the closing date or the exam date has passed", () => {
    const closed = { ...base, notificationDate: d("2026-08-01T00:00:00+05:30"), endDate: d("2026-08-20T18:00:00+05:30") };
    expect(officialExamStatus(closed, NOW)).toBe("APPLICATIONS_CLOSED");
    expect(officialExamStatus({ ...closed, examDate: d("2026-11-01T00:00:00+05:30") }, NOW)).toBe("EXAM_SCHEDULED");
    expect(officialExamStatus({ ...closed, examDate: d("2026-09-20T00:00:00+05:30") }, NOW)).toBe("RESULT_PENDING");
    expect(officialExamStatus({ ...closed, resultOut: true }, NOW)).toBe("RESULT_OUT");
  });

  it("returns null when the source published nothing to go on", () => {
    expect(officialExamStatus(base, NOW)).toBeNull();
  });
});

describe("parseOfficialDate", () => {
  it("reads ISO timestamps and date-only values as IST", () => {
    expect(parseOfficialDate("2026-09-10")?.toISOString()).toBe("2026-09-09T18:30:00.000Z");
    expect(parseOfficialDate("2026-10-06T18:00:00+05:30")?.toISOString()).toBe("2026-10-06T12:30:00.000Z");
    expect(parseOfficialDate("")).toBeNull();
    expect(parseOfficialDate(null)).toBeNull();
    expect(parseOfficialDate("not a date")).toBeNull();
  });
});
