---
name: forthepeople-blueprint
description: "Complete blueprint for ForThePeople.in — India's citizen transparency platform. Use this skill whenever building ANY component, page, dashboard, scraper, API, database model, or UI element for ForThePeople.in. Triggers: district dashboards, budget trackers, crop prices, interactive maps, government offices, citizen responsibility, real-time alerts, RTI filing, school trackers, dam/water dashboards, sugar factories, elections, transport, housing, power outages, soil health, famous personalities, AI news intelligence, admin review, leadership hierarchy, health scores, feature voting. Also trigger on: 'ForThePeople', 'district dashboard', 'citizen transparency', 'government data India', 'continue from where we left off', 'build the next section'."
---

# ForThePeople.in — Claude Code Skill Reference

## CURRENT STATE

```
STATUS:           Sections 1-10 COMPLETE + Contributor system + All states unlocked. Fully deployed.
LIVE URL:         https://forthepeople.in
GITHUB:           https://github.com/jayanthmb14/forthepeople (PUBLIC — clean history, MIT with Attribution)
VERCEL:           zurvoapp Pro (scope: zurvoapps-projects)
ACTIVE DISTRICTS: 10 across 7 states (Karnataka: Mandya, Mysuru, Bengaluru Urban;
                  Delhi: New Delhi; Maharashtra: Mumbai + Pune;
                  West Bengal: Kolkata; Tamil Nadu: Chennai;
                  Telangana: Hyderabad; Uttar Pradesh: Lucknow)
ALL STATES:       36 states/UTs browsable (locked ones show preview + sponsor CTA)
ALL DISTRICTS:    ~180 districts in DB — Maharashtra expanded 5→35 during Pune launch
STATE MAPS:       33 GeoJSON maps from DataMeet Census 2011 + Karnataka hand-tuned.
                  public/geo/pune-taluks.json is a stub — 14 polygons pending.
PROJECT ID:       FTP-JMB-2026-IN (watermark ID)
LAST UPDATED:     April 23, 2026 — Pune district #10 launch:
                    41 Leaders, 5 BudgetAllocation + 5 BudgetEntry, 13 InfraProject,
                    8 Schools, 6 Schemes, 14 Taluks (Hospital module blocked —
                    schema gap). Launched via new 6-prompt sequential write-not-run
                    pattern — supersedes single-prompt expansion.
                  April 2026 (earlier) — Population Module v2 live: 190
                    DemographicProfile rows, NITI MPI 2023 integrated.
                  April 13 — contributors system COMPLETE: dynamic Razorpay plans,
                    5-tier merge, Indian hook lines, state page sponsors, admin
                    manual CRUD, growth chart, expiry system.
```

---

## TECH STACK SUMMARY

| Layer | Library | Version | Why |
|-------|---------|---------|-----|
| Framework | Next.js | 16.1.7 | App Router, TypeScript, src/ dir |
| React | React | 19.2.3 | Server Components, streaming |
| CSS | Tailwind | v4 CSS @theme | No tailwind.config.ts — tokens in globals.css |
| ORM | Prisma | 7.5.0 | prisma-client-js + @prisma/adapter-pg |
| Database | Neon PostgreSQL | — | Serverless Postgres, free tier |
| Cache | @upstash/redis | REST | Must be REST — ioredis crashes Vercel serverless |
| State | @tanstack/react-query | v5 | Server state, caching, refetch |
| Charts | recharts | v3 | Lazy loaded via next/dynamic |
| Maps | react-simple-maps | — | FINAL choice after D3→Leaflet→this |
| i18n | next-intl | v4 | English + Kannada |
| AI (primary) | @anthropic-ai/sdk | — | Claude Opus via OpusCode proxy |
| AI (fallback) | @google/generative-ai | — | Gemini 2.5 Flash |
| Payments | razorpay | — | Live keys, HMAC-SHA256 signature verification |
| Email | resend | v6 | 2FA recovery emails + admin alert emails |
| Monitoring | @sentry/nextjs | — | Error tracking (production only) |
| 2FA | otpauth + qrcode | — | TOTP Google Authenticator |
| Encryption | Node.js crypto | built-in | AES-256-CBC for API keys + TOTP secrets |
| Icons | lucide-react | — | 20px default |
| Scraper | node-cron + cheerio | — | Railway container only |
| Date | date-fns | v4 | — |

**Critical note on ioredis vs @upstash/redis:**
- `@upstash/redis` (REST API) — use on Vercel serverless (all Next.js API routes)
- `ioredis` (TCP) — use ONLY in Railway scraper container (persistent process)

---

## AI ARCHITECTURE

### Provider System (`src/lib/ai-provider.ts`)

```typescript
// ALWAYS use these — never call Anthropic/Gemini directly
callAI(prompt, options?)           // returns string
callAIJSON<T>(prompt, options?)    // returns { data: T, provider: string, model: string }
```

### 3 Provider Sources
```
1. OpusCode.pro proxy (PRIMARY)
   activeProvider = "anthropic", anthropicSource = "opuscode"
   ANTHROPIC_BASE_URL env var (contains "opuscode" → auto-detected)

2. Official Anthropic
   activeProvider = "anthropic", anthropicSource = "official"
   Base URL: https://api.anthropic.com

3. Google Gemini (FALLBACK)
   activeProvider = "gemini"
   Model: gemini-2.5-flash (default)
```

### Auto-Detection
```typescript
// ai-provider.ts auto-sets anthropicSource=opuscode if:
process.env.ANTHROPIC_BASE_URL?.includes("opuscode") === true
// Logs base URL to console for debugging
```

### Base URL Priority (CRITICAL — never change this order)
```typescript
const baseUrl = process.env.ANTHROPIC_BASE_URL
  || settings.anthropicBaseUrl
  || "https://api.anthropic.com";
// Env var ALWAYS wins over DB setting
```

### Response Parsing (CRITICAL)
```typescript
// CORRECT — always find the text block, never assume index
const textBlock = response.content.find(b => b.type === 'text');
const text = textBlock?.text ?? '';

// WRONG — breaks with extended thinking (thinking blocks come before text)
const text = response.content[0].text;

// Extended thinking requirement:
// maxTokens MUST be >= 2048 for extended thinking to work
```

