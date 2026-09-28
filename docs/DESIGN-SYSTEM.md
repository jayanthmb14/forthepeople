# ForThePeople.in — Design System v5.2 "White Calm"

The site should feel **calm, clear and trustworthy**: a quiet blue-white page,
white cards, one blue for actions, and colour only where it tells you which
dashboard you are in. Anyone should understand a screen at a glance — a
5-year-old and a 60-year-old — and every number stays honest: a date and a
source beside it, and a plain warning when it is old.

v5 "Calm" replaced v4 "Rang" (too many emoji, saturated gradient bands:
"cartoonish") and kept what worked in v3 (quiet, precise) without its
plainness. **v5.1 "Warm Calm"** (Sept 2026) keeps every v5 rule and adds
warmth: soft pastel washes on heroes, tiles and cards, a 2 px pastel ribbon
under the header and footer, gold and silver for money and metals, crafted
SVG pictures instead of emoji for categories, and a little motion that has a
job (§8).

**v5.2 "White Calm"** (28 Sept 2026) takes most of that warmth back out of
the *surfaces*. The owner compared the site with the June dashboard and
asked for the old feel: a white page where only what is needed is shown, a
few blue accents, "so it does not look fabricated or made by AI". The rule
is in §2a and wins over any older line in this file that talks about
pastel washes.

Reference implementation: the kit in `src/components/district/ui.tsx`,
`visuals.tsx` and `DetailSheet.tsx`; shared SVG glyphs in
`src/components/graphics/`; the site chrome in `src/components/home/`
(`HeaderBar`, `StatusStrip`, `Footer`) and `src/components/common/ReportButton.tsx`;
the district shell in `src/components/district/shell/`; tokens in
`src/app/globals.css`; module hues in `src/lib/design/hues.ts`.

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

## 2a. White Calm — the 80/20 rule (v5.2)

**80–90 % of every screen is white. Colour is 10–20 %, and only in small
accents.** Every module uses the same template; the only thing that differs
from one module to the next is its hue in those accents.

Allowed colour (the accents):

