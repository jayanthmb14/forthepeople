/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  LandWaterFooter — the end of the crops, farm, water and village-council
//  pages (layout v4.1, recipe step 7)
// ═══════════════════════════════════════════════════════════════════════
//
//    ℹ️ About this page   the plain paragraph search engines read (it used
//                         to sit at the top and pushed the answer down)
//    Sources              the kit SourcesFooter, with links and how often
//                         each source is refreshed
//    not-official line    the standing legal sentence
//    toolbar              CSV (when the page has rows) · WhatsApp · Copy
//                         link · Compare with another district
//
//  Every word comes from the page's own messages under "footer.*", so the
//  footer speaks the page's language: pass `ns="page_crops"` etc.
"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, GitCompare, Link2, MessageCircle } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton, type SourceEntry } from "@/components/district/ui";

export function LandWaterFooter({
  ns,
  about,
  sources,
  locale,
  district,
  moduleSlug,
  shareText,
  onCsv,
}: {
  /** The page's message namespace, e.g. "page_crops". */
  ns: string;
  /** One plain paragraph about the page (already translated). */
  about: string;
  sources: SourceEntry[];
  locale: string;
  district: string;
  moduleSlug: string;
  /** One line for the WhatsApp message (already translated). */
  shareText: string;
  onCsv?: () => void;
}) {
  const t = useTranslations(ns);
  const [copied, setCopied] = useState(false);
  const pageUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  function shareWhatsApp() {
    const text = `${shareText}\n\n${pageUrl()}\n#ForThePeople`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / insecure page): the address bar still has the link.
    }
  }

  const compareHref = `/${locale}/compare?module=${encodeURIComponent(moduleSlug)}&a=${encodeURIComponent(district)}`;

  return (
    <footer style={{ marginTop: 36 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          padding: "14px 16px",
          borderRadius: "var(--ftp-radius-card)",
          background: "var(--ftp-surface)",
          border: "1px solid var(--ftp-border)",
        }}
      >
        <span className="ftp-emoji" aria-hidden style={{ fontSize: 20, lineHeight: "22px" }}>
          ℹ️
        </span>
        <div className="ftp-prose" style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 700, color: "var(--ftp-text)" }}>{t("footer.aboutTitle")}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: "22px", color: "var(--ftp-text-2)" }}>{about}</p>
        </div>
      </div>

      <SourcesFooter defaultOpen sources={sources} />
      <p style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", margin: "10px 0 0" }}>{t("footer.notOfficial")}</p>

      <Toolbar label={t("footer.actions")}>
        {onCsv && (
          <ToolbarButton icon={Download} onClick={onCsv}>
            {t("footer.csv")}
          </ToolbarButton>
        )}
        <ToolbarButton icon={MessageCircle} onClick={shareWhatsApp}>
          {t("footer.whatsapp")}
        </ToolbarButton>
        <ToolbarButton icon={copied ? Check : Link2} onClick={copyLink}>
          <span aria-live="polite">{copied ? t("footer.copied") : t("footer.copy")}</span>
        </ToolbarButton>
        <ToolbarButton icon={GitCompare} href={compareHref}>
          {t("footer.compare")}
        </ToolbarButton>
      </Toolbar>
    </footer>
  );
}
