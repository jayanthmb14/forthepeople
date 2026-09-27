"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface DemographicDisclaimerProps {
  districtName?: string;
  electionModeActive?: boolean;
  defaultOpen?: boolean;
}

type SectionKey =
  | "about"
  | "caste"
  | "childSexRatio"
  | "dataCurrency"
  | "electionMode"
  | "methodology"
  | "religion";

interface Section {
  key: SectionKey;
  title: string;
  body: React.ReactNode;
}

export default function DemographicDisclaimer({
  districtName,
  electionModeActive = false,
  defaultOpen = false,
}: DemographicDisclaimerProps) {
  const [panelOpen, setPanelOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState<Set<SectionKey>>(new Set());

  const toggle = (key: SectionKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allSections: Section[] = [
    {
      key: "about",
      title: "About this module",
      body: (
        <p>
          ForThePeople.in is a civic transparency initiative of PKJMB Media Pvt Ltd.
          Demographic indicators shown here are reproduced in aggregate form from publicly
          released datasets of the Government of India — principally Census of India 2011
          (Office of the Registrar General &amp; Census Commissioner), National Family
          Health Survey (NFHS-5), datasets under the National Data Sharing and
          Accessibility Policy 2012 available on data.gov.in under the Government Open
          Data Licence – India (GODL-India), and NITI Aayog&apos;s Multidimensional
          Poverty Index 2023. ForThePeople.in is an independent publisher, is not a
          Government website, and is not endorsed by any Government department or agency.
          Data is provided &quot;as is&quot; for public education and civic engagement.
        </p>
      ),
    },
    {
      key: "caste",
      title: "Caste-category data",
      body: (
        <p>
          Caste-category figures use only the constitutional categories — Scheduled
          Caste, Scheduled Tribe and Other. Individual jati or sub-caste data is not
          displayed. The Government of India formally stated in Supreme Court proceedings
          (State of Maharashtra v. Union of India, 2021) that raw SECC 2011 caste data
          contained classification errors and was &quot;unusable&quot;; the raw data has
          not been publicly released. ForThePeople.in does not attempt to reconstruct or
          display that un-released data. Figures shown are statutory classifications and
          are not an endorsement of, or commentary on, any caste or community. No content
          here is intended to insult, intimidate, humiliate or promote ill-will within the
          meaning of the Scheduled Castes and the Scheduled Tribes (Prevention of
          Atrocities) Act, 1989.
        </p>
      ),
    },
    {
      key: "childSexRatio",
      title: "Child sex ratio (PCPNDT Act context)",
      body: (
        <p>
          The Child Sex Ratio (0–6) is published in the public interest to support
          gender-equity monitoring. Pre-natal and pre-conception sex determination, and
          sex-selective abortion, are prohibited offences under the Pre-Conception and
          Pre-Natal Diagnostic Techniques (Prohibition of Sex Selection) Act, 1994.
          ForThePeople.in carries no advertising and no listings or links to
          sex-determination services on any page.
        </p>
      ),
    },
    {
      key: "dataCurrency",
      title: "Data currency (Census 2011 is 15 years old)",
      body: (
        <p>
          The Census of India is conducted once every ten years. The 2011 Census data
          shown here is more than 14 years old as on 2026. The 2021 Census was deferred;
          Phase I houselisting is scheduled for April–September 2026 and the
          population-enumeration reference date is 1 March 2027. Where more recent survey
          data is available — NFHS-5 (2019–21), NITI MPI (2023), PLFS (latest quarter),
          Civil Registration System — those figures are shown with clear labels. Readers
          should treat Census 2011 figures as historical reference.
        </p>
      ),
    },
    {
      key: "electionMode",
      title: "Election Mode",
      body: (
        <p>
          Election Mode is active. Constituency-level demographic visualisations have
          been temporarily disabled in compliance with the Model Code of Conduct and
          Section 126 of the Representation of the People Act, 1951. State- and
          district-level aggregate data remain available.
        </p>
      ),
    },
    {
      key: "methodology",
      title: "Methodology & sources",
      body: (
        <p>
          Every chart carries a data badge identifying the data provider, dataset name
          and reference year, source URL, and reuse licence (principally GODL-India,
          Gazette notification February 2017). Derivative computations (ratios, rankings,
          percentages) are labelled as such. ForThePeople.in does not endorse any data
          provider. For errors, omissions or takedown requests write to
          support@forthepeople.in.
        </p>
      ),
    },
    {
      key: "religion",
      title: "Religion data",
      body: (
        <p>
          Religion-wise figures are reproduced from Census of India 2011 tables C-01.
          Categories reflect self-declaration by respondents and the official
          classification used by the Census. Ordering is alphabetical. No inference about
          the merit, desirability, character or conduct of any religious community is
          intended or should be drawn. Publication is a lawful exercise of the right
          under Article 19(1)(a) of the Constitution to disseminate public-interest
          information.
        </p>
      ),
    },
  ];

  const sections = allSections.filter(
    (s) => s.key !== "electionMode" || electionModeActive,
  );

  // Design v3 chrome: a plain Card-style panel (surface, 1 px border,
  // 12 px radius, no tint). Toggle rows are at least 44 px tall so they are
  // easy to tap on a phone. The legal text above is unchanged.
  return (
    <div
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        padding: "0 16px",
        marginBottom: 16,
        fontSize: 13,
        lineHeight: "20px",
        color: "var(--ftp-text)",
      }}
    >
      <button
        type="button"
        onClick={() => setPanelOpen((o) => !o)}
        aria-expanded={panelOpen}
        style={{
          background: "transparent",
          border: "none",
          padding: "12px 0",
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          fontFamily: "var(--ftp-font-sans)",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--ftp-text)",
          width: "100%",
          textAlign: "left",
        }}
      >
        {panelOpen ? <ChevronDown size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
        <span>
          Disclosure &amp; methodology
          {districtName ? ` — ${districtName}` : ""}
        </span>
      </button>

      {panelOpen && (
        <div style={{ paddingBottom: 4, borderTop: "1px solid var(--ftp-border)" }}>
          {sections.map((s, i) => {
            const open = expanded.has(s.key);
            return (
              <div key={s.key} style={{ borderBottom: i < sections.length - 1 ? "1px solid var(--ftp-border)" : "none" }}>
                <button
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-expanded={open}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "10px 0",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    fontFamily: "var(--ftp-font-sans)",
                    fontSize: 13,
                    fontWeight: 400,
                    color: "var(--ftp-text)",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  {open ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                  <span>{s.title}</span>
                </button>
                {open && (
                  <div
                    style={{
                      padding: "0 0 12px 20px",
                      fontSize: 13,
                      lineHeight: "20px",
                      color: "var(--ftp-text-2)",
                    }}
                  >
                    {s.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
