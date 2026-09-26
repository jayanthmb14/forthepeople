# Runbook: AI models (OpenRouter)

Owner: Jayanth M B. Last verified: 2026-09-27.

All AI calls in the codebase go through `callAI()` / `callAIJSON()` in
`src/lib/ai-provider.ts`. This runbook covers what to do when a model
disappears, how to opt into the paid backstop, and the monthly check.

## 1. What is wired today

| Purpose (`purpose:` argument) | Model | Price (USD per 1M in / out) |
|---|---|---|
| `classify`, `summarize`, `format`, `news-analysis`, default | `google/gemma-4-31b-it:free` | 0 / 0 |
| `insight`, `document` | `google/gemini-2.5-flash-lite` | 0.10 / 0.40 |
| `document-large` | `google/gemini-2.5-pro` | 1.25 / 10 |
| `fact-check` | `anthropic/claude-sonnet-4` | 3 / 15 |

Free fallback chain (tried in order when the primary fails):

1. `google/gemma-4-26b-a4b-it:free`
2. `nvidia/nemotron-3-super-120b-a12b:free`
3. `qwen/qwen3.8-27b:free`
4. `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`
5. `nvidia/nemotron-3-ultra-550b-a55b:free`

Paid backstop (only when `AI_PAID_FALLBACK=1`): `openai/gpt-oss-20b`
(0.018 / 0.09 per 1M). Worst case if every Tier-1 call lands here: about
$1/month (~Rs 85).

At most **3 models** are tried per call. One `AIUsageLog` row is written per
call; if fallbacks were used, `errorMsg` says `fallback after: <model> (gone|429|...)`.

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
