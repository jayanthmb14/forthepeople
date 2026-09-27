# ForThePeople.in — Blueprint

The one-page picture of the whole platform: why it exists, who it is for, how
people use it, what it is made of and the rules every change must keep.

- **Describes:** branch `redesign-v4` plus the v5 "Calm" round and the v5.1
  "Warm Calm" round 3 (27–28 Sep 2026). Production still runs `main` =
  `38df958` (11 Jun 2026) until the owner pushes.
- **How to use it:** read this first for the shape of things, then the detail
  doc for the area you touch (section 16). When this file disagrees with the
  code, the code wins; when it disagrees with a detail doc, the detail doc
  wins. Fix this file in the same commit.
- **History:** the March–June 2026 master document is frozen at
  `docs/archive/BLUEPRINT-UNIFIED-2026-06.md`. Do not follow it.

---

## 1. Why this exists

In 2018 Jayanth M B was preparing for the civil services in Mandya and could
not find basic facts about his own district. Friends preparing for government
exams asked for theirs. ForThePeople.in is the answer, built for every
district: one free place where anyone can see what is happening in their
district, who runs it, where the money goes and what they can do.

- **Brand line:** "Your district. Your data. Your right." It is a small
  kicker, never a poster headline.
- **Mission:** make government data as easy to read as the weather, so every
  citizen can engage with governance based on facts.
- **What it is:** public digital infrastructure maintained by a citizen. Free
  for everyone, always. Open source (MIT). Not a startup, not a government
  website, not affiliated with any party.
- **Stance (locked wording):** "a connecting tool between citizens and
  governance — not an opposition platform and not a government mouthpiece."
  Never accuse, only display. The data speaks; captions do not editorialise.
  Good governance is shown as readily as problems.

## 2. Who it is for, and how they read a page

### The people

| Who | What they come for | Where it lives |
|---|---|---|
| Students and exam aspirants in tier-2 and tier-3 towns | exams, vacancies, dates, the district's facts for interviews | Exams & jobs, Overview, India page |
| Working citizens | roads and projects, water, power, buses, offices, certificates | Daily needs, Money & projects, Help for you |
| Older citizens and families | schemes, housing, helplines, hospitals | Help for you, You can help |
| The curious 22–35 year old | how India and their state compare | `/[locale]/india` |
| Journalists, researchers, officials | sources, dates, change history | Check our work, the verification section |

**The clarity bar:** a 5-year-old and a 60-year-old must both understand a
screen at a glance. If either would be lost, the screen is wrong.

### What people look at and click first

People scan the top of a screen, look for their own place, and tap the first
thing that looks like the answer. So:

