"use client";

/**
 * "Governance and justice" band (Section 08): deep navy palette.
 * Layout, text and numbers come from SpecBand + GOV_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { GOV_SPEC } from "./metrics";
import type { GovernanceData } from "@/lib/india/getGovernanceData";

export function GovernanceClient({ data, locale }: { data: GovernanceData; locale: string }) {
  return <SpecBand spec={GOV_SPEC} styles={styles} data={data} locale={locale} />;
}
