/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useEffect } from "react";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";

interface Contributor {
  name: string;
  tier: string;
  message: string | null;
}

export default function SupporterQuotes() {
  const [quotes, setQuotes] = useState<Contributor[]>([]);

  useEffect(() => {
    fetch("/api/data/contributors?type=all")
      .then((r) => r.json())
      .then((data) => {
        const all = [
          ...(data?.subscribers ?? []),
          ...(data?.oneTime ?? []),
        ].filter((c: Contributor) => c.message && c.name !== "Anonymous");
        setQuotes(all.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  if (quotes.length === 0) return null;

  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 16, letterSpacing: "-0.3px" }}>
        💬 What Supporters Say
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {quotes.map((q, i) => {
          const tierConf = TIER_CONFIG[q.tier];
          return (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E8E8E4",
                borderRadius: 12,
                padding: "16px 18px",
              }}
            >
              <div style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, fontStyle: "italic", marginBottom: 10 }}>
                &ldquo;{q.message}&rdquo;
              </div>
              <div style={{ fontSize: 12, color: "#9B9B9B" }}>
                — {q.name}, {tierConf?.emoji ?? "💝"} {tierConf?.name ?? q.tier}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
