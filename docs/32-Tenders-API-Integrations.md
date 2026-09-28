# Tenders — External Integrations

## Integrations currently used (v1)

| Integration | Purpose in Tenders module | Env var |
|-------------|---------------------------|---------|
| OpenRouter (via `callAI`) | AI enrichment: summary / eligibility / checklist (planned; the v1 enrichment job was deleted unrun) | `OPENROUTER_API_KEY` |
| Sentry | Error logging from the `scrape-tenders` cron | `SENTRY_DSN` |
| Plausible | Page-view analytics | (no key — cookieless) |
| Resend | Admin alert emails when cost budget exceeded | `RESEND_API_KEY`, `ADMIN_EMAIL` |
| Neon PostgreSQL | Primary data store | `DATABASE_URL` |

**Deliberately no new third-party integrations in v1** — the module
reuses existing infrastructure end-to-end.

## Integrations to evaluate (v2+)

| Integration | Purpose | Priority | Cost estimate |
|-------------|---------|----------|---------------|
| **TendersOnTime REST API** | Covers newspaper-sourced NITs that never reach a government portal (sugar coops, small CMCs). JSON documented. Non-government source — must be source-labelled. | v2 | Contact for pricing |
| **DigiLocker API** | Verify user's Udyam / MSME cert in Apply Wizard without PAN upload | v2 | Free w/ govt empanelment |
| **MCA API / OpenCorporates** | Director-overlap conflict-of-interest detection (v2 transparency enhancement) | v3 | Free tier + paid |
| **eCourts API** | Contractor-litigation flag (is the winner currently a defendant in active civil litigation?) | v3 | Free |
| **Google Cloud Vision / Azure Read** | OCR for scanned Kannada PDFs (sugar-coop NITs) if open-source Indic OCR is insufficient | v2 | ~₹0.10–0.15/page |
| **Sarvam AI** | Indic-first AI translation of summaries (EN→KN) at better quality than OpenRouter free-tier | v2 | Pay-as-you-go |
| **WhatsApp Business API (via ManyChat)** | Alert delivery for saved tenders + corrigendum push | v2 | Reuse existing ManyChat |
| **udyamregistration.gov.in** | Deep-link from Apply Wizard for one-click user registration flow | v2 | Free |
| **OCDS / CoST India** | Subscribe to published Open Contracting feeds if state bodies adopt them | v2+ | Free |

## Rate-limiting notes

- KPPP: 1 req / 3 s — respects working-hours slowdown
- CPPP: 1 req / 3 s — CAPTCHA gate makes active-listing scrape ineffective
- IREPS: 1 req / 4 s — more restrictive robots.txt
- Others: 1 req / 3–4 s per config row

These were enforced in `src/scraper/engines/tender-http.ts`, deleted on
28 Sep 2026 with the v1 engines (never run). The live GePNIC collector uses
`src/scraper/lib/source-fetch.ts`: one request every 2.5 s per portal.

## Cost monitoring notes

- AI enrichment daily budget: **$0.50 USD**, checked at cron start
- Current free-tier routing puts effective cost at $0; paid fallbacks
  would surface a non-zero `costInr` which the guard sums
- Neon free-tier compute quota is the **actual** constraint in dev
  right now — encountered quota exhaustion during Phase 5 smoke tests
  (2026-04-19). Plan: upgrade to paid Neon once the module is in
  production, or migrate to self-hosted Postgres on Railway if
  Jayanth prefers
