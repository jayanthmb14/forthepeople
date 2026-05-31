/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 12 v7 — LiveDistrictsList.
 *   - 10 active districts in a 3-col grid (desktop), 2-col tablet,
 *     horizontal scroll-snap on mobile (1.25 cards visible)
 *   - Top 3 by goLiveDate desc get a yellow NEW badge
 *   - One-line curated intro per district from DISTRICT_INTROS map
 *   - Stagger reveal animation on scroll-into-view (60ms apart)
 *   - prefers-reduced-motion respected throughout
 *
 * Data is server-fetched in [locale]/page.tsx and passed in via props.
 */

"use client";

import Link from "next/link";
import { useMemo } from "react";

// ── Curated 1-line intros (only design copy; not data) ──
const DISTRICT_INTROS: Record<string, string> = {
  "pune":             "Auto + IT hub",
  "lucknow":          "City of Nawabs",
  "hyderabad":        "Cyberabad",
  "bengaluru-urban":  "Silicon Valley of India",
  "mumbai":           "Financial capital",
  "new-delhi":        "National capital",
  "chennai":          "Detroit of India, IT hub",
  "kolkata":          "Cultural capital, City of Joy",
  "mysuru":           "Heritage city of palaces",
  "mandya":           "Sugar capital of South India",
  "dima-hasao":       "Switzerland of the East",
  "guwahati":         "Gateway to Northeast India",
};


const NEW_BADGE_COUNT = 3;

interface ActiveDistrict {
  slug: string;
  name: string;
  stateSlug: string;
  stateName: string;
  goLiveDate?: string | null;
}

export interface LiveDistrictsListProps {
  locale: string;
  activeDistricts: ActiveDistrict[];
}

export default function LiveDistrictsList({
  locale,
  activeDistricts,
}: LiveDistrictsListProps) {
  // Top 3 most-recently launched get the NEW badge.
  const newSlugs = useMemo(() => {
    const sorted = [...activeDistricts].sort((a, b) => {
      const ax = a.goLiveDate ? new Date(a.goLiveDate).getTime() : 0;
      const bx = b.goLiveDate ? new Date(b.goLiveDate).getTime() : 0;
      return bx - ax;
    });
    return new Set(sorted.slice(0, NEW_BADGE_COUNT).map((d) => d.slug));
  }, [activeDistricts]);

  return (
    <section
      id="live-districts"
      aria-labelledby="districts-heading"
      className="ftp-section-wrap ftp-districts-wrap"
      style={{ background: "#FAFAF8", borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        .ftp-districts-header {
          display: flex; align-items: baseline; gap: 12px;
          margin-bottom: 16px;
        }
        .ftp-districts-header h2 {
          margin: 0; font-size: 18px; font-weight: 600; color: #1A1A1A;
        }
        .ftp-districts-count {
          font-size: 13px; color: #6B7280;
        }
        .ftp-districts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .ftp-district-card {
          background: #FFFFFF;
          border: 0.5px solid #E5E7EB;
          border-radius: 10px;
          padding: 14px 16px;
          padding-right: 38px; /* room for arrow */
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-decoration: none;
          color: #1A1A1A;
          position: relative;
          opacity: 0;
          transform: translateY(8px);
          animation: ftp-card-reveal 400ms ease-out forwards;
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 150ms ease;
          min-height: 70px;
        }
        .ftp-district-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.06);
          border-color: #D1D5DB;
        }
        .ftp-district-card-new {
          background: #FFFBEB;
          border-color: #FEF3C7;
        }
        .ftp-district-card-new:hover {
          box-shadow: 0 8px 20px rgba(234,179,8,0.18);
          border-color: #FDE68A;
        }
        .ftp-district-card-header {
          display: flex; align-items: center; gap: 8px;
        }
        .ftp-district-name { font-size: 15px; font-weight: 600; }
        .ftp-district-newbadge {
          background: #EAB308; color: #FFFFFF; font-size: 9px; font-weight: 600;
          padding: 1px 6px; border-radius: 3px; letter-spacing: 0.3px;
        }
        .ftp-district-intro { font-size: 12px; color: #6B7280; line-height: 1.4; }
        .ftp-district-state {
          font-size: 11px; color: #9B9B9B;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .ftp-district-arrow {
          position: absolute; right: 14px; top: 16px;
          font-size: 14px; color: #9B9B9B;
        }
        @keyframes ftp-card-reveal {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-district-card { animation: none; opacity: 1; transform: none; transition: none; }
          .ftp-district-card:hover { transform: none; }
        }
        @media (max-width: 1023px) and (min-width: 768px) {
          .ftp-districts-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .ftp-districts-grid {
            grid-template-columns: none;
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 12px;
            padding: 4px 0 16px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .ftp-districts-grid::-webkit-scrollbar { display: none; }
          .ftp-district-card {
            flex: 0 0 80%;
            scroll-snap-align: start;
            min-width: 240px;
          }
        }
      `}</style>

      <div className="ftp-section-inner">
        <div className="ftp-districts-header">
          <h2 id="districts-heading">Live districts</h2>
          <span className="ftp-districts-count">{activeDistricts.length} active</span>
        </div>

        <div className="ftp-districts-grid">
          {activeDistricts.map((d, i) => {
            const isNew = newSlugs.has(d.slug);
            const intro = DISTRICT_INTROS[d.slug];
            return (
              <Link
                key={d.slug}
                href={`/${locale}/${d.stateSlug}/${d.slug}`}
                className={`ftp-district-card${isNew ? " ftp-district-card-new" : ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="ftp-district-card-header">
                  <span className="ftp-district-name">{d.name}</span>
                  {isNew && <span className="ftp-district-newbadge">NEW</span>}
                </div>
                {intro && <div className="ftp-district-intro">{intro}</div>}
                <div className="ftp-district-state">{d.stateName}</div>
                <span className="ftp-district-arrow" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
