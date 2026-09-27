"use client";

/**
 * "Agriculture and livestock" band (Section 05): amber palette.
 * Layout, text and numbers come from SpecBand + AGRI_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { AGRI_SPEC } from "./metrics";
import type { AgricultureLivestockData } from "@/lib/india/getAgricultureLivestockData";

export function AgricultureLivestockClient({ data, locale }: { data: AgricultureLivestockData; locale: string }) {
  return <SpecBand spec={AGRI_SPEC} styles={styles} data={data} locale={locale} />;
}
