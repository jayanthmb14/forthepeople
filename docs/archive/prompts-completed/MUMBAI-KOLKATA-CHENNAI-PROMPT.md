# FORTHEPEOPLE.IN — ADD MUMBAI, KOLKATA & CHENNAI — CLAUDE CODE PROMPT
# ═══════════════════════════════════════════════════════════════════
# Paste this ENTIRE prompt into Claude Code.
# ⚠️  DO NOT DEPLOY. Everything runs LOCAL ONLY until I verify.
# ⚠️  Only ONE district per state is active. All other districts stay inactive.
# ⚠️  One-command activation script is included for future use.
# Estimated: 1-2 Claude Code sessions
# ═══════════════════════════════════════════════════════════════════

## INSTRUCTIONS FOR CLAUDE CODE

Execute steps ONE AT A TIME. I will tell you which steps to run.
Do NOT try to execute all steps at once.

**⚠️ CRITICAL — DO NOT READ THESE FILES (they are huge and will crash the context):**
- seed-bengaluru-data.ts
- seed-bengaluru-data-ext-b.ts
- seed-mysuru-data.ts
- seed-bengaluru-leaders.ts
- seed-bengaluru-leaders-fix.ts
- seed-delhi-data.ts (if it exists already)
- Any existing seed file larger than 200 lines

You already know the seed file pattern from the prompt instructions below.
Just follow the structure described and create new files directly.
Only READ the files you need to MODIFY (seed-hierarchy.ts, districts.ts, weather.ts, crops.ts, globals.css).

**DO NOT:**
- Run `git push` or deploy to Vercel
- Run `npx vercel --prod` or any deployment command
- Modify any existing Karnataka or Delhi district data
- Delete or alter any existing seed data
- Read large existing seed files to "understand the pattern" — the pattern is in this prompt

**DO:**
- Run everything against LOCAL Prisma dev proxy (not production Neon)
- Create ONE seed file per district (3 total)
- Test by visiting each district at localhost:3000
- Create an activation script for future district expansion
- Verify existing districts (Mandya, Mysuru, Bengaluru Urban) still work

**EXECUTION ORDER — wait for my instruction before each group:**
```
Group A: Steps 1-4  (hierarchy + constants + overrides + fonts)
Group B: Step 5     (Mumbai seed file)
Group C: Step 6     (Kolkata seed file)
Group D: Step 7     (Chennai seed file)
Group E: Steps 8-10 (activation script + docs + testing)
```
When I say "run Group A", execute Steps 1-4 only. Then stop and wait.

---

## PROJECT CONTEXT

```
PROJECT:          ForThePeople.in — India's Citizen Transparency Platform
STACK:            Next.js 16 + TypeScript + Tailwind v4 + Prisma 7 + Neon PostgreSQL
ORM:              Prisma 7.5.0 — client import from '../src/generated/prisma'
ADAPTER:          @prisma/adapter-pg — new PrismaPg({ connectionString })
DB VALUES:        All money stored in RUPEES (display divides by 1e7 for Crores)
CURRENT PILOTS:   Mandya, Mysuru, Bengaluru Urban (Karnataka) — DO NOT TOUCH
LOCAL DEV:        Terminal 1: npx prisma dev | Terminal 2: npm run dev
LOCAL DB PORT:    51214 (direct postgresql://)
```

### CRITICAL RULES
```
1. Prisma import: import { PrismaClient } from '../src/generated/prisma'
2. Adapter: import { PrismaPg } from '@prisma/adapter-pg'
3. Money: RUPEES not Crores (₹50 Cr = 500000000)
4. Hierarchy seeder: upsert only, never deleteMany
5. Data seeder: check count before insert, use createMany with skipDuplicates
6. File header: always include ForThePeople.in copyright + MIT attribution
7. DO NOT run git push or deploy — LOCAL TESTING ONLY
8. Each state uses different governance terminology — pay attention:
     Maharashtra: Collector (not DC), SP, CEO ZP
     West Bengal: DM (District Magistrate), SP, Sabhadhipati (ZP Chair)
     Tamil Nadu: Collector, SP, Project Director DRD
9. Mumbai = Mumbai City + Mumbai Suburban (2 revenue districts, but we treat
   "Mumbai" as a single district for simplicity — slug: "mumbai")
10. Kolkata's official district name is just "Kolkata" (no North/South split needed)
11. Chennai district slug: "chennai"
```

