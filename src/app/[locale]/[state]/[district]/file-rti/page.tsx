/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// File RTI page — Design v4 "Rang" module recipe (see the finance page).
// A citizen picks a topic, sees the ready-made RTI application (English +
// local language when we have it), copies it and files it online.
//   PageHeader → "In simple words" card with the three steps → topic list
//   → the chosen application → sources.
// Templates come from useRTI() → data.templates (only `active` ones shown).

"use client";
import type React from "react";
import { use, useState } from "react";
import { FileText, Copy, Check, ExternalLink } from "lucide-react";
import { useRTI } from "@/hooks/useRealtimeData";
import { PageHeader, Section, Card, Pill, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Shared 44 px button shape (easy to tap on phones). Colours come from the
    .ftp-btn-primary / .ftp-btn-secondary classes so hover works. */
const BUTTON_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: "var(--ftp-radius-tile)",
  borderWidth: 1,
  borderStyle: "solid",
  fontFamily: "var(--ftp-font-sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

/** The quiet (bordered) button: surface background, text colour. */
const BUTTON_SECONDARY: React.CSSProperties = {
  ...BUTTON_BASE,
  borderColor: "var(--ftp-border)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
};

/** Small sentence-case label above a block (12 px, text-2). */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return <div className="ftp-label" style={{ marginBottom: 4 }}>{children}</div>;
}

/** The three steps of filing an RTI — a real sequence, so it is numbered. */
const STEPS: Array<{ emoji: string; text: string }> = [
  { emoji: "👆", text: "Pick a topic" },
  { emoji: "📋", text: "Copy the letter" },
  { emoji: "📮", text: "File it online" },
];

