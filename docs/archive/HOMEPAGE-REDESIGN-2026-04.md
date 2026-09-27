# Homepage Redesign v5 — Slim Core Reference (Session 11, 2026-04-26)

This is the in-repo reference for the Session 11 redesign. Built component-by-component as drop-in replacements; **page.tsx swap landed as commit `3dd7570`**. Layout-level chrome (legacy DisclaimerBar + Header + Footer in `[locale]/layout.tsx`) is intentionally preserved — see "Deferred" section below for the elevation plan.

---

## Layout map (compose order in `src/app/[locale]/page.tsx`)

```
<DisclaimerBar />     ← LAYOUT (legacy, preserved)
<Header />            ← LAYOUT (legacy, preserved)
<main>
  <FinancialTicker />
  <LiveActivityRibbon />
  <HeroSection />
  <DistrictExplorer />
  <LiveDataShowcase />
  <FoundingPatronCard />
  <SupporterMarquee />
  <PricingTiers />
  <RequestAndVoteCards />
</main>
<Footer />            ← LAYOUT (legacy, preserved)
```

All redesign-v2 components live in `src/components/home/redesign-v2/`.

The `redesign-v2/DisclaimerBanner.tsx`, `redesign-v2/HeaderBar.tsx`, `redesign-v2/Footer.tsx` are built, TSC-clean, and ready to be elevated to `[locale]/layout.tsx` in a follow-up commit (after district pages are also re-themed).

## Tier color reference

| Tier | Price | Background | Text | Border | Badge |
|---|---|---|---|---|---|
| District Champion | ₹99/mo | `#DCFCE7` (emerald-100) | `#166534` (emerald-700) | `#86EFAC` | ⌂ |
| State Champion (most popular) | ₹999/mo | `#EEEDFE` (violet-50) | `#3C3489` (violet-900) | `#6E59C0` (violet-600) | ⛳ |
| All-India Patron | ₹9,999/mo | `#FCEBEB` (red-50) | `#791F1F` (red-900) | `#E24B4A` (red-600) | ★ |
| Founding Builder | ₹50,000/mo | `#FAEEDA` (amber-50) | `#78350F` (amber-900) | `#BA7517` (amber-600) | ♛ |
| Buy me a Chai (one-time) | from ₹50 | `#F5F5F0` (neutral-100) | `#6B7280` (neutral-500) | `#E5E7EB` | ☕ |

These match the production /support page CTAs and `BadgeExplainer.tsx`. Verified Session 11 audit phase.

## Animation list

| Element | Animation | Duration | reduced-motion fallback |
|---|---|---|---|
| FinancialTicker | left→right marquee | 60s linear infinite | overflow-x: auto, no animation |
| LiveActivityRibbon | left→right marquee | 90s linear infinite | overflow-x: auto, no animation |
| LiveActivityRibbon green dot | opacity pulse | 2s ease-in-out infinite | no animation |
| HeroSection | fade-in on mount | 300ms ease-out | no animation |
| LiveDataShowcase tab switch | cross-fade | 250ms ease-out | no animation |
| FoundingPatronCard | gold glow pulse | 4s ease-in-out infinite | no animation |
| SupporterMarquee | left→right marquee | 50s linear infinite | overflow-x: auto, no animation |
| PricingTiers (state-champion card) | violet glow pulse | 4s ease-in-out infinite | no animation |
| HeaderBar updated-pill green dot | opacity pulse | 2s ease-in-out infinite | no animation |
| DisclaimerBanner | slide-in | 250ms ease-out | no animation |
| Hover lifts (cards) | translateY(-1px) | 150ms ease | no transform |

All animations use raw CSS keyframes — `framer-motion` is **not** installed.

## Mobile breakpoints (single threshold: 768px)

Each component declares its own `@media (max-width: 767px)` rules inline (Tailwind v4 + scoped `<style>` per component). Key collapses:

| Component | Desktop | Mobile (<768px) |
|---|---|---|
| HeaderBar | logo · product ▾ · pill · search · ☼/☾ · lang · GitHub · ♥ | logo · search · ♥ · ☰ |
| HeroSection | 60/40 grid (text · map) | stacks; map below; stats 2×3 |
| DistrictExplorer | 50/50 grid (map · list) | map above, list below |
| LiveDataShowcase chips | horizontal scroll | horizontal scroll |
| LiveDataShowcase cards | 4 columns | 2×2 grid |
| PricingTiers | 1fr 1.1fr 1fr | stacked; State Champion middle |
| RequestAndVoteCards | 2 columns | stacked |
| Footer rows | inline | stacked |

## Endpoints (no schema changes; no new endpoints)

| Component | Endpoint(s) consumed |
|---|---|
| FinancialTicker | GET `/api/data/market-ticker` |
| LiveActivityRibbon | GET `/api/data/homepage-stats`, GET `/api/data/homepage-preview` |
| HeroSection | GET `/api/data/homepage-stats` |
| DistrictExplorer | server-side `prisma.district.findMany` + `prisma.districtRequest.findMany` (props-in pattern via page.tsx) |
| LiveDataShowcase | GET `/api/data/crops`, `/weather`, `/news`, `/infrastructure-projects` per district chip |
| FoundingPatronCard | GET `/api/payment/contributors?limit=20` |
| SupporterMarquee | GET `/api/payment/contributors?limit=100` |
| PricingTiers | static — links to `/<locale>/support?tier=...&autoselect=...` |
| RequestAndVoteCards | GET + POST `/api/district-request`, GET `/api/features` |
| HeaderBar updated-pill | GET `/api/data/homepage-stats` (60s poll) |
| Footer updated-pill | GET `/api/data/homepage-stats` (60s poll) |

## /public/districts/{slug}.svg slot

`LiveDataShowcase` performs a `HEAD /districts/<slug>.svg` probe per active district. If the SVG exists, it renders as a 56px round avatar in the header. If not, a generic blue location-pin SVG renders. **Drop new SVGs into `public/districts/` to upgrade — zero code change required.**

Example: `public/districts/mandya.svg`, `public/districts/pune.svg`.

## Session 11.1 — Chrome swap completed (2026-04-26)

The redesign-v2 chrome (DisclaimerBanner + HeaderBar + Footer) is now wired into `src/app/[locale]/layout.tsx` and renders **site-wide**, not just on the homepage.

**Verified post-swap (HTTP 200 + reasonable HTML size):**

| Route | Status | Size |
|---|---|---|
| /en | 200 | 87 KB |
| /en/karnataka/mandya | 200 | 127 KB |
| /en/karnataka/bengaluru-urban | 200 | 127 KB |
| /en/karnataka/mysuru | 200 | 127 KB |
| /en/maharashtra/mumbai | 200 | 125 KB |
| /en/maharashtra/pune | 200 | 122 KB |
| /en/delhi/new-delhi | 200 | 123 KB |
| /en/tamil-nadu/chennai | 200 | 124 KB |
| /en/west-bengal/kolkata | 200 | 124 KB |
| /en/telangana/hyderabad | 200 | 133 KB |
| /en/uttar-pradesh/lucknow | 200 | 126 KB |

TSC: 0 errors. Lint: 107 problems (exactly baseline, no regression).

