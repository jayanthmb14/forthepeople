# Tenders — Legal & Compliance Framework

## Full 7-clause disclaimer

(rendered via `TenderDisclaimer variant="full"` component)

1. **Source data only.** Every tender shown here is aggregated from a
   public Government of India or State of Karnataka procurement portal.
   No data is generated or inferred.
2. **Not an official government service.** ForThePeople.in is an
   independent civic platform. For binding status, always verify on the
   source portal.
3. **Factual red-flag labels.** Labels like "single bidder" or "short
   window" are mathematical observations computed from the published
   data, compared against rules such as GFR 2017, KTPPA 1999, or CVC
   guidelines. They are not allegations. Legitimate reasons may exist in
   any individual case.
4. **Eligibility wizard is informational.** Matching runs in your
   browser against tender-published criteria. Nothing on this page
   constitutes legal advice under the Advocates Act §33. Consult an
   enrolled advocate for interpretation.
5. **Personal data protected.** Aadhaar, phone numbers, personal email
   addresses and individual PAN are automatically redacted from ingested
   documents (DPDP Act 2023 readiness).
6. **Takedown & grievance.** 7-working-day SLA. Email
   support@forthepeople.in. Winning bidders may request 7-year
   anonymisation for individual records.
7. **Licence.** Aggregated data is republished under GODL-India (Feb
   2017) and Copyright Act §52(1)(q).

## Grievance / takedown officer

- Email: `support@forthepeople.in` (TO BE CONFIRMED BY JAYANTH)
- SLA: 7 working days per IT Rules 2021
- Takedown categories:
  - Factual error in published data (top priority)
  - PII leak slipping past the regex redactor (top priority)
  - Defamation claim (reviewed with counsel)
  - Right-to-be-forgotten for individual losing bidders (7-year
    anonymisation of displayLabel ↔ realName map)

## PII redaction

**Status 2026-09-28:** nothing stores tender document text today — the PDF
extractor never ran and was deleted with `src/scraper/parsers/pii-redactor.ts`
(`git log --all -- src/scraper/parsers/pii-redactor.ts` finds it). The live
GePNIC collector stores listing and detail fields only, and no person's name.
Any future feature that stores document text must redact, before the DB write:

| Token | Regex | Replacement |
|-------|-------|-------------|
| Aadhaar | `\b\d{4}\s?\d{4}\s?\d{4}\b` | `[AADHAAR_REDACTED]` |
| Indian mobile | `\b[6-9]\d{9}\b` | `[PHONE_REDACTED]` |
| Email | RFC-5322 practical | `[EMAIL_REDACTED]` |
| Individual PAN | `[A-Z]{5}\d{4}[A-Z]` within 60-char "proprietor / individual / Shri / Smt / Mr / Ms / Mrs" context | `[PAN_REDACTED]` |
| Company PAN | (same regex, no individual context) | **preserved** |

## Factual-copy language rules

UI strings must not contain: `suspicious`, `corrupt`, `dubious`,
`cartel`, `irregular`, `fraudulent`. Enforced by:

- Static: `scripts/lint-tender-copy.sh` (fails the lint on match)
- Runtime: `assertFactualCopy` from `src/lib/tenders/format.ts`,
  invoked by `RedFlagBadge` on its `factualStatement` prop

## BNS §356 defamation exposure

India's Bharatiya Nyaya Sanhita §356 covers defamation, including of
corporate persons. Our mitigation: factual statements only, no
adjectives, rule citations alongside every flag. If a flag's copy can
be read as an allegation, rewrite.

## Advocates Act §33

Eligibility matching is client-side by design — profile state stays in
React, no network call during matching. This avoids providing legal
advice (reserved for enrolled advocates).

## DPDP 2023 readiness checklist

| Requirement | Status |
|-------------|--------|
| Redact Aadhaar / phone / email / individual PAN | ✅ |
| Grievance officer + SLA | ⚠️ email placeholder set, needs official appointment by Jayanth |
| Right-to-erasure endpoint | ⚠️ manual takedown process in v1, automated in v2 |
| Data-protection impact assessment | ⚠️ pending before production launch |
| Consent manager | n/a (public data; bidder identity belongs to public record) |

## Citations

- Constitution Art 19(1)(a)
- Copyright Act §17(d), §52(1)(q)
- Eastern Book Company v. D.B. Modak (2008) 1 SCC 1
- RTI Act §4(1)(b), §4(2)
- NDSAP 2012 Gazette Notification (17 March 2012)
- GODL-India (Gazette of India, 16 February 2017)
- Karnataka Transparency in Public Procurements Act 1999
- GFR 2017 Rules 161–197 (procurement)
- CVC Guidelines 2007–present
- BNS 2023 §356 (Defamation)
- DPDP Act 2023
- IT Act 2000 §43, §65B, §66F
- Advocates Act 1961 §33
- IT Rules 2021 (intermediary / takedown SLA)
