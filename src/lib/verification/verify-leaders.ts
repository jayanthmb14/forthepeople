/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Verifier: leaders (state offices + placeholder names)
//
// 1. State offices — Chief Minister, Deputy Chief Minister(s), Governor or
//    Lieutenant Governor. Every Leader row that names one of them is
//    compared with TWO outside sources:
//      a. Wikipedia: the infobox of the state's article (one request per
//         state, lead section only);
//      b. Wikidata: the state item's P6 / P35 statements with their start
//         dates (one request for all states), and for Deputy CM /
//         Lieutenant Governor the P39 "position held" statements (one
//         SPARQL query for all states).
//    Both agree with us → "verified"; one agrees and the other has no
//    answer → "single-source"; any disagrees → "disagreement" and ONE admin
//    review item per state office (never an automatic change).
// 2. Coverage — a district page without the Chief Minister or the
//    Governor/Lieutenant Governor of its state gets a "missing" row and a
//    review item that names the holder both sources give.
// 3. Placeholders — any active leader whose name is "[Verify at …]",
//    "[Name Not Available]", "SP, Mysuru Rural" … gets a "placeholder" row
//    and one review item per district.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { NOT_FROM_NEWS_OPTIONAL } from "@/lib/data-filters";
import { decideStatus, isPlaceholderName, nameTokens } from "./compare";
import { errText, fetchJson } from "./http";
import {
  displayName,
  mismatchHeadline,
  officeChecks,
  sourcesAgreeWithEachOther,
  wikidataUrl,
  wikipediaNames,
  wikipediaUrl,
  type WikidataOfficeAnswer,
} from "./leaders-check";
import { classifyStateOffice, coreOffices, officeTitle, roleIsForState, type StateOffice } from "./offices";
import type { DistrictRef, VerificationRecord, VerifierOutput, VerifyContext } from "./types";
import {
  currentHolders,
  parseLeadReply,
  parseSparqlHolders,
  parseStateInfoboxOffices,
  personNames,
  positionHoldersQuery,
  type SparqlReply,
  type WdEntitiesReply,
  type WikiPerson,
  type WikipediaQueryReply,
} from "./wiki";

const WP_API = "https://en.wikipedia.org/w/api.php";
const WD_API = "https://www.wikidata.org/w/api.php";
const WDQS = "https://query.wikidata.org/sparql";
export const REVIEW_DATA_TYPE = "verify-leaders";

/** Wikipedia article of a state/UT when it is not simply its name. */
const WIKIPEDIA_STATE_TITLES: Record<string, string> = {
  "jammu-and-kashmir": "Jammu and Kashmir (union territory)",
  puducherry: "Puducherry (union territory)",
};

/** Wikidata property on the state item for each office (P39 SPARQL is the fallback). */
const STATE_ITEM_PROPERTY: Partial<Record<StateOffice, string>> = {
  "chief-minister": "P6",
  governor: "P35",
  "lieutenant-governor": "P35",
};

interface StateAnswer {
  slug: string;
  name: string;
  wikiUrl: string | null;
  wikiRevisedAt: string | null;
  /** null = Wikipedia could not be read. */
  wiki: Partial<Record<StateOffice, WikiPerson[]>> | null;
  qid: string | null;
  wd: Partial<Record<StateOffice, WikidataOfficeAnswer>>;
}