### Fallback
If primary provider fails → auto-falls back to `fallbackProvider` from DB settings.
Returns graceful errors (never throws to user).

---

## 4 AI ENGINES

### Engine 1: News Intelligence Pipeline
```
Location:   src/scraper/jobs/news.ts + ai-analyzer.ts
Trigger:    Cron every 1h (news scrape) + monthly ai-analyzer.ts
Flow:       RSS scraping → Gemini/Opus classification → targetModule + extractedData
            stored in NewsItem.aiAnalyzed + NewsItem.targetModule
Output:     AIInsight records → ReviewQueue (pending until admin approves)
Display:    AIInsightCard badge on module pages (after approval)
```

### Engine 2: News Action Engine
```
Location:   src/lib/news-action-engine.ts
Functions:  classifyArticleWithAI() — extracts structured data from article
            executeNewsAction() — decides what to do with extracted data
Confidence thresholds:
  > 0.85 → auto-execute DB mutation immediately
  0.60–0.85 → queue for human review in NewsActionQueue
  < 0.60 → discard
Models:     NewsActionQueue (pending/executed/rejected/skipped)
Modules:    exams (GovernmentExam), staffing (DepartmentStaffing)
            exams schema: {examTitle, department, vacancies, status, applyUrl}
            staffing schema: {module, department, roleName, sanctionedPosts, workingStrength, vacantPosts}
```

### Engine 3: Pre-computed Module Insights
```
Location:   src/lib/insight-generator.ts
Trigger:    /api/cron/generate-insights every 2h (Vercel cron)
Scope:      30 modules × all active districts
Storage:    AIModuleInsight table with expiresAt TTL
Cache:      Redis (6h) → DB (check expiry) → generate fresh
Display:    AIInsightCard footer shows "Source-verified by Claude/Gemini AI"
            Uses actual aiProvider + aiModel from AIModuleInsight record

ZERO-CREDIT RULE: Public AI routes (/api/ai/insight, /api/ai/citizen-tips) are READ-ONLY.
  They serve ONLY from Redis cache — never call callAI() on public GET.
  Live AI generation is restricted to backend crons (CRON_SECRET) + admin (cookie).
```

### Engine 4: Fact Checker
```
Location:   src/lib/fact-checker.ts
Trigger:    Manual from admin dashboard (POST /api/admin/fact-check)
Checks:     25+ checks across 7 module categories
            leadership, budget, infrastructure, demographics, courts, news/alerts, all
Key rule:   Born-in-district rule for famous personalities (bornInDistrict must be true)
            Dr. Rajkumar was born in Erode TN — NOT Mandya (removed as example)
Storage:    FactCheckStatus table (totalItems, issuesFound, staleItems, duplicates)
Admin view: Dashboard tab → FactChecker component → history of last 20 runs
```

---

## DISTRICT HEALTH SCORE ALGORITHM

```
Location: src/lib/health-score.ts
Storage:  DistrictHealthScore table (pre-computed weekly)
Display:  Homepage district cards + District overview header

10 Categories with BASE weights:
  governance       15%
  education        12%
  health           12%
  infrastructure   12%
  waterSanitation  10%
  economy          10%
  safety           10%
  agriculture       8%
  citizenWelfare    6%
  digitalAccess     5%
  ─────────────────────
  TOTAL            100%

District-type aware weights (getAdjustedWeights):
  metro (pop>5M)         — boosts infrastructure+digitalAccess, reduces agriculture
  urban (pop>1M)         — uses base weights
  semi-urban (den>500)   — uses base weights
  rural (default)        — boosts agriculture+waterSanitation, reduces infra+digital

Precision:
  Category scores: 1 decimal (e.g. 72.4)
  Overall score:   2 decimal (e.g. 54.52)

Grades:
  A+ = >= 90  |  A = >= 80  |  B+ = >= 70  |  B = >= 60
  C+ = >= 50  |  C = >= 40  |  D  = >= 30  |  F = < 30

Current (2026-03-29): Mandya 54.52 (C+), Mysuru 49.38 (C), Bengaluru Urban 55.19 (C+)
Trigger recalculation: npx tsx scripts/calculate-health-scores.ts (with prod DATABASE_URL)
```

---

## FEATURE VOTING SYSTEM

```
Location:  src/app/[locale]/features/page.tsx
Models:    FeatureRequest + FeatureVote
Seeded:    23 feature requests via prisma/seed-features.ts

Fingerprint: SHA-256(IP + User-Agent).slice(0, 32)
Anti-double-vote: @@unique([featureId, fingerprint])
Vote transaction: atomic create + increment (prevents race conditions)

API routes:
  GET  /api/features            — list with vote counts
  POST /api/features/[id]/vote  — cast vote (idempotent via unique constraint)
```

---

## 30 MODULES (by category)

**DATA:** overview, map, leadership, water, industries, finance, crops, population, weather, police

**SERVICES:** schemes, citizen-corner, elections, transport, jjm, housing, power

**GOVERNANCE:** schools, farm, rti, file-rti, gram-panchayat, courts, health, exams

**COMMUNITY:** alerts, offices, responsibility, news, famous-personalities

**API SLUG CORRECTIONS (common mistakes):**
```
/api/data/leaders      (NOT /api/data/leadership)
/api/data/budget       (NOT /api/data/finance)
/api/data/exams        (dedicated route — not under [module])
```

---

## KEY FILES LIST

### Layouts & App Shell
```
src/app/layout.tsx                              — Root (fonts, providers)
src/app/globals.css                             — Tailwind v4 @theme tokens (design system)
src/app/[locale]/layout.tsx                     — Header + disclaimer banner
src/app/[locale]/[state]/[district]/layout.tsx  — Sidebar + MobileTabNav + FeedbackFloatingButton
src/app/[locale]/[state]/[district]/page.tsx    — District overview (ISR revalidate=300)
```

