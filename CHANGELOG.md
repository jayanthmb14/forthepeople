# Changelog

All notable changes to ForThePeople.in are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). One dated entry per push to `main`.
This file replaces the scattered "current state" blocks in `CLAUDE.md`, `docs/LIVE-STATE.md` and the vault.

## [Unreleased] — 2026-09-27 audit fixes

Branch `audit-fixes-2026-09`, five parallel work-streams merged from one end-to-end audit of the
production site (prod = `38df958`, deployed 2026-06-11). Nothing here is deployed until it is
reviewed and pushed; see "Manual actions" at the bottom of this entry.

### Fixed — people & services audit findings (branch `v54/fix-people-services`, 2026-09-28)
Rule: verified or hidden; each error fixed where the code produced it. Not deployed; the data
script is a dry run until the owner runs it with `--confirm`.
- **Census 2011 is one set of numbers**: `/api/data/population/profile` and `/api/data/overview`
  take population, sex ratio, literacy, urban share and density from the checked Census 2011
  PopulationHistory row (`src/lib/census-2011.ts`); Pune's population tiles now show its Census
  figures. District constants corrected (no projections or city-corporation figures); Compare is
  labelled "Census 2011", counts only official taluks, and says "no data" for unpublished spending.
- **Report card** (`src/lib/health-score.ts`): literacy from the Census, students-per-teacher and
  school facilities from UDISE+ only, "PHC/Health Offices" flagged not collected, completion counts
  every spelling of completed, court score capped at 100, no police stations = not collected.
- **Overview**: the projects card uses the glance tile's "being built" rule; invented metro taluk
  lists are hidden (`subUnitsUnchecked`), counts are the official ones (Lucknow 5, Mysuru 9).
- **Hidden at the API** ("People & services" block in `src/lib/data-filters.ts`): per-school counts
  without a UDISE+ code, notes packed into school addresses, inactive bus/train rows, famous people
  not born in the district, staffing rows not from a government site; the news engine no longer
  writes staffing; eligibility tests carry no post count; unconfirmed exams show no post count.
- **Text**: population sources list only Census 2011 and NITI MPI; New Delhi's civic bodies are
  NDMC, the Cantonment Board and part of MCD; Aarogyasri ₹10 lakh and MJPJAY for all ration-card
  families (en/hi/kn); health "data date" no longer uses a maintenance edit's timestamp.
- **Data script** `scripts/fix-audit-2026-09-people-services.ts` (dry run: 296 changes with sources).
  After `--confirm`: clear Redis caches and re-run the health-score job.

### Fixed — duplicates: the writers fixed, and a guard that removes its own (branch `v52/dedupe`, 2026-09-28)
Owner rule: a duplicate on the site means the code that wrote it is wrong. Nothing here is deployed
or applied to the database yet.
- **One definition of "the same thing"** (`src/lib/dedupe/keys.ts`, `match.ts`): canonical names
  (roman numerals, ordinals, abbreviations, old city names, aliases such as Atal Setu / Sewri–Nhava
  Sheva / MTHL), exam keys (NEET 2026 = NEET (UG) 2026 = NEET UG 2026), the exam status set
  (unknown → `UNVERIFIED`; "upcoming" is not a published notification), the election-type set
  (`LOK_SABHA`, `ASSEMBLY` …) and a similarity score for review-only candidates.
- **Exams** (`src/lib/dedupe/exam-rules.ts`): a national exam is one row (no state, no district),
  a state exam one row per state; exam-sync and the UPSC/SSC collector match by canonical key;
  only government / statutory organisers are stored; `/api/data/exams` shows one row per exam and
  never a non-government one. The per-district clone `onboardDistrictExams()` is removed.
- **Elections**: every writer (seeds, ECI collector, admin editor) stores the canonical
  `electionType`; the collector matches seats by canonical key.
- **Infrastructure**: every `InfraProject` writer (infra-sync, PMGSY collector, Pune seeds) looks up
  the district's projects by canonical name / ≥ 0.85 similarity before creating, never across
  different numbers (Phase 1 / Phase 2); `scripts/dedup-infra-projects.ts` now wraps the guard.
- **News**: the ingest-time duplicate checks now match stored titles (they never matched a title
  with punctuation), URLs are compared without tracking parameters, and the cron clean-up keeps the
  original story instead of the latest copy.
- **Duplicate guard** (`src/lib/dedupe/guard.ts`, cron `/api/cron/dedupe-data`, `?dry=1`): exact
  duplicates in 24 citizen-facing tables are merged automatically (best row kept, gaps filled,
  child rows moved, others deleted or set inactive); same slot with different facts (an election
  seat with two winners) and ≥ 0.85-alike names go once to `NewsActionQueue`
  (`verify-duplicates`). Not in `vercel.json` yet.
- **One-time clean-up** `scripts/dedupe-2026-09.ts` (dry run by default, `--confirm` = one
  transaction). Dry run on 2026-09-28: 30 exam copies merged into 4 rows, 11 non-government exams,
  6 election duplicates, 1 school duplicate, 75 election types and 16 exam statuses rewritten,
  39 kept exam rows moved to or relabelled with their national / state place; 1 conflict and 2
  similar pairs listed for review.