---

## STEP 1: UPDATE HIERARCHY SEEDER

**File: prisma/seed-hierarchy.ts**

Add 3 new states with their districts. Use upsert pattern.
Only Mumbai, Kolkata, and Chennai get `active: true`. All sibling districts stay `active: false`.

### Maharashtra
```
State:
  name: "Maharashtra", nameLocal: "महाराष्ट्र", slug: "maharashtra"
  capital: "Mumbai", active: true

Districts (update existing entries + keep others inactive):
  ✅ ACTIVE — Mumbai
     slug: "mumbai", nameLocal: "मुंबई", active: true
     tagline: "Financial Capital of India"
     population: 12442373, area: 603, literacy: 89.73, sexRatio: 832
     density: 20634, talukCount: 0, villageCount: 0 (fully urban)

  ❌ INACTIVE — Keep existing: Pune, Nagpur, Nashik, Aurangabad as inactive
```

Mumbai subdivisions (as Taluk records):
```
Andheri, Bandra, Borivali, Kurla, Dadar, Colaba, Fort/Town, Malad
```

### West Bengal
```
State:
  name: "West Bengal", nameLocal: "পশ্চিমবঙ্গ", slug: "west-bengal"
  capital: "Kolkata", active: true

Districts:
  ✅ ACTIVE — Kolkata
     slug: "kolkata", nameLocal: "কলকাতা", active: true
     tagline: "City of Joy"
     population: 4486679, area: 185, literacy: 87.14, sexRatio: 899
     density: 24252, talukCount: 0, villageCount: 0 (fully urban)

  ❌ INACTIVE — Keep existing: Howrah, Darjeeling, Murshidabad, Bardhaman as inactive
```

Kolkata subdivisions (as Taluk records):
```
Kolkata North, Kolkata South, Kolkata Central, Kolkata East, Kolkata West (Port)
```

### Tamil Nadu
```
State:
  name: "Tamil Nadu", nameLocal: "தமிழ்நாடு", slug: "tamil-nadu"
  capital: "Chennai", active: true

Districts:
  ✅ ACTIVE — Chennai
     slug: "chennai", nameLocal: "சென்னை", active: true
     tagline: "Gateway to South India"
     population: 4646732, area: 426, literacy: 90.33, sexRatio: 951
     density: 10908, talukCount: 3, villageCount: 0 (mostly urban)

  ❌ INACTIVE — Keep existing: Coimbatore, Madurai, Tiruchirappalli, Salem as inactive
```

Chennai taluks:
```
Egmore-Nungambakkam, Mambalam-Guindy, Madhavaram
```

---

## STEP 2: UPDATE STATIC CONSTANTS

**File: src/lib/constants/districts.ts**

Find each state's existing entry and update:

### Maharashtra — set state `active: true`, Mumbai district `active: true`
```typescript
{
  slug: "maharashtra", name: "Maharashtra", nameLocal: "महाराष्ट्र",
  active: true, capital: "Mumbai", type: "state",
  districts: [
    { name: "Mumbai", slug: "mumbai", active: true },
    lockedDistrict("pune", "Pune"),
    lockedDistrict("nagpur", "Nagpur"),
    lockedDistrict("nashik", "Nashik"),
    lockedDistrict("aurangabad", "Aurangabad"),
  ],
},
```

### West Bengal — set state `active: true`, Kolkata district `active: true`
```typescript
{
  slug: "west-bengal", name: "West Bengal", nameLocal: "পশ্চিমবঙ্গ",
  active: true, capital: "Kolkata", type: "state",
  districts: [
    { name: "Kolkata", slug: "kolkata", active: true },
    lockedDistrict("howrah", "Howrah"),
    lockedDistrict("darjeeling", "Darjeeling"),
    lockedDistrict("murshidabad", "Murshidabad"),
    lockedDistrict("bardhaman", "Bardhaman"),
  ],
},
```

