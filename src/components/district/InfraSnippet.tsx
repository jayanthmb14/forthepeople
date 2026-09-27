/**
 * ForThePeople.in — Compact infrastructure snippet for the district overview.
 *
 * Shows: counts (total/active/completed/delayed), top 3 in-progress
 * projects with mini progress bars, and total tracked budget. Links
 * to the full /infrastructure page. Renders nothing if the district
 * has zero projects so empty districts don't show a hollow shell.
 *
 * Design v3: kit Card + title row, status counts with 6 px dots,
 * thin kit ProgressBars, and a "Checked <date>" line (newest
 * lastVerifiedAt / lastNewsAt across the projects).
 *
 * v5.1 "Warm Calm": OverviewCard frame with the drawn crane mark; the
 * status counts become one coloured bar (being built on time · delayed ·
 * completed) with a legend underneath, so the mix is visible at a glance.
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useFormat } from "@/i18n/client";
import {
  HardHat, Route, Train, TramFront, Landmark, Droplets, Waves, Building2,
  Zap, Heart, GraduationCap, Trophy, Plane, Anchor, TreePine, TrafficCone,
  Leaf, Factory,
} from "lucide-react";
import type { ComponentType } from "react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { AsOfText, ProgressBar } from "@/components/district/ui";
import OverviewCard from "@/components/district/shell/OverviewCard";
import { isNonProject, projectStage } from "@/lib/civic/project-facts";
import { ProjectsMark } from "@/components/district/shell/overview-art";

type LucideCmp = ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;

// Same icon mapping as the full infrastructure page (kept in sync)
const CATEGORY_ICON: Record<string, LucideCmp> = {
  Roads: Route, Metro: Train, Rail: TramFront, Bridge: Landmark, Flyover: Landmark,
  Water: Droplets, Sewage: Waves, Housing: Building2, Power: Zap, Hospital: Heart,
  Education: GraduationCap, "Sports & Stadium": Trophy, Airport: Plane, Port: Anchor,
  "Parks & Lakes": TreePine, Traffic: TrafficCone, Environment: Leaf, Industry: Factory,
  Telecom: Factory, Other: HardHat,
};

function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const s = raw.trim().toLowerCase();
  if (/\b(road|highway|nh|pmgsy)\b/.test(s)) return "Roads";
  if (/\bmetro\b/.test(s) && !/rail/.test(s)) return "Metro";
  if (/\b(rail|railway|train)\b/.test(s)) return "Rail";
  if (/\b(bridge|overbridge|rob|fob)\b/.test(s)) return "Bridge";
  if (/\bflyover\b/.test(s)) return "Flyover";
  if (/\b(sewage|sewer|drainage)\b/.test(s)) return "Sewage";
  if (/\b(water|jjm|tap)\b/.test(s)) return "Water";
  if (/\b(housing|pmay)\b/.test(s)) return "Housing";
  if (/\b(power|electricity|grid)\b/.test(s)) return "Power";
  if (/\bairport\b/.test(s)) return "Airport";
  if (/\b(port|harbour|harbor)\b/.test(s)) return "Port";
  if (/\b(hospital|health)\b/.test(s)) return "Hospital";
  if (/\b(school|college|education)\b/.test(s)) return "Education";
  if (/\b(stadium|sports)\b/.test(s)) return "Sports & Stadium";
  return "Other";
}

function normalizeStatus(s: string | null | undefined): string {
  if (!s) return "PROPOSED";
  return s.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

// Status keys with a translated label in page_snippets.infra.status.
const STATUS_KEY: Record<string, string> = {
  PROPOSED: "PROPOSED", APPROVED: "APPROVED", TENDER_ISSUED: "TENDER_ISSUED",
  UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION", IN_PROGRESS: "UNDER_CONSTRUCTION", ONGOING: "UNDER_CONSTRUCTION",
  ON_TRACK: "ON_TRACK", DELAYED: "DELAYED", STALLED: "STALLED", COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED", OPERATIONAL: "OPERATIONAL",
};

// Stages come from the same rule as the glance tile and the Projects page
// (projectStage in src/lib/civic/project-facts.ts), so "being built" here is
// the tile's number. Sept 2026 audit: this card used to count every
// not-finished project (proposed, approved, announced) as being built.
function isCompleted(p: InfraProject) { return projectStage(p.status) === "completed"; }
function isCancelled(p: InfraProject) { return projectStage(p.status) === "cancelled"; }
function isBuilding(p: InfraProject) { return projectStage(p.status) === "building"; }
function isDelayed(p: InfraProject) {
  const s = normalizeStatus(p.status);
  return s === "DELAYED" || s === "STALLED" || (p.delayMonths ?? 0) > 0;
}


interface ApiResponse { data: InfraProject[]; meta?: unknown }

export default function InfraSnippet({
  district, state, base,
}: {
  district: string; state: string; base: string;
}) {
  const { data } = useQuery<ApiResponse>({
    queryKey: ["district", district, "infrastructure", "snippet"],
    queryFn: () => fetch(`/api/data/infrastructure?district=${district}&state=${state}`).then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const t = useTranslations("page_snippets");
  const td = useTranslations("page_district-shell.cards.projects");
  const f = useFormat();
  // Real projects only (not scheme announcements), as the glance tile counts them.
  const projects = (data?.data ?? []).filter((p) => !isNonProject({ name: p.name ?? "" }));
  if (projects.length === 0) return null; // no shell when no data

  // Rupees → words in the page language. (The old helper used 10^11 for
  // "lakh crore" and 10^8 for "crore", so every total was off by 10×.)
  const money = (rupees: number): string => {
    if (rupees >= 1e12) return t("money.lakhCrore", { n: f.number(rupees / 1e12, { maximumFractionDigits: 2 }) });
    if (rupees >= 1e7) return t("money.crore", { n: f.number(Math.round(rupees / 1e7)) });
    if (rupees >= 1e5) return t("money.lakh", { n: f.number(Math.round(rupees / 1e5)) });
    return t("money.rupees", { n: f.number(Math.round(rupees)) });
  };

  const counts = {
    total: projects.length,
    active: projects.filter(isBuilding).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
  };
  // The bar: being built (not late) · being built but late · completed.
  // The legend counts all projects being built (the glance tile's number)
  // and says how many of them are late.
  const delayedActive = projects.filter((p) => isBuilding(p) && isDelayed(p)).length;
  const segments = [
    { key: "building", n: counts.active - delayedActive },
    { key: "delayed", n: delayedActive },
    { key: "done", n: counts.completed },
  ].filter((x) => x.n > 0);
  const barTotal = segments.reduce((sum, x) => sum + x.n, 0);
  const totalBudget = projects.reduce(
    (s, p) => s + (p.revisedBudget ?? p.originalBudget ?? p.budget ?? 0),
    0
  );

  // Pick top 3 to feature: prefer in-progress ordered by progress desc;
  // fall back to completed if no in-progress; final fallback: any.
  const inProgress = projects
    .filter((p) => !isCompleted(p) && !isCancelled(p))
    .sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0));
  const completed = projects.filter(isCompleted);
  const top: InfraProject[] = (inProgress.length > 0 ? inProgress : completed).slice(0, 3);
  if (top.length < 3) top.push(...projects.filter((p) => !top.includes(p)).slice(0, 3 - top.length));

  // Newest date anyone checked or reported on a project — the honest
  // "as of" for this whole card.
  const asOf = projects
    .map((p) => p.lastVerifiedAt ?? p.lastNewsAt ?? null)
    .filter((d): d is string => Boolean(d))
    .sort()
    .pop() ?? null;

  return (
    <OverviewCard
      hue="orange"
      mark={<ProjectsMark size={36} />}
      title={t("infra.title")}
      ariaLabel={t("infra.aria")}
      href={`${base}/infrastructure`}
      linkText={t("infra.viewAll")}
    >
      {/* One bar for the mix of statuses, then a legend with the counts. */}
      <p className="ftp-ovi-total">{t("infra.projects", { n: counts.total })}</p>
      {barTotal > 0 && (
        <div
          className="ftp-ovi-bar"
          role="img"
          aria-label={td("barAria", { building: counts.active, delayed: delayedActive, done: counts.completed })}
        >
          {segments.map((x, i) => (
            <span key={x.key} className="ftp-ovi-seg ftp-grow-x" data-seg={x.key} style={{ flexGrow: x.n, ["--i" as string]: i }} />
          ))}
        </div>
      )}
      <ul className="ftp-ovi-legend">
        <li data-seg="building"><span aria-hidden /> {td("building", { n: f.number(counts.active) })}</li>
        {delayedActive > 0 && <li data-seg="delayed"><span aria-hidden /> {td("delayed", { n: f.number(delayedActive) })}</li>}
        <li data-seg="done"><span aria-hidden /> {td("done", { n: f.number(counts.completed) })}</li>
      </ul>

      {/* Top 3 projects */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {top.map((p) => {
          const Icon = CATEGORY_ICON[normalizeCategory(p.category)] ?? HardHat;
          const status = normalizeStatus(p.status);
          const statusLabel = t(`infra.status.${STATUS_KEY[status] ?? "OTHER"}`);
          const completedRow = isCompleted(p);
          const progress = p.progressPct ?? (completedRow ? 100 : 0);
          const shortDesc = p.description && p.description.length > 60
            ? p.description.trim().slice(0, 60).replace(/\s+\S*$/, "") + "…"
            : (p.description ?? "");

          return (
            <li key={p.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <Icon size={14} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0, marginTop: 3 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span lang="en" style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ftp-text-2)", flexShrink: 0 }}>
                    {completedRow
                      ? t("infra.done")
                      : progress > 0
                        ? <span className="ftp-num">{t("infra.progress", { pct: progress, status: statusLabel })}</span>
                        : t("infra.notStarted", { status: statusLabel })}
                  </span>
                </div>
                {shortDesc && (
                  <div
                    lang="en"
                    style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}
                    title={p.description ?? undefined}
                  >
                    {shortDesc}
                  </div>
                )}
                {!completedRow && (
                  <div style={{ marginTop: 4 }}>
                    <ProgressBar value={Math.max(0.5, Math.min(100, progress))} max={100} height={4} tone="amber" />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {totalBudget > 0 ? (
          <span style={{ fontSize: 13, color: "var(--ftp-text-2)" }}>
            {t.rich("infra.total", { amount: money(totalBudget), b: (c) => <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{c}</span> })}
          </span>
        ) : <span />}
        <AsOfText asOf={asOf} prefix={t("infra.checked")} />
      </div>
    </OverviewCard>
  );
}