### Changed — v5.1 "Warm Calm", round 3 (branches `v51/*`, built 2026-09-27, merged 2026-09-28)
Ten parallel work-streams, merged into `redesign-v4` on 2026-09-28. Nothing here is deployed until
the owner reviews and pushes. New strings ship in en + hi + kn (Hindi and Kannada are drafts).
- **Chrome** (2026-09-27): full-width header with an apps switcher (ForThePeople.in; Connect and
  Jobs "coming soon"), a status strip (IST clock, share market open / closed, "live data refreshed"
  on district pages), language menu order rule, compact district-finder chips with a vote card, a
  floating "Report a problem" button on every page, and a light footer with a pastel ribbon.
- **Home** (2026-09-27): running price ticker, highlighted hero with count-up stats and a 1.2 s
  once-per-session intro, a clickable India map, "Explore all of India" as the second section,
  live districts as chips, Prices today cards, "How we get and check the data" and a support band.
  Rebuilt every 15 minutes; all motion off under reduced motion.
- **District pages** (2026-09-27): IST clock and a live-feed pill in the district bar; a colourful
  overview (hero, number tiles, four picture cards); the glance row only on the overview; "Check
  this data" shows each dataset's double-check status; ended budgets say "Old year".
- **Pictures** (2026-09-27): shared SVG category glyphs (`src/components/graphics`) on News, Police
  and Infrastructure. Untagged stories no longer count as "linked to a data page"; Hyderabad's
  estimated crime and traffic rows are no longer shown as NCRB counts; project-kind chips count
  only active projects.
- **Weather** (2026-09-27): "Tomorrow" and a 7-day forecast from Open-Meteo, with OpenWeather as
  a second opinion (`/api/data/forecast`); an honest "right now"; only the last 48 h of readings;
  drawn weather pictures.
- **Support** (2026-09-27): checkout opens in a popup; each plan has its own colour and drawing;
  a colourful supporters wall; names that are phone numbers show as "Supporter" (the API too
  since the v5.2 wiring below).
- **Double-check** (2026-09-27): new `DataVerification` model, five verifiers (freshness, leaders,
  weather, dams, mandi), the daily `verify-data` cron and `/api/data/verification`
  (`docs/VERIFICATION.md`). `db:push` done 2026-09-28 (DataVerification + ContentTranslation).
- **Courts** (2026-09-27): NJDG collector, `scrape-courts` twice a day, `/api/data/court-pendency`
  and a new courts page (cases waiting, how old, filed vs decided per year, time to decide).
- **Collectors** (2026-09-27): JJM tap water, UDISE+ schools, MGNREGA "At a glance" and state
  e-procurement tenders, each cross-checked before it writes; `src/scraper/lib/collector-registry.ts`.
  Health facilities and power cuts stay blocked at the source (login or captcha).
- **Leaders** (2026-09-27): `scripts/fix-leaders-2026-09.ts` (dry run by default; on a snapshot it
  would add 102 rows, deactivate 105 and update 142) and `docs/LEADERS-VERIFIED-2026-09.md`.
  Applied to production 2026-09-28 (349 writes, idempotent re-run: 0).
- **Crons** (2026-09-28): `vercel.json` now schedules `verify-data`, `scrape-courts`, `scrape-jjm`,
  `scrape-schools`, `scrape-mgnrega` and `scrape-tenders`; `health-score` runs daily because grades
  expire after 7 days (19 crons in all, `docs/RUNBOOKS/crons.md`).
- **Docs** (2026-09-28): ARCHITECTURE, BLUEPRINT-UNIFIED, DESIGN-SYSTEM (v5.1), I18N §1, the crons
  runbook and `.env.example` updated for all of the above.

### Changed — AI models (2026-09-27)
- Re-chosen from a test on 28 real headlines scored against Claude Sonnet 5
  (`docs/RUNBOOKS/ai-models.md`). News sorting: Jev Router first (free while it routes to a free
  model), then free Gemma and OpenRouter's free router, then GPT-5.6 Luna as the paid backstop when
  `AI_PAID_FALLBACK=1`. Insights: GPT-5.6 Luna, then Gemini 3.1 Flash-Lite. Fact-checks: Claude
  Sonnet 5, then Claude Haiku 4.5. Routers get the plain request (they reject
  `response_format` / `reasoning`). Model ids live only in `src/lib/ai-models.ts`.
- Sarvam translation uses `od-IN` for Odia.

### Fixed — news collector fair share (2026-09-27)
- The news collector sorted articles one AI call at a time, so the first district used the whole
  240 s budget and a run reached about one district in ten. Each district now gets an equal share
  of the AI time (at most 20 AI calls; keyword sorting after that), districts fetched longest ago
  go first, and articles that may be about another place wait for the next run. The cron runs
  every 4 hours.

### Data clean-ups applied to production (2026-09-27)
Dry run shown first; a Neon backup branch `backup-2026-09-27-pre-cleanup` holds the rows from
before. Numbers as in `docs/OWNER-TODO.md` §3.
- `scripts/cleanup-news-derived-2026-09.ts --confirm`: removed 26 national project copies, 260 crime
  numbers taken from headlines and 25 fake power cuts; hid 162 leaders guessed from news.
