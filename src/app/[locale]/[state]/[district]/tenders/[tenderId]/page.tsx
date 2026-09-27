/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender detail page — module template:
//   PageHeader (title = tender title, source pill → portal) → compact
//   disclaimer → status pills + actions → StatStrip (value, EMD, fee,
//   countdown) → timeline → factual indicators → plain-words summary →
//   eligibility wizard → corrigenda → award → documents → full legal
//   disclaimer → sources. Data: GET /api/tenders/<district>/<id>.
// Red-flag logic and every legal sentence are unchanged. Words live in
// "page_tenders"; the tender's own text (title, AI summary, corrigendum
// summaries, winner names) stays as published.

"use client";

import type React from "react";
import { use } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Gavel, ExternalLink, Share2, Bookmark, Clock } from "lucide-react";
import {
  PageHeader,
  StatStrip,
  StatTile,
  Section,
  Card,
  Pill,
  AsOfText,
  DataTable,
  LoadingShell,
  ErrorBlock,
  formatIST,
  type Tone,
} from "@/components/district/ui";
import TenderDisclaimer from "@/components/tenders/TenderDisclaimer";
import CountdownTimer from "@/components/tenders/CountdownTimer";
import RedFlagBadge from "@/components/tenders/RedFlagBadge";
import TenderGanttTimeline, { type TimelineEvent } from "@/components/tenders/TenderGanttTimeline";
import EligibilityWizard from "@/components/tenders/EligibilityWizard";
import { useTenderStatus } from "@/components/tenders/TenderCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { useMoney } from "@/components/money/useMoney";
import { useFormat, useModuleText } from "@/i18n/client";
import { getModuleAccent } from "@/lib/constants/sidebar-modules";
import ModuleErrorBoundary from "@/components/common/ModuleErrorBoundary";

type TenderDetail = {
  tender: {
    id: string;
    sourcePortal: string;
    sourceUrl: string;
    title: string;
    description: string | null;
    workType: string;
    procurementType: string;
    authority: { name: string; shortCode: string; authorityType: string; websiteUrl: string | null };
    category: { name: string; slug: string } | null;
    estimatedValueInr: string | null;
    tenderFeeInr: string | null;
    emdAmountInr: string | null;
    performanceSecurityPct: number | null;
    publishedAt: string;
    bidSubmissionEnd: string;
    preBidMeetingAt: string | null;
    technicalOpeningAt: string | null;
    financialOpeningAt: string | null;
    numberOfCovers: number | null;
    status: string;
    locationDistrict: string;
    locationTaluk: string | null;
    mseReserved: boolean;
    startupExempt: boolean;
    eligibility: {
      minAnnualTurnoverInr?: number | null;
      yearsRequired?: number | null;
      similarWorkExp?: string | null;
      registrationTypes?: string[];
      locationRestrictions?: string | null;
    } | null;
    corrigenda: Array<{ id: string; sequenceNo: number; issuedAt: string; changeType: string; summaryPlain: string | null }>;
    awards: Array<{ id: string; winnerName: string; awardedAmountInr: string; priceHitRatePct: number | null; awardedAt: string }>;
    bidders: Array<{ id: string; displayLabel: string; rank: number | null; status: string }>;
    contract: { contractValueInr: string; contractPeriodDays: number | null; implementationStatus: string; expectedCompletionAt: string | null } | null;
    documents: Array<{ id: string; docType: string; displayName: string; sourceUrl: string }>;
    redFlags: Array<{ flagType: string; factualStatement: string; referenceRule: string | null }>;
    aiSummary: {
      plainEnglishSummary: string;
      generatedAt: string;
      aiModel: string;
      documentChecklist: unknown;
      plainBullets: { what?: string; whoCanApply?: string; deadline?: string } | null;
    } | null;
  };
  timeline: TimelineEvent[];
};


