"use client";

/**
 * "Wildlife and forests" band (Section 04): forest-green palette, static
 * three-module directory. Layout, text and numbers come from SpecBand +
 * WILDLIFE_SPEC; this file pairs the spec with the band's CSS module.
 */

import styles from "./styles.module.css";
import { SpecBand } from "../SpecBand";
import { WILDLIFE_SPEC } from "./metrics";
import type { WildlifeForestsData } from "@/lib/india/getWildlifeForestsData";

export function WildlifeForestsClient({ data, locale }: { data: WildlifeForestsData; locale: string }) {
  return <SpecBand spec={WILDLIFE_SPEC} styles={styles} data={data} locale={locale} />;
}
