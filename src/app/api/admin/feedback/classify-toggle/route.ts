import { NextResponse } from "next/server";
import { isAutoClassifyEnabled, setAdminSetting } from "@/lib/admin-settings";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const enabled = await isAutoClassifyEnabled();
  return NextResponse.json({ enabled });
}

export async function POST() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const current = await isAutoClassifyEnabled();
  await setAdminSetting("feedback_auto_classify", current ? "false" : "true");
  return NextResponse.json({ enabled: !current });
}
