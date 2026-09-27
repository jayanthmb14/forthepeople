# FORTHEPEOPLE.IN — PHASE 2 MASTER UPGRADE PROMPT
# ═══════════════════════════════════════════════════════════
# Run in Claude Code ONE PHASE AT A TIME
# After each phase: test → commit → deploy → then run next phase
# Total: 8 Phases | Estimated: 8-10 Claude Code sessions
# ═══════════════════════════════════════════════════════════

## HOW TO USE THIS FILE

```
1. Open Claude Code
2. Say: "Read CLAUDE-CODE-MASTER-PROMPT.md and execute PHASE [N]"
3. Claude reads the file, understands full context, executes that phase
4. After each phase completes:
   - Test locally (npm run dev)
   - Git commit with message: "Phase N: [description]"
   - Deploy to Vercel (git push)
   - Update PROGRESS TRACKER at bottom of this file
   - Update docs/BLUEPRINT-UNIFIED.md with changes made
   - Update docs/FORTHEPEOPLE-SKILL-UPDATED.md with new state
5. Move to next phase
```

## CURRENT PROJECT STATE (April 10, 2026)

```
LIVE:           https://forthepeople.in
GITHUB:         https://github.com/jayanthmb14/forthepeople (PUBLIC, MIT with Attribution)
STACK:          Next.js 16 + TypeScript + Tailwind v4 + Prisma 7 + Neon PostgreSQL + Upstash Redis
MAPS:           react-simple-maps (D3-based, GeoJSON per district)
AI ENGINE:      Anthropic Claude (default) + Google Gemini (fallback)
DEPLOYMENT:     Vercel Pro (zurvoapp) + Railway (scraper)
MODULES:        30 dashboard modules
ACTIVE:         8 districts across 6 states
                Karnataka: Mandya, Mysuru, Bengaluru Urban
                Delhi: New Delhi
                Maharashtra: Mumbai
                West Bengal: Kolkata
                Tamil Nadu: Chennai
                Telangana: Hyderabad
RECENT:         Multi-state scalability overhaul, state-config.ts, DataSourceBanner,
                NoDataCard, IBJA gold prices, exams dedup, Hyderabad expansion

KEY NEW FILES:
  src/lib/constants/state-config.ts      — Per-state configuration (single source of truth)
  src/components/common/DataSourceBanner.tsx — Data source attribution on all module pages
  src/components/common/NoDataCard.tsx    — Universal empty state component
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 1: MAP REPLACEMENT + NAVIGATION FIX
# ═══════════════════════════════════════════════════════════

```
PRIORITY: CRITICAL — Map is broken, not navigating, not responsive

TASK: Replace Leaflet.js with react-simple-maps for SVG India drill-down.

STEP 1: Install
  npm install react-simple-maps
  npm uninstall leaflet react-leaflet @types/leaflet  (if present)

STEP 2: Download TopoJSON/GeoJSON files
  These go in public/geo/:
  - india-states.json (from github.com/udit-001/india-maps-data)
  - karnataka-districts.json (from projects.datameet.org/maps/)
  - mandya-taluks.json (from datameet subdivisions)
  - mysuru-taluks.json (for Mysuru if active)
  Each file MUST be under 500KB for mobile performance.
  Use topojson-client to convert if needed.

STEP 3: Build DrillDownMap component at src/components/map/DrillDownMap.tsx
  BEHAVIOR:
  Level 0 (Homepage): Full India SVG map
    - Active states (Karnataka) highlighted in #2563EB at 15% opacity
    - Locked states: #E8E8E4 fill, cursor not-allowed, tooltip "🔒 Coming Soon"
    - On click active state → router.push('/en/karnataka/')
    - Smooth zoom animation using react-simple-maps ZoomableGroup

  Level 1 (State page /en/karnataka/):
    - Karnataka SVG showing all 31 districts
    - Active districts (Mandya, Mysuru) in #2563EB at 15%, hover #EFF6FF
    - Locked districts: gray + "🔒 Coming Soon" tooltip
    - On click active district → router.push('/en/karnataka/mandya/')

  Level 2 (District page /en/karnataka/mandya/):
    - Mandya district SVG showing 7 taluks
    - Each taluk clickable → shows taluk info panel (NOT full taluk page — see Phase 5)
    - Labels: taluk name in Plus Jakarta Sans 12px
    - Color intensity based on population or any available metric

  VISUAL STYLE (match design system):
    Boundaries: 1px #E8E8E4
    Active fill: #2563EB at 15% opacity
    Hover: #EFF6FF with 200ms transition
    Labels: Plus Jakarta Sans 12px #6B6B6B
    Background: transparent on #FAFAF8
    Selected: #EFF6FF with 2px #2563EB border

  RESPONSIVE:
    Unified scrollable layout for all screen sizes
    Desktop: 2-col grid (60% map + 40% district cards), rest stacked below
    Tablet/Mobile: fully stacked, single column
    Min touch target: 44×44px for each region

  FALLBACK: If GeoJSON fails to load, show a grid-based selector:
    Cards for each state/district/taluk with name + key stat

  BREADCRUMB INTEGRATION:
    The map state should sync with the breadcrumb navigation:
    🇮🇳 India > [Karnataka ▾] > [Mandya ▾]
    Clicking breadcrumb item also updates map zoom level

