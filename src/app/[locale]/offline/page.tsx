/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Lives under [locale] (route: /en/offline) so the service worker can
// precache a real 200 page; see public/sw.js. Rendered inside the locale
// layout (header + footer), hence 60vh rather than a full-screen block.
//
// Design v4 "Rang": a friendly dead end in the quiet slate hue — a big
// emoji in a tinted tile, the display face for the heading, and honest
// copy (the site shows published government data with dates, not "live"
// data). No motion: this page may be shown on a slow, flaky connection.
// Text: "page_offline" messages.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_offline" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function OfflinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_offline" });
  return (
    <div
      className="ftp-hue-slate"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ftp-bg)",
        padding: "24px 16px",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        className="ftp-icon-chip ftp-emoji"
        style={{ width: 88, height: 88, borderRadius: 26, fontSize: 44, marginBottom: 18 }}
      >
        📡
      </div>
      <h1 className="ftp-display" style={{ margin: "0 0 8px", fontSize: 30, lineHeight: 1.3, fontWeight: 700, color: "var(--ftp-text)" }}>
        {t("title")}
      </h1>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", maxWidth: 400 }}>{t("body")}</p>
    </div>
  );
}
