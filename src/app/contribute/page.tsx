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
//  primary button in the page hue. The picture: the most-requested
//  districts (citizens' votes, from /api/district-request — the same list
//  the vote page uses), shown only when there are votes.
//  The feedback request body and the success behaviour are unchanged.
//  Text: "page_contribute" messages. Metadata lives in the [locale] route
//  file (this is a client component).
// ═══════════════════════════════════════════════════════════════════════
import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, HeartHandshake, X } from "lucide-react";
import { Card, Chips } from "@/components/district/ui";
import { ChartCard } from "@/components/district/visuals";
import SiteHeader from "@/components/site/SiteHeader";
import { BarList } from "@/components/site/SiteVisuals";
import type { Hue } from "@/lib/design/hues";
import { useFormat } from "@/i18n/client";
import { INDIA_STATES } from "@/lib/constants/districts";

const FEEDBACK_TYPES = ["bug", "wrong_data", "suggestion", "district_request", "data_source", "translation", "praise", "other"];

/** How many districts the "most requested" picture lists. */
const TOP_REQUESTS = 5;

/** "state/district" keys of districts that are already live (their old votes are not shown). */
const LIVE_KEYS = new Set(
  INDIA_STATES.flatMap((s) => s.districts.filter((d) => d.active).map((d) => `${s.name}/${d.name}`.toLowerCase())),
);

