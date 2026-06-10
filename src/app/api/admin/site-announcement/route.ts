// Admin-only read + write for the site-wide announcement singleton.
// GET returns the full row; PUT upserts all fields.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const SINGLETON_ID = "site-announcement-singleton";

async function isAuthed(): Promise<boolean> {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let row = await prisma.siteAnnouncement.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) {
    // Create an empty disabled default row on first GET so the admin form has shape.
    row = await prisma.siteAnnouncement.create({
      data: {
        id: SINGLETON_ID,
        enabled: false,
        variant: "critical",
        displayMode: "modal",
        title: "Temporary service notice",
        bodyMd: "",
        bulletsJson: [],
        ctaButtonText: "I understand — continue to site",
        storageKey: "ftp_site_announcement_v1",
      },
    });
  }
  return NextResponse.json({ announcement: row });
}

type PutBody = {
  enabled?: boolean;
  variant?: "critical" | "warning" | "info";
  displayMode?: "modal" | "banner";
  title?: string;
  bodyMd?: string;
  bullets?: string[];
  highlightText?: string | null;
  footerNote?: string | null;
  ctaButtonText?: string;
  storageKey?: string;
  autoHideAfter?: string | null;
};

export async function PUT(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: PutBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data = {
    enabled: body.enabled ?? false,
    variant: body.variant ?? "critical",
    displayMode: body.displayMode ?? "modal",
    title: body.title ?? "Temporary service notice",
    bodyMd: body.bodyMd ?? "",
    bulletsJson: (body.bullets ?? []) as Prisma.InputJsonValue,
    highlightText: body.highlightText ?? null,
    footerNote: body.footerNote ?? null,
    ctaButtonText: body.ctaButtonText ?? "I understand — continue to site",
    storageKey: body.storageKey ?? "ftp_site_announcement_v1",
    autoHideAfter: body.autoHideAfter ? new Date(body.autoHideAfter) : null,
  };

  const row = await prisma.siteAnnouncement.upsert({
    where: { id: SINGLETON_ID },
    update: data,
    create: { id: SINGLETON_ID, ...data },
  });
  return NextResponse.json({ announcement: row });
}
