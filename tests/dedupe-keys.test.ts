/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Canonical keys (src/lib/dedupe/keys.ts): when two rows are the same thing.
 */
import { describe, expect, it } from "vitest";
import {
  canonicalElectionType,
  canonicalExamStatus,
  canonicalName,
  constituencyKey,
  electionResultKey,
  examKey,
  examKeys,
  examStatusRank,
  foldText,
  nameKey,
  pinCode,
  sameExam,
  similarity,
  urlKey,
} from "@/lib/dedupe/keys";

describe("foldText", () => {
  it("strips punctuation, diacritics and case; & becomes and", () => {
    expect(foldText("Sewri–Nhava Sheva, Mumbai")).toBe("sewri nhava sheva mumbai");
    expect(foldText("Café  Coffee & Day")).toBe("cafe coffee and day");
    expect(foldText(null)).toBe("");
  });

  it("turns roman numerals into digits only where they are numbers", () => {
    expect(foldText("Metro Phase II")).toBe("metro phase 2");
    expect(foldText("Metro Phase-IIA")).toBe("metro phase 2a");
    expect(foldText("NDA & NA Examination (II), 2026")).toBe("nda and na examination 2 2026");
    expect(foldText("TNPSC Group II & IIA")).toBe("tnpsc group 2 and 2a");
    expect(foldText("CBSE Class X")).toBe("cbse class 10");
    // "via" and "vi" as ordinary words are left alone
    expect(foldText("Road via Hosur")).toBe("road via hosur");
  });

  it("turns ordinals into digits", () => {
    expect(foldText("2nd PUC")).toBe("2 puc");
    expect(foldText("Second PUC")).toBe("2 puc");
    expect(foldText("21st Ward")).toBe("21 ward");
  });
});

describe("canonicalName / nameKey", () => {
  it("Phase II = Phase 2 = Namma Metro Phase-2", () => {
    expect(nameKey("Bengaluru Metro Phase II")).toBe(nameKey("Namma Metro Phase-2"));
    expect(nameKey("Bengaluru Metro Phase 2")).toBe(nameKey("Bangalore Metro Phase II Project"));
  });

  it("Atal Setu = Sewri–Nhava Sheva = MTHL = Mumbai Trans Harbour Link", () => {
    const k = nameKey("Mumbai Trans Harbour Link");
    expect(nameKey("Atal Setu")).toBe(k);
    expect(nameKey("Sewri–Nhava Sheva Trans Harbour Link")).toBe(k);
    expect(nameKey("Atal Bihari Vajpayee Sewri-Nhava Sheva Atal Setu")).toBe(k);
    expect(nameKey("MTHL (Atal Setu)")).toBe(k);
  });

  it("expands common abbreviations and old city names", () => {
    expect(nameKey("AIIMS Darbhanga")).toBe(nameKey("All India Institute of Medical Sciences, Darbhanga"));
    expect(nameKey("NH-275 widening")).toBe(nameKey("NH275 Widening Project"));
    expect(nameKey("Bangalore–Mysore Expressway")).toBe(nameKey("Bengaluru-Mysuru Expressway"));
    expect(nameKey("PMAY-G")).toBe(nameKey("Pradhan Mantri Awas Yojana Gramin"));
    expect(canonicalName("Govt. Hosp.")).toBe("government hospital");
  });

  it("keeps different phases and lines apart", () => {
    expect(nameKey("Metro Line 2A")).not.toBe(nameKey("Metro Line 3"));
    expect(nameKey("Metro Phase 1")).not.toBe(nameKey("Metro Phase 2"));
  });
});

describe("similarity", () => {
  it("is 1 for canonical twins and high for near twins", () => {
    expect(similarity("Atal Setu", "Mumbai Trans Harbour Link")).toBe(1);
    expect(similarity("Government High School, Yelahanka", "Govt High School Yelahanka")).toBe(1);
    expect(similarity("Kempegowda Bus Station Majestic", "Kempegowda Bus Stn Majestic")).toBeGreaterThanOrEqual(0.85);
  });

  it("caps names whose numbers differ below the review threshold", () => {
    expect(similarity("Metro Line 2A", "Metro Line 3")).toBeLessThan(0.85);
    expect(similarity("Bengaluru Metro Phase 2", "Bengaluru Metro Phase 2A")).toBeLessThan(0.85);
  });

  it("is low for unrelated names", () => {
    expect(similarity("Hebbal Flyover", "Peenya Police Station")).toBeLessThan(0.5);
    expect(similarity("", "x")).toBe(0);
  });
});

