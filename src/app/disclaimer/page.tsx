/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import Link from "next/link";
import type { Metadata } from "next";
import LegalPageHeader from "@/components/common/LegalPageHeader";
import { LEGAL_LINK, LegalSection, LegalSeeAlso } from "@/components/site/LegalSection";

export const metadata: Metadata = {
  title: "Disclaimer — ForThePeople.in",
  description:
    "Legal disclaimer for ForThePeople.in, India's independent citizen transparency platform. Read about data accuracy, political neutrality, and use of government references.",
  alternates: { canonical: "https://forthepeople.in/en/disclaimer" },
};

// ── Design v4 "Rang" (slate, the quiet legal colour) ─────────────────
// Presentation only: SiteHeader band via LegalPageHeader, numbered clause
// headings in sentence case (LegalSection), links in the page hue. No
// picture: this page has no data. The legal text is unchanged.
const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: 0 };
const linkStyle = LEGAL_LINK;

export default function DisclaimerPage() {
  return (
    <main className="ftp-hue-slate" style={{ background: "var(--ftp-bg)", minHeight: "100vh" }}>
     <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 64 }}>
     <div style={{ maxWidth: 760 }}>
      <LegalPageHeader title="Disclaimer" lastUpdated="16 April 2026" emoji="⚠️" />

      <LegalSection n={1} title="Independent platform">
        <p style={pStyle}>
          ForThePeople.in is an independent, non-partisan, non-profit citizen initiative built by Jayanth M B. We are not affiliated with, endorsed by, funded by, or part of any government body, political party, political organisation, or commercial entity. No government official or party has editorial control over this platform.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Political neutrality">
        <p style={pStyle}>
          ForThePeople.in is a connecting tool between citizens and governance — not an opposition platform and not a government mouthpiece. We present publicly available government data as it is published, without commentary, endorsement, or criticism of any political party, politician, or government. Where news headlines or AI-generated summaries appear, they are aggregated from third-party sources and reflect those sources&apos; framing, not ours. Citizens are free to form their own opinions based on the data presented.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Not an official government website">
        <p style={pStyle}>
          ForThePeople.in is NOT an official government website. We do not have authority to issue government documents, register complaints on behalf of government departments, or confirm the validity of any government decision. For official records, benefits, and filings, always visit the original government portal.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Government emblems, logos, and trademarks">
        <p style={pStyle}>
          We do not use, reproduce, or imitate any government emblem, seal, coat of arms, or official logo — including but not limited to the State Emblem of India, state seals, ministry logos, or police/court insignia. References to government departments, officials, or schemes by name are made for factual and informational purposes only, in the public interest, and do not constitute any claim of affiliation, endorsement, or authority under the Emblems and Names (Prevention of Improper Use) Act, 1950.
        </p>
      </LegalSection>

      <LegalSection n={5} title="References to public officials">
        <p style={pStyle}>
          Names, designations, contact details, and public conduct of elected representatives and government officials shown on this platform are sourced from publicly available government records (Election Commission of India, state assembly websites, PIB releases, district administration portals, gazette notifications). This is information that is legally in the public domain. If you are a public official and believe information about your role is outdated or incorrect, please email{" "}
          <a href="mailto:support@forthepeople.in" style={linkStyle}>
            support@forthepeople.in
          </a>{" "}
          and we will verify and update within 24 hours.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Data accuracy">
        <p style={pStyle}>
          All data on this platform is aggregated from official government portals and public APIs under the <strong>National Data Sharing and Accessibility Policy (NDSAP), 2012</strong>. While we strive for accuracy, data may have delays of up to 24 hours for live modules and longer for modules that depend on government update cycles (budgets, schools, census, etc.). Historical data is presented as published by the originating government body and has not been independently audited by us.
        </p>
        <p style={{ ...pStyle, marginTop: 10 }}>
          <strong>Do not use this platform for critical real-time decisions</strong> — including emergency response, medical decisions, legal filings, financial transactions, or any situation where outdated or approximate information could cause harm. Always refer to the original government source for authoritative information.
        </p>
      </LegalSection>

      <LegalSection n={7} title="News aggregation and AI-generated summaries">
        <p style={pStyle}>
          We aggregate news headlines from publicly available RSS feeds and third-party news portals. Only headlines and short excerpts are displayed, with full articles linked to the original source. We do not reproduce full articles. AI-generated summaries that appear on the platform are based on these publicly available headlines and documents; they represent a machine-generated synthesis and are not editorial opinions of ForThePeople.in. Any errors in AI-generated content can be reported via the Report Issue feature.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Not legal, financial, medical, or professional advice">
        <p style={pStyle}>
          Content on this platform — including RTI templates, government scheme descriptions, citizen rights information, and any AI-generated text — is provided for informational purposes only. Nothing on this platform constitutes legal, financial, medical, tax, or other professional advice. For any decision affecting your health, finances, legal rights, or welfare, please consult a qualified professional.
        </p>
      </LegalSection>

      <LegalSection n={9} title="User-submitted content">
        <p style={pStyle}>
          When you submit feedback, report an issue, or contribute as a sponsor, you grant us a non-exclusive licence to use, display, and moderate that content on this platform. We reserve the right to moderate, edit, or remove user-submitted content that is defamatory, abusive, misleading, contains personal data of third parties, or violates applicable law. Opinions in user-submitted comments, if displayed, belong to those users and do not represent ForThePeople.in.
        </p>
      </LegalSection>

      <LegalSection n={10} title="External links">
        <p style={pStyle}>
          This platform links to external government websites and third-party sources. We are not responsible for the content, accuracy, availability, or privacy practices of those websites. Links to external sites do not constitute an endorsement.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Errors and corrections">
        <p style={pStyle}>
          If you find incorrect, outdated, or misleading data, please{" "}
          <Link href="/contribute" style={linkStyle}>
            report it here
          </Link>
          . We investigate all reports and typically correct verified errors within 24 hours. Corrections are logged in our public Update Log for transparency.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Limitation of liability">
        <p style={pStyle}>
          ForThePeople.in and its creator, contributors, and volunteers shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of, reliance on, or inability to use information on this platform. Use is at your own risk. You agree to hold ForThePeople.in harmless from any claim arising out of your use of this platform.
        </p>
      </LegalSection>

      <LegalSection n={13} title="Governing law and jurisdiction">
        <p style={pStyle}>
          This Disclaimer is governed by the laws of India. Any dispute arising out of or in connection with ForThePeople.in shall be subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka, India.
        </p>
      </LegalSection>

      <LegalSection n={14} title="Contact">
        <p style={pStyle}>
          For data corrections, takedown requests, or any queries about this platform, please write to:
        </p>
        <ul style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: "8px 0 0", paddingLeft: 20 }}>
          <li>Email: <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a></li>
        </ul>
        <p style={{ ...pStyle, marginTop: 8 }}>
          We aim to respond within 7 working days.
        </p>
      </LegalSection>

      <LegalSeeAlso
        links={[
          { href: "/privacy", label: "Privacy Policy" },
          { href: "/about", label: "About" },
        ]}
      />
     </div>
     </div>
    </main>
  );
}
