/**
 * Maharashtra MPI — find where district names sit adjacent to values.
 *
 * The Overview table gives us 6 × 36 raw numbers but no name-to-value map.
 * The district bar chart elsewhere in the chapter pairs names with values.
 * This probe locates that pairing.
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-maharashtra-barchart.ts
 */

import { readFileSync } from "fs";

const text = readFileSync("scripts/data-pdfs/maharashtra-mpi-section.txt", "utf-8");
console.log(`Section file length: ${text.length}`);

// Search Mumbai Suburban before plain Mumbai so positions don't conflate.
const ANCHORS = [
  "Yavatmal",
  "Nandurbar",
  "Gadchiroli",
  "Mumbai Suburban",
  "Mumbai",
  "Nashik",
  "Pune",
  "Palghar",
];

for (const name of ANCHORS) {
  const positions: number[] = [];
  let idx = 0;
  while ((idx = text.indexOf(name, idx)) !== -1) {
    positions.push(idx);
    idx += name.length;
  }
  console.log(`\n=== "${name}" (${positions.length} occurrences) ===`);
  positions.forEach((pos, i) => {
    const ctx = text
      .slice(Math.max(0, pos - 100), pos + 200)
      .replace(/\s+/g, " ");
    console.log(`  [${i + 1}] pos=${pos}: ${ctx}`);
  });
}

// Look for patterns like "DistrictName XX.XX" in the same text run.
console.log("\n=== Looking for patterns like 'DistrictName XX.XX' (up to 40 hits) ===");
const pattern = /(Nandurbar|Gadchiroli|Mumbai|Yavatmal|Nashik|Pune|Palghar)[\s\S]{0,30}?(\d+\.\d{2})/g;
let m: RegExpExecArray | null;
let count = 0;
while ((m = pattern.exec(text)) !== null && count < 40) {
  console.log(`  ${m[1]} → ${m[2]}  (at pos ${m.index})`);
  count++;
}

// User's requested 250000-253000 slice — section file is only 60000 chars, so empty.
// Reporting verbatim as spec'd; see my follow-up dump below for the useful range.
console.log("\n=== 3000 chars after position 250000 (section is only 60000 chars — will be empty) ===");
console.log(text.slice(250000, 253000).replace(/\s+/g, " "));

// Supplemental: dump content AFTER the Overview table ends (~4100 chars, state
// snapshot etc.) to see if a district bar chart appears later in the chapter.
console.log("\n=== SUPPLEMENTAL: chars 4200-9000 of section (post-table, within Maharashtra chapter) ===");
console.log(text.slice(4200, 9000).replace(/\s+/g, " "));

console.log("\n=== SUPPLEMENTAL: chars 9000-14000 of section ===");
console.log(text.slice(9000, 14000).replace(/\s+/g, " "));
