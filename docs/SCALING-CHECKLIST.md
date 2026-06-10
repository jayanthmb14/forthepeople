# ForThePeople.in — Scaling Checklist
# How to Add New Districts and States
#
# Generated: 2026-03-29 (last updated 2026-04-23 for Pune #10)
# Status: 10 live (Karnataka: Mandya ✅ | Mysuru ✅ | Bengaluru Urban ✅ | Delhi: New Delhi ✅ | Maharashtra: Mumbai ✅ + Pune ✅ | West Bengal: Kolkata ✅ | Tamil Nadu: Chennai ✅ | Telangana: Hyderabad ✅ | Uttar Pradesh: Lucknow ✅)
# ─────────────────────────────────────────────────────────────────────

## 2026-06-11 — Public POST endpoint rate limits (Session 4 audit fix)

All public POST endpoints now use the Upstash-backed `rateLimit()` helper
(`src/lib/rate-limit.ts`), IP-hashed via `sha256(ip + VOTE_IP_SALT)`. These limits
are also a load-shedding control — keep them in mind when load-testing / under a
viral spike:

| Endpoint | Limit (per IP) |
|----------|----------------|
| `/api/district-request` (votes) | 120 / min |
| `/api/suggestions` | 3 / hour |
| `/api/feedback` | 10 / hour |
| `/api/tenders/alerts/subscribe` | 5 / hour |
| admin login (`actions.ts`) | 5 / 15 min |

- The old in-memory `Map` limiters (suggestions, admin login) were a no-op on
  Vercel serverless (reset per invocation) — now genuinely enforced via Redis.
- `rateLimit()` **fails open** (allows the request) if Upstash is unreachable, so a
  Redis outage degrades to "no limit", not "deny all". Watch Upstash availability
  under load; a hard outage removes abuse protection until it recovers.
- k6 load tests will hit these limits — vary the source IP (or raise limits
  temporarily on a staging deploy) so the limiter doesn't mask throughput numbers.

---

## 2026-04-23 — Pune launch traffic notes

- Pune population 94.3 lakh (3rd-largest in Maharashtra, after Mumbai Suburban
  and Mumbai City). Likely traffic-heavy district once Instagram launch
  campaign runs.
- **ACTION:** run k6 load test before the Instagram launch push (not before
  Pune go-live — initial go-live absorbs organic Pune discovery; Instagram
  spike is the forcing function for load testing).
- SSR payload add-on from Pune: ~2 MB across 13 data-bound routes (41 Leader
  + 13 InfraProject + 8 School + 6 Scheme + 5 Budget rows + 14 Taluk). Well
  within Vercel response-budget.
- Scraper increment: weather + crops now run for Pune. No new jobs. Approximate
  added cron overhead: ~10–15 seconds per cycle.
- Observe first 24h post-push: Sentry for new Pune-route errors, Plausible
  for organic-vs-Instagram traffic split. Threshold for Neon Scale tier
  upgrade: sustained >50 RPS for 2+ hours.

---

## CURRENT STATE (Verified 2026-03-29)

| Feature | Status |
|---------|--------|
| DB hierarchy State→District→Taluk | Working |
| Active districts from DB (all APIs) | Working |
| Admin district dropdowns from DB | Working |
| Scraper runs for all active districts | Working |
| Homepage preview links dynamic | Working |
| Fact-check / verify-data dynamic | Working |
| AI analyzer multi-district | Working |
| Health score pre-computed all districts | Working |
| Feature voting | Working |
| Seed scripts (full + hierarchy-only) | Working |

---

## PART 1: ADDING A NEW DISTRICT

### Overview
After Step 5 (setting `active: true`), the following work automatically with NO code changes:
- All 29 module API routes (`/api/data/[module]?district=slug`)
- Scraper jobs (query active districts from DB every run)
- Admin dropdowns in FactChecker + VerifySection
- Homepage preview cards and stats
- Sitemap generation (includes all `active: true` districts)
- Health score calculation (next weekly cron run)
- AI insight generation (next 2h cron run)
- News intelligence pipeline (next hourly run)
- Feature voting page (no district-specific content)

---

### Step 1: Add to Hierarchy Seeder

Edit `prisma/seed-hierarchy.ts` and add the new district (and taluks if known):

