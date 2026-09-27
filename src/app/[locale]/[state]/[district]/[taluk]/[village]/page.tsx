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
//  StatStrip of emoji tiles (population, households) → the pictures:
//     • people per home, only when both numbers exist;
//     • this village's share of its taluk's people (a ring) and how it
//       compares with the taluk's average and biggest village (bars), from
//       the taluk's village rows — only when the village and at least one
//       other village have a population on record;
//  → "View on maps" link → quick links into the district's modules
//  (registry emoji, module hues, translated module names) → a "File an RTI"
//  card in the RTI colour. Text: "page_village" messages.
//
"use client";
import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MapPin, ChevronRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getDistrictHue, getModuleMeta, hueClass } from "@/lib/design/hues";
import { getStateConfig } from "@/lib/constants/state-config";
import { useTaluks } from "@/hooks/useRealtimeData";
import { useFormat, useModuleText } from "@/i18n/client";
import { StatStrip, StatTile, Section, Card, Pill, LoadingShell } from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList, RingStat } from "@/components/site/SiteVisuals";

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

// Quick links into district modules: the route slug, and an emoji for a
// link that is not a module in the registry. Names come from the module
// messages; the one-line descriptions from "page_village".
const QUICK_LINKS: { slug: string; fallbackEmoji: string }[] = [
  { slug: "gram-panchayat", fallbackEmoji: "🏘️" },
  { slug: "schemes", fallbackEmoji: "📋" },
  { slug: "schools", fallbackEmoji: "🎓" },
  { slug: "jjm", fallbackEmoji: "💧" },
  { slug: "health", fallbackEmoji: "🏥" },
  // Helplines live on the Citizen Corner page (there is no /helplines route).
  { slug: "citizen-corner", fallbackEmoji: "☎️" },
];

