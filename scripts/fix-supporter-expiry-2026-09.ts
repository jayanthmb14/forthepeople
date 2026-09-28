/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * One-off clean-up of Supporter rows the payment code used to leave without
 * an expiry (Sept 2026 review; the code that stops new ones is in the same
 * branch: src/lib/supporter-payment.ts, src/lib/record-supporter-payment.ts,
 * the Razorpay webhook).
 *
 *  1. Stopped monthly supporters — isRecurring, subscriptionStatus
 *     "cancelled" or "expired", expiresAt empty. The district / state /
 *     top-tier sponsor lists still show them. → expiresAt = now (their paid
 *     period ended long ago; the webhook now sets this itself).
 *  2. One-time Razorpay supporters with no expiry — written by the old
 *     webhook or the old admin Sync. They are shown forever.
 *     → expiresAt = what the amount earns from the payment date
 *       (calculateOneTimeExpiry: 30 / 60 / 90 days), which is in the past
 *       for most of them, so they drop off the lists.
 *  3. REPORT ONLY: one-time rows whose Razorpay data carries an invoice_id —
 *     monthly subscription debits stored as extra one-time gifts. They are
 *     counted in the totals; decide by hand whether to delete them (the
 *     subscription's own row already stands for that money).
 *
 * DRY RUN by default: prints every planned change and exits. Pass --confirm
 * to apply (one transaction). Idempotent: rows that already have an expiry
 * are not selected. Nothing else is touched.
 *
 *   npx tsx scripts/fix-supporter-expiry-2026-09.ts            # dry run
 *   npx tsx scripts/fix-supporter-expiry-2026-09.ts --confirm  # apply
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { calculateOneTimeExpiry } from "../src/lib/contribution-expiry";

const CONFIRM = process.argv.includes("--confirm");

function invoiceIdOf(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const v = (data as Record<string, unknown>).invoice_id;
  return typeof v === "string" && v ? v : null;
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const now = new Date();
  const updates: Array<{ id: string; expiresAt: Date; why: string }> = [];

  const stopped = await prisma.supporter.findMany({
    where: { isRecurring: true, subscriptionStatus: { in: ["cancelled", "expired"] }, expiresAt: null },
    select: { id: true, tier: true, amount: true, subscriptionStatus: true, isPublic: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  for (const r of stopped) {
    updates.push({ id: r.id, expiresAt: now, why: `monthly ${r.tier} ₹${r.amount} ${r.subscriptionStatus}, public=${r.isPublic}` });
  }

  const oneTime = await prisma.supporter.findMany({
    where: { isRecurring: false, source: "razorpay", status: "success", expiresAt: null },
    select: { id: true, tier: true, amount: true, isPublic: true, createdAt: true, razorpayData: true },
    orderBy: { createdAt: "asc" },
  });
  const invoiceRows: string[] = [];
  for (const r of oneTime) {
    const invoice = invoiceIdOf(r.razorpayData);
    if (invoice) invoiceRows.push(`${r.id}  ₹${r.amount}  ${r.createdAt.toISOString().slice(0, 10)}  invoice ${invoice}`);
    updates.push({
      id: r.id,
      expiresAt: calculateOneTimeExpiry(r.amount, r.createdAt),
      why: `one-time ${r.tier} ₹${r.amount} from ${r.createdAt.toISOString().slice(0, 10)}, public=${r.isPublic}${invoice ? ", SUBSCRIPTION DEBIT" : ""}`,
    });
  }

  console.log(`${stopped.length} stopped monthly supporter(s) without an expiry`);
  console.log(`${oneTime.length} one-time Razorpay supporter(s) without an expiry\n`);
  for (const u of updates) console.log(`  ${u.id}  expiresAt → ${u.expiresAt.toISOString().slice(0, 10)}   (${u.why})`);
  if (invoiceRows.length) {
    console.log(`\nREVIEW BY HAND — ${invoiceRows.length} one-time row(s) that are monthly debits (counted in totals):`);
    for (const line of invoiceRows) console.log(`  ${line}`);
  }

  if (!CONFIRM) {
    console.log("\nDry run — nothing written. Re-run with --confirm to apply.");
  } else if (updates.length) {
    await prisma.$transaction(updates.map((u) => prisma.supporter.update({ where: { id: u.id }, data: { expiresAt: u.expiresAt } })));
    console.log(`\nUpdated ${updates.length} row(s). Clear the supporter lists: npx tsx scripts/bust-all-caches.ts`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
