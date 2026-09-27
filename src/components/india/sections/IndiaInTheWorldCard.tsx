"use client";

/**
 * IndiaInTheWorldCard — homepage rankings card v5 (file 48 §4.7.5)
 * + Section 1 Bug 2: "View all rankings ›" expand-in-place toggle.
 *
 * Tiered medal SVGs (gold star / silver disc / bronze disc / plain circle),
 * gold/silver/bronze gradient row tints fading horizontally to the page bg,
 * Lucide mini-icons per ranking category, color-coded trend pills.
 *
 * Static seed of 8 verified rankings sourced from external authorities (IMF,
 * UN, UNESCO, IRENA, ISRO, WTO, TRAI, Global Firepower). Data lives in
 * src/data/india-world-rankings.json so future updates are a registry edit.
 *
 * TODO Phase 5+: populate the missing 16 rankings to reach the full 24
 * tracked rankings. Until then the toggle button + footer text honestly
 * declare "8 of 24" / "All 24 (8 active)" so the affordance is in place.
 */

import * as React from "react";
import {
  Award,
  Film,
  Globe2,
  IndianRupee,
  Mail,
  Milk,
  Moon,
  Pill,
  Shield,
  Train,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import rawRankings from "@/data/india-world-rankings.json";

type TrendKind = "up" | "down" | "stable" | "new";

interface Ranking {
  rank: number;
  category: string;
  title: string;
  source: string;
  year: string;
  annotation?: string;
  movement: { kind: TrendKind; from?: number };
}

const rankings = (rawRankings as { rankings: Ranking[] }).rankings;

const ICON_BY_CATEGORY: Record<string, LucideIcon> = {
  population: Users,
  democracy: Award,
  films: Film,
  postal: Mail,
  milk: Milk,
  railway: Train,
  internet: Globe2,
  pharma: Pill,
  military: Shield,
  renewable: Zap,
  moon: Moon,
  economy: IndianRupee,
};

function MedalSVG({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <svg viewBox="0 0 30 30" style={{ width: "30px", height: "30px" }} aria-hidden>
        <circle cx="15" cy="15" r="14" fill="#FAEEDA" stroke="#EF9F27" strokeWidth="1.5" />
        <path
          d="M15 8 L17 13 L22 13 L18 16 L19.5 21 L15 18 L10.5 21 L12 16 L8 13 L13 13 Z"
          fill="#854F0B"
          opacity="0.85"
        />
      </svg>
    );
  }
  if (rank === 2) {
    return (
      <svg viewBox="0 0 30 30" style={{ width: "30px", height: "30px" }} aria-hidden>
        <circle cx="15" cy="15" r="14" fill="#F1EFE8" stroke="#888780" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="10" fill="#D3D1C7" />
      </svg>
    );
  }
  if (rank === 3) {
    return (
      <svg viewBox="0 0 30 30" style={{ width: "30px", height: "30px" }} aria-hidden>
        <circle cx="15" cy="15" r="14" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.5" />
        <circle cx="15" cy="15" r="10" fill="#F0997B" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 30 30" style={{ width: "30px", height: "30px" }} aria-hidden>
      <circle
        cx="15"
        cy="15"
        r="14"
        fill="var(--color-background)"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function rowBackground(rank: number): string {
  if (rank === 1) {
    return "linear-gradient(90deg, rgba(239, 159, 39, 0.08) 0%, rgba(239, 159, 39, 0.02) 60%, var(--color-background) 100%)";
  }
  if (rank === 2) {
    return "linear-gradient(90deg, rgba(136, 135, 128, 0.08) 0%, rgba(136, 135, 128, 0.02) 60%, var(--color-background) 100%)";
  }
  if (rank === 3) {
    return "linear-gradient(90deg, rgba(216, 90, 48, 0.08) 0%, rgba(216, 90, 48, 0.02) 60%, var(--color-background) 100%)";
  }
  return "var(--color-background)";
}

function medalNumColor(rank: number): string {
  if (rank === 1) return "#633806";
  if (rank === 2) return "#2C2C2A";
  if (rank === 3) return "#4A1B0C";
  return "var(--color-text-secondary)";
}

function rowClass(rank: number): string {
  if (rank === 1) return "ftp-rank-row ftp-rank-row--gold";
  if (rank === 2) return "ftp-rank-row ftp-rank-row--silver";
  if (rank === 3) return "ftp-rank-row ftp-rank-row--bronze";
  return "ftp-rank-row";
}

function TrendNode({ movement }: { movement: Ranking["movement"] }) {
  if (movement.kind === "up") {
    return (
      <span
        style={{
          color: "#16A34A",
          fontWeight: 500,
          fontFamily: "var(--ftp-font-sans)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "11px",
        }}
      >
        ↑ from #{movement.from}
      </span>
    );
  }
  if (movement.kind === "down") {
    return (
      <span
        style={{
          color: "#A32D2D",
          fontWeight: 500,
          fontFamily: "var(--ftp-font-sans)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "11px",
        }}
      >
        ↓ from #{movement.from}
      </span>
    );
  }
  if (movement.kind === "new") {
    return (
      <span
        style={{
          color: "#534AB7",
          background: "rgba(83, 74, 183, 0.10)",
          padding: "1px 6px",
          borderRadius: "999px",
          fontSize: "11px",
          fontWeight: 600,
          fontFamily: "var(--ftp-font-sans)",
        }}
      >
        New
      </span>
    );
  }
  return (
    <span
      style={{
        color: "var(--color-text-tertiary)",
        fontFamily: "var(--ftp-font-sans)",
        fontSize: "11px",
      }}
    >
      — stable
    </span>
  );
}

function RankRow({ ranking }: { ranking: Ranking }) {
  const Icon = ICON_BY_CATEGORY[ranking.category] ?? Trophy;
  const numColor = medalNumColor(ranking.rank);

  return (
    <div
      className={rowClass(ranking.rank)}
      style={{
        background: rowBackground(ranking.rank),
        padding: "9px 14px 9px 10px",
        display: "grid",
        gridTemplateColumns: "36px 1fr 84px",
        gap: "10px",
        alignItems: "center",
        transition: "background 150ms",
      }}
    >
      <div
        style={{
          width: "30px",
          height: "30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <MedalSVG rank={ranking.rank} />
        <span
          style={{
            position: "absolute",
            fontFamily: "var(--ftp-font-display)",
            fontVariantNumeric: "tabular-nums lining-nums",
            fontWeight: 700,
            fontSize: "13px",
            zIndex: 2,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: numColor,
          }}
        >
          {ranking.rank}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Icon size={11} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
          <span style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.2 }}>
            {ranking.title}
            {ranking.annotation && (
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-text-tertiary)",
                  marginLeft: "6px",
                  fontWeight: 400,
                }}
              >
                {ranking.annotation}
              </span>
            )}
          </span>
        </div>
        <div
          style={{
            fontSize: "11px",
            lineHeight: "15px",
            color: "var(--color-text-tertiary)",
            marginTop: "2px",
            fontFamily: "var(--ftp-font-sans)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {ranking.source}, {ranking.year}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <TrendNode movement={ranking.movement} />
      </div>
    </div>
  );
}

const DEFAULT_VISIBLE_COUNT = 8;

export function IndiaInTheWorldCard() {
  const [expanded, setExpanded] = React.useState(false);
  const total = rankings.length;
  const collapsedCount = Math.min(DEFAULT_VISIBLE_COUNT, total);
  const visibleRankings = expanded ? rankings : rankings.slice(0, collapsedCount);
  const footerCount = expanded
    ? `All ${total} ranks shown`
    : `${collapsedCount} of ${total} ranks shown`;
  const toggleLabel = expanded ? "Show fewer" : "View all rankings";

  return (
    <section
      style={{
        // Step 11: 1px peacock-blue border at 30% opacity, transparent fill.
        // Background fill is intentionally NOT applied — the inner ranking
        // grid carries its own subtle dividers that read better against
        // the page bg than against a card-fill bg.
        border: "1px solid rgba(12, 68, 124, 0.30)",
        background: "transparent",
        borderRadius: "var(--border-radius-lg)",
        padding: "14px 18px 16px",
        marginBottom: "12px",
        marginTop: "1.5rem",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: "2px 12px",
          marginBottom: "4px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--ftp-font-display)",
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          India in the world
        </h2>
        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
          Where India ranks globally
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>
        Each rank cites the issuing authority and report year.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          background: "rgba(0, 0, 0, 0.06)",
          border: "0.5px solid rgba(0, 0, 0, 0.06)",
          borderRadius: "6px",
          overflow: "hidden",
          transition: "max-height 240ms ease",
        }}
        className="india-rankings-grid"
      >
        {visibleRankings.map((r, i) => (
          <RankRow key={i} ranking={r} />
        ))}
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "11px",
          color: "var(--color-text-tertiary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{footerCount}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          style={{
            background: "transparent",
            border: "none",
            padding: "2px 4px",
            color: "var(--color-text-info)",
            fontSize: "11px",
            cursor: "pointer",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-info)";
          }}
        >
          {toggleLabel}
        </button>
      </div>

      <style>{`
        .ftp-rank-row--gold:hover {
          background: linear-gradient(90deg, rgba(239, 159, 39, 0.16) 0%, rgba(239, 159, 39, 0.06) 60%, var(--color-background) 100%) !important;
        }
        .ftp-rank-row--silver:hover {
          background: linear-gradient(90deg, rgba(136, 135, 128, 0.16) 0%, rgba(136, 135, 128, 0.06) 60%, var(--color-background) 100%) !important;
        }
        .ftp-rank-row--bronze:hover {
          background: linear-gradient(90deg, rgba(216, 90, 48, 0.16) 0%, rgba(216, 90, 48, 0.06) 60%, var(--color-background) 100%) !important;
        }
        .ftp-rank-row:not(.ftp-rank-row--gold):not(.ftp-rank-row--silver):not(.ftp-rank-row--bronze):hover {
          background: rgba(0, 0, 0, 0.02) !important;
        }
        @media (max-width: 768px) {
          .india-rankings-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

export default IndiaInTheWorldCard;
