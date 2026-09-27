/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /about — Design v4.1 (docs/LAYOUT.md recipe)
// ═══════════════════════════════════════════════════════════════════════
//  The question it answers: "What is this site, who made it, and can I
//  trust it?"
//
//  <ModulePage> frame (full width on phones and tablets, 1320 px on laptop
//  / PC; running text keeps a 72-character measure with .ftp-prose):
//    SiteHeader band (brand blue) → the answer in one sentence (Explainer,
//    from the registry counts) → four emoji tiles → the picture: live
//    districts per state as bars, one colour per state → mission: the
//    long-form introduction (its wording is kept: search engines and AI
//    crawlers quote it), then the mission and the builder side by side →
//    what we stand for (one colour per pillar, 1–3 across) → sources (each
//    with its own emoji, 1–3 across) → pledge beside the disclaimer → two
//    buttons. Text: "page_about" messages; state names from "states".
//
//  Served at /<locale>/about through src/app/[locale]/about/page.tsx.

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { Card, ModulePage, Section, StatStrip, StatTile } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList } from "@/components/site/SiteVisuals";
import { HUE_HEX, type Hue } from "@/lib/design/hues";
import { INDIA_STATES } from "@/lib/constants/districts";
import { getPlatformFacts } from "@/lib/platform-facts";
import { languageAlternates } from "@/i18n/seo";

// Every count on this page comes from the registry (issue #36) — never type
// "9 districts" or "29 modules" by hand here again.
const FACTS = getPlatformFacts();

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

type Props = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const t = await getTranslations({ locale, namespace: "page_about" });
  return {
    title: { absolute: t("metaTitle") },
    description: t("metaDescription", { live: FACTS.activeDistricts, states: FACTS.activeStates, total: FACTS.totalIndiaDistricts }),
    alternates: languageAlternates("/about", locale),
    openGraph: {
      url: `${BASE_URL}/${locale}/about`,
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

// Each pillar has one emoji and its own hue, so the six cards read as a
// colourful set rather than six identical boxes.
const PILLARS: { key: string; emoji: string; hue: Hue }[] = [
  { key: "data", emoji: "📊", hue: "blue" },
  { key: "reach", emoji: "🗺️", hue: "green" },
  { key: "lang", emoji: "🗣️", hue: "violet" },
  { key: "time", emoji: "🕰️", hue: "amber" },
  { key: "free", emoji: "🔓", hue: "teal" },
  { key: "rti", emoji: "📜", hue: "indigo" },
];

// Portal names are proper nouns; the one-line descriptions are translated.
// Sept 2026 audit: this list must name the sources the collectors actually
// read. Removed: India-WRIS (not used — dam levels come from Karnataka's
// Water Resources Department, src/scraper/jobs/dams.ts), IMD (weather is
// OpenWeatherMap with Open-Meteo as the fallback, src/scraper/jobs/weather.ts)
// and the National Scholarship Portal (no collector; schemes come from
// myScheme, src/scraper/jobs/schemes.ts). Added the price and news sources.
const DATA_SOURCES: { name: string; key: string; emoji: string; url: string }[] = [
  { name: "AGMARKNET", key: "agmarknet", emoji: "🌾", url: "https://agmarknet.gov.in" },
  { name: "Karnataka Water Resources Department", key: "kwrd", emoji: "💧", url: "https://water.karnataka.gov.in" },
  { name: "OpenWeatherMap", key: "owm", emoji: "🌦️", url: "https://openweathermap.org" },
  { name: "Election Commission of India", key: "eci", emoji: "🗳️", url: "https://eci.gov.in" },
  { name: "eGramSwaraj / PFMS", key: "egram", emoji: "🏘️", url: "https://egramswaraj.gov.in" },
  { name: "UDISE+", key: "udise", emoji: "🎓", url: "https://udiseplus.gov.in" },
  { name: "myScheme", key: "myscheme", emoji: "🎒", url: "https://www.myscheme.gov.in" },
  { name: "PMAY-G / PMAY-U", key: "pmay", emoji: "🏠", url: "https://pmayg.nic.in" },
  { name: "IBJA", key: "ibja", emoji: "🪙", url: "https://www.ibjarates.com" },
  { name: "PPAC / BPCL", key: "fuel", emoji: "⛽", url: "https://ppac.gov.in" },
  { name: "Yahoo Finance", key: "yahoo", emoji: "📈", url: "https://finance.yahoo.com" },
  { name: "Google News", key: "news", emoji: "📰", url: "https://news.google.com" },
];

/** One colour per state row in the "where we are live" bars. */
const STATE_ROW_HUES: Hue[] = ["blue", "green", "violet", "amber", "teal", "rose", "indigo", "orange", "cyan", "pink"];

/** Two cards side by side from 840 px up (auto-fit: one card fills the row alone). */
const PAIR: React.CSSProperties = {
  display: "grid",
  gap: 16,
  alignItems: "start",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))",
};

