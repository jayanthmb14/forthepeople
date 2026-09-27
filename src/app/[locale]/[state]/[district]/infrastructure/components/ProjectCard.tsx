/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one project as a tappable card (v5).
 * The card answers, in order:
 *   what is it     the name + one plain sentence from the description
 *   what kind      a closed list (Roads, Water, Metro …); the kind's glyph
 *                  sits on a pastel tile beside the name (v5.1), so a road
 *                  and a metro line look different before you read
 *   where          the taluk, when the row has one
 *   how far        the stage (Announced → Completed) and progress, if known
 *   money / time   the latest budget in rupees and the finish date
 *   our notes      up to three points worked out from the row (deadline
 *                  passed, budget revised, no news for N days …)
 *   how fresh      "Last update N days ago · 2 sources"
 * Tapping it opens the project's DetailSheet (ProjectSheet.tsx). Words
 * come from page_infrastructure; names and descriptions stay as published.
 */

"use client";

import { AlertTriangle, Clock, Link2, Scale, TrendingDown, TrendingUp, Copy, Gauge } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { Pill, ProgressBar } from "@/components/district/ui";
import { TapCard } from "@/components/money/TapCard";
import {
  budgetNow,
  daysAgo,
  finishDate,
  lastUpdateAt,
  oneLine,
  shownProgress,
  sourceCount,
  type ProjectPoint,
} from "@/lib/civic/project-facts";
import { CategoryGlyph, projectKindGlyph } from "@/components/graphics";
import { STAGE_TONE, hasCourtMention, kindOf, stageOf } from "./infra-utils";
import { useInfraText } from "./infra-i18n";

/** Latest reported budget in rupees: revised, else original, else the plain budget field. */
export function budgetOf(p: InfraProject): number | null {
  return budgetNow(p);
}

/** Icon and tone for each of our points. Amber only for the ones that matter most. */
const POINT_LOOK: Record<ProjectPoint["kind"], { icon: LucideIcon; warn: boolean }> = {
  deadlinePassed: { icon: AlertTriangle, warn: true },
  budgetUp: { icon: TrendingUp, warn: true },
  budgetDown: { icon: TrendingDown, warn: false },
  noNews: { icon: Clock, warn: true },
  noNewsEver: { icon: Clock, warn: false },
  noNewsNoSource: { icon: Clock, warn: false },
  progressUnknown: { icon: Gauge, warn: false },
  noSource: { icon: Link2, warn: false },
  oneSource: { icon: Link2, warn: false },
  maybeSame: { icon: Copy, warn: false },
  sameDescription: { icon: Copy, warn: false },
};

/** One of our points as a translated sentence. */
export function usePointText() {
  const { t, m } = useInfraText();
  return (pt: ProjectPoint): string => {
    switch (pt.kind) {
      case "deadlinePassed":
        return t("v5.point.deadlinePassed", { months: pt.months });
      case "budgetUp":
      case "budgetDown":
        return t(`v5.point.${pt.kind}`, { pct: m.num(pt.pct) });
      case "noNews":
        return t("v5.point.noNews", { days: m.num(pt.days) });
      case "maybeSame":
      case "sameDescription":
        return t(`v5.point.${pt.kind}`, { name: pt.name });
      default:
        return t(`v5.point.${pt.kind}`);
    }
  };
}

