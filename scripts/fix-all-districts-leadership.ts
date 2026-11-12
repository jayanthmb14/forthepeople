/**
 * ForThePeople.in — All-districts leadership re-tier + verification.
 * Run: npx tsx scripts/fix-all-districts-leadership.ts [--dry-run]
 *
 * Stage 1 (per district)
 *   • DELETES known placeholder rows ("Bengaluru leaders", "Karnataka CM").
 *   • ADDS missing tier-1 (Modi + Murmu) and per-state tier-2 leaders
 *     (CM + Governor) where the user has explicitly listed them.
 *
 * Stage 2 (per district, role-pattern based)
 *   • Re-tiers every existing active leader to the new 5-tier hierarchy
 *     based on role text alone:
 *       T1  President / PM
 *       T2  Governor / CM / Deputy CM / Chief Secretary / LG
 *       T3  Collector / DC / DM / SP / CP / DCP / CEO ZP
 *       T4  MP + MLA / Union Minister / Cabinet Minister / Legislator
 *       T5  Mayor / Municipal Commissioner / dept head / MD / Chairman / etc.
 *   • Roles like "Member of Legislative Assembly" are normalized to
 *     "MLA, <constituency>" using the row's own constituency value.
 *
 * Stage 3 (global)
 *   • Populates roleDescription = ROLE_DESCRIPTIONS[role] for every active
 *     row whose roleDescription is null.
 *
 * Hard rules (carried over from prior leadership prompts):
 *   - NEVER fabricate IAS/IPS officer names.
 *   - NEVER guess a party — null when unsure (IAS/IPS always null).
 *   - Mark wrong/legacy rows inactive — never delete unless the row is
 *     a clear placeholder explicitly listed in PLACEHOLDER_DELETES.
 *   - lastVerifiedAt = now() on every row touched.
 */

import "./_env";
import { PrismaClient, Prisma } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../src/lib/update-log";
import { getRoleDescription } from "../src/lib/constants/role-descriptions";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DRY_RUN = process.argv.includes("--dry-run");
const NOW = new Date();

interface Add { name: string; role: string; tier: number; party: string | null; constituency?: string | null }

interface DistrictPlan {
  slug: string;
  // Rows to DELETE outright (placeholder names with no person attached).
  // Match by name+role (case-insensitive substring).
  placeholderDeletes?: Array<{ name: string; role?: string; reason: string }>;
  // T1 + T2 leaders to ADD if absent. Idempotent — matched by name+role
  // case-insensitive substring.
  adds?: Add[];
}

const NATIONAL: Add[] = [
  { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null },
  { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP" },
];

const PLAN: DistrictPlan[] = [
  {
    slug: "bengaluru-urban",
    placeholderDeletes: [
      { name: "Bengaluru leaders", reason: "Placeholder, no real person." },
      { name: "Bengaluru Urban District Collector", role: "District Collector", reason: "Role-as-name placeholder, no real person." },
      { name: "Karnataka CM", role: "Chief Minister", reason: "Generic role-only placeholder; Siddaramaiah added by name instead." },
    ],
    adds: [
      ...NATIONAL,
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 2, party: null },
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 2, party: "INC" },
    ],
  },
  {
    slug: "mysuru",
    adds: [
      ...NATIONAL,
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 2, party: null },
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 2, party: "INC" },
    ],
  },
  {
    slug: "mandya",
    // Mandya already re-tiered by fix-mandya-leadership.ts; this is idempotent.
    adds: [
      ...NATIONAL,
      { name: "Thaavar Chand Gehlot", role: "Governor of Karnataka", tier: 2, party: null },
      { name: "Siddaramaiah", role: "Chief Minister of Karnataka", tier: 2, party: "INC" },
    ],
  },
  {
    slug: "mumbai",
    adds: [
      ...NATIONAL,
      { name: "Devendra Fadnavis", role: "Chief Minister of Maharashtra", tier: 2, party: "BJP" },
    ],
  },
  {
    slug: "chennai",
    adds: [
      ...NATIONAL,
      { name: "M.K. Stalin", role: "Chief Minister of Tamil Nadu", tier: 2, party: "DMK" },
    ],
  },
  {
    slug: "hyderabad",
    adds: [
      ...NATIONAL,
      { name: "Revanth Reddy", role: "Chief Minister of Telangana", tier: 2, party: "INC" },
    ],
  },
  {
    slug: "lucknow",
    adds: [
      ...NATIONAL,
      { name: "Yogi Adityanath", role: "Chief Minister of Uttar Pradesh", tier: 2, party: "BJP" },
      { name: "Anandiben Patel", role: "Governor of Uttar Pradesh", tier: 2, party: null },
    ],
  },
  {
    slug: "kolkata",
    adds: [
      ...NATIONAL,
      { name: "Mamata Banerjee", role: "Chief Minister of West Bengal", tier: 2, party: "TMC" },
    ],
  },
  {
    slug: "new-delhi",
    // Delhi CM intentionally untouched — uncertainty post Feb-2025 election.
    adds: [...NATIONAL],
  },
];