### Tamil Nadu — set state `active: true`, Chennai district `active: true`
```typescript
{
  slug: "tamil-nadu", name: "Tamil Nadu", nameLocal: "தமிழ்நாடு",
  active: true, capital: "Chennai", type: "state",
  districts: [
    { name: "Chennai", slug: "chennai", active: true },
    lockedDistrict("coimbatore", "Coimbatore"),
    lockedDistrict("madurai", "Madurai"),
    lockedDistrict("tiruchirappalli", "Tiruchirappalli"),
    lockedDistrict("salem", "Salem"),
  ],
},
```

---

## STEP 3: ADD WEATHER & CROP OVERRIDES

### File: src/scraper/jobs/weather.ts — add to OWM_CITY_OVERRIDE:
```typescript
'mumbai': 'Mumbai',
'kolkata': 'Kolkata',
'chennai': 'Chennai',
```

### File: src/scraper/jobs/crops.ts — add to AGMARKNET_DISTRICT_OVERRIDE:
```typescript
'mumbai': 'Mumbai',
'kolkata': 'Kolkata',
'chennai': 'Chennai',
```

---

## STEP 4: ADD REGIONAL FONTS

**File: src/app/globals.css**

Add font imports for Tamil and Bengali scripts (Hindi/Devanagari already loaded for Kannada):

```css
/* Tamil script for Tamil Nadu */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;600;700&display=swap');

/* Bengali script for West Bengal */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap');
```

Devanagari is already available (used for Kannada nameLocal fields). No new import needed for Maharashtra.

---

## STEP 5: CREATE MUMBAI SEED FILE

**File: prisma/seed-mumbai-data.ts**

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Mumbai District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-mumbai-data.ts
// ═══════════════════════════════════════════════════════════
```

### Seed the following data (use REAL data — search the web):

#### A. LEADERSHIP (Mumbai-specific 10-tier hierarchy)
```
Tier 1: Lok Sabha MPs — Mumbai has 6 LS constituencies
        (Mumbai North, Mumbai North Central, Mumbai North East,
         Mumbai North West, Mumbai South, Mumbai South Central)
        Search for 2024 winners for each

Tier 2: Maharashtra Assembly MLAs in Mumbai
        Search for 2024 Maharashtra Assembly election results for Mumbai constituencies

