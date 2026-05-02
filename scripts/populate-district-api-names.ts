/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════
// Script: Populate owmCityName + agmarknetName for existing districts
//
// Run once after the schema migration to backfill API name overrides
// for all currently seeded districts. Safe to re-run (uses upsert).
//
// Usage:
//   npx tsx scripts/populate-district-api-names.ts
//
// What it does:
//   - Sets owmCityName  (OpenWeatherMap city name) where it differs from district name
//   - Sets agmarknetName (AGMARKNET district name) where it differs from district name
//   - Districts not in this list keep null values and fall back to their districtName
//
// To add a new district override, add an entry to OVERRIDES below.
// ═══════════════════════════════════════════════════════════════

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

interface DistrictOverride {
  slug: string;
  owmCityName: string | null;   // null = use districtName as-is
  agmarknetName: string | null; // null = use districtName as-is
}

// Only districts where the API name differs from the district slug/name.
// Districts NOT listed here will retain null (fallback to districtName).
const OVERRIDES: DistrictOverride[] = [
  // ── Karnataka ────────────────────────────────────────────────
  {
    slug: "bengaluru-urban",
    owmCityName: "Bangalore",   // OWM uses old anglicised spelling
    agmarknetName: "Bangalore", // AGMARKNET uses old spelling
  },
  {
    slug: "mysuru",
    owmCityName: "Mysore",      // OWM uses old anglicised spelling
    agmarknetName: "Mysore",    // AGMARKNET uses old spelling
  },
  // Mandya — no override needed; "Mandya" works in both APIs

  // ── Delhi UT ─────────────────────────────────────────────────
  // All Delhi sub-districts map to "New Delhi" for OWM
  // and "Delhi" for AGMARKNET (which treats Delhi as one district)
  { slug: "new-delhi",        owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "central-delhi",    owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "north-delhi",      owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "north-west-delhi", owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "north-east-delhi", owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "east-delhi",       owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "south-delhi",      owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "south-west-delhi", owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "south-east-delhi", owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "west-delhi",       owmCityName: "New Delhi", agmarknetName: "Delhi" },
  { slug: "shahdara",         owmCityName: "New Delhi", agmarknetName: "Delhi" },

  // ── Maharashtra ──────────────────────────────────────────────
  // Mumbai — no override needed; "Mumbai" works in both APIs

  // ── West Bengal ──────────────────────────────────────────────
  // Kolkata — no override needed; "Kolkata" works in both APIs

  // ── Tamil Nadu ───────────────────────────────────────────────
  // Chennai — no override needed; "Chennai" works in both APIs

  // ── Uttar Pradesh ────────────────────────────────────────────
  // Lucknow — no override needed; "Lucknow" works in both APIs

  // ── Telangana ────────────────────────────────────────────────
  // Hyderabad — no override needed; "Hyderabad" works in both APIs

  // ── Add future overrides below this line ─────────────────────
  // Example:
  // { slug: "thiruvananthapuram", owmCityName: "Trivandrum", agmarknetName: "Thiruvananthapuram" },
];

async function main() {
  console.log("[populate-district-api-names] Starting...\n");

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const override of OVERRIDES) {
    const district = await prisma.district.findFirst({
      where: { slug: override.slug },
      select: { id: true, name: true, owmCityName: true, agmarknetName: true },
    });

    if (!district) {
      console.warn(`  [SKIP] District not found in DB: ${override.slug}`);
      notFound++;
      continue;
    }

    // Skip if values are already correctly set (idempotent)
    if (
      district.owmCityName === override.owmCityName &&
      district.agmarknetName === override.agmarknetName
    ) {
      console.log(`  [OK]   ${override.slug} — already correct, skipping`);
      skipped++;
      continue;
    }

    await prisma.district.update({
      where: { id: district.id },
      data: {
        owmCityName: override.owmCityName,
        agmarknetName: override.agmarknetName,
      },
    });

    console.log(
      `  [SET]  ${override.slug} (${district.name})\n` +
      `         owmCityName:   ${district.owmCityName ?? "null"} → ${override.owmCityName ?? "null"}\n` +
      `         agmarknetName: ${district.agmarknetName ?? "null"} → ${override.agmarknetName ?? "null"}`
    );
    updated++;
  }

  console.log(
    `\n[populate-district-api-names] Done.\n` +
    `  Updated:   ${updated}\n` +
    `  Skipped:   ${skipped} (already correct)\n` +
    `  Not found: ${notFound} (districts not yet seeded — OK)\n`
  );
}

main()
  .catch((err) => {
    console.error("[populate-district-api-names] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());