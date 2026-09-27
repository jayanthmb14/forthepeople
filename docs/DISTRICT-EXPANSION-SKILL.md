---
name: forthepeople-district-expansion
description: "Skill for expanding ForThePeople.in to new districts. Use when adding Bengaluru Urban, Mysuru, or any new Indian district to the platform. Triggers: 'add district', 'expand to Bangalore', 'expand to Mysore', 'unlock district', 'new city', 'seed data for district', 'add Bengaluru', 'add Mysuru', 'district-specific modules', 'local industry module'. Covers: district hierarchy seeding, taluk data, unique local modules (IT parks for Bangalore, tourism/heritage for Mysore, sugar for Mandya), infrastructure projects seeding, famous personalities, leadership data, GeoJSON maps, scraper configuration, and AI news intelligence expansion."
---

# ForThePeople.in — District Expansion Skill

## Expansion Philosophy

The codebase is GENERIC. Every district uses the same 29 dashboard modules, same API routes, same UI components. Expanding to a new district requires:

1. **Database seeding** — Add State/District/Taluk/Village rows with `active: true`
2. **Data population** — Seed ALL 45+ Prisma models with real data for the new district
3. **Local industry adaptation** — The "Local Industries" module adapts per district (Sugar→Mandya, IT Parks→Bengaluru, Tourism/Heritage→Mysuru)
4. **GeoJSON maps** — District + taluk boundary files in `public/geo/`
5. **Scraper config** — Add district-specific RSS queries and portal URLs
6. **AI News Intelligence** — Automatically works for any active district (queries Google News RSS with district name)

## District: Bengaluru Urban

```
State:          Karnataka
District:       Bengaluru Urban (ಬೆಂಗಳೂರು ನಗರ)
Slug:           bengaluru-urban
Tagline:        "Silicon Valley of India"
Population:     ~12,765,000 (2026 est.)
Area:           741 sq km
Literacy:       88.48%
Sex Ratio:      916
Density:        ~17,230/sq km
Avg Rainfall:   860mm

Taluks (4):
  1. Bengaluru North (ಬೆಂಗಳೂರು ಉತ್ತರ) — "Gateway to the Airport"
  2. Bengaluru South (ಬೆಂಗಳೂರು ದಕ್ಷಿಣ) — "Heart of the Garden City"
  3. Bengaluru East (ಬೆಂಗಳೂರು ಪೂರ್ವ) — "IT Corridor Hub"
  4. Anekal (ಆನೇಕಲ್) — "Electronics City Gateway"

Assembly Constituencies (28): Yelahanka, KR Puram, Byatarayanapura, Yeshwanthpur, 
  Dasarahalli, Mahalakshmi Layout, Malleshwaram, Hebbal, Pulakeshinagar, 
  Sarvagnanagar, CV Raman Nagar, Shivajinagar, Shantinagar, Gandhi Nagar, 
  Rajaji Nagar, Govindraj Nagar, Vijayanagar, Chamarajpet, Chickpet, 
  Basavanagudi, Padmanabhanagar, BTM Layout, Jayanagar, Bommanahalli, 
  Anekal, Bangalore South (Lok Sabha)

Lok Sabha: Bangalore North, Bangalore Central, Bangalore South (3 MPs)
```

### Bengaluru UNIQUE Modules (adapt Local Industries)

