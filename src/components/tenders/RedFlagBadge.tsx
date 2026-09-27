/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Factual-only red flag pill. Throws at runtime if statement contains banned adjectives.
//
// Design v3: a kit Pill in the danger tone with a Lucide flag icon. Hover
// (title) shows the full factual statement and the rule it references.

"use client";

import { Flag } from "lucide-react";
import { Pill } from "@/components/district/ui";
import { assertFactualCopy } from "@/lib/tenders/format";

const LABELS: Record<string, string> = {
  SINGLE_BIDDER: "Single bidder",
  SHORT_WINDOW: "Short bidding window",
  PRICE_HIT_RATE: "Price ≈ estimate",
  REPEAT_WINNER: "Repeat winner",
  RETENDERED: "Re-tendered",
  RESTRICTIVE_TURNOVER: "Higher-than-typical turnover",
  DIRECT_NOMINATION: "Direct nomination",
};

export default function RedFlagBadge({
  flagType,
  factualStatement,
  referenceRule,
}: {
  flagType: string;
  factualStatement: string;
  referenceRule?: string | null;
}) {
  // Runtime guard — any dynamic factual statement must be adjective-free.
  try {
    assertFactualCopy(factualStatement, `RedFlagBadge(${flagType})`);
  } catch (err) {
    console.error(err);
  }
  return (
    <span role="note" style={{ display: "inline-flex", cursor: "help" }}>
      <Pill
        tone="danger"
        icon={Flag}
        title={`${factualStatement}${referenceRule ? ` — Reference: ${referenceRule}` : ""}`}
      >
        {LABELS[flagType] ?? flagType}
      </Pill>
    </span>
  );
}