/** Body text at the reading size used across this page (15/24, text-2). */
const READ: React.CSSProperties = { fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", margin: 0 };

/** Inline text link in the page hue. */
const INLINE_LINK: React.CSSProperties = { color: "var(--hue-deep)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 2 };

/** Shared button box (height, padding, radius, type). */
const BUTTON: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  padding: "0 20px",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
};

export default async function AboutPage({ params }: Props) {
  const locale = (await params).locale ?? "en";
  setRequestLocale(locale);
  const [t, tStates] = await Promise.all([
    getTranslations({ locale, namespace: "page_about" }),
    getTranslations({ locale, namespace: "states" }),
  ]);
  const b = (c: React.ReactNode) => <strong style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{c}</strong>;
  const { activeDistricts: d, activeStates: s, totalIndiaDistricts: total, modulesPerDistrict } = FACTS;
  const coverage = t("coverage", { d, s });

  // The picture: live districts per state, straight from the registry.
  const liveByState = INDIA_STATES.map((st) => ({
    slug: st.slug,
    name: tStates.has(st.slug) ? tStates(st.slug) : st.name,
    districts: st.districts.filter((x) => x.active).map((x) => x.name),
  }))
    .filter((st) => st.districts.length > 0)
    .sort((a, b2) => b2.districts.length - a.districts.length);
  const topState = liveByState[0];
  const allEven = liveByState.every((st) => st.districts.length === topState?.districts.length);

  return (
    <main className="ftp-hue-blue" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <ModulePage>
        {/* ── Header ─────────────────────────────────────────────── */}
        <SiteHeader emoji="📖" icon={Info} title={t("title")} description={t("description")} backHref={`/${locale}`} />

        {/* ── The answer in one sentence + the numbers. Counts come from
               getPlatformFacts() (registry-derived), never typed here. ── */}
        <Explainer>{t.rich("glanceSimple", { d, s, total, b })}</Explainer>
        <StatStrip cols={4}>
          <StatTile emoji="🏙️" label={t("tileLive")} value={d} sub={t("tileLiveSub", { s })} />
          <StatTile emoji="🗺️" label={t("tilePlanned")} value={total} />
          <StatTile emoji="🧩" label={t("tileModules")} value={modulesPerDistrict} />
          <StatTile emoji="🆓" label={t("tileCost")} value={t("tileCostValue")} />
        </StatStrip>

        {/* ── The picture: live districts per state, one colour per state ── */}
        {topState && (
          <div style={{ marginTop: 16 }}>
            <ChartCard
              title={t("whereTitle")}
              emoji="📍"
              units={t("whereUnits")}
              simple={
                allEven
                  ? t("whereSimpleEven", { n: topState.districts.length })
                  : t.rich("whereSimple", { state: topState.name, n: topState.districts.length, b })
              }
              source={{ label: t("whereSource") }}
              table={liveByState.map((st) => ({ label: st.name, value: st.districts.join(", ") }))}
            >
              <BarList
                height={12}
                rows={liveByState.map((st, i) => {
                  const hex = HUE_HEX[STATE_ROW_HUES[i % STATE_ROW_HUES.length]];
                  return {
                    key: st.slug,
                    label: (
                      <>
                        <span style={{ fontWeight: 600 }}>{st.name}</span>
                        <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{st.districts.join(", ")}</span>
                      </>
                    ),
                    value: st.districts.length,
                    display: t("whereDistricts", { n: st.districts.length }),
                    color: `linear-gradient(90deg, ${hex.pop}, ${hex.hue})`,
                  };
                })}
              />
            </ChartCard>
          </div>
        )}

        {/* ── Mission: the introduction, then the mission beside the builder ── */}
        <Section title={t("missionTitle")} emoji="🎯">
          <p className="ftp-prose" style={{ ...READ, marginBottom: 16 }}>{t("intro", { coverage, total })}</p>
          <div style={PAIR}>
            <Card tinted padding={24}>
              <p className="ftp-display" style={{ margin: 0, fontSize: 19, lineHeight: 1.5, fontWeight: 600, color: "var(--hue-deep)" }}>
                {t("mission")}
              </p>
            </Card>
            {/* Builder — E-E-A-T expertise signal */}
            <Card padding={20} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 44, height: 44, fontSize: 22, borderRadius: 14 }}>
                🧑‍💻
              </span>
              <div style={{ minWidth: 0 }}>
                <h3 className="ftp-display" style={{ margin: 0, fontSize: 13, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text-2)" }}>
                  {t("builderTitle")}
                </h3>
                <p className="ftp-title" style={{ fontWeight: 600, marginTop: 2 }}>{t("builderName")}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{t("builderBio")}</p>
              </div>
            </Card>
          </div>
        </Section>

        {/* ── Pillars ────────────────────────────────────────────── */}
        <Section title={t("pillarsTitle")} emoji="🧭">
          <div className="ftp-grid" style={{ gap: 12, ["--ftp-grid-min" as string]: "300px" } as React.CSSProperties}>
            {PILLARS.map((p) => (
              <div key={p.key} className={`ftp-hue-${p.hue}`}>
                <Card as="article" tinted padding={20} style={{ height: "100%" }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                    {p.emoji}
                  </span>
                  <h3 className="ftp-display" style={{ margin: "12px 0 0", fontSize: 17, lineHeight: 1.4, fontWeight: 650, color: "var(--hue-deep)" }}>
                    {t(`pillar_${p.key}_title`)}
                  </h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 6 }}>
                    {t(`pillar_${p.key}_desc`, { coverage, total })}
                  </p>
                </Card>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Data sources ───────────────────────────────────────── */}
        <Section title={t("sourcesTitle")} emoji="🏛️">
          <p className="ftp-prose" style={{ ...READ, marginBottom: 16 }}>{t.rich("sourcesBody", { b })}</p>
          <ul className="ftp-grid" style={{ listStyle: "none", margin: 0, padding: 0, gap: 8, ["--ftp-grid-min" as string]: "300px" } as React.CSSProperties}>
            {DATA_SOURCES.map((src) => (
              <Card key={src.key} as="li" padding={12} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                  {src.emoji}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, minHeight: 32, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                  >
                    {src.name}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                  <span className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t(`src_${src.key}`)}</span>
                </span>
              </Card>
            ))}
          </ul>
        </Section>

        {/* ── Pledge beside the disclaimer (a warning keeps the semantic warn colour) ── */}
        <div style={{ ...PAIR, marginTop: 32 }}>
          <Card tinted padding={20}>
            <h2 className="ftp-display" style={{ margin: "0 0 10px", display: "flex", alignItems: "center", gap: 10, fontSize: 18, lineHeight: 1.35, fontWeight: 650 }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                🤝
              </span>
              {t("pledgeTitle")}
            </h2>
            <p style={{ ...READ, marginBottom: 12 }}>
              {t.rich("pledge1", {
                link: (c) => (
                  <Link href={`/${locale}/karnataka/mandya/data-sources`} style={INLINE_LINK}>
                    {c}
                  </Link>
                ),
              })}
            </p>
            <p style={READ}>
              {t.rich("pledge2", {
                link: (c) => (
                  <Link href={`/${locale}/contribute`} style={INLINE_LINK}>
                    {c}
                  </Link>
                ),
              })}
            </p>
          </Card>
          <Card padding={20} style={{ display: "flex", gap: 12, alignItems: "flex-start", borderColor: "color-mix(in srgb, var(--ftp-warn) 35%, var(--ftp-border))" }}>
            <AlertTriangle size={18} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="ftp-label" style={{ color: "var(--ftp-warn)" }}>{t("disclaimerTitle")}</p>
              <p className="ftp-body" style={{ color: "var(--ftp-text)", marginTop: 6 }}>
                {t.rich("disclaimerBody", { b: (c) => <strong style={{ fontWeight: 600 }}>{c}</strong> })}
              </p>
            </div>
          </Card>
        </div>

        {/* ── Calls to action ────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
          <Link href={`/${locale}`} className="ftp-btn ftp-btn-primary" style={{ ...BUTTON, border: "1px solid var(--hue)", color: "#fff" }}>
            <span className="ftp-emoji" aria-hidden>📍</span>
            {t("ctaExplore")}
          </Link>
          <Link
            href={`/${locale}/contribute`}
            className="ftp-btn ftp-btn-secondary"
            style={{ ...BUTTON, background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", color: "var(--ftp-text)" }}
          >
            <span className="ftp-emoji" aria-hidden>🙌</span>
            {t("ctaContribute")}
          </Link>
        </div>
      </ModulePage>
    </main>
  );
}
