/**
 * ForThePeople.in — Manual-research data fill for Mumbai + Chennai +
 * Hyderabad + New Delhi + Kolkata + Lucknow infrastructure (89 projects).
 * Run: npx tsx scripts/archive/fill-remaining-districts-infra.ts [--dry-run]
 *
 * Semantics identical to fill-bengaluru / fill-mysuru / fill-mandya:
 *   - Fuzzy match on name (primary + alternate tokens), fill-only, never overwrite
 *   - Mirror originalBudget → revisedBudget → budget when null (RUPEES not Crores)
 *   - Category override only when null / "General"
 *   - Status upgrade only forward (no downgrade from COMPLETED/CANCELLED)
 *   - InfraUpdate(updateType="MANUAL_RESEARCH") per filled row
 *   - CREATE fallback when no fuzzy match so curated rows are added even when
 *     the scraper pipeline hasn't surfaced them yet
 *
 * Also performs a global delete of the "Metro light and metro neo for Tier 2
 * cities" policy-announcement noise row across ALL active districts — it's
 * not a district-specific trackable project.
 *
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
  districtSlug: string;
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
  // ═══════════════════════ MUMBAI (19 — 20th is global delete) ══════════════════════
  { districtSlug: "mumbai", match: "1 Lakh-Capacity Stadium", matchAlt: ["1 Lakh-Capacity Stadium Mumbai", "1-lakh seat"],
    announcedBy: "Devendra Fadnavis", announcedByRole: "Chief Minister, Maharashtra", party: "BJP",
    executingAgency: "Mumbai Metropolitan Region Development Authority (MMRDA)", category: "Sports & Stadium",
    description: "Proposed 1-lakh seat cricket stadium rivalling Melbourne Cricket Ground, planned near Atal Setu in Navi Mumbai.",
    originalBudget: 100000000000 },

  { districtSlug: "mumbai", match: "Second AC local", matchAlt: ["AC local train on Harbour Line", "Harbour Line"],
    executingAgency: "Central Railway / Indian Railways", category: "Rail",
    description: "Introduction of AC local train services on Mumbai's Harbour Line corridor between CSMT and Panvel for premium commuters." },

  { districtSlug: "mumbai", match: "Mumbai Traffic Decongestion", matchAlt: ["Traffic Decongestion Infrastructure Projects"],
    executingAgency: "MMRDA / BMC", category: "Roads",
    description: "Package of flyovers, grade separators and road widening projects across Mumbai to reduce chronic traffic congestion." },

  { districtSlug: "mumbai", match: "Virar-Dahanu", matchAlt: ["Virar–Dahanu Railway", "Virar-Dahanu Railway Project"],
    executingAgency: "Western Railway / Indian Railways", category: "Rail",
    description: "Extension of Mumbai suburban rail network from Virar to Dahanu Road to serve the growing northern corridor commuters.",
    originalBudget: 30000000000 },

  { districtSlug: "mumbai", match: "Bengaluru–Mumbai Vande Bharat", matchAlt: ["Bengaluru-Mumbai Vande Bharat", "Vande Bharat sleeper"],
    announcedBy: "Ashwini Vaishnaw", announcedByRole: "Union Railway Minister", party: "BJP",
    executingAgency: "Indian Railways", category: "Rail",
    description: "Semi-high-speed Vande Bharat sleeper train connecting Bengaluru to Mumbai overnight, reducing 24-hour journey to 12 hours." },

  { districtSlug: "mumbai", match: "Mumbai Coastal Road", matchAlt: ["Coastal Road (South)", "Mumbai Coastal Road (South)"],
    announcedBy: "Devendra Fadnavis", announcedByRole: "Chief Minister", party: "BJP",
    executingAgency: "BMC", category: "Roads",
    description: "Southern section of the 10.58 km coastal freeway from Marine Drive to Bandra-Worli Sea Link cutting commute from 90 to 10 minutes.",
    originalBudget: 126000000000 },

  { districtSlug: "mumbai", match: "Metro Line 7", matchAlt: ["Mumbai Metro Line 7", "Red Line"],
    executingAgency: "MMRDA", category: "Metro",
    description: "16.5 km metro from Andheri East to Dahisar East serving the congested Western Express Highway corridor with 13 stations.",
    originalBudget: 65000000000 },

  { districtSlug: "mumbai", match: "Metro Line 2A", matchAlt: ["Mumbai Metro Line 2A", "Yellow Line"],
    executingAgency: "MMRDA", category: "Metro",
    description: "18.6 km elevated metro from Dahisar to D.N. Nagar connecting the western suburbs with 17 stations.",
    originalBudget: 65000000000 },

  { districtSlug: "mumbai", match: "Metro Line 3", matchAlt: ["Mumbai Metro Line 3", "Aqua Line"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "MMRC", category: "Metro",
    description: "33.5 km underground metro with 27 stations from Colaba to SEEPZ, reducing South-Central Mumbai commute by 40 minutes." },

  { districtSlug: "mumbai", match: "MHADA Housing Lottery", matchAlt: ["MHADA Housing Lottery Projects"],
    executingAgency: "MHADA (Maharashtra Housing & Area Development Authority)", category: "Housing",
    description: "Affordable housing lottery scheme providing subsidised flats across Mumbai for low and middle income families." },

  { districtSlug: "mumbai", match: "Gargai Dam", matchAlt: ["Gargai Dam Project"],
    executingAgency: "BMC / Maharashtra Water Resources Department", category: "Water",
    description: "Dam on Gargai river in Palghar to supply additional 440 MLD drinking water to Mumbai, addressing the city's chronic water deficit.",
    originalBudget: 52000000000 },

  { districtSlug: "mumbai", match: "Eastern Freeway Extension", matchAlt: ["Eastern Freeway"],
    executingAgency: "BMC / MSRDC", category: "Roads",
    description: "Extension of the Eastern Freeway connecting Orange Gate to Thane providing a high-speed corridor bypassing congested eastern suburbs." },

  { districtSlug: "mumbai", match: "Surya Water Supply", matchAlt: ["Surya Water Supply Project"],
    executingAgency: "BMC", category: "Water",
    description: "Water supply project from Surya Dam to augment Mumbai's drinking water supply with additional 275 MLD capacity.",
    originalBudget: 20000000000 },

  { districtSlug: "mumbai", match: "SRA Rehabilitation", matchAlt: ["Slum Rehabilitation", "SRA Rehabilitation Projects"],
    executingAgency: "SRA (Slum Rehabilitation Authority)", category: "Housing",
    description: "Multiple slum rehabilitation projects across Mumbai providing permanent housing to slum dwellers under the Slum Rehabilitation Scheme." },

  { districtSlug: "mumbai", match: "Mumbai Urban Transport Project", matchAlt: ["MUTP Phase 3", "MUTP"],
    announcedBy: "Eknath Shinde", announcedByRole: "Chief Minister", party: "Shiv Sena",
    executingAgency: "MRVC (Mumbai Railway Vikas Corporation)", category: "Rail",
    description: "Phase 3 of MUTP with new suburban rail corridors, platform extensions and AC local train procurement for Mumbai's 7.5 million daily rail commuters.",
    originalBudget: 105000000000 },

  { districtSlug: "mumbai", match: "Metro Line 6", matchAlt: ["Mumbai Metro Line 6", "Pink Line"],
    executingAgency: "MMRDA", category: "Metro",
    description: "14.5 km metro from Swami Samarth Nagar to Vikhroli connecting Jogeshwari-Vikhroli Link Road corridor with 12 stations.",
    originalBudget: 67000000000 },

  { districtSlug: "mumbai", match: "Mumbai Sewage Disposal", matchAlt: ["Sewage Disposal Project Phase 2"],
    executingAgency: "BMC", category: "Sewage",
    description: "Phase 2 of Mumbai's sewage infrastructure with new STPs and underground drainage to prevent untreated sewage discharge into the Arabian Sea.",
    originalBudget: 90000000000 },

  { districtSlug: "mumbai", match: "BMC Drain Clearing", matchAlt: ["Waterlogging Hotspot", "Drain Clearing and Waterlogging"],
    executingAgency: "BMC Stormwater Drainage Department", category: "Sewage",
    description: "Annual drain clearing and infrastructure upgrades at Mumbai's 300+ chronic waterlogging hotspots to prevent monsoon flooding." },

  { districtSlug: "mumbai", match: "OHE Down Line", matchAlt: ["OHE Down Line Issue"],
    executingAgency: "Central Railway", category: "Rail",
    description: "Overhead electric equipment repair and upgrade on Central Railway's down line to reduce train delays and improve suburban service reliability." },

  // ═══════════════════════ CHENNAI (13) ═════════════════════
  { districtSlug: "chennai", match: "Integrated Command", matchAlt: ["ICCC", "Integrated Command & Control"],
    executingAgency: "Chennai Smart City SPV", category: "Other",
    description: "Central command centre integrating traffic, surveillance, emergency response and civic services management for Chennai city." },

  { districtSlug: "chennai", match: "Perur Desalination", matchAlt: ["Perur Desalination Plant"],
    announcedBy: "M.K. Stalin", announcedByRole: "Chief Minister, Tamil Nadu", party: "DMK",
    executingAgency: "Chennai Metro Water Supply & Sewerage Board (CMWSSB)", category: "Water",
    description: "400 MLD desalination plant at Perur to provide drought-proof drinking water for Chennai's 1.1 crore population.",
    originalBudget: 52000000000 },

  { districtSlug: "chennai", match: "Maduravoyal-Port", matchAlt: ["Maduravoyal–Port", "Maduravoyal-Port Elevated"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "20 km elevated corridor from Maduravoyal to Chennai Port for container truck movement, freeing surface roads from heavy vehicles.",
    originalBudget: 50000000000 },

  { districtSlug: "chennai", match: "Peripheral Ring Road", matchAlt: ["Chennai Peripheral Ring Road", "PRR"],
    announcedBy: "Nitin Gadkari", announcedByRole: "Union Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "133 km ring road around Chennai connecting NH-16, NH-48, NH-45 to divert through-traffic and reduce city congestion.",
    originalBudget: 100000000000 },

  { districtSlug: "chennai", match: "Chennai Metro Phase 2", matchAlt: ["CMRL Phase 2"],
    announcedBy: "M.K. Stalin", announcedByRole: "Chief Minister", party: "DMK",
    executingAgency: "CMRL (Chennai Metro Rail Ltd)", category: "Metro",
    description: "118.9 km metro with 128 stations across 3 corridors, the largest metro expansion in India covering all major Chennai areas.",
    originalBudget: 630000000000 },

  { districtSlug: "chennai", match: "Suburban Rail Modernisation", matchAlt: ["Chennai Suburban Rail"],
    executingAgency: "Southern Railway / CMRL", category: "Rail",
    description: "Modernisation of Chennai's suburban rail with new coaches, station upgrades, signalling and additional corridors for 10 lakh daily commuters." },

  { districtSlug: "chennai", match: "Ennore LNG", matchAlt: ["Ennore LNG Terminal"],
    executingAgency: "Indian Oil Corporation", category: "Power",
    description: "Expansion of Ennore LNG terminal capacity to supply natural gas to Chennai's industries and gas-based power plants." },

  { districtSlug: "chennai", match: "River Restoration", matchAlt: ["Chennai River Restoration", "Adyar, Cooum, Buckingham"],
    announcedBy: "M.K. Stalin", announcedByRole: "Chief Minister", party: "DMK",
    executingAgency: "Chennai River Restoration Trust (CRRT)", category: "Environment",
    description: "Comprehensive restoration of Adyar, Cooum and Buckingham Canal rivers with sewage diversion, desilting and eco-restoration.",
    originalBudget: 25000000000 },

  { districtSlug: "chennai", match: "Flood Mitigation", matchAlt: ["Chennai Flood", "Stormwater Drain Network"],
    executingAgency: "Greater Chennai Corporation / JICA", category: "Sewage",
    description: "Integrated stormwater drain network to prevent devastating floods like 2015, covering 700 km of drains across Chennai.",
    originalBudget: 40000000000 },

  { districtSlug: "chennai", match: "MRTS Extension", matchAlt: ["St. Thomas Mount", "MRTS Extension to St. Thomas Mount"],
    executingAgency: "Southern Railway", category: "Rail",
    description: "Extension of Mass Rapid Transit System to St. Thomas Mount connecting to Chennai Metro and airport for seamless transit." },

  { districtSlug: "chennai", match: "Chennai Smart City", matchAlt: ["ICCC + Wi-Fi", "Smart City Projects"],
    executingAgency: "Chennai Smart City SPV", category: "Other",
    description: "Smart city infrastructure including CCTV, Wi-Fi hotspots, smart traffic signals and digital governance for T. Nagar and Teynampet zones." },

  { districtSlug: "chennai", match: "Tambaram-Chengalpattu", matchAlt: ["Tambaram–Chengalpattu", "Tambaram-Chengalpattu Suburban"],
    executingAgency: "Southern Railway", category: "Rail",
    description: "Track quadrupling and station upgrades between Tambaram and Chengalpattu to handle growing suburban commuter demand in south Chennai." },

  { districtSlug: "chennai", match: "Poonamallee Bypass", matchAlt: ["Poonamallee Bypass Road"],
    executingAgency: "NHAI / Tamil Nadu Highways", category: "Roads",
    description: "Widening of Poonamallee bypass on NH-4 to ease congestion at Chennai's western gateway connecting to Bengaluru highway." },

  // ═══════════════════════ HYDERABAD (12) ═══════════════════
  { districtSlug: "hyderabad", match: "Hyderabad Metro Rail Phase 2", matchAlt: ["HMRL Phase 2", "Metro Phase 2"],
    announcedBy: "Revanth Reddy", announcedByRole: "Chief Minister, Telangana", party: "INC",
    executingAgency: "Hyderabad Metro Rail Ltd / L&T", category: "Metro",
    description: "Phase 2 expansion with new corridors to Airport, Old City and ECIL connecting underserved areas of Hyderabad.",
    originalBudget: 350000000000 },

  { districtSlug: "hyderabad", match: "Regional Ring Road", matchAlt: ["RRR", "RRR — Phase 1", "Regional Ring Road (RRR)"],
    announcedBy: "K. Chandrashekar Rao", announcedByRole: "Former CM Telangana", party: "BRS",
    executingAgency: "NHAI / Telangana Roads & Buildings", category: "Roads",
    description: "158 km northern arc of the 340 km regional ring road connecting Shamshabad to Sangareddy via Toopran.",
    originalBudget: 160000000000 },

  { districtSlug: "hyderabad", match: "Musi Riverfront", matchAlt: ["Musi Riverfront Development"],
    announcedBy: "Revanth Reddy", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "HMDA", category: "Environment",
    description: "55 km riverfront development for flood control, sewage treatment and public recreation along the Musi river through Hyderabad." },

  { districtSlug: "hyderabad", match: "Pharma City", matchAlt: ["Hyderabad Pharma City"],
    announcedBy: "K. Chandrashekar Rao", announcedByRole: "Former CM", party: "BRS",
    executingAgency: "TSIIC (Telangana State Industrial Infrastructure Corporation)", category: "Industry",
    description: "19,000-acre pharmaceutical manufacturing hub at Mucherla, the world's largest integrated pharma city.",
    originalBudget: 100000000000 },

  { districtSlug: "hyderabad", match: "Strategic Road Development", matchAlt: ["SRDP", "Strategic Road Development Plan"],
    executingAgency: "GHMC (Greater Hyderabad Municipal Corporation)", category: "Roads",
    description: "56 flyovers, underpasses and road widenings across Hyderabad to create signal-free corridors on all arterial roads.",
    originalBudget: 250000000000 },

  { districtSlug: "hyderabad", match: "Hyderabad Airport Expansion", matchAlt: ["Airport New Terminal", "Rajiv Gandhi International Airport"],
    executingAgency: "GMR Hyderabad International Airport", category: "Airport",
    description: "New terminal expansion at Rajiv Gandhi International Airport doubling capacity to 34 million passengers annually." },

  { districtSlug: "hyderabad", match: "Outer Ring Road", matchAlt: ["ORR", "ORR Expansion", "8 Laning"],
    executingAgency: "HMDA / GHMC", category: "Roads",
    description: "8-laning of Hyderabad's 158 km Outer Ring Road to handle growing traffic from IT corridors in Gachibowli and Madhapur." },

  { districtSlug: "hyderabad", match: "Mission Bhagiratha", matchAlt: ["Urban Drinking Water"],
    announcedBy: "K. Chandrashekar Rao", announcedByRole: "Former CM", party: "BRS",
    executingAgency: "Telangana Mission Bhagiratha", category: "Water",
    description: "Treated drinking water from Godavari and Krishna rivers to every household in Telangana including Hyderabad outskirts.",
    originalBudget: 430000000000 },

  { districtSlug: "hyderabad", match: "PV Narasimha Rao Expressway", matchAlt: ["PVNR Expressway", "Hyderabad Elevated Corridor"],
    executingAgency: "GHMC / Telangana R&B", category: "Roads",
    description: "27 km elevated expressway connecting Mehdipatnam to Shamshabad airport via PVNR Expressway for faster airport access." },

  { districtSlug: "hyderabad", match: "IT Investment Region", matchAlt: ["ITIR", "ITIR — Hyderabad"],
    executingAgency: "Telangana IT Department / TSIIC", category: "Industry",
    description: "202 sq km IT investment region covering Gachibowli, Nanakramguda and surrounding areas as India's second largest tech hub." },

  { districtSlug: "hyderabad", match: "Metro Depot", matchAlt: ["Uppal", "Hyderabad Metro Depot"],
    executingAgency: "Hyderabad Metro Rail Ltd", category: "Metro",
    description: "Metro rail maintenance depot at Uppal serving the Blue Line corridor with train stabling, maintenance and control room." },

  { districtSlug: "hyderabad", match: "Supercomputer", matchAlt: ["Telangana Supercomputer", "Supercomputer Centre"],
    announcedBy: "Revanth Reddy", announcedByRole: "Chief Minister", party: "INC",
    executingAgency: "Telangana IT Department", category: "Other",
    description: "High-performance computing centre for AI research, weather modelling and government data processing in Hyderabad." },

  // ═══════════════════════ NEW DELHI (19) ═══════════════════
  { districtSlug: "new-delhi", match: "Delhi Metro Phase 4", matchAlt: ["Phase 4", "DMRC Phase 4"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "DMRC", category: "Metro",
    description: "65.1 km Phase 4 with 3 priority corridors — Janakpuri West-RK Ashram, Majlis Park-Maujpur, Aerocity-Tughlakabad.",
    originalBudget: 249000000000 },

  { districtSlug: "new-delhi", match: "Delhi-Meerut RRTS", matchAlt: ["Delhi–Meerut RRTS", "Namo Bharat"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "NCRTC", category: "Rail",
    description: "82 km regional rapid transit from Sarai Kale Khan to Meerut at 180 km/h, reducing 3-hour journey to 55 minutes." },

  { districtSlug: "new-delhi", match: "Dwarka Expressway",
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "NHAI", category: "Roads",
    description: "29 km expressway from Dwarka to Gurugram including India's first elevated urban expressway section, easing NH-48 congestion." },

  { districtSlug: "new-delhi", match: "Pragati Maidan", matchAlt: ["Integrated Transit Hub", "Pragati Maidan Integrated Transit"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "ITPO / CPWD", category: "Other",
    description: "Redevelopment of Pragati Maidan into world-class convention centre with 7 exhibition halls, transit hub and underground parking.",
    originalBudget: 27000000000 },

  { districtSlug: "new-delhi", match: "New Parliament Building", matchAlt: ["Central Vista", "Parliament"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "CPWD / Tata Projects", category: "Other",
    description: "New Parliament building with triangular architecture seating 1,272 MPs, part of the Central Vista redevelopment project.",
    originalBudget: 9710000000 },

  { districtSlug: "new-delhi", match: "Delhi-SNB", matchAlt: ["Sonipat-Narela-Bawana", "SNB RRTS"],
    executingAgency: "NCRTC", category: "Rail",
    description: "Regional rapid transit corridor from Delhi to Sonipat via Narela and Bawana connecting northern NCR to Delhi." },

  { districtSlug: "new-delhi", match: "Chandni Chowk", matchAlt: ["Chandni Chowk Redevelopment"],
    executingAgency: "NDMC / Delhi PWD", category: "Heritage",
    description: "Pedestrianisation and heritage restoration of iconic Chandni Chowk street with underground utilities and improved drainage.",
    originalBudget: 9900000000 },

  { districtSlug: "new-delhi", match: "Ring Road Flyovers", matchAlt: ["Delhi Ring Road", "Signal-Free"],
    executingAgency: "Delhi PWD / NHAI", category: "Roads",
    description: "Series of flyovers and underpasses to make Delhi's Ring Road completely signal-free for uninterrupted traffic flow." },

  { districtSlug: "new-delhi", match: "Barapullah", matchAlt: ["Barapullah Elevated Road", "Barapullah Phase 3"],
    executingAgency: "Delhi PWD", category: "Roads",
    description: "Phase 3 extension from Sarai Kale Khan to Mayur Vihar completing the 17 km elevated corridor across south-east Delhi.",
    originalBudget: 55000000000 },

  { districtSlug: "new-delhi", match: "Terminal 4", matchAlt: ["T4", "Delhi Airport Terminal 4"],
    executingAgency: "DIAL (GMR Group)", category: "Airport",
    description: "New Terminal 4 at IGI Airport expanding capacity to handle 100 million passengers, incorporating the old domestic terminal site." },

  { districtSlug: "new-delhi", match: "Jewar International Airport", matchAlt: ["Jewar", "Noida International Airport"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "Zurich Airport International / YEIDA", category: "Airport",
    description: "New international airport at Jewar in Greater Noida as Delhi NCR's second airport, Phase 1 capacity 12 million passengers.",
    originalBudget: 296000000000 },

  { districtSlug: "new-delhi", match: "Urban Extension Road", matchAlt: ["UER Phase 2", "UER-II"],
    executingAgency: "Delhi PWD", category: "Roads",
    description: "Urban Extension Road Phase 2 connecting Wazirabad to Outer Ring Road for north-east Delhi traffic decongestion." },

  { districtSlug: "new-delhi", match: "AIIMS Expansion", matchAlt: ["AIIMS Trauma Centre", "Delhi AIIMS"],
    executingAgency: "AIIMS / Ministry of Health", category: "Hospital",
    description: "Expansion of AIIMS New Delhi with new trauma centre, burn ward and advanced diagnostic block for the national referral hospital." },

  { districtSlug: "new-delhi", match: "Yamuna Riverfront", matchAlt: ["Yamuna Riverfront Development"],
    executingAgency: "DDA (Delhi Development Authority)", category: "Environment",
    description: "Riverfront development along Yamuna with biodiversity parks, recreational areas and flood plain restoration.",
    originalBudget: 15000000000 },

  { districtSlug: "new-delhi", match: "G20 Summit Infrastructure", matchAlt: ["G20 Legacy", "Bharat Mandapam"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "CPWD / NDMC", category: "Other",
    description: "Infrastructure built for G20 Summit 2023 including Bharat Mandapam convention centre, road beautification and signage upgrades." },

  { districtSlug: "new-delhi", match: "Safe City", matchAlt: ["CCTV & Safe City", "Delhi Smart City"],
    executingAgency: "Delhi Police / MHA", category: "Other",
    description: "2.7 lakh CCTV cameras across Delhi for women's safety, crime prevention and traffic monitoring under Safe City project." },

  { districtSlug: "new-delhi", match: "Najafgarh Drain", matchAlt: ["Najafgarh Drain Rejuvenation"],
    executingAgency: "DJB (Delhi Jal Board) / DDA", category: "Sewage",
    description: "Rejuvenation of the 57 km Najafgarh drain with sewage diversion, desilting and converting into a stormwater channel." },

  { districtSlug: "new-delhi", match: "Bus Shelter", matchAlt: ["1,400 Shelters", "Bus Shelter Modernisation"],
    executingAgency: "DIMTS / Delhi Transport Department", category: "Other",
    description: "Modernisation of 1,400 bus shelters across Delhi with real-time bus tracking displays, solar panels and seating." },

  { districtSlug: "new-delhi", match: "Electric Vehicle Policy", matchAlt: ["EV Policy", "Delhi Electric Vehicle"],
    announcedBy: "Arvind Kejriwal", announcedByRole: "Former CM Delhi", party: "AAP",
    executingAgency: "Delhi Transport Department", category: "Power",
    description: "EV charging infrastructure with 500+ public charging stations across Delhi supporting the electric vehicle adoption policy." },

  // ═══════════════════════ KOLKATA (18) ═════════════════════
  { districtSlug: "kolkata", match: "East-West Corridor", matchAlt: ["Green Line", "Kolkata Metro East-West"],
    executingAgency: "KMRC (Kolkata Metro Rail Corporation)", category: "Metro",
    description: "16.6 km east-west metro under Hooghly river connecting Salt Lake to Howrah with India's first underwater metro tunnel.",
    originalBudget: 88000000000 },

  { districtSlug: "kolkata", match: "Joka-BBD Bagh", matchAlt: ["Joka–BBD Bagh", "Purple Line"],
    executingAgency: "RVNL", category: "Metro",
    description: "16.7 km metro from Joka to BBD Bagh (Esplanade) serving south Kolkata's dense residential corridor with 14 stations.",
    originalBudget: 47000000000 },

  { districtSlug: "kolkata", match: "New Garia-Airport", matchAlt: ["New Garia–Airport", "Orange Line"],
    executingAgency: "RVNL", category: "Metro",
    description: "29.9 km metro from New Garia to Airport connecting south Kolkata, EM Bypass, Rajarhat and Netaji Subhas Chandra Bose Airport.",
    originalBudget: 84000000000 },

  { districtSlug: "kolkata", match: "Circular Railway", matchAlt: ["Kolkata Circular Railway", "Circular Railway Revival"],
    executingAgency: "Eastern Railway", category: "Rail",
    description: "Revival of Kolkata's dormant Circular Railway with electrification, new stations and integration with metro for orbital connectivity." },

  { districtSlug: "kolkata", match: "Port Modernisation", matchAlt: ["Syama Prasad Mookerjee Port", "Kolkata Port"],
    executingAgency: "Syama Prasad Mookerjee Port Trust", category: "Port",
    description: "Modernisation of Kolkata port with mechanised berths, deeper draft channel and new cargo terminals for riverine shipping." },

  { districtSlug: "kolkata", match: "New Town", matchAlt: ["Rajarhat Smart City", "New Town Smart City"],
    executingAgency: "HIDCO (Housing Infrastructure Development Corporation)", category: "Housing",
    description: "Phase 2 development of New Town/Rajarhat with IT hubs, convention centre, medical district and smart infrastructure." },

  { districtSlug: "kolkata", match: "EM Bypass", matchAlt: ["Eastern Metropolitan Bypass", "EM Bypass Elevated"],
    executingAgency: "KMDA (Kolkata Metropolitan Development Authority)", category: "Roads",
    description: "Elevated corridor along Eastern Metropolitan Bypass to create signal-free connectivity from Ultadanga to Garia.",
    originalBudget: 35000000000 },

  { districtSlug: "kolkata", match: "East Kolkata Wetlands", matchAlt: ["Wetlands Conservation", "Kolkata Waterways"],
    executingAgency: "KMDA / East Kolkata Wetlands Management Authority", category: "Environment",
    description: "Conservation of East Kolkata Wetlands, a Ramsar site and the world's largest organic wastewater recycling system." },

  { districtSlug: "kolkata", match: "Diamond Harbour", matchAlt: ["Diamond Harbour Road"],
    executingAgency: "West Bengal PWD", category: "Roads",
    description: "Widening of Diamond Harbour Road connecting south Kolkata to the port town, reducing congestion on this vital corridor." },

  { districtSlug: "kolkata", match: "Howrah Bridge", matchAlt: ["Rabindra Setu", "Howrah Bridge Rehabilitation"],
    executingAgency: "Kolkata Port Trust / West Bengal PWD", category: "Bridge",
    description: "Structural rehabilitation and corrosion repair of the iconic 1943 Howrah Bridge carrying 100,000 vehicles daily over the Hooghly." },

  { districtSlug: "kolkata", match: "Vivekananda Bridge", matchAlt: ["Second Hooghly Bridge", "Vivekananda Bridge Approach"],
    executingAgency: "KMDA", category: "Bridge",
    description: "Improved approach roads to the Second Hooghly Bridge reducing bottlenecks at both Kolkata and Howrah ends." },

  { districtSlug: "kolkata", match: "LED Street Lighting", matchAlt: ["Smart Street Lighting", "50,000 LED"],
    executingAgency: "Kolkata Municipal Corporation / EESL", category: "Power",
    description: "Replacement of 50,000 conventional streetlights with LED smart lights with remote monitoring and energy savings." },

  { districtSlug: "kolkata", match: "Bagha Jatin", matchAlt: ["Bagha Jatin-New Garia Flyover", "Bagha Jatin Flyover"],
    executingAgency: "KMDA", category: "Flyover",
    description: "Flyover connecting Bagha Jatin to New Garia reducing traffic congestion on the busy south Kolkata corridor." },

  { districtSlug: "kolkata", match: "Drainage Improvement", matchAlt: ["Anti-Waterlogging", "Kolkata Drainage"],
    executingAgency: "KMC Drainage Department", category: "Sewage",
    description: "Comprehensive drainage upgrade with pumping stations, canal clearing and retention ponds to prevent chronic waterlogging in monsoons." },

  { districtSlug: "kolkata", match: "NSCBI Airport", matchAlt: ["Netaji Subhas Chandra Bose Airport", "Airport Terminal Expansion"],
    executingAgency: "AAI", category: "Airport",
    description: "Terminal expansion and new apron at NSCBI Airport to increase passenger handling capacity from 26 to 40 million annually." },

  { districtSlug: "kolkata", match: "Tram Revival", matchAlt: ["Kolkata Tram"],
    executingAgency: "Calcutta Tramways Company (CTC)", category: "Other",
    description: "Revival and modernisation of Kolkata's heritage tram network with AC trams, dedicated corridors and tourist heritage routes." },

  { districtSlug: "kolkata", match: "Bantala Leather", matchAlt: ["Leather Complex", "Bantala Leather Complex"],
    executingAgency: "WBIDC (West Bengal Industrial Development Corporation)", category: "Industry",
    description: "Modernisation of Bantala Leather Complex with effluent treatment upgrade, technology centre and common facility for leather industry." },

  { districtSlug: "kolkata", match: "Convention Centre", matchAlt: ["Kolkata Convention Centre"],
    executingAgency: "HIDCO", category: "Other",
    description: "International convention and exhibition centre in New Town for business events, conferences and trade shows." },

  // ═══════════════════════ LUCKNOW (7) ══════════════════════
  { districtSlug: "lucknow", match: "North-South Corridor", matchAlt: ["Lucknow Metro", "CCS Airport to Munshipulia"],
    announcedBy: "Yogi Adityanath", announcedByRole: "Chief Minister, Uttar Pradesh", party: "BJP",
    executingAgency: "UPMRC (Uttar Pradesh Metro Rail Corporation)", category: "Metro",
    description: "23 km north-south metro corridor from CCS Airport to Munshipulia with 21 stations serving Lucknow's central spine.",
    originalBudget: 67000000000 },

  { districtSlug: "lucknow", match: "Lucknow-Agra Expressway", matchAlt: ["Lucknow–Agra Expressway", "Agra Expressway"],
    announcedBy: "Akhilesh Yadav", announcedByRole: "Former CM, Uttar Pradesh", party: "SP",
    executingAgency: "UPEIDA", category: "Roads",
    description: "302 km expressway connecting Lucknow to Agra at 100 km/h reducing travel time from 6 hours to 3.5 hours." },

  { districtSlug: "lucknow", match: "Gomti Riverfront", matchAlt: ["Gomti Riverfront Development"],
    announcedBy: "Akhilesh Yadav", announcedByRole: "Former CM", party: "SP",
    executingAgency: "Lucknow Development Authority", category: "Environment",
    description: "6 km riverfront beautification along Gomti river with ghats, gardens and recreational spaces, now partially stalled due to environmental concerns." },

  { districtSlug: "lucknow", match: "East-West Corridor", matchAlt: ["Lucknow Metro Phase 2", "Charbagh to Vasant Kunj"],
    announcedBy: "Yogi Adityanath", announcedByRole: "Chief Minister", party: "BJP",
    executingAgency: "UPMRC", category: "Metro",
    description: "11 km east-west corridor from Charbagh to Vasant Kunj connecting the railway station to IT City and eastern growth areas.",
    originalBudget: 55000000000 },

  { districtSlug: "lucknow", match: "Ring Road Phase 2", matchAlt: ["Lucknow Ring Road", "Outer Ring Road Lucknow"],
    announcedBy: "Yogi Adityanath", announcedByRole: "Chief Minister", party: "BJP",
    executingAgency: "UP PWD / NHAI", category: "Roads",
    description: "104 km outer ring road around Lucknow connecting all national highways to decongest city centre and enable peripheral growth.",
    originalBudget: 50000000000 },

  { districtSlug: "lucknow", match: "Lucknow Airport", matchAlt: ["Chaudhary Charan Singh Airport", "Lucknow Airport New Terminal"],
    announcedBy: "Narendra Modi", announcedByRole: "Prime Minister", party: "BJP",
    executingAgency: "Adani Group / AAI", category: "Airport",
    description: "New integrated terminal at Chaudhary Charan Singh Airport designed to handle 18 million passengers annually with modern facilities.",
    originalBudget: 24000000000 },

  { districtSlug: "lucknow", match: "IT City Lucknow", matchAlt: ["Gomti Nagar Extension", "Sector 12-14"],
    announcedBy: "Yogi Adityanath", announcedByRole: "Chief Minister", party: "BJP",
    executingAgency: "Lucknow Development Authority / UP IT Department", category: "Industry",
    description: "IT park and knowledge hub in Gomti Nagar Extension with office spaces, incubators and residential township for tech workforce." },
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
      description: `${districtName} manual-research create: ${fill.match}`,
      recordCount: 1, details: { createdVia: "fill-remaining-districts" },
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
      description: `${districtName} manual-research fill: ${row.name} ← ${filled.length} fields`,
      recordCount: 1, details: { filledFields: filled },
    });
  }

  return { matched: true, filledFields: filled, projectName: row.name };
}

async function globalDeleteMetroLightNeo() {
  const matches = await prisma.infraProject.findMany({
    where: {
      OR: [
        { name: { contains: "Metro light", mode: "insensitive" } },
        { name: { contains: "metro neo", mode: "insensitive" } },
        { name: { contains: "Metro Light and Metro Neo", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, districtId: true },
  });
  const filtered = matches.filter((r) => /metro\s*light.*metro\s*neo|metro\s*neo.*tier/i.test(r.name));
  if (filtered.length === 0) {
    console.log("🧹 Global cleanup: no 'Metro light and metro neo' noise rows found.\n");
    return;
  }
  console.log(`🧹 Global cleanup: deleting ${filtered.length} 'Metro light/neo for Tier 2' noise row(s):`);
  for (const r of filtered) console.log(`   - ${r.name}`);
  if (!DRY_RUN) {
    const ids = filtered.map((r) => r.id);
    await prisma.infraUpdate.deleteMany({ where: { projectId: { in: ids } } });
    await prisma.infraProject.deleteMany({ where: { id: { in: ids } } });
  }
  console.log("");
}

async function main() {
  console.log(`🛠  Remaining districts manual-research fill ${DRY_RUN ? "(DRY-RUN)" : ""}\n`);

  await globalDeleteMetroLightNeo();

  const slugs = Array.from(new Set(DATA.map((d) => d.districtSlug)));
  const districts = await prisma.district.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, name: true, slug: true },
  });
  const bySlug = new Map(districts.map((d) => [d.slug, d]));
  for (const s of slugs) {
    if (!bySlug.has(s)) throw new Error(`District not found: ${s}`);
  }

  const perDistrict: Record<string, { filled: number; nop: number; created: number }> = {};

  for (const fill of DATA) {
    const d = bySlug.get(fill.districtSlug)!;
    perDistrict[d.slug] ||= { filled: 0, nop: 0, created: 0 };
    const r = await applyFill(d.id, d.name, fill);
    const name = (r.projectName ?? fill.match).padEnd(48).slice(0, 48);
    const tag = d.slug.padEnd(10).slice(0, 10);
    if (r.filledFields.includes("CREATED") || r.filledFields.includes("CREATE (dry-run)")) {
      console.log(`[${tag}] 🆕 ${name}`);
      perDistrict[d.slug].created++;
    } else if (r.filledFields.length === 0) {
      console.log(`[${tag}] ⏭  ${name} (already complete)`);
      perDistrict[d.slug].nop++;
    } else {
      console.log(`[${tag}] ✅ ${name} ← ${r.filledFields.join(", ")}`);
      perDistrict[d.slug].filled++;
    }
  }

  console.log(`\n\n📊 Coverage summary per district:`);
  console.log(`| District        | Total | Desc Filled | Agency Filled | People Filled |`);
  console.log(`|-----------------|-------|-------------|---------------|---------------|`);
  for (const d of districts) {
    const rows = await prisma.infraProject.findMany({
      where: { districtId: d.id },
      select: { description: true, executingAgency: true, announcedBy: true },
    });
    const total = rows.length;
    const desc = rows.filter((r) => r.description).length;
    const agency = rows.filter((r) => r.executingAgency).length;
    const people = rows.filter((r) => r.announcedBy).length;
    console.log(
      `| ${d.name.padEnd(15).slice(0, 15)} | ${String(total).padEnd(5)} | ${String(desc).padEnd(11)} | ${String(agency).padEnd(13)} | ${String(people).padEnd(13)} |`
    );
  }

  console.log(`\nPer-district fill tally:`);
  for (const [slug, c] of Object.entries(perDistrict)) {
    console.log(`  ${slug.padEnd(12)} — filled ${c.filled} · created ${c.created} · nop ${c.nop}`);
  }
  const totalFilled = Object.values(perDistrict).reduce((s, c) => s + c.filled, 0);
  const totalCreated = Object.values(perDistrict).reduce((s, c) => s + c.created, 0);
  const totalNop = Object.values(perDistrict).reduce((s, c) => s + c.nop, 0);
  console.log(`\nTOTAL: ${DATA.length} processed · ${totalFilled} filled · ${totalCreated} created · ${totalNop} already complete`);
}

main()
  .catch((err) => { console.error("Fatal:", err); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