describe("examKey", () => {
  it("NEET 2026, NEET (UG) 2026 and NEET UG 2026 are one exam (NTA), NEET PG another", () => {
    const k = examKey({ title: "NEET 2026", shortName: "NEET 2026", organizingBody: "Unknown" });
    expect(k).toBe("nta:neet ug|2026");
    expect(examKey({ title: "NEET (UG) 2026", shortName: "NEET UG 2026", organizingBody: "NBE" })).toBe(k);
    expect(examKey({ title: "NEET UG 2026" })).toBe(k);
    expect(examKey({ title: "NEET PG 2026" })).toBe("nbems:neet pg|2026");
  });

  it("keeps the year: NEET UG 2026 is not NEET UG 2027", () => {
    expect(sameExam({ title: "NEET UG 2026" }, { title: "NEET UG 2027" })).toBe(false);
  });

  it("matches an official long name with its common short name", () => {
    expect(sameExam(
      { title: "Combined Higher Secondary Level (10+2) Examination,2026", organizingBody: "SSC" },
      { title: "SSC CHSL 2026" },
    )).toBe(true);
    expect(sameExam(
      { title: "Sub-Inspector in Delhi Police and Central Armed Police Forces Examination, 2026", organizingBody: "SSC" },
      { title: "SSC CPO 2026" },
    )).toBe(true);
    expect(sameExam(
      { title: "National Defence Academy and Naval Academy Examination (II), 2026", organizingBody: "Union Public Service Commission" },
      { title: "UPSC NDA & Naval Academy Examination 2026 (II)" },
    )).toBe(true);
    expect(sameExam({ title: "UPSC Civil Services Examination 2026" }, { title: "UPSC CSE 2026" })).toBe(true);
  });

  it("drops stage words (result, admit card, recruitment) but keeps what tells exams apart", () => {
    expect(sameExam({ title: "IBPS PO Recruitment 2026" }, { title: "IBPS PO (Probationary Officer) 2026 Result" })).toBe(true);
    expect(sameExam({ title: "IBPS PO 2026" }, { title: "SBI PO 2026" })).toBe(false);
    expect(sameExam({ title: "Karnataka 2nd PUC Result 2026" }, { title: "II PUC Karnataka 2026" })).toBe(true);
    expect(sameExam({ title: "Karnataka 2nd PUC Result 2026" }, { title: "Karnataka PUC 1 Results 2026" })).toBe(false);
  });

  it("answers to both its short name and its title", () => {
    expect(examKeys({ title: "West Bengal Joint Entrance Examination 2026", shortName: "WBJEE 2026" })).toHaveLength(2);
    expect(examKey({ title: "" })).toBeNull();
  });
});

describe("canonicalExamStatus", () => {
  it("passes canonical values through", () => {
    expect(canonicalExamStatus("RESULT_PENDING")).toBe("RESULT_PENDING");
    expect(canonicalExamStatus("UNVERIFIED")).toBe("UNVERIFIED");
    expect(canonicalExamStatus("applications open")).toBe("APPLICATIONS_OPEN");
  });

  it("maps every legacy word", () => {
    expect(canonicalExamStatus("open")).toBe("APPLICATIONS_OPEN");
    expect(canonicalExamStatus("closed")).toBe("APPLICATIONS_CLOSED");
    expect(canonicalExamStatus("results")).toBe("RESULT_OUT");
    expect(canonicalExamStatus("declared")).toBe("RESULT_OUT");
    expect(canonicalExamStatus("announced")).toBe("NOTIFICATION_OUT");
    expect(canonicalExamStatus("Admit card released")).toBe("ADMIT_CARD_OUT");
  });

  it("never claims a notification for 'upcoming' and reads bare 'published' from the title", () => {
    expect(canonicalExamStatus("upcoming")).toBe("UNVERIFIED");
    expect(canonicalExamStatus("Upcoming")).toBe("UNVERIFIED");
    expect(canonicalExamStatus("published", "Calcutta University BA Semester Exam Results 2026")).toBe("RESULT_OUT");
    expect(canonicalExamStatus("released", "Karnataka 2nd PUC Result 2026")).toBe("RESULT_OUT");
    expect(canonicalExamStatus("released")).toBe("UNVERIFIED");
  });

  it("sends anything unknown to UNVERIFIED", () => {
    expect(canonicalExamStatus("Panel Set Up")).toBe("UNVERIFIED");
    expect(canonicalExamStatus(null)).toBe("UNVERIFIED");
  });

  it("ranks the lifecycle for the never-downgrade rule", () => {
    expect(examStatusRank("results")).toBeGreaterThan(examStatusRank("APPLICATIONS_OPEN"));
    expect(examStatusRank("upcoming")).toBeLessThan(examStatusRank("NOTIFICATION_OUT"));
  });
});

describe("elections", () => {
  it("canonicalElectionType folds every spelling", () => {
    for (const s of ["LokSabha", "Lok Sabha", "LOK_SABHA", "LS", "Parliament"]) expect(canonicalElectionType(s)).toBe("LOK_SABHA");
    for (const s of ["Assembly", "ASSEMBLY", "State Assembly", "Vidhan Sabha"]) expect(canonicalElectionType(s)).toBe("ASSEMBLY");
    expect(canonicalElectionType("Legislative Council")).toBe("LEGISLATIVE_COUNCIL");
    expect(canonicalElectionType("Nagar Panchayat")).toBe("MUNICIPAL");
    expect(canonicalElectionType("Gram Panchayat")).toBe("PANCHAYAT");
    expect(canonicalElectionType("something else")).toBeNull();
  });

  it("the Bengaluru 2024 LokSabha / Lok Sabha pair shares one key", () => {
    const a = electionResultKey({ districtId: "d1", year: 2024, electionType: "LokSabha", constituency: "Bengaluru Central" });
    const b = electionResultKey({ districtId: "d1", year: 2024, electionType: "Lok Sabha", constituency: "Bangalore Central" });
    expect(a).not.toBeNull();
    expect(a).toBe(b);
    expect(constituencyKey("Shivajinagar (157)")).toBe(constituencyKey("Shivajinagar"));
  });
});

describe("urlKey / pinCode", () => {
  it("ignores www, tracking parameters, fragments and trailing slashes", () => {
    expect(urlKey("https://www.thehindu.com/news/x/?utm_source=a&id=3#top")).toBe(urlKey("http://thehindu.com/news/x?id=3"));
    expect(urlKey("https://a.in/x?id=1")).not.toBe(urlKey("https://a.in/x?id=2"));
  });

  it("finds a PIN code with or without the space", () => {
    expect(pinCode("Yelahanka New Town, Bengaluru - 560064")).toBe("560064");
    expect(pinCode("Yelahanka, 560 064")).toBe("560064");
    expect(pinCode("no pin")).toBeNull();
  });
});
