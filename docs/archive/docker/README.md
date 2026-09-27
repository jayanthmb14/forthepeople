# docs/archive/docker — the retired Docker path

Moved here from the repo root on 27 Sep 2026. Production runs on Vercel only;
nothing in CI or Vercel used these files, and they no longer worked:

- `Dockerfile` copied `.next/standalone`, but `next.config.ts` only emits
  standalone output when `DOCKER_BUILD=1`, which the Dockerfile never set.
- Both images used `node:20-alpine`; the project needs Node 24 (`.nvmrc`,
  `package.json` engines).
- `docker-compose.yml` passed `REDIS_URL=redis://redis:6379`, but the code
  only speaks Upstash REST (`REDIS_URL` + `REDIS_TOKEN`).
- `Dockerfile.scraper` ran `src/scraper/scheduler.ts` on the Railway worker,
  which stopped on 2026-04-20. Scheduled jobs are Vercel crons now
  (`vercel.json`, `docs/RUNBOOKS/crons.md`).
- `dockerignore.txt` is the old root `.dockerignore`. It did not exclude the
  local `.env.*` backup files, so `COPY . .` would have baked secrets into an
  image. Fix that first if Docker is ever revived.

To run the collection jobs locally, use `npm run scraper` (no Docker needed).
