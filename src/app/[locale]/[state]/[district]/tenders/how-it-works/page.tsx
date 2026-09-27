/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// "How government tenders actually work" — Design v3 module template.
// PageHeader → compact disclaimer → accordion of explainer sections
// (HowTenderWorks) → full legal disclaimer → sources.

"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { PageHeader, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import HowTenderWorks from "@/components/tenders/HowTenderWorks";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type Resp = { sections: Array<{ slug: string; section: string; orderIndex: number; title: string; bodyMd: string; bodyKn: string | null; translationPending: boolean }> };

export default function HowItWorksPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);

  const { data, isLoading, error } = useQuery<Resp>({
    queryKey: ["tenders-education"],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/how-it-works`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  return (
    <ModuleErrorBoundary moduleName="HowTendersWork">
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={BookOpen}
          title="How government tenders actually work"
          description="Plain-English explainer for first-time bidders — citizens, freelancers, SMEs. No jargon, no marketing. Scroll through or click a section below."
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel="Back to tenders"
          accent={getModuleAccent("tenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {isLoading && <LoadingShell rows={4} />}
        {error && <ErrorBlock message="Couldn't load the explainer." />}
        {!isLoading && !error && data?.sections?.length === 0 && (
          <EmptyState title="The explainer sections are not published yet." />
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
