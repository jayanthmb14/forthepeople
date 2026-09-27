/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Government Schemes — MyScheme.gov.in API
// Schedule: Monthly (1st of month, 7 AM)
// Source: api.myscheme.gov.in / data.gov.in
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

// MyScheme.gov.in public API
const MYSCHEME_API = "https://api.myscheme.gov.in/search/v4/schemes";

const STATE_CODES: Record<string, string> = {
  karnataka: "KA",
  "tamil-nadu": "TN",
  "andhra-pradesh": "AP",
  telangana: "TS",
  maharashtra: "MH",
};

export async function scrapeSchemes(ctx: JobContext): Promise<ScraperResult> {
  try {
    let newCount = 0;
    let updatedCount = 0;

    const stateCode = STATE_CODES[ctx.stateSlug] ?? "KA";

    // Fetch central + state schemes
    const searches = [
      { keyword: "agriculture farmer", category: "Agriculture" },
      { keyword: "rural housing poor", category: "Housing" },
      { keyword: "health medical insurance", category: "Health" },
      { keyword: "education scholarship student", category: "Education" },
      { keyword: "women self help group", category: "Women" },
      { keyword: "farmer msp price", category: "Agriculture" },
    ];

    for (const { keyword, category } of searches) {
      await new Promise((r) => setTimeout(r, 1000)); // rate-limit

      const params = new URLSearchParams({
        keyword,
        state: stateCode,
        lang: "en",
        beneficiary: "Farmer",
        sort: "a-z",
        from: "0",
        size: "20",
      });

      const res = await fetch(`${MYSCHEME_API}?${params}`, {
        headers: {
          "User-Agent": "ForThePeople.in/1.0",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const schemes = json?.data?.hits ?? json?.schemes ?? [];

      for (const scheme of schemes) {
        const name = (scheme.schemeName ?? scheme.name ?? "").trim();
        if (!name) continue;

        const applyUrl = scheme.applicationProcess?.[0]?.offlineProcess?.url
          ?? scheme.slug
            ? `https://myscheme.gov.in/schemes/${scheme.slug}`
            : null;

        // Only the all-India row this collector keeps (districtId null): a
        // district row with the same name was reviewed by hand and may be
        // retired on purpose (active=false) — never re-activate or relabel it.
        const existing = await prisma.scheme.findFirst({
          where: { name, districtId: null },
        });

        if (!existing) {
          await prisma.scheme.create({
            data: {
              districtId: null, // national/state scheme
              name,
              category,
              eligibility: scheme.beneficiary?.join(", ") ?? null,
              applyUrl,
              level: scheme.level ?? "Central",
              active: true,
              source: "MyScheme.gov.in",
            },
          });
          newCount++;
        } else {
          // Refresh apply URL if changed
          await prisma.scheme.update({
            where: { id: existing.id },
            data: { applyUrl, active: true, source: "MyScheme.gov.in" },
          });
          updatedCount++;
        }
      }
    }

    ctx.log(`Schemes: ${newCount} new, ${updatedCount} updated`);
    return { success: true, recordsNew: newCount, recordsUpdated: updatedCount };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
