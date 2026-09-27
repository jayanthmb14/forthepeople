# ForThePeople.in — Master Data Sources

Last updated: 2026-04-21 (Population Module v2).

Every piece of data on ForThePeople.in traces back to a source listed in this
document. No row in the database, no number on any page, no chart anywhere may
display data without a citation back to one of these entries.

---

## Population / Demographics module

### Census of India 2011 — canonical baseline

- **Publisher:** Office of the Registrar General & Census Commissioner, India (ORGI)
- **URL:** https://censusindia.gov.in
- **Catalog:** https://censusindia.gov.in/nada/index.php/catalog/42571
- **Primary tables used:**
  - A-1 (population totals)
  - A-5 (SC/ST)
  - B-series (employment)
  - C-01 (religion)
  - C-08 (education)
  - C-13 (single-year age data) — *not yet extracted; Phase 2*
  - C-16 (mother tongue)
  - C-20 (disability)
  - D-series (migration)
  - HH-01 (household data)
  - HH-series (amenities)
  - District Census Handbooks (DCHB) — e.g., https://censusindia.gov.in/2011census/dchb/2918_PART_A_DCHB_BANGALORE.pdf
- **Licence:** Public. Attribution: "Office of the Registrar General & Census
  Commissioner, India."
- **Update frequency:** Decennial. Census 2027 fieldwork in progress (Phase I
  April-September 2026; reference date 1 March 2027).
- **Seeded as:** `dataset: "Census 2011"` — 1 STATE row + 30 DISTRICT rows for Karnataka.

### NITI Aayog National MPI — Progress Review 2023

- **Publisher:** NITI Aayog, Government of India
- **URL:** https://www.niti.gov.in/sites/default/files/2023-08/India-National-Multidimentional-Poverty-Index-2023.pdf
- **Local audit copy:** `scripts/data-pdfs/niti-mpi-2023.pdf` (22 MB, 410 pp,
  fetched via `scripts/fetch-source-pdfs.ts`)
- **Granularity:** 36 States/UTs + 707 districts
- **Indicators:** 12 (Health, Education, Living Standard)
- **Data used:** H (Headcount Ratio %), A (Intensity %), MPI (= H×A/10000) for
  both NFHS-4 (2015-16) and NFHS-5 (2019-21) periods
- **Extracted by:** `scripts/extract-mpi-barchart-full.ts` from bar chart on
  page 132 + overview table on page 128. Every row verified by the arithmetic
  MPI = H × A / 10000.
- **Licence:** Public, Government of India publication. Attribution: "NITI
  Aayog (2023). India. National Multidimensional Poverty Index: A Progress
  Review 2023. NITI Aayog, Government of India, New Delhi."
- **Update frequency:** Periodic (tied to NFHS releases).
- **Seeded as:**
  - `dataset: "NITI MPI 2023"` (current, year=2021) — 1 STATE + 30 DISTRICT rows
  - `dataset: "NITI MPI 2023 Rural"` — 1 STATE row
  - `dataset: "NITI MPI 2023 Urban"` — 1 STATE row
  - `dataset: "NITI MPI 2021 Baseline"` (year=2016, NFHS-4) — 1 STATE + 30 DISTRICT rows

### NFHS-5 — District factsheets (PENDING)

- **Publisher:** International Institute for Population Sciences (IIPS), Mumbai
- **Original URL (DEPRECATED):** `http://rchiips.org/nfhs/NFHS-5_FCTS/{STATE}/{District}.pdf`
  — returned 404 in April 2026 after IIPS site reorganization
- **Current URL:** https://www.nfhsiips.in/nfhsuser/publication.php — requires
  guest-login for downloads (not automatable from scripts)
- **Fallback URL:** https://dhsprogram.com/publications/publication-OF43-Other-Fact-Sheets.cfm
  (DHS Program mirror — may be accessible without login)
