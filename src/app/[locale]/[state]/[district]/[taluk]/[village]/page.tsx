/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Village page — Design v4 "Rang"
// ═══════════════════════════════════════════════════════════════════════
//
//  Breadcrumb (district › taluk › village) → SiteHeader band in the
//  district's hue (village name + local-script name, PIN as a pill) →
//  StatStrip of emoji tiles (population, households) → the picture
//  (people per home, only when both numbers exist) → "View on maps" link →
//  quick links into the district's modules (registry emoji, module hues) →
//  a "File an RTI" card in the RTI colour.
//
"use client";
import { use } from "react";
import Link from "next/link";
import { MapPin, ChevronRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDistrictHue, getModuleMeta, hueClass } from "@/lib/design/hues";
import { StatStrip, StatTile, Section, Card, Pill, LoadingShell } from "@/components/district/ui";
import { Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";

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
// label below (unchanged behaviour); the emoji and colour come from the
// module registry, with a fallback for links that are not a module.
const QUICK_LINKS: { label: string; desc: string; fallbackEmoji: string }[] = [
  { label: "Gram Panchayat", desc: "MGNREGA, water, funds", fallbackEmoji: "🏘️" },
  { label: "Schemes", desc: "Government schemes", fallbackEmoji: "📋" },
  { label: "Schools", desc: "Schools in area", fallbackEmoji: "🎓" },
  { label: "JJM Water", desc: "Tap connection status", fallbackEmoji: "💧" },
  { label: "Health", desc: "Nearest health centers", fallbackEmoji: "🏥" },
  { label: "Helplines", desc: "Emergency numbers", fallbackEmoji: "☎️" },
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

  // People per home — only when both counts are on record.
  const perHome =
    village?.population && village.households ? village.population / village.households : null;

  const crumbLink: React.CSSProperties = {
    color: "var(--ftp-text-2)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    minHeight: 32,
  };

  return (
    <div
      className={`ftp-container ftp-hue-${getDistrictHue(district)}`}
      style={{ maxWidth: "var(--ftp-reading-max)", margin: 0, paddingTop: 24, paddingBottom: 48 }}
    >
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
          <SiteHeader
            emoji="🏡"
            icon={MapPin}
            title={village.name}
            titleLocal={village.nameLocal ?? undefined}
            description={`In ${village.taluk.name} taluk, ${village.taluk.district.name} district.`}
          >
            {village.pincode ? (
              <Pill>
                PIN <span className="ftp-num">{village.pincode}</span>
              </Pill>
            ) : null}
          </SiteHeader>

          {/* Key stats (only the ones we have — never a fake zero) */}
          {Boolean(village.population || village.households) && (
            <StatStrip cols={2}>
              {Boolean(village.population) && (
                <StatTile emoji="👥" label="Population" value={village.population!.toLocaleString("en-IN")} />
              )}
              {Boolean(village.households) && (
                <StatTile emoji="🏠" label="Households" value={village.households!.toLocaleString("en-IN")} />
              )}
            </StatStrip>
          )}

          {/* The picture: how many people share a home, from the two tiles above */}
          {perHome !== null && (
            <Card tinted padding={18} style={{ marginTop: 16 }}>
              <Explainer title="In simple words" emoji="🏠">
                <strong>{village.population!.toLocaleString("en-IN")}</strong> people live in{" "}
                <strong>{village.households!.toLocaleString("en-IN")}</strong> homes in {village.name}. That is about{" "}
                <strong>{perHome.toLocaleString("en-IN", { maximumFractionDigits: 1 })}</strong> people in each home.
              </Explainer>
              <Pictogram
                filled={perHome}
                total={Math.min(12, Math.max(5, Math.ceil(perHome)))}
                emoji="🧑"
                label={`About ${Math.round(perHome)} people live in each home.`}
              />
            </Card>
          )}

          {/* Map link if coordinates exist */}
          {village.latitude && village.longitude && (
            <a
              href={`https://maps.google.com/?q=${village.latitude},${village.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ftp-btn-secondary"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 14px",
                marginTop: 16,
                background: "var(--ftp-surface)", border: "1px solid color-mix(in srgb, var(--hue) 30%, var(--ftp-border))",
                borderRadius: "var(--ftp-radius-tile)",
                fontSize: 13, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none",
              }}
            >
              <span className="ftp-emoji" aria-hidden>📍</span> View on maps <ExternalLink size={12} aria-hidden />
            </a>
          )}

          {/* Quick access to district data — each card in its module colour */}
          <Section title="District data" emoji="🔎">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: 10 }}>
              {QUICK_LINKS.map(({ label, desc, fallbackEmoji }) => {
                const slug = label.toLowerCase().replace(/ /g, "-").replace("jjm-water", "jjm");
                const meta = getModuleMeta(slug);
                return (
                  <div key={label} className={hueClass(meta ? slug : "slate")}>
                    <Card tinted href={`${districtBase}/${slug}`} padding={0}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", minHeight: 56 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                          {meta?.emoji ?? fallbackEmoji}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, color: "var(--ftp-text)" }}>{label}</div>
                          <div style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>{desc}</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* File RTI prompt — in the RTI module's colour, one primary button */}
          <div className={hueClass("file-rti")} style={{ marginTop: 24 }}>
            <Card tinted>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 40, height: 40, fontSize: 20, borderRadius: 12 }}>
                    📜
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p className="ftp-title" style={{ fontSize: 15, lineHeight: "22px", fontWeight: 600 }}>Something missing from your village?</p>
                    <p style={{ fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", margin: 0 }}>File an RTI to get official information</p>
                  </div>
                </div>
                <Link
                  href={`${districtBase}/file-rti`}
                  className="ftp-btn ftp-btn-primary"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 16px",
                    border: "1px solid var(--hue)", color: "#fff",
                    borderRadius: "var(--ftp-radius-tile)", fontSize: 14, fontWeight: 600, textDecoration: "none",
                  }}
                >
                  File an RTI
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
