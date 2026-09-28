# ForThePeople.in — Architecture

How the platform is put together today. Deliberately free of version numbers,
prices, schedules and counts: those live in `package.json`, `vercel.json`,
`src/lib/constants/razorpay-plans.ts` and the database, and drift the moment they
are copied into prose. Read `CHANGELOG.md` for what changed and when.

## 1. The shape of the system

```
 Citizens ──HTTPS──▶ Vercel (Mumbai region)
                       │
                       ├─ Next.js App Router (server components + API routes)
                       │     ├─ /[locale]/…            district, state, India pages
                       │     ├─ /api/data/[module]    read API behind every dashboard
                       │     ├─ /api/cron/*           scheduled data collection + AI
                       │     ├─ /api/admin/*          admin console (signed sessions)
                       │     ├─ /api/payment/*, /api/webhooks/razorpay
                       │     └─ /api/health           liveness + freshness
                       │
                       ├─ Neon PostgreSQL  (Prisma, `src/lib/db.ts`)      ← the source of truth
                       ├─ Upstash Redis    (REST, `src/lib/redis.ts`)     ← cache, sessions, rate limits, locks
                       ├─ OpenRouter / Anthropic (`src/lib/ai-provider.ts`)
                       ├─ Razorpay, Resend, Sentry, Plausible
                       └─ Government portals and other reputed sources (read only):
                             data.gov.in / AGMARKNET, NJDG, JJM dashboard, UDISE+, NREGA,
                             state e-procurement portals, NDMA SACHET, OpenWeather,
                             Open-Meteo, Wikipedia / Wikidata (leader checks), Google News RSS
```

Everything runs inside Vercel serverless functions. There is no long-running
worker in production any more: `src/scraper/scheduler.ts` (`npm run scraper`) is
a local runner for the same job modules, not part of the deployed system. The
old Docker files are archived in `docs/archive/docker/`.

## 2. Routing

