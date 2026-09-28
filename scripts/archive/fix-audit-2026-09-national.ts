/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Data fixes for the September 2026 audit, "national" area (India dashboard,
 * home, prices). Rule: verified or hidden — every new value below was read
 * on the source named with it (official pages first). Code fixes for the
 * same findings are in the v54/fix-national commits; this script only
 * corrects rows the code cannot.
 *
 * DRY RUN by default: prints every change (table, id, field, old → new,
 * source) and exits. --confirm applies all of them in ONE transaction.
 *
 *   npx tsx scripts/fix-audit-2026-09-national.ts            # dry run
 *   npx tsx scripts/fix-audit-2026-09-national.ts --confirm  # apply
 *
 * Rows are matched by id (looked up with read-only SQL on 28 Sep 2026).
 * A field already holding the new value is skipped. If a field now holds
 * neither the value seen on the check date nor the new one, the whole fix
 * for that row is skipped and flagged "CHANGED SINCE CHECK" — look at it
 * by hand. Only updates here: no row is deleted. (Hidden values are hidden
 * in code: implausible mandi prices by PLAUSIBLE_CROP_PRICE, the railway
 * and internet world ranks by removing them from the static rank list.)
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRM = process.argv.includes("--confirm");

type Table = "IndiaIndicator" | "IndiaTimeSeries" | "IndiaStateBreakdown";
type Value = string | number | null;

interface Fix {
  table: Table;
  id: string;
  label: string;
  /** field → new value. Dates as "YYYY-MM-DD" (stored as IST midnight, like scripts/fix-records-2026-09.ts). */
  set: Record<string, Value>;
  /** field → value seen on the check date. */
  was: Record<string, Value>;
  why: string;
  source: string;
  says: string;
  /** Audit finding number(s) in audit/national.json. */
  finding: string;
}

const CHECKED = "2026-09-28";
const DATE_FIELDS = new Set(["asOfDate", "previousAsOfDate", "date"]);

const TIGERS_2018 = "https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=1580622&reg=3&lang=2";
const TIGERS_2022_DETAILED = "https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1943922&reg=48&lang=2";
const GST_AUG_2026 = "https://tutorial.gst.gov.in/downloads/news/aug_2026_gst_revenue_report_final_for_publishing_monthly.pdf";
const WB_LIFE_EXP = "https://api.worldbank.org/v2/country/IND/indicator/SP.DYN.LE00.IN?format=json&date=1990:2024";

const STATE_TIGER_ROWS: Array<[string, string]> = [
  ["cmolgbfk700080xxncidem94p", "Madhya Pradesh 785"],
  ["cmolgbfm200090xxn8k184is6", "Karnataka 563"],
  ["cmolgbfns000a0xxn7ju98xij", "Uttarakhand 560"],
  ["cmolgbfpi000b0xxnndx1raum", "Maharashtra 444"],
  ["cmolgbfr6000c0xxngxon4qfk", "Tamil Nadu 306"],
];

