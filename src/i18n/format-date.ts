/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Dates in the reader's language (pure; server and client). A thin layer
// over Intl.DateTimeFormat that fixes one CLDR quirk for Kannada:
//
//   Intl, kn, { day, month: "short", year }  →  "ಸೆಪ್ಟೆಂ 27,2026"
//
// Month first with no space after the comma, while the same page writes
// dates without a year day first ("27 ಸೆಪ್ಟೆಂ"), and truncated month names
// ("ಆಗ" for August also reads as the word "then"). Sept 2026 language audit.
// For Kannada this writes every date day first with the full month name:
// "27 ಸೆಪ್ಟೆಂಬರ್ 2026", "ಭಾನುವಾರ, 27 ಸೆಪ್ಟೆಂಬರ್ 2026", "27 ಸೆಪ್ಟೆಂಬರ್".
// Every other language is passed to Intl unchanged. Unit tested in
// tests/format-date.test.ts.

type Opts = Intl.DateTimeFormatOptions;

const DATE_FIELDS = ["weekday", "era", "year", "month", "day"] as const;
const TIME_FIELDS = ["dayPeriod", "hour", "minute", "second", "fractionalSecondDigits"] as const;

function isKannada(intl: string): boolean {
  return /^kn(-|$)/i.test(intl);
}

/** Kannada options: full month names, and dateStyle spelled out as fields. */
function knOptions(opts: Opts): Opts | null {
  const o: Opts = { ...opts };
  if (o.timeStyle) return null; // leave date+time styles to Intl
  if (o.dateStyle && o.dateStyle !== "short") {
    const full = o.dateStyle === "full";
    delete o.dateStyle;
    Object.assign(o, { day: "numeric", month: "long", year: "numeric" }, full ? { weekday: "long" } : {});
  }
  if (o.month === "short" || o.month === "narrow") o.month = "long";
  return o;
}

/** A formatter with Intl.DateTimeFormat's `format`, Kannada written day first. */
export function dateFormatter(intl: string, opts: Opts = {}): { format: (d: Date | string | number) => string } {
  const plain = new Intl.DateTimeFormat(intl, opts);
  const o = isKannada(intl) ? knOptions(opts) : null;
  if (!o) return { format: (d) => plain.format(new Date(d)) };
  const kn = new Intl.DateTimeFormat(intl, o);
  const textMonth = o.month === "long";
  // CLDR puts the month first only when day, text month and year appear together.
  if (!(textMonth && o.day && o.year)) return { format: (d) => kn.format(new Date(d)) };
  const hasTime = TIME_FIELDS.some((k) => o[k] !== undefined);
  const timeOnly: Opts = { timeZone: o.timeZone, hour12: o.hour12, hourCycle: o.hourCycle };
  for (const k of TIME_FIELDS) if (o[k] !== undefined) (timeOnly as Record<string, unknown>)[k] = o[k];
  const time = hasTime ? new Intl.DateTimeFormat(intl, timeOnly) : null;
  return {
    format: (d) => {
      const date = new Date(d);
      const parts = kn.formatToParts(date);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
      const weekday = part("weekday");
      const out = `${weekday ? `${weekday}, ` : ""}${part("day")} ${part("month")} ${part("year")}`;
      return time ? `${out}, ${time.format(date)}` : out;
    },
  };
}

/**
 * Drop-in for `date.toLocaleDateString(intl, opts)`: the same default
 * fields (numeric day/month/year when no date field is asked for), with
 * Kannada written day first.
 */
export function formatDate(d: Date | string | number, intl: string, opts: Opts = {}): string {
  const hasDate = opts.dateStyle !== undefined || opts.timeStyle !== undefined || DATE_FIELDS.some((k) => opts[k] !== undefined);
  const o: Opts = hasDate ? opts : { ...opts, year: "numeric", month: "numeric", day: "numeric" };
  return dateFormatter(intl, o).format(d);
}
