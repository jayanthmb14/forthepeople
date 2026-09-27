/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — one project as a tappable card (v4.1).
 * The card answers "what is it, how far along, how much money, is it
 * late?" at a glance: category emoji + name, status pill, the latest
 * budget, a progress bar, the expected finish (or how late it is) and how
 * many news updates back it. Tapping it opens the project's DetailSheet
 * (ProjectSheet.tsx) with the full money, dates, people, every news
 * update and the source links. Words come from page_infrastructure;
 * project names stay as published.
 */

"use client";

import { AlertTriangle, Scale } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { Pill, ProgressBar } from "@/components/district/ui";
import { CardHead, HueTag, TagRow, TapCard } from "@/components/money/TapCard";
import { statusStyle, categoryEmoji, normalizeStatus, isDelayed, isCancelled, hasCourtMention } from "./infra-utils";
import { useInfraText } from "./infra-i18n";

/** Latest reported budget: revised, else original, else the plain budget field. */
export function budgetOf(p: InfraProject): number | null {
  return p.revisedBudget ?? p.originalBudget ?? p.budget ?? null;
}

export default function ProjectCard({ p, onOpen }: { p: InfraProject; onOpen: () => void }) {
  const { t, m, category, status, scope, inr, monthYear, ago } = useInfraText();
  const ss = statusStyle(p.status);
  const s = normalizeStatus(p.status);
  const finished = s === "COMPLETED";
  const cancelled = isCancelled(p);
  const progress = p.progressPct ?? 0;
  const budget = budgetOf(p);
  const updates = p.updates?.length ?? 0;
  const late = isDelayed(p) && !finished;
  const expected = p.revisedEndDate ?? p.originalEndDate ?? p.expectedEnd ?? null;

  return (
    <TapCard onOpen={onOpen} ariaLabel={t("card.cardAria", { name: p.name })} more={t("card.more")} dimmed={cancelled}>
      <CardHead
        emoji={categoryEmoji(p.category)}
        title={p.name}
        titleLocal={p.nameLocal}
        side={
          <Pill tone={ss.tone} dot icon={late ? AlertTriangle : undefined}>
            {status(p.status)}
          </Pill>
        }
      />
      <TagRow>
        <HueTag>{category(p.category)}</HueTag>
        {p.scope && p.scope !== "DISTRICT" && <HueTag outline>{scope(p.scope)}</HueTag>}
        {hasCourtMention(p) && (
          <Pill tone="warn" icon={Scale}>
            {t("card.court")}
          </Pill>
        )}
      </TagRow>

      {/* Money and time, side by side. */}
      <span style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <span style={{ minWidth: 0 }}>
          <span className="ftp-label" style={{ display: "block" }}>{t("card.budget")}</span>
          <span className="ftp-num" style={{ fontSize: 17, lineHeight: "24px", fontWeight: 650, color: budget != null ? "var(--hue-deep)" : "var(--ftp-text-2)" }}>
            {budget != null ? inr(budget) : "—"}
          </span>
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="ftp-label" style={{ display: "block" }}>{cancelled ? t("card.cancelledOn") : finished ? t("card.finishedOn") : t("card.expected")}</span>
          <span className="ftp-num" style={{ fontSize: 15, lineHeight: "24px", fontWeight: 600, color: late ? "var(--ftp-warn)" : "var(--ftp-text)" }}>
            {cancelled
              ? monthYear(p.cancelledDate)
              : finished
                ? monthYear(p.completionDate ?? p.lastNewsAt)
                : expected
                  ? monthYear(expected)
                  : "—"}
          </span>
          {late && p.delayMonths ? (
            <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-warn)" }}>
              {t("card.late", { months: p.delayMonths })}
            </span>
          ) : null}
        </span>
      </span>

      {!cancelled && (
        <span style={{ display: "block" }}>
          <ProgressBar
            pct={progress > 0 ? progress : finished ? 100 : 0}
            label={progress > 0 ? t("card.progress") : finished ? t("card.finished") : t("card.notStarted")}
          />
        </span>
      )}

      <span style={{ display: "flex", flexWrap: "wrap", columnGap: 12, rowGap: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        <span>{t("card.updates", { n: updates })}</span>
        {p.lastNewsAt && <span suppressHydrationWarning>{t("card.lastUpdated", { when: ago(p.lastNewsAt) })}</span>}
        {(p.verificationCount ?? 0) > 1 && <span>{t("card.sourcesAgree", { n: m.num(p.verificationCount ?? 0) })}</span>}
      </span>
    </TapCard>
  );
}
