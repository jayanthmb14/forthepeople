/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════════════
// Script: generate-india-seeds.ts
// Generates prisma/seed-hierarchy-allIndia.ts for all 766 districts
//
// Data sources (both free, no auth needed for LGD):
//   1. LGD (Local Government Directory) — official GoI district list
//      https://lgdirectory.gov.in — authoritative, updated monthly
//   2. Census 2011 Primary Census Abstract — district demographics
//      https://data.gov.in (uses DATA_GOV_API_KEY from .env)
//
// Usage:
//   npx tsx scripts/generate-india-seeds.ts
//
// Output:
//   prisma/seed-hierarchy-allIndia.ts  ← commit this generated file
//
// After generating:
//   npx tsx prisma/seed-hierarchy-allIndia.ts
//   (loads all states + districts into DB with active: false)
// ═══════════════════════════════════════════════════════════════════

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ── Types ────────────────────────────────────────────────────────────

interface LGDDistrict {
  lgdCode: string;
  districtName: string;
  stateName: string;
}

interface CensusDistrict {
  districtName: string;
  stateName: string;
  population: number | null;
  area: number | null;
  density: number | null;
  literacy: number | null;
  sexRatio: number | null;
}

interface MergedDistrict {
  lgdCode: string;
  name: string;
  slug: string;
  stateName: string;
  stateSlug: string;
  population: number | null;
  area: number | null;
  density: number | null;
  literacy: number | null;
  sexRatio: number | null;
}

// ── State metadata ──────────────────────────────────────────────────
const STATE_META: Record<string, { nameLocal: string; capital: string }> = {
  "andhra-pradesh":       { nameLocal: "ఆంధ్రప్రదేశ్",        capital: "Amaravati" },
  "arunachal-pradesh":    { nameLocal: "অৰুণাচল প্ৰদেশ",       capital: "Itanagar" },
  "assam":                { nameLocal: "অসম",                   capital: "Dispur" },
  "bihar":                { nameLocal: "बिहार",                 capital: "Patna" },
  "chhattisgarh":         { nameLocal: "छत्तीसगढ़",             capital: "Raipur" },
  "goa":                  { nameLocal: "गोंय",                  capital: "Panaji" },
  "gujarat":              { nameLocal: "ગુજરાત",               capital: "Gandhinagar" },
  "haryana":              { nameLocal: "हरियाणा",               capital: "Chandigarh" },
  "himachal-pradesh":     { nameLocal: "हिमाचल प्रदेश",         capital: "Shimla" },
  "jharkhand":            { nameLocal: "झारखंड",               capital: "Ranchi" },
  "karnataka":            { nameLocal: "ಕರ್ನಾಟಕ",             capital: "Bengaluru" },
  "kerala":               { nameLocal: "കേരളം",                capital: "Thiruvananthapuram" },
  "madhya-pradesh":       { nameLocal: "मध्य प्रदेश",           capital: "Bhopal" },
  "maharashtra":          { nameLocal: "महाराष्ट्र",            capital: "Mumbai" },
  "manipur":              { nameLocal: "মণিপুর",               capital: "Imphal" },
  "meghalaya":            { nameLocal: "মেঘালয়",              capital: "Shillong" },
  "mizoram":              { nameLocal: "Mizoram",               capital: "Aizawl" },
  "nagaland":             { nameLocal: "Nagaland",              capital: "Kohima" },
  "odisha":               { nameLocal: "ଓଡ଼ିଶା",              capital: "Bhubaneswar" },
  "punjab":               { nameLocal: "ਪੰਜਾਬ",               capital: "Chandigarh" },
  "rajasthan":            { nameLocal: "राजस्थान",              capital: "Jaipur" },
  "sikkim":               { nameLocal: "སིཀྐིམ",               capital: "Gangtok" },
  "tamil-nadu":           { nameLocal: "தமிழ் நாடு",           capital: "Chennai" },
  "telangana":            { nameLocal: "తెలంగాణ",              capital: "Hyderabad" },
  "tripura":              { nameLocal: "ত্রিপুরা",             capital: "Agartala" },
  "uttar-pradesh":        { nameLocal: "उत्तर प्रदेश",          capital: "Lucknow" },
  "uttarakhand":          { nameLocal: "उत्तराखंड",            capital: "Dehradun" },
  "west-bengal":          { nameLocal: "পশ্চিমবঙ্গ",           capital: "Kolkata" },
  "andaman-and-nicobar-islands": { nameLocal: "अंडमान और निकोबार", capital: "Port Blair" },
  "chandigarh":           { nameLocal: "ਚੰਡੀਗੜ੍ਹ",             capital: "Chandigarh" },
  "dadra-and-nagar-haveli-and-daman-and-diu": { nameLocal: "दादरा और नगर हवेली और दमन और दीव", capital: "Daman" },
  "delhi":                { nameLocal: "दिल्ली",               capital: "New Delhi" },
  "jammu-and-kashmir":    { nameLocal: "جموں و کشمیر",         capital: "Srinagar" },
  "ladakh":               { nameLocal: "ལ་དྭགས་",              capital: "Leh" },
  "lakshadweep":          { nameLocal: "ലക്ഷദ്വീപ്",           capital: "Kavaratti" },
  "puducherry":           { nameLocal: "புதுச்சேரி",           capital: "Puducherry" },
};

