# ForThePeople.in — Design System v5 "Calm"

The site should feel **calm, clear and trustworthy**: a quiet blue-white page,
white cards, one blue for actions, and colour only where it tells you which
dashboard you are in. Anyone should understand a screen at a glance — a
5-year-old and a 60-year-old — and every number stays honest: a date and a
source beside it, and a plain warning when it is old.

v5 replaces v4 "Rang" (too many emoji, saturated gradient bands: "cartoonish")
and keeps what worked in v3 (quiet, precise) without its plainness.

Reference implementation: the kit in `src/components/district/ui.tsx`,
`visuals.tsx` and `DetailSheet.tsx`; tokens in `src/app/globals.css`; module
hues in `src/lib/design/hues.ts`.

---

## 1. Principles

1. **The main thing first.** The first screen shows the answer and the main
   actions (the dashboards, "Explore all of India", "Open my district").
   Nothing decorative sits above them.
2. **One idea per element.** No repeated summaries, no clutter, no badges
   that say the same thing twice.
3. **Colour means something.** Brand blue = action. A module hue = "you are
   in this dashboard". Amber = "this is old". Green dot = fresh. Nothing is
   coloured just to look lively.
4. **Honest by default.** Every dataset shows its own date. Old data says so
   in words. Missing data shows an empty state, never a fake zero.
5. **Sources are "government portals and other reputed sources"** — never
   claim "official only" when a page also shows other sources.

## 2. Colour

All colours are CSS variables in `globals.css`. **No hex in components** —
write `var(--ftp-brand)`, not `#2563EB`.

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--ftp-bg` | `#F5F8FC` | page (soft blue-white) | — |
| `--ftp-surface` | `#FFFFFF` | cards, tiles, sheets | — |
| `--ftp-surface-2` | `#EEF3FA` | quiet fills, hovers, skeletons | — |
| `--ftp-text` | `#0F1B2D` | body text, titles | 16.2 : 1 on bg |
| `--ftp-text-2` | `#4A5A70` | secondary text, labels | 7.0 on white, 6.3 on surface-2 |
| `--ftp-border` | `#E1E8F2` | card and table borders | — |
| `--ftp-border-strong` | `#C9D5E6` | inputs, hovered borders | — |
| `--ftp-brand` | `#2563EB` | links, primary buttons, focus ring | 5.2 on white (white text on it 5.2) |
| `--ftp-brand-deep` | `#1E40AF` | hover, text on brand-tint | 7.6 on brand-tint |
| `--ftp-brand-tint` | `#E8F0FE` | selected rows, brand chips | — |
| `--ftp-support` / `-tint` / `-border` | `#B4234F` / `#FDECF1` / `#F6C9D6` | the Support button and support notes: a soft rose, **never a crimson slab** | 5.6 on tint |
| `--ftp-warn` / `-tint` / `-border` / `-text` | `#B45309` / `#FFF6E5` / `#F2D7A6` / `#7A4A06` | stale-data notice, "late" status | text 7.0 on tint |
| `--ftp-live` / `-tint` / `-text` | `#16A34A` / `#ECFDF5` / `#166534` | "fresh" dot and "On time" status | — |
| `--ftp-danger` / `-tint` | `#B42318` / `#FEE9E7` | real errors only (a failed load), never for old data | — |
| `--ftp-focus` | `#2563EB` | 2 px focus outline, 2 px offset | — |

The legacy names (`--color-*`, `--ftp-color-*`) still exist for older pages
and now carry the same v5 values. The tricolour stays ceremonial (never
stripes, never a chakra); v5 pages carry no saffron/green washes.
Contrast is checked by `tests/design-tokens.test.ts`.

### Module hues — identity only

Every module owns one of 14 hues (`src/lib/design/hues.ts` → `MODULE_HUE`;
CSS `.ftp-hue-<name>`). `HueScope` in the district layout applies the open
module's hue, so kit components on a module page are coloured automatically.
A hue sets four variables:

| Variable | What it is | Where it goes |
|---|---|---|
| `--hue-tint` | very light | chip and card backgrounds, table headers, the PageHeader wash |
| `--hue-pop` | pastel | second chart series, light fills, water in a tank, bar tracks |
| `--hue` | calm mid tone, ≥ 4.5 : 1 on white | small icons, bars, active borders, hue buttons (white text passes AA) |
| `--hue-deep` | ≥ 6.5 : 1 on white and on the tint | numbers, the page title, text on a tint |

