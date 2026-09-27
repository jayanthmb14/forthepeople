/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  My Responsibility — module page (Design v4 "Rang", docs/DESIGN-SYSTEM.md)
// ═══════════════════════════════════════════════════════════════════════
//  Two data paths, unchanged from v2:
//    1. District-specific actions from /api/data/responsibility (researched
//       per district, each with "report to" contacts and a source note).
//    2. Otherwise the generic guide from getResponsibilityContent().
//  Presentation: PageHeader → intro → StatStrip of emoji tiles → the
//  pictures (an "In simple words" line with a pictogram of how many actions
//  come with someone to report to, then a ring of how the actions spread
//  across areas) → one emoji Section per group → SourcesFooter → Toolbar.
//  Section emoji come from the research data (`sectionIcon`) when present,
//  else from the group's title.
//
//  Language: every interface string comes from the "page_responsibility"
//  namespace. The actions themselves (research rows and the generic guide
//  in responsibility-content.ts) are district reference data and are shown
//  as written.
"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeftRight, Check, Download, ExternalLink, Flame, Megaphone, Phone, Share2, Sparkles } from "lucide-react";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  LoadingShell,
  SourcesFooter,
  Toolbar,
  ToolbarButton,
} from "@/components/district/ui";
import { ChartCard, Explainer, Pictogram } from "@/components/district/visuals";
import { HueDonut } from "@/components/district/civic/HueDonut";
import { useFormat, useModuleText } from "@/i18n/client";
import { getResponsibilityContent } from "@/lib/constants/responsibility-content";
import { getModuleSources } from "@/lib/constants/state-config";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import knDict from "@/dictionaries/kn.json";

type DistrictSpecificSection = {
  section: string;
  icon: string;
  order: number;
  items: Array<{
    action: string;
    whyRelevant: string;
    reportTo: {
      name: string | null;
      url: string | null;
      phone: string | null;
    };
    sourceNotes: string | null;
  }>;
};

type ResponsibilityApiResponse = {
  data: {
    districtName: string;
    districtSlug: string;
    sections: DistrictSpecificSection[];
    itemCount: number;
  } | null;
  fallback: "generic" | null;
};

/** Source names and update frequencies from getModuleSources() that have a translation. */
const SOURCE_KEY: Record<string, string> = { "District Administration": "districtAdministration" };
const FREQ_KEY: Record<string, string> = { Quarterly: "quarterly" };

/** Turn rows into a CSV file and start a download in the browser. */
function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Emoji for a group of actions, picked from its title. Used for the generic
 * guide (which carries no emoji) and when a researched section has none.
 * Order matters: "Flooding & Drainage" must match floods before water.
 */
const GROUP_EMOJI: Array<[RegExp, string]> = [
  [/can become|years/i, "🌟"],
  [/clean|waste/i, "🧹"],
  [/flood|drain|waterlog|disaster/i, "🌊"],
  [/water|river/i, "💧"],
  [/air|pollution/i, "🌫️"],
  [/traffic|road|transport|commute/i, "🚦"],
  [/wildlife/i, "🐘"],
  [/lake|coast/i, "🏞️"],
  [/environment|green/i, "🌳"],
  [/agri|farm|land/i, "🌾"],
  [/heritage|culture|tourism/i, "🏛️"],
  [/housing|infrastructure/i, "🏗️"],
  [/health|education/i, "🏥"],
  [/tech/i, "💻"],
  [/civic|democra|engagement/i, "🗳️"],
];
function groupEmoji(title: string, fromData?: string | null): string {
  const given = fromData?.trim();
  if (given) return given;
  return GROUP_EMOJI.find(([re]) => re.test(title))?.[1] ?? "🌱";
}

/** "Visit portal" and phone links: a hue pill, 32 px tall (44 px on phones via ftp-chip). */
const CONTACT_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "0 12px",
  borderRadius: "var(--ftp-radius-pill)",
  background: "var(--hue-tint)",
  border: "1px solid color-mix(in srgb, var(--hue) 22%, transparent)",
  color: "var(--hue-deep)",
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 500,
  textDecoration: "none",
};

