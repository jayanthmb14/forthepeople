"use client";

// The population page's disclosure panel. Headings and buttons follow the
// page language (page_population.disclosure.titles / toggle). The legal
// body text is English only (page_population.disclosure.bodies exists in
// en and is not translated), so in any other language the panel opens
// with a note that the English text is the official one.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DemographicDisclaimerProps {
  districtName?: string;
  electionModeActive?: boolean;
  defaultOpen?: boolean;
}

type SectionKey =
  | "about"
  | "caste"
  | "childSexRatio"
  | "dataCurrency"
  | "electionMode"
  | "methodology"
  | "religion";

const SECTION_KEYS: SectionKey[] = ["about", "caste", "childSexRatio", "dataCurrency", "electionMode", "methodology", "religion"];

export default function DemographicDisclaimer({
  districtName,
  electionModeActive = false,
  defaultOpen = false,
}: DemographicDisclaimerProps) {
  const t = useTranslations("page_population.disclosure");
  const locale = useLocale();
  const [panelOpen, setPanelOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set());

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sections = SECTION_KEYS.filter((k) => k !== "electionMode" || electionModeActive);

  // Design v3 chrome: a plain Card-style panel (surface, 1 px border,
  // 12 px radius, no tint). Toggle rows are at least 44 px tall so they are
  // easy to tap on a phone. The legal text is unchanged.
  return (
    <div
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        padding: "0 16px",
        marginBottom: 16,
        fontSize: 13,
        lineHeight: "20px",
        color: "var(--ftp-text)",
      }}
    >
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        style={{
          background: "transparent",
          border: "none",
          padding: "12px 0",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontFamily: "var(--ftp-font-sans)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ftp-text)",
          width: "100%",
          textAlign: "left",
        }}
      >
        {panelOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
        <span className="ftp-emoji" aria-hidden>⚖️</span>
        <span>{districtName ? t("toggleFor", { district: districtName }) : t("toggle")}</span>
      </button>

      {panelOpen && (
        <div style={{ paddingBottom: 4, borderTop: "1px solid var(--ftp-border)" }}>
          {locale !== "en" && (
            <p style={{ margin: "10px 0 2px", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>{t("englishNote")}</p>
          )}
          {sections.map((key, i) => {
            const open = expanded.has(key);
            return (
              <div key={key} style={{ borderBottom: i < sections.length - 1 ? "1px solid var(--ftp-border)" : "none" }}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-expanded={open}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "10px 0",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontFamily: "var(--ftp-font-sans)",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ftp-text)",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                  <span>{t(`titles.${key}`)}</span>
                </button>
                {open && (
                  <div
                    lang="en"
                    style={{
                      padding: "0 0 12px 20px",
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "var(--ftp-text-2)",
                    }}
                  >
                    <p>{t(`bodies.${key}`)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
