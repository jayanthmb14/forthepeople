"use client";

/**
 * MethodologyAccordion — "How it is measured" rows per Mockup 2.
 *
 * Rows are module-specific and live in the "page_india-module" messages
 * under `<group>.<key>.title` / `.body` (e.g. tigers.camera.title), so each
 * row is translated like the rest of the page. The route passes the keys
 * and the source PDF links.
 */

import * as React from "react";
import { useTranslations } from "next-intl";
import { Camera, ChevronDown, Compass, ExternalLink, FileText, Hash, Search, type LucideIcon } from "lucide-react";
import { Glyph } from "@/components/graphics";

export interface MethodologyRow {
  key: string;
  pdfUrl?: string;
}

export interface MethodologyAccordionProps {
  rows: MethodologyRow[];
  /** Message group holding the rows, e.g. "tigers". */
  group: string;
  className?: string;
}

/** A small monochrome icon per row (v5.1: were emoji). */
const ROW_ICONS: LucideIcon[] = [Camera, Hash, Compass, FileText, Search];

export function MethodologyAccordion({ rows, group, className }: MethodologyAccordionProps) {
  const t = useTranslations("page_india-module");
  const [open, setOpen] = React.useState<number | null>(0);
  const baseId = React.useId();

  return (
    <section
      className={className}
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: "18px 20px",
        marginTop: "1.5rem",
      }}
    >
      <h2 className="ftp-h2" style={{ fontSize: 20, lineHeight: "26px", display: "flex", alignItems: "center", gap: 10, margin: "0 0 8px" }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 32, height: 32, borderRadius: 10 }}>
          <Glyph name="flask" size={19} />
        </span>
        {t("data.methodTitle")}
      </h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((row, i) => {
          const isOpen = open === i;
          const panelId = `${baseId}-${i}`;
          const RowIcon = ROW_ICONS[i % ROW_ICONS.length];
          return (
            <li key={row.key} style={{ borderTop: i === 0 ? "none" : "1px solid var(--ftp-border)" }}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                style={{
                  width: "100%",
                  textAlign: "start",
                  background: "transparent",
                  border: "none",
                  padding: "12px 0",
                  minHeight: 44,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--ftp-text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <RowIcon size={16} aria-hidden style={{ color: "var(--hue-deep)", flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{t(`${group}.${row.key}.title`)}</span>
                <ChevronDown
                  size={16}
                  aria-hidden
                  style={{ color: "var(--ftp-text-2)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform var(--ftp-dur-fast) ease" }}
                />
              </button>
              {isOpen && (
                <div id={panelId} style={{ padding: "0 0 14px 28px", fontSize: 14, lineHeight: 1.65, color: "var(--ftp-text-2)" }}>
                  <p style={{ margin: "0 0 8px" }}>{t(`${group}.${row.key}.body`)}</p>
                  {row.pdfUrl && (
                    <a
                      href={row.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--hue-deep)", fontWeight: 600, fontSize: 13 }}
                    >
                      {t("data.viewPdf")}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default MethodologyAccordion;
