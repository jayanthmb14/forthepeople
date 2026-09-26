/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useState } from "react";
import Link from "next/link";
import { MessageSquare, CheckCircle } from "lucide-react";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug Report", emoji: "🐛", desc: "Something isn't working" },
  { value: "wrong_data", label: "Wrong Data", emoji: "📊", desc: "Incorrect government data" },
  { value: "suggestion", label: "Suggestion", emoji: "💡", desc: "Feature or improvement idea" },
  { value: "praise", label: "Praise", emoji: "🙏", desc: "Something you love" },
  { value: "other", label: "Other", emoji: "💬", desc: "General feedback" },
];

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
      <main style={{ minHeight: "calc(100vh - 56px)", background: "#FAFAF8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <CheckCircle size={56} style={{ color: "#16A34A", marginBottom: 16 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>
            Thank you for your feedback!
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B6B", lineHeight: 1.7, marginBottom: 24 }}>
            Every message helps make ForThePeople.in better for all citizens.
            We read every submission personally.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/en"
              style={{
                padding: "10px 20px", background: "#2563EB", color: "#fff",
                borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600,
              }}
            >
              Back to Home
            </Link>
            <button
              onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}
              style={{
                padding: "10px 20px", background: "#F5F5F0", color: "#6B6B6B",
                border: "1px solid #E8E8E4", borderRadius: 8, fontSize: 14, cursor: "pointer",
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
    <main style={{ minHeight: "calc(100vh - 56px)", background: "#FAFAF8", paddingBottom: 64 }}>
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAFAF8 100%)",
          borderBottom: "1px solid #E8E8E4",
          padding: "40px 24px 32px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <MessageSquare size={40} style={{ color: "#2563EB", marginBottom: 12 }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.5px", marginBottom: 8 }}>
            Share Your Feedback
          </h1>
          <p style={{ fontSize: 15, color: "#6B6B6B", lineHeight: 1.7 }}>
            Found wrong data? Have a suggestion? Love something?
            Your feedback makes this platform better for every Indian citizen.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "32px 24px 0" }}>
        <form onSubmit={handleSubmit}>
          {/* Feedback type */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 10 }}>
              What kind of feedback?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {FEEDBACK_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  style={{
                    padding: "12px 14px",
                    border: type === t.value ? "2px solid #2563EB" : "1px solid #E8E8E4",
                    borderRadius: 10,
                    background: type === t.value ? "#EFF6FF" : "#FFFFFF",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: type === t.value ? "#2563EB" : "#1A1A1A" }}>
                    {t.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
              Subject <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your feedback"
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid #E8E8E4", borderRadius: 8,
                fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Message */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
              Message <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <textarea
              required
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please describe in detail. For data errors, mention the specific district, module, and what the correct value should be."
              style={{
                width: "100%", padding: "10px 12px",
                border: "1px solid #E8E8E4", borderRadius: 8,
                fontSize: 14, outline: "none", resize: "vertical",
                fontFamily: "var(--font-sans)", lineHeight: 1.6,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4, textAlign: "right" }}>
              {message.length}/2000
            </div>
          </div>

          {/* Optional contact info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
                Your Name <span style={{ fontSize: 11, color: "#9B9B9B" }}>(optional)</span>
              </label>
              <input
                type="text"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we address you?"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid #E8E8E4", borderRadius: 8,
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 6 }}>
                Email <span style={{ fontSize: 11, color: "#9B9B9B" }}>(optional)</span>
              </label>
              <input
                type="email"
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="If you want a response"
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "1px solid #E8E8E4", borderRadius: 8,
                  fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "13px 0",
              background: submitting ? "#93C5FD" : "#2563EB",
              color: "#fff", border: "none", borderRadius: 10,
              fontSize: 15, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit Feedback"}
          </button>
        </form>

        <p style={{ fontSize: 12, color: "#9B9B9B", textAlign: "center", marginTop: 20 }}>
          All feedback is read personally. We may reach out if you provided an email.
          Thank you for helping improve India&apos;s citizen transparency platform. 🙏
        </p>
      </div>
    </main>
  );
}
