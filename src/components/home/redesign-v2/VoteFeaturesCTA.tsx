/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Session 17 v11 Phase F (Fix #6) — compact "Share your thoughts" bar
 * + 3-line top voted list.
 *
 * Replaces the full-page combined Vote+Share card. The component now
 * occupies ~140px of vertical space:
 *   - Thin pill-shaped bar that scrolls visitors to /features#share-idea
 *   - Mini card showing top 3 voted features + "View all features →"
 *
 * The Share-Your-Idea form lives EXCLUSIVELY on /features now (anchored
 * at #share-idea). No form inline on the homepage.
 *
 * Pulls live from /api/features (existing endpoint, no schema change).
 */

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FeatureRow {
  id: string;
  title: string;
  votes: number;
}

export interface VoteFeaturesCTAProps {
  locale: string;
}

export default function VoteFeaturesCTA({ locale }: VoteFeaturesCTAProps) {
  const [features, setFeatures] = useState<FeatureRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/features");
        if (!res.ok) {
          if (!cancelled) setFeatures([]);
          return;
        }
        const data = (await res.json()) as { features?: FeatureRow[] };
        if (!cancelled) setFeatures(data.features ?? []);
      } catch {
        if (!cancelled) setFeatures([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalVotes = (features ?? []).reduce((s, f) => s + (f.votes ?? 0), 0);
  const totalIdeas = features?.length ?? 0;
  const top3 = (features ?? []).slice(0, 3);

  return (
    <section
      aria-labelledby="features-heading"
      className="ftp-section-wrap ftp-vote-wrap"
      style={{ borderTop: "1px solid #F0F0EC" }}
    >
      <style>{`
        .ftp-vote-wrap {
          background: #F0F7FF;
          padding: 24px 0;
        }
        .ftp-features-compact {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 720px;
          margin: 0 auto;
        }

        /* Thin "Share your thoughts" bar */
        .ftp-share-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid #DDD6FE;
          border-radius: 10px;
          text-decoration: none;
          color: #4B5563;
          font-size: 13px;
          transition: border-color 150ms ease, background 150ms ease, transform 150ms ease, box-shadow 200ms ease;
        }
        .ftp-share-bar:hover {
          border-color: #6E59C0;
          background: #FAFAFE;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(110, 89, 192, 0.08);
        }
        .ftp-share-bar-icon { font-size: 16px; flex-shrink: 0; line-height: 1; }
        .ftp-share-bar-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ftp-share-bar-arrow {
          color: #6E59C0;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* Mini top-voted list */
        .ftp-features-mini {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 10px;
          padding: 14px 18px;
        }
        .ftp-features-mini-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ftp-features-mini-title {
          font-size: 12px;
          font-weight: 700;
          color: #3C3489;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ftp-features-mini-stats {
          font-size: 11px;
          color: #9B9B9B;
          font-variant-numeric: tabular-nums;
        }
        .ftp-features-mini-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }
        .ftp-features-mini-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: 6px;
          text-decoration: none;
          color: #1A1A1A;
          font-size: 12px;
          transition: background 100ms ease;
        }
        .ftp-features-mini-row:hover { background: #F4F3FE; }
        .ftp-features-mini-vote {
          background: #6E59C0;
          color: #FFFFFF;
          padding: 1px 7px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          min-width: 42px;
          text-align: center;
          flex-shrink: 0;
          font-variant-numeric: tabular-nums;
        }
        .ftp-features-mini-title-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ftp-features-mini-cta {
          display: inline-block;
          font-size: 11px;
          color: #6E59C0;
          font-weight: 600;
          text-decoration: none;
        }
        .ftp-features-mini-cta:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        @media (max-width: 767px) {
          .ftp-features-compact { gap: 10px; }
          .ftp-share-bar { padding: 10px 14px; font-size: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-share-bar { transition: none; }
          .ftp-share-bar:hover { transform: none; }
        }
      `}</style>

      <div className="ftp-section-inner">
        <h2 id="features-heading" className="sr-only">
          Help shape what&apos;s next
        </h2>

        <div className="ftp-features-compact">
          {/* Session 19 v13 Phase F: share-bar moved to hero (HeroShareIdea).
              VoteFeaturesCTA now hosts only the Top Voted mini list. */}

          {/* Mini top-3 voted */}
          <div className="ftp-features-mini">
            <div className="ftp-features-mini-header">
              <span className="ftp-features-mini-title">🗳️ Top voted</span>
              <span className="ftp-features-mini-stats">
                {features === null
                  ? "Loading…"
                  : `${totalVotes.toLocaleString("en-IN")} vote${totalVotes === 1 ? "" : "s"} · ${totalIdeas} idea${totalIdeas === 1 ? "" : "s"}`}
              </span>
            </div>

            {top3.length > 0 ? (
              <div className="ftp-features-mini-list">
                {top3.map((f) => (
                  <Link
                    key={f.id}
                    href={`/${locale}/features`}
                    className="ftp-features-mini-row"
                  >
                    <span className="ftp-features-mini-vote">
                      ▲ {f.votes.toLocaleString("en-IN")}
                    </span>
                    <span className="ftp-features-mini-title-text">{f.title}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#6E59C0", marginBottom: 8 }}>
                No ideas yet — be the first.
              </div>
            )}

            <Link href={`/${locale}/features`} className="ftp-features-mini-cta">
              View all features →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
