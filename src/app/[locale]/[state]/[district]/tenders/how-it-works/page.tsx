/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// "How government tenders actually work" — module template.
// PageHeader → compact disclaimer → the five steps of a tender as a row of
// pictures → accordion of explainer sections (HowTenderWorks) → full legal
// disclaimer → sources. Words live in "page_tenders"; the explainer
// sections come from the database (English, with Kannada where written).

"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { PageHeader, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import HowTenderWorks from "@/components/tenders/HowTenderWorks";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { useModuleText } from "@/i18n/client";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type Resp = { sections: Array<{ slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean }> };

/** The life of a tender in five steps (a real sequence, so it is numbered). */
const STEPS = [
  { key: "publish", emoji: "📢" },
  { key: "bid", emoji: "📝" },
  { key: "open", emoji: "📂" },
  { key: "award", emoji: "🏆" },
  { key: "build", emoji: "🏗️" },
] as const;

export default function HowItWorksPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const mt = useModuleText();

  const { data, isLoading, error } = useQuery<Resp>({
    queryKey: ["tenders-education"],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/how-it-works`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={BookOpen}
          emoji="📚"
          title={t("how.title")}
          description={t("how.description")}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel={t("backToTenders")}
          accent={getModuleAccent("tenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* The five steps as pictures — a quick map before the long read. */}
        <ol
          aria-label={t("how.stepsAria")}
          style={{
            listStyle: "none",
            margin: "0 0 20px",
            padding: 0,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
          }}
        >
          {STEPS.map((st, i) => (
            <li
              key={st.key}
              className="ftp-pop"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "12px 14px",
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)",
                border: "1px solid color-mix(in srgb, var(--hue) 20%, var(--ftp-border))",
                ["--i" as string]: i,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 36, height: 36, fontSize: 19, borderRadius: 11, background: "#fff" }}>
                  {st.emoji}
                </span>
                <span className="ftp-num" style={{ fontSize: 13, fontWeight: 650, color: "var(--hue-deep)" }}>{i + 1}</span>
              </span>
              <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{t(`how.steps.${st.key}.title`)}</span>
              <span style={{ fontSize: 12, lineHeight: "17px", color: "var(--ftp-text-2)" }}>{t(`how.steps.${st.key}.body`)}</span>
            </li>
          ))}
        </ol>

        {isLoading && <LoadingShell rows={4} />}
        {error && <ErrorBlock message={t("how.loadError")} />}
        {!isLoading && !error && data?.sections?.length === 0 && (
          <EmptyState emoji="📚" title={t("how.empty")} />
        )}
        {data?.sections && data.sections.length > 0 && <HowTenderWorks sections={data.sections} />}

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <ModulePageFooter moduleSlug="tenders" locale={locale} state={stateSlug} district={districtSlug} showCompare={false} />
      </div>
    </ModuleErrorBoundary>
  );
}