const FIXES: Fix[] = [
  // ── #1 Tigers: 2018 was 2,967, not 3,167 (the 2022 camera-trap minimum) ──
  {
    table: "IndiaIndicator",
    id: "cmolgbevx00000xxn37l7rthx",
    label: "wildlife-tigers · tiger_population_total · previousValue (2018)",
    set: { previousValue: 2967 },
    was: { previousValue: 3167 },
    why: "3,167 is the 2022 minimum; the 2018 (4th cycle) estimate is 2,967. The 'Up 16.3% since 2018' badge becomes +24.1% (3,682 vs 2,967).",
    source: TIGERS_2018,
    says: "The count of tigers in India has risen to 2967, in 2018 (PIB, 29 Jul 2019)",
    finding: "1",
  },
  {
    table: "IndiaTimeSeries",
    id: "cmolgbfgr00060xxn5hmtdgc8",
    label: "wildlife-tigers · tiger_population_total · 2018 point",
    set: { value: 2967 },
    was: { value: 3167 },
    why: "The trend chart's 2018 point used the 2022 minimum (3,167); the 2018 estimate is 2,967 (the other points are cycle means too).",
    source: TIGERS_2018,
    says: "The count of tigers in India has risen to 2967, in 2018",
    finding: "1",
  },
  // ── #25 Tiger state figures were released on 29 Jul 2023, not 9 Apr 2023 ──
  ...STATE_TIGER_ROWS.map(
    ([id, name]): Fix => ({
      table: "IndiaStateBreakdown",
      id,
      label: `wildlife-tigers · state figure · ${name} · asOfDate`,
      set: { asOfDate: "2023-07-29" },
      was: { asOfDate: "2023-04-09" },
      why: "State-wise estimates came with the detailed Status of Tigers 2022 report (29 Jul 2023); the 9 Apr 2023 release gave only the national minimum. The number is right; only the date changes.",
      source: TIGERS_2022_DETAILED,
      says: "All India Tiger Estimation-2022: Release of the detailed Report (29 Jul 2023)",
      finding: "25",
    }),
  ),
  // ── #5 135.43 crore is ALL telephone subscribers, not wireless ──
  {
    table: "IndiaIndicator",
    id: "cmond77sn000ipyxn96y0nz33",
    label: "infra-telecom · subscribers_crore · metricLabel",
    set: { metricLabel: "Telephone subscribers, wireless + wireline (crore)" },
    was: { metricLabel: "Wireless subscribers (crore)" },
    why: "The value (135.43 crore, end of July 2026) is TRAI's total of wireless + wireline; wireless alone is 130.6 crore. The label now says what the number counts.",
    source: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2304128",
    says: "Total telephone subscribers 1,354.28 million (wireless 1,306.27 million) — the row's own notes",
    finding: "5",
  },
  // ── #9 GST: August 2026 is published ──
  {
    table: "IndiaIndicator",
    id: "cmon46vbb0003icxnr1f5cym5",
    label: "budget-gst · monthly_collection_inr_lakh_crore (Aug 2026)",
    set: {
      numericValue: 1.9985,
      asOfDate: "2026-08-31",
      source: "GSTN · GST revenue report, August 2026 (provisional)",
      sourceUrl: GST_AUG_2026,
      notes:
        "Gross GST August 2026 = Rs 1,99,853 crore (+14.8% y/y), net Rs 1,68,057 crore; provisional (GSTN monthly report, 2 Sep 2026). July 2026 was Rs 2,11,205 crore.",
    },
    was: { numericValue: 2.11, asOfDate: "2026-07-31" },
    why: "The page called July (Rs 2.11 lakh crore) 'the latest official figure'; GSTN published August on 2 Sep 2026: Rs 1,99,853 crore gross.",
    source: GST_AUG_2026,
    says: "Total Gross GST Revenue Aug-26: 1,99,853 (Rs crore), 14.8% growth; Total Net GST Revenue 1,68,057",
    finding: "9",
  },
  // ── #26 Life expectancy gain since 1990, World Bank basis ──
  {
    table: "IndiaIndicator",
    id: "cmon8jkwo0002duxne3incuzp",
    label: "health-overview · life_expectancy_change_1990",
    set: {
      numericValue: 13.6,
      asOfDate: "2024-07-01",
      source: "World Bank WDI (SP.DYN.LE00.IN), 1990 to 2024",
      dataQuality: "derived",
      derivationNotes: "72.235 years (2024) minus 58.618 years (1990) = 13.6 years, both World Bank WDI SP.DYN.LE00.IN (UN WPP based). Not the SRS basis of the life expectancy headline.",
    },
    was: { numericValue: 14 },
    why: "The World Bank series gives 58.6 → 72.2 = +13.6 years (rounded up to 14 before), dated with the check day instead of the data year; it is a derived figure.",
    source: WB_LIFE_EXP,
    says: "India life expectancy 1990: 58.618; 2024: 72.235",
    finding: "26",
  },
  // ── #29 Seat counts cite the Secretariats, not Articles 81 / 80 ──
  {
    table: "IndiaIndicator",
    id: "cmonde79p000a0uxni6mr0efn",
    label: "elections-loksabha · loksabha_seats_total · source",
    set: { source: "Lok Sabha Secretariat", sourceUrl: "https://sansad.in/ls/" },
    was: { source: "Constitution Article 81" },
    why: "Article 81 only caps the House at 550 (530 + 20); 543 comes from the Delimitation Order 2008. The know-india-parliament row already cites the Lok Sabha Secretariat for the same 543.",
    source: "https://sansad.in/ls/",
    says: "Lok Sabha: 543 elected seats (the site's own know-india-parliament row, source Lok Sabha Secretariat)",
    finding: "29",
  },
  {
    table: "IndiaIndicator",
    id: "cmonde7g2000c0uxncvkkrjms",
    label: "elections-rajyasabha · rajyasabha_seats_total · source",
    set: { source: "Rajya Sabha Secretariat", sourceUrl: "https://sansad.in/rs/" },
    was: { source: "Constitution Article 80" },
    why: "Article 80 caps the House at 250; 245 = 233 elected (Fourth Schedule) + 12 nominated. The know-india-parliament row already cites the Rajya Sabha Secretariat for 245.",
    source: "https://sansad.in/rs/",
    says: "Rajya Sabha: 245 members (the site's own know-india-parliament row, source Rajya Sabha Secretariat)",
    finding: "29",
  },
];

// ── helpers (same conventions as scripts/fix-records-2026-09.ts) ─────────

