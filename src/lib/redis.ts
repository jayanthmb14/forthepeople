/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { Redis } from "@upstash/redis";

// @upstash/redis uses HTTP REST — no persistent TCP connections,
// which is required for Vercel serverless. Reads credentials from
// REDIS_URL (REST URL) and REDIS_TOKEN (REST token).
function createRedisClient() {
  const url = process.env.REDIS_URL;
  const token = process.env.REDIS_TOKEN;

  if (!url || !token) {
    console.warn("[Redis] REDIS_URL or REDIS_TOKEN not set — cache disabled");
    // Return a no-op stub so the app degrades gracefully
    return null;
  }

  return new Redis({ url, token });
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
