/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useState } from "react";
import { MessageSquare, X } from "lucide-react";

const TYPES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "wrong_data", label: "📊 Wrong Data" },
  { value: "suggestion", label: "💡 Suggestion" },
  { value: "praise", label: "🙏 Praise" },
  { value: "other", label: "💬 Other" },
];

interface Props {
  districtSlug?: string;
  stateSlug?: string;
  module?: string;
  floating?: boolean;
  label?: string;
}

export default function FeedbackModal({
  districtSlug,
  stateSlug,
  module,
  floating = false,
  label = "Feedback",
}: Props) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setType("bug");
    setSubject("");
    setMessage("");
    setName("");
    setEmail("");
    setError("");
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, subject, message, name, email,
          districtSlug, stateSlug, module,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setOpen(false); reset(); }, 2800);
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  const triggerBtn = floating ? (
    <button
      onClick={() => setOpen(true)}
      title="Report issue or send feedback"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 90,
        background: "#2563EB", color: "#fff",
        border: "none", borderRadius: 28,
        padding: "10px 18px",
        display: "flex", alignItems: "center", gap: 7,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        boxShadow: "0 4px 18px rgba(37,99,235,0.35)",
        transition: "opacity 0.15s",
      }}
    >
      <MessageSquare size={14} />
      Report Issue
    </button>
  ) : (
    <button
      onClick={() => setOpen(true)}
      style={{
        background: "none", border: "none",
        padding: 0, cursor: "pointer",
        color: "#9B9B9B", fontSize: 11,
        fontFamily: "inherit",
        textDecoration: "none",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {triggerBtn}

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
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
            {/* Drag handle */}
            <div style={{ width: 36, height: 4, background: "#E8E8E4", borderRadius: 2, margin: "0 auto 20px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>Send Feedback</div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9B9B9B", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🙏</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#16A34A", marginBottom: 6 }}>Thank you!</div>
                <div style={{ fontSize: 13, color: "#6B6B6B" }}>Your feedback has been received and will be reviewed.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Type pills */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TYPES.map((t) => (
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
                    borderRadius: 8, fontSize: 13, outline: "none",
                    fontFamily: "inherit",
                  }}
                />

                <textarea
                  required maxLength={2000}
                  placeholder="Describe the issue or suggestion… (max 2000 chars)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  style={{
                    padding: "9px 12px", border: "1px solid #E8E8E4",
                    borderRadius: 8, fontSize: 13, outline: "none",
                    resize: "vertical", fontFamily: "inherit",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                        Your Email (optional)
                      </label>
                      <input
                        type="email" maxLength={200} placeholder="Add your email to receive a reply"
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
                </div>

                {districtSlug && (
                  <div style={{ fontSize: 11, color: "#9B9B9B", background: "#FAFAF8", padding: "5px 10px", borderRadius: 6 }}>
                    Context: {districtSlug}{module ? ` › ${module}` : ""}
                  </div>
                )}

                {error && (
                  <div style={{ fontSize: 12, color: "#DC2626" }}>{error}</div>
                )}

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
                  {submitting ? "Sending…" : "Send Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
