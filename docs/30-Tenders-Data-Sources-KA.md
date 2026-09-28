# Tenders — Karnataka Data Sources

> **Historical (28 Sep 2026).** The engines named below (`src/scraper/engines/*`)
> were deleted without ever running; no collector reads a Karnataka portal
> today. The live tender collector, `src/scraper/jobs/gepnic-tenders.ts`, reads
> the GePNIC portals of Maharashtra, Tamil Nadu, West Bengal and Delhi
> (`src/scraper/lib/gepnic.ts`). This file is research only, kept for a future
> Karnataka collector.

Per-portal detail for future expansion to other states. Last refreshed: 2026-04-19.

## 1. KPPP — Karnataka eProcurement

- URL: https://eproc.karnataka.gov.in
- Operator: Government of Karnataka, eGov Mission Team
- Tech: JBoss Seam + JSF (heavyweight session: `javax.faces.ViewState`,
  conversation `cid`)
- Entry: `/eproc-g1/pages/tenders.seam`
- Engine: `src/scraper/engines/kppp-seam-engine.ts`
- Volume (Karnataka state + ULBs + parastatals): ~50,000 / year,
  ~4,500 live at any time
- Scrape cadence: every 30 minutes (peak), 60 off-peak
- Rate limit: 1 req / 3 s
- Known issues: portal gets very slow during working hours IST; WebFetch
  from dev machine timed out on 2026-04-19 (see report). Residential /
  Indian IP origin likely helps.
- Last verified working: never verified live by this engine yet;
  Phase 2 dry-run completed the full 4-attempt backoff chain without
  errors. Real verification will happen on first Railway deploy.
- robots.txt: fetched 2026-04-19; no blocking rules for `/eproc-g1/pages`

## 2. CPPP — Central Public Procurement Portal

- URL: https://eprocure.gov.in/eprocure/app
- Operator: NIC (National Informatics Centre) — GePNIC template
- Engine: `src/scraper/engines/nicgep-engine.ts` (reusable for defproc + BEL)
- Volume: ~500k tenders/year all-India; filtered to Karnataka-relevant
- Known issues: **CAPTCHA form gate** on the active tenders listing
  (observed during Phase 1 WebFetch). Public listing is not usable
  without solving the CAPTCHA. Consider RTI-based bulk export or the
  OCDS feed if/when published. Dry-run from the engine returns HTTP
  200 but 0 parsed rows due to the CAPTCHA shell.
- robots.txt: last fetched 2026-04-19

## 3. IREPS — Indian Railways ePS

- URL: https://www.ireps.gov.in
- Engine: `src/scraper/engines/ireps-engine.ts`
- Entry: `/epsn/anonymSearchTender.do`
- Filter: South Western Railway + Bengaluru / Mysuru divisions
- Scope: **listings only** — bidding is DSC-gated and out of scope
- Known issues: more restrictive robots.txt than NIC portals; re-verify
  per day.

## 4. defproc.gov.in

- URL: https://defproc.gov.in
- Tech: NIC GePNIC (same HTML shape as CPPP), handled by `nicgep-engine`
- Focus: DRDO labs in Bengaluru (CABS, LRDE, ADE, GTRE), MoD procurement
- Volume: low (~5k / year all-India)

## 5. BEL eProc (NIC instance)

- URL: https://eprocurebel.co.in/nicgep/app
- Engine: `nicgep` (same template)
- Volume: very low

## 6. HAL TenderWizard

- URL: https://eproc.hal-india.co.in
- Tech: TenderWizard / Antares (ASPX, different from NICGEP)
- Engine: `src/scraper/engines/tenderwizard-engine.ts` — tries 3 candidate
  entry paths
- Volume: low (~1k / year)
- Known issues: lowest priority in the pilot queue

## Deferred

- **GeM (gem.gov.in / bidplus.gem.gov.in)** — Cloudflare Turnstile + JA3
  fingerprinting. **Not scraped**; IT Act §43 risk. Plan: RTI request or
  MoU with GeM team for a data feed (v2).
- **BMRCL own portal (tenderb.bmrc.co.in)** — custom stack; deferred to
  v2 after KPPP proves reliable.
- **Mandya sugar cooperatives** — publish only in local newspapers; needs
  OCR pipeline. Deferred to v3.

## Never scraped (commercial aggregators)

BidAssist, TenderTiger, TendersOnTime, TenderDetail, Tender247 — their
ToS prohibits redistribution. We scrape source government portals only.
