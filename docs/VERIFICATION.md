# Data verification (double-checking)

Every figure we show should be checked against a second source, and the
result should be visible. This document explains the backend that does
that: what it checks, how, where the results go, and how to add a check.

- **Code:** `src/lib/verification/` (pure rules and parsers + one file per
  verifier), `src/app/api/cron/verify-data/route.ts` (the daily run),
  `src/app/api/data/verification/route.ts` (the public summary).
- **Table:** `DataVerification` (`prisma/schema.prisma`).
- **Tests:** `tests/verification-*.test.ts`, fixtures in
  `tests/fixtures/verification/` (real replies, trimmed; no network).

## 1. The rules in one screen

1. **A check never changes the data it checks.** When sources disagree, a
   review item goes to the admin queue (`NewsActionQueue`); a person
   decides and edits the data in the admin Content Editor.
2. **"Verified" means two independent sources agree.** The source of the
   value we show counts as one when it is an outside feed (OpenWeather,
   AGMARKNET, a state portal); a row typed in by hand does not count, so a
   hand-entered leader needs Wikipedia **and** Wikidata to agree.
3. **Reading the same publisher again is not a second source.** It proves
   our copy is faithful and current, and gives at most "single-source"
   (reason `same-publisher`).
4. **No answer is not a disagreement.** A source that is down, has no data
   for that day, or leaves a field empty gives "no answer" (`agreed: null`).
5. **Wikipedia and Wikidata are cross-checks, not authorities.** A
   disagreement with them triggers a human review; we never present them
   to citizens as the official source.
6. Polite requests only: one request at a time per host, at least 2 s
   apart, a timeout on every call, and a total budget (see §4).

## 2. What is checked

