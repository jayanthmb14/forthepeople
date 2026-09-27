"use client";

/**
 * MethodologyAccordion — 4-row accordion per Mockup 2.
 *
 * Rows are module-specific. Phase 4: hardcoded rows for Wildlife/Tigers.
 * Phase 5: rows come from a JSON config keyed by module slug.
 */

import * as React from "react";

export interface MethodologyRow {
  title: string;
  body: string;
  pdfUrl?: string;
}

export interface MethodologyAccordionProps {
  rows: MethodologyRow[];
  className?: string;
}

export function MethodologyAccordion({ rows, className }: MethodologyAccordionProps) {
  const [open, setOpen] = React.useState<number | null>(null);

  return (
    <section
      className={className}
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "18px 22px",
        marginTop: "1.5rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--ftp-font-display)",
          fontSize: "20px",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          margin: "0 0 12px",
        }}
      >
        Methodology
      </h2>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((row, i) => {
          const isOpen = open === i;
          return (
            <li
              key={i}
              style={{
                borderTop: i === 0 ? "none" : "0.5px solid var(--color-border-tertiary)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "12px 0",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>{row.title}</span>
                <span aria-hidden style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                  {isOpen ? "▾" : "▸"}
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    paddingBottom: "14px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <p style={{ margin: "0 0 8px" }}>{row.body}</p>
                  {row.pdfUrl && (
                    <a
                      href={row.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-text-info)", fontSize: "12px" }}
                    >
                      View source PDF ↗
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
