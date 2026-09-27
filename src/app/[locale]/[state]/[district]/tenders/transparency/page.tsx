/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender transparency page — "Which tenders look unusual, and why?"
// ModulePage → PageHeader → Explainer ("12 of 80 tenders carry an
// indicator; an indicator is not an accusation") → one-line disclaimer →
// a "which indicators come up most" list, then tenders grouped by factual
// red-flag type, each group with its methodology. Flag logic and legal
// sentences are unchanged; words live in "page_tenders" (flag names and
// methodology included). Tender titles, authorities and the computed
// factual statements stay exactly as published.

"use client";

import type React from "react";
import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Flag } from "lucide-react";
import { ModulePage, PageHeader, Section, Card, Pill, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { TopBarList } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import { useDistrictName, useModuleText } from "@/i18n/client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type TransparencyResp = {
  districtName: string;
  flagGroups: Record<string, Array<{ tenderId: string; title: string; factualStatement: string; referenceRule: string | null; authority: string; value: string | null }>>;
  totalTenders: number;
};

/** One emoji per indicator type. */
const FLAG_EMOJI: Record<string, string> = {
  SINGLE_BIDDER: "1️⃣",
  SHORT_WINDOW: "⏱️",
  PRICE_HIT_RATE: "🎯",
  REPEAT_WINNER: "🔁",
  RETENDERED: "♻️",
  RESTRICTIVE_TURNOVER: "📈",
  DIRECT_NOMINATION: "👉",
};

const b = (c: React.ReactNode) => <strong>{c}</strong>;

export default function TransparencyPage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const mt = useModuleText();
  const m = useMoney();
  const districtName = useDistrictName(stateSlug, districtSlug);

  const { data, isLoading, error } = useQuery<TransparencyResp>({
    queryKey: ["tenders-transparency", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/transparency`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const tendersBase = `/${locale}/${stateSlug}/${districtSlug}/tenders`;
  const flagName = (type: string) => (t.has(`flagTitle.${type}`) ? t(`flagTitle.${type}`) : type);
  const groups = Object.entries(data?.flagGroups ?? {})
    .map(([type, rows]) => ({ type, rows }))
    .sort((a, b2) => b2.rows.length - a.rows.length);
  // How many different tenders carry at least one indicator.
  const flaggedTenders = new Set(groups.flatMap((g) => g.rows.map((r) => r.tenderId))).size;

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <ModulePage>
        <PageHeader
          icon={AlertTriangle}
          emoji="🔎"
          title={t("transparency.title")}
          description={t("transparency.descriptionIn", { district: districtName })}
          backHref={tendersBase}
          backLabel={t("backToTenders")}
        />

        {/* The answer in one sentence. */}
        {data && flaggedTenders > 0 && (
          <Explainer emoji="🚩">{t.rich("transparency.explainer", { n: flaggedTenders, total: data.totalTenders, district: districtName, b })}</Explainer>
        )}

        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {isLoading && <LoadingShell rows={3} />}
        {error && <ErrorBlock message={t("transparency.loadError")} />}
        {data && data.totalTenders === 0 && (
          // Honest cadence: no tender cron is scheduled, so no fixed interval is promised.
          <EmptyState
            emoji="🔎"
            title={t("transparency.emptyTitle", { district: data.districtName })}
            body={t("transparency.emptyBody")}
          />
        )}

        {/* Which indicators come up most — only when there are two or more kinds. */}
        {groups.length >= 2 && (
          <div style={{ marginBottom: 8 }}>
            <ChartCard
              title={t("transparency.chartTitle")}
              emoji="🚩"
              units={t("transparency.chartUnits")}
              simple={t.rich("transparency.chartSimple", { name: flagName(groups[0].type), n: groups[0].rows.length, b })}
              source={{ label: t("sourceLabel") }}
              table={groups.map((g) => ({ label: flagName(g.type), value: m.num(g.rows.length) }))}
            >
              <TopBarList
                max={7}
                rows={groups.map((g) => ({
                  key: g.type,
                  label: flagName(g.type),
                  emoji: FLAG_EMOJI[g.type] ?? "🚩",
                  value: g.rows.length,
                  display: t("transparency.count", { n: g.rows.length }),
                }))}
              />
            </ChartCard>
          </div>
        )}

        {groups.map(({ type, rows }) => (
          <Section
            key={type}
            emoji={FLAG_EMOJI[type] ?? "🚩"}
            title={flagName(type)}
            action={<Pill tone="danger" icon={Flag}>{t("transparency.count", { n: rows.length })}</Pill>}
          >
            <Card>
              <details style={{ marginBottom: 12 }}>
                <summary style={{ cursor: "pointer", color: "var(--hue-deep)", fontWeight: 600, fontSize: 13, lineHeight: "20px", minHeight: 44, display: "flex", alignItems: "center" }}>
                  {t("transparency.methodology")}
                </summary>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>
                  {t.has(`method.${type}`) ? t(`method.${type}`) : "—"}
                </p>
              </details>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {rows.map((r) => (
                  <li key={r.tenderId} className="ftp-body">
                    <Link href={`${tendersBase}/${r.tenderId}`} style={{ color: "var(--ftp-text)", fontWeight: 500, textDecoration: "underline", textDecorationColor: "var(--ftp-border-strong)" }}>
                      {r.title}
                    </Link>
                    <div style={{ color: "var(--ftp-text-2)", fontSize: 11, lineHeight: "16px", marginTop: 2, display: "flex", flexWrap: "wrap", columnGap: 10 }}>
                      <span>{r.authority}</span>
                      <span className="ftp-num">{m.short(r.value)}</span>
                    </div>
                    {/* The factual statement — plain text, rule reference in text-2. */}
                    <div style={{ marginTop: 4, color: "var(--ftp-text)" }}>
                      {r.factualStatement}
                      {r.referenceRule && <span style={{ color: "var(--ftp-text-2)", marginLeft: 8 }}>({r.referenceRule})</span>}
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
      </ModulePage>
    </ModuleErrorBoundary>
  );
}
