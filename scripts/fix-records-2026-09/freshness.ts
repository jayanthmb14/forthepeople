/**
 * Current official figures found while building the freshness report
 * (checked 27 Sep 2026). Only numbers read on an official page today.
 */
import type { Fix } from "./types";

export const FRESHNESS_FIXES: Fix[] = [
  {
    table: "Scheme", id: "cmnfm3gn4003q3rxncb8a0aon", op: "update",
    label: "Mumbai · Pradhan Mantri Mudra Yojana (PMMY) — maximum loan",
    set: { amount: 2000000 },
    was: { amount: 1000000 },
    why: "The Mudra ceiling is now ₹20 lakh (new 'Tarun Plus' category for borrowers who repaid a Tarun loan), not ₹10 lakh.",
    source: "https://www.mudra.org.in/",
    says: "PMMY gives loans up to 10 lakh (20 lakh for entrepreneurs who repaid a previous Tarun loan); 'Tarun Plus – Increase in the loan limit to ₹20 Lakh'.",
    checked: "2026-09-27",
  },
];