```typescript
// prisma/seed-hierarchy.ts (safe for production — upsert only, no deletes)

// 1. Upsert the state (if new state)
const newState = await prisma.state.upsert({
  where: { slug: 'tamil-nadu' },
  update: {},
  create: {
    name: 'Tamil Nadu',
    nameLocal: 'தமிழ் நாடு',
    slug: 'tamil-nadu',
    active: true,
    capital: 'Chennai',
  },
});

// 2. Upsert the district
const newDistrict = await prisma.district.upsert({
  where: { stateId_slug: { stateId: newState.id, slug: 'coimbatore' } },
  update: {},
  create: {
    stateId: newState.id,
    name: 'Coimbatore',
    nameLocal: 'கோவை',
    slug: 'coimbatore',
    tagline: 'Manchester of South India',
    active: false,  // Set true only when ready
    population: 3458045,
    area: 4723,
    talukCount: 12,
    villageCount: 202,
    literacy: 83.86,
    sexRatio: 1000,
    density: 732,
    avgRainfall: 693,
  },
});

// 3. Upsert taluks
const taluks = [
  { name: 'Coimbatore North', nameLocal: 'கோவை வடக்கு', slug: 'coimbatore-north' },
  { name: 'Coimbatore South', nameLocal: 'கோவை தெற்கு', slug: 'coimbatore-south' },
  // ... add all taluks
];

for (const taluk of taluks) {
  await prisma.taluk.upsert({
    where: { districtId_slug: { districtId: newDistrict.id, slug: taluk.slug } },
    update: {},
    create: { ...taluk, districtId: newDistrict.id },
  });
}
```

Run against production Neon DB:
```bash
# From project root
npx tsx prisma/seed-hierarchy.ts
```

---

### Step 2: Add to Static Constants

Edit `src/lib/constants/districts.ts` — add the district to `INDIA_STATES`:

```typescript
// src/lib/constants/districts.ts
export const INDIA_STATES = [
  {
    name: 'Karnataka',
    slug: 'karnataka',
    districts: [
      { name: 'Mandya', slug: 'mandya', active: true },
      { name: 'Mysuru', slug: 'mysuru', active: true },
      { name: 'Bengaluru Urban', slug: 'bengaluru-urban', active: true },
      // Add new district here:
      { name: 'New District', slug: 'new-district', active: false },
    ],
  },
  // ... other states
];
```

This is used for:
- Sitemap generation (only `active: true` districts included)
- Compare page district selectors
- Static routing validation

---

### Step 3: Handle API Name Overrides (if needed)

#### OpenWeatherMap city name override
If the district name doesn't match what OpenWeatherMap calls the city:

```typescript
// src/scraper/jobs/weather.ts
const OWM_CITY_OVERRIDE: Record<string, string> = {
  'bengaluru-urban': 'Bangalore',  // OWM uses "Bangalore" not "Bengaluru Urban"
  'new-district-slug': 'Exact OWM City Name',  // Add here if needed
};
```

To find the correct OWM name:
```
curl "https://api.openweathermap.org/data/2.5/weather?q=CITY_NAME&appid=YOUR_KEY"
```

#### AGMARKNET district name override
If the district name differs from what AGMARKNET uses for crop price data:

```typescript
// src/scraper/jobs/crops.ts
const AGMARKNET_DISTRICT_OVERRIDE: Record<string, string> = {
  'new-district-slug': 'AGMARKNET District Name',  // Check data.gov.in API
};
```

**Long-term plan:** Add `owmCityName` and `agmarknetName` fields to the `District` model
to eliminate these override dictionaries (tracked in Future Work below).

---

### Step 4: Seed Initial Data

Create a seed file for the new district's core data:

```typescript
// prisma/seed-newdistrict.ts
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const district = await prisma.district.findUniqueOrThrow({
    where: { slug: 'new-district-slug' },
  });

  // Seed leadership (10-tier hierarchy)
  await prisma.leader.createMany({
    data: [
      { districtId: district.id, tier: 1, name: 'MP Name', role: 'Member of Parliament',
        party: 'INC', constituency: 'Constituency Name', since: '2024' },
      // ... more leaders (use upsert if running multiple times)
    ],
  });

  // Seed budget (stored in Rupees, NOT Crores)
  await prisma.budgetEntry.createMany({
    data: [
      { districtId: district.id, fiscalYear: '2024-25', sector: 'Education',
        allocated: 500000000, released: 450000000, spent: 420000000 },
        // ₹50 Crore = 500000000 Rupees
    ],
  });

  // Seed demographics
  await prisma.populationHistory.create({
    data: { districtId: district.id, year: 2011, total: 1000000,
      rural: 700000, urban: 300000, literacy: 75.5, sexRatio: 985, density: 300 },
  });

  // ... seed more models as needed
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

```bash
npx tsx prisma/seed-newdistrict.ts
```

---

### Step 5: Activate the District

```bash
# Using Prisma Studio
npx prisma studio
# Navigate to District table → find your district → set active = true

