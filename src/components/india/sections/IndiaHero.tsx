/**
 * IndiaHero — homepage hero v10 (file 48 §Section 2.1).
 *
 * Renders a single-column horizontal stack:
 *  - Hero stage with 4px tricolor stripe on left edge + 20% tricolor radials
 *  - Banner block: eyebrow / "India" + LanguageRotator / motto + Preamble pill
 *  - 1×6 NationalIdentityGrid horizontal row
 *  - 1×6 QuickAccessStrip horizontal row
 *  - Below the hero (sibling): TricolorBadgesPanel + footer (rendered by page.tsx)
 *  - 5-tile KPI strip
 *  - Freshness strip
 *  - "India in the world" rankings card
 *
 * v10 retired the right-column badges panel (moved to a sibling below the hero
 * to give the achievements full horizontal real estate). 4 entrance animations
 * + a fade-in on the tricolor stripe stagger the hero's appearance.
 */

import * as React from "react";
import { BookOpenText, ChevronRight } from "lucide-react";
import { LanguageRotator } from "@/components/india/primitives/LanguageRotator";
import { NationalIdentityGrid } from "@/components/india/primitives/NationalIdentityGrid";
import { QuickAccessStrip } from "@/components/india/primitives/QuickAccessStrip";
import {
  HeroJaaliTopRight,
  HeroJaaliBottomLeft,
} from "@/components/india/primitives/decorations/HeroJaali";
import { HeroMandala } from "@/components/india/primitives/decorations/HeroMandala";

export interface IndiaHeroDict {
  eyebrow: string;
  motto: string;
  readPreamble: string;
}

interface IndiaHeroProps {
  locale: string;
  dict?: IndiaHeroDict;
}

const HERO_FALLBACK: IndiaHeroDict = {
  eyebrow: "South Asia · Republic · Constitution adopted 26 Jan 1950",
  motto: '"Sovereign, socialist, secular, democratic republic"',
  readPreamble: "Read the Preamble — every Indian should",
};

export function IndiaHero({ locale, dict }: IndiaHeroProps) {
  const t = dict ?? HERO_FALLBACK;

  return (
    <section style={{ padding: "0 0 1rem 0" }}>
      {/* Hero stage — v10: vertical stack, 4px tricolor stripe on left,
          20% radial washes anchored at top corners. */}
      <div
        style={{
          position: "relative",
          padding: "18px 22px 18px 26px",
          borderRadius: "var(--border-radius-lg)",
          overflow: "hidden",
          border: "0.5px solid rgba(0, 0, 0, 0.08)",
          background: `
            radial-gradient(ellipse 360px 200px at 12% 0%, rgba(30, 95, 139, 0.16), transparent 70%),
            radial-gradient(ellipse 380px 200px at 88% 50%, rgba(19, 136, 8, 0.20), transparent 70%),
            radial-gradient(ellipse 280px 140px at 50% 100%, rgba(83, 74, 183, 0.10), transparent 75%),
            linear-gradient(180deg, #FAFCFD 0%, #FAFAF8 100%)
          `,
        }}
      >
        <HeroJaaliTopRight />
        <HeroJaaliBottomLeft />
        <HeroMandala />

        {/* 4px vertical tricolor stripe on left edge — fades in over 400ms */}
        <span
          aria-hidden
          className="india-hero-stripe"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "4px",
            opacity: 0,
            background:
              "linear-gradient(180deg, #FF9933 0%, #FF9933 33.33%, #FFFFFF 33.33%, #FFFFFF 66.66%, #138808 66.66%, #138808 100%)",
          }}
        />

        <div
          className="india-hero-stack"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Banner block — eyebrow, title row, motto + Preamble inline */}
          <div
            className="india-hero-banner"
            style={{
              opacity: 0,
              paddingBottom: "10px",
              borderBottom: "0.5px dashed rgba(0,0,0,0.10)",
            }}
          >
            {/* Design v4: sentence case in the reading face (no tracked-out
                mono capitals). */}
            <div
              style={{
                fontFamily: "var(--ftp-font-sans)",
                fontSize: "13px",
                lineHeight: "18px",
                fontWeight: 500,
                color: "var(--ftp-text-2)",
                marginBottom: "8px",
              }}
            >
              {t.eyebrow}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "14px",
                marginBottom: "6px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "52px",
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-0.015em",
                  margin: 0,
                }}
                className="india-hero-headline"
              >
                India
              </h1>
              <LanguageRotator />
            </div>

            <div
              className="india-hero-motto-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* flex-basis 240 px: on phones the motto takes its own line
                  instead of squeezing into a one-word column under the pill. */}
              <div
                style={{
                  flex: "1 1 240px",
                  minWidth: 0,
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "15px",
                  fontStyle: "italic",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t.motto}
              </div>

              <a
                href="https://www.constitutionofindia.net/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px 6px 10px",
                  background:
                    "linear-gradient(90deg, rgba(83, 74, 183, 0.10) 0%, rgba(83, 74, 183, 0.04) 100%)",
                  border: "0.5px solid rgba(83, 74, 183, 0.30)",
                  color: "#3C3489",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 500,
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                <BookOpenText size={13} />
                {t.readPreamble}
                <ChevronRight size={11} style={{ opacity: 0.7 }} />
              </a>
            </div>
          </div>

          {/* 1×6 identity grid */}
          <div className="india-hero-identity" style={{ opacity: 0 }}>
            <NationalIdentityGrid />
          </div>

          {/* 1×6 quick access strip */}
          <div className="india-hero-quick" style={{ opacity: 0 }}>
            <QuickAccessStrip locale={locale} />
          </div>
        </div>

        <style>{`
          @keyframes ftp-hero-fade-in-up {
            0%   { opacity: 0; transform: translateY(8px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes ftp-hero-stripe-fade {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }
          @media (prefers-reduced-motion: no-preference) {
            .india-hero-banner {
              animation: ftp-hero-fade-in-up 250ms ease-out forwards;
              animation-delay: 0ms;
            }
            .india-hero-identity {
              animation: ftp-hero-fade-in-up 250ms ease-out forwards;
              animation-delay: 50ms;
            }
            .india-hero-quick {
              animation: ftp-hero-fade-in-up 250ms ease-out forwards;
              animation-delay: 100ms;
            }
            .india-hero-stripe {
              animation: ftp-hero-stripe-fade 400ms ease-out forwards;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .india-hero-banner,
            .india-hero-identity,
            .india-hero-quick {
              opacity: 1 !important;
            }
            .india-hero-stripe { opacity: 1 !important; }
          }
        `}</style>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .india-hero-headline {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
}


export default IndiaHero;
