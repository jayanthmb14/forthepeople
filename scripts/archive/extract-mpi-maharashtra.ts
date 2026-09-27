/**
 * Maharashtra MPI extractor — NITI Aayog Progress Review 2023.
 *
 * Sibling to scripts/extract-mpi-barchart-full.ts (which handled Karnataka).
 * Same PDF, different state chapter. Karnataka sat around page 132; Maharashtra
 * will be at a different position in the same per-state appendix pattern.
 *
 * Sanity anchor from NITI's state snapshot box:
 *   Maharashtra H total 2015-16 = 14.80
 *   Maharashtra H total 2019-21 =  7.81
 * The per-district extraction must produce a weighted state average near 7.81.
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-maharashtra.ts
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

  // Try a few anchor patterns for the Maharashtra section.
  const markers: Array<RegExp> = [
    /Maharashtra[\s\S]{0,50}?(Ahmadnagar|Akola|Amravati)/,
    /27\s+Maharashtra/,
    /State\s*:\s*Maharashtra/i,
    /MAHARASHTRA[\s\S]{0,80}?Overview/,
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
    console.log("Could not locate Maharashtra section.");
    console.log("Probing district-name positions across full document:");
    for (const d of [
      "Ahmadnagar",
      "Ahmednagar",
      "Aurangabad",
      "Mumbai",
      "Pune",
      "Nashik",
      "Nagpur",
      "Thane",
      "Nandurbar",
      "Gadchiroli",
    ]) {
      console.log(`  ${d}: first hit at ${text.indexOf(d)}`);
    }
    process.exit(1);
  }

  // Grab a wide window — Maharashtra has 36 districts so the chapter spans
  // more pages than Karnataka's 30-district chapter.
  const section = text.slice(start, start + 60000);
  writeFileSync("scripts/data-pdfs/maharashtra-mpi-section.txt", section);
  console.log(`\nWrote ${section.length} chars → maharashtra-mpi-section.txt`);

  // Context probes around districts-of-interest.
  const SAMPLES = ["Mumbai", "Nandurbar", "Pune", "Gadchiroli"];
  for (const d of SAMPLES) {
    const idx = text.indexOf(d, start);
    if (idx === -1) {
      console.log(`\n  ${d}: not found in the Maharashtra window`);
      continue;
    }
    const ctx = text.slice(Math.max(0, idx - 60), idx + 400).replace(/\s+/g, " ");
    console.log(`\n--- ${d} context (pos ${idx}) ---`);
    console.log(ctx);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