# OR directly in Neon console / psql:
# UPDATE "District" SET active = true WHERE slug = 'new-district-slug';

# OR via a small script:
# npx tsx -e "
#   import { PrismaClient } from '@/generated/prisma';
#   const p = new PrismaClient();
#   p.district.update({ where: { slug: 'new-district' }, data: { active: true } })
#    .then(() => p.\$disconnect());
# "
```

---

### Step 6: Seed Feature-Level Data (Optional)

For district-specific content that module pages might display as empty states otherwise:

```bash
# If district has famous personalities:
# Add FamousPersonality records (MUST have bornInDistrict: true)

# If district has special industries:
# Add SugarFactory or LocalIndustry records

# If district has notable infrastructure:
# Add InfraProject records (5+ recommended for overview page)
```

---

### What Automatically Happens After Activation

Once `active: true` is set in DB:

| System | What Happens | When |
|--------|-------------|------|
| API routes | District data served for all 29 modules | Immediately |
| Scraper (weather) | OWM weather pulled every 5 min | Next scraper cycle |
| Scraper (crops) | AGMARKNET prices pulled every 15 min | Next cycle |
| Scraper (news) | RSS news pulled every 1h | Next cycle |
| AI insights | Pre-computed insights generated | Next 2h cron |
| Health score | Score calculated | Next weekly cron |
| Homepage | District card appears | After ISR revalidation |
| Sitemap | URL included | After next build/ISR |
| Admin tools | Appears in district dropdowns | Immediately |

---

## PART 2: ADDING A NEW STATE

### Steps

1. **Add hierarchy to seed-hierarchy.ts:**
   ```typescript
   // Add State → Districts → Taluks (same pattern as Part 1)
   // Run: npx tsx prisma/seed-hierarchy.ts
   ```

2. **Add to static constants:**
   ```typescript
   // src/lib/constants/districts.ts — add to INDIA_STATES array
   {
     name: 'Tamil Nadu',
     slug: 'tamil-nadu',
     districts: [
       { name: 'Coimbatore', slug: 'coimbatore', active: false },
       // ...
     ],
   }
   ```

3. **Add regional font (if different script):**
   ```css
   /* src/app/globals.css — add @import for new language */
   /* Noto Sans family covers all Indian scripts:
      Noto Sans Tamil, Noto Sans Telugu, Noto Sans Malayalam,
      Noto Sans Gujarati, Noto Sans Devanagari, etc. */
   @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600&display=swap');
   ```

4. **Handle name overrides:**
   - Add OWM_CITY_OVERRIDE entries for any mismatched city names
   - Add AGMARKNET_DISTRICT_OVERRIDE entries for any mismatched district names

5. **No other code changes needed** — all APIs, scrapers, admin are DB-driven

---

## PART 3: AVAILABLE SEED SCRIPTS

```bash
# Full Mandya pilot seed (includes deleteMany cleanup at top)
npx tsx prisma/seed.ts

# Hierarchy-only seeder (upsert only, safe for production Neon DB, NO deletes)
npx tsx prisma/seed-hierarchy.ts

# Feature requests (23 feature requests for feature voting page)
npx tsx prisma/seed-features.ts

# Calculate health scores (if running manually instead of waiting for cron)
# npx tsx scripts/calculate-health-scores.ts  [if this script exists]