```
LOCAL INDUSTRY = "IT & Startups" (not Sugar Factories)

Models to seed:
- IT Parks: Electronic City, Manyata Tech Park, Bagmane Tech Park, 
  Whitefield IT Hub, Embassy Tech Village, RMZ Ecoworld, Prestige Tech Park,
  Brigade Tech Park, International Tech Park (ITPB), Kirloskar Business Park
- Startup ecosystem: Number of startups, unicorns, funding data
- BBMP ward-wise budget data
- BMTC bus routes (300+ routes)
- Namma Metro routes (Purple + Green + extensions)
- Bengaluru Suburban Rail (4 corridors, 64 stations)
- Lakes: Ulsoor, Hebbal, Sankey, Bellandur, Varthur + restoration status
- Air Quality Index from CPCB stations
- Traffic congestion data
- Property tax collections (BBMP)

INFRASTRUCTURE PROJECTS (100+ to seed):
  MEGA PROJECTS:
  - Namma Metro Phase 2A (ORR Line, Silk Board→KR Puram, 19km, 13 stations)
  - Namma Metro Phase 2B (Airport Line, 36.4km, ~₹14,000 Cr)
  - Namma Metro Phase 3 (Sarjapur-Hebbal 36.6km + JP Nagar-Kempapura 32km)
  - Bengaluru Suburban Rail Project (148km, 64 stations, ₹15,767 Cr, K-RIDE)
  - Satellite Town Ring Road STRR (280km, ₹15,676 Cr, 12 towns)
  - Peripheral Ring Road / Bangalore Business Corridor (74km, 8-lane)
  - Twin Tunnel Hebbal to Silk Board (18km, ₹12,690 Cr)
  - Bengaluru-Chennai Expressway (258km, ₹17,930 Cr)
  - Bengaluru-Mysuru Expressway (118km, operational)
  - B-SMILE road program (₹7,000 Cr)
  - Second Airport proposal
  - AI City / Tech Hub
  - Elevated corridors (multiple)
  - Double-decker metro proposal
  
  ROAD PROJECTS:
  - Signal-free corridors (10+ ongoing)
  - Flyover constructions (20+ ongoing)
  - Grade separators
  - Underpass constructions
  - Road widening projects (100+ streets)
  - White-topping program
  
  WATER & DRAINAGE:
  - Cauvery Stage 5 water supply
  - Lake rejuvenation (Bellandur, Varthur, etc.)
  - Storm water drain upgrades
  - Sewage treatment plants (KC Valley, etc.)
  - Flood mitigation projects
  
  SMART CITY:
  - BBMP Smart City projects
  - LED street lighting
  - CCTV surveillance network
  - Digital governance portals
  - EV charging infrastructure

UNIQUE GOVERNANCE:
  - Greater Bengaluru Authority (GBA) replaced BBMP
  - BBMP budget: ₹19,000 Cr (2025-26)
  - BDA (Bengaluru Development Authority)
  - BMRCL (Metro Rail Corporation)
  - BWSSB (Water Supply & Sewerage Board)
  - BESCOM (electricity)
  - BMTC (bus transport)
  - BTP (Bengaluru Traffic Police)
```

## District: Mysuru

```
State:          Karnataka
District:       Mysuru (ಮೈಸೂರು)
Slug:           mysuru
Tagline:        "Cultural Capital of Karnataka"
Population:     ~3,200,000 (2026 est.)
Area:           6,854 sq km
Literacy:       72.56%
Sex Ratio:      981
Density:        ~467/sq km
Avg Rainfall:   785mm

Taluks (7):
  1. Mysuru (ಮೈಸೂರು) — "City of Palaces"
  2. Nanjangud (ನಂಜನಗೂಡು) — "Dakshina Kashi"
  3. T. Narasipura (ಟಿ.ನರಸೀಪುರ) — "Triveni Sangama"
  4. Hunsur (ಹುಣಸೂರು) — "Gateway to Nagarahole"
  5. H.D. Kote (ಎಚ್.ಡಿ.ಕೋಟೆ) — "Land of Forests & Wildlife"
  6. Periyapatna (ಪಿರಿಯಾಪಟ್ಟಣ) — "Coffee & Spice Country"
  7. K.R. Nagar (ಕೃಷ್ಣರಾಜನಗರ) — "KRS Dam's Home"

Assembly Constituencies (8): Chamaraja, Krishnaraja, Narasimharaja, 
  Chamundeshwari, Nanjangud, T. Narasipura, Hunsur, HD Kote, Periyapatna, KR Nagar

Lok Sabha: Mysuru-Kodagu (1 MP)
```

