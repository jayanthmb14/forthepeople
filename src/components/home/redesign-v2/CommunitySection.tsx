/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 18 v12 Phase I (Fix #9) — combined community section.
 *
 * Wraps ContributorsStrip (compact mode) and VoteFeaturesCTA into a
 * single side-by-side 50/50 section. Replaces the previous two
 * stacked sections.
 *
 * Both child components are fully self-contained — they fetch their
 * own data from existing APIs. This wrapper just provides the layout.
 *
 * Tablet ≤1024px collapses to a single column with normal spacing.
 */

"use client";

import ContributorsStrip from "./ContributorsStrip";
import VoteFeaturesCTA from "./VoteFeaturesCTA";

export interface CommunitySectionProps {
  locale: string;
}

export default function CommunitySection({ locale }: CommunitySectionProps) {
  return (
    <section
      aria-labelledby="community-heading"
      className="ftp-section-wrap ftp-community-wrap"
      style={{ borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        .ftp-community-wrap {
          background: #FFFFFF;
          padding: 32px 0;
        }
        .ftp-community-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
        }
        .ftp-community-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        /* Each child section is already a .ftp-section-wrap with its own
           padding — neutralize the outer padding here so the two columns
           stack tightly inside CommunitySection. */
        .ftp-community-col > .ftp-section-wrap {
          padding: 0;
          background: transparent !important;
          border-top: none !important;
        }
        .ftp-community-col > .ftp-section-wrap > .ftp-section-inner {
          padding: 0;
          max-width: none;
        }

        @media (max-width: 1024px) {
          .ftp-community-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>

      <div className="ftp-section-inner">
        <h2 id="community-heading" className="sr-only">
          Community
        </h2>
        <div className="ftp-community-grid">
          <div className="ftp-community-col">
            <ContributorsStrip locale={locale} compact />
          </div>
          <div className="ftp-community-col">
            <VoteFeaturesCTA locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
}
