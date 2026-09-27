/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Top-5 / Bottom-5 state leaderboard widget. Used by modules with
 * hasStateBreakdown=true. Each row links out to /[locale]/[stateSlug]
 * — even if the state is `coming_soon`, the route lands on the
 * existing locked-state preview.
 *
 * Phase 4 ships the wrapper. Real rows come from IndiaStateBreakdown
 * once scrapers populate it (Phase 5+).
 */

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import { formatIndianNumber } from "@/lib/india/india-formatters";
import AnimatedProgressBar from "./animations/AnimatedProgressBar";

export interface LeaderboardRow {
  stateSlug: string;
  stateName: string;
  value: number;
  unit?: string | null;
  rank?: number | null;
}

interface Props {
  locale: string;
  rows: LeaderboardRow[];
  /** Higher value = better when true (default), worse when false. */
  higherIsBetter?: boolean;
}

export default function IndiaStateLeaderboard({
  locale,
  rows,
  higherIsBetter = true,
}: Props) {
  const [view, setView] = useState<"top" | "bottom">("top");
  // All hooks must run before any early return (rules-of-hooks).
  const max = useMemo(() => Math.max(1, ...rows.map((r) => Math.abs(r.value))), [rows]);
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value,
  );

  const slice =
    view === "top" ? sorted.slice(0, 5) : sorted.slice(-5).reverse();

  return (
    <div
      style={{
        background: INDIA_DESIGN.bgCard,
        border: `1px solid ${INDIA_DESIGN.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: `1px solid ${INDIA_DESIGN.border}`,
          background: INDIA_DESIGN.bgMuted,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: INDIA_DESIGN.textMuted,
          }}
        >
          State leaderboard
        </span>
        <div style={{ display: "inline-flex", gap: 4 }}>
          {(["top", "bottom"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              style={{
                background: view === mode ? INDIA_DESIGN.accentBlue : "transparent",
                color: view === mode ? "#FFFFFF" : INDIA_DESIGN.textMuted,
                border: `1px solid ${view === mode ? INDIA_DESIGN.accentBlue : INDIA_DESIGN.border}`,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 10px",
                cursor: "pointer",
                minHeight: 24,
              }}
            >
              {mode === "top" ? "Top 5" : "Bottom 5"}
            </button>
          ))}
        </div>
      </div>

      <div>
        {slice.map((row, idx) => {
          const pct = max > 0 ? (Math.abs(row.value) / max) * 100 : 0;
          return (
          <Link
            key={row.stateSlug}
            href={`/${locale}/${row.stateSlug}`}
            style={{
              display: "block",
              padding: "10px 14px",
              borderBottom:
                idx === slice.length - 1
                  ? "none"
                  : `1px solid ${INDIA_DESIGN.border}`,
              textDecoration: "none",
              color: INDIA_DESIGN.textPrimary,
              minHeight: 56,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: INDIA_DESIGN.textMuted,
                  fontFamily: "var(--ftp-font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  width: 22,
                }}
              >
                #{row.rank ?? idx + 1}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
                {row.stateName}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "var(--ftp-font-sans)",
                  fontVariantNumeric: "tabular-nums",
                  color: INDIA_DESIGN.textPrimary,
                }}
              >
                {formatIndianNumber(row.value)}
                {row.unit ? (
                  <span
                    style={{
                      fontSize: 11,
                      color: INDIA_DESIGN.textMuted,
                      fontWeight: 500,
                      marginLeft: 3,
                    }}
                  >
                    {row.unit}
                  </span>
                ) : null}
              </span>
            </div>
            <AnimatedProgressBar
              pct={pct}
              color={INDIA_DESIGN.accentBlue}
              height={4}
            />
          </Link>
          );
        })}
      </div>
    </div>
  );
}
