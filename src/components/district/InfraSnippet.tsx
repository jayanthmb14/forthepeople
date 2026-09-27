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
 */

"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  HardHat, Route, Train, TramFront, Landmark, Droplets, Waves, Building2,
  Zap, Heart, GraduationCap, Trophy, Plane, Anchor, TreePine, TrafficCone,
  Leaf, Factory,
} from "lucide-react";
import type { ComponentType } from "react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { AsOfText, Card, ProgressBar } from "@/components/district/ui";

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

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: "Proposed", APPROVED: "Approved", TENDER_ISSUED: "Tender Issued",
  UNDER_CONSTRUCTION: "Under Construction", IN_PROGRESS: "Under Construction",
  ONGOING: "Under Construction", ON_TRACK: "On Track",
  DELAYED: "Delayed", STALLED: "Stalled", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

function isCompleted(p: InfraProject) { return ["COMPLETED", "INAUGURATED"].includes(normalizeStatus(p.status)); }
function isCancelled(p: InfraProject) { return normalizeStatus(p.status) === "CANCELLED"; }
function isDelayed(p: InfraProject) {
  const s = normalizeStatus(p.status);
  return s === "DELAYED" || s === "STALLED" || (p.delayMonths ?? 0) > 0;
}

function formatINR(rupees: number | null | undefined): string {
  if (rupees == null || rupees <= 0) return "—";
  if (rupees >= 1_00_00_00_00_000) return `₹${(rupees / 1_00_00_00_00_000).toFixed(2)} Lakh Cr`;
  if (rupees >= 10_00_00_000) return `₹${(rupees / 10_00_00_000).toFixed(0)} Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(0)} Lakh`;
  return `₹${rupees.toLocaleString("en-IN")}`;
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

  const projects = data?.data ?? [];
  if (projects.length === 0) return null; // no shell when no data

  const counts = {
    total: projects.length,
    active: projects.filter((p) => !isCancelled(p) && !isCompleted(p)).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
  };
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
    <Card as="section" aria-label="Infrastructure at a glance" className="ftp-hue-orange" tinted>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 32, height: 32, fontSize: 17, borderRadius: 10 }}>🏗️</span>
          <h3 className="ftp-title ftp-display" style={{ fontSize: 16, fontWeight: 650, color: "var(--hue-deep)" }}>Infrastructure</h3>
        </span>
        <Link href={`${base}/infrastructure`} style={{ fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none", minHeight: 44, display: "inline-flex", alignItems: "center" }}>
          View all
        </Link>
      </div>

      {/* Counts row — semantic colour only as a 6 px dot. */}
      <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)" }}>
        <li><span className="ftp-num">{counts.total}</span> projects</li>
        <li style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ftp-warn)" }} />
          <span className="ftp-num">{counts.active}</span> active
        </li>
        <li style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ftp-live)" }} />
          <span className="ftp-num">{counts.completed}</span> completed
        </li>
        <li style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: counts.delayed > 0 ? "var(--ftp-danger)" : "var(--ftp-border-strong)" }} />
          <span className="ftp-num">{counts.delayed}</span> delayed
        </li>
      </ul>

      {/* Top 3 projects */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {top.map((p) => {
          const Icon = CATEGORY_ICON[normalizeCategory(p.category)] ?? HardHat;
          const status = normalizeStatus(p.status);
          const statusLabel = STATUS_LABEL[status] ?? status;
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
                  <span style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ftp-text-2)", flexShrink: 0 }}>
                    {completedRow
                      ? "Completed"
                      : progress > 0
                        ? <><span className="ftp-num">{progress}%</span> · {statusLabel}</>
                        : `Not started · ${statusLabel}`}
                  </span>
                </div>
                {shortDesc && (
                  <div
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
            Total budget tracked: <span className="ftp-num" style={{ color: "var(--ftp-text)" }}>{formatINR(totalBudget)}</span>
          </span>
        ) : <span />}
        <AsOfText asOf={asOf} prefix="Checked" />
      </div>
    </Card>
  );
}
