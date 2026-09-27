/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// Contributor count row on /support — "N people already backing …" with a
// link to the leaderboard. Design v4: a tinted Card in the page hue, an
// emoji chip, the number in the deep hue. While loading it says so (never
// a fake 0). Text: "page_support" messages.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/district/ui";

export default function ContributorCountBanner() {
  const t = useTranslations("page_support");
  const locale = useLocale();
  // Plain fetch — /support page is outside the QueryClientProvider tree.
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Same source and count as the contributor wall below and the home
    // page "Backed by N" line, so the page never shows two different totals.
    fetch("/api/payment/contributors?limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setTotal(typeof d?.count === "number" ? d.count : 0);
      })
      .catch(() => {
        if (!cancelled) setTotal(0);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card
      tinted
      padding={12}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}
    >
      <span aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, lineHeight: 1.45, color: "var(--ftp-text)" }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
          🙌
        </span>
        {total && total > 0 ? (
          <span>
            {t.rich("countSome", {
              n: total,
              num: (c) => <span className="ftp-num" style={{ color: "var(--hue-deep)", fontSize: 16 }}>{c}</span>,
            })}
          </span>
        ) : total === 0 ? (
          <span>{t("countNone")}</span>
        ) : (
          <span style={{ color: "var(--ftp-text-2)" }}>{t("countLoading")}</span>
        )}
      </span>
      <Link
        href={`/${locale}/contributors`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          minHeight: 44,
          padding: "0 4px",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--hue-deep)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        {t("viewLeaderboard")}
      </Link>
    </Card>
  );
}
