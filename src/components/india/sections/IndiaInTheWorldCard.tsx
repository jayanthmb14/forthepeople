"use client";

/**
 * IndiaInTheWorldCard — homepage rankings card v5 (file 48 §4.7.5)
 * + Section 1 Bug 2: "View all rankings ›" expand-in-place toggle.
 *
 * Tiered medal SVGs (gold star / silver disc / bronze disc / plain circle),
 * gold/silver/bronze gradient row tints fading horizontally to the page bg,
 * Lucide mini-icons per ranking category, color-coded trend pills.
 *
 * Static seed of rankings, each naming the body that published it (IMF, UN,
 * UNESCO, IRENA, ISRO, ECI, DAHD, India Post, Global Firepower). Data lives
 * in src/data/india-world-rankings.json so future updates are a registry edit.
 * Sept 2026 audit: a rank is listed only when the body named actually
 * publishes it, and its note's figure names its own source when that
 * differs (renewables: IRENA's rank, CEA's GW). "Largest railway employer"
 * (14 lakh staff; 12.29 lakh per the IR Year Book 2024-25, and China's
 * railway is larger) and "Internet users #2, up from #3 (TRAI)" (TRAI
 * ranks no countries) were removed.
 *
 * TODO Phase 5+: populate the missing 16 rankings to reach the full 24
 * tracked rankings. Until then the toggle button + footer text honestly
 * declare "8 of 24" / "All 24 (8 active)" so the affordance is in place.
 *
 * v4.1: every row is a button (44 px+) that opens a DetailSheet with the
 * rank, what it counts, the change since the last ranking, who published
 * it and the year. Sizes are at least 12 px.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { CategoryGlyph } from "@/components/graphics";
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
import { INDIA_NS } from "../i18n";

type Tr = ReturnType<typeof useTranslations>;

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

function TrendNode({ movement, t }: { movement: Ranking["movement"]; t: Tr }) {
  if (movement.kind === "up") {
    return (
      <span
        style={{
          color: "#16A34A",
          fontWeight: 500,
          fontFamily: "var(--ftp-font-sans)",
          fontVariantNumeric: "tabular-nums",
          fontSize: "12px",
        }}
      >
        {t("up", { from: movement.from ?? 0 })}
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
          fontSize: "12px",
        }}
      >
        {t("down", { from: movement.from ?? 0 })}
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
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "var(--ftp-font-sans)",
        }}
      >
        {t("new")}
      </span>
    );
  }
  return (
    <span
      style={{
        color: "var(--color-text-tertiary)",
        fontFamily: "var(--ftp-font-sans)",
        fontSize: "12px",
      }}
    >
      {t("stable")}
    </span>
  );
}

function rankTitle(ranking: Ranking, t: Tr): string {
  return t.has(`titles.${ranking.category}`) ? t(`titles.${ranking.category}`) : ranking.title;
}

function rankNote(ranking: Ranking, t: Tr): string | null {
  if (!ranking.annotation) return null;
  return t.has(`notes.${ranking.category}`) ? t(`notes.${ranking.category}`) : ranking.annotation;
}

function moveText(movement: Ranking["movement"], t: Tr): string {
  if (movement.kind === "up") return t("up", { from: movement.from ?? 0 });
  if (movement.kind === "down") return t("down", { from: movement.from ?? 0 });
  if (movement.kind === "new") return t("new");
  return t("stable");
}

const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];

function RankRow({ ranking, t, onOpen }: { ranking: Ranking; t: Tr; onOpen: () => void }) {
  const Icon = ICON_BY_CATEGORY[ranking.category] ?? Trophy;
  const title = rankTitle(ranking, t);
  const note = rankNote(ranking, t);
  const numColor = medalNumColor(ranking.rank);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={rowClass(ranking.rank)}
      aria-label={t("open", { title })}
      style={{
        background: rowBackground(ranking.rank),
        padding: "10px 14px 10px 10px",
        display: "grid",
        gridTemplateColumns: "36px minmax(0, 1fr) auto",
        gap: "10px",
        alignItems: "center",
        transition: "background 150ms",
        width: "100%",
        minHeight: 56,
        border: 0,
        textAlign: "start",
        font: "inherit",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <span
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
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon size={13} aria-hidden style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
          <span style={{ fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
            <span className="sr-only">{t("rankSr", { rank: ranking.rank })} </span>
            {title}
            {note && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-secondary)",
                  marginInlineStart: "6px",
                  fontWeight: 400,
                }}
              >
                {note}
              </span>
            )}
          </span>
        </span>
        <span
          style={{
            display: "block",
            fontSize: "12px",
            lineHeight: "16px",
            color: "var(--color-text-secondary)",
            marginTop: "2px",
            fontFamily: "var(--ftp-font-sans)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {t("source", { source: ranking.source, year: ranking.year })}
        </span>
      </span>
      <span style={{ textAlign: "end" }}>
        <TrendNode movement={ranking.movement} t={t} />
      </span>
    </button>
  );
}

const DEFAULT_VISIBLE_COUNT = 8;

export function IndiaInTheWorldCard() {
  const t = useTranslations(`${INDIA_NS}.world`);
  const [expanded, setExpanded] = React.useState(false);
  const total = rankings.length;
  const collapsedCount = Math.min(DEFAULT_VISIBLE_COUNT, total);
  const visibleRankings = expanded ? rankings : rankings.slice(0, collapsedCount);
  const footerCount = expanded ? t("allShown", { total }) : t("someShown", { shown: collapsedCount, total });
  const toggleLabel = expanded ? t("showFewer") : t("viewAll");
  const [open, setOpen] = React.useState<Ranking | null>(null);
  const close = React.useCallback(() => setOpen(null), []);

  return (
    <section
      id="india-in-the-world"
      aria-labelledby="india-in-the-world-title"
      style={{
        // Land below the sticky header, breadcrumb and strip when linked to.
        scrollMarginTop: "140px",
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
          id="india-in-the-world-title"
          style={{
            fontFamily: "var(--ftp-font-display)",
            fontSize: "24px",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CategoryGlyph glyph="globe" size={32} chip />
          {t("title")}
        </h2>
        <span style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>{t("subtitle")}</span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 12px" }}>{t("note")}</p>

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
        {visibleRankings.map((r) => (
          <RankRow key={`${r.category}-${r.rank}`} ranking={r} t={t} onOpen={() => setOpen(r)} />
        ))}
      </div>

      <div
        style={{
          marginTop: "12px",
          fontSize: "12px",
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
            padding: "0 8px",
            minHeight: 44,
            color: "var(--color-text-info)",
            fontSize: "12px",
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

      <DetailSheet
        open={open !== null}
        onClose={close}
        title={open ? rankTitle(open, t) : ""}
        subtitle={open ? t("sheet.sub", { rank: open.rank }) : undefined}
        emoji={open ? MEDAL_EMOJI[open.rank - 1] ?? "🌏" : undefined}
        hueClassName="ftp-hue-amber"
      >
        {open ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                padding: "14px 16px",
                borderRadius: 14,
                background: "var(--hue-tint)",
              }}
            >
              <span className="ftp-bignum" style={{ fontSize: 40, lineHeight: 1, color: "var(--hue-deep)" }}>
                #{open.rank}
              </span>
              <span style={{ fontSize: 15, color: "var(--ftp-text-2)" }}>{t("sheet.inWorld")}</span>
            </div>
            <DetailList
              rows={[
                { emoji: "🔢", label: t("sheet.figure"), value: rankNote(open, t) },
                { emoji: open.movement.kind === "down" ? "📉" : "📈", label: t("sheet.change"), value: moveText(open.movement, t) },
                { emoji: "🏛️", label: t("sheet.source"), value: open.source },
                { emoji: "📅", label: t("sheet.year"), value: open.year },
              ]}
            />
            <p style={{ margin: 0, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("sheet.note")}</p>
          </>
        ) : null}
      </DetailSheet>

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
