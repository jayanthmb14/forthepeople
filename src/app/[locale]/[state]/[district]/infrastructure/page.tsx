/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — news-driven timeline model.
 * Every data point links to a news article. The platform presents
 * facts aggregated from the press, never judgment.
 */

"use client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";
import { use, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ComponentType } from "react";
import {
  HardHat, AlertTriangle, ExternalLink, Info, Sparkles, X,
  Route, Train, TramFront, Landmark, Droplets, Waves, Building2, Zap, Heart,
  GraduationCap, Trophy, Plane, Anchor, TreePine, TrafficCone, Leaf, Factory,
} from "lucide-react";
import { useInfrastructure } from "@/hooks/useRealtimeData";
import type { InfraProject, InfraUpdate } from "@/hooks/useRealtimeData";
import MobileHint from "@/components/common/MobileHint";
import ModuleDisclaimer from "@/components/common/ModuleDisclaimer";
import {
  ModuleHeader, LoadingShell, ErrorBlock, EmptyBlock, LastUpdatedBadge,
} from "@/components/district/ui";
import AIInsightCard from "@/components/common/AIInsightCard";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import { getModuleSources } from "@/lib/constants/state-config";
import ModuleNews from "@/components/district/ModuleNews";

// ═══════════════════════════════════════════════════════════
// Status config — case-insensitive via normalizeStatus
// ═══════════════════════════════════════════════════════════

type LucideCmp = ComponentType<{ size?: number | string; style?: React.CSSProperties; className?: string }>;

function normalizeStatus(s: string | null | undefined): string {
  if (!s) return "PROPOSED";
  const cleaned = s.trim().toUpperCase().replace(/[\s-]+/g, "_");
  // Map legacy variants to the canonical lifecycle enum
  const MAP: Record<string, string> = {
    PLANNED: "PROPOSED", PROPOSED: "PROPOSED", ANNOUNCED: "PROPOSED",
    APPROVED: "APPROVED", SANCTIONED: "APPROVED",
    TENDERED: "TENDER_ISSUED", TENDER_ISSUED: "TENDER_ISSUED",
    ONGOING: "UNDER_CONSTRUCTION", IN_PROGRESS: "UNDER_CONSTRUCTION",
    UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION", ACTIVE: "UNDER_CONSTRUCTION",
    ON_TRACK: "ON_TRACK",
    DELAYED: "DELAYED", STALLED: "STALLED",
    COMPLETED: "COMPLETED", INAUGURATED: "COMPLETED", COMPLETE: "COMPLETED",
    CANCELLED: "CANCELLED", CANCELED: "CANCELLED", SCRAPPED: "CANCELLED", SHELVED: "CANCELLED",
  };
  return MAP[cleaned] ?? cleaned;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  PROPOSED:           { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB", label: "Proposed" },
  APPROVED:           { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "Approved" },
  TENDER_ISSUED:      { bg: "#F5F3FF", color: "#7C3AED", border: "#C4B5FD", label: "Tender Issued" },
  UNDER_CONSTRUCTION: { bg: "#FFF7ED", color: "#D97706", border: "#FDBA74", label: "Under Construction" },
  ON_TRACK:           { bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC", label: "On Track" },
  DELAYED:            { bg: "#FEF2F2", color: "#DC2626", border: "#FCA5A5", label: "Delayed" },
  STALLED:            { bg: "#FEF2F2", color: "#B91C1C", border: "#FCA5A5", label: "Stalled" },
  COMPLETED:          { bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC", label: "Completed" },
  CANCELLED:          { bg: "#F3F4F6", color: "#6B7280", border: "#D1D5DB", label: "Cancelled" },
};

function statusStyle(raw: string | null | undefined) {
  const s = normalizeStatus(raw);
  return STATUS_STYLE[s] ?? STATUS_STYLE.PROPOSED;
}

// ═══════════════════════════════════════════════════════════
// Category normalization + icons
// ═══════════════════════════════════════════════════════════

function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return "Other";
  const s = raw.trim().toLowerCase();
  // Merge known variants
  if (/\b(road|roads|national\s*highway|nh|pmgsy)\b/.test(s)) return "Roads";
  if (/\bmetro\b/.test(s) && !/rail/.test(s)) return "Metro";
  if (/\b(rail|railway|railways|train)\b/.test(s)) return "Rail";
  if (/\b(bridge|overbridge|rob|fob)\b/.test(s)) return "Bridge";
  if (/\bflyover\b/.test(s)) return "Flyover";
  if (/\b(sewage|sewer|drainage)\b/.test(s)) return "Sewage";
  if (/\b(water(\s*supply)?|jjm|tap)\b/.test(s)) return "Water";
  if (/\b(housing|pmay|flat|apartment|homes)\b/.test(s)) return "Housing";
  if (/\b(power|electricity|grid|substation)\b/.test(s)) return "Power";
  if (/\b(port|harbour|harbor)\b/.test(s)) return "Port";
  if (/\b(airport|runway|terminal)\b/.test(s)) return "Airport";
  if (/\b(hospital|health|medical)\b/.test(s)) return "Hospital";
  if (/\b(school|college|university|education)\b/.test(s)) return "Education";
  if (/\b(stadium|sports|sport)\b/.test(s)) return "Sports & Stadium";
  if (/\b(park|lake|garden|eco[-\s]?park|reservoir)\b/.test(s)) return "Parks & Lakes";
  if (/\b(traffic|junction|signal)\b/.test(s)) return "Traffic";
  if (/\b(environment|ghg|emission|pollution)\b/.test(s)) return "Environment";
  if (/\b(industry|industrial|factory|manufacturing)\b/.test(s)) return "Industry";
  if (/\b(telecom|fiber|5g|tower|network)\b/.test(s)) return "Telecom";
  // Title-case fallback
  return raw.replace(/\s+/g, " ").trim().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

const CATEGORY_ICON: Record<string, LucideCmp> = {
  Roads:             Route,
  Metro:             Train,
  Rail:              TramFront,
  Bridge:            Landmark,
  Flyover:           Landmark,
  Water:             Droplets,
  Sewage:            Waves,
  Housing:           Building2,
  Power:             Zap,
  Hospital:          Heart,
  Education:         GraduationCap,
  "Sports & Stadium": Trophy,
  Airport:           Plane,
  Port:              Anchor,
  "Parks & Lakes":   TreePine,
  Traffic:           TrafficCone,
  Environment:       Leaf,
  Industry:          Factory,
  Telecom:           Factory,
  Other:             HardHat,
};

function categoryIcon(raw: string | null | undefined): LucideCmp {
  return CATEGORY_ICON[normalizeCategory(raw)] ?? HardHat;
}

const UPDATE_TYPE_LABEL: Record<string, string> = {
  ANNOUNCEMENT: "Announcement", APPROVAL: "Approval", TENDER: "Tender",
  CONSTRUCTION_START: "Construction Start", BUDGET_INCREASE: "Budget Increase",
  BUDGET_DECREASE: "Budget Decrease", DELAY: "Delay", STALL: "Stall",
  PROGRESS_UPDATE: "Progress Update", CONTROVERSY: "Concern Raised",
  COMPLETION: "Completion", CANCELLATION: "Cancellation",
  PHASE_COMPLETE: "Phase Complete", INAUGURATION: "Inauguration",
  REVIEW: "Review", SEED: "Initial Record", ADMIN_EDIT: "Admin Edit",
};

// ═══════════════════════════════════════════════════════════
// Format helpers
// ═══════════════════════════════════════════════════════════

function formatINR(rupees: number | null | undefined): string {
  if (rupees == null) return "—";
  if (rupees >= 1_00_00_00_00_000) return `₹${(rupees / 1_00_00_00_00_000).toFixed(2)} Lakh Cr`;
  if (rupees >= 10_00_00_000) return `₹${(rupees / 10_00_00_000).toFixed(0)} Cr`;
  if (rupees >= 1_00_000) return `₹${(rupees / 1_00_000).toFixed(0)} Lakh`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); } catch { return "—"; }
}

function formatFullDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return "—";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return formatMonthYear(iso);
}

