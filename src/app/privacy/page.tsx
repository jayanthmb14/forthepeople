/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * DPDP Act 2023 Compliant Privacy Policy
 */

import type { Metadata } from "next";
import { X } from "lucide-react";
import LegalPageHeader from "@/components/common/LegalPageHeader";
import { DataTable } from "@/components/district/ui";
import { LEGAL_LINK, LegalSection, LegalSeeAlso } from "@/components/site/LegalSection";

export const metadata: Metadata = {
  title: "Privacy Policy — ForThePeople.in",
  description:
    "How ForThePeople.in handles your data. Fully compliant with India's Digital Personal Data Protection (DPDP) Act, 2023.",
  alternates: { canonical: "https://forthepeople.in/en/privacy" },
};

// ── Design v4 "Rang" (slate, the quiet legal colour) ─────────────────
// Presentation only: SiteHeader band via LegalPageHeader, numbered clause
// headings in sentence case (LegalSection), the tables are kit DataTables
// (hue header, horizontal scroll on phones so the page never scrolls
// sideways), links in the page hue. No picture: this page has no data.
// The legal text is unchanged.
const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", margin: "0 0 10px" };
const linkStyle = LEGAL_LINK;
const TABLE_GAP: React.CSSProperties = { marginBottom: 12 };

export default function PrivacyPage() {
  return (
    <main className="ftp-hue-slate" style={{ background: "var(--ftp-bg)", minHeight: "100vh" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 64 }}>
       <div style={{ maxWidth: 760 }}>
        <LegalPageHeader title="Privacy Policy" lastUpdated="16 April 2026" emoji="🔒" />

        <LegalSection n={1} title="About this policy">
          <p style={pStyle}>
            ForThePeople.in is an independent citizen transparency platform built by <strong>Jayanth M B</strong> in Bengaluru, Karnataka, India. It is not an official government website. This Privacy Policy explains how we collect, process, and protect your personal data, in compliance with the <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
          </p>
          <p style={pStyle}>By using this platform, you agree to the practices described below.</p>
          <p style={pStyle}>
            Operator: Jayanth M B, Bengaluru, Karnataka, India<br />
            Contact: <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a>
          </p>
        </LegalSection>

        <LegalSection n={2} title="What data we process">
          <div style={TABLE_GAP}>
            <DataTable
              caption="What data we process, why, and the legal basis"
              columns={[
                { key: "data", label: "Data" },
                { key: "what", label: "What exactly" },
                { key: "purpose", label: "Purpose" },
                { key: "basis", label: "Legal basis under DPDP Act" },
              ]}
              rows={[
                { data: "Vote fingerprint", what: "SHA-256 hash of IP + browser user-agent (not reversible)", purpose: "Prevent duplicate votes on the features page", basis: "Legitimate interest (platform integrity)" },
                { data: "Feedback email", what: "Email you voluntarily enter in the feedback form", purpose: "Respond to your feedback", basis: "Your consent" },
                { data: "Supporter info", what: "Name, email, contribution amount, optional social handle", purpose: "Process contributions, display on contributor page if opted in", basis: "Contractual necessity + consent" },
                { data: "Payment details", what: "Card, UPI, bank details — processed entirely by Razorpay. We never see or store these.", purpose: "Complete your contribution", basis: "Contractual necessity" },
                { data: "Server logs", what: "IP address, browser type, request URL, timestamp", purpose: "Security, abuse prevention, debugging", basis: "Legitimate interest" },
                { data: "Error logs (Sentry)", what: "Stack traces, browser type, URL. No personal identifiers captured.", purpose: "Fix bugs", basis: "Legitimate interest" },
                { data: "Analytics (Plausible)", what: "Aggregated page views, referrer country. No cookies, no personal identifiers.", purpose: "Understand which districts and modules are useful", basis: "Legitimate interest" },
              ]}
            />
          </div>
        </LegalSection>

        <LegalSection n={3} title="What we do not collect">
          {[
            "Aadhaar, PAN, voter ID, driving licence, or any government-issued ID",
            "Personal data of citizens from government portals (we only collect aggregated/statistical data)",
            "Cookies — zero cookies of any kind on this platform",
            "Tracking pixels or third-party advertising trackers",
            "Location data (GPS or precise geolocation)",
            "Biometric data",
            "Financial account numbers or credit card details",
            "Your contacts, photos, or device storage",
          ].map((item) => (
            <p key={item} style={{ ...pStyle, margin: "0 0 6px", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <X size={16} aria-label="Not collected" style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 4 }} />
              <span>{item}</span>
            </p>
          ))}
          <p style={{ ...pStyle, marginTop: 10, fontWeight: 600, color: "var(--ftp-text)" }}>
            We do NOT sell, rent, license, or share your data with advertisers or data brokers.
          </p>
        </LegalSection>

        <LegalSection n={4} title="Data retention">
          <div style={TABLE_GAP}>
            <DataTable
              caption="How long we keep each kind of data, and why"
              columns={[
                { key: "data", label: "Data" },
                { key: "howLong", label: "How long" },
                { key: "why", label: "Why" },
              ]}
              rows={[
                { data: "Feedback", howLong: "12 months from submission", why: "Support and follow-up, then deleted" },
                { data: "Vote fingerprints", howLong: "Until the feature is built, shipped, or removed — max 24 months", why: "Prevent duplicate voting" },
                { data: "Supporter data", howLong: "7 years minimum", why: "Indian Income Tax Act record-keeping requirement" },
                { data: "Server logs", howLong: "30 days", why: "Vercel platform default; security investigations" },
                { data: "Error logs (Sentry)", howLong: "90 days", why: "Debugging" },
                { data: "Analytics (Plausible)", howLong: "Aggregated indefinitely; individual visit data not retained", why: "Analysis is stateless" },
              ]}
            />
          </div>
        </LegalSection>

        <LegalSection n={5} title="Your rights under DPDP Act, 2023">
          <p style={pStyle}>You have the following rights over your personal data:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}><strong>Right to Access:</strong> Request a copy of what we hold about you</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Correction:</strong> Request correction of inaccurate data</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Withdraw Consent:</strong> Withdraw previously given consent at any time (this does not affect processing that occurred before withdrawal)</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Grievance Redressal:</strong> Raise concerns about our data practices and receive a response</li>
            <li style={{ marginBottom: 6 }}><strong>Right to Nominate:</strong> Nominate another individual to exercise these rights in case of your death or incapacity</li>
          </ul>
          <p style={pStyle}>
            <strong>How to exercise:</strong> Email <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a> with the subject line <strong>&quot;DPDP Data Request&quot;</strong>. We will respond within 30 days. If you are unsatisfied with our response, you have the right to file a complaint with the <strong>Data Protection Board of India</strong>.
          </p>
        </LegalSection>

        <LegalSection n={6} title="Grievance officer">
          <p style={pStyle}>Under DPDP Act 2023, we have designated the following as our Grievance Officer:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}><strong>Name:</strong> Jayanth M B</li>
            <li style={{ marginBottom: 6 }}><strong>Role:</strong> Founder &amp; Data Fiduciary Contact</li>
            <li style={{ marginBottom: 6 }}><strong>Email:</strong> <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a></li>
            <li style={{ marginBottom: 6 }}><strong>Response time:</strong> Within 30 days of receipt</li>
          </ul>
        </LegalSection>

        <LegalSection n={7} title="Children's data">
          <p style={pStyle}>
            ForThePeople.in is not directed at children under 18. We do not knowingly collect personal data from minors. Feature voting uses anonymous fingerprints that cannot identify individuals, including minors. If you are a parent or guardian and believe a child has submitted personal data (for example, via the feedback form), please contact us immediately at <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a> and we will delete it within 72 hours.
          </p>
          <p style={pStyle}>
            Under DPDP Act 2023, we do not engage in targeted advertising or behavioural monitoring of children.
          </p>
        </LegalSection>

        <LegalSection n={8} title="Cross-border data transfers">
          <p style={pStyle}>Some of our processors store or process data on servers outside India. We disclose these clearly:</p>
          <div style={TABLE_GAP}>
            <DataTable
              caption="Where each processor stores or processes data"
              columns={[
                { key: "processor", label: "Processor" },
                { key: "purpose", label: "Purpose" },
                { key: "location", label: "Data location" },
              ]}
              rows={[
                { processor: "Vercel", purpose: "Hosting", location: "Global edge + US origin" },
                { processor: "Razorpay", purpose: "Payments", location: "India" },
                { processor: "Neon", purpose: "Database", location: "Can be configured per region; currently hosted in an Asia region" },
                { processor: "Upstash", purpose: "Cache", location: "Global (AWS regions)" },
                { processor: "Plausible", purpose: "Analytics", location: "EU (Germany)" },
                { processor: "Resend", purpose: "Admin email", location: "US" },
                { processor: "Sentry", purpose: "Error logs", location: "US" },
              ]}
            />
          </div>
          <p style={pStyle}>
            These transfers are made under contractual safeguards with each processor. The Government of India may from time to time restrict certain countries for cross-border transfers under DPDP Act 2023; we will update this list if that happens.
          </p>
        </LegalSection>

        <LegalSection n={9} title="Automated decision-making and AI processing">
          <p style={pStyle}>We use automated systems and AI models for:</p>
          <ul style={{ ...pStyle, paddingLeft: 20, margin: "0 0 12px" }}>
            <li style={{ marginBottom: 6 }}>News classification (assigning news articles to relevant modules such as Infrastructure, Elections, Health)</li>
            <li style={{ marginBottom: 6 }}>AI insights and summaries on each module page</li>
            <li style={{ marginBottom: 6 }}>Data fact-checking and confidence scoring</li>
          </ul>
          <p style={pStyle}>
            These systems do not make decisions that produce legal or significant effects on you as an individual — they only classify and summarise public information. If you believe an AI-generated summary is incorrect or unfair to you, please report it via feedback and we will review within 24 hours.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Data security">
          <ul style={{ ...pStyle, paddingLeft: 20, margin: 0 }}>
            <li style={{ marginBottom: 6 }}>AES-256 encryption for sensitive data at rest</li>
            <li style={{ marginBottom: 6 }}>TLS 1.2+ (HTTPS) for all data in transit</li>
            <li style={{ marginBottom: 6 }}>Two-factor authentication (Google Authenticator TOTP) on the admin panel</li>
            <li style={{ marginBottom: 6 }}>HMAC-SHA256 payment signature verification for all Razorpay webhooks</li>
            <li style={{ marginBottom: 6 }}>No plaintext passwords anywhere in our systems</li>
            <li style={{ marginBottom: 6 }}>IP-based admin panel access restriction</li>
          </ul>
        </LegalSection>

        <LegalSection n={11} title="Data breach notification">
          <p style={pStyle}>
            In the event of a personal data breach that is likely to result in risk to you, we will notify affected users within <strong>72 hours</strong> of becoming aware of the breach, as required under DPDP Act 2023. Notifications will include the nature of the breach, data affected, actions being taken, and steps you can take to protect yourself. We will also notify the Data Protection Board of India within the required timeframe.
          </p>
        </LegalSection>

        <LegalSection n={12} title="Third-party services">
          <div style={TABLE_GAP}>
            <DataTable
              caption="Third-party services we use and their privacy policies"
              columns={[
                { key: "service", label: "Service" },
                { key: "purpose", label: "Purpose" },
                { key: "policy", label: "Privacy policy" },
              ]}
              rows={[
                { service: "Vercel", purpose: "Hosting & deployment", policy: <a href="https://vercel.com/legal/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a> },
                { service: "Razorpay", purpose: "Payment processing", policy: <a href="https://razorpay.com/privacy/" style={linkStyle} target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a> },
                { service: "Neon", purpose: "Managed PostgreSQL database", policy: <a href="https://neon.tech/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">neon.tech/privacy-policy</a> },
                { service: "Upstash", purpose: "Redis cache", policy: <a href="https://upstash.com/trust/privacy.pdf" style={linkStyle} target="_blank" rel="noopener noreferrer">upstash.com/trust/privacy.pdf</a> },
                { service: "Plausible", purpose: "Analytics (no personal data)", policy: <a href="https://plausible.io/data-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">plausible.io/data-policy</a> },
                { service: "Resend", purpose: "Admin emails only", policy: <a href="https://resend.com/legal/privacy-policy" style={linkStyle} target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a> },
                { service: "Sentry", purpose: "Error logs (no personal data)", policy: <a href="https://sentry.io/privacy/" style={linkStyle} target="_blank" rel="noopener noreferrer">sentry.io/privacy</a> },
              ]}
            />
          </div>
        </LegalSection>

        <LegalSection n={13} title="Updates to this policy">
          <p style={pStyle}>
            We may update this Privacy Policy from time to time as our data practices or applicable laws change. Material changes will be highlighted at the top of this page with an updated &quot;Last updated&quot; date. Your continued use of the platform after changes take effect constitutes acceptance of the updated policy.
          </p>
        </LegalSection>

        <LegalSection n={14} title="Contact">
          <p style={pStyle}>
            Email: <a href="mailto:support@forthepeople.in" style={linkStyle}>support@forthepeople.in</a>
          </p>
          <p style={pStyle}>
            Platform: <a href="https://forthepeople.in" style={linkStyle}>forthepeople.in</a>
          </p>
          <p style={pStyle}>
            GitHub: <a href="https://github.com/jayanthmb14/forthepeople" style={linkStyle} target="_blank" rel="noopener noreferrer">github.com/jayanthmb14/forthepeople</a>
          </p>
          <p style={pStyle}>
            Operator: Jayanth M B, Bengaluru, Karnataka, India
          </p>
        </LegalSection>

        <LegalSeeAlso
          links={[
            { href: "/disclaimer", label: "Disclaimer" },
            { href: "/about", label: "About" },
          ]}
        />
       </div>
      </div>
    </main>
  );
}