/** A short list of our points: small icon + one line each. */
export function PointList({ points, max }: { points: ProjectPoint[]; max?: number }) {
  const text = usePointText();
  const shown = max ? points.slice(0, max) : points;
  if (shown.length === 0) return null;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      {shown.map((pt) => {
        const look = POINT_LOOK[pt.kind];
        const Icon = look.icon;
        return (
          <li key={pt.kind} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 13, lineHeight: "19px", color: "var(--ftp-text)" }}>
            <Icon size={14} aria-hidden style={{ flexShrink: 0, marginTop: 2, color: look.warn ? "var(--ftp-warn)" : "var(--ftp-text-2)" }} />
            <span style={{ minWidth: 0 }}>{text(pt)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProjectCard({
  p,
  points,
  place,
  onOpen,
}: {
  p: InfraProject;
  /** Our points for this project (computed once by the page). */
  points: ProjectPoint[];
  /** Taluk name when the row has one. */
  place?: string | null;
  onOpen: () => void;
}) {
  const { t, m, kind, stage, scope, inr, monthYear } = useInfraText();
  const st = stageOf(p);
  const k = kindOf(p);
  const cancelled = st === "cancelled";
  const finished = st === "completed";
  const budget = budgetOf(p);
  const what = oneLine(p.description, 150);
  const due = finishDate(p);
  const updated = daysAgo(lastUpdateAt(p));
  const sources = sourceCount(p);
  // Finished → 100% whatever the row says (Sept 2026 audit).
  const progress = shownProgress(p);

  const dateLine = cancelled
    ? p.cancelledDate
      ? t("v5.card.cancelled", { date: monthYear(p.cancelledDate) })
      : null
    : finished
      ? p.completionDate
        ? t("v5.card.finished", { date: monthYear(p.completionDate) })
        : null
      : due
        ? t("v5.card.due", { date: monthYear(typeof due === "string" ? due : due.toISOString()) })
        : t("v5.card.noDue");

  return (
    <TapCard onOpen={onOpen} ariaLabel={t("card.cardAria", { name: p.name })} more={t("card.more")} dimmed={cancelled}>
      {/* Kind picture and stage on top; the name gets the full width below. */}
      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
        <CategoryGlyph pick={projectKindGlyph(k)} size={40} chip />
        <Pill tone={STAGE_TONE[st]} dot>
          {stage(st)}
        </Pill>
      </span>
      <span style={{ display: "block", minWidth: 0 }}>
        <span className="ftp-title" style={{ display: "block", fontWeight: 650, overflowWrap: "break-word" }}>
          {p.name}
        </span>
        {p.nameLocal && (
          <span style={{ display: "block", fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)" }}>{p.nameLocal}</span>
        )}
      </span>

      {/* What it is, in one plain sentence. */}
      <span className="ftp-body" style={{ display: "block", fontSize: 14, lineHeight: "21px", color: what ? "var(--ftp-text)" : "var(--ftp-text-2)" }}>
        {what ?? t("v5.card.noDescription")}
      </span>

      {/* Kind · where · scope · court. */}
      <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>
        <span className={`ftp-hue-${projectKindGlyph(k).hue}`} style={{ fontWeight: 600, color: "var(--hue-deep)" }}>
          {kind(k)}
        </span>
        {place && <span>{t("v5.card.where", { place })}</span>}
        {p.scope && p.scope !== "DISTRICT" && p.scope !== "CITY" && <span>{scope(p.scope)}</span>}
        {hasCourtMention(p) && (
          <Pill tone="warn" icon={Scale}>
            {t("card.court")}
          </Pill>
        )}
      </span>

      {/* Money and time. */}
      <span style={{ display: "flex", flexWrap: "wrap", gap: "2px 16px", fontSize: 14, lineHeight: "21px" }}>
        <span className="ftp-num" style={{ fontWeight: 650, color: budget != null ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
          {budget != null ? t("v5.card.budget", { amount: inr(budget) }) : t("v5.card.budgetUnknown")}
        </span>
        {dateLine && <span style={{ color: "var(--ftp-text-2)" }}>{dateLine}</span>}
      </span>

      {!cancelled && progress !== null && (
        <span style={{ display: "block" }}>
          <ProgressBar pct={progress} label={t("card.progress")} />
        </span>
      )}

      {/* Our notes, worked out from the row. */}
      <PointList points={points} max={3} />

      <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        {updated !== null ? t("v5.card.lastUpdate", { n: updated }) : t("v5.card.noUpdateDate")}
        {" · "}
        {t("v5.card.sources", { n: sources })}
        {(p.verificationCount ?? 0) > 1 && <> · {t("card.sourcesAgree", { n: m.num(p.verificationCount ?? 0) })}</>}
      </span>
    </TapCard>
  );
}
