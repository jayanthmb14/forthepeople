/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Read side of live-text translation. Swaps English fields for the STORED
// translation in the visitor's language. One indexed query, no provider
// call — switching language never spends translation credits.
//
// A field is only swapped when its translation was made from the current
// English (sourceHash matches). Otherwise the English stays, and the row's
// `lang` stays "en" so screen readers and fonts treat it as English.
import { prisma } from "@/lib/db";
import { TRANSLATED_FIELDS, isMissingTable, sourceHash, type EntityType } from "./content";

export interface Localized {
  /** Language of the translated fields: the requested locale, or "en" when not translated yet. */
  lang?: string;
}

export async function localizeRows<T extends { id: string }>(
  entityType: EntityType,
  rows: T[],
  locale: string | null,
): Promise<(T & Localized)[]> {
  if (!locale || rows.length === 0) return rows;
  const fields = TRANSLATED_FIELDS[entityType];
  try {
    const found = await prisma.contentTranslation.findMany({
      where: { entityType, locale, entityId: { in: rows.map((r) => r.id) }, field: { in: [...fields] } },
      select: { entityId: true, field: true, text: true, sourceHash: true },
    });
    if (found.length === 0) return rows.map((r) => ({ ...r, lang: "en" }));
    const byKey = new Map(found.map((f) => [`${f.entityId}|${f.field}`, f]));
    return rows.map((row) => {
      const copy: Record<string, unknown> = { ...row };
      let swapped = 0;
      let english = 0;
      for (const field of fields) {
        const original = copy[field];
        if (typeof original !== "string" || !original.trim()) continue;
        const t = byKey.get(`${row.id}|${field}`);
        if (t && t.sourceHash === sourceHash(original)) {
          copy[field] = t.text;
          swapped++;
        } else {
          english++;
        }
      }
      // Mixed rows (title translated, summary not yet) stay marked English
      // so nothing is announced in the wrong language.
      copy.lang = swapped > 0 && english === 0 ? locale : "en";
      return copy as T & Localized;
    });
  } catch (err) {
    if (!isMissingTable(err)) console.warn("[translation] overlay skipped:", err instanceof Error ? err.message : err);
    return rows;
  }
}

export async function localizeRow<T extends { id: string }>(
  entityType: EntityType,
  row: T | null,
  locale: string | null,
): Promise<(T & Localized) | null> {
  if (!row) return row;
  const [out] = await localizeRows(entityType, [row], locale);
  return out;
}
