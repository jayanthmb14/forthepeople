// OpenNext config for Cloudflare Workers (see wrangler.jsonc, docs/RUNBOOKS/CLOUDFLARE.md).
// ISR pages and unstable_cache entries live in R2, revalidatePath/revalidateTag
// state in D1, and stale pages are regenerated in the background by a Durable
// Object queue — the same behaviour Vercel's ISR gave.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
  tagCache: d1NextTagCache,
});
