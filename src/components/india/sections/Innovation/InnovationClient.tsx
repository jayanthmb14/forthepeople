"use client";

/**
 * "Innovation and industry" band (Section 09): copper palette.
 * Layout, text and numbers come from SpecBand + INNOV_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { INNOV_SPEC } from "./metrics";
import type { InnovationData } from "@/lib/india/getInnovationData";

export function InnovationClient({ data, locale }: { data: InnovationData; locale: string }) {
  return <SpecBand spec={INNOV_SPEC} styles={styles} data={data} locale={locale} />;
}