### Library Core
```
src/lib/ai-provider.ts       — callAI() and callAIJSON() — USE THESE, never direct API calls
src/lib/db.ts                — Prisma singleton (PrismaPg adapter)
src/lib/redis.ts             — @upstash/redis singleton
src/lib/cache.ts             — cacheGet, cacheSet, cacheKey, getModuleTTL
src/lib/encryption.ts        — AES-256-CBC encrypt()/decrypt()
src/lib/health-score.ts      — District health score algorithm
src/lib/insight-generator.ts — Pre-computed AI insights generator
src/lib/news-action-engine.ts — News → action classification + execution
src/lib/fact-checker.ts      — AI fact checker (25+ checks)
src/lib/constants/districts.ts — INDIA_STATES hierarchy (all 28 states + UTs)
```

### Components
```
src/components/common/AIInsightCard.tsx         — AI badge on module pages
src/components/common/FeedbackModal.tsx         — User feedback form
src/components/common/FeedbackFloatingButton.tsx — Floating feedback trigger
src/components/ui.tsx                           — EmptyBlock, ProgressBar, LastUpdatedBadge
```

### API Routes
```
src/app/api/data/[module]/route.ts              — 30-module data API (Redis cache)
src/app/api/admin/ai-settings/route.ts          — AI provider config GET/PUT
src/app/api/admin/fact-check/route.ts           — Fact checker POST/GET
src/app/api/admin/verify-data/route.ts          — AI data QA (graceful error)
src/app/api/cron/scrape-news/route.ts           — Daily news cron (6AM UTC)
src/app/api/cron/scrape-crops/route.ts          — Daily crop prices cron (3:30AM UTC = 9AM IST)
src/app/api/cron/generate-insights/route.ts     — Every-2h insights cron
src/app/api/cron/news-intelligence/route.ts     — Every-4h news classify + execute cron
src/app/api/admin/cleanup-news/route.ts         — Cleanup stale/dup articles + bad alerts
src/app/api/data/freshness/route.ts             — Traffic-light freshness monitor per module
src/app/api/payment/verify/route.ts             — Razorpay HMAC sig verification
src/app/api/admin/nav-counts/route.ts           — Sidebar unread badge counts (alerts/reviews/feedback)
src/app/api/admin/dashboard-summary/route.ts    — Dashboard roll-up (30s Redis cache)
src/app/api/admin/openrouter-usage/route.ts     — OpenRouter live credit tracking (5min cache)
src/app/api/admin/run-scraper/route.ts          — Manual per-district scraper trigger
src/app/api/admin/scraper-logs/route.ts         — GET last 50 logs + DELETE old (cookie-auth)
src/app/api/admin/finance-summary/route.ts      — Combined revenue + expenses + subs (5min cache)
src/app/api/admin/expenses/route.ts             — Expense GET/POST
src/app/api/admin/expenses/[id]/route.ts        — Expense PATCH/DELETE
src/app/api/admin/subscriptions/[id]/route.ts   — Subscription PATCH/DELETE (REST-style)
src/app/api/admin/manual-supporter/route.ts     — Add offline supporter + bust contributor cache
src/app/api/admin/supporters/[id]/route.ts      — Edit supporter (tier/district/msg/public)
prisma/seed-subscriptions.ts                    — Idempotent seed of 9 default services
```

### Admin components (April 2026)
```
src/components/admin/AdminSidebar.tsx            — Unified sidebar, 10 tabs grouped
src/components/admin/ModuleHelp.tsx              — ⓘ popover tooltip used across tabs
src/app/[locale]/admin/layout.tsx                — Auth gate + sidebar wrapper
src/app/[locale]/admin/actions.ts                — Extracted server actions (login/totp/logout)
src/app/[locale]/admin/AdminClient.tsx           — ?tab= routing for in-page sub-tabs
src/app/[locale]/admin/DashboardView.tsx         — Action Required, Health, Revenue, Activity feed
src/app/[locale]/admin/SystemHealth.tsx          — Run Now buttons + expandable error details
src/app/[locale]/admin/AlertsAndLogs.tsx         — Filters (level/source/date/district), CSV export
src/app/[locale]/admin/CostsTab.tsx              — OpenRouter real spend, per-model est. cost,
                                                   monthly/yearly totals, service renewal countdowns
src/app/[locale]/admin/ExpenditureTab.tsx        — Expense tracking, P&L view, CSV export (in-page tab)
src/app/[locale]/admin/TrafficTab.tsx            — Plausible traffic (in-page tab)
src/app/[locale]/admin/supporters/SupportersSection.tsx — Revenue+supporters client wrapper
src/app/[locale]/admin/supporters/RevenueSummary.tsx    — Revenue cards + monthly chart
src/app/[locale]/admin/supporters/ManualSupporterForm.tsx — Offline supporter modal
src/components/admin/SentryErrorsSection.tsx     — Unresolved Sentry issues (rendered in Alerts tab)
src/components/admin/PlatformReportCard.tsx     — AI weekly analysis card (rendered in Dashboard)
src/lib/sentry-api.ts                            — Sentry REST client (unresolved issues)
src/lib/plausible-api.ts                         — Plausible Stats API client
src/lib/platform-analysis.ts                     — AI weekly report generator
src/app/api/admin/sentry-errors/route.ts         — Sentry unresolved (5min Redis cache)
src/app/api/admin/traffic/route.ts               — Plausible traffic (3min Redis cache)
src/app/api/admin/platform-report/route.ts       — AI report GET + POST?confirm=true
src/app/api/cron/platform-report/route.ts        — Weekly cron (Sun 00:00 UTC)
src/lib/vault-session.ts                          — Vault session (Redis, 10-min TTL, cookie-bound)
src/lib/audit-log.ts                              — Audit logger (logAudit / logAuditAuto)
src/app/api/admin/vault/unlock/route.ts           — POST: TOTP → mint vault session cookie
src/app/api/admin/vault/session/route.ts          — GET/DELETE vault session status
src/app/api/admin/vault/route.ts                  — GET masked list + env reference / POST upsert
src/app/api/admin/vault/[id]/route.ts             — GET/PATCH/DELETE single key
src/app/api/admin/vault/[id]/reveal/route.ts      — POST reveal (rate-limited, audit-logged)
src/app/api/admin/users/route.ts                  — GET/POST admin users
src/app/api/admin/users/[id]/route.ts             — PATCH/DELETE admin user
src/app/api/admin/audit-log/route.ts              — GET paginated audit entries
src/app/[locale]/admin/VaultTab.tsx               — Vault tab (gate + key list + add form)
src/app/[locale]/admin/security/SessionInfoCard.tsx — Session info + team members + audit log
src/app/[locale]/admin/ContentEditorTab.tsx       — Content Editor (district → module → inline table)
src/app/[locale]/admin/UpdateLogTab.tsx           — Update Log viewer (filter + diff + CSV)
src/components/admin/AdminBot.tsx                 — Floating bot widget (pattern-matched queries)
src/lib/update-log.ts                             — logUpdate util (never throws)
src/app/api/admin/content/route.ts                — Content Editor module + row loader
src/app/api/admin/content/save/route.ts           — Apply updates/creates/deletes + cache bust
src/app/api/admin/update-log/route.ts             — Paginated update log viewer
src/app/api/admin/bot/route.ts                    — Bot GET history + POST handle message
src/app/api/admin/subscriptions/[id]/reveal/route.ts — Decrypt subscription login password
scripts/seed-vault-keys.ts                        — Seed existing env-var keys into the vault
scripts/fix-duplicate-subscriptions.ts            — One-shot dedup of Subscription rows
```