// ── Slug generator ───────────────────────────────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[().,'"&]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── HTTP fetch (no external deps) ────────────────────────────────────
function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (c) => chunks.push(Buffer.from(c)));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── CSV parser ───────────────────────────────────────────────────────
function parseCSV(raw: string): Record<string, string>[] {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    if (values.length < 2) continue;
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => { record[h] = values[idx] ?? ""; });
    records.push(record);
  }
  return records;
}

// ── Fetch LGD district list ──────────────────────────────────────────
async function fetchLGDDistricts(): Promise<LGDDistrict[]> {
  console.log("  Fetching district list...");

  const url = "https://raw.githubusercontent.com/iaseth/data-for-india/master/data/readable/districts.json";
  let raw = "";

  try {
    raw = await fetchUrl(url);
    console.log("  ✓ District data fetched");
  } catch (e) {
    throw new Error(
      `Could not fetch district data: ${e instanceof Error ? e.message : e}\n` +
      "Check your internet connection and try again."
    );
  }

  const json = JSON.parse(raw);

  // Format: [{ "state": "Andhra Pradesh", "stateCode": "AP", "district": "Visakhapatnam", "districtCode": "VS" }, ...]
  const districts: LGDDistrict[] = json
    .filter((r: Record<string, string>) => r.state && r.district)
    .map((r: Record<string, string>) => ({
      lgdCode:      r.districtCode || r.code || "",
      districtName: r.district,
      stateName:    r.state,
    }));

  console.log(`  ✓ ${districts.length} districts parsed`);
  return districts;
}
  // Fall back to local file if fetch succeeded but is empty
  const records = parseCSV(raw);
  console.log(`  ✓ ${records.length} records parsed`);

  // Handle different column naming conventions across LGD CSV versions
  return records
    .map((r) => ({
      lgdCode:      r["district code"] || r["districtcode"] || r["district_code"] || r["lgd code"] || r["lgdcode"] || "",
      districtName: r["district name"] || r["districtname"] || r["district_name"] || r["name"] || "",
      stateName:    r["state name"] || r["statename"] || r["state_name"] || r["state"] || "",
    }))
    .filter((r) => r.districtName.length > 1 && r.stateName.length > 1);
}

