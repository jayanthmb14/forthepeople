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
//  picture (an "In simple words" line, plus a pictogram of how many actions
//  come with someone to report to) → one emoji Section per group →
//  SourcesFooter → Toolbar. Section emoji come from the research data
//  (`sectionIcon`) when present, else from the group's title.
"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeftRight, Download, ExternalLink, Flame, Phone, Share2 } from "lucide-react";
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
import { Explainer, Pictogram } from "@/components/district/visuals";
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

export default function ResponsibilityPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
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

  const onShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Responsibility", url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied");
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

  // For the picture: the generic guide's "can become" section is a vision,
  // not a list of actions, so it is left out of the "things you can do" count.
  const genericActionSections = genericContent.sections.filter((s) => !s.isProjection);
  const genericActionCount = genericActionSections.reduce((n, s) => n + s.items.length, 0);

  // For the picture: how many researched actions name someone to report to.
  const specificItems = districtSpecific ? districtSpecific.sections.flatMap((s) => s.items) : [];
  const withContact = specificItems.filter((item) => item.reportTo?.name).length;
  const contactShare = specificItems.length > 0 ? withContact / specificItems.length : 0;

  return (
    <div className="module-page" style={{ padding: 24, maxWidth: "var(--ftp-reading-max)" }}>
      <PageHeader
        icon={Flame}
        accent={getModuleAccent("responsibility")}
        title="My Responsibility"
        titleLocal={titleLocal}
        description={
          districtSpecific
            ? `Civic actions specific to ${districtSpecific.districtName}`
            : genericContent.intro
        }
        backHref={base}
      />

      {/* Intro — shared for both branches. Plain body text. */}
      <p className="ftp-body" style={{ fontSize: 15, lineHeight: "22px", marginBottom: 20 }}>
        <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>This is YOUR district.</span> Government alone cannot fix everything.
        As citizens, we have real power — and real responsibility. Small actions by many
        people create big change. Here&apos;s what you can do today.
      </p>

      {/* Emergency disclaimer — only show on district-specific pages (where live phones exist) */}
      {districtSpecific && (
        <div style={{ marginBottom: 20 }}>
          <Card padding={14}>
            <p className="ftp-body" style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--ftp-text)" }}>
              <AlertTriangle size={16} aria-hidden style={{ color: "var(--ftp-warn)", flexShrink: 0, marginTop: 2 }} />
              <span>
                Helplines and portal URLs are sourced from official government pages. Please verify
                before calling for emergencies — in a life-threatening situation, always dial{" "}
                <a href="tel:112" className="ftp-num" style={{ color: "var(--hue-deep)" }}>112</a> (India unified
                emergency) or <a href="tel:108" className="ftp-num" style={{ color: "var(--hue-deep)" }}>108</a>{" "}
                (ambulance).
              </span>
            </p>
          </Card>
        </div>
      )}

      {isLoading && <LoadingShell rows={4} />}

      {/* District-specific render */}
      {!isLoading && districtSpecific && (
        <>
          <StatStrip cols={2}>
            <StatTile emoji="✅" label="Actions" value={districtSpecific.itemCount} sub={`Specific to ${districtSpecific.districtName}`} />
            <StatTile emoji="🗂️" label="Areas" value={districtSpecific.sections.length} sub="Groups of actions" />
          </StatStrip>

          {/* The picture: one plain sentence with the real counts, and ten
              megaphones lit for the share of actions that name someone to
              report to. Same numbers as the tiles above. */}
          {specificItems.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Card tinted padding={18}>
                <Explainer title="In simple words" emoji="🙋">
                  There are <strong className="ftp-num">{districtSpecific.itemCount}</strong> things you can do for{" "}
                  {districtSpecific.districtName}, in <strong className="ftp-num">{districtSpecific.sections.length}</strong> areas.
                  {withContact > 0 && (
                    <>
                      {" "}For <strong className="ftp-num">{withContact}</strong> of them, we also tell you who to report to.
                    </>
                  )}
                </Explainer>
                {withContact > 0 && (
                  <Pictogram
                    filled={contactShare * 10}
                    emoji="📣"
                    label={`About ${Math.round(contactShare * 10)} of every 10 actions come with someone you can report to.`}
                  />
                )}
              </Card>
            </div>
          )}

          {districtSpecific.sections.map((section) => (
            <div key={section.section} style={{ marginTop: 8 }}>
              <Section title={section.section} emoji={groupEmoji(section.section, section.icon)}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {section.items.map((item, idx) => (
                    <Card key={idx} as="article" padding={16}>
                      <h3 className="ftp-title">{item.action}</h3>
                      <p className="ftp-body" style={{ margin: "6px 0 0", color: "var(--ftp-text-2)" }}>
                        {item.whyRelevant}
                      </p>

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
                          <span style={{ fontWeight: 600, color: "var(--hue-deep)" }}>Report to:</span>
                          <span style={{ color: "var(--ftp-text)" }}>{item.reportTo.name}</span>
                          {item.reportTo.url && (
                            <a href={item.reportTo.url} target="_blank" rel="noopener noreferrer" className="ftp-chip" style={CONTACT_LINK}>
                              Visit portal <ExternalLink size={12} aria-hidden />
                            </a>
                          )}
                          {item.reportTo.phone && (
                            <a href={`tel:${item.reportTo.phone}`} className="ftp-chip" style={CONTACT_LINK}>
                              <Phone size={14} aria-hidden />
                              <span className="ftp-num">{item.reportTo.phone}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {item.sourceNotes && (
                        <details style={{ marginTop: 8, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
                          <summary style={{ cursor: "pointer" }}>Source</summary>
                          <p style={{ margin: "4px 0 0", lineHeight: "16px" }}>{item.sourceNotes}</p>
                        </details>
                      )}
                    </Card>
                  ))}
                </div>
              </Section>
            </div>
          ))}

          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 20 }}>
            <span className="ftp-num">{districtSpecific.itemCount}</span> actions specific to {districtSpecific.districtName},
            based on official government sources. This is not an official government website —
            every item links back to its authoritative source. See the &quot;Source&quot; expander
            beneath each card.
          </p>
        </>
      )}

      {/* Generic fallback render (other districts) */}
      {!isLoading && !districtSpecific && (
        <>
          <StatStrip cols={2}>
            <StatTile emoji="💡" label="Suggestions" value={genericItemCount} sub="General guidance" />
            <StatTile emoji="🗂️" label="Areas" value={genericContent.sections.length} sub="Groups of actions" />
          </StatStrip>

          {/* The picture for the generic guide is the plain sentence only:
              there is no per-action data to draw a pictogram from. */}
          {genericActionCount > 0 && (
            <div style={{ marginTop: 16 }}>
              <Explainer title="In simple words" emoji="🙋">
                Here are <strong className="ftp-num">{genericActionCount}</strong> simple things you can do for{" "}
                {genericContent.districtName}, grouped into <strong className="ftp-num">{genericActionSections.length}</strong> areas.
                Pick one and start today.
              </Explainer>
            </div>
          )}

          {genericContent.sections.map((section) => (
            <div key={section.title} style={{ marginTop: 8 }}>
              <Section title={section.title} emoji={groupEmoji(section.title)}>
                <Card tinted={section.isProjection}>
                  {section.isProjection ? (
                    <p className="ftp-body" style={{ marginBottom: 10, color: "var(--ftp-text-2)" }}>
                      If citizens and government work together, here&apos;s where{" "}
                      {genericContent.districtName} can be by 2030:
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
                        {/* A dot in the page hue instead of the browser bullet. */}
                        <span
                          aria-hidden
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "var(--hue)",
                            boxShadow: "0 0 0 3px var(--hue-tint)",
                            flexShrink: 0,
                            marginTop: 6,
                          }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Section>
            </div>
          ))}

          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 20 }}>
            This content is general guidance for {genericContent.districtName}. Each district
            on ForThePeople.in gets its own customised responsibility guide based on its unique
            challenges and opportunities, as deeper research is completed.
          </p>
        </>
      )}

      <SourcesFooter sources={src.sources.map((name) => ({ name, frequency: src.frequency }))} />

      <Toolbar>
        <ToolbarButton icon={Download} onClick={onCsv} disabled={isLoading}>
          Download CSV
        </ToolbarButton>
        <ToolbarButton icon={Share2} onClick={onShare}>
          {shareNote ?? "Share"}
        </ToolbarButton>
        <ToolbarButton icon={ArrowLeftRight} href={`/${locale}/compare?module=responsibility&a=${district}`}>
          Compare with another district
        </ToolbarButton>
      </Toolbar>
    </div>
  );
}
