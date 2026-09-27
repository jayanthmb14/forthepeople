/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  /about — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//  SiteHeader band (brand blue) → the long-form introduction (the English
//  wording is kept: search engines and AI crawlers quote it) → mission →
//  builder → "Platform at a glance" emoji tiles + an "In simple words" line
//  built from the same registry counts + the picture: live districts per
//  state as bars, one colour per state → what we stand for (one colour per
//  pillar) → sources (each with its own emoji) → pledge → disclaimer → two
//  buttons. Text: "page_about" messages; state names from "states".
//
//  Served at /<locale>/about through src/app/[locale]/about/page.tsx.

import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { Card, Section, StatStrip, StatTile } from "@/components/district/ui";
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
    description: t("metaDescription", { total: FACTS.totalIndiaDistricts }),
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
const DATA_SOURCES: { name: string; key: string; emoji: string; url: string }[] = [
  { name: "AGMARKNET", key: "agmarknet", emoji: "🌾", url: "https://agmarknet.gov.in" },
  { name: "India-WRIS", key: "wris", emoji: "💧", url: "https://indiawris.gov.in" },
  { name: "IMD", key: "imd", emoji: "🌦️", url: "https://mausam.imd.gov.in" },
  { name: "Election Commission of India", key: "eci", emoji: "🗳️", url: "https://eci.gov.in" },
  { name: "eGramSwaraj / PFMS", key: "egram", emoji: "🏘️", url: "https://egramswaraj.gov.in" },
  { name: "UDISE+", key: "udise", emoji: "🎓", url: "https://udiseplus.gov.in" },
  { name: "National Scholarship Portal", key: "nsp", emoji: "🎒", url: "https://scholarships.gov.in" },
  { name: "PMAY-G / PMAY-U", key: "pmay", emoji: "🏠", url: "https://pmayg.nic.in" },
];

/** One colour per state row in the "where we are live" bars. */
const STATE_ROW_HUES: Hue[] = ["blue", "green", "violet", "amber", "teal", "rose", "indigo", "orange", "cyan", "pink"];

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
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 64 }}>
        {/* Reading column: long-form page, so it stays at a comfortable 760 px. */}
        <div style={{ maxWidth: 760 }}>
          {/* ── Header ─────────────────────────────────────────────── */}
          <SiteHeader emoji="📖" icon={Info} title={t("title")} description={t("description")} backHref={`/${locale}`} />

          <p style={READ}>{t("intro", { coverage, total })}</p>

          {/* ── Mission ────────────────────────────────────────────── */}
          <Section title={t("missionTitle")} emoji="🎯">
            <Card tinted padding={24}>
              <p className="ftp-display" style={{ margin: 0, fontSize: 19, lineHeight: 1.5, fontWeight: 600, color: "var(--hue-deep)" }}>
                {t("mission")}
              </p>
            </Card>
          </Section>

          {/* ── Builder — E-E-A-T expertise signal ─────────────────── */}
          <Section title={t("builderTitle")} emoji="🧑‍💻">
            <Card padding={20} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 44, height: 44, fontSize: 22, borderRadius: 14 }}>
                👤
              </span>
              <div style={{ minWidth: 0 }}>
                <p className="ftp-title" style={{ fontWeight: 600 }}>{t("builderName")}</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{t("builderBio")}</p>
              </div>
            </Card>
          </Section>

          {/* ── Platform stats — citability block. Counts come from
                 getPlatformFacts() (registry-derived), never typed here. ── */}
          <Section title={t("glanceTitle")} emoji="📊">
            <Explainer>{t.rich("glanceSimple", { d, s, total, b })}</Explainer>
            <StatStrip cols={3}>
              <StatTile emoji="🚀" label={t("tileLaunched")} value="2026" countUp={false} />
              <StatTile emoji="🏙️" label={t("tileLive")} value={d} sub={t("tileLiveSub", { s })} />
              <StatTile emoji="🗺️" label={t("tilePlanned")} value={`${total}+`} />
              <StatTile emoji="🧩" label={t("tileModules")} value={modulesPerDistrict} />
              <StatTile emoji="🆓" label={t("tileCost")} value={t("tileCostValue")} />
              <StatTile emoji="⚖️" label={t("tileBasis")} value="NDSAP" />
            </StatStrip>

            {/* The picture: live districts per state, one colour per state. */}
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
          </Section>

          {/* ── Pillars ────────────────────────────────────────────── */}
          <Section title={t("pillarsTitle")} emoji="🧭">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 12 }}>
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
            <p style={{ ...READ, marginBottom: 16 }}>{t.rich("sourcesBody", { b })}</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {DATA_SOURCES.map((src) => (
                <Card key={src.key} as="li" padding={12} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 18, borderRadius: 11 }}>
                    {src.emoji}
                  </span>
                  <span style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "baseline", columnGap: 16, minWidth: 0, flex: 1 }}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 140, minHeight: 32, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                    >
                      {src.name}
                      <ExternalLink size={12} aria-hidden />
                    </a>
                    <span className="ftp-body" style={{ color: "var(--ftp-text-2)", flex: "1 1 240px" }}>{t(`src_${src.key}`)}</span>
                  </span>
                </Card>
              ))}
            </ul>
          </Section>

          {/* ── Data pledge ────────────────────────────────────────── */}
          <Section title={t("pledgeTitle")} emoji="🤝">
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
          </Section>

          {/* ── Disclaimer (a warning keeps the semantic warn colour) ── */}
          <Card padding={20} style={{ marginTop: 32, display: "flex", gap: 12, alignItems: "flex-start", borderColor: "color-mix(in srgb, var(--ftp-warn) 35%, var(--ftp-border))" }}>
            <AlertTriangle size={18} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="ftp-label" style={{ color: "var(--ftp-warn)" }}>{t("disclaimerTitle")}</p>
              <p className="ftp-body" style={{ color: "var(--ftp-text)", marginTop: 6 }}>
                {t.rich("disclaimerBody", { b: (c) => <strong style={{ fontWeight: 600 }}>{c}</strong> })}
              </p>
            </div>
          </Card>

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
        </div>
      </div>
    </main>
  );
}
