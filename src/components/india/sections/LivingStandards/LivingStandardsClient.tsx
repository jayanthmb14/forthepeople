"use client";

/**
 * "Living standards" band (Section 03): teal palette. Layout, text and
 * numbers come from SpecBand + LIVING_SPEC; this file only pairs the spec
 * with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { LIVING_SPEC } from "./metrics";
import type { LivingStandardsData } from "@/lib/india/getLivingStandardsData";

export function LivingStandardsClient({ data, locale }: { data: LivingStandardsData; locale: string }) {
  return <SpecBand spec={LIVING_SPEC} styles={styles} data={data} locale={locale} />;
}
