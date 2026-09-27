/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — full-screen dialog with a project's timeline and analysis.
 * Flat surface with a 1 px border (no shadow), token scrim, a 44 px close
 * button, and the heading as the dialog's h2. Every word is translated
 * (page_infrastructure); project names and news text stay as published.
 */

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { AWAIT_STYLE, CategoryIcon } from "./infra-utils";
import { useInfraText } from "./infra-i18n";
import TimelineEntry from "./TimelineEntry";
import PrecomputedAnalysis from "./PrecomputedAnalysis";

export default function TimelineModal({ p, onClose }: { p: InfraProject; onClose: () => void }) {
  const { t, category } = useInfraText();
  const updates = p.updates ?? [];

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
      aria-label={t("timeline.dialogAria", { name: p.name })}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        // Scrim: the text colour at 55 % opacity (works in light and dark).
        background: "color-mix(in srgb, var(--ftp-text) 55%, transparent)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--ftp-surface)",
          border: "1px solid var(--ftp-border)",
          borderRadius: "var(--ftp-radius-card)",
          width: "100%",
          maxWidth: 700,
          maxHeight: "calc(100vh - 32px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            gap: 10, padding: "12px 12px 12px 18px",
            borderBottom: "1px solid var(--ftp-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1, paddingTop: 6 }}>
            <span className="ftp-icon-chip" aria-hidden style={{ width: 34, height: 34, borderRadius: 11 }}>
              <CategoryIcon category={p.category} />
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 className="ftp-title">{p.name}</h2>
              <div style={{ display: "flex", flexWrap: "wrap", columnGap: 10, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                <span style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{category(p.category)}</span>
                {p.executingAgency && <span>{t("timeline.executing", { agency: p.executingAgency })}</span>}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("timeline.close")}
            style={{
              width: 44, height: 44, flexShrink: 0,
              background: "none", border: "none", color: "var(--ftp-text-2)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--ftp-radius-tile)",
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "14px 18px" }}>
          {p.description && (
            <section style={{ marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--ftp-border)" }}>
              <div className="ftp-label" style={{ marginBottom: 6 }}>
                {t("timeline.about")}
              </div>
              <p className="ftp-body" style={{ fontSize: 15, lineHeight: "22px", color: "var(--ftp-text)" }}>
                {p.description}
              </p>
            </section>
          )}

          {updates.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {updates.map((u) => <TimelineEntry key={u.id} u={u} />)}
            </div>
          ) : (
            <p className="ftp-body" style={{ ...AWAIT_STYLE }}>
              {t("timeline.empty")}
            </p>
          )}

          <div style={{ marginTop: 14 }}>
            <PrecomputedAnalysis projectId={p.id} />
          </div>

          <div style={{ marginTop: 12, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
            {p.executingAgency
              ? t("timeline.footer", { agency: p.executingAgency })
              : t("timeline.footerNoAgency")}
          </div>
        </div>
      </div>
    </div>
  );
}
