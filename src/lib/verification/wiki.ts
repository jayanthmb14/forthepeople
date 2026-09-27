/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Wikipedia + Wikidata parsers for the leaders check (pure)
//
// Wikipedia: the infobox at the top of a state's article lists who holds
// the state offices today. Two templates are in use (checked Sept 2026):
//   {{Infobox Indian state or territory | governor = [[Thawar Chand Gehlot]]
//     | chief_minister = [[D. K. Shivakumar]] | deputy_cm = [[A]] ([[Party|P]])<br/>[[B]] … }}
//   {{Infobox settlement | leader_title = [[List of … of Delhi|Lieutenant Governor]]
//     | leader_name = [[Taranjit Singh Sandhu]] | leader_title1 = … | leader_name1 = … }}
// A person is the first wiki link of each entry; links inside "( … )" are
// parties and are skipped.
//
// Wikidata: the state item's P6 (head of government = Chief Minister) and
// P35 (head of state = Governor) statements, with start dates (P580).
// Current = not deprecated and no end date (P582) in the past; when a
// statement is marked "preferred" only preferred ones count. Deputy CM and
// Lieutenant Governor come from a SPARQL query on P39 (position held),
// which Wikidata fills unevenly — no answer there is "no data", not a
// disagreement.
// ═══════════════════════════════════════════════════════════
import { classifyStateOffice, type StateOffice } from "./offices";

export interface WikiPerson {
  /** Text we compare: the link's display text, or the plain text. */
  name: string;
  /** Linked article title, when the entry is a link. */
  link: string | null;
}

// ── Wikitext helpers ────────────────────────────────────────

/** Remove <ref>…</ref>, <ref … />, HTML comments and <small> wrappers. */
export function stripRefs(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref\b[^>]*\/>/gi, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<\/?small>/gi, "");
}

