/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════
// Machine-translation providers for LIVE text (news, AI insights)
// ═══════════════════════════════════════════════════════════
// Only the translate-content job calls these (src/lib/translation/job.ts).
// Page requests NEVER do — they read stored rows (overlay.ts). So a visitor
// switching language costs nothing.
//
// Pick a provider with TRANSLATION_PROVIDER, or leave it unset and the first
// provider whose key is present is used. No key → translation is off and the
// site shows the English text (with lang="en") in every language.
//
//   bhashini  BHASHINI_USER_ID + BHASHINI_API_KEY   (Govt of India, all 22)
//   google    GOOGLE_TRANSLATE_API_KEY              (Cloud Translation v2)
//   sarvam    SARVAM_API_KEY                        (sarvam-translate, all 22)
//
// Each provider's request shape follows its public docs; run
//   GET /api/cron/translate-content?dry=1   (with the cron secret)
// once after adding a key to confirm the call works before relying on it.

export interface TranslationProvider {
  name: "bhashini" | "google" | "sarvam";
  /** Most characters to send in one request. */
  maxBatchChars: number;
  /** Most texts to send in one request. */
  maxBatchItems: number;
  /** Registry codes this provider cannot translate into. */
  unsupported: ReadonlySet<string>;
  /** Translate English texts into `locale`; returns one string per input, same order. */
  translate(texts: string[], locale: string): Promise<string[]>;
}

const TIMEOUT_MS = 25_000;

async function postJSON(url: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new Error(`HTTP ${res.status} ${detail}`);
  }
  return res.json();
}

function mustBeStrings(out: unknown[], n: number, who: string): string[] {
  if (out.length !== n || out.some((s) => typeof s !== "string" || !s.trim())) {
    throw new Error(`${who}: expected ${n} translations, got ${out.length}`);
  }
  return out as string[];
}

// ── Bhashini (ULCA pipeline: config call → inference call) ──
// Registry code → Bhashini language code where they differ.
const BHASHINI_CODES: Record<string, string> = { kok: "gom" };

function bhashini(userId: string, apiKey: string): TranslationProvider {
  const pipelineId = process.env.BHASHINI_PIPELINE_ID || "64392f96daac500b55c543cd";
  // The config call returns a service id + inference key per language pair;
  // keep them for the life of this process (one cron run).
  const configs = new Map<string, { url: string; authName: string; authValue: string; serviceId: string }>();

  async function config(target: string) {
    const hit = configs.get(target);
    if (hit) return hit;
    const json = (await postJSON(
      "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline",
      {
        pipelineTasks: [{ taskType: "translation", config: { language: { sourceLanguage: "en", targetLanguage: target } } }],
        pipelineRequestConfig: { pipelineId },
      },
      { userID: userId, ulcaApiKey: apiKey },
    )) as {
      pipelineResponseConfig?: { config?: { serviceId?: string }[] }[];
      pipelineInferenceAPIEndPoint?: { callbackUrl?: string; inferenceApiKey?: { name?: string; value?: string } };
    };
    const serviceId = json.pipelineResponseConfig?.[0]?.config?.[0]?.serviceId;
    const ep = json.pipelineInferenceAPIEndPoint;
    if (!serviceId || !ep?.callbackUrl || !ep.inferenceApiKey?.name || !ep.inferenceApiKey.value) {
      throw new Error(`bhashini: no translation service for en→${target}`);
    }
    const c = { url: ep.callbackUrl, authName: ep.inferenceApiKey.name, authValue: ep.inferenceApiKey.value, serviceId };
    configs.set(target, c);
    return c;
  }

  return {
    name: "bhashini",
    maxBatchChars: 8_000,
    maxBatchItems: 25,
    unsupported: new Set(),
    async translate(texts, locale) {
      const target = BHASHINI_CODES[locale] ?? locale;
      const c = await config(target);
      const json = (await postJSON(
        c.url,
        {
          pipelineTasks: [
            { taskType: "translation", config: { language: { sourceLanguage: "en", targetLanguage: target }, serviceId: c.serviceId } },
          ],
          inputData: { input: texts.map((source) => ({ source })) },
        },
        { [c.authName]: c.authValue },
      )) as { pipelineResponse?: { output?: { target?: string }[] }[] };
      const out = json.pipelineResponse?.[0]?.output ?? [];
      return mustBeStrings(out.map((o) => o.target), texts.length, "bhashini");
    },
  };
}

// ── Google Cloud Translation v2 (basic) ─────────────────
const GOOGLE_CODES: Record<string, string> = { kok: "gom", mni: "mni-Mtei" };

function google(key: string): TranslationProvider {
  return {
    name: "google",
    maxBatchChars: 20_000,
    maxBatchItems: 100,
    // Not offered by Cloud Translation v2 at the time of writing.
    unsupported: new Set(["brx", "ks", "sat"]),
    async translate(texts, locale) {
      const json = (await postJSON(
        `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`,
        { q: texts, source: "en", target: GOOGLE_CODES[locale] ?? locale, format: "text" },
        {},
      )) as { data?: { translations?: { translatedText?: string }[] } };
      const out = json.data?.translations ?? [];
      return mustBeStrings(out.map((t) => t.translatedText), texts.length, "google");
    },
  };
}

// ── Sarvam (one text per request) ───────────────────────
function sarvam(key: string): TranslationProvider {
  const model = process.env.SARVAM_TRANSLATE_MODEL || "sarvam-translate:v1";
  return {
    name: "sarvam",
    maxBatchChars: 2_000,
    maxBatchItems: 1,
    unsupported: new Set(),
    async translate(texts, locale) {
      const out: (string | undefined)[] = [];
      for (const input of texts) {
        const json = (await postJSON(
          "https://api.sarvam.ai/translate",
          // Sarvam writes Odia as "od" (ISO 639-1 is "or"); every other code matches.
          { input, source_language_code: "en-IN", target_language_code: `${locale === "or" ? "od" : locale}-IN`, model },
          { "api-subscription-key": key },
        )) as { translated_text?: string };
        out.push(json.translated_text);
      }
      return mustBeStrings(out, texts.length, "sarvam");
    },
  };
}

/** The configured provider, or null when no key is set (translation off). */
export function getTranslationProvider(): TranslationProvider | null {
  const env = process.env;
  const want = (env.TRANSLATION_PROVIDER ?? "").trim().toLowerCase();
  const make: Record<string, () => TranslationProvider | null> = {
    bhashini: () => (env.BHASHINI_USER_ID && env.BHASHINI_API_KEY ? bhashini(env.BHASHINI_USER_ID, env.BHASHINI_API_KEY) : null),
    google: () => (env.GOOGLE_TRANSLATE_API_KEY ? google(env.GOOGLE_TRANSLATE_API_KEY) : null),
    sarvam: () => (env.SARVAM_API_KEY ? sarvam(env.SARVAM_API_KEY) : null),
  };
  if (want === "off" || want === "none") return null;
  if (want) return make[want]?.() ?? null;
  return make.bhashini() ?? make.google() ?? make.sarvam();
}
