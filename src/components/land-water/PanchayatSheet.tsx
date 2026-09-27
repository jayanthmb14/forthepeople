/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  PanchayatSheet — everything about one village council, one tap away
// ═══════════════════════════════════════════════════════════════════════
//    money: a dial of the share of funds used + one plain sentence
//       (or "given; spending not reported yet" — never a fake 0 %)
//    drinking water: a ring of homes covered + one sentence
//    every figure: people, homes, water, road, MGNREGA works, money
//       given and used, taluk, when our record was last updated, source
//    footer: eGramSwaraj and NREGA.nic.in
//  v5: no emoji (the module's own sits in the page header only).
//  Amounts are whole rupees, shown in lakh / crore. Words come from
//  "page_gram-panchayat"; numbers and dates from useFormat().
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { GramPanchayat } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { Gauge } from "@/components/district/visuals";
import { hueClass } from "@/lib/design/hues";
import { CalmNote } from "@/components/district/calm-parts";
import { SheetAction, SheetBlock } from "./cards";
import { MiniRing, namePair } from "./visuals";

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
export const EGRAMSWARAJ = "https://egramswaraj.gov.in";
export const NREGA = "https://nrega.nic.in";

/** The API row carries a few more columns than the shared type lists. */
export type PanchayatRow = GramPanchayat & { talukId?: string | null; source?: string | null; updatedAt?: string | null };

export function PanchayatSheet({
  gp,
  locale,
  taluk,
  money,
  onClose,
}: {
  gp: PanchayatRow | null;
  locale: string;
  /** Taluk name for the row, when the district overview knows it. */
  taluk?: string | null;
  /** Rupees → "₹12.3 lakh" / "₹1.2 crore" (from the page). */
  money: (rupees: number) => string;
  onClose: () => void;
}) {
  const t = useTranslations("page_gram-panchayat");
  const f = useFormat();
  if (!gp) return null;
  const n = namePair(gp.name, gp.nameLocal, locale);
  const pct = (v: number) => f.number(v / 100, { style: "percent", maximumFractionDigits: 0 });
  const given = gp.totalFunds ?? null;
  const used = gp.fundsUtilized ?? null;
  const hasBoth = given !== null && given > 0 && used !== null;
  const usedPct = hasBoth ? (used / given) * 100 : null;
  const hasWater = gp.waterCoverage !== null && gp.waterCoverage !== undefined;
  const updated = gp.updatedAt ? f.date(gp.updatedAt, { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    <DetailSheet
      open
      onClose={onClose}
      title={n.primary}
      titleLang={n.primaryLang}
      subtitle={
        n.secondary || taluk ? (
          <>
            {n.secondary && <span lang={n.secondaryLang}>{n.secondary}</span>}
            {n.secondary && taluk ? " · " : null}
            {taluk && t("talukOf", { taluk })}
          </>
        ) : undefined
      }
      hueClassName={hueClass("gram-panchayat")}
      footer={
        <>
          <SheetAction href={EGRAMSWARAJ} primary>
            {t("openEgs")}
          </SheetAction>
          <SheetAction href={NREGA}>
            {t("openNrega")}
          </SheetAction>
        </>
      }
    >
      {given !== null && given > 0 && (
        <SheetBlock title={t("moneyBlock")}>
          {usedPct !== null ? (
            <>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Gauge value={usedPct} label={t("gaugeLabel")} caption={t("gaugeCaption", { used: money(used as number), given: money(given) })} size={170} />
              </div>
              <CalmNote>
                {t.rich("fundsSentence", { b: bold, given: money(given), spent: money(used as number), pct: pct(usedPct) })}
              </CalmNote>
            </>
          ) : (
            <CalmNote tone="quiet">{t("fundsNotReported", { given: money(given) })}</CalmNote>
          )}
        </SheetBlock>
      )}

      {hasWater && (
        <SheetBlock title={t("waterBlock")}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <MiniRing pct={gp.waterCoverage as number} label={t("waterRingAria", { pct: pct(gp.waterCoverage as number) })} size={76} />
            <p style={{ margin: 0, fontSize: 15, lineHeight: "23px" }}>{t.rich("waterSentence", { b: bold, pct: pct(gp.waterCoverage as number) })}</p>
          </div>
        </SheetBlock>
      )}

      <SheetBlock title={t("rowsTitle")}>
        <DetailList
          rows={[
            { label: t("rowPopulation"), value: gp.population ? f.number(gp.population) : null },
            { label: t("rowHouseholds"), value: gp.households ? f.number(gp.households) : null },
            { label: t("rowWater"), value: hasWater ? pct(gp.waterCoverage as number) : null },
            { label: t("rowRoad"), value: gp.roadConnected == null ? null : gp.roadConnected ? t("yes") : t("no") },
            { label: t("rowMgnrega"), value: gp.mgnregaWorks == null ? null : f.number(gp.mgnregaWorks) },
            { label: t("rowGiven"), value: given !== null && given > 0 ? money(given) : null },
            { label: t("rowUsed"), value: used !== null && given ? money(used) : null },
            { label: t("rowTaluk"), value: taluk ?? null },
            { label: t("rowUpdated"), value: updated },
            { label: t("rowSource"), value: gp.source ?? null },
          ]}
        />
      </SheetBlock>
    </DetailSheet>
  );
}