// ── Tier classifier from role text ─────────────────────────────────
// Order matters — first match wins. Patterns are intentionally broad
// so legacy roles ("Member of Legislative Assembly", "Deputy
// Commissioner of Police", etc.) land in the right bucket.
const TIER_RULES: Array<{ tier: number; re: RegExp }> = [
  { tier: 1, re: /^(president of india|prime minister)\b/i },
  { tier: 2, re: /^(governor|lieutenant governor|chief minister|deputy chief minister|chief secretary)\b/i },
  // Cabinet/State ministers without "Union" prefix are state-level — T2.
  { tier: 2, re: /^(cabinet minister|state minister|minister for|minister of)\b/i },
  // T3 — district administration. CP/DCP/SP and Collector/DC/DM all here.
  { tier: 3, re: /^(district collector|deputy commissioner(?!.*of police)|district magistrate|superintendent of police|commissioner of police|deputy commissioner of police|joint commissioner of police|additional commissioner|ceo,?\s*zilla|deputy commissioner,?\s*[a-z])/i },
  // T4 — elected representatives (MP + MLA + Union Ministers).
  { tier: 4, re: /(union minister|\bmp\b|member of parliament|member of legislative assembly|^mla\b|^mp,)/i },
  // T5 — municipal + dept heads + judiciary + PSU MDs.
  { tier: 5, re: /^(mayor|municipal commissioner|chief justice|principal sessions judge|principal district & sessions judge|chief judge|managing director|chairman|vice chairman|chief engineer|director of|director,|tahsildar|tehsildar|member secretary|general manager)/i },
];
function classifyTier(role: string): number | null {
  for (const r of TIER_RULES) if (r.re.test(role)) return r.tier;
  return null;
}

// MLA roles are normalised to "MLA, <constituency>" using the row's
// own constituency value. Other re-tiered roles keep their text intact.
function normaliseRole(role: string, constituency: string | null | undefined): string {
  if (/member of legislative assembly|^mla\b/i.test(role)) {
    const c = (constituency ?? "").split("—")[0].trim();
    return c ? `MLA, ${c}` : "MLA";
  }
  return role;
}

