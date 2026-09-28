/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// The query string of GET /api/tenders/<district> → a Prisma where / order
// (pure; tests/tender-list-query.test.ts). Numbers must be plain whole
// numbers: "1.5", "abc" or "-3" used to reach BigInt() / parseInt() and
// answer 500 or send NaN to the database; now they are a 400.
import type { Prisma } from "@/generated/prisma";
import { NOT_STUB_TENDER } from "@/lib/data-filters";

export interface TenderListQuery {
  page: number;
  pageSize: number;
  where: Prisma.TenderWhereInput;
  orderBy: Prisma.TenderOrderByWithRelationInput;
}

export type TenderQueryResult = { ok: true; query: TenderListQuery } | { ok: false; code: "BAD_PARAM"; message: string };

/** Whole numbers only, with a length cap so the result stays a safe number / date. */
const WHOLE = {
  page: /^\d{1,6}$/,
  pageSize: /^\d{1,3}$/,
  value: /^\d{1,18}$/, // rupees; fits a Postgres bigint
  days: /^\d{1,4}$/,
} as const;

export function parseTenderQuery(sp: URLSearchParams, districtName: string, now: Date = new Date()): TenderQueryResult {
  const bad = (name: string): TenderQueryResult => ({ ok: false, code: "BAD_PARAM", message: `${name} must be a whole number` });

  const pageArg = sp.get("page") ?? "1";
  const pageSizeArg = sp.get("pageSize") ?? "20";
  if (!WHOLE.page.test(pageArg)) return bad("page");
  if (!WHOLE.pageSize.test(pageSizeArg)) return bad("pageSize");
  const page = Math.max(1, Number(pageArg));
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeArg)));

  const statusArg = sp.get("status") ?? "LIVE";
  const sortBy = sp.get("sortBy") ?? "deadline";
  const search = sp.get("search")?.trim();

  // Seeded placeholder rows are never listed (data-filters.ts, Sept 2026 audit).
  const where: Prisma.TenderWhereInput = { locationDistrict: districtName, ...NOT_STUB_TENDER };

  // Primary status bucket
  if (statusArg === "LIVE") where.bidSubmissionEnd = { gte: now };
  else if (statusArg === "CLOSING_SOON") where.bidSubmissionEnd = { gte: now, lte: new Date(now.getTime() + 48 * 3600_000) };
  else if (statusArg === "AWARDED") where.status = "AWARDED";
  else if (statusArg === "ARCHIVE") where.bidSubmissionEnd = { lt: now };
  else where.status = statusArg;

  // Facets
  const valueMin = sp.get("valueMin");
  const valueMax = sp.get("valueMax");
  if (valueMin && !WHOLE.value.test(valueMin)) return bad("valueMin");
  if (valueMax && !WHOLE.value.test(valueMax)) return bad("valueMax");
  if (valueMin || valueMax) {
    const value: Prisma.BigIntFilter = {};
    if (valueMin) value.gte = BigInt(valueMin);
    if (valueMax) value.lte = BigInt(valueMax);
    where.estimatedValueInr = value;
  }
  const categorySlug = sp.get("category");
  if (categorySlug) where.category = { slug: categorySlug };
  const authorityCode = sp.get("authority");
  if (authorityCode) where.authority = { shortCode: authorityCode };
  const daysToDeadline = sp.get("daysToDeadline");
  if (daysToDeadline) {
    if (!WHOLE.days.test(daysToDeadline)) return bad("daysToDeadline");
    where.bidSubmissionEnd = {
      ...(where.bidSubmissionEnd as Prisma.DateTimeFilter),
      lte: new Date(now.getTime() + Number(daysToDeadline) * 86400_000),
    };
  }
  if (sp.get("mseReserved") === "true") where.mseReserved = true;
  if (sp.get("startupExempt") === "true") where.startupExempt = true;
  if (search) where.title = { contains: search, mode: "insensitive" };

  const orderBy: Prisma.TenderOrderByWithRelationInput =
    sortBy === "value" ? { estimatedValueInr: "desc" } :
    sortBy === "published" ? { publishedAt: "desc" } :
    { bidSubmissionEnd: "asc" };

  return { ok: true, query: { page, pageSize, where, orderBy } };
}
