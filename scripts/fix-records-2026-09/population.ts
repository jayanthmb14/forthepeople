/**
 * PopulationHistory fixes (checked 27 Sep 2026).
 *
 * No census was held in 2021: it was postponed (COVID-19) and became
 * Census 2027 — house-listing ran April–September 2026, reference date
 * 00:00 on 1 March 2027 (PIB, 25 Apr 2026). So any "2021 Census" row is
 * not a census figure. The post-2011 rows below are projections with no
 * official source (the RGI's Technical Group projections are state-level,
 * not district-level), so they go. The overview "Population" tile reads
 * the newest "Census of India…" row, so the Mandya and Bengaluru 2021 rows
 * were being shown as census counts.
 */
import type { Fix } from "./types";

const CHECKED = "2026-09-27";
const CENSUS_2027 = "https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158344&ModuleId=3";
const NO_OFFICIAL_PROJECTION =
  "No official district-level projection exists (the RGI Technical Group projects states only); the row has no source. " +
  "Census 2027 reference date is 1 Mar 2027 (PIB).";

export const POPULATION_FIXES: Fix[] = [
  // ── Rows labelled as a 2021 census that never happened ──
  {
    table: "PopulationHistory", id: "cmmv9n8bx001yubxn6w6oe4wc", op: "delete",
    label: "Mandya · 2021 row labelled 'Census of India' (2,180,000)",
    why: "No census was held in 2021 (postponed; now Census 2027, reference date 1 Mar 2027). The number is not an official projection.",
    source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn6m3i0030muxnwe9vae39", op: "delete",
    label: "Bengaluru Urban · 2021 row 'Census of India (Projected)' (12,765,000)",
    why: "Labelled as a census but no 2021 census was held; no official district projection backs the number. It was shown as the census population on the overview.",
    source: CENSUS_2027, checked: CHECKED,
  },
  // ── Unsourced projections shown on the population chart ──
  {
    table: "PopulationHistory", id: "cmntdrbym0003nfxnwgn7cu9w", op: "delete",
    label: "Hyderabad · 2024 'Projected estimate based on Census 2011 growth rate' (4,500,000)",
    why: NO_OFFICIAL_PROJECTION, source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn75yl00m3muxnu3ffbk0m", op: "delete",
    label: "Mysuru · 2024 'Projected estimate' (3,248,000)",
    why: NO_OFFICIAL_PROJECTION, source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnf0ij5k0002y8xn27ljcp2d", op: "delete",
    label: "New Delhi · 2024 'Projected estimate' (150,000)",
    why: NO_OFFICIAL_PROJECTION, source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmntdqw6y0042lnxnoso2316b", op: "delete",
    label: "Lucknow · 2024 'Estimate — Lucknow District Administration (lucknow.nic.in)' (5,200,000)",
    why: "lucknow.nic.in's demography page gives no 2024 estimate or 5.2 million figure; no official district projection exists.",
    source: "https://lucknow.nic.in/demography/", checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmod02k8s0003jjxnkagn6qan", op: "delete",
    label: "Pune · 2021 'Maharashtra State Evaluation Committee estimate' (10,800,000)",
    why: "No such official estimate could be found; 2021 has no census. " + NO_OFFICIAL_PROJECTION,
    source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3rk2001t51xn9y0a1jik", op: "delete",
    label: "Chennai · 2026 'Estimate — Chennai Metropolitan Area' (11,500,000)",
    why: "A metropolitan-area guess plotted on the Chennai district chart (district was 4,646,732 in 2011); no source.",
    source: CENSUS_2027, checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmnfm3fxx00243rxnixnom05c", op: "delete",
    label: "Mumbai · 2026 'Estimate — Mumbai Metropolitan Region' (21,000,000)",
    why: "A metropolitan-region guess (with made-up sex ratio and literacy) stored under the Mumbai district; no source. The API already hides it.",
    source: CENSUS_2027, checked: CHECKED,
  },

  // ── Census 2011 rows with wrong numbers ──
  {
    table: "PopulationHistory", id: "cmmv9n8ad001xubxngic6s6f6", op: "update",
    label: "Mandya · Census 2011 row",
    set: { population: 1805769, sexRatio: 995, literacy: 70.4, urbanPct: 17.08, density: 364 },
    was: { population: 1940428, sexRatio: 982, literacy: 72.8, urbanPct: 27.3, density: 391.2 },
    why: "Census 2011 counted 18,05,769 people in Mandya (9,05,085 men, 9,00,684 women; 3,08,362 urban), not 19,40,428; sex ratio, literacy, urban share and density were also off.",
    source:
      "https://censusindia.gov.in/nada/index.php/catalog/625 (District Census Handbook Mandya 2011; PDF not machine-readable here) — figures as reproduced at https://www.census2011.co.in/census/district/262-mandya.html",
    checked: CHECKED,
  },
  {
    table: "PopulationHistory", id: "cmmvn6m3i002zmuxng0v2pd50", op: "update",
    label: "Bengaluru Urban · Census 2011 row",
    set: { literacy: 87.67, urbanPct: 90.94, density: 4381 },
    was: { literacy: 88.48, urbanPct: 97.4, density: 12988 },
    why: "Density 12,988/km² and 97.4% urban are impossible for a 2,196 km² district of 96.2 lakh people; Census 2011 gives 4,381/km², 90.94% urban, literacy 87.67%.",
    source:
      "https://censusindia.gov.in/2011census/dchb/2918_PART_A_DCHB_BANGALORE.pdf (DCHB Bangalore Part A) — figures as reproduced at https://www.census2011.co.in/census/district/242-bangalore.html",
    checked: CHECKED,
  },
];
