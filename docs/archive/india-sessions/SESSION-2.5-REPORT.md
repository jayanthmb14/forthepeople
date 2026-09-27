# Session 2.5 Report — Visual Redesign of /en/india (2026-04-29 unattended)

## Summary

Single Claude Code session executed all 6 sub-phases (2.5a → 2.5f) of
the India dashboard visual redesign. The page now has a sticky left
rail nav (with mobile chip-strip fallback), a Grid mode with India
choropleth + 12 metric tiles + bar/table sub-views, a full per-module
deep-dive route at /en/india/[moduleSlug] for all 53 modules with 11
sections each, 18 bespoke category SVG hero illustrations, scroll
reveal + count-up + progress-bar animations (with prefers-reduced-motion
support), and a floating Sources button + slide-out panel reachable
from anywhere on the page. SEO additions: per-module title +
description + 9 long-tail keywords + hreflang + JSON-LD Dataset
schema; sitemap extended to all 53 module routes + /en/india/updates.
8 local commits, no push, no DB writes, no real data — every numeric
that surfaces today comes from a clearly-banner-marked mock file.

## Sub-phases completed

- [✓] **Phase 2.5a** — Left rail nav (240px, sticky) at ≥1024px;
       mobile chip-strip below 1024px; old IndiaSectionNav deleted.
- [✓] **Phase 2.5b** — `?view=grid` toggle; 12 metric-tile picker;
       India choropleth + state tooltip + click-select; sub-toggle
       Choropleth | Bar | Table; sticky right sidebar with Top-3 /
       Bottom-3 / State drill.
- [✓] **Phase 2.5c** — Dynamic route `/[locale]/india/[moduleSlug]`
       with 11 sections per module (breadcrumb, hero, optional legal
       note, choropleth, time series, leaderboard, AI analysis card,
       news strip, coming-soon sub-features, related modules, sources
       panel). All 53 routes resolve. IndiaAnalysis Prisma model
       appended (no db push). MOCK_ANALYSES + 5 helper functions on
       IndiaModuleDef. "View full dashboard →" added to band headers.
- [✓] **Phase 2.5d** — 18 bespoke category SVG hero illustrations
       (one per IndiaModuleCategory). Tiger SVG given canonical
       treatment per spec. CategorySvg index swapped from Lucide
       fallback to bespoke SVGs. Zero govt iconography.
- [✓] **Phase 2.5e** — 5 animation primitives: usePrefersReducedMotion,
       RevealOnScroll, AnimatedCounter, AnimatedProgressBar,
       AnimatedDemographicBar. Wired into IndiaSectionBand,
       IndiaStateLeaderboard, IndiaHero. CSS-transform only,
       reduced-motion respected end-to-end.
- [✓] **Phase 2.5f** — Floating Sources button + slide-out side panel
       (search + group-by-domain + per-source module chips + trust
       line + mailto inaccuracy report). Old IndiaDataSourcesIndex
       deleted. Sitemap extended to 55 /en/india* URLs. JSON-LD
       Dataset schema per module page.
- [✓] End-of-session cross-check (a-h)
- [✓] Session report

## Stop signs (per sub-phase)

