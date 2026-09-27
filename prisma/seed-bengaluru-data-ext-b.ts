// ═══════════════════════════════════════════════════════════
// Bengaluru Urban — Extended Data Part B
// 100 Schools · 28 Assembly + 3 LS Elections · Budget (₹19k Cr)
// Run standalone: npx tsx prisma/seed-bengaluru-data-ext-b.ts
// ═══════════════════════════════════════════════════════════
import { PrismaClient } from "../src/generated/prisma";
import { electionResultKey } from "../src/lib/dedupe/keys";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function makeClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function seedBengaluruDataExtB(prisma?: PrismaClient) {
  const client = prisma ?? makeClient();
  const standalone = !prisma;

  try {
    console.log("\n🏫 [Ext-B] Bengaluru — Schools, Elections, Budget...");

    const karnataka = await client.state.findUniqueOrThrow({ where: { slug: "karnataka" } });
    const bu = await client.district.findUniqueOrThrow({
      where: { stateId_slug: { stateId: karnataka.id, slug: "bengaluru-urban" } },
    });
    const did = bu.id;

    const tN = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-north" } } });
    const tS = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-south" } } });
    const tE = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "bengaluru-east"  } } });
    const tA = await client.taluk.findUniqueOrThrow({ where: { districtId_slug: { districtId: did, slug: "anekal"          } } });

    // ── 1. Schools (100) ─────────────────────────────────────
    const existingSch = await client.school.count({ where: { districtId: did } });
    if (existingSch < 100) {
      // North Taluk — 25 schools
      await client.school.createMany({ skipDuplicates: true, data: [
        { districtId: did, talukId: tN.id, name: "Government High School Yelahanka",                  type: "Government",        level: "Secondary",        address: "Yelahanka New Town, 560064",          students: 650,  teachers: 22 },
        { districtId: did, talukId: tN.id, name: "Government First Grade High School Yelahanka",      type: "Government",        level: "Higher Secondary", address: "Yelahanka New Town, 560064",          students: 420,  teachers: 18 },
        { districtId: did, talukId: tN.id, name: "Government High School Hebbal",                     type: "Government",        level: "Secondary",        address: "Hebbal, Bengaluru 560024",            students: 580,  teachers: 19 },
        { districtId: did, talukId: tN.id, name: "Kendriya Vidyalaya Yelahanka Air Force Station",    type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Air Force Station Yelahanka, 560006",  students: 1200, teachers: 52 },
        { districtId: did, talukId: tN.id, name: "Kendriya Vidyalaya Jalahalli",                      type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Jalahalli West, Bengaluru 560013",    students: 1050, teachers: 45 },
        { districtId: did, talukId: tN.id, name: "Delhi Public School North Bengaluru",               type: "Private Unaided",   level: "Higher Secondary", address: "Yelahanka, Bengaluru 560064",         students: 3200, teachers: 120 },
        { districtId: did, talukId: tN.id, name: "National Public School Yeshwanthpur",               type: "Private Unaided",   level: "Higher Secondary", address: "Yeshwanthpur, Bengaluru 560022",      students: 2800, teachers: 108 },
        { districtId: did, talukId: tN.id, name: "Ryan International School Byatarayanapura",         type: "Private Unaided",   level: "Higher Secondary", address: "Byatarayanapura, Bengaluru 560026",   students: 2200, teachers: 88 },
        { districtId: did, talukId: tN.id, name: "Government High School Doddaballapur",              type: "Government",        level: "Secondary",        address: "Doddaballapur, Bengaluru 561203",     students: 520,  teachers: 17 },
        { districtId: did, talukId: tN.id, name: "Government High School Devanahalli",                type: "Government",        level: "Secondary",        address: "Devanahalli Town, 562110",            students: 480,  teachers: 16 },
        { districtId: did, talukId: tN.id, name: "Government Model Primary School Hesaraghatta",      type: "Government",        level: "Primary",          address: "Hesaraghatta Road, 560088",           students: 310,  teachers: 12 },
        { districtId: did, talukId: tN.id, name: "Sri Kumaran Children's Home Malleshwaram",          type: "Government Aided",  level: "Higher Secondary", address: "8th Cross Malleshwaram, 560003",      students: 1800, teachers: 70 },
        { districtId: did, talukId: tN.id, name: "Kendriya Vidyalaya CPRI",                           type: "Kendriya Vidyalaya", level: "Secondary",        address: "CPRI Campus, Malleshwaram, 560012",   students: 980,  teachers: 42 },
        { districtId: did, talukId: tN.id, name: "Government High School Dasarahalli",                type: "Government",        level: "Secondary",        address: "Dasarahalli, Bengaluru 560057",       students: 490,  teachers: 16 },
        { districtId: did, talukId: tN.id, name: "GHPS Kodigehalli",                                  type: "Government",        level: "Primary",          address: "Kodigehalli, Bengaluru 560092",       students: 280,  teachers: 10 },
        { districtId: did, talukId: tN.id, name: "Presidency School RT Nagar",                        type: "Private Unaided",   level: "Secondary",        address: "RT Nagar, Bengaluru 560032",          students: 1400, teachers: 52 },
        { districtId: did, talukId: tN.id, name: "Trio World Academy Bengaluru North",                type: "Private Unaided",   level: "Higher Secondary", address: "Yelahanka, Bengaluru 560064",         students: 1600, teachers: 62 },
        { districtId: did, talukId: tN.id, name: "National English School Byatarayanapura",           type: "Private Unaided",   level: "Secondary",        address: "Byatarayanapura, Bengaluru 560026",   students: 1100, teachers: 42 },
        { districtId: did, talukId: tN.id, name: "Government High School Vidyaranyapura",             type: "Government",        level: "Secondary",        address: "Vidyaranyapura, Bengaluru 560097",    students: 550,  teachers: 18 },
        { districtId: did, talukId: tN.id, name: "GHPS Bagalgunte",                                   type: "Government",        level: "Primary",          address: "Bagalgunte, Bengaluru 560073",        students: 260,  teachers: 9 },
        { districtId: did, talukId: tN.id, name: "St Joseph's Boys High School Malleshwaram",         type: "Government Aided",  level: "Secondary",        address: "Malleshwaram, Bengaluru 560003",      students: 1200, teachers: 46 },
        { districtId: did, talukId: tN.id, name: "New Horizon Gurukul North Bengaluru",               type: "Private Unaided",   level: "Higher Secondary", address: "Kalyannagar, Bengaluru 560043",       students: 2400, teachers: 94 },
        { districtId: did, talukId: tN.id, name: "GHS Mahalakshmi Layout",                            type: "Government",        level: "Secondary",        address: "Mahalakshmi Layout, 560086",          students: 610,  teachers: 20 },
        { districtId: did, talukId: tN.id, name: "GHPS Hesaraghatta Cross",                           type: "Government",        level: "Primary",          address: "Hesaraghatta, Bengaluru 560088",      students: 230,  teachers: 8 },
        { districtId: did, talukId: tN.id, name: "Kendriya Vidyalaya Hebbal",                         type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Hebbal, Bengaluru 560024",            students: 1100, teachers: 46 },
      ]});

      // South Taluk — 25 schools
      await client.school.createMany({ skipDuplicates: true, data: [
        { districtId: did, talukId: tS.id, name: "Bishop Cotton Boys' School",                        type: "Government Aided",  level: "Secondary",        address: "St Mark's Road, Bengaluru 560001",    students: 1600, teachers: 65 },
        { districtId: did, talukId: tS.id, name: "Baldwin Boys' High School",                         type: "Government Aided",  level: "Higher Secondary", address: "Museum Road, Bengaluru 560025",        students: 2200, teachers: 85 },
        { districtId: did, talukId: tS.id, name: "National High School Basavanagudi",                 type: "Government Aided",  level: "Higher Secondary", address: "Basavanagudi, Bengaluru 560004",       students: 3000, teachers: 110 },
        { districtId: did, talukId: tS.id, name: "Clarence High School",                              type: "Government Aided",  level: "Secondary",        address: "Museum Road, Bengaluru 560025",        students: 1400, teachers: 54 },
        { districtId: did, talukId: tS.id, name: "Sacred Heart Girls' High School",                   type: "Government Aided",  level: "Secondary",        address: "Sheshadripuram, Bengaluru 560020",    students: 1200, teachers: 46 },
        { districtId: did, talukId: tS.id, name: "Government High School Jayanagar",                  type: "Government",        level: "Secondary",        address: "4th Block Jayanagar, 560041",          students: 700,  teachers: 24 },
        { districtId: did, talukId: tS.id, name: "Government First Grade High School JP Nagar",       type: "Government",        level: "Higher Secondary", address: "JP Nagar 6th Phase, 560078",           students: 450,  teachers: 19 },
        { districtId: did, talukId: tS.id, name: "Government High School Banashankari",               type: "Government",        level: "Secondary",        address: "Banashankari 3rd Stage, 560085",       students: 620,  teachers: 21 },
        { districtId: did, talukId: tS.id, name: "National Public School Banashankari",               type: "Private Unaided",   level: "Higher Secondary", address: "Banashankari, Bengaluru 560050",       students: 2800, teachers: 110 },
        { districtId: did, talukId: tS.id, name: "Delhi Public School South Bengaluru",               type: "Private Unaided",   level: "Higher Secondary", address: "JP Nagar, Bengaluru 560078",           students: 3000, teachers: 118 },
        { districtId: did, talukId: tS.id, name: "Ryan International School Bannerghatta Road",       type: "Private Unaided",   level: "Higher Secondary", address: "Bannerghatta Road, 560083",            students: 2100, teachers: 82 },
        { districtId: did, talukId: tS.id, name: "Kendriya Vidyalaya NAL",                            type: "Kendriya Vidyalaya", level: "Secondary",        address: "NAL Campus, Kodihalli, 560017",        students: 1000, teachers: 43 },
        { districtId: did, talukId: tS.id, name: "St Paul's High School Jayanagar",                   type: "Government Aided",  level: "Secondary",        address: "Jayanagar, Bengaluru 560011",          students: 1300, teachers: 50 },
        { districtId: did, talukId: tS.id, name: "GHPS Kanakapura Road",                              type: "Government",        level: "Primary",          address: "Kanakapura Road, 560062",              students: 300,  teachers: 11 },
        { districtId: did, talukId: tS.id, name: "Oxford High School BTM Layout",                     type: "Private Unaided",   level: "Secondary",        address: "BTM Layout 2nd Stage, 560076",         students: 1800, teachers: 70 },
        { districtId: did, talukId: tS.id, name: "Government High School BTM Layout",                 type: "Government",        level: "Secondary",        address: "BTM Layout 1st Stage, 560029",         students: 580,  teachers: 19 },
        { districtId: did, talukId: tS.id, name: "Kendriya Vidyalaya DRDO",                           type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "DRDO Campus, Bengaluru 560075",        students: 1150, teachers: 49 },
        { districtId: did, talukId: tS.id, name: "Vijaya High School Basavanagudi",                   type: "Government Aided",  level: "Higher Secondary", address: "Basavanagudi, Bengaluru 560004",       students: 1600, teachers: 62 },
        { districtId: did, talukId: tS.id, name: "Bethany High School JP Nagar",                      type: "Government Aided",  level: "Secondary",        address: "JP Nagar 4th Phase, 560078",           students: 1100, teachers: 43 },
        { districtId: did, talukId: tS.id, name: "Government High School Vijayanagar",                type: "Government",        level: "Secondary",        address: "Vijayanagar, Bengaluru 560040",        students: 640,  teachers: 21 },
        { districtId: did, talukId: tS.id, name: "Shree Swaminarayan Gurukul Banashankari",           type: "Private Unaided",   level: "Higher Secondary", address: "Banashankari, Bengaluru 560085",       students: 1400, teachers: 55 },
        { districtId: did, talukId: tS.id, name: "GHPS Padmanabhanagar",                              type: "Government",        level: "Primary",          address: "Padmanabhanagar, 560070",              students: 290,  teachers: 10 },
        { districtId: did, talukId: tS.id, name: "Kendriya Vidyalaya No. 2 Bengaluru",                type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "Vijayanagar, Bengaluru 560040",        students: 1200, teachers: 51 },
        { districtId: did, talukId: tS.id, name: "Millennium International School Jayanagar",         type: "Private Unaided",   level: "Secondary",        address: "Jayanagar 9th Block, 560069",          students: 1600, teachers: 62 },
        { districtId: did, talukId: tS.id, name: "St Francis Xavier High School Basavanagudi",        type: "Government Aided",  level: "Secondary",        address: "Basavanagudi, Bengaluru 560004",       students: 980,  teachers: 38 },
      ]});

      // East Taluk — 25 schools
      await client.school.createMany({ skipDuplicates: true, data: [
        { districtId: did, talukId: tE.id, name: "VIBGYOR High Whitefield",                           type: "Private Unaided",   level: "Higher Secondary", address: "Whitefield Main Road, 560066",         students: 2600, teachers: 102 },
        { districtId: did, talukId: tE.id, name: "Indus International School Whitefield",             type: "Private Unaided",   level: "Higher Secondary", address: "Billapura Cross, Sarjapur, 560035",    students: 1800, teachers: 120 },
        { districtId: did, talukId: tE.id, name: "Inventure Academy Whitefield",                      type: "Private Unaided",   level: "Higher Secondary", address: "Whitefield, Bengaluru 560066",         students: 2000, teachers: 95 },
        { districtId: did, talukId: tE.id, name: "New Horizon Gurukul Marathahalli",                  type: "Private Unaided",   level: "Higher Secondary", address: "Marathahalli, Bengaluru 560037",       students: 2400, teachers: 94 },
        { districtId: did, talukId: tE.id, name: "Delhi Public School Whitefield",                    type: "Private Unaided",   level: "Higher Secondary", address: "Whitefield, Bengaluru 560066",         students: 3100, teachers: 122 },
        { districtId: did, talukId: tE.id, name: "Ryan International School Whitefield",              type: "Private Unaided",   level: "Higher Secondary", address: "Whitefield, Bengaluru 560066",         students: 2200, teachers: 87 },
        { districtId: did, talukId: tE.id, name: "Government High School Marathahalli",               type: "Government",        level: "Secondary",        address: "Marathahalli, Bengaluru 560037",       students: 600,  teachers: 20 },
        { districtId: did, talukId: tE.id, name: "Government High School KR Puram",                   type: "Government",        level: "Secondary",        address: "KR Puram, Bengaluru 560036",           students: 680,  teachers: 23 },
        { districtId: did, talukId: tE.id, name: "GHPS Banaswadi",                                    type: "Government",        level: "Primary",          address: "Banaswadi, Bengaluru 560033",          students: 310,  teachers: 11 },
        { districtId: did, talukId: tE.id, name: "Government High School Indiranagar",                type: "Government",        level: "Secondary",        address: "Indiranagar, Bengaluru 560038",        students: 570,  teachers: 19 },
        { districtId: did, talukId: tE.id, name: "Kendriya Vidyalaya ADE",                            type: "Kendriya Vidyalaya", level: "Secondary",        address: "ADE Campus, Marathahalli, 560037",     students: 1050, teachers: 45 },
        { districtId: did, talukId: tE.id, name: "Kendriya Vidyalaya DRDL Whitefield",                type: "Kendriya Vidyalaya", level: "Higher Secondary", address: "DRDL Campus, Whitefield, 560066",      students: 980,  teachers: 42 },
        { districtId: did, talukId: tE.id, name: "St Francis Xavier High School Marathahalli",        type: "Government Aided",  level: "Secondary",        address: "Marathahalli, Bengaluru 560037",       students: 1200, teachers: 46 },
        { districtId: did, talukId: tE.id, name: "Bethany Junior College HSR Layout",                 type: "Government Aided",  level: "Higher Secondary", address: "HSR Layout, Bengaluru 560102",         students: 900,  teachers: 40 },
        { districtId: did, talukId: tE.id, name: "National Public School Koramangala",                type: "Private Unaided",   level: "Higher Secondary", address: "5th Block Koramangala, 560095",        students: 2800, teachers: 110 },
        { districtId: did, talukId: tE.id, name: "BGS National Public School",                        type: "Private Unaided",   level: "Higher Secondary", address: "HSR Layout, Bengaluru 560102",         students: 2600, teachers: 102 },
        { districtId: did, talukId: tE.id, name: "Government High School HSR Layout",                 type: "Government",        level: "Secondary",        address: "HSR Layout Sector 7, 560102",          students: 540,  teachers: 18 },
        { districtId: did, talukId: tE.id, name: "GHPS Marathahalli",                                 type: "Government",        level: "Primary",          address: "Marathahalli Bridge, 560037",          students: 280,  teachers: 10 },
        { districtId: did, talukId: tE.id, name: "Oxford Senior Secondary School Indiranagar",        type: "Private Unaided",   level: "Higher Secondary", address: "Indiranagar, Bengaluru 560038",        students: 1700, teachers: 66 },
        { districtId: did, talukId: tE.id, name: "Adarsha Vidyalaya KR Puram",                        type: "Government",        level: "Secondary",        address: "KR Puram, Bengaluru 560036",           students: 620,  teachers: 21 },
        { districtId: did, talukId: tE.id, name: "GHPS Whitefield",                                   type: "Government",        level: "Primary",          address: "Whitefield, Bengaluru 560066",         students: 270,  teachers: 10 },
        { districtId: did, talukId: tE.id, name: "Sarjapur Road International School",                type: "Private Unaided",   level: "Higher Secondary", address: "Sarjapur Road, Bengaluru 560035",      students: 2200, teachers: 86 },
        { districtId: did, talukId: tE.id, name: "Kendriya Vidyalaya NGEF",                           type: "Kendriya Vidyalaya", level: "Secondary",        address: "NGEF Campus, Mahadevapura, 560048",    students: 960,  teachers: 41 },
        { districtId: did, talukId: tE.id, name: "St Paul's English School Marathahalli",             type: "Government Aided",  level: "Secondary",        address: "Marathahalli, Bengaluru 560037",       students: 1100, teachers: 43 },
        { districtId: did, talukId: tE.id, name: "Bishop Sargent Higher Secondary School",            type: "Government Aided",  level: "Higher Secondary", address: "Banaswadi, Bengaluru 560033",          students: 950,  teachers: 39 },
      ]});

      // Anekal Taluk — 25 schools
      await client.school.createMany({ skipDuplicates: true, data: [
        { districtId: did, talukId: tA.id, name: "Government High School Electronic City",            type: "Government",        level: "Secondary",        address: "Electronic City Phase 1, 560100",      students: 720,  teachers: 24 },
        { districtId: did, talukId: tA.id, name: "Government First Grade High School Electronic City",type: "Government",        level: "Higher Secondary", address: "Electronic City Phase 2, 560100",      students: 460,  teachers: 20 },
        { districtId: did, talukId: tA.id, name: "Government High School Anekal Town",                type: "Government",        level: "Secondary",        address: "Anekal Town, Bengaluru 562106",        students: 520,  teachers: 17 },
        { districtId: did, talukId: tA.id, name: "GHPS Chandapura",                                   type: "Government",        level: "Primary",          address: "Chandapura, Bengaluru 562106",         students: 320,  teachers: 11 },
        { districtId: did, talukId: tA.id, name: "Government High School Attibele",                   type: "Government",        level: "Secondary",        address: "Attibele, Bengaluru 562107",           students: 490,  teachers: 16 },
        { districtId: did, talukId: tA.id, name: "National Public School Electronic City",            type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City, Bengaluru 560100",    students: 2900, teachers: 114 },
        { districtId: did, talukId: tA.id, name: "Ryan International School Electronic City",         type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City Phase 1, 560100",      students: 2200, teachers: 87 },
        { districtId: did, talukId: tA.id, name: "Orchids The International School Electronic City",  type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City, Bengaluru 560100",    students: 2400, teachers: 94 },
        { districtId: did, talukId: tA.id, name: "Delhi Public School Electronic City",               type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City Phase 2, 560100",      students: 3000, teachers: 118 },
        { districtId: did, talukId: tA.id, name: "Government High School Sarjapur",                   type: "Government",        level: "Secondary",        address: "Sarjapur, Bengaluru 562125",           students: 540,  teachers: 18 },
        { districtId: did, talukId: tA.id, name: "GHPS Sarjapur",                                     type: "Government",        level: "Primary",          address: "Sarjapur, Bengaluru 562125",           students: 290,  teachers: 10 },
        { districtId: did, talukId: tA.id, name: "Sri Chaitanya Techno School Electronic City",       type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City Phase 1, 560100",      students: 1800, teachers: 70 },
        { districtId: did, talukId: tA.id, name: "Carmel Convent High School Electronic City",        type: "Government Aided",  level: "Secondary",        address: "Electronic City, Bengaluru 560100",    students: 1100, teachers: 43 },
        { districtId: did, talukId: tA.id, name: "Government High School Begur",                      type: "Government",        level: "Secondary",        address: "Begur Road, Bengaluru 560068",         students: 510,  teachers: 17 },
        { districtId: did, talukId: tA.id, name: "GHPS Attibele",                                     type: "Government",        level: "Primary",          address: "Attibele, Bengaluru 562107",           students: 260,  teachers: 9 },
        { districtId: did, talukId: tA.id, name: "National High School Anekal",                       type: "Government Aided",  level: "Higher Secondary", address: "Anekal Town, 562106",                  students: 1200, teachers: 46 },
        { districtId: did, talukId: tA.id, name: "Jawahar Navodaya Vidyalaya Bengaluru South",        type: "Navodaya",          level: "Higher Secondary", address: "Attibele Road, Anekal, 562106",        students: 480,  teachers: 26 },
        { districtId: did, talukId: tA.id, name: "VIBGYOR High School Electronic City",               type: "Private Unaided",   level: "Higher Secondary", address: "Electronic City Phase 2, 560100",      students: 2500, teachers: 98 },
        { districtId: did, talukId: tA.id, name: "Ryan International School Sarjapur Road",           type: "Private Unaided",   level: "Higher Secondary", address: "Sarjapur Road, Bengaluru 562125",      students: 2100, teachers: 83 },
        { districtId: did, talukId: tA.id, name: "New Horizon International School Chandapura",       type: "Private Unaided",   level: "Secondary",        address: "Chandapura, Bengaluru 562106",         students: 1200, teachers: 46 },
        { districtId: did, talukId: tA.id, name: "GHPS Electronic City Phase 2",                      type: "Government",        level: "Primary",          address: "Electronic City Phase 2, 560100",      students: 330,  teachers: 11 },
        { districtId: did, talukId: tA.id, name: "Sree Narayana Vidyakendra Anekal",                  type: "Government Aided",  level: "Secondary",        address: "Anekal Town, 562106",                  students: 880,  teachers: 34 },
        { districtId: did, talukId: tA.id, name: "St Philomena's School Chandapura",                  type: "Government Aided",  level: "Secondary",        address: "Chandapura, Bengaluru 562106",         students: 950,  teachers: 37 },
        { districtId: did, talukId: tA.id, name: "Government High School Chandapura",                 type: "Government",        level: "Secondary",        address: "Chandapura, Bengaluru 562106",         students: 500,  teachers: 17 },
        { districtId: did, talukId: tA.id, name: "Kendriya Vidyalaya Electronic City",                type: "Kendriya Vidyalaya", level: "Secondary",        address: "Electronic City, Bengaluru 560100",    students: 1050, teachers: 45 },
      ]});
      console.log("  ✓ 100 schools");
    } else {
      console.log("  ↩ Schools already seeded");
    }

    // ── 2. Election Results ───────────────────────────────────
    const existingEle = await client.electionResult.count({ where: { districtId: did } });
    if (existingEle < 30) {
      // 28 Assembly — 2023 Karnataka state election
      // Rows whose seat is already stored (canonical key: same year, type and
      // constituency without seat number) are skipped — the base seed stores
      // the three Lok Sabha seats and three assembly seats too.
      const storedEle = await client.electionResult.findMany({
        where: { districtId: did },
        select: { districtId: true, year: true, electionType: true, constituency: true },
      });
      const storedKeys = new Set(storedEle.map(electionResultKey));
      const eleRows = [
        // Bengaluru North Taluk area
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Yeshwanthpur",      winnerName: "S.T. Somashekar",          winnerParty: "INC", winnerVotes: 78542, runnerUpName: "S.R. Vishwanath (Sr)", runnerUpParty: "BJP", runnerUpVotes: 61204, totalVoters: 218000, votesPolled: 152000, turnoutPct: 69.7, margin: 17338, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Yelahanka",         winnerName: "S.R. Vishwanath",          winnerParty: "BJP", winnerVotes: 82104, runnerUpName: "G. Manjunath",          runnerUpParty: "INC", runnerUpVotes: 63500, totalVoters: 225000, votesPolled: 158000, turnoutPct: 70.2, margin: 18604, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Byatarayanapura",   winnerName: "Krishna Byregowda",        winnerParty: "INC", winnerVotes: 91200, runnerUpName: "S. Ratnakar",           runnerUpParty: "BJP", runnerUpVotes: 58300, totalVoters: 232000, votesPolled: 162000, turnoutPct: 69.8, margin: 32900, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Dasarahalli",       winnerName: "M.S. Manchunath",          winnerParty: "INC", winnerVotes: 74800, runnerUpName: "S. Gopal",              runnerUpParty: "BJP", runnerUpVotes: 58100, totalVoters: 205000, votesPolled: 146000, turnoutPct: 71.2, margin: 16700, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Mahalakshmi Layout",winnerName: "Muni Ratnamma",            winnerParty: "INC", winnerVotes: 71200, runnerUpName: "B. Gopalaiah",          runnerUpParty: "BJP", runnerUpVotes: 56400, totalVoters: 198000, votesPolled: 141000, turnoutPct: 71.2, margin: 14800, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Malleshwaram",      winnerName: "C.N. Ashwath Narayan",     winnerParty: "BJP", winnerVotes: 79600, runnerUpName: "Ravi Subramanya",       runnerUpParty: "INC", runnerUpVotes: 65300, totalVoters: 215000, votesPolled: 155000, turnoutPct: 72.1, margin: 14300, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Hebbal",            winnerName: "Byrathi Suresh",           winnerParty: "INC", winnerVotes: 88400, runnerUpName: "B.S. Keerthi Kumar",    runnerUpParty: "BJP", runnerUpVotes: 62800, totalVoters: 228000, votesPolled: 164000, turnoutPct: 71.9, margin: 25600, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Pulakeshinagar",    winnerName: "Akhanda Srinivas Murthy",  winnerParty: "INC", winnerVotes: 65200, runnerUpName: "R. Janardhana",         runnerUpParty: "BJP", runnerUpVotes: 48300, totalVoters: 188000, votesPolled: 130000, turnoutPct: 69.1, margin: 16900, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Sarvagnanagar",     winnerName: "R.K. Ramachandran",        winnerParty: "INC", winnerVotes: 76400, runnerUpName: "T.A. Sharavana Kumar",  runnerUpParty: "BJP", runnerUpVotes: 55800, totalVoters: 210000, votesPolled: 144000, turnoutPct: 68.6, margin: 20600, source: "ECI" },
        // Central area
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Shivajinagar",      winnerName: "Rizwan Arshad",            winnerParty: "INC", winnerVotes: 68900, runnerUpName: "N. Ravi Kumar",         runnerUpParty: "BJP", runnerUpVotes: 45200, totalVoters: 185000, votesPolled: 128000, turnoutPct: 69.2, margin: 23700, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Shanti Nagar",      winnerName: "N.A. Haris",               winnerParty: "INC", winnerVotes: 72400, runnerUpName: "B.N. Prahlad Murthy",   runnerUpParty: "BJP", runnerUpVotes: 50100, totalVoters: 192000, votesPolled: 134000, turnoutPct: 69.8, margin: 22300, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Gandhi Nagar",      winnerName: "Dinesh Gundu Rao",         winnerParty: "INC", winnerVotes: 80600, runnerUpName: "C.P. Yogeshwar",        runnerUpParty: "BJP", runnerUpVotes: 54800, totalVoters: 208000, votesPolled: 148000, turnoutPct: 71.2, margin: 25800, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Rajajinagar",       winnerName: "S. Suresh Kumar",          winnerParty: "BJP", winnerVotes: 81200, runnerUpName: "S. Rajesh",             runnerUpParty: "INC", runnerUpVotes: 64500, totalVoters: 218000, votesPolled: 158000, turnoutPct: 72.5, margin: 16700, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Govindraj Nagar",   winnerName: "Priya Krishna",            winnerParty: "INC", winnerVotes: 75200, runnerUpName: "V. Muniraju",           runnerUpParty: "BJP", runnerUpVotes: 58800, totalVoters: 205000, votesPolled: 146000, turnoutPct: 71.2, margin: 16400, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Vijayanagar",       winnerName: "M. Krishnappa",            winnerParty: "INC", winnerVotes: 78800, runnerUpName: "B.R. Harish",           runnerUpParty: "BJP", runnerUpVotes: 62400, totalVoters: 212000, votesPolled: 153000, turnoutPct: 72.2, margin: 16400, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Chamarajpet",       winnerName: "Zameer Ahmed Khan",        winnerParty: "INC", winnerVotes: 69800, runnerUpName: "M. Satish Kumar",       runnerUpParty: "BJP", runnerUpVotes: 48600, totalVoters: 178000, votesPolled: 128000, turnoutPct: 71.9, margin: 21200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Chickpet",          winnerName: "Uday B. Garudachar",       winnerParty: "BJP", winnerVotes: 62400, runnerUpName: "Roshan Baig",           runnerUpParty: "INC", runnerUpVotes: 51200, totalVoters: 172000, votesPolled: 120000, turnoutPct: 69.8, margin: 11200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Basavanagudi",      winnerName: "Sowmya Reddy",             winnerParty: "INC", winnerVotes: 74600, runnerUpName: "Ravi Subramanya",       runnerUpParty: "BJP", runnerUpVotes: 58400, totalVoters: 198000, votesPolled: 143000, turnoutPct: 72.2, margin: 16200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Padmanabhanagar",   winnerName: "R. Ramalinga Reddy",       winnerParty: "INC", winnerVotes: 76200, runnerUpName: "B.Y. Vijayendra",       runnerUpParty: "BJP", runnerUpVotes: 59800, totalVoters: 204000, votesPolled: 147000, turnoutPct: 72.1, margin: 16400, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "BTM Layout",        winnerName: "R. Ramalinga Reddy (Jr)",  winnerParty: "INC", winnerVotes: 79800, runnerUpName: "T.G. Nagesh",           runnerUpParty: "BJP", runnerUpVotes: 58200, totalVoters: 214000, votesPolled: 152000, turnoutPct: 71.0, margin: 21600, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Jayanagar",         winnerName: "B.Z. Zameer Ahmed Khan",   winnerParty: "INC", winnerVotes: 82400, runnerUpName: "C.K. Ramamurthy",       runnerUpParty: "BJP", runnerUpVotes: 60200, totalVoters: 218000, votesPolled: 156000, turnoutPct: 71.6, margin: 22200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Bommanahalli",      winnerName: "Satish Reddy",             winnerParty: "BJP", winnerVotes: 85600, runnerUpName: "Poornima Srinivas",     runnerUpParty: "INC", runnerUpVotes: 68400, totalVoters: 228000, votesPolled: 168000, turnoutPct: 73.7, margin: 17200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Bangalore South",   winnerName: "M. Krishnappa",            winnerParty: "INC", winnerVotes: 78600, runnerUpName: "R. Ashoka (Sr)",        runnerUpParty: "BJP", runnerUpVotes: 62800, totalVoters: 212000, votesPolled: 153000, turnoutPct: 72.2, margin: 15800, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Mahadevapura",      winnerName: "Arvind Limbavali",         winnerParty: "BJP", winnerVotes: 88200, runnerUpName: "N. Ravikumar",          runnerUpParty: "INC", runnerUpVotes: 68600, totalVoters: 232000, votesPolled: 172000, turnoutPct: 74.1, margin: 19600, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "KR Puram",          winnerName: "Byron Vijay",              winnerParty: "BJP", winnerVotes: 82600, runnerUpName: "S. Muniraju",           runnerUpParty: "INC", runnerUpVotes: 66400, totalVoters: 226000, votesPolled: 164000, turnoutPct: 72.6, margin: 16200, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Indiranagar",       winnerName: "Rizwan Arshad (Jr)",       winnerParty: "INC", winnerVotes: 74200, runnerUpName: "H. Rajendra Prasad",    runnerUpParty: "BJP", runnerUpVotes: 56800, totalVoters: 198000, votesPolled: 142000, turnoutPct: 71.7, margin: 17400, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Anekal",            winnerName: "Srinivasgowda",            winnerParty: "BJP", winnerVotes: 76800, runnerUpName: "M. Shivalinge Gowda",   runnerUpParty: "INC", runnerUpVotes: 62400, totalVoters: 208000, votesPolled: 152000, turnoutPct: 73.1, margin: 14400, source: "ECI" },
        { districtId: did, year: 2023, electionType: "ASSEMBLY", constituency: "Bengaluru South",   winnerName: "Tejasvi Surya (MLA)",      winnerParty: "BJP", winnerVotes: 80400, runnerUpName: "S. Nagaraj",            runnerUpParty: "INC", runnerUpVotes: 63600, totalVoters: 218000, votesPolled: 157000, turnoutPct: 72.0, margin: 16800, source: "ECI" },
        // 3 Lok Sabha 2024
        { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru North",   winnerName: "Shobha Karandlaje",        winnerParty: "BJP", winnerVotes: 785420, runnerUpName: "M.V. Rajeev Gowda",    runnerUpParty: "INC", runnerUpVotes: 612800, totalVoters: 1820000, votesPolled: 1298000, turnoutPct: 71.3, margin: 172620, source: "ECI 2024" },
        { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru Central", winnerName: "P.C. Mohan",               winnerParty: "BJP", winnerVotes: 752640, runnerUpName: "Mansoor Ali Khan",      runnerUpParty: "INC", runnerUpVotes: 594200, totalVoters: 1750000, votesPolled: 1248000, turnoutPct: 71.3, margin: 158440, source: "ECI 2024" },
        { districtId: did, year: 2024, electionType: "LOK_SABHA", constituency: "Bengaluru South",   winnerName: "Tejasvi Surya",            winnerParty: "BJP", winnerVotes: 828600, runnerUpName: "Sowmya Reddy",          runnerUpParty: "INC", runnerUpVotes: 624800, totalVoters: 1890000, votesPolled: 1368000, turnoutPct: 72.4, margin: 203800, source: "ECI 2024" },
      ];
      const newEle = eleRows.filter((r) => !storedKeys.has(electionResultKey(r)));
      await client.electionResult.createMany({ data: newEle });
      console.log(`  ✓ ${newEle.length} election results (${eleRows.length - newEle.length} already stored)`);
    } else {
      console.log("  ↩ Elections already seeded");
    }

    // ── 3. Budget — ₹19,000 Cr dept-wise ────────────────────
    const existingBudget = await client.budgetEntry.count({ where: { districtId: did } });
    if (existingBudget === 0) {
      // Sector-level BudgetEntry (stored in Rupees; display /1e7 = Crores)
      await client.budgetEntry.createMany({ data: [
        { districtId: did, fiscalYear: "2024-25", sector: "Roads & Infrastructure",    sectorLocal: "ರಸ್ತೆ ಮತ್ತು ಮೂಲಸೌಕರ್ಯ",   allocated: 35000000000, released: 28000000000, spent: 22400000000, source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Water Supply & Sanitation", sectorLocal: "ನೀರು ಸರಬರಾಜು ಮತ್ತು ನೈರ್ಮಲ್ಯ", allocated: 22000000000, released: 18000000000, spent: 14400000000, source: "BWSSB Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Storm Water Drains",        sectorLocal: "ಚರಂಡಿ ನಿರ್ವಹಣೆ",              allocated: 12000000000, released: 9500000000,  spent: 7200000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Parks & Open Spaces",       sectorLocal: "ಉದ್ಯಾನಗಳು",                   allocated: 4000000000,  released: 3200000000,  spent: 2560000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Solid Waste Management",    sectorLocal: "ಘನತ್ಯಾಜ್ಯ ನಿರ್ವಹಣೆ",          allocated: 8000000000,  released: 6400000000,  spent: 5120000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Health",                    sectorLocal: "ಆರೋಗ್ಯ",                       allocated: 11000000000, released: 9200000000,  spent: 7360000000,  source: "BBMP + Dept of Health" },
        { districtId: did, fiscalYear: "2024-25", sector: "Education",                 sectorLocal: "ಶಿಕ್ಷಣ",                       allocated: 16000000000, released: 13500000000, spent: 10800000000, source: "BBMP + Dept of Education" },
        { districtId: did, fiscalYear: "2024-25", sector: "Metro Rail (BMRCL)",        sectorLocal: "ಮೆಟ್ರೋ ರೈಲು",                 allocated: 28000000000, released: 22000000000, spent: 17600000000, source: "BMRCL Annual Report" },
        { districtId: did, fiscalYear: "2024-25", sector: "Urban Housing",             sectorLocal: "ನಗರ ವಸತಿ",                    allocated: 5000000000,  released: 4000000000,  spent: 3200000000,  source: "BDA / KHB Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Power (BESCOM)",            sectorLocal: "ವಿದ್ಯುತ್",                     allocated: 20000000000, released: 17000000000, spent: 13600000000, source: "BESCOM Capital Budget" },
        { districtId: did, fiscalYear: "2024-25", sector: "Traffic & Safety",          sectorLocal: "ಸಂಚಾರ ಮತ್ತು ಸುರಕ್ಷತೆ",       allocated: 3500000000,  released: 2800000000,  spent: 2240000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Lakes & Environment",       sectorLocal: "ಕೆರೆ ಮತ್ತು ಪರಿಸರ",           allocated: 6000000000,  released: 4800000000,  spent: 3840000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Street Lighting",           sectorLocal: "ಬೀದಿ ದೀಪ",                   allocated: 4000000000,  released: 3400000000,  spent: 2720000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "General Administration",    sectorLocal: "ಸಾಮಾನ್ಯ ಆಡಳಿತ",              allocated: 4500000000,  released: 4000000000,  spent: 3600000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "IT & e-Governance",         sectorLocal: "ಐ.ಟಿ ಮತ್ತು ಇ-ಆಡಳಿತ",         allocated: 3000000000,  released: 2400000000,  spent: 1920000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Social Welfare",            sectorLocal: "ಸಮಾಜ ಕಲ್ಯಾಣ",                allocated: 2500000000,  released: 2000000000,  spent: 1600000000,  source: "Dept of Social Welfare" },
        { districtId: did, fiscalYear: "2024-25", sector: "Heritage & Tourism",        sectorLocal: "ಪರಂಪರೆ ಮತ್ತು ಪ್ರವಾಸೋದ್ಯಮ",  allocated: 1500000000,  released: 1200000000,  spent: 960000000,   source: "Dept of Tourism Karnataka" },
        { districtId: did, fiscalYear: "2024-25", sector: "Police & Security",         sectorLocal: "ಪೊಲೀಸ್ ಮತ್ತು ಸುರಕ್ಷತೆ",     allocated: 6000000000,  released: 5400000000,  spent: 4860000000,  source: "Home Department Karnataka" },
        { districtId: did, fiscalYear: "2024-25", sector: "Fire & Emergency Services", sectorLocal: "ಅಗ್ನಿಶಾಮಕ ಸೇವೆ",              allocated: 1200000000,  released: 1000000000,  spent: 800000000,   source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", sector: "Transport (BMTC)",          sectorLocal: "ಸಾರಿಗೆ (ಬಿಎಂಟಿಸಿ)",          allocated: 6500000000,  released: 5500000000,  spent: 4950000000,  source: "BMTC Annual Report 2024-25" },
      ]});
      console.log("  ✓ Budget entries (20 sectors, ₹19,000 Cr total)");
    } else {
      console.log("  ↩ Budget entries already seeded");
    }

    // Dept-level BudgetAllocation
    const existingAlloc = await client.budgetAllocation.count({ where: { districtId: did } });
    if (existingAlloc === 0) {
      await client.budgetAllocation.createMany({ data: [
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Roads",              category: "Capital",   allocated: 25000000000, released: 20000000000, spent: 15800000000, lapsed: 2000000000, source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Roads",              category: "Revenue",   allocated: 10000000000, released: 8000000000,  spent: 6600000000,  lapsed: 500000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BWSSB",                   category: "Capital",   allocated: 18000000000, released: 14500000000, spent: 11200000000, lapsed: 1500000000, source: "BWSSB Annual Report" },
        { districtId: did, fiscalYear: "2024-25", department: "BWSSB",                   category: "Revenue",   allocated: 4000000000,  released: 3500000000,  spent: 3200000000,  lapsed: 200000000,  source: "BWSSB Annual Report" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Health",             category: "Revenue",   allocated: 8000000000,  released: 7200000000,  spent: 6200000000,  lapsed: 400000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "Dept of Health Services", category: "Revenue",   allocated: 3000000000,  released: 2000000000,  spent: 1160000000,  lapsed: 300000000,  source: "Dept of Health Karnataka" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Education",          category: "Revenue",   allocated: 6000000000,  released: 5500000000,  spent: 4800000000,  lapsed: 300000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "Dept of Education",       category: "Revenue",   allocated: 10000000000, released: 8000000000,  spent: 6000000000,  lapsed: 800000000,  source: "SSLC / PUC Dept Karnataka" },
        { districtId: did, fiscalYear: "2024-25", department: "BMRCL Phase 2 & 3",       category: "Capital",   allocated: 28000000000, released: 22000000000, spent: 17600000000, lapsed: 2000000000, source: "BMRCL Annual Report" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP SWM",                category: "Revenue",   allocated: 8000000000,  released: 6400000000,  spent: 5120000000,  lapsed: 500000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Storm Water Drains", category: "Capital",   allocated: 12000000000, released: 9500000000,  spent: 7200000000,  lapsed: 1200000000, source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BESCOM",                  category: "Capital",   allocated: 20000000000, released: 17000000000, spent: 13600000000, lapsed: 1500000000, source: "BESCOM Capital Budget" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Parks",              category: "Revenue",   allocated: 4000000000,  released: 3200000000,  spent: 2560000000,  lapsed: 300000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Lakes",              category: "Capital",   allocated: 6000000000,  released: 4800000000,  spent: 3840000000,  lapsed: 500000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BMTC",                    category: "Revenue",   allocated: 6500000000,  released: 5500000000,  spent: 4950000000,  lapsed: 300000000,  source: "BMTC Annual Report" },
        { districtId: did, fiscalYear: "2024-25", department: "Karnataka Police BLR",    category: "Revenue",   allocated: 6000000000,  released: 5400000000,  spent: 4860000000,  lapsed: 300000000,  source: "Home Dept Karnataka" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP Street Lighting",    category: "Revenue",   allocated: 4000000000,  released: 3400000000,  spent: 2720000000,  lapsed: 350000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "BDA Housing",             category: "Capital",   allocated: 5000000000,  released: 4000000000,  spent: 3200000000,  lapsed: 400000000,  source: "BDA Annual Report" },
        { districtId: did, fiscalYear: "2024-25", department: "BBMP IT & eGov",          category: "Capital",   allocated: 3000000000,  released: 2400000000,  spent: 1920000000,  lapsed: 300000000,  source: "BBMP Budget 2024-25" },
        { districtId: did, fiscalYear: "2024-25", department: "Dept of Social Welfare",  category: "Revenue",   allocated: 2500000000,  released: 2000000000,  spent: 1600000000,  lapsed: 200000000,  source: "Dept of Social Welfare" },
      ]});
      console.log("  ✓ Budget allocations (20 departments)");
    } else {
      console.log("  ↩ Budget allocations already seeded");
    }

    console.log("  ✅ Bengaluru Ext-B complete\n");
  } finally {
    if (standalone) await client.$disconnect();
  }
}

// ── Run standalone ────────────────────────────────────────
if (require.main === module) {
  const client = makeClient();
  seedBengaluruDataExtB(client)
    .then(() => { console.log("Done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => client.$disconnect());
}
