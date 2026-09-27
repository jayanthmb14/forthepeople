# UPDATED INSTRUCTIONS — Add to Claude Chat Project Instructions

## ADD to "MY WORKFLOW" section:

### District Expansion Prompt Format (STANDARD — follow for ALL new districts):
```
Structure matches: CLAUDE-CODE-DELHI-PROMPT-v2.md / MUMBAI-KOLKATA-CHENNAI-PROMPT.md

Header → Project Context → Critical Rules → 
Step 1: Hierarchy (seed-hierarchy.ts) →
Step 2: Static Constants (districts.ts) →
Step 3: Weather/Crop Overrides →
Step 4: Regional Font →
Step 5: Seed File (seed-<city>-data.ts) with sections A-P:
  A. Leadership (10-tier)
  B. Budget Data
  C. Infrastructure Projects (20+)
  D. Demographics
  E. Police Stations
  F. Schools (20+)
  G. Government Offices
  H. Schemes (Central + State)
  I. Election Results (last 2-3 elections)
  J. Court Stats
  K. RTI Templates
  L. Famous Personalities (bornInDistrict=true ONLY)
  M. Local Industries
  N. Bus Routes
  O. Train Schedules
  P. Service Guides
Step 6: Activation Script →
Step 7: Documentation Updates →
Step 8: Local Testing Checklist
```

## ADD to "DATA SOURCES" section:

### Telangana-specific portals:
```
telangana.gov.in                    — State government
hyderabad.telangana.gov.in          — District official
finance.telangana.gov.in            — Budget
ghmc.gov.in                         — GHMC civic body
hmda.gov.in                         — Development authority
hmrl.co.in                          — Metro rail
hyderabadpolice.gov.in              — Police
tgsouthernpower.org                 — TGSPDCL electricity
hyderabadwater.gov.in               — HMWSSB water
tsrtconline.in                      — TSRTC buses
dharani.telangana.gov.in            — Land records
meeseva.telangana.gov.in            — Citizen services
data.telangana.gov.in               — Open Data (CKAN API, 658+ datasets)
tgdex.telangana.gov.in              — Data Exchange platform
```

## ADD to "ANTI-PATTERNS" section:

### Telangana-specific:
```
- Hyderabad uses "Mandals" not "Taluks" — stored as Taluk model
- Telangana police = Commissionerate (CP, not SP)
- GHMC split into 3 corporations (2026) — seed GHMC as primary
- Head of district = "Collector & District Magistrate" (not DC)
- TGSPDCL for electricity (not BESCOM)
- HMWSSB for water (not BWSSB)
- OWM handles "Hyderabad" directly — no override needed
- 100% urban district — rural modules will be empty (expected)
```

---

## ADD to "LEGAL COMPLIANCE" section (CRITICAL):

### NO "SCRAPER" LANGUAGE ON PUBLIC SITE:
```
The words "scraper", "scraping", "scraped" must NEVER appear on any user-facing
page, UI text, meta description, or public API response.

Internal code is fine (file names, function names, server logs, comments).

Public-facing must use: "sourced from", "data from", "aggregated from",
"collected from" official government portals.

Known fix needed: src/app/about/page.tsx has "scraped" in visible text.
Change to "collected".
```

## ADD to "ANTI-PATTERNS" section:

### Never do in UI/public text:
```
- Use the word "scraper/scraping/scraped" on any public page or API response
- Reference internal scraper infrastructure in user-facing content
- Show ScraperLog data to non-admin users
- Mention "scraping frequency" — say "data refresh interval" instead
```