| Hue | `--hue` | `--hue-deep` | `--hue-pop` | `--hue-tint` |
|---|---|---|---|---|
| blue | `#3B68D9` | `#1E40AF` | `#BFD3FB` | `#EEF4FF` |
| sky | `#2F77AE` | `#0B5A85` | `#B5DDF2` | `#EAF6FC` |
| cyan | `#237A8C` | `#155E6E` | `#AEE0E8` | `#E8F7F9` |
| teal | `#277A70` | `#115E55` | `#A9DDD3` | `#E7F6F3` |
| green | `#2F7D4C` | `#1B6437` | `#B5DEC2` | `#EAF6EE` |
| lime | `#56752A` | `#3F5A12` | `#CFE3A8` | `#F1F7E6` |
| yellow | `#8A6A16` | `#6B4F08` | `#F3DE9A` | `#FDF8E4` |
| amber | `#A2621F` | `#7F430C` | `#F3D3A2` | `#FDF4E7` |
| orange | `#B45530` | `#8F3712` | `#F5C6AA` | `#FDF0E9` |
| rose | `#BA3F63` | `#9B1D43` | `#F4BFCD` | `#FDEEF2` |
| pink | `#AE4679` | `#8C2257` | `#F1C0DA` | `#FCEFF6` |
| violet | `#7152C9` | `#5328A8` | `#D3C4F6` | `#F4F0FD` |
| indigo | `#5256C9` | `#3730A3` | `#C7C9F6` | `#EFF0FD` |
| slate | `#5A6A80` | `#334155` | `#C9D2DE` | `#F1F4F8` |

Rules:

- Big areas use the **tint** or **pop**, never `--hue`. **No saturated
  gradient bands**, no full-card hue gradients.
- The deep tone is for small things: an icon, a number, a title.
- To colour one element differently, wrap it in `className="ftp-hue-<name>"`.
  For SVG/canvas that cannot read CSS variables, use `HUE_HEX` (it must match
  the CSS; the test checks it).

### Map

| Shape | Fill | Outline |
|---|---|---|
| live | `--ftp-map-live-fill` `#BFD3FB` (hover `--ftp-map-live-hover`) | `--ftp-map-live` `#2563EB` |
| locked | `--ftp-map-locked` `#E6ECF5` (hover `--ftp-map-locked-hover`) | white |

`src/components/map/mapTheme.tsx` (`geoStyle`, `MapTooltip`, `MapLegend`) is
the only place map colours are set. Paint only what is really live (a live
district, not its whole state).

## 3. Type

- **Plus Jakarta Sans for everything** (`--ftp-font-sans`): text, headings,
  labels and numbers. `--ftp-font-display`, `.ftp-display` and `.ftp-bignum`
  are old names and now resolve to Plus Jakarta.
- **Bricolage Grotesque only for the page H1** (`--ftp-font-h1`: `.ftp-h1`,
  `.ftp-page-title`). Optional; never for section titles, cards or numbers.
- **Sentence case** everywhere. No tracked-out capitals, no eyebrow labels
  above every heading.
- **Numbers use tabular figures** (`.ftp-num`, `.ftp-stat-value`,
  `font-variant-numeric: tabular-nums`) so columns line up.
- Sizes: page H1 30/36 (22/28 on phone) · section H2 21/28 (19/26) · card
  title 15–16/22 bold · body 15/22 · secondary 13–14/20 · labels 12/16.
- Local-script names sit beside the English name in `--hue-deep`, tagged with
  `lang` (`scriptLang()`), so the Noto fallback draws them.

## 4. Emoji

**Emoji appear only as module identity**, in exactly three places:

1. the sidebar / drawer item (`SIDEBAR_MODULES[].emoji`),
2. the module chip in `PageHeader`,
3. the module tile on the district overview (`.ftp-module-emoji`).

Nowhere else: not in headings, stat tiles, buttons, list rows, section
titles, chart titles, tickers, steps, callouts or running text.

Pictures that **encode data** (a pictogram "8 of every 10 houses", a weather
picture, how-it-works steps, a countdown) use **simple monochrome Lucide
icons in the hue**, not emoji.

