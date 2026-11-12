/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

type Client = ReturnType<typeof createPrismaClient>;

// On Cloudflare Workers a socket opened while serving one request cannot be
// used by another ("Cannot perform I/O on behalf of a different request"), so
// a module-level client breaks there. @opennextjs/cloudflare exposes the
// current request's { env, ctx } on this global symbol; on Workers each
// request (keyed by its ctx) gets its own client, created on first use. When a
// Hyperdrive binding is configured its pooled connection string is used.
// Everywhere else (next dev, next build, Node) the singleton below is used.
const CF_CONTEXT = Symbol.for("__cloudflare-context__");
type CfContext = { ctx?: object; env?: { HYPERDRIVE?: { connectionString?: string } } };
const perRequest = new WeakMap<object, Client>();

const globalForPrisma = globalThis as unknown as { prisma: Client | undefined };

function currentClient(): Client {
  const cf = (globalThis as unknown as Record<symbol, CfContext | undefined>)[CF_CONTEXT];
  if (cf?.ctx) {
    let client = perRequest.get(cf.ctx);
    if (!client) {
      client = createPrismaClient(cf.env?.HYPERDRIVE?.connectionString ?? process.env.DATABASE_URL);
      perRequest.set(cf.ctx, client);
    }
    return client;
  }
  // Prisma singleton — reuse in dev to avoid exhausting connections
  globalForPrisma.prisma ??= createPrismaClient();
  return globalForPrisma.prisma;
}

export const prisma: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = currentClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export default prisma;
