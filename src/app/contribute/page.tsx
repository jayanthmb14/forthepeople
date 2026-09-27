/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /contribute — ways to help + an in-page feedback sheet
//
//  Design v4 "Rang": SiteHeader band in green, one card per way to help,
//  each with its own emoji and hue, kit Chips for the feedback type, and a
//  primary button in the page hue. No picture: this page has no data.
//  The feedback request body and the success behaviour are unchanged.
// ═══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { ExternalLink, HeartHandshake, X } from "lucide-react";
import { Card, Chips } from "@/components/district/ui";
import SiteHeader from "@/components/site/SiteHeader";
import type { Hue } from "@/lib/design/hues";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug" },
  { value: "wrong_data", label: "Wrong data" },
  { value: "suggestion", label: "Suggestion" },
  { value: "district_request", label: "District request" },
  { value: "data_source", label: "Data source" },
  { value: "translation", label: "Translation" },
  { value: "praise", label: "Praise" },
  { value: "other", label: "Other" },
];

// ── Shared field styles (tokens only) ────────────────────────────────
const FIELD: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  fontSize: 15,
  lineHeight: "22px",
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const FIELD_LABEL: React.CSSProperties = {
  fontSize: 12,
  lineHeight: "16px",
  fontWeight: 600,
  color: "var(--ftp-text-2)",
  display: "block",
  marginBottom: 4,
};
const HINT: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" };

/** Action (button or link) on each "way to help" card, in that card's hue. */
const ACTION: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 14px",
  background: "var(--hue-tint)",
  color: "var(--hue-deep)",
  border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 14,
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  fontFamily: "inherit",
};

