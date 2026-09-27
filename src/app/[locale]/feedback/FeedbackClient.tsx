/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /feedback — full-page feedback form (POST /api/feedback)
//
//  The question it answers: "How do I tell them something is wrong, and
//  what happens after I do?"
//
//  Design v4.1 (teal) inside <ModulePage>: SiteHeader band → the answer in
//  one sentence (Explainer) → the form (feedback types as big emoji cards
//  in a radio group, 44 px inputs, one primary button in the page hue)
//  beside the picture: "What happens next" in HowItWorks steps. Side by
//  side on laptop / PC, stacked on phones and tablets (form first). The
//  submit logic and the request body are unchanged. Text: "page_feedback"
//  messages; an error message written by the API is shown as it comes.
//  Metadata lives in the [locale] route file (this is a client component).
// ═══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, MessageSquare } from "lucide-react";
import { Card, ModulePage } from "@/components/district/ui";
import { Explainer, HowItWorks } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { useFormat } from "@/i18n/client";

const FEEDBACK_TYPES: { value: string; emoji: string }[] = [
  { value: "bug", emoji: "🐞" },
  { value: "wrong_data", emoji: "📊" },
  { value: "suggestion", emoji: "💡" },
  { value: "praise", emoji: "💖" },
  { value: "other", emoji: "💬" },
];

const MESSAGE_MAX = 2000;

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
  lineHeight: 1.5,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

/** Field label (13 px, weight 600). */
const LABEL: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
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

/** Red asterisk for a required field (the input's `required` tells screen readers). */
function Req() {
  return <span aria-hidden style={{ color: "var(--ftp-danger)" }}>*</span>;
}

export default function FeedbackPage() {
  const t = useTranslations("page_feedback");
  const locale = useLocale();
  const { number } = useFormat();
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("errorFailed"));
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
          <h1 className="ftp-h2" style={{ marginBottom: 8 }}>{t("thanksTitle")}</h1>
          <p className="ftp-body" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", marginBottom: 24 }}>{t("thanksBody")}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/${locale}`} className="ftp-btn ftp-btn-primary" style={{ ...BUTTON, border: "1px solid var(--hue)", color: "#fff" }}>
              {t("backHome")}
            </Link>
            <button
              type="button"
              onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }}
              className="ftp-btn ftp-btn-secondary"
              style={{ ...BUTTON, background: "var(--ftp-surface)", color: "var(--ftp-text)", border: "1px solid var(--ftp-border)" }}
            >
              {t("another")}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ftp-hue-teal" style={{ minHeight: "calc(100vh - 56px)", background: "var(--ftp-bg)", paddingBottom: 32 }}>
      <ModulePage>
          <SiteHeader emoji="💬" icon={MessageSquare} title={t("title")} description={t("description")} backHref={`/${locale}`} />

          <Explainer emoji="📬">{t("simple")}</Explainer>

          <div className="ftp-picture-row" style={{ alignItems: "start" }}>
          <Card padding={20}>
            <form onSubmit={handleSubmit}>
              {/* Feedback type — a radio group drawn as emoji cards */}
              <fieldset style={{ border: "none", padding: 0, margin: "0 0 24px" }}>
                <legend style={{ ...LABEL, marginBottom: 10 }}>{t("kindLegend")}</legend>
                <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 150px), 1fr))", gap: 8 }}>
                  {FEEDBACK_TYPES.map((ft) => {
                    const active = type === ft.value;
                    return (
                      <button
                        key={ft.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setType(ft.value)}
                        style={{
                          padding: "12px 14px",
                          minHeight: 44,
                          border: `1px solid ${active ? "var(--hue)" : "var(--ftp-border)"}`,
                          borderRadius: 14,
                          background: active ? "var(--hue-tint)" : "var(--ftp-surface)",
                          boxShadow: active ? "0 6px 14px -10px color-mix(in srgb, var(--hue) 80%, transparent)" : "none",
                          cursor: "pointer",
                          textAlign: "start",
                          fontFamily: "inherit",
                          transition: "background-color 150ms ease, border-color 150ms ease",
                        }}
                      >
                        <span className="ftp-emoji" aria-hidden style={{ display: "block", fontSize: 22, marginBottom: 6 }}>
                          {ft.emoji}
                        </span>
                        <span style={{ display: "block", fontSize: 14, lineHeight: 1.45, fontWeight: 600, color: active ? "var(--hue-deep)" : "var(--ftp-text)" }}>
                          {t(`type_${ft.value}_label`)}
                        </span>
                        <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)", marginTop: 2 }}>
                          {t(`type_${ft.value}_desc`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Subject */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="fb-subject" style={LABEL}>
                  {t("subject")} <Req />
                </label>
                <input
                  id="fb-subject"
                  type="text"
                  required
                  maxLength={200}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("subjectPlaceholder")}
                  style={INPUT}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="fb-message" style={LABEL}>
                  {t("message")} <Req />
                </label>
                <textarea
                  id="fb-message"
                  required
                  maxLength={MESSAGE_MAX}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  style={{ ...INPUT, resize: "vertical" }}
                />
                <div className="ftp-num" style={{ fontSize: 12, color: "var(--ftp-text-2)", marginTop: 4, textAlign: "end" }}>
                  {t("count", { n: number(message.length), max: number(MESSAGE_MAX) })}
                </div>
              </div>

              {/* Optional contact info (stacks on phones) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 12, marginBottom: 24 }}>
                <div>
                  <label htmlFor="fb-name" style={LABEL}>
                    {t("name")} <span style={OPTIONAL}>{t("optional")}</span>
                  </label>
                  <input
                    id="fb-name"
                    type="text"
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("namePlaceholder")}
                    style={INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="fb-email" style={LABEL}>
                    {t("email")} <span style={OPTIONAL}>{t("optional")}</span>
                  </label>
                  <input
                    id="fb-email"
                    type="email"
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
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
                {submitting ? t("submitting") : t("submit")}
              </button>
            </form>
          </Card>

          {/* The picture: what happens after you press Send */}
          <Card tinted padding={18}>
            <HowItWorks
              title={t("howTitle")}
              steps={[
                { emoji: "✍️", title: t("step_write"), body: t("step_writeBody") },
                { emoji: "👀", title: t("step_read"), body: t("step_readBody") },
                { emoji: "🔧", title: t("step_fix"), body: t("step_fixBody") },
                { emoji: "📧", title: t("step_reply"), body: t("step_replyBody") },
              ]}
            />
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ftp-text-2)", margin: "14px 0 0" }}>{t("footnote")}</p>
          </Card>
          </div>
      </ModulePage>
    </main>
  );
}
