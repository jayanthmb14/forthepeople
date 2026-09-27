/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender transparency page — Design v3 "Civic Ledger" module template.
// Lists tenders grouped by factual red-flag type, each group with its
// methodology. Flag logic, methodology text and legal sentences are
// unchanged; only the presentation moved to the kit (Card, Pill, Section).

"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Flag } from "lucide-react";
import { PageHeader, Section, Card, Pill, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { formatInr } from "@/lib/tenders/format";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type TransparencyResp = {
  districtName: string;
  flagGroups: Record<string, Array<{ tenderId: string; title: string; factualStatement: string; referenceRule: string | null; authority: string; value: string | null }>>;
  totalTenders: number;
};

const FLAG_META: Record<string, { title: string; methodology: string }> = {
  SINGLE_BIDDER: { title: "Single bidder", methodology: "Count of bids equals 1. CVC guidelines and GFR Rule 173 prefer competitive responses; a single bid is flagged for review without implying wrongdoing." },
  SHORT_WINDOW: { title: "Short bidding window", methodology: "GFR Rule 173 requires a minimum 21-day gap between NIT publication and bid submission for open tenders (where not exempted). Flagged when the gap is under 21 days." },
  PRICE_HIT_RATE: { title: "Price very close to estimate", methodology: "Winning bid >98% of the published estimated value. Not unusual in small tenders, but systematically high hit-rates across a buyer warrant review." },
  REPEAT_WINNER: { title: "Repeat winner", methodology: "Same winning vendor across multiple tenders from the same buyer in the last 24 months. Could indicate specialisation — flagged as an observation." },
  RETENDERED: { title: "Re-tendered", methodology: "Same scope/location retendered after an earlier cancellation. Normal after a no-bid event; flagged for discoverability." },
  RESTRICTIVE_TURNOVER: { title: "Higher-than-typical turnover requirement", methodology: "Required turnover exceeds the 85th percentile of comparable tenders in the same category. Can be legitimate for complex works; flagged for review." },
  DIRECT_NOMINATION: { title: "Direct nomination", methodology: "Awarded via nomination/single-source rather than open tender. Allowed under Rule 194 in specific cases but always flagged for transparency." },
};

export default function TransparencyPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);

  const { data, isLoading, error } = useQuery<TransparencyResp>({
    queryKey: ["tenders-transparency", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/transparency`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const tendersBase = `/${locale}/${stateSlug}/${districtSlug}/tenders`;

  return (
    <ModuleErrorBoundary moduleName="TenderTransparency">
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={AlertTriangle}
          title="Transparency — factual indicators"
          description={`Data-derived observations on live and recent tenders in ${data?.districtName ?? "this district"}. Each label is a mathematical comparison against a published rule (GFR 2017, KTPPA 1999, CVC guidelines). They are not allegations. Legitimate reasons may exist for any individual case.`}
          backHref={tendersBase}
          backLabel="Back to tenders"
          accent={getModuleAccent("tenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {isLoading && <LoadingShell rows={3} />}
        {error && <ErrorBlock message="Couldn't load flag data." />}
        {data && data.totalTenders === 0 && (
          // Honest cadence: no tender cron is scheduled, so no fixed interval is promised.
          <EmptyState
            title={`No flagged tenders in ${data.districtName} right now.`}
            body="Tenders are added when the source portal publishes them; red-flag labels are recalculated when new tenders arrive."
          />
        )}

        {data && Object.entries(data.flagGroups).map(([flagType, rows]) => (
          <Section
            key={flagType}
            title={FLAG_META[flagType]?.title ?? flagType}
            action={<Pill tone="danger" icon={Flag}><span className="ftp-num">{rows.length}</span>&nbsp;tender{rows.length !== 1 ? "s" : ""}</Pill>}
          >
            <Card>
              <details style={{ marginBottom: 12 }}>
                <summary style={{ cursor: "pointer", color: "var(--ftp-brand)", fontSize: 13, lineHeight: "20px", minHeight: 44, display: "flex", alignItems: "center" }}>
                  Methodology
                </summary>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{FLAG_META[flagType]?.methodology ?? "—"}</p>
              </details>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {rows.map((r) => (
                  <li key={r.tenderId} className="ftp-body">
                    <Link href={`${tendersBase}/${r.tenderId}`} style={{ color: "var(--ftp-text)", fontWeight: 500, textDecoration: "underline", textDecorationColor: "var(--ftp-border-strong)" }}>
                      {r.title}
                    </Link>
                    <div style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 2 }}>
                      {r.authority} · <span className="ftp-num">{formatInr(r.value)}</span>
                    </div>
                    {/* The factual statement — plain text, rule reference in text-2. */}
                    <div style={{ marginTop: 4, color: "var(--ftp-text)" }}>
                      {r.factualStatement}
                      {r.referenceRule && <span style={{ color: "var(--ftp-text-2)", marginLeft: 8 }}>— {r.referenceRule}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </Section>
        ))}

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <ModulePageFooter moduleSlug="tenders" locale={locale} state={stateSlug} district={districtSlug} showCompare={false} />
      </div>
    </ModuleErrorBoundary>
  );
}
