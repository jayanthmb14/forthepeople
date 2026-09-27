# CLAUDE.md — ForThePeople.in Project Instructions

Rules and pointers only. No counts, prices, dates or "current state" here —
those drift. For what the platform looks like today read
`docs/BLUEPRINT-UNIFIED.md` (the overview), `CHANGELOG.md` (what shipped, when)
and `docs/ARCHITECTURE.md` (how it fits together).

## Project
ForThePeople.in — free, open-source citizen transparency platform for Indian
districts. Built by Jayanth M B. Next.js App Router + TypeScript + Tailwind v4 +
Prisma + Neon PostgreSQL + Upstash Redis, hosted on Vercel.

## Read first
1. `docs/BLUEPRINT-UNIFIED.md` — the one-page overview: vision, who it is for,
   modules, design, data honesty rules, crons, languages.
2. `docs/ARCHITECTURE.md` — routes, crons, data flow, auth, AI, where state lives.
3. For any UI work: `docs/DESIGN-SYSTEM.md` (v5 "Calm"), `docs/LAYOUT.md`,
   `docs/MODULE-MAP.md`, `docs/I18N.md`.
4. `CHANGELOG.md` — the top "Unreleased" entry is the live work-in-progress.
5. `.env.example` — the ONLY list of environment variables the code reads.
6. Module-specific docs in `docs/` only when the task touches that module.
   `docs/archive/` is history only — never follow it.

## Database schema changes (CRITICAL)
The build runs `prisma generate && next build` and NEVER mutates the database.
Any schema change must be applied manually against prod Neon BEFORE the code
that depends on it is pushed:
1. Edit `prisma/schema.prisma`.
2. `npm run db:push` against prod Neon.
3. Then commit + push the dependent code.
Prefer existing tables or Redis keys over new columns when a fix allows it.

## AI cost rules (CRITICAL)
- All AI calls go through `callAI()` / `callAIJSON()` in `src/lib/ai-provider.ts`.
- `news-analysis` purpose → free Tier-1 model (currently the `gemma-4` class on
  OpenRouter). Classification is pick-a-category + extract-a-few-fields; the
  free tier handles it.
- `insight` purpose → low-cost flash-lite model. Call `hasDataChanged()` first
  and skip when nothing is new.
- `fact-check` → Claude Sonnet, manual trigger only.
- Paid fallback only when `AI_PAID_FALLBACK=1`. Model IDs (and their known
  expiry dates) live only in `src/lib/ai-models.ts`; never hard-code a model name
  elsewhere — the model list is the one thing that changes often.
- News pipeline: keyword classifier first; call AI only when the keyword pass
  returns "news"/null or the article lands in an actionable module.

## Key rules
- NEVER use "scraper/scraping/scraped" in citizen-facing text.
- NEVER hardcode district data or counts — use the DB and
  `getTotalActiveDistrictCount()` from `src/lib/constants/districts.ts`.
- NEVER store budget values in crores — always whole rupees.
- NEVER fabricate data when a source fails: write nothing, show the empty state.
- NEVER use ioredis on Vercel — `@upstash/redis` (REST) only.
- NEVER use middleware.ts — Next.js 16 uses `src/proxy.ts`.
- NEVER deploy with `npx vercel --prod` — deploys happen via `git push origin main`.
- NEVER run `npm audit fix`. Bump versions deliberately, one at a time.
- NEVER commit `.env.local` or any real secret; never print secret values.
- NEVER hard-code citizen-facing text — every new string ships in en + hi + kn
  (`src/dictionaries/<locale>/page_<name>.json`, then `node scripts/gen-i18n-namespaces.mjs`).
- Emoji only as module identity (sidebar item, module chip, overview tile); tokens
  and hue variables only, no hex in components (`docs/DESIGN-SYSTEM.md`).
- Every dataset shows its own date; old data says how old in words; undated data
  says "date not published by the source". Sources are "government portals and
  other reputed sources" — never claim "official only".
- Never add a famous personality unless they were born in that district (`bornInDistrict`).
- `NewsItem` has `title` (not `headline`); `ElectionResult` is one row per constituency (the winner).
- Add `take: N` to `findMany` on high-cardinality tables (schools, elections, news).
- recharts Tooltip `formatter`: take `(v)` and cast with `Number(v)`; never type it `(v: number)`.
- Header/sidebar nav keeps `overflow: visible` (hidden clips the dropdowns).
- No government emblems or seals; news is headline + summary + link only; at most
  one request every 2–3 s per source domain.
- Admin auth: signed, expiring, Redis-revocable sessions in `src/lib/admin-auth.ts`;
  `requireAdmin()` is the single gate for every admin route, page and action.
- Cron auth: `Authorization: Bearer <CRON_SECRET>` (what Vercel Cron sends).

## Quality gates (all must pass before a push)
- `npm run lint` → 0 errors (React-Compiler rules are warnings; burn them down).
- `npx tsc --noEmit` → 0 errors.
- `npm test` → vitest, pure helpers only, no DB.
- `npm run build` needs a reachable DB (CI uses a throwaway Postgres).

## After every task
1. Add a dated line to `CHANGELOG.md` (Unreleased section until pushed).
2. Update `docs/ARCHITECTURE.md` only if structure changed (not for data edits).
3. Keep `.env.example` in sync with any new `process.env.*` read.
4. Commit with a conventional message. Push only when the owner says so.

## Where things are
- `docs/BLUEPRINT-UNIFIED.md` — overview (section 16 is the full doc index).
- `docs/ARCHITECTURE.md` — structure. `docs/RUNBOOKS/` — crons, AI models, admin auth.
- `docs/DESIGN-SYSTEM.md`, `docs/LAYOUT.md`, `docs/MODULE-MAP.md`, `docs/I18N.md` — UI and text.
- `docs/DISTRICT-EXPANSION-SKILL.md`, `docs/AI-NEWS-INTELLIGENCE-SKILL.md`,
  `docs/INDIAN-DISTRICT-HIERARCHY-SKILL.md`, `docs/SCALING-CHECKLIST.md` — task guides.
- `docs/BUG-TRACKER.md`, `docs/LIVE-STATE.md` — history. `docs/archive/` — frozen
  documents (the March–June blueprint, old skills, completed prompts); do not follow.
- `scripts/` — reusable ops scripts; `scripts/archive/` — provenance only, never run.
- Private vault (owner only): accounts, grants, cost ledger, runbooks with secret NAMES only.
