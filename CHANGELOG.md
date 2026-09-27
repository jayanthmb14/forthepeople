# Changelog

All notable changes to ForThePeople.in are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). One dated entry per push to `main`.
This file replaces the scattered "current state" blocks in `CLAUDE.md`, `docs/LIVE-STATE.md` and the vault.

## [Unreleased] — 2026-09-27 audit fixes

Branch `audit-fixes-2026-09`, five parallel work-streams merged from one end-to-end audit of the
production site (prod = `38df958`, deployed 2026-06-11). Nothing here is deployed until it is
reviewed and pushed; see "Manual actions" at the bottom of this entry.

### Fixed — data, crons and AI
- Cron endpoints now accept the `Authorization: Bearer <CRON_SECRET>` header the way Vercel actually
  sends it (two crons had never run from the scheduler because of the wrong header / HTTP method).
- AI model chain replaced: every free OpenRouter model in the old list had been withdrawn upstream, so
  every AI call had failed since late August. New chain: free Tier-1 (`gemma-4` class) for news
  classification, a low-cost flash-lite model for insights, paid fallback only when `AI_PAID_FALLBACK=1`.
- Per-call timeouts on every external fetch in the collection jobs (the crops job used to time out
  the whole function).
- New scheduled jobs for weather and dam levels (previously only runnable from the retired Railway
  worker, so the homepage showed April temperatures under a "Live" badge).
- `/api/health` now reports `degraded` when any cron's last run is older than twice its schedule,
  instead of always saying healthy.

### Fixed — security
- 2FA (TOTP) step is bound to a signed, short-lived challenge cookie and rate-limited; it can no
  longer be reached without the password step.
- Admin API responses send `Cache-Control: no-store`; the blanket `/api/(.*)` CDN cache rule no
  longer applies to admin JSON.
- Rate limits on login, TOTP and the header-auth ops path.
- Supporter records anonymised at the API boundary (no emails / phones in public payloads).

### Fixed — honesty, routing, SEO
- Freshness pill reads the real "last updated" timestamps; the hard-coded green "Live" badge is gone.
- Platform facts (district count, module count, data-point count) come from one source and are no
  longer hand-typed in layouts, About and JSON-LD.
- Homepage "Live data right now" cards read the correct API shape.
- Service worker no longer precaches a redirecting URL; offline page works.

### Fixed — build
- Fonts are self-hosted (`src/fonts/*.woff2`, `src/lib/fonts.ts`, `next/font/local`). Vercel's
  build container could no longer fetch Google Fonts, so every build of `main` failed from
  2026-09-26. All eight families are SIL OFL 1.1. No visitor IPs are sent to Google any more.

### Changed — Design v3 "Civic Ledger" (every citizen-facing page)
- One design system for the whole site: `--ftp-*` tokens on `:root`, one 1200 px / 12-column
  container, a five-step type scale (Plus Jakarta Sans 400/500, 600 only for a page H1), numbers in
  JetBrains Mono, one card / tile / pill spec, no shadows or gradients, Lucide icons instead of emoji.
  Reference: `docs/DESIGN-SYSTEM.md`.
- Shared kit rewritten in place (`src/components/district/ui.tsx`): PageHeader, FreshnessPill,
  SourcePill, StatTile/StatStrip, Section, Card, Pill, Chips, SourcesFooter, Toolbar, KpiRing,
  EmptyState. Old export names still work as thin wrappers.
- Homepage rebuilt: one-line disclaimer band, 56 px header, market ticker with "As of" time,
  **"Find my district"** strip (one tap finds the visitor's district from the browser's location;
  if it is live it opens it, if not it says so, shows the vote count and the nearest live district;
  optional "Remember my district" switch; coordinates never leave the browser), hero, four stat
  tiles, map + live-districts list, latest data (only modules with data under 30 days old),
  how it works, supporters and top votes, support line, honest footer.
- District overview rebuilt: identity card (local-script name, tagline chips, health-score ring,
  Census stats with source), "Today in <district>" tiles that show an honest empty line instead of
  stale numbers, all modules grouped into five cards with freshness dots. Locked-district preview
  and state pages use the same identity card.
- Left rail regrouped into five groups (Civic duty, Money & resources, Daily services,
  Accountability, Community & people) with freshness dots.
- All module pages (crops to tenders) moved onto the module template: header with local-script
  title, freshness and source pills, stat strip, sections, empty states, sources footer, share and
  compare toolbar. The 1,180-line infrastructure page was split into components.
- India pages aligned to the same chrome; support, about, features, vote, compare, feedback and
  legal pages restyled with every flow (Razorpay checkout, votes, feedback) unchanged.
- Honest cadence copy: water now says "checked every 6 hours"; the leadership page has its own
  sources entry.
