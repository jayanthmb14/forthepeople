/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Robust JSON extraction from model answers — PURE, unit-tested
// (tests/ai-json.test.ts).
//
// Models do not always answer with bare JSON. Seen in production:
//   - ```json fences around the answer
//   - a sentence of preamble ("Here is the analysis: {...}")
//   - reasoning text leaked into the answer ("Okay, the user wants… {...}")
//   - <think>…</think> blocks
//   - a top-level ARRAY instead of an object (citizen tips)
//   - a trailing comma before } or ]
// extractJSON() copes with all of these. When there are several JSON-looking
// pieces (e.g. "see [1] … {…}") it returns the LARGEST one that parses, so
// a citation like "[1]" never wins over the real answer.
// ═══════════════════════════════════════════════════════════

export type JSONShape = "object" | "array" | "any";

export class AIJSONError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIJSONError";
  }
}

/** Remove <think>/<thinking>/<reasoning> blocks some models leak into the answer. */
export function stripReasoning(text: string): string {
  return text
    .replace(/<(think|thinking|reasoning)>[\s\S]*?<\/\1>/gi, "")
    // an unclosed <think> at the start: drop everything up to the first { or [
    .replace(/^\s*<(think|thinking|reasoning)>[\s\S]*?(?=[{[])/i, "")
    .trim();
}

function matchesShape(value: unknown, shape: JSONShape): boolean {
  if (shape === "array") return Array.isArray(value);
  if (shape === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  return value !== null && typeof value === "object";
}

function tryParse(s: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    /* try the lenient form */
  }
  // Lenient: trailing commas before a closer (",}" / ",]").
  const repaired = s.replace(/,\s*([}\]])/g, "$1");
  if (repaired !== s) {
    try {
      return { ok: true, value: JSON.parse(repaired) };
    } catch {
      /* give up */
    }
  }
  return { ok: false };
}

/**
 * Index of the bracket that closes the one at `start`, honouring strings and
 * escapes; -1 when unbalanced or mismatched.
 */
function findClosing(text: string, start: number): number {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      const open = stack.pop();
      if ((ch === "}" && open !== "{") || (ch === "]" && open !== "[")) return -1;
      if (stack.length === 0) return i;
    }
  }
  return -1;
}

const MAX_SCAN_CHARS = 200_000;

/**
 * Parse the JSON a model returned. Throws AIJSONError when nothing usable is
 * found (callers treat that as "this model failed, try the next").
 */
export function extractJSON(text: string, shape: JSONShape = "any"): unknown {
  const cleaned = stripReasoning(String(text ?? "")).slice(0, MAX_SCAN_CHARS);
  if (!cleaned) throw new AIJSONError("empty answer");

  // 1. The whole answer is JSON.
  const whole = tryParse(cleaned);
  if (whole.ok && matchesShape(whole.value, shape)) return whole.value;

  // 2. Fenced blocks (```json … ```), first one that fits.
  for (const m of cleaned.matchAll(/```(?:json|JSON)?\s*([\s\S]*?)```/g)) {
    const r = tryParse(m[1].trim());
    if (r.ok && matchesShape(r.value, shape)) return r.value;
  }

  // 3. Balanced {…} / […] pieces anywhere in the text; keep the largest that parses.
  let best: { value: unknown; length: number } | null = null;
  let i = 0;
  while (i < cleaned.length) {
    const ch = cleaned[i];
    if (ch !== "{" && ch !== "[") {
      i++;
      continue;
    }
    const end = findClosing(cleaned, i);
    if (end === -1) {
      i++;
      continue;
    }
    const r = tryParse(cleaned.slice(i, end + 1));
    if (r.ok) {
      if (matchesShape(r.value, shape)) {
        const length = end + 1 - i;
        if (!best || length > best.length) best = { value: r.value, length };
      }
      // Skip past a piece that parsed: its nested parts are never the answer
      // (an array of objects is not "an object"; unwrap lists with asArray).
      i = end + 1;
    } else {
      i++;
    }
  }
  if (best) return best.value;

  throw new AIJSONError(`Could not parse JSON (${shape}): ${cleaned.slice(0, 200)}`);
}

/**
 * For answers that should be a list: accept a bare array, or an object that
 * wraps one list (e.g. {"tips":[…]}), which is what JSON mode returns when a
 * model is forced to answer with an object. Returns [] when there is no list.
 */
export function asArray<T = unknown>(value: unknown, preferredKey?: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (preferredKey && Array.isArray(obj[preferredKey])) return obj[preferredKey] as T[];
    const lists = Object.values(obj).filter(Array.isArray);
    if (lists.length === 1) return lists[0] as T[];
  }
  return [];
}
