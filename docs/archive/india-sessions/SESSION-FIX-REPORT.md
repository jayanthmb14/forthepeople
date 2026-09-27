# Surgical Fix Session — 2026-04-29

Nine numbered fixes from the audit prompt. One commit per fix. No
pushes, no new features, no Apify, no paid APIs. Bootstrap mock data
follows file 32 §0 (researched-static permitted).

## Result table

| #  | Fix                                                  | Commit       | Status |
| -- | ---------------------------------------------------- | ------------ | ------ |
| 1  | Remove duplicate NDSAP banner                        | `fed8c7a`    | ✓      |
| 2  | Remove Vote-for-Next-District section from /india    | `b430578`    | ✓      |
| 3  | Left rail visible from page top                      | `80f0719`    | ✓      |
| 4  | India map at state level + sized to 60vh / 50vh      | `6589231`    | ✓      |
| 5  | Module-aware headline KPIs + realistic state data    | `67f88b2`    | ✓      |
| 6  | Lucide icons + heroImage contract; SVGs archived     | `a45c3da`    | ✓      |
| 7  | Floating button → Report-an-issue panel              | `90ff894`    | ✓      |
| 8  | Module-tagged news strip with category chips         | `7eed4d7`    | ✓      |
| 9  | Map only renders when hasStateBreakdownData = true   | `1512fd3`    | ✓      |

End-of-session checks: `tsc --noEmit` clean, `next build` clean (✓
Compiled successfully in 61s, 168 static pages generated), eslint
clean except for 4 pre-existing unused-disable-directive warnings in
animations/ that pre-date this session.

## Fix-by-fix notes

### 1 — Duplicate NDSAP banner
The site-wide `DisclaimerBanner` (in `[locale]/layout.tsx`) and the
India-specific `IndiaLegalDisclaimer` (in `IndiaPage.tsx`) both
rendered the same NDSAP text — one above the header, one below. Added
a pathname check inside `DisclaimerBanner` that suppresses the
site-wide banner on `/<locale>/india*` routes. Other pages keep the
site-wide banner intact.

### 2 — Vote-for-Next-District
`IndiaNextDistrictVote` was deleted from `IndiaPage.tsx`. The component
file is preserved on disk; the homepage `NextDistrictLeaderboard` is
still imported by `IndiaNextDistrictVote.tsx` (so the component remains
fully functional if re-mounted on another page).

### 3 — Left rail from top
The `india-rail-grid` wrapper now encompasses the hero and engagement
blocks too. Rail is sticky at `top:64px` and visible from page load
through the bottom of the page. Mobile (≤1024px) unchanged — rail
hidden, top chip nav shows.

### 4 — Map at state level
Inspection showed the choropleth was already loading
`public/geo/india-states.json` (36 features) and `mock-state-data.ts`
already keyed on 36 states. The remaining bug was visual: the SVG
filled the viewport. Fixed by capping `max-height: 60vh` (desktop)
/ `50vh` (mobile) on the `.india-choropleth-frame` and centring it
within an 800px max-width.

### 5 — Module-aware mock data
Added `headlineMetric`, `hasStateBreakdownData`, and `heroImage` to
`IndiaModuleDef`. All 53 modules now declare their own headline KPI —
`ModuleHero` reads `module.headlineMetric` directly, no more category
fallbacks (which is why the tigers page was showing "Forest Cover").

`mock-state-data.ts` ships hand-curated realistic per-state numbers
for the 11 modules with `hasStateBreakdownData = true`. Sources noted
inline:
- Population: Census 2011 + SRS projection
- Tigers: NTCA Status of Tigers 2022 (MP 785, KA 563, UK 560, MH 444)
- Forest Cover: ISFR 2023 (MZ 84.5%, AR 79.3%, MZ 76.0%)
- National Highway km: MoRTH Basic Road Statistics
- Infant Mortality: NFHS-5
- Unemployment: PLFS approximate
- Foodgrain Production: DA&FW Advance Estimates approximate
- Schools: UDISE+ approximate
- Lok Sabha seats: ECI / constitutional allocation
- DPIIT startups: DPIIT cumulative state-wise
- Defence establishments: placeholder count

Other metrics keep the deterministic-but-rough generator. When
scrapers run later they will UPSERT to the same metric keys.

### 6 — Lucide icons
The Phase 2.5d hand-drawn SVG library (`SvgWildlife`, `SvgLivestock`,
etc.) was visually broken — tigers looked like dogs, fish was the same
shape recoloured. Created `ModuleHeroIcon.tsx` with a per-slug Lucide
icon map (PawPrint for tigers, Fish for fisheries, Wheat for crops,
Stethoscope for health, etc. — 53 entries). `ModuleHero` prefers
`module.heroImage` (Wikimedia CC, PIB-released photographs) when set
and falls back to the icon. SVGs moved to `svg/_archived/`.

### 7 — Report an issue
`IndiaReportIssueButton` replaces the `IndiaSourcesButton` floating
slot on both `/india` and `/india/[slug]`. Form posts to the existing
`/api/feedback` endpoint with `type: "wrong_data"`, module slug, page
URL, and optional contact details — feeds into the existing admin
feedback queue with auto-classification. Sources panel logic preserved
on disk for rollback; sources are already visible inline on module
pages via `ModuleSourcePanel`.

### 8 — Module-tagged news strip
Each NewsItem on `/india` now shows up to two category chips below the
headline. Tagging is pure read-time computation — match each module's
`getModuleNewsKeywords()` against `title + summary`, longest match
wins so "ayushman" beats "health". Click a chip to land on that
module's deep-dive page. No DB column, no async job.

### 9 — Map gating
Module deep-dive pages render the choropleth + leaderboard ONLY when
`module.hasStateBreakdownData === true`. The other modules show a
"State-by-state view: Coming Soon" card. Grid view's `IndiaMetricPicker`
filters its tiles against `getStateBreakdownMetricKeys()` — only the
11 metrics that have realistic state data appear as clickable tiles.
Default active metric in Grid view is also drawn from this set.

## What's left for a future session
- Real scrapers for the 11 hasStateBreakdownData modules to upsert
  into IndiaIndicator / IndiaStateBreakdown using the same metric keys.
- Per-module hero photographs (registry slot is ready — set
  `heroImage` on the IndiaModuleDef entry).
- Scrapers for the remaining 22 coming-soon modules.

## Working tree
Clean. 9 commits ahead of origin/main, no push attempted.
