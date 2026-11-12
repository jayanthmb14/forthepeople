// ═══════════════════════════════════════════════════════════
// Bengaluru Urban — Extended Data Part A
// 50 Police Stations · 50 Govt Offices · 50 Bus Routes
// Run standalone: npx tsx prisma/seed-bengaluru-data-ext-a.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "@ftp/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedBengaluruDataExtA(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n📋 [Ext-A] Bengaluru — Police Stations, Govt Offices, Bus Routes...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const bu = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
    });
    const did = bu.id;

    // ── 1. Police Stations (50) ──────────────────────────────
    const existingPS = await client.policeStation.count({ where: { districtId: did } });
    if (existingPS < 50) {
      await client.policeStation.createMany({
        skipDuplicates: true,
        data: [
          { districtId: did, name: "Cubbon Park Police Station",       address: "Ambedkar Veedhi, Cubbon Park, Bengaluru 560001",           phone: "080-22942222" },
          { districtId: did, name: "Ashok Nagar Police Station",       address: "Ashok Nagar, Bengaluru 560010",                           phone: "080-22250585" },
          { districtId: did, name: "High Grounds Police Station",      address: "Sampangi Rama Nagar, Bengaluru 560027",                   phone: "080-22252777" },
          { districtId: did, name: "Shivajinagar Police Station",      address: "Shivajinagar, Bengaluru 560001",                         phone: "080-25550100" },
          { districtId: did, name: "Seshadripuram Police Station",     address: "Seshadripuram, Bengaluru 560020",                        phone: "080-23461100" },
          { districtId: did, name: "Malleswaram Police Station",       address: "8th Cross, Malleswaram, Bengaluru 560003",               phone: "080-23315400" },
          { districtId: did, name: "Rajajinagar Police Station",       address: "2nd Block Rajajinagar, Bengaluru 560010",                phone: "080-23154100" },
          { districtId: did, name: "Yeshwanthpur Police Station",      address: "Yeshwanthpur, Bengaluru 560022",                        phone: "080-23375100" },
          { districtId: did, name: "Jalahalli Police Station",         address: "Jalahalli West, Bengaluru 560013",                      phone: "080-28395100" },
          { districtId: did, name: "Yelahanka Police Station",         address: "Yelahanka New Town, Bengaluru 560064",                  phone: "080-28461100" },
          { districtId: did, name: "Devanahalli Police Station",       address: "Devanahalli Town, Bengaluru Rural 562110",              phone: "080-27683100" },
          { districtId: did, name: "Hebbal Police Station",            address: "Hebbal, Bengaluru 560024",                             phone: "080-23630100" },
          { districtId: did, name: "RT Nagar Police Station",          address: "RT Nagar Main Road, Bengaluru 560032",                  phone: "080-23332100" },
          { districtId: did, name: "Byatarayanapura Police Station",   address: "Byatarayanapura, Bengaluru 560026",                     phone: "080-28495100" },
          { districtId: did, name: "Vidyaranyapura Police Station",    address: "Vidyaranyapura, Bengaluru 560097",                      phone: "080-28483100" },
          { districtId: did, name: "Hesaraghatta Police Station",      address: "Hesaraghatta Road, Bengaluru 560088",                   phone: "080-28482100" },
          { districtId: did, name: "Doddaballapur Police Station",     address: "Doddaballapur Town, Bengaluru Rural 561203",            phone: "08033-265100" },
          { districtId: did, name: "Bagalgunte Police Station",        address: "Bagalgunte, Bengaluru 560073",                         phone: "080-28492100" },
          { districtId: did, name: "Kodigehalli Police Station",       address: "Kodigehalli, Bengaluru 560092",                        phone: "080-28485100" },
          { districtId: did, name: "Lalbagh Police Station",           address: "Lalbagh Road, Bengaluru 560027",                       phone: "080-26711100" },
          { districtId: did, name: "Jayanagar Police Station",         address: "4th Block Jayanagar, Bengaluru 560041",                 phone: "080-26634100" },
          { districtId: did, name: "JP Nagar Police Station",          address: "JP Nagar 6th Phase, Bengaluru 560078",                  phone: "080-26595100" },
          { districtId: did, name: "Banashankari Police Station",      address: "Banashankari 3rd Stage, Bengaluru 560085",              phone: "080-26723100" },
          { districtId: did, name: "Kanakapura Road Police Station",   address: "Kanakapura Road, Bengaluru 560062",                    phone: "080-26484100" },
          { districtId: did, name: "Vijayanagar Police Station",       address: "Vijayanagar, Bengaluru 560040",                        phone: "080-23307100" },
          { districtId: did, name: "Srirampuram Police Station",       address: "Srirampuram, Bengaluru 560021",                        phone: "080-23490100" },
          { districtId: did, name: "Subramanyanagar Police Station",   address: "Subramanyanagar, Bengaluru 560021",                    phone: "080-23305100" },
          { districtId: did, name: "Cottonpet Police Station",         address: "Cottonpet, Bengaluru 560053",                          phone: "080-22874100" },
          { districtId: did, name: "Chickpet Police Station",          address: "Chickpet, Bengaluru 560053",                           phone: "080-22875100" },
          { districtId: did, name: "Banaswadi Police Station",         address: "Banaswadi, Bengaluru 560033",                          phone: "080-25470100" },
          { districtId: did, name: "Indiranagar Police Station",       address: "100 Feet Road, Indiranagar, Bengaluru 560038",         phone: "080-25276100" },
          { districtId: did, name: "HAL Police Station",               address: "Old Airport Road, HAL, Bengaluru 560017",              phone: "080-25221100" },
          { districtId: did, name: "Whitefield Police Station",        address: "Whitefield Main Road, Bengaluru 560066",               phone: "080-28450100" },
          { districtId: did, name: "Mahadevapura Police Station",      address: "Mahadevapura, Bengaluru 560048",                       phone: "080-28448100" },
          { districtId: did, name: "KR Puram Police Station",          address: "KR Puram, Bengaluru 560036",                           phone: "080-25631100" },
          { districtId: did, name: "Marathahalli Police Station",      address: "Marathahalli Bridge, Bengaluru 560037",                phone: "080-25243100" },
          { districtId: did, name: "Bellandur Police Station",         address: "Bellandur, Bengaluru 560103",                          phone: "080-28442100" },
          { districtId: did, name: "HSR Layout Police Station",        address: "HSR Layout, Bengaluru 560102",                         phone: "080-22943100" },
          { districtId: did, name: "Madivala Police Station",          address: "Madivala, Bengaluru 560068",                           phone: "080-26742100" },
          { districtId: did, name: "BTM Layout Police Station",        address: "BTM Layout 1st Stage, Bengaluru 560029",               phone: "080-26780100" },
          { districtId: did, name: "Adugodi Police Station",           address: "Adugodi, Bengaluru 560030",                            phone: "080-25542100" },
          { districtId: did, name: "Koramangala Police Station",       address: "5th Block Koramangala, Bengaluru 560095",              phone: "080-25527100" },
          { districtId: did, name: "Wilson Garden Police Station",     address: "Wilson Garden, Bengaluru 560027",                      phone: "080-22272100" },
          { districtId: did, name: "Electronic City Police Station",   address: "Electronic City Phase 1, Bengaluru 560100",            phone: "080-28520100" },
          { districtId: did, name: "Anekal Police Station",            address: "Anekal Town, Bengaluru 562106",                        phone: "080-27822100" },
          { districtId: did, name: "Sarjapur Police Station",          address: "Sarjapur Road, Bengaluru 562125",                      phone: "080-28438100" },
          { districtId: did, name: "Chandapura Police Station",        address: "Chandapura, Bengaluru 562106",                         phone: "080-27845100" },
          { districtId: did, name: "Attibele Police Station",          address: "Attibele, Bengaluru 562107",                           phone: "080-27831100" },
          { districtId: did, name: "Begur Police Station",             address: "Begur Road, Bengaluru 560068",                         phone: "080-28441100" },
          { districtId: did, name: "Bannerghatta Road Police Station", address: "Bannerghatta Road, Bengaluru 560083",                  phone: "080-26485100" },
        ],
      });
      console.log("  ✓ 50 police stations");
    } else {
      console.log("  ↩ Police stations already seeded");
    }

    // ── 2. Govt Offices (50) ─────────────────────────────────
    const existingGO = await client.govOffice.count({ where: { districtId: did } });
    if (existingGO < 50) {
      await client.govOffice.createMany({
        skipDuplicates: true,
        data: [
          { districtId: did, name: "Office of the Deputy Commissioner, Bengaluru Urban",     department: "Revenue",            type: "District Office",   address: "Hudson Circle, Bengaluru 560001",                    phone: "080-22381600" },
          { districtId: did, name: "BBMP Head Office",                                        department: "Urban Local Body",   type: "Municipal Office",  address: "N R Square, Bengaluru 560002",                       phone: "080-22660000" },
          { districtId: did, name: "BDA Head Office",                                         department: "Urban Development",  type: "Development Auth",  address: "Kumara Park West, Bengaluru 560020",                  phone: "080-23361702" },
          { districtId: did, name: "BMTC Head Office",                                        department: "Transport",          type: "Transport Corp",    address: "Shantinagar Bus Depot, Bengaluru 560027",             phone: "080-22253800" },
          { districtId: did, name: "BMRCL Head Office",                                       department: "Transport",          type: "Metro Rail",        address: "BMRCL Building, Sampangi Rama Nagar, 560027",         phone: "080-23459100" },
          { districtId: did, name: "BESCOM Head Office",                                      department: "Power",              type: "Power Utility",     address: "K G Road, Bengaluru 560009",                         phone: "080-22221100" },
          { districtId: did, name: "BWSSB Head Office",                                       department: "Water Supply",       type: "Water Board",       address: "Cauvery Bhavan, K G Road, Bengaluru 560009",         phone: "080-22238300" },
          { districtId: did, name: "KSRTC Majestic Bus Stand",                                department: "Transport",          type: "Bus Terminus",      address: "Kempegowda Bus Stand, Bengaluru 560009",             phone: "080-22878050" },
          { districtId: did, name: "Kempegowda International Airport Authority Office",        department: "Civil Aviation",     type: "Airport Office",    address: "Devanahalli, Bengaluru 562110",                      phone: "080-66782000" },
          { districtId: did, name: "Income Tax Office — CIT(Central)",                        department: "Finance",            type: "Tax Office",        address: "Queen's Road, Bengaluru 560001",                     phone: "080-22232931" },
          { districtId: did, name: "GST Commissionerate Bengaluru Central",                   department: "Finance",            type: "Tax Office",        address: "Palace Road, Bengaluru 560001",                      phone: "080-22252902" },
          { districtId: did, name: "Customs & Central Excise Bengaluru",                      department: "Finance",            type: "Tax Office",        address: "St Mark's Road, Bengaluru 560001",                   phone: "080-22867700" },
          { districtId: did, name: "EPFO Regional Office Bengaluru",                          department: "Labour",             type: "Provident Fund",    address: "Bhavishya Nidhi Bhavan, Koramangala, 560034",        phone: "080-25531261" },
          { districtId: did, name: "ESI Corporation — Bengaluru Region",                      department: "Labour",             type: "Social Insurance",  address: "Peenya, Bengaluru 560058",                           phone: "080-28374100" },
          { districtId: did, name: "Regional Passport Office Bengaluru",                      department: "External Affairs",   type: "Passport Office",   address: "Rajajinagar 5th Block, Bengaluru 560010",            phone: "080-40429200" },
          { districtId: did, name: "Registrar of Companies Karnataka",                        department: "Corporate Affairs",  type: "Registrar Office",  address: "E-Wing Kendriya Sadana, Koramangala, 560034",        phone: "080-25537449" },
          { districtId: did, name: "Karnataka High Court",                                    department: "Judiciary",          type: "High Court",        address: "High Court Road, Bengaluru 560001",                  phone: "080-22867400" },
          { districtId: did, name: "City Civil & Sessions Court",                             department: "Judiciary",          type: "District Court",    address: "Mayo Hall, Bengaluru 560001",                        phone: "080-22862530" },
          { districtId: did, name: "Labour Commissioner Office Karnataka",                    department: "Labour",             type: "Labour Office",     address: "Shrama Bhavan, Bellary Road, Bengaluru 560001",      phone: "080-22253800" },
          { districtId: did, name: "Department of Agriculture Bengaluru Urban",               department: "Agriculture",        type: "Dept Office",       address: "Lalbagh Road, Bengaluru 560004",                     phone: "080-22373300" },
          { districtId: did, name: "Bruhat Bengaluru Mahanagara Palike — South Zone",         department: "Urban Local Body",   type: "Zone Office",       address: "Jayanagar 4th Block, Bengaluru 560041",              phone: "080-22262100" },
          { districtId: did, name: "Bruhat Bengaluru Mahanagara Palike — East Zone",          department: "Urban Local Body",   type: "Zone Office",       address: "Indiranagar, Bengaluru 560038",                      phone: "080-25277100" },
          { districtId: did, name: "Bruhat Bengaluru Mahanagara Palike — West Zone",          department: "Urban Local Body",   type: "Zone Office",       address: "Rajajinagar, Bengaluru 560010",                      phone: "080-23155100" },
          { districtId: did, name: "Bruhat Bengaluru Mahanagara Palike — North Zone",         department: "Urban Local Body",   type: "Zone Office",       address: "Hebbal, Bengaluru 560024",                           phone: "080-23630200" },
          { districtId: did, name: "Karnataka Udyog Mitra",                                   department: "Industries",         type: "Investment Promo",  address: "Khanija Bhavan, Bengaluru 560001",                   phone: "080-22246761" },
          { districtId: did, name: "Department of Industries & Commerce",                     department: "Industries",         type: "Dept Office",       address: "Khanija Bhavan, Bengaluru 560001",                   phone: "080-22249009" },
          { districtId: did, name: "KIADB Head Office",                                       department: "Industries",         type: "Industrial Dev",    address: "Exhibition Building, Bengaluru 560001",              phone: "080-22220019" },
          { districtId: did, name: "Karnataka State Pollution Control Board",                 department: "Environment",        type: "Pollution Control", address: "Parisara Bhavan, Church Street, Bengaluru 560001",   phone: "080-25589112" },
          { districtId: did, name: "Regional Transport Office — Bengaluru North",             department: "Transport",          type: "RTO",               address: "Hebbal Kempapura, Bengaluru 560024",                 phone: "080-23631110" },
          { districtId: did, name: "Regional Transport Office — Bengaluru South",             department: "Transport",          type: "RTO",               address: "Koramangala, Bengaluru 560034",                      phone: "080-25531510" },
          { districtId: did, name: "Regional Transport Office — Bengaluru East",              department: "Transport",          type: "RTO",               address: "Whitefield, Bengaluru 560066",                       phone: "080-28453910" },
          { districtId: did, name: "BSNL Bengaluru Telecom District",                         department: "Telecom",            type: "Telecom Office",    address: "Bhadra Complex, T T G Road, Bengaluru 560009",       phone: "080-22214285" },
          { districtId: did, name: "Head Post Office — Bengaluru GPO",                        department: "Postal",             type: "Post Office",       address: "Raj Bhavan Road, Bengaluru 560001",                  phone: "080-22225190" },
          { districtId: did, name: "Directorate of Health Services Karnataka",                department: "Health",             type: "Dept Office",       address: "Ananda Rao Circle, Bengaluru 560009",                phone: "080-22205527" },
          { districtId: did, name: "Department of Women & Child Development",                 department: "Social Welfare",     type: "Dept Office",       address: "Sampangi Rama Nagar, Bengaluru 560027",              phone: "080-22381090" },
          { districtId: did, name: "Department of Social Welfare Karnataka",                  department: "Social Welfare",     type: "Dept Office",       address: "Bangalore 560001",                                   phone: "080-22033100" },
          { districtId: did, name: "Karnataka Backward Classes Welfare Dept",                 department: "Social Welfare",     type: "Dept Office",       address: "MS Building, Bengaluru 560001",                      phone: "080-22254706" },
          { districtId: did, name: "Karnataka State Fire & Emergency Services",               department: "Fire Services",      type: "Fire Station HQ",   address: "Shivajinagar, Bengaluru 560001",                     phone: "080-22221100" },
          { districtId: did, name: "Department of Education — DDPI Bengaluru Urban",          department: "Education",          type: "Dept Office",       address: "Crescent Road, Bengaluru 560001",                    phone: "080-22354250" },
          { districtId: did, name: "DPAR e-Governance — Seva Sindhu Centre",                  department: "e-Governance",       type: "Service Centre",    address: "N R Square, Bengaluru 560002",                       phone: "080-22660000" },
          { districtId: did, name: "Bengaluru City Railway Station Office",                   department: "Railways",           type: "Railway Station",   address: "Krantivira Sangolli Rayanna Station, 560023",        phone: "080-22875488" },
          { districtId: did, name: "Bengaluru Cantonment Railway Station",                    department: "Railways",           type: "Railway Station",   address: "Cantonment Area, Bengaluru 560042",                  phone: "080-25343440" },
          { districtId: did, name: "Yeshwanthpur Railway Station",                            department: "Railways",           type: "Railway Station",   address: "Yeshwanthpur, Bengaluru 560022",                     phone: "080-23377600" },
          { districtId: did, name: "BBMP Solid Waste Management Department",                  department: "Sanitation",         type: "Dept Office",       address: "N R Square, Bengaluru 560002",                       phone: "1800-425-0777" },
          { districtId: did, name: "Karnataka Housing Board Bengaluru",                       department: "Housing",            type: "Housing Auth",      address: "Cauvery Bhavan, K G Road, Bengaluru 560009",         phone: "080-22290400" },
          { districtId: did, name: "AADHAAR Enrolment Centre — BBMP",                         department: "e-Governance",       type: "Service Centre",    address: "Hudson Circle, Bengaluru 560001",                    phone: "1947" },
          { districtId: did, name: "BBMP Town Planning Department",                           department: "Urban Planning",     type: "Planning Office",   address: "N R Square, Bengaluru 560002",                       phone: "080-22660200" },
          { districtId: did, name: "Karnataka State Minorities Commission",                   department: "Minority Welfare",   type: "Dept Office",       address: "MS Building, Bengaluru 560001",                      phone: "080-22253800" },
          { districtId: did, name: "Forest Department — Bengaluru Urban Division",            department: "Forest",             type: "Dept Office",       address: "Aranya Bhavan, Bengaluru 560001",                    phone: "080-22282151" },
          { districtId: did, name: "Karnataka State Legal Services Authority",                department: "Judiciary",          type: "Legal Aid",         address: "High Court Complex, Bengaluru 560001",               phone: "080-22867100" },
        ],
      });
      console.log("  ✓ 50 govt offices");
    } else {
      console.log("  ↩ Govt offices already seeded");
    }

    // ── 3. Bus Routes (50) ───────────────────────────────────
    const existingBR = await client.busRoute.count({ where: { districtId: did } });
    if (existingBR < 50) {
      await client.busRoute.createMany({
        skipDuplicates: true,
        data: [
          { districtId: did, routeNumber: "500C",   origin: "Kempegowda Bus Stand",   destination: "Silk Board",             operator: "BMTC", busType: "Ordinary",   frequency: "5 min",  fare: 30 },
          { districtId: did, routeNumber: "500D",   origin: "Jayanagar 4th Block",    destination: "Hebbal",                 operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 30 },
          { districtId: did, routeNumber: "501",    origin: "Kempegowda Bus Stand",   destination: "Electronic City",        operator: "BMTC", busType: "Vajra",      frequency: "15 min", fare: 80 },
          { districtId: did, routeNumber: "335E",   origin: "Shivajinagar",           destination: "Whitefield ITPL",        operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 40 },
          { districtId: did, routeNumber: "600K",   origin: "Kempegowda Bus Stand",   destination: "KR Puram",               operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 25 },
          { districtId: did, routeNumber: "401H",   origin: "Kempegowda Bus Stand",   destination: "Hesaraghatta",           operator: "BMTC", busType: "Ordinary",   frequency: "20 min", fare: 35 },
          { districtId: did, routeNumber: "273F",   origin: "Shivajinagar",           destination: "Marathahalli",           operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 35 },
          { districtId: did, routeNumber: "201R",   origin: "Kempegowda Bus Stand",   destination: "Rajajinagar",            operator: "BMTC", busType: "Ordinary",   frequency: "7 min",  fare: 20 },
          { districtId: did, routeNumber: "347G",   origin: "Kempegowda Bus Stand",   destination: "Yelahanka",              operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 35 },
          { districtId: did, routeNumber: "365",    origin: "Shivajinagar",           destination: "Devanahalli",            operator: "BMTC", busType: "Ordinary",   frequency: "20 min", fare: 55 },
          { districtId: did, routeNumber: "216E",   origin: "Kempegowda Bus Stand",   destination: "Indiranagar",            operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 25 },
          { districtId: did, routeNumber: "333M",   origin: "Shivajinagar",           destination: "Malleshwaram",           operator: "BMTC", busType: "Ordinary",   frequency: "5 min",  fare: 20 },
          { districtId: did, routeNumber: "255F",   origin: "Kempegowda Bus Stand",   destination: "HSR Layout",             operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 30 },
          { districtId: did, routeNumber: "502",    origin: "Kempegowda Bus Stand",   destination: "Sarjapur Road",          operator: "BMTC", busType: "Vajra",      frequency: "20 min", fare: 70 },
          { districtId: did, routeNumber: "300A",   origin: "Kempegowda Bus Stand",   destination: "Bannerghatta Road",      operator: "BMTC", busType: "Ordinary",   frequency: "12 min", fare: 30 },
          { districtId: did, routeNumber: "410V",   origin: "Kempegowda Bus Stand",   destination: "Vidyaranyapura",         operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 30 },
          { districtId: did, routeNumber: "218E",   origin: "Shivajinagar",           destination: "Koramangala",            operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 25 },
          { districtId: did, routeNumber: "150T",   origin: "Kempegowda Bus Stand",   destination: "Banashankari",           operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 25 },
          { districtId: did, routeNumber: "315S",   origin: "Kempegowda Bus Stand",   destination: "Jayanagar 9th Block",    operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "225C",   origin: "Kempegowda Bus Stand",   destination: "BTM Layout",             operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "600D",   origin: "Kempegowda Bus Stand",   destination: "Doddaballapur",          operator: "BMTC", busType: "Ordinary",   frequency: "30 min", fare: 50 },
          { districtId: did, routeNumber: "401J",   origin: "Kempegowda Bus Stand",   destination: "JP Nagar 6th Phase",     operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 30 },
          { districtId: did, routeNumber: "700A",   origin: "Kempegowda Bus Stand",   destination: "Anekal",                 operator: "BMTC", busType: "Ordinary",   frequency: "30 min", fare: 60 },
          { districtId: did, routeNumber: "700B",   origin: "Kempegowda Bus Stand",   destination: "Chandapura",             operator: "BMTC", busType: "Ordinary",   frequency: "25 min", fare: 55 },
          { districtId: did, routeNumber: "700E",   origin: "Silk Board",             destination: "Electronic City Ph-2",   operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 25 },
          { districtId: did, routeNumber: "KIA-1",  origin: "Kempegowda Bus Stand",   destination: "Kempegowda Int. Airport",operator: "BMTC", busType: "Vayu Vajra", frequency: "20 min", fare: 310 },
          { districtId: did, routeNumber: "KIA-3",  origin: "Domlur",                 destination: "Kempegowda Int. Airport",operator: "BMTC", busType: "Vayu Vajra", frequency: "30 min", fare: 310 },
          { districtId: did, routeNumber: "KIA-5",  origin: "Shivajinagar",           destination: "Kempegowda Int. Airport",operator: "BMTC", busType: "Vayu Vajra", frequency: "30 min", fare: 310 },
          { districtId: did, routeNumber: "KIA-7",  origin: "Silk Board",             destination: "Kempegowda Int. Airport",operator: "BMTC", busType: "Vayu Vajra", frequency: "30 min", fare: 310 },
          { districtId: did, routeNumber: "KIA-8",  origin: "Koramangala",            destination: "Kempegowda Int. Airport",operator: "BMTC", busType: "Vayu Vajra", frequency: "30 min", fare: 310 },
          { districtId: did, routeNumber: "400J",   origin: "Yeshwanthpur",           destination: "Jalahalli",              operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 20 },
          { districtId: did, routeNumber: "219M",   origin: "Shivajinagar",           destination: "Mahadevapura",           operator: "BMTC", busType: "Ordinary",   frequency: "12 min", fare: 35 },
          { districtId: did, routeNumber: "600H",   origin: "Kempegowda Bus Stand",   destination: "Hebbal Lake",            operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "600RT",  origin: "Kempegowda Bus Stand",   destination: "RT Nagar",               operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 25 },
          { districtId: did, routeNumber: "388W",   origin: "Shivajinagar",           destination: "Whitefield Via ITPL",    operator: "BMTC", busType: "Ordinary",   frequency: "12 min", fare: 40 },
          { districtId: did, routeNumber: "193G",   origin: "Kempegowda Bus Stand",   destination: "Silk Board Via Gavipuram",operator: "BMTC",busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "401N",   origin: "Kempegowda Bus Stand",   destination: "Nagarbhavi",             operator: "BMTC", busType: "Ordinary",   frequency: "12 min", fare: 25 },
          { districtId: did, routeNumber: "500T",   origin: "Kempegowda Bus Stand",   destination: "Tumkur Road Satellite",  operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 30 },
          { districtId: did, routeNumber: "600BY",  origin: "Kempegowda Bus Stand",   destination: "Byatarayanapura",        operator: "BMTC", busType: "Ordinary",   frequency: "12 min", fare: 30 },
          { districtId: did, routeNumber: "201MJ",  origin: "Marathahalli",           destination: "Jayanagar 4th Block",    operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 35 },
          { districtId: did, routeNumber: "510S",   origin: "Silk Board",             destination: "Sarjapur Attibele",      operator: "BMTC", busType: "Ordinary",   frequency: "25 min", fare: 40 },
          { districtId: did, routeNumber: "400BW",  origin: "Yeshwanthpur",           destination: "Bannerghatta",           operator: "BMTC", busType: "Ordinary",   frequency: "20 min", fare: 40 },
          { districtId: did, routeNumber: "273KR",  origin: "KR Puram",               destination: "Koramangala",            operator: "BMTC", busType: "Ordinary",   frequency: "15 min", fare: 35 },
          { districtId: did, routeNumber: "216WF",  origin: "Indiranagar",            destination: "Whitefield",             operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 30 },
          { districtId: did, routeNumber: "601V",   origin: "Kempegowda Bus Stand",   destination: "Vijayanagar",            operator: "BMTC", busType: "Ordinary",   frequency: "8 min",  fare: 20 },
          { districtId: did, routeNumber: "401M",   origin: "Kempegowda Bus Stand",   destination: "Malleswaram",            operator: "BMTC", busType: "Ordinary",   frequency: "5 min",  fare: 15 },
          { districtId: did, routeNumber: "6E",     origin: "Shivajinagar",           destination: "Banaswadi",              operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "273A",   origin: "Kempegowda Bus Stand",   destination: "Adugodi",                operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
          { districtId: did, routeNumber: "366A",   origin: "Kempegowda Bus Stand",   destination: "Kanakapura Town",        operator: "BMTC", busType: "Ordinary",   frequency: "30 min", fare: 60 },
          { districtId: did, routeNumber: "600P",   origin: "Kempegowda Bus Stand",   destination: "Peenya Industrial Area", operator: "BMTC", busType: "Ordinary",   frequency: "10 min", fare: 25 },
        ],
      });
      console.log("  ✓ 50 bus routes");
    } else {
      console.log("  ↩ Bus routes already seeded");
    }

    console.log("  ✅ Bengaluru Ext-A complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedBengaluruDataExtA(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
