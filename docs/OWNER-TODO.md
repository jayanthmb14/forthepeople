# What Jayanth needs to do (as of 27 Sep 2026, branch `redesign-v4`)

Everything below needs your account, your money or your judgement.
Production (`main`) is unchanged; the branch goes to a Vercel preview first.

## 1. Review and ship

1. **Look at the Vercel preview:**
   https://forthepeople-git-redesign-v4-zurvoapps-projects.vercel.app
   (it always shows the latest push of `redesign-v4`; Vercel may ask you to
   log in because previews are protected). It uses the live database. Scheduled jobs
   do not run on previews, only on production.
2. **Ship it** when you are happy: open a pull request from `redesign-v4`
   into `main` and merge it. Production deploys when `main` changes. Run
   `npm run db:push` first if the note says a table is new.
3. **GitHub dependency alerts.** GitHub reports 106 known vulnerabilities in
   `main`'s dependencies (2 critical, 42 high). Never run `npm audit fix`;
   bump the flagged packages one at a time (Dependabot has open pull requests
   for many of them).
4. **Approve one security-header change.** `Permissions-Policy` now allows
   location for our own site (`geolocation=(self)`). Before this, "Use my
   location" could never work.

## 2. Accounts and keys

Done for you on 27 Sep (with your permission):
- Vercel: `AI_PAID_FALLBACK=1` added for all environments.
- Neon: backup branch `backup-2026-09-27-pre-cleanup` (a full copy of the
  database from before the clean-ups below). It never auto-deletes; delete it
  in the Neon console once you are happy with the site.