### Scraper
```
src/scraper/scheduler.ts      — node-cron scheduler (getActiveDistricts from DB)
src/scraper/types.ts          — JobContext (districtId, districtSlug, districtName, stateName)
src/scraper/jobs/weather.ts   — OWM weather (OWM_CITY_OVERRIDE for mismatched names)
src/scraper/jobs/crops.ts     — AGMARKNET crops (AGMARKNET_DISTRICT_OVERRIDE)
src/scraper/jobs/news.ts      — RSS news (URL dedup + date validation + title dedup, 3 queries/district)
```

### Database
```
prisma/schema.prisma           — 45+ models (single source of truth for DB)
prisma/seed.ts                 — Full Mandya seed (deleteMany at top, then insert)
prisma/seed-hierarchy.ts       — State→District→Taluk (upsert only, safe for production)
prisma/seed-features.ts        — 23 feature requests
prisma.config.ts               — Prisma 7 config (DATABASE_URL from env)
Dockerfile.scraper             — Railway container (npm install --legacy-peer-deps)
```

---

## PATTERNS TO ALWAYS FOLLOW

### Redis — Always use @upstash/redis on Vercel
```typescript
// CORRECT
import { redis } from '@/lib/redis';
await redis.get(key);
await redis.setex(key, ttl, value);

// WRONG (crashes serverless)
import Redis from 'ioredis';
```

### AI Calls — Always use callAI()
```typescript
// CORRECT
import { callAI, callAIJSON } from '@/lib/ai-provider';
const result = await callAI(prompt);
const { data, provider, model } = await callAIJSON<MyType>(prompt);

// WRONG — bypasses provider switching + fallback logic
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();
```

### Response Parsing — Always find text block
```typescript
// CORRECT
const textBlock = response.content.find(b => b.type === 'text');
const text = textBlock?.text ?? '';

// WRONG — breaks with extended thinking
const text = response.content[0].text;
```

### Budget Values — Always store Rupees, display Crores
```typescript
// Storage: raw Rupees (e.g., 500000000 = ₹50 Crore)
// Display: value / 1e7 → shows as "50 Cr"
const crores = (rupeesValue / 1e7).toFixed(2);
```

### Famous Personalities — bornInDistrict rule
```typescript
// Only add if actually born in that district
// Dr. Rajkumar: born Erode TN → removed from Mandya
// Always verify before seeding
```

### Leadership — ADD only, never delete
```typescript
// When updating leaders: upsert with unique key, never deleteMany first
// Historical records must be preserved
```

### Recharts — No type annotation on formatter
```tsx
// CORRECT
<Tooltip formatter={(v) => Number(v).toLocaleString()} />

// WRONG — TypeScript error
<Tooltip formatter={(v: number) => v.toLocaleString()} />
```

### Map components — FRAGILE, never modify casually
```
react-simple-maps viewBox: 800×900 portrait, scale=900, center=[82.5,23]
GeoJSON exterior rings: MUST be CW (clockwise) — d3-geo requirement
Zero-area rings: must be removed (area < 1e-10 → world-spanning fill bug)
NEVER change map without testing all 36 states render correctly in browser
```

### Deployment — git push only
```bash
git push origin main     # triggers auto-deploy via Vercel GitHub integration
# NEVER: npx vercel --prod (scope issues)
# Git email MUST be: jayanthmbj@gmail.com
```

### Watermarking — always preserve
```
Every new source file MUST have this header at top:
/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

The middleware (src/middleware.ts) adds X-Creator, X-Project-ID, X-License to every response.
NEVER remove or alter watermark headers — they are proof of authorship.
Project ID: FTP-JMB-2026-IN
```

### Security — rate limiting
```typescript
// For public API routes that could be abused:
import { rateLimit } from '@/lib/rate-limit';
const { success } = await rateLimit(`${req.ip}:data/${module}`, 60, 60);
if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
```

### Recalculate health scores (when needed)
```bash
DATABASE_URL=<neon-prod-url> npx tsx scripts/calculate-health-scores.ts
```

---

## DATABASE MODELS SUMMARY

### Core (4 models)
`State` → `District` → `Taluk` → `Village`

### Per-District Data (25+ models)
`Leader`, `InfraProject`, `BudgetEntry`, `BudgetAllocation`, `CropPrice`, `WeatherReading`,
`RainfallHistory`, `DamReading`, `CanalRelease`, `NewsItem`, `LocalAlert`, `CrimeStat`,
`PoliceStation`, `TrafficCollection`, `CourtStat`, `RtiStat`, `GramPanchayat`, `Scheme`,
`ServiceGuide`, `JJMStatus`, `HousingScheme`, `PowerOutage`, `SchoolResult`, `SoilHealth`,
`AgriAdvisory`, `ElectionResult`, `BusRoute`, `TrainSchedule`, `GovOffice`, `FamousPersonality`,
`PopulationHistory`, `SugarFactory`, `RtiTemplate`, `MarketData`

### AI & Intelligence (6 models)
`AIModuleInsight`, `AIInsight`, `ReviewQueue`, `NewsActionQueue`, `SharedAIInsight`, `FactCheckStatus`

