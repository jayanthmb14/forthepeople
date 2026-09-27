/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// Data verification: Wikipedia / Wikidata / SPARQL parsers and the
// leaders comparison (src/lib/verification/wiki.ts, leaders-check.ts).
// Fixtures in tests/fixtures/verification/ are real replies from
// 27 Sep 2026, trimmed (Wikidata: only P6/P35 with start/end dates).
// No network.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  currentHolders,
  enwikiTitle,
  extractInfobox,
  extractPeople,
  parseLeadReply,
  parseSparqlHolders,
  parseStateInfoboxOffices,
  parseTemplateParams,
  parseWikidataTime,
  personNames,
  positionHoldersQuery,
  stripRefs,
  wikiPlainText,
  type SparqlReply,
  type WdEntitiesReply,
  type WikipediaQueryReply,
} from "@/lib/verification/wiki";
import {
  mismatchHeadline,
  officeChecks,
  sourcesAgreeWithEachOther,
  wikipediaNames,
  type WikidataOfficeAnswer,
} from "@/lib/verification/leaders-check";
import { decideStatus } from "@/lib/verification/compare";

const fx = <T>(name: string): T =>
  JSON.parse(readFileSync(path.join(__dirname, "fixtures", "verification", name), "utf8")) as T;

const NOW = new Date("2026-09-27T12:00:00Z");
const lead = (file: string) => {
  const l = parseLeadReply(fx<WikipediaQueryReply>(file));
  if (!l) throw new Error(`fixture ${file} did not parse`);
  return l;
};

describe("wikitext helpers", () => {
  it("strips refs and comments", () => {
    expect(stripRefs('[[A]]<ref name="x">{{cite|b}}</ref> <!-- c --><ref name=y />!')).toBe("[[A]] !");
  });
  it("finds the infobox across nested templates", () => {
    const body = extractInfobox("{{Short description|x}}\n{{Infobox foo\n| a = {{nowrap|[[B]]}}\n| c = d\n}}\ntext")!;
    expect(body.startsWith("Infobox foo")).toBe(true);
    expect(parseTemplateParams(body)).toEqual({ a: "{{nowrap|[[B]]}}", c: "d" });
  });
  it("plain text of links and templates", () => {
    expect(wikiPlainText("{{nowrap|[[List of Chief Ministers of Delhi|Chief Minister]]}}")).toBe("Chief Minister");
  });
});

describe("extractPeople", () => {
  it("takes the person link and skips the party in brackets", () => {
    expect(extractPeople("[[Suvendu Adhikari]] ([[Bharatiya Janata Party|BJP]])")).toEqual([{ name: "Suvendu Adhikari", link: "Suvendu Adhikari" }]);
  });
  it("handles several people separated by <br/> and parties with brackets inside the link", () => {
    const v = "[[Eknath Shinde]] ([[Shiv Sena (2022–present)|SHS]])<br/>[[Sunetra Pawar]] ([[Nationalist Congress Party|NCP]])";
    expect(extractPeople(v).map((p) => p.name)).toEqual(["Eknath Shinde", "Sunetra Pawar"]);
  });
  it("uses the display text of piped links", () => {
    expect(extractPeople("[[Revanth Reddy (politician)|Revanth Reddy]]")).toEqual([{ name: "Revanth Reddy", link: "Revanth Reddy (politician)" }]);
  });
  it("reads list templates", () => {
    expect(extractPeople("{{plainlist|\n* [[A. Person]]\n* [[B. Person]]\n}}").map((p) => p.name)).toEqual(["A. Person", "B. Person"]);
    expect(extractPeople("{{ubl|[[A. Person]]|[[B. Person]] ([[Indian National Congress|INC]])}}").map((p) => p.name)).toEqual(["A. Person", "B. Person"]);
  });
  it("falls back to plain text", () => {
    expect(extractPeople("Rajneesh Goel (IAS)<ref>{{cite news|title=x}}</ref>")).toEqual([{ name: "Rajneesh Goel", link: null }]);
    expect(extractPeople("")).toEqual([]);
  });
});

