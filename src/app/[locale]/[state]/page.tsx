/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getState } from "@/lib/constants/districts";
import { Lock, ArrowRight, MapPin } from "lucide-react";
import StateMapSection from "@/components/map/StateMapSection";
import StateSponsorSection from "@/components/common/StateSponsorSection";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateData = getState(state);
  if (!stateData) return {};
  return {
    title: `${stateData.name} Districts — Government Data | ForThePeople.in`,
    description: `Explore all ${stateData.districts.length} districts in ${stateData.name}. Free district-level government data: crop prices, water levels, schemes, budgets, and more.`,
    alternates: { canonical: `${BASE_URL}/en/${state}` },
    openGraph: { url: `${BASE_URL}/en/${state}` },
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ locale: string; state: string }>;
}) {
  const { locale, state: stateSlug } = await params;
  const stateData = getState(stateSlug);
  if (!stateData) notFound();

  return (
    <main style={{ background: "#FAFAF8", minHeight: "calc(100vh - 56px - 36px)" }}>
      <style>{`
        @media (min-width: 768px) {
          .state-grid-with-map { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 767px) {
          .state-grid-with-map { grid-template-columns: 1fr !important; }
          .state-grid-with-map > div:first-child { max-height: 280px !important; }
        }
      `}</style>
      {/* State header */}
      <div
        style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E8E4",
          padding: "24px 24px 20px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <MapPin size={14} style={{ color: "#9B9B9B" }} />
            <span style={{ fontSize: 12, color: "#9B9B9B" }}>India</span>
            <span style={{ fontSize: 12, color: "#9B9B9B" }}>·</span>
            <span style={{ fontSize: 12, color: "#6B6B6B" }}>{stateData.name}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.5px" }}>
            {stateData.name}
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B6B", marginTop: 4 }}>
            {stateData.nameLocal}
            {stateData.capital && ` · Capital: ${stateData.capital}`}
            {" · "}
            {stateData.districts.length} districts
          </p>
          {!stateData.active && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 10,
                fontSize: 13,
                color: "#1E40AF",
                lineHeight: 1.6,
              }}
            >
              🔓 This state is coming soon to ForThePeople.in. District data is being prepared. You can{" "}
              <Link href={`/${locale}/support`} style={{ color: "#2563EB", fontWeight: 600 }}>
                sponsor a district
              </Link>{" "}
              to help us launch faster.
            </div>
          )}
        </div>
      </div>

      {/* Map + District grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <div
          style={{ display: "grid", gap: 24 }}
          className="state-grid-with-map"
        >
          {/* State district map */}
          <div style={{ maxHeight: 400, overflow: "hidden" }}>
            <StateMapSection
              locale={locale}
              stateSlug={stateSlug}
              activeDistrictSlugs={stateData.districts.filter((d) => d.active).map((d) => d.slug)}
            />
          </div>

          {/* District grid */}
          <div>
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#9B9B9B",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Districts ({stateData.districts.length})
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 10,
              }}
            >
          {stateData.districts.map((d) => (
            d.active ? (
              <Link
                key={d.slug}
                href={`/${locale}/${stateSlug}/${d.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "#1D4ED8",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <div>
                  <div>{d.name}</div>
                  {d.nameLocal && (
                    <div style={{ fontSize: 11, color: "#6B6B6B", fontFamily: "var(--font-regional)", marginTop: 2 }}>
                      {d.nameLocal}
                    </div>
                  )}
                </div>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                key={d.slug}
                href={`/${locale}/${stateSlug}/${d.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  background: "#FAFAF8",
                  border: "1px solid #E8E8E4",
                  borderRadius: 10,
                  color: "#9B9B9B",
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                <div>
                  <div>{d.name}</div>
                  {d.nameLocal && (
                    <div style={{ fontSize: 11, fontFamily: "var(--font-regional)", marginTop: 2 }}>
                      {d.nameLocal}
                    </div>
                  )}
                </div>
                <Lock size={13} />
              </Link>
            )
          ))}
          </div>
        </div>
        </div>

        {/* ── State-level contributor section ── */}
        <StateSponsorSection locale={locale} stateSlug={stateSlug} stateName={stateData.name} />
      </div>
    </main>
  );
}
