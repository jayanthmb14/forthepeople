"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import TenderCard, { type TenderCardData } from "@/components/tenders/TenderCard";
import EligibilityWizard from "@/components/tenders/EligibilityWizard";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type ListResp = { tenders: TenderCardData[]; total: number; districtName: string };

export default function ApplyGuidePage({ params }: { params: Promise<{ locale: string; state: string; district: string }> }) {
  const { locale, state: stateSlug, district: districtSlug } = use(params);
  const [profile, setProfile] = useState({ isMse: false, isStartup: false, hasDsc: false });

  const { data } = useQuery<ListResp>({
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
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px 80px" }}>
          <Link href={`/${locale}/${stateSlug}/${districtSlug}/tenders`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB", textDecoration: "none", marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to tenders
          </Link>
          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
            <ShieldCheck size={24} style={{ display: "inline", marginRight: 8, verticalAlign: "-4px", color: "#16A34A" }} />
            Apply Guide
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 24 }}>
            Find tenders you qualify for in {data?.districtName ?? "your district"}. Fully client-side matching — your answers never leave your browser.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
            <div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 10 }}>Quick filter — tell us about yourself</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  <label style={{ fontSize: 13, color: "#374151" }}><input type="checkbox" checked={profile.isMse} onChange={(e) => setProfile((p) => ({ ...p, isMse: e.target.checked }))} /> I&apos;m Udyam-registered (MSE)</label>
                  <label style={{ fontSize: 13, color: "#374151" }}><input type="checkbox" checked={profile.isStartup} onChange={(e) => setProfile((p) => ({ ...p, isStartup: e.target.checked }))} /> DPIIT Startup recognition</label>
                  <label style={{ fontSize: 13, color: "#374151" }}><input type="checkbox" checked={profile.hasDsc} onChange={(e) => setProfile((p) => ({ ...p, hasDsc: e.target.checked }))} /> I have a Class-3 DSC</label>
                </div>
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>{filtered.length} tenders match</h2>
              {filtered.length === 0 && (
                <div style={{ padding: 20, border: "1px dashed #D1D5DB", borderRadius: 10, color: "#6B7280", fontSize: 13, textAlign: "center" }}>
                  No live tenders match your filters right now. Try toggling filters, or check back in a few hours.
                </div>
              )}
              <div style={{ display: "grid", gap: 12 }}>
                {filtered.map((t) => <TenderCard key={t.id} tender={t} districtSlug={districtSlug} stateSlug={stateSlug} locale={locale} />)}
              </div>
            </div>

            {/* Sidebar */}
            <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SidebarCard title="Get your DSC">
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                  <li>Class-3 required for KPPP/CPPP/IREPS</li>
                  <li>Cost: ₹849 – ₹2,500 (1–3 yr validity)</li>
                  <li>Issuance: 2–3 working days</li>
                  <li>Top CAs: eMudhra · Capricorn · Sify · nCode</li>
                </ul>
              </SidebarCard>
              <SidebarCard title="EMD pathways">
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                  <li>DD payable to authority</li>
                  <li>FDR pledged</li>
                  <li>Bank Guarantee</li>
                  <li>NEFT / RTGS / BSD (portal)</li>
                  <li style={{ color: "#047857", fontWeight: 600 }}>MSEs & Startups: fully exempt</li>
                </ul>
              </SidebarCard>
              <SidebarCard title="Submission checklist">
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                  <li>PAN + GST + Udyam cert</li>
                  <li>Last 3 years audited turnover</li>
                  <li>Similar-work experience certs</li>
                  <li>ISO / BIS / PSARA (if required)</li>
                  <li>Filled BOQ, DSC signed, before deadline</li>
                </ul>
              </SidebarCard>
              <div style={{ fontSize: 11, color: "#6B7280", padding: 10 }}>
                This is information, not legal advice (Advocates Act §33). Consult an enrolled advocate for interpretation.
              </div>
            </aside>
          </div>

          <div style={{ marginTop: 40 }}>
            <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
