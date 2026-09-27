/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Factual-only red flag pill. Throws at runtime if statement contains banned adjectives.
//
// A kit Pill in the danger tone with a Lucide flag icon. Hover (title)
// shows the full factual statement and the rule it references. The flag
// name is translated (page_tenders.flag.<TYPE>); the factual statement is
// shown exactly as computed.

"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { Pill } from "@/components/district/ui";
import { assertFactualCopy } from "@/lib/tenders/format";

export default function RedFlagBadge({
  flagType,
  factualStatement,
  referenceRule,
}: {
  flagType: string;
  factualStatement: string;
  referenceRule?: string | null;
}) {
  const t = useTranslations("page_tenders");
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
        title={referenceRule ? t("flagHint", { statement: factualStatement, rule: referenceRule }) : factualStatement}
      >
        {t.has(`flag.${flagType}`) ? t(`flag.${flagType}`) : flagType}
      </Pill>
    </span>
  );
}
