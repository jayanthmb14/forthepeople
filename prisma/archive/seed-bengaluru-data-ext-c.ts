// ═══════════════════════════════════════════════════════════
// Bengaluru Urban — Extended Data Part C
// Weather · Crop Prices · Schemes · Service Guides
// JJM · Housing · Power · RTI Templates · Citizen Tips
// Run standalone: npx tsx prisma/seed-bengaluru-data-ext-c.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { exitUnlessLocalSeedAllowed } from "../seed-guard";

// ARCHIVED (prisma/archive/README.md): this seed wipes tables or writes
// invented demo rows. It refuses to run unless ALLOW_SEED_WIPE=1 and the
// database is on this machine.
exitUnlessLocalSeedAllowed();

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedBengaluruDataExtC(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n🌧️  [Ext-C] Bengaluru — Weather, Crops, Schemes, JJM, Power, RTI, Tips...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const bu = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
    });
    const did = bu.id;

    const tN = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-north" } } });
    const tS = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-south" } } });
    const tE = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-east"  } } });
    const tA = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "anekal"          } } });

    // ── 1. Rainfall History (24 months: 2023 + 2024) ─────────
    const existingRain = await client.rainfallHistory.count({ where: { districtId: did } });
    if (existingRain === 0) {
      await client.rainfallHistory.createMany({ data: [
        // 2023 — normal year (actual Bengaluru figures)
        { districtId: did, year: 2023, month: 1,  rainfall:  5.2, normal:  5.8,  departure: -10.3, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 2,  rainfall:  3.8, normal:  5.0,  departure: -24.0, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 3,  rainfall: 12.4, normal: 12.2,  departure:   1.6, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 4,  rainfall: 42.8, normal: 42.0,  departure:   1.9, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 5,  rainfall: 118.6,normal:110.8,  departure:   7.0, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 6,  rainfall: 135.2,normal:108.4,  departure:  24.7, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 7,  rainfall: 128.4,normal:114.6,  departure:  12.0, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 8,  rainfall: 156.8,normal:128.2,  departure:  22.3, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 9,  rainfall: 198.4,normal:182.6,  departure:   8.6, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 10, rainfall: 162.2,normal:152.4,  departure:   6.4, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 11, rainfall: 48.6, normal: 44.2,  departure:   9.9, source: "IMD Bengaluru" },
        { districtId: did, year: 2023, month: 12, rainfall:  8.4, normal:  8.8,  departure:  -4.5, source: "IMD Bengaluru" },
        // 2024
        { districtId: did, year: 2024, month: 1,  rainfall:  6.0, normal:  5.8,  departure:   3.4, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 2,  rainfall:  4.2, normal:  5.0,  departure: -16.0, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 3,  rainfall: 14.8, normal: 12.2,  departure:  21.3, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 4,  rainfall: 52.4, normal: 42.0,  departure:  24.8, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 5,  rainfall: 128.6,normal:110.8,  departure:  16.1, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 6,  rainfall:  98.2,normal:108.4,  departure:  -9.4, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 7,  rainfall: 142.8,normal:114.6,  departure:  24.6, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 8,  rainfall: 145.6,normal:128.2,  departure:  13.6, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 9,  rainfall: 210.8,normal:182.6,  departure:  15.4, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 10, rainfall: 188.4,normal:152.4,  departure:  23.6, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 11, rainfall: 42.2, normal: 44.2,  departure:  -4.5, source: "IMD Bengaluru" },
        { districtId: did, year: 2024, month: 12, rainfall:  7.8, normal:  8.8,  departure: -11.4, source: "IMD Bengaluru" },
      ]});
      console.log("  ✓ 24 months rainfall history (2023–2024)");
    } else {
      console.log("  ↩ Rainfall history already seeded");
    }

    // Recent WeatherReadings
    const existingWR = await client.weatherReading.count({ where: { districtId: did } });
    if (existingWR === 0) {
      await client.weatherReading.createMany({ data: [
        { districtId: did, temperature: 28.4, feelsLike: 30.2, humidity: 68, windSpeed: 12, windDir: "SW", conditions: "Partly Cloudy", rainfall: 0,   pressure: 1012, source: "IMD", recordedAt: new Date("2025-03-01T08:30:00Z") },
        { districtId: did, temperature: 32.1, feelsLike: 35.8, humidity: 72, windSpeed: 8,  windDir: "W",  conditions: "Sunny",          rainfall: 0,   pressure: 1010, source: "IMD", recordedAt: new Date("2025-03-08T12:00:00Z") },
        { districtId: did, temperature: 26.8, feelsLike: 28.4, humidity: 80, windSpeed: 14, windDir: "SE", conditions: "Light Rain",      rainfall: 4.2, pressure: 1008, source: "IMD", recordedAt: new Date("2025-03-15T06:00:00Z") },
        { districtId: did, temperature: 24.6, feelsLike: 25.8, humidity: 82, windSpeed: 10, windDir: "S",  conditions: "Overcast",        rainfall: 0,   pressure: 1009, source: "IMD", recordedAt: new Date("2025-03-17T08:00:00Z") },
        { districtId: did, temperature: 27.2, feelsLike: 29.0, humidity: 74, windSpeed: 11, windDir: "SW", conditions: "Partly Cloudy",   rainfall: 0,   pressure: 1011, source: "IMD", recordedAt: new Date("2025-03-18T06:00:00Z") },
      ]});
      console.log("  ✓ 5 weather readings");
    } else {
      console.log("  ↩ Weather readings already seeded");
    }

    // ── 2. Crop Prices — KR Market, Bengaluru ────────────────
    const existingCP = await client.cropPrice.count({ where: { districtId: did } });
    if (existingCP === 0) {
      await client.cropPrice.createMany({ data: [
        { districtId: did, commodity: "Tomato",       variety: "Local",          market: "KR Market Bengaluru", minPrice: 800,  maxPrice: 1800, modalPrice: 1200, arrivalQty: 18000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Onion",        variety: "Bangalore Rose",  market: "KR Market Bengaluru", minPrice: 1200, maxPrice: 2000, modalPrice: 1600, arrivalQty: 22000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Potato",       variety: "Jyoti",           market: "KR Market Bengaluru", minPrice: 1400, maxPrice: 2200, modalPrice: 1800, arrivalQty: 15000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Beans",        variety: "Green",           market: "KR Market Bengaluru", minPrice: 2000, maxPrice: 4000, modalPrice: 3000, arrivalQty: 6000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Carrot",       variety: "Local Red",       market: "KR Market Bengaluru", minPrice: 1600, maxPrice: 2800, modalPrice: 2200, arrivalQty: 8000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Cabbage",      variety: "Local",           market: "KR Market Bengaluru", minPrice: 600,  maxPrice: 1200, modalPrice: 800,  arrivalQty: 9000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Coconut",      variety: "Medium",          market: "KR Market Bengaluru", minPrice: 1800, maxPrice: 3000, modalPrice: 2400, arrivalQty: 30000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Banana",       variety: "Yelakki",         market: "KR Market Bengaluru", minPrice: 2000, maxPrice: 3600, modalPrice: 3000, arrivalQty: 12000, date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Drumstick",    variety: "Local",           market: "KR Market Bengaluru", minPrice: 3000, maxPrice: 6000, modalPrice: 4500, arrivalQty: 3000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Marigold",     variety: "Bicolor",         market: "KR Market Bengaluru", minPrice: 2500, maxPrice: 5000, modalPrice: 3500, arrivalQty: 4000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Rose",         variety: "Red",             market: "KR Market Bengaluru", minPrice: 4000, maxPrice: 8000, modalPrice: 6000, arrivalQty: 2000,  date: new Date("2025-03-15"), source: "Agmarknet" },
        { districtId: did, commodity: "Ragi",         variety: "Local",           market: "KR Market Bengaluru", minPrice: 2800, maxPrice: 3800, modalPrice: 3200, arrivalQty: 5000,  date: new Date("2025-03-15"), source: "Agmarknet" },
      ]});
      console.log("  ✓ 12 crop prices (KR Market)");
    } else {
      console.log("  ↩ Crop prices already seeded");
    }

    // ── 3. Schemes (12) ──────────────────────────────────────
    const existingSch = await client.scheme.count({ where: { districtId: did } });
    if (existingSch === 0) {
      await client.scheme.createMany({ data: [
        { districtId: did, name: "Gruha Lakshmi",                   nameLocal: "ಗೃಹ ಲಕ್ಷ್ಮಿ",               category: "Social Welfare",  amount: 2000,     beneficiaryCount: 280000, eligibility: "Female head of household, BPL/APL card, 18+ years",           level: "State",   applyUrl: "sevasindhu.karnataka.gov.in",   active: true, source: "Dept of WCD Karnataka" },
        { districtId: did, name: "Shakti Free Bus Pass",            nameLocal: "ಶಕ್ತಿ ಉಚಿತ ಬಸ್ ಪಾಸ್",        category: "Transport",       amount: 0,        beneficiaryCount: 420000, eligibility: "All women for free travel on KSRTC/BMTC buses",               level: "State",   applyUrl: "ksrtc.karnataka.gov.in",        active: true, source: "Dept of Transport Karnataka" },
        { districtId: did, name: "Yuva Nidhi Unemployment Allowance",nameLocal: "ಯುವ ನಿಧಿ",                 category: "Employment",      amount: 3000,     beneficiaryCount: 95000,  eligibility: "Graduates 21-35 years, unemployed >6 months after graduation",  level: "State",   applyUrl: "sevasindhu.karnataka.gov.in",   active: true, source: "Dept of Labour Karnataka" },
        { districtId: did, name: "Anna Bhagya Free Rice Scheme",    nameLocal: "ಅನ್ನ ಭಾಗ್ಯ",                 category: "Food Security",   amount: 0,        beneficiaryCount: 680000, eligibility: "BPL ration card holders — 10 kg rice per person per month",    level: "State",   applyUrl: "ahara.kar.nic.in",              active: true, source: "Dept of Food Karnataka" },
        { districtId: did, name: "Aarogyasri Health Insurance",     nameLocal: "ಆರೋಗ್ಯಶ್ರೀ",                 category: "Health",          amount: 500000,   beneficiaryCount: 520000, eligibility: "BPL families — ₹5 lakh cashless treatment at empanelled hospitals", level: "State", applyUrl: "sast.kar.nic.in",               active: true, source: "Dept of Health Karnataka" },
        { districtId: did, name: "PM Awas Yojana Urban",            nameLocal: "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ ಯೋಜನೆ",  category: "Housing",         amount: 250000,   beneficiaryCount: 48000,  eligibility: "EWS/LIG households, no pucca house, first-time beneficiary",    level: "Central", applyUrl: "pmaymis.gov.in",                active: true, source: "MoHUA" },
        { districtId: did, name: "Vidyasiri Scholarship",           nameLocal: "ವಿದ್ಯಾಶ್ರೀ",                 category: "Education",       amount: 15000,    beneficiaryCount: 62000,  eligibility: "SC/ST students studying in Gr. 1-10 in Bengaluru govt schools", level: "State",   applyUrl: "scholarships.karnataka.gov.in", active: true, source: "Dept of SC/ST Welfare" },
        { districtId: did, name: "BBMP Encroachment Removal Compensation",nameLocal: "ಬಿಬಿಎಂಪಿ ಪರಿಹಾರ",    category: "Urban Welfare",   amount: 100000,   beneficiaryCount: 8400,   eligibility: "Identified slum dwellers displaced under BBMP projects",       level: "Local",   applyUrl: "bbmp.gov.in",                   active: true, source: "BBMP" },
        { districtId: did, name: "Startup Karnataka Seed Fund",     nameLocal: "ಸ್ಟಾರ್ಟಪ್ ಕರ್ನಾಟಕ",          category: "Industry",        amount: 2500000,  beneficiaryCount: 1200,   eligibility: "DPIIT-recognised startups registered in Karnataka <3 years",    level: "State",   applyUrl: "startup.karnataka.gov.in",      active: true, source: "Dept of IT/BT Karnataka" },
        { districtId: did, name: "MGNREGA Urban Bengaluru",         nameLocal: "ಮನರೇಗಾ ನಗರ",                category: "Employment",      amount: 0,        beneficiaryCount: 24000,  eligibility: "Job card holders in BBMP panchayat limits",                    level: "Central", applyUrl: "nrega.nic.in",                  active: true, source: "MGNREGA Cell Karnataka" },
        { districtId: did, name: "Vatsalya Child Support",          nameLocal: "ವಾತ್ಸಲ್ಯ",                  category: "Social Welfare",  amount: 1000,     beneficiaryCount: 18000,  eligibility: "Orphan/destitute children below 18 years in Bengaluru",        level: "State",   applyUrl: "dwcdkarnataka.gov.in",           active: true, source: "Dept of WCD Karnataka" },
        { districtId: did, name: "PM SVANidhi Micro-loan",          nameLocal: "ಸ್ವನಿಧಿ",                   category: "Livelihood",      amount: 10000,    beneficiaryCount: 32000,  eligibility: "Street vendors/hawkers with vending certificate",               level: "Central", applyUrl: "pmsvanidhi.mohua.gov.in",       active: true, source: "MoHUA" },
      ]});
      console.log("  ✓ 12 schemes");
    } else {
      console.log("  ↩ Schemes already seeded");
    }

    // ── 4. Service Guides (8) ─────────────────────────────────
    const existingSG = await client.serviceGuide.count({ where: { districtId: did } });
    if (existingSG === 0) {
      await client.serviceGuide.createMany({ data: [
        {
          districtId: did,
          serviceName: "Trade License (BBMP)",
          serviceNameLocal: "ವ್ಯಾಪಾರ ಪರವಾನಗಿ",
          category: "Business",
          office: "BBMP Ward Office",
          documentsNeeded: ["Aadhaar Card", "Pan Card", "Address Proof (Rental Agreement)", "Property Tax Receipt", "Affidavit (Rs.100 stamp paper)", "Passport Photo (2)"],
          fees: "₹500–₹5,000 depending on trade category",
          timeline: "7–15 working days",
          onlinePortal: "BBMP Sparsh Portal",
          onlineUrl: "https://bbmpsparsh.in",
          steps: ["Register on BBMP Sparsh portal", "Fill Trade License application form", "Upload all required documents", "Pay fees online", "Inspection by BBMP Health Officer", "Download license from portal"],
          tips: "Apply before June 30 each year for renewal; late fee applies after deadline",
          active: true,
        },
        {
          districtId: did,
          serviceName: "Khata Transfer (BBMP)",
          serviceNameLocal: "ಖಾತಾ ವರ್ಗಾವಣೆ",
          category: "Revenue",
          office: "BBMP ARO / Zone Office",
          documentsNeeded: ["Sale deed (registered)", "Previous Khata certificate", "Tax paid receipts", "Encumbrance Certificate (EC)", "Aadhaar of buyer", "Property sketch/map"],
          fees: "2% of property guideline value",
          timeline: "30–45 working days",
          onlinePortal: "BBMP Sakala Portal",
          onlineUrl: "https://bbmpsakala.karnataka.gov.in",
          steps: ["Collect sale deed from sub-registrar", "Apply online via BBMP Sakala portal", "Pay transfer fee (2% of guideline value)", "Submit physical copies at BBMP ARO office", "Await inspection and verification", "Collect Khata certificate"],
          tips: "Ensure EC is updated at sub-registrar office before applying; delays common if EC not updated",
          active: true,
        },
        {
          districtId: did,
          serviceName: "Building Plan Approval (BBMP)",
          serviceNameLocal: "ಕಟ್ಟಡ ನಕ್ಷೆ ಅನುಮೋದನೆ",
          category: "Construction",
          office: "BBMP Town Planning Department",
          documentsNeeded: ["Title deed / Sale deed", "Khata certificate & extract", "Survey sketch", "Building plan (by licensed architect)", "NOC from BWSSB, BESCOM, Fire Dept", "Soil test report"],
          fees: "Varies by built-up area — ₹50–₹500/sq ft",
          timeline: "30–60 working days",
          onlinePortal: "BBMP ODP Portal",
          onlineUrl: "https://bbmpodp.in",
          steps: ["Appoint a licensed architect", "Prepare building plan per BBMP bylaws", "Apply on BBMP ODP portal", "Pay fees and submit NOCs", "Site inspection by BBMP engineers", "Receive approval/sanction letter"],
          tips: "Plans exceeding 4 floors require additional clearance from BDA and Karnataka Fire Department",
          active: true,
        },
        {
          districtId: did,
          serviceName: "New Electricity Connection (BESCOM)",
          serviceNameLocal: "ಹೊಸ ವಿದ್ಯುತ್ ಸಂಪರ್ಕ",
          category: "Utilities",
          office: "BESCOM Sub-Division Office",
          documentsNeeded: ["Ownership proof (Khata/sale deed)", "Aadhaar Card", "Passport size photos (2)", "BBMP approved building plan (for commercial)", "Wiring completion certificate by licensed electrician"],
          fees: "LT domestic: ₹2,000–₹5,000 depending on load; HT connections higher",
          timeline: "7–15 working days",
          onlinePortal: "BESCOM Consumer Portal",
          onlineUrl: "https://bescom.karnataka.gov.in",
          steps: ["Apply online on BESCOM portal or visit sub-division office", "Submit documents and pay application fee", "BESCOM engineer inspection of premises", "Pay service connection charges", "Installation and meter reading begins"],
          tips: "Ensure internal wiring is complete before applying; BESCOM may reject if wiring isn't done",
          active: true,
        },
        {
          districtId: did,
          serviceName: "BWSSB Water Connection",
          serviceNameLocal: "ಬಿಡಬ್ಲ್ಯುಎಸ್‌ಎಸ್‌ಬಿ ನೀರಿನ ಸಂಪರ್ಕ",
          category: "Utilities",
          office: "BWSSB Divisional Office",
          documentsNeeded: ["Property ownership proof", "Khata extract", "Aadhaar of owner", "BBMP Tax paid receipt", "Building completion certificate"],
          fees: "₹5,000–₹25,000 based on pipe size; Rs.500 application fee",
          timeline: "15–30 working days",
          onlinePortal: "BWSSB Online Portal",
          onlineUrl: "https://bwssb.karnataka.gov.in",
          steps: ["Visit BWSSB divisional office or apply online", "Submit documents and pay application fee", "Site inspection by BWSSB engineer", "Estimate for connection charges issued", "Pay charges and schedule installation", "Connection provided and meter installed"],
          tips: "Areas beyond 5 km from existing mains may face longer delays; check feasibility first",
          active: true,
        },
        {
          districtId: did,
          serviceName: "Encumbrance Certificate (EC)",
          serviceNameLocal: "ಎನ್‌ಕಂಬ್ರೆನ್ಸ್ ಸರ್ಟಿಫಿಕೇಟ್",
          category: "Revenue",
          office: "Sub-Registrar Office",
          documentsNeeded: ["Property survey number / site number", "Aadhaar Card", "Application form (Form 22)"],
          fees: "₹35 per year of EC required; typically last 15 years = ₹525",
          timeline: "1–3 working days (online), 5–7 days (offline)",
          onlinePortal: "Kaveri Online Services",
          onlineUrl: "https://kaverionline.karnataka.gov.in",
          steps: ["Log on to Kaveri Online Services", "Select 'Encumbrance Certificate'", "Enter survey number, property details, period required", "Pay fees online (e-payment)", "Download Form 15 (nil EC) or Form 16 (with encumbrances)"],
          tips: "Always obtain EC for last 15 years before any property transaction; verify seller's identity against EC",
          active: true,
        },
        {
          districtId: did,
          serviceName: "Aadhaar Update / Address Change",
          serviceNameLocal: "ಆಧಾರ್ ವಿಳಾಸ ಬದಲಾವಣೆ",
          category: "Identity",
          office: "Aadhaar Enrolment Centre (BBMP / CSC)",
          documentsNeeded: ["Current Aadhaar card", "Address proof (utility bill / rent agreement / bank passbook)"],
          fees: "₹50 for demographic update; ₹100 for biometric update",
          timeline: "7–10 working days",
          onlinePortal: "UIDAI Self Service",
          onlineUrl: "https://myaadhaar.uidai.gov.in",
          steps: ["Visit nearest Aadhaar enrolment centre or use UIDAI portal", "Submit address proof documents", "Biometric verification if required", "Receive URN (Update Request Number)", "Track status on UIDAI portal", "Download updated Aadhaar after approval"],
          tips: "Online address update possible on myaadhaar.uidai.gov.in with OTP — no centre visit needed for address",
          active: true,
        },
        {
          districtId: did,
          serviceName: "Vehicle Registration Transfer (RTO)",
          serviceNameLocal: "ವಾಹನ ನೋಂದಣಿ ವರ್ಗಾವಣೆ",
          category: "Transport",
          office: "Regional Transport Office",
          documentsNeeded: ["RC Book (original)", "Form 29 + Form 30 (signed by buyer & seller)", "Valid insurance certificate", "Pollution Under Control (PUC) certificate", "Aadhaar of buyer", "Road Tax clearance"],
          fees: "2-9% of vehicle value depending on vehicle age and type",
          timeline: "15–30 working days",
          onlinePortal: "Parivahan Sewa",
          onlineUrl: "https://parivahan.gov.in",
          steps: ["Buyer & seller sign Form 29 and Form 30", "Seller files Form 28 (NOC from previous RTO if applicable)", "Apply on Parivahan portal or visit RTO", "Submit documents and pay transfer fees", "Inspection of vehicle at RTO if required", "New RC issued in buyer's name"],
          tips: "Ensure seller's loan (hypothecation) is cleared and NOC from bank obtained before transfer",
          active: true,
        },
      ]});
      console.log("  ✓ 8 service guides");
    } else {
      console.log("  ↩ Service guides already seeded");
    }

    // ── 5. JJM Status (4 taluks) ─────────────────────────────
    const existingJJM = await client.jJMStatus.count({ where: { districtId: did } });
    if (existingJJM === 0) {
      await client.jJMStatus.createMany({ data: [
        { districtId: did, talukId: tN.id, villageName: "Bengaluru North Taluk",  totalHouseholds: 820000, tapConnections: 754400, coveragePct: 92.0, waterQualityTested: true, waterQualityResult: "Safe",           source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tS.id, villageName: "Bengaluru South Taluk",  totalHouseholds: 940000, tapConnections: 893000, coveragePct: 95.0, waterQualityTested: true, waterQualityResult: "Safe",           source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tE.id, villageName: "Bengaluru East Taluk",   totalHouseholds: 720000, tapConnections: 640800, coveragePct: 89.0, waterQualityTested: true, waterQualityResult: "Safe",           source: "JJM Dashboard 2024" },
        { districtId: did, talukId: tA.id, villageName: "Anekal Taluk",           totalHouseholds: 380000, tapConnections: 319200, coveragePct: 84.0, waterQualityTested: true, waterQualityResult: "Requires treatment", source: "JJM Dashboard 2024" },
      ]});
      console.log("  ✓ 4 JJM status records");
    } else {
      console.log("  ↩ JJM already seeded");
    }

    // ── 6. Housing Schemes (4) ────────────────────────────────
    const existingHS = await client.housingScheme.count({ where: { districtId: did } });
    if (existingHS === 0) {
      await client.housingScheme.createMany({ data: [
        { districtId: did, schemeName: "PM Awas Yojana Urban — BDA",            fiscalYear: "2024-25", targetHouses: 12000, sanctioned: 10800, completed: 7200, inProgress: 3600, fundsAllocated: 3000000000, fundsReleased: 2400000000, fundsSpent: 1800000000, source: "BDA Annual Report 2024" },
        { districtId: did, schemeName: "Rajiv Gandhi Housing Corporation — BLR", fiscalYear: "2024-25", targetHouses: 8000,  sanctioned: 7200,  completed: 4800, inProgress: 2400, fundsAllocated: 2000000000, fundsReleased: 1600000000, fundsSpent: 1200000000, source: "RGRHCL Report 2024" },
        { districtId: did, schemeName: "BBMP Slum Rehabilitation",               fiscalYear: "2024-25", targetHouses: 6000,  sanctioned: 5400,  completed: 2700, inProgress: 2700, fundsAllocated: 1500000000, fundsReleased: 1200000000, fundsSpent: 720000000,  source: "BBMP Urban Poor Cell 2024" },
        { districtId: did, schemeName: "NPKL Housing — BDA Peripheral Ring Road",fiscalYear: "2024-25", targetHouses: 18000, sanctioned: 14400, completed: 3600, inProgress: 10800,fundsAllocated: 4500000000, fundsReleased: 2700000000, fundsSpent: 900000000,  source: "BDA NPKL Project 2024" },
      ]});
      console.log("  ✓ 4 housing schemes");
    } else {
      console.log("  ↩ Housing schemes already seeded");
    }

    // ── 7. BESCOM Power Outages (8 scheduled) ────────────────
    const existingPO = await client.powerOutage.count({ where: { districtId: did } });
    if (existingPO === 0) {
      await client.powerOutage.createMany({ data: [
        { districtId: did, talukId: tN.id, area: "Yelahanka New Town Sectors 1-5",    type: "Scheduled",  reason: "Line maintenance work on 11kV feeder",     startTime: new Date("2025-03-20T09:00:00+05:30"), endTime: new Date("2025-03-20T17:00:00+05:30"), duration: "8 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tN.id, area: "Devanahalli Industrial Area",       type: "Scheduled",  reason: "Transformer replacement 33/11kV sub-station", startTime: new Date("2025-03-22T06:00:00+05:30"), endTime: new Date("2025-03-22T14:00:00+05:30"), duration: "8 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tS.id, area: "Jayanagar 4th–9th Block",           type: "Scheduled",  reason: "Underground cabling upgrade",               startTime: new Date("2025-03-19T08:00:00+05:30"), endTime: new Date("2025-03-19T14:00:00+05:30"), duration: "6 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tS.id, area: "BTM Layout Stage 1 & 2",            type: "Scheduled",  reason: "Capacitor bank installation 66kV substation", startTime: new Date("2025-03-25T10:00:00+05:30"), endTime: new Date("2025-03-25T16:00:00+05:30"), duration: "6 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tE.id, area: "Whitefield ITPL Zone A",            type: "Scheduled",  reason: "High voltage line inspection and stringing", startTime: new Date("2025-03-21T07:00:00+05:30"), endTime: new Date("2025-03-21T13:00:00+05:30"), duration: "6 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tE.id, area: "Marathahalli Bridge Area",           type: "Scheduled",  reason: "Switch gear replacement at substations",    startTime: new Date("2025-03-26T09:00:00+05:30"), endTime: new Date("2025-03-26T15:00:00+05:30"), duration: "6 hours",  source: "BESCOM", active: false },
        { districtId: did, talukId: tA.id, area: "Electronic City Phase 1 Sector 3",  type: "Scheduled",  reason: "Annual preventive maintenance 110kV sub-st", startTime: new Date("2025-03-23T06:00:00+05:30"), endTime: new Date("2025-03-23T18:00:00+05:30"), duration: "12 hours", source: "BESCOM", active: false },
        { districtId: did, talukId: tA.id, area: "Attibele Industrial Area",           type: "Scheduled",  reason: "New feeder line extension work",             startTime: new Date("2025-03-27T08:00:00+05:30"), endTime: new Date("2025-03-27T17:00:00+05:30"), duration: "9 hours",  source: "BESCOM", active: false },
      ]});
      console.log("  ✓ 8 BESCOM scheduled outages");
    } else {
      console.log("  ↩ Power outages already seeded");
    }

    // ── 8. RTI Templates (5) ─────────────────────────────────
    const existingRTI = await client.rtiTemplate.count({ where: { districtId: did } });
    if (existingRTI === 0) {
      await client.rtiTemplate.createMany({ data: [
        {
          districtId: did,
          topic: "BBMP Road Work Status & Contractor Details",
          topicLocal: "ರಸ್ತೆ ಕಾಮಗಾರಿ ಸ್ಥಿತಿ",
          department: "BBMP Infrastructure",
          pioName: "Public Information Officer",
          pioAddress: "BBMP Head Office, N R Square, Bengaluru 560002",
          feeAmount: "₹10 (postal order / court fee stamp)",
          templateText: `To,
The Public Information Officer,
BBMP Infrastructure Department,
N R Square, Bengaluru – 560 002.

Subject: Application under Right to Information Act, 2005

I, [Your Name], residing at [Your Address], Bengaluru – [PIN], hereby request the following information under the RTI Act 2005:

1. Copy of work order issued for road repair work on [Road Name / Ward Number] during [period].
2. Name and address of the contractor assigned, along with contract value and duration.
3. Quality inspection reports (if any) for the said road work.
4. Amount disbursed to the contractor as on date of this application.
5. Photographs taken before and after the road work (if available).

I am enclosing ₹10 as application fee via court fee stamp.

Date:
Place: Bengaluru
Signature: [Your Signature]
Name: [Your Name]
Mobile: [Your Mobile]`,
          tips: "Attach a copy of the specific road stretch or ward number for faster processing. You may also file this online on the Karnataka RTI portal.",
          active: true,
        },
        {
          districtId: did,
          topic: "BESCOM Power Outage & Bill Dispute Information",
          topicLocal: "ವಿದ್ಯುತ್ ವಿಚ್ಛೇದನ ಮಾಹಿತಿ",
          department: "BESCOM",
          pioName: "Public Information Officer",
          pioAddress: "BESCOM Head Office, K G Road, Bengaluru 560009",
          feeAmount: "₹10 (postal order / court fee stamp)",
          templateText: `To,
The Public Information Officer,
BESCOM (Bangalore Electricity Supply Company Limited),
K G Road, Bengaluru – 560 009.

Subject: Application under Right to Information Act, 2005

I, [Your Name], Consumer No. [Your Consumer Number], request the following information:

1. Number of unscheduled power outages in [Area/Feeder Name] for the last 12 months with dates and duration.
2. Reason for each outage exceeding 4 hours duration.
3. Average outage time (AT&C losses) reported for [Sub-division Name].
4. Pending infrastructure upgrade works in [Area] and their timeline.
5. Details of consumer complaints filed in last 6 months and status of resolution.

I am enclosing ₹10 as application fee.

Date:
Place: Bengaluru
Signature: [Your Signature]
Name: [Your Name]
Mobile: [Your Mobile]`,
          tips: "Include your RR (Revenue Register) number for faster identification of your area's feeder.",
          active: true,
        },
        {
          districtId: did,
          topic: "BWSSB Water Supply Schedule & Quality",
          topicLocal: "ನೀರು ಸರಬರಾಜು ವೇಳಾಪಟ್ಟಿ",
          department: "BWSSB",
          pioName: "Public Information Officer",
          pioAddress: "BWSSB Cauvery Bhavan, K G Road, Bengaluru 560009",
          feeAmount: "₹10 (postal order / court fee stamp)",
          templateText: `To,
The Public Information Officer,
BWSSB (Bangalore Water Supply & Sewerage Board),
Cauvery Bhavan, K G Road, Bengaluru – 560 009.

Subject: Application under Right to Information Act, 2005

I, [Your Name], hereby request:

1. Current water supply schedule for [Ward / Area Name] — days and timings.
2. Latest water quality test results for [Area] distribution mains.
3. Frequency and date of last water quality testing in [Area].
4. Number of consumer complaints received for [Ward] in last 6 months and status.
5. Timeline for completing the Cauvery Stage 5 project in [Area].

I am enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "BWSSB tests water quality at distribution points quarterly; request Form 10 results specifically.",
          active: true,
        },
        {
          districtId: did,
          topic: "BBMP Budget Utilisation & Contractor Payments",
          topicLocal: "ಬಿಬಿಎಂಪಿ ಬಜೆಟ್ ಬಳಕೆ",
          department: "BBMP Finance",
          pioName: "Public Information Officer",
          pioAddress: "BBMP Finance Wing, N R Square, Bengaluru 560002",
          feeAmount: "₹10 (postal order / court fee stamp)",
          templateText: `To,
The Public Information Officer,
BBMP Finance Department,
N R Square, Bengaluru – 560 002.

Subject: Application under Right to Information Act, 2005

I, [Your Name], request the following for [Ward Name/Number] for FY [YYYY-YY]:

1. Total budget allocated, released, and spent ward-wise.
2. List of contractors to whom payments were made above ₹5 lakh, with contract details.
3. Outstanding works sanctioned but not yet started as of this date.
4. Audit objections (if any) raised by BBMP Accounts for this ward.
5. List of works completed in this ward with actual vs. estimated costs.

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]`,
          tips: "Cross-check with BBMP Sparsh portal (bbmpsparsh.in) which publishes some ward-level data publicly.",
          active: true,
        },
        {
          districtId: did,
          topic: "Police FIR Status & Investigation Progress",
          topicLocal: "ಎಫ್‌ಐಆರ್ ಸ್ಥಿತಿ ಮಾಹಿತಿ",
          department: "Bengaluru City Police",
          pioName: "Public Information Officer",
          pioAddress: "Bengaluru City Police Commissioner's Office, Infantry Road, Bengaluru 560001",
          feeAmount: "₹10 (postal order / court fee stamp)",
          templateText: `To,
The Public Information Officer,
Office of the Commissioner of Police, Bengaluru City,
Infantry Road, Bengaluru – 560 001.

Subject: Application under Right to Information Act, 2005

I, [Your Name/Complainant], request the following information regarding FIR No. [FIR Number] / Crime No. [Crime Number] registered at [Police Station Name] Police Station:

1. Current status of investigation in the above FIR.
2. Name and designation of Investigating Officer assigned.
3. Whether chargesheet has been filed in court; if yes, court and date.
4. Whether any accused has been arrested; if yes, date and current status.
5. Action taken on any anticipatory bail application filed (if applicable).

Enclosing ₹10 as application fee.

Date:
Signature: [Your Signature]
Name: [Your Name]
Mobile: [Your Mobile]`,
          tips: "Section 173(2) CrPC requires police to file chargesheet within 60-90 days; use this RTI if deadline is missed.",
          active: true,
        },
      ]});
      console.log("  ✓ 5 RTI templates");
    } else {
      console.log("  ↩ RTI templates already seeded");
    }

    // ── 9. Citizen Tips (10) ──────────────────────────────────
    const existingCT = await client.citizenTip.count({ where: { districtId: did } });
    if (existingCT === 0) {
      await client.citizenTip.createMany({ data: [
        { districtId: did, category: "Traffic",       title: "Use Namma Metro to Beat Traffic",          titleLocal: "ನಮ್ಮ ಮೆಟ್ರೋ ಬಳಸಿ",           description: "Bengaluru has 72 km of Metro (Purple + Green lines). Park your vehicle at designated P&R stations like Baiyappanahalli or Yelachenahalli and commute by Metro to save 30-40 minutes during peak hours.",                                                                                                                                                                        descriptionLocal: "ಮೆಟ್ರೋ ಸ್ಟೇಷನ್‌ಗಳಲ್ಲಿ ವಾಹನ ನಿಲ್ಲಿಸಿ ಮೆಟ್ರೋ ಬಳಸಿ, ಸಂಚಾರ ದಟ್ಟಣೆ ತಪ್ಪಿಸಿ.",                          priority: 1, icon: "🚇", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Water",         title: "BWSSB Water Supply Timings by Area",       titleLocal: "ನೀರು ಸರಬರಾಜು ಸಮಯ",            description: "BWSSB supplies water on alternate days in most Bengaluru zones. Call 1916 for supply schedules or check the BWSSB app. During summer (March–June), supply may reduce to once in 3 days in outer areas.",                                                                                                                                                                       descriptionLocal: "ಬಿಡಬ್ಲ್ಯೂಎಸ್‌ಎಸ್‌ಬಿ 1916 ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ನೀರಿನ ಸಮಯ ತಿಳಿಯಿರಿ.",                                   priority: 2, icon: "💧", isDistrictSpecific: true, seasonalMonths: [3,4,5,6], active: true },
        { districtId: did, category: "Power",         title: "Planned Outage Notifications from BESCOM",  titleLocal: "ಬೆಸ್ಕಾಂ ಕಡಿತ ಮಾಹಿತಿ",          description: "BESCOM publishes planned outage schedules on their website 48 hours in advance. Register your mobile number with BESCOM (call 1912) to receive SMS alerts for outages in your area.",                                                                                                                                                                                          descriptionLocal: "BESCOM ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ವಿದ್ಯುತ್ ಕಡಿತ ಮಾಹಿತಿ 48 ಗಂಟೆ ಮೊದಲು ಪ್ರಕಟವಾಗುತ್ತದೆ.",                        priority: 3, icon: "⚡", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Civic",         title: "Report Potholes via BBMP Sahaaya App",      titleLocal: "ಗುಂಡಿ ದೂರು — ಬಿಬಿಎಂಪಿ",          description: "Download the BBMP Sahaaya app (iOS/Android) to report potholes, garbage issues, broken footpaths, and stray animals. Complaints are geotagged and escalated automatically to ward-level engineers within 24 hours.",                                                                                                                                                              descriptionLocal: "BBMP ಸಹಾಯ ಆಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ರಸ್ತೆ ಗುಂಡಿ, ಕಸ ದೂರು ದಾಖಲಿಸಿ.",                                       priority: 1, icon: "🚧", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Civic",         title: "Solid Waste: Segregate at Source",          titleLocal: "ತ್ಯಾಜ್ಯ ವಿಂಗಡಣೆ ಮಾಡಿ",          description: "Bengaluru mandates waste segregation into Wet (green bin), Dry (blue bin), and Sanitary (red bin) at source. Unsegregated waste will not be collected from Jan 2025. Violators face ₹500 fine under BBMP bylaws.",                                                                                                                                                                  descriptionLocal: "ಹಸಿ (ಹಸಿರು), ಒಣ (ನೀಲಿ), ಮತ್ತು ನೈರ್ಮಲ್ಯ (ಕೆಂಪು) ಡಬ್ಬಗಳಲ್ಲಿ ತ್ಯಾಜ್ಯ ಹಾಕಿ.",                             priority: 2, icon: "♻️", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Agriculture",   title: "Bangalore Rose Onion Season — Feb to Apr",  titleLocal: "ಬೆಂಗಳೂರು ಗುಲಾಬಿ ಈರುಳ್ಳಿ ಸೀಸನ್", description: "Bangalore Rose Onion (GI-tagged) is harvested in Anekal and Doddaballapur taluks between February and April. Farmers can register at the APMC to get assured MSP. Avoid distress selling before March — prices peak mid-April.",                                                                                                                                               descriptionLocal: "ಬೆಂಗಳೂರು ಗುಲಾಬಿ ಈರುಳ್ಳಿ ಫೆಬ್ರವರಿ–ಏಪ್ರಿಲ್‌ನಲ್ಲಿ ಕಟಾವು ಮಾಡಿ ಎಪಿಎಂಸಿ ದರ ಪಡೆಯಿರಿ.",                       priority: 2, icon: "🧅", isDistrictSpecific: true, seasonalMonths: [2,3,4], active: true },
        { districtId: did, category: "Health",        title: "Victoria & Bowring Hospitals — Free OPD",   titleLocal: "ಉಚಿತ ಆಸ್ಪತ್ರೆ ಸೇವೆ",             description: "Victoria Hospital (Vani Vilas Rd) and Bowring & Lady Curzon Hospital provide free OPD services 8am–12pm Monday to Saturday. Carry Aadhaar and ration card for priority BPL registration. NIMHANS has dedicated free mental health OPD on Tuesdays.",                                                                                                                           descriptionLocal: "ವಿಕ್ಟೋರಿಯಾ ಮತ್ತು ಬೌರಿಂಗ್ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಸೋಮ–ಶನಿ 8am–12pm ಉಚಿತ ಓಪಿಡಿ.",                             priority: 3, icon: "🏥", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Safety",        title: "Dengue Prevention — Clear Stagnant Water",  titleLocal: "ಡೆಂಗ್ಯೂ ತಡೆ — ನೀರು ನಿಲ್ಲಿಸಬೇಡಿ", description: "Bengaluru reports 2,000–4,000 dengue cases annually, peaking June–October. Empty coolers, flower pots, and tyre collections weekly. BBMP conducts free dengue testing at all PHCs; report breeding sites via BBMP Sahaaya app. Wear full sleeves at dawn and dusk.",                                                                                                              descriptionLocal: "ಜೂನ್–ಅಕ್ಟೋಬರ್‌ನಲ್ಲಿ ನೀರು ನಿಲ್ಲದಂತೆ ನೋಡಿ; ಡೆಂಗ್ಯೂ ಪರೀಕ್ಷೆ BBMP ಆರೋಗ್ಯ ಕೇಂದ್ರಗಳಲ್ಲಿ ಉಚಿತ.",                priority: 1, icon: "🦟", isDistrictSpecific: true, seasonalMonths: [6,7,8,9,10], active: true },
        { districtId: did, category: "Employment",    title: "Yuva Nidhi — Register within 6 Months of Graduation", titleLocal: "ಯುವ ನಿಧಿ ನೋಂದಾಯಿಸಿ",  description: "Karnataka's Yuva Nidhi scheme pays ₹3,000/month to unemployed graduates and ₹1,500 to diploma holders for up to 2 years. Register on sevasindhu.karnataka.gov.in within 6 months of result declaration. Last date is strictly enforced.",                                                                                                                                       descriptionLocal: "ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ 6 ತಿಂಗಳಲ್ಲಿ ಯುವ ನಿಧಿ ನೋಂದಾಯಿಸಿ ₹3,000/ತಿಂಗಳು ಪಡೆಯಿರಿ.",                            priority: 1, icon: "💼", isDistrictSpecific: true, seasonalMonths: [], active: true },
        { districtId: did, category: "Civic",         title: "Kaveri Online — Property EC in 10 Minutes", titleLocal: "ಕಾವೇರಿ ಆನ್‌ಲೈನ್ EC",             description: "Encumbrance Certificates for Bengaluru properties can be downloaded instantly from kaverionline.karnataka.gov.in. Enter survey/site number, select the period, and pay ₹35/year online. No need to visit the Sub-Registrar office. Valid for banks, courts, and BBMP.",                                                                                                            descriptionLocal: "kaverionline.karnataka.gov.in ಮೂಲಕ 10 ನಿಮಿಷದಲ್ಲಿ EC ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",                                 priority: 2, icon: "📋", isDistrictSpecific: true, seasonalMonths: [], active: true },
      ]});
      console.log("  ✓ 10 citizen tips");
    } else {
      console.log("  ↩ Citizen tips already seeded");
    }

    console.log("  ✅ Bengaluru Ext-C complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedBengaluruDataExtC(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
