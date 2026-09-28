// Client-safe helpers for the Tenders module (JSON serialiser, copy guard).
// Money on tender pages is formatted by useMoney() (src/components/money/).
// Must NOT import from @/lib/db — used by client components.

// ── BigInt-safe serialiser ────────────────────────────────────────────────
export function serializeForJson<T>(value: T): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeForJson);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeForJson(v);
    }
    return out;
  }
  return value;
}

// ── Banned-adjective guard ────────────────────────────────────────────────
const BANNED = /(suspicious|corrupt|dubious|cartel|irregular|fraudulent)/i;
export function assertFactualCopy(text: string, where: string): void {
  if (BANNED.test(text)) {
    throw new Error(`[Tenders] Banned adjective in ${where}: "${text}". Use factual, neutral language.`);
  }
}
