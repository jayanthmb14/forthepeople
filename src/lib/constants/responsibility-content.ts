/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 *
 * Per-district "My Responsibility" content.
 * Each active district gets customised citizen responsibility data
 * based on its unique challenges, demographics, and opportunities.
 */

/**
 * One group of citizen actions. The responsibility page renders `title`
 * as a section heading and `items` as a bullet list inside a Card.
 *
 * Design v3: the old `emoji`, `color` (hex/gradient) and `border` (hex)
 * fields were removed — no component read them any more, and v3 uses
 * Lucide icons and design tokens instead of emoji and hex colours.
 */
export interface ResponsibilitySection {
  title: string;
  items: string[];
  /** The "where can we be in 5 years" section; shown with a short lead-in. */
  isProjection?: boolean;
}

export interface DistrictResponsibilityContent {
  districtName: string;
  intro: string;
  sections: ResponsibilitySection[];
}

// ── Mandya ──────────────────────────────────────────────────

const MANDYA_CONTENT: DistrictResponsibilityContent = {
  districtName: "Mandya",
  intro:
    "Mandya district faces real challenges — and real opportunities. Here's what YOU can do as a citizen to help your district grow.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Mandya generates ~180 tonnes of solid waste per day — only 62% is processed (source: SBM report 2023)",
        "Segregate waste at source: wet waste (green bin) + dry waste (blue bin)",
        "Do NOT dump waste near KRS dam backwaters or irrigation canals",
        "Participate in ward-level Swachh Bharat cleanliness drives (usually first Saturday of month)",
        "Report illegal dumping to the Mandya City Municipal Council",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "KRS dam is the lifeline of Mandya — it irrigates 1.23 lakh hectares of farmland",
        "Switch to drip irrigation for sugarcane (saves 40-60% water vs flood irrigation)",
        "Fix leaky pipes and taps — a dripping tap wastes 15,000 litres/year",
        "1,087 lakes and tanks exist in Mandya — help protect them from encroachment",
        "Harvest rainwater at home: Mandya gets ~695mm annual rainfall — use it!",
        "Report illegal sand mining from the Kaveri river to the Deputy Commissioner's office",
      ],
    },
    {
      title: "Agriculture",
      items: [
        "Mandya produces 12+ lakh tonnes of sugarcane annually — India's sugar bowl",
        "Do NOT burn paddy stubble — it causes severe air pollution and kills soil organisms",
        "Get your soil tested free at KVK Mandya: test every 3 years for NPK balance",
        "Join Farmers Producer Organizations (FPOs) for better price negotiation",
        "Diversify beyond sugarcane to reduce water stress: ragi, maize, vegetables",
        "PM-KISAN: ensure you've registered and receiving ₹6,000/year benefits",
      ],
    },
    {
      title: "Environment",
      items: [
        "Mandya's forest cover is declining — plant native trees (neem, peepal, banyan) in your land/village",
        "Protect village tanks: they recharge groundwater and support biodiversity",
        "Kaveri river basin is under stress — avoid washing vehicles/clothes in the river",
        "Report encroachment of forest land or riverbed to the Forest Department",
        "Use LED bulbs and solar panels — BESCOM offers solar subsidies for farmers",
      ],
    },
    {
      title: "Road Safety",
      items: [
        "Mandya records ~200 road accidents annually on NH-275 and SH-17",
        "Always wear helmets on two-wheelers (mandatory in Karnataka)",
        "Report potholes to the PWD office in Mandya",
        "Don't drink and drive — report drunk driving on 112",
        "NH-275 (Bengaluru-Mysuru highway) is high-risk — use service road wherever available",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend Gram Sabha meetings — held twice a year in your village, open to all adults",
        "Pay property tax on time — unpaid taxes reduce funds for local infrastructure",
        "File RTI applications to question government spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in",
        "Report corruption to the Karnataka Lokayukta: lokayukta.karnataka.gov.in or its office, 080-22257013",
        "Participate in district planning committee meetings — your voice matters",
      ],
    },
    {
      title: "What Mandya Can Become in 5 Years",
      isProjection: true,
      items: [
        "Top 5 districts in Karnataka for farmer income — if FPOs scale up and diversify crops",
        "Model district for water conservation — if drip irrigation adoption reaches 60%",
        "Clean city ranking improvement — if 100% waste segregation is achieved",
        "75%+ literacy — the 2011 census recorded 70.4%, achievable with community learning centres",
        "Zero child malnutrition in anganwadis — if ICDS schemes are utilized fully",
        "Zero potholes on all taluk roads — if citizens actively report via apps",
      ],
    },
  ],
};

// ── Bengaluru Urban ─────────────────────────────────────────

