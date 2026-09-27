# Changelog

All notable changes to ForThePeople.in are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). One dated entry per push to `main`.
This file replaces the scattered "current state" blocks in `CLAUDE.md`, `docs/LIVE-STATE.md` and the vault.

## [Unreleased] — 2026-09-27 audit fixes

Branch `audit-fixes-2026-09`, five parallel work-streams merged from one end-to-end audit of the
production site (prod = `38df958`, deployed 2026-06-11). Nothing here is deployed until it is
reviewed and pushed; see "Manual actions" at the bottom of this entry.

### Changed — v5 "Calm": quieter design, honest dates, cleanup (branches `v5/*`, 2026-09-27)
The owner found v4 "cartoonish". Nine parallel work-streams moved the site to a calm, pastel,
blue-based look, made every date honest and cleared out dead files. Nothing here is deployed
until the owner reviews and pushes.
- **Design system v5 "Calm"** (`docs/DESIGN-SYSTEM.md`): a soft blue-white page, white cards, one
  blue for actions, support as a soft rose tint. The 14 module hues are pastel and used only as
  identity; no saturated gradient bands. Plus Jakarta Sans everywhere (Bricolage only for a page
  H1). Emoji only as module identity (sidebar item, module chip, overview tile); the kit draws
  Lucide icons where pages still pass an emoji. Subtle motion; the home intro splash is gone.
  Token contrast is unit-tested.
- **Honest dates**: every dataset carries its own date, with realistic expected ages
  (`/api/data/freshness`, `src/lib/freshness.ts`). Old data gets a calm amber notice under the
  title ("This data is N days old … we could not find newer data"); undated data says "date not
  published by the source". Every district page ends with one "Check this data" panel: source,
  data date, when we last checked, on time or late, how we get it, a link to check it yourself
  and one "report a mistake" button.
  - AI cards hide when they are older than 30 days or older than the page's data.
  - Weather, dam and mandi rows carry their reading date; headers no longer say "right now" or
    "updated daily".
  - Exams show "open" and countdowns only for confirmed dates. Empty states say what is missing
    instead of promising a collector.
