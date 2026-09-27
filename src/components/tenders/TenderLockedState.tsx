/**
 * Rendered on /tenders pages when District.tendersActive === false.
 * Tells the visitor tenders for this district aren't tracked yet + offers
 * a sponsor CTA to prioritise activation. Also lists currently-live
 * districts so they can find coverage elsewhere.
 *
 * The sidebar still renders "Govt. Tenders" for every district (intentional
 * discoverability). This component is the gated entry-point content.
 *
 * Design v4: the kit PageHeader band (the page's one <h1>, module hue and
 * emoji from the registry), a tinted sponsor Card with a hue button,
 * a Section of districts that are tracked today. 44 px tap targets.
 */

"use client";

import type React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, Section } from "@/components/district/ui";

interface Props {
  locale: string;
  stateSlug: string;
  stateName: string;
  districtSlug: string;
  districtName: string;
}

interface LiveDistrict {
  districtSlug: string;
  districtName: string;
  stateSlug: string;
  stateName: string;
}

/** Primary call-to-action link (module-hue fill, 44 px tall). */
const PRIMARY_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  padding: "0 20px",
  background: "linear-gradient(135deg, var(--hue) 0%, var(--hue-deep) 100%)",
  color: "#fff",
  borderRadius: "var(--ftp-radius-pill)",
  boxShadow: "0 10px 20px -12px color-mix(in srgb, var(--hue) 80%, transparent)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
};

export default function TenderLockedState({
  locale,
  stateSlug,
  stateName,
  districtSlug,
  districtName,
}: Props) {
  // Fetch other districts that DO have tenders active — this page is the
  // best discovery surface for "what's covered today".
  const { data: liveList } = useQuery<{ districts: LiveDistrict[] }>({
    queryKey: ["tenders-live-districts"],
    queryFn: () => fetch("/api/tenders/live-districts").then((r) => r.json()),
    staleTime: 5 * 60_000,
  });

  const liveElsewhere = (liveList?.districts ?? []).filter(
    (d) => d.districtSlug !== districtSlug,
  );

  return (
    <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" }}>
      {/* Header band: module hue + emoji, the lock as the watermark icon. */}
      <PageHeader
        icon={Lock}
        title={`Tender tracking for ${districtName} is coming soon`}
        description={`We’re aggregating procurement data from ${stateName}’s government eProc portals. Support the project to prioritise your district — each supporter shortens the wait for a new district to come online.`}
        backHref={`/${locale}/${stateSlug}/${districtSlug}`}
      />

      {/* Sponsor CTA */}
      <Card tinted padding={18} style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span className="ftp-icon-chip" aria-hidden style={{ width: 34, height: 34, borderRadius: 11 }}>
            <Heart size={18} style={{ color: "var(--ftp-support)" }} />
          </span>
          <h2 className="ftp-title">Help bring tenders to {districtName}</h2>
        </div>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>
          Covering a new district costs time (legal review, data-collection
          setup, state-specific disclaimer). Supporters decide where we go next.
        </p>
        <Link href="/support" style={PRIMARY_LINK}>
          Support this district
        </Link>
      </Card>

      {/* What's covered elsewhere */}
      {liveElsewhere.length > 0 && (
        <Section title="Currently tracked" emoji="📍">
          <Card>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {liveElsewhere.map((d) => (
                <li key={d.districtSlug}>
                  <Link
                    href={`/${locale}/${d.stateSlug}/${d.districtSlug}/tenders`}
                    className="ftp-rail-item"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      minHeight: 44,
                      padding: "0 12px",
                      borderRadius: "var(--ftp-radius-tile)",
                      textDecoration: "none",
                      color: "var(--ftp-text)",
                      fontSize: 13,
                    }}
                  >
                    <span>
                      <span style={{ fontWeight: 600 }}>{d.districtName}</span>
                      <span style={{ color: "var(--ftp-text-2)", fontSize: 11, marginLeft: 8 }}>{d.stateName}</span>
                    </span>
                    <ArrowRight size={14} aria-hidden style={{ color: "var(--hue)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </div>
  );
}
