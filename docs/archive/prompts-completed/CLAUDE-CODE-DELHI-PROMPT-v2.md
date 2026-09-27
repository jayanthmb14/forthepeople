# FORTHEPEOPLE.IN — ADD DELHI (NCT) — CLAUDE CODE PROMPT
# ═══════════════════════════════════════════════════════════════════
# Paste this ENTIRE prompt into Claude Code.
# ⚠️  DO NOT DEPLOY. Everything runs LOCAL ONLY until I verify.
# ⚠️  Only New Delhi district will be active. Other 10 = inactive.
# ⚠️  A one-command activation script is created for later use.
# Estimated: 1 Claude Code session
# ═══════════════════════════════════════════════════════════════════

## INSTRUCTIONS FOR CLAUDE CODE

Read this entire file. Execute ALL steps in order. After every major step,
log what you did. At the end, start the local dev server so I can test.

**IMPORTANT — DO NOT:**
- Run `git push` or deploy to Vercel
- Run `npx vercel --prod` or any deployment command
- Modify any existing Karnataka district data
- Delete or alter any existing seed data

**IMPORTANT — DO:**
- Run everything against the LOCAL Prisma dev proxy (not production Neon)
- Test by visiting http://localhost:3000/en/delhi/new-delhi
- Verify all 29 modules render (even if some show "No data available" — that's fine)
- Create an activation script for the other 10 Delhi districts for later use

---

## PROJECT CONTEXT (read carefully)

```
PROJECT:          ForThePeople.in — India's Citizen Transparency Platform
LIVE URL:         https://forthepeople.in (DO NOT TOUCH — local only)
STACK:            Next.js 16 + TypeScript + Tailwind v4 + Prisma 7 + Neon PostgreSQL
ORM:              Prisma 7.5.0 — client import from '../src/generated/prisma'
ADAPTER:          @prisma/adapter-pg — new PrismaPg({ connectionString })
DB VALUES:        All money stored in RUPEES (display divides by 1e7 for Crores)
CURRENT PILOTS:   Mandya, Mysuru, Bengaluru Urban (Karnataka) — DO NOT TOUCH
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
6. Delhi = Union Territory (not state)
7. Delhi governance: LG + CM + DM per district + single Commissioner of Police
8. NDMC governs New Delhi district (not MCD)
9. No Gram Panchayats in Delhi (fully urban)
10. File header: always include ForThePeople.in copyright + MIT attribution
11. DO NOT run git push or deploy — LOCAL TESTING ONLY
```

---

## STEP 1: UPDATE HIERARCHY SEEDER

**File: prisma/seed-hierarchy.ts**

Add Delhi (UT) with all 11 revenue districts. Use upsert pattern.
Only New Delhi gets `active: true`. All others get `active: false`.

```
STATE (Union Territory):
  name: "Delhi", nameLocal: "दिल्ली", slug: "delhi"
  capital: "New Delhi", active: true

DISTRICTS (11 revenue districts — only #1 is active):

  1. ✅ ACTIVE — New Delhi
     slug: "new-delhi", nameLocal: "नई दिल्ली", active: true
     tagline: "Seat of India's Government"
     population: 142004, area: 35.0, literacy: 89.38, sexRatio: 902, density: 4057
     talukCount: 0, villageCount: 0

  2. ❌ INACTIVE — Central Delhi
     slug: "central-delhi", nameLocal: "मध्य दिल्ली", active: false
     tagline: "Heart of Old Delhi"
     population: 578671, area: 25.0, literacy: 83.14, sexRatio: 883, density: 23147

  3. ❌ INACTIVE — North Delhi
     slug: "north-delhi", nameLocal: "उत्तर दिल्ली", active: false
     tagline: "University & Civil Lines Hub"
     population: 887978, area: 60.0, literacy: 84.75, sexRatio: 895, density: 14800

  4. ❌ INACTIVE — North West Delhi
     slug: "north-west-delhi", nameLocal: "उत्तर पश्चिम दिल्ली", active: false
     tagline: "Delhi's Largest District"
     population: 3651261, area: 440.0, literacy: 82.47, sexRatio: 866, density: 8303

  5. ❌ INACTIVE — North East Delhi
     slug: "north-east-delhi", nameLocal: "उत्तर पूर्व दिल्ली", active: false
     tagline: "Densest District in India"
     population: 2241624, area: 60.0, literacy: 80.90, sexRatio: 886, density: 37360

  6. ❌ INACTIVE — East Delhi
     slug: "east-delhi", nameLocal: "पूर्व दिल्ली", active: false
     tagline: "Trans-Yamuna Gateway"
     population: 1707725, area: 64.0, literacy: 86.05, sexRatio: 881, density: 26683

  7. ❌ INACTIVE — South Delhi
     slug: "south-delhi", nameLocal: "दक्षिण दिल्ली", active: false
     tagline: "Affluent South & Diplomatic Enclave"
     population: 2731929, area: 250.0, literacy: 86.48, sexRatio: 898, density: 10928

  8. ❌ INACTIVE — South West Delhi
     slug: "south-west-delhi", nameLocal: "दक्षिण पश्चिम दिल्ली", active: false
     tagline: "Dwarka & Airport Hub"
     population: 2292958, area: 420.0, literacy: 85.51, sexRatio: 844, density: 5460

  9. ❌ INACTIVE — South East Delhi
     slug: "south-east-delhi", nameLocal: "दक्षिण पूर्व दिल्ली", active: false
     tagline: "Sarita Vihar & Badarpur Corridor"
     population: 1534795, area: 44.0, literacy: 85.11, sexRatio: 897, density: 34882

  10. ❌ INACTIVE — West Delhi
      slug: "west-delhi", nameLocal: "पश्चिम दिल्ली", active: false
      tagline: "Industrial & Residential Hub"
      population: 2543243, area: 129.0, literacy: 83.18, sexRatio: 876, density: 19714

  11. ❌ INACTIVE — Shahdara
      slug: "shahdara", nameLocal: "शाहदरा", active: false
      tagline: "East Bank of the Yamuna"
      population: 1693005, area: 55.0, literacy: 85.31, sexRatio: 882, density: 30782
```

**Subdivisions as Taluk records** (Delhi has subdivisions, not taluks):
```
New Delhi:         New Delhi Subdivision
Central Delhi:     Kotwali, Daryaganj
North Delhi:       Civil Lines, Sadar Bazaar, Model Town
North West Delhi:  Narela, Rohini, Kanjhawala
North East Delhi:  Seelampur, Seemapuri, Karawal Nagar
East Delhi:        Gandhi Nagar, Preet Vihar, Vivek Vihar
South Delhi:       Defence Colony, Hauz Khas, Mehrauli
South West Delhi:  Dwarka, Kapashera, Najafgarh
South East Delhi:  Sarita Vihar, Kalkaji, Okhla
West Delhi:        Rajouri Garden, Punjabi Bagh, Patel Nagar
Shahdara:          Shahdara, Seemapuri East
```

---

## STEP 2: UPDATE STATIC CONSTANTS

**File: src/lib/constants/districts.ts**

Find the existing Delhi entry in the Union Territories section. REPLACE it with:

```typescript
{
  slug: "delhi", name: "Delhi", nameLocal: "दिल्ली",
  active: true, capital: "New Delhi", type: "ut",
  districts: [
    { name: "New Delhi", slug: "new-delhi", active: true },
    { name: "Central Delhi", slug: "central-delhi", active: false },
    { name: "North Delhi", slug: "north-delhi", active: false },
    { name: "North West Delhi", slug: "north-west-delhi", active: false },
    { name: "North East Delhi", slug: "north-east-delhi", active: false },
    { name: "East Delhi", slug: "east-delhi", active: false },
    { name: "South Delhi", slug: "south-delhi", active: false },
    { name: "South West Delhi", slug: "south-west-delhi", active: false },
    { name: "South East Delhi", slug: "south-east-delhi", active: false },
    { name: "West Delhi", slug: "west-delhi", active: false },
    { name: "Shahdara", slug: "shahdara", active: false },
  ],
},
```

---

## STEP 3: ADD WEATHER & CROP OVERRIDES

### File: src/scraper/jobs/weather.ts
Add ALL 11 Delhi district slugs to OWM_CITY_OVERRIDE, all mapping to 'New Delhi':
```typescript
'new-delhi': 'New Delhi',
'central-delhi': 'New Delhi',
'north-delhi': 'New Delhi',
'north-west-delhi': 'New Delhi',
'north-east-delhi': 'New Delhi',
'east-delhi': 'New Delhi',
'south-delhi': 'New Delhi',
'south-west-delhi': 'New Delhi',
'south-east-delhi': 'New Delhi',
'west-delhi': 'New Delhi',
'shahdara': 'New Delhi',
```

### File: src/scraper/jobs/crops.ts
Add ALL 11 to AGMARKNET_DISTRICT_OVERRIDE, all mapping to 'Delhi':
```typescript
'new-delhi': 'Delhi',
'central-delhi': 'Delhi',
'north-delhi': 'Delhi',
'north-west-delhi': 'Delhi',
'north-east-delhi': 'Delhi',
'east-delhi': 'Delhi',
'south-delhi': 'Delhi',
'south-west-delhi': 'Delhi',
'south-east-delhi': 'Delhi',
'west-delhi': 'Delhi',
'shahdara': 'Delhi',
```

---

## STEP 4: CREATE NEW DELHI SEED FILE

**File: prisma/seed-delhi-data.ts**

This is the MAIN seed file. Seeds comprehensive data for **New Delhi district only**.
Follow the EXACT same structure as prisma/seed-bengaluru-data.ts.

### File template:
```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Delhi (NCT) Data Seed — New Delhi District
// Your District. Your Data. Your Right.
// © 2026 Jayanth M B. MIT License with Attribution.
// https://github.com/jayanthmb14/forthepeople
//
// Run: npx tsx prisma/seed-delhi-data.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const client = new PrismaClient({ adapter });

async function main() {
  console.log('🏛️  Seeding New Delhi district data...\n');

  const delhi = await client.state.findUnique({ where: { slug: 'delhi' } });
  if (!delhi) throw new Error('Delhi state not found. Run seed-hierarchy.ts first.');

  const district = await client.district.findFirst({
    where: { slug: 'new-delhi', stateId: delhi.id },
  });
  if (!district) throw new Error('New Delhi district not found. Run seed-hierarchy.ts first.');

  const did = district.id;
  console.log(`✓ Found New Delhi (id: ${did})\n`);

  // ... seed all data categories below, checking count before each
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(() => client.$disconnect());
```

### DATA TO SEED (use REAL, VERIFIED data — search the web for accuracy):

#### A. LEADERSHIP — 10-tier Delhi hierarchy

**This is different from Karnataka. Use Delhi's unique structure:**

```
TIER 1 — PARLIAMENT:
  Lok Sabha MP, New Delhi constituency — Bansuri Swaraj (BJP, 2024)
  Search for current Rajya Sabha MPs from Delhi

TIER 2 — DELHI ASSEMBLY (search for 2025 Delhi election results):
  MLAs whose constituencies fall in New Delhi revenue district:
    - New Delhi assembly constituency
    - Kasturba Nagar, Greater Kailash, Malviya Nagar
  Search: "Delhi Assembly Election 2025 New Delhi constituency winner"

TIER 3 — LOCAL BODY:
  MCD Mayor (search for current — post-2025 elections)
  Ward councillors in New Delhi area
  NOTE: New Delhi area is under NDMC (New Delhi Municipal Council), NOT MCD

TIER 4 — ADMINISTRATION:
  Lieutenant Governor (LG) of Delhi — search for current
  Chief Minister of Delhi — search for current (2025 elections)
  Chief Secretary, GNCTD
  Divisional Commissioner, Delhi
  District Magistrate (DM), New Delhi — search for current
  Additional DM, New Delhi
  SDM, New Delhi

TIER 5 — POLICE:
  Commissioner of Police (CP), Delhi — search for current
  Special CP, New Delhi Zone
  DCP, New Delhi District — search for current
  ACP, Parliament Street / Connaught Place

TIER 6 — JUDICIARY:
  Delhi High Court Chief Justice — search for current
  District & Sessions Judge, Patiala House Courts (New Delhi)

TIER 7 — KEY BODIES:
  NDMC Chairman — search for current
  DDA Vice Chairman
  Delhi Jal Board CEO
  DMRC Managing Director — search for current
  DTC MD

TIER 8 — DEPARTMENT HEADS:
  Director, Directorate of Education, GNCTD
  Director, Health & Family Welfare, GNCTD
  Commissioner, Food & Civil Supplies, Delhi
  Commissioner, GST Department, Delhi

TIER 9 — DISTRICT OFFICERS:
  District Education Officer (DEO), New Delhi
  District Food & Supplies Controller, New Delhi
  District Revenue Officer, New Delhi

TIER 10 — SUB-DIVISION LEVEL:
  SDM, New Delhi
  Tehsildar, New Delhi
```

#### B. BUDGET DATA (FY 2024-25 / 2025-26)

Search for Delhi government budget from delhi.gov.in / finance department.
Create BudgetEntry records for these sectors (values in RUPEES):

```
Education                    ~₹16,000 Cr (Delhi spends ~25% on education)
Health & Hospitals           ~₹9,000 Cr
Transport (DMRC+DTC+Roads)  ~₹8,000 Cr
Water & Sewerage (DJB)      ~₹5,000 Cr
Power Subsidy                ~₹3,000 Cr
Social Welfare               ~₹3,500 Cr
Urban Development            ~₹4,000 Cr
Housing                      ~₹2,500 Cr
Public Works                 ~₹3,000 Cr
Environment & Forest         ~₹1,200 Cr
Police & Home (Central)      ~₹8,500 Cr
Revenue & General Admin      ~₹1,500 Cr
```

Also create BudgetAllocation records with department-level detail.

#### C. INFRASTRUCTURE PROJECTS (20+ real projects)

Search for each and use REAL data:

```
METRO:
  - Delhi Metro Phase 4 — Janakpuri West to RK Ashram Marg (28.9 km)
  - Delhi Metro Phase 4 — Aerocity to Tughlakabad (20.2 km)
  - Delhi Metro Phase 4 — Lajpat Nagar to Saket G Block (12.5 km)
  - Delhi-Meerut RRTS (82 km) — NCRTC — partially operational
  - Delhi-Alwar RRTS — planning/DPR stage

ROADS & FLYOVERS:
  - Pragati Maidan Integrated Transit Corridor — completion status
  - Ashram Flyover Extension / Ashram Chowk Grade Separator
  - Barapullah Elevated Road Phase 3 (Sarai Kale Khan to Mayur Vihar)
  - Signal-Free Corridor improvements on Ring Road

WATER & ENVIRONMENT:
  - Chandrawal WTP Expansion
  - Yamuna Cleaning — Interceptor Sewer Project (ISP)
  - Yamuna Riverfront Development
  - Okhla Waste-to-Energy Plant capacity expansion
  - Ghazipur Landfill Remediation

HOUSING:
  - DDA Housing Scheme 2024 (Narela, Rohini, Dwarka)
  - PMAY-U in-situ slum rehabilitation
  - NDMC Smart City projects

HEALTH:
  - AIIMS New Delhi expansion
  - Safdarjung Hospital upgrades
  - Delhi government Mohalla Clinics (500+ target)

SMART CITY:
  - NDMC Smart City Mission — Wi-Fi, CCTV, solar
  - Delhi CCTV expansion project
```

For each: name, category, budget (RUPEES), fundsReleased, progressPct, status,
contractor, startDate, expectedEnd, source.

#### D. DEMOGRAPHICS
```
Census 2011: { year: 2011, total: 142004, rural: 0, urban: 142004,
               literacy: 89.38, sexRatio: 902, density: 4057 }
Census 2001: { year: 2001, total: 171806, rural: 0, urban: 171806,
               literacy: 85.20, sexRatio: 866, density: 4909 }
```

#### E. POLICE STATIONS (New Delhi district — search for real ones)
```
Parliament Street PS, Tilak Marg PS, Connaught Place PS,
Chanakya Puri PS, Tughlak Road PS, Barakhamba Road PS,
Mandir Marg PS, Chanakyapuri PS
```
Each: name, type: "Police Station", address, phone (112 is Delhi Police helpline),
jurisdiction, lat/lng if available.

#### F. SCHOOLS (20+ mixed types)
```
Government:     Govt Boys Senior Sec School Mandir Marg, Govt Girls SSS Gol Market,
                Rajkiya Pratibha Vikas Vidyalaya (RPVV) — Delhi govt excellence schools
KV:             KV New Delhi (Gole Market), KV Andrews Ganj
Central:        Kendriya Vidyalaya Janpath
Private:        Modern School Barakhamba Road, Springdales School,
                Convent of Jesus & Mary, St. Columba's School,
                Carmel Convent New Delhi
```
Each: name, type, level, address, students, teachers.

#### G. GOVERNMENT OFFICES (GovOffice)
```
NDMC Office (Palika Kendra, Sansad Marg)
DDA Vikas Sadan (INA)
Delhi Secretariat (IP Estate)
SDM Office New Delhi
District Court Patiala House
Delhi High Court
DMRC Corporate Office (Metro Bhawan, Fire Brigade Lane)
Delhi Jal Board HQ (Varunalaya, Karol Bagh)
Transport Department (Lajpat Nagar)
Passport Office (Bhikaji Cama Place)
EPFO Regional Office
Income Tax Office (Civic Centre)
Delhi Tourism Office (Connaught Place)
GPO New Delhi
```

#### H. SCHEMES (Central + Delhi State)
```
CENTRAL: PM-KISAN, PMAY-U, PM-SVANidhi, Ayushman Bharat, PM Ujjwala, PM-JAY

DELHI STATE (with REAL apply URLs):
  Free Bus for Women (Pink Pass) — transport.delhi.gov.in
  Free Water (20KL/month) — delhijalboard.delhi.gov.in
  Free Electricity (up to 200 units) — delhi.gov.in
  Ladli Yojana (girl child) — wcddel.in
  Ration Card — nfs.delhi.gov.in
  e-District services — edistrict.delhigovt.nic.in
  Mission Buniyaad (education) — edudel.nic.in
  Mukhyamantri Tirth Yatra — delhi.gov.in
  Delhi Startup Policy — startup.delhi.gov.in
```

#### I. ELECTION RESULTS
```
Lok Sabha 2024: New Delhi constituency — search for final result
Delhi Assembly 2025: constituencies within New Delhi district — search results
```

#### J. COURT STATS
```
Patiala House Courts (District Court for New Delhi)
Search NJDG (njdg.ecourts.gov.in) for pendency and disposal data
```

#### K. RTI TEMPLATES (3-4 Delhi-specific)
```
1. DDA Housing Allotment — PIO: CPIO, DDA, Vikas Sadan, INA, 110023. Fee: ₹10
2. Delhi Jal Board Water Supply — PIO: CPIO, DJB, Varunalaya, Karol Bagh
3. NDMC Services & Property Tax — PIO: CPIO, NDMC, Palika Kendra, Sansad Marg
4. Delhi Metro Project Status — PIO: CPIO, DMRC, Metro Bhawan, Barakhamba Road
```

#### L. FAMOUS PERSONALITIES (born in / strongly associated with New Delhi)
```
- Shah Jahan — Historical Ruler — built Shahjahanabad (Old Delhi)
- Bahadur Shah Zafar — Historical Ruler — last Mughal emperor
- Amir Khusrau — Literature — born Delhi, Sufi poet
- Mirza Ghalib — Literature — lived in Delhi, Urdu poet
- Rajiv Gandhi — Politics — born New Delhi
- Sushma Swaraj — Politics — represented New Delhi constituency
- Virat Kohli — Sports — born Delhi (West Delhi, but Delhi icon)
- A.P.J. Abdul Kalam — Science/Politics — served as President at Rashtrapati Bhavan
```
Include: name, nameLocal (Hindi), category, description, birthYear, deathYear,
wikiUrl. Set bornInDistrict carefully (only true if actually born in New Delhi district).

#### M. LOCAL INDUSTRIES
```
Connaught Place — category: "Market" — Central business district
Nehru Place — "IT Park" — Asia's largest IT market
INA Market — "Market" — famous for imported goods
Khan Market — "Market" — one of the most expensive retail locations globally
Pragati Maidan — "Exhibition" — trade fair and convention center
```

#### N. BUS ROUTES (5-6 DTC routes through New Delhi)
Search for real DTC route numbers passing through New Delhi area.

#### O. TRAIN SCHEDULES (6-8 major trains from New Delhi Railway Station)
```
Rajdhani Express (multiple destinations — Mumbai, Kolkata, Chennai)
Shatabdi Express (Bhopal, Kalka, Dehradun, Lucknow)
Gatimaan Express (Delhi-Agra)
Vande Bharat Express
Duronto Express
```

#### P. SERVICE GUIDES
```
1. Birth Certificate — MCD/NDMC, edistrict.delhigovt.nic.in
2. Domicile Certificate — Revenue Dept via e-District
3. Caste Certificate — SDM Office via e-District
4. Driving License — Transport Dept
5. Property Registration — Sub-Registrar Office
6. Ration Card — Food & Civil Supplies Dept
7. Marriage Registration — SDM Office
8. Senior Citizen Card — Social Welfare Dept
```

---

## STEP 5: CREATE ACTIVATION SCRIPT FOR REMAINING 10 DISTRICTS

**File: scripts/activate-delhi-districts.ts**

This script will be run LATER (not now) when I'm ready to go live with all Delhi districts.

```typescript
// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Activate Remaining Delhi Districts
// Run this ONLY after verifying New Delhi works perfectly.
//
// Usage: npx tsx scripts/activate-delhi-districts.ts
//
// What this does:
//   1. Sets active=true for all 10 inactive Delhi districts in DB
//   2. Logs which districts were activated
//   3. Does NOT touch New Delhi (already active)
//   4. Does NOT touch any Karnataka districts
//
// After running:
//   - Update src/lib/constants/districts.ts → set all Delhi districts active: true
//   - Update docs/BLUEPRINT-UNIFIED.md and FORTHEPEOPLE-SKILL-UPDATED.md
//   - git commit + git push to deploy
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DELHI_INACTIVE_SLUGS = [
  'central-delhi',
  'north-delhi',
  'north-west-delhi',
  'north-east-delhi',
  'east-delhi',
  'south-delhi',
  'south-west-delhi',
  'south-east-delhi',
  'west-delhi',
  'shahdara',
];

async function main() {
  console.log('🔓 Activating remaining Delhi districts...\n');

  const delhi = await prisma.state.findUnique({ where: { slug: 'delhi' } });
  if (!delhi) throw new Error('Delhi not found in DB. Run seed-hierarchy.ts first.');

  let activated = 0;

  for (const slug of DELHI_INACTIVE_SLUGS) {
    const district = await prisma.district.findFirst({
      where: { slug, stateId: delhi.id },
    });

    if (!district) {
      console.log(`  ⚠️  ${slug} — not found in DB, skipping`);
      continue;
    }

    if (district.active) {
      console.log(`  ✓ ${district.name} — already active`);
      continue;
    }

    await prisma.district.update({
      where: { id: district.id },
      data: { active: true },
    });

    console.log(`  ✅ ${district.name} — ACTIVATED`);
    activated++;
  }

  console.log(`\n🎉 Done! Activated ${activated} districts.`);
  console.log('\n📋 NEXT STEPS:');
  console.log('  1. Edit src/lib/constants/districts.ts → set all Delhi districts active: true');
  console.log('  2. Update docs/BLUEPRINT-UNIFIED.md (pilot districts count)');
  console.log('  3. Update docs/FORTHEPEOPLE-SKILL-UPDATED.md (pilot districts count)');
  console.log('  4. Update README.md (currently live section)');
  console.log('  5. git add -A && git commit -m "feat: activate all 11 Delhi districts"');
  console.log('  6. git push origin main  ← THIS deploys to Vercel');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

Also create a companion script to seed LIGHT data for the other 10 districts:

**File: scripts/seed-delhi-other-districts.ts**

This seeds minimal data (leadership tiers 4-5, 3-5 police stations, 5 schools,
3 offices, demographics) for the 10 inactive districts. Run this BEFORE running
activate-delhi-districts.ts.

Follow the same Prisma adapter pattern. Check existing count before seeding.
Use real data — search for each district's DM, DCP, police stations, schools.

---

## STEP 6: UPDATE PROJECT DOCUMENTATION (but DO NOT deploy)

### A. Update docs/BLUEPRINT-UNIFIED.md
Under "Current Pilot Scores" add:
```
Delhi (New Delhi):  [pending — run health score calculation after testing]
```

Update the scaling section to mention Delhi as a pending expansion.

### B. Update docs/FORTHEPEOPLE-SKILL-UPDATED.md
Update CURRENT STATE:
```
PILOT DISTRICTS:  4 active (Mandya, Mysuru, Bengaluru Urban — Karnataka; New Delhi — Delhi)
                  + 10 Delhi districts ready to activate
```

### C. Update docs/SCALING-CHECKLIST.md
Add at the bottom under a new section:
```
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
```

### D. Update README.md
Change currently live line to:
```
**Currently live:** Mandya, Mysuru, Bengaluru Urban (Karnataka) + New Delhi (Delhi)
```

### E. DO NOT run git push — just stage the changes:
```bash
git add -A
git status  # Show me what files changed — DO NOT COMMIT YET
```

---

## STEP 7: LOCAL TESTING CHECKLIST

After all seeding is done, run these commands and verify:

```bash
# Make sure Prisma dev proxy is running in Terminal 1:
# npx prisma dev

# Terminal 2 — regenerate client + seed:
npx prisma generate
npx tsx prisma/seed-hierarchy.ts
npx tsx prisma/seed-delhi-data.ts
npm run dev
```

Then open browser and verify each of these URLs works:

```
http://localhost:3000/en/delhi/new-delhi                    ← Overview page
http://localhost:3000/en/delhi/new-delhi/leadership         ← 10-tier hierarchy
http://localhost:3000/en/delhi/new-delhi/finance             ← Budget data
http://localhost:3000/en/delhi/new-delhi/infrastructure      ← Projects tracker
http://localhost:3000/en/delhi/new-delhi/schools             ← School list
http://localhost:3000/en/delhi/new-delhi/police              ← Police stations
http://localhost:3000/en/delhi/new-delhi/schemes             ← Government schemes
http://localhost:3000/en/delhi/new-delhi/elections            ← Election results
http://localhost:3000/en/delhi/new-delhi/courts              ← Court stats
http://localhost:3000/en/delhi/new-delhi/rti                 ← RTI templates
http://localhost:3000/en/delhi/new-delhi/offices             ← Government offices
http://localhost:3000/en/delhi/new-delhi/transport           ← Bus + train
http://localhost:3000/en/delhi/new-delhi/famous              ← Famous personalities
http://localhost:3000/en/delhi/new-delhi/industries          ← Local industries
http://localhost:3000/en/delhi/new-delhi/news                ← News (may be empty until scraper runs)
http://localhost:3000/en/delhi/new-delhi/services            ← Service guides
```

Also verify existing districts still work:
```
http://localhost:3000/en/karnataka/mandya                   ← Must still work
http://localhost:3000/en/karnataka/mysuru                   ← Must still work
http://localhost:3000/en/karnataka/bengaluru-urban           ← Must still work
```

Verify the homepage shows Delhi/New Delhi in the drill-down map and district cards:
```
http://localhost:3000                                        ← Homepage
```

**Report what you see on each page.** If anything is broken, fix it before proceeding.

---

## DELHI-SPECIFIC NOTES (for reference during seeding)

```
1. NDMC vs MCD:
   New Delhi district → NDMC (New Delhi Municipal Council) — separate body
   All other 10 districts → MCD (Municipal Corporation of Delhi, unified 2022)

2. Police:
   Delhi Police → under MHA (Central Government), NOT Delhi government
   Single Commissioner of Police for all Delhi
   Districts have DCPs, not SPs

3. No rural anything:
   No Gram Panchayats, no MGNREGA (negligible), no JJM
   All districts are 100% urban

4. Land control:
   DDA (Delhi Development Authority) — Central body, controls most land
   Delhi government has limited land authority

5. Power distribution (privatized):
   BSES Rajdhani (Reliance), BSES Yamuna (Reliance), Tata Power DDL
   Delhi government provides subsidy (free up to 200 units)
   PowerOutage records → reference discoms, not state board

6. Health score type:
   All Delhi districts = "metro" type (population density extremely high)
   Weights auto-adjust via getAdjustedWeights() in health-score.ts

7. Hindi font:
   Noto Sans Devanagari — already loaded in globals.css for Kannada nameLocal
   No new font import needed
```

---

## DATA SOURCES FOR WEB SEARCH

```
GOVERNMENT:
  delhi.gov.in                         — GNCTD official portal
  delhiplanning.delhi.gov.in           — Budget & Economic Survey
  edistrict.delhigovt.nic.in           — e-District services
  revenue.delhi.gov.in                 — Revenue Dept
  delhipolice.gov.in                   — Police stations, crime stats
  edudel.nic.in                        — Directorate of Education
  delhijalboard.delhi.gov.in           — DJB
  dda.gov.in                           — DDA
  ndmc.gov.in                          — NDMC (New Delhi only)
  delhimetrorail.com                   — DMRC
  dtc.delhi.gov.in                     — DTC
  results.eci.gov.in                   — Election results
  njdg.ecourts.gov.in                  — Court data
  censusindia.gov.in                   — Census 2011
```

---

## SUMMARY OF FILES CREATED/MODIFIED

```
CREATED:
  prisma/seed-delhi-data.ts                    — Full New Delhi seed
  scripts/activate-delhi-districts.ts          — One-command activation for remaining 10
  scripts/seed-delhi-other-districts.ts        — Light data for other 10 districts

MODIFIED:
  prisma/seed-hierarchy.ts                     — Added Delhi UT + 11 districts + subdivisions
  src/lib/constants/districts.ts               — Updated Delhi entry (11 districts, 1 active)
  src/scraper/jobs/weather.ts                  — OWM overrides for 11 Delhi slugs
  src/scraper/jobs/crops.ts                    — AGMARKNET overrides for 11 Delhi slugs
  BLUEPRINT-UNIFIED.md                         — Updated pilot district count
  FORTHEPEOPLE-SKILL-UPDATED.md                — Updated current state
  SCALING-CHECKLIST.md                         — Added Delhi expansion status
  README.md                                    — Updated currently live section

NOT MODIFIED (DO NOT TOUCH):
  prisma/seed.ts                               — Mandya seed (unchanged)
  prisma/seed-bengaluru-data.ts                — Bengaluru seed (unchanged)
  prisma/seed-mysuru-data.ts                   — Mysuru seed (unchanged)
  Any Karnataka district data
  vercel.json                                  — No deployment changes
```

---

## AFTER LOCAL TESTING IS COMPLETE

When I'm satisfied everything works locally, I will manually run:

```bash
# Step 1: Commit
git add -A
git commit -m "feat: Add Delhi (NCT) — New Delhi district with full data

- Added Delhi UT hierarchy: 11 revenue districts + subdivisions
- New Delhi district: full data (leadership, budget, infra, schools, police, schemes, elections, courts, RTI, offices, transport, industries, famous)
- Only New Delhi active; other 10 districts ready with activation script
- Weather/crop overrides for all 11 Delhi slugs
- scripts/activate-delhi-districts.ts for one-command future activation"

# Step 2: Deploy
git push origin main

# Step 3 (LATER — when ready for all 11):
npx tsx scripts/seed-delhi-other-districts.ts
npx tsx scripts/activate-delhi-districts.ts
# Then update constants file, commit, push again
```

## END OF PROMPT
