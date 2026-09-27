/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// File RTI page — Design v3 "Civic Ledger" module template.
// A citizen picks a topic, sees the ready-made RTI application (English +
// local language when we have it), copies it and files it online.
// Templates come from useRTI() → data.templates (only `active` ones shown).

"use client";
import type React from "react";
import { use, useState } from "react";
import { FileText, Copy, Check, ExternalLink, Lightbulb } from "lucide-react";
import { useRTI } from "@/hooks/useRealtimeData";
import { PageHeader, Section, Card, Pill, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import { getDistrict } from "@/lib/constants/districts";

/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 32, maxWidth: "var(--ftp-reading-max)" };

/** Shared 44 px button shape (easy to tap on phones). */
const BUTTON_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 16px",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

/** Small uppercase label above a block (11 px, text-2). */
function BlockLabel({ children }: { children: React.ReactNode }) {
  return <div className="ftp-label" style={{ marginBottom: 4 }}>{children}</div>;
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
          title={`No RTI templates yet for ${districtName}.`}
          body="You can still file an RTI with any central government office on the official RTI Online portal."
          action={
            <a href="https://rtionline.gov.in" target="_blank" rel="noopener noreferrer" style={{ ...BUTTON_BASE, border: "1px solid var(--ftp-border)", background: "var(--ftp-surface)", color: "var(--ftp-text)" }}>
              File Online <ExternalLink size={12} aria-hidden />
            </a>
          }
        />
      )}

      {!isLoading && templates.length > 0 && (
        // One column on phones; two side by side once a template is open on wider screens.
        <div style={{ display: "grid", gridTemplateColumns: selected ? "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" : "1fr", gap: 24, alignItems: "start" }}>
          {/* Template list */}
          <Section title="Choose Topic">
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
                      background: isActive ? "var(--ftp-brand-tint)" : "var(--ftp-surface)",
                      border: `1px solid ${isActive ? "var(--ftp-brand)" : "var(--ftp-border)"}`,
                      color: "var(--ftp-text)",
                      fontFamily: "var(--ftp-font-sans)",
                    }}
                  >
                    <div className="ftp-title">{t.topic}</div>
                    {t.topicLocal && (
                      <div style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", fontFamily: "var(--font-regional)" }}>{t.topicLocal}</div>
                    )}
                    <div className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 2 }}>PIO: {t.department}</div>
                    <div style={{ marginTop: 6 }}>
                      <Pill>
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
            <Section title="RTI Application">
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>To</BlockLabel>
                  <div className="ftp-body" style={{ whiteSpace: "pre-line" }}>
                    {selectedTpl.pioName && `${selectedTpl.pioName},\n`}{selectedTpl.pioAddress}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <BlockLabel>Application text</BlockLabel>
                  <div className="ftp-num" style={{ background: "var(--ftp-surface-2)", borderRadius: "var(--ftp-radius-tile)", padding: 12, fontSize: 13, lineHeight: "22px", fontWeight: 400, color: "var(--ftp-text)", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>
                    {selectedTpl.templateText}
                  </div>
                </div>

                {selectedTpl.templateTextLocal && (
                  <div style={{ marginBottom: 12 }}>
                    <BlockLabel>{localHeading}</BlockLabel>
                    <div style={{ background: "var(--ftp-surface-2)", borderRadius: "var(--ftp-radius-tile)", padding: 12, fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)", fontFamily: "var(--font-regional)", maxHeight: 160, overflowY: "auto" }}>
                      {selectedTpl.templateTextLocal}
                    </div>
                  </div>
                )}

                {/* Tip — semantic colour on the icon only, no tinted box. */}
                {selectedTpl.tips && (
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
                    <Lightbulb size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
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
                    style={{ ...BUTTON_BASE, background: "var(--ftp-brand)", color: "var(--ftp-surface)", border: "none" }}
                  >
                    {copied ? <><Check size={14} aria-hidden /> Copied!</> : <><Copy size={14} aria-hidden /> Copy Text</>}
                  </button>
                  <a
                    href="https://rtionline.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ftp-btn-secondary"
                    style={{ ...BUTTON_BASE, background: "var(--ftp-surface)", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}
                  >
                    File Online <ExternalLink size={12} aria-hidden />
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
