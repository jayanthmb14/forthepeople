/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: court cases waiting, how old they are, how fast they are decided
// Source: National Judicial Data Grid (NJDG), public dashboards only
// Run by: /api/cron/scrape-courts (twice a day, oldest district first)
//
// Replaces src/scraper/jobs/courts.ts, which called an NJDG API
// (njdgnew/api/index.php) that no longer exists (404 since the v3 site)
// and never wrote a real row. See src/lib/courts/sources.ts for what NJDG
// publishes without a captcha and which NJDG units make each district.
//
// Per district unit, three requests (≥ 3 s apart, one domain):
//   1. the district page             waiting cases, age, last month
//   2. the Pending dashboard (JSON)  cases filed / decided each year,
//                                    and a second count of the waiting cases
//   3. the Disposed dashboard (JSON) last year's decided cases by time taken
// plus one request per High Court (reused by the state's districts for a day).
//
// Honesty: a unit whose numbers do not add up is dropped (see
// buildUnit); a district with no usable unit writes NOTHING and keeps
// its last good snapshot. The collector never estimates.
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/db";
import {
  highCourtFor,
  njdgHighCourtUrl,
  njdgUnitsFor,
  njdgUnitUrl,
  NJDG_DISTRICT_BASE,
  NJDG_HIGH_COURT_BASE,
  type NjdgUnit,
} from "@/lib/courts/sources";
import {
  parseDashboardPage,
  parseDisposedDashboard,
  parseNjdgJson,
  parsePendingDashboard,
  type DashboardPage,
} from "@/lib/courts/parse";
import {
  buildUnit,
  courtStatRows,
  istYear,
  SNAPSHOT_VERSION,
  type CourtUnitSnapshot,
  type CourtsSnapshot,
} from "@/lib/courts/snapshot";
import {
  HIGH_COURT_REUSE_MS,
  readHighCourt,
  writeCourtsSnapshot,
  writeHighCourt,
} from "@/lib/courts/store";
import type { JobContext, ScraperResult } from "../types";

const USER_AGENT = "ForThePeople.in/1.0 (+https://forthepeople.in; citizen transparency, read-only)";
/** At most one request every 3 s to njdg.ecourts.gov.in (CLAUDE.md: 2–3 s per domain). */
const GAP_MS = 3_000;
const TIMEOUT_MS = 25_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** NJDG answered, but refused the request ("Invalid Request"): start a new session. */
class NjdgRefused extends Error {}

/** One NJDG site's session: its cookies and the rolling app_token. */
interface Session {
  cookies: Map<string, string>;
  token: string;
  started: boolean;
}

/**
 * A small polite HTTP client for NJDG, used the way NJDG's own pages use
 * the site:
 *   • one request at a time, ≥ GAP_MS apart (both sites share one domain);
 *   • a timeout on every call and one retry on a network error or 5xx;
 *   • a session per site (district courts / High Courts) that starts at
 *     the site's home page — a session that starts anywhere else is
 *     refused about half the time;
 *   • the rolling "app_token" NJDG returns with every answer is sent
 *     back with the next request, as its dashboard script does.
 */
export class NjdgClient {
  private lastAt = 0;
  private sessions = new Map<string, Session>();
  /** Requests made (for the run log). */
  requests = 0;

  constructor(private readonly gapMs = GAP_MS) {}

  private session(base: string): Session {
    let s = this.sessions.get(base);
    if (!s) {
      s = { cookies: new Map(), token: "", started: false };
      this.sessions.set(base, s);
    }
    return s;
  }

  /** Forget a site's session (after NJDG refused a request). */
  reset(base: string) {
    this.sessions.delete(base);
  }

  private async wait() {
    const due = this.lastAt + this.gapMs - Date.now();
    if (due > 0) await sleep(due);
    this.lastAt = Date.now();
  }

