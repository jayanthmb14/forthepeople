/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * POST /api/india/suggestions/[id]/vote
 *
 * IP-hash one-vote-per-day per (suggestion, ipHash) tuple. The DB
 * unique constraint on IndiaModuleVote.@@unique([suggestionId, ipHash])
 * is the actual enforcement; the daily-rotating salt on ipHash makes
 * the limit a "1 per day" instead of a "1 forever".
 *
 * Returns 503 when the schema hasn't been db-pushed yet (Phase 0a
 * pending Jayanth's manual apply).
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// The one-vote-per-day key (IP + User-Agent + day). The rate limit uses
// hashIp(getClientIp()) instead, so a new User-Agent cannot dodge it.
function buildIpHash(req: NextRequest): string {
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
  if (e.code === "P2021" || e.code === "P2010") return true;
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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const ipHash = buildIpHash(req);

  // Rate limit: 30 vote attempts per IP per hour (covers retries).
  const rl = await rateLimit(`india:vote:${hashIp(getClientIp(req))}`, 30, 60 * 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many vote attempts — try again later." },
      { status: 429 },
    );
  }

  try {
    const suggestion = await prisma.indiaModuleSuggestion.findUnique({
      where: { id },
      select: { id: true, voteCount: true },
    });
    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
    }

    // Prior vote check via the unique constraint on IndiaModuleVote.
    const existing = await prisma.indiaModuleVote.findUnique({
      where: { suggestionId_ipHash: { suggestionId: id, ipHash } },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: "Already voted today.",
          voteCount: suggestion.voteCount,
        },
        { status: 409 },
      );
    }

    const [, updated] = await prisma.$transaction([
      prisma.indiaModuleVote.create({
        data: { suggestionId: id, ipHash },
      }),
      prisma.indiaModuleSuggestion.update({
        where: { id },
        data: { voteCount: { increment: 1 } },
        select: { voteCount: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      suggestionId: id,
      voteCount: updated.voteCount,
    });
  } catch (err) {
    if (isSchemaMissingError(err)) return dbUnavailable();
    console.error("[india/suggestions vote POST]", err);
    return NextResponse.json(
      { error: "Failed to record vote." },
      { status: 500 },
    );
  }
}
