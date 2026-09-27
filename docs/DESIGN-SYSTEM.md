# ForThePeople.in — Design System v4 "Rang"

The site should feel colourful, warm and easy for anyone to read (a 5-year-old,
a 70-year-old), while every number stays honest: a date and a source beside it.
v4 replaces the calm v3 "Civic Ledger" look. Reference implementations:
`src/app/[locale]/page.tsx` (home), `OverviewClient.tsx` (district overview),
`[district]/finance/page.tsx` (module page).

## 1. Colour

| Token | Value | Use |
|---|---|---|
| `--ftp-bg` | `#F6F5F0` | page (with soft saffron/green washes at the top) |
| `--ftp-surface` | `#FFFFFF` | cards |
| `--ftp-text` / `--ftp-text-2` | `#15171C` / `#5D6270` | text |
| brand | `#2563EB` | links, primary buttons outside modules |
| saffron / green | `#FF9933` / `#138808` | ceremonial washes and the intro line only. Never stripes, never a chakra. |

**Module hues.** Every module owns one of 14 hues (`src/lib/design/hues.ts`,
CSS `.ftp-hue-<name>` in `globals.css`). A hue sets four variables:

- `--hue`: icons, bars, borders, chart fills
- `--hue-deep`: numbers and text on a tint
- `--hue-pop`: second chart series, light fills
- `--hue-tint`: soft backgrounds

`HueScope` (district layout) applies the open module's hue automatically, so
kit components on a module page are already coloured. To colour a single
element differently, wrap it in `className="ftp-hue-<name>"`. Never hard-code
hex values in components when a hue variable exists.

Districts also have hues (`getDistrictHue(slug)`), used by district cards and
the identity card.

## 2. Type

- **Bricolage Grotesque** (`--ftp-font-display`, `.ftp-display`, `.ftp-bignum`):
  headings, big numbers, card titles.
- **Plus Jakarta Sans** (`--ftp-font-sans`): everything you read, and small
  numbers with tabular figures (`.ftp-num`).
- Labels are **sentence case** (no tracked-out capitals). No eyebrow labels
  above every heading.
- Local-script names sit beside the English name in `--hue-deep`.

## 3. Emoji

Emoji are part of the language of the site. Use them in these places:

- the module emoji from the registry (`SIDEBAR_MODULES[].emoji`), in the sidebar, the header band and tiles;
- `StatTile emoji="…"`;
- `Section emoji="…"`;
- the Explainer, ChartCard and EmptyState components.

Keep it to **one emoji per element**. Never use emoji inside running
sentences, and never use more than one in a heading.

## 4. Components (kit: `src/components/district/ui.tsx`)

- `PageHeader`: a gradient band in the module hue, with the module emoji tile, a
  watermark icon, the group chip, the title and local name, and the freshness
  and source pills. Every module page starts with it.
- `StatTile`: a tinted tile with an `emoji` chip. The number is in `--hue-deep`
  and counts up once.
- `Card tinted`: a soft hue wash. Plain `Card` for secondary content.
- `Section emoji`: an H2 with an emoji chip.
- `ProgressBar`: a hue gradient that grows in. `KpiRing`: a ring that draws itself in the hue.
- `DataTable`: a hue-tinted header, with rows that tint on hover.
- `Chips`: the active chip is filled with the hue.
- `EmptyState emoji`: a friendly empty message, never a fake zero.

**Visuals** (`src/components/district/visuals.tsx`) are the pictures that make
data readable at a glance:

- `Explainer`: a 💡 "In simple words" card with one plain sentence.
- `Pictogram`: 10 symbols with N lit ("8 of every 10 rupees were spent").
- `Gauge`: a half-circle dial from 0 to 100.
- `WaterTank`: a tank filled to a %, with a moving wave. Use it for dams and coverage.
- `WeatherGlyph` / `weatherEmoji(conditions)`: a weather picture.
- `ChartCard`: the frame for every chart. It holds the title, emoji, units,
  the 👉 "simple" sentence, legend, source, as-of date and a "Show as table" switch.
- `ChartGradients` + `CHART_AXIS` + `chartTooltipStyle`: the recharts theme.
  Use `fill="url(#ftpHueFill)"` (vertical bars), `url(#ftpHueFillH)` (horizontal
  bars), `url(#ftpHueArea)` (areas), `url(#ftpMutedFill)` (the comparison series),
  and `stroke="var(--hue)"` for lines. Round bar ends (radius 6).

**The module-page recipe** (see finance):

1. `PageHeader`
2. a one-paragraph description for search engines
3. the AI insight card
4. the `StatStrip` of emoji `StatTile`s
5. the picture row (`.ftp-picture-row`), which holds an Explainer, a pictogram and a gauge or tank
6. the charts inside `ChartCard`s
7. the detail tables
8. the sources footer

Only show a picture when real data supports it. Never draw a chart from a
single point.

## 5. Motion

There is one orchestrated moment: the home-page intro (2 s, once per session, skippable).
It is followed by the hero cascade (`.ftp-rise` / `.ftp-pop` with `--i` stagger).
Everything else in the design moves only for data:

- bars grow in
- rings and gauges draw in
- numbers count up once
- tanks show a wave

Cards lift 2 px on hover when they are links. `prefers-reduced-motion` turns all
of it off (`globals.css`). Do not add fade-ups to every section.

## 6. Honesty rules (unchanged)

- Every number that can go stale shows "As of …" or a FreshnessPill, plus a
  source.
- Nothing says "Live" unless the data is less than 30 minutes old.
- If a source failed, show the EmptyState. Never invent or pad data.
- Never use "scraper/scraping" in citizen text. Never hard-code district counts
  (use `platform-facts` / the database).
- Budget values are stored in rupees and formatted at render.
