/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// ForThePeople.in — Full India Hierarchy
// India → State → District → Taluk → Village
// Active: Karnataka (Mandya, Bengaluru Urban, Mysuru)
// ═══════════════════════════════════════════════════════════

export interface Village {
  slug: string;
  name: string;
  nameLocal?: string;
  population?: number;
  pincode?: string;
}

export interface Taluk {
  slug: string;
  name: string;
  nameLocal: string;
  tagline?: string;
  population?: number;
  area?: number; // sq km
  villageCount?: number;
  villages?: Village[];
}

export interface DistrictBadge {
  emoji: string;
  label: string;
}

export interface District {
  slug: string;
  name: string;
  nameLocal: string;
  tagline?: string;
  taglineLocal?: string;
  active: boolean;
  population?: number;
  area?: number; // sq km
  talukCount?: number;
  villageCount?: number;
  literacy?: number;
  sexRatio?: number;
  badges?: DistrictBadge[];
  taluks: Taluk[];
}

export interface State {
  slug: string;
  name: string;
  nameLocal: string;
  active: boolean;
  capital?: string;
  type: "state" | "ut"; // state or union territory
  districts: District[];
}

// ── Mandya District — full detail ────────────────────────
const MANDYA_DISTRICT: District = {
  slug: "mandya",
  name: "Mandya",
  nameLocal: "ಮಂಡ್ಯ",
  tagline: "Sugar Capital of Karnataka",
  taglineLocal: "ಕರ್ನಾಟಕದ ಸಕ್ಕರೆ ನಗರ",
  active: true,
  badges: [
    { emoji: "🏭", label: "Sugar Capital of Karnataka" },
    { emoji: "🌊", label: "Home of KRS Dam" },
    { emoji: "🌾", label: "Kaveri Basin Heartland" },
  ],
  population: 1940428,
  area: 4961,
  talukCount: 7,
  villageCount: 1291,
  literacy: 72.8,
  sexRatio: 982,
  taluks: [
    {
      slug: "mandya",
      name: "Mandya",
      nameLocal: "ಮಂಡ್ಯ",
      tagline: "Sugar Capital of Karnataka",
      population: 516098,
      area: 727,
      villageCount: 193,
      villages: [
        { slug: "mandya-city", name: "Mandya City", nameLocal: "ಮಂಡ್ಯ ನಗರ", population: 131179, pincode: "571401" },
        { slug: "ganjam", name: "Ganjam", nameLocal: "ಗಂಜಾಂ", pincode: "571401" },
        { slug: "bogadi", name: "Bogadi", nameLocal: "ಬೊಗಾಡಿ", pincode: "571402" },
        { slug: "basaralu", name: "Basaralu", nameLocal: "ಬಸರಾಳು", pincode: "571441" },
        { slug: "bellur", name: "Bellur", nameLocal: "ಬೆಳ್ಳೂರು", pincode: "571448" },
      ],
    },
    {
      slug: "maddur",
      name: "Maddur",
      nameLocal: "ಮದ್ದೂರು",
      tagline: "Gateway to Old Mysore",
      population: 290000,
      area: 686,
      villageCount: 174,
      villages: [
        { slug: "maddur-town", name: "Maddur Town", nameLocal: "ಮದ್ದೂರು ಪಟ್ಟಣ", pincode: "571428" },
        { slug: "mahadevapura", name: "Mahadevapura", nameLocal: "ಮಹಾದೇವಪುರ", pincode: "571432" },
        { slug: "koppa", name: "Koppa", nameLocal: "ಕೊಪ್ಪ", pincode: "571425" },
      ],
    },
    {
      slug: "malavalli",
      name: "Malavalli",
      nameLocal: "ಮಳವಳ್ಳಿ",
      tagline: "Land of Temples & Tanks",
      population: 270000,
      area: 705,
      villageCount: 187,
      villages: [
        { slug: "malavalli-town", name: "Malavalli Town", nameLocal: "ಮಳವಳ್ಳಿ ಪಟ್ಟಣ", pincode: "571430" },
        { slug: "bharathinagara", name: "Bharathinagara", nameLocal: "ಭಾರತಿನಗರ", pincode: "571422" },
        { slug: "kollegal-road", name: "Kollegal Road", nameLocal: "ಕೊಳ್ಳೇಗಾಲ ರಸ್ತೆ", pincode: "571430" },
      ],
    },
    {
      slug: "srirangapatna",
      name: "Srirangapatna",
      nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ",
      tagline: "Tipu Sultan's Island Fortress",
      population: 225000,
      area: 581,
      villageCount: 135,
      villages: [
        { slug: "srirangapatna-town", name: "Srirangapatna Town", nameLocal: "ಶ್ರೀರಂಗಪಟ್ಟಣ ಪಟ್ಟಣ", pincode: "571438" },
        { slug: "bannur", name: "Bannur", nameLocal: "ಬನ್ನೂರು", pincode: "571101" },
        { slug: "kirugavalu", name: "Kirugavalu", nameLocal: "ಕಿರುಗಾವಲು", pincode: "571443" },
      ],
    },
    {
      slug: "nagamangala",
      name: "Nagamangala",
      nameLocal: "ನಾಗಮಂಗಲ",
      tagline: "Heart of the Deccan Plateau",
      population: 220000,
      area: 791,
      villageCount: 200,
      villages: [
        { slug: "nagamangala-town", name: "Nagamangala Town", nameLocal: "ನಾಗಮಂಗಲ ಪಟ್ಟಣ", pincode: "571432" },
        { slug: "hosur", name: "Hosur", nameLocal: "ಹೊಸೂರು", pincode: "571453" },
      ],
    },
    {
      slug: "kr-pete",
      name: "K R Pete",
      nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ",
      tagline: "Jewel of the Kaveri Basin",
      population: 235000,
      area: 727,
      villageCount: 210,
      villages: [
        { slug: "kr-pete-town", name: "K R Pete Town", nameLocal: "ಕೆ.ಆರ್.ಪೇಟೆ ಪಟ್ಟಣ", pincode: "571426" },
        { slug: "belagola", name: "Belagola", nameLocal: "ಬೇಲಗೊಳ", pincode: "571423" },
      ],
    },
    {
      slug: "pandavapura",
      name: "Pandavapura",
      nameLocal: "ಪಾಂಡವಪುರ",
      tagline: "Where the Pandavas Rested",
      population: 175000,
      area: 744,
      villageCount: 192,
      villages: [
        { slug: "pandavapura-town", name: "Pandavapura Town", nameLocal: "ಪಾಂಡವಪುರ ಪಟ್ಟಣ", pincode: "571434" },
        { slug: "melukote", name: "Melukote", nameLocal: "ಮೇಲುಕೋಟೆ", pincode: "571431" },
      ],
    },
  ],
};