- **Home and header**: a one-row header with a district finder. The home page is search, "Use my
  location" and **Explore all of India** (the primary action), then the live districts, India at a
  glance, prices today and one support line. "Latest data", "Built with citizens" and "Remember my
  district" are gone. A light footer carries a ForThePeople Connect "coming soon" note.
  `Permissions-Policy` now allows geolocation for the site itself (it was blocked, so "Use my
  location" never asked).
- **District pages**: one sticky district bar instead of three stacked bars, a glance row of key
  facts, a calm overview (name, glance, basics, then topics), and a sidebar and drawer that say
  "coming soon" where a module has no data.
- **Module pages**: calm headers and flat pastel fills, no decorative emoji, one stale notice and
  one sources block per page, no repeated footers or links, the answer first. Per-district state
  config (Pune no longer inherits Mumbai's). "Where our data comes from" says how each dataset
  really arrives and how old it is; the update log is grouped by day in plain words.
- **Support, supporters and prices**: a simple support page (plans, how to subscribe,
  supporters). Supporters are placed by tier or amount, so the Founding Builder shows first
  everywhere (district pages said "All India — be the first" because only recurring gifts
  counted). New `/[locale]/prices`: gold, silver, the rupee, crude oil, Sensex and Nifty with
  3-month trends from IBJA and Yahoo Finance, and no fallback prices.
- **Backend**: an AI model chain with live-checked ids, a reachable paid backstop, JSON mode and an
  expiry guard; AI JSON goes through `callAIJSON`; news-intelligence makes one AI call per
  district, only for new news, inside a time budget. Collection jobs never invent a figure when a
  source field is missing, and every cron run writes one `ScraperLog` row.
- **Cleanup and docs**: 21 dead source files, 13 duplicate or boilerplate static files and 55
  one-off or risky scripts removed (git history keeps them); 14 provenance scripts moved to
  `scripts/archive/`; stale docs, completed prompts and the broken Docker files moved to
  `docs/archive/`. `docs/BLUEPRINT-UNIFIED.md` is rewritten as the current overview (the old one is
  `docs/archive/BLUEPRINT-UNIFIED-2026-06.md`); `public/llms.txt` now lists the ten live districts,
  36 modules and en + hi + kn; `CLAUDE.md` points at the current docs.
- Every new string ships in English, Hindi and Kannada.
- Owner actions from the cleanup (local, not in git): move anything still needed from the 13
  `.env*` backup copies into the password manager and delete them; delete the merged `ui-backup-*`,
  `backend-backup-*` and `session-*` branches; remove the stray `.vercel/` link in the parent
  folder.

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

### Changed — Design v3 "Civic Ledger" (built, then replaced before release)
- v3 was built on this branch and replaced by v4 "Rang" and then v5 "Calm" before it was ever
  deployed, so its design notes are dropped here. Fixes from that pass that still stand:
  - Offices "Open now" uses Indian Standard Time and the hours the page shows.
  - Tenders and water copy promise only cadences that a scheduled job delivers.
  - District cards and state pages take population from sourced Census 2011 rows; other figures
    say "Latest available estimate". Local names that repeat the English name are hidden.
  - Weather collapses repeated readings into one row with date and time; the finance sector chart
    labels every sector; state maps fit their frame.
  - The compare page honours `?module=`; phone breadcrumb-sheet links navigate again.
  - `scripts/fix-district-local-names.ts`: dry-run fixer for local-script names (see Manual actions).

### Changed — Design v4 "Rang", languages and location (branch `redesign-v4`)
- 2026-09-27: English is always the default language. Browser-language detection and the locale
  cookie are off, so `/` and unprefixed links always open in English.
- 2026-09-27: "Find my district" checks district boundaries first and falls back to the nearest
  centre. A "Your district" card then pops up.
  - Live districts show their landmark, tagline, weather and grade, with a link to their dashboards.
  - Districts that aren't live yet show the vote count and the nearest live district.
- 2026-09-27: The language menu lists all 22 Indian languages. The ones not yet available are shown
  locked with their native names.
- 2026-09-27: Live text (news, AI insights) is translated **once** in the backend and stored, in a new
  `ContentTranslation` table. Switching language only reads stored rows and never spends
  translation credits.
  - Providers: Bhashini, Google Cloud Translation or Sarvam, picked by env key.
  - Hooked into `scrape-news` and `generate-insights`, with a catch-up cron `translate-content`
    (every 3 h, `?dry=1` to test a key).
  - Spend caps per run and per month.
  - It is off until a key is added and `npm run db:push` has created the table.
- 2026-09-27: The India map shows live districts as landmark badges in each district's colour, and
  nearby pins fan out with leader lines. The district overview has a "Where is {district}?" locator map.

### Changed — v4.1: Hindi, clearer modules, tap-for-details, device layouts (branch `redesign-v4`)
- 2026-09-27: **Hindi is switched on** (beta, machine draft) next to English (default) and Kannada:
  `hi.json`, a Hindi file for every page, Hindi names for the live districts and taluks
  (`names.hi`), and Devanagari and Kannada fonts that are actually applied. Numbers everywhere use
  Indian grouping with Latin digits.
- 2026-09-27: **Modules regrouped** into 9 plainly named groups: Start here, You can help, Who runs it,
  Money & projects, Help for you, Daily needs, Farming, Know your district, Check our work.
  - Look-alike modules were renamed. For example, "Offices & Services" and "Services Guide" became
    "Govt offices near you" and "How to get certificates".
  - Every module page ends with "See also" tiles.
  - Titles and descriptions are translated, and no title claims "Live".
- 2026-09-27: **Tap for details on every module** (`DetailSheet`):
  - Leaders: role in plain words, contact, how the record was checked, and headlines naming them.
  - Schemes and housing: one-line benefit, a "how it works" picture, who can get it, and where it
    runs.
  - Exams: countdown bars and a full timeline.
  - Also hospitals, offices, dams, police stations, projects, tenders and news.
  - "What you can do" now puts first the actions that match this fortnight's district news.
- 2026-09-27: **Layouts per device**:
  - Tablets get the phone menu instead of a sidebar that left about 500 px for content.
  - Laptops and PCs use a 1320 px frame instead of a 960 px column.
  - Stat tiles show 2 per row on tablets.
  - The "not live yet" district page uses the same frame and is translated.
- 2026-09-27: The leaders API now returns the stored phone, email and local names (they were always
  blanked). Alerts are ranked by severity (the text sort put "medium" before "critical").

### Changed — every page in English + Kannada, new real-data pictures (branch `redesign-v4`)
- 2026-09-27: Nine agents converted every district module page, the site pages and the India dashboard
  to message files (en + kn, `src/dictionaries/<locale>/page_<name>.json`). Each page gained at least
  one picture drawn from real data, for example:
  - crop price bars and biggest price changes
  - "Is the water safe?" (JJM)
  - "How each ₹100 is shared" (finance)
  - "Who runs these schemes"
  - an elected-representatives ring
  - exam hiring ring
  - "Who reported it" (news)

  Also fixed:
  - India deep-dive pages showed mock values as real data, and the India band showed 0 in the
    server HTML.
  - Exams showed some exams twice and a raw key.
  - Kannada numbers used western grouping, and Marathi, Bengali and Urdu would have used native digits.
  - Taluk and tender headings now use the local-script name.
  - Four copies of a place-name hook were merged into one.
- 2026-09-27: **Election results are withheld** until they are checked against ECI. The seeded rows
  had wrong winners (Mandya 2024), a Mysuru seat filed under Mandya, round vote counts and
  placeholder runners-up, all labelled ECI.
- 2026-09-27: The kit gained `DetailSheet` (tap any item to see everything about it), `HowItWorks`,
  `CountdownBar` and a `ModulePage` frame. On laptops and PCs, module pages now use up to 1320 px
  instead of a 960 px column. See `docs/LAYOUT.md` and `docs/MODULE-MAP.md`.

### Fixed — district data and maps (Sept 2026 backend audit, branch `redesign-v4`)
- 2026-09-27: **Infrastructure shows only the district's own projects.** STATE and NATIONAL rows were
  copied onto many districts; one Delhi project appeared on all ten district pages. District pages,
  the report card and insights now use DISTRICT and CITY projects only (`src/lib/data-filters.ts`),
  and the sync no longer fans NATIONAL projects out to every district.
- 2026-09-27: The Police, Leadership and Power pages no longer show rows guessed from news headlines.
  Examples were "Prime Minister of India" stored as a leader's name, any number in a headline stored
  as an NCRB count, and "Factories go fully solar" stored as an outage. The news engine now sends
  these three modules to the admin review queue instead of writing them.
- 2026-09-27: News lists no longer repeat one story from several outlets. Mandya showed the same
  Lokayukta raid 3 times and one car accident 4 times. `src/lib/news-dedupe.ts` collapses reworded
  copies within 48 hours and prefers the outlet's own headline over an "India News | …" aggregator
  copy.
- 2026-09-27: **The Elections page shows results again.** A static calendar route at
  `/api/data/elections` shadowed the module route. The calendar moved to
  `/api/data/election-events`.
- 2026-09-27: Maps.
  - Telangana has its own map (split from the pre-2014 Andhra Pradesh file).
  - Map names now match district pages (`src/lib/geo/aliases.ts`): Mumbai Suburban → Mumbai,
    Haora → Howrah, Gurgaon → Gurugram, Delhi's districts, and others.
  - Clicking a map shape that has no page no longer opens a 404.
  - Andaman and Nicobar, Jammu and Kashmir, and Dadra and Nagar Haveli and Daman and Diu are no
    longer blank on the India maps.
  - Map labels are translated.
  - Taluk maps say their shapes are approximate, and the false OpenStreetMap credit is removed.
  - **State maps are no longer inside-out.** Every state file except Karnataka used GeoJSON winding.
    d3 draws that as "the whole world except this state", so the card was grey with the state shrunk
    to a speck. `scripts/rewind-geo.mjs` (`npm run geo:rewind`, `--check` for CI) fixed 35 files.
    States now fit their frame, live districts get a pin, and the district locator's landmark badge
    sits on the district instead of the top-left corner.

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
- **Data cleanup (optional, pages already hide these rows):** run
  `npx tsx scripts/cleanup-news-derived-2026-09.ts` (dry run). If the list looks right, re-run it with
  `--confirm`. It removes 26 NATIONAL infra copies, 260 news-derived crime rows and 25 fake outages,
  and deactivates 162 news-derived leaders.
- **Seeded random numbers still in the database** (not touched by any script):
  - 24 TrafficCollection rows with fractional-rupee amounts (Mandya, Bengaluru, Lucknow)
  - 4 SugarFactorySeason `totalArrears`
  - 120 RainfallHistory rows for Mandya and Bengaluru Urban (2020–2024), labelled KSNDMC / IMD

  They came from `Math.random()` in `prisma/seed*.ts`. Decide whether to delete them or label them
  as estimates.
- **Translation backend:** run `npm run db:push` once to create `ContentTranslation`, then add ONE
  provider key to Vercel (`BHASHINI_USER_ID` + `BHASHINI_API_KEY`, or `GOOGLE_TRANSLATE_API_KEY`, or
  `SARVAM_API_KEY`). Optional: `TRANSLATION_MONTHLY_CHAR_LIMIT`. Then call
  `/api/cron/translate-content?dry=1` with the cron secret to confirm the key works.
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
