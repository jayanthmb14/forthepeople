# Module Reference — Population / Demographics

**Version 2.0** · Launched 2026-04-21 (Karnataka pilot)

---

## Purpose

Present rich demographic data for every Indian district in a legally defensible,
provenance-transparent, culturally neutral UI.

## Non-goals (hard limits — see LEGAL-COMPLIANCE.md)

- Forecasting / projection beyond what cited sources themselves publish
- Individual or household-level data display
- Ward-level cross-tabulation of sensitive fields (religion × caste × ward)
- Sub-caste or jati drilldown (statutory categories only)

---

## Route structure

```
/en/{state}/{district}/population   Full rich dashboard (~16 sections)
/en/{state}                         State-level rollup + district choropleth
/en/{state}/{district}              Overview snippet card (top-3 religions
                                    alphabetical + totalPop + literacy + link)
/en/admin/population                Admin completeness audit grid
```

## API endpoints

| Endpoint | Method | Purpose | Cache |
|---|---|---|---|
| `/api/data/population` | GET | Backward-compatible. Returns `{data: PopulationHistory[], meta}` (the profile is served, reconciled with the Census row, by `/population/profile`) | 24h |
| `/api/data/population/profile` | GET | Rich profile for one district. Default `dataset="Census 2011"` with `economicClass` overlay from latest NITI MPI row | 24h |
| `/api/admin/population-audit` | GET | Admin-only completeness audit. Cookie: `ftp_admin_v1` | no cache |

All public endpoints: no auth required, GET-only.

## Database schema

Key model — see `prisma/schema.prisma` for full:

```prisma
model DemographicProfile {
  id                 String            @id @default(cuid())
  districtId         String?
  stateId            String?
  level              DemographicLevel  // STATE | DISTRICT | SUBDISTRICT | WARD
  year               Int
  dataset            String            // "Census 2011" | "NFHS-5" | "NITI MPI 2023" | ...
  // totals (nullable): totalPopulation, sexRatio, literacy*, urbanPct, density, ...
  religion           Json?   // alphabetical 8-key object
  caste              Json?   // SC / ST / Other only
  employment         Json?
  economicClass      Json?   // { mpiHeadcount, mpiIntensity, mpi, districtRankInState, ... }
  education          Json?
  migration          Json?
  disability         Json?
  language           Json?   // { top10: [{ name, pct }] }
  householdAmenities Json?
  maritalStatus      Json?
  sourceName         String
  sourceUrl          String?
  sourceLicense      String?
  retrievedAt        DateTime
  publishedAt        DateTime?
  notes              String?
  boundaryVintage    String?
  @@unique([districtId, year, dataset])
}
```

## Dataset strings in use

| Dataset string | Year | Scope |
|---|---|---|
| `"Census 2011"` | 2011 | State + District |
| `"NFHS-5"` | 2020 | District (placeholder — data pending) |
| `"NITI MPI 2023"` | 2021 | State + District |
| `"NITI MPI 2023 Rural"` | 2021 | State only |
| `"NITI MPI 2023 Urban"` | 2021 | State only |
| `"NITI MPI 2021 Baseline"` | 2016 | State + District (NFHS-4 baseline for trend) |

Future: `"NFHS-6"` (2027+), `"Census 2027"` (~2028-29).

## Chart primitives

Located in `src/components/demographics/charts/`. All use Recharts (except
`KarnatakaChoropleth` which uses react-simple-maps). Every chart exports a
`canRender{Name}(profile)` helper for page-level gating.

14 primitives:

1. PopulationPyramid (5-year bands — not yet seeded, falls back to AgePyramidStacked)
2. AgePyramidStacked (4-group fallback: 0-6 / 7-14 / 15-59 / 60+)
3. ReligionDonut
4. CasteStackedBar
5. LiteracyDumbbell
6. EmploymentStackedBar
7. EducationBreakdownBar
8. HouseholdAmenitiesWaffle
9. MigrationBreakdown
10. LanguageBarChart
11. UrbanRuralDonut
12. SexRatioGauge
13. MPIIndicatorCard (with 2019-21 → 2015-16 trend)
14. KarnatakaChoropleth

Palette: `src/components/demographics/types.ts` — `OKABE_ITO`, `VIRIDIS`,
`CASTE_COLORS`, `SEX_COLORS`.

## Legal wrapper

Component: `<DemographicDisclaimer>` — renders at the top of every population
page.

Sections (stable IDs for legal cross-reference, see LEGAL-COMPLIANCE.md):

| ID | Section |
|---|---|
| `§3A` | About this module |
| `§3B` | Religion data |
| `§3C` | Caste-category data |
| `§3D` | Child sex ratio (PCPNDT Act) |
| `§3E` | Election Mode (conditional) |
| `§3F` | Aggregate-only / privacy |
| `§3G` | Methodology & sources |

## Current seeded state (Karnataka pilot, 2026-04-21)

```
Total DemographicProfile rows:                98

By dataset × level:
  Census 2011 × STATE                          1
  Census 2011 × DISTRICT                      30
  NFHS-5 × DISTRICT (placeholder)              3
  NITI MPI 2023 × STATE                        1
  NITI MPI 2023 × DISTRICT                    30
  NITI MPI 2023 Rural × STATE                  1
  NITI MPI 2023 Urban × STATE                  1
  NITI MPI 2021 Baseline × STATE               1
  NITI MPI 2021 Baseline × DISTRICT           30
```

