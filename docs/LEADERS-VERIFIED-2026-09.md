# Leaders verified — September 2026

Checked on 27 Sep 2026 for the ten live districts. The reason: the owner found wrong
leaders on the site, for example Siddaramaiah still shown as Chief Minister of Karnataka.
The fix is `scripts/fix-leaders-2026-09.ts`. It is a dry run by default and applies only
with `--confirm`. Every change it makes is listed here, with two sources from different
outlets.

## What changed since the rows were entered

- **Karnataka.** Siddaramaiah resigned as Chief Minister on 28 May 2026. D. K. Shivakumar
  has been Chief Minister since 3 June 2026, with G. Parameshwara as Deputy Chief Minister.
  Thaawarchand Gehlot is still the Governor; he administered the oath.
- **Governors, 6 March 2026 reshuffle.** Four changes affect our districts:
  - West Bengal: R. N. Ravi replaced C. V. Ananda Bose.
  - Telangana: Shiv Pratap Shukla replaced Jishnu Dev Varma.
  - Maharashtra: Jishnu Dev Varma is the new Governor. Mumbai's row already showed this
    correctly.
  - Delhi: Taranjit Singh Sandhu is Lieutenant Governor, replacing V. K. Saxena.

  Kerala's Governor, Rajendra Arlekar, also holds Tamil Nadu as additional charge.
- **Tamil Nadu 2026 election.** TVK's C. Joseph Vijay has been Chief Minister since
  10 May 2026. In Chennai, TVK won 14 of the 16 seats and the DMK kept Harbour and
  Chepauk-Thiruvallikeni. M. K. Stalin lost Kolathur.
- **West Bengal 2026 election.** The BJP won. Suvendu Adhikari has been Chief Minister
  since 9 May 2026 and won Bhabanipur against Mamata Banerjee. Of Kolkata's 11 seats, the
  BJP won 6 and the TMC 5. Firhad Hakim resigned as Mayor on 5 June 2026.
- **Maharashtra.** Deputy Chief Minister Ajit Pawar died in a plane crash on 28 Jan 2026.
  Sunetra Pawar became Deputy Chief Minister on 31 Jan 2026 and won the Baramati
  by-election.
- **Officers who changed:**

  | District | Post | Now |
  |---|---|---|
  | Lucknow | Police Commissioner | Tarun Gauba, since 29 July 2026 |
  | Hyderabad | Collector | Priyanka Ala, since April 2026 |
  | Bengaluru Urban | Deputy Commissioner | P. S. Kantharaju, since June 2026 |
  | Bengaluru | Police Commissioner | Seemant Kumar Singh, since June 2025 |
  | Kolkata | Police Commissioner | Ajay Kumar Nand, since March 2026 |
  | Chennai | Collector | S. Malathi Helen |
  | Chennai | Police Commissioner | A. Amalraj |
  | Mandya | Superintendent of Police | V. J. Shobharani |
  | Mysuru | Superintendent of Police | Mallikarjun Baladandi |

- **Courts.** The Bombay High Court has a new Chief Justice, Mahesh Chandra Tripathi, and
  so does the Calcutta High Court, R. V. Ghuge. Both were sworn in on 9 Sep 2026.
- **Wrong from the start.** Many MLA rows were never right:
  - Mysuru: 8 of the 11 MLAs were wrong.
  - Bengaluru Urban: many rows named people from other constituencies or districts.
  - Hyderabad and Chennai: rows came from the previous assemblies.
  - New Delhi: still showed Arvind Kejriwal, who lost in February 2025.
  - Pune: MPs were stored under "the whole country" and MLAs under "your state".

## Totals, from a dry run against a read-only snapshot of 27 Sep 2026

| | Rows |
|---|---|
| Added | 102 |
| Deactivated | 105 (66 wrong or outdated, 39 placeholders) |
| Updated | 142 |

- **Updated** means one of three things: re-verified, a field corrected for the same
  person, or the level fixed.
- **A second run makes no changes**: 0 writes, which proves the script is idempotent.
- **The dry run proves the matching, not the facts.** It was simulated offline with the
  script's own planner (`computeWrites`). The agent that wrote the script could not open
  a database connection, so the main session should repeat the dry run against the live
  database.

## How to apply (main session / owner)

```bash
npx tsx scripts/fix-leaders-2026-09.ts                     # dry run: read the list
npx tsx scripts/fix-leaders-2026-09.ts --only=mandya       # optional: one district at a time
npx tsx scripts/fix-leaders-2026-09.ts --confirm           # apply, one transaction
```

Then clear the Redis caches (admin → Cache).

### What each run does

- **Rows are never deleted.** Wrong rows are set to `active=false`.
- **Every write gets an `UpdateLog` row** (module `leadership`) with the source URLs.
- **Verified rows get a new `source` and date.** `source` becomes
  `manual-research 2026-09 · <outlets>`, and `lastVerifiedAt` becomes 27 Sep 2026. The
  page then shows "Researched by hand. Last verified 27 Sep 2026".
- **Rows are checked by name before they change.** If a row's stored name no longer
  matches, the script skips it and prints a warning.
- **A changed role clears `roleLocal`.** The stored Kannada or Hindi role text would no
  longer match.
- **A new office-holder gets a new row.** When the person holding an office has changed,
  the old row is deactivated and a new row is added; it is not renamed. Old rows carry
  that person's photo, local-script name and phone number.

## Rules used

- **Two sources for every change, from different outlets.**
  - Allowed: official sites, Wikipedia (only with citations), major newspapers and
    agencies, and results sites (IndiaVotes, TNElectionResult, Oneindia).
  - Two Wikipedia pages count as one outlet.
  - Anything with a single source is not in the script. It is listed under "For the
    owner" below.
- **Placeholders are deactivated.** This covers "[Name Not Available]", "[Verify at …]",
  and rows whose name is only the job title (for example "GCC Commissioner"). They
  named nobody.
- **Districts are the revenue districts in the registry.** MLAs from constituencies
  outside the district were removed, such as Kanakapura, Shikaripura, Dum Dum,
  Rajendranagar and Tiruchirappalli West.
- **Some MPs were added.** These are MPs whose Lok Sabha seat covers part of the
  district:
  - Chamarajanagar, for Mysuru
  - Bangalore Rural and Chikkaballapur, for Bengaluru Urban
  - Secunderabad, for Hyderabad
  - Mohanlalganj, for Lucknow
- **Levels (`tier`) follow the page's five levels:**
  - 1 — country
  - 2 — state: Governor, Chief Minister, Deputy Chief Ministers
  - 3 — district officers
  - 4 — MPs and MLAs
  - 5 — city and departments

## For the owner (not in the script: unconfirmed, or a decision)

1. **Delhi Deputy Chief Minister.** Some reports (Kerala Kaumudi, Republic) call Parvesh
   Verma Deputy CM. India TV calls him a Cabinet minister. He is added only as MLA for
   New Delhi.
2. **West Bengal Chief Secretary.** Manoj Agarwal was appointed in May 2026 but was due to
   retire in July 2026, and the current holder is unconfirmed. B. P. Gopalika is
   deactivated; no new row is added.
3. **Tamil Nadu Chief Secretary.** Only one source names M. Sai Kumar (from 8 April 2026),
   so he is not added. Tamil Nadu also has no full-time Governor yet: a report of
   21 Sep 2026 says one will be appointed "soon". Re-check then.
4. **Seats and posts that are vacant right now:**
   - Khairatabad (Hyderabad): the MLA was disqualified in Sept 2026, and a by-election is
     due by about March 2027.
   - Kolkata Mayor: the Kolkata Municipal Corporation election is tentatively on
     7 Dec 2026.
   - Mysuru Mayor, and the Zilla Panchayat presidents in Karnataka: no elected bodies
     exist. Karnataka says panchayat polls will be held by the end of 2026.

   Add the new names once there are results.
5. **Which seats does "New Delhi" cover?** The page lists New Delhi and Kasturba Nagar.
   Kasturba Nagar is in the New Delhi Lok Sabha seat but in the South East Delhi revenue
   district. The New Delhi Lok Sabha seat has 10 assembly seats. Choose one: the Lok Sabha
   seat's 10 constituencies, or the revenue district's own.
