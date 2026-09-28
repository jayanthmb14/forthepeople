/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// A server action is a public POST endpoint: anyone holding its action id
// can call it without loading the page. So every inline "use server"
// function under the admin console must check the admin session itself
// (requireAdmin), and none may mint a session of its own — login lives only
// in src/app/[locale]/admin/actions.ts (password + 2FA + limiter + lockout).
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ADMIN_DIR = path.resolve(__dirname, "../src/app/[locale]/admin");
/** The login flow itself: it runs before there is a session. */
const LOGIN_FILE = path.join(ADMIN_DIR, "actions.ts");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

/** Body text of every function whose first statement is "use server". */
function inlineServerActions(src: string): Array<{ name: string; body: string }> {
  const out: Array<{ name: string; body: string }> = [];
  const re = /async function (\w+)\s*\([^)]*\)[^{]*\{\s*["']use server["'];?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    // The body runs until the next top-level function or const.
    const rest = src.slice(m.index + m[0].length);
    const end = rest.search(/\n(?:export |async function |function |const )/);
    out.push({ name: m[1], body: end === -1 ? rest : rest.slice(0, end) });
  }
  return out;
}

describe("admin server actions", () => {
  const files = sourceFiles(ADMIN_DIR).filter((f) => f !== LOGIN_FILE);

  it("finds the admin console files", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const action of inlineServerActions(src)) {
      it(`${path.relative(ADMIN_DIR, file)} → ${action.name} checks requireAdmin()`, () => {
        expect(action.body).toMatch(/requireAdmin\(\)/);
      });
    }
  }

  it("no console page mints an admin session of its own", () => {
    const minting = files.filter((f) => /createAdminSession\(/.test(readFileSync(f, "utf8")));
    expect(minting.map((f) => path.relative(ADMIN_DIR, f))).toEqual([]);
  });
});