### Mysuru UNIQUE Modules

```
LOCAL INDUSTRY = "Heritage, Tourism & Manufacturing"

Models to seed:
- Heritage sites: Mysore Palace, Chamundi Hills, St. Philomena's Church,
  Mysore Zoo, Brindavan Gardens, Jaganmohan Palace, Lalitha Mahal
- Tourism economy: Dasara festival stats, tourist footfall, hotel occupancy
- Mysore Sandal Soap (KSDL), Mysore Silk (KSIC), Mysore Pak
- Manufacturing: Frauscher Sensor Technology hub, BEML, Mysore Paints,
  Wipro GE Healthcare, Infosys Mysore Campus (world's largest training)
- MMLP Kadakola (Multi-Modal Logistics Park, ₹102 Cr)
- STPI Mysore (Software Technology Park)
- KRS Dam & Brindavan Gardens (shared with Mandya)

INFRASTRUCTURE PROJECTS:
  MEGA:
  - "New Mysuru" 5-pillar transformation plan
  - Mysuru Peripheral Ring Road (105.3km, DPR stage, ~2026-27)
  - Outer Ring Road improvements (42.5km)
  - Mysore-Chennai High Speed Rail (435km corridor)
  - Mysore Airport expansion
  - Mysuru Rapid Metro proposal
  - ₹2,578 Cr development package (CM's projects)
  
  ROADS:
  - ₹393 Cr road concreting (12 major arterials)
  - Bengaluru-Mysuru Expressway connectivity links
  - Ring Road signal improvements (35 new signals)
  - City road widening projects
  
  HEALTH:
  - 100-bed Nephro-Urology Hospital (₹117.71 Cr)
  - Jayadeva Hospital expansion
  - District Hospital upgrades
  
  INDUSTRIAL:
  - Hebbal Industrial Area expansion
  - Nanjangud Industrial Area upgrades
  - KIADB SEZ developments
  - Frauscher global manufacturing hub (155,000 sqft)
  
  WATER:
  - Kabini Dam management
  - KRS Dam (shared with Mandya)
  - Vani Vilas Sagar
  - City water supply augmentation
  - UGD (Underground Drainage) expansion
  
  RAILWAY:
  - Ashokapuram Railway Station yard remodelling (₹30.42 Cr)
  - New platforms 4 & 5
  - MMLP railway goods shed connectivity
  
  GOVERNANCE:
  - CESC (Chamundeshwari Electricity Supply Corp)
  - MCC (Mysuru City Corporation) — ₹380 Cr projects
  - MDA (Mysore Development Authority) replacing MUDA
  - Mysuru Urban Development Authority (MUDA)

UNIQUE DATA:
  - Dasara festival budget & attendance
  - Tourist footfall monthly
  - Heritage site revenue
  - Cleanest city rankings (Mysuru won multiple times)
  - Coffee/spice production (Periyapatna, HD Kote)
  - Wildlife corridor data (Nagarahole, Bandipur proximity)
  - University data (University of Mysore, JSS, SJCE)
```

## News-Driven Modules (No Manual Seeding Required)

Two modules populate themselves from the news pipeline — they do **NOT**
need a seed file for a new district. They ship with `"Awaiting data"`
placeholders and fill in as soon as the hourly `scrape-news` cron runs:

### Infrastructure Tracker (`/infrastructure`)
- Schema: `InfraProject` + `InfraUpdate` timeline rows.
- Pipeline: NewsItem classified `module="infrastructure"` →
  `extractInfraFromNews()` (free-tier AI) → `verifyInfraExtraction()`
  (second free-tier pass) → `syncInfraFromNews()` fuzzy-upsert.
- NATIONAL-scope projects (Bullet Train, Vande Bharat, NH corridors)
  fan out to every active district automatically.
- STATE-scope projects fan out to all active districts in the matching
  state. DISTRICT-scope stays local.
- Per-cron extraction cap: **10 infra extractions / news-cron run**
  (enforced in `news-action-engine`, reset via
  `resetExtractionCounters()`).
