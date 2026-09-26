"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import RedFlagBadge from "@/components/tenders/RedFlagBadge";
import { formatInr } from "@/lib/tenders/format";
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

  return (
    <ModuleErrorBoundary moduleName="TenderTransparency">
      <div style={{ background: "#FAFAF8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 20px 80px" }}>
          <Link href={`/${locale}/${stateSlug}/${districtSlug}/tenders`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#2563EB", textDecoration: "none", marginBottom: 16 }}>
            <ArrowLeft size={14} /> Back to tenders
          </Link>
          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
            <AlertTriangle size={24} style={{ display: "inline", marginRight: 8, verticalAlign: "-4px", color: "#991B1B" }} />
            Transparency — factual indicators
          </h1>
          <p style={{ fontSize: 14, color: "#475569", marginBottom: 24, maxWidth: 720 }}>
            Data-derived observations on live and recent tenders in {data?.districtName ?? "this district"}. Each label is a mathematical comparison against a published rule (GFR 2017, KTPPA 1999, CVC guidelines). They are not allegations. Legitimate reasons may exist for any individual case.
          </p>

          {isLoading && <div style={{ color: "#6B7280" }}>Loading…</div>}
          {error && <div style={{ color: "#B91C1C" }}>Couldn&apos;t load flag data.</div>}
          {data && data.totalTenders === 0 && (
            <div style={{ padding: 24, border: "1px dashed #86EFAC", borderRadius: 12, color: "#166534", background: "#F0FDF4", textAlign: "center" }}>
              ✓ No flagged tenders in {data.districtName} right now. Flags recompute every 2 hours.
            </div>
          )}

          {data && Object.entries(data.flagGroups).map(([flagType, rows]) => (
            <div key={flagType} style={{ marginBottom: 24, background: "#FFFFFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>{FLAG_META[flagType]?.title ?? flagType}</h2>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{rows.length} tender{rows.length !== 1 ? "s" : ""}</span>
              </div>
              <details style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
                <summary style={{ cursor: "pointer", color: "#2563EB" }}>Methodology</summary>
                <p style={{ marginTop: 6, lineHeight: 1.7 }}>{FLAG_META[flagType]?.methodology ?? "—"}</p>
              </details>
              <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {rows.map((r) => (
                  <li key={r.tenderId} style={{ fontSize: 13, color: "#0F172A" }}>
                    <Link href={`/${locale}/${stateSlug}/${districtSlug}/tenders/${r.tenderId}`} style={{ color: "#0F172A", fontWeight: 600 }}>
                      {r.title}
                    </Link>
                    <div style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                      {r.authority} · {formatInr(r.value)}
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4, padding: "6px 10px", background: "#FEF2F2", borderRadius: 6, border: "1px solid #FECACA" }}>
                      {r.factualStatement}
                      {r.referenceRule && <span style={{ color: "#6B7280", marginLeft: 8 }}>— {r.referenceRule}</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          <div style={{ marginTop: 40 }}>
            <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
          </div>
        </div>
      </div>
    </ModuleErrorBoundary>
  );
}
