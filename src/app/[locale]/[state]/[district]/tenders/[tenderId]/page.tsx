/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender detail page — the shareable full page for one tender (the list
// page shows the same facts in a DetailSheet). Recipe (docs/LAYOUT.md):
//   ModulePage → PageHeader (title = tender title, source pill → portal) →
//   Explainer (who wants what, worth how much, closing when) → 4 tiles
//   (value, EMD, fee, time left) → the picture: a CountdownBar from
//   "published" to "last date to bid" → status tags + actions → timeline
//   → factual indicators → plain words → full summary → "Can I apply?" →
//   changes issued (cards, no sideways table) → award → documents → full
//   legal disclaimer → sources.
// Data: GET /api/tenders/<district>/<id>. Red-flag logic and every legal
// sentence are unchanged. Words live in "page_tenders"; the tender's own
// text (title, AI summary, corrigendum summaries, winner names) stays as
// published.

"use client";

import type React from "react";
import { use } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Clock, ExternalLink, Gavel, LockKeyhole, Receipt, Share2, Wallet } from "lucide-react";
import {
  ModulePage,
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  AsOfText,
  LoadingShell,
  ErrorBlock,
  formatIST,
  type Tone,
} from "@/components/district/ui";
import { CountdownBar, Explainer } from "@/components/district/visuals";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import CountdownTimer from "@/components/tenders/CountdownTimer";
import RedFlagBadge from "@/components/tenders/RedFlagBadge";
import TenderGanttTimeline from "@/components/tenders/TenderGanttTimeline";
import EligibilityWizard from "@/components/tenders/EligibilityWizard";
import { useTenderStatus } from "@/components/tenders/TenderCard";
import MoneyToolbar from "@/components/money/MoneyToolbar";
import { useMoney } from "@/components/money/useMoney";
import { HueTag, TagRow, safeUrl } from "@/components/money/TapCard";
import type { TenderDetail } from "@/components/money/tender-types";
import { useFormat, useModuleText } from "@/i18n/client";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

/** Emphasis inside body text (weight 500, never bold 700). */
const STRONG: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };
const s = (c: React.ReactNode) => <strong style={STRONG}>{c}</strong>;
const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;
const b = (c: React.ReactNode) => <strong>{c}</strong>;