# Classify news with AI (if running manually)
# npx tsx scripts/classify-news.ts  [if this script exists]
```

---

## PART 4: FUTURE WORK (Not Yet Done)

### Schema Enhancements (Requires Migration)
- [ ] Add `owmCityName: String?` field to District model
  - Currently: handled by `OWM_CITY_OVERRIDE` dict in weather.ts
  - Benefit: no code changes when adding new districts with different OWM names
  - Migration: safe additive column, nullable

- [ ] Add `agmarknetName: String?` field to District model
  - Currently: handled by `AGMARKNET_DISTRICT_OVERRIDE` dict in crops.ts
  - Migration: safe additive column, nullable

### Admin UX
- [ ] Full State → District cascading dropdown in admin panel
  - Currently: flat list of all active districts (fine for 3, needs grouping at 10+)
  - Component: `FactChecker.tsx` + `VerifySection.tsx`

- [ ] Bulk district activation UI (currently requires direct DB edit)

### Taluk-Level Pages
- [ ] `GET /api/data/taluks?district=mandya` endpoint
  - Query: `prisma.taluk.findMany({ where: { district: { slug } } })`

- [ ] TalukSelector component on district overview/layout
  - Impact: additive change, does not break existing pages

### Homepage
- [ ] "Select your district" modal on first visit → store in localStorage
  - Currently: shows first active district's preview

### Responsibility Page
- [ ] Make responsibility page dynamic using `[district]` params + DB content
  - Currently: Mandya-specific content (intentional for pilot)

### Industries Page
- [ ] Store district industry profiles in DB as structured data
  - Currently: has Mandya/Mysuru/Bengaluru special content blocks (intentional)

### Root Structured Data
- [ ] `app/layout.tsx` has hardcoded "Mandya" and "Karnataka" in JSON-LD
  - Low risk: root JSON-LD is site-level description
  - Future: dynamic based on active pilot district

### Cron Endpoints for New Scrapers
- [ ] weather, dams, power, alerts scrapers only run via Railway node-cron (not Vercel crons)
  - Current: fine for 3 districts
  - At scale: add Vercel cron routes for each scraper job to ensure reliable execution
  - Pattern: `/api/cron/scrape-[job]` with `Authorization: Bearer CRON_SECRET` header

### Query Limit Baseline (set as per audit 2026-03-29)
- [x] schools: take: 200 (prevents unbounded results)
- [x] elections: take: 100 (prevents unbounded results)
- [ ] Review all findMany() calls on high-cardinality tables before each new district batch
      Add take: N to any query that returns per-district rows without a limit

---

## PART 5: DATA QUALITY RULES

### News Pipeline Quality Gates
- [x] **Date validation** (`isArticleFresh`): reject articles >3 days old, future-dated, or year < current-1
  - Rationale: Google News RSS returns by relevance not recency; old articles silently reappear
- [x] **Title deduplication** (`isTitleDuplicate`): normalize → first 5 significant words (len>3) → key
  - Two layers: in-memory Set per scrape run + DB lookup (last 7 days, case-insensitive)
  - Rationale: Google News generates different redirect URLs for the same article
- [x] **AI date context**: `classifyArticleWithAI` receives `publishedAt`, injects ageDays into prompt
  - CRITICAL DATE RULE enforced: events >2 days old → module=news, confidence ≤ 0.4, no alerts

### Admin Cleanup Endpoint
- `POST /api/admin/cleanup-news` (x-admin-password header) performs:
  1. Delete NewsItems older than 7 days
  2. Delete future-dated NewsItems (RSS parse errors)
  3. Delete duplicate articles by title prefix (keeps oldest per district+prefix)
  4. Delete auto-generated LocalAlerts older than 7 days
  5. Clear NewsActionQueue (pending + skipped items)
  6. Delete stale AIInsight records (module=alerts or createdAt >7 days)
- Run before `generate-insights` whenever data quality seems degraded

### Data Freshness Monitoring
- `GET /api/data/freshness?district=<slug>` returns traffic-light status per module:
  - green = within expected interval, amber = up to 3×, red = overdue
  - Expected intervals: weather 10min | dam 60min | news/alerts/insights 120min | crops 1440min
- Health score: categories → 1 decimal precision, overall → 2 decimal
- Health score: district-type aware weights (metro/urban/rural) via `getAdjustedWeights()`

---

## PART 6: VERIFIED WORKING (as of 2026-03-29)

### Schema
- [x] `State` model exists with all required fields
- [x] `District` model has `stateId` FK → `State`
- [x] `Taluk` model has `districtId` FK → `District`
- [x] All models use `upsert` with composite unique keys (`stateId_slug`, `districtId_slug`)

### API Routes — Dynamic
- [x] `/api/data/[module]` — reads districtSlug from URL params, queries by districtId
- [x] `/api/cron/scrape-news` — queries `prisma.district.findMany({ where: { active: true } })`
- [x] `/api/cron/generate-insights` — queries all active districts
- [x] `/api/admin/districts` — returns active districts from DB for admin dropdowns
- [x] `/api/admin/fact-check` — uses dynamic districtLabel from DB
- [x] `/api/admin/verify-data` — uses dynamic state name from DB (not hardcoded "Karnataka")
- [x] `/api/data/homepage-preview` — includes stateSlug in districtPreviews response
- [x] `/api/data/health-score` — calculates per active district from DB

### Components — Dynamic
- [x] `OverviewClient.tsx` — generic (not Mandya-specific)
- [x] `LiveDataPreview.tsx` — "View all" links use first active district from API
- [x] `FactChecker.tsx` — cascading State→District dropdown (from /api/admin/districts)
- [x] `VerifySection.tsx` — same dynamic dropdown

### Scrapers — Fully Generic
- [x] `scheduler.ts` — `getActiveDistricts()` queries DB; passes districtName + stateName to all contexts
- [x] `scraper/types.ts` — `JobContext` has districtName + stateName
- [x] `weather.ts` — uses ctx.districtName as primary OWM city; OWM_CITY_OVERRIDE for overrides
- [x] `crops.ts` — uses ctx.stateName + ctx.districtName; AGMARKNET_DISTRICT_OVERRIDE for overrides
- [x] `ai-analyzer.ts` — queries active districts from DB
- [x] `news.ts` — requires districtSlug in context; URL dedup + date validation + title dedup

### AI Systems
- [x] Pre-computed insights (AIModuleInsight) — runs for all active districts every 2h
- [x] Fact checker — district dropdown from DB, uses dynamic district+state names
- [x] Health score — DistrictHealthScore table, calculated for all 3 active districts
- [x] Health score weights — district-type aware (metro/urban/semi-urban/rural)
- [x] News classification — date context injected, CRITICAL DATE RULE prevents stale alerts

### Vercel Crons (vercel.json)
- [x] `/api/cron/scrape-news` — 6 AM UTC daily
- [x] `/api/cron/scrape-crops` — 3:30 AM UTC daily
- [x] `/api/cron/generate-insights` — every 2h
- [x] `/api/cron/news-intelligence` — every 4h (classifies news → DB actions)

---

## DELHI EXPANSION STATUS (April 2026)
- [x] State hierarchy seeded (Delhi UT + 11 districts + subdivisions)
- [x] Static constants updated
- [x] Weather/crop overrides configured
- [x] New Delhi district: full data seeded
- [x] Activation script created (scripts/activate-delhi-districts.ts)
- [x] Other 10 districts: light data seeded (scripts/seed-delhi-other-districts.ts)
- [ ] Local testing verified
- [ ] Production deployment
- [ ] Remaining 10 districts activated

## MULTI-STATE EXPANSION (April 2026)
- [x] Maharashtra: Mumbai seeded + activated
- [x] West Bengal: Kolkata seeded + activated
- [x] Tamil Nadu: Chennai seeded + activated
- [x] Regional fonts added (Tamil, Bengali)
- [x] Weather/crop overrides configured
- [x] Activation script created (scripts/activate-expansion-districts.ts)
- [ ] Local testing verified
- [ ] Production deployment

---

## TELANGANA EXPANSION (April 2026)

- [x] State hierarchy seeded (Telangana + Hyderabad + 16 mandals)
- [x] Static constants updated (Telangana active, HYDERABAD_DISTRICT constant)
- [x] Weather/crop overrides configured
- [x] Telugu font imported (Noto Sans Telugu)
- [x] Hyderabad district: full data seeded (leadership, budget, infra, schools, police, schemes, elections, courts, RTI, offices, transport, industries, famous, services)
- [x] Activation script created (scripts/activate-telangana-districts.ts)
- [x] Multi-state scalability overhaul (state-config.ts, DataSourceBanner, NoDataCard)
- [x] Scrapers made state-aware (power, dams, transport — graceful skip for non-Karnataka)
- [x] Exams dedup + state filtering fix
- [x] Budget expenditure, crime stats, traffic revenue seeded for Hyderabad
- [x] Local testing verified
- [ ] Production deployment
- [ ] Additional Telangana districts (Warangal, Nizamabad, Karimnagar, Khammam)
- [ ] TGSPDCL power data integration
- [ ] Telangana GeoJSON mandal boundaries

## NEW ARCHITECTURE PATTERNS (April 2026)

- `src/lib/constants/state-config.ts` — Single source of truth for per-state config (add new states here only)
- `src/components/common/DataSourceBanner.tsx` — Data attribution on every module page
- `src/components/common/NoDataCard.tsx` — Universal empty state with module-specific messages
- Industries page: data-driven mode selection (sugar/tech/heritage/general) instead of hardcoded
- Data sources page: dynamic per-state sources from state-config
- All user-facing text uses "collected"/"sourced" (never "scraped")

---

*Last updated: 2026-04-10*
*8 pilot districts active across 6 states/UTs (Mandya, Mysuru, Bengaluru Urban, New Delhi, Mumbai, Kolkata, Chennai, Hyderabad). 10 Delhi districts + 4 Telangana districts ready to activate.*

---

## POPULATION MODULE v2 — SCALING NOTES

Added 2026-04-21.

### Database footprint (as of 2026-04-21, Karnataka pilot)

```
New tables:      2 (DemographicProfile, DemographicUpdate) + 1 enum (DemographicLevel)
New indexes:     6 on DemographicProfile (incl unique composite) + 2 on DemographicUpdate
Row counts:
  DemographicProfile:  98 rows
    - Census 2011 × STATE:           1
    - Census 2011 × DISTRICT:       30
    - NFHS-5 × DISTRICT:             3 (placeholder — data pending)
    - NITI MPI 2023 × STATE:         1
    - NITI MPI 2023 × DISTRICT:     30
    - NITI MPI 2023 Rural × STATE:   1
    - NITI MPI 2023 Urban × STATE:   1
    - NITI MPI 2021 Baseline × STATE:    1
    - NITI MPI 2021 Baseline × DISTRICT: 30
  DemographicUpdate:   0 rows (populated via news pipeline category-tagging)