const BENGALURU_URBAN_CONTENT: DistrictResponsibilityContent = {
  districtName: "Bengaluru Urban",
  intro:
    "Bengaluru Urban is India's tech capital — but it faces mounting urban challenges. Here's what YOU can do as a citizen to keep this city liveable.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Bengaluru generates ~6,000 tonnes of solid waste per day — only ~40% is properly segregated (source: BBMP SWM)",
        "Segregate waste at source: wet (green), dry (blue), reject (red) — BBMP mandates 3-bin segregation",
        "E-waste from IT sector is a growing crisis — drop old electronics at BBMP-authorised e-waste centres, not in regular bins",
        "Construction debris dumping on lake beds is illegal — report it to the city corporation",
        "Compost wet waste at home or apartment level — BBMP offers composting subsidies for bulk generators",
        "Download BBMP SWM app to report missed pickups, illegal dumping, and burning of waste",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Bengaluru's water is piped from Kaveri ~100 km away — the city has no local river source",
        "Groundwater table has dropped from 30 ft to 1,000+ ft in parts of the city over 30 years",
        "Rainwater harvesting is mandatory for all sites >2,400 sq ft (BWSSB rule) — comply and install",
        "200+ lakes once existed in Bengaluru — fewer than 80 survive today. Protect your nearest lake from encroachment",
        "Fix leaking taps and pipes — a single leak wastes 15,000+ litres/year",
        "Report illegal borewells and water-tanker overcharging to BWSSB",
      ],
    },
    {
      title: "Traffic & Transport",
      items: [
        "Bengaluru has 80 lakh+ registered vehicles — average commute is 1.5-2 hours daily",
        "Use Namma Metro and BMTC buses wherever possible — every car off the road helps",
        "Carpool for office commutes — apps like Quickride and local apartment groups reduce vehicles by 30%",
        "Report potholes to the city corporation (Sahaaya app)",
        "Outer Ring Road, Silk Board junction, and KR Puram are critical bottlenecks — avoid peak hours if possible",
        "Follow lane discipline and signal rules — Bengaluru records 800+ road fatalities per year",
      ],
    },
    {
      title: "Environment & Lakes",
      items: [
        "Bengaluru's green cover has dropped from 68% (1973) to under 3% today — plant native trees in your compound",
        "Bellandur and Varthur lakes have caught fire from toxic foam — never dump sewage or chemicals into storm drains",
        "Ulsoor, Sankey, Hebbal lakes are biodiversity hotspots — volunteer with lake restoration groups",
        "Urban heat island effect has increased temperatures by 2-3°C — every tree you plant counts",
        "Report tree felling to BBMP Forest Cell — cutting trees without permission is a criminal offence",
        "Avoid single-use plastics — Karnataka has a plastic ban in effect since 2016",
      ],
    },
    {
      title: "Tech for Good",
      items: [
        "Use IChangeMyCity app to report civic issues — potholes, garbage, broken streetlights",
        "Volunteer at government schools for digital literacy sessions — Bengaluru has the talent to bridge the digital divide",
        "Contribute to OpenStreetMap for Bengaluru — better maps help emergency services and urban planning",
        "Attend BBMP ward committee meetings — they are open to public and discuss your ward's budget",
        "Use BBMP Sahaaya, BES-COM apps, and BWSSB portals for all civic services instead of middlemen",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend BBMP ward committee meetings — each of 243 wards has monthly meetings open to all residents",
        "Pay property tax on time via Bengaluru One portal — unpaid taxes reduce funds for roads and drains",
        "File RTI applications to question BBMP, BDA, and BWSSB spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in — Bengaluru's voter turnout is often below 55%",
        "Report corruption to the Karnataka Lokayukta: lokayukta.karnataka.gov.in or its office, 080-22257013",
        "Join or form your apartment's Resident Welfare Association (RWA) — collective civic action works",
      ],
    },
    {
      title: "What Bengaluru Can Become in 5 Years",
      isProjection: true,
      items: [
        "India's cleanest metro — if waste segregation compliance reaches 90% across all 243 wards",
        "Water-secure city — if rainwater harvesting is enforced and 50+ lakes are restored",
        "30-minute city — if Metro Phase 3 completes and last-mile connectivity improves",
        "10% green cover recovery — if 1 crore trees are planted and protected across the district",
        "75%+ voter turnout — if young tech professionals exercise their democratic right",
        "Zero traffic fatalities — if signal compliance, helmet use, and lane discipline improve",
      ],
    },
  ],
};

// ── Mysuru ──────────────────────────────────────────────────

