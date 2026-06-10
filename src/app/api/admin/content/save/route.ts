/**
 * ForThePeople.in — Content Editor save
 * POST /api/admin/content/save
 * Body: {
 *   module: string (slug),
 *   districtSlug: string,
 *   updates: Array<{ id: string, changes: Record<string, unknown> }>,
 *   creates: Array<{ data: Record<string, unknown> }>,
 *   deletes: string[]
 * }
 *
 * For each change: update DB, write UpdateLog row, write AdminAuditLog row.
 * After all changes: invalidate Redis cache for the affected district+module.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import redis from "@/lib/redis";
import { cacheKey } from "@/lib/cache";
import { logUpdate } from "@/lib/update-log";
import { logAuditAuto } from "@/lib/audit-log";
import { getModuleConfig } from "../route";

interface Body {
  module?: string;
  districtSlug?: string;
  updates?: Array<{ id: string; changes: Record<string, unknown> }>;
  creates?: Array<{ data: Record<string, unknown> }>;
  deletes?: string[];
}

function coerce(value: unknown, prev: unknown): unknown {
  // Inputs come from HTML forms as strings; coerce to the target type when we
  // can tell from the previous value.
  if (typeof prev === "number") {
    if (value === "" || value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  if (typeof prev === "boolean") return value === true || value === "true";
  if (prev instanceof Date) {
    if (!value) return null;
    return new Date(String(value));
  }
  if (value === "") return null;
  return value;
}

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const moduleName = body.module;
  const districtSlug = body.districtSlug;
  const updates = body.updates ?? [];
  const creates = body.creates ?? [];
  const deletes = body.deletes ?? [];

  if (!moduleName || !districtSlug) {
    return NextResponse.json({ error: "module and districtSlug required" }, { status: 400 });
  }

  const cfg = getModuleConfig(moduleName);
  if (!cfg) {
    return NextResponse.json({ error: "Module not editable" }, { status: 400 });
  }
  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[cfg.table];
  if (!delegate) {
    return NextResponse.json({ error: "Model not available" }, { status: 500 });
  }

  const allowed = new Set(cfg.editableFields);

  let updated = 0;
  let created = 0;
  let deleted = 0;

  // Updates
  for (const u of updates) {
    const prev = await delegate.findUnique({ where: { id: u.id } });
    if (!prev) continue;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(u.changes)) {
      if (!allowed.has(k)) continue;
      data[k] = coerce(v, (prev as Record<string, unknown>)[k]);
    }
    if (Object.keys(data).length === 0) continue;
    await delegate.update({ where: { id: u.id }, data });
    updated++;
    for (const [field, newVal] of Object.entries(data)) {
      await logUpdate({
        source: "admin_edit",
        actorLabel: "Admin",
        tableName: cfg.table,
        recordId: u.id,
        action: "update",
        fieldName: field,
        oldValue: (prev as Record<string, unknown>)[field],
        newValue: newVal,
        districtId: district.id,
        districtName: district.name,
        moduleName: cfg.module,
        description: `Edited ${cfg.label} · ${field}`,
      });
    }

    // Per-module side effect: when an InfraProject is admin-edited, add an
    // InfraUpdate timeline row so the public page surfaces the provenance
    // (source="admin-panel", updateType="ADMIN_EDIT").
    if (cfg.module === "infrastructure" && Object.keys(data).length > 0) {
      try {
        const fields = Object.keys(data).join(", ");
        const statusChange = typeof data["status"] === "string" ? (data["status"] as string) : null;
        const budgetChange =
          typeof data["revisedBudget"] === "number" ? (data["revisedBudget"] as number)
          : typeof data["budget"] === "number" ? (data["budget"] as number)
          : null;
        const progressPct =
          typeof data["progressPct"] === "number" ? (data["progressPct"] as number) : null;
        await prisma.infraUpdate.create({
          data: {
            projectId: u.id,
            date: new Date(),
            headline: `Admin updated ${fields}`,
            summary: `Manual correction via admin panel (fields: ${fields}).`,
            updateType: "ADMIN_EDIT",
            statusChange,
            budgetChange,
            progressPct,
            newsUrl: "admin-panel",
            newsSource: "ForThePeople.in Admin",
            newsDate: new Date(),
            verified: true,
            verifiedAt: new Date(),
          },
        });
        await prisma.infraProject.update({
          where: { id: u.id },
          data: { lastVerifiedAt: new Date(), verificationCount: { increment: 1 } },
        });
      } catch (err) {
        console.error("[content/save] InfraUpdate side-effect failed:", err);
      }
    }
  }

  // Creates
  for (const c of creates) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c.data)) {
      if (allowed.has(k)) data[k] = v;
    }
    if (cfg.districtField) data[cfg.districtField] = district.id;
    try {
      const row = await delegate.create({ data });
      created++;
      await logUpdate({
        source: "admin_edit",
        actorLabel: "Admin",
        tableName: cfg.table,
        recordId: row.id,
        action: "create",
        newValue: data,
        districtId: district.id,
        districtName: district.name,
        moduleName: cfg.module,
        description: `Created new ${cfg.label} row`,
      });
    } catch (err) {
      console.error("[content/save] create failed:", err);
    }
  }

  // Deletes
  for (const id of deletes) {
    const prev = await delegate.findUnique({ where: { id } });
    if (!prev) continue;
    await delegate.delete({ where: { id } });
    deleted++;
    await logUpdate({
      source: "admin_edit",
      actorLabel: "Admin",
      tableName: cfg.table,
      recordId: id,
      action: "delete",
      oldValue: prev,
      districtId: district.id,
      districtName: district.name,
      moduleName: cfg.module,
      description: `Deleted ${cfg.label} row`,
    });
  }

  await logAuditAuto({
    action: "content_edit",
    resource: cfg.table,
    details: {
      module: cfg.module,
      district: districtSlug,
      updated,
      created,
      deleted,
    },
  });

  // Invalidate Redis caches so public pages refresh immediately.
  if (redis) {
    try {
      await redis.del(cacheKey(districtSlug, cfg.module));
      await redis.del(cacheKey(districtSlug, "overview"));
    } catch (err) {
      console.error("[content/save] cache invalidation failed:", err);
    }
  }

  return NextResponse.json({ updated, created, deleted });
}
