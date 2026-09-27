# What Jayanth needs to do (as of 27 Sep 2026, branch `redesign-v4`)

Everything below needs your account, your money or your judgement.
Production (`main`) is unchanged; the branch goes to a Vercel preview first.

## 1. Review and ship

1. **Look at the Vercel preview.** The branch `redesign-v4` is pushed to
   GitHub, so Vercel builds a preview link (the link is in the final note and
   under Deployments in Vercel). It uses the live database. Scheduled jobs
   do not run on previews, only on production.
2. **Ship it** when you are happy: open a pull request from `redesign-v4`
   into `main` and merge it. Production deploys when `main` changes. Run
   `npm run db:push` first if the note says a table is new.
3. **Approve one security-header change.** `Permissions-Policy` now allows
   location for our own site (`geolocation=(self)`). Before this, "Use my
   location" could never work.

## 2. Accounts and keys

Done for you on 27 Sep (with your permission):
- Vercel: `AI_PAID_FALLBACK=1` added for all environments.
- Neon: backup branch `backup-2026-09-27-pre-cleanup` (a full copy of the
  database from before the clean-ups below). It never auto-deletes; delete it
  in the Neon console once you are happy with the site.
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
- **Railway is still running the old collector container** (project
  "ForthePeople", Pro plan: $20/month). Its logs on 27 Sep show it calling
  data.gov.in and others every few seconds, getting 502/504 errors and saving
  nothing. Everything it did moved to Vercel crons in April. It also
  redeploys whenever `main` changes, and this branch removes its Dockerfiles.
  **Stop or remove that service before merging this branch into `main`**, then
  decide whether to keep the Railway plan (the `postgres-volume` there may be
  the pre-April database; download a copy first if you want to keep it).
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

Still yours:
1. **Mysuru rainfall 2023–24 ("IMD Mysuru", 24 rows)** were typed by hand in
   `prisma/seed-mysuru-data.ts`; they are hidden on the site. Delete them
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