const MYSURU_CONTENT: DistrictResponsibilityContent = {
  districtName: "Mysuru",
  intro:
    "Mysuru is Karnataka's heritage jewel — once India's cleanest city. Here's what YOU can do as a citizen to protect its legacy and build its future.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Mysuru was ranked India's cleanest city in 2015-16 (Swachh Survekshan) — let's reclaim that title",
        "The city generates ~400 tonnes of solid waste per day — segregation discipline must not slip",
        "Keep heritage zones (Mysore Palace, Chamundi Hills, Brindavan Gardens) litter-free — you are the ambassador",
        "Participate in Swachh Bharat drives organised by MCC — especially before and after Dasara festival",
        "Report illegal dumping to the Mysuru City Corporation (MCC)",
        "Compost kitchen waste at home — MCC provides composting kits for residential areas",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Kabini and Kaveri rivers are Mysuru's primary water sources — both are under seasonal stress",
        "Mysuru district has 3,000+ lakes and tanks — help protect them from encroachment and pollution",
        "Kukkarahalli Lake is a biodiversity hotspot with 180+ bird species — keep it clean, report violations",
        "Switch to drip irrigation for sugarcane and paddy — saves 40-60% water vs flood irrigation",
        "Harvest rainwater at home: Mysuru receives ~785mm annual rainfall — every drop counts",
        "Report illegal sand mining and water pollution to the Deputy Commissioner's office",
      ],
    },
    {
      title: "Heritage & Tourism",
      items: [
        "Mysore Palace receives 6 million+ visitors annually — do not deface, litter, or damage heritage structures",
        "Support local artisans — Mysuru silk sarees, sandalwood crafts, and rosewood inlay are centuries-old traditions",
        "Chamundi Hills temple draws thousands daily — follow waste disposal rules and use designated parking",
        "Brindavan Gardens and KRS dam are public assets — report vandalism and encroachment",
        "During Dasara (10 days, millions of visitors), follow traffic diversions and help tourists navigate the city",
        "Promote responsible tourism — recommend homestays and local eateries over chain hotels to spread economic benefits",
      ],
    },
    {
      title: "Wildlife & Environment",
      items: [
        "Nagarahole National Park (tiger reserve) borders Mysuru district — never encroach forest buffer zones",
        "Human-wildlife conflict in H.D. Kote taluk is serious — report elephant/tiger sightings to the Forest Department",
        "Do NOT feed or provoke wild animals near forest fringes — it increases conflict and endangers both humans and animals",
        "Western Ghats buffer zone around Mysuru needs protection — oppose illegal quarrying and logging",
        "Plant native trees (sandalwood, teak, neem) — Mysuru's forest cover supports biodiversity corridors",
        "Reduce single-use plastics — they end up in rivers and wildlife habitats",
      ],
    },
    {
      title: "Agriculture",
      items: [
        "Mysuru district is a major producer of tobacco, sugarcane, and rice — diversification reduces risk",
        "Do NOT burn crop stubble — it destroys soil health and causes respiratory illness in nearby villages",
        "Get free soil testing at KVK Mysuru — test every 3 years for balanced NPK",
        "Join Farmers Producer Organizations (FPOs) for better market access and price discovery",
        "Adopt organic farming practices — Mysuru has strong demand from urban Bengaluru consumers",
        "PM-KISAN: verify your registration and ensure you're receiving ₹6,000/year benefits",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend Gram Sabha meetings — held twice a year in your village, open to all adults",
        "Pay property tax on time via Nada Kacheri — unpaid taxes reduce funds for local roads and drains",
        "File RTI applications to question government spending in your taluk and district",
        "Verify your name on the electoral roll at voters.eci.gov.in",
        "Report corruption to the Karnataka Lokayukta: lokayukta.karnataka.gov.in or its office, 080-22257013",
        "Participate in Zilla Panchayat and Taluk Panchayat meetings — your voice shapes local development",
      ],
    },
    {
      title: "What Mysuru Can Become in 5 Years",
      isProjection: true,
      items: [
        "Reclaim India's cleanest city title — if 100% waste segregation and zero open dumping is achieved",
        "UNESCO World Heritage status for Mysore Palace precinct — if conservation standards are maintained",
        "Zero human-wildlife conflict deaths — if buffer zones are respected and early warning systems work",
        "75%+ literacy — the 2011 census recorded 72.79%, achievable with community learning centres and school enrollment drives",
        "Model organic farming district — if 30% of farmers adopt organic practices for premium market access",
        "Year-round cultural tourism hub — if Dasara success is extended to heritage festivals in every taluk",
      ],
    },
  ],
};

// ── New Delhi ───────────────────────────────────────────────

const NEW_DELHI_CONTENT: DistrictResponsibilityContent = {
  districtName: "New Delhi",
  intro:
    "New Delhi is India's capital and seat of power — but it faces severe pollution, water stress, and civic challenges. Here's what YOU can do as a citizen.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Delhi generates ~11,000 tonnes of solid waste per day — only ~55% is processed (source: MCD reports)",
        "Segregate waste at source: wet (green), dry (blue), hazardous (red) — MCD mandates segregation",
        "Three massive landfills (Ghazipur, Bhalswa, Okhla) are at critical capacity — reduce waste at source",
        "Report illegal dumping and open burning to the MCD (MCD 311 app)",
        "Compost kitchen waste — apartments with 100+ units must set up composting facilities (MCD rule)",
        "Do NOT burn garbage or leaves — it contributes directly to Delhi's winter smog crisis",
      ],
    },
    {
      title: "Air Quality & Pollution",
      items: [
        "Delhi's AQI crosses 400+ (severe) every winter — this is a public health emergency",
        "Do NOT burn crop stubble, garbage, or firecrackers — each contributes to PM2.5 spikes",
        "Use public transport (Delhi Metro, DTC buses) — private vehicles cause 40% of Delhi's air pollution",
        "Carpool and switch to CNG/electric vehicles — Delhi offers EV subsidies up to ₹1.5 lakh",
        "Plant trees, especially along roadsides — Delhi's green cover is ~21% and declining",
        "Check daily AQI at app.cpcbccr.com and avoid outdoor exercise when AQI > 200",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Delhi depends on Yamuna river for 70% of its water — yet Yamuna is one of India's most polluted rivers",
        "Rainwater harvesting is mandatory for plots >100 sq m — comply and install systems",
        "Fix leaky taps and pipes — Delhi loses ~40% of its water supply to leakage and theft",
        "Do NOT dump waste, sewage, or chemicals into drains — they all flow into the Yamuna",
        "Report illegal borewells to the Delhi Jal Board — groundwater is critically depleted",
        "Use water-efficient fixtures — Delhi's per capita water availability is below the national average",
      ],
    },
    {
      title: "Traffic & Transport",
      items: [
        "Delhi has 1.3 crore+ registered vehicles — the highest in any Indian city",
        "Use Delhi Metro (285+ stations) and DTC/cluster buses — every car off the road reduces pollution",
        "Follow odd-even rules when announced — they reduce congestion by 15-20%",
        "Report potholes and broken roads to Delhi PWD",
        "Delhi records 1,500+ road fatalities annually — wear helmets, seatbelts, and follow speed limits",
        "Use cycling tracks where available — Delhi has 150+ km of planned cycle corridors",
      ],
    },
    {
      title: "Environment",
      items: [
        "Delhi's green cover is ~21% — plant native trees (neem, peepal, jamun) in your colony and parks",
        "Protect the Yamuna floodplain — it's a critical biodiversity zone, not a construction site",
        "Delhi Ridge forest is the city's green lung — report encroachment to DDA or Forest Department",
        "Reduce single-use plastics — Delhi has a plastic ban, but enforcement depends on citizen vigilance",
        "Use solar panels — Delhi offers Generation Based Incentive (GBI) for rooftop solar installations",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend Resident Welfare Association (RWA) meetings — they decide your colony's civic priorities",
        "Pay property tax on time via MCD portal — Delhi's tax collection efficiency is only ~65%",
        "File RTI applications to question MCD, DDA, DJB, and Delhi government spending",
        "Verify your name on the electoral roll at voters.eci.gov.in — Delhi's voter turnout is ~60%",
        "Report corruption in a Delhi government office to the Anti-Corruption Branch (Directorate of Vigilance): vigilance.delhi.gov.in",
        "Use the MCD 311 app and Delhi government apps for civic grievances — track resolution online",
      ],
    },
    {
      title: "What New Delhi Can Become in 5 Years",
      isProjection: true,
      items: [
        "AQI under 100 year-round — if stubble burning, vehicle emissions, and waste burning are controlled",
        "Clean Yamuna — if zero untreated sewage is discharged by completing all STP projects",
        "World-class public transit city — if Metro Phase 4 completes and last-mile connectivity improves",
        "30% green cover — if Delhi Ridge and floodplains are protected and 1 crore trees planted",
        "Zero-landfill city — if 100% waste segregation and waste-to-energy plants become operational",
        "Model capital for governance — if citizens actively participate through RWAs and digital platforms",
      ],
    },
  ],
};