6. **Rows kept as they are, not re-checked (outside this task's list):**
   - Pune: Divisional Commissioner and Additional Divisional Commissioner, Zilla
     Parishad CEO, Pimpri-Chinchwad Police Commissioner, Pune Rural SP, Pune Municipal
     Corporation Commissioner and Additional Commissioners, Deputy Mayor, District Judge.
     Their level is corrected.
   - Mumbai: Port Authority Chairman, BEST General Manager, MHADA CEO, MMRDA Commissioner.
   - Hyderabad: the Telangana High Court Chief Justice.
   - Lucknow: O. P. Srivastava (Lucknow East, 2024 by-election). He is correct, but the
     only sources found were two Wikipedia pages.
7. **Spelling.** The Karnataka Governor is stored as "Thaavar Chand Gehlot". The Governor's
   own style is "Thaawarchand Gehlot". It is left unchanged; change it if you prefer.
8. **Local-script names.** The new rows have no Kannada or Hindi name (`nameLocal`). They
   need a native speaker. No photos were added.
9. **Official sites that are out of date:**
   - mandya.nic.in still shows Mallikarjun Baladandi as Mandya SP. He moved to Mysuru in
     January 2026.
   - Wikipedia's Hyderabad district page still shows the previous Collector.
10. **The news pipeline keeps writing Leader rows.** `src/scraper/jobs/ai-analyzer.ts`
    creates rows from headlines. There are 195 inactive rows across these ten districts,
    for example "D K Shivakumar — Chief Minister — BJP" under Mumbai and New Delhi. The page
    already hides them (`NOT_FROM_NEWS`), but they pile up. Decide whether news should stop
    creating Leader rows, or send them to the review queue instead.

## District tables

"In the database now" is the row as it stood on 27 Sep 2026. "Decision" means:

- **add** — a new row. Or a matching curated row for the same person, reactivated.
- **deactivate** — the row is set to `active=false`.
- **update** — a field is corrected for the same person.
- **update (level only)** — only the level changes; the person was not re-checked.
- **keep (re-verified)** — the row is correct; only its source and date are refreshed.

### Mandya (Karnataka)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Karnataka | Thaavar Chand Gehlot | Confirmed current. since → 11 July 2021 | update | [Wikipedia][W_GOVS] · [Business Standard][BS_DKS] |
| Chief Minister of Karnataka | Siddaramaiah (INC) | Resigned as Chief Minister on 28 May 2026. | deactivate | [Wikipedia][W_KA_COM] · [Business Standard][BS_DKS] |
| Chief Minister of Karnataka | — (missing) | D. K. Shivakumar (INC), since 3 June 2026. Chief Minister since 3 June 2026 (Siddaramaiah resigned 28 May 2026). | add | [Wikipedia][W_KA_COM] · [Business Standard][BS_DKS] |
| Deputy Chief Minister of Karnataka | — (missing) | G. Parameshwara (INC), since 3 June 2026. Deputy Chief Minister since 3 June 2026. | add | [Wikipedia][W_KA_COM] · [INC][INC_DKS] |
| District Collector, Mandya | [Verify at mandya.nic.in] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Deputy Commissioner, Mandya | — (missing) | Dr. Kumara. Named Deputy Commissioner (row was a placeholder). | add | [mandya.nic.in][MANDYA_NIC_DC] · [Star of Mysore][SOM_MELUKOTE] |
| Superintendent of Police, Mandya | [Verify at ksp.gov.in] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Superintendent of Police, Mandya | — (missing) | Dr. V. J. Shobharani, since January 2026. Named SP (row was a placeholder). mandya.nic.in still shows her predecessor. | add | [Star of Mysore][SOM_IPS_JAN26] · [The Hans India][HANS_SHOBHARANI] |
| MLA, Krishnarajpet | Narasimha Nayak (INC) | Krishnarajpet's 2023 winner is H. T. Manju (JD(S)). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Krishnarajpet | — (missing) | H. T. Manju (JD(S)), since 2023. Krishnarajpet MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Maddur | D.C. Thammanna (INC) | Maddur's 2023 winner is K. M. Udaya (INC). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Maddur | — (missing) | K. M. Udaya (INC), since 2023. Maddur MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Malavalli (SC) | P.M. Narendraswamy (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Mandya | P. Ravikumar (Ganiga) (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Melukote | Darshan Puttannaiah (SKP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Nagamangala | N. Chauvarayaswamy (INC) | Name misspelt. name → N. Chaluvarayaswamy | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Srirangapatna | A.B. Ramesh Bandisiddegowda (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| Union Minister for Heavy Industries & Steel; MP, Mandya | H.D. Kumaraswamy (JD(S)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MANDYA] · [PIB][PIB_HDK] |

### Mysuru (Karnataka)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Karnataka | Thaavar Chand Gehlot | Confirmed current. since → 11 July 2021 | update | [Wikipedia][W_GOVS] · [Business Standard][BS_DKS] |
| Chief Minister of Karnataka | — (missing) | D. K. Shivakumar (INC), since 3 June 2026. Chief Minister since 3 June 2026 (Siddaramaiah resigned 28 May 2026). | add | [Wikipedia][W_KA_COM] · [Business Standard][BS_DKS] |
| Deputy Chief Minister of Karnataka | — (missing) | G. Parameshwara (INC), since 3 June 2026. Deputy Chief Minister since 3 June 2026. | add | [Wikipedia][W_KA_COM] · [INC][INC_DKS] |
| Deputy Commissioner, Mysuru | G. Jagadeesha | Not Mysuru DC (he was Bengaluru Urban DC until June 2026). Mysuru DC is G. Lakshmikanth Reddy. | deactivate | [mysore.nic.in][MYSORE_NIC_DC] · [Deccan Herald][DH_BU_DC] |
| Deputy Commissioner, Mysuru | — (missing) | G. Lakshmikanth Reddy. Mysuru DC, confirmed 15 Sep 2026. | add | [mysore.nic.in][MYSORE_NIC_DC] · [Star of Mysore][SOM_DASARA26] |
| Superintendent of Police, Mysuru City | Seemant Kumar Singh | He is Bengaluru City Police Commissioner, not a Mysuru officer. | deactivate | [Business Standard][BS_SEEMANT] · [Deccan Herald][DH_SEEMANT26] |
| Commissioner of Police, Mysuru City | — (missing) | Seema Latkar. Mysuru City Police Commissioner. | add | [mysore.nic.in][MYSORE_NIC_CP] · [Star of Mysore][SOM_LATKAR26] |
| Superintendent of Police, Mysuru Rural | SP, Mysuru Rural | Role-as-name placeholder; the district SP is added by name. | deactivate (placeholder) | — |
| Superintendent of Police, Mysuru District | — (missing) | Mallikarjun Baladandi, since January 2026. Mysuru district SP since Jan 2026. | add | [mysore.nic.in][MYSORE_NIC_SP] · [Udayavani][UDAYAVANI_SP] |
| President, Mysuru Zilla Panchayat | Anitha Kumaraswamy (INC) | No elected Zilla Panchayat in Karnataka since 2021 (administrators in charge). | deactivate | [Deccan Herald][DH_ZP] · [The Hans India][HANS_ZP] |
| Additional Deputy Commissioner | ADC, Mysuru Division | Role-as-name placeholder. | deactivate (placeholder) | — |
| CEO, Mysuru Zilla Panchayat | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| MLA, Chamaraja | B.Z. Zameer Ahmed Khan (INC) | He is MLA for Chamrajpet (Bengaluru); Chamaraja (Mysuru) is K. Harish Gowda. | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chamaraja | — (missing) | K. Harish Gowda (INC), since 2023. Chamaraja MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chamundeshwari | Vasu K. Reddy (INC) | Chamundeshwari's 2023 winner is G. T. Devegowda (JD(S)). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chamundeshwari | — (missing) | G. T. Devegowda (JD(S)), since 2023. Chamundeshwari MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, H.D. Kote | H.D. Revanna (JD(S)) | H.D. Kote's 2023 winner is Anil Chikkamadhu (INC). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, H.D. Kote | — (missing) | Anil Chikkamadhu (INC), since 2023. H.D. Kote MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Hunsur | M.K. Somashekara (INC) | Hunsur's 2023 winner is G. D. Harish Gowda (JD(S)). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Hunsur | — (missing) | G. D. Harish Gowda (JD(S)), since 2023. Hunsur MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, K. R. Nagar | Sa. Ra. Mahesh (INC) | K.R. Nagar's 2023 winner is D. Ravishankar (INC). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, K. R. Nagar | — (missing) | D. Ravishankar (INC), since 2023. K. R. Nagar MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Krishnaraja | M.K. Somashekar (INC) | Krishnaraja's 2023 winner is T. S. Srivatsa (BJP). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Krishnaraja | — (missing) | T. S. Srivatsa (BJP), since 2023. Krishnaraja MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Nanjangud | H.V. Umesh (INC) | Nanjangud's 2023 winner is Darshan Dhruvanarayana (INC). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Nanjangud | — (missing) | Darshan Dhruvanarayana (INC), since 2023. Nanjangud MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, T. Narasipur | H.S. Mahesh (INC) | T. Narasipur's 2023 winner is Dr. H. C. Mahadevappa (INC). | deactivate | [IndiaVotes][IV_KA23] · [Wikipedia][W_TNARASIPUR] |
| MLA, T. Narasipur | — (missing) | Dr. H. C. Mahadevappa (INC), since 2023. T. Narasipur MLA. | add | [IndiaVotes][IV_KA23] · [Wikipedia][W_TNARASIPUR] |
| MLA, Narasimharaja | Tanveer Sait (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Periyapatna | K. Venkatesh (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Varuna | Siddaramaiah (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| Member of Parliament (Lok Sabha) | Yaduveer Krishnadatta Chamaraja Wadiyar (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MYSORE] · [Wikipedia][W_18LS] |
| Member of Parliament (Lok Sabha) | — (missing) | Sunil Bose (INC), since 2024. MP for Chamarajanagar, which covers Varuna, T. Narasipur, H.D. Kote and Nanjangud. | add | [IndiaVotes][IV_LS_CHAMARAJANAGAR] · [Wikipedia][W_18LS] |
| Mayor, Mysuru City Corporation | Shivakumar (Mayor) (INC) | Mysuru City Corporation council's term ended 16 Nov 2023; an administrator runs it. | deactivate | [Star of Mysore][SOM_MCC_COUNCIL] · [Wikipedia][W_MCC] |
| District Agriculture Officer, Mysuru | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Executive Engineer, PWD, Mysuru | Executive Engineer, PWD | Role-as-name placeholder. | deactivate (placeholder) | — |
| Divisional Forest Officer, Mysuru | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Block Education Officer, Mysuru Urban | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |

### Bengaluru Urban (Karnataka)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Karnataka | Thaavar Chand Gehlot | Confirmed current. since → 11 July 2021 | update | [Wikipedia][W_GOVS] · [Business Standard][BS_DKS] |
| Chief Minister of Karnataka | Siddaramaiah (INC) | Resigned as Chief Minister on 28 May 2026. | deactivate | [Wikipedia][W_KA_COM] · [Business Standard][BS_DKS] |
| Chief Minister of Karnataka | — (missing) | D. K. Shivakumar (INC), since 3 June 2026. Chief Minister since 3 June 2026 (Siddaramaiah resigned 28 May 2026). | add | [Wikipedia][W_KA_COM] · [Business Standard][BS_DKS] |
| Deputy Chief Minister of Karnataka | — (missing) | G. Parameshwara (INC), since 3 June 2026. Deputy Chief Minister since 3 June 2026. | add | [Wikipedia][W_KA_COM] · [INC][INC_DKS] |
| Deputy Commissioner, Bengaluru Urban District | Deputy Commissioner, Bengaluru Urban | Role-as-name placeholder; DC added by name. | deactivate (placeholder) | — |
| Deputy Commissioner, Bengaluru Urban | — (missing) | P. S. Kantharaju, since June 2026. DC since June 2026 (G. Jagadeesha moved to Bengaluru Central City Corporation). | add | [Deccan Herald][DH_BU_DC] · [IANS][IANS_BU_DC] |
| Commissioner of Police, Bengaluru City | B. Dayananda | Replaced as Police Commissioner in June 2025. | deactivate | [Business Standard][BS_SEEMANT] · [Deccan Herald][DH_SEEMANT26] |
| Commissioner of Police, Bengaluru City | — (missing) | Seemant Kumar Singh, since June 2025. Bengaluru Police Commissioner. | add | [Business Standard][BS_SEEMANT] · [Deccan Herald][DH_SEEMANT26] |
| President, Bengaluru Urban Zilla Panchayat | ZP President, Bengaluru Urban (INC) | No elected Zilla Panchayat since 2021; row was a role-as-name placeholder. | deactivate | [Deccan Herald][DH_ZP] · [The Hans India][HANS_ZP] |
| Chief Executive Officer, Zilla Panchayat | CEO, Bengaluru Urban ZP | Role-as-name placeholder. | deactivate (placeholder) | — |
| MLA, Anekal | Nadahalli Srinivas (JD(S)) | Anekal's 2023 winner is B. Shivanna (INC). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Anekal | — (missing) | B. Shivanna (INC), since 2023. Anekal MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, B.T.M. Layout | Ramalinga Reddy (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Bangalore South (Bommanahalli) | Satish Reddy (BJP) | He is MLA for Bommanahalli (not Bangalore South). name → M. Satish Reddy; role → MLA, Bommanahalli; constituency → Bommanahalli | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Byatarayanapura | Krishna Byre Gowda (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chickpet | M. Krishnappa (INC) | M. Krishnappa (INC) is MLA for Vijay Nagar; Chickpet is Uday B. Garudachar. role → MLA, Vijay Nagar; constituency → Vijay Nagar | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chickpet | — (missing) | Uday B. Garudachar (BJP), since 2023. Chickpet MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Bangalore South | — (missing) | M. Krishnappa (BJP), since 2023. Bangalore South MLA (a different M. Krishnappa, BJP). | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Gandhinagar (KPCC President) | Dinesh Gundu Rao (INC) | He is not KPCC president; role text corrected. role → MLA, Gandhi Nagar; constituency → Gandhi Nagar | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Hebbal | Byrathi Suresh (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Jayanagar | Sowmya Reddy (INC) | Jayanagar's 2023 winner (after recount) is C. K. Ramamurthy (BJP). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Jayanagar | — (missing) | C. K. Ramamurthy (BJP), since 2023. Jayanagar MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Kanakapura (Deputy CM | D.K. Shivakumar (INC) | Kanakapura is in Bengaluru South district, not Bengaluru Urban; he is listed as Chief Minister. | deactivate | [Wikipedia][W_KANAKAPURA] · [IndiaVotes][IV_KA23] |
| MLA, Krishnarajapura | T.A. Sharavana (BJP) | K.R. Puram's 2023 winner is B. A. Basavaraja (BJP). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Krishnarajapuram | — (missing) | B. A. Basavaraja (BJP), since 2023. K.R. Puram MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Mahadevapura | C.N. Manjunath (BJP) | Mahadevapura's 2023 winner is Manjula S. (BJP); Dr. C. N. Manjunath is the Bangalore Rural MP. | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Mahadevapura | — (missing) | Manjula S. (BJP), since 2023. Mahadevapura MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Padmanabha Nagar | R. Ashok (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Pulakeshinagar | Priya Krishna (INC) | He is MLA for Govindraj Nagar; Pulakeshinagar is A. C. Srinivasa. role → MLA, Govindraj Nagar; constituency → Govindraj Nagar | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Pulakeshinagar | — (missing) | A. C. Srinivasa (INC), since 2023. Pulakeshinagar MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Rajajinagar | S. Suresh Kumar (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Shanti Nagar | N.A. Harris (INC) | Name misspelt. name → N. A. Haris | update | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Shikaripura (KBJP President) | Vijayendra Yediyurappa (BJP) | Shikaripura is in Shivamogga district, not Bengaluru Urban. | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Shivajinagar | Rizwan Arshad (INC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Shivajinagar (resigned) | R. Roshan Baig (INC) | Not an MLA; Shivajinagar's MLA is Rizwan Arshad. | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Yelahanka | Abhay Patil (INC) | Yelahanka's 2023 winner is S. R. Vishwanath (BJP). | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Yelahanka | — (missing) | S. R. Vishwanath (BJP), since 2023. Yelahanka MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Yeshwantpur | Shivaram Hebbar (BJP) | Yeshwanthpur's MLA is S. T. Somashekar; Hebbar is MLA for Yellapur. | deactivate | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Yeshwanthpur | — (missing) | S. T. Somashekar (IND), since 2023. Yeshwanthpur MLA; won for BJP in 2023, expelled from BJP on 27 May 2025. | add | [Wikipedia][W_KA16] · [Business Standard][BS_EXPEL] |
| MLA, Rajarajeshwarinagar | — (missing) | Munirathna (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Dasarahalli | — (missing) | S. Muniraju (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Mahalakshmi Layout | — (missing) | K. Gopalaiah (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Malleshwaram | — (missing) | Dr. C. N. Ashwath Narayan (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Sarvagnanagar | — (missing) | K. J. George (INC), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, C. V. Raman Nagar | — (missing) | S. Raghu (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Chamrajpet | — (missing) | B. Z. Zameer Ahmed Khan (INC), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| MLA, Basavanagudi | — (missing) | Ravi Subramanya L. A. (BJP), since 2023. Missing MLA. | add | [Wikipedia][W_KA16] · [IndiaVotes][IV_KA23] |
| Member of Parliament (Lok Sabha) | P.C. Mohan (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_BLR_C] · [Wikipedia][W_18LS] |
| Member of Parliament (Lok Sabha) | Tejasvi Surya (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_BLR_S] · [Wikipedia][W_18LS] |
| Member of Parliament (Lok Sabha) — Union Minister of State | Shobha Karandlaje (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_BLR_N] · [ni-msme][NIMSME_SHOBHA] |
| Member of Parliament (Lok Sabha) | — (missing) | Dr. C. N. Manjunath (BJP), since 2024. MP for Bangalore Rural (covers Rajarajeshwarinagar, Bangalore South, Anekal). | add | [IndiaVotes][IV_LS_BLR_R] · [Wikipedia][W_18LS] |
| Member of Parliament (Lok Sabha) | — (missing) | Dr. K. Sudhakar (BJP), since 2024. MP for Chikkaballapur (covers Yelahanka). | add | [IndiaVotes][IV_LS_CHIKKABALLAPUR] · [Wikipedia][W_18LS] |
| Chief Engineer (Roads), BBMP | [Name Not Available] | Placeholder; BBMP was replaced by the Greater Bengaluru Authority in 2025. | deactivate (placeholder) | — |
| District Health & Family Welfare Officer, Bengaluru Urban | District Health Officer | Role-as-name placeholder. | deactivate (placeholder) | — |
| Regional Transport Officer, Bengaluru Central | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |

### Pune (Maharashtra)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | — (missing) | Droupadi Murmu, since 25 July 2022. Missing. | add | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | — (missing) | Narendra Modi (BJP), since 26 May 2014. Missing. | add | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Maharashtra | — (missing) | Jishnu Dev Varma, since March 2026. Missing. | add | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] |
| Chief Minister of Maharashtra | — (missing) | Devendra Fadnavis (BJP), since 5 December 2024. Missing. | add | [Wikipedia][W_FADNAVIS3] · [Loktej][LOKTEJ_FADNAVIS] |
| Deputy Chief Minister of Maharashtra | — (missing) | Eknath Shinde (SHS), since 5 December 2024. Deputy Chief Minister; missing. | add | [Wikipedia][W_FADNAVIS3] · [PMRDA][PMRDA_SHINDE] |
| Guardian Minister, Pune District | Sunetra Ajit Pawar (NCP) | Deputy CM since 31 Jan 2026 (after Ajit Pawar's death) and Pune guardian minister; shown with the state leaders. name → Sunetra Pawar; role → Deputy Chief Minister of Maharashtra (Guardian Minister, Pune); tier → 2; since → 31 January 2026 | update | [Wikipedia][W_FADNAVIS3] · [AIR News][AIR_SUNETRA] |
| MLA, Baramati | — (missing) | Sunetra Pawar (NCP), since 2026 (by-election). Won the Baramati by-election held after Ajit Pawar died on 28 Jan 2026. | add | [Zee News][ZEE_BARAMATI] · [India.com][INDIACOM_BARAMATI] |
| Member of Parliament (Lok Sabha) | Supriya Sule (NCP-SP) | MP: level 1 → 4. tier → 4 | update | [IndiaVotes][IV_LS_BARAMATI] · [Wikipedia][W_MH_LS24] |
| Member of Parliament (Lok Sabha) | Dr. Amol Ramsing Kolhe (NCP-SP) | MP: level 1 → 4. tier → 4 | update | [IndiaVotes][IV_LS_SHIRUR] · [Wikipedia][W_MH_LS24] |
| Member of Parliament (Lok Sabha) | Shrirang Appa Chandu Barne (SHS) | MP: level 1 → 4. tier → 4 | update | [IndiaVotes][IV_LS_MAVAL] · [Wikipedia][W_MH_LS24] |
| Member of Parliament (Lok Sabha) | Murlidhar Kisan Mohol (BJP) | MP: level 1 → 4. tier → 4 | update | [IndiaVotes][IV_LS_PUNE] · [Wikipedia][W_MH_LS24] |
| Member of Legislative Assembly | Chetan Vitthal Tupe (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Hadapsar | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Madhuri Satish Misal (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Parvati | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Sunil Dnyandev Kamble (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Pune Cantonment | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Hemant Narayan Rasane (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Kasba Peth | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Rahul Subhashrao Kul (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Daund | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Dattatraya Vithoba Bharane (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Indapur | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Vijay Shivatare (SHS) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Purandar | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Shankar Hiraman Mandekar (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Bhor | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Bhimrao Dhondiba Tapkir (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Khadakwasla | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Sharaddada Bhimaji Sonawane (IND) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Junnar | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Dilip Dattatray Walse-Patil (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Ambegaon | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Babaji Ramchandra Kale (SHS-UBT) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Khed-Alandi | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Dnyaneshwar Aba Katke (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Shirur | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Mahesh Kisan Landge (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Bhosari | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Sunil Shankarrao Shelke (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Maval | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Shankar Jagtap (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Chinchwad | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Anna Dadu Bansode (NCP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Pimpri | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Bapusaheb Tukaram Pathare (NCP-SP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Vadgaon Sheri | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Siddharth Shirole (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Shivajinagar | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Legislative Assembly | Chandrakant Bachhu Patil (BJP) | MLA: level 2 → 4, role wording. tier → 4; role → MLA, Kothrud | update | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| District Collector | Jitendra Dudi | District officer: level 4 → 3. tier → 3; role → District Collector, Pune | update | [pune.gov.in][PUNE_GOV_COLL] · [Free Press Journal][FPJ_DUDI] |
| Commissioner of Police, Pune City | Amitesh Kumar | District officer: level 5 → 3. tier → 3 | update | [Wikipedia][W_PUNECP] · [Punekar News][PUNEKAR_CP] |
| Mayor, Pune Municipal Corporation | Manjusha Nagpure (BJP) | City: level 3 → 5. tier → 5 | update | [Free Press Journal][FPJ_MAYORS] · [The Bridge Chronicle][BRIDGE_LANDGE] |
| Mayor, Pimpri-Chinchwad Municipal Corporation | Ravi Landge (BJP) | City: level 3 → 5. tier → 5 | update | [Free Press Journal][FPJ_MAYORS] · [The Bridge Chronicle][BRIDGE_LANDGE] |
| Municipal Commissioner, Pimpri-Chinchwad Municipal Corporation | Dr. Vijay Suryawanshi | City: level 3 → 5. tier → 5 | update | [APAC News][APAC_SURYAWANSHI] · [Free Press Journal][FPJ_SURYAWANSHI] |
| Divisional Commissioner, Pune Division | Dr. Chandrakant Sulochana Laxmanrao Pulkundwar | District officer: level 4 → 3 (person not re-checked). tier → 3 | update (level only) | — |
| Additional Divisional Commissioner, Pune Division | Kavita Dwivedi | District officer: level 4 → 3 (person not re-checked). tier → 3 | update (level only) | — |
| Chief Executive Officer, Pune Zilla Parishad | U A Jadhav | District officer: level 4 → 3 (person not re-checked). tier → 3 | update (level only) | — |
| Commissioner of Police, Pimpri-Chinchwad | Vinoy Kumar Choubey | District officer: level 5 → 3 (person not re-checked). tier → 3 | update (level only) | — |
| Superintendent of Police, Pune Rural | Sandeep Singh Gill | District officer: level 5 → 3 (person not re-checked). tier → 3 | update (level only) | — |
| Additional Municipal Commissioner (Estate), Pune Municipal Corporation | Prajeet Nair | City: level 3 → 5 (person not re-checked). tier → 5 | update (level only) | — |
| Additional Municipal Commissioner, Pune Municipal Corporation | Shantanu Goel | City: level 3 → 5 (person not re-checked). tier → 5 | update (level only) | — |
| Deputy Mayor, Pune Municipal Corporation | Parshuram Wadekar (RPI (A)) | City: level 3 → 5 (person not re-checked). tier → 5 | update (level only) | — |
| Municipal Commissioner, Pune Municipal Corporation | Naval Kishore Ram | City: level 3 → 5 (person not re-checked). tier → 5 | update (level only) | — |

### Mumbai (Maharashtra)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Chief Minister of Maharashtra | Devendra Fadnavis (BJP) | Confirmed current. since → 5 December 2024 | update | [Wikipedia][W_FADNAVIS3] · [Loktej][LOKTEJ_FADNAVIS] |
| Governor of Maharashtra | Jishnu Dev Varma | Correct: Governor of Maharashtra since March 2026 (administered the Bombay HC oath on 9 Sep 2026). since → March 2026 | update | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] · [Free Press Journal][FPJ_TRIPATHI] |
| Deputy Chief Minister of Maharashtra | — (missing) | Eknath Shinde (SHS), since 5 December 2024. Deputy Chief Minister; missing. | add | [Wikipedia][W_FADNAVIS3] · [PMRDA][PMRDA_SHINDE] |
| Deputy Chief Minister of Maharashtra | — (missing) | Sunetra Pawar (NCP), since 31 January 2026. Deputy Chief Minister; missing. | add | [Wikipedia][W_FADNAVIS3] · [Gulf News][GULF_SUNETRA] |
| Commissioner of Police, Mumbai (IPS) | Deven Bharti | Confirmed current. since → May 2025 | update | [Wikipedia][W_MUMCP] · [Elets eGov][ELETS_BHARTI] |
| Deputy Commissioner of Police (Zone 9 — West) | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Collector, Mumbai City (IAS) | Aanchal Sood Goyal | District officer: level 4 → 3. tier → 3; since → March 2025 | update | [mumbaicity.gov.in][MUMCITY_COLL] · [ThePrint][PRINT_GOYAL] |
| Collector, Mumbai Suburban (IAS) | Saurabh Katiyar | District officer: level 4 → 3. tier → 3 | update | [mumbaisuburban.gov.in][MUMSUB_COLL] · [APAC News][APAC_KATIYAR] |
| MLA, Andheri West | Amit Satam (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Bandra East | Varun Sardesai (Shiv Sena (UBT)) | Same person, confirmed current. | keep (re-verified) | [ETV Bharat][ETV_BANDRAE] · [Wikipedia][W_MH15] |
| MLA, Bandra West | Ashish Shelar (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_VANDREW] · [Zee News][ZEE_VANDREW] |
| MLA, Borivali | Sanjay Upadhyay (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Colaba | Rahul Narwekar (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Dharavi | Jyoti Gaikwad (INC) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Ghatkopar East | Parag Shah (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Ghatkopar West | Ram Kadam (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Malabar Hill | Mangal Prabhat Lodha (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Mulund | Mihir Kotecha (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| MLA, Worli | Aaditya Thackeray (Shiv Sena (UBT)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_MH24] · [Wikipedia][W_MH15] |
| Member of Parliament (Lok Sabha) | Sanjay Dina Patil (Shiv Sena (UBT)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_NE] · [Wikipedia][W_MUM_NE] |
| Member of Parliament (Lok Sabha) | Piyush Goyal (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_N] · [Wikipedia][W_MH_LS24] |
| Member of Parliament (Lok Sabha) | Varsha Gaikwad (INC) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_NC] · [Wikipedia][W_MUM_NC] |
| Member of Parliament (Lok Sabha) | Ravindra Waikar (Shiv Sena (Shinde)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_NW] · [Wikipedia][W_MUM_NW] |
| Member of Parliament (Lok Sabha) | Anil Desai (Shiv Sena (UBT)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_SC] · [Wikipedia][W_MUM_SC] |
| Member of Parliament (Lok Sabha) | Arvind Sawant (Shiv Sena (UBT)) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_MUM_S] · [Wikipedia][W_MH_LS24] |
| Metropolitan Commissioner, MMRDA (IAS) | Dr. Sanjay Mukherjee | Department head: level 4 → 5 (person not re-checked). tier → 5 | update (level only) | — |
| Chief Justice, Bombay High Court | Justice Shree Chandrashekhar | Elevated to the Supreme Court; Justice Mahesh Chandra Tripathi sworn in 9 Sep 2026. | deactivate | [Free Press Journal][FPJ_TRIPATHI] · [LiveLaw][LIVELAW_TRIPATHI] |
| Chief Justice, Bombay High Court | — (missing) | Justice Mahesh Chandra Tripathi, since 9 September 2026. New Chief Justice. | add | [Free Press Journal][FPJ_TRIPATHI] · [LiveLaw][LIVELAW_TRIPATHI] |
| Director of Education, BMC | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Director, SWM, BMC — Solid Waste Management | Solid Waste Management Director | Role-as-name placeholder. | deactivate (placeholder) | — |
| Mayor, Brihanmumbai Municipal Corporation (BMC) | Ritu Tawde (BJP) | Confirmed current. since → February 2026 | update | [Wikipedia][W_TAWDE] · [Business Standard][BS_TAWDE] |
| Municipal Commissioner, BMC (IAS) | Ashwini Bhide | Confirmed current. since → 1 April 2026 | update | [Wikipedia][W_BHIDE] · [Elets eGov][ELETS_BHIDE] |
| Principal Judge, City Civil & Sessions Court | Principal Judge | Role-as-name placeholder. | deactivate (placeholder) | — |
| Chief Fire Officer, Mumbai Fire Brigade | Chief Fire Officer | Role-as-name placeholder. | deactivate (placeholder) | — |
| Executive Health Officer, BMC — Public Health | Executive Health Officer | Role-as-name placeholder. | deactivate (placeholder) | — |

### Lucknow (Uttar Pradesh)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Chief Minister of Uttar Pradesh | Yogi Adityanath (BJP) | Confirmed current. since → 19 March 2017 | update | [Wikipedia][W_CMS] · [DNA India][DNA_UPDYCM] |
| Governor of Uttar Pradesh | Anandiben Patel | Confirmed current. since → 29 July 2019 | update | [upgovernor.gov.in][UPGOV] · [Wikipedia][W_GOVS] |
| Deputy Chief Minister of Uttar Pradesh | — (missing) | Keshav Prasad Maurya (BJP), since 19 March 2017. Deputy Chief Minister; missing. | add | [Wikipedia][W_UPCOM] · [DNA India][DNA_UPDYCM] |
| Deputy Chief Minister of Uttar Pradesh | — (missing) | Brajesh Pathak (BJP), since 25 March 2022. Deputy Chief Minister (also MLA, Lucknow Cantt); missing. | add | [Wikipedia][W_UPCOM] · [DNA India][DNA_UPDYCM] |
| Commissioner of Police, Lucknow | Amarendra Singh Sengar, IPS | Amarendra Kumar Sengar was promoted to DG (Intelligence); Tarun Gauba is Lucknow CP since 29 July 2026. | deactivate | [Wikipedia][W_LKOPOLICE] · [Indian Bureaucracy][IB_GAUBA] |
| Commissioner of Police, Lucknow | — (missing) | Tarun Gauba, since 29 July 2026. New Police Commissioner. | add | [Wikipedia][W_LKOPOLICE] · [Indian Bureaucracy][IB_GAUBA] |
| District Magistrate, Lucknow | Vishak G Iyer, IAS | Confirmed current. since → January 2026 | update | [lucknow.nic.in][LKO_NIC_DM] · [Lucknow Wants][LKOWANTS_DM] |
| MLA, Bakshi Ka Talab | Yogesh Shukla (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Lucknow Cantt | Brijesh Pathak (BJP) | Name misspelt. name → Brajesh Pathak | update | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Lucknow Central | Ravidas Mehrotra (SP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Lucknow North | Dr. Neeraj Bora (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Lucknow West | Armaan Khan (SP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Malihabad | Jai Devi (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Mohanlalganj | Amaresh Kumar (BJP) | Name misspelt. name → Amresh Kumar | update | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| MLA, Sarojini Nagar | Rajeshwar Singh (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_UP18] · [IndiaVotes][IV_UP22] |
| Member of Parliament (Lok Sabha) | Rajnath Singh (BJP) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_UP] · [ETV Bharat][ETV_RAJNATH] |
| Member of Parliament (Lok Sabha) | — (missing) | R. K. Chaudhary (SP), since 2024. MP for Mohanlalganj (part of Lucknow district); missing. | add | [IndiaVotes][IV_LS_UP] · [The Quint][QUINT_MLG] |

### Hyderabad (Telangana)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Telangana | Jishnu Dev Varma | Moved to Maharashtra in March 2026; Telangana's Governor is Shiv Pratap Shukla. | deactivate | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] |
| Governor of Telangana | — (missing) | Shiv Pratap Shukla, since March 2026. New Governor. | add | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] |
| Chief Minister of Telangana | A. Revanth Reddy (INC) (row inactive) | Chief Minister row was switched off by mistake; Revanth Reddy is CM. row reactivated; since → 7 December 2023 | update | [Wikipedia][W_CMS] · [Telangana Today][TT_BHATTI] |
| Deputy Chief Minister of Telangana | — (missing) | Mallu Bhatti Vikramarka (INC), since 7 December 2023. Deputy Chief Minister; missing. | add | [Wikipedia][W_BHATTI] · [Telangana Today][TT_BHATTI] |
| Commissioner of Police, Hyderabad | V.C. Sajjanar, IPS | Confirmed current. since → September 2025 | update | [Telangana Today][TT_SAJJANAR] · [ANI][ANI_SAJJANAR26] |
| Collector & District Magistrate, Hyderabad | Dasari Harichandana, IAS | Replaced as Collector by Priyanka Ala on 27 April 2026. | deactivate | [Deccan Chronicle][DC_PRIYANKA] · [APAC News][APAC_PRIYANKA] |
| Collector & District Magistrate, Hyderabad | — (missing) | Dr. Priyanka Ala, since April 2026. Collector since April 2026. | add | [hyderabad.telangana.gov.in][HYD_GOV] · [Deccan Chronicle][DC_PRIYANKA] |
| MLA, Amberpet | R. Prakash Reddy (INC) | Amberpet's 2023 winner is Kaleru Venkatesh (BRS). | deactivate | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Amberpet | — (missing) | Kaleru Venkatesh (BRS), since 2023. Amberpet MLA. | add | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Bahadurpura | Mohd. Mubeen (AIMIM) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Chandrayangutta | Akbaruddin Owaisi (AIMIM) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Charminar | Mumtaz Ahmed Khan (AIMIM) | Charminar's 2023 winner is Mir Zulfeqar Ali (AIMIM). | deactivate | [Wikipedia][W_TG3] · [Siasat][SIASAT_CHARMINAR] |
| MLA, Charminar | — (missing) | Mir Zulfeqar Ali (AIMIM), since 2023. Charminar MLA. | add | [Wikipedia][W_TG3] · [Siasat][SIASAT_CHARMINAR] |
| MLA, Goshamahal | T. Raja Singh Lodh (BJP) | Left the BJP (resignation accepted 11 July 2025). party → IND | update | [Deccan Herald][DH_RAJA] · [India TV][ITV_RAJA] |
| MLA, Jubilee Hills | Maganti Gopinath (INC) | Died 8 June 2025; V. Naveen Yadav (INC) won the Nov 2025 by-election. | deactivate | [Wikipedia][W_NAVEEN] · [The Federal][FED_NAVEEN] |
| MLA, Jubilee Hills | — (missing) | V. Naveen Yadav (INC), since 2025 (by-election). Jubilee Hills MLA. | add | [Wikipedia][W_NAVEEN] · [The Federal][FED_NAVEEN] |
| MLA, Karwan | Kausar Mohiuddin (AIMIM) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Khairatabad | Danam Nagender (INC) | Disqualified (High Court 18 Sep 2026, upheld by Supreme Court 24 Sep 2026); seat vacant. | deactivate | [India TV][ITV_DANAM] · [Siasat][SIASAT_DANAM] |
| MLA, Malakpet | Ahmed bin Abdullah Balala (AIMIM) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_TG3] · [NewsMeter][NEWSMETER_AIMIM] |
| MLA, Musheerabad | M. Padma Devender Reddy (INC) | Musheerabad's 2023 winner is Muta Gopal (BRS). | deactivate | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Musheerabad | — (missing) | Muta Gopal (BRS), since 2023. Musheerabad MLA. | add | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Nampally | Feroz Khan (INC) | Nampally's 2023 winner is Mohammad Majid Hussain (AIMIM). | deactivate | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Nampally | — (missing) | Mohammad Majid Hussain (AIMIM), since 2023. Nampally MLA. | add | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Rajendranagar | T. Prakash Goud (INC) | Rajendranagar is in Ranga Reddy district, not Hyderabad district. | deactivate | [Wikipedia][W_RAJENDRANAGAR] · [hyderabad.telangana.gov.in][HYD_GOV_AC] |
| MLA, Sanathnagar | Arikepudi Gandhi (INC) | He is MLA for Serilingampally; Sanathnagar is Talasani Srinivas Yadav (BRS). | deactivate | [Wikipedia][W_TG3] · [Oneindia][OI_SANATH] |
| MLA, Sanathnagar | — (missing) | Talasani Srinivas Yadav (BRS), since 2023. Sanathnagar MLA. | add | [Wikipedia][W_TG3] · [Oneindia][OI_SANATH] |
| MLA, Secunderabad | T. Padma Rao Goud (INC) | Party is BRS, not INC. party → BRS | update | [Wikipedia][W_TG3] · [The News Minute][TNM_PADMARAO] |
| MLA, Yakutpura | Mohammed Mushtaq Malik (AIMIM) | Yakutpura's 2023 winner is Jaffar Hussain (AIMIM). | deactivate | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Yakutpura | — (missing) | Jaffar Hussain (AIMIM), since 2023. Yakutpura MLA. | add | [Wikipedia][W_TG3] · [IndiaVotes][IV_TG23] |
| MLA, Secunderabad Cantonment | — (missing) | Sri Ganesh (INC), since 2024 (by-election). Missing MLA. | add | [Telangana Today][TT_SRIGANESH] · [Wikipedia][W_SRIGANESH] |
| Member of Parliament (Lok Sabha) | Asaduddin Owaisi (AIMIM) | Same person, confirmed current. | keep (re-verified) | [IndiaVotes][IV_LS_HYD] · [India TV][ITV_OWAISI] |
| Member of Parliament (Lok Sabha) — Union Minister of Coal and Mines | — (missing) | G. Kishan Reddy (BJP), since 2019. MP for Secunderabad, which covers 8 of Hyderabad district's 15 seats; missing. | add | [IndiaVotes][IV_LS_SEC] · [coal.gov.in][COAL_KISHAN] |

### Chennai (Tamil Nadu)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of Tamil Nadu | Rajendra Vishwanath Arlekar | Correct; he holds Tamil Nadu as additional charge (Governor of Kerala). role → Governor of Tamil Nadu (additional charge) | update | [The Quint][QUINT_GOVS] · [News Today][NTN_TNGOV] |
| Chief Minister of Tamil Nadu | — (missing) | C. Joseph Vijay (TVK), since 10 May 2026. Chief Minister since 10 May 2026; missing. | add | [Wikipedia][W_VIJAYMIN] · [The News Minute][TNM_AMALRAJ] |
| Chief Secretary | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Commissioner, Greater Chennai Corporation | GCC Commissioner | Role-as-name placeholder. | deactivate (placeholder) | — |
| Deputy Commissioner of Police (Central) | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| District Collector, Chennai | — (missing) | S. Malathi Helen, since May 2026. Collector; missing. | add | [chennai.nic.in][CHENNAI_NIC_COLL] · [DT Next][DTNEXT_COLL] |
| Commissioner of Police, Greater Chennai | — (missing) | A. Amalraj, since May 2026. Police Commissioner; missing. | add | [The News Minute][TNM_AMALRAJ] · [ThePrint][PRINT_AMALRAJ26] |
| MLA, Anna Nagar | Pongalur N. Palanisamy (DMK) | Anna Nagar's 2026 winner is V. K. Ramkumar (TVK). | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Chepauk-Triplicane | Udhayanidhi Stalin (DMK) | Re-elected 2026. role → MLA, Chepauk-Thiruvallikeni; constituency → Chepauk-Thiruvallikeni | update | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Harbour | P.K. Sekar Babu (DMK) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Kolathur | M.K. Stalin (DMK) | Lost Kolathur in 2026 to V. S. Babu (TVK). | deactivate | [TNElectionResult][TNER_CHENNAI] · [BW Businessworld][BW_KOLATHUR] |
| MLA, Purasawalkam | J. Anbazhagan (DMK) | Purasawalkam is not one of Chennai's 16 constituencies. | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Saidapet | Ma. Subramanian (DMK) | Saidapet's 2026 winner is M. Arul Prakasam (TVK). | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Thousand Lights | N. Ezhilan (DMK) | Thousand Lights' 2026 winner is J. C. D. Prabhakar (TVK). | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Tiruchirappalli West (Cabinet) | K.N. Nehru (DMK) | Tiruchirappalli West is not in Chennai. | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Villivakkam | R. Rajendran (DMK) | Villivakkam's 2026 winner is Aadhav Arjuna (TVK). | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Virugambakkam | S. Kamala Kannan (DMK) | Virugambakkam's 2026 winner is R. Sabarinathan (TVK). | deactivate | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Dr. Radhakrishnan Nagar | — (missing) | N. Marie Wilson (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Perambur | — (missing) | C. Joseph Vijay (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Kolathur | — (missing) | V. S. Babu (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Villivakkam | — (missing) | Aadhav Arjuna (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Thiru-Vi-Ka-Nagar | — (missing) | M. R. Pallavi (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Egmore | — (missing) | A. Rajmohan (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Royapuram | — (missing) | K. V. Vijay Damu (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Thousand Lights | — (missing) | J. C. D. Prabhakar (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Anna Nagar | — (missing) | V. K. Ramkumar (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Virugambakkam | — (missing) | R. Sabarinathan (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Saidapet | — (missing) | M. Arul Prakasam (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Thiyagarayanagar | — (missing) | N. Anand (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Mylapore | — (missing) | P. Venkataramanan (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| MLA, Velachery | — (missing) | R. Kumar (TVK), since 2026. 2026 winner. | add | [Wikipedia][W_TN17] · [TNElectionResult][TNER_CHENNAI] |
| Member of Parliament | Thamizhachi Thangapandian (DMK) | Confirmed current. role → Member of Parliament (Lok Sabha) | update | [IndiaVotes][IV_LS_CHS] · [Wikipedia][W_CHS] |
| Member of Parliament | Kalanidhi Veeraswamy (DMK) | Confirmed current. role → Member of Parliament (Lok Sabha) | update | [IndiaVotes][IV_LS_CHN] · [Wikipedia][W_KALANIDHI] |
| Member of Parliament | Dayanidhi Maran (DMK) | Confirmed current. role → Member of Parliament (Lok Sabha) | update | [IndiaVotes][IV_LS_CHC] · [Deccan Herald][DH_DAYANIDHI] |
| Mayor of Chennai | R. Priya (DMK) | Confirmed current. since → March 2022 | update | [Wikipedia][W_PRIYA] · [DT Next][DTNEXT_PRIYA] |
| Chairman, Chennai Port Authority | Chennai Port Authority Chairman | Role-as-name placeholder. | deactivate (placeholder) | — |
| Director, Solid Waste Management | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Principal Judge, City Civil Court | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Superintending Engineer, Chennai | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |

### Kolkata (West Bengal)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | Narendra Modi (BJP) | Confirmed current. since → 26 May 2014 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Governor of West Bengal | C.V. Ananda Bose | Replaced by R. N. Ravi in March 2026. | deactivate | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] |
| Governor of West Bengal | — (missing) | R. N. Ravi, since March 2026. New Governor. | add | [Wikipedia][W_GOVS] · [The Quint][QUINT_GOVS] |
| Chief Minister of West Bengal | Mamata Banerjee (TMC) | BJP won the 2026 election; Suvendu Adhikari is CM since 9 May 2026. | deactivate | [Wikipedia][W_SUVMIN] · [Sunday Guardian][SG_SUV] |
| Chief Minister of West Bengal | — (missing) | Suvendu Adhikari (BJP), since 9 May 2026. Chief Minister. | add | [Wikipedia][W_SUVMIN] · [Sunday Guardian][SG_SUV] |
| Chief Secretary, West Bengal | B.P. Gopalika | No longer Chief Secretary (replaced in March 2026, and again in May 2026). | deactivate | [Deccan Herald][DH_WBCS] · [ThePrint][PRINT_WBCS] |
| Commissioner of Police | Vineet Goyal | Left in Sept 2024; Ajay Kumar Nand is CP since 17 March 2026. | deactivate | [Wikipedia][W_KOLCP] · [DD News][DD_VERMA] |
| Commissioner of Police, Kolkata | — (missing) | Ajay Kumar Nand, since March 2026. Police Commissioner. | add | [Wikipedia][W_KOLCP] · [The Statesman][STATESMAN_NAND] |
| Deputy Commissioner of Police (Port Division) | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| MLA, Ballygunge | Babul Supriyo (TMC) | Ballygunge's 2026 winner is Sovandeb Chattopadhyay (TMC). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Beleghata | Paresh Pal (TMC) | Beleghata's 2026 winner is Kunal Ghosh (TMC). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Bhawanipore | Mamata Banerjee (TMC) | Lost Bhabanipur in 2026 to Suvendu Adhikari (BJP). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Chowranghee | Nayna Bandyopadhyay (TMC) | Re-elected 2026. role → MLA, Chowrangee; constituency → Chowrangee | update | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Dum Dum | Bratya Basu (TMC) | Dum Dum is in North 24 Parganas, not Kolkata (and he lost it in 2026). | deactivate | [Wikipedia][W_DUMDUM] · [Oneindia][OI_WB26] |
| MLA, Entally | Swarna Kamal Saha (TMC) | Entally's 2026 winner is Sandipan Saha (TMC). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Jorasanko | Vivek Gupta (TMC) | Jorasanko's 2026 winner is Vijay Ojha (BJP). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Kashipur-Belgachhia | Atin Ghosh (TMC) | Kashipur-Belgachhia's 2026 winner is Ritesh Tiwari (BJP). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Kolkata Port | Firhad Hakim (TMC) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Rashbehari | Debasish Kumar (TMC) | Rashbehari's 2026 winner is Swapan Dasgupta (BJP). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Shyampukur | Swatilekha Sen (TMC) | Shyampukur's 2026 winner is Purnima Chakraborty (BJP). | deactivate | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Bhabanipur | — (missing) | Suvendu Adhikari (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Rashbehari | — (missing) | Swapan Dasgupta (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Ballygunge | — (missing) | Sovandeb Chattopadhyay (TMC), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Entally | — (missing) | Sandipan Saha (TMC), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Beleghata | — (missing) | Kunal Ghosh (TMC), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Jorasanko | — (missing) | Vijay Ojha (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Shyampukur | — (missing) | Purnima Chakraborty (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Maniktala | — (missing) | Tapas Roy (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| MLA, Kashipur-Belgachhia | — (missing) | Ritesh Tiwari (BJP), since 2026. 2026 winner. | add | [Wikipedia][W_WB18] · [Oneindia][OI_WB26] |
| Member of Parliament | Mala Roy (TMC) | Confirmed current. role → Member of Parliament (Lok Sabha) | update | [IndiaVotes][IV_LS_KD] · [Wikipedia][W_KOLDAK] |
| Member of Parliament | Sudip Bandyopadhyay (TMC) | Confirmed current. role → Member of Parliament (Lok Sabha) | update | [IndiaVotes][IV_LS_KU] · [Wikipedia][W_SUDIP] |
| Mayor | Firhad Hakim (TMC) | Resigned as Mayor on 5 June 2026; post vacant until the KMC election. | deactivate | [Wikipedia][W_FIRHAD] · [India TV][ITV_FIRHAD] |
| Chief Justice, Calcutta High Court | Justice T.S. Sivagnanam | Retired 15 Sep 2025; Chief Justice is R. V. Ghuge since 9 Sep 2026. | deactivate | [SCC Online][SCC_SIVAGNANAM] · [Wikipedia][W_CALHC] |
| Chief Justice, Calcutta High Court | — (missing) | Justice Ravindra Vithalrao Ghuge, since 9 September 2026. New Chief Justice. | add | [ETV Bharat][ETV_GHUGE] · [Wikipedia][W_CALHC] |
| Chairman, Kolkata Port Authority | Kolkata Port Authority Chairman | Role-as-name placeholder. | deactivate (placeholder) | — |
| Director, Solid Waste Management | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| CMOH, Kolkata | Chief Medical Officer of Health | Role-as-name placeholder. | deactivate (placeholder) | — |

### New Delhi (Delhi)

| Office | In the database now | Verified, Sept 2026 | Decision | Sources |
|---|---|---|---|---|
| President of India | Droupadi Murmu | Confirmed current. since → 25 July 2022 | update | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Prime Minister | — (missing) | Narendra Modi (BJP), since 26 May 2014. Missing. | add | [Wikipedia][W_MURMU] · [News24][N24_BDAY] |
| Lieutenant Governor of Delhi | V.K. Saxena | Replaced by Taranjit Singh Sandhu on 11 March 2026 (moved to Ladakh). | deactivate | [Wikipedia][W_SANDHU] · [The Quint][QUINT_GOVS] |
| Lieutenant Governor of Delhi | — (missing) | Taranjit Singh Sandhu, since 11 March 2026. New Lieutenant Governor. | add | [Wikipedia][W_SANDHU] · [The Quint][QUINT_GOVS] |
| Chief Minister of Delhi | Rekha Gupta (BJP) | Confirmed current. since → 20 February 2025 | update | [Wikipedia][W_CMS] · [Social News XYZ][SNX_REKHA] |
| Chief Secretary, GNCTD | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Deputy Commissioner of Police, New Delhi | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| MLA, New Delhi | Arvind Kejriwal (AAP) | Lost New Delhi in Feb 2025 to Parvesh Verma (BJP). | deactivate | [Business Standard][BS_NDLS] · [Wikipedia][W_DL8] |
| MLA, New Delhi | — (missing) | Parvesh Sahib Singh Verma (BJP), since 2025. New Delhi MLA. | add | [Business Standard][BS_NDLS] · [Wikipedia][W_DL8] |
| MLA, Kasturba Nagar | Alka Lamba (INC) | Kasturba Nagar's 2025 winner is Neeraj Basoya (BJP). | deactivate | [Zee News][ZEE_KASTURBA] · [Wikipedia][W_KASTURBA] |
| MLA, Kasturba Nagar | — (missing) | Neeraj Basoya (BJP), since 2025. Kasturba Nagar MLA. | add | [Zee News][ZEE_KASTURBA] · [Wikipedia][W_KASTURBA] |
| Member of Parliament (Lok Sabha) | Bansuri Swaraj (BJP) | Same person, confirmed current. | keep (re-verified) | [Wikipedia][W_18LS] · [PRS India][PRS_BANSURI] |
| Sub-Divisional Magistrate, New Delhi | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| Tehsildar, New Delhi | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| District & Sessions Judge, Patiala House Courts | District & Sessions Judge, Patiala House | Role-as-name placeholder. | deactivate (placeholder) | — |
| CEO, Delhi Jal Board | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| District Education Officer, New Delhi | [Name Not Available] | Placeholder row: no person named. | deactivate (placeholder) | — |
| District Food & Supplies Controller, New Delhi | District Food Controller, New Delhi | Role-as-name placeholder. | deactivate (placeholder) | — |

## Sources

Every link below was opened on 27 Sep 2026. The labels match the `SOURCES` keys in the script.

[W_MURMU]: https://en.wikipedia.org/wiki/Presidency_of_Droupadi_Murmu
[N24_BDAY]: https://news24online.com/india/president-droupadi-murmu-greets-pm-modi-on-birthday-says-he-established-many-new-benchmarks-of-good-governance/926646
[W_GOVS]: https://en.wikipedia.org/wiki/List_of_current_Indian_governors
[QUINT_GOVS]: https://www.thequint.com/news/breaking-news/president-appoints-new-governors-major-reshuffle-india
[W_CMS]: https://en.wikipedia.org/wiki/List_of_current_Indian_chief_ministers
[W_18LS]: https://en.wikipedia.org/wiki/List_of_members_of_the_18th_Lok_Sabha
[W_KA_COM]: https://en.wikipedia.org/wiki/Karnataka_Council_of_Ministers
[BS_DKS]: https://www.business-standard.com/india-news/d-k-shivakumar-oath-as-karnataka-chief-minister-126060300894_1.html
[INC_DKS]: https://inc.in/congress-sandesh/others/d-k-shivakumar-sworn-in-as-25th-chief-minister-of-karnataka
[W_KA16]: https://en.wikipedia.org/wiki/16th_Karnataka_Assembly
[IV_KA23]: https://www.indiavotes.com/vidhan-sabha/karnataka/2023/
[W_TNARASIPUR]: https://en.wikipedia.org/wiki/T._Narasipur_Assembly_constituency
[W_KANAKAPURA]: https://en.wikipedia.org/wiki/Kanakapura_Assembly_constituency
[BS_EXPEL]: https://www.business-standard.com/india-news/bjp-expels-two-karnataka-mlas-for-6-years-over-anti-party-activities-125052700970_1.html
[IV_LS_MANDYA]: https://www.indiavotes.com/lok-sabha/2024/karnataka/mandya/
[IV_LS_MYSORE]: https://www.indiavotes.com/lok-sabha/2024/karnataka/mysore/
[IV_LS_CHAMARAJANAGAR]: https://www.indiavotes.com/lok-sabha/2024/karnataka/chamarajanagar/
[IV_LS_BLR_N]: https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-north/
[IV_LS_BLR_C]: https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-central/
[IV_LS_BLR_S]: https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-south/
[IV_LS_BLR_R]: https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-rural/
[IV_LS_CHIKKABALLAPUR]: https://www.indiavotes.com/lok-sabha/2024/karnataka/chikkballapur/
[PIB_HDK]: https://www.pib.gov.in/PressReleasePage.aspx?PRID=2206267&reg=3&lang=2
[NIMSME_SHOBHA]: https://www.nimsme.gov.in/news-article/ms-shobha-karandlaje-hon-ble-union-minister-of-state-for-msme-and-labour-employment-govt-of-india-inaugurated-the-vendor-development-programme-on-14-july-2026-at-ni-msme-hyderabad
[MANDYA_NIC_DC]: https://mandya.nic.in/en/whoswho/deputy-commissioner/
[SOM_MELUKOTE]: https://starofmysore.com/security-arrangements-in-place-for-vice-presidents-visit-to-melukote/
[SOM_IPS_JAN26]: https://starofmysore.com/major-changes-in-ips-ias-postings/
[HANS_SHOBHARANI]: https://www.thehansindia.com/karnataka/ugadi-flex-row-in-mandya-sp-shobharani-urges-public-not-to-use-her-photos-1058710
[MYSORE_NIC_DC]: https://mysore.nic.in/en/whoswho/lakshmikanth-reddy/
[SOM_DASARA26]: https://starofmysore.com/dasara-gold-cards-to-carry-seat-nos-dc/
[MYSORE_NIC_SP]: https://mysore.nic.in/en/whoswho/shri-mallikarjun-baldandi-ips/
[UDAYAVANI_SP]: https://udayavani.com/karnataka/no-restrictions-traditional-routes-ganesh-processions-mysuru-sp-mallikarjun-baladandi-388617?lang=en
[MYSORE_NIC_CP]: https://mysore.nic.in/en/whoswho/sri-r-chethan-i-p-s/
[SOM_LATKAR26]: https://starofmysore.com/first-police-officers-annual-conference-2026-sessions-deliberate-various-laws-procedures/
[SOM_MCC_COUNCIL]: https://starofmysore.com/council-tenure-over-silence-rules-mcc-corridor/
[W_MCC]: https://en.wikipedia.org/wiki/Mysore_City_Corporation
[DH_ZP]: https://www.deccanherald.com/india/karnataka/centre-withholds-rs-1279-crore-from-karnataka-for-not-holding-zilla-taluk-panchayat-polls-3833080
[HANS_ZP]: https://www.thehansindia.com/karnataka/panchayat-elections-unlikely-anytime-soon-as-govt-seeks-more-time-from-hc-1084016
[DH_BU_DC]: https://www.deccanherald.com/india/karnataka/bengaluru/bengaluru-deputy-commissioner-jagadeesha-g-shifted-as-central-city-corporation-commissioner-4029209
[IANS_BU_DC]: https://x.com/ians_india/status/2062913053143048450
[BS_SEEMANT]: https://www.business-standard.com/india-news/seemant-kumar-singh-takes-charge-as-new-bengaluru-police-commissioner-125060600247_1.html
[DH_SEEMANT26]: https://www.deccanherald.com/india/karnataka/bengaluru/strict-action-against-violators-during-new-year-2026-celebrations-bengaluru-commissioner-3845895
[W_FADNAVIS3]: https://en.wikipedia.org/wiki/Third_Fadnavis_ministry
[AIR_SUNETRA]: https://www.newsonair.gov.in/sunetra-pawar-elected-as-ncp-legislature-party-leader-after-ajit-pawars-demise
[GULF_SUNETRA]: https://gulfnews.com/world/asia/india/sunetra-pawar-to-take-oath-as-maharashtra-deputy-cm-today-1.500426831
[ZEE_BARAMATI]: https://zeenews.india.com/india/live-updates/baramati-results-bypoll-2026-sunetra-pawar-ncp-ajit-pawar-maharashtra-winner-3042999.html
[INDIACOM_BARAMATI]: https://www.india.com/news/india/baramati-assembly-bypolls-results-2026-live-updates-constituency-seats-vote-counting-shiv-sena-congress-bjp-winners-sunetra-pawar-wife-of-ajit-pawar-maharashtra-bypoll-election-news-8401320/
[PMRDA_SHINDE]: https://www.pmrda.gov.in/en/hon-deputy-chief-minister-minister-udd-shri-eknath-sambhaji-shinde-2/
[FPJ_TRIPATHI]: https://www.freepressjournal.in/mumbai/justice-mahesh-chandra-tripathi-sworn-in-as-chief-justice-of-bombay-high-court-know-all-about-him-mumbai-news
[LIVELAW_TRIPATHI]: https://www.livelaw.in/high-court/bombay-high-court/justice-mahesh-chandra-tripathi-sworn-chief-justice-bombay-high-court-549317
[IV_MH24]: https://www.indiavotes.com/vidhan-sabha/maharashtra/2024/
[W_MH15]: https://en.wikipedia.org/wiki/15th_Maharashtra_Legislative_Assembly
[ETV_BANDRAE]: https://www.etvbharat.com/en/!bharat/maharashtra-assembly-polls-2024-zeeshan-siddique-and-varun-sardesai-in-bandra-east-seat-enn24112204417
[W_VANDREW]: https://en.wikipedia.org/wiki/Vandre_West_Assembly_constituency
[ZEE_VANDREW]: https://zeenews.india.com/india/vandre-west-vidhan-sabha-chunav-result-2024-live-winner-and-loser-candidate-ashish-shelar-vs-asif-zakaria-total-votes-margin-bjp-congress-shiv-sena-ubt-ncp-sharad-pawar-eci-maharashtra-assembly-2823465.html
[LOKTEJ_FADNAVIS]: https://english.loktej.com/article/32898/maharashtra-chief-minister-devendra-fadnavis-to-inaugurate-boiler-india-2026
[MUMCITY_COLL]: https://mumbaicity.gov.in/en/whoswho/collector-and-district-magistrate/
[PRINT_GOYAL]: https://theprint.in/india/anchal-goyal-new-collector-for-mumbai-city-district/2553712/
[MUMSUB_COLL]: https://mumbaisuburban.gov.in/en/whoswho/district-collector-and-magistrate/
[APAC_KATIYAR]: https://apacnewsnetwork.com/2026/05/modern-setu-transforming-citizen-services-through-smart-governance-in-mumbai-suburban/
[W_MUMCP]: https://en.wikipedia.org/wiki/Commissioner_of_the_Greater_Mumbai_Police
[ELETS_BHARTI]: https://egov.eletsonline.com/2025/04/deven-bharti-appointed-mumbai-police-commissioner/
[W_BHIDE]: https://en.wikipedia.org/wiki/Ashwini_Bhide
[ELETS_BHIDE]: https://egov.eletsonline.com/2026/03/ias-ashwini-bhide-becomes-first-woman-municipal-commissioner-of-bmc/
[W_TAWDE]: https://en.wikipedia.org/wiki/Ritu_Tawde
[BS_TAWDE]: https://www.business-standard.com/india-news/who-is-ritu-tawde-mumbai-mayor-elections-bjp-shiv-sena-bmc-sanjay-ghadi-126021101013_1.html
[IV_LS_MUM_N]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north/
[IV_LS_MUM_NW]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-west/
[IV_LS_MUM_NE]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-east/
[IV_LS_MUM_NC]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-central/
[IV_LS_MUM_SC]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-south-central/
[IV_LS_MUM_S]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-south/
[W_MUM_NW]: https://en.wikipedia.org/wiki/Mumbai_North_West_Lok_Sabha_constituency
[W_MUM_NC]: https://en.wikipedia.org/wiki/Mumbai_North_Central_Lok_Sabha_constituency
[W_MUM_NE]: https://en.wikipedia.org/wiki/Mumbai_North_East_Lok_Sabha_constituency
[W_MUM_SC]: https://en.wikipedia.org/wiki/Mumbai_South_Central_Lok_Sabha_constituency
[W_MH_LS24]: https://en.wikipedia.org/wiki/2024_Indian_general_election_in_Maharashtra
[IV_LS_PUNE]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/pune/
[IV_LS_BARAMATI]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/baramati/
[IV_LS_SHIRUR]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/shirur/
[IV_LS_MAVAL]: https://www.indiavotes.com/lok-sabha/2024/maharashtra/maval/
[PUNE_GOV_COLL]: https://pune.gov.in/en/whoswho/shri-saurabh-rao/
[FPJ_DUDI]: https://www.freepressjournal.in/pune/pune-district-collector-jitendra-dudi-reviews-hinjawadi-infrastructure-issues-20-30-more-pmpml-buses-planned
[W_PUNECP]: https://en.wikipedia.org/wiki/Commissioner_of_Pune_City_Police
[PUNEKAR_CP]: https://www.punekarnews.in/pune-ganesh-visarjan-2026-over-10000-cops-deployed-safety-prioritised-over-procession-speed-says-cp-amitesh-kumar/
[FPJ_MAYORS]: https://www.freepressjournal.in/pune/interesting-pune-mayor-manjusha-nagpure-pimpri-chinchwad-mayor-ravi-landge-were-both-elected-unopposed-in-civic-polls
[BRIDGE_LANDGE]: https://www.thebridgechronicle.com/pune/ravi-landge-pimpri-chinchwad-mayor-deputy-mayor-race-agn97
[APAC_SURYAWANSHI]: https://apacnewsnetwork.com/2026/03/ias-dr-vijay-suryawanshi-appointed-new-commissioner-of-pimpri-chinchwad-municipal-corporation/
[FPJ_SURYAWANSHI]: https://www.freepressjournal.in/pune/sewage-water-revenue-new-pcmc-commissioner-vijay-suryawanshi-lays-out-massive-city-overhaul-plan-in-pimpri-chinchwad
[W_UPCOM]: https://en.wikipedia.org/wiki/Uttar_Pradesh_Council_of_Ministers
[DNA_UPDYCM]: https://www.dnaindia.com/india/report-yogi-adityanath-20-swearing-in-keshav-prasad-maurya-and-brajesh-pathak-to-be-deputy-cms-of-uttar-pradesh-2942030
[UPGOV]: https://upgovernor.gov.in/en
[W_UP18]: https://en.wikipedia.org/wiki/18th_Uttar_Pradesh_Assembly
[IV_UP22]: https://www.indiavotes.com/vidhan-sabha/uttar-pradesh/2022/
[LKO_NIC_DM]: https://lucknow.nic.in/dm-profile/vishak-g/
[LKOWANTS_DM]: https://www.lucknowwants.com/trending-now/who-is-the-new-dm-of-lucknow-all-info-about-vishak-g-iyer
[W_LKOPOLICE]: https://en.wikipedia.org/wiki/Lucknow_Police
[IB_GAUBA]: https://www.indianbureaucracy.com/tarun-gauba-ips-appointed-cp-lucknow-up/
[IV_LS_UP]: https://www.indiavotes.com/lok-sabha/uttar-pradesh/2024/
[QUINT_MLG]: https://www.thequint.com/news/mohanlalganj-election-result-2024-live-updates-counting-of-votes-uttar-pradesh-lok-sabha-seat-latest-news
[ETV_RAJNATH]: https://www.etvbharat.com/en/!state/lok-sabha-election-2024-result-uttar-pradesh-lucknow-seat-winner-rajnath-singh-bjp-ravi-das-mehrotra-samajwadi-party-sarvar-malik-bsp-latest-update-enn24060305783
[W_TG3]: https://en.wikipedia.org/wiki/3rd_Telangana_Assembly
[IV_TG23]: https://www.indiavotes.com/vidhan-sabha/telangana/2023/
[NEWSMETER_AIMIM]: https://newsmeter.in/hyderabad/aimim-wins-7-out-of-9-seats-retains-hold-over-old-city-721471
[SIASAT_CHARMINAR]: https://www.siasat.com/ex-hyderabad-mayor-mir-zulfiqar-wins-charminar-seat-for-aimim-2926381/
[W_NAVEEN]: https://en.wikipedia.org/wiki/Naveen_Yadav
[FED_NAVEEN]: https://thefederal.com/category/elections-2025/congress-wins-jubilee-hills-bypoll-election-against-brs-revanth-reddy-v-naveen-yadav-bihar-elections-216144
[DH_RAJA]: https://www.deccanherald.com/india/telangana/bjp-accepts-resignation-of-goshamahal-mla-t-raja-singh-lodh-over-state-unit-chief-selection-3626095
[ITV_RAJA]: https://www.indiatvnews.com/telangana/hyderabad-bjp-accepts-telangana-mla-t-raja-singh-s-resignation-calls-his-remarks-irrelevant-2025-07-11-998404
[ITV_DANAM]: https://www.indiatvnews.com/news/india/supreme-court-s-setback-for-danam-nagender-as-plea-against-disqualification-as-telangana-mla-dismissed-2026-09-24-1055152
[SIASAT_DANAM]: https://www.siasat.com/sc-upholds-danam-nagenders-disqualification-as-khairatabad-mla-3547373/
[TT_SRIGANESH]: https://telanganatoday.com/bypoll-congress-wrests-secunderabad-cantonment-from-brs
[W_SRIGANESH]: https://en.wikipedia.org/wiki/Sri_Ganesh_(politician)
[W_RAJENDRANAGAR]: https://en.wikipedia.org/wiki/Rajendranagar_Assembly_constituency
[TT_SAJJANAR]: https://telanganatoday.com/v-c-sajjanar-takes-charge-as-new-hyderabad-police-commissioner
[ANI_SAJJANAR26]: https://aninews.in/news/entertainment/bollywood/after-smooth-ganesh-immersion-hyderabad-cp-sajjanar-joins-police-personnel-in-celebration-dance16020260926183541/
[W_BHATTI]: https://en.wikipedia.org/wiki/Mallu_Bhatti_Vikramarka
[TT_BHATTI]: https://telanganatoday.com/bhatti-vikramarka-deputy-cm-seniors-in-first-list-for-telangana-cabinet
[HYD_GOV_AC]: https://hyderabad.telangana.gov.in/about-district/constituencies/
[HYD_GOV]: https://hyderabad.telangana.gov.in/
[DC_PRIYANKA]: https://www.deccanchronicle.com/southern-states/telangana/priyanka-ala-appointed-hyderabad-collector-1952782
[APAC_PRIYANKA]: https://apacnewsnetwork.com/2026/04/telangana-government-transfers-30-ias-officers-ias-priyanka-ala-named-hyderabad-collector/
[OI_SANATH]: https://www.oneindia.com/sanathnagar-assembly-elections-ts-62/
[TNM_PADMARAO]: https://www.thenewsminute.com/telangana/brs-sitting-mla-t-padmarao-goud-to-contest-lok-sabha-polls-from-secunderabad
[IV_LS_HYD]: https://www.indiavotes.com/lok-sabha/2024/telangana/hyderabad/
[ITV_OWAISI]: https://www.indiatvnews.com/telangana/hyderabad-hyderabad-lok-sabha-election-results-202-aimim-asaduddin-owaisi-bjp-madhavi-latha-brs-congress-vote-counting-winning-losing-candidates-latest-updates-2024-06-04-934291
[IV_LS_SEC]: https://www.indiavotes.com/lok-sabha/2024/telangana/secunderabad/
[COAL_KISHAN]: https://coal.gov.in/minister/shri-g-kishan-reddy
[W_TN17]: https://en.wikipedia.org/wiki/17th_Tamil_Nadu_Assembly
[TNER_CHENNAI]: https://tnelectionresult.com/districts/chennai
[BW_KOLATHUR]: https://www.businessworld.in/article/tvk-s-vs-babu-defeats-mk-stalin-in-kolathur-ends-dmk-chief-s-stronghold-in-tn-election-2026-605351
[W_VIJAYMIN]: https://en.wikipedia.org/wiki/C._Joseph_Vijay_ministry
[NTN_TNGOV]: https://newstodaynet.com/2026/09/21/centre-likely-to-appoint-new-governor-for-tamil-nadu-soon/
[TNM_AMALRAJ]: https://www.thenewsminute.com/tamil-nadu/a-amalraj-appointed-as-chennai-police-commissioner
[PRINT_AMALRAJ26]: https://theprint.in/india/vinayagar-idols-immersion-held-under-tight-security-in-chennai/3048154/
[CHENNAI_NIC_COLL]: https://chennai.nic.in/collector/
[DTNEXT_COLL]: https://www.dtnext.in/news/tamilnadu/new-collectors-for-chennai-tiruvallur-in-latest-ias-reshuffle-by-tvk-govt
[W_PRIYA]: https://en.wikipedia.org/wiki/Priya_Rajan
[DTNEXT_PRIYA]: https://www.dtnext.in/news/chennai/tvk-govt-orders-cost-review-of-90-chennai-corporation-projects-announced-by-mayor-priya
[IV_LS_CHN]: https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-north/
[IV_LS_CHS]: https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-south/
[IV_LS_CHC]: https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-central/
[W_KALANIDHI]: https://en.wikipedia.org/wiki/Kalanidhi_Veeraswamy
[W_CHS]: https://en.wikipedia.org/wiki/Chennai_South_Lok_Sabha_constituency
[DH_DAYANIDHI]: https://www.deccanherald.com/amp/story/elections%2Findia%2Flok-sabha-elections-2024-dmks-dayanidhi-maran-wins-central-chennai-seat-3049818
[W_WB18]: https://en.wikipedia.org/wiki/18th_West_Bengal_Assembly
[OI_WB26]: https://www.oneindia.com/kolkata/west-bengal-election-results-2026-full-winners-list-seat-wise-results-party-tally-vote-margin-d-8076867.html
[W_SUVMIN]: https://en.wikipedia.org/wiki/Suvendu_Adhikari_ministry
[SG_SUV]: https://sundayguardianlive.com/india/west-bengal-election-results-2026-live-suvendu-adhikari-to-take-oath-as-west-bengals-new-chief-minister-today-pm-modi-among-key-attendees-watch-190282/
[ETV_GHUGE]: https://www.etvbharat.com/en/state/justice-ravindra-vithalrao-ghuge-sworn-in-as-chief-justice-of-calcutta-hc-enn26090901458
[W_CALHC]: https://en.wikipedia.org/wiki/Calcutta_High_Court
[SCC_SIVAGNANAM]: https://www.scconline.com/blog/post/2025/09/15/chief-justice-calcutta-high-court-justice-ts-sivagnanam-legal-news/
[W_KOLCP]: https://en.wikipedia.org/wiki/Commissioner_of_the_Kolkata_Police
[STATESMAN_NAND]: https://www.thestatesman.com/cities/kolkata/kolkata-cp-asks-senior-cops-to-brief-juniors-through-video-recordings-1503631951.html
[DD_VERMA]: https://ddnews.gov.in/en/manoj-kumar-verma-appointed-as-new-kolkata-commissioner-of-police/
[W_FIRHAD]: https://en.wikipedia.org/wiki/Firhad_Hakim
[ITV_FIRHAD]: https://www.indiatvnews.com/west-bengal/news-firhad-hakim-resigns-as-kolkata-mayor-after-mamata-banerjee-s-approval-amid-tmc-split-reactions-latest-updates-2026-06-03-1043517
[PRINT_WBCS]: https://theprint.in/india/governance/west-bengal-has-a-new-chief-secy-manoj-agarwal-ias-officer-who-oversaw-2026-polls-as-ceo/2928259/
[DH_WBCS]: https://www.deccanherald.com/elections/west-bengal/west-bengal-assembly-elections-2026-election-commission-appoints-dushyant-nariala-as-chief-secretary-3933236
[W_DUMDUM]: https://en.wikipedia.org/wiki/Dum_Dum_Assembly_constituency
[IV_LS_KD]: https://www.indiavotes.com/lok-sabha/2024/west-bengal/kolkata-dakshin/
[IV_LS_KU]: https://www.indiavotes.com/lok-sabha/2024/west-bengal/kolkata-uttar/
[W_SUDIP]: https://en.wikipedia.org/wiki/Sudip_Bandyopadhyay
[W_KOLDAK]: https://en.wikipedia.org/wiki/Kolkata_Dakshin_Lok_Sabha_constituency
[W_DL8]: https://en.wikipedia.org/wiki/8th_Delhi_Assembly
[BS_NDLS]: https://www.business-standard.com/elections/delhi-elections/new-delhi-assembly-result-arvind-kejriwal-parvesh-verma-sandeep-dikshit-125020701980_1.html
[ZEE_KASTURBA]: https://zeenews.india.com/india/live-updates/kasturba-nagar-vidhan-sabha-chunav-result-2025-live-winner-and-looser-candidate-madan-lal-vs-neeraj-basoya-vs-abhishek-dutt-total-votes-margin-bjp-aap-congress-delhi-assembly-election-result-2855402.html
[W_KASTURBA]: https://en.wikipedia.org/wiki/Kasturba_Nagar_Assembly_constituency
[W_SANDHU]: https://en.wikipedia.org/wiki/Taranjit_Singh_Sandhu
[PRS_BANSURI]: https://prsindia.org/mptrack/18-lok-sabha/bansuri-swaraj
[SNX_REKHA]: https://www.socialnews.xyz/2026/09/26/new-delhi-cm-rekha-gupta-attends-physiotherapy-conference-gallery/
