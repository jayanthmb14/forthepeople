/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /feedback — full-page feedback form (POST /api/feedback)
//
//  Design v3 (2026-09-27): PageHeader, Card, token colours, Lucide icons
//  for the feedback types (no emoji), 44 px inputs. The submit logic and
//  the request body are unchanged.
// ═══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, BarChart3, Bug, CheckCircle, Heart, Lightbulb, MessageCircle, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, PageHeader } from "@/components/district/ui";

const FEEDBACK_TYPES: { value: string; label: string; icon: LucideIcon; desc: string }[] = [
  { value: "bug", label: "Bug Report", icon: Bug, desc: "Something isn't working" },
  { value: "wrong_data", label: "Wrong Data", icon: BarChart3, desc: "Incorrect government data" },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb, desc: "Feature or improvement idea" },
  { value: "praise", label: "Praise", icon: Heart, desc: "Something you love" },
  { value: "other", label: "Other", icon: MessageCircle, desc: "General feedback" },
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

/** Field label (13 px, weight 500). */
const LABEL: React.CSSProperties = {
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 500,
  color: "var(--ftp-text)",
  display: "block",
  marginBottom: 6,
};

const OPTIONAL: React.CSSProperties = { fontSize: 11, fontWeight: 400, color: "var(--ftp-text-2)" };

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
      <main style={{ minHeight: "calc(100vh - 56px)", background: "var(--ftp-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div role="status" style={{ textAlign: "center", maxWidth: 480 }}>
          <CheckCircle size={40} aria-hidden style={{ color: "var(--ftp-live)", margin: "0 auto 16px", display: "block" }} />
          <h1 className="ftp-h2" style={{ marginBottom: 8 }}>Thank you for your feedback!</h1>
          <p className="ftp-body" style={{ fontSize: 15, lineHeight: "24px", color: "var(--ftp-text-2)", marginBottom: 24 }}>
            Every message helps make ForThePeople.in better for all citizens.
            We read every submission personally.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/en"
              style={{
                display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 20px",
                background: "var(--ftp-brand)", color: "var(--ftp-surface)",
                borderRadius: "var(--ftp-radius-tile)", textDecoration: "none", fontSize: 13, fontWeight: 500,
              }}
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}
              className="ftp-btn-secondary"
              style={{
                minHeight: 44, padding: "0 20px", background: "var(--ftp-surface)", color: "var(--ftp-text)",
                border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              Submit Another
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "calc(100vh - 56px)", background: "var(--ftp-bg)", paddingBottom: 64 }}>
      <div className="ftp-container" style={{ paddingTop: 32 }}>
        <div style={{ maxWidth: 640 }}>
          <PageHeader
            icon={MessageSquare}
            title="Share Your Feedback"
            description="Found wrong data? Have a suggestion? Love something? Your feedback makes this platform better for every Indian citizen."
          />

          <Card padding={20}>
            <form onSubmit={handleSubmit}>
              {/* Feedback type — a radio group drawn as cards */}
              <fieldset style={{ border: "none", padding: 0, margin: "0 0 24px" }}>
                <legend style={{ ...LABEL, marginBottom: 10 }}>What kind of feedback?</legend>
                <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
                  {FEEDBACK_TYPES.map((t) => {
                    const active = type === t.value;
                    const Icon = t.icon;
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
                          border: `1px solid ${active ? "var(--ftp-brand)" : "var(--ftp-border)"}`,
                          borderRadius: "var(--ftp-radius-tile)",
                          background: active ? "var(--ftp-brand-tint)" : "var(--ftp-surface)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <Icon size={18} aria-hidden style={{ color: active ? "var(--ftp-brand)" : "var(--ftp-text-2)", marginBottom: 6, display: "block" }} />
                        <span style={{ display: "block", fontSize: 13, lineHeight: "20px", fontWeight: 500, color: active ? "var(--ftp-brand-deep)" : "var(--ftp-text)" }}>
                          {t.label}
                        </span>
                        <span style={{ display: "block", fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 2 }}>{t.desc}</span>
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
                <div className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)", marginTop: 4, textAlign: "right" }}>
                  {message.length}/2000
                </div>
              </div>

              {/* Optional contact info (stacks on phones) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 24 }}>
                <div>
                  <label htmlFor="fb-name" style={LABEL}>
                    Your Name <span style={OPTIONAL}>(optional)</span>
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
                style={{
                  width: "100%",
                  minHeight: 48,
                  background: submitting ? "var(--ftp-border-strong)" : "var(--ftp-brand)",
                  color: submitting ? "var(--ftp-text-2)" : "var(--ftp-surface)",
                  border: "none",
                  borderRadius: "var(--ftp-radius-tile)",
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </form>
          </Card>

          <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", textAlign: "center", marginTop: 20 }}>
            All feedback is read personally. We may reach out if you provided an email.
            Thank you for helping improve India&apos;s citizen transparency platform.
          </p>
        </div>
      </div>
    </main>
  );
}