// ── Mumbai ──────────────────────────────────────────────────

const MUMBAI_CONTENT: DistrictResponsibilityContent = {
  districtName: "Mumbai",
  intro:
    "Mumbai is India's financial capital and city of dreams — but it battles flooding, housing crises, and coastal erosion. Here's what YOU can do as a citizen.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Mumbai generates ~9,000 tonnes of solid waste per day — making it one of the highest waste generators in India",
        "Segregate waste at source: wet, dry, and hazardous — BMC mandates 3-bin segregation since 2017",
        "Deonar dumping ground catches fire regularly — reducing waste at source is critical",
        "Report illegal dumping to the BMC (MCGM app)",
        "Coastal areas (Versova, Juhu, Dadar) need regular cleanups — join or organise beach clean drives",
        "Bulk waste generators (housing societies, restaurants) must process waste on-site — ensure compliance",
      ],
    },
    {
      title: "Flooding & Drainage",
      items: [
        "Mumbai receives ~2,400mm rainfall — among the heaviest for any major city. Flooding is annual",
        "Do NOT throw garbage in nullahs (storm drains) — blocked drains are the #1 cause of urban flooding",
        "Mithi River is choked with encroachments and sewage — report violations to MMRDA",
        "Clear debris from compound drains before monsoon season (June) — pre-monsoon prep saves lives",
        "Report waterlogging hotspots to the BMC disaster management cell",
        "Support mangrove conservation — mangroves are Mumbai's natural flood defence, destroying them is illegal",
      ],
    },
    {
      title: "Traffic & Transport",
      items: [
        "Mumbai's suburban railways carry 75 lakh+ passengers daily — the busiest urban rail system in the world",
        "Use local trains, BEST buses, and Mumbai Metro — every private vehicle adds to gridlock",
        "Mumbai records 400+ road fatalities annually — follow traffic rules, especially on the Western Express Highway",
        "Report potholes via BMC's MCGM app — pothole-related accidents spike during monsoon",
        "Support the Mumbai Metro expansion — it will reduce road congestion by 30% when complete",
        "Use shared autos and carpooling for last-mile connectivity — reduce single-occupancy trips",
      ],
    },
    {
      title: "Environment & Coast",
      items: [
        "Mumbai has lost 40% of its mangrove cover in 25 years — mangroves prevent flooding and coastal erosion",
        "Sanjay Gandhi National Park is Mumbai's green lung — report encroachment and illegal construction",
        "Do NOT dump waste on beaches — Marine Drive, Juhu, and Versova are global heritage coastlines",
        "Mumbai's air quality deteriorates in winter — use public transport and avoid burning waste",
        "Support coral reef conservation at Malvan Marine Sanctuary — Mumbai's coastal ecosystem is fragile",
        "Reduce plastic use — plastic waste clogs Mumbai's drainage system and worsens flooding",
      ],
    },
    {
      title: "Housing & Infrastructure",
      items: [
        "60%+ of Mumbai lives in informal settlements — support inclusive redevelopment, not displacement",
        "Verify building approvals via BMC's Development Plan portal before purchasing property",
        "Report illegal constructions and encroachments to BMC ward offices",
        "Pay property tax on time — Mumbai's property tax collection funds roads, hospitals, and schools",
        "Support rainwater harvesting in your housing society — mandatory for buildings on plots >1,000 sq m",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend BMC ward committee meetings — Mumbai has 227 wards, each with monthly open meetings",
        "File RTI applications to question BMC, MMRDA, and MCGM spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in — Mumbai's voter turnout is often below 50%",
        "Report corruption to Maharashtra Anti-Corruption Bureau: 1064",
        "Join or form your housing society's management committee — collective action drives civic change",
        "Use the BMC MCGM app for civic grievances — demand accountability",
      ],
    },
    {
      title: "What Mumbai Can Become in 5 Years",
      isProjection: true,
      items: [
        "Flood-resilient city — if all nullahs are cleaned, mangroves protected, and Mithi River restored",
        "India's best public transit — if Metro, coastal road, and trans-harbour link complete on schedule",
        "Zero-waste city — if 100% waste segregation is achieved across all 227 wards",
        "Restored coastline — if beach cleanups scale up and plastic dumping is eliminated",
        "60%+ voter turnout — if citizens treat municipal elections as seriously as national ones",
        "Affordable housing for all — if slum rehabilitation projects complete with transparency",
      ],
    },
  ],
};

