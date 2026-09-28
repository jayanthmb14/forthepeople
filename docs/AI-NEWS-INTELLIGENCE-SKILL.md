---
name: ai-news-intelligence
description: "AI News Intelligence pipeline for ForThePeople.in. Use this skill when building, debugging, or extending the automated news analysis system that reads Indian news, extracts civic data, and updates the district dashboard. Triggers: 'AI intelligence', 'news pipeline', 'Gemini analyzer', 'auto-update from news', 'ReviewQueue', 'admin review', 'confidence scoring', 'auto-alert from news', 'News Action Engine', 'AIInsightCard', 'pre-computed insights', 'news action queue'."
---

# ForThePeople.in — AI News Intelligence Pipeline

## Overview

4 AI engines integrated into the platform. This skill covers all of them.

```
Last updated: 2026-04-23 (Pune #10 launch added to news targets)
Status:       All 4 engines COMPLETE and running in production
```

**2026-04-23 addition:** Pune added to news-pipeline targets via its activation
in the `District` table. `findTargetDistricts()` now surfaces Pune-specific
news. Maharashtra state-level news routing now covers 2 districts (Mumbai,
Pune) instead of 1. No new scraper jobs introduced. No cron schedule changes.
AI cost impact: one additional district's news volume, absorbed within the
existing $0.50/day news-pipeline budget guard.

---

## Engine 1: News Intelligence Pipeline

### What It Does
Scrapes news → classifies with AI → stores as AIInsight → queues for admin review.

### Components
```
src/scraper/jobs/news.ts       — RSS scraping (runs every 1h via Railway scheduler)
src/scraper/jobs/ai-analyzer.ts — AI classification (runs monthly)
Vercel cron: /api/cron/scrape-news — daily 6AM UTC (news scrape + dedup + expire stale)
```

### Flow
```
1. RSS scraping (news.ts):
   - Sources: Google News RSS, The Hindu, Deccan Herald
   - 3 queries per district (generic + MLA/MP/budget/dam/school/police queries)
   - 50-item limit per run per district
   - DATE VALIDATION (isArticleFresh): reject if >3 days old, future-dated, or year < current-1
     (Google News returns articles by relevance not recency — old articles silently re-appear)
   - DEDUP — two layers:
     1. URL dedup: discard duplicate article URLs (existing behavior)
     2. Title dedup (isTitleDuplicate): normalize title → first 5 significant words (len>3) → key
        Check in-memory Set + DB lookup (last 7 days, insensitive match). Discard if match found.
   - Stores: NewsItem table (title — NOT headline — summary, url, source, publishedAt)

2. AI Classification (news-action-engine.ts classifyArticleWithAI):
   - Receives publishedAt date — injects article age (days) into prompt
   - CRITICAL DATE RULE in prompt:
     * If event >2 days old → force module="news", confidence ≤ 0.4, no alerts/actions
     * If event current/upcoming → classify normally
   - Uses callAI() from src/lib/ai-provider.ts (Gemini 2.5 Flash or Claude)
   - Returns: targetModule, moduleAction, confidence, extractedData, provider

3. AI Classification (ai-analyzer.ts — batch pipeline):
   - Reads unanalyzed NewsItems
   - Uses callAI() / callAIJSON() from src/lib/ai-provider.ts (Gemini 2.5 Flash or Claude)
   - Extracts: targetModule, extractedData, confidence, summary, changes[]
   - Stores: AIInsight records with status PENDING
   - Creates: ReviewQueue entries for admin approval

3. Admin Review (/en/admin/review):
   - Admin approves/rejects insights from ReviewQueue
   - Approved insights display via AIInsightCard on module pages
```

### Prisma Models
```prisma
model NewsItem {
  title        String     // FIELD IS title, NOT headline (was a bug)
  summary      String
  url          String     @unique
  source       String
  category     String?
  publishedAt  DateTime
  aiAnalyzed   Boolean    @default(false)
}

model AIInsight {
  districtId   String
  module       String
  headline     String
  summary      String
  sentiment    String?
  confidence   Float
  sourceUrls   String[]
  approved     Boolean    @default(false)
}

model ReviewQueue {
  insightId    String
  status       String     // pending / approved / rejected
  reviewerNote String?
}

model NewsIntelligenceLog {
  phase      String
  status     String
  tokensUsed Int?
  durationMs Int?
  aiProvider String?
  aiModel    String?
}
```

---

## Engine 2: News Action Engine

### What It Does
Extracts structured data from news articles and auto-updates the DB or queues for review.

### Location
```
src/lib/news-action-engine.ts
```

### Functions
```typescript
classifyArticleWithAI(article, context) → { action, extractedData, confidence, targetModule }
executeNewsAction(result, districtId)   → applies DB mutation or queues for review
```

### Confidence Thresholds
```
> 0.85 confidence → AUTO-EXECUTE: directly update the relevant Prisma model
0.60–0.85         → QUEUE: store in NewsActionQueue for human admin review
< 0.60            → DISCARD: log to NewsIntelligenceLog, take no action
```

