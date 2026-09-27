// Mandatory disclaimer — renders on every tender page, list, detail, dashboard.
// Legal basis: RTI §4 proactive disclosure, GODL-India reuse licence,
// Copyright §52(1)(q) government works exemption, NDSAP 2012.

// Design v4: the compact line is plain 13 px body text; the full version is
// a bordered surface card with a sentence-case label. Links take the module
// hue (--hue-deep). The legal wording itself is unchanged, word for word.

"use client";
import Link from "next/link";
import { Scale } from "lucide-react";

/** Link and emphasis styles (tokens only). */
const LINK = { color: "var(--hue-deep)", textDecoration: "underline" } as const;
const STRONG = { fontWeight: 500, color: "var(--ftp-text)" } as const;

type Props = {
  variant?: "compact" | "full";
  /** Props to build the district-scoped /tenders/disclaimer URL. When
   *  omitted the "Full disclaimer" link is suppressed — only the compact
   *  summary text shows. */
  locale?: string;
  stateSlug?: string;
  districtSlug?: string;
};

export default function TenderDisclaimer({
  variant = "compact",
  locale,
  stateSlug,
  districtSlug,
}: Props) {
  const disclaimerHref =
    locale && stateSlug && districtSlug
      ? `/${locale}/${stateSlug}/${districtSlug}/tenders/disclaimer`
      : null;

  if (variant === "compact") {
    return (
      <p
        role="note"
        style={{
          margin: "0 0 16px",
          fontSize: 13,
          lineHeight: "20px",
          color: "var(--ftp-text-2)",
        }}
      >
        <strong style={{ color: "var(--ftp-text)", fontWeight: 500 }}>Data source:</strong> tenders published on KPPP, CPPP, IREPS, defproc.gov.in, BEL eProc and HAL TenderWizard — aggregated under RTI §4 proactive-disclosure rules and the GODL-India licence.
        {disclaimerHref ? (
          <>
            {" "}
            <Link href={disclaimerHref} style={LINK}>Full disclaimer</Link>.
          </>
        ) : (
          "."
        )}
      </p>
    );
  }
  return (
    <div
      role="note"
      style={{
        background: "var(--ftp-surface)",
        border: "1px solid var(--ftp-border)",
        borderRadius: "var(--ftp-radius-card)",
        boxShadow: "var(--ftp-shadow-1)",
        padding: 16,
        margin: "20px 0",
        fontSize: 13,
        color: "var(--ftp-text)",
        lineHeight: "20px",
      }}
    >
      <div className="ftp-label" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Scale size={13} aria-hidden style={{ color: "var(--ftp-warn)" }} />
        Legal and usage disclaimer for tenders
      </div>
      <ol style={{ paddingLeft: 18, margin: 0 }}>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Source data only.</strong> Every tender shown here is aggregated from a public Government of India or State of Karnataka procurement portal. No data is generated or inferred.</li>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Not an official government service.</strong> ForThePeople.in is an independent civic platform. For binding status, always verify on the source portal.</li>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Factual red-flag labels.</strong> Labels like &quot;single bidder&quot; or &quot;short window&quot; are mathematical observations computed from the published data, compared against rules such as GFR 2017, KTPPA 1999, or CVC guidelines. They are not allegations. Legitimate reasons may exist in any individual case.</li>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Eligibility wizard is informational.</strong> Matching runs in your browser against tender-published criteria. Nothing on this page constitutes legal advice under the Advocates Act §33. Consult an enrolled advocate for interpretation.</li>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Personal data protected.</strong> Aadhaar, phone numbers, personal email addresses and individual PAN are automatically redacted from ingested documents (DPDP Act 2023 readiness).</li>
        <li style={{ marginBottom: 8 }}><strong style={STRONG}>Takedown & grievance.</strong> 7-working-day SLA. Email <a href="mailto:support@forthepeople.in?subject=Takedown%20Request%3A%20Tenders%20module" style={LINK}>support@forthepeople.in</a> with subject line &ldquo;Takedown Request&rdquo;. Winning bidders may request 7-year anonymisation for individual records.</li>
        <li><strong style={STRONG}>Licence.</strong> Aggregated data is republished under <a href="https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf" target="_blank" rel="noopener" style={LINK}>GODL-India (Feb 2017)</a> and Copyright Act §52(1)(q).</li>
      </ol>
    </div>
  );
}