```

### Growth projection

At 780-district + 37-state full-India scale, with 3-4 datasets per district
(Census, NFHS, MPI current, MPI baseline) and ~6 state-level rows per state:

```
DemographicProfile:     ~3,000 rows (well within Postgres comfort for a single table)
Per-row payload size:   3-8 KB (JSONB breakdowns vary by how many dimensions
                                are populated)
Total table payload:    ~15-25 MB at full India scale — trivial
```

### Query patterns and indexes

```
Pattern 1: single district's current profile
  WHERE districtId = ? AND dataset = 'Census 2011'
  → Index on (districtId, year, dataset) — composite unique
  → p95 latency <5ms on shared pooler

Pattern 2: district trend (MPI current + baseline)
  WHERE districtId = ? AND dataset LIKE 'NITI MPI%'
  → Same composite index
  → p95 <10ms

Pattern 3: state rollup (all districts, one state)
  WHERE state.id = ? → districts.many → DemographicProfile.many
  → Index on districtId
  → p95 <50ms for 30-district state

Pattern 4: admin audit completeness scan
  Group by district, check JSONB key presence
  → Full-ish scan acceptable at 100-row scale
  → At 3,000+ rows (full India), consider materialised view
```

### Caching strategy

```
/api/data/population/profile   revalidate: 86400 (24h)
/api/data/population/state     revalidate: 86400 (24h)
/api/data/population           backward-compatible shape preserved
/api/admin/population-audit    revalidate: 0 (admin must see fresh state)

