/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * What is planned next for this module. The registry may list
 * module-specific features (`comingSoonFeatures`, English reference
 * text); otherwise three translated defaults are shown.
 *
 * The old "Vote to prioritise" link pointed at an #india-vote anchor that
 * no page has, so it is gone until a vote form exists.
 */

import { getTranslations } from "next-intl/server";
import type { IndiaModuleDef } from "@/lib/india/india-modules";
import { Section } from "@/components/district/ui";

interface Props {
  locale: string;
  module: IndiaModuleDef;
  moduleTitle: string;
}

const DEFAULT_EMOJI = ["⏳", "🗺️", "⬇️"];

export default async function ModuleComingSoonRail({ locale, module, moduleTitle }: Props) {
  const t = await getTranslations({ locale, namespace: "page_india-module" });
  const features: Array<{ text: string; lang?: string }> =
    module.comingSoonFeatures && module.comingSoonFeatures.length > 0
      ? module.comingSoonFeatures.map((text) => ({ text, lang: "en" }))
      : [{ text: t("next.f1") }, { text: t("next.f2") }, { text: t("next.f3") }];

  return (
    <Section title={t("next.title", { module: moduleTitle })} emoji="🛠️">
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
          gap: 12,
        }}
      >
        {features.map((f, i) => (
          <li
            key={f.text}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: "14px 16px",
              borderRadius: "var(--ftp-radius-card)",
              border: "1px dashed color-mix(in srgb, var(--hue) 35%, var(--ftp-border))",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 5%, #fff) 0%, #fff 70%)",
            }}
          >
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 17, borderRadius: 11 }}>
              {DEFAULT_EMOJI[i % DEFAULT_EMOJI.length]}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--hue-deep)", marginBottom: 2 }}>{t("next.tag")}</span>
              <span lang={f.lang} style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>
                {f.text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
