/**
 * Batch MPI extractor for Tamil Nadu, West Bengal, Uttar Pradesh, Maharashtra.
 *
 * Same pattern as Delhi extractor: locate the state's chapter by title
 * marker, slice a 5000-char window, dump numeric tokens for manual decode.
 *
 * Run: npx tsx -r dotenv/config scripts/archive/extract-mpi-four-states.ts
 */

import { PDFParse } from "pdf-parse";
import { readFileSync, writeFileSync } from "fs";

async function main() {
  const buf = readFileSync("scripts/data-pdfs/niti-mpi-2023.pdf");
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  const text = result.text;

  const STATES = [
    { slug: "tamil-nadu", titleMarkers: ["TAMIL NADU MPI", "Tamil Nadu:"] },
    { slug: "west-bengal", titleMarkers: ["WEST BENGAL MPI", "West Bengal:"] },
    { slug: "uttar-pradesh", titleMarkers: ["UTTAR PRADESH MPI", "Uttar Pradesh:"] },
    { slug: "maharashtra", titleMarkers: ["MAHARASHTRA MPI", "Maharashtra:"] },
  ];

  for (const s of STATES) {
    console.log("\n========================================");
    console.log(`  ${s.slug.toUpperCase()}`);
    console.log("========================================");

    let startPos = -1;
    for (const marker of s.titleMarkers) {
      const idx = text.indexOf(marker);
      if (idx !== -1 && (startPos === -1 || idx < startPos)) {
        startPos = idx;
      }
    }

    if (startPos === -1) {
      console.log(`  ⚠️  No title marker found`);
      continue;
    }

    console.log(`  Start position: ${startPos}`);

    const section = text.slice(startPos, startPos + 5000);
    writeFileSync(`scripts/data-pdfs/${s.slug}-mpi-window.txt`, section);

    console.log("\n  --- First 3000 chars (whitespace-normalised) ---");
    console.log(section.slice(0, 3000).replace(/\s+/g, " "));

    const twoDecimal = section.match(/\b\d{1,2}\.\d{2}\b/g) || [];
    const threeDecimal = section.match(/\b0\.\d{3}\b/g) || [];

    console.log(
      `\n  --- 2-decimal numbers (${twoDecimal.length} total, first 30) ---`,
    );
    console.log(twoDecimal.slice(0, 30).join(", "));

    console.log(
      `\n  --- 3-decimal MPI numbers (${threeDecimal.length} total, first 15) ---`,
    );
    console.log(threeDecimal.slice(0, 15).join(", "));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