/** The body of the first `{{Infobox …}}` template (without the outer braces), or null. */
export function extractInfobox(wikitext: string): string | null {
  const start = wikitext.search(/\{\{\s*Infobox/i);
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < wikitext.length - 1; i++) {
    const two = wikitext.slice(i, i + 2);
    if (two === "{{") {
      depth++;
      i++;
    } else if (two === "}}") {
      depth--;
      i++;
      if (depth === 0) return wikitext.slice(start + 2, i - 1);
    }
  }
  return null;
}

/**
 * Split a template body into named parameters. Splits on "|" only at the
 * top level (not inside [[…]] or {{…}}). Keys are lower-cased and trimmed;
 * positional parameters (and the template name) are dropped.
 */
export function parseTemplateParams(body: string): Record<string, string> {
  const parts: string[] = [];
  let depthLink = 0;
  let depthTpl = 0;
  let cur = "";
  for (let i = 0; i < body.length; i++) {
    const two = body.slice(i, i + 2);
    if (two === "[[") { depthLink++; cur += two; i++; continue; }
    if (two === "]]" && depthLink > 0) { depthLink--; cur += two; i++; continue; }
    if (two === "{{") { depthTpl++; cur += two; i++; continue; }
    if (two === "}}" && depthTpl > 0) { depthTpl--; cur += two; i++; continue; }
    if (body[i] === "|" && depthLink === 0 && depthTpl === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    cur += body[i];
  }
  parts.push(cur);
  const out: Record<string, string> = {};
  for (const p of parts.slice(1)) {
    const eq = p.indexOf("=");
    if (eq < 0) continue;
    const key = p.slice(0, eq).trim().toLowerCase();
    if (key) out[key] = p.slice(eq + 1).trim();
  }
  return out;
}

/** Link targets that are never a person (parties, lists, files). */
const NOT_A_PERSON_RE =
  /^(list of|file:|image:|category:|wikt:)|party|congress|sena|janata|samaj|kazhagam|morcha|\bdal\b|league|front|alliance|communist|\b(bjp|inc|aap|tmc|ysrcp|brs|trs|tdp|dmk|aiadmk|tvk|ncp|shs|sp|bsp|jd\(s\)|jds)\b|legislative|assembly|parliament|unicameral|bicameral|independent politician/i;

/** "[[A|B]]" → "B", "[[A]]" → "A"; "{{nowrap|x}}" → "x"; other templates removed. Plain display text. */
export function wikiPlainText(text: string): string {
  let t = stripRefs(text);
  t = t.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2").replace(/\[\[([^\]]*)\]\]/g, "$1");
  for (let k = 0; k < 5; k++) {
    const before = t;
    t = t.replace(/\{\{\s*(?:nowrap|nobr|small|plainlist|ubl|unbulleted list|hlist|flatlist)\s*\|([^{}]*)\}\}/gi, "$1");
    t = t.replace(/\{\{[^{}]*\}\}/g, "");
    if (t === before) break;
  }
  return t.replace(/'''?/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * The people named in one infobox value. One entry per wiki link that is
 * not inside parentheses and is not a party/list link; when the value has
 * no such link, the plain text split on <br>, new lines, "•" and ";"
 * (text in parentheses dropped).
 */
export function extractPeople(value: string): WikiPerson[] {
  const v = stripRefs(value);
  const people: WikiPerson[] = [];
  let paren = 0;
  for (let i = 0; i < v.length; i++) {
    if (v.startsWith("[[", i)) {
      const end = v.indexOf("]]", i + 2);
      if (end < 0) break;
      const inner = v.slice(i + 2, end);
      i = end + 1;
      if (paren > 0) continue;
      const bar = inner.indexOf("|");
      const target = (bar >= 0 ? inner.slice(0, bar) : inner).trim();
      const display = (bar >= 0 ? inner.slice(bar + 1) : inner).trim();
      if (!target || NOT_A_PERSON_RE.test(target) || NOT_A_PERSON_RE.test(display)) continue;
      people.push({ name: display || target, link: target });
      continue;
    }
    const ch = v[i];
    if (ch === "(") paren++;
    else if (ch === ")" && paren > 0) paren--;
  }
  if (people.length > 0) return dedupePeople(people);

  const plain = wikiPlainText(v.replace(/<br\s*\/?>/gi, "\n"));
  return dedupePeople(
    plain
      .replace(/\([^)]*\)/g, " ")
      .split(/\n|•|;|\s\*\s|^\*\s/)
      .map((s) => s.replace(/^[*\s,]+|[\s,]+$/g, "").trim())
      .filter((s) => /[A-Za-z\u0900-\u0DFF]{2,}/.test(s) && !NOT_A_PERSON_RE.test(s))
      .map((s) => ({ name: s, link: null })),
  );
}

function dedupePeople(list: WikiPerson[]): WikiPerson[] {
  const seen = new Set<string>();
  return list.filter((p) => {
    const k = (p.link ?? p.name).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const OFFICE_KEYS: Record<StateOffice, string[]> = {
  "chief-minister": ["chief_minister", "chief minister", "cm"],
  "deputy-cm": ["deputy_cm", "deputy_chief_minister", "deputy chief minister", "deputy_cms"],
  governor: ["governor"],
  "lieutenant-governor": ["lieutenant_governor", "lt_governor", "lieutenant governor", "lt governor"],
  // India's {{Infobox country}} only has leader_title / leader_name pairs.
  "prime-minister": [],
  president: [],
};

/**
 * Who holds each state office according to the infobox of a state's
 * Wikipedia article (section 0 wikitext). Offices the infobox does not
 * mention are absent from the result; an office listed with an empty
 * value maps to [].
 */
export function parseStateInfoboxOffices(wikitext: string): Partial<Record<StateOffice, WikiPerson[]>> {
  const box = extractInfobox(wikitext);
  if (!box) return {};
  const params = parseTemplateParams(box);
  const out: Partial<Record<StateOffice, WikiPerson[]>> = {};

  for (const [office, keys] of Object.entries(OFFICE_KEYS) as Array<[StateOffice, string[]]>) {
    for (const k of keys) {
      if (k in params) {
        out[office] = extractPeople(params[k]);
        break;
      }
    }
  }

  // {{Infobox settlement}}: leader_title / leader_name, leader_title1 / leader_name1, …
  for (const [key, title] of Object.entries(params)) {
    const m = /^leader_title(\d*)$/.exec(key);
    if (!m) continue;
    const office = classifyStateOffice(wikiPlainText(title));
    if (!office || out[office]) continue;
    const nameVal = params[`leader_name${m[1]}`];
    if (nameVal !== undefined) out[office] = extractPeople(nameVal);
  }
  return out;
}

// ── Wikidata ────────────────────────────────────────────────

interface WdSnak {
  snaktype?: string;
  datavalue?: { value?: unknown };
}
interface WdStatement {
  rank?: string;
  mainsnak?: WdSnak;
  qualifiers?: Record<string, WdSnak[]>;
}
interface WdEntity {
  claims?: Record<string, WdStatement[]>;
  labels?: Record<string, { value?: string }>;
  aliases?: Record<string, Array<{ value?: string }>>;
  sitelinks?: Record<string, { title?: string }>;
}
export interface WdEntitiesReply {
  entities?: Record<string, WdEntity>;
}

/** Wikidata time "+2026-06-03T00:00:00Z" (month/day may be 00) → Date at UTC midnight, or null. */
export function parseWikidataTime(t: unknown): Date | null {
  if (typeof t !== "string") return null;
  const m = /^([+-]?\d{1,4})-(\d{2})-(\d{2})T/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Math.max(1, Number(m[2]));
  const d = Math.max(1, Number(m[3]));
  const date = new Date(Date.UTC(y, mo - 1, d));
  return Number.isNaN(date.getTime()) ? null : date;
}

function qualifierTime(st: WdStatement, prop: string): Date | null {
  const q = st.qualifiers?.[prop]?.[0];
  if (!q || q.snaktype !== "value") return null;
  const v = q.datavalue?.value as { time?: unknown } | undefined;
  return parseWikidataTime(v?.time);
}

export interface WdHolder {
  qid: string;
  start: Date | null;
  rank: string;
}

/**
 * The current holders in `prop` of entity `qid`: statements that are not
 * deprecated, have a value, and have no end date (P582) before `now`.
 * If any of those is "preferred", only the preferred ones are returned.
 */
export function currentHolders(reply: WdEntitiesReply, qid: string, prop: string, now: Date): WdHolder[] {
  const sts = reply.entities?.[qid]?.claims?.[prop] ?? [];
  const current = sts.filter((s) => {
    if (s.rank === "deprecated" || s.mainsnak?.snaktype !== "value") return false;
    const end = qualifierTime(s, "P582");
    return !end || end.getTime() > now.getTime();
  });
  const preferred = current.filter((s) => s.rank === "preferred");
  return (preferred.length > 0 ? preferred : current)
    .map((s) => {
      const v = s.mainsnak?.datavalue?.value as { id?: unknown } | undefined;
      return { qid: typeof v?.id === "string" ? v.id : "", start: qualifierTime(s, "P580"), rank: s.rank ?? "normal" };
    })
    .filter((h) => /^Q\d+$/.test(h.qid));
}

/**
 * Every spelling Wikidata has for a person: labels and aliases in English
 * and "mul" (the language-neutral label), and the English Wikipedia title
 * without a "(politician)" note. Non-latin labels are kept but never match
 * a latin name.
 */
export function personNames(reply: WdEntitiesReply, qid: string): string[] {
  const e = reply.entities?.[qid];
  if (!e) return [];
  const names: string[] = [];
  for (const lang of ["en", "mul", "en-gb", "en-in"]) {
    const l = e.labels?.[lang]?.value;
    if (l) names.push(l);
    for (const a of e.aliases?.[lang] ?? []) if (a.value) names.push(a.value);
  }
  const title = e.sitelinks?.enwiki?.title;
  if (title) names.push(title.replace(/\s*\([^)]*\)\s*$/, ""));
  return [...new Set(names.map((n) => n.trim()).filter(Boolean))];
}

/** The English Wikipedia title of a Wikidata item, if any. */
export function enwikiTitle(reply: WdEntitiesReply, qid: string): string | null {
  return reply.entities?.[qid]?.sitelinks?.enwiki?.title ?? null;
}

// ── SPARQL (P39 position held) ──────────────────────────────

export interface SparqlReply {
  results?: { bindings?: Array<Record<string, { value?: string } | undefined>> };
}

export interface PositionHolder {
  qid: string;
  name: string;
  start: Date | null;
}

/**
 * Parse the reply of the "current holders by position label" query
 * (see positionHoldersQuery). Returns label → holders. Holders without an
 * English/mul label (the service returns the Q-id then) are dropped.
 */
export function parseSparqlHolders(reply: SparqlReply): Map<string, PositionHolder[]> {
  const out = new Map<string, PositionHolder[]>();
  for (const b of reply.results?.bindings ?? []) {
    const label = b.label?.value;
    const uri = b.p?.value ?? "";
    const qid = uri.split("/").pop() ?? "";
    const name = b.pLabel?.value ?? "";
    if (!label || !/^Q\d+$/.test(qid) || !name || /^Q\d+$/.test(name)) continue;
    const start = b.start?.value ? parseWikidataTime(b.start.value.startsWith("+") || b.start.value.startsWith("-") ? b.start.value : `+${b.start.value}`) : null;
    const list = out.get(label) ?? [];
    if (!list.some((h) => h.qid === qid)) list.push({ qid, name, start });
    out.set(label, list);
  }
  return out;
}

/** SPARQL: current (no end date, not deprecated) P39 holders of positions found by exact English label. */
export function positionHoldersQuery(labels: readonly string[]): string {
  const values = labels.map((l) => `"${l.replace(/["\\]/g, "")}"@en`).join(" ");
  return [
    "SELECT ?label ?p ?pLabel ?start WHERE {",
    `  VALUES ?label { ${values} }`,
    "  ?pos rdfs:label ?label .",
    "  ?p p:P39 ?st . ?st ps:P39 ?pos ; wikibase:rank ?rank .",
    "  FILTER(?rank != wikibase:DeprecatedRank)",
    "  OPTIONAL { ?st pq:P580 ?start }",
    "  FILTER NOT EXISTS { ?st pq:P582 ?end }",
    '  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,mul". }',
    "}",
  ].join("\n");
}

// ── Wikipedia API reply ─────────────────────────────────────

export interface WikipediaQueryReply {
  query?: {
    pages?: Array<{
      title?: string;
      missing?: boolean;
      pageprops?: { wikibase_item?: string };
      revisions?: Array<{ timestamp?: string; slots?: { main?: { content?: string } } }>;
    }>;
  };
}

export interface WikipediaLead {
  title: string;
  wikitext: string;
  /** ISO time of the revision we read. */
  revisedAt: string | null;
  /** The article's Wikidata item (e.g. "Q1185"), if any. */
  qid: string | null;
}

/** action=query&prop=revisions|pageprops (formatversion=2) reply → the first page's lead, or null. */
export function parseLeadReply(reply: WikipediaQueryReply): WikipediaLead | null {
  const page = reply.query?.pages?.[0];
  if (!page || page.missing || !page.title) return null;
  const rev = page.revisions?.[0];
  const wikitext = rev?.slots?.main?.content;
  if (typeof wikitext !== "string") return null;
  const qid = page.pageprops?.wikibase_item;
  return { title: page.title, wikitext, revisedAt: rev?.timestamp ?? null, qid: qid && /^Q\d+$/.test(qid) ? qid : null };
}
