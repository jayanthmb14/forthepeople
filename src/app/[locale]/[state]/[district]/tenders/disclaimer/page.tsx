/**
 * Full tenders disclaimer page. Composes:
 *   - Universal clauses (GFR 2017, GODL-India, RTI §4, DPDP Act 2023,
 *     Advocates Act §33, support contact, etc.)
 *   - State-specific clauses (e.g., Karnataka → KTPPA 1999).
 *
 * Data source: TenderEducationContent rows where docType='disclaimer',
 * filtered by stateSlug = null (universal) or the current state.
 *
 * PageHeader (the one <h1>), clauses in plain Cards, tokens only. Every
 * legal sentence is unchanged. This is a legal page: headings, navigation
 * and the grievance line are translated ("page_tenders"); the clauses stay
 * in English (they come from the database), and other languages get a
 * note that the English text is the official version.
 */

"use client";

import type React from "react";
import { use } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Mail } from "lucide-react";
import { PageHeader, Section, Card, LoadingShell, EmptyState } from "@/components/district/ui";
import { useModuleText, usePlaceText } from "@/i18n/client";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

interface DisclaimerClause {
  slug: string;
  title: string;
  bodyMd: string;
}
interface DisclaimerResponse {
  stateSlug: string;
  universal: DisclaimerClause[];
  stateSpecific: DisclaimerClause[];
}

// Minimal markdown renderer — bold + italic + paragraph splits only.
// Mirrors the approach in HowTenderWorks to avoid pulling in remark/rehype
// just for legal copy.
function renderParagraphs(md: string): React.ReactNode {
  return md.split(/\n\n+/).map((block, i) => (
    <p key={i} className="ftp-body" style={{ margin: "8px 0", lineHeight: "22px" }}>
      {inline(block)}
    </p>
  ));
}
function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let idx = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > idx) parts.push(text.slice(idx, m.index));
    parts.push(
      m[0].startsWith("**") ? (
        <strong key={key++} style={{ fontWeight: 500 }}>{m[0].slice(2, -2)}</strong>
      ) : (
        <em key={key++}>{m[0].slice(1, -1)}</em>
      ),
    );
    idx = m.index + m[0].length;
  }
  if (idx < text.length) parts.push(text.slice(idx));
  return parts;
}

/** One clause: title (15/22) + paragraphs, in a plain bordered card. */
function Clause({ clause }: { clause: DisclaimerClause }) {
  return (
    <Card as="article" style={{ marginBottom: 12 }}>
      <div lang="en">
        <h3 className="ftp-title" style={{ marginBottom: 4 }}>{clause.title}</h3>
        {renderParagraphs(clause.bodyMd)}
      </div>
    </Card>
  );
}

const LINK: React.CSSProperties = { color: "var(--hue-deep)", textDecoration: "underline" };
const SUPPORT = "support@forthepeople.in";

export default function TenderDisclaimerPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const uiLocale = useLocale();
  const mt = useModuleText();
  const place = usePlaceText();

  const { data, isLoading, error } = useQuery<DisclaimerResponse>({
    queryKey: ["tenders-disclaimer", stateSlug],
    queryFn: () => fetch(`/api/tenders/disclaimer/${stateSlug}`).then((r) => r.json()),
    staleTime: 60 * 60_000, // legal copy barely changes
  });

  const hasContent =
    data && (data.universal.length > 0 || data.stateSpecific.length > 0);
  const stateLabel = place.state(stateSlug, stateSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={ShieldCheck}
          emoji="⚖️"
          title={t("legalPage.title")}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel={t("backToTenders")}
          accent={getModuleAccent("tenders")}
        />

        {uiLocale !== "en" && (
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>{t("disclaimer.englishOnly")}</p>
        )}

        {isLoading && <LoadingShell rows={4} />}
        {error && !isLoading && (
          <p className="ftp-body" style={{ color: "var(--ftp-danger)" }}>
            {t.rich("legalPage.loadError", {
              mail: (c) => (
                <a href={`mailto:${SUPPORT}?subject=Tenders%20disclaimer%20load%20failure`} style={LINK}>
                  {c}
                </a>
              ),
              email: SUPPORT,
            })}
          </p>
        )}
        {!isLoading && !error && data && !hasContent && (
          <EmptyState emoji="⚖️" title={t("legalPage.empty")} />
        )}

        {data && hasContent && (
          <>
            {data.universal.length > 0 && (
              <Section title={t("legalPage.general")} emoji="📜">
                {data.universal.map((c) => <Clause key={c.slug} clause={c} />)}
              </Section>
            )}

            {data.stateSpecific.length > 0 && (
              <Section title={t("legalPage.stateSpecific", { state: stateLabel })} emoji="🏛️">
                {data.stateSpecific.map((c) => <Clause key={c.slug} clause={c} />)}
              </Section>
            )}
          </>
        )}

        {/* Grievance line — icon in the page hue, no tinted box. */}
        <Card style={{ marginTop: 32 }}>
          <p className="ftp-body" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Mail size={16} aria-hidden style={{ color: "var(--hue)", flexShrink: 0, marginTop: 2 }} />
            <span>
              {t.rich("legalPage.grievance", {
                s: (c) => <strong style={{ fontWeight: 500 }}>{c}</strong>,
                mail: (c) => (
                  <a href={`mailto:${SUPPORT}?subject=Takedown%20Request%3A%20Tenders%20disclaimer`} style={LINK}>
                    {c}
                  </a>
                ),
                email: SUPPORT,
              })}
            </span>
          </p>
        </Card>
      </div>
    </ModuleErrorBoundary>
  );
}
