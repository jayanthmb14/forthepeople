/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 v13 Phase F (Fix #6) — thin expandable Share-Your-Idea
 * bar that lives directly under the hero "Explore the whole India"
 * CTA. Replaces the form's previous home in CommunitySection right
 * column.
 *
 * Collapsed state: a small pill bar prompting "Share your thoughts…"
 * Clicking expands to reveal the existing SuggestionForm (POSTs to
 * the existing /api/suggestions endpoint). On success, returns to a
 * "Thanks!" pill that auto-collapses after 2.5s.
 *
 * No new endpoint, no schema change. SuggestionForm component is reused.
 */

"use client";

import { useState } from "react";
import SuggestionForm from "@/components/features/SuggestionForm";

export default function HeroShareIdea() {
  const [expanded, setExpanded] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSuccess() {
    setSuccess(true);
    setTimeout(() => {
      setExpanded(false);
      setSuccess(false);
    }, 2500);
  }

  return (
    <div className="ftp-hero-share-wrap">
      <style>{`
        .ftp-hero-share-wrap {
          width: 100%;
          max-width: 600px;
          margin: 12px auto 0;
        }
        .ftp-hero-share-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 999px;
          font-size: 13px;
          color: #6B7280;
          cursor: pointer;
          transition: border-color 200ms ease, background 200ms ease, transform 200ms ease, box-shadow 200ms ease;
          text-align: left;
          font-family: inherit;
        }
        .ftp-hero-share-bar:hover {
          border-color: #6E59C0;
          background: #FAFAFE;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(110, 89, 192, 0.08);
        }
        .ftp-hero-share-bar-icon { font-size: 16px; line-height: 1; }
        .ftp-hero-share-bar-text { flex: 1; }
        .ftp-hero-share-bar-arrow { color: #6E59C0; font-weight: 700; }

        .ftp-hero-share-form-card {
          background: #FFFFFF;
          border: 1px solid #DDD6FE;
          border-radius: 14px;
          box-shadow: 0 6px 16px rgba(110, 89, 192, 0.08);
          padding: 16px;
        }
        .ftp-hero-share-form-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 10px;
          gap: 8px;
        }
        .ftp-hero-share-form-title {
          font-size: 14px;
          font-weight: 700;
          color: #3C3489;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ftp-hero-share-form-cancel {
          background: transparent;
          border: none;
          padding: 4px 8px;
          font-size: 11px;
          color: #6B7280;
          cursor: pointer;
          border-radius: 4px;
          font-family: inherit;
        }
        .ftp-hero-share-form-cancel:hover { background: #F3F4F6; color: #1A1A1A; }

        .ftp-hero-share-success {
          width: 100%;
          padding: 14px 20px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          border-radius: 999px;
          color: #065F46;
          font-weight: 600;
          text-align: center;
          font-size: 13px;
        }
        @media (prefers-reduced-motion: reduce) {
          .ftp-hero-share-bar { transition: none; }
          .ftp-hero-share-bar:hover { transform: none; }
        }
      `}</style>

      {success ? (
        <div className="ftp-hero-share-success" role="status">
          ✓ Thanks! Your idea has been received.
        </div>
      ) : !expanded ? (
        <button
          type="button"
          className="ftp-hero-share-bar"
          onClick={() => setExpanded(true)}
          aria-expanded="false"
        >
          <span className="ftp-hero-share-bar-icon" aria-hidden="true">💡</span>
          <span className="ftp-hero-share-bar-text">
            Share your thoughts on what we should build next…
          </span>
          <span className="ftp-hero-share-bar-arrow" aria-hidden="true">→</span>
        </button>
      ) : (
        <div className="ftp-hero-share-form-card">
          <div className="ftp-hero-share-form-header">
            <div className="ftp-hero-share-form-title">
              <span aria-hidden="true">💡</span>
              Share your idea
            </div>
            <button
              type="button"
              className="ftp-hero-share-form-cancel"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </button>
          </div>
          <SuggestionForm onSuccess={handleSuccess} />
        </div>
      )}
    </div>
  );
}