| Dataset (`dataset`) | What we show | Compared with | Rule | Best status today |
|---|---|---|---|---|
| `weather` | newest `WeatherReading` temperature (OpenWeather, or Open-Meteo when it was the fallback) | the **other** service, read now | within ±3 °C, readings ≤ 90 min apart; a stored reading older than 3 h is not compared | verified |
| `dams` | newest `DamReading` % full per dam | Karnataka Water Resources Department portal, **read again** | same Indian day, within ±2 points; a newer day on the portal means our copy is behind | single-source (same publisher) |
| `mandi` | modal prices on the newest market day, top 3 commodities per district | CEDA Ashoka's AGMARKNET mirror (district figure, same day) | our average modal within ±15 % of CEDA's modal, or inside CEDA's min–max ±5 % | single-source (CEDA mirrors AGMARKNET) |
| `leaders` | Chief Minister, Deputy CM(s), Governor / Lieutenant Governor rows; Prime Minister and President rows | the state's (or India's) Wikipedia infobox **and** Wikidata (state item P6 / P35 with start dates; P39 via SPARQL for Deputy CM / LG) | the same person (spelling variants, initials, titles and word order allowed; a bare surname never matches) | verified |
| `leaders` (names) | every active leader | — | the name field must be a person, not "[Verify at …]", "[Name Not Available]", "SP, Mysuru Rural" … | status `placeholder` |
| `leaders` (coverage) | — | Wikipedia + Wikidata | every district lists its state's Chief Minister and Governor / LG | status `missing` |
| `weather`, `mandi`, `dams`, `leaders`, `news`, `alerts`, `projects`, `exams` | the newest row's date | the dataset's freshness rule (`src/lib/freshness.ts`, the same rule as the page's stale notice) | newer than the rule's maximum age | `fresh` / `stale` |

**Sources looked at and not used (27 Sep 2026)** — so nobody retries them blind:

| Source | Why not |
|---|---|
| KSNDMC `Reservoir_Details.aspx` | now serves the KSNDMC home page (no table) |
| KSNDMC dashboard (`ksndmc.org:804`) | weather ranges per district only (a possible third weather source for Karnataka) |
| CWC reservoir bulletin | listing stops at 8 May 2025 (PDF) |
| Agmarknet 2.0 `api.agmarknet.gov.in/v1/` | 404 at the root; not explored further |
| eNAM, India-WRIS | connection timeouts |
| State government "who's who" pages | different per state, mostly rendered by JavaScript |
| Wikidata office items (P1308 "officeholder") | empty for Indian state offices; P39 is used instead, and is sparse |
| CEDA daily prices after 30 Oct 2025 | the mirror stopped then; every newer day is "no data" |

## 3. Statuses and reason codes

Row statuses (`DataVerification.status`):

| Status | Kind of row | Meaning |
|---|---|---|
| `verified` | cross-source | two independent sources agree |
| `single-source` | cross-source / source-recheck | only one source could be consulted, or the second is the same publisher |
| `disagreement` | cross-source / source-recheck | a source that answered gives a different value |
| `unchecked` | any | could not compare (our value too old, nothing stored, no date) |
| `fresh` / `stale` | freshness | within / beyond the dataset's maximum age |
| `placeholder` | placeholder | a name field that is not a person's name |
| `missing` | coverage | a state office we should list but do not |

The public summary (`/api/data/verification`) reports one of
`verified | single-source | disagreement | unchecked` per dataset
(any disagreement → disagreement; every compared row verified →
verified; something compared → single-source; nothing → unchecked), plus
`stale`, `counts` and `reasons`.

Reason codes (`reason`, machine-readable; the panel translates them — add
strings in en/hi/kn in the panel's page dictionary, never show the code):

| Code | Plain meaning (for the translator) |
|---|---|
| `sources-agree` | Two separate sources give the same value. |
| `sources-disagree` | Another source gives a different value. A person is checking it. |
| `same-publisher` | We re-read the same source; our copy matches it. |
| `second-source-no-data` | The second source has nothing for this date. |
| `second-source-failed` | The second source did not answer today. |
| `no-second-source` | We have no second source for this yet. |
| `not-in-second-source` | The second source does not list this item. |
| `times-too-far-apart` | The two readings were taken too far apart to compare. |
| `stored-too-old` | The value we show is too old to compare. |
| `stored-older-than-source` | The source already has newer data than we show. |
| `source-older-than-stored` | The source now shows an older day than we do. |
| `no-stored-data` | We hold no data for this district. |
| `name-placeholder` | Some officer names are not filled in yet. |
| `office-missing` | An office holder is not listed yet. |
| `late` | This data is older than it should be. |
| `on-time` | This data is up to date. |
| `no-date` | The source does not publish a date. |
| `not-collected` | We do not collect this for this district. |

## 4. How a run works

`GET /api/cron/verify-data` — daily, `45 6 * * *` UTC (12:15 IST: after
the 06:00 UTC dam reading and the 03:30 UTC crop run; weather is
collected every 30 minutes, so it is always fresh).

1. `verifyCron()` (Bearer `CRON_SECRET`), then a Redis lock
   `ftp:lock:verify-data` (290 s) so two runs never overlap.
2. `cronStarted()` → Redis `ftp:cron:verify-data` + a `ScraperLog` row
   (`jobName = "verify-data"`), like every other cron.
3. If the `DataVerification` table does not exist yet, the run ends as
   `skipped` ("run npm run db:push").
4. The verifiers run one after another inside a **240 s** budget, each
   with its own cap: freshness 40 s (database only), leaders 70 s,
   weather 40 s, dams 25 s, mandi 60 s. A verifier that throws is
   reported; the others still run. Measured on 27 Sep 2026 (10
   districts): leaders ≈ 18 s, weather ≈ 18 s, dams < 1 s, mandi ≈ 14 s.
5. Review items are written to `NewsActionQueue` (at most 25 new per run),
   then all rows are written with the review item's id, rows older than
   120 days are deleted, and the cached public summaries are cleared.
6. When new review items were created, one `AdminAlert` (level
   `warning`, module `verification`) is written, and e-mailed when
   `ADMIN_EMAIL` and `RESEND_API_KEY` are set.
7. `cronFinished()` closes the `ScraperLog` row: `recordsNew` = rows
   written, `recordsUpdated` = new review items, `error` = a short list of
   problems; status `ok` / `partial` (some source failed) / `error`.

Manual run (one verifier, some districts):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://forthepeople.in/api/cron/verify-data?only=leaders&district=mandya,pune"
```

`only` takes any of `freshness, leaders, weather, dams, mandi`.

## 5. Review items (admin)

`NewsActionQueue` rows with `dataType = "verify-leaders"`, status
`pending`, never executed automatically. `extractedData.kind`:

| kind | When | Useful fields |
|---|---|---|
| `leader-mismatch` | a stored office holder disagrees with a source | `state`, `office`, `shown[]` (leader ids, districts), `wikipedia{names,url,revisedAt}`, `wikidata{via,holders[{qid,name,since}]}`, `suggestion` (only when both sources name the same person) |
| `office-missing` | a district page lacks its CM or Governor/LG | `districts[]`, the same `wikipedia` / `wikidata`, `suggestion` |
| `placeholder-name` | officer names that are placeholders (Collector / DC / DM / SP listed first) | `district`, `rows[{leaderId, role, name}]` |

`confidence` is 0.9 when Wikipedia and Wikidata agree with each other
against us, 0.5 otherwise. An item is not created again while one with
the same headline is pending, or for 30 days after it was rejected; a
changed value gives a new headline and so a new item.

To act on one: check the official source (the state government or Raj
Bhavan site, the district's nic.in page), fix the row in the Content
Editor (which records the change in `UpdateLog`), then mark the item
approved or rejected.

## 6. Public API

`GET /api/data/verification?district=mandya` (or `?state=karnataka` for
all of a state's live districts). Cached 10 minutes. Always HTTP 200 for a
valid request; before the table exists `available` is `false` and every
cross-checked dataset is `unchecked`.

```json
{
  "district": "mandya", "state": null, "available": true,
  "updatedAt": "2026-09-28T06:46:10.000Z",
  "source": "ForThePeople.in automatic cross-checks (daily)",
  "data": [
    {
      "dataset": "leaders",
      "status": "disagreement",
      "checks": [
        { "source": "manual-research", "role": "shown", "agreed": false, "independent": true, "checkedAt": "…" },
        { "source": "Wikipedia", "role": "check", "agreed": false, "independent": true, "checkedAt": "…" },
        { "source": "Wikidata", "role": "check", "agreed": false, "independent": true, "checkedAt": "…" }
      ],
      "lastCheckedAt": "…", "dataDate": "2026-04-14T…", "stale": false,
      "counts": { "verified": 3, "singleSource": 0, "disagreement": 1, "unchecked": 0, "placeholder": 2, "missing": 0 },
      "reasons": ["sources-disagree", "name-placeholder"]
    }
  ]
}
```

`dataset` uses the keys of `/api/data/freshness` (`weather`, `mandi`,
`dams`, `leaders`, `news`, `alerts`, `projects`, `exams`), so the panel can
join the two. `checks[].role` is `shown` for the source of what we
display (listed only when there are one or two of them) and `check` for a
source we compared with; `independent: false` marks a re-read of the same
publisher.

## 7. The `DataVerification` row

| Field | |
|---|---|
| `runId` | groups one run |
| `datasetKey` | `<dataset>:<district>[:<item>]`, e.g. `weather:mandya`, `leaders:mandya:chief-minister:<leaderId>`, `mandi:pune:tomato`, `freshness:dams:mysuru` |
| `dataset`, `kind` | see §2–3 |
| `stateSlug`, `districtSlug` | where the checked row is shown |
| `entityType`, `entityId` | the checked row (`WeatherReading`, `CropPrice`, `DamReading`, `Leader`) |
| `dataDate` | the date the checked data describes |
| `primarySource`, `primaryValue` | where what we show came from, and the value |
| `secondarySource`, `secondaryValue` | the first other source and its value |
| `sources` | every outside check: `[{ source, value, agreed, independent, url, asOf }]` |
| `agreed`, `tolerance`, `status`, `reason` | the verdict |
| `notes` | English, for the admin |
| `reviewItemId` | the `NewsActionQueue` item this row raised |

Useful queries (read-only):

```sql
-- Latest verdict per check for one district
SELECT DISTINCT ON ("datasetKey") "datasetKey", status, reason, "primaryValue", "secondaryValue", "checkedAt"
FROM "DataVerification" WHERE "districtSlug" = 'mandya'
ORDER BY "datasetKey", "checkedAt" DESC;

-- Everything that disagreed in the last run
SELECT "datasetKey", notes FROM "DataVerification"
WHERE status = 'disagreement' AND "runId" = (SELECT "runId" FROM "DataVerification" ORDER BY "checkedAt" DESC LIMIT 1);
```

## 8. Adding a verifier or a source

1. **Pick the dataset key** from `DATASETS` in `src/lib/freshness.ts` (add
   it to `VerifiedDataset` in `types.ts`; add it to
   `CROSS_CHECKED_DATASETS` if the panel should always list it).
2. **Pure part first:** `src/lib/verification/<name>-check.ts` with the
   reply parser and the comparison, using the helpers in `compare.ts`
   (`withinAbs`, `withinRel`, `istDayKey`, `namesMatch`, `decideStatus`).
   Save a real reply, trim it, put it in `tests/fixtures/verification/`,
   and test the parser and the tolerance edges. No network in tests.
3. **Verifier:** `src/lib/verification/verify-<name>.ts` exporting
   `verifyX(ctx: VerifyContext): Promise<VerifierOutput>`:
   - read what the page shows (same filters as the page — e.g.
     `NOT_FROM_NEWS_OPTIONAL` for leaders), with `take:` on big tables;
   - fetch with `politeFetch` / `fetchJson` from `http.ts`, passing
     `deadlineMs: ctx.deadlineMs`; stop starting work when the deadline is
     near and push a note to `errors`;
   - build `SourceCheck`s (`independent: false` when it is the same
     publisher; `agreed: null` when there is no answer) and let
     `decideStatus()` give the verdict (`primaryCounts: true` only for an
     outside feed);
   - only produce `reviews` when a human can act on them, with a stable
     one-line `headline` (it is the de-duplication key);
   - never write to the table being checked.
4. **Register it** in `VERIFIERS` in `run.ts` with a time cap, keeping the
   caps' sum under the route's 240 s budget.
5. **New reason codes:** add them to `ReasonCode` (`types.ts`),
   `REASON_ORDER` (`summary.ts`), §3 above, and ask for panel strings in
   en/hi/kn.
6. Checks: `npx tsc --noEmit`, `npx eslint src/lib/verification tests`,
   `npx vitest run`. Try it once by hand with
   `?only=<name>&district=<one>` before relying on the schedule.

**Adding a second source to an existing verifier** (e.g. a CWC bulletin
for dams, the KSNDMC weather ranges, a state government page for leaders)
means one more `SourceCheck` in that verifier's list; `decideStatus()`
already handles several.

## 9. What the first dry run found (27 Sep 2026)

Run against live sources with a read-only copy of our rows (nothing
written):

- **Leaders:** 64 checks — 25 verified (Prime Minister and President
  everywhere; the Karnataka, UP and Tamil Nadu Governors; Maharashtra, UP
  and Delhi CMs), 8 disagreements, 26 placeholder names, 5 missing
  offices. Where Wikipedia **and** Wikidata agree with each other against
  us: Chief Minister of Karnataka (both: D. K. Shivakumar since 3 Jun 2026;
  we show Siddaramaiah), Chief Minister of West Bengal (both: Suvendu
  Adhikari since 9 May 2026), Governor of West Bengal (both: R. N. Ravi
  since 12 Mar 2026), Governor of Telangana (both: Shiv Pratap Shukla since
  11 Mar 2026). Wikipedia only: Lieutenant Governor of Delhi (Taranjit
  Singh Sandhu), Deputy CM of Karnataka (G. Parameshwara). Wikidata out of
  date: Governor of Maharashtra (Wikidata still says Ramesh Bais; Wikipedia
  agrees with us). Missing: the CM on the Mysuru, Chennai, Hyderabad and
  Pune pages; the Governor on the Pune page. These are for a person to
  confirm against official sources — the check does not change them.
- **Dams:** 5 of 5 match the Karnataka portal read again.
- **Mandi:** CEDA has no prices after 30 Oct 2025, so every crop is
  "single-source" (`second-source-no-data`); Chennai has no mandi rows.
- **Weather:** the network path works (Open-Meteo answered for all 10
  districts); the stored readings in the snapshot were 7 h old, so a real
  comparison needs the 30-minute weather cron running.
