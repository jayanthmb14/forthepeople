/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════════
//  getGithubStars — the star count for the header's GitHub pill
// ═══════════════════════════════════════════════════════════════════════
//
//  SERVER ONLY. Called from src/app/[locale]/layout.tsx.
//
//  Why on the server: the old header called api.github.com from every
//  visitor's browser. GitHub allows 60 unauthenticated calls per hour per
//  IP, so busy networks (colleges, offices, mobile carriers) hit the limit
//  and the browser logged errors. Now the server asks once an hour
//  (Next.js data cache, `revalidate: 3600`) and passes the number down.
//
//  If GitHub is slow (> 1.5 s) or down, we return null and the pill simply
//  shows "GitHub" without a number — never a made-up count.
//

const REPO_API = "https://api.github.com/repos/jayanthmb14/forthepeople";

export async function getGithubStars(): Promise<number | null> {
  try {
    const res = await fetch(REPO_API, {
      headers: { Accept: "application/vnd.github.v3+json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: unknown };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}
