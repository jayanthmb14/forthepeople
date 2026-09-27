/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — everything about one project, in the shared
 * DetailSheet (bottom sheet on phones, right panel on laptops). Replaces
 * the old full-screen timeline dialog. Top to bottom (v5): what it is (the
 * description, first), where it stands (stage + progress + "as of" date),
 * our notes (every point worked out from the row), the honesty notes
 * (from news, single source, court), money (first budget → now, change,
 * released), dates (announced → finished), who is involved, every news
 * update (TimelineEntry), the source articles, and the cached AI
 * analysis. No emoji. Words from page_infrastructure; names, agencies and
 * news text stay as published.
 */

"use client";

import { ExternalLink } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { Pill, ProgressBar } from "@/components/district/ui";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { hueClass } from "@/lib/design/hues";
import { SheetHighlight, SheetLink, SheetSection, hostOf, safeUrl } from "@/components/money/TapCard";
import { ownSourceLinks, type ProjectPoint } from "@/lib/civic/project-facts";
import { CategoryGlyph, projectKindGlyph } from "@/components/graphics";
import { hasCourtMention, kindOf, stageOf } from "./infra-utils";
import { useInfraText } from "./infra-i18n";
import { PointList } from "./ProjectCard";
import PeopleRow from "./PeopleRow";
import TimelineEntry from "./TimelineEntry";
import PrecomputedAnalysis from "./PrecomputedAnalysis";
import { budgetOf } from "./ProjectCard";

/** Update rows that are our own records, not news articles. */
const NOT_NEWS = new Set(["admin-panel", "seed-data", "manual-research", "ai-enrichment"]);

