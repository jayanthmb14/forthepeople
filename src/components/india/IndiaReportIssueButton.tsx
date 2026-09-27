/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Floating "Report an issue" button + form panel. Replaces the older
 * floating "Sources" button (Phase 2.5f) — sources are now visible
 * inline on each module deep-dive page via ModuleSourcePanel, so the
 * floating slot is repurposed for citizen issue reports.
 *
 * Submissions write a Feedback row with type="wrong_data" via the
 * existing /api/feedback endpoint. Module slug, current page URL, and
 * optional contact email are captured. Auto-classification (when
 * enabled in admin settings) routes these to the right reviewer queue.
 */

"use client";

import { useState } from "react";
import { Flag, Send, X } from "lucide-react";
import { INDIA_DESIGN } from "@/lib/india/india-design";

interface Props {
  /**
   * Module slug for the page being reported, when known. Left blank on
   * /[locale]/india where no specific module is in focus — the user can
   * still describe the issue in free text.
   */
  moduleSlug?: string;
}

export default function IndiaReportIssueButton({ moduleSlug }: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError("Please add a short subject and a description.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wrong_data",
          module: moduleSlug ?? "india-page",
          subject: subject.trim().slice(0, 200),
          message: message.trim().slice(0, 2000),
          email: email.trim() || undefined,
          name: name.trim() || undefined,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${res.status}).`);
      }
      setSubmittedOk(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    setOpen(false);
    // Reset success state next time it opens.
    setTimeout(() => setSubmittedOk(false), 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report an issue with the data on this page"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 70,
          background: INDIA_DESIGN.bgCard,
          border: `1px solid ${INDIA_DESIGN.border}`,
          borderRadius: 999,
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 600,
          color: INDIA_DESIGN.textPrimary,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(15, 23, 42, 0.12)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 40,
        }}
      >
        <Flag size={16} aria-hidden="true" color={INDIA_DESIGN.accentBlue} />
        Report an issue
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Report an issue"
          aria-modal="true"
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: INDIA_DESIGN.bgCard,
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              padding: 20,
              boxShadow: "0 30px 60px rgba(15, 23, 42, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: INDIA_DESIGN.textPrimary,
                  margin: 0,
                  fontFamily: INDIA_DESIGN.fontDisplay,
                }}
              >
                Report an issue
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: INDIA_DESIGN.textMuted,
                  padding: 4,
                  lineHeight: 0,
                  borderRadius: 6,
                }}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {submittedOk ? (
              <div
                role="status"
                style={{
                  padding: 16,
                  background: INDIA_DESIGN.bgPage,
                  border: `1px solid ${INDIA_DESIGN.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  color: INDIA_DESIGN.textSecondary,
                  lineHeight: 1.55,
                }}
              >
                <strong style={{ color: INDIA_DESIGN.textPrimary }}>
                  Thanks — report received.
                </strong>{" "}
                We&apos;ll review it. You&apos;ll see a reply on the email you
                provided if it qualifies for one.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
                <p
                  style={{
                    fontSize: 13,
                    color: INDIA_DESIGN.textMuted,
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Spotted an error, missing source, or something out of date?
                  Tell us — we&apos;ll fix it. Module:{" "}
                  <code style={{ fontFamily: INDIA_DESIGN.fontMono }}>
                    {moduleSlug ?? "india-page"}
                  </code>
                </p>

                <Field label="What's wrong? (subject)">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={200}
                    required
                    placeholder="e.g. Tiger count looks off for Karnataka"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                    required
                    rows={4}
                    placeholder="What did you see, and what should it have been? Link a source if you have one."
                    style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                  />
                </Field>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                  }}
                >
                  <Field label="Your name (optional)">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      style={inputStyle}
                    />
                  </Field>
                  <Field label="Your email (optional)">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={200}
                      placeholder="we'll only use this to reply"
                      style={inputStyle}
                    />
                  </Field>
                </div>

                {error ? (
                  <div
                    role="alert"
                    style={{
                      fontSize: 12,
                      color: "#B91C1C",
                      background: "#FEE2E2",
                      border: "1px solid #FCA5A5",
                      borderRadius: 6,
                      padding: "8px 10px",
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: INDIA_DESIGN.accentBlue,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 42,
                    marginTop: 4,
                  }}
                >
                  <Send size={14} aria-hidden="true" />
                  {submitting ? "Sending…" : "Send report"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: INDIA_DESIGN.textMuted,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 14,
  color: INDIA_DESIGN.textPrimary,
  background: INDIA_DESIGN.bgPage,
  border: `1px solid ${INDIA_DESIGN.border}`,
  borderRadius: 6,
  fontFamily: "inherit",
};