| Accent | Where | How |
|---|---|---|
| Hue rule, left, 3 px | page header (`PageHeader`, the overview hero), `Explainer`, `CalmNote`, a highlighted card (`Card tinted`, `TapCard wash`, `.ftp-card-tinted`), in-card notes | `box-shadow: inset 3px 0 0 var(--hue), var(--ftp-shadow-1)` or `.ftp-rule-left` |
| Hue rule, top, 2 px | a card that heads a group (the four overview picture cards, tomorrow's weather) | `inset 0 2px 0 var(--hue)` or `.ftp-rule-top` |
| Icon chip | the module chip in the header, the icon in a stat tile or card head, the drawn mark on an overview tile | `--hue-tint` background, `--hue-deep` icon, 26–44 px |
| Key numbers | the big figure in a stat tile, overview tile or card | `--hue-deep` text |
| Status | freshness dots, "On time" / "Late", stale notice | `--ftp-live*` / `--ftp-warn*` as today |
| Data | chart series, bars, rings, pictograms, a tank | `--hue` / `--hue-pop` fills on neutral tracks (`--ftp-surface-2`); inside a `ChartCard` `--hue` is always blue (see Charts below) |
| Selected | the active filter chip, the active sidebar row | `--hue-tint` + `--hue-deep` text |

Not allowed any more:

- pastel **washes** on cards, tiles, heroes, headers, sheets, notes or
  steps (`linear-gradient(… var(--hue-tint) …)`, `color-mix(… --hue-tint 60 % …)`
  as a card background);
- corner circles / "sun" blobs, sky gradients, hue-coloured card borders at
  rest (borders are `--ftp-border`; the hue border is for hover and the
  selected state);
- titles in the hue: the page H1 and card titles are `--ftp-text`
  (a local-script name beside the H1 may stay `--hue-deep`);
- tinted table headers and zebra rows (use `--ftp-surface-2`);
- `#fff` in components (use `var(--ftp-surface)`).

Page: `--ftp-bg` is a near-white `#FAFBFD`, cards are white with a 1 px
`--ftp-border`, `--ftp-surface-2` (`#F3F6FA`) is only for hovers, tracks,
skeletons and table headers. Gold stays for money (a gold rule / chip /
number, not a gold wash). The landmark drawing on the overview hero stays,
kept small (about 30 % of the hero width on a PC, a 96 px band on a phone).

Self-check for a screen: squint at a screenshot. If any block reads as a
coloured panel rather than a white card with a thin coloured edge, it is
too much.

## 2. Colour

All colours are CSS variables in `globals.css`. **No hex in components** —
write `var(--ftp-brand)`, not `#2563EB`. Hex values live only in token
definitions (see the gold and silver note below for the one temporary
exception).

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--ftp-bg` | `#FAFBFD` | page (near-white, v5.2) | — |
| `--ftp-surface` | `#FFFFFF` | cards, tiles, sheets | — |
| `--ftp-surface-2` | `#F3F6FA` | hovers, tracks, skeletons, table headers (v5.2) | — |
| `--ftp-text` | `#0F1B2D` | body text, titles | 16.2 : 1 on bg |
| `--ftp-text-2` | `#4A5A70` | secondary text, labels | 7.0 on white, 6.5 on surface-2 |
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

### Gold and silver (v5.1)

Gold and silver are for **money and metals only**: the gold and silver price
cards and ticker pictures, the budget tile and the "spent" ring on the
district overview, the Founding Builder plan, and the bronze → platinum
month medals on the supporters wall. Text on gold always uses the deep gold,
never white.

**`--ftp-gold*` and `--ftp-silver` are not defined in `globals.css` yet.**
Until they are, each area defines its own family once, in a token block at
the top of its CSS file, and every rule reads those variables:

| Where | Variables | Notes |
|---|---|---|
| `src/components/home/home.module.css` | `--home-gold`, `--home-gold-tint`, `--home-gold-ring`, `--home-silver`, `--home-silver-tint`, `--home-silver-ring` | with dark-mode values |
| `src/components/home/glyphs.module.css` | `--g-gold-hi/-/-lo`, `--g-silver-hi/-/-lo` | coin and silver-bar pictures |
| `src/app/[locale]/[state]/[district]/district-shell.css` | `--ov-gold`, `--ov-gold-deep`, `--ov-gold-pop`, `--ov-gold-tint`, `--ov-silver` | already read `var(--ftp-gold, …)` etc., so they switch over by themselves |
| `src/components/support/look.module.css` (`.metal`) | `--sup-gold*`, `--sup-bronze*`, `--sup-platinum*` | plan art and month medals |

To do: add `--ftp-gold`, `--ftp-gold-deep`, `--ftp-gold-pop`,
`--ftp-gold-tint` and `--ftp-silver` (the names `district-shell.css` already
reads) to `globals.css` with a contrast test, then point the other three
files at them and delete their local copies. New code must not add a fifth
family.

### Pastel ribbon (removed in v5.6)

v5.1 drew a 2 px four-hue line under the header and on top of the footer.
v5.6 (28 Sep 2026, owner review) removed it: the chrome is white with thin
grey rules (`--ftp-border`), like the June 2026 site, and has no gradients.

### Module hues — identity only

Every module owns one of 14 hues (`src/lib/design/hues.ts` → `MODULE_HUE`;
CSS `.ftp-hue-<name>`). `HueScope` in the district layout applies the open
module's hue, so kit components on a module page are coloured automatically.
A hue sets four variables:

| Variable | What it is | Where it goes |
|---|---|---|
| `--hue-tint` | very light | icon chips, the selected chip / row (v5.2: never a card background) |
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

- v5.2: big areas are **white**. The tint is for chips and the selected
  state only; **no pastel washes**, no saturated gradient bands, no
  full-card hue gradients (§2a).
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

The home India map (`indiaStateStyle`) draws states in four soft pastel blues
(`INDIA_LAND_TONES`, neighbours never share one; no lines, because the state
shapes are made of district pieces), `--ftp-map-live-hover` on hover or tap,
and live districts as hue pins with a small name beside them
(`src/components/map/pin-layout.ts`).

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

## 4. Emoji and pictures

**Emoji appear only as module identity**, in exactly three places:

1. the sidebar / drawer item (`SIDEBAR_MODULES[].emoji`),
2. the module chip in `PageHeader`,
3. the module tile on the district overview (`.ftp-module-emoji`).

Nowhere else: not in headings, stat tiles, buttons, list rows, section
titles, chart titles, tickers, steps, callouts or running text.
One owner-approved exception (28 Sept 2026): the 🇮🇳 flag after the home page H1 (June wording), marked `role="img"` with the label "India".

Pictures that **encode data** (a pictogram "8 of every 10 houses", a weather
picture, how-it-works steps, a countdown) use **simple monochrome Lucide
icons in the hue**, not emoji.

**Categories get crafted SVG glyphs, never emoji** (v5.1).
`src/components/graphics/` holds about 56 drawn glyphs on one 24 px grid, in
soft duotone that uses only the hue variables (no hex):

- `CategoryGlyph`: a glyph bare, or on a pastel tile (`chip`), 16–48 px.
- Helpers pick the glyph and hue for a category: `newsTopicGlyph`,
  `newsStoryGlyph`, `crimeGlyph`, `projectKindGlyph`, `moduleGlyph`, and
  `categoryGlyph` for any text.
- `GlyphChips` (filter chips), `GlyphBarList` ("how many of each kind"),
  `GlyphStack` (a few overlapping chips, e.g. an "All" tile), `GlyphScene`,
  `GlyphEmptyState` (an empty state with a small illustration).
- Used today on News (topics, stories, the story sheet), Police (crime types,
  helplines, the station sheet), Infrastructure (kinds of project on
  chips, cards, the sheet and both charts) and the India pages (every
  module, topic and card; `src/components/india/glyphs.ts` picks the glyph
  for a module slug, category or super-category, and `medalPick()` gives
  gold, silver and bronze).
- Adding one: draw it in `glyph-data.ts`, give it a hue in `GLYPH_HUE`
  (`category-map.ts`), map the words to it, extend
  `tests/category-glyph.test.ts`.

Other drawn pictures, all SVG in tokens and hue variables:

| Picture | Where | Notes |
|---|---|---|
| Weather pictures | `src/components/weather/WeatherArt.tsx` | the weather page uses these, not the kit's `WeatherGlyph`; 13 weather kinds from `src/lib/weather/codes.ts`; gentle motion on the big picture only |
| Price pictures | `src/components/home/HomeGlyphs.tsx` | coin, silver bar, chart, note, oil drop, sprout (ticker and price cards) |
| Product marks | `src/components/home/products.tsx` | ForThePeople.in, Connect, Jobs (apps switcher and footer) |
| District overview art | `src/components/district/shell/overview-art.tsx` | hero landscape, card marks |
| Courts | `src/app/[locale]/[state]/[district]/courts/_parts/CourtArt.tsx` | the balance scale (grew / shrank) |
| Support plans | `src/components/support/TierArt.tsx` | one picture per plan |

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
- **`PageHeader`** — (v5.2) a white card with a 3 px hue rule on its left
  edge, a small module emoji chip on the tint, the H1 in `--ftp-text`, one
  description line,
  then the freshness pill, source pill and actions. About 120–150 px on a
  phone. No gradient slab, no watermark, no group chip. The back link shows
  only on nested pages (a tender inside Tenders, a taluk, admin); on a
  module's own page the sidebar and the phone module bar already lead back.
  Pass `freshness={{ asOf, maxAgeDays }}` to get the stale notice (§6).
- **`StaleNotice`** — the calm amber "this is old" line (§6).
- **`StatTile`** / **`StatStrip`** — a white tile: small icon chip + label,
  the number in `--hue-deep` (counts up once), a sub line, "As of" + source.
- **`Card`** — white, 1 px `--ftp-border`, 14 px radius, `--ftp-shadow-1`.
  With `href` it lifts 1 px and takes a hue border on hover. `tinted` = a
  3 px hue rule on the left (v5.2; no wash).
- **`Section`** / **`SectionHeader`** — an H2 with an optional action; no emoji.
- **`Chips`** — pastel filter chips, 12 px radius, 34 px (44 on phones).
  Active = hue tint + deep text + hue border.
- **`PrimaryButton`** — the one main action on a screen: brand blue, white
  text, 12 px radius, 40 px (44 on phones), darker on hover
  (`.ftp-btn-brand`). **`ToolbarButton`** — the quiet white one.
  `.ftp-btn-primary` (class only) = a button in the page hue.
- **`DataTable`** — neutral `--ftp-surface-2` header in `--ftp-text-2`, faint neutral zebra, tabular numbers.
- **`EmptyState`** — one honest sentence with a small Lucide icon.
- **`DetailSheet`** + **`DetailList`** (`DetailSheet.tsx`) — tap anything to
  see everything; bottom sheet on phones, right panel on laptops. Icons, not
  emoji, in the header chip and rows. The support checkout popup uses the
  same sheet.

`src/components/graphics/` (§4): `CategoryGlyph`, `GlyphChips`,
`GlyphBarList`, `GlyphStack`, `GlyphScene`, `GlyphEmptyState`. The kit's
`Chips` and `EmptyState` do not take a glyph yet; use the graphics versions
where a category needs a picture.

`src/components/district/visuals.tsx`:

- **`Explainer`** — "In simple words": a white card with a 3 px hue rule, a lightbulb icon chip + one plain sentence.
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
  **v5.5 (Sept 2026): every chart is blue.** `ChartCard` puts
  `CHART_HUE_CLASS` (`ftp-hue-blue`) on its frame, so `var(--hue)` and the
  gradients inside any chart draw in one soft blue (grey for comparisons),
  whatever the module; the module hue stays on the header, icons and chips.
  `HueDonut` uses soft blues and greys. Axis labels are 12 px.

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
   data date · when we last checked · status chip. v5.1 adds the
   **double-check** status from `/api/data/verification`: "Double-checked"
   (listing each source that agreed or not, with dates), "One source only",
   "Sources disagree" or "Not double-checked yet". The overview shows a row
   of coloured chips and a "Double-checked?" column. If the route fails, the
   panel looks exactly as in v5.
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

Subtle, and only where it helps. Every animation has a job, and
`prefers-reduced-motion` turns **all** of it off (`globals.css` and each
module's own `@media (prefers-reduced-motion: reduce)` block).

Everywhere:

- one entrance: fade + 6 px rise (`.ftp-rise`, staggered by `--i`);
- bars and rings grow in once; numbers count up once (stat tiles, the
  overview's number tiles, the home stats row); a tank has a slow wave;
- link cards lift 1 px on hover; menus and sheets slide in once.

v5.1 additions, each with a purpose:

| Motion | Where | Why / limits |
|---|---|---|
| Branded intro, 1.2 s | home (`HomeIntro`) | once per session; any tap or key skips it; recorded as seen for the session |
| Running price ticker | home (`PriceTicker`) | pauses on hover or focus and has a pause button; under reduced motion it is a still row you can scroll sideways |
| Live-district ping | home map pins | marks what is live |
| Market-open ping | status strip dot | slow, only while the market is open |
| Weather picture | weather page | sun turning, rain falling, a cloud drifting; big picture only |
| Balance sway | courts page | only while loading |

Never: bouncing, motion on text, motion that carries no meaning, or anything
that runs under reduced motion.

## 9. Site chrome (v5.1, calmer in v5.6)

v5.6 rule: the chrome is 80–90 % white. Thin `--ftp-border` rules, no
ribbons, washes or filled pills; colour only in small marks (the flat blue
logo tile, the blue district pin, the rose Support text, icon strokes in
their hue, the market and freshness dots).

Built in `src/components/home/` (`chrome.module.css`) and
`src/components/common/`:

- **Disclaimer line** above the header: `--ftp-bg`, 12/17 text, lined
  up with the header's edges.
- **Header:** full width and sticky, 56 px. The logo sits in the left corner
  (24 px in, 28 px from 1440 px) and the actions in the right corner, on a
  translucent white with a light blur and one thin grey rule under it.
- **Apps switcher:** hovering the logo with a mouse, or pressing the small ▾
  next to it (44 px touch area), opens "ForThePeople apps": ForThePeople.in
  (you are here), Connect and Jobs. Connect and Jobs are marked "Coming
  soon", are not links, and each has its drawn mark.
- **Right side:** search, language, "Vote on features", GitHub with the star
  count, and Support as a white pill with rose text and a thin rose border
  (`--ftp-support*`; the rose tint only on hover). Below 1024 px,
  Vote, GitHub and Support move into a "Menu" button; on phones the apps list
  moves there too, the district chip doubles as search, and the language
  button always stays in the row.
- **Status strip** under the header, a labelled group, white and **centred
  on every width**: weekday, date and an IST clock that updates each minute
  (drawn in the browser only); "Share market open / closed" only when the
  rules are sure (green dot with a slow ping when open, a grey ring when
  closed); on district pages "Live data refreshed N ago" when every live
  feed is on time. It is the only clock on the site.
- **District bar** (district pages): the state › district › taluk switchers
  and a pill such as "3 of 5 live feeds up to date" — green when all are
  current, amber when any is late (v5.6: no second clock). On phones and
  tablets the pill sits centred in one thin white line under the bar, and
  the line is left out when there is nothing to say.
- **Report button:** a pill "Report a problem" in the bottom-right corner on
  PC and tablet; a 44 px round flag on phones. It opens a short form (kind of
  problem, what is wrong, optional email). Focus stays inside, Escape closes.
  Hidden on admin pages and India module pages. On district pages it is the
  only report form (v5.3): it sends the state, district and module with the
  report.
- **Footer:** plain white with one thin rule on top; each column title has
  a small icon in its hue (no tinted tile); links include Prices today, Vote
  for a district, Vote on features and GitHub stars; a "Coming soon from
  ForThePeople" row shows Connect and Jobs as two white cards. Every width
  keeps 76 px at the bottom so the Report button never covers the last
  line. The last line reads "Built by Jayanth M B" (the name links
  to his LinkedIn, new tab) and "Free expression under Article 19(1)(a)".
- **Slim footer (v5.3):** district pages (overview, every module, taluk and
  village page) and India module pages end with one thin line instead: the
  logo mark, "Built by Jayanth M B", About · Privacy · Disclaimer and a
  "More" button that opens the full footer in place (a disclosure with
  `aria-expanded`; grows smoothly, then scrolls into view; no animation under
  reduced motion; closed again on the next page). The line keeps its right
  end clear of the Report button. Rule: `footer-mode.ts`; frame:
  `FooterFrame.tsx`.

## 10. District overview (v5.1, calmed in v5.2)

v5.2 "White Calm" overrides the washes below: the hero is a white card with
the 3 px hue rule, a neutral line of hills and a small landmark drawing (no
sky, no sun glow); number tiles are white with the drawn picture on a small
tint chip and the number in `--hue-deep` (gold number and chip for the
budget; amber / red border and chip for warnings); the four picture cards
are white with a 2 px hue rule on top, the mark on a tint chip and the
title in `--ftp-text`; the report card is white with a brand-blue rule;
taluk chips and topic rows are white with a neutral hover.


Styles in `district-shell.css`; parts in `src/components/district/shell/`:

- **Hero:** a pastel sky in the district's own colours, a sun glow, hills
  along the bottom and the landmark drawing (a generic drawn landscape where
  a district has none). A kicker reads, for example, "Karnataka · 7 taluks".
- **Number tiles:** each tile in its module's pastel, with a drawn picture, a
  number that counts up once, and where the number comes from. The budget
  tile is gold and says "Old year" once that financial year has ended
  (`shell/fiscal.ts`). A small green shield means the dataset is
  double-checked; an amber warning means the sources disagree. Tiles wrap so
  no empty cell is left.
- **Four picture cards** (`OverviewCard`): a soft wash of the card's hue
  fading to white, a drawn mark in a white medallion, the title in the deep
  hue, "View all" as a small pill.
  - Leaders: round initials badges, and a dashed "?" when a name is not
    published.
  - People: a literacy ring ("70 of every 100 people can read and write")
    and women-vs-men bars.
  - Projects: one status bar with a legend.
  - Money (`MoneySnippet`, gold tone): a gold "spent" ring.
- **Report card** (folded): a soft blue wash and a row of ten coloured bars,
  one per area.
- News and alerts stay lower down. The glance row shows only on the
  overview, not above module pages.

## 11. Support page (v5.1)

- Each plan has its own pastel hue (via `ftp-hue-<name>`, `tier-look.ts`) and
  a drawn picture: one-time gift **rose** (the support colour), District
  Champion **blue**, State Champion **teal**, All-India Patron **violet**,
  Founding Builder **gold** (the yellow hue plus the gold accents, with a gold
  edge).
- The header sits on a soft rose-and-blue wash; "How to subscribe" has three
  coloured steps; the "Where the money goes" bars are coloured.
- Paying opens a popup on `DetailSheet`. Errors appear only after a field is
  left, or all together with a short amber note on Continue.
- The supporters wall and `/contributors` use the same plan colours:
  initials avatars, a coloured plan tag, month badges as small bronze /
  silver / gold / platinum medals, and a colour key. A name that looks like a
  phone number or email is shown as "Supporter".
- The home support band is soft rose and gold, with a few real supporter
  names (Founding Builder first) and no amounts.

## 12. Words

- "Government portals and other reputed sources" (or "official government
  portals, accredited research institutions and other reputed sources").
  Never "only official" or ".gov.in only" when the page shows other sources.
- Never "scraper / scraping / scraped" in citizen text.
- Plain, short sentences. Sentence case. No sales words.
- Nothing hard-coded: every string is in en + hi + kn (`docs/I18N.md`).

## 13. Checklist before you ship a page

- [ ] No emoji outside the module chip / sidebar / overview tile; categories
      use glyphs from `src/components/graphics`.
- [ ] Gold / silver only for money and metals, from a token (§2).
- [ ] No saturated gradient band and no pastel wash; big areas are white,
      colour only as the accents in §2a (80–90 % white).
- [ ] No hex colours in the component; tokens and hue variables only.
- [ ] The first screen shows the answer and the main action.
- [ ] Every dataset has a date; old data shows the stale notice; undated data
      says "Date not published by the source".
- [ ] The verification section is at the bottom.
- [ ] Text passes AA (use `--ftp-text` / `--ftp-text-2` / `--hue-deep`).
- [ ] 44 px touch targets; nothing scrolls sideways at 320 px.
- [ ] Every animation has a job and is off under reduced motion; en / hi /
      kn strings exist.
