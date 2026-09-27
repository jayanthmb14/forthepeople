# CLAUDE CODE MASTER PROMPT — COMPLETE UI/UX OVERHAUL + FIXES
# ═══════════════════════════════════════════════════════════
# Read docs/BLUEPRINT-UNIFIED.md and FORTHEPEOPLE-SKILL-UPDATED.md first.
# Execute ALL tasks in ONE session. Deploy ONCE at the end.
#
# ⚠️ CRITICAL RULES:
# 1. DO NOT TOUCH the India map component (react-simple-maps). It works. It's fragile.
# 2. ALL changes must be GENERIC — not per-district. One codebase serves all districts.
# 3. Use @upstash/redis (NOT ioredis) for all Redis operations.
# 4. Mobile-first: EVERY change must work on 360px width (₹8000 Android phones).
# 5. Deploy ONCE at the end to save Vercel build minutes.
# ═══════════════════════════════════════════════════════════

## CONTEXT

```
Project:       ForThePeople.in — India's citizen transparency platform
Live URL:      https://forthepeople.in
Stack:         Next.js 16 + TypeScript + Tailwind CSS v4 + Prisma + Neon PostgreSQL + Upstash Redis
AI:            Google Gemini 2.5 Flash
Maps:          react-simple-maps (DO NOT TOUCH)
Pilot:         Mandya, Mysuru, Bengaluru Urban (Karnataka)
Deployed on:   Vercel
```

---

## TASK 1: DISABLE DARK MODE COMPLETELY

Dark mode is broken — header goes black, elements invisible, inconsistent across pages.
Remove dark mode entirely. This is a light-theme-only product.

### Actions:
1. Remove the dark mode toggle button from the header (the sun/moon icon)
2. Remove ALL dark mode CSS classes throughout the codebase:
   - Remove all `dark:` prefixed Tailwind classes
   - Remove any `classList.toggle('dark')` or theme switching JS
   - Remove any `prefers-color-scheme` media queries
   - Remove dark mode from any ThemeProvider or context
3. Set the HTML element to always use light mode:
   - `<html className="light">` or remove class-based theming entirely
4. Ensure background is always #FAFAF8 (warm off-white)
5. Verify every page renders correctly in light mode only after removing dark classes

DO NOT leave any dark mode artifacts. Clean removal.

---

## TASK 2: FIX BREADCRUMB NAVIGATION (Make It Functional)

The breadcrumb "🇮🇳 India > Select State > ..." is currently non-clickable and non-functional.
Make it a fully working drill-down navigation.

### Breadcrumb Behavior:

**On Homepage:**
```
🇮🇳 India > Select State ▾
```

**After selecting state:**
```
🇮🇳 India > Karnataka ▾ > Select District ▾
```

**After selecting district:**
```
🇮🇳 India > Karnataka ▾ > Mandya ▾ > Select Taluk ▾
```

### Implementation:

1. **"India"** — Always clickable, links to `/en` (homepage)

2. **"Select State" dropdown:**
   - Shows ALL 28 states + 8 UTs in a dropdown/popover
   - Active states (Karnataka): shown in normal text, clickable, with 🟢 green dot
   - Locked states: shown in gray text with 🔒 icon, NOT clickable
   - Clicking active state navigates to `/en/karnataka`
   - Dropdown should be searchable (type to filter)

3. **"Select District" dropdown (after state selected):**
   - Shows ALL districts for that state
   - Live districts (Mandya, Mysuru, Bengaluru Urban): green 🟢, clickable
   - Locked districts: gray 🔒, not clickable
   - Clicking navigates to `/en/karnataka/mandya`

4. **"Select Taluk" dropdown (after district selected):**
   - Shows all taluks for that district
   - All clickable (taluks within active districts are all active)

### Styling:
- Each dropdown: max-height 300px, scrollable, with search input at top
- Active items: #1A1A1A text, #16A34A green dot before name
- Locked items: #9B9B9B text, 🔒 icon, cursor: not-allowed
- Dropdown background: #FFFFFF, border: 1px solid #E8E8E4, shadow, border-radius: 12px
- Mobile: dropdowns should be full-width bottom sheets (slide up from bottom)

### Mobile Breadcrumb:
On mobile (< 768px), compress breadcrumb to show only current level:
```
← Karnataka > Mandya ▾
```
Back arrow navigates up one level.

---

## TASK 3: LANGUAGE SELECTOR — SHOW ALL 22 + LOCK INACTIVE

