/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Job: Transport — KSRTC routes + train schedules
// Schedule: Monthly (1st of month, 5 AM)
// Source: data.gov.in KSRTC dataset / IRCTC station timetable
// ═══════════════════════════════════════════════════════════
import { prisma } from "@/lib/db";
import { JobContext, ScraperResult } from "../types";

const DATA_GOV_BASE = "https://api.data.gov.in/resource";
const TRAIN_RESOURCE = "a75c2e2b-3e8f-4f6b-8b30-c89e7a1d4b5c"; // Railway station timetable

// State-specific transport resource IDs from data.gov.in
const STATE_TRANSPORT: Record<string, { resourceId: string; operator: string }> = {
  karnataka: { resourceId: "b0fd3c66-9174-4d25-b47f-d5fc3c7d4e8e", operator: "KSRTC" },
  // TODO: Add resource IDs for other states when available on data.gov.in
  // telangana: { resourceId: "...", operator: "TSRTC" },
  // delhi: { resourceId: "...", operator: "DTC" },
};

export async function scrapeTransport(ctx: JobContext): Promise<ScraperResult> {
  const apiKey = process.env.DATA_GOV_API_KEY;
  if (!apiKey) {
    ctx.log("Transport: DATA_GOV_API_KEY not set — skipping");
    return { success: true, recordsNew: 0, recordsUpdated: 0 };
  }

  try {
    let newCount = 0;

    // ── State Bus Routes ─────────────────────────────────
    const stateSlug = ctx.stateSlug ?? "karnataka";
    const transportConfig = STATE_TRANSPORT[stateSlug];
    const busResourceId = transportConfig?.resourceId;
    const busOperator = transportConfig?.operator ?? "State Transport";
    const busUrl = busResourceId
      ? `${DATA_GOV_BASE}/${busResourceId}?api-key=${apiKey}&format=json&limit=100&filters[district]=${encodeURIComponent(ctx.districtSlug)}`
      : null;

    if (!busUrl) {
      ctx.log(`Transport: No bus route data source for state "${stateSlug}" — skipping bus routes`);
    }
    const busRes = busUrl ? await fetch(busUrl, { signal: AbortSignal.timeout(20_000) }) : null;

    if (busRes?.ok) {
      const json = await busRes.json();
      const records: Record<string, string>[] = json?.records ?? [];

      for (const rec of records) {
        const routeNumber = rec.route_no ?? rec.route_number ?? null;
        const origin = (rec.origin ?? rec.from ?? "").trim();
        const destination = (rec.destination ?? rec.to ?? "").trim();
        if (!origin || !destination) continue;

        const existing = await prisma.busRoute.findFirst({
          where: {
            districtId: ctx.districtId,
            origin,
            destination,
            ...(routeNumber ? { routeNumber } : {}),
          },
        });

        if (!existing) {
          await prisma.busRoute.create({
            data: {
              districtId: ctx.districtId,
              routeNumber,
              origin,
              destination,
              via: rec.via ?? null,
              operator: busOperator,
              busType: rec.bus_type ?? "Ordinary",
              departureTime: rec.departure_time ?? null,
              frequency: rec.frequency ?? "Daily",
              fare: parseFloat(rec.fare ?? "0") || null,
              active: true,
            },
          });
          newCount++;
        }
      }
    }

    // ── Train schedules for district stations ────────────
    const trainUrl = `${DATA_GOV_BASE}/${TRAIN_RESOURCE}?api-key=${apiKey}&format=json&limit=100&filters[district]=${encodeURIComponent(ctx.districtSlug)}`;
    const trainRes = await fetch(trainUrl, { signal: AbortSignal.timeout(20_000) });

    if (trainRes.ok) {
      const json = await trainRes.json();
      const records: Record<string, string>[] = json?.records ?? [];

      for (const rec of records) {
        const trainNumber = rec.train_no ?? rec.train_number ?? "";
        const trainName = rec.train_name ?? rec.name ?? trainNumber;
        const stationName = (rec.station_name ?? rec.station ?? "").trim();
        if (!trainNumber || !stationName) continue;

        const existing = await prisma.trainSchedule.findFirst({
          where: { districtId: ctx.districtId, trainNumber, stationName },
        });

        if (!existing) {
          const daysRaw = rec.days_of_week ?? rec.runs_on ?? "1234567";
          const daysOfWeek = daysRaw.split("").filter((d: string) => /[1-7]/.test(d));

          await prisma.trainSchedule.create({
            data: {
              districtId: ctx.districtId,
              trainNumber,
              trainName,
              origin: rec.origin ?? rec.from_station ?? "Unknown",
              destination: rec.destination ?? rec.to_station ?? "Unknown",
              stationName,
              arrivalTime: rec.arrival ?? null,
              departureTime: rec.departure ?? null,
              daysOfWeek,
              active: true,
            },
          });
          newCount++;
        }
      }
    }

    ctx.log(`Transport: ${newCount} new routes/schedules`);
    return { success: true, recordsNew: newCount, recordsUpdated: 0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    ctx.log(`Error: ${msg}`);
    return { success: false, recordsNew: 0, recordsUpdated: 0, error: msg };
  }
}
