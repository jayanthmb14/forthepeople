/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

async function isAuthed() {
  const { ok } = await requireAdmin();
  return ok;
}

export const ALL_MODULES = [
  // Quick Access
  { slug: "overview", name: "Overview", icon: "📊", category: "Quick Access" },
  { slug: "crop-prices", name: "Crop Prices", icon: "🌾", category: "Quick Access" },
  { slug: "weather", name: "Weather & Rainfall", icon: "🌦️", category: "Quick Access" },
  { slug: "water-dams", name: "Water & Dams", icon: "🚰", category: "Quick Access" },
  { slug: "finance-budget", name: "Finance & Budget", icon: "💰", category: "Quick Access" },
  // Live Data
  { slug: "interactive-map", name: "Interactive Map", icon: "🗺️", category: "Live Data" },
  { slug: "population", name: "Population", icon: "📈", category: "Live Data" },
  { slug: "police", name: "Police & Traffic", icon: "👮", category: "Live Data" },
  // Governance
  { slug: "leadership", name: "Leadership", icon: "👥", category: "Governance" },
  { slug: "local-industries", name: "Local Industries", icon: "🏭", category: "Governance" },
  { slug: "schemes", name: "Gov. Schemes", icon: "📋", category: "Governance" },
  { slug: "services", name: "Services Guide", icon: "📋", category: "Governance" },
  { slug: "elections", name: "Elections", icon: "🗳️", category: "Governance" },
  // Community
  { slug: "transport", name: "Transport", icon: "🚌", category: "Community" },
  { slug: "jjm-water", name: "Water Supply (JJM)", icon: "💧", category: "Community" },
  { slug: "housing", name: "Housing Schemes", icon: "🏠", category: "Community" },
  { slug: "power-outages", name: "Power & Outages", icon: "⚡", category: "Community" },
  { slug: "schools", name: "Schools", icon: "🎓", category: "Community" },
  // Transparency
  { slug: "farm-advisory", name: "Farm Advisory", icon: "🌾", category: "Transparency" },
  { slug: "rti-tracker", name: "RTI Tracker", icon: "🏛️", category: "Transparency" },
  { slug: "file-rti", name: "File RTI", icon: "📜", category: "Transparency" },
  { slug: "gram-panchayat", name: "Gram Panchayat", icon: "🏘️", category: "Transparency" },
  { slug: "courts", name: "Courts", icon: "⚖️", category: "Transparency" },
  { slug: "health", name: "Health", icon: "🏥", category: "Transparency" },
  // Local Info
  { slug: "famous-personalities", name: "Famous People", icon: "🌟", category: "Local Info" },
  { slug: "alerts", name: "Local Alerts", icon: "⚠️", category: "Local Info" },
  { slug: "offices", name: "Offices & Services", icon: "🏢", category: "Local Info" },
  { slug: "citizen-corner", name: "Citizen Corner", icon: "🤝", category: "Local Info" },
  { slug: "news", name: "News & Updates", icon: "📰", category: "Local Info" },
];

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const districtSlug = new URL(req.url).searchParams.get("district");
  if (!districtSlug) return NextResponse.json({ error: "district required" }, { status: 400 });

  const district = await prisma.district.findFirst({ where: { slug: districtSlug } });
  if (!district) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const statuses = await prisma.factCheckStatus.findMany({ where: { districtId: district.id } });
  const statusMap = Object.fromEntries(statuses.map((s) => [s.module, s]));

  const modules = ALL_MODULES.map((m) => ({
    ...m,
    lastChecked: statusMap[m.slug]?.lastChecked ?? null,
    status: statusMap[m.slug]?.status ?? "never",
    itemsChecked: statusMap[m.slug]?.itemsChecked ?? 0,
    issuesFound: statusMap[m.slug]?.issuesFound ?? 0,
    staleItems: statusMap[m.slug]?.staleItems ?? 0,
    checkedBy: statusMap[m.slug]?.checkedBy ?? null,
  }));

  return NextResponse.json({ district: districtSlug, modules });
}
