/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Does a 5-field cron expression fire at a given minute (UTC)?
//
// On Cloudflare one Cron Trigger fires every 5 minutes (cloudflare/worker.ts)
// and runs every vercel.json cron whose schedule matches that minute, so the
// schedules keep living in one place. Supports what vercel.json uses: "*",
// "*/n", "a", "a,b", "a-b" and "a-b/n". Day-of-week 0 and 7 are both Sunday;
// as in standard cron, when both day fields are restricted either may match.

function fieldMatches(field: string, value: number, min: number, max: number): boolean {
  return field.split(",").some((part) => {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    if (!Number.isInteger(step) || step < 1) throw new Error(`bad cron step: ${part}`);
    let lo = min;
    let hi = max;
    if (range !== "*") {
      const [a, b] = range.split("-").map(Number);
      if (!Number.isInteger(a) || (b !== undefined && !Number.isInteger(b))) throw new Error(`bad cron field: ${part}`);
      lo = a;
      hi = b ?? (stepText === undefined ? a : max);
    }
    return value >= lo && value <= hi && (value - lo) % step === 0;
  });
}

export function cronMatches(expr: string, at: Date): boolean {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) throw new Error(`cron needs 5 fields: ${expr}`);
  const [minute, hour, dom, month, dow] = f;
  if (!fieldMatches(minute, at.getUTCMinutes(), 0, 59)) return false;
  if (!fieldMatches(hour, at.getUTCHours(), 0, 23)) return false;
  if (!fieldMatches(month, at.getUTCMonth() + 1, 1, 12)) return false;
  const day = at.getUTCDay();
  const domOk = fieldMatches(dom, at.getUTCDate(), 1, 31);
  const dowOk = fieldMatches(dow, day, 0, 7) || (day === 0 && fieldMatches(dow, 7, 0, 7));
  if (dom !== "*" && dow !== "*") return domOk || dowOk;
  return domOk && dowOk;
}