Active districts (rich Population page renders): bengaluru-urban, mandya, mysuru.
Locked districts with data ready (light up on `active: true` flip): 27 more
Karnataka districts (all except Vijayanagara).

Bengaluru Urban MPI: rank 3 of 30 in Karnataka (Ramanagara rank 1, Bengaluru
Rural rank 2).

## Key files

```
prisma/
  schema.prisma                                     (DemographicProfile + DemographicUpdate)
  seed-karnataka-demographics.ts                    (state-level Census 2011)
  seed-bengaluru-urban-demographics.ts              (deep pilot district)
  seed-karnataka-districts-demographics.ts          (29 other districts Census 2011)
  seed-karnataka-mpi.ts                             (NITI MPI 2023 + baseline)
  seed-karnataka-nfhs5-placeholders.ts              (3 placeholder rows)

src/app/
  [locale]/[state]/[district]/population/page.tsx   (16-section dashboard)
  [locale]/[state]/[district]/page.tsx              (overview with PopulationSnippet)
  [locale]/admin/population/page.tsx                (admin audit grid)
  api/data/[module]/route.ts  case "population"     (population history, backward-compatible)
  api/data/population/profile/route.ts              (default: Census 2011 + MPI overlay)
  api/admin/population-audit/route.ts               (admin summary + completeness)

src/components/
  common/EmptyBlock.tsx                             (compact, chart-level)
  demographics/DemographicDisclaimer.tsx            (7-section legal wrapper)
  demographics/DataSourceCard.tsx                   (per-chart provenance)
  demographics/DataAgeChip.tsx                      (green/amber/red traffic light)
  demographics/types.ts                             (palettes + guards)
  demographics/charts/*.tsx                         (14 chart primitives)
  district/PopulationSnippet.tsx                    (overview card)
  admin/AdminSidebar.tsx                            (nav item added)

src/hooks/
  useRealtimeData.ts                                (+ usePopulationProfile hook)

src/lib/constants/
  state-config.ts                                   (population source list)

scripts/
  fetch-source-pdfs.ts                              (NITI MPI PDF downloader)
  extract-mpi-barchart-full.ts                      (authoritative extractor)
  data-pdfs/                                        (gitignored — raw PDFs + extracts)
```

## Update cadence

| Dataset | Refresh mechanism | Cadence |
|---|---|---|
| Census 2011 | Manual reseed on new Census release (→ 2028-29 for 2027 data) | Decennial |
| NFHS-5 | Manual reseed on NFHS-6 release (~2027) | Quinquennial |
| NITI MPI | Manual reseed on new Progress Review | Periodic |
| SRS / CRS (if seeded) | Manual annual update | Annual |
| PLFS (if seeded) | Manual quarterly update | Quarterly |
| Demographic news | Existing 10-min news cron + category filter | 10 min |
| AI insight card | Existing 2-hour insight cron | 2h |

**Zero new Vercel crons. Zero new AI cost at runtime.**

## Cost profile

```
Build cost (one-time):       ~6 hours (research in Chat + code in Claude Code)
Runtime cost:                0 new AI calls + 0 new crons
Storage growth:              +200 KB today, +25 MB at full India scale
New infrastructure:          None
```

## Testing

All 9 smoke-test URLs returned HTTP 200 on 2026-04-21:
- `/api/data/population` (backward-compat shape)
- `/api/data/population/profile` (3 districts tested)
- `/api/data/population/state`
- `/en/karnataka/bengaluru-urban/population` (88 KB, 3s cold, 0.08s cached)
- `/en/karnataka/mandya/population`
- `/en/karnataka/mysuru/population`
- `/en/karnataka/bengaluru-urban` (overview)
- `/en/karnataka` (state page)

`tsc --noEmit`: zero errors.

## Known gaps / Phase 2 backlog

| Gap | Impact | Plan |
|---|---|---|
| NFHS-5 district indicators | 3 active districts show "data pending" for household amenities, child marriage, internet/bank access | Phase 2: load via Harvard Dataverse CSV mirror (doi:10.7910/DVN/42WNZF, CC-BY 4.0) OR manual nfhsiips.in guest-login download |
| Census 2011 5-year age bands | `PopulationPyramid` chart always falls back to 4-group `AgePyramidStacked` | Phase 2: extract Table C-13 |
| Karnataka GeoJSON choropleth | If `public/geo/karnataka-districts.json` missing, shows placeholder | Verified present as of Group B |
| Vijayanagara district | No Census 2011 or NITI MPI 2023 row (bifurcated 2021) | Phase 2: add Karnataka DES current estimates at state level; full data with Census 2027 |
| Other state-specific sources | PRS India, Karnataka DES economic handbook, BBMP ward-level | Phase 3: state-by-state onboarding |
| `tender-pdf-extractor.ts` | Never ran; deleted 2026-09-28 with the old tender engines | — |

## Revision history

- **2026-04-21 · v2.0** — Full rich demographic dashboard shipped as Karnataka
  pilot. 98 `DemographicProfile` rows seeded. 14 chart primitives. Legal wrapper
  with 7 disclaimer IDs. Admin audit grid. 4 new API endpoints. Zero-downtime
  additive migration (no changes to existing tables).
- **2026-01 · v1.0** (superseded) — 4 decadal `PopulationHistory` rows shown
  as simple stat cards. Kept intact for backward compatibility.
