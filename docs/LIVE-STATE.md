# ForThePeople.in — Live State

_Living document. Append new sections; don't rewrite history._

---

## 2026-06-11 — Session 2 (audit fix): Drop db-push from build/CI + patch Next 16.2.4→16.2.6 (PRE-PUSH)

**Status:** Branch `session-2-build-cve` off `main` (local only, not pushed). Second of the 5 audit-fix sessions. See `docs/BUG-TRACKER.md` → SEC-2. Touches build config + deps only — zero application code.

### What landed
- **Removed `prisma db push` from the build** — `vercel.json` `buildCommand` and the `package.json` `"build"` script are now `prisma generate && next build`. Previously db push ran on *every* deploy (including unreviewed dependabot PR previews) against the prod Neon schema — root cause of the red CI / ERROR preview builds and a real risk of dropping prod columns. (`db:push` npm script already existed for deliberate pushes.)
- **Patched Next.js 16.2.4 → 16.2.6** — the 7 May 2026 security release (13 advisories; patched only in 16.2.6; Vercel shipped no WAF coverage, so patching is the only fix). `npm install next@16.2.6 --legacy-peer-deps`. **Did NOT run `npm audit fix`** (prohibited).
- **`.github/workflows/ci.yml`** — added a dummy non-empty `ADMIN_SESSION_SECRET` to the Build step env. This branch is off main so `admin-auth.ts` isn't here yet, but once Session 1 merges, `next build` executes its module-load throw and CI would fail without the var. Lint job untouched.
- **NEW `.github/dependabot.yml`** — groups minor+patch npm (and github-actions) updates into one weekly PR instead of a PR per bump.

### New workflow (IMPORTANT)
Schema changes are now applied **manually** via `npm run db:push` against prod Neon **BEFORE** pushing dependent code. The build never mutates the DB. Documented in `CLAUDE.md` and `BLUEPRINT-UNIFIED.md`.

### Verified locally
- Lockfile + `node_modules/next/package.json` both resolve to **16.2.6** (not just the package.json range).
- `rm -rf node_modules && npm ci --legacy-peer-deps` → clean (added 871 packages, no ghost/lockfile errors).
- `npx tsc --noEmit` → 0 errors.
- `npm run build` → completes (exit 0), grep-confirmed **no `prisma db push`** ran, 174 static pages generated.
- Dev smoke (16.2.6 dev server): `/en`, `/en/karnataka/mandya`, `/en/india` → 200; `/about`, `/disclaimer` → 307 locale-redirect → `/en/about`, `/en/disclaimer` 200.

### Merge note
Off main, so this branch's `BUG-TRACKER.md` (created here) and the top-of-file entries in `BLUEPRINT-UNIFIED.md` / `LIVE-STATE.md` will trivially union-conflict with Session 1's. Recommended: merge `session-1-admin-auth` first, then rebase `session-2-build-cve` onto updated main and keep both dated entries. ⚠️ Also: set `ADMIN_SESSION_SECRET` in Vercel env before the combined push (Session 1 requirement).

---

## 2026-04-26 — Session 11: Homepage redesign-v2 (slim core) (PRE-PUSH)

**Status:** ~138 commits ahead of origin/main (was 125 → +13 this session). 12 component commits + 1 page.tsx snapshot + 1 page.tsx swap + 1 docs commit. Pure presentation layer; zero schema, API, Razorpay-write, or env-var changes. No new npm dependencies.

### What landed
**11 new components** in `src/components/home/redesign-v2/`:
1. `DisclaimerBanner.tsx` — sessionStorage dismiss, amber palette, prefers-reduced-motion slide-in
2. `HeaderBar.tsx` — sticky header with product dropdown (.in/.connect/.jobs), Updated-pill polling homepage-stats, search, theme toggle (reuses existing ThemeToggle), language menu (10 entries), GitHub link with hardcoded ★ 149 fallback, ♥ Support button, mobile collapse to logo + search + ♥ + ☰
3. `FinancialTicker.tsx` — 60s left-right marquee from `/api/data/market-ticker`, dedup fix (renders ONCE)
4. `LiveActivityRibbon.tsx` — 90s marquee with pulsing LIVE indicator, derives from `homepage-stats` + `homepage-preview`
5. `HeroSection.tsx` — 60/40 grid, 5-stat row (no count-up; static values), 🇮🇳 in tagline, India map placeholder
6. `DistrictExplorer.tsx` — single "By tier" tab + disabled "By region" tooltip, sections: Recently launched · Metro · Tier 2 · Tier 3 · Coming next vote
7. `LiveDataShowcase.tsx` — district chip tabs + 4 module cards (Crops · Infra · News · Weather) with `/public/districts/<slug>.svg` slot + generic location-pin fallback
8. `FoundingPatronCard.tsx` — founder treatment for top supporter (Micah Alex), gold glow pulse
9. `SupporterMarquee.tsx` — 50s marquee with 3-tier badges (patron red / state violet / district emerald)
10. `PricingTiers.tsx` — 3 cards ₹99/₹999/₹9,999 with auto-select deep links to /<locale>/support; State Champion middle highlighted with violet glow pulse
11. `Footer.tsx` — 3 rows (warning · links · social) with brand IG `@forthepeople_in` finally added (was missing on legacy footer)

**Page swap** ([locale]/page.tsx commit `3dd7570`): server-fetches `prisma.district.findMany` + `prisma.districtRequest.findMany` once and feeds the body components. Layout-level chrome (legacy DisclaimerBar + Header + Footer) intentionally preserved to keep district pages stable. The new chrome components are TSC-clean and ready for a future layout-level elevation.

### Verified
- `npx tsc --noEmit` clean throughout (verified after each commit)
- `GET http://localhost:3000/en` returns HTTP 200 after swap
- All 4 backend APIs untouched
- All animations use raw CSS keyframes (no framer-motion); all respect `prefers-reduced-motion`
- Mobile breakpoint: single 768px threshold, components declare scoped media queries inline
- Email-rule grep: 0 hits in src/prisma/scripts
- Git author: jayanthmbj@gmail.com only

### Reversibility (4 layers)
- Tag `pre-session-11-homepage-redesign-2026-04-26` at commit `1c50966`
- Branch `backend-backup-11-2026-04-26`
- Snapshot `src/app/[locale]/page.v8.tsx` (pre-swap)
- All 11 legacy components remain on disk + still wired in `[locale]/layout.tsx`

### Deferred to future session
- Interactive 780-district SVG choropleth (`react-simple-maps` IS installed; deferred for scope)
- Count-up animations on hero stats
- GitHub stars live API fetch (`swr` not installed)
- react-window virtualization for district list
- Per-district SVG illustrations (slot at `public/districts/` ready)
- `/coming-soon` page (for ProductDropdown links)
- `/en/india-detail` page content
- Layout-level swap to redesign-v2 chrome (after district pages redesigned)
- Hindi + other non-en/kn locales

### In-repo reference
`docs/HOMEPAGE-REDESIGN-V5-SLIM.md` — full layout map · tier color reference · animation table · mobile breakpoints · endpoint inventory · `/public/districts/` SVG slot pattern · deferred backlog.

---

## 2026-04-26 — Session 10.6: Razorpay reconciliation + GitHub PR triage + README sync (PRE-PUSH)

**Status:** 125 commits ahead of origin/main. 3 code commits (plans.ts amount alignment + README sync + this docs commit). 8 reply drafts staged in `/tmp/pr-replies/` for Jayanth to post.

