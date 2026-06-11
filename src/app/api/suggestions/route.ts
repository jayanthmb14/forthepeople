/**
 * Public community suggestions endpoint.
 *
 *   POST /api/suggestions   submit (validated, rate-limited)
 *   GET  /api/suggestions   list ACCEPTED + IMPLEMENTED suggestions (public)
 *
 * Rate limit: 3 submissions per IP per rolling hour (Upstash Redis, IP-hashed —
 * reliable across serverless invocations, unlike the old in-memory Map).
 *
 * Email notification: if RESEND_API_KEY is set, a non-blocking email goes
 * to forthepeople1547@gmail.com (FTP product inbox, NOT jayanth's personal
 * email) so Jayanth sees new suggestions promptly.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateContributorName } from "@/lib/validators/contributor-name";
import { sendEmail } from "@/lib/email";
import { rateLimit, hashIp, getClientIp } from "@/lib/rate-limit";

const VALID_CATEGORIES = ["Feature", "Bug", "Data", "UX", "Other"] as const;
const PRODUCT_NOTIFICATION_TO =
  process.env.ADMIN_EMAIL || "forthepeople1547@gmail.com";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`suggestion:${hashIp(getClientIp(req))}`, 3, 3600);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit — max 3 suggestions per hour." },
      { status: 429, headers: { "Retry-After": "3600" } },
    );
  }

  const body = await req.json();

  const nameResult = validateContributorName(body.name);
  if (!nameResult.ok) {
    return NextResponse.json({ error: nameResult.reason }, { status: 400 });
  }

  if (
    !body.title ||
    typeof body.title !== "string" ||
    body.title.trim().length < 5 ||
    body.title.trim().length > 120
  ) {
    return NextResponse.json({ error: "Title must be 5-120 characters." }, { status: 400 });
  }
  if (
    !body.body ||
    typeof body.body !== "string" ||
    body.body.trim().length < 20 ||
    body.body.trim().length > 2000
  ) {
    return NextResponse.json({ error: "Details must be 20-2000 characters." }, { status: 400 });
  }

  const category = VALID_CATEGORIES.includes(body.category) ? body.category : "Other";
  const email = typeof body.email === "string" && body.email.trim()
    ? body.email.trim().slice(0, 120)
    : null;

  const suggestion = await prisma.suggestion.create({
    data: {
      name: nameResult.cleaned,
      email,
      title: body.title.trim(),
      body: body.body.trim(),
      category,
      status: "PENDING",
    },
  });

  // Fire-and-forget email notification (never block submission on failure).
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  sendEmail({
    to: PRODUCT_NOTIFICATION_TO,
    subject: `[FTP Suggestion] ${suggestion.title.slice(0, 60)}`,
    html: `<p>From: <strong>${esc(suggestion.name)}</strong>${
      suggestion.email ? ` &lt;${esc(suggestion.email)}&gt;` : ""
    }</p>
           <p><strong>${esc(suggestion.title)}</strong></p>
           <p style="white-space:pre-wrap">${esc(suggestion.body)}</p>
           <p>Category: ${esc(suggestion.category ?? "Other")}</p>
           <p>Review in admin: <code>/admin/suggestions</code> (id ${suggestion.id})</p>`,
  }).catch((e) => console.error("[suggestions] Resend notify failed (non-blocking):", e));

  return NextResponse.json({ ok: true, id: suggestion.id });
}

export async function GET() {
  const items = await prisma.suggestion.findMany({
    where: { status: { in: ["ACCEPTED", "IMPLEMENTED"] } },
    select: {
      id: true,
      name: true,
      title: true,
      body: true,
      category: true,
      status: true,
      upvotes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ data: items });
}
