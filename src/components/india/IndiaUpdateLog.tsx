/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Public-facing transparency feed: every IndiaIndicator update,
 * newest first, with filter chips by category and an expandable
 * detail row for source URL.
 *
 * Builds trust ("they actually update this"). Phase U scaffold —
 * the list is empty until the schema is db-pushed and scrapers run,
 * which surfaces as a friendly empty-state instead of a broken page.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INDIA_DESIGN } from "@/lib/india/india-design";
import {
  formatAsOfDate,
  formatRelativeAge,
  formatIndianNumber,
} from "@/lib/india/india-formatters";
import {
  type IndiaModuleCategory,
  getIndiaCategories,
} from "@/lib/india/india-modules";
import { CATEGORY_ACCENT } from "@/lib/india/india-design";
import { EmptyState as KitEmptyState } from "@/components/district/ui";

interface UpdateRow {
  id: string;
  moduleSlug: string;
  moduleTitle: string;
  category: IndiaModuleCategory;
  metricKey: string;
  metricLabel: string;
  numericValue: number | null;
  textValue: string | null;
  unit: string | null;
  asOfDate: string;
  source: string;
  sourceUrl: string;
  notes: string | null;
  fetchedAt: string;
}

const CATEGORY_LABELS: Record<IndiaModuleCategory, string> = {
  snapshot: "Snapshot",
  demographics: "Demographics",
  economy: "Economy",
  budget: "Budget",
  agriculture: "Agriculture",
  livestock: "Livestock",
  wildlife: "Wildlife",
  infrastructure: "Infrastructure",
  energy: "Energy",
  health: "Health",
  education: "Education",
  defence: "Defence",
  justice: "Justice",
  elections: "Elections",
  science: "Science",
  trade: "Trade",
  tourism: "Tourism",
  sports: "Sports",
  custom: "Other",
};

