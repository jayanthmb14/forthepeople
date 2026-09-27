/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Dam names, full levels and reading checks — pure
//
// WHY: the Karnataka Water Resources portal calls KRS "K.R.Sagara Dam",
// the hand seed calls it "Krishna Raja Sagara (KRS)" in Mandya and
// "KRS Dam (Krishnaraja Sagara)" in Mysuru, and dam-config.ts says
// "KRS (Krishna Raja Sagara)". The water page groups readings by the
// exact name, so a live reading under a new spelling showed up as a
// SECOND KRS card next to the stale seed one. Now every spelling maps to
// one canonical dam. Sept 2026 audit: keeping each district's old seed
// spelling left KRS with two names on the site (Mandya vs Mysuru), so the
// collector now always writes the canonical name (storedDamName) and
// renames a same-day row it finds under an older spelling (damSpellings).
//
// Full reservoir levels (FRL) are feet above mean sea level — the same
// unit the portal's Reservior_Level uses. KRS was listed as 2,624 ft,
// which is wrong: KRS FRL is 752.50 m = 2,468.8 ft (gauge 124.80 ft; on
// 27 Sep 2026 the portal gave 2,449.28 ft at 55 % full, 19.5 ft below
// FRL, matching a gauge of ~105 ft). Kabini 696.16 m = 2,284 ft,
// Hemavathy 890.63 m = 2,922 ft and Harangi 871.38 m = 2,859 ft were
// already right.
// ═══════════════════════════════════════════════════════════

export interface CanonicalDam {
  /** The name we store for a district that has no reading of this dam yet. */
  name: string;
  nameLocal?: string;
  /** Every spelling seen in the portal, the seed or dam-config.ts. */
  aliases: string[];
  /** Full reservoir level, feet above MSL (portal unit). */
  frlFt?: number;
}

export const CANONICAL_DAMS: CanonicalDam[] = [
  {
    name: "Krishna Raja Sagara (KRS)",
    nameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ",
    aliases: [
      "K.R.Sagara Dam",
      "K.R. Sagara",
      "KRS",
      "KRS Dam",
      "KRS (Krishna Raja Sagara)",
      "KRS Dam (Krishnaraja Sagara)",
      "Krishnaraja Sagara",
      "Krishna Raja Sagara",
      "Krishna Raja Sagara (KRS)",
    ],
    frlFt: 2468.8,
  },
  {
    name: "Hemavathi Reservoir",
    nameLocal: "ಹೇಮಾವತಿ ಜಲಾಶಯ",
    aliases: ["Hemavathy Dam", "Hemavathi Dam", "Hemavathy Reservoir", "Hemavathi Reservoir", "Gorur Dam"],
    frlFt: 2922,
  },
  {
    name: "Kabini Reservoir",
    nameLocal: "ಕಬಿನಿ ಜಲಾಶಯ",
    aliases: ["Kabini Dam", "Kabini Reservoir", "Kabini"],
    frlFt: 2284,
  },
  {
    name: "Harangi Reservoir",
    nameLocal: "ಹಾರಂಗಿ ಜಲಾಶಯ",
    aliases: ["Harangi Dam", "Harangi Reservoir", "Harangi"],
    frlFt: 2859,
  },
];

/** "K.R.Sagara Dam" → "krsagara"; drops punctuation and the words dam/reservoir/lake. */
function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dam|reservoir|lake|jalashaya)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");
}

const BY_ALIAS = new Map<string, CanonicalDam>();
for (const dam of CANONICAL_DAMS) {
  for (const a of [dam.name, ...dam.aliases]) BY_ALIAS.set(normalise(a), dam);
}

/** The canonical dam for any known spelling, or null. */
export function canonicalDam(name: string): CanonicalDam | null {
  return BY_ALIAS.get(normalise(name)) ?? null;
}

/** The name to store a reading under: the canonical name, else the source's own name. */
export function storedDamName(sourceName: string): string {
  return canonicalDam(sourceName)?.name ?? sourceName;
}

/**
 * Every stored spelling of the same dam, the canonical name first — to find
 * a reading stored under an older spelling (and rename it).
 */
export function damSpellings(sourceName: string, existingNames: string[]): string[] {
  const name = storedDamName(sourceName);
  const dam = canonicalDam(sourceName);
  const older = dam ? existingNames.filter((n) => n !== name && canonicalDam(n) === dam) : [];
  return [name, ...new Set(older)];
}

/** Portal date "27 Sep 2026" → UTC midnight of that day, or null. */
export function parsePortalDate(s: string | undefined | null): Date | null {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})$/.exec((s ?? "").trim());
  if (!m) return null;
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months.indexOf(m[2].toLowerCase());
  if (month < 0) return null;
  const dd = Number(m[1]);
  const d = new Date(Date.UTC(Number(m[3]), month, dd));
  return d.getUTCDate() === dd ? d : null;
}

/** A reading older than this (by its own date) is not stored as current. */
export const MAX_DAM_READING_AGE_DAYS = 7;

export interface DamFigures {
  date: Date | null;
  percentFull: number | null;
  level: number | null;
  storage: number | null;
  maxStorage: number | null;
  inflow: number | null;
  outflow: number | null;
}

/**
 * Checks before a reservoir reading is stored. Returns the problems
 * (empty = fine). Rejects: missing figures, a date older than 7 days or in
 * the future, % full outside 0–105, storage above 105 % of design, and a
 * % full that disagrees with storage ÷ design by more than 8 points.
 */
export function damReadingProblems(f: DamFigures, nowMs: number): string[] {
  const p: string[] = [];
  if (!f.date) return ["no valid date"];
  const ageDays = (nowMs - f.date.getTime()) / 86_400_000;
  if (ageDays > MAX_DAM_READING_AGE_DAYS) p.push(`reading is ${Math.floor(ageDays)} days old`);
  if (f.date.getTime() > nowMs + 36 * 3600_000) p.push("date is in the future");
  if (f.percentFull === null || f.level === null || f.storage === null || f.maxStorage === null) {
    p.push("a figure is missing");
    return p;
  }
  if (f.inflow === null || f.outflow === null || f.inflow < 0 || f.outflow < 0) p.push("inflow/outflow missing or negative");
  if (f.percentFull < 0 || f.percentFull > 105) p.push(`${f.percentFull}% full is out of range`);
  if (f.maxStorage <= 0 || f.storage < 0) p.push("storage or capacity is not positive");
  else {
    if (f.storage > f.maxStorage * 1.05) p.push("storage is above capacity");
    const derived = (f.storage / f.maxStorage) * 100;
    if (Math.abs(derived - f.percentFull) > 8) p.push(`${f.percentFull}% full disagrees with storage (${derived.toFixed(0)}%)`);
  }
  return p;
}

/**
 * The full level to store with a reading: our FRL when the reading's level
 * fits under it (3 ft margin), else 0 = "not known". A level above the FRL
 * means our FRL is wrong for this dam, and a wrong FRL must not be shown.
 */
export function checkedFullLevel(damName: string, level: number): { frlFt: number; mismatch: boolean } {
  const frl = canonicalDam(damName)?.frlFt;
  if (!frl) return { frlFt: 0, mismatch: false };
  if (level > frl + 3) return { frlFt: 0, mismatch: true };
  return { frlFt: frl, mismatch: false };
}
