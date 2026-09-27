/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — data transparency notice at the top of the page.
 * A plain Card; the only colour is the warn-coloured icon. It is the one
 * notice at the top of the page (the old second "ModuleDisclaimer" said the
 * same thing and was removed).
 */

"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/district/ui";

export default function DisclaimerBanner() {
  const t = useTranslations("page_infrastructure");
  return (
    <div role="note" style={{ marginBottom: 20 }}>
      <Card padding={14}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <Info size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
            {t.rich("notice", { b: (c) => <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{c}</span> })}
          </p>
        </div>
      </Card>
    </div>
  );
}