| Phase | Stop sign | Status |
|---|---|---|
| 2.5a | Left rail visible ≥1024px, top chips <1024px | ✅ |
| 2.5a | Click "Wildlife" jumps to wildlife band | ✅ (IntersectionObserver scroll-spy) |
| 2.5b | ?view=grid renders | ✅ HTTP 200 |
| 2.5b | 12 metric tiles clickable | ✅ |
| 2.5b | Map recolors per metric | ✅ (mockColorScale linear interpolation) |
| 2.5b | Choropleth/bar/table sub-views all work | ✅ (same dataset, three lenses) |
| 2.5b | Toggle persists in URL | ✅ ?view=grid in href |
| 2.5c | 53 sub-routes resolve | ✅ 53/53 = 200 |
| 2.5c | Live module shows full deep-dive | ✅ /en/india/wildlife-tigers |
| 2.5c | Coming-soon module shows shell + "activating soon" | ✅ /en/india/livestock-fisheries |
| 2.5c | Breadcrumbs work | ✅ India › Category › Module |
| 2.5c | Related modules link correctly | ✅ getModuleRelatedSlugs auto-fill |
| 2.5d | 18 SVG components exist | ✅ |
| 2.5d | /en/india/wildlife-tigers shows tiger SVG | ✅ <title>Wildlife</title>, 4 stripe paths |
| 2.5d | All other module pages show category SVG | ✅ 8 sampled categories matched |
| 2.5d | No flag/emblem/govt iconography | ✅ explicit comments in SvgDefence + SvgBudget |
| 2.5e | Every band fades in smoothly | ✅ RevealOnScroll wrapping IndiaSectionBand |
| 2.5e | Numbers count up when in view | ✅ AnimatedCounter on hero KPI tiles |
| 2.5e | Progress bars fill | ✅ AnimatedProgressBar in StateLeaderboard rows |
| 2.5e | prefers-reduced-motion disables everything | ✅ single shared hook |
| 2.5f | Sources floating button visible on /en/india | ✅ "Open data sources panel" present |
| 2.5f | Side panel opens with all sources | ✅ search + group-by-domain + module chips |
| 2.5f | JSON-LD Dataset on /en/india/wildlife-tigers | ✅ "@type":"Dataset" verified |
| 2.5f | Sitemap includes all 53 module routes | ✅ 55 /en/india* URLs total |

## Cross-check raw output

### a. `npx next build`
```
ƒ Proxy (Middleware)
○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

├ ● /[locale]/india/[moduleSlug]                              15m      1y
│ ├ /en/india/national-snapshot
│ ├ /en/india/demographics-population
│ ├ /en/india/economy-gdp
│ … (53 routes total, all SSG-prerendered for en)
├ ƒ /[locale]/india/updates
├ ƒ /api/india/module/[slug]
├ ƒ /api/india/snapshot
├ ƒ /api/india/suggestions
├ ƒ /api/india/suggestions/[id]/vote
├ ƒ /api/india/updates
```
Clean. Only pre-existing Sentry deprecation warnings (unrelated).

### b. `npx tsc --noEmit`
```
(zero output, exit 0)
```

### c. `npx eslint src/components/india/ src/app/[locale]/india/ src/lib/india/`
```
0 errors, 4 warnings (all "Unused eslint-disable directive" on
animation primitives — purely cosmetic, safe to ignore)
```

### d. No-hardcoded-data audit
All hits remaining are CSS layout values (1024px breakpoint, 1200px
section max-width, 1280px grid max-width). Zero data hits.

### e. No "scrap*" in user-facing strings
4 hits, all JSDoc comments (lines start with " * ") — explicitly
allowed by file 32 §0 RULE 7.

### f. All 53 module routes resolve
```
Total: 53 | OK: 53 | FAIL: 0
```

### g. Sitemap module routes
```
55 /en/india* URLs (53 modules + /en/india + /en/india/updates)
```

### h. `git status`
```
On branch main
Your branch is ahead of 'origin/main' by 21 commits.
nothing to commit, working tree clean
```

## Commits made (NOT pushed)

```
ed7c7d2 fix(india): lint cleanup before Phase 2.5 cross-check
348b12d feat(india): consolidated sources panel + full SEO pass        ← 2.5f
b64cc3c feat(india): reveal-on-scroll + count-up + animated bars       ← 2.5e
22bd1cc feat(india): 18 category-level SVG hero illustrations          ← 2.5d
2c2d9d3 feat(india): per-module deep-dive routes (53 modules)          ← 2.5c
9e20519 feat(india): grid view with India choropleth + metric picker   ← 2.5b
6e00723 feat(india): left rail nav with category grouping              ← 2.5a
```

## Files created (tree)

