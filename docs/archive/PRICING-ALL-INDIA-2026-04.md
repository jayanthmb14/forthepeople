# ForThePeople.in — ALL-INDIA COST ANALYSIS
# ═══════════════════════════════════════════════════════════
# What it costs to run this for every district in India
# ═══════════════════════════════════════════════════════════

## INDIA AT A GLANCE

```
States & UTs:        36 (28 states + 8 UTs)
Total Districts:     780+
Total Taluks/Blocks: ~6,700
Total Villages:      ~640,000
Languages Needed:    22 scheduled + English
```

---

## 2026-04-23 UPDATE — Pune #10 launch (cost-neutral)

Adding Pune (10th active district) does not change the current Pro tier:

- Neon: ~74 new rows total (41 Leader + 5 BudgetAllocation + 5 BudgetEntry +
  13 InfraProject + 8 School + 6 Scheme, minus Landge cross-file dedup).
  Negligible storage growth; current Pro tier has ~90% headroom.
- Vercel: one additional district doesn't shift SSR or function budget.
- Scraper crons: weather + crops add Pune (~2 extra API calls per cycle,
  within free tiers).
- AI insight cron: +1 district × ~$0.002/12h cycle = +$0.004/day.

**Projected scaling threshold:** if next quarter adds 20+ more districts,
consider Neon Scale tier upgrade (current Pro is $20/mo). Until then,
existing infrastructure covers 10–30 active districts without tier change.

---

## INFRASTRUCTURE COSTS (MONTHLY)

### TIER 1: Single District (Mandya Pilot)

```
Component               Service              Monthly Cost
─────────────────────────────────────────────────────────
Frontend                Vercel Free           ₹0
Database                Supabase Free         ₹0
Redis Cache             Upstash Free          ₹0
Scraper Worker          Railway Starter       ₹400 ($5)
Domain                  forthepeople.in       ₹80/mo (~₹960/yr)
─────────────────────────────────────────────────────────
TOTAL (1 district)                            ~₹500/month
                                              (~$6/month)
```

### TIER 2: One Full State (Karnataka — 31 districts)

```
Component               Service              Monthly Cost
─────────────────────────────────────────────────────────
Frontend                Vercel Pro            ₹1,600 ($20)
Database                Supabase Pro          ₹2,000 ($25)
  Storage: ~5GB for 31 districts
Redis Cache             Upstash Pro           ₹800 ($10)
Scraper Workers (×3)    Railway Pro           ₹2,400 ($30)
  31 districts × 15 scrapers = 465 cron jobs
CDN / Bandwidth         Vercel included       ₹0
Monitoring              Better Uptime Free    ₹0
Domain                  Already have          ₹0
─────────────────────────────────────────────────────────
TOTAL (31 districts)                          ~₹7,000/month
                                              (~$85/month)
                                              ~₹225/district/month
```

### TIER 3: All of India (780+ districts)

```
Component               Service              Monthly Cost
─────────────────────────────────────────────────────────
Frontend                Vercel Enterprise     ₹33,000 ($400)
  or: Self-hosted on 2× DigitalOcean droplets
  
Database (PostgreSQL)   DigitalOcean Managed  ₹16,500 ($200)
  Storage: ~150GB for 780 districts
  Or: Supabase Pro × 3 regions
  
Redis Cache             Upstash Business      ₹4,000 ($50)
  Or: DigitalOcean Redis $15/mo
  
Scraper Cluster         4× Railway Workers    ₹16,000 ($200)
  780 districts × 15 scrapers = 11,700 cron jobs
  Need 4 workers to handle load
  Rate limiting: max 1 req/2s per gov portal
  
CDN                     Cloudflare Pro        ₹1,600 ($20)
  Heavy traffic expected with 780 districts
  
Object Storage          DigitalOcean Spaces   ₹400 ($5)
  GeoJSON files, cached PDFs, etc.
  
Translation API         Google Cloud          ₹8,000 ($100)
  22 languages × ongoing translation
  ~10M characters/month
  
Monitoring              Datadog/Grafana       ₹4,000 ($50)
  Scraper health, API latency, errors
  
SSL / Security          Cloudflare included   ₹0
Domain                  Already have          ₹0
─────────────────────────────────────────────────────────
TOTAL (780 districts)                         ~₹84,000/month
                                              (~$1,025/month)
                                              ~₹108/district/month
                                              (~₹10 lakh/year)
```

---

## API COSTS

