/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, ExternalLink, Phone } from "lucide-react";
import { ModuleHeader, SectionLabel } from "@/components/district/ui";
import { getResponsibilityContent } from "@/lib/constants/responsibility-content";

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

export default function ResponsibilityPage({
  params,
}: {
  params: Promise<{ locale: string; state: string; district: string }>;
}) {
  const { locale, state, district } = use(params);
  const base = `/${locale}/${state}/${district}`;

  const { data: apiData, isLoading } = useQuery<ResponsibilityApiResponse>({
    queryKey: ["responsibility", state, district],
    queryFn: () =>
      fetch(`/api/data/responsibility?state=${state}&district=${district}`).then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Loading state — render nothing obvious (brief), then fallback or district-specific.
  const districtSpecific = apiData?.data && apiData.data.sections.length > 0 ? apiData.data : null;
  const genericContent = getResponsibilityContent(district);

  return (
    <div style={{ padding: 24 }}>
      <ModuleHeader
        icon={Flame}
        title="My Responsibility"
        description={
          districtSpecific
            ? `Civic actions specific to ${districtSpecific.districtName}`
            : genericContent.intro
        }
        backHref={base}
      />

      {/* Intro callout — shared for both branches */}
      <div
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)",
          border: "1px solid #BFDBFE",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 20,
          fontSize: 14,
          color: "#1D4ED8",
          lineHeight: 1.7,
          fontWeight: 500,
        }}
      >
        🗣️ <strong>This is YOUR district.</strong> Government alone cannot fix everything.
        As citizens, we have real power — and real responsibility. Small actions by many
        people create big change. Here&apos;s what you can do today.
      </div>

      {/* Emergency disclaimer — only show on district-specific pages (where live phones exist) */}
      {districtSpecific && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 12,
            color: "#78350F",
            lineHeight: 1.6,
          }}
        >
          Helplines and portal URLs are sourced from official government pages. Please verify
          before calling for emergencies — in a life-threatening situation, always dial{" "}
          <a href="tel:112" style={{ color: "#78350F", fontWeight: 600 }}>112</a> (India unified
          emergency) or <a href="tel:108" style={{ color: "#78350F", fontWeight: 600 }}>108</a>{" "}
          (ambulance).
        </div>
      )}

      {isLoading && (
        <div style={{ padding: 24, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
          Loading…
        </div>
      )}

      {/* District-specific render */}
      {!isLoading && districtSpecific && (
        <>
          {districtSpecific.sections.map((section) => (
            <div key={section.section} style={{ marginBottom: 24 }}>
              <SectionLabel>
                <span style={{ fontSize: 18, marginRight: 6 }}>{section.icon}</span>
                {section.section.toUpperCase()}
              </SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E8E8E4",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#1A1A1A", lineHeight: 1.45 }}>
                      {item.action}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "#5B5B5B", lineHeight: 1.6 }}>
                      {item.whyRelevant}
                    </p>

                    {item.reportTo?.name && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: "1px solid #F0F0EC",
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 10,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#374151" }}>Report to:</span>
                        <span style={{ color: "#1A1A1A" }}>{item.reportTo.name}</span>
                        {item.reportTo.url && (
                          <a
                            href={item.reportTo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#2563EB",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              minHeight: 32,
                              padding: "4px 0",
                            }}
                          >
                            Visit portal <ExternalLink size={11} />
                          </a>
                        )}
                        {item.reportTo.phone && (
                          <a
                            href={`tel:${item.reportTo.phone}`}
                            style={{
                              color: "#2563EB",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              minHeight: 44,
                              padding: "10px 12px",
                              margin: "-10px -12px",
                              fontWeight: 600,
                            }}
                          >
                            <Phone size={12} />
                            {item.reportTo.phone}
                          </a>
                        )}
                      </div>
                    )}

                    {item.sourceNotes && (
                      <details style={{ marginTop: 8, fontSize: 11, color: "#6B6B6B" }}>
                        <summary style={{ cursor: "pointer", listStyle: "none" }}>
                          Source
                        </summary>
                        <p
                          style={{
                            margin: "4px 0 0",
                            paddingLeft: 8,
                            borderLeft: "2px solid #E8E8E4",
                            lineHeight: 1.6,
                          }}
                        >
                          {item.sourceNotes}
                        </p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div
            style={{
              background: "#FAFAF8",
              border: "1px solid #E8E8E4",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 12,
              color: "#9B9B9B",
              marginTop: 8,
            }}
          >
            📌 {districtSpecific.itemCount} actions specific to {districtSpecific.districtName},
            based on official government sources. This is not an official government website —
            every item links back to its authoritative source. See the &quot;Source&quot; expander
            beneath each card.
          </div>
        </>
      )}

      {/* Generic fallback render (other districts) */}
      {!isLoading && !districtSpecific && (
        <>
          {genericContent.sections.map((section) => (
            <div key={section.title} style={{ marginBottom: 24 }}>
              <SectionLabel>
                {section.emoji} {section.title}
              </SectionLabel>
              <div
                style={{
                  background: section.color,
                  border: `1px solid ${section.border}`,
                  borderRadius: 14,
                  padding: "16px 20px",
                }}
              >
                {section.isProjection ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#1A1A1A",
                      marginBottom: 4,
                      fontStyle: "italic",
                    }}
                  >
                    If citizens and government work together, here&apos;s where{" "}
                    {genericContent.districtName} can be by 2030:
                  </div>
                ) : null}
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 13,
                        color: "#1A1A1A",
                        lineHeight: 1.6,
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div
            style={{
              background: "#FAFAF8",
              border: "1px solid #E8E8E4",
              borderRadius: 10,
              padding: "12px 16px",
              fontSize: 12,
              color: "#9B9B9B",
              marginTop: 8,
            }}
          >
            📌 This content is general guidance for {genericContent.districtName}. Each district
            on ForThePeople.in gets its own customised responsibility guide based on its unique
            challenges and opportunities, as deeper research is completed.
          </div>
        </>
      )}
    </div>
  );
}