### Prisma Model
```prisma
model NewsActionQueue {
  articleId     String
  action        String
  extractedData Json
  confidence    Float
  status        String     // pending / executed / rejected / skipped
  executedAt    DateTime?
}
```

### Rules (CRITICAL — never violate)
```
Budget updates:  NEVER overwrite. Always ADD new BudgetEntry records.
Leadership:      Mark existing leaders inactive. Create new Leader record. Never deleteMany.
All updates:     Must store source article URL in the record.
Rate limiting:   1-second delay between consecutive AI calls.
Error handling:  Every DB operation wrapped in try/catch.
```

---

## Engine 3: Pre-computed Module Insights

### What It Does
Generates AI summaries for all 29 modules × all active districts. Stored with TTL/expiry. Shown as `AIInsightCard` on 11 module pages.

### Location
```
src/lib/insight-generator.ts
Config: src/lib/insight-config.ts (MODULE_INSIGHT_CONFIGS — one config per module)
```

### Trigger
```
Vercel cron: POST /api/cron/generate-insights — runs every 2h
Schedule:    "0 */2 * * *" in vercel.json
Auth:        Authorization: Bearer CRON_SECRET (header only)
```

### Storage
```prisma
model AIModuleInsight {
  districtId   String
  module       String
  headline     String
  body         String
  confidence   Float
  aiProvider   String
  aiModel      String
  generatedAt  DateTime
  expiresAt    DateTime   // TTL-based, typically 6h
  @@unique([districtId, module])
}
```

### Cache Flow
```
Request → Redis (6h TTL) → DB AIModuleInsight (check expiresAt) → generate fresh (if expired)
```

### Display
```
AIInsightCard component (src/components/common/AIInsightCard.tsx):
  - Shows on: overview, water, crops, weather, police, schools,
              infrastructure, budget, elections, health, alerts
  - Footer line: "Source-verified by [Claude/Gemini] AI"
    Uses actual aiProvider + aiModel from the stored AIModuleInsight record
```

### SharedAIInsight (shared across districts)
```prisma
model SharedAIInsight {
  scope      String  // "national", "state"
  scopeId    String
  module     String
  insight    String
  variables  Json
  expiresAt  DateTime
}
```
Used when the same insight is relevant across multiple districts (e.g., national crop price trend).

---

## Engine 4: Fact Checker

### What It Does
Runs 25+ integrity checks across all data modules for a given district. Flags stale data, duplicates, and rule violations.

### Location
```
src/lib/fact-checker.ts
Admin trigger: POST /api/admin/fact-check
Admin view:    GET  /api/admin/fact-check (last 20 runs)
Admin UI:      Dashboard tab → FactChecker component
```

### Check Categories
```
1. Leadership    — recent enough? (>6 months stale)
2. Budget        — current fiscal year present?
3. Infrastructure — projects with no progress update?
4. Demographics  — Census data present?
5. Courts        — court stats present?
6. News/Alerts   — stale alerts (>14 days)? duplicate news?
7. Personalities — bornInDistrict rule enforced?
```

### Born-in-District Rule (CRITICAL)
```
FamousPersonality records MUST have bornInDistrict = true for the district's page.
Example: Dr. Rajkumar — born in Erode, Tamil Nadu — removed from Mandya's page (was an error).
Always verify birth district before seeding FamousPersonality records.
```

### Storage
```prisma
model FactCheckStatus {
  districtId  String
  module      String
  status      String   // ok / warning / error
  totalItems  Int
  issuesFound Int
  staleItems  Int
  duplicates  Int
  results     Json     // per-check details
  aiProvider  String?
  durationMs  Int?
  createdAt   DateTime
}
```

### District Selector
```
Cascading State → District dropdown, populated from GET /api/admin/districts
Uses dynamic DB data — no hardcoded district names
```

---

## AI Provider System

### Always Use callAI() — Never Direct API Calls
```typescript
import { callAI, callAIJSON } from '@/lib/ai-provider';

// String response
const text = await callAI(prompt);

// Typed JSON response (includes provider + model info)
const { data, provider, model } = await callAIJSON<MyType>(prompt);
```

### Models
```
Gemini:    gemini-2.5-flash (default), gemini-2.0-flash, gemini-1.5-pro
Anthropic: claude-opus-4-6 (default), claude-sonnet-4-6, claude-haiku-4-5-20251001
```

### Response Parsing (CRITICAL)
```typescript
// CORRECT — always .find(), never [0]
const textBlock = response.content.find(b => b.type === 'text');
const text = textBlock?.text ?? '';

// WRONG — breaks when extended thinking adds blocks before text
const text = response.content[0].text;

// Extended thinking: maxTokens MUST be >= 2048
```

### Base URL Priority
```typescript
// Env var always wins over DB setting
const baseUrl = process.env.ANTHROPIC_BASE_URL
  || settings.anthropicBaseUrl
  || "https://api.anthropic.com";
```

---

## Data Flow Summary