export async function verifyLeaders(ctx: VerifyContext): Promise<VerifierOutput> {
  const out: VerifierOutput = { records: [], reviews: [], errors: [] };
  const states = new Map<string, StateAnswer>();
  for (const d of ctx.districts) {
    if (!states.has(d.stateSlug)) {
      states.set(d.stateSlug, { slug: d.stateSlug, name: d.stateName, wikiUrl: null, wikiRevisedAt: null, wiki: null, qid: null, wd: {} });
    }
  }

  // ── a. Wikipedia: one lead-section read per state ──
  for (const st of states.values()) {
    const title = WIKIPEDIA_STATE_TITLES[st.slug] ?? st.name;
    const url =
      `${WP_API}?action=query&prop=revisions%7Cpageprops&rvprop=content%7Ctimestamp&rvslots=main&rvsection=0` +
      `&ppprop=wikibase_item&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
    try {
      const lead = parseLeadReply(await fetchJson<WikipediaQueryReply>(url, { deadlineMs: ctx.deadlineMs }));
      if (!lead) throw new Error(`no article "${title}"`);
      st.wiki = parseStateInfoboxOffices(lead.wikitext);
      st.wikiUrl = wikipediaUrl(lead.title);
      st.wikiRevisedAt = lead.revisedAt;
      st.qid = lead.qid;
    } catch (err) {
      out.errors.push(`wikipedia/${st.slug}: ${errText(err)}`);
    }
  }

  // ── b1. Wikidata: P6 / P35 on the state items, then the holders' names ──
  const qids = [...states.values()].map((s) => s.qid).filter((q): q is string => !!q);
  if (qids.length > 0) {
    try {
      const claims = await fetchJson<WdEntitiesReply>(
        `${WD_API}?action=wbgetentities&props=claims&format=json&ids=${qids.join("%7C")}`,
        { deadlineMs: ctx.deadlineMs },
      );
      const pending: Array<{ st: StateAnswer; office: StateOffice; qid: string; start: Date | null }> = [];
      for (const st of states.values()) {
        if (!st.qid) continue;
        for (const [office, prop] of Object.entries(STATE_ITEM_PROPERTY) as Array<[StateOffice, string]>) {
          // P35 is the Governor for a state, the Lieutenant Governor for a UT: use whichever the infobox has.
          if (office === "lieutenant-governor" && !st.wiki?.["lieutenant-governor"]) continue;
          if (office === "governor" && st.wiki?.["lieutenant-governor"] && !st.wiki?.governor) continue;
          for (const h of currentHolders(claims, st.qid, prop, ctx.now)) pending.push({ st, office, qid: h.qid, start: h.start });
        }
      }
      const people = [...new Set(pending.map((p) => p.qid))];
      if (people.length > 0) {
        const names = await fetchJson<WdEntitiesReply>(
          `${WD_API}?action=wbgetentities&props=labels%7Caliases%7Csitelinks&languages=en%7Cmul%7Cen-gb%7Cen-in` +
            `&sitefilter=enwiki&format=json&ids=${people.slice(0, 50).join("%7C")}`,
          { deadlineMs: ctx.deadlineMs },
        );
        for (const p of pending) {
          const ans = (p.st.wd[p.office] ??= { holders: [], via: STATE_ITEM_PROPERTY[p.office] ?? "P39" });
          ans.holders.push({ qid: p.qid, names: personNames(names, p.qid), start: p.start });
        }
      }
    } catch (err) {
      out.errors.push(`wikidata: ${errText(err)}`);
    }
  }

  // ── b2. Wikidata P39 (SPARQL) for offices the state item does not carry ──
  const labels = new Map<string, { st: StateAnswer; office: StateOffice }>();
  for (const st of states.values()) {
    const wanted: StateOffice[] = ["deputy-cm"];
    if (!st.wd.governor && !st.wd["lieutenant-governor"]) wanted.push(st.wiki?.["lieutenant-governor"] ? "lieutenant-governor" : "governor");
    for (const office of wanted) labels.set(officeTitle(office, st.name), { st, office });
  }
  if (labels.size > 0 && Date.now() < ctx.deadlineMs - 30_000) {
    try {
      const q = positionHoldersQuery([...labels.keys()]);
      const reply = await fetchJson<SparqlReply>(`${WDQS}?format=json&query=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/sparql-results+json" },
        timeoutMs: 25_000,
        deadlineMs: ctx.deadlineMs,
      });
      for (const [label, holders] of parseSparqlHolders(reply)) {
        const target = labels.get(label);
        if (!target || holders.length === 0) continue;
        target.st.wd[target.office] = { via: "P39", holders: holders.map((h) => ({ qid: h.qid, names: [h.name], start: h.start })) };
      }
    } catch (err) {
      out.errors.push(`wikidata-sparql: ${errText(err)}`);
    }
  }

  // ── Our rows ──
  const districtById = new Map(ctx.districts.map((d) => [d.id, d]));
  const leaders = await prisma.leader.findMany({
    where: { districtId: { in: ctx.districts.map((d) => d.id) }, active: true, ...NOT_FROM_NEWS_OPTIONAL },
    select: { id: true, districtId: true, name: true, role: true, source: true, lastVerifiedAt: true },
    orderBy: [{ districtId: "asc" }, { tier: "asc" }],
    take: 3000,
  });

  const mismatchGroups = new Map<string, { st: StateAnswer; office: StateOffice; shown: string; checks: VerificationRecord["sources"]; rows: Array<{ d: DistrictRef; leaderId: string; name: string; role: string; key: string }> }>();
  const placeholderGroups = new Map<string, { d: DistrictRef; rows: Array<{ leaderId: string; name: string; role: string; key: string }> }>();
  const officesShown = new Map<string, Set<StateOffice>>(); // districtId → offices we show

  for (const l of leaders) {
    const d = districtById.get(l.districtId);
    if (!d) continue;
    const st = states.get(d.stateSlug);

    // Placeholder names (any leader)
    if (isPlaceholderName(l.name, [d.name, d.slug, d.stateName, d.stateSlug])) {
      const key = `leaders:${d.slug}:placeholder:${l.id}`;
      out.records.push({
        datasetKey: key,
        dataset: "leaders",
        kind: "placeholder",
        stateSlug: d.stateSlug,
        districtSlug: d.slug,
        entityType: "Leader",
        entityId: l.id,
        dataDate: l.lastVerifiedAt,
        primarySource: l.source ?? "entered by hand",
        primaryValue: l.name,
        sources: [],
        agreed: null,
        tolerance: null,
        status: "placeholder",
        reason: "name-placeholder",
        notes: `${l.role}: the name field holds "${l.name}", not a person's name.`,
      });
      const g = placeholderGroups.get(d.id) ?? { d, rows: [] };
      g.rows.push({ leaderId: l.id, name: l.name, role: l.role, key });
      placeholderGroups.set(d.id, g);
      continue;
    }

    // State offices
    const office = classifyStateOffice(l.role);
    if (!office || !st || !roleIsForState(l.role, d.stateName)) continue;
    const shownSet = officesShown.get(d.id) ?? new Set<StateOffice>();
    shownSet.add(office);
    officesShown.set(d.id, shownSet);

    const checks = officeChecks(l.name, { people: st.wiki?.[office], url: st.wikiUrl }, st.wd[office]);
    const verdict = decideStatus(checks, { primaryCounts: false, noAnswerReason: "second-source-no-data" });
    const key = `leaders:${d.slug}:${office}:${l.id}`;
    out.records.push({
      datasetKey: key,
      dataset: "leaders",
      kind: "cross-source",
      stateSlug: d.stateSlug,
      districtSlug: d.slug,
      entityType: "Leader",
      entityId: l.id,
      dataDate: l.lastVerifiedAt,
      primarySource: l.source ?? "entered by hand",
      primaryValue: l.name,
      sources: checks,
      agreed: verdict.agreed,
      tolerance: "same person",
      status: verdict.status,
      reason: verdict.reason,
      notes: `${officeTitle(office, d.stateName)} — ${checks.map((c) => `${c.source}: ${c.value ?? "no answer"}${c.agreed === null ? "" : c.agreed ? " ✓" : " ✗"}`).join("; ")}`,
    });
    if (verdict.status === "disagreement") {
      const gk = `${d.stateSlug}|${office}|${nameTokens(l.name).join("")}`;
      const g = mismatchGroups.get(gk) ?? { st, office, shown: l.name, checks, rows: [] };
      g.rows.push({ d, leaderId: l.id, name: l.name, role: l.role, key });
      mismatchGroups.set(gk, g);
    }
  }

  // ── Coverage: the head of government and head of state on every district page ──
  for (const st of states.values()) {
    const found = new Set<StateOffice>(
      (Object.keys({ ...(st.wiki ?? {}), ...st.wd }) as StateOffice[]).filter(
        (o) => (st.wiki?.[o]?.length ?? 0) > 0 || (st.wd[o]?.holders.length ?? 0) > 0,
      ),
    );
    for (const office of coreOffices(found)) {
      if (!found.has(office)) continue;
      const wikiPeople = st.wiki?.[office];
      const wd = st.wd[office];
      const holderName = wikiPeople?.[0]?.name ?? (wd ? displayName(wd.holders[0]?.names ?? []) : "?");
      const lacking = ctx.districts.filter((d) => d.stateSlug === st.slug && !officesShown.get(d.id)?.has(office));
      if (lacking.length === 0) continue;
      const checks = officeChecks(holderName, { people: wikiPeople, url: st.wikiUrl }, wd);
      const agree = sourcesAgreeWithEachOther(checks, wikiPeople, wd);
      const keys: string[] = [];
      for (const d of lacking) {
        const key = `leaders:${d.slug}:${office}:missing`;
        keys.push(key);
        out.records.push({
          datasetKey: key,
          dataset: "leaders",
          kind: "coverage",
          stateSlug: d.stateSlug,
          districtSlug: d.slug,
          entityType: "Leader",
          entityId: null,
          dataDate: null,
          primarySource: "our records",
          primaryValue: null,
          sources: checks,
          agreed: null,
          tolerance: null,
          status: "missing",
          reason: "office-missing",
          notes: `${officeTitle(office, st.name)} is not listed on this district's page.`,
        });
      }
      out.reviews.push({
        districtId: lacking[0].id,
        dataType: REVIEW_DATA_TYPE,
        headline: `${officeTitle(office, st.name)} missing on ${lacking.map((d) => d.name).join(", ")}; ${checks
          .map((c) => `${c.source}: ${c.value ?? "no answer"}`)
          .join("; ")}`.slice(0, 300),
        sourceUrl: st.wikiUrl ?? (wd?.holders[0] ? wikidataUrl(wd.holders[0].qid) : "https://www.wikidata.org"),
        confidence: agree ? 0.9 : 0.5,
        data: {
          origin: "verify-data",
          kind: "office-missing",
          state: st.slug,
          office,
          districts: lacking.map((d) => d.slug),
          wikipedia: { names: wikiPeople ? wikipediaNames(wikiPeople) : [], url: st.wikiUrl, revisedAt: st.wikiRevisedAt },
          wikidata: wd ? { via: wd.via, holders: wd.holders.map((h) => ({ qid: h.qid, name: displayName(h.names), since: h.start?.toISOString() ?? null })) } : null,
          suggestion: agree ? { personName: holderName, role: officeTitle(office, st.name), tier: 2 } : null,
        },
        recordKeys: keys,
      });
    }
  }

  // ── Review items: one per state office per shown name ──
  for (const g of mismatchGroups.values()) {
    const wikiPeople = g.st.wiki?.[g.office];
    const wd = g.st.wd[g.office];
    const agree = sourcesAgreeWithEachOther(g.checks, wikiPeople, wd);
    const suggestion = agree && wikiPeople?.[0] ? wikiPeople.map((p) => p.name) : null;
    out.reviews.push({
      districtId: g.rows[0].d.id,
      dataType: REVIEW_DATA_TYPE,
      headline: mismatchHeadline(officeTitle(g.office, g.st.name), g.shown, g.checks),
      sourceUrl: g.st.wikiUrl ?? g.checks.find((c) => c.url)?.url ?? "https://www.wikidata.org",
      confidence: agree ? 0.9 : 0.5,
      data: {
        origin: "verify-data",
        kind: "leader-mismatch",
        state: g.st.slug,
        office: g.office,
        shown: g.rows.map((r) => ({ leaderId: r.leaderId, district: r.d.slug, name: r.name, role: r.role })),
        wikipedia: { names: wikiPeople ? wikipediaNames(wikiPeople) : [], url: g.st.wikiUrl, revisedAt: g.st.wikiRevisedAt },
        wikidata: wd ? { via: wd.via, holders: wd.holders.map((h) => ({ qid: h.qid, name: displayName(h.names), since: h.start?.toISOString() ?? null })) } : null,
        // Only when both sources name the same people; the admin still decides.
        suggestion: suggestion ? { personNames: suggestion, role: officeTitle(g.office, g.st.name), tier: 2 } : null,
      },
      recordKeys: g.rows.map((r) => r.key),
    });
  }

  for (const g of placeholderGroups.values()) {
    out.reviews.push({
      districtId: g.d.id,
      dataType: REVIEW_DATA_TYPE,
      headline: `${g.d.name}: ${g.rows.length} officer name${g.rows.length === 1 ? " is a placeholder" : "s are placeholders"} — ${g.rows
        .map((r) => `${r.role} ("${r.name}")`)
        .join(", ")}`.slice(0, 300),
      sourceUrl: `https://forthepeople.in/en/${g.d.stateSlug}/${g.d.slug}/leadership`,
      confidence: 0.9,
      data: {
        origin: "verify-data",
        kind: "placeholder-name",
        district: g.d.slug,
        rows: g.rows.map((r) => ({ leaderId: r.leaderId, role: r.role, name: r.name })),
      },
      recordKeys: g.rows.map((r) => r.key),
    });
  }

  ctx.log(
    `leaders: ${out.records.length} checks (${out.records.filter((r) => r.status === "verified").length} verified, ` +
      `${out.records.filter((r) => r.status === "disagreement").length} disagree, ` +
      `${out.records.filter((r) => r.status === "placeholder").length} placeholders, ` +
      `${out.records.filter((r) => r.status === "missing").length} missing)`,
  );
  return out;
}
