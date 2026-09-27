/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════════════════
//  /contribute — ways to help + the feedback sheet
//
//  The question it answers: "How can I help, today, in five minutes?"
//
//  Design v4.1 (green), docs/LAYOUT.md recipe inside <ModulePage> (full
//  width on phones and tablets, 1320 px on laptop / PC):
//    1. SiteHeader band
//    2. The answer in one sentence (Explainer)
//    3. One card per way to help (.ftp-grid: 1 / 2 / 3 across), each with
//       its own emoji and hue. The feedback actions open the shared
//       DetailSheet (a bottom sheet on phones and tablets, a right-hand
//       panel on laptop / PC) with the form inside; the Send button sits in
//       the sheet's footer so it is always in reach.
//    4. The picture — the most-requested districts (citizens' votes, from
//       /api/district-request, the same list the vote page uses), shown
//       only when there are votes — beside the open-source card.
//  The feedback request body and the success behaviour are unchanged.
//  Text: "page_contribute" messages. Metadata lives in the [locale] route
//  file (this is a client component).
// ═══════════════════════════════════════════════════════════════════════
import { useId, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, HeartHandshake } from "lucide-react";
import { Card, Chips, ModulePage } from "@/components/district/ui";
import { ChartCard, Explainer } from "@/components/district/visuals";
import { DetailSheet } from "@/components/district/DetailSheet";
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

/**
 * The feedback form inside the DetailSheet. The sheet's footer holds the
 * submit button (it points at this form through `form={formId}`).
 */
function FeedbackForm({
  formId,
  defaultType,
  defaultSubject,
  onSuccess,
  onSubmitting,
}: {
  formId: string;
  defaultType: string;
  defaultSubject: string;
  onSuccess: () => void;
  onSubmitting: (busy: boolean) => void;
}) {
  const t = useTranslations("page_contribute");
  const [type, setType] = useState(defaultType);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmitting(true);
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
    onSubmitting(false);
  }

  return (
    <form id={formId} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Chips
        label={t("typeLabel")}
        items={FEEDBACK_TYPES.map((value) => ({ value, label: t(`type_${value}`) }))}
        value={type}
        onChange={setType}
      />

      <input
        required
        maxLength={200}
        placeholder={t("subjectPlaceholder")}
        aria-label={t("subjectAria")}
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={FIELD}
      />

      <textarea
        required
        maxLength={2000}
        placeholder={t("messagePlaceholder")}
        aria-label={t("messageAria")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        style={{ ...FIELD, resize: "vertical" }}
      />

      {/* Two columns on wider sheets, stacked on phones */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 180px" }}>
          <label htmlFor={`${formId}-name`} style={FIELD_LABEL}>{t("nameLabel")}</label>
          <input
            id={`${formId}-name`}
            maxLength={100}
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={FIELD}
          />
        </div>
        <div style={{ flex: "1 1 180px" }}>
          <label htmlFor={`${formId}-email`} style={FIELD_LABEL}>{t("emailLabel")}</label>
          <input
            id={`${formId}-email`}
            type="email"
            maxLength={200}
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={FIELD}
          />
        </div>
      </div>

      {name && email ? (
        <p style={{ ...HINT, color: "var(--ftp-live-text)", fontWeight: 600 }}>{t("hintBoth")}</p>
      ) : !email ? (
        <p style={HINT}>{t("hintNoEmail")}</p>
      ) : null}

      {error && <p role="alert" style={{ ...HINT, fontSize: 13, color: "var(--ftp-danger)" }}>{error}</p>}
    </form>
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
    <div className="ftp-hue-yellow">
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
  const formId = useId();
  const [feedbackOpen, setFeedbackOpen] = useState<{
    type: string;
    subject: string;
    /** Changes on every open so the form starts empty each time. */
    n: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  return (
    <main className="ftp-hue-green" style={{ background: "var(--ftp-bg)", minHeight: "calc(100vh - 56px)" }}>
      <ModulePage>
        <SiteHeader
          emoji="🙌"
          icon={HeartHandshake}
          title={t("title")}
          description={t("description")}
          backHref={`/${locale}`}
        />

        <Explainer emoji="🙌">{t("simple", { n: WAYS.length })}</Explainer>

        {successMsg && (
          <Card padding={14} role="status" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, borderColor: "color-mix(in srgb, var(--ftp-live) 40%, var(--ftp-border))" }}>
            <span className="ftp-emoji" aria-hidden style={{ fontSize: 20 }}>✅</span>
            <span className="ftp-body" style={{ color: "var(--ftp-text)", fontWeight: 600 }}>{t("thanks")}</span>
          </Card>
        )}

        <div className="ftp-grid" style={{ gap: 12, marginBottom: 32, ["--ftp-grid-min" as string]: "300px" } as React.CSSProperties}>
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
                      aria-haspopup="dialog"
                      onClick={() =>
                        setFeedbackOpen((prev) => ({
                          type: w.feedbackType!,
                          subject: t(`subject_${w.feedbackType}`),
                          n: (prev?.n ?? 0) + 1,
                        }))
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

        {/* The picture (what citizens have asked for most) beside the open-source card */}
        {/* auto-fit (not auto-fill): with no picture yet, the card takes the full width */}
        <div style={{ display: "grid", gap: 16, alignItems: "start", gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))" }}>
          <TopRequests locale={locale} />
          <Card tinted padding={20} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span className="ftp-icon-chip ftp-emoji" aria-hidden style={{ width: 42, height: 42, fontSize: 21, borderRadius: 13 }}>
              🔓
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 className="ftp-display" style={{ margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 650, color: "var(--hue-deep)" }}>
                {t("openTitle")}
              </h2>
              <p className="ftp-body ftp-prose" style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ftp-text-2)", marginTop: 4 }}>{t("openBody")}</p>
            </div>
          </Card>
        </div>
      </ModulePage>

      {/* The feedback sheet: bottom sheet on phones / tablets, right panel on laptop / PC */}
      <DetailSheet
        open={!!feedbackOpen}
        onClose={() => setFeedbackOpen(null)}
        hueClassName="ftp-hue-green"
        emoji="💬"
        title={t("sheetTitle")}
        subtitle={t("sheetSub")}
        footer={
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="ftp-btn ftp-btn-primary"
            style={{
              flex: 1,
              minHeight: 48,
              color: "#fff",
              border: "1px solid var(--hue)",
              borderRadius: "var(--ftp-radius-tile)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? t("sending") : t("send")}
          </button>
        }
      >
        {feedbackOpen && (
          <FeedbackForm
            key={feedbackOpen.n}
            formId={formId}
            defaultType={feedbackOpen.type}
            defaultSubject={feedbackOpen.subject}
            onSubmitting={setSubmitting}
            onSuccess={() => {
              setFeedbackOpen(null);
              setSuccessMsg(true);
              setTimeout(() => setSuccessMsg(false), 5000);
            }}
          />
        )}
      </DetailSheet>
    </main>
  );
}
