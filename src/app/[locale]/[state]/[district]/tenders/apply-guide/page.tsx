/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender Apply Guide — Design v3 module template.
// Quick client-side filter (MSE / Startup / DSC) over the district's live
// tenders, plus three reference cards (DSC, EMD, checklist). The filter
// logic and all guidance text are unchanged; layout is one column on
// phones, list + side cards on wider screens.

"use client";

import type React from "react";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { PageHeader, Section, Card, LoadingShell, ErrorBlock, EmptyState } from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import TenderCard, { type TenderCardData } from "@/components/tenders/TenderCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type ListResp = { tenders: TenderCardData[]; total: number; districtName: string };

export default function ApplyGuidePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const [profile, setProfile] = useState({ isMse: false, isStartup: false, hasDsc: false });

  const { data, isLoading, error } = useQuery<ListResp>({
    queryKey: ["tenders-live", districtSlug],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}?status=LIVE&pageSize=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const filtered = (data?.tenders ?? []).filter((t) => {
    if (profile.isMse && t.mseReserved) return true;
    if (profile.isStartup && t.startupExempt) return true;
    if (!profile.isMse && !profile.isStartup) return true;
    return t.mseReserved || t.startupExempt;
  });

  return (
    <ModuleErrorBoundary moduleName="ApplyGuide">
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
        <PageHeader
          icon={ShieldCheck}
          title="Apply Guide"
          description={`Find tenders you qualify for in ${data?.districtName ?? "your district"}. Fully client-side matching — your answers never leave your browser.`}
          backHref={`/${locale}/${stateSlug}/${districtSlug}/tenders`}
          backLabel="Back to tenders"
          accent={getModuleAccent("tenders")}
        />
        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Main list + reference cards. auto-fit → one column on phones. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 24, alignItems: "start" }}>
          <div style={{ gridColumn: "span 2", minWidth: 0 }} className="ftp-apply-main">
            <Card padding={14} style={{ marginBottom: 16 }}>
              <div className="ftp-title" style={{ marginBottom: 6 }}>Quick filter — tell us about yourself</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} /> I&apos;m Udyam-registered (MSE)</label>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} /> DPIIT Startup recognition</label>
                <label style={checkboxLabel}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} /> I have a Class-3 DSC</label>
              </div>
            </Card>

            <Section title={<><span className="ftp-num">{filtered.length}</span> tenders match</>}>
              {isLoading && <LoadingShell rows={3} />}
              {error && <ErrorBlock message="Couldn't load tenders — please try again in a moment." />}
              {!isLoading && !error && filtered.length === 0 && (
                <EmptyState title="No live tenders match your filters right now. Try toggling filters, or check back in a few hours." />
              )}
              <div style={{ display: "grid", gap: 12 }}>
                {filtered.map((t) => <TenderCard key={t.id} tender={t} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />)}
              </div>
            </Section>
          </div>

          {/* Reference cards */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <SidebarCard title="Get your DSC">
              <ul style={listStyle}>
                <li>Class-3 required for KPPP/CPPP/IREPS</li>
                <li>Cost: <span className="ftp-num">₹849 – ₹2,500</span> (1–3 yr validity)</li>
                <li>Issuance: 2–3 working days</li>
                <li>Top CAs: eMudhra · Capricorn · Sify · nCode</li>
              </ul>
            </SidebarCard>
            <SidebarCard title="EMD pathways">
              <ul style={listStyle}>
                <li>DD payable to authority</li>
                <li>FDR pledged</li>
                <li>Bank Guarantee</li>
                <li>NEFT / RTGS / BSD (portal)</li>
                <li style={{ color: "var(--ftp-live-text)", fontWeight: 500 }}>MSEs & Startups: fully exempt</li>
              </ul>
            </SidebarCard>
            <SidebarCard title="Submission checklist">
              <ul style={listStyle}>
                <li>PAN + GST + Udyam cert</li>
                <li>Last 3 years audited turnover</li>
                <li>Similar-work experience certs</li>
                <li>ISO / BIS / PSARA (if required)</li>
                <li>Filled BOQ, DSC signed, before deadline</li>
              </ul>
            </SidebarCard>
            <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0, padding: "0 4px" }}>
              This is information, not legal advice (Advocates Act §33). Consult an enrolled advocate for interpretation.
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

/** A small reference card with an 11 px uppercase label. */
function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card padding={12}>
      <div className="ftp-label" style={{ marginBottom: 8 }}>{title}</div>
      {children}
    </Card>
  );
}

const listStyle: React.CSSProperties = { margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: "22px", color: "var(--ftp-text)" };

/** Checkbox + label, 44 px tall so it is easy to tap. */
const checkboxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text)", cursor: "pointer" };
