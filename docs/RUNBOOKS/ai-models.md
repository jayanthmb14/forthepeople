# Runbook: AI models (OpenRouter)

Owner: Jayanth M B. Last verified: 2026-09-27.

All AI calls in the codebase go through `callAI()` / `callAIJSON()` in
`src/lib/ai-provider.ts`. This runbook covers what to do when a model
disappears, how to opt into the paid backstop, and the monthly check.

## 1. What is wired today

The chains live in `src/lib/ai-models.ts` (the only place model ids are
written). As of 2026-09-27:

| Purpose (`purpose:` argument) | Chain, in order | Price (USD per 1M in / out) |
|---|---|---|
| `classify`, `summarize`, `format`, `news-analysis`, default | `typesafe/jev-router` → `google/gemma-4-26b-a4b-it:free` → `openrouter/free` → paid backstop `openai/gpt-5.6-luna` (only when `AI_PAID_FALLBACK=1`) | router: price of the model it picks (a free stealth model on 27 Sep) · free · free · 0.20 / 1.20 |
| `insight`, `document`, `document-large` | `openai/gpt-5.6-luna` → `google/gemini-3.1-flash-lite` → the free Tier-1 chain | 0.20 / 1.20 · 0.25 / 1.50 |
| `fact-check` | `anthropic/claude-sonnet-5` → `anthropic/claude-haiku-4.5` (never a free model) | 2 / 10 · 1 / 5 |

`AI_PAID_FALLBACK=1` was set in Vercel (all environments) on 2026-09-27. A
news article that falls through to the backstop costs about $0.0004.

**Why these models.** On 2026-09-27 the news-analysis prompt was run on 28
real headlines (all 10 districts) and scored against Claude Sonnet 5:

| Model | Valid JSON | Same "about this district" call | Same module | Median time | Cost for 28 |
|---|---|---|---|---|---|
| openai/gpt-5.6-luna | 28 | 28 | 22 | 2.4 s | $0.010 |
| typesafe/jev-router | 28 | 26 (2 cautious "no") | 19 | 3.9 s | $0 |
| google/gemini-3.1-flash-lite | 28 | 27 | 17 | 1.7 s | $0.015 |
| z-ai/glm-5.3-flashx | 28 | 27 | 17 | 2.1 s | $0.012 |
| deepseek/deepseek-v4.1-flash | 26 | 22 | 16 | 6.4 s | $0.021 |
| z-ai/glm-5.3-flash | 22 (timeouts) | 22 | 14 | 29 s | $0.010 |
| qwen/qwen3.7-flash | 2 | – | – | 16 s | $0.006 |
| google/gemma-4-26b-a4b-it:free | 0 (rate-limited) | – | – | – | $0 |

**Jev Router caveats.** It chooses its own model and reasoning effort, so it
rejects `response_format` and `reasoning` (listed in `PLAIN_PARAMS_MODELS`,
which sends it the plain request). It was free on 27 Sep because it routed to
a stealth model; stealth models end without notice and the router may start
picking paid models. The OpenRouter key's $10/month limit caps the risk —
check Activity on openrouter.ai monthly.

At most **4 models** are tried per Tier-1/Tier-2 call (2 for fact-check), and
the paid backstop always keeps the last slot. One `AIUsageLog` row is written
per call; if fallbacks were used, `errorMsg` says `fallback after: <model> (gone|429|...)`.

## 2. How the provider protects itself (so you know what the logs mean)

- **Model discovery.** `GET https://openrouter.ai/api/v1/models` is fetched at
  most once every 6 hours and the id list is cached in Redis `ftp:ai:models`
  (plus 30 min in-process). Any chain model that is not on the live list is
  skipped with a log line `[AI] skipping models not on OpenRouter live list: ...`.
  If the fetch fails, the static list is used unchanged.
- **Circuit breaker.** Redis key `ftp:ai:cb:<model>`:
  - 404 / 400 "not found / unavailable / no endpoints" -> model marked dead for **24 h**
  - 429 -> model skipped for **10 min**
  - 5xx / timeout -> no breaker, just move to the next model
- **Degraded flag.** When all attempted models fail, Redis `ftp:ai:degraded`
  is set for 24 h (cleared on the next success) and `/api/health` reports
  `ai: degraded`. The admin gets **one email per day** (`ftp:ai:alerted`).

## 3. Rotating model ids (when a `:free` model disappears)

Symptoms: `/api/health` shows `ai: ❌ degraded`, an email titled
"AI provider degraded: every model failed", Vercel logs full of
`[AI] OpenRouter (<model>) failed: OpenRouter 404`.

1. List what is free right now:
   ```bash
   curl -s https://openrouter.ai/api/v1/models \
     | node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")).data;
       for (const m of d) if (m.id.endsWith(":free")) console.log(m.id, m.context_length)'
   ```
2. Pick replacements with >= 128k context and a general "instruct/it" flavour
   (avoid "content-safety", "code", "fin" specialist models for Tier 1).
3. Edit `src/lib/ai-provider.ts`:
   - `getModelForPurpose()` for the primary ids
   - `FREE_FALLBACK_MODELS` for the chain
   - `PRICE_TABLE` — add every new id (free ones as `[0, 0]`)
4. Update the table in section 1 of this file and the date at the top.
5. `npx tsc --noEmit`, commit, deploy.
6. Verify (no deploy needed for the breaker to reset — it expires by itself,
   but you can clear it by hand):
   ```bash
   # from Upstash console or redis-cli against the REST URL:
   DEL ftp:ai:models ftp:ai:degraded
   # then trigger one AI cron and watch /api/health
   curl -H "Authorization: Bearer $CRON_SECRET" https://forthepeople.in/api/cron/news-intelligence
   curl -s https://forthepeople.in/api/health | jq .checks.ai
   ```

## 4. `AI_PAID_FALLBACK` (Vercel env var)

- Name: `AI_PAID_FALLBACK`. Value `1` enables the paid backstop; anything
  else (or unset) keeps the platform on free models only.
- Where: Vercel -> Project -> Settings -> Environment Variables -> Production.
  Redeploy after changing it (env vars are read at runtime, but a redeploy
  makes the change visible immediately on every lambda).
- Turn it on only when every free model is failing and you cannot rotate ids
  the same day. Turn it off again afterwards. Cost ceiling is ~Rs 85/month.

## 5. Monthly free-availability check (first Monday of the month)

1. Run the curl from section 3 step 1 and confirm every id in section 1 is
   still listed. Missing id = rotate now, do not wait for the outage.
2. Open `/en/admin` -> AI Costs and check the last 30 days of `AIUsageLog`:
   `costUSD` should be a few cents unless `document-large` / `fact-check` ran.
3. `curl -s https://forthepeople.in/api/health | jq '.checks'` — `ai` must be
   `✅ ok` and no cron should be listed as stale.
4. Note the check in the Obsidian vault (Forthepeople folder, cost note).

## 6. Related keys and files

- Env: `OPENROUTER_API_KEY` (required), `AI_PAID_FALLBACK` (optional),
  `FTP_AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` (scripts only, bypasses OpenRouter).
- Redis: `ftp:ai:models`, `ftp:ai:cb:<model>`, `ftp:ai:degraded`, `ftp:ai:alerted`.
- Code: `src/lib/ai-provider.ts`, `src/app/api/health/route.ts`, `src/lib/admin-alerts.ts`.
