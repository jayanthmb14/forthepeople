/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  FileSearch,
  History,
  Languages,
  MapPinned,
  Unlock,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, Section, StatStrip, StatTile } from "@/components/district/ui";
import { getCoveragePhrase, getPlatformFacts } from "@/lib/platform-facts";

// Every count on this page comes from the registry (issue #36) — never type
// "9 districts" or "29 modules" by hand here again.
const FACTS = getPlatformFacts();

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

export const metadata: Metadata = {
  title: "About ForThePeople.in — India's Citizen Transparency Platform",
  description:
    "ForThePeople.in is India's free citizen transparency platform. Built by Jayanth M B in 2026, it aggregates district-level government data under NDSAP across 780+ districts.",
  alternates: { canonical: `${BASE_URL}/en/about` },
  openGraph: {
    url: `${BASE_URL}/en/about`,
    title: "About ForThePeople.in",
    description: "India's citizen transparency platform — free district-level government data for every Indian citizen.",
  },
};

// Each pillar carries a Lucide icon component. This file is a server
// component and renders the icon itself (<p.Icon />), so no function is ever
// passed as a prop to a client component.
const PILLARS: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: BarChart3, title: "Real Data, Not Opinions", desc: "Every number comes from a government portal, official API, or publicly available document. We never fabricate or estimate data." },
  { Icon: MapPinned, title: "Every District, Every State", desc: `Currently live in ${getCoveragePhrase()} — expanding to all ${FACTS.totalIndiaDistricts}+ districts across India.` },
  { Icon: Languages, title: "Local Languages First", desc: "Data is presented in English and the regional language of each state — Kannada, Tamil, Telugu, Hindi, and more." },
  { Icon: History, title: "Current + Historical", desc: "Crop prices and news are refreshed whenever the source portal publishes; every reading shows the date it was recorded. Budget and census data go back years. Both matter." },
  { Icon: Unlock, title: "Free Forever", desc: "No paywalls, no subscriptions. Government data belongs to citizens. We just make it accessible." },
  { Icon: FileSearch, title: "RTI Ready", desc: "Don't see what you need? We provide ready-to-send RTI templates so you can get any government information by right." },
];

const DATA_SOURCES = [
  { name: "AGMARKNET", desc: "Agricultural Marketing Information Network — crop mandi prices", url: "https://agmarknet.gov.in" },
  { name: "India-WRIS", desc: "Water Resources Information System — dam and reservoir levels", url: "https://indiawris.gov.in" },
  { name: "IMD", desc: "India Meteorological Department — rainfall and weather data", url: "https://mausam.imd.gov.in" },
  { name: "Election Commission of India", desc: "Assembly and Lok Sabha election results and voter data", url: "https://eci.gov.in" },
  { name: "eGramSwaraj / PFMS", desc: "Panchayat + finance data (MGNREGA, district budgets)", url: "https://egramswaraj.gov.in" },
  { name: "UDISE+", desc: "School enrollment, pass rates, student-teacher ratios", url: "https://udiseplus.gov.in" },
  { name: "National Scholarship Portal", desc: "Government scholarship and scheme data", url: "https://scholarships.gov.in" },
  { name: "PMAY-G / PMAY-U", desc: "Pradhan Mantri Awas Yojana housing scheme data", url: "https://pmayg.nic.in" },
];

/** Body text at the reading size used across this page (15/24, text-2). */
const READ: React.CSSProperties = { fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: 0 };

/** Inline text link in the brand colour. */
const INLINE_LINK: React.CSSProperties = { color: "var(--ftp-brand)", textDecoration: "underline", textUnderlineOffset: 2 };