const AWAIT_STYLE: React.CSSProperties = { color: "#9CA3AF", fontStyle: "italic" };

function Awaiting() {
  return <span style={AWAIT_STYLE}>Awaiting data</span>;
}

// Normalized status predicates
function isCancelled(p: InfraProject): boolean { return normalizeStatus(p.status) === "CANCELLED"; }
function isCompleted(p: InfraProject): boolean { return normalizeStatus(p.status) === "COMPLETED"; }
function isDelayed(p: InfraProject): boolean {
  const s = normalizeStatus(p.status);
  return s === "DELAYED" || s === "STALLED" || (p.delayMonths ?? 0) > 0;
}
function isActive(p: InfraProject): boolean { return !isCancelled(p) && !isCompleted(p); }

// ═══════════════════════════════════════════════════════════
// Disclaimer banner
// ═══════════════════════════════════════════════════════════

function DisclaimerBanner() {
  return (
    <div
      role="note"
      style={{
        background: "#FFFBEB", border: "1px solid #FDE68A", borderLeft: "4px solid #D97706",
        borderRadius: 12, padding: "12px 16px", marginBottom: 20,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}
    >
      <Info size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.55 }}>
        <strong style={{ fontWeight: 700 }}>Data Transparency Notice:</strong>{" "}
        Infrastructure project data on this page is aggregated from publicly available news
        articles and government press releases. ForThePeople.in does not independently
        verify construction progress or budget figures. Each data point is linked to its
        source article. For official project status, contact the executing agency directly.
        This is not an official government tracker.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Timeline + lazy analysis
// ═══════════════════════════════════════════════════════════

function TimelineEntry({ u }: { u: InfraUpdate }) {
  const type = UPDATE_TYPE_LABEL[u.updateType] ?? u.updateType;
  const accent = u.updateType.startsWith("BUDGET") ? "#D97706"
    : u.updateType === "DELAY" || u.updateType === "STALL" || u.updateType === "CANCELLATION" ? "#DC2626"
    : u.updateType === "COMPLETION" || u.updateType === "PHASE_COMPLETE" || u.updateType === "INAUGURATION" ? "#16A34A"
    : u.updateType === "CONTROVERSY" ? "#B45309"
    : u.updateType === "ADMIN_EDIT" ? "#7C3AED"
    : "#2563EB";

  return (
    <div style={{ position: "relative", padding: "12px 0 12px 22px", borderLeft: "2px solid #E8E8E4", marginLeft: 6 }}>
      <span
        style={{
          position: "absolute", left: -7, top: 16, width: 12, height: 12, borderRadius: "50%",
          background: accent, border: "2px solid #FFF", boxShadow: `0 0 0 2px ${accent}40`,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "var(--font-mono)" }}>{formatFullDate(u.date)}</span>
        <span
          style={{
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            background: `${accent}15`, color: accent, textTransform: "uppercase",
          }}
        >
          {type}
        </span>
        {u.verified && <span title="Verified by the news-extraction AI verifier" style={{ fontSize: 10, color: "#16A34A", fontWeight: 600 }}>✓ verified</span>}
      </div>
      <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>{u.headline}</div>
      {u.summary && u.summary !== u.headline && (
        <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6, lineHeight: 1.5 }}>{u.summary}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 11, color: "#6B7280" }}>
        {u.personName && (
          <span>👤 {u.personName}{u.personRole ? ` — ${u.personRole}` : ""}{u.personParty ? ` (${u.personParty})` : ""}</span>
        )}
        {u.progressPct != null && <span>📊 {u.progressPct}% complete</span>}
        {u.budgetChange != null && <span>💰 {formatINR(u.budgetChange)}</span>}
        {u.statusChange && <span>↪ {statusStyle(u.statusChange).label}</span>}
      </div>
      {u.newsUrl && u.newsUrl !== "admin-panel" && (
        <a
          href={u.newsUrl.startsWith("http") ? u.newsUrl : `https://${u.newsUrl}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: "#2563EB", textDecoration: "none" }}
        >
          {u.newsSource ?? "Source"}{u.newsTitle ? ` · ${u.newsTitle.slice(0, 80)}${u.newsTitle.length > 80 ? "…" : ""}` : ""}
          <ExternalLink size={10} />
        </a>
      )}
      {u.newsUrl === "admin-panel" && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#7C3AED", fontStyle: "italic" }}>
          Source: Admin edit (manual update)
        </div>
      )}
    </div>
  );
}

interface InfraAnalysis {
  citizenImpact: string[];
  accountability: string[];
  notes: string;
  sources: number;
  generatedAt: string;
  cached: boolean;
  unavailable?: boolean;
}

/**
 * Pre-computed analysis reader. NEVER triggers AI on render — the
 * analysis is generated offline by /api/cron/generate-insights and
 * cached in Redis for 24h. If no cache entry exists, the UI renders a
 * calm "Analysis will be available soon" placeholder instead of a
 * click-to-spend button.
 */
function PrecomputedAnalysis({ projectId }: { projectId: string }) {
  const { data, isFetching } = useQuery<InfraAnalysis>({
    queryKey: ["infra-analysis", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/data/infra-analysis?projectId=${projectId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60_000,
  });

  if (isFetching && !data) {
    return (
      <div style={{ padding: "10px 14px", background: "#F5F5F0", borderRadius: 10, fontSize: 12, color: "#6B7280" }}>
        Loading analysis…
      </div>
    );
  }
  if (!data || data.unavailable) {
    return (
      <div
        style={{
          padding: "10px 14px",
          background: "#FAFAFA",
          border: "1px dashed #E5E7EB",
          borderRadius: 10,
          fontSize: 12,
          color: "#9CA3AF",
          fontStyle: "italic",
        }}
      >
        AI analysis will be available soon — generated in the background once
        this project has news coverage.
      </div>
    );
  }

  return (
    <div style={{ padding: "14px 16px", background: "#FAFAFE", border: "1px solid #E0E7FF", borderLeft: "4px solid #7C3AED", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Sparkles size={13} style={{ color: "#7C3AED" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4C1D95", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Project Analysis
        </span>
      </div>
      {data.citizenImpact?.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>📊 For Citizens</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
            {data.citizenImpact.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
      {data.accountability?.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>📊 For Accountability</div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 10 }}>
            {data.accountability.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </>
      )}
      {data.notes && <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, fontStyle: "italic" }}>{data.notes}</div>}
      <div style={{ marginTop: 8, fontSize: 10, color: "#9B9B9B" }}>
        Source: {data.sources} news articles · Generated by Gemini 2.5 Pro · ForThePeople.in
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Project card
// ═══════════════════════════════════════════════════════════

/**
 * Truncate at a word boundary so the card never ends in mid-word.
 * Preserves the full value in the DB; only the visual surface is clipped.
 */
function truncate(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const t = text.trim();
  if (t.length <= max) return t;
  const sliced = t.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return base + "…";
}

const ANNOUNCER_TOOLTIP =
  "This attribution is based on news reports. It indicates who publicly announced this project, not who is responsible for its current status.";
const PARTY_TOOLTIP =
  "Party affiliation shown as reported in news media at the time of announcement. Shown for transparency, not as political endorsement.";

// Sub-judice / court-order detection. We only badge a card when the
// project's own text references a judicial proceeding — never inferred
// from category or status alone.
const COURT_RE =
  /\b(supreme\s*court|high\s*court|tribunal|stay\s*order|sub[-\s]?judice|court\s*order|halted\s*by\s*court|injunction|writ\s*petition|nclat|ngt)\b/i;
function hasCourtMention(p: InfraProject): boolean {
  const blob = [p.description, p.cancellationReason, p.name].filter(Boolean).join(" ");
  if (COURT_RE.test(blob)) return true;
  for (const u of p.updates ?? []) {
    if (COURT_RE.test(`${u.headline} ${u.summary ?? ""}`)) return true;
  }
  return false;
}

function PeopleRow({ p }: { p: InfraProject }) {
  const keyPeople = (p.keyPeople ?? []).filter((k): k is NonNullable<typeof k> => !!k && !!k.name);
  const hasAnything = !!p.announcedBy || !!p.executingAgency || keyPeople.length > 0;

  if (!hasAnything) {
    return (
      <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 8 }}>
        👤 People &amp; agency data pending
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8, fontSize: 12, color: "#4B5563" }}>
      {/* Primary line: announced-by + party + executing agency — all in one */}
      <div>
        👤{" "}
        {p.announcedBy ? (
          <>
            <MobileHint hint={ANNOUNCER_TOOLTIP}>
              <span>
                Announced by:{" "}
                <strong style={{ color: "#1A1A1A" }}>{p.announcedBy}</strong>
              </span>
            </MobileHint>
            {p.party ? (
              <>
                {" "}
                <MobileHint hint={PARTY_TOOLTIP}>
                  <span>({p.party})</span>
                </MobileHint>
              </>
            ) : ""}
          </>
        ) : (
          <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>Announcer pending</span>
        )}
        {p.executingAgency && (
          <>
            {" · "}
            <span style={{ color: "#374151" }}>{p.executingAgency}</span>
          </>
        )}
      </div>
      {/* Secondary line: key people — inline, comma-separated */}
      {keyPeople.length > 0 && (
        <div style={{ fontSize: 11, color: "#6B7280" }}>
          Also:{" "}
          {keyPeople.slice(0, 3).map((kp, i) => (
            <span key={i}>
              {i > 0 ? ", " : ""}
              <strong style={{ color: "#374151" }}>{kp.name}</strong>
              {kp.role || kp.party ? ` (${[kp.role, kp.party].filter(Boolean).join(", ")})` : ""}
            </span>
          ))}
          {keyPeople.length > 3 && <span> + {keyPeople.length - 3} more</span>}
        </div>
      )}
    </div>
  );
}

function TimelineModal({ p, onClose }: { p: InfraProject; onClose: () => void }) {
  const updates = p.updates ?? [];
  const Icon = categoryIcon(p.category);

  // ESC closes the modal; lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Timeline for ${p.name}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFF",
          borderRadius: 14,
          width: "100%",
          maxWidth: 700,
          maxHeight: "calc(100vh - 32px)",
          display: "flex", flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 10, padding: "14px 18px",
            borderBottom: "1px solid #F0F0EC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <Icon size={18} style={{ color: "#2563EB", flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>
                {normalizeCategory(p.category)}
                {p.executingAgency && <> · Executing: {p.executingAgency}</>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close timeline"
            style={{
              background: "none", border: "none", padding: 4, color: "#6B6B6B",
              cursor: "pointer", display: "flex", alignItems: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "14px 18px" }}>
          {p.description && (
            <section style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                About this project
              </div>
              <div style={{ fontSize: 14, color: "#4A4A4A", lineHeight: 1.55, marginBottom: 12 }}>
                {p.description}
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #F0F0EC", margin: 0 }} />
            </section>
          )}

          {updates.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {updates.map((u) => <TimelineEntry key={u.id} u={u} />)}
            </div>
          ) : (
            <div
              style={{
                padding: "14px 16px", background: "#F9FAFB",
                border: "1px dashed #E8E8E4", borderRadius: 10,
                ...AWAIT_STYLE, fontSize: 12,
              }}
            >
              No timeline entries yet — updates appear here as news covers this project.
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <PrecomputedAnalysis projectId={p.id} />
          </div>

          <div style={{ marginTop: 12, fontSize: 10, color: "#9B9B9B", lineHeight: 1.5 }}>
            Data sourced from news articles. Not independently verified. Contact{" "}
            {p.executingAgency ?? "the executing agency"} for official status.
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ p }: { p: InfraProject }) {
  const [open, setOpen] = useState(false);
  const ss = statusStyle(p.status);
  const Icon = categoryIcon(p.category);
  const normalCategory = normalizeCategory(p.category);
  const updates = p.updates ?? [];
  const latest = updates[0];
  const progress = p.progressPct ?? 0;
  const hasBudgetOverrun = p.costOverrun != null && p.costOverrun !== 0;
  const verifiedCount = p.verificationCount ?? 0;
  const lastTs = p.lastNewsAt ?? null;
  const sourceLabel = lastTs ? "News" : "Seed data";

  return (
    <div
      style={{
        background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14,
        padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        display: "flex", flexDirection: "column", gap: 0,
      }}
    >
      {/* Header: name + short description + category·agency line + status badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", lineHeight: 1.3, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Icon size={17} style={{ color: "#2563EB", flexShrink: 0 }} />
            <span>{p.name}</span>
          </div>
          {p.description && (
            <div
              style={{
                fontSize: 13, color: "#6B6B6B", lineHeight: 1.45, marginBottom: 6,
                display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
                overflow: "hidden", textOverflow: "ellipsis",
              }}
              title={p.description}
            >
              {truncate(p.description, 100)}
            </div>
          )}
          <div style={{ fontSize: 11, color: "#9B9B9B", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>
            {normalCategory}
            {p.executingAgency && <> · {p.executingAgency}</>}
            {p.scope && p.scope !== "DISTRICT" && <> · {p.scope}</>}
          </div>
        </div>
        <span
          style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
            whiteSpace: "nowrap",
          }}
        >
          {ss.label}{isDelayed(p) && normalizeStatus(p.status) !== "COMPLETED" ? " ⚠" : ""}
        </span>
      </div>

      {/* Sub-judice / court-order badge. Detected from project text or
          timeline updates mentioning court / tribunal / stay-order /
          writ-petition. Stays neutral — only flags that the matter is
          before a court so we don't appear to take sides. */}
      {hasCourtMention(p) && (
        <div
          style={{
            display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 6,
            padding: "3px 10px", marginBottom: 8, borderRadius: 20,
            background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
            fontSize: 11, fontWeight: 600,
          }}
          title="This project is referenced in court proceedings. ForThePeople.in reports the fact, not a judgment on the matter."
        >
          ⚖️ Subject to court proceedings
        </div>
      )}

      {/* Per-card mini disclaimer for status classifications derived from news.
          Shown for STALLED / CANCELLED / DELAYED (with executing-agency
          contact line) and for COMPLETED (with completion-source date).
          Other statuses stay clean. */}
      {(() => {
        const s = normalizeStatus(p.status);
        if (s === "COMPLETED") {
          const completionUpdate = (p.updates ?? []).find((u) => u.updateType === "COMPLETION" || u.updateType === "INAUGURATION" || u.updateType === "PHASE_COMPLETE");
          const completionDate = p.completionDate ?? completionUpdate?.date ?? p.lastNewsAt ?? null;
          if (!completionDate) return null;
          return (
            <div style={{ fontSize: 11, color: "#16A34A", fontStyle: "italic", marginBottom: 6, lineHeight: 1.4 }}>
              Completion reported in news media on {formatFullDate(completionDate)}.
            </div>
          );
        }
        if (!["STALLED", "CANCELLED", "DELAYED"].includes(s)) return null;
        return (
          <div style={{ fontSize: 11, color: "#9B9B9B", fontStyle: "italic", marginBottom: 6, lineHeight: 1.4 }}>
            Status derived from news reports.
            {p.executingAgency ? <> Contact <span style={{ color: "#6B7280" }}>{p.executingAgency}</span> for official status.</> : null}
          </div>
        );
      })()}

      {/* People — compact, no Awaiting placeholders per field */}
      <PeopleRow p={p} />

      {/* Budget — always rendered so every card has the same rows */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: "#1A1A1A", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
          {(p.originalBudget != null || p.budget != null) ? (
            <>
              <span>💰 <strong>{formatINR(p.originalBudget ?? p.budget)}</strong></span>
              {p.revisedBudget != null && p.revisedBudget !== p.originalBudget && (
                <>
                  <span style={{ color: "#9B9B9B" }}>→</span>
                  <strong>{formatINR(p.revisedBudget)}</strong>
                </>
              )}
              {hasBudgetOverrun && p.costOverrun != null && (
                <span style={{ fontSize: 11, color: p.costOverrun > 0 ? "#B45309" : "#16A34A" }}>
                  ({p.costOverrun > 0 ? "+" : ""}{formatINR(Math.abs(p.costOverrun))}
                  {p.costOverrunPct != null ? ` / ${p.costOverrun > 0 ? "+" : ""}${p.costOverrunPct.toFixed(0)}%` : ""})
                </span>
              )}
            </>
          ) : (
            <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>💰 Budget not disclosed</span>
          )}
        </div>
        {(p.originalBudget != null || p.budget != null) && (
          <div style={{ fontSize: 10, color: "#9B9B9B", fontStyle: "italic", marginTop: 2 }}>
            As reported in news media
          </div>
        )}
      </div>

      {/* Timeline dates — always rendered.
          Falls back through the project's lifecycle: construction start
          → tender → approval → announcement. Label changes to match the
          most advanced milestone reached so "Not started" projects show
          their proposed/announced date instead of a dash. */}
      <div style={{ fontSize: 12, color: "#4B5563", marginBottom: 6 }}>
        {(() => {
          const started = p.actualStartDate ?? p.startDate ?? null;
          const fallbackLabel =
            p.tenderDate ? "Tender issued"
            : p.approvedDate ? "Approved"
            : p.announcedDate ? "Announced"
            : null;
          const fallbackDate =
            p.tenderDate ?? p.approvedDate ?? p.announcedDate ?? null;
          const anchorLabel = started ? "Started" : fallbackLabel;
          const anchorDate = started ?? fallbackDate;
          const haveAnything =
            anchorDate || p.originalEndDate || p.expectedEnd || p.revisedEndDate ||
            (isCancelled(p) && p.cancelledDate);
          if (!haveAnything) {
            return <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>📅 Timeline not announced</span>;
          }
          return (
            <>
              📅 {anchorLabel ?? "Not started"}
              {anchorDate ? <>: <strong>{formatMonthYear(anchorDate)}</strong></> : ""}
              {(p.originalEndDate ?? p.expectedEnd) && (
                <> · Expected: <strong>{formatMonthYear(p.originalEndDate ?? p.expectedEnd)}</strong></>
              )}
              {p.revisedEndDate && (
                <> · <span style={{ color: "#B45309" }}>Revised: {formatMonthYear(p.revisedEndDate)}{p.delayMonths ? ` (+${p.delayMonths}mo)` : ""}</span></>
              )}
              {isCancelled(p) && p.cancelledDate && (
                <> · <span style={{ color: "#B91C1C" }}>Cancelled: {formatMonthYear(p.cancelledDate)}</span></>
              )}
            </>
          );
        })()}
      </div>

      {/* Progress — always shown for non-cancelled projects.
          0% reads as "Not started" instead of an empty silent bar.
          Freshness line below the bar makes it clear when the
          percentage was last reflected in news. Without it, a stale
          seed-data figure could be misread as a current measurement. */}
      {!isCancelled(p) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#6B7280", marginBottom: 3 }}>
            <span>Progress</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: progress > 0 ? "#1A1A1A" : "#9CA3AF" }}>
              {progress > 0 ? `${progress}%` : "Not started"}
            </span>
          </div>
          <div style={{ height: 6, background: "#F0F0EC", borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${Math.max(0.5, Math.min(100, progress))}%`, height: "100%",
                // A sliver of colour at 0% so the bar never looks broken.
                background: progress >= 75 ? "#16A34A"
                  : progress >= 40 ? "#D97706"
                  : progress > 0 ? "#2563EB"
                  : "#D1D5DB",
                transition: "width 500ms ease",
              }}
            />
          </div>
          {progress > 0 && (
            <div style={{ fontSize: 10, color: "#9B9B9B", fontStyle: "italic", marginTop: 3 }}>
              {lastTs
                ? <>Progress as of {formatFullDate(lastTs)}</>
                : <>Progress approximate · Last verified: {formatFullDate(p.lastVerifiedAt)}</>
              }
            </div>
          )}
        </div>
      )}

      {/* Single-source / not-yet-verified warning — shown for every
          card with verificationCount <= 1. Keeps wording consistent
          regardless of district or whether the row is seed or news. */}
      {verifiedCount <= 1 && (
        <div style={{ fontSize: 10, color: verifiedCount === 0 ? "#9B9B9B" : "#B45309", fontStyle: "italic", marginBottom: 8, lineHeight: 1.4 }}>
          {verifiedCount === 0
            ? "Not yet cross-verified by news sources"
            : "⚠ Single source — awaiting additional verification"}
        </div>
      )}

      {/* Cancellation reason */}
      {isCancelled(p) && p.cancellationReason && (
        <div style={{ fontSize: 12, color: "#B91C1C", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "6px 10px", marginBottom: 6 }}>
          <strong>Cancellation reason:</strong> {p.cancellationReason}
        </div>
      )}

      {/* Latest news — always rendered for layout consistency. When the
          only updates are from seed/manual/admin-edit, show an italic
          placeholder instead of the internal ref; real news will replace
          it automatically on the next news-cron run. */}
      {(() => {
        const isRealNews = latest && !["admin-panel", "seed-data", "manual-research", "ai-enrichment"].includes(latest.newsUrl);
        return (
          <div style={{ fontSize: 12, color: "#374151", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isRealNews && latest ? (
              <a
                href={latest.newsUrl.startsWith("http") ? latest.newsUrl : `https://${latest.newsUrl}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: "#374151", textDecoration: "none" }}
                title={latest.headline}
              >
                📰 {truncate(latest.headline, 60)}
                {latest.newsSource && <span style={{ color: "#9B9B9B" }}> — {latest.newsSource}, {formatFullDate(latest.date)}</span>}
              </a>
            ) : (
              <span style={{ color: "#9CA3AF", fontStyle: "italic" }}>
                📰 No news coverage yet — updates as articles are published
              </span>
            )}
          </div>
        );
      })()}

      {/* Footer: Last updated · Source · View Timeline (N) → */}
      <div
        style={{
          marginTop: "auto", paddingTop: 8, borderTop: "1px solid #F0F0EC",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 8, flexWrap: "wrap", fontSize: 11, color: "#9CA3AF",
        }}
      >
        <span>
          Last updated: {lastTs ? relativeTime(lastTs) : "—"} · Source: {sourceLabel}
          {verifiedCount > 0 && <> · ✅ {verifiedCount}</>}
        </span>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 0",
            background: "none", border: "none", color: "#2563EB",
            fontSize: 11, fontWeight: 600, cursor: "pointer",
          }}
          aria-haspopup="dialog"
        >
          View Timeline{updates.length > 0 ? ` (${updates.length})` : ""} →
        </button>
      </div>

      {open && <TimelineModal p={p} onClose={() => setOpen(false)} />}
    </div>
  );
}

function LegalFooter() {
  return (
    <div
      role="note"
      style={{
        background: "#F9F9F7", border: "1px solid #E8E8E4", borderRadius: 8,
        padding: 16, marginTop: 32,
        fontSize: 12, color: "#4B5563", lineHeight: 1.6,
      }}
    >
      <strong style={{ color: "#1A1A1A" }}>Legal Notice:</strong>{" "}
      Infrastructure project data on ForThePeople.in is compiled from publicly available news articles and government
      press releases under <span style={{ color: "#1A1A1A" }}>Article 19(1)(a)</span> of the Indian Constitution
      (Right to Freedom of Speech and Expression) and India&apos;s{" "}
      <span style={{ color: "#1A1A1A" }}>National Data Sharing and Accessibility Policy (NDSAP)</span>.
      <br /><br />
      Person and party attribution reflects public announcements as reported in news media at the time of the
      project&apos;s announcement and does not constitute an assessment of performance, responsibility, or current
      political affiliation. Political party affiliations shown may not reflect current affiliations due to party
      changes or restructuring. Display of political affiliations is for citizen transparency and does not constitute
      endorsement or opposition to any political party.
      <br /><br />
      Project status classifications (Proposed, Under Construction, Delayed, Stalled, Completed, Cancelled) and
      progress percentages are derived from news reports and seed data, and may not reflect official status or current
      progress. Budget figures are as reported in news media and may differ from official government records.
      <br /><br />
      Government agency names shown may have changed due to administrative restructuring since the data was last updated.
      <br /><br />
      News headlines are displayed under fair dealing provisions of the{" "}
      <span style={{ color: "#1A1A1A" }}>Indian Copyright Act, 1957 §52(1)(a)(ii)</span> for reporting current events
      and public interest.
      <br /><br />
      For verified project information, contact the relevant executing agency directly. ForThePeople.in is an
      independent citizen transparency initiative and is not affiliated with, endorsed by, or opposed to any
      government body, political party, or executing agency.
    </div>
  );
}

function DataFreshnessIndicator({ projects }: { projects: InfraProject[] }) {
  if (projects.length === 0) return null;
  const newsTimestamps = projects
    .map((p) => p.lastNewsAt ? new Date(p.lastNewsAt).getTime() : null)
    .filter((t): t is number => t != null);
  if (newsTimestamps.length === 0) {
    return (
      <div
        role="status"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", marginBottom: 14, borderRadius: 8,
          background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF",
          fontSize: 12, lineHeight: 1.4,
        }}
      >
        <span>ℹ</span>
        <span>Initial data — will be enriched as news articles appear</span>
      </div>
    );
  }
  const newestMs = Math.max(...newsTimestamps);
  const ageMs = Date.now() - newestMs;
  const ageDays = Math.floor(ageMs / 86_400_000);
  const ageHours = Math.floor(ageMs / 3_600_000);
  const isStale = ageDays > 7;
  const label = ageHours < 24
    ? `${Math.max(1, ageHours)} hour${ageHours === 1 ? "" : "s"} ago`
    : `${ageDays} day${ageDays === 1 ? "" : "s"} ago`;
  return (
    <div
      role="status"
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px", marginBottom: 14, borderRadius: 8,
        background: isStale ? "#FFFBEB" : "#F0FDF4",
        border: `1px solid ${isStale ? "#FDE68A" : "#86EFAC"}`,
        color: isStale ? "#92400E" : "#15803D",
        fontSize: 12, lineHeight: 1.4,
      }}
    >
      <span>{isStale ? "⚠" : "✅"}</span>
      <span>
        {isStale
          ? <>Data last updated from news: <strong>{label}</strong></>
          : <>Data updated: <strong>{label}</strong></>}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Inner page
// ═══════════════════════════════════════════════════════════

type CategoryFilter = "all" | string;
type StatusFilter = "all" | "active" | "delayed" | "completed" | "cancelled";
type SortOption = "latest" | "budget" | "progress" | "delay";

function InfrastructurePageInner({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const { data, isLoading, error } = useInfrastructure(district, state);
  const projects = useMemo<InfraProject[]>(() => data?.data ?? [], [data]);

  const [catFilter, setCatFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  // Merge category variants before building the filter list
  const { categoryOrder, categoryCounts } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of projects) {
      const c = normalizeCategory(p.category);
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
    return { categoryOrder: ordered, categoryCounts: counts };
  }, [projects]);

  const activeList = projects.filter((p) => !isCancelled(p));
  const cancelledList = projects.filter((p) => isCancelled(p));

  const totalBudget = activeList.reduce((s, p) => s + (p.revisedBudget ?? p.originalBudget ?? p.budget ?? 0), 0);
  const totalSpent = activeList.reduce((s, p) => s + (p.fundsReleased ?? 0), 0);
  const counts = {
    total: projects.length,
    active: projects.filter(isActive).length,
    completed: projects.filter(isCompleted).length,
    delayed: projects.filter(isDelayed).length,
    cancelled: cancelledList.length,
  };

  const filtered = useMemo(() => {
    const list = activeList.filter((p) => {
      if (catFilter !== "all" && normalizeCategory(p.category) !== catFilter) return false;
      if (statusFilter === "active" && !isActive(p)) return false;
      if (statusFilter === "delayed" && !isDelayed(p)) return false;
      if (statusFilter === "completed" && !isCompleted(p)) return false;
      return true;
    });
    const sorted = [...list];
    if (sortBy === "latest") sorted.sort((a, b) => {
      const at = a.lastNewsAt ? new Date(a.lastNewsAt).getTime() : 0;
      const bt = b.lastNewsAt ? new Date(b.lastNewsAt).getTime() : 0;
      return bt - at;
    });
    if (sortBy === "budget") sorted.sort((a, b) => (b.revisedBudget ?? b.budget ?? 0) - (a.revisedBudget ?? a.budget ?? 0));
    if (sortBy === "progress") sorted.sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0));
    if (sortBy === "delay") sorted.sort((a, b) => (b.delayMonths ?? 0) - (a.delayMonths ?? 0));
    return sorted;
  }, [activeList, catFilter, statusFilter, sortBy]);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={HardHat}
        title="Infrastructure Tracker"
        description="Government projects tracked through news — every fact linked to its source"
        backHref={base}
      >
        <LastUpdatedBadge lastUpdated={data?.meta?.lastUpdated} />
      </ModuleHeader>

      <DisclaimerBanner />

      <ModuleDisclaimer
        text="Project timelines and delay information are aggregated from official government announcements and publicly reported news sources. This is not an official government statement. For authoritative information, please consult the concerned government department."
      />

      {(() => { const _src = getModuleSources("infrastructure", state); return <DataSourceBanner moduleName="infrastructure" sources={_src.sources} updateFrequency={_src.frequency} isLive={_src.isLive} />; })()}
      <AIInsightCard module="infrastructure" district={district} />

      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}
      {!isLoading && !error && projects.length === 0 && (
        <EmptyBlock icon="🔧" message="No infrastructure projects tracked yet. News-driven updates will populate this page automatically." />
      )}

      {!isLoading && projects.length > 0 && (
        <>
          <DataFreshnessIndicator projects={projects} />

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
            <StatTile label="Total Projects" value={counts.total} />
            <StatTile label="Active" value={counts.active} color="#D97706" />
            <StatTile label="Completed" value={counts.completed} color="#16A34A" />
            <StatTile label="Delayed" value={counts.delayed} color="#DC2626" />
            <StatTile label="Cancelled" value={counts.cancelled} color="#6B7280" />
            <StatTile label="Total Budget" value={formatINR(totalBudget)} />
            {totalSpent > 0 && <StatTile label="Funds Released" value={formatINR(totalSpent)} color="#2563EB" />}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <FilterRow
              label="Category"
              options={[
                { id: "all", label: "All", count: projects.length },
                ...categoryOrder.map((c) => ({ id: c, label: c, count: categoryCounts.get(c) ?? 0 })),
              ]}
              value={catFilter}
              onChange={(v) => setCatFilter(v as CategoryFilter)}
            />
            <FilterRow
              label="Status"
              options={[
                { id: "all", label: "All", count: projects.length },
                { id: "active", label: "Active", count: counts.active },
                { id: "delayed", label: "Delayed", count: counts.delayed },
                { id: "completed", label: "Completed", count: counts.completed },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
            />
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{ padding: "4px 10px", border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 12, background: "#FFF" }}
              >
                <option value="latest">Latest Update</option>
                <option value="budget">Budget (highest)</option>
                <option value="progress">Most Complete</option>
                <option value="delay">Most Delayed</option>
              </select>
            </div>
          </div>

          {/* Active cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 12, marginBottom: 28 }}>
            {filtered.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>

          {/* Cancelled section */}
          {cancelledList.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} style={{ color: "#6B7280" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Cancelled / Shelved Projects ({cancelledList.length})
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))", gap: 12, marginBottom: 28 }}>
                {cancelledList.map((p) => <ProjectCard key={p.id} p={p} />)}
              </div>
            </div>
          )}
        </>
      )}

      <ModuleNews district={district} state={state} locale={locale} module="infrastructure" />

      <LegalFooter />
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, color: "#9B9B9B", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-mono)", color: color ?? "#1A1A1A" }}>{value}</div>
    </div>
  );
}

function FilterRow({
  label, options, value, onChange,
}: {
  label: string;
  options: Array<{ id: string; label: string; count: number }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onChange(o.id)}
              style={{
                padding: "4px 10px", fontSize: 11, fontWeight: 600, borderRadius: 20,
                background: active ? "#2563EB" : "#F5F5F0",
                color: active ? "#FFF" : "#6B6B6B",
                border: active ? "1px solid #2563EB" : "1px solid #E8E8E4",
                cursor: "pointer",
              }}
            >
              {o.label} ({o.count})
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function InfrastructurePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  return (
    <ModuleErrorBoundary moduleName="Infrastructure">
      <InfrastructurePageInner params={params} />
    </ModuleErrorBoundary>
  );
}
