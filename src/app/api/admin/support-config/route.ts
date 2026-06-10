/**
 * ForThePeople.in — Admin support-page editor API
 * GET  /api/admin/support-config  — returns the singleton + defaults fallback
 * PUT  /api/admin/support-config  — updates the singleton (admin-gated)
 *
 * Backs the SupportPageEditor admin tab. The support page itself reads the
 * same singleton directly via Prisma on the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { cacheSet } from "@/lib/cache";
import { logAuditAuto } from "@/lib/audit-log";
import { SUPPORT_DEFAULTS, type CostBreakdownItem, type HelpItem } from "@/lib/support-defaults";
import type { Prisma } from "@/generated/prisma";

const ROW_ID = "support-page-config";
const CACHE_KEY = "ftp:support-page-config:v1";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const { ok } = await requireAdmin();
  if (!ok) return unauthorized();
  const row = await prisma.supportPageConfig.findUnique({ where: { id: ROW_ID } });
  if (!row) {
    return NextResponse.json({ config: { ...SUPPORT_DEFAULTS, updatedAt: null }, defaults: SUPPORT_DEFAULTS });
  }
  return NextResponse.json({
    config: {
      bioName: row.bioName,
      bioSubtitle: row.bioSubtitle,
      bioText: row.bioText,
      photoUrl: row.photoUrl,
      costBreakdown: row.costBreakdown as unknown as CostBreakdownItem[],
      helpItems: row.helpItems as unknown as HelpItem[],
      updatedAt: row.updatedAt,
    },
    defaults: SUPPORT_DEFAULTS,
  });
}

function sanitizeCost(input: unknown): CostBreakdownItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const label = typeof r.label === "string" ? r.label.trim() : "";
      const pct = typeof r.pct === "number" ? Math.max(0, Math.min(100, r.pct)) : 0;
      const color = typeof r.color === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(r.color.trim())
        ? r.color.trim() : "#6B7280";
      if (!label) return null;
      return { label, pct, color };
    })
    .filter((x): x is CostBreakdownItem => x !== null)
    .slice(0, 12);
}

function sanitizeHelp(input: unknown): HelpItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as Record<string, unknown>;
      const label = typeof r.label === "string" ? r.label.trim() : "";
      const desc = typeof r.desc === "string" ? r.desc.trim() : "";
      const url = typeof r.url === "string" ? r.url.trim() : "";
      const icon = typeof r.icon === "string" ? r.icon.slice(0, 4) : "🔗";
      const external = Boolean(r.external);
      if (!label || !url) return null;
      return { label, desc, url, icon, external };
    })
    .filter((x): x is HelpItem => x !== null)
    .slice(0, 20);
}

export async function PUT(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bioName = typeof body.bioName === "string" ? body.bioName.trim().slice(0, 80) : SUPPORT_DEFAULTS.bioName;
  const bioSubtitle = typeof body.bioSubtitle === "string" ? body.bioSubtitle.trim().slice(0, 200) : SUPPORT_DEFAULTS.bioSubtitle;
  const bioText = typeof body.bioText === "string" ? body.bioText.slice(0, 10000) : SUPPORT_DEFAULTS.bioText;
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim().slice(0, 500) : SUPPORT_DEFAULTS.photoUrl;
  const costBreakdown = sanitizeCost(body.costBreakdown);
  const helpItems = sanitizeHelp(body.helpItems);

  if (!bioName || !bioText) {
    return NextResponse.json({ error: "bioName and bioText are required" }, { status: 400 });
  }

  const costJson = costBreakdown as unknown as Prisma.InputJsonValue;
  const helpJson = helpItems as unknown as Prisma.InputJsonValue;

  const saved = await prisma.supportPageConfig.upsert({
    where: { id: ROW_ID },
    update: { bioName, bioSubtitle, bioText, photoUrl, costBreakdown: costJson, helpItems: helpJson },
    create: {
      id: ROW_ID,
      bioName,
      bioSubtitle,
      bioText,
      photoUrl,
      costBreakdown: costJson,
      helpItems: helpJson,
    },
  });

  await cacheSet(CACHE_KEY, null, 1);
  await logAuditAuto({
    action: "update",
    resource: "SupportPageConfig",
    resourceId: ROW_ID,
    details: { bioName: saved.bioName, helpCount: helpItems.length, costRows: costBreakdown.length },
  });

  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt });
}