```
src/app/[locale]/india/
└── [moduleSlug]/
    ├── page.tsx                       (NEW — dynamic route + JSON-LD)
    └── opengraph-image.tsx            (NEW — per-module OG via next/og)

src/components/india/
├── IndiaLeftRailNav.tsx               (NEW — Phase 2.5a)
├── IndiaTopChipNav.tsx                (RENAMED from IndiaSectionNav)
├── IndiaChoroplethMap.tsx             (NEW — Phase 2.5b)
├── IndiaMetricPicker.tsx              (NEW — Phase 2.5b)
├── IndiaViewToggle.tsx                (NEW — Phase 2.5b)
├── IndiaGridView.tsx                  (NEW — Phase 2.5b)
├── IndiaSourcesSidePanel.tsx          (NEW — Phase 2.5f)
├── IndiaSourcesButton.tsx             (NEW — Phase 2.5f)
├── animations/
│   ├── usePrefersReducedMotion.ts     (NEW — Phase 2.5e)
│   ├── RevealOnScroll.tsx             (NEW)
│   ├── AnimatedCounter.tsx            (NEW)
│   ├── AnimatedProgressBar.tsx        (NEW)
│   └── AnimatedDemographicBar.tsx     (NEW)
├── module-page/                       (Phase 2.5c — 10 components)
│   ├── ModulePage.tsx
│   ├── ModuleHero.tsx
│   ├── ModuleStateMap.tsx
│   ├── ModuleTimeSeries.tsx
│   ├── ModuleStateLeaderboard.tsx
│   ├── ModuleAIAnalysisCard.tsx
│   ├── ModuleNewsStrip.tsx
│   ├── ModuleSourcePanel.tsx
│   ├── ModuleRelatedModules.tsx
│   └── ModuleComingSoonRail.tsx
└── svg/                               (Phase 2.5d — 18 SVGs + base + index)
    ├── SvgBase.tsx                    (shared frame + types)
    ├── index.tsx                      (CategorySvg map: category → component)
    ├── SvgSnapshot.tsx
    ├── SvgDemographics.tsx
    ├── SvgEconomy.tsx
    ├── SvgBudget.tsx
    ├── SvgAgriculture.tsx
    ├── SvgLivestock.tsx
    ├── SvgWildlife.tsx                (*** Tiger — Jayanth's canonical ***)
    ├── SvgInfrastructure.tsx
    ├── SvgEnergy.tsx
    ├── SvgHealth.tsx
    ├── SvgEducation.tsx
    ├── SvgDefence.tsx                 (no insignia, no emblem)
    ├── SvgJustice.tsx
    ├── SvgElections.tsx
    ├── SvgScience.tsx
    ├── SvgTrade.tsx
    ├── SvgTourism.tsx
    └── SvgSports.tsx

src/lib/india/
├── india-design.ts                    (Phase 2 — UNCHANGED)
├── india-modules.ts                   (extended — 5 optional fields + 5 helpers)
├── india-sources.ts                   (Phase 2 — UNCHANGED)
├── india-formatters.ts                (Phase 2 — UNCHANGED)
├── scraping-tiers.ts                  (Phase 2 — UNCHANGED)
├── mock-state-data.ts                 (NEW — Phase 2.5b — MOCK BANNER)
└── mock-ai-analysis.ts                (NEW — Phase 2.5c — MOCK BANNER)

prisma/
└── schema.prisma                      (appended IndiaAnalysis model — no push)
```

Files deleted:
- `src/components/india/IndiaSectionNav.tsx`         (replaced by IndiaLeftRailNav + IndiaTopChipNav)
- `src/components/india/IndiaDataSourcesIndex.tsx`   (replaced by Sources panel)

## Files modified (with line counts)

| File | Δ | Why |
|---|---|---|
| `src/components/india/IndiaPage.tsx` | +60 / −20 | Grid layout for rail/content; view toggle; mount IndiaSourcesButton |
| `src/components/india/IndiaSectionBand.tsx` | +30 / −5 | RevealOnScroll wrapper, optional locale prop, "View full dashboard →" link |
| `src/components/india/IndiaTodaySnapshot.tsx` | +2 / 0 | id="india-today" + scrollMarginTop |
| `src/components/india/IndiaComingSoonRail.tsx` | +2 / 0 | id="india-coming-soon" + scrollMarginTop |
| `src/components/india/IndiaHero.tsx` | +18 / −5 | AnimatedCounter wrapper + AnimatedHeroValue helper |
| `src/components/india/IndiaStateLeaderboard.tsx` | +30 / −15 | AnimatedProgressBar per row + restructured row layout |
| `src/components/india/module-page/ModulePage.tsx` | +1 / 0 | mount IndiaSourcesButton |
| `src/app/[locale]/india/page.tsx` | +6 / −3 | searchParams.view → IndiaPage view prop |
| `src/app/[locale]/india/[moduleSlug]/page.tsx` | +35 / 0 | JSON-LD Dataset schema |
| `src/app/sitemap.ts` | +18 / −1 | 53 module routes + /en/india/updates |
| `src/lib/india/india-modules.ts` | +60 / 0 | 5 optional fields + 5 helper functions |
| `prisma/schema.prisma` | +18 / 0 | IndiaAnalysis model (no push) |

