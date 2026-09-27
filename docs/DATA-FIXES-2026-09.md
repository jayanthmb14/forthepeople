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

**Rule: verified or hidden** (owner, 27 Sep 2026). A value is either
confirmed on an official or reputed page and written, or — when it looks
wrong, invented or stale and cannot be confirmed — removed from view: the
field is set to null, or the row is deleted when the whole row is
unfounded. Every such change is marked **"hidden: unverifiable"** below
with its reason. No new value is written unless it was verified.

Rows are matched by id, so re-running is safe (already-applied changes are
skipped). If a field was changed by someone else after 27 Sep, that fix is
skipped and flagged "CHANGED SINCE CHECK". After applying, clear the Redis
caches (admin → Cache). The Leader table is not touched.

---

## 1. Infrastructure projects (InfraProject) — verified or hidden

Every district's list was checked row by row: all well-known projects,
the biggest ~15–20 by budget, every row that is not really a project, and
near-duplicate names. The web-search quota for the session (200 searches,
shared by six checkers) ran out part-way, so later rows were checked only
through official pages that could be opened directly (PIB, PM India,
MMRDA, HMRL, K-RIDE, Metro Railway Kolkata …) and named news reports.

Then the owner's rule was applied: **verified or hidden.**
- Verified rows are corrected and stamped `lastVerifiedAt = 2026-09-27`;
  any other seed value on them that was not confirmed (seed start/end
  dates, budgets, progress) is **cleared**.
- Rows with **no source at all** (the March–April 2026 "seed-data" and
  "manual-research" rows: round budgets, "In Progress", end dates already
  past, place names with invented descriptions) that could not be
  confirmed are **deleted — hidden: unverifiable**. Some are real projects
  (e.g. Kolkata Metro Line 5, Gomti Riverfront, Arkavathy Layout, Ejipura
  elevated corridor) whose stored status/figures could not be confirmed;
  re-add them with a source.
- Rows that are not projects, sit in another district, or duplicate another
  row are deleted.
- News-sourced rows that could not be re-checked are kept (their figures
  came from a linked article); any figure that looked wrong is cleared.

Status words are the tracker's own (`PROPOSED`, `APPROVED`,
`TENDER_ISSUED`, `UNDER_CONSTRUCTION`, `PARTIALLY_OPERATIONAL`, `DELAYED`,
`STALLED`, `CANCELLED`, `COMPLETED`); the completion date is the day it
opened or was inaugurated; budgets are whole rupees (shown in crore here).
Deleting a project also deletes its timeline rows (`InfraUpdate`, cascade).

**Rows per district before → after:** New Delhi 36 → 23, Hyderabad 32 → 22,
Mumbai 33 → 18, Kolkata 42 → 16, Chennai 22 → 14, Pune 28 → 19,
Lucknow 16 → 11, **Bengaluru Urban 161 → 25**, **Mysuru 83 → 18**,
Mandya 25 → 7.

Headline fixes asked for:
- **New Parliament Building** (New Delhi): PROPOSED → **COMPLETED, 28 May 2023** (₹971 cr, official estimate in Parliament) — PIB.
- **"G20 Summit Infrastructure"** → renamed **Bharat Mandapam (IECC)**, COMPLETED 26 Jul 2023, ₹2,700 cr — PIB.
- **Hyderabad Metro Rail** (Phase 1, 69 km): UNDER_CONSTRUCTION → **COMPLETED, 7 Feb 2020** (JBS–MGBS, the last stretch); run by the state's HMRL since 1 May 2026 after the L&T buy-out. **Phase 2** (122.9 km, ₹38,595 cr) → APPROVED by the state (administrative sanction; the Centre gave in-principle 50:50 support in May 2026, Union Cabinet approval not yet found). The ₹1,100 cr "Phase II — Old City & Airport Line" row is a duplicate and is deleted.
- **Western Railway Maintenance Block**, **OHE Down Line Issue**, both **Donald Trump road renaming** rows and other non-projects → deleted.
- **Duplicates:** Atal Setu kept (₹17,843 cr, opened 12 Jan 2024, MMRDA), Sewri–Nhava Sheva deleted; AIIMS New Delhi kept, "AIIMS Expansion" deleted; Kolkata Purple Line (Joka) — one row kept, the other deleted; Delhi Metro Phase 4 — the three rows are **different corridors**, not duplicates, but all three wrongly carried the ₹24,948 cr three-corridor total as their own budget (fixed); Bengaluru Blue Line (Phase 2A/2B) and Sarjapur–Hebbal (Phase 3A) had 3–6 copies each.
- **Pharma City (Hyderabad):** the ₹64,000 cr was expected private investment, not a project cost; the project is back at planning stage (revived May 2026 as "Green Pharma City" under the Future City authority) → PROPOSED, ₹9,500 cr (Phase-I infrastructure estimate, news). **SRDP (Hyderabad):** ₹2,000 cr and ₹25,000 cr were both wrong — Phase-I was sanctioned at ~₹8,092 cr; most works are open → PARTIALLY_OPERATIONAL (news).


