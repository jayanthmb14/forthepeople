/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import Link from "next/link";
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

const PILLARS = [
  { icon: "📊", title: "Real Data, Not Opinions", desc: "Every number comes from a government portal, official API, or publicly available document. We never fabricate or estimate data." },
  { icon: "🌐", title: "Every District, Every State", desc: `Currently live in ${getCoveragePhrase()} — expanding to all ${FACTS.totalIndiaDistricts}+ districts across India.` },
  { icon: "🌍", title: "Local Languages First", desc: "Data is presented in English and the regional language of each state — Kannada, Tamil, Telugu, Hindi, and more." },
  { icon: "⚡", title: "Current + Historical", desc: "Crop prices and news are refreshed whenever the source portal publishes; every reading shows the date it was recorded. Budget and census data go back years. Both matter." },
  { icon: "🔓", title: "Free Forever", desc: "No paywalls, no subscriptions. Government data belongs to citizens. We just make it accessible." },
  { icon: "🔍", title: "RTI Ready", desc: "Don't see what you need? We provide ready-to-send RTI templates so you can get any government information by right." },
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

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "var(--font-plus-jakarta, system-ui, sans-serif)" }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <Link href="/" style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none", display: "inline-block", marginBottom: 16 }}>← ForThePeople.in</Link>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.6px", lineHeight: 1.2, marginBottom: 16 }}>
          Your District.<br />Your Data.<br /><span style={{ color: "#2563EB" }}>Your Right.</span>
        </h1>
        <p style={{ fontSize: 17, color: "#4B4B4B", lineHeight: 1.7, maxWidth: 560 }}>
          ForThePeople.in is India&apos;s citizen transparency platform, launched in 2026. We aggregate
          district-level government data — budgets, crop prices, water levels, scheme coverage,
          infrastructure, and more — and present it in a clear, accessible interface for every Indian.
          The platform covers {getCoveragePhrase()} and plans to expand to all {FACTS.totalIndiaDistricts}+ Indian districts.
        </p>
      </div>

      {/* Mission */}
      <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)", border: "1px solid #BFDBFE", borderRadius: 14, padding: "24px 28px", marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Our Mission</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.6, margin: 0 }}>
          To make government data as easy to access as checking the weather — so that every citizen,
          journalist, researcher, and elected representative can engage with governance based on facts.
        </p>
      </div>

      {/* Builder — E-E-A-T expertise signal */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>Who built this?</h2>
      <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 14, padding: "24px 28px", marginBottom: 40, display: "flex", gap: 20 }}>
        <div style={{ flexShrink: 0, width: 52, height: 52, background: "#EFF6FF", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👨‍💻</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>Jayanth M B</div>
          <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.65 }}>
            Entrepreneur and civic-tech advocate based in India. Built ForThePeople.in in 2026 as an independent
            public-interest project to help citizens, journalists, researchers, and elected representatives
            access India&apos;s government data in one place. Not affiliated with any government body or political organisation.
          </div>
        </div>
      </div>

      {/* Platform stats — citability stats block */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>Platform at a glance</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 40 }}>
        {[
          { value: "2026", label: "Year launched" },
          { value: `${FACTS.totalIndiaDistricts}+`, label: "Districts planned" },
          { value: String(FACTS.modulesPerDistrict), label: "Data modules / district" },
          { value: "Free", label: "Cost to access" },
          { value: "NDSAP", label: "Legal data basis" },
          { value: String(FACTS.activeDistricts), label: "Live districts" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", letterSpacing: "-0.5px" }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#9B9B9B", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pillars */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>What we stand for</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 40 }}>
        {PILLARS.map((p) => (
          <div key={p.title} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Data Sources & Methodology</h2>
      <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 16 }}>
        ForThePeople.in is an independent citizen transparency platform built on India&apos;s
        Right to Information principles (Article 19(1)(a) of the Constitution). Data is
        aggregated from official Government of India portals released under the{" "}
        <strong>National Data Sharing and Accessibility Policy (NDSAP) 2012</strong>,
        accredited research institutions (IIPS for NFHS, ICMR, IMD), and publicly accessible
        verified sources (weather APIs, news headlines under fair use). We do not claim
        affiliation with any government body. Every numeric value is traceable to its
        original public source — please verify critical information at the source portal
        before acting on it.
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 40 }}>
        {DATA_SOURCES.map((s) => (
          <div key={s.name} style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12 }}>
            <div style={{ minWidth: 120 }}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", textDecoration: "none" }}>{s.name}</a>
            </div>
            <div style={{ fontSize: 12, color: "#6B6B6B" }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Data pledge */}
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A", marginBottom: 12 }}>Our Data Pledge</h2>
      <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 12 }}>
        Every data point is sourced from official government portals, public APIs, and gazetted documents.
        We document every source on our{" "}
        <Link href="/en/karnataka/mandya/data-sources" style={{ color: "#2563EB" }}>Data Sources</Link>{" "}
        page for each district.
      </p>
      <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 40 }}>
        If you find an error, please <Link href="/contribute" style={{ color: "#2563EB" }}>let us know</Link>.
        We will correct it within 24 hours and publish the correction.
      </p>

      {/* Disclaimer */}
      <div style={{ background: "#FFF9F0", border: "1px solid #FED7AA", borderRadius: 12, padding: "16px 20px", marginBottom: 40 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Important Disclaimer</div>
        <p style={{ fontSize: 13, color: "#4B4B4B", lineHeight: 1.65, margin: 0 }}>
          ForThePeople.in is an <strong>independent, non-governmental initiative</strong>. It is NOT an official government website.
          Data is sourced from public government portals under NDSAP and is provided for informational purposes only.
          For official records, always refer to the original government source.
        </p>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/" style={{ padding: "12px 22px", background: "#2563EB", color: "#FFF", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Explore Your District
        </Link>
        <Link href="/contribute" style={{ padding: "12px 22px", background: "#FFF", border: "1px solid #E8E8E4", color: "#1A1A1A", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          Contribute
        </Link>
      </div>
    </div>
  );
}
