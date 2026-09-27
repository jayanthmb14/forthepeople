# What Jayanth needs to do (as of 27 Sep 2026, branch `redesign-v4`)

Everything below needs your account, your money, your judgement or a
database write. Nothing on this branch has been pushed or deployed.

## 1. Review and ship

1. **Look at it locally.** The production build runs with:

   ```bash
   npm run build && npm run start -- -p 3000
   ```

   Then open http://localhost:3000. For each language use `/en`, `/hi` or
   `/kn`. Check it on your phone, tablet, laptop and PC.
2. **Push the branch** and open a pull request into `main`. The site deploys
   when `main` changes. Nothing is live until then.
3. **Approve one security-header change.** `Permissions-Policy` now allows
   location for our own site (`geolocation=(self)`). Before this, "Use my
   location" could never work.

## 2. Accounts and keys (Vercel environment variables, names only)

- **`AI_PAID_FALLBACK=1`.** This allows the cheap paid backstop model when
  the free ones fail.
- **Top up OpenRouter.** About $4.93 of credit is left, and the cap is
  $10 a month. AI has been down in production since 22 Aug because every
  model it called was retired. The fixed model list is in
  `src/lib/ai-models.ts`.
- **Optional: a translation key**, so news and AI insights appear in Hindi
  and Kannada. Set one of:
  - `BHASHINI_USER_ID` + `BHASHINI_API_KEY`
  - `GOOGLE_TRANSLATE_API_KEY`
  - `SARVAM_API_KEY`
- **Neon.** Run `npx neon@latest login` once. After that, work can use a
  copy (a Neon branch) of the database instead of production.

## 3. Database (you run these, with production credentials)

1. `npm run db:push` creates the `ContentTranslation` table (translation
   backend).
2. `npx tsx scripts/cleanup-news-derived-2026-09.ts` shows what it would
   remove (a dry run). If the list looks right, re-run it with `--confirm`.
   It removes:
   - national project copies
   - crime numbers taken from headlines
   - fake outages
   - leaders guessed from news
3. **Rows the site now hides because they were invented.** Delete them when
   convenient:
   - seeded random rainfall (Mandya, Bengaluru Urban, New Delhi, 2020–24)
   - traffic fines with fractional rupees
   - sugar arrears with fractional rupees
   - about 14 hard-coded exam rows
   - hand-entered March dam readings (including the Mysuru row dated 2025)
4. **Election results are withheld.** The stored rows were seeded, not taken
   from ECI; for example, the 2024 Mandya winner is wrong. Reload them from
   results.eci.gov.in.
5. **Fix wrong records:**
   - **Leaders:**
     - placeholder names ("[Verify at mandya.nic.in]", "Unnamed Collector",
       "[Name Not Available]")
     - Hyderabad has only 1 district officer and no Chief Minister
   - **Infrastructure:**
     - **Not projects:** "Donald Trump Avenue Renaming" (now hidden) and
       "Western Railway Maintenance Block".
     - **Wrong status:** Delhi's New Parliament and G20 show as proposed (both
       finished in 2023), and Hyderabad Metro shows as "under construction".
     - **Duplicates:** Metro Phase II vs Phase 2, Atal Setu vs Sewri–Nhava
       Sheva, Delhi AIIMS and Metro Phase 4, Kolkata Joka.
     - **Budget clashes:** Pharma City and SRDP.
     - **Taluk missing:** only 49 of 420 projects have one.
   - **Population:** Mandya has a "2021 Census" row, but no census was held
     in 2021.
   - **India dashboard:**
     - foodgrain output shows 12.7 million tonnes, which is impossible
     - the seed dates show "as of 1 May"
   - **Helplines:**
     - Women Helpline is shown as 1091; the national number is 181
     - 1064 and 1073 are not national numbers
   - **Mysuru police phone numbers** follow a pattern
     (…3344, …3355, …3366) and look invented.
   - **Offices:** most have no stored hours, so "open now" is a guess.
6. **Housekeeping:**
   - Clear about 10.8k per-reading weather rows in `UpdateLog`.
   - Add a retention rule for `ScraperLog` (about 150 rows a day).
   - Review the 999 AI change suggestions waiting in the queue, and the
     phone numbers the AI wrote.

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
- **Optional: Jev AI** (TypeSafe's typed-decision model) could make news
  sorting cheaper. It needs a Jev account key. It does not reduce Claude's
  own tokens.
