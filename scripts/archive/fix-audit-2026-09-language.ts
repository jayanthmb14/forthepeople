/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Sept 2026 audit, language area: stored Hindi/Kannada text that is wrong
 * or went stale after the English was corrected. Rule: verified or hidden.
 * A local-script value is replaced only with a value the audit's verifier
 * (or the source named per change) supports; otherwise it is hidden by
 * setting the field to null, so the page shows the checked English text.
 *
 * DRY RUN by default: prints every change (table, id, field, current → new,
 * source) and exits. Pass --confirm to apply, all in one transaction (each
 * write also gets an UpdateLog row).
 *
 *   npx tsx scripts/fix-audit-2026-09-language.ts            # dry run
 *   npx tsx scripts/fix-audit-2026-09-language.ts --confirm  # apply
 *
 * Rows are matched by id. A field that already holds the new value is
 * reported as "already applied"; a field that holds neither the value seen
 * on the check date nor the new value is skipped and flagged ("changed
 * since check") — look at it by hand. Nothing is deleted.
 *
 * The code side of the same findings (so the errors cannot come back):
 *   src/lib/local-text.ts — the leaders APIs serve a roleLocal only while it
 *     names the same offices as the English role;
 *   scripts/fix-leaders-2026-09.ts, scripts/fix-records-2026-09.ts — a
 *     renamed or re-verified row loses a local-script copy written for the
 *     old English.
 * Not changed here: the tier of the High Court Chief Justice rows (finding
 * 14). The Leadership page now lists every judicial role under "Courts"
 * whatever the stored tier (src/lib/civic/leader-level.ts); changing the
 * stored tier would make scripts/fix-leaders-2026-09.ts, which adds those
 * judges at tier 5 and matches rows by tier, add them a second time on a
 * re-run.
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRM = process.argv.includes("--confirm");
const CHECKED = "2026-09-28";

type Table = "Leader" | "InfraProject";

interface Change {
  table: Table;
  id: string;
  /** Short label for the plan: district · record. */
  label: string;
  field: "roleLocal" | "nameLocal";
  /** Value seen with read-only SQL on the check date. */
  was: string | null;
  /** New value; null = hidden (the page then shows the English field). */
  set: string | null;
  /** Finding number in the audit's language.json. */
  finding: number;
  why: string;
  source: string;
}

const CHANGES: Change[] = [
  {
    table: "Leader", id: "cmnakakte00010mxnp6z9488x", label: "Mysuru · Siddaramaiah (MLA, Varuna)", field: "roleLocal",
    was: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)", set: "ವಿಧಾನಸಭಾ ಸದಸ್ಯ", finding: 0,
    why: "Kannada role said 'MLA (Chief Minister)'; he resigned as CM on 28 May 2026 and D. K. Shivakumar has been CM since 3 June 2026. The English role is 'MLA, Varuna'; 'ವಿಧಾನಸಭಾ ಸದಸ್ಯ' (MLA) is what the other Mysuru MLA rows carry (constituency shown on its own line).",
    source: "https://newsonair.gov.in/d-k-shivakumar-sworn-in-as-karnataka-chief-minister/",
  },
  {
    table: "Leader", id: "cmmv9n835000fubxnznikgoc2", label: "Mandya · N. Chaluvarayaswamy (MLA, Nagamangala)", field: "nameLocal",
    was: "ಎನ್. ಚೌವರಾಯಸ್ವಾಮಿ", set: "ಎನ್. ಚಲುವರಾಯಸ್ವಾಮಿ", finding: 9,
    why: "Kannada name was written from the old English misspelling 'Chauvarayaswamy' (reads 'Chauvarayaswamy'); Kannada Wikipedia and Kannada press write ಚಲುವರಾಯಸ್ವಾಮಿ.",
    source: "https://kn.wikipedia.org/wiki/%E0%B2%8E%E0%B2%A8%E0%B3%8D._%E0%B2%9A%E0%B2%B2%E0%B3%81%E0%B2%B5%E0%B2%B0%E0%B2%BE%E0%B2%AF_%E0%B2%B8%E0%B3%8D%E0%B2%B5%E0%B2%BE%E0%B2%AE%E0%B2%BF",
  },
  {
    table: "Leader", id: "cmmv9n8350009ubxnywbwp24n", label: "Mandya · H.D. Kumaraswamy", field: "roleLocal",
    was: "ಲೋಕಸಭಾ ಸದಸ್ಯ", set: null, finding: 13,
    why: "Hidden: the Kannada role 'Lok Sabha member' drops his Union ministry; the checked English role is 'Union Minister for Heavy Industries & Steel; MP, Mandya', which /kn now shows.",
    source: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2206267&reg=3&lang=2",
  },
  {
    table: "Leader", id: "cmnakarqs00001axnanftn3jv", label: "Bengaluru Urban · Shobha Karandlaje", field: "roleLocal",
    was: "ಲೋಕಸಭಾ ಸದಸ್ಯ", set: null, finding: 13,
    why: "Hidden: the Kannada role 'Lok Sabha member' drops 'Union Minister of State'; the checked English role is 'Member of Parliament (Lok Sabha) — Union Minister of State', which /kn now shows.",
    source: "https://www.nimsme.gov.in/news-article/ms-shobha-karandlaje-hon-ble-union-minister-of-state-for-msme-and-labour-employment-govt-of-india-inaugurated-the-vendor-development-programme-on-14-july-2026-at-ni-msme-hyderabad",
  },
  {
    table: "InfraProject", id: "cmmv9ng2w006zubxn3abbcmb2", label: "Mandya · Bengaluru–Mysuru Expressway (NH-275) — Mandya district stretch", field: "nameLocal",
    was: "NH-275 ನಾಲ್ಕು ಪಥ ಅಗಲೀಕರಣ", set: "ಬೆಂಗಳೂರು–ಮೈಸೂರು ಎಕ್ಸ್‌ಪ್ರೆಸ್‌ವೇ (ಎನ್‌ಎಚ್-275) — ಮಂಡ್ಯ ಜಿಲ್ಲೆಯ ಭಾಗ", finding: 10,
    why: "Kannada name 'NH-275 four-lane widening' was left from an older seed row; the checked English name is the six-lane Bengaluru–Mysuru Expressway, Mandya district stretch (opened 12 March 2023). The new Kannada name says the same as the English.",
    source: "https://www.business-standard.com/article/current-affairs/pm-modi-inaugurates-118-km-long-bengaluru-mysuru-expressway-project-123031200403_1.html",
  },
];

