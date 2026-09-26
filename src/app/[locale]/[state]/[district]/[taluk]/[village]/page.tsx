/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import Link from "next/link";
import { MapPin, Users, Home, ChevronRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface VillageData {
  id: string;
  name: string;
  nameLocal: string | null;
  slug: string;
  population: number | null;
  households: number | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  taluk: {
    id: string;
    name: string;
    nameLocal: string;
    slug: string;
    district: { name: string; nameLocal: string; slug: string };
  };
}

function useVillage(id: string) {
  return useQuery<{ data: VillageData }>({
    queryKey: ["village", id],
    queryFn: () => fetch(`/api/data/village?id=${id}`).then((r) => r.json()),
    enabled: !!id,
    staleTime: 3600_000, // villages don't change often
  });
}

const QUICK_LINKS = [
  { label: "Gram Panchayat", icon: "🏘️", desc: "MGNREGA, water, funds" },
  { label: "Schemes", icon: "📋", desc: "Government schemes" },
  { label: "Schools", icon: "🎓", desc: "Schools in area" },
  { label: "JJM Water", icon: "🚰", desc: "Tap connection status" },
  { label: "Health", icon: "🏥", desc: "Nearest health centers" },
  { label: "Helplines", icon: "📞", desc: "Emergency numbers" },
];

export default function VillagePage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string; village: string }>;
}) {
  const { locale, state, district, taluk: talukSlug, village: villageId } = use(params);
  const { data, isLoading } = useVillage(villageId);

  const village = data?.data;
  const districtBase = `/${locale}/${state}/${district}`;
  const talukBase = `${districtBase}/${talukSlug}`;

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9B9B9B", marginBottom: 16, flexWrap: "wrap" }}>
        <Link href={districtBase} style={{ color: "#9B9B9B", textDecoration: "none" }}>{district}</Link>
        <ChevronRight size={12} />
        <Link href={talukBase} style={{ color: "#9B9B9B", textDecoration: "none" }}>{village?.taluk.name ?? talukSlug}</Link>
        <ChevronRight size={12} />
        <span style={{ color: "#1A1A1A" }}>{village?.name ?? "Village"}</span>
      </div>

      {isLoading && (
        <div style={{ background: "#F5F5F0", borderRadius: 12, height: 120, animation: "pulse 1.5s infinite" }} />
      )}

      {village && (
        <>
          {/* Header */}
          <div style={{ marginBottom: 24, borderBottom: "1px solid #E8E8E4", paddingBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 48, height: 48, background: "#F0FDF4", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin size={22} style={{ color: "#16A34A" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.4px" }}>{village.name}</h1>
                {village.nameLocal && <div style={{ fontSize: 14, color: "#9B9B9B", fontFamily: "var(--font-regional)", marginTop: 2 }}>{village.nameLocal}</div>}
                <div style={{ fontSize: 13, color: "#6B6B6B", marginTop: 4 }}>
                  {village.taluk.name} Taluk · {village.taluk.district.name} District
                  {village.pincode && <> · PIN: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{village.pincode}</span></>}
                </div>
              </div>
            </div>
          </div>

          {/* Key stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
            {village.population && (
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  <Users size={13} style={{ color: "#2563EB" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Population</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{village.population.toLocaleString("en-IN")}</div>
              </div>
            )}
            {village.households && (
              <div style={{ background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 5, alignItems: "center", marginBottom: 6 }}>
                  <Home size={13} style={{ color: "#16A34A" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9B9B9B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Households</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{village.households.toLocaleString("en-IN")}</div>
              </div>
            )}
          </div>

          {/* Map link if coordinates exist */}
          {village.latitude && village.longitude && (
            <a
              href={`https://maps.google.com/?q=${village.latitude},${village.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 8,
                fontSize: 13, color: "#2563EB", textDecoration: "none", marginBottom: 24,
              }}
            >
              <MapPin size={13} /> View on Maps <ExternalLink size={11} />
            </a>
          )}

          {/* Quick access to district data */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9B9B9B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            District Data
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: 24 }}>
            {QUICK_LINKS.map(({ label, icon, desc }) => {
              const slug = label.toLowerCase().replace(/ /g, "-").replace("jjm-water", "jjm");
              return (
                <Link key={label} href={`${districtBase}/${slug}`} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  background: "#FFF", border: "1px solid #E8E8E4", borderRadius: 10, textDecoration: "none",
                }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "#9B9B9B" }}>{desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* File RTI CTA */}
          <div style={{ background: "linear-gradient(135deg, #EFF6FF, #F0FDF4)", border: "1px solid #BFDBFE", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>Something missing from your village?</div>
              <div style={{ fontSize: 12, color: "#6B6B6B" }}>File an RTI to get official information</div>
            </div>
            <Link href={`${districtBase}/file-rti`} style={{
              display: "inline-block", padding: "8px 14px", background: "#2563EB", color: "#FFF",
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              File RTI →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
