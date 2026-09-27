/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  TapCard — "tap the card, see everything" (docs/LAYOUT.md, recipe step 5)
// ═══════════════════════════════════════════════════════════════════════
//  A card in the module hue whose whole surface opens a DetailSheet. The
//  title is a real heading holding a <button>; the button's ::after covers
//  the card (TapCard.module.css), so the full card is the touch target
//  (well over 44 px) and screen readers hear one clear button name.
//  Put no other links or buttons inside: every action lives in the sheet.
//
//   <TapCard
//     onOpen={() => setOpen(exam)}
//     leading={<span className="ftp-icon-chip ftp-emoji">📝</span>}
//     title={exam.title}
//     subtitle={exam.department}
//     badge={<StatusPill status={exam.status} />}
//     hint={t("details")}
//   >
//     <CountdownBar … />
//   </TapCard>
//
//  Shared by the "Know your district" pages (news, exams, famous people,
//  map, contributors). Text comes from the caller, so it is translated there.
//
//  density="compact" (v5.3, news stories): a smaller, regular-weight title
//  (15 px, 14 px on phones), less padding and no shadow — for long lists of
//  headlines that should read quietly. Everything else is unchanged.
"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import styles from "./TapCard.module.css";

export function TapCard({
  onOpen,
  title,
  titleLang,
  subtitle,
  leading,
  badge,
  hint,
  tinted,
  density,
  as = "article",
  headingLevel = 3,
  children,
  style,
}: {
  onOpen: () => void;
  title: React.ReactNode;
  /** lang of the title when it is not in the page language (e.g. an English headline). */
  titleLang?: string;
  subtitle?: React.ReactNode;
  /** Avatar, emoji chip or photo on the left of the title. */
  leading?: React.ReactNode;
  /** Status pill(s) on the right of the title. */
  badge?: React.ReactNode;
  /** Small "See details" line at the bottom, with a chevron. */
  hint?: React.ReactNode;
  tinted?: boolean;
  /** "compact": smaller regular-weight title, tighter padding, no shadow (news). */
  density?: "compact";
  as?: "article" | "li" | "div";
  headingLevel?: 2 | 3 | 4;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const Tag = as;
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <Tag className={`ftp-card-link ${styles.card}${tinted ? ` ${styles.tinted}` : ""}`} data-density={density} style={style}>
      <div className={styles.head}>
        {leading}
        <div className={styles.titleWrap}>
          <H className={styles.title} lang={titleLang}>
            <button type="button" className={styles.stretch} onClick={onOpen} aria-haspopup="dialog">
              {title}
            </button>
          </H>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}
        </div>
        {badge && <div className={styles.badge}>{badge}</div>}
      </div>
      {children}
      {hint && (
        <span className={styles.hint} aria-hidden>
          {hint}
          <ChevronRight size={14} />
        </span>
      )}
    </Tag>
  );
}

/** An emoji in a tinted chip, the usual `leading` for a TapCard. */
export function EmojiChip({ emoji, size = 40 }: { emoji: string; size?: number }) {
  return (
    <span
      className="ftp-icon-chip ftp-emoji"
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5), borderRadius: Math.round(size * 0.3) }}
    >
      {emoji}
    </span>
  );
}