### New (2 models)
`DistrictHealthScore` (10 categories, weights, grade, breakdown JSON),
`FeatureRequest` + `FeatureVote` (fingerprint anti-double-vote)

### Admin (4 models)
`AdminAuth` (2FA + backup codes, encrypted), `AdminAPIKey` (AES-256 encrypted keys),
`AIProviderSettings` (singleton: active provider + models), `ScraperLog`

### Payments & Sponsors (2 models)
`Contribution` (Razorpay order/payment IDs, paise),
`Supporter` (extended: razorpaySubscriptionId, subscriptionStatus, activatedAt, expiresAt,
  districtId FK→District, stateId FK→State, socialLink, socialPlatform, badgeType, badgeLevel,
  isRecurring, isPublic, message. Reverse relations: District.supporters[], State.supporters[])

### Other (5 models)
`Feedback`, `DistrictRequest`, `DataRefresh`, `NewsIntelligenceLog`, `MarketData`

**CRITICAL field notes:**
- `NewsItem.title` — NOT `.headline` (that was a bug, field is `title`)
- `BudgetEntry.allocated` — stored in RUPEES not Crores (display ÷ 1e7)
- `ElectionResult` — winner-per-constituency, has winnerName/winnerParty/winnerVotes
- `FamousPersonality.bornInDistrict` — MUST be true for district's page

---

## HOMEPAGE STRUCTURE

Unified scrollable layout — same sections on desktop and mobile.
Desktop: 2-col grid (60% map + 40% district cards), Mobile: stacked.

```
1. Header (Logo + nav + district selector)
2. MarketTicker (40px bar: Gold, Silver(/g), Petrol, Diesel, USD/INR, SENSEX, NIFTY, Crude — 5min market hours, 30min off-hours)
3. HomepageStats (animated counters: 10 districts — DB-sourced via getTotalActiveDistrictCount(), 29 modules, data points)
4. DrillDownMap + ActiveDistrictsCard (2-col on desktop, stacked on mobile)
   - Map: India states, click to drill into state
   - District cards: all 10 active districts with health grade, weather, dam, crop snippets (count DB-sourced)
5. LiveDataPreview (horizontally scrollable preview cards, links to active districts)
6. HowItWorks (3-column explainer)
7. DistrictRequestSection (vote to add new districts)
8. Support button
9. DisclaimerStrip (NDSAP + "Built by Jayanth M B")
```

---

## ADMIN PANEL CAPABILITIES

URL: `/en/admin`

```
Tab 1 — Dashboard:
  - Stats overview
  - FactChecker: runs AI verification on 7 modules, shows issues/stale/duplicates
  - DataVerifier: AI QA for any specific module (graceful error on AI fail)
  - StaleDataManager: preview + expire stale alerts, deduplicate news

Tab 2 — AI Settings:
  - 3 provider cards: OpusCode.pro / Official Anthropic / Google Gemini
  - Single-select "Activate" per provider
  - Model dropdown per provider
  - API key input (hidden, expandable)
  - Fallback toggle (auto-fall to Gemini if primary fails)
  - maxTokens + temperature advanced settings
  - "Test Connection" button

Tab 3 — Security:
  - 2FA status + setup (TOTP QR code via otpauth + qrcode)
  - Backup codes count (8 codes, AES-256 encrypted in DB)
  - Recovery email/phone (stored in AdminAuth, defaults from env vars)
  - Last login timestamp + failed attempts
  - "Logout All" button

Tab 4 — Review:
  - AI insight review queue (approve/reject generated insights)
  - Each item shows module, district, headline, confidence, AI provider

Tab 5 — Feedback:
  - All user feedback submissions
  - Status management (new/reviewed/resolved)
  - Admin note field per submission

Tab 6 — Supporters:
  - Summary: Active Subscriptions, Monthly Revenue, One-Time Total, Expiring This Week
  - Filters: Tier, Status, Sort (newest/oldest/amount/tenure)
  - Flat list view (full table) + Grouped view (State→District hierarchy)
  - CSV export button
  - SupportersTable.tsx client component with all interactivity
```

---

## DEPLOYMENT PROCESS

```bash
# Standard deploy (ALWAYS use this):
git add [specific files]
git commit -m "commit message"
git push origin main
# Vercel auto-detects push → builds → deploys

# Local dev:
cd "/Users/jayanth/Documents/For The People/forthepeople"
# Terminal 1:
npx prisma dev          # keep running (local DB proxy on port 51214)
# Terminal 2:
npm run dev             # Next.js dev server
# Open: http://localhost:3000/en/karnataka/mandya

# DB operations:
npx prisma db push                    # apply schema
npx prisma generate                   # regenerate client
npx tsx prisma/seed.ts                # seed Mandya data
npx tsx prisma/seed-hierarchy.ts      # seed State→District→Taluk (safe for prod)
```

---

## CONTRIBUTOR & SPONSOR SYSTEM

### 6 Tiers (src/lib/constants/razorpay-plans.ts)
```
☕ Chai           ₹50 one-time     accent #F97316
🏛️ District       ₹200/mo          accent #2563EB  featured  requiresDistrict
🇮🇳 State          ₹2,000/mo        accent #7C3AED  requiresState
🌟 Patron         ₹10,000/mo       accent #DC2626
👑 Founder        ₹50,000/mo       accent #D97706  platinum badge immediately
💝 Custom         ₹10+ one-time    accent #374151
```

### Razorpay Integration
```
Live keys on Vercel (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID)
4 subscription plans (RAZORPAY_PLAN_DISTRICT/STATE/PATRON/FOUNDER)
Webhook: forthepeople.in/api/webhooks/razorpay (6 events)
  payment.captured, payment.failed
  subscription.charged (extends expiry +30d, recalc badge)
  subscription.halted (→expired), subscription.cancelled, subscription.paused
```

### Badge Progression (src/lib/badge-level.ts)
```
Bronze  3+ months  |  Silver 6+ months  |  Gold 12+ months  |  Platinum 24+ months
Founders get platinum immediately regardless of tenure
```

### Key API Routes
```
POST /api/payment/create-subscription    — creates Razorpay subscription
POST /api/payment/verify-subscription    — verifies + creates Supporter record
GET  /api/data/contributors              — ?district=&state= | ?type=leaderboard | ?type=all | ?type=district-rankings
GET  /api/data/resolve-ids               — ?state=slug&district=slug → DB IDs
```

