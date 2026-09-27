/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// Up to three supporter messages on /support. Renders nothing when no
// supporter has left a public message. Design v3: Cards + a tier Pill.
// The quotes themselves are user-written, shown exactly as submitted.

import { useState, useEffect } from "react";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";
import { Card, Pill, Section } from "@/components/district/ui";

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
    <Section title="What supporters say">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 12 }}>
        {quotes.map((q, i) => {
          const tierConf = TIER_CONFIG[q.tier];
          return (
            <Card key={i} as="article" padding={16} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <blockquote style={{ margin: 0, fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
                &ldquo;{q.message}&rdquo;
              </blockquote>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: "auto" }}>
                <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>— {q.name}</span>
                <Pill tone="support">{tierConf?.name ?? q.tier}</Pill>
              </div>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
