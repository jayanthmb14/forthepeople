// GET /api/tenders/[district]/[tenderId]
// Full tender detail with computed timeline.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveDistrictName, serializeForJson } from "@/lib/tenders/tender-helpers";
import { NOT_STUB_TENDER } from "@/lib/data-filters";

export const dynamic = "force-dynamic";

type TimelineEvent = {
  at: string;
  type: "PUBLISHED" | "PRE_BID" | "CORRIGENDUM" | "CLOSING" | "OPENING_TECH" | "OPENING_FIN" | "AWARD" | "CONTRACT" | "COMPLETION";
  label: string;
  status: "past" | "current" | "future";
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ district: string; tenderId: string }> },
) {
  const { district: districtSlug, tenderId } = await ctx.params;
  const districtName = await resolveDistrictName(districtSlug);
  if (!districtName) {
    return NextResponse.json({ error: { code: "DISTRICT_NOT_ACTIVE", message: `District '${districtSlug}' is not active.` } }, { status: 404 });
  }

  const tender = await prisma.tender.findFirst({
    where: { id: tenderId, locationDistrict: districtName, ...NOT_STUB_TENDER },
    include: {
      authority: true,
      category: true,
      corrigenda: { orderBy: { sequenceNo: "asc" } },
      awards: { orderBy: { awardedAt: "desc" } },
      bidders: { orderBy: { rank: "asc" } },
      contract: true,
      documents: true,
      redFlags: true,
      aiSummary: true,
    },
  });
  if (!tender) {
    return NextResponse.json({ error: { code: "TENDER_NOT_FOUND", message: `Tender ${tenderId} not found in ${districtName}.` } }, { status: 404 });
  }

  const now = new Date();
  const timeline: TimelineEvent[] = [];
  const push = (at: Date | null | undefined, type: TimelineEvent["type"], label: string) => {
    if (!at) return;
    timeline.push({
      at: at.toISOString(),
      type,
      label,
      status: at < now ? "past" : "future",
    });
  };
  push(tender.publishedAt, "PUBLISHED", "Tender published");
  push(tender.preBidMeetingAt, "PRE_BID", "Pre-bid meeting");
  tender.corrigenda.forEach((c, i) => push(c.issuedAt, "CORRIGENDUM", `Corrigendum #${i + 1}`));
  push(tender.bidSubmissionEnd, "CLOSING", "Bid submission closes");
  push(tender.technicalOpeningAt, "OPENING_TECH", "Technical bid opening");
  push(tender.financialOpeningAt, "OPENING_FIN", "Financial bid opening");
  tender.awards.forEach((a) => push(a.awardedAt, "AWARD", "Award issued"));
  push(tender.contract?.contractSignedAt, "CONTRACT", "Contract signed");
  push(tender.contract?.expectedCompletionAt, "COMPLETION", "Expected completion");
  push(tender.contract?.actualCompletionAt, "COMPLETION", "Completed");
  timeline.sort((a, b) => a.at.localeCompare(b.at));

  // Mark the chronologically-closest past event as "current" to animate in UI
  const lastPast = [...timeline].reverse().find((e) => e.status === "past");
  if (lastPast) lastPast.status = "current";

  return NextResponse.json(serializeForJson({ tender, timeline }));
}