// ── Fetch Census 2011 demographics ───────────────────────────────────
async function fetchCensusData(apiKey: string): Promise<CensusDistrict[]> {
  if (!apiKey) {
    console.warn("  DATA_GOV_API_KEY not set — Census demographics will be null.");
    console.warn("  Set it in .env to include population/literacy/sex ratio data.\n");
    return [];
  }

  console.log("  Fetching Census 2011 data from data.gov.in...");

  // Known resource IDs for Census 2011 district-level data on data.gov.in
  const resourceIds = [
    "b7e9f3ec-ec99-4a01-a14e-169df6f3a84a",
    "64c5fd04-b4f5-4a24-ae96-18fc7b3c9e9a",
  ];

  for (const id of resourceIds) {
    try {
      const url = `https://api.data.gov.in/resource/${id}?api-key=${apiKey}&format=json&limit=800`;
      const raw = await fetchUrl(url);
      const json = JSON.parse(raw);
      const records: Record<string, string>[] = json.records ?? json.data ?? [];
      if (records.length === 0) continue;

      console.log(`  ✓ Census: ${records.length} records`);
      return records.map((r) => ({
        districtName: r["district"] || r["district_name"] || "",
        stateName:    r["state"] || r["state_name"] || "",
        population:   r["total_population"] ? Number(r["total_population"]) || null : null,
        area:         r["area_sq_km"] || r["area"] ? Number(r["area_sq_km"] || r["area"]) || null : null,
        density:      r["population_density"] || r["density"] ? Number(r["population_density"] || r["density"]) || null : null,
        literacy:     r["literacy_rate"] || r["literacy"] ? Number(r["literacy_rate"] || r["literacy"]) || null : null,
        sexRatio:     r["sex_ratio"] ? Number(r["sex_ratio"]) || null : null,
      })).filter((d) => d.districtName);
    } catch (e) {
      console.warn(`  ✗ Census resource ${id}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.warn("  Census data unavailable — demographics will be null.");
  return [];
}

// ── Merge LGD + Census ───────────────────────────────────────────────
function mergeData(lgd: LGDDistrict[], census: CensusDistrict[]): MergedDistrict[] {
  const censusMap = new Map<string, CensusDistrict>();
  for (const c of census) {
    censusMap.set(`${toSlug(c.stateName)}_${toSlug(c.districtName)}`, c);
  }

  return lgd.map((d) => {
    const stateSlug = toSlug(d.stateName);
    const slug = toSlug(d.districtName);
    const c = censusMap.get(`${stateSlug}_${slug}`);
    return {
      lgdCode: d.lgdCode,
      name: d.districtName,
      slug,
      stateName: d.stateName,
      stateSlug,
      population: c?.population ?? null,
      area:       c?.area ?? null,
      density:    c?.density ?? null,
      literacy:   c?.literacy ?? null,
      sexRatio:   c?.sexRatio ?? null,
    };
  });
}

// ── Generate seed TypeScript file ────────────────────────────────────
function generateSeedFile(grouped: Map<string, MergedDistrict[]>): string {
  const totalStates = grouped.size;
  const totalDistricts = [...grouped.values()].reduce((s, d) => s + d.length, 0);
  const now = new Date().toISOString().split("T")[0];

  let out = `/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 */

// AUTO-GENERATED by scripts/generate-india-seeds.ts on ${now}
// Source: Local Government Directory (LGD) + Census 2011
// ${totalDistricts} districts across ${totalStates} states/UTs
// DO NOT EDIT MANUALLY — re-run the generator to update.
//
// Usage: npx tsx prisma/seed-hierarchy-allIndia.ts

import "dotenv/config";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("[seed-hierarchy-allIndia] Seeding ${totalDistricts} districts across ${totalStates} states/UTs...");
  let states = 0;
  let districts = 0;

`;

  for (const [stateSlug, dists] of [...grouped.entries()].sort()) {
    const meta = STATE_META[stateSlug];
    const stateName = dists[0].stateName;
    const nameLocal = meta?.nameLocal ?? stateName;
    const capital = meta?.capital ?? "";
    const varName = `s_${stateSlug.replace(/-/g, "_")}`;

    out += `  // ${stateName} — ${dists.length} districts\n`;
    out += `  const ${varName} = await prisma.state.upsert({\n`;
    out += `    where: { slug: "${stateSlug}" },\n`;
    out += `    update: {},\n`;
    out += `    create: { name: "${stateName}", nameLocal: "${nameLocal}", slug: "${stateSlug}", active: true, capital: "${capital}" },\n`;
    out += `  });\n`;
    out += `  states++;\n\n`;

    for (const d of dists.sort((a, b) => a.name.localeCompare(b.name))) {
      out += `  await prisma.district.upsert({\n`;
      out += `    where: { stateId_slug: { stateId: ${varName}.id, slug: "${d.slug}" } },\n`;
      out += `    update: { name: "${d.name}", nameLocal: "${d.name}", population: ${d.population ?? "null"}, area: ${d.area ?? "null"} },\n`;
      out += `    create: {\n`;
      out += `      stateId: ${varName}.id,\n`;
      out += `      name: "${d.name}",\n`;
      out += `      nameLocal: "${d.name}",\n`;
      out += `      slug: "${d.slug}",\n`;
      out += `      active: false,\n`;
      out += `      population: ${d.population ?? "null"},\n`;
      out += `      area: ${d.area ?? "null"},\n`;
      out += `      density: ${d.density ?? "null"},\n`;
      out += `      literacy: ${d.literacy ?? "null"},\n`;
      out += `      sexRatio: ${d.sexRatio ?? "null"},\n`;
      out += `    },\n`;
      out += `  });\n`;
      out += `  districts++;\n`;
    }
    out += `\n`;
  }

  out += `  console.log(\`[seed-hierarchy-allIndia] Done — \${states} states, \${districts} districts seeded.\`);
  console.log("[seed-hierarchy-allIndia] All districts are active: false.");
  console.log("[seed-hierarchy-allIndia] See SCALING-CHECKLIST.md to activate districts.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
`;

  return out;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n  ForThePeople.in — Pan-India Seed Generator\n");

  const apiKey = process.env.DATA_GOV_API_KEY ?? "";

  console.log("1/4  Fetching LGD district list...");
  const lgd = await fetchLGDDistricts();
  console.log(`     ${lgd.length} districts fetched\n`);

  console.log("2/4  Fetching Census 2011 demographics...");
  const census = await fetchCensusData(apiKey);
  console.log(`     ${census.length} census records\n`);

  console.log("3/4  Merging data...");
  const merged = mergeData(lgd, census);
  const grouped = new Map<string, MergedDistrict[]>();
  for (const d of merged) {
    const arr = grouped.get(d.stateSlug) ?? [];
    arr.push(d);
    grouped.set(d.stateSlug, arr);
  }
  console.log(`     ${grouped.size} states, ${merged.length} districts\n`);

  console.log("4/4  Generating seed file...");
  const content = generateSeedFile(grouped);
  const outPath = path.join(process.cwd(), "prisma", "seed-hierarchy-allIndia.ts");
  fs.writeFileSync(outPath, content, "utf8");
  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`     Written to prisma/seed-hierarchy-allIndia.ts (${kb} KB)\n`);

  console.log("  Done. Next steps:");
  console.log("  1. Review prisma/seed-hierarchy-allIndia.ts");
  console.log("  2. Run: npx tsx prisma/seed-hierarchy-allIndia.ts");
  console.log("  3. Commit both files\n");
}

main().catch((err) => {
  console.error("Generator failed:", err.message);
  process.exit(1);
});