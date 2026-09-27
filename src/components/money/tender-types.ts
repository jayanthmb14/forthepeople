/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// Shapes of the tender API responses used by the tender pages and the
// tender DetailSheet. BigInt money fields arrive as strings (serializeForJson).
import type { TenderCardData } from "@/components/tenders/TenderCard";
import type { TimelineEvent } from "@/components/tenders/TenderGanttTimeline";

/** A row of GET /api/tenders/<district>: the card fields plus the scalar fields the API also sends. */
export type TenderListRow = TenderCardData & {
  sourcePortal?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
  emdAmountInr?: string | null;
  tenderFeeInr?: string | null;
  preBidMeetingAt?: string | null;
  lastCheckedAt?: string | null;
};

/** GET /api/tenders/<district>/<id>. */
export type TenderDetail = {
  tender: {
    id: string;
    sourcePortal: string;
    sourceUrl: string;
    title: string;
    description: string | null;
    workType: string;
    procurementType: string;
    authority: { name: string; shortCode: string; authorityType: string; websiteUrl: string | null };
    category: { name: string; slug: string } | null;
    estimatedValueInr: string | null;
    tenderFeeInr: string | null;
    emdAmountInr: string | null;
    performanceSecurityPct: number | null;
    publishedAt: string;
    bidSubmissionEnd: string;
    preBidMeetingAt: string | null;
    technicalOpeningAt: string | null;
    financialOpeningAt: string | null;
    numberOfCovers: number | null;
    status: string;
    locationDistrict: string;
    locationTaluk: string | null;
    mseReserved: boolean;
    startupExempt: boolean;
    eligibility: {
      minAnnualTurnoverInr?: number | null;
      yearsRequired?: number | null;
      similarWorkExp?: string | null;
      registrationTypes?: string[];
      locationRestrictions?: string | null;
    } | null;
    corrigenda: Array<{ id: string; sequenceNo: number; issuedAt: string; changeType: string; summaryPlain: string | null }>;
    awards: Array<{ id: string; winnerName: string; awardedAmountInr: string; priceHitRatePct: number | null; awardedAt: string }>;
    bidders: Array<{ id: string; displayLabel: string; rank: number | null; status: string }>;
    contract: { contractValueInr: string; contractPeriodDays: number | null; implementationStatus: string; expectedCompletionAt: string | null } | null;
    documents: Array<{ id: string; docType: string; displayName: string; sourceUrl: string }>;
    redFlags: Array<{ flagType: string; factualStatement: string; referenceRule: string | null }>;
    aiSummary: {
      plainEnglishSummary: string;
      generatedAt: string;
      aiModel: string;
      documentChecklist: unknown;
      plainBullets: { what?: string; whoCanApply?: string; deadline?: string } | null;
    } | null;
  };
  timeline: TimelineEvent[];
};