- `src/proxy.ts` (Next.js 16's replacement for middleware) runs `next-intl`
  routing: every public path is prefixed with a locale (`/en`, `/hi`, `/kn`;
  routed locales come from `src/i18n/languages.ts`, and planned-but-unshipped
  ones redirect to `/en`); bare paths such as `/support` or `/about` redirect
  to their `/en/...` equivalent. API
  routes and `/_next` are excluded from the matcher. An optional admin IP
  allowlist is applied here as defence in depth; the real admin gate is
  per-route (section 5).
- `src/app/[locale]/layout.tsx` wraps every page in the React Query provider,
  the progress bar, banners, header, footer and the floating Report button.
- **Site chrome** (`src/components/home/`, design v5.1): `HeaderBar` renders
  the disclaimer line, the sticky full-width header and the status strip.
  - Header: logo and apps switcher (`ProductSwitcher`, `products.tsx`:
    ForThePeople.in, plus Connect and Jobs marked "coming soon", not links),
    search, `LanguageMenu`, Vote, GitHub stars and Support. Below 1024 px the
    extras move into `HeaderMenu`.
  - The GitHub star count is fetched on the server at most once an hour
    (`github-stars.ts`) and passed down from the layout.
  - `Footer` repeats the links and shows the coming-soon apps. On district
    pages and India module pages `FooterFrame` shows it folded under one
    slim line with a "More" button (`footer-mode.ts` decides; tested in
    `tests/footer-mode.test.ts`).
- **Status strip** (`StatusStrip.tsx`; the rules are pure and tested in
  `status-strip.ts`). It reads three things:
  - **Clock:** the browser's time in IST, redrawn each minute. Nothing is
    drawn on the server, so there is no hydration mismatch.
  - **Share market:** NSE hours (Mon–Fri 09:15–15:30 IST) plus the newest
    Sensex / Nifty quote from `/api/data/prices`. It says "open" only when a
    quote is recent, "closed" outside hours or when a snapshot well into the
    session still has an older day's quote (a holiday), and nothing
    otherwise. There is no holiday calendar.
  - **"Live data refreshed N ago":** district pages only, from
    `/api/data/freshness` (`useFreshness`). Shown only when every live feed
    (`LIVE_FEED_KEYS`: weather, mandi, dams, news, alerts) is on time, and
    it uses the oldest check.
- **Report button** (`src/components/common/ReportButton.tsx`), mounted once
  in `[locale]/layout.tsx`:
  - Opens a short form that already knows the page: title, address and, on
    district pages, the state, district and dashboard. It posts to the
    existing `/api/feedback`; a 429 gets its own message.
  - Hidden on admin pages and on India module pages, which keep
    `IndiaReportIssueButton` in the same corner.
  - It is the only report form on district pages too (v5.3 removed the
    separate "Report a mistake" button from "Check this data"):
    `reportContext()` sends the state, district and module (or taluk) with
    every report made there.
- `src/app/[locale]/[state]/[district]/<module>/page.tsx` — one folder per
  module. The district layout renders the sidebar from the module registry, so
  adding a folder plus a registry entry adds a module.
- District pages share one shell from the district layout:
  - `DistrictBar`: state › district › taluka, below the site header, with
    the day, date and time in IST (`shell/useIstClock.ts`) and a "N of M live
    feeds up to date" pill from `/api/data/freshness`. Hover lists each feed;
    a click jumps to `#verify`.
  - `GlanceRow`: Collector, MPs, people, projects, budget and next election,
    on the district overview only. Module pages keep just the stale notice
    at the top.
  - Overview: a hero, number tiles and picture cards (`shell/OverviewCard.tsx`,
    `shell/MoneySnippet.tsx`, drawings in `shell/overview-art.tsx`).
  - `StaleNotice` / `StaleDataNotice`: "this data is N days old", from each
    module's expected max age in the registry.
  - `VerifyPanel`: "Check this data" at the bottom: source, data date, last
    checked and how it is collected. It also shows each
    dataset's double-check status from `/api/data/verification`
    (`shell/useVerification.ts`, parsing in `shell/verification.ts`). If that
    route fails or answers something unknown, the panel stays as before.
- Module pages with their own read routes: the weather page reads
  `/api/data/forecast` (`useForecast()`), the courts page reads
  `/api/data/court-pendency`.
- `src/app/[locale]/prices` — gold, silver, markets and the rupee, with
  1-week, 1-month and 3-month trends (`/api/data/prices`, `src/lib/markets/`).
  Values are fetched live and cached; nothing is invented when a source
  refuses.
- `src/app/[locale]/india/...` — the national roll-up, driven by
  `src/lib/india/india-modules.ts` and statically generated with revalidation.
- `src/app/[locale]/admin/...` — the admin console (tabs are client components
  under the same folder). `/admin/review` and `/admin/security` are standalone
  tool pages; the 2FA recovery page is `/[locale]/admin-recover`, outside the
  admin layout so it opens while logged out.
- Everything public lives under `src/app/[locale]/…` (about, contribute,
  feedback, support, privacy and disclaimer moved there in e505d27). Directly
  under `src/app/` there are only the root layout and page, the error and
  not-found pages, global CSS, the favicon and the SEO/metadata routes below.
- SEO: `src/app/robots.ts`, `src/app/sitemap.ts` (built from the active
  district list), `opengraph-image.tsx`, `manifest.ts`. `public/.well-known/`
  holds `security.txt` and `funding-manifest-urls`; `public/funding.json` is the
  FLOSS/fund manifest.

## 3. Data flow

1. **Collection** — `src/scraper/jobs/*.ts` are plain async functions, one per
   data type (crops, dams, weather, news, budget, exams, RTI, courts, ...). Each
   fetches a government portal or other reputed source with a per-call
   timeout, parses it (Cheerio / JSON), and upserts rows through Prisma. On
   failure a job writes **nothing** and returns a failed status; it never
   estimates.
   - The v5.1 portal collectors are `courts-njdg.ts`, `jjm-dashboard.ts`,
     `udise-schools.ts`, `mgnrega-glance.ts` and `gepnic-tenders.ts`. Their
     parsers and checks are in `src/scraper/lib/` (`jjm.ts`, `udise.ts`,
     `nrega.ts`, `gepnic.ts`) and `src/lib/courts/`. Each one cross-checks the
     source against itself (totals add up, two endpoints agree) before it
     writes anything.
   - `src/scraper/lib/collector-registry.ts` (`PORTAL_COLLECTORS`) lists them
     with module, cron, schedule, storage, source and expected age, for the
     "Where our data comes from" page and the freshness checks. Nothing reads
     it yet.
   - The old `jobs/courts.ts`, `jjm.ts`, `mgnrega.ts`, `schools.ts` and
     `power.ts` call dead APIs and run only from the local scheduler.
2. **Scheduling** — `vercel.json` `crons` calls `src/app/api/cron/<job>/route.ts`
   on a schedule. Each route checks `Authorization: Bearer <CRON_SECRET>`, runs
   the job(s) inside its own time budget, and records a `ScraperLog` row per
   run (success or failure, rows written, duration), which the verification
   panel and admin read. The slow collectors also take a Redis lock
   (`lock:cron:<name>` or `ftp:lock:<name>`) so overlapping runs cannot
   double-write; some routes post an admin alert on failure. Beyond the
   original jobs:
   - `scrape-alerts` reads NDMA SACHET, the official disaster-alert feed.
   - `scrape-weather` falls back to Open-Meteo when OpenWeather fails.
   - `health-score` recomputes district report cards (a stored grade expires
     after 7 days).
   - `verify-data` runs the double-check (item 7 below).
   - `dedupe-data` runs the duplicate guard (item 9 below; not in
     `vercel.json` yet).
   - `scrape-courts` reads NJDG; `scrape-jjm`, `scrape-schools`,
     `scrape-mgnrega` and `scrape-tenders` read the JJM dashboard, UDISE+,
     the NREGA "At a glance" page and the state e-procurement portals.
   - `scrape-fuel` reads PPAC's daily metro petrol/diesel table and checks
     Delhi against PPAC's "as on" line and BPCL's price build-up (PDFs read
     by the small `src/scraper/lib/pdf-text.ts`); Redis `ftp:data:fuel`.
   `/api/health` reads those timestamps and reports `degraded` when a job is
   older than twice its schedule.
3. **Storage** — Neon PostgreSQL via Prisma (`prisma/schema.prisma`, generated
   client under `src/generated/prisma`, git-ignored). Money is stored in whole
   rupees. Districts are registered in `src/lib/constants/districts.ts`
   (`isActive` flag + `getTotalActiveDistrictCount()`); everything else about a
   district comes from the DB.
   - Some district figures have no table yet and live in Redis:
     - UDISE+ and MGNREGA snapshots: `ftp:data:udise:<slug>` and
       `ftp:data:mgnrega:<slug>` (`src/scraper/lib/district-snapshot.ts`). No
       expiry; written only after every check passed, so a failed run keeps
       the last good one. Read with `readDistrictSnapshot()`; no page reads
       them yet.
     - The NJDG courts snapshot: `ftp:courts:njdg:<slug>`, and High Courts at
       `ftp:courts:njdg-hc:<stateCode>` (`src/lib/courts/store.ts`, 120-day
       expiry). The collector also writes this year's filed / decided /
       waiting figures to `CourtStat` (source prefix `NJDG district
       dashboard`), so the page still has figures if the key is lost.
   - A proposed `DistrictIndicator` table would replace the UDISE+ / MGNREGA
     keys; it is not in the schema.
4. **Serving** — `src/app/api/data/[module]/route.ts` is the single read API.
   It normalises `?district=` / `?state=`, reads through the Redis cache
   (`src/lib/cache.ts`, short TTL) and returns `{ data, updatedAt, source }`.
   Pages are server components that call the same loaders directly; client
   components (charts, tickers) use React Query hooks in `src/hooks/`.
   Smaller read-only routes sit beside it for single features:
   - `election-events` (election calendar)
   - `leader-news` (headlines naming a leader, for the leader detail sheet)
   - `responsibility-news` (this fortnight's news topics, which drive "What
     you can do")
   - `exam-news`
   - `scheme-coverage`
   - `dam-history`
   - `glance` (the at-a-glance row)
   - `dataset-dates` (newest date per dataset, for the stale notice and the
     verification panel)
   - `freshness` (how old each dataset is, for the stale notice, the
     district bar and the status strip)
   - `verification` (the double-check status per dataset, item 7)
   - `forecast` (today, tomorrow and the next days, item 8)
   - `court-pendency` (the NJDG snapshot; it never returns the hand-seeded
     `CourtStat` rows)
   - `prices`

   None of them writes to the database; some cache their answer in Redis.
   Slugs are checked (`src/lib/read-api.ts`) before any cache or database
   work, and `[module]` answers 404 for a module it does not serve.
   `/api/public/district/<slug>` is the one route meant for other sites
   (CORS open); each item it sends names its own source.
5. **Freshness** — every payload carries its `updatedAt`; the UI pill
   (`src/lib/utils/timeAgo.ts` and friends) derives "Xh ago / stale" from it.
   Nothing is labelled live by default.
6. **Content edits** — the admin Content Editor writes to the same tables and
   invalidates the cache key; every change is recorded in `UpdateLog` with the
   old/new diff (`src/lib/update-log.ts`) and surfaced on the district
   `update-log` page.
7. **Double-check (verification)** — `src/lib/verification/` has one verifier
   per dataset: freshness, leaders, weather, dams and mandi. The daily
   `verify-data` cron runs them, each with its own time cap.
   - Each compares our stored value with a second source: another weather
     service; CEDA's mirror of AGMARKNET; a re-read of the Karnataka water
     portal; Wikipedia and Wikidata for the Chief Minister, Deputy CM,
     Governor or Lieutenant Governor, Prime Minister and President.
   - It writes `DataVerification` rows. Disagreements become review items in
     `NewsActionQueue` (dataType `verify-leaders`). It never changes the data
     it checks.
   - `/api/data/verification` serves the summary (`verified`,
     `single-source`, `disagreement`, `unchecked`). Until `npm run db:push`
     creates the table, every dataset is "unchecked".
   - How it works and how to add a verifier: `docs/VERIFICATION.md`.
8. **Weather forecast** — `src/lib/weather/`:
   - `codes.ts`: one set of weather kinds for Open-Meteo codes, OpenWeather
     codes and stored description text.
   - `forecast.ts`: parses both sources into IST days with range checks (a
     bad value becomes "—"), and compares them (agree within 3°).
   - `fetch-forecast.ts` and `use-forecast.ts` (the React Query hook).
   - `/api/data/forecast` asks Open-Meteo (no key) and, when
     `OPENWEATHER_API_KEY` is set, OpenWeather at the same time. The point is
     the district HQ from `src/lib/geo/district-centroids.ts`; a district
     without one gets 404, so no source is asked with a guessed location.
     Redis cache 1 h (5 min after a failure), CDN 30 min.
   - "Right now" on the weather page: our stored reading if it is 3 hours old
     or less; else the forecast's current value, labelled with its source and
     time; else the old reading in grey with its age.
   - `src/components/weather/` draws it (`ForecastCards`, `ForecastStrip`,
     `ForecastDaySheet`, `WeatherArt`). `src/components/district/TodayWeatherTile.tsx`
     is built for the overview but not mounted yet.

9. **Duplicates** — `src/lib/dedupe/`:
   - `keys.ts`: when two rows are the same thing (canonical names, exam
     keys, exam status and election-type sets, URL / PIN / constituency
     keys, a similarity score). `match.ts`: `findSameNamed()`, the lookup
     every named-row writer does before it creates.
   - `exam-rules.ts`: government organisers only; one row per exam per
     place (national: no state or district; state: no district).
   - `guard.ts` + cron `dedupe-data`: exact duplicates merged
     automatically, conflicts and similar names queued once in
     `NewsActionQueue` (dataType `verify-duplicates`).
   - `scripts/dedupe-2026-09.ts`: the one-time clean-up with the same guard.

## 4. AI

`src/lib/ai-provider.ts` is the only place that talks to a model.
`src/lib/ai-models.ts` (pure, unit-tested) decides which models a call may try
and in what order. `callAI()` / `callAIJSON()` take a `purpose` and pick a
chain:

- `news-analysis` (and `classify`, `summarize`, `format`) → **Tier 1**: a free
  router on OpenRouter first, then free models, then a paid backstop that
  always keeps the last slot and is used only when `AI_PAID_FALLBACK=1`. A
  keyword classifier in `src/scraper/jobs/news.ts` runs first so most
  articles never reach a model.
- `insight` / `document` → **Tier 2**: two low-cost paid models, then the free
  Tier-1 chain. Insights run twice daily, only after `hasDataChanged()` says
  the district's data moved. Output is stored per district/module and
  rendered by `AIInsightCard`.
- `fact-check` → a Claude Sonnet model, then a smaller Claude model; never a
  free model. Manual trigger from the admin console only.
- At most 4 models are tried per call (2 for fact-check). Models missing from
  OpenRouter's live list or with an open circuit breaker are skipped. Every
  call is logged (`AIUsageLog`) with provider, model, tokens and cost so the
  admin Costs tab is real spend, not an estimate.

Model ids live only in `src/lib/ai-models.ts` (and the `AIProviderSettings`
row the admin can edit); do not copy them into this file. The current chain
and why it was chosen: `docs/RUNBOOKS/ai-models.md`.

**Translation of live text** (news, AI insights) is separate from `callAI`.
`src/lib/translation/` translates each new item **once** into every
switched-on language through a translation provider (Bhashini, Google or
Sarvam, chosen by env key), and stores the result in `ContentTranslation`.
The data APIs take `?locale=` and swap in the stored text with one DB read.
A page request never calls a provider, so switching language costs nothing.
Writers: `scrape-news`, `generate-insights`, and the catch-up cron
`translate-content`. Details: `docs/I18N.md` §3.

## 5. Authentication and security

- **Admin sessions** (`src/lib/admin-auth.ts`): login = password + TOTP. A
  session is a random id stored in Redis (`admin:session:<id>`, short TTL,
  delete to revoke) plus an HMAC-signed cookie `<id>.<expiry>.<hmac>` signed
  with `ADMIN_SESSION_SECRET`. `requireAdmin()` verifies HMAC, expiry and Redis
  presence, and is called by every admin route, page and server action. It also
  accepts a timing-safe ops header (`x-admin-secret` = `ADMIN_PASSWORD`) so
  curl-based tooling works; that path is rate-limited. The header skips 2FA, so
  anything that changes security or decrypts secrets uses `requireAdminCookie()`
  (cookie session only): 2FA setup / verify / disable, the recovery e-mail and
  phone (plus a current code while 2FA is on), logout-all, the API-key vault
  and revealing a stored service login. Rules: `src/lib/admin-second-factor.ts`.
- **TOTP** (`src/lib/totp.ts`): secret encrypted at rest with
  `ENCRYPTION_SECRET`; the 2FA step is bound to a signed challenge cookie so it
  cannot be reached without the password step, and is rate-limited. Every code
  check (login, vault unlock, 2FA verify / disable, recovery change) is
  throttled per IP and fails closed. The lost-phone page is
  `/[locale]/admin-recover`, outside the admin layout.
- **API Key Vault** (`src/lib/vault-session.ts`): a separate, shorter TOTP-bound
  session for revealing stored third-party keys, bound to the admin cookie
  (`requireVaultSession()`); the unlock code is throttled and counts towards
  the login lockout; reveals are capped and audit-logged (`src/lib/audit-log.ts`).
- **Rate limiting** (`src/lib/rate-limit.ts`): Redis counters keyed by a salted
  hash of the IP (`VOTE_IP_SALT`, `hashIp(getClientIp(req))`). Citizens' raw
  IPs are never stored (feedback keeps the same salted hash); only the admin's
  own login IP is kept, in `AdminAuth` and the admin audit log.
- **Crons**: bearer `CRON_SECRET`, plus Redis locks on the slow collectors.
  Collectors identify themselves honestly in their user agent, wait between
  requests and never use captcha-protected pages.
- **Payments** (rules pure and tested in `src/lib/supporter-payment.ts`):
  - One-time: `create-order` stores the order under a one-time tier within its
    bounds → checkout → `/api/payment/verify` checks the HMAC signature and
    that the contribution belongs to that order. The supporter row is written
    by `recordOneTimePayment()` (`src/lib/record-supporter-payment.ts`), the
    one writer shared with the webhook (`payment.captured`, when the browser
    never came back) and the admin Sync button: checkout name (never the
    payer's contact), checkout visibility, an expiry by amount, and never a
    row for a monthly debit (`invoice_id`).
  - Monthly: `create-subscription` checks tier, amount and place and writes
    them into the subscription's notes; `verify-subscription` reads them back
    from Razorpay (never from the browser). The webhook keeps status, badge
    and expiry current; a cancelled or halted subscription expires at the end
    of the paid period.
  - `/api/webhooks/razorpay` verifies `RAZORPAY_WEBHOOK_SECRET` in constant
    time. Every writer clears the supporter lists with `bustSupporterCaches()`
    (`src/lib/supporter-cache.ts`).
- **Headers**: `vercel.json` sets nosniff / frame-deny / referrer / permissions
  policies site-wide. Admin JSON is `Cache-Control: no-store`; public data
  routes may be CDN-cached briefly.
- **Privacy**: Plausible (cookieless), DPDP policy at `/privacy`, supporter
  records anonymised at the API boundary (`src/lib/contributor-label.ts` and the
  contributors API), name/message validators in `src/lib/validators/`.
  `/api/data/contributors` and `/api/payment/contributors` send every name
  through `publicDisplayName()` (`src/lib/supporter-name.ts`): a name that is
  really a phone number or an e-mail (older webhook rows can hold the payer's
  contact as the name) goes out as "Supporter", and is masked again on screen;
  new rows never take the payer's contact as a name.
- **Secrets**: only names in git (`.env.example`); values in Vercel env and the
  owner's password manager. Push protection is on.

## 6. Where state lives

| State | Where | Notes |
|---|---|---|
| All civic data, supporters, logs, settings | Neon PostgreSQL | Prisma; schema changes are manual `db:push` before code push |
| Cache of API responses | Upstash Redis | short TTL, invalidated by admin edits; the forecast is cached per district (`ftp:forecast:v1:<state>/<district>`) |
| Admin + vault sessions, rate limits, cron locks | Upstash Redis | keys prefixed `admin:`, `rate:`, `lock:`; two crons lock with `ftp:lock:<name>` |
| Cron run state | Upstash Redis | `ftp:cron:<name>` hashes + one `ScraperLog` row per run (`docs/RUNBOOKS/crons.md`) |
| District figures with no table yet | Upstash Redis | `ftp:data:udise:<slug>`, `ftp:data:mgnrega:<slug>` (no expiry), `ftp:courts:njdg:<slug>`, `ftp:courts:njdg-hc:<stateCode>` (120 days) |
| Double-check results | Neon PostgreSQL | `DataVerification` rows (needs `db:push`); review items in `NewsActionQueue` |
| Which districts exist / are active | `src/lib/constants/districts.ts` | code, so it ships with a deploy |
| Module registry, India modules, responsibility copy | `src/lib/constants/*`, `src/lib/india/*` | code |
| Translations | `src/dictionaries/<locale>.json` + `<locale>/page_*.json` via `next-intl` (namespaces indexed by `scripts/gen-i18n-namespaces.mjs`) | `en` live and default; `hi`, `kn` beta (machine drafts). Live text (news, insights) via `ContentTranslation` + the `translate-content` cron — needs `db:push` + one provider key |
| Map boundaries | `public/geo/*.json` | with source attribution |
| Support-page copy, announcements | DB rows edited from admin | fall back to `src/lib/support-defaults.ts` |
| Env configuration | Vercel project env | names listed in `.env.example` |
| Error telemetry | Sentry | release tagged with the git SHA |
| Traffic analytics | Plausible | pulled into the admin Traffic tab via its stats API |

## 7. Build, deploy, run

- **Local**: `nvm use` (Node from `.nvmrc`), `npm install`, `.env.local`,
  `npx prisma generate`, `npm run dev`.
- **Checks**: `npm run lint`, `npx tsc --noEmit`, `npm test` (Vitest over pure
  helpers in `tests/`, no DB). CI runs all three plus `next build` against a
  throwaway Postgres.
- **Deploy**: `git push origin main` → Vercel builds with `prisma generate &&
  next build`. The build **never** touches the database schema.
- **Schema change**: edit `prisma/schema.prisma` → `npm run db:push` against
  prod → then push the code. (Seeds are also run by hand: `npx tsx prisma/seed-*.ts`.)
- **Rollback**: promote the previous Vercel deployment; nothing in a deploy
  mutates data, so rollback is safe.

## 8. Repository map

```
.github/          CI (lint, type-check+build, unit tests), Dependabot, PR template, CODEOWNERS
docs/             BLUEPRINT-UNIFIED (overview), this file, DESIGN-SYSTEM, LAYOUT, MODULE-MAP,
                  I18N, RUNBOOKS/, module guides; archive/ holds history only
prisma/           schema + seed scripts (one per district / module)
public/           static assets, geo boundaries, funding.json, .well-known/
scripts/          reusable ops scripts (i18n index, geo rewind, health scores, activation);
                  archive/ = provenance only; not type-checked by the app tsconfig
src/app/          routes (see section 2)
src/components/   UI by area: district/ (the kit: ui.tsx, visuals.tsx, DetailSheet;
                  shell/ = district bar, glance row, overview cards, verify panel),
                  layout/, home/ (home page + site chrome: header, status strip,
                  footer), india/, map/, admin/, support/, site/, common/
                  (ReportButton, LanguageMenu), graphics/ (shared SVG category
                  glyphs), weather/ (forecast cards and drawings), and per-module
                  folders (accountability, community, money, farm, crops, water,
                  land-water, demographics, services-1, services-2, tenders, …)
src/hooks/        React Query hooks for client components
src/lib/          everything shared: db, redis, cache, ai-provider, ai-models, admin-auth,
                  tenders, validators; verification/ (double-check), weather/
                  (forecast), courts/ (NJDG snapshot), dedupe/ (canonical keys,
                  duplicate guard)
src/scraper/      collection job modules + parsers (lib/); the cron routes run news,
                  crops, weather, dams, alerts, exams, budget, AI analysis, courts,
                  JJM, schools, MGNREGA and tenders; the rest only from the local
                  scheduler (`npm run scraper`)
tests/            Vitest suites
```

## 9. Things that are intentionally NOT in the system

- No ORM other than Prisma, no ioredis, no middleware.ts, no long-lived worker.
- No estimated or interpolated numbers anywhere: a missing source is an empty state.
- No advertising, no third-party cookies, no user accounts for citizens.
- No foreign-currency funding channels (domestic contributions only).