```
Vercel Crons (schedules: vercel.json; the Railway container is retired)
├── /api/cron/scrape-news         → src/scraper/jobs/news.ts
├── /api/cron/news-intelligence   → src/scraper/jobs/ai-analyzer.ts
└── /api/cron/generate-insights   → src/lib/insight-generator.ts

DB: NewsItem → AIInsight → ReviewQueue → AIInsightCard (approved only)
DB: AIModuleInsight (pre-computed, TTL-based) → AIInsightCard (directly)
DB: NewsActionQueue (pending review) + auto-executed at >0.85 confidence
DB: FactCheckStatus (admin-triggered checks)
```

---

## Admin Dashboard Integration

### Review Tab (/en/admin/review)
```
URL:     /en/admin/review
Auth:    ftp_admin_v1 cookie (set at login with ADMIN_PASSWORD)
Shows:   Pending AIInsight items from ReviewQueue
Actions: Approve (sets approved=true on AIInsight) / Reject (sets status=rejected)
Display: module, district, headline, confidence, AI provider, source URL
```

### Dashboard Tab — FactChecker Component
```
Trigger: POST /api/admin/fact-check with { district, module }
Returns: { totalItems, issuesFound, staleItems, duplicates, results[] }
History: Last 20 checks from FactCheckStatus table
```

### Dashboard Tab — DataVerifier Component
```
Trigger: POST /api/admin/verify-data with { district, module }
Returns: { issues[], suggestions[], confidence, status: 'ok'|'warning'|'error' }
Note:    Returns graceful status:'error' (NOT HTTP 500) if AI fails
```

---

## Debugging Checklist

```
1. AI insights not showing?
   - Check AIModuleInsight table — is expiresAt in the future?
   - Check Redis: key "ftp:ai-insight:{module}:{district}"
   - Check /api/cron/generate-insights — is CRON_SECRET set in Vercel env?
   - Look for errors in Vercel function logs

2. News not being analyzed?
   - Check NewsItem table: aiAnalyzed = false means not yet processed
   - Check NewsIntelligenceLog for error messages
   - Verify GEMINI_API_KEY or ANTHROPIC_API_KEY is set

3. NewsActionQueue items stuck?
   - Check status: 'pending' items need admin review (confidence 0.60-0.85)
   - 'executed' = auto-applied (confidence > 0.85)
   - 'skipped' = confidence < 0.60, discarded

4. AIInsightCard not appearing?
   - Check AIInsight.approved = true (must be approved in Review tab)
   - OR check AIModuleInsight (pre-computed) exists and not expired

5. Fact checker errors?
   - Verify active district in DB (active: true)
   - Check FactCheckStatus for previous run details
   - Born-in-district violations show in results.personalities

6. Rate limiting?
   - ai-analyzer has 1-second delay between calls
   - generate-insights has 2-second delay between Anthropic calls
   - Gemini free tier sufficient for current load (3 districts)

7. Old/stale news articles appearing as "today" in alerts?
   - Root cause: Google News RSS returns articles by relevance, not date
   - Fix: isArticleFresh() in news.ts rejects articles >3 days old
   - Run cleanup: POST /api/admin/cleanup-news (x-admin-password header)
   - Then regenerate: POST /api/cron/generate-insights

8. Duplicate articles flooding the queue?
   - Root cause: Google News generates different redirect URLs for same article
   - Fix: isTitleDuplicate() checks normalized title prefix (not just URL)
   - Cleanup: /api/admin/cleanup-news also de-dupes by title prefix in DB

9. Monitoring data freshness?
   - GET /api/data/freshness?district=mandya returns traffic-light per module
   - green = within expected interval, amber = up to 3×, red = overdue
   - Expected: weather 10min, crops 1440min, dam 60min, news 120min, insights 120min
```

---

## Key File Reference

```
src/scraper/jobs/news.ts            — RSS scraper + URL dedup + date validation + title dedup
src/scraper/jobs/ai-analyzer.ts     — AI classification of NewsItems
src/lib/news-action-engine.ts       — classifyArticleWithAI(publishedAt) + executeNewsAction()
src/lib/insight-generator.ts        — Pre-compute module insights (TTL-based)
src/lib/insight-config.ts           — MODULE_INSIGHT_CONFIGS (29 module prompts)
src/lib/fact-checker.ts             — 25+ integrity checks
src/lib/ai-provider.ts              — callAI() / callAIJSON() unified gateway
src/components/common/AIInsightCard.tsx         — Display component for AI insights
src/app/api/cron/generate-insights/route.ts     — 2h cron route
src/app/api/cron/scrape-news/route.ts           — Daily news cron route (6 AM UTC)
src/app/api/cron/news-intelligence/route.ts     — 4h cron route (classifies + executes)
src/app/api/admin/fact-check/route.ts           — Admin fact check API
src/app/api/admin/verify-data/route.ts          — Admin data QA API
src/app/api/admin/cleanup-news/route.ts         — Cleanup stale/dup articles + bad alerts
src/app/api/data/freshness/route.ts             — Traffic-light freshness monitor per module
src/app/[locale]/admin/review/page.tsx          — Review queue admin page
```
