/**
 * ForThePeople.in — Admin Bot
 * GET  /api/admin/bot?limit=20  — last N messages
 * POST /api/admin/bot          — process a user message
 *
 * Pattern-matched queries (revenue, stale districts, counts, add expense) are
 * answered directly from the DB with zero AI cost. Unmatched messages return
 * { requiresAI: true } with a cost estimate so the UI can prompt to confirm.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

interface BotResponse {
  reply: string;
  action?: string;
  actionResult?: Record<string, unknown>;
  requiresAI?: boolean;
  estimate?: { usd: number; inr: number };
}

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limit = Math.min(100, Number(req.nextUrl.searchParams.get("limit") ?? 20));
  const messages = await prisma.adminBotMessage.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
  });
  return NextResponse.json({ messages: messages.reverse() });
}

export async function POST(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = (await req.json().catch(() => ({}))) as { message?: string };
  const text = String(message ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Persist the user message.
  await prisma.adminBotMessage.create({
    data: { role: "user", content: text },
  });

  const response = await handleMessage(text);

  // Persist the assistant reply (even if it's a requires-AI prompt).
  await prisma.adminBotMessage.create({
    data: {
      role: "assistant",
      content: response.reply,
      action: response.action ?? null,
      actionResult: (response.actionResult as object | undefined) ?? undefined,
    },
  });

  return NextResponse.json(response);
}

async function handleMessage(raw: string): Promise<BotResponse> {
  const msg = raw.toLowerCase();

  // ── Revenue / supporters
  if (/\b(revenue|income|earned|collected|supporters?)\b/.test(msg)) {
    return handleRevenueQuery(msg);
  }

  // ── Expenses
  if (/^\s*add expense\b/i.test(raw)) {
    return handleAddExpense(raw);
  }
  if (/\b(expense|spent|cost|paid|burn)\b/.test(msg)) {
    return handleExpenseQuery(msg);
  }

  // ── Stale districts / data freshness
  if (/\b(stale|outdated|old data|not updated|fresh(ness)?)\b/.test(msg)) {
    return handleStaleQuery();
  }

  // ── Pending / backlog
  if (/\b(pending|review|backlog|unread|queue)\b/.test(msg)) {
    return handlePendingQuery();
  }

  // ── Counts
  if (/\b(how many|count|total)\b/.test(msg)) {
    return handleCountQuery(msg);
  }

  // ── Help
  if (/\bhelp\b|\bwhat can you do\b|\bcommands\b/.test(msg)) {
    return {
      reply: [
        "I can answer these without using AI (zero cost):",
        "• How much revenue this week/month?",
        "• Show expenses this month",
        "• Show stale districts",
        "• Pending reviews / unread feedback",
        "• Count districts / supporters / feedback",
        "",
        "Commands:",
        "• Add expense: <description> ₹<amount>  — e.g. 'Add expense: Vercel Pro ₹1680'",
        "",
        "For complex 'what should I do next?' questions, use the AI Platform Report on the Dashboard.",
      ].join("\n"),
    };
  }

  return {
    reply:
      "I didn't match that to a quick query. Try 'help' for supported patterns. For open-ended analysis ('what should I do next?'), use the AI Platform Report card on the Dashboard — it runs a full report for ~₹0.20.",
    requiresAI: true,
    estimate: { usd: 0.002, inr: 1 },
  };
}

async function handleRevenueQuery(msg: string): Promise<BotResponse> {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86_400_000);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [all, week, month] = await Promise.all([
    prisma.supporter.findMany({
      where: { status: "success" },
      select: { amount: true },
    }),
    prisma.supporter.findMany({
      where: { status: "success", createdAt: { gte: weekAgo } },
      select: { amount: true },
    }),
    prisma.supporter.findMany({
      where: { status: "success", createdAt: { gte: monthStart } },
      select: { amount: true },
    }),
  ]);

  const scope = /month/.test(msg) ? "month" : /week/.test(msg) ? "week" : "all";
  const rows = scope === "month" ? month : scope === "week" ? week : all;
  const sum = rows.reduce((s, x) => s + x.amount, 0);
  const label = scope === "month" ? "this month" : scope === "week" ? "this week" : "all-time";

  return {
    reply: `₹${sum.toLocaleString("en-IN")} from ${rows.length} supporter${rows.length === 1 ? "" : "s"} ${label}. (All-time: ₹${all
      .reduce((s, x) => s + x.amount, 0)
      .toLocaleString("en-IN")} from ${all.length}.)`,
    action: "query_revenue",
    actionResult: { scope, sum, count: rows.length },
  };
}

async function handleExpenseQuery(msg: string): Promise<BotResponse> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [all, month, recurring] = await Promise.all([
    prisma.expense.aggregate({ _sum: { amountINR: true }, _count: true }),
    prisma.expense.aggregate({
      _sum: { amountINR: true },
      _count: true,
      where: { date: { gte: monthStart } },
    }),
    prisma.expense.aggregate({
      _sum: { amountINR: true },
      where: { isRecurring: true, recurringInterval: "monthly" },
    }),
  ]);

  const scope = /month/.test(msg) ? "month" : "all";
  const target = scope === "month" ? month : all;
  const label = scope === "month" ? "this month" : "all-time";

  return {
    reply: `₹${(target._sum.amountINR ?? 0).toLocaleString("en-IN")} across ${target._count} expenses ${label}. Monthly recurring: ₹${(recurring._sum.amountINR ?? 0).toLocaleString("en-IN")}.`,
    action: "query_expense",
    actionResult: {
      scope,
      sum: target._sum.amountINR ?? 0,
      count: target._count,
      recurringMonthly: recurring._sum.amountINR ?? 0,
    },
  };
}

async function handleStaleQuery(): Promise<BotResponse> {
  const threshold = 24 * 3_600_000;
  const now = Date.now();
  const districts = await prisma.district.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
  });
  const stale: string[] = [];
  for (const d of districts) {
    const [weather, news, crops] = await Promise.all([
      prisma.weatherReading.findFirst({
        where: { districtId: d.id },
        orderBy: { recordedAt: "desc" },
        select: { recordedAt: true },
      }),
      prisma.newsItem.findFirst({
        where: { districtId: d.id },
        orderBy: { publishedAt: "desc" },
        select: { publishedAt: true },
      }),
      prisma.cropPrice.findFirst({
        where: { districtId: d.id },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ]);
    const modules: string[] = [];
    if (!weather || now - weather.recordedAt.getTime() > threshold) modules.push("weather");
    if (!news || now - news.publishedAt.getTime() > threshold) modules.push("news");
    if (!crops || now - crops.date.getTime() > threshold) modules.push("crops");
    if (modules.length > 0) stale.push(`${d.name} (${modules.join(", ")})`);
  }
  return {
    reply: stale.length === 0
      ? "All active districts look fresh. Nothing stale in weather/news/crops."
      : `${stale.length} district${stale.length === 1 ? "" : "s"} have stale data (>24h):\n${stale.map((s) => `• ${s}`).join("\n")}`,
    action: "query_stale",
    actionResult: { count: stale.length },
  };
}

async function handlePendingQuery(): Promise<BotResponse> {
  const [unreadAlerts, pendingReviews, unreadFeedback] = await Promise.all([
    prisma.adminAlert.count({ where: { read: false } }),
    prisma.reviewQueue.count({ where: { status: "pending" } }),
    prisma.feedback.count({ where: { status: "new" } }),
  ]);
  return {
    reply: [
      `• ${unreadAlerts} unread alert${unreadAlerts === 1 ? "" : "s"}`,
      `• ${pendingReviews} AI insight${pendingReviews === 1 ? "" : "s"} pending review`,
      `• ${unreadFeedback} unread feedback item${unreadFeedback === 1 ? "" : "s"}`,
    ].join("\n"),
    action: "query_pending",
    actionResult: { unreadAlerts, pendingReviews, unreadFeedback },
  };
}

async function handleCountQuery(msg: string): Promise<BotResponse> {
  if (/district/.test(msg)) {
    const [active, total] = await Promise.all([
      prisma.district.count({ where: { active: true } }),
      prisma.district.count(),
    ]);
    return {
      reply: `${active} active districts out of ${total} in the DB.`,
      action: "count_districts",
      actionResult: { active, total },
    };
  }
  if (/supporter/.test(msg)) {
    const n = await prisma.supporter.count({ where: { status: "success" } });
    return { reply: `${n} successful supporters.`, action: "count_supporters", actionResult: { n } };
  }
  if (/feedback/.test(msg)) {
    const n = await prisma.feedback.count();
    return { reply: `${n} feedback items.`, action: "count_feedback", actionResult: { n } };
  }
  return { reply: "Counts available: districts, supporters, feedback. Try 'count districts'." };
}

async function handleAddExpense(raw: string): Promise<BotResponse> {
  // Parse patterns like:
  //   "Add expense: Vercel Pro ₹1680"
  //   "Add expense: Domain 700"
  //   "Add expense: OpenRouter $10"
  const stripped = raw.replace(/^\s*add expense\s*:?/i, "").trim();
  const amountMatch = stripped.match(
    /([₹$])\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:inr|usd|\$|₹)?/i
  );
  if (!amountMatch) {
    return {
      reply:
        "Couldn't parse the amount. Try: 'Add expense: Vercel Pro ₹1680' or 'Add expense: OpenRouter $10'.",
    };
  }
  const isUsd = (amountMatch[1] ?? "") === "$" || /\$|usd/i.test(stripped);
  const numStr = (amountMatch[2] ?? amountMatch[3] ?? "").replace(/,/g, "");
  const amount = Number(numStr);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { reply: `Parsed amount was invalid: "${numStr}".` };
  }

  const rate = 84;
  const amountINR = isUsd ? Math.round(amount * rate) : amount;
  const amountUSD = isUsd ? amount : null;

  // Rest of string = description; strip the matched amount + symbol.
  const description = stripped
    .replace(amountMatch[0], "")
    .replace(/\b(inr|usd)\b/gi, "")
    .trim() || "Misc expense";

  const expense = await prisma.expense.create({
    data: {
      date: new Date(),
      category: inferCategory(description),
      description,
      amountINR,
      amountUSD,
      exchangeRate: isUsd ? rate : null,
      paymentMethod: null,
      isRecurring: false,
      createdBy: "admin_bot",
    },
  });

  return {
    reply: `Added expense: ₹${amountINR.toLocaleString("en-IN")}${
      amountUSD ? ` ($${amountUSD.toFixed(2)} @ ₹${rate}/$1)` : ""
    } for "${description}" (${expense.category}) on ${new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}. ✓`,
    action: "create_expense",
    actionResult: { id: expense.id, amountINR, description, category: expense.category },
  };
}

function inferCategory(desc: string): string {
  const s = desc.toLowerCase();
  if (/vercel|netlify|railway|host/.test(s)) return "hosting";
  if (/domain|godaddy|namecheap/.test(s)) return "domain";
  if (/openrouter|anthropic|openai|gemini|claude|ai credit/.test(s)) return "ai_credits";
  if (/figma|design/.test(s)) return "design";
  if (/instagram|ads|marketing|promo/.test(s)) return "marketing";
  if (/lawyer|legal|compliance/.test(s)) return "legal";
  if (/laptop|monitor|keyboard|hardware/.test(s)) return "hardware";
  return "other";
}
