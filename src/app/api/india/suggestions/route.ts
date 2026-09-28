/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * GET  /api/india/suggestions  — top India module suggestions
 * POST /api/india/suggestions  — submit a new module suggestion
 *
 * Mirrors the existing /api/features pattern (fingerprint = sha256
 * of ip + UA, but with a DAILY_SALT so vote-trail can't fingerprint
 * users longitudinally — file 31 §16). Rate-limited via the existing
 * src/lib/rate-limit.ts (Upstash Redis sliding window).
 *
 * If the schema hasn't been db-pushed yet (Phase 0a's models still
 * pending Jayanth's manual `npx prisma db push`), every DB call gets
 * caught and the route returns 503 with a "database not yet migrated"
 * message instead of a 500 stack trace. The UI handles the 503
 * gracefully.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TITLE_MIN = 3;
const TITLE_MAX = 80;
const DESC_MAX = 200;

// Light profanity / URL filter — keeps spam and obvious bad-faith
// submissions out of the leaderboard. Real moderation happens in admin.
const URL_PATTERN = /https?:\/\/|www\.|\.com|\.in|\.org|\.net|\.io/i;
const PROFANITY = /\b(fuck|shit|asshole|bitch|cunt|nigger|retard|faggot)\b/i;

// Stored as submittedBy. Rate limits use hashIp(getClientIp()) instead:
// this hash includes the User-Agent, so changing it would dodge a limit.
function buildIpHash(req: NextRequest): string {
  // Daily salt rotation: ipHash for a given IP changes every UTC day,
  // so a user's vote trail across days isn't linkable.
  const salt = new Date().toISOString().slice(0, 10);
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}:${salt}`).digest("hex").slice(0, 32);
}

function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string; name?: string };
  // Prisma error codes: P2021 = table does not exist, P2010 = raw query failed
  if (e.code === "P2021" || e.code === "P2010") return true;
  // Stale dev-server client (model accessor is undefined → TypeError)
  if (e.name === "TypeError" && e.message?.includes("undefined")) return true;
  return Boolean(e.message?.toLowerCase().includes("does not exist"));
}

function dbUnavailable() {
  return NextResponse.json(
    {
      error: "Database not yet migrated for India dashboard.",
      hint: "Run `npx prisma db push` to apply the schema additions.",
      stub: true,
    },
    { status: 503 },
  );
}

// Listed publicly only once an admin has moved a suggestion past
// "proposed": new submissions are unmoderated (the description may hold a
// URL) and there is no moderation screen yet.
const LISTED_STATUSES = ["shortlisted", "in_progress", "live"];

export async function GET() {
  try {
    const suggestions = await prisma.indiaModuleSuggestion.findMany({
      where: { status: { in: LISTED_STATUSES } },
      orderBy: [{ voteCount: "desc" }, { createdAt: "asc" }],
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        voteCount: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ suggestions });
  } catch (err) {
    if (isSchemaMissingError(err)) return dbUnavailable();
    console.error("[india/suggestions GET]", err);
    return NextResponse.json(
      { error: "Failed to load suggestions." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { title?: string; description?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  const description = body.description?.trim() ?? null;
  const category = body.category?.trim() ?? null;

  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return NextResponse.json(
      { error: `Title must be ${TITLE_MIN}-${TITLE_MAX} characters.` },
      { status: 400 },
    );
  }
  if (URL_PATTERN.test(title)) {
    return NextResponse.json(
      { error: "URLs are not allowed in the title." },
      { status: 400 },
    );
  }
  if (PROFANITY.test(title) || (description && PROFANITY.test(description))) {
    return NextResponse.json(
      { error: "Submission contains disallowed language." },
      { status: 400 },
    );
  }
  if (description && description.length > DESC_MAX) {
    return NextResponse.json(
      { error: `Description must be ≤ ${DESC_MAX} characters.` },
      { status: 400 },
    );
  }

  const ipHash = buildIpHash(req);

  // Rate limit: 3 suggestions per IP per hour.
  const rl = await rateLimit(`india:sug:${hashIp(getClientIp(req))}`, 3, 60 * 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many submissions — try again later." },
      { status: 429 },
    );
  }

  try {
    const created = await prisma.indiaModuleSuggestion.create({
      data: {
        title,
        description,
        category,
        submittedBy: ipHash,
      },
      select: { id: true, title: true, voteCount: true, status: true },
    });
    return NextResponse.json({ success: true, suggestion: created });
  } catch (err) {
    if (isSchemaMissingError(err)) return dbUnavailable();
    console.error("[india/suggestions POST]", err);
    return NextResponse.json(
      { error: "Failed to create suggestion." },
      { status: 500 },
    );
  }
}