/** Small icon chip in the page hue that starts each action line. */
function ItemChip({ icon: Icon }: { icon: typeof Check }) {
  return (
    <span aria-hidden className="ftp-icon-chip" style={{ width: 24, height: 24, borderRadius: 8, marginTop: 1 }}>
      <Icon size={14} strokeWidth={2.5} />
    </span>
  );
}

/** Areas → donut slices + the one-line reading of the ring. */
interface AreaCount {
  key: string;
  label: string;
  emoji: string;
  value: number;
}

/**
 * The second picture: how the actions spread across areas, as a ring in
 * shades of the page hue with a legend of real counts. Hidden when there
 * are fewer than two areas (a ring of one slice says nothing).
 */
function AreasRing({ areas }: { areas: AreaCount[] }) {
  const t = useTranslations("page_responsibility");
  const f = useFormat();
  if (areas.length < 2) return null;
  const total = areas.reduce((n, a) => n + a.value, 0);
  if (total === 0) return null;
  const sorted = [...areas].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const tied = sorted.filter((a) => a.value === top.value).length;
  const b = (c: React.ReactNode) => <strong>{c}</strong>;
  const simple =
    tied === sorted.length
      ? t("chartEven", { n: f.number(top.value) })
      : tied > 1
        ? t("chartTied", { count: f.number(tied), n: f.number(top.value) })
        : t.rich("chartTop", { top: top.label, n: f.number(top.value), total: f.number(total), b });
  const summary = sorted.map((a) => `${a.label}: ${f.number(a.value)}`).join(", ");
  return (
    <div style={{ marginTop: 16 }}>
      <ChartCard
        title={t("chartTitle")}
        emoji="🧩"
        units={t("chartUnits")}
        simple={simple}
        table={sorted.map((a) => ({ label: a.label, value: f.number(a.value) }))}
      >
        <HueDonut
          slices={areas.map((a) => ({ key: a.key, label: a.label, value: a.value, emoji: a.emoji }))}
          centerValue={f.number(total)}
          centerLabel={t("chartCenter", { n: total })}
          ariaLabel={t("chartAria", { summary })}
          otherLabel={t("otherAreas")}
        />
      </ChartCard>
    </div>
  );
}