STEP 4: Replace ALL existing Leaflet/map references across the codebase
  - Homepage hero section
  - Overview dashboard map widget
  - Any module that shows a map (Offices, Alerts, etc.)
  - For Offices/Alerts that need pin-based maps, use a SEPARATE
    lightweight Leaflet instance OR react-simple-maps markers

STEP 5: Test
  - Click India → Karnataka navigates to /en/karnataka/
  - Click Karnataka → Mandya navigates to /en/karnataka/mandya/
  - Click Mandya → Srirangapatna shows taluk info
  - Mobile: touch works, no tiny tap targets
  - Fallback: disable JS, grid selector appears
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 2: LAYOUT FIXES (Footer, Timer, Bottom Bar)
# ═══════════════════════════════════════════════════════════

```
PRIORITY: HIGH — UI polish, directly visible to users

TASK A: REMOVE BOTTOM MOBILE TAB BAR
  The bottom navigation bar showing:
  [Overview] [Crop Prices] [Weather & Rainfall] [News & Updates] [More]
  REMOVE IT COMPLETELY from all pages.
  Delete the MobileTabNav component or its usage.
  Users will use the sidebar / hamburger menu on mobile instead.

TASK B: SWAP FOOTER SECTIONS
  CURRENT (wrong order):
    TOP:    "ForThePeople.in — Independent citizen initiative... | About | Privacy..."
    BOTTOM: "Data sourced under NDSAP Open Data Policy · Built for citizens | 13:09 IST"

  NEW ORDER:
    TOP:    "Data sourced under NDSAP Open Data Policy · Built for the citizens of India | [LIVE CLOCK IST]"
    BOTTOM: "ForThePeople.in — Independent citizen initiative. NOT an official government website.
             Data under NDSAP. Disclaimer | About | Privacy | Contribute | Feedback | Support ❤️ | Built by Jayanth M B"

  ALSO: Remove the redundant middle section entirely if there are 3 sections.
  Keep ONLY 2 footer rows as described above.

TASK C: ADD LIVE TIMER TO TOP OF DASHBOARD
  At the very top of the district dashboard page (above the hero/overview section),
  add a slim status bar (32px height, #FAFAF8 bg, 1px bottom border #E8E8E4):

  LEFT SIDE:  "📍 Mandya District, Karnataka" (or current district)
  CENTER:     Live IST clock — "Wednesday, 18 March 2026 | 13:45:22 IST"
              Updates every second. Use JetBrains Mono for the time.
  RIGHT SIDE: "🟢 Live" or "🔴 Offline" indicator
              Green if data was fetched within last 30 min, red otherwise.

  This bar should be FIXED at the top (sticky) and visible on scroll.
  On mobile: show only clock + live indicator (hide district name to save space).

TASK D: Clean up any duplicate footers, status bars, or refresh indicators
  - Merge the existing RefreshIndicator into the new top status bar
  - Remove any redundant time displays
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 3: AI INTELLIGENCE OPINIONS (Core Feature)
# ═══════════════════════════════════════════════════════════

```
PRIORITY: HIGH — This is the WorldMonitor-inspired killer feature

TASK: Add AI-powered contextual opinions to EVERY dashboard module.
      Uses existing Gemini 2.5 Flash (GEMINI_API_KEY).
      Inspired by WorldMonitor's "AI Intelligence Synthesis" approach.