// ── Bengaluru Urban District ──────────────────────────────
const BENGALURU_URBAN_DISTRICT: District = {
  slug: "bengaluru-urban",
  name: "Bengaluru Urban",
  nameLocal: "ಬೆಂಗಳೂರು ನಗರ",
  tagline: "Silicon Valley of India",
  taglineLocal: "ಭಾರತದ ಸಿಲಿಕಾನ್ ಕಣಿವೆ",
  active: true,
  badges: [
    { emoji: "💻", label: "Startup Capital of India" },
    { emoji: "🌳", label: "Garden City" },
    { emoji: "🔬", label: "ISRO & HAL Headquarters" },
    { emoji: "🚀", label: "India's Silicon Valley" },
  ],
  population: 12765000,
  area: 741,
  talukCount: 4,
  villageCount: 532,
  literacy: 88.48,
  sexRatio: 916,
  taluks: [
    {
      slug: "bengaluru-north",
      name: "Bengaluru North",
      nameLocal: "ಬೆಂಗಳೂರು ಉತ್ತರ",
      tagline: "Gateway to the Airport",
      population: 3800000,
      area: 198,
      villageCount: 145,
      villages: [
        { slug: "yelahanka", name: "Yelahanka", nameLocal: "ಯಲಹಂಕ", population: 250000, pincode: "560064" },
        { slug: "devanahalli", name: "Devanahalli", nameLocal: "ದೇವನಹಳ್ಳಿ", population: 45000, pincode: "562110" },
        { slug: "doddaballapur", name: "Doddaballapur", nameLocal: "ದೊಡ್ಡಬಳ್ಳಾಪುರ", population: 60000, pincode: "561203" },
        { slug: "hesaraghatta", name: "Hesaraghatta", nameLocal: "ಹೆಸರಘಟ್ಟ", population: 18000, pincode: "560088" },
        { slug: "chikkaballapur-road", name: "Chikkaballapur Road", nameLocal: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ ರಸ್ತೆ", pincode: "562101" },
      ],
    },
    {
      slug: "bengaluru-south",
      name: "Bengaluru South",
      nameLocal: "ಬೆಂಗಳೂರು ದಕ್ಷಿಣ",
      tagline: "Heart of the Garden City",
      population: 4200000,
      area: 186,
      villageCount: 120,
      villages: [
        { slug: "jayanagar", name: "Jayanagar", nameLocal: "ಜಯನಗರ", population: 450000, pincode: "560041" },
        { slug: "basavanagudi", name: "Basavanagudi", nameLocal: "ಬಸವನಗುಡಿ", population: 120000, pincode: "560004" },
        { slug: "btm-layout", name: "BTM Layout", nameLocal: "ಬಿ.ಟಿ.ಎಂ ಲೇಔಟ್", population: 280000, pincode: "560076" },
        { slug: "bannerghatta-road", name: "Bannerghatta Road", nameLocal: "ಬನ್ನೇರಘಟ್ಟ ರಸ್ತೆ", population: 320000, pincode: "560083" },
        { slug: "kanakapura-road", name: "Kanakapura Road", nameLocal: "ಕನಕಪುರ ರಸ್ತೆ", pincode: "560062" },
      ],
    },
    {
      slug: "bengaluru-east",
      name: "Bengaluru East",
      nameLocal: "ಬೆಂಗಳೂರು ಪೂರ್ವ",
      tagline: "IT Corridor Hub",
      population: 3100000,
      area: 194,
      villageCount: 150,
      villages: [
        { slug: "whitefield", name: "Whitefield", nameLocal: "ವೈಟ್‌ಫೀಲ್ಡ್", population: 380000, pincode: "560066" },
        { slug: "kr-puram", name: "K R Puram", nameLocal: "ಕೆ.ಆರ್.ಪುರ", population: 420000, pincode: "560036" },
        { slug: "marathahalli", name: "Marathahalli", nameLocal: "ಮರಾಠಾಹಳ್ಳಿ", population: 350000, pincode: "560037" },
        { slug: "hsr-layout", name: "HSR Layout", nameLocal: "ಎಚ್.ಎಸ್.ಆರ್ ಲೇಔಟ್", population: 200000, pincode: "560102" },
        { slug: "indiranagar", name: "Indiranagar", nameLocal: "ಇಂದಿರಾನಗರ", population: 180000, pincode: "560038" },
      ],
    },
    {
      slug: "anekal",
      name: "Anekal",
      nameLocal: "ಆನೇಕಲ್",
      tagline: "Electronics City Gateway",
      population: 1665000,
      area: 163,
      villageCount: 117,
      villages: [
        { slug: "electronic-city", name: "Electronic City", nameLocal: "ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ", population: 280000, pincode: "560100" },
        { slug: "chandapura", name: "Chandapura", nameLocal: "ಚಂದಾಪುರ", population: 95000, pincode: "562106" },
        { slug: "anekal-town", name: "Anekal Town", nameLocal: "ಆನೇಕಲ್ ಪಟ್ಟಣ", population: 38000, pincode: "562106" },
        { slug: "sarjapur", name: "Sarjapur", nameLocal: "ಸರ್ಜಾಪುರ", population: 120000, pincode: "562125" },
        { slug: "attibele", name: "Attibele", nameLocal: "ಅತ್ತಿಬೆಲೆ", population: 55000, pincode: "562107" },
      ],
    },
  ],
};

// ── Mysuru District ───────────────────────────────────────
const MYSURU_DISTRICT: District = {
  slug: "mysuru",
  name: "Mysuru",
  nameLocal: "ಮೈಸೂರು",
  tagline: "City of Palaces",
  taglineLocal: "ಅರಮನೆಗಳ ನಗರ",
  active: true,
  badges: [
    { emoji: "🏆", label: "India's Cleanest City" },
    { emoji: "🏛️", label: "City of Palaces" },
    { emoji: "🎪", label: "Dasara Heritage" },
    { emoji: "🐘", label: "Wildlife Capital" },
    { emoji: "🧼", label: "Mysore Sandal Soap" },
  ],
  population: 3248000,
  area: 6854,
  talukCount: 7,
  villageCount: 2629,
  literacy: 72.64,
  sexRatio: 984,
  taluks: [
    {
      slug: "mysuru-taluk",
      name: "Mysuru",
      nameLocal: "ಮೈಸೂರು",
      tagline: "Heritage Capital of Karnataka",
      population: 1800000,
      area: 1654,
      villageCount: 362,
      villages: [
        { slug: "mysuru-city", name: "Mysuru City", nameLocal: "ಮೈಸೂರು ನಗರ", population: 920000, pincode: "570001" },
        { slug: "bogadi", name: "Bogadi", nameLocal: "ಬೊಗಾಡಿ", population: 42000, pincode: "570026" },
        { slug: "hebbal-mysuru", name: "Hebbal", nameLocal: "ಹೆಬ್ಬಾಳ", population: 38000, pincode: "570016" },
        { slug: "nanjangud-road", name: "Nanjangud Road", nameLocal: "ನಂಜನಗೂಡು ರಸ್ತೆ", population: 28000, pincode: "570008" },
        { slug: "bannur", name: "Bannur", nameLocal: "ಬನ್ನೂರು", population: 22000, pincode: "571101" },
      ],
    },
    {
      slug: "hunsur",
      name: "Hunsur",
      nameLocal: "ಹನ್ಸೂರು",
      tagline: "Coffee & Cardamom Country",
      population: 320000,
      area: 862,
      villageCount: 284,
      villages: [
        { slug: "hunsur-town", name: "Hunsur", nameLocal: "ಹನ್ಸೂರು", population: 55000, pincode: "571105" },
        { slug: "bettadapura", name: "Bettadapura", nameLocal: "ಬೆಟ್ಟದಪುರ", population: 12000, pincode: "571108" },
        { slug: "sargur", name: "Sargur", nameLocal: "ಸರ್ಗೂರು", population: 18000, pincode: "571109" },
        { slug: "kathriguppe", name: "Kathriguppe", nameLocal: "ಕತ್ತ್ರಿಗುಪ್ಪೆ", population: 9000, pincode: "571107" },
        { slug: "bilikere", name: "Bilikere", nameLocal: "ಬಿಳಿಕೆರೆ", population: 14000, pincode: "571104" },
      ],
    },
    {
      slug: "nanjangud",
      name: "Nanjangud",
      nameLocal: "ನಂಜನಗೂಡು",
      tagline: "Temple Town on the Kapila",
      population: 325000,
      area: 936,
      villageCount: 325,
      villages: [
        { slug: "nanjangud-town", name: "Nanjangud", nameLocal: "ನಂಜನಗೂಡು", population: 78000, pincode: "571301" },
        { slug: "tagadur", name: "Tagadur", nameLocal: "ತಾಗಡೂರು", population: 8000, pincode: "571312" },
        { slug: "natanahalli", name: "Natanahalli", nameLocal: "ನಾಟನಹಳ್ಳಿ", population: 6500, pincode: "571302" },
        { slug: "gundlupet-jn", name: "Gundlupet Jn", nameLocal: "ಗುಂಡ್ಲುಪೇಟೆ ಜಂಕ್ಷನ್", population: 11000, pincode: "571111" },
        { slug: "hullahalli", name: "Hullahalli", nameLocal: "ಹುಲ್ಲಹಳ್ಳಿ", population: 7500, pincode: "571304" },
      ],
    },
    {
      slug: "t-narasipur",
      name: "T. Narasipur",
      nameLocal: "ತಿರುಮಕೂಡಲು ನರಸೀಪುರ",
      tagline: "Triveni Sangama — Three Rivers Meet",
      population: 260000,
      area: 1005,
      villageCount: 348,
      villages: [
        { slug: "t-narasipur-town", name: "T. Narasipur", nameLocal: "ತಿ. ನರಸೀಪುರ", population: 32000, pincode: "571124" },
        { slug: "muguru", name: "Muguru", nameLocal: "ಮುಗೂರು", population: 7000, pincode: "571127" },
        { slug: "hosa-holalu", name: "Hosa Holalu", nameLocal: "ಹೊಸ ಹೊಳಲು", population: 5500, pincode: "571123" },
        { slug: "sathegala", name: "Sathegala", nameLocal: "ಸಾತೆಗಾಲ", population: 8000, pincode: "571126" },
        { slug: "kalale", name: "Kalale", nameLocal: "ಕಳಲೆ", population: 6000, pincode: "571122" },
      ],
    },
    {
      slug: "hd-kote",
      name: "H.D. Kote",
      nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ",
      tagline: "Gateway to Nagarahole",
      population: 220000,
      area: 2374,
      villageCount: 370,
      villages: [
        { slug: "hd-kote-town", name: "H.D. Kote", nameLocal: "ಎಚ್.ಡಿ. ಕೋಟೆ", population: 28000, pincode: "571114" },
        { slug: "nagarahole", name: "Nagarahole", nameLocal: "ನಾಗರಹೊಳೆ", population: 5000, pincode: "571118" },
        { slug: "antarsante", name: "Antarsante", nameLocal: "ಅಂತರ್ಸಂತೆ", population: 8000, pincode: "571116" },
        { slug: "kuttoor", name: "Kuttoor", nameLocal: "ಕುತ್ತೂರು", population: 6500, pincode: "571115" },
        { slug: "manchala", name: "Manchala", nameLocal: "ಮಂಚಾಲ", population: 4500, pincode: "571117" },
      ],
    },
    {
      slug: "periyapatna",
      name: "Periyapatna",
      nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ",
      tagline: "Land of Turmeric and Pepper",
      population: 210000,
      area: 782,
      villageCount: 260,
      villages: [
        { slug: "periyapatna-town", name: "Periyapatna", nameLocal: "ಪಿರಿಯಾಪಟ್ಟಣ", population: 38000, pincode: "571107" },
        { slug: "shivapura-mys", name: "Shivapura", nameLocal: "ಶಿವಪುರ", population: 7000, pincode: "571119" },
        { slug: "hosaholalu", name: "Hosaholalu", nameLocal: "ಹೊಸಹೊಳಲು", population: 5500, pincode: "571120" },
        { slug: "balehonnur-jn", name: "Balehonnur Jn", nameLocal: "ಬಾಳೆಹೊನ್ನೂರು ಜಂಕ್ಷನ್", population: 9000, pincode: "571108" },
        { slug: "hannur", name: "Hannur", nameLocal: "ಹಣ್ಣೂರು", population: 6000, pincode: "571121" },
      ],
    },
    {
      slug: "kr-nagar",
      name: "K.R. Nagar",
      nameLocal: "ಕೃಷ್ಣರಾಜನಗರ",
      tagline: "Cauvery Heartland",
      population: 215000,
      area: 1079,
      villageCount: 305,
      villages: [
        { slug: "kr-nagar-town", name: "K.R. Nagar", nameLocal: "ಕೃಷ್ಣರಾಜನಗರ", population: 34000, pincode: "571602" },
        { slug: "arakere-mys", name: "Arakere", nameLocal: "ಅರಕೆರೆ", population: 8000, pincode: "571604" },
        { slug: "yedatore", name: "Yedatore", nameLocal: "ಯಡತೊರೆ", population: 7500, pincode: "571603" },
        { slug: "bherya", name: "Bherya", nameLocal: "ಭೇರ್ಯ", population: 5500, pincode: "571605" },
        { slug: "krishnarajasagara", name: "KRS Dam Area", nameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ", population: 12000, pincode: "571607" },
      ],
    },
  ],
};

// ── Karnataka — all 31 districts ─────────────────────────
const KARNATAKA_DISTRICTS: District[] = [
  MANDYA_DISTRICT,
  BENGALURU_URBAN_DISTRICT,
  MYSURU_DISTRICT,
  { slug: "bengaluru-rural", name: "Bengaluru Rural", nameLocal: "ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ", active: false, population: 990923, area: 2259, talukCount: 4, villageCount: 1078, taluks: [] },
  { slug: "tumakuru", name: "Tumakuru", nameLocal: "ತುಮಕೂರು", active: false, population: 2678980, area: 10597, talukCount: 10, villageCount: 2741, taluks: [] },
  { slug: "kolar", name: "Kolar", nameLocal: "ಕೋಲಾರ", active: false, population: 1540231, area: 3969, talukCount: 5, villageCount: 1396, taluks: [] },
  { slug: "ramanagara", name: "Ramanagara", nameLocal: "ರಾಮನಗರ", active: false, population: 1082739, area: 3510, talukCount: 4, villageCount: 1029, taluks: [] },
  { slug: "chikkaballapur", name: "Chikkaballapur", nameLocal: "ಚಿಕ್ಕಬಳ್ಳಾಪುರ", active: false, population: 1255104, area: 4207, talukCount: 6, villageCount: 1543, taluks: [] },
  { slug: "hassan", name: "Hassan", nameLocal: "ಹಾಸನ", active: false, population: 1776421, area: 6814, talukCount: 8, villageCount: 2447, taluks: [] },
  { slug: "chikkamagaluru", name: "Chikkamagaluru", nameLocal: "ಚಿಕ್ಕಮಗಳೂರು", active: false, population: 1137961, area: 7201, talukCount: 7, villageCount: 1710, taluks: [] },
  { slug: "kodagu", name: "Kodagu", nameLocal: "ಕೊಡಗು", active: false, population: 554762, area: 4102, talukCount: 3, villageCount: 282, taluks: [] },
  { slug: "shivamogga", name: "Shivamogga", nameLocal: "ಶಿವಮೊಗ್ಗ", active: false, population: 1755512, area: 8477, talukCount: 7, villageCount: 2035, taluks: [] },
  { slug: "davanagere", name: "Davanagere", nameLocal: "ದಾವಣಗೆರೆ", active: false, population: 1945497, area: 5926, talukCount: 6, villageCount: 1551, taluks: [] },
  { slug: "chitradurga", name: "Chitradurga", nameLocal: "ಚಿತ್ರದುರ್ಗ", active: false, population: 1660378, area: 8440, talukCount: 6, villageCount: 1839, taluks: [] },
  { slug: "ballari", name: "Ballari", nameLocal: "ಬಳ್ಳಾರಿ", active: false, population: 2530068, area: 8447, talukCount: 7, villageCount: 1481, taluks: [] },
  { slug: "vijayanagara", name: "Vijayanagara", nameLocal: "ವಿಜಯನಗರ", active: false, population: 1300000, area: 3000, talukCount: 5, villageCount: 600, taluks: [] },
  { slug: "raichur", name: "Raichur", nameLocal: "ರಾಯಚೂರು", active: false, population: 1924773, area: 6827, talukCount: 5, villageCount: 786, taluks: [] },
  { slug: "koppal", name: "Koppal", nameLocal: "ಕೊಪ್ಪಳ", active: false, population: 1391292, area: 5490, talukCount: 4, villageCount: 651, taluks: [] },
  { slug: "gadag", name: "Gadag", nameLocal: "ಗದಗ", active: false, population: 1065235, area: 4656, talukCount: 5, villageCount: 696, taluks: [] },
  { slug: "dharwad", name: "Dharwad", nameLocal: "ಧಾರವಾಡ", active: false, population: 1847023, area: 4263, talukCount: 4, villageCount: 570, taluks: [] },
  { slug: "haveri", name: "Haveri", nameLocal: "ಹಾವೇರಿ", active: false, population: 1598506, area: 4851, talukCount: 7, villageCount: 1025, taluks: [] },
  { slug: "belagavi", name: "Belagavi", nameLocal: "ಬೆಳಗಾವಿ", active: false, population: 4779661, area: 13415, talukCount: 14, villageCount: 2929, taluks: [] },
  { slug: "vijayapura", name: "Vijayapura", nameLocal: "ವಿಜಯಪುರ", active: false, population: 2175097, area: 10534, talukCount: 5, villageCount: 1038, taluks: [] },
  { slug: "bagalkot", name: "Bagalkot", nameLocal: "ಬಾಗಲಕೋಟೆ", active: false, population: 1890826, area: 6575, talukCount: 6, villageCount: 1114, taluks: [] },
  { slug: "bidar", name: "Bidar", nameLocal: "ಬೀದರ್", active: false, population: 1700018, area: 5448, talukCount: 5, villageCount: 852, taluks: [] },
  { slug: "kalaburagi", name: "Kalaburagi", nameLocal: "ಕಲಬುರಗಿ", active: false, population: 2566326, area: 10951, talukCount: 7, villageCount: 1408, taluks: [] },
  { slug: "yadgir", name: "Yadgir", nameLocal: "ಯಾದಗಿರಿ", active: false, population: 1173170, area: 5117, talukCount: 3, villageCount: 537, taluks: [] },
  { slug: "dakshina-kannada", name: "Dakshina Kannada", nameLocal: "ದಕ್ಷಿಣ ಕನ್ನಡ", active: false, population: 2089649, area: 4560, talukCount: 5, villageCount: 793, taluks: [] },
  { slug: "udupi", name: "Udupi", nameLocal: "ಉಡುಪಿ", active: false, population: 1177908, area: 3880, talukCount: 3, villageCount: 479, taluks: [] },
  { slug: "uttara-kannada", name: "Uttara Kannada", nameLocal: "ಉತ್ತರ ಕನ್ನಡ", active: false, population: 1437169, area: 10291, talukCount: 11, villageCount: 1085, taluks: [] },
  { slug: "chamarajanagar", name: "Chamarajanagar", nameLocal: "ಚಾಮರಾಜನಗರ", active: false, population: 1020791, area: 5101, talukCount: 4, villageCount: 743, taluks: [] },
];

// ── New Delhi District ───────────────────────────────────
const NEW_DELHI_DISTRICT: District = {
  slug: "new-delhi",
  name: "New Delhi",
  nameLocal: "नई दिल्ली",
  tagline: "Capital of India",
  taglineLocal: "भारत की राजधानी",
  active: true,
  badges: [
    { emoji: "🇮🇳", label: "National Capital" },
    { emoji: "🏛️", label: "UNESCO World Heritage" },
    { emoji: "🏗️", label: "Lutyens Architecture" },
  ],
  population: 1173902,
  area: 35,
  talukCount: 3,
  villageCount: 0,
  literacy: 89.38,
  sexRatio: 824,
  taluks: [
    {
      slug: "connaught-place",
      name: "Connaught Place",
      nameLocal: "कनॉट प्लेस",
      tagline: "Heart of Lutyens Delhi",
      population: 350000,
      area: 12,
      villageCount: 0,
      villages: [
        { slug: "cp-inner", name: "Inner Circle CP", nameLocal: "इनर सर्कल सीपी", population: 45000, pincode: "110001" },
        { slug: "janpath", name: "Janpath", nameLocal: "जनपथ", population: 62000, pincode: "110001" },
        { slug: "barakhamba", name: "Barakhamba Road", nameLocal: "बाराखंबा रोड", population: 48000, pincode: "110001" },
        { slug: "mandi-house", name: "Mandi House", nameLocal: "मंडी हाउस", population: 38000, pincode: "110001" },
      ],
    },
    {
      slug: "chanakyapuri",
      name: "Chanakyapuri",
      nameLocal: "चाणक्यपुरी",
      tagline: "Diplomatic Enclave",
      population: 280000,
      area: 11,
      villageCount: 0,
      villages: [
        { slug: "chanakyapuri-area", name: "Chanakyapuri", nameLocal: "चाणक्यपुरी", population: 95000, pincode: "110021" },
        { slug: "rashtrapati-bhavan", name: "Rashtrapati Bhavan Area", nameLocal: "राष्ट्रपति भवन क्षेत्र", population: 32000, pincode: "110004" },
        { slug: "india-gate", name: "India Gate", nameLocal: "इंडिया गेट", population: 55000, pincode: "110003" },
      ],
    },
    {
      slug: "lodhi-road",
      name: "Lodhi Road",
      nameLocal: "लोधी रोड",
      tagline: "Institutional Hub",
      population: 543000,
      area: 12,
      villageCount: 0,
      villages: [
        { slug: "lodhi-colony", name: "Lodhi Colony", nameLocal: "लोधी कॉलोनी", population: 82000, pincode: "110003" },
        { slug: "jor-bagh", name: "Jor Bagh", nameLocal: "जोर बाग", population: 45000, pincode: "110003" },
        { slug: "khan-market", name: "Khan Market", nameLocal: "खान मार्केट", population: 68000, pincode: "110003" },
        { slug: "laxmibai-nagar", name: "Laxmibai Nagar", nameLocal: "लक्ष्मीबाई नगर", population: 120000, pincode: "110023" },
        { slug: "sarojini-nagar", name: "Sarojini Nagar", nameLocal: "सरोजिनी नगर", population: 228000, pincode: "110023" },
      ],
    },
  ],
};

// ── Mumbai District ─────────────────────────────────────────
const MUMBAI_DISTRICT: District = {
  slug: "mumbai",
  name: "Mumbai",
  nameLocal: "मुंबई",
  tagline: "Financial Capital of India",
  taglineLocal: "भारत की वित्तीय राजधानी",
  active: true,
  badges: [
    { emoji: "💰", label: "Financial Capital of India" },
    { emoji: "🎬", label: "Bollywood" },
    { emoji: "🌊", label: "Gateway of India" },
    { emoji: "🚂", label: "World's Busiest Suburban Rail" },
  ],
  population: 12442373,
  area: 603,
  talukCount: 5,
  villageCount: 0,
  literacy: 89.73,
  sexRatio: 832,
  taluks: [
    {
      slug: "south-mumbai",
      name: "South Mumbai",
      nameLocal: "दक्षिण मुंबई",
      tagline: "Historic Gateway of India",
      population: 2100000,
      area: 68,
      villageCount: 0,
      villages: [
        { slug: "colaba", name: "Colaba", nameLocal: "कोलाबा", population: 180000, pincode: "400005" },
        { slug: "fort", name: "Fort", nameLocal: "फोर्ट", population: 95000, pincode: "400001" },
        { slug: "marine-drive", name: "Marine Drive", nameLocal: "मरीन ड्राइव", population: 250000, pincode: "400020" },
        { slug: "dadar", name: "Dadar", nameLocal: "दादर", population: 380000, pincode: "400014" },
        { slug: "worli", name: "Worli", nameLocal: "वरळी", population: 290000, pincode: "400018" },
      ],
    },
    {
      slug: "western-suburbs",
      name: "Western Suburbs",
      nameLocal: "पश्चिम उपनगर",
      tagline: "Bollywood & Business Hub",
      population: 3800000,
      area: 155,
      villageCount: 0,
      villages: [
        { slug: "bandra", name: "Bandra", nameLocal: "वांद्रे", population: 420000, pincode: "400050" },
        { slug: "andheri", name: "Andheri", nameLocal: "अंधेरी", population: 580000, pincode: "400058" },
        { slug: "goregaon", name: "Goregaon", nameLocal: "गोरेगांव", population: 380000, pincode: "400062" },
        { slug: "malad", name: "Malad", nameLocal: "मालाड", population: 520000, pincode: "400064" },
        { slug: "borivali", name: "Borivali", nameLocal: "बोरीवली", population: 450000, pincode: "400066" },
      ],
    },
    {
      slug: "eastern-suburbs",
      name: "Eastern Suburbs",
      nameLocal: "पूर्व उपनगर",
      tagline: "Industrial & Residential Belt",
      population: 3200000,
      area: 140,
      villageCount: 0,
      villages: [
        { slug: "kurla", name: "Kurla", nameLocal: "कुर्ला", population: 480000, pincode: "400070" },
        { slug: "ghatkopar", name: "Ghatkopar", nameLocal: "घाटकोपर", population: 520000, pincode: "400077" },
        { slug: "mulund", name: "Mulund", nameLocal: "मुलुंड", population: 380000, pincode: "400080" },
        { slug: "bhandup", name: "Bhandup", nameLocal: "भांडुप", population: 420000, pincode: "400078" },
        { slug: "vikhroli", name: "Vikhroli", nameLocal: "विक्रोळी", population: 350000, pincode: "400083" },
      ],
    },
    {
      slug: "navi-mumbai-zone",
      name: "Harbour Zone",
      nameLocal: "हार्बर क्षेत्र",
      tagline: "Port & Trade Gateway",
      population: 1800000,
      area: 120,
      villageCount: 0,
      villages: [
        { slug: "chembur", name: "Chembur", nameLocal: "चेंबूर", population: 420000, pincode: "400071" },
        { slug: "mankhurd", name: "Mankhurd", nameLocal: "मानखुर्द", population: 280000, pincode: "400088" },
        { slug: "govandi", name: "Govandi", nameLocal: "गोवंडी", population: 350000, pincode: "400043" },
        { slug: "trombay", name: "Trombay", nameLocal: "ट्रॉम्बे", population: 180000, pincode: "400088" },
      ],
    },
    {
      slug: "north-mumbai",
      name: "North Mumbai",
      nameLocal: "उत्तर मुंबई",
      tagline: "Green Lung of the City",
      population: 1542373,
      area: 120,
      villageCount: 0,
      villages: [
        { slug: "dahisar", name: "Dahisar", nameLocal: "दहिसर", population: 350000, pincode: "400068" },
        { slug: "kandivali", name: "Kandivali", nameLocal: "कांदिवली", population: 480000, pincode: "400067" },
        { slug: "mira-road", name: "Mira Road", nameLocal: "मीरा रोड", population: 380000, pincode: "401107" },
      ],
    },
  ],
};

// ── Chennai District ────────────────────────────────────────
const CHENNAI_DISTRICT: District = {
  slug: "chennai",
  name: "Chennai",
  nameLocal: "சென்னை",
  tagline: "Gateway to South India",
  taglineLocal: "தென்னிந்தியாவின் நுழைவாயில்",
  active: true,
  badges: [
    { emoji: "🚗", label: "Detroit of India" },
    { emoji: "🏖️", label: "Marina Beach" },
    { emoji: "🏥", label: "India's Health Capital" },
    { emoji: "🎵", label: "Carnatic Music Heritage" },
  ],
  population: 7088000,
  area: 426,
  talukCount: 4,
  villageCount: 0,
  literacy: 90.33,
  sexRatio: 989,
  taluks: [
    {
      slug: "chennai-north",
      name: "Chennai North",
      nameLocal: "வடக்கு சென்னை",
      tagline: "Historic Port & Trade Hub",
      population: 2100000,
      area: 110,
      villageCount: 0,
      villages: [
        { slug: "george-town", name: "George Town", nameLocal: "ஜார்ஜ் டவுன்", population: 180000, pincode: "600001" },
        { slug: "tondiarpet", name: "Tondiarpet", nameLocal: "தொண்டியார்பேட்டை", population: 420000, pincode: "600081" },
        { slug: "royapuram", name: "Royapuram", nameLocal: "இராயபுரம்", population: 380000, pincode: "600013" },
        { slug: "perambur", name: "Perambur", nameLocal: "பெரம்பூர்", population: 350000, pincode: "600011" },
        { slug: "kolathur", name: "Kolathur", nameLocal: "கொளத்தூர்", population: 290000, pincode: "600099" },
      ],
    },
    {
      slug: "chennai-south",
      name: "Chennai South",
      nameLocal: "தெற்கு சென்னை",
      tagline: "Cultural & IT Corridor",
      population: 2300000,
      area: 130,
      villageCount: 0,
      villages: [
        { slug: "mylapore", name: "Mylapore", nameLocal: "மயிலாப்பூர்", population: 280000, pincode: "600004" },
        { slug: "adyar", name: "Adyar", nameLocal: "அடையாறு", population: 350000, pincode: "600020" },
        { slug: "velachery", name: "Velachery", nameLocal: "வேளச்சேரி", population: 420000, pincode: "600042" },
        { slug: "tambaram", name: "Tambaram", nameLocal: "தாம்பரம்", population: 380000, pincode: "600045" },
        { slug: "sholinganallur", name: "Sholinganallur", nameLocal: "சோளிங்கநல்லூர்", population: 350000, pincode: "600119" },
      ],
    },
    {
      slug: "chennai-central",
      name: "Chennai Central",
      nameLocal: "மத்திய சென்னை",
      tagline: "Heart of the City",
      population: 1500000,
      area: 86,
      villageCount: 0,
      villages: [
        { slug: "t-nagar", name: "T. Nagar", nameLocal: "தி. நகர்", population: 320000, pincode: "600017" },
        { slug: "nungambakkam", name: "Nungambakkam", nameLocal: "நுங்கம்பாக்கம்", population: 250000, pincode: "600034" },
        { slug: "egmore", name: "Egmore", nameLocal: "எழும்பூர்", population: 180000, pincode: "600008" },
        { slug: "anna-nagar", name: "Anna Nagar", nameLocal: "அண்ணா நகர்", population: 380000, pincode: "600040" },
      ],
    },
    {
      slug: "chennai-west",
      name: "Chennai West",
      nameLocal: "மேற்கு சென்னை",
      tagline: "Industrial & Manufacturing Zone",
      population: 1188000,
      area: 100,
      villageCount: 0,
      villages: [
        { slug: "ambattur", name: "Ambattur", nameLocal: "அம்பத்தூர்", population: 450000, pincode: "600053" },
        { slug: "avadi", name: "Avadi", nameLocal: "ஆவடி", population: 380000, pincode: "600054" },
        { slug: "poonamallee", name: "Poonamallee", nameLocal: "பூந்தமல்லி", population: 220000, pincode: "600056" },
        { slug: "porur", name: "Porur", nameLocal: "போரூர்", population: 138000, pincode: "600116" },
      ],
    },
  ],
};

// ── Kolkata District ────────────────────────────────────────
const KOLKATA_DISTRICT: District = {
  slug: "kolkata",
  name: "Kolkata",
  nameLocal: "কলকাতা",
  tagline: "Cultural Capital of India",
  taglineLocal: "ভারতের সংস্কৃতি রাজধানী",
  active: true,
  badges: [
    { emoji: "🎭", label: "Cultural Capital of India" },
    { emoji: "🏆", label: "Nobel Laureate City" },
    { emoji: "🎊", label: "Durga Puja UNESCO Heritage" },
  ],
  population: 4496694,
  area: 205,
  talukCount: 4,
  villageCount: 0,
  literacy: 87.14,
  sexRatio: 908,
  taluks: [
    {
      slug: "kolkata-north",
      name: "North Kolkata",
      nameLocal: "উত্তর কলকাতা",
      tagline: "Heritage & Literature Hub",
      population: 1200000,
      area: 55,
      villageCount: 0,
      villages: [
        { slug: "shyambazar", name: "Shyambazar", nameLocal: "শ্যামবাজার", population: 180000, pincode: "700004" },
        { slug: "college-street", name: "College Street", nameLocal: "কলেজ স্ট্রিট", population: 120000, pincode: "700073" },
        { slug: "baranagar", name: "Baranagar", nameLocal: "বরানগর", population: 250000, pincode: "700036" },
        { slug: "dumdum", name: "Dum Dum", nameLocal: "দমদম", population: 320000, pincode: "700028" },
        { slug: "bagbazar", name: "Bagbazar", nameLocal: "বাগবাজার", population: 95000, pincode: "700003" },
      ],
    },
    {
      slug: "kolkata-south",
      name: "South Kolkata",
      nameLocal: "দক্ষিণ কলকাতা",
      tagline: "Modern & Residential Hub",
      population: 1400000,
      area: 60,
      villageCount: 0,
      villages: [
        { slug: "ballygunge", name: "Ballygunge", nameLocal: "বালিগঞ্জ", population: 280000, pincode: "700019" },
        { slug: "jadavpur", name: "Jadavpur", nameLocal: "যাদবপুর", population: 320000, pincode: "700032" },
        { slug: "tollygunge", name: "Tollygunge", nameLocal: "টালিগঞ্জ", population: 250000, pincode: "700033" },
        { slug: "garia", name: "Garia", nameLocal: "গড়িয়া", population: 280000, pincode: "700084" },
        { slug: "behala", name: "Behala", nameLocal: "বেহালা", population: 270000, pincode: "700034" },
      ],
    },
    {
      slug: "kolkata-central",
      name: "Central Kolkata",
      nameLocal: "মধ্য কলকাতা",
      tagline: "Commercial & Business Centre",
      population: 900000,
      area: 40,
      villageCount: 0,
      villages: [
        { slug: "esplanade", name: "Esplanade", nameLocal: "এসপ্ল্যানেড", population: 150000, pincode: "700069" },
        { slug: "park-street", name: "Park Street", nameLocal: "পার্ক স্ট্রিট", population: 180000, pincode: "700016" },
        { slug: "dalhousie", name: "Dalhousie / BBD Bagh", nameLocal: "ডালহৌসি / বি.বি.ডি বাগ", population: 95000, pincode: "700001" },
        { slug: "maidan", name: "Maidan Area", nameLocal: "ময়দান", population: 120000, pincode: "700021" },
      ],
    },
    {
      slug: "kolkata-east",
      name: "East Kolkata",
      nameLocal: "পূর্ব কলকাতা",
      tagline: "Wetlands & IT Corridor",
      population: 996694,
      area: 50,
      villageCount: 0,
      villages: [
        { slug: "salt-lake", name: "Salt Lake / Bidhannagar", nameLocal: "সল্ট লেক / বিধাননগর", population: 350000, pincode: "700091" },
        { slug: "new-town", name: "New Town / Rajarhat", nameLocal: "নিউ টাউন / রাজারহাট", population: 280000, pincode: "700156" },
        { slug: "em-bypass", name: "EM Bypass Area", nameLocal: "ই.এম বাইপাস", population: 220000, pincode: "700107" },
        { slug: "tangra", name: "Tangra", nameLocal: "ট্যাংরা", population: 146694, pincode: "700015" },
      ],
    },
  ],
};

// ── Lucknow District ────────────────────────────────────────
const LUCKNOW_DISTRICT: District = {
  slug: "lucknow",
  name: "Lucknow",
  nameLocal: "लखनऊ",
  tagline: "City of Nawabs",
  taglineLocal: "नवाबों का शहर",
  active: true,
  badges: [
    { emoji: "🏛️", label: "City of Nawabs" },
    { emoji: "🧵", label: "Chikankari Heritage" },
    { emoji: "🍢", label: "Kebab Capital" },
    { emoji: "🏛️", label: "State Capital of UP" },
  ],
  population: 4589838,
  area: 2528,
  talukCount: 4,
  villageCount: 823,
  literacy: 79.33,
  sexRatio: 917,
  taluks: [
    {
      slug: "lucknow-city",
      name: "Lucknow City",
      nameLocal: "लखनऊ शहर",
      tagline: "Nawabi Heritage & Governance Hub",
      population: 2800000,
      area: 350,
      villageCount: 0,
      villages: [
        { slug: "hazratganj", name: "Hazratganj", nameLocal: "हजरतगंज", population: 180000, pincode: "226001" },
        { slug: "aminabad", name: "Aminabad", nameLocal: "अमीनाबाद", population: 220000, pincode: "226018" },
        { slug: "charbagh", name: "Charbagh", nameLocal: "चारबाग", population: 350000, pincode: "226004" },
        { slug: "gomti-nagar", name: "Gomti Nagar", nameLocal: "गोमती नगर", population: 450000, pincode: "226010" },
        { slug: "aliganj", name: "Aliganj", nameLocal: "आलीगंज", population: 380000, pincode: "226024" },
      ],
    },
    {
      slug: "mohanlalganj",
      name: "Mohanlalganj",
      nameLocal: "मोहनलालगंज",
      tagline: "Agricultural Heartland",
      population: 680000,
      area: 720,
      villageCount: 310,
      villages: [
        { slug: "mohanlalganj-town", name: "Mohanlalganj", nameLocal: "मोहनलालगंज", population: 85000, pincode: "226301" },
        { slug: "gosainganj", name: "Gosainganj", nameLocal: "गोसाईंगंज", population: 65000, pincode: "226302" },
        { slug: "nigoha", name: "Nigoha", nameLocal: "निगोहा", population: 42000, pincode: "226303" },
      ],
    },
    {
      slug: "malihabad",
      name: "Malihabad",
      nameLocal: "मलिहाबाद",
      tagline: "Land of Dasheri Mangoes",
      population: 520000,
      area: 680,
      villageCount: 280,
      villages: [
        { slug: "malihabad-town", name: "Malihabad", nameLocal: "मलिहाबाद", population: 72000, pincode: "226102" },
        { slug: "kakori", name: "Kakori", nameLocal: "काकोरी", population: 95000, pincode: "226101" },
        { slug: "mall", name: "Mall", nameLocal: "मल्ल", population: 38000, pincode: "226104" },
      ],
    },
    {
      slug: "bakshi-ka-talab",
      name: "Bakshi Ka Talab",
      nameLocal: "बख्शी का तालाब",
      tagline: "Northern Gateway",
      population: 589838,
      area: 778,
      villageCount: 233,
      villages: [
        { slug: "bkt-town", name: "Bakshi Ka Talab", nameLocal: "बख्शी का तालाब", population: 120000, pincode: "226201" },
        { slug: "chinhat", name: "Chinhat", nameLocal: "चिनहट", population: 180000, pincode: "226028" },
        { slug: "itaunja", name: "Itaunja", nameLocal: "इटौंजा", population: 55000, pincode: "226202" },
      ],
    },
  ],
};

// ── Hyderabad District ──────────────────────────────────────
const HYDERABAD_DISTRICT: District = {
  slug: "hyderabad",
  name: "Hyderabad",
  nameLocal: "హైదరాబాద్",
  tagline: "City of Pearls",
  taglineLocal: "ముత్యాల నగరం",
  active: true,
  badges: [
    { emoji: "💎", label: "City of Pearls" },
    { emoji: "🧬", label: "Genome Valley" },
    { emoji: "🏰", label: "Nizam Heritage" },
    { emoji: "💻", label: "India's GCC Hub" },
    { emoji: "🍗", label: "Biryani Capital" },
  ],
  population: 4500000,
  area: 217,
  talukCount: 16,
  villageCount: 0,
  literacy: 83.25,
  sexRatio: 954,
  taluks: [
    {
      slug: "charminar", name: "Charminar", nameLocal: "చార్మినార్",
      tagline: "Icon of Hyderabad", population: 260000, area: 8, villageCount: 0,
      villages: [
        { slug: "charminar-area", name: "Charminar", nameLocal: "చార్మినార్", population: 85000, pincode: "500002" },
        { slug: "laad-bazaar", name: "Laad Bazaar", nameLocal: "లాడ్ బజార్", population: 60000, pincode: "500002" },
        { slug: "mecca-masjid", name: "Mecca Masjid Area", nameLocal: "మక్కా మసీదు", population: 55000, pincode: "500002" },
        { slug: "pathergatti", name: "Pathergatti", nameLocal: "పత్తర్ఘట్టి", population: 60000, pincode: "500002" },
      ],
    },
    {
      slug: "secunderabad", name: "Secunderabad", nameLocal: "సికింద్రాబాద్",
      tagline: "Twin City", population: 305000, area: 15, villageCount: 0,
      villages: [
        { slug: "secunderabad-junction", name: "Secunderabad Junction", nameLocal: "సికింద్రాబాద్ జంక్షన్", population: 95000, pincode: "500003" },
        { slug: "paradise", name: "Paradise", nameLocal: "పారడైజ్", population: 70000, pincode: "500003" },
        { slug: "trimulgherry", name: "Trimulgherry", nameLocal: "తిరుమల్ఘెర్రీ", population: 80000, pincode: "500015" },
        { slug: "rp-road", name: "RP Road", nameLocal: "ఆర్పీ రోడ్", population: 60000, pincode: "500003" },
      ],
    },
    {
      slug: "nampally", name: "Nampally", nameLocal: "నాంపల్లి",
      tagline: "Administrative Center", population: 245000, area: 11, villageCount: 0,
      villages: [
        { slug: "abids", name: "Abids", nameLocal: "అబిడ్స్", population: 65000, pincode: "500001" },
        { slug: "nampally-station", name: "Nampally Station", nameLocal: "నాంపల్లి స్టేషన్", population: 55000, pincode: "500001" },
        { slug: "public-gardens", name: "Public Gardens", nameLocal: "పబ్లిక్ గార్డెన్స్", population: 45000, pincode: "500004" },
        { slug: "mozamjahi-market", name: "Mozamjahi Market", nameLocal: "మొజాంజాహి మార్కెట్", population: 40000, pincode: "500001" },
      ],
    },
    {
      slug: "khairatabad", name: "Khairatabad", nameLocal: "ఖైరతాబాద్",
      tagline: "Legislative District", population: 210000, area: 9, villageCount: 0,
      villages: [
        { slug: "secretariat", name: "Secretariat", nameLocal: "సచివాలయం", population: 45000, pincode: "500004" },
        { slug: "lakdi-ka-pul", name: "Lakdi Ka Pul", nameLocal: "లకడీ కా పూల్", population: 55000, pincode: "500004" },
        { slug: "saifabad", name: "Saifabad", nameLocal: "సైఫాబాద్", population: 50000, pincode: "500004" },
        { slug: "ac-guards", name: "AC Guards", nameLocal: "ఏసీ గార్డ్స్", population: 60000, pincode: "500004" },
      ],
    },
    {
      slug: "amberpet", name: "Amberpet", nameLocal: "అంబర్‌పేట్",
      tagline: "Heart of Central Hyderabad", population: 320000, area: 12, villageCount: 0,
      villages: [
        { slug: "amberpet-centre", name: "Amberpet", nameLocal: "అంబర్‌పేట్", population: 100000, pincode: "500013" },
        { slug: "ramanthapur", name: "Ramanthapur", nameLocal: "రామంతపూర్", population: 85000, pincode: "500013" },
        { slug: "kacheguda", name: "Kacheguda", nameLocal: "కాచిగూడ", population: 75000, pincode: "500027" },
        { slug: "vidyanagar", name: "Vidyanagar", nameLocal: "విద్యానగర్", population: 60000, pincode: "500044" },
      ],
    },
    {
      slug: "asifnagar", name: "Asifnagar", nameLocal: "ఆసిఫ్‌నగర్",
      tagline: "Old City Gateway", population: 280000, area: 15, villageCount: 0,
      villages: [
        { slug: "mehdipatnam", name: "Mehdipatnam", nameLocal: "మెహదీపట్నం", population: 95000, pincode: "500028" },
        { slug: "masab-tank", name: "Masab Tank", nameLocal: "మసబ్ ట్యాంక్", population: 65000, pincode: "500028" },
        { slug: "rethibowli", name: "Rethibowli", nameLocal: "రేతిబౌలి", population: 70000, pincode: "500028" },
      ],
    },
    {
      slug: "bahadurpura", name: "Bahadurpura", nameLocal: "బహదూర్‌పురా",
      tagline: "Historic Old City", population: 468000, area: 22, villageCount: 0,
      villages: [
        { slug: "falaknuma", name: "Falaknuma", nameLocal: "ఫలక్‌నుమా", population: 120000, pincode: "500053" },
        { slug: "chandrayangutta", name: "Chandrayangutta", nameLocal: "చంద్రాయణగుట్ట", population: 150000, pincode: "500005" },
        { slug: "bahadurpura-centre", name: "Bahadurpura", nameLocal: "బహదూర్‌పురా", population: 100000, pincode: "500064" },
        { slug: "yakutpura", name: "Yakutpura", nameLocal: "యాకుత్‌పురా", population: 98000, pincode: "500023" },
      ],
    },
    {
      slug: "bandlaguda", name: "Bandlaguda", nameLocal: "బండ్లగూడ",
      tagline: "Southern Growth Corridor", population: 350000, area: 30, villageCount: 0,
      villages: [
        { slug: "bandlaguda-centre", name: "Bandlaguda", nameLocal: "బండ్లగూడ", population: 120000, pincode: "500005" },
        { slug: "sagar-road", name: "Sagar Road", nameLocal: "సాగర్ రోడ్", population: 110000, pincode: "500058" },
        { slug: "katedan", name: "Katedan", nameLocal: "కాటేదాన్", population: 120000, pincode: "500077" },
      ],
    },
    {
      slug: "golkonda", name: "Golkonda", nameLocal: "గోల్కొండ",
      tagline: "Fort of Diamonds", population: 310000, area: 20, villageCount: 0,
      villages: [
        { slug: "golkonda-fort", name: "Golkonda Fort", nameLocal: "గోల్కొండ కోట", population: 80000, pincode: "500008" },
        { slug: "langar-houz", name: "Langar Houz", nameLocal: "లంగర్ హౌజ్", population: 95000, pincode: "500008" },
        { slug: "toli-chowki", name: "Toli Chowki", nameLocal: "తోలి చౌకి", population: 85000, pincode: "500008" },
      ],
    },
    {
      slug: "himayatnagar", name: "Himayatnagar", nameLocal: "హిమాయత్‌నగర్",
      tagline: "Commercial Hub", population: 220000, area: 10, villageCount: 0,
      villages: [
        { slug: "himayatnagar-centre", name: "Himayatnagar", nameLocal: "హిమాయత్‌నగర్", population: 75000, pincode: "500029" },
        { slug: "narayanguda", name: "Narayanguda", nameLocal: "నారాయణగూడ", population: 80000, pincode: "500029" },
        { slug: "domalguda", name: "Domalguda", nameLocal: "దొమలగూడ", population: 65000, pincode: "500029" },
      ],
    },
    {
      slug: "musheerabad", name: "Musheerabad", nameLocal: "ముషీరాబాద్",
      tagline: "Cultural Crossroads", population: 295000, area: 14, villageCount: 0,
      villages: [
        { slug: "musheerabad-centre", name: "Musheerabad", nameLocal: "ముషీరాబాద్", population: 90000, pincode: "500048" },
        { slug: "gandhi-nagar", name: "Gandhi Nagar", nameLocal: "గాంధీ నగర్", population: 85000, pincode: "500080" },
        { slug: "bholakpur", name: "Bholakpur", nameLocal: "భోలక్‌పూర్", population: 70000, pincode: "500010" },
      ],
    },
    {
      slug: "saidabad", name: "Saidabad", nameLocal: "సాయిదాబాద్",
      tagline: "Musi River Banks", population: 275000, area: 16, villageCount: 0,
      villages: [
        { slug: "saidabad-centre", name: "Saidabad", nameLocal: "సాయిదాబాద్", population: 90000, pincode: "500059" },
        { slug: "malakpet", name: "Malakpet", nameLocal: "మలక్‌పేట్", population: 95000, pincode: "500036" },
        { slug: "chaderghat", name: "Chaderghat", nameLocal: "చాదర్‌ఘాట్", population: 90000, pincode: "500024" },
      ],
    },
    {
      slug: "ameerpet", name: "Ameerpet", nameLocal: "అమీర్‌పేట్",
      tagline: "Coaching Hub of India", population: 59000, area: 4, villageCount: 0,
      villages: [
        { slug: "ameerpet-centre", name: "Ameerpet", nameLocal: "అమీర్‌పేట్", population: 30000, pincode: "500016" },
        { slug: "sr-nagar", name: "SR Nagar", nameLocal: "ఎస్ఆర్ నగర్", population: 29000, pincode: "500038" },
      ],
    },
    {
      slug: "tirumalagiri", name: "Tirumalagiri", nameLocal: "తిరుమలగిరి",
      tagline: "Cantonment Heritage", population: 180000, area: 12, villageCount: 0,
      villages: [
        { slug: "tirumalagiri-centre", name: "Tirumalagiri", nameLocal: "తిరుమలగిరి", population: 60000, pincode: "500015" },
        { slug: "karkhana", name: "Karkhana", nameLocal: "కార్ఖానా", population: 65000, pincode: "500009" },
        { slug: "picket", name: "Picket", nameLocal: "పికెట్", population: 55000, pincode: "500026" },
      ],
    },
    {
      slug: "maredpally", name: "Maredpally", nameLocal: "మారేడ్‌పల్లి",
      tagline: "Secunderabad Core", population: 195000, area: 10, villageCount: 0,
      villages: [
        { slug: "maredpally-centre", name: "Maredpally", nameLocal: "మారేడ్‌పల్లి", population: 70000, pincode: "500026" },
        { slug: "lalaguda", name: "Lalaguda", nameLocal: "లాలాగూడ", population: 65000, pincode: "500017" },
        { slug: "padmarao-nagar", name: "Padmarao Nagar", nameLocal: "పద్మారావ్ నగర్", population: 60000, pincode: "500025" },
      ],
    },
    {
      slug: "shaikpet", name: "Shaikpet", nameLocal: "షైక్‌పేట్",
      tagline: "HITEC City Gateway", population: 230000, area: 18, villageCount: 0,
      villages: [
        { slug: "shaikpet-centre", name: "Shaikpet", nameLocal: "షైక్‌పేట్", population: 75000, pincode: "500008" },
        { slug: "tolichowki", name: "Tolichowki", nameLocal: "తోలిచౌకి", population: 80000, pincode: "500008" },
        { slug: "film-nagar", name: "Film Nagar", nameLocal: "ఫిల్మ్ నగర్", population: 75000, pincode: "500008" },
      ],
    },
  ],
};

// ── Dima Hasao District ──────────────────────────────────
const DIMA_HASAO_DISTRICT: District = {
  slug: "dima-hasao",
  name: "Dima Hasao",
  nameLocal: "ডিমা হাছাও",
  tagline: "The Land of Blue Hills",
  taglineLocal: "The Land of Blue Hills",
  active: true,
  badges: [
    { emoji: "⛰️", label: "Land of Blue Hills" },
    { emoji: "🐦", label: "Jatinga Bird Sanctuary" },
    { emoji: "🌿", label: "Organic Horticulture" },
    { emoji: "⛳", label: "Umrangso Golf Course" },
    { emoji: "🏭", label: "Cement Manufacturing Hub" },
  ],
  population: 214102,
  area: 4888,
  talukCount: 4,
  villageCount: 695,
  literacy: 77.54,
  sexRatio: 933,
  taluks: [
    {
      slug: "haflong",
      name: "Haflong",
      nameLocal: "হাফলং",
      tagline: "Switzerland of the East",
      population: 85000,
      area: 1200,
      villages: [
        { slug: "haflong-town", name: "Haflong Town", nameLocal: "হাফলং টাউন", population: 45000, pincode: "788819" },
        { slug: "jatinga", name: "Jatinga", nameLocal: "জাতিঙ্গা", population: 8000, pincode: "788820" },
      ]
    },
    {
      slug: "mahur",
      name: "Mahur",
      nameLocal: "মাহুৰ",
      tagline: "Gateway to the Hills",
      population: 45000,
      area: 1100,
      villages: [
        { slug: "mahur-town", name: "Mahur Town", nameLocal: "মাহুৰ টাউন", population: 15000, pincode: "788830" },
      ]
    },
    {
      slug: "maibong",
      name: "Maibong",
      nameLocal: "মাইবং",
      tagline: "Historic Dimasa Capital",
      population: 50000,
      area: 1300,
      villages: [
        { slug: "maibong-town", name: "Maibong Town", nameLocal: "মাইবং টাউন", population: 20000, pincode: "788831" },
      ]
    },
    {
      slug: "umrangso",
      name: "Umrangso",
      nameLocal: "উমৰাংছু",
      tagline: "Industrial and Hydel Hub",
      population: 34102,
      area: 1288,
      villages: [
        { slug: "umrangso-town", name: "Umrangso Town", nameLocal: "উমৰাংছু টাউন", population: 18000, pincode: "788832" },
      ]
    }
  ]
};

// ── Helper to create a locked district ───────────────────
function lockedDistrict(slug: string, name: string): District {
  return { slug, name, nameLocal: name, active: false, taluks: [] };
}


// ── All 36 States + UTs ───────────────────────────────────
export const INDIA_STATES: State[] = [
  // ── Active ──────────────────────────────────────────────
  {
    slug: "karnataka",
    name: "Karnataka",
    nameLocal: "ಕರ್ನಾಟಕ",
    active: true,
    capital: "Bengaluru",
    type: "state",
    districts: KARNATAKA_DISTRICTS,
  },

  // ── States — Coming Soon ─────────────────────────────────
  {
    slug: "andhra-pradesh", name: "Andhra Pradesh", nameLocal: "ఆంధ్రప్రదేశ్",
    active: false, capital: "Amaravati", type: "state",
    districts: [
      lockedDistrict("visakhapatnam", "Visakhapatnam"),
      lockedDistrict("vijayawada", "Vijayawada"),
      lockedDistrict("tirupati", "Tirupati"),
      lockedDistrict("guntur", "Guntur"),
      lockedDistrict("kurnool", "Kurnool"),
    ],
  },
  {
    slug: "telangana", name: "Telangana", nameLocal: "తెలంగాణ",
    active: true, capital: "Hyderabad", type: "state",
    districts: [
      HYDERABAD_DISTRICT,
      lockedDistrict("warangal", "Warangal"),
      lockedDistrict("nizamabad", "Nizamabad"),
      lockedDistrict("karimnagar", "Karimnagar"),
      lockedDistrict("khammam", "Khammam"),
    ],
  },
  {
    slug: "tamil-nadu", name: "Tamil Nadu", nameLocal: "தமிழ்நாடு",
    active: true, capital: "Chennai", type: "state",
    districts: [
      CHENNAI_DISTRICT,
      lockedDistrict("coimbatore", "Coimbatore"),
      lockedDistrict("madurai", "Madurai"),
      lockedDistrict("tiruchirappalli", "Tiruchirappalli"),
      lockedDistrict("salem", "Salem"),
    ],
  },
  {
    slug: "kerala", name: "Kerala", nameLocal: "കേരളം",
    active: false, capital: "Thiruvananthapuram", type: "state",
    districts: [
      lockedDistrict("thiruvananthapuram", "Thiruvananthapuram"),
      lockedDistrict("kochi", "Ernakulam"),
      lockedDistrict("kozhikode", "Kozhikode"),
      lockedDistrict("thrissur", "Thrissur"),
      lockedDistrict("malappuram", "Malappuram"),
    ],
  },
  {
    slug: "maharashtra", name: "Maharashtra", nameLocal: "महाराष्ट्र",
    active: true, capital: "Mumbai", type: "state",
    districts: [
      MUMBAI_DISTRICT,
      // Pune — active stub. Content (leaders, modules, hero) comes from DB
      // via Prompts 2–5 of Pune #10 rollout. Fields populated here are only
      // those the District TS interface requires.
      {
        slug: "pune", name: "Pune", nameLocal: "पुणे",
        tagline: "Oxford of the East",
        active: true,
        badges: [
          { emoji: "🎓", label: "Education Hub of India" },
          { emoji: "🏍️", label: "Detroit of India" },
          { emoji: "💻", label: "IT Corridor — Hinjawadi" },
          { emoji: "🎭", label: "Cultural Capital of Maharashtra" },
        ],
        population: 9426959,
        area: 15643,
        talukCount: 14,
        villageCount: 1866,
        literacy: 87.19,
        sexRatio: 915,
        // Pune district has 14 talukas per pune.gov.in administrative setup.
        // Maharashtra calls them "तालुका" (Taluka) — see state-config.ts.
        taluks: [
          { slug: "haveli", name: "Haveli", nameLocal: "हवेली" },
          { slug: "pune-city", name: "Pune City", nameLocal: "पुणे शहर" },
          { slug: "khed", name: "Khed", nameLocal: "खेड" },
          { slug: "maval", name: "Maval", nameLocal: "मावळ" },
          { slug: "mulshi", name: "Mulshi", nameLocal: "मुळशी" },
          { slug: "bhor", name: "Bhor", nameLocal: "भोर" },
          { slug: "velhe", name: "Velhe", nameLocal: "वेल्हे" },
          { slug: "junnar", name: "Junnar", nameLocal: "जुन्नर" },
          { slug: "ambegaon", name: "Ambegaon", nameLocal: "आंबेगाव" },
          { slug: "shirur", name: "Shirur", nameLocal: "शिरूर" },
          { slug: "daund", name: "Daund", nameLocal: "दौंड" },
          { slug: "indapur", name: "Indapur", nameLocal: "इंदापूर" },
          { slug: "baramati", name: "Baramati", nameLocal: "बारामती" },
          { slug: "purandar", name: "Purandar", nameLocal: "पुरंदर" },
        ],
      },
      lockedDistrict("nagpur", "Nagpur"),
      lockedDistrict("nashik", "Nashik"),
      lockedDistrict("chhatrapati-sambhajinagar", "Chhatrapati Sambhajinagar"),
    ],
  },
  {
    slug: "gujarat", name: "Gujarat", nameLocal: "ગુજરાત",
    active: false, capital: "Gandhinagar", type: "state",
    districts: [
      lockedDistrict("ahmedabad", "Ahmedabad"),
      lockedDistrict("surat", "Surat"),
      lockedDistrict("vadodara", "Vadodara"),
      lockedDistrict("rajkot", "Rajkot"),
      lockedDistrict("gandhinagar", "Gandhinagar"),
    ],
  },
  {
    slug: "rajasthan", name: "Rajasthan", nameLocal: "राजस्थान",
    active: false, capital: "Jaipur", type: "state",
    districts: [
      lockedDistrict("jaipur", "Jaipur"),
      lockedDistrict("jodhpur", "Jodhpur"),
      lockedDistrict("udaipur", "Udaipur"),
      lockedDistrict("kota", "Kota"),
      lockedDistrict("ajmer", "Ajmer"),
    ],
  },
  {
    slug: "madhya-pradesh", name: "Madhya Pradesh", nameLocal: "मध्य प्रदेश",
    active: false, capital: "Bhopal", type: "state",
    districts: [
      lockedDistrict("bhopal", "Bhopal"),
      lockedDistrict("indore", "Indore"),
      lockedDistrict("jabalpur", "Jabalpur"),
      lockedDistrict("gwalior", "Gwalior"),
      lockedDistrict("ujjain", "Ujjain"),
    ],
  },
  {
    slug: "uttar-pradesh", name: "Uttar Pradesh", nameLocal: "उत्तर प्रदेश",
    active: true, capital: "Lucknow", type: "state",
    districts: [
      LUCKNOW_DISTRICT,
      lockedDistrict("kanpur", "Kanpur"),
      lockedDistrict("agra", "Agra"),
      lockedDistrict("varanasi", "Varanasi"),
      lockedDistrict("meerut", "Meerut"),
    ],
  },
  {
    slug: "bihar", name: "Bihar", nameLocal: "बिहार",
    active: false, capital: "Patna", type: "state",
    districts: [
      lockedDistrict("patna", "Patna"),
      lockedDistrict("gaya", "Gaya"),
      lockedDistrict("bhagalpur", "Bhagalpur"),
      lockedDistrict("muzaffarpur", "Muzaffarpur"),
      lockedDistrict("darbhanga", "Darbhanga"),
    ],
  },
  {
    slug: "west-bengal", name: "West Bengal", nameLocal: "পশ্চিমবঙ্গ",
    active: true, capital: "Kolkata", type: "state",
    districts: [
      KOLKATA_DISTRICT,
      lockedDistrict("howrah", "Howrah"),
      lockedDistrict("darjeeling", "Darjeeling"),
      lockedDistrict("murshidabad", "Murshidabad"),
      lockedDistrict("bardhaman", "Bardhaman"),
    ],
  },
  {
    slug: "odisha", name: "Odisha", nameLocal: "ଓଡ଼ିଶା",
    active: false, capital: "Bhubaneswar", type: "state",
    districts: [
      lockedDistrict("bhubaneswar", "Khordha"),
      lockedDistrict("cuttack", "Cuttack"),
      lockedDistrict("puri", "Puri"),
      lockedDistrict("sambalpur", "Sambalpur"),
    ],
  },
  {
    slug: "punjab", name: "Punjab", nameLocal: "ਪੰਜਾਬ",
    active: false, capital: "Chandigarh", type: "state",
    districts: [
      lockedDistrict("ludhiana", "Ludhiana"),
      lockedDistrict("amritsar", "Amritsar"),
      lockedDistrict("jalandhar", "Jalandhar"),
      lockedDistrict("patiala", "Patiala"),
    ],
  },
  {
    slug: "haryana", name: "Haryana", nameLocal: "हरियाणा",
    active: false, capital: "Chandigarh", type: "state",
    districts: [
      lockedDistrict("gurugram", "Gurugram"),
      lockedDistrict("faridabad", "Faridabad"),
      lockedDistrict("ambala", "Ambala"),
      lockedDistrict("rohtak", "Rohtak"),
    ],
  },
  {
    slug: "himachal-pradesh", name: "Himachal Pradesh", nameLocal: "हिमाचल प्रदेश",
    active: false, capital: "Shimla", type: "state",
    districts: [
      lockedDistrict("shimla", "Shimla"),
      lockedDistrict("kangra", "Kangra"),
      lockedDistrict("mandi", "Mandi"),
    ],
  },
  {
    slug: "uttarakhand", name: "Uttarakhand", nameLocal: "उत्तराखंड",
    active: false, capital: "Dehradun", type: "state",
    districts: [
      lockedDistrict("dehradun", "Dehradun"),
      lockedDistrict("haridwar", "Haridwar"),
      lockedDistrict("nainital", "Nainital"),
    ],
  },
  {
    slug: "jharkhand", name: "Jharkhand", nameLocal: "झारखंड",
    active: false, capital: "Ranchi", type: "state",
    districts: [
      lockedDistrict("ranchi", "Ranchi"),
      lockedDistrict("dhanbad", "Dhanbad"),
      lockedDistrict("jamshedpur", "East Singhbhum"),
    ],
  },
  {
    slug: "chhattisgarh", name: "Chhattisgarh", nameLocal: "छत्तीसगढ़",
    active: false, capital: "Raipur", type: "state",
    districts: [
      lockedDistrict("raipur", "Raipur"),
      lockedDistrict("bilaspur", "Bilaspur"),
      lockedDistrict("durg", "Durg"),
    ],
  },
  {
    slug: "assam", name: "Assam", nameLocal: "অসম",
    active: true, capital: "Dispur", type: "state",
    districts: [
      DIMA_HASAO_DISTRICT,
      lockedDistrict("guwahati", "Kamrup Metro"),
      lockedDistrict("dibrugarh", "Dibrugarh"),
      lockedDistrict("jorhat", "Jorhat"),
      lockedDistrict("bajali", "Bajali"),
      lockedDistrict("baksa", "Baksa"),
      lockedDistrict("barpeta", "Barpeta"),
      lockedDistrict("biswanath", "Biswanath"),
      lockedDistrict("bongaigaon", "Bongaigaon"),
      lockedDistrict("cachar", "Cachar"),
      lockedDistrict("charaideo", "Charaideo"),
      lockedDistrict("chirang", "Chirang"),
      lockedDistrict("darrang", "Darrang"),
      lockedDistrict("dhemaji", "Dhemaji"),
      lockedDistrict("dhubri", "Dhubri"),
      lockedDistrict("goalpara", "Goalpara"),
      lockedDistrict("golaghat", "Golaghat"),
      lockedDistrict("hailakandi", "Hailakandi"),
      lockedDistrict("hojai", "Hojai"),
      lockedDistrict("kamrup", "Kamrup Rural"),
      lockedDistrict("karbi-anglong", "Karbi Anglong"),
      lockedDistrict("karimganj", "Karimganj"),
      lockedDistrict("kokrajhar", "Kokrajhar"),
      lockedDistrict("lakhimpur", "Lakhimpur"),
      lockedDistrict("majuli", "Majuli"),
      lockedDistrict("morigaon", "Morigaon"),
      lockedDistrict("nagaon", "Nagaon"),
      lockedDistrict("nalbari", "Nalbari"),
      lockedDistrict("sivasagar", "Sivasagar"),
      lockedDistrict("sonitpur", "Sonitpur"),
      lockedDistrict("south-salmara-mankachar", "South Salmara-Mankachar"),
      lockedDistrict("tinsukia", "Tinsukia"),
      lockedDistrict("udalguri", "Udalguri"),
      lockedDistrict("west-karbi-anglong", "West Karbi Anglong"),
      lockedDistrict("tamulpur", "Tamulpur"),
    ],
  },

  {
    slug: "goa", name: "Goa", nameLocal: "गोंय",
    active: false, capital: "Panaji", type: "state",
    districts: [
      lockedDistrict("north-goa", "North Goa"),
      lockedDistrict("south-goa", "South Goa"),
    ],
  },
  {
    slug: "arunachal-pradesh", name: "Arunachal Pradesh", nameLocal: "অৰুণাচল প্ৰদেশ",
    active: false, capital: "Itanagar", type: "state",
    districts: [
      lockedDistrict("itanagar", "Papum Pare"),
      lockedDistrict("tawang", "Tawang"),
    ],
  },
  {
    slug: "manipur", name: "Manipur", nameLocal: "মণিপুর",
    active: false, capital: "Imphal", type: "state",
    districts: [lockedDistrict("imphal-west", "Imphal West"), lockedDistrict("imphal-east", "Imphal East")],
  },
  {
    slug: "meghalaya", name: "Meghalaya", nameLocal: "মেঘালয়",
    active: false, capital: "Shillong", type: "state",
    districts: [lockedDistrict("east-khasi-hills", "East Khasi Hills"), lockedDistrict("ri-bhoi", "Ri Bhoi")],
  },
  {
    slug: "mizoram", name: "Mizoram", nameLocal: "Mizoram",
    active: false, capital: "Aizawl", type: "state",
    districts: [lockedDistrict("aizawl", "Aizawl"), lockedDistrict("lunglei", "Lunglei")],
  },
  {
    slug: "nagaland", name: "Nagaland", nameLocal: "Nagaland",
    active: false, capital: "Kohima", type: "state",
    districts: [lockedDistrict("kohima", "Kohima"), lockedDistrict("dimapur", "Dimapur")],
  },
  {
    slug: "sikkim", name: "Sikkim", nameLocal: "Sikkim",
    active: false, capital: "Gangtok", type: "state",
    districts: [lockedDistrict("gangtok", "East Sikkim"), lockedDistrict("gyalshing", "West Sikkim")],
  },
  {
    slug: "tripura", name: "Tripura", nameLocal: "ত্রিপুরা",
    active: false, capital: "Agartala", type: "state",
    districts: [lockedDistrict("west-tripura", "West Tripura"), lockedDistrict("gomati", "Gomati")],
  },

  // ── Union Territories ────────────────────────────────────
  {
    slug: "delhi", name: "Delhi", nameLocal: "दिल्ली",
    active: true, capital: "New Delhi", type: "ut",
    districts: [
      NEW_DELHI_DISTRICT,
      { slug: "central-delhi", name: "Central Delhi", nameLocal: "मध्य दिल्ली", active: false, taluks: [] },
      { slug: "north-delhi", name: "North Delhi", nameLocal: "उत्तर दिल्ली", active: false, taluks: [] },
      { slug: "north-west-delhi", name: "North West Delhi", nameLocal: "उत्तर पश्चिम दिल्ली", active: false, taluks: [] },
      { slug: "north-east-delhi", name: "North East Delhi", nameLocal: "उत्तर पूर्व दिल्ली", active: false, taluks: [] },
      { slug: "east-delhi", name: "East Delhi", nameLocal: "पूर्व दिल्ली", active: false, taluks: [] },
      { slug: "south-delhi", name: "South Delhi", nameLocal: "दक्षिण दिल्ली", active: false, taluks: [] },
      { slug: "south-west-delhi", name: "South West Delhi", nameLocal: "दक्षिण पश्चिम दिल्ली", active: false, taluks: [] },
      { slug: "south-east-delhi", name: "South East Delhi", nameLocal: "दक्षिण पूर्व दिल्ली", active: false, taluks: [] },
      { slug: "west-delhi", name: "West Delhi", nameLocal: "पश्चिम दिल्ली", active: false, taluks: [] },
      { slug: "shahdara", name: "Shahdara", nameLocal: "शाहदरा", active: false, taluks: [] },
    ],
  },
  {
    slug: "jammu-kashmir", name: "Jammu & Kashmir", nameLocal: "جموں و کشمیر",
    active: false, capital: "Srinagar / Jammu", type: "ut",
    districts: [lockedDistrict("srinagar", "Srinagar"), lockedDistrict("jammu", "Jammu")],
  },
  {
    slug: "ladakh", name: "Ladakh", nameLocal: "Ladakh",
    active: false, capital: "Leh", type: "ut",
    districts: [lockedDistrict("leh", "Leh"), lockedDistrict("kargil", "Kargil")],
  },
  {
    slug: "puducherry", name: "Puducherry", nameLocal: "புதுச்சேரி",
    active: false, capital: "Puducherry", type: "ut",
    districts: [lockedDistrict("puducherry", "Puducherry"), lockedDistrict("karaikal", "Karaikal")],
  },
  {
    slug: "chandigarh", name: "Chandigarh", nameLocal: "ਚੰਡੀਗੜ੍ਹ",
    active: false, capital: "Chandigarh", type: "ut",
    districts: [lockedDistrict("chandigarh", "Chandigarh")],
  },
  {
    slug: "andaman-nicobar", name: "Andaman & Nicobar", nameLocal: "Andaman & Nicobar",
    active: false, capital: "Port Blair", type: "ut",
    districts: [lockedDistrict("south-andaman", "South Andaman"), lockedDistrict("north-middle-andaman", "N & M Andaman")],
  },
  {
    slug: "lakshadweep", name: "Lakshadweep", nameLocal: "Lakshadweep",
    active: false, capital: "Kavaratti", type: "ut",
    districts: [lockedDistrict("lakshadweep", "Lakshadweep")],
  },
  {
    slug: "dadra-nagar-haveli", name: "Dadra & Nagar Haveli and Daman & Diu", nameLocal: "Dadra & NH-DD",
    active: false, capital: "Daman", type: "ut",
    districts: [lockedDistrict("daman", "Daman"), lockedDistrict("dadra", "Dadra & NH")],
  },
];

// ── Lookup helpers ────────────────────────────────────────
export function getState(stateSlug: string): State | undefined {
  return INDIA_STATES.find((s) => s.slug === stateSlug);
}

export function getDistrict(
  stateSlug: string,
  districtSlug: string
): District | undefined {
  return getState(stateSlug)?.districts.find((d) => d.slug === districtSlug);
}

export function getTaluk(
  stateSlug: string,
  districtSlug: string,
  talukSlug: string
): Taluk | undefined {
  return getDistrict(stateSlug, districtSlug)?.taluks.find(
    (t) => t.slug === talukSlug
  );
}

export function getActiveDistrict(
  stateSlug: string
): District | undefined {
  return getState(stateSlug)?.districts.find((d) => d.active);
}

export function getActiveDistricts(stateSlug: string): District[] {
  return getState(stateSlug)?.districts.filter((d) => d.active) ?? [];
}

/**
 * Total count of active districts across all states.
 * Use this instead of hardcoding "9 active districts" anywhere in the UI —
 * the number changes as new districts go live.
 */
export function getTotalActiveDistrictCount(): number {
  return INDIA_STATES.reduce(
    (sum, s) => sum + s.districts.filter((d) => d.active).length,
    0,
  );
}

/**
 * Count of states with at least one active district.
 * For support-page copy ("across N states").
 */
export function getActiveStateCount(): number {
  return INDIA_STATES.filter((s) => s.districts.some((d) => d.active)).length;
}

// Pilot district constants
export const PILOT_STATE = "karnataka";
export const PILOT_DISTRICT = "mandya";
