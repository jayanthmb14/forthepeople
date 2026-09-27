/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import LegalPageHeader from "@/components/common/LegalPageHeader";
import { LEGAL_LINK, LegalBody, LegalEnglishNote, LegalSection, LegalSeeAlso } from "@/components/site/LegalSection";
import { languageAlternates } from "@/i18n/seo";

type Props = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const t = await getTranslations({ locale, namespace: "page_disclaimer" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/disclaimer", locale),
  };
}

// ── Design v4 "Rang" (slate, the quiet legal colour) ─────────────────
// Presentation only: SiteHeader band via LegalPageHeader, numbered clause
// headings in sentence case (LegalSection), links in the page hue. No
// picture: this page has no data. The legal text is unchanged.
//
// Languages (docs/I18N.md, legal pages): the title, clause headings and
// "See also" links are translated ("page_disclaimer"). The clause text is
// the binding English ("page_disclaimer.body", English only), tagged
// lang="en" on other languages, with a one-line note saying so.
//
// Served at /<locale>/disclaimer through src/app/[locale]/disclaimer/page.tsx.
const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", margin: 0 };
const linkStyle = LEGAL_LINK;

/** Clauses in order; the heading is `s<n>`, the English body `body.s<n>`. */
const CLAUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;

export default async function DisclaimerPage({ params }: Props) {
  const locale = (await params).locale ?? "en";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_disclaimer" });
  const tags = {
    b: (c: React.ReactNode) => <strong>{c}</strong>,
    mail: (c: React.ReactNode) => (
      <a href="mailto:support@forthepeople.in" style={linkStyle}>
        {c}
      </a>
    ),
    link: (c: React.ReactNode) => (
      <Link href={`/${locale}/contribute`} style={linkStyle}>
        {c}
      </Link>
    ),
  };

  /** The English clause text for clause n (one or more paragraphs). */
  function clauseBody(n: (typeof CLAUSES)[number]) {
    if (n === 6) {
      return (
        <>
          <p style={pStyle}>{t.rich("body.s6a", tags)}</p>
          <p style={{ ...pStyle, marginTop: 10 }}>{t.rich("body.s6b", tags)}</p>
        </>
      );
    }
    if (n === 14) {
      return (
        <>
          <p style={pStyle}>{t("body.s14a")}</p>
          <ul style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", margin: "8px 0 0", paddingInlineStart: 20 }}>
            <li>{t.rich("body.s14email", tags)}</li>
          </ul>
          <p style={{ ...pStyle, marginTop: 8 }}>{t("body.s14b")}</p>
        </>
      );
    }
    return <p style={pStyle}>{t.rich(`body.s${n}`, tags)}</p>;
  }

  return (
    <main className="ftp-hue-slate" style={{ background: "var(--ftp-bg)", minHeight: "100vh" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div style={{ maxWidth: 760 }}>
          <LegalPageHeader title={t("title")} lastUpdated="2026-04-16" emoji="⚠️" />
          <LegalEnglishNote />

          {CLAUSES.map((n) => (
            <LegalSection key={n} n={n} title={t(`s${n}`)}>
              <LegalBody>{clauseBody(n)}</LegalBody>
            </LegalSection>
          ))}

          <LegalSeeAlso
            links={[
              { href: `/${locale}/privacy`, label: t("seePrivacy"), emoji: "🔒" },
              { href: `/${locale}/about`, label: t("seeAbout"), emoji: "📖" },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
