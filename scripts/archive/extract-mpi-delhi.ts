/**
 * Delhi MPI extractor — NITI Aayog Progress Review 2023.
 *
 * Sibling to scripts/extract-mpi-barchart-full.ts (Karnataka) and
 * scripts/extract-mpi-maharashtra.ts. Delhi is a Union Territory (code 07)
 * so it sits in the UT chapter cluster, not the state chapters.
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-delhi.ts
 */

import { PDFParse } from "pdf-parse";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const buf = readFileSync("scripts/data-pdfs/niti-mpi-2023.pdf");
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const text = result.text;

  console.log(`Total text length: ${text.length}`);
  console.log("");

  const markers: Array<RegExp> = [
    /Delhi[\s\S]{0,50}?(Central Delhi|New Delhi|Shahdara)/,
    /NCT of Delhi/i,
    /Delhi:\s*Overview/i,
    /07\s+Delhi/,
    /DELHI[\s\S]{0,80}?Overview/,
  ];

  let start = -1;
  for (const re of markers) {
    const m = text.match(re);
    if (m && m.index !== undefined) {
      start = m.index;
      console.log(`Found marker: ${re} at position ${start}`);
      break;
    }
  }

  if (start === -1) {
    console.log("Could not locate Delhi section. Probing name positions:");
    for (const d of [
      "Central Delhi",
      "New Delhi",
      "Shahdara",
      "South West Delhi",
      "North East Delhi",
    ]) {
      const positions: number[] = [];
      let i = 0;
      while ((i = text.indexOf(d, i)) !== -1) {
        positions.push(i);
        i += d.length;
      }
      console.log(
        `  "${d}": ${positions.length} occurrences at ${positions.slice(0, 5).join(", ")}${positions.length > 5 ? "…" : ""}`,
      );
    }
    process.exit(1);
  }

  const section = text.slice(start, start + 50000);
  writeFileSync("scripts/data-pdfs/delhi-mpi-section.txt", section);
  console.log(`\nWrote ${section.length} chars → delhi-mpi-section.txt`);

  // Dump first 5000 chars — Maharashtra's Overview table lived there, likely
  // same layout for Delhi.
  console.log(`\n--- First 5000 chars of Delhi section (whitespace-normalised) ---`);
  console.log(section.slice(0, 5000).replace(/\s+/g, " "));

  // Numeric roll-up for the first 5000-char window.
  const numberPattern = /\b\d{1,2}\.\d{2}\b/g;
  const firstChunk = section.slice(0, 5000);
  const nums = firstChunk.match(numberPattern) || [];
  console.log(`\n--- Numeric tokens in first 5000 chars: ${nums.length} ---`);
  console.log(nums.join(", "));
  console.log(
    `\nExpected if all 11 districts have full pairs: 11 × 2 × 3 = 66.`,
  );
  console.log(
    `Expected if Shahdara + South East Delhi missing from 2015-16: 9 × 3 + 11 × 3 = 60.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
