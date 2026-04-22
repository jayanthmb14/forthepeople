/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Shared District Dashboard UI Components
// ═══════════════════════════════════════════════════════════
"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Module Page Header ──────────────────────────────────
export function ModuleHeader({
  icon: Icon,
  title,
  description,
  backHref,
  liveTag,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  backHref: string;
  liveTag?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderBottom: "1px solid #E8E8E4",
        paddingBottom: 20,
        marginBottom: 24,
      }}
    >
      <Link
        href={backHref}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: "#9B9B9B",
          textDecoration: "none",
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={13} />
        Back to Overview
      </Link>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            background: "#EFF6FF",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} style={{ color: "#2563EB" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1A1A1A",
                letterSpacing: "-0.4px",
              }}
            >
              {title}
            </h1>
            {liveTag && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#16A34A",
                  background: "#DCFCE7",
                  border: "1px solid #BBF7D0",
                  borderRadius: 4,
                  padding: "2px 6px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                ● LIVE
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6B6B6B", marginTop: 2 }}>{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Last Updated Badge ──────────────────────────────────
export function LastUpdatedBadge({ lastUpdated }: { lastUpdated?: string | null }) {
  if (!lastUpdated) return null;
  const date = new Date(lastUpdated);
  const label = date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  }) + " IST";
  return (
    <span style={{ fontSize: 11, color: "#9B9B9B", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 10 }}>🕐</span> Last updated: {label}
    </span>
  );
}

// ── Stat Card ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  accent?: string;
  trend?: "up" | "down" | "neutral";
}) {
  const color = accent ?? "#2563EB";
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        flex: "1 0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {Icon && <Icon size={13} style={{ color }} />}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#9B9B9B",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-data"
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#1A1A1A",
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color:
              trend === "up"
                ? "#16A34A"
                : trend === "down"
                ? "#DC2626"
                : "#9B9B9B",
            marginTop: 4,
          }}
        >
          {trend === "up" && "↑ "}
          {trend === "down" && "↓ "}
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Section Label ───────────────────────────────────────
export function SectionLabel({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#9B9B9B",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </div>
      {action}
    </div>
  );
}

// ── Cards Grid ──────────────────────────────────────────
export function CardGrid({
  children,
  cols = "repeat(auto-fill, minmax(200px, 1fr))",
}: {
  children: React.ReactNode;
  cols?: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

// ── Data Table ──────────────────────────────────────────
export function DataTable({
  columns,
  rows,
  emptyText,
}: {
  columns: { key: string; label: string; mono?: boolean; align?: "right" | "left" }[];
  rows: Record<string, React.ReactNode>[];
  emptyText?: string;
}) {
  if (!rows.length) {
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "#9B9B9B",
          fontSize: 13,
        }}
      >
        {emptyText ?? "No data available"}
      </div>
    );
  }
  return (
    <div className="data-table-scroll"
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #F0F0EC" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9B9B9B",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textAlign: col.align === "right" ? "right" : "left",
                  background: "#FAFAF8",
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{
                borderBottom: i < rows.length - 1 ? "1px solid #F5F5F0" : "none",
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#1A1A1A",
                    fontFamily: col.mono ? "var(--font-mono)" : "inherit",
                    textAlign: col.align === "right" ? "right" : "left",
                  }}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Info Card ───────────────────────────────────────────
export function InfoCard({
  title,
  subtitle,
  badge,
  badgeColor,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E8E4",
        borderRadius: 12,
        padding: "16px 18px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: subtitle || children ? 10 : 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {badge && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: badgeColor ?? "#2563EB",
                background: badgeColor ? `${badgeColor}18` : "#EFF6FF",
                padding: "2px 8px",
                borderRadius: 20,
                whiteSpace: "nowrap",
              }}
            >
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Progress Bar ────────────────────────────────────────
export function ProgressBar({
  value,
  max = 100,
  pct: pctProp,
  color,
  height = 8,
  label,
}: {
  value?: number;
  max?: number;
  pct?: number;
  color?: string;
  height?: number;
  label?: string;
}) {
  const pct = pctProp !== undefined
    ? Math.min(100, pctProp)
    : Math.min(100, Math.round(((value ?? 0) / max) * 100));
  const barColor = color ?? (pct >= 75 ? "#16A34A" : pct >= 40 ? "#D97706" : "#DC2626");
  return (
    <div>
      {label !== undefined && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6B6B6B",
            marginBottom: 4,
          }}
        >
          <span>{label}</span>
          <span
            className="font-data"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {pct}%
          </span>
        </div>
      )}
      <div
        style={{
          background: "#F0F0EC",
          borderRadius: height,
          height,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: barColor,
            height: "100%",
            width: `${pct}%`,
            borderRadius: height,
            transition: "width 600ms ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Loading Shell ───────────────────────────────────────
export function LoadingShell({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 56,
            background: "linear-gradient(90deg, #F5F5F0 25%, #EBEBEB 50%, #F5F5F0 75%)",
            backgroundSize: "200% 100%",
            borderRadius: 10,
            animation: "shimmer 1.5s infinite",
          }}
        />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}

// ── Error Block ─────────────────────────────────────────
export function ErrorBlock({ message }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 16px",
        background: "#FFF1F0",
        border: "1px solid #FECACA",
        borderRadius: 10,
        fontSize: 13,
        color: "#DC2626",
      }}
    >
      <AlertCircle size={16} />
      {message ?? "Failed to load data. Please refresh."}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────