/** Page wrapper: the container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" };

/** Emphasis inside body text (weight 500, never bold 700). */
const STRONG: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };
const s = (c: React.ReactNode) => <strong style={STRONG}>{c}</strong>;
const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

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

  if (isLoading) return <div className="ftp-container" style={PAGE_STYLE}><LoadingShell rows={4} /></div>;
  if (error || !data) return <div className="ftp-container" style={PAGE_STYLE}><ErrorBlock message={t("detail.loadError")} /></div>;
  const td = data.tender;

  const place = td.locationTaluk ? `${td.locationTaluk}, ${td.locationDistrict}` : td.locationDistrict;
  const shareText = t("detail.shareText", {
    title: td.title,
    value: m.short(td.estimatedValueInr),
    date: shortDate(td.bidSubmissionEnd),
    url: `${location.origin}/${locale}/${stateSlug}/${districtSlug}/tenders/${td.id}`,
  });
  const status = statusOf(td.status);
  const urgency = heroUrgency(td.bidSubmissionEnd);

  return (
    <ModuleErrorBoundary moduleName={mt.label("tenders")}>
      <div className="ftp-container" style={PAGE_STYLE}>
        <PageHeader
          icon={Gavel}
          title={td.title}
          description={t("detail.byline", { authority: td.authority.name, place })}
          backHref={backHref}
          backLabel={t("backToTenders")}
          accent={getModuleAccent("tenders")}
          source={{ label: td.sourcePortal, href: td.sourceUrl }}
          actions={<AsOfText asOf={td.publishedAt} prefix="Published" />}
        />

        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Status pills. The deadline urgency (green >7d, amber 2–7d, red <48h,
            grey past) is the dot on the deadline pill — no stripe, no pulse. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <Pill tone="brand">{td.authority.shortCode}</Pill>
          {td.category && <Pill>{td.category.name}</Pill>}
          <Pill tone={status.tone}>{status.label}</Pill>
          {td.mseReserved && <Pill tone="live">{t("tag.mse")}</Pill>}
          {td.startupExempt && <Pill tone="brand">{t("tag.startup")}</Pill>}
          <Pill tone={urgency.tone} dot icon={Clock}>{t(`detail.urgency.${urgency.key}`)}</Pill>
        </div>

        {/* Actions — 44 px tall so they are easy to tap on phones. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <a href={td.sourceUrl} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkBtn}>
            <ExternalLink size={14} aria-hidden /> {t("detail.viewSource")}
          </a>
          <button type="button" onClick={() => navigator.share ? navigator.share({ title: td.title, text: shareText }) : navigator.clipboard.writeText(shareText)} className="ftp-btn-secondary" style={linkBtn}>
            <Share2 size={14} aria-hidden /> {t("detail.share")}
          </button>
          {/* TODO: Replace with DPDP-compliant email collection + double
              opt-in + unsubscribe (future v2). For now a mailto opens the
              user's email client pre-filled with tender context — support@
              triages and replies when v2 alert infra is live. The email
              itself stays in English because the support desk reads it. */}
          <a
            href={`mailto:support@forthepeople.in?subject=${encodeURIComponent(`Alert me for Tender ${td.id}`)}&body=${encodeURIComponent(`Please notify me of updates on this tender.\n\nTender: ${td.title}\nSource portal: ${td.sourcePortal}\nSource URL: ${td.sourceUrl}\nInternal ID: ${td.id}\n\nMy email: (sending from this address is sufficient)`)}`}
            className="ftp-btn-secondary"
            style={linkBtn}
          >
            <Bookmark size={14} aria-hidden /> {t("detail.alert")}
          </a>
        </div>

        {/* At-a-glance tiles */}
        <StatStrip cols={4}>
          <StatTile emoji="💰" label={t("detail.tiles.value")} value={m.short(td.estimatedValueInr)} />
          <StatTile
            emoji="🔐"
            label={t("detail.tiles.emd")}
            value={td.emdAmountInr ? m.short(td.emdAmountInr) : (td.mseReserved || td.startupExempt ? t("detail.tiles.exempt") : "—")}
          />
          <StatTile emoji="🧾" label={t("detail.tiles.fee")} value={m.short(td.tenderFeeInr)} />
          {/* The countdown ticks, so it is composed here instead of StatTile. */}
          <div style={{ background: "linear-gradient(135deg, var(--hue-tint) 0%, #fff 90%)", border: "1px solid color-mix(in srgb, var(--hue) 22%, var(--ftp-border))", borderRadius: "var(--ftp-radius-tile)", padding: "14px 16px", minWidth: 0 }}>
            <div className="ftp-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span className="ftp-emoji" aria-hidden>⏰</span>{t("detail.tiles.closesIn")}
            </div>
            <CountdownTimer deadline={td.bidSubmissionEnd} />
            <div style={{ marginTop: 8 }}>
              <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{formatIST(td.bidSubmissionEnd, f.intl)}</span>
            </div>
          </div>
        </StatStrip>

        {/* Timeline */}
        <div style={{ margin: "24px 0 0" }}>
          <TenderGanttTimeline events={data.timeline} />
        </div>

        {/* Red flags */}
        {td.redFlags.length > 0 && (
          <Section title={t("detail.flagsTitle")} emoji="🚩">
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 10 }}>
              {t("detail.flagsIntro")}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {td.redFlags.map((fl) => (
                <RedFlagBadge key={fl.flagType} flagType={fl.flagType} factualStatement={fl.factualStatement} referenceRule={fl.referenceRule} />
              ))}
            </div>
          </Section>
        )}

        {/* In Plain Words — 3-bullet summary for citizens. Shown above
            the full paragraph summary when available. Falls back to a
            placeholder when the enrichment cron hasn't run yet. */}
        <Section title={t("detail.plainTitle")} emoji="💬">
          {td.aiSummary?.plainBullets &&
           (td.aiSummary.plainBullets.what ||
            td.aiSummary.plainBullets.whoCanApply ||
            td.aiSummary.plainBullets.deadline) ? (
            <Card tinted>
              <ul className="ftp-body" style={{ margin: 0, paddingLeft: 18, lineHeight: "22px" }}>
                {td.aiSummary.plainBullets.what && (
                  <li>{t.rich("detail.what", { text: td.aiSummary.plainBullets.what, s })}</li>
                )}
                {td.aiSummary.plainBullets.whoCanApply && (
                  <li>{t.rich("detail.who", { text: td.aiSummary.plainBullets.whoCanApply, s })}</li>
                )}
                {td.aiSummary.plainBullets.deadline && (
                  <li>{t.rich("detail.deadline", { text: td.aiSummary.plainBullets.deadline, s })}</li>
                )}
              </ul>
            </Card>
          ) : (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("detail.plainPending")}</p>
          )}
        </Section>

        {/* Full AI summary (paragraph form) — kept below the bullets for
            readers who want the narrative. */}
        {td.aiSummary?.plainEnglishSummary ? (
          <Section title={t("detail.fullTitle")} emoji="📝">
            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
              {t.rich("detail.fullNote", { model: td.aiSummary.aiModel, time: formatIST(td.aiSummary.generatedAt, f.intl) ?? "", num })}
            </div>
            <p className="ftp-body" style={{ fontSize: 13, lineHeight: "22px", whiteSpace: "pre-wrap" }}>{td.aiSummary.plainEnglishSummary}</p>
          </Section>
        ) : null}

        {/* Eligibility wizard */}
        <Section title={t("detail.canApply")} emoji="✅">
          <EligibilityWizard eligibility={td.eligibility} tenderMseReserved={td.mseReserved} tenderStartupExempt={td.startupExempt} />
        </Section>

        {/* Corrigenda */}
        {td.corrigenda.length > 0 && (
          <Section title={t("detail.corrigendaTitle")} emoji="✏️">
            <DataTable
              dense
              caption={t("detail.corrigendaCaption")}
              columns={[
                { key: "no", label: "#", mono: true, align: "left", width: 48 },
                { key: "date", label: t("detail.corrigendaIssued"), mono: true, align: "left" },
                { key: "change", label: t("detail.corrigendaChange") },
                { key: "summary", label: t("detail.corrigendaSummary") },
              ]}
              rows={td.corrigenda.map((c) => ({
                no: `#${c.sequenceNo}`,
                date: shortDate(c.issuedAt),
                change: t.has(`changeType.${c.changeType}`) ? t(`changeType.${c.changeType}`) : c.changeType.replace(/_/g, " "),
                summary: c.summaryPlain ?? "—",
              }))}
            />
          </Section>
        )}

        {/* Award + Contract */}
        {td.awards.length > 0 && (
          <Section title={t("detail.awardTitle")} emoji="🏆">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {td.awards.map((a) => (
                <Card key={a.id} padding={14}>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.winner")}</span> {a.winnerName}</div>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.awarded")}</span> <span className="ftp-num">{m.short(a.awardedAmountInr)}</span></div>
                  {a.priceHitRatePct !== null && (
                    <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>{t("detail.ofEstimate")}</span> <span className="ftp-num">{f.number(a.priceHitRatePct, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</span></div>
                  )}
                  <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
                    {t.rich("detail.awardedOn", { date: shortDate(a.awardedAt), num })}
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Documents */}
        {td.documents.length > 0 && (
          <Section title={t("detail.documents")} emoji="📂">
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
              {td.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--hue-deep)", textDecoration: "none" }}
                  >
                    <ExternalLink size={12} aria-hidden /> {d.displayName} ({d.docType})
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <div style={{ marginTop: 32 }}>
          <TenderDisclaimer variant="full" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />
        </div>

        <ModulePageFooter
          moduleSlug="tenders"
          locale={locale}
          state={stateSlug}
          district={districtSlug}
          showCompare={false}
          extraSources={[{ name: t("detail.noticeSource", { portal: td.sourcePortal }), url: td.sourceUrl }]}
        />
      </div>
    </ModuleErrorBoundary>
  );
}

/** Shared urgency logic — mirrors deadlineUrgency() in TenderCard so the
 *  card view and the detail hero use identical thresholds. */
function heroUrgency(deadlineIso: string): { tone: Tone; key: "passed" | "within48" | "within7" | "more7" } {
  const msLeft = new Date(deadlineIso).getTime() - Date.now();
  const daysLeft = msLeft / 86400_000;
  if (msLeft <= 0) return { tone: "neutral", key: "passed" };
  if (daysLeft < 2) return { tone: "danger", key: "within48" };
  if (daysLeft < 7) return { tone: "warn", key: "within7" };
  return { tone: "live", key: "more7" };
}

/** Secondary action button/link — 44 px tall, bordered surface. */
const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 14px",
  background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)",
  color: "var(--ftp-text)", fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none",
  fontFamily: "var(--ftp-font-sans)",
};
