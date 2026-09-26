# Runbook: Vercel crons

Owner: Jayanth M B. Last verified: 2026-09-27.

Every scheduled job on ForThePeople.in is a Vercel Cron hitting a route
under `src/app/api/cron/`. The schedule lives in `vercel.json` (`crons`
array) and is the single source of truth — if it is not in `vercel.json`,
it does not run. The old Railway node-cron container
(`src/scraper/scheduler.ts`) expired in April 2026 and is not used.

## 1. The crons

All times UTC (IST = UTC + 5:30).

| Route | Schedule | Interval | maxDuration | What it does |
|---|---|---|---|---|
| `/api/cron/scrape-news` | `0 6 * * *` | daily 06:00 | 300 s | RSS/news ingestion per district, dedupe, expire alerts > 14 d |
| `/api/cron/scrape-crops` | `30 3 * * *` | daily 03:30 | 300 s | AGMARKNET prices via data.gov.in; 250 s budget guard, `partial: true` if it ran out |
| `/api/cron/scrape-weather` | `*/30 * * * *` | every 30 min | 60 s | OpenWeatherMap reading per district (5 in parallel) |
| `/api/cron/scrape-dams` | `0 */6 * * *` | every 6 h | 120 s | Karnataka reservoir levels (other states skipped by the job) |
| `/api/cron/generate-insights` | `0 0,12 * * *` | every 12 h | 300 s | AI module insights where expired + data changed; infra analyses |
| `/api/cron/news-intelligence` | `0 */4 * * *` | every 4 h | 300 s | AI classification / extraction of fresh news |
| `/api/cron/scrape-budget` | `0 6 * * 1` | weekly Mon | 300 s | Returns `{skipped: true}` until a data.gov.in resource id exists |
| `/api/cron/generate-citizen-tips` | `0 6 * * 0` | weekly Sun | 300 s | 6 AI tips per district into Redis (7-day TTL) |
| `/api/cron/update-exams` | `30 6 * * *` | daily 06:30 | 120 s | Advance exam status from dates; flag > 30 d unverified |
| `/api/cron/platform-report` | `0 0 * * 0` | weekly Sun | 60 s | Weekly AI platform report row |

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

```bash
export CRON_SECRET='<value from Vercel env>'   # never commit this

# Vercel-style header (what the scheduler does):
curl -s -H "Authorization: Bearer $CRON_SECRET" https://forthepeople.in/api/cron/scrape-weather | jq .

# Equivalent manual header:
curl -s -H "x-cron-secret: $CRON_SECRET" https://forthepeople.in/api/cron/generate-insights | jq .
```

Every route answers GET. `generate-insights` and `generate-citizen-tips`
also answer POST (same handler). Expect a JSON body with counts; a 401 means
the secret is wrong or unset; a 504 means the route hit `maxDuration`.

Suggested order after a deploy that touched AI or crons:

1. `scrape-weather` (fast, proves DB + OpenWeather key)
2. `news-intelligence` (proves AI models — then check `/api/data/news?district=mandya` shows `classifiedBy` other than `keyword`)
3. `generate-insights` (then `/api/data/insight?module=overview&district=hyderabad` should be non-null)
4. `generate-citizen-tips` (then `/api/ai/citizen-tips?district=mandya` should list 6 tips)

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

## 5. Health — what "stale" means

`GET https://forthepeople.in/api/health` reads every cron in `vercel.json`,
works out its interval from the schedule, and marks it:

- `ok` — `lastSuccessAt` is within **2 × interval** (weather: 60 min, news: 48 h, weekly: 14 d)
- `stale` — no success inside that window (a cron that keeps erroring becomes stale)
- `unknown` — never recorded (right after the first deploy)

Top-level `status` is `degraded` when any cron is stale, the database is
unreachable, or `ai` is degraded (see `docs/RUNBOOKS/ai-models.md`).
`/api/health?strict=1` returns HTTP 503 in that case — point an uptime
monitor (UptimeRobot / Better Stack) at that URL and `/en`.

## 6. Adding a cron

1. Create `src/app/api/cron/<name>/route.ts`. Copy `scrape-weather/route.ts`
   as the template: `verifyCron`, `cronStarted`, `cronFinished`, `maxDuration`.
2. Add `{ "path": "/api/cron/<name>", "schedule": "..." }` to `vercel.json`.
   Health picks it up automatically.
3. Add a row to the table in section 1.
4. Deploy, trigger by hand once (section 3), check `/api/health`.

## 7. Known limits and gotchas

- Vercel Pro allows up to 300 s per cron (we use `maxDuration` per route).
  Crops and weather keep their own time budget and return `partial: true`
  rather than being killed mid-write.
- `scrape-budget` is a deliberate no-op: `STATE_BUDGET_RESOURCES` in
  `src/scraper/jobs/budget.ts` has no live dataset ids. It stays scheduled so
  adding an id starts collection without touching `vercel.json`.
- Weather needs `OPENWEATHER_API_KEY`; crops need `DATA_GOV_API_KEY`. If a key
  is missing the route records an error run and `/api/health` goes stale.
- Never use the word "scraper" in citizen-facing text (CLAUDE.md).