export default function ResponsibilityPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const t = useTranslations("page_responsibility");
  const mt = useModuleText();
  const f = useFormat();
  const base = `/${locale}/${state}/${district}`;
  const [shareNote, setShareNote] = useState<string | null>(null);

  const { data: apiData, isLoading } = useQuery<ResponsibilityApiResponse>({
    queryKey: ["responsibility", state, district],
    queryFn: () =>
      fetch(`/api/data/responsibility?state=${state}&district=${district}`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Loading state — render nothing obvious (brief), then fallback or district-specific.
  const districtSpecific = apiData?.data && apiData.data.sections.length > 0 ? apiData.data : null;
  const genericContent = getResponsibilityContent(district);
  const src = getModuleSources("responsibility", state);
  // Local-script title comes from the dictionary (Kannada only for now).
  const titleLocal = state === "karnataka" ? knDict.modules.responsibility : undefined;
  const moduleTitle = mt.label("responsibility");
  const b = (c: React.ReactNode) => <strong className="ftp-num">{c}</strong>;

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: moduleTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(t("linkCopied"));
        setTimeout(() => setShareNote(null), 2000);
      }
    } catch {
      /* The visitor closed the share sheet — nothing to do. */
    }
  };

  // CSV = whatever list is on screen (district-specific actions or the generic guide).
  const onCsv = () =>
    districtSpecific
      ? downloadCsv(
          `${district}-responsibility.csv`,
          districtSpecific.sections.flatMap((s) =>
            s.items.map((item) => ({
              section: s.section,
              action: item.action,
              why_relevant: item.whyRelevant,
              report_to: item.reportTo?.name ?? "",
              report_url: item.reportTo?.url ?? "",
              report_phone: item.reportTo?.phone ?? "",
              source: item.sourceNotes ?? "",
            }))
          )
        )
      : downloadCsv(
          `${district}-responsibility.csv`,
          genericContent.sections.flatMap((s) => s.items.map((item) => ({ section: s.title, action: item })))
        );

  const genericItemCount = genericContent.sections.reduce((n, s) => n + s.items.length, 0);

  // For the pictures: the generic guide's "can become" section is a vision,
  // not a list of actions, so it is left out of the "things you can do" count.
  const genericActionSections = genericContent.sections.filter((s) => !s.isProjection);
  const genericActionCount = genericActionSections.reduce((n, s) => n + s.items.length, 0);

  // For the pictures: how many researched actions name someone to report to.
  const specificItems = districtSpecific ? districtSpecific.sections.flatMap((s) => s.items) : [];
  const withContact = specificItems.filter((item) => item.reportTo?.name).length;
  const contactShare = specificItems.length > 0 ? withContact / specificItems.length : 0;

  const specificAreas: AreaCount[] = districtSpecific
    ? districtSpecific.sections.map((s) => ({ key: s.section, label: s.section, emoji: groupEmoji(s.section, s.icon), value: s.items.length }))
    : [];
  const genericAreas: AreaCount[] = genericActionSections.map((s) => ({
    key: s.title,
    label: s.title,
    emoji: groupEmoji(s.title),
    value: s.items.length,
  }));

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Flame}
        accent={getModuleAccent("responsibility")}
        title={moduleTitle}
        titleLocal={titleLocal}
        description={
          districtSpecific
            ? t("descSpecific", { name: districtSpecific.districtName })
            : t("descGeneric", { name: genericContent.districtName })
        }
        backHref={base}
      />

      {/* Intro — shared for both branches. Plain body text. */}
      <p className="ftp-body" style={{ fontSize: 15, lineHeight: "22px", marginBottom: 20 }}>
        {t.rich("intro", { b: (c) => <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>{c}</span> })}
      </p>

      {/* Emergency disclaimer — only show on district-specific pages (where live phones exist) */}
      {districtSpecific && (
        <div style={{ marginBottom: 20 }}>
          <Card padding={14}>
            <p className="ftp-body" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--ftp-text)" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
              <span>
                {t.rich("emergency", {
                  emergency: (c) => <a href="tel:112" className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{c}</a>,
                  ambulance: (c) => <a href="tel:108" className="ftp-num" style={{ color: "var(--hue-deep)", fontWeight: 600 }}>{c}</a>,
                })}
              </span>
            </p>
          </Card>
        </div>
      )}

      {isLoading && <LoadingShell rows={4} />}

      {/* District-specific render */}
      {!isLoading && districtSpecific && (
        <>
          <StatStrip cols={3}>
            <StatTile emoji="✅" label={t("tileActions")} value={f.number(districtSpecific.itemCount)} sub={t("tileActionsSub", { name: districtSpecific.districtName })} />
            <StatTile emoji="🗂️" label={t("tileAreas")} value={f.number(districtSpecific.sections.length)} sub={t("tileAreasSub")} />
            <StatTile emoji="📣" label={t("tileContacts")} value={f.number(withContact)} sub={t("tileContactsSub")} />
          </StatStrip>

          {/* Picture 1: one plain sentence with the real counts, and ten
              megaphones lit for the share of actions that name someone to
              report to. Same numbers as the tiles above. */}
          {specificItems.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer emoji="🙋">
                  {t.rich("simpleSpecific", {
                    n: districtSpecific.itemCount,
                    areas: districtSpecific.sections.length,
                    name: districtSpecific.districtName,
                    b,
                  })}
                  {withContact > 0 && <> {t.rich("simpleContact", { n: withContact, b })}</>}
                </Explainer>
                {withContact > 0 && (
                  <Pictogram
                    filled={contactShare * 10}
                    emoji="📣"
                    label={t("pictogramContact", { n: Math.round(contactShare * 10) })}
                  />
                )}
              </Card>
            </div>
          )}

          {/* Picture 2: the same actions, spread across their areas. */}
          <AreasRing areas={specificAreas} />

          {districtSpecific.sections.map((section) => {
            const emoji = groupEmoji(section.section, section.icon);
            return (
              <div key={section.section} style={{ marginTop: 8 }}>
                <Section title={section.section} emoji={emoji}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {section.items.map((item, idx) => (
                      <Card key={idx} as="article" padding={16}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <ItemChip icon={Check} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 className="ftp-title">{item.action}</h3>
                            <p className="ftp-body" style={{ margin: "6px 0 0", color: "var(--ftp-text-2)" }}>
                              {item.whyRelevant}
                            </p>
                          </div>
                        </div>

                        {item.reportTo?.name && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: "10px 12px",
                              borderRadius: "var(--ftp-radius-tile)",
                              background: "color-mix(in srgb, var(--hue-tint) 60%, #fff)",
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 8,
                              columnGap: 12,
                              fontSize: 13,
                              lineHeight: "20px",
                            }}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, color: "var(--hue-deep)" }}>
                              <Megaphone size={14} aria-hidden />
                              {t("reportTo")}
                            </span>
                            <span style={{ color: "var(--ftp-text)" }}>{item.reportTo.name}</span>
                            {item.reportTo.url && (
                              <a
                                href={item.reportTo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ftp-chip"
                                style={CONTACT_LINK}
                                aria-label={t("portalAria", { name: item.reportTo.name })}
                              >
                                {t("visitPortal")} <ExternalLink size={12} aria-hidden />
                              </a>
                            )}
                            {item.reportTo.phone && (
                              <a
                                href={`tel:${item.reportTo.phone}`}
                                className="ftp-chip"
                                style={CONTACT_LINK}
                                aria-label={t("callAria", { phone: item.reportTo.phone })}
                              >
                                <Phone size={14} aria-hidden />
                                <span className="ftp-num">{item.reportTo.phone}</span>
                              </a>
                            )}
                          </div>
                        )}

                        {item.sourceNotes && (
                          <details style={{ marginTop: 8, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                            <summary style={{ cursor: "pointer" }}>{t("source")}</summary>
                            <p style={{ margin: "4px 0 0", lineHeight: "16px" }}>{item.sourceNotes}</p>
                          </details>
                        )}
                      </Card>
                    ))}
                  </div>
                </Section>
              </div>
            );
          })}

          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 20 }}>
            {t("footSpecific")}
          </p>
        </>
      )}

      {/* Generic fallback render (other districts) */}
      {!isLoading && !districtSpecific && (
        <>
          <StatStrip cols={2}>
            <StatTile emoji="💡" label={t("tileSuggestions")} value={f.number(genericItemCount)} sub={t("tileSuggestionsSub")} />
            <StatTile emoji="🗂️" label={t("tileAreas")} value={f.number(genericContent.sections.length)} sub={t("tileAreasSub")} />
          </StatStrip>

          {/* Picture 1 for the generic guide is the plain sentence only:
              there is no per-action contact data to draw a pictogram from. */}
          {genericActionCount > 0 && (
            <div style={{ marginTop: 16 }}>
              <Explainer emoji="🙋">
                {t.rich("simpleGeneric", {
                  n: genericActionCount,
                  areas: genericActionSections.length,
                  name: genericContent.districtName,
                  b,
                })}
              </Explainer>
            </div>
          )}

          {/* Picture 2: the suggestions spread across their areas. */}
          <AreasRing areas={genericAreas} />

          {genericContent.sections.map((section) => (
            <div key={section.title} style={{ marginTop: 8 }}>
              <Section title={section.title} emoji={groupEmoji(section.title)}>
                <Card tinted={section.isProjection}>
                  {section.isProjection ? (
                    <p className="ftp-body" style={{ marginBottom: 10, color: "var(--ftp-text-2)" }}>
                      {t("projectionLead", { name: genericContent.districtName })}
                    </p>
                  ) : null}
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {section.items.map((item, i) => (
                      <li key={i} className="ftp-body" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        {/* A check (or a spark for the vision list) in the page hue. */}
                        <ItemChip icon={section.isProjection ? Sparkles : Check} />
                        <span style={{ paddingTop: 2 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Section>
            </div>
          ))}

          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 20 }}>
            {t("footGeneric", { name: genericContent.districtName })}
          </p>
        </>
      )}

      <SourcesFooter
        sources={src.sources.map((name) => ({
          name: SOURCE_KEY[name] ? t(`sourceNames.${SOURCE_KEY[name]}`) : name,
          frequency: FREQ_KEY[src.frequency] ? t(`freq.${FREQ_KEY[src.frequency]}`) : src.frequency,
        }))}
      />

      <Toolbar label={t("toolbar")}>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={isLoading}>
          {t("downloadCsv")}
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? t("share")}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=responsibility&a=${district}`}>
          {t("compare")}
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
