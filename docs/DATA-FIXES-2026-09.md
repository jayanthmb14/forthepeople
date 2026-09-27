# Data fixes — September 2026

Checked by hand on **27 Sep 2026** against the named sources (government
portals first, reputed news only where no official page exists). Nothing
here was changed from memory or by a paid AI API.

The database changes are in `scripts/fix-records-2026-09.ts` (data in
`scripts/fix-records-2026-09/`). It is a **dry run by default**:

```bash
cd "/Users/jayanth/Documents/For The People/forthepeople"
npx tsx scripts/fix-records-2026-09.ts              # print every change, write nothing
npx tsx scripts/fix-records-2026-09.ts --confirm    # apply all of it in one transaction
npx tsx scripts/fix-records-2026-09.ts --only=PopulationHistory   # one table at a time
```

Rows are matched by id, so re-running is safe (already-applied changes are
skipped). If a field was changed by someone else after 27 Sep, that fix is
skipped and flagged "CHANGED SINCE CHECK". After applying, clear the Redis
caches (admin → Cache). The Leader table is not touched.

---

## 2. Population

**No census was held in 2021.** It was postponed because of COVID-19 and
became Census 2027: house-listing ran April–September 2026 and the
population count's reference date is 00:00 on **1 March 2027** (1 Oct 2026
for Ladakh and snow-bound areas) —
[PIB, "Census 2027: India's First Digital Enumeration Exercise", 25 Apr 2026](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3).
The Registrar General's official population projections (Technical Group,
2020) are state-level only, so there is no official district figure after
2011. The overview's "Population" tile picks the newest row whose source
starts with "Census of India", so the Mandya and Bengaluru 2021 rows were
being shown to citizens as census counts.

| District | Row | What was wrong | Now | Source |
|---|---|---|---|---|
| Mandya | 2021 "Census of India", 21,80,000 | No 2021 census; not an official projection | **Deleted** | [PIB](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Bengaluru Urban | 2021 "Census of India (Projected)", 1,27,65,000 | Same — shown as a census count | **Deleted** | PIB (above) |
| Hyderabad | 2024 "Projected estimate based on Census 2011 growth rate", 45,00,000 | Home-made projection, no source | **Deleted** | PIB (above) |
| Mysuru | 2024 "Projected estimate", 32,48,000 | Home-made projection, no source | **Deleted** | PIB (above) |
| New Delhi | 2024 "Projected estimate", 1,50,000 | Home-made projection, no source | **Deleted** | PIB (above) |
| Lucknow | 2024 "Estimate — Lucknow District Administration", 52,00,000 | lucknow.nic.in gives no such figure | **Deleted** | [lucknow.nic.in/demography](https://lucknow.nic.in/demography/) |
| Pune | 2021 "Maharashtra State Evaluation Committee estimate", 1,08,00,000 | No such official estimate found | **Deleted** | PIB (above) |
| Chennai | 2026 "Estimate — Chennai Metropolitan Area", 1,15,00,000 | Metro-area guess on a district chart (district: 46,46,732 in 2011) | **Deleted** | PIB (above) |
| Mumbai | 2026 "Estimate — Mumbai Metropolitan Region", 2,10,00,000 | Region guess with made-up sex ratio/literacy (API already hid it) | **Deleted** | PIB (above) |
| Mandya | Census 2011 row | Population 19,40,428 (real: **18,05,769**); sex ratio 982 (995); literacy 72.8% (70.40%); urban 27.3% (17.08%); density 391 (364) | Corrected | [Census DCHB Mandya](https://censusindia.gov.in/nada/index.php/catalog/625), figures as reproduced at [census2011.co.in](https://www.census2011.co.in/census/district/262-mandya.html) |
| Bengaluru Urban | Census 2011 row | Density 12,988/km² and 97.4% urban (impossible for 2,196 km²); literacy 88.48% | Density **4,381**, urban **90.94%**, literacy **87.67%** | [DCHB Bangalore Part A](https://censusindia.gov.in/2011census/dchb/2918_PART_A_DCHB_BANGALORE.pdf), as reproduced at [census2011.co.in](https://www.census2011.co.in/census/district/242-bangalore.html) |

Note: the official DCHB PDFs on censusindia.gov.in could not be opened by
the checking tool (TLS certificate error), so the Census 2011 figures were
read from census2011.co.in, which reproduces the Census Primary Census
Abstract; the totals match the site's own `DemographicProfile` Census 2011
rows.

**Left alone (small or needs a decision):**
- Mysuru Census 2011 row: literacy 72.6% vs 72.79% and sex ratio 984 vs 985
  — minor; not changed.
- `DemographicProfile` (the v2 population module) has Mandya sex ratio 985,
  literacy 70.14%, urban 16.08% — these disagree with the Census PCA
  reproduction (995, 70.40%, 17.08%). Not changed here (outside this pass);
  worth re-reading from the PCA file.
- Pre-1991 rows (Chennai, Mumbai 1951–1981) were not re-checked.
