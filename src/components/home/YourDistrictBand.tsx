/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  YourDistrictBand — mounts YourDistrictStrip on the home page
// ═══════════════════════════════════════════════════════════════════════
//
//  YourDistrictStrip takes two optional inputs that need data:
//    votes   → { kanpur: 47531, … } so a not-yet-live district can say
//              "47,531 people have asked for it"
//    extras  → a short line for a live district, e.g. "C+ 54 · 31°C"
//
//  Both come from the shared home fetches (home-data.ts), so mounting the
//  strip adds no extra network requests. Only the top requested districts
//  are known here; for any other district the vote sentence is omitted
//  rather than guessed.
//
"use client";

import { useMemo } from "react";
import YourDistrictStrip from "./YourDistrictStrip";
import type { MyDistrict } from "@/hooks/useMyDistrict";
import { asOfLabel } from "@/lib/utils/timeAgo";
import { slugifyDistrictName, usePreview, useTopVotes } from "./home-data";

export default function YourDistrictBand({ locale, variant = "strip" }: { locale: string; variant?: "strip" | "hero" }) {
  const preview = usePreview();
  const { votes } = useTopVotes();

  const voteMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of votes) map[slugifyDistrictName(v.districtName)] = v.requestCount;
    return map;
  }, [votes]);

  /** "C+ 54 · 31°C" — only the parts we actually have. */
  function extras(d: MyDistrict): React.ReactNode {
    const p = preview[d.slug];
    if (!p) return null;
    const parts: React.ReactNode[] = [];
    if (p.healthGrade) {
      parts.push(
        <span key="grade" title="District health score">
          <span className="ftp-num">{p.healthGrade}</span>
          {p.healthScore !== null && <span className="ftp-num"> {p.healthScore}</span>}
        </span>,
      );
    }
    if (p.weather?.temp !== null && p.weather?.temp !== undefined) {
      parts.push(
        <span key="temp" className="ftp-num" title={asOfLabel(p.weather.recordedAt ?? null, { prefix: "Weather as of" }) || undefined}>
          {p.weather.temp}°C
        </span>,
      );
    }
    if (parts.length === 0) return null;
    return parts.map((part, i) => (
      <span key={i}>
        {i > 0 && " · "}
        {part}
      </span>
    ));
  }

  return <YourDistrictStrip locale={locale} votes={voteMap} extras={extras} variant={variant} />;
}
