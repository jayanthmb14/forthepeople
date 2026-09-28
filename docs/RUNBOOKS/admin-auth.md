# Runbook — Admin authentication, 2FA, limits and lockout

_Last updated: 2026-09-27. Code: `src/lib/admin-auth.ts`, `src/lib/totp.ts`, `src/lib/rate-limit.ts`, `src/app/[locale]/admin/actions.ts`._

This is the operator's view of how the single admin account logs in, what
throttles protect it, and what to do when something goes wrong. No secret
values appear in this document — only variable NAMES.

---

## 1. The login flow (what happens when you press "Login")

```
 browser                     server (Vercel)                     Upstash Redis
 ───────                     ───────────────                     ─────────────
 password ─────────────────► loginAction
                             ├─ is login locked?  ───────────── admin:login-lock ?
                             ├─ per-IP limiter (5 / 15 min) ─── rate:admin-login:<ipHash>
                             ├─ safeEqual(password, ADMIN_PASSWORD)   ← constant time
                             └─ 2FA enabled?
                                 yes ► mint PENDING token ───── admin:totp-pending:<nonce>
                                       (5 min, bound to ipHash)          = { ipHash }
 ◄── cookies: admin_totp_token = <nonce>.<expiryMs>.<hmac>
              admin_totp_pending = "ok"   (UI hint only, no authority)

 6-digit code ─────────────► totpAction
                             ├─ verify token: signature + expiry (pure)
                             ├─ nonce still in Redis? same ipHash? ─ admin:totp-pending:<nonce>
                             ├─ is login locked?
                             ├─ per-IP limiter (5 / 15 min) ─── rate:admin-totp:<ipHash>
                             ├─ global limiter (30 / 15 min) ── rate:admin-totp:global
                             ├─ verifyTOTP / verifyBackupCode
                             └─ success ► consume nonce (DEL), mint SESSION
                                                                  admin:session:<id> (8 h)
 ◄── cookie: ftp_admin_v1 = <sessionId>.<expiryMs>.<hmac>
```

Key facts:

| Thing | Value |
|---|---|
| Session cookie | `ftp_admin_v1`, httpOnly, secure, SameSite=strict, 8 h |
| Session record | Redis `admin:session:<id>` — delete it and that browser is logged out instantly |
| Signature | HMAC-SHA256 with `ADMIN_SESSION_SECRET` (server throws at boot if unset) |
| Pending token cookie | `admin_totp_token` — signed, 5 min, Redis-backed, bound to hashed IP, single use |
| `admin_totp_pending=ok` | **Only** tells the layout to show the code form. `totpAction` never reads it. |
| Password compare | `safeEqual()` (timing-safe). Login is refused if `ADMIN_PASSWORD` is unset. |
| Backup codes | 8 codes, `XXXX-XXXX`, generated with `crypto.randomInt`, one-time use |
| TOTP window | ±1 step (30 s) — same as before |

Why the pending token matters: the old cookie was the literal string `ok`, so
anyone could type it into dev-tools and reach the 6-digit prompt without ever
knowing the password. Now the token has to be signed by the server, be less
than 5 minutes old, still exist in Redis, and come from the same network.

---

## 2. Limits and lockout

All auth limiters are in Upstash Redis and **fail closed**: if Redis is down,
nobody can log in. That is intentional — a cache outage must never open the
door to the API-key vault or donor data.

| Limiter | Key | Limit | Window | Behaviour when hit |
|---|---|---|---|---|
| Password attempts per IP | `rate:admin-login:<ipHash>` | 5 | 15 min | `/admin?error=rate` |
| Code attempts per IP | `rate:admin-totp:<ipHash>` | 5 | 15 min | `/admin?step=totp&error=rate` |
| Code attempts, all IPs | `rate:admin-totp:global` | 30 | 15 min | same |
| Ops-header failures per IP | `rate:admin-header-fail:<ipHash>` | 10 | 15 min | 401 (seed-tenders: 429) |
| 2FA recovery e-mails per IP | `rate:admin-2fa-recover:<ipHash>` | 3 | 1 h | 429 |
| 2FA recovery e-mails, all IPs | `rate:admin-2fa-recover:global` | 10 | 1 h | 429 |
| Recovery-link verify per IP | `rate:admin-2fa-recover-verify:<ipHash>` | 10 | 15 min | 429 |
| 2FA disable attempts per IP | `rate:admin-2fa-disable:<ipHash>` | 5 | 15 min | 429 |

**Lockout.** Every wrong password *or* wrong code increments
`admin:auth-failures`. At **10** failures (from any IPs combined) the key
`admin:login-lock` is set for **15 minutes** and both steps redirect to
`/admin?error=locked`. A successful login clears the counter. The count is
also mirrored to `AdminAuth.failedAttempts` / `lockedUntil` in Postgres for
the Security tab, but Redis is the source of truth.

`<ipHash>` is `sha256(ip + VOTE_IP_SALT)` truncated — raw IPs are never stored.

### Public write endpoints (fail OPEN — a Redis blip must not block citizens)

