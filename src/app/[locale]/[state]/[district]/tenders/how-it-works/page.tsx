/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// "How government tenders actually work" — a reading page.
// ModulePage → PageHeader → one-line disclaimer → the five steps of a
// tender as a picture (kit HowItWorks: numbered steps with arrows on
// tablets and up, a list on phones) → accordion of explainer sections
// (HowTenderWorks, kept to a readable width) → full legal disclaimer →
// sources. Words live in "page_tenders"; the explainer sections come from
// the database (English, with Kannada where written).

"use client";

import { use } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { ModulePage, PageHeader, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import { HowItWorks } from "@/components/district/visuals";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import HowTenderWorks from "@/components/tenders/HowTenderWorks";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import { useModuleText } from "@/i18n/client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type Resp = { sections: Array<{ slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean }> };

/** The life of a tender in five steps (a real sequence, so it is numbered). */
const STEPS = [
  { key: "publish" },
  { key: "bid" },
  { key: "open" },
  { key: "award" },
  { key: "build" },
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
      <ModulePage>
        <PageHeader
          icon={BookOpen}
          title={t("how.title")}
          description={t("how.description")}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel={t("backToTenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* The five steps as pictures — a quick map before the long read. */}
        <div style={{ marginBottom: 24 }}>
          <HowItWorks
            title={t("how.stepsAria")}
            steps={STEPS.map((st) => ({ emoji: "", title: t(`how.steps.${st.key}.title`), body: t(`how.steps.${st.key}.body`) }))}
          />
        </div>

        <div className="ftp-prose">
          {isLoading && <LoadingShell rows={4} />}
          {error && <ErrorBlock message={t("how.loadError")} />}
          {!isLoading && !error && data?.sections?.length === 0 && <EmptyState title={t("how.empty")} />}
          {data?.sections && data.sections.length > 0 && <HowTenderWorks sections={data.sections} />}
        </div>

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <MoneyToolbar shareTitle={mt.label("tenders")} />
      </ModulePage>
    </ModuleErrorBoundary>
  );
}