export default function ProjectSheet({
  p,
  points = [],
  place,
  onClose,
}: {
  p: InfraProject | null;
  points?: ProjectPoint[];
  place?: string | null;
  onClose: () => void;
}) {
  const { t, m, kind, stage, inr, monthYear, fullDate } = useInfraText();
  if (!p) return null;

  const st = stageOf(p);
  const finished = st === "completed";
  const cancelled = st === "cancelled";
  const progress = p.progressPct ?? 0;
  const updates = p.updates ?? [];
  const verified = p.verificationCount ?? 0;
  const latestNews = updates.find((u) => !NOT_NEWS.has(u.newsUrl) && safeUrl(u.newsUrl));
  // Source articles: the project's own list plus every update's link, once each.
  const links = new Map<string, string>();
  for (const u of updates) {
    const url = NOT_NEWS.has(u.newsUrl) ? null : safeUrl(u.newsUrl);
    if (url && !links.has(url)) links.set(url, u.newsSource ?? hostOf(url) ?? url);
  }
  // sourceUrls is a list of links or (hand-researched rows) { primary: { url, publication }, … }.
  for (const l of ownSourceLinks(p)) {
    const url = safeUrl(l.url);
    if (url && !links.has(url)) links.set(url, l.name ?? hostOf(url) ?? url);
  }
  const first = p.originalBudget ?? p.budget ?? null;
  const now = budgetOf(p);

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={p.name}
      subtitle={[kind(kindOf(p)), place, p.executingAgency].filter(Boolean).join(" · ")}
      media={<CategoryGlyph pick={projectKindGlyph(kindOf(p))} size={44} chip />}
      hueClassName={hueClass("infrastructure")}
      footer={
        latestNews ? (
          <SheetLink href={safeUrl(latestNews.newsUrl)!} primary icon={<ExternalLink size={16} aria-hidden />}>
            {t("sheet.openNews")}
          </SheetLink>
        ) : undefined
      }
    >
      {/* What it is, first. */}
      <SheetSection title={t("v5.what")}>
        <p className="ftp-body" style={{ fontSize: 15, lineHeight: "23px", color: p.description ? "var(--ftp-text)" : "var(--ftp-text-2)" }}>
          {p.description ?? t("v5.card.noDescription")}
        </p>
      </SheetSection>

      {/* Where it stands. */}
      <SheetHighlight label={t("sheet.statusNow")}>
        {progress > 0 && !cancelled ? t("sheet.statusLine", { status: stage(st), pct: m.num(progress) }) : stage(st)}
      </SheetHighlight>
      {!cancelled && (
        <div>
          <ProgressBar pct={progress > 0 ? progress : finished ? 100 : 0} label={t("card.progress")} height={10} />
          {progress > 0 && (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>
              {p.lastNewsAt
                ? t("sheet.progressAsOf", { date: fullDate(p.lastNewsAt) })
                : t("sheet.progressApprox", { date: fullDate(p.lastVerifiedAt) })}
            </p>
          )}
        </div>
      )}

      {/* Our notes: worked out from the row, not a judgement. */}
      {points.length > 0 && (
        <SheetSection title={t("v5.pointsTitle")}>
          <PointList points={points} />
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6, fontSize: 12, lineHeight: "18px" }}>{t("v5.pointsHint")}</p>
        </SheetSection>
      )}

      {/* Honesty notes. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hasCourtMention(p) && (
          <p className="ftp-body" style={{ color: "var(--ftp-text)" }}>
            <Pill tone="warn">{t("card.court")}</Pill> {t("card.courtHint")}
          </p>
        )}
        {(st === "stalled" || st === "cancelled" || /^delayed$/i.test((p.status ?? "").trim())) && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
            {t("card.statusFromNews")} {p.executingAgency ? t("sheet.contactAgency", { agency: p.executingAgency }) : null}
          </p>
        )}
        {cancelled && p.cancellationReason && (
          <p className="ftp-body" style={{ color: "var(--ftp-text)" }}>
            <span style={{ fontWeight: 600, color: "var(--ftp-text)" }}>{t("card.cancelReason")}</span> {p.cancellationReason}
          </p>
        )}
        <p className="ftp-body" style={{ color: verified === 1 ? "var(--ftp-warn)" : "var(--ftp-text-2)" }}>
          {verified === 0 ? t("card.notVerified") : verified === 1 ? t("card.singleSource") : t("sheet.sourcesAgree", { n: m.num(verified) })}
        </p>
      </div>

      <SheetSection title={t("sheet.money")}>
        <DetailList
          rows={[
            { label: t("sheet.firstBudget"), value: first != null ? <span className="ftp-num">{inr(first)}</span> : t("card.budgetUnknown") },
            { label: t("sheet.budgetNow"), value: now != null && now !== first ? <span className="ftp-num">{inr(now)}</span> : null },
            {
              label: t("sheet.change"),
              value:
                p.costOverrun != null && p.costOverrun !== 0 ? (
                  <span className="ftp-num" style={{ color: p.costOverrun > 0 ? "var(--ftp-warn)" : "var(--ftp-live-text)" }}>
                    {p.costOverrun > 0 ? "+" : "−"}
                    {inr(Math.abs(p.costOverrun))}
                    {p.costOverrunPct != null ? ` (${p.costOverrun > 0 ? "+" : ""}${m.num(p.costOverrunPct)}%)` : ""}
                  </span>
                ) : null,
            },
            { label: t("sheet.released"), value: p.fundsReleased ? <span className="ftp-num">{inr(p.fundsReleased)}</span> : null },
          ]}
        />
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>{t("card.asReported")}</p>
      </SheetSection>

      <SheetSection title={t("sheet.dates")}>
        <DetailList
          rows={[
            { label: t("sheet.announced"), value: p.announcedDate ? monthYear(p.announcedDate) : null },
            { label: t("sheet.approved"), value: p.approvedDate ? monthYear(p.approvedDate) : null },
            { label: t("sheet.tender"), value: p.tenderDate ? monthYear(p.tenderDate) : null },
            { label: t("sheet.started"), value: p.actualStartDate ?? p.startDate ? monthYear(p.actualStartDate ?? p.startDate) : null },
            { label: t("sheet.expectedEnd"), value: p.originalEndDate ?? p.expectedEnd ? monthYear(p.originalEndDate ?? p.expectedEnd) : null },
            {
              label: t("sheet.revisedEnd"),
              value: p.revisedEndDate ? (
                <span style={{ color: "var(--ftp-warn)" }}>
                  {monthYear(p.revisedEndDate)}
                  {p.delayMonths ? ` · ${t("card.late", { months: p.delayMonths })}` : ""}
                </span>
              ) : null,
            },
            { label: t("sheet.finished"), value: finished && p.completionDate ? fullDate(p.completionDate) : null },
            { label: t("sheet.cancelled"), value: cancelled && p.cancelledDate ? monthYear(p.cancelledDate) : null },
          ]}
        />
        {!p.announcedDate && !p.approvedDate && !p.tenderDate && !p.startDate && !p.actualStartDate && !p.expectedEnd && !p.originalEndDate && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("card.noTimeline")}</p>
        )}
      </SheetSection>

      <SheetSection title={t("sheet.people")}>
        <PeopleRow p={p} />
        {p.contractor && (
          <DetailList rows={[{ label: t("sheet.contractor"), value: p.contractor }]} />
        )}
      </SheetSection>

      <SheetSection title={t("sheet.updates", { n: updates.length })}>
        {updates.length > 0 ? (
          <div>
            {updates.map((u) => (
              <TimelineEntry key={u.id} u={u} />
            ))}
          </div>
        ) : (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("timeline.empty")}</p>
        )}
      </SheetSection>

      {links.size > 0 && (
        <SheetSection title={t("sheet.sources")}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
            {[...links.entries()].slice(0, 12).map(([url, name]) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                >
                  <ExternalLink size={14} aria-hidden /> {name}
                </a>
              </li>
            ))}
          </ul>
        </SheetSection>
      )}

      <PrecomputedAnalysis projectId={p.id} />

      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
        {p.executingAgency ? t("timeline.footer", { agency: p.executingAgency }) : t("timeline.footerNoAgency")}
      </p>
    </DetailSheet>
  );
}
