/**
 * ForThePeople.in — Content Editor data loader
 * GET /api/admin/content?district=<slug>&module=<name>
 * Returns the rows + editable field list for a supported module+district.
 *
 * Modules are limited to a vetted allowlist so this endpoint can't be used to
 * dump arbitrary tables. Extend CONTENT_MODULES to add more editable modules.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

interface ModuleConfig {
  module: string;
  label: string;
  table: string; // prisma model name (lowercased first letter for client access)
  editableFields: string[];
  // Some tables use `districtId` directly; others don't have a district at all (seeded per-state).
  districtField?: string;
}

export const CONTENT_MODULES: ModuleConfig[] = [
  {
    module: "leaders",
    label: "Leaders",
    table: "leader",
    districtField: "districtId",
    editableFields: [
      "name",
      "title",
      "party",
      "phone",
      "email",
      "photoUrl",
      "termStart",
      "termEnd",
      "active",
    ],
  },
  {
    module: "infrastructure",
    label: "Infrastructure",
    table: "infraProject",
    districtField: "districtId",
    // Field names match the Prisma model (camelCase). News-driven fields
    // included so admins can seed values before the news cron fills them.
    // keyPeople is Json — the client editor accepts raw JSON array.
    editableFields: [
      "name",
      "shortName",
      "description",
      "category",
      "status",
      "scope",
      "contractor",
      "executingAgency",
      "announcedBy",
      "announcedByRole",
      "party",
      "keyPeople",
      "budget",
      "originalBudget",
      "revisedBudget",
      "fundsReleased",
      "progressPct",
      "announcedDate",
      "approvedDate",
      "tenderDate",
      "actualStartDate",
      "startDate",
      "originalEndDate",
      "expectedEnd",
      "revisedEndDate",
      "completionDate",
      "cancelledDate",
      "cancellationReason",
      "source",
    ],
  },
  {
    module: "schemes",
    label: "Government Schemes",
    table: "scheme",
    districtField: "districtId",
    editableFields: ["name", "description", "eligibility", "benefits", "applicationUrl", "active"],
  },
  {
    module: "offices",
    label: "Government Offices",
    table: "govOffice",
    districtField: "districtId",
    editableFields: ["name", "category", "address", "phone", "hours", "websiteUrl"],
  },
  {
    module: "police",
    label: "Police Stations",
    table: "policeStation",
    districtField: "districtId",
    editableFields: ["name", "address", "phone", "spPhone", "latitude", "longitude"],
  },
  {
    module: "schools",
    label: "Schools",
    table: "school",
    districtField: "districtId",
    editableFields: ["name", "category", "medium", "enrollment", "phone", "address"],
  },
  {
    module: "famous",
    label: "Famous Personalities",
    table: "famousPersonality",
    districtField: "districtId",
    editableFields: ["name", "category", "bio", "photoUrl", "wikiUrl", "notable", "birthYear", "active"],
  },
  {
    module: "budget",
    label: "Budget Entries",
    table: "budgetEntry",
    districtField: "districtId",
    editableFields: ["fiscalYear", "sector", "sectorLocal", "allocated", "released", "spent", "source"],
  },
  {
    module: "courts",
    label: "Court Stats",
    table: "courtStat",
    districtField: "districtId",
    editableFields: ["year", "courtName", "filed", "disposed", "pending", "avgDays", "source"],
  },
  {
    module: "industries",
    label: "Industries",
    table: "localIndustry",
    districtField: "districtId",
    editableFields: [
      "name",
      "nameLocal",
      "type",
      "category",
      "location",
      "taluk",
      "latitude",
      "longitude",
      "active",
      "source",
    ],
  },
  {
    module: "services",
    label: "Service Guides",
    table: "serviceGuide",
    districtField: "districtId",
    editableFields: [
      "serviceName",
      "serviceNameLocal",
      "category",
      "office",
      "officeLocal",
      "fees",
      "timeline",
      "onlinePortal",
      "onlineUrl",
      "tips",
      "active",
    ],
  },
  {
    module: "elections",
    label: "Election Results",
    table: "electionResult",
    districtField: "districtId",
    editableFields: [
      "year",
      "electionType",
      "constituency",
      "winnerName",
      "winnerParty",
      "winnerVotes",
      "runnerUpName",
      "runnerUpParty",
      "runnerUpVotes",
      "totalVoters",
      "votesPolled",
      "turnoutPct",
      "margin",
      "source",
    ],
  },
  {
    module: "transport",
    label: "Bus Routes",
    table: "busRoute",
    districtField: "districtId",
    editableFields: [
      "routeNumber",
      "origin",
      "destination",
      "via",
      "operator",
      "busType",
      "departureTime",
      "frequency",
      "fare",
      "duration",
      "active",
    ],
  },
];

export function getModuleConfig(module: string): ModuleConfig | null {
  return CONTENT_MODULES.find((m) => m.module === module) ?? null;
}

export async function GET(req: NextRequest) {
  const { ok } = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const districtSlug = sp.get("district");
  const moduleName = sp.get("module");

  if (moduleName === "list") {
    // Return the list of supported modules
    return NextResponse.json({ modules: CONTENT_MODULES });
  }

  if (!districtSlug || !moduleName) {
    return NextResponse.json({ error: "district and module required" }, { status: 400 });
  }

  const cfg = getModuleConfig(moduleName);
  if (!cfg) {
    return NextResponse.json({ error: "Module not editable" }, { status: 400 });
  }

  const district = await prisma.district.findFirst({
    where: { slug: districtSlug },
    select: { id: true, name: true, slug: true },
  });
  if (!district) {
    return NextResponse.json({ error: "District not found" }, { status: 404 });
  }

  // Access the Prisma delegate dynamically. TypeScript can't verify this across
  // all models so we cast once — the allowlist upstream guards correctness.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[cfg.table];
  if (!delegate) {
    return NextResponse.json(
      { error: `Model ${cfg.table} not available` },
      { status: 500 }
    );
  }

  const where = cfg.districtField ? { [cfg.districtField]: district.id } : {};
  const records = await delegate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    module: cfg,
    district,
    records,
  });
}
