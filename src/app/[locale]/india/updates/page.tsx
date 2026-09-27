/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * /[locale]/india/updates — Public Update Log.
 *
 * Transparency page showing every IndiaIndicator update with source +
 * as-of date + when we recorded it. Builds trust. Linked from the India
 * page and the module pages. Text from "page_india-updates".
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import IndiaUpdateLog from "@/components/india/IndiaUpdateLog";
import { hueClass } from "@/lib/design/hues";
import { ModulePage as PageFrame } from "@/components/district/ui";
import { languageAlternates } from "@/i18n/seo";

export const revalidate = 300; // 5 min — the update log is more dynamic than the main page

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_india-updates" });
  const alternates = languageAlternates("/india/updates", locale);
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates,
    openGraph: { url: alternates.canonical, title: t("meta.title"), description: t("meta.description") },
    robots: { index: true, follow: true },
  };
}

export default async function IndiaUpdatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_india-updates" });
  const hue = hueClass("update-log");

  return (
    // Design v4: the update log's module hue (slate), same as the district
    // update-log page, so the chips and the ring match.
    <main role="main" className={hue} style={{ minHeight: "100vh" }}>
      <PageFrame>
        <header style={{ marginBottom: 20 }}>
          <Link
            href={`/${locale}/india`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "var(--ftp-text-2)",
              textDecoration: "none",
              marginInlineStart: -8,
              padding: "6px 8px",
              minHeight: 44,
              borderRadius: 6,
            }}
          >
            <ArrowLeft size={14} aria-hidden="true" className="india-back-arrow" />
            {t("back")}
          </Link>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              marginTop: 8,
              padding: "clamp(18px, 3vw, 26px)",
              borderRadius: "var(--ftp-radius-card)",
              border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))",
              background:
                "radial-gradient(110% 90% at 100% 0%, color-mix(in srgb, var(--hue-pop) 30%, transparent) 0%, transparent 55%), linear-gradient(135deg, var(--hue-tint) 0%, #fff 72%)",
              boxShadow: "var(--ftp-shadow-1)",
            }}
          >
            <span aria-hidden className="ftp-emoji" style={{ position: "absolute", right: -10, bottom: -30, fontSize: 140, opacity: 0.08, pointerEvents: "none" }}>
              🕒
            </span>
            <div
              style={{
                display: "flex",
                width: "fit-content",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px 3px 6px",
                borderRadius: 999,
                background: "#fff",
                border: "1px solid color-mix(in srgb, var(--hue) 28%, var(--ftp-border))",
                color: "var(--hue-deep)",
                fontSize: 12,
                lineHeight: "18px",
                fontWeight: 600,
              }}
            >
              <span className="ftp-emoji" aria-hidden="true" style={{ fontSize: 14 }}>
                🕒
              </span>
              {t("chip")}
            </div>
            <h1 className="ftp-display" style={{ position: "relative", fontSize: "clamp(26px, 4vw, 34px)", lineHeight: 1.15, fontWeight: 650, color: "var(--ftp-text)", margin: "10px 0 6px" }}>
              {t("title")}
            </h1>
            <p style={{ position: "relative", fontSize: 15, color: "var(--ftp-text-2)", margin: 0, lineHeight: 1.6, maxWidth: 680 }}>{t("lead")}</p>
          </div>
        </header>

        <IndiaUpdateLog hueClassName={hue} />
      </PageFrame>
      <style>{`[dir="rtl"] .india-back-arrow { transform: scaleX(-1); }`}</style>
    </main>
  );
}