// ── Kolkata ─────────────────────────────────────────────────

const KOLKATA_CONTENT: DistrictResponsibilityContent = {
  districtName: "Kolkata",
  intro:
    "Kolkata is India's cultural capital — a city of literature, art, and resilience. But it faces waterlogging, pollution, and ageing infrastructure. Here's what YOU can do.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Kolkata generates ~4,500 tonnes of solid waste per day — only ~60% reaches processing facilities",
        "Segregate waste at source: wet waste, dry waste, and hazardous waste — KMC mandates segregation",
        "Dhapa dumping ground is overflowing — reduce, reuse, and compost to cut landfill burden",
        "Report illegal dumping through KMC's online complaint portal",
        "Keep Hooghly riverbanks and ghats clean — they are Kolkata's identity and lifeline",
        "During Durga Puja, use eco-friendly idols and dispose immersion materials responsibly",
      ],
    },
    {
      title: "Waterlogging & Drainage",
      items: [
        "Kolkata receives ~1,600mm annual rainfall — large parts of the city flood during monsoon",
        "East Kolkata Wetlands are a UNESCO-recognised natural sewage treatment system — protect them from encroachment",
        "Do NOT throw garbage in canals and drains — blocked drainage is the primary cause of waterlogging",
        "Report blocked drains and waterlogging to the KMC Drainage Department",
        "Support the restoration of Tolly's Nullah and Circular Canal — they are critical to flood management",
        "Clear compound drains before monsoon — pre-monsoon preparedness reduces flooding by 30%",
      ],
    },
    {
      title: "Water & River Conservation",
      items: [
        "Hooghly (Ganga) river is Kolkata's primary water source — do NOT dump waste, sewage, or industrial effluents",
        "Kolkata's groundwater is arsenic-contaminated in parts — use only tested/treated water for drinking",
        "Fix leaking taps — a dripping tap wastes 15,000 litres/year, and Kolkata faces seasonal water shortages",
        "Support KMC's initiative to rejuvenate 40+ urban water bodies across the city",
        "Rainwater harvesting is essential — install rooftop systems, especially in South Kolkata's residential areas",
      ],
    },
    {
      title: "Heritage & Culture",
      items: [
        "Kolkata has 5,000+ heritage buildings — Victoria Memorial, Howrah Bridge, Indian Museum are national treasures",
        "Do NOT deface, litter near, or encroach upon heritage structures — report violations to KMC Heritage Cell",
        "Support local artisans — Kolkata's handloom, terracotta, and dokra craft traditions are centuries old",
        "During Durga Puja (UNESCO Intangible Heritage), follow waste management and traffic rules at pandals",
        "Preserve Kolkata's tramway system — the last surviving tram network in India, a heritage asset",
        "Support neighbourhood libraries, book fairs, and cultural institutions — they define Kolkata's identity",
      ],
    },
    {
      title: "Traffic & Transport",
      items: [
        "Use Kolkata Metro (India's first metro system), buses, trams, and ferries — reduce private vehicle use",
        "Kolkata records 500+ road accidents annually — follow lane discipline on EM Bypass and VIP Road",
        "Report potholes to KMC Roads Department or use the KMC online grievance portal",
        "Support East-West Metro completion — it will connect Howrah to Salt Lake, reducing congestion",
        "Use cycle rickshaws and walking for short trips — Kolkata is one of India's most walkable cities",
        "Follow traffic diversions during Durga Puja, Kali Puja, and other festivals — plan routes in advance",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend KMC ward meetings — Kolkata has 144 wards, each with elected councillors accountable to you",
        "Pay property tax on time via KMC e-portal — unpaid taxes reduce funds for roads and drainage",
        "File RTI applications to question KMC, KMDA, and state government spending",
        "Verify your name on the electoral roll at voters.eci.gov.in — exercise your democratic right",
        "Report corruption to West Bengal Lokayukta or Anti-Corruption Branch",
        "Join or support neighbourhood committees (para committees) — Kolkata's para culture is its civic strength",
      ],
    },
    {
      title: "What Kolkata Can Become in 5 Years",
      isProjection: true,
      items: [
        "Flood-free monsoons — if East Kolkata Wetlands are protected and drainage infrastructure upgraded",
        "India's best-preserved heritage city — if 5,000+ heritage buildings are restored and maintained",
        "Seamless metro connectivity — if East-West and North-South metro corridors integrate fully",
        "Zero-waste city — if 100% waste segregation is achieved and Dhapa landfill is phased out",
        "Green Kolkata — if urban tree cover increases to 25% and wetlands are conserved",
        "Global cultural capital — if Durga Puja tourism is extended to year-round cultural festivals",
      ],
    },
  ],
};

// ── Chennai ─────────────────────────────────────────────────