Tier 3: BMC (Brihanmumbai Municipal Corporation)
        Mayor, Municipal Commissioner — search for current
        (NOTE: BMC is Asia's richest municipal body)

Tier 4: Administration
        Collector, Mumbai City / Mumbai Suburban — search for current
        Mumbai Metropolitan Region Development Authority (MMRDA) Commissioner
        Additional Collector

Tier 5: Police
        Commissioner of Police, Mumbai — search for current
        Joint CP, Crime Branch
        DCP zones (South, Central, North, East, West)
        NOTE: Mumbai Police is a commissionerate, not SP system

Tier 6: Judiciary
        Bombay High Court Chief Justice — search for current
        City Civil & Sessions Court, Mumbai

Tier 7: Key Bodies
        MMRDA Commissioner
        Mumbai Port Authority Chairman
        MHADA CEO (Maharashtra Housing)
        BEST General Manager (bus+electricity)
        Mumbai Metro Rail Corporation MD

Tier 8-10: Department heads, district officers, zone officers
```

#### B. BUDGET DATA (Maharashtra state + BMC budget for Mumbai)
```
BMC annual budget is ~₹52,000 Cr (one of India's largest municipal budgets)
Sectors: Infrastructure, Water Supply, Sewerage, Health, Education,
         Roads & Bridges, SWM, Fire Brigade, Gardens, Development Planning
Search: "BMC budget 2025-26" for real numbers
```

#### C. INFRASTRUCTURE PROJECTS (20+ real Mumbai projects)
```
METRO:
  Mumbai Metro Line 3 (Colaba-Bandra-SEEPZ) — Aqua Line, underground
  Mumbai Metro Line 2A (Dahisar to DN Nagar)
  Mumbai Metro Line 7 (Andheri East to Dahisar East)
  Mumbai Metro Line 4 (Wadala to Ghatkopar to Mulund to Thane)
  Mumbai Metro Line 6 (Swami Samarth Nagar to Vikhroli)

ROADS:
  Mumbai Coastal Road (South — Nariman Point to Bandra)
  Mumbai Trans Harbour Link (MTHL / Atal Setu) — India's longest sea bridge
  Goregaon-Mulund Link Road
  Eastern Freeway extension

RAIL:
  Mumbai Urban Transport Project (MUTP) Phase 3
  Bullet Train (Mumbai-Ahmedabad High Speed Rail) — Mumbai terminal

WATER:
  Gargai Dam Project (additional water supply)
  Surya Water Supply Project
  Mumbai Sewage Disposal Project Phase 2

HOUSING:
  SRA (Slum Rehabilitation Authority) projects
  MHADA housing lotteries
  Dharavi Redevelopment Project (world's largest slum rehab)
```

#### D-P. SAME PATTERN AS DELHI PROMPT
Seed: Demographics, Police Stations (search for real ones in Mumbai — Colaba PS, Marine Drive PS, Azad Maidan PS, DN Nagar PS, Bandra PS, Juhu PS, Andheri PS, etc.), Schools (20+), Government Offices, Schemes (Central + Maharashtra state — Maharashtra has Ladki Bahin Yojana, Mahatma Phule Jan Arogya Yojana, etc.), Election Results (2024 LS + 2024 Assembly), Court Stats, RTI Templates, Famous Personalities (Bal Thackeray, Sachin Tendulkar, Lata Mangeshkar, Dr. B.R. Ambedkar connection, Dhirubhai Ambani, etc.), Local Industries (BSE/NSE, Bollywood/Film City, BKC business district, SEEPZ, Andheri-Powai IT corridor), Bus Routes (BEST), Train Schedules (Mumbai locals — Western/Central/Harbour lines + long distance from CSMT/LTT/Mumbai Central), Service Guides.

---

## STEP 6: CREATE KOLKATA SEED FILE

**File: prisma/seed-kolkata-data.ts**

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Kolkata District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-kolkata-data.ts
// ═══════════════════════════════════════════════════════════
```

### Seed the following data (use REAL data — search the web):

#### A. LEADERSHIP (Kolkata/West Bengal 10-tier hierarchy)
```
Tier 1: Lok Sabha MPs — Kolkata has 2 LS constituencies
        (Kolkata North, Kolkata South)
        Search for 2024 winners

Tier 2: West Bengal Assembly MLAs in Kolkata
        Search for 2021 WB Assembly results for Kolkata constituencies
        (NOTE: WB last election was 2021, next due 2026)

Tier 3: KMC (Kolkata Municipal Corporation)
        Mayor — search for current (historically TMC-held)
        Municipal Commissioner

Tier 4: Administration
        District Magistrate (DM), Kolkata — search for current
        NOTE: West Bengal uses "DM" not "DC" or "Collector"
        Additional DM
        Chief Secretary, West Bengal — search for current
        Governor of West Bengal — search for current
        Chief Minister — Mamata Banerjee (verify still current)

Tier 5: Police
        Commissioner of Police (CP), Kolkata — search for current
        (Kolkata is a commissionerate like Mumbai)
        Joint CP, Crime
        DCP North, DCP South, DCP Central, DCP East, DCP Port

Tier 6: Judiciary
        Calcutta High Court Chief Justice — search for current
        City Sessions Court, Kolkata

Tier 7: Key Bodies
        KMDA (Kolkata Metropolitan Dev Authority) Chairman
        Kolkata Port Authority Chairman
        Kolkata Metro Rail Corporation MD
        CESC (power distribution — private, RPG Group)

Tier 8-10: Department heads, district officers
```

#### B. BUDGET (KMC budget + WB state allocation for Kolkata)
```
KMC annual budget ~₹5,000-6,000 Cr
Sectors: Roads, Drainage, Lighting, Health, Education, SWM, Parks
Search: "KMC budget 2025-26 Kolkata" for real data
```

#### C. INFRASTRUCTURE PROJECTS (15+ real Kolkata projects)
```
METRO:
  Kolkata Metro East-West Corridor (Howrah Maidan to Salt Lake Sector V)
  Kolkata Metro Line 3 (Joka to Esplanade)
  Kolkata Metro Line 4 (Noapara to Barasat)
  Kolkata Metro Line 5 (Baranagar to Barrackpore)

ROADS:
  Tallah Bridge replacement
  Garden Reach Flyover
  Sealdah flyover

RIVER:
  Hooghly Riverfront Development
  East Kolkata Wetlands conservation project

HOUSING:
  Hidco New Town development
  Joka township expansion

SMART CITY:
  Kolkata Smart City Mission projects — New Town
```

#### D-P. SAME PATTERN
Demographics, Police Stations (Lalbazar HQ, Park Street PS, New Market PS, Bowbazar PS, Jorasanko PS, Bhawanipur PS, Lake Town PS, etc.), Schools (20+ — South Point School, La Martiniere, St. Xavier's, Presidency University, etc.), Offices, Schemes (Central + WB — Kanyashree, Swasthya Sathi, Lakshmir Bhandar, etc.), Elections, Courts, RTI, Famous Personalities (Rabindranath Tagore, Satyajit Ray, Subhas Chandra Bose, Mother Teresa, Sourav Ganguly, Amartya Sen, etc.), Local Industries (IT: Salt Lake Sector V, Rajarhat; Jute industry; Tea trading; Durga Puja economy), Transport (Kolkata trams, buses, Metro, Howrah Station trains), Service Guides.

---

## STEP 7: CREATE CHENNAI SEED FILE

**File: prisma/seed-chennai-data.ts**

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Chennai District Data Seed
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-chennai-data.ts
// ═══════════════════════════════════════════════════════════
```

### Seed the following data (use REAL data — search the web):

#### A. LEADERSHIP (Chennai/Tamil Nadu 10-tier hierarchy)
```
Tier 1: Lok Sabha MPs — Chennai has 3 LS constituencies
        (Chennai North, Chennai South, Chennai Central)
        Search for 2024 winners

Tier 2: TN Assembly MLAs in Chennai
        Search for 2021 TN Assembly results for Chennai constituencies
        (NOTE: TN last election was 2021, next due 2026)

Tier 3: Greater Chennai Corporation (GCC)
        Mayor — search for current
        Commissioner, GCC

Tier 4: Administration
        District Collector, Chennai — search for current
        NOTE: Tamil Nadu uses "Collector" (not DC or DM)
        Additional Collector
        Chief Secretary, Tamil Nadu
        Governor of Tamil Nadu — search for current
        Chief Minister — M.K. Stalin (verify still current)

Tier 5: Police
        Commissioner of Police (CP), Greater Chennai — search for current
        Joint CP, various zones
        NOTE: Chennai is a commissionerate

Tier 6: Madras High Court Chief Justice — search for current

Tier 7: Key Bodies
        CMDA (Chennai Metropolitan Dev Authority)
        Chennai Port Authority Chairman
        CMRL (Chennai Metro Rail Ltd) MD
        Chennai Metropolitan Water Supply (CMWSSB) MD
        MTC (Metropolitan Transport Corp) MD
        TANGEDCO (TN power) SE Chennai

Tier 8-10: Department heads, district officers
```

#### B. BUDGET (GCC + TN state allocation for Chennai)
```
GCC annual budget ~₹6,000-7,000 Cr
Sectors: Roads, Storm Water Drains, SWM, Health, Street Lighting, Parks
Search: "Greater Chennai Corporation budget 2025-26" for real data
```

#### C. INFRASTRUCTURE PROJECTS (15+ real Chennai projects)
```
METRO:
  Chennai Metro Phase 2 (3 corridors, 118 km) — under construction
  Chennai Metro Phase 1 Extension (Washermanpet to Wimco Nagar)

ROADS:
  Chennai Peripheral Ring Road (PRR) — 133 km
  Maduravoyal-Port elevated corridor

WATER:
  Cauvery Stage 2 water supply project (from Hogenakkal)
  Chennai desalination plants (Nemmeli, Perur)
  Kosasthalaiyar river restoration

RAIL:
  Chennai MRTS extension
  Chennai Suburban Railway — new corridors

HOUSING:
  TNHB mass housing projects
  PMAY-U projects across Chennai

SMART CITY:
  Chennai Smart City — T Nagar, Marina areas
  Integrated Command & Control Centre
```

#### D-P. SAME PATTERN
Demographics, Police Stations (Mylapore PS, T Nagar PS, Adyar PS, Anna Nagar PS, Egmore PS, Guindy PS, Nungambakkam PS, etc.), Schools (20+ — PSBB, DAV, Don Bosco, Loyola, Padma Seshadri, Sishya, IIT Madras campus schools, etc.), Offices, Schemes (Central + TN — Kalaignar Magalir Urimai Thogai, TN Noon Meal scheme, Amma Unavagam, Chief Minister's Health Insurance, etc.), Elections, Courts, RTI, Famous Personalities (C. Rajagopalachari, C.N. Annadurai, MGR, Jayalalithaa, A.R. Rahman, Viswanathan Anand, MS Subbulakshmi, etc.), Local Industries (IT corridor: Old Mahabalipuram Road/OMR, Tidel Park, SIPCOT; Automobile: Ambattur, Sriperumbudur; Port), Transport (MTC buses, MRTS, Metro, Chennai Central + Egmore trains), Service Guides.

---

## STEP 8: CREATE ACTIVATION SCRIPT

**File: scripts/activate-expansion-districts.ts**

This is for FUTURE USE — to activate more districts in these 3 states later.

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Additional Districts
// Run ONLY after verifying pilot districts work perfectly.
//
// Usage: npx tsx scripts/activate-expansion-districts.ts [state-slug] [district-slug]
//
// Examples:
//   npx tsx scripts/activate-expansion-districts.ts maharashtra pune
//   npx tsx scripts/activate-expansion-districts.ts west-bengal howrah
//   npx tsx scripts/activate-expansion-districts.ts tamil-nadu coimbatore
//   npx tsx scripts/activate-expansion-districts.ts --all-maharashtra
//   npx tsx scripts/activate-expansion-districts.ts --all-west-bengal
//   npx tsx scripts/activate-expansion-districts.ts --all-tamil-nadu
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

async function activateDistrict(stateSlug: string, districtSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) { console.log(`  ⚠️  State "${stateSlug}" not found`); return; }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug, stateId: state.id },
  });
  if (!district) { console.log(`  ⚠️  District "${districtSlug}" not found in ${stateSlug}`); return; }
  if (district.active) { console.log(`  ✓ ${district.name} already active`); return; }

  await prisma.district.update({ where: { id: district.id }, data: { active: true } });
  console.log(`  ✅ ${district.name} (${stateSlug}) — ACTIVATED`);
}

async function activateAllInState(stateSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) { console.log(`  ⚠️  State "${stateSlug}" not found`); return; }

  const districts = await prisma.district.findMany({
    where: { stateId: state.id, active: false },
  });

  for (const d of districts) {
    await prisma.district.update({ where: { id: d.id }, data: { active: true } });
    console.log(`  ✅ ${d.name} — ACTIVATED`);
  }
  console.log(`\n  Activated ${districts.length} districts in ${state.name}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/activate-expansion-districts.ts <state-slug> <district-slug>');
    console.log('  npx tsx scripts/activate-expansion-districts.ts --all-<state-slug>');
    process.exit(0);
  }

  if (args[0].startsWith('--all-')) {
    const stateSlug = args[0].replace('--all-', '');
    console.log(`🔓 Activating ALL districts in ${stateSlug}...\n`);
    await activateAllInState(stateSlug);
  } else if (args.length >= 2) {
    console.log(`🔓 Activating ${args[1]} in ${args[0]}...\n`);
    await activateDistrict(args[0], args[1]);
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('  1. Update src/lib/constants/districts.ts → set activated district active: true');
  console.log('  2. Seed data for the district (create prisma/seed-<district>-data.ts)');
  console.log('  3. git add -A && git commit && git push origin main');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

---

## STEP 9: UPDATE PROJECT DOCUMENTATION (DO NOT deploy)

### A. BLUEPRINT-UNIFIED.md — add under pilot scores:
```
Mumbai (Maharashtra):    [pending — run health score after testing]
Kolkata (West Bengal):   [pending]
Chennai (Tamil Nadu):    [pending]
```

### B. FORTHEPEOPLE-SKILL-UPDATED.md — update CURRENT STATE:
```
PILOT DISTRICTS:  7 active (Karnataka: Mandya, Mysuru, Bengaluru Urban;
                  Delhi: New Delhi; Maharashtra: Mumbai;
                  West Bengal: Kolkata; Tamil Nadu: Chennai)
```

### C. SCALING-CHECKLIST.md — add section:
```
## MULTI-STATE EXPANSION (April 2026)
- [x] Maharashtra: Mumbai seeded + activated
- [x] West Bengal: Kolkata seeded + activated
- [x] Tamil Nadu: Chennai seeded + activated
- [x] Regional fonts added (Tamil, Bengali)
- [x] Weather/crop overrides configured
- [x] Activation script created (scripts/activate-expansion-districts.ts)
- [ ] Local testing verified
- [ ] Production deployment
```

### D. README.md — update:
```
**Currently live:** Karnataka (Mandya, Mysuru, Bengaluru Urban) |
Delhi (New Delhi) | Maharashtra (Mumbai) | West Bengal (Kolkata) | Tamil Nadu (Chennai)
```

### E. DO NOT commit or push — just stage:
```bash
git add -A
git status  # Show me what changed — DO NOT COMMIT YET
```

---

## STEP 10: LOCAL TESTING CHECKLIST

```bash
# Prisma dev proxy should be running in Terminal 1

# Terminal 2:
npx prisma generate
npx tsx prisma/seed-hierarchy.ts
npx tsx prisma/seed-mumbai-data.ts
npx tsx prisma/seed-kolkata-data.ts
npx tsx prisma/seed-chennai-data.ts
npm run dev
```

### Verify each new district (check key modules):
```
http://localhost:3000/en/maharashtra/mumbai                 ← Overview
http://localhost:3000/en/maharashtra/mumbai/leadership       ← 10-tier
http://localhost:3000/en/maharashtra/mumbai/finance          ← Budget
http://localhost:3000/en/maharashtra/mumbai/infrastructure   ← Projects
http://localhost:3000/en/maharashtra/mumbai/schools          ← Schools
http://localhost:3000/en/maharashtra/mumbai/police           ← Police stations
http://localhost:3000/en/maharashtra/mumbai/schemes          ← Schemes

http://localhost:3000/en/west-bengal/kolkata                 ← Overview
http://localhost:3000/en/west-bengal/kolkata/leadership
http://localhost:3000/en/west-bengal/kolkata/finance
http://localhost:3000/en/west-bengal/kolkata/infrastructure
http://localhost:3000/en/west-bengal/kolkata/schools
http://localhost:3000/en/west-bengal/kolkata/police

http://localhost:3000/en/tamil-nadu/chennai                  ← Overview
http://localhost:3000/en/tamil-nadu/chennai/leadership
http://localhost:3000/en/tamil-nadu/chennai/finance
http://localhost:3000/en/tamil-nadu/chennai/infrastructure
http://localhost:3000/en/tamil-nadu/chennai/schools
http://localhost:3000/en/tamil-nadu/chennai/police
```

### Verify existing districts STILL WORK:
```
http://localhost:3000/en/karnataka/mandya
http://localhost:3000/en/karnataka/mysuru
http://localhost:3000/en/karnataka/bengaluru-urban
```

### Verify homepage shows all active districts:
```
http://localhost:3000
```

**Report what you see. Fix anything broken before proceeding.**

---

## CITY-SPECIFIC NOTES

### Mumbai
```
- BMC (Brihanmumbai Municipal Corporation) — governs all of Mumbai
- Mumbai Police is a commissionerate (CP, not SP)
- BEST provides both buses AND electricity in Mumbai island
- Mumbai suburban railway = lifeline — 3 lines: Western, Central, Harbour
- Dharavi Redevelopment is one of the world's largest urban renewal projects
- Mumbai Port Authority (formerly Mumbai Port Trust)
- MMRDA handles metro, infrastructure for Mumbai Metropolitan Region
```

### Kolkata
```
- KMC (Kolkata Municipal Corporation) — governs Kolkata proper
- Kolkata Police is a commissionerate (CP, not SP)
- CESC (private) handles electricity — NOT a state discom
- Kolkata still has functioning trams (heritage trams)
- Hooghly River (not Ganga — it's called Hooghly in this stretch)
- Kolkata has the oldest Metro in India (Line 1, operational since 1984)
- Howrah Station is across the river — technically in Howrah district, not Kolkata
- West Bengal uses DM (District Magistrate), not DC or Collector
- Sabhadhipati = ZP Chair (WB-specific term)
```

### Chennai
```
- GCC (Greater Chennai Corporation) — governs Chennai
- Chennai Police commissionerate (CP, not SP)
- TANGEDCO handles electricity (Tamil Nadu Generation & Distribution Corp)
- CMWSSB handles water (Chennai Metro Water Supply & Sewerage Board)
- Marina Beach = world's second longest urban beach
- OMR (Old Mahabalipuram Road) = India's second largest IT corridor after Bangalore
- Tamil Nadu uses "Collector" (traditional ICS terminology)
- Madras High Court (still officially called "Madras", not "Chennai" HC)
- Chennai has MRTS (Mass Rapid Transit System) — separate from Metro
```

---

## DATA SOURCES FOR WEB SEARCH

```
MUMBAI:
  mcgm.gov.in (BMC official)             mumbaipolice.gov.in
  mmrda.maharashtra.gov.in               mumbaiMetro.com
  maharashtra.gov.in                     best.gov.in (BEST buses)

KOLKATA:
  kmcgov.in (KMC official)              kolkatapolice.gov.in
  wbgov.com / wb.gov.in                 kmrc.in (Metro)
  kmda.wb.gov.in                        cesc.co.in (power)

CHENNAI:
  chennaicorporation.gov.in (GCC)       chennaipolice.gov.in
  tn.gov.in                             chennaimetrorail.org
  cmdachennai.gov.in                    chennaimetrowater.tn.nic.in

COMMON:
  results.eci.gov.in                    njdg.ecourts.gov.in
  censusindia.gov.in                    myneta.info
```

---

## SUMMARY OF FILES

```
CREATED:
  prisma/seed-mumbai-data.ts                    — Full Mumbai seed
  prisma/seed-kolkata-data.ts                   — Full Kolkata seed
  prisma/seed-chennai-data.ts                   — Full Chennai seed
  scripts/activate-expansion-districts.ts       — Generic activation script

MODIFIED:
  prisma/seed-hierarchy.ts                      — 3 new states + districts + taluks
  src/lib/constants/districts.ts                — 3 states set active, 3 districts active
  src/scraper/jobs/weather.ts                   — OWM overrides for 3 cities
  src/scraper/jobs/crops.ts                     — AGMARKNET overrides for 3 cities
  src/app/globals.css                           — Tamil + Bengali font imports
  BLUEPRINT-UNIFIED.md                          — Updated pilot count
  FORTHEPEOPLE-SKILL-UPDATED.md                 — Updated current state
  SCALING-CHECKLIST.md                          — Added expansion status
  README.md                                     — Updated currently live

NOT MODIFIED (DO NOT TOUCH):
  Any Karnataka or Delhi seed files
  vercel.json
  prisma/schema.prisma (no model changes needed)
```

---

## AFTER LOCAL TESTING IS COMPLETE

When satisfied, I will manually run:

```bash
git add -A
git commit -m "feat: Add Mumbai, Kolkata & Chennai — 3 new metro districts

- Maharashtra (Mumbai): full data — BMC leadership, ₹52K Cr budget, Metro/Coastal Road/MTHL infra, Bollywood/BSE industries
- West Bengal (Kolkata): full data — KMC leadership, Metro East-West, Hooghly riverfront, IT Salt Lake
- Tamil Nadu (Chennai): full data — GCC leadership, Metro Phase 2, OMR IT corridor, desalination plants
- Regional fonts: Noto Sans Tamil + Bengali added
- Generic activation script: scripts/activate-expansion-districts.ts
- Total active districts: 7 across 5 states/UTs"

git push origin main
```

## END OF PROMPT
