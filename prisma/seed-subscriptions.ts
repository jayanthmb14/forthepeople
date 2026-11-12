/**
 * ForThePeople.in — Seed default service subscriptions
 * Run: npx tsx prisma/seed-subscriptions.ts
 *
 * Idempotent: upserts by serviceName. Safe to re-run.
 */
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const USD_TO_INR = 84;

interface Seed {
  serviceName: string;
  displayName: string;
  provider: string;
  category: string;
  plan: string;
  costUSD: number;
  costINR: number;
  billingCycle: string;
  status: string;
  accountEmail?: string;
  dashboardUrl?: string;
  notes?: string;
}

const services: Seed[] = [
  {
    serviceName: "openrouter",
    displayName: "OpenRouter",
    provider: "openrouter.ai",
    category: "ai",
    plan: "Usage-based",
    costUSD: 0,
    costINR: 0,
    billingCycle: "usage-based",
    status: "active",
    dashboardUrl: "https://openrouter.ai/settings/credits",
    notes: "$10 credit limit set. Tiered routing: free models → Gemini Pro → Claude Sonnet",
  },
  {
    serviceName: "upstash_redis",
    displayName: "Upstash Redis",
    provider: "upstash.com",
    category: "cache",
    plan: "Free",
    costUSD: 0,
    costINR: 0,
    billingCycle: "monthly",
    status: "active",
    dashboardUrl: "https://console.upstash.com",
    notes: "REST API client. 10,000 req/day limit on free tier.",
  },
  {
    serviceName: "neon_postgresql",
    displayName: "Neon PostgreSQL",
    provider: "neon.tech",
    category: "database",
    plan: "Free",
    costUSD: 0,
    costINR: 0,
    billingCycle: "monthly",
    status: "active",
    dashboardUrl: "https://console.neon.tech",
    notes: "0.5GB storage limit. PgBouncer connection pooling included.",
  },
  {
    serviceName: "domain",
    displayName: "forthepeople.in Domain",
    provider: "domain-registrar",
    category: "domain",
    plan: "Domain",
    costUSD: 0,
    costINR: 700,
    billingCycle: "yearly",
    status: "active",
    notes: "Purchased via registrar. Renewal yearly.",
  },
  {
    serviceName: "resend",
    displayName: "Resend",
    provider: "resend.com",
    category: "email",
    plan: "Free",
    costUSD: 0,
    costINR: 0,
    billingCycle: "monthly",
    status: "active",
    dashboardUrl: "https://resend.com/overview",
    notes: "2FA recovery + admin alert emails. 100 emails/day free.",
  },
  {
    serviceName: "vercel_pro",
    displayName: "Vercel Pro",
    provider: "vercel.com",
    category: "hosting",
    plan: "Pro",
    costUSD: 20,
    costINR: 20 * USD_TO_INR,
    billingCycle: "monthly",
    status: "active",
    dashboardUrl: "https://vercel.com/dashboard",
    notes: "Auto-deploy from GitHub. Cron jobs, serverless functions.",
  },
  {
    serviceName: "plausible",
    displayName: "Plausible Analytics",
    provider: "plausible.io",
    category: "analytics",
    plan: "Free (community)",
    costUSD: 0,
    costINR: 0,
    billingCycle: "monthly",
    status: "active",
    dashboardUrl: "https://plausible.io",
    notes: "Cookieless, DPDP-friendly. One script tag in layout.tsx.",
  },
  {
    serviceName: "sentry",
    displayName: "Sentry",
    provider: "sentry.io",
    category: "monitoring",
    plan: "Free",
    costUSD: 0,
    costINR: 0,
    billingCycle: "monthly",
    status: "active",
    accountEmail: "forthepeople1547@gmail.com",
    dashboardUrl: "https://sentry.io",
    notes: "5K errors/month, 10K transactions. Upgrade when traffic > 25K concurrent.",
  },
  {
    serviceName: "razorpay",
    displayName: "Razorpay",
    provider: "razorpay.com",
    category: "payment",
    plan: "Standard",
    costUSD: 0,
    costINR: 0,
    billingCycle: "usage-based",
    status: "active",
    dashboardUrl: "https://dashboard.razorpay.com",
    notes: "2% + GST per transaction. Live keys configured.",
  },
];

async function main() {
  let created = 0;
  let updated = 0;

  for (const s of services) {
    const data = {
      name: s.displayName,
      displayName: s.displayName,
      serviceName: s.serviceName,
      provider: s.provider,
      category: s.category,
      plan: s.plan,
      costUSD: s.costUSD,
      costINR: s.costINR,
      billingCycle: s.billingCycle,
      status: s.status,
      accountEmail: s.accountEmail ?? null,
      dashboardUrl: s.dashboardUrl ?? null,
      notes: s.notes ?? null,
    };

    // serviceName is @unique — use upsert so re-runs don't duplicate rows.
    const existing = await prisma.subscription.findUnique({
      where: { serviceName: s.serviceName },
      select: { id: true },
    });
    if (existing) {
      await prisma.subscription.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.subscription.create({ data });
      created++;
    }
  }

  console.log(`[seed-subscriptions] created ${created}, updated ${updated}`);
}

main()
  .catch((err) => {
    console.error("[seed-subscriptions] failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