const CHENNAI_CONTENT: DistrictResponsibilityContent = {
  districtName: "Chennai",
  intro:
    "Chennai is India's gateway to the south — an industrial powerhouse and cultural hub. But it faces cyclones, water crises, and rapid urbanisation. Here's what YOU can do.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Chennai generates ~5,400 tonnes of solid waste per day — segregation compliance remains below 50%",
        "Segregate waste at source: biodegradable (green), non-biodegradable (blue), hazardous (red)",
        "Perungudi and Kodungaiyur dumpsites are at critical capacity — reduce waste generation at home",
        "Report illegal dumping to the Greater Chennai Corporation (GCC)",
        "Compost kitchen waste — GCC provides composting bins for residential complexes",
        "Keep Marina Beach and Elliot's Beach litter-free — they are Chennai's pride and tourist landmarks",
      ],
    },
    {
      title: "Flood Resilience & Drainage",
      items: [
        "Chennai floods devastated the city in 2015 (500+ deaths, ₹20,000 crore damage) — preparedness saves lives",
        "Do NOT dump garbage in Adyar, Cooum, or Buckingham Canal — blocked waterways cause catastrophic flooding",
        "Chennai receives ~1,400mm annual rainfall — much of it in just 2 months (Oct-Nov northeast monsoon)",
        "Report encroachments on river floodplains and water bodies to CMDA or GCC",
        "Clear storm drains in your locality before October — pre-monsoon prep is every citizen's duty",
        "Support restoration of Pallikaranai marshland — Chennai's largest surviving wetland and natural flood buffer",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Chennai faced Day Zero in 2019 — all 4 major reservoirs (Poondi, Cholavaram, Red Hills, Chembarambakkam) went dry",
        "Rainwater harvesting is MANDATORY for every building in Chennai — non-compliance is finable (TN law since 2003)",
        "Fix leaky pipes — Chennai Metro Water loses ~35% of supply to pipeline leakage",
        "Protect the 5,000+ water bodies (eris/tanks) in Chennai district — they recharge groundwater",
        "Report illegal borewells and groundwater extraction to Chennai Metro Water",
        "Use water-efficient fixtures — every litre saved reduces dependence on water tankers during summer",
      ],
    },
    {
      title: "Traffic & Transport",
      items: [
        "Chennai has 60 lakh+ registered vehicles — use Chennai Metro, MRTS, and MTC buses to reduce congestion",
        "Chennai records 1,200+ road fatalities annually — wear helmets, follow signals, avoid drunk driving",
        "Report potholes and damaged roads to GCC via the Namma Chennai app",
        "Support Chennai Metro Phase 2 expansion — it will cover 119 km and transform commuting",
        "Use suburban rail (MRTS) for north-south travel — it's underutilised and faster than road during peak hours",
        "Follow traffic diversions during festivals (Pongal, Margazhi season) and monsoon flooding",
      ],
    },
    {
      title: "Environment & Coast",
      items: [
        "Chennai's coastline stretches 19 km — protect it from erosion, dumping, and illegal construction",
        "Plant native trees (neem, banyan, pongamia) — Chennai's green cover is under 15% and declining",
        "Adyar and Cooum rivers are severely polluted — never dump waste or sewage into rivers or estuaries",
        "Support Guindy National Park — one of the smallest national parks in India, right inside the city",
        "Reduce plastic use — plastic clogs Chennai's already strained drainage system",
        "Chennai's air quality worsens in winter — use public transport and support EV adoption",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend GCC ward meetings — Chennai has 200 wards, each with elected councillors",
        "Pay property tax on time via GCC portal — Chennai's tax collection funds drainage and road projects",
        "File RTI applications to question GCC, CMDA, and Chennai Metro Water spending",
        "Verify your name on the electoral roll at voters.eci.gov.in — participate in local body elections",
        "Report corruption to the Tamil Nadu Directorate of Vigilance and Anti-Corruption",
        "Use Namma Chennai app for all civic complaints — track resolution and demand accountability",
      ],
    },
    {
      title: "What Chennai Can Become in 5 Years",
      isProjection: true,
      items: [
        "Flood-resilient city — if all waterways are desilted, wetlands protected, and drainage modernised",
        "Water-secure city — if rainwater harvesting reaches 100% compliance and reservoirs are maintained",
        "India's best-connected metro — if Phase 2 completes and integrates with MRTS and suburban rail",
        "Zero-landfill Chennai — if waste segregation hits 90% and waste-to-energy plants scale up",
        "25% green cover — if 50 lakh trees are planted and Adyar/Cooum riverfronts are restored",
        "Model civic governance — if digital grievance systems achieve 95% resolution rate",
      ],
    },
  ],
};

// ── Lucknow ─────────────────────────────────────────────────