How the kit enforces it: StatTile, Explainer, EmptyState, Pictogram,
HowItWorks, CountdownBar, WeatherGlyph, DetailSheet and DetailList still
accept an `emoji` prop (hundreds of call sites pass one) but draw the matching
Lucide icon from `src/lib/design/emoji-icons.ts` — or nothing when there is no
calm equivalent. Section and ChartCard titles draw nothing. New code passes
`icon={Coins}` instead. If a page renders an emoji itself (outside the kit),
replace it with a Lucide icon or remove it.

## 5. Components (kit)

`src/components/district/ui.tsx`:

- **`ModulePage`** — the frame (see `docs/LAYOUT.md`).
- **`PageHeader`** — a calm pastel band: white washing into the module tint,
  a small module emoji chip, the H1 in `--hue-deep`, one description line,
  then the freshness pill, source pill and actions. About 120–150 px on a
  phone. No gradient slab, no watermark, no group chip, no back link (the
  sidebar and the phone module bar do that; the props are kept and ignored).
  Pass `freshness={{ asOf, maxAgeDays }}` to get the stale notice (§6).
- **`StaleNotice`** — the calm amber "this is old" line (§6).
- **`StatTile`** / **`StatStrip`** — a white tile: small icon chip + label,
  the number in `--hue-deep` (counts up once), a sub line, "As of" + source.
- **`Card`** — white, 1 px `--ftp-border`, 14 px radius, `--ftp-shadow-1`.
  With `href` it lifts 1 px and takes a hue border on hover. `tinted` = a flat
  pastel wash.
- **`Section`** / **`SectionHeader`** — an H2 with an optional action; no emoji.
- **`Chips`** — pastel filter chips, 12 px radius, 34 px (44 on phones).
  Active = hue tint + deep text + hue border.
- **`PrimaryButton`** — the one main action on a screen: brand blue, white
  text, 12 px radius, 40 px (44 on phones), darker on hover
  (`.ftp-btn-brand`). **`ToolbarButton`** — the quiet white one.
  `.ftp-btn-primary` (class only) = a button in the page hue.
- **`DataTable`** — tint header, faint zebra, tabular numbers.
- **`EmptyState`** — one honest sentence with a small Lucide icon.
- **`DetailSheet`** + **`DetailList`** (`DetailSheet.tsx`) — tap anything to
  see everything; bottom sheet on phones, right panel on laptops. Icons, not
  emoji, in the header chip and rows.

`src/components/district/visuals.tsx`:

- **`Explainer`** — "In simple words": a lightbulb icon + one plain sentence.
- **`Pictogram`** — 10 Lucide icons, N lit in the hue (`icon={House}`).
- **`Gauge`**, **`WaterTank`** — a dial and a tank in pastel hue.
- **`WeatherGlyph`** / **`weatherIcon()`** — a weather icon (`weatherEmoji()`
  is kept for old call sites only).
- **`ChartCard`** — every chart's frame: title, units, a one-line takeaway,
  legend, "As of", source and a "Table view" switch.
- **`HowItWorks`** — numbered steps with a small icon each.
- **`CountdownBar`** — time left until a date.
- **Charts**: `ChartGradients` + `CHART_AXIS` + `chartTooltipStyle`. Use
  `url(#ftpHueFill)` / `url(#ftpHueFillH)` for bars (near-flat hue),
  `url(#ftpHueArea)` for areas, `url(#ftpMutedFill)` for the comparison
  series, `stroke="var(--hue)"` for lines. Never draw a chart from one point.

Shape and depth: radius 14 px (cards), 12 px (tiles, chips, buttons), 999 px
(pills); shadows `--ftp-shadow-1` (rest) and `--ftp-shadow-2` (hover/overlay)
only. Touch targets are at least 44 × 44 px. The focus ring is always visible.

**The module-page recipe** (see `docs/LAYOUT.md`):

1. `PageHeader` (+ stale notice when the data is old)
2. `Explainer` — the answer in one sentence
3. `StatStrip` of 3–4 `StatTile`s
4. one picture (pictogram, gauge, tank) when real data supports it
5. the main list as cards that open a `DetailSheet`
6. charts in `ChartCard`s
7. the verification section (§7)

