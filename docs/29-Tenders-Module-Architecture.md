# Tenders Module — Architecture (Module 30)

> **Status (28 Sep 2026).** The first collection pipeline this page was
> written for — the six portal engines, `src/scraper/tender-orchestrator.ts`,
> `src/cron/tenders-ai-enrich.ts`, the PDF extractor and the PII redactor —
> never ran (`TenderScraperRun`, `TenderAISummary` and `TenderDocument` have
> no rows) and was deleted from the code on 28 Sep 2026;
> `git log -- src/scraper/engines` finds it. The live collector is
> `/api/cron/scrape-tenders` → `src/scraper/jobs/gepnic-tenders.ts`, which
> reads the Maharashtra, Tamil Nadu, West Bengal and Delhi GePNIC portals
> (`src/scraper/lib/gepnic.ts`; schedule and behaviour in
> `docs/RUNBOOKS/crons.md`). No collector reads a Karnataka portal. The data
> model, red-flag rules, UI pages and legal sections below still describe
> the code.

_Original local pilot (never collected): Karnataka — Bengaluru Urban, Mandya, Mysuru._

## Why this module exists

Most Indian citizens have no idea that the government publishes ~50,000
tenders a year per state. ForThePeople's Tenders module gives them:

1. A **transparency dashboard** — live & historical tenders with
   factual red-flag indicators (single bidder, short window, price ≈
   estimate, etc.) computed deterministically in SQL.
2. An **apply guide** — eligibility wizard that runs entirely in the
   browser, DSC procurement help, EMD pathways, MSME / Startup India
   benefits surfaced.
3. A **"How it works" explainer** — plain-English, 8th-grade reading
   level, bilingual (English + Kannada stub).

## Data sources (the v1 plan — deleted, never run)

| Priority | Portal | Engine | Volume/year (est.) |
|----------|--------|--------|---------------------|
| 1 | KPPP (eproc.karnataka.gov.in) | `kppp-seam` | ~50k Karnataka tenders |
| 2 | CPPP (eprocure.gov.in) | `nicgep` | All-India; KA filter |
| 3 | IREPS (ireps.gov.in) | `ireps` | SWR Bengaluru + Mysuru divisions |
| 4 | defproc.gov.in | `nicgep` | DRDO / MoD |
| 5 | eprocurebel.co.in | `nicgep` | BEL (NIC template) |
| 6 | eproc.hal-india.co.in | `tenderwizard` | HAL |

All engines routed through `src/scraper/engines/tender-http.ts` (deleted).
The live GePNIC collector uses `src/scraper/lib/source-fetch.ts` instead
(one request every 2.5 s per portal, honest user agent). The v1 rules were:
- User-Agent: `ForThePeople.in Civic Transparency Bot (contact: support@forthepeople.in)`
- 1 request per 3 seconds per portal
- robots.txt fetched fresh every 24h and honoured
- 3-retry exponential backoff on 403 / 429 / 503
- Daily request cap per portal config

## Data model

13 new Prisma models (+ `TenderEducationContent` = 14):

`Tender`, `TenderAuthority`, `TenderCategory`, `TenderCorrigendum`,
`TenderAward`, `TenderBidder`, `TenderContract`, `TenderDocument`,
`TenderRedFlag`, `TenderAISummary`, `TenderSavedByUser`,
`TenderScraperConfig`, `TenderScraperRun`, `TenderEducationContent`.

All monetary fields are `BigInt` (Rupees, not paise, not crores).
Serialisation to JSON goes through `src/lib/tenders/format.ts:serializeForJson()`.

## AI enrichment

Planned, never scheduled: `src/cron/tenders-ai-enrich.ts` (deleted
28 Sep 2026; it was never in `vercel.json`) was to write:

1. Plain-English summary (150 words, neutral adjective-free)
2. Structured eligibility JSON (null when not stated)
3. Document checklist JSON

