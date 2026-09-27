/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Tenders — the tappable card and its DetailSheet (v4.1)
// ═══════════════════════════════════════════════════════════════════════
//  TenderTapCard  one tender as a single tap target: status, title, buyer
//                 and category tags, the estimated value, and a
//                 CountdownBar that fills from "published" to "last date
//                 to bid". Tapping it opens TenderSheet.
//  TenderSheet    everything about the tender without leaving the list:
//                 time left, value / EMD / fee, buyer, place, dates,
//                 factual indicators, then (fetched when opened) the plain
//                 words summary, "Can I apply?", changes issued, the award
//                 and the documents. Footer: view on the source portal,
//                 open the full tender page.
//  Words live in "page_tenders"; tender titles, authorities, categories
//  and computed factual statements stay exactly as published.
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import { Pill, LoadingShell, formatIST } from "@/components/district/ui";
import { CountdownBar } from "@/components/district/visuals";
import { DetailSheet, DetailList } from "@/components/district/DetailSheet";
import { hueClass } from "@/lib/design/hues";
import { useFormat } from "@/i18n/client";
import { useTenderStatus } from "@/components/tenders/TenderCard";
import CountdownTimer from "@/components/tenders/CountdownTimer";
import RedFlagBadge from "@/components/tenders/RedFlagBadge";
import EligibilityWizard from "@/components/tenders/EligibilityWizard";
import { useMoney } from "./useMoney";
import { CardHead, HueTag, SheetHighlight, SheetLink, SheetSection, TagRow, TapCard, safeUrl } from "./TapCard";
import type { TenderDetail, TenderListRow } from "./tender-types";

/** Whole days since a date (0 = today). */
function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

const num = (c: React.ReactNode) => <span className="ftp-num">{c}</span>;

export function TenderTapCard({ tender, onOpen }: { tender: TenderListRow; onOpen: () => void }) {
  const t = useTranslations("page_tenders");
  const m = useMoney();
  const statusOf = useTenderStatus();
  const status = statusOf(tender.status);
  // eslint-disable-next-line react-hooks/purity -- whether the deadline has passed is relative to now
  const closed = new Date(tender.bidSubmissionEnd).getTime() <= Date.now();
  const flags = tender.redFlags.length;
  return (
    <TapCard onOpen={onOpen} ariaLabel={t("card.openAria", { title: tender.title })} more={t("card.more")} dimmed={closed}>
      <CardHead emoji="📑" title={tender.title} side={<Pill tone={status.tone}>{status.label}</Pill>} />
      <TagRow>
        <HueTag>{tender.authority.shortCode}</HueTag>
        {tender.category && <HueTag outline>{tender.category.name}</HueTag>}
        {tender.mseReserved && <HueTag emoji="🏪">{t("tag.mse")}</HueTag>}
        {tender.startupExempt && <HueTag outline emoji="🚀">{t("tag.startup")}</HueTag>}
      </TagRow>
      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span>
          <span className="ftp-label" style={{ display: "block" }}>{t("sheet.value")}</span>
          <span className="ftp-num ftp-display" style={{ fontSize: 18, lineHeight: "24px", fontWeight: 650, color: "var(--hue-deep)" }}>
            {m.short(tender.estimatedValueInr)}
          </span>
        </span>
        <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
          {tender.locationTaluk ? `${tender.locationTaluk}, ` : ""}
          {tender.locationDistrict}
        </span>
      </span>
      <span style={{ display: "block" }}>
        <CountdownBar
          start={tender.publishedAt}
          target={tender.bidSubmissionEnd}
          label={
            closed ? (
              t("countdown.closed")
            ) : (
              <>
                {t("card.closesIn")} <CountdownTimer deadline={tender.bidSubmissionEnd} compact />
              </>
            )
          }
        />
      </span>
      <span style={{ display: "flex", flexWrap: "wrap", columnGap: 12, rowGap: 2, fontSize: 12, lineHeight: "16px", color: "var(--ftp-text-2)" }}>
        <span suppressHydrationWarning>{t.rich("card.published", { n: daysSince(tender.publishedAt), num })}</span>
        {tender._count.corrigenda > 0 && <span style={{ color: "var(--ftp-warn)" }}>{t.rich("card.corrigenda", { n: tender._count.corrigenda, num })}</span>}
        {flags > 0 && <span style={{ color: "var(--ftp-danger)" }}>{t.rich("card.flags", { n: flags, num })}</span>}
      </span>
    </TapCard>
  );
}

