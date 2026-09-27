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

---

## 4. Helplines (code, not database)

Helplines are constants in `src/components/district/civic/CitizenParts.tsx`
(Citizen Corner), `src/app/[locale]/[state]/[district]/police/page.tsx`
(police page) and `src/app/[locale]/[state]/[district]/health/page.tsx`
(health page), plus a few lines of "My Responsibility" text in
`src/lib/constants/responsibility-content.ts`. No database table holds
them (searched ResponsibilityItem, CitizenTip, ServiceGuide, GovOffice).
Citizen Corner now asks `getHelplines(state)` so a number can be
state-only or differ by state.

| Helpline | Was | Now | Source |
|---|---|---|---|
| Women helpline | 1091 (a police women's line in only some states) | **181** — national 24x7 Women Helpline (MWCD, Mission Shakti), links to 112/ERSS and One Stop Centres. Also on the police page. | [wcd.gov.in — Women Helpline 181](https://wcd.gov.in/offerings/women--helpline--scheme) |
| "Road accident" 1073 | Shown as a national number | **Removed.** 1073 is a city traffic-police line (Kolkata Traffic Police's one-stop helpline; Amritsar), not national. Replaced by **1033 "Highway emergency"** — NHAI's 24x7 toll-free national-highway helpline (ambulance, patrol, crane) | PIB, NHAI "Dial 1033" (release 2265867): [pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265867&reg=3&lang=2); Kolkata 1073: PTI via [thehawk.in](https://www.thehawk.in/news/india/kolkata-traffic-police-asks-citizens-to-use-its-one-stop-traffic-helpline-1073-for-all-complaints-emergencies) |
| Anti-corruption 1064 | Shown as national | **State-only: Telangana and Maharashtra**, where the state Anti-Corruption Bureau publishes 1064. Hidden elsewhere. | [acb.telangana.gov.in](https://acb.telangana.gov.in/Home/ReportCorruption) ("Toll-Free Number: 1064"); [acb.maharashtra.gov.in](https://acb.maharashtra.gov.in/) ("Toll Free Number 1064") |
| Consumer helpline | 1800-11-4000 | **1915** (8 am–8 pm; WhatsApp 8800001915) | [consumerhelpline.gov.in](https://consumerhelpline.gov.in/) |
| Ambulance | 108 everywhere | 108, but **102 in Delhi** (Delhi's government ambulance is CATS, 102) | [cats.delhi.gov.in/faqs](https://cats.delhi.gov.in/faqs); NHM: "35 States/UTs … Dial 108 or 102" [nhm.gov.in](https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=1217&lid=189) |
| Cyber fraud | 1930 | unchanged — confirmed | [i4c.mha.gov.in](https://i4c.mha.gov.in/) ("Report a Cybercrime on 1930") |
| Responsibility text, Karnataka ×3 | "Karnataka Lokayukta: 1064 (toll-free)" | Lokayukta site + office line 080-22257013 (1064 was the ACB's number; the ACB was dissolved in 2022 and the Lokayukta site does not list 1064) | [lokayukta.karnataka.gov.in](https://lokayukta.karnataka.gov.in/) |
| Responsibility text, New Delhi | "Delhi Lokayukta or Anti-Corruption Branch: 1064" | Anti-Corruption Branch (Directorate of Vigilance) via vigilance.delhi.gov.in — Delhi never used 1064 (its 1031 line was dropped in 2015) | [vigilance.delhi.gov.in — ACB](https://vigilance.delhi.gov.in/vigilance/anti-corruption-branch) |

Strings changed in en + hi + kn (`page_citizen-corner.json`:
`helplines.road`, `helplines.corruption.name`, `helplines.consumer.when`).

**Not re-verified (left as they are):**
- 112 (112.gov.in refused the connection), 100, 101 — standard national numbers.
- 14567 Elderline (the MoSJE site did not resolve), 1098 Childline, 155261
  PM-KISAN (portal is script-rendered; number not visible to the checker).
- Health page: 14555 (PM-JAY; pmjay.gov.in refused the connection),
  1800-180-1104, 1800-116-117 (poison centre), 9152987821 (iCall, TISS — not
  a government line). Tele-MANAS **14416** (national mental-health line) is
  missing and could be added.
- West Bengal: wbhealth.gov.in runs the free "102" ambulance; whether 108
  also works statewide was not confirmed, so 108 still shows there.
- Responsibility text: UP "Anti-Corruption Organisation: 0522-2217440",
  Hyderabad SHE Teams WhatsApp 9490617444, and the civic numbers (311, 1916,
  1913, 1969, 1800-111-555 …) were not checked.