### New Delhi — 22 verified, 5 deleted as non-project/duplicate, 8 hidden (unverifiable), 0 with figures hidden, 1 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Delhi-Meerut RRTS (Regional Rapid Transit) | status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2026-02-22; original ₹30,500 cr → ₹30,274 cr; progress → 100% | The PM dedicated the entire 82 km Delhi-Meerut Namo Bharat corridor to the nation on 22 Feb 2026 (last sections Sarai Kale Khan-New Ashok Nagar and Meerut South-Modipuram); Cabinet-sanctioned cost is Rs 30,274 crore, so originalBudget 30,50 | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2231487&lang=1&reg=3) (official) |
| Delhi Metro Phase 4 — Janakpuri West to RK Ashram Marg | status **UNDER_CONSTRUCTION → PARTIALLY_OPERATIONAL**; original ₹24,900 cr → —; revised ₹24,900 cr → —; description corrected; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | Two sections are already open (Krishna Park Extension, Jan 2025; Deepali Chowk-Majlis Park, inaugurated by the PM on 8 Mar 2026), so the corridor is partly operational. The 24,900 cr original/revised budget is the combined cost of all three | [www.newsonair.gov.in](https://www.newsonair.gov.in/pm-modi-to-inaugurate-two-new-delhi-metro-corridors-lay-foundation-for-three-more) (official) |
| Delhi Metro Phase 4 — Aerocity to Tughlakabad | budget ₹12,000 cr → **₹8,390 cr**; original ₹24,900 cr → —; revised ₹24,900 cr → —; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Still under construction (about 83% civil work done per DMRC reports), but the row's description is about all of Phase 4, the 24,900 cr original/revised budget is the three-corridor total, and the corridor's own cost was reported as about R | [www.nbmcw.com](https://www.nbmcw.com/news/dmrc-expedites-8-390-cr-aerocity-tughlaqabad-corridor.html) (news) |
| Dwarka Expressway | opened/completed 2025-08-17; budget ₹9,000 cr → **₹9,460 cr**; description corrected | Only the Haryana section opened in March 2024 (on 11 Mar, about Rs 4,100 cr); the Delhi section (about Rs 5,360 cr) was inaugurated on 17 Aug 2025, so the whole expressway was completed then and the two official figures add up to about Rs 9 | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2157088&reg=3&lang=2) (official) |
| Delhi Metro Phase 4 — Lajpat Nagar to Saket G Block | status **In Progress → UNDER_CONSTRUCTION**; budget ₹7,500 cr → **—**; original ₹24,900 cr → —; revised ₹24,900 cr → —; expectedEnd 2028-06-30 → —; startDate 2023-09-01 → 2025-12-12; description corrected; *hidden (unverified seed values):* progressPct | The Cabinet approved this corridor on 13 Mar 2024 together with Inderlok-Indraprastha at a combined Rs 8,399 cr, so the row's Rs 7,500 cr budget and 24,900 cr original/revised figures are wrong (no official split for this corridor alone); D | [www.pmindia.gov.in](https://www.pmindia.gov.in/en/news_updates/cabinet-approves-two-corridors-of-delhi-metro-phase-iv-projects-namely-i-lajpat-nagar-to-saket-g-block-and-ii-inderlok-to-indraprastha/) (official) |
| AIIMS New Delhi Expansion & Modernization | renamed “AIIMS New Delhi Residential Redevelopment (West Ansari Nagar & Ayur Vigyan Nagar)”; status **In Progress → UNDER_CONSTRUCTION**; budget ₹4,500 cr → **₹4,441 cr**; original — → ₹4,441 cr; startDate 2021-01-01 → —; agency → NBCC; description corrected; *hidden (unverified seed values):* expectedEnd, progressPct | The only officially costed AIIMS New Delhi expansion is the Cabinet-approved (13 Oct 2016) residential redevelopment at Rs 4,441 cr, which NBCC is building in phases; the vague 'Expansion & Modernization' row matches that figure, so rename  | [www.pmindia.gov.in](https://www.pmindia.gov.in/en/news_updates/cabinet-approves-redevelopment-of-residential-colonies-at-west-ansari-nagar-and-ayur-vigyan-nagar-campuses-of-allms-new-delhi/) (official) |
| Barapullah Elevated Road Phase 3 (Sarai Kale Khan to Mayur Vihar) | status **In Progress → UNDER_CONSTRUCTION**; budget ₹4,200 cr → **₹1,635 cr**; original ₹5,500 cr → —; revised ₹5,500 cr → ₹1,635 cr; expectedEnd 2027-12-31 → 2026-09-29; description corrected; *hidden (unverified seed values):* startDate, progressPct | Construction is finished and HM Amit Shah is due to open the corridor on 29 Sep 2026; its revised cost is about Rs 1,635 cr, not Rs 4,200 cr (or the 5,500 cr original/revised), and it is a short extension that takes the combined Barapullah  | [www.thehansindia.com](https://www.thehansindia.com/news/cities/new-delhi/hm-to-inaugurate-barapullah-phase-iii-corridor-on-sep-29-1123512) (news) |
| Yamuna Cleaning — Interceptor Sewer Project (ISP) | budget ₹3,900 cr → **₹2,454 cr**; agency → Delhi Jal Board; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | The Interceptor Sewer Project has cost about Rs 2,454 cr (not Rs 3,900 cr); DJB has declared most drains done, but an April 2026 Centre-ordered inspection found it stops only about 60% of the sewage claimed, so its real completion status is | [www.outlookbusiness.com](https://www.outlookbusiness.com/news/yamuna-cleanup-fails-djb-2454-crore-sewage-project) (news) |
| Safdarjung Hospital Upgrades & Super-Specialty Block | renamed “Safdarjung Hospital Super Speciality Block (807 beds)”; status **In Progress → COMPLETED**; opened/completed 2018-06-29; budget ₹1,200 cr → **₹920 cr**; expectedEnd 2027-06-30 → —; startDate 2022-06-01 → —; agency → Ministry of Health & Family Welfare; *hidden (unverified seed values):* progressPct | The PM inaugurated Safdarjung's 807-bed super-speciality block (Rs 920 cr) and a 500-bed emergency block (Rs 346 cr) on 29 June 2018, so this is not an ongoing 2022-2027 project and the Rs 1,200 cr budget is wrong. | [www.tribuneindia.com](https://www.tribuneindia.com/news/archive/nation/pm-unveils-five-major-healthcare-projects-at-aiims-safdarjung-hospital-612466/) (news) |
| Chandrawal Water Treatment Plant Expansion | renamed “Chandrawal Water Treatment Plant (105 MGD)”; status **In Progress → UNDER_CONSTRUCTION**; budget ₹1,200 cr → **₹599 cr**; expectedEnd 2027-03-31 → 2026-12-31; agency → Delhi Jal Board (JICA-assisted); *hidden (unverified seed values):* startDate, progressPct | The CM said in Feb 2026 that the 105 MGD Chandrawal plant is being built for Rs 599 cr with commissioning targeted in 2026 (the Rs 1,331 cr distribution-pipeline work is separate); the Rs 1,200 cr budget is not supported. | [www.prokerala.com](https://www.prokerala.com/news/articles/a1725115.html) (news) |
| Chandni Chowk | renamed “Chandni Chowk Redevelopment (Red Fort to Fatehpuri Masjid)”; status **PROPOSED → COMPLETED**; opened/completed 2021-09-12; budget ₹990 cr → **₹145 cr**; original ₹990 cr → ₹65.6 cr; revised ₹990 cr → ₹145 cr; agency → Shahjahanabad Redevelopment Corporation (SRDC), GNCTD | The 1.3-1.4 km redeveloped stretch was inaugurated by CM Kejriwal on 12 Sep 2021, and its cost went from Rs 65.6 cr to Rs 145 cr per a Delhi government report; the row's Rs 990 cr looks invented (about 7x too high) and the status is stale. | [www.devdiscourse.com](https://www.devdiscourse.com/article/science-environment/3536410-controversy-unveiled-the-chandni-chowk-redevelopment-scandal) (news) |
| New Parliament Building | status **PROPOSED → COMPLETED**; opened/completed 2023-05-28; startDate — → 2020-12-10 | The new Parliament House was dedicated to the nation by the PM on 28 May 2023 (foundation stone 10 Dec 2020); the official estimated cost stated in Parliament was Rs 971 crore, so the budget is right but the status is years out of date. | [www.pib.gov.in](https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1927866) (official) |
| Pragati Maidan Integrated Transit Corridor | status **In Progress → COMPLETED**; opened/completed 2022-06-19; original ₹2,700 cr → ₹920 cr; revised ₹2,700 cr → ₹920 cr; expectedEnd 2026-06-30 → —; startDate 2017-04-01 → —; agency → Delhi PWD (funded by Central Government); description corrected; *hidden (unverified seed values):* progressPct | The PM dedicated the main tunnel and five underpasses to the nation on 19 June 2022 at a cost of over Rs 920 crore; the row's 2,700 cr original/revised budget and its description belong to the separate IECC/Bharat Mandapam convention-centre | [www.pib.gov.in](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=1834675) (official) |
| Ghazipur Landfill Remediation & Bio-Mining | status **In Progress → UNDER_CONSTRUCTION**; revisedEndDate — → 2027-12-31; agency → MCD; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | Biomining at Ghazipur landfill is still ongoing, and MCD's latest deadline for clearing Ghazipur is 2027 (Bhalswa and Okhla in 2026); 'In Progress' maps to UNDER_CONSTRUCTION. The Rs 890 cr budget could not be verified. | [swarajyamag.com](https://swarajyamag.com/news-brief/delhi-sets-2026-deadline-for-bhalswa-and-okhla-landfill-clearance-ghazipur-by-2027) (news) |
| Delhi Mohalla Clinics Expansion (500+ target) | status **In Progress → CANCELLED**; expectedEnd 2026-12-31 → —; *hidden (unverified seed values):* budget, startDate, progressPct | The Mohalla Clinic expansion is not going ahead: since April 2025 the Delhi government has been closing Mohalla Clinics (250 in rented premises first) and converting the rest into Ayushman Arogya Mandirs. The Rs 800 cr budget has no source  | [medicaldialogues.in](https://medicaldialogues.in/news/health/hospital-diagnostics/delhi-to-convert-mohalla-clinics-into-sub-centres-of-arogya-mandirs-151052) (news) |
| Ashram Flyover Extension / Ashram Chowk Grade Separator | renamed “Ashram Flyover Extension (Ashram to DND Flyway)”; status **In Progress → COMPLETED**; opened/completed 2023-03-06; budget ₹280 cr → **₹128 cr**; expectedEnd 2026-06-30 → —; agency → Delhi PWD; *hidden (unverified seed values):* startDate, progressPct | The 1.4 km six-lane extension linking Ashram flyover to the DND was opened by CM Kejriwal on 6 Mar 2023 at a total cost of about Rs 128.25 cr (work began June 2020); the row's Rs 280 cr and 'In Progress' status are wrong. | [www.indiatvnews.com](https://www.indiatvnews.com/delhi/delhi-ashram-flyover-extension-opening-date-significance-and-more-2023-03-04-851877) (news) |
| 18 Namo Oxygen Parks | opened/completed 2026-06-05; description corrected | The parks were inaugurated on 5 Jun 2026, but they are urban green spaces, not medical-oxygen facilities as the description and HOSPITAL category claim. | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2269191&reg=3&lang=1) (official) |
| Delhi-SNB | renamed “Delhi-Gurugram-SNB Namo Bharat (RRTS) Corridor”; description corrected | PROPOSED is still right (awaiting Union Cabinet approval), but the description is wrong: SNB is Shahjahanpur-Neemrana-Behror on the Gurugram/NH-48 corridor, not Sonipat via Narela. | [metrorailtoday.com](https://metrorailtoday.com/news/public-investment-board-approves-two-new-rrts-corridors-worth-65000-crore) (news) |
| Terminal 4 | renamed “IGI Airport Terminal 4 (Delhi)”; description corrected | T4 is still at the planning stage in DIAL's 2026-2036 master plan, so PROPOSED is correct, but the bare name 'Terminal 4' is ambiguous and the '100 million passengers' claim does not match current plans. | [www.businesstoday.in](https://www.businesstoday.in/latest/trends/photo/delhi-airport-is-getting-an-air-train-terminal-4-and-140-million-capacity-heres-the-full-plan-546979-2026-08-03) (news) |
| Urban Extension Road | renamed “Urban Extension Road-II (UER-II, NH-344M)”; status **PROPOSED → COMPLETED**; opened/completed 2025-08-17; agency → NHAI; description corrected | The PM inaugurated UER-II (Alipur-Dichaon Kalan stretch plus the Bahadurgarh and Sonipat links, about Rs 5,580 cr) on 17 Aug 2025; it is not PROPOSED, and the row's description (Wazirabad to Outer Ring Road) is wrong. The total Phase-I cost | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2157088&reg=3&lang=2) (official) |
| G20 Summit Infrastructure | renamed “Bharat Mandapam (IECC, Pragati Maidan Redevelopment)”; status **PROPOSED → COMPLETED**; opened/completed 2023-07-26; budget — → **₹2,700 cr**; original — → ₹2,700 cr; agency → ITPO (India Trade Promotion Organisation); description corrected | The vague 'G20 Summit Infrastructure' row describes Bharat Mandapam, which the PM inaugurated on 26 July 2023 at a cost of about Rs 2,700 crore; rename it to the real project and mark it COMPLETED (delete instead if you prefer not to keep u | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1943050) (official) |
| Safe City | renamed “Delhi Police Safe City Project (Nirbhaya Fund)”; status **PROPOSED → UNDER_CONSTRUCTION**; budget — → **₹800 cr**; agency → Delhi Police / Ministry of Home Affairs; description corrected | This is a real MHA/Delhi Police project, started in 2018 and costing about Rs 800 cr, with launch expected in 2026; the row's '2.7 lakh cameras' description mixes it up with the separate Delhi government CCTV scheme. | [swarajyamag.com](https://swarajyamag.com/security/delhi-polices-safe-city-project-with-10000-ai-cameras-to-enable-automatic-distress-alerts-launch-expected-in-2026-report) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- DDA Housing Scheme 2024 (Narela, Rohini, Dwarka) (In Progress, ₹3,200 cr) — non project. The DDA Housing Scheme 2024 is a sale scheme for already-built DDA flats (registration from Aug 2024, closing Mar 2025), not a construction project, and the Rs 3,200 cr figure has no source.
- AIIMS Expansion (PROPOSED) — duplicate of “AIIMS New Delhi Expansion & Modernization”. A generic 'AIIMS Expansion' manual-research row with no budget or source that duplicates the other AIIMS New Delhi expansion row.
- Hostel for Civil Service Aspirants in Delhi (PROPOSED) — duplicate of “Karnataka Bhavan in Delhi for Civil Services Aspirants”. Seeded 15 seconds before the Karnataka Bhavan row from the same 21 Jun 2026 news cycle about a Delhi hostel for civil-services aspirants 'from the state' (Karnataka), so it duplicates that row.
- Bus Shelter (PROPOSED) — non project. 'Bus Shelter' is a generic placeholder (a 1,400-shelter modernisation with no budget, dates, agency order or source) rather than a specific sanctioned project.
- Electric Vehicle Policy (PROPOSED) — non project. 'Electric Vehicle Policy' is a policy, not an infrastructure project, and the '500+ charging stations' description is a manual-research placeholder with no source.

**Hidden: unverifiable — deleted:**

- Jewar International Airport (PROPOSED, ₹29,600 cr) — no source; This airport is at Jewar in Gautam Buddh Nagar district, Uttar Pradesh, not New Delhi, so it should be moved or hidden from the New Delhi page; it is 
- Yamuna Riverfront Development (In Progress, ₹2,500 cr) — no source; not reached by the check
- PMAY-U In-situ Slum Rehabilitation — Delhi (In Progress, ₹1,800 cr) — no source; not reached by the check
- NDMC Smart City Mission — Wi-Fi, CCTV, Solar (In Progress, ₹1,200 cr) — no source; not reached by the check
- Signal-Free Corridor — Ring Road Improvements (In Progress, ₹650 cr) — no source; not reached by the check
- Delhi CCTV Expansion Project (5 lakh cameras) (In Progress, ₹580 cr) — no source; The Delhi government's CCTV project put up about 2.8 lakh cameras in two phases from 2018 (not 5 lakh), and PWD is now replacing about 1.4 lakh phase-
- Okhla Waste-to-Energy Plant Capacity Expansion (In Progress, ₹480 cr) — no source; Expansion of the Okhla waste-to-energy plant by 1,000 TPD (to about 2,950 TPD) is planned for 2026-2028 under Delhi's waste plan, but no official cost
- Najafgarh Drain (PROPOSED) — no source; not reached by the check

**Kept unchanged (news-sourced, not re-checked):** Karnataka Bhavan in Delhi for Civil Services Aspirants (ANNOUNCED)

### Hyderabad — 21 verified, 8 deleted as non-project/duplicate, 2 hidden (unverifiable), 0 with figures hidden, 1 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Pharma City at Mucherla | renamed “Hyderabad (Green) Pharma City, Mucherla”; status **In Progress → PROPOSED**; budget ₹64,000 cr → **₹9,500 cr**; original ₹10,000 cr → ₹9,500 cr; revised ₹10,000 cr → ₹9,500 cr; agency → Future City Development Authority (FCDA) / TGIIC; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Rs 64,000 cr was the private 'investment potential', not a project cost; the state's Phase-I infrastructure estimate was Rs 9,500 cr (Dec 2020). The project stalled after 2023 and was revived in May 2026 as 'Hyderabad Green Pharma City' und | [www.telanganatribune.com](https://www.telanganatribune.com/hyderabad-pharma-city-project-revived-under-future-city-development-authority-jurisdiction/) (news) |
| Regional Ring Road (RRR) — 340 km | status **UNDER_CONSTRUCTION → TENDER_ISSUED**; budget ₹55,000 cr → **₹36,000 cr**; revised ₹16,000 cr → ₹36,000 cr; *hidden (unverified seed values):* originalBudget, startDate, expectedEnd, progressPct | No construction has started: NHAI's bids for the 161.5 km northern half (Rs 23,935.6 cr, HAM) were extended a 7th time to 23 Sep 2026 pending CCEA clearance, and the 182 km southern half has no DPR/approval yet; the state's April 2026 road  | [www.constructionworld.in](https://www.constructionworld.in/policy-updates-and-economic-news/nhai-extends-northern-rrr-tender-deadline-to-september-23/96633) (news) |
| Mission Bhagiratha | status **PROPOSED → COMPLETED**; description corrected; *hidden (unverified seed values):* budget, originalBudget, revisedBudget | Not a proposal: Mission Bhagiratha was launched 7 Aug 2016 and by 2019-21 had given tap connections to all rural households (about Rs 32,000 cr spent of ~Rs 38,000-43,000 cr); it is a state-wide scheme, so scope should be STATE rather than  | [theprint.in](https://theprint.in/india/governance/all-homes-in-telangana-villages-now-have-tap-water-but-its-not-a-nal-se-jal-story-alone/612208/) (news) |
| Hyderabad Metro Rail Phase 2 | status **PROPOSED → APPROVED**; agency → Hyderabad Metro Rail Ltd (HMRL); proposed 50:50 JV of Govt o; description corrected | KEEP this row as the single Phase II record: Telangana gave administrative sanction (Part A Rs 24,269 cr Nov 2024; Part B Rs 19,579 cr Jun 2025), the current 122.9 km/7-corridor plan is Rs 38,595 cr (May 2026), and the Centre gave in-princi | [metrorailtoday.com](https://metrorailtoday.com/news/telangana-pushes-for-approval-of-38595-crore-hyderabad-metro-phase-ii-expansion) (news) |
| Hyderabad Metro Rail | status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2020-02-07; original ₹20,500 cr → ₹14,132 cr; agency → Hyderabad Metro Rail Ltd (HMRL), Govt of Telangana (took ove | Phase 1 (69 km, 3 lines) has been fully open since the JBS-MGBS stretch was inaugurated on 7 Feb 2020; Telangana bought out L&T (100% equity, ~Rs 15,000 cr incl. debt) and HMRL runs it from 1 May 2026. Official concession cost was Rs 14,132 | [hmrl.co.in](https://hmrl.co.in/telangana-government-takes-full-control-of-hyderabad-metro-appoints-new-board-as-operations-shift-from-may-1st/) (official) |
| Musi Riverfront Development | status **PROPOSED → APPROVED**; budget ₹15,000 cr → **₹7,345 cr**; original ₹15,000 cr → ₹5,812 cr; revised ₹15,000 cr → ₹7,345 cr; agency → Musi Riverfront Development Corporation Ltd (MRDCL), Govt of; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | KEEP as the single Musi row. Phase-1 DPR was unveiled in March 2026 (Rs 5,812 cr excl. land) and the state cabinet approved Phase-1 at Rs 7,345 cr on 2 Jul 2026 (GO/sanction ~9 Jul) with an ADB loan being lined up; no official cost exists f | [telanganatoday.com](https://telanganatoday.com/musi-rejuvenation-project-gets-cabinet-nod) (news) |
| Godavari Drinking Water Supply Project | renamed “Godavari Drinking Water Supply Project Phase II & III”; status **In Progress → UNDER_CONSTRUCTION**; budget ₹8,000 cr → **₹7,360 cr**; original — → ₹7,360 cr; startDate 2021-01-01 → 2025-09-08; agency → HMWSSB (Hyderabad Metropolitan Water Supply & Sewerage Board; description corrected; *hidden (unverified seed values):* expectedEnd, progressPct | The current Godavari scheme is Phase II & III, whose foundation stone was laid on 8 Sep 2025 at a cost of Rs 7,360 cr with ~2-year completion; the stored 2020 start and Rs 8,000 cr are not sourced. | [m.sakshipost.com](https://m.sakshipost.com/news/foundation-laid-project-bring-more-godavari-water-hyderabad-449991) (news) |
| 2BHK Housing Scheme — Hyderabad | status **In Progress → PARTIALLY_OPERATIONAL**; budget ₹5,000 cr → **₹9,700 cr**; original — → ₹6,015 cr; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Houses have been allotted since 2 Sep 2023 (11,700 in phase 1) and most of the ~69,000 built units are done, so it is partly delivered; GHMC scheme was sanctioned at Rs 6,014.78 cr (2017) and estimated at Rs 9,700 cr for 1 lakh units (2021) | [telanganatoday.com](https://telanganatoday.com/dignity-housing-one-lakh-2bhks-in-ghmc-limits-to-become-a-reality-soon) (news) |
| Hyderabad Road Maintenance Plan | renamed “Comprehensive Road Maintenance Programme (CRMP) Phase-II”; description corrected | Status and budget are correct (CRMP Phase-II cleared 4 Jun 2026 at Rs 3,145 cr); it is a real multi-year road relaying contract rather than a one-off maintenance block, so keep it but use the official programme name. | [Google News headline](https://news.google.com/rss/search?q=Hyderabad+road+maintenance+3,145+crore&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| H-CITI Urban Infrastructure Scheme | status **In Progress → UNDER_CONSTRUCTION**; budget ₹2,654 cr → **₹7,032 cr**; original — → ₹7,032 cr; agency → GHMC / MA&UD, Govt of Telangana; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | H-CITI was sanctioned in Dec 2024 at Rs 7,032 cr for 38 works (not Rs 2,654 cr, and it did not start in 2023); KBR Park package works began in Feb 2026, though the Supreme Court paused tree felling around KBR Park in May 2026. startDate 202 | [www.siasat.com](https://www.siasat.com/hyderabad-rs-7032-cr-sanctioned-for-road-infra-works-under-h-citi-initiative-3160036/) (news) |
| SRDP Flyovers & Underpasses | status **In Progress → PARTIALLY_OPERATIONAL**; budget ₹2,000 cr → **₹8,092 cr**; original ₹25,000 cr → ₹8,092 cr; revised ₹25,000 cr → ₹8,092 cr; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | SRDP was conceived as a ~Rs 25,000 cr five-phase plan, but the sanctioned Phase-I works total about Rs 8,092 cr (state MA&UD figure, May 2024); 36-37 of 42 works were complete by late 2024/2025 (Aramghar-Zoo Park flyover opened Jan 2025), s | [www.siasat.com](https://www.siasat.com/hyderabad-rs-7032-cr-sanctioned-for-road-infra-works-under-h-citi-initiative-3160036/) (news) |
| TIMS Hospitals (6,582 new beds) | status **In Progress → PARTIALLY_OPERATIONAL**; budget ₹1,500 cr → **₹2,679 cr**; original — → ₹2,679 cr; agency → Telangana R&B / Health Dept (contractors L&T, MEIL, DEC Infr; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | The three Hyderabad TIMS cost Rs 2,679 cr (LB Nagar Rs 900 cr, Sanathnagar Rs 882 cr, Alwal Rs 897 cr), not Rs 1,500 cr; MCR TIMS Sanathnagar (1,082 beds) was inaugurated on 17-18 Aug 2026 while Alwal and LB Nagar are still being finished ( | [telanganatoday.com](https://telanganatoday.com/revanth-reddy-inaugurates-tims-sanathnagar-promises-four-hospitals-by-2027) (news) |
| Elevated Corridor I — Paradise to Shamirpet | renamed “Paradise-Shamirpet Elevated Corridor (Rajiv Rahadari, SH-1)”; status **In Progress → UNDER_CONSTRUCTION**; budget ₹1,500 cr → **₹2,342 cr**; original — → ₹2,232 cr; revised — → ₹2,342 cr; startDate 2024-09-01 → 2024-03-07; agency → HMDA; description corrected; *hidden (unverified seed values):* expectedEnd, progressPct | The description wrongly described ORR 8-laning; this is the 18.1 km Rajiv Rahadari elevated corridor, foundation laid 7 Mar 2024 (est. Rs 2,232 cr) and contract awarded to Bekem Infra in Jan 2026 for Rs 2,342 cr with a 2-year build period;  | [www.deccanchronicle.com](https://www.deccanchronicle.com/southern-states/telangana/bekem-infra-wins-2342-cr-contract-for-paradise-shamirpet-elevated-corridor-1929908) (news) |
| Miyapur Flyover | confirmed correct | Correct: Rs 530 cr Allwyn Colony-Miyapur six-lane flyover plus two underpasses got administrative approval under H-CITI in May 2026; contract awarded to Shivasatya Engineering (Cyberabad Municipal Corporation tender). | [www.siasat.com](https://www.siasat.com/telangana-approves-major-flyover-underpass-project-in-hyderabad-3442625/) (news) |
| Budvel Multi-Level Interchange | renamed “Budvel Trumpet Interchange (ORR Km 143)”; status **In Progress → TENDER_ISSUED**; agency → HMDA; description corrected; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | Budget Rs 488 cr is correct, but the project was only sanctioned by MA&UD in Jan 2026 and was at tender stage then, so it is not 'in progress' since 2023; startDate 2023-05-31 has no basis. | [telanganatoday.com](https://telanganatoday.com/hyderabad-gets-rs-488-cr-sanction-for-trumpet-interchange-at-budvel) (news) |
| Katedan-Shamshabad six-lane flyover | budget — → **₹190 cr**; original — → ₹190 cr; agency → GHMC (H-CITI); contractor KNR Constructions | Status APPROVED is right; the state approved the executing agency (KNR Constructions) on 4-5 Jun 2026 at Rs 189.68 cr for the six-lane grade separator linking Katedan, Mylardevpally and Shamshabad Road under H-CITI. | [hyderabadmail.com](https://hyderabadmail.com/hyderabad-katedan-shamshabad-six-lane-flyover-approved/) (news) |
| FCDA building | renamed “Future City Development Authority (FCDA) Headquarters Building”; opened/completed 2026-06-10; agency → Future City Development Authority (FCDA), Govt of Telangana; description corrected | Status COMPLETED is right; CM Revanth Reddy inaugurated the FCDA building at Bharat Future City on Wednesday 10 Jun 2026, so the date and a clearer name are added. | [newsmeter.in](https://newsmeter.in/regional/telangana/future-city-development-authority-launched-cm-revanth-reddy-vows-to-build-world-class-pollution-free-metropolis-769727) (news) |
| Gandhi Sarovar project at Bapu Ghat in Hyderabad | agency → Musi Riverfront Development Corporation Ltd (MRDCL); description corrected | Status APPROVED is right (MoD permission 19 Jun 2026). It is a component of the Musi Phase-1 row, so the caller may prefer to delete it as an overlap; cost figures differ (Rs 395 cr in the Mar 2026 DPR, Rs 533 cr in Jun 2026 reports), so bu | [telanganatoday.com](https://telanganatoday.com/centre-clears-gandhi-sarovar-project-at-bapu-ghat-in-hyderabad) (news) |
| PV Narasimha Rao Expressway | status **STALLED → COMPLETED**; opened/completed 2009-10-19; budget — → **₹600 cr**; agency → HMDA; description corrected | The PVNR Expressway opened on 19 Oct 2009 (built by HMDA for ~Rs 600 cr), so STALLED and the '27 km' description are wrong; the attached 24 Apr 2026 update is about the Mumbai-Pune Expressway and should be removed. | [www.business-standard.com](https://www.business-standard.com/article/economy-policy/country-s-longest-elevated-corridor-opens-to-public-109102000055_1.html) (news) |
| IT Investment Region | status **PROPOSED → CANCELLED**; description corrected | The Centre told Parliament in July 2022 that the Hyderabad ITIR 'stands scrapped', so PROPOSED is wrong. | [thesouthfirst.com](https://thesouthfirst.com/telangana/ktr-cries-cheating-after-central-government-scraps-itir-project-for-hyderabad/) (news) |
| Hyderabad Airport Expansion | budget — → **₹14,000 cr**; agency → GMR Hyderabad International Airport Ltd (GHIAL); description corrected | The expansion described (integrated terminal doubling capacity to 34 million passengers) was already completed in 2023; the live project is GMR's ~Rs 14,000 cr capex plan to FY2031, so the row is re-described to that and kept as PROPOSED. | [www.business-standard.com](https://www.business-standard.com/industry/aviation/on-the-runway-gmr-s-14-000-crore-capex-plan-for-hyderabad-airport-125061900003_1.html) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- Telangana Mega Road Mission (ANNOUNCED, ₹98,000 cr) — non project. An umbrella state road programme announcement, not one project: its Rs 98,000 cr adds up separate projects (Rs 36,000 cr RRR already listed separately, Hyderabad-Vijayawada 8-laning, Future City-Banda
- Musi River Cleanup & Restoration (In Progress, ₹3,000 cr) — duplicate of “Musi Riverfront Development”. Duplicate of 'Musi Riverfront Development' (the state's Musi rejuvenation project); this row has no description, an unsourced Rs 3,000 cr budget and a non-standard status.
- Hyderabad Metro Phase II — Old City & Airport Line (DELAYED, ₹1,100 cr) — duplicate of “Hyderabad Metro Rail Phase 2”. Duplicate of 'Hyderabad Metro Rail Phase 2'; the Old City (MGBS-Chandrayangutta) and Airport lines are corridors inside Phase II, and the Rs 1,100 cr budget and generic description have no source.
- German Language Hub in Hyderabad (PROPOSED) — non project. A skills/language-training MoU with the German state of Thuringia, not an infrastructure project.
- Road named after Donald Trump in Hyderabad (PROPOSED) — non project. A road renaming, not an infrastructure project (and a duplicate of the other Trump Avenue row).
- Hyderabad Donald Trump Avenue Renaming (COMPLETED) — non project. A road renaming ceremony (23 Jun 2026), not an infrastructure project.
- Metro Depot (PROPOSED) — duplicate of “Hyderabad Metro Rail”. The Uppal depot is part of Hyderabad Metro Phase 1 and has operated (with the operations control centre) since the Blue Line opened on 29 Nov 2017; it is not a separate proposed project.
- Chiran Fort construction (STALLED) — non project. A High Court status-quo order in a dispute over alleged illegal construction/demolition at a private Grade-II heritage property in Begumpet, not a public infrastructure project.

**Hidden: unverifiable — deleted:**

- Bengaluru-Hyderabad and Bengaluru-Chennai-Mysuru high-speed corridors (APPROVED) — a Karnataka cabinet resolution backing study-stage high-speed rail corridors; APPROVED overstated it.
- Supercomputer (PROPOSED) — no source; No government-run 'Telangana IT Department' HPC centre matching this generic seed row was found; the closest real items are private: Yotta's 25,000-GP

**Kept unchanged (news-sourced, not re-checked):** TGSRTC EV Charging Network Expansion (PROPOSED)

### Mumbai — 16 verified, 13 deleted as non-project/duplicate, 2 hidden (unverifiable), 1 with figures hidden, 1 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Mumbai-Ahmedabad High Speed Rail (Bullet Train) | budget ₹110,000 cr → **₹108,000 cr**; original ₹110,000 cr → ₹108,000 cr; revised ₹160,000 cr → — | Still under construction (first Surat-Bilimora service expected Aug 2027); the official sanctioned cost is Rs 1,08,000 crore, and the row's 'revised' 1.6 lakh crore has no official basis (a ~1.98 lakh crore revision is only reported as bein | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2004495) (official) |
| Mumbai Metro Line 3 (Aqua Line) | status **Deadline Updated → COMPLETED**; opened/completed 2025-10-08; budget ₹33,500 cr → **₹37,275 cr**; original — → ₹23,136 cr; revised — → ₹37,275 cr; description corrected | The final Acharya Atre Chowk-Cuffe Parade stretch was inaugurated on 8 Oct 2025, so the whole Aqua Line is open; status 'Deadline Updated' is invalid and the cost is over Rs 37,270 crore, not 33,500 crore (original sanction 23,136 crore). | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2175641) (official) |
| Dharavi Redevelopment Project | status **APPROVED → UNDER_CONSTRUCTION**; agency → Navbharat Mega Developers Pvt Ltd (Adani-Maharashtra govt SP; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | Rehab construction on Sector 6 (Matunga railway land) is under way, with the CM promising 10,000 rehab homes within 18 months (Jul 2026); the Rs 20,000 crore budget could not be verified (Adani committed an initial Rs 5,069 crore; totals up | [www.businesstoday.in](https://www.businesstoday.in/real-estate/story/dharavi-redevelopment-project-gains-pace-10000-homes-to-be-delivered-in-phase-1-says-cm-fadnavis-542562-2026-07-13) (news) |
| Mumbai Trans Harbour Link (Atal Setu) | opened/completed 2024-01-12; budget ₹17,700 cr → **₹17,843 cr**; original ₹17,700 cr → ₹17,843 cr; revised ₹17,700 cr → ₹17,843 cr; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Atal Setu was inaugurated by the PM on 12 Jan 2024 (row says 11 Jan) and MMRDA's approved total project cost is Rs 17,843 crore, not 17,700 crore; keep this row as the canonical MTHL record (MMRDA also says work started in Mar 2018, not Mar | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/projects/transport/mumbai-trans-harbour-link/overview) (official) |
| Mumbai Metro Line 4 (Green Line) | status **COMPLETED → UNDER_CONSTRUCTION**; budget ₹14,700 cr → **₹14,549 cr**; original ₹33,000 cr → ₹14,549 cr; revised ₹37,276 cr → —; agency → MMRDA; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Line 4 is not open: MMRDA's own page shows civil works 92-98% done as of 31 Aug 2026 and news says the first Gaimukh-Cadbury stretch is targeted for Diwali/end-2026; the row wrongly marks it COMPLETED and copies Line 3's description and bud | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/projects/transport/metro-line-4/overview) (official) |
| Versova-Bhayander Coastal Road | budget ₹12,600 cr → **₹22,000 cr**; original ₹12,600 cr → ₹22,000 cr; revised ₹12,600 cr → ₹22,000 cr; expectedEnd 2023-12-31 → 2028-12-31; description corrected | The row copies the southern Coastal Road's description and a 2023 deadline; the Versova-Bhayandar road is a Rs 22,000 crore BMC project whose full construction only began in Jan 2026 with completion targeted for Dec 2028 (the 2018 start dat | [swarajyamag.com](https://swarajyamag.com/news-brief/versova-bhayandar-coastal-road-construction-begins-after-mangrove-cell-clearance) (news) |
| Mumbai Coastal Road (South) | opened/completed 2025-08-15; budget ₹12,400 cr → **₹14,977 cr**; original ₹12,600 cr → ₹12,721 cr; revised ₹12,600 cr → ₹14,977 cr; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | COMPLETED is right (opened in phases from 11 Mar 2024, BWSL connector Jan 2025, all Haji Ali arms by mid-2025, full stretch with promenade inaugurated and 24x7 from 15 Aug 2025), but it was approved at Rs 12,721 crore in 2018 and after seve | [swarajyamag.com](https://swarajyamag.com/news-brief/mumbai-coastal-road-cost-nears-rs-15000-crore-after-seventh-revision-fresh-rs-5985-crore-proposal-linked-to-design-changes-and-additions) (news) |
| Mumbai Urban Transport Project (MUTP) Phase 3 | status **IN_PROGRESS → UNDER_CONSTRUCTION**; budget ₹8,500 cr → **₹10,947 cr**; original ₹10,500 cr → ₹10,947 cr; revised ₹10,500 cr → ₹10,947 cr; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | MUTP-III is sanctioned at Rs 10,947 crore (Panvel-Karjat, Virar-Dahanu quadrupling, Airoli-Kalwa link, trespass control, rakes), not 8,500 crore, and 'IN_PROGRESS' is not a valid status. | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2148495) (official) |
| Mumbai Metro Line 2A (Yellow Line) | opened/completed 2023-01-19; budget ₹6,500 cr → **₹6,410 cr**; original ₹33,000 cr → —; revised ₹37,276 cr → ₹6,410 cr; expectedEnd 2024-06-30 → 2023-01-19; agency → MMRDA; *hidden (unverified seed values):* startDate, progressPct | Line 2A opened fully on 19 Jan 2023 (phase I on 2 Apr 2022) and MMRDA gives a completion cost of Rs 6,410 crore; the row lacks the completion date, names MMRC instead of MMRDA and carries Line 3's 33,000/37,276 crore figures as original/rev | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/projects/transport/metro-line-2a/overview) (official) |
| Mumbai Metro Line 7 (Red Line) | opened/completed 2023-01-19; budget ₹6,200 cr → **₹6,208 cr**; original ₹6,500 cr → —; revised ₹6,500 cr → ₹6,208 cr; expectedEnd 2024-06-30 → 2023-01-19; *hidden (unverified seed values):* startDate, progressPct | Line 7 was fully operational from 19 Jan 2023 (phase I from 2 Apr 2022), not 31 Mar 2024, and MMRDA puts its completion cost at Rs 6,208 crore. | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/projects/transport/metro-line-7/overview) (official) |
| Goregaon-Mulund Link Road | expectedEnd 2027-12-31 → 2028-12-31; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, progressPct | Still under construction (TBM excavation of the twin tunnels began in Aug 2026); BMC now targets tunnels by Oct 2028 and the whole GMLR by Dec 2028, and the 6,000 crore budget appears to cover only the Rs 6,301 crore (+250 crore) tunnel pac | [swarajyamag.com](https://swarajyamag.com/news-brief/goregaon-mulund-link-road-mumbais-largest-tunnel-boring-machines-set-for-testing-ahead-of-excavation-launch) (news) |
| Mumbai Metro Line 6 (Pink Line) | status **IN_PROGRESS → UNDER_CONSTRUCTION**; budget ₹5,500 cr → **₹6,716 cr**; original ₹6,700 cr → —; revised ₹6,700 cr → ₹6,716 cr; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Line 6 is still under construction (MMRDA status as on 31 Aug 2026: stations 87% complete) with a completion cost of Rs 6,716 crore, not 5,500 crore; 'IN_PROGRESS' is not a valid status and the length/stations in the description are off. | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/projects/transport/metro-line-6/overview) (official) |
| Mumbai Sewage Disposal Project Phase 2 | status **IN_PROGRESS → UNDER_CONSTRUCTION**; budget ₹4,500 cr → **₹17,200 cr**; original ₹9,000 cr → ₹17,200 cr; revised ₹9,000 cr → ₹17,200 cr; startDate 2019-01-01 → 2023-01-19; description corrected; *hidden (unverified seed values):* expectedEnd, progressPct | The PM laid the foundation stone for the seven MSDP-II sewage treatment plants on 19 Jan 2023 at a cost of about Rs 17,200 crore, far above the row's 4,500/9,000 crore; 'IN_PROGRESS' is not a valid status (end date not verified). | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=1892302) (official) |
| Virar-Dahanu Railway Project | renamed “Virar-Dahanu Road Quadrupling (MUTP-3)”; status **Announced → UNDER_CONSTRUCTION**; budget ₹3,000 cr → **₹3,578 cr**; original ₹3,000 cr → ₹3,578 cr; revised ₹3,000 cr → ₹3,578 cr; expectedEnd — → 2027-03-31; agency → MRVC (Mumbai Railway Vikas Corporation); description corrected | This is the MRVC quadrupling of the existing Virar-Dahanu line (suburban trains already run to Dahanu), sanctioned at Rs 3,578 crore, 41% complete in Jul 2025 with an FY 2026-27 deadline; it is not merely 'Announced' and not an extension. | [www.freepressjournal.in](https://www.freepressjournal.in/mumbai/virardahanu-quadrupling-project-hits-41-completion-mark-on-track-for-fy-202627-deadline-mrvc) (news) |
| Gargai Dam Project | status **IN_PROGRESS → TENDER_ISSUED**; budget ₹3,000 cr → **₹5,051 cr**; revised ₹5,200 cr → ₹5,051 cr; expectedEnd 2028-12-31 → 2029-06-01; startDate 2022-06-01 → —; *hidden (unverified seed values):* originalBudget, progressPct | Gargai dam has not started construction: BMC is finalising the contract with Soma Enterprises and still awaits forest/wildlife clearances, with construction expected from about Oct 2026 and completion before the 2029 monsoon; total cost inc | [www.freepressjournal.in](https://www.freepressjournal.in/mumbai/mumbai-infra-news-gargai-dam-proposal-cost-slashed-after-review-bmc-saves-344-crore) (news) |
| Eastern Freeway Extension | renamed “Eastern Freeway Extension (Chheda Nagar, Ghatkopar to Anand Nagar, Thane)”; status **IN_PROGRESS → UNDER_CONSTRUCTION**; budget ₹2,500 cr → **₹3,314 cr**; original — → ₹3,314 cr; revised — → ₹3,314 cr; expectedEnd 2026-12-31 → 2028-12-18; startDate 2021-06-01 → 2024-12-18; progress → 17.63%; agency → MMRDA; description corrected | The extension is an MMRDA project approved on 5 Mar 2024 at Rs 3,314.40 crore (not BMC/MSRDC, not 'Orange Gate to Thane', not 2,500 crore), with the contractor appointed on 18 Dec 2024 for a 48-month build and 17.63% physical progress now. | [mmrda.maharashtra.gov.in](https://mmrda.maharashtra.gov.in/en/construction-elevated-eastern-freeway-extension-chheda-nagar-ghatkopar-anand-nagar-thane) (official) |

**Deleted (checked — not a project, duplicate, or invented):**

- SRA Rehabilitation Projects (Various) (IN_PROGRESS, ₹8,000 cr) — non project. 'SRA Rehabilitation Projects (Various)' is an umbrella for the ongoing slum-rehab scheme with an unsourced Rs 8,000 crore figure, not a single trackable project.
- MHADA Housing Lottery Projects (IN_PROGRESS, ₹5,000 cr) — non project. 'MHADA Housing Lottery Projects' is a recurring allotment lottery scheme with an unsourced Rs 5,000 crore figure, not a single trackable project.
- Acquisition of Air India Building, Mumbai (COMPLETED, ₹1,601 cr) — non project. The state's Rs 1,601 crore purchase of the Air India building is a property acquisition, not an infrastructure project (and has no executing agency or dates).
- Meghna Infracon Mumbai Redevelopment Projects (PROPOSED, ₹500 cr) — non project. A private developer (Meghna Infracon) announcing Rs 500 crore for five housing redevelopments is private real-estate investment, not a public infrastructure project.
- Sewri-Nhava Sheva Sea Bridge (COMPLETED) — duplicate of “Mumbai Trans Harbour Link (Atal Setu)”. Sewri-Nhava Sheva Sea Bridge is the same project as the Mumbai Trans Harbour Link (Atal Setu) row, which has the budget, dates and more updates.
- Second AC local train on Harbour Line (Announced) — non project. Introducing a second AC local rake on the Harbour line is a train-service change, not an infrastructure project.
- BMC Drain Clearing and Waterlogging Hotspot Mitigation (Ongoing) — non project. Annual pre-monsoon drain desilting and waterlogging-hotspot work is recurring BMC maintenance with no defined scope, budget or dates, not a discrete project.
- Single-Window Clearance System for Events in Mumbai (APPROVED) — non project. A single-window online clearance system for event permissions is an administrative policy/e-governance reform, not infrastructure.
- Mumbai–Pune Expressway (STALLED) — duplicate of “Mumbai–Pune Expressway”. Identical STATE-scope Mumbai-Pune Expressway row created from the same temporary-closure news item as the Pune row; keep one (the Pune row, corrected to COMPLETED 2002).
- Bengaluru–Mumbai Vande Bharat sleeper train (Approved) — non project. A new Vande Bharat sleeper train service between Bengaluru and Mumbai is a train service announcement, not a construction project.
- Mumbai Traffic Decongestion Infrastructure Projects (Announced) — non project. A generic 'package of flyovers, grade separators and road widening' with no named works, budget or dates is not a trackable project.
- OHE Down Line Issue (ongoing) — non project. 'OHE Down Line Issue' is an overhead-wire fault/repair news item on Central Railway, not a project.
- Mumbai Local Trains Western Railway Maintenance Block (ON_TRACK) — non project. A five-hour Western Railway maintenance 'jumbo block' on one day is a routine operational notice, not an infrastructure project.

**Hidden: unverifiable — deleted:**

- Surya Water Supply Project (IN_PROGRESS, ₹2,000 cr) — no source; The Surya scheme is MMRDA's 403 MLD bulk water project for Mira-Bhayandar and Vasai-Virar (Thane/Palghar), not a BMC supply to Mumbai; MMRDA gives an 
- World‑Class Medcity in Navi Mumbai (PROPOSED) — only a statement of support; no site, agency, cost or approval.

**Figures hidden (row kept, news-sourced):**

- 1 Lakh-Capacity Stadium Mumbai — cleared : no approved project or Rs 10,000 cr cost could be confirmed. The project itself is news-sourced and kept.

**Kept unchanged (news-sourced, not re-checked):** Integrated Logistics Park in Navi Mumbai (PROPOSED)

### Kolkata — 7 verified, 3 deleted as non-project/duplicate, 23 hidden (unverifiable), 0 with figures hidden, 9 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Kolkata Metro East-West Corridor (Line 2) | status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2025-08-22; expectedEnd 2027-06-30 → —; progress → 100%; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate | The last gap on the Green Line (Esplanade-Sealdah, 2.45 km) was inaugurated by the PM on 22 Aug 2025, so the whole Howrah Maidan-Salt Lake Sector V corridor is open; earlier sections opened in Feb 2020, Oct 2020, Jul 2022 and Mar 2024. The  | [www.hindustantimes.com](https://www.hindustantimes.com/real-estate/pm-modi-inaugurates-kolkata-metro-corridors-experts-say-real-estate-markets-to-gain-from-airport-suburban-connectivity-101755857930176.html) (news) |
| New Garia-Airport | renamed “Kolkata Metro Orange Line (New Garia-Airport)”; status **PROPOSED → PARTIALLY_OPERATIONAL**; *hidden (unverified seed values):* budget, originalBudget, revisedBudget | This is not PROPOSED: Kavi Subhash (New Garia)-Hemanta Mukhopadhyay opened on 6 Mar 2024 and was extended to Beleghata on 22 Aug 2025 (about 9.9 km open), while the rest to the airport is under construction by RVNL. The Rs 8,400 cr budget w | [mtp.indianrailways.gov.in](https://mtp.indianrailways.gov.in/view_section.jsp?lang=0&id=0,1,285) (official) |
| Joka-BBD Bagh Metro (Purple Line) | renamed “Kolkata Metro Purple Line (Joka-Esplanade)”; status **UNDER_CONSTRUCTION → PARTIALLY_OPERATIONAL**; description corrected; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, progressPct | Keep this row for the Purple Line (it has the budget fields) but rename it: the line was cut back from BBD Bagh to Esplanade and is not all elevated; Joka-Majerhat is already open, so it is partially operational. The Rs 4,700 cr budget coul | [mtp.indianrailways.gov.in](https://mtp.indianrailways.gov.in/view_section.jsp?lang=0&id=0,1,285) (official) |
| Kolkata Metro Line 4 (Noapara-Barasat) | renamed “Kolkata Metro Yellow Line (Noapara-Barasat)”; status **STALLED → PARTIALLY_OPERATIONAL**; agency → RVNL / Metro Railway Kolkata; description corrected | The line is not STALLED: the PM inaugurated Noapara-Jai Hind Bimanbandar (6.77 km) on 22 Aug 2025 and the rest toward Barasat is being built. The Rs 3,300 cr budget was not verified. | [www.hindustantimes.com](https://www.hindustantimes.com/real-estate/pm-modi-inaugurates-kolkata-metro-corridors-experts-say-real-estate-markets-to-gain-from-airport-suburban-connectivity-101755857930176.html) (news) |
| Tallah Bridge Replacement | renamed “Tala (Tallah) Bridge Reconstruction”; opened/completed 2022-09-22; budget ₹550 cr → **₹468 cr**; expectedEnd 2025-03-31 → —; agency → PWD West Bengal; *hidden (unverified seed values):* startDate, progressPct | The rebuilt Tala bridge was opened by CM Mamata Banerjee on 22 Sep 2022 after about two years of work at Rs 468 cr, so COMPLETED is right but it needs the completion date, and the budget is Rs 468 cr, not Rs 550 cr. | [timesofindia.indiatimes.com](https://timesofindia.indiatimes.com/city/kolkata/kolkata-rebuilt-at-rs-468-crore-in-two-years-new-tala-bridge-to-be-thrown-open-today/articleshow/94361563.cms) (news) |
| Tram Revival | confirmed correct | PROPOSED fits: the new West Bengal government announced in mid-2026 a plan to revive and modernise Kolkata's trams (new tramcars, RITES survey, possible new routes), and only two routes run today. | [www.hindustantimes.com](https://www.hindustantimes.com/india-news/off-the-rails-and-back-again-the-story-of-kolkatas-trams-that-bjps-bengal-govt-wants-to-revive-101782811415779.html) (news) |
| Convention Centre | renamed “Biswa Bangla Convention Centre (New Town)”; status **PROPOSED → COMPLETED**; opened/completed 2017-10-13 | HIDCO's New Town convention centre (Biswa Bangla Convention Centre) was inaugurated by CM Mamata Banerjee on 13 Oct 2017 and has been running ever since, so it is not PROPOSED. | [www.dnaindia.com](https://www.dnaindia.com/india/report-see-pics-mamata-banerjee-inaugurates-biswa-bangla-convention-centre-calls-it-biggest-in-eastern-india-2552664) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- Kolkata Metro Line 3 (Joka-Esplanade) (UNDER_CONSTRUCTION, ₹4,800 cr) — duplicate of “Joka-BBD Bagh Metro (Purple Line)”. This duplicates the Joka-BBD Bagh (Purple Line) row, and its only update (girder work at Chingrighata) belongs to the Orange Line, not the Purple Line, so the kept row is the cleaner record.
- Salt Lake Road Repair Work (Ongoing) — non project. Salt Lake road repair work is routine maintenance, not an infrastructure project.
- Removal of century-old mosque inside Kolkata airport (PROPOSED) — non project. Removing a mosque inside the airport premises is an administrative/demolition decision, not an infrastructure project for citizens to track.

**Hidden: unverifiable — deleted:**

- EM Bypass (PROPOSED, ₹3,500 cr) — no source; not reached by the check
- Kolkata Metro Line 5 (Baranagar-Barrackpore) (PLANNED, ₹2,500 cr) — no source; The Pink Line (Baranagar-Barrackpore) was sanctioned around 2009-10 (reported cost about Rs 2,070 cr), but construction has not started because of ali
- HIDCO New Town Development (IN_PROGRESS, ₹2,000 cr) — no source; not reached by the check
- Kolkata Smart City — New Town (IN_PROGRESS, ₹1,800 cr) — no source; not reached by the check
- Hooghly Riverfront Development (IN_PROGRESS, ₹1,500 cr) — no source; not reached by the check
- Kolkata Metro Line 1 Modernization (IN_PROGRESS, ₹1,200 cr) — no source; not reached by the check
- Joka Township Expansion (IN_PROGRESS, ₹800 cr) — no source; not reached by the check
- Garden Reach Flyover (IN_PROGRESS, ₹420 cr) — no source; not reached by the check
- Sealdah Flyover (IN_PROGRESS, ₹380 cr) — no source; not reached by the check
- East Kolkata Wetlands Conservation (IN_PROGRESS, ₹300 cr) — no source; not reached by the check
- Port Modernisation (PROPOSED) — no source; not reached by the check
- Howrah Bridge (PROPOSED) — no source; not reached by the check
- Vivekananda Bridge (PROPOSED) — no source; not reached by the check
- Diamond Harbour (PROPOSED) — no source; not reached by the check
- LED Street Lighting (PROPOSED) — no source; not reached by the check
- Bagha Jatin (PROPOSED) — no source; not reached by the check
- Bantala Leather (PROPOSED) — no source; not reached by the check
- Drainage Improvement (PROPOSED) — no source; not reached by the check
- NSCBI Airport (PROPOSED) — no source; not reached by the check
- Circular Railway (PROPOSED) — no source; The description is wrong: the Kolkata Circular Railway is not dormant but a working 36 km electrified suburban line run by Eastern Railway. No specifi
- Modernisation of 51 ITIs under PM-SETU (APPROVED) — a statewide ITI skilling scheme, not a Kolkata infrastructure project.
- KSH Integrated Logistics Facility (COMPLETED) — a private commercial warehouse, not a public project.
- Kalyani Greenfield Airport (PROPOSED) — the proposed airport is at Kalyani, Nadia district, not Kolkata.

**Kept unchanged (news-sourced, not re-checked):** Kolkata Metro Capacity Boost and Bridge Strengthening Projects (APPROVED); Kolkata Metro Blue Line Aluminium Third Rail Upgrade (COMPLETED); Kolkata Smart Space Sports Zone Initiative (Ongoing); Sealdah Gati Shakti Cargo Terminal (Commissioned); Eden Gardens revamp (PROPOSED); Foot overbridge near Beleghata metro station (UNDER_CONSTRUCTION); Centre's Water Metro Project (APPROVED); Kolkata Port Terminal Project (AWARDED); Kolkata ring road (PROPOSED)

### Chennai — 14 verified, 0 deleted as non-project/duplicate, 8 hidden (unverifiable), 0 with figures hidden, 0 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Chennai Metro Phase 2 (3 corridors) | budget ₹63,000 cr → **₹63,246 cr**; original ₹63,000 cr → ₹63,246 cr; revised ₹63,000 cr → ₹63,246 cr; progress → 54%; *hidden (unverified seed values):* startDate, expectedEnd | Status is right: no Phase II section has opened yet (first 14.6 km Poonamallee-Vadapalani stretch is safety-cleared and set for PM inauguration on 11 Oct 2026); the Union Cabinet approved the 118.9 km, 128-station project on 3 Oct 2024 at R | [www.pmindia.gov.in](https://www.pmindia.gov.in/en/news_updates/cabinet-approves-chennai-metro-rail-project-phase-ii-comprising-three-corridors/) (official) |
| Chennai Metro Phase 1 Extension | status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2021-02-14; budget ₹11,470 cr → **₹3,770 cr**; original ₹11,470 cr → ₹3,770 cr; revised ₹11,470 cr → ₹3,770 cr; description corrected | The Washermanpet-Wimco Nagar extension was inaugurated by the PM on 14 Feb 2021 (Wimco Nagar Depot station opened 13 Mar 2022) at a cost of Rs 3,770 cr; the stored Rs 11,470 cr is a 10x misreading of a Rs 1,147 cr contract and the descripti | [Google News headline](https://news.google.com/rss/search?q=Washermanpet+Wimco+Nagar+metro+inaugurated+Modi+3,770+crore&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Chennai Peripheral Ring Road (PRR) | budget ₹10,000 cr → **₹17,958 cr**; revised ₹10,000 cr → ₹17,958 cr; agency → Tamil Nadu Highways Dept / TNRDC (JICA-aided); *hidden (unverified seed values):* originalBudget, startDate, expectedEnd, progressPct | The 133 km Ennore-Mamallapuram Peripheral Ring Road is a Tamil Nadu (TNRDC/Highways, JICA-aided) project now reported at Rs 17,958 cr, not an NHAI Rs 10,000 cr project; northern sections are under construction/land acquisition while the Sec | [Google News headline](https://news.google.com/rss/search?q=Chennai+Peripheral+Ring+Road+section+status+2026&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Maduravoyal-Port Elevated Corridor | renamed “Chennai Port-Maduravoyal Double-Decker Elevated Corridor”; status **IN_PROGRESS → UNDER_CONSTRUCTION**; revisedEndDate — → 2027-11-30; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | IN_PROGRESS is not a valid status; NHAI is building the 20.5 km double-tier corridor and has stated completion by November 2027. Cost figures in reports vary (Rs 5,570-5,885 cr), so the stored Rs 5,500 cr / Rs 5,000 cr are left for review. | [Google News headline](https://news.google.com/rss/search?q=Maduravoyal+Chennai+Port+elevated+corridor+double-decker+2026&hl=en-IN&gl=IN&ceid=IN:en) (official) |
| Perur Desalination Plant | status **IN_PROGRESS → UNDER_CONSTRUCTION**; budget ₹2,500 cr → **₹4,276 cr**; original ₹5,200 cr → ₹4,276 cr; revised ₹5,200 cr → ₹4,276 cr; startDate 2022-06-01 → 2023-08-21; *hidden (unverified seed values):* expectedEnd, progressPct | The 400 MLD Perur plant's foundation was laid by the CM on 21 Aug 2023 at Rs 4,276 cr (not Rs 2,500 cr or Rs 5,200 cr); it was ~60% complete in Jan 2026 and Metrowater aims to finish it by end-2026/2027. | [Google News headline](https://news.google.com/rss/search?q=Perur+desalination+plant+400+MLD+2026&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Chennai MRTS Extension | renamed “Chennai MRTS Extension (Velachery-St Thomas Mount)”; status **IN_PROGRESS → COMPLETED**; opened/completed 2026-03-14; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | The long-delayed Velachery-St Thomas Mount MRTS extension got provisional safety clearance and trains started on 14 Mar 2026; the Rs 2,000 cr budget is unsourced and was not verified. | [Google News headline](https://news.google.com/rss/search?q=Velachery+St+Thomas+Mount+MRTS+extension+open+2026&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Nemmeli Desalination Plant Phase 2 | status **IN_PROGRESS → COMPLETED**; opened/completed 2024-02-24; agency → Chennai Metrowater (CMWSSB); *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | The 150 MLD Nemmeli (second) desalination plant was inaugurated by the CM on 24 Feb 2024 and supplies about 9 lakh residents; budget Rs 1,800 cr not verified. | [Google News headline](https://news.google.com/rss/search?q=Nemmeli+150+MLD+desalination+plant+inaugurated+Stalin&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Kosasthalaiyar River Restoration | status **IN_PROGRESS → UNDER_CONSTRUCTION**; description corrected; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | The description was wrong (it described Adyar/Cooum/Buckingham restoration; the Adyar revamp is a separate Rs 4,778 cr project sanctioned Mar 2024). CRRT announced restoration of 70 km of the Kosasthalaiyar in Jun 2025; the Rs 800 cr vs Rs  | [Google News headline](https://news.google.com/rss/search?q=Kosasthalaiyar+CRRT+70+km+restore&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Integrated Command & Control Centre (ICCC) | confirmed correct | Status COMPLETED is right: GCC's Integrated Command and Control Centre has been operating since at least 2022 (used for flood forecasting and waterlogging response); exact opening date and the Rs 300 cr budget were not verified. | [Google News headline](https://news.google.com/rss/search?q=%22command+and+control+centre%22+Chennai+Corporation+Ripon+Buildings&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Ennore LNG | renamed “Ennore LNG Terminal Expansion (5 to 10 MTPA)”; status **PROPOSED → APPROVED**; budget — → **₹3,400 cr**; original — → ₹3,400 cr; agency → IndianOil LNG Pvt Ltd (IOLPL) / Indian Oil Corporation | The Ennore LNG terminal itself was commissioned in 2019; the Centre approved IndianOil's Rs 3,400 cr expansion to 10 MTPA in July 2026, so the expansion is APPROVED, not just proposed. | [Google News headline](https://news.google.com/rss/search?q=Ennore+LNG+terminal+IOC+commissioned+expansion&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Chennai-Puducherry Sea Link Project | description corrected | PROPOSED is right, but the description ('a bridge across a 200 km stretch') is wrong: the Aug 2026 announcement is an elevated coastal road plus ferry service along the ~150 km Chennai-Puducherry coast, with no approved cost. | [Google News headline](https://news.google.com/rss/search?q=Chennai+Puducherry+sea+link&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Bengaluru–Chennai Expressway | status **UNDER_CONSTRUCTION → PARTIALLY_OPERATIONAL**; budget — → **₹17,692 cr**; original — → ₹17,692 cr | About 100 km of the 262 km NHAI expressway is open (Karnataka section plus a 25 km Andhra stretch opened 28-29 Jun 2026, car toll Rs 195), while Tamil Nadu stretches are delayed by court cases and power-line shifting; the project cost is re | [Google News headline](https://news.google.com/rss/search?q=Bengaluru+Chennai+Expressway+opened+stretch+2026&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Tambaram-Chengalpattu | renamed “Tambaram-Chengalpattu 4th Rail Line”; status **PROPOSED → APPROVED**; budget — → **₹757 cr**; original — → ₹757 cr; description corrected | The Railway Minister sanctioned the Tambaram-Chengalpattu fourth line at Rs 757 cr on 22-23 Oct 2025 (it is a 4th line, not quadrupling); works were slated to begin in Jan 2026 but no start confirmation was found, so APPROVED. | [Google News headline](https://news.google.com/rss/search?q=Tambaram+Chengalpattu+fourth+line+crore&hl=en-IN&gl=IN&ceid=IN:en) (news) |
| Chennai Airport Capacity Review and Proposed Satellite Terminal | confirmed correct | Correct as PROPOSED: the TN government reviewed Chennai airport capacity and a satellite terminal in Jul 2026 and was studying a road link to it in Aug 2026; no sanction yet. | [Google News headline](https://news.google.com/rss/search?q=Chennai+airport+satellite+terminal+capacity+Tamil+Nadu+review&hl=en-IN&gl=IN&ceid=IN:en) (news) |

**Hidden: unverifiable — deleted:**

- Cauvery Stage 2 Water Supply (Hogenakkal) (IN_PROGRESS, ₹4,200 cr) — no source; No Chennai 'Cauvery Stage 2' project was found; Hogenakkal Combined Water Supply Phase II (about Rs 7,995-8,000 cr, TN approval Sep 2025) serves Dharm
- Flood Mitigation (PROPOSED, ₹4,000 cr) — no source; Generic seed row: Chennai's storm-water/flood works are many separate, mostly ongoing packages (e.g. ADB-funded Kosasthalaiyar-basin drains, KfW Koval
- Chennai Suburban Railway — New Corridors (IN_PROGRESS, ₹3,500 cr) — no source; Generic umbrella row with an unsourced Rs 3,500 cr budget; real suburban works are separate projects (Tambaram-Chengalpattu 4th line Rs 757 cr, Arakko
- TNHB Mass Housing Projects (IN_PROGRESS, ₹3,000 cr) — no source; Generic seed row (no description, no project name, unsourced Rs 3,000 cr); no single 'TNHB mass housing' project could be matched. Suggest delete unle
- PMAY-U Projects Chennai (IN_PROGRESS, ₹2,500 cr) — no source; A central housing scheme bucket, not one project; the Rs 2,500 cr figure and dates are unsourced. Suggest delete (scheme/policy row) unless replaced w
- Chennai Smart City — T Nagar & Marina (IN_PROGRESS, ₹1,500 cr) — no source; The Smart Cities Mission formally closed on 31 Mar 2025 and Chennai Smart City works (T Nagar pedestrian plaza, etc.) are finished and now under audit
- High-speed rail links from Karnataka to Chennai and Hyderabad (APPROVED) — a Karnataka cabinet resolution backing study-stage high-speed rail corridors, not an approved Chennai project; duplicate of the Hyderabad row.
- Poonamallee Bypass (PROPOSED) — no source; Generic 'manual-research' place-name row; no specific Poonamallee bypass widening project on NH-48 was found in 2025-26 news (only an Aug 2025 NHAI id

### Pune — 11 verified, 2 deleted as non-project/duplicate, 7 hidden (unverifiable), 5 with figures hidden, 3 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Vadhavan Port | status **Approved → UNDER_CONSTRUCTION**; startDate — → 2024-08-30 | STATE-scope row filed under Pune though the port is in Palghar; the PM performed the groundbreaking for construction on 30 Aug 2024 after Union Cabinet approval (Rs 76,220 crore, matches row), so 'Approved' is stale and not a valid status. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Vadhavan_Port) (news) |
| Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg | status **Under Construction → COMPLETED**; opened/completed 2025-06-05; description corrected | STATE-scope row filed under Pune (the expressway does not pass through Pune); the final Igatpuri-Amane stretch opened on 5 Jun 2025, so the whole 701 km route is open and 'Under Construction' with a Dec 2026 end date is stale (Rs 55,335 cro | [en.wikipedia.org](https://en.wikipedia.org/wiki/Mumbai%E2%80%93Nagpur_Expressway) (news) |
| Western Dedicated Freight Corridor (Maharashtra Section) | status **Partially Operational → COMPLETED**; opened/completed 2026-03-31 | STATE-scope row filed under Pune (the corridor ends at JNPT in Raigad); the last JNPT-Vaitarna section was commissioned on 31 Mar 2026 and the PM dedicated the full Rs 73,000 crore Western DFC to the nation on 8 Sep 2026 (the Rs 21,500 cror | [www.business-standard.com](https://www.business-standard.com/industry/news/western-freight-corridor-goes-all-the-way-to-cut-transit-time-60-126090801731_1.html) (news) |
| Navi Mumbai International Airport (NMIA) | status **Under Construction → COMPLETED**; opened/completed 2025-12-25; budget ₹16,700 cr → **₹19,650 cr**; revised — → ₹19,650 cr; description corrected | STATE-scope row filed under Pune although the airport is in Navi Mumbai; Phase 1 was inaugurated by the PM on 8 Oct 2025 (cost about Rs 19,650 crore, not 16,700) and commercial flights began on 25 Dec 2025, so 'Under Construction' is stale. | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2175641) (official) |
| Pune Metro Purple Line (Line 1) | status **OPERATIONAL → COMPLETED**; opened/completed 2024-09-29; description corrected | The last District Court-Swargate underground stretch opened on 29 Sep 2024, so the line was fully complete then, not in Jul/Aug 2023; 'OPERATIONAL' is not a valid status (budget 11,000 crore is the combined Phase-1 figure and was not re-ver | [en.wikipedia.org](https://en.wikipedia.org/wiki/Pune_Metro) (news) |
| Pune Metro Pink Line (Line 3) — Hinjawadi to Shivajinagar | status **UNDER_CONSTRUCTION → DELAYED**; expectedEnd 2026-03-31 → 2027-03-31; agency → PMRDA / Pune IT City Metro Rail Ltd (Tata Realty-Siemens PPP | Not open yet: CMRS gave provisional authorisation on 23 Jul 2026 for the first 12-station Maan-Balewadi section, but opening has slipped past Jul/Aug to about Nov 2026, with the rest targeted for Mar 2027; the Mar 2026 deadline has passed a | [timesofindia.indiatimes.com](https://timesofindia.indiatimes.com/city/pune/13-km-metro-line-3-section-gets-cmrs-nod-passenger-services-likely-soon/articleshow/132613370.cms) (news) |
| Chhatrapati Sambhaji Raje International Airport (Purandar) | budget ₹6,000 cr → **—**; original ₹6,000 cr → —; revised ₹6,000 cr → —; startDate 2026-05-04 → —; agency → Maharashtra Airport Development Company (MADC) | The Rs 6,000 crore in the row is a state loan guarantee for land acquisition, not the project cost, and 3 May 2026 was the land-acquisition start; the CM says MADC will float tenders and construction will start in Dec 2026 (status APPROVED  | [timesofindia.indiatimes.com](https://timesofindia.indiatimes.com/city/pune/purandar-airport-work-will-start-in-december-says-cm-fadnavis/articleshow/133477766.cms) (news) |
| Pune Metro Aqua Line (Line 2) | status **OPERATIONAL → COMPLETED**; opened/completed 2024-03-06 | The final Ruby Hall Clinic-Ramwadi section of the Aqua Line was inaugurated on 6 Mar 2024, so the Vanaz-Ramwadi line was completed then, not on 31 Jul 2023; 'OPERATIONAL' is not a valid status. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Pune_Metro) (news) |
| Mumbai–Pune Expressway | status **STALLED → COMPLETED**; opened/completed 2002-03-01; budget — → **₹1,630 cr**; original — → ₹1,630 cr; revised — → ₹1,630 cr; startDate — → 1998-09-04; agency → MSRDC | The 95 km Mumbai-Pune (Yashwantrao Chavan) Expressway opened over its full length on 1 Mar 2002 at a cost of Rs 1,630 crore; 'STALLED' came from a news item about a temporary traffic closure, and the current work on this corridor is the sep | [msrdc.in](https://msrdc.in/Site/Common/ProjectListDetails.aspx?ID=74&MainId=18) (official) |
| Pune International Airport (Lohegaon) — Terminal 2 Expansion | status **OPERATIONAL → COMPLETED**; opened/completed 2024-07-14 | The new terminal was inaugurated by the PM on 10 Mar 2024 and began passenger operations on 14 Jul 2024; 'OPERATIONAL' is not a valid status. | [www.livemint.com](https://www.livemint.com/news/pune-airport-s-new-terminal-to-be-functional-from-today-all-you-need-to-know-11720925526337.html) (news) |
| Pune Metro Phase 2 — 5-corridor expansion | status **APPROVED_DPR_PENDING → APPROVED** | 'APPROVED_DPR_PENDING' is not a valid status and is stale: the Union Cabinet approved corridors 2A (Vanaz-Chandani Chowk) and 2B (Ramwadi-Wagholi) on 25 Jun 2025 at Rs 3,626.24 crore, and MahaMetro now lists Lines 4/4A (Kharadi-Khadakwasla, | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2139488) (official) |

**Deleted (checked — not a project, duplicate, or invented):**

- Mumbai Metro Line 3 (Aqua Line) (Partially Operational, ₹37,276 cr) — duplicate of “Mumbai Metro Line 3 (Aqua Line)”. Cross-district duplicate: this STATE-scope row filed under Pune is the Mumbai Metro Line 3 already tracked in Mumbai; if the state page does not aggregate district rows, instead update it to COMPLETED
- Installation of 80 Street Lights in NIBM Annexe (COMPLETED) — non project. Installing 80 street lights in one locality after complaints is minor civic maintenance, too small to be tracked as an infrastructure project.

**Hidden: unverifiable — deleted:**

- Shaktipeeth Expressway (Proposed) (Planned) — the Shaktipeeth expressway does not pass through Pune (Wardha to the Goa border); cost and status unconfirmed.
- Versova-Bandra Sea Link (Under Construction) — a Mumbai project filed under Pune.
- Nagpur Metro Phase 2 (Under Construction) — a Nagpur project filed under Pune.
- 33 Missing Link Roads — PMC Decongestion Program (UNDER_IMPLEMENTATION) — a rolling year-by-year PMC road budget, not one sanctioned project; Rs 1,200 cr unconfirmed.
- Thane Creek Bridge III (Operational) — filed under Pune but a Mumbai/Navi Mumbai bridge; its agency, road and completion date look wrong and could not be verified.
- Jalyukt Shivar Abhiyan 2.0 (Ongoing) — a statewide water-conservation campaign, not a Pune project.
- Nanded-Bidar Rail Project (PROPOSED) — the Nanded–Bidar line is in Marathwada/Karnataka, not Pune.

**Figures hidden (row kept, news-sourced):**

- Pune Outer Ring Road — cleared : the Rs 42,000 cr cost could not be confirmed and the description's 173 km is the inner ring road's figure. The project itself is news-sourced and kept.
- Pune Inner Ring Road — cleared : cost Rs 14,200 cr and dates could not be confirmed. The project itself is news-sourced and kept.
- Mula-Mutha River Rejuvenation Project — cleared : Rs 990 cr and Dec 2026 could not be confirmed; the row may mix two schemes. The project itself is news-sourced and kept.
- Pavana-Indrayani River Rejuvenation — cleared : Rs 671 cr and JICA funding could not be confirmed. The project itself is news-sourced and kept.
- Pavana Water Pipeline — Parallel line from Pavana Dam to Nigdi — cleared : Rs 100 cr could not be confirmed. The project itself is news-sourced and kept.

**Kept unchanged (news-sourced, not re-checked):** Wagholi World-Class Road Project (APPROVED); Neral–Shirur highway (APPROVED); PCMC Tertiary Sewage Treatment Plants (100 MLD + 10 MLD) (PLANNED_PPP_STAGE)

### Lucknow — 5 verified, 2 deleted as non-project/duplicate, 3 hidden (unverifiable), 1 with figures hidden, 5 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Lucknow-Agra Expressway | confirmed correct | The 302 km Agra-Lucknow Expressway is operational (opened 21 Nov 2016; the stored 2016-11-20 is probably that date shifted to UTC). The Rs 14,500 cr budget could not be matched to an official figure (reported final cost was about Rs 13,200  | [upeida.up.gov.in](https://upeida.up.gov.in/en/page/agra-lucknow-expressway) (official) |
| Lucknow Metro | renamed “Lucknow Metro Phase 1A (North-South Red Line)”; status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2019-03-08; budget ₹6,700 cr → **₹6,928 cr**; original ₹6,700 cr → ₹6,928 cr; revised ₹6,700 cr → —; progress → 100%; *hidden (unverified seed values):* startDate | The 22.9 km North-South corridor (CCS Airport-Munshipulia) was fully open by 8 Mar 2019 (first stretch Sep 2017), and the Union Cabinet approved Phase 1A in Dec 2015 at Rs 6,928 cr, so it is not UNDER_CONSTRUCTION and the budget is Rs 6,928 | [pib.gov.in](https://pib.gov.in/newsite/PrintRelease.aspx?relid=133816) (official) |
| East-West Corridor | renamed “Lucknow Metro Phase 1B (Charbagh-Vasant Kunj East-West Corridor)”; status **PROPOSED → APPROVED**; budget ₹5,500 cr → **₹5,801 cr**; original ₹5,500 cr → ₹5,881 cr; agency → UPMRC; description corrected; *hidden (unverified seed values):* revisedBudget | The Union Cabinet approved Phase 1B on 12 Aug 2025 at Rs 5,801 cr (the UP government had cleared Rs 5,881 cr in Jan 2024), so it is no longer PROPOSED, and it runs through the old city to Vasant Kunj, not to IT City. Early works (soil testi | [www.thehindu.com](https://www.thehindu.com/news/national/uttar-pradesh/union-cabinet-approves-phase-1b-of-lucknow-metro/article69923686.ece) (news) |
| AI City project | budget ₹3,680 cr → **₹368 cr**; revised ₹3,680 cr → ₹368 cr | The row's own source and description say the AI City project costs Rs 368 cr, but budget and revisedBudget are stored as Rs 3,680 cr (10x too high); originalBudget already holds the right Rs 368 cr. | [Google News headline](https://news.google.com/rss/articles/CBMixgFBVV95cUxNLThYN1U4S3ktUjZqVWNmbEgwdW1) (news) |
| Lucknow Airport | renamed “Lucknow Airport Terminal 3 (CCS International Airport)”; status **PROPOSED → COMPLETED**; opened/completed 2024-03-10; agency → Lucknow International Airport Ltd (Adani Airport Holdings); *hidden (unverified seed values):* budget, originalBudget, revisedBudget | The new integrated Terminal 3 at Lucknow airport was inaugurated by the PM on 10 Mar 2024 and is the airport's only active terminal, so it is not PROPOSED. Its cost is reported as about Rs 2,400 cr (up from Rs 1,383 cr), which matches the b | [timesofindia.indiatimes.com](https://timesofindia.indiatimes.com/travel/travel-news/pm-modi-inaugurates-t3-of-lucknow-airport-along-with-5-other-airports-in-uttar-pradesh/articleshow/108442417.cms) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- New Ambedkar memorial (Announced) — duplicate of “Ambedkar Memorial, Lucknow”. Two empty rows ('New Ambedkar memorial' and 'Ambedkar Memorial, Lucknow') were seeded from news on the same day (12 Apr 2026) with the same 'Announced' status and no details; keep one.
- Laser, Light & Sound Show at Smritika War Memorial (Inaugurated) — non project. A laser, light and sound show at the Smritika war memorial is a small tourism attraction or event, not an infrastructure project, and the row has no description, budget or valid status.

**Hidden: unverifiable — deleted:**

- Ring Road Phase 2 (PROPOSED, ₹5,000 cr) — no source; not reached by the check
- Gomti Riverfront Development (STALLED, ₹1,528 cr) — no source; not reached by the check
- IT City Lucknow (PROPOSED) — no source; not reached by the check

**Figures hidden (row kept, news-sourced):**

- PM MITRA Textile Parks: Lucknow and Varanasi Projects — cleared : the Rs 20,000 cr 'combined budget' reads like expected private investment and matches no official figure. The project itself is news-sourced and kept.

**Kept unchanged (news-sourced, not re-checked):** State Disaster Management Authority Headquarters (COMPLETED); Ambedkar Memorial, Lucknow (Announced); Navy-Themed Memorial in Lucknow (APPROVED); Kukrail Night Safari (APPROVED); Lucknow–Barabanki Outer Four-Lane Road (APPROVED)

### Bengaluru Urban — 25 verified, 40 deleted as non-project/duplicate, 96 hidden (unverifiable), 0 with figures hidden, 0 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension | renamed “Namma Metro Phase 2A & 2B — Blue Line (Central Silk Board–KR Puram–KIA Airport)”; status **STALLED → UNDER_CONSTRUCTION**; budget ₹147,880 cr → **₹14,788 cr**; original ₹37,170 cr → ₹14,788 cr; revised ₹147,880 cr → ₹14,788 cr; revisedEndDate — → 2028-03-31; description corrected | Budget was 10x too high (1,47,880 cr vs sanctioned Rs 14,788.101 cr for 2A+2B combined), name/description described a different line, and status STALLED is wrong — the line is under construction; this row is kept as the single Blue Line (2A | [pib.gov.in](https://pib.gov.in/PressReleasePage.aspx?PRID=1712859) (official) |
| Bengaluru Peripheral Ring Road (PRR) — 116 km Ring | renamed “Bengaluru Business Corridor (Peripheral Ring Road-1, 73 km)”; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | PRR was renamed Bengaluru Business Corridor and PRR-1 is about 73 km, not 116 km; DELAYED is right (concessionaire tenders cancelled in 2022 and 2024, land acquisition pending). Budget of about Rs 27,000 cr is roughly consistent; no constru | [themetrorailguy.com](https://themetrorailguy.com/bda-bangalore-peripheral-ring-road-route-map-status-update-tenders/) (news) |
| Satellite Town Ring Road (STRR) — 285 km Outer Ring | status **In Progress → PARTIALLY_OPERATIONAL**; budget ₹18,750 cr → **₹17,000 cr**; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | 'In Progress' is not a valid status; the 80-km Dobbaspet–Hoskote stretch was inaugurated on 11 Mar 2024 while other sections are pending, and NHAI calls it a Rs 17,000 cr project (row had Rs 18,750 cr, unsourced). | [www.moneycontrol.com](https://www.moneycontrol.com/news/technology/pm-modi-to-inaugurate-two-stretches-of-bengaluru-satellite-town-ring-road-on-march-11-12432761.html) (news) |
| 37-km Sarjapur To Hebbal Metro Line Via Agara, Koramangala, Diary Circle | renamed “Namma Metro Phase 3A — Red Line (Sarjapur–Hebbal)”; status **TENDER_ISSUED → PROPOSED**; budget ₹15,000 cr → **₹25,999 cr**; agency → BMRCL; description corrected | Not at tender stage: the state approved it in Dec 2024 but the Centre said in July 2026 it cannot give an approval timeline; cost now about Rs 25,999 cr after optimisation (state DPR Rs 28,405 cr, revised Rs 25,485 cr). | [newsfirstprime.com](https://newsfirstprime.com/bengaluru/no-timeline-yet-for-namma-metro-red-line-approval-says-centre-12208029) (news) |
| Bengaluru–Mysuru Highway 10-Lane Expressway (Namma Expressway) | status **Completed → COMPLETED**; opened/completed 2023-03-12; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | Status 'Completed' is not a valid value and completionDate was missing; the PM inaugurated the 118-km expressway on 12 Mar 2023 at about Rs 8,480 cr. | [www.business-standard.com](https://www.business-standard.com/article/current-affairs/pm-modi-inaugurates-118-km-long-bengaluru-mysuru-expressway-project-123031200403_1.html) (news) |
| Bengaluru Suburban Rail Project — Corridor 1 (Devanahalli–Baiyappanahalli) | renamed “Bengaluru Suburban Rail — Corridor 1 Sampige (KSR Bengaluru–Devanahalli)”; status **UNDER_CONSTRUCTION → TENDER_ISSUED**; agency → K-RIDE; description corrected; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | Corridor 1 (Sampige) runs KSR Bengaluru–Devanahalli, not from Baiyappanahalli, and is still at tender stage; the whole BSRP deadline was pushed to 2030 (The Hindu, 22 Jan 2026). Corridor budget Rs 5,859 cr unverified; originalBudget holds t | [kride.in](https://kride.in/about/) (official) |
| Cauvery Water Supply Augmentation — Phase 5 Stage 1 (775 MLD) | renamed “Cauvery Water Supply Scheme Stage V (775 MLD)”; status **In Progress → PARTIALLY_OPERATIONAL**; agency → BWSSB; description corrected; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | Stage V was inaugurated on 16 Oct 2024 and the TK Halli–Vajarahalli transmission main was commissioned in Jan 2025, but household connections are still ongoing (about 89,000 of a 3-4 lakh target by May 2025). Budget unchanged: Rs 5,550 cr i | [citizenmatters.in](https://citizenmatters.in/promise-of-cauvery-stage-v-bengalureans-to-be-worry-free/) (news) |
| Bengaluru Airport Terminal 2 | renamed “Kempegowda International Airport — Terminal 2 (Phase 1)”; opened/completed 2022-11-11; *hidden (unverified seed values):* progressPct | Correct as COMPLETED at about Rs 5,000 cr; the PM inaugurated T2 on 11 Nov 2022 (row had 10 Nov). This row is kept over the duplicate 'In Progress' T2 row. | [pib.gov.in](https://pib.gov.in/PressReleaseIframePage.aspx?PRID=1875177) (official) |
| Namma Metro Green Line Extension to Tumkur Road (Yeshvanthapur–Tumkur) | renamed “Namma Metro Green Line extension — Nagasandra–Madavara (BIEC)”; opened/completed 2024-11-07; budget ₹4,900 cr → **₹298 cr**; expectedEnd 2030-03-31 → —; agency → BMRCL | The Tumkur Road extension is the Nagasandra–Madavara (BIEC) stretch, opened 7 Nov 2024 at about Rs 298 cr, not Rs 4,900 cr; expectedEnd 2030 was wrong. | [metrorailnews.in](https://metrorailnews.in/bangalore-metros-green-line-extension-opens/) (news) |
| Cauvery Water Supply Phase 5 Stage 2 (additional 550 MLD) | renamed “Cauvery Water Supply Scheme Stage VI (500 MLD)”; status **In Progress → PROPOSED**; budget ₹4,800 cr → **₹6,939 cr**; original — → ₹6,939 cr; revised — → ₹6,939 cr; description corrected; *hidden (unverified seed values):* startDate, expectedEnd, progressPct | There is no 'Phase 5 Stage 2'; the next augmentation is Cauvery Stage VI (500 MLD, DPR Rs 6,939 cr), which is at DPR stage with construction pending, so 'In Progress' is wrong. | [citizenmatters.in](https://citizenmatters.in/promise-of-cauvery-stage-v-bengalureans-to-be-worry-free/) (news) |
| Bengaluru Suburban Rail — Corridor 2 (Byappanahalli–Chikkabanavara) | renamed “Bengaluru Suburban Rail — Corridor 2 Mallige (Benniganahalli–Chikkabanavara)”; revisedEndDate — → 2027-03-31; agency → K-RIDE; description corrected; *hidden (unverified seed values):* budget, originalBudget, revisedBudget, startDate, expectedEnd, progressPct | UNDER_CONSTRUCTION is correct but the Dec 2026 end date is stale (deadline pushed to March 2027 per The Hindu, Jan 2026) and the description described the whole 148-km network. Corridor budget Rs 4,548 cr unverified. | [en.wikipedia.org](https://en.wikipedia.org/wiki/Bengaluru_Suburban_Railway) (news) |
| Namma Metro Phase 3 — Dairy Circle to Hebbal (Pink Line) | renamed “Namma Metro Phase 3 — Orange & Grey Lines (JP Nagar 4th Phase–Kempapura, Hosahalli–Kadabagere)”; budget ₹3,700 cr → **₹15,611 cr**; original ₹37,170 cr → ₹15,611 cr; revised ₹3,700 cr → ₹15,611 cr; agency → BMRCL; description corrected | Name wrongly called it a Dairy Circle–Hebbal Pink Line; Phase 3 is the 44.65 km Orange/Grey corridors approved at Rs 15,611 cr (not Rs 3,700 cr); no work orders yet as Jan 2026 tenders are being recalled, deadline slipping from 2029 toward  | [metrorailnews.in](https://metrorailnews.in/bangalore-metro-phase-3-double-decker-retendering/) (news) |
| Hosur Road Elevated Corridor (Silk Board–Electronic City) | renamed “Electronic City Elevated Expressway (Silk Board–Electronic City, Hosur Road)”; status **In Progress → COMPLETED**; opened/completed 2010-01-22; agency → NHAI / BETL; description corrected; *hidden (unverified seed values):* budget, startDate, expectedEnd, progressPct | The Silk Board–Electronic City elevated corridor was inaugurated on 22 Jan 2010; the row's 'In Progress' status, 2021-2025 dates and Rs 1,850 cr budget have no source (description actually described the 2024 Silk Board double-decker). | [en.wikipedia.org](https://en.wikipedia.org/wiki/Electronic_City_Elevated_Expressway) (news) |
| Bengaluru Metro Phase 2 | renamed “Namma Metro Phase 2 (75 km: Purple/Green extensions, Yellow and Pink lines)”; status **UNDER_CONSTRUCTION → PARTIALLY_OPERATIONAL**; budget ₹171 cr → **₹40,425 cr**; original ₹171 cr → ₹26,405 cr; revised ₹171 cr → ₹40,425 cr; agency → BMRCL; description corrected | Budget Rs 171 cr was one E&M contract, not the project cost; Phase 2 was approved at Rs 26,405 cr (2014), revised to Rs 30,695 cr and then Rs 40,425 cr by the Karnataka cabinet (2025, Centre review pending); most reaches are open so status  | [www.deccanherald.com](https://www.deccanherald.com/india/karnataka/bengaluru/karnataka-cabinet-okays-rs-972990-crore-cost-hike-for-namma-metros-phase-2-3553615) (news) |
| Bengaluru's E-City Metro Neo | renamed “Tech Halli Express — Electronic City Metro Neo (ELCITA)”; status **ANNOUNCED → PROPOSED**; agency → ELCITA | A 2022 ELCITA proposal for a 5-km Metro Neo in Electronic City; 'ANNOUNCED' is not a valid status and no later progress was found. | [metrorailnews.in](https://metrorailnews.in/bengalurus-e-city-metro-neo-to-be-named-tech-halli-express/) (news) |
| KSR–Kengeri | renamed “Bengaluru Suburban Rail — Corridor 3 Parijaata (Kengeri–KSR–Whitefield)”; status **PROPOSED → APPROVED**; agency → K-RIDE; description corrected | 'KSR–Kengeri' is part of BSRP Corridor 3 (Parijaata, Kengeri–Whitefield), which was sanctioned with the project in Oct 2020 but has not started. | [kride.in](https://kride.in/about/) (official) |
| Heelalige–Rajanakunte | renamed “Bengaluru Suburban Rail — Corridor 4 Kanaka (Heelalige–Rajanukunte)”; status **PROPOSED → UNDER_CONSTRUCTION**; revisedEndDate — → 2027-03-31; agency → K-RIDE | Kanaka line (46.24 km, Heelalige–Rajanukunte) is a priority BSRP corridor awarded to L&T with works under way, not PROPOSED; deadline now March 2027. | [kride.in](https://kride.in/about/) (official) |
| Baiyappanahalli to Whitefield | renamed “Namma Metro Purple Line extension — Baiyappanahalli–Whitefield (Kadugodi)”; status **PROPOSED → COMPLETED**; opened/completed 2023-10-09; budget — → **₹4,250 cr**; agency → BMRCL; description corrected | Shown as PROPOSED but KR Puram–Whitefield was inaugurated by the PM on 25 Mar 2023 (about Rs 4,250 cr) and the last Baiyappanahalli–KR Puram link opened 9 Oct 2023. | [www.pib.gov.in](https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1910674&reg=48&lang=2) (official) |
| Bengaluru Metro Yelachenahalli–Anjanapura Route | renamed “Namma Metro Green Line extension — Yelachenahalli–Silk Institute (Kanakapura Road)”; status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2021-01-14; agency → BMRCL | The 5.8-km Yelachenahalli–Silk Institute extension was inaugurated on 14 Jan 2021, so it is not under construction. | [themetrorailguy.com](https://themetrorailguy.com/2021/01/14/bangalore-metros-silk-institute-extn-of-phase-2-inaugurated/) (news) |
| Third Runway | status **PROPOSED → CANCELLED** | BIAL's third-runway (North Parallel Runway) idea was turned down by the government, after which BIAL began pushing for a second city airport instead. | [www.deccanherald.com](https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fbial-chasing-2nd-airport-after-being-denied-a-3rd-runway-2724354) (news) |
| Bommasandra–Hosur | confirmed correct | Bommasandra–Hosur cross-border metro is still only a proposal (Tamil Nadu pushing it; BMRCL called it not feasible), so PROPOSED is correct. | [metrorailnews.in](https://metrorailnews.in/tamil-nadu-government-pushes-hosur-bommasandra-metro-link-with-karnataka-in-budget-2026-27/) (news) |
| Bengaluru Metro Double Decker Flyover | renamed “Ragigudda–Central Silk Board Double-Decker Flyover (road + Yellow Line metro)”; status **UNDER_CONSTRUCTION → COMPLETED**; opened/completed 2024-07-17; agency → BMRCL | Bengaluru's first double-decker (road below, Yellow Line metro above) opened to road traffic on 17 Jul 2024 and the metro deck opened with the Yellow Line in Aug 2025; an extra ramp section opened on trial in Apr 2026 (Wikipedia). Cost of a | [www.deccanherald.com](https://www.deccanherald.com/india/karnataka/bengaluru/bengalurus-first-double-deck-flyover-opens-for-traffic-3109828) (news) |
| Bengaluru–Chennai Expressway | renamed “Bengaluru–Chennai Expressway (NE-7)”; status **PROPOSED → PARTIALLY_OPERATIONAL**; agency → NHAI; description corrected | Shown as PROPOSED but the Karnataka section is complete and open since Dec 2024 and over 230 km of the corridor is built; full opening slipped to 2027 due to a stalled Tamil Nadu package. | [theprint.in](https://theprint.in/india/governance/bengaluru-chennai-e-way-meant-to-cut-travel-time-to-3-hrs-set-to-miss-3rd-deadline-due-to-legal-tangle/2958232/) (news) |
| RV Road-Bommasandra | renamed “Namma Metro Yellow Line (RV Road–Bommasandra)”; status **PROPOSED → COMPLETED**; opened/completed 2025-08-10; budget — → **₹7,160 cr**; agency → BMRCL; description corrected | Shown as PROPOSED but the PM inaugurated the Yellow Line on 10 Aug 2025 (about Rs 7,160 cr). | [www.pmindia.gov.in](https://www.pmindia.gov.in/en/news_updates/pm-inaugurates-lays-foundation-stone-of-metro-projects-worth-around-rs-22800-crore-in-bengaluru-karnataka/) (official) |
| Bengaluru Metro Purple Line Extension | renamed “Namma Metro Purple Line extension — Mysuru Road–Kengeri–Challaghatta”; opened/completed 2023-10-09; agency → BMRCL | Mysuru Road–Kengeri opened 29 Aug 2021 and the Kengeri–Challaghatta link opened 9 Oct 2023, completing the western extension; the Hosur update on this row is unrelated. | [aninews.in](https://aninews.in/news/national/general-news/bengalurus-much-awaited-purple-line-metro-extension-service-begins20231009101601/) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- Namma Metro Green Line (Nagasandra–Silk Board) Full Commissioning (Completed, ₹36,695 cr) — duplicate of “Bengaluru Metro Phase 2”. Name is wrong (Green Line runs Madavara–Silk Institute, not to Silk Board) and its Rs 36,695 cr budget and updates are Phase 2 cost news; the Green Line extensions have their own rows.
- ORR Metro (UNDER_CONSTRUCTION, ₹14,844 cr) — duplicate of “Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension”. 'ORR Metro' is the Outer Ring Road–Airport Blue Line (Phase 2A/2B), already covered by the kept Blue Line row.
- Namma Metro Phase 2B — Yellow Line (Silk Board to KIA Airport) (UNDER_CONSTRUCTION, ₹14,788 cr) — duplicate of “Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension”. Phase 2B (KR Puram–Airport) is sanctioned together with Phase 2A as one Rs 14,788 cr project; this row also mislabels it as the Yellow Line and carries a Pink Line description.
- Namma Metro Purple Line Full Commissioning (Baiyappanahalli–Kengeri) (Completed, ₹14,460 cr) — duplicate of “Bengaluru Metro Purple Line Extension”. Duplicate of the Purple Line western (Kengeri) extension; the name is wrong (Purple Line is Whitefield–Challaghatta) and the Rs 14,460 cr budget has no source.
- Kempegowda International Airport — Terminal 2 (T2) (In Progress, ₹13,000 cr) — duplicate of “Bengaluru Airport Terminal 2”. Duplicate of the Terminal 2 row; T2 opened in Nov 2022, so 'In Progress' with Rs 13,000 cr is wrong.
- NICE Road (Bengaluru-Mysuru Expressway Stage 1) (Completed, ₹4,800 cr) — duplicate of “Bengaluru–Mysuru Highway 10-Lane Expressway (Namma Expressway)”. The row's description, dates and completion are the NHAI Bengaluru–Mysuru Expressway (already a row); NICE Road/BMIC is a different private project that is still largely incomplete, and one update is 
- NH-44 (Bellary Road) 8-Lane Widening to Airport (In Progress, ₹2,800 cr) — duplicate of “Ballary Road Widening (Hebbal–Yelahanka–Devanahalli) 6-Lane”. Same Bellary Road (NH-44) Hebbal–airport corridor as the 'Ballary Road Widening (Hebbal–Yelahanka–Devanahalli)' row; neither has a source.
- Bangalore Metro (CANCELLED, ₹2,170 cr) — duplicate of “Bengaluru Metro Phase 2”. Generic 'Bangalore Metro' row marked CANCELLED because of one terminated contract; its updates (Reach 6 contracts, Anjanapura depot, Yelachenahalli opening) belong to Phase 2, which is not cancelled.
- KIA Airport Metro Station (Elevated + Underground Mix) (UNDER_CONSTRUCTION, ₹1,800 cr) — duplicate of “Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension”. Airport metro stations are a component of Blue Line Phase 2B, not a separate project; the Rs 1,800 cr figure has no source.
- City Surveillance CCTV Network Expansion — 10,000 Cameras (In Progress, ₹380 cr) — duplicate of “Safe City”. Duplicates the 'Safe City' row (both describe about 10,000 city police CCTV cameras); this seed row has no source.
- Challaghatta Metro Station (CANCELLATION) — duplicate of “Bengaluru Metro Purple Line Extension”. Challaghatta station is part of the Purple Line extension and opened on 9 Oct 2023; the 'cancellation' was only a dropped transit hub, not a project.
- Lalbagh (PROPOSED) — duplicate of “Lal Bagh Botanical Garden — Glass House & Terrace Expansion”. Same glass-house upgrade as the 'Lal Bagh Botanical Garden — Glass House & Terrace Expansion' row (itself unverified).
- Bengaluru–Mysuru Rail Route (PROPOSED) — non project. The row is a ministers' inspection and a Mandya station upgrade announcement on the existing Bengaluru–Mysuru line, not a Bengaluru Urban project.
- Comprehensive Mobility Plan (PROPOSED) — non project. The Comprehensive Mobility Plan is a DULT planning document, not a project.
- IISER (PROPOSED) — non project. There is no IISER in Bengaluru and none proposed there; the IISERs are Pune, Kolkata, Mohali, Bhopal, Thiruvananthapuram, Tirupati, Berhampur (plus proposed Nagaland, Gandhinagar).
- Green Line Extension — Nagasandra (PROPOSED) — duplicate of “Namma Metro Green Line Extension to Tumkur Road (Yeshvanthapur–Tumkur)”. Duplicate of the Nagasandra–Madavara (BIEC) Green Line extension, which opened 7 Nov 2024.
- Yelachenahalli to Anjanapura (PROPOSED) — duplicate of “Bengaluru Metro Yelachenahalli–Anjanapura Route”. Duplicate of the Yelachenahalli–Silk Institute (Anjanapura) Green Line extension, which opened in Jan 2021.
- BBMP Bifurcation and Urban Governance Reform (Under Discussion) — non project. A governance reform (BBMP split), not an infrastructure project; the Greater Bengaluru Authority replaced BBMP in 2025.
- Mysuru Road to Kengeri (PROPOSED) — duplicate of “Bengaluru Metro Purple Line Extension”. Duplicate of the Purple Line Mysuru Road–Kengeri–Challaghatta extension (opened 2021/2023), wrongly shown as PROPOSED.
- ORR Line (PROPOSED) — duplicate of “Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension”. Generic 'ORR Line' seed row duplicates the Blue Line (Phase 2A/2B) along the Outer Ring Road.
- Namma Metro Airport Line (PROPOSED) — duplicate of “Namma Metro Phase 2A — JP Nagar to Mysuru Road Extension”. The Namma Metro airport line is Phase 2B of the Blue Line, already covered by the kept Blue Line row.
- Signal-Free Corridor (PROPOSED) — duplicate of “Outer Ring Road Improvements (Hebbal–Silk Board) Phase 3”. Generic 'make ORR signal-free' row overlaps the 'Outer Ring Road Improvements (Hebbal–Silk Board)' row; neither has a source.
- 37-km new metro corridor connecting Hebbal to Sarjapur (PROPOSED) — duplicate of “37-km Sarjapur To Hebbal Metro Line Via Agara, Koramangala, Diary Circle”. Duplicate of the Sarjapur–Hebbal Phase 3A metro row.
- Kanakapura Namma Metro section (UNDER_CONSTRUCTION) — duplicate of “Bengaluru Metro Yelachenahalli–Anjanapura Route”. The 'Kanakapura Namma Metro section' is the same Yelachenahalli–Silk Institute extension, opened Jan 2021.
- Sarjapur–Hebbal Metro (PROPOSED) — duplicate of “37-km Sarjapur To Hebbal Metro Line Via Agara, Koramangala, Diary Circle”. Duplicate of the Sarjapur–Hebbal Phase 3A metro row.
- Namma Metro One Nation One Card QR code ticketing (ON_TRACK) — non project. A ticketing/fare-card feature announcement, not an infrastructure project.
- Whitefield Metro (PROPOSED) — duplicate of “Baiyappanahalli to Whitefield”. Duplicate of the Baiyappanahalli–Whitefield Purple Line extension, open since 2023.
- Automated Traffic Management (PROPOSED) — duplicate of “Integrated Traffic Management System (ITMS) Phase 2 — 500 Junctions”. Duplicates the 'Integrated Traffic Management System (ITMS) Phase 2' adaptive-signal row.
- Smart City Command (PROPOSED) — duplicate of “Integrated Command & Control Centre (ICCC) Expansion”. Duplicates the 'Integrated Command & Control Centre (ICCC) Expansion' row.
- BWSSB pipeline repair using robots (UNDER_CONSTRUCTION) — non project. Using robots for trenchless pipeline repair is a maintenance method/news item, not a project with scope, budget or completion.
- Karnataka CNG Station Expansion Programme 2030 (Announced) — non project. A statewide CNG-station target/programme by gas companies, not a specific Bengaluru Urban project.
- Bengaluru Master Plan (Announced) — non project. A statutory land-use master plan document, not a buildable infrastructure project.
- GBA Replacement of BDA (Announced) — non project. A governance/legislative change (GBA vs BDA), not an infrastructure project; also overlaps the other GBA rows.
- Greater Bengaluru Authority Expansion (Announced) — non project. Administrative boundary/governance change, not an infrastructure project; duplicates the other GBA governance rows.
- Hebbal Flyover (PROPOSED) — duplicate of “Hebbal Cloverleaf Interchange Upgrade”. Duplicates the 'Hebbal Cloverleaf Interchange Upgrade' row (same Hebbal junction upgrade).
- Tumkur Road Improvement (PROPOSED) — duplicate of “Tumkur Road–Nelamangala 6-Lane (NH-48 Widening)”. Generic Tumkur Road (NH-48) improvement row overlaps the 'Tumkur Road–Nelamangala 6-Lane (NH-48 Widening)' row.
- Karnataka metro rail extension from Bommasandra to Hosur (APPROVED) — duplicate of “Bommasandra–Hosur”. Duplicate of the Bommasandra–Hosur metro row; it is wrongly marked APPROVED and carries a Jayadeva hospital description/agency.
- Kothanur Depot (APPROVED) — duplicate of “Bengaluru Metro Phase 2”. Kothanur depot is a component of the Pink Line (Phase 2 Reach 6), not a separate project.
- Bengaluru roads pothole filling (Ongoing) — non project. Pothole filling is routine road maintenance, not an infrastructure project.
- Bengaluru Urban Planning Restructuring - GBA Transition (Announced) — non project. Governance restructuring (BDA-to-GBA transition), not an infrastructure project; duplicates the other GBA rows.

**Hidden: unverifiable — deleted:**

- Bengaluru Road Upgrade (APPROVED) — a vague road-works allocation, not a named project (its own update says Rs 2,000 cr but the budget was stored as Rs 20,000 cr).
- KSR Bengaluru Station Redevelopment (World-Class) (In Progress, ₹4,500 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Underground Drainage Scheme Phase 3 (Bengaluru South Zone) (In Progress, ₹2,400 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Electric Bus Fleet Expansion — BMTC 1,500 EVs (In Progress, ₹2,400 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP 1,000 Roads Annual Improvement Programme 2024-25 (In Progress, ₹2,400 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Global Tech Village — Devanahalli ITIR Phase 2 (In Progress, ₹2,400 cr) — no source; Devanahalli/Doddaballapur are in Bengaluru Rural (now Bengaluru North) district, not Bengaluru Urban. Name mixes 'Global Tech Village' (a private tech
- KR Puram–Hebbal Elevated Corridor (NH-75 alignment) (In Progress, ₹2,200 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BESCOM Distribution Network Augmentation — North Zone (In Progress, ₹1,820 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BDA Nadaprabhu Kempegowda Layout (NPKL) — 16,000 sites (In Progress, ₹1,800 cr) — no source; Nadaprabhu Kempegowda Layout is a real BDA layout (launched about 2015), but the 16,000-site, Rs 1,800 cr and 2025 completion details are unsourced; '
- Outer Ring Road Improvements (Hebbal–Silk Board) Phase 3 (In Progress, ₹1,240 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BWSSB Smart Water Metering (12 Lakh Connections) (In Progress, ₹1,200 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Victoria Hospital Modernisation & New Block (700-bed) (In Progress, ₹1,200 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Tumkur Road–Nelamangala 6-Lane (NH-48 Widening) (In Progress, ₹1,180 cr) — no source; Real project: the PM laid the foundation for six-laning of the Nelamangala–Tumakuru section of NH-48 on 20 Jun 2022 (cost bundled with other roads, ab
- BESCOM Smart Metering Project Phase 2 (10 Lakh Consumers) (In Progress, ₹1,100 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bengaluru International Sports City (Anekal) (In Progress, ₹980 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Ballary Road Widening (Hebbal–Yelahanka–Devanahalli) 6-Lane (In Progress, ₹920 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bowring & Lady Curzon Hospital Redevelopment (500-bed) (In Progress, ₹880 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BESCOM Underground Cabling — 200 km in Core City (In Progress, ₹860 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bengaluru North University — New Campus, Doddaballapur (In Progress, ₹850 cr) — no source; Devanahalli/Doddaballapur are in Bengaluru Rural (now Bengaluru North) district, not Bengaluru Urban. Seed-data row with no source; 'In Progress' is n
- Storm Water Drain (Rajakaluves) Desilting & Widening — 100 km (In Progress, ₹840 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bengaluru Waste-to-Energy Plant, Bidadi (30 MW) (In Progress, ₹840 cr) — no source; Bidadi is in Ramanagara (Bengaluru South) district, not Bengaluru Urban. Seed-data row with no source; 'In Progress' is not a valid status value and t
- Electronic City Phase 3 Expansion (200 acres) (In Progress, ₹820 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP Bio-Methanation Plants (5 Zones, 1000 TPD) (In Progress, ₹680 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Vrushabhavathi Valley Sewage Treatment Plant (300 MLD) (In Progress, ₹680 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- IISc New Engineering & Computing Research Complex (In Progress, ₹620 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP Smart City — Shivajinagar Area Upgrade (In Progress, ₹620 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- ISRO URSC (U.R. Rao Satellite Centre) Campus Expansion (In Progress, ₹580 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Marathahalli Bridge Replacement & Road Widening (In Progress, ₹580 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bellandur Lake Rejuvenation & Sewage Diversion (In Progress, ₹480 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Sarjapur Road Grade Separator & Widening (In Progress, ₹480 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP 210 Lakes Restoration Programme (Phase 1 — 30 lakes) (In Progress, ₹450 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Solar Rooftop Programme — Government Buildings (100 MW) (In Progress, ₹450 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Integrated Traffic Management System (ITMS) Phase 2 — 500 Junctions (In Progress, ₹420 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- NIMHANS New Patient Block & Research Centre (In Progress, ₹420 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Varthur–Whitefield Road Widening (2-lane to 6-lane) (In Progress, ₹420 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- KIADB Doddaballapur Textile Park Expansion (In Progress, ₹380 cr) — no source; Devanahalli/Doddaballapur are in Bengaluru Rural (now Bengaluru North) district, not Bengaluru Urban. Seed-data row with no source; 'In Progress' is n
- 400 kV Substation, Devanahalli (KPTCL) (In Progress, ₹380 cr) — no source; Devanahalli/Doddaballapur are in Bengaluru Rural (now Bengaluru North) district, not Bengaluru Urban. Seed-data row with no source; 'In Progress' is n
- Hebbal Cloverleaf Interchange Upgrade (In Progress, ₹380 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Kidwai Memorial Institute of Oncology Expansion (In Progress, ₹350 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- PMAY-U Affordable Housing — Rajiv Gandhi Nagar (In Progress, ₹320 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Bengaluru Urban Forest Development — 1,000 Acres (In Progress, ₹320 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Varthur Lake Restoration & STP (Primary Treatment) (In Progress, ₹320 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Devanahalli Industrial Area Internal Road Network (In Progress, ₹320 cr) — no source; Devanahalli/Doddaballapur are in Bengaluru Rural (now Bengaluru North) district, not Bengaluru Urban. Seed-data row with no source; 'In Progress' is n
- IIIT Bangalore Campus Expansion — Anekal (In Progress, ₹280 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Integrated Command & Control Centre (ICCC) Expansion (In Progress, ₹280 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Whitefield (WDGM) Railway Station Elevation & Redevelopment (In Progress, ₹280 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- 20 New Police Station Buildings (BBMP area) (In Progress, ₹240 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP Neighbourhood Parks Development (200 Parks) (In Progress, ₹240 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP Smart Classroom Phase 3 — 500 Govt Schools (In Progress, ₹240 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Doddaballapur Road Grade Separator (NH-648 junction) (In Progress, ₹185 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- ESI Hospital Rajajinagar Expansion (200 additional beds) (In Progress, ₹180 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Sree Kanteerava Stadium Renovation & New Athletics Track (In Progress, ₹180 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Lal Bagh Botanical Garden — Glass House & Terrace Expansion (In Progress, ₹120 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Hesaraghatta Reservoir Restoration & Eco-Park (In Progress, ₹120 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Government Dental College Expansion — Electronic City (In Progress, ₹98.0 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- BBMP Dry Waste Collection Centres Phase 2 (150 DWCCs) (In Progress, ₹95.0 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Cubbon Park Restoration & Heritage Infrastructure (In Progress, ₹85.0 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- KSPCB Air Quality Monitoring Network — 42 Stations (In Progress, ₹85.0 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Tipu Sultan Summer Palace Restoration (ASI) (In Progress, ₹48.0 cr) — no source; Seed-data row with no source; 'In Progress' is not a valid status value and the round budget/dates look generated. Not verified: the web-search quota 
- Namma Metro — Feeder EV Auto Integration (APPROVED) — a feeder e-auto tie-up at metro stations is a service arrangement, not infrastructure.
- Jnanabharathi (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- GKVK (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Yelahanka Airforce (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Bus Terminus Relocation (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Heritage Precinct (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Nandi Hills (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- TenderSURE (PROPOSED) — no source; TenderSURE is a real road-design programme (DULT/BBMP, since about 2011) under which many central roads were already rebuilt, so PROPOSED is misleadin
- Tin Factory Flyover (PROPOSED) — no source; Tin Factory (KR Puram) flyover/grade-separator proposals have been discussed for years, but no approved project with scope/budget was confirmed; not v
- Safe City (PROPOSED) — no source; Likely the Bengaluru Safe City Project (Nirbhaya Fund, city police CCTV network), which is real and largely implemented, so PROPOSED is probably stale
- RR Nagar (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Bidadi AI City (Advancing) — Bidadi is in Ramanagara (Bengaluru South) district, not Bengaluru Urban; 'Advancing' status unverifiable.
- IISc Research Park (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Government School Infrastructure (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- KC Valley (PROPOSED) — no source; KC Valley is a real scheme (treated Bengaluru sewage pumped to Kolar tanks, commissioned about 2018); the row's 'tertiary treatment' phase was not ver
- Yeshwanthpur–Channasandra (PROPOSED) — no source; Yeshwanthpur–Channasandra is a railway line-doubling project by K-RIDE/SWR, not a suburban corridor as described; its current status was not verified 
- Peenya Industrial Area (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Koramangala 100-ft (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- HAL Airport Land (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Aerospace & Defence SEZ (PROPOSED) — no source; KIADB already runs an Aerospace Park/SEZ near Devanahalli (operating for years), so PROPOSED is likely wrong; not verified with a source (search quota
- Whitefield–Hoskote (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- K-100 Clubs (PROPOSED) — no source; Description (a flyover at 'K-100 Clubs junction') looks wrong; the real 'K-100' is the BBMP Citizens' Waterway project on the Koramangala Valley drain
- BWSSB STP (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Multi-Modal Integration (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Boringwell Lane Lake (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Bus Priority Lane (PROPOSED) — no source; A bus priority lane on the Outer Ring Road was introduced around 2019-20, so PROPOSED is likely stale; the row is generic. Not verified (search quota 
- Iblur Underpass (PROPOSED) — no source; Iblur junction underpass/grade-separator proposals exist on ORR–Sarjapur Road, but no source was checked (search quota exhausted).
- Ejipura (PROPOSED) — no source; Probably the real, long-delayed Ejipura–Kendriya Sadan elevated corridor (BBMP, started about 2017); status/budget not verified (search quota exhauste
- 500-acre industrial hub alongside ARAI centre in Mandya (PROPOSED) — the ARAI-centre industrial hub is in Mandya district (kept there), not Bengaluru Urban.
- Bannerghatta Road (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Hegde Nagar to Jakkur (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Agara Lake (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Ulsoor Lake (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Arkavathy Layout (PROPOSED) — no source; Arkavathy Layout is a real BDA layout (notified 2004, north Bengaluru around Thanisandra/Jakkur, not Devanahalli) delayed by litigation; status/plot c
- Life Sciences Park (PROPOSED) — no source; Generic 'manual-research' seed (place name + invented description, no source). No specific project matching this description was identified; could not
- Bengaluru City Gas Distribution Pipeline Project (Under Review) — Bengaluru's city gas network has operated for years; 'Under Review' is wrong and no project record could be verified.
- Mysuru High-Speed Rail Corridor (UNDER_CONSTRUCTION) — duplicate of the Mysuru-district high-speed-rail row (now PROPOSED); UNDER_CONSTRUCTION was wrong.

### Mysuru — 14 verified, 23 deleted as non-project/duplicate, 42 hidden (unverifiable), 0 with figures hidden, 4 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| Mysuru White-Topping Project on 12 Major Roads | budget ₹3,930 cr → **₹394 cr**; original ₹3,930 cr → ₹394 cr; revised ₹3,930 cr → —; agency → Karnataka PWD (with Mysuru City Corporation); description corrected | Budget stored as 3,930 cr (10x error); official cost is Rs 393.85 crore for 46.08 km; work began on Manandavadi Road, status UNDER_CONSTRUCTION is right. | [starofmysore.com](https://starofmysore.com/white-topping-at-rs-393-cr/) (news) |
| NH-275 Mysuru–Bengaluru 6-Laning (Mysuru Section) | renamed “NH-275 Nidaghatta–Mysuru 6-Laning (Bengaluru–Mysuru Expressway, Package 2)”; status **Ongoing → COMPLETED**; opened/completed 2023-03-12; budget ₹1,800 cr → **₹2,920 cr**; original — → ₹2,920 cr; expectedEnd 2025-06-30 → —; startDate 2019-01-01 → 2018-04-20; description corrected; *hidden (unverified seed values):* progressPct | The Bengaluru–Mysuru Expressway, including this Nidaghatta–Mysuru package, was inaugurated on 12 Mar 2023; CCEA-approved cost was Rs 2,919.81 crore incl. land, not 1,800 cr ongoing. | [pib.gov.in](https://pib.gov.in/Pressreleaseshare.aspx?PRID=1521037) (official) |
| Mysuru Suburban Rail (Link to Bengaluru) | renamed “Bengaluru–Mysuru Rail Quadrupling (proposed)”; status **Proposed → PROPOSED**; budget ₹1,200 cr → **₹6,850 cr**; original — → ₹6,850 cr; agency → South Western Railway; description corrected; *hidden (unverified seed values):* progressPct | There is no K-RIDE suburban rail to Mysuru; the real proposal is SWR's Bengaluru–Mysuru quadrupling, whose DPR estimate is about Rs 6,850 crore and is not yet sanctioned. | [starofmysore.com](https://starofmysore.com/railways-to-quadruple-mysuru-bengaluru-track/amp/) (news) |
| Mysuru Metro Rail Phase 1 (12 km) | renamed “Mysuru Metro / Metro Neo (proposal only, not approved)”; status **Ongoing → PROPOSED**; budget ₹1,180 cr → **—**; expectedEnd 2026-03-31 → —; startDate 2022-06-01 → —; agency → Mysuru Development Authority (feasibility idea only); description corrected; *hidden (unverified seed values):* progressPct | No Mysuru metro has been approved or started; 'Phase 1 (12 km), Ongoing, 1,180 cr' is invented, so keep one row as a no-budget PROPOSED idea. | [starofmysore.com](https://starofmysore.com/metro-neo-in-mysuru/) (news) |
| Mysuru Peripheral Ring Road (PRR) | status **UNDER_CONSTRUCTION → PROPOSED**; budget ₹860 cr → **₹1,971 cr**; original ₹3,500 cr → ₹1,971 cr; revised ₹3,500 cr → —; expectedEnd 2027-12-31 → —; startDate 2023-09-01 → —; agency → Mysuru Development Authority (MDA, formerly MUDA); description corrected; *hidden (unverified seed values):* progressPct | PRR is not under construction: it is at the DPR-consultant tender stage (Oct 2025) with an estimated Rs 1,971 crore cost (1,236 cr land + 735 cr works); length is ~105 km, not 47 km, and agency is MDA, not NHAI. | [starofmysore.com](https://starofmysore.com/peripheral-ring-road-encircling-mysuru-city-105-km-project-to-begin-by-late-2026/) (news) |
| Mysuru Airport Terminal & Runway Expansion | renamed “Mysuru (Mandakalli) Airport Runway Expansion”; status **Ongoing → APPROVED**; budget ₹420 cr → **—**; expectedEnd 2027-06-30 → —; startDate 2023-10-01 → —; agency → Airports Authority of India (land by KIADB/State; NH-766 div; description corrected; *hidden (unverified seed values):* progressPct | Construction has not started: land (206 of 240 acres) is acquired and the NH-766 diversion DPR (Rs 612 cr, AAI to contribute Rs 510 cr) awaits final clearances; no new terminal is part of it and the 420 cr figure has no source. | [newskarnataka.com](https://newskarnataka.com/mysuru/push-to-fast-track-mysuru-airport-expansion-gains-momentum/27042026) (news) |
| Mysuru–Chamarajanagar Rail Line Doubling | status **Ongoing → PROPOSED**; budget ₹240 cr → **—**; expectedEnd 2026-06-30 → —; startDate 2022-07-01 → —; *hidden (unverified seed values):* progressPct | Mysuru–Chamarajanagar (about 60 km) doubling is not sanctioned or under construction: the final location survey is done and the DPR was due to the Railway Board in Aug 2025; it is absent from the Railway Minister's July 2025 list of sanctio | [www.pib.gov.in](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2148657) (official) |
| Chamundi Hills Infrastructure Upgrade | renamed “PRASHAD Scheme Works — Chamundi Hill”; status **UNDER_CONSTRUCTION → STALLED**; budget ₹32.0 cr → **₹47.0 cr**; original — → ₹47.0 cr; expectedEnd 2025-09-30 → —; agency → Karnataka Tourism Infrastructure Ltd (Tourism Dept); description corrected; *hidden (unverified seed values):* startDate, progressPct | The real project is the ~Rs 46–47 crore PRASHAD scheme (Centre 30 cr + State 16 cr) that began in Jan 2026 and was halted by a High Court interim stay on 7 Apr 2026; the 32 cr, 2022 start and MUDA agency are wrong. | [starofmysore.com](https://starofmysore.com/half-finished-works-dot-chamundi-hill/) (news) |
| Four lane underpass at Kukkarahalli Junction (LC1) | status **Announced → TENDER_ISSUED**; budget — → **₹38.3 cr**; original — → ₹38.3 cr; agency → PWD National Highways sub-division, Mysuru (CRIF Setu Bandha; description corrected | Official estimate is Rs 38.29 crore under CRIF Setu Bandhan; work order was issued to PJB Engineers on 20 Mar 2025 but work awaits Forest Department approval for tree felling. | [newskarnataka.com](https://newskarnataka.com/mysuru/mysuru-plans-four-lane-underpass-at-kukkarahalli-junction/09042026/) (news) |
| Mysuru Flyover Projects | renamed “Mysuru Flyovers (Metropole Circle–Hinkal; Railway Station–Nanjangud Road)”; description corrected | The only flyover proposals are these two routes, and the CM said in Nov 2025 no final decision had been taken; the KRS/Hunsur/Nanjangud-junction description is not sourced. | [starofmysore.com](https://starofmysore.com/two-new-flyovers-in-city-no-final-decision-yet-cabinet-to-review-cm/) (news) |
| Mysuru High-Speed Rail Corridor | renamed “Bengaluru–Mysuru High-Speed Rail (proposed extension of Chennai–Bengaluru HSR)”; status **UNDER_CONSTRUCTION → PROPOSED**; agency → National High Speed Rail Corporation Ltd (NHSRCL); description corrected | Nothing is under construction: Budget 2026 named Chennai–Bengaluru (not Mysuru) among seven HSR corridors; the Mysuru extension is only a suggestion, the agency is NHSRCL (not NHAI), and the 'construction start' update is about the Hyderaba | [swarajyamag.com](https://swarajyamag.com/news-brief/budget-2026-fm-sitharaman-announces-seven-high-speed-rail-corridors-heres-what-we-know-about-their-survey-status) (news) |
| Kidwai Cancer Centre Mysuru Unit | status **Nears Completion → UNDER_CONSTRUCTION**; budget — → **₹50.0 cr**; original — → ₹50.0 cr; startDate — → 2023-12-22; agency → Kidwai Memorial Institute of Oncology; description corrected | CM laid the foundation stone in Dec 2023 for the Rs 50 crore first phase (total estimate Rs 250 crore); building was due to be ready in 2025 but I found no opening yet, so UNDER_CONSTRUCTION. | [starofmysore.com](https://starofmysore.com/siddu-lays-foundation-stone-for-kidwai-cancer-institute-on-krs-road/) (news) |
| Film City Mysuru | status **Announced → UNDER_CONSTRUCTION**; agency → Dept of Information & Public Relations, Karnataka (PPP model; description corrected | Past the announcement stage: land at Immavu was handed over and phase-1 compound-wall works were about 70% complete in Feb 2026; the Karnataka Film Chamber is not the agency. | [starofmysore.com](https://starofmysore.com/works-on-film-city-gain-momentum/) (news) |
| Bengaluru-Mysuru Infrastructure Corridor | status **Scrapped by HC Order → STALLED**; agency → Nandi Infrastructure Corridor Enterprises (NICE) / Govt of K; description corrected | 'Scrapped by HC order' is wrong: the High Court suggested scrapping BMIC, but on 19 Feb 2026 the Supreme Court stayed those suggestions; the Mysuru-side expressway was never built and the project remains stuck in litigation. | [www.deccanherald.com](https://www.deccanherald.com/india/karnataka/bengaluru-mysore-infrastructure-corridor-supreme-court-stays-karnataka-hcs-suggestions-for-scrapping-the-project-3904730) (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- Mysuru Metro Phase 2 — City to Airport (APPROVED, ₹37,170 cr) — duplicate of “Mysuru Metro Rail Phase 1 (12 km)”. Invented: no Mysuru metro phase 2 or airport line exists; the 3,717 cr JICA loan in its updates is for Bengaluru Metro Phase 2, and budget 37,170 cr is a 10x copy of that.
- AIIMS Mysuru — All India Institute Medical Sciences (Proposed, ₹1,600 cr) — other. No AIIMS has been proposed or sanctioned for Mysuru; Karnataka's official AIIMS request is for Raichur and the Centre told Lok Sabha no AIIMS is approved for Karnataka, so the 1,600 cr row is invented
- Mysuru–Bengaluru Elevated Expressway (Mysuru end) (Completed, ₹620 cr) — duplicate of “NH-275 Mysuru–Bengaluru 6-Laning (Mysuru Section)”. Same project as the NH-275 Mysuru-section row (the expressway is not elevated); its only news update is about the Mumbai–Pune Expressway.
- Mysuru Metro Phase 1 — Mysuru Station to Yadavagiri (Ongoing, ₹320 cr) — duplicate of “Mysuru Metro Rail Phase 1 (12 km)”. Invented: there is no Mysuru Station–Yadavagiri metro corridor under construction; Mysuru has no approved metro.
- Brindavan Gardens Renovation & Fountain Upgrade (Ongoing, ₹48.0 cr) — duplicate of “KRS Dam Tourism & Brindavan Gardens Infrastructure”. Brindavan Gardens is at KRS in Mandya district; this Mysuru row (Rs 48 crore renovation, no source) duplicates the Mandya Brindavan Gardens project row.
- Mysuru Road Elevated Corridor (Announced, ₹0.0 cr) — duplicate of “Mysuru Flyover Projects”. Vague generic 'elevated corridor' row with a broken budget (810 rupees) and no identifiable Mysuru project; 'Mysuru Road' is also a Bengaluru road name, so it may be misfiled. Flyover proposals are co
- Library at Govindrao Memorial PU College (COMPLETED) — non project. A library room opened in one PU college under a 'library in every home' drive is too small to be an infrastructure project.
- Mysuru Airport Height Clearance Advisory (Active) — non project. A building-height clearance advisory around the airport is a regulation, not a project.
- 500-acre industrial hub alongside ARAI centre in Mandya (PROPOSED) — duplicate of “Mandya Industrial Hub with ARAI Centre”. Same 500-acre ARAI industrial hub as the Mandya row, filed under Mysuru with STATE scope.
- Bengaluru-Mysuru Rail Route Inspection and Mandya Station Upgrade (PROPOSED) — duplicate of “Mandya railway station to be upgraded; additional railway station planned for Maddur”. Same April 2026 inspection news as the Mandya station-upgrade row, filed under Mysuru with no description; an inspection is not a project.
- Public Toilets Hygiene Improvement (Issue Identified) — non project. 'Issue identified' about toilet hygiene is a complaint, not a project.
- Karnataka 1,000 MW Data Park Capacity Plan (PROPOSED) — non project. A statewide 1,000 MW data-park capacity target across Bengaluru, Mysuru and Mangaluru is a policy plan, not a specific project; also duplicated by the 'Sustainable Data Centre Parks' row.
- Karnataka 1000 MW Sustainable Data Centre Parks (PROPOSED) — duplicate. Duplicate of the same 1 May 2026 state data-centre-park policy announcement (both rows are state policy, not a project).
- Mysuru Flex Waste Cleanup Drive (Ongoing) — non project. A flex-banner cleanup drive is a municipal activity, not an infrastructure project.
- Mysuru Roadworks (PROPOSED) — non project. Not a project: it records the forest minister seeking a review of ~350 trees to be felled for unnamed roadworks.
- Flybrary at Mysuru airport (PROPOSED) — non project. A small reading corner ('Flybrary') inside the airport terminal is not an infrastructure project.
- Chamundi Hill temple construction (STALLED) — duplicate of “Chamundi Hills Infrastructure Upgrade”. Same PRASHAD works on Chamundi Hill that the High Court stayed; kept in the 'Chamundi Hills Infrastructure Upgrade' row.
- New Mysuru Plan (Announced) — non project. A city master plan (land-use plan) is a planning document, not an infrastructure project.
- Mysuru as Second IT Hub (Announced) — non project. 'Mysuru as second IT hub' is a policy aspiration with no specific project, cost or agency.
- Hi-tech ambulance for KR Hospital in Mysuru (PROPOSED) — non project. Donating one ambulance to KR Hospital is an equipment purchase, not infrastructure.
- Greater Mysuru City Corporation (Proposed) — non project. Forming a Greater Mysuru City Corporation is a governance/boundary change, not an infrastructure project.
- Rail Underbridge near Kukkarahalli Lake (Announced) — duplicate of “Four lane underpass at Kukkarahalli Junction (LC1)”. Same project as the Kukkarahalli Junction (LC-1) four-lane underpass row.
- Mysuru Road Flyover Extension (Announced) — duplicate of “Mysuru Flyover Projects”. Vague generic row ('flyover extension at key junctions') with no identifiable project; Mysuru's flyover proposals are covered by the Mysuru Flyovers row.

**Hidden: unverifiable — deleted:**

- Nanjangud Pharma SEZ (Special Economic Zone) (Proposed, ₹480 cr) — no source; No source found for a Nanjangud pharma SEZ with a Rs 480 crore cost; March 2026 seed row.
- Mysuru Outer Ring Road (ORR) Phase 2 (UNDER_CONSTRUCTION, ₹420 cr) — no source; No source found for an ORR 'Phase 2' (Nanjangud Road–Hunsur Road); the 42.5 km six-lane Outer Ring Road was completed (missing link by ~2014) and hand
- Cauvery Stage 5 Water Supply — Mysuru City (Ongoing, ₹380 cr) — no source; No source found for a 450 MLD 'Cauvery Stage 5' for Mysuru; 'Cauvery Water Supply Scheme Stage V' is Bengaluru's BWSSB project, so this row looks conf
- Multi-Modal Transit Hub — Mysuru Railway Station (Proposed, ₹280 cr) — no source; No source found for a separate Rs 280 crore multi-modal hub; the June 2026 Mysuru station redevelopment proposal (Rs 422 crore, third entry, multimoda
- BEML Modernisation — Defence Vehicle Plant (Ongoing, ₹280 cr) — no source; No source found for a Rs 280 crore BEML Mysuru plant modernisation; seed row with past end date (Dec 2025).
- Mysuru Convention Centre (5,000 pax) (Proposed, ₹240 cr) — no source; No source found for a 5,000-seat Mysuru convention centre at Rs 240 crore; seed row.
- Nanjangud Industrial Township Phase 2 (Ongoing, ₹240 cr) — no source; No source found for 'Nanjangud Industrial Township Phase 2' at Rs 240 crore; seed row.
- K.R. Hospital (MMCRI) Super Specialty Block (Ongoing, ₹240 cr) — no source; No source found for a Rs 240 crore super-specialty block at K.R. Hospital/MMCRI; seed row with past end date (Mar 2026).
- New Government Medical College, Nanjangud (Ongoing, ₹180 cr) — no source; No source found for a new government medical college at Nanjangud; seed row.
- Mysuru New Railway Station Redevelopment (Ongoing, ₹180 cr) — no source; Real project but details differ: the Mysuru station yard remodelling (6 to 9 platforms, pit/stabling lines) was tendered as an EPC at Rs 346.64 crore 
- Mysuru–Nanjangud 4-Lane Highway (Ongoing, ₹180 cr) — no source; No source found for a current Mysuru–Nanjangud four-laning project; the existing Mysuru–Nanjangud road (part of NH-766) may already be four-lane, so t
- Mysuru Heritage Zone Rejuvenation — UNESCO (Ongoing, ₹160 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- MIMS Mysuru — 500-Bed Hospital Expansion (Ongoing, ₹120 cr) — no source; No source found; 'MIMS' is the Mandya Institute of Medical Sciences (Mandya district), not a Mysuru hospital, and agency 'JSS Academy / Private' confl
- Mysore Sugar Factory Expansion & Co-gen Plant (Ongoing, ₹120 cr) — no source; Mysore Sugar Company (MySugar) factory is in Mandya city, so this belongs to Mandya, not Mysuru; no source found for a Rs 120 crore expansion/co-gen p
- IIIT Mysuru Permanent Campus Construction (Ongoing, ₹120 cr) — no source; No source found: no IIIT Mysuru exists as far as I could find (Karnataka's IIITs under the IIIT Acts are at Dharwad and Raichur); likely invented.
- Mysuru STP — 80 MLD Sewage Treatment Plant (Ongoing, ₹120 cr) — no source; No source found for an 80 MLD Mysuru STP at Rs 120 crore; seed row with past end date (Sep 2025).
- Mysuru Zoo Master Plan — Phase 2 Expansion (Ongoing, ₹86.0 cr) — no source; No source found for a 'Zoo Master Plan Phase 2' at Rs 86 crore; Star of Mysore zoo coverage shows no such project.
- Mysuru Lakes Development (14 lakes) (Ongoing, ₹84.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Hunsur–Periyapatna State Highway Upgrade (Ongoing, ₹82.0 cr) — no source; No source found for a Hunsur–Periyapatna state highway upgrade at Rs 82 crore; seed row with past end date.
- University of Mysore New Science Block (Ongoing, ₹68.0 cr) — no source; No source found for a Rs 68 crore University of Mysore science block; seed row.
- KSDL Sandal Soap Plant Modernisation (Ongoing, ₹68.0 cr) — no source; No source found for a Rs 68 crore KSDL Mysuru soap-plant modernisation; seed row.
- Smart Traffic Management System — Mysuru (Ongoing, ₹68.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Kabini Reservoir Left Bank Canal Modernisation (Ongoing, ₹68.0 cr) — no source; No source found for Kabini left bank canal modernisation at Rs 68 crore; seed row with past end date.
- Kabini River Safari Bridge & Eco-Lodge Zone (Proposed, ₹48.0 cr) — no source; No source found for a Kabini safari bridge and eco-lodge zone; likely invented seed row.
- Nanjangud Industrial Area STP (Ongoing, ₹48.0 cr) — no source; No source found for a Rs 48 crore Nanjangud industrial STP; seed row.
- KSIC Silk Reeling Automation Project (Ongoing, ₹48.0 cr) — no source; No source found for a Rs 48 crore KSIC silk reeling automation project; seed row.
- Mysuru Solid Waste Management Upgrade (Ongoing, ₹48.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Nanjangud Town Water Supply Augmentation (Ongoing, ₹42.0 cr) — no source; No source found for a Rs 42 crore Nanjangud town water augmentation; seed row with past end date.
- Integrated Command & Control Centre (ICCC) Mysuru (Ongoing, ₹42.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Kukkarahalli Lake Rejuvenation — Smart City (Ongoing, ₹38.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Mysuru City Wi-Fi Zone (Smart City — 1,000 hotspots) (Ongoing, ₹28.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- Nagarahole Eco-Tourism Zones Development (Ongoing, ₹28.0 cr) — no source; No source found for Rs 28 crore Nagarahole eco-tourism zones; seed row.
- Hunsur Town Water Supply — JJM (Ongoing, ₹28.0 cr) — no source; No source found; Hunsur is a town while Jal Jeevan Mission covers rural households, so the description is inconsistent; seed row.
- Nanjangud Mysuru Silk Park Phase 1 (Completed, ₹28.0 cr) — no source; No source found for a completed 'Nanjangud Mysuru Silk Park Phase 1'; seed row.
- H.D. Kote Wildlife Corridor Road Safety Barriers (Ongoing, ₹24.0 cr) — no source; No source found for Rs 24 crore wildlife-corridor safety barriers near H.D. Kote; seed row.
- Development of Roads in Kodagu District (PROPOSED) — roads in Kodagu district, not Mysuru; a generic grant, not a named project.
- Community Health Centre Hunsur Upgrade (Ongoing, ₹18.0 cr) — no source; No source found for a Rs 18 crore Hunsur CHC upgrade; seed row.
- Mysuru Heritage Signage & Interpretation Centres (Ongoing, ₹12.0 cr) — no source; No source found: row cites the Smart Cities Mission / Smart City SPV, but Mysuru is not one of the 100 Smart Cities, so the funding, agency and round 
- T Narsipur Stadium (STALLED) — could not be verified and its summary is garbled.
- Mysuru AI Clean City System (Stalled) — cites a Mysuru Smart City SPV, but Mysuru is not in the Smart Cities Mission; could not be verified.
- Dr. Ambedkar Bhavan (Pending) — no Mysuru city Ambedkar Bhavan project could be confirmed.
- New Fire Stations - Mysuru, Kodagu, Chikkamagaluru (Announced) — a generic multi-district fire-station announcement with no sites or cost.

**Kept unchanged (news-sourced, not re-checked):** Hyder Ali Road Widening (Ongoing); Permanent Cocoon Market (Announced); Additional Truck Terminal Mysuru (Proposed); Regional Drug Testing Laboratory (Announced)

### Mandya — 4 verified, 6 deleted as non-project/duplicate, 12 hidden (unverifiable), 3 with figures hidden, 0 kept unchanged

| Project | What changes | Why | Source |
|---|---|---|---|
| NH-275 Four-Lane Widening (Maddur–Channapatna) | renamed “Bengaluru–Mysuru Expressway (NH-275) — Mandya district stretch”; status **In Progress → COMPLETED**; opened/completed 2023-03-12; budget ₹485 cr → **—**; expectedEnd 2025-12-31 → —; description corrected; *hidden (unverified seed values):* startDate, progressPct | There is no separate 'four-lane Maddur–Channapatna' project; this stretch is part of the six-lane Bengaluru–Mysuru Expressway inaugurated in Mandya on 12 Mar 2023; 485 cr is not a sourced figure. | [www.business-standard.com](https://www.business-standard.com/article/current-affairs/pm-modi-inaugurates-118-km-long-bengaluru-mysuru-expressway-project-123031200403_1.html) (news) |
| Mandya road facelift | budget ₹114 cr → **₹11.4 cr**; original ₹114 cr → ₹11.4 cr; revised ₹114 cr → ₹11.4 cr | Stored budget is 114 crore but the row's own source says Rs 11.4 crore (10x error); could not independently verify the approval. | — (news) |
| KRS Dam Tourism & Brindavan Gardens Infrastructure | renamed “Brindavan Gardens (KRS) Tourism Redevelopment — PPP”; status **UNDER_CONSTRUCTION → TENDER_ISSUED**; budget ₹45.0 cr → **₹2,616 cr**; original ₹500 cr → ₹2,616 cr; revised ₹500 cr → —; expectedEnd 2025-09-30 → —; startDate 2023-10-01 → —; agency → Cauvery Neeravari Nigam Ltd (CNNL), PPP; description corrected; *hidden (unverified seed values):* progressPct | The real KRS/Brindavan tourism project is a Rs 2,615.96 crore PPP master plan given administrative approval in July 2024 and put out to tender (third call in May 2025); nothing shows construction has started, and the dam-strengthening descr | [starofmysore.com](https://starofmysore.com/brindavan-gardens-to-bloom-into-global-tourist-attraction/) (news) |
| Mandya Industrial Hub with ARAI Centre | budget ₹0.0 cr → **—**; original ₹750 cr → —; revised ₹750 cr → —; description corrected | Budget is stored as 750 rupees (broken) and the 750 cr original budget, job numbers and 'announced by Siddaramaiah' have no source; the row's own news only reports talks on a 500-acre hub. | — (news) |

**Deleted (checked — not a project, duplicate, or invented):**

- Mandya–Mysore State Highway (SH-17) Upgradation (In Progress, ₹156 cr) — duplicate of “NH-275 Four-Lane Widening (Maddur–Channapatna)”. SH-17 (Bengaluru–Mysuru road) was taken over by NHAI in 2014 as NH-275 and upgraded to six lanes by March 2023; there is no separate PWD 'SH-17 Mandya–Mysore upgradation'.
- Maddur Bypass Road (NH-275 Alternate Alignment) (In Progress, ₹92.0 cr) — duplicate of “NH-275 Four-Lane Widening (Maddur–Channapatna)”. The Maddur bypass (about 7 km incl. 3.5 km elevated) was built as part of the Bengaluru–Mysuru Expressway and opened with it in March 2023; it is not a separate ongoing 92 cr project.
- Smart Classroom Programme — 200 Government Schools (In Progress, ₹18.0 cr) — non project. Smart boards and projectors in schools are an equipment programme, not infrastructure, and no source was found for this Rs 18 crore row.
- Mandya-Mysuru Highway Widening (COMPLETED) — duplicate of “NH-275 Four-Lane Widening (Maddur–Channapatna)”. Duplicate of the Bengaluru–Mysuru Expressway row for Mandya (same NH-275 six-laning, completed March 2023); seed-data row with no budget or source.
- Bengaluru–Mysuru Rail Route (PROPOSED) — duplicate of “Mandya railway station to be upgraded; additional railway station planned for Maddur”. Not a project: it records a ministers' inspection of the line; Bengaluru–Mysuru doubling (Ramanagaram–Mysore patch, Rs 998 cr) is already completed, and the Mandya station upgrade is covered by its ow
- Mysuru High-Speed Rail Corridor (UNDER_CONSTRUCTION) — duplicate of “Mysuru High-Speed Rail Corridor”. Exact duplicate (same name, source and updates, STATE scope) of the Mysuru-district HSR row, so it shows twice on the Karnataka page.

**Hidden: unverifiable — deleted:**

- KRS Right Bank Canal Renovation (In Progress, ₹128 cr) — no source; No source found for a Rs 128 crore KRS Right Bank Canal lining project; seed row with past end date (Jun 2025).
- Government Medical College & Hospital, Mandya — New Block (In Progress, ₹95.0 cr) — no source; No source found for a Rs 95 crore new super-specialty block at MIMS Mandya; seed row with past end date (Jun 2026).
- Cauvery Water Supply Scheme — Mandya Urban Areas (In Progress, ₹88.0 cr) — no source; No source found for a Rs 88 crore Cauvery water scheme for Mandya urban areas; seed row with past end date.
- Mandya Smart City AMRUT Sewage Treatment Plant (In Progress, ₹72.0 cr) — no source; No source found; name says 'Smart City' but Mandya is not one of the 100 Smart Cities. A 10 MLD AMRUT STP is plausible but unconfirmed.
- Jal Jeevan Mission — Rural Piped Water (K R Pete Taluk) (In Progress, ₹62.0 cr) — no source; No source found for a Rs 62 crore JJM package for K R Pete taluk; seed row with past end date (Mar 2025).
- Srirangapatna Heritage Town Beautification (In Progress, ₹55.0 cr) — no source; No source found for a Rs 55 crore Srirangapatna heritage beautification project; seed row.
- Malavalli–Kollegal New Road Link (In Progress, ₹44.0 cr) — no source; No source found; a Malavalli–Kollegal road already exists, so a 'new road link' at Rs 44 crore is doubtful; seed row.
- Mandya Industrial Area KIADB Phase-II Expansion (In Progress, ₹42.0 cr) — no source; No source found for a KIADB Mandya Phase-II expansion at Rs 42 crore; seed row.
- Pandavapura Railway Overbridge (ROB) at Level Crossing (UNDER_CONSTRUCTION, ₹38.0 cr) — no source; No source found for a Pandavapura ROB at Rs 38 crore; seed row with past end date (Jun 2025).
- Nagamangala Taluk Hospital Expansion (100-bed) (In Progress, ₹22.0 cr) — no source; No source found for a 100-bed Nagamangala taluk hospital expansion at Rs 22 crore; seed row with past end date.
- Mandya District Sports Complex Upgrade (In Progress, ₹15.0 cr) — no source; No source found for this Rs 15 crore upgrade. A different real project exists: the Union sports minister laid the foundation for a Rs 14 crore multi-p
- New Fire Stations Expansion (Announced) — a generic fire-station announcement with no sites; Rs 5 cr unconfirmed.

**Figures hidden (row kept, news-sourced):**

- Mandya Irrigation Coverage Expansion — cleared : the Rs 200 cr figure could not be confirmed. The project itself is news-sourced and kept.
- Mandya railway station to be upgraded; additional railway station planned for Maddur — cleared : no source for the Rs 150 cr figure (Mandya is on the Amrit Bharat Station list). The project itself is news-sourced and kept.
- Rice Museum — cleared : the Rs 3 cr cost could not be confirmed. The project itself is news-sourced and kept.

---

## 2. Population (PopulationHistory) — verified or hidden

**No census was held in 2021.** It was postponed because of COVID-19 and
became Census 2027: house-listing ran April–September 2026 and the
population count's reference date is 00:00 on **1 March 2027** (1 Oct 2026
for Ladakh and snow-bound areas) —
[PIB, "Census 2027: India's First Digital Enumeration Exercise", 25 Apr 2026](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3).
The Registrar General's official projections (Technical Group, 2020) are
state-level only, so there is no official district figure after 2011. The
overview's "Population" tile picks the newest row whose source starts with
"Census of India", so the Mandya and Bengaluru 2021 rows were being shown
to citizens as census counts.

Census 2011 and 2001 figures below are the Primary Census Abstract values
as reproduced by census2011.co.in (the official District Census Handbook
PDFs on censusindia.gov.in would not open for the checker — TLS error);
the 2011 totals match the site's own `DemographicProfile` Census rows.
"Greater Mumbai" = Mumbai City + Mumbai Suburban districts.

| Row | Change | Why / source |
|---|---|---|
| Bengaluru Urban · 1991 (Census of India) — 4,130,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Bengaluru Urban · 2001 (Census of India) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 83 → 82.96, density 8821 → 2985. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/242-bangalore.html) |
| Bengaluru Urban · 2011 (Census of India) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 88.48 → 87.67, urbanPct 97.4 → 90.94, density 12988 → 4381. [www.census2011.co.in](https://www.census2011.co.in/census/district/242-bangalore.html) |
| Bengaluru Urban · 2021 row 'Census of India (Projected)' (12,765,000) | **Deleted** | Hidden: unverifiable. Labelled as a census but no 2021 census was held; no official district projection backs the number. It was shown as the census population on the overview. [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Chennai · 1951 (Census of India 1951) — 1,416,056 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1951 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Chennai · 1961 (Census of India 1961) — 1,729,141 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1961 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Chennai · 1971 (Census of India 1971) — 2,469,449 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1971 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Chennai · 1981 (Census of India 1981) — 3,276,622 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1981 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Chennai · 1991 (Census of India 1991) — 3,841,396 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Chennai · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 948 → 957, density 10197 → 24963. [www.census2011.co.in](https://www.census2011.co.in/census/district/21-chennai.html) |
| Chennai · 2011 (Census of India 2011) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 951 → 989, literacy 90.33 → 90.18, density 10908 → 26553. [www.census2011.co.in](https://www.census2011.co.in/census/district/21-chennai.html) |
| Chennai · 2026 'Estimate — Chennai Metropolitan Area' (11,500,000) | **Deleted** | Hidden: unverifiable. A metropolitan-area guess plotted on the Chennai district chart (district was 4,646,732 in 2011); no source. [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Hyderabad · 1991 (Census of India 1991) — 3,145,939 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Hyderabad · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 3637834 → 3829753, sexRatio 943 → 933, density 16763 → 17649. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/122-hyderabad.html) |
| Hyderabad · 2024 'Projected estimate based on Census 2011 growth rate' (4,500,000) | **Deleted** | Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB). [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Kolkata · 1991 (Census of India 1991) — 4,399,819 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Kolkata · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 828 → 829, literacy 81.31 → 80.86, density 24760 → 24718. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/16-kolkata.html) |
| Kolkata · 2011 (Census of India 2011) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: population 4486679 → 4496694, sexRatio 899 → 908, literacy 87.14 → 86.31, density 24252 → 24306. [www.census2011.co.in](https://www.census2011.co.in/census/district/16-kolkata.html) |
| Lucknow · 1991 (Census of India 1991) — 1,669,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Lucknow · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 2185927 → 3647834, sexRatio 893 → 888, literacy 74.1 → 68.71, density None → 1443. [www.census2011.co.in](https://www.census2011.co.in/census/district/528-lucknow.html) |
| Lucknow · 2011 (Census of India 2011) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 79.33 → 77.29, urbanPct None → 66.21, density None → 1816. [www.census2011.co.in](https://www.census2011.co.in/census/district/528-lucknow.html) |
| Lucknow · 2024 'Estimate — Lucknow District Administration (lucknow.nic.in)' (5,200,000) | **Deleted** | Hidden: unverifiable. lucknow.nic.in's demography page gives no 2024 estimate or 5.2 million figure; no official district projection exists. [lucknow.nic.in](https://lucknow.nic.in/demography/) |
| Mandya · 1991 (Census of India) — 1,282,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mandya · 2001 (Census of India) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 1513000 → 1763705, sexRatio 980 → 986, literacy 65.9 → 61.05, density 304.9 → 356. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/262-mandya.html) |
| Mandya · 2011 (Census of India) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: population 1940428 → 1805769, sexRatio 982 → 995, literacy 72.8 → 70.4, urbanPct 27.3 → 17.08, density 391.2 → 364. [www.census2011.co.in](https://www.census2011.co.in/census/district/262-mandya.html) |
| Mandya · 2021 row labelled 'Census of India' (2,180,000) | **Deleted** | Hidden: unverifiable. No census was held in 2021 (postponed; now Census 2027, reference date 1 Mar 2027). The number is not an official projection. [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Mumbai · 1951 (Census of India 1951) — 2,994,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1951 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mumbai · 1961 (Census of India 1961) — 4,152,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1961 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mumbai · 1971 (Census of India 1971) — 5,971,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1971 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mumbai · 1981 (Census of India 1981) — 8,243,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1981 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mumbai · 1991 (Census of India 1991) — 9,926,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mumbai · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 822 → 809, density 19864 → 19865. Hidden: unverifiable — literacy (not given for 2001 by the source or not computable for Greater Mumbai without the child population). [www.census2011.co.in](https://www.census2011.co.in/census/district/357-mumbai-city.html) |
| Mumbai · 2011 (Census of India 2011) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 832 → 853. Hidden: unverifiable — literacy (not given for 2011 by the source or not computable for Greater Mumbai without the child population). [www.census2011.co.in](https://www.census2011.co.in/census/district/357-mumbai-city.html) |
| Mumbai · 2026 'Estimate — Mumbai Metropolitan Region' (21,000,000) | **Deleted** | Hidden: unverifiable. A metropolitan-region guess (with made-up sex ratio and literacy) stored under the Mumbai district; no source. The API already hides it. [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Mysuru · 1991 (Census of India) — 2,388,000 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Mysuru · 2001 (Census of India) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 2624900 → 2641027, sexRatio 975 → 964, literacy 66 → 63.48, density 383 → 385. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/263-mysore.html) |
| Mysuru · 2011 (Census of India) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 984 → 985, literacy 72.6 → 72.79, urbanPct 43.8 → 41.5, density 438 → 476. [www.census2011.co.in](https://www.census2011.co.in/census/district/263-mysore.html) |
| Mysuru · 2024 'Projected estimate' (3,248,000) | **Deleted** | Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB). [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| New Delhi · 2001 (Census of India) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 171806 → 179112, sexRatio 866 → 792, literacy 85.2 → 83.24, density 4909 → 5117. Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/172-new-delhi.html) |
| New Delhi · 2011 (Census of India) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 902 → 822, literacy 89.38 → 88.34. [www.census2011.co.in](https://www.census2011.co.in/census/district/172-new-delhi.html) |
| New Delhi · 2024 'Projected estimate' (150,000) | **Deleted** | Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB). [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |
| Pune · 1991 (Census of India 1991) — 5,532,532 | **Deleted** | Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed. none — see docs/DATA-FIXES-2026-09.md §2 |
| Pune · 2001 (Census of India 2001) | corrected | Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: . Hidden: unverifiable — urbanPct (not given for 2001 by the source). [www.census2011.co.in](https://www.census2011.co.in/census/district/359-pune.html) |
| Pune · 2011 (Census of India 2011) | corrected | Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: urbanPct 60.9 → 60.99. [www.census2011.co.in](https://www.census2011.co.in/census/district/359-pune.html) |
| Pune · 2021 'Maharashtra State Evaluation Committee estimate' (10,800,000) | **Deleted** | Hidden: unverifiable. No such official estimate could be found; 2021 has no census. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB). [www.pib.gov.in](https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3) |

**Left alone:** `DemographicProfile` (the v2 population module) has Mandya
sex ratio 985, literacy 70.14%, urban 16.08% — these disagree with the
Census values above (995, 70.40%, 17.08%). That table was not part of
this pass; worth re-reading from the PCA file.

---

## 3. India dashboard (IndiaIndicator + code constants) — verified or hidden

All 172 `IndiaIndicator` rows were typed in by hand in spring 2026 and every
one carried `asOfDate = 1 May 2026` — the seed day, shown to readers as
"as of 1 May". Each row is now either **verified** (latest official figure +
the source's own reporting date) or **hidden** (`numericValue = null`; the
band loaders skip null values, so the page shows "—").

**Foodgrain:** 12.7 Mt → **376.563 Mt** — DA&FW 3rd Advance Estimates
2025-26 (a record), released 27 May 2026
([PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2265965)). Rice
154.024 Mt, wheat 120.657 Mt, change +18.831 Mt on the 2024-25 final
estimate; the ministry no longer issues a "4th advance estimate", so the
label now says "3rd advance estimate" (en/hi/kn). **GDP:** IMF WEO April
2026 puts India's FY 2025-26 nominal GDP at **$3.92 trillion** and ranks it
**6th** (rupee fall + the Feb 2026 GDP base-year revision), not 4.1 tn/5th.

### Verified and updated (88 rows)

| Metric | Was | Now | As of | Why | Source |
|---|---|---|---|---|---|
| agriculture-production · foodgrain_output_million_tonnes | 12.7 million_tonnes | **376.563** | 2026-05-27 | 12.7 Mt is impossible; the latest official estimate (3rd AE 2025-26, released 27 May 2026) is 376.563 Mt, a record. | DA&FW · 3rd Advance Estimates 2025-26 |
| agriculture-production · rice_production_million_tonnes | 130 million_tonnes | **154.024** | 2026-05-27 | Rice output in the 3rd AE 2025-26 is a record 154.024 Mt (vs 150.184 Mt final 2024-25); 130 was stale/rounded. | DA&FW · 3rd Advance Estimates 2025-26 |
| agriculture-production · wheat_production_million_tonnes | 110 million_tonnes | **120.657** | 2026-05-27 | Wheat output in the 3rd AE 2025-26 is 120.657 Mt (vs 117.945 Mt in 2024-25). | DA&FW · 3rd Advance Estimates 2025-26 |
| agriculture-production · foodgrain_change_yoy_mt | 5 million_tonnes | **18.831** | 2026-05-27 | The same release compares 376.563 Mt with last year's 357.732 Mt, an increase of 18.831 Mt. | DA&FW · 3rd AE 2025-26 vs Final Estimates 2024-25 |
| agriculture-production · estimate_year | 2,024 year | **2,025** | 2026-05-27 | The latest estimate is for crop year 2025-26 (label's first year 2025), not 2024. | DA&FW · 3rd Advance Estimates 2025-26 |
| agriculture-production · top_producer_state_pct | 18 percent | **17.85** | 2025-11-20 | Uttar Pradesh produced 17.85% of India's foodgrains in 2024-25 (final), per the official state table. | DA&FW ES&E Division via Economic Survey 2025-26 Stat. Appendix Table 1.18 (Final Estimates 2024-25) |
| agriculture-production · top_state_up_wheat_mt | 35 million_tonnes | **35.65** | 2025-11-20 | UP wheat output in 2024-25 was 35.65 Mt (30.23% of India). | DA&FW ES&E via Economic Survey 2025-26 Table 1.18 (2024-25 final) |
| agriculture-production · top_state_mp_wheat_mt | 22 million_tonnes | **24.51** | 2025-11-20 | MP wheat output in 2024-25 was 24.51 Mt, not 22. | DA&FW ES&E via Economic Survey 2025-26 Table 1.18 (2024-25 final) |
| agriculture-production · top_state_pb_wheat_mt | 18 million_tonnes | **17.99** | 2025-11-20 | Punjab wheat output in 2024-25 was 17.99 Mt (value 18 was right, rounded). | DA&FW ES&E via Economic Survey 2025-26 Table 1.18 (2024-25 final) |
| agriculture-production · top_state_wb_rice_mt | 16 million_tonnes | **16.02** | 2025-11-20 | West Bengal rice output in 2024-25 was 16.02 Mt (third-largest, behind UP and Telangana). | DA&FW ES&E via Economic Survey 2025-26 Table 1.18 (2024-25 final) |
| economy-gdp · gdp_nominal_usd_trillion | 4.1 trillion_usd | **3.92** | 2026-04-14 | IMF April 2026 WEO puts India's FY2025-26 nominal GDP at USD 3.92 tn (2026 projection 4.15 tn), not 4.1 tn. | IMF World Economic Outlook, April 2026 (India FY2025-26) |
| economy-gdp · world_rank_gdp_nominal | 5 rank | **6** | 2026-04-14 | In the IMF April 2026 WEO India slipped from 4th to 6th in nominal GDP (rupee fall + base-year revision), so rank 5 is wrong. | IMF World Economic Outlook, April 2026 |
| economy-gdp · gdp_ppp_usd_trillion | 14.6 trillion_usd | **17.26** | 2026-04-14 | IMF April 2026 WEO puts India's PPP GDP at about Int$17.3 tn for 2025 (18.9 tn projected for 2026); 14.6 is an old-vintage number. | IMF World Economic Outlook, April 2026 (PPP, India FY2025-26) |
| economy-gdp · world_rank_gdp_ppp | 3 rank | **(unchanged)** | 2026-04-14 | India remains 3rd by PPP GDP (after China and the US) in the April 2026 WEO; only the date/source need updating. | IMF World Economic Outlook, April 2026 |
| economy-gdp · gdp_growth_yoy | 7.4 percent | **7.8** | 2026-08-31 | MoSPI's latest official figure for FY2025-26 real GDP growth is 7.8% (updated 31 Aug 2026), not 7.4%. | MoSPI · National Accounts Statistics 2026 (updated PE 2025-26, base 2022-23) |
| economy-gdp · gdp_per_capita_inr | 240,000 rupees | **243,803** | 2026-06-05 | MoSPI's FY2025-26 per-capita GDP at current prices is about Rs 2.44 lakh (2,43,803 in the June PE). | MoSPI · Provisional Estimates 2025-26, Statement 2 (current prices) |
| economy-inflation · cpi_inflation | 5 percent | **4.82** | 2026-09-14 | Latest official CPI inflation (Aug 2026, released 14 Sep 2026) is 4.82%, not 5.0%. | MoSPI · CPI (base 2024=100), August 2026 (provisional) |
| demographics-population · population_total | 1,430,000,000 people | **1,463,865,525** | 2025-07-01 | UN WPP 2024 puts India's mid-2025 population at 1.464 billion; 1.43 bn is the 2023 figure. | UN World Population Prospects 2024 (mid-2025 estimate) |
| demographics-population · population_growth_yoy | 0.8 percent | **0.89** | 2025-07-01 | World Bank/UN WPP annual growth for 2025 is 0.887%, so 0.8 understates it. | UN WPP 2024 via World Bank WDI (SP.POP.GROW, 2025) |
| demographics-population · population_density_per_sq_km | 481 per_sq_km | **483.7** | 2023-07-01 | The 481 figure is not a Census number (Census 2011 = 382); the matching international series (World Bank, 2023) is 483.7 per km2. | World Bank WDI EN.POP.DNST (UN WPP population / FAO land area), 2023 |
| demographics-population · global_rank | 1 rank | **(unchanged)** | 2025-07-01 | India remains the most populous country in UN WPP 2024 (1.46 bn vs China ~1.41 bn); value 1 is correct, only date/source updated. | UN World Population Prospects 2024 |
| economy-gdp · remittances_usd_billion | 129 billion_usd | **150.7** | 2026-07-13 | World Bank data (updated July 2026) put India's 2025 remittance inflows at USD 150.7 bn, the world's largest. | World Bank WDI · Personal remittances received (BX.TRF.PWKR.CD.DT), 2025 |
| economy-gdp · world_rank_remittances | 1 rank | **(unchanged)** | 2026-07-13 | India is still #1 (USD 150.7 bn) ahead of Mexico (64.4 bn) and the Philippines (41.6 bn) in WDI 2025. | World Bank WDI, 2025 |
| trade-diaspora · remittances_annual_billion_usd | 125 billion_usd | **150.7** | 2026-07-13 | Same World Bank series: USD 150.7 bn in 2025; 125 was a 2023-era figure and conflicts with the other remittance row. | World Bank WDI · Personal remittances received, 2025 |
| energy-power · installed_capacity_gw | 460 gigawatts | **554.54** | 2026-08-31 | CEA's latest monthly report puts total installed capacity at 5,54,544 MW (554.5 GW) as on 31.08.2026. | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · capacity_change_yoy_gw | 27 gigawatts | **59** | 2026-08-31 | Capacity grew by about 59 GW in the year to Aug 2026 (495.5 -> 554.5 GW), more than double the 27 shown. | CEA · Installed Capacity Reports, Aug 2025 vs Aug 2026 |
| energy-power · coal_capacity_gw | 217 gigawatts | **224.41** | 2026-08-31 | Coal capacity is 2,24,408 MW as on 31.08.2026. | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · renewables_capacity_gw | 180 gigawatts | **243.49** | 2026-08-31 | Wind, solar and other renewables (excluding large hydro) total 243.5 GW as on 31.08.2026; 180 GW is about 18 months old. | CEA · Installed Capacity Report, 31 Aug 2026 (Wind, Solar & other RE; excl. large hydro) |
| energy-power · hydro_capacity_gw | 47 gigawatts | **52.06** | 2026-08-31 | Large hydro including pumped storage is 52,065 MW as on 31.08.2026. | CEA · Installed Capacity Report, 31 Aug 2026 (Hydro incl. pumped storage) |
| energy-power · nuclear_capacity_gw | 7.5 gigawatts | **8.78** | 2026-08-31 | Nuclear capacity is 8,780 MW per CEA (31.08.2026). | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · mix_pct_coal | 47 percent | **40.47** | 2026-08-31 | Coal's share of installed capacity has fallen to 40.47% (Aug 2026). | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · mix_pct_renewables | 39 percent | **43.91** | 2026-08-31 | Wind, solar and other RE are 43.91% of installed capacity (Aug 2026), up from 39%. | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · mix_pct_hydro | 10 percent | **9.39** | 2026-08-31 | Hydro (incl. PSP) is 9.39% of installed capacity. | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-power · mix_pct_nuclear | 1.6 percent | **1.58** | 2026-08-31 | Nuclear is 1.58% of installed capacity (value 1.6 was right when rounded; date updated). | CEA · Installed Capacity Report, 31 Aug 2026 |
| energy-renewables · renewable_installed_gw | 180 gigawatts | **243.49** | 2026-08-31 | Renewable (excl. large hydro) capacity is 243.5 GW as on 31.08.2026 per CEA/MNRE. | CEA Installed Capacity Report 31 Aug 2026 (RES figures as per MNRE) |
| energy-power · top_state_gj_capacity_gw | 42 gigawatts | **76.99** | 2026-08-31 | Gujarat has 76.99 GW (incl. central shares), the most of any state. | CEA · Installed capacity incl. allocated central shares, 31 Aug 2026 |
| energy-power · top_state_mh_capacity_gw | 45 gigawatts | **62.44** | 2026-08-31 | Maharashtra has 62.44 GW and ranks 3rd behind Gujarat and Rajasthan. | CEA · Installed capacity incl. allocated central shares, 31 Aug 2026 |
| energy-power · top_state_rj_capacity_gw | 33 gigawatts | **67.79** | 2026-08-31 | Rajasthan has 67.79 GW (50.3 GW of it private renewables), ranking 2nd. | CEA · Installed capacity incl. allocated central shares, 31 Aug 2026 |
| energy-power · top_state_tn_capacity_gw | 37 gigawatts | **48.05** | 2026-08-31 | Tamil Nadu has 48.05 GW (4th). | CEA · Installed capacity incl. allocated central shares, 31 Aug 2026 |
| energy-power · top_state_kn_capacity_gw | 31 gigawatts | **39.3** | 2026-08-31 | Karnataka has 39.30 GW, just behind Uttar Pradesh (39.72 GW). | CEA · Installed capacity incl. allocated central shares, 31 Aug 2026 |
| budget-union · total_outlay_inr_lakh_crore | 47.6 lakh_crore_inr | **53.47** | 2026-02-01 | Union Budget 2026-27 total expenditure (BE) is Rs 53.47 lakh crore; 47.6 is an older year's figure. | MoF · Budget at a Glance 2026-27 (Total Expenditure, BE) |
| defence-budget · defence_allocation_lakh_cr | 6.2 lakh_cr | **7.85** | 2026-02-01 | Ministry of Defence's 2026-27 allocation is Rs 7.85 lakh crore; 6.2 was the 2024-25 level. | MoF · Expenditure Budget 2026-27, Ministry of Defence (all demands) |
| budget-gst · monthly_collection_inr_lakh_crore | 1.6 lakh_crore_inr | **2.11** | 2026-07-31 | The official GSTN file shows gross GST of Rs 2.11 lakh crore for July 2026 (latest month published), not 1.6. | GSTN · GST Statistics, Gross & Net Tax Collection (July 2026) |
| health-pmjay · cards_issued_crore | 36 crore_cards | **48.64** | 2026-09-27 | NHA's live dashboard shows 48.64 crore Ayushman cards created, not 36 crore. | NHA · AB PM-JAY public dashboard (Ayushman Cards Created, overall) |
| health-pmjay · empanelled_hospitals_thousands | 30 thousand | **39.36** | 2026-09-27 | NHA dashboard shows 39,358 hospitals empanelled under AB PM-JAY (about 39.4 thousand, not 30). | NHA · AB PM-JAY public dashboard (Hospitals Empanelled) |
| science-digital · upi_txn_per_month_billion | 14 billion_per_month | **23.66** | 2026-08-24 | UPI processed 23.66 billion transactions in July 2026 (record), not 14 billion. | PIB Backgrounder (MoF/NPCI data) · UPI, July 2026 |
| infra-telecom · subscribers_crore | 117 crore | **135.43** | 2026-08-28 | TRAI reports 1,354.28 million (135.4 crore) telephone subscribers at end-July 2026; 117 crore is ~3 years old. | TRAI · Telecom Subscription Data, end of July 2026 |
| agriculture-pmkisan · farmers_count_crore | 11 crore_farmers | **9.44** | 2026-06-20 | The latest PM-KISAN instalment (23rd, June 2026) reached 9.44 crore farmers. | PIB · 23rd instalment of PM-KISAN (20 Jun 2026) |
| science-digital · aadhaar_enrolled_crore | 140 crore | **144.66** | 2026-09-27 | UIDAI's dashboard shows 144.66 crore Aadhaar enrolments. | UIDAI · Aadhaar Dashboard (enrolments, cumulative) |
| science-digital · digilocker_users_crore | 25 crore | **72.43** | 2026-08-12 | DigiLocker has more than 72.43 crore registered users (Aug 2026), nearly 3x the 25 crore shown. | MeitY via PIB (Rajya/Lok Sabha reply, 12 Aug 2026) |
| science-startups · dpiit_recognised_lakh | 1.4 lakh | **2.23** | 2026-04-17 | DPIIT-recognised startups crossed 2.23 lakh as on 31 Mar 2026 (not 1.4 lakh). | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · change_yoy_lakh | 0.3 lakh | **0.552** | 2026-04-17 | 55,200+ startups were recognised in FY2025-26, the highest ever, not 30,000. | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · data_year | 2,024 year | **2,026** | 2026-04-17 | The latest DPIIT counts are as on 31 March 2026. | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · top_state_mh_startups_thousand | 15 thousand | **38.66** | 2026-04-17 | Maharashtra has 38,660+ recognised startups, the most of any state. | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · top_state_ka_startups_thousand | 18 thousand | **22.6** | 2026-04-17 | Karnataka has 22,600+ recognised startups (2nd). | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · top_state_dl_startups_thousand | 13 thousand | **21.12** | 2026-04-17 | Delhi has 21,120+ recognised startups (4th). | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · top_state_tn_startups_thousand | 9 thousand | **14.83** | 2026-04-17 | Tamil Nadu has 14,830+ recognised startups. | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · top_state_tg_startups_thousand | 7 thousand | **12.52** | 2026-04-17 | Telangana has 12,520+ recognised startups (7th). | DPIIT via PIB (recognised startups as on 31 Mar 2026) |
| science-startups · unicorns_count | 110 unicorns | **125** | 2026-01-16 | The PM said on National Startup Day 2026 that India has nearly 125 unicorns. | PMO via PIB · National Startup Day speech (16 Jan 2026) |
| tourism-heritage · unesco_sites_count | 43 sites | **45** | 2026-07-25 | India now has 45 World Heritage properties after Sarnath was inscribed on 25 Jul 2026 (43 is two inscriptions behind). | UNESCO World Heritage List / Ministry of Culture (PIB, 25 Jul 2026) |
| tourism-heritage · global_rank_unesco | 6 rank | **(unchanged)** | 2026-07-25 | India still ranks 6th globally with 45 sites; value correct, date updated. | Ministry of Culture via PIB (25 Jul 2026) |
| tourism-heritage · data_year | 2,024 year | **2,026** | 2026-07-25 | Heritage counts are now as of the July 2026 World Heritage Committee session. | UNESCO World Heritage List |
| wildlife-tigers · tiger_population_total | 3,682 tigers | **(unchanged)** | 2023-07-29 | 3,682 is still the latest official tiger estimate (AITE 2022); only the reporting date needs fixing. | NTCA · Status of Tigers 2022 (All India Tiger Estimation, released 29 Jul 2023) |
| wildlife-tigers · tiger_reserves_count | 58 notified | **(unchanged)** | 2026-07-29 | The Environment Minister cited 58 tiger reserves on 29 Jul 2026; value correct, date updated. | MoEFCC via PIB · Global Tiger Day 2026 |
| wildlife-forests · forest_cover_pct | 21.7 percent | **21.76** | 2024-12-21 | ISFR 2023 puts forest cover at 21.76% of geographical area (21.7 was truncated; date was fake). | FSI · ISFR 2023 (released 21 Dec 2024) |
| wildlife-forests · forest_cover_lakh_km2 | 7.15 lakh_km2 | **(unchanged)** | 2024-12-21 | 7.15 lakh km2 (7,15,343 km2) is correct per ISFR 2023; only the date needed fixing. | FSI · ISFR 2023 (released 21 Dec 2024) |
| wildlife-forests · tree_cover_pct | 2.91 percent | **3.41** | 2024-12-21 | ISFR 2023 tree cover is 1,12,014 km2 = 3.41% of area; 2.91% was the ISFR 2021 figure. | FSI · ISFR 2023 (released 21 Dec 2024) |
| wildlife-forests · forest_cover_change_2021 | 1,540 square_km | **156** | 2024-12-21 | ISFR 2023 reports only +156 km2 forest cover since 2021 (+1,445 km2 including tree cover); 1,540 is the 2019-21 change from the previous report. | FSI · ISFR 2023 (released 21 Dec 2024) (change vs ISFR 2021) |
| wildlife-forests · top_state_mizoram_pct | 84.5 percent | **85.34** | 2024-12-21 | Mizoram's forest cover is 85.34% in ISFR 2023 (84.5 is the ISFR 2021 value). | FSI · ISFR 2023 (released 21 Dec 2024) |
| defence-exports · defence_exports_thousand_cr | 21 thousand_cr | **38.424** | 2026-04-02 | Defence exports hit a record Rs 38,424 crore in FY2025-26 (up 62.66% from Rs 23,622 crore); 21 is two years old. | MoD via PIB · Defence exports FY2025-26 |
| defence-dpsu · dpsu_count | 9 entities | **16** | 2026-09-01 | The Raksha Mantri reviewed all 16 Defence PSUs on 1 Sep 2026; 9 is outdated. | MoD via PIB · annual performance review of 16 DPSUs |
| livestock-fisheries · fish_production_lakh_tonnes | 175 lakh_tonnes | **197.75** | 2026-07-28 | Fish production reached a record 197.75 lakh tonnes in 2024-25, not 175. | Dept of Fisheries via PIB (Parliament reply) · 2024-25 |
| tourism-gi-tags · gi_tags_count | 600 gi_tags | **800** | 2026-08-04 | PIB says India has over 800 registered GI products (607 granted since 2014). | PIB Backgrounder · GI Tags (4 Aug 2026) |
| health-overview · life_expectancy_years | 70.8 years | **70.6** | 2026-05-20 | The latest SRS life tables (2020-24, published May 2026) put life expectancy at birth at 70.6 years, not 70.8. | ORGI · SRS Abridged Life Tables 2020-24 |
| health-overview · state_leader_kerala_life_exp | 75.3 years | **75.6** | 2026-05-20 | Kerala's life expectancy is 75.6 years in SRS 2020-24, the highest among bigger states. | ORGI · SRS Abridged Life Tables 2020-24 (Kerala) |
| health-overview · infant_mortality_rate | 35 per_1000_births | **24** | 2026-05-20 | SRS 2024 puts India's IMR at 24 per 1,000 live births; 35 is about a decade old. | ORGI · SRS Statistical Report 2024 |
| health-overview · state_leader_kerala_imr | 6 per_1000_births | **8** | 2026-05-20 | SRS 2024 reports Kerala's IMR at 8, still the lowest among bigger states (not 6). | ORGI · SRS Statistical Report 2024 (Kerala) |
| justice-pendency · total_pending_crore_cases | 5 crore | **5.21** | 2026-09-27 | NJDG shows 5.21 crore cases pending in district and subordinate courts alone as of 27 Sep 2026. | NJDG · District & subordinate courts (live dashboard) |
| infra-roads · nh_length_km | 146,145 km | **146,560** | 2025-12-30 | MoRTH's Year End Review 2025 gives the NH network as 1,46,560 km (grew from 91,287 km in 2014). | MoRTH · Year End Review 2025 (PIB) |
| infra-roads · expressway_km | 6,000 km | **3,052** | 2025-12-30 | MoRTH reports 3,052 km of operational access-controlled expressways, about half the 6,000 shown. | MoRTH · Year End Review 2025 (operational access-controlled HSC/expressways) |
| infra-roads · data_year | 2,024 year | **2,025** | 2025-12-30 | The latest official NH figures are from MoRTH's Year End Review of Dec 2025. | MoRTH · Year End Review 2025 |
| infra-roads · top_state_up_nh_km | 12,000 km | **11,672** | 2026-05-21 | MoRTH put Uttar Pradesh's NH network at 11,672 km in May 2026. | MoRTH via PIB (NH network in Uttar Pradesh reviewed, 21 May 2026) |
| infra-aviation · airports_operational_count | 150 airports | **165** | 2026-07-17 | India had 165 operational airports as of 15 July 2026 (up from 74 in 2014), not 150. | MoCA via PIB Backgrounder (operational airports as of 15 Jul 2026) |
| infra-roads · udan_airports_count | 85 airports | **95** | 2026-07-17 | UDAN has operationalised 679 routes across 95 airports, heliports and water aerodromes. | MoCA via PIB Backgrounder · UDAN (9 years) |
| education-higher · higher_ed_enrolment_crore | 4.3 crore_students | **4.5** | 2026-07-08 | AISHE 2023-24 (released July 2026) reports 4.50 crore students in higher education, up from 4.33 crore in 2021-22. | MoE · AISHE 2023-24 (released 8 Jul 2026) |
| wildlife-forests · elephants_count | 27,312 individuals | **22,446** | 2026-08-12 | The latest official elephant estimate (SAIEE 2021-25) is 22,446; 27,312 is the 2017 census. | MoEFCC · Synchronous All India Population Estimation of Elephants (SAIEE) 2021-25, via PIB |
| energy-power · re_target_gw_2030 | 500 gigawatts | **(unchanged)** | 2026-08-09 | 500 GW is correct but it is a non-fossil (not only renewable) target; source label should not say NDC. | MNRE via PIB · 500 GW non-fossil capacity target by 2030 |
| science-rd · rd_pct_gdp | 0.65 percent | **(unchanged)** | 2020-12-31 | R&D spending is about 0.65% of GDP, but the figure is for 2020, not 2026. | World Bank WDI GB.XPD.RSDV.GD.ZS (UNESCO UIS), 2020 |

### Confirmed correct (20 rows — value kept, real date set)

area_total_million_km2 = 3.29; world_rank_by_area = 7; unesco_taj_mahal_year = 1,983; unesco_ajanta_year = 1,983; unesco_khajuraho_year = 1,986; unesco_hampi_year = 1,986; unesco_sundarbans_year = 1,987; isfr_edition = 18; isfr_year = 2,023; forest_cover_target_pct = 33; life_expectancy_change_1990 = 14; loksabha_seats_total = 543; lok_sabha_seats = 543; rajyasabha_seats_total = 245; rajya_sabha_seats = 245; olympic_medals_total = 41; states_count = 28; uts_count = 8; scheduled_languages = 22; scheduled_languages_count = 22.
Fixed facts with no release date (seats, languages, UNESCO inscription
years, ISFR edition) get the check date, 27 Sep 2026, as their "as of".

### Hidden: unverifiable (64 rows → "—")

Either the checker found the stored value outdated but could not read the
exact current figure (e.g. coal output is now above 1,000 Mt, rail route
length above 69,873 km, Manipur/Nagaland forest cover above 75%), or the row
was not reached before the web-search quota ran out. None of these seed
values is shown any more.

- agriculture-production · **top_state_ap_rice_mt** (was 14 million_tonnes) — The official top-3 table does not list Andhra Pradesh for rice, so 14 Mt cannot be confirmed and the row misrepresents the ranking.
- science-digital · **fastag_active_crore** (was 8 crore) — Could not confirm an official 'active FASTag' count; the latest official issued figure is 11.86 crore (Dec 2025).
- wildlife-forests · **top_state_arunachal_pct** (was 79.3 percent) — Could not read the ISFR 2023 state percentage table; the stored value appears to be from ISFR 2021.
- wildlife-forests · **top_state_meghalaya_pct** (was 76 percent) — ISFR 2023 only confirms Meghalaya is above 75%; the exact percentage was not verified.
- wildlife-forests · **top_state_manipur_pct** (was 74.3 percent) — ISFR 2023 says Manipur is above 75%, so 74.3% is outdated, but the exact figure was not verified.
- wildlife-forests · **top_state_nagaland_pct** (was 73.9 percent) — ISFR 2023 says Nagaland is above 75%, so 73.9% is outdated, but the exact figure was not verified.
- wildlife-forests · **top_state_pct** (was 26.6 percent) — 26.6% does not match any ISFR 2023 figure for Madhya Pradesh that I could find.
- tourism-overview · **international_arrivals_lakh** (was 94 lakh) — The row's definition is unclear: ITAs were 20.57 million in 2024, while 94 lakh looks like an old FTA figure.
- energy-coal · **coal_production_million_tonnes** (was 990 million_tonnes) — India produced over 1,000 Mt of coal in FY2025-26 (and FY2024-25), so 990 Mt is too low, but the exact FY26 total was not confirmed.
- trade-overview · **exports_annual_lakh_cr** (was 37 lakh_cr) — FY2025-26 exports are published in USD (US$441.78 bn merchandise; US$860.09 bn incl. services); no official rupee total was found, so the unit could not be matched.
- infra-railways · **route_km** (was 68,000 km) — Electrified broad-gauge track alone is 69,873 route km, so 68,000 is outdated, but the exact total route length was not confirmed.
- elections-turnout · **ge_2024_turnout_pct** (was 65.8 percent) — Could not re-open ECI's own document this session; 65.8% is consistent with the commonly cited ECI figure (65.79%).
- know-india-elections · **registered_voters_millions** (was 970 millions_people) — 970 million is close to the 2024 roll (968-978 million) but no current ECI national total was found.
- know-india-constitution · **adopted_year** (was 1,950 year) — 1950 is the year it came into force; adoption was 26 November 1949.
- agriculture-plantation · **tea_production_million_kg** (was 1,400 million_kg) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Tea Board of India in this pass (web-search quota exhau
- agriculture-pmkisan · **pmfby_insured_crore** (was 5.5 crore_farmers) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against PMFBY · Agri Insurance in this pass (web-search quota e
- agriculture-pmkisan · **kcc_active_cards_crore** (was 7 crore_cards) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against NABARD · KCC in this pass (web-search quota exhausted);
- agriculture-pmkisan · **soil_health_cards_crore** (was 22 crore_cards) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Soil Health Card scheme in this pass (web-search quota 
- economy-employment · **workforce_size** (was 600,000,000 people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against PLFS / NSO in this pass (web-search quota exhausted); t
- economy-inflation · **rbi_target_midpoint** (was 4 percent) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against RBI in this pass (web-search quota exhausted); the roun
- education-schools · **schools_total_lakh** (was 14.9 lakh_schools) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against UDISE+ 2022-23 in this pass (web-search quota exhausted
- education-skills · **pmkvy_trained_crore** (was 1.4 crore_people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MSDE · PMKVY dashboard in this pass (web-search quota e
- energy-fuels · **crude_imports_million_tonnes** (was 232 million_tonnes) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoPNG · PPAC in this pass (web-search quota exhausted);
- health-immunisation · **doses_administered_crore** (was 26 crore_doses) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against U-WIN · MoHFW in this pass (web-search quota exhausted)
- health-overview · **life_expectancy_target_2030** (was 75 years) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against National Health Policy 2017 in this pass (web-search qu
- health-overview · **doctors_per_1000** (was 0.74 per_1000_people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoHFW · NMC in this pass (web-search quota exhausted); 
- health-overview · **state_leader_delhi_doctors** (was 1.32 per_1000_people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against NMC · Delhi Medical Council in this pass (web-search qu
- health-overview · **state_leader_manipur_imm_cov** (was 82 percent) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against NFHS-5 (Manipur) in this pass (web-search quota exhaust
- health-overview · **state_leader_tn_hosp_per_1000** (was 1.43 per_1000_people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against State Health Profile (TN) in this pass (web-search quot
- infra-ports · **major_ports_count** (was 12 ports) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Ministry of Ports in this pass (web-search quota exhaus
- infra-roads · **nh_target_km_2027** (was 200,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Bharatmala Pariyojana in this pass (web-search quota ex
- infra-roads · **nh_change_yoy_km** (was 5,200 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoRTH FY25 added in this pass (web-search quota exhaust
- infra-roads · **top_state_mh_nh_km** (was 18,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoRTH · Maharashtra in this pass (web-search quota exha
- infra-roads · **top_state_rj_nh_km** (was 10,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoRTH · Rajasthan in this pass (web-search quota exhaus
- infra-roads · **top_state_mp_nh_km** (was 9,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoRTH · MP in this pass (web-search quota exhausted); t
- infra-roads · **top_state_ka_nh_km** (was 7,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoRTH · Karnataka in this pass (web-search quota exhaus
- infra-roads · **bharatmala_nh_km** (was 65,000 km) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Bharatmala dashboard in this pass (web-search quota exh
- infra-roads · **sagarmala_ports_count** (was 12 ports) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Sagarmala · Ministry of Ports in this pass (web-search 
- infra-roads · **gatishakti_projects_count** (was 200 projects) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against PM GatiShakti dashboard in this pass (web-search quota 
- infra-smart-cities · **cities_count** (was 100 cities) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Smart Cities Mission in this pass (web-search quota exh
- justice-crime · **ipc_cases_per_year_lakh** (was 36 lakh_per_year) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Crime in India · NCRB in this pass (web-search quota ex
- justice-crime · **conviction_rate_pct** (was 57 percent) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Crime in India · NCRB in this pass (web-search quota ex
- justice-police · **civil_police_total_lakh** (was 21 lakh) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against BPRD · Data on Police Organizations in this pass (web-s
- justice-police · **police_per_lakh_population** (was 152 per_lakh) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against BPRD · sanctioned strength in this pass (web-search quo
- justice-police · **un_target_per_lakh** (was 222 per_lakh) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against UN Office on Drugs & Crime (UNODC) in this pass (web-se
- justice-police · **change_yoy_lakh** (was 0.4 lakh) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against BPRD prior-year delta in this pass (web-search quota ex
- justice-prisons · **prison_population_lakh** (was 5.7 lakh) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Prison Statistics India · NCRB in this pass (web-search
- know-india-budget · **budget_process_stages** (was 8 stages) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Constitution Article 112 · NCERT in this pass (web-sear
- know-india-constitution · **articles_count** (was 470 count) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against NCERT Class 11 Polity in this pass (web-search quota ex
- know-india-constitution · **schedules_count** (was 12 count) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Constitution of India in this pass (web-search quota ex
- know-india-constitution · **parts_count** (was 25 count) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Constitution of India in this pass (web-search quota ex
- know-india-history-timeline · **civilization_span_years** (was 5,000 years) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against NCERT History Class 6-12 in this pass (web-search quota
- livestock-census · **livestock_total_million** (was 535 million) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Livestock Census · DA&FW in this pass (web-search quota
- national-snapshot · **smartphone_users_millions** (was 750 millions_people) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against GSMA · Statista in this pass (web-search quota exhauste
- national-snapshot · **world_rank_smartphone_users** (was 2 rank) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against GSMA · Statista in this pass (web-search quota exhauste
- science-isro · **satellites_launched_count** (was 120 satellites) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against ISRO mission catalogue in this pass (web-search quota e
- sports-khelo-india · **khelo_athletes_thousand** (was 3 thousand) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Khelo India · MoYAS in this pass (web-search quota exha
- tourism-heritage · **asi_monuments_count** (was 3,700 monuments) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against ASI · Centrally Protected Monuments in this pass (web-s
- tourism-heritage · **bollywood_films_per_year** (was 1,800 films_per_year) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against CBFC · Annual Report in this pass (web-search quota exh
- tourism-heritage · **museums_count** (was 1,000 museums) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Ministry of Culture in this pass (web-search quota exha
- trade-fdi · **fdi_equity_inflow_billion_usd** (was 70 billion_usd) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against DPIIT · FDI Statistics in this pass (web-search quota e
- wildlife-forests · **rhinos_count** (was 4,014 individuals) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against MoEFCC · Rhino conservation 2022 in this pass (web-sear
- wildlife-protected-areas · **parks_count_total** (was 1,014 parks) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against WII · ENVIS Wildlife Institute in this pass (web-search
- wildlife-tigers · **reserve_area_protected_sqkm** (was 78,735 km²) — Seeded by hand in spring 2026 (shown as 'as of 1 May 2026', which was only the seed day) and not confirmed against Project Tiger in this pass (web-search quota exhausted)

### Code constants (en + hi + kn)

| Where | Was | Now | Source |
|---|---|---|---|
| KPI tile: population (`IndiaKpiStrip.tsx` `INDIA_REFERENCE`) | 1.43 bn, "UN, 2024 estimate", "about 0.8% a year" | **1.46 bn**, "UN WPP 2024, 2025 estimate", "about 0.9% a year" | UN WPP 2024 mid-2025 = 1,463,865,525 — [UNFPA](https://www.unfpa.org/data/world-population/IN); growth 0.887% — [World Bank WDI](https://data.worldbank.org/indicator/SP.POP.GROW?locations=IN) |
| KPI tile: nominal GDP | 4.1 trillion, "IMF, FY26", "6.5% growth projected" | **3.9 trillion** (3.92), "IMF, April 2026 (FY26)", "7.8% growth in FY26 (MoSPI)" | IMF WEO Apr 2026 via [Business Standard](https://www.business-standard.com/economy/news/india-gdp-ranking-imf-2026-rupee-depreciation-base-revision-126041600790_1.html) (IMF datamapper blocked the checker); growth — [MoSPI NAS 2026](https://www.mospi.gov.in/uploads/latestReleases/latest_release_1788171660220_f2a7f5ed-3ce3-45cc-a5b2-eebc84623a01_Final_Press_Release_on_NAS_2026.pdf) |
| KPI tiles: area 3.29 M km², 28 states + 8 UTs, 22 languages | — | confirmed | World Bank WDI; MHA |
| World ranks: economy | #5, 2025, "up from 6" | **#6, 2026, "down from 4"** | IMF WEO Apr 2026 (as above) |
| World ranks: milk | 230 MT | **248 MT (2024-25)** | [PIB / DAHD](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2298197) |
| World ranks: internet | 900M / "90 crore users", 2024 | **1.09B / "109 crore internet subscribers", 2026** | TRAI via [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2276780) (end-March 2026) |
| World ranks: renewable | 191 GW | **296 GW incl. large hydro (Aug 2026)** | [CEA installed capacity, 31 Aug 2026](https://cea.nic.in/wp-content/uploads/installed/2026/08/IC_Aug_2026.pdf) |
| World ranks: "Pharmaceutical exports #3 (WTO)" | shown | **removed — hidden: unverifiable** (India is 3rd by *production volume*; no source for #3 in exports) | — |
| World ranks: postal "156K offices", railway "1.4M staff" | shown | **annotation removed — hidden: unverifiable** (no current official count read) | — |
| Band ranks: power capacity (`NaturalResourcesEnergy/metrics.ts`) | MH #1, GJ #2, TN #3, RJ #4, KA #5 | GJ #1 (77.0 GW), RJ #2 (67.8), MH #3 (62.4), TN #4 (48.0), KA **#6** (39.3; UP is #5 at 39.7) | CEA, 31 Aug 2026 |
| Band ranks: startups (`Innovation/metrics.ts`) | KA #1, MH #2, DL #3, TN #4, TG #5 | MH #1 (38.7k), KA #2 (22.6k), DL #4, TN (rank not stated), TG #7 | DPIIT via [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2253019) |
| Band ranks: crop states (`AgricultureLivestock/metrics.ts`) | WB rice #4, AP rice #5 | WB rice **#3**; Andhra Pradesh row removed (not in the official top three for rice) | DA&FW final 2024-25 via [Economic Survey table](https://www.indiabudget.gov.in/economicsurvey/doc/stat/tab1.18.pdf) |

**Unverified, left as they are:** world-rank movements for internet ("up
from #3") and renewables ("up from #5"); ranks for films (#1 UNESCO),
military (#4 Global Firepower 2025), postal and railway (#1) — well known,
but no page was re-read this pass. The page_india `world.notes.postal` and
`world.notes.railway` strings are now unused.

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

| Police "100" (Citizen Corner) | 100 | **Removed — hidden: unverifiable.** 112 (ERSS) is the police emergency number now (in Karnataka "Namma 112"); 100 could not be confirmed on an official page. The 112 card covers police. | [KSP directory](https://ksp.karnataka.gov.in/ksp_contact/en): "ERSS – Emergency Response Support System – 112" |
| Health page "National Health Helpline" | 1800-180-1104 | **Removed — hidden: unverifiable** (the old National Health Portal line; not found on any official page read) | — |
| 112, 101, 108 | — | confirmed | KSP directory lists "ERSS … 112", "Fire & Emergency Services … 101", "108 Control Room (Ambulance)" |
| iCall (health page) | 9152987821 | confirmed (TISS service, not government) | [icallhelpline.org](https://icallhelpline.org/) |

Strings changed in en + hi + kn (`page_citizen-corner.json`:
`helplines.road`, `helplines.corruption.name`, `helplines.consumer.when`).

**Not re-verified, kept (standard national numbers that do not look wrong):**
1098 Childline, 14567 Elderline (the MoSJE site did not resolve), 155261
PM-KISAN (portal is script-rendered), 14555 PM-JAY (pmjay.gov.in refused the
connection), 1800-116-117 (AIIMS poison centre). Tele-MANAS **14416**
(national mental-health line) is missing and could be added once confirmed.
The unused strings `helplines.police` (page_citizen-corner) and `nhh`
(page_health) can be deleted later.

- West Bengal: wbhealth.gov.in runs the free "102" ambulance; whether 108
  also works statewide was not confirmed, so 108 still shows there.
- **Responsibility text (`responsibility-content.ts`) — verified or hidden:**
  36 phone numbers in the "My Responsibility" advice (city-corporation,
  water-board, PWD, DC-office, pollution-board, forest and vigilance lines,
  e.g. Mandya CMC 08232-222400, BBMP 080-22660000, "MCC 0821-2418100" — which
  is actually in the Mysuru city police block, GHMC 040-21111111, SHE Teams
  WhatsApp 9490617444) could not be confirmed and were removed; the advice
  now names the office without a number. "Report drunk driving … 100" and
  "Dial 100" now say 112. Kept: Maharashtra and Telangana ACB 1064 and the
  Karnataka Lokayukta office line (all confirmed above).
- **Not checked — needs its own pass:** the same file's statistics (e.g.
  "Bengaluru's green cover dropped from 68% (1973) to under 3%", "Mysuru
  district has 3,000+ lakes", "1,087 lakes and tanks in Mandya", yearly
  road-death and waste figures) have no sources and should be verified or
  removed under the same rule.

---

## 5. Police station phone numbers (PoliceStation) — verified or hidden

Rule applied (owner, 27 Sep): a number is either confirmed on an official
page or removed. Sources: the station pages of
[Mysuru City Police](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en)
and [Mysuru District Police](https://mysurupolice.karnataka.gov.in/31/mysuru-district-police-stations),
the [Mandya District Police contact table](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en),
and the **Karnataka State Police statewide directory**
([ksp.karnataka.gov.in/ksp_contact](https://ksp.karnataka.gov.in/ksp_contact/en)),
which lists every Bengaluru City and Bengaluru District station with its
landline, mobile and e-mail. Station e-mails (…@ksp.gov.in) from the same
pages were added.

The seed numbers were invented: Mysuru used 0821-2443344, …3355, …3366 …;
Bengaluru's two seed batches gave the same station different numbers
(Yelahanka 080-28461100 *and* 080-28461400) and 62 of 65 ended in …100 or
…400, while the real Bengaluru City numbers are all 080-2294xxxx.

### Verified and corrected (70 stations)

| Station | Was (invented) | Now (official) | Source |
|---|---|---|---|
| Mysuru · Devaraja Police Station | 0821-2443344 | **0821-2418306** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/27/devaraja-police-station/en) |
| Mysuru · Hebbal Police Station (Mysuru) | 0821-2483100 | **0821-2418318** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/40/hebbal-police-station/en) |
| Mysuru · Jayalakshmipuram Police Station | 0821-2443377 | **0821-2418516** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/38/jayalakshmipuram-police-station/en) |
| Mysuru · Krishnaraja Police Station | 0821-2443355 | **0821-2418119** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/41/krishnaraja-police-station/en) |
| Mysuru · Lashkar Police Station | 0821-2434100 | **0821-2418307** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/28/lashkar-police-station/en) |
| Mysuru · Mandi Mohalla Police Station | 0821-2432100 | **0821-2418313** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/35/mandi-police-station/en) |
| Mysuru · Nazarbad Police Station | 0821-2443366 | **0821-2418308** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/30/nazarbad-police-station/en) |
| Mysuru · Saraswathipuram Police Station | 0821-2518100 | **0821-2418123** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/45/sarswarthipuram-police-station/en) |
| Mysuru · Udayagiri Police Station | 0821-2486100 | **0821-2418309** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/31/udayagiri-police-station/en) |
| Mysuru · V.V. Puram Police Station | 0821-2430100 | **0821-2418314** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/36/vanivilasa-puram-police-station/en) |
| Mysuru · Vidyaranyapuram Police Station | 0821-2443388 | **0821-2418122** | [mysurucitypolice.karnataka.gov.in](https://mysurucitypolice.karnataka.gov.in/44/vidyaranyapuram-police-station/en) |
| Mysuru · Bannur Police Station | 0821-2580100 | **08227-275632** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/54/bannuru-police-station/en) |
| Mysuru · H.D. Kote Police Station | 08228-252100 | **08228-255329** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/44/h-d-kote-police-station/en) |
| Mysuru · Hunsur Rural Police Station | 08222-252200 | **08222-252042** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/41/hunasuru-rural-police-station/en) |
| Mysuru · Hunsur Town Police Station | 08222-252100 | **08222-253133** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/42/hunasuru-town-police-station/en) |
| Mysuru · K.R. Nagar Police Station | 08222-252100 | **08223-263666** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/37/k-r-nagara-police-station/en) |
| Mysuru · Nanjangud Rural Police Station | 08221-228200 | **08221-226259** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/48/nanjangud-rural-police-station/en) |
| Mysuru · Nanjangud Town Police Station | 08221-228100 | **08221-228383** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/49/nanjangud-town-police-station/en) |
| Mysuru · Periyapatna Police Station | 08222-263100 | **08223-273100** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/40/periyapattana-police-station/en) |
| Mysuru · T. Narasipur Police Station | 08227-262100 | **08227-261227** | [mysurupolice.karnataka.gov.in](https://mysurupolice.karnataka.gov.in/53/t-narsipura-police-station/en) |
| Mandya · Maddur Police Station | 08232-252100 | **08232-232170** | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Pandavapura Police Station | 08232-258200 | **08236-255132** | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Srirangapatna Police Station | 08236-252200 | **08236-252027** | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · K R Pete Police Station | 08232-262200 | **08230-262248** (renamed “K R Pete Town Police Station”) | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Malavalli Police Station | 08232-272100 | **08231-242244** (renamed “Malavalli Town Police Station”) | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Mandya · Nagamangala Police Station | 08234-252100 | **08234-286040** (renamed “Nagamangala Town Police Station”) | [mandyapolice.karnataka.gov.in](https://mandyapolice.karnataka.gov.in/55/mandya-district-police-officers-contact-details/en) |
| Bengaluru Urban · Adugodi Police Station | 080-25542100 | **080-22942573** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Anekal Police Station | 080-27822100 | **080-27859235** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Ashok Nagar Police Station | 080-22250585 | **080-22942580** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Attibele Police Station | 080-27831100 | **080-27821360** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Bagalgunte Police Station | 080-28492100 | **080-22942258** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Banashankari Police Station | 080-26723100 | **080-22942564** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Banaswadi Police Station | 080-25470100 | **080-22942552** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Basavanagudi Police Station | 080-26603400 | **080-22942057** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Begur Police Station | 080-28441100 | **080-22942551** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Bellandur Police Station | 080-28442100 | **080-25747771** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Byatarayanapura Police Station | 080-28495100 | **080-22942507** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Cottonpet Police Station | 080-22874100 | **080-22942508** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Cubbon Park Police Station | 080-22942222 | **080-22942591** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Devanahalli Police Station | 080-27683100 | **080-27680333** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Electronic City Police Station | 080-28520100 | **080-22943469** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · HAL Police Station | 080-25221100 | **080-22942542** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · HSR Layout Police Station | 080-22943100 | **080-22943467** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Hebbal Police Station | 080-23630100 | **080-22942535** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · High Grounds Police Station | 080-22252777 | **080-22942587** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Indiranagar Police Station | 080-25276100 | **080-22942541** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · JP Nagar Police Station | 080-26595100 | **080-22942563** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Jalahalli Police Station | 080-28395100 | **080-22942527** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Jayanagar Police Station | 080-26634100 | **080-22942562** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · KR Puram Police Station | 080-25631100 | **080-22942553** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Kodigehalli Police Station | 080-28485100 | **080-22943703** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Koramangala Police Station | 080-25527100 | **080-22942570** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Madivala Police Station | 080-26742100 | **080-22942568** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Mahadevapura Police Station | 080-28448100 | **080-22942546** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Malleswaram Police Station | 080-23315400 | **080-22942519** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Marathahalli Police Station | 080-25243100 | **080-25639999** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · RT Nagar Police Station | 080-23332100 | **080-22942538** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Rajajinagar Police Station | 080-23154100 | **080-22942522** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Sadashivanagar Police Station | 080-23606400 | **080-22942589** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Sarjapur Police Station | 080-28438100 | **080-27823032** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Seshadripuram Police Station | 080-23461100 | **080-22942586** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Shivajinagar Police Station | 080-25550100 | **080-22942597** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Srirampuram Police Station | 080-23490100 | **080-22942520** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Subramanyanagar Police Station | 080-23305100 | **080-22942524** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Vidyaranyapura Police Station | 080-28483100 | **080-22942528** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Vijayanagar Police Station | 080-23307100 | **080-22942514** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Whitefield Police Station | 080-28450100 | **080-22943472** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Wilson Garden Police Station | 080-22272100 | **080-22942581** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Yelahanka Police Station | 080-28461100 | **080-22942536** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |
| Bengaluru Urban · Yeshwanthpur Police Station | 080-23375100 | **080-22942526** | [ksp.karnataka.gov.in](https://ksp.karnataka.gov.in/ksp_contact/en) |

### Deleted — hidden: unverifiable or wrong district (29 rows)

- Mysuru · Bogadi Police Station (Bogadi, Mysuru 570026) — Hidden: unverifiable. No 'Bogadi' station in Mysuru City Police's list or the KSP directory; its phone 0821-2443399 was invented.
- Mysuru · Chamundipuram Police Station (Chamundipuram, Mysuru 570004) — Hidden: unverifiable. No 'Chamundipuram' station in Mysuru City Police's list or the KSP directory; its phone 0821-2441100 was invented.
- Mysuru · K.R. Nagar Town Police Station (K.R. Nagar, Mysuru Dist 571602) — Hidden: unverifiable. Only one K.R. Nagara station exists (kept on the other row); no separate 'Town' station; its phone 08222-252300 was invented.
- Mysuru · Nagarahole Forest Police Station (Nagarahole, H.D. Kote, 571118) — Hidden: unverifiable. No 'Nagarahole Forest' police station in Mysuru District Police's list or the KSP directory; its phone 08228-252200 was invented.
- Mysuru · Rural Police Station Mysuru (Bannur Road, Mysuru 570015) — Hidden: unverifiable. No 'Rural Police Station Mysuru' in either official list; its phone 0821-2440100 was invented.
- Mandya · Mandya Town Police Station (Station Road, Mandya) — Hidden: unverifiable. Mandya town has Central, East, West, Rural, Traffic and Women stations — no single 'Mandya Town' station; its phone 08232-222600 was invented.
- Bengaluru Urban · duplicate Anekal Police Station (Town Hall Road, Anekal - 562106) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate BTM Layout Police Station (100 Feet Road, BTM Layout - 560076) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Devanahalli Police Station (NH-44, Devanahalli, Bengaluru - 562110) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Electronic City Police Station (Phase 1, Electronic City - 560100) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Hebbal Police Station (Hebbal Outer Ring Road, Bengaluru - 560024) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Indiranagar Police Station (100 Feet Road, Indiranagar - 560038) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Jayanagar Police Station (40th Cross, Jayanagar - 560041) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate K R Puram Police Station (Tin Factory, KR Puram - 560036) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Marathahalli Police Station (Outer Ring Road, Marathahalli - 560037) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Sarjapur Police Station (Sarjapur Road, Sarjapur - 562125) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Whitefield Police Station (ITPB Road, Whitefield - 560066) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · duplicate Yelahanka Police Station (Yelahanka New Town, Bengaluru - 560064) — The same station is listed twice (two seed batches with different made-up numbers). The twin row is kept and gets the official number; this one goes.
- Bengaluru Urban · BTM Layout Police Station (BTM Layout 1st Stage, Bengaluru 560029) — Hidden: unverifiable. No 'BTM Layout Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-26780100 look invented.
- Bengaluru Urban · Bannerghatta Road Police Station (Bannerghatta Road, Bengaluru 560083) — Hidden: unverifiable. No 'Bannerghatta Road Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-26485100 look invented.
- Bengaluru Urban · Chandapura Police Station (Chandapura, Bengaluru 562106) — Hidden: unverifiable. No 'Chandapura Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-27845100 look invented.
- Bengaluru Urban · Chickpet Police Station (Chickpet, Bengaluru 560053) — Hidden: unverifiable. No 'Chickpet Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-22875100 look invented.
- Bengaluru Urban · Doddaballapur Police Station (Doddaballapur Town, Bengaluru Rural 561203) — Hidden: Doddaballapur is in Bengaluru Rural district (Doddaballapura Town PS belongs to the Bengaluru District Police), not Bengaluru Urban; its phone 08033-265100 was invented.
- Bengaluru Urban · Electronic City Phase II Police Station (Phase 2, Electronic City - 560100) — Hidden: unverifiable. No 'Electronic City Phase II Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-28521400 look invented.
- Bengaluru Urban · Hesaraghatta Police Station (Hesaraghatta Road, Bengaluru 560088) — Hidden: unverifiable. No 'Hesaraghatta Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-28482100 look invented.
- Bengaluru Urban · Kanakapura Road Police Station (Kanakapura Road, Bengaluru 560062) — Hidden: unverifiable. No 'Kanakapura Road Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-26484100 look invented.
- Bengaluru Urban · Lalbagh Police Station (Lalbagh Road, Bengaluru 560027) — Hidden: unverifiable. No 'Lalbagh Police Station' in the Karnataka State Police directory (Bengaluru City and Bengaluru District lists); the row and its number 080-26711100 look invented.
- Kolkata · Lake Town Police Station (VIP Road, Lake Town, Kolkata 700089) — Hidden: Lake Town is under the Bidhannagar Police Commissionerate (North 24 Parganas), not Kolkata district; number 033-25285000 unverified.
- Kolkata · Salt Lake Police Station (Sector V, Salt Lake, Kolkata 700091) — Hidden: Salt Lake (Bidhannagar) is in North 24 Parganas under the Bidhannagar Police Commissionerate, not Kolkata district; number 033-23591000 unverified.

### Number set to null — hidden: unverifiable (96 stations)

Chennai, Hyderabad, Kolkata, Lucknow, Mumbai and New Delhi: the police
websites (Delhi Police, Kolkata Police, Mumbai Police, Hyderabad Police)
load their station directories with scripts the checker could not read,
the Tamil Nadu and Lucknow police sites did not respond, and the session's
web-search quota was used up. Every number in these six districts came
from an unsourced seed (most with made-up round endings), so all are set
to null. Station names are kept. Re-fill them from the official
directories when they can be read.

- **Chennai** (20): Adyar Police Station (044-24910013); Ambattur Police Station (044-26530100); Anna Nagar Police Station (044-26261100); Broadway Police Station (044-25340100); Egmore Police Station (044-28190100); Guindy Police Station (044-22350545); Kilpauk Police Station (044-26411221); Kodambakkam Police Station (044-24830100); Madhavaram Police Station (044-25550100); Mylapore Police Station (044-24641212); Nungambakkam Police Station (044-28270221); Perambur Police Station (044-25511221); Porur Police Station (044-24760100); Royapettah Police Station (044-28110100); Sholinganallur Police Station (044-24501100); T Nagar Police Station (044-24340750); Tambaram Police Station (044-22260550); Thiruvanmiyur Police Station (044-24424100); Tondiarpet Police Station (044-25951100); Velachery Police Station (044-22590523)
- **Hyderabad** (16): Abids PS (040-27854814); Afzalgunj PS (040-24515293); Bahadurpura PS (040-24515250); Charminar PS (040-24515888); Falaknuma PS (040-24515155); Golconda PS (040-23521000); Habeebnagar PS (040-23223625); Hussainialam PS (040-24515533); Kacheguda PS (040-27854133); Malakpet PS (040-24061100); Mangalhat PS (040-23220678); Musheerabad PS (040-27853855); Nampally PS (040-27853252); Narayanguda PS (040-27854920); Saidabad PS (040-24061050); Sultan Bazaar PS (040-27854050)
- **Kolkata** (18): Alipore Police Station (033-24795050); Beliaghata Police Station (033-23501100); Bhawanipur Police Station (033-24741225); Bowbazar Police Station (033-22366200); Cossipore Police Station (033-25563500); Entally Police Station (033-22842000); Garden Reach Police Station (033-24690250); Gariahat Police Station (033-24610320); Hare Street Police Station (033-22481200); Jadavpur Police Station (033-24732000); Jorasanko Police Station (033-22690250); Kasba Police Station (033-24420250); Kidderpore Police Station (033-24494350); Lalbazar (Kolkata Police HQ) (033-22143024); New Market Police Station (033-22521515); Park Street Police Station (033-22170460); Shyambazar Police Station (033-25534350); Tollygunge Police Station (033-24231000)
- **Lucknow** (15): Alambagh PS (0522-2455100); Aliganj PS (0522-2325400); Ashiana PS (0522-2422100); Cantonment PS (0522-2281200); Chinhat PS (0522-2670100); Chowk PS (0522-2252100); Gomti Nagar PS (0522-2305100); Gudamba PS (0522-2282100); Hazratganj PS (0522-2623399); Indira Nagar PS (0522-2354100); Jankipuram PS (0522-2730100); Kaiserbagh PS (0522-2622400); Mahanagar PS (0522-2386100); Sarojini Nagar PS (0522-2415200); Vibhuti Khand PS (0522-2301600)
- **Mumbai** (20): Andheri Police Station (022-26281515); Azad Maidan Police Station (022-22620974); Bandra Police Station (022-26420245); Borivali Police Station (022-28933510); Colaba Police Station (022-22161613); DN Nagar Police Station (022-26283251); Dadar Police Station (022-24229502); Dharavi Police Station (022-24044888); Ghatkopar Police Station (022-25002210); Goregaon Police Station (022-28721777); Juhu Police Station (022-26362929); Kandivali Police Station (022-28052055); Kurla Police Station (022-26521240); Malad Police Station (022-28811002); Marine Drive Police Station (022-22812366); Powai Police Station (022-25709264); Santacruz Police Station (022-26490092); Versova Police Station (022-26320346); Vikhroli Police Station (022-25787070); Worli Police Station (022-24938571)
- **New Delhi** (7): Barakhamba Road Police Station (011-23313400); Chanakya Puri Police Station (011-26114800); Connaught Place Police Station (011-23362800); Mandir Marg Police Station (011-23365400); Parliament Street Police Station (011-23361000); Tilak Marg Police Station (011-23381476); Tughlak Road Police Station (011-23792600)

---

## 6. Government offices — opening hours (GovOffice)

No hours were invented and none were added: the official pages that
could be opened do not state office-specific hours, and the web-search
quota ran out before each office's own page could be looked up.

| District | Offices | With hours | Without hours | Other gaps |
|---|---|---|---|---|
| Bengaluru U | 57 | 7 | **50** | 53 without website |
| Mysuru | 20 | 0 | **20** | 20 without website |
| Mandya | 4 | 4 | **0** | 3 without website |
| Hyderabad | 11 | 0 | **11** | 11 without website |
| Chennai | 10 | 0 | **10** | 10 without website |
| Mumbai | 10 | 0 | **10** | 10 without website |
| Pune | 8 | 0 | **8** | all 8 have no phone |
| Kolkata | 8 | 0 | **8** | 8 without website |
| Lucknow | 10 | 0 | **10** | 10 without website |
| New Delhi | 10 | 10 | **0** | 3 without website |

Districts with **no hours at all**: Chennai, Hyderabad, Kolkata, Lucknow,
Mumbai, Mysuru, Pune. Bengaluru Urban has hours for 7 of 57; Mandya (4/4)
and New Delhi (10/10) are complete (those existing hours were not
re-checked). Also noted: Kolkata still lists **Writers' Building** as an
office although the state secretariat moved to Nabanna in 2013 (Nabanna is
also listed) — worth removing or marking inactive once confirmed.

---

## 7. Freshness report (27 Sep 2026)

Newest date and row count per module and district, from read-only
queries. "—" = no rows. Dates are the newest *data* date where the table
has one (reading time, crop-price date, fiscal-year start, result year),
otherwise the row's `updatedAt`.

| Module | Bengaluru U | Mysuru | Mandya | Hyderabad | Chennai | Mumbai | Pune | Kolkata | Lucknow | New Delhi |
|---|---|---|---|---|---|---|---|---|---|---|
| Weather (WeatherReading.recordedAt) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (1) | 2026-09-27 (48) | 2026-09-27 (48) | 2026-09-27 (48) |
| Crop prices (CropPrice.date) | 2026-04-21 (100) | 2026-04-21 (100) | 2026-06-22 (87) | 2026-06-22 (100) | — | 2026-06-22 (100) | 2026-06-22 (100) | 2026-06-22 (100) | 2026-06-22 (100) | 2026-06-22 (100) |
| Dams (DamReading.recordedAt) | 2026-09-27 (1) | 2026-09-27 (2) | 2026-09-27 (2) | — | — | — | — | — | — | — |
| Canal releases | — | 2025-03-20 (3) | — | — | — | — | — | — | — | — |
| Rainfall (RainfallHistory year-month) | — | 2024-12-01 (24) | — | — | — | — | — | — | — | — |
| Budget (BudgetEntry fiscal year start) | 2025-04-01 (38) | 2025-04-01 (26) | 2024-04-01 (8) | 2026-04-01 (10) | 2025-04-01 (8) | 2025-04-01 (10) | 2026-04-01 (5) | 2025-04-01 (8) | 2025-04-01 (10) | 2025-04-01 (12) |
| Budget allocations | 2024-04-01 (6) | — | 2024-04-01 (6) | — | — | — | 2026-04-01 (5) | — | — | 2025-04-01 (6) |
| Revenue | — | — | — | — | — | — | — | — | — | — |
| Schemes (updatedAt) | 2026-03-18 (12) | 2026-06-21 (10) | 2026-03-17 (8) | 2026-04-10 (11) | 2026-04-01 (10) | 2026-04-01 (10) | 2026-04-24 (10) | 2026-04-10 (8) | 2026-04-10 (10) | 2026-04-10 (12) |
| Infrastructure (updatedAt) | 2026-06-07 (161) | 2026-06-15 (83) | 2026-05-25 (25) | 2026-07-07 (32) | 2026-08-20 (22) | 2026-06-12 (33) | 2026-05-09 (28) | 2026-08-08 (42) | 2026-07-20 (16) | 2026-06-22 (36) |
| Crime (CrimeStat year) | 2023-12-31 (8) | — | 2023-12-31 (5) | 2023-12-31 (18) | — | — | — | — | 2023-12-31 (8) | 2023-12-31 (6) |
| Police stations (no date column) | n/a (65) | n/a (25) | n/a (7) | n/a (16) | n/a (20) | n/a (20) | — | n/a (20) | n/a (15) | n/a (7) |
| Traffic fines | — | — | — | 2025-12-14 (12) | — | — | — | — | — | — |
| Schools (updatedAt) | 2026-03-18 (106) | 2026-03-18 (25) | 2026-03-17 (4) | 2026-04-09 (12) | 2026-04-01 (20) | 2026-04-01 (20) | 2026-04-24 (12) | 2026-04-01 (20) | 2026-04-10 (15) | 2026-03-31 (11) |
| School results | — | — | — | — | — | — | — | — | — | — |
| Elections (ElectionResult year) | 2024-06-01 (37) | 2024-06-01 (12) | 2024-06-01 (3) | 2024-06-01 (16) | 2024-06-01 (8) | 2024-06-01 (10) | — | 2024-06-01 (8) | 2024-06-01 (10) | 2025-06-01 (3) |
| Power outages (startTime) | 2025-03-27 (8) | 2025-03-26 (6) | — | — | — | — | — | — | — | — |
| Bus routes (no date) | n/a (56) | n/a (15) | n/a (5) | n/a (6) | n/a (8) | n/a (8) | n/a (8) | n/a (8) | n/a (8) | n/a (5) |
| Trains (no date) | n/a (6) | n/a (6) | n/a (4) | n/a (6) | n/a (10) | n/a (10) | n/a (6) | n/a (10) | n/a (8) | n/a (8) |
| Population (newest year) | 2021-01-01 (4) | 2024-01-01 (4) | 2021-01-01 (4) | 2024-01-01 (4) | 2026-01-01 (8) | 2026-01-01 (8) | 2021-01-01 (4) | 2011-01-01 (3) | 2024-01-01 (4) | 2024-01-01 (3) |
| Leaders (lastVerifiedAt) — other agent | 2026-06-06 (65) | 2026-07-12 (55) | 2026-08-09 (22) | 2026-07-29 (44) | 2026-08-11 (62) | 2026-07-18 (63) | 2026-06-08 (43) | 2026-08-18 (83) | 2026-08-22 (20) | 2026-06-22 (66) |
| JJM (updatedAt) | 2026-03-18 (4) | 2026-03-18 (7) | 2026-03-17 (7) | — | — | — | — | — | — | — |
| Housing (updatedAt) | 2026-03-18 (3) | 2026-03-18 (3) | 2026-03-17 (2) | 2026-04-10 (2) | — | — | 2026-04-24 (1) | — | — | — |
| Courts (year) | 2024-12-31 (8) | — | 2024-12-31 (11) | 2025-12-31 (3) | 2025-12-31 (5) | 2025-12-31 (5) | — | 2025-12-31 (4) | 2025-12-31 (3) | 2024-12-31 (5) |
| RTI (year-month) | 2024-01-01 (5) | — | 2024-01-01 (4) | — | — | — | — | — | — | 2024-01-01 (5) |
| Agri advisory (weekOf) | — | — | 2026-03-17 (2) | — | — | — | — | — | — | — |
| Alerts (createdAt) | 2026-07-20 (33) | 2026-08-08 (112) | 2026-08-07 (170) | 2026-09-27 (60) | 2026-09-27 (82) | 2026-09-27 (129) | 2026-06-08 (14) | 2026-09-27 (437) | 2026-08-22 (38) | 2026-06-14 (100) |
| News (publishedAt) | 2026-09-27 (48) | 2026-09-27 (49) | 2026-09-27 (50) | 2026-09-27 (50) | 2026-09-27 (50) | 2026-09-27 (48) | 2026-09-26 (50) | 2026-09-27 (49) | 2026-09-27 (49) | 2026-09-27 (50) |
| Offices (updatedAt) | 2026-03-18 (57) | 2026-03-18 (20) | 2026-03-17 (4) | 2026-04-09 (11) | 2026-04-01 (10) | 2026-04-01 (10) | 2026-04-24 (8) | 2026-04-01 (8) | 2026-04-10 (10) | 2026-03-31 (10) |

Also: `GovernmentExam` (national/state) — 95 rows, refreshed 26 Sep 2026,
only 2 open for applications. `ElectionEvent` — last edited 14 Apr 2026;
the **Tamil Nadu and West Bengal rows still show the April–May 2026
assembly elections as upcoming** (polling/result dates set, `lastHeld`
still 2021, no `nextExpected`), and `ElectionResult` has no 2026 assembly
results for Chennai or Kolkata. Health has no database module (the page
is static helplines and schemes).

### What is older than it should be

| Module | Expected | Problem |
|---|---|---|
| Crop prices | daily (mandi) | Newest 22 Jun 2026 everywhere (~3 months); Bengaluru Urban and Mysuru stop at 21 Apr 2026; Chennai has none. The mandi-price collector has not written since June. |
| Rainfall | monthly | Effectively no rainfall data: only Mysuru's hand-typed 2020–2024 rows, which the API hides. |
| Dams | daily | Fresh for the 3 Karnataka districts (today). Hyderabad, Mumbai, Pune, Chennai have city reservoirs but no dam rows. |
| Budget | yearly (Feb–Mar) | FY 2026-27 budgets are out; only Hyderabad and Pune have them. Mandya's newest is **FY 2024-25**; allocations for Bengaluru Urban and Mandya stop at FY 2024-25. |
| Power outages | live | Bengaluru Urban and Mysuru stop in **March 2025** (18 months); no other district has any. |
| Elections | after each poll | Tamil Nadu and West Bengal assembly polls (Apr–May 2026) — no results loaded, event rows still "upcoming". |
| Crime | yearly (NCRB) | Newest is 2023 for five districts; Chennai, Kolkata, Mumbai, Pune, Mysuru have none. Check whether NCRB *Crime in India 2024* is out. |
| RTI | monthly/yearly | Newest January 2024. |
| Canal releases (Mysuru) | seasonal | March 2025. |
| Agri advisory (Mandya only) | weekly | March 2026. |
| Traffic fines (Hyderabad only) | monthly | December 2025. |
| Schemes, schools, JJM, housing, offices | yearly | Seeded Mar–Apr 2026 and not refreshed since; scheme beneficiary counts have no source (Mysuru's look made up; see below). Tamil Nadu and West Bengal held assembly elections in April–May 2026, so their state-scheme lists need a re-check. |
| Alerts | daily | Bengaluru Urban last 20 Jul 2026, New Delhi 14 Jun, Pune 8 Jun, Mandya 7 Aug, Mysuru 8 Aug, Lucknow 22 Aug — the alert collector is only writing for Chennai, Hyderabad, Kolkata and Mumbai. |
| Leaders | on change | Handled by the other agent (not touched here). |
| Weather, news, exams, infrastructure | daily | Fresh. |

### Top freshness problems per district

- **Bengaluru Urban:** crop prices stop 21 Apr 2026; power outages stop Mar 2025; budget allocations FY 2024-25; alerts stop 20 Jul 2026; all 65 police numbers were invented (44 now official from the KSP directory, 21 duplicate/unknown rows deleted).
- **Mysuru:** crop prices stop 21 Apr 2026; power outages Mar 2025; canal releases Mar 2025; rainfall only hidden seed rows; scheme beneficiary counts unsourced (e.g. "Aarogyasri" is a Telangana/AP scheme name, and "Mysuru Smart City Scheme" — Mysuru is not in the Smart Cities Mission).
- **Mandya:** budget FY 2024-25 (two years old); crop prices 22 Jun 2026; agri advisory Mar 2026; only 4 schools and 4 offices.
- **Hyderabad:** crop prices 22 Jun 2026; no dam rows (Osman Sagar/Himayat Sagar); traffic fines Dec 2025.
- **Chennai:** no crop prices, no crime, no dams; election results missing the 2026 assembly poll; scheme list predates the April–May 2026 assembly election.
- **Mumbai:** crop prices 22 Jun 2026; no dams (the seven lakes), no crime rows.
- **Pune:** crop prices 22 Jun 2026; no elections, crime or dams; alerts stop 8 Jun 2026; offices have no phone numbers.
- **Kolkata:** crop prices 22 Jun 2026; no crime rows; 2026 assembly results missing; scheme list predates the 2026 assembly election; Writers' Building still listed as an office.
- **Lucknow:** crop prices 22 Jun 2026; alerts stop 22 Aug; all police numbers were invented (now hidden).
- **New Delhi:** crop prices 22 Jun 2026; alerts stop 14 Jun 2026; RTI Jan 2024.

### Current official figures added to the fix script

Only one figure could be confirmed on an official page today (web
search was exhausted): **Mudra loan ceiling ₹20 lakh** (Tarun Plus) on the
Mumbai "PMMY" scheme row, which said ₹10 lakh —
[mudra.org.in](https://www.mudra.org.in/). Dam storage is already written
daily by the scrape-dams cron (today's readings present), so nothing was
hand-entered there.

**Scheme rows left alone (unverified):** PMAY-U amounts (₹2.67 lakh is the
old CLSS subsidy that closed in 2022; PMAY-U 2.0 has different amounts —
the guideline PDF could not be read); Delhi "Pink Pass" (reported replaced
by a Saheli smart card in 2025 — not confirmed); every `beneficiaryCount`
(none has a source).