CONCEPT: "District Intelligence" — After every data update, AI analyzes the data
         and provides a short, actionable insight. NOT just data display — INTERPRETATION.

STEP 1: Create AIOpinionEngine at src/lib/ai-opinions.ts

  Function: generateDistrictInsight(module, data, districtContext)
  - Takes: module name, current data, district metadata
  - Calls Gemini 2.5 Flash with structured prompt
  - Returns: { opinion: string, severity: 'good'|'warning'|'critical'|'info',
               recommendation: string, comparedTo: string }
  - Cache opinions in Redis for 30 minutes (don't call Gemini on every page load)
  - Max 200 words per opinion

STEP 2: Create Gemini prompt template

  SYSTEM PROMPT FOR GEMINI:
  """
  You are the District Intelligence Analyst for ForThePeople.in, a citizen transparency
  platform for Indian districts. You analyze real-time government data and provide
  brief, actionable insights for citizens.

  Rules:
  - Be factual, cite the numbers from the data provided
  - Compare to national/state averages when available
  - Give a clear verdict: is this good, bad, or concerning?
  - Suggest one actionable step citizens can take
  - Use simple language (8th grade reading level)
  - Be specific to the district, not generic advice
  - Max 150 words
  - If data is stale (>24hr old), mention it
  - Format: Start with an emoji verdict, then the analysis
  """

STEP 3: Create API endpoint at /api/ai/insight
  - Params: ?module=weather&district=mandya
  - Returns cached insight or generates fresh one
  - Rate limit: max 50 Gemini calls per hour across all modules

STEP 4: Create AIInsightCard component at src/components/common/AIInsightCard.tsx
  DESIGN:
  - Subtle card with left border (color = severity)
    - Green border (#16A34A) = good
    - Amber border (#D97706) = warning
    - Red border (#DC2626) = critical
    - Blue border (#2563EB) = info
  - Header: "🤖 District Intelligence" in small caps
  - Body: The AI opinion text
  - Footer: "Based on data from [source] · Updated [time ago]"
  - Collapsible on mobile (shows first 2 lines + "Read more")
  - Small "✨ AI-generated insight" badge

STEP 5: Add AIInsightCard to EVERY module page. Here are the prompts per module:

  WEATHER & RAINFALL:
    Input: current temp, humidity, rainfall, historical normal
    AI says: "⚠️ Mandya recorded 12mm rainfall today against a March normal of 5mm.
    This is 140% above average. Farmers should delay fertilizer application.
    Current humidity at 82% increases fungal disease risk for paddy crops."

  WATER & DAMS:
    Input: current level, FRL, inflow, outflow, storage %
    AI says: "🟢 KRS Dam at 72% capacity (89.5 ft vs FRL 124.8 ft). Inflow: 2,340 cusecs,
    Outflow: 1,850 cusecs — net positive. At current rates, dam will reach 80% by April 15.
    This is healthy for kharif season preparation. Compare: same date last year was 65%."

  CROP PRICES:
    Input: today's prices, yesterday's prices, MSP, weekly trend
    AI says: "📈 Paddy modal price ₹2,450/quintal in Mandya APMC — ₹200 above MSP (₹2,250).
    Price rose 3.2% this week. Sugarcane at ₹3,150 is stable.
    Tip: If you're selling paddy, current prices are favorable — above both MSP and
    the district's 30-day average of ₹2,380."

  FINANCE & BUDGET:
    Input: allocated, released, spent, lapsed
    AI says: "🔴 Mandya has ₹47.2 Cr in LAPSED funds this fiscal year — money allocated
    but never spent. Education dept worst: ₹12.3 Cr lapsed (26% of allocation).
    This means schools lost ₹12.3 Cr that was meant for them.
    Citizens: File RTI to ask WHY Education funds were not utilized."

  POPULATION & DEMOGRAPHICS:
    Input: population, literacy, sex ratio, density
    AI says: "ℹ️ Mandya's sex ratio is 998 (females per 1000 males) — among Karnataka's best.
    Literacy at 70.4% is below state average of 75.6%.
    Urban population growing 2.1% annually — Mandya town density increasing."

  POLICE & TRAFFIC:
    Input: crime stats, traffic collections, pendency
    AI says: "⚠️ Traffic fine collection up 34% this month (₹18.7L vs ₹13.9L last month).
    Increased enforcement on NH-275. Theft cases up 12% YoY — most in Mandya town.
    Tip: Report suspicious activity to Mandya SP helpline: 08232-XXXXXX."

  SCHOOLS:
    Input: pass rates, student-teacher ratio, infrastructure
    AI says: "📊 Mandya SSLC pass rate: 71.2% — below state avg 73.8%.
    Government schools at 64.3% vs private at 82.1%.
    Student-teacher ratio: 32:1 (ideal is 30:1). 23 schools lack functional labs."

  GOVERNMENT SCHEMES:
    Input: active schemes, beneficiary count, coverage
    AI says: "ℹ️ 12 active central schemes in Mandya. PM-KISAN covers 89,000 farmers (72% eligible).
    PMAY-G: 2,340 houses sanctioned, only 1,120 completed (47.8%).
    Tip: Check Seva Sindhu portal for your eligibility — 3 new state schemes launched this month."

  HOUSING:
    Input: PMAY data, sanctioned, completed, pending
    AI says: "⚠️ Only 47.8% of sanctioned houses completed under PMAY-G in Mandya.
    1,220 houses stuck 'in progress' for 6+ months. Funds released: ₹34 Cr of ₹52 Cr allocated.
    This is below Karnataka state average completion of 61%."

  POWER & OUTAGES:
    Input: scheduled cuts, unscheduled frequency
    AI says: "⚡ 3 scheduled power cuts today in Mandya taluk (total 6 hours).
    Unscheduled outages averaged 2.1 per day this week — up from 1.4 last week.
    CESC complaint number: 1912. Average resolution time: 3.2 hours."

  COURTS:
    Input: pending cases, disposal rate
    AI says: "⚖️ 4,230 cases pending in Mandya District Court. Disposal rate: 62%.
    Average case age: 2.3 years. Civil cases backlog growing 5% quarterly.
    For case status: ecourts.gov.in → District: Mandya."

  GRAM PANCHAYAT / MGNREGA:
    Input: fund utilization, works completed
    AI says: "🏘️ MGNREGA fund utilization in Mandya: 68%. ₹4.2 Cr unutilized.
    Average days of employment per household: 42 (target: 100).
    Top performing GP: Melkote (94% utilization). Lowest: Basaralu (31%)."

  JJM WATER SUPPLY:
    Input: coverage %, taluk-wise
    AI says: "💧 Mandya JJM tap water coverage: 76.8%. Srirangapatna best at 91%.
    K R Pete lowest at 58% — 4,200 households still without tap connection.
    National target is 100% by 2024 — Mandya is behind schedule."

  ELECTIONS:
    Input: last results, turnout
    AI says: "🗳️ Last Assembly election turnout: 72.3% (state avg: 68.9%).
    Mandya constituency historically swings — margin was only 12,000 votes in 2023.
    Next local body elections due in [date]. Check your voter status: nvsp.in"

  RTI:
    Input: filed, disposed, pending, avg days
    AI says: "📋 RTI response rate in Mandya: 78%. Average response: 34 days
    (legal limit: 30 days). Revenue dept slowest at 48 days.
    Tip: If no response in 30 days, file First Appeal to Appellate Authority."

  TRANSPORT:
    Input: routes, frequency
    AI says: "🚌 12 KSRTC buses daily from Mandya to Bengaluru (3hr).
    Peak hours (7-9 AM): 90%+ occupancy. Consider 6 AM departure for seats.
    Mandya Junction: 8 daily trains to Mysuru (45 min), 4 to Bengaluru (3.5 hr)."

  LOCAL ALERTS:
    Input: active alerts
    AI says: Dynamic — summarize current active alerts with severity assessment.

  CITIZEN CORNER (MY RESPONSIBILITY):
    See Phase 4 — fully personalized by AI.

  FAMOUS PERSONALITIES:
    Input: personalities from DB
    AI says: "Notable people from Mandya include [names]. [Recent news context if available]."

STEP 6: Create a background job that refreshes AI opinions
  - On every data update (scraper success), regenerate opinion for that module
  - Store in Redis with key: `ai:insight:{district}:{module}`
  - TTL: 30 minutes for fast-changing (weather, crops), 6 hours for slow (population, schools)
  - If Gemini API fails, show last cached opinion with "⏳ Insight from [time]" note
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 4: CITIZEN CORNER — AI PERSONALIZED BY LOCATION
# ═══════════════════════════════════════════════════════════

```
PRIORITY: HIGH — Currently not personalized

TASK: Make "My Responsibility" / Citizen Corner fully personalized by AI
      based on the user's district/taluk, current season, and active data.

STEP 1: Redesign Citizen Corner page
  REMOVE: Static, generic tips
  ADD: AI-generated, location-aware, season-aware citizen responsibilities

STEP 2: Create /api/ai/citizen-tips endpoint
  Input: district, taluk (optional), current month, active alerts, weather, schemes
  
  Gemini prompt:
  """
  Generate 10-15 personalized citizen responsibility tips for a resident of
  {district}, {state} for the month of {month} {year}.

  Context:
  - Current weather: {weather_summary}
  - Active alerts: {alerts_summary}
  - Active schemes with open enrollment: {schemes_summary}
  - Recent news: {news_summary}
  - Local crop season: {crop_info}
  - Water situation: {dam_summary}

  Rules:
  - Be SPECIFIC to this district, not generic India advice
  - Include specific dates, deadlines, office names, phone numbers where possible
  - Group by category: Water, Agriculture, Health, Finance, Education, Safety, Civic
  - Each tip: emoji + title + 2-3 sentence actionable description
  - Include seasonal tips (e.g., "monsoon prep" in June, "tax filing" in March)
  - Include tips about active government schemes they should apply for
  - If there are active alerts (flood, power cut), add emergency tips
  - No fluff — every tip must have a concrete action
  - Mix of "protect yourself" and "help your community" tips
  """

STEP 3: Display as beautiful card grid
  - Category tabs: All | Water | Agriculture | Health | Finance | Safety | Civic
  - Each tip: card with emoji icon, title, description, "Learn more" link if applicable
  - Seasonal badge: "🌧️ Monsoon Special" or "📊 Tax Season"
  - "Last personalized: 2 hours ago" timestamp
  - Refresh button to regenerate

STEP 4: Cache in Redis per district per month (TTL: 6 hours)
  Key: `citizen:tips:{district}:{month}:{year}`

NO CHARACTER LIMIT — generate as many tips as are genuinely useful.
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 5: FIX BROKEN FEATURES
# ═══════════════════════════════════════════════════════════

```
PRIORITY: HIGH — These are bugs, not features

TASK A: FIX LOCAL NEWS & UPDATES
  Current state: Not working at all.
  
  Root cause investigation:
  1. Check if NewsItem table has any data → if empty, the RSS scraper never ran
  2. Check /api/data/news endpoint → does it return data?
  3. Check the News page component → is it calling the right endpoint?
  
  FIX:
  - Create a one-time seed script that fetches recent news:
    Fetch Google News RSS: https://news.google.com/rss/search?q=Mandya+Karnataka&hl=en-IN&gl=IN
    Parse with rss-parser
    Insert into NewsItem table (districtId for Mandya)
    Also fetch for: Mysuru+Karnataka if Mysuru is active
  - Ensure the News page component displays articles correctly:
    - Timeline layout (newest first)
    - Each item: title, source, published time, category badge, external link icon
    - "Open article ↗" link (opens in new tab)
    - Category filter: All | Politics | Development | Crime | Agriculture | Sports
  - Add "auto-categorize" using simple keyword matching:
    "road|highway|bridge" → Development
    "MLA|MP|minister|election" → Politics
    "police|crime|theft|accident" → Crime
    "crop|farm|rain|dam" → Agriculture
  - Add AI summary for top 3 news items (Gemini generates 1-line summary)

TASK B: FIX FAMOUS PERSONALITIES
  Current state: Not returning data / broken.
  
  1. Check if FamousPersonality model exists in Prisma schema
     - If NOT: Add the model:
       model FamousPersonality {
         id          String   @id @default(cuid())
         districtId  String
         district    District @relation(fields: [districtId], references: [id])
         name        String
         nameLocal   String?
         category    String   // "Politics", "Cinema", "Literature", "Sports", "Freedom Fighter", "Science"
         description String
         descriptionLocal String?
         birthYear   Int?
         deathYear   Int?
         birthPlace  String?
         photoUrl    String?  // Wikipedia Commons CC-licensed
         photoLicense String?
         wikiUrl     String?
         achievements String[]
         isFeatured  Boolean @default(false)
         active      Boolean @default(true)
         createdAt   DateTime @default(now())
       }
     - Add relation to District model
     - npx prisma db push

  2. Seed with REAL famous personalities from Mandya:
     - Tipu Sultan (Srirangapatna) — Freedom Fighter
     - Kuvempu (Mandya connection) — Literature
     - Others: look up real data for Mandya-born/connected personalities
     - Include Wikipedia photo URLs (CC-licensed only)
     - Also seed for Mysuru if active

  3. Create/fix API endpoint: /api/data/famous-personalities
  4. Create/fix the Famous Personalities page component
     - Card grid with photo, name, category badge, birth-death years
     - Click to expand: full description, achievements, Wikipedia link
     - Category filter tabs
     - AI insight: "✨ Recently in news" badge if name appears in NewsItem table

TASK C: FIX GOVERNMENT SCHEME LINKS
  Current state: Links not working properly.
  
  1. Check Scheme model data — are applyUrl fields populated?
  2. If URLs are empty or broken:
     - Seed real scheme URLs:
       PM-KISAN: https://pmkisan.gov.in
       PMAY-G: https://pmayg.nic.in
       MGNREGA: https://nrega.nic.in
       PM-SVANidhi: https://pmsvanidhi.mohua.gov.in
       Seva Sindhu (Karnataka): https://sevasindhu.karnataka.gov.in
       DBT schemes: https://dbtkarnataka.gov.in
     - Each scheme card should have: "Apply Now ↗" button that opens URL in new tab
     - If URL is null, show "Visit your local Taluk office" instead
  3. Fix the Schemes page:
     - Category filter: All | Central | State | District
     - Eligibility section (expandable)
     - "Check if you qualify" expandable checklist
     - Apply link (verified working URL)

TASK D: FIX TALUK PAGES — SIMPLIFY
  Current state: Full taluk pages that may be broken.
  
  NEW BEHAVIOR:
  - DO NOT show a full taluk dashboard page
  - Instead, on the district overview map, when user clicks a taluk:
    Show a SLIDE-IN PANEL (right side on desktop, bottom sheet on mobile) with:
    - Taluk name (English + Kannada)
    - Tagline (e.g., "Sugar Capital of Karnataka")
    - Key stats: Population, Area, Villages count, Literacy rate
    - 3-4 key data points from the district data filtered to that taluk
    - "Coming Soon: Full taluk dashboard" message
  - Remove taluk-level routing for now (/en/karnataka/mandya/srirangapatna/)
    OR keep the route but redirect to district page with taluk panel open
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 6: REMAINING NEW FEATURES (Free ones)
# ═══════════════════════════════════════════════════════════

```
PRIORITY: MEDIUM — Adds value, no cost

TASK A: SEARCH FUNCTIONALITY
  Add a global search bar in the header.
  - Searches across: modules, schemes, offices, services, news, leaders, villages
  - Keyboard shortcut: Cmd+K / Ctrl+K to open search overlay
  - Shows results grouped by category
  - Click result → navigates to that module/item
  - "How do I get a caste certificate?" → Routes to Services Guide
  - "KRS dam level" → Routes to Water & Dams module
  - Use simple text matching against DB, not a search engine

TASK B: WHATSAPP SHARING
  On every data card and AI insight card, add a share button:
  - Icon: WhatsApp green icon (from Lucide or custom SVG)
  - On click: opens https://wa.me/?text={encodedText}
  - Text format:
    "📊 Mandya District Update
    {module}: {key stat}
    {AI insight summary}
    Source: forthepeople.in/en/karnataka/mandya/{module}
    #ForThePeople #Mandya"

TASK C: DATA EXPORT (CSV)
  On data-heavy modules (Crop Prices, Budget, Schools, Elections), add:
  - "📥 Download CSV" button
  - Generates CSV from current displayed data
  - Filename: forthepeople_{district}_{module}_{date}.csv

TASK D: PWA SETUP
  - Add manifest.json (app name, icons, theme color #2563EB, bg #FAFAF8)
  - Add service worker for offline caching of:
    - Static pages (layout, navigation)
    - Last fetched data (so app works offline with stale data)
    - Show "📡 Offline — showing cached data from [time]" banner when offline
  - Add install prompt: "Add ForThePeople to Home Screen" on mobile

TASK E: SEO PER MODULE
  - Each module page: generateMetadata() with:
    title: "Mandya {Module Name} — ForThePeople.in"
    description: Dynamic based on latest data point
    OG image: generate or use a template image
  - Add JSON-LD structured data (GovernmentService, Dataset schemas)
  - sitemap.xml: all active district + module combinations

TASK F: PUSH NOTIFICATIONS (Web Push)
  - Add Firebase Cloud Messaging (FCM) — free tier
  - Users can subscribe to alerts for their district
  - Trigger on: new LocalAlert with severity "warning" or "danger"
  - Notification: "{alert title} — {district name}"
  - Notification settings page: choose which categories to receive
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 7: RAILWAY SCRAPER SETUP (Run after Railway activates)
# ═══════════════════════════════════════════════════════════

```
PRIORITY: CRITICAL — Without this, data is static

TASK: Set up Railway.app background worker for all scrapers.
      Run this phase AFTER Railway account is activated (12 hours from now).

STEP 1: Create scraper worker project structure
  /scraper/
    package.json
    tsconfig.json
    src/
      index.ts          — Main entry, starts scheduler
      scheduler.ts      — node-cron schedules for all jobs
      config.ts         — Environment variables, rate limits
      jobs/
        weather.ts      — OpenWeatherMap API → WeatherReading
        crop-prices.ts  — data.gov.in AGMARKNET → CropPrice
        news-rss.ts     — Google News RSS → NewsItem
        dam-levels.ts   — Karnataka water resources → DamReading
        alerts.ts       — News RSS keywords → LocalAlert (autoGenerated)
      lib/
        db.ts           — Prisma client
        redis.ts        — Upstash Redis client
        logger.ts       — Structured logging
        rate-limiter.ts — 1 request per 2-3 seconds per domain

STEP 2: Implement each scraper job:
  WEATHER (every 5 min):
    Fetch OpenWeatherMap for each active district
    Use OWM_CITY map for correct city names
    Upsert into WeatherReading
    Invalidate Redis cache: `data:weather:{district}`

  CROP PRICES (every 15 min, 6AM-8PM IST):
    Fetch data.gov.in AGMARKNET API
    Use AGMARKNET_DISTRICT/STATE maps for correct names
    Upsert into CropPrice (match on commodity+market+date)
    Invalidate Redis cache: `data:crop-prices:{district}`

  NEWS (every 1 hour):
    Fetch Google News RSS for each active district
    Parse with rss-parser
    Deduplicate by URL
    Insert new items into NewsItem
    Auto-categorize by keywords
    Invalidate Redis cache: `data:news:{district}`

  DAM LEVELS (every 30 min):
    Scrape Karnataka water resources portal
    Parse with Cheerio (or Puppeteer if ASP.NET)
    Upsert DamReading for KRS, Hemavathi dams
    Invalidate Redis cache: `data:dam-levels:{district}`

  ALERTS (every 2 hours):
    Fetch Google News RSS for: "{district} road closure" "power cut" "flood"
    Parse headlines, extract alert type
    Create LocalAlert entries with autoGenerated=true
    Auto-expire old alerts (>48 hours)

STEP 3: AI News Intelligence (every 2 hours, after news scrape):
    Run the existing AI News Intelligence pipeline
    (See AI-NEWS-INTELLIGENCE-SKILL.md for full spec)
    After news scrape → Context retrieval → Gemini analysis → Decision engine

STEP 4: AI Opinion Refresh (after any scraper success):
    After each scraper updates data, regenerate AI opinions for that module
    Call /api/ai/insight internally or run generateDistrictInsight() directly

STEP 5: Railway deployment config
  railway.json:
  {
    "build": { "builder": "NIXPACKS" },
    "deploy": {
      "startCommand": "npm run start",
      "healthcheckPath": "/health",
      "restartPolicyType": "ON_FAILURE"
    }
  }

  Environment variables on Railway:
    DATABASE_URL (Neon connection string)
    UPSTASH_REDIS_REST_URL
    UPSTASH_REDIS_REST_TOKEN
    DATA_GOV_API_KEY
    OPENWEATHER_API_KEY
    GEMINI_API_KEY

STEP 6: Health check endpoint
  GET /health → returns { status: "ok", scrapers: { weather: "2m ago", ... } }

STEP 7: Admin dashboard integration
  Update /en/admin/ page to show:
  - Scraper status (running/stopped/error per job)
  - Last run time per scraper
  - Records inserted/updated counts
  - Error logs (last 50)
  - Manual "Run Now" button per scraper
```

---

# ═══════════════════════════════════════════════════════════
# PHASE 8: POLISH + DARK MODE + ACCESSIBILITY
# ═══════════════════════════════════════════════════════════

```
PRIORITY: MEDIUM — Final polish

TASK A: DARK MODE
  Add dark mode toggle in header.
  Dark palette (from FORTHEPEOPLE-SKILL-UPDATED.md):
    Background:     #0F0F0F
    Surface:        #1A1A1A
    Border:         #2A2A2A
    Text Primary:   #F5F5F5
    Text Secondary: #A0A0A0
    Text Muted:     #666666
    Accent colors:  Same as light mode
  Use Tailwind dark: classes.
  Store preference in localStorage.
  Respect system preference (prefers-color-scheme).

TASK B: ACCESSIBILITY
  - All images: alt text
  - All interactive elements: ARIA labels
  - All charts: aria-label with data summary text
  - Keyboard navigation: Tab through all interactive elements
  - Skip navigation link
  - Color contrast: WCAG AA minimum (4.5:1 for text)
  - Focus indicators: visible 2px #2563EB outline on focus
  - Screen reader: test with VoiceOver

TASK C: PERFORMANCE OPTIMIZATION
  - Lazy load all chart components (Recharts is heavy)
  - Lazy load map GeoJSON (load on viewport intersection)
  - Image optimization: next/image for all images
  - Code split each module page
  - Target: Lighthouse 90+ on mobile
  - Add loading skeletons for every data card

TASK D: ERROR HANDLING
  - Every API call: try/catch with user-friendly error message
  - Module-level error boundary: "Couldn't load {module}. Showing cached data."
  - Global 404 page: "This page doesn't exist yet. Browse available modules."
  - Global 500 page: "Something went wrong. We're working on it."
  - Offline detection: show banner with last sync time

TASK E: DISTRICT COMPARISON (Bonus)
  New page: /en/compare?a=mandya&b=mysuru
  - Side-by-side comparison of any two active districts
  - Key metrics: population, literacy, sex ratio, budget utilization, dam levels
  - Bar charts showing relative performance
  - AI comparison insight: "Mandya outperforms Mysuru in water coverage (76% vs 68%)
    but lags in school pass rates (71% vs 78%)."
```

---

# ═══════════════════════════════════════════════════════════
# AFTER EVERY PHASE: UPDATE THESE FILES
# ═══════════════════════════════════════════════════════════

```
MANDATORY: After completing each phase, Claude Code MUST:

1. UPDATE BLUEPRINT-UNIFIED.md:
   - Add new models/components/routes created
   - Update PROGRESS TRACKER
   - Add any new design tokens or conventions established

2. UPDATE FORTHEPEOPLE-SKILL-UPDATED.md:
   - Update "Current Project State" section
   - Add new modules/features to the list
   - Update architecture if anything changed

3. UPDATE this CLAUDE-CODE-MASTER-PROMPT.md:
   - Mark phase as [✓] COMPLETE in PROGRESS TRACKER below
   - Add any notes about deviations or issues encountered

4. GIT COMMIT with descriptive message:
   git add -A
   git commit -m "Phase N: [description of what was done]"
   git push origin main
```

---

# ═══════════════════════════════════════════════════════════
# PROGRESS TRACKER
# ═══════════════════════════════════════════════════════════

```
Phase 1: Map Replacement (react-simple-maps)       [ ] NOT STARTED
Phase 2: Layout Fixes (footer, timer, bottom bar)   [ ] NOT STARTED
Phase 3: AI Intelligence Opinions (all modules)      [ ] NOT STARTED
Phase 4: Citizen Corner (AI personalized)            [ ] NOT STARTED
Phase 5: Fix Broken (News, Famous, Schemes, Taluk)   [ ] NOT STARTED
Phase 6: New Features (Search, WhatsApp, PWA, SEO)   [ ] NOT STARTED
Phase 7: Railway Scraper Setup                       [ ] NOT STARTED — waiting for Railway activation
Phase 8: Polish (Dark mode, A11y, Performance)       [ ] NOT STARTED
```

# END OF MASTER PROMPT
