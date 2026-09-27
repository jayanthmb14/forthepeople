// Mandatory disclaimer — renders on every tender page, list, detail, dashboard.
// Legal basis: RTI §4 proactive disclosure, GODL-India reuse licence,
// Copyright §52(1)(q) government works exemption, NDSAP 2012.

// Design v4: the compact line is plain 13 px body text; the full version is
// a bordered surface card with a sentence-case label. Links take the module
// hue (--hue-deep). The legal wording itself is unchanged, word for word.
// i18n: the compact line and the heading are translated (page_tenders);
// the seven legal clauses are English-only on purpose (their keys exist
// only in the English messages) and other languages get a one-line note
// that the English text is the official version.

"use client";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Scale } from "lucide-react";

/** Link and emphasis styles (tokens only). */
const LINK = { color: "var(--hue-deep)", textDecoration: "underline" } as const;
const STRONG = { fontWeight: 500, color: "var(--ftp-text)" } as const;

const TAKEDOWN_MAIL = "mailto:support@forthepeople.in?subject=Takedown%20Request%3A%20Tenders%20module";
const GODL_URL = "https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf";

type Props = {
  variant?: "compact" | "full";
  /** Props to build the district-scoped /tenders/disclaimer URL. When
   *  omitted the "Full disclaimer" link is suppressed — only the compact
   *  summary text shows. */
  locale?: string;
  stateSlug?: string;
  districtSlug?: string;
};

const s = (c: React.ReactNode) => <strong style={STRONG}>{c}</strong>;

export default function TenderDisclaimer({
  variant = "compact",
  locale,
  stateSlug,
  districtSlug,
}: Props) {
  const t = useTranslations("page_tenders");
  const uiLocale = useLocale();
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
        {t.rich("disclaimer.compact", { s: (c) => <strong style={{ color: "var(--ftp-text)", fontWeight: 500 }}>{c}</strong> })}
        {disclaimerHref && (
          <>
            {" "}
            <Link href={disclaimerHref} style={LINK}>{t("disclaimer.fullLink")}</Link>
          </>
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
        {t("disclaimer.heading")}
      </div>
      {uiLocale !== "en" && (
        <p style={{ margin: "0 0 10px", color: "var(--ftp-text-2)" }}>{t("disclaimer.englishOnly")}</p>
      )}
      <ol style={{ paddingLeft: 18, margin: 0 }} lang="en">
        <li style={{ marginBottom: 8 }}>{t.rich("disclaimer.c1", { s })}</li>
        <li style={{ marginBottom: 8 }}>{t.rich("disclaimer.c2", { s })}</li>
        <li style={{ marginBottom: 8 }}>{t.rich("disclaimer.c3", { s })}</li>
        <li style={{ marginBottom: 8 }}>{t.rich("disclaimer.c4", { s })}</li>
        <li style={{ marginBottom: 8 }}>{t.rich("disclaimer.c5", { s })}</li>
        <li style={{ marginBottom: 8 }}>
          {t.rich("disclaimer.c6", { s, mail: (c) => <a href={TAKEDOWN_MAIL} style={LINK}>{c}</a> })}
        </li>
        <li>
          {t.rich("disclaimer.c7", { s, godl: (c) => <a href={GODL_URL} target="_blank" rel="noopener" style={LINK}>{c}</a> })}
        </li>
      </ol>
    </div>
  );
}
