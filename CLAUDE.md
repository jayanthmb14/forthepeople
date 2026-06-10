# CLAUDE.md — ForThePeople.in Project Instructions

## Project
ForThePeople.in — Free, open-source citizen transparency platform for Indian districts.
Built by Jayanth M B. Next.js 16 + TypeScript + Tailwind v4 + Prisma 7.5 + Neon PostgreSQL.

## Database Schema Changes (CRITICAL — changed June 2026)
**The build NO LONGER runs `prisma db push`.** The Vercel/CI build runs only
`prisma generate && next build` and never mutates the database. So any schema change
must be applied **manually against prod Neon BEFORE pushing the dependent code:**
1. Edit `prisma/schema.prisma`.
2. Run `npm run db:push` against prod Neon (applies the schema).
3. THEN commit + push the code that depends on the new schema.
(Session 2 audit fix, 2026-06-11 — db push was being run on every deploy, including
unreviewed dependabot PR previews, against the prod schema.)

## Documentation Location
ALL documentation lives inside `docs/` folder:
```
docs/BLUEPRINT-UNIFIED.md          ← Master document (read this FIRST always)
docs/FORTHEPEOPLE-SKILL-UPDATED.md ← Tech stack, file paths, patterns
docs/FORTHEPEOPLE-SKILL.md         ← Original skill reference
docs/DISTRICT-EXPANSION-SKILL.md   ← District expansion guide
docs/AI-NEWS-INTELLIGENCE-SKILL.md ← AI pipeline docs
docs/INDIAN-DISTRICT-HIERARCHY-SKILL.md ← District data reference
docs/PRICING-ALL-INDIA.md          ← Infrastructure pricing
docs/SCALING-CHECKLIST.md          ← Performance scaling guide
docs/GEO-AUDIT-REPORT.md           ← SEO/GEO audit results
```

## Completed Prompts Archive
`prompts/completed/` — prompts that have already been run. Reference only.

## Pending Prompts
`prompts/pending/` — prompts ready to run but not yet executed.

## Before Every Task
1. Read `docs/BLUEPRINT-UNIFIED.md` for current state
2. Read `docs/FORTHEPEOPLE-SKILL-UPDATED.md` for tech stack and patterns
3. Read any module-specific docs relevant to the task

## After Every Task
1. Update `docs/BLUEPRINT-UNIFIED.md` with changes made
2. Update any other relevant docs in `docs/`
3. Verify docs are tracked by git: `git ls-files docs/`
4. Commit and push: `git add -A && git commit -m "..." && git push origin main`
5. Documentation files must NEVER live outside this repo

## AI Cost Rules (CRITICAL)
- `news-analysis` purpose → free model (NOT Gemini Pro). News classification is
  pick-a-category + extract-a-few-fields — the free tier handles it fine.
- `insight` purpose → Gemini 2.5 Pro. Cron runs twice daily (0 0,12 * * *).
- `fact-check` → Claude Sonnet (manual trigger only).
- Before generating an insight, call `hasDataChanged()` — skip if nothing new.
- In scraper news pipeline: run keyword classifier first, call AI only when
  keyword returns "news"/null OR the article lands in an actionable module
  (infrastructure, alerts, exams, staffing, etc.) that wants data extraction.

## Key Rules
- NEVER use "scraper/scraping/scraped" in user-facing text
- NEVER hardcode district data — everything from DB
- NEVER use ioredis on Vercel — use @upstash/redis (REST)
- NEVER store budget values in Crores — always Rupees
- NEVER deploy with `npx vercel --prod` — use `git push origin main`
- NEVER use `npm ci` in Dockerfile.scraper — use `npm install --legacy-peer-deps`
- NEVER use middleware.ts — Next.js 16 uses proxy.ts
- NEVER commit .env.local or any real secrets
- AI calls: always use callAI()/callAIJSON() from src/lib/ai-provider.ts
- Admin auth: cookie ftp_admin_v1, ADMIN_PASSWORD with timingSafeEqual

## Current State (April 14, 2026)
- 9 live districts, 7 states (use `getTotalActiveDistrictCount()` in code,
  never hardcode the number — it changes as districts go live)
- Contributors & sponsorship system COMPLETE: 5 tiers (One-Time / District
  ₹99 / State ₹1,999 / Patron ₹9,999 / Founder ₹50K), dynamic Razorpay
  plans per payment (amount → plan → subscription), expiry on one-time
  (30/60/90 days by amount), state-page sponsor sections, combined
  Supporters + Sponsor CTA card (cool slate, distinct from AI Analysis),
  view-all modal, per-line auto-scroll tickers, admin manual CRUD.
  DEV-ONLY mock mode: set `FTP_MOCK_CONTRIBUTORS=1` in `.env.local`
  (double-gated with `NODE_ENV=development` — prod-safe).
- Admin: unified left sidebar (15 tabs grouped: Overview, Operations
  [+ Content Editor + Update Log], AI & Data, Finance, Analytics + Traffic,
  Security + API Vault, Community). URL `?tab=` routing for in-page sub-tabs.
- Floating AI Admin Bot (bottom-right): pattern-matched queries with zero AI
  cost; unmatched → Dashboard AI Report.
- Content Editor for 7 seeded module types per district with cache invalidation.
- UpdateLog tracks every content change with old/new diff.
- Subscription cleanup: deduped 4 rows, login credentials encrypted at rest.
- Scraper alerts: transient gov-portal timeouts suppressed (noise removed).
- AI cost: insight cron every 12h (was 2h), free fallback chain reordered.
- API Key Vault: encrypted key storage with separate 10-min TOTP session (Redis-backed).
  Reveals are rate-limited + audit logged.
- Multi-user admin: foundation only (AdminUser + AdminAuditLog tables, user management UI).
  ADMIN_PASSWORD cookie still gates login — per-user auth is future work.
- Audit logging: src/lib/audit-log.ts instrumented across vault ops, supporters, expenses,
  platform reports, user management.
- Sentry errors pulled directly into Alerts & Logs via REST API (SENTRY_API_TOKEN).
- Plausible Stats API powers the Traffic tab (live visitors, pages, referrers, devices, countries).
- AI Platform Report: weekly Gemini 2.5 Pro analysis with action items + cost tips
  (Sundays midnight UTC cron + manual dashboard trigger). ~$0.002 per report.
- Analytics tab: week-over-week deltas on totals + feedback-by-type breakdown.
- Graceful degradation: all external-API tabs show setup instructions when keys missing.
- Admin dashboard: Action Required banner, Platform Health cards, Revenue + OpenRouter
  live credit tracking, filterable Recent Activity feed.
- System Health: per-district "Run Now" scraper trigger, expandable error details,
  filterable scraper log table.
- Alerts: severity colours, source badges (scraper/feedback/payment/system), email
  status, CSV export, email-config warning banner when RESEND_API_KEY/ADMIN_EMAIL missing.
- Finance system: Revenue tab (manual supporter add, inline edit, revenue chart),
  Expenditure tab (add/edit/delete expenses, invoice links, P&L view, CSV export),
  Costs tab (real OpenRouter spend, subscription renewal countdowns, monthly/yearly totals).
- Prisma models extended: Subscription (+serviceName, plan, costUSD, expiryDate, autoRenew,
  accountEmail, purchaseDate, exchangeRate), Supporter (+source, referenceNumber).
  New: Expense model. 9 default services seeded via prisma/seed-subscriptions.ts.
- Invoice uploads: link-only (paste URL). Vercel Blob wiring deferred.
- Sentry error monitoring active
- Email alerts via Resend
- Plausible analytics (conditional on env var)
- DPDP privacy policy at /privacy