```
Service                 Free Tier          Paid (All India)     Monthly
──────────────────────────────────────────────────────────────────────
data.gov.in             10,000 calls/day   Unlimited (govt)     ₹0
                        (enough for 60 districts)
                        Need 4 API keys for 780 districts

OpenWeatherMap          1,000 calls/day    Pro: 100K calls/day  ₹4,000
                        (enough for 200 districts at 5min refresh)
                        Need Pro for 780 districts

Google Translate        500K chars/month   Per-char pricing     ₹8,000
                        (enough for 1-2 states)
                        22 languages × 780 districts

IMD (Weather)           Free (whitelist)   Free                 ₹0
                        Slow approval, but free
──────────────────────────────────────────────────────────────────────
TOTAL API COSTS (All India)                                     ~₹12,000/month
```

---

## DEVELOPMENT COSTS

### Option A: Claude Code / AI-Assisted (What you're doing now)

```
Phase                    Effort           Claude Code Cost
────────────────────────────────────────────────────────────
Pilot (1 district)       2-4 weeks        ~₹2,000-4,000
  Sections 1-10           (API usage for Claude Pro)
  
First State (31 dist)    1-2 weeks        ~₹2,000
  Mostly data seeding     (same codebase, just data)
  + state-specific scrapers
  
All India Expansion      4-8 weeks        ~₹8,000
  State-specific scrapers (28 states)
  Translation (22 languages)
  Data validation
  
TOTAL DEV COST                            ~₹12,000-14,000
                                          (~$150-175)
```

### Option B: Freelance Developer

```
Phase                    Effort           Cost (India rates)
────────────────────────────────────────────────────────────
Full-stack dev           3-4 months       ₹2-4 lakh
  (₹50K-1L/month)
  
Data engineer            2-3 months       ₹1.5-3 lakh
  (scraper setup)
  
Translation              Ongoing          ₹50K-1L
  (22 languages)
  
TOTAL                                     ₹4-8 lakh
                                          ($5,000-$10,000)
```

### Option C: Agency / Full Build

```
Full build + deploy      6 months         ₹15-30 lakh
                                          ($18,000-$36,000)
```

---

## ANNUAL COST SUMMARY

```
Scale              Monthly      Annual        Per District/Year
──────────────────────────────────────────────────────────────
1 District         ₹500         ₹6,000        ₹6,000
1 State (31)       ₹7,000       ₹84,000       ₹2,700
All India (780)    ₹96,000      ₹11.5 lakh    ₹1,475
                   (~$1,175)    (~$14,000)     (~$18)
```

---

## COST OPTIMIZATION STRATEGIES

```
1. CACHING AGGRESSIVELY: Most govt data changes daily/weekly, not per-second.
   Use Redis TTL of 5-30 minutes. Reduces DB queries by 90%.

2. SMART SCRAPING: Don't scrape all 780 districts every 5 minutes.
   Priority tiers:
   - Tier A (active/popular): Every 5-15 min
   - Tier B (moderate traffic): Every 1-6 hours
   - Tier C (low traffic): Daily

3. STATIC GENERATION: For data that changes weekly (population, schools),
   use Next.js ISR (Incremental Static Regeneration). Eliminates API calls.

4. FREE ALTERNATIVES: 
   - Vercel → Cloudflare Pages (free, unlimited)
   - Supabase → self-hosted PostgreSQL on ₹500/mo VPS
   - Google Translate → open-source AI translation (IndicTrans2)

5. COMMUNITY FUNDING: Open source project → accept donations
   ₹10/month from 1000 citizens = ₹10,000/month (covers all India)

6. GRANTS: Apply to:
   - Google.org Impact Challenge India
   - Omidyar Network India (civic tech)
   - National Informatics Centre (NIC) partnerships
   - NITI Aayog Open Data programs
```

---

## CHEAPEST POSSIBLE ALL-INDIA SETUP

```
If you aggressively optimize:

VPS (Hetzner/Contabo India)     ₹800/mo  (4GB RAM, self-host everything)
PostgreSQL                       included on VPS
Redis                            included on VPS
Cloudflare (CDN + DNS)           ₹0 (free tier)
Domain                           ₹80/mo
data.gov.in API                  ₹0
OpenWeatherMap                   ₹0 (rotate free keys or use IMD)
Translation                      ₹0 (IndicTrans2 self-hosted)
─────────────────────────────────────────────────────────
ABSOLUTE MINIMUM                 ~₹900/month ($11/month)
                                 ₹10,800/year for ALL of India
                                 ₹14 per district per year
```

This requires self-hosting everything on a single VPS and using only
free APIs. Performance would be limited but functional.

---

## RECOMMENDATION

```
START:  Pilot 1 district      → ₹500/month   (what you're doing)
THEN:   Expand to Karnataka   → ₹7,000/month (after pilot is stable)
THEN:   5 major states        → ₹25,000/month
GOAL:   All India             → ₹96,000/month (~₹11.5 lakh/year)

The per-district cost DROPS as you scale because:
- Same codebase serves all districts
- Shared infrastructure (DB, Redis, CDN)
- Scrapers reuse patterns across states
- Only state-specific adapters need customization
```