export function TenderSheet({
  tender,
  onClose,
  districtSlug,
  stateSlug,
  locale,
}: {
  tender: TenderListRow | null;
  onClose: () => void;
  districtSlug: string;
  stateSlug: string;
  locale: string;
}) {
  const t = useTranslations("page_tenders");
  const f = useFormat();
  const m = useMoney();
  const statusOf = useTenderStatus();
  // The rest of the story (summary, documents, corrigenda, award) is fetched
  // only when a tender is open, and cached per tender.
  const detail = useQuery<TenderDetail>({
    queryKey: ["tender-detail", districtSlug, tender?.id],
    queryFn: async () => {
      const res = await fetch(`/api/tenders/${districtSlug}/${tender!.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!tender,
    staleTime: 10 * 60_000,
  });
  if (!tender) return null;

  const d = detail.data?.tender;
  const status = statusOf(tender.status);
  // eslint-disable-next-line react-hooks/purity -- whether the deadline has passed is relative to now
  const closed = new Date(tender.bidSubmissionEnd).getTime() <= Date.now();
  const sourceUrl = safeUrl(d?.sourceUrl ?? tender.sourceUrl);
  const portal = d?.sourcePortal ?? tender.sourcePortal ?? null;
  const emd = d?.emdAmountInr ?? tender.emdAmountInr ?? null;
  const fee = d?.tenderFeeInr ?? tender.tenderFeeInr ?? null;
  const place = tender.locationTaluk ? `${tender.locationTaluk}, ${tender.locationDistrict}` : tender.locationDistrict;
  const shortDate = (iso: string) => f.date(iso, { day: "numeric", month: "short", year: "numeric" });
  const bullets = d?.aiSummary?.plainBullets;
  const flags = d?.redFlags ?? tender.redFlags.map((x) => ({ ...x, referenceRule: null as string | null }));

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={tender.title}
      subtitle={t("detail.byline", { authority: tender.authority.name, place })}
      emoji="📑"
      hueClassName={hueClass("tenders")}
      footer={
        <>
          {sourceUrl && (
            <SheetLink href={sourceUrl} primary icon={<ExternalLink size={16} aria-hidden />}>
              {t("detail.viewSource")}
            </SheetLink>
          )}
          <Link
            href={`/${locale}/${stateSlug}/${districtSlug}/tenders/${tender.id}`}
            className="ftp-btn ftp-btn-secondary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid var(--ftp-border)",
              background: "var(--ftp-surface)",
              color: "var(--ftp-text)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {t("sheet.openPage")}
          </Link>
        </>
      }
    >
      <SheetHighlight emoji={closed ? "✅" : "⏳"} label={t("sheet.timeLeft")}>
        {closed ? t("countdown.closed") : <CountdownTimer deadline={tender.bidSubmissionEnd} />}
      </SheetHighlight>
      <CountdownBar
        start={tender.publishedAt}
        target={tender.bidSubmissionEnd}
        label={t("sheet.lastDate", { date: formatIST(tender.bidSubmissionEnd, f.intl) ?? shortDate(tender.bidSubmissionEnd) })}
        sub={t("sheet.publishedOn", { date: shortDate(tender.publishedAt) })}
      />
      <TagRow>
        <Pill tone={status.tone}>{status.label}</Pill>
        {tender.mseReserved && <HueTag emoji="🏪">{t("tag.mse")}</HueTag>}
        {tender.startupExempt && <HueTag outline emoji="🚀">{t("tag.startup")}</HueTag>}
      </TagRow>

      <DetailList
        rows={[
          { emoji: "💰", label: t("sheet.value"), value: <span className="ftp-num">{m.short(tender.estimatedValueInr)}</span> },
          {
            emoji: "🔐",
            label: t("sheet.emd"),
            value: emd ? <span className="ftp-num">{m.short(emd)}</span> : tender.mseReserved || tender.startupExempt ? t("detail.tiles.exempt") : null,
          },
          { emoji: "🧾", label: t("sheet.fee"), value: fee ? <span className="ftp-num">{m.short(fee)}</span> : null },
          { emoji: "🏛️", label: t("sheet.buyer"), value: tender.authority.name },
          { emoji: "🗂️", label: t("sheet.category"), value: tender.category?.name ?? null },
          { emoji: "📍", label: t("sheet.place"), value: place },
          { emoji: "🤝", label: t("sheet.preBid"), value: tender.preBidMeetingAt ? formatIST(tender.preBidMeetingAt, f.intl) : null },
          { emoji: "✏️", label: t("sheet.corrigenda"), value: tender._count.corrigenda > 0 ? m.num(tender._count.corrigenda) : null },
          { emoji: "🌐", label: t("sheet.portal"), value: portal },
        ]}
      />

      {flags.length > 0 && (
        <SheetSection emoji="🚩" title={t("detail.flagsTitle")}>
          <p className="ftp-body" style={{ color: "var(--ftp-text-2)", marginBottom: 8 }}>{t("detail.flagsIntro")}</p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {flags.map((fl) => (
              <li key={fl.flagType} className="ftp-body">
                <RedFlagBadge flagType={fl.flagType} factualStatement={fl.factualStatement} referenceRule={fl.referenceRule} />{" "}
                <span>{fl.factualStatement}</span>
              </li>
            ))}
          </ul>
        </SheetSection>
      )}

      {detail.isLoading && <LoadingShell rows={2} />}

      {d && (
        <>
          <SheetSection emoji="💬" title={t("detail.plainTitle")}>
            {bullets && (bullets.what || bullets.whoCanApply || bullets.deadline) ? (
              <ul className="ftp-body" style={{ margin: 0, paddingInlineStart: 18, fontSize: 14, lineHeight: "22px" }}>
                {bullets.what && <li>{t.rich("detail.what", { text: bullets.what, s: (c) => <strong>{c}</strong> })}</li>}
                {bullets.whoCanApply && <li>{t.rich("detail.who", { text: bullets.whoCanApply, s: (c) => <strong>{c}</strong> })}</li>}
                {bullets.deadline && <li>{t.rich("detail.deadline", { text: bullets.deadline, s: (c) => <strong>{c}</strong> })}</li>}
              </ul>
            ) : d.description ? (
              <p className="ftp-body" style={{ fontSize: 14, lineHeight: "22px" }}>{d.description}</p>
            ) : (
              <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("detail.plainPending")}</p>
            )}
          </SheetSection>

          <SheetSection emoji="✅" title={t("detail.canApply")}>
            <EligibilityWizard eligibility={d.eligibility} tenderMseReserved={d.mseReserved} tenderStartupExempt={d.startupExempt} />
          </SheetSection>

          {d.corrigenda.length > 0 && (
            <SheetSection emoji="✏️" title={t("detail.corrigendaTitle")}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {d.corrigenda.map((c) => (
                  <li key={c.id} className="ftp-body" style={{ fontSize: 14, lineHeight: "21px" }}>
                    <strong className="ftp-num">#{c.sequenceNo}</strong> · {shortDate(c.issuedAt)} ·{" "}
                    {t.has(`changeType.${c.changeType}`) ? t(`changeType.${c.changeType}`) : c.changeType.replace(/_/g, " ")}
                    {c.summaryPlain && <span style={{ display: "block", color: "var(--ftp-text-2)" }}>{c.summaryPlain}</span>}
                  </li>
                ))}
              </ul>
            </SheetSection>
          )}

          {d.awards.length > 0 && (
            <SheetSection emoji="🏆" title={t("detail.awardTitle")}>
              {d.awards.map((a) => (
                <DetailList
                  key={a.id}
                  rows={[
                    { label: t("sheet.winner"), value: a.winnerName },
                    { label: t("sheet.awarded"), value: <span className="ftp-num">{m.short(a.awardedAmountInr)}</span> },
                    {
                      label: t("sheet.ofEstimate"),
                      value: a.priceHitRatePct !== null ? <span className="ftp-num">{f.number(a.priceHitRatePct, { maximumFractionDigits: 1 })}%</span> : null,
                    },
                    { label: t("sheet.awardedOn"), value: shortDate(a.awardedAt) },
                  ]}
                />
              ))}
            </SheetSection>
          )}

          {d.documents.length > 0 && (
            <SheetSection emoji="📂" title={t("detail.documents")}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {d.documents.map((doc) => {
                  const url = safeUrl(doc.sourceUrl);
                  return (
                    <li key={doc.id}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, fontSize: 14, fontWeight: 600, color: "var(--hue-deep)", textDecoration: "none" }}
                        >
                          <ExternalLink size={14} aria-hidden /> {doc.displayName} ({doc.docType})
                        </a>
                      ) : (
                        <span className="ftp-body">
                          {doc.displayName} ({doc.docType})
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SheetSection>
          )}
        </>
      )}

      <p className="ftp-body" style={{ color: "var(--ftp-text-2)" }}>{t("sheet.checkPortal")}</p>
    </DetailSheet>
  );
}
