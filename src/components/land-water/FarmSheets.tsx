/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  Farm & soil advice — the two detail sheets
// ═══════════════════════════════════════════════════════════════════════
//    AdvisorySheet  one crop advisory in full: the advice (the state
//                   language first when the source has it and the reader
//                   uses it, then the other), crop, topic, week, source,
//                   and the free Kisan Call Centre number to ask more.
//    SoilSheet      one village's soil report: pH in a sentence and on a
//                   strip, nitrogen / phosphorus / potassium as level
//                   meters, organic carbon, the test date and source.
//  Advisory text, crop and village names are data and stay as published.
//  Words come from "page_farm"; numbers and dates from useFormat().
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import type { AgriAdvisory, SoilHealth } from "@/hooks/useRealtimeData";
import { useFormat } from "@/i18n/client";
import { DetailList, DetailSheet } from "@/components/district/DetailSheet";
import { nutrientLevel, phBand, PH_ACIDIC_BELOW, PH_ALKALINE_ABOVE } from "@/components/farm/SoilVisuals";
import type { NutrientLevel } from "@/components/farm/SoilVisuals";
import { hueClass } from "@/lib/design/hues";
import { scriptLang } from "@/lib/utils/script-lang";
import { SheetNote } from "@/components/services-2/kit";
import { SheetAction, SheetBlock } from "./cards";

const bold = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
/** Kisan Call Centre, Ministry of Agriculture & Farmers Welfare (toll-free). */
const KCC_TEL = "tel:18001801551";
const SHC_URL = "https://soilhealth.dac.gov.in";

/** The collector's own "N: Low, P: Medium, K: High" line only repeats the ratings; it is not advice. */
export const AUTO_NPK_LINE = /^\s*N:\s*\w+,\s*P:\s*\w+,\s*K:\s*\w+\s*$/i;

/** The advisory text in reading order: the reader's language first when the source has it. */
export function adviceTexts(a: AgriAdvisory, locale: string): Array<{ text: string; lang?: string }> {
  const local = a.advisoryLocal?.trim();
  if (local && scriptLang(local) === locale) return [{ text: local, lang: scriptLang(local) }, { text: a.advisory, lang: "en" }];
  return local ? [{ text: a.advisory }, { text: local, lang: scriptLang(local) }] : [{ text: a.advisory }];
}

export function AdvisorySheet({
  advisory,
  locale,
  topicLabel,
  onClose,
}: {
  advisory: AgriAdvisory | null;
  locale: string;
  topicLabel: (category: string) => string;
  onClose: () => void;
}) {
  const t = useTranslations("page_farm");
  const f = useFormat();
  if (!advisory) return null;
  const a = advisory;
  const week = f.date(a.weekOf, { day: "numeric", month: "long", year: "numeric" });
  const texts = adviceTexts(a, locale);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={
        <>
          {a.crop}
          {a.cropLocal && a.cropLocal !== a.crop && (
            <span lang={scriptLang(a.cropLocal)} style={{ fontWeight: 500, fontSize: 16, marginInlineStart: 8 }}>
              {a.cropLocal}
            </span>
          )}
        </>
      }
      subtitle={t("adviceSub", { date: week, topic: topicLabel(a.category) })}
      hueClassName={hueClass("farm")}
      footer={
        <SheetAction href={KCC_TEL} primary>
          {t("callKcc")}
        </SheetAction>
      }
    >
      <SheetBlock title={t("adviceTitle")}>
        {texts.map((x, i) => (
          <p
            key={i}
            lang={x.lang}
            style={{
              margin: 0,
              fontSize: i === 0 ? 16 : 14,
              lineHeight: i === 0 ? "26px" : "22px",
              color: i === 0 ? "var(--ftp-text)" : "var(--ftp-text-2)",
              whiteSpace: "pre-line",
            }}
          >
            {x.text}
          </p>
        ))}
      </SheetBlock>
      <SheetNote>{t.rich("kccNote", { b: bold })}</SheetNote>
      <SheetBlock title={t("rowsTitle")}>
        <DetailList
          rows={[
            { label: t("rowCrop"), value: a.crop },
            { label: t("rowTopic"), value: topicLabel(a.category) },
            { label: t("rowWeek"), value: week },
            { label: t("rowSource"), value: a.source },
          ]}
        />
      </SheetBlock>
    </DetailSheet>
  );
}

/** Three boxes filled up to the level (low = 1, medium = 2, high = 3), with the word. */
function LevelMeter({ level, label }: { level: NutrientLevel; label: string }) {
  const filled = level === "low" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span aria-hidden style={{ display: "inline-flex", gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 18,
              height: 12,
              borderRadius: 4,
              background: i <= filled ? "var(--hue)" : "var(--hue-tint)",
              border: "1px solid color-mix(in srgb, var(--hue) 25%, transparent)",
            }}
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}

export function SoilSheet({
  soil,
  onClose,
}: {
  soil: SoilHealth | null;
  onClose: () => void;
}) {
  const t = useTranslations("page_farm");
  const f = useFormat();
  if (!soil) return null;
  const s = soil;
  const hasPh = s.pH !== null && s.pH !== undefined;
  const levelOrText = (value: string | null | undefined) => {
    if (!value) return null;
    const lv = nutrientLevel(value);
    return lv ? <LevelMeter level={lv} label={t(`level.${lv}`)} /> : value;
  };
  const tested = s.testedAt ? f.date(s.testedAt, { day: "numeric", month: "long", year: "numeric" }) : null;
  const showRecommendation = Boolean(s.recommendation && !AUTO_NPK_LINE.test(s.recommendation));
  const low = f.number(PH_ACIDIC_BELOW);
  const high = f.number(PH_ALKALINE_ABOVE);
  return (
    <DetailSheet
      open
      onClose={onClose}
      title={s.villageName ?? t("villageUnnamed")}
      subtitle={tested ? t("soilSub", { date: tested }) : t("soilSubNoDate")}
      hueClassName={hueClass("farm")}
      footer={
        <SheetAction href={SHC_URL} primary>
          {t("openShc")}
        </SheetAction>
      }
    >
      {hasPh && (
        <SheetNote>
          {t.rich("soilSentence", {
            b: bold,
            village: s.villageName ?? t("villageUnnamed"),
            band: phBand(s.pH as number),
            ph: f.number(s.pH as number, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
          })}{" "}
          {t("phBandsHelp", { low, high })}
        </SheetNote>
      )}
      <SheetBlock title={t("nutrientsBlock")}>
        <DetailList
          rows={[
            { label: t("phLabel"), value: hasPh ? f.number(s.pH as number, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null },
            { label: t("nutrient.nitrogen"), value: levelOrText(s.nitrogen) },
            { label: t("nutrient.phosphorus"), value: levelOrText(s.phosphorus) },
            { label: t("nutrient.potassium"), value: levelOrText(s.potassium) },
            { label: t("organicCarbon"), value: levelOrText(s.organicCarbon) },
          ]}
        />
      </SheetBlock>
      {showRecommendation && (
        <SheetBlock title={t("recommendation")}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: "24px" }}>{s.recommendation}</p>
        </SheetBlock>
      )}
      <SheetBlock title={t("rowsTitle")}>
        <DetailList
          rows={[
            { label: t("rowVillage"), value: s.villageName ?? null },
            { label: t("rowTested"), value: tested },
            { label: t("rowSource"), value: s.source },
          ]}
        />
      </SheetBlock>
    </DetailSheet>
  );
}