### Key Components
```
src/components/support/SupportCheckout.tsx         — Payment flow (one-time + subscription + auto-scroll from URL params)
src/components/common/DistrictSponsorBanner.tsx    — Gold banner on district pages (max 6, tier-colored borders)
src/components/common/PatronCard.tsx               — Premium card for founders (👑 gold gradient) and patrons (🌟)
src/components/common/BadgeExplainer.tsx            — Collapsible tier + badge explanation
src/components/support/SupporterQuotes.tsx          — Shows supporter messages on support page
src/app/[locale]/contributors/                     — Global leaderboard + district rankings + filters
src/app/[locale]/[state]/[district]/contributors/  — District-level contributor page
```

### Social Link Detection (src/lib/social-detect.ts)
```
detectAndCleanSocialLink(rawInput) handles:
  @handle → Instagram, bare usernames, reel/post URLs, LinkedIn /in/ and /company/,
  Twitter/X.com, GitHub, generic websites. Cleans to canonical profile URL.
```

### Sponsor Flow
```
District pages: "❤️ Sponsor Mandya — ₹200/mo →" (pink gradient button)
  + "or: Sponsor Karnataka — ₹2,000/mo →" + "or: Sponsor India — ₹10,000/mo →"
  All link to /support?tier=district&state=karnataka&district=mandya (auto-fills + auto-scrolls)
Locked districts: same CTA with "Sponsor this district" → LockedDistrictPreview
```

---

## ALL STATES + LOCKED DISTRICTS

### Browsable Preview Mode
```
All 36 states navigable from header dropdown
All 152 districts in DB — locked ones show LockedDistrictPreview:
  - District header (name, population, area, literacy, taluks from districts.ts)
  - "29 dashboards waiting to be unlocked" CTA
  - Sponsor CTA with URL params
  - Sponsors waiting section (if any)
  - 29 locked module cards (lock icon + module icon + label)
When district.active flips to true → preview disappears, full dashboard shows. Zero code changes.
```

### State District Maps (33 states)
```
Source: DataMeet Census 2011 district boundaries (CC-BY 4.0)
Files: public/geo/{state-slug}-districts.json (33 files, Karnataka separate)
Component: src/components/map/GenericStateMap.tsx
  - Auto center/scale from GeoJSON bounds
  - Active districts: blue fill, clickable
  - Locked districts: gray fill, clickable → preview
  - Falls back if GeoJSON doesn't load
StateMapSection.tsx: KarnatakaMap for Karnataka, GenericStateMap for others
```

### Scripts
```
scripts/sync-all-districts.ts          — Syncs districts.ts → DB (upsert, never downgrades active)
scripts/setup-razorpay-plans.ts        — Creates subscription plans on Razorpay
scripts/setup-state-maps.ts            — Processes GeoJSON into per-state files
scripts/seed-test-contributors.ts      — Seeds 20 test contributors (dev only)
scripts/cleanup-test-contributors.ts   — Removes [TEST] records before deploy
```

---

## SUPPORT PAGE STRUCTURE (src/app/support/page.tsx)

```
1. Hero (₹1.50/district/day at full scale + cost disclaimer)
2. International disclaimer at TOP (@forthepeople_in Instagram)
3. 6 tier cards (from TIER_CONFIG, "MOST POPULAR" on District Champion)
4. Contributor wall (scrolling subscribers + one-time list)
5. Supporter quotes (from DB messages)
6. Personal bio (Jayanth M B)
7. Scale section + "Early supporters lock in current rates"
8. Cost at Scale (3 cards)
9. Where Your Money Goes (cost breakdown bars)
10. Other Ways to Help (GitHub, share, contribute, feedback)
11. Bottom CTA + small international reminder
```

---

## CRITICAL WARNINGS

1. **Map is FRAGILE** — react-simple-maps, portrait 800×900, CW GeoJSON winding. Never modify without testing all 36 states.

2. **ioredis vs @upstash/redis** — Never use ioredis in Next.js API routes (Vercel). Only in Railway scraper.

3. **AI response parsing** — Always `content.find(b => b.type === 'text')`. Never `content[0]`.

4. **Budget values** — Stored as Rupees. Display divides by 1e7. Never store as Crores.

5. **Born-in-district rule** — FamousPersonality must have bornInDistrict=true for that district's page.

6. **Leaders are ADD-only** — Never deleteMany leaders before re-seeding. Use upsert.

7. **Deploy via git push** — Never `npx vercel --prod`. Uses wrong scope.

8. **git email** — Must be `jayanthmbj@gmail.com`. Vercel rejects other authors.

9. **ANTHROPIC_BASE_URL env priority** — Env var ALWAYS beats DB setting. Never change the priority order.

10. **npm install --legacy-peer-deps** in Dockerfile — `npm ci` fails due to peer dep conflicts.

11. **recharts Tooltip formatter** — Use `(v)` with `Number(v)` cast. Never `(v: number)`.

12. **Header nav overflow** — Must be `overflow:visible`. Never set to `hidden` (clips dropdowns).

13. **API slugs** — Use `leaders` not `leadership`, `budget` not `finance`.

14. **NewsItem field** — `title` not `headline`. (was a historical bug, now fixed)

15. **maxTokens for extended thinking** — Must be >= 2048.

16. **CRON_SECRET** — Read from `Authorization: Bearer` header ONLY. Never from URL query params (they appear in server logs). Fixed in audit 2026-03-29.

17. **Unbounded queries** — Always add `take: N` to findMany() on high-cardinality tables. schools: take:200, elections: take:100.

18. **2FA recovery token** — Must use `crypto.timingSafeEqual()` for constant-time comparison. Never string equality `===` on security tokens.

19. **LIVE_MODULES list** — Keep in sync between `src/lib/cache.ts` (server TTLs) and `src/hooks/useDistrictData.ts` (client stale times). Includes: crops, weather, water, dam, alerts, news, power.

