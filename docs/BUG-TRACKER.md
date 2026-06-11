# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Status values: **OPEN** ·
**RESOLVED-local** (fixed + verified locally, not yet pushed) · **RESOLVED-prod**
(pushed + verified on production)._

> **Merge note:** this copy was created on branch `session-5-hygiene` (off main).
> Sessions 1–4 each create their own copy. When all land, union the files (keep every
> entry). Merge in order 1 → 2 → 3 → 4 → 5.

---

## MEDIUM / LOW — Hygiene

### HYG-1 — Citizen-facing "scraping" copy, public encryption fallback, `.v` backups, dead deps
- **Status:** ✅ RESOLVED-local — 2026-06-11 (branch `session-5-hygiene`, commit pending review)
- **Severity:** MEDIUM / LOW
- **Findings + fixes:**
  - **Citizen-facing "scraping" copy** (a transparency platform shouldn't call its data
    pipeline a "scraper" to citizens): `TenderLockedState.tsx` "portal scraping setup" →
    "data-collection setup"; `india/module-page/ModulePage.tsx` "the scraper is wired in"
    → "that data source is connected". Internal code identifiers keep "scraper".
  - **Public encryption fallback** (`src/lib/encryption.ts`): `getEncryptionKey()` fell
    back to the committed constant `"forthepeople-fallback-change-me"` — encrypting the
    API-key vault with a string anyone can read in this repo. Now THROWS if neither
    `ENCRYPTION_SECRET` nor `ADMIN_PASSWORD` is set.
  - **28 committed `*.vN.tsx` backup snapshots** — `git rm`'d (history preserves them);
    grep confirmed zero imports.
  - **3 dead deps** (`bullmq`, `ioredis`, `puppeteer`) — zero imports anywhere;
    `npm uninstall … --legacy-peer-deps` (no `npm audit fix`). Lockfile diff is pure
    deletions, no other version churn.
  - **Release gate** added to `BLUEPRINT-UNIFIED.md`: grep `/scrap/i` over `src/components`
    + `src/app` before every push to catch new citizen-facing "scraping" copy.
- **Verified locally:**
  - `npx tsc --noEmit` → 0 errors; lint → 65 errors (down from 70; <110).
  - `npx next build` → exit 0, 174 static pages (confirms deletions broke no imports). Did
    not run `npm run build` directly (still has `prisma db push` on this branch — Session 2
    removes it — and won't touch prod).
  - Dev smoke: district page, locked-tenders page (`TenderLockedState`), `/en/india` module
    page (`ModulePage`) → all 200. Release-gate grep: no citizen-facing "scraping" copy left.

---

## Other audit findings (separate branches / sessions)

| ID | Sev | Finding | Session / Branch | Status |
|----|-----|---------|------------------|--------|
| SEC-1 | CRITICAL | Admin auth bypass via static `ftp_admin_v1="ok"` cookie | Session 1 / `session-1-admin-auth` | RESOLVED-local |
| SEC-2 | CRITICAL | Build runs `prisma db push` on every deploy; Next 16.2.4 CVEs; CI build needs a DB | Session 2 / `session-2-build-cve` | RESOLVED-local |
| DATA-1 | HIGH | RTI/court scrapers fabricate numbers on portal failure | Session 3 / `session-3-data-integrity` | RESOLVED-local |
| SEC-3 | HIGH | Public POST endpoints lack rate-limit / validation / DPDP consent | Session 4 / `session-4-endpoint-hardening` | RESOLVED-local |

_All 5 audit findings now RESOLVED-local. Next: push in batches (1+2 → verify prod → 3+4+5), set Vercel `ADMIN_SESSION_SECRET` before pushing Session 1, run the Session 3 purge script, then work the Manual Checklist._
