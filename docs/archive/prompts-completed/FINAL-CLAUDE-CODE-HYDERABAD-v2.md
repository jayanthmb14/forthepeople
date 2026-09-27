# FORTHEPEOPLE.IN — ADD HYDERABAD, TELANGANA — CLAUDE CODE PROMPT
# ═══════════════════════════════════════════════════════════════════
# Paste this ENTIRE prompt into Claude Code.
# ⚠️  DO NOT DEPLOY. Everything runs LOCAL ONLY until I verify.
# ⚠️  Only Hyderabad district will be active. Other 4 Telangana districts = inactive.
# ⚠️  Telangana is a NEW STATE for the platform (6th active state).
# Estimated: 1 Claude Code session
# ═══════════════════════════════════════════════════════════════════

## INSTRUCTIONS FOR CLAUDE CODE

Execute steps ONE AT A TIME in groups. I will tell you which group to run.
Do NOT try to execute all steps at once.

**⚠️ CRITICAL — DO NOT READ THESE FILES (they are huge and will crash the context):**
- seed-bengaluru-data.ts, seed-bengaluru-data-ext-a.ts, seed-bengaluru-data-ext-b.ts, seed-bengaluru-data-ext-c.ts
- seed-mysuru-data.ts
- seed-bengaluru-leaders.ts, seed-bengaluru-leaders-fix.ts
- seed-delhi-data.ts
- seed-mumbai-data.ts, seed-kolkata-data.ts, seed-chennai-data.ts
- Any existing seed file larger than 200 lines

You already know the seed file pattern from the prompt instructions below.
Just follow the structure described and create new files directly.
Only READ the files you need to MODIFY (seed-hierarchy.ts, districts.ts, weather.ts, crops.ts, globals.css).

**DO NOT:**
- Run `git push` or deploy to Vercel
- Run `npx vercel --prod` or any deployment command
- Modify any existing Karnataka, Delhi, Maharashtra, West Bengal, or Tamil Nadu seed data
- Delete or alter any existing seed data
- Read large existing seed files to "understand the pattern" — the pattern is in this prompt

**DO:**
- Run everything against LOCAL Prisma dev proxy (not production Neon)
- Create ONE seed file for Hyderabad district
- Test by visiting each module at localhost:3000
- Create an activation script for future Telangana district expansion
- Verify existing districts (Mandya, Mysuru, Bengaluru Urban, New Delhi, Mumbai, Kolkata, Chennai) still work

**EXECUTION ORDER — wait for my instruction before each group:**
```
Group A: Steps 1-4  (hierarchy + constants + overrides + font)
Group B: Step 5     (Hyderabad seed file — this is the big one)
Group C: Steps 6-7  (activation script + documentation updates)
Group D: Step 8     (local testing checklist)
```
When I say "run Group A", execute Steps 1-4 only. Then stop and wait.

**IF DATA CANNOT BE FOUND:**
- If you search the web and can't find a specific leader's name, write:
  `name: "VERIFY: [position title] — search [portal URL]"`
- If you can't find exact budget numbers, use approximate ranges with a comment:
  `// APPROXIMATE — verify from finance.telangana.gov.in`
- NEVER fabricate data. Always mark uncertain data clearly.
- For election results: if you can't find a specific constituency result, add a comment and skip it.
- For police stations: if you can't find the full list, seed what you can find and add a TODO comment.

---

## PROJECT CONTEXT (read carefully)

```
PROJECT:          ForThePeople.in — India's Citizen Transparency Platform
LIVE URL:         https://forthepeople.in (DO NOT TOUCH — local only)
STACK:            Next.js 16 + TypeScript + Tailwind v4 + Prisma 7 + Neon PostgreSQL
ORM:              Prisma 7.5.0 — client import from '../src/generated/prisma'
ADAPTER:          @prisma/adapter-pg — new PrismaPg({ connectionString })
DB VALUES:        All money stored in RUPEES (display divides by 1e7 for Crores)
CURRENT PILOTS:   8 active districts across 5 states — DO NOT TOUCH
                  Karnataka: Mandya, Mysuru, Bengaluru Urban
                  Delhi: New Delhi
                  Maharashtra: Mumbai
                  West Bengal: Kolkata
                  Tamil Nadu: Chennai
                  (+ Tiruchirappalli may be #8 — DO NOT TOUCH)
LOCAL DEV:        Terminal 1: npx prisma dev | Terminal 2: npm run dev
LOCAL DB PORT:    51214 (direct postgresql://) — Prisma proxy on 51213
```

### CRITICAL RULES
```
1. Prisma import: import { PrismaClient } from '../src/generated/prisma'
2. Adapter: import { PrismaPg } from '@prisma/adapter-pg'
3. Money: RUPEES not Crores (₹50 Cr = 500000000)
4. Hierarchy seeder: upsert only, never deleteMany
5. Data seeder: check count before insert, use createMany with skipDuplicates
6. Telangana = State (formed June 2, 2014)
7. Telangana uses "Mandals" NOT "Taluks" — store mandals in Taluk model
8. Hyderabad district governance:
     Collector & District Magistrate (not DC)
     Commissioner of Police (Commissionerate system, not SP)
     GHMC manages civic infrastructure (recently split into 3 corporations)
9. No Gram Panchayats in Hyderabad (100% urban, 0 villages)
10. File header: always include ForThePeople.in copyright + MIT attribution
11. DO NOT run git push or deploy — LOCAL TESTING ONLY
```

---

## STEP 1: UPDATE HIERARCHY SEEDER

**File: prisma/seed-hierarchy.ts**

Add Telangana state with 5 districts. Use upsert pattern.
Only Hyderabad gets `active: true`. All others get `active: false`.

```
STATE:
  name: "Telangana", nameLocal: "తెలంగాణ", slug: "telangana"
  capital: "Hyderabad", active: true

DISTRICTS (5 — only #1 is active):

  1. ✅ ACTIVE — Hyderabad
     slug: "hyderabad", nameLocal: "హైదరాబాద్", active: true
     tagline: "City of Pearls"
     population: 4500000, area: 217, literacy: 83.25, sexRatio: 954
     density: 18172, talukCount: 16, villageCount: 0 (100% urban)

  2. ❌ INACTIVE — Warangal
     slug: "warangal", nameLocal: "వరంగల్", active: false
     tagline: "City of Orugallu"
     population: 3522644, area: 2175, literacy: 65.11, sexRatio: 998, density: 1620

  3. ❌ INACTIVE — Nizamabad
     slug: "nizamabad", nameLocal: "నిజామాబాద్", active: false
     tagline: "Turmeric City"
     population: 2551335, area: 4288, literacy: 60.13, sexRatio: 1040, density: 595

  4. ❌ INACTIVE — Karimnagar
     slug: "karimnagar", nameLocal: "కరీంనగర్", active: false
     tagline: "Silver Filigree City"
     population: 3776269, area: 11823, literacy: 56.45, sexRatio: 1008, density: 319

  5. ❌ INACTIVE — Khammam
     slug: "khammam", nameLocal: "ఖమ్మం", active: false
     tagline: "Gateway to Dandakaranya"
     population: 2798164, area: 4453, literacy: 63.56, sexRatio: 1017, density: 628
```

**16 Mandals as Taluk records** (Telangana uses Mandals, not Taluks — store in Taluk model):
```
Hyderabad Mandals:
  1. slug: "amberpet",       name: "Amberpet",       nameLocal: "అంబర్‌పేట్",       tagline: "Heart of Central Hyderabad",   pop: 320000,  area: 12, villages: 0
  2. slug: "asifnagar",      name: "Asifnagar",      nameLocal: "ఆసిఫ్‌నగర్",       tagline: "Old City Gateway",             pop: 280000,  area: 15, villages: 0
  3. slug: "bahadurpura",    name: "Bahadurpura",    nameLocal: "బహదూర్‌పురా",       tagline: "Historic Old City",            pop: 468000,  area: 22, villages: 0
  4. slug: "bandlaguda",     name: "Bandlaguda",     nameLocal: "బండ్లగూడ",          tagline: "Southern Growth Corridor",     pop: 350000,  area: 30, villages: 0
  5. slug: "charminar",      name: "Charminar",      nameLocal: "చార్మినార్",         tagline: "Icon of Hyderabad",            pop: 260000,  area: 8,  villages: 0
  6. slug: "golkonda",       name: "Golkonda",       nameLocal: "గోల్కొండ",           tagline: "Fort of Diamonds",             pop: 310000,  area: 20, villages: 0
  7. slug: "himayatnagar",   name: "Himayatnagar",   nameLocal: "హిమాయత్‌నగర్",      tagline: "Commercial Hub",               pop: 220000,  area: 10, villages: 0
  8. slug: "musheerabad",    name: "Musheerabad",    nameLocal: "ముషీరాబాద్",         tagline: "Cultural Crossroads",          pop: 295000,  area: 14, villages: 0
  9. slug: "nampally",       name: "Nampally",       nameLocal: "నాంపల్లి",           tagline: "Administrative Center",        pop: 245000,  area: 11, villages: 0
  10. slug: "saidabad",      name: "Saidabad",       nameLocal: "సాయిదాబాద్",         tagline: "Musi River Banks",             pop: 275000,  area: 16, villages: 0
  11. slug: "ameerpet",      name: "Ameerpet",       nameLocal: "అమీర్‌పేట్",         tagline: "Coaching Hub of India",        pop: 59000,   area: 4,  villages: 0
  12. slug: "tirumalagiri",  name: "Tirumalagiri",   nameLocal: "తిరుమలగిరి",         tagline: "Cantonment Heritage",          pop: 180000,  area: 12, villages: 0
  13. slug: "maredpally",    name: "Maredpally",     nameLocal: "మారేడ్‌పల్లి",       tagline: "Secunderabad Core",            pop: 195000,  area: 10, villages: 0
  14. slug: "shaikpet",      name: "Shaikpet",       nameLocal: "షైక్‌పేట్",          tagline: "HITEC City Gateway",           pop: 230000,  area: 18, villages: 0
  15. slug: "khairatabad",   name: "Khairatabad",    nameLocal: "ఖైరతాబాద్",          tagline: "Legislative District",         pop: 210000,  area: 9,  villages: 0
  16. slug: "secunderabad",  name: "Secunderabad",   nameLocal: "సికింద్రాబాద్",       tagline: "Twin City",                    pop: 305000,  area: 15, villages: 0
```

---

## STEP 2: UPDATE STATIC CONSTANTS

**File: src/lib/constants/districts.ts**

Find the existing Telangana entry in the states section. REPLACE it with:

```typescript
{
  slug: "telangana", name: "Telangana", nameLocal: "తెలంగాణ",
  active: true, capital: "Hyderabad", type: "state",
  districts: [
    { name: "Hyderabad", slug: "hyderabad", active: true },
    lockedDistrict("warangal", "Warangal"),
    lockedDistrict("nizamabad", "Nizamabad"),
    lockedDistrict("karimnagar", "Karimnagar"),
    lockedDistrict("khammam", "Khammam"),
  ],
},
```

NOTE: The Telangana entry already exists as `active: false` with these locked districts.
You are changing `active: false` → `active: true` for the state, and replacing the
`lockedDistrict("hyderabad", "Hyderabad")` with `HYDERABAD_DISTRICT`.

**ALSO CREATE the HYDERABAD_DISTRICT constant** (same pattern as MUMBAI_DISTRICT, CHENNAI_DISTRICT):