const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);
const istDay = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
const istMidnight = (d: string) => new Date(`${d}T00:00:00+05:30`);

function toDbValue(field: string, v: Value): unknown {
  if (v !== null && DATE_FIELDS.has(field) && typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return istMidnight(v);
  return v;
}

function same(field: string, current: unknown, planned: Value): boolean {
  if (current === null || current === undefined) return planned === null;
  if (planned === null) return false;
  if (current instanceof Date) {
    if (typeof planned === "string" && /^\d{4}-\d{2}-\d{2}$/.test(planned)) return istDay(current) === planned;
    const want = toDbValue(field, planned);
    return want instanceof Date && want.getTime() === current.getTime();
  }
  if (typeof planned === "number") return Math.abs(Number(current) - planned) < 1e-6;
  return String(current) === String(planned);
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return istDay(v);
  if (typeof v === "string") return JSON.stringify(v.length > 80 ? v.slice(0, 77) + "…" : v);
  return String(v);
}

type Delegate = {
  findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
  update: (a: unknown) => Promise<unknown>;
};

async function main() {
  const seen = new Set<string>();
  for (const f of FIXES) {
    const key = `${f.table}:${f.id}`;
    if (seen.has(key)) throw new Error(`Duplicate fix for ${key}`);
    seen.add(key);
  }

  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const model = (client: unknown, table: string) => (client as Record<string, Delegate>)[delegateName(table)];
  const plan: Array<{ fix: Fix; data: Record<string, unknown> }> = [];
  const counts: Record<string, { update: number; done: number; gone: number; drift: number }> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, done: 0, gone: 0, drift: 0 });

  console.log(`Audit 2026-09 · national · ${CONFIRM ? "APPLY" : "DRY RUN"} · ${FIXES.length} planned fixes (checked ${CHECKED})`);
  try {
    const TABLE_ORDER: Table[] = ["IndiaIndicator", "IndiaTimeSeries", "IndiaStateBreakdown"];
    const ordered = [...FIXES].sort((a, b) => TABLE_ORDER.indexOf(a.table) - TABLE_ORDER.indexOf(b.table));
    let currentTable = "";
    for (const f of ordered) {
      if (f.table !== currentTable) {
        currentTable = f.table;
        console.log(`\n══ ${f.table} ══`);
      }
      const row = await model(p, f.table).findUnique({ where: { id: f.id } });
      console.log(`\n• UPDATE ${f.table} ${f.id} — ${f.label}   [finding #${f.finding}]`);
      console.log(`  why:    ${f.why}`);
      console.log(`  source: ${f.source}`);
      console.log(`  says:   ${f.says}`);
      if (!row) {
        console.log("  → row not found — skipped");
        tally(f.table).gone++;
        continue;
      }
      const data: Record<string, unknown> = {};
      let drift = false;
      for (const [field, planned] of Object.entries(f.set)) {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        const current = row[field];
        if (same(field, current, planned)) {
          console.log(`    ${field}: ${show(current)} (already ${show(planned)})`);
          continue;
        }
        if (field in f.was && !same(field, current, f.was[field])) {
          console.log(`    ${field}: now ${show(current)}, was ${show(f.was[field])} on ${CHECKED} — CHANGED SINCE CHECK`);
          drift = true;
          continue;
        }
        console.log(`    ${field}: ${show(current)} → ${show(planned)}`);
        data[field] = toDbValue(field, planned);
      }
      if (drift) {
        console.log("  → a field changed since the check — whole fix skipped; review by hand");
        tally(f.table).drift++;
        continue;
      }
      if (Object.keys(data).length === 0) {
        console.log("  → already applied — skipped");
        tally(f.table).done++;
        continue;
      }
      plan.push({ fix: f, data });
      tally(f.table).update++;
    }

    console.log("\n══ Summary ══");
    for (const [t, c] of Object.entries(counts)) {
      console.log(
        `${t.padEnd(20)} update ${String(c.update).padStart(2)}   delete  0   hide  0   already done ${String(c.done).padStart(2)}   not found ${String(c.gone).padStart(2)}   changed-since-check ${String(c.drift).padStart(2)}`,
      );
    }
    console.log(`Total changes to apply: ${plan.length} (all updates; no deletes; no rows hidden here)`);

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply, all in one transaction.");
      return;
    }
    if (plan.length === 0) {
      console.log("Nothing to do.");
      return;
    }
    await p.$transaction(
      async (tx) => {
        for (const { fix, data } of plan) await model(tx, fix.table).update({ where: { id: fix.id }, data });
      },
      { timeout: 120_000, maxWait: 30_000 },
    );
    console.log(`\nDone: applied ${plan.length} changes in one transaction.`);
    console.log("Clear the Redis caches (admin → Cache) so pages pick this up at once.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
