"use client";

/**
 * "Culture and heritage" band (Section 10): rose palette, static directory.
 * Layout, text and numbers come from SpecBand + CULTURE_SPEC; this file pairs the
 * spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { CULTURE_SPEC } from "./metrics";
import type { CultureData } from "@/lib/india/getCultureData";

export function CultureClient({ data, locale }: { data: CultureData; locale: string }) {
  return <SpecBand spec={CULTURE_SPEC} styles={styles} data={data} locale={locale} />;
}
