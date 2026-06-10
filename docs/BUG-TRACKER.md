# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Append new findings; update statuses
in place. Status values: **OPEN** · **RESOLVED-local** (fixed + verified locally,
not yet pushed) · **RESOLVED-prod** (pushed + verified on production)._

---

## CRITICAL

### SEC-1 — Admin auth bypass via static cookie `ftp_admin_v1="ok"`
- **Status:** ✅ RESOLVED-local — 2026-06-11 (branch `session-1-admin-auth`, commit pending review)
- **Severity:** CRITICAL
- **Finding:** The admin session cookie was set to the literal string `"ok"` and
  checked with `=== "ok"` across ~78 routes/pages. Both the cookie **name**
  (`ftp_admin_v1`) and **value** (`"ok"`) are public in this open-source repo, so
  anyone could forge the cookie in dev-tools and gain full admin access
  (supporters, finance, the encrypted API-key vault, scraper triggers, audit logs).
- **Fix:** New `src/lib/admin-auth.ts` issues **signed, expiring, server-revocable**
  sessions: a random 32-byte session id stored in Upstash Redis under
  `admin:session:<id>` (8h TTL — delete to revoke), plus a signed cookie token
  `<id>.<expiryMs>.<hmac>` (`hmac = HMAC-SHA256("<id>.<expiryMs>", ADMIN_SESSION_SECRET)`).
  Single source of truth `requireAdmin()` validates HMAC (constant-time) + expiry +
  Redis key existence. **Hybrid:** it also accepts a timing-safe admin secret header
  (`x-admin-secret`/`x-admin-password` == `ADMIN_PASSWORD`, or
  `Authorization: Bearer <SEED_SECRET>`) so the standalone `/admin` tooling pages and
  curl/ops scripts keep working. All ~78 admin routes/pages migrated to `requireAdmin()`;
  the old inline `=== "ok"` checks and per-route secret-header helpers are gone.
  `actions.ts` login/TOTP now mint sessions via `createAdminSession()`; logout calls
  `destroyAdminSession()`. `proxy.ts` IP allowlist is now documented as optional
  defense-in-depth only.
- **New env var:** `ADMIN_SESSION_SECRET` (generate `openssl rand -hex 32`).
  `admin-auth.ts` **throws at module load** if it is unset — there is no fallback.
  ⚠️ **Deploy ordering:** set `ADMIN_SESSION_SECRET` in Vercel env **AND** in CI
  build env **BEFORE** pushing/deploying this branch, or the build/runtime will throw.
- **Verified locally:**
  - `npx tsc --noEmit` → 0 errors. `npm run lint` → 70 errors (all pre-existing,
    under the 110 ceiling; 0 in any migrated file).
  - Runtime (dev server + Upstash): no cookie → 401; **forged `ftp_admin_v1=ok` → 401**;
    valid signed cookie → 200; tampered HMAC → 401; expired token → 401;
    **revoked (Redis key deleted) → 401**; valid `x-admin-secret`/`x-admin-password` → 200;
    wrong secret → 401.
- **Manual confirmation still recommended:** real browser login (password + 2FA/TOTP
  flow) and logout, since the server-action path can't be driven via curl. The TOTP
  verification logic itself was not touched; only the post-verify cookie set now uses
  `createAdminSession()`.
- **Follow-ups (out of scope for SEC-1, noted):**
  - `/api/admin/security/logout-all` currently only clears the *current* browser's
    cookie. With revocable sessions it could now delete all `admin:session:*` keys to
    truly log out everywhere — small enhancement, not done here.
  - `SEED_SECRET` is now a universal admin credential via `requireAdmin()` (was
    scoped to seed-tenders only). Acceptable (strong random secret); tighten later if
    least-privilege is desired.

---

## Pending (later sessions — not yet started)

| ID | Sev | Finding | Target session | Status |
|----|-----|---------|----------------|--------|
| SEC-2 | CRITICAL | Build runs `prisma db push` against prod on every deploy; Next.js 16.2.4 exposed to May-2026 CVE batch | Session 2 | OPEN |
| DATA-1 | HIGH | RTI/court scrapers fabricate numbers (`Math.random()` / derived "estimated") on portal failure | Session 3 | OPEN |
| SEC-3 | HIGH | Public POST endpoints (tender-alerts subscribe, suggestions, feedback) lack real rate-limit/validation/DPDP consent | Session 4 | OPEN |
| HYG-1 | MED/LOW | Citizen-facing "scraping" copy, public encryption fallback secret, 28 committed `.v` backups, 3 dead deps | Session 5 | OPEN |
