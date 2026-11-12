# Runbook: hosting on Cloudflare Workers

ForThePeople.in runs as one Cloudflare Worker built by
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). This replaces Vercel.

## How it fits together

| Vercel piece | Cloudflare piece | Where |
|---|---|---|
| Serverless functions + ISR | One Worker (`forthepeople`), ISR pages in R2, `revalidatePath` state in D1, background regeneration in a Durable Object queue | `wrangler.jsonc`, `open-next.config.ts` |
| Vercel Cron (21 jobs) | One Cron Trigger every 5 min; `cloudflare/worker.ts` runs each `vercel.json` cron whose schedule matches that minute, in-process, with `Authorization: Bearer <CRON_SECRET>` | `cloudflare/worker.ts`, `src/lib/cron-match.ts` |
| Image optimisation | Cloudflare Images binding (`IMAGES`) | `wrangler.jsonc` |
| Environment variables | Worker **Variables and Secrets** (runtime) and **Build variables** (Workers Builds) | Dashboard |
| Region `bom1` | Smart Placement (runs near Neon) | `wrangler.jsonc` |

`vercel.json` stays the one list of cron schedules (tests read it). Every minute
field must be a multiple of 5 so the 5-minute trigger reaches it
(`tests/cron-match.test.ts`).

Database: `src/lib/db.ts` gives each Worker request its own Prisma client (a
socket opened by one request cannot be reused by another on Workers). If a
`HYPERDRIVE` binding is added, its pooled connection string is used instead of
`DATABASE_URL`. The client is generated as the `@ftp/prisma-client` package in
`node_modules` and kept out of Next's bundle (`serverExternalPackages`), so the
Worker build uses its workerd entry, which loads the query compiler as a
WebAssembly module (workerd refuses Wasm compiled from bytes at runtime).

Bundle size: about 9.0 MiB gzip (Nov 2026), under the Workers Paid limit of
10 MiB. `.github/workflows/cloudflare-build.yml` reports it on every push to a
`cloudflare/**` branch, together with a workerd smoke test of key pages.

## Commands

```bash
npm run cf:build     # next build + OpenNext bundle into .open-next/
npm run cf:preview   # build, then serve the Worker locally (workerd)
npm run cf:deploy    # build, then deploy (prefer Workers Builds, below)
```

OpenNext warns that Windows is not fully supported: build for production on
Linux (Cloudflare Workers Builds or WSL), not on the Windows PC.

## One-time setup

1. `npx wrangler login`
2. `npx wrangler r2 bucket create forthepeople-opennext-cache`
3. `npx wrangler d1 create forthepeople-tag-cache` and paste the printed
   `database_id` into `wrangler.jsonc` (replace `REPLACE_WITH_D1_ID`).
4. Workers & Pages → Create → Import a repository → `jayanthmb14/forthepeople`,
   branch `main`.
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx opennextjs-cloudflare deploy`
   - Build variables: every variable `next build` reads (at least
     `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_*`, `SENTRY_AUTH_TOKEN`).
5. Worker → Settings → Variables and Secrets: every runtime variable from
   `.env.example` (as **Secret** for keys and passwords).
6. Worker → Settings → Domains & Routes: add `forthepeople.in` and
   `www.forthepeople.in` as Custom Domains (the zone must be on Cloudflare).
7. Workers Paid plan (USD 5/month): the Free plan's 10 ms CPU per request and
   3 MB bundle limit are too small for this site.

## Checks after a deploy

- `/api/health` returns 200; `/en`, a district page and `/hi`, `/kn` load.
- Worker → Observability → Logs: `[cron] /api/cron/... 200` lines every 5 min.
- Razorpay webhook (`/api/webhooks/razorpay`) still reaches the Worker: no
  WAF / Bot rule may challenge it (it is a server-to-server POST).