| Endpoint | Key | Limit |
|---|---|---|
| `POST /api/features?id=` | `rate:feature-vote:<ipHash>` | 20 / h |
| `POST /api/payment/create-order` and `create-subscription` (shared) | `rate:payment-order:<ipHash>` | 10 / h |

---

## 3. The header (ops) path — scope

`requireAdmin()` accepts **either** a valid session cookie **or** one of these
request headers matching `ADMIN_PASSWORD` in constant time:

```
x-admin-secret: <ADMIN_PASSWORD>
x-admin-password: <ADMIN_PASSWORD>
```

It exists for curl/ops scripts (`cleanup-news`, `payments`, …). It bypasses
2FA, so:

- failures are throttled (10 / 15 min / IP) and logged as
  `{"event":"admin_header_auth_failed", ...}` without echoing the header;
- it is **not** accepted by anything that changes security posture. These
  use `requireAdminCookie()` (session cookie only):
  `POST /api/admin/2fa/setup`, `/verify`, `/disable`,
  `PATCH /api/admin/security` (recovery e-mail / phone),
  `POST /api/admin/security/logout-all`, and the API-key vault
  (`vault-session.ts`, which binds to the cookie value).
- While 2FA is on, changing the recovery e-mail or phone also needs a
  current code (the recovery e-mail receives the link that switches 2FA
  off), and `2fa/setup` refuses with 409 — disable 2FA first (that needs a
  code), then set it up again. Rules: `src/lib/admin-second-factor.ts`.
- `Authorization: Bearer <SEED_SECRET>` is **no longer** an admin credential.
  It is checked only inside `POST /api/admin/seed-tenders`.

Example ops call:

```bash
curl -X POST https://forthepeople.in/api/admin/cleanup-news \
     -H "x-admin-secret: $ADMIN_PASSWORD"
curl -X POST https://forthepeople.in/api/admin/seed-tenders \
     -H "Authorization: Bearer $SEED_SECRET"
```

---

## 4. Revoking sessions

**One browser** — click Logout. That deletes its `admin:session:<id>` and the
cookie.

**Everywhere (lost laptop, suspected leak)** — from a logged-in browser:

```bash
curl -X POST https://forthepeople.in/api/admin/security/logout-all \
     -H "Cookie: ftp_admin_v1=<your current cookie>"
# → {"ok":true,"revokedSessions":N,"revokedPending":M}
```

It SCANs and deletes every `admin:session:*` and `admin:totp-pending:*` key.
The Security tab's "Log out all devices" button calls the same route.

**Without any working browser** (Upstash console → CLI tab):

```
SCAN 0 MATCH admin:session:* COUNT 100      # then DEL each key
DEL admin:login-lock                        # clear a lockout early
DEL admin:auth-failures
```

**Nuclear option** — rotate `ADMIN_SESSION_SECRET` in Vercel and redeploy.
Every existing cookie fails its signature check immediately.

---

## 5. Things that go wrong

| Symptom | Cause | Fix |
|---|---|---|
| `/admin?error=locked` | 10 wrong passwords/codes in 15 min (you or an attacker) | wait 15 min, or `DEL admin:login-lock` + `DEL admin:auth-failures` in Upstash |
| `/admin?error=rate` | 5 attempts from your IP in 15 min | wait, or `DEL rate:admin-login:<ipHash>` |
| `/admin?error=config` | `ADMIN_PASSWORD` unset, or Redis unreachable when minting the pending token | check Vercel env: `ADMIN_PASSWORD`, `REDIS_URL`, `REDIS_TOKEN` |
| Code form never appears | layout reads `admin_totp_pending`; cookies blocked or not sent over http | use https (cookies are `secure` in production) |
| Correct code rejected, `error=1` | pending token expired (5 min), or you switched network (IP bound), or Redis blip | go "Back to password" and log in again |
| Correct code rejected, `error=code` | phone clock drift beyond ±30 s | re-sync time on the phone; or use a backup code |
| Lost phone AND backup codes | — | `/en/admin-recover` (outside the admin layout, so it opens while logged out) e-mails a 1-hour reset link to `AdminAuth.recoveryEmail`; needs `RESEND_API_KEY` |
| Build fails: "ADMIN_SESSION_SECRET is not set" | `admin-auth.ts` throws at import | set it in Vercel (all envs) and in CI |

Structured log events to search in Vercel logs / Sentry:
`admin_totp_pending_rejected`, `admin_login_locked`, `admin_header_auth_failed`,
`admin_header_auth_throttled`, `seed_secret_auth_failed`, `rate_limit_fail_closed`.

---

## 6. Environment variables involved (names only)

`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ENCRYPTION_SECRET` (TOTP secret +
backup codes at rest), `REDIS_URL`, `REDIS_TOKEN`, `VOTE_IP_SALT`,
`SEED_SECRET` (seed-tenders only), `RESEND_API_KEY` (recovery e-mail),
`ADMIN_ALLOWED_IPS` (optional page-level IP allowlist in `proxy.ts`).