20. **State-aware labels** — Never hardcode "Taluk" in UI. Use `getStateConfig(stateSlug).subDistrictUnit` / `.subDistrictUnitPlural`. Different states use Mandal (Telangana/AP), Tehsil (Delhi), Block (West Bengal), Taluka (Maharashtra), etc.

21. **Urban district handling** — For 100% urban districts: hide villages column (`showVillages: false`), show Municipal Governance instead of Gram Panchayat (`gramPanchayatApplicable: false`), mark JJM as N/A (`jjmApplicable: false`), adapt My Responsibility and Citizen Corner text. Check `getStateConfig(stateSlug)` fields.

22. **Health schemes are state-specific** — Never show one state's health scheme on another state's page. Use `STATE_HEALTH_SCHEMES` mapping in `health/page.tsx`. National schemes (PM-JAY, RBSK) show for all states.

23. **Election data source text** — The "most recent election" text in the data source banner must match the state. Uses `getStateConfig(stateSlug).lastElectionYear` / `.lastElectionType`. Don't copy Karnataka text to other states.

24. **Sub-district population** — Always seed via `scripts/seed-subdistrict-populations.ts` when adding new districts. The `seed-hierarchy.ts` upsert uses `update: {}` so won't fix null populations on existing records.

25. **District hero illustrations** — Each district has an inline SVG in `DistrictHeroIllustration.tsx` with a unique color palette. When adding a new district, add its SVG (landmark on right side, under 50 lines) and palette to the component.

26. **District badges** — Stored in `districts.ts` config as `badges` array, max 5 per district. Badge colors auto-avoid the district's palette family via `AVOID_MAP` in `DistrictBadges.tsx`. Web search to verify each claim before adding.

