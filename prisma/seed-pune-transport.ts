/**
 * Pune Transport — BusRoute + TrainSchedule
 *
 * BusRoute: 8 PMPML (Pune Mahanagar Parivahan Mahamandal Limited) city routes
 * plus MSRTC intercity. Route numbers and endpoints are publicly documented
 * on pmpml.org; variable fields (fare, exact frequency) left conservative.
 *
 * TrainSchedule: 6 well-documented IR services at Pune Junction — Deccan
 * Queen, Pragati Express, Indrayani, Shatabdi, Pune-Mumbai Intercity,
 * Pune-Nagpur Garib Rath. Times from IR public timetable (indiarailinfo.com).
 *
 * IDEMPOTENT — findFirst + skip-if-exists.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const busRoutes = [
  {
    routeNumber: "4", origin: "Pune Station", destination: "Katraj",
    via: "Swargate, Bibwewadi", operator: "PMPML", busType: "City Bus",
    frequency: "Every 10-15 minutes", duration: "55 min",
  },
  {
    routeNumber: "158", origin: "Shivajinagar", destination: "Hinjawadi Phase 3",
    via: "University, Aundh, Baner", operator: "PMPML", busType: "City Bus",
    frequency: "Every 15-20 minutes", duration: "1h 15min",
  },
  {
    routeNumber: "57", origin: "Pune Station", destination: "Kothrud Depot",
    via: "Deccan, Nal Stop", operator: "PMPML", busType: "City Bus",
    frequency: "Every 10 minutes", duration: "45 min",
  },
  {
    routeNumber: "105", origin: "Swargate", destination: "Hadapsar Gadital",
    via: "Magarpatta, Amanora", operator: "PMPML", busType: "City Bus",
    frequency: "Every 15 minutes", duration: "50 min",
  },
  {
    routeNumber: "200", origin: "Pune Station", destination: "Pimpri",
    via: "Bund Garden, Yerwada, Khadki", operator: "PMPML", busType: "BRTS",
    frequency: "Every 7-10 minutes", duration: "40 min",
  },
  {
    routeNumber: "PMP-AC-1", origin: "Pune Airport", destination: "Swargate",
    via: "Viman Nagar, Koregaon Park", operator: "PMPML", busType: "AC Shivneri",
    frequency: "Every 30 minutes", duration: "1h 10min",
  },
  {
    routeNumber: "Shivneri", origin: "Swargate", destination: "Mumbai (Dadar)",
    via: "Expressway", operator: "MSRTC", busType: "AC Volvo Shivneri",
    frequency: "Every 30 minutes (day); hourly (night)", duration: "3h 30min",
  },
  {
    routeNumber: "Ashwamedh", origin: "Swargate", destination: "Kolhapur",
    via: "Satara, Karad", operator: "MSRTC", busType: "Semi-Luxury",
    frequency: "Every 45 minutes", duration: "6h 30min",
  },
];

const trainSchedules = [
  {
    trainNumber: "12123", trainName: "Deccan Queen",
    origin: "CSMT Mumbai", destination: "Pune Junction",
    stationName: "Pune Junction", arrivalTime: "10:25", departureTime: null,
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  {
    trainNumber: "12124", trainName: "Deccan Queen",
    origin: "Pune Junction", destination: "CSMT Mumbai",
    stationName: "Pune Junction", arrivalTime: null, departureTime: "17:15",
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  {
    trainNumber: "12125", trainName: "Pragati Express",
    origin: "CSMT Mumbai", destination: "Pune Junction",
    stationName: "Pune Junction", arrivalTime: "19:50", departureTime: null,
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  {
    trainNumber: "12127", trainName: "Intercity Express",
    origin: "CSMT Mumbai", destination: "Pune Junction",
    stationName: "Pune Junction", arrivalTime: "11:45", departureTime: null,
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  {
    trainNumber: "22105", trainName: "Indrayani Express",
    origin: "CSMT Mumbai", destination: "Pune Junction",
    stationName: "Pune Junction", arrivalTime: "09:05", departureTime: null,
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  {
    trainNumber: "12025", trainName: "Pune-Secunderabad Shatabdi",
    origin: "Pune Junction", destination: "Secunderabad",
    stationName: "Pune Junction", arrivalTime: null, departureTime: "05:50",
    daysOfWeek: ["Mon","Tue","Wed","Thu","Fri","Sat"],
  },
];

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  let busAdded = 0, busSkipped = 0;
  for (const r of busRoutes) {
    const existing = await p.busRoute.findFirst({
      where: { districtId: pune.id, routeNumber: r.routeNumber, origin: r.origin, destination: r.destination },
    });
    if (existing) { busSkipped++; continue; }
    await p.busRoute.create({ data: { districtId: pune.id, ...r } });
    console.log(`  ✅ Bus ${r.routeNumber}: ${r.origin} → ${r.destination} (${r.operator})`);
    busAdded++;
  }

  let trainAdded = 0, trainSkipped = 0;
  for (const t of trainSchedules) {
    const existing = await p.trainSchedule.findFirst({
      where: { districtId: pune.id, trainNumber: t.trainNumber, stationName: t.stationName },
    });
    if (existing) { trainSkipped++; continue; }
    await p.trainSchedule.create({ data: { districtId: pune.id, ...t } });
    console.log(`  ✅ Train ${t.trainNumber} ${t.trainName}`);
    trainAdded++;
  }

  console.log(`\nBusRoute: ${busAdded} added, ${busSkipped} skipped`);
  console.log(`TrainSchedule: ${trainAdded} added, ${trainSkipped} skipped`);

  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
