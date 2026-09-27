/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /feedback — full-page feedback form (POST /api/feedback)
//
//  Design v4 "Rang" (teal): SiteHeader band, the feedback types as big
//  emoji cards (a radio group), 44 px inputs, and one primary button in
//  the page hue. No picture: this page has no data. The submit logic and
//  the request body are unchanged.
// ═══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, MessageSquare } from "lucide-react";
import { Card } from "@/components/district/ui";
import SiteHeader from "@/components/site/SiteHeader";

const FEEDBACK_TYPES: { value: string; label: string; emoji: string; desc: string }[] = [
  { value: "bug", label: "Bug report", emoji: "🐞", desc: "Something isn't working" },
  { value: "wrong_data", label: "Wrong data", emoji: "📊", desc: "Incorrect government data" },
  { value: "suggestion", label: "Suggestion", emoji: "💡", desc: "Feature or improvement idea" },
  { value: "praise", label: "Praise", emoji: "💖", desc: "Something you love" },
  { value: "other", label: "Other", emoji: "💬", desc: "General feedback" },
];

/** Shared input look: 44 px tall, 1 px border, 8 px radius, tokens only. */
const INPUT: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  fontSize: 15,
  lineHeight: "22px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

/** Field label (13 px, weight 600). */
const LABEL: React.CSSProperties = {
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 600,
  color: "var(--ftp-text)",
  display: "block",
  marginBottom: 6,
};

const OPTIONAL: React.CSSProperties = { fontSize: 12, fontWeight: 400, color: "var(--ftp-text-2)" };

/** Shared button box for the thank-you screen. */
const BUTTON: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  padding: "0 20px",
  borderRadius: "var(--ftp-radius-tile)",
  textDecoration: "none",
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "inherit",
  cursor: "pointer",
};

export default function FeedbackPage() {
  const [type, setType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, message, email: email || undefined, name: name || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="ftp-hue-teal" style={{ minHeight: "calc(100vh - 56px)", background: "var(--ftp-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div role="status" style={{ textAlign: "center", maxWidth: 480 }}>
          <div className="ftp-pop ftp-emoji" aria-hidden style={{ fontSize: 56, lineHeight: 1, marginBottom: 12 }}>
            🎉
          </div>
          <h1 className="ftp-h2" style={{ marginBottom: 8 }}>Thank you for your feedback!</h1>
          <p className="ftp-body" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", marginBottom: 24 }}>
            Every message helps make ForThePeople.in better for all citizens.
            We read every submission personally.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/en" className="ftp-btn ftp-btn-primary" style={{ ...BUTTON, border: "1px solid var(--hue)", color: "#fff" }}>
              Back to home
            </Link>
            <button
              type="button"
              onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}
              className="ftp-btn ftp-btn-secondary"
              style={{ ...BUTTON, background: "var(--ftp-surface)", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}
            >
              Submit another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ftp-hue-teal" style={{ minHeight: "calc(100vh - 56px)", background: "var(--ftp-bg)", paddingBottom: 64 }}>
      <div className="ftp-container" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 680 }}>
          <SiteHeader
            emoji="💬"
            icon={MessageSquare}
            title="Share your feedback"
            description="Found wrong data? Have a suggestion? Love something? Your feedback makes this platform better for every Indian citizen."
          />

          <Card padding={20}>
            <form onSubmit={handleSubmit}>
              {/* Feedback type — a radio group drawn as emoji cards */}
              <fieldset style={{ border: "none", padding: 0, margin: "0 0 24px" }}>
                <legend style={{ ...LABEL, marginBottom: 10 }}>What kind of feedback?</legend>
                <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
                  {FEEDBACK_TYPES.map((t) => {
                    const active = type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setType(t.value)}
                        style={{
                          padding: "12px 14px",
                          minHeight: 44,
                          border: `1px solid ${active ? "var(--hue)" : "var(--ftp-border)"}`,
                          borderRadius: 14,
                          background: active ? "var(--hue-tint)" : "var(--ftp-surface)",
                          boxShadow: active ? "0 6px 14px -10px color-mix(in srgb, var(--hue) 80%, transparent)" : "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                          transition: "background-color 150ms ease, border-color 150ms ease",
                        }}
                      >
                        <span className="ftp-emoji" aria-hidden style={{ display: "block", fontSize: 22, marginBottom: 6 }}>
                          {t.emoji}
                        </span>
                        <span style={{ display: "block", fontSize: 14, lineHeight: "20px", fontWeight: 600, color: active ? "var(--hue-deep)" : "var(--ftp-text)" }}>
                          {t.label}
                        </span>
                        <span style={{ display: "block", fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Subject */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="fb-subject" style={LABEL}>
                  Subject <span style={{ color: "var(--ftp-danger)" }}>*</span>
                </label>
                <input
                  id="fb-subject"
                  type="text"
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  style={INPUT}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="fb-message" style={LABEL}>
                  Message <span style={{ color: "var(--ftp-danger)" }}>*</span>
                </label>
                <textarea
                  id="fb-message"
                  required
                  maxLength={2000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe in detail. For data errors, mention the specific district, module, and what the correct value should be."
                  style={{ ...INPUT, resize: "vertical" }}
                />
                <div className="ftp-num" style={{ fontSize: 12, color: "var(--ftp-text-2)", marginTop: 4, textAlign: "right" }}>
                  {message.length}/2000
                </div>
              </div>

              {/* Optional contact info (stacks on phones) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 24 }}>
                <div>
                  <label htmlFor="fb-name" style={LABEL}>
                    Your name <span style={OPTIONAL}>(optional)</span>
                  </label>
                  <input
                    id="fb-name"
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we address you?"
                    style={INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="fb-email" style={LABEL}>
                    Email <span style={OPTIONAL}>(optional)</span>
                  </label>
                  <input
                    id="fb-email"
                    type="email"
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="If you want a response"
                    style={INPUT}
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="ftp-body" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "var(--ftp-danger)" }}>
                  <AlertCircle size={14} aria-hidden /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="ftp-btn ftp-btn-primary"
                style={{
                  width: "100%",
                  minHeight: 48,
                  color: "#fff",
                  border: "1px solid var(--hue)",
                  borderRadius: "var(--ftp-radius-tile)",
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Submitting…" : "Submit feedback"}
              </button>
            </form>
          </Card>

          <p style={{ fontSize: 12, lineHeight: "18px", color: "var(--ftp-text-2)", textAlign: "center", marginTop: 20 }}>
            All feedback is read personally. We may reach out if you provided an email.
            Thank you for helping improve India&apos;s citizen transparency platform.
          </p>
        </div>
      </div>
    </main>
  );
}
