// Server-only helpers for the Tenders module.
// Uses prisma — do NOT import from client components.
// For pure formatting/guard helpers, import from './format' instead.

import { prisma } from "@/lib/db";

// Re-export client-safe helpers so existing server-side imports don't break.
export { serializeForJson } from "./format";

// ── District slug resolver (DB-driven) ────────────────────────────────────
export async function resolveDistrictName(districtSlug: string): Promise<string | null> {
  const row = await prisma.district.findFirst({
    where: { slug: districtSlug, active: true },
    select: { name: true },
  });
  return row?.name ?? null;
}
