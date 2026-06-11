/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { alertNewFeedback } from "@/lib/admin-alerts";
import { isAutoClassifyEnabled } from "@/lib/admin-settings";
import { classifyFeedback } from "@/lib/feedback-classifier";
import { rateLimit, hashIp, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(`feedback:${hashIp(getClientIp(req))}`, 10, 3600);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit — max 10 feedback submissions per hour." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }

    const body = await req.json();
    const { type, module, subject, message, email, name, districtSlug, stateSlug, page, rating } = body;

    // Validate required fields
    if (!type || !subject || !message) {
      return NextResponse.json({ error: "type, subject, and message are required" }, { status: 400 });
    }
    // Length caps on free-text fields — reject grossly over-long input before storing.
    if (typeof subject !== "string" || subject.length > 200) {
      return NextResponse.json({ error: "Subject too long (max 200 chars)" }, { status: 400 });
    }
    if (typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Message too long (max 2000 chars)" }, { status: 400 });
    }

    // Look up district if provided
    let districtId: string | undefined;
    if (districtSlug && stateSlug) {
      const district = await prisma.district.findFirst({
        where: { slug: districtSlug, state: { slug: stateSlug } },
        select: { id: true },
      });
      districtId = district?.id;
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        module: module ?? null,
        subject: subject.slice(0, 200),
        message: message.slice(0, 2000),
        email: email?.slice(0, 200) ?? null,
        name: name?.slice(0, 100) ?? null,
        page: page?.slice(0, 500) ?? null,
        rating: rating != null ? Math.min(5, Math.max(1, Number(rating))) : null,
        ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
        districtId: districtId ?? null,
        status: "new",
      },
    });

    alertNewFeedback(body.type || "general", body.subject || "No subject").catch(() => {});

    // Auto-classify if enabled (background, don't block response)
    isAutoClassifyEnabled().then((enabled) => {
      if (enabled) {
        classifyFeedback(feedback.id, type, subject, message, module, districtSlug).catch(() => {});
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (err) {
    console.error("[feedback POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
