/**
 * ForThePeople.in — Seed ElectionEvent table with confirmed dates.
 * Run: npx tsx scripts/seed-election-events.ts [--dry-run]
 *
 * Idempotent: matches existing rows by (type, state, label) and
 * updates them. Live elections (TN + WB 2026) are seeded with exact
 * polling and result dates announced by ECI.
 */

import "./_env";
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DRY_RUN = process.argv.includes("--dry-run");

interface Seed {
  type: string;
  label: string;
  state?: string | null;
  lastHeld?: Date | null;
  pollingDate?: Date | null;
  pollingPhases?: string | null;
  resultDate?: Date | null;
  nextExpected?: Date | null;
  termYears?: number;
  totalSeats?: number | null;
  body?: string;
  note?: string | null;
  source?: string | null;
  isActive?: boolean;
}

const SEEDS: Seed[] = [
  // ── National ────────────────────────────────────────────
  {
    type: "LOK_SABHA",
    label: "Lok Sabha (General Election)",
    state: null,
    lastHeld: new Date("2024-06-04"),
    nextExpected: new Date("2029-05-01"),
    termYears: 5,
    totalSeats: 543,
    body: "Election Commission of India",
    note: "Subject to early dissolution.",
    isActive: true,
  },

  // ── Tamil Nadu — LIVE 2026 ──────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Tamil Nadu Vidhan Sabha Election 2026",
    state: "tamil-nadu",
    lastHeld: new Date("2021-04-06"),
    pollingDate: new Date("2026-04-23"),
    pollingPhases: JSON.stringify([{ phase: 1, date: "2026-04-23" }]),
    resultDate: new Date("2026-05-04"),
    totalSeats: 234,
    body: "Election Commission of India",
    source: "https://eci.gov.in",
    note: "Single phase polling. ECI announced 15 March 2026.",
    isActive: true,
  },

  // ── West Bengal — LIVE 2026 ─────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "West Bengal Vidhan Sabha Election 2026",
    state: "west-bengal",
    lastHeld: new Date("2021-04-27"),
    pollingDate: new Date("2026-04-23"),
    pollingPhases: JSON.stringify([
      { phase: 1, date: "2026-04-23" },
      { phase: 2, date: "2026-04-29" },
    ]),
    resultDate: new Date("2026-05-04"),
    totalSeats: 294,
    body: "Election Commission of India",
    source: "https://eci.gov.in",
    note: "Two-phase polling. Phase 1: 23 Apr, Phase 2: 29 Apr.",
    isActive: true,
  },

  // ── Karnataka ───────────────────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Karnataka Vidhan Sabha",
    state: "karnataka",
    lastHeld: new Date("2023-05-10"),
    nextExpected: new Date("2028-05-01"),
    termYears: 5,
    totalSeats: 224,
    body: "Election Commission of India",
    isActive: true,
  },

  // ── Maharashtra ─────────────────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Maharashtra Vidhan Sabha",
    state: "maharashtra",
    lastHeld: new Date("2024-11-20"),
    nextExpected: new Date("2029-11-01"),
    termYears: 5,
    totalSeats: 288,
    body: "Election Commission of India",
    isActive: true,
  },

  // ── Telangana ───────────────────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Telangana Vidhan Sabha",
    state: "telangana",
    lastHeld: new Date("2023-11-30"),
    nextExpected: new Date("2028-11-01"),
    termYears: 5,
    totalSeats: 119,
    body: "Election Commission of India",
    isActive: true,
  },

  // ── Delhi ───────────────────────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Delhi Vidhan Sabha",
    state: "delhi",
    lastHeld: new Date("2025-02-05"),
    nextExpected: new Date("2030-02-01"),
    termYears: 5,
    totalSeats: 70,
    body: "Election Commission of India",
    isActive: true,
  },

  // ── Uttar Pradesh ───────────────────────────────────────
  {
    type: "STATE_ASSEMBLY",
    label: "Uttar Pradesh Vidhan Sabha",
    state: "uttar-pradesh",
    lastHeld: new Date("2022-03-07"),
    nextExpected: new Date("2027-03-01"),
    termYears: 5,
    totalSeats: 403,
    body: "Election Commission of India",
    isActive: true,
  },
];

async function main() {
  console.log(`🛠  Seeding ElectionEvent ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  let created = 0, updated = 0;
  for (const s of SEEDS) {
    const existing = await prisma.electionEvent.findFirst({
      where: { type: s.type, state: s.state ?? null, label: s.label },
    });
    if (existing) {
      console.log(`⏭  UPDATE: ${s.label}`);
      if (!DRY_RUN) await prisma.electionEvent.update({ where: { id: existing.id }, data: s });
      updated++;
    } else {
      console.log(`✅ CREATE: ${s.label}`);
      if (!DRY_RUN) await prisma.electionEvent.create({ data: s });
      created++;
    }
  }
  console.log(`\nSummary: ${created} created · ${updated} updated · ${SEEDS.length} total`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
