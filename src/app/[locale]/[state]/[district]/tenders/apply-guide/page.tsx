/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender Apply Guide — "Which open tenders can my business bid for?"
// Recipe (docs/LAYOUT.md): ModulePage → PageHeader → one-line disclaimer →
// a row of counts (open / kept for MSEs / open to startups, only when the
// whole live list fits in one request) → "tell us about yourself"
// checkboxes → matching tenders as tappable cards (tap = the tender's
// DetailSheet) beside three reference cards (DSC, EMD, checklist) on wide
// screens, stacked on phones. The filter runs in the browser; answers never
// leave it. Words live in "page_tenders".

"use client";

import type React from "react";
import { use, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, KeyRound, ListChecks, Megaphone, Rocket, ShieldCheck, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModulePage, PageHeader, Section, Card, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import { IconCountRow } from "@/components/money/visuals";
import { useMoney } from "@/components/money/useMoney";
import { TenderSheet, TenderTapCard } from "@/components/money/TenderSheet";
import type { TenderListRow } from "@/components/money/tender-types";
import { useDistrictName, useModuleText } from "@/i18n/client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type ListResp = { tenders: TenderListRow[]; total: number; districtName: string };

const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

export default function ApplyGuidePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const t = useTranslations("page_tenders");
  const mt = useModuleText();
  const m = useMoney();
  const districtName = useDistrictName(stateSlug, districtSlug);
  const [profile, setProfile] = useState({ isMse: false, isStartup: false, hasDsc: false });
  const [openId, setOpenId] = useState<string | null>(null);
  // Stable, so the open sheet does not re-run its focus effect on every render.
  const closeSheet = useCallback(() => setOpenId(null), []);

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
  const open = openId ? all.find((x) => x.id === openId) ?? null : null;
  // The count row is only honest when we hold the whole live list.
  const complete = data ? all.length >= data.total : false;

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <ModulePage>
        <PageHeader
          icon={ShieldCheck}
          title={t("apply.title")}
          description={t("apply.descriptionIn", { district: districtName })}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel={t("backToTenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {complete && all.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <IconCountRow
              label={t("apply.countsAria")}
              items={[
                { key: "open", icon: Megaphone, count: m.num(all.length), label: t("apply.countOpen") },
                { key: "mse", icon: Store, count: m.num(all.filter((x) => x.mseReserved).length), label: t("apply.countMse") },
                { key: "startup", icon: Rocket, count: m.num(all.filter((x) => x.startupExempt).length), label: t("apply.countStartup") },
              ]}
            />
          </div>
        )}

        {/* Main list + reference cards: side by side when there is room, stacked on phones. */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: "2 1 520px", minWidth: 0 }}>
            <Card tinted padding={14} style={{ marginBottom: 16 }}>
              <div className="ftp-title" style={{ marginBottom: 6 }}>{t("apply.filterTitle")}</div>
              <div style={{ display: "flex", flexWrap: "wrap", columnGap: 16 }}>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} style={checkbox} /> {t("wizard.isMse")}
                </label>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} style={checkbox} /> {t("apply.startup")}
                </label>
                <label style={checkboxLabel}>
                  <input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} style={checkbox} /> {t("wizard.hasDsc")}
                </label>
              </div>
            </Card>

            <Section title={t.rich("apply.matches", { n: filtered.length, num })}>
              {isLoading && <LoadingShell rows={3} />}
              {error && <ErrorBlock message={t("list.error")} />}
              {!isLoading && !error && filtered.length === 0 && <EmptyState title={t("apply.empty")} />}
              {filtered.length > 0 && (
                <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "280px" } as React.CSSProperties}>
                  {filtered.map((x) => (
                    <TenderTapCard key={x.id} tender={x} onOpen={() => setOpenId(x.id)} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Reference cards */}
          <aside style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <SidebarCard icon={KeyRound} title={t("apply.dsc.title")}>
              <ul style={listStyle}>
                <li>{t("apply.dsc.l1")}</li>
                <li>{t.rich("apply.dsc.l2", { num })}</li>
                <li>{t("apply.dsc.l3")}</li>
                <li>{t("apply.dsc.l4")}</li>
              </ul>
            </SidebarCard>
            <SidebarCard icon={CreditCard} title={t("apply.emd.title")}>
              <ul style={listStyle}>
                <li>{t("apply.emd.l1")}</li>
                <li>{t("apply.emd.l2")}</li>
                <li>{t("apply.emd.l3")}</li>
                <li>{t("apply.emd.l4")}</li>
                <li style={{ color: "var(--ftp-live-text)", fontWeight: 500 }}>{t("apply.emd.l5")}</li>
              </ul>
            </SidebarCard>
            <SidebarCard icon={ListChecks} title={t("apply.checklist.title")}>
              <ul style={listStyle}>
                <li>{t("apply.checklist.l1")}</li>
                <li>{t("apply.checklist.l2")}</li>
                <li>{t("apply.checklist.l3")}</li>
                <li>{t("apply.checklist.l4")}</li>
                <li>{t("apply.checklist.l5")}</li>
              </ul>
            </SidebarCard>
            <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0, padding: "0 4px" }}>{t("apply.notLegalAdvice")}</p>
          </aside>
        </div>

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <MoneyToolbar shareTitle={mt.label("tenders")} />

        <TenderSheet tender={open} onClose={closeSheet} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />
      </ModulePage>
    </ModuleErrorBoundary>
  );
}

/** A small reference card with a line-icon chip and a sentence-case title. */
function SidebarCard({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Card padding={14}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="ftp-icon-chip" aria-hidden style={{ width: 28, height: 28, borderRadius: 9 }}>
          <Icon size={15} />
        </span>
        <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{title}</span>
      </div>
      {children}
    </Card>
  );
}

const listStyle: React.CSSProperties = { margin: 0, paddingInlineStart: 16, fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)" };

/** Checkbox + label, 44 px tall so it is easy to tap. */
const checkboxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 13, color: "var(--ftp-text)", cursor: "pointer" };
const checkbox: React.CSSProperties = { accentColor: "var(--hue)", width: 18, height: 18 };
