/**
 * Pune LocalIndustry — 8 verified industrial / IT clusters
 *
 * All public-record entities — MIDC notified industrial areas + major
 * private IT parks. Employment and company counts are approximate
 * ranges from MIDC / NASSCOM / state commerce-dept public briefs.
 *
 * IDEMPOTENT — findFirst by (districtId, name) + skip.
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const rows = [
  {
    name: "Hinjawadi Rajiv Gandhi Infotech Park",
    nameLocal: "हिंजवडी राजीव गांधी इंफोटेक पार्क",
    type: "IT Park", category: "IT Park",
    location: "Hinjawadi, Mulshi Taluka", taluk: "Mulshi",
    latitude: 18.5913, longitude: 73.7389,
    details: {
      employees_approx: 400000, companies: 300, area_acres: 2800,
      phases: 4, established: 2003,
      anchor_tenants: ["Infosys", "TCS", "Wipro", "Cognizant", "Persistent", "Accenture", "Capgemini", "Mphasis"],
      developer: "MIDC (Maharashtra Industrial Development Corporation)",
      notes: "India's 2nd largest IT hub by headcount after Bengaluru",
    },
    source: "MIDC / NASSCOM Pune Chapter",
  },
  {
    name: "Chakan MIDC Industrial Area",
    nameLocal: "चाकण एमआयडीसी औद्योगिक क्षेत्र",
    type: "Manufacturing", category: "Manufacturing",
    location: "Chakan, Khed Taluka", taluk: "Khed",
    latitude: 18.7606, longitude: 73.8636,
    details: {
      employees_approx: 150000, companies: 500, area_acres: 4500, phases: 4,
      established: 1970,
      anchor_tenants: ["Mahindra & Mahindra", "Mercedes-Benz India", "Volkswagen", "Bajaj Auto", "Tata Motors", "Bridgestone"],
      sectors: ["Automotive", "Auto Components", "Engineering"],
      notes: "Detroit of India — major automotive OEM cluster",
    },
    source: "MIDC",
  },
  {
    name: "Pimpri-Chinchwad Auto Manufacturing Belt",
    nameLocal: "पिंपरी-चिंचवड ऑटो उत्पादन पट्टा",
    type: "Manufacturing", category: "Manufacturing",
    location: "Pimpri, Chinchwad, Bhosari", taluk: "Haveli",
    latitude: 18.6298, longitude: 73.7997,
    details: {
      employees_approx: 200000, companies: 1200, established: 1961,
      anchor_tenants: ["Tata Motors", "Bajaj Auto", "Force Motors", "Kinetic", "Thermax", "Atlas Copco"],
      sectors: ["Automotive", "Engineering", "Heavy Machinery"],
    },
    source: "PCMC Industries Department",
  },
  {
    name: "Bhosari MIDC Industrial Area",
    nameLocal: "भोसरी एमआयडीसी",
    type: "Manufacturing", category: "Manufacturing",
    location: "Bhosari, Pimpri-Chinchwad", taluk: "Haveli",
    latitude: 18.6306, longitude: 73.8486,
    details: {
      employees_approx: 60000, companies: 850, area_acres: 1200, established: 1965,
      sectors: ["Auto Components", "Engineering", "Tooling", "Forgings"],
      notes: "SME-heavy ancillary cluster supplying Pimpri-Chinchwad OEMs",
    },
    source: "MIDC",
  },
  {
    name: "Ranjangaon MIDC Industrial Area",
    nameLocal: "रांजणगाव एमआयडीसी",
    type: "Manufacturing", category: "Manufacturing",
    location: "Ranjangaon, Shirur Taluka", taluk: "Shirur",
    latitude: 18.7736, longitude: 74.2592,
    details: {
      employees_approx: 40000, companies: 180, area_acres: 2370,
      anchor_tenants: ["LG Electronics", "Fiat India", "Whirlpool", "Jaya Hind Industries"],
      sectors: ["Consumer Electronics", "Automotive", "White Goods"],
    },
    source: "MIDC",
  },
  {
    name: "Talegaon MIDC Industrial Area",
    nameLocal: "तळेगाव एमआयडीसी",
    type: "Manufacturing", category: "Manufacturing",
    location: "Talegaon Dabhade, Maval Taluka", taluk: "Maval",
    latitude: 18.7355, longitude: 73.6756,
    details: {
      employees_approx: 35000, companies: 150, area_acres: 3200,
      anchor_tenants: ["General Motors (plant mothballed)", "John Deere", "Posco", "Tetra Pak", "Mercedes-Benz Truck"],
      sectors: ["Automotive", "Steel Processing", "Food Packaging"],
    },
    source: "MIDC",
  },
  {
    name: "Kharadi - Magarpatta IT Corridor",
    nameLocal: "खराडी - मगरपट्टा आयटी कॉरिडॉर",
    type: "IT Park", category: "IT Park",
    location: "Kharadi, Magarpatta, Hadapsar", taluk: "Haveli",
    latitude: 18.5515, longitude: 73.9407,
    details: {
      employees_approx: 250000, companies: 200,
      parks: ["EON IT Park", "World Trade Center Kharadi", "Magarpatta Cybercity", "Amanora Park Town"],
      anchor_tenants: ["Barclays", "Credit Suisse", "Honeywell", "KPIT", "Eaton", "Synechron"],
      sectors: ["IT/ITES", "BFSI-Captive", "R&D"],
    },
    source: "NASSCOM Pune / Magarpatta City",
  },
  {
    name: "Pune Defence & Aerospace Cluster",
    nameLocal: "पुणे संरक्षण आणि एरोस्पेस क्लस्टर",
    type: "Manufacturing", category: "Manufacturing",
    location: "Dighi, Khadki, Dehu Road", taluk: "Haveli",
    latitude: 18.6128, longitude: 73.8528,
    details: {
      employees_approx: 25000,
      entities: ["Ordnance Factory Dehu Road", "Ordnance Factory Khadki", "High Energy Materials Research Lab (DRDO)", "Vehicle Research & Development Establishment (DRDO)", "Ammunition Factory Khadki"],
      sectors: ["Defence Manufacturing", "DRDO Labs", "Aerospace Components"],
      notes: "One of India's largest defence R&D concentrations",
    },
    source: "Defence Ministry / DRDO public records",
  },
];

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const pune = await p.district.findFirstOrThrow({ where: { slug: "pune" } });

  let added = 0, skipped = 0;
  for (const r of rows) {
    const existing = await p.localIndustry.findFirst({
      where: { districtId: pune.id, name: r.name },
    });
    if (existing) { skipped++; continue; }
    await p.localIndustry.create({ data: { districtId: pune.id, active: true, ...r } });
    console.log(`  ✅ ${r.name} (${r.category})`);
    added++;
  }

  console.log(`\nLocalIndustry: ${added} added, ${skipped} skipped`);
  await p.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
