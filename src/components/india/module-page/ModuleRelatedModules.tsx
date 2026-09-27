/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Cross-link cards: 3–5 related modules at the bottom of every module
 * deep-dive page. Each card carries its own category colour (the v4 hue
 * of that category), the module emoji, its translated title and tagline.
 */

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  getIndiaModuleBySlug,
  getModuleRelatedSlugs,
  type IndiaModuleDef,
} from "@/lib/india/india-modules";
import { Section } from "@/components/district/ui";
import { indiaCategoryHue } from "./v4";
import { INDIA_NS, indiaText } from "../i18n";

interface Props {
  locale: string;
  module: IndiaModuleDef;
}

export default async function ModuleRelatedModules({ locale, module }: Props) {
  const [t, tp, ti] = await Promise.all([
    getTranslations({ locale, namespace: "page_india-module" }),
    getTranslations({ locale, namespace: INDIA_NS }),
    getTranslations({ locale, namespace: "india" }),
  ]);
  const x = indiaText(tp, ti);
  const related = getModuleRelatedSlugs(module)
    .map((s) => getIndiaModuleBySlug(s))
    .filter((m): m is IndiaModuleDef => Boolean(m));
  if (related.length === 0) return null;

  return (
    <Section title={t("related.title")} emoji="🧭">
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
        {related.map((m) => (
          <li key={m.slug} className={indiaCategoryHue(m.category)}>
            <Link
              href={`/${locale}/india/${m.slug}`}
              className="ftp-card-link"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                height: "100%",
                padding: "14px 16px",
                borderRadius: "var(--ftp-radius-card)",
                border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
                background: "linear-gradient(135deg, color-mix(in srgb, var(--hue) 8%, #fff) 0%, #fff 72%)",
                boxShadow: "var(--ftp-shadow-1)",
                textDecoration: "none",
                color: "var(--ftp-text)",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                  {m.icon}
                </span>
                <span className="ftp-display" style={{ fontSize: 15, fontWeight: 650, lineHeight: 1.3 }}>
                  {x.moduleTitle(m)}
                </span>
              </span>
              <span style={{ fontSize: 13, lineHeight: "19px", color: "var(--ftp-text-2)", flex: 1 }}>{x.moduleTagline(m)}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--hue-deep)" }}>
                {m.status === "live" ? x.status("live") : x.status("coming_soon")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