const LUCKNOW_CONTENT: DistrictResponsibilityContent = {
  districtName: "Lucknow",
  intro:
    "Lucknow is the city of Nawabs — rich in culture, cuisine, and tehzeeb. But it faces growing pollution, traffic congestion, and urban sprawl. Here's what YOU can do.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Lucknow generates ~2,500 tonnes of solid waste per day — segregation compliance is below 40%",
        "Segregate waste at source: wet (green), dry (blue), hazardous (red) — LMC mandates this",
        "Report illegal dumping to the Lucknow Municipal Corporation (LMC) or on the Swachhata app",
        "Keep heritage zones (Bara Imambara, Chhota Imambara, Residency) litter-free",
        "Compost kitchen waste at home — LMC provides composting support for housing societies",
        "Lucknow improved from rank 400+ to top 50 in Swachh Survekshan — keep the momentum going",
      ],
    },
    {
      title: "Air Quality & Pollution",
      items: [
        "Lucknow's winter AQI regularly crosses 300+ (very poor) — stubble burning from western UP worsens it",
        "Do NOT burn garbage, crop residue, or firecrackers — each directly spikes PM2.5 levels",
        "Use Lucknow Metro and UPSRTC buses — reduce private vehicle emissions",
        "Construction dust is a major polluter — ensure construction sites in your area use dust barriers",
        "Plant trees along Gomti riverbanks and in housing colonies — green cover absorbs pollutants",
        "Check daily AQI at app.cpcbccr.com — avoid outdoor exercise when AQI exceeds 200",
      ],
    },
    {
      title: "Water & River Conservation",
      items: [
        "Gomti river is Lucknow's lifeline — it is severely polluted with untreated sewage and industrial waste",
        "Do NOT dump waste, sewage, or idol immersion materials directly into the Gomti",
        "Fix leaky taps and pipes — Lucknow's water supply network loses ~35% to leakage",
        "Rainwater harvesting is essential — Lucknow receives ~1,000mm annual rainfall",
        "Support Gomti riverfront restoration — clean rivers improve health, tourism, and groundwater",
        "Report illegal industrial discharge into water bodies to the UP Pollution Control Board",
      ],
    },
    {
      title: "Heritage & Culture",
      items: [
        "Lucknow's Nawabi heritage (Bara Imambara, Rumi Darwaza, British Residency) is nationally significant — protect it",
        "Do NOT deface or litter near heritage monuments — report violations to ASI or LMC Heritage Cell",
        "Support Lucknow's chikan embroidery artisans — this GI-tagged craft employs 2.5 lakh+ workers",
        "Preserve Lucknow's food heritage — tunday kebab, biryani, and kulfi traditions attract cultural tourism",
        "Attend literary and cultural events (Lucknow Literature Festival, Mahotsav) — they drive the creative economy",
      ],
    },
    {
      title: "Traffic & Road Safety",
      items: [
        "Lucknow has 30 lakh+ registered vehicles — use Lucknow Metro and public buses to reduce congestion",
        "Hazratganj, Aminabad, and Charbagh are chronic congestion zones — use metro and park-and-ride",
        "Report potholes and broken roads to LMC via the Nagar Nigam app",
        "Lucknow records 800+ road accidents annually — wear helmets, follow signals, avoid wrong-side driving",
        "Support Lucknow Metro expansion — it will connect more parts of the city and reduce road load",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend LMC ward meetings — Lucknow has 110 wards, each with elected corporators",
        "Pay property tax and house tax on time via LMC portal — it funds roads, drains, and streetlights",
        "File RTI applications to question LMC, LDA, and UP government spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in — vote in every election",
        "Report corruption to the UP Lokayukta or the Anti-Corruption Organisation",
        "Join Mohalla committees and Resident Welfare Associations — community action drives civic improvement",
      ],
    },
    {
      title: "What Lucknow Can Become in 5 Years",
      isProjection: true,
      items: [
        "AQI under 150 year-round — if stubble burning stops, EVs scale, and green cover increases",
        "Clean Gomti river — if zero untreated sewage is discharged and riverbanks are restored",
        "UNESCO Heritage City status — if Nawabi-era monuments are conserved and tourism infrastructure improves",
        "Top 10 in Swachh Survekshan — if waste segregation reaches 80% and open dumping is eliminated",
        "Full metro connectivity — if Lucknow Metro Phase 2 completes and integrates with bus rapid transit",
        "Model UP city for governance — if digital civic platforms achieve 90%+ grievance resolution",
      ],
    },
  ],
};

// ── Generic Fallback ────────────────────────────────────────

const GENERIC_CONTENT: DistrictResponsibilityContent = {
  districtName: "Your District",
  intro:
    "Every district in India faces unique challenges. Here are universal citizen responsibilities that apply everywhere — small actions by many people create big change.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Segregate waste at source: wet waste (green bin) + dry waste (blue bin) + reject (red bin)",
        "Never burn waste — it releases toxic fumes and violates Solid Waste Management Rules 2016",
        "Participate in Swachh Bharat cleanliness drives in your ward or village",
        "Report illegal dumping to your local municipal body or on the Swachhata app",
        "Compost kitchen waste at home — reduces landfill burden by up to 60%",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Fix leaky taps and pipes — a single dripping tap wastes 15,000 litres/year",
        "Harvest rainwater at home — install rooftop collection systems",
        "Protect local lakes, tanks, and rivers from encroachment and pollution",
        "Use water-efficient fixtures and practices — bucket baths save 100+ litres vs showers",
        "Report illegal sand mining and water pollution to your District Collector office",
      ],
    },
    {
      title: "Agriculture & Land",
      items: [
        "Do NOT burn crop stubble — it destroys soil organisms and causes air pollution",
        "Get your soil tested free at the nearest Krishi Vigyan Kendra (KVK) every 3 years",
        "Join Farmers Producer Organizations (FPOs) for better price negotiation and market access",
        "Register for PM-KISAN to receive ₹6,000/year direct benefit",
        "Adopt water-efficient irrigation methods — drip and sprinkler systems save 40-60% water",
      ],
    },
    {
      title: "Environment",
      items: [
        "Plant native trees in your land, village, or neighbourhood — every tree counts",
        "Protect local water bodies — they recharge groundwater and support biodiversity",
        "Reduce single-use plastics — carry reusable bags, bottles, and containers",
        "Report illegal deforestation and encroachment to the Forest Department",
        "Use LED bulbs and solar panels — state electricity boards offer subsidies for solar installations",
      ],
    },
    {
      title: "Road Safety",
      items: [
        "Always wear helmets on two-wheelers and seatbelts in cars — it's the law and it saves lives",
        "Don't drink and drive — report drunk driving on 112",
        "Report potholes and broken roads to your local PWD or municipal body",
        "Follow speed limits, especially in school zones and residential areas",
        "Use pedestrian crossings and footpaths — set the example for road discipline",
      ],
    },
    {
      title: "Civic Duty",
      items: [
        "Attend Gram Sabha meetings — held twice a year in your village, open to all adults",
        "Pay property tax on time — unpaid taxes reduce funds for local infrastructure",
        "File RTI applications to question government spending in your area",
        "Verify your name on the electoral roll at voters.eci.gov.in — vote in every election",
        "Report corruption to your state Lokayukta or Anti-Corruption Bureau",
        "Participate in local planning committee meetings — your voice matters",
      ],
    },
    {
      title: "What Your District Can Become in 5 Years",
      isProjection: true,
      items: [
        "Cleaner streets and zero open dumping — if 100% waste segregation is achieved",
        "Water security for all — if rainwater harvesting and lake protection become the norm",
        "Higher literacy and school enrollment — if communities support education at every level",
        "Safer roads with zero fatalities — if traffic rules are followed by every citizen",
        "A model district for governance — if citizens actively participate in democratic processes",
        "Greener, cooler neighbourhoods — if every household plants and protects at least one tree",
      ],
    },
  ],
};