- `scripts/cleanup-seeded-2026-09.ts --confirm`: removed 144 seeded rainfall rows, 24 invented
  traffic-fine rows, 14 hard-coded exams and 8 hand-entered dam readings; blanked 4 invented
  sugar-arrears figures.
- The 24 hand-typed Mysuru rainfall rows ("IMD Mysuru") are hidden on the site, not deleted (owner
  decision).

### Ops — Sentry, Vercel env, Railway (2026-09-27)
- **Sentry DSN fixed.** The site sent errors to a Sentry project that no longer exists, so Sentry
  showed nothing for months. `NEXT_PUBLIC_SENTRY_DSN` now points at `forthepeoplein /
  javascript-nextjs`; it takes effect with the next deploy.
- **Vercel env changes** (all environments): `AI_PAID_FALLBACK=1` added; `NEXT_PUBLIC_SENTRY_DSN`
  replaced. No new variables.
- **Railway finding.** The old Railway collector (project "ForthePeople", Pro plan) is still running
  the pre-April scheduler and billing. Its weather job writes into an old database, not the live
  Neon one; the rest fail. It redeploys whenever `main` changes. Stop it before merging to `main`
  (steps in `docs/OWNER-TODO.md` §2).

### Changed — v5.3 UI chrome: one report button, slim footer, quieter news (branch `v53/ui-chrome`, 2026-09-28)
Owner feedback on the v5.1 chrome. New strings in en + hi + kn.
- **One report button**: the floating "Report a problem" is the only report form; "Report a
  mistake" is gone from "Check this data" (`ReportMistake.tsx`, its event / hash hand-off and the
  `page_shell.report` strings removed). The floating form still sends state, district and module
  (and names the taluk on a taluk page).
- **Slim footer** on district pages and India module pages: one line (logo mark, "Built by
  Jayanth M B", About · Privacy · Disclaimer, "More") that opens the full footer in place
  (`FooterFrame.tsx`, rule in `footer-mode.ts`, test `tests/footer-mode.test.ts`). Other pages keep
  the full footer.
- **Footer credit**: "Built by Jayanth M B" (no "in Mandya"); the name links to LinkedIn. The
  footer's bottom rule now lines up with the columns above it.
- **News**: story headlines 15 px regular weight (14 px on phones) on calmer cards
  (`TapCard density="compact"`), smaller topic headings, tiles and sheet title; lighter headline
  weight in the overview and India news lists.
- **Alignment**: the district bar and its phone/tablet line follow the header's 12 / 20 / 24 /
  28 px sides; news topic tiles sit two per row at 320 px.

### Changed — home page from the owner's review (branch `v53/ui-home`, 2026-09-28)
- **Hero** (2026-09-28): heavier heading with "your district" in brand blue; the yellow highlighter
  stroke is gone; the slogan is larger with "Your data." in bold brand blue.
- **Stats** (2026-09-28): "Your district data — tracked and checked" over four tiles (districts
  live, states, dashboards each, data points tracked) with "Updated …" beside it. Districts and
  states now come from the live District rows the page loads (same rows as the Live districts list).
- **Prices** (2026-09-28): ticker and cards show only the everyday prices — gold 24K / 22K per 10 g
  and silver per kg (as IBJA publishes them), petrol and diesel in Delhi (plus Mumbai, Chennai,
  Kolkata on the cards), and a slim Sensex / Nifty 50 / US dollar row. Mandi crop prices, crude oil
  and the ticker's own date/time chip (the status strip already shows it) are removed.
- **Fuel collector** (2026-09-28): new `/api/cron/scrape-fuel` (not in `vercel.json` yet; suggested
  `0 7,14 * * *`) reads PPAC's daily metro table and "as on" Delhi lines and BPCL's Delhi price
  build-up; stores Redis `ftp:data:fuel` only when they agree to the paisa; `/api/data/prices` now
  returns `fuel`. Small dependency-free PDF text reader in `src/scraper/lib/pdf-text.ts`.
- **Map** (2026-09-28): seamless pastel states in four tones (no district seams), a soft coast
  outline, pins the same size on every screen with a small name beside each, crowded pins spread
  in their own compass order, zoom buttons top left.
- **Removed** (2026-09-28): the map hint line (repeated the legend) and the "The whole country"
  eyebrow above "Explore all of India".

### Fixed — v5.2 wiring: verified or hidden (branch `v52/wiring`, 2026-09-28)
Backend wiring after the v5.1 merge. Rule: a value that is unverified, invented, seeded or
estimated is not shown as fact. No database writes; the clean-ups below need the owner.
- **Courts**: NJDG collector is the only source shown — freshness rule (daily, 3 days),
  data-sources page ("collected automatically"), dataset dates (snapshot read time), compare /
  AI insights (`/api/data/courts`) and the report card use only `NJDG district dashboard …` rows
  (`NJDG_COURTSTAT`). The Railway scheduler uses `scrapeCourtsNjdg`; `jobs/courts.ts` removed.
- **Seeded rows hidden at the API** (`src/lib/data-filters.ts`): tap water shows only the JJM
  dashboard's district total (`JJM_DISTRICT_TOTAL`, never added to the 18 seeded rows, out of the
  water-test figures); estimated crime and traffic rows (`SHOWN_CRIME`, `SHOWN_TRAFFIC`); seeded
  village councils (`VERIFIED_PANCHAYAT`). Applied in the data API, freshness, dataset dates,
  report card, AI insight templates and the home data-point count.
