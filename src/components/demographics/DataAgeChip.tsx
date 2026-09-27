"use client";

// How old a dataset's reference year is, as a small kit Pill:
//   ≤ 2 years → live (green) · ≤ 5 years → warn (amber) · older → danger (red)
// The colour is only the pill's text + 6 px dot (Design v3 rule: semantic
// colour never fills a box). Text: page_population.source.*.
import { useTranslations } from "next-intl";
import { Pill, type Tone } from "@/components/district/ui";

interface DataAgeChipProps {
  referenceYear: number;
}

function classify(referenceYear: number): { age: number; tone: Tone; tier: "green" | "amber" | "red" } {
  const now = new Date().getFullYear();
  const age = now - referenceYear;
  if (age <= 2) return { age, tone: "live", tier: "green" };
  if (age <= 5) return { age, tone: "warn", tier: "amber" };
  return { age, tone: "danger", tier: "red" };
}

export default function DataAgeChip({ referenceYear }: DataAgeChipProps) {
  const t = useTranslations("page_population.source");
  const { age, tone, tier } = classify(referenceYear);
  const tooltip = tier === "red" ? t("ageTip") : undefined;

  return (
    <Pill tone={tone} dot title={tooltip}>
      <span className="ftp-num" suppressHydrationWarning>{t("age", { n: age })}</span>
    </Pill>
  );
}
