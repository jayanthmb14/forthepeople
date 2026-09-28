// ═══════════════════════════════════════════════════════════
// seed-guard.ts — stop a demo seed from touching a real database.
//
// The seeds in prisma/archive/ wipe tables or write invented demo rows
// (random rainfall, crop prices stamped with the run date). `.env`
// can point at production, so each of them calls
// exitUnlessLocalSeedAllowed() before it does anything. It runs only when
//   - ALLOW_SEED_WIPE=1 is set, and
//   - the DATABASE_URL host is this machine (localhost / 127.0.0.1 / ::1).
// Pure helpers are unit-tested in tests/seed-guard.test.ts.
// ═══════════════════════════════════════════════════════════

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

type SeedEnv = { ALLOW_SEED_WIPE?: string; DATABASE_URL?: string };

/** The host part of a Postgres URL, lower-cased; null when unreadable. */
export function databaseHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

/** Why a demo seed must not run here; null when it may. Never includes the URL. */
export function seedWipeRefusal(env: SeedEnv): string | null {
  if (env.ALLOW_SEED_WIPE !== "1") {
    return "ALLOW_SEED_WIPE=1 is not set";
  }
  const host = databaseHost(env.DATABASE_URL);
  if (!host || !LOCAL_DB_HOSTS.has(host)) {
    return "DATABASE_URL does not point at a database on this machine";
  }
  return null;
}

/** Exit the process (code 1) unless seedWipeRefusal() allows the run. */
export function exitUnlessLocalSeedAllowed(): void {
  const why = seedWipeRefusal({
    ALLOW_SEED_WIPE: process.env.ALLOW_SEED_WIPE,
    DATABASE_URL: process.env.DATABASE_URL,
  });
  if (why === null) return;
  console.error(
    `Refusing to run an archived demo seed: ${why}.\n` +
      "These seeds wipe tables or write invented demo rows. They run only with\n" +
      "ALLOW_SEED_WIPE=1 against a local database (see prisma/archive/README.md).",
  );
  process.exit(1);
}
