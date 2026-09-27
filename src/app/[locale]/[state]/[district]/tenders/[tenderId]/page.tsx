/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Tender detail page — Design v3 "Civic Ledger" module template:
//   PageHeader (title = tender title, source pill → portal) → compact
//   disclaimer → status pills + actions → StatStrip (value, EMD, fee,
//   countdown) → timeline → factual indicators → plain-words summary →
//   eligibility wizard → corrigenda → award → documents → full legal
//   disclaimer → sources. Data: GET /api/tenders/<district>/<id>.
// Red-flag logic and every legal sentence are unchanged.

"use client";

import type React from "react";
import { use } from "react";
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
import { STATUS_STYLE } from "@/components/tenders/TenderCard";
import ModulePageFooter from "@/components/accountability/ModulePageFooter";
import { formatInr } from "@/lib/tenders/format";
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


/** Page wrapper: the v3 container (24 px sides, 16 on phones) at reading width. */
const PAGE_STYLE: React.CSSProperties = { paddingTop: 24, paddingBottom: 48, maxWidth: "var(--ftp-reading-max)" };

/** "12 Sep 2026" in IST — used for short dates in lists. */
function shortDateIST(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export default function TenderDetailPage({ params }: { params: Promise<{ locale: string; state: string; district: string; tenderId: string }> }) {
  const { locale, state: stateSlug, district: districtSlug, tenderId } = use(params);

  const { data, isLoading, error } = useQuery<TenderDetail>({
    queryKey: ["tender-detail", districtSlug, tenderId],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/${tenderId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  const backHref = `/${locale}/${stateSlug}/${districtSlug}/tenders`;

  if (isLoading) return <div className="ftp-container" style={PAGE_STYLE}><LoadingShell rows={4} /></div>;
  if (error || !data) return <div className="ftp-container" style={PAGE_STYLE}><ErrorBlock message="Couldn't load this tender." /></div>;
  const t = data.tender;

  const shareText = `${t.title} — ${formatInr(t.estimatedValueInr)} · closes ${new Date(t.bidSubmissionEnd).toLocaleDateString("en-IN")} · ${location.origin}/${locale}/${stateSlug}/${districtSlug}/tenders/${t.id}`;
  const status = STATUS_STYLE[t.status] ?? { tone: "neutral" as Tone, label: t.status };
  const urgency = heroUrgency(t.bidSubmissionEnd);

  return (
    <ModuleErrorBoundary moduleName="TenderDetail">
      <div className="ftp-container" style={PAGE_STYLE}>
        <PageHeader
          icon={Gavel}
          title={t.title}
          description={`${t.authority.name} · ${t.locationTaluk ? `${t.locationTaluk}, ` : ""}${t.locationDistrict}`}
          backHref={backHref}
          backLabel="Back to tenders"
          accent={getModuleAccent("tenders")}
          source={{ label: t.sourcePortal, href: t.sourceUrl }}
          actions={<AsOfText asOf={t.publishedAt} prefix="Published" />}
        />

        <TenderDisclaimer variant="compact" locale={locale} stateSlug={stateSlug} districtSlug={districtSlug} />

        {/* Status pills. The deadline urgency (green >7d, amber 2–7d, red <48h,
            grey past) is the dot on the deadline pill — no stripe, no pulse. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <Pill tone="brand">{t.authority.shortCode}</Pill>
          {t.category && <Pill>{t.category.name}</Pill>}
          <Pill tone={status.tone}>{status.label}</Pill>
          {t.mseReserved && <Pill tone="live">MSE-reserved</Pill>}
          {t.startupExempt && <Pill tone="brand">Startup-eligible</Pill>}
          <Pill tone={urgency.tone} dot icon={Clock}>{urgency.label}</Pill>
        </div>

        {/* Actions — 44 px tall so they are easy to tap on phones. */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="ftp-btn-secondary" style={linkBtn}>
            <ExternalLink size={14} aria-hidden /> View on source portal
          </a>
          <button type="button" onClick={() => navigator.share ? navigator.share({ title: t.title, text: shareText }) : navigator.clipboard.writeText(shareText)} className="ftp-btn-secondary" style={linkBtn}>
            <Share2 size={14} aria-hidden /> Share on WhatsApp
          </button>
          {/* TODO: Replace with DPDP-compliant email collection + double
              opt-in + unsubscribe (future v2). For now a mailto opens the
              user's email client pre-filled with tender context — support@
              triages and replies when v2 alert infra is live. */}
          <a
            href={`mailto:support@forthepeople.in?subject=${encodeURIComponent(`Alert me for Tender ${t.id}`)}&body=${encodeURIComponent(`Please notify me of updates on this tender.\n\nTender: ${t.title}\nSource portal: ${t.sourcePortal}\nSource URL: ${t.sourceUrl}\nInternal ID: ${t.id}\n\nMy email: (sending from this address is sufficient)`)}`}
            className="ftp-btn-secondary"
            style={linkBtn}
          >
            <Bookmark size={14} aria-hidden /> Save & alert me
          </a>
        </div>

        {/* At-a-glance tiles */}
        <StatStrip cols={4}>
          <StatTile label="Estimated value" value={formatInr(t.estimatedValueInr)} />
          <StatTile label="EMD" value={t.emdAmountInr ? formatInr(t.emdAmountInr) : (t.mseReserved || t.startupExempt ? "Exempt" : "—")} />
          <StatTile label="Tender fee" value={formatInr(t.tenderFeeInr)} />
          {/* The countdown ticks, so it is composed here instead of StatTile. */}
          <div style={{ background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)", padding: "14px 16px", minWidth: 0 }}>
            <div className="ftp-label" style={{ marginBottom: 6 }}>Closes in</div>
            <CountdownTimer deadline={t.bidSubmissionEnd} />
            <div style={{ marginTop: 8 }}>
              <span className="ftp-num" style={{ fontSize: 11, color: "var(--ftp-text-2)" }}>{formatIST(t.bidSubmissionEnd)}</span>
            </div>
          </div>
        </StatStrip>

        {/* Timeline */}
        <div style={{ margin: "24px 0 0" }}>
          <TenderGanttTimeline events={data.timeline} />
        </div>

        {/* Red flags */}
        {t.redFlags.length > 0 && (
          <Section title="Factual indicators">
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 10 }}>
              Data-derived factual observations, compared against public rules such as GFR 2017 / KTPPA 1999 / CVC guidelines. These are not allegations — legitimate reasons may exist in any individual case.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {t.redFlags.map((f) => (
                <RedFlagBadge key={f.flagType} flagType={f.flagType} factualStatement={f.factualStatement} referenceRule={f.referenceRule} />
              ))}
            </div>
          </Section>
        )}

        {/* In Plain Words — 3-bullet summary for citizens. Shown above
            the full paragraph summary when available. Falls back to a
            placeholder when the enrichment cron hasn't run yet. */}
        <Section title="In plain words">
          {t.aiSummary?.plainBullets &&
           (t.aiSummary.plainBullets.what ||
            t.aiSummary.plainBullets.whoCanApply ||
            t.aiSummary.plainBullets.deadline) ? (
            <Card>
              <ul className="ftp-body" style={{ margin: 0, paddingLeft: 18, lineHeight: "22px" }}>
                {t.aiSummary.plainBullets.what && (
                  <li><strong style={STRONG}>What:</strong> {t.aiSummary.plainBullets.what}</li>
                )}
                {t.aiSummary.plainBullets.whoCanApply && (
                  <li><strong style={STRONG}>Who can apply:</strong> {t.aiSummary.plainBullets.whoCanApply}</li>
                )}
                {t.aiSummary.plainBullets.deadline && (
                  <li><strong style={STRONG}>Deadline:</strong> {t.aiSummary.plainBullets.deadline}</li>
                )}
              </ul>
            </Card>
          ) : (
            <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>Summary being prepared. Check back soon.</p>
          )}
        </Section>

        {/* Full AI summary (paragraph form) — kept below the bullets for
            readers who want the narrative. */}
        {t.aiSummary?.plainEnglishSummary ? (
          <Section title="Full summary">
            <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginBottom: 8 }}>
              AI-generated via {t.aiSummary.aiModel} · <span className="ftp-num">{formatIST(t.aiSummary.generatedAt)}</span> · verify against the NIT PDF before bidding.
            </div>
            <p className="ftp-body" style={{ fontSize: 13, lineHeight: "22px", whiteSpace: "pre-wrap" }}>{t.aiSummary.plainEnglishSummary}</p>
          </Section>
        ) : null}

        {/* Eligibility wizard */}
        <Section title="Can I apply?">
          <EligibilityWizard eligibility={t.eligibility} tenderMseReserved={t.mseReserved} tenderStartupExempt={t.startupExempt} />
        </Section>

        {/* Corrigenda */}
        {t.corrigenda.length > 0 && (
          <Section title="Corrigenda">
            <DataTable
              dense
              caption="Corrigenda issued for this tender"
              columns={[
                { key: "no", label: "#", mono: true, align: "left", width: 48 },
                { key: "date", label: "Issued (IST)", mono: true, align: "left" },
                { key: "change", label: "Change" },
                { key: "summary", label: "Summary" },
              ]}
              rows={t.corrigenda.map((c) => ({
                no: `#${c.sequenceNo}`,
                date: shortDateIST(c.issuedAt),
                change: c.changeType.replace(/_/g, " "),
                summary: c.summaryPlain ?? "—",
              }))}
            />
          </Section>
        )}

        {/* Award + Contract */}
        {t.awards.length > 0 && (
          <Section title="Award of contract">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {t.awards.map((a) => (
                <Card key={a.id} padding={14}>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>Winner:</span> {a.winnerName}</div>
                  <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>Awarded amount:</span> <span className="ftp-num">{formatInr(a.awardedAmountInr)}</span></div>
                  {a.priceHitRatePct !== null && (
                    <div className="ftp-body"><span style={{ color: "var(--ftp-text-2)" }}>Of estimate:</span> <span className="ftp-num">{a.priceHitRatePct.toFixed(1)}%</span></div>
                  )}
                  <div style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", marginTop: 4 }}>
                    Awarded <span className="ftp-num">{shortDateIST(a.awardedAt)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Documents */}
        {t.documents.length > 0 && (
          <Section title="Documents">
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column" }}>
              {t.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 13, color: "var(--ftp-brand)", textDecoration: "none" }}
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
          extraSources={[{ name: `${t.sourcePortal} — this tender's notice`, url: t.sourceUrl }]}
        />
      </div>
    </ModuleErrorBoundary>
  );
}

/** Shared urgency logic — mirrors deadlineUrgency() in TenderCard so the
 *  card view and the detail hero use identical thresholds. */
function heroUrgency(deadlineIso: string): { tone: Tone; label: string } {
  const msLeft = new Date(deadlineIso).getTime() - Date.now();
  const daysLeft = msLeft / 86400_000;
  if (msLeft <= 0) return { tone: "neutral", label: "Deadline passed" };
  if (daysLeft < 2) return { tone: "danger", label: "Closes within 48 hours" };
  if (daysLeft < 7) return { tone: "warn", label: "Closes within 7 days" };
  return { tone: "live", label: "More than 7 days left" };
}

/** Emphasis inside body text (weight 500, never bold 700). */
const STRONG: React.CSSProperties = { fontWeight: 500, color: "var(--ftp-text)" };

/** Secondary action button/link — 44 px tall, bordered surface. */
const linkBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, padding: "0 14px",
  background: "var(--ftp-surface)", border: "1px solid var(--ftp-border)", borderRadius: "var(--ftp-radius-tile)",
  color: "var(--ftp-text)", fontSize: 13, fontWeight: 500, cursor: "pointer", textDecoration: "none",
  fontFamily: "var(--ftp-font-sans)",
};