Show all 22 scheduled Indian languages plus English. Lock all except English.

### Language List:
```typescript
const LANGUAGES = [
  { code: 'en', name: 'English', nameLocal: 'English', active: true },
  { code: 'kn', name: 'Kannada', nameLocal: 'ಕನ್ನಡ', active: false },
  { code: 'hi', name: 'Hindi', nameLocal: 'हिन्दी', active: false },
  { code: 'te', name: 'Telugu', nameLocal: 'తెలుగు', active: false },
  { code: 'ta', name: 'Tamil', nameLocal: 'தமிழ்', active: false },
  { code: 'ml', name: 'Malayalam', nameLocal: 'മലയാളം', active: false },
  { code: 'mr', name: 'Marathi', nameLocal: 'मराठी', active: false },
  { code: 'bn', name: 'Bengali', nameLocal: 'বাংলা', active: false },
  { code: 'gu', name: 'Gujarati', nameLocal: 'ગુજરાતી', active: false },
  { code: 'pa', name: 'Punjabi', nameLocal: 'ਪੰਜਾਬੀ', active: false },
  { code: 'or', name: 'Odia', nameLocal: 'ଓଡ଼ିଆ', active: false },
  { code: 'as', name: 'Assamese', nameLocal: 'অসমীয়া', active: false },
  { code: 'ur', name: 'Urdu', nameLocal: 'اردو', active: false },
  { code: 'sa', name: 'Sanskrit', nameLocal: 'संस्कृतम्', active: false },
  { code: 'ne', name: 'Nepali', nameLocal: 'नेपाली', active: false },
  { code: 'sd', name: 'Sindhi', nameLocal: 'سنڌي', active: false },
  { code: 'ks', name: 'Kashmiri', nameLocal: 'कॉशुर', active: false },
  { code: 'doi', name: 'Dogri', nameLocal: 'डोगरी', active: false },
  { code: 'kok', name: 'Konkani', nameLocal: 'कोंकणी', active: false },
  { code: 'mni', name: 'Manipuri', nameLocal: 'মৈতৈলোন্', active: false },
  { code: 'brx', name: 'Bodo', nameLocal: 'बड़ो', active: false },
  { code: 'sat', name: 'Santali', nameLocal: 'ᱥᱟᱱᱛᱟᱲᱤ', active: false },
  { code: 'mai', name: 'Maithili', nameLocal: 'मैथिली', active: false },
];
```

### Language Selector UI:
- Show as dropdown from the existing 🌐 globe icon in header
- Only English is active and clickable
- ALL other languages (including Kannada): gray text, 🔒 icon, "Coming Soon" tooltip on hover
- Active indicator: small green dot next to active languages
- On selection of active language, switch locale via next-intl

### Mobile:
- Language selector should open as a bottom sheet modal
- Show in 2 columns: nameLocal on left, English name on right

---

## TASK 4: MARKET TICKER ENHANCEMENT

The ticker is working but needs to be more engaging and show things people check daily.

### Improvements:
1. **Add more items people care about:**
   - Petrol price (Delhi benchmark): scrape from goodreturns.in/petrol-price
   - LPG cylinder price: scrape from goodreturns.in/lpg-price
   - Keep existing: Sensex, Nifty 50, Gold, Silver, USD/INR, Crude

2. **Better animation on mobile:**
   - Smooth infinite CSS scroll (currently working, keep it)
   - Add subtle fade gradient on left/right edges so it doesn't look cut off
   - Speed: 40 seconds per full loop