Next.js page cache tags:
  district:{slug}:population
  district:{slug}:overview
  state:{slug}:population
  state:{slug}:overview
```

### Load test expectations

```
v1 (9 active districts):  Current Vercel Pro + Neon free suffices easily.
                            No k6 run needed pre-launch.

Pre-launch at 25+ districts: Run k6 with 2,000 concurrent on
                              /en/karnataka/bengaluru-urban/population.
                              Expected: all queries <100ms at p95. No AI call
                              on page render (insight card is cache-only).

Post-launch at 25,000+ concurrent:
  - Materialised view for /en/karnataka state rollup
  - Pin DemographicProfile for active districts in Redis (24h TTL)
  - Consider Neon Scale tier ($20/mo) for connection pooling beyond current limits
```

### What this module does NOT add

- No new Vercel cron (confirmed in vercel.json — 7 pre-existing crons unchanged)
- No new Railway scraper job
- No new AI provider call
- No pgvector / HNSW index (RAG integration is Phase 3, not v1)
- No background worker
- No webhooks

### Runtime cost impact

```
Vercel:        0 change (schema change + static-ish pages)
Neon:          +~25 MB storage at full India scale (within free tier)
Upstash:       0 new Redis keys
OpenRouter:    0 new calls
Anthropic API: 0 new calls
```

### Known unresolved issues

- `src/scraper/parsers/tender-pdf-extractor.ts` was dormant pre-Population-v2
  (missing pdf-parse devDep). Adding pdf-parse@2.4.5 made TypeScript happy
  but the extractor still uses v1 API patterns — still broken at runtime
  but fails gracefully via its `{extractionFailed: true}` return. Flagged
  for the tenders team. Not a blocker.