27. **Sponsor UI** — Uses subtle warm styling (#f5f0eb background) in a separated bar below the hero. NOT hot pink/red gradient. Keep consistent with the site's warm aesthetic.

28. **UP uses "Tehsil"** — `state-config.ts` has `uttar-pradesh` entry with `subDistrictUnit: "Tehsil"`. Never hardcode Taluk/Mandal/Tehsil in UI — always use `getStateConfig(stateSlug).subDistrictUnit`.

29. **Mobile-first responsive** — All new components must work at 375px. Use base styles for mobile, `md:` prefix for desktop. Min tap target 44px. Tables must use `data-table-scroll` class for horizontal scroll. Stats use `stats-strip` class for 2x2 mobile layout.

30. **AI insight timing** — Never hardcode "Updated every X hours". `AIInsightCard` uses `formatInsightTiming()` which shows human-readable "X days ago" + "Next refresh in Xh" from `generatedAt`/`expiresAt` fields. The insight API returns both fields.

31. **Razorpay subscriptions use DYNAMIC plans** — `create-subscription` POSTs a fresh Razorpay plan with the user's exact `amount` (from +/- buttons) before creating the subscription. Never reuse the static `RAZORPAY_PLANS` presets — they don't match what the user chose. The `amount` must be passed from `SupportCheckout` through create-subscription → verify-subscription → Supporter.amount. If you see a mismatch between displayed ₹ and charged ₹, check this flow.

32. **Public API nulls subscription amounts** — `toPublic()` in `/api/data/contributors/route.ts` returns `amount: null` for `isRecurring=true` rows. Only one-time contributions expose their amount. UI cards must gate `₹{amount}` on `!c.isRecurring && c.amount`. Never rely on `amount` for sorting subscribers — DB does `orderBy: [{ amount: "desc" }, { activatedAt: "asc" }]` so sort is correct before nulling.

33. **Contributor labels are DYNAMIC** — Never show raw `tier` string or the static `TIER_CONFIG[tier].name`. Use `getContributorLabel(tier, districtName, stateName)` from `src/lib/contributor-label.ts` so district-tier contributors render as "Mandya Champion" and state-tier as "Karnataka Champion". The API's SELECT_FIELDS includes `sponsoredDistrict` + `sponsoredState` relations so the client gets the names.

34. **Contributor expiry filter** — Every contributor query MUST include the `notExpired()` predicate: `OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]`. Active subscriptions have `expiresAt: null` (Razorpay manages renewals); one-time rows get 30/60/90-day expiries based on amount via `calculateOneTimeExpiry()`. Never write `expiresAt: new Date(... +30 days)` on active subscriptions — that will hide them after 30 days.

35. **Contributor DB is shared with production** — Local `.env.local` points to the same Neon Postgres that production reads. Running `scripts/seed-bulk-dummy-contributors.ts` writes `[TEST]` rows to the LIVE DB — visible on forthepeople.in within the 2-minute cache TTL. For local visual testing, set `FTP_MOCK_CONTRIBUTORS=1` in `.env.local` (requires `NODE_ENV=development`) to use the in-memory mock pool in `src/lib/mock-contributors.ts`. Zero DB writes. Never run the seed script without also running `cleanup-test-contributors.ts` immediately after.

36. **Contributor cache keys** — When invalidating contributor caches, always include: `ftp:contributors:{v1,all,leaderboard,district-rankings,top-tier,growth-trend}` AND any `ftp:contributors:district:<slug>:<slug>` / `ftp:contributors:state-page:<slug>` keys. Use `redis.scan` with `match: "ftp:contributors:*"` after bulk DB writes. Incomplete invalidation causes stale rows to linger for up to 2 minutes.

37. **Pagination contract** — All contributor endpoints accept `?limit=` and `?offset=`, return `{ contributors: [...], total: N }` (or `{ subscribers, oneTime, subscribersTotal, oneTimeTotal }` for the no-params endpoint). Default limits: top-tier=20, district=120, state-page=60, leaderboard=10, all=50. Hard ceiling `HARD_MAX = 500` to prevent megabyte responses. UI should page with "Load more" / "Show N more" rather than fetching everything.

38. **Scrollable rows need render caps** — Horizontal scroll containers with >200 cards kill the browser even without display. `ContributorsClient`'s `ScrollableRow` slices to `INITIAL_VISIBLE=20` + "Show more" expand (+40 each click) up to `MAX_RENDERED=200`. For tickers (DistrictSponsorBanner, StateSponsorSection), cap at 15 chips with "+X more" overflow chip that links to the full contributors page.

39. **Recharts Tooltip formatter signatures** — Recharts v3 type defs are strict. `formatter` param is `ValueType | undefined`; always cast via `typeof v === "number" ? v : Number(v)`. `labelFormatter` receives `ReactNode`; coerce with `String(l ?? "")`. See `ContributorGrowthChart.tsx` for the working pattern.

40. **District overview card order** — Shared order across ALL districts (`OverviewClient.tsx`): Hero → Combined Supporters + Sponsor CTA card (cool slate `#F8FAFC`/`#E2E8F0`) → AI Analysis (warm orange) → Health Score → Alerts → rest. The sponsor card MUST be visually distinct from the AI card — same warm palette makes them blur together. Old separate amber "SPONSORED BY" banner + grey sponsor bar are gone; everything lives in one `DistrictSponsorBanner`.

41. **Per-line auto-scroll with overflow detection** — For tickers with variable content, don't animate unconditionally. Each row measures its own content width via `ResizeObserver` + `scrollWidth / 2` (post-duplication) vs `clientWidth + 50` slack. Only rows that overflow animate. Slower speeds for more prominent tiers (India 120s > State 90s > District 60s). `onMouseEnter`/`onMouseLeave` inline handlers toggle `animationPlayState` per-row so hovering one line doesn't pause the others. Always respect `prefers-reduced-motion`.

42. **Support page is OUTSIDE the QueryClientProvider** — `src/app/support/page.tsx` sits outside `[locale]/layout.tsx` where `<QueryProvider>` is mounted. Client components rendered there can't use `useQuery` safely. Use plain `useEffect + fetch + useState` (see `ContributorCountBanner.tsx`). Only `<ContributorWallClient>` works because it uses `next/dynamic({ ssr: false })` and reaches a provider via some other path — don't rely on this for new components.

43. **Never hardcode live-district counts in UI copy** — Use `getTotalActiveDistrictCount()` / `getActiveStateCount()` from `src/lib/constants/districts.ts`. Formulas like "N × 29 dashboards" for data-point totals should compute dynamically too (see `GlobalContributorsClient.tsx` WHY card). The numbers change as new districts go live, and hardcoding them creates silent drift between copy and reality.

44. **Growth chart launch floor** — The contributors growth query filters `createdAt >= 2026-04-01` (project launch). Any older rows (from test migrations, seed scripts, or bulk imports) would corrupt the timeline. `ContributorGrowthChart.tsx` shows a stat card when fewer than 2 months of data exist and auto-promotes to the Recharts `AreaChart` once the second month arrives — no chart with one data point.

---

## POPULATION MODULE v2 — DATA ARCHITECTURE

### Data sources (tiered by authority + update cadence)

```
Census of India (ORGI)         Decennial. 2011 canonical; 2027 fieldwork
                                 Phase I Apr-Sep 2026, Phase II reference
                                 date 1 Mar 2027.
NFHS-5 (IIPS Mumbai)           Quinquennial. 2019-21 data PENDING in v1 —
                                 rchiips.org reorganized April 2026, IIPS's
                                 new portal (nfhsiips.in) requires guest
                                 login. Placeholder rows in DB for 3 active
                                 districts. Phase 2 via Harvard Dataverse
                                 (doi:10.7910/DVN/42WNZF, CC-BY 4.0).
NITI MPI 2023 Progress Review  Periodic. Latest issued July 2023. 12
                                 indicators, 707 districts. District H+A+MPI
                                 for both 2019-21 and 2015-16 — trend
                                 analysis. Full PDF (22 MB, 410 pp) in
                                 scripts/data-pdfs/ (gitignored).
SRS (ORGI)                     Annual. State-level only (not district).
PLFS (MoSPI)                   Quarterly + annual. State-level only.
Karnataka DES + BBMP           Ad-hoc. Karnataka Econ Survey annual.
```

### Update cadence enforced in code

```
Census data           Manual reseed on new Census release. No scheduled check.
NFHS data             Manual reseed on NFHS-6 release (~2027).
NITI MPI              Manual reseed on new Progress Review. Next expected 2026-27.
SRS / CRS             Optional supplement — state-level only.
PLFS                  Optional supplement — state-level only.
Demographic news      Piggybacks existing 10-min news pipeline. Category
                         filter: "demographics". No new cron.
AI insight card       Piggybacks existing 2-hour insight cron. No new AI calls.
```

### Runtime cost impact

```
Vercel:         0 new cron jobs
Neon storage:   +98 rows today (~200 KB with JSONB), +2,500 rows at 780-district scale
Upstash:        0 new Redis keys beyond existing insight cache
OpenRouter:     0 new AI calls
Anthropic API:  0 new AI calls
```

### Schema decisions

```
PopulationHistory     KEPT intact. Backward-compatible. Totals by year.
DemographicProfile    NEW. Canonical per-(district, year, dataset) profile.
                         JSONB for all multi-dimensional breakdowns — avoids
                         column explosion and schema churn when new breakdown
                         keys appear (e.g., a new religion category).
DemographicUpdate     NEW. Per-district update log. Isolated per district.
```

### Frontend

```
Chart library         Recharts 3.8 (already installed).
Map library           react-simple-maps 3.0 (already installed).
Categorical palette   Okabe-Ito (8-color colorblind-safe) for religion, sex.
Sequential palette    Viridis for education, ranking.
Caste palette         Neutral grays only. No saturated colour on any caste
                         category (legal + respectful framing).
Ordering              Alphabetical for religion, caste, language. Never
                         "majority/minority/dominant" in UI copy.
```

### Known gaps / Phase 2 backlog

- 5-year age bands for Bengaluru Urban (Census 2011 Table C-13 not yet extracted)
- NFHS-5 district indicators (3 active districts have placeholder rows only)
- State-specific statistical handbooks beyond Karnataka DES
- Per-ward BBMP demographic data (boundary vintage work pending; BBMP restructured
  from 198 wards in 2010 → 243 (draft 2022) → 225 (notified 2023) → GBA era 2024-25)

### Admin audit

/en/admin/population — 31 × 14 completeness grid. Columns: Active, Census 2011,
NFHS-5 (data/placeholder/none), NITI MPI, Religion, Caste, Employment, Education,
Migration, Disability, Language, HH Amenities, Marital, Economic Class.
Click a row to inspect raw JSON. CSV export.
