/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// The district list most cron routes walk, and the JobContext a job gets
// for one district. (v5.5: the same query and context-building block was
// copied into ten routes, with a `?? "karnataka"` state fallback that can
// never apply — District.state is required in the schema.)
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import type { JobContext } from "../types";

export interface ActiveDistrict {
  id: string;
  slug: string;
  name: string;
  state: { slug: string; name: string };
}

/** Every active district with its state, A→Z by name. */
export function listActiveDistricts(): Promise<ActiveDistrict[]> {
  return prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true, state: { select: { slug: true, name: true } } },
    orderBy: { name: "asc" },
  });
}

/** The JobContext for one district; `log` collects the job's messages. */
export function jobContextFor(d: ActiveDistrict, log: (msg: string) => void): JobContext {
  return {
    districtId: d.id,
    districtSlug: d.slug,
    districtName: d.name,
    stateSlug: d.state.slug,
    stateName: d.state.name,
    log,
  };
}