export default function TenderDetailPage({ params }: { params: Promise<{ locale: string; state: string; district: string; tenderId: string }> }) {
  const { locale, state: stateSlug, district: districtSlug, tenderId } = use(params);
  const t = useTranslations("page_tenders");
  const mt = useModuleText();
  const f = useFormat();
  const m = useMoney();
  const statusOf = useTenderStatus();

  const { data, isLoading, error } = useQuery<TenderDetail>({
    queryKey: ["tender-detail", districtSlug, tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/${tenderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const backHref = `/${locale}/${stateSlug}/${districtSlug}/tenders`;
  const shortDate = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });

  if (isLoading) return <ModulePage><LoadingShell rows={4} /></ModulePage>;
  if (error || !data) return <ModulePage><ErrorBlock message={t("detail.loadError")} /></ModulePage>;
  const td = data.tender;

  const place = td.locationTaluk ? `${td.locationTaluk}, ${td.locationDistrict}` : td.locationDistrict;
  const sourceUrl = safeUrl(td.sourceUrl);
  // Built on click (window.location only exists in the browser).
  const shareText = () =>
    t("detail.shareText", {
      title: td.title,
      value: m.short(td.estimatedValueInr),
      date: shortDate(td.bidSubmissionEnd),
      url: `${window.location.origin}/${locale}/${stateSlug}/${districtSlug}/tenders/${td.id}`,
    });
  const status = statusOf(td.status);
  const urgency = heroUrgency(td.bidSubmissionEnd);
  const value = m.short(td.estimatedValueInr);

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <ModulePage>
        <PageHeader
          icon={Gavel}
          title={td.title}
          description={t("detail.byline", { authority: td.authority.name, place })}
          backHref={backHref}
          backLabel={t("backToTenders")}
          source={{ label: td.sourcePortal, href: sourceUrl ?? undefined }}
          actions={
            <span style={{ display: "inline-flex", alignItems: "center", minHeight: 24, padding: "2px 10px", borderRadius: 999, background: "rgba(255,255,255,0.92)" }}>
              <AsOfText asOf={td.publishedAt} prefix="Published" />
            </span>
          }
        />

        {/* 1. The answer in one sentence. */}
        <Explainer>
          {t.rich("detail.explainer", {
            authority: td.authority.name,
            hasValue: value !== "—" ? "yes" : "no",
            value,
            closed: urgency.key === "passed" ? "yes" : "no",
            date: shortDate(td.bidSubmissionEnd),
            b,
          })}
        </Explainer>

        {/* 2. Four big numbers. */}
        <StatStrip cols={4}>
          <StatTile icon={Wallet} label={t("detail.tiles.value")} value={value} countUp={false} />
          <StatTile
            icon={LockKeyhole}
            label={t("detail.tiles.emd")}
            value={td.emdAmountInr ? m.short(td.emdAmountInr) : td.mseReserved || td.startupExempt ? t("detail.tiles.exempt") : "—"}
            countUp={false}
          />
          <StatTile icon={Receipt} label={t("detail.tiles.fee")} value={m.short(td.tenderFeeInr)} countUp={false} />
          {/* The countdown ticks, so it is composed here instead of StatTile. */}
          <div style={{ background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)", border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))", borderRadius: "var(--ftp-radius-tile)", padding: "14px 16px", minWidth: 0 }}>
            <div className="ftp-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              {t("detail.tiles.closesIn")}
            </div>
            <CountdownTimer deadline={td.bidSubmissionEnd} />
            <div style={{ marginTop: 8 }}>
              <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{formatIST(td.bidSubmissionEnd, f.intl)}</span>
            </div>
          </div>
        </StatStrip>

        {/* 3. The picture: how much of the bidding window has gone. */}
        <Card tinted padding={16} style={{ marginTop: 16 }}>
          <CountdownBar
            start={td.publishedAt}
            target={td.bidSubmissionEnd}
            label={t("sheet.lastDate", { date: formatIST(td.bidSubmissionEnd, f.intl) ?? shortDate(td.bidSubmissionEnd) })}
            sub={t("sheet.publishedOn", { date: shortDate(td.publishedAt) })}
          />
        </Card>

        <div style={{ marginTop: 16 }}>
          <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        {/* Tags + actions. The deadline urgency is the dot on the clock pill. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 8 }}>
          <TagRow>
            <HueTag>{td.authority.shortCode}</HueTag>
            {td.category && <HueTag outline>{td.category.name}</HueTag>}
            <Pill tone={status.tone}>{status.label}</Pill>
            {td.mseReserved && <HueTag>{t("tag.mse")}</HueTag>}
            {td.startupExempt && <HueTag outline>{t("tag.startup")}</HueTag>}
            <Pill tone={urgency.tone} dot icon={Clock}>{t(`detail.urgency.${urgency.key}`)}</Pill>
          </TagRow>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="ftp-btn ftp-btn-primary" style={primaryBtn}>
                <ExternalLink size={14} aria-hidden /> {t("detail.viewSource")}
              </a>
            )}
            <button
              type="button"
              onClick={() => (navigator.share ? navigator.share({ title: td.title, text: shareText() }) : navigator.clipboard.writeText(shareText()))}
              className="ftp-btn ftp-btn-secondary"
              style={linkBtn}
            >
              <Share2 size={14} aria-hidden /> {t("detail.share")}
            </button>
            {/* TODO: Replace with DPDP-compliant email collection + double
                opt-in + unsubscribe (future v2). For now a mailto opens the
                user's email client pre-filled with tender context. The email
                itself stays in English because the support desk reads it. */}
            <a
              href={`mailto:support@forthepeople.in?subject=${encodeURIComponent(`Alert me for Tender ${td.id}`)}&body=${encodeURIComponent(`Please notify me of updates on this tender.\n\nTender: ${td.title}\nSource portal: ${td.sourcePortal}\nSource URL: ${td.sourceUrl}\nInternal ID: ${td.id}\n\nMy email: (sending from this address is sufficient)`)}`}
              className="ftp-btn ftp-btn-secondary"
              style={linkBtn}
            >
              <Bookmark size={14} aria-hidden /> {t("detail.alert")}
            </a>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ margin: "20px 0 0" }}>
          <TenderGanttTimeline events={data.timeline} />
        </div>

        {/* Factual indicators */}
        {td.redFlags.length > 0 && (
          <Section title={t("detail.flagsTitle")}>
            <p className="ftp-body ftp-prose" style={{ color: "var(--ftp-text-2)", marginBottom: 10 }}>{t("detail.flagsIntro")}</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {td.redFlags.map((fl) => (
                <li key={fl.flagType} className="ftp-body">
                  <RedFlagBadge flagType={fl.flagType} factualStatement={fl.factualStatement} referenceRule={fl.referenceRule} />{" "}
                  <span>{fl.factualStatement}</span>
                  {fl.referenceRule && <span style={{ color: "var(--ftp-text-2)" }}> ({fl.referenceRule})</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Plain words + the full summary side by side on wide screens. */}
        <div className="ftp-grid" style={{ marginTop: 8, alignItems: "start", ["--ftp-grid-min" as string]: "340px" } as React.CSSProperties}>
          <Section title={t("detail.plainTitle")}>
            {td.aiSummary?.plainBullets && (td.aiSummary.plainBullets.what || td.aiSummary.plainBullets.whoCanApply || td.aiSummary.plainBullets.deadline) ? (
              <Card tinted>
                <ul className="ftp-body" style={{ margin: 0, paddingInlineStart: 18, fontSize: 14, lineHeight: "22px" }}>
                  {td.aiSummary.plainBullets.what && <li>{t.rich("detail.what", { text: td.aiSummary.plainBullets.what, s })}</li>}
                  {td.aiSummary.plainBullets.whoCanApply && <li>{t.rich("detail.who", { text: td.aiSummary.plainBullets.whoCanApply, s })}</li>}
                  {td.aiSummary.plainBullets.deadline && <li>{t.rich("detail.deadline", { text: td.aiSummary.plainBullets.deadline, s })}</li>}
                </ul>
              </Card>
            ) : (
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("detail.plainPending")}</p>
            )}
          </Section>

          {td.aiSummary?.plainEnglishSummary ? (
            <Section title={t("detail.fullTitle")}>
              <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
                {t.rich("detail.fullNote", { model: td.aiSummary.aiModel, time: formatIST(td.aiSummary.generatedAt, f.intl) ?? "", num })}
              </div>
              <p className="ftp-body ftp-prose" lang="en" style={{ fontSize: 14, lineHeight: "22px", whiteSpace: "pre-wrap" }}>
                {td.aiSummary.plainEnglishSummary}
              </p>
            </Section>
          ) : null}
        </div>

        {/* Can I apply? */}
        <Section title={t("detail.canApply")}>
          <EligibilityWizard eligibility={td.eligibility} tenderMseReserved={td.mseReserved} tenderStartupExempt={td.startupExempt} />
        </Section>

        {/* Changes issued — cards, so nothing scrolls sideways on a phone. */}
        {td.corrigenda.length > 0 && (
          <Section title={t("detail.corrigendaTitle")}>
            <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
              {td.corrigenda.map((c) => (
                <Card key={c.id} padding={14}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <HueTag>#{c.sequenceNo}</HueTag>
                    <span className="ftp-num" style={{ fontSize: 12, color: "var(--ftp-text-2)" }}>{shortDate(c.issuedAt)}</span>
                  </div>
                  <div className="ftp-title">{t.has(`changeType.${c.changeType}`) ? t(`changeType.${c.changeType}`) : c.changeType.replace(/_/g, " ")}</div>
                  {c.summaryPlain && <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginTop: 4 }}>{c.summaryPlain}</p>}
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Award + Contract */}
        {td.awards.length > 0 && (
          <Section title={t("detail.awardTitle")}>
            <div className="ftp-grid" style={{ ["--ftp-grid-min" as string]: "260px" } as React.CSSProperties}>
              {td.awards.map((a) => (
                <Card key={a.id} padding={14}>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.winner")}</span> {a.winnerName}</div>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.awarded")}</span> <span className="ftp-num">{m.short(a.awardedAmountInr)}</span></div>
                  {a.priceHitRatePct !== null && (
                    <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.ofEstimate")}</span> <span className="ftp-num">{f.number(a.priceHitRatePct, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span></div>
                  )}
                  <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>{t.rich("detail.awardedOn", { date: shortDate(a.awardedAt), num })}</div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Documents */}
        {td.documents.length > 0 && (
          <Section title={t("detail.documents")}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
              {td.documents.map((d) => {
                const url = safeUrl(d.sourceUrl);
                return (
                  <li key={d.id}>
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}>
                        <ExternalLink size={14} aria-hidden /> {d.displayName} ({d.docType})
                      </a>
                    ) : (
                      <span className="ftp-body">{d.displayName} ({d.docType})</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <MoneyToolbar shareTitle={mt.label("tenders")} />
      </ModulePage>
    </ModuleErrorBoundary>
  );
}

/** Deadline urgency — the same thresholds as the list cards. */
function heroUrgency(deadlineIso: string): { tone: Tone; key: "passed" | "within48" | "within7" | "more7" } {
  const msLeft = new Date(deadlineIso).getTime() - Date.now();
  const daysLeft = msLeft / 86400_000;
  if (msLeft <= 0) return { tone: "neutral", key: "passed" };
  if (daysLeft < 2) return { tone: "danger", key: "within48" };
  if (daysLeft < 7) return { tone: "warn", key: "within7" };
  return { tone: "live", key: "more7" };
}

/** Action button/link — 44 px tall, bordered surface. */
const linkBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 14px",
  background: "var(--ftp-surface)",
  border: "1px solid var(--ftp-border)",
  borderRadius: "var(--ftp-radius-tile)",
  color: "var(--ftp-text)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
  fontFamily: "var(--ftp-font-sans)",
};

/** The one loud action (view on the portal): colours from .ftp-btn-primary (the page hue). */
const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minHeight: 44,
  padding: "0 14px",
  borderWidth: 1,
  borderStyle: "solid",
  borderRadius: "var(--ftp-radius-tile)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  fontFamily: "var(--ftp-font-sans)",
};
