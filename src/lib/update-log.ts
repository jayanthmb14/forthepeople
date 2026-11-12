/**
 * ForThePeople.in — Content update log
 * Writes UpdateLog entries for every content change (admin edits, scraper runs,
 * bot commands). Never throws — logging must not break the main operation.
 *
 * Distinct from src/lib/audit-log.ts which tracks admin *security* actions.
 * UpdateLog tracks *data* changes with old/new values so you can answer
 * "what did Admin change about the Mandya DC record last Tuesday?".
 */

import { prisma } from "@/lib/db";
import { Prisma } from "@ftp/prisma-client";

export type UpdateSource = "admin_edit" | "scraper" | "cron" | "api" | "ai_bot";
export type UpdateAction = "create" | "update" | "delete";

export interface UpdateLogInput {
  source: UpdateSource;
  actorLabel?: string;
  tableName: string;
  recordId: string;
  action: UpdateAction;
  fieldName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  districtId?: string;
  districtName?: string;
  moduleName?: string;
  description?: string;
  recordCount?: number;
  details?: unknown;
}

function stringify(v: unknown): string | undefined {
  if (v === undefined) return undefined;
  if (v === null) return "null";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export async function logUpdate(input: UpdateLogInput): Promise<void> {
  try {
    await prisma.updateLog.create({
      data: {
        source: input.source,
        actorLabel: input.actorLabel ?? null,
        tableName: input.tableName,
        recordId: input.recordId,
        action: input.action,
        fieldName: input.fieldName ?? null,
        oldValue: stringify(input.oldValue) ?? null,
        newValue: stringify(input.newValue) ?? null,
        districtId: input.districtId ?? null,
        districtName: input.districtName ?? null,
        moduleName: input.moduleName ?? null,
        description: input.description ?? null,
        recordCount: input.recordCount ?? null,
        details:
          input.details === undefined || input.details === null
            ? Prisma.JsonNull
            : (input.details as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.error("[update-log] write failed:", err instanceof Error ? err.message : err);
  }
}
