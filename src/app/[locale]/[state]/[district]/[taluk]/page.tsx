/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import Link from "next/link";
import { MapPin, Users, Home, ChevronRight, ArrowLeft } from "lucide-react";
import { useTaluks, useOverview } from "@/hooks/useRealtimeData";
import { getStateConfig } from "@/lib/constants/state-config";

// Taluk overview page — shows taluk stats + village list
export default function TalukPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string }>;
}) {
  const { locale, state, district, taluk: talukSlug } = use(params);
  const districtBase = `/${locale}/${state}/${district}`;
  const stateConfig = getStateConfig(state);
  const subUnit = stateConfig?.subDistrictUnit ?? "Taluk";
  const villageLabel = stateConfig?.villageLabel ?? "Villages";
  const showVillages = stateConfig?.showVillages !== false;
  const gramPanchayatApplicable = stateConfig?.gramPanchayatApplicable !== false;
  const jjmApplicable = stateConfig?.jjmApplicable !== false;
  const { data: taluksData } = useTaluks(district, state);
  const { data: overviewData } = useOverview(district, state);

  const talukData = (taluksData?.data ?? []).find((t) => t.slug === talukSlug);
  const districtName = overviewData?.data?.name ?? district;

  if (!talukData) {
    return (
      <div style={{ padding: 24 }}>
        <Link href={districtBase} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={13} /> Back to {districtName}
        </Link>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1A1A1A" }}>Loading {subUnit.toLowerCase()}...</div>
      </div>
    );
  }

  const villages = talukData.villages;
  const hasVillages = showVillages && villages.length > 0;
  // Prefer taluk.population from DB (seeded zone population); fall back to sum of villages.
  const villageSum = villages.reduce((s, v) => s + (v.population ?? 0), 0);
  const talukPopulation = talukData.population ?? (villageSum > 0 ? villageSum : null);

  const moduleLinks: Array<{ label: string; href: string; icon: string }> = [
    { label: "Crop Prices", href: `${districtBase}/crops?taluk=${talukSlug}`, icon: "🌾" },
    { label: "Water & Dams", href: `${districtBase}/water?taluk=${talukSlug}`, icon: "💧" },
    { label: "Schools", href: `${districtBase}/schools?taluk=${talukSlug}`, icon: "🎓" },
  ];
  if (gramPanchayatApplicable) {
    moduleLinks.push({ label: "Gram Panchayats", href: `${districtBase}/gram-panchayat?taluk=${talukSlug}`, icon: "🏘️" });
  }
  if (jjmApplicable) {
    moduleLinks.push({ label: "JJM Coverage", href: `${districtBase}/jjm?taluk=${talukSlug}`, icon: "🚰" });
  }
  moduleLinks.push({ label: "Overview", href: districtBase, icon: "📊" });

  const metaLine = hasVillages
    ? `Part of ${districtName} District · ${villages.length} ${villageLabel.toLowerCase()}`
    : `Part of ${districtName} District · Urban zone`;

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <Link href={districtBase} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={13} /> {districtName}
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 24, borderBottom: "1px solid #E8E8E4", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, background: "#EFF6FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={20} style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.4px" }}>{talukData.name} {subUnit}</h1>
            {talukData.nameLocal && <div style={{ fontSize: 14, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{talukData.nameLocal}</div>}
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 6 }}>
          {metaLine}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {showVillages && (
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
              <Home size={13} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{villageLabel}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{talukData._count.villages}</div>
          </div>
        )}
        <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
            <Users size={13} style={{ color: "#16A34A" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Population</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
            {talukPopulation != null ? talukPopulation.toLocaleString("en-IN") : "—"}
          </div>
        </div>
        {talukData.area != null && (
          <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
              <MapPin size={13} style={{ color: "#D97706" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Area</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {talukData.area.toLocaleString("en-IN")} km²
            </div>
          </div>
        )}
      </div>

      {/* District module links */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
        View Data for This {subUnit}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, marginBottom: 28 }}>
        {moduleLinks.map(({ label, href, icon }) => (
          <Link key={label} href={href} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, textDecoration: "none",
          }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#1A1A1A" }}>{label}</span>
            <ChevronRight size={12} style={{ color: "#C0C0C0", marginLeft: "auto" }} />
          </Link>
        ))}
      </div>

      {/* Village list — only for districts where villages are meaningful */}
      {hasVillages && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            {villageLabel} in {talukData.name} ({villages.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
            {villages.map((v) => (
              <Link
                key={v.id}
                href={`/${locale}/${state}/${district}/${talukSlug}/${v.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", background: "#FFF", border: "1px solid #E8E8E4",
                  borderRadius: 10, textDecoration: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{v.name}</div>
                  {v.nameLocal && <div style={{ fontSize: 11, color: "#9B9B9B", fontFamily: "var(--font-regional)" }}>{v.nameLocal}</div>}
                  {v.population && <div style={{ fontSize: 11, color: "#9B9B9B" }}>{v.population.toLocaleString("en-IN")} pop</div>}
                </div>
                <ChevronRight size={13} style={{ color: "#C0C0C0" }} />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
