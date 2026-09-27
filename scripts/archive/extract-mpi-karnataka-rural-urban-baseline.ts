/**
 * Karnataka rural/urban 2015-16 baseline extractor.
 *
 * Fills the gap: Karnataka's initial seed only loaded Total+Rural+Urban for
 * 2019-21 and Total-only for 2015-16. The PDF's state snapshot box should
 * contain the Rural 2015-16 and Urban 2015-16 triples too (same layout as
 * the 4 states just seeded).
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-karnataka-rural-urban-baseline.ts
 */

import { PDFParse } from "pdf-parse";
import { readFileSync } from "fs";

async function main() {
  const buf = readFileSync("scripts/data-pdfs/niti-mpi-2023.pdf");
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const text = result.text;

  const markers = ["KARNATAKA MPI", "Karnataka:"];
  let startPos = -1;
  for (const m of markers) {
    const idx = text.indexOf(m);
    if (idx !== -1 && (startPos === -1 || idx < startPos)) startPos = idx;
  }

  if (startPos === -1) {
    console.log("Karnataka not found");
    process.exit(1);
  }

  console.log(`Karnataka state snapshot at position ${startPos}`);
  const section = text.slice(startPos, startPos + 5000);

  console.log("\n--- First 3000 chars (whitespace-normalised) ---");
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