- **Structured CSV mirror:** https://github.com/pratapvardhan/NFHS-5 /
  Harvard Dataverse DOI 10.7910/DVN/42WNZF (CC-BY 4.0) — verified against
  factsheet PDFs by the maintainer
- **Citation:** "International Institute for Population Sciences (IIPS), Mumbai.
  National Family Health Survey (NFHS-5), 2019-21." Also cite Pratap Vardhan,
  Bhanu K (2020) if using the CSV mirror.
- **Seeded as (CURRENT STATE):** 3 placeholder rows (bengaluru-urban, mandya,
  mysuru) with `dataset: "NFHS-5"`, year=2020, all fields null, `notes`
  describing the source-deprecation status.
- **Phase 2 plan:** Load NFHS-5 indicators (household amenities, child marriage,
  internet use, banked households, etc.) via the Harvard Dataverse CSV in a
  single follow-up session. Admin audit grid will show ⏳ → ✓ transition.

### NFHS-5 — State report (Karnataka — partial use)

- **Publisher:** IIPS Mumbai + DHS Program
- **URL:** https://dhsprogram.com/pubs/pdf/FR374/FR374_Karnataka.pdf
- **Citation:** IIPS and ICF. 2021. National Family Health Survey (NFHS-5),
  India, 2019-20: Karnataka. Mumbai: IIPS.
- **Use:** State-level context for Karnataka NFHS-5 indicators. NOT
  district-level (district data blocked as described above).

### SRS / Sample Registration System

- **Publisher:** Office of the Registrar General, India (ORGI)
- **URL:** https://srs.census.gov.in
- **Granularity:** All-India + State + "natural division" (cluster of districts)
  — NOT district
- **Use:** State-level vital rates (birth rate, death rate, TFR, IMR, MMR)
- **Licence:** Public. Attribution: "Sample Registration System, ORGI."
- **Update frequency:** Annual (SRS Statistical Report)
- **Seeded:** Not yet. Optional Phase 2 state-level supplement.

### PLFS / Periodic Labour Force Survey

- **Publisher:** NSSO, MoSPI
- **URL:** https://mospi.gov.in/periodic-labour-force-survey-plfs
- **Granularity:** All-India + State (NOT district)
- **Use:** State-level employment indicators (WPR, LFPR, unemployment rate).
  Display alongside Census 2011 district-level employment with explicit
  resolution-mismatch note.
- **Licence:** GODL-India (February 2017 Gazette).
- **Update frequency:** Monthly (from Jan 2025), quarterly, annual.
- **Seeded:** Not yet. Phase 2 state-level supplement.

### Karnataka Directorate of Economics & Statistics

- **Publisher:** Karnataka DES
- **URL:** https://des.karnataka.gov.in
- **Key document:** Karnataka Economic Survey (annual). 2023-24 at
  https://des.karnataka.gov.in/storage/pdf-files/Eco%20Survey%20Reports/Eco%20survey%20English%202023-24.pdf
- **Licence:** Karnataka Government copyright (more restrictive than GODL-India).
  Reuse requires permission: pd.webportal@karnataka.gov.in
- **Use:** Only state-level Karnataka supplements, cited with explicit DES
  attribution.
- **Update frequency:** Annual.
- **Seeded:** Not yet.

### BBMP — Bengaluru municipal boundaries

- **Publisher:** Bruhat Bengaluru Mahanagara Palike
- **URL:** https://bbmp.gov.in
- **Boundary data mirror:** https://github.com/datameet/Municipal_Spatial_Data
  (DataMeet, CC-BY 2.5 IN)
- **Ward vintages** (tracked via `boundaryVintage` field on `Ward` +
  `DemographicProfile`):
  - 198 wards (Census 2011-aligned)
  - 243 wards (draft 2022)
  - 225 wards (notified 2023)
  - GBA era (2024-25, restructured)
- **Seeded:** Census 2011 canonical; future ward-level work tagged with vintage.