- New-district onboarding (optional top-up):
  ```bash
  npx tsx -e "
    import './_env';
    import { onboardDistrictExams } from '@/lib/exam-onboard';
    // If you also want a bulk national-project clone, add a similar
    // infra-onboard helper or just wait one news-cron cycle.
  "
  ```
- Manual admin editing: available in the admin Content Editor
  (CONTENT_MODULES["infrastructure"]). Each admin save writes an
  `InfraUpdate` row with `updateType="ADMIN_EDIT"` so the public
  timeline records the provenance.
- Backfill legacy news: `npx tsx scripts/backfill-infra-from-news.ts --limit 10 [--dry-run]`
- Merge duplicates: `npx tsx scripts/dedup-infra-projects.ts --dry-run [--district <slug>]`
- Disclaimer banner is mandatory at the top of the page — never
  remove it.

### Exams Tracker (`/exams`)
- Schema: `GovernmentExam` (extended with news-driven fields).
- Pipeline: NewsItem classified `module="exams"` →
  `extractExamFromNews()` → `syncExamFromNews()` fuzzy upsert by
  `shortName` + first-three-word title match.
- NATIONAL exams (UPSC, SSC, IBPS, RRB) fan out to every active
  district.
- Daily status cron: `/api/cron/update-exams` advances status from
  calendar dates (APPLICATIONS_OPEN when within window, ADMIT_CARD_OUT,
  etc.) and flags `needsVerification=true` on rows stale >30 days.
- New-district onboarding: `onboardDistrictExams(districtId)` clones
  NATIONAL + matching STATE exams from other districts (deduped by
  `shortName`).
- Backfill: `npx tsx scripts/backfill-exams-from-news.ts --limit 10 [--dry-run]`

### AI cost guardrails (applies to BOTH modules)
- Use `purpose: "classify"` (free tier: `openai/gpt-oss-20b:free` with
  fallback chain to other free models).
- `purpose: "insight"` (Gemini 2.5 Pro) is only used for the lazy
  /api/data/infra-analysis endpoint, triggered by the user clicking
  "Generate AI Analysis". 24h Redis cache.
- try/catch around every extract/verify/sync call — one failure never
  aborts the news pipeline.

## Seeding Checklist (Per District)

```
For EACH new district, seed ALL of these:
□ State (if not exists) + District + Taluks + Villages
□ Leaders — uses the 5-tier hierarchy (T1 NATIONAL · T2 STATE · T3 DISTRICT
  ADMIN · T4 ELECTED REPS · T5 MUNICIPAL & DEPT). T1 (Modi/Murmu) and the
  state CM/Governor at T2 auto-populate via scripts/fix-all-districts-
  leadership.ts. T3 bureaucrats (Collector, SP, ZP CEO) need MANUAL
  verification per district — use "[Verify at <official portal>]" as the
  name when unsure rather than fabricating a name. T4 (MP + MLAs) and T5
  (Mayor / dept heads) seed from the state assembly + ECI source-of-truth,
  then the news pipeline auto-updates as transfers/elections happen.
□ Famous Personalities (15-25 real people with Wikipedia photos)
□ Infrastructure Projects — SKIP manual seeding; populated automatically
  by the news-driven pipeline (see "News-Driven Modules" section above).
  Optional: run scripts/backfill-infra-from-news.ts after going live.
□ Budget Data (department-wise, 3 fiscal years)
□ Revenue Collections (monthly, all categories)
□ Population History (1991, 2001, 2011, 2024 est.)
□ Rainfall History (2015-2025, monthly)
□ Police Stations (all stations with address, phone, SHO)
□ Crime Stats (5 years, category-wise)
□ Schools (all govt + aided schools with UDISE codes)
□ Government Offices (all offices with hours)
□ Election Results (last 3 elections — LS, Assembly, ZP)
□ Bus Routes (KSRTC + BMTC for Bangalore)
□ Train Schedules (all stations in district)
□ Dam/Reservoir data (relevant dams)
□ Schemes (Central + State + District specific)
□ Service Guides (certificates, land, transport)
□ RTI Templates (department-wise PIOs)
□ Citizen Tips (district-specific)
□ Local Alerts (current advisories)
□ Crop Prices (district mandis)
□ Weather (current + historical)
□ JJM Water Supply coverage
□ Housing Scheme (PMAY data)
□ Power/DISCOM info (BESCOM for Bangalore, CESC for Mysore)
□ Soil Health records
□ Court Stats (district court data)
□ Gram Panchayat data (for rural taluks)
□ GeoJSON files (district boundary + taluk boundaries)
□ News RSS queries configured
□ AI Intelligence pipeline queries added
```