export default function IndiaUpdateLog() {
  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbPending, setDbPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<"all" | IndiaModuleCategory>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allCategories = useMemo(() => getIndiaCategories(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url =
          category === "all"
            ? "/api/india/updates"
            : `/api/india/updates?category=${category}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 503) {
          setDbPending(true);
          setRows([]);
        } else if (res.ok) {
          setDbPending(false);
          setRows(Array.isArray(data.updates) ? data.updates : []);
        } else {
          setError(data.error ?? "Failed to load updates.");
        }
      } catch {
        if (!cancelled) setError("Network error. Try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "24px 16px 48px",
      }}
    >
      {/* Filter chips */}
      <div
        role="tablist"
        aria-label="Filter update log by category"
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: `1px solid ${INDIA_DESIGN.border}`,
        }}
      >
        <Chip
          label="All"
          active={category === "all"}
          onClick={() => setCategory("all")}
        />
        {allCategories.map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            accent={CATEGORY_ACCENT[c]}
            active={category === c}
            onClick={() => setCategory(c)}
          />
        ))}
      </div>

      {dbPending ? (
        <div
          role="status"
          style={{
            padding: "12px 14px",
            background: INDIA_DESIGN.amberStrip,
            border: `1px solid ${INDIA_DESIGN.amberStripBorder}`,
            borderRadius: 8,
            fontSize: 13,
            color: "#78350F",
            marginBottom: 18,
          }}
        >
          Update log will populate once the schema is applied
          (
          <code style={{ background: "#FEF3C7", padding: "1px 4px", borderRadius: 3 }}>
            npx prisma db push
          </code>
          ) and the first data sync completes.
        </div>
      ) : null}

      {loading ? (
        <div style={{ fontSize: 13, color: INDIA_DESIGN.textFaint, padding: 16 }}>
          Loading update log…
        </div>
      ) : error ? (
        <div
          role="alert"
          style={{
            padding: "10px 12px",
            border: "1px solid #FECACA",
            background: "#FEF2F2",
            borderRadius: 6,
            fontSize: 13,
            color: "#B91C1C",
          }}
        >
          {error}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            background: INDIA_DESIGN.bgCard,
            border: `1px solid ${INDIA_DESIGN.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {rows.map((row, idx) => (
            <UpdateLogRow
              key={row.id}
              row={row}
              isLast={idx === rows.length - 1}
              expanded={expanded.has(row.id)}
              onToggle={() => toggleExpand(row.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Chip({
  label,
  active,
  accent,
  onClick,
}: {
  label: string;
  active: boolean;
  accent?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="ftp-chip"
      style={{
        background: active ? "var(--hue)" : INDIA_DESIGN.bgCard,
        color: active ? "#FFFFFF" : INDIA_DESIGN.textSecondary,
        border: active
          ? "none"
          : `1px solid ${INDIA_DESIGN.border}`,
        borderRadius: 999,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 26,
      }}
    >
      {accent ? (
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: active ? "#FFFFFF" : accent,
            flexShrink: 0,
          }}
        />
      ) : null}
      {label}
    </button>
  );
}

function UpdateLogRow({
  row,
  isLast,
  expanded,
  onToggle,
}: {
  row: UpdateRow;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = CATEGORY_ACCENT[row.category];
  const display =
    row.numericValue != null
      ? formatIndianNumber(row.numericValue)
      : row.textValue ?? "—";

  return (
    <div
      style={{
        borderBottom: isLast ? "none" : `1px solid ${INDIA_DESIGN.border}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "12px 14px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 56,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              color: INDIA_DESIGN.textPrimary,
              lineHeight: 1.4,
            }}
          >
            <strong style={{ fontWeight: 600 }}>{row.moduleTitle}</strong>
            <span style={{ color: INDIA_DESIGN.textMuted }}>{" · "}</span>
            <span style={{ color: INDIA_DESIGN.textSecondary }}>{row.metricLabel}</span>
            <span style={{ color: INDIA_DESIGN.textMuted }}>{" → "}</span>
            <span
              className="ftp-num"
              style={{
                fontWeight: 700,
                color: INDIA_DESIGN.textPrimary,
              }}
            >
              {display}
              {row.unit ? (
                <span style={{ fontSize: 11, color: INDIA_DESIGN.textMuted, marginLeft: 3 }}>
                  {row.unit}
                </span>
              ) : null}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: INDIA_DESIGN.textFaint,
              marginTop: 2,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <span>{row.source}</span>
            <span>·</span>
            <span>as of {formatAsOfDate(row.asOfDate)}</span>
            <span>·</span>
            <span>{formatRelativeAge(row.fetchedAt)}</span>
          </div>
        </div>
        <span
          aria-hidden="true"
          style={{
            fontSize: 12,
            color: INDIA_DESIGN.textFaint,
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 120ms ease",
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {expanded ? (
        <div
          style={{
            padding: "8px 14px 14px 32px",
            background: INDIA_DESIGN.bgMuted,
            fontSize: 12,
            color: INDIA_DESIGN.textMuted,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div>
            <span style={{ color: INDIA_DESIGN.textFaint, marginRight: 6 }}>
              Source URL:
            </span>
            <Link
              href={row.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: INDIA_DESIGN.accentBlue, textDecoration: "none" }}
            >
              {row.sourceUrl}
            </Link>
          </div>
          <div>
            <span style={{ color: INDIA_DESIGN.textFaint, marginRight: 6 }}>
              Module slug:
            </span>
            <code
              style={{
                fontFamily: INDIA_DESIGN.fontMono,
                background: INDIA_DESIGN.bgCard,
                border: `1px solid ${INDIA_DESIGN.border}`,
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              {row.moduleSlug}
            </code>
            <span style={{ color: INDIA_DESIGN.textFaint, margin: "0 6px 0 12px" }}>
              Metric key:
            </span>
            <code
              style={{
                fontFamily: INDIA_DESIGN.fontMono,
                background: INDIA_DESIGN.bgCard,
                border: `1px solid ${INDIA_DESIGN.border}`,
                borderRadius: 3,
                padding: "1px 5px",
              }}
            >
              {row.metricKey}
            </code>
          </div>
          {row.notes ? (
            <div>
              <span style={{ color: INDIA_DESIGN.textFaint, marginRight: 6 }}>
                Note:
              </span>
              <span style={{ fontStyle: "italic" }}>{row.notes}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  return (
    <KitEmptyState
      emoji="⏳"
      title="No updates yet. The first sync is still pending."
      body="Once data starts flowing in from the official portals, every value change will appear here with its source link and reporting date."
    />
  );
}