- Sentry: the site was sending errors to a Sentry project that no longer
  exists, so Sentry showed nothing for months. `NEXT_PUBLIC_SENTRY_DSN` now
  points at `forthepeoplein / javascript-nextjs` (all environments; takes
  effect with the next deploy). Your Sentry organisation slug, needed for the
  Sentry for Open Source form, is `forthepeoplein`
  (https://forthepeoplein.sentry.io).
- OpenRouter: key checked (works; $4.93 credit, $10/month key limit). The AI
  models were re-chosen from a test on 28 real headlines — see
  `docs/RUNBOOKS/ai-models.md`. Jev Router is first (free today).

Still yours:
- **Sarvam (accepted into their Startup Program).** Fill in their onboarding
  form, then in Vercel add `SARVAM_API_KEY` (Production and Preview). With
  the key set and `npm run db:push` done, news and AI insights are
  translated into Hindi and Kannada once and stored. Optional:
  `TRANSLATION_PROVIDER=sarvam` to force it.
- **`VOTE_IP_SALT`** is missing in Vercel. Add any long random string
  (Production and Preview). Votes and rate limits currently use a built-in
  default salt.
- **Vercel says "Needs Attention"** on `DATABASE_URL`, `REDIS_URL`,
  `REDIS_TOKEN`, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`,
  `DATA_GOV_API_KEY`: they are stored as plain config. Rotate them and
  re-add them as "Secret" when convenient.
- **OpenRouter:** watch Activity once a month. Jev Router is free while it
  routes to a preview model; if it starts routing to paid models, the $10
  key limit caps the spend.
- **Stop the old Railway collector** (project "ForthePeople", Pro plan
  $20/month). It still runs the pre-April scheduler every few seconds. Its
  weather job "succeeds", but into an old database — the live database got
  nothing from it — and the rest fail with 502/504. Everything it did runs
  as Vercel crons now. It redeploys whenever `main` changes, and this branch
  removes its Dockerfile. My attempt to change it was blocked by the
  permission system, so please do this before merging into `main`:
  1. Railway → ForthePeople → service `forthepeople` → Deployments → the
     Active deployment → ⋯ → **Remove** (stops it; the service stays).
  2. Service → Settings → Source → **Disconnect** the GitHub repo (no more
     auto-deploys from `main`).
  3. Its variables hold copies of your database URL, admin password and AI
     keys — delete the service once you are sure you don't need it.
  4. `postgres-volume` (500 MB, us-west2) is attached to nothing; it may be
     the pre-April database. Download a copy if you want it, then delete it.
  5. Then downgrade or cancel the Railway Pro plan.
  The database Railway writes weather into (its `DATABASE_URL`) is an old
  one, not the live Neon project — if that old database still has a paid
  plan somewhere, cancel it too.
- **Cloudflare Project Galileo:** moving DNS from Hostinger to Cloudflare is
  your step (registrar login). Plan and day-1 settings are in vault note 33.
  Keep SSL on "Full (strict)" and never cache `/api/cron`, `/api/admin`,
  `/api/payment`.

## 3. Database

Done on 27 Sep (dry run shown first, backup branch above):
- Removed 26 national project copies, 260 crime numbers taken from
  headlines, 25 fake power cuts; hid 162 leaders guessed from news
  (`scripts/cleanup-news-derived-2026-09.ts`).
- Removed 144 seeded rainfall rows, 24 invented traffic-fine rows, 14
  hard-coded exams, 8 hand-entered dam readings; blanked 4 invented
  sugar-arrears figures (`scripts/cleanup-seeded-2026-09.ts`).

Being fixed now by research (official sources, dry-run scripts applied after
review): wrong leaders (incl. Karnataka CM D. K. Shivakumar), project
statuses and duplicates, helplines, the "2021 Census" row, India dashboard
numbers, invented police phone numbers. See `docs/DATA-FIXES-2026-09.md` and
`docs/LEADERS-VERIFIED-2026-09.md` when they land.

Duplicates (28 Sep): the code that made them is fixed (exams stored once per
national/state/district scope, one spelling for election types, project and
news matching) and a nightly duplicate check runs (`dedupe-data`). The
one-time clean-up removed 48 rows: 30 exam copies, 11 non-government exams,
6 election copies, 1 school copy (`scripts/dedupe-2026-09.ts`).

Still yours:
0. **Three small fixes the permission system would not let me make:**
   - Merge the two "Regional Transport Office, Bengaluru East" rows in
     GovOffice (ids `cmmvn6q0u005xmuxnmhtv37nk` keep, `cmmvn6u4b00d5muxnq92lwhpx`
     delete). Neither stored address is right; the office is at Kasturi Nagar
     (CA-15, NGEF East, 560043) per RTO directories — confirm on
     transport.karnataka.gov.in, then set it (or leave it blank).
   - Delete ElectionResult `cmmvn6vjp00immuxn73owqm6n` ("Tejasvi Surya (MLA)",
     Bengaluru South 2023) — invented; he is an MP.
   - Decide "Sarjapur Road International School" vs "Ryan International
     School Sarjapur Road" (may be the same school).
   The whole ElectionResult table needs reloading from results.eci.gov.in
   (seeded rows have placeholder runners-up and wrong margins); results stay
   hidden on the site until then.
1. **Mysuru rainfall 2023–24 ("IMD Mysuru", 24 rows)** were typed by hand in
   `prisma/archive/seed-mysuru-data.ts`; they are hidden on the site. Delete them
   if you agree (they were not in the dry run you approved, so I did not).
2. **Election results are withheld.** The stored rows were seeded, not taken
   from ECI (e.g. the 2024 Mandya winner is wrong). Reload them from
   results.eci.gov.in.
3. **Housekeeping:** clear ~10.8k per-reading weather rows in `UpdateLog`;
   add a retention rule for `ScraperLog` (~150 rows a day); review the
   queued AI change suggestions and AI-written phone numbers.

## 4. Support page (admin panel)

- **Rewrite the founder bio** in the admin Support Page Editor. The stored
  text names Pinnakle Media and says "9 districts … 29 dashboards". The code
  defaults are corrected, but your saved text overrides them.
- **"International supporters … another way to pay" was removed** because of
  your no-foreign-money rule (FCRA). Confirm with your CA.
- **Decide whether a one-time ₹50,000 gift counts as Founding Builder.** It
  is shown that way today.

## 5. Local machine and GitHub (only you can do these)

- **Delete the 13 `.env*` backup copies** that hold production secrets in
  plain text. Keep `.env` and `.env.local`; move anything else you need to
  your password manager first.
- **Move account e-mails out of the public repo.** They appear in
  `docs/archive/41-Session10-Manual-Actions-Required.md` and the archived
  blueprint; move both to your vault.
- **Remove the stray `.vercel/` link** in the parent folder
  (`For The People/`). A `vercel` command run there would deploy the wrong
  folder.
- **Clean up branches:**
  - delete the merged `ui-backup-*`, `backend-backup-*`, `session-*` and
    `v5/*` branches
  - close the old `pr-*` pull requests

## 6. Decisions for you

- **Page titles:** Bricolage, or Plus Jakarta everywhere?
- **Votes:** should they count people or clicks? One person can vote many
  times, so Kanpur's 47,531 is inflated.
- **Petrol and diesel prices:** they were removed because there is no reliable
  daily source. Name a source if you want them back.
- **District search** covers the ~150 districts in the registry. Covering all
  ~780 districts is registry data work.
- **Native-speaker review** of the Hindi and Kannada text before they change
  from "beta" to "live".
- **ForThePeople Connect** appears as a "coming soon" line in the footer.
  Tell me if you want it elsewhere.
- **Jev Router** is now the first AI model for news sorting (free today).
  If you want a different default, say which.

Added 28 Sep, after the v5.1 round 3 merge:

- **Delete the seeded tap-water rows BEFORE the JJM collector first runs
  in production** (it is now in `vercel.json`). The tap-water page adds up
  every row, so the 18 seeded `JJMStatus` rows (round numbers such as
  "Mandya Taluk (aggregate)") would be counted twice next to the real
  totals. After the dry run, with your approval:
  `DELETE FROM "JJMStatus" WHERE source <> 'Jal Jeevan Mission dashboard (ejalshakti.gov.in) — district total, rural homes';`
- **Other seeded rows waiting for your approval** (the pages already hide
  or replace most of them):
  - Courts: 44 hand-seeded `CourtStat` rows (no source, round numbers).
    Delete them after the first court collector run, so the report card
    has real rows to use:
    `DELETE FROM "CourtStat" WHERE source IS NULL OR source NOT LIKE 'NJDG district dashboard%';`
    The courtStat blocks should also come out of `prisma/seed*.ts`.
  - Village councils: 8 seeded `GramPanchayat` rows with round numbers.
    Hide or delete? No open source gives figures per panchayat.
  - Schools: the hand-entered `School` rows. Keep them, or label them as
    entered by hand?
  - Tenders: 12 seeded tenders that closed in May. Delete or hide?
  - Police (Hyderabad): 18 `CrimeStat` rows with source "NCRB Crime in
    India Report (estimated)" and 12 `TrafficCollection` rows with source
    "Estimated from Telangana Traffic Police reports". The page already
    hides them; delete?
- **NCRB crime rows that fail a cross-check.** These "NCRB" `CrimeStat`
  rows do not match published figures:

  | Figure | Database | Published |
  |---|---|---|
  | Bengaluru cyber crime, 2023 | 11,240 | 17,631 |
  | Bengaluru cyber crime, 2022 | 9,870 | 9,940 |
  | Bengaluru crimes against women, 2023 | 5,840 | 3,260 |
  | Hyderabad cyber crime, 2022 | 2,100 (estimated row) | 4,436 |

  Lucknow's rows are suspiciously round (18,500 and 17,200), and NCRB does
  not publish figures for the New Delhi police district. Replace them from
  NCRB's metropolitan-city tables, or remove them.
- **Tender portals:** do the legal / robots check on the Maharashtra, Tamil
  Nadu, West Bengal and Delhi e-procurement portals, and confirm the list
  of bodies we follow (city corporations, Zilla Parishad Pune, BEST, MTC,
  Kolkata Police, NDMC).
- **Open-Meteo licence.** The weather forecast and the weather fallback use
  Open-Meteo's free API. It is for non-commercial use (about 10,000 calls a
  day) with CC BY 4.0 credit, which the weather page shows. Confirm the site
  qualifies, or buy a plan.
- **ForThePeople Jobs as a separate app?** The header's apps menu and the
  footer now show Connect and Jobs as "coming soon" (not links). Today jobs
  live in each district's "Exams & jobs" page. Confirm you want Jobs as its
  own app, or I remove it.
- **What should "New Delhi" cover?** The page lists the New Delhi and
  Kasturba Nagar seats. Kasturba Nagar is inside the New Delhi Lok Sabha
  seat but in the South East Delhi district. Choose: the Lok Sabha seat's
  10 assembly seats, or the revenue district's own seats.
- **Founding Builder label for a one-time gift.** Micah's one-time ₹50,000
  gift is labelled "Founding Builder", which is sold as a monthly plan. The
  new home support band and the supporters wall show the Founding Builder
  first. Same question as in §4: keep the label or change it?
- **Leaders:** run `npx tsx scripts/fix-leaders-2026-09.ts` (dry run), then
  `--confirm`, then clear the caches (admin → Cache). The open questions
  (Delhi Deputy CM title, West Bengal and Tamil Nadu Chief Secretaries,
  vacant posts, news-written leader rows) are in
  `docs/LEADERS-VERIFIED-2026-09.md`.
- **Native-speaker review of the new Hindi and Kannada text** from this
  round. All of it is a draft. Where it is:
  - shared files (`hi.json`, `kn.json`): `header`, `footer2`, `lang`
  - page files (`hi/`, `kn/`): `page_home`, `page_district-shell` (new),
    `page_weather`, `page_courts`, `page_police` (crime-type names),
    `page_support`
  - new leader rows have no Kannada or Hindi names yet.

## 7. After the zero-error audit (28 Sep 2026)

Applied with your approval: 695 verified corrections (updates, hidden values
and deletions) from `scripts/fix-audit-2026-09-*.ts`, each re-checked by a
second agent; backup branch `backup-2026-09-27-pre-cleanup` holds the rows
from before. What this leaves for you:

**Honest empty states you may want filled (only with official sources):**
- Budgets: only Pune shows budget figures; the other 9 districts show "not
  published" (no district publishes sector-wise spending).
- Trains and buses: listings hidden until each is checked.
- Famous people: only people born in the district (New Delhi: none; Chennai:
  A. R. Rahman).
- New Delhi crops: no mandi in the district — say if you want neighbouring
  Delhi mandis shown, clearly labelled.
- Office hours: shown only for Karnataka and Maharashtra (from official
  orders); send the orders for Delhi, Telangana, West Bengal, Tamil Nadu, UP.
- India modules with no data now say "coming soon" (police strength,
  railways and five others).

**Facts that need an official source before they can be shown:**
- The five new Bengaluru corporations' offices and the khata/property-tax
  process; the current BEST GM; Mumbai Port, MMRDA and MHADA officer rows;
  Chennai suburban police stations (Avadi / Tambaram commissionerates).
- Mandya sugar mills missing from the list (Mysore Sugar Co., NSL, Hemagiri,
  Prem, MRN) — only unofficial lists found; KSDL revenue.
- Coconut and tender-coconut price units (hidden until confirmed).
- Local-body elections (Kolkata corporation after Diwali 2026, Chennai ~2027)
  — add only from the state election commission's notice.

**Your confirmation:**
- New Delhi's population on Compare is the Census 2011 figure (1,42,004) for
  the old district boundary, not the DM site's 11,73,902 for today's
  district.
- The support page's "OpenRouter 20%" cost share, and Bengaluru as the
  operator address on the privacy page.
- GST figures have no collector — update monthly by hand, or ask for one.
- Hindi spelling standard: जिला / खर्च (the site's most common forms) vs
  ज़िला / ख़र्च; plus a list of official titles (designations) in Hindi and
  Kannada, and checked Kannada spellings of places outside Karnataka.