## GeoJSON Sources

```
Bengaluru Urban taluks: datameet.org or Survey of India
Mysuru taluks: datameet.org or Survey of India
Download and store in: public/geo/<district-slug>-taluks.json
  (e.g. bengaluru-urban-taluks.json). The map loaders fetch exactly
  /geo/<district-slug>-taluks.json. Run `npm run geo:rewind` after adding
  a file (and bump GEO_VERSION in src/lib/geo/aliases.ts when you replace
  a state's <state>-districts.json).
```

---

## POPULATION MODULE v2 — DATA SEEDING CHECKLIST

When onboarding a new district (after the standard 7-step expansion: hierarchy
→ districts.ts → overrides → fonts → data seed → docs → testing), seed its
demographic profile as a separate step.

### Per-district checklist

1. **Census 2011 core profile** — create `prisma/seed-<district>-demographics.ts`
   with one `DemographicProfile` row:
     dataset: "Census 2011", year: 2011, level: "DISTRICT"
     Fields: totalPopulation, male/femalePopulation, sexRatio, childSexRatio,
     pop_0_6, literacyTotal/Male/Female, urbanPopulation, ruralPopulation,
     urbanPct, density, areaSqKm, households.
     JSONB: religion (8 alphabetical keys), caste (SC/ST/Other).
     Optional for deep pilot: employment, education, migration, disability,
     language, householdAmenities, maritalStatus.
     Source: https://censusindia.gov.in/nada/index.php/catalog/42571

2. **NITI MPI 2023** — if district existed in 2019-21 (i.e. NOT a post-2019
   bifurcation), extract from `scripts/data-pdfs/niti-mpi-2023.pdf` and create
   TWO rows:
     (a) dataset: "NITI MPI 2023", year: 2021
         economicClass: { mpiHeadcount, mpiIntensity, mpi, districtRankInState,
                          totalDistrictsInState, source }
     (b) dataset: "NITI MPI 2021 Baseline", year: 2016
         economicClass: { mpiHeadcount, mpiIntensity, mpi, source }
         (no rank — rank computed only for current period)

   Use `scripts/extract-mpi-barchart-full.ts` as the extraction pattern.
   Every row MUST pass the arithmetic check: MPI = H × A / 10000.

3. **NFHS-5 placeholder** (current deferred state) — create one row:
     dataset: "NFHS-5", year: 2020, level: "DISTRICT"
     All quantitative fields: null
     All JSONB blocks: null
     sourceUrl: null (original rchiips.org URL deprecated)
     notes: "NFHS-5 district factsheet. Data NOT YET LOADED — see Phase 2."

   Rationale: explicit placeholder row shows "pending" in admin audit grid
   (amber status) instead of "none" (red — treated as oversight).

4. **Verify provenance** — every row MUST have: `sourceName`, `sourceUrl` (can
   be null for placeholders), `sourceLicense`, `retrievedAt`, `boundaryVintage`.

5. **Verify in admin panel** — /en/admin/population must show the district's
   row with expected ✓/— cells. If a cell shows ✓ but the JSONB is actually
   empty, investigate.

### Slug spelling mismatches (learned the hard way — Karnataka MPI seed)

