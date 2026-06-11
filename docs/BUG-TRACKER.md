# ForThePeople.in — Bug & Security Tracker

_Living document. Tracks findings from the 10 June 2026 security/quality audit and
their remediation across the 5 fix sessions. Status values: **OPEN** ·
**RESOLVED-local** (fixed + verified locally, not yet pushed) · **RESOLVED-prod**
(pushed + verified on production)._

> **Merge note:** this copy was created on branch `session-3-data-integrity` (off
> main). Branches `session-1-admin-auth` and `session-2-build-cve` each create their
> own copy (SEC-1, SEC-2). When all land, union the files (keep every entry). Merge
> in order 1 → 2 → 3.

---

## HIGH — Data integrity

### DATA-1 — RTI/court scrapers fabricate numbers on portal failure
- **Status:** ✅ RESOLVED-local — 2026-06-11 (branch `session-3-data-integrity`, commit pending review)
- **Severity:** HIGH (data integrity / reputation — this is a transparency platform)
- **Finding:** Two scrapers invented numbers when the source portal failed and wrote
  them to the DB, violating the #1 rule (zero fabrication — every numeric field must
  come from a cited government source):
  - `src/scraper/jobs/rti.ts` — on `!res.ok`, used `Math.random()` to invent RTI
    filed-counts + avg-days; stored as `source: "KIC Karnataka (estimated)"`.
  - `src/scraper/jobs/courts.ts` — on NJDG failure, derived `pending = prevPending +
    filed - disposed` (filed/disposed guessed as a fraction of last pending) and
    stored it as `source: "NJDG (estimated)"`.
- **Fix:**
  - rti.ts: deleted the `Math.random()` block. On failure it logs and returns
    `{ success:false, recordsNew:0, recordsUpdated:0, error:"KIC HTTP <status>" }` —
    writes nothing.
  - courts.ts: deleted the derived-estimate block. On failure it returns the same
    honest failed status and writes nothing; last REAL rows are left untouched.
  - Removed the orphaned `CORE_DEPARTMENTS` / `COURT_NAMES` constants.
  - `/rti` + `/courts` pages: wired the already-imported `NoDataCard` to the empty
    case (was showing a misleading "Filed 0 / Pending 0" block on no data).
  - NEW `scripts/purge-estimated-stats.ts` (safe-by-default dry-run; `--confirm` to
    delete) to remove `RtiStat`/`CourtStat` rows whose `source` contains "estimated".
- **⚠️ Manual follow-up (maintainer):** run the purge against prod Neon AFTER deploy —
  fabricated rows already exist in prod (confirmed live: `mumbai` `/api/data/courts`
  returns `source:"NJDG (estimated)"` rows). The session did NOT run it.
- **Verified locally:**
  - `npx tsc --noEmit` → 0 errors.
  - Forced portal failure (`fetch` → HTTP 503) + ran both jobs against a throwaway
    Postgres → **0 rows written** (counts 0 before/after; both returned
    `success:false, recordsNew:0`). PASS.
  - `/rti` + `/courts` serve 200 (empty district mumbai + data district mandya);
    `mumbai /api/data/rti` returns `stats:[]` → RTI page hits its `NoDataCard` branch.
- **Scope:** only `rti.ts`, `courts.ts`, the two pages, and the new script were
  touched. No other scraper / route / component / AI code. `AI-NEWS-INTELLIGENCE-SKILL.md`
  checked — does not document this scraper behavior, left unchanged.

---

## Other audit findings (separate branches / sessions)

| ID | Sev | Finding | Session / Branch | Status |
|----|-----|---------|------------------|--------|
| SEC-1 | CRITICAL | Admin auth bypass via static `ftp_admin_v1="ok"` cookie | Session 1 / `session-1-admin-auth` | RESOLVED-local |
| SEC-2 | CRITICAL | Build runs `prisma db push` on every deploy; Next 16.2.4 CVE batch; CI build needs a DB | Session 2 / `session-2-build-cve` | RESOLVED-local |
| SEC-3 | HIGH | Public POST endpoints lack rate-limit / validation / DPDP consent | Session 4 | OPEN |
| HYG-1 | MED/LOW | Citizen-facing "scraping" copy, public encryption fallback, `.v` backups, dead deps | Session 5 | OPEN |
