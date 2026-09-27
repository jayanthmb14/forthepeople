/**
 * Declarative description of a super-category band on /[locale]/india.
 *
 * Eight of the ten bands (living standards → culture) share one layout:
 * an identity zone with a module directory, a featured module with a
 * headline, growth pill, callout and four cells, and two right-hand cards
 * of rows. Each band's metrics.ts exports one BandSpec; SpecBand renders
 * it with that band's CSS module, and the band's data loader asks
 * `specRefs(spec)` which IndiaIndicator rows to load.
 *
 * Words are never stored here — only message keys:
 *   - label and text keys are relative to the band's group in page_india
 *     (e.g. "headlineUnit" → page_india.living.headlineUnit);
 *   - `fmt` keys are relative to page_india itself (e.g. "fmt.gw" or
 *     "living.fmt.crCards") and receive the formatted number as {value}.
 *
 * Plain data, no React: safe to import from server loaders.
 */

export type MetricRef = { moduleSlug: string; metricKey: string };

/** A number read from IndiaIndicator. */
export interface ValueSpec {
  ref: MetricRef;
  /** Fixed decimals (default 0). */
  decimals?: number;
  /** Message key (under page_india) wrapping the number as {value}. */
  fmt?: string;
  /** A year: shown as-is, never grouped ("1983", not "1,983"). */
  year?: boolean;
  /** Prefix a "#" (ranks). */
  rank?: boolean;
}

export type TextOrValue = ValueSpec | { text: string };

export interface RowSpec {
  /** Row id; also the label key `cards.<card>.rows.<key>` unless `state` is set. */
  key: string;
  /** Label is this state's (translated) name instead of a message. */
  state?: string;
  /** "#1" before the label. */
  rank?: number;
  emoji?: string;
  /** ⬇ / ⬆ marker (lower-is-better / higher-is-better). */
  arrow?: "up" | "down";
  /** Small second label: a state's name, or a message key under `notes`. */
  note?: { state: string } | { text: string };
  value: ValueSpec;
  /** Colour of this row's slice when the card draws a mix bar. */
  color?: string;
}

export interface CardSpec {
  /** Title key `cards.<key>.title`, link label key `cards.<key>.link`. */
  key: string;
  emoji: string;
  /** Link target after /<locale>, e.g. "/india/energy-power". */
  href: string;
  /** Number passed to the link label as {n}. */
  linkValue?: ValueSpec;
  /** Draw a thin bar under each row, sized against the largest row. */
  bars?: boolean;
  /** Draw one stacked bar of the rows' shares (rows are percentages). */
  mixBar?: boolean;
  rows: RowSpec[];
}

export interface BandSpec {
  /** Message group under page_india, e.g. "living". */
  group: string;
  slug: string;
  tintId: string;
  titleId: string;
  /** CSS-module class for the identity-zone watermark. */
  watermarkClass: string;
  dotsAccent: string;
  /** Few modules: a plain list without the scrolling window. */
  staticDirectory?: boolean;
  directory: Array<{ moduleSlug: string; emoji: string; value: ValueSpec; featured?: boolean }>;
  featured: {
    moduleSlug: string;
    emoji: string;
    headline: ValueSpec;
    growth?: ValueSpec;
    callout?: {
      /** Label key (relative to the group); defaults to the shared "Target". */
      label?: string;
      value?: ValueSpec;
      /** A fixed line instead of a number (e.g. a state name key). */
      valueText?: string;
      sub?: string;
      subValue?: ValueSpec;
    };
    cells: Array<{ key: string; value: TextOrValue; sub: TextOrValue }>;
  };
  cards: [CardSpec, CardSpec];
}

export function indicatorKey(ref: MetricRef): string {
  return `${ref.moduleSlug}::${ref.metricKey}`;
}

function isValue(x: TextOrValue | undefined): x is ValueSpec {
  return Boolean(x && "ref" in x);
}

/** Every IndiaIndicator row the band reads, de-duplicated. */
export function specRefs(spec: BandSpec): MetricRef[] {
  const refs: MetricRef[] = [];
  for (const d of spec.directory) refs.push(d.value.ref);
  const f = spec.featured;
  refs.push(f.headline.ref);
  if (f.growth) refs.push(f.growth.ref);
  if (f.callout?.value) refs.push(f.callout.value.ref);
  if (f.callout?.subValue) refs.push(f.callout.subValue.ref);
  for (const c of f.cells) {
    if (isValue(c.value)) refs.push(c.value.ref);
    if (isValue(c.sub)) refs.push(c.sub.ref);
  }
  for (const card of spec.cards) {
    for (const r of card.rows) refs.push(r.value.ref);
    if (card.linkValue) refs.push(card.linkValue.ref);
  }
  const seen = new Set<string>();
  return refs.filter((r) => {
    const k = indicatorKey(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