```typescript
// ── Hyderabad District ──────────────────────────────────────
const HYDERABAD_DISTRICT: District = {
  slug: "hyderabad",
  name: "Hyderabad",
  nameLocal: "హైదరాబాద్",
  tagline: "City of Pearls",
  taglineLocal: "ముత్యాల నగరం",
  active: true,
  population: 4500000,
  area: 217,
  talukCount: 16,
  villageCount: 0,
  literacy: 83.25,
  sexRatio: 954,
  taluks: [
    // 16 Mandals stored as Taluk records (Telangana uses Mandals, not Taluks)
    {
      slug: "charminar", name: "Charminar", nameLocal: "చార్మినార్",
      tagline: "Icon of Hyderabad", population: 260000, area: 8, villageCount: 0,
      villages: [
        { slug: "charminar-area", name: "Charminar", nameLocal: "చార్మినార్", population: 85000, pincode: "500002" },
        { slug: "laad-bazaar", name: "Laad Bazaar", nameLocal: "లాడ్ బజార్", population: 60000, pincode: "500002" },
        { slug: "mecca-masjid", name: "Mecca Masjid Area", nameLocal: "మక్కా మసీదు", population: 55000, pincode: "500002" },
        { slug: "pathergatti", name: "Pathergatti", nameLocal: "పత్తర్ఘట్టి", population: 60000, pincode: "500002" },
      ],
    },
    {
      slug: "secunderabad", name: "Secunderabad", nameLocal: "సికింద్రాబాద్",
      tagline: "Twin City", population: 305000, area: 15, villageCount: 0,
      villages: [
        { slug: "secunderabad-junction", name: "Secunderabad Junction", nameLocal: "సికింద్రాబాద్ జంక్షన్", population: 95000, pincode: "500003" },
        { slug: "paradise", name: "Paradise", nameLocal: "పారడైజ్", population: 70000, pincode: "500003" },
        { slug: "trimulgherry", name: "Trimulgherry", nameLocal: "తిరుమల్ఘెర్రీ", population: 80000, pincode: "500015" },
        { slug: "rp-road", name: "RP Road", nameLocal: "ఆర్పీ రోడ్", population: 60000, pincode: "500003" },
      ],
    },
    {
      slug: "nampally", name: "Nampally", nameLocal: "నాంపల్లి",
      tagline: "Administrative Center", population: 245000, area: 11, villageCount: 0,
      villages: [
        { slug: "abids", name: "Abids", nameLocal: "అబిడ్స్", population: 65000, pincode: "500001" },
        { slug: "nampally-station", name: "Nampally Station", nameLocal: "నాంపల్లి స్టేషన్", population: 55000, pincode: "500001" },
        { slug: "public-gardens", name: "Public Gardens", nameLocal: "పబ్లిక్ గార్డెన్స్", population: 45000, pincode: "500004" },
        { slug: "mozamjahi-market", name: "Mozamjahi Market", nameLocal: "మొజాంజాహి మార్కెట్", population: 40000, pincode: "500001" },
      ],
    },
    {
      slug: "khairatabad", name: "Khairatabad", nameLocal: "ఖైరతాబాద్",
      tagline: "Legislative District", population: 210000, area: 9, villageCount: 0,
      villages: [
        { slug: "secretariat", name: "Secretariat", nameLocal: "సచివాలయం", population: 45000, pincode: "500004" },
        { slug: "lakdi-ka-pul", name: "Lakdi Ka Pul", nameLocal: "లకడీ కా పూల్", population: 55000, pincode: "500004" },
        { slug: "saifabad", name: "Saifabad", nameLocal: "సైఫాబాద్", population: 50000, pincode: "500004" },
        { slug: "ac-guards", name: "AC Guards", nameLocal: "ఏసీ గార్డ్స్", population: 60000, pincode: "500004" },
      ],
    },
    // Remaining 12 mandals: amberpet, asifnagar, bahadurpura, bandlaguda,
    // golkonda, himayatnagar, musheerabad, saidabad, ameerpet,
    // tirumalagiri, maredpally, shaikpet
    // Follow same pattern: slug, name, nameLocal, tagline, population, area,
    // villageCount: 0, villages: [3-5 localities with slug/name/nameLocal/population/pincode]
    // USE REAL PINCODES from indiapost.gov.in for Hyderabad
  ],
};
```

Place this constant ABOVE the INDIA_STATES array, after the KOLKATA_DISTRICT constant.
Then use `HYDERABAD_DISTRICT` in the Telangana districts array.

---

## WHAT HAPPENS AUTOMATICALLY AFTER ACTIVATION

Once `active: true` is set for Telangana state + Hyderabad district in both DB and districts.ts:

| System | What Happens | When | Config Needed? |
|--------|-------------|------|----------------|
| API routes (all 29 modules) | District data served | Immediately | NO |
| Scraper: weather | OWM pulls Hyderabad weather | Every 5 min | YES: OWM_CITY_OVERRIDE |
| Scraper: crops | AGMARKNET pulls crop prices | Every 15 min (6AM-8PM) | YES: AGMARKNET_DISTRICT_OVERRIDE |
| Scraper: news | RSS feeds pulled for Hyderabad | Every 1 hour | NO (auto uses district name) |
| Scraper: alerts | Local alerts aggregated | Every 2 hours | NO |
| Scraper: power outages | TGSPDCL data | Every 15 min | May need custom scraper |
| Scraper: police data | Crime stats | Every 6 hours | NO |
| Scraper: infrastructure | Project status | Every 12 hours | NO |
| AI insights | Pre-computed insights generated | Every 2h (Vercel cron) | NO |
| Health score | Score calculated | Weekly cron | NO (auto metro type) |
| Homepage | District card appears | After ISR revalidation (~5 min) | NO |
| Sitemap | URL included | After next build | NO |
| Admin tools | Appears in dropdowns | Immediately | NO |
| DrillDownMap | Telangana clickable on India map | Immediately (already in GEO_NAME_TO_SLUG) | NO |
| News intelligence | AI classifies Hyderabad news | Every 4h (Vercel cron) | NO |

**IMPORTANT: Power outage scraper** — existing scraper targets BESCOM (Karnataka).
For Hyderabad you need TGSPDCL. The power module will show "No data" initially — that's OK.
Add a TODO comment in the seed file for future TGSPDCL scraper integration.

**IMPORTANT: Dam scraper** — existing scraper targets KRS Dam (Karnataka).
Hyderabad has no major dams IN the district (reservoirs are in adjacent Ranga Reddy).
The water/dam module will show "No data" — that's correct for this urban district.

---

## STEP 3: ADD WEATHER & CROP OVERRIDES

### File: src/scraper/jobs/weather.ts
Add to OWM_CITY_OVERRIDE:
```typescript
'hyderabad': 'Hyderabad',
```

### File: src/scraper/jobs/crops.ts
Add to AGMARKNET_DISTRICT_OVERRIDE:
```typescript
'hyderabad': 'Hyderabad',
```
NOTE: Hyderabad is 100% urban — crop data may be minimal or empty. That's fine.

---

## STEP 4: ADD TELUGU FONT

**File: src/app/globals.css**

Check if Noto Sans Telugu is already imported (it might be if used for Andhra Pradesh entries).
If NOT present, add:
```css
/* Telugu script for Telangana */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;600;700&display=swap');
```

---

## STEP 5: CREATE HYDERABAD SEED FILE

**File: prisma/seed-hyderabad-data.ts**

This is the MAIN seed file. Seeds comprehensive data for **Hyderabad district only**.

### File template:
```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Telangana Data Seed — Hyderabad District
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-hyderabad-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const client = new PrismaClient({ adapter });

async function main() {
  console.log('🏛️  Seeding Hyderabad district data...\n');

  const telangana = await client.state.findUnique({ where: { slug: 'telangana' } });
  if (!telangana) throw new Error('Telangana state not found. Run seed-hierarchy.ts first.');

  const district = await client.district.findFirst({
    where: { slug: 'hyderabad', stateId: telangana.id },
  });
  if (!district) throw new Error('Hyderabad district not found. Run seed-hierarchy.ts first.');

  const did = district.id;
  console.log(`✓ Found Hyderabad (id: ${did})\n`);

  // ... seed all data categories below, checking count before each
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => client.$disconnect());
```

### DATA TO SEED (use REAL, VERIFIED data — search the web for accuracy):

#### A. LEADERSHIP — 10-tier Hyderabad/Telangana hierarchy

**This is different from Karnataka. Use Telangana's unique structure:**

```
TIER 1 — PARLIAMENT:
  Lok Sabha MP, Hyderabad constituency — Asaduddin Owaisi (AIMIM)
  Search for 2024 Lok Sabha result to confirm
  Rajya Sabha MPs from Telangana — search for current list

TIER 2 — TELANGANA ASSEMBLY (search for 2023 Telangana election results):
  MLAs whose constituencies fall in Hyderabad district:
    Charminar, Yakutpura, Chandrayangutta, Malakpet, Amberpet,
    Musheerabad, Nampally, Karwan, Goshamahal, Bahadurpura,
    Secunderabad, Khairatabad, Jubilee Hills, Sanathnagar, Rajendranagar
  NOTE: 2023 Telangana Assembly election — Congress won, Revanth Reddy became CM
  Search for EACH constituency winner

TIER 3 — LOCAL BODY:
  GHMC Mayor — search for current
  GHMC Commissioner — search for current
  NOTE: GHMC was recently restructured into 3 corporations (Greater Hyderabad, Cyberabad, Malkajgiri)

TIER 4 — ADMINISTRATION:
  Governor of Telangana — search for current
  Chief Minister — A. Revanth Reddy (verify still current in April 2026)
  Chief Secretary, Telangana — search for current
  Collector & District Magistrate, Hyderabad — search for current
  NOTE: Telangana uses "Collector & District Magistrate" (not DC or just DM)
  Additional Collector
  Mandal Revenue Officers for key mandals

TIER 5 — POLICE:
  Commissioner of Police (CP), Hyderabad — search for current
  (Hyderabad has 4 commissionerates: Hyderabad, Cyberabad, Rachakonda, Malkajgiri)
  Joint CP, Crime
  DCP zones (South, West, Central, East, North)
  NOTE: Commissionerate system — no SP

TIER 6 — JUDICIARY:
  Telangana High Court Chief Justice — search for current
  (NOTE: Separate Telangana HC established 2019, different from Andhra Pradesh HC)
  Chief Metropolitan Magistrate, Hyderabad
  City Civil Court

TIER 7 — KEY BODIES:
  HMDA Commissioner (Hyderabad Metropolitan Development Authority)
  HMRL Managing Director (Hyderabad Metro Rail Limited)
  HMWSSB Managing Director (Water Supply & Sewerage Board)
  TGSPDCL CMD (Southern Power Distribution Company)
  TSRTC Managing Director

TIER 8 — DEPARTMENT HEADS:
  Director, School Education, Telangana
  Director, Health & Family Welfare, Telangana
  Commissioner, GHMC
  Commissioner, Excise Department

TIER 9 — DISTRICT OFFICERS:
  District Education Officer (DEO), Hyderabad
  District Medical & Health Officer (DMHO), Hyderabad
  District Revenue Officer

TIER 10 — MANDAL LEVEL:
  MROs (Mandal Revenue Officers) for key mandals
  Mandal Educational Officers
```

#### B. BUDGET DATA (FY 2025-26 / 2026-27)

Search for Telangana state budget + GHMC budget. Create BudgetEntry records (values in RUPEES):