// ── Shared field styles (tokens only) ────────────────────────────────
const FIELD: React.CSSProperties = {
  minHeight: 44,
  padding: "10px 12px",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  background: "var(--ftp-surface)",
  color: "var(--ftp-text)",
  fontSize: 15,
  lineHeight: 1.5,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const FIELD_LABEL: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 600,
  color: "var(--ftp-text-2)",
  display: "block",
  marginBottom: 4,
};
const HINT: React.CSSProperties = { margin: 0, fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" };

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
  const t = useTranslations("page_contribute");
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
        setError(t("errorFailed"));
      }
    } catch {
      setError(t("errorNetwork"));
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
          <h2 id="contribute-feedback-title" className="ftp-display" style={{ margin: 0, fontSize: 20, lineHeight: 1.35, fontWeight: 650, display: "flex", alignItems: "center", gap: 10 }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 34, height: 34, fontSize: 18, borderRadius: 11 }}>💬</span>
            {t("sheetTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeAria")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ftp-text-2)", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: -12 }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Chips
            label={t("typeLabel")}
            items={FEEDBACK_TYPES.map((value) => ({ value, label: t(`type_${value}`) }))}
            value={type}
            onChange={setType}
          />

          <input
            required maxLength={200}
            placeholder={t("subjectPlaceholder")}
            aria-label={t("subjectAria")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={FIELD}
          />

          <textarea
            required maxLength={2000}
            placeholder={t("messagePlaceholder")}
            aria-label={t("messageAria")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ ...FIELD, resize: "vertical" }}
          />

          {/* Two columns on wider sheets, stacked on phones */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <label htmlFor="ct-name" style={FIELD_LABEL}>{t("nameLabel")}</label>
              <input
                id="ct-name"
                maxLength={100} placeholder={t("namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ ...FIELD, width: "100%" }}
              />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label htmlFor="ct-email" style={FIELD_LABEL}>{t("emailLabel")}</label>
              <input
                id="ct-email"
                type="email" maxLength={200} placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...FIELD, width: "100%" }}
              />
            </div>
          </div>

          {name && email ? (
            <p style={{ ...HINT, color: "var(--ftp-live-text)", fontWeight: 600 }}>{t("hintBoth")}</p>
          ) : !email ? (
            <p style={HINT}>{t("hintNoEmail")}</p>
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
            {submitting ? t("sending") : t("send")}
          </button>
        </form>
      </div>
    </div>
  );
}

// Each way to help: an emoji, a hue, and either an in-page feedback action
// (feedbackType; the subject line is prefilled) or an external link (href).
// The title, sentence and action text come from "page_contribute".
const WAYS: {
  key: string;
  emoji: string;
  hue: Hue;
  hasAction: boolean;
  feedbackType?: string;
  href?: string;
}[] = [
  { key: "report", emoji: "🐞", hue: "rose", hasAction: true, feedbackType: "wrong_data" },
  { key: "request", emoji: "📍", hue: "yellow", hasAction: true, feedbackType: "district_request" },
  { key: "code", emoji: "💻", hue: "indigo", hasAction: true, href: "https://github.com/jayanthmb14/forthepeople" },
  { key: "translate", emoji: "🗣️", hue: "violet", hasAction: true, feedbackType: "translation" },
  { key: "source", emoji: "📊", hue: "sky", hasAction: true, feedbackType: "data_source" },
  { key: "share", emoji: "📣", hue: "orange", hasAction: false },
];

interface DistrictRequestRow {
  stateName: string;
  districtName: string;
  requestCount: number;
}

/** The picture: the districts citizens have asked for most. Nothing when there are no votes. */
function TopRequests({ locale }: { locale: string }) {
  const t = useTranslations("page_contribute");
  const { number } = useFormat();
  const { data } = useQuery<{ all: DistrictRequestRow[] }>({
    queryKey: ["district-requests", "all"],
    queryFn: () => fetch(`/api/district-request?all=1`).then((r) => r.json()),
    staleTime: 60_000,
  });
  const rows = [...(data?.all ?? [])]
    .filter((r) => r.requestCount > 0 && !LIVE_KEYS.has(`${r.stateName}/${r.districtName}`.toLowerCase()))
    .sort((a, b) => b.requestCount - a.requestCount)
    .slice(0, TOP_REQUESTS);
  if (rows.length < 2) return null;
  const top = rows[0];
  return (
    <div className="ftp-hue-yellow" style={{ marginBottom: 32 }}>
      <ChartCard
        title={t("reqTitle")}
        emoji="🗳️"
        units={t("reqUnits")}
        simple={t.rich("reqSimple", { name: top.districtName, n: top.requestCount, b: (c) => <strong>{c}</strong> })}
        source={{ label: t("reqSource") }}
        table={rows.map((r) => ({ label: `${r.districtName} (${r.stateName})`, value: number(r.requestCount) }))}
      >
        <BarList
          height={12}
          rows={rows.map((r, i) => ({
            key: `${r.stateName}-${r.districtName}`,
            label: (
              <>
                <span style={{ fontWeight: 600 }}>{r.districtName}</span>
                <span style={{ display: "block", fontSize: 12, lineHeight: 1.45, color: "var(--ftp-text-2)" }}>{r.stateName}</span>
              </>
            ),
            value: r.requestCount,
            display: t("reqVotes", { n: r.requestCount }),
            emoji: i === 0 ? "🏆" : "📍",
          }))}
        />
        <div style={{ marginTop: 14 }}>
          <Link href={`/${locale}/vote-district`} style={{ ...ACTION, background: "var(--hue-tint)" }}>
            <span className="ftp-emoji" aria-hidden>🗳️</span>
            {t("reqLink")}
          </Link>
        </div>
      </ChartCard>
    </div>
  );
}

export default function ContributePage() {
  const t = useTranslations("page_contribute");
  const locale = useLocale();
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
            title={t("title")}
            description={t("description")}
            backHref={`/${locale}`}
          />

          {successMsg && (
            <Card padding={14} role="status" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, borderColor: "color-mix(in srgb, var(--ftp-live) 40%, var(--ftp-border))" }}>
              <span className="ftp-emoji" aria-hidden style={{ fontSize: 20 }}>✅</span>
              <span className="ftp-body" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{t("thanks")}</span>
            </Card>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: 12, marginBottom: 32 }}>
            {WAYS.map((w) => (
              <div key={w.key} className={`ftp-hue-${w.hue}`}>
                <Card as="article" tinted padding={20} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 42, height: 42, fontSize: 21, borderRadius: 13 }}>
                    {w.emoji}
                  </span>
                  <h2 className="ftp-display" style={{ margin: "12px 0 0", fontSize: 18, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)" }}>
                    {t(`way_${w.key}_title`)}
                  </h2>
                  <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4, marginBottom: w.hasAction ? 14 : 0 }}>
                    {t(`way_${w.key}_desc`)}
                  </p>
                  {w.hasAction && w.feedbackType && (
                    <div style={{ marginTop: "auto" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setFeedbackOpen({
                            type: w.feedbackType!,
                            subject: t(`subject_${w.feedbackType}`),
                          })
                        }
                        style={ACTION}
                      >
                        {t(`way_${w.key}_action`)}
                      </button>
                    </div>
                  )}
                  {w.hasAction && w.href && (
                    <div style={{ marginTop: "auto" }}>
                      <a href={w.href} target="_blank" rel="noopener noreferrer" style={ACTION}>
                        {t(`way_${w.key}_action`)} <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>

          {/* The picture: what citizens have asked for most */}
          <TopRequests locale={locale} />

          <Card tinted padding={20} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 42, height: 42, fontSize: 21, borderRadius: 13 }}>
              🔓
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)" }}>
                {t("openTitle")}
              </h2>
              <p className="ftp-body" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", marginTop: 4 }}>{t("openBody")}</p>
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