All three via `callAI()` / `callAIJSON()` with `purpose='news-analysis'`
→ Tier 1 free model per the project AI-cost rules. Daily-budget guard
at $0.50 USD aborts further enrichment. Costs mirrored into
`TenderAISummary.costInr`.

**Never** called from inside a scraper. Scrapers only ingest raw data.

## Red-flag taxonomy

`src/lib/tenders/tender-redflags.ts` — all seven flags are pure SQL,
zero LLM. Every flag emits: factual statement, reference rule
(e.g. `GFR_173_MIN_21_DAYS`), and a computed-value JSON.

| Flag | Rule |
|------|------|
| SHORT_WINDOW | publish→closing < 21 days |
| PRICE_HIT_RATE | winning bid > 98% of estimate |
| SINGLE_BIDDER | bidders == 1, baseline = category median |
| REPEAT_WINNER | same vendor ≥ 4 of last N awards from buyer in 24m |
| RESTRICTIVE_TURNOVER | required turnover > 85th percentile of peers |
| RETENDERED | same authority + title-prefix, earlier CANCELLED in 180d |
| DIRECT_NOMINATION | procurementType == 'SINGLE' |

## UI page map

- `/<locale>/<state>/<district>/tenders` — dashboard
- `/<locale>/<state>/<district>/tenders/<id>` — detail (Gantt,
  flags, AI summary, eligibility wizard, corrigenda, award)
- `/<locale>/<state>/<district>/tenders/apply-guide` — wizard +
  sidebar (DSC / EMD / checklist)
- `/<locale>/<state>/<district>/tenders/transparency` — flagged
  tenders grouped by flag type, methodology disclosed
- `/<locale>/<state>/<district>/tenders/how-it-works` — 10-section
  explainer, EN/KN toggle

Every page renders `<TenderDisclaimer variant="compact"/>` above the fold
and `<TenderDisclaimer variant="full"/>` at the foot.

## Legal framework

- Art 19(1)(a) Constitution — Right to Information
- Copyright Act §52(1)(q) — government works exempt
- Eastern Book Company v. D.B. Modak (2008) SC — raw facts non-copyrightable
- RTI §4 — suo-motu disclosure obligation
- NDSAP 2012 (Gazette 17 Mar 2012) — proactive dissemination mandate
- GODL-India (Feb 2017 Gazette) — reuse / adapt / publish licence
- KTPP Act 1999 — reinforces publicness at state level
- DPDP Act 2023 — PII redaction now, enforceable May 2027
- Advocates Act §33 — eligibility wizard is client-side-only by design

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Bulk scraping never court-tested | robots.txt + honest UA + 3-sec rate limit + provenance log |
| DPDP enforcement May 2027 | PII regex redaction on ingest (Aadhaar / phone / email / individual PAN) |
| BNS §356 defamation via adjective | UI copy lint + runtime `assertFactualCopy` in `RedFlagBadge` |
| Advocates Act §33 | eligibility wizard never calls server for matching |
| RTBF drift | support@forthepeople.in with 7-wd SLA; `noindex` option + 7-year anonymisation for individual losing bidders |
| GeM Cloudflare / Turnstile | **not scraped** — IT Act §43 risk; deferred to RTI/MoU in v2 |

## Deferred

- **v2**: GeM RTI pipeline, BMRCL own-portal engine, news cross-links
  module↔module, corrigendum AI diff summariser, WhatsApp / email alert
  delivery, DigiLocker Udyam-cert verification in Apply Wizard
- **v3**: Mandya sugar coop OCR-based NIT ingest, predictive cost-overrun ML,
  bidder-network graph, director-overlap conflict-of-interest detection via
  MCA/OpenCorporates, eCourts litigation flag on contractor

## Testing

```bash
npx prisma db push         # schema → DB (project convention; no migrations folder)
npx tsx prisma/seed-tenders-karnataka.ts
npx tsx src/scraper/tender-redflag-computer.ts
bash scripts/lint-tender-copy.sh
```