describe("parseStateInfoboxOffices (real infoboxes)", () => {
  it("Karnataka — Infobox Indian state or territory", () => {
    const l = lead("wp-karnataka.json");
    expect(l.qid).toBe("Q1185");
    expect(l.revisedAt).toBe("2026-09-26T03:27:19Z");
    const o = parseStateInfoboxOffices(l.wikitext);
    expect(o.governor?.map((p) => p.name)).toEqual(["Thawar Chand Gehlot"]);
    expect(o["chief-minister"]?.map((p) => p.name)).toEqual(["D. K. Shivakumar"]);
    expect(o["deputy-cm"]?.map((p) => p.name)).toEqual(["G. Parameshwara"]);
    expect(o["lieutenant-governor"]).toBeUndefined();
  });
  it("Delhi — Infobox settlement leader_title / leader_name", () => {
    const o = parseStateInfoboxOffices(lead("wp-delhi.json").wikitext);
    expect(o["lieutenant-governor"]?.map((p) => p.name)).toEqual(["Taranjit Singh Sandhu"]);
    expect(o["chief-minister"]?.map((p) => p.name)).toEqual(["Rekha Gupta"]);
    expect(o.governor).toBeUndefined();
  });
  it("Maharashtra — two deputy CMs", () => {
    const o = parseStateInfoboxOffices(lead("wp-maharashtra.json").wikitext);
    expect(o["deputy-cm"]?.map((p) => p.name)).toEqual(["Eknath Shinde", "Sunetra Pawar"]);
    expect(o["chief-minister"]?.map((p) => p.name)).toEqual(["Devendra Fadnavis"]);
  });
  it("Uttar Pradesh — a governor value carrying a <ref>", () => {
    const o = parseStateInfoboxOffices(lead("wp-uttar-pradesh.json").wikitext);
    expect(o.governor?.map((p) => p.name)).toEqual(["Anandiben Patel"]);
    expect(o["deputy-cm"]?.map((p) => p.name)).toEqual(["Keshav Prasad Maurya", "Brajesh Pathak"]);
  });
  it("India — Infobox country leader pairs (Vice President is not an office we check)", () => {
    const wikitext = [
      "{{Infobox country",
      "| leader_title1 = [[President of India|President]]",
      "| leader_name1 = [[Droupadi Murmu]]",
      "| leader_title2 = [[Vice President of India|Vice President]]",
      "| leader_name2 = [[C. P. Radhakrishnan]]",
      "| leader_title3 = [[Prime Minister of India|Prime Minister]]",
      "| leader_name3 = [[Narendra Modi]]",
      "}}",
    ].join("\n");
    const o = parseStateInfoboxOffices(wikitext);
    expect(o.president?.map((p) => p.name)).toEqual(["Droupadi Murmu"]);
    expect(o["prime-minister"]?.map((p) => p.name)).toEqual(["Narendra Modi"]);
    expect(Object.keys(o).sort()).toEqual(["president", "prime-minister"]);
  });
  it("no infobox → nothing", () => {
    expect(parseStateInfoboxOffices("'''X''' is a place.")).toEqual({});
    expect(parseLeadReply({ query: { pages: [{ title: "X", missing: true }] } })).toBeNull();
  });
});

describe("Wikidata", () => {
  const states = fx<WdEntitiesReply>("wd-states.json");
  const people = fx<WdEntitiesReply>("wd-people.json");

  it("parses times, including unknown month/day", () => {
    expect(parseWikidataTime("+2026-06-03T00:00:00Z")?.toISOString()).toBe("2026-06-03T00:00:00.000Z");
    expect(parseWikidataTime("+1956-00-00T00:00:00Z")?.toISOString()).toBe("1956-01-01T00:00:00.000Z");
    expect(parseWikidataTime(42)).toBeNull();
  });
  it("Karnataka P6: the preferred, open statement (ended ones are skipped)", () => {
    const h = currentHolders(states, "Q1185", "P6", NOW);
    expect(h.map((x) => x.qid)).toEqual(["Q17089931"]);
    expect(h[0].start?.toISOString().slice(0, 10)).toBe("2026-06-03");
  });
  it("an end date in the future still counts as current", () => {
    const h = currentHolders(states, "Q1185", "P6", new Date("2026-06-01T00:00:00Z"));
    expect(h.map((x) => x.qid)).toContain("Q17089931");
  });
  it("Delhi P6: two open normal-rank statements → both are candidates; P35 absent", () => {
    expect(currentHolders(states, "Q1353", "P6", NOW).map((x) => x.qid).sort()).toEqual(["Q140067842", "Q19560653"]);
    expect(currentHolders(states, "Q1353", "P35", NOW)).toEqual([]);
  });
  it("names: labels, aliases and the English Wikipedia title", () => {
    expect(personNames(people, "Q17089931")).toContain("D. K. Shivakumar");
    // No English label, only a Wikipedia title.
    expect(personNames(people, "Q528496")).toEqual(["C. Joseph Vijay"]);
    // A vandalised English label is kept, but the title still says who it is.
    expect(personNames(people, "Q7289378")).toEqual(["जिष्णू देव वर्मा", "Ramesh Bais"]);
    expect(enwikiTitle(people, "Q7289378")).toBe("Ramesh Bais");
    expect(personNames(people, "Q1")).toEqual([]);
  });
  it("SPARQL position holders", () => {
    const m = parseSparqlHolders(fx<SparqlReply>("sparql-positions.json"));
    expect(m.get("Deputy Chief Minister of Maharashtra")?.map((h) => h.name).sort()).toEqual(["Balasaheb Thorat", "Sunetra Pawar"]);
    expect(m.get("Governor of Maharashtra")?.[0].start?.toISOString().slice(0, 10)).toBe("2023-02-18");
    expect(m.has("Deputy Chief Minister of Karnataka")).toBe(false);
  });
  it("the SPARQL query quotes labels safely", () => {
    const q = positionHoldersQuery(['Governor of "X"']);
    expect(q).toContain('"Governor of X"@en');
    expect(q).toContain("FILTER NOT EXISTS { ?st pq:P582 ?end }");
  });
});