- **Collectors**: schools and village-council pages read the UDISE+ and MGNREGA snapshots (new
  MGNREGA section; counts printed as 0.00 lakh read "fewer than 1,000"). JJM, schools and
  village councils are listed as collected automatically, matching `PORTAL_COLLECTORS` (tested).
- **Verification**: `/api/admin/cleanup-news` keeps `verify-*` items; new read-only admin page
  **News & Check Queue** (`/admin/news-queue`).
- **News pipeline**: no headline can create a Leader, CrimeStat or PowerOutage row; generic
  "news" items and police items that are not crimes (transfers, reshuffles…) are no longer queued
  (`src/lib/news-action-rules.ts`).
- **Weather**: OpenWeather is asked by the district HQ's lat/lon (same point as the forecast).
- **Glance row**: "being built" counts only projects at the building stage (= Projects page).
- **Privacy**: supporter APIs never send a phone number or e-mail as a name (shared rule
  `src/lib/supporter-name.ts`, cache keys bumped in `src/lib/supporter-cache.ts`); the Razorpay
  webhook no longer uses the payer's contact as the name. `/api/payment/contributors` adds
  `oneTimeCount` / `oneTimeRupees`.
- **Owner clean-ups (not run)**: 44 hand-seeded `CourtStat` rows; 18 seeded `JJMStatus` rows; 18
  estimated `CrimeStat` + 12 estimated `TrafficCollection` rows; 8 seeded `GramPanchayat` rows;
  482 pending generic "news" + 23 non-crime "police" `NewsActionQueue` items; 35 `Supporter` names
  that are phone numbers (`scripts/anonymize-supporter-names.ts`, dry run first).
### Changed — v5 "Calm": quieter design, honest dates, cleanup (branches `v5/*`, 2026-09-27)
The owner found v4 "cartoonish". Nine parallel work-streams moved the site to a calm, pastel,
blue-based look, made every date honest and cleared out dead files. Nothing here is deployed
until the owner reviews and pushes.
- **Design system v5 "Calm"** (`docs/DESIGN-SYSTEM.md`): a soft blue-white page, white cards, one
  blue for actions, support as a soft rose tint. The 14 module hues are pastel and used only as
  identity; no saturated gradient bands. Plus Jakarta Sans everywhere (Bricolage only for a page
  H1). Emoji only as module identity (sidebar item, module chip, overview tile); the kit draws
  Lucide icons where pages still pass an emoji. Subtle motion; the home intro splash is gone.
  Token contrast is unit-tested.
- **Honest dates**: every dataset carries its own date, with realistic expected ages
  (`/api/data/freshness`, `src/lib/freshness.ts`). Old data gets a calm amber notice under the
  title ("This data is N days old … we could not find newer data"); undated data says "date not
  published by the source". Every district page ends with one "Check this data" panel: source,
  data date, when we last checked, on time or late, how we get it, a link to check it yourself
  and one "report a mistake" button.
  - AI cards hide when they are older than 30 days or older than the page's data.
  - Weather, dam and mandi rows carry their reading date; headers no longer say "right now" or
    "updated daily".
  - Exams show "open" and countdowns only for confirmed dates. Empty states say what is missing
    instead of promising a collector.
