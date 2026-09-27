/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// The end of a daily-needs page (docs/LAYOUT.md step 7), translated:
//   Sources list → "not an official website" line → related news →
//   WhatsApp / Copy link / Compare buttons.
// Text comes from the page's own messages under `end.*`
// (page_jjm.json → end.notOfficial, end.whatsapp …), so every page file
// carries the same small block and nothing here is typed in English.
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Check, Link2, MessageCircle } from "lucide-react";
import { SourcesFooter, Toolbar, ToolbarButton } from "@/components/district/ui";
import ModuleNews from "@/components/district/ModuleNews";
import { getModuleSources } from "@/lib/constants/state-config";

/** Refresh frequency from getModuleSources → key under end.freq. */
const FREQ_KEY: Record<string, string> = {
  Monthly: "monthly",
  Weekly: "weekly",
  Daily: "daily",
  Annual: "annual",
  Quarterly: "quarterly",
  "When the source publishes": "onPublish",
};

export default function PageEnd({
  ns,
  module,
  locale,
  state,
  district,
  shareText,
  extraSources = [],
}: {
  /** The page's message namespace, e.g. "page_jjm". */
  ns: string;
  module: string;
  locale: string;
  state: string;
  district: string;
  /** One translated sentence for WhatsApp. */
  shareText: string;
  /** Sources this page reads besides the module's own (e.g. offices for hospitals). */
  extraSources?: Array<{ name: string; url?: string }>;
}) {
  const t = useTranslations(ns);
  const [copied, setCopied] = useState(false);
  const info = getModuleSources(module, state);
  const freqKey = FREQ_KEY[info.frequency];
  const frequency = freqKey ? t(`end.freq.${freqKey}`) : info.frequency;

  const onWhatsApp = () => {
    const url = window.location.href;
    const text = `${shareText}\n\n${url}\n#ForThePeople`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard blocked: nothing to do. */
    }
  };

  return (
    <>
      <SourcesFooter
        defaultOpen
        sources={[
          ...info.sources.map((name) => ({ name, frequency })),
          ...extraSources.map((s) => ({ name: s.name, url: s.url })),
        ]}
      />
      <p style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", margin: "10px 0 0" }}>{t("end.notOfficial")}</p>
      <ModuleNews district={district} state={state} locale={locale} module={module} />
      <Toolbar label={t("end.actions")}>
        <ToolbarButton icon={MessageCircle} onClick={onWhatsApp} ariaLabel={t("end.whatsappAria")}>
          {t("end.whatsapp")}
        </ToolbarButton>
        <ToolbarButton icon={copied ? Check : Link2} onClick={onCopy}>
          <span aria-live="polite">{copied ? t("end.copied") : t("end.copy")}</span>
        </ToolbarButton>
        <ToolbarButton
          icon={ArrowLeftRight}
          href={`/${locale}/compare?module=${encodeURIComponent(module)}&a=${encodeURIComponent(district)}`}
        >
          {t("end.compare")}
        </ToolbarButton>
      </Toolbar>
    </>
  );
}