1. **The main thing first.** The first screen shows the answer and the main
   actions. Nothing decorative sits above them.
   - Home: find my district (search, "Find your district" or "Use my
     location") beside a clickable India map, then **"Explore all of India"**
     (a pastel band with one big button), then the live districts.
   - District page: the district's name, a glance row of key facts, then the
     topics.
   - Module page: one sentence that answers the question, 3–4 big numbers,
     one picture, then the list.
2. **Tap for details, stay on the page.** Every list item opens a detail
   sheet (a bottom sheet on phones, a side panel on laptops) with everything
   about that item and its source link.
3. **One idea per element.** No repeated summaries, no badges that say the
   same thing twice, no second "about this page" block.
4. **Trust is visible.** A date and a source beside every number, a plain
   notice when data is old, and one verification section at the bottom of
   every page (section 6).
5. **Calm beats clever.** Pastel colour tells you which dashboard you are in
   and warms the page; it never hides the answer. Emoji only mark a module's
   identity; categories use drawn SVG pictures. Motion is small and has a
   job: the home page plays a 1.2 s branded intro once per session (any tap
   or key skips it), its stats count up once, and a price ticker runs along
   the top. Reduced motion turns all of it off.
6. **Money last.** Supporters appear after the data, never above it. The ask
   is soft: "zero pressure", "the site stays free for everyone, always".

### Words

- Plain, short sentences. Sentence case. No sales words ("limited time",
  "exclusive", "VIP", "unlock").
- Never "scraper / scraping / scraped" in citizen text; say "data collection"
  or "data source".
- Never "corruption tracker" or "hold power accountable"; never imply that
  the government hides data (it is an accessibility gap).
- Sources are **"government portals and other reputed sources"**. Never claim
  "official only" or ".gov.in only" when a page also shows other sources.
- No "non-profit" wording (there is no Section 8 company yet). The site is
  kept separate from the owner's company brand.

## 3. What exists

| Surface | Route | Notes |
|---|---|---|
| Home | `/[locale]` | price ticker; hero (the H1, search, "Find your district", "Use my location", count-up stats) with the clickable India map; **Explore all of India** (four checked national figures, big button); live districts as chips; prices today; "How we get and check the data"; a support band with a few supporters' names |
| India | `/[locale]/india/…` | national roll-up by category and module (`src/lib/india/india-modules.ts`, `api/india/*`, `India*` models); coming-soon modules say so |
| State | `/[locale]/[state]` | state map, its live districts, locked previews for the rest |
| District overview | `/[locale]/[state]/[district]` | name + local-script name, glance row, basics, all topics grouped |
| Module pages | `/[locale]/[state]/[district]/<module>` | 36 modules in 9 groups (section 4) |
| Taluk and village | `…/[district]/[taluk]`, `…/[taluk]/[village]` | where data exists |
| Prices today | `/[locale]/prices` | gold, silver, rupee, crude, Sensex, Nifty with trends (IBJA, Yahoo Finance) |
| Support and supporters | `/[locale]/support`, `/[locale]/contributors` | tiers, how to subscribe, supporters (section 11) |
| Site pages | `about`, `contribute`, `feedback`, `features`, `vote-district`, `compare`, `privacy`, `disclaimer`, `offline` | all under `[locale]` |
| Admin | `/[locale]/admin/…` | owner console (section 12) |

**ForThePeople Connect** (civic-issue reporting with photos, routed to state
grievance systems) and **ForThePeople Jobs** are separate future apps. Neither
is built. The header's apps switcher and the footer list both as "coming
soon"; they are not links. Today jobs live in each district's Exams & jobs
module; whether Jobs becomes its own app is an owner decision
(`docs/OWNER-TODO.md` §6).

## 4. Modules — 36 in 9 groups

Order, labels and groups live in `SIDEBAR_MODULES` / `MODULE_GROUPS`
(`src/lib/constants/sidebar-modules.ts`); translated names in `moduleNames`,
`moduleDescriptions`, `moduleGroups`. Details and the look-alike pairs:
`docs/MODULE-MAP.md`.

| Group | Modules | The question it answers |
|---|---|---|
| Start here | Overview · News · Alerts & warnings · Weather & rain | What is happening in my district today? |
| You can help | What you can do · Helplines & your rights · Ask the government (RTI) · RTI replies tracker | What can I do, and who do I call? |
| Who runs it | Leaders & officers · Elections · Village councils · Courts · Police & safety | Who is in charge? |
| Money & projects | Budget · Projects being built · Govt contracts (tenders) · Local industries | Where does the money go? |
| Help for you | Govt schemes · Housing schemes · How to get certificates · Govt offices near you · Exams & jobs | What can I get, and how do I apply? |
| Daily needs | Tap water (JJM) · Dams & rivers · Power cuts · Buses & trains · Hospitals & health · Schools | Water, power, a bus, a doctor, a school? |
| Farming | Crop prices · Farm & soil advice | What will my crop fetch? |
| Know your district | People (census) · Map · Famous people · Supporters | What is my district like? |
| Check our work | Where our data comes from · What changed and when | Can I trust this? |

Routes (slugs) never change when labels do. A module with no data for a
district says "coming soon" in the menus instead of showing an empty page.

## 5. Design — v5.1 "Warm Calm"

Full rules: `docs/DESIGN-SYSTEM.md` (tokens, kit, chrome, pictures, stale
notice, verification section) and `docs/LAYOUT.md` (phone / tablet / laptop /
PC, page recipe, DetailSheet).

- **Feel:** calm, clear, trustworthy, and warmer than v5. A soft blue-white
  page (`#F5F8FC`), white cards, one blue for actions (`#2563EB`, deep
  `#1E40AF`, tint `#E8F0FE`). Text `#0F1B2D` / `#4A5A70`. Support is a soft
  rose, never a crimson slab. v5.1 adds soft pastel washes (the home hero,
  the district overview's hero, tiles and cards), a 2 px pastel ribbon under
  the header and footer, and gold / silver accents for money and metals.
  v5 "Calm" replaced v4 "Rang" (called "cartoonish"); v5.1 keeps its rules.
- **Chrome:** a full-width header with an apps switcher (ForThePeople.in;
  Connect and Jobs "coming soon"), a slim status strip (IST clock, share
  market open / closed, "live data refreshed" on district pages), a floating
  "Report a problem" button on every page, and a light footer.
- **Module hues are identity only:** 14 pastel hues (`src/lib/design/hues.ts`,
  applied by `HueScope`). Big areas use the tint; the deep tone is for small
  icons, numbers and titles. No saturated gradient bands.
- **Emoji:** only as module identity — the sidebar/drawer item, the module
  chip in `PageHeader`, the module tile on the overview. Categories (news
  topics, crime types, kinds of project) use the crafted SVG glyphs in
  `src/components/graphics`; the weather page uses drawn SVG weather
  pictures (`src/components/weather`); support plans each have a drawn
  picture. Other data pictures use monochrome Lucide icons in the hue.
- **Type:** Plus Jakarta Sans for everything; Bricolage Grotesque only for a
  page H1 (optional). Sentence case. Tabular numbers.
- **Motion:** subtle, and each piece has a job: one fade-rise, bars grow,
  numbers count up once; on home a 1.2 s branded intro once per session
  (skippable), a running price ticker (pauses on hover or focus, has a pause
  button) and pinging live-district pins; a gentle sway or drift on weather
  and court drawings. `prefers-reduced-motion` turns it all off (the ticker
  becomes a still row you can scroll).
- **Kit:** `src/components/district/ui.tsx` (`ModulePage`, `PageHeader`,
  `StaleNotice`, `StatTile`, `Card`, `Section`, `Chips`, `DataTable`,
  `EmptyState`, `PrimaryButton`), `visuals.tsx` (`Explainer`, `Pictogram`,
  `Gauge`, `WaterTank`, `ChartCard`, `HowItWorks`, `CountdownBar`),
  `DetailSheet.tsx`, and `src/components/graphics` (`CategoryGlyph`,
  `GlyphChips`, `GlyphBarList`, `GlyphEmptyState`, `GlyphStack`). Use the kit;
  tokens and hue variables only, no hex values in components.
- **Page recipe:** header (+ stale notice) → the answer in one sentence →
  3–4 numbers → one picture (only when real data supports it) → the list as
  cards that open a detail sheet → charts in `ChartCard` → the verification
  section. The first four fit on one phone screen.
- **Devices:** phone and tablet get a top bar and drawer; laptop and PC get
  the sidebar and a 1320 px frame. 44 px touch targets; nothing scrolls
  sideways at 320 px.

## 6. Data honesty rules (binding)

1. **Every dataset shows its own date** ("As of …"). A big number keeps its
   date visible next to it.
2. **Old data says so in words.** When a dataset is older than it should be,
   a calm amber notice under the page title says, for example: "This data is
   160 days old. The newest data we have is from 20 Apr 2026. We could not
   find newer data." Never red, never animated.
3. **No date is not hidden.** Undated data says "Date not published by the
   source."
4. **One verification section at the bottom of every page** (`#verify`):
   how fresh each dataset is (source, data date, when we last checked, on
   time or late), how we know (automatic feed / entered by hand / from news /
   estimate), whether a second source agreed ("Double-checked", "One source
   only", "Sources disagree", "Not double-checked yet"), a direct "check it
   yourself" link and the "not a government website" line — once. Mistakes
   are reported with the floating "Report a problem" button, which knows
   the district and module.
5. **Never fabricate.** When a source fails, write nothing and show the empty
   state. No invented, interpolated or padded numbers; no fake zeros.
   Estimates are always labelled as estimates.
6. **Nothing says "Live"** unless the data is less than 30 minutes old.
   Cadence copy ("updated every …") only where a scheduled job really does it.
7. **AI text is labelled and dated,** and hidden when it is older than 30 days
   or older than the data on the page.
8. **One source for every citizen-visible count** (districts, modules,
   supporters): `getTotalActiveDistrictCount()`, `src/lib/platform-facts.ts`,
   the database. Never type a count into copy.
9. **Maps paint only what is live** — a live district, not its whole state.
10. **News:** headline, short summary and link only; never the full article.
    Leaders, police and power-cut rows guessed from headlines go to the admin
    review queue, not to the page.

Freshness rules per dataset live in the module registry (`MODULE_FRESHNESS`
in `sidebar-modules.ts`) and `src/lib/freshness.ts`; the numbers come from
`/api/data/freshness`.

## 7. Where the data comes from

**Sources:** government portals (data.gov.in / AGMARKNET, Census, the JJM
dashboard (eJalShakti), UDISE+, the NREGA "At a glance" pages, PFMS /
eGramSwaraj, PMAY, ECI and state election commissions, eCourts / NJDG
(National Judicial Data Grid), NDMA SACHET alerts, PIB, MoSPI, RBI, NCRB, IMD,
state water and power portals, state e-procurement (GePNIC) portals)
**and other reputed sources**: research institutions (IIPS / NFHS, NITI Aayog
MPI, SHRUG, CEDA's AGMARKNET mirror for price checks), international bodies
for national comparisons (UN, IMF, UNESCO and similar), OpenWeatherMap,
Open-Meteo (forecast and weather fallback, CC BY 4.0 credit on the page),
IBJA, Yahoo Finance, Wikipedia and Wikidata (only to double-check who holds
a post), DataMeet boundaries, and news outlets for headlines only. Per-source
notes: `docs/DATA-SOURCES.md`.

**How rows get in:**

| Method | What | Where |
|---|---|---|
| Automatic feed | a Vercel cron fetches a source and upserts rows | `src/app/api/cron/*` → `src/scraper/jobs/*` |
| Entered by hand | researched rows with their source, seeded by the owner | `prisma/seed-*.ts`, admin Content Editor |
| From news | AI reads headlines; high confidence (> 0.85) updates, 0.60–0.85 goes to review, < 0.60 is skipped; leaders, police and power always go to review | `src/lib/news-action-engine.ts`, admin review |
| Estimate | only when the source row says so, and always labelled | — |

**Double-check.** Once a day `verify-data` compares stored values with a
second source (weather with another weather service, crop prices with CEDA,
dam levels with a fresh read of the portal, the Chief Minister, Deputy CM,
Governor / Lieutenant Governor, Prime Minister and President with Wikipedia
and Wikidata). It writes the result to `DataVerification`, sends
disagreements to the admin review queue and never changes the data itself.
Details: `docs/VERIFICATION.md`.

**Scheduled jobs.** `vercel.json` is the only schedule; times are UTC
(IST = UTC + 5:30). Budgets, what each writes and how to run one by hand:
`docs/RUNBOOKS/crons.md`.

| Path | Schedule (UTC) | What it does |
|---|---|---|
| `/api/cron/scrape-news` | `10 */4 * * *` | news per district (equal AI share each, max 20 AI calls), dedupe, expire alerts older than 14 days |
| `/api/cron/translate-content` | `20 */3 * * *` | translate new live text once (section 9) |
| `/api/cron/scrape-crops` | `30 3 * * *` | mandi prices (AGMARKNET via data.gov.in) |
| `/api/cron/scrape-weather` | `*/30 * * * *` | one weather reading per district (OpenWeather, Open-Meteo fallback) |
| `/api/cron/scrape-dams` | `0 */6 * * *` | reservoir levels (Karnataka water portal) |
| `/api/cron/scrape-alerts` | `*/30 * * * *` | official disaster alerts (NDMA SACHET) |
| `/api/cron/generate-insights` | `0 0,12 * * *` | AI module insights, only when data changed; infra analyses |
| `/api/cron/news-intelligence` | `0 */4 * * *` | AI classification and extraction of fresh news |
| `/api/cron/scrape-budget` | `0 6 * * 1` | returns "skipped" until a real dataset exists |
| `/api/cron/generate-citizen-tips` | `0 6 * * 0` | AI tips per district into Redis |
| `/api/cron/update-exams` | `30 6 * * *` | official UPSC / SSC exam pages; moves exam status forward by date |
| `/api/cron/platform-report` | `0 0 * * 0` | weekly platform report |
| `/api/cron/health-score` | `30 1 * * *` | recompute every district's report card (grades expire after 7 days) |
| `/api/cron/verify-data` | `45 6 * * *` | the daily double-check (above) |
| `/api/cron/scrape-courts` | `40 1,13 * * *` | court cases waiting, their age, filed and decided per year (NJDG) |
| `/api/cron/scrape-jjm` | `15 4 * * *` | rural homes with a tap (JJM dashboard) |
| `/api/cron/scrape-schools` | `40 4 * * 2` | district school statistics (UDISE+) |
| `/api/cron/scrape-mgnrega` | `50 4 * * *` | MGNREGA "At a glance" per rural district |
| `/api/cron/scrape-tenders` | `15 */2 * * *` | active tenders of followed district bodies (state e-procurement portals) |

**Reality check (28 Sep 2026).** Production (`38df958`) has only 7 of these
crons, and its AI chain has failed since 22 Aug 2026 (the free models it
called were withdrawn). Weather, dams, crops and AI insights on live pages
are months old. The branch fixes cron auth and the AI chain, and adds the
weather, dam, alert, report-card, double-check, courts, JJM, schools,
MGNREGA and tender crons, but none of it is deployed. The v5.1 collectors
passed dry runs against the live portals on 27 Sep and have never written to
production. Only weather, crops, news and alerts have ever filled rows
automatically; most modules are curated by hand with sources. The old jobs
in `src/scraper/jobs/` (police, housing, power, RTI, and the old schools,
MGNREGA, JJM and courts jobs) ran only on the retired Railway worker and
never produced a row; `src/scraper/scheduler.ts` is a local runner, not part
of production. The honesty rules in section 6 exist because of this: say how
old the data is rather than pretend.

## 8. AI

- Every call goes through `callAI()` / `callAIJSON()` in
  `src/lib/ai-provider.ts`, by purpose. The chains are in
  `src/lib/ai-models.ts`, the only place model ids are written
  (`docs/RUNBOOKS/ai-models.md` for changing them). As chosen on 27 Sep 2026
  from a test on 28 real headlines:
  - `news-analysis` (after a keyword classifier): Jev Router (free while it
    routes to a free model), then free Gemma, then OpenRouter's free router,
    then GPT-5.6 Luna as a paid backstop in the last slot. The backstop runs
    only with `AI_PAID_FALLBACK=1`, which is set in Vercel.
  - `insight` (only after `hasDataChanged()`): GPT-5.6 Luna, then Gemini 3.1
    Flash-Lite, then the free chain.
  - `fact-check` (manual, admin only): Claude Sonnet 5, then Claude Haiku 4.5;
    never a free model.
- **Zero-credit rule:** a page request never calls a model. Pages and public
  APIs read stored results.
- Every call is logged (`AIUsageLog`) so the admin Costs tab shows real spend.
- The admin "fact checker" is a plausibility review, not verification; it is
  never shown to citizens as proof.

## 9. Languages

Full guide: `docs/I18N.md`.

- **English is always the default** (`localeDetection: false`, no locale
  cookie). **Hindi and Kannada are beta** (machine drafts awaiting native
  review). The registry `src/i18n/languages.ts` lists English plus the 22
  scheduled languages; the rest show as locked "planned" entries and redirect
  to English.
- **Language menu order is a rule, not a list:** the default language first,
  then the rest by English name (today English, हिन्दी, ಕನ್ನಡ), then one
  locked line, "20 more Indian languages coming", that opens the locked list
  in the same order. The number is counted from the registry.
- **Nothing citizen-facing is hard-coded.** Shared strings live in
  `src/dictionaries/<locale>.json`; each page has its own
  `src/dictionaries/<locale>/page_<name>.json`, indexed by
  `scripts/gen-i18n-namespaces.mjs`. Every new string ships in en + hi + kn.
- **Place names:** `names.<locale>` in the district registry, then the
  local-script name, then English (`src/i18n/place-name.ts`).
- **Live text** (news, AI insights) is translated **once** in the backend by
  a provider (Bhashini, Google or Sarvam, picked by env key), stored in
  `ContentTranslation`, and only read afterwards (`src/lib/translation/`).
  Switching language never calls a provider. It is off until the owner runs
  `npm run db:push` and adds one provider key.

## 10. How it is built

Full picture: `docs/ARCHITECTURE.md`.

- **Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4,
  next-intl, Prisma 7 on Neon PostgreSQL, Upstash Redis (REST only), recharts,
  react-simple-maps, React Query, Razorpay, Resend, Sentry, Plausible. Fonts
  are self-hosted (`src/fonts`, `next/font/local`). Node 24.
- **Hosting:** Vercel, Mumbai region (`bom1`). Deploy = `git push origin main`
  (owner only). The build runs `prisma generate && next build` and never
  touches the database. Schema changes: edit `prisma/schema.prisma`, run
  `npm run db:push` against prod, then push the code.
- **Routing:** `src/proxy.ts` (Next 16's middleware) runs next-intl; every
  public page is under `src/app/[locale]/`.
- **Reads:** `src/app/api/data/[module]/route.ts` plus small read-only routes
  (freshness, verification, forecast, court-pendency, glance,
  election-events, leader-news, …) return `{ data, updatedAt, source }`-style
  payloads, cached briefly in Redis; `?locale=` swaps in stored
  translations.
- **Writes:** only crons, the admin console, payment webhooks and the public
  forms (votes, feedback, suggestions), all rate-limited.

## 11. Money and supporters

- The site is free and ad-free, funded by citizens. Razorpay, domestic only —
  **no foreign money** (FCRA).
- Tiers (`src/lib/constants/razorpay-plans.ts` holds names and amounts): a
  one-time gift of any amount, District Champion, State Champion, All-India
  Patron and Founding Builder (monthly). Supporters are shown on the
  district, state or all-India pages their tier covers, and the Founding
  Builder first.
- Public name (with an optional social link) or anonymous. Names are
  validated; phone numbers, e-mails and promotions are anonymised. (Gap,
  Sept 2026: the support pages hide phone-number names on screen, but
  `/api/data/contributors` still sends them; see `docs/ARCHITECTURE.md` §5.)
- The support page is simple: an answer line, the tiers, "how to subscribe",
  then the supporters. Supporters always sit after the data. "Cancel
  anytime." No binding promises and no pressure.
- v5.1: each plan has its own pastel colour and drawn picture (one-time rose,
  District blue, State teal, All-India violet, Founding Builder gold), and
  paying opens a popup (`DetailSheet`: right panel on laptops, bottom sheet on
  tablets, full screen on phones). The payment API and Razorpay options are
  unchanged. The supporters wall uses the same plan colours.

## 12. Admin and security

- Admin console at `/[locale]/admin`: dashboard, content editor, update log,
  news review queue, AI settings and costs, system health, support page,
  site announcement, supporters, feedback and suggestions, traffic, API key
  vault and more (`src/components/admin/AdminSidebar.tsx`). There is no
  screen yet for `NewsActionQueue`, so the double-check's review items
  (`verify-leaders`) and pending news actions can only be read in the
  database.
- Login = password + TOTP. Sessions are signed, expiring and revocable in
  Redis (`src/lib/admin-auth.ts`); `requireAdmin()` guards every admin route,
  page and action. The key vault needs a second, shorter TOTP session.
- Crons authenticate with `Authorization: Bearer <CRON_SECRET>` and take a
  Redis lock. Public forms are rate-limited by a salted IP hash; raw IPs are
  never stored. Secrets are names-only in git (`.env.example`).
- Privacy: cookieless analytics (Plausible), DPDP policy at `/privacy`, no
  citizen accounts, no Aadhaar/PAN, supporter records anonymised at the API.
- No government emblems or seals anywhere. The site states once per page that
  it is not a government website.

## 13. Districts and growth

- The district registry `src/lib/constants/districts.ts` (the `active` flag)
  decides what is live; `getTotalActiveDistrictCount()` is the only count.
  On 27 Sep 2026: 10 districts in 7 states (Mandya, Mysuru, Bengaluru Urban,
  Hyderabad, Chennai, Mumbai, Pune, Lucknow, Kolkata, New Delhi).
- Growth is **one district at a time, planned and demand-led**: a full,
  sourced seed first, then the flag. Everything else about a district (APIs,
  crons, cards, sitemap) follows the flag. Every other district is browsable
  as a locked preview where people can vote for it. How-to:
  `docs/DISTRICT-EXPANSION-SKILL.md`, `docs/SCALING-CHECKLIST.md`,
  `docs/INDIAN-DISTRICT-HIERARCHY-SKILL.md`.
- Leaders use a 5-tier hierarchy (national, state, district administration,
  elected representatives, municipal and departments). Never guess an
  officer's name; mark unknowns "verify at <portal>". Famous people must be
  born in the district (`bornInDistrict`).
- Leader corrections are scripted, never typed live: `scripts/fix-leaders-2026-09.ts`
  (dry run by default, `--confirm` applies it in one transaction) with the
  evidence in `docs/LEADERS-VERIFIED-2026-09.md`. Every change has two
  sources from different outlets; a new person gets a new row and the old
  row is deactivated, never deleted.

## 14. Maps

- react-simple-maps only (hand-written D3 and Leaflet were tried and
  dropped). Components: `map/DrillDownMap` (India), `map/GenericStateMap`,
  `map/TalukMap`, `district/DistrictLocator`; colours only from
  `map/mapTheme.tsx`.
- Files: `public/geo/<state>-districts.json`, `india-states.json`,
  `<district-slug>-taluks.json`. Outer rings must be clockwise for d3-geo:
  run `npm run geo:rewind` (`--check` in CI) after replacing a file and bump
  `GEO_VERSION` in `src/lib/geo/aliases.ts` for district files. Map names are
  matched to page names in `aliases.ts`.
- Remove zero-area rings (an inside-out ring paints the whole frame). Check
  every state in the browser before merging a map change. Taluk shapes are
  labelled approximate.

## 15. Engineering rules

The short list is in `CLAUDE.md`; these are the ones that bite most often.

- Money is stored in whole rupees, never crores; format at render.
- `@upstash/redis` only (no ioredis); `src/proxy.ts`, never `middleware.ts`.
- `take: N` on `findMany` over big tables (news, schools, elections).
- `NewsItem` has `title` (not `headline`); `ElectionResult` is one row per
  constituency (the winner).
- recharts `formatter`: take `(v)` and use `Number(v)`; never type it
  `(v: number)`.
- Header and sidebar nav keep `overflow: visible` (hidden clips dropdowns).
- At most one request every 2–3 seconds per source domain; per-call timeouts
  and a time budget in every cron.
- Quality gates before any push: `npm run lint` (0 errors), `npx tsc
  --noEmit`, `npm test`. No `npm audit fix`. Push only when the owner says so.

## 16. Where to find things

| Need | Read |
|---|---|
| Rules for any change | `CLAUDE.md` |
| Structure, routes, data flow, auth | `docs/ARCHITECTURE.md` |
| Colours, type, kit, chrome, pictures, stale notice, verification section | `docs/DESIGN-SYSTEM.md` (v5.1 "Warm Calm") |
| Device layouts, page recipe, DetailSheet | `docs/LAYOUT.md` |
| The 36 modules and their groups | `docs/MODULE-MAP.md` |
| Languages and translation | `docs/I18N.md` |
| Crons, AI models, admin auth operations | `docs/RUNBOOKS/` |
| Sources and provenance | `docs/DATA-SOURCES.md`, `docs/MODULE-POPULATION.md` |
| The daily double-check (verifiers, statuses, reason codes) | `docs/VERIFICATION.md` |
| Who holds each post, checked Sept 2026 (two sources each) | `docs/LEADERS-VERIFIED-2026-09.md` |
| What only the owner can do (accounts, database approvals, decisions) | `docs/OWNER-TODO.md` |
| Adding a district | `docs/DISTRICT-EXPANSION-SKILL.md`, `docs/SCALING-CHECKLIST.md`, `docs/INDIAN-DISTRICT-HIERARCHY-SKILL.md` |
| News AI | `docs/AI-NEWS-INTELLIGENCE-SKILL.md` |
| Tenders | `docs/29-…` to `32-…`, `docs/TENDERS-ACTIVATION.md` |
| India dashboard plans | `docs/india/31-…`, `docs/india/32-…` |
| Legal | `docs/LEGAL-COMPLIANCE.md`, `/privacy`, `/disclaimer` |
| What shipped, when | `CHANGELOG.md` (history: `docs/LIVE-STATE.md`, `docs/BUG-TRACKER.md`) |
| Old documents | `docs/archive/` (history only) |
| Machine-readable summary | `public/llms.txt` |

## 17. Open items and owner decisions (28 Sep 2026)

The owner-only list with exact steps is `docs/OWNER-TODO.md`. The big ones:

- **Deploy:** production is `38df958`; the cron, AI, design and collector
  work on this branch reaches citizens only after review and a push.
- **`npm run db:push` before the push:** it creates `ContentTranslation`
  (translation backend, which also needs one provider key) and
  `DataVerification` (the double-check).
- **Before the JJM cron first runs in production:** delete the 18 seeded
  `JJMStatus` rows, or the tap-water page counts them twice.
- **Leaders:** run `scripts/fix-leaders-2026-09.ts` (dry run, then
  `--confirm`) and clear the Redis caches.
- **Data clean-ups:** news-derived rows and seeded random numbers were
  removed on 27 Sep (numbers in `docs/OWNER-TODO.md` §3). Still waiting for
  approval: seeded court, tap-water, village-council, school and tender rows,
  and the NCRB crime rows that fail a cross-check.
- **To confirm with the owner:** the H1 display font (Bricolage or Plus
  Jakarta only); whether a one-time ₹50,000 gift counts as Founding Builder;
  whether district votes count people or clicks; whether ForThePeople Jobs
  is a separate app; Open-Meteo's non-commercial licence; what "New Delhi"
  covers.
