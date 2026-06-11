# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Status values: **OPEN** ·
**RESOLVED-local** (fixed + verified locally, not yet pushed) · **RESOLVED-prod**
(pushed + verified on production)._

> All five sessions are now **merged into local `main`** (not pushed). Each finding
> below is **RESOLVED-local**.

---

## CRITICAL

### SEC-1 — Admin auth bypass via static cookie `ftp_admin_v1="ok"`
- **Status:** ✅ RESOLVED-local — 2026-06-11 (Session 1)
- **Finding:** The admin cookie was the literal string `"ok"`, checked `=== "ok"` across
  ~78 routes/pages. Cookie name + value are public in this open-source repo → anyone could
  forge it for full admin access.
- **Fix:** New `src/lib/admin-auth.ts` — signed, expiring, server-revocable sessions
  (32-byte id in Upstash Redis `admin:session:<id>`, 8h TTL; HMAC-signed cookie token
  `<id>.<expiryMs>.<hmac>`). `requireAdmin()` is the single gate (HMAC + expiry + Redis
  existence), hybrid with a timing-safe `x-admin-secret`/`x-admin-password`/`Bearer
  SEED_SECRET` header for ops tooling. ~78 routes/pages migrated; login/TOTP mint sessions
  via `createAdminSession()`, logout via `destroyAdminSession()`. Vault TOTP layer untouched.
- **New env var:** `ADMIN_SESSION_SECRET` (`openssl rand -hex 32`) — module throws at load
  if unset (no fallback). ⚠️ Set in Vercel env **and** CI build env BEFORE deploying.
- **Verified:** tsc 0; runtime — forged `ftp_admin_v1=ok` → 401, valid signed cookie → 200,
  tamper/expire/revoke → 401, valid header secret → 200.

### SEC-2 — Build runs `prisma db push` on every deploy; Next.js 16.2.4 CVE batch; CI build needs a DB
- **Status:** ✅ RESOLVED-local — 2026-06-11 (Session 2)
- **Finding:** Build ran `prisma db push` against prod Neon on every deploy (incl. dependabot
  previews) — risk of mutating prod schema; root cause of red CI/preview errors. Live Next.js
  16.2.4 exposed to the 7 May 2026 security release (13 advisories, patched in 16.2.6).
- **Fix:** Dropped `db push` from `vercel.json` + the `package.json` build script (now
  `prisma generate && next build`); schema changes are now manual via `npm run db:push`
  before pushing dependent code. Bumped Next → **16.2.6**. Added a dummy `ADMIN_SESSION_SECRET`
  to the CI build env (for SEC-1) and a `.github/dependabot.yml`. Added an **ephemeral
  `postgres:16` service + `prisma db push`** to the CI build job so `next build` (which
  statically generates DB-backed pages) has a reachable throwaway DB — never prod.
- **Verified:** clean `npm ci`; tsc 0; `next build` runs no db push (174 pages); CI build
  verified green by local replication (throwaway Postgres → db push → build → exit 0).

---

## HIGH

### DATA-1 — RTI/court scrapers fabricate numbers on portal failure
- **Status:** ✅ RESOLVED-local — 2026-06-11 (Session 3)
- **Finding:** On portal failure, `rti.ts` invented RTI counts with `Math.random()` and
  `courts.ts` derived `pending = prev + filed - disposed`, storing both as `"… (estimated)"`
  — a zero-fabrication-rule violation.
- **Fix:** Both failure branches now write NOTHING and return a failed status. Removed the
  orphaned constants. Wired the imported-but-unused `NoDataCard` into the empty state on the
  `/rti` + `/courts` pages. New `scripts/purge-estimated-stats.ts` (safe-by-default dry-run;
  `--confirm` to delete) to remove pre-existing fabricated rows. ⚠️ **Run the purge manually
  against prod Neon after deploy** (fabricated `"NJDG (estimated)"` rows confirmed live).
- **Verified:** tsc 0; forced `fetch→503` + both jobs vs throwaway Postgres → 0 rows written;
  `/rti` + `/courts` serve 200, empty → NoDataCard.

### SEC-3 — Public POST endpoints lack rate-limit / validation / DPDP consent
- **Status:** ✅ RESOLVED-local — 2026-06-11 (Session 4)
- **Finding:** `tenders/alerts/subscribe` had no rate-limit / validation and stored emails;
  `suggestions` + the admin-login limiter used in-memory `Map`s that reset per serverless
  invocation (no-op).
- **Fix:** Shared `getClientIp`/`hashIp`/`resetRateLimit` in `rate-limit.ts` (IP-hashed via
  `sha256(ip + VOTE_IP_SALT)`). `suggestions` → Upstash `rateLimit` (3/hr); `feedback` →
  10/hr + subject cap; `tenders/alerts/subscribe` → 5/hr + strict email regex + length caps +
  **DPDP `consent:true` required**; admin login → Upstash (5 / 15 min), reset on success.
- **Verified:** tsc 0; lint clean on touched files; runtime — suggestions 400×3→429,
  feedback 400×10→429, tender-alerts 400×5→429; missing-consent → 400, invalid-email → 400.
- **Follow-up:** consent is enforced at the gate but not persisted (needs a `TenderSavedByUser`
  schema column + manual `db:push`).

---

## MEDIUM / LOW

### HYG-1 — Citizen-facing "scraping" copy, public encryption fallback, `.v` backups, dead deps
- **Status:** ✅ RESOLVED-local — 2026-06-11 (Session 5)
- **Finding + fix:**
  - Citizen-facing "scraping" copy → `TenderLockedState.tsx` "data-collection setup";
    `ModulePage.tsx` "that data source is connected". (Internal code identifiers keep "scraper".)
  - `encryption.ts` no longer falls back to the public constant `"forthepeople-fallback-change-me"`
    — `getEncryptionKey()` throws if neither `ENCRYPTION_SECRET` nor `ADMIN_PASSWORD` is set.
  - Deleted 28 committed `*.vN.tsx` backup snapshots (zero imports; git history preserves them).
  - Removed 3 dead deps (`bullmq`, `ioredis`, `puppeteer`) — zero imports; no `npm audit fix`.
  - Added a `/scrap/i` release-gate grep note to `BLUEPRINT-UNIFIED.md`.
- **Verified:** tsc 0; lint 65 errors (<110); `next build` completes (174 pages); dev smoke
  district + locked-tenders + `/en/india` module → 200.

---

## Post-merge / deploy reminders
- All 5 sessions merged into local `main` — **not pushed**.
- Before pushing: set **`ADMIN_SESSION_SECRET`** in Vercel env (SEC-1).
- After deploy: run `scripts/purge-estimated-stats.ts --confirm` against prod Neon (DATA-1).
- Then the Manual Checklist (secret rotation, Vercel ownership, branch protection, legal/SOP).
