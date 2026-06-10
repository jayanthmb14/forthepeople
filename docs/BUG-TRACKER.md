# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Status values: **OPEN** ·
**RESOLVED-local** (fixed + verified locally, not yet pushed) · **RESOLVED-prod**
(pushed + verified on production)._

> **Merge note:** this copy was created on branch `session-2-build-cve` (off main).
> Branch `session-1-admin-auth` creates its own copy with the **SEC-1** entry. When
> both land, union the two files (keep SEC-1 from session-1 + SEC-2 here). Merge
> session-1 first, then rebase session-2.

---

## CRITICAL

### SEC-1 — Admin auth bypass via static cookie `ftp_admin_v1="ok"`
- **Status:** ✅ RESOLVED-local on branch `session-1-admin-auth` (not in this branch).
  Full entry lives in that branch's `docs/BUG-TRACKER.md`. Summary: replaced the
  forgeable static cookie with signed, expiring, server-revocable sessions
  (`src/lib/admin-auth.ts`, `requireAdmin()`), new env var `ADMIN_SESSION_SECRET`.

### SEC-2 — Build runs `prisma db push` on every deploy + Next.js 16.2.4 exposed to May-2026 CVE batch
- **Status:** ✅ RESOLVED-local — 2026-06-11 (branch `session-2-build-cve`, commit pending review)
- **Severity:** CRITICAL
- **Finding (two coupled problems):**
  1. The build ran `npx prisma generate && npx prisma db push && next build` on
     **every** deploy — including unreviewed dependabot PR previews — against the
     **production** Neon schema. An unreviewed branch could mutate/drop prod columns;
     also the root cause of the red CI and ERROR preview builds (db push fails against
     the CI dummy `DATABASE_URL`).
  2. Live Next.js was **16.2.4**, exposed to the 7 May 2026 security release (13
     advisories; patched only in **16.2.6**). Vercel shipped no WAF coverage for this
     batch, so upgrading is the only mitigation.
- **Fix:**
  - Removed `prisma db push` from `vercel.json` `buildCommand` and the `package.json`
    `"build"` script → both now `prisma generate && next build`. The build never
    touches the DB. The `db:push` npm script (already present) is the deliberate,
    manual path. **New workflow:** apply schema changes via `npm run db:push` against
    prod Neon BEFORE pushing dependent code (documented in `CLAUDE.md` +
    `BLUEPRINT-UNIFIED.md` + `SCALING-CHECKLIST.md`).
  - Patched Next.js → **16.2.6** (`package.json` `^16.2.6`; lockfile + node_modules
    both resolved to 16.2.6, verified). Did **not** run `npm audit fix`.
  - `.github/workflows/ci.yml` Build step: added a dummy non-empty
    `ADMIN_SESSION_SECRET` (so CI builds once Session 1's `admin-auth.ts` merges).
  - New `.github/dependabot.yml` — groups minor+patch npm (and github-actions)
    updates into a single weekly PR.
- **Verified locally:**
  - Lockfile + `node_modules/next/package.json` both = 16.2.6.
  - `rm -rf node_modules && npm ci --legacy-peer-deps` → clean (no ghost/lockfile errors).
  - `npx tsc --noEmit` → 0 errors.
  - `npm run build` → exit 0; grep-confirmed **no `prisma db push`** ran; 174 static pages.
  - Dev smoke (16.2.6): `/en`, `/en/karnataka/mandya`, `/en/india` → 200; `/about`,
    `/disclaimer` → 307 locale-redirect → 200.
- **Deploy ordering:** combined with Session 1, set `ADMIN_SESSION_SECRET` in Vercel
  env BEFORE the push, or the prod build throws at module load.

---

## Pending (later sessions — not yet started)

| ID | Sev | Finding | Target session | Status |
|----|-----|---------|----------------|--------|
| DATA-1 | HIGH | RTI/court scrapers fabricate numbers (`Math.random()` / derived "estimated") on portal failure | Session 3 | OPEN |
| SEC-3 | HIGH | Public POST endpoints (tender-alerts subscribe, suggestions, feedback) lack real rate-limit/validation/DPDP consent | Session 4 | OPEN |
| HYG-1 | MED/LOW | Citizen-facing "scraping" copy, public encryption fallback secret, 28 committed `.v` backups, 3 dead deps | Session 5 | OPEN |
