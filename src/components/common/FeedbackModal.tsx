/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  FeedbackModal — bottom-sheet feedback form (POST /api/feedback)
//
//  Two triggers: `floating` (the "Report issue" pill on district pages,
//  via FeedbackFloatingButton) or an inline text button with `label`.
//  Design v3 (2026-09-27): tokens only, no shadows or glow, kit Chips for
//  the type picker (no emoji), a Lucide Flag on the floating pill, every
//  field has a visible <label htmlFor>, 44 px targets, role="dialog" and
//  focus outlines left on. The submit logic and request body are unchanged.
// ═══════════════════════════════════════════════════════════════════════
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { CheckCircle2, Flag, X } from "lucide-react";
import { Chips } from "@/components/district/ui";

const TYPES = [
  { value: "bug", label: "Bug" },
  { value: "wrong_data", label: "Wrong Data" },
  { value: "suggestion", label: "Suggestion" },
  { value: "praise", label: "Praise" },
  { value: "other", label: "Other" },
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
  const tf = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  // Unique ids so each <label> points at its field (safe if two modals mount).
  const uid = useId();
  const ids = {
    subject: `${uid}-subject`,
    message: `${uid}-message`,
    name: `${uid}-name`,
    email: `${uid}-email`,
  };

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

  // ── Trigger: floating pill (district pages) or an inline text button ──
  const triggerBtn = floating ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={tf("triggerTitle")}
      aria-haspopup="dialog"
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 90,
        background: "var(--ftp-brand)", color: "var(--ftp-surface)",
        border: "1px solid var(--ftp-brand-deep)", borderRadius: "var(--ftp-radius-pill)",
        minHeight: 44, padding: "0 16px",
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 13, fontWeight: 500, cursor: "pointer",
      }}
    >
      <Flag size={14} aria-hidden />
      {tf("trigger")}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        background: "none", border: "none",
        padding: 0, cursor: "pointer",
        color: "var(--ftp-brand)", fontSize: "inherit",
        fontFamily: "inherit", fontWeight: 500,
        textDecoration: "underline", textUnderlineOffset: 2,
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
            // Scrim behind the sheet: the text colour at 45 %, so it follows
            // light and dark themes without a hard-coded colour.
            background: "color-mix(in srgb, var(--ftp-text) 45%, transparent)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            style={{
              background: "var(--ftp-surface)",
              color: "var(--ftp-text)",
              border: "1px solid var(--ftp-border)",
              borderBottom: "none",
              borderRadius: "var(--ftp-radius-card) var(--ftp-radius-card) 0 0",
              width: "100%", maxWidth: 520,
              padding: "16px 20px 32px",
              maxHeight: "90vh",
              overflowY: "auto",
              textAlign: "left",
            }}
          >
            {/* Drag handle (decorative) */}
            <div aria-hidden style={{ width: 36, height: 4, background: "var(--ftp-border-strong)", borderRadius: "var(--ftp-radius-pill)", margin: "0 auto 16px" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 id="feedback-modal-title" className="ftp-title" style={{ fontSize: 17 }}>Send Feedback</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close feedback form"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ftp-text-2)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: -12 }}
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {success ? (
              <div role="status" style={{ textAlign: "center", padding: "32px 0" }}>
                <CheckCircle2 size={36} aria-hidden style={{ color: "var(--ftp-live)", margin: "0 auto 12px", display: "block" }} />
                <p className="ftp-title" style={{ color: "var(--ftp-live-text)", marginBottom: 6 }}>Thank you!</p>
                <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Your feedback has been received and will be reviewed.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Feedback type (kit Chips; the visible label names the group) */}
                <div>
                  <p aria-hidden style={FIELD_LABEL}>Type</p>
                  <Chips
                    label="Feedback type"
                    items={TYPES.map((t) => ({ value: t.value, label: t.label }))}
                    value={type}
                    onChange={setType}
                  />
                </div>

                <div>
                  <label htmlFor={ids.subject} style={FIELD_LABEL}>Subject (required)</label>
                  <input
                    id={ids.subject}
                    required maxLength={200}
                    placeholder="One line about the issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ ...FIELD, width: "100%" }}
                  />
                </div>

                <div>
                  <label htmlFor={ids.message} style={FIELD_LABEL}>Message (required, up to 2000 characters)</label>
                  <textarea
                    id={ids.message}
                    required maxLength={2000}
                    placeholder="Describe the issue or suggestion…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    style={{ ...FIELD, width: "100%", resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Two columns on wider sheets, stacked on phones */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 180px" }}>
                      <label htmlFor={ids.name} style={FIELD_LABEL}>Your Name (optional)</label>
                      <input
                        id={ids.name}
                        maxLength={100} placeholder="So we know who to thank"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ ...FIELD, width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: "1 1 180px" }}>
                      <label htmlFor={ids.email} style={FIELD_LABEL}>Your Email (optional)</label>
                      <input
                        id={ids.email}
                        type="email" maxLength={200} placeholder="Add your email to receive a reply"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ ...FIELD, width: "100%" }}
                      />
                    </div>
                  </div>
                  {name && email ? (
                    <p style={{ ...HINT, color: "var(--ftp-live-text)", fontWeight: 500 }}>
                      We&apos;ll get back to you!
                    </p>
                  ) : !email ? (
                    <p style={HINT}>
                      Without an email, we can&apos;t reply — but we still read every message.
                    </p>
                  ) : null}
                </div>

                {districtSlug && (
                  <p style={{ ...HINT, background: "var(--ftp-surface-2)", padding: "6px 10px", borderRadius: "var(--ftp-radius-tile)" }}>
                    Context: {districtSlug}{module ? ` › ${module}` : ""}
                  </p>
                )}

                {error && (
                  <p role="alert" style={{ ...HINT, fontSize: 13, color: "var(--ftp-danger)" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    minHeight: 44,
                    background: submitting ? "var(--ftp-border-strong)" : "var(--ftp-brand)",
                    color: submitting ? "var(--ftp-text-2)" : "var(--ftp-surface)",
                    border: "none", borderRadius: "var(--ftp-radius-tile)",
                    fontSize: 15, fontWeight: 500,
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

// ── Shared field styles (Design v3 tokens only) ──────────────────────
const FIELD: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  fontSize: 15,
  lineHeight: "22px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 11,
  lineHeight: "16px",
  fontWeight: 500,
  color: "var(--ftp-text-2)",
  display: "block",
  marginBottom: 4,
};

const HINT: React.CSSProperties = { margin: 0, fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)" };
