/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invalidateAISettingsCache, getAPIKey } from "@/lib/ai-provider";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed(): Promise<boolean> {
  const { ok } = await requireAdmin();
  return ok;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let settings = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.aIProviderSettings.create({ data: { id: "singleton" } });
    }
    // Check actual key availability (DB + env)
    const [geminiKey, anthropicKey] = await Promise.all([
      getAPIKey("gemini"),
      getAPIKey("anthropic"),
    ]);
    return NextResponse.json({
      settings,
      keyStatus: {
        geminiConfigured: !!geminiKey,
        anthropicConfigured: !!anthropicKey,
      },
    });
  } catch (err) {
    console.error("[ai-settings GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json() as {
      activeProvider?: string;
      geminiModel?: string;
      anthropicModel?: string;
      anthropicBaseUrl?: string;
      anthropicSource?: string;
      fallbackEnabled?: boolean;
      fallbackProvider?: string;
      maxTokens?: number;
      temperature?: number;
    };

    // Upsert
    let settings = await prisma.aIProviderSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.aIProviderSettings.create({ data: { id: "singleton" } });
    }

    const updated = await prisma.aIProviderSettings.update({
      where: { id: "singleton" },
      data: {
        ...(body.activeProvider !== undefined && { activeProvider: body.activeProvider, lastSwitchedAt: new Date(), lastSwitchedBy: "admin" }),
        ...(body.geminiModel !== undefined && { geminiModel: body.geminiModel }),
        ...(body.anthropicModel !== undefined && { anthropicModel: body.anthropicModel }),
        ...(body.anthropicBaseUrl !== undefined && { anthropicBaseUrl: body.anthropicBaseUrl }),
        ...(body.anthropicSource !== undefined && { anthropicSource: body.anthropicSource }),
        ...(body.fallbackEnabled !== undefined && { fallbackEnabled: body.fallbackEnabled }),
        ...(body.fallbackProvider !== undefined && { fallbackProvider: body.fallbackProvider }),
        ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens }),
        ...(body.temperature !== undefined && { temperature: body.temperature }),
      },
    });

    invalidateAISettingsCache();
    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error("[ai-settings PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