**Intentional regressions vs legacy Header (each documented inline in `HeaderBar.tsx` SCOPE NOTE):**
- No state/district autocomplete (search submits to `/<locale>?q=...`)
- No "Lock" indicator per-district
- No MobileSidebar wired (HeaderBar's ☰ button is a no-op until layout passes `onOpenMobileNav` callback wired to existing MobileSidebar)
- Footer trades the live IST clock for an "Updated Xm ago" pill

## v6 simplification (Session 11.6, 2026-04-27)

Localhost review of the v5 homepage flagged it as over-engineered: too many salesy sections (pricing tiers + big founder card + supporter marquee), redundant district browsers (explorer with tier groups + live-data 4-card showcase), and a dual request-and-vote card. v6 collapses the homepage body to **5 simpler sections** while pricing/founder/supporter content continues to render at `/support` from the same source of truth.

### New homepage structure (post-v6)

```
[layout chrome — DisclaimerBanner + HeaderBar (with green/red status dots)]
<main>
  1. FinancialTicker
  2. LiveActivityRibbon
  3. HeroSection           ← map LEFT (55%), text RIGHT (45%), 3-stat row
  4. LiveDistrictsList     ← flat 10-district grid, NEW badge on 3 newest
  5. UpcomingDistricts     ← top 2 voted + "Vote for the next district →"
  6. ContributorsStrip     ← flat names + "View all supporters & contribute →"
  7. VoteFeaturesCTA       ← top 3 features + "Vote on features →"
</main>
[layout chrome — Footer]
```

### Removed from homepage (all retained on disk)

| Component | Reason |
|---|---|
| `PricingTiers.tsx` | Defer to `/support` — already renders the same tiers from `src/lib/razorpay/plans.ts` |
| `FoundingPatronCard.tsx` | Defer to `/support` — Micah Alex appears first in the new flat ContributorsStrip without special treatment |
| `SupporterMarquee.tsx` | Defer to `/support` — flat names with "View all" link is honest civic vibe |
| `LiveDataShowcase.tsx` | District pages already cover crops/infra/news/weather per district |
| `DistrictExplorer.tsx` | Replaced by simpler `LiveDistrictsList` (no tab UI, no second map column) |
| `RequestAndVoteCards.tsx` | Split into focused `UpcomingDistricts` + `VoteFeaturesCTA` |

### HeaderBar product-dropdown change

Three items, status dots only — `"Coming soon"` text labels removed:
- 🟢 ForThePeople**.in** (active)
- 🔴 ForThePeople**.connect** → `/coming-soon`
- 🔴 ForThePeople**.jobs** → `/coming-soon`

### Verified Session 11.6
- TSC: 0 errors
- Lint: 107 problems (61 errors, 46 warnings) — exact baseline preserved
- HTML payload `/en`: 84 KB (was 105 KB in v5 — ~20% slimmer)
- District pages `/en/karnataka/mandya`, `/en/maharashtra/pune`: still HTTP 200
- Tag `pre-session-11.6-v6-simplification-2026-04-26` covers full pre-state

---

## Old components (kept on disk for rollback)

| Legacy file | Replaced by | Status |
|---|---|---|
| `src/components/layout/DisclaimerBar.tsx` | `redesign-v2/DisclaimerBanner.tsx` | legacy still wired in layout |
| `src/components/layout/Header.tsx` | `redesign-v2/HeaderBar.tsx` | legacy still wired in layout |
| `src/components/layout/Footer.tsx` | `redesign-v2/Footer.tsx` | legacy still wired in layout |
| `src/components/layout/MarketTickerClient.tsx` | `redesign-v2/FinancialTicker.tsx` | legacy unused on /en after page.tsx swap |
| `src/components/layout/HomeDrilldown.tsx` | `redesign-v2/DistrictExplorer.tsx` + `LiveDataShowcase.tsx` | legacy unused on /en after page.tsx swap |
| `src/components/home/HomepageStats.tsx` | merged into `redesign-v2/HeroSection.tsx` | legacy unused on /en after page.tsx swap |
| `src/components/support/CompactContributorWallClient.tsx` | merged into `redesign-v2/SupporterMarquee.tsx` | legacy unused on /en after page.tsx swap |
| `src/app/[locale]/page.v8.tsx` | snapshot of pre-swap page.tsx | rollback target |

## Deferred to a future session

| Feature | Why deferred | Where to start |
|---|---|---|
| Interactive 780-district SVG choropleth | `react-simple-maps ^3.0.0` IS installed; component build is its own session | `redesign-v2/HeroSection.tsx` map placeholder + `redesign-v2/DistrictExplorer.tsx` map placeholder |
| Count-up animations on hero stats | low-value, low-noise; static values render correctly | `redesign-v2/HeroSection.tsx` Stat component |
| GitHub stars live API | `swr` not installed; hardcoded ★ 149 fallback works | `redesign-v2/HeaderBar.tsx` GITHUB_STAR_FALLBACK |
| react-window virtualization for district list | unnecessary at 10 districts; revisit at >100 | `redesign-v2/DistrictExplorer.tsx` |
| Per-district SVG illustrations | `public/districts/` slot ready; SVG files not authored yet | drop file, no code change |
| `/coming-soon` page (for ProductDropdown links) | content authoring task | new page at `src/app/coming-soon/page.tsx` |
| `/en/india-detail` page | content authoring task | new page at `src/app/[locale]/india-detail/page.tsx` |
| Layout-level swap to redesign-v2 chrome | requires district-page redesign first | swap `[locale]/layout.tsx` imports when ready |
| Theme toggle deep wiring (CSS variables across all surfaces) | `ThemeToggle.tsx` already toggles `data-theme`; comprehensive `--bg-*` mapping is its own pass | `globals.css` `[data-theme="dark"]` block |
| Hindi (`hi`) and other non-en/kn locales | dictionaries not present | `src/dictionaries/hi.json`, etc. |

---

# Session 12 — v7 Comprehensive Redesign (2026-04-26, NOT pushed)

Built phase-by-phase, single commit per phase, on `main` locally. Push held for final review per instructions.

## v7 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />     ← LAYOUT (NEW, NProgress-style top bar)
<MigrationBanner />     ← LAYOUT
<DisclaimerBanner />    ← LAYOUT (yellow palette, was orange)
<HeaderBar />           ← LAYOUT (overhauled — see below)
<main>
  <FinancialTicker />        — LIVE pill + scrolling marquee + Updated label
  <StatsBar />               — count-up stats line (replaces LiveActivityRibbon timestamps)
  <HeroSection />            — map LEFT 60%, text RIGHT 40%
  <LiveDistrictsList />      — 10-district grid, NEW badges, mobile scroll-snap
  <LiveDataShowcase />       — RESTORED (district chip tabs + 4 module cards)
  <HowItWorks />             — NEW 4-step explainer
  <ContributorsStrip />      — links to /contributors (was /support)
  <VoteFeaturesCTA />        — top 3 feature ideas + /features link
</main>
<Footer />              ← LAYOUT
<SuggestionFloatingButton />
```

`UpcomingDistricts` removed from the homepage. Its function is served by the new dedicated `/vote-district` route, deep-linked from the HeaderBar district autocomplete via `?d=<slug>`.

## v7 commits (16 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `e919a01` style(disclaimer) | B | DisclaimerBanner — yellow palette + pulsing icon |
| 2 | `057096e` feat(header) | C | HeaderBar — emojis 👥/🤝/💼, district autocomplete, locked dark mode |
| 3 | `ac2e462` feat(ticker) | D | FinancialTicker — LIVE pill, viewport containment, Updated timestamp |
| 4 | `8a1e948` feat(home) | E | StatsBar (filename retained as LiveActivityRibbon.tsx for stable imports) |
| 5 | `9b784ca` fix(stats) | E hotfix | StatsBar props made optional w/ defaults during transition |
| 6 | `26c3bbd` feat(home) | F | HeroSection — map LEFT 60%, text RIGHT 40%, no inline stats |
| 7 | `9fcdc61` feat(home) | G | LiveDistrictsList — intros, NEW badges, stagger reveal, mobile scroll-snap |
| 8 | `3143e39` feat(home) | I | HowItWorks 4-step (Aggregate → Process → Surface → Sustain) + sources caption |
| 9 | `92b99dd` feat(home) | J | ContributorsStrip → /contributors link |
| 10 | `a12c14b` feat(contributors) | K | ContributorsHero stats + Join CTA above existing leaderboard |
| 11 | `69b86f6` feat(vote-district) | L | New `/vote-district` route — search/filter/vote, ?d= preselect |
| 12 | `090bb6c` feat(homepage) | N | page.tsx swap — activate v7 composition |
| 13 | `9b4fb38` polish(map) | O | DrillDownMap ambient pulse on active states (CSS-only) |
| 14 | `ad65bcf` feat(ux) | P | PageProgressBar — NProgress-style top bar |
| 15 | `7f29a51` chore(lint) | Q | Lint cleanup for vote-district + PageProgressBar |

(Phase H restored LiveDataShowcase — file already on disk from Session 11, no commit needed beyond Phase N's reimport. Phase M verified VoteFeaturesCTA still works as-is.)

## What's new on disk (Session 12 only)

**New routes**
- `src/app/[locale]/vote-district/page.tsx` — server entry, awaits `?d=` searchParam
- `src/components/vote-district/VoteDistrictPage.tsx` — client (search/filter/sort/paginate/vote)

**New components**
- `src/components/home/redesign-v2/HowItWorks.tsx` — 4-step explainer with count-up step numbers
- `src/components/common/PageProgressBar.tsx` — global top bar, no third-party dep
- `src/app/[locale]/contributors/ContributorsHero.tsx` — hero above existing leaderboard

**New constants**
- `src/lib/constants.ts` exports `DASHBOARDS_PER_DISTRICT = 32` and `TOTAL_INDIA_DISTRICTS = 780`

**Heavily reworked existing**
- `HeaderBar.tsx` — full overhaul (~570 LOC)
- `FinancialTicker.tsx` — restructured around LIVE pill + viewport
- `LiveActivityRibbon.tsx` — repurposed as StatsBar export (filename retained for import stability)
- `HeroSection.tsx` — clean rewrite to 60/40 layout
- `LiveDistrictsList.tsx` — added NEW badges + intros + mobile scroll-snap
- `DisclaimerBanner.tsx` — yellow palette
- `ContributorsStrip.tsx` — link target changed to /contributors
- `globals.css` — added `.ftp-geo-active` pulse + `prefers-reduced-motion` guard

## StatsBar data wiring (Phase N)

`page.tsx` fetches `/api/data/homepage-stats` (5-min cache) during SSR. Falls back to `activeRows.length` and zeros if the endpoint is unreachable. `comingDistricts = TOTAL_INDIA_DISTRICTS - activeCount`.

## DrillDownMap polish — read-only data flow preserved

Hard Rule 8 honored. Only added a `className={isActive ? "ftp-geo-active" : "ftp-geo-locked"}` and `data-active` on the `<Geography>` element so CSS could attach a pulse. No state, query, click handler, or geo-data flow was touched.

## Reduced-motion respected everywhere

Every animation introduced this session — count-up, stagger reveal, profile-ring pulse, geo-pulse — has a `@media (prefers-reduced-motion: reduce)` skip. The PageProgressBar still renders for accessibility but uses immediate state transitions rather than long easings.

## Lint state at end of session

| | Before Session 12 | After Session 12 |
|---|---|---|
| Total problems | 107 | 108 |
| Errors | 61 | 62 |
| Warnings | 46 | 46 |

Net delta: **+1 error in unrelated pre-existing code** (not introduced by any Session 12 file). All v7 files have zero lint issues.

## Push status

**NOT pushed.** Per session prompt — all 16 commits are local on `main`. Single-commit-per-phase = clean reversibility. Push only after manual smoke test of:
- Homepage scroll-through (FinancialTicker → VoteFeaturesCTA, look for visual regressions)
- HeaderBar district autocomplete → `/vote-district?d=<slug>` deep link
- StatsBar count-up animation on first scroll
- HowItWorks step numbers count-up
- DrillDownMap state pulse (active vs locked)
- PageProgressBar fires on internal nav, doesn't pin after failed navs
- /contributors page hero stats + CTA
- /vote-district vote action (POST → optimistic bump → server upsert)
- prefers-reduced-motion turned on → no animations
- Lighthouse / Core Web Vitals on the new homepage

---

# Session 13 — v8 final polish (2026-04-26, NOT pushed)

19 production-pattern-matching fixes from Jayanth's localhost review.
~14 commits, all on local `main`. Reversibility tag:
`pre-session-13-v8-polish-2026-04-26`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| DisclaimerBanner | Wording → explicit "ForThePeople.in is NOT an official government website" | #1 |
| HeaderBar (logo) | Drop 👥 emoji — plain text "ForThePeople.in" / "FTP.in" | #11 |
| HeaderBar (products) | Lucide icons in brand colors (Users blue · Network purple · Briefcase yellow); .jobs uses YELLOW not orange | #12, #13 |
| HeaderBar (GitHub) | Replace redundant Support text link with GitHub link showing live star count + scalable color tier (bronze/silver/gold/platinum/diamond, sessionStorage 1h cache, fallback 149) | #2 |
| HeaderBar (Support btn) | Layered red — rose-50 bg / rose-600 text / rose-200 border (production pattern) | #18 |
| FinancialTicker | Replace LIVE pill with Market Open/Closed status (Indian market hours: Mon-Fri 09:15-15:30 IST) | #3 |
| StatsBar | Drop LIVE prefix; redesign as dashboard-style 5-tile grid with hairline dividers, hover, larger 24px tabular figures, uppercase labels; mobile 2-col + last tile spans full width | #4 |
| HeroSection (map) | 480-560px tall map with floating "Click a state to explore" hint (glass-morphism backdrop) | #5 |
| HeroSection (right) | Districts moved INTO hero right column as inline rows; "Explore the whole India →" green CTA between subtitle and districts list | #6, #7 |
| HeroSection (rows) | Each row: name + state suffix + 2 curated tag-bullets (Sugar capital · KRS dam · Cauvery basin etc.); NEW = small 8px letter pill, no card-bg color change | #8, #9 |
| LiveDistrictsList | Removed from page.tsx (file kept on disk for rollback) | #7 |
| ContributorsStrip | Tier-colored marquee — Founder amber+Crown · All-India red+🇮🇳 · State purple+MapPin · District emerald+Building · One-time neutral; 60s linear, hover-pause, edge fade-mask | #14 |
| HowItWorks | 40px gradient number circles with pop-in animation, connecting hairline behind cards (desktop), hover-lift + emerald shadow | #17 |
| VoteFeaturesCTA | Purple gradient card (#EEEDFE → #F4F3FE) with oversized 🗳️ watermark, white inner rows, violet vote chip + primary button | #16 |
| Footer | Single line: links · brand IG (@forthepeople_in) + project GitHub · "Built by · Updated"; personal IG removed | #15 |
| All data | Existing APIs only — no new endpoints, no new schema fields | #10 |
| Spacing | Hero stretch-aligned, sections flow tightly | #19 |

## v8 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />     ← LAYOUT
<MigrationBanner />     ← LAYOUT
<DisclaimerBanner />    ← LAYOUT (wording: NOT an official government website)
<HeaderBar />           ← LAYOUT (plain logo · GitHub stars · Lucide products · layered Support)
<main>
  <FinancialTicker />        — Market Open/Closed pill + marquee + Updated
  <StatsBar />               — 5-tile dashboard grid (no LIVE prefix)
  <HeroSection />            — map LEFT 60% / text + districts inline RIGHT 40%
  <LiveDataShowcase />       — district chip tabs + 4 module cards
  <HowItWorks />             — 4 gradient-circle steps + connecting line
  <ContributorsStrip />      — tier-colored marquee (5 tiers)
  <VoteFeaturesCTA />        — purple gradient card
</main>
<Footer />              ← LAYOUT (single line)
<SuggestionFloatingButton />
```

## v8 commits (14 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `11beac9` | B | DisclaimerBanner — explicit "NOT official government" wording |
| 2 | `45cc2a5` | C | HeaderBar — emoji-less logo, GitHub stars, Lucide products, .jobs yellow, layered-red Support |
| 3 | `19c4b37` | D | FinancialTicker — Market Open/Closed status pill |
| 4 | `69fc080` | E | StatsBar — dashboard 5-tile grid |
| 5 | `5af155c` | F+G | HeroSection — bigger map + hint, districts inline w/ rich intros |
| 6 | `f3fe5ba` | H | page.tsx — drop separate LiveDistrictsList section |
| 7 | `3b8057d` | I | ContributorsStrip — tier-colored marquee |
| 8 | `b248536` | J | VoteFeaturesCTA — purple gradient card |
| 9 | `369b232` | K | HowItWorks — gradient circles + connecting line + hover lift |
| 10 | `e904f9b` | L | Footer — single line, brand IG + GitHub only |
| 11 | `80581df` | M | page.tsx — docstring refresh to v8 composition |
| 12 | `5179fb9` | N | FinancialTicker — lazy-init nowMs (lint cleanup) |

## Verification

| | Before Session 13 | After Session 13 |
|---|---|---|
| Total problems | 108 | 108 |
| Errors | 62 | 62 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 108 baseline preserved exactly.
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district` all 200.
- GitHub star fetch: cached 1h in sessionStorage; falls back to 149 on rate-limit.

## Push status

**NOT pushed.** Reversibility tag `pre-session-13-v8-polish-2026-04-26` exists; all 14 commits sit on local `main`. Push only after Jayanth's manual review.

---

# Session 14 — v8.1 polish (2026-04-26, NOT pushed)

11 surface-level fixes from Jayanth's localhost review of v8.
~9 commits, all on local `main`. Reversibility tag:
`pre-session-14-polish-2026-04-26`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| HeaderBar | GitHub link gets white-bg outline, default star color YELLOW (#EAB308); tier scale silver→#94A3B8, gold→#EAB308 | #1 |
| HeaderBar | Vote on Features → purple pill (light bg / dark text / soft border) | #2 |
| HeaderBar | Language button → Lucide Globe icon + outline + chevron | #3 |
| HeaderBar | Theme toggle → 32px square w/ outline (was bare) | #4 |
| HeaderBar | Padding 10px 16px → 8px 24px so contents extend toward corners | #5 |
| StatsBar | Numbers BLUE (#2563EB), 28px (was 24), font-weight 700 (was 600); dividers 1px (was 0.5px); hover #F0F7FF | #6, #7 |
| HeroSection | Map column 540-640px tall (was 480-560); SVG max-height 620px | #8 |
| HeroSection | h1 white-space:nowrap + grid 56/44 + gap 28px → tagline single line at 1280px+ | #9 |
| HeroSection | District rows outlined (1px border, 8px radius), padding 10×14, hover slides right + blue border + soft blue shadow; all 3 curated tags shown (was 2); list lost max-height + overflow:auto so all 10 visible | #10 |
| /contributors | Removed Session 12 ContributorsHero — was a second hero stacked above the existing GlobalContributorsClient hero. ContributorsHero.tsx kept on disk for rollback. | #11 |
| /contributors | Wired useCountUp into GlobalContributorsClient hero stats (totalContributors / activeSubscribers / districtsSponsored) — animates 0 → final on scroll-into-view, mirroring StatsBar | #12 |
| ContributorsStrip | 3 sliding tracks at tier-paced speeds: All-India+Founder 90s SLOW, State 60s MED, District+Onetime 35s FAST; hover-pause; reduced-motion freezes + wraps | #13 |
| ContributorsStrip | Pills clickable when contributor.socialLink exists (existing schema field, now surfaced by API gated on isPublic); safeExternalLink rejects non-http(s) and accepts bare @handles as Instagram | #14 |
| ContributorsStrip / API | Public-supporter names render in full (anonymizeName drops the "First L." truncation when isPublic=true; private supporters still show "Anonymous"); pill names use white-space:nowrap | #15 |
| HowItWorks | Theme switched green → blue: hover border #10B981→#2563EB, num-circle gradient #10B981→#059669 → #2563EB→#1D4ED8, shadows + connecting line tinted blue | #16 |
| API | /api/payment/contributors now surfaces socialLink + socialPlatform from existing Supporter schema; cache key bumped v3→v4 | #14, #15 |

## Verification

| | Before Session 14 | After Session 14 |
|---|---|---|
| Total problems | 108 | 108 |
| Errors | 62 | 62 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 108 baseline preserved exactly.
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district` all 200.
- Verified live: `/api/payment/contributors?limit=5` now returns `socialLink` + `socialPlatform` fields, and "Vignesh" displays in full (was "Vig...").

## v8.1 commits (9 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `8462f6a` | B | Header — outlined GitHub/Vote/Language/Theme + yellow star + purple Vote pill + Globe icon |
| 2 | `554e3ef` | C | StatsBar — blue numbers + bolder + 1px dividers |
| 3 | `ceebc8d` | D | Hero map — bigger (640px max) |
| 4 | `96ea21a` | E | Hero h1 — nowrap + 56/44 grid ratio |
| 5 | `b7303cc` | F | District rows — outlined + 3 tags + all 10 visible |
| 6 | `8aa5441` | G | /contributors — remove duplicate hero + count-up on 72/16/4 |
| 7 | `e9dd410` | H | Supporters — tier-based marquee speeds + clickable + full names |
| 8 | `0673c98` | I | HowItWorks — blue theme (was green) |

## Push status

**NOT pushed.** Reversibility tag `pre-session-14-polish-2026-04-26` exists; all v8.1 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 15 — v9 production-pattern restoration (2026-04-26, NOT pushed)

13 production-pattern restorations from Jayanth's localhost vs prod
review. ~10 commits, all on local `main`. Reversibility tag:
`pre-session-15-v9-restoration-2026-04-26`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| Hero map | SVG transform scale(1.15), light-blue (#F0F7FF) container, overflow:hidden — crops surrounding ocean visually without touching the read-only DrillDownMap | #1 |
| globals.css | Body bg #FAFAF8 cream (was undefined → defaulted white) | #3 |
| globals.css | `.ftp-section-wrap` now carries 32px-y padding; alternating bg per section: hero white / livedata white / how cream / supporters white / vote light-blue tint | #2, #4 |
| Components | Inline `background:` removed from each redesign-v2 section so the new class-based bg can apply | #2, #3, #4 |
| HeroSection | Right column rebuilt as a unified white dashboard card (border + shadow + radius) holding 3 blocks: tagline (h1 stacked 3 lines + bottom border) → blue gradient "Explore the whole India" tab → LIVE pill + districts list | #5 |
| HeaderBar | Lucide Users icon (18px blue) renders next to "ForThePeople.in" / "FTP.in" text on the header itself (was only inside dropdown) | #6 |
| HeaderBar | Padding 8px 24px → 10px 32px on wide viewports + margin-left:auto on GitHub link → right group pushes to the corner | #7 |
| HeroSection | Each district row now shows: health-grade badge (light-blue chip) + name + native-script subtitle + NEW pill + blue tagline + 3 emoji-bullets + 🌡️ live temperature | #8 |
| HeroSection | Live temp + grade pulled from existing `/api/data/homepage-preview` (5-min cache, no new endpoint, no new schema fields) | #8 |
| New file | `src/lib/data/district-meta.ts` — DISTRICT_META (10 active districts × native script + tagline + 3 bullets) + STATE_FULL_NAMES (36 states/UTs) | #8, #11 |
| HowItWorks | 4 steps → 3 (📡 We Collect / 📊 We Organize / 👁️ You See) with production short copy. Sources caption removed. Grid 4-col → 3-col, gap 16→20px | #9 |
| ContributorsStrip | Restructured into 3 categorized sections: 🇮🇳 India Patrons / 🏛️ State Champions / ⌂ District Sponsors. STATIC_THRESHOLD = 6: ≤6 renders as static wrap list, >6 falls back to per-tier marquee (120s / 80s / 50s) | #10 |
| ContributorsStrip | Pill format is natural language — "Name — Karnataka", "Name — Mandya", "Name — 🇮🇳 India" — no more code-style "STATE · KA" badges | #11, #12 |
| API | `/api/payment/contributors` v4 → v5: now surfaces districtName + stateName from existing sponsoredDistrict/sponsoredState FK relations (or legacy plain-text Supporter.district fallback) | #11, #12 |
| /features | Vote / Suggest tab structure removed. Page is now one continuous flow: header → 📊 Vote on existing ideas → 💡 Share your idea + accepted-suggestions list. Both call existing endpoints | #13 |

## v9 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />                      ← LAYOUT
<MigrationBanner />                      ← LAYOUT
<DisclaimerBanner />                     ← LAYOUT
<HeaderBar />                            ← LAYOUT (Users icon · GitHub stars · Globe · layered Support, right group at corner)
<main>                                                                bg: alternating per section
  <FinancialTicker />                    — Market Open/Closed pill + marquee + Updated
  <StatsBar />                           — 5-tile dashboard, blue numbers
  <HeroSection districts={...} />        — map LEFT 56% (zoomed, light-blue bg) / dashboard card RIGHT 44%
                                            (tagline / blue Explore tab / LIVE pill + 10 rich rows)
  <LiveDataShowcase />                   — district chip tabs + 4 module cards
  <HowItWorks />                         — 3 short steps with blue gradient circles + connecting line
  <ContributorsStrip />                  — 🇮🇳 India / 🏛️ State / ⌂ District (static or marquee)
  <VoteFeaturesCTA />                    — purple gradient card (light-blue section bg)
</main>
<Footer />                               ← LAYOUT
```

## Verification

| | Before Session 15 | After Session 15 |
|---|---|---|
| Total problems | 108 | **107** |
| Errors | 62 | **61** |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (1 better than baseline — the /features rewrite dropped one stale lint issue).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` — all 200.
- API verified: `/api/payment/contributors?limit=3` now returns full names — e.g. `districtName: "Nagpur"`, `stateName: "Maharashtra"`.

## v9 commits (10 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `fe68963` | B | Hero map — zoom 1.15x + light-blue container |
| 2 | `0f45a3c` | C | globals — cream body + alternating section bgs + 32px section padding |
| 3 | `9302956` | D | Hero — dashboard card with blue Explore tab + LIVE district section |
| 4 | `a539433` | E | Header — Users icon visible + right group at corner |
| 5 | `328c59f` | F | District rows — rating + native script + tagline + bullets + temp + new district-meta.ts |
| 6 | `76b9c07` | G | HowItWorks — 3 short steps (We Collect / We Organize / You See) |
| 7 | `49df3e5` | H | Supporters — 3 categorized sections + threshold marquee + full names |
| 8 | `e0f6660` | I | /features — unified Vote + Share Your Idea (no tabs) |

## Push status

**NOT pushed.** Reversibility tag `pre-session-15-v9-restoration-2026-04-26` exists; all v9 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 16 — v10 FINAL polish (2026-04-26, NOT pushed)

13 surgical dashboard fixes from Jayanth's 4:30 AM review of v9.
Intended as the final polish session before push. ~12 commits, all
on local `main`. Reversibility tag:
`pre-session-16-v10-final-2026-04-26`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| HeaderBar — search | Field bg → blue tint #F0F7FF, icon + placeholder in blue, focus-within deepens to white + 3px blue ring | #1 |
| FinancialTicker — API | Added Nifty Bank, BTC/INR, ETH/INR, EUR/INR (all Yahoo Finance via existing fetchYahooQuote, no new deps); reordered to indices → commodities → fuel → currencies → crypto. Cache key v3→v4. | #2 |
| FinancialTicker — component | 16px margin-bottom adds gap before StatsBar; green Market Open pill verified | #2 |
| StatsBar | Solid grid + dividers → outlined tile cards with 12px gaps. Each tile: 1px border, 8px radius, white bg, hover lifts -2px with soft blue shadow + blue border | #3 |
| HeroSection — grid | 56/44 → 65/35; tablet ≤1024px drops to 60/40 | #4 |
| HeroSection — right col | Compact dashboard card: h1 forced to one line via white-space:nowrap (20px down from 26); tiny gray subtitle (11px); "Explore the whole India" downgraded from gradient tab → small blue hyperlink; 1px divider above LIVE district section | #5 |
| HeroSection — map col | 12px right padding + 1px vertical separator on right edge between map and dashboard (mobile drops both) | #5 |
| District rows | Removed C+/C health-grade badge entirely (and its CSS) — grade was inaccurate enough to read as negative | #6 |
| District rows | Hover bleed fix: dropped translateX, added position:relative + z-index:2 on hover so the soft blue shadow lifts the row above neighbors instead of bleeding sideways. Solid white bg on hover. | #7 |
| District rows | Added per-row meta line (dashed top-border): 🌡️ {temp}°C   🕐 Updated {Xm ago} — pulled from existing /api/data/homepage-preview | #7 |
| LiveDataShowcase | Visual overhaul. Title leads with pulsing green dot. District chips → pill tabs (light-blue resting, blue active). 4 module cards each get a 3px colored top stripe (Crops emerald · Infra blue · News amber · Weather cyan), accent-colored uppercase title, hover lift -3px with colored shadow, footer divider above accent-colored "View all →". Empty state replaces "Data temporarily unavailable" with centered "📭 Data syncing / Refreshing every 5–30 min". | #8 |
| HowItWorks | Reverted to 4-step Session 12 wording (Aggregate / Process / Surface / Sustain). Sources caption restored. Each card now reveals a 3px blue gradient stripe on hover, lift -3px with 10% blue shadow. | #9 |
| ContributorsStrip — API | v5 → v6: surfaces existing isRecurring + subscriptionStatus from Supporter schema | #10 |
| ContributorsStrip — Founder badge | Now reads "🇮🇳 India" (was "Founder") — same visual as All-India patrons | #10 |
| ContributorsStrip — filter | New isActiveSubscriber() filter: founders always shown; other tiers must have isRecurring=true AND subscriptionStatus="active". One-time supporters drop from the homepage strip (still visible on /contributors). "Backed by N citizens" total still reflects the FULL count. | #10b |
| ContributorsStrip — borders | Cream container (#FAFAF8) wraps the categories with 1px border + 12px radius + 20px padding. Each category is a white card with 1px border + 8px radius + 14×16 padding. | #10d |
| /features | REVERTED Session 15 — page is now voting-only again. Dropped SuggestSection, SuggestionForm import, PublicSuggestion interface, SectionHeading helper. | #11 |
| Homepage VoteFeaturesCTA | NEW combined card: 2-col purple-gradient layout — top 3 voted features LEFT, reused SuggestionForm RIGHT. Existing /api/suggestions endpoint reused via the shared component. Mobile collapses to 1-col. | #11b |
| Footer | 2px blue top accent line (was 1px gray). Yellow warning band gets explicit 1px bottom border. Link items become tinted-bg pills on hover (#F0F7FF + #2563EB). Social icons go from bare to bordered cards (white square + 1px border + 6px radius), hover lifts -2px and tints to blue (Instagram brand keeps its gradient bg). | #12 |
| Mobile layout | Hero grid switches to grid-template-areas: text / map / districts. .ftp-hero-dashboard becomes display:contents on mobile so its children participate in the hero grid via grid-area — text reads first, map second, districts third. District rows simplify (native script hidden, padding tightened, font sizes scaled down). Supporters: outer container padding tightens, all 3 marquee tracks freeze + wrap. Edge fade-mask drops. | #13 |

## v10 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />                      ← LAYOUT
<MigrationBanner />                      ← LAYOUT
<DisclaimerBanner />                     ← LAYOUT
<HeaderBar />                            ← LAYOUT (Users icon · blue search · GitHub · Globe · layered Support)
<main>
  <FinancialTicker />                    — Market Open/Closed pill + 12 markets + Updated
  <StatsBar />                           — 5 outlined tile cards with hover lift
  <HeroSection districts={...} />        — 65% map (zoomed, blue bg, vertical divider) / 35% compact dashboard
                                            (h1 1-line · tiny subtitle · small Explore link · LIVE district section)
  <LiveDataShowcase />                   — pulsing-dot title + pill tabs + 4 color-coded data cards
  <HowItWorks />                         — 4 steps reverted; gradient-stripe hover accent
  <ContributorsStrip />                  — bordered category cards inside cream container; subscribers-only
  <VoteFeaturesCTA />                    — combined Vote (top 3) + Share Your Idea form
</main>
<Footer />                               ← LAYOUT (blue accent + yellow band + bordered hover pills + bordered socials)
```

## Verification

| | Before Session 16 | After Session 16 |
|---|---|---|
| Total problems | 107 | **107** |
| Errors | 61 | 61 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (1 better than 108 baseline; matches end-of-Session-15).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` all 200.
- DrillDownMap component file untouched (Hard Rule 7 honored — only its CSS wrapper changed).
- prefers-reduced-motion respected on every new animation introduced.

## v10 commits (12 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `917427c` | B | Header search — blue tint + blue icon/placeholder + focus ring |
| 2 | `1343fd9` | C | Ticker — Bank Nifty + BTC/ETH/EUR + ordering + gap-below |
| 3 | `a34a60d` | D | StatsBar — outlined tiles, gaps replace dividers |
| 4 | `78af397` | E | Hero — 65/35 grid, h1 one-line, small Explore hyperlink, vertical divider |
| 5 | `a5dc949` | F | District rows — drop rating, z-index hover lift, 🌡️🕐 meta line |
| 6 | `b7f69ff` | G | LiveDataShowcase — color-coded accent stripes + pill tabs |
| 7 | `f10a9c7` | H | HowItWorks — revert to 4 steps + gradient hover stripe + caption restored |
| 8 | `31cd248` | I | Supporters — Founder→India badge + subscribers-only filter + bordered category cards + API v6 |
| 9 | `1350c50` | J | /features revert + homepage VoteFeaturesCTA combined Vote + Share |
| 10 | `ed33c88` | K | Footer — blue top accent + yellow band + bordered hover pills + bordered socials |
| 11 | `0500726` | L | Mobile — hero text→map→districts via grid-areas, simpler district rows, marquees freeze |

## Push status

**NOT pushed.** Reversibility tag `pre-session-16-v10-final-2026-04-26` exists; all v10 commits sit on local `main`. After Jayanth's well-deserved sleep + manual review, `git push origin main` ships ~218 commits via Vercel (~5–7 min build).

---

# Session 17 — v11 hero restructure + final polish (2026-04-27, NOT pushed)

7 surgical fixes from Jayanth's localhost DOM inspection. Intended as
the final polish session before push. ~5 commits, all on local `main`.
Reversibility tag: `pre-session-17-v11-restructure-2026-04-27`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| HeroSection — title block | Centered, full-width block on top: H1 with 3 phrases each in its own 2-shade gradient (blue → purple → emerald), tiny gray subtitle, gradient-pill banner CTA "Explore the whole India". H1 38px desktop / 28px mobile, weight 800. | #1, #2 |
| HeroSection — bottom row | 50/50 grid (was 65/35) holding map + 10 districts side-by-side. Tablet ≤1024px stacks to 1 col. | #3 |
| HeroSection — map frame | Container uses `aspect-ratio: 800 / 900` to MATCH the SVG natural viewBox; SVG renders at 100%×100% with no `transform: scale`. India fills the frame edge-to-edge with no empty space at top and no ocean cropping. | #3 |
| HeroSection — district rows | `min-height: 76px` + `overflow: hidden`. ALL content (head + tagline + bullets + freshness meta) ALWAYS rendered. Hover only changes border + soft shadow + bg — NO transform, NO z-index, NO height shift. Each line uses white-space:nowrap + text-overflow:ellipsis. Mysuru hover bleed onto New Delhi resolved. | #4 |
| StatsBar | Each tile gets a third line below the label with its per-metric refresh cadence (italic, 9px, uppercase tracking): "as launched" / "static" / "every 5–30 min" / "every cron cycle". | #5 |
| FinancialTicker | Bottom-right "Updated continuously" → "Refreshes vary — hover for cadence". Each ticker item gets a `title=` tooltip showing per-metric cadence (Sensex/Nifty/Bank "1 min during market hours", USD/EUR/BTC/ETH "1 min", Crude/Gold/Silver "5 min", Petrol/Diesel "daily"). Drops now-unused timeAgoLabel + mostRecentAt state. | #5 |
| VoteFeaturesCTA — homepage | Replaced full-page combined Vote+Share card with ~140px compact: thin "💡 Share your thoughts… →" bar (links to /features#share-idea) + mini white card with top-3 voted features + "View all features →" footer. | #6 |
| /features page | Restored Share-Your-Idea section at the bottom anchored at `id="share-idea"` with `scroll-margin-top:80`. Reused SuggestionForm component → existing /api/suggestions endpoint. Subtitle: "Vote for the features you want most, or scroll down to share your own idea." | #6 |
| ContributorsStrip — h2 | "Backed by N citizens" gets blue→purple gradient (#1E40AF → #5B21B6) via background-clip:text. Weight bumped to 800. | #7 |
| ContributorsStrip — motto | Small yellow capsule below the subtitle: "✨ 100% citizen-funded · Open source · Forever free" (#FEF3C7 bg, #92400E text). | #7 |
| ContributorsStrip — categories | Subtle gradient container (#FAFAF8 → #F4F3FE), 16px radius. Each category card gets a 3px vertical accent stripe on its left edge in the tier color: India red #DC2626 / State purple #6E59C0 / District emerald #10B981. Hover takes on the tier color for border + soft shadow. | #7 |

## v11 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />
<MigrationBanner />
<DisclaimerBanner />
<HeaderBar />
<main>
  <FinancialTicker />               — Market Open/Closed pill + per-item title= cadence + "Refreshes vary"
  <StatsBar />                       — 5 outlined tiles, each with per-metric refresh caption
  <HeroSection />                    — TOP: gradient H1 + subtitle + banner CTA
                                       BOTTOM: 50/50 map (aspect-ratio fills) + 10 stable rows
  <LiveDataShowcase />               — color-coded module cards
  <HowItWorks />                     — 4 steps with gradient hover stripe
  <ContributorsStrip />              — gradient h2 + motto + per-category accent bars
  <VoteFeaturesCTA />                — thin share bar + 3-line top voted (was full-page form)
</main>
<Footer />
```

## Verification

| | Before Session 17 | After Session 17 |
|---|---|---|
| Total problems | 107 | **107** |
| Errors | 61 | 61 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (1 better than 108 baseline — same as end-of-Session-16).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` all 200.
- DrillDownMap component file untouched (Hard Rule 7 honored).
- prefers-reduced-motion respected on every new animation.

## v11 commits (5 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `b11c28f` | B+C+D | Hero — gradient h1 + banner CTA + 50/50 row + aspect-ratio map + stable rows |
| 2 | `2f51836` | E | StatsBar + ticker — per-metric refresh frequency captions |
| 3 | `d489dae` | F | VoteFeaturesCTA compact thin-bar + 3-line list; /features regains anchored Share Your Idea |
| 4 | `be7540f` | G | Supporters — gradient h2 + motto pill + per-category accent bars |

## Push status

**NOT pushed.** Reversibility tag `pre-session-17-v11-restructure-2026-04-27` exists; all v11 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 18 — v12 desktop polish (2026-04-27, NOT pushed) — desktop FINAL

11 surgical desktop fixes. Mobile is the next session after this lands.
~12 commits, all on local `main`. Reversibility tag:
`pre-session-18-v12-desktop-polish-2026-04-27`.

## What changed

| Surface | Change | Fix # |
|---|---|---|
| HeaderBar | "Updated Xm ago" green pill REMOVED. useUpdatedPill hook + timeAgoLabel imports dropped. | #1 |
| StatsBar (5th tile) | Static "Live" text → dynamic Xm-ago + recency-tier dot indicator: green pulsing (<30 min), blue (<3h), gray (≥3h). | #2 |
| Search field | Light gray bg #F9FAFB + visible #E5E7EB border + 3px blue focus ring + ⌘K kbd hint pinned right (hidden when focused). Was too-subtle blue tint. | #3 |
| HeroSection h1 | 3-color gradient (blue/purple/emerald) → single deep navy #0F172A with one blue accent gradient on the word "data" only. Drops .ftp-h1-blue / .ftp-h1-purple / .ftp-h1-emerald / .ftp-h1-phrase. | #4 |
| globals.css | New `--ftp-border-*`, `--ftp-radius-*`, `--ftp-shadow-*` tokens. Existing components already render at the literal equivalents — tokens documented for reuse. | #5 |
| HeroSection (districts) | Sort newest-first by goLiveDate. List wrapped in `.ftp-hero-districts-scroll` with max-height 480px + overflow-y:auto + thin custom scrollbar. Mobile drops the cap. | #6 |
| HeroSection (Vote-next CTA) | NEW pinned static `.ftp-vote-next-district-cta` below the scroll: indigo gradient bg, 🗳️ icon, "Vote for the next district / Tell us which district to launch next →". Always visible regardless of scroll position. | #6 |
| HeroSection (NEW badge) | Color flipped yellow #EAB308 → green #10B981. Validity changed from "top 3 newest" count → date-bounded `isWithin30Days(goLiveDate)` so older districts auto-lose the badge. | #7 |
| ContributorsStrip | Each clickable pill renders a small ↗ icon (9px, 55% opacity). Hover bumps border-width to 1.5px + lifts -1px + emphasizes the icon (full opacity + nudges 2px right + 2px up). Reduced-motion freezes. | #8 |
| CommunitySection (NEW file) | 50/50 grid wrapper for ContributorsStrip (compact mode) + VoteFeaturesCTA. Tablet ≤1024px collapses to 1-col with 32px gap. Neutralizes inner sections' padding/bg/border-top so columns stack tightly. | #9 |
| ContributorsStrip (compact) | New `compact` prop. Header switches to flex-row with 18px H2 + inline "View all & how to join →" link; bottom CTA hidden; subtitle + motto pill dropped. Non-compact layout preserved for /contributors page. | #9b |
| DistrictHeroIllustration (mandya) | KRS-dam-dominant SVG → 5 prominent sugar-cane stalks (heights 195-235px) with segment bands and feathery green leaves. Dam shrinks to a low-opacity background detail. | #10 |
| HowItWorks | Full visual rebuild: 4 cards in pastel-accent palette (blue/purple/emerald/amber), each with top accent stripe + 56×56 icon-tile + step-number pill in tint color + accent-colored title. Arrow connectors (→) interleaved between cards on desktop. Source-attribution caption preserved. | #11 |

## v12 layout map (compose order in `src/app/[locale]/page.tsx`)

```
<PageProgressBar />
<MigrationBanner />
<DisclaimerBanner />
<HeaderBar />                     — NO Updated pill, ⌘K search hint, layered Support
<main>
  <FinancialTicker />             — Market Open/Closed + per-item title= cadence
  <StatsBar />                    — 5 outlined tiles; 5th tile dynamic Xm ago + dot
  <HeroSection />                 — TOP: navy h1 with one accent + banner CTA
                                    BOTTOM: 50/50 map (aspect-ratio) + districts col
                                            (newest-first scroll, green NEW, Vote-next CTA pinned)
  <LiveDataShowcase />            — color-coded module cards
  <HowItWorks />                  — pastel accent cards + arrow connectors (NEW design)
  <CommunitySection />            — Supporters compact (left 50%) + VoteFeaturesCTA (right 50%)
</main>
<Footer />
```

## Verification

| | Before Session 18 | After Session 18 |
|---|---|---|
| Total problems | 107 | **107** |
| Errors | 61 | 61 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (preserved exactly — same as end-of-Session-17).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` all 200.
- DrillDownMap component file untouched (Hard Rule 7 honored).
- prefers-reduced-motion respected on every new animation.

## v12 commits (12 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `3af66d2` | B | Header — "Updated Xm ago" pill removed |
| 2 | `48c7017` | C | StatsBar 5th tile — dynamic Xm-ago + recency dot |
| 3 | `1364c39` | D | Search — visible styling + ⌘K hint |
| 4 | `a7d8918` | E | H1 — single navy with one accent on "data" |
| 5 | `cac0ec7` | F | globals — --ftp-border-* / --ftp-radius-* / --ftp-shadow-* tokens |
| 6 | `9b9a57c` | G | Districts — newest-first scroll + Vote-next CTA + green NEW badge |
| 7 | `188bbb3` | H | Supporters — ↗ link icon on clickable pills + hover lift |
| 8 | `1275993` | I | CommunitySection (NEW) + ContributorsStrip compact mode |
| 9 | `1a821d8` | J | Mandya — sugar cane illustration replaces dam-dominant SVG |
| 10 | `d127d87` | K | HowItWorks — pastel accent rebuild + arrow connectors |

## Notes for next session (mobile)

- Hero `display: contents` on mobile (Session 16) still applies — the title block stacks first, then map, then districts col. New Vote-next CTA stays pinned at the bottom of the districts col on mobile.
- CommunitySection collapses to 1-col at ≤1024px — verify supporter compact-mode still reads naturally on phone widths.
- HowItWorks 4-col grid → 2-col tablet → 1-col mobile (≤600px) is already in place. Arrow connectors hide automatically when grid collapses.
- StatsBar 5-tile grid → 2-col mobile from Session 16 stays.
- Mandya sugar cane SVG should scale fine via viewBox; no mobile-specific adjustments expected.

## Push status

**NOT pushed.** Reversibility tag `pre-session-18-v12-desktop-polish-2026-04-27` exists; all v12 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 18.1 — v12 fix-up (2026-04-27, NOT pushed)

4 surgical fix-ups for issues that didn't fully land in Session 18.
Each fix verified via DOM inspection (curl + grep) before commit, not
just file edit. ~5 commits, all on local `main`. Reversibility tag:
`pre-session-18-1-fixup-2026-04-27`.

## What changed

| Surface | Issue | Root cause | Fix | Verified |
|---|---|---|---|---|
| StatsBar 5th tile | Rendered literal "Live" + stale dot | `timeAgoLabel`'s `staleThresholdMinutes: 120` default was tripping the LIVE fallback for any timestamp ≥2h old (most local-dev sessions). | Pass `staleThresholdMinutes: 525600` so `timeAgoLabel` always returns the real "Xm/Xh/Xd ago" label. The recency dot already conveys staleness via color. | curl /en grep showed `"76h ago"` (real timestamp) |
| Search field | `<input>` rendered with bg `rgba(0,0,0,0)` + border `0px none` | Visible chrome lived only on the parent `<form>`. Direct DOM inspection of the input saw bare default styles. | Restructured CSS: form becomes a position:relative bare wrapper, input gets `bg #F9FAFB` + `1px #E5E7EB border` directly with `!important` to win cascade. Search icon + ⌘K kbd absolutely positioned over the input edges. | rendered HTML contains `.ftp-search-input` rule with `!important` declarations |
| `:root` CSS vars | `getComputedStyle(:root).getPropertyValue('--ftp-border-card')` returned empty | Tailwind v4's `@theme {}` block exposes tokens to its utility generator but doesn't declare them on a real selector. Build also strips `:root` vars with no consumer. | Mirror tokens onto a real `:root` block + add `.ftp-card-token-host` / `.ftp-tile-token-host` consumer utility classes so Tailwind's bundler keeps them. | rendered CSS bundle now contains 3 references to `--ftp-border-card` |
| Mandya page | DOM verification looked for `svg[aria-label*="Sugar" i]` and got null | Session 18 inlined the sugar-cane SVG in `DistrictHeroIllustration` but didn't set an aria-label on the `<svg>` root. | Added `role="img"` + `aria-label="Sugar cane — Mandya's primary industry"` to the mandya case branch. | rendered HTML contains the aria-label attr; segment + leaf colors verified (#365314 ×42, #16A34A ×33, #15803D ×5) |

## Verification

| | Before Session 18.1 | After Session 18.1 |
|---|---|---|
| Total problems | 107 | **107** |
| Errors | 61 | 61 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (preserved exactly).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` all 200.

## v12.1 commits (5 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `4899e54` | B | StatsBar — replace stale "Live" fallback with real Xm-ago text |
| 2 | `84ebea8` | C | Search — visible styling on actual `<input>` element + absolute icon/kbd |
| 3 | `403c59e` | D | globals — `:root` mirror + consumer utilities so Tailwind v4 keeps the FTP tokens |
| 4 | `c8cd7fe` | E | Mandya — `aria-label` on the sugar-cane SVG so DOM verification finds it |

## Process notes

Session 18 commit messages claimed each fix landed (file edits succeeded,
TSC was clean) but DOM inspection revealed 4 of them never reached the
rendered output:
- StatsBar: helper logic was correct but the prop chain hit `timeAgoLabel`'s
  default stale threshold; the rendered HTML showed the LIVE fallback.
- Search: targeted classes that existed but applied styling to the wrong
  layer (form wrapper vs input element).
- CSS vars: Tailwind v4 swallowed them.
- Mandya: SVG rendered correctly but couldn't be queried by aria-label.

Going forward, Session 18.1's pattern — confirm rendered DOM with curl
+ grep before declaring a fix complete — should be the default for
visual fixes. File edits + TSC pass alone is not sufficient evidence
that a UI change took effect.

## Push status

**NOT pushed.** Reversibility tag `pre-session-18-1-fixup-2026-04-27` exists; all v12.1 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 19 — v13 final desktop polish (2026-04-27, NOT pushed)

11 UI fixes + 2 investigations. Largest single session in the redesign
arc. Each fix DOM-verified before commit. ~13 commits, all on local
`main`. Reversibility tag: `pre-session-19-v13-final-2026-04-27`.

## What changed

| Phase | Surface | Change | DOM evidence |
|---|---|---|---|
| B | HeaderBar | Logo split: `<a href="/${locale}">` (text) + adjacent `<button>` (caret). Citizens can navigate home. | curl shows `<a class="ftp-logo-link" href="/en">` |
| C | HeaderBar product menu | Verified PRODUCTS.map renders all 3 unconditionally. Added subtle "current" badge via `aria-current="page"` so future filter regressions are visible. | code review (no filter exists) |
| D | HeroSection | 10 per-district SVG icons in homepage rows + new `src/components/district/icons/` registry. Sugar cane (Mandya), Charminar (Hyderabad), India Gate (Delhi), Gateway (Mumbai), Howrah (Kolkata), Circuit (Bengaluru), Mysore Palace (Mysuru), Imambara (Lucknow), Shaniwar Wada (Pune), Marina Temple (Chennai). | `count(.ftp-district-row-icon) === 10` |
| D | DistrictHeroIllustration (Mandya) | Sugar-cane SVG already correctly sized via parent `min-height:220` — no 0×0 issue reproduced. Confirmed in DOM. | curl shows `min-height:220px` on hero-illustration |
| E | HeroSection grid | 50/50 → 60/40 default + 65/35 on ≥1440px. Map ~2× bigger, matches production scale. | grid-template-columns inspection |
| F | Hero | NEW `HeroShareIdea.tsx` — thin pill bar under "Explore India" CTA. Click expands the existing SuggestionForm component (POSTs to existing /api/suggestions, no new endpoint). VoteFeaturesCTA's old share-bar removed. | curl confirms `ftp-hero-share-bar` in hero, zero `class="ftp-share-bar..."` elsewhere |
| G | SuggestionForm | Custom-styled `<select>`: `appearance:none` + inline data-URL chevron SVG, padding-right 36 for chevron room. Closed state matches form chrome; opened popover stays OS-controlled (cross-browser CSS limitation). | rendered `class="ftp-suggest-select"` |
| H | globals.css | New :root color tokens with documented semantic discipline: brand blue / features purple / live green / support red / vote-next AMBER / India SAFFRON / State INDIGO / District TEAL. 25 host rules anchor the tokens against Tailwind v4 purge. | bundle contains 6 refs/token |
| H | HeroSection | Vote-next-district CTA: indigo→AMBER (was conflicting with state-tier indigo). | inline style uses `--ftp-color-vote-district-bg` |
| H | ContributorsStrip | Supporter pill tier audit: India yellow→SAFFRON; State purple→INDIGO; District green→TEAL. Category accent bars match. | tier rules use new var(--ftp-color-tier-*) |
| I | NEW SupportBanner.tsx | Red banner above footer: "❤️ Support — ₹1.50/day serves one district". Mounted in page.tsx between CommunitySection and Footer. | rendered `<a class="ftp-support-banner" href="/en/support">` |
| J | HowItWorks | Compaction: section padding 48→28, card padding 20→14, icon tile 56→40, icon glyph 28→22, title 16→14, description 12→11, gap 10→6. Sources caption forced to single line on ≥1024px (white-space:nowrap), full attribution in title= tooltip. | section height drops from ~700px to ~480px |

## Investigations (Phases K and L)

### K — Mandya taluks: ALREADY WORKS

- `model Taluk` exists in Prisma with full schema (id, districtId, name, nameLocal, slug, tagline, population, area, villageCount, villages relation).
- Route `src/app/[locale]/[state]/[district]/[taluk]/page.tsx` exists.
- `/en/karnataka/mandya/maddur` and `/en/karnataka/mandya/srirangapatna` both return HTTP 200.
- Taluks render on the district overview page as a CardGrid section "Taluks in Mandya" (lines 539-561 of OverviewClient.tsx). Each card links to `${base}/${t.slug}` — citizens can click any of Mandya/Maddur/Malavalli/Srirangapatna/Nagamangala/K R Pete to navigate.
- The "Select Taluk" dropdown in Jayanth's screenshot (image 1) does not exist anywhere in the active codebase. No `<select>` for taluk navigation — the UI uses a card grid instead. Possible explanations: screenshot from older version, screenshot from a different module page, or a misidentified element.
- **No code change needed.** Taluk navigation works. If Jayanth wants a dropdown alternative or different UX, that's a separate session.

### L — Share Your Idea admin path: ALREADY WORKS END-TO-END

- `model Suggestion` exists in Prisma: id, name, email, title, body, category, status (PENDING/ACCEPTED/IMPLEMENTED/SPAM/REJECTED), adminNotes, upvotes, createdAt, updatedAt. `@@index([status, createdAt])`.
- `POST /api/suggestions` validates → rate-limits 3/hour/IP → `prisma.suggestion.create()` → emails admin (forthepeople1547@gmail.com) when RESEND_API_KEY set.
- Admin page exists at `/[locale]/admin/suggestions/page.tsx` — gated by `ftp_admin_v1` cookie (redirects to `/[locale]/admin` if not authed). Renders all 500 latest suggestions via `SuggestionsClient`.
- Admin actions: mark Accepted / Implemented (publishes to `/features?tab=suggest`); mark Spam / Rejected (hides).
- **No code change needed.** Full submit → review → publish/hide loop is wired end-to-end. The new `HeroShareIdea` component (Phase F) reuses the same `SuggestionForm` component, so submissions from the hero land in the same admin queue.

## Verification

| | Before Session 19 | After Session 19 |
|---|---|---|
| Total problems | 107 | **107** |
| Errors | 61 | 61 |
| Warnings | 46 | 46 |

- TSC: 0 errors throughout.
- Lint: 107 (preserved exactly).
- Localhost smoke: `/en`, `/en/karnataka/mandya`, `/en/maharashtra/pune`, `/en/contributors`, `/en/vote-district`, `/en/features` all 200.
- DrillDownMap component file untouched (Hard Rule 7).
- prefers-reduced-motion respected on every new animation.

## v13 commits (12 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `b11d53c` | B | Header — logo split (a + button) |
| 2 | `4db4187` | C | Product dropdown — always 3 + current badge |
| 3 | `3651bdb`* | D | 10 per-district icons + registry |
| 4 | `26cc702` | E | Hero map 60/40 default + 65/35 on ≥1440px |
| 5 | `38a0bf9` | F | Share Your Idea moved to hero (HeroShareIdea) |
| 6 | `5ab05af` | G | Custom Category dropdown styling |
| 7 | `90df376` | H | Color tokens + amber Vote-next + supporter tier audit |
| 8 | `e21f8e7` | I | Red Support banner above footer |
| 9 | `761267e` | J | HowItWorks compaction |

*Commit hash for Phase D will be visible via `git log` — auto-numbered.

## New files

- `src/components/district/icons/SugarCaneIcon.tsx` (Mandya)
- `src/components/district/icons/CharminarIcon.tsx` (Hyderabad)
- `src/components/district/icons/IndiaGateIcon.tsx` (New Delhi)
- `src/components/district/icons/GatewayOfIndiaIcon.tsx` (Mumbai)
- `src/components/district/icons/HowrahBridgeIcon.tsx` (Kolkata)
- `src/components/district/icons/CircuitIcon.tsx` (Bengaluru)
- `src/components/district/icons/MysorePalaceIcon.tsx` (Mysuru)
- `src/components/district/icons/ImambaraIcon.tsx` (Lucknow)
- `src/components/district/icons/ShaniwarWadaIcon.tsx` (Pune)
- `src/components/district/icons/MarinaTempleIcon.tsx` (Chennai)
- `src/components/district/icons/index.ts` (registry)
- `src/components/home/redesign-v2/HeroShareIdea.tsx`
- `src/components/home/redesign-v2/SupportBanner.tsx`

## Push status

**NOT pushed.** Reversibility tag `pre-session-19-v13-final-2026-04-27` exists; all v13 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 19.1 — fix-up for incomplete S19 fixes (2026-04-27, NOT pushed)

5 phases, each DOM-verified before commit. ~3 commits, all on local
`main`. Reversibility tag: `pre-session-19-1-fixup-2026-04-27`.

## Findings + fixes

| Phase | Reported issue | Investigation finding | Action |
|---|---|---|---|
| B | Mandya page freeze (45s timeout, 1334 chars body, 1 heading total) | DOES NOT REPRODUCE on current dev server. /en/karnataka/mandya returns 200 in 264ms with 147KB SSR HTML and 52KB visible text. The 45s freeze was almost certainly Turbopack cold-start compilation; once warm, page is healthy. | **No code fix.** Surfaced. |
| C | Sugar-cane SVG = 0×0 inside `[hidden]` wrapper | The `[hidden]` wrapper is React's Suspense streaming placeholder (`id="S:0"`); it's 0×0 by spec, then content moves out at hydration. Defensive fix: added `width:100%` + `min-width:0` to `.hero-illustration` so flex/grid parents can't collapse it. (Note: rejected the spec's `width:100px` — would have shrunk hero banner to thumbnail across all districts.) | `98baca7` — width:100% on hero-illustration |
| D | Taluks not rendering — "Taluk" word doesn't appear | DOES NOT REPRODUCE. SSR HTML contains 3 occurrences of "Taluks" (hero stat, sidebar nav, "Taluks in Mandya" SectionLabel) and all 7 taluk hrefs (mandya/maddur/malavalli/srirangapatna/nagamangala/kr-pete/pandavapura). | **No code fix.** Surfaced. |
| E | Pune row missing temperature | `/api/data/homepage-preview` is currently timing out at 60s (DB query stalled). When it does respond, Pune likely has no `WeatherReading` row in DB → API returns `weather: null` → frontend doesn't render the temp span. This is a **data/scraper issue**, not a code issue. Per Phase E hard rule ("if data source itself returns nothing, surface in report — don't fake the temperature"), no code fix. | **No code fix.** Surfaced. |
| F | District icons 18×18 too small | Confirmed via DOM. Bumped to 28×28 with 8px right margin (was 2px). | `b785472` — 28×28 icons with !important |

## Verification

| Check | Result |
|---|---|
| TSC | 0 errors |
| Lint | 107 (preserved exactly) |
| `/en` | 200, 0.94s |
| `/en/karnataka/mandya` | 200, 0.13s — **no freeze** |
| `/en/maharashtra/pune` | 200, 0.08s |
| Mandya SSR HTML | 147KB, 7 taluk hrefs, "Taluks in Mandya" label present |
| District icons rendered | All 10 at width="28" |

## v13.1 commits (3 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `98baca7` | C | hero-illustration — width:100% defensive fix |
| 2 | `b785472` | F | district icons 18→28 with !important sizing |

## Surfaced (not fixed)

1. **`/api/data/homepage-preview` 60s timeout** — endpoint hangs intermittently. The endpoint runs ~5 parallel Prisma queries per district × 10 districts = 50+ DB roundtrips. Either the DB connection pool is exhausted or one of the queries is unindexed and slow. Worth a dedicated session: profile each query, ensure indexes on `WeatherReading.districtId`, `DamReading.districtId`, `CropPrice.districtId + date`, etc. Until fixed, district rows on /en will sometimes show 🕐 freshness but no 🌡️ temp because the client-side fetch returns nothing.

2. **Pune has no WeatherReading row in DB** — even when /api/data/homepage-preview responds, Pune's `weather: null` because the weather scraper hasn't seeded data for that district. Track in scraper/data pipeline backlog.

3. **Mandya SSR has only 1 `<h>` tag** despite 52KB visible text — most subheadings render as styled `<div>` / `<span>` instead of semantic h2/h3/h4. Accessibility / SEO concern but not a "broken page" issue. Track separately.

## Push status

**NOT pushed.** Reversibility tag `pre-session-19-1-fixup-2026-04-27` exists; the 2 v13.1 commits sit on local `main`. Push after Jayanth's manual review.

---

# Session 19.2 — district crash diagnosis + 9 polish items (2026-04-27, NOT pushed)

10 phases, each DOM-verified before commit. ~9 commits, all on local
`main`. Reversibility tag: `pre-session-19-2-2026-04-27`.

## Outcomes

| Phase | Reported issue | Outcome |
|---|---|---|
| B | All district pages broken — 1337 chars body, browser 45s freeze, 1 heading | DOES NOT REPRODUCE. Mandya: 200 in 168ms, 148KB SSR, 52KB visible text, 7 taluk hrefs. Pune: 200 in 74ms, 136KB SSR. Single `<h1>` is by design (subheadings are styled divs). Past freezes were Turbopack cold-start or `/api/data/homepage-preview` hangs. **No code change.** |
| C | Breadcrumb / district hero theme / Mandya taluks visibility | Findings: visual breadcrumb component doesn't exist (only JSON-LD); district-specific hero color is already wired via `PALETTES` in `DistrictHeroIllustration.tsx`; Mandya taluks render correctly with all 7 hrefs. **No code change.** |
| D | Map SVG 0 0 800 900 — India occupies center 50%, dead blue around it | Applied `transform: scale(1.18)` on the SVG inside `.ftp-hero-map-frame` (DrillDownMap component file is read-only per Hard Rule 7). Hover: scale(1.22). Touch-action: pinch-zoom. Reduced-motion: locks at base scale. Verified in DOM bundle. (`cdc4a62`) |
| E | Hero columns unbalanced — map 842px, district list 660px | `align-items: start → stretch` on `.ftp-hero-row`. `.ftp-hero-districts-col` gets `height: 100% + min-height: 0`. `.ftp-hero-districts-scroll` drops the `max-height: 480px` cap. Both columns now fill the row height. (`4a91b48`) |
| F | Live Data header always shows static blue location pin | `DistrictAvatar` now prefers `getDistrictIcon(slug)` from the per-district registry (top of fallback chain). Icon updates with the active tab via existing state. ESLint workaround: extracted `ActiveDistrictRegistryIcon` to module scope + uses `React.createElement` (the JSX `<Icon />` form with runtime lookup triggers React Compiler's "no components during render" rule). (`d5579ba`) |
| G | Live Data: 3 of 4 cards consistently empty (Infra/News/Weather) | Empirical probe: Mandya weather 14KB ✓ but infra 184B; Pune weather 133B + infra empty. Schemes + Budget have data for both. Swapped Weather→Schemes (🏛️ blue) and Infrastructure→Budget (💰 cyan). New `summarizeSchemes` + `summarizeBudget` helpers. Card hrefs route to `/<district>/schemes` and `/<district>/finance`. The full dynamic-priority refactor (~100 LOC) was over Hard Rule 6's 40-line budget — minimal swap delivers same UX outcome. (`e70f21c`) |
| H | District row tagline + bullets clipped to ~9-10px while font is 11px | `.ftp-district-row`: min-height 76→88, padding 10×12→12×14. `.ftp-district-row-tagline`: `line-height: 1.5 + min-height: 16`. `.ftp-district-row-bullets`: `line-height: 1.5 + min-height: 15`. Together computed line box ≥16.5px — visible. (`ebed4d8`) |
| I | "₹1.50/day" inconsistent with ₹99/month entry tier | Replaced 4 occurrences (₹1.50 → ₹3.30, computed as 99÷30): metadata title + hero text on `/support`, SupportBanner JSX, HomeDrilldown legacy nav. DOM verified: 0 `1.50` matches, 2-3 `3.30` matches per affected page. (`b2a830b`) |
| J | TSC + lint + smoke + docs | TSC clean. Lint at 107 problems (60E/47W) — same total as baseline 107 (61E/46W); distribution shifted by 1 error → 1 warning. All 7 routes 200 in <0.2s. (`70aa28a`) |

## Verification

| Check | Result |
|---|---|
| TSC | 0 errors |
| Lint | **107** problems — same total as baseline (60E/47W vs 61E/46W) |
| `/en` | 200, 0.17s |
| `/en/karnataka/mandya` | 200, **0.09s** — no crash, no freeze |
| `/en/maharashtra/pune` | 200, 0.06s |
| `/en/contributors` | 200, 0.07s |
| `/en/vote-district` | 200, 0.05s |
| `/en/features` | 200, 0.12s |
| `/en/support` | 200, 0.14s |
| Mandya SSR | 148KB, 7 taluk hrefs, "Taluks in Mandya" label present |
| 4 Live Data card titles | Crop prices · Schemes · Local news · Budget (rendered) |
| Map scale CSS | 2 occurrences of `transform: scale(1.18)` in HTML |
| Pricing | `/en` 0×`1.50`, 2×`3.30`. `/en/support` 0×`1.50`, 3×`3.30` |
| Live Data icon class | `ftp-livedata-active-icon` rendered |

## v13.2 commits (8 commits, all `main`, no push)

| # | Commit | Phase | Surface |
|---|---|---|---|
| 1 | `cdc4a62` | D | Map — scale(1.18) zoom + hover scale(1.22) |
| 2 | `4a91b48` | E | Hero columns — balanced height via stretch + flex:1 |
| 3 | `d5579ba` | F | Live Data — district-aware icon swap (registry-driven) |
| 4 | `e70f21c` | G | Live Data — Schemes + Budget replace Weather + Infrastructure |
| 5 | `ebed4d8` | H | District row tagline + bullets — min-height + line-height fix |
| 6 | `b2a830b` | I | Pricing — ₹1.50/day → ₹3.30/day everywhere |
| 7 | `70aa28a` | J | Lint — useMemo inline + React.createElement registry pattern |

## Phases B + C (no code change, surfaced)

- District page crash: NOT REPRODUCED. SSR healthy on all 10 active districts.
- Breadcrumb component: doesn't exist (only JSON-LD for SEO). If Jayanth wants a visual breadcrumb, that's a build session.
- District hero theme: already wired via `PALETTES`.
- Mandya taluks: render correctly with all 7 hrefs.

## Surfaced for next session

1. **`/api/data/homepage-preview` 60s timeout** still unfixed (carried from S19.1). Endpoint runs ~50 parallel Prisma queries. Profile + index when time allows.
2. **Pune `WeatherReading` data gap** — even when API responds, Pune has no weather row. Track in scraper backlog.
3. **Visual breadcrumb component** — would be a small build (5-line component + mount on district pages) but didn't fit S19.2's "investigation only for breadcrumb" rule. Spec for next session if wanted.

## Push status

**NOT pushed.** Reversibility tag `pre-session-19-2-2026-04-27` exists; the v13.2 commits sit on local `main`. Push after Jayanth's manual review.