// ── Hyderabad ──────────────────────────────────────────────────

const HYDERABAD_CONTENT: DistrictResponsibilityContent = {
  districtName: "Hyderabad",
  intro:
    "Hyderabad is one of India's fastest-growing cities. Here's what YOU can do as a citizen to keep the City of Pearls thriving.",
  sections: [
    {
      title: "Cleanliness & Waste",
      items: [
        "Hyderabad generates ~5,500 tonnes of solid waste per day — GHMC manages collection across 150 wards",
        "Segregate waste at source: wet waste (green bin) + dry waste (blue bin)",
        "Use the GHMC Swachh app to report garbage dumping or missed collection",
        "Never dump waste into Musi River or Hussain Sagar lake — they are being revived",
        "Participate in Swachh Hyderabad drives conducted by GHMC every Saturday",
      ],
    },
    {
      title: "Water Conservation",
      items: [
        "Hyderabad's water supply depends on Osmansagar, Himayatsagar, and Krishna/Godavari sources — all are stressed during summer",
        "Report water leaks and illegal connections to HMWSSB",
        "Install rainwater harvesting — GHMC makes it mandatory for plots above 200 sq yards",
        "Fix leaky taps: a dripping tap wastes 15,000 litres per year",
        "Hyderabad receives ~800mm rainfall annually — harvest it for non-drinking use",
      ],
    },
    {
      title: "Urban Environment",
      items: [
        "Hyderabad's green cover has shrunk due to rapid construction — plant native trees (Neem, Peepal, Gulmohar)",
        "Use public transport: TSRTC buses, Hyderabad Metro, or MMTS for daily commute to reduce pollution",
        "Air quality deteriorates in winter — avoid burning waste and report violations to the pollution control board",
        "Protect Hyderabad's 200+ lakes from encroachment — report illegal construction near water bodies to HMDA",
        "Use the GHMC T-App Folio for property-related civic services",
      ],
    },
    {
      title: "Democratic Participation",
      items: [
        "Check your voter enrollment: voterportal.eci.gov.in — ensure your address is updated",
        "Attend ward committee meetings held quarterly by GHMC — your voice shapes local decisions",
        "File RTI requests to track municipal spending: fee is ₹10 at the Telangana SIC portal",
        "Know your GHMC corporator and MLA — they are accountable for your ward's development",
        "Report corruption via the Anti-Corruption Bureau helpline: 1064",
      ],
    },
    {
      title: "Traffic & Safety",
      items: [
        "Hyderabad has a Commissionerate police system — dial 112 for emergencies",
        "Follow traffic rules: Hyderabad Traffic Police actively uses e-challans — check at echallan.tspolice.gov.in",
        "Use designated pedestrian crossings, especially on major roads like Tank Bund, Necklace Road, and Jubilee Hills",
        "Report road damage and potholes to GHMC",
        "For women's safety, Hyderabad police SHE Teams respond on 112; the national Women Helpline is 181",
      ],
    },
    {
      title: "What Hyderabad Can Become in 5 Years",
      isProjection: true,
      items: [
        "A global top-20 liveable city — if citizens participate in urban governance and hold GHMC accountable",
        "Zero water tanker dependency — if HMWSSB infrastructure is maintained and rainwater harvesting becomes universal",
        "30% green cover — if every household plants and protects at least one tree",
        "Full metro connectivity — if citizens use public transit and reduce private vehicle dependency",
        "Safer roads with zero fatalities — if traffic rules are followed by every citizen",
        "A model city for governance — if citizens actively participate in ward committees and democratic processes",
      ],
    },
  ],
};

// ── Lookup ──────────────────────────────────────────────────

const RESPONSIBILITY_CONTENT: Record<string, DistrictResponsibilityContent> = {
  mandya: MANDYA_CONTENT,
  "bengaluru-urban": BENGALURU_URBAN_CONTENT,
  mysuru: MYSURU_CONTENT,
  "new-delhi": NEW_DELHI_CONTENT,
  mumbai: MUMBAI_CONTENT,
  kolkata: KOLKATA_CONTENT,
  chennai: CHENNAI_CONTENT,
  lucknow: LUCKNOW_CONTENT,
  hyderabad: HYDERABAD_CONTENT,
};

export function getResponsibilityContent(
  districtSlug: string,
): DistrictResponsibilityContent {
  return RESPONSIBILITY_CONTENT[districtSlug] ?? GENERIC_CONTENT;
}
