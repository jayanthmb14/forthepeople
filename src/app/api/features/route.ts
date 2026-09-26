/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Feature Voting API
// GET  /api/features            — list all features with vote counts
// POST /api/features?id=xxx     — vote for a feature (fingerprint-deduped)
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import { getClientIp, hashIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Votes are public writes: 20 per hour per hashed IP. Fails OPEN on a Redis
// outage (a cache blip should not block citizens from voting; the
// fingerprint dedupe below still prevents double votes).
const VOTE_LIMIT = 20;
const VOTE_WINDOW_SECONDS = 60 * 60;

// Build a simple fingerprint from IP + User-Agent
function buildFingerprint(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
  const ua = req.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}:${ua}`).digest("hex").slice(0, 32);
}

export async function GET() {
  const features = await prisma.featureRequest.findMany({
    orderBy: [{ votes: "desc" }, { priority: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      icon: true,
      votes: true,
      status: true,
      priority: true,
    },
  });
  return NextResponse.json({ features });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(`feature-vote:${hashIp(getClientIp(req))}`, VOTE_LIMIT, VOTE_WINDOW_SECONDS);
  if (!rl.success) {
    return NextResponse.json(
      { error: `Rate limit — max ${VOTE_LIMIT} votes per hour.` },
      { status: 429, headers: { "Retry-After": String(VOTE_WINDOW_SECONDS) } }
    );
  }

  const featureId = req.nextUrl.searchParams.get("id");
  if (!featureId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const feature = await prisma.featureRequest.findUnique({ where: { id: featureId } });
  if (!feature) {
    return NextResponse.json({ error: "Feature not found" }, { status: 404 });
  }

  const fingerprint = buildFingerprint(req);

  // Check for existing vote
  const existing = await prisma.featureVote.findUnique({
    where: { featureId_fingerprint: { featureId, fingerprint } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already voted", votes: feature.votes }, { status: 409 });
  }

  // Record vote + increment counter in a transaction
  const [, updated] = await prisma.$transaction([
    prisma.featureVote.create({ data: { featureId, fingerprint } }),
    prisma.featureRequest.update({
      where: { id: featureId },
      data: { votes: { increment: 1 } },
      select: { votes: true },
    }),
  ]);

  return NextResponse.json({ success: true, votes: updated.votes });
}