describe("leaders comparison (fixtures end to end)", () => {
  const states = fx<WdEntitiesReply>("wd-states.json");
  const people = fx<WdEntitiesReply>("wd-people.json");
  const wdFor = (qid: string, prop: string): WikidataOfficeAnswer => ({
    via: prop,
    holders: currentHolders(states, qid, prop, NOW).map((h) => ({ qid: h.qid, names: personNames(people, h.qid), start: h.start })),
  });
  const ka = parseStateInfoboxOffices(lead("wp-karnataka.json").wikitext);
  const mh = parseStateInfoboxOffices(lead("wp-maharashtra.json").wikitext);

  it("our Karnataka CM row disagrees with both sources, which agree with each other", () => {
    const wd = wdFor("Q1185", "P6");
    const checks = officeChecks("Siddaramaiah", { people: ka["chief-minister"], url: "https://en.wikipedia.org/wiki/Karnataka" }, wd);
    expect(checks.map((c) => c.agreed)).toEqual([false, false]);
    expect(decideStatus(checks, { primaryCounts: false }).status).toBe("disagreement");
    expect(sourcesAgreeWithEachOther(checks, ka["chief-minister"], wd)).toBe(true);
    expect(checks[1].asOf?.slice(0, 10)).toBe("2026-06-03");
    expect(mismatchHeadline("Chief Minister of Karnataka", "Siddaramaiah", checks)).toBe(
      "Chief Minister of Karnataka: we show Siddaramaiah; Wikipedia: D. K. Shivakumar; Wikidata: D. K. Shivakumar (since 3 Jun 2026)",
    );
  });
  it("a spelling variant of the Karnataka Governor is verified by both", () => {
    const checks = officeChecks("Thaavar Chand Gehlot", { people: ka.governor, url: null }, wdFor("Q1185", "P35"));
    expect(decideStatus(checks, { primaryCounts: false }).status).toBe("verified");
  });
  it("Maharashtra Governor: Wikipedia agrees, Wikidata's statement is outdated → disagreement, no suggestion", () => {
    const wd = wdFor("Q1191", "P35");
    const checks = officeChecks("Jishnu Dev Varma", { people: mh.governor, url: null }, wd);
    expect(checks.map((c) => c.agreed)).toEqual([true, false]);
    expect(checks[1].value).toBe("Ramesh Bais");
    expect(decideStatus(checks, { primaryCounts: false }).status).toBe("disagreement");
    expect(sourcesAgreeWithEachOther(checks, mh.governor, wd)).toBe(false);
  });
  it("Maharashtra CM: the preferred statement wins over an open older one", () => {
    const checks = officeChecks("Devendra Fadnavis", { people: mh["chief-minister"], url: null }, wdFor("Q1191", "P6"));
    expect(decideStatus(checks, { primaryCounts: false }).status).toBe("verified");
  });
  it("no Wikidata answer → single-source when Wikipedia agrees", () => {
    const checks = officeChecks("Eknath Shinde", { people: mh["deputy-cm"], url: null }, undefined);
    expect(checks[1].agreed).toBeNull();
    expect(decideStatus(checks, { primaryCounts: false })).toMatchObject({ status: "single-source", reason: "second-source-no-data" });
  });
  it("an empty infobox field is 'no answer', not a disagreement", () => {
    const checks = officeChecks("Someone Else", { people: [], url: null }, undefined);
    expect(checks.every((c) => c.agreed === null)).toBe(true);
    expect(wikipediaNames([{ name: "Revanth Reddy", link: "Revanth Reddy (politician)" }])).toEqual(["Revanth Reddy"]);
  });
});