Government sources use different English transliterations for the same district.
**The slug in seed code MUST match the slug in your DB** (reflects canonical
hierarchy), NOT the PDF's spelling. Canonical DB wins.

Known Karnataka variants:

| Source says | DB slug |
|---|---|
| NITI PDF "Bagalkote" | `bagalkot` (Census 2011 spelling) |
| NITI PDF "Bangalore Urban" | `bengaluru-urban` |
| NITI PDF "Bangalore Rural" | `bengaluru-rural` |
| NITI PDF "Mysore" | `mysuru` |
| NITI PDF "Tumkur" | `tumakuru` |
| NITI PDF "Shimoga" | `shivamogga` |
| NITI PDF "Gulbarga" | `kalaburagi` |
| NITI PDF "Bellary" | `ballari` |
| NITI PDF "Bijapur" | `vijayapura` |

Other states will have their own variants. Before seeding any new state, run:

```bash
npx tsx -r dotenv/config -e "
  import { PrismaClient } from './src/generated/prisma';
  import { PrismaPg } from '@prisma/adapter-pg';
  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  (async () => {
    const s = await p.state.findUniqueOrThrow({ where: { slug: '<STATE_SLUG>' } });
    const ds = await p.district.findMany({ where: { stateId: s.id }, select: { slug: true, name: true }, orderBy: { slug: 'asc' } });
    ds.forEach(d => console.log(d.slug, '(', d.name, ')'));
    await p.\$disconnect();
  })();
"
```

### Handling post-2019 bifurcated districts

Example: Vijayanagara was bifurcated from Ballari in 2021. It exists in our DB
hierarchy (created to support current-day queries) but has NO Census 2011 row
and NO NITI MPI 2023 row (NFHS-5 fieldwork predates the bifurcation). The seed
loop must gracefully skip such districts without crashing:

```ts
if (!district) {
  console.log(`  ⚠️  District not found: ${slug} — SKIPPED (check hierarchy)`);
  skipped++;
  continue;
}
```

### Anti-patterns

```
❌ Seeding estimated values when the PDF is accessible — always extract
❌ Guessing district rank — compute it at seed time from sorted H values
❌ Filling SECC 2011 caste sub-categories (raw data not released — see
  State of Maharashtra v UoI 2021)
❌ Using the word "scraped" in any source field (user-facing)
❌ Labelling any religion as "majority" or "minority"
❌ Using commercial/paywalled source (CMIE CPHS, Nielsen, Kantar, etc.)
❌ Mixing slug spellings (NITI's "Bagalkote" vs Census "Bagalkot")
```

---

## Case study: Pune #10 (Maharashtra) — 6-prompt sequential write-not-run pattern (2026-04-23)

Pune's launch introduced a new district-expansion workflow that supersedes the older single-prompt pattern for all future district additions.

### The 6-prompt pattern

| Prompt | Scope | Execution |
|---|---|---|
| 1 — Foundation | Hierarchy, taluks, scraper overrides, font loading, districts.ts active stub | Write + commit locally |
| 2 — Seed A: Governance | 17 governance leaders (admin / police / municipal / judiciary / political) | **Write only** |
| 3 — Seed B: Money + Infra | BudgetAllocation + InfraProject with legal flags + sources | **Write only** |
| 4 — Seed C: Elections + addendum | MLAs + MPs + live-event VACANT handling | **Write only** |
| 5 — Seed D: Services | Schools (aggregate-first) + Schemes | **Write only** |
| 6 — Finalization (Phases A–J) | Execute seeds, smoke test, docs, commits, push | **Execute** |

Why it works: review every seed file offline before any DB write. Calibration issues (schema mismatches, role-string conventions, party-name formats, count errors, live-event handling) surface in reports before they corrupt the DB. Execution itself takes ~3 minutes for a 74-record district; review spreads across the session.

### Pune-specific patterns that should propagate

