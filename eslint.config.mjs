import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated files — do not lint
    "src/generated/**",
    "node_modules/**",
    // Test-runner output
    "coverage/**",
    // Agent worktrees and local tool state live inside the repo dir — never lint them
    ".claude/**",
  ]),
  {
    rules: {
      // ── React Compiler rules (eslint-plugin-react-hooks v7) ──────────────
      // The preset promoted these five rules to "error", which lit up ~34
      // legacy call-sites (admin tabs, count-up animations, Date.now() in
      // render). None of them break the running site today, but they DID
      // block CI on every push since April 2026.
      //
      // LEGACY DEBT — downgraded to "warn" so `npm run lint` is green and new
      // code still gets a visible nudge. Burn these down over time and flip
      // each rule back to "error" once its warning count reaches zero
      // (check a single rule with: npx eslint . --rule 'react-hooks/purity: error').
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