## Mock data inventory

**CRITICAL** for Session C1: every file below contains placeholder data.
The numbers / paragraphs render today only so the layout is reviewable.
Real values land in Session C1 (you authoring) or Session C2 (scrapers).

Banner string to grep for ALL of them at once:
```
rg -n "MOCK DATA — replace in Session C1|MOCK ANALYSIS — replace in Session C1" forthepeople/src
```

| File | Banner | Affected surface |
|---|---|---|
| `src/lib/india/mock-state-data.ts` | `MOCK DATA — replace in Session C1` | Choropleth + bar + table + leaderboards on Grid view AND every module deep-dive page (state values, all 12 metrics × 36 states) |
| `src/lib/india/mock-ai-analysis.ts` | `MOCK ANALYSIS — replace in Session C1` | "What this data says" card on every module deep-dive (53 entries, generic placeholder bodies) |
| `src/components/india/IndiaGridView.tsx` | inline `MockBanner` strip at top of Grid view | Visible amber banner so users see "this is mock data" without leaving the page |
| `src/components/india/module-page/ModuleAIAnalysisCard.tsx` | small "MOCK" pill next to the "What this data says" header | Same intent — visible mock indicator |

In-component "TODO" markers also worth grepping:
```
rg -n "TODO_RESEARCH|TODO_SVG|data-todo-svg" src/
```
(Currently zero — Phase 2.5d shipped all 18 SVGs so no TODO_SVG markers remain.)

## Decisions / deviations

1. **Sticky-rail "Today" rail item** maps to the `#india-today` anchor
   (Today Snapshot section) rather than the National Snapshot band.
   "Today" is the dictionary's first nav entry and is what users
   expect to land on first. The National Snapshot category is reachable
   by scrolling further or by clicking its band header directly.

2. **18 nav items in the rail, but only 16-18 ever render** — depends
   on which categories have at least one live OR coming-soon module.
   Today is always present. Two categories (livestock, elections) have
   only coming-soon modules currently — they render at 60% opacity
   with "Soon" tag and route to the Coming Soon Rail anchor.

3. **Mock data is deterministic.** Every state-by-metric value is
   string-hash seeded so re-renders produce identical numbers without
   needing a 432-row lookup table. Range targets are deliberately
   rounded (e.g. forest cover 4–78%) so they read as PLACEHOLDERS,
   not citations.

4. **JSON-LD Dataset license set to NDSAP URL.** Used the canonical
   data.gov.in NDSAP page URL as the license property. If you'd like
   per-source license overrides, add a `license` field to IndiaSource
   later.

5. **OpenGraph image is a minimal Edge-runtime ImageResponse.**
   Brand strip + tricolor dots + module title + tagline + accent
   ribbon. Stays minimal so build-time generation across 53 routes
   is fast. No external font files, no images — pure CSS-in-JSX.

