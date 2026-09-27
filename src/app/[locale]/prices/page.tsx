/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /[locale]/prices — "Prices today"
// ═══════════════════════════════════════════════════════════════════════
//
//  The question it answers: "What do gold, silver, the dollar, crude oil and
//  the share market cost today, and are they going up or down?"
//
//  One card per price (gold 24K and 22K per gram, silver per kg, USD/INR,
//  Brent crude per barrel, Sensex, Nifty 50, Nifty Bank) with:
//    • the latest value and its unit in words,
//    • the change since the previous trading day,
//    • one plain sentence ("24 carat gold is ₹15,211 per gram today, down
//      6.1% in a month"),
//    • a 3-month line and "before → now" for 1 week / 1 month / 3 months,
//    • the source, the "as of" time and a link to check it,
//    • a calm amber note when the newest value is older than a few days.
//  At the bottom: "Check these prices yourself" (the verification section),
//  why petrol and diesel are not shown, that this is not advice, and the
//  All-India supporters line (after the data, never above it).
//
//  Server component, no client JavaScript except the supporters line: the
//  data comes from src/lib/markets/prices.ts through Next's data cache, and
//  the page is re-generated at most every 15 minutes (ISR). A price whose source failed shows "We could not
//  get this price just now" — never an old or invented number.
//
//  Text: "page_prices" messages. Numbers use Indian grouping (en-IN) in
//  every language; dates use the reader's language.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PlainPageHeader from "@/components/site/PlainPageHeader";
import NationalSupporters from "@/components/support/NationalSupporters";
import PriceCard from "@/components/prices/PriceCard";
import { makePriceViewBuilder } from "@/components/prices/price-view";
import { ModulePage, Section } from "@/components/district/ui";
import { getPricesSnapshot, PRICE_ITEMS, type PriceGroup } from "@/lib/markets/prices";
import { languageAlternates } from "@/i18n/seo";

export const revalidate = 900; // 15 min, the same as the snapshot's market-hours cache

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "page_prices" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/prices", locale),
    openGraph: { url: `${BASE_URL}/${locale}/prices` },
  };
}

const GROUPS: Array<{ key: PriceGroup; title: string }> = [
  { key: "metals", title: "groupMetals" },
  { key: "money", title: "groupMoney" },
  { key: "shares", title: "groupShares" },
];

const NOTE: React.CSSProperties = { margin: "8px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--ftp-text-2)", maxWidth: "72ch" };

export default async function PricesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_prices" });
  // Next's data cache, not Redis, so this page stays statically generated.
  const snap = await getPricesSnapshot({ revalidate: 900 });
  const build = makePriceViewBuilder(t, locale);
  const anyData = Object.keys(snap.series).length > 0;
  const b = (c: React.ReactNode) => <strong style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{c}</strong>;

  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)", paddingBottom: 48 }}>
      <ModulePage>
        <PlainPageHeader title={t("title")} description={t("description")} backHref={`/${locale}`} />

        {!anyData ? (
          <div role="status" style={{ background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-card)", padding: 20 }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, fontWeight: 600, color: "var(--ftp-text)" }}>{t("allMissingTitle")}</p>
            <p style={{ ...NOTE, marginTop: 4 }}>{t("allMissingBody")}</p>
          </div>
        ) : (
          GROUPS.map((g) => (
            <Section key={g.key} title={t(g.title)} id={g.key}>
              <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "300px", alignItems: "stretch" } as React.CSSProperties}>
                {PRICE_ITEMS.filter((i) => i.group === g.key).map((item) => (
                  <PriceCard key={item.key} view={build(item, snap.series[item.key])} />
                ))}
              </div>
              {g.key === "metals" && <p style={NOTE}>{t("shopNote")}</p>}
            </Section>
          ))
        )}

        {/* ── Verification: where to check every number ─────────────── */}
        <Section title={t("verifyTitle")} id="verify">
          <div
            style={{
              background: "var(--ftp-surface)",
              border: "1px solid var(--ftp-border)",
              borderRadius: "var(--ftp-radius-card)",
              padding: 16,
            }}
          >
            <p style={{ ...NOTE, margin: 0, color: "var(--ftp-text)" }}>{t("verifyIntro")}</p>
            <ul style={{ margin: "8px 0 0", paddingInlineStart: 20, display: "grid", gap: 6, fontSize: 14, lineHeight: 1.6, color: "var(--ftp-text-2)" }}>
              <li>{t.rich("verifyIbja", { b })}</li>
              <li>{t.rich("verifyBse", { b })}</li>
              <li>{t.rich("verifyNse", { b })}</li>
              <li>{t.rich("verifyRbi", { b })}</li>
              <li>{t.rich("verifyYahoo", { b })}</li>
            </ul>
            <p style={NOTE}>{t("verifyCadence")}</p>
            <p style={NOTE}>{t("noFuel")}</p>
            <p style={NOTE}>{t("notAdvice")}</p>
          </div>
        </Section>

        {/* Supporters come after the data (renders nothing when there are none). */}
        <NationalSupporters style={{ marginTop: 24 }} />
      </ModulePage>
    </main>
  );
}