async function processDistrict(plan: DistrictPlan) {
  const d = await prisma.district.findFirst({ where: { slug: plan.slug }, select: { id: true, name: true } });
  if (!d) { console.warn(`⚠ District not found: ${plan.slug}`); return null; }
  console.log(`\n══ ${d.name} (${plan.slug}) ══`);
  let deleted = 0, added = 0, retiered = 0, descPopulated = 0;

  // Stage 1a — placeholder deletes (explicit list only)
  for (const del of plan.placeholderDeletes ?? []) {
    const where = del.role
      ? { districtId: d.id, name: { contains: del.name, mode: "insensitive" as const }, role: { contains: del.role, mode: "insensitive" as const } }
      : { districtId: d.id, name: { contains: del.name, mode: "insensitive" as const } };
    const matches = await prisma.leader.findMany({ where, select: { id: true, name: true, role: true } });
    for (const m of matches) console.log(`  ❌ DELETE: ${m.name} | ${m.role}  (${del.reason})`);
    if (!DRY_RUN && matches.length > 0) {
      await prisma.leader.deleteMany({ where: { id: { in: matches.map((m) => m.id) } } });
    }
    deleted += matches.length;
  }

  // Stage 1b — adds (T1 + T2)
  for (const add of plan.adds ?? []) {
    const existing = await prisma.leader.findFirst({
      where: {
        districtId: d.id,
        name: { contains: add.name, mode: "insensitive" },
        role: { contains: add.role.split(/[,(;]/)[0].trim().slice(0, 30), mode: "insensitive" },
      },
    });
    if (existing) {
      // Refresh tier + party + lastVerifiedAt; don't overwrite existing
      // role wording in case it's been edited (e.g. "Chief Minister of
      // Karnataka (CM)") — we only assert the tier and party.
      if (!DRY_RUN) {
        await prisma.leader.update({
          where: { id: existing.id },
          data: { tier: add.tier, party: add.party, active: true, lastVerifiedAt: NOW },
        });
      }
      console.log(`  ⏭  ADD skip — already present: ${existing.name} | ${existing.role} (refreshed)`);
      continue;
    }
    console.log(`  ✅ ADD T${add.tier} | ${add.name} | ${add.role} | ${add.party ?? "—"}`);
    if (!DRY_RUN) {
      const created = await prisma.leader.create({
        data: {
          districtId: d.id, name: add.name, role: add.role, tier: add.tier,
          party: add.party, constituency: add.constituency ?? null,
          source: "manual-research", active: true, lastVerifiedAt: NOW,
          roleDescription: getRoleDescription(add.role),
        },
      });
      await logUpdate({
        source: "api", actorLabel: "manual-research",
        tableName: "Leader", recordId: created.id, action: "create",
        districtId: d.id, districtName: d.name, moduleName: "leadership",
        description: `${d.name} leadership add: ${add.name} as ${add.role} (T${add.tier})`,
        recordCount: 1, details: {},
      });
    }
    added++;
  }

  // Stage 2 — role-pattern re-tier of all active rows.
  const allActive = await prisma.leader.findMany({ where: { districtId: d.id, active: true } });
  for (const r of allActive) {
    const targetTier = classifyTier(r.role);
    const newRole = normaliseRole(r.role, r.constituency);
    if (targetTier == null && newRole === r.role) continue;
    const tierChanged = targetTier != null && r.tier !== targetTier;
    const roleChanged = newRole !== r.role;
    if (!tierChanged && !roleChanged) continue;

    console.log(`  ✏  RE-TIER: ${r.name} | T${r.tier}→T${targetTier ?? r.tier} | ${r.role}${roleChanged ? ` → ${newRole}` : ""}`);
    if (!DRY_RUN) {
      await prisma.leader.update({
        where: { id: r.id },
        data: {
          tier: targetTier ?? r.tier,
          role: newRole,
          lastVerifiedAt: NOW,
        },
      });
    }
    retiered++;
  }

  // Stage 3 — populate roleDescription on every active row that lacks it.
  const needsDesc = await prisma.leader.findMany({
    where: { districtId: d.id, active: true, roleDescription: null },
    select: { id: true, role: true },
  });
  for (const r of needsDesc) {
    const desc = getRoleDescription(r.role);
    if (!desc) continue;
    if (!DRY_RUN) {
      await prisma.leader.update({ where: { id: r.id }, data: { roleDescription: desc } });
    }
    descPopulated++;
  }
  if (descPopulated > 0) console.log(`  📝 roleDescription populated for ${descPopulated} row(s).`);

  return { name: d.name, deleted, added, retiered, descPopulated };
}

async function main() {
  console.log(`🛠  All-districts leadership sweep ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  const results: Array<NonNullable<Awaited<ReturnType<typeof processDistrict>>>> = [];
  for (const p of PLAN) {
    const r = await processDistrict(p);
    if (r) results.push(r);
  }

  console.log(`\n\n📊 Final coverage by tier (active leaders):`);
  console.log(`| District          | T1 | T2 | T3 | T4 | T5 | Other | Total |`);
  console.log(`|-------------------|----|----|----|----|----|-------|-------|`);
  for (const r of results) {
    const d = await prisma.district.findFirst({ where: { name: r.name }, select: { id: true } });
    if (!d) continue;
    const rows = await prisma.leader.findMany({ where: { districtId: d.id, active: true }, select: { tier: true } });
    const counts: Record<number, number> = {};
    for (const x of rows) counts[x.tier] = (counts[x.tier] ?? 0) + 1;
    const other = rows.length - (counts[1] ?? 0) - (counts[2] ?? 0) - (counts[3] ?? 0) - (counts[4] ?? 0) - (counts[5] ?? 0);
    console.log(
      `| ${r.name.padEnd(17).slice(0, 17)} | ${String(counts[1] ?? 0).padEnd(2)} | ${String(counts[2] ?? 0).padEnd(2)} | ${String(counts[3] ?? 0).padEnd(2)} | ${String(counts[4] ?? 0).padEnd(2)} | ${String(counts[5] ?? 0).padEnd(2)} | ${String(other).padEnd(5)} | ${String(rows.length).padEnd(5)} |`
    );
  }

  const totals = results.reduce((a, r) => ({
    deleted: a.deleted + r.deleted,
    added: a.added + r.added,
    retiered: a.retiered + r.retiered,
    descPopulated: a.descPopulated + r.descPopulated,
  }), { deleted: 0, added: 0, retiered: 0, descPopulated: 0 });
  console.log(`\nTOTAL: ${totals.deleted} deleted · ${totals.added} added · ${totals.retiered} re-tiered · ${totals.descPopulated} descriptions populated`);
}

main().catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
