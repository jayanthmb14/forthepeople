// Mandatory disclaimer — renders on every tender page, list, detail, dashboard.
// Legal basis: RTI §4 proactive disclosure, GODL-India reuse licence,
// Copyright §52(1)(q) government works exemption, NDSAP 2012.

"use client";
import Link from "next/link";

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
      <div
        role="note"
        style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          padding: "8px 14px",
          margin: "8px 0 16px",
          fontSize: 12,
          color: "#475569",
          lineHeight: 1.6,
        }}
      >
        <strong style={{ color: "#0F172A" }}>Data source:</strong> tenders published on KPPP, CPPP, IREPS, defproc.gov.in, BEL eProc and HAL TenderWizard — aggregated under RTI §4 proactive-disclosure rules and the GODL-India licence.
        {disclaimerHref ? (
          <>
            {" "}
            <Link href={disclaimerHref} style={{ color: "#2563EB", textDecoration: "underline" }}>Full disclaimer</Link>.
          </>
        ) : (
          "."
        )}
      </div>
    );
  }
  return (
    <div
      role="note"
      style={{
        background: "#FFF9F0",
        border: "1px solid #FDE68A",
        borderRadius: 10,
        padding: "16px 20px",
        margin: "20px 0",
        fontSize: 13,
        color: "#334155",
        lineHeight: 1.7,
      }}
    >
      <div style={{ fontWeight: 700, color: "#92400E", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        Tenders — Legal & Usage Disclaimer
      </div>
      <ol style={{ paddingLeft: 18, margin: 0 }}>
        <li style={{ marginBottom: 8 }}><strong>Source data only.</strong> Every tender shown here is aggregated from a public Government of India or State of Karnataka procurement portal. No data is generated or inferred.</li>
        <li style={{ marginBottom: 8 }}><strong>Not an official government service.</strong> ForThePeople.in is an independent civic platform. For binding status, always verify on the source portal.</li>
        <li style={{ marginBottom: 8 }}><strong>Factual red-flag labels.</strong> Labels like &quot;single bidder&quot; or &quot;short window&quot; are mathematical observations computed from the published data, compared against rules such as GFR 2017, KTPPA 1999, or CVC guidelines. They are not allegations. Legitimate reasons may exist in any individual case.</li>
        <li style={{ marginBottom: 8 }}><strong>Eligibility wizard is informational.</strong> Matching runs in your browser against tender-published criteria. Nothing on this page constitutes legal advice under the Advocates Act §33. Consult an enrolled advocate for interpretation.</li>
        <li style={{ marginBottom: 8 }}><strong>Personal data protected.</strong> Aadhaar, phone numbers, personal email addresses and individual PAN are automatically redacted from ingested documents (DPDP Act 2023 readiness).</li>
        <li style={{ marginBottom: 8 }}><strong>Takedown & grievance.</strong> 7-working-day SLA. Email <a href="mailto:support@forthepeople.in?subject=Takedown%20Request%3A%20Tenders%20module" style={{ color: "#2563EB", textDecoration: "underline" }}>support@forthepeople.in</a> with subject line &ldquo;Takedown Request&rdquo;. Winning bidders may request 7-year anonymisation for individual records.</li>
        <li><strong>Licence.</strong> Aggregated data is republished under <a href="https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf" target="_blank" rel="noopener" style={{ color: "#2563EB", textDecoration: "underline" }}>GODL-India (Feb 2017)</a> and Copyright Act §52(1)(q).</li>
      </ol>
    </div>
  );
}