## 6. Freshness honesty and the stale-data notice

- Every dataset shows its own date ("As of 20 Apr" / `FreshnessPill`).
- **Nothing says "Live"** unless the data is less than 30 minutes old.
- **When data is older than it should be**, say so plainly, under the page
  title, with `StaleNotice` (or `PageHeader freshness.maxAgeDays`):

  > **This data is 160 days old.** The newest data we have is from
  > 20 Apr 2026. We could not find newer data. *Check the source*

  Style (`.ftp-stale`): a calm amber note — `--ftp-warn-tint` background,
  `--ftp-warn-border` border, `--ftp-warn-text` text, a clock icon, 12 px
  radius, 14/21 text, the first sentence bold. Never red, never a full-width
  banner, never animated.
- **When the source publishes no date**: `<StaleNotice unknown />` →
  "Date not published by the source." in neutral grey-blue (`data-kind="unknown"`).
  With `PageHeader`, pass `asOf: null` (explicit null = "loaded, no date";
  `undefined` = still loading, shows nothing).
- A big headline number must not read as current when it is old: keep its
  "As of" date visible next to it.
- Suggested `maxAgeDays` per module: weather 1, dams 3, crop prices 7, news
  and alerts 3, schemes / offices / services 90, leaders 60, projects 60,
  budget = the current financial year.
- Strings live in `page_kit` (`staleTitle`, `staleBody`, `staleSource`,
  `unknownDate`), in en / hi / kn.

## 7. The verification section (bottom of every page)

One section at the bottom of each page, `id="verify"`, so "how do I know this
is true?" always has one answer. It replaces "About this page", the collapsed
"Sources (N)" and repeated disclaimers.

Content, in order:

1. **How fresh** — one row per dataset on the page: name · source (link) ·
   data date · when we last checked · status chip.
2. **How we know** — automatic feed / entered by hand / from news (N sources
   agree) / estimate (always labelled).
3. **Check it yourself** — a direct link to the source page for this district.
4. **Found a mistake?** — one button to the feedback form, prefilled with the
   module and dataset.
5. The "not a government website" line, once.

Style (classes in `globals.css`):

| Class | What |
|---|---|
| `.ftp-verify` | the white card (1 px border, 14 px radius, 18 px padding, 40 px above) |
| `.ftp-verify-title` / `.ftp-verify-lead` | 18/24 bold title; one grey line under it |
| `.ftp-verify-rows` / `.ftp-verify-row` | the dataset list: name · meta · status; hairline between rows; stacks on phones |
| `.ftp-verify-meta` | the grey "Data from … · checked …" text |
| `.ftp-status` + `data-status="ok" \| "late" \| "unknown" \| "none"` | a small chip with a dot: green "On time", amber "Late by N days", grey "Date unknown" / "Not collected" |

## 8. Motion

Subtle, and only where it helps:

- one entrance: fade + 6 px rise (`.ftp-rise`, staggered by `--i`);
- bars and rings grow in once; numbers count up once; a tank has a slow wave;
- link cards lift 1 px on hover.

No intro splash, no bouncing, no floating, no looping decoration.
`prefers-reduced-motion` turns all of it off (`globals.css`).

## 9. Words

- "Government portals and other reputed sources" (or "official government
  portals, accredited research institutions and other reputed sources").
  Never "only official" or ".gov.in only" when the page shows other sources.
- Never "scraper / scraping / scraped" in citizen text.
- Plain, short sentences. Sentence case. No sales words.
- Nothing hard-coded: every string is in en + hi + kn (`docs/I18N.md`).

## 10. Checklist before you ship a page

- [ ] No emoji outside the module chip / sidebar / overview tile.
- [ ] No saturated gradient band; big areas use the tint.
- [ ] No hex colours in the component; tokens and hue variables only.
- [ ] The first screen shows the answer and the main action.
- [ ] Every dataset has a date; old data shows the stale notice; undated data
      says "Date not published by the source".
- [ ] The verification section is at the bottom.
- [ ] Text passes AA (use `--ftp-text` / `--ftp-text-2` / `--hue-deep`).
- [ ] 44 px touch targets; nothing scrolls sideways at 320 px.
- [ ] Works with reduced motion; en / hi / kn strings exist.