**Aggregate-first for high-N entities.** Pune has 3,546+ ZP primary schools — seeding all is out of scope. Seed 3 admin-body aggregates (`Pune ZP — Primary Education`, `Pune ZP — Secondary`, `PMC Education`) with aggregate student/teacher counts, plus ~5 notable institutions (SPPU, Fergusson, COEP, FTII, NDA). Scales cleanly to 780 districts without 2M+ school rows. Same approach applies to hospitals once that model ships.

**Live-event seat handling.** Ajit Pawar died Jan 28 2026; Baramati Assembly seat became vacant; by-election April 23 2026. Prompt 4 seeded the seat as a VACANT placeholder row with `active: false`, `party: null`, full explanatory `roleDescription`. **Never seed a speculative winner pre-ECI.** Post-certification, patch the row to the certified winner.

**Source with pipe-delimiter + JSON legal flags.** Leader model lacks a `sourceUrl` column — Pune standardizes `"Publication | URL"` in the single `source` string. InfraProject has a `sourceUrls` JSON field — use it for structured legal metadata (`{primary, secondary, disclaimer, subJudice, hasPublicOpposition, environmentalClearance}`).

**Parallel dual-model seeding when district schema use diverges.** Mumbai uses `BudgetEntry` (sector-based, 10 rows). Pune data fit `BudgetAllocation` better (per-body rich records, 5 rows). Rather than rewriting the /finance UI (risks breaking Mumbai), Pune seeds both: rich per-body data in BudgetAllocation + UI-compat sector aggregates in BudgetEntry. Allocated sums match exactly. Reconciliation deferred to a future unified-model pass.

**Cross-file record dedup.** PCMC Mayor Ravi Landge appears in both `seed-pune-leaders.ts` and `seed-pune-elected-reps.ts`. Idempotent `findFirst({districtId, name, role})` guard handles it — whichever seed runs second skips cleanly. `name` + `role` strings must be byte-identical across files.

**Route-name divergence from expected.** Always enumerate actual `src/app/[locale]/[state]/[district]/` sub-routes before writing prompts that reference module URLs. Pune launch surfaced `/finance` not `/budget-utilization`, `/health` not `/hospitals`, `/elections` not `/elected-reps`. Never assume.

**Mumbai DB ≠ Mumbai seed file.** Pune's launch discovered Mumbai's current DB state diverges from its own seed file — tier 1 holds PM/President/BIA President instead of LS MPs; tier 2 holds bureaucrats instead of MLAs. Query the DB for current state; don't trust seed files as an accurate reflection of production.

**Fleet-wide pre-existing gaps surface during expansion.** Pune's launch surfaced ~40 GeoJSON files with no inline `_attribution`; Hyderabad missing from `DISTRICT_PROJECTION`; Hospital model missing entirely. Log as BUG-TRACKER items; fix in dedicated passes. Don't block district expansion to fix fleet-wide debt.

### Pune phase-by-phase timing

- Phase A (pre-flight) ~2 min — Git + TSC + Prisma validate + Obsidian read
- Phase B (GeoJSON) ~10 min — Pune district polygon reused; taluk stub; TalukMap projection; DATA-SOURCES.md attribution
- Phase C (seed execution) ~4 min — 7 seeds + idempotency re-run
- Phase D (Admin + Budget UI) ~15 min — B(ii) parallel BudgetEntry seed, Mumbai regression
- Phase E (smoke test) ~10 min — 34 routes HTTP 200, banners/disclaimers present, 9-district regression clean
- Phase F (docs) ~15 min — this file + BLUEPRINT + Obsidian 3-file
- Phase G (commits) ~10 min — 8-9 logical commits
- Phase H (pre-push) ~5 min — npm run build, mock-data grep, commit-email check
- Phase I (push) ~3-5 min — single Vercel build
- Phase J (monitor) ~30 min — Sentry + Plausible

Total Pune #10: ~1.5h Claude Code execution, ~1h review + calibration. Earlier single-prompt districts took ~45 min but carried 2-3× the post-launch cleanup burden. Net: 6-prompt pattern trades wall-clock for data quality.

