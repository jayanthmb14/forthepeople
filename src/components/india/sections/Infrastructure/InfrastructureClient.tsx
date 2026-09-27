"use client";

/**
 * "Infrastructure" band (Section 07): charcoal palette.
 * Layout, text and numbers come from SpecBand + INFRA_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { INFRA_SPEC } from "./metrics";
import type { InfrastructureData } from "@/lib/india/getInfrastructureData";

export function InfrastructureClient({ data, locale }: { data: InfrastructureData; locale: string }) {
  return <SpecBand spec={INFRA_SPEC} styles={styles} data={data} locale={locale} />;
}
