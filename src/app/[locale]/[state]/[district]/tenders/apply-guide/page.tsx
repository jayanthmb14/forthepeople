/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender Apply Guide — module template.
// Quick client-side filter (MSE / Startup / DSC) over the district's live
// tenders, a row of counts (open / kept for MSEs / open to startups) when
// the whole live list fits in one request, plus three reference cards
// (DSC, EMD, checklist). The filter logic and all guidance are unchanged;
// words live in "page_tenders". Layout is one column on phones, list +
// side cards on wider screens.

"use client";

import type React from "react";
import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { PageHeader, Section, Card, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import TenderCard, { type TenderCardData } from "@/components/tenders/TenderCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { IconCountRow } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import { useModuleText } from "@/i18n/client";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type ListResp = { tenders: TenderCardData[]; total: number; districtName: string };

const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

export default function ApplyGuidePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const mt = useModuleText();
  const m = useMoney();
  const [profile, setProfile] = useState({ isMse: false, isStartup: false, hasDsc: false });

  const { data, isLoading, error } = useQuery<ListResp>({
    queryKey: ["tenders-live", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}?status=LIVE&pageSize=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const all = data?.tenders ?? [];
  const filtered = all.filter((x) => {
    if (profile.isMse && x.mseReserved) return true;
    if (profile.isStartup && x.startupExempt) return true;
    if (!profile.isMse && !profile.isStartup) return true;
    return x.mseReserved || x.startupExempt;
  });
  // The count row is only honest when we hold the whole live list.
  const complete = data ? all.length >= data.total : false;

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={ShieldCheck}
          emoji="🧭"
          title={t("apply.title")}
          description={data?.districtName ? t("apply.descriptionIn", { district: data.districtName }) : t("apply.description")}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel={t("backToTenders")}
          accent={getModuleAccent("tenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {complete && all.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <IconCountRow
              label={t("apply.countsAria")}
              items={[
                { key: "open", emoji: "📢", count: m.num(all.length), label: t("apply.countOpen") },
                { key: "mse", emoji: "🏪", count: m.num(all.filter((x) => x.mseReserved).length), label: t("apply.countMse") },
                { key: "startup", emoji: "🚀", count: m.num(all.filter((x) => x.startupExempt).length), label: t("apply.countStartup") },
              ]}
            />
          </div>
        )}

        {/* Main list + reference cards. auto-fit → one column on phones. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, alignItems: "start" }}>
          <div style={{ gridColumn: "span 2", minWidth: 0 }} className="ftp-apply-main">
            <Card tinted padding={14} style={{ marginBottom: 16 }}>
              <div className="ftp-title" style={{ marginBottom: 6 }}>{t("apply.filterTitle")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("wizard.isMse")}</label>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("apply.startup")}</label>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} style={{ accentColor: "var(--hue)" }} /> {t("wizard.hasDsc")}</label>
              </div>
            </Card>

            <Section emoji="🎯" title={t.rich("apply.matches", { n: filtered.length, num })}>
              {isLoading && <LoadingShell rows={3} />}
              {error && <ErrorBlock message={t("list.error")} />}
              {!isLoading && !error && filtered.length === 0 && (
                <EmptyState emoji="🔍" title={t("apply.empty")} />
              )}
              <div style={{ display: "grid", gap: 12 }}>
                {filtered.map((x) => <TenderCard key={x.id} tender={x} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />)}
              </div>
            </Section>
          </div>

          {/* Reference cards */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <SidebarCard emoji="🔏" title={t("apply.dsc.title")}>
              <ul style={listStyle}>
                <li>{t("apply.dsc.l1")}</li>
                <li>{t.rich("apply.dsc.l2", { num })}</li>
                <li>{t("apply.dsc.l3")}</li>
                <li>{t("apply.dsc.l4")}</li>
              </ul>
            </SidebarCard>
            <SidebarCard emoji="💳" title={t("apply.emd.title")}>
              <ul style={listStyle}>
                <li>{t("apply.emd.l1")}</li>
                <li>{t("apply.emd.l2")}</li>
                <li>{t("apply.emd.l3")}</li>
                <li>{t("apply.emd.l4")}</li>
                <li style={{ color: "var(--ftp-live-text)", fontWeight: 500 }}>{t("apply.emd.l5")}</li>
              </ul>
            </SidebarCard>
            <SidebarCard emoji="✅" title={t("apply.checklist.title")}>
              <ul style={listStyle}>
                <li>{t("apply.checklist.l1")}</li>
                <li>{t("apply.checklist.l2")}</li>
                <li>{t("apply.checklist.l3")}</li>
                <li>{t("apply.checklist.l4")}</li>
                <li>{t("apply.checklist.l5")}</li>
              </ul>
            </SidebarCard>
            <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0, padding: "0 4px" }}>
              {t("apply.notLegalAdvice")}
            </p>
          </aside>
        </div>

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <ModulePageFooter moduleSlug="tenders" locale={locale} state={stateSlug} district={districtSlug} showCompare={false} />
      </div>
      {/* On phones the main column must not span two (non-existent) columns. */}
      <style>{`@media (max-width: 767px) { .ftp-apply-main { grid-column: auto !important; } }`}</style>
    </ModuleErrorBoundary>
  );
}

/** A small reference card with an emoji chip and a sentence-case title. */
function SidebarCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <Card padding={12}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 30, height: 30, fontSize: 16, borderRadius: 10 }}>{emoji}</span>
        <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{title}</span>
      </div>
      {children}
    </Card>
  );
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)" };

/** Checkbox + label, 44 px tall so it is easy to tap. */
const checkboxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text)", cursor: "pointer" };
