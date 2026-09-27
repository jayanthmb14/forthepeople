/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Syncs ALL states, districts, and taluks from districts.ts constants to the DB.
 * Uses upsert — never overrides active=true with active=false.
 *
 * Run: npx tsx -r dotenv/config scripts/sync-all-districts.ts
 */

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { INDIA_STATES } from "../src/lib/constants/districts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  let statesCreated = 0;
  let statesUpdated = 0;
  let districtsCreated = 0;
  let districtsUpdated = 0;
  let taluksCreated = 0;

  for (const state of INDIA_STATES) {
    // Check if state exists
    const existing = await prisma.state.findFirst({ where: { slug: state.slug } });

    if (existing) {
      // Update name/nameLocal but NEVER downgrade active→false
      await prisma.state.update({
        where: { id: existing.id },
        data: {
          name: state.name,
          nameLocal: state.nameLocal,
          capital: state.capital ?? null,
          // Only upgrade to active, never downgrade
          ...(state.active && !existing.active ? { active: true } : {}),
        },
      });
      statesUpdated++;

      // Sync districts
      for (const district of state.districts) {
        const existingDistrict = await prisma.district.findFirst({
          where: { slug: district.slug, stateId: existing.id },
        });

        if (existingDistrict) {
          await prisma.district.update({
            where: { id: existingDistrict.id },
            data: {
              name: district.name,
              nameLocal: district.nameLocal,
              tagline: district.tagline ?? null,
              population: district.population ?? null,
              area: district.area ?? null,
              talukCount: district.talukCount ?? (district.subUnitsUnchecked ? null : district.taluks.length),
              literacy: district.literacy ?? null,
              sexRatio: district.sexRatio ?? null,
              // Only upgrade to active, never downgrade
              ...(district.active && !existingDistrict.active ? { active: true } : {}),
            },
          });
          districtsUpdated++;

          // Sync taluks
          for (const taluk of district.taluks) {
            const existingTaluk = await prisma.taluk.findFirst({
              where: { slug: taluk.slug, districtId: existingDistrict.id },
            });
            if (!existingTaluk) {
              await prisma.taluk.create({
                data: {
                  districtId: existingDistrict.id,
                  name: taluk.name,
                  nameLocal: taluk.nameLocal,
                  slug: taluk.slug,
                  tagline: taluk.tagline ?? null,
                  population: taluk.population ?? null,
                  area: taluk.area ?? null,
                  villageCount: taluk.villageCount ?? null,
                },
              });
              taluksCreated++;
            }
          }
        } else {
          // Create new district
          const newDistrict = await prisma.district.create({
            data: {
              stateId: existing.id,
              name: district.name,
              nameLocal: district.nameLocal,
              slug: district.slug,
              tagline: district.tagline ?? null,
              active: district.active,
              population: district.population ?? null,
              area: district.area ?? null,
              talukCount: district.talukCount ?? (district.subUnitsUnchecked ? null : district.taluks.length),
              literacy: district.literacy ?? null,
              sexRatio: district.sexRatio ?? null,
            },
          });
          districtsCreated++;

          // Create taluks
          for (const taluk of district.taluks) {
            await prisma.taluk.create({
              data: {
                districtId: newDistrict.id,
                name: taluk.name,
                nameLocal: taluk.nameLocal,
                slug: taluk.slug,
                tagline: taluk.tagline ?? null,
                population: taluk.population ?? null,
                area: taluk.area ?? null,
                villageCount: taluk.villageCount ?? null,
              },
            });
            taluksCreated++;
          }
        }
      }
    } else {
      // Create new state
      const newState = await prisma.state.create({
        data: {
          name: state.name,
          nameLocal: state.nameLocal,
          slug: state.slug,
          active: state.active,
          capital: state.capital ?? null,
        },
      });
      statesCreated++;

      // Create all districts and taluks
      for (const district of state.districts) {
        const newDistrict = await prisma.district.create({
          data: {
            stateId: newState.id,
            name: district.name,
            nameLocal: district.nameLocal,
            slug: district.slug,
            tagline: district.tagline ?? null,
            active: district.active,
            population: district.population ?? null,
            area: district.area ?? null,
            talukCount: district.talukCount ?? (district.subUnitsUnchecked ? null : district.taluks.length),
            literacy: district.literacy ?? null,
            sexRatio: district.sexRatio ?? null,
          },
        });
        districtsCreated++;

        for (const taluk of district.taluks) {
          await prisma.taluk.create({
            data: {
              districtId: newDistrict.id,
              name: taluk.name,
              nameLocal: taluk.nameLocal,
              slug: taluk.slug,
              tagline: taluk.tagline ?? null,
              population: taluk.population ?? null,
              area: taluk.area ?? null,
              villageCount: taluk.villageCount ?? null,
            },
          });
          taluksCreated++;
        }
      }
    }

    console.log(`  ${state.active ? "●" : "○"} ${state.name} — ${state.districts.length} districts`);
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`States:    ${statesCreated} created, ${statesUpdated} updated`);
  console.log(`Districts: ${districtsCreated} created, ${districtsUpdated} updated`);
  console.log(`Taluks:    ${taluksCreated} created`);
  console.log("═══════════════════════════════════════\n");
  console.log("✅ All states and districts synced to database.");
  console.log("   Locked districts are now sponsorable via the support page.");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
