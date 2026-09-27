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

---

## 5. Police station phone numbers (PoliceStation)

**Mysuru** — the seed numbers were invented (0821-2443344, …3355, …3366,
…3377, …3388, …3399 and a run of …100 numbers). Both official sites list
every station with its landline and e-mail:
[Mysuru City Police](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en)
(city stations, all on the 0821-2418xxx block) and
[Mysuru District Police](https://mysurupolice.karnataka.gov.in/31/mysuru-district-police-stations)
(taluk stations).

| Station | Was (invented) | Now | Source page |
|---|---|---|---|
| Mysuru · Devaraja Police Station | 0821-2443344 | **0821-2418306** | [link](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en) |
| Mysuru · Hebbal Police Station (Mysuru) | 0821-2483100 | **0821-2418318** | [link](https://mysurucitypolice.karnataka.gov.in/40/hebbal-police-station/en) |
| Mysuru · Jayalakshmipuram Police Station | 0821-2443377 | **0821-2418516** | [link](https://mysurucitypolice.karnataka.gov.in/38/jayalakshmipuram-police-station/en) |
| Mysuru · Krishnaraja Police Station | 0821-2443355 | **0821-2418119** | [link](https://mysurucitypolice.karnataka.gov.in/41/krishnaraja-police-station/en) |
| Mysuru · Lashkar Police Station | 0821-2434100 | **0821-2418307** | [link](https://mysurucitypolice.karnataka.gov.in/28/lashkar-police-station/en) |
| Mysuru · Mandi Mohalla Police Station | 0821-2432100 | **0821-2418313** | [link](https://mysurucitypolice.karnataka.gov.in/35/mandi-police-station/en) |
| Mysuru · Nazarbad Police Station | 0821-2443366 | **0821-2418308** | [link](https://mysurucitypolice.karnataka.gov.in/30/nazarbad-police-station/en) |
| Mysuru · Saraswathipuram Police Station | 0821-2518100 | **0821-2418123** | [link](https://mysurucitypolice.karnataka.gov.in/45/sarswarthipuram-police-station/en) |
| Mysuru · Udayagiri Police Station | 0821-2486100 | **0821-2418309** | [link](https://mysurucitypolice.karnataka.gov.in/31/udayagiri-police-station/en) |
| Mysuru · V.V. Puram Police Station | 0821-2430100 | **0821-2418314** | [link](https://mysurucitypolice.karnataka.gov.in/36/vanivilasa-puram-police-station/en) |
| Mysuru · Vidyaranyapuram Police Station | 0821-2443388 | **0821-2418122** | [link](https://mysurucitypolice.karnataka.gov.in/44/vidyaranyapuram-police-station/en) |
| Mysuru · Bannur Police Station | 0821-2580100 | **08227-275632** | [link](https://mysurupolice.karnataka.gov.in/54/bannuru-police-station/en) |
| Mysuru · H.D. Kote Police Station | 08228-252100 | **08228-255329** | [link](https://mysurupolice.karnataka.gov.in/44/h-d-kote-police-station/en) |
| Mysuru · Hunsur Rural Police Station | 08222-252200 | **08222-252042** | [link](https://mysurupolice.karnataka.gov.in/41/hunasuru-rural-police-station/en) |
| Mysuru · Hunsur Town Police Station | 08222-252100 | **08222-253133** | [link](https://mysurupolice.karnataka.gov.in/42/hunasuru-town-police-station/en) |
| Mysuru · K.R. Nagar Police Station | 08222-252100 | **08223-263666** | [link](https://mysurupolice.karnataka.gov.in/37/k-r-nagara-police-station/en) |
| Mysuru · Nanjangud Rural Police Station | 08221-228200 | **08221-226259** | [link](https://mysurupolice.karnataka.gov.in/48/nanjangud-rural-police-station/en) |
| Mysuru · Nanjangud Town Police Station | 08221-228100 | **08221-228383** | [link](https://mysurupolice.karnataka.gov.in/49/nanjangud-town-police-station/en) |
| Mysuru · Periyapatna Police Station | 08222-263100 | **08223-273100** | [link](https://mysurupolice.karnataka.gov.in/40/periyapattana-police-station/en) |
| Mysuru · T. Narasipur Police Station | 08227-262100 | **08227-261227** | [link](https://mysurupolice.karnataka.gov.in/53/t-narsipura-police-station/en) |
| Mandya · Maddur Police Station | 08232-252100 | **08232-232170** | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Pandavapura Police Station | 08232-258200 | **08236-255132** | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Srirangapatna Police Station | 08236-252200 | **08236-252027** | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · K R Pete Police Station | 08232-262200 | **08230-262248** (renamed “K R Pete Town Police Station”) | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Malavalli Police Station | 08232-272100 | **08231-242244** (renamed “Malavalli Town Police Station”) | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Nagamangala Police Station | 08234-252100 | **08234-286040** (renamed “Nagamangala Town Police Station”) | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mysuru · Bogadi Police Station | 0821-2443399 | **null** — station not in the official list | [link](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en) |
| Mysuru · Chamundipuram Police Station | 0821-2441100 | **null** — station not in the official list | [link](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en) |
| Mysuru · K.R. Nagar Town Police Station | 08222-252300 | **null** — station not in the official list | [link](https://mysurupolice.karnataka.gov.in/31/mysuru-district-police-stations) |
| Mysuru · Nagarahole Forest Police Station | 08228-252200 | **null** — station not in the official list | [link](https://mysurupolice.karnataka.gov.in/31/mysuru-district-police-stations) |
| Mysuru · Rural Police Station Mysuru | 0821-2440100 | **null** — station not in the official list | [link](https://mysurupolice.karnataka.gov.in/31/mysuru-district-police-stations) |
| Mandya · Mandya Town Police Station | 08232-222600 | **null** — station not in the official list | [link](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |

**Mandya** — same invented pattern (…2100/…2200/…2600). The
[Mandya District Police contact table](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en)
lists every station; rows above. Three rows were renamed to the town
station because each taluk has separate Town and Rural stations.
E-mails (…@ksp.gov.in) from the same official pages were added for every
matched station.

**Other districts — invented batches, numbers set to null (no official page confirms them):**
- **Bengaluru Urban, all 65 numbers.** Two seed batches gave the same
  stations different numbers (Yelahanka 080-28461100 *and* 080-28461400;
  Hebbal 23633400 / 23630100; Whitefield 28450100 / 28452400 …); 62 of 65
  end in …100 or …400. Bengaluru City Police's published directory
  ([bcp.karnataka.gov.in/26/contact-us](https://bcp.karnataka.gov.in/26/contact-us/en))
  uses 080-2294xxxx lines and covers traffic stations only, so the
  law-and-order numbers could not be re-filled. The 12 duplicate station
  rows (same name and PIN in both batches) are deleted.
- **Lucknow, all 15** (14 end in …100/…200/…400/…600).
- **New Delhi, all 7** (6 end in …400/…800/…000).
- **Chennai 11 of 20, Kolkata 15 of 20, Hyderabad 4 of 16** — the ones
  ending in a round block (…000, …100, …050, …250, …350 …) like the rest of
  their seed batch.

The police sites for Delhi, Kolkata, Mumbai and Hyderabad load their
station directories with scripts the checker could not read, and the web
search quota for this session ran out, so nothing could be re-filled
there.

**Unverified — left as they are (look plausible, not confirmed):**

- chennai (9): Adyar Police Station 044-24910013; Guindy Police Station 044-22350545; Kilpauk Police Station 044-26411221; Mylapore Police Station 044-24641212; Nungambakkam Police Station 044-28270221; Perambur Police Station 044-25511221; T Nagar Police Station 044-24340750; Tambaram Police Station 044-22260550; Velachery Police Station 044-22590523
- hyderabad (12): Abids PS 040-27854814; Afzalgunj PS 040-24515293; Charminar PS 040-24515888; Falaknuma PS 040-24515155; Habeebnagar PS 040-23223625; Hussainialam PS 040-24515533; Kacheguda PS 040-27854133; Mangalhat PS 040-23220678; Musheerabad PS 040-27853855; Nampally PS 040-27853252; Narayanguda PS 040-27854920; Bahadurpura PS 040-24515250
- kolkata (5): Bhawanipur Police Station 033-24741225; Gariahat Police Station 033-24610320; Lalbazar (Kolkata Police HQ) 033-22143024; New Market Police Station 033-22521515; Park Street Police Station 033-22170460
- mumbai (20): Andheri Police Station 022-26281515; Azad Maidan Police Station 022-22620974; Bandra Police Station 022-26420245; Borivali Police Station 022-28933510; Colaba Police Station 022-22161613; DN Nagar Police Station 022-26283251; Dadar Police Station 022-24229502; Dharavi Police Station 022-24044888; Ghatkopar Police Station 022-25002210; Goregaon Police Station 022-28721777; Juhu Police Station 022-26362929; Kandivali Police Station 022-28052055; Kurla Police Station 022-26521240; Malad Police Station 022-28811002; Marine Drive Police Station 022-22812366; Powai Police Station 022-25709264; Santacruz Police Station 022-26490092; Versova Police Station 022-26320346; Vikhroli Police Station 022-25787070; Worli Police Station 022-24938571

Also noted, not changed: Bengaluru Urban's list includes Devanahalli and
Doddaballapur stations, which are in Bengaluru Rural district; Mysuru's
"Nagarahole Forest", "Bogadi", "Chamundipuram", "K.R. Nagar Town" and
"Rural Police Station Mysuru" rows match no official station (numbers
removed, rows kept for the owner to decide).
