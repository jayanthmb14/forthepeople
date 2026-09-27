/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  Stored Hindi / Kannada text next to an English record
// ═══════════════════════════════════════════════════════════════════════
//  Some records carry a hand-written local-script copy of an English field
//  (Leader.roleLocal, Leader.nameLocal, InfraProject.nameLocal …). It is
//  written once and nobody re-reads it when the English is corrected, so it
//  can go stale. Sept 2026 audit (language area):
//    • Siddaramaiah, role "MLA, Varuna", roleLocal "ವಿಧಾನಸಭಾ ಸದಸ್ಯ
//      (ಮುಖ್ಯಮಂತ್ರಿ)" — "MLA (Chief Minister)" three months after he
//      resigned as Chief Minister, on the page that names D. K. Shivakumar
//      as Chief Minister.
//    • H. D. Kumaraswamy, role "Union Minister for Heavy Industries & Steel;
//      MP, Mandya", roleLocal "ಲೋಕಸಭಾ ಸದಸ್ಯ" (Lok Sabha member) — the
//      Kannada page dropped the ministry; the same for Shobha Karandlaje.
//  Rule (verified or hidden): a stored local role is served only while it
//  names the same offices as the English role; otherwise the checked
//  English role is shown. Pure functions, unit tested in
//  tests/local-text.test.ts.

/**
 * Offices a role can name, each as the English words and the Hindi /
 * Kannada words for it. A local role must name exactly the offices its
 * English role names. "Minister" also matches Chief / Prime Minister on
 * both sides (ಮುಖ್ಯಮಂತ್ರಿ contains ಮಂತ್ರಿ), so those stay consistent.
 */
const OFFICES: ReadonlyArray<{ office: string; en: RegExp[]; local: RegExp }> = [
  { office: "chief-minister", en: [/\bchief minister\b/i, /\bCM\b/], local: /ಮುಖ್ಯ ?ಮಂತ್ರಿ|मुख्य ?मंत्री/ },
  { office: "deputy-chief-minister", en: [/\bdeputy chief minister\b/i, /\bDeputy CM\b/i], local: /ಉಪ ?ಮುಖ್ಯ ?ಮಂತ್ರಿ|उप ?मुख्य ?मंत्री/ },
  { office: "prime-minister", en: [/\bprime minister\b/i], local: /ಪ್ರಧಾನ ?ಮಂತ್ರಿ|ಪ್ರಧಾನಿ|प्रधान ?मंत्री/ },
  { office: "minister", en: [/\bminister\b/i, /\bCM\b/], local: /ಸಚಿವ|ಮಂತ್ರಿ|मंत्री/ },
  { office: "mp", en: [/\bMP\b|\bM\.P\./, /\bmember of parliament\b|\blok sabha\b|\brajya sabha\b/i], local: /ಸಂಸದ|ಲೋಕಸಭ|ರಾಜ್ಯಸಭ|ಸಂಸತ್|सांसद|लोकसभा|राज्यसभा|संसद/ },
  { office: "mla", en: [/\bMLA\b|\bM\.L\.A\./, /\blegislative assembly\b/i], local: /ಶಾಸಕ|ವಿಧಾನ ?ಸಭ|विधायक|विधान ?सभा/ },
  { office: "mlc", en: [/\bMLC\b|\bM\.L\.C\./, /\blegislative council\b/i], local: /ವಿಧಾನ ?ಪರಿಷತ್|विधान ?परिषद/ },
  { office: "opposition", en: [/\bleader of (the )?opposition\b/i], local: /ವಿರೋಧ ?ಪಕ್ಷ|विपक्ष|प्रतिपक्ष/ },
  { office: "governor", en: [/\bgovernor\b/i], local: /ರಾಜ್ಯಪಾಲ|ಗವರ್ನರ್|राज्यपाल|गवर्नर/ },
  { office: "mayor", en: [/\bmayor\b/i], local: /ಮೇಯರ್|ಮಹಾಪೌರ|महापौर|मेयर/ },
];

/** The offices a role names ("MLA, Varuna" → {mla}), read as English or as Hindi/Kannada. */
export function officesNamed(text: string, script: "en" | "local"): Set<string> {
  const found = new Set<string>();
  for (const o of OFFICES) {
    const hit = script === "en" ? o.en.some((re) => re.test(text)) : o.local.test(text);
    if (hit) found.add(o.office);
  }
  return found;
}

/**
 * True when a stored Hindi/Kannada role still says what the English role
 * says: both name the same offices (Chief Minister, minister, MP, MLA …).
 * "ವಿಧಾನಸಭಾ ಸದಸ್ಯ" fits "MLA, Hebbal" (the constituency is shown on its own
 * line); "ವಿಧಾನಸಭಾ ಸದಸ್ಯ (ಮುಖ್ಯಮಂತ್ರಿ)" does not fit "MLA, Varuna", and
 * "ಲೋಕಸಭಾ ಸದಸ್ಯ" does not fit "Union Minister …; MP, Mandya".
 */
export function localRoleMatches(role: string | null | undefined, roleLocal: string | null | undefined): boolean {
  const local = roleLocal?.trim();
  const english = role?.trim();
  if (!local || !english) return false;
  const a = officesNamed(english, "en");
  const b = officesNamed(local, "local");
  if (a.size !== b.size) return false;
  for (const o of a) if (!b.has(o)) return false;
  return true;
}

/** The local role to serve with a record: the stored one when it still fits, else null (the page shows the English role). */
export function shownRoleLocal(role: string | null | undefined, roleLocal: string | null | undefined): string | null {
  return localRoleMatches(role, roleLocal) ? roleLocal!.trim() : null;
}