6. **Tiger SVG given extra detail per spec** — body, head turned
   toward viewer, ears, eyes-as-dots, snout, tail, four stripe lines
   along the torso. Other category SVGs are intentionally simpler
   (Jayanth's commission scope). All 18 are line-art-only with the
   8% tint fill rule from the design system.

7. **"View full dashboard →" link is right-aligned** in each
   IndiaSectionBand header (using `marginLeft: auto`). Keeps the
   visual hierarchy right-to-left consistent with "Coming soon" tags
   elsewhere.

8. **Animation reveal threshold tuned to 5%** (rootMargin
   `0px 0px -10% 0px`, threshold 0.05). Means bands start fading in
   when ~5% has scrolled into view — feels natural without firing
   too early (scroll noise) or too late (feels delayed).

## Anything that blocked or skipped

Nothing blocked outright. Two deliberate skips:

1. **Homepage "top 10 modules under the CTA" section** — Phase 2.5f
   asked for `Homepage adds direct links to top 10 modules under the
   "Explore the whole India" CTA (NEW small section)`. That violates
   the absolute rule "NEVER touch district pages or homepage except
   to confirm they're unaffected." The homepage CTA already points
   at /en/india (Session A); from there visitors find the rail and
   the deep-dive routes. **Adding the in-hero list needs your call**
   — flag if you want it.

2. **Footer "Explore all India modules" link** — same reason. The
   redesign-v2 Footer.tsx is layout-level chrome shared with every
   page. If you want the link, it's a one-line add to that file but
   I didn't make it.

3. **MCC banner live-verification still pending from Session B+D.**
   Same as before — would need a dev-server restart to flip the env
   var, which would interrupt your work. Code path is correct.

4. **AnimatedDemographicBar shipped but not wired** to a Demographics-
   specific use site yet. The component exists with the right
   contract; demographic mock data lives in mock-state-data; one
   line of integration is left for whoever builds the bespoke
   DemographicsModule (currently the deep-dive page just shows the
   generic ModuleHero + ModuleStateMap).

5. **Lint warnings (4 total)** — `Unused eslint-disable directive`
   in 2 of the animation primitives. Cosmetic; the IntersectionObserver-
   not-supported branch happens to not hit the lint rule because
   of the early-return ordering. Spec says warnings ok.

## What Session C1 inherits

A complete visual scaffold of /en/india + the 53 deep-dive routes,
all rendering with mock data:

- **Main page (List view)** — disclaimer / hero / engagement strip /
  view toggle / left rail nav / 31 live module bands (all "Awaiting
  first sync") / voting widget / Coming Soon Rail / Royal Contributor
  / "See update log →" / floating Sources button.
- **Main page (Grid view)** — disclaimer / hero / engagement strip /
  view toggle / 12 metric tiles / Choropleth | Bar | Table sub-toggle
  / India choropleth (mock) / sticky sidebar with Top-3 / Bottom-3 /
  state drill / floating Sources button.
- **Each per-module page** — breadcrumb / hero with bespoke SVG +
  KPI cards / inline legal note / state choropleth / time series /
  state leaderboard / AI analysis card / news strip / coming-soon
  sub-features / related modules / sources panel / floating Sources button.
- **Update Log page** — already shipped Session B+D.
- **API stubs** — already 503-graceful when schema not pushed.

Session C1 inherits a deterministic mock layer:
- `src/lib/india/mock-state-data.ts` (432 numbers)
- `src/lib/india/mock-ai-analysis.ts` (53 generic analyses)

Replacing each takes ~1 line per metric/state or ~1 paragraph per
module — the component contracts are stable, so swapping mock for
real is purely a data-layer change.

## Manual steps for Jayanth before Session C1

1. **(Still pending from Session A — schema wasn't pushed last time)**
   Apply schema:
   ```
   cd forthepeople && npx prisma db push
   ```
   Includes the Phase 2.5c `IndiaAnalysis` model now too — review
   the diff first:
   ```
   git diff 1b1d42a..HEAD -- prisma/schema.prisma
   ```

2. **Restart dev server** so the new Prisma client + India* models
   load. Same as before:
   ```
   <ctrl-c>; npm run dev
   ```

3. **Visit and confirm:**
   - http://localhost:3000/en/india — left rail visible at desktop
     width, page scrolls cleanly, 31 module bands render with reveal
     animations, MOCK banner-free unless you scroll into the Grid view.
   - http://localhost:3000/en/india?view=grid — 12 tiles + India
     choropleth + sticky sidebar; click between Choropleth / Bar /
     Table; click states on the map.
   - http://localhost:3000/en/india/wildlife-tigers — full module
     deep-dive with the tiger SVG.
   - http://localhost:3000/en/india/livestock-fisheries — coming-soon
     shell with "Module activating soon" notice.
   - Click the floating "Sources" button bottom-right anywhere on
     /en/india or any /en/india/[slug] — slide-out panel opens with
     search + grouped sources + module chips.

4. **Validate JSON-LD** at https://search.google.com/test/rich-results
   for any /en/india/[slug] URL once you push to a public preview.

5. **(Optional) Decide on the deferred "homepage top-10 modules"
   section.** Tell me yes/no, with placement preference, and I'll do
   it in a follow-up commit.

6. **Reply** "approved, start Session C1" when ready to author the
   real values + analysis text. Session C1 is *your* writing session;
   I'll be in chat ready to help.

---

End of report. Working tree clean. No git push.
