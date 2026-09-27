"use client";

/**
 * Citizen suggestion form — used on /features (Share Your Idea tab) AND in
 * the homepage "Share an idea" modal. POSTs to /api/suggestions.
 *
 * Design v3 (2026-09-27): token colours only, every field has a real
 * <label htmlFor> tied to its input, inputs and the submit button are 44 px
 * tall (comfortable touch targets on phones), the chevron is a Lucide icon
 * and the submit button uses a Lucide icon instead of an emoji.
 * Design v4: the submit button takes the surrounding hue (violet on
 * /features and in the home page's ideas card; brand blue elsewhere).
 *
 * UNCHANGED: the validation rules (name validator, 5–120 char title,
 * 20–2000 char details), the request body, the success reset and the
 * error display — including the server's rate-limit message (HTTP 429,
 * max 3 per hour), which is shown exactly as the API words it.
 */

import { useId, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, MessageSquarePlus } from "lucide-react";
import { validateContributorName } from "@/lib/validators/contributor-name";

const CATEGORIES = ["Feature", "Bug", "Data", "UX", "Other"] as const;

export default function SuggestionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Unique ids so each <label> points at its field, even if the form is on
  // the page twice (e.g. /features tab + the modal).
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    nameHint: `${uid}-name-hint`,
    email: `${uid}-email`,
    category: `${uid}-category`,
    title: `${uid}-title`,
    titleHint: `${uid}-title-hint`,
    body: `${uid}-body`,
    bodyHint: `${uid}-body-hint`,
  };

  const nameCheck = useMemo(() => validateContributorName(name), [name]);
  const nameError = name.length > 0 && !nameCheck.ok ? nameCheck.reason : null;
  const titleTrim = title.trim();
  const bodyTrim = body.trim();
  const titleOk = titleTrim.length >= 5 && titleTrim.length <= 120;
  const bodyOk = bodyTrim.length >= 20 && bodyTrim.length <= 2000;
  const canSubmit = nameCheck.ok && titleOk && bodyOk && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: email || undefined, category, title, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setSuccess(true);
      setName(""); setEmail(""); setTitle(""); setBody(""); setCategory("Feature");
      onSuccess?.();
      setTimeout(() => setSuccess(false), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {success && (
        <div role="status" style={{ ...notice, color: "var(--ftp-live-text)", background: "var(--ftp-live-tint)" }}>
          <CheckCircle2 size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Thanks! Your suggestion is pending review.</span>
        </div>
      )}
      {error && (
        <div role="alert" style={{ ...notice, color: "var(--ftp-danger)", background: "var(--ftp-danger-tint)" }}>
          <AlertCircle size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor={ids.name} style={label}>Your name <Req /></label>
        <input
          id={ids.name}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          required
          autoComplete="name"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? ids.nameHint : undefined}
          style={{ ...input, borderColor: nameError ? "var(--ftp-danger)" : "var(--ftp-border)" }}
        />
        {nameError && <div id={ids.nameHint} style={{ ...hint, color: "var(--ftp-danger)" }}>{nameError}</div>}
      </div>

      <div>
        <label htmlFor={ids.email} style={label}>Email (optional, so we can follow up)</label>
        <input
          id={ids.email}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={120}
          autoComplete="email"
          style={input}
        />
      </div>

      <div>
        <label htmlFor={ids.category} style={label}>Category</label>
        {/* Native <select> with the OS chevron hidden; a Lucide chevron sits
            on top (pointer-events: none so clicks still reach the select). */}
        <div style={{ position: "relative" }}>
          <select
            id={ids.category}
            value={category}
            onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])}
            style={{
              ...input,
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              paddingRight: 36,
            }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--ftp-text-2)" }}
          />
        </div>
      </div>

      <div>
        <label htmlFor={ids.title} style={label}>Title (5–120 characters) <Req /></label>
        <input
          id={ids.title}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
          aria-describedby={ids.titleHint}
          aria-invalid={titleTrim.length > 0 && !titleOk ? true : undefined}
          style={input}
        />
        <div
          id={ids.titleHint}
          className="ftp-num"
          style={{ ...hint, color: titleTrim.length > 0 && !titleOk ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}
        >
          {titleTrim.length} / 120
        </div>
      </div>

      <div>
        <label htmlFor={ids.body} style={label}>Details (20–2000 characters) <Req /></label>
        <textarea
          id={ids.body}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          maxLength={2000}
          required
          aria-describedby={ids.bodyHint}
          aria-invalid={bodyTrim.length > 0 && !bodyOk ? true : undefined}
          style={{ ...input, resize: "vertical", minHeight: 120, padding: "10px 12px", lineHeight: "20px" }}
          placeholder="What's the idea? Who benefits? Anything we should know?"
        />
        <div
          id={ids.bodyHint}
          className="ftp-num"
          style={{ ...hint, color: bodyTrim.length > 0 && !bodyOk ? "var(--ftp-danger)" : "var(--ftp-text-2)" }}
        >
          {bodyTrim.length} / 2000
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: 44,
          padding: "0 18px",
          borderRadius: "var(--ftp-radius-tile)",
          border: "1px solid transparent",
          background: canSubmit ? "var(--hue)" : "var(--ftp-surface-2)",
          color: canSubmit ? "#fff" : "var(--ftp-text-2)",
          borderColor: canSubmit ? "transparent" : "var(--ftp-border)",
          fontFamily: "var(--ftp-font-sans)",
          fontWeight: 500,
          fontSize: 14,
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {!submitting && <MessageSquarePlus size={16} aria-hidden />}
        {submitting ? "Submitting…" : "Share your idea"}
      </button>
      <p style={{ ...hint, margin: 0 }}>
        Your submission is reviewed before being shown publicly. Limit: <span className="ftp-num">3</span> submissions per hour.
      </p>
    </form>
  );
}

/** Small "required" marker; the input's `required` attribute tells screen readers. */
function Req() {
  return <span aria-hidden style={{ color: "var(--ftp-danger)" }}>*</span>;
}

const label: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 500,
  color: "var(--ftp-text)",
  marginBottom: 4,
};
const input: React.CSSProperties = {
  width: "100%",
  minHeight: 44,
  padding: "0 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  fontFamily: "var(--ftp-font-sans)",
  fontSize: 14,
  color: "var(--ftp-text)",
  background: "var(--ftp-surface)",
};
const hint: React.CSSProperties = { fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 };
const notice: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 14px",
  borderRadius: "var(--ftp-radius-tile)",
  fontSize: 13,
  lineHeight: "20px",
};
