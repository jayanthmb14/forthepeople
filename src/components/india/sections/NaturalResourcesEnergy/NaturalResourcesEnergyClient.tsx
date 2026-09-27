"use client";

/**
 * "Natural resources and energy" band (Section 06): oil-teal palette, with a stacked energy-mix bar.
 * Layout, text and numbers come from SpecBand + ENERGY_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { ENERGY_SPEC } from "./metrics";
import type { NaturalResourcesEnergyData } from "@/lib/india/getNaturalResourcesEnergyData";

export function NaturalResourcesEnergyClient({ data, locale }: { data: NaturalResourcesEnergyData; locale: string }) {
  return <SpecBand spec={ENERGY_SPEC} styles={styles} data={data} locale={locale} />;
}