function FeedbackForm({
  defaultType,
  defaultSubject,
  onSuccess,
  onClose,
}: {
  defaultType: string;
  defaultSubject: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, name, email }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }


  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        // Scrim behind the sheet (a neutral dim, not a brand colour).
        background: "rgba(0, 0, 0, 0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contribute-feedback-title"
        className="ftp-hue-green"
        style={{
          background: "var(--ftp-surface)",
          color: "var(--ftp-text)",
          border: "1px solid var(--ftp-border)",
          borderBottom: "none",
          borderRadius: "22px 22px 0 0",
          width: "100%", maxWidth: 520,
          padding: "16px 20px 32px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div aria-hidden style={{ width: 36, height: 4, background: "var(--ftp-border-strong)", borderRadius: "var(--ftp-radius-pill)", margin: "0 auto 16px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 id="contribute-feedback-title" className="ftp-display" style={{ margin: 0, fontSize: 20, lineHeight: "26px", fontWeight: 650, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>💬</span>
            Send feedback
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback form"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ftp-text-2)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: -12 }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Chips label="Feedback type" items={FEEDBACK_TYPES} value={type} onChange={setType} />

          <input
            required maxLength={200}
            placeholder="Subject *"
            aria-label="Subject (required)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={FIELD}
          />

          <textarea
            required maxLength={2000}
            placeholder="Tell us more... (max 2000 chars)"
            aria-label="Message (required)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ ...FIELD, resize: "vertical" }}
          />

          {/* Two columns on wider sheets, stacked on phones */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label htmlFor="ct-name" style={FIELD_LABEL}>Your name (optional)</label>
              <input
                id="ct-name"
                maxLength={100} placeholder="So we know who to thank"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...FIELD, width: "100%" }}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label htmlFor="ct-email" style={FIELD_LABEL}>Your email (for reply)</label>
              <input
                id="ct-email"
                type="email" maxLength={200} placeholder="We'll reply to this email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...FIELD, width: "100%" }}
              />
            </div>
          </div>

          {name && email ? (
            <p style={{ ...HINT, color: "var(--ftp-live-text)", fontWeight: 600 }}>
              We&apos;ll get back to you!
            </p>
          ) : !email ? (
            <p style={HINT}>
              Without an email, we can&apos;t reply — but we still read every message.
            </p>
          ) : null}

          {error && <p role="alert" style={{ ...HINT, fontSize: 13, color: "var(--ftp-danger)" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="ftp-btn ftp-btn-primary"
            style={{
              minHeight: 48,
              color: "#fff",
              border: "1px solid var(--hue)",
              borderRadius: "var(--ftp-radius-tile)",
              fontSize: 15, fontWeight: 600,
              fontFamily: "inherit",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Sending..." : "Send feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

// Each way to help: an emoji, a hue, a title, one sentence, and either an
// in-page feedback action (feedbackType) or an external link (href).
const WAYS: {
  emoji: string;
  hue: Hue;
  title: string;
  desc: string;
  action: string | null;
  feedbackType?: string;
  feedbackSubject?: string;
  href?: string;
}[] = [
  {
    emoji: "🐞",
    hue: "rose",
    title: "Report a data error",
    desc: "Found incorrect or outdated data? Tell us. We correct errors within 24 hours.",
    action: "Report issue",
    feedbackType: "wrong_data",
    feedbackSubject: "Data error report: ",
  },
  {
    emoji: "📍",
    hue: "yellow",
    title: "Request your district",
    desc: "Your district isn't listed yet? Submit a request and we'll prioritise it based on demand.",
    action: "Request district",
    feedbackType: "district_request",
    feedbackSubject: "District request: ",
  },
  {
    emoji: "💻",
    hue: "indigo",
    title: "Contribute code",
    desc: "The platform is open-source. PRs welcome — from bug fixes to new data modules.",
    action: "View on GitHub",
    href: "https://github.com/jayanthmb14/forthepeople",
  },
  {
    emoji: "🗣️",
    hue: "violet",
    title: "Help with translations",
    desc: "We need native speakers to verify regional-language data labels. All Indian languages welcome.",
    action: "Volunteer",
    feedbackType: "translation",
    feedbackSubject: "Translation help: ",
  },
  {
    emoji: "📊",
    hue: "sky",
    title: "Share a data source",
    desc: "Know of a government portal or dataset we haven't tapped yet? Let us know.",
    action: "Suggest source",
    feedbackType: "data_source",
    feedbackSubject: "Data source suggestion: ",
  },
  {
    emoji: "📣",
    hue: "orange",
    title: "Spread the word",
    desc: "Share ForThePeople.in with journalists, researchers, students, and local officials in your district.",
    action: null,
  },
];

export default function ContributePage() {
  const [feedbackOpen, setFeedbackOpen] = useState<{
    type: string;
    subject: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  return (
    <main className="ftp-hue-green" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <div className="ftp-container" style={{ paddingTop: 24, paddingBottom: 64 }}>
        <div style={{ maxWidth: 760 }}>
          <SiteHeader
            emoji="🙌"
            icon={HeartHandshake}
            title="Contribute"
            description={
              <>
                ForThePeople.in is built and maintained by volunteers. Every contribution —
                big or small — helps more citizens access the data they&apos;re entitled to.
              </>
            }
            backHref="/"
          />

          {successMsg && (
            <Card padding={14} role="status" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, borderColor: "color-mix(in srgb, var(--ftp-live) 40%, var(--ftp-border))" }}>
              <span className="ftp-emoji" aria-hidden style={{ fontSize: 20 }}>✅</span>
              <span className="ftp-body" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>
                Thank you! Your submission has been received. We&apos;ll review it shortly.
              </span>
            </Card>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12, marginBottom: 32 }}>
            {WAYS.map((w) => (
              <div key={w.title} className={`ftp-hue-${w.hue}`}>
                <Card as="article" tinted padding={20} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 42, height: 42, fontSize: 21, borderRadius: 13 }}>
                    {w.emoji}
                  </span>
                  <h2 className="ftp-display" style={{ margin: "12px 0 0", fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>
                    {w.title}
                  </h2>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4, marginBottom: w.action ? 14 : 0 }}>
                    {w.desc}
                  </p>
                  {w.action && w.feedbackType && (
                    <div style={{ marginTop: "auto" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackOpen({
                            type: w.feedbackType!,
                            subject: w.feedbackSubject ?? "",
                          })
                        }
                        style={ACTION}
                      >
                        {w.action}
                      </button>
                    </div>
                  )}
                  {w.action && w.href && (
                    <div style={{ marginTop: "auto" }}>
                      <a href={w.href} target="_blank" rel="noopener noreferrer" style={ACTION}>
                        {w.action} <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>

          <Card tinted padding={20} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 42, height: 42, fontSize: 21, borderRadius: 13 }}>
              🔓
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>
                Open source
              </h2>
              <p className="ftp-body" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", marginTop: 4 }}>
                ForThePeople.in is fully open-source under the MIT licence. The code, data
                pipelines, and seed data are all publicly available. We believe transparency
                about our own platform is as important as the data transparency we provide.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {feedbackOpen && (
        <FeedbackForm
          defaultType={feedbackOpen.type}
          defaultSubject={feedbackOpen.subject}
          onSuccess={() => {
            setFeedbackOpen(null);
            setSuccessMsg(true);
            setTimeout(() => setSuccessMsg(false), 5000);
          }}
          onClose={() => setFeedbackOpen(null)}
        />
      )}
    </main>
  );
}
