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
                       └─ Government portals, data.gov.in, OpenWeather, Google News RSS (read only)
```

Everything runs inside Vercel serverless functions. There is no long-running
worker in production any more: the `src/scraper/scheduler.ts` + Docker path is a
local/legacy runner for the same job modules, not part of the deployed system.

## 2. Routing

- `src/proxy.ts` (Next.js 16's replacement for middleware) runs `next-intl`
  routing: every public path is prefixed with a locale (`/en`, `/kn`); bare paths
  such as `/support` or `/about` redirect to their `/en/...` equivalent. API
  routes and `/_next` are excluded from the matcher. An optional admin IP
  allowlist is applied here as defence in depth; the real admin gate is
  per-route (section 5).
- `src/app/[locale]/layout.tsx` wraps every page in the React Query provider,
  the progress bar, banners, header and footer.
- `src/app/[locale]/[state]/[district]/<module>/page.tsx` — one folder per
  module. The district layout renders the sidebar from the module registry, so
  adding a folder plus a registry entry adds a module.
- `src/app/[locale]/india/...` — the national roll-up, driven by
  `src/lib/india/india-modules.ts` and statically generated with revalidation.
- `src/app/[locale]/admin/...` — the admin console (tabs are client components
  under the same folder). `/admin/review`, `/admin/security`, `/admin/recover`
  are standalone tool pages.
- Root-level duplicates (`src/app/support`, `src/app/about`, ...) exist only so
  the locale pages can re-export them; they are never served directly.
- SEO: `src/app/robots.ts`, `src/app/sitemap.ts` (built from the active
  district list), `opengraph-image.tsx`, `manifest.ts`. `public/.well-known/`
  holds `security.txt` and `funding-manifest-urls`; `public/funding.json` is the
  FLOSS/fund manifest.

## 3. Data flow

1. **Collection** — `src/scraper/jobs/*.ts` are plain async functions, one per
   data type (crops, dams, weather, news, budget, exams, RTI, courts, ...). Each
   fetches an official source with a per-call timeout, parses it (Cheerio /
   JSON), and upserts rows through Prisma. On failure a job writes **nothing**
   and returns a failed status; it never estimates.
2. **Scheduling** — `vercel.json` `crons` calls `src/app/api/cron/<job>/route.ts`
   on a schedule. Each route checks `Authorization: Bearer <CRON_SECRET>`, takes
   a Redis lock so overlapping runs cannot double-write, runs the job(s), records
   a `ScraperLog` row with timestamps, and posts an admin alert on failure.
   `/api/health` reads those timestamps and reports `degraded` when a job is
   older than twice its schedule.
3. **Storage** — Neon PostgreSQL via Prisma (`prisma/schema.prisma`, generated
   client under `src/generated/prisma`, git-ignored). Money is stored in whole
   rupees. Districts are registered in `src/lib/constants/districts.ts`
   (`isActive` flag + `getTotalActiveDistrictCount()`); everything else about a
   district comes from the DB.
4. **Serving** — `src/app/api/data/[module]/route.ts` is the single read API.
   It normalises `?district=` / `?state=`, reads through the Redis cache
   (`src/lib/cache.ts`, short TTL) and returns `{ data, updatedAt, source }`.
   Pages are server components that call the same loaders directly; client
   components (charts, tickers) use React Query hooks in `src/hooks/`.
5. **Freshness** — every payload carries its `updatedAt`; the UI pill
   (`src/lib/utils/timeAgo.ts` and friends) derives "Xh ago / stale" from it.
   Nothing is labelled live by default.
6. **Content edits** — the admin Content Editor writes to the same tables and
   invalidates the cache key; every change is recorded in `UpdateLog` with the
   old/new diff (`src/lib/update-log.ts`) and surfaced on the district
   `update-log` page.

## 4. AI

`src/lib/ai-provider.ts` is the only place that talks to a model. `callAI()` /
`callAIJSON()` take a `purpose` and pick a chain:

- `news-analysis` → free Tier-1 models on OpenRouter (classification and small
  extraction). A keyword classifier in `src/scraper/jobs/news.ts` runs first so
  most articles never reach a model.
- `insight` → a low-cost model, twice daily, only after `hasDataChanged()`
  says the district's data moved. Output is stored per district/module and
  rendered by `AIInsightCard`.
- `fact-check` → Claude Sonnet, manual trigger from the admin console only.
- Paid fallback is opt-in via `AI_PAID_FALLBACK`. Every call is logged
  (`AILog`) with provider, model, tokens and cost so the admin Costs tab is
  real spend, not an estimate.

Model names live in that one file (and the `AIProviderSettings` row the admin
can edit); do not copy them into docs.

## 5. Authentication and security

- **Admin sessions** (`src/lib/admin-auth.ts`): login = password + TOTP. A
  session is a random id stored in Redis (`admin:session:<id>`, short TTL,
  delete to revoke) plus an HMAC-signed cookie `<id>.<expiry>.<hmac>` signed
  with `ADMIN_SESSION_SECRET`. `requireAdmin()` verifies HMAC, expiry and Redis
  presence, and is called by every admin route, page and server action. It also
  accepts a timing-safe ops header (`x-admin-secret` = `ADMIN_PASSWORD`, or
  `Bearer <SEED_SECRET>`) so curl-based tooling works; that path is rate-limited.
- **TOTP** (`src/lib/totp.ts`): secret encrypted at rest with
  `ENCRYPTION_SECRET`; the 2FA step is bound to a signed challenge cookie so it
  cannot be reached without the password step, and is rate-limited.
- **API Key Vault** (`src/lib/vault-session.ts`): a separate, shorter TOTP-bound
  session for revealing stored third-party keys; reveals are rate-limited and
  audit-logged (`src/lib/audit-log.ts`).
- **Rate limiting** (`src/lib/rate-limit.ts`): Redis counters keyed by a salted
  hash of the IP (`VOTE_IP_SALT`); raw IPs are never stored.
- **Crons**: bearer `CRON_SECRET`, plus Redis locks.
- **Payments**: Razorpay order → client checkout → `/api/payment/verify` checks
  the HMAC signature; `/api/webhooks/razorpay` verifies `RAZORPAY_WEBHOOK_SECRET`
  in constant time and is the only writer of `payment.captured` state.
- **Headers**: `vercel.json` sets nosniff / frame-deny / referrer / permissions
  policies site-wide. Admin JSON is `Cache-Control: no-store`; public data
  routes may be CDN-cached briefly.
- **Privacy**: Plausible (cookieless), DPDP policy at `/privacy`, supporter
  records anonymised at the API boundary (`src/lib/contributor-label.ts` and the
  contributors API), name/message validators in `src/lib/validators/`.
- **Secrets**: only names in git (`.env.example`); values in Vercel env and the
  owner's password manager. Push protection is on.

## 6. Where state lives

| State | Where | Notes |
|---|---|---|
| All civic data, supporters, logs, settings | Neon PostgreSQL | Prisma; schema changes are manual `db:push` before code push |
| Cache of API responses | Upstash Redis | short TTL, invalidated by admin edits |
| Admin + vault sessions, rate limits, cron locks | Upstash Redis | keys prefixed `admin:`, `rate:`, `lock:` |
| Which districts exist / are active | `src/lib/constants/districts.ts` | code, so it ships with a deploy |
| Module registry, India modules, responsibility copy | `src/lib/constants/*`, `src/lib/india/*` | code |
| Translations | `src/dictionaries/*.json` via `next-intl` | `en` complete, `kn` pilot |
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
docs/             this file, BUG-TRACKER, LIVE-STATE, module guides, archived BLUEPRINT
prisma/           schema + seed scripts (one per district / module)
public/           static assets, geo boundaries, funding.json, .well-known/
scripts/          one-off ops scripts (checks, purges, extracts); not type-checked by the app tsconfig
src/app/          routes (see section 2)
src/components/   UI, grouped by area (home, india, tenders, admin, support, common)
src/hooks/        React Query hooks for client components
src/lib/          everything shared: db, redis, cache, ai-provider, admin-auth, tenders, validators
src/scraper/      collection job modules + parsers (run by the cron routes)
tests/            Vitest suites
```

## 9. Things that are intentionally NOT in the system

- No ORM other than Prisma, no ioredis, no middleware.ts, no long-lived worker.
- No estimated or interpolated numbers anywhere: a missing source is an empty state.
- No advertising, no third-party cookies, no user accounts for citizens.
- No foreign-currency funding channels (domestic contributions only).
