# Tenders Module — Activating for a New District

_Last updated: 2026-04-20. See also: `docs/29-Tenders-Module-Architecture.md`._

## TL;DR

Turning on tenders for a district is a DB-only flip (no code change) once the first district in that state is live. The sidebar link is already universal.

```sql
UPDATE "District" SET "tendersActive" = true WHERE slug = 'your-district-slug';
```

The snippet on the district overview, the locked-state page, and the tenders dashboard all react to this flag automatically.

---

## Full activation checklist

### 1. Flip the flag

```sql
UPDATE "District"
SET "tendersActive" = true
WHERE slug = 'your-district-slug';
```

Or via the existing bulk script:

```bash
# Edit scripts/activate-tenders-districts.ts — append slug to ACTIVE_SLUGS.
npx tsx scripts/activate-tenders-districts.ts
```

### 2. Seed authorities for the district

Follow the pattern in `prisma/seed-tenders-karnataka.ts`. For each district you're enabling, add the procurement bodies that publish tenders with its location:

- Municipal corporation (ULB)
- Zilla Panchayat / DRDA
- State departments with a presence (PWD, Water Resources, Electricity, Transport…)
- Central PSUs headquartered in the district (if any)
- Railway zones / divisions covering the district
- Defence PSUs / DRDO labs (if any)

Use the seed's `authorityShortCode` convention to keep look-ups fast.

### 3. Confirm portal coverage for the district's state

Open `src/scraper/lib/gepnic.ts`: `GEPNIC_PORTALS` (one GePNIC portal per
state) and `GEPNIC_ORGS` (district slug → the bodies we follow there).

- If the state has a portal (Maharashtra, Tamil Nadu, West Bengal, Delhi) →
  add the district's bodies to `GEPNIC_ORGS`; the scrape-tenders cron picks
  them up on its next run.
- If the state has no entry (Karnataka's KPPP and Telangana run other
  software) → no collector reads it; a new collector is needed before the
  district can be switched on. Do not switch a district on without one.

### 4. Seed state-specific disclaimer clauses

If this is a new state, add procurement-law clauses alongside the universal ones:

- Edit `prisma/seed-tender-legal.ts` → append rows with `stateSlug: 'your-state-slug'` and `docType: 'disclaimer'`.
- Cite the state's procurement statute explicitly (e.g. KTPPA 1999 for Karnataka, TNTPCE 1998 for Tamil Nadu).
- Re-run: `npx tsx prisma/seed-tender-legal.ts` (idempotent via slug upsert).

The `/tenders/disclaimer` page composes universal clauses first, then state-specific clauses — so no other code change is needed.

### 5. Nothing to do in UI

- Sidebar link already renders "Govt. Tenders" for every district (Fix 2).
- Overview snippet already renders for every district, falling out of LOCKED into LIVE the moment `tendersActive` flips and data arrives (Fix 5).
- Dashboard, apply-guide, transparency, how-it-works pages already work for any district via dynamic routes (Module 30 from launch).

### 6. Verify end-to-end

```bash
# Production
curl -sI "https://forthepeople.in/en/<state>/<district>/tenders"
# Expect HTTP 200 with dashboard (not locked state) once tenders are ingested

curl -s "https://forthepeople.in/api/tenders/<district>?status=LIVE" | head -c 400
# Expect JSON with tender rows for that district
```

---

## Per-state non-blocking issues (known)

- **KPPP-style JSF portals** (Karnataka): session / cookies / CAPTCHA make
  automated scraping brittle. Confirm rate-limiting behaviour per portal
  before enabling the cron on a new state.
- **State-specific procurement law citations**: disclaimer copy must be
  lawyer-reviewed before going live in a new state. Start with the Act's
  name and a one-paragraph summary; expand later.
- **Indic-language summaries**: the `bodyKn` column accepts Kannada right
  now. For other states, reuse the column and have Sarvam AI (future)
  translate at ingestion time. Keep `translationPending: true` until
  human-reviewed.
- **Portal CAPTCHAs / Cloudflare** (GeM): outside scope — don't attempt
  to circumvent. GeM integration is deferred per `docs/29-Tenders-Module-Architecture.md`.

## Deactivating a district

Rare but sometimes needed (legal request, stale data, rescoping):

```sql
UPDATE "District" SET "tendersActive" = false WHERE slug = 'your-district-slug';
```

The lock-state page renders automatically. Existing `Tender` rows stay in the database for audit; they're simply not displayed until the flag flips back on.

## Questions

Email `support@forthepeople.in` with subject line `Tenders activation — <district slug>`.
