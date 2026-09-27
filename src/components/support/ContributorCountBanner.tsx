/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// Contributor count row on /support — "N people already backing …" with a
// link to the leaderboard. Design v3: a plain Card, Lucide icon, mono number.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card } from "@/components/district/ui";

export default function ContributorCountBanner() {
  // Plain fetch — /support page is outside the QueryClientProvider tree.
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data/contributors?limit=1")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const subs = typeof d?.subscribersTotal === "number" ? d.subscribersTotal : 0;
        const oneTime = typeof d?.oneTimeTotal === "number" ? d.oneTimeTotal : 0;
        setTotal(subs + oneTime);
      })
      .catch(() => {
        if (!cancelled) setTotal(0);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <Card
      padding={12}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}
    >
      <span aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", paddingLeft: 4 }}>
        <Users size={16} aria-hidden style={{ color: "var(--ftp-support)", flexShrink: 0 }} />
        {total && total > 0 ? (
          <span>
            <span className="ftp-num">{total.toLocaleString("en-IN")}</span> people already backing India&apos;s data revolution
          </span>
        ) : total === 0 ? (
          <span>Be the first to back India&apos;s data revolution</span>
        ) : (
          <span style={{ color: "var(--ftp-text-2)" }}>Loading contributors…</span>
        )}
      </span>
      <Link
        href="/en/contributors"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          minHeight: 44,
          padding: "0 4px",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ftp-brand)",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        View leaderboard <ArrowRight size={14} aria-hidden />
      </Link>
    </Card>
  );
}
