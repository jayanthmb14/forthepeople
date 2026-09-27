/**
 * ForThePeople.in — Manual-research data fill for Bengaluru Urban infrastructure
 * Run: npx tsx scripts/archive/fill-bengaluru-infra.ts [--dry-run]
 *
 * Same semantics as fill-mandya / fill-mysuru:
 *   - Fuzzy match (primary + alternate tokens), fill-only, never overwrite
 *   - Mirror originalBudget → revisedBudget → budget when null
 *   - Category override only when null / "General"
 *   - Status upgrade only forward
 *   - InfraUpdate(updateType="MANUAL_RESEARCH") per filled row
 * Zero AI calls.
 */

import "../_env";
import { PrismaClient, Prisma } from "../../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { logUpdate } from "../../src/lib/update-log";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DRY_RUN = process.argv.includes("--dry-run");

type KP = { name: string; role: string | null; party: string | null; context: string | null };
interface Fill {
  match: string;
  matchAlt?: string[];
  announcedBy?: string;
  announcedByRole?: string;
  party?: string;
  executingAgency?: string;
  description?: string;
  category?: string;
  originalBudget?: number;
  status?: string;
  keyPeople?: KP[];
}

const DATA: Fill[] = [
  { match: "Bidadi AI City",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister, Karnataka", party: "INC",
    executingAgency: "Karnataka IT/BT Department", category: "Industry",
    description: "AI-focused township near Bidadi with data centres, R&D labs and startup incubators on Bengaluru-Mysuru corridor." },

  { match: "Bengaluru Master Plan", matchAlt: ["Bengaluru New Master Plan"],
    executingAgency: "BDA (Bangalore Development Authority)", category: "Other",
    description: "Revised Master Plan 2031 governing land use zoning, road networks and development regulations for Greater Bengaluru." },

  { match: "Urban Planning Restructuring", matchAlt: ["GBA Transition"],
    executingAgency: "Karnataka Urban Development Department", category: "Other",
    description: "Restructuring urban governance by transitioning from BDA to Greater Bengaluru Authority for unified city planning." },

  { match: "GBA Replacement of BDA",
    executingAgency: "Karnataka Urban Development Department", category: "Other",
    description: "Legislative proposal to replace BDA with Greater Bengaluru Authority integrating BBMP, BDA and BMRDA functions." },

  { match: "Greater Bengaluru Authority",
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "Karnataka Urban Development Department", category: "Other",
    description: "Expansion of Bengaluru's administrative boundary to include surrounding taluks under unified Greater Bengaluru Authority." },

  { match: "Karnataka CNG Station", matchAlt: ["CNG Station Expansion"],
    executingAgency: "GAIL / IGL / Karnataka State Gas", category: "Power",
    description: "Network of 500+ CNG stations across Karnataka with Bengaluru as primary hub for vehicular gas conversion." },

  { match: "10-Lane Expressway", matchAlt: ["Namma Expressway", "Bengaluru–Mysuru Highway"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister, Road Transport", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "118 km 10-lane access-controlled expressway reducing Bengaluru-Mysuru travel from 3 hours to 75 minutes." },

  { match: "1,000 Roads Annual", matchAlt: ["BBMP 1,000 Roads"],
    executingAgency: "BBMP (Bruhat Bengaluru Mahanagara Palike)", category: "Roads",
    description: "Annual programme to resurface, widen and improve drainage on 1,000 roads across Bengaluru's 198 wards." },

  { match: "Satellite Town Ring Road", matchAlt: ["STRR"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "285 km outer ring road connecting Doddaballapur, Devanahalli, Hoskote, Anekal and Kanakapura to decongest Bengaluru." },

  { match: "International Sports City", matchAlt: ["Anekal"],
    executingAgency: "Karnataka Sports Department / BDA", category: "Sports & Stadium",
    description: "International-standard sports complex in Anekal with cricket stadium, athletics track, aquatics centre and training facilities." },

  { match: "Waste-to-Energy", matchAlt: ["Bidadi (30 MW)"],
    executingAgency: "BBMP / Private PPP", category: "Power",
    description: "30 MW waste-to-energy plant at Bidadi processing 3,000 tonnes/day of Bengaluru's municipal solid waste into electricity." },

  { match: "Dental College Expansion", matchAlt: ["Government Dental College"],
    executingAgency: "Karnataka Health Department / RGUHS", category: "Hospital",
    description: "Expansion of government dental college near Electronic City to increase dental education seats and public dental care." },

  { match: "KSR Bengaluru Station", matchAlt: ["World-Class"],
    announcedBy: "Ashwini Vaishnaw", announcedByRole: "Union Railway Minister", party: "BJP",
    executingAgency: "South Western Railway / IRSDC", category: "Rail",
    description: "World-class redevelopment of Krantiveera Sangolli Rayanna station with commercial complex, multi-modal transit hub and modern amenities." },

  { match: "Neighbourhood Parks", matchAlt: ["200 Parks"],
    executingAgency: "BBMP Horticulture Wing", category: "Parks & Lakes",
    description: "Development and upgrade of 200 neighbourhood parks across Bengaluru with play equipment, walking tracks and green cover." },

  { match: "BBMP Smart Classroom", matchAlt: ["500 Govt Schools"],
    executingAgency: "BBMP Education Division", category: "Education",
    description: "Digital smart boards and internet in 500 BBMP-run government schools across Bengaluru for improved learning outcomes." },

  { match: "KR Puram–Hebbal Elevated", matchAlt: ["KR Puram-Hebbal Elevated"],
    executingAgency: "NHAI / BDA", category: "Roads",
    description: "Elevated corridor along NH-75 from KR Puram to Hebbal bypassing ORR traffic for the airport connectivity corridor." },

  { match: "Cauvery Water Supply Phase 5 Stage 2", matchAlt: ["Cauvery Water Supply Phase 5", "550 MLD"],
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "BWSSB (Bangalore Water Supply & Sewerage Board)", category: "Water",
    description: "Additional 550 MLD Cauvery water supply to serve Bengaluru's expanding population in 110 new villages added to BBMP." },

  { match: "Boringwell Lane Lake",
    executingAgency: "BDA / BBMP Lakes Division", category: "Parks & Lakes",
    description: "Rejuvenation of Boringwell Lane Lake with desilting, bund strengthening, walking path and biodiversity restoration." },

  { match: "Bengaluru North University",
    executingAgency: "Karnataka Higher Education Department", category: "Education",
    description: "New campus for Bengaluru North University in Doddaballapur with academic blocks, library, hostels and sports facilities." },

  { match: "IIIT Bangalore", matchAlt: ["IIIT-B", "IIIT Bangalore Campus"],
    executingAgency: "IIIT-B / Karnataka IT Department", category: "Education",
    description: "Campus expansion of IIIT-Bangalore at Electronic City with new research labs, incubation centre and student housing." },

  { match: "Urban Forest", matchAlt: ["1,000 Acres"],
    executingAgency: "Karnataka Forest Department / BBMP", category: "Environment",
    description: "Urban forest development across 1,000 acres in Bengaluru with native tree planting, biodiversity parks and green corridors." },

  { match: "Underground Drainage Scheme", matchAlt: ["South Zone"],
    executingAgency: "BWSSB", category: "Sewage",
    description: "Phase 3 underground drainage network for Bengaluru South covering Jayanagar, JP Nagar and Banashankari to end open sewage." },

  { match: "pothole filling", matchAlt: ["Bengaluru roads pothole"],
    executingAgency: "BBMP Engineering Wing", category: "Roads",
    description: "Citywide pothole filling and road repair programme using cold-mix and mastic asphalt technology." },

  { match: "Devanahalli–Baiyappanahalli", matchAlt: ["Devanahalli-Baiyappanahalli", "Suburban Rail Project — Corridor 1"],
    announcedBy: "B.S. Yediyurappa", announcedByRole: "Former CM", party: "BJP",
    executingAgency: "K-RIDE", category: "Rail",
    description: "Suburban rail corridor from Devanahalli (airport) to Baiyappanahalli connecting north Bengaluru for daily commuters." },

  { match: "Yeshwanthpur–Channasandra", matchAlt: ["Yeshwanthpur-Channasandra", "Suburban Rail Project — Corridor 2"],
    executingAgency: "K-RIDE", category: "Rail",
    description: "Suburban rail corridor from Yeshwanthpur to Channasandra serving the eastern IT corridor of Whitefield and Marathahalli." },

  { match: "KSR–Kengeri", matchAlt: ["KSR-Kengeri", "Suburban Rail Project — Corridor 3"],
    executingAgency: "K-RIDE", category: "Rail",
    description: "Suburban rail from city station to Kengeri serving the southwestern growth corridor along Mysuru Road." },

  { match: "Heelalige–Rajanakunte", matchAlt: ["Heelalige-Rajanakunte", "Suburban Rail Project — Corridor 4"],
    executingAgency: "K-RIDE", category: "Rail",
    description: "North-south suburban rail connecting Heelalige to Rajanakunte via Yelahanka for the northern growth corridor." },

  { match: "Peripheral Ring Road (PRR)", matchAlt: ["Peripheral Ring Road"],
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "BDA", category: "Roads",
    description: "116 km peripheral ring road connecting all radial highways around Bengaluru to divert through-traffic from the city." },

  { match: "Green Line Extension — Nagasandra", matchAlt: ["Nagasandra to BIEC"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Green Line extension from Nagasandra to Bangalore International Exhibition Centre (BIEC) serving north-west corridor." },

  { match: "Yelachenahalli to Anjanapura", matchAlt: ["Green Line Extension — Yelachenahalli"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Green Line southern extension from Yelachenahalli to Anjanapura Township serving south Bengaluru's growing residential areas." },

  { match: "Baiyappanahalli to Whitefield", matchAlt: ["Purple Line Extension — Baiyappanahalli"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Purple Line eastern extension to Whitefield serving India's largest IT corridor with 13 new stations." },

  { match: "Mysuru Road to Kengeri", matchAlt: ["Purple Line Extension — Mysuru Road"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Purple Line western extension to Challaghatta/Kengeri serving the Mysuru Road growth corridor." },

  { match: "Namma Metro Phase 2A", matchAlt: ["JP Nagar to Mysuru Road"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Phase 2A connecting JP Nagar to Mysuru Road providing orbital connectivity between Green and Purple lines." },

  { match: "ORR Line", matchAlt: ["Namma Metro ORR Line", "44 km Orbital"],
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "BMRCL", category: "Metro",
    description: "44 km orbital metro line along Outer Ring Road connecting Hebbal, Silk Board, KR Puram and major IT parks." },

  { match: "Namma Metro Airport Line", matchAlt: ["Airport Line — Phase 3"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Direct metro line from city to Kempegowda International Airport reducing airport commute to 45 minutes." },

  { match: "Airport Terminal 2", matchAlt: ["Bengaluru Airport Terminal"],
    executingAgency: "BIAL (Bangalore International Airport Ltd)", category: "Airport",
    description: "New Terminal 2 at KIA inspired by Bengaluru's garden city heritage, handling 25 million additional passengers annually." },

  { match: "Third Runway", matchAlt: ["Bengaluru Airport — Third Runway"],
    executingAgency: "BIAL", category: "Airport",
    description: "Third runway at Kempegowda International Airport to handle growing air traffic demand and reduce landing delays." },

  { match: "NICE Road",
    executingAgency: "Nandi Infrastructure Corridor Enterprises", category: "Roads",
    description: "Bengaluru's first expressway connecting Electronic City to Tumkur Road, now part of the peripheral connectivity network." },

  { match: "Signal-Free Corridor", matchAlt: ["Outer Ring Road — Signal-Free"],
    executingAgency: "BDA / BBMP", category: "Roads",
    description: "Grade separation and flyover construction to make the entire Outer Ring Road signal-free for uninterrupted IT corridor connectivity." },

  { match: "Silk Board", matchAlt: ["Silk Board Junction Flyover", "Steel Flyover"],
    executingAgency: "BDA", category: "Flyover",
    description: "Multi-level flyover at Silk Board junction, India's most congested intersection, connecting Hosur Road to ORR and Bannerghatta Road." },

  { match: "Tin Factory Flyover",
    executingAgency: "BBMP / BDA", category: "Flyover",
    description: "Flyover extension at Tin Factory junction connecting Old Madras Road to KR Puram for decongesting east Bengaluru." },

  { match: "Iblur Underpass", matchAlt: ["Iblur"],
    executingAgency: "BDA", category: "Roads",
    description: "Underpass at Iblur junction on Sarjapur Road to ease traffic between Outer Ring Road and residential areas." },

  { match: "Ejipura", matchAlt: ["Tannery Road Elevated"],
    executingAgency: "BBMP", category: "Flyover",
    description: "Elevated road at Ejipura connecting Koramangala to Tannery Road bypass for the southeast Bengaluru corridor." },

  { match: "Hebbal Flyover", matchAlt: ["Hebbal Interchange"],
    executingAgency: "NHAI / BDA", category: "Flyover",
    description: "Multi-level interchange upgrade at Hebbal junction for seamless connectivity between NH-44, NH-75 and Bellary Road." },

  { match: "Varthur Lake",
    executingAgency: "BDA / BBMP Lakes Division", category: "Parks & Lakes",
    description: "Rejuvenation of Varthur Lake (largest in Bengaluru) with sewage diversion, desilting and wetland restoration." },

  { match: "Bellandur Lake",
    executingAgency: "BDA / KSPCB", category: "Parks & Lakes",
    description: "Comprehensive cleanup of Bellandur Lake addressing sewage inflow, industrial effluent and toxic foam that made global headlines." },

  { match: "Agara Lake",
    executingAgency: "BBMP / BDA", category: "Parks & Lakes",
    description: "Development of Agara Lake park with walking trails, bird watching area and children's play zone in HSR Layout." },

  { match: "Ulsoor Lake",
    executingAgency: "BBMP", category: "Parks & Lakes",
    description: "Restoration of historic Ulsoor Lake in central Bengaluru with water quality improvement, boating facility and heritage walk." },

  { match: "BWSSB STP", matchAlt: ["1,200 MLD"],
    executingAgency: "BWSSB", category: "Sewage",
    description: "Expansion of sewage treatment plant capacity across Bengaluru to 1,200 MLD to treat all wastewater before discharge to lakes and rivers." },

  { match: "Rajakaluve", matchAlt: ["Storm Water Drain"],
    executingAgency: "BBMP / BDA", category: "Sewage",
    description: "Clearing encroachments on Bengaluru's storm water drains (rajakaluves) to prevent urban flooding during monsoons." },

  { match: "KC Valley", matchAlt: ["Tertiary Treatment"],
    executingAgency: "BWSSB", category: "Water",
    description: "Tertiary treatment of KC Valley STP output to produce industrial-grade recycled water reducing freshwater demand." },

  { match: "Bus Priority Lane", matchAlt: ["BRT Lite"],
    executingAgency: "BMTC / DULT", category: "Roads",
    description: "Dedicated bus priority lanes on major corridors to improve BMTC bus speeds and encourage public transport use." },

  { match: "Electric Bus Fleet", matchAlt: ["1,500 Buses", "BMTC Electric Bus"],
    announcedBy: "Siddaramaiah", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "BMTC (Bangalore Metropolitan Transport Corporation)", category: "Other",
    description: "Induction of 1,500 electric buses replacing diesel fleet for zero-emission public transport across Bengaluru." },

  { match: "Multi-Modal Integration", matchAlt: ["Metro-Bus-Rail"],
    executingAgency: "BMRCL / BMTC / K-RIDE", category: "Other",
    description: "Seamless interchange hubs connecting Namma Metro, BMTC buses and suburban rail at key stations across Bengaluru." },

  { match: "Smart City Command", matchAlt: ["Bengaluru Smart City Command"],
    executingAgency: "Bengaluru Smart City SPV", category: "Telecom",
    description: "Integrated command centre with CCTV, traffic management, emergency response and city services dashboard." },

  { match: "Automated Traffic Management", matchAlt: ["ATMS", "400 Junctions"],
    executingAgency: "Bengaluru Traffic Police / Smart City SPV", category: "Traffic",
    description: "AI-based adaptive traffic signals at 400 junctions with ANPR cameras, red-light violation detection and real-time management." },

  { match: "K-100 Clubs", matchAlt: ["K-100 Clubs Flyover"],
    executingAgency: "BDA", category: "Flyover",
    description: "Flyover at K-100 Clubs junction connecting MG Road area to Richmond Road for Inner Ring Road traffic flow." },

  { match: "Hosur Road Elevated", matchAlt: ["Hosur Road Corridor"],
    executingAgency: "BDA / NHAI", category: "Roads",
    description: "Elevated corridor on Hosur Road from Silk Board to Electronic City serving India's largest IT employment hub." },

  { match: "Bengaluru–Chennai Expressway", matchAlt: ["Bengaluru-Chennai Expressway"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "Karnataka section of the 262 km Bengaluru-Chennai expressway reducing inter-city travel from 5 to 2 hours." },

  { match: "Whitefield–Hoskote", matchAlt: ["Whitefield-Hoskote", "Narsapura Industrial"],
    executingAgency: "KIADB / NHAI", category: "Industry",
    description: "Industrial corridor connecting Whitefield IT hub to Hoskote and Narsapura industrial areas for manufacturing logistics." },

  { match: "IT Investment Region", matchAlt: ["ITIR"],
    executingAgency: "Karnataka IT Department / KIADB", category: "Industry",
    description: "IT Investment Region near Devanahalli airport with IT parks, residential townships and social infrastructure on 10,000 acres." },

  { match: "Electronic City Phase 3", matchAlt: ["Electronic City Expansion"],
    executingAgency: "ELCITA / KIADB", category: "Industry",
    description: "Phase 3 expansion of Electronic City with new IT parks, startup hub and improved infrastructure for India's IT township." },

  { match: "Aerospace & Defence SEZ", matchAlt: ["Aerospace SEZ — Devanahalli"],
    executingAgency: "KIADB", category: "Industry",
    description: "Aerospace and defence manufacturing SEZ near airport leveraging HAL, DRDO and ISRO ecosystem in Bengaluru." },

  { match: "IISc Research Park", matchAlt: ["IISc Innovation Hub"],
    executingAgency: "IISc / Karnataka IT Department", category: "Education",
    description: "Research park at Indian Institute of Science for industry-academia collaboration, deep-tech startups and innovation." },

  { match: "Peenya Industrial Area",
    executingAgency: "KIADB", category: "Industry",
    description: "Modernisation of Asia's largest industrial area with improved roads, drainage, power substations and common effluent treatment." },

  { match: "Life Sciences Park", matchAlt: ["Hebbagodi"],
    executingAgency: "KIADB / Karnataka Biotech Department", category: "Industry",
    description: "Life sciences and biotech park near Hebbagodi for pharma, medical devices and biotech companies building on Bengaluru's biotech cluster." },

  { match: "Kempegowda Layout", matchAlt: ["Kempegowda Layout Phase 2"],
    executingAgency: "BDA", category: "Housing",
    description: "Phase 2 of Kempegowda Layout residential development with plots, roads, parks and civic infrastructure in north Bengaluru." },

  { match: "Arkavathy Layout",
    executingAgency: "BDA", category: "Housing",
    description: "Large BDA residential layout near Devanahalli with 15,000+ plots, connecting roads and social infrastructure." },

  { match: "Hegde Nagar to Jakkur", matchAlt: ["Elevated Road — Hegde Nagar"],
    executingAgency: "BBMP", category: "Roads",
    description: "Elevated road connecting Hegde Nagar to Jakkur Cross decongesting the Thanisandra-Jakkur corridor in north Bengaluru." },

  { match: "Yellow Line", matchAlt: ["Nagavara-Gottigere Metro", "Nagavara to Gottigere"],
    executingAgency: "BMRCL", category: "Metro",
    description: "North-south Yellow Line metro from Nagavara to Gottigere connecting Hennur, Dairy Circle and Bannerghatta Road." },

  { match: "RV Road-Bommasandra", matchAlt: ["RV Road to Bommasandra"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Metro extension from RV Road to Bommasandra connecting Jayanagar to Electronic City via BTM Layout and HSR Layout." },

  { match: "Sarjapur Road Widening", matchAlt: ["Sarjapur Road Grade"],
    executingAgency: "BDA / BBMP", category: "Roads",
    description: "Widening of Sarjapur Road from 2 to 6 lanes with grade separators at key junctions serving east Bengaluru's IT corridor." },

  { match: "Bannerghatta Road", matchAlt: ["Bannerghatta Signal-Free"],
    executingAgency: "BDA", category: "Roads",
    description: "Series of flyovers and underpasses on Bannerghatta Road to make it signal-free from Jayanagar to Gottigere." },

  { match: "Tumkur Road Improvement", matchAlt: ["Tumkur Road (NH-48)"],
    executingAgency: "NHAI", category: "Roads",
    description: "Improvement of Tumkur Road with service roads, flyovers and pedestrian facilities on Bengaluru's busiest industrial corridor." },

  { match: "Victoria Hospital", matchAlt: ["Victoria Hospital Redevelopment"],
    executingAgency: "BMCRI (Bangalore Medical College)", category: "Hospital",
    description: "Redevelopment of historic Victoria Hospital into super-specialty centre with trauma care, cardiology and neurology wings." },

  { match: "Jayadeva Hospital", matchAlt: ["Bommasandra"],
    executingAgency: "Jayadeva Institute of Cardiology", category: "Hospital",
    description: "New Jayadeva satellite hospital at Bommasandra serving south Bengaluru's cardiac patients closer to Electronic City." },

  { match: "Nimhans", matchAlt: ["Nimhans Expansion"],
    executingAgency: "NIMHANS / Ministry of Health", category: "Hospital",
    description: "Phase 3 expansion of India's premier mental health institute with new neuroscience block and telemedicine centre." },

  { match: "Bowring", matchAlt: ["Lady Curzon"],
    executingAgency: "Karnataka Health Department", category: "Hospital",
    description: "Comprehensive upgrade of the 138-year-old Bowring Hospital with modern emergency wing and diagnostic facilities." },

  { match: "Government School Infrastructure", matchAlt: ["2,000 Schools"],
    executingAgency: "Karnataka Education Department / BBMP", category: "Education",
    description: "Infrastructure upgrade of 2,000 government schools in Bengaluru with new classrooms, toilets, drinking water and boundary walls." },

  { match: "IISER", matchAlt: ["Indian Institute of Science Education"],
    executingAgency: "Ministry of Education", category: "Education",
    description: "IISER campus development in Bengaluru for undergraduate science education and cutting-edge research." },

  { match: "RR Nagar", matchAlt: ["Kengeri Elevated Road"],
    executingAgency: "BDA", category: "Roads",
    description: "Elevated road connecting Rajarajeshwari Nagar to Kengeri for the growing western Bengaluru residential corridor." },

  { match: "Safe City", matchAlt: ["10,000 CCTV"],
    executingAgency: "Bengaluru City Police / MHA", category: "Telecom",
    description: "10,000 AI-enabled CCTV cameras across Bengaluru for women's safety, crime prevention and traffic monitoring under Nirbhaya Fund." },

  { match: "Comprehensive Mobility Plan", matchAlt: ["CMP 2035"],
    executingAgency: "DULT (Directorate of Urban Land Transport)", category: "Other",
    description: "35-year transportation master plan integrating metro, suburban rail, bus, cycling and pedestrian infrastructure for Bengaluru." },

  { match: "TenderSURE", matchAlt: ["100 km Premium Footpaths"],
    executingAgency: "DULT / BBMP", category: "Roads",
    description: "Premium road design standard with wide footpaths, underground utilities, cycling lanes and heritage trees on 100 km of Bengaluru roads." },

  { match: "Nandi Hills",
    executingAgency: "Karnataka Tourism / Forest Department", category: "Tourism",
    description: "Tourism infrastructure at Nandi Hills with improved access road, visitor centre, viewpoints and heritage trail for Bengaluru's popular weekend destination." },

  { match: "Cubbon Park",
    executingAgency: "Karnataka Horticulture Department", category: "Parks & Lakes",
    description: "Heritage conservation and restoration of 300-acre Cubbon Park including tree census, path restoration and biodiversity mapping." },

  { match: "Lalbagh",
    executingAgency: "Karnataka Horticulture Department", category: "Parks & Lakes",
    description: "Infrastructure upgrade of Lalbagh with glass house restoration, new tropical conservatory and improved visitor facilities." },

  { match: "Heritage Precinct", matchAlt: ["MG Road to Brigade Road"],
    executingAgency: "BBMP / Smart City SPV", category: "Heritage",
    description: "Heritage precinct development with pedestrianised zones, heritage lighting and restored colonial-era buildings in the central business district." },

  { match: "Yeshwanthpur", matchAlt: ["APMC Market"],
    executingAgency: "Karnataka APMC / BBMP", category: "Industry",
    description: "Modernisation of Yeshwanthpur agricultural market with cold storage, electronic auction and modern trading infrastructure." },

  { match: "Bus Terminus Relocation", matchAlt: ["Shantinagar to Bommanahalli"],
    executingAgency: "BMTC / KSRTC", category: "Other",
    description: "Relocation of inter-city bus terminus from congested Shantinagar to new facility at Bommanahalli with metro and bus integration." },

  { match: "Yelahanka Airforce", matchAlt: ["Yelahanka Airforce Station"],
    executingAgency: "BBMP / NHAI", category: "Roads",
    description: "Road network improvement around Yelahanka connecting to Bellary Road and Doddaballapur Road for north Bengaluru growth." },

  { match: "GKVK", matchAlt: ["Agricultural University"],
    executingAgency: "UAS Bengaluru", category: "Education",
    description: "Modernisation of Gandhi Krishi Vigyana Kendra campus with new research labs, agri-tech incubator and smart farming demo plots." },

  { match: "Jnanabharathi", matchAlt: ["Bengaluru University"],
    executingAgency: "Bengaluru University / BDA", category: "Education",
    description: "Improved road connectivity to Bengaluru University's Jnanabharathi campus connecting to Mysuru Road metro and residential areas." },

  { match: "HAL Airport Land",
    executingAgency: "HAL / BDA", category: "Housing",
    description: "Redevelopment of the decommissioned HAL Airport 1,100-acre land into mixed-use township with metro connectivity." },

  { match: "Koramangala 100-ft", matchAlt: ["Koramangala 100 ft"],
    executingAgency: "BBMP", category: "Roads",
    description: "Extension and widening of Koramangala 100-ft road connecting to ORR for improved access to the startup and IT hub." },

  { match: "Hebbal–Yelahanka–Devanahalli", matchAlt: ["Hebbal-Yelahanka-Devanahalli"],
    executingAgency: "NHAI / BDA", category: "Roads",
    description: "Corridor upgrade from Hebbal to airport via Yelahanka with flyovers, service roads and median improvements." },

  { match: "Whitefield Metro", matchAlt: ["Phase 2 Operations"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Operational readiness and public services on the Purple Line extension to Whitefield serving IT professionals." },

  { match: "Bommasandra–Hosur", matchAlt: ["Bommasandra-Hosur Metro"],
    executingAgency: "BMRCL", category: "Metro",
    description: "Metro extension from Bommasandra towards Hosur across the Tamil Nadu border serving the Electronics City-Hosur industrial belt." },

  { match: "Sarjapur–Hebbal Metro", matchAlt: ["Sarjapur-Hebbal Metro", "37 km new metro corridor"],
    announcedBy: "Basavaraj Bommai", announcedByRole: "Former Chief Minister", party: "BJP",
    executingAgency: "BMRCL", category: "Metro",
    description: "37 km new metro corridor connecting Hebbal to Sarjapur via Outer Ring Road serving the eastern IT belt." },
];

const STATUS_RANK: Record<string, number> = {
  PROPOSED: 0, APPROVED: 1, TENDER_ISSUED: 2, UNDER_CONSTRUCTION: 3,
  ON_TRACK: 3, DELAYED: 4, STALLED: 4, COMPLETED: 5, CANCELLED: 99,
};

async function applyFill(districtId: string, districtName: string, fill: Fill) {
  const tokens = [fill.match, ...(fill.matchAlt ?? [])];
  let row: Awaited<ReturnType<typeof prisma.infraProject.findFirst>> = null;
  for (const t of tokens) {
    row = await prisma.infraProject.findFirst({
      where: { districtId, name: { contains: t, mode: "insensitive" } },
    });
    if (row) break;
  }

  // CREATE path: nothing matched — insert a new curated row using fill.match
  // as the canonical name and all the supplied fields.
  if (!row) {
    if (DRY_RUN) return { matched: true, filledFields: ["CREATE (dry-run)"], projectName: fill.match };
    const created = await prisma.infraProject.create({
      data: {
        districtId,
        name: fill.match,
        shortName: fill.match.split(/\s+/).slice(0, 3).join(" "),
        description: fill.description ?? null,
        category: fill.category ?? "Other",
        scope: "DISTRICT",
        status: fill.status ?? "PROPOSED",
        announcedBy: fill.announcedBy ?? null,
        announcedByRole: fill.announcedByRole ?? null,
        party: fill.party ?? null,
        executingAgency: fill.executingAgency ?? null,
        keyPeople: fill.keyPeople?.length ? (fill.keyPeople as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        originalBudget: fill.originalBudget ?? null,
        revisedBudget: fill.originalBudget ?? null,
        budget: fill.originalBudget ?? null,
        announcedDate: new Date(),
        source: "manual-research",
        sourceUrls: ["manual-research"] as unknown as Prisma.InputJsonValue,
        lastVerifiedAt: new Date(),
        verificationCount: 1,
      },
    });
    await prisma.infraUpdate.create({
      data: {
        projectId: created.id,
        date: new Date(),
        headline: `New project seeded: ${fill.match}`,
        summary: `Created from curated research. Fill-only semantics mean news-cron enrichments will supplement (not overwrite) these values as articles arrive.`,
        updateType: "MANUAL_RESEARCH",
        newsUrl: "manual-research",
        newsSource: "ForThePeople.in research desk",
        newsDate: new Date(),
        personName: fill.announcedBy ?? null,
        personRole: fill.announcedByRole ?? null,
        personParty: fill.party ?? null,
        verified: true,
        verifiedAt: new Date(),
      },
    });
    await logUpdate({
      source: "api", actorLabel: "manual-research",
      tableName: "InfraProject", recordId: created.id, action: "create",
      districtId, districtName, moduleName: "infrastructure",
      description: `Bengaluru manual-research create: ${fill.match}`,
      recordCount: 1, details: { createdVia: "fill-bengaluru" },
    });
    return { matched: true, filledFields: ["CREATED"], projectName: fill.match };
  }

  const patch: Prisma.InfraProjectUpdateInput = {};
  const filled: string[] = [];
  const setIfEmpty = (field: keyof Prisma.InfraProjectUpdateInput, value: unknown) => {
    const cur = (row as unknown as Record<string, unknown>)[field as string];
    if ((cur === null || cur === undefined || cur === "") && value != null && value !== "") {
      (patch as Record<string, unknown>)[field as string] = value;
      filled.push(field as string);
    }
  };

  setIfEmpty("announcedBy", fill.announcedBy);
  setIfEmpty("announcedByRole", fill.announcedByRole);
  setIfEmpty("party", fill.party);
  setIfEmpty("executingAgency", fill.executingAgency);
  setIfEmpty("description", fill.description);
  setIfEmpty("originalBudget", fill.originalBudget);
  if (fill.originalBudget != null) {
    setIfEmpty("revisedBudget", fill.originalBudget);
    setIfEmpty("budget", fill.originalBudget);
  }

  const curCategory = (row as { category?: string | null }).category ?? null;
  if (fill.category && (curCategory == null || curCategory === "" || curCategory.toLowerCase() === "general")) {
    (patch as Record<string, unknown>).category = fill.category;
    filled.push("category");
  }

  if (fill.keyPeople && fill.keyPeople.length > 0) {
    const curKp = (row as { keyPeople?: unknown }).keyPeople;
    const hasKp = Array.isArray(curKp) && (curKp as unknown[]).length > 0;
    if (!hasKp) {
      (patch as Record<string, unknown>).keyPeople = fill.keyPeople;
      filled.push("keyPeople");
    }
  }

  if (fill.status) {
    const curRank = STATUS_RANK[(row.status ?? "").toUpperCase()] ?? -1;
    const newRank = STATUS_RANK[fill.status] ?? -1;
    if (newRank > curRank && curRank !== 99) {
      (patch as Record<string, unknown>).status = fill.status;
      filled.push("status");
    }
  }

  if (filled.length === 0) return { matched: true, filledFields: filled, projectName: row.name };

  if (!DRY_RUN) {
    await prisma.infraProject.update({ where: { id: row.id }, data: patch });
    await prisma.infraUpdate.create({
      data: {
        projectId: row.id, date: new Date(),
        headline: `Manual research filled ${filled.length} missing fields`,
        summary: `Curated research applied to ${row.name}: ${filled.join(", ")}. Fill-only — no existing values were overwritten.`,
        updateType: "MANUAL_RESEARCH",
        newsUrl: "manual-research", newsSource: "ForThePeople.in research desk", newsDate: new Date(),
        personName: fill.announcedBy ?? null, personRole: fill.announcedByRole ?? null, personParty: fill.party ?? null,
        verified: true, verifiedAt: new Date(),
      },
    });
    await logUpdate({
      source: "api", actorLabel: "manual-research",
      tableName: "InfraProject", recordId: row.id, action: "update",
      districtId, districtName, moduleName: "infrastructure",
      description: `Bengaluru manual-research fill: ${row.name} ← ${filled.length} fields`,
      recordCount: 1, details: { filledFields: filled },
    });
  }

  return { matched: true, filledFields: filled, projectName: row.name };
}

async function main() {
  console.log(`🛠  Bengaluru manual-research fill ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);
  const d = await prisma.district.findFirst({ where: { slug: "bengaluru-urban" }, select: { id: true, name: true } });
  if (!d) throw new Error("bengaluru-urban not found");

  let filled = 0, nop = 0, created = 0;

  console.log(`| Project                                   | Fields filled              | Status   |`);
  console.log(`|-------------------------------------------|----------------------------|----------|`);
  for (const fill of DATA) {
    const r = await applyFill(d.id, d.name, fill);
    const name = (r.projectName ?? fill.match).padEnd(41).slice(0, 41);
    if (r.filledFields.includes("CREATED") || r.filledFields.includes("CREATE (dry-run)")) {
      console.log(`| ${name} | new curated row            | 🆕       |`);
      created++;
    } else if (r.filledFields.length === 0) {
      console.log(`| ${name} | (already complete)         | ⏭ nop   |`);
      nop++;
    } else {
      console.log(`| ${name} | ${r.filledFields.join(", ").padEnd(26).slice(0, 26)} | ✅       |`);
      filled++;
    }
  }

  console.log(`\nSummary: ${DATA.length} processed · ${filled} filled · ${created} created · ${nop} already complete`);

  const remaining = await prisma.infraProject.findMany({
    where: { districtId: d.id },
    select: { description: true, executingAgency: true, announcedBy: true, category: true },
  });
  console.log(`\n📊 Bengaluru coverage after fill:`);
  console.log(`   total rows       : ${remaining.length}`);
  console.log(`   with description : ${remaining.filter((r) => r.description).length}`);
  console.log(`   with agency      : ${remaining.filter((r) => r.executingAgency).length}`);
  console.log(`   with announcedBy : ${remaining.filter((r) => r.announcedBy).length}`);
  console.log(`   generic category : ${remaining.filter((r) => !r.category || r.category.toLowerCase() === "general").length}`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
