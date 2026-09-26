/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Vitest configuration. Tests live in tests/ and cover PURE helpers only
 * (no database, no Redis, no network), so `npm test` runs anywhere in a few
 * seconds and needs no .env.local. Run with:
 *   npm test          → single run (CI)
 *   npm run test:watch
 */
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig "paths" so tests can import "@/lib/..." like app code.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Never pick up anything from the Next build output or generated client.
    exclude: ["node_modules/**", ".next/**", "src/generated/**"],
  },
});
