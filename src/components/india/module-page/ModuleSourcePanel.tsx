/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Every source the module cites: its official name and link (proper
 * nouns, shown as published), what kind of source it is and how often it
 * updates (translated). The one-line blurbs come from the source registry
 * and stay in English (reference text), marked lang="en".
 *
 * Sept 2026 audit: when the page shows figures, the panel lists the
 * sources OF THOSE FIGURES (each row's own source and link), not the
 * registry's planned sources — the population page showed UN and World
 * Bank figures under "Sources: Census of India, MoSPI". The registry list
 * is shown only while the module has no figures yet.
 */

import type * as React from "react";
import { getTranslations } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { INDIA_SOURCES } from "@/lib/india/india-sources";
import { Section } from "@/components/district/ui";

interface Props {
  locale: string;
  module: IndiaModuleDef;
  moduleTitle: string;
  /** Distinct sources of the figures on the page (rows with a value), in display order. */
  figureSources?: Array<{ label: string; href: string | null }>;
}

const TYPE_EMOJI: Record<string, string> = {
  API: "🔌",
  Static: "📘",
  Collected: "📑",
  RSS: "📰",
  Institutional: "🏛️",
};

const LIST_STYLE: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-card)",
  boxShadow: "var(--ftp-shadow-1)",
  overflow: "hidden",
};

export default async function ModuleSourcePanel({ locale, module, moduleTitle, figureSources = [] }: Props) {
  const t = await getTranslations({ locale, namespace: "page_india-module" });
  if (figureSources.length > 0) {
    return (
      <Section title={t("sources.title", { module: moduleTitle })} emoji="📚">
        <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)" }}>{t("sources.ofFigures")}</p>
        <ul style={LIST_STYLE}>
          {figureSources.map((s, idx) => (
            <li
              key={`${s.label}|${s.href ?? ""}`}
              style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderTop: idx === 0 ? "none" : "1px solid var(--ftp-border)" }}
            >
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 15, borderRadius: 10 }}>
                📑
              </span>
              {s.href ? (
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  lang="en"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--hue-deep)", fontWeight: 600, fontSize: 14, lineHeight: "20px", textDecoration: "none", minWidth: 0 }}
                >
                  <span>{s.label}</span>
                  <ExternalLink size={12} aria-hidden style={{ flexShrink: 0 }} />
                </a>
              ) : (
                <span lang="en" style={{ fontWeight: 600, fontSize: 14, lineHeight: "20px", color: "var(--ftp-text)" }}>
                  {s.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  const rows = module.sources
    .map((s) => ({ s, src: INDIA_SOURCES[s.sourceKey] }))
    .filter((r) => Boolean(r.src));
  if (rows.length === 0) return null;

  return (
    <Section title={t("sources.title", { module: moduleTitle })} emoji="📚">
      <ul style={LIST_STYLE}>
        {rows.map(({ s, src }, idx) => (
          <li
            key={s.sourceKey}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderTop: idx === 0 ? "none" : "1px solid var(--ftp-border)",
            }}
          >
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 17, borderRadius: 11 }}>
              {TYPE_EMOJI[s.type] ?? "📄"}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <a
                href={src!.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--hue-deep)", fontWeight: 650, fontSize: 14, textDecoration: "none" }}
              >
                {src!.name}
                <ExternalLink size={12} aria-hidden />
              </a>
              {src!.blurb ? (
                <p lang="en" style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)" }}>
                  {src!.blurb}
                </p>
              ) : null}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                <span className="india-src-tag">{t(`sources.type.${s.type}`)}</span>
                <span className="india-src-tag">{t(`sources.refresh.${s.refresh}`)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <style>{`
        .india-src-tag { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 999px; font-size: 12px; line-height: 18px; background: var(--hue-tint); color: var(--hue-deep); font-weight: 500; }
      `}</style>
    </Section>
  );
}
