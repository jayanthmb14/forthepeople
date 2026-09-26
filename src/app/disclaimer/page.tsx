/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import Link from "next/link";
import type { Metadata } from "next";
import LegalPageHeader from "@/components/common/LegalPageHeader";

export const metadata: Metadata = {
  title: "Disclaimer — ForThePeople.in",
  description:
    "Legal disclaimer for ForThePeople.in, India's independent citizen transparency platform. Read about data accuracy, political neutrality, and use of government references.",
  alternates: { canonical: "https://forthepeople.in/en/disclaimer" },
};

const sectionStyle: React.CSSProperties = { marginBottom: 24 };
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 };
const pStyle: React.CSSProperties = { fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, margin: 0 };

export default function DisclaimerPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
      <LegalPageHeader title="Disclaimer" lastUpdated="16 April 2026" />

      <section style={sectionStyle}>
        <h2 style={h2Style}>1. Independent Platform</h2>
        <p style={pStyle}>
          ForThePeople.in is an independent, non-partisan, non-profit citizen initiative built by Jayanth M B. We are not affiliated with, endorsed by, funded by, or part of any government body, political party, political organisation, or commercial entity. No government official or party has editorial control over this platform.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>2. Political Neutrality</h2>
        <p style={pStyle}>
          ForThePeople.in is a connecting tool between citizens and governance — not an opposition platform and not a government mouthpiece. We present publicly available government data as it is published, without commentary, endorsement, or criticism of any political party, politician, or government. Where news headlines or AI-generated summaries appear, they are aggregated from third-party sources and reflect those sources&apos; framing, not ours. Citizens are free to form their own opinions based on the data presented.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>3. Not an Official Government Website</h2>
        <p style={pStyle}>
          ForThePeople.in is NOT an official government website. We do not have authority to issue government documents, register complaints on behalf of government departments, or confirm the validity of any government decision. For official records, benefits, and filings, always visit the original government portal.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>4. Government Emblems, Logos, and Trademarks</h2>
        <p style={pStyle}>
          We do not use, reproduce, or imitate any government emblem, seal, coat of arms, or official logo — including but not limited to the State Emblem of India, state seals, ministry logos, or police/court insignia. References to government departments, officials, or schemes by name are made for factual and informational purposes only, in the public interest, and do not constitute any claim of affiliation, endorsement, or authority under the Emblems and Names (Prevention of Improper Use) Act, 1950.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>5. References to Public Officials</h2>
        <p style={pStyle}>
          Names, designations, contact details, and public conduct of elected representatives and government officials shown on this platform are sourced from publicly available government records (Election Commission of India, state assembly websites, PIB releases, district administration portals, gazette notifications). This is information that is legally in the public domain. If you are a public official and believe information about your role is outdated or incorrect, please email{" "}
          <a href="mailto:support@forthepeople.in" style={{ color: "#2563EB" }}>
            support@forthepeople.in
          </a>{" "}
          and we will verify and update within 24 hours.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>6. Data Accuracy</h2>
        <p style={pStyle}>
          All data on this platform is aggregated from official government portals and public APIs under the <strong>National Data Sharing and Accessibility Policy (NDSAP), 2012</strong>. While we strive for accuracy, data may have delays of up to 24 hours for live modules and longer for modules that depend on government update cycles (budgets, schools, census, etc.). Historical data is presented as published by the originating government body and has not been independently audited by us.
        </p>
        <p style={{ ...pStyle, marginTop: 10 }}>
          <strong>Do not use this platform for critical real-time decisions</strong> — including emergency response, medical decisions, legal filings, financial transactions, or any situation where outdated or approximate information could cause harm. Always refer to the original government source for authoritative information.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>7. News Aggregation and AI-Generated Summaries</h2>
        <p style={pStyle}>
          We aggregate news headlines from publicly available RSS feeds and third-party news portals. Only headlines and short excerpts are displayed, with full articles linked to the original source. We do not reproduce full articles. AI-generated summaries that appear on the platform are based on these publicly available headlines and documents; they represent a machine-generated synthesis and are not editorial opinions of ForThePeople.in. Any errors in AI-generated content can be reported via the Report Issue feature.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>8. Not Legal, Financial, Medical, or Professional Advice</h2>
        <p style={pStyle}>
          Content on this platform — including RTI templates, government scheme descriptions, citizen rights information, and any AI-generated text — is provided for informational purposes only. Nothing on this platform constitutes legal, financial, medical, tax, or other professional advice. For any decision affecting your health, finances, legal rights, or welfare, please consult a qualified professional.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>9. User-Submitted Content</h2>
        <p style={pStyle}>
          When you submit feedback, report an issue, or contribute as a sponsor, you grant us a non-exclusive licence to use, display, and moderate that content on this platform. We reserve the right to moderate, edit, or remove user-submitted content that is defamatory, abusive, misleading, contains personal data of third parties, or violates applicable law. Opinions in user-submitted comments, if displayed, belong to those users and do not represent ForThePeople.in.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>10. External Links</h2>
        <p style={pStyle}>
          This platform links to external government websites and third-party sources. We are not responsible for the content, accuracy, availability, or privacy practices of those websites. Links to external sites do not constitute an endorsement.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>11. Errors and Corrections</h2>
        <p style={pStyle}>
          If you find incorrect, outdated, or misleading data, please{" "}
          <Link href="/contribute" style={{ color: "#2563EB" }}>
            report it here
          </Link>
          . We investigate all reports and typically correct verified errors within 24 hours. Corrections are logged in our public Update Log for transparency.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>12. Limitation of Liability</h2>
        <p style={pStyle}>
          ForThePeople.in and its creator, contributors, and volunteers shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the use of, reliance on, or inability to use information on this platform. Use is at your own risk. You agree to hold ForThePeople.in harmless from any claim arising out of your use of this platform.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>13. Governing Law and Jurisdiction</h2>
        <p style={pStyle}>
          This Disclaimer is governed by the laws of India. Any dispute arising out of or in connection with ForThePeople.in shall be subject to the exclusive jurisdiction of the courts at Bengaluru, Karnataka, India.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>14. Contact</h2>
        <p style={pStyle}>
          For data corrections, takedown requests, or any queries about this platform, please write to:
        </p>
        <ul style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, margin: "8px 0 0", paddingLeft: 20 }}>
          <li>Email: <a href="mailto:support@forthepeople.in" style={{ color: "#2563EB" }}>support@forthepeople.in</a></li>
        </ul>
        <p style={{ ...pStyle, marginTop: 8 }}>
          We aim to respond within 7 working days.
        </p>
      </section>

      <div
        style={{
          borderTop: "1px solid #E8E8E4",
          paddingTop: 16,
          marginTop: 32,
          fontSize: 12,
          color: "#9B9B9B",
        }}
      >
        See also:{" "}
        <Link href="/privacy" style={{ color: "#2563EB", textDecoration: "none" }}>
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/about" style={{ color: "#2563EB", textDecoration: "none" }}>
          About
        </Link>
      </div>
    </div>
  );
}