export default function VillagePage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string; taluk: string; village: string }>;
}) {
  const { locale, state, district, taluk: talukSlug, village: villageId } = use(params);
  const t = useTranslations("page_village");
  const tOne = useTranslations("subUnitOne");
  const { number } = useFormat();
  const mt = useModuleText();
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const { data, isLoading } = useVillage(villageId);
  const { data: taluksData } = useTaluks(district, state);

  const village = data?.data;
  const districtBase = `/${locale}/${state}/${district}`;
  const talukBase = `${districtBase}/${talukSlug}`;
  const subUnitEn = getStateConfig(state)?.subDistrictUnit ?? "Taluk";
  const subUnit = tOne.has(subUnitEn) ? tOne(subUnitEn) : subUnitEn;

  // People per home — only when both counts are on record.
  const perHome =
    village?.population && village.households ? village.population / village.households : null;

  // This village inside its taluk: share of the taluk's people and rank,
  // from the same village rows the taluk page lists.
  const talukRow = (taluksData?.data ?? []).find((tk) => tk.slug === talukSlug);
  const peers = (talukRow?.villages ?? [])
    .filter((v): v is typeof v & { population: number } => typeof v.population === "number" && v.population > 0)
    .sort((a, b2) => b2.population - a.population);
  const peersTotal = peers.reduce((s, v) => s + v.population, 0);
  const talukPeople = talukRow?.population && talukRow.population >= peersTotal ? talukRow.population : peersTotal;
  const rankIndex = peers.findIndex((v) => v.id === villageId);
  const myPop = village?.population ?? null;
  const showShare = Boolean(myPop && myPop > 0 && rankIndex >= 0 && peers.length >= 2 && talukPeople > myPop);
  const sharePct = showShare && myPop ? (myPop / talukPeople) * 100 : 0;
  const sharePctText = number(sharePct, { maximumFractionDigits: sharePct < 10 ? 1 : 0 });
  const average = peers.length > 0 ? Math.round(peersTotal / peers.length) : 0;
  const biggestPeer = peers[0];

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
      <nav aria-label={t("breadcrumb")} style={{ marginBottom: 8 }}>
        <ol style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, lineHeight: "20px", color: "var(--ftp-text-2)", flexWrap: "wrap", listStyle: "none", margin: 0, padding: 0 }}>
          <li><Link href={districtBase} style={crumbLink}>{village?.taluk.district.name ?? district}</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li><Link href={talukBase} style={crumbLink}>{village?.taluk.name ?? talukSlug}</Link></li>
          <li aria-hidden><ChevronRight size={14} /></li>
          <li aria-current="page" style={{ color: "var(--ftp-text)" }}>{village?.name ?? t("village")}</li>
        </ol>
      </nav>

      {isLoading && (
        <>
          <h1 className="sr-only">{t("village")}</h1>
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
            description={t("desc", { taluk: village.taluk.name, unit: subUnit, district: village.taluk.district.name })}
          >
            {village.pincode ? (
              <Pill>
                <span className="ftp-num">{t("pin", { pin: village.pincode })}</span>
              </Pill>
            ) : null}
          </SiteHeader>

          {/* Key stats (only the ones we have — never a fake zero) */}
          {Boolean(village.population || village.households) && (
            <StatStrip cols={2}>
              {Boolean(village.population) && (
                <StatTile emoji="👥" label={t("tilePopulation")} value={number(village.population!)} />
              )}
              {Boolean(village.households) && (
                <StatTile emoji="🏠" label={t("tileHouseholds")} value={number(village.households!)} />
              )}
            </StatStrip>
          )}

          {/* The pictures: people per home, and this village inside its taluk */}
          {(perHome !== null || showShare) && (
            <div className={perHome !== null && showShare ? "ftp-picture-row" : undefined} style={{ marginTop: 16 }}>
              {perHome !== null && (
                <Card tinted padding={18}>
                  <Explainer emoji="🏠">
                    {t.rich("simpleHomes", {
                      pop: number(village.population!),
                      homes: number(village.households!),
                      name: village.name,
                      per: number(perHome, { maximumFractionDigits: 1 }),
                      b,
                    })}
                  </Explainer>
                  <Pictogram
                    filled={perHome}
                    total={Math.min(12, Math.max(5, Math.ceil(perHome)))}
                    emoji="🧑"
                    label={t("pictoLabel", { n: Math.round(perHome) })}
                  />
                </Card>
              )}
              {showShare && myPop && biggestPeer && (
                <ChartCard
                  title={t("shareTitle", { name: village.name, taluk: village.taluk.name, unit: subUnit })}
                  emoji="🥧"
                  units={t("shareUnits")}
                  simple={t.rich("shareSimple", {
                    pct: sharePctText,
                    taluk: village.taluk.name,
                    unit: subUnit,
                    name: village.name,
                    rank: rankIndex + 1,
                    total: peers.length,
                    b,
                  })}
                  table={[
                    { label: village.name, value: number(myPop) },
                    { label: t("rowTaluk", { taluk: village.taluk.name, unit: subUnit }), value: number(talukPeople) },
                    { label: t("rowAverage", { taluk: village.taluk.name }), value: number(average) },
                    { label: t("rowRank"), value: t("rankValue", { rank: rankIndex + 1, total: peers.length }) },
                  ]}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <RingStat
                      pct={sharePct}
                      value={`${sharePctText}%`}
                      caption={t("shareCaption", { taluk: village.taluk.name })}
                      label={t("shareAria", { name: village.name, pct: sharePctText, taluk: village.taluk.name, unit: subUnit })}
                    />
                    <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <BarList
                        rows={[
                          { key: "this", label: <strong>{village.name}</strong>, value: myPop, display: number(myPop), emoji: "📍", color: "var(--hue)" },
                          { key: "avg", label: t("rowAverage", { taluk: village.taluk.name }), value: average, display: number(average), emoji: "⚖️", color: "var(--hue-pop)" },
                          ...(biggestPeer.id !== villageId
                            ? [{ key: "top", label: t("rowBiggest", { name: biggestPeer.name }), value: biggestPeer.population, display: number(biggestPeer.population), emoji: "🏆", color: "var(--hue-deep)" }]
                            : []),
                        ]}
                      />
                    </div>
                  </div>
                </ChartCard>
              )}
            </div>
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
              <span className="ftp-emoji" aria-hidden>📍</span> {t("viewOnMaps")} <ExternalLink size={12} aria-hidden />
            </a>
          )}

          {/* Quick access to district data — each card in its module colour */}
          <Section title={t("sectionDistrict")} emoji="🔎">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(180px, 100%), 1fr))", gap: 10 }}>
              {QUICK_LINKS.map(({ slug, fallbackEmoji }) => {
                const meta = getModuleMeta(slug);
                return (
                  <div key={slug} className={hueClass(meta ? slug : "slate")}>
                    <Card tinted href={`${districtBase}/${slug}`} padding={0}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", minHeight: 56 }}>
                        <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>
                          {meta?.emoji ?? fallbackEmoji}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 600, color: "var(--ftp-text)" }}>{mt.label(slug)}</div>
                          <div style={{ fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{t(`desc_${slug}`)}</div>
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
                    <p className="ftp-title" style={{ fontSize: 15, lineHeight: 1.45, fontWeight: 600 }}>{t("rtiTitle")}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--ftp-text-2)", margin: 0 }}>{t("rtiBody")}</p>
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
                  {t("rtiButton")}
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