- Old homepage components (`src/components/home/redesign-v2/*`) deleted.

- Finishing pass: kit gains PrimaryButton, 44 px buttons on phones, "As of Census 2011"-style period
  labels and a freshness threshold on PageHeader; the disclaimer is one line (phones: one truncated
  line + "More"); district contributors, elections, the idea form, the feedback button, error and
  offline screens restyled; dead CSS and unused emoji/colour data removed.
- Offices "Open now" now uses Indian Standard Time and the same hours the page shows (it used the
  visitor's own clock and different hours). Each office card shows Open / Lunch break / Closed.
- Tenders copy no longer promises refresh intervals that no scheduled job delivers.
- Infrastructure analysis card no longer hard-codes an AI model name.
- India live strip counts come from the module and source registries (no placeholder numbers).
- The compare page honours `?module=` from every module page's Compare button.
- All-India Patron copy computes "N districts. M dashboards." (was a stale 22,620).
- Phones: tapping a district or state in the breadcrumb bottom sheet navigates again (the sheet was
  closing on touch-down before the link could fire).
- Homepage map re-centred so all of India, including the south and the islands, is visible.
- `scripts/fix-district-local-names.ts`: dry-run fixer for districts whose local-script name is
  just the English name (Pune → पुणे). Run with `--confirm` against prod, then bust caches.
- 2026-09-27 review pass (local production build, every page captured at 1440 px and 390 px):
  - District card, state page: population now comes from the sourced Census 2011 rows in the
    database. The registry mixed census counts with later estimates but was labelled "Census
    2011"; figures without a census row now say "Latest available estimate".
  - Homepage "Latest data": schemes and budget are yearly reference data, so they skip the
    30-day freshness gate and carry their period ("Updated Mar 2026", "For FY 2025-26"). The
    grid sizes itself to the number of cards; rupee figures are digit-grouped.
  - Local names that just repeat the English name are hidden; Pune shows पुणे from the registry.
  - Tagline chips: a badge that repeats the tagline is dropped. Source pills use the text face.
  - Finance: the sector chart labels every sector, sizes to its data and has a legend; headline
    figures are digit-grouped.
  - Weather: repeated 5-minute readings collapse into one row; every row shows date and time.
  - State map: the SVG fits a fixed-height frame, so the whole state (and its live districts) is
    visible instead of being cropped at 400 px.
  - India page: the phone carousel dots were stuck at opacity 0; now visible.
  - AI analysis older than 45 days is folded behind "An AI analysis from <date> is available. It
    may not match the figures on this page." Credit line reads "Written by", not "Source-verified by".
  - Support: one supporter count everywhere (the banner used a different total); five tiers laid
    out 5 / 3+2 / 2 / 1 with no lone card; the amount box fits five digits.
  - Copy: "next Census is expected in 2031" → Census 2027 is under way; the demographics
    disclaimer no longer names the company.

### Changed — Design v4 "Rang", languages and location (branch `redesign-v4`)
- 2026-09-27: English is always the default language. Browser-language detection and the locale
  cookie are off, so `/` and unprefixed links always open in English.
- 2026-09-27: "Find my district" checks district boundaries first and falls back to the nearest
  centre. A "Your district" card then pops up.
  - Live districts show their landmark, tagline, weather and grade, with a link to their dashboards.
  - Districts that aren't live yet show the vote count and the nearest live district.
- 2026-09-27: The language menu lists all 22 Indian languages. The ones not yet available are shown
  locked with their native names.
- 2026-09-27: The India map shows live districts as landmark badges in each district's colour, and
  nearby pins fan out with leader lines. The district overview has a "Where is {district}?" locator map.

### Removed — dead code
- Unreachable v1 India components, legacy Header/Footer, unused redesign-v2 components, tracked
  `.v1/.v2/.v3` snapshot files and the permanently redirected `india-detail` page.

### Changed — lint, CI, dependencies, funding files, docs, tests (this work-stream)
- **ESLint is green (0 errors).** Real fixes: 13 unescaped JSX entities, the two `<a href="/en/admin">`
  back-links (now `next/link`), `prefer-const` in the Karnataka tenders seed, and the only genuine
  hooks violation (`SupportCheckout` read the React Query client inside `try/catch`; it now reads
  `QueryClientContext` directly, which is null-safe outside a provider). The five React-Compiler
  rules from `eslint-plugin-react-hooks` v7 are downgraded to `warn` in `eslint.config.mjs` and
  marked as legacy debt to burn down.
- **Toolchain:** Node 24 everywhere — `.nvmrc`, `package.json` `engines`, CI uses
  `node-version-file`. CI gains a third job, **Unit tests** (`npm test`). Lint stays a required job.
- **Dependencies:** `next` ^16.3.4 (clears the 16.2.x security advisories; resolves 16.3.6),
  `sharp` 0.35.4 via Next's optional dependency, `eslint-config-next` aligned to the same range,
  `@types/node` 24. Removed direct dependencies with zero imports: `@google/generative-ai`, `d3`,
  `@types/d3`, `topojson-client`, `@types/topojson-client`, `zustand`, `@types/bcryptjs` (bcryptjs
  ships its own types). Added `vitest` + `vite` (dev). `npm audit fix` was NOT run.
- **Licence:** `LICENSE` is now the verbatim MIT text (GitHub previously reported `NOASSERTION`
  because of three extra binding clauses). Those wishes moved to a non-binding "Attribution"
  section in README. `humans.txt` and `package.json` say `MIT`.
- **Funding files:** `public/funding.json` (FLOSS/fund manifest v1.1.0: individual maintainer,
  project ForThePeople.in, `spdx:MIT`, Razorpay domestic channel only, plans ₹3,60,000/year
  infrastructure + ₹5,00,000 one-time district expansion + any-amount) and
  `public/.well-known/funding-manifest-urls`. TODO before submitting to FLOSS/fund or FOSS United:
  reconcile the ₹3,60,000/year figure with real invoices (the April ledger itemises ~₹2,700/month;
  the September applications say ₹25–30k/month — one of them is wrong) and run the manifest
  through the validator at floss.fund.
- **Security contact:** `public/.well-known/security.txt` (RFC 9116) and `SECURITY.md` both use
  `support@forthepeople.in` and promise acknowledgement within 7 days.
- **GitHub meta:** `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`.
- **Docs:** README no longer claims "real-time", credits only work that exists, says 108 Prisma
  models and "10 districts (see the live site)". CONTRIBUTING: Node 24, `.env.local`,
  `.env.example` as the only env list, `public/geo/`, a "Where to start" section, CodeRabbit claim
  removed. `.env.example` regenerated from a grep of `process.env.*` (adds
  `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `FTP_AI_PROVIDER`, `AI_PAID_FALLBACK`,
  `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_*`, `NEXT_PUBLIC_ELECTION_MODE`, `FTP_MOCK_*`;
  drops the unread `TOTP_ENCRYPTION_KEY` and `NEXT_PUBLIC_SITE_NAME`). `CLAUDE.md` trimmed to rules
  and pointers. New `docs/ARCHITECTURE.md`. `docs/BUG-TRACKER.md` and `docs/LIVE-STATE.md` now
  state that the June sessions ARE deployed.
- **Tests:** Vitest with six suites over pure helpers (`tenders/format`, `contributor-name`,
  `supporter-message`, `contribution-expiry`, `badge-level`, `social-detect`).

### Manual actions (only the owner can do these)
- Vercel: the 13 Sep "Account is blocked" status is already cleared (a probe deploy was created on
  2026-09-26). Push this branch so Vercel builds a preview: that build proves the font fix below.
  Until this branch is merged, any push to `main` fails on Vercel (`next/font/google` cannot
  download fonts in Vercel's build container).
- Vercel env: add `AI_PAID_FALLBACK=0` (set 1 only for the paid backstop); confirm
  `CRON_SECRET`, `ADMIN_SESSION_SECRET`, `VOTE_IP_SALT`, `RAZORPAY_WEBHOOK_SECRET` are all set.
- GitHub: set the required status checks to `Type-check & Build`, `Lint` and `Unit tests`; drop the
  1-approval rule on this solo repo; label 4–6 issues `good-first-issue` / `help-wanted`.
- Admin → Support page: clear the "bio text" field (or edit it). The saved text names the
  company and hard-codes "9 districts … 29 live dashboards"; the built-in default is clean and
  computes counts live.
- After deploy, regenerate AI insights (admin) so the analyses match current figures.
- Funding: validate `https://forthepeople.in/funding.json` at floss.fund after deploy, reconcile
  the plan amounts with invoices, then submit.

## [2026-06-11] — Audit fix sessions 1–5 (deployed, prod `38df958`)
- Signed, revocable admin sessions (`src/lib/admin-auth.ts`, `ADMIN_SESSION_SECRET`).
- Build no longer runs `prisma db push`; Next.js patched for the May security release.
- RTI / court jobs no longer fabricate numbers on portal failure.
- Endpoint hardening and repo hygiene.
- Full detail: `docs/BUG-TRACKER.md`, `docs/LIVE-STATE.md`.

## [2026-05-20] — India National Dashboard live (`8c62903`)

## [2026-04-23] — Population module v2, 190 rows across 7 states (`bc33bec`)

## [2026-03-17] — Project inception
