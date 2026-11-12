/**
 * Pune FamousPersonality — 6 verified historical figures connected to Pune.
 *
 * Categories used (Title Case, matching Mumbai convention):
 *   - "Freedom Fighter" (existing): Tilak, Gokhale, Savarkar
 *   - "Social Reformer" (new): Jyotirao Phule (only personality bornInDistrict=true)
 *   - "Educator" (new): Savitribai Phule, Karve
 *
 * Both new categories scalable + accurate — Mumbai's nearest existing label
 * ("Freedom Fighter" for Ambedkar) doesn't fit these figures' primary historical
 * contributions. Title Case matches Mumbai pattern.
 *
 * IDEMPOTENT. Uses findFirst({districtId, name}).
 *
 * Refs: Forthepeople/27-Pune-Module-Population-2026-04-24.md
 */

import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

type DBClient = ReturnType<typeof makeClient>;

const RECORDS = [
  {
    name: "Bal Gangadhar Tilak",
    nameLocal: null,
    category: "Freedom Fighter",
    bio: "Freedom fighter and social reformer. Founded Kesari newspaper in Pune. Originator of the public Ganesh festival tradition.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1856,
    deathYear: 1920,
    birthPlace: "Ratnagiri, Maharashtra",
    bornInDistrict: false,
    notable: null,
    source: "wikipedia",
    active: true,
  },
  {
    name: "Gopal Krishna Gokhale",
    nameLocal: null,
    category: "Freedom Fighter",
    bio: "Congress moderate leader and Gandhi's political mentor. Taught mathematics at Fergusson College Pune. Founded Servants of India Society.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1866,
    deathYear: 1915,
    birthPlace: "Kotluk, Kolhapur district",
    bornInDistrict: false,
    notable: null,
    source: "wikipedia",
    active: true,
  },
  {
    name: "Jyotirao Phule",
    nameLocal: null,
    category: "Social Reformer",
    bio: "Social reformer and anti-caste activist. Founded Satyashodhak Samaj in 1873 in Pune. Pioneered women's and lower-caste education.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1827,
    deathYear: 1890,
    birthPlace: "Pune",
    bornInDistrict: true,
    notable: null,
    source: "wikipedia",
    active: true,
  },
  {
    name: "Savitribai Phule",
    nameLocal: null,
    category: "Educator",
    bio: "India's first female teacher. With Jyotirao Phule, opened 18 schools across Pune for girls, Dalits, and widows.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1831,
    deathYear: 1897,
    birthPlace: "Naigaon, Satara district",
    bornInDistrict: false,
    notable: null,
    source: "wikipedia",
    active: true,
  },
  {
    name: "Dhondo Keshav Karve",
    nameLocal: null,
    category: "Educator",
    bio: "Bharat Ratna (1958). Founded India's first women's university in 1916 (later SNDT). Pioneer of widow remarriage and women's higher education.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1858,
    deathYear: 1962,
    birthPlace: "Sheravali, Ratnagiri district",
    bornInDistrict: false,
    notable: null,
    source: "wikipedia",
    active: true,
  },
  {
    name: "Vinayak Damodar Savarkar",
    nameLocal: null,
    category: "Freedom Fighter",
    bio: "Revolutionary freedom fighter, writer, and Hindutva ideologue. Studied at Fergusson College Pune before travelling to London.",
    photoUrl: null,
    photoCredit: null,
    wikiUrl: null,
    birthYear: 1883,
    deathYear: 1966,
    birthPlace: "Bhagur, Nashik district",
    bornInDistrict: false,
    notable: null,
    source: "wikipedia",
    active: true,
  },
];

export async function seedPuneFamousPersonalities(prisma?: DBClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;
  try {
    const pune = await client.district.findFirstOrThrow({ where: { slug: "pune" } });
    let created = 0;
    let skipped = 0;
    for (const r of RECORDS) {
      const exists = await client.famousPersonality.findFirst({
        where: { districtId: pune.id, name: r.name },
      });
      if (exists) {
        skipped++;
        continue;
      }
      await client.famousPersonality.create({ data: { districtId: pune.id, ...r } });
      console.log(`  ✅ [${r.category}] ${r.name}`);
      created++;
    }
    console.log(`FamousPersonality: created=${created} skipped=${skipped}`);
  } finally {
    if (standalone) await client.$disconnect();
  }
}

if (require.main === module) {
  seedPuneFamousPersonalities().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
