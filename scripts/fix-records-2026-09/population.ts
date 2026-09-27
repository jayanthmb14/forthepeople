/**
 * PopulationHistory fixes (checked 27 Sep 2026). Rule: verified or hidden.
 *
 * No census was held in 2021: it was postponed (COVID-19) and became
 * Census 2027 — house-listing ran April–September 2026, reference date
 * 00:00 on 1 March 2027 (PIB, 25 Apr 2026). So any "2021 Census" row is
 * not a census figure, and the post-2011 projections have no official
 * source (the RGI's Technical Group projections are state-level only):
 * they are deleted. The overview "Population" tile reads the newest
 * "Census of India…" row, so the Mandya and Bengaluru 2021 rows were being
 * shown as census counts.
 *
 * Census 2011 and 2001 rows are set to the Census figures (population,
 * sex ratio, literacy, density; urban share for 2011) as reproduced by
 * census2011.co.in from the Primary Census Abstract. Mumbai is Greater
 * Mumbai = Mumbai City + Mumbai Suburban districts. Rows before 2001 could
 * not be checked against any readable source and are deleted.
 */
import type { Fix } from "./types";

const CHECKED = "2026-09-27";

export const POPULATION_FIXES: Fix[] = [
  {
    table: "PopulationHistory", id: "cmmvn6m3h002xmuxnqudtnsg8", op: "delete",
    label: "Bengaluru Urban · 1991 (Census of India) — 4,130,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn6m3h002ymuxndb7npive", op: "update",
    label: "Bengaluru Urban · 2001 (Census of India)",
    set: { literacy: 82.96, urbanPct: null, density: 2985 },
    was: { literacy: 83, urbanPct: 95.5, density: 8821 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 83 → 82.96, density 8821 → 2985. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/242-bangalore.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn6m3i002zmuxng0v2pd50", op: "update",
    label: "Bengaluru Urban · 2011 (Census of India)",
    set: { literacy: 87.67, urbanPct: 90.94, density: 4381 },
    was: { literacy: 88.48, urbanPct: 97.4, density: 12988 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 88.48 → 87.67, urbanPct 97.4 → 90.94, density 12988 → 4381.",
    source: "https://www.census2011.co.in/census/district/242-bangalore.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn6m3i0030muxnwe9vae39", op: "delete",
    label: "Bengaluru Urban · 2021 row 'Census of India (Projected)' (12,765,000)",
    why: "Hidden: unverifiable. Labelled as a census but no 2021 census was held; no official district projection backs the number. It was shown as the census population on the overview.",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001m51xnh2vexab5", op: "delete",
    label: "Chennai · 1951 (Census of India 1951) — 1,416,056",
    why: "Hidden: unverifiable. No official or reputed page for the 1951 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001n51xng3apd9tm", op: "delete",
    label: "Chennai · 1961 (Census of India 1961) — 1,729,141",
    why: "Hidden: unverifiable. No official or reputed page for the 1961 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001o51xn3yfg3wj0", op: "delete",
    label: "Chennai · 1971 (Census of India 1971) — 2,469,449",
    why: "Hidden: unverifiable. No official or reputed page for the 1971 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001p51xnj6hqrqsc", op: "delete",
    label: "Chennai · 1981 (Census of India 1981) — 3,276,622",
    why: "Hidden: unverifiable. No official or reputed page for the 1981 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001q51xnced1ni4g", op: "delete",
    label: "Chennai · 1991 (Census of India 1991) — 3,841,396",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001r51xnjdxu77ij", op: "update",
    label: "Chennai · 2001 (Census of India 2001)",
    set: { sexRatio: 957, density: 24963 },
    was: { sexRatio: 948, density: 10197 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 948 → 957, density 10197 → 24963.",
    source: "https://www.census2011.co.in/census/district/21-chennai.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001s51xn9dsiwfwr", op: "update",
    label: "Chennai · 2011 (Census of India 2011)",
    set: { sexRatio: 989, literacy: 90.18, density: 26553 },
    was: { sexRatio: 951, literacy: 90.33, density: 10908 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 951 → 989, literacy 90.33 → 90.18, density 10908 → 26553.",
    source: "https://www.census2011.co.in/census/district/21-chennai.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001t51xn9y0a1jik", op: "delete",
    label: "Chennai · 2026 'Estimate — Chennai Metropolitan Area' (11,500,000)",
    why: "Hidden: unverifiable. A metropolitan-area guess plotted on the Chennai district chart (district was 4,646,732 in 2011); no source.",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdrbym0000nfxnklzagpqt", op: "delete",
    label: "Hyderabad · 1991 (Census of India 1991) — 3,145,939",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdrbym0001nfxnhjb2lt0o", op: "update",
    label: "Hyderabad · 2001 (Census of India 2001)",
    set: { population: 3829753, sexRatio: 933, urbanPct: null, density: 17649 },
    was: { population: 3637834, sexRatio: 943, urbanPct: 100, density: 16763 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 3637834 → 3829753, sexRatio 943 → 933, density 16763 → 17649. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/122-hyderabad.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdrbym0003nfxnwgn7cu9w", op: "delete",
    label: "Hyderabad · 2024 'Projected estimate based on Census 2011 growth rate' (4,500,000)",
    why: "Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB).",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3nsm001n4exnm8e4wr2y", op: "delete",
    label: "Kolkata · 1991 (Census of India 1991) — 4,399,819",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3nsm001m4exni2iin8x3", op: "update",
    label: "Kolkata · 2001 (Census of India 2001)",
    set: { sexRatio: 829, literacy: 80.86, urbanPct: null, density: 24718 },
    was: { sexRatio: 828, literacy: 81.31, urbanPct: 100, density: 24760 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 828 → 829, literacy 81.31 → 80.86, density 24760 → 24718. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/16-kolkata.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3nsm001l4exnvhnd3s59", op: "update",
    label: "Kolkata · 2011 (Census of India 2011)",
    set: { population: 4496694, sexRatio: 908, literacy: 86.31, density: 24306 },
    was: { population: 4486679, sexRatio: 899, literacy: 87.14, density: 24252 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: population 4486679 → 4496694, sexRatio 899 → 908, literacy 87.14 → 86.31, density 24252 → 24306.",
    source: "https://www.census2011.co.in/census/district/16-kolkata.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdqw6y003zlnxnjdz4b2xh", op: "delete",
    label: "Lucknow · 1991 (Census of India 1991) — 1,669,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdqw6y0040lnxndreudp1d", op: "update",
    label: "Lucknow · 2001 (Census of India 2001)",
    set: { population: 3647834, sexRatio: 888, literacy: 68.71, density: 1443 },
    was: { population: 2185927, sexRatio: 893, literacy: 74.1, density: null },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 2185927 → 3647834, sexRatio 893 → 888, literacy 74.1 → 68.71, density None → 1443.",
    source: "https://www.census2011.co.in/census/district/528-lucknow.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdqw6y0041lnxns7kbbhpb", op: "update",
    label: "Lucknow · 2011 (Census of India 2011)",
    set: { literacy: 77.29, urbanPct: 66.21, density: 1816 },
    was: { literacy: 79.33, urbanPct: null, density: null },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: literacy 79.33 → 77.29, urbanPct None → 66.21, density None → 1816.",
    source: "https://www.census2011.co.in/census/district/528-lucknow.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdqw6y0042lnxnoso2316b", op: "delete",
    label: "Lucknow · 2024 'Estimate — Lucknow District Administration (lucknow.nic.in)' (5,200,000)",
    why: "Hidden: unverifiable. lucknow.nic.in's demography page gives no 2024 estimate or 5.2 million figure; no official district projection exists.",
    source: "https://lucknow.nic.in/demography/", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmv9n874001vubxna38zo9kv", op: "delete",
    label: "Mandya · 1991 (Census of India) — 1,282,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmv9n88r001wubxny32398qx", op: "update",
    label: "Mandya · 2001 (Census of India)",
    set: { population: 1763705, sexRatio: 986, literacy: 61.05, urbanPct: null, density: 356 },
    was: { population: 1513000, sexRatio: 980, literacy: 65.9, urbanPct: 22, density: 304.9 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 1513000 → 1763705, sexRatio 980 → 986, literacy 65.9 → 61.05, density 304.9 → 356. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/262-mandya.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmv9n8ad001xubxngic6s6f6", op: "update",
    label: "Mandya · 2011 (Census of India)",
    set: { population: 1805769, sexRatio: 995, literacy: 70.4, urbanPct: 17.08, density: 364 },
    was: { population: 1940428, sexRatio: 982, literacy: 72.8, urbanPct: 27.3, density: 391.2 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: population 1940428 → 1805769, sexRatio 982 → 995, literacy 72.8 → 70.4, urbanPct 27.3 → 17.08, density 391.2 → 364.",
    source: "https://www.census2011.co.in/census/district/262-mandya.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmv9n8bx001yubxn6w6oe4wc", op: "delete",
    label: "Mandya · 2021 row labelled 'Census of India' (2,180,000)",
    why: "Hidden: unverifiable. No census was held in 2021 (postponed; now Census 2027, reference date 1 Mar 2027). The number is not an official projection.",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx001x3rxn72vkj1v6", op: "delete",
    label: "Mumbai · 1951 (Census of India 1951) — 2,994,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1951 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx001y3rxnrnkc1h33", op: "delete",
    label: "Mumbai · 1961 (Census of India 1961) — 4,152,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1961 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx001z3rxn8pfrzlhy", op: "delete",
    label: "Mumbai · 1971 (Census of India 1971) — 5,971,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1971 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00203rxngx5myt8j", op: "delete",
    label: "Mumbai · 1981 (Census of India 1981) — 8,243,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1981 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00213rxnz1gqhim9", op: "delete",
    label: "Mumbai · 1991 (Census of India 1991) — 9,926,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00223rxni7o6z5j5", op: "update",
    label: "Mumbai · 2001 (Census of India 2001)",
    set: { sexRatio: 809, literacy: null, density: 19865 },
    was: { sexRatio: 822, literacy: 86.4, density: 19864 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 822 → 809, density 19864 → 19865. Hidden: unverifiable — literacy (not given for 2001 by the source or not computable for Greater Mumbai without the child population).",
    source: "https://www.census2011.co.in/census/district/357-mumbai-city.html + https://www.census2011.co.in/census/district/356-mumbai-suburban.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00233rxnjv3veq9k", op: "update",
    label: "Mumbai · 2011 (Census of India 2011)",
    set: { sexRatio: 853, literacy: null },
    was: { sexRatio: 832, literacy: 89.73 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 832 → 853. Hidden: unverifiable — literacy (not given for 2011 by the source or not computable for Greater Mumbai without the child population).",
    source: "https://www.census2011.co.in/census/district/357-mumbai-city.html + https://www.census2011.co.in/census/district/356-mumbai-suburban.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00243rxnixnom05c", op: "delete",
    label: "Mumbai · 2026 'Estimate — Mumbai Metropolitan Region' (21,000,000)",
    why: "Hidden: unverifiable. A metropolitan-region guess (with made-up sex ratio and literacy) stored under the Mumbai district; no source. The API already hides it.",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn75yl00m0muxnzfwtxx1f", op: "delete",
    label: "Mysuru · 1991 (Census of India) — 2,388,000",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn75yl00m1muxn0773fr1h", op: "update",
    label: "Mysuru · 2001 (Census of India)",
    set: { population: 2641027, sexRatio: 964, literacy: 63.48, urbanPct: null, density: 385 },
    was: { population: 2624900, sexRatio: 975, literacy: 66, urbanPct: 41.1, density: 383 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 2624900 → 2641027, sexRatio 975 → 964, literacy 66 → 63.48, density 383 → 385. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/263-mysore.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn75yl00m2muxnwbbe2ms1", op: "update",
    label: "Mysuru · 2011 (Census of India)",
    set: { sexRatio: 985, literacy: 72.79, urbanPct: 41.5, density: 476 },
    was: { sexRatio: 984, literacy: 72.6, urbanPct: 43.8, density: 438 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 984 → 985, literacy 72.6 → 72.79, urbanPct 43.8 → 41.5, density 438 → 476.",
    source: "https://www.census2011.co.in/census/district/263-mysore.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn75yl00m3muxnu3ffbk0m", op: "delete",
    label: "Mysuru · 2024 'Projected estimate' (3,248,000)",
    why: "Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB).",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnf0ij5k0000y8xncyubr4o1", op: "update",
    label: "New Delhi · 2001 (Census of India)",
    set: { population: 179112, sexRatio: 792, literacy: 83.24, urbanPct: null, density: 5117 },
    was: { population: 171806, sexRatio: 866, literacy: 85.2, urbanPct: 100, density: 4909 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: population 171806 → 179112, sexRatio 866 → 792, literacy 85.2 → 83.24, density 4909 → 5117. Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/172-new-delhi.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnf0ij5k0001y8xnywu01wjv", op: "update",
    label: "New Delhi · 2011 (Census of India)",
    set: { sexRatio: 822, literacy: 88.34 },
    was: { sexRatio: 902, literacy: 89.38 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: sexRatio 902 → 822, literacy 89.38 → 88.34.",
    source: "https://www.census2011.co.in/census/district/172-new-delhi.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnf0ij5k0002y8xn27ljcp2d", op: "delete",
    label: "New Delhi · 2024 'Projected estimate' (150,000)",
    why: "Hidden: unverifiable. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB).",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmod02jy70000jjxnklq8qn1k", op: "delete",
    label: "Pune · 1991 (Census of India 1991) — 5,532,532",
    why: "Hidden: unverifiable. No official or reputed page for the 1991 district figure could be read (the Census DCHB PDFs would not open for the checker); several pre-2001 seed values were wrong (Mandya 1991 12.8 lakh vs 16.4 lakh in the Census, Lucknow 1991 was a city figure), so none is kept unconfirmed.",
    source: "none — see docs/DATA-FIXES-2026-09.md §2", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmod02k2s0001jjxntsj109m5", op: "update",
    label: "Pune · 2001 (Census of India 2001)",
    set: { urbanPct: null },
    was: { urbanPct: 58.1 },
    why: "Census 2001 values from the Primary Census Abstract as reproduced by census2011.co.in: . Hidden: unverifiable — urbanPct (not given for 2001 by the source).",
    source: "https://www.census2011.co.in/census/district/359-pune.html (Census of India 2001 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmod02k5s0002jjxntdbt4rzy", op: "update",
    label: "Pune · 2011 (Census of India 2011)",
    set: { urbanPct: 60.99 },
    was: { urbanPct: 60.9 },
    why: "Census 2011 values from the Primary Census Abstract as reproduced by census2011.co.in: urbanPct 60.9 → 60.99.",
    source: "https://www.census2011.co.in/census/district/359-pune.html (Census of India 2011 figures)", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmod02k8s0003jjxnkagn6qan", op: "delete",
    label: "Pune · 2021 'Maharashtra State Evaluation Committee estimate' (10,800,000)",
    why: "Hidden: unverifiable. No such official estimate could be found; 2021 has no census. No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. Census 2027 reference date is 1 Mar 2027 (PIB).",
    source: "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3", checked: CHECKED,
  },
];
