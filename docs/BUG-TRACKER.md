# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Status values: **OPEN** ·
**RESOLVED-local** (fixed + verified locally, not yet pushed) · **RESOLVED-prod**
(pushed + verified on production)._

> **Merge note:** this copy was created on branch `session-4-endpoint-hardening` (off
> main). Sessions 1–3 each create their own copy. When all land, union the files (keep
> every entry). Merge in order 1 → 2 → 3 → 4.

---

## HIGH — Security + DPDP

### SEC-3 — Public POST endpoints lack rate-limit / validation / DPDP consent
- **Status:** ✅ RESOLVED-local — 2026-06-11 (branch `session-4-endpoint-hardening`, commit pending review)
- **Severity:** HIGH
- **Finding:** Public POST endpoints had no real abuse protection. `tenders/alerts/subscribe`
  had zero rate-limit / validation and stored user emails (spam + DB-flood vector + a DPDP
  concern). `suggestions` and the admin-login limiter used in-memory `Map`s that reset per
  serverless invocation on Vercel — effectively a no-op.
- **Fix:**
  - `src/lib/rate-limit.ts`: added shared `getClientIp()`, `hashIp()`
    (`sha256(ip + VOTE_IP_SALT)`, same as `/api/district-request`), `resetRateLimit()`.
  - `api/suggestions`: in-memory Map → `rateLimit('suggestion:<ipHash>', 3, 3600)`.
  - `api/feedback`: added `rateLimit('feedback:<ipHash>', 10, 3600)` + subject length cap (≤200).
  - `api/tenders/alerts/subscribe`: `rateLimit('tender-alert:<ipHash>', 5, 3600)` + strict
    email regex + length caps (≤200) + **DPDP** require `consent:true` (reject → 400). Purpose
    documented in-file; validation ordered before the tender lookup (400s never touch the DB).
  - `[locale]/admin/actions.ts`: login limiter (5 / 15 min) → `rateLimit('admin-login:<ipHash>',
    5, 900)`, reset on success.
- **Notes / follow-ups:**
  - DPDP consent is enforced at the gate but NOT persisted — `TenderSavedByUser` has no consent
    column; storing it needs a schema migration + manual `db:push` (Session 2 workflow). Follow-up.
  - `rateLimit()` fails OPEN on Upstash outage (degrades to "allow"), by design.
  - ⚠️ `actions.ts` is also edited by Session 1 (admin sessions) → merge conflict expected;
    changes are compatible. Merge `session-1` first, then rebase `session-4`.
- **Verified locally:**
  - `npx tsc --noEmit` → 0 errors; `npm run lint` → 70 errors (pre-existing baseline, <110,
    0 in any of the 5 touched files).
  - Runtime (dev + prod Upstash, unique `X-Forwarded-For` per endpoint, invalid bodies → no DB
    writes): suggestions `400×3 → 429`; feedback `400×10 → 429`; tender-alerts `400×5 → 429`.
    tender-alerts: missing-consent → 400, invalid-email → 400, valid + nonexistent tender → 404.

---

## Other audit findings (separate branches / sessions)

| ID | Sev | Finding | Session / Branch | Status |
|----|-----|---------|------------------|--------|
| SEC-1 | CRITICAL | Admin auth bypass via static `ftp_admin_v1="ok"` cookie | Session 1 / `session-1-admin-auth` | RESOLVED-local |
| SEC-2 | CRITICAL | Build runs `prisma db push` on every deploy; Next 16.2.4 CVEs; CI build needs a DB | Session 2 / `session-2-build-cve` | RESOLVED-local |
| DATA-1 | HIGH | RTI/court scrapers fabricate numbers on portal failure | Session 3 / `session-3-data-integrity` | RESOLVED-local |
| HYG-1 | MED/LOW | Citizen-facing "scraping" copy, public encryption fallback, `.v` backups, dead deps | Session 5 | OPEN |
