/**
 * Maharashtra MPI — revised numeric-region extractor.
 *
 * First pass (axis-100% heuristic) landed in Manipur — the first 100.0% in the
 * section belongs to the state-level indicator chart, not the district H chart.
 * District H bar chart ends at a lower percentage scale (Karnataka: 45%;
 * Maharashtra: probably 50–60% because Nandurbar H was ~52% in 2015-16).
 *
 * New strategy: the district H bar chart's axis is a run of "0.0% 5.0% 10.0% …"
 * labels NOT ending in 100.0%. Find that axis run, then dump the region after
 * it until the next section marker (`% point change` or `MAHARASHTRA`-page-
 * footer text is the usual tail).
 */

import { readFileSync, writeFileSync } from "fs";

const text = readFileSync("scripts/data-pdfs/maharashtra-mpi-section.txt", "utf-8");

console.log(`Section file length: ${text.length}`);

// Find every "100.0%" (state-level indicator chart axis end)
const axis100Positions: number[] = [];
{
  let i = 0;
  while ((i = text.indexOf("100.0%", i)) !== -1) {
    axis100Positions.push(i);
    i += 6;
  }
}
console.log("'100.0%' positions:", axis100Positions);

// Find every "45.0%" (Karnataka-style district axis upper bound)
const axis45Positions: number[] = [];
{
  let i = 0;
  while ((i = text.indexOf("45.0%", i)) !== -1) {
    axis45Positions.push(i);
    i += 5;
  }
}
console.log("'45.0%' positions:", axis45Positions);

// Find every "50.0%" / "55.0%" / "60.0%" — possible Maharashtra district axis max
for (const s of ["50.0%", "55.0%", "60.0%", "65.0%"]) {
  const positions: number[] = [];
  let i = 0;
  while ((i = text.indexOf(s, i)) !== -1) {
    positions.push(i);
    i += s.length;
  }
  console.log(`'${s}' positions:`, positions);
}

// Dump the section between the district-name roster end (approximately where
// "Yavatmal" + "District" appears) and the first "100.0%".
const yavatmalIdx = text.indexOf("Yavatmal");
const firstDistrictHeader = text.indexOf("District", yavatmalIdx);
const first100 = axis100Positions[0] ?? text.length;

console.log(`\n'Yavatmal' at: ${yavatmalIdx}`);
console.log(`'District' header after Yavatmal at: ${firstDistrictHeader}`);
console.log(`First '100.0%' at: ${first100}`);

// Slice between Yavatmal and first 100% (this is where the district values SHOULD be)
const candidate = text.slice(yavatmalIdx, first100);
console.log(`\nCandidate slice (Yavatmal → first 100%) = ${candidate.length} chars`);

writeFileSync(
  "scripts/data-pdfs/maharashtra-mpi-candidate.txt",
  candidate,
);
console.log(`Wrote candidate slice to maharashtra-mpi-candidate.txt`);

// Count decimal numbers in the candidate region
const numberPattern = /\b\d{1,2}\.\d{2}\b/g;
const candidateMatches = candidate.match(numberPattern) || [];
console.log(`\n2-decimal numbers in candidate slice: ${candidateMatches.length}`);
console.log(`Expected: ~72 (36 districts × 2 periods)`);
console.log(
  `First 80 tokens: ${candidateMatches.slice(0, 80).join(", ")}`,
);

// Also dump the first 4000 chars of section (Maharashtra state snapshot box)
console.log(
  `\n--- First 4000 chars of section (state snapshot + beginning) ---`,
);
console.log(text.slice(0, 4000).replace(/\s+/g, " "));

console.log(`\n--- Candidate slice (all ${candidate.length} chars, whitespace-normalised) ---`);
console.log(candidate.replace(/\s+/g, " "));