export function EmptyBlock({ message, icon }: { message?: string; icon?: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: "#9B9B9B",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon ?? "📭"}</div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#6B6B6B", marginBottom: 4 }}>
        {message ?? "No data available yet"}
      </p>
      <p style={{ fontSize: 12 }}>Data for this district will be populated soon.</p>
    </div>
  );
}

// ── Live Badge ──────────────────────────────────────────
export function LiveBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: "#16A34A",
        background: "#DCFCE7",
        border: "1px solid #BBF7D0",
        padding: "2px 7px",
        borderRadius: 20,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          background: "#16A34A",
          borderRadius: "50%",
        }}
      />
      Live
    </span>
  );
}

// ── Cache Badge ─────────────────────────────────────────
export function CacheBadge({ fromCache }: { fromCache?: boolean }) {
  if (!fromCache) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 10,
        color: "#9B9B9B",
      }}
    >
      <RefreshCw size={10} />
      Cached
    </span>
  );
}

// ── Last Updated ────────────────────────────────────────
export function LastUpdated({
  updatedAt,
  onRefetch,
}: {
  updatedAt?: string | null;
  onRefetch?: () => void;
}) {
  const [hover, setHover] = React.useState(false);

  if (!updatedAt) return null;

  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);

  let ago: string;
  if (diffMins < 1) ago = "just now";
  else if (diffMins < 60) ago = `${diffMins} min ago`;
  else if (diffMins < 1440) ago = `${Math.round(diffMins / 60)}h ago`;
  else ago = `${Math.round(diffMins / 1440)}d ago`;

  const exactIST = date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      title={`Last updated: ${exactIST} IST`}
      onClick={onRefetch}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        color: hover ? "#2563EB" : "#9B9B9B",
        cursor: onRefetch ? "pointer" : "default",
        userSelect: "none",
        transition: "color 150ms ease",
        padding: "2px 0",
        flexShrink: 0,
      }}
    >
      <RefreshCw size={11} style={{ transition: "transform 300ms ease", transform: hover ? "rotate(180deg)" : "none" }} />
      <span>{ago}</span>
    </div>
  );
}

// ── Alert Badge ─────────────────────────────────────────
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, [string, string]> = {
    critical: ["#DC2626", "#FEE2E2"],
    high: ["#D97706", "#FEF3C7"],
    medium: ["#2563EB", "#EFF6FF"],
    info: ["#6B7280", "#F3F4F6"],
    low: ["#16A34A", "#DCFCE7"],
  };
  const [color, bg] = map[severity.toLowerCase()] ?? map.info;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        padding: "2px 8px",
        borderRadius: 20,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {severity}
    </span>
  );
}

// ── AI Insight Banner ────────────────────────────────────
export function AIInsightBanner({
  headline,
  summary,
  sentiment,
  confidence,
  sourceUrls,
  createdAt,
}: {
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  sourceUrls?: string[];
  createdAt?: string;
}) {
  const [expanded, setExpanded] = React.useState(false);

  const sentimentColor =
    sentiment === "positive" ? "#16A34A" :
    sentiment === "negative" ? "#DC2626" :
    "#6B7280";
  const sentimentBg =
    sentiment === "positive" ? "#DCFCE7" :
    sentiment === "negative" ? "#FEE2E2" :
    "#F3F4F6";

  const confidencePct = Math.round(confidence * 100);

  return (
    <div
      style={{
        background: "#F0F7FF",
        border: "1px solid #BFDBFE",
        borderLeft: "4px solid #2563EB",
        borderRadius: 10,
        padding: "14px 16px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Brain icon area */}
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, fontSize: 14,
          }}
        >
          🧠
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#2563EB", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              AI Intelligence
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: sentimentColor, background: sentimentBg, padding: "1px 6px", borderRadius: 20 }}>
              {sentiment}
            </span>
            <span style={{ fontSize: 10, color: "#9B9B9B", fontFamily: "monospace" }}>
              {confidencePct}% confidence
            </span>
            {createdAt && (
              <span style={{ fontSize: 10, color: "#9B9B9B", marginLeft: "auto" }}>
                {new Date(createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
          </div>

          {/* Headline */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.4, marginBottom: 4 }}>
            {headline}
          </div>

          {/* Summary (expandable) */}
          <p
            style={{
              fontSize: 12, color: "#4B5563", lineHeight: 1.6, margin: 0,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: expanded ? undefined : 2,
              WebkitBoxOrient: "vertical" as const,
            }}
          >
            {summary}
          </p>

          {/* Expand/collapse + sources */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                fontSize: 11, color: "#2563EB", background: "none",
                border: "none", padding: 0, cursor: "pointer",
              }}
            >
              {expanded ? "Show less ↑" : "Read more ↓"}
            </button>
            {expanded && sourceUrls && sourceUrls.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                {sourceUrls.slice(0, 2).map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#2563EB", textDecoration: "none" }}
                  >
                    Source {i + 1} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
