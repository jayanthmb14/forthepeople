// ═══════════════════════════════════════════════════════════
// FILE 5 of 6: Mysuru — Leadership Hierarchy + Famous Personalities
// Run standalone: npx tsx prisma/seed-mysuru-leaders.ts
// Or imported by seed-expansion.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedMysuruLeaders(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n👥 [5/6] Seeding Mysuru leaders & personalities...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const mysuru = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "mysuru" } },
    });
    const did = mysuru.id;

    // Clear existing leaders/personalities for idempotency
    await client.leader.deleteMany({ where: { districtId: did } });
    await client.famousPersonality.deleteMany({ where: { districtId: did } });
    console.log("  ✓ Cleared existing Mysuru leaders/personalities");

    // ── Leaders ──────────────────────────────────────────────
    await client.leader.createMany({
      data: [
        // ── Tier 1: Lok Sabha MP ────────────────────────────
        {
          districtId: did, tier: 1,
          name: "Yaduveer Krishnadatta Chamaraja Wadiyar",
          nameLocal: "ಯದುವೀರ್ ಕೃಷ್ಣದತ್ತ ಚಾಮರಾಜ ವಡಿಯರ್",
          role: "Member of Parliament, Mysuru-Kodagu",
          roleLocal: "ಸಂಸದ, ಮೈಸೂರು-ಕೊಡಗು",
          party: "BJP", constituency: "Mysuru-Kodagu", since: "2019",
          source: "ECI 2024",
        },

        // ── Tier 2: State Assembly MLAs (11) ────────────────
        {
          districtId: did, tier: 2,
          name: "Siddaramaiah",
          nameLocal: "ಸಿದ್ದರಾಮಯ್ಯ",
          // Chief Minister until 28 May 2026 (D. K. Shivakumar since 3 June 2026).
          role: "MLA, Varuna",
          roleLocal: "ಶಾಸಕ, ವರುಣಾ",
          party: "INC", constituency: "Varuna", since: "2023",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "Tanveer Sait",
          nameLocal: "ತನ್ವೀರ್ ಸೇಠ್",
          role: "MLA, Narasimharaja",
          roleLocal: "ಶಾಸಕ, ನರಸಿಂಹರಾಜ",
          party: "INC", constituency: "Narasimharaja", since: "2018",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "S.A. Ramdas",
          nameLocal: "ಎಸ್.ಎ. ರಾಮದಾಸ್",
          role: "MLA, Krishnaraja",
          roleLocal: "ಶಾಸಕ, ಕೃಷ್ಣರಾಜ",
          party: "BJP", constituency: "Krishnaraja", since: "2013",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "V. Somashekhar",
          nameLocal: "ವಿ. ಸೋಮಶೇಖರ್",
          role: "MLA, Chamaraja",
          roleLocal: "ಶಾಸಕ, ಚಾಮರಾಜ",
          party: "INC", constituency: "Chamaraja", since: "2023",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "G.T. Devegowda",
          nameLocal: "ಜಿ.ಟಿ. ದೇವೇಗೌಡ",
          role: "MLA, Chamundeshwari",
          roleLocal: "ಶಾಸಕ, ಚಾಮುಂಡೇಶ್ವರಿ",
          party: "JD(S)", constituency: "Chamundeshwari", since: "2018",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "H.C. Mahadevappa",
          nameLocal: "ಎಚ್.ಸಿ. ಮಹಾದೇವಪ್ಪ",
          role: "MLA, T. Narasipur",
          roleLocal: "ಶಾಸಕ, ತಿ. ನರಸೀಪುರ",
          party: "INC", constituency: "T. Narasipur", since: "2018",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "A.H. Vishwanath",
          nameLocal: "ಎ.ಎಚ್. ವಿಶ್ವನಾಥ್",
          role: "MLA, Hunsur",
          roleLocal: "ಶಾಸಕ, ಹನ್ಸೂರು",
          party: "INC", constituency: "Hunsur", since: "2023",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "Kalale Keerthi",
          nameLocal: "ಕಲಾಲೆ ಕೀರ್ತಿ",
          role: "MLA, Nanjangud",
          roleLocal: "ಶಾಸಕ, ನಂಜನಗೂಡು",
          party: "BJP", constituency: "Nanjangud", since: "2023",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "K. Venkatesh",
          nameLocal: "ಕೆ. ವೆಂಕಟೇಶ್",
          role: "MLA, Periyapatna",
          roleLocal: "ಶಾಸಕ, ಪಿರಿಯಾಪಟ್ಟಣ",
          party: "INC", constituency: "Periyapatna", since: "2023",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "Sa. Ra. Mahesh",
          nameLocal: "ಸ. ರಾ. ಮಹೇಶ್",
          role: "MLA, K.R. Nagar",
          roleLocal: "ಶಾಸಕ, ಕೃಷ್ಣರಾಜನಗರ",
          party: "INC", constituency: "K.R. Nagar", since: "2018",
          source: "KLA 2023",
        },
        {
          districtId: did, tier: 2,
          name: "Sunil Bose",
          nameLocal: "ಸುನಿಲ್ ಬೋಸ್",
          role: "MLA, H.D. Kote",
          roleLocal: "ಶಾಸಕ, ಎಚ್.ಡಿ. ಕೋಟೆ",
          party: "INC", constituency: "H.D. Kote", since: "2023",
          source: "KLA 2023",
        },

        // ── Tier 3: Local Body ───────────────────────────────
        {
          districtId: did, tier: 3,
          name: "Shivakumar (MCC Mayor)",
          nameLocal: "ಶಿವಕುಮಾರ್",
          role: "Mayor, Mysuru City Corporation",
          roleLocal: "ಮೇಯರ್, ಮೈಸೂರು ನಗರ ನಿಗಮ",
          party: "INC", since: "2023",
          source: "MCC 2023",
        },
        {
          districtId: did, tier: 3,
          name: "Mysuru Zilla Panchayat President",
          nameLocal: "ಮೈಸೂರು ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಅಧ್ಯಕ್ಷ",
          role: "President, Mysuru Zilla Panchayat",
          roleLocal: "ಅಧ್ಯಕ್ಷ, ಮೈಸೂರು ಜಿಲ್ಲಾ ಪಂಚಾಯತ್",
          party: "INC", since: "2021",
          source: "ZP Elections 2021",
        },
        {
          districtId: did, tier: 3,
          name: "MCC Commissioner",
          nameLocal: "ಎಂಸಿಸಿ ಆಯುಕ್ತ",
          role: "Commissioner, Mysuru City Corporation",
          roleLocal: "ಆಯುಕ್ತ, ಮೈಸೂರು ನಗರ ನಿಗಮ",
          since: "2024",
          source: "MCC",
        },

        // ── Tier 4: District Administration ─────────────────
        {
          districtId: did, tier: 4,
          name: "Deputy Commissioner, Mysuru",
          nameLocal: "ಜಿಲ್ಲಾಧಿಕಾರಿ, ಮೈಸೂರು",
          role: "Deputy Commissioner & District Magistrate",
          roleLocal: "ಜಿಲ್ಲಾಧಿಕಾರಿ ಮತ್ತು ಜಿಲ್ಲಾ ದಂಡಾಧಿಕಾರಿ",
          phone: "0821-2419600",
          source: "DC Office Mysuru",
        },
        {
          districtId: did, tier: 4,
          name: "Chief Executive Officer, ZP Mysuru",
          nameLocal: "ಮುಖ್ಯ ಕಾರ್ಯನಿರ್ವಾಹಕ ಅಧಿಕಾರಿ",
          role: "CEO, Zilla Panchayat Mysuru",
          roleLocal: "ಸಿಇಒ, ಜಿಲ್ಲಾ ಪಂಚಾಯತ್ ಮೈಸೂರು",
          phone: "0821-2418450",
          source: "ZP Mysuru",
        },
        {
          districtId: did, tier: 4,
          name: "MCC Commissioner (IAS)",
          nameLocal: "ಎಂಸಿಸಿ ಆಯುಕ್ತ (ಐಎಎಸ್)",
          role: "Commissioner, Mysuru City Corporation",
          roleLocal: "ಆಯುಕ್ತ, ಮೈಸೂರು ನಗರ ನಿಗಮ",
          phone: "0821-2443020",
          source: "MCC Mysuru",
        },
        {
          districtId: did, tier: 4,
          name: "District Health Officer, Mysuru",
          nameLocal: "ಜಿಲ್ಲಾ ಆರೋಗ್ಯ ಅಧಿಕಾರಿ",
          role: "District Health & Family Welfare Officer",
          roleLocal: "ಜಿಲ್ಲಾ ಆರೋಗ್ಯ ಮತ್ತು ಕುಟುಂಬ ಕಲ್ಯಾಣ ಅಧಿಕಾರಿ",
          phone: "0821-2419500",
          source: "DHO Mysuru",
        },

        // ── Tier 5: Police ───────────────────────────────────
        {
          districtId: did, tier: 5,
          name: "Commissioner of Police, Mysuru",
          nameLocal: "ಪೊಲೀಸ್ ಆಯುಕ್ತ, ಮೈಸೂರು",
          role: "Commissioner of Police, Mysuru City",
          roleLocal: "ಪೊಲೀಸ್ ಆಯುಕ್ತ, ಮೈಸೂರು ನಗರ",
          phone: "0821-2443566",
          source: "Mysuru City Police",
        },
        {
          districtId: did, tier: 5,
          name: "Superintendent of Police, Mysuru (Rural)",
          nameLocal: "ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕ, ಮೈಸೂರು (ಗ್ರಾಮೀಣ)",
          role: "Superintendent of Police, Mysuru District (Rural)",
          roleLocal: "ಜಿಲ್ಲಾ ಪೊಲೀಸ್ ಅಧೀಕ್ಷಕ (ಗ್ರಾಮೀಣ)",
          phone: "0821-2443700",
          source: "SP Office Mysuru",
        },
        {
          districtId: did, tier: 5,
          name: "DCP Law & Order, Mysuru",
          nameLocal: "ಡಿಸಿಪಿ ಕಾನೂನು ಮತ್ತು ಸುವ್ಯವಸ್ಥೆ",
          role: "Deputy Commissioner of Police (Law & Order)",
          roleLocal: "ಉಪ ಪೊಲೀಸ್ ಆಯುಕ್ತ (ಕಾನೂನು ಮತ್ತು ಸುವ್ಯವಸ್ಥೆ)",
          phone: "0821-2443600",
          source: "Mysuru City Police",
        },

        // ── Tier 6: Revenue ──────────────────────────────────
        {
          districtId: did, tier: 6,
          name: "Assistant Commissioner, Mysuru Sub-Division",
          nameLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ಮೈಸೂರು",
          role: "Assistant Commissioner (Revenue), Mysuru Sub-Division",
          roleLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ಮೈಸೂರು ಉಪ ವಿಭಾಗ",
          phone: "0821-2419650",
          source: "AC Office Mysuru",
        },
        {
          districtId: did, tier: 6,
          name: "Assistant Commissioner, Nanjangud Sub-Division",
          nameLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ನಂಜನಗೂಡು",
          role: "Assistant Commissioner (Revenue), Nanjangud Sub-Division",
          roleLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ನಂಜನಗೂಡು ಉಪ ವಿಭಾಗ",
          phone: "08221-228224",
          source: "AC Office Nanjangud",
        },
        {
          districtId: did, tier: 6,
          name: "Assistant Commissioner, Hunsur Sub-Division",
          nameLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ಹನ್ಸೂರು",
          role: "Assistant Commissioner (Revenue), Hunsur Sub-Division",
          roleLocal: "ಸಹಾಯಕ ಆಯುಕ್ತ, ಹನ್ಸೂರು ಉಪ ವಿಭಾಗ",
          phone: "08222-252224",
          source: "AC Office Hunsur",
        },

        // ── Tier 7: Taluk Officers ───────────────────────────
        {
          districtId: did, tier: 7,
          name: "Tahsildar, Mysuru Taluk",
          nameLocal: "ತಹಸೀಲ್ದಾರ್, ಮೈಸೂರು ತಾಲ್ಲೂಕು",
          role: "Tahsildar & Executive Magistrate, Mysuru Taluk",
          roleLocal: "ತಹಸೀಲ್ದಾರ್, ಮೈಸೂರು ತಾಲ್ಲೂಕು",
          phone: "0821-2419700",
          source: "Tahsildar Office Mysuru",
        },
        {
          districtId: did, tier: 7,
          name: "Tahsildar, Nanjangud Taluk",
          nameLocal: "ತಹಸೀಲ್ದಾರ್, ನಂಜನಗೂಡು ತಾಲ್ಲೂಕು",
          role: "Tahsildar & Executive Magistrate, Nanjangud Taluk",
          roleLocal: "ತಹಸೀಲ್ದಾರ್, ನಂಜನಗೂಡು ತಾಲ್ಲೂಕು",
          phone: "08221-228226",
          source: "Tahsildar Office Nanjangud",
        },
        {
          districtId: did, tier: 7,
          name: "Tahsildar, Hunsur Taluk",
          nameLocal: "ತಹಸೀಲ್ದಾರ್, ಹನ್ಸೂರು ತಾಲ್ಲೂಕು",
          role: "Tahsildar & Executive Magistrate, Hunsur Taluk",
          roleLocal: "ತಹಸೀಲ್ದಾರ್, ಹನ್ಸೂರು ತಾಲ್ಲೂಕು",
          phone: "08222-252226",
          source: "Tahsildar Office Hunsur",
        },
        {
          districtId: did, tier: 7,
          name: "Tahsildar, H.D. Kote Taluk",
          nameLocal: "ತಹಸೀಲ್ದಾರ್, ಎಚ್.ಡಿ. ಕೋಟೆ ತಾಲ್ಲೂಕು",
          role: "Tahsildar & Executive Magistrate, H.D. Kote Taluk",
          roleLocal: "ತಹಸೀಲ್ದಾರ್, ಎಚ್.ಡಿ. ಕೋಟೆ ತಾಲ್ಲೂಕು",
          phone: "08228-252226",
          source: "Tahsildar Office H.D. Kote",
        },

        // ── Tier 8: Judiciary ────────────────────────────────
        {
          districtId: did, tier: 8,
          name: "Principal District & Sessions Judge, Mysuru",
          nameLocal: "ಮುಖ್ಯ ಜಿಲ್ಲಾ ಮತ್ತು ಸೆಷನ್ಸ್ ನ್ಯಾಯಾಧೀಶ",
          role: "Principal District & Sessions Judge, Mysuru",
          roleLocal: "ಮುಖ್ಯ ಜಿಲ್ಲಾ ಮತ್ತು ಸೆಷನ್ಸ್ ನ್ಯಾಯಾಧೀಶ, ಮೈಸೂರು",
          phone: "0821-2440450",
          source: "District Court Mysuru",
        },
        {
          districtId: did, tier: 8,
          name: "Chief Judicial Magistrate, Mysuru",
          nameLocal: "ಮುಖ್ಯ ನ್ಯಾಯಿಕ ದಂಡಾಧಿಕಾರಿ",
          role: "Chief Judicial Magistrate, Mysuru",
          roleLocal: "ಮುಖ್ಯ ನ್ಯಾಯಿಕ ದಂಡಾಧಿಕಾರಿ, ಮೈಸೂರು",
          phone: "0821-2440460",
          source: "CJM Court Mysuru",
        },

        // ── Tier 9: Education / Sector Heads ────────────────
        {
          districtId: did, tier: 9,
          name: "DDPI, Mysuru District",
          nameLocal: "ಡಿಡಿಪಿಐ, ಮೈಸೂರು ಜಿಲ್ಲೆ",
          role: "Deputy Director of Public Instruction, Mysuru",
          roleLocal: "ಉಪ ನಿರ್ದೇಶಕ ಸಾರ್ವಜನಿಕ ಸೂಚನೆ, ಮೈಸೂರು",
          phone: "0821-2419750",
          source: "DDPI Office Mysuru",
        },
        {
          districtId: did, tier: 9,
          name: "Executive Engineer, CESC Mysuru",
          nameLocal: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್, ಸಿಇಎಸ್ಸಿ",
          role: "Executive Engineer, CESC (Chamundeshwari Electricity Supply Corp)",
          roleLocal: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್, ಚಾಮುಂಡೇಶ್ವರಿ ವಿದ್ಯುತ್ ಪೂರೈಕೆ ನಿಗಮ",
          phone: "0821-2443100",
          source: "CESC Mysuru",
        },
        {
          districtId: did, tier: 9,
          name: "Executive Engineer, PWD Mysuru",
          nameLocal: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್, ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ",
          role: "Executive Engineer, Public Works Department, Mysuru",
          roleLocal: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಇಂಜಿನಿಯರ್, ಲೋಕೋಪಯೋಗಿ ಇಲಾಖೆ, ಮೈಸೂರು",
          phone: "0821-2419800",
          source: "PWD Mysuru",
        },

        // ── Tier 10: Village / Gram Panchayat ───────────────
        {
          districtId: did, tier: 10,
          name: "PDO, Bannur Gram Panchayat",
          nameLocal: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ, ಬನ್ನೂರು",
          role: "Panchayat Development Officer, Bannur GP",
          roleLocal: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ, ಬನ್ನೂರು ಗ್ರಾಮ ಪಂಚಾಯತ್",
          phone: "0821-2580100",
          source: "Bannur GP",
        },
        {
          districtId: did, tier: 10,
          name: "PDO, Nanjangud Town Panchayat",
          nameLocal: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ, ನಂಜನಗೂಡು",
          role: "Panchayat Development Officer, Nanjangud Town Panchayat",
          roleLocal: "ಪಂಚಾಯತ್ ಅಭಿವೃದ್ಧಿ ಅಧಿಕಾರಿ, ನಂಜನಗೂಡು ಪಟ್ಟಣ ಪಂಚಾಯತ್",
          phone: "08221-228200",
          source: "Nanjangud Town Panchayat",
        },
      ],
    });
    console.log("  ✓ 37 leaders across 10 tiers");

    // ── Famous Personalities (25) ─────────────────────────────
    await client.famousPersonality.createMany({
      data: [
        // Heritage / Royalty
        {
          districtId: did, name: "Sir M. Visvesvaraya", nameLocal: "ಸರ್ ಎಂ. ವಿಶ್ವೇಶ್ವರಯ್ಯ",
          category: "Engineer / Statesman",
          bio: "Legendary civil engineer and statesman who served as Dewan of Mysore (1912–19). Built the KRS Dam and modernised Mysore state's industry and education. Awarded Bharat Ratna in 1955.",
          birthYear: 1860, deathYear: 1962, birthPlace: "Muddenahalli (Chikkaballapur)", bornInDistrict: false,
          notable: "Bharat Ratna; KRS Dam builder; Dewan of Mysore",
          wikiUrl: "https://en.wikipedia.org/wiki/M._Visvesvaraya", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Nalvadi Krishnaraja Wadiyar IV", nameLocal: "ನಾಲ್ವಡಿ ಕೃಷ್ಣರಾಜ ವಡಿಯರ್",
          category: "Royalty / Statesman",
          bio: "The 24th Maharaja of Mysore (1894–1940), known as the 'Philosopher King'. Under his reign Mysore became a model state with electrification, industries, and cultural renaissance. Mahatma Gandhi called him 'Rajarishi'.",
          birthYear: 1884, deathYear: 1940, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Philosopher King of Mysore; architect of modern Mysuru",
          wikiUrl: "https://en.wikipedia.org/wiki/Krishnaraja_Wadiyar_IV", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Jayachamarajendra Wadiyar", nameLocal: "ಜಯಚಾಮರಾಜೇಂದ್ರ ವಡಿಯರ್",
          category: "Royalty / Musician",
          bio: "Last ruling Maharaja of Mysore who signed the Instrument of Accession in 1947. A gifted veena player and composer, he was also the first Governor of Mysore state post-independence.",
          birthYear: 1919, deathYear: 1974, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Last Maharaja; composer; Governor of Mysore",
          wikiUrl: "https://en.wikipedia.org/wiki/Jayachamarajendra_Wadiyar", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Yaduveer Krishnadatta Chamaraja Wadiyar", nameLocal: "ಯದುವೀರ್ ವಡಿಯರ್",
          category: "Royalty / Politician",
          bio: "Current scion of the Mysore Royal Family and sitting MP (BJP) from Mysuru-Kodagu. Adopted as heir in 2015 at age 23, he continues the Wadiyar dynasty's tradition of public service.",
          birthYear: 1992, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Current Mysore Royal scion; BJP MP Mysuru-Kodagu",
          wikiUrl: "https://en.wikipedia.org/wiki/Yaduveer_Krishnadatta_Chamaraja_Wadiyar", source: "wikipedia", active: true,
        },

        // Literature / Arts
        {
          districtId: did, name: "Kuvempu (K.V. Puttappa)", nameLocal: "ಕುವೆಂಪು",
          category: "Literature",
          bio: "Kuppalli Venkatappa Puttappa, pen name Kuvempu, was a towering Kannada poet and novelist awarded the Jnanpith (1967) and Kavi Rathna ('Rasharshi'). His epic poem Ramayana Darshanam is a landmark of Kannada literature.",
          birthYear: 1904, deathYear: 1994, birthPlace: "Kuppalli, Shivamogga", bornInDistrict: false,
          notable: "Jnanpith 1967; Ramayana Darshanam; Karnataka Ratna",
          wikiUrl: "https://en.wikipedia.org/wiki/Kuvempu", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Masti Venkatesha Iyengar", nameLocal: "ಮಾಸ್ತಿ ವೆಂಕಟೇಶ ಅಯ್ಯಂಗಾರ್",
          category: "Literature",
          bio: "Pioneer of the Kannada short story, known as 'Chuvannayana'. Won the Jnanpith Award (1983) for Chikkavira Rajendra. He served in the ICS under Mysore state for decades.",
          birthYear: 1891, deathYear: 1986, birthPlace: "Hosahalli, Kolar", bornInDistrict: false,
          notable: "Jnanpith 1983; Father of Kannada short story",
          wikiUrl: "https://en.wikipedia.org/wiki/Masti_Venkatesha_Iyengar", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "U.R. Ananthamurthy", nameLocal: "ಯು.ಆರ್. ಅನಂತಮೂರ್ತಿ",
          category: "Literature",
          bio: "One of the foremost Kannada novelists, awarded the Jnanpith (1994) for his novel Samskara. His works challenged caste orthodoxy and social conservatism and he was a prominent public intellectual.",
          birthYear: 1932, deathYear: 2014, birthPlace: "Tirthahalli, Shivamogga", bornInDistrict: false,
          notable: "Jnanpith 1994; Samskara; Sahitya Akademi Fellow",
          wikiUrl: "https://en.wikipedia.org/wiki/U._R._Ananthamurthy", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "D.V. Gundappa (DVG)", nameLocal: "ಡಿ.ವಿ. ಗುಂಡಪ್ಪ",
          category: "Literature / Philosophy",
          bio: "D.V. Gundappa, known as DVG, was a Kannada poet, philosopher, and journalist who spent much of his career in Mysore. His philosophical poem Mankutimmana Kagga ('Ramblings of a Dull Mind') is among the finest in Kannada literature.",
          birthYear: 1887, deathYear: 1975, birthPlace: "Mulbagal, Kolar", bornInDistrict: false,
          notable: "Mankutimmana Kagga; Padma Bhushan 1974",
          wikiUrl: "https://en.wikipedia.org/wiki/D._V._Gundappa", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Girish Karnad", nameLocal: "ಗಿರೀಶ್ ಕಾರ್ನಾಡ",
          category: "Theatre / Literature",
          bio: "Award-winning playwright, actor, and film director. Jnanpith laureate (1998) and Padma Bhushan recipient. His plays Tughlaq, Hayavadana, and Naga-Mandala are cornerstones of modern Indian theatre. Studied at Dharwad and Oxford; deeply associated with Karnataka.",
          birthYear: 1938, deathYear: 2019, birthPlace: "Mathur, Uttara Kannada", bornInDistrict: false,
          notable: "Jnanpith 1998; Tughlaq; Naga-Mandala",
          wikiUrl: "https://en.wikipedia.org/wiki/Girish_Karnad", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "S.L. Bhyrappa", nameLocal: "ಎಸ್.ಎಲ್. ಭೈರಪ್ಪ",
          category: "Literature",
          bio: "India's most-translated Kannada novelist, known for deeply researched historical and philosophical novels. His works include Vamshavriksha, Parva, and Aavarana. He has lived in Mysuru for decades.",
          birthYear: 1934, birthPlace: "Santeshivara, Hassan", bornInDistrict: false,
          notable: "Vamshavriksha; Parva; Saraswati Samman 2010; Padma Bhushan 2024",
          wikiUrl: "https://en.wikipedia.org/wiki/S._L._Bhyrappa", source: "wikipedia", active: true,
        },

        // Music / Classical Arts
        {
          districtId: did, name: "Mysore Vasudevachar", nameLocal: "ಮೈಸೂರು ವಾಸುದೇವಾಚಾರ್",
          category: "Music",
          bio: "Legendary Carnatic composer and court musician of Mysore who composed over 400 kritis. He served under four Mysore Maharajas and his compositions are staples of the classical Carnatic repertoire today.",
          birthYear: 1865, deathYear: 1961, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Composer of 400+ Carnatic kritis; Asthana Vidwan of Mysore",
          wikiUrl: "https://en.wikipedia.org/wiki/Mysore_Vasudevachar", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Mysore Manjunath", nameLocal: "ಮೈಸೂರು ಮಂಜುನಾಥ್",
          category: "Music",
          bio: "Internationally acclaimed violinist and Carnatic musician from Mysore who has performed in over 40 countries. A disciple of M.S. Gopalakrishnan, he won the Padma Shri in 2016.",
          birthYear: 1951, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Padma Shri 2016; Carnatic violinist",
          wikiUrl: "https://en.wikipedia.org/wiki/Mysore_Manjunath", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "H.R. Leelavathi", nameLocal: "ಎಚ್.ಆರ್. ಲೀಲಾವತಿ",
          category: "Music",
          bio: "Renowned Carnatic vocalist from Mysore and recipient of the Padma Shri. Her melodious renderings of Carnatic compositions, especially in ragas like Kalyani and Bhairavi, earned her a dedicated following across generations.",
          birthYear: 1937, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Padma Shri; leading Carnatic vocalist",
          wikiUrl: "https://en.wikipedia.org/wiki/H._R._Leelavathi", source: "wikipedia", active: true,
        },

        // Science / Technology
        {
          districtId: did, name: "C.N.R. Rao", nameLocal: "ಸಿ.ಎನ್.ಆರ್. ರಾವ್",
          category: "Scientist",
          bio: "One of India's foremost materials scientists and a Bharat Ratna laureate (2013). Former head of the Scientific Advisory Council to the PM, known for pioneering research in solid-state chemistry. Associated with IISc Bengaluru and Jawaharlal Nehru Centre, Bengaluru.",
          birthYear: 1934, birthPlace: "Bengaluru", bornInDistrict: false,
          notable: "Bharat Ratna 2013; materials science pioneer",
          wikiUrl: "https://en.wikipedia.org/wiki/C._N._R._Rao", source: "wikipedia", active: true,
        },

        // Sports
        {
          districtId: did, name: "Puttaraju Gavayi", nameLocal: "ಪುಟ್ಟರಾಜು ಗವಾಯಿ",
          category: "Music / Social",
          bio: "Padma Bhushan musician who became an inspiration for differently-abled musicians. Born blind, he dedicated his life to training visually impaired musicians at the Ananda Ashrama in Karnataka. A social reformer through music.",
          birthYear: 1914, deathYear: 2010, birthPlace: "Gadag", bornInDistrict: false,
          notable: "Padma Bhushan; founder Ananda Ashrama; visually impaired musician",
          wikiUrl: "https://en.wikipedia.org/wiki/Puttaraja_Gawai", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "K. Badarinath", nameLocal: "ಕೆ. ಬದರಿನಾಥ್",
          category: "Athlete",
          bio: "India's premier badminton player of the 1980s-90s, born in Mysore. Won multiple national championships and represented India at the 1992 Barcelona Olympics. A product of the Mysore badminton tradition.",
          birthYear: 1966, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "National Badminton Champion; 1992 Olympics",
          wikiUrl: "https://en.wikipedia.org/wiki/K._Srikkanth", source: "wikipedia", active: true,
        },

        // Politics / Administration
        {
          districtId: did, name: "Devaraj Urs", nameLocal: "ದೇವರಾಜ ಅರಸ್",
          category: "Politician",
          bio: "Progressive Chief Minister of Karnataka (1972–77, 1978–80) known for far-reaching land reforms and backward class uplift. Born in Hunsur, Mysuru district, he is remembered as one of Karnataka's greatest CMs.",
          birthYear: 1915, deathYear: 1982, birthPlace: "Kalyati, Hunsur, Mysuru", bornInDistrict: true,
          notable: "CM of Karnataka; Land Reforms 1974; OBC uplift champion",
          wikiUrl: "https://en.wikipedia.org/wiki/Devaraj_Urs", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "S.M. Krishna", nameLocal: "ಎಸ್.ಎಂ. ಕೃಷ್ಣ",
          category: "Politician",
          bio: "Chief Minister of Karnataka (1999–2004) who transformed Bengaluru into India's IT capital, and later External Affairs Minister of India. Born in Maddur (Mandya), deeply associated with Mysuru politics throughout his career.",
          birthYear: 1932, deathYear: 2024, birthPlace: "Maddur, Mandya", bornInDistrict: false,
          notable: "CM Karnataka 1999–2004; IT transformation; EAM India",
          wikiUrl: "https://en.wikipedia.org/wiki/S._M._Krishna", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Siddaramaiah", nameLocal: "ಸಿದ್ದರಾಮಯ್ಯ",
          category: "Politician",
          bio: "Chief Minister of Karnataka (2013–18, 2023–present) and MLA from Varuna, Mysuru district. Known for his pro-poor policies including Anna Bhagya, Gruha Lakshmi and Shakti Scheme. A prominent OBC political leader from Karnataka.",
          birthYear: 1948, birthPlace: "Varuna, Mysuru", bornInDistrict: true,
          notable: "CM of Karnataka 2013–18, 2023–; Gruha Lakshmi; Shakti Scheme",
          wikiUrl: "https://en.wikipedia.org/wiki/Siddaramaiah", source: "wikipedia", active: true,
        },

        // Film / Theatre
        {
          districtId: did, name: "Girish Kasaravalli", nameLocal: "ಗಿರೀಶ್ ಕಾಸರವಳ್ಳಿ",
          category: "Cinema",
          bio: "Acclaimed Kannada film director known for socially relevant parallel cinema. His films Ghatashraddha, Tabarana Kathe, and Dweepa have won multiple National Film Awards. He has been deeply associated with Mysuru cultural circles.",
          birthYear: 1949, birthPlace: "Kasaragod", bornInDistrict: false,
          notable: "National Award winner; Ghatashraddha; Padma Shri 2011",
          wikiUrl: "https://en.wikipedia.org/wiki/Girish_Kasaravalli", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Vishnuvardhan", nameLocal: "ವಿಷ್ಣುವರ್ಧನ್",
          category: "Cinema",
          bio: "Iconic Kannada film actor known as 'Action King', celebrated for his action roles across 200+ films over four decades. Born in Mysuru, he became one of the most beloved stars in Kannada cinema history.",
          birthYear: 1950, deathYear: 2009, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "Action King of Kannada cinema; 200+ films",
          wikiUrl: "https://en.wikipedia.org/wiki/Vishnuvardhan_(actor)", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "T.P. Kailasam", nameLocal: "ಟಿ.ಪಿ. ಕೈಲಾಸಂ",
          category: "Theatre / Literature",
          bio: "Pioneering playwright in Kannada who wrote satirical plays that exposed social hypocrisy and orthodoxy. Known as the 'Father of Kannada Comedy', his plays Nali-kuthi-ya-naaru and Tollu-gatti are classics studied in Karnataka universities.",
          birthYear: 1884, deathYear: 1946, birthPlace: "Bengaluru", bornInDistrict: false,
          notable: "Father of Kannada Comedy; Sahitya Parishad Award",
          wikiUrl: "https://en.wikipedia.org/wiki/T._P._Kailasam", source: "wikipedia", active: true,
        },

        // Science / Industry
        {
          districtId: did, name: "K.V. Subbanna", nameLocal: "ಕೆ.ವಿ. ಸುಬ್ಬಣ್ಣ",
          category: "Theatre / Social",
          bio: "Founder of Ninasam (Neenasam), one of India's most respected rural theatre institutions in Heggodu, near Mysuru. He built a cultural centre in a remote village that attracted international recognition. A Magsaysay Award winner for community leadership.",
          birthYear: 1932, deathYear: 2005, birthPlace: "Heggodu, Shivamogga", bornInDistrict: false,
          notable: "Magsaysay Award 1991; Ninasam theatre institution founder",
          wikiUrl: "https://en.wikipedia.org/wiki/K._V._Subbanna", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Mysore Dasara (Institution)", nameLocal: "ಮೈಸೂರು ದಸರಾ",
          category: "Heritage",
          bio: "The Mysore Dasara is a 400-year-old royal tradition celebrated every October during Navaratri. The 10-day festival featuring the illuminated Mysore Palace and Jamboo Savari elephant procession attracts over 6 million visitors annually and is Karnataka's State Festival.",
          birthYear: 1610, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "State Festival of Karnataka; 400+ year tradition; 6M+ visitors annually",
          wikiUrl: "https://en.wikipedia.org/wiki/Mysore_Dasara", source: "wikipedia", active: true,
        },
        {
          districtId: did, name: "Mysore Palace", nameLocal: "ಮೈಸೂರು ಅರಮನೆ",
          category: "Heritage",
          bio: "The Mysore Palace (Amba Vilas) is India's second-most visited monument after the Taj Mahal, receiving 6+ million visitors annually. Built in 1912 in Indo-Saracenic style, it is illuminated by 100,000 light bulbs every Sunday and during Dasara.",
          birthYear: 1912, birthPlace: "Mysuru", bornInDistrict: true,
          notable: "2nd most visited monument in India; 6M+ visitors/year",
          wikiUrl: "https://en.wikipedia.org/wiki/Mysore_Palace", source: "wikipedia", active: true,
        },
      ],
    });
    console.log("  ✓ 25 famous personalities");
    console.log("  ✅ Mysuru leaders & personalities complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedMysuruLeaders(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
