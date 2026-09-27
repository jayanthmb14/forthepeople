/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * DPDP Act 2023 Compliant Privacy Policy
 */

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { X } from "lucide-react";
import LegalPageHeader from "@/components/common/LegalPageHeader";
import { ModulePage } from "@/components/district/ui";
import { Explainer } from "@/components/district/visuals";
import {
  LEGAL_LINK,
  LegalBody,
  LegalEnglishNote,
  LegalGlance,
  LegalLayout,
  LegalSection,
  LegalSeeAlso,
  LegalTable,
} from "@/components/site/LegalSection";
import { languageAlternates } from "@/i18n/seo";

type Props = { params: Promise<{ locale?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale ?? "en";
  const t = await getTranslations({ locale, namespace: "page_privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: languageAlternates("/privacy", locale),
  };
}

// ── Design v4.1 (slate, the quiet legal colour) ──────────────────────
// Presentation only: SiteHeader band via LegalPageHeader, then the answer
// in one sentence (Explainer) and the policy "at a glance" in four emoji
// cards (translated), then the clauses beside a sticky clause list on
// laptop / PC (a "Jump to a part" drop-down on phones). Numbered clause
// headings in sentence case (LegalSection); the tables are LegalTables (a
// table from 640 px up, one card per row on phones — never sideways
// scrolling); links in the page hue. The legal text is unchanged.
//
// Languages (docs/I18N.md, legal pages): the title, clause headings, table
// headings and captions and "See also" links are translated
// ("page_privacy"). The policy text itself is the binding English
// ("page_privacy.body", English only), tagged lang="en" on other languages,
// with a one-line note saying so. Service names are proper nouns.
//
// Served at /<locale>/privacy through src/app/[locale]/privacy/page.tsx.
const pStyle: React.CSSProperties = { fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", margin: "0 0 10px" };
const linkStyle = LEGAL_LINK;
/** Clause numbers; the heading of clause n is `s<n>`. */
const CLAUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const;
const LIST: React.CSSProperties = { ...pStyle, paddingInlineStart: 20, margin: "0 0 12px" };
const ITEM: React.CSSProperties = { marginBottom: 6 };

/** Processors / services named in clauses 8 and 12 (proper nouns), with their privacy pages. */
const SERVICES: { key: string; name: string; policyUrl: string; policyLabel: string }[] = [
  { key: "vercel", name: "Vercel", policyUrl: "https://vercel.com/legal/privacy-policy", policyLabel: "vercel.com/legal/privacy-policy" },
  { key: "razorpay", name: "Razorpay", policyUrl: "https://razorpay.com/privacy/", policyLabel: "razorpay.com/privacy" },
  { key: "neon", name: "Neon", policyUrl: "https://neon.tech/privacy-policy", policyLabel: "neon.tech/privacy-policy" },
  { key: "upstash", name: "Upstash", policyUrl: "https://upstash.com/trust/privacy.pdf", policyLabel: "upstash.com/trust/privacy.pdf" },
  { key: "plausible", name: "Plausible", policyUrl: "https://plausible.io/data-policy", policyLabel: "plausible.io/data-policy" },
  { key: "resend", name: "Resend", policyUrl: "https://resend.com/legal/privacy-policy", policyLabel: "resend.com/legal/privacy-policy" },
  { key: "sentry", name: "Sentry", policyUrl: "https://sentry.io/privacy/", policyLabel: "sentry.io/privacy" },
];

export default async function PrivacyPage({ params }: Props) {
  const locale = (await params).locale ?? "en";
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "page_privacy" });
  const tags = {
    b: (c: React.ReactNode) => <strong>{c}</strong>,
    mail: (c: React.ReactNode) => (
      <a href="mailto:support@forthepeople.in" style={linkStyle}>
        {c}
      </a>
    ),
    site: (c: React.ReactNode) => (
      <a href="https://forthepeople.in" style={linkStyle}>
        {c}
      </a>
    ),
    gh: (c: React.ReactNode) => (
      <a href="https://github.com/jayanthmb14/forthepeople" style={linkStyle} target="_blank" rel="noopener noreferrer">
        {c}
      </a>
    ),
  };
  const rich = (key: string) => t.rich(`body.${key}`, tags);
  // Table cells hold the English policy text; tag them for screen readers.
  const enLang = locale === "en" ? undefined : "en";
  const rows = (prefix: string, ids: string[], cols: string[]) =>
    ids.map((id) => Object.fromEntries(cols.map((c) => [c, <span key={c} lang={enLang}>{t(`body.${prefix}.${id}.${c}`)}</span>])));

  return (
    <main className="ftp-hue-slate" style={{ background: "var(--ftp-bg)", minHeight: "100vh" }}>
      <ModulePage>
          <LegalPageHeader title={t("title")} lastUpdated="2026-04-16" emoji="🔒" />
          <Explainer emoji="🔒">{t("simple")}</Explainer>
          <LegalGlance
            label={t("glanceLabel")}
            items={[
              { emoji: "🍪", text: t("glance1") },
              { emoji: "📵", text: t("glance2") },
              { emoji: "💳", text: t("glance3") },
              { emoji: "🙋", text: t("glance4") },
            ]}
          />
          <LegalLayout clauses={CLAUSES.map((n) => ({ n, title: t(`s${n}`) }))}>
          <LegalEnglishNote />

          <LegalSection n={1} title={t("s1")}>
            <LegalBody>
              <p style={pStyle}>{rich("s1a")}</p>
              <p style={pStyle}>{t("body.s1b")}</p>
              <p style={pStyle}>
                {t("body.s1operator")}
                <br />
                {rich("s1contact")}
              </p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={2} title={t("s2")}>
            <div>
              <LegalTable
                caption={t("t2Caption")}
                columns={[
                  { key: "data", label: t("t2Data") },
                  { key: "what", label: t("t2What") },
                  { key: "purpose", label: t("t2Purpose") },
                  { key: "basis", label: t("t2Basis") },
                ]}
                rows={rows("t2", ["r1", "r2", "r3", "r4", "r5", "r6", "r7"], ["data", "what", "purpose", "basis"])}
              />
            </div>
          </LegalSection>

          <LegalSection n={3} title={t("s3")}>
            <LegalBody>
              {["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8"].map((id) => (
                <p key={id} style={{ ...pStyle, margin: "0 0 6px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <X size={16} aria-label={t("notCollected")} style={{ color: "var(--ftp-danger)", flexShrink: 0, marginTop: 4 }} />
                  <span>{t(`body.s3.${id}`)}</span>
                </p>
              ))}
              <p style={{ ...pStyle, marginTop: 10, fontWeight: 600, color: "var(--ftp-text)" }}>{t("body.s3.noSale")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={4} title={t("s4")}>
            <div>
              <LegalTable
                caption={t("t4Caption")}
                columns={[
                  { key: "data", label: t("t4Data") },
                  { key: "howLong", label: t("t4HowLong") },
                  { key: "why", label: t("t4Why") },
                ]}
                rows={rows("t4", ["r1", "r2", "r3", "r4", "r5", "r6"], ["data", "howLong", "why"])}
              />
            </div>
          </LegalSection>

          <LegalSection n={5} title={t("s5")}>
            <LegalBody>
              <p style={pStyle}>{t("body.s5.intro")}</p>
              <ul style={LIST}>
                {["r1", "r2", "r3", "r4", "r5", "r6"].map((id) => (
                  <li key={id} style={ITEM}>{rich(`s5.${id}`)}</li>
                ))}
              </ul>
              <p style={pStyle}>{rich("s5.how")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={6} title={t("s6")}>
            <LegalBody>
              <p style={pStyle}>{t("body.s6.intro")}</p>
              <ul style={LIST}>
                {["name", "role", "email", "time"].map((id) => (
                  <li key={id} style={ITEM}>{rich(`s6.${id}`)}</li>
                ))}
              </ul>
            </LegalBody>
          </LegalSection>

          <LegalSection n={7} title={t("s7")}>
            <LegalBody>
              <p style={pStyle}>{rich("s7a")}</p>
              <p style={pStyle}>{t("body.s7b")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={8} title={t("s8")}>
            <LegalBody>
              <p style={pStyle}>{t("body.s8intro")}</p>
            </LegalBody>
            <div>
              <LegalTable
                caption={t("t8Caption")}
                columns={[
                  { key: "processor", label: t("t8Processor") },
                  { key: "purpose", label: t("t8Purpose") },
                  { key: "location", label: t("t8Location") },
                ]}
                rows={SERVICES.map((s) => ({
                  processor: s.name,
                  purpose: <span lang={enLang}>{t(`body.t8.${s.key}.purpose`)}</span>,
                  location: <span lang={enLang}>{t(`body.t8.${s.key}.location`)}</span>,
                }))}
              />
            </div>
            <LegalBody>
              <p style={pStyle}>{t("body.s8outro")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={9} title={t("s9")}>
            <LegalBody>
              <p style={pStyle}>{t("body.s9.intro")}</p>
              <ul style={LIST}>
                {["i1", "i2", "i3"].map((id) => (
                  <li key={id} style={ITEM}>{t(`body.s9.${id}`)}</li>
                ))}
              </ul>
              <p style={pStyle}>{t("body.s9.outro")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={10} title={t("s10")}>
            <LegalBody>
              <ul style={{ ...LIST, margin: 0 }}>
                {["i1", "i2", "i3", "i4", "i5", "i6"].map((id) => (
                  <li key={id} style={ITEM}>{t(`body.s10.${id}`)}</li>
                ))}
              </ul>
            </LegalBody>
          </LegalSection>

          <LegalSection n={11} title={t("s11")}>
            <LegalBody>
              <p style={pStyle}>{rich("s11")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={12} title={t("s12")}>
            <div>
              <LegalTable
                caption={t("t12Caption")}
                columns={[
                  { key: "service", label: t("t12Service") },
                  { key: "purpose", label: t("t12Purpose") },
                  { key: "policy", label: t("t12Policy") },
                ]}
                rows={SERVICES.map((s) => ({
                  service: s.name,
                  purpose: <span lang={enLang}>{t(`body.t12.${s.key}`)}</span>,
                  policy: (
                    <a href={s.policyUrl} style={linkStyle} target="_blank" rel="noopener noreferrer">
                      {s.policyLabel}
                    </a>
                  ),
                }))}
              />
            </div>
          </LegalSection>

          <LegalSection n={13} title={t("s13")}>
            <LegalBody>
              <p style={pStyle}>{t("body.s13")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSection n={14} title={t("s14")}>
            <LegalBody>
              <p style={pStyle}>{rich("s14.email")}</p>
              <p style={pStyle}>{rich("s14.platform")}</p>
              <p style={pStyle}>{rich("s14.github")}</p>
              <p style={pStyle}>{t("body.s14.operator")}</p>
            </LegalBody>
          </LegalSection>

          <LegalSeeAlso
            links={[
              { href: `/${locale}/disclaimer`, label: t("seeDisclaimer"), emoji: "⚠️" },
              { href: `/${locale}/about`, label: t("seeAbout"), emoji: "📖" },
            ]}
          />
          </LegalLayout>
      </ModulePage>
    </main>
  );
}
