# Design system — v3 "Civic Ledger"

Written 2026-09-27. The binding concept is CONCEPT-v3 (design scratchpad, §2
principles). This page is the short, practical version for anyone editing a
citizen-facing page. Everything here is enforced by three files:

| What | Where |
|---|---|
| Tokens (colours, radii, fonts, layout utilities) | `src/app/globals.css` — the `DESIGN v3` block |
| Component kit | `src/components/district/ui.tsx` |
| Module groups + rail | `src/lib/constants/sidebar-modules.ts`, `src/components/layout/Sidebar.tsx` |

## The rules (from CONCEPT-v3 §2)

1. **Calm density.** No gradients, shadows, glow, count-ups or pulsing. The one
   allowed animation is the 6 px live dot when data is under 30 minutes old.
2. **One grid.** `.ftp-container` = max 1200 px, 24 px side padding (16 on
   phones). `.ftp-grid-12` = 12 columns, 24 px gutter. District pages: 240 px
   rail + content column with a 960 px reading width.
3. **One type system.** Plus Jakarta Sans 400/500; 600 only for a page H1.
   Numbers are JetBrains Mono 500 with tabular figures (`.ftp-num`).
4. **Tokens only. No hex in components.** Write `var(--ftp-brand)`, never
   `#2563EB`. Semantic colour appears as text or a 6 px dot, never a stripe,
   gradient or nested tinted box.
5. **Honest freshness.** Every number that can go stale shows "As of <date>" or
   a `FreshnessPill`. "Live" means under 30 minutes. Never say "real-time".
6. **Bilingual identity.** Local-script names come from the dictionary
   (`titleLocal`), never machine translation.
7. **Sources are first-class.** A `SourcePill` beside headline numbers and a
   `SourcesFooter` on every module page.
8. **Lucide icons only** (16/18/20 px). No emoji in chrome.
9. **Accessible as drawn.** Real buttons and links, 44 px targets on phones,
   4.5:1 contrast, one `<h1>` per page, visible focus, reduced motion respected.

## Tokens (`:root` in globals.css, dark variants under `[data-theme="dark"]`)

```
Surfaces   --ftp-bg  --ftp-surface  --ftp-surface-2  --ftp-border  --ftp-border-strong
Text       --ftp-text  --ftp-text-2
Brand      --ftp-brand  --ftp-brand-deep  --ftp-brand-tint
Semantic   --ftp-live/-tint/-text  --ftp-warn/-tint  --ftp-danger/-tint
           --ftp-features/-tint  --ftp-support/-tint
Map        --ftp-map-live  --ftp-map-locked
Shape      --ftp-radius-card 12px  --ftp-radius-tile 8px  --ftp-radius-pill 999px
Type       --ftp-font-sans  --ftp-font-mono   (aliases of the next/font variables)
Layout     --ftp-container-max 1200  --ftp-reading-max 960  --ftp-gutter 24
           --ftp-rail-width 240  --ftp-rail-collapsed 56
```

Module accents (icon tints only) reuse the `--accent-<name>-700` ramps:
civic → purple · money → amber · services → teal · accountability → slate ·
community → pink. `getModuleAccent(slug)` in sidebar-modules.ts returns the
name; `PageHeader accent="teal"` applies it.

## Type scale (CSS classes)

| Class | Size / line | Weight | Use |
|---|---|---|---|
| `.ftp-h1` | 36 / 40 (28 / 32 phone) | 600 | District overview H1 only |
| `.ftp-h2` | 22 / 28 | 500 | Section titles, module page H1 |
| `.ftp-title` | 15 / 22 | 500 | Card titles |
| `.ftp-body` | 13 / 20 | 400 | Body text |
| `.ftp-label` | 11 / 16, uppercase, +0.04em | 500 | Labels above numbers |
| `.ftp-num` | inherits size | 500 mono, tabular | Every number |

## Kit exports (`@/components/district/ui`)

**Page structure**
- `PageHeader({icon, title, titleLocal?, description, backHref, freshness?, source?, actions?, accent?})`
- `Section({title, titleLocal?, action?, children})`, `SectionHeader` (row only)
- `Card({children, padding?, as?, href?})`, `CardGrid({children, cols?})`
- `Toolbar({children})` + `ToolbarButton({icon?, children, onClick?|href?})`
- `SourcesFooter({sources: [{name, url?, licence?, frequency?}], methodologyHref?})`

**Numbers and freshness**
- `StatTile({label, value, unit?, sub?, asOf?, trend?, icon?, source?})`
- `StatStrip({children, cols?})` — 2/3/4 tiles, 2 × 2 on phones
- `FreshnessPill({asOf, status?, thresholdHours?})` — renders nothing without `asOf`
- `SourcePill({label, href?})`, `AsOfText({asOf})`
- `describeFreshness(asOf, status?)` and `formatIST(date)` — pure helpers
- `ProgressBar({value, max | pct, label?, tone?})`, `KpiRing({score, grade})`

**Lists, filters, states**
- `DataTable({columns, rows, dense?, emptyText?})` — zebra, sticky header, mono numerics
- `Pill({tone, dot?, icon?})`, `Chips({items, value, onChange})`
- `LoadingShell({rows?})`, `ErrorBlock({message?, onRetry?})`, `EmptyState({title, body?, action?})`
- `InfoCard`, `AIInsightBanner`, `SeverityBadge`, `CacheBadge`, `LastUpdated`

**Legacy wrappers (keep compiling, migrate when you touch the page)**
`ModuleHeader → PageHeader` (`liveTag` ignored) · `StatCard → StatTile`
(`accent` ignored) · `SectionLabel → SectionHeader` · `EmptyBlock → EmptyState`
(`icon` ignored) · `LiveBadge({asOf?})` → FreshnessPill, nothing without a date ·
`LastUpdatedBadge → FreshnessPill`.

## Hooks and helpers

- `useFreshness(stateSlug, districtSlug)` — one cached fetch of
  `/api/data/freshness` per district (5 min), `forModule("crops")` → `{asOf, status}`.
- `useMyDistrict()` — the visitor's remembered district (`ftp.myDistrict`,
  written only while "Remember my district" is on).
- `src/lib/geo/locate.ts` — `pointInPolygon`, `findStateForPoint`,
  `nearestDistrict`, `haversineKm`, `STATE_NAME_TO_SLUG` (pure, unit-tested).
- `src/lib/geo/district-centroids.ts` — HQ-town lat/lng per district; a TODO
  list of districts still missing a value lives at the top of the file.
- `src/components/home/YourDistrictStrip.tsx` — the "Find my district" row.
  Not mounted yet. Coordinates never leave the browser.

## Checks before you commit a page

```
npx tsc --noEmit                                         # 0 errors
npx eslint <files you touched>                           # 0 errors
grep -nE '#[0-9A-Fa-f]{6}' <files you touched>           # 0 hits (globals.css excepted)
grep -nP "[\x{1F300}-\x{1FAFF}]" <files you touched>     # 0 emoji in chrome
```

One `<h1>` per page; every stale-able number has an `asOf` or FreshnessPill;
module pages end with `SourcesFooter` and a `Toolbar`.
