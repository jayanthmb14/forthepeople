# Runbook: Vercel crons

Owner: Jayanth M B. Last verified: 2026-09-28 (against `vercel.json` at
`f2d7d9c`).

Every scheduled job on ForThePeople.in is a Vercel Cron hitting a route
under `src/app/api/cron/`. The schedule lives in `vercel.json` (`crons`
array) and is the single source of truth — if it is not in `vercel.json`,
it does not run. The old Railway node-cron container expired in April 2026;
its scheduler (`src/scraper/scheduler.ts`), the 13 job modules only it ran
and the `npm run scraper` script were deleted on 2026-09-28, so a redeploy
from `main` cannot start it again. (Railway itself was still running an old
copy on 27 Sep; the owner's steps to stop it are in `docs/OWNER-TODO.md` §2.)

## 1. The crons

21 crons. Schedules are UTC, as Vercel reads them; IST = UTC + 5:30.
**Budget** = the route's own time budget (after it, no new district or item
is started) / Vercel's `maxDuration` for the route.

Every run also writes its run state to Redis `ftp:cron:<name>` (section 4)
and one `ScraperLog` row (via `cronStarted()` / `cronFinished()` in
`src/lib/cron-auth.ts`). The "Writes" column lists only what else it writes.

| Route | Schedule (UTC) | When in IST | Budget / max | What it does · what it writes |
|---|---|---|---|---|
| `/api/cron/scrape-news` | `10 */4 * * *` | every 4 h at :40 (01:40, 05:40, 09:40 …) | 240 s / 300 s | News per district from RSS. Districts fetched longest ago go first; each gets an equal share of the AI time (max 20 AI calls each, then keyword sorting only). Writes `NewsItem` rows, module rows or `NewsActionQueue` items from the news action engine, deletes duplicate stories, switches off non-official `LocalAlert` rows older than 14 days (never NDMA SACHET alerts — those expire by their CAP date in `scrape-alerts`), then translates new text (`ContentTranslation`) with the time left. |
| `/api/cron/translate-content` | `20 */3 * * *` | every 3 h at :50 (02:50, 05:50 …) | 270 s / 300 s | Catch-up translation of live text into every switched-on language. Writes `ContentTranslation`. Does nothing (and says why) until the table exists and a provider key is set. |
| `/api/cron/scrape-crops` | `30 3 * * *` | daily 09:00 | 250 s / 300 s | Mandi prices from AGMARKNET via data.gov.in. District order rotates daily; stops early if data.gov.in is down. Writes `CropPrice` + `UpdateLog`; `partial: true` when the budget ran out. |
| `/api/cron/scrape-weather` | `*/30 * * * *` | every 30 min | 45 s / 60 s | One reading per district, 5 at a time: OpenWeather, Open-Meteo as the fallback. Writes `WeatherReading` + one `UpdateLog` summary row per run. |
| `/api/cron/scrape-dams` | `0 */6 * * *` | 05:30, 11:30, 17:30, 23:30 | 100 s / 120 s | Reservoir levels from the Karnataka water portal (only districts with a live feed; the rest are listed as "not covered"). Writes `DamReading`. |
| `/api/cron/scrape-alerts` | `*/30 * * * *` | every 30 min | 40 s / 60 s | Official disaster alerts from NDMA SACHET (CAP feed), matched by district name or alert area; expires alerts at their CAP expiry. Writes `LocalAlert`. |
| `/api/cron/generate-insights` | `0 0,12 * * *` | 05:30 and 17:30 | 230 s (insights), 255 s (infra) / 300 s | AI module insights that are missing or expired and whose data changed (oldest first; leaders regardless of data at 7 days old, daily during an election in the state — `src/lib/insight-refresh.ts`), then up to 10 infra analyses, then translation with the time left. Writes `AIModuleInsight`, infra analyses in Redis, `ContentTranslation`, `AIUsageLog`. |
| `/api/cron/news-intelligence` | `0 */4 * * *` | every 4 h at :30 (01:30, 05:30 …) | 240 s / 300 s | AI reading of fresh news, one call per district, new news only. Writes `AIInsight` (low-confidence ones to `ReviewQueue`) and `AIUsageLog`. A run where every AI call failed is recorded as an error and emails the admin. |
| `/api/cron/scrape-budget` | `0 6 * * 1` | Monday 11:30 | — / 300 s | Deliberate no-op: returns `skipped` until a data.gov.in budget resource id exists (section 7). |
| `/api/cron/generate-citizen-tips` | `0 6 * * 0` | Sunday 11:30 | 240 s / 300 s | 6 AI tips per district (prompt context: official alerts only, weather only if under 6 h old). Writes Redis `ftp:ai:citizen-tips:<slug>` (14-day expiry, so a failed week keeps last week's tips). |
| `/api/cron/update-exams` | `30 6 * * *` | daily 12:00 | 70 s (official-page pass) / 120 s | Reads UPSC's and SSC's official exam pages (one request every 2.5 s per site; UPSC pages the budget does not reach are read the next day), moves exam status forward by date ("open" only with a published closing date), flags exams unconfirmed for over 30 days. Writes `GovernmentExam`. |
| `/api/cron/platform-report` | `0 0 * * 0` | Sunday 05:30 | 240 s (no AI model attempt after it) / 300 s | Weekly AI platform report. Writes one `PlatformReport` row. |
| `/api/cron/health-score` | `30 1 * * *` | daily 07:00 | 100 s / 120 s | Recomputes every live district's report card (`calculateDistrictHealthScore()`). Writes `DistrictHealthScore`. Daily because a stored grade expires after 7 days. |
| `/api/cron/verify-data` | `45 6 * * *` | daily 12:15 (after the 06:00 UTC dam run and the 03:30 UTC crop run) | 240 s / 300 s | The double-check: freshness, leaders, weather, dams and mandi verifiers (`src/lib/verification/`). Writes `DataVerification` rows and, for disagreements, `NewsActionQueue` items (dataType `verify-leaders`, no repeats) plus one admin alert. Never changes the data it checks. Lock `lock:cron:verify-data`. Needs `npm run db:push` first; until then it logs itself as skipped. |
| `/api/cron/dedupe-data` | `15 7 * * *` | daily 12:45 (after update-exams and verify-data) | 240 s / 300 s | The duplicate guard (`src/lib/dedupe/guard.ts`). EXACT duplicates (same canonical key in the same district) are merged automatically: best row kept, empty fields filled, child rows moved (`InfraUpdate`, `SchoolResult`, `SugarFactorySeason`, news translations), the rest deleted — or `active=false` for `Leader`, `LocalAlert`, `CitizenTip`, `LocalIndustry`, `FamousPersonality`. Copies of one exam become one national / state / district `GovernmentExam` row; exam statuses and `ElectionResult.electionType` are rewritten in the canonical set. FUZZY pairs (≥ 85 % alike) are never changed: each is queued once in `NewsActionQueue` (dataType `verify-duplicates`). Drops the page caches of the tables it changed. Lock `lock:cron:dedupe-data`. |
| `/api/cron/scrape-courts` | `40 1,13 * * *` | 07:10 and 19:10 | 250 s / 300 s | Court cases from NJDG's public dashboards (3 requests per NJDG unit, ≥ 3 s apart; oldest district first). Writes Redis `ftp:courts:njdg:<slug>` and `ftp:courts:njdg-hc:<stateCode>` (120-day expiry), this year's filed / decided / waiting to `CourtStat` (source "NJDG district dashboard · read <date>"), and deletes the cached courts response. Lock `lock:cron:scrape-courts`. |
| `/api/cron/scrape-jjm` | `15 4 * * *` | daily 09:45 | 90 s / 120 s | Tap-water coverage from the public JJM dashboard (rural districts; urban ones are "not covered"). Two dashboard endpoints must agree. Writes one district-total `JJMStatus` row per district + `UpdateLog`. Lock `lock:cron:scrape-jjm`. |
| `/api/cron/scrape-schools` | `40 4 * * 2` | Tuesday 10:10 | 150 s / 180 s | UDISE+ district school statistics (schools, teachers, students, facilities) after totals-add-up checks. Writes Redis `ftp:data:udise:<slug>` (no expiry) + `UpdateLog`. Lock `lock:cron:scrape-schools`. |
| `/api/cron/scrape-mgnrega` | `50 4 * * *` | daily 10:20 | 250 s / 300 s | MGNREGA "At a glance" page per rural district (about 20 s each). Writes Redis `ftp:data:mgnrega:<slug>` (no expiry) + `UpdateLog`. Lock `lock:cron:scrape-mgnrega`. |
| `/api/cron/scrape-tenders` | `15 */2 * * *` | every 2 h at :45 (01:45, 03:45 …) | 240 s / 300 s | Active tenders of followed district bodies on the Maharashtra, Tamil Nadu, West Bengal and Delhi e-procurement (GePNIC) portals; each tender saved only from its own page. Writes `Tender`, `TenderAuthority` and one `UpdateLog` row per district with new tenders. Lock `lock:cron:scrape-tenders`. |
| `/api/cron/scrape-fuel` | `0 7,14 * * *` | 12:30 and 19:30 | 50 s / 60 s | Petrol and diesel in Delhi, Mumbai, Chennai and Kolkata (₹ per litre at IOCL outlets) from PPAC: its home-page "as on" lines and the day's metro table (PDF). Delhi must also equal BPCL's Delhi price build-up (in effect on or before that day); anything that disagrees or cannot be read → nothing written, reasons in `ScraperLog.error`. 5 requests, ≥ 2.5 s apart per site. Writes Redis `ftp:data:fuel` (no expiry). Lock `lock:cron:scrape-fuel`. |

Notes:

- The new collectors (courts, JJM, schools, MGNREGA, tenders) were added to
  `vercel.json` on 2026-09-28 and have not run in production yet. Before
  the JJM cron's first production run, the 18 seeded `JJMStatus` rows must be
  deleted, or the tap-water page counts them twice (`docs/OWNER-TODO.md` §6).
- The portal collectors are also described in
  `src/scraper/lib/collector-registry.ts` (`PORTAL_COLLECTORS`: module, cron,
  schedule, storage, source, expected age); nothing at runtime reads it yet.
  If you change one of their schedules, change it there too —
  `tests/cron-schedule.test.ts` compares it with `vercel.json`.
- Every lock is `lock:cron:<name>` (`src/scraper/lib/cron-lock.ts`; courts
  and verify-data used `ftp:lock:<name>` until 2026-09-28, and verify-data's
  expired at 290 s, before its 300 s limit). A locked run returns `skipped`
  (verify-data answers HTTP 409). Locks expire on their own 30 s after
  `maxDuration`.
- Shared route helpers: `listActiveDistricts()` / `jobContextFor()`
  (`src/scraper/lib/cron-districts.ts`) and `withCronErrors()`
  (`src/scraper/lib/cron-run.ts`), which records a run that throws as an
  error instead of leaving it "running".

## 2. Auth — how a cron proves it is allowed to run

Every route calls `verifyCron(req)` from `src/lib/cron-auth.ts`. It accepts
**either** header:

- `Authorization: Bearer <CRON_SECRET>` — this is what Vercel Cron sends.
- `x-cron-secret: <CRON_SECRET>` — convenient for manual triggers.

It fails closed (401 for everything) when the env var `CRON_SECRET` is not
set, and compares with `crypto.timingSafeEqual`.

Env var name: `CRON_SECRET` (Vercel -> Settings -> Environment Variables,
Production). Vercel reads the same variable to build the Bearer header, so
changing it needs no code change — just a redeploy.

## 3. Trigger a cron by hand

Never paste the secret into a command, a file, a chat or a screenshot, and
never `echo` it. Read it into the shell without showing it:

```bash
read -rs CRON_SECRET && export CRON_SECRET   # paste the value from Vercel env, press Enter

# Vercel-style header (what the scheduler sends):
curl -sS -H "Authorization: Bearer $CRON_SECRET" https://forthepeople.in/api/cron/scrape-weather | jq .

unset CRON_SECRET   # when you are done
```

Every route answers GET. `generate-insights`, `generate-citizen-tips` and
`translate-content` also answer POST (same handler). Expect a JSON body with
counts; a 401 means the secret is wrong or unset; a 504 means the route hit
`maxDuration`.

Useful options and what to expect:

| Route | Manual options | What a good run returns |
|---|---|---|
| `translate-content` | `?dry=1` = plan only, plus one tiny test translation | `enabled: true`, a character count, no errors |
| `verify-data` | `?only=leaders,weather` (any of `freshness`, `leaders`, `weather`, `dams`, `mandi`) and `?district=mandya,pune` | counts per verifier; HTTP 409 = another run holds the lock |
| `dedupe-data` | `?dry=1` = report only; `?only=InfraProject,GovernmentExam` (table names) | `resolved`, `normalised`, `queuedForReview`; a dry run lists every exact group and fuzzy pair |
| `scrape-courts` | none | `skipped: "already running"` if the lock is held; otherwise units read per district |
| `scrape-jjm`, `scrape-schools`, `scrape-mgnrega`, `scrape-tenders` | none | a summary per district; "not covered" for districts the source does not publish |
| `scrape-fuel` | none | `written: "created" \| "changed" \| "confirmed"`, the four cities' prices and PPAC's `asOf` day; or `ok: false` with `problems` (nothing written) |
| everything else | none | counts of rows written |

Suggested order after a deploy that touched AI or crons:

1. `scrape-weather` (fast, proves DB + weather source)
2. `news-intelligence` (proves AI models — then check `/api/data/news?district=mandya` shows `classifiedBy` other than `keyword`)
3. `generate-insights` (then `/api/data/insight?module=overview&district=hyderabad` should be non-null)
4. `generate-citizen-tips` (then `/api/ai/citizen-tips?district=mandya` should list 6 tips)

After the first deploy of the v5.1 collectors:

1. Delete the seeded `JJMStatus` rows first (owner approval, `docs/OWNER-TODO.md` §6).
2. `scrape-courts` once, then check `/api/data/court-pendency?district=mandya&state=karnataka` has a `snapshot`.
3. `verify-data?only=freshness` (after `npm run db:push` created `DataVerification`), then `/api/data/verification?district=mandya`.
4. `scrape-jjm`, `scrape-schools`, `scrape-mgnrega`, `scrape-tenders` once each; check `/api/health`.

## 4. Where run state lives (Redis)

Each cron writes a hash `ftp:cron:<name>` (name = folder under `/api/cron`):

| Field | Meaning |
|---|---|
| `startedAt` | ISO time the last run began |
| `finishedAt` | ISO time the last run ended |
| `status` | `running`, `ok` or `error` |
| `count` | records touched in the last run |
| `error` | last error message (empty on success) |
| `durationMs` | last run duration |
| `lastSuccessAt` | ISO time of the last **successful** run — this is what health uses |

Records never expire. To inspect: Upstash console -> Data Browser ->
`ftp:cron:*`, or `HGETALL ftp:cron:scrape-crops`.

Data some crons keep in Redis instead of a table (no table holds these
district totals yet):

| Key | Written by | Expiry |
|---|---|---|
| `ftp:data:udise:<slug>` | `scrape-schools` | none (a failed run keeps the last good one) |
| `ftp:data:mgnrega:<slug>` | `scrape-mgnrega` | none |
| `ftp:data:fuel` | `scrape-fuel` | none (read by `/api/data/prices` → `fuel` and the home page) |
| `ftp:courts:njdg:<slug>`, `ftp:courts:njdg-hc:<stateCode>` | `scrape-courts` | 120 days (housekeeping only) |
| `ftp:ai:citizen-tips:<slug>` | `generate-citizen-tips` | 14 days (two weekly runs) |

## 5. Health — what "stale" means

`GET https://forthepeople.in/api/health` reads every cron in `vercel.json`,
works out its interval from the schedule, and marks it:

- `ok` — `lastSuccessAt` is within **2 × interval** (weather: 60 min, news: 8 h, tenders: 4 h, courts: 24 h, daily: 48 h, weekly: 14 d)
- `stale` — no success inside that window (a cron that keeps erroring becomes stale)
- `unknown` — never recorded (right after the first deploy)

Top-level `status` is `degraded` when any cron is stale, the database is
unreachable, or `ai` is degraded (see `docs/RUNBOOKS/ai-models.md`).
`/api/health?strict=1` returns HTTP 503 in that case — point an uptime
monitor (UptimeRobot / Better Stack) at that URL and `/en`.

## 6. Adding a cron

1. Create `src/app/api/cron/<name>/route.ts`. Copy `scrape-weather/route.ts`
   (or `scrape-jjm/route.ts` for a collector with a lock) as the template:
   `verifyCron`, `cronStarted`, `withCronErrors` (or your own catch that calls
   `cronFinished` with "error"), `cronFinished`, `maxDuration`, a time budget,
   and `listActiveDistricts()` / `jobContextFor()` for the district list.
2. Add `{ "path": "/api/cron/<name>", "schedule": "..." }` to `vercel.json`.
   Health picks it up automatically.
3. Add a row to the table in section 1, and to
   `docs/BLUEPRINT-UNIFIED.md` §7. A portal collector also goes in
   `src/scraper/lib/collector-registry.ts`.
4. Deploy, trigger by hand once (section 3), check `/api/health`.

## 7. Known limits and gotchas

- Vercel Pro allows up to 300 s per cron (we use `maxDuration` per route).
  Every cron keeps its own time budget and returns `partial: true` rather
  than being killed mid-write.
- `scrape-budget` is a deliberate no-op: `STATE_BUDGET_RESOURCES` in
  `src/scraper/jobs/budget.ts` has no live dataset ids. It stays scheduled so
  adding an id starts collection without touching `vercel.json`. An entry
  must name the dataset's district field and year field: the request is
  filtered by district, and a record without our district or a readable
  financial year is skipped (`src/scraper/lib/budget-records.ts`).
- Crops need `DATA_GOV_API_KEY`. Weather works without `OPENWEATHER_API_KEY`
  (Open-Meteo is the fallback), but the key also feeds the second-source
  check on the weather page. If a key is missing and the source fails, the
  route records an error run and `/api/health` goes stale.
- Be polite to sources: at most one request every 2–3 s per portal. NJDG
  gets ≥ 3 s between requests; the collectors identify themselves honestly
  in the user agent and never use captcha-protected pages.
- `vercel.json` is the schedule that counts. `tests/cron-schedule.test.ts`
  fails when a route's header `schedule "…"`, a `PORTAL_COLLECTORS` entry or
  a data-sources `cron` disagrees with it, or a route and `vercel.json` do
  not list each other.
- There is no local runner any more (`npm run scraper` is gone). To run a
  collector by hand, call its cron route (section 3); the admin "run now"
  button (`/api/admin/run-scraper`) covers weather, news, crops and insights
  for one district.
- Never use the word "scraper" in citizen-facing text (CLAUDE.md).
