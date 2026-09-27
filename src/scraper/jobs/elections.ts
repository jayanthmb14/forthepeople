/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Elections — Election Commission of India
// Schedule: Monthly (1st of month, 8 AM) + on election events
// Source: eci.gov.in / data.gov.in ECI datasets
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";
import { firstAmount } from "../lib/sanity";

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

    for (const rec of records) {
      const constituency = (rec.constituency_name ?? rec.ac_name ?? "").trim();
      const electionType = rec.election_type ?? "State Assembly";
      const year = parseInt(rec.year ?? rec.election_year ?? "0", 10);
      if (!constituency || !year) continue;

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

      const existing = await prisma.electionResult.findFirst({
        where: { districtId: ctx.districtId, constituency, year, electionType },
      });

      if (!existing) {
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
