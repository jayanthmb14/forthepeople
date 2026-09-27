/**
 * Rendered on /tenders pages when District.tendersActive === false.
 * Tells the visitor tenders for this district aren't tracked yet + offers
 * a sponsor CTA to prioritise activation. Also lists currently-live
 * districts so they can find coverage elsewhere.
 *
 * The sidebar still renders "Govt. Tenders" for every district (intentional
 * discoverability). This component is the gated entry-point content.
 *
 * Design v3: PageHeader-style heading (the page's one <h1>), plain Cards,
 * tokens only, 44 px tap targets, Lucide icons.
 */

"use client";

import type React from "react";
import Link from "next/link";
import { Lock, ArrowRight, Heart, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/district/ui";

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

/** Primary call-to-action link (brand fill, 44 px tall). */
const PRIMARY_LINK: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  padding: "0 20px",
  background: "var(--ftp-brand)",
  color: "var(--ftp-surface)",
  borderRadius: "var(--ftp-radius-tile)",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 500,
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
      <Link
        href={`/${locale}/${stateSlug}/${districtSlug}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-text-2)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} aria-hidden /> Back to overview
      </Link>

      {/* Lock icon + title */}
      <header style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", borderBottom: "1px solid var(--ftp-border)", paddingBottom: 20, marginBottom: 24 }}>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--ftp-radius-tile)",
            background: "var(--ftp-warn-tint)",
            color: "var(--ftp-warn)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Lock size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 22, lineHeight: "28px", fontWeight: 500, color: "var(--ftp-text)", margin: "0 0 4px" }}>
            Tender tracking for {districtName} is coming soon
          </h1>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>
            We&rsquo;re aggregating procurement data from {stateName}&rsquo;s
            government eProc portals. Support the project to prioritise your
            district — each supporter shortens the wait for a new district to
            come online.
          </p>
        </div>
      </header>

      {/* Sponsor CTA */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Heart size={18} aria-hidden style={{ color: "var(--ftp-support)" }} />
          <h2 className="ftp-title">Help bring tenders to {districtName}</h2>
        </div>
        <p className="ftp-body" style={{ color: "var(--ftp-text-2)", margin: "0 0 16px" }}>
          Covering a new district costs time (legal review, data-collection
          setup, state-specific disclaimer). Supporters decide where we go next.
        </p>
        <Link href="/support" style={PRIMARY_LINK}>
          Support this district <ArrowRight size={14} aria-hidden />
        </Link>
      </Card>

      {/* What's covered elsewhere */}
      {liveElsewhere.length > 0 && (
        <Card>
          <div className="ftp-label" style={{ marginBottom: 12 }}>Currently tracked</div>
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
                    <span style={{ fontWeight: 500 }}>{d.districtName}</span>
                    <span style={{ color: "var(--ftp-text-2)", fontSize: 11, marginLeft: 8 }}>{d.stateName}</span>
                  </span>
                  <ArrowRight size={14} aria-hidden style={{ color: "var(--ftp-text-2)" }} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