/** Prisma delegate name for a table ("InfraProject" → "infraProject"). */
const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);

const show = (v: string | null | undefined) => (v === null || v === undefined ? "null" : JSON.stringify(v));

type Planned = { change: Change; districtId: string | null };

async function main() {
  // Guard: one change per row and field, so two changes never fight.
  const seen = new Set<string>();
  for (const c of CHANGES) {
    const key = `${c.table}:${c.id}:${c.field}`;
    if (seen.has(key)) throw new Error(`Duplicate change for ${key}`);
    seen.add(key);
    if (!/^https:\/\//.test(c.source)) throw new Error(`Source must be an https URL: ${key}`);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  type Delegate = {
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
    update: (a: unknown) => Promise<unknown>;
  };
  const model = (client: unknown, table: string) => (client as Record<string, Delegate>)[delegateName(table)];

  const plan: Planned[] = [];
  const counts: Record<string, { update: number; hide: number; delete: number; already: number; drift: number; gone: number }> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, hide: 0, delete: 0, already: 0, drift: 0, gone: 0 });

  try {
    console.log(`Language audit fixes (Sept 2026) — ${CONFIRM ? "APPLYING" : "DRY RUN"}; values checked ${CHECKED}\n`);
    for (const c of CHANGES) {
      const row = await model(prisma, c.table).findUnique({ where: { id: c.id }, select: { id: true, name: true, districtId: true, [c.field]: true } });
      console.log(`• ${c.table} ${c.id} — ${c.label} (finding ${c.finding})`);
      console.log(`  why:    ${c.why}`);
      console.log(`  source: ${c.source}`);
      if (!row) {
        console.log("  → row not found — skipped");
        tally(c.table).gone++;
        continue;
      }
      const current = (row[c.field] as string | null) ?? null;
      if (current === c.set) {
        console.log(`  ${c.field}: ${show(current)} — already applied, skipped\n`);
        tally(c.table).already++;
        continue;
      }
      if (current !== c.was) {
        console.log(`  ${c.field}: now ${show(current)}, was ${show(c.was)} on ${CHECKED} — CHANGED SINCE CHECK, skipped; review by hand\n`);
        tally(c.table).drift++;
        continue;
      }
      const kind = c.set === null ? "hide (set to null)" : "update";
      console.log(`  ${c.field}: ${show(current)} → ${show(c.set)}   [${kind}]\n`);
      plan.push({ change: c, districtId: (row.districtId as string | null) ?? null });
      if (c.set === null) tally(c.table).hide++;
      else tally(c.table).update++;
    }

    console.log("══ Summary ══");
    for (const [t, n] of Object.entries(counts)) {
      console.log(
        `${t.padEnd(14)} update ${n.update}   hide ${n.hide}   delete ${n.delete}   already done ${n.already}   changed-since-check ${n.drift}   not found ${n.gone}`,
      );
    }
    console.log(`Total changes to apply: ${plan.length}`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    if (plan.length === 0) {
      console.log("Nothing to do.");
      return;
    }
    await prisma.$transaction(async (tx) => {
      for (const { change: c, districtId } of plan) {
        await model(tx, c.table).update({ where: { id: c.id }, data: { [c.field]: c.set } });
        await tx.updateLog.create({
          data: {
            source: "api",
            actorLabel: "scripts/fix-audit-2026-09-language",
            tableName: c.table,
            recordId: c.id,
            action: "update",
            fieldName: c.field,
            oldValue: c.was,
            newValue: c.set,
            districtId,
            moduleName: c.table === "Leader" ? "leadership" : "infrastructure",
            description: `${c.label}: ${c.why}`,
            details: { source: c.source, finding: c.finding, checked: CHECKED },
          },
        });
      }
    });
    console.log(`\nDone: applied ${plan.length} changes in one transaction.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
