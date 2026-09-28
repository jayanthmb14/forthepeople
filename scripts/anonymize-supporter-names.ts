/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Find Supporter rows whose `name` column actually holds a phone number or an
 * email address (early checkout forms put the wrong field there) and, only
 * with --confirm, replace that name with the neutral label "Supporter".
 *
 * The phone/email COLUMNS are left untouched — this only stops PII from being
 * shown as a public display name. /api/payment/contributors already masks
 * such rows at read time; this script cleans the stored data too.
 *
 * Usage (from the repo root, needs DATABASE_URL in .env / .env.local):
 *
 *   npx tsx scripts/anonymize-supporter-names.ts            # DRY RUN — lists rows, changes nothing
 *   npx tsx scripts/anonymize-supporter-names.ts --confirm  # actually rewrites the names
 *
 * Output never prints a full phone number or email — values are masked.
 * The original value is preserved in `originalName` (existing moderation
 * column) so a mistaken run can be reversed by hand.
 */

import "./_env"; // MUST be first — loads .env then .env.local
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { looksLikeContactInfo } from "../src/lib/supporter-name";

const CONFIRM = process.argv.includes("--confirm");
const REPLACEMENT = "Supporter";

// The public APIs mask with looksLikeContactInfo() (src/lib/supporter-name.ts);
// these two only name the reason in the dry-run list.
const PHONE_LIKE = /^\+?\d[\d\s-]{7,}$/;
const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Reason = "phone" | "email" | "too-short" | "contact-in-text";

function classify(raw: string): Reason | null {
  const name = (raw || "").trim();
  if (PHONE_LIKE.test(name)) return "phone";
  if (EMAIL_LIKE.test(name)) return "email";
  const letters = name.match(/\p{L}/gu)?.length ?? 0;
  if (letters < 2) return "too-short";
  // A phone number or e-mail inside other text ("Call 98765 43210").
  if (looksLikeContactInfo(name)) return "contact-in-text";
  return null;
}

/** Mask a value for terminal output: "98•••••••10", "j•••@e•••.com". */
function mask(value: string, reason: Reason): string {
  const v = value.trim();
  if (reason === "email") {
    const [local, domain = ""] = v.split("@");
    const tld = domain.includes(".") ? domain.slice(domain.lastIndexOf(".")) : "";
    return `${local.slice(0, 1)}•••@${domain.slice(0, 1)}•••${tld}`;
  }
  if (v.length <= 4) return "••••";
  return `${v.slice(0, 2)}${"•".repeat(Math.max(3, v.length - 4))}${v.slice(-2)}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Add it to .env.local and re-run.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  // Names never contain letters+digits mixes legitimately, but we filter in JS
  // (not SQL) so the regexes above are the single source of truth.
  const rows = await prisma.supporter.findMany({
    select: { id: true, name: true, tier: true, amount: true, createdAt: true, isPublic: true },
    orderBy: { createdAt: "desc" },
  });

  const flagged = rows
    .map((r) => ({ ...r, reason: classify(r.name) }))
    .filter((r): r is typeof r & { reason: Reason } => r.reason !== null);

  console.log(`Total Supporter rows: ${rows.length}`);
  console.log(`Rows whose name looks like contact info: ${flagged.length}`);
  console.log(CONFIRM ? "\nMode: --confirm (WILL UPDATE)\n" : "\nMode: DRY RUN (nothing will change; pass --confirm to apply)\n");

  for (const r of flagged) {
    const when = r.createdAt ? r.createdAt.toISOString().slice(0, 10) : "?";
    console.log(
      `  ${r.id}  [${r.reason}]  "${mask(r.name, r.reason)}"  tier=${r.tier} ₹${r.amount} public=${r.isPublic} created=${when}`
    );
  }

  if (!CONFIRM || flagged.length === 0) {
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const r of flagged) {
    await prisma.supporter.update({
      where: { id: r.id },
      data: {
        name: REPLACEMENT,
        // Keep the original for reversibility + audit; flag so admin UI shows it.
        originalName: r.name,
        nameFlagged: true,
      },
    });
    updated++;
  }

  console.log(`\nUpdated ${updated} row(s) → name = "${REPLACEMENT}".`);
  console.log(
    "Now clear the public supporter lists: the keys are in src/lib/supporter-cache.ts " +
      "(or run scripts/bust-all-caches.ts)."
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
