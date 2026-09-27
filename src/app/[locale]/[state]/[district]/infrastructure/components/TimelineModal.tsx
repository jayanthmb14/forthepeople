/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Infrastructure Tracker — full-screen dialog with a project's timeline and analysis.
 * Extracted from infrastructure/page.tsx (no behaviour change).
 */

"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import type { InfraProject } from "@/hooks/useRealtimeData";
import { AWAIT_STYLE, categoryIcon, normalizeCategory } from "./infra-utils";
import TimelineEntry from "./TimelineEntry";
import PrecomputedAnalysis from "./PrecomputedAnalysis";

export default function TimelineModal({ p, onClose }: { p: InfraProject; onClose: () => void }) {
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