```
TELANGANA STATE (total budget ~₹2.9 lakh Cr for 2026-27):
  Municipal Admin & Urban Dev  ~₹17,907 Cr
  Education                    ~₹18,000 Cr
  Health & Medical             ~₹12,000 Cr
  Hyderabad Metro Rail         ~₹1,100 Cr (₹600 Cr Phase II + ₹500 Cr loans)
  Roads & Buildings            ~₹8,000 Cr
  Irrigation                   ~₹30,000 Cr
  Police & Home                ~₹10,000 Cr
  IT & Communications          ~₹1,500 Cr
  Social Welfare               ~₹5,000 Cr

GHMC BUDGET (search for "GHMC budget 2025-26"):
  Infrastructure               ~₹3,000 Cr
  SWM (Solid Waste)            ~₹1,500 Cr
  Water & Sewerage             ~₹2,000 Cr
  Roads                        ~₹2,500 Cr
  Health                       ~₹800 Cr
  Education                    ~₹400 Cr
  
Search: "Telangana budget 2026-27" from finance.telangana.gov.in
Search: "GHMC budget 2025-26" from ghmc.gov.in
```

#### C. INFRASTRUCTURE PROJECTS (25+ real projects)

Search for each and use REAL data:

```
METRO:
  - Hyderabad Metro Phase II — Old City extension, Airport line (₹1,100 Cr in 2026-27)
  - Hyderabad Metro Phase III — beyond Hitech City corridors
  - Metro state takeover from L&T — search for latest status

ROADS & FLYOVERS:
  - H-CITI scheme — ₹2,654 Cr urban infrastructure
  - Elevated Corridor I: Paradise → Shamirpet (Rajiv Rahadari SH-01)
  - Elevated Corridor II: Paradise → Dairy Farm Road (NH-44)
  - Elevated Corridor III: ICCC Banjara Hills → Shilpa Layout → ORR Gachibowli
  - Budvel Multi-Level Interchange — ₹488 Cr
  - ORR widening (Nanakramguda → Gachibowli) — ₹26.50 Cr
  - Pipeline road widening (MGIT → Manikonda) — ₹110 Cr
  - SRDP (Strategic Road Development Plan) flyovers & underpasses
  - Multiple GHMC flyovers (Rethibowli, Nanalnagar, NFCL, TV9 junctions)
  - Patigadda ROB

MEGA:
  - Regional Ring Road (RRR) — 340 km ring, ₹55,000+ Cr
  - Musi Riverfront Development — massive beautification project
  - Future City Development (beyond ORR)
  - CURE (Core Urban Region Economy) — tech hub within ORR
  - Pharma City at Mucherla — ₹64,000 Cr investment zone
  - Dr. B.R. Ambedkar Knowledge Tower, Lower Tank Bund

HEALTH:
  - NIMS (Nizam's Institute of Medical Sciences) expansion
  - TIMS hospitals at Sanathnagar, LB Nagar, Alwal — 6,582 new beds
  - Osmania General Hospital upgrades

WATER:
  - Godavari Drinking Water Supply Project
  - HMWSSB water supply augmentation
  - Musi River cleanup
  - Lake restoration (Hussain Sagar, Durgam Cheruvu)

HOUSING:
  - 2BHK Housing Scheme (Telangana state flagship)
  - Rajiv Swagruha housing
```

For each: name, category, budget (RUPEES), fundsReleased, progressPct, status,
contractor, startDate, expectedEnd, source.

#### D. DEMOGRAPHICS
```
Census 2011: { year: 2011, total: 3943323, rural: 0, urban: 3943323,
               literacy: 83.25, sexRatio: 954, density: 18172 }
Census 2001: { year: 2001, total: 3829753, rural: 0, urban: 3829753,
               literacy: 78.80, sexRatio: 933, density: 17649 }
Estimate 2026: { year: 2026, total: 4500000, rural: 0, urban: 4500000 }
```

#### E. POLICE STATIONS (Hyderabad district — search for real ones)
```
Nampally PS, Abids PS, Afzalgunj PS, Charminar PS, Falaknuma PS,
Hussainialam PS, Kacheguda PS, Kamatipura PS, Mangalhat PS,
Musheerabad PS, Narayanguda PS, Shahinayathgunj PS, Sultan Bazaar PS,
Habeebnagar PS, Golconda PS, Tappachabutra PS, Bahadurpura PS,
Saidabad PS, Malakpet PS, Chaderghat PS, Dabeerpura PS
```
Each: name, type: "Police Station", address, phone, jurisdiction, lat/lng if available.
Source: hyderabadpolice.gov.in

#### F. SCHOOLS (20+ mixed types)
```
Government:     Govt High School Nampally, Govt School Abids,
                Telangana Model Schools
Central:        KV Picket, KV Golconda, KV Trimulgherry
Private:        Hyderabad Public School, St. George's Grammar School,
                All Saints High School, Wesley Girls High School,
                Nizam College (autonomous, historic)
Universities:   Osmania University, University of Hyderabad,
                IIIT Hyderabad, ISB (Indian School of Business),
                NALSAR University of Law, English & Foreign Languages University
```
Each: name, type, level, address, students, teachers.
Source: schooleducation.telangana.gov.in, udise.in

#### G. GOVERNMENT OFFICES (GovOffice)
```
Collectorate, Hyderabad (Tank Bund Road)
GHMC Head Office (Tank Bund)
HMDA Office
Telangana Secretariat
Telangana High Court
TGSPDCL Head Office
HMWSSB Head Office
TSRTC Bus Bhavan (Musheerabad)
HMRL Corporate Office
RTO Hyderabad
Sub-Registrar offices
Passport Seva Kendra
Income Tax offices
EPFO Regional Office
```

#### H. SCHEMES (Central + Telangana State)
```
CENTRAL: PM-KISAN, PMAY-U, PM-SVANidhi, Ayushman Bharat, PM-JAY

TELANGANA STATE (with REAL apply URLs):
  Kalyana Lakshmi / Shadi Mubarak — marriage assistance
  Aasara Pensions — old age/widow/disabled pensions
  KCR Kit — maternity benefit scheme
  Rythu Bandhu — farmer investment support (limited in urban Hyderabad)
  Dharani — land registration portal — dharani.telangana.gov.in
  TS-iPASS — industrial single-window clearance — ipass.telangana.gov.in
  2BHK Housing — state housing scheme
  T-Hub — startup support — t-hub.co
  WE Hub — women entrepreneurship — wehub.telangana.gov.in
  Mee Seva — citizen services — meeseva.telangana.gov.in
```

#### I. ELECTION RESULTS
```
Lok Sabha 2024: Hyderabad constituency — search for final result (Owaisi/AIMIM expected)
Telangana Assembly 2023: all 15 constituencies in Hyderabad district
  — Congress won state in 2023, Revanth Reddy became CM
  — Search for EACH constituency winner
Telangana Assembly 2018: same 15 constituencies — TRS (now BRS) won majority
```
Source: results.eci.gov.in

#### J. COURT STATS
```
Telangana High Court (est. 2019, separate from AP HC)
City Civil Courts, Hyderabad
Metropolitan Criminal Courts
Search NJDG (njdg.ecourts.gov.in) for pendency and disposal data
```

#### K. RTI TEMPLATES (4-5 Telangana-specific)
```
1. GHMC Services & Property Tax — PIO: CPIO, GHMC, Tank Bund, Hyderabad
2. HMWSSB Water Supply — PIO: CPIO, HMWSSB Head Office
3. TGSPDCL Electricity — PIO: CPIO, TGSPDCL, Mint Compound
4. HMDA Development — PIO: CPIO, HMDA Office
5. Telangana Police — PIO: CPIO, Office of Commissioner of Police, Hyderabad
```

#### L. FAMOUS PERSONALITIES (born in Hyderabad — bornInDistrict: true ONLY if born here)

```
VERIFY BIRTHPLACE before adding. Only include if BORN in Hyderabad district:
- P.V. Sindhu — Badminton — born 1995 in Hyderabad — YES
- Mohammed Azharuddin — Cricket — born 1963 in Hyderabad — YES
- Sania Mirza — Tennis — born 1986 in Mumbai — VERIFY (she grew up in Hyderabad)
- Nawab Mir Osman Ali Khan — Last Nizam — born 1886 in Hyderabad — YES
- Suravaram Pratapa Reddy — Journalist/Freedom Fighter — VERIFY birthplace
- Alluri Sitarama Raju — Freedom Fighter — born in Vizag — DO NOT include
- Mahesh Babu — Actor — born in Chennai — DO NOT include
- Ram Charan — Actor — born in Madras/Chennai — DO NOT include
- Saina Nehwal — Badminton — born in Hisar, Haryana — DO NOT include
```
Search Wikipedia for each. Include: name, nameLocal (Telugu), category, description,
birthYear, deathYear, wikiUrl, photoUrl. Set bornInDistrict=true ONLY if born in Hyderabad.

#### M. LOCAL INDUSTRIES
```
LOCAL INDUSTRY = "IT, Pharma & GCCs"

HITEC City — category: "IT Park" — India's premier IT hub
Genome Valley — "Pharma/Biotech" — largest biotech cluster in India
Financial District — "Commercial" — corporate offices & GCCs
T-Hub — "Startup Incubator" — India's largest startup incubator
Fab City — "Electronics" — electronics manufacturing hub
ICRISAT — "Research" — international crop research institute
BHELi — "Manufacturing" — heavy electrical equipment
Laad Bazaar/Charminar — "Market" — bangles & pearls
Pearl Market — "Market" — Hyderabad pearl trade
Begum Bazaar — "Market" — one of India's largest wholesale markets
```

#### N. BUS ROUTES (10-15 TSRTC city routes)
Search for real TSRTC city bus route numbers in Hyderabad.
Major corridors: Mehdipatnam-Secunderabad, MGBS-Dilsukhnagar,
JBS-Charminar, Kukatpally-LB Nagar, etc.

#### O. TRAIN SCHEDULES (10-15 major trains from Hyderabad stations)
```
Stations in Hyderabad district:
  - Secunderabad Junction (SC) — one of India's largest junctions
  - Hyderabad Deccan / Nampally (HYB)
  - Kacheguda (KCG)

Major trains:
  Rajdhani Express (Secunderabad-New Delhi)
  Charminar Express (Hyderabad-Chennai)
  Falaknuma Express (Secunderabad-Mumbai)
  Godavari Express (Secunderabad-Visakhapatnam)
  Vande Bharat (if operational to/from Hyderabad — search)
  Telangana Express (Secunderabad-New Delhi)
  Hussainsagar Express (Secunderabad-Mumbai)
  Golconda Express (Secunderabad-Bangalore)
```
Source: indianrailways.gov.in

#### P. SERVICE GUIDES
```
1. Birth/Death Certificate — GHMC/MeeSeva — meeseva.telangana.gov.in
2. Encumbrance Certificate — IGRS Telangana — registration.telangana.gov.in
3. Property Registration — IGRS Telangana — Dharani portal
4. Ration Card — epds.telangana.gov.in
5. Driving License — RTA Telangana — transport.telangana.gov.in
6. Building Permission — GHMC/HMDA
7. Income Certificate — MeeSeva
8. Caste Certificate — MeeSeva
9. Trade License — GHMC
```

---

## STEP 6: CREATE ACTIVATION SCRIPT

**File: scripts/activate-telangana-districts.ts**

This script will be run LATER (not now) when ready for more Telangana districts.

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Remaining Telangana Districts
// Run this ONLY after verifying Hyderabad works perfectly.
//
// Usage: npx tsx scripts/activate-telangana-districts.ts
//        npx tsx scripts/activate-telangana-districts.ts warangal
//
// After running:
//   1. Update src/lib/constants/districts.ts → set activated district active: true
//   2. Seed data for the newly activated district
//   3. git commit + git push to deploy
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const TELANGANA_INACTIVE_SLUGS = [
  'warangal',
  'nizamabad',
  'karimnagar',
  'khammam',
];

