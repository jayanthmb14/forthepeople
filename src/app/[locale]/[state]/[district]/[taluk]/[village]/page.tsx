/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Village page — Design v3 "Civic Ledger"
// ═══════════════════════════════════════════════════════════════════════
//
//  Breadcrumb (district › taluk › village) → PageHeader (village name +
//  local-script name, PIN as a pill) → StatStrip (population, households)
//  → "View on Maps" link → quick links into the district's modules →
//  a quiet "File an RTI" card (no gradient).
//
"use client";
import { use } from "react";
import Link from "next/link";
import {
  MapPin, Users, Home, ChevronRight, ExternalLink,
  Building, ScrollText, GraduationCap, Droplets, HeartPulse, Phone, FilePen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, StatStrip, StatTile, Section, Card, Pill, LoadingShell } from "@/components/district/ui";

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

// Quick links into district modules. The route slug is derived from the
// label below (unchanged behaviour); the icon is a Lucide icon.
const QUICK_LINKS: { label: string; icon: LucideIcon; desc: string }[] = [
  { label: "Gram Panchayat", icon: Building, desc: "MGNREGA, water, funds" },
  { label: "Schemes", icon: ScrollText, desc: "Government schemes" },
  { label: "Schools", icon: GraduationCap, desc: "Schools in area" },
  { label: "JJM Water", icon: Droplets, desc: "Tap connection status" },
  { label: "Health", icon: HeartPulse, desc: "Nearest health centers" },
  { label: "Helplines", icon: Phone, desc: "Emergency numbers" },
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

  const crumbLink: React.CSSProperties = {
    color: "var(--ftp-text-2)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    minHeight: 32,
  };

  return (
    <div className="ftp-container" style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: 8 }}>
        <ol style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
          <li><Link href={districtBase} style={crumbLink}>{district}</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li><Link href={talukBase} style={crumbLink}>{village?.taluk.name ?? talukSlug}</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li aria-current="page" style={{ color: "var(--ftp-text)" }}>{village?.name ?? "Village"}</li>
        </ol>
      </nav>

      {isLoading && (
        <>
          <h1 className="sr-only">Village</h1>
          <LoadingShell rows={3} />
        </>
      )}

      {village && (
        <>
          <PageHeader
            icon={MapPin}
            title={village.name}
            titleLocal={village.nameLocal ?? undefined}
            description={`${village.taluk.name} Taluk · ${village.taluk.district.name} District`}
            accent="blue"
            actions={
              village.pincode ? (
                <Pill>
                  PIN <span className="ftp-num">{village.pincode}</span>
                </Pill>
              ) : undefined
            }
          />

          {/* Key stats (only the ones we have — never a fake zero) */}
          {Boolean(village.population || village.households) && (
            <StatStrip cols={2}>
              {Boolean(village.population) && (
                <StatTile icon={Users} label="Population" value={village.population!.toLocaleString("en-IN")} />
              )}
              {Boolean(village.households) && (
                <StatTile icon={Home} label="Households" value={village.households!.toLocaleString("en-IN")} />
              )}
            </StatStrip>
          )}

          {/* Map link if coordinates exist */}
          {village.latitude && village.longitude && (
            <a
              href={`https://maps.google.com/?q=${village.latitude},${village.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ftp-btn-secondary"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 14px",
                marginTop: 16,
                background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)",
                borderRadius: "var(--ftp-radius-tile)",
                fontSize: 13, fontWeight: 500, color: "var(--ftp-text)", textDecoration: "none",
              }}
            >
              <MapPin size={14} aria-hidden /> View on Maps <ExternalLink size={12} aria-hidden />
            </a>
          )}

          {/* Quick access to district data */}
          <Section title="District data">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: 8 }}>
              {QUICK_LINKS.map(({ label, icon: Icon, desc }) => {
                const slug = label.toLowerCase().replace(/ /g, "-").replace("jjm-water", "jjm");
                return (
                  <Card key={label} href={`${districtBase}/${slug}`} padding={0}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", minHeight: 56 }}>
                      <Icon size={18} aria-hidden style={{ color: "var(--ftp-text-2)", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, lineHeight: "20px", fontWeight: 500, color: "var(--ftp-text)" }}>{label}</div>
                        <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{desc}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Section>

          {/* File RTI prompt — a plain Card with one primary button */}
          <div style={{ marginTop: 24 }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <p className="ftp-title" style={{ fontSize: 14, lineHeight: "20px" }}>Something missing from your village?</p>
                  <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0 }}>File an RTI to get official information</p>
                </div>
                <Link
                  href={`${districtBase}/file-rti`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 16px",
                    background: "var(--ftp-brand)", color: "var(--ftp-surface)",
                    borderRadius: "var(--ftp-radius-tile)", fontSize: 13, fontWeight: 500, textDecoration: "none",
                  }}
                >
                  <FilePen size={14} aria-hidden /> File RTI →
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