### Geography / GeoJSON boundaries (maps module)

- **State + district polygons:** `public/geo/{state-slug}-districts.json` files
  were added in earlier expansion batches (pre-dating this document section).
  Those files carry no inline attribution metadata — historical tech debt
  to be backfilled in a dedicated provenance audit. Intended source across
  the fleet is one of:
  - **DataMeet Maps** (OGL India / CC-BY 2.5 IN) —
    https://github.com/datameet/maps
  - **geohacker/india** (CC-BY) — https://github.com/geohacker/india
- **Taluk polygons per district:** `public/geo/{district-slug}-taluks.json`.
  Existing coverage: bengaluru-urban, chennai, kolkata, lucknow, mandya,
  mumbai, mysuru, new-delhi, pune. The map loaders fetch only
  `/geo/<district-slug>-taluks.json`. Provenance inline only on new files
  going forward.
- **Pune (added 2026-04-23 as district #10):**
  - District polygon already present in `maharashtra-districts.json`
    (feature `{name: "Pune", slug: "pune", stateSlug: "maharashtra"}`);
    reused unchanged from existing Maharashtra FeatureCollection.
  - **`public/geo/pune-taluks.json`** — stub FeatureCollection with
    `features: []`. Inline `_attribution` field documents pending-source
    status. 14 expected taluks listed in `_expected_taluks`. Stub prevents
    the `/map/` page from 404-ing; the TalukMap component handles empty
    features array via its `coverage: missing` fallback. Authoritative
    polygon fetch is a follow-up task (see BUG-TRACKER).

### SHRUG (Development Data Lab)

- **Publisher:** Sam Asher, Paul Novosad et al.
- **URL:** https://shrug.devdatalab.org
- **Granularity:** Village/town (~600,000 units)
- **Licence:** CC BY 4.0 (registration required)
- **Use:** Foundational village-level layer. Cite Asher-Lunt-Matsuura-Novosad (2021).
- **Seeded:** Not yet. Phase 3 village-level integration.

---

## Sources NOT used (deliberate exclusions)

- **CMIE Consumer Pyramids Household Survey (CPHS)** — paywalled, published
  attrition-bias critiques (Somanchi & Drèze, 2021). Excluded.
- **Commercial consumer panels** (Nielsen, Kantar, GfK, YouGov, etc.) — never used.
- **Social media for demographic inference** (X, Facebook, Instagram) — never used.
- **Paid databases requiring subscription** — never used.
- **SECC 2011 raw caste tables** — never released by GoI (*State of Maharashtra
  v. UoI*, 2021). Not displayable.
- **OBC population counts below state level** — no reliable district source
  since 1931 Census.

---

## Attribution template (rendered per chart)

Every chart on ForThePeople.in carries a `<DataSourceCard>`:

```
📊 {source}  ·  Ref year: {referenceYear}  ·  [data-age chip]  ·  ↗ source link
    └─ Licence: {license}  (shown on hover/tap)
```

Example rendered output for Bengaluru Urban's religion donut:

> 📊 Source: Census of India 2011, Table C-01, District Census Handbook Bengaluru
> Ref year: 2011  ·  🔴 14 years old  ·  ↗ censusindia.gov.in
> Licence: Public (ORGI attribution)

---

## Reproducibility trail (for any data on the site)

1. Raw source PDF/CSV in `scripts/data-pdfs/` (gitignored due to size)
2. Fetch script in `scripts/fetch-source-pdfs.ts` (in git)
3. Extraction script in `scripts/extract-<source>-<scope>.ts` (in git)
4. Seed file in `prisma/seed-<scope>-<source>.ts` (in git)
5. Database row with `sourceName`, `sourceUrl`, `sourceLicense`, `retrievedAt`
6. Per-chart `<DataSourceCard>` on the rendered page

Any user or auditor can trace from a number on the site all the way back to
the original PDF page number.