async function main() {
  console.log('🔓 Activating Telangana districts...\n');

  const telangana = await prisma.state.findUnique({ where: { slug: 'telangana' } });
  if (!telangana) throw new Error('Telangana not found. Run seed-hierarchy.ts first.');

  const targetSlug = process.argv[2]; // optional: activate specific district
  const slugs = targetSlug ? [targetSlug] : TELANGANA_INACTIVE_SLUGS;
  let activated = 0;

  for (const slug of slugs) {
    const district = await prisma.district.findFirst({
      where: { slug, stateId: telangana.id },
    });
    if (!district) { console.log(`  ⚠️  ${slug} — not found`); continue; }
    if (district.active) { console.log(`  ✓ ${district.name} — already active`); continue; }

    await prisma.district.update({ where: { id: district.id }, data: { active: true } });
    console.log(`  ✅ ${district.name} — ACTIVATED`);
    activated++;
  }

  console.log(`\n🎉 Done! Activated ${activated} districts.`);
  console.log('\n📋 NEXT STEPS:');
  console.log('  1. Edit src/lib/constants/districts.ts → set activated district active: true');
  console.log('  2. Seed data for the district');
  console.log('  3. git add -A && git commit && git push origin main');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

---

## STEP 7: UPDATE PROJECT DOCUMENTATION (but DO NOT deploy)

### A. FORTHEPEOPLE-SKILL-UPDATED.md
Find the `CURRENT STATE` section at the top. Update:
```
PILOT DISTRICTS:  9 active (Karnataka: Mandya, Mysuru, Bengaluru Urban;
                  Delhi: New Delhi; Maharashtra: Mumbai;
                  West Bengal: Kolkata; Tamil Nadu: Chennai, Tiruchirappalli;
                  Telangana: Hyderabad)
                  + 10 Delhi districts ready to activate
                  + 4 Telangana districts ready to activate
LAST UPDATED:     April 2026
```

### B. SCALING-CHECKLIST.md
Add a NEW section at the bottom (after the MULTI-STATE EXPANSION section):
```
## TELANGANA EXPANSION (April 2026)
- [x] State hierarchy seeded (Telangana + Hyderabad + 16 mandals)
- [x] Static constants updated (Telangana active, HYDERABAD_DISTRICT constant)
- [x] Weather/crop overrides configured
- [x] Telugu font imported (Noto Sans Telugu)
- [x] Hyderabad district: full data seeded (leadership, budget, infra, schools, police, schemes, elections, courts, RTI, offices, transport, industries, famous)
- [x] Activation script created (scripts/activate-telangana-districts.ts)
- [ ] Local testing verified
- [ ] Production deployment
- [ ] Additional Telangana districts (Warangal, Nizamabad, Karimnagar, Khammam)
- [ ] TGSPDCL power scraper integration
- [ ] Telangana GeoJSON mandal boundaries (data.telangana.gov.in has shapefiles)
```

Also update the status line at the top of SCALING-CHECKLIST.md:
```
# Status: Pilot (Karnataka: Mandya ✅ | Mysuru ✅ | Bengaluru Urban ✅ | Delhi: New Delhi ✅ | Maharashtra: Mumbai ✅ | West Bengal: Kolkata ✅ | Tamil Nadu: Chennai ✅ | Tiruchirappalli ✅ | Telangana: Hyderabad ✅)
```

### C. BLUEPRINT-UNIFIED.md (references/BLUEPRINT-UNIFIED.md)
Find the section about pilot districts or current scores. Add:
```
Hyderabad (Telangana):  [pending — run health score calculation after testing]
```

Also find the scraper schedule table and add note:
```
NOTE: Hyderabad (Telangana) uses TGSPDCL for power, not BESCOM.
Power outage scraper needs TGSPDCL integration (TODO).
Dam scraper: N/A for Hyderabad (100% urban, no dams in district).
```

### D. README.md
Update the "Currently live" line to include Telangana:
```
**Currently live:** Karnataka (Mandya, Mysuru, Bengaluru Urban) |
Delhi (New Delhi) | Maharashtra (Mumbai) | West Bengal (Kolkata) |
Tamil Nadu (Chennai, Tiruchirappalli) | Telangana (Hyderabad)
```

### E. DO NOT commit or push — just stage:
```bash
git add -A
git status  # Show me what changed — DO NOT COMMIT YET
```

---

## STEP 8: LOCAL TESTING CHECKLIST

After all seeding is done, run these commands and verify:

```bash
# Make sure Prisma dev proxy is running in Terminal 1:
# npx prisma dev

# Terminal 2 — regenerate client + seed:
npx prisma generate
npx tsx prisma/seed-hierarchy.ts
npx tsx prisma/seed-hyderabad-data.ts
npm run dev
```

Then open browser and verify each of these URLs works:

```
http://localhost:3000/en/telangana/hyderabad                    ← Overview page
http://localhost:3000/en/telangana/hyderabad/leadership          ← 10-tier hierarchy
http://localhost:3000/en/telangana/hyderabad/finance             ← Budget data
http://localhost:3000/en/telangana/hyderabad/infrastructure      ← Projects tracker
http://localhost:3000/en/telangana/hyderabad/schools             ← Schools
http://localhost:3000/en/telangana/hyderabad/police              ← Police stations
http://localhost:3000/en/telangana/hyderabad/schemes             ← Government schemes
http://localhost:3000/en/telangana/hyderabad/elections           ← Election results
http://localhost:3000/en/telangana/hyderabad/courts              ← Court stats
http://localhost:3000/en/telangana/hyderabad/rti                 ← RTI templates
http://localhost:3000/en/telangana/hyderabad/offices             ← Government offices
http://localhost:3000/en/telangana/hyderabad/transport           ← Bus + train
http://localhost:3000/en/telangana/hyderabad/famous              ← Famous personalities
http://localhost:3000/en/telangana/hyderabad/industries          ← Local industries (IT/Pharma/GCCs)
http://localhost:3000/en/telangana/hyderabad/news                ← News (empty until scraper runs)
http://localhost:3000/en/telangana/hyderabad/services            ← Service guides
```

Also verify existing districts still work:
```
http://localhost:3000/en/karnataka/mandya                        ← Must still work
http://localhost:3000/en/karnataka/mysuru                        ← Must still work
http://localhost:3000/en/karnataka/bengaluru-urban               ← Must still work
http://localhost:3000/en/delhi/new-delhi                         ← Must still work
http://localhost:3000/en/maharashtra/mumbai                      ← Must still work
```

Verify the homepage shows Telangana/Hyderabad in the drill-down map and district cards:
```
http://localhost:3000                                            ← Homepage
```

**Report what you see on each page.** If anything is broken, fix it before proceeding.

---

## HYDERABAD-SPECIFIC NOTES (for reference during seeding)

```
1. GHMC restructuring:
   GHMC was recently split into 3 corporations:
     Greater Hyderabad Corporation (old core city)
     Cyberabad Corporation (western tech corridor)
     Medchal-Malkajgiri Corporation (northeast expansion)
   ₹500 Cr each allocated to Cyberabad and Malkajgiri corporations.
   Seed GHMC as the primary civic body — it still governs the core district.

2. Police:
   4 Police Commissionerates in Hyderabad metro:
     Hyderabad (core city — our district)
     Cyberabad (western suburbs — separate district)
     Rachakonda (eastern suburbs — separate district)
     Malkajgiri (newly created)
   CP Hyderabad heads the core city commissionerate.
   Use CP (Commissioner of Police), NOT SP.

3. No rural anything:
   No Gram Panchayats, no MGNREGA, no JJM
   100% urban, 0 villages, 0 rural population
   These modules will show "No data available" — that's correct.

4. Electricity:
   TGSPDCL (Telangana State Southern Power Distribution Company Limited)
   covers Hyderabad and southern Telangana.
   TGNPDCL covers northern Telangana.

5. Water:
   HMWSSB (Hyderabad Metropolitan Water Supply & Sewerage Board)
   Main sources: Osmansagar, Himayatsagar, Manjira, Krishna, Godavari

6. Transport:
   TSRTC — state buses (city + inter-city)
   Hyderabad Metro Rail (HMRL) — 3 corridors, 57 km operational
   MMTS — suburban rail (South Central Railway)

7. Health score type:
   Hyderabad = "metro" type (city population > 5M)
   Weights auto-adjust via getAdjustedWeights() in health-score.ts

8. Telugu font:
   Noto Sans Telugu — may already be in globals.css.
   Same script as Andhra Pradesh. Check before adding.

9. Telangana was formed:
   June 2, 2014 — carved out of Andhra Pradesh.
   29th state of India. Capital: Hyderabad.
   33 districts in the state.

10. OWM weather:
    "Hyderabad" works directly — no override needed.
    Average rainfall: ~810mm. Monsoon: June-October.
```

---

## DATA SOURCES FOR WEB SEARCH

```
GOVERNMENT:
  telangana.gov.in                       — State government portal
  hyderabad.telangana.gov.in             — Hyderabad district official
  finance.telangana.gov.in               — State budget documents
  ghmc.gov.in                            — GHMC (civic body)
  hmda.gov.in                            — HMDA (development authority)
  hmrl.co.in                             — Hyderabad Metro Rail
  hyderabadpolice.gov.in                 — Hyderabad Police
  hyderabadwater.gov.in                  — HMWSSB (water supply)
  tgsouthernpower.org                    — TGSPDCL (electricity)
  tsrtconline.in                         — TSRTC (buses)
  registration.telangana.gov.in          — IGRS (property registration)
  dharani.telangana.gov.in               — Land records
  meeseva.telangana.gov.in               — Citizen services portal
  schooleducation.telangana.gov.in       — Education department
  results.eci.gov.in                     — Election results
  njdg.ecourts.gov.in                    — Court data
  censusindia.gov.in                     — Census 2011

OPEN DATA (for future live API integration):
  data.telangana.gov.in                  — Telangana Open Data Portal (CKAN API)
    Available datasets:
      - HMRL Metro GTFS (stops, schedules, fares)
      - MMTS suburban rail GTFS data
      - TGSPDCL electricity consumption (monthly)
      - Daily crop prices from all market yards
      - Rainfall data (mandal level)
      - Air quality index (monthly for Hyderabad)
      - UDISE+ education data for Hyderabad
      - Telangana socio-economic outlook
      - Vehicle registration data
      - Tourism data with geolocation
      - District & mandal shapefiles (GeoJSON)
  data.gov.in                            — National OGD platform
    API key: you already have one
    Relevant Telangana/Hyderabad resources:
      - Census data
      - Crime statistics (NCRB)
      - Court pendency data (NJDG)
      - Election data (ECI)
      - Central scheme beneficiary data
  tgdex.telangana.gov.in                 — Telangana Data Exchange (newer platform)
```

---

## SUMMARY OF FILES CREATED/MODIFIED

```
CREATED:
  prisma/seed-hyderabad-data.ts                  — Full Hyderabad seed
  scripts/activate-telangana-districts.ts         — Activation for remaining 4 districts

MODIFIED:
  prisma/seed-hierarchy.ts                        — Added Telangana + 5 districts + 16 mandals
  src/lib/constants/districts.ts                  — Telangana set active, Hyderabad active
  src/scraper/jobs/weather.ts                     — OWM override for Hyderabad
  src/scraper/jobs/crops.ts                       — AGMARKNET override for Hyderabad
  src/app/globals.css                             — Telugu font import (if not already present)
  FORTHEPEOPLE-SKILL-UPDATED.md                   — Updated pilot district count
  SCALING-CHECKLIST.md                            — Added Telangana expansion status
  README.md                                       — Updated currently live section

NOT MODIFIED (DO NOT TOUCH):
  Any Karnataka, Delhi, Maharashtra, West Bengal, or Tamil Nadu seed files
  vercel.json
  prisma/schema.prisma (no model changes needed)
  src/middleware.ts
  src/components/map/DrillDownMap.tsx (Telangana already mapped)
  Any API routes (all are generic)
```

---

## AFTER LOCAL TESTING IS COMPLETE

### Pre-deployment verification (run locally before pushing):
```
✓ All 29 module pages load for Hyderabad (some show "No data" — OK for rural modules)
✓ Leadership page shows multi-tier hierarchy
✓ Budget page shows at least 1 fiscal year
✓ Infrastructure page shows 20+ projects
✓ Police page shows station list
✓ Schools page shows school list
✓ Elections page shows at least 1 election
✓ Homepage drill-down map shows Telangana as clickable/active
✓ Homepage district cards show Hyderabad with health grade placeholder
✓ ALL existing districts (Mandya, Mysuru, Bengaluru Urban, New Delhi, Mumbai, Kolkata, Chennai) still work
✓ No console errors on any page
✓ Admin dropdown includes Hyderabad in FactChecker and VerifySection
```

### Deploy:
```bash
# Step 1: Commit
git add -A
git commit -m "feat: Add Hyderabad, Telangana — district #9

- Added Telangana state (6th active state) + Hyderabad district + 16 mandals
- Full data: GHMC leadership, ₹17.9K Cr urban budget, Metro/RRR/Musi/CURE infra,
  IT/Pharma/GCC industries, 15 assembly constituencies, commissionerate policing
- Telugu font imported (Noto Sans Telugu)
- Activation script for 4 remaining Telangana districts
- Total active districts: 9 across 6 states/UTs"

# Step 2: Deploy
git push origin main

# Step 3: After deploy — run on PRODUCTION DB:
DATABASE_URL=<neon-prod-url> npx tsx prisma/seed-hierarchy.ts
DATABASE_URL=<neon-prod-url> npx tsx prisma/seed-hyderabad-data.ts
DATABASE_URL=<neon-prod-url> npx tsx scripts/calculate-health-scores.ts

# Step 4: Verify on live site
# Visit: https://forthepeople.in/en/telangana/hyderabad
# Check that all modules load with data

# Step 5 (LATER — when ready for more Telangana districts):
npx tsx scripts/activate-telangana-districts.ts warangal
# Then seed warangal data, update constants file, commit, push again
```

## KNOWN LIMITATIONS FOR HYDERABAD (document these, fix later)

```
1. Power outages: scraper targets BESCOM (Karnataka). TGSPDCL integration needed.
   → Power module will show "No data" — expected.

2. Dam/water levels: scraper targets KRS Dam (Karnataka). Hyderabad has no dams.
   → Water/dam module will show "No data" — correct behavior.

3. Crop prices: Hyderabad is 100% urban, may have no AGMARKNET mandi.
   → Crops module may show "No data" — expected.

4. Gram Panchayat: N/A (100% urban, 0 villages)
   → Module shows "No data" — correct.

5. JJM Water Supply: N/A (urban district)
   → Module shows "No data" — correct.

6. MGNREGA: N/A (urban district)
   → Module shows "No data" — correct.

7. GeoJSON mandal boundaries: not yet available.
   → Map module shows district outline only — OK for launch.
   → data.telangana.gov.in has shapefiles for future use.

8. Telangana uses "Mandals" not "Taluks" — stored as Taluk records.
   → UI shows "Taluks" label — cosmetic issue, fix later with state-level terminology config.
```

## END OF PROMPT
# HYDERABAD PROMPT — SUPPLEMENTAL PATCH
# ═══════════════════════════════════════════════════════════
# Paste this AFTER the main CLAUDE-CODE-HYDERABAD-PROMPT.md
# This adds: execution groups, background code fixes, scraper docs,
# GeoJSON, health score, blueprint updates, TalukMap fixes
# ═══════════════════════════════════════════════════════════

## ⚠️ EXECUTION GROUPS — DO NOT RUN ALL AT ONCE

Execute in groups. Wait for my instruction between each.

```
Group A: Steps 1-4      → hierarchy + constants + overrides + font
Group B: Step 5a         → background code fixes (TalukMap.tsx + GeoJSON + districts.ts constant)
Group C: Step 5b-seed    → seed file PART 1 (leadership + budget + infrastructure + demographics + rainfall)
Group D: Step 5c-seed    → seed file PART 2 (police + schools + offices + schemes + elections + courts)
Group E: Step 5d-seed    → seed file PART 3 (RTI + famous + industries + transport + services)
Group F: Steps 6-8       → activation script + health score + blueprint updates + testing
```

---

## STEP 5a: BACKGROUND CODE FIXES (Group B)

These files need modification for Hyderabad to render properly on the live site.

### Fix 1: TalukMap.tsx — Add Hyderabad mandal mappings

**File: src/components/map/TalukMap.tsx**

Add to `NAME_TO_SLUG` mapping object:
```typescript
// Hyderabad (mandals stored as taluks)
"Amberpet": "amberpet", "Asifnagar": "asifnagar", "Bahadurpura": "bahadurpura",
"Bandlaguda": "bandlaguda", "Charminar": "charminar", "Golkonda": "golkonda",
"Himayatnagar": "himayatnagar", "Musheerabad": "musheerabad", "Nampally": "nampally",
"Saidabad": "saidabad", "Ameerpet": "ameerpet", "Tirumalagiri": "tirumalagiri",
"Maredpally": "maredpally", "Shaikpet": "shaikpet", "Khairatabad": "khairatabad",
"Secunderabad": "secunderabad",
```

Add to `TALUK_COLORS` object:
```typescript
// Hyderabad mandals
"amberpet":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
"asifnagar":    { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
"bahadurpura":  { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
"bandlaguda":   { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
"charminar":    { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
"golkonda":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
"himayatnagar": { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
"musheerabad":  { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
"nampally":     { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
"saidabad":     { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
"ameerpet":     { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
"tirumalagiri": { fill: "rgba(16,185,129,0.22)",  stroke: "#059669" },
"maredpally":   { fill: "rgba(245,158,11,0.22)",  stroke: "#D97706" },
"shaikpet":     { fill: "rgba(139,92,246,0.22)",  stroke: "#7C3AED" },
"khairatabad":  { fill: "rgba(239,68,68,0.22)",   stroke: "#DC2626" },
"secunderabad": { fill: "rgba(37,99,235,0.22)",   stroke: "#2563EB" },
```

### Fix 2: GeoJSON file for Hyderabad mandals

**File: public/geo/telangana-hyderabad-mandals.json**

Download Hyderabad mandal boundary GeoJSON from:
- data.telangana.gov.in (search for "Telangana District and Mandal Shape Files")
- OR datameet.org subdivisions
- OR github.com/datameet/maps (India administrative boundaries)

If GeoJSON cannot be found/downloaded (network disabled), create a PLACEHOLDER file:
```json
{
  "type": "FeatureCollection",
  "features": []
}
```
NOTE: The TalukMap component has a fallback — if GeoJSON is empty, it shows a grid-based
card selector instead. So a placeholder is fine for now. I will add the real GeoJSON later.

### Fix 3: districts.ts — Create HYDERABAD_DISTRICT constant with taluks

**File: src/lib/constants/districts.ts**

Instead of just inline `{ name: "Hyderabad", slug: "hyderabad", active: true }`,
create a full constant BEFORE the INDIA_STATES array (same pattern as MUMBAI_DISTRICT, CHENNAI_DISTRICT):

```typescript
const HYDERABAD_DISTRICT: District = {
  name: "Hyderabad",
  slug: "hyderabad",
  active: true,
  taluks: [
    { slug: "amberpet", name: "Amberpet" },
    { slug: "asifnagar", name: "Asifnagar" },
    { slug: "bahadurpura", name: "Bahadurpura" },
    { slug: "bandlaguda", name: "Bandlaguda" },
    { slug: "charminar", name: "Charminar" },
    { slug: "golkonda", name: "Golkonda" },
    { slug: "himayatnagar", name: "Himayatnagar" },
    { slug: "musheerabad", name: "Musheerabad" },
    { slug: "nampally", name: "Nampally" },
    { slug: "saidabad", name: "Saidabad" },
    { slug: "ameerpet", name: "Ameerpet" },
    { slug: "tirumalagiri", name: "Tirumalagiri" },
    { slug: "maredpally", name: "Maredpally" },
    { slug: "shaikpet", name: "Shaikpet" },
    { slug: "khairatabad", name: "Khairatabad" },
    { slug: "secunderabad", name: "Secunderabad" },
  ],
};
```

Then in INDIA_STATES, the Telangana entry uses:
```typescript
{
  slug: "telangana", name: "Telangana", nameLocal: "తెలంగాణ",
  active: true, capital: "Hyderabad", type: "state",
  districts: [
    HYDERABAD_DISTRICT,
    lockedDistrict("warangal", "Warangal"),
    lockedDistrict("nizamabad", "Nizamabad"),
    lockedDistrict("karimnagar", "Karimnagar"),
    lockedDistrict("khammam", "Khammam"),
  ],
},
```

### Fix 4: Verify DrillDownMap.tsx already has Telangana

Check that `src/components/map/DrillDownMap.tsx` has this in `GEO_NAME_TO_SLUG`:
```typescript
"Telangana": "telangana",
```
It should already be there. If NOT, add it. Do NOT modify anything else in this file.

---

## SCRAPER AUTO-ACTIVATION (no code changes needed)

When Hyderabad is set `active: true` in DB, ALL these scrapers auto-detect it:

```
RAILWAY SCRAPER (src/scraper/scheduler.ts):
  Every 5 min:    weather    — pulls from OWM for "Hyderabad"
  Every 15 min:   crops      — pulls AGMARKNET for "Hyderabad" (may be empty — OK)
  Every 15 min:   power      — pulls power outage data (TGSPDCL — may need portal config later)
  Every 30 min:   dams       — dam levels (Hyderabad has no major dams — will return empty — OK)
  Every 1 hour:   news       — Google News RSS with "Hyderabad" — will auto-populate
  Every 2 hours:  alerts     — local alerts aggregation
  Every 6 hours:  police     — police data refresh
  Every 12 hours: infra      — infrastructure project status
  Every 12 hours: exams      — government exam notifications
  Daily 2 AM:     rti        — RTI statistics
  Daily 3 AM:     courts     — court pendency data
  Daily 4 AM:     mgnrega    — MGNREGA data (will be empty for Hyderabad — OK)
  Weekly Sunday:  jjm, housing, schools
  Monthly 1st:    finance, transport, schemes
  Monthly 15th:   soil, elections

VERCEL CRONS (vercel.json):
  /api/cron/scrape-news       — daily 6AM UTC (Hyderabad news auto-included)
  /api/cron/scrape-crops      — daily 3:30AM UTC (Hyderabad crops auto-included)
  /api/cron/generate-insights — every 2h (AI insights for all 29 modules × all districts)
```

**No code changes needed.** The scheduler queries `getActiveDistricts()` from DB on every run.
Once Hyderabad is active, it's included automatically.

---

## STEP within Group F: HEALTH SCORE CALCULATION

After seeding and before testing, calculate the health score for Hyderabad:

```bash
# Run health score calculation for all active districts:
DATABASE_URL=<your-local-db-url> npx tsx scripts/calculate-health-scores.ts
```

If this script doesn't exist yet, the health score will be calculated on the next weekly cron run.
That's OK for local testing — the homepage will show the district card without a grade temporarily.

Health score type for Hyderabad = **"metro"** (population > 5M for the city).
This auto-adjusts weights: boosts infrastructure + digitalAccess, reduces agriculture.

---

## EXPLICIT BLUEPRINT / SKILL FILE UPDATES (Step 7 expanded)

### A. FORTHEPEOPLE-SKILL-UPDATED.md

Find the `CURRENT STATE` section and update:
```
PILOT DISTRICTS:  9 active (Karnataka: Mandya, Mysuru, Bengaluru Urban;
                  Delhi: New Delhi; Maharashtra: Mumbai;
                  West Bengal: Kolkata; Tamil Nadu: Chennai, Tiruchirappalli;
                  Telangana: Hyderabad)
                  + 10 Delhi districts ready to activate
                  + 4 Telangana districts ready to activate
LAST UPDATED:     April 2026
```

### B. SCALING-CHECKLIST.md

Add at the BOTTOM (after existing Tamil Nadu section):
```markdown
## TELANGANA EXPANSION (April 2026)
- [x] State hierarchy seeded (Telangana + Hyderabad + 16 mandals)
- [x] Static constants updated (Telangana active, Hyderabad active)
- [x] Weather/crop overrides configured
- [x] Telugu font imported
- [x] TalukMap.tsx updated with Hyderabad mandal mappings
- [x] GeoJSON placeholder created for Hyderabad mandals
- [x] Hyderabad district: full data seeded
- [x] Activation script created (scripts/activate-telangana-districts.ts)
- [ ] Real GeoJSON mandal boundaries added
- [ ] Local testing verified
- [ ] Production deployment
- [ ] Additional Telangana districts (Warangal, Nizamabad, Karimnagar, Khammam)
```

### C. DISTRICT-EXPANSION-SKILL.md

Add a new section after the Mysuru section:
```markdown
## District: Hyderabad

State:          Telangana
District:       Hyderabad (హైదరాబాద్)
Slug:           hyderabad
Tagline:        "City of Pearls"
Population:     ~4,500,000 (2026 est.)
Area:           217 sq km
Literacy:       83.25%
Sex Ratio:      954
Density:        ~18,172/sq km

Mandals (16, stored as Taluks):
  Amberpet, Asifnagar, Bahadurpura, Bandlaguda, Charminar, Golkonda,
  Himayatnagar, Musheerabad, Nampally, Saidabad, Ameerpet, Tirumalagiri,
  Maredpally, Shaikpet, Khairatabad, Secunderabad

LOCAL INDUSTRY = "IT, Pharma & GCCs"
GOVERNANCE:     Commissionerate policing (CP, not SP)
                Collector & District Magistrate (not DC)
                GHMC / HMDA / TGSPDCL / HMWSSB / TSRTC / HMRL
HEALTH SCORE:   "metro" type
100% URBAN:     0 villages, no gram panchayats, no JJM, no MGNREGA
```

### D. README.md

Update the currently live line:
```
**Currently live:** Karnataka (Mandya, Mysuru, Bengaluru Urban) |
Delhi (New Delhi) | Maharashtra (Mumbai) | West Bengal (Kolkata) |
Tamil Nadu (Chennai, Tiruchirappalli) | Telangana (Hyderabad)
```

### E. BLUEPRINT-UNIFIED.md

Find the scraper schedule section and add under "Scraping Sources":
```
Telangana/Hyderabad:
  Weather:     OpenWeatherMap (city: "Hyderabad")
  Crops:       AGMARKNET (district: "Hyderabad" — may be empty, urban district)
  News:        Google News RSS "Hyderabad"
  Police:      hyderabadpolice.gov.in
  Power:       TGSPDCL (tgsouthernpower.org)
  Water:       HMWSSB (hyderabadwater.gov.in) — no dam data, urban water supply
  Metro:       HMRL (hmrl.co.in)
  Schools:     schooleducation.telangana.gov.in
  Courts:      njdg.ecourts.gov.in (Telangana HC + Hyderabad city courts)
  Elections:   results.eci.gov.in
  Open Data:   data.telangana.gov.in (CKAN API — 658+ datasets)
```

### F. DO NOT commit or push — just stage:
```bash
git add -A
git status  # Show me what changed — DO NOT COMMIT YET
```

---

## MODULES THAT WILL BE EMPTY (expected — NOT a bug)

These modules will show "No data available" for Hyderabad because it's 100% urban:
```
gram-panchayat  — 0 villages, no panchayats
jjm             — Jal Jeevan Mission is rural water; Hyderabad uses HMWSSB
farm            — No soil health cards (urban district)
crops           — May be empty (no agricultural mandi in Hyderabad district proper)
dam / water     — No major dams in Hyderabad district; water comes from reservoirs
                  in surrounding districts (Osmansagar in Ranga Reddy)
housing         — Seed 2BHK + PMAY if data available; otherwise will populate via scraper later
```

These are CORRECT behavior. Do not try to force data into these modules.
The UI gracefully shows "No data available" — this is by design.

---

## COMPLETE FILE LIST (all files created/modified)

```
CREATED (7 files):
  prisma/seed-hyderabad-data.ts                  — Full Hyderabad seed (sections A-P)
  scripts/activate-telangana-districts.ts         — Activation for remaining 4 districts
  public/geo/telangana-hyderabad-mandals.json     — GeoJSON (placeholder or real)

MODIFIED (11 files):
  prisma/seed-hierarchy.ts                        — ADD Telangana state + 5 districts + 16 mandals
  src/lib/constants/districts.ts                  — ADD HYDERABAD_DISTRICT constant, SET Telangana active
  src/scraper/jobs/weather.ts                     — ADD OWM override for Hyderabad
  src/scraper/jobs/crops.ts                       — ADD AGMARKNET override for Hyderabad
  src/app/globals.css                             — ADD Telugu font (if not present)
  src/components/map/TalukMap.tsx                 — ADD NAME_TO_SLUG + TALUK_COLORS for 16 mandals
  FORTHEPEOPLE-SKILL-UPDATED.md                   — UPDATE pilot count + Telangana state info
  SCALING-CHECKLIST.md                            — ADD Telangana expansion section
  DISTRICT-EXPANSION-SKILL.md                     — ADD Hyderabad district spec
  BLUEPRINT-UNIFIED.md                            — ADD Telangana scraping sources
  README.md                                       — UPDATE currently live

NOT MODIFIED (DO NOT TOUCH):
  Any existing seed files (Karnataka, Delhi, Maharashtra, WB, TN)
  vercel.json (crons are generic — auto-include new districts)
  prisma/schema.prisma (no model changes)
  src/middleware.ts (watermarks are generic)
  src/components/map/DrillDownMap.tsx (Telangana already mapped)
  Any API route files (all generic — auto-serve new districts)
  src/scraper/scheduler.ts (auto-discovers active districts via getActiveDistricts())
  src/lib/cache.ts (generic — works for all districts)
  src/hooks/useDistrictData.ts (generic — works for all districts)
  src/app/api/data/[module]/route.ts (generic — serves any active district)
```

---

# ═══════════════════════════════════════════════════════════
# DATA SOURCES MASTER TABLE — HYDERABAD, TELANGANA
# Every module → exact source → URL → frequency → status
# ═══════════════════════════════════════════════════════════
# This table is the TEMPLATE for ALL future district expansions.
# Copy this section into BLUEPRINT-UNIFIED.md under a new
# "Per-District Data Source Registry" heading.
# ═══════════════════════════════════════════════════════════

## INSTRUCTION TO CLAUDE CODE:
Add this entire table to BLUEPRINT-UNIFIED.md under Section 14 (SCRAPING SOURCES)
as a new subsection: "### Per-District Source Registry — Hyderabad, Telangana"
This becomes the template for every future district/state/country expansion.

---

## MODULE → SOURCE → FREQUENCY → STATUS

```
┌─────────────────────┬────────────────────────────────────────────────────────────┬────────────┬──────────────┬─────────────────────────────────────┐
│ MODULE              │ DATA SOURCE (Hyderabad)                                    │ FREQUENCY  │ SCRAPER FILE │ STATUS / NOTES                      │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ weather             │ OpenWeatherMap API                                         │ Every 5min │ weather.ts   │ ✅ WORKS — "Hyderabad" maps directly │
│                     │ api.openweathermap.org/data/2.5/weather?q=Hyderabad        │            │              │ OWM_CITY_OVERRIDE: 'hyderabad'      │
│                     │ ENV: OPENWEATHER_API_KEY                                   │            │              │ → 'Hyderabad'                       │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ crops               │ AGMARKNET via data.gov.in API                              │ Every 15m  │ crops.ts     │ ⚠️ MAY BE EMPTY — Hyderabad is      │
│                     │ api.data.gov.in/resource/<resource-id>                     │ (6AM-8PM)  │              │ 100% urban, no agricultural mandi.  │
│                     │ ?filters[district]=Hyderabad&filters[state]=Telangana      │            │              │ AGMARKNET_DISTRICT_OVERRIDE:        │
│                     │ ENV: DATA_GOV_API_KEY                                      │            │              │ 'hyderabad' → 'Hyderabad'           │
│                     │                                                            │            │              │ Empty response = expected behavior  │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ power               │ TGSPDCL (Telangana Southern Power Distribution)            │ Every 15m  │ power.ts     │ ❌ GAP — scraper currently only      │
│                     │ tgsouthernpower.org                                        │            │              │ supports BESCOM (Karnataka).        │
│                     │ Consumer complaint portal / planned outage notices         │            │              │ TGSPDCL portal does NOT publish     │
│                     │                                                            │            │              │ outages in same HTML table format.  │
│                     │                                                            │            │              │ Will return 0 results — OK for now. │
│                     │                                                            │            │              │ TODO: Add TGSPDCL scraper adapter.  │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ water / dam         │ NO DAM in Hyderabad district                               │ Every 30m  │ dams.ts      │ ⚠️ SKIPPED — dams.ts has no entry   │
│                     │ Hyderabad water supply from:                               │            │              │ for 'hyderabad' in DISTRICT_DAMS.   │
│                     │   Osmansagar (Gandipet) — in Ranga Reddy district          │            │              │ Scraper logs "no dam config —       │
│                     │   Himayatsagar — in Ranga Reddy district                   │            │              │ skipping". This is correct.         │
│                     │   Nagarjuna Sagar, Srisailam — state-level dams            │            │              │ Seed HMWSSB data manually instead.  │
│                     │ HMWSSB (hyderabadwater.gov.in) manages urban water         │            │              │ TODO: Add HMWSSB water level data.  │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ news                │ Google News RSS                                            │ Every 1h   │ news.ts      │ ✅ WORKS — auto-queries with         │
│                     │ 3 RSS queries per district:                                │            │              │ "Hyderabad" district name.          │
│                     │   "Hyderabad district news"                                │            │              │ URL dedup + date validation         │
│                     │   "Hyderabad Telangana"                                    │            │              │ + title dedup all auto-applied.     │
│                     │   "GHMC Hyderabad" (or similar civic body query)           │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ alerts              │ Aggregated from news + local advisory sources              │ Every 2h   │ alerts.ts    │ ✅ WORKS — auto-filters alerts       │
│                     │ IMD weather warnings (imd.gov.in)                          │            │              │ relevant to Hyderabad from news.    │
│                     │ NDMA alerts (ndma.gov.in)                                  │            │              │ Auto-expires alerts >14 days old.   │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ police              │ hyderabadpolice.gov.in                                     │ Every 6h   │ police.ts    │ ⚠️ SEED ONLY — scraper may not      │
│                     │ NCRB (ncrb.gov.in) for crime statistics                    │            │              │ parse Hyderabad Police portal.      │
│                     │ Hyderabad Police Commissionerate                           │            │              │ Seed stations manually. Scraper     │
│                     │                                                            │            │              │ runs but may return 0 new records.  │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ infrastructure      │ Seeded from:                                               │ Every 12h  │ infra.ts     │ ✅ SEED — scraper auto-runs but      │
│                     │   hmda.gov.in (HMDA projects)                              │            │              │ relies on seeded project data.      │
│                     │   ghmc.gov.in (GHMC infrastructure)                        │            │              │ Projects updated via news action    │
│                     │   hmrl.co.in (Metro Rail projects)                         │            │              │ engine when AI detects updates.     │
│                     │   telangana.gov.in (state budget projects)                 │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ exams               │ tspsc.gov.in (Telangana PSC)                               │ Every 12h  │ exams.ts     │ ✅ WORKS — news action engine        │
│                     │ telangana.gov.in/jobs                                      │            │              │ auto-classifies exam news and       │
│                     │ Google News RSS (auto-classified by news action engine)    │            │              │ creates GovernmentExam records.     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ rti                 │ hyderabad.telangana.gov.in/rti/                            │ Daily 2AM  │ rti.ts       │ ✅ SEED — PIO details seeded.        │
│                     │ rtionline.gov.in (central RTI portal)                      │            │              │ Scraper may pull aggregate stats.   │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ courts              │ njdg.ecourts.gov.in (National Judicial Data Grid)          │ Daily 3AM  │ courts.ts    │ ✅ WORKS — NJDG has Hyderabad        │
│                     │ Telangana High Court (tshc.gov.in)                         │            │              │ court pendency data.                │
│                     │ City Civil Courts, Hyderabad                               │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ gram-panchayat      │ N/A — Hyderabad is 100% urban                              │ Daily 4AM  │ mgnrega.ts   │ ⚠️ EMPTY — no panchayats in          │
│                     │ nregs.nic.in (MGNREGA portal)                              │            │              │ Hyderabad. Scraper runs, returns 0. │
│                     │                                                            │            │              │ This is correct behavior.           │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ jjm                 │ N/A — Hyderabad is 100% urban                              │ Weekly Sun │ jjm.ts       │ ⚠️ EMPTY — JJM is rural piped        │
│                     │ ejalshakti.gov.in (JJM dashboard)                          │            │              │ water. Hyderabad uses HMWSSB.       │
│                     │                                                            │            │              │ Scraper runs, returns 0.            │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ housing             │ rhreporting.nic.in (PMAY-U)                                │ Weekly Sun │ housing.ts   │ ⚠️ SEED — 2BHK Housing Scheme        │
│                     │ 2bhk.telangana.gov.in (Telangana 2BHK)                     │            │              │ (Telangana flagship) + PMAY-U.     │
│                     │ pmay-urban.gov.in                                           │            │              │ Seed if data available.             │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ schools             │ schooleducation.telangana.gov.in                            │ Weekly Sun │ schools.ts   │ ✅ SEED — UDISE+ data available.     │
│                     │ udiseplus.gov.in                                            │            │              │ data.telangana.gov.in has UDISE+   │
│                     │ data.telangana.gov.in (UDISE+ Hyderabad dataset)           │            │              │ dataset for Hyderabad 2023-24.     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ finance / budget    │ finance.telangana.gov.in (state budget)                    │ Monthly 1st│ finance.ts   │ ✅ SEED — Telangana budget 2026-27   │
│                     │ ghmc.gov.in (GHMC budget)                                  │            │              │ available. GHMC budget searchable.  │
│                     │ hmda.gov.in (HMDA budget)                                  │            │              │ Store in RUPEES (not Crores).       │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ transport           │ tsrtconline.in (TSRTC bus routes)                           │ Monthly 1st│ transport.ts │ ✅ SEED — TSRTC + Metro + MMTS.      │
│                     │ hmrl.co.in (Hyderabad Metro schedules)                     │            │              │ data.telangana.gov.in has GTFS     │
│                     │ data.telangana.gov.in (HMRL GTFS + MMTS GTFS)             │            │              │ for Metro + MMTS (machine-readable) │
│                     │ indianrailways.gov.in (train schedules)                    │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ schemes             │ telangana.gov.in/government-initiatives                    │ Monthly 1st│ schemes.ts   │ ✅ SEED — Central + Telangana state   │
│                     │ meeseva.telangana.gov.in (citizen services)                │            │              │ schemes. URLs to application pages. │
│                     │ india.gov.in (central schemes)                             │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ soil / farm         │ N/A — Hyderabad is 100% urban                              │ Monthly 15 │ soil.ts      │ ⚠️ EMPTY — no farmland in district.  │
│                     │                                                            │            │              │ Scraper runs, returns 0.            │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ elections           │ results.eci.gov.in (Election Commission)                   │ Monthly 15 │ elections.ts │ ✅ SEED — 2023 Assembly + 2024 LS.   │
│                     │ Telangana SEC (tsec.gov.in) for local body elections       │            │              │ 15 assembly + 1 LS constituencies.  │
│                     │ myneta.info (candidate affidavits)                         │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ leadership          │ hyderabad.telangana.gov.in/about-district/whos-who/        │ SEED ONLY  │ N/A          │ ✅ SEED — 10-tier hierarchy.          │
│                     │ telangana.gov.in/contacts/district-officials/              │            │              │ Updated via news action engine      │
│                     │ eci.gov.in (elected reps)                                  │            │              │ when leadership changes detected.   │
│                     │ results.eci.gov.in (2023/2024 winners)                     │            │              │ Never deleteMany — upsert only.    │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ offices             │ hyderabad.telangana.gov.in                                 │ SEED ONLY  │ N/A          │ ✅ SEED — Collectorate, GHMC,        │
│                     │ ghmc.gov.in, hmda.gov.in, hmrl.co.in                      │            │              │ HMDA, courts, RTOs, etc.            │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ services            │ meeseva.telangana.gov.in                                   │ SEED ONLY  │ N/A          │ ✅ SEED — certificates, licenses,    │
│                     │ registration.telangana.gov.in (IGRS)                       │            │              │ registrations. Real apply URLs.     │
│                     │ dharani.telangana.gov.in (land services)                   │            │              │                                     │
│                     │ transport.telangana.gov.in (RTA services)                  │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ famous              │ Wikipedia (birthplace verification)                         │ SEED ONLY  │ N/A          │ ✅ SEED — bornInDistrict=true ONLY.   │
│                     │ Verify EACH person born in Hyderabad district              │            │              │ P.V. Sindhu ✓, Azharuddin ✓.       │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ industries          │ Manual — HITEC City, Genome Valley, Financial District,    │ SEED ONLY  │ N/A          │ ✅ SEED — IT/Pharma/GCCs.            │
│                     │ T-Hub, Laad Bazaar, Pearl Market                           │            │              │                                     │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ population          │ censusindia.gov.in (Census 2011)                           │ SEED ONLY  │ N/A          │ ✅ SEED — 2001, 2011, 2026 est.      │
│                     │ ecostat.telangana.gov.in (state statistics)                │            │              │ Static historical data.             │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ rainfall            │ imd.gov.in (India Meteorological Dept)                     │ SEED ONLY  │ N/A          │ ✅ SEED — historical monthly avgs.    │
│                     │ data.telangana.gov.in (mandal-level rainfall 2004-2019+)   │            │ + weather.ts │ Live rainfall comes via weather.ts. │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ overview            │ Aggregated from all above sources                          │ On request │ N/A          │ ✅ AUTO — pulls from DB.              │
│                     │ No external API call — reads from DB                       │            │              │ Includes taluk list, leader count,  │
│                     │                                                            │            │              │ infra count, scheme count.          │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ health (score)      │ Calculated from 10 categories across all modules           │ Weekly     │ health-      │ ✅ AUTO — runs for all active         │
│                     │ src/lib/health-score.ts                                    │            │ score.ts     │ districts. Type: "metro".           │
│                     │ DistrictHealthScore table                                  │            │              │ Boosts infra+digital, reduces agri. │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ AI insights         │ Generated by callAI() using Claude/Gemini                  │ Every 2h   │ insight-     │ ✅ AUTO — Vercel cron generates       │
│                     │ /api/cron/generate-insights                                │            │ generator.ts │ insights for 29 modules × all       │
│                     │ Stored in AIModuleInsight table                            │            │              │ active districts. No code change.   │
├─────────────────────┼────────────────────────────────────────────────────────────┼────────────┼──────────────┼─────────────────────────────────────┤
│ market ticker       │ Yahoo Finance v8 API (no key)                              │ Every 5min │ market-      │ ✅ AUTO — SENSEX, NIFTY, Gold,        │
│                     │ open.er-api.com (forex rates)                              │ (market h) │ ticker       │ Silver, Crude, USD/INR.             │
│                     │                                                            │ 30min off  │              │ Not district-specific — global.     │
└─────────────────────┴────────────────────────────────────────────────────────────┴────────────┴──────────────┴─────────────────────────────────────┘
```

---

## SCRAPER GAPS TO FIX LATER (not blocking for launch)

These are known gaps where the scraper is Karnataka-specific and won't return data for Hyderabad.
They do NOT break anything — the scraper gracefully returns 0 records.
Add these as TODO items in BLUEPRINT-UNIFIED.md:

```
TODO (post-Hyderabad launch):
1. power.ts — Add TGSPDCL adapter (currently BESCOM-only)
   Source: tgsouthernpower.org or TGSPDCL grievance portal
   Impact: Power outage module will be empty for Telangana districts

2. dams.ts — Add Telangana irrigation portal adapter
   Source: water.telangana.gov.in or irrigation.telangana.gov.in  
   Impact: Water/dam module empty for Hyderabad (correct — no dams in district)
   For future Telangana districts with dams (e.g., Karimnagar has Srisailam), 
   this will need a DISTRICT_DAMS entry + Telangana API endpoint

3. data.telangana.gov.in CKAN API integration
   Available NOW (no code yet):
     - HMRL Metro GTFS (live transit data)
     - MMTS suburban rail GTFS
     - TGSPDCL electricity consumption by category
     - Daily crop prices from ALL Telangana market yards
     - Mandal-level rainfall data
     - Monthly air quality index
     - UDISE+ education data
     - Vehicle registration data
     - Tourism geolocation data
   These could replace/supplement manual seeds with live API data.
```

---

## TELANGANA OPEN DATA API (data.telangana.gov.in) — FUTURE INTEGRATION

Telangana has one of India's best open data portals (CKAN-based, 658+ datasets).
Portal: data.telangana.gov.in
API type: CKAN (same API as data.gov.in but state-level)

For future scraper integration, these datasets are directly usable:
```
DATASET NAME                                          → MAPS TO MODULE
─────────────────────────────────────────────────────────────────────────
HMRL Metro Rail GTFS (stops, schedules, fares)        → transport
MMTS Suburban Rail GTFS (South Central Railway)        → transport
TGSPDCL electricity consumption (monthly, by type)    → power
Daily crop prices from all market yards               → crops
Telangana rainfall data (mandal level, 2004+)         → weather / rainfall
Air quality index (monthly, Hyderabad)                → weather / alerts
UDISE+ education data for Hyderabad (2023-24)         → schools
Vehicle registration data (2014-2021)                 → transport
Tourism data with geolocation                         → industries
Telangana district & mandal shapefiles                → GeoJSON maps
GHMC birth/death data                                 → population
EV charging station data                              → power / transport
Haritha Haram (tree planting) data                    → environment
Telangana socio-economic outlook (state GDP, PCI)     → finance
```

NOTE: This is NOT needed for initial launch. The manual seed + existing scrapers
are sufficient. This is for Phase 2 live data integration.
# POWER SCRAPER FIX — Add to FINAL-CLAUDE-CODE-HYDERABAD.md
# Paste this into the Step 5a (Background Code Fixes) section
# ═══════════════════════════════════════════════════════════

## Fix 5: Make power.ts state-aware (DISCOM adapter pattern)

**File: src/scraper/jobs/power.ts**

Currently this file has a hardcoded BESCOM URL and only parses Karnataka's power
outage format. Refactor it to support multiple state DISCOMs.

### Architecture change:

```typescript
/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Power Outages — Multi-DISCOM scraper
// Schedule: Every 15 min
// Supports: BESCOM (Karnataka), CESC Mysuru, TGSPDCL (Telangana),
//           BEST (Mumbai), CESC Kolkata, TANGEDCO (Tamil Nadu)
// ═══════════════════════════════════════════════════════════
import * as cheerio from "cheerio";
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// ── DISCOM Configuration per state ────────────────────────
// Each entry maps a state slug to its power distribution company,
// source URL, and parser function.
// To add a new state: add an entry here + implement the parser.
// If no entry exists for a state, the scraper skips gracefully.

interface DiscomConfig {
  name: string;            // DISCOM name (stored in PowerOutage.source)
  url: string;             // Outage data URL
  parser: (html: string, ctx: JobContext) => ParsedOutage[];
}

interface ParsedOutage {
  area: string;
  type: string;            // "Planned" | "Unplanned" | "Scheduled"
  reason: string;
  startTime: Date;
  endTime: Date;
}

const DISCOM_BY_STATE: Record<string, DiscomConfig> = {
  // ── Karnataka ───────────────────────────────────────────
  "karnataka": {
    name: "BESCOM",
    url: "https://bescom.karnataka.gov.in/page/Planned+Outage/en",
    parser: parseBESCOM,
  },
  // NOTE: Mysuru uses CESC, not BESCOM. If you need CESC-specific parsing,
  // you can add district-level overrides later. For now BESCOM covers Karnataka state.

  // ── Telangana ───────────────────────────────────────────
  "telangana": {
    name: "TGSPDCL",
    url: "https://tgsouthernpower.org",
    parser: parseTGSPDCL,
  },

  // ── Delhi ───────────────────────────────────────────────
  // Delhi has 3 private DISCOMs. Power scraping is complex.
  // "delhi": {
  //   name: "BSES/Tata Power",
  //   url: "...",
  //   parser: parseDelhiPower,
  // },

  // ── Maharashtra ─────────────────────────────────────────
  // "maharashtra": {
  //   name: "BEST/MSEDCL",
  //   url: "...",
  //   parser: parseMSEDCL,
  // },

  // ── West Bengal ─────────────────────────────────────────
  // "west-bengal": {
  //   name: "CESC Kolkata",
  //   url: "https://www.cesc.co.in",
  //   parser: parseCESCKolkata,
  // },

  // ── Tamil Nadu ──────────────────────────────────────────
  // "tamil-nadu": {
  //   name: "TANGEDCO",
  //   url: "...",
  //   parser: parseTANGEDCO,
  // },
};

// Override at district level if a district uses a different DISCOM than state default
const DISCOM_DISTRICT_OVERRIDE: Record<string, DiscomConfig> = {
  // Example: Mysuru uses CESC, not BESCOM
  // "mysuru": { name: "CESC Mysuru", url: "...", parser: parseCESCMysuru },
};

// ── Main entry point ──────────────────────────────────────
export async function scrapePower(ctx: JobContext): Promise<ScraperResult> {
  // Check for district-level override first, then fall back to state config
  const config = DISCOM_DISTRICT_OVERRIDE[ctx.districtSlug]
    ?? DISCOM_BY_STATE[ctx.stateSlug];

  if (!config) {
    ctx.log(`Power: no DISCOM adapter configured for state "${ctx.stateSlug}" — skipping`);
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    const res = await fetch(config.url, {
      headers: {
        "User-Agent": "ForThePeople.in/1.0 (citizen transparency platform)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      ctx.log(`Power: HTTP ${res.status} from ${config.name} — skipping`);
      return { success: true, recordsNew: 0, recordsUpdated: 0 };
    }

    const html = await res.text();
    const outages = config.parser(html, ctx);

    let newCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const outage of outages) {
      // Deduplication: same area + same day
      const existing = await prisma.powerOutage.findFirst({
        where: {
          districtId: ctx.districtId,
          area: outage.area,
          startTime: { gte: today },
        },
      });

      if (!existing) {
        await prisma.powerOutage.create({
          data: {
            districtId: ctx.districtId,
            area: outage.area,
            type: outage.type,
            reason: outage.reason,
            startTime: outage.startTime,
            endTime: outage.endTime,
            active: outage.endTime > new Date(),
            source: config.name,
          },
        });
        newCount++;
      }
    }

    // Mark past outages as inactive
    await prisma.powerOutage.updateMany({
      where: {
        districtId: ctx.districtId,
        active: true,
        endTime: { lt: new Date() },
      },
      data: { active: false },
    });

    if (newCount === 0) {
      ctx.log(`Power: no new outages from ${config.name} (may have changed layout or no data for this district)`);
    } else {
      ctx.log(`Power: ${newCount} new outages from ${config.name}`);
    }

    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Power error (${config.name}): ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}

// ── BESCOM Parser (Karnataka) ─────────────────────────────
// Source: bescom.karnataka.gov.in/page/Planned+Outage/en
// Format: HTML table with Date | Time | Area | Reason
function parseBESCOM(html: string, ctx: JobContext): ParsedOutage[] {
  const $ = cheerio.load(html);
  const results: ParsedOutage[] = [];
  const districtName = ctx.districtSlug.replace(/-/g, " ");

  $("table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const area = $(cells[0]).text().trim();
    const timeText = $(cells[1]).text().trim();
    const reason = $(cells[2]).text().trim() || "Planned maintenance";

    if (!area.toLowerCase().includes(districtName)) return;
    if (!area) return;

    const timeMatch = timeText.match(/(\d{1,2}:\d{2})\s*(?:to|-)\s*(\d{1,2}:\d{2})/i);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startTime = new Date(today);
    const endTime = new Date(today);

    if (timeMatch) {
      const [sh, sm] = timeMatch[1].split(":").map(Number);
      const [eh, em] = timeMatch[2].split(":").map(Number);
      startTime.setHours(sh, sm);
      endTime.setHours(eh, em);
    } else {
      startTime.setHours(9, 0);
      endTime.setHours(17, 0);
    }

    results.push({ area, type: "Planned", reason, startTime, endTime });
  });

  return results;
}

// ── TGSPDCL Parser (Telangana) ────────────────────────────
// Source: tgsouthernpower.org
// NOTE: TGSPDCL does NOT publish outages in a scrapeable HTML table.
// They use PDFs, social media, and their mobile app for notifications.
// 
// Current approach: Return empty results gracefully.
// Future approach options:
//   1. Scrape TGSPDCL Twitter/X feed for outage announcements
//   2. Use data.telangana.gov.in API if outage dataset becomes available
//   3. Parse TGSPDCL consumer portal complaint patterns
//   4. Use TGSPDCL mobile app API (if discoverable)
//
// For now, Hyderabad power outage data comes from:
//   - Seed data (manually seeded planned outages)
//   - News action engine (auto-detects power outage news articles)
function parseTGSPDCL(_html: string, ctx: JobContext): ParsedOutage[] {
  ctx.log(`Power: TGSPDCL parser active — no scrapeable outage page available yet`);
  ctx.log(`Power: Hyderabad outages will be populated via news action engine`);
  return [];
}
```

### Why this fixes it for ALL states:

1. **New state?** → Add one entry to `DISCOM_BY_STATE` + implement parser function
2. **District uses different DISCOM than state default?** → Add to `DISCOM_DISTRICT_OVERRIDE`
3. **No parser yet?** → Scraper skips gracefully, logs why, returns success with 0 records
4. **DISCOM changes their website?** → Only the parser function needs updating, not the main logic

### What happens for Hyderabad right now:

The TGSPDCL parser returns empty results because their portal doesn't have a scrapeable outage page. But power outage data STILL gets populated through two other paths:

1. **News action engine** — When news articles mention "power cut Hyderabad" or "TGSPDCL outage", the AI classifier auto-creates PowerOutage records with confidence scoring
2. **Manual seed** — You can seed known planned outages in the seed file

### Update docs/BLUEPRINT-UNIFIED.md:

Add to Section 14 (SCRAPING SOURCES) under the power entry:
```
BESCOM:        bescom.karnataka.gov.in (Karnataka — HTML table parser)
TGSPDCL:       tgsouthernpower.org (Telangana — no scrapeable outage page,
               populated via news action engine + manual seed)
CESC Mysuru:   District override available (Karnataka — Mysuru district)
BEST:          best.gov.in (Mumbai — TODO: add parser)
CESC Kolkata:  cesc.co.in (Kolkata — TODO: add parser)
TANGEDCO:      tangedco.org (Tamil Nadu — TODO: add parser)
BSES/Tata:     Multiple DISCOMs (Delhi — TODO: add parser)
```

### Update docs/DISTRICT-EXPANSION-SKILL.md:

Add to the seeding checklist:
```
□ Power/DISCOM: Check if state DISCOM has entry in DISCOM_BY_STATE (power.ts)
    If yes → scraper auto-works
    If no  → add entry + parser function, OR leave empty (news engine fills gaps)
    Current supported DISCOMs: BESCOM (Karnataka), TGSPDCL (Telangana)
```

---

# ═══════════════════════════════════════════════════════════
# CRITICAL LEGAL FIX — NO "SCRAPER" LANGUAGE ON PUBLIC SITE
# ═══════════════════════════════════════════════════════════

## RULE (permanent — applies to ALL districts, ALL expansions):

The words **"scraper"**, **"scraping"**, **"scraped"** must NEVER appear on any:
- User-facing page (HTML rendered in browser)
- UI text, button label, tooltip, or modal
- Meta description, page title, or SEO content
- Public API response body (anything returned to the browser)
- About page, disclaimer page, footer, header
- Error messages shown to users

**Internal code is fine** — file names (`scraper/`), function names (`scrapePower()`),
TypeScript comments, server-side console.log, ScraperLog database table — users never see these.

### Public-facing language to use instead:
```
❌ "scraped from"        → ✅ "sourced from"
❌ "scraper"             → ✅ "data aggregation service" or "data pipeline"
❌ "we scrape"           → ✅ "we collect data from" / "we aggregate data from"
❌ "scraping frequency"  → ✅ "data refresh frequency" / "update interval"
❌ "no data is scraped"  → ✅ "no data is collected from unofficial sources"
```

### Fix required NOW:

**File: src/app/about/page.tsx**

Find this line:
```
No data is scraped from unofficial sources or estimated.
```

Replace with:
```
No data is collected from unofficial sources or estimated.
```

This is the ONLY user-facing file currently using the word "scraped".
All other public pages (disclaimer, footer, dictionary) already use "sourced from".

### Add to BLUEPRINT-UNIFIED.md legal section:

Under the "NEVER DO" list, add:
```
✗ Use the word "scraper/scraping/scraped" on any public-facing page or API response
  (internal code is fine — file names, function names, logs, comments)
  Always use: "sourced from", "collected from", "aggregated from" government portals
```

