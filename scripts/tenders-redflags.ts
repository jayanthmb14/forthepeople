// Manual ops script: recompute tender red flags (src/lib/tenders/tender-redflags.ts).
// Run:  npx tsx scripts/tenders-redflags.ts   (writes TenderRedFlag rows in the
// database .env points at). Not scheduled; moved here from
// src/scraper/tender-redflag-computer.ts on 2026-09-28 — it had never run.

import "dotenv/config";
import { recomputeAllFlags } from "@/lib/tenders/tender-redflags";

export async function runRedFlagComputer(): Promise<{ processed: number; written: number }> {
  const started = Date.now();
  const result = await recomputeAllFlags();
  console.log(`[red-flags] processed=${result.processed} written=${result.written} durationMs=${Date.now() - started}`);
  return result;
}

if (typeof require !== "undefined" && require.main === module) {
  runRedFlagComputer()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