- **Home and header**: a one-row header with a district finder. The home page is search, "Use my
  location" and **Explore all of India** (the primary action), then the live districts, India at a
  glance, prices today and one support line. "Latest data", "Built with citizens" and "Remember my
  district" are gone. A light footer carries a ForThePeople Connect "coming soon" note.
  `Permissions-Policy` now allows geolocation for the site itself (it was blocked, so "Use my
  location" never asked).
- **District pages**: one sticky district bar instead of three stacked bars, a glance row of key
  facts, a calm overview (name, glance, basics, then topics), and a sidebar and drawer that say
  "coming soon" where a module has no data.
- **Module pages**: calm headers and flat pastel fills, no decorative emoji, one stale notice and
  one sources block per page, no repeated footers or links, the answer first. Per-district state
  config (Pune no longer inherits Mumbai's). "Where our data comes from" says how each dataset
  really arrives and how old it is; the update log is grouped by day in plain words.
- **Support, supporters and prices**: a simple support page (plans, how to subscribe,
  supporters). Supporters are placed by tier or amount, so the Founding Builder shows first
  everywhere (district pages said "All India — be the first" because only recurring gifts
  counted). New `/[locale]/prices`: gold, silver, the rupee, crude oil, Sensex and Nifty with
  3-month trends from IBJA and Yahoo Finance, and no fallback prices.
- **Backend**: an AI model chain with live-checked ids, a reachable paid backstop, JSON mode and an
  expiry guard; AI JSON goes through `callAIJSON`; news-intelligence makes one AI call per
  district, only for new news, inside a time budget. Collection jobs never invent a figure when a
  source field is missing, and every cron run writes one `ScraperLog` row.
- **Cleanup and docs**: 21 dead source files, 13 duplicate or boilerplate static files and 55
  one-off or risky scripts removed (git history keeps them); 14 provenance scripts moved to
  `scripts/archive/`; stale docs, completed prompts and the broken Docker files moved to
  `docs/archive/`. `docs/BLUEPRINT-UNIFIED.md` is rewritten as the current overview (the old one is
  `docs/archive/BLUEPRINT-UNIFIED-2026-06.md`); `public/llms.txt` now lists the ten live districts,
  36 modules and en + hi + kn; `CLAUDE.md` points at the current docs.
- Every new string ships in English, Hindi and Kannada.
- Owner actions from the cleanup (local, not in git): move anything still needed from the 13
  `.env*` backup copies into the password manager and delete them; delete the merged `ui-backup-*`,
  `backend-backup-*` and `session-*` branches; remove the stray `.vercel/` link in the parent
  folder.

#### After the v5 merge (2026-09-27)
- Seeded random numbers are never shown. The rainfall rows for Mandya, Bengaluru Urban and New Delhi
  (2020–24), the traffic-fine amounts and the sugar arrears had been generated with `Math.random()`
  and labelled KSNDMC/IMD, Traffic Police and Sugar Directorate (`src/lib/data-filters.ts`, API).
- The overview's projects card was 10× off: "lakh crore" and "crore" used the wrong powers of ten
  (Pune showed ₹8.45 lakh crore, but the total is ₹84,474 crore). The card and the leaders card are
  now translated, and the leaders card lists every MP.
- State settings are looked up per district everywhere, so Pune no longer shows Mumbai's power
  company, city corporation or tap-water note.
- Empty-data cards, the India subtitle, the About pledge and the disclaimer no longer claim "official
  government portals" only. The founder tier is "Founding Builder" everywhere.
- Exams: "applications open" only with a published closing date. The admin AI-settings and costs
  screens read the model list from `src/lib/ai-models.ts`. `/prices` is in the sitemap. Unused intro,
  feedback-button, growth-chart and shim files were removed.

### Fixed — data records checked by hand, "verified or hidden" (branch `v51/records`, 2026-09-27)
Every value below was checked against a named source (government portals first, reputed news only
where nothing official exists); a value that looked wrong, invented or stale and could not be
confirmed is hidden. Full table with sources: `docs/DATA-FIXES-2026-09.md`.
- **Fix script** `scripts/fix-records-2026-09.ts` (data in `scripts/fix-records-2026-09/`): dry run
  by default, `--confirm` applies all 1,179 changes in one transaction, rows matched by id, skips
  anything changed since the check. Not yet applied — the owner runs it.
  - Infrastructure: stale statuses fixed (New Parliament and Bharat Mandapam completed 2023,
    Hyderabad Metro Phase 1 completed 2020, Mumbai Metro 3, Namo Bharat, Navi Mumbai airport …),
    Pharma City and SRDP budgets from the sanctioned figures, duplicates (Atal Setu, AIIMS, Joka,
    Blue Line) and non-projects (maintenance block, renamings, policies) removed, and the unsourced
    spring-2026 seed rows hidden (Bengaluru Urban 161 → 25 rows, Mysuru 83 → 18).
  - Population: the fake "2021 census" rows and unsourced projections removed; Census 2011/2001
    values corrected; unverifiable pre-2001 rows removed.
  - India dashboard: foodgrain 12.7 → 376.6 Mt (3rd AE 2025-26), 88 figures updated with their real
    dates, 64 unverifiable seed values hidden; no more "as of 1 May".
  - Police: real numbers for Mysuru, Mandya and Bengaluru from the official police directories;
    invented numbers elsewhere hidden; invented and duplicate stations deleted.
  - Offices: invented phone numbers and seeded hours hidden; DC offices corrected.
  - Schemes and small modules: unsourced counts and stale amounts hidden; 142 hand-typed rows in
    crime, courts, RTI, power, traffic, canal, JJM, housing and agri-advisory tables deleted.
- **Code:** helplines — women 181, NHAI 1033 instead of 1073, 1064 only in Telangana/Maharashtra,
  consumer 1915, Delhi ambulance 102, police 100 and the old NHH line removed; "My Responsibility"
  numbers that could not be confirmed removed; India KPI tiles (population 1.46 bn, GDP $3.92 tn),
  world ranks (economy #6) and state rank order corrected. Strings in en + hi + kn.
- **Still to do under the same rule:** office addresses, schools, transport, industries, gram
  panchayats, famous personalities, election results and the "My Responsibility" statistics.

### Fixed — data, crons and AI
- Cron endpoints now accept the `Authorization: Bearer <CRON_SECRET>` header the way Vercel actually
  sends it (two crons had never run from the scheduler because of the wrong header / HTTP method).
- AI model chain replaced: every free OpenRouter model in the old list had been withdrawn upstream, so
  every AI call had failed since late August. New chain: free Tier-1 (`gemma-4` class) for news
  classification, a low-cost flash-lite model for insights, paid fallback only when `AI_PAID_FALLBACK=1`.
- Per-call timeouts on every external fetch in the collection jobs (the crops job used to time out
  the whole function).
- New scheduled jobs for weather and dam levels (previously only runnable from the retired Railway
  worker, so the homepage showed April temperatures under a "Live" badge).
- `/api/health` now reports `degraded` when any cron's last run is older than twice its schedule,
  instead of always saying healthy.

### Fixed — security
- 2FA (TOTP) step is bound to a signed, short-lived challenge cookie and rate-limited; it can no
  longer be reached without the password step.
- Admin API responses send `Cache-Control: no-store`; the blanket `/api/(.*)` CDN cache rule no
  longer applies to admin JSON.
- Rate limits on login, TOTP and the header-auth ops path.
- Supporter records anonymised at the API boundary (no emails / phones in public payloads).

### Fixed — honesty, routing, SEO
- Freshness pill reads the real "last updated" timestamps; the hard-coded green "Live" badge is gone.
- Platform facts (district count, module count, data-point count) come from one source and are no
  longer hand-typed in layouts, About and JSON-LD.
- Homepage "Live data right now" cards read the correct API shape.
- Service worker no longer precaches a redirecting URL; offline page works.

### Fixed — build
- Fonts are self-hosted (`src/fonts/*.woff2`, `src/lib/fonts.ts`, `next/font/local`). Vercel's
  build container could no longer fetch Google Fonts, so every build of `main` failed from
  2026-09-26. All eight families are SIL OFL 1.1. No visitor IPs are sent to Google any more.

### Changed — Design v3 "Civic Ledger" (built, then replaced before release)
- v3 was built on this branch and replaced by v4 "Rang" and then v5 "Calm" before it was ever
  deployed, so its design notes are dropped here. Fixes from that pass that still stand:
  - Offices "Open now" uses Indian Standard Time and the hours the page shows.
  - Tenders and water copy promise only cadences that a scheduled job delivers.
  - District cards and state pages take population from sourced Census 2011 rows; other figures
    say "Latest available estimate". Local names that repeat the English name are hidden.
  - Weather collapses repeated readings into one row with date and time; the finance sector chart
    labels every sector; state maps fit their frame.
  - The compare page honours `?module=`; phone breadcrumb-sheet links navigate again.
  - `scripts/fix-district-local-names.ts`: dry-run fixer for local-script names (see Manual actions).

### Changed — Design v4 "Rang", languages and location (branch `redesign-v4`)
- 2026-09-27: English is always the default language. Browser-language detection and the locale
  cookie are off, so `/` and unprefixed links always open in English.
- 2026-09-27: "Find my district" checks district boundaries first and falls back to the nearest
  centre. A "Your district" card then pops up.
  - Live districts show their landmark, tagline, weather and grade, with a link to their dashboards.
  - Districts that aren't live yet show the vote count and the nearest live district.
- 2026-09-27: The language menu lists all 22 Indian languages. The ones not yet available are shown
  locked with their native names.
- 2026-09-27: Live text (news, AI insights) is translated **once** in the backend and stored, in a new
  `ContentTranslation` table. Switching language only reads stored rows and never spends
  translation credits.
  - Providers: Bhashini, Google Cloud Translation or Sarvam, picked by env key.
  - Hooked into `scrape-news` and `generate-insights`, with a catch-up cron `translate-content`
    (every 3 h, `?dry=1` to test a key).
  - Spend caps per run and per month.
  - It is off until a key is added and `npm run db:push` has created the table.
- 2026-09-27: The India map shows live districts as landmark badges in each district's colour, and
  nearby pins fan out with leader lines. The district overview has a "Where is {district}?" locator map.

### Changed — v4.1: Hindi, clearer modules, tap-for-details, device layouts (branch `redesign-v4`)
- 2026-09-27: **Hindi is switched on** (beta, machine draft) next to English (default) and Kannada:
  `hi.json`, a Hindi file for every page, Hindi names for the live districts and taluks
  (`names.hi`), and Devanagari and Kannada fonts that are actually applied. Numbers everywhere use
  Indian grouping with Latin digits.
- 2026-09-27: **Modules regrouped** into 9 plainly named groups: Start here, You can help, Who runs it,
  Money & projects, Help for you, Daily needs, Farming, Know your district, Check our work.
  - Look-alike modules were renamed. For example, "Offices & Services" and "Services Guide" became
    "Govt offices near you" and "How to get certificates".
  - Every module page ends with "See also" tiles.
  - Titles and descriptions are translated, and no title claims "Live".
- 2026-09-27: **Tap for details on every module** (`DetailSheet`):
  - Leaders: role in plain words, contact, how the record was checked, and headlines naming them.
  - Schemes and housing: one-line benefit, a "how it works" picture, who can get it, and where it
    runs.
  - Exams: countdown bars and a full timeline.
  - Also hospitals, offices, dams, police stations, projects, tenders and news.
  - "What you can do" now puts first the actions that match this fortnight's district news.
- 2026-09-27: **Layouts per device**:
  - Tablets get the phone menu instead of a sidebar that left about 500 px for content.
  - Laptops and PCs use a 1320 px frame instead of a 960 px column.
  - Stat tiles show 2 per row on tablets.
  - The "not live yet" district page uses the same frame and is translated.
- 2026-09-27: The leaders API now returns the stored phone, email and local names (they were always
  blanked). Alerts are ranked by severity (the text sort put "medium" before "critical").

### Changed — every page in English + Kannada, new real-data pictures (branch `redesign-v4`)
- 2026-09-27: Nine agents converted every district module page, the site pages and the India dashboard
  to message files (en + kn, `src/dictionaries/<locale>/page_<name>.json`). Each page gained at least
  one picture drawn from real data, for example:
  - crop price bars and biggest price changes
  - "Is the water safe?" (JJM)
  - "How each ₹100 is shared" (finance)
  - "Who runs these schemes"
  - an elected-representatives ring
  - exam hiring ring
  - "Who reported it" (news)

  Also fixed:
  - India deep-dive pages showed mock values as real data, and the India band showed 0 in the
    server HTML.
  - Exams showed some exams twice and a raw key.
  - Kannada numbers used western grouping, and Marathi, Bengali and Urdu would have used native digits.
  - Taluk and tender headings now use the local-script name.
  - Four copies of a place-name hook were merged into one.
- 2026-09-27: **Election results are withheld** until they are checked against ECI. The seeded rows
  had wrong winners (Mandya 2024), a Mysuru seat filed under Mandya, round vote counts and
  placeholder runners-up, all labelled ECI.
- 2026-09-27: The kit gained `DetailSheet` (tap any item to see everything about it), `HowItWorks`,
  `CountdownBar` and a `ModulePage` frame. On laptops and PCs, module pages now use up to 1320 px
  instead of a 960 px column. See `docs/LAYOUT.md` and `docs/MODULE-MAP.md`.

### Fixed — district data and maps (Sept 2026 backend audit, branch `redesign-v4`)
- 2026-09-27: **Infrastructure shows only the district's own projects.** STATE and NATIONAL rows were
  copied onto many districts; one Delhi project appeared on all ten district pages. District pages,
  the report card and insights now use DISTRICT and CITY projects only (`src/lib/data-filters.ts`),
  and the sync no longer fans NATIONAL projects out to every district.
- 2026-09-27: The Police, Leadership and Power pages no longer show rows guessed from news headlines.
  Examples were "Prime Minister of India" stored as a leader's name, any number in a headline stored
  as an NCRB count, and "Factories go fully solar" stored as an outage. The news engine now sends
  these three modules to the admin review queue instead of writing them.
- 2026-09-27: News lists no longer repeat one story from several outlets. Mandya showed the same
  Lokayukta raid 3 times and one car accident 4 times. `src/lib/news-dedupe.ts` collapses reworded
  copies within 48 hours and prefers the outlet's own headline over an "India News | …" aggregator
  copy.
- 2026-09-27: **The Elections page shows results again.** A static calendar route at
  `/api/data/elections` shadowed the module route. The calendar moved to
  `/api/data/election-events`.
- 2026-09-27: Maps.
  - Telangana has its own map (split from the pre-2014 Andhra Pradesh file).
  - Map names now match district pages (`src/lib/geo/aliases.ts`): Mumbai Suburban → Mumbai,
    Haora → Howrah, Gurgaon → Gurugram, Delhi's districts, and others.
  - Clicking a map shape that has no page no longer opens a 404.
  - Andaman and Nicobar, Jammu and Kashmir, and Dadra and Nagar Haveli and Daman and Diu are no
    longer blank on the India maps.
  - Map labels are translated.
  - Taluk maps say their shapes are approximate, and the false OpenStreetMap credit is removed.
  - **State maps are no longer inside-out.** Every state file except Karnataka used GeoJSON winding.
    d3 draws that as "the whole world except this state", so the card was grey with the state shrunk
    to a speck. `scripts/rewind-geo.mjs` (`npm run geo:rewind`, `--check` for CI) fixed 35 files.
    States now fit their frame, live districts get a pin, and the district locator's landmark badge
    sits on the district instead of the top-left corner.

### Removed — dead code
- Unreachable v1 India components, legacy Header/Footer, unused redesign-v2 components, tracked
  `.v1/.v2/.v3` snapshot files and the permanently redirected `india-detail` page.

### Changed — lint, CI, dependencies, funding files, docs, tests (this work-stream)
- **ESLint is green (0 errors).** Real fixes: 13 unescaped JSX entities, the two `<a href="/en/admin">`
  back-links (now `next/link`), `prefer-const` in the Karnataka tenders seed, and the only genuine
  hooks violation (`SupportCheckout` read the React Query client inside `try/catch`; it now reads
  `QueryClientContext` directly, which is null-safe outside a provider). The five React-Compiler
  rules from `eslint-plugin-react-hooks` v7 are downgraded to `warn` in `eslint.config.mjs` and
  marked as legacy debt to burn down.
- **Toolchain:** Node 24 everywhere — `.nvmrc`, `package.json` `engines`, CI uses
  `node-version-file`. CI gains a third job, **Unit tests** (`npm test`). Lint stays a required job.
- **Dependencies:** `next` ^16.3.4 (clears the 16.2.x security advisories; resolves 16.3.6),
  `sharp` 0.35.4 via Next's optional dependency, `eslint-config-next` aligned to the same range,
  `@types/node` 24. Removed direct dependencies with zero imports: `@google/generative-ai`, `d3`,
  `@types/d3`, `topojson-client`, `@types/topojson-client`, `zustand`, `@types/bcryptjs` (bcryptjs
  ships its own types). Added `vitest` + `vite` (dev). `npm audit fix` was NOT run.
- **Licence:** `LICENSE` is now the verbatim MIT text (GitHub previously reported `NOASSERTION`
  because of three extra binding clauses). Those wishes moved to a non-binding "Attribution"
  section in README. `humans.txt` and `package.json` say `MIT`.
- **Funding files:** `public/funding.json` (FLOSS/fund manifest v1.1.0: individual maintainer,
  project ForThePeople.in, `spdx:MIT`, Razorpay domestic channel only, plans ₹3,60,000/year
  infrastructure + ₹5,00,000 one-time district expansion + any-amount) and
  `public/.well-known/funding-manifest-urls`. TODO before submitting to FLOSS/fund or FOSS United:
  reconcile the ₹3,60,000/year figure with real invoices (the April ledger itemises ~₹2,700/month;
  the September applications say ₹25–30k/month — one of them is wrong) and run the manifest
  through the validator at floss.fund.
- **Security contact:** `public/.well-known/security.txt` (RFC 9116) and `SECURITY.md` both use
  `support@forthepeople.in` and promise acknowledgement within 7 days.
- **GitHub meta:** `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`.
- **Docs:** README no longer claims "real-time", credits only work that exists, says 108 Prisma
  models and "10 districts (see the live site)". CONTRIBUTING: Node 24, `.env.local`,
  `.env.example` as the only env list, `public/geo/`, a "Where to start" section, CodeRabbit claim
  removed. `.env.example` regenerated from a grep of `process.env.*` (adds
  `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `FTP_AI_PROVIDER`, `AI_PAID_FALLBACK`,
  `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_PLAN_*`, `NEXT_PUBLIC_ELECTION_MODE`, `FTP_MOCK_*`;
  drops the unread `TOTP_ENCRYPTION_KEY` and `NEXT_PUBLIC_SITE_NAME`). `CLAUDE.md` trimmed to rules
  and pointers. New `docs/ARCHITECTURE.md`. `docs/BUG-TRACKER.md` and `docs/LIVE-STATE.md` now
  state that the June sessions ARE deployed.
- **Tests:** Vitest with six suites over pure helpers (`tenders/format`, `contributor-name`,
  `supporter-message`, `contribution-expiry`, `badge-level`, `social-detect`).

### Manual actions (only the owner can do these)
The current, complete owner list is `docs/OWNER-TODO.md`; the items below are kept for history.
- ~~**Data cleanup:** `scripts/cleanup-news-derived-2026-09.ts`~~ — done on 2026-09-27 (see "Data
  clean-ups applied to production" above).
- ~~**Seeded random numbers still in the database**~~ (traffic fines, sugar arrears, rainfall) —
  removed or blanked on 2026-09-27 by `scripts/cleanup-seeded-2026-09.ts`.
- **New for v5.1:** `npm run db:push` also creates `DataVerification`; delete the 18 seeded
  `JJMStatus` rows before the JJM cron's first production run; run `scripts/fix-leaders-2026-09.ts`
  (dry run, then `--confirm`). Details in `docs/OWNER-TODO.md`.
- **Translation backend:** run `npm run db:push` once to create `ContentTranslation`, then add ONE
  provider key to Vercel (`BHASHINI_USER_ID` + `BHASHINI_API_KEY`, or `GOOGLE_TRANSLATE_API_KEY`, or
  `SARVAM_API_KEY`). Optional: `TRANSLATION_MONTHLY_CHAR_LIMIT`. Then call
  `/api/cron/translate-content?dry=1` with the cron secret to confirm the key works.
- Vercel: the 13 Sep "Account is blocked" status is already cleared (a probe deploy was created on
  2026-09-26). Push this branch so Vercel builds a preview: that build proves the font fix below.
  Until this branch is merged, any push to `main` fails on Vercel (`next/font/google` cannot
  download fonts in Vercel's build container).
- Vercel env: `AI_PAID_FALLBACK=1` was added on 2026-09-27 (all environments). Confirm
  `CRON_SECRET`, `ADMIN_SESSION_SECRET`, `RAZORPAY_WEBHOOK_SECRET` are set; `VOTE_IP_SALT` is still
  missing (`docs/OWNER-TODO.md` §2).
- GitHub: set the required status checks to `Type-check & Build`, `Lint` and `Unit tests`; drop the
  1-approval rule on this solo repo; label 4–6 issues `good-first-issue` / `help-wanted`.
- Admin → Support page: clear the "bio text" field (or edit it). The saved text names the
  company and hard-codes "9 districts … 29 live dashboards"; the built-in default is clean and
  computes counts live.
- After deploy, regenerate AI insights (admin) so the analyses match current figures.
- Funding: validate `https://forthepeople.in/funding.json` at floss.fund after deploy, reconcile
  the plan amounts with invoices, then submit.

## [2026-06-11] — Audit fix sessions 1–5 (deployed, prod `38df958`)
- Signed, revocable admin sessions (`src/lib/admin-auth.ts`, `ADMIN_SESSION_SECRET`).
- Build no longer runs `prisma db push`; Next.js patched for the May security release.
- RTI / court jobs no longer fabricate numbers on portal failure.
- Endpoint hardening and repo hygiene.
- Full detail: `docs/BUG-TRACKER.md`, `docs/LIVE-STATE.md`.

## [2026-05-20] — India National Dashboard live (`8c62903`)

## [2026-04-23] — Population module v2, 190 rows across 7 states (`bc33bec`)

## [2026-03-17] — Project inception
