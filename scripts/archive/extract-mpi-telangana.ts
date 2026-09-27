/**
 * Telangana state MPI extractor — NITI Aayog Progress Review 2023.
 *
 * State-level snapshot box only (district-level deferred due to 2016
 * Telangana reorganization — 5 DB slugs are pre-reorg units).
 *
 * Anchor: Telangana total 2019-21 H ≈ 5.88% per NITI state summary refs.
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-telangana.ts
 */

import { PDFParse } from "pdf-parse";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const buf = readFileSync("scripts/data-pdfs/niti-mpi-2023.pdf");
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const text = result.text;

  const markers = ["TELANGANA MPI", "Telangana:"];
  let startPos = -1;
  for (const m of markers) {
    const idx = text.indexOf(m);
    if (idx !== -1 && (startPos === -1 || idx < startPos)) startPos = idx;
  }

  if (startPos === -1) {
    console.log("Telangana marker not found. Probing district names:");
    for (const d of ["Hyderabad", "Warangal", "Karimnagar", "Khammam", "Nizamabad"]) {
      const idx = text.indexOf(d);
      console.log(`  ${d}: first occurrence at ${idx}`);
    }
    process.exit(1);
  }

  console.log(`Telangana state snapshot at position ${startPos}`);
  const section = text.slice(startPos, startPos + 5000);
  writeFileSync("scripts/data-pdfs/telangana-mpi-window.txt", section);

  console.log(`\n--- First 3000 chars (whitespace-normalised) ---`);
  console.log(section.slice(0, 3000).replace(/\s+/g, " "));

  const twoDecimal = section.match(/\b\d{1,2}\.\d{2}\b/g) || [];
  console.log(`\n--- First 30 two-decimal numbers ---`);
  console.log(twoDecimal.slice(0, 30).join(", "));

  const threeDecimal = section.match(/\b0\.\d{3}\b/g) || [];
  console.log(`\n--- First 15 three-decimal MPI numbers ---`);
  console.log(threeDecimal.slice(0, 15).join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
