/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { X, MessageSquare } from "lucide-react";

const FEEDBACK_TYPES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "wrong_data", label: "📊 Wrong Data" },
  { value: "suggestion", label: "💡 Suggestion" },
  { value: "district_request", label: "🗺️ District Request" },
  { value: "data_source", label: "📊 Data Source" },
  { value: "translation", label: "🌐 Translation" },
  { value: "praise", label: "🙏 Praise" },
  { value: "other", label: "💬 Other" },
];

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
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px 18px 0 0",
          width: "100%", maxWidth: 520,
          padding: "24px 24px 36px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ width: 36, height: 4, background: "#E8E8E4", borderRadius: 2, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>
            <MessageSquare size={14} style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />
            Send Feedback
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9B9B9B", padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {FEEDBACK_TYPES.map((t) => (
              <button
                key={t.value} type="button"
                onClick={() => setType(t.value)}
                style={{
                  padding: "5px 13px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${type === t.value ? "#2563EB" : "#E8E8E4"}`,
                  background: type === t.value ? "#EFF6FF" : "#FAFAF8",
                  color: type === t.value ? "#2563EB" : "#6B6B6B",
                  cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            required maxLength={200}
            placeholder="Subject *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              padding: "9px 12px", border: "1px solid #E8E8E4",
              borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />

          <textarea
            required maxLength={2000}
            placeholder="Tell us more... (max 2000 chars)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              padding: "9px 12px", border: "1px solid #E8E8E4",
              borderRadius: 8, fontSize: 13, outline: "none",
              resize: "vertical", fontFamily: "inherit",
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, display: "block", marginBottom: 3 }}>
                Your Name (optional)
              </label>
              <input
                maxLength={100} placeholder="So we know who to thank"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #E8E8E4",
                  borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: "#9B9B9B", fontWeight: 600, display: "block", marginBottom: 3 }}>
                Your Email (for reply)
              </label>
              <input
                type="email" maxLength={200} placeholder="We'll reply to this email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", border: "1px solid #E8E8E4",
                  borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {name && email ? (
            <div style={{ fontSize: 11, color: "#16A34A", fontWeight: 500 }}>
              We&apos;ll get back to you!
            </div>
          ) : !email ? (
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              Without an email, we can&apos;t reply — but we still read every message.
            </div>
          ) : null}

          {error && <div style={{ fontSize: 12, color: "#DC2626" }}>{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "11px 0",
              background: submitting ? "#93C5FD" : "#2563EB",
              color: "#fff", border: "none", borderRadius: 8,
              fontSize: 14, fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
            }}
          >
            {submitting ? "Sending..." : "Send Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}

const WAYS = [
  {
    icon: "🐛",
    title: "Report a data error",
    desc: "Found incorrect or outdated data? Tell us. We correct errors within 24 hours.",
    action: "Report Issue",
    feedbackType: "wrong_data",
    feedbackSubject: "Data error report: ",
  },
  {
    icon: "🗺️",
    title: "Request your district",
    desc: "Your district isn't listed yet? Submit a request and we'll prioritise it based on demand.",
    action: "Request District",
    feedbackType: "district_request",
    feedbackSubject: "District request: ",
  },
  {
    icon: "💻",
    title: "Contribute code",
    desc: "The platform is open-source. PRs welcome — from bug fixes to new data modules.",
    action: "View on GitHub",
    href: "https://github.com/jayanthmb14/forthepeople",
  },
  {
    icon: "🌐",
    title: "Help with translations",
    desc: "We need native speakers to verify regional-language data labels. All Indian languages welcome.",
    action: "Volunteer",
    feedbackType: "translation",
    feedbackSubject: "Translation help: ",
  },
  {
    icon: "📊",
    title: "Share a data source",
    desc: "Know of a government portal or dataset we haven't tapped yet? Let us know.",
    action: "Suggest Source",
    feedbackType: "data_source",
    feedbackSubject: "Data source suggestion: ",
  },
  {
    icon: "📣",
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
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        fontFamily: "var(--font-plus-jakarta, system-ui, sans-serif)",
      }}
    >
      <Link
        href="/"
        style={{ fontSize: 13, color: "#9B9B9B", textDecoration: "none", display: "inline-block", marginBottom: 16 }}
      >
        ← ForThePeople.in
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.4px", marginBottom: 8 }}>
        Contribute
      </h1>
      <p style={{ fontSize: 16, color: "#4B4B4B", lineHeight: 1.7, marginBottom: 32, maxWidth: 560 }}>
        ForThePeople.in is built and maintained by volunteers. Every contribution —
        big or small — helps more citizens access the data they&apos;re entitled to.
      </p>

      {successMsg && (
        <div
          style={{
            background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10,
            padding: "14px 18px", marginBottom: 20, fontSize: 14, color: "#15803D",
            fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>🙏</span>
          Thank you! Your submission has been received. We&apos;ll review it shortly.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 40 }}>
        {WAYS.map((w) => (
          <div
            key={w.title}
            style={{
              background: "#FFF",
              border: "1px solid #E8E8E4",
              borderRadius: 12,
              padding: "20px 22px",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{w.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1A", marginBottom: 6 }}>{w.title}</div>
            <div style={{ fontSize: 13, color: "#6B6B6B", lineHeight: 1.6, marginBottom: w.action ? 14 : 0 }}>
              {w.desc}
            </div>
            {w.action && "feedbackType" in w && w.feedbackType && (
              <button
                onClick={() =>
                  setFeedbackOpen({
                    type: w.feedbackType!,
                    subject: w.feedbackSubject ?? "",
                  })
                }
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {w.action} →
              </button>
            )}
            {w.action && "href" in w && w.href && (
              <a
                href={w.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "7px 14px",
                  background: "#EFF6FF",
                  color: "#2563EB",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {w.action} →
              </a>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#F0FDF4",
          border: "1px solid #BBF7D0",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "#15803D", marginBottom: 4 }}>
          Open Source
        </div>
        <p style={{ fontSize: 13, color: "#166534", lineHeight: 1.7, margin: 0 }}>
          ForThePeople.in is fully open-source under the MIT licence. The code, data
          pipelines, and seed data are all publicly available. We believe transparency
          about our own platform is as important as the data transparency we provide.
        </p>
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
    </div>
  );
}