### Phase 1 verdict — ✓ NO BILLING HARM
Read-only Razorpay live-mode audit (per Jayanth's explicit consent) confirmed:
- 4 env-var plan_ids (FOUNDER/PATRON/STATE/DISTRICT) point to plans whose Razorpay-side amounts differ from current UI labels (PATRON 5×, STATE 10×, DISTRICT 10× higher than UI shows)
- BUT: zero active paying subscribers on any of those plans. The 2 'created'-status subs that exist are TEST DATA from Apr 10 (names "dd"/"ff", paid_count=0, never charged)
- Real subscribers are on either:
  - Older legacy static plans `plan_SbraA*` (Apr 11-13 cohort — paid what their UI showed at that time)
  - Per-subscriber dynamic plans `plan_S{xxxxx}` (Apr 14+ cohort — generated at chosen amount via `create-subscription/route.ts`)
- DB `Supporter.amount` matches actual Razorpay charge in every case verified (Abhishek ₹2K, Jaspreet ₹200, Anupam ₹99, Agraja ₹99, SML Finance ₹99, etc.)

Full evidence saved to `/tmp/billing-recon.json`.

### What changed (this session)
- **`src/lib/razorpay/plans.ts`** — top JSDoc rewritten with the audit findings + reconciliation snapshot table; `state_champion_monthly_legacy.amount` `199900 → 1000000` (₹1,999 → ₹10,000); `district_champion_monthly.amount` `9900 → 200000` (₹99 → ₹2,000); labels updated to flag both as "vestigial". planId / interval unchanged (no behavioral diff).
- **`README.md`** — districts list rewritten as bullet-by-state (10/7), AI tech-stack row corrected (Anthropic/Gemini → OpenRouter), "Currently at 9" → "Currently at 10", new "Active Contributors" section recognizing 5 external contributors + CodeRabbit.

### GitHub PR triage (7 PRs)
- ALL 6 external PRs (#14, #16, #24, #25, #32, #34): MERGEABLE-AFTER-REBASE — all touched files either untouched locally or trivially conflicting. Reply drafts in `/tmp/pr-replies/pr-XX-reply.md` ready to paste.
- PR #31 (Jayanth's own migration banner): OBSOLETE — superseded by direct commits Apr 20. Reply draft instructs to close.
- Issue #13 (@tiwarikaran — Ahmedabad): ENCOURAGE — reply points at Pune (#10) as freshest reference template + lists Gujarat data sources.
- STATUS pinned issue draft at `/tmp/pr-replies/status-pinned-issue.md`.

### Reversibility (4 layers, intact)
- Tag `pre-session-10.6-recon-triage-2026-04-26` at commit `817f468`
- Branch `backend-backup-10.6-2026-04-26`
- All edits are minimal-scope (3 files: plans.ts, README.md, this LIVE-STATE)
- `/tmp/pr-replies/` is throwaway scratch (no git tracking)

### Verified locally
- `npx tsc --noEmit` clean throughout
- Razorpay GET-only API calls succeeded (5 plans + 5 subscriptions + 6 sub-detail queries — no writes)
- DB Supporter cross-check ran against production Neon (read-only)
- Email-rule grep clean (0 hits)
- Git author: jayanthmbj@gmail.com only

### Pending Jayanth manual (after this session)
- ⏳ Post 8 PR/issue replies from `/tmp/pr-replies/` (edit drafts to your voice first)
- ⏳ Close PR #31 with the prepared comment
- ⏳ Post STATUS pinned issue
- ⏳ Hostinger DNS records for Resend
- ⏳ Railway Hobby upgrade ($5/mo, in 2 days)
- ⏳ Neon spending limit toggle
- ⏳ Final unified `git push origin main` (~125 commits)

---

## 2026-04-26 — Session 10.5: Full delegation (Razorpay + Sentry + audits) (PRE-PUSH)

**Status:** 122 commits ahead of origin/main. 3 code commits this session
(Razorpay plan_id, Sentry instrumentation migration, docs handoff update).
🚨 LIVE Razorpay plan created (`plan_Si4gHceNb9Mz4w`, ₹999 monthly).

### What changed
- **Razorpay** — `POST /v1/plans` created `plan_Si4gHceNb9Mz4w` (live mode,
  ₹999 monthly INR State Champion). `src/lib/razorpay/plans.ts` updated
  with hardcoded fallback + `RAZORPAY_PLAN_STATE_CHAMPION` env override.
- **Sentry** — migrated from deprecated `sentry.{client,server,edge}.config.ts`
  (Apr 11 setup, never auto-loaded by Next.js 16) to the Sentry-v10/Next-16
  convention: `src/instrumentation.ts` + `src/instrumentation-client.ts`.
  Updated `withSentryConfig` org/project to match the dashboard
  (`forthepeoplein/javascript-nextjs`) and added `authToken` for source-map
  upload. Sampling preserved (5% traces, no Session Replay,
  production-only enable).
- **Audits** — verified existing 4 Razorpay plan IDs against env vars (all
  present). Verified Razorpay webhook config (URL/events correct, but
  webhook is DISABLED since Apr 19 — needs manual re-enable per HARD
  RULE 8). Verified Resend key behavior (restricted-scope, send-only;
  domain status check requires Jayanth's visual check).

### What stays manual
- Vercel env var paste (optional): `RAZORPAY_PLAN_STATE_CHAMPION=plan_Si4gHceNb9Mz4w`
  — only needed if env override is preferred over the hardcoded fallback
- Razorpay dashboard: re-enable webhook (disabled since 2026-04-19)
- Hostinger DNS: 3 records for forthepeople.in (Resend domain verification)
- Railway Hobby upgrade ($5/mo) — Jayanth doing in 2 days
- Neon spending limit ($10/mo cap) — 30-second click

### Anomaly noted (not blocking)
Existing Vercel env vars `RAZORPAY_PLAN_STATE` (₹10,000 plan) and
`RAZORPAY_PLAN_DISTRICT` (₹2,000 plan) point to plans whose amounts
don't match the comments in `plans.ts` (which describe them as the
₹1,999 legacy and ₹99 District tiers). These have been live for weeks;
real subscribers may be charged amounts different from what UI labels
imply. Not in scope for this session — flagged for a separate
reconciliation prompt.

### Reversibility (4 layers, intact)
- Tag `pre-session-10.5-full-delegation-2026-04-26` at commit `f65de7c`
- Branch `backend-backup-10.5-full-2026-04-26`
- All Sentry config files removed (`sentry.{client,server,edge}.config.ts`)
  are recoverable via `git checkout pre-session-10.5-* -- ...`
- Razorpay plan_id is hardcoded in source (no rollback risk)

### Verified locally
- `npx tsc --noEmit` clean
- Dev server restart with new instrumentation: HTTP 200 on `/en` + all API routes
- `GET /v1/plans/plan_Si4gHceNb9Mz4w` 200 OK
- `GET /v1/webhooks` returned the (disabled) webhook with correct URL + events
- Email-rule grep clean (0 hits in src/prisma/scripts)
- Git author: jayanthmbj@gmail.com only

---

## 2026-04-26 — Session 10 Unified: cross-platform audit + homepage-stats fix (PRE-PUSH)

**Status:** 116 commits ahead of origin/main. 3 code commits this session (1 snapshot, 1 fix, 1 docs) + Phase 1 instrumentation reverted cleanly. Pure presentation-layer fix; backend untouched.

### Backend health (post Session 10 audit, 2026-04-26 ~08:00 UTC)

#### ✅ Healthy
- **Vercel Pro** (zurvoapp account): all 5 crons firing on schedule, 0% error rate over 6h
- **Neon "Launch"** paid plan: org "For The People", AWS Singapore, DB hot every few minutes
- **Upstash Redis** `forthepeople-production`: Pay-As-You-Go with $50 budget cap, $0.29 used this month, endpoint `allowing-kid` matches Vercel `REDIS_URL` (no drift)
- **News scraper:** 8 of 10 districts updated within last hour at audit time
- **News-intelligence cron** (every 4h): healthy, last write 1.7h before audit
- **Generate-insights cron** (every 12h): healthy, AIInsight last 1.7h before audit

#### 🟠 Stale-upstream (NOT a code bug, NOT a budget issue)
- **AGMARKNET (data.gov.in) crops:** API returns 200 with records, but data hasn't been updated since 2026-04-21. Verified via Phase 4 `[scrape-debug]` instrumentation across all 10 districts: every record returned has `arrival_date="21/04/2026"`, identical to existing rows → dedup correctly skips.
- **Mandya / Bengaluru-urban RSS:** sparse, 24-72h cycle (genuinely low publication frequency).

#### 🚨 External issues (manual action required — see docs/41-Session10-Manual-Actions-Required.md)
- **Railway scraper container:** trial expires in 2 days. Last successful deploy Apr 22. Causes weather/dam/traffic frozen since Apr 21. Upgrade to Hobby ($5/mo) — one click.
- **Sentry SDK:** `@sentry/nextjs ^10.48.0` installed and `Sentry.captureException` used in 7+ places, BUT `instrumentation.ts` is missing → SDK never initialized → 0 events received in console. Also: `next.config.ts` `org/project` (`forthepeople/forthepeople-web`) doesn't match Jayanth's dashboard (`forthepeoplein/javascript-nextjs`). Both need clarification before fix.
- **RESEND_API_KEY:** key is valid + restricted-scope (send-only). Vercel "Needs Attention" badge most likely about domain verification — Jayanth must visually check resend.com/domains.

### What changed this session
- **`src/app/api/data/homepage-stats/route.ts`** — `mostRecentAt` now reads `newsItem.fetchedAt` + `infraUpdate.createdAt` + `localAlert.createdAt` instead of the two upstream-stale sources (`cropPrice.fetchedAt`, `weatherReading.recordedAt`). `CACHE_KEY` bumped `v2 → v3` to force Redis cache eviction on next deploy.
- **`src/app/api/data/homepage-stats/route.v2.ts`** — pre-edit snapshot.
- **`docs/41-Session10-Manual-Actions-Required.md`** — Railway, Razorpay, RESEND, Sentry handoff.

### Phase 1 cleanup
The Session-10-FIX Phase 3 `[scrape-debug]` instrumentation in `crops.ts`/`news.ts` was reverted via `git checkout HEAD -- ...` before any new work. Zero refs remain in src/.

### Verification
- ✅ `npx tsc --noEmit` clean
- ✅ `/api/data/homepage-stats` pre-fix `2026-04-24T03:30:43Z` → post-fix `2026-04-26T06:03:47Z` (~1h ago)
- ✅ `fromCache:false` in response confirms v3 cache-key took effect
- ✅ Email-rule grep clean (0 hits in src/prisma/scripts)
- ✅ Git author: jayanthmbj@gmail.com only

### Reversibility (4 layers, intact from Session-10-FIX setup)
- Tag `pre-session-10-fix-scraper-skip-2026-04-26` at commit `6d045d3`
- Branch `backend-backup-10-2026-04-26`
- Snapshot `src/app/api/data/homepage-stats/route.v2.ts`
- Rollback addendum: revert via `cp route.v2.ts route.ts` or `git checkout pre-session-10-fix-scraper-skip-2026-04-26 -- src/app/api/data/homepage-stats/route.ts`

---

## 2026-04-25 — Session 8: move BACKED BY supporter strip below stats row (PRE-PUSH)

**Status:** 113 commits ahead of origin/main. 2 code commits (1 backup, 1 move) — pure UI, zero backend.

### Why
Jayanth's annotated screenshot review: 🏆 BACKED BY strip was sitting between the market ticker and the kicker, interrupting the kicker → CTAs → stats reading flow. Moved to between the stats row and the map section so the kicker hits immediately and supporters appear contextually after the value (stats) and before the product (map).

### What changed
- **`src/app/[locale]/page.tsx`** — removed `<TopTierShowcase locale={locale} />` from line 91 (between MarketTickerClient and the kicker block) + dropped the now-unused import.
- **`src/components/layout/HomeDrilldown.tsx`** — imported `TopTierShowcase`, mounted `<TopTierShowcase locale={locale} />` between `<HomepageStats />` (line 159) and the click-a-state map header (line 178). HomeDrilldown is the only consumer of HomepageStats and the map, so this single insert positions BACKED BY correctly without leaking into other pages.

### Architecture note
Both `<HomepageStats />` and the map render INSIDE `<HomeDrilldown>`, not as sequential children of page.tsx. Two-file change required (rather than the single-file move the prompt initially anticipated). `<HomeDrilldown>` has exactly one consumer (`/en/page.tsx`), confirmed via `grep -rn HomeDrilldown src/`.

### What's preserved
- `<MarketTickerClient />` stays at top of page.tsx
- Kicker, 2 CTA pills, bottom strips, RequestScrollMount, scroll fix from Session 7.7
- TopTierShowcase component itself untouched (same `locale` prop, same `useQuery` against `/api/data/contributors?type=top-tier&limit=20`, same loading/empty states)
- Backend: zero changes

### Files touched (2 + 2 backups)
- `src/app/[locale]/page.tsx` (remove import + JSX)
- `src/components/layout/HomeDrilldown.tsx` (import + JSX between stats and map)
- `src/app/[locale]/page.v7.tsx` (pre-edit snapshot)
- `src/components/layout/HomeDrilldown.v3.tsx` (pre-edit snapshot)

### Reversibility (4 layers)
- Tag `pre-session-8-move-backedby-2026-04-25` at commit `9da7f32`
- Branch `ui-backup-8-2026-04-25`
- 2 file snapshots: `page.v7.tsx`, `HomeDrilldown.v3.tsx`
- 4-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

### Verification done from terminal
- ✅ `npx tsc --noEmit` clean
- ✅ Source: 0 `TopTierShowcase` references in page.tsx
- ✅ HomeDrilldown render order: HomepageStats(159) → TopTierShowcase(165) → "click a state"(178)
- ✅ /en HTML byte-order grep: kicker(24729) < stats(26379) < map(28358)
- ✅ /api/data/contributors?type=top-tier returns Micah Alex (the founder backer)
- ✅ All 4 backend APIs HTTP 200; all 7 page routes HTTP 200

### SSR limitation noted
TopTierShowcase is `"use client"` with `if (isLoading) return null;` — renders nothing on SSR. Visual position only materializes after client hydration + React Query fetch. The React-tree position is what matters; verified via source-tree inspection above.

### Pending Jayanth Chrome MCP confirmation
- Desktop 1280px: ticker → kicker → 2 pills → stats → 🏆 BACKED BY → map
- Mobile 375px: same order, BACKED BY column-stacks per existing media query
- Click "Support ForThePeople.in →" still opens Razorpay
- Click "Your name here" still opens Razorpay
- Session 7.7 scroll fix still works (click 📍 Find your district → scrolls)

---

## 2026-04-25 — Session 7.7: final scroll fix + two-layer fallback (corrective) (PRE-PUSH)

**Status:** 111 commits ahead of origin/main. 4 code commits (1 backup, 1 plain-a rewrite, 1 polyfill, 1 SupportCheckout) — pure UI, zero backend.

### Why
Session 7.6 cleaned globals.css source but Chrome MCP found `scroll-behavior:smooth` STILL in the served Turbopack chunk. Phase 1 grep proved the source file was clean — it was a stale compiled chunk. Forced a full rebuild (`pkill next dev` + `rm -rf .next .turbo` + restart), then verified the freshly emitted chunk had zero `scroll-behavior` occurrences. Layered two more defenses to make the fix bulletproof regardless of any future runtime weirdness.

### What changed
- **CSS chunk** — verified clean post-rebuild. Source file unchanged this session (Session 7.6 already removed the rule).
- **`src/components/home/request/RequestCTALink.tsx`** — full rewrite. Was `next/link <Link>` wrapper, now plain `<a>` wrapper. Suspected: Next.js soft-route was canceling the rAF tween. Modifier-key guard added (cmd/ctrl/shift-click + middle-click bypass the handler so browser can open new tabs natively).
- **`src/components/home/NextDistrictLeaderboard.tsx`** — 4 `<Link>` → plain `<a>` (3 leaderboard rows + 1 bottom CTA), removed unused `next/link` import, modifier-key guard added.
- **`src/lib/utils/scroll-to-request.ts`** — replaced with two-layer polyfill:
  - Layer 1: rAF cubic ease-out, 500ms, calls positional `window.scrollTo(0, easedY)` per frame
  - Layer 2: After 700ms, if `Math.abs(window.scrollY - target) > 100px`, force `el.scrollIntoView({block:'start'})` (the only API confirmed working in EVERY Chrome MCP test across 4 sessions)
  - Honors `prefers-reduced-motion` via JS `matchMedia` (skips Layer 1)
  - Diagnostic `[FTP scroll]` console.log gated behind `DEBUG_LOG = true` flag — flip in future cleanup
- **`src/components/support/SupportCheckout.tsx:130`** — dropped `behavior:'smooth'` from `containerRef.current?.scrollIntoView()`. Same root-cause as the /<locale>#request bug. Kept `block:'center'` positioning.

### What's preserved
- `id="request"` anchor + `scroll-margin-top:80px` on DistrictRequestSection (Session 6)
- 80px header offset, `Math.max(0, ...)` clamp, sessionStorage cross-page handoff, post-mount delay (bumped 150→200ms), `replaceState` URL update
- All Session 1-7.6 wins on /en, /en/india-detail, sourcing, INDIA AT A GLANCE, color grades, NEW pill SSR fallback
- href attribute on every link (right-click + keyboard tab+Enter + no-JS fallback)
- Public API of scroll-to-request.ts unchanged — `RequestScrollMount` and the rest needed no edits
- Backend: zero changes

### Files touched (4 + 4 backups)
- `src/components/home/request/RequestCTALink.tsx` (Link → a)
- `src/components/home/NextDistrictLeaderboard.tsx` (4× Link → a, removed import)
- `src/lib/utils/scroll-to-request.ts` (two-layer polyfill)
- `src/components/support/SupportCheckout.tsx` (drop behavior:smooth)
- `src/app/globals.v3.css` (pre-edit snapshot)
- `src/lib/utils/scroll-to-request.v3.ts` (pre-edit snapshot)
- `src/components/home/request/RequestCTALink.v1.tsx` (pre-edit snapshot)
- `src/components/support/SupportCheckout.v1.tsx` (pre-edit snapshot)

### Reversibility (4 layers)
- Tag `pre-session-7.7-final-scroll-2026-04-25` at commit `802aeb1`
- Branch `ui-backup-7.7-2026-04-25`
- 4 file snapshots: `globals.v3.css`, `scroll-to-request.v3.ts`, `RequestCTALink.v1.tsx`, `SupportCheckout.v1.tsx`
- 5-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

### Verification done from terminal
- ✅ `npx tsc --noEmit` clean
- ✅ Source: 0 `<Link href={...#request}>` references in src/ (excluding .v backups)
- ✅ Compiled CSS chunk: 0 `scroll-behavior` occurrences
- ✅ /en HTML: "Find your district" pill, "View India" pill, `id="request"` anchor present
- ✅ /en/india-detail HTML: "Request your district" CTA present
- ✅ All 4 backend APIs HTTP 200; all 7 page routes HTTP 200
- ✅ All 4 backups exist on disk

### Pending Jayanth Chrome MCP confirmation
- /en click "📍 Find your district →" → smooth (or instant) scroll, URL `#request`
- /en/india-detail click "Request your district" → cross-page nav + scroll on mount
- Direct URL `/en#request` → loads + scroll
- Mobile 375px: all of above
- Reduce-motion ON: instant jump (no animation)
- DevTools console: `[FTP scroll]` logs showing which layer landed (rAF vs fallback)

### NEW [LOW] in BUG-TRACKER
- Diagnostic `console.log("[FTP scroll]", ...)` logs live in scroll-to-request.ts. Cosmetic — flip `DEBUG_LOG = false` once bug confirmed fixed in the wild.

---

## 2026-04-25 — Session 7.6: rAF smooth-scroll polyfill (corrective) (PRE-PUSH)

**Status:** 106 commits ahead of origin/main. 3 code commits this session (1 backup, 1 css, 1 utility) — pure UI, zero backend.

### Why
Session 7.5's `window.scrollTo({behavior:'smooth'})` ALSO didn't fire in Chrome MCP runtime. Probe found:
- `el.scrollIntoView({behavior:'smooth'})` and `window.scrollTo({behavior:'smooth'})` both silently no-op in Next.js 16 + Turbopack.
- `window.scrollTo(0, N)` (positional, two-arg) — the only working form — was being intercepted by the global CSS `html { scroll-behavior: smooth }` rule from Session 7. The CSS turns positional scrolls into smooth scrolls, which then cancel for the same reason as the API form.
Removing that one CSS rule unlocks the positional API. Session 7.6 removes it AND replaces native smooth-scroll calls with a manual rAF cubic-ease-out tween (~500ms, ~30 frames, calls `window.scrollTo(0, easedY)` per frame).

### What changed
- **`src/app/globals.css`** — REMOVED `html { scroll-behavior: smooth }` block + its paired `@media (prefers-reduced-motion) { html { scroll-behavior: auto } }`. The unrelated `prefers-reduced-motion` block at line 240 (profile-ring animation) is preserved.
- **`src/lib/utils/scroll-to-request.ts`** — added `smoothScrollTo(targetY)` helper using rAF + cubic ease-out + positional `window.scrollTo(0, easedY)`. Honors `prefers-reduced-motion` via `window.matchMedia` (jumps directly). Both `scrollToRequestSection()` and `scrollOnMountIfRequested()` now route through it. Public API surface unchanged.

### What's preserved
- `id="request"` anchor + `scrollMarginTop:80` on DistrictRequestSection (Session 6)
- 80 px header offset, `Math.max(0, ...)` clamp, sessionStorage cross-page handoff, 150 ms post-mount delay, `replaceState` URL update
- `prefers-reduced-motion` honored (now via JS instead of CSS)
- All Session 1-7.5 wins on /en, /en/india-detail, sourcing, INDIA AT A GLANCE, color grades, NEW pill SSR fallback
- Backend: zero changes

### Files touched (2 + 2 backups)
- `src/app/globals.css` (CSS removal)
- `src/lib/utils/scroll-to-request.ts` (rAF polyfill)
- `src/app/globals.v2.css` (pre-edit snapshot)
- `src/lib/utils/scroll-to-request.v2.ts` (pre-edit snapshot)

### Reversibility (4 layers)
- Tag `pre-session-7.6-rAF-smooth-2026-04-25` at commit `ad73628`
- Branch `ui-backup-7.6-2026-04-25`
- 2 file snapshots: `globals.v2.css`, `scroll-to-request.v2.ts`
- 4-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

### Pending verification
Antigravity cannot directly verify browser scroll runtime. Jayanth Chrome MCP test required for:
- /en → click "📍 Find your district →" pill → smooth scroll to district section, URL updates to `#request`
- /en/india-detail → click "Request your district →" → cross-page nav + smooth scroll on mount
- Direct URL `/en#request` → page loads + smooth scroll
- Mobile 375 px: all of above
- Reduce-motion ON → instant jump (no animation), still lands at section

### NEW [LOW] in BUG-TRACKER
- `src/components/support/SupportCheckout.tsx:130` still uses `el.scrollIntoView({behavior:'smooth'})`. Out of scope for /en#request but possibly broken at runtime. Worth a Chrome MCP probe in a future session.

---

## 2026-04-25 — Session 7.5: onClick scroll handlers (corrective) (PRE-PUSH)

**Status:** 101 commits ahead of origin/main. 6 code commits this session — pure UI, zero backend.

### Why
Session 7's CSS + inline `<Script>` approach didn't fire scroll in Chrome MCP runtime. Manual `el.scrollIntoView({behavior:'smooth'})` from console SILENTLY FAILED — some scroll-restoration / re-render canceled the smooth animation. Manual `behavior:'instant'` worked. Replaced approach: direct `window.scrollTo({top, behavior:'smooth'})` with precomputed Y, wired via onClick handlers + sessionStorage flag for cross-page nav.

### What changed
- **NEW** `src/lib/utils/scroll-to-request.ts` — `scrollToRequestSection()` (same-page handles scroll directly; cross-page sets sessionStorage flag) + `scrollOnMountIfRequested()` (mount handler reads flag or `#request` hash, scrolls after 150ms).
- **NEW** `src/components/home/request/RequestScrollMount.tsx` — renders nothing, fires `scrollOnMountIfRequested()` on mount. Mounted at top of `/<locale>/page.tsx`.
- **NEW** `src/components/home/request/RequestCTALink.tsx` — `<Link>` wrapper with onClick. Same `style`/`children` pass-through so it visually matches existing pills/links.
- **`NextDistrictLeaderboard.tsx`** marked `"use client"`, onClick added on 3 row Links + bottom CTA Link. Handler only fires when `seeAllHref` ends with `#request`.
- **`/en/page.tsx`** — both `/en#request` `<Link>`s replaced with `<RequestCTALink>`. `<RequestScrollMount />` mounted at top.
- **REMOVED** Session 7's `<Script id="hash-scroll">` from root `layout.tsx` (dead code per browser test).

### What's preserved
- `id="request"` anchor + `scrollMarginTop:80` on DistrictRequestSection (Session 6)
- `href` attribute on every Link (right-click open in new tab, keyboard tab+Enter, no-JS fallback)
- `html { scroll-behavior: smooth }` + `prefers-reduced-motion` guard in globals.css (still useful for any other anchor links)
- All Session 1-7 wins on /en, /en/india-detail, sourcing language, Coming Soon research cards, INDIA AT A GLANCE, color grades, NEW pill SSR fallback, GitHub footer link
- Backend: zero changes

### Files touched (5)
- `src/lib/utils/scroll-to-request.ts` (NEW)
- `src/components/home/request/RequestScrollMount.tsx` (NEW)
- `src/components/home/request/RequestCTALink.tsx` (NEW)
- `src/components/home/NextDistrictLeaderboard.tsx` (added `'use client'` + onClick)
- `src/app/[locale]/page.tsx` (RequestCTALink × 2 + RequestScrollMount mount)
- `src/app/layout.tsx` (removed dead Script)

### Reversibility (4 layers)
- Tag `pre-session-7.5-onclick-scroll-2026-04-25` at commit `acb0395`
- Branch `ui-backup-7.5-2026-04-25`
- 4 file snapshots: `page.v6.tsx`, `NextDistrictLeaderboard.v2.tsx`, `india-detail/page.v3.tsx`, `layout.v3.tsx`
- 5-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

### Pending verification
Antigravity cannot directly verify browser scroll runtime. Jayanth Chrome MCP test required for:
- /en → click "📍 Find your district →" pill → smooth scroll to district section
- /en/india-detail → click "Request your district →" → cross-page nav + smooth scroll
- Direct URL `/en#request` → page loads + smooth scroll on mount
- Mobile 375px: all of above

---

## 2026-04-25 — Session 7: proper scroll fix + Find Your District pill (PRE-PUSH)

**Status:** 94 commits ahead of origin/main. 5 code commits this session — pure UI, zero backend.

### What changed
- **Reverted Session 6.5's useEffect** in `DistrictRequestSection`. Browser test confirmed it didn't fire scroll behavior despite landing in compiled bundles. Approach moved to global level.
- **`prefers-reduced-motion` guard added** to existing `html { scroll-behavior: smooth }` in `globals.css` — WCAG 2.2 SC 2.3.3 compliance.
- **Inline `<Script id="hash-scroll">` added at root layout** (`src/app/layout.tsx`, before `</body>`). Runs unconditionally at document root, listens for `hashchange` + `MutationObserver` on body children + `load` event. Fires `el.scrollIntoView({behavior:'smooth'})` after `requestAnimationFrame` defer. Wrapped in try/catch.
- **Two pills on /en kicker now**:
  - 🇮🇳 View India in one page → (existing, blue, `/en/india-detail`)
  - 📍 Find your district → (NEW, emerald, `/en#request`)
  - Wrapped in flex+flexWrap so they stack on mobile naturally
  - Matches the kicker's "Your district. Your data. Your right." framing

### Files touched (4)
- `src/app/[locale]/page.tsx` (added pill)
- `src/app/layout.tsx` (added inline Script)
- `src/app/globals.css` (added reduced-motion guard)
- `src/components/home/DistrictRequestSection.tsx` (reverted useEffect; KEPT `id="request"` + `scrollMarginTop:80`)

### What's preserved
- `id="request"` anchor on DistrictRequestSection (Session 6 work)
- All Session 1-6 wins on /en, /en/india-detail, sourcing language, Coming Soon research cards, INDIA AT A GLANCE indicators, color grades, NEW pill SSR fallback, GitHub footer link, kicker eyebrow, bottom inline summaries
- Backend: zero changes

### Reversibility (4 layers)
- Tag `pre-session-7-scroll-and-pill-2026-04-25` at commit `460bcdd`
- Branch `ui-backup-session-7-2026-04-25`
- 4 file snapshots: `page.v5.tsx`, `layout.v2.tsx`, `globals.v1.css`, `DistrictRequestSection.v3.tsx`
- 6-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

### Pending verification
Antigravity cannot directly verify browser scroll runtime. Jayanth Chrome MCP test required for:
- /en/india-detail → click "Request your district" → smooth scroll lands on district section
- /en → click "📍 Find your district →" → smooth scroll lands on district section
- Mobile 375px: pills wrap, both tappable, scroll works

---

## 2026-04-25 — Session 6.5: scroll-to-anchor micro-fix (PRE-PUSH)

**Status:** 88 commits ahead of origin/main. 2 commits this session — single 25-line useEffect, zero backend.

### Bug fixed
Session 6 wired all "Request your district →" CTAs to `/en#request` and added the matching `id="request"` anchor on `DistrictRequestSection`. But Next.js's `<Link>` cross-page navigation resets `scrollY=0` before render, so the fragment never auto-scrolled — users landed on /en at the top and had to manually scroll ~2,300px to find what they were trying to do. That defeated Session 6's link-fix work because the destination was functionally invisible.

### Fix
`useEffect` in `DistrictRequestSection.tsx` that runs on mount AND on `hashchange`. If `window.location.hash === "#request"`, calls `el.scrollIntoView({ behavior: "smooth", block: "start" })` after a 100ms delay (lets React hydration finish). `behavior: "smooth"` respects `prefers-reduced-motion` via the browser default.

### Verified
- TSC clean
- Compiled chunks (server + client) contain the `scrollToRequest` function
- Component still renders with `id="request"` anchor on /en
- 9 cross-page + backend routes return 200 (no regression)
- Manual browser scroll behavior pending Jayanth's Chrome MCP confirmation

### Reversibility (3 layers)
- Tag `pre-session-6.5-scroll-fix-2026-04-25` at commit `a74db72`
- `DistrictRequestSection.v2.tsx` snapshot (post-Session-6 / pre-6.5)
- 4-option rollback addendum in `32-Session3-UI-Rollback-Guide.md`

---

## 2026-04-25 — Session 6: /en/india-detail cleanup (PRE-PUSH)

**Status:** 87 commits ahead of origin/main. 3 code commits this session — pure UI, zero backend.

### What changed
- **/en/india-detail District Health Ranking REMOVED.** All 10 active districts cluster at C/C+ (40-59 score range); a "ranked" presentation implied a meaningful spread that doesn't exist. Per-district grade chips remain visible everywhere else (NEW DISTRICTS cards + /en homepage tiles).
- **/en/india-detail INDIA AT A GLANCE section ADDED** in the same vertical slot. Five cited national indicators with source URL + retrieval date on each card:
  - Real GDP Growth (Q3 FY26) — 7.8% (MoSPI)
  - Unemployment Rate (CWS Jan 2026) — 4.8% (PLFS)
  - RBI Repo Rate — 5.25% (RBI MPC 5 Dec 2025)
  - Mandi Markets Live (AGMARKNET 2.0) — 4,367 (Nov 2025)
  - U-WIN Beneficiaries — 7.43 cr (MoHFW, 25 Nov 2024)
  - CPI row dropped (research file lacks specific cited value — Hard Rule #4 honesty over completeness)
- Italic disclaimer makes static-snapshot status explicit; references the Coming Soon National Economy module as live-tracking destination.
- **Vote leaderboard CTAs rewired** from `/en/features?tab=vote` (dead-end) to `/en#request` (existing district-search/request flow).
  - Single change point in `NextDistrictLeaderboard.tsx` (href prop drives both row links + button).
  - `DistrictRequestSection.tsx` gained `id="request"` + `scrollMarginTop:80` for the anchor target.
  - CTA labels changed "See all requests →" → "Request your district →" (verb-honest).
  - Affected: 3 leaderboard rows + 1 button on india-detail + 1 button on /en bottom strip = 5 sites.

### Files touched (4)
- `src/app/[locale]/india-detail/page.tsx` (Phase 3+4)
- `src/app/[locale]/page.tsx` (Phase 5)
- `src/components/home/NextDistrictLeaderboard.tsx` (Phase 5)
- `src/components/home/DistrictRequestSection.tsx` (Phase 5)

### Backend untouched / Session 4-5 wins preserved
- Sourcing language unchanged (DisclaimerBar, Footer, RefreshIndicator, about, layout)
- Pune NEW pill SSR fallback unchanged
- Color-coded grade chips on NEW DISTRICTS cards + /en active districts unchanged
- Session 5 kicker / CTA pill / Recently launched strip unchanged
- Session 4 Coming Soon research-backed cards on /en/india-detail unchanged
- Session 3 GitHub footer link unchanged
- Email scan: 0 hits for `jayanthmbj@gmail.com` in src/prisma/scripts

### Reversibility (4 layers verified)
- Tag `pre-session-6-india-detail-cleanup-2026-04-25` at commit `be910c1`
- Branch `ui-backup-india-detail-2026-04-25`
- 4 file snapshots: `india-detail/page.v2.tsx`, `[locale]/page.v4.tsx`, `NextDistrictLeaderboard.v1.tsx`, `DistrictRequestSection.v1.tsx`
- Rollback addendum in `32-Session3-UI-Rollback-Guide.md` with 6 options

---

## 2026-04-25 — Session 5: /en restraint pass (PRE-PUSH)

**Status:** 84 commits ahead of origin/main. 3 code commits this session — pure UI, zero backend.

### What changed
- /en restored to pre-Session-4 layout (HomeDrilldown's HomepageStats stat row is the visual lead again; map at ~1% from top of visible text vs Session 4's ~30%).
- Three small additions on /en:
  1. Single-line kicker above stats: "Your district. (gray) Your data. (lighter gray) Your right. (blue)" — 13/15px all-caps, 0.14em tracking.
  2. Pastel-blue CTA pill below kicker: "🇮🇳 View India in one page →" + NewPill (auto-expires 30 days post-launch via module-launches.ts).
  3. Two bottom inline summaries above the suggestion banner: 🆕 Recently launched (Pune · Lucknow · Hyderabad → View India) and 🗳️ Vote next (Ahmedabad 29 · Ernakulam 28 · Thiruvananthapuram 26 → See all). Server-fetched via direct Prisma in page.tsx.
- HomeDrilldown surgical edit: removed Session 4's LIVE PULSE OF INDIA wrapper. Kept Session 4's color-grade chip palette + Pune NEW pill SSR fallback (isNewDistrictBySlug + DISTRICT_LAUNCH_SSR_FALLBACK).

### What's preserved from Session 4 (non-/en wins)
- Sourcing language ("accredited research institutions") in DisclaimerBar/Footer/RefreshIndicator/about/root layout
- Pune NEW pill on /en district tiles (SSR works)
- Color-coded grade chips
- /en/india-detail entirely untouched (8 sections including Coming Soon research-backed cards)
- GitHub footer link (Session 3)

### Components on disk but not currently used by /en
- HeroIndia, AnimatedCounter, NewDistrictsBand, VoteNextDistrictBand — all 4 stay reusable. NewDistrictsBand + VoteNextDistrictBand are still mounted on /en/india-detail.

### Reversibility (5 layers)
- Tag `pre-session-5-restraint-2026-04-25` at commit `f3684f6`
- Branch `ui-backup-restraint-2026-04-25`
- `page.v3.tsx` + `HomeDrilldown.v2.tsx` (post-Session-4 snapshots)
- All earlier session backups intact
- Rollback addendum in `32-Session3-UI-Rollback-Guide.md` with 6 options (least invasive: remove bottom strips only; nuclear: reset to pre-session-3 tag)

### Email scan
0 hits for `jayanthmbj@gmail.com` in src/prisma/scripts.

---

## 2026-04-25 — Session 4: /en hero refresh + restructure + sourcing language (PRE-PUSH)

**Status:** 77 commits ahead of origin/main. 10 code/data commits this session — UI + research file, zero backend.

### Reversibility (4 layers verified)
- Tag `pre-session-4-en-refresh-2026-04-25` at commit `d78b9a4` (Session 3 end)
- Branch `ui-backup-en-refresh-2026-04-25`
- `.v` backups for every touched file (`page.v2.tsx`, `Footer.v3.tsx`, `HomeDrilldown.v1.tsx`, `DisclaimerBar.v1.tsx`, `RefreshIndicator.v1.tsx`, `about/page.v1.tsx`, `layout.v1.tsx`, `india-detail/page.v1.tsx`)
- Rollback addendum in `32-Session3-UI-Rollback-Guide.md` with 4 options

### /en restructure
- New section order: Ticker → **HeroIndia** → **NewDistrictsBand** → HomeDrilldown (with **LIVE PULSE OF INDIA** header above LiveDataPreview, HomepageStats suppressed via `heroShown`) → **VoteNextDistrictBand** → TopTierShowcase (DEMOTED from position 3 → position 6) → suggest banner → contributor wall.
- New components: `HeroIndia.tsx`, `AnimatedCounter.tsx`, `NewDistrictsBand.tsx`, `VoteNextDistrictBand.tsx`.
- HomeDrilldown gains `heroShown` prop + LIVE PULSE OF INDIA section header.

### Pune NEW pill regression — root cause + fix
- Session 3 fix to `isNewDistrict` was correct math; SSR `preview?.goLiveDate` was undefined because React Query hadn't fired.
- Fix: `DISTRICT_LAUNCH_SSR_FALLBACK` static map keyed by slug; new `isNewDistrictBySlug` helper. NEW pill count in `/en` SSR HTML jumped from 1 to 4.

### Sourcing language site-wide
- Old: "publicly available government portals under India's Open Data Policy"
- New: "official government portals (NDSAP), accredited research institutions, and verified public sources"
- Updated in DisclaimerBar (yellow strip), Footer (row 1 + meta description), RefreshIndicator (small grey footer line), About page (Methodology paragraph), root `layout.tsx` (Twitter card description). Disclaimer/Privacy/Terms pages NOT touched.

### Health-grade chip colors
- `gradeColor()` updated to Tailwind 50/700/200 family in both HomeDrilldown and india-detail. Border added to chip render. Same emerald/blue/amber/rose family used by Coming Soon cards.

### `/en/india-detail` Coming Soon cards
- Replaced vague blurbs with specific MVP data points + first-party source names from `research/india-modules-coming-soon-sources-2026-04-25.md` (444 lines, 160 verified URLs).
- ComingSoonCard component extended with optional `sources` slot (mono font, dashed divider). Cards retain dashed border + 0.78 opacity.

### Backend untouched policy
- Zero Prisma schema changes. Zero API route edits. Zero seed scripts. All edits in `.tsx` files + 1 research markdown.
- Email scan: 0 hits for `jayanthmbj@gmail.com` in src/prisma/scripts.

---

## 2026-04-25 — Session 3: India aggregate page + mobile/visual fixes (PRE-PUSH)

**Status:** 66 commits ahead of origin/main. 10 code commits this session — all UI, zero backend.

### Reversibility (3 layers)
- Git tag `pre-session-3-ui-2026-04-25` at commit `b658eef` (Session 2 end)
- Backup branch `ui-backup-2026-04-25`
- `.v1.tsx` backups committed BEFORE each edit: `Footer.v1.tsx`, `CompactContributorWall.v1.tsx`, `TopTierShowcase.v1.tsx`, `[locale]/page.v1.tsx`
- Rollback guide: Obsidian `32-Session3-UI-Rollback-Guide.md`

### Fixes
- **Pune NEW badge** on `/en` now renders. Root cause: `isNewDistrict` gated on `ms >= 0` → failed on launch-morning UTC skew. Fix: `FUTURE_GRACE_MS = 24h`.
- **GitHub link** visible in Footer (text + icon, no `hidden sm:inline` guard) so innerText contains "GitHub" at any viewport.
- **Carousels slowed** 2× + touch-pause: `CompactContributorWall` 20s→40s; `TopTierShowcase` 60s/30s→120s both.

### New surfaces
- `src/lib/config/module-launches.ts` — single source of truth for launch dates. NEW pill auto-expires 30 days later.
- `src/components/ui/NewPill.tsx` — subtle pastel green pill, no animation.
- `src/components/home/NextDistrictLeaderboard.tsx` — reads `DistrictRequest` top-3.
- `/[locale]/india-detail` — 8-section aggregate India page (hero, new districts, next district leaderboard, latest news, health ranking, 4× Coming Soon, Royal CTA).
- `/en` gains ONE new link ("View India in one page →" + NewPill) above the Suggest banner. All other /en content unchanged.

### Backend policy compliance
- Zero Prisma schema edits
- Zero API route edits
- Zero seed scripts
- Paid-supporter + failed-payment policies: no Supporter rows touched
- Email hardcode scan: 0 hits for `jayanthmbj@gmail.com` in src/prisma/scripts

---

## 2026-04-25 — Session 2: Pune responsibility module + grade/NEW tile fix (PRE-PUSH)

**Status:** 55 commits ahead of origin/main. 7 code commits + 1 research-data commit this session.

### Schema
- New model **ResponsibilityItem** (districtId, section, action, whyRelevant, reportTo*, phoneVerified, sourceNotes, ordering, active). District gained `responsibilityItems` reverse relation. Pushed via `db push`.

### Data seeded (Neon prod)
- ResponsibilityItem: **50** for Pune across 8 sections. 3 phones flagged unverified (admin review pending).
- DistrictHealthScore: new row for Pune (C, 48.91) — computed via existing `calculateDistrictHealthScore()`.

### API + UI
- `GET /api/data/responsibility` — district-specific when available, `{ fallback: "generic" }` otherwise.
- `/responsibility` page renders 8 section cards with phone/URL links + Source expanders for Pune; other districts continue to render generic content (no regression).
- `/admin/responsibility` — district picker + unverified-phone filter + bulk verify + per-row edit/hide/delete. Sidebar entry added under Community group.

### Fix: Pune grade + NEW badge on /en/india
- DistrictHealthScore was null for Pune because cron hadn't swept the just-launched district. Computed via one-shot script using the existing health-score function. Tile now shows `C` grade + NEW badge like Hyderabad/Lucknow.

### Row counts (end of session)
- Supporter: 70 (unchanged — no writes)
- NewsItem: 461 (unchanged)
- ResponsibilityItem: 50 (Pune only)
- DistrictHealthScore: 10 (all active districts)

---

## 2026-04-25 — Session 1 pre-push fix pass (PRE-PUSH, local only)

**Status:** 47 commits ahead of origin/main. Dev server on :3000, all schema migrations pushed via `prisma db push`.

### Policies formalized this session
- **Paid-supporter:** never delete paid records. SHORTEN names, CLEAR spam messages. Originals preserved.
- **Failed-payment:** orphan rows deleted. No successful payment → no DB row.
- **Motion-safe:** animations honor `prefers-reduced-motion`.

### Schema additions (all pushed via db push)
- `District.goLiveDate DateTime?` — drives NEW badge 45-day window
- `Supporter.messageFlagged Boolean + originalMessage String?`
- `NewsItem.publisher String? + duplicateOf String? + originalSummary String?` + index on duplicateOf

### Data cleanups (Neon prod, all idempotent)
- InfraProject: 3 cross-state Mumbai-Pune Expressway duplicates deleted; 2 anchors changed scope NATIONAL → STATE
- LocalAlert: 1 irrelevant Pune alert deleted (Karnataka Express)
- Supporter: 4 spam messages cleared + 3 business names shortened (e.g. "SML Finance" → "SML F.") — paid records intact
- NewsItem: 453/461 items cleaned of title-dupe summaries + 453 publishers extracted + 2 near-duplicates marked
- Supporter orphan sweep: 0 found (audit clean)

### Row counts (active districts: 10)
- Supporter: 70 (unchanged — no paid record deleted this session)
- NewsItem: 461 (canonical; 2 marked as duplicates)
- InfraProject (state-scope MH): 11 (10 from prior session + 2 Mumbai-Pune now STATE; 1 net change from 3 NATIONAL dupes deleted)
- District.goLiveDate: populated on all 10 active districts

### Webhook hardening
`razorpay-webhook/route.ts` `payment.failed` branch no longer creates Supporter rows — instead deletes any non-success row matching paymentId. Keeps paid-supporter policy watertight.

### Manual action pending
Razorpay ₹999 monthly plan creation (Jayanth, dashboard + paste into `src/lib/razorpay/plans.ts`).

---

## 2026-04-24 (late evening) — 3-Part Fix: Name Validation + State Price + Suggestions (PRE-PUSH)

**Status:** Local-only; 34 commits ahead of origin/main. Awaiting Jayanth's review + Razorpay manual step before push conversation.

### Part A — Supporter name validation
- Shared validator at `src/lib/validators/contributor-name.ts` (Unicode letters + spam-pattern rejection).
- Applied server-side on `create-order`, `create-subscription`, `manual-supporter`, `api/suggestions`. Client-side inline errors on `SupportCheckout`, `ManualSupporterForm`, `SuggestionForm`.
- Schema: `Supporter.nameFlagged` + `Supporter.originalName` + index. Pushed via `prisma db push`.
- Cleanup ran: 70 rows → 58 clean + 12 flagged (11 salvaged, 1 anon; + 8 email-as-name subsequently re-anonymized).
- Admin review tab at `/admin/contributors-flagged` (Edit / Approve / Restore / Delete per row).

### Part B — State Champion ₹1,999 → ₹999
- `TIER_CONFIG.state.amount` + `minAmount` dropped to 999; `district.maxAmount` dropped to 998 for clean band boundaries; `state.maxAmount` unchanged (9998).
- Daily framing: "₹67/day auto ride" → "₹33/day cup of coffee".
- Copy swapped on 8 surfaces (see Obsidian note 29 for full list).
- `VISIBILITY_THRESHOLD.state` lowered 1999 → 999 so sponsor-wall inclusion tracks the new price.
- New `src/lib/razorpay/plans.ts` documents grandfathering + placeholder for Jayanth's manual Razorpay dashboard step (creating the new ₹999 monthly plan).
- Existing ₹1,999 subscribers grandfathered (they stay on the old dynamic plan ID; zero recurring-charge touches).

### Part C — Community Suggestions
- New Prisma model `Suggestion` + `SuggestionStatus` enum (PENDING / REVIEWED / ACCEPTED / REJECTED / SPAM / IMPLEMENTED). Pushed via `db push`.
- Public `POST /api/suggestions` — validated, 3/hr IP rate limit, non-blocking Resend to `forthepeople1547@gmail.com`.
- Public `GET /api/suggestions` — ACCEPTED + IMPLEMENTED only.
- Admin CRUD at `/api/admin/suggestions` + `/api/admin/suggestions/[id]` with audit-log.
- `/features` refactored into two tabs: Vote on Features (existing) + Share Your Idea (new).
- Site-wide CTAs: floating 💬 FAB (locale layout), home banner, district sidebar footer, footer "Share an Idea" link.
- Admin review at `/admin/suggestions` with status filter + inline notes + bulk SPAM+delete.

### Verification
- `tsc --noEmit`: clean.
- Hardcoded `jayanthmbj@gmail.com` in `src/ prisma/ scripts/`: 0 hits.
- Dev server restarted to pick up regenerated Prisma client.
- Smoke tests: GET empty array, POST valid 200 ok, POST spam-name 400 with reason.

### Manual action pending
Jayanth to create ₹999 monthly plan in Razorpay dashboard and paste plan_id into `src/lib/razorpay/plans.ts` (replacing `REPLACE_WITH_NEW_999_PLAN_ID`).

---

## 2026-04-24 — Pune full-audit fix + Maharashtra state infrastructure (take 3, PRE-PUSH)

**Status:** Third autonomous pre-push pass. 7 new seeds executed against Neon production. No push yet — awaiting Jayanth review.

### Record deltas this pass (added to counts below)
- **BudgetAllocation (FY 2025-26):** 3 rows updated — PMC ₹9,842 cr released / ₹8,201 cr spent; PCMC ₹7,546 cr / ₹6,288 cr; ZP ₹227.76 cr / ₹189.8 cr. Remarks suffix flags 78%/65% estimate pending CAG audit. Idempotent.
- **BusRoute:** +8 (PMPML 4/158/57/105/200/AC-1; MSRTC Shivneri + Ashwamedh)
- **TrainSchedule:** +6 (Deccan Queen 12123/24, Pragati 12125, Intercity 12127, Indrayani 22105, Secunderabad Shatabdi 12025)
- **LocalIndustry:** +8 (Hinjawadi RGIP, Chakan MIDC, PCMC Auto Belt, Bhosari, Ranjangaon, Talegaon, Kharadi-Magarpatta, Defence & Aerospace)
- **RtiTemplate:** +5 (PMC roads, PCMC property tax, Pune Metro, Collectorate 7/12, ZP schools)
- **School (PRIVATE):** +4 (Symbiosis University, SIBM Pune, MIT-WPU, FLAME University) — enables PRIVATE-type color coding
- **InfraProject (STATE-scope):** +10 MH state-level: Samruddhi Expressway, NMIA, Vadhavan Port, Shaktipeeth Expressway, Versova-Bandra Sea Link, Mumbai Metro Line 3, Thane Creek Bridge III, Nagpur Metro Phase 2, Jalyukt Shivar 2.0, WDFC Maharashtra. Anchored to Pune districtId with scope="STATE".

### Phases skipped (with reasons)
- **DamReading (Phase 4):** live-data snapshot model — needs real scraper values, not one-time seed
- **Hospital (Phase 5):** schema model doesn't exist fleet-wide — tracked in BUG-TRACKER
- **PowerOutage (Phase 7):** fabrication risk — outage history should come from utility feeds
- **Elections API fix (Phase 8), Exams dedup (Phase 9), Weather scraper (Phase 11):** code/API changes deferred — not in-scope for pre-push data fix
- **AirQualityStation (Phase 12):** schema model doesn't exist
- **HousingScheme PMAY-U delete (Phase 14):** reconsidered — row is NOT a stub. Has real 4,725 target + source caption explaining FY 2026-27 just started (April 2026). Deleting would leave /housing empty. Keeping.

### Pre-push commit state (pending)
New seed files uncommitted:
- `prisma/seed-pune-transport.ts`
- `prisma/seed-pune-local-industry.ts`
- `prisma/seed-pune-rti.ts`
- `prisma/seed-pune-schools-private.ts`
- `prisma/seed-maharashtra-state-infra.ts`
- `scripts/fix-pune-finance-utilization-2026-04-24.ts`

---

## 2026-04-23 — Pune #10 LAUNCH (local complete, PRE-PUSH)

**Status:** All 6 prompts complete locally (Phases A-F of Prompt 6 done). Awaiting commits (G), pre-push verification (H), and explicit go-ahead for push (I), then 24-48h monitoring (J).

### Record counts in Neon production (Phase C + 2026-04-24 fix passes)
- Leader: **41** (17 governance + 24 elected reps; Baramati seat seeded VACANT pending ECI)
- BudgetAllocation: **5** (rich per-body data — PMC 25-26 + PMC 26-27 + PCMC 25-26 + PCMC 26-27 core + ZP 25-26)
- BudgetEntry: **5** (sector aggregates for `/finance` UI compat — derived from BudgetAllocation; sums match to the rupee)
- InfraProject: **13**
- School: **8** (3 aggregates + 5 notables; descriptions rewritten 2026-04-24)
- Scheme: **10** (was 6 — added 4 Maharashtra state schemes 2026-04-24: Ladki Bahin, MJPJAY, Maharashtra Gharkul, Ramai Awas; eligibility format cleaned)
- HousingScheme: **1** (PMAY-U FY 2026-27 — 2026-04-24; PMAY-G deferred)
- PopulationHistory: **4** (Census 1991/2001/2011 + 2021 estimate — added 2026-04-24)
- FamousPersonality: **6** (Tilak, Gokhale, J Phule, S Phule, Karve, Savarkar — added 2026-04-24)
- GovOffice: **8** (Collectorate, PMC, PCMC, ZP, 2 Police, RTO, IT — added 2026-04-24)
- ServiceGuide: **5** (birth/death, property tax, DL, ration, water — added 2026-04-24)
- Tagline badges (districts.ts): **4** (Education Hub, Detroit, IT Corridor, Cultural Capital — added 2026-04-24)
- Taluk: **14** (Prompt 1)
- CourtStat: **0** (deferred — schema requires non-nullable Int stats; awaiting live NJDG API)
- Hospital: **0** (schema model missing across the fleet)

### Commits ahead of origin/main
**18 total** = 1 Prompt 1 + 9 Phase G + 2 morning UX fix (schemes/housing) + 6 afternoon module-population fix (badges/pop/famous/offices/services/schools).

### Phase status
A pre-flight ✓ | B GeoJSON ✓ | C seeds executed ✓ | D admin+budget UI ✓ | E smoke test ✓ | F docs ✓ | G commits ✓ | + 2026-04-24 morning UX fix ✓ | + 2026-04-24 afternoon module population ✓ | H pre-push ✓ | I push ⏳ | J monitor ⏳

### Known gaps at launch (all documented in BUG-TRACKER)
- **Hospital module:** generic `/health` template only; Hospital schema model missing fleet-wide
- **Baramati MLA:** VACANT row seeded but API's `active=true` filter silently hides it from UI — ship-as-is, patch post-ECI certification
- **14 Pune taluk polygons** pending authoritative fetch (DataMeet / geohacker / OSM)
- **BudgetAllocation / BudgetEntry** parallel models — reconciliation deferred
- **Mumbai DB ≠ Mumbai seed file** (surfaced during Pune launch) — dedicated reconciliation prompt needed
- **Cross-district convention drift** (party names, role strings, scheme level casing) — low-priority backlog

### Live event
Baramati Assembly by-election April 23, 2026. ECI certification pending (~24-72h window). Sunetra Pawar principal candidate (NCP-SP did not field; Congress withdrew Aakash More). Post-launch patch will update VACANT row to certified winner.

---

## Tooling added 2026-04-20

- **CodeRabbit**: Installed on jayanthmb14/forthepeople repo only (not all repos). Pro tier auto-enabled (free for public repos regardless of license). Permissions: read + write on single repo for PR review comments. Action: next PR opened on main will trigger automated review comments within ~2 min of push.

---

## 2026-04-20: Database migration + Tenders module launch

### Database migration (completed)
- **NEW Neon**: ep-bitter-sea-a1n9ttad (PG 17, Launch $19/mo, AWS ap-southeast-1 Singapore, forthepeople1547@gmail.com)
- **Migrated from**: OLD Neon ep-broad-wildflower-a14s55kg on old Gmail
- **Method**: GitHub Codespace + pg_dump/pg_restore with PG 17 client tools
- **Row counts verified**: District=152, InfraProject=397, NewsItem=446, Supporter=61 (exact OLD↔NEW match)

### Upstash migration (completed)
- **NEW**: allowing-kid-70988.upstash.io (Mumbai, Pay-as-you-go, forthepeople1547@gmail.com)
- **OLD**: skilled-marten-75302.upstash.io — kept for 7-day rollback safety, decommission 2026-04-27

### Vercel
- Project still on zurvoapps-projects team (old Gmail) — migration deferred
- Env vars updated on all 3 environments — pointing to NEW Neon + NEW Upstash

### Sentry
- Fully configured: client/server/edge configs + DSN + AUTH_TOKEN on .env + Vercel
- Organization: forthepeople.in, single project: javascript-nextjs

### Tenders module (Module 30 — launched 2026-04-20)
- **Scope**: Karnataka pilot — Bengaluru, Mandya, Mysuru
- **14 Prisma models**: Tender, TenderAuthority, TenderCorrigendum, TenderAward, TenderBidder, TenderContract, TenderDocument, TenderCategory, TenderRedFlag, TenderAISummary, TenderSavedByUser, TenderScraperConfig, TenderScraperRun, TenderEducationContent
- **Data sources**: KPPP, CPPP, defproc, eprocurebel, IREPS, HAL eProc (GeM deferred due to Cloudflare Turnstile + IT Act §43 risk)
- **Red flag detection**: SQL-deterministic (never LLM) — single bidder, <21-day window, price hit rate >98%, repeat winner, re-tendered, restrictive turnover, direct nomination
- **Lint**: scripts/lint-tender-copy.sh blocks inflammatory language
- **Disclaimers**: TenderDisclaimer component on every page

### Banner
- Built but DISABLED via static fallback (enabled: false) — migration complete, no user-facing announcement needed
- Admin-controlled banner module TO BUILD — planned as new admin tab, modal-first-visit pattern, user clicks OK → site opens
- Current code can be re-used when admin module is built

### Deferred to future work
- **Neon password rotation**: Low risk (only in private chat logs), do on weekend
- **Vercel ownership migration**: ~2026-04-27, 20-min task
- **OLD Neon + OLD Upstash decommission**: 2026-04-27 (7-day rollback safety net)
- **SiteAnnouncement + missing Tender tables on NEW Neon**: Need `prisma db push` from Codespace
- **Admin banner module build**: New module under admin panel, replaces the disabled static banner

---

## 2026-04-20: Tenders module fixes (post-audit)

Phase 1 audit identified 12 issues. Fixed 10 in this session, deferred 2.

### Fixed

1. **All invented email addresses replaced** with contextual `mailto:support@forthepeople.in?subject=...` links. 6 `takedown@` references removed (1 scraper UA string, 1 component, 4 doc-file mentions). Scraper User-Agent now uses `https://forthepeople.in/contact` instead (bots can't click mailto).
2. **Sidebar reorganised by civic priority**: 7 tiers (Civic Duty → Maps & Data), numeric `priority` field replaces dead `group` enum. All 3 nav components (Sidebar, MobileSidebar, MobileTabNav) now derive categories from a single `getTieredModules()` helper — no more hardcoded slug arrays.
3. **Tenders visible on all districts with DB-driven lock state**: `District.tendersActive Boolean @default(false)`. Non-activated districts see a lock + sponsor-CTA card instead of the misleading empty-dashboard. Sidebar entry stays universal for discoverability.
4. **Per-state disclaimer route** at `/tenders/disclaimer`: reuses `TenderEducationContent` with new `docType` + `stateSlug` columns. 7 universal clauses (GFR 2017, GODL-India, RTI §4, DPDP 2023, Advocates Act §33, takedown, licence) + 2 Karnataka-specific (KTPPA 1999, portal list). Fixes the previously-broken `<Link href="/tenders/disclaimer">`.
5. **Tenders overview snippet** on every district home: matches LeadersSnippet/InfraSnippet pattern, status badge cycles LIVE/STALE/LOCKED/NO_DATA, shows live count, closing-48h callout, next-deadline strip, and time-ago.
6. **Deadline urgency indicator** on tender cards + detail hero: green border >7d, yellow 2–7d, red pulsing <48h, grey/dimmed past. Client-side from `bidSubmissionEnd`.
7. **Structured plain-English bullets** on detail page: `TenderAISummary.plainBullets Json?` with `{ what, whoCanApply, deadline }`. New 4th prompt in enrichment cron at grade-6 reading level, max 25 words/bullet. "Summary being prepared" fallback when absent.
8. **Save & Alert** on detail page now opens a mailto pre-filled with tender context (title, source URL, ID). Replaces the fake `alert()`. TODO flagged for real DPDP-compliant email collection in v2.
9. **Apply Guide / Transparency / How It Works** buttons verified live on prod — no dead buttons. Also fixed `/api/tenders/how-it-works` to filter by `docType='explainer'` so disclaimer rows don't leak into the explainer page.
10. **Activation runbook** at `docs/TENDERS-ACTIVATION.md` — SQL flip + seed pattern + state-specific gotchas.

### Deferred (not blocking Phase 2 push)

- **Scraper cron registration** (Issue #11): KPPP portal CAPTCHA / rate-limit blocker remains. Not wiring to `vercel.json` crons until the engine is proven stable from a Railway / domestic-IP environment.
- **"Crime Statistics" module** from Phase 1 Tier 4 list: module doesn't exist in codebase, silently dropped. Split `police` module remains single.

### Schema changes (additive, no data loss)

Land on Vercel's next deploy via `vercel.json` build command (`npx prisma db push`):

- `District.tendersActive Boolean @default(false)` — issue #3
- `TenderEducationContent.docType String @default("explainer")` — issue #4
- `TenderEducationContent.stateSlug String?` — issue #4
- `TenderAISummary.plainBullets Json?` — issue #7

### New files

- `src/components/district/TenderSnippet.tsx`
- `src/components/tenders/TenderLockedState.tsx`
- `src/app/api/tenders/[district]/access/route.ts`
- `src/app/api/tenders/[state]/disclaimer/route.ts`
- `src/app/api/tenders/live-districts/route.ts`
- `src/app/[locale]/[state]/[district]/tenders/disclaimer/page.tsx`
- `prisma/seed-tender-legal.ts`
- `scripts/activate-tenders-districts.ts`
- `docs/TENDERS-ACTIVATION.md`

### Enabled districts for tenders (after activation script runs)

`bengaluru-urban`, `mandya`, `mysuru` (all other districts render lock state).

### Post-push manual actions required

1. Wait for Vercel build to complete (adds the 4 schema columns via `prisma db push`).
2. Run `npx tsx scripts/activate-tenders-districts.ts` against production DB → flips `tendersActive=true` for the 3 KA pilot districts.
3. Run `npx tsx prisma/seed-tender-legal.ts` against production DB → seeds 9 disclaimer clauses.
4. (Optional) Run enrichment cron to populate `plainBullets` on the 12 stub tenders.