export default function AboutPage() {
  return (
    <main style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <div className="ftp-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Reading column: long-form page, so it stays at a comfortable 720 px. */}
        <div style={{ maxWidth: 720 }}>
          {/* ── Header ─────────────────────────────────────────────── */}
          <header style={{ borderBottom: "1px solid var(--ftp-border)", paddingBottom: 24 }}>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none" }}
            >
              <ArrowLeft size={14} aria-hidden /> ForThePeople.in
            </Link>
            <h1 className="ftp-h1" style={{ marginTop: 4 }}>
              Your District. Your Data. <span style={{ color: "var(--ftp-brand)" }}>Your Right.</span>
            </h1>
            <p style={{ ...READ, marginTop: 12 }}>
              ForThePeople.in is India&apos;s citizen transparency platform, launched in 2026. We aggregate
              district-level government data — budgets, crop prices, water levels, scheme coverage,
              infrastructure, and more — and present it in a clear, accessible interface for every Indian.
              The platform covers {getCoveragePhrase()} and plans to expand to all {FACTS.totalIndiaDistricts}+ Indian districts.
            </p>
          </header>

          {/* ── Mission ────────────────────────────────────────────── */}
          <Card padding={24} style={{ marginTop: 24 }}>
            <p className="ftp-label">Our mission</p>
            <p className="ftp-title" style={{ marginTop: 8, fontSize: 17, lineHeight: "26px" }}>
              To make government data as easy to access as checking the weather — so that every citizen,
              journalist, researcher, and elected representative can engage with governance based on facts.
            </p>
          </Card>

          {/* ── Builder — E-E-A-T expertise signal ─────────────────── */}
          <Section title="Who built this?">
            <Card padding={20} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                aria-hidden
                style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  borderRadius: "var(--ftp-radius-tile)",
                  background: "var(--ftp-brand-tint)",
                  color: "var(--ftp-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserRound size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="ftp-title">Jayanth M B</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>
                  Entrepreneur and civic-tech advocate based in India. Built ForThePeople.in in 2026 as an independent
                  public-interest project to help citizens, journalists, researchers, and elected representatives
                  access India&apos;s government data in one place. Not affiliated with any government body or political organisation.
                </p>
              </div>
            </Card>
          </Section>

          {/* ── Platform stats — citability block. Counts come from
                 getPlatformFacts() (registry-derived), never typed here. ── */}
          <Section title="Platform at a glance">
            <StatStrip cols={3}>
              <StatTile label="Year launched" value="2026" />
              <StatTile label="Live districts" value={FACTS.activeDistricts} sub={`Across ${FACTS.activeStates} state${FACTS.activeStates === 1 ? "" : "s"}`} />
              <StatTile label="Districts planned" value={`${FACTS.totalIndiaDistricts}+`} />
              <StatTile label="Data modules / district" value={FACTS.modulesPerDistrict} />
              <StatTile label="Cost to access" value="Free" />
              <StatTile label="Legal data basis" value="NDSAP" />
            </StatStrip>
          </Section>

          {/* ── Pillars ────────────────────────────────────────────── */}
          <Section title="What we stand for">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: 12 }}>
              {PILLARS.map((p) => (
                <Card key={p.title} as="article" padding={20}>
                  <p.Icon size={20} aria-hidden style={{ color: "var(--ftp-brand)" }} />
                  <h3 className="ftp-title" style={{ marginTop: 10 }}>{p.title}</h3>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{p.desc}</p>
                </Card>
              ))}
            </div>
          </Section>

          {/* ── Data sources ───────────────────────────────────────── */}
          <Section title="Data sources & methodology">
            <p style={{ ...READ, marginBottom: 16 }}>
              ForThePeople.in is an independent citizen transparency platform built on India&apos;s
              Right to Information principles (Article 19(1)(a) of the Constitution). Data is
              aggregated from official Government of India portals released under the{" "}
              <strong style={{ color: "var(--ftp-text)", fontWeight: 500 }}>National Data Sharing and Accessibility Policy (NDSAP) 2012</strong>,
              accredited research institutions (IIPS for NFHS, ICMR, IMD), and publicly accessible
              verified sources (weather APIs, news headlines under fair use). We do not claim
              affiliation with any government body. Every numeric value is traceable to its
              original public source — please verify critical information at the source portal
              before acting on it.
            </p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {DATA_SOURCES.map((s) => (
                <Card key={s.name} as="li" padding={12} style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "baseline", columnGap: 16 }}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, minWidth: 140, minHeight: 32, fontSize: 13, fontWeight: 500, color: "var(--ftp-brand)", textDecoration: "none" }}
                  >
                    {s.name}
                    <ExternalLink size={12} aria-hidden />
                  </a>
                  <span className="ftp-body" style={{ color: "var(--ftp-text-2)", flex: "1 1 240px" }}>{s.desc}</span>
                </Card>
              ))}
            </ul>
          </Section>

          {/* ── Data pledge ────────────────────────────────────────── */}
          <Section title="Our data pledge">
            <p style={{ ...READ, marginBottom: 12 }}>
              Every data point is sourced from official government portals, public APIs, and gazetted documents.
              We document every source on our{" "}
              <Link href="/en/karnataka/mandya/data-sources" style={INLINE_LINK}>Data Sources</Link>{" "}
              page for each district.
            </p>
            <p style={READ}>
              If you find an error, please <Link href="/contribute" style={INLINE_LINK}>let us know</Link>.
              We will correct it within 24 hours and publish the correction.
            </p>
          </Section>

          {/* ── Disclaimer (warning shown as an icon + text, no tinted box) ── */}
          <Card padding={20} style={{ marginTop: 32, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <AlertTriangle size={18} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="ftp-label" style={{ color: "var(--ftp-warn)" }}>Important disclaimer</p>
              <p className="ftp-body" style={{ color: "var(--ftp-text)", marginTop: 6 }}>
                ForThePeople.in is an <strong style={{ fontWeight: 500 }}>independent, non-governmental initiative</strong>. It is NOT an official government website.
                Data is sourced from public government portals under NDSAP and is provided for informational purposes only.
                For official records, always refer to the original government source.
              </p>
            </div>
          </Card>

          {/* ── Calls to action ────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 20px", background: "var(--ftp-brand)", color: "var(--ftp-surface)", borderRadius: "var(--ftp-radius-tile)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
            >
              Explore your district
            </Link>
            <Link
              href="/contribute"
              className="ftp-btn-secondary"
              style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 20px", background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", color: "var(--ftp-text)", borderRadius: "var(--ftp-radius-tile)", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
            >
              Contribute
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