function RtiSteps() {
  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
        gap: 10,
      }}
    >
      {STEPS.map((s, i) => (
        <li
          key={s.text}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-surface)",
            border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
          }}
        >
          <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
            {s.emoji}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span className="ftp-num" style={{ fontSize: 12, lineHeight: "16px", color: "var(--hue-deep)" }}>Step {i + 1}</span>
            <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function FileRTIPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;
  const districtName = getDistrict(state, district)?.name ?? district.replace(/-/g, " ");
  const { data, isLoading, error } = useRTI(district, state);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const templates = (data?.data?.templates ?? []).filter((t) => t.active);
  const selectedTpl = templates.find((t) => t.id === selected);

  const handleCopy = () => {
    if (selectedTpl) {
      navigator.clipboard.writeText(selectedTpl.templateText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // The local-language heading: Kannada for Karnataka (where the templates
  // were written), a neutral phrase elsewhere. Never machine-translated.
  const localHeading = state === "karnataka" ? "ಕನ್ನಡದಲ್ಲಿ" : "In the local language";

  return (
    <div className="ftp-container" style={PAGE_STYLE}>
      <PageHeader
        icon={FileText}
        title="File RTI"
        description="Choose a template, copy the application text, and submit online"
        backHref={base}
        accent={getModuleAccent("file-rti")}
        source={{ label: "rtionline.gov.in", href: "https://rtionline.gov.in" }}
      />
      {isLoading && <LoadingShell rows={4} />}
      {error && <ErrorBlock />}

      {!isLoading && !error && templates.length === 0 && (
        <EmptyState
          emoji="📜"
          title={`No RTI templates yet for ${districtName}.`}
          body="You can still file an RTI with any central government office on the official RTI Online portal."
          action={
            <a href="https://rtionline.gov.in" target="_blank" rel="noopener noreferrer" className="ftp-btn ftp-btn-secondary" style={BUTTON_SECONDARY}>
              File online <ExternalLink size={12} aria-hidden />
            </a>
          }
        />
      )}

      {/* The picture: what an RTI is, and the three steps on this page. The
          count is the number of ready-made letters we actually hold. */}
      {!isLoading && templates.length > 0 && (
        <Card tinted padding={18} style={{ marginBottom: 8 }}>
          <Explainer title="In simple words" emoji="📜">
            An RTI is a letter that asks a government office for information it holds. We have{" "}
            <strong>
              {templates.length} ready-made {templates.length === 1 ? "letter" : "letters"}
            </strong>{" "}
            for {districtName}: pick a topic, copy the letter, and file it online.
          </Explainer>
          <RtiSteps />
        </Card>
      )}

      {!isLoading && templates.length > 0 && (
        // One column on phones; two side by side once a template is open on wider screens.
        <div style={{ display: "grid", gridTemplateColumns: selected ? "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" : "1fr", gap: 24, alignItems: "start" }}>
          {/* Template list */}
          <Section title="Choose a topic" emoji="🗂️">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {templates.map((t) => {
                const isActive = selected === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelected(t.id === selected ? null : t.id)}
                    style={{
                      padding: "12px 14px",
                      minHeight: 44,
                      borderRadius: "var(--ftp-radius-card)",
                      textAlign: "left",
                      cursor: "pointer",
                      background: isActive
                        ? "linear-gradient(135deg, var(--hue-tint) 0%, var(--ftp-surface) 85%)"
                        : "var(--ftp-surface)",
                      border: `1px solid ${isActive ? "var(--hue)" : "var(--ftp-border)"}`,
                      boxShadow: isActive ? "inset 3px 0 0 var(--hue), var(--ftp-shadow-1)" : "var(--ftp-shadow-1)",
                      color: "var(--ftp-text)",
                      fontFamily: "var(--ftp-font-sans)",
                      transition: "background-color 150ms ease, border-color 150ms ease",
                    }}
                  >
                    <div className="ftp-title">{t.topic}</div>
                    {t.topicLocal && (
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--hue-deep)", fontFamily: "var(--font-regional)" }}>{t.topicLocal}</div>
                    )}
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>PIO: {t.department}</div>
                    <div style={{ marginTop: 6 }}>
                      <Pill style={{ background: "var(--hue-tint)", color: "var(--hue-deep)" }}>
                        Fee: <span className="ftp-num">₹{String(t.feeAmount ?? "").replace(/^\s*(₹|Rs\.?)\s*/i, "") || "0"}</span>
                      </Pill>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Selected template */}
          {selectedTpl && (
            <Section title="Your RTI application" emoji="📝">
              <Card tinted>
                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>To</BlockLabel>
                  <div className="ftp-body" style={{ whiteSpace: "pre-line" }}>
                    {selectedTpl.pioName && `${selectedTpl.pioName},\n`}{selectedTpl.pioAddress}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>Application text</BlockLabel>
                  <div style={{ background: "var(--ftp-surface)", border: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))", borderRadius: "var(--ftp-radius-tile)", padding: 12, fontFamily: "var(--ftp-font-sans)", fontSize: 13, lineHeight: "22px", fontWeight: 400, color: "var(--ftp-text)", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
                    {selectedTpl.templateText}
                  </div>
                </div>

                {selectedTpl.templateTextLocal && (
                  <div style={{ marginBottom: 12 }}>
                    <BlockLabel>{localHeading}</BlockLabel>
                    <div style={{ background: "var(--ftp-surface)", border: "1px solid color-mix(in srgb, var(--hue) 18%, var(--ftp-border))", borderRadius: "var(--ftp-radius-tile)", padding: 12, fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)", fontFamily: "var(--font-regional)", maxHeight: 160, overflowY: "auto" }}>
                      {selectedTpl.templateTextLocal}
                    </div>
                  </div>
                )}

                {/* Tip */}
                {selectedTpl.tips && (
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
                    <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 28, height: 28, fontSize: 15, borderRadius: 9 }}>
                      💡
                    </span>
                    <div>
                      <BlockLabel>Tip</BlockLabel>
                      <div className="ftp-body">{selectedTpl.tips}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="ftp-btn ftp-btn-primary"
                    style={{ ...BUTTON_BASE, color: "var(--ftp-surface)" }}
                  >
                    {copied ? <><Check size={14} aria-hidden /> Copied</> : <><Copy size={14} aria-hidden /> Copy text</>}
                  </button>
                  <a
                    href="https://rtionline.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ftp-btn ftp-btn-secondary"
                    style={BUTTON_SECONDARY}
                  >
                    File online <ExternalLink size={12} aria-hidden />
                  </a>
                </div>
              </Card>
            </Section>
          )}
        </div>
      )}

      <ModulePageFooter
        moduleSlug="rti"
        locale={locale}
        state={state}
        district={district}
        showCompare={false}
        sourceUrls={{ "RTI Online Portal": "https://rtionline.gov.in" }}
      />
    </div>
  );
}
