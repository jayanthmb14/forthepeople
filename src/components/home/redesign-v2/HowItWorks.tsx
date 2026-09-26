/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 18 v12 Phase K (Fix #11) — pastel-accent redesign.
 *
 * Each of the 4 steps gets its own pastel accent color (blue / purple /
 * emerald / amber). Top of each card carries a 3px stripe in the accent
 * color; step number is a pill in the accent's tint; icon sits in a
 * 56×56 rounded square with the accent's lighter tint background.
 *
 * Arrow connectors (→) sit between cards on desktop, hidden when grid
 * collapses to 2-col tablet or 1-col mobile.
 *
 * Wording (Aggregate / Process / Surface / Sustain) preserved from
 * Session 12. Source-attribution caption restored at the bottom.
 */

"use client";

import React from "react";
import { getPlatformFacts } from "@/lib/platform-facts";

// Module count from the sidebar registry — the same number the stat tile
// and the About page print (issue #36).
const { modulesPerDistrict } = getPlatformFacts();

// Mobile-revert: 3 steps to match the production layout — citizens read
// these as the simple "input → output → for them" story. Source attribution
// caption below carries the longer "where the data comes from" detail.
const STEPS = [
  {
    num: "01",
    icon: "📡",
    title: "We Collect",
    desc: "Data from official .gov.in portals, checked daily and stamped with the date the source published. NDSAP-licensed, traceable to the source.",
    accent: "blue" as const,
  },
  {
    num: "02",
    icon: "📊",
    title: "We Organize",
    desc: `Into ${modulesPerDistrict} dashboards per district with charts, maps, news and source links.`,
    accent: "purple" as const,
  },
  {
    num: "03",
    icon: "👁",
    title: "You See",
    desc: "The latest district data, with an \"as of\" date on every figure. Free. Open source. Yours.",
    accent: "emerald" as const,
  },
];

// Session 19 v13 Phase J: shorter inline caption + full text in title= tooltip.
const SOURCES_CAPTION =
  "Sources: data.gov.in · censusindia.gov.in · agmarknet · ejalshakti · NFHS-5 · SHRUG · PRS · Harvard Dataverse · & more";
const SOURCES_FULL_TITLE =
  "Sources include data.gov.in, censusindia.gov.in, agmarknet.gov.in, ejalshakti.gov.in, NFHS-5 mirrors, SHRUG, PRS Legislative Research, Harvard Dataverse, and other public datasets. Full source attribution on every module.";

export default function HowItWorks() {
  return (
    <section
      aria-labelledby="how-heading"
      className="ftp-section-wrap ftp-how-wrap"
      style={{ borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        /* Session 19 v13 Phase J (Fix #11): compact spacing.
           Session 19.8 Phase F: top padding 28→16 to tighten the gap from
           the now-visually-distinct Live Data section above. */
        .ftp-how-wrap { background: #FAFAF8; padding: 16px 0 28px; }

        .ftp-how-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .ftp-how-h2 {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0 0 2px 0;
        }
        .ftp-how-subtitle {
          font-size: 12px;
          color: #6B7280;
          margin: 0;
        }

        /* Pipeline: card · → · card · → · card (3 steps) */
        .ftp-how-pipeline {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          gap: 0;
          align-items: stretch;
          margin-bottom: 24px;
        }

        .ftp-how-step {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          transition: transform 200ms ease, box-shadow 200ms ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          opacity: 0;
          transform: translateY(8px);
          animation: ftp-how-card-reveal 400ms ease-out forwards;
        }
        .ftp-how-step:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
        }

        /* Top accent stripe — fixed at the top of each card */
        .ftp-how-step::before {
          content: "";
          position: absolute;
          top: 0; left: 16px; right: 16px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: var(--accent);
        }

        /* Per-accent palette (CSS vars consumed inside the card) */
        .ftp-how-step-blue    { --accent: #3B82F6; --tint: #EFF6FF; --tint-deep: #DBEAFE; --text-deep: #1E3A8A; }
        .ftp-how-step-purple  { --accent: #A855F7; --tint: #FAF5FF; --tint-deep: #F3E8FF; --text-deep: #6B21A8; }
        .ftp-how-step-emerald { --accent: #10B981; --tint: #ECFDF5; --tint-deep: #D1FAE5; --text-deep: #065F46; }
        .ftp-how-step-amber   { --accent: #F59E0B; --tint: #FFFBEB; --tint-deep: #FEF3C7; --text-deep: #92400E; }

        .ftp-how-step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 18px;
          padding: 0 7px;
          background: var(--tint-deep);
          color: var(--text-deep);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.4px;
          border-radius: 4px;
          align-self: flex-start;
          font-variant-numeric: tabular-nums;
        }

        .ftp-how-step-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px; height: 40px;
          background: var(--tint);
          border-radius: 10px;
          border: 1px solid var(--tint-deep);
        }
        .ftp-how-step-icon { font-size: 22px; line-height: 1; }

        .ftp-how-step-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-deep);
          margin: 2px 0 0 0;
        }
        .ftp-how-step-desc {
          font-size: 11px;
          color: #4B5563;
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }

        /* Arrow connectors — desktop only */
        .ftp-how-connector {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #9CA3AF;
          padding: 0 6px;
          font-weight: 300;
          align-self: center;
        }

        /* Session 19 v13 Phase J: caption forced to one line on desktop */
        .ftp-how-caption {
          font-size: 10px;
          color: #9CA3AF;
          line-height: 1.4;
          text-align: center;
          font-style: italic;
          max-width: 100%;
          margin: 14px auto 0;
          padding-top: 10px;
          border-top: 1px solid #E5E7EB;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media (max-width: 1024px) {
          .ftp-how-caption {
            white-space: normal;
            line-height: 1.5;
          }
        }

        @keyframes ftp-how-card-reveal {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          /* 3 cards in 3-col layout, drop arrow connectors */
          .ftp-how-pipeline { grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
          .ftp-how-connector { display: none; }
        }
        @media (max-width: 600px) {
          .ftp-how-pipeline { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-how-step {
            animation: none;
            opacity: 1;
            transform: none;
            transition: none;
          }
          .ftp-how-step:hover { transform: none; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
        }
      `}</style>

      <div className="ftp-section-inner">
        <div className="ftp-how-header">
          <h2 id="how-heading" className="ftp-how-h2">How it works</h2>
          <p className="ftp-how-subtitle">Where the numbers come from</p>
        </div>

        <div className="ftp-how-pipeline">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.num}>
              <div
                className={`ftp-how-step ftp-how-step-${step.accent}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="ftp-how-step-num">{step.num}</div>
                <div className="ftp-how-step-icon-wrap">
                  <span className="ftp-how-step-icon" aria-hidden="true">{step.icon}</span>
                </div>
                <h3 className="ftp-how-step-title">{step.title}</h3>
                <p className="ftp-how-step-desc">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="ftp-how-connector" aria-hidden="true">→</div>
              )}
            </React.Fragment>
          ))}
        </div>

        <p className="ftp-how-caption" title={SOURCES_FULL_TITLE}>{SOURCES_CAPTION}</p>
      </div>
    </section>
  );
}
