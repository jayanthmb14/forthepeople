/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */
import { describe, expect, it } from "vitest";
import { amountBasis, biggestBenefit } from "@/lib/schemes/amount-basis";

describe("amountBasis", () => {
  it("knows the unit of the listed schemes' amounts", () => {
    expect(amountBasis("PM-KISAN")).toBe("perYear");
    expect(amountBasis("Mukhyamantri Majhi Ladki Bahin Yojana")).toBe("perMonth");
    expect(amountBasis("Yuva Nidhi (Unemployment Allowance)")).toBe("perMonth");
    expect(amountBasis("Moovalur Ramamirtham Ammaiyar Higher Education Assurance Scheme")).toBe("perMonth");
    expect(amountBasis("Ayushman Bharat — PMJAY")).toBe("coverYear");
    expect(amountBasis("Mahatma Jyotirao Phule Jan Arogya Yojana")).toBe("coverYear");
    expect(amountBasis("Chief Minister's Comprehensive Health Insurance (CMCHIS)")).toBe("coverYear");
    expect(amountBasis("Pradhan Mantri Mudra Yojana (PMMY)")).toBe("loanUpTo");
    expect(amountBasis("PM Vishwakarma Yojana")).toBe("loanUpTo");
    expect(amountBasis("Atal Pension Yojana")).toBe("pensionMonth");
    expect(amountBasis("Kanyashree Prakalpa")).toBe("oneTime");
    expect(amountBasis("PMAY-Gramin (Rural Housing)")).toBe("oneTime");
    expect(amountBasis("Pradhan Mantri Ujjwala Yojana")).toBe("oneTime");
  });
  it("returns null for a scheme not on the reviewed list (its amount is then not shown)", () => {
    expect(amountBasis("Sikshashree")).toBeNull();
    expect(amountBasis("")).toBeNull();
    expect(amountBasis(null)).toBeNull();
  });
});

describe("biggestBenefit", () => {
  it("leaves loan ceilings and amounts with no known unit out (Mumbai: Mudra Rs 20 lakh beat the Rs 5 lakh cover)", () => {
    const best = biggestBenefit([
      { name: "Pradhan Mantri Mudra Yojana (PMMY)", amount: 2000000 },
      { name: "Mahatma Jyotirao Phule Jan Arogya Yojana", amount: 500000 },
      { name: "Atal Pension Yojana", amount: 5000 },
      { name: "Unknown Scheme", amount: 9000000 },
    ]);
    expect(best?.scheme.name).toBe("Mahatma Jyotirao Phule Jan Arogya Yojana");
    expect(best?.basis).toBe("coverYear");
    expect(biggestBenefit([{ name: "Pradhan Mantri Mudra Yojana (PMMY)", amount: 2000000 }])).toBeNull();
  });
});
