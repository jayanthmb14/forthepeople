/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "12px 20px",
        background: "#FEF3C7",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        marginBottom: 24,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 16 }}>🏆</span>
      <span style={{ fontSize: 13, color: "#92400E" }}>
        {total && total > 0 ? (
          <>
            <strong>{total.toLocaleString("en-IN")}</strong> people already backing India&apos;s data revolution
          </>
        ) : total === 0 ? (
          <>Be the first to back India&apos;s data revolution</>
        ) : (
          <>Loading contributors…</>
        )}
      </span>
      <Link
        href="/en/contributors"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#2563EB",
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        View leaderboard →
      </Link>
    </div>
  );
}
