/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// News intelligence — PURE helpers (no DB, no AI), unit-tested in
// tests/news-intel.test.ts. The runner is src/scraper/jobs/ai-analyzer.ts.
//
//   planNewsIntelRun()     which districts need work, in which order
//   buildNewsIntelPrompt() ONE prompt per district covering every module
//   parseNewsIntelAnswer() turn the model's JSON into clean insights
// ═══════════════════════════════════════════════════════════

/** Modules that can carry a news-based AI insight. */
export const NEWS_INTEL_MODULES = [
  "overview", "leadership", "finance", "water", "crops",
  "weather", "police", "elections", "health", "power",
] as const;

// ── Run planning ────────────────────────────────────────────
export interface NewsIntelPlan {
  /** District ids to analyse, least-recently-attempted first. */
  order: string[];
  /** District ids with no news newer than their last successful analysis. */
  noNewNews: string[];
}

/**
 * - A district needs analysis only when it has fresh news fetched AFTER its
 *   last successful analysis (or it was never analysed successfully).
 * - Districts that were attempted longest ago go first, so a run that stops
 *   at its time budget never starves the same districts twice (it used to go
 *   alphabetically and Pune/New Delhi went two months without an insight).
 */
export function planNewsIntelRun(
  districtIds: readonly string[],
  newestNewsAt: ReadonlyMap<string, Date>,
  lastSuccessAt: ReadonlyMap<string, Date>,
  lastAttemptAt: ReadonlyMap<string, Date>,
): NewsIntelPlan {
  const candidates: string[] = [];
  const noNewNews: string[] = [];
  for (const id of districtIds) {
    const newest = newestNewsAt.get(id);
    const success = lastSuccessAt.get(id);
    if (!newest || (success && newest.getTime() <= success.getTime())) noNewNews.push(id);
    else candidates.push(id);
  }
  const rank = (id: string) => lastAttemptAt.get(id)?.getTime() ?? -Infinity;
  const order = candidates
    .map((id, i) => ({ id, i }))
    .sort((a, b) => rank(a.id) - rank(b.id) || a.i - b.i)
    .map((x) => x.id);
  return { order, noNewNews };
}

// ── Prompt ──────────────────────────────────────────────────
export interface NewsIntelArticle {
  id: string;
  title: string;
  summary?: string | null;
  url: string;
}

export function buildNewsIntelPrompt(input: {
  districtName: string;
  stateName: string;
  modules: readonly string[];
  articles: readonly NewsIntelArticle[];
  contextLines: readonly string[];
}): { systemPrompt: string; userPrompt: string } {
  const newsText = input.articles
    .map((n, i) => `[${i + 1}] ${n.title}${n.summary ? `\n${n.summary.slice(0, 300)}` : ""}`)
    .join("\n\n");
  const context = input.contextLines.filter(Boolean).join("\n") || "(none)";

  const systemPrompt =
    `You summarise government and civic news for ${input.districtName} district, ${input.stateName}, India, ` +
    "for ordinary citizens. Be factual and neutral. Use ONLY the articles given; never add facts. " +
    "Respond with JSON only.";

  const userPrompt = `Modules: ${input.modules.join(", ")}

News articles (fetched in the last 24 hours):
${newsText}

District context:
${context}

For EACH module that at least one article is clearly relevant to, write one insight. Leave out modules with no relevant article. Ignore articles about other districts or states.

Return ONLY this JSON object:
{
  "insights": {
    "<module>": {
      "headline": "at most 100 characters",
      "summary": "2-3 plain sentences on why this matters for citizens",
      "sentiment": "positive|negative|neutral",
      "confidence": 0.0-1.0,
      "relevantNewsIndices": [1, 2]
    }
  }
}
If no article is relevant to any module, return {"insights": {}}.`;

  return { systemPrompt, userPrompt };
}

// ── Answer parsing ──────────────────────────────────────────
export interface NewsIntelInsight {
  module: string;
  headline: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  confidence: number;
  /** NewsItem ids the insight is based on (at least one). */
  newsIds: string[];
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/**
 * Accepts {"insights": {module: {...}}}, {"insights": [{module, ...}]} or the
 * module keys at the top level. Drops unknown modules, entries without a
 * headline/summary, and entries that cite no valid article. Never throws.
 */
export function parseNewsIntelAnswer(
  answer: unknown,
  modules: readonly string[],
  articleIds: readonly string[],
): NewsIntelInsight[] {
  const root = asRecord(answer);
  if (!root) return [];

  const entries: Array<[string, unknown]> = [];
  const container = root.insights ?? root;
  if (Array.isArray(container)) {
    for (const item of container) {
      const r = asRecord(item);
      if (r && typeof r.module === "string") entries.push([r.module, r]);
    }
  } else {
    const r = asRecord(container);
    if (r) entries.push(...Object.entries(r));
  }

  const allowed = new Set(modules);
  const seen = new Set<string>();
  const out: NewsIntelInsight[] = [];
  for (const [rawModule, value] of entries) {
    const moduleName = rawModule.trim().toLowerCase();
    if (!allowed.has(moduleName) || seen.has(moduleName)) continue;
    const v = asRecord(value);
    if (!v || v.noRelevantNews === true) continue;

    const headline = typeof v.headline === "string" ? v.headline.trim() : "";
    const summary = typeof v.summary === "string" ? v.summary.trim() : "";
    if (!headline || !summary) continue;

    const indices = Array.isArray(v.relevantNewsIndices) ? v.relevantNewsIndices : [];
    const newsIds = [
      ...new Set(
        indices
          .map((x) => (typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= articleIds.length)
          .map((n) => articleIds[n - 1]),
      ),
    ];
    if (newsIds.length === 0) continue; // no source, no insight

    const sentiment = v.sentiment === "positive" || v.sentiment === "negative" ? v.sentiment : "neutral";
    const c = typeof v.confidence === "number" ? v.confidence : Number(v.confidence);
    const confidence = Number.isFinite(c) ? Math.min(1, Math.max(0, c)) : 0.5;

    seen.add(moduleName);
    out.push({ module: moduleName, headline: headline.slice(0, 120), summary: summary.slice(0, 500), sentiment, confidence, newsIds });
  }
  return out;
}
