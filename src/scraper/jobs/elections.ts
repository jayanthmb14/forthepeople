/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Elections — Election Commission of India
// Schedule: Monthly (1st of month, 8 AM) + on election events
// Source: eci.gov.in / data.gov.in ECI datasets
//
// electionType is stored in ONE spelling (LOK_SABHA, ASSEMBLY, …) and an
// existing result is found by its canonical key — district, year, type,
// constituency without seat number (src/lib/dedupe/keys.ts). The old exact
// string match let "LokSabha" and "Lok Sabha" rows of the same seat coexist.
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";
import { canonicalElectionType, electionResultKey } from "@/lib/dedupe/keys";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
// ECI constituency-wise election results Karnataka
const ECI_RESOURCE = "b5d4b8b3-3a3e-4e9c-8f42-b6e2f9c7d1a3";

const PARTY_NORMALIZE: Record<string, string> = {
  "bhartiya janata party": "BJP",
  "bjp": "BJP",
  "indian national congress": "INC",
  "congress": "INC",
  "inc": "INC",
  "janata dal (secular)": "JD(S)",
  "jd(s)": "JD(S)",
  "jds": "JD(S)",
};

function normalizeParty(raw: string): string {
  const lower = raw.toLowerCase().trim();
  return PARTY_NORMALIZE[lower] ?? raw.trim();
}

export async function scrapeElections(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Elections: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;

    const url = `${DATA_GOV_BASE}/${ECI_RESOURCE}?api-key=${apiKey}&format=json&limit=100&filters[district]=${encodeURIComponent(ctx.districtSlug)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });

    if (!res.ok) throw new Error(`HTTP ${res.status} from ECI data.gov.in`);

    const json = await res.json();
    const records: Record<string, string>[] = json?.records ?? [];

    // Results already stored for this district, by canonical key.
    const stored = await prisma.electionResult.findMany({
      where: { districtId: ctx.districtId },
      select: { districtId: true, year: true, electionType: true, constituency: true },
      take: 5000,
    });
    const known = new Set(stored.map(electionResultKey).filter((k): k is string => k !== null));

    for (const rec of records) {
      const constituency = (rec.constituency_name ?? rec.ac_name ?? "").trim();
      // This dataset is assembly results; a type it names but we cannot read is skipped.
      const electionType = rec.election_type ? canonicalElectionType(rec.election_type) : "ASSEMBLY";
      const year = parseInt(rec.year ?? rec.election_year ?? "0", 10);
      if (!constituency || !year || !electionType) continue;

      const winnerName = (rec.winner_name ?? rec.winner ?? rec.candidate_name ?? "").trim();
      const winnerParty = normalizeParty(rec.winner_party ?? rec.party ?? "Independent");
      const winnerVotesRaw = firstAmount(rec, ["winner_votes", "votes"]);
      const runnerUpName = (rec.runner_up_name ?? rec.runner_up ?? null)?.trim() ?? null;
      const runnerUpParty = rec.runner_up_party ? normalizeParty(rec.runner_up_party) : null;
      const runnerUpVotes = rec.runner_up_votes ? parseInt(rec.runner_up_votes, 10) : null;
      const margin = rec.margin ? parseInt(rec.margin, 10) : null;
      const turnoutPct = rec.turnout ? parseFloat(rec.turnout) : null;
      const totalVoters = rec.total_voters ? parseInt(rec.total_voters, 10) : null;
      const votesPolled = rec.votes_polled ? parseInt(rec.votes_polled, 10) : null;

      // A result without the winner's published vote count is skipped
      // (the old code stored 0 votes).
      if (!winnerName || winnerVotesRaw === null) continue;
      const winnerVotes = Math.round(winnerVotesRaw);

      const key = electionResultKey({ districtId: ctx.districtId, year, electionType, constituency });
      if (key && !known.has(key)) {
        known.add(key);
        await prisma.electionResult.create({
          data: {
            districtId: ctx.districtId,
            constituency,
            electionType,
            year,
            winnerName,
            winnerParty,
            winnerVotes,
            runnerUpName,
            runnerUpParty,
            runnerUpVotes: runnerUpVotes && !isNaN(runnerUpVotes) ? runnerUpVotes : null,
            margin: margin && !isNaN(margin) ? margin : null,
            turnoutPct: turnoutPct && !isNaN(turnoutPct) ? turnoutPct : null,
            totalVoters: totalVoters && !isNaN(totalVoters) ? totalVoters : null,
            votesPolled: votesPolled && !isNaN(votesPolled) ? votesPolled : null,
            source: "ECI / data.gov.in",
          },
        });
        newCount++;
      }
    }

    ctx.log(`Elections: ${newCount} new results`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
