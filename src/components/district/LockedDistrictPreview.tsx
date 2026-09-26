/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { Lock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SIDEBAR_MODULES } from "@/lib/constants/sidebar-modules";
import { TIER_CONFIG } from "@/lib/constants/razorpay-plans";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
  stateName: string;
  districtName: string;
  districtNameLocal?: string;
  tagline?: string;
  population?: number | null;
  area?: number | null;
  talukCount?: number;
  literacy?: number | null;
}

interface Sponsor {
  id: string;
  name: string;
  tier: string;
}

export default function LockedDistrictPreview({
  locale,
  stateSlug,
  districtSlug,
  stateName,
  districtName,
  districtNameLocal,
  tagline,
  population,
  area,
  talukCount,
  literacy,
}: Props) {
  const { data } = useQuery<{ contributors: Sponsor[] }>({
    queryKey: ["district-sponsors", districtSlug, stateSlug],
    queryFn: () =>
      fetch(`/api/data/contributors?district=${districtSlug}&state=${stateSlug}`).then((r) => r.json()),
    staleTime: 120_000,
  });

  const sponsors = data?.contributors ?? [];

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E8E8E4", padding: "24px 28px 20px" }}>
        <div style={{ fontSize: 12, color: "#9B9B9B", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
          <MapPin size={11} />
          {stateName}
          <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, fontSize: 11, color: "#EA580C" }}>
            <Lock size={10} /> Preview · Coming Soon
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.6px", margin: 0, lineHeight: 1.1 }}>
          {districtName}
        </h1>
        {districtNameLocal && (
          <div style={{ fontSize: 16, color: "#6B6B6B", fontFamily: "var(--font-regional)", marginTop: 4 }}>
            {districtNameLocal}
          </div>
        )}
        {tagline && (
          <div style={{ fontSize: 13, color: "#9B9B9B", marginTop: 6, fontStyle: "italic" }}>
            &ldquo;{tagline}&rdquo;
          </div>
        )}

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
          {population && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {(population / 1000000).toFixed(2)}M
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Population</div>
            </div>
          )}
          {area && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {area.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>km²</div>
            </div>
          )}
          {literacy && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {literacy}%
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Literacy</div>
            </div>
          )}
          {talukCount && (
            <div style={{ paddingLeft: 20, borderLeft: "1px solid #E8E8E4" }}>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", color: "#1A1A1A" }}>
                {talukCount}
              </div>
              <div style={{ fontSize: 10, color: "#9B9B9B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Taluks</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 24px 40px" }}>
        {/* Coming soon CTA */}
        <div
          style={{
            background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)",
            border: "1px solid #BFDBFE",
            borderRadius: 14,
            padding: "24px 28px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            29 data dashboards are waiting to be unlocked for {districtName}
          </div>
          <p style={{ fontSize: 14, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 20, maxWidth: 480, margin: "0 auto 20px" }}>
            Be the first to sponsor this district and your name will appear here when it launches.
          </p>
          <Link
            href={`/${locale}/support?tier=district&state=${stateSlug}&district=${districtSlug}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 24px",
              background: "#2563EB",
              color: "#fff",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sponsor {districtName} — {TIER_CONFIG.district.emoji} ₹{TIER_CONFIG.district.amount.toLocaleString("en-IN")}/mo →
          </Link>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            <Link href={`/${locale}/support?tier=state&state=${stateSlug}`} style={{ fontSize: 12, color: "#6B6B6B", textDecoration: "none" }}>
              or: Sponsor all of {stateName} →
            </Link>
            <Link href={`/${locale}/support?tier=patron`} style={{ fontSize: 12, color: "#6B6B6B", textDecoration: "none" }}>
              or: Sponsor all of India →
            </Link>
          </div>
        </div>

        {/* Sponsors waiting */}
        {sponsors.length > 0 && (
          <div
            style={{
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              border: "1px solid #FDE68A",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>
              🏆 {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} waiting for {districtName}:
            </div>
            <div style={{ fontSize: 13, color: "#92400E" }}>
              {sponsors.map((s) => s.name).join(" · ")}
            </div>
          </div>
        )}

        {/* Locked modules grid */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "#9B9B9B", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
            Available Modules (locked)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}
          >
            {SIDEBAR_MODULES.filter((m) => m.slug !== "overview" && m.slug !== "contributors").map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.slug}
                  style={{
                    background: "#F5F5F0",
                    border: "1px dashed #D4D4D0",
                    borderRadius: 10,
                    padding: "14px 12px",
                    textAlign: "center",
                    opacity: 0.75,
                    cursor: "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6 }}>
                    <Lock size={14} style={{ color: "#B0B0AA" }} />
                    <Icon size={18} style={{ color: "#9B9B9B" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#9B9B9B", fontWeight: 500 }}>
                    {mod.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