  private async send(s: Session, url: string, body?: string): Promise<string> {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      await this.wait();
      this.requests++;
      try {
        const headers: Record<string, string> = {
          "User-Agent": USER_AGENT,
          Accept: body ? "application/json, text/javascript, */*" : "text/html",
        };
        if (s.cookies.size) headers.Cookie = [...s.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
        if (body) {
          // The request format NJDG's own dashboard script sends (ecourts.js
          // ajaxCall): a form post marked as XHR with its fixed "delimeter"
          // header. Without it NJDG answers "Invalid Request".
          headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
          headers["X-Requested-With"] = "XMLHttpRequest";
          headers.delimeter = "KAUS475959";
        }
        const res = await fetch(url, {
          method: body ? "POST" : "GET",
          headers,
          body,
          signal: AbortSignal.timeout(TIMEOUT_MS),
          cache: "no-store",
        });
        const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
        for (const c of set) {
          const [pair] = c.split(";");
          const i = pair.indexOf("=");
          if (i > 0) s.cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
        }
        if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { final: true });
        return await res.text();
      } catch (err) {
        lastErr = err;
        if ((err as { final?: boolean }).final) break;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  private async start(base: string): Promise<Session> {
    const s = this.session(base);
    if (!s.started) {
      await this.send(s, base);
      s.started = true;
    }
    return s;
  }

  /** GET a server-rendered page, e.g. page(base, "home/index", {state_code, dist_code}). */
  async page(base: string, p: string, params: Record<string, string | number>): Promise<string> {
    const s = await this.start(base);
    const q = form({ ...params, app_token: s.token });
    const html = await this.send(s, `${base}?p=${p}&${q}`);
    const token = /name=["']app_token["'][^>]*value=["']([0-9a-f]+)["']/i.exec(html)?.[1];
    if (token) s.token = token;
    return html;
  }

  /** POST one of NJDG's JSON endpoints. Throws NjdgRefused on "Invalid Request". */
  async json(base: string, p: string, fields: Record<string, string | number>): Promise<Record<string, unknown>> {
    const s = await this.start(base);
    const text = await this.send(s, `${base}?p=${p}`, form({ ...fields, ajax_req: "true", app_token: s.token }));
    const json = parseNjdgJson(text);
    if (!json) throw new Error(`${p}: answer was not JSON`);
    if (typeof json.app_token === "string" && json.app_token) s.token = json.app_token;
    if (json.errormsg) throw new NjdgRefused(`${p}: NJDG refused the request`);
    return json;
  }
}

function form(fields: Record<string, string | number>): string {
  // NJDG expects its "~" state codes unescaped, like its own jQuery calls.
  return Object.entries(fields)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v)).replace(/%7E/gi, "~")}`)
    .join("&");
}

/** Read one district unit (three requests). Throws on a network failure. */
async function readUnitOnce(client: NjdgClient, u: NjdgUnit, fetchedAt: string) {
  const base = NJDG_DISTRICT_BASE;
  const where = { state_code: u.stateCode, dist_code: u.distCode };
  const page: DashboardPage | null = parseDashboardPage(await client.page(base, "home/index", where));
  if (!page) throw new NjdgRefused(`${u.name}: district page had no case totals`);

  const common = { ci_cri: 1, stage_ready: 3, ...where };
  const pending = parsePendingDashboard(await client.json(base, "home/newPendDashboard", { ...common, active_tab: "pending" }));

  const lastYear = istYear(fetchedAt) - 1;
  const decided = parseDisposedDashboard(
    await client.json(base, "home/newPendDashboard", { ...common, active_tab: "disposed", disp_year: lastYear }),
    lastYear,
  );

  return buildUnit({ name: u.name, kind: "district", url: njdgUnitUrl(u), page, pending, decided, fetchedAt });
}

/** readUnitOnce, with one fresh session if NJDG refused the first try. */
async function readUnit(client: NjdgClient, u: NjdgUnit, fetchedAt: string) {
  try {
    return await readUnitOnce(client, u, fetchedAt);
  } catch (err) {
    if (!(err instanceof NjdgRefused)) throw err;
    client.reset(NJDG_DISTRICT_BASE);
    return await readUnitOnce(client, u, fetchedAt);
  }
}

/** The state's High Court: reuse a read from the last 20 h, else one request. */
async function readHighCourtFor(
  client: NjdgClient,
  stateSlug: string,
  log: (m: string) => void,
  opts: { store: boolean },
): Promise<{ unit: CourtUnitSnapshot; fetchedAt: string } | null> {
  const hc = highCourtFor(stateSlug);
  if (!hc) return null;
  const cached = opts.store ? await readHighCourt(hc.stateCode) : null;
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < HIGH_COURT_REUSE_MS) return cached;
  try {
    const fetchedAt = new Date().toISOString();
    const page = parseDashboardPage(await client.page(NJDG_HIGH_COURT_BASE, "home/index", { state_code: hc.stateCode }));
    if (!page) {
      log(`Courts: ${hc.name}: HC-NJDG page had no case totals`);
      return cached;
    }
    const built = buildUnit({ name: hc.name, kind: "high-court", url: njdgHighCourtUrl(hc), page, fetchedAt });
    if ("error" in built) {
      log(`Courts: ${built.error}`);
      return cached;
    }
    const out = { unit: built.unit, fetchedAt };
    if (opts.store) await writeHighCourt(hc.stateCode, out);
    return out;
  } catch (err) {
    log(`Courts: ${hc.name}: ${err instanceof Error ? err.message : String(err)}`);
    return cached; // an older read, still dated, beats nothing
  }
}

export interface CollectOptions {
  client?: NjdgClient;
  /** Stop before starting another unit after this time (ms since epoch). */
  deadline?: number;
  /** Read/write the shared High Court cache in Redis (off for dry runs). */
  store?: boolean;
}

/**
 * Read one district from NJDG and build its snapshot. No database or
 * Redis writes (except the shared High Court cache when `store`).
 * Returns null snapshot with errors when no unit could be read.
 */
export async function collectCourtsSnapshot(
  ctx: Pick<JobContext, "districtSlug" | "stateSlug" | "log">,
  opts: CollectOptions = {},
): Promise<{ snapshot: CourtsSnapshot | null; errors: string[]; requests: number }> {
  const client = opts.client ?? new NjdgClient();
  const before = client.requests;
  const units = njdgUnitsFor(ctx.districtSlug);
  const errors: string[] = [];
  if (units.length === 0) return { snapshot: null, errors: [`no NJDG source mapped for ${ctx.districtSlug}`], requests: 0 };

  const fetchedAt = new Date().toISOString();
  const good: CourtUnitSnapshot[] = [];
  const missing: string[] = [];
  for (const u of units) {
    if (opts.deadline && Date.now() > opts.deadline) {
      errors.push(`${u.name}: time budget ran out`);
      missing.push(u.name);
      continue;
    }
    try {
      const built = await readUnit(client, u, fetchedAt);
      if ("error" in built) {
        errors.push(built.error);
        missing.push(u.name);
      } else {
        good.push(built.unit);
        const failed = built.unit.checks.filter((c) => !c.ok).map((c) => c.id);
        ctx.log(`Courts: ${u.name}: ${built.unit.pending.total} waiting; checks ${failed.length ? `FAILED ${failed.join(", ")}` : "ok"}`);
      }
    } catch (err) {
      errors.push(`${u.name}: ${err instanceof Error ? err.message : String(err)}`);
      missing.push(u.name);
    }
  }

  if (good.length === 0) return { snapshot: null, errors, requests: client.requests - before };

  const hc = await readHighCourtFor(client, ctx.stateSlug, ctx.log, { store: opts.store ?? false });
  const snapshot: CourtsSnapshot = {
    v: SNAPSHOT_VERSION,
    district: ctx.districtSlug,
    state: ctx.stateSlug,
    fetchedAt,
    units: good,
    missing,
    highCourt: hc?.unit ?? null,
    highCourtFetchedAt: hc?.fetchedAt ?? null,
  };
  return { snapshot, errors, requests: client.requests - before };
}

/**
 * The cron entry point for one district: read NJDG, then store the
 * snapshot in Redis and this year's figures in CourtStat.
 */
export async function scrapeCourtsNjdg(ctx: JobContext, opts: CollectOptions = {}): Promise<ScraperResult> {
  try {
    const { snapshot, errors } = await collectCourtsSnapshot(ctx, { ...opts, store: true });
    if (!snapshot) {
      const msg = errors.join("; ") || "no data";
      ctx.log(`Courts: nothing written — ${msg}`);
      return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg.slice(0, 300) };
    }

    const stored = await writeCourtsSnapshot(snapshot);
    if (!stored) ctx.log("Courts: Redis unavailable — snapshot not stored (CourtStat still written)");

    let recordsNew = 0;
    let recordsUpdated = 0;
    for (const row of courtStatRows(snapshot)) {
      const existing = await prisma.courtStat.findFirst({
        where: { districtId: ctx.districtId, year: row.year, courtName: row.courtName },
        select: { id: true, filed: true, disposed: true, pending: true, source: true },
      });
      if (!existing) {
        await prisma.courtStat.create({ data: { districtId: ctx.districtId, ...row } });
        recordsNew++;
      } else if (
        existing.filed !== row.filed ||
        existing.disposed !== row.disposed ||
        existing.pending !== row.pending ||
        existing.source !== row.source
      ) {
        await prisma.courtStat.update({
          where: { id: existing.id },
          data: { filed: row.filed, disposed: row.disposed, pending: row.pending, source: row.source },
        });
        recordsUpdated++;
      }
    }

    const partial = snapshot.missing.length > 0;
    ctx.log(`Courts: ${snapshot.units.length} unit(s) read${partial ? `, missing ${snapshot.missing.join(", ")}` : ""}; ${recordsNew} new, ${recordsUpdated} updated`);
    return {
      success: !partial,
      recordsNew: recordsNew + (stored ? 1 : 0),
      recordsUpdated,
      error: partial ? errors.join("; ").slice(0, 300) : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Courts: error ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