3. **Desktop: Make it slightly taller (48px) with better spacing**
   - Each item: icon/emoji + label + value + change badge
   - Add thin separator lines between items (1px #E8E8E4)

4. **Data freshness indicator:**
   - If market is open: show small green pulse dot at the start of ticker
   - If market closed: show "Market Closed" in gray at the start
   - Show "Updated X min ago" as the last item in the scroll

5. **Petrol/LPG scraping:**
   - Source: goodreturns.in (Cheerio scrape, same as gold/silver)
   - Cache: Redis TTL 6 hours (petrol price changes daily, not per-minute)
   - These don't change during the day, so long cache is fine

---

## TASK 5: DISTRICT OVERVIEW PAGE — COMPLETE REDESIGN

This is the MAIN page people land on after selecting a district. It needs to be
organized based on WHAT CITIZENS ACTUALLY SEARCH FOR.

### User Psychology — What Indian Citizens Search For (in priority order):
```
1. Weather — "What's the weather today?" (daily check)
2. Crop/Mandi Prices — Farmers check EVERY morning
3. Dam/Water Levels — Critical for agriculture + drinking water
4. News — "What's happening in my district?"
5. Government Schemes — "Am I eligible for any scheme?"
6. Services Guide — "How do I get a caste certificate?"
7. Bus/Train Schedule — "When is the next bus to Bangalore?"
8. Power Outages — "When will power come back?"
9. Leadership — "Who is my MLA/MP?"
10. Budget — Where is the money going?
```

### New Overview Page Layout (Top to Bottom):

**Section 1: District Header (existing — keep but improve)**
- District name + Kannada name + tagline
- Key stats: Population, Area, Literacy, Taluks
- Remove the blue gradient background — use clean white with subtle border

**Section 2: LIVE DATA CARDS (3 cards in a row, 1 column on mobile)**
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 🌦️ Weather •LIVE│ │ 🚰 Dam Levels   │ │ 🌾 Mandi Prices │
│                 │ │            •LIVE│ │            •LIVE│
│ 28°C Partly     │ │ KRS: 57.4%      │ │ Tomato   ₹800/q │
│ Cloudy          │ │ Hemavathi: 59.6% │ │ Banana ₹1,400/q │
│ Humidity: 65%   │ │                 │ │ Coconut₹9,800/q │
│ Wind: 12 km/h   │ │ [mini bar chart]│ │ Areca ₹35,000/q │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

If a card has NO DATA (like "No weather data" for Mandya), show a 
graceful fallback: "Weather data coming soon. We're setting up sensors 
for this district." with a muted icon. Do NOT show empty "No weather data" text.

**Section 3: LOCAL ALERTS (existing — keep, already looks good)**
- NH-275 road widening, KRS dam releasing water, etc.

**Section 4: ALL DATA MODULES — REDESIGNED AS THE HERO SECTION**

This is the USP. Show ALL 29 modules as a clean, organized grid.
Group them into categories with headers:

```
📊 LIVE DATA
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│🌾 Crop   │ │🌦️Weather│ │🚰 Water  │ │📈 Popul- │ │👮 Police │
│  Prices  │ │& Rainfall│ │ & Dams   │ │  ation   │ │& Traffic │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

🏛️ GOVERNANCE & SERVICES
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│👥 Leader-│ │💰Finance │ │📋Schemes │ │📋Services│ │📊 Elect- │
│  ship    │ │& Budget  │ │         │ │  Guide   │ │  ions    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

🏘️ COMMUNITY & INFRASTRUCTURE  
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│🚌 Trans- │ │💧 JJM    │ │🏠Housing │ │⚡ Power  │ │🎓Schools │
│  port    │ │Water     │ │Schemes   │ │& Outages │ │         │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

📜 TRANSPARENCY & RIGHTS
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│🏛️ RTI   │ │📜 File   │ │🏘️ Gram  │ │⚖️Courts │ │🏥Health  │
│ Tracker  │ │  RTI     │ │Panchayat │ │         │ │         │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

🤝 LOCAL INFO
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│⚠️ Alerts │ │🏢Offices │ │🤝Citizen │ │🌟Famous  │ │📰 News  │
│         │ │& Services│ │ Corner   │ │People    │ │         │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘

🏭 LOCAL ECONOMY
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│🏭 Local  │ │🌾 Farm   │ │🗺️Inter- │ │🔗 Data  │
│Industry  │ │Advisory  │ │active Map│ │Sources   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

### Module Card Design:
- Size: equal square tiles, 5 per row desktop, 3 per row tablet, 2 per row mobile
- Background: #FFFFFF, border: 1px solid #E8E8E4, border-radius: 12px
- Hover: lift shadow + #EFF6FF background
- Icon: emoji (NOT Lucide — emojis are more universally readable)
- Label: full text, NOT truncated (current "Interac...", "Leade..." is BAD)
- If module has live data: show small green "● LIVE" badge
- If module has no data yet: show in slightly faded style with "Coming soon" tooltip
- Each card links to the respective module page

### Mobile Module Grid:
- 2 columns, full-width cards
- Scrollable vertically
- Category headers as sticky section headers
- Text must NOT be truncated — use smaller font if needed (text-xs)

**Section 5: TALUKS IN [DISTRICT] (existing — keep)**
- Show taluk cards with basic stats

**Section 6: LEADERSHIP QUICK VIEW (existing — improve)**
- Show MP + MLAs in a horizontal scroll on mobile
- Show photos (not just initials) where available

**Section 7: DISTRICT SNAPSHOT STATS (existing — move to bottom)**
- Population, Area, Taluks, Villages, Literacy, Sex Ratio, Schemes, Schools

### Sidebar (Desktop):

Redesign the sidebar to match the categorized structure above:

```
QUICK ACCESS (always visible — top 5 most used):
  📊 Overview
  🌾 Crop Prices
  🌦️ Weather
  🚰 Water & Dams
  💰 Finance & Budget

ALL MODULES ▾ (expandable dropdown — shows categorized list)
  📊 LIVE DATA
    Crop Prices, Weather, Water & Dams, Population, Police
  🏛️ GOVERNANCE
    Leadership, Finance, Schemes, Services, Elections
  🏘️ COMMUNITY
    Transport, JJM, Housing, Power, Schools
  📜 TRANSPARENCY
    RTI Tracker, File RTI, Gram Panchayat, Courts, Health
  🤝 LOCAL
    Alerts, Offices, Citizen Corner, Famous People, News
  🏭 ECONOMY
    Local Industry, Farm Advisory, Interactive Map, Data Sources

⚖️ Compare Districts
```

### Mobile Sidebar:
- Replace the current broken sidebar with a hamburger menu
- OR: use the "All 26 modules" dropdown but fix it to show full names, not truncated
- Categories as accordion sections in the mobile menu
- Each module name must be FULLY visible (no "Interac...", "Leade...")

---

## TASK 6: SUPPORT PAGE — FIX DESIGN

The support page has a big ugly black box. Fix the design to match the light theme.

### Changes:
1. **Remove the dark/black "THE SCALE" box.** Replace with light design:
   - Background: #F0F4FF (light blue tint) or #FAFAF8 (same as page bg)
   - Text: #1A1A1A (dark)
   - Stats in JetBrains Mono with #2563EB (accent blue) for numbers
   - Use a clean card layout with subtle border instead of dark background

2. **"₹12 lakh / year to serve ALL of India" section redesign:**
```
┌─────────────────────────────────────────────────────────┐
│  THE SCALE                                               │
│                                                          │
│  ₹12 lakh / year to serve ALL of India                  │
│  780 districts × 29 dashboards = 22,620 live modules    │
│  Updated every 5-30 minutes from government portals      │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ ₹96K   │ │ 22,620 │ │ 5 min  │ │ ₹0     │           │
│  │ monthly│ │ modules│ │ refresh│ │ to     │           │
│  │ cost   │ │        │ │ rate   │ │citizens│           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
└─────────────────────────────────────────────────────────┘
```
   Background: #F8FAFC (very light gray-blue), NOT black
   Stat cards: white with border, numbers in #2563EB

3. **Cost at Scale cards:** Keep the 3-column comparison but add subtle 
   highlight to "All India" card (border: 2px solid #2563EB)

4. **Contribution tiers:** Clean card design, no heavy colors.
   "Most Popular" badge in #2563EB (blue), not orange/yellow.

5. **Personal message section:**
   - Simple blockquote style with left border
   - Photo of Jayanth (if available) or initials avatar
   - Clean, genuine, no heavy styling

6. **"Where Your Money Goes" pie chart:**
   - Use Recharts PieChart
   - Colors: accent palette from design system
   - Background: white card, not inside any dark container

7. **Mobile support page:**
   - Stack everything vertically
   - Contribution tier cards: full-width, stacked
   - Stat boxes: 2×2 grid on mobile

---

## TASK 7: SMART SCRAPING FREQUENCY (Cost Optimization)

Implement tiered scraping based on data change frequency. 
This reduces API calls by 70%+ without losing data freshness.

### Create `src/lib/scraping-config.ts`:

```typescript
export const SCRAPING_TIERS = {
  // TIER 1: Real-time data (changes multiple times per day)
  REALTIME: {
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    redisTTL: 300, // 5 min cache
    modules: ['weather', 'market-ticker'],
  },
  
  // TIER 2: Frequently updated (changes daily)
  DAILY: {
    refreshInterval: 60 * 60 * 1000, // 1 hour
    redisTTL: 3600, // 1 hour cache
    modules: ['crop-prices', 'dam-levels', 'news', 'power-outages', 'alerts'],
  },
  
  // TIER 3: Weekly updates
  WEEKLY: {
    refreshInterval: 6 * 60 * 60 * 1000, // 6 hours
    redisTTL: 21600, // 6 hour cache
    modules: ['jjm', 'housing', 'court-stats', 'rti-stats', 'police'],
  },
  
  // TIER 4: Monthly/Rarely changes
  MONTHLY: {
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours
    redisTTL: 86400, // 24 hour cache  
    modules: [
      'population', 'leadership', 'schools', 'schemes', 
      'service-guide', 'offices', 'transport', 'soil-health',
      'budget', 'elections', 'gram-panchayat', 'citizen-tips',
      'sugar-factories', 'agri-advisory', 'rti-templates',
    ],
  },
  
  // TIER 5: Lazy scraping — only fetch when someone visits the page
  ON_DEMAND: {
    redisTTL: 43200, // 12 hour cache
    modules: ['famous-personalities', 'infrastructure', 'health'],
  },
};
```

### Apply to existing API routes:
For each API route in `/api/data/`, read the tier config and:
1. Set the Redis TTL based on the tier (not hardcoded 30-60s for everything)
2. For ON_DEMAND modules: only scrape when the API is actually called
3. Return `meta.refreshInterval` matching the tier so frontend knows polling frequency

### Apply to useRealtimeData hook:
Update the hook to use the tier's refreshInterval instead of a fixed interval:
```typescript
// BEFORE: useRealtimeData('crop-prices', '/api/data/crop-prices', 15000)
// AFTER:  useRealtimeData('crop-prices', '/api/data/crop-prices') 
// Hook reads refreshInterval from the API response meta
```

---

## TASK 8: MOBILE RESPONSIVENESS AUDIT

Go through EVERY page and fix mobile layout issues.

### Key Mobile Fixes:

1. **Homepage:**
   - Market ticker: smooth scroll with fade edges (already working, add fade)
   - Map: full width, below the district list (not side-by-side)
   - District cards: full width, stacked
   - "Want your district next?": full width dropdown
   - Support CTA: full width

2. **District Overview:**
   - Live data cards: stack vertically (1 column)
   - Module grid: 2 columns, NO text truncation
   - Alerts: full width, slightly smaller font
   - Stats: horizontal scroll or 2×4 grid
   - Sidebar: hamburger menu or bottom sheet

3. **Module Pages (Crop Prices, Water & Dams, etc.):**
   - Tables: horizontal scroll wrapper
   - Charts: full width, min-height 250px
   - Cards: stack vertically

4. **Support Page:**
   - Contribution tiers: stack vertically
   - Stats grid: 2×2
   - All text readable at 14px minimum

5. **General:**
   - Min tap target: 44×44px everywhere
   - No horizontal overflow on any page (test on 360px)
   - Font sizes: minimum 14px for body text on mobile
   - Modals/dropdowns: use bottom sheets on mobile, not floating popovers

---

## TASK 9: HANDLE "NO DATA" GRACEFULLY

Some modules show "No weather data" or empty states. Fix ALL of them.

### Rules for Empty States:
1. NEVER show "No data" or "No weather data" as plain text
2. Instead, show a graceful card with:
   ```
   ┌─────────────────────────────────────────┐
   │  🌦️ Weather                              │
   │                                          │
   │  Data collection in progress              │
   │  We're setting up live weather feeds      │
   │  for this district.                       │
   │                                          │
   │  Expected: Within 1 week                  │
   └─────────────────────────────────────────┘
   ```
3. Use a muted color scheme (#F5F5F0 bg, #9B9B9B text)
4. Each module gets a custom "coming soon" message:
   - Weather: "Live weather feeds being configured"
   - Crop Prices: "Mandi price feeds being connected"
   - Dam Levels: "Reservoir monitoring being set up"
   - Default: "Data collection in progress for this district"

### Create `src/lib/empty-states.ts`:
```typescript
export const EMPTY_STATE_MESSAGES: Record<string, { title: string; message: string; icon: string }> = {
  weather: { title: 'Weather', message: 'Live weather feeds being configured for this district.', icon: '🌦️' },
  'crop-prices': { title: 'Crop Prices', message: 'Mandi price feeds being connected to local markets.', icon: '🌾' },
  'dam-levels': { title: 'Dam Levels', message: 'Reservoir monitoring being set up.', icon: '🚰' },
  news: { title: 'News', message: 'Local news aggregation being configured.', icon: '📰' },
  // ... add for ALL 29 modules
  default: { title: 'Data', message: 'Data collection in progress for this district.', icon: '📊' },
};
```

Create a reusable `<EmptyState module="weather" />` component used across all pages.

---

## TASK 10: UPDATE ALL PROJECT FILES

### 10A. Update docs/FORTHEPEOPLE-SKILL-UPDATED.md — Add:

```markdown
## UI/UX Overhaul (March 27, 2026)

### Dark Mode: REMOVED
- Light-only theme. #FAFAF8 background always.
- All dark: classes removed from codebase.

### Breadcrumb Navigation: FUNCTIONAL
- Drill-down: India → State (dropdown) → District (dropdown) → Taluk (dropdown)
- Active items: green dot, clickable. Locked: gray, 🔒, disabled.
- Mobile: compressed with back arrow.

### Language Selector: ALL 22 LANGUAGES
- English active only. 22 others (including Kannada) shown but locked with "Coming Soon".
- Bottom sheet on mobile.

### Module Organization: CATEGORIZED
- 29 modules grouped into 6 categories: Live Data, Governance, Community, 
  Transparency, Local Info, Local Economy
- Full names (no truncation), emoji icons, LIVE badges
- 5-col desktop, 2-col mobile grid

### Mobile: FULLY RESPONSIVE
- Bottom sheets for dropdowns, no floating popovers
- 360px minimum width tested
- 44×44px tap targets, 14px minimum font

### Smart Scraping Tiers
- REALTIME (5 min): weather, market ticker
- DAILY (1 hr): crops, dams, news, power, alerts  
- WEEKLY (6 hr): JJM, housing, courts, RTI, police
- MONTHLY (24 hr): population, leadership, schools, schemes, budget
- ON_DEMAND (12 hr): famous people, infrastructure, health

### Empty States
- Graceful "data collection in progress" cards for all modules without data
- Custom messages per module type

### Support Page
- Light theme only, no dark boxes
- Clean card design matching #FAFAF8 aesthetic
```

### 10B. Update docs/BLUEPRINT-UNIFIED.md Progress Tracker — Add:

```
POST-LAUNCH IMPROVEMENTS:
  Market Ticker                   [✓] COMPLETE
  Homepage Live Data Cards        [✓] COMPLETE
  Dark Mode Removal               [✓] COMPLETE
  Breadcrumb Navigation Fix       [✓] COMPLETE
  Language Selector (22 langs)    [✓] COMPLETE
  Module Grid Redesign            [✓] COMPLETE
  Mobile Responsiveness           [✓] COMPLETE
  Support Page Redesign           [✓] COMPLETE
  Smart Scraping Tiers            [✓] COMPLETE
  Empty State Handling            [✓] COMPLETE
  Shared AI Insights System       [✓] COMPLETE
  Google Search Console Fix       [✓] COMPLETE
  District Request Voting         [✓] COMPLETE
```

---

## EXECUTION ORDER

```
1.  Remove dark mode completely (Task 1) — fastest, affects everything
2.  Fix breadcrumb navigation (Task 2)
3.  Fix language selector (Task 3)  
4.  Market ticker enhancements (Task 4)
5.  District overview page redesign (Task 5) — biggest task
6.  Fix support page design (Task 6)
7.  Implement scraping tiers config (Task 7)
8.  Mobile responsiveness audit (Task 8)
9.  Empty state handling (Task 9)
10. Update project files (Task 10)
11. Test on desktop + mobile (360px Chrome DevTools)
12. Deploy to Vercel (SINGLE deployment)
```

## ⚠️ FINAL REMINDERS

```
1. DO NOT TOUCH THE MAP. Not one line. Not one CSS class. Not one parent div.

2. ALL changes are GENERIC. If you add a module grid, it renders based on
   what modules exist in the DB for ANY district — not hardcoded to Mandya.

3. Use @upstash/redis, NOT ioredis.

4. The sidebar "All 26 modules" dropdown currently truncates text ("Interac...",
   "Leade..."). This is unacceptable. Full names must always be visible.

5. Every module card in the grid must link to its respective page.
   URL pattern: /en/{state}/{district}/{module-slug}

6. When removing dark mode, search the ENTIRE codebase for "dark:" and
   remove ALL instances. Also check for ThemeProvider, useTheme, 
   document.documentElement.classList dark toggling.

7. The market ticker should NOT appear inside district pages — only on 
   the homepage. District pages have their own data.

8. Test the breadcrumb on: homepage, state page, district overview, 
   module page, and taluk page. All levels must work.

9. Support page Razorpay integration: keep existing payment links.
   Only change the visual design, not the payment flow.

10. Deploy ONCE at the end. One commit, one deploy. Save build minutes.
```
