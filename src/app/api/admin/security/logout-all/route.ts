/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin-auth";

const COOKIE = "ftp_admin_v1";
const TOTP_PENDING = "admin_totp_pending";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(TOTP_PENDING);

  return NextResponse.json({ ok: true });
}
