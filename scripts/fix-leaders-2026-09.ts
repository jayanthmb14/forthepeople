/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Fix the Leader rows the September 2026 check found wrong or out of date,
 * for the ten live districts. Every change below was checked against at
 * least two sources (listed per change, full URLs in SOURCES and in
 * docs/LEADERS-VERIFIED-2026-09.md). Anything not confirmed twice is NOT
 * here; it is listed for the owner in that doc.
 *
 * DRY RUN by default: prints the planned changes and exits.
 *
 *   npx tsx scripts/fix-leaders-2026-09.ts                    # dry run, all districts
 *   npx tsx scripts/fix-leaders-2026-09.ts --only=mandya,pune # dry run, some districts
 *   npx tsx scripts/fix-leaders-2026-09.ts --confirm          # apply (one transaction)
 *
 * What it does:
 *   - deactivate : active=false on wrong / outdated / placeholder rows.
 *                  Never deletes. Rows keep their history.
 *   - update     : same person, corrected fields (party, role, constituency,
 *                  since, tier). Verified rows also get source + lastVerifiedAt.
 *                  A changed role clears roleLocal (the stored Hindi/Kannada
 *                  role would no longer match) and resets roleDescription.
 *   - add        : a verified office-holder who is missing. If a curated row
 *                  (source not a news URL) for the same person already exists
 *                  in the district, it is reactivated and corrected instead.
 *   Person changed in an office → old row deactivated + new row added (old rows
 *   carry person-specific fields: photo, local-script name, phone).
 *
 * Idempotent: lastVerifiedAt is a fixed date, rows are matched by id or by
 * name + constituency/tier, and a second run reports "no change" everywhere.
 * Each write also writes an UpdateLog row (moduleName "leadership").
 */

import { getRoleDescription } from "../src/lib/constants/role-descriptions";

// ── Sources (every URL was read during the 27 Sep 2026 check) ─────────────
export const SOURCES = {
  // National
  W_MURMU: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Presidency_of_Droupadi_Murmu" },
  N24_BDAY: { outlet: "News24", url: "https://news24online.com/india/president-droupadi-murmu-greets-pm-modi-on-birthday-says-he-established-many-new-benchmarks-of-good-governance/926646" },
  W_GOVS: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/List_of_current_Indian_governors" },
  QUINT_GOVS: { outlet: "The Quint", url: "https://www.thequint.com/news/breaking-news/president-appoints-new-governors-major-reshuffle-india" },
  W_CMS: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/List_of_current_Indian_chief_ministers" },
  W_18LS: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/List_of_members_of_the_18th_Lok_Sabha" },

  // Karnataka
  W_KA_COM: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Karnataka_Council_of_Ministers" },
  BS_DKS: { outlet: "Business Standard", url: "https://www.business-standard.com/india-news/d-k-shivakumar-oath-as-karnataka-chief-minister-126060300894_1.html" },
  INC_DKS: { outlet: "INC", url: "https://inc.in/congress-sandesh/others/d-k-shivakumar-sworn-in-as-25th-chief-minister-of-karnataka" },
  W_KA16: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/16th_Karnataka_Assembly" },
  IV_KA23: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/vidhan-sabha/karnataka/2023/" },
  W_TNARASIPUR: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/T._Narasipur_Assembly_constituency" },
  W_KANAKAPURA: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kanakapura_Assembly_constituency" },
  BS_EXPEL: { outlet: "Business Standard", url: "https://www.business-standard.com/india-news/bjp-expels-two-karnataka-mlas-for-6-years-over-anti-party-activities-125052700970_1.html" },
  IV_LS_MANDYA: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/mandya/" },
  IV_LS_MYSORE: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/mysore/" },
  IV_LS_CHAMARAJANAGAR: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/chamarajanagar/" },
  IV_LS_BLR_N: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-north/" },
  IV_LS_BLR_C: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-central/" },
  IV_LS_BLR_S: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-south/" },
  IV_LS_BLR_R: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/bangalore-rural/" },
  IV_LS_CHIKKABALLAPUR: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/karnataka/chikkballapur/" },
  PIB_HDK: { outlet: "PIB", url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2206267&reg=3&lang=2" },
  NIMSME_SHOBHA: { outlet: "ni-msme", url: "https://www.nimsme.gov.in/news-article/ms-shobha-karandlaje-hon-ble-union-minister-of-state-for-msme-and-labour-employment-govt-of-india-inaugurated-the-vendor-development-programme-on-14-july-2026-at-ni-msme-hyderabad" },
  MANDYA_NIC_DC: { outlet: "mandya.nic.in", url: "https://mandya.nic.in/en/whoswho/deputy-commissioner/" },
  SOM_MELUKOTE: { outlet: "Star of Mysore", url: "https://starofmysore.com/security-arrangements-in-place-for-vice-presidents-visit-to-melukote/" },
  SOM_IPS_JAN26: { outlet: "Star of Mysore", url: "https://starofmysore.com/major-changes-in-ips-ias-postings/" },
  HANS_SHOBHARANI: { outlet: "The Hans India", url: "https://www.thehansindia.com/karnataka/ugadi-flex-row-in-mandya-sp-shobharani-urges-public-not-to-use-her-photos-1058710" },
  MYSORE_NIC_DC: { outlet: "mysore.nic.in", url: "https://mysore.nic.in/en/whoswho/lakshmikanth-reddy/" },
  SOM_DASARA26: { outlet: "Star of Mysore", url: "https://starofmysore.com/dasara-gold-cards-to-carry-seat-nos-dc/" },
  MYSORE_NIC_SP: { outlet: "mysore.nic.in", url: "https://mysore.nic.in/en/whoswho/shri-mallikarjun-baldandi-ips/" },
  UDAYAVANI_SP: { outlet: "Udayavani", url: "https://udayavani.com/karnataka/no-restrictions-traditional-routes-ganesh-processions-mysuru-sp-mallikarjun-baladandi-388617?lang=en" },
  MYSORE_NIC_CP: { outlet: "mysore.nic.in", url: "https://mysore.nic.in/en/whoswho/sri-r-chethan-i-p-s/" },
  SOM_LATKAR26: { outlet: "Star of Mysore", url: "https://starofmysore.com/first-police-officers-annual-conference-2026-sessions-deliberate-various-laws-procedures/" },
  SOM_MCC_COUNCIL: { outlet: "Star of Mysore", url: "https://starofmysore.com/council-tenure-over-silence-rules-mcc-corridor/" },
  W_MCC: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mysore_City_Corporation" },
  DH_ZP: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/india/karnataka/centre-withholds-rs-1279-crore-from-karnataka-for-not-holding-zilla-taluk-panchayat-polls-3833080" },
  HANS_ZP: { outlet: "The Hans India", url: "https://www.thehansindia.com/karnataka/panchayat-elections-unlikely-anytime-soon-as-govt-seeks-more-time-from-hc-1084016" },
  DH_BU_DC: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/india/karnataka/bengaluru/bengaluru-deputy-commissioner-jagadeesha-g-shifted-as-central-city-corporation-commissioner-4029209" },
  IANS_BU_DC: { outlet: "IANS", url: "https://x.com/ians_india/status/2062913053143048450" },
  BS_SEEMANT: { outlet: "Business Standard", url: "https://www.business-standard.com/india-news/seemant-kumar-singh-takes-charge-as-new-bengaluru-police-commissioner-125060600247_1.html" },
  DH_SEEMANT26: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/india/karnataka/bengaluru/strict-action-against-violators-during-new-year-2026-celebrations-bengaluru-commissioner-3845895" },

  // Maharashtra
  W_FADNAVIS3: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Third_Fadnavis_ministry" },
  AIR_SUNETRA: { outlet: "AIR News", url: "https://www.newsonair.gov.in/sunetra-pawar-elected-as-ncp-legislature-party-leader-after-ajit-pawars-demise" },
  GULF_SUNETRA: { outlet: "Gulf News", url: "https://gulfnews.com/world/asia/india/sunetra-pawar-to-take-oath-as-maharashtra-deputy-cm-today-1.500426831" },
  ZEE_BARAMATI: { outlet: "Zee News", url: "https://zeenews.india.com/india/live-updates/baramati-results-bypoll-2026-sunetra-pawar-ncp-ajit-pawar-maharashtra-winner-3042999.html" },
  INDIACOM_BARAMATI: { outlet: "India.com", url: "https://www.india.com/news/india/baramati-assembly-bypolls-results-2026-live-updates-constituency-seats-vote-counting-shiv-sena-congress-bjp-winners-sunetra-pawar-wife-of-ajit-pawar-maharashtra-bypoll-election-news-8401320/" },
  PMRDA_SHINDE: { outlet: "PMRDA", url: "https://www.pmrda.gov.in/en/hon-deputy-chief-minister-minister-udd-shri-eknath-sambhaji-shinde-2/" },
  FPJ_TRIPATHI: { outlet: "Free Press Journal", url: "https://www.freepressjournal.in/mumbai/justice-mahesh-chandra-tripathi-sworn-in-as-chief-justice-of-bombay-high-court-know-all-about-him-mumbai-news" },
  LIVELAW_TRIPATHI: { outlet: "LiveLaw", url: "https://www.livelaw.in/high-court/bombay-high-court/justice-mahesh-chandra-tripathi-sworn-chief-justice-bombay-high-court-549317" },
  IV_MH24: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/vidhan-sabha/maharashtra/2024/" },
  W_MH15: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/15th_Maharashtra_Legislative_Assembly" },
  ETV_BANDRAE: { outlet: "ETV Bharat", url: "https://www.etvbharat.com/en/!bharat/maharashtra-assembly-polls-2024-zeeshan-siddique-and-varun-sardesai-in-bandra-east-seat-enn24112204417" },
  W_VANDREW: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Vandre_West_Assembly_constituency" },
  ZEE_VANDREW: { outlet: "Zee News", url: "https://zeenews.india.com/india/vandre-west-vidhan-sabha-chunav-result-2024-live-winner-and-loser-candidate-ashish-shelar-vs-asif-zakaria-total-votes-margin-bjp-congress-shiv-sena-ubt-ncp-sharad-pawar-eci-maharashtra-assembly-2823465.html" },
  LOKTEJ_FADNAVIS: { outlet: "Loktej", url: "https://english.loktej.com/article/32898/maharashtra-chief-minister-devendra-fadnavis-to-inaugurate-boiler-india-2026" },
  MUMCITY_COLL: { outlet: "mumbaicity.gov.in", url: "https://mumbaicity.gov.in/en/whoswho/collector-and-district-magistrate/" },
  PRINT_GOYAL: { outlet: "ThePrint", url: "https://theprint.in/india/anchal-goyal-new-collector-for-mumbai-city-district/2553712/" },
  MUMSUB_COLL: { outlet: "mumbaisuburban.gov.in", url: "https://mumbaisuburban.gov.in/en/whoswho/district-collector-and-magistrate/" },
  APAC_KATIYAR: { outlet: "APAC News", url: "https://apacnewsnetwork.com/2026/05/modern-setu-transforming-citizen-services-through-smart-governance-in-mumbai-suburban/" },
  W_MUMCP: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Commissioner_of_the_Greater_Mumbai_Police" },
  ELETS_BHARTI: { outlet: "Elets eGov", url: "https://egov.eletsonline.com/2025/04/deven-bharti-appointed-mumbai-police-commissioner/" },
  W_BHIDE: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ashwini_Bhide" },
  ELETS_BHIDE: { outlet: "Elets eGov", url: "https://egov.eletsonline.com/2026/03/ias-ashwini-bhide-becomes-first-woman-municipal-commissioner-of-bmc/" },
  W_TAWDE: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Ritu_Tawde" },
  BS_TAWDE: { outlet: "Business Standard", url: "https://www.business-standard.com/india-news/who-is-ritu-tawde-mumbai-mayor-elections-bjp-shiv-sena-bmc-sanjay-ghadi-126021101013_1.html" },
  IV_LS_MUM_N: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north/" },
  IV_LS_MUM_NW: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-west/" },
  IV_LS_MUM_NE: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-east/" },
  IV_LS_MUM_NC: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-north-central/" },
  IV_LS_MUM_SC: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-south-central/" },
  IV_LS_MUM_S: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/mumbai-south/" },
  W_MUM_NW: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mumbai_North_West_Lok_Sabha_constituency" },
  W_MUM_NC: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mumbai_North_Central_Lok_Sabha_constituency" },
  W_MUM_NE: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mumbai_North_East_Lok_Sabha_constituency" },
  W_MUM_SC: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mumbai_South_Central_Lok_Sabha_constituency" },
  W_MH_LS24: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/2024_Indian_general_election_in_Maharashtra" },
  IV_LS_PUNE: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/pune/" },
  IV_LS_BARAMATI: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/baramati/" },
  IV_LS_SHIRUR: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/shirur/" },
  IV_LS_MAVAL: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/maharashtra/maval/" },
  PUNE_GOV_COLL: { outlet: "pune.gov.in", url: "https://pune.gov.in/en/whoswho/shri-saurabh-rao/" },
  FPJ_DUDI: { outlet: "Free Press Journal", url: "https://www.freepressjournal.in/pune/pune-district-collector-jitendra-dudi-reviews-hinjawadi-infrastructure-issues-20-30-more-pmpml-buses-planned" },
  W_PUNECP: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Commissioner_of_Pune_City_Police" },
  PUNEKAR_CP: { outlet: "Punekar News", url: "https://www.punekarnews.in/pune-ganesh-visarjan-2026-over-10000-cops-deployed-safety-prioritised-over-procession-speed-says-cp-amitesh-kumar/" },
  FPJ_MAYORS: { outlet: "Free Press Journal", url: "https://www.freepressjournal.in/pune/interesting-pune-mayor-manjusha-nagpure-pimpri-chinchwad-mayor-ravi-landge-were-both-elected-unopposed-in-civic-polls" },
  BRIDGE_LANDGE: { outlet: "The Bridge Chronicle", url: "https://www.thebridgechronicle.com/pune/ravi-landge-pimpri-chinchwad-mayor-deputy-mayor-race-agn97" },
  APAC_SURYAWANSHI: { outlet: "APAC News", url: "https://apacnewsnetwork.com/2026/03/ias-dr-vijay-suryawanshi-appointed-new-commissioner-of-pimpri-chinchwad-municipal-corporation/" },
  FPJ_SURYAWANSHI: { outlet: "Free Press Journal", url: "https://www.freepressjournal.in/pune/sewage-water-revenue-new-pcmc-commissioner-vijay-suryawanshi-lays-out-massive-city-overhaul-plan-in-pimpri-chinchwad" },

  // Uttar Pradesh
  W_UPCOM: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Uttar_Pradesh_Council_of_Ministers" },
  DNA_UPDYCM: { outlet: "DNA India", url: "https://www.dnaindia.com/india/report-yogi-adityanath-20-swearing-in-keshav-prasad-maurya-and-brajesh-pathak-to-be-deputy-cms-of-uttar-pradesh-2942030" },
  UPGOV: { outlet: "upgovernor.gov.in", url: "https://upgovernor.gov.in/en" },
  W_UP18: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/18th_Uttar_Pradesh_Assembly" },
  IV_UP22: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/vidhan-sabha/uttar-pradesh/2022/" },
  LKO_NIC_DM: { outlet: "lucknow.nic.in", url: "https://lucknow.nic.in/dm-profile/vishak-g/" },
  LKOWANTS_DM: { outlet: "Lucknow Wants", url: "https://www.lucknowwants.com/trending-now/who-is-the-new-dm-of-lucknow-all-info-about-vishak-g-iyer" },
  W_LKOPOLICE: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Lucknow_Police" },
  IB_GAUBA: { outlet: "Indian Bureaucracy", url: "https://www.indianbureaucracy.com/tarun-gauba-ips-appointed-cp-lucknow-up/" },
  IV_LS_UP: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/uttar-pradesh/2024/" },
  QUINT_MLG: { outlet: "The Quint", url: "https://www.thequint.com/news/mohanlalganj-election-result-2024-live-updates-counting-of-votes-uttar-pradesh-lok-sabha-seat-latest-news" },
  ETV_RAJNATH: { outlet: "ETV Bharat", url: "https://www.etvbharat.com/en/!state/lok-sabha-election-2024-result-uttar-pradesh-lucknow-seat-winner-rajnath-singh-bjp-ravi-das-mehrotra-samajwadi-party-sarvar-malik-bsp-latest-update-enn24060305783" },

  // Telangana
  W_TG3: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/3rd_Telangana_Assembly" },
  IV_TG23: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/vidhan-sabha/telangana/2023/" },
  NEWSMETER_AIMIM: { outlet: "NewsMeter", url: "https://newsmeter.in/hyderabad/aimim-wins-7-out-of-9-seats-retains-hold-over-old-city-721471" },
  SIASAT_CHARMINAR: { outlet: "Siasat", url: "https://www.siasat.com/ex-hyderabad-mayor-mir-zulfiqar-wins-charminar-seat-for-aimim-2926381/" },
  W_NAVEEN: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Naveen_Yadav" },
  FED_NAVEEN: { outlet: "The Federal", url: "https://thefederal.com/category/elections-2025/congress-wins-jubilee-hills-bypoll-election-against-brs-revanth-reddy-v-naveen-yadav-bihar-elections-216144" },
  DH_RAJA: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/india/telangana/bjp-accepts-resignation-of-goshamahal-mla-t-raja-singh-lodh-over-state-unit-chief-selection-3626095" },
  ITV_RAJA: { outlet: "India TV", url: "https://www.indiatvnews.com/telangana/hyderabad-bjp-accepts-telangana-mla-t-raja-singh-s-resignation-calls-his-remarks-irrelevant-2025-07-11-998404" },
  ITV_DANAM: { outlet: "India TV", url: "https://www.indiatvnews.com/news/india/supreme-court-s-setback-for-danam-nagender-as-plea-against-disqualification-as-telangana-mla-dismissed-2026-09-24-1055152" },
  SIASAT_DANAM: { outlet: "Siasat", url: "https://www.siasat.com/sc-upholds-danam-nagenders-disqualification-as-khairatabad-mla-3547373/" },
  TT_SRIGANESH: { outlet: "Telangana Today", url: "https://telanganatoday.com/bypoll-congress-wrests-secunderabad-cantonment-from-brs" },
  W_SRIGANESH: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sri_Ganesh_(politician)" },
  W_RAJENDRANAGAR: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Rajendranagar_Assembly_constituency" },
  TT_SAJJANAR: { outlet: "Telangana Today", url: "https://telanganatoday.com/v-c-sajjanar-takes-charge-as-new-hyderabad-police-commissioner" },
  ANI_SAJJANAR26: { outlet: "ANI", url: "https://aninews.in/news/entertainment/bollywood/after-smooth-ganesh-immersion-hyderabad-cp-sajjanar-joins-police-personnel-in-celebration-dance16020260926183541/" },
  W_BHATTI: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Mallu_Bhatti_Vikramarka" },
  TT_BHATTI: { outlet: "Telangana Today", url: "https://telanganatoday.com/bhatti-vikramarka-deputy-cm-seniors-in-first-list-for-telangana-cabinet" },
  HYD_GOV_AC: { outlet: "hyderabad.telangana.gov.in", url: "https://hyderabad.telangana.gov.in/about-district/constituencies/" },
  HYD_GOV: { outlet: "hyderabad.telangana.gov.in", url: "https://hyderabad.telangana.gov.in/" },
  DC_PRIYANKA: { outlet: "Deccan Chronicle", url: "https://www.deccanchronicle.com/southern-states/telangana/priyanka-ala-appointed-hyderabad-collector-1952782" },
  APAC_PRIYANKA: { outlet: "APAC News", url: "https://apacnewsnetwork.com/2026/04/telangana-government-transfers-30-ias-officers-ias-priyanka-ala-named-hyderabad-collector/" },
  OI_SANATH: { outlet: "Oneindia", url: "https://www.oneindia.com/sanathnagar-assembly-elections-ts-62/" },
  TNM_PADMARAO: { outlet: "The News Minute", url: "https://www.thenewsminute.com/telangana/brs-sitting-mla-t-padmarao-goud-to-contest-lok-sabha-polls-from-secunderabad" },
  IV_LS_HYD: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/telangana/hyderabad/" },
  ITV_OWAISI: { outlet: "India TV", url: "https://www.indiatvnews.com/telangana/hyderabad-hyderabad-lok-sabha-election-results-202-aimim-asaduddin-owaisi-bjp-madhavi-latha-brs-congress-vote-counting-winning-losing-candidates-latest-updates-2024-06-04-934291" },
  IV_LS_SEC: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/telangana/secunderabad/" },
  COAL_KISHAN: { outlet: "coal.gov.in", url: "https://coal.gov.in/minister/shri-g-kishan-reddy" },

  // Tamil Nadu
  W_TN17: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/17th_Tamil_Nadu_Assembly" },
  TNER_CHENNAI: { outlet: "TNElectionResult", url: "https://tnelectionresult.com/districts/chennai" },
  BW_KOLATHUR: { outlet: "BW Businessworld", url: "https://www.businessworld.in/article/tvk-s-vs-babu-defeats-mk-stalin-in-kolathur-ends-dmk-chief-s-stronghold-in-tn-election-2026-605351" },
  W_VIJAYMIN: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/C._Joseph_Vijay_ministry" },
  NTN_TNGOV: { outlet: "News Today", url: "https://newstodaynet.com/2026/09/21/centre-likely-to-appoint-new-governor-for-tamil-nadu-soon/" },
  TNM_AMALRAJ: { outlet: "The News Minute", url: "https://www.thenewsminute.com/tamil-nadu/a-amalraj-appointed-as-chennai-police-commissioner" },
  PRINT_AMALRAJ26: { outlet: "ThePrint", url: "https://theprint.in/india/vinayagar-idols-immersion-held-under-tight-security-in-chennai/3048154/" },
  CHENNAI_NIC_COLL: { outlet: "chennai.nic.in", url: "https://chennai.nic.in/collector/" },
  DTNEXT_COLL: { outlet: "DT Next", url: "https://www.dtnext.in/news/tamilnadu/new-collectors-for-chennai-tiruvallur-in-latest-ias-reshuffle-by-tvk-govt" },
  W_PRIYA: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Priya_Rajan" },
  DTNEXT_PRIYA: { outlet: "DT Next", url: "https://www.dtnext.in/news/chennai/tvk-govt-orders-cost-review-of-90-chennai-corporation-projects-announced-by-mayor-priya" },
  IV_LS_CHN: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-north/" },
  IV_LS_CHS: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-south/" },
  IV_LS_CHC: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/tamil-nadu/chennai-central/" },
  W_KALANIDHI: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kalanidhi_Veeraswamy" },
  W_CHS: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Chennai_South_Lok_Sabha_constituency" },
  DH_DAYANIDHI: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/amp/story/elections%2Findia%2Flok-sabha-elections-2024-dmks-dayanidhi-maran-wins-central-chennai-seat-3049818" },

  // West Bengal
  W_WB18: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/18th_West_Bengal_Assembly" },
  OI_WB26: { outlet: "Oneindia", url: "https://www.oneindia.com/kolkata/west-bengal-election-results-2026-full-winners-list-seat-wise-results-party-tally-vote-margin-d-8076867.html" },
  W_SUVMIN: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Suvendu_Adhikari_ministry" },
  SG_SUV: { outlet: "Sunday Guardian", url: "https://sundayguardianlive.com/india/west-bengal-election-results-2026-live-suvendu-adhikari-to-take-oath-as-west-bengals-new-chief-minister-today-pm-modi-among-key-attendees-watch-190282/" },
  ETV_GHUGE: { outlet: "ETV Bharat", url: "https://www.etvbharat.com/en/state/justice-ravindra-vithalrao-ghuge-sworn-in-as-chief-justice-of-calcutta-hc-enn26090901458" },
  W_CALHC: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Calcutta_High_Court" },
  SCC_SIVAGNANAM: { outlet: "SCC Online", url: "https://www.scconline.com/blog/post/2025/09/15/chief-justice-calcutta-high-court-justice-ts-sivagnanam-legal-news/" },
  W_KOLCP: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Commissioner_of_the_Kolkata_Police" },
  STATESMAN_NAND: { outlet: "The Statesman", url: "https://www.thestatesman.com/cities/kolkata/kolkata-cp-asks-senior-cops-to-brief-juniors-through-video-recordings-1503631951.html" },
  DD_VERMA: { outlet: "DD News", url: "https://ddnews.gov.in/en/manoj-kumar-verma-appointed-as-new-kolkata-commissioner-of-police/" },
  W_FIRHAD: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Firhad_Hakim" },
  ITV_FIRHAD: { outlet: "India TV", url: "https://www.indiatvnews.com/west-bengal/news-firhad-hakim-resigns-as-kolkata-mayor-after-mamata-banerjee-s-approval-amid-tmc-split-reactions-latest-updates-2026-06-03-1043517" },
  PRINT_WBCS: { outlet: "ThePrint", url: "https://theprint.in/india/governance/west-bengal-has-a-new-chief-secy-manoj-agarwal-ias-officer-who-oversaw-2026-polls-as-ceo/2928259/" },
  DH_WBCS: { outlet: "Deccan Herald", url: "https://www.deccanherald.com/elections/west-bengal/west-bengal-assembly-elections-2026-election-commission-appoints-dushyant-nariala-as-chief-secretary-3933236" },
  W_DUMDUM: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Dum_Dum_Assembly_constituency" },
  IV_LS_KD: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/west-bengal/kolkata-dakshin/" },
  IV_LS_KU: { outlet: "IndiaVotes", url: "https://www.indiavotes.com/lok-sabha/2024/west-bengal/kolkata-uttar/" },
  W_SUDIP: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Sudip_Bandyopadhyay" },
  W_KOLDAK: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kolkata_Dakshin_Lok_Sabha_constituency" },

  // Delhi
  W_DL8: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/8th_Delhi_Assembly" },
  BS_NDLS: { outlet: "Business Standard", url: "https://www.business-standard.com/elections/delhi-elections/new-delhi-assembly-result-arvind-kejriwal-parvesh-verma-sandeep-dikshit-125020701980_1.html" },
  ZEE_KASTURBA: { outlet: "Zee News", url: "https://zeenews.india.com/india/live-updates/kasturba-nagar-vidhan-sabha-chunav-result-2025-live-winner-and-looser-candidate-madan-lal-vs-neeraj-basoya-vs-abhishek-dutt-total-votes-margin-bjp-aap-congress-delhi-assembly-election-result-2855402.html" },
  W_KASTURBA: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Kasturba_Nagar_Assembly_constituency" },
  W_SANDHU: { outlet: "Wikipedia", url: "https://en.wikipedia.org/wiki/Taranjit_Singh_Sandhu" },
  PRS_BANSURI: { outlet: "PRS India", url: "https://prsindia.org/mptrack/18-lok-sabha/bansuri-swaraj" },
  SNX_REKHA: { outlet: "Social News XYZ", url: "https://www.socialnews.xyz/2026/09/26/new-delhi-cm-rekha-gupta-attends-physiotherapy-conference-gallery/" },
} as const satisfies Record<string, { outlet: string; url: string }>;

export type SourceKey = keyof typeof SOURCES;

/** The fixed "last verified" moment for every row this script verifies. */
export const VERIFIED_AT = new Date("2026-09-27T12:00:00+05:30");

// ── Plan types ─────────────────────────────────────────────────────────────
export interface RowFields {
  name: string;
  role: string;
  tier: number;
  party: string | null;
  constituency: string | null;
  since: string | null;
}

interface OpBase {
  slug: string;
  reason: string;
}
export interface DeactivateOp extends OpBase {
  kind: "deactivate";
  id: string;
  expectName: string;
  /** Empty only for placeholder rows (no person named, nothing to verify). */
  sources: SourceKey[];
  placeholder?: boolean;
}
export interface UpdateOp extends OpBase {
  kind: "update";
  id: string;
  expectName: string;
  set: Partial<RowFields> & { active?: true };
  sources: SourceKey[];
  /** false = level (tier) fix only: source and lastVerifiedAt are left alone. */
  verify: boolean;
}
export interface AddOp extends OpBase {
  kind: "add";
  row: RowFields;
  sources: SourceKey[];
}
export type Op = DeactivateOp | UpdateOp | AddOp;

// ── Small builders (keep the plan readable) ───────────────────────────────
type S = SourceKey[];
const deact = (slug: string, id: string, expectName: string, reason: string, sources: S): DeactivateOp =>
  ({ kind: "deactivate", slug, id, expectName, reason, sources });
const placeholder = (slug: string, id: string, expectName: string, reason = "Placeholder row: no person named."): DeactivateOp =>
  ({ kind: "deactivate", slug, id, expectName, reason, sources: [], placeholder: true });
const keep = (slug: string, id: string, expectName: string, sources: S, set: UpdateOp["set"] = {}, reason = "Confirmed current."): UpdateOp =>
  ({ kind: "update", slug, id, expectName, set, sources, verify: true, reason });
const fix = (slug: string, id: string, expectName: string, set: UpdateOp["set"], reason: string, sources: S): UpdateOp =>
  ({ kind: "update", slug, id, expectName, set, sources, verify: true, reason });
const retier = (slug: string, id: string, expectName: string, tier: number, reason: string): UpdateOp =>
  ({ kind: "update", slug, id, expectName, set: { tier }, sources: [], verify: false, reason });
const add = (slug: string, row: RowFields, sources: S, reason: string): AddOp => ({ kind: "add", slug, row, sources, reason });

const mla = (constituency: string, name: string, party: string, since: string, label = constituency.replace(/\s*[—(].*$/, "").trim()): RowFields =>
  ({ name, role: `MLA, ${label}`, tier: 4, party, constituency, since });
const mp = (constituency: string, name: string, party: string, since: string, role = "Member of Parliament (Lok Sabha)"): RowFields =>
  ({ name, role, tier: 4, party, constituency, since });
const officer = (name: string, role: string, since: string | null, tier = 3): RowFields =>
  ({ name, role, tier, party: null, constituency: null, since });

// Shared facts, reused per district.
const PRESIDENT_SINCE = "25 July 2022";
const PM_SINCE = "26 May 2014";
const NATIONAL_SRC: S = ["W_MURMU", "N24_BDAY"];
const president = (slug: string, id: string) => keep(slug, id, "Droupadi Murmu", NATIONAL_SRC, { since: PRESIDENT_SINCE });
const pm = (slug: string, id: string) => keep(slug, id, "Narendra Modi", NATIONAL_SRC, { since: PM_SINCE });
const addPresident = (slug: string) =>
  add(slug, { name: "Droupadi Murmu", role: "President of India", tier: 1, party: null, constituency: null, since: PRESIDENT_SINCE }, NATIONAL_SRC, "Missing.");
const addPm = (slug: string) =>
  add(slug, { name: "Narendra Modi", role: "Prime Minister", tier: 1, party: "BJP", constituency: null, since: PM_SINCE }, NATIONAL_SRC, "Missing.");

const KA_CM_SRC: S = ["W_KA_COM", "BS_DKS"];
const KA_MLA_SRC: S = ["W_KA16", "IV_KA23"];
const karnatakaTop = (slug: string): Op[] => [
  add(slug, { name: "D. K. Shivakumar", role: "Chief Minister of Karnataka", tier: 2, party: "INC", constituency: null, since: "3 June 2026" }, KA_CM_SRC,
    "Chief Minister since 3 June 2026 (Siddaramaiah resigned 28 May 2026)."),
  add(slug, { name: "G. Parameshwara", role: "Deputy Chief Minister of Karnataka", tier: 2, party: "INC", constituency: null, since: "3 June 2026" }, ["W_KA_COM", "INC_DKS"],
    "Deputy Chief Minister since 3 June 2026."),
];
const MH_DYCM_SHINDE = (slug: string) =>
  add(slug, { name: "Eknath Shinde", role: "Deputy Chief Minister of Maharashtra", tier: 2, party: "SHS", constituency: null, since: "5 December 2024" },
    ["W_FADNAVIS3", "PMRDA_SHINDE"], "Deputy Chief Minister; missing.");
const MH_GOV_SRC: S = ["W_GOVS", "QUINT_GOVS"];

// ── The plan ──────────────────────────────────────────────────────────────
export const PLAN: Op[] = [
  // ════════ MANDYA (Karnataka) ════════
  president("mandya", "cmnawljh8001q10s4ch51uskf"),
  pm("mandya", "cmnwnzmvw01v610pdrgro8mc3"),
  keep("mandya", "cmnziu50p0001asxnba5iwhrg", "Thaavar Chand Gehlot", ["W_GOVS", "BS_DKS"], { since: "11 July 2021" }),
  deact("mandya", "cmnziu4xf0000asxn0u1li5xm", "Siddaramaiah", "Resigned as Chief Minister on 28 May 2026.", KA_CM_SRC),
  ...karnatakaTop("mandya"),
  placeholder("mandya", "cmnzj5sba0004mfxnu98ecd2m", "[Verify at mandya.nic.in]"),
  add("mandya", officer("Dr. Kumara", "Deputy Commissioner, Mandya", null), ["MANDYA_NIC_DC", "SOM_MELUKOTE"], "Named Deputy Commissioner (row was a placeholder)."),
  placeholder("mandya", "cmnzj50h10006lfxnk6za0ibn", "[Verify at ksp.gov.in]"),
  add("mandya", officer("Dr. V. J. Shobharani", "Superintendent of Police, Mandya", "January 2026"), ["SOM_IPS_JAN26", "HANS_SHOBHARANI"],
    "Named SP (row was a placeholder). mandya.nic.in still shows her predecessor."),
  deact("mandya", "cmmv9n835000gubxnbf893hi7", "Narasimha Nayak", "Krishnarajpet's 2023 winner is H. T. Manju (JD(S)).", KA_MLA_SRC),
  add("mandya", mla("Krishnarajpet — 192", "H. T. Manju", "JD(S)", "2023"), KA_MLA_SRC, "Krishnarajpet MLA."),
  deact("mandya", "cmmv9n835000bubxnab2y7k2h", "D.C. Thammanna", "Maddur's 2023 winner is K. M. Udaya (INC).", KA_MLA_SRC),
  add("mandya", mla("Maddur — 187", "K. M. Udaya", "INC", "2023"), KA_MLA_SRC, "Maddur MLA."),
  keep("mandya", "cmmv9n835000aubxnpt4cxjl2", "P.M. Narendraswamy", KA_MLA_SRC),
  keep("mandya", "cmmv9n835000dubxnet3hrr1f", "P. Ravikumar (Ganiga)", KA_MLA_SRC),
  keep("mandya", "cmmv9n835000cubxnffgt8gyr", "Darshan Puttannaiah", KA_MLA_SRC),
  fix("mandya", "cmmv9n835000fubxnznikgoc2", "N. Chauvarayaswamy", { name: "N. Chaluvarayaswamy" }, "Name misspelt.", KA_MLA_SRC),
  keep("mandya", "cmmv9n835000eubxnecfdhn92", "A.B. Ramesh Bandisiddegowda", KA_MLA_SRC),
  keep("mandya", "cmmv9n8350009ubxnywbwp24n", "H.D. Kumaraswamy", ["IV_LS_MANDYA", "PIB_HDK"]),

  // ════════ MYSURU (Karnataka) ════════
  president("mysuru", "cmnziu7c20008asxn0xhw145n"),
  pm("mysuru", "cmnziu7940007asxntijfn31o"),
  keep("mysuru", "cmnziu75x0006asxn43ipexu4", "Thaavar Chand Gehlot", ["W_GOVS", "BS_DKS"], { since: "11 July 2021" }),
  ...karnatakaTop("mysuru"),
  deact("mysuru", "cmnakalha000e0mxn58g5gmft", "G. Jagadeesha", "Not Mysuru DC (he was Bengaluru Urban DC until June 2026). Mysuru DC is G. Lakshmikanth Reddy.", ["MYSORE_NIC_DC", "DH_BU_DC"]),
  add("mysuru", officer("G. Lakshmikanth Reddy", "Deputy Commissioner, Mysuru", null), ["MYSORE_NIC_DC", "SOM_DASARA26"], "Mysuru DC, confirmed 15 Sep 2026."),
  deact("mysuru", "cmnakall5000h0mxnvoxf9gju", "Seemant Kumar Singh", "He is Bengaluru City Police Commissioner, not a Mysuru officer.", ["BS_SEEMANT", "DH_SEEMANT26"]),
  add("mysuru", officer("Seema Latkar", "Commissioner of Police, Mysuru City", null), ["MYSORE_NIC_CP", "SOM_LATKAR26"], "Mysuru City Police Commissioner."),
  placeholder("mysuru", "cmnakall5000i0mxn90hgz22f", "SP, Mysuru Rural", "Role-as-name placeholder; the district SP is added by name."),
  add("mysuru", officer("Mallikarjun Baladandi", "Superintendent of Police, Mysuru District", "January 2026"), ["MYSORE_NIC_SP", "UDAYAVANI_SP"], "Mysuru district SP since Jan 2026."),
  deact("mysuru", "cmnakald3000d0mxnk154tv5y", "Anitha Kumaraswamy", "No elected Zilla Panchayat in Karnataka since 2021 (administrators in charge).", ["DH_ZP", "HANS_ZP"]),
  placeholder("mysuru", "cmnakalha000g0mxnw39hiby9", "ADC, Mysuru Division", "Role-as-name placeholder."),
  placeholder("mysuru", "cmnakalha000f0mxn0l393tww", "[Name Not Available]"),
  deact("mysuru", "cmnakakzg00050mxnxct8l3sx", "B.Z. Zameer Ahmed Khan", "He is MLA for Chamrajpet (Bengaluru); Chamaraja (Mysuru) is K. Harish Gowda.", KA_MLA_SRC),
  add("mysuru", mla("Chamaraja", "K. Harish Gowda", "INC", "2023"), KA_MLA_SRC, "Chamaraja MLA."),
  deact("mysuru", "cmnakal0u00060mxnw0ucvrsw", "Vasu K. Reddy", "Chamundeshwari's 2023 winner is G. T. Devegowda (JD(S)).", KA_MLA_SRC),
  add("mysuru", mla("Chamundeshwari", "G. T. Devegowda", "JD(S)", "2023"), KA_MLA_SRC, "Chamundeshwari MLA."),
  deact("mysuru", "cmnakakuz00020mxnybhjcnsf", "H.D. Revanna", "H.D. Kote's 2023 winner is Anil Chikkamadhu (INC).", KA_MLA_SRC),
  add("mysuru", mla("H.D. Kote", "Anil Chikkamadhu", "INC", "2023"), KA_MLA_SRC, "H.D. Kote MLA."),
  deact("mysuru", "cmnakal6900080mxnj5knaqx3", "M.K. Somashekara", "Hunsur's 2023 winner is G. D. Harish Gowda (JD(S)).", KA_MLA_SRC),
  add("mysuru", mla("Hunsur", "G. D. Harish Gowda", "JD(S)", "2023"), KA_MLA_SRC, "Hunsur MLA."),
  deact("mysuru", "cmnakal7k00090mxng7zxga7c", "Sa. Ra. Mahesh", "K.R. Nagar's 2023 winner is D. Ravishankar (INC).", KA_MLA_SRC),
  add("mysuru", mla("K. R. Nagar", "D. Ravishankar", "INC", "2023"), KA_MLA_SRC, "K. R. Nagar MLA."),
  deact("mysuru", "cmnakaky300040mxng2trspwa", "M.K. Somashekar", "Krishnaraja's 2023 winner is T. S. Srivatsa (BJP).", KA_MLA_SRC),
  add("mysuru", mla("Krishnaraja", "T. S. Srivatsa", "BJP", "2023"), KA_MLA_SRC, "Krishnaraja MLA."),
  deact("mysuru", "cmnakala6000b0mxn97eg00ty", "H.V. Umesh", "Nanjangud's 2023 winner is Darshan Dhruvanarayana (INC).", KA_MLA_SRC),
  add("mysuru", mla("Nanjangud", "Darshan Dhruvanarayana", "INC", "2023"), KA_MLA_SRC, "Nanjangud MLA."),
  deact("mysuru", "cmnakal2700070mxnkbe2wm43", "H.S. Mahesh", "T. Narasipur's 2023 winner is Dr. H. C. Mahadevappa (INC).", ["IV_KA23", "W_TNARASIPUR"]),
  add("mysuru", mla("T. Narasipur", "Dr. H. C. Mahadevappa", "INC", "2023"), ["IV_KA23", "W_TNARASIPUR"], "T. Narasipur MLA."),
  keep("mysuru", "cmnakakwi00030mxnaskxyc7t", "Tanveer Sait", KA_MLA_SRC),
  keep("mysuru", "cmnakal8w000a0mxnhu01k7ml", "K. Venkatesh", KA_MLA_SRC),
  keep("mysuru", "cmnakakte00010mxnp6z9488x", "Siddaramaiah", KA_MLA_SRC, {}, "Still MLA for Varuna after resigning as CM."),
  keep("mysuru", "cmnakakr200000mxnml6as037", "Yaduveer Krishnadatta Chamaraja Wadiyar", ["IV_LS_MYSORE", "W_18LS"]),
  add("mysuru", mp("Chamarajanagar", "Sunil Bose", "INC", "2024"), ["IV_LS_CHAMARAJANAGAR", "W_18LS"],
    "MP for Chamarajanagar, which covers Varuna, T. Narasipur, H.D. Kote and Nanjangud."),
  deact("mysuru", "cmnakald2000c0mxn1dy5l6jl", "Shivakumar (Mayor)", "Mysuru City Corporation council's term ended 16 Nov 2023; an administrator runs it.", ["SOM_MCC_COUNCIL", "W_MCC"]),
  placeholder("mysuru", "cmnakam56000t0mxn32s5lhdu", "[Name Not Available]"),
  placeholder("mysuru", "cmnakam6x000u0mxnepd604so", "Executive Engineer, PWD", "Role-as-name placeholder."),
  placeholder("mysuru", "cmnakam9i000w0mxnwavpi1t1", "[Name Not Available]"),
  placeholder("mysuru", "cmnakamaz000x0mxnz19shwf5", "[Name Not Available]"),

  // ════════ BENGALURU URBAN (Karnataka) ════════
  president("bengaluru-urban", "cmnziu5we0005asxnb11urz5k"),
  pm("bengaluru-urban", "cmnziu5tg0004asxnmcithrpi"),
  keep("bengaluru-urban", "cmnziu5qg0003asxnn70sj98j", "Thaavar Chand Gehlot", ["W_GOVS", "BS_DKS"], { since: "11 July 2021" }),
  deact("bengaluru-urban", "cmnziu5ng0002asxnhgptx0n3", "Siddaramaiah", "Resigned as Chief Minister on 28 May 2026.", KA_CM_SRC),
  ...karnatakaTop("bengaluru-urban"),
  placeholder("bengaluru-urban", "cmnakasxm000q1axnmt9qrsw0", "Deputy Commissioner, Bengaluru Urban", "Role-as-name placeholder; DC added by name."),
  add("bengaluru-urban", officer("P. S. Kantharaju", "Deputy Commissioner, Bengaluru Urban", "June 2026"), ["DH_BU_DC", "IANS_BU_DC"],
    "DC since June 2026 (G. Jagadeesha moved to Bengaluru Central City Corporation)."),
  deact("bengaluru-urban", "cmnakat20000u1axnpbrk3c6x", "B. Dayananda", "Replaced as Police Commissioner in June 2025.", ["BS_SEEMANT", "DH_SEEMANT26"]),
  add("bengaluru-urban", officer("Seemant Kumar Singh", "Commissioner of Police, Bengaluru City", "June 2025"), ["BS_SEEMANT", "DH_SEEMANT26"], "Bengaluru Police Commissioner."),
  deact("bengaluru-urban", "cmnakastq000p1axng9ym75op", "ZP President, Bengaluru Urban", "No elected Zilla Panchayat since 2021; row was a role-as-name placeholder.", ["DH_ZP", "HANS_ZP"]),
  placeholder("bengaluru-urban", "cmnakasxm000r1axnklj8r7c9", "CEO, Bengaluru Urban ZP", "Role-as-name placeholder."),
  // MLAs — 28 constituencies of Bengaluru Urban district (2023 results).
  deact("bengaluru-urban", "cmnakasp9000l1axno5jxctt0", "Nadahalli Srinivas", "Anekal's 2023 winner is B. Shivanna (INC).", KA_MLA_SRC),
  add("bengaluru-urban", mla("Anekal (SC)", "B. Shivanna", "INC", "2023"), KA_MLA_SRC, "Anekal MLA."),
  keep("bengaluru-urban", "cmnakarxi00041axnc1jm1jhk", "Ramalinga Reddy", KA_MLA_SRC),
  fix("bengaluru-urban", "cmnakaslc000i1axn93onngo9", "Satish Reddy",
    { name: "M. Satish Reddy", role: "MLA, Bommanahalli", constituency: "Bommanahalli", since: "2023" }, "He is MLA for Bommanahalli (not Bangalore South).", KA_MLA_SRC),
  keep("bengaluru-urban", "cmnakas5800091axnqib2bivn", "Krishna Byre Gowda", KA_MLA_SRC),
  fix("bengaluru-urban", "cmnakasnx000k1axntem1p8oa", "M. Krishnappa",
    { role: "MLA, Vijay Nagar", constituency: "Vijay Nagar", party: "INC", since: "2023" }, "M. Krishnappa (INC) is MLA for Vijay Nagar; Chickpet is Uday B. Garudachar.", KA_MLA_SRC),
  add("bengaluru-urban", mla("Chickpet", "Uday B. Garudachar", "BJP", "2023"), KA_MLA_SRC, "Chickpet MLA."),
  add("bengaluru-urban", mla("Bangalore South", "M. Krishnappa", "BJP", "2023"), KA_MLA_SRC, "Bangalore South MLA (a different M. Krishnappa, BJP)."),
  fix("bengaluru-urban", "cmnakarzf00051axnghotfrk0", "Dinesh Gundu Rao",
    { role: "MLA, Gandhi Nagar", constituency: "Gandhi Nagar", since: "2023" }, "He is not KPCC president; role text corrected.", KA_MLA_SRC),
  keep("bengaluru-urban", "cmnakasmn000j1axntmflnebf", "Byrathi Suresh", KA_MLA_SRC),
  deact("bengaluru-urban", "cmnakas2h00071axnnaeqqyz1", "Sowmya Reddy", "Jayanagar's 2023 winner (after recount) is C. K. Ramamurthy (BJP).", KA_MLA_SRC),
  add("bengaluru-urban", mla("Jayanagar", "C. K. Ramamurthy", "BJP", "2023"), KA_MLA_SRC, "Jayanagar MLA."),
  deact("bengaluru-urban", "cmnakarv500031axn1gjoavb5", "D.K. Shivakumar", "Kanakapura is in Bengaluru South district, not Bengaluru Urban; he is listed as Chief Minister.", ["W_KANAKAPURA", "IV_KA23"]),
  deact("bengaluru-urban", "cmnakasi0000g1axndja4g399", "T.A. Sharavana", "K.R. Puram's 2023 winner is B. A. Basavaraja (BJP).", KA_MLA_SRC),
  add("bengaluru-urban", mla("Krishnarajapuram", "B. A. Basavaraja", "BJP", "2023"), KA_MLA_SRC, "K.R. Puram MLA."),
  deact("bengaluru-urban", "cmnakasbb000d1axnkpqe7su9", "C.N. Manjunath", "Mahadevapura's 2023 winner is Manjula S. (BJP); Dr. C. N. Manjunath is the Bangalore Rural MP.", KA_MLA_SRC),
  add("bengaluru-urban", mla("Mahadevapura (SC)", "Manjula S.", "BJP", "2023"), KA_MLA_SRC, "Mahadevapura MLA."),
  keep("bengaluru-urban", "cmnakasgo000f1axnzj84esb8", "R. Ashok", KA_MLA_SRC),
  fix("bengaluru-urban", "cmnakas6m000a1axn9idscyk7", "Priya Krishna",
    { role: "MLA, Govindraj Nagar", constituency: "Govindraj Nagar", since: "2023" }, "He is MLA for Govindraj Nagar; Pulakeshinagar is A. C. Srinivasa.", KA_MLA_SRC),
  add("bengaluru-urban", mla("Pulakeshinagar (SC)", "A. C. Srinivasa", "INC", "2023"), KA_MLA_SRC, "Pulakeshinagar MLA."),
  keep("bengaluru-urban", "cmnakasjc000h1axntjn50ndg", "S. Suresh Kumar", KA_MLA_SRC),
  fix("bengaluru-urban", "cmnakas3u00081axndp53ss7u", "N.A. Harris", { name: "N. A. Haris" }, "Name misspelt.", KA_MLA_SRC),
  deact("bengaluru-urban", "cmnakascq000e1axng54rkyl8", "Vijayendra Yediyurappa", "Shikaripura is in Shivamogga district, not Bengaluru Urban.", KA_MLA_SRC),
  keep("bengaluru-urban", "cmnakas0y00061axnrq6y1ug1", "Rizwan Arshad", KA_MLA_SRC),
  deact("bengaluru-urban", "cmnakas9y000c1axn4glm55r4", "R. Roshan Baig", "Not an MLA; Shivajinagar's MLA is Rizwan Arshad.", KA_MLA_SRC),
  deact("bengaluru-urban", "cmnakas7y000b1axneo7gsv8y", "Abhay Patil", "Yelahanka's 2023 winner is S. R. Vishwanath (BJP).", KA_MLA_SRC),
  add("bengaluru-urban", mla("Yelahanka", "S. R. Vishwanath", "BJP", "2023"), KA_MLA_SRC, "Yelahanka MLA."),
  deact("bengaluru-urban", "cmnakasqz000m1axn46vwupvx", "Shivaram Hebbar", "Yeshwanthpur's MLA is S. T. Somashekar; Hebbar is MLA for Yellapur.", KA_MLA_SRC),
  add("bengaluru-urban", mla("Yeshwanthpur", "S. T. Somashekar", "IND", "2023"), ["W_KA16", "BS_EXPEL"],
    "Yeshwanthpur MLA; won for BJP in 2023, expelled from BJP on 27 May 2025."),
  add("bengaluru-urban", mla("Rajarajeshwarinagar", "Munirathna", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Dasarahalli", "S. Muniraju", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Mahalakshmi Layout", "K. Gopalaiah", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Malleshwaram", "Dr. C. N. Ashwath Narayan", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Sarvagnanagar", "K. J. George", "INC", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("C. V. Raman Nagar (SC)", "S. Raghu", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Chamrajpet", "B. Z. Zameer Ahmed Khan", "INC", "2023"), KA_MLA_SRC, "Missing MLA."),
  add("bengaluru-urban", mla("Basavanagudi", "Ravi Subramanya L. A.", "BJP", "2023"), KA_MLA_SRC, "Missing MLA."),
  // MPs
  keep("bengaluru-urban", "cmnakars600011axnrdfzk0u3", "P.C. Mohan", ["IV_LS_BLR_C", "W_18LS"]),
  keep("bengaluru-urban", "cmnakartm00021axncq9z7fr2", "Tejasvi Surya", ["IV_LS_BLR_S", "W_18LS"]),
  keep("bengaluru-urban", "cmnakarqs00001axnanftn3jv", "Shobha Karandlaje", ["IV_LS_BLR_N", "NIMSME_SHOBHA"]),
  add("bengaluru-urban", mp("Bangalore Rural", "Dr. C. N. Manjunath", "BJP", "2024"), ["IV_LS_BLR_R", "W_18LS"],
    "MP for Bangalore Rural (covers Rajarajeshwarinagar, Bangalore South, Anekal)."),
  add("bengaluru-urban", mp("Chikkaballapur", "Dr. K. Sudhakar", "BJP", "2024"), ["IV_LS_CHIKKABALLAPUR", "W_18LS"], "MP for Chikkaballapur (covers Yelahanka)."),
  placeholder("bengaluru-urban", "cmnakatkt00181axnubilug42", "[Name Not Available]", "Placeholder; BBMP was replaced by the Greater Bengaluru Authority in 2025."),
  placeholder("bengaluru-urban", "cmnakatf700141axn2cdlf9xj", "District Health Officer", "Role-as-name placeholder."),
  placeholder("bengaluru-urban", "cmnakatr4001c1axnj51cymvv", "[Name Not Available]"),

  // ════════ PUNE (Maharashtra) ════════
  addPresident("pune"),
  addPm("pune"),
  add("pune", { name: "Jishnu Dev Varma", role: "Governor of Maharashtra", tier: 2, party: null, constituency: null, since: "March 2026" }, MH_GOV_SRC, "Missing."),
  add("pune", { name: "Devendra Fadnavis", role: "Chief Minister of Maharashtra", tier: 2, party: "BJP", constituency: null, since: "5 December 2024" }, ["W_FADNAVIS3", "LOKTEJ_FADNAVIS"], "Missing."),
  MH_DYCM_SHINDE("pune"),
  fix("pune", "cmobqkctf000cn3xnyyroqlvq", "Sunetra Ajit Pawar",
    { name: "Sunetra Pawar", role: "Deputy Chief Minister of Maharashtra (Guardian Minister, Pune)", tier: 2, since: "31 January 2026" },
    "Deputy CM since 31 Jan 2026 (after Ajit Pawar's death) and Pune guardian minister; shown with the state leaders.", ["W_FADNAVIS3", "AIR_SUNETRA"]),
  add("pune", mla("Baramati", "Sunetra Pawar", "NCP", "2026 (by-election)"), ["ZEE_BARAMATI", "INDIACOM_BARAMATI"],
    "Won the Baramati by-election held after Ajit Pawar died on 28 Jan 2026."),
  // MPs were stored at level 1 (country). They belong with MLAs (level 4).
  fix("pune", "cmobqkldf000lnrxn41q4fg4n", "Supriya Sule", { tier: 4 }, "MP: level 1 → 4.", ["IV_LS_BARAMATI", "W_MH_LS24"]),
  fix("pune", "cmobqklgd000mnrxnf6biqqmx", "Dr. Amol Ramsing Kolhe", { tier: 4 }, "MP: level 1 → 4.", ["IV_LS_SHIRUR", "W_MH_LS24"]),
  fix("pune", "cmobqklj8000nnrxndswr8pz7", "Shrirang Appa Chandu Barne", { tier: 4 }, "MP: level 1 → 4.", ["IV_LS_MAVAL", "W_MH_LS24"]),
  fix("pune", "cmobqkbqg0000n3xnlyho460z", "Murlidhar Kisan Mohol", { tier: 4 }, "MP: level 1 → 4.", ["IV_LS_PUNE", "W_MH_LS24"]),
  // MLAs were stored at level 2 (state) with a generic role.
  ...([
    ["cmobqkl1h000hnrxnrr914td3", "Chetan Vitthal Tupe", "Hadapsar"],
    ["cmobqkjvq0003nrxnrf3rpfjj", "Madhuri Satish Misal", "Parvati"],
    ["cmobqkjyo0004nrxnqth0m5x1", "Sunil Dnyandev Kamble", "Pune Cantonment"],
    ["cmobqkk1n0005nrxn2v2mls4w", "Hemant Narayan Rasane", "Kasba Peth"],
    ["cmobqkk4n0006nrxn0d4yf2i8", "Rahul Subhashrao Kul", "Daund"],
    ["cmobqkk7p0007nrxncv86d431", "Dattatraya Vithoba Bharane", "Indapur"],
    ["cmobqkkdp0009nrxntgvws57x", "Vijay Shivatare", "Purandar"],
    ["cmobqkkgn000anrxn99xtcgx6", "Shankar Hiraman Mandekar", "Bhor"],
    ["cmobqkkjj000bnrxnh14md719", "Bhimrao Dhondiba Tapkir", "Khadakwasla"],
    ["cmobqkkmh000cnrxnrbzp88q2", "Sharaddada Bhimaji Sonawane", "Junnar"],
    ["cmobqkkpi000dnrxn004sibhl", "Dilip Dattatray Walse-Patil", "Ambegaon"],
    ["cmobqkksi000enrxnt20d02bb", "Babaji Ramchandra Kale", "Khed-Alandi"],
    ["cmobqkkvg000fnrxna0hvc5ql", "Dnyaneshwar Aba Katke", "Shirur"],
    ["cmobqkkyh000gnrxntzy1y0qr", "Mahesh Kisan Landge", "Bhosari"],
    ["cmobqkl4g000inrxnph5gtkcs", "Sunil Shankarrao Shelke", "Maval"],
    ["cmobqkl7f000jnrxn508qtljb", "Shankar Jagtap", "Chinchwad"],
    ["cmobqklae000knrxne3pysz0p", "Anna Dadu Bansode", "Pimpri"],
    ["cmobqkjmf0000nrxnzn80ir5i", "Bapusaheb Tukaram Pathare", "Vadgaon Sheri"],
    ["cmobqkjpp0001nrxna2wrdzpe", "Siddharth Shirole", "Shivajinagar"],
    ["cmobqkjsq0002nrxn3h5jwe79", "Chandrakant Bachhu Patil", "Kothrud"],
  ] as const).map(([id, name, label]) =>
    fix("pune", id, name, { tier: 4, role: `MLA, ${label}` }, "MLA: level 2 → 4, role wording.", ["IV_MH24", "W_MH15"])),
  fix("pune", "cmobqkcgk0008n3xns4rn4nov", "Jitendra Dudi", { tier: 3, role: "District Collector, Pune" }, "District officer: level 4 → 3.", ["PUNE_GOV_COLL", "FPJ_DUDI"]),
  fix("pune", "cmobqkcwm000dn3xna69yjg2v", "Amitesh Kumar", { tier: 3 }, "District officer: level 5 → 3.", ["W_PUNECP", "PUNEKAR_CP"]),
  fix("pune", "cmobqkc6y0005n3xngjurlzm3", "Manjusha Nagpure", { tier: 5 }, "City: level 3 → 5.", ["FPJ_MAYORS", "BRIDGE_LANDGE"]),
  fix("pune", "cmobqkcdh0007n3xnsd08twr6", "Ravi Landge", { tier: 5 }, "City: level 3 → 5.", ["FPJ_MAYORS", "BRIDGE_LANDGE"]),
  fix("pune", "cmobqkc3o0004n3xnd5tzvw0v", "Dr. Vijay Suryawanshi", { tier: 5 }, "City: level 3 → 5.", ["APAC_SURYAWANSHI", "FPJ_SURYAWANSHI"]),
  retier("pune", "cmobqkcjq0009n3xn5mrf91bd", "Dr. Chandrakant Sulochana Laxmanrao Pulkundwar", 3, "District officer: level 4 → 3 (person not re-checked)."),
  retier("pune", "cmobqkcn3000an3xnedtrdhnb", "Kavita Dwivedi", 3, "District officer: level 4 → 3 (person not re-checked)."),
  retier("pune", "cmobqkcqb000bn3xnqh7y2o5q", "U A Jadhav", 3, "District officer: level 4 → 3 (person not re-checked)."),
  retier("pune", "cmobqkczq000en3xnwvfcwusi", "Vinoy Kumar Choubey", 3, "District officer: level 5 → 3 (person not re-checked)."),
  retier("pune", "cmobqkd2u000fn3xnenlras2p", "Sandeep Singh Gill", 3, "District officer: level 5 → 3 (person not re-checked)."),
  retier("pune", "cmobqkbxd0002n3xn8ozly1zx", "Prajeet Nair", 5, "City: level 3 → 5 (person not re-checked)."),
  retier("pune", "cmobqkc0l0003n3xnk8go2kga", "Shantanu Goel", 5, "City: level 3 → 5 (person not re-checked)."),
  retier("pune", "cmobqkca70006n3xntbo1nh6r", "Parshuram Wadekar", 5, "City: level 3 → 5 (person not re-checked)."),
  retier("pune", "cmobqkbu30001n3xnt36lunvc", "Naval Kishore Ram", 5, "City: level 3 → 5 (person not re-checked)."),

  // ════════ MUMBAI (Maharashtra) ════════
  president("mumbai", "cmnziu8dy000aasxnl6gz7wr4"),
  pm("mumbai", "cmnziu8au0009asxnmg1539vg"),
  keep("mumbai", "cmnfm3feu000n3rxnsdcumsoc", "Devendra Fadnavis", ["W_FADNAVIS3", "LOKTEJ_FADNAVIS"], { since: "5 December 2024" }),
  keep("mumbai", "cmnfm3feu000m3rxnt5k1ly3q", "Jishnu Dev Varma", [...MH_GOV_SRC, "FPJ_TRIPATHI"], { since: "March 2026" },
    "Correct: Governor of Maharashtra since March 2026 (administered the Bombay HC oath on 9 Sep 2026)."),
  MH_DYCM_SHINDE("mumbai"),
  add("mumbai", { name: "Sunetra Pawar", role: "Deputy Chief Minister of Maharashtra", tier: 2, party: "NCP", constituency: null, since: "31 January 2026" },
    ["W_FADNAVIS3", "GULF_SUNETRA"], "Deputy Chief Minister; missing."),
  keep("mumbai", "cmnfm3feu000o3rxnjg5cg4bd", "Deven Bharti", ["W_MUMCP", "ELETS_BHARTI"], { since: "May 2025" }),
  placeholder("mumbai", "cmnfm3feu000u3rxnj9vdygzj", "[Name Not Available]"),
  fix("mumbai", "cmnfm3feu000j3rxnttrbqen8", "Aanchal Sood Goyal", { tier: 3, since: "March 2025" }, "District officer: level 4 → 3.", ["MUMCITY_COLL", "PRINT_GOYAL"]),
  fix("mumbai", "cmnfm3feu000k3rxnuduiondf", "Saurabh Katiyar", { tier: 3 }, "District officer: level 4 → 3.", ["MUMSUB_COLL", "APAC_KATIYAR"]),
  keep("mumbai", "cmnfm3feu000f3rxnmudznfea", "Amit Satam", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu000a3rxnrqp1rlud", "Varun Sardesai", ["ETV_BANDRAE", "W_MH15"]),
  keep("mumbai", "cmnfm3feu00093rxn8odlc96c", "Ashish Shelar", ["W_VANDREW", "ZEE_VANDREW"]),
  keep("mumbai", "cmnfm3feu000b3rxnzaoytfgx", "Sanjay Upadhyay", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu00063rxnb2b1qegd", "Rahul Narwekar", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu000g3rxn0wjag28o", "Jyoti Gaikwad", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu000e3rxn4lqm6hxl", "Parag Shah", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu000d3rxntbdoipnw", "Ram Kadam", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu00073rxn46qhvujq", "Mangal Prabhat Lodha", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu000c3rxn9cuad096", "Mihir Kotecha", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu00083rxnuortnfj8", "Aaditya Thackeray", ["IV_MH24", "W_MH15"]),
  keep("mumbai", "cmnfm3feu00023rxnpvzovqss", "Sanjay Dina Patil", ["IV_LS_MUM_NE", "W_MUM_NE"]),
  keep("mumbai", "cmnfm3fet00003rxn4z7txcae", "Piyush Goyal", ["IV_LS_MUM_N", "W_MH_LS24"]),
  keep("mumbai", "cmnfm3feu00013rxnnynmbq6x", "Varsha Gaikwad", ["IV_LS_MUM_NC", "W_MUM_NC"]),
  keep("mumbai", "cmnfm3feu00033rxn6gx27dra", "Ravindra Waikar", ["IV_LS_MUM_NW", "W_MUM_NW"]),
  keep("mumbai", "cmnfm3feu00053rxnfkvuc8u5", "Anil Desai", ["IV_LS_MUM_SC", "W_MUM_SC"]),
  keep("mumbai", "cmnfm3feu00043rxn09bgu0c8", "Arvind Sawant", ["IV_LS_MUM_S", "W_MH_LS24"]),
  retier("mumbai", "cmnfm3feu000l3rxnn50emlfb", "Dr. Sanjay Mukherjee", 5, "Department head: level 4 → 5 (person not re-checked)."),
  deact("mumbai", "cmnfm3feu000v3rxnnjw7lcu8", "Justice Shree Chandrashekhar", "Elevated to the Supreme Court; Justice Mahesh Chandra Tripathi sworn in 9 Sep 2026.", ["FPJ_TRIPATHI", "LIVELAW_TRIPATHI"]),
  add("mumbai", officer("Justice Mahesh Chandra Tripathi", "Chief Justice, Bombay High Court", "9 September 2026", 5), ["FPJ_TRIPATHI", "LIVELAW_TRIPATHI"], "New Chief Justice."),
  placeholder("mumbai", "cmnfm3feu00123rxn4zn1zll2", "[Name Not Available]"),
  placeholder("mumbai", "cmnfm3feu00153rxnbburd5u2", "Solid Waste Management Director", "Role-as-name placeholder."),
  keep("mumbai", "cmnfm3feu000h3rxnipkyd9u5", "Ritu Tawde", ["W_TAWDE", "BS_TAWDE"], { since: "February 2026" }),
  keep("mumbai", "cmnfm3feu000i3rxnw9q6zij0", "Ashwini Bhide", ["W_BHIDE", "ELETS_BHIDE"], { since: "1 April 2026" }),
  placeholder("mumbai", "cmnfm3feu000w3rxnogof1beb", "Principal Judge", "Role-as-name placeholder."),
  placeholder("mumbai", "cmnfm3feu00143rxnjuayw2e1", "Chief Fire Officer", "Role-as-name placeholder."),
  placeholder("mumbai", "cmnfm3feu00133rxn18npyglz", "Executive Health Officer", "Role-as-name placeholder."),

  // ════════ LUCKNOW (Uttar Pradesh) ════════
  president("lucknow", "cmnziuakp000gasxnkknxxdqg"),
  pm("lucknow", "cmnziuahj000fasxnbl3g8lwf"),
  keep("lucknow", "cmntdqt2l000blnxnsvg0kh4c", "Yogi Adityanath", ["W_CMS", "DNA_UPDYCM"], { since: "19 March 2017" }),
  keep("lucknow", "cmntdqt2l000alnxnzvpup31k", "Anandiben Patel", ["UPGOV", "W_GOVS"], { since: "29 July 2019" }),
  add("lucknow", { name: "Keshav Prasad Maurya", role: "Deputy Chief Minister of Uttar Pradesh", tier: 2, party: "BJP", constituency: null, since: "19 March 2017" },
    ["W_UPCOM", "DNA_UPDYCM"], "Deputy Chief Minister; missing."),
  add("lucknow", { name: "Brajesh Pathak", role: "Deputy Chief Minister of Uttar Pradesh", tier: 2, party: "BJP", constituency: null, since: "25 March 2022" },
    ["W_UPCOM", "DNA_UPDYCM"], "Deputy Chief Minister (also MLA, Lucknow Cantt); missing."),
  deact("lucknow", "cmntdqt2l000dlnxnmvby3l77", "Amarendra Singh Sengar, IPS", "Amarendra Kumar Sengar was promoted to DG (Intelligence); Tarun Gauba is Lucknow CP since 29 July 2026.", ["W_LKOPOLICE", "IB_GAUBA"]),
  add("lucknow", officer("Tarun Gauba", "Commissioner of Police, Lucknow", "29 July 2026"), ["W_LKOPOLICE", "IB_GAUBA"], "New Police Commissioner."),
  keep("lucknow", "cmntdqt2l000clnxnxfiqdwtl", "Vishak G Iyer", ["LKO_NIC_DM", "LKOWANTS_DM"], { since: "January 2026" }),
  keep("lucknow", "cmntdqt2l0007lnxnc2x9pl6b", "Yogesh Shukla", ["W_UP18", "IV_UP22"]),
  fix("lucknow", "cmntdqt2l0005lnxnr6lbn19z", "Brijesh Pathak", { name: "Brajesh Pathak" }, "Name misspelt.", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0004lnxnzxpulvx3", "Ravidas Mehrotra", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0002lnxn8g55491f", "Dr. Neeraj Bora", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0001lnxn0zj7d2k0", "Armaan Khan", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0009lnxno8u96kn0", "Jai Devi", ["W_UP18", "IV_UP22"]),
  fix("lucknow", "cmntdqt2l0006lnxnjv05ex6y", "Amaresh Kumar", { name: "Amresh Kumar" }, "Name misspelt.", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0008lnxnh4ajqsbm", "Rajeshwar Singh", ["W_UP18", "IV_UP22"]),
  keep("lucknow", "cmntdqt2l0000lnxncpp6kboa", "Rajnath Singh", ["IV_LS_UP", "ETV_RAJNATH"]),
  add("lucknow", mp("Mohanlalganj", "R. K. Chaudhary", "SP", "2024"), ["IV_LS_UP", "QUINT_MLG"], "MP for Mohanlalganj (part of Lucknow district); missing."),

  // ════════ HYDERABAD (Telangana) ════════
  president("hyderabad", "cmnziua7m000easxni2hescuj"),
  pm("hyderabad", "cmnziua4j000dasxnkaxedqnn"),
  deact("hyderabad", "cmnrsybot000gyaxnxiigurbe", "Jishnu Dev Varma", "Moved to Maharashtra in March 2026; Telangana's Governor is Shiv Pratap Shukla.", MH_GOV_SRC),
  add("hyderabad", { name: "Shiv Pratap Shukla", role: "Governor of Telangana", tier: 2, party: null, constituency: null, since: "March 2026" }, ["W_GOVS", "QUINT_GOVS"], "New Governor."),
  fix("hyderabad", "cmnrsybot000hyaxnoeihjhbl", "A. Revanth Reddy", { active: true, since: "7 December 2023" }, "Chief Minister row was switched off by mistake; Revanth Reddy is CM.", ["W_CMS", "TT_BHATTI"]),
  add("hyderabad", { name: "Mallu Bhatti Vikramarka", role: "Deputy Chief Minister of Telangana", tier: 2, party: "INC", constituency: null, since: "7 December 2023" },
    ["W_BHATTI", "TT_BHATTI"], "Deputy Chief Minister; missing."),
  keep("hyderabad", "cmnrsybot000jyaxnbtvtbnu1", "V.C. Sajjanar, IPS", ["TT_SAJJANAR", "ANI_SAJJANAR26"], { since: "September 2025" }),
  deact("hyderabad", "cmnrsybot000iyaxnac4wk84m", "Dasari Harichandana, IAS", "Replaced as Collector by Priyanka Ala on 27 April 2026.", ["DC_PRIYANKA", "APAC_PRIYANKA"]),
  add("hyderabad", officer("Dr. Priyanka Ala", "Collector & District Magistrate, Hyderabad", "April 2026"), ["HYD_GOV", "DC_PRIYANKA"], "Collector since April 2026."),
  // MLAs — the 15 constituencies of Hyderabad district.
  deact("hyderabad", "cmnrsybot0005yaxnd7v7vqim", "R. Prakash Reddy", "Amberpet's 2023 winner is Kaleru Venkatesh (BRS).", ["W_TG3", "IV_TG23"]),
  add("hyderabad", mla("Amberpet", "Kaleru Venkatesh", "BRS", "2023"), ["W_TG3", "IV_TG23"], "Amberpet MLA."),
  keep("hyderabad", "cmnrsybot000ayaxn09iavo1x", "Mohd. Mubeen", ["W_TG3", "IV_TG23"]),
  keep("hyderabad", "cmnrsybot0003yaxn7j4jphg7", "Akbaruddin Owaisi", ["W_TG3", "IV_TG23"]),
  deact("hyderabad", "cmnrsybot0001yaxnu101iolk", "Mumtaz Ahmed Khan", "Charminar's 2023 winner is Mir Zulfeqar Ali (AIMIM).", ["W_TG3", "SIASAT_CHARMINAR"]),
  add("hyderabad", mla("Charminar", "Mir Zulfeqar Ali", "AIMIM", "2023"), ["W_TG3", "SIASAT_CHARMINAR"], "Charminar MLA."),
  fix("hyderabad", "cmnrsybot0009yaxnzi8o2hm0", "T. Raja Singh Lodh", { party: "IND" }, "Left the BJP (resignation accepted 11 July 2025).", ["DH_RAJA", "ITV_RAJA"]),
  deact("hyderabad", "cmnrsybot000dyaxntxk2hdx6", "Maganti Gopinath", "Died 8 June 2025; V. Naveen Yadav (INC) won the Nov 2025 by-election.", ["W_NAVEEN", "FED_NAVEEN"]),
  add("hyderabad", mla("Jubilee Hills", "V. Naveen Yadav", "INC", "2025 (by-election)"), ["W_NAVEEN", "FED_NAVEEN"], "Jubilee Hills MLA."),
  keep("hyderabad", "cmnrsybot0008yaxn7k0uef7n", "Kausar Mohiuddin", ["W_TG3", "IV_TG23"]),
  deact("hyderabad", "cmnrsybot000cyaxnamupdpwi", "Danam Nagender", "Disqualified (High Court 18 Sep 2026, upheld by Supreme Court 24 Sep 2026); seat vacant.", ["ITV_DANAM", "SIASAT_DANAM"]),
  keep("hyderabad", "cmnrsybot0004yaxndcjz3meq", "Ahmed bin Abdullah Balala", ["W_TG3", "NEWSMETER_AIMIM"]),
  deact("hyderabad", "cmnrsybot0006yaxn4vl6qsxz", "M. Padma Devender Reddy", "Musheerabad's 2023 winner is Muta Gopal (BRS).", ["W_TG3", "IV_TG23"]),
  add("hyderabad", mla("Musheerabad", "Muta Gopal", "BRS", "2023"), ["W_TG3", "IV_TG23"], "Musheerabad MLA."),
  deact("hyderabad", "cmnrsybot0007yaxnwt46qnbf", "Feroz Khan", "Nampally's 2023 winner is Mohammad Majid Hussain (AIMIM).", ["W_TG3", "IV_TG23"]),
  add("hyderabad", mla("Nampally", "Mohammad Majid Hussain", "AIMIM", "2023"), ["W_TG3", "IV_TG23"], "Nampally MLA."),
  deact("hyderabad", "cmnrsybot000fyaxndqexan1q", "T. Prakash Goud", "Rajendranagar is in Ranga Reddy district, not Hyderabad district.", ["W_RAJENDRANAGAR", "HYD_GOV_AC"]),
  deact("hyderabad", "cmnrsybot000eyaxn0t5k5ozn", "Arikepudi Gandhi", "He is MLA for Serilingampally; Sanathnagar is Talasani Srinivas Yadav (BRS).", ["W_TG3", "OI_SANATH"]),
  add("hyderabad", mla("Sanathnagar", "Talasani Srinivas Yadav", "BRS", "2023"), ["W_TG3", "OI_SANATH"], "Sanathnagar MLA."),
  fix("hyderabad", "cmnrsybot000byaxn4j9hw1p7", "T. Padma Rao Goud", { party: "BRS" }, "Party is BRS, not INC.", ["W_TG3", "TNM_PADMARAO"]),
  deact("hyderabad", "cmnrsybot0002yaxnyfneakuc", "Mohammed Mushtaq Malik", "Yakutpura's 2023 winner is Jaffar Hussain (AIMIM).", ["W_TG3", "IV_TG23"]),
  add("hyderabad", mla("Yakutpura", "Jaffar Hussain", "AIMIM", "2023"), ["W_TG3", "IV_TG23"], "Yakutpura MLA."),
  add("hyderabad", mla("Secunderabad Cantonment", "Sri Ganesh", "INC", "2024 (by-election)"), ["TT_SRIGANESH", "W_SRIGANESH"], "Missing MLA."),
  keep("hyderabad", "cmnrsybot0000yaxn0lyp1sv9", "Asaduddin Owaisi", ["IV_LS_HYD", "ITV_OWAISI"]),
  add("hyderabad", mp("Secunderabad", "G. Kishan Reddy", "BJP", "2019", "Member of Parliament (Lok Sabha) — Union Minister of Coal and Mines"),
    ["IV_LS_SEC", "COAL_KISHAN"], "MP for Secunderabad, which covers 8 of Hyderabad district's 15 seats; missing."),

  // ════════ CHENNAI (Tamil Nadu) ════════
  president("chennai", "cmnziu942000casxnv8arw8kb"),
  pm("chennai", "cmnziu912000basxnl1p7b9eu"),
  fix("chennai", "cmnfm3r0g000g51xneh54wwaa", "Rajendra Vishwanath Arlekar",
    { role: "Governor of Tamil Nadu (additional charge)", since: "March 2026" }, "Correct; he holds Tamil Nadu as additional charge (Governor of Kerala).", ["QUINT_GOVS", "NTN_TNGOV"]),
  add("chennai", { name: "C. Joseph Vijay", role: "Chief Minister of Tamil Nadu", tier: 2, party: "TVK", constituency: null, since: "10 May 2026" },
    ["W_VIJAYMIN", "TNM_AMALRAJ"], "Chief Minister since 10 May 2026; missing."),
  placeholder("chennai", "cmnfm3r0g000i51xnlw5q6ktg", "[Name Not Available]"),
  placeholder("chennai", "cmnfm3r0g000e51xn24snbzcz", "GCC Commissioner", "Role-as-name placeholder."),
  placeholder("chennai", "cmnfm3r0g000n51xnylcnbdyz", "[Name Not Available]"),
  add("chennai", officer("S. Malathi Helen", "District Collector, Chennai", "May 2026"), ["CHENNAI_NIC_COLL", "DTNEXT_COLL"], "Collector; missing."),
  add("chennai", officer("A. Amalraj", "Commissioner of Police, Greater Chennai", "May 2026"), ["TNM_AMALRAJ", "PRINT_AMALRAJ26"], "Police Commissioner; missing."),
  // MLAs — the 16 constituencies of Chennai district (April 2026 election).
  deact("chennai", "cmnfm3r0g000c51xnsw2h31j4", "Pongalur N. Palanisamy", "Anna Nagar's 2026 winner is V. K. Ramkumar (TVK).", ["W_TN17", "TNER_CHENNAI"]),
  keep("chennai", "cmnfm3r0g000451xnyuw2r4xx", "Udhayanidhi Stalin", ["W_TN17", "TNER_CHENNAI"],
    { role: "MLA, Chepauk-Thiruvallikeni", constituency: "Chepauk-Thiruvallikeni" }, "Re-elected 2026."),
  keep("chennai", "cmnfm3r0g000651xndp6xqdlr", "P.K. Sekar Babu", ["W_TN17", "TNER_CHENNAI"], {}, "Re-elected 2026."),
  deact("chennai", "cmnfm3r0g000351xn2efco7fw", "M.K. Stalin", "Lost Kolathur in 2026 to V. S. Babu (TVK).", ["TNER_CHENNAI", "BW_KOLATHUR"]),
  deact("chennai", "cmnfm3r0g000751xnw0emddcn", "J. Anbazhagan", "Purasawalkam is not one of Chennai's 16 constituencies.", ["W_TN17", "TNER_CHENNAI"]),
  deact("chennai", "cmnfm3r0g000551xnl474gnvj", "Ma. Subramanian", "Saidapet's 2026 winner is M. Arul Prakasam (TVK).", ["W_TN17", "TNER_CHENNAI"]),
  deact("chennai", "cmnfm3r0g000851xnhf6h1sdi", "N. Ezhilan", "Thousand Lights' 2026 winner is J. C. D. Prabhakar (TVK).", ["W_TN17", "TNER_CHENNAI"]),
  deact("chennai", "cmnfm3r0g000951xnwsd8uq1k", "K.N. Nehru", "Tiruchirappalli West is not in Chennai.", ["W_TN17", "TNER_CHENNAI"]),
  deact("chennai", "cmnfm3r0g000a51xnl5yb6j41", "R. Rajendran", "Villivakkam's 2026 winner is Aadhav Arjuna (TVK).", ["W_TN17", "TNER_CHENNAI"]),
  deact("chennai", "cmnfm3r0g000b51xn4vwqn10u", "S. Kamala Kannan", "Virugambakkam's 2026 winner is R. Sabarinathan (TVK).", ["W_TN17", "TNER_CHENNAI"]),
  ...([
    ["Dr. Radhakrishnan Nagar", "N. Marie Wilson"],
    ["Perambur", "C. Joseph Vijay"],
    ["Kolathur", "V. S. Babu"],
    ["Villivakkam", "Aadhav Arjuna"],
    ["Thiru-Vi-Ka-Nagar (SC)", "M. R. Pallavi"],
    ["Egmore (SC)", "A. Rajmohan"],
    ["Royapuram", "K. V. Vijay Damu"],
    ["Thousand Lights", "J. C. D. Prabhakar"],
    ["Anna Nagar", "V. K. Ramkumar"],
    ["Virugambakkam", "R. Sabarinathan"],
    ["Saidapet", "M. Arul Prakasam"],
    ["Thiyagarayanagar", "N. Anand"],
    ["Mylapore", "P. Venkataramanan"],
    ["Velachery", "R. Kumar"],
  ] as const).map(([seat, name]) => add("chennai", mla(seat, name, "TVK", "2026"), ["W_TN17", "TNER_CHENNAI"], "2026 winner.")),
  keep("chennai", "cmnfm3r0g000151xnmmy3ross", "Thamizhachi Thangapandian", ["IV_LS_CHS", "W_CHS"], { role: "Member of Parliament (Lok Sabha)" }),
  keep("chennai", "cmnfm3r0g000051xn8p3gdj1h", "Kalanidhi Veeraswamy", ["IV_LS_CHN", "W_KALANIDHI"], { role: "Member of Parliament (Lok Sabha)" }),
  keep("chennai", "cmnfm3r0g000251xnidix71gm", "Dayanidhi Maran", ["IV_LS_CHC", "DH_DAYANIDHI"], { role: "Member of Parliament (Lok Sabha)" }),
  keep("chennai", "cmnfm3r0g000d51xnb5t633u2", "R. Priya", ["W_PRIYA", "DTNEXT_PRIYA"], { since: "March 2022" }),
  placeholder("chennai", "cmnfm3r0g000r51xnu15ci0h4", "Chennai Port Authority Chairman", "Role-as-name placeholder."),
  placeholder("chennai", "cmnfm3r0g000z51xnz06902yw", "[Name Not Available]"),
  placeholder("chennai", "cmnfm3r0g000p51xnx8dah06m", "[Name Not Available]"),
  placeholder("chennai", "cmnfm3r0g000v51xn7z72ssov", "[Name Not Available]"),

  // ════════ KOLKATA (West Bengal) ════════
  president("kolkata", "cmnziub3h000iasxnhup2zuf2"),
  pm("kolkata", "cmnziuaxo000hasxn78mbzdin"),
  deact("kolkata", "cmnfm3na6000g4exnzgj88dvt", "C.V. Ananda Bose", "Replaced by R. N. Ravi in March 2026.", ["W_GOVS", "QUINT_GOVS"]),
  add("kolkata", { name: "R. N. Ravi", role: "Governor of West Bengal", tier: 2, party: null, constituency: null, since: "March 2026" }, ["W_GOVS", "QUINT_GOVS"], "New Governor."),
  deact("kolkata", "cmnfm3na6000h4exnao0ga74n", "Mamata Banerjee", "BJP won the 2026 election; Suvendu Adhikari is CM since 9 May 2026.", ["W_SUVMIN", "SG_SUV"]),
  add("kolkata", { name: "Suvendu Adhikari", role: "Chief Minister of West Bengal", tier: 2, party: "BJP", constituency: null, since: "9 May 2026" },
    ["W_SUVMIN", "SG_SUV"], "Chief Minister."),
  deact("kolkata", "cmnfm3na6000i4exn6gc01bkl", "B.P. Gopalika", "No longer Chief Secretary (replaced in March 2026, and again in May 2026).", ["DH_WBCS", "PRINT_WBCS"]),
  deact("kolkata", "cmnfm3na6000j4exn4g5yc2n8", "Vineet Goyal", "Left in Sept 2024; Ajay Kumar Nand is CP since 17 March 2026.", ["W_KOLCP", "DD_VERMA"]),
  add("kolkata", officer("Ajay Kumar Nand", "Commissioner of Police, Kolkata", "March 2026"), ["W_KOLCP", "STATESMAN_NAND"], "Police Commissioner."),
  placeholder("kolkata", "cmnfm3na6000p4exnw19epli7", "[Name Not Available]"),
  // MLAs — the 11 constituencies of Kolkata district (April 2026 election).
  deact("kolkata", "cmnfm3na600054exn1qk6q3cq", "Babul Supriyo", "Ballygunge's 2026 winner is Sovandeb Chattopadhyay (TMC).", ["W_WB18", "OI_WB26"]),
  deact("kolkata", "cmnfm3na600084exn3lnp8kej", "Paresh Pal", "Beleghata's 2026 winner is Kunal Ghosh (TMC).", ["W_WB18", "OI_WB26"]),
  deact("kolkata", "cmnfm3na600024exnyp1olx2k", "Mamata Banerjee", "Lost Bhabanipur in 2026 to Suvendu Adhikari (BJP).", ["W_WB18", "OI_WB26"]),
  keep("kolkata", "cmnfm3na600064exnt6mdpebn", "Nayna Bandyopadhyay", ["W_WB18", "OI_WB26"],
    { role: "MLA, Chowrangee", constituency: "Chowrangee" }, "Re-elected 2026."),
  deact("kolkata", "cmnfm3na6000b4exnp5ohk2g2", "Bratya Basu", "Dum Dum is in North 24 Parganas, not Kolkata (and he lost it in 2026).", ["W_DUMDUM", "OI_WB26"]),
  deact("kolkata", "cmnfm3na600074exnxz72kim3", "Swarna Kamal Saha", "Entally's 2026 winner is Sandipan Saha (TMC).", ["W_WB18", "OI_WB26"]),
  deact("kolkata", "cmnfm3na600094exnsv0tq2vm", "Vivek Gupta", "Jorasanko's 2026 winner is Vijay Ojha (BJP).", ["W_WB18", "OI_WB26"]),
  deact("kolkata", "cmnfm3na6000c4exn6lwd2r8p", "Atin Ghosh", "Kashipur-Belgachhia's 2026 winner is Ritesh Tiwari (BJP).", ["W_WB18", "OI_WB26"]),
  keep("kolkata", "cmnfm3na600034exn0e7xanrc", "Firhad Hakim", ["W_WB18", "OI_WB26"], {}, "Re-elected 2026."),
  deact("kolkata", "cmnfm3na600044exnjevozgc5", "Debasish Kumar", "Rashbehari's 2026 winner is Swapan Dasgupta (BJP).", ["W_WB18", "OI_WB26"]),
  deact("kolkata", "cmnfm3na6000a4exnoayp1ouu", "Swatilekha Sen", "Shyampukur's 2026 winner is Purnima Chakraborty (BJP).", ["W_WB18", "OI_WB26"]),
  ...([
    ["Bhabanipur", "Suvendu Adhikari", "BJP"],
    ["Rashbehari", "Swapan Dasgupta", "BJP"],
    ["Ballygunge", "Sovandeb Chattopadhyay", "TMC"],
    ["Entally", "Sandipan Saha", "TMC"],
    ["Beleghata", "Kunal Ghosh", "TMC"],
    ["Jorasanko", "Vijay Ojha", "BJP"],
    ["Shyampukur", "Purnima Chakraborty", "BJP"],
    ["Maniktala", "Tapas Roy", "BJP"],
    ["Kashipur-Belgachhia", "Ritesh Tiwari", "BJP"],
  ] as const).map(([seat, name, party]) => add("kolkata", mla(seat, name, party, "2026"), ["W_WB18", "OI_WB26"], "2026 winner.")),
  keep("kolkata", "cmnfm3na600014exnocth9lyu", "Mala Roy", ["IV_LS_KD", "W_KOLDAK"], { role: "Member of Parliament (Lok Sabha)" }),
  keep("kolkata", "cmnfm3na600004exnsob5nz72", "Sudip Bandyopadhyay", ["IV_LS_KU", "W_SUDIP"], { role: "Member of Parliament (Lok Sabha)" }),
  deact("kolkata", "cmnfm3na6000d4exnnglmcequ", "Firhad Hakim", "Resigned as Mayor on 5 June 2026; post vacant until the KMC election.", ["W_FIRHAD", "ITV_FIRHAD"]),
  deact("kolkata", "cmnfm3na6000q4exnmoilu7qj", "Justice T.S. Sivagnanam", "Retired 15 Sep 2025; Chief Justice is R. V. Ghuge since 9 Sep 2026.", ["SCC_SIVAGNANAM", "W_CALHC"]),
  add("kolkata", officer("Justice Ravindra Vithalrao Ghuge", "Chief Justice, Calcutta High Court", "9 September 2026", 5), ["ETV_GHUGE", "W_CALHC"], "New Chief Justice."),
  placeholder("kolkata", "cmnfm3na6000t4exnbd49rw8d", "Kolkata Port Authority Chairman", "Role-as-name placeholder."),
  placeholder("kolkata", "cmnfm3na6000z4exnxztlaved", "[Name Not Available]"),
  placeholder("kolkata", "cmnfm3na6000y4exnnxc41t5d", "Chief Medical Officer of Health", "Role-as-name placeholder."),

  // ════════ NEW DELHI (Delhi) ════════
  president("new-delhi", "cmnziuc57000jasxnwntlzdf3"),
  addPm("new-delhi"),
  deact("new-delhi", "cmnf0n4vn00041dxnrlmof7w3", "V.K. Saxena", "Replaced by Taranjit Singh Sandhu on 11 March 2026 (moved to Ladakh).", ["W_SANDHU", "QUINT_GOVS"]),
  add("new-delhi", { name: "Taranjit Singh Sandhu", role: "Lieutenant Governor of Delhi", tier: 2, party: null, constituency: null, since: "11 March 2026" },
    ["W_SANDHU", "QUINT_GOVS"], "New Lieutenant Governor."),
  keep("new-delhi", "cmnf0n4vn00051dxnjoat1nba", "Rekha Gupta", ["W_CMS", "SNX_REKHA"], { since: "20 February 2025" }),
  placeholder("new-delhi", "cmnf0n4vn00061dxnsje6l751", "[Name Not Available]"),
  placeholder("new-delhi", "cmnf0n4vn000a1dxn3tw082br", "[Name Not Available]"),
  deact("new-delhi", "cmnf0n4vn00011dxnh5f7yp96", "Arvind Kejriwal", "Lost New Delhi in Feb 2025 to Parvesh Verma (BJP).", ["BS_NDLS", "W_DL8"]),
  add("new-delhi", mla("New Delhi", "Parvesh Sahib Singh Verma", "BJP", "2025"), ["BS_NDLS", "W_DL8"], "New Delhi MLA."),
  deact("new-delhi", "cmnf0n4vn00021dxnvvu3dy2z", "Alka Lamba", "Kasturba Nagar's 2025 winner is Neeraj Basoya (BJP).", ["ZEE_KASTURBA", "W_KASTURBA"]),
  add("new-delhi", mla("Kasturba Nagar", "Neeraj Basoya", "BJP", "2025"), ["ZEE_KASTURBA", "W_KASTURBA"], "Kasturba Nagar MLA."),
  keep("new-delhi", "cmnf0n4vn00001dxnceqpxgxh", "Bansuri Swaraj", ["W_18LS", "PRS_BANSURI"]),
  placeholder("new-delhi", "cmnf0n4vn00081dxnnocf2h7s", "[Name Not Available]"),
  placeholder("new-delhi", "cmnf0n4vn000l1dxnns72ptjz", "[Name Not Available]"),
  placeholder("new-delhi", "cmnf0n4vn000c1dxna9ons7c1", "District & Sessions Judge, Patiala House", "Role-as-name placeholder."),
  placeholder("new-delhi", "cmnf0n4vn000e1dxn2cgm2e6g", "[Name Not Available]"),
  placeholder("new-delhi", "cmnf0n4vn000j1dxnimbfmm1j", "[Name Not Available]"),
  placeholder("new-delhi", "cmnf0n4vn000k1dxnaeie5not", "District Food Controller, New Delhi", "Role-as-name placeholder."),
];

// ── Pure helpers (tested in tests/fix-leaders-2026-09.test.ts) ─────────────

/** Compare names loosely: case, dots, spaces, titles and service suffixes ignored. */
export function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .toLowerCase()
    .replace(/\((?:[^)]*)\)/g, " ")
    .replace(/,\s*(ias|ips)\b/g, " ")
    .replace(/\b(dr|shri|smt|sri|justice|adv)\b\.?/g, " ")
    .replace(/[^\p{L}]/gu, "");
}

/** The `source` value stored on a verified row. Never starts with "http"
 *  (rows whose source is a URL are treated as news-derived and hidden). */
export function dbSourceString(keys: SourceKey[]): string {
  const outlets = [...new Set(keys.map((k) => SOURCES[k].outlet))];
  return `manual-research 2026-09 · ${outlets.join("; ")}`;
}

/** Plan-level sanity checks. Returns a list of problems (empty = fine). */
export function validatePlan(plan: Op[]): string[] {
  const problems: string[] = [];
  const seenIds = new Map<string, string>();
  const addKeys = new Set<string>();
  for (const op of plan) {
    const where = `${op.slug} ${op.kind} ${"id" in op ? op.id : op.row.name}`;
    if (op.kind !== "add") {
      if (seenIds.has(op.id)) problems.push(`${where}: row id used twice (also ${seenIds.get(op.id)})`);
      seenIds.set(op.id, where);
    }
    const needsSources = op.kind === "add" || (op.kind === "update" && op.verify) || (op.kind === "deactivate" && !op.placeholder);
    if (needsSources && new Set(op.sources.map((k) => SOURCES[k]?.outlet ?? k)).size < 2) {
      problems.push(`${where}: needs two sources from different outlets`);
    }
    if (op.kind === "update" && !op.verify && op.sources.length > 0) problems.push(`${where}: level-only fix should not claim sources`);
    for (const k of op.sources) if (!(k in SOURCES)) problems.push(`${where}: unknown source ${k}`);
    if (op.kind === "add") {
      const r = op.row;
      if (r.tier < 1 || r.tier > 5) problems.push(`${where}: tier ${r.tier} out of range`);
      if (!r.name.trim() || r.name.trim().startsWith("[")) problems.push(`${where}: add needs a real name`);
      if (r.tier === 4 && !r.constituency) problems.push(`${where}: MP/MLA add needs a constituency`);
      const key = `${op.slug}|${normalizeName(r.name)}|${r.tier === 4 ? normalizeName(r.constituency) : `t${r.tier}`}`;
      if (addKeys.has(key)) problems.push(`${where}: duplicate add`);
      addKeys.add(key);
    }
    if (op.kind === "update" && op.set.tier !== undefined && (op.set.tier < 1 || op.set.tier > 5)) {
      problems.push(`${where}: tier ${op.set.tier} out of range`);
    }
  }
  for (const [, s] of Object.entries(SOURCES)) {
    if (!/^https:\/\//.test(s.url)) problems.push(`source url not https: ${s.url}`);
  }
  return problems;
}

// ── Planner (pure: DB rows in, writes out) ─────────────────────────────────

export type LeaderRow = {
  id: string; districtId: string; name: string; role: string; roleLocal: string | null; tier: number;
  party: string | null; constituency: string | null; since: string | null; source: string | null;
  active: boolean; lastVerifiedAt: Date | null; roleDescription: string | null;
};
export type DistrictRef = { id: string; slug: string; name: string };
export type Write =
  | { op: Op; action: "create"; districtId: string; data: Record<string, unknown> }
  | { op: Op; action: "update"; districtId: string; id: string; before: Record<string, unknown>; data: Record<string, unknown> };

const FIELDS: (keyof RowFields)[] = ["name", "role", "tier", "party", "constituency", "since"];

function diff(row: LeaderRow, data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    const cur = (row as unknown as Record<string, unknown>)[k];
    const same = cur instanceof Date && v instanceof Date ? cur.getTime() === v.getTime() : cur === v;
    if (!same) out[k] = v;
  }
  return out;
}

function pick(row: LeaderRow, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = (row as unknown as Record<string, unknown>)[k];
  return out;
}

/**
 * Turn the plan into concrete writes against the current rows. Pure: the
 * caller loads `districts` and `rows` (all Leader rows of those districts,
 * active and inactive) and applies the result.
 */
export function computeWrites(plan: Op[], districts: DistrictRef[], rows: LeaderRow[]) {
  const bySlug = new Map(districts.map((d) => [d.slug, d]));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const deactivateIds = new Set(plan.filter((o): o is DeactivateOp => o.kind === "deactivate").map((o) => o.id));
  const writes: Write[] = [];
  const warnings: string[] = [];
  let unchanged = 0;
  const verifiedFields = (sources: SourceKey[]) => ({ source: dbSourceString(sources), lastVerifiedAt: VERIFIED_AT });

  for (const op of plan) {
    const d = bySlug.get(op.slug);
    if (!d) { warnings.push(`${op.slug}: district not found — skipped`); continue; }
    if (op.kind === "deactivate" || op.kind === "update") {
      const row = byId.get(op.id);
      if (!row) { warnings.push(`${op.slug}: row ${op.id} (${op.expectName}) not found — skipped`); continue; }
      const newName = op.kind === "update" ? op.set.name : undefined;
      const nameOk = normalizeName(row.name) === normalizeName(op.expectName) ||
        (newName !== undefined && normalizeName(row.name) === normalizeName(newName)); // a re-run after a name fix
      if (row.districtId !== d.id || !nameOk) {
        warnings.push(`${op.slug}: row ${op.id} is "${row.name}", expected "${op.expectName}" — skipped`);
        continue;
      }
      if (op.kind === "deactivate") {
        if (!row.active) { unchanged++; continue; }
        writes.push({ op, action: "update", districtId: d.id, id: row.id, before: { active: true }, data: { active: false } });
        continue;
      }
      const data: Record<string, unknown> = { ...op.set };
      if (op.verify) Object.assign(data, verifiedFields(op.sources));
      if (op.set.role !== undefined && op.set.role !== row.role) {
        data.roleLocal = null;
        data.roleDescription = getRoleDescription(op.set.role);
      }
      const changed = diff(row, data);
      if (Object.keys(changed).length === 0) { unchanged++; continue; }
      writes.push({ op, action: "update", districtId: d.id, id: row.id, before: pick(row, Object.keys(changed)), data: changed });
      continue;
    }
    // add: reuse a curated row for the same person (never a news-derived one)
    const r = op.row;
    const match = rows.find((x) =>
      x.districtId === d.id &&
      !(x.source ?? "").startsWith("http") &&
      normalizeName(x.name) === normalizeName(r.name) &&
      (r.tier === 4 ? x.tier === 4 && normalizeName(x.constituency) === normalizeName(r.constituency) : x.tier === r.tier));
    const full: Record<string, unknown> = { ...r, ...verifiedFields(op.sources), active: true, roleDescription: getRoleDescription(r.role) };
    if (match) {
      if (deactivateIds.has(match.id)) throw new Error(`${op.slug}: add "${r.name}" matches row ${match.id} that the plan deactivates`);
      if (match.role !== r.role) full.roleLocal = null;
      const changed = diff(match, full);
      if (Object.keys(changed).length === 0) { unchanged++; continue; }
      writes.push({ op, action: "update", districtId: d.id, id: match.id, before: pick(match, Object.keys(changed)), data: changed });
    } else {
      writes.push({ op, action: "create", districtId: d.id, data: { districtId: d.id, ...full } });
    }
  }
  return { writes, warnings, unchanged };
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

/** Human-readable plan, one line per write, grouped by district. */
export function formatWrites(writes: Write[], districts: DistrictRef[], rows: LeaderRow[]): string[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lines: string[] = [];
  for (const d of districts) {
    const ws = writes.filter((w) => w.districtId === d.id);
    lines.push(`══ ${d.name} (${d.slug}) — ${ws.length} change(s)`);
    for (const w of ws) {
      if (w.action === "create") {
        const r = w.data as unknown as RowFields;
        lines.push(`  + ADD        T${r.tier} ${r.name} | ${r.role}${r.party ? ` | ${r.party}` : ""}${r.since ? ` | since ${r.since}` : ""}`);
        continue;
      }
      const row = byId.get(w.id)!;
      if (w.data.active === false) {
        lines.push(`  - DEACTIVATE T${row.tier} ${row.name} | ${row.role}  (${w.op.reason})`);
        continue;
      }
      const parts = Object.keys(w.data)
        .filter((k) => FIELDS.includes(k as keyof RowFields) || k === "active")
        .map((k) => `${k}: ${show(w.before[k])} → ${show(w.data[k])}`);
      lines.push(`  ~ UPDATE     T${row.tier} ${row.name} | ${parts.length ? parts.join("; ") : "re-verified (source, lastVerifiedAt)"}`);
    }
  }
  return lines;
}

// ── Runner (DB) ────────────────────────────────────────────────────────────

async function main() {
  await import("./_env");
  const { PrismaClient } = await import("../src/generated/prisma");
  const { PrismaPg } = await import("@prisma/adapter-pg");

  const CONFIRM = process.argv.includes("--confirm");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean)) : null;

  const problems = validatePlan(PLAN);
  if (problems.length) {
    console.error("Plan problems — nothing done:\n  " + problems.join("\n  "));
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    const plan = only ? PLAN.filter((op) => only.has(op.slug)) : PLAN;
    const slugs = [...new Set(plan.map((op) => op.slug))];
    const found = await prisma.district.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true, name: true } });
    const missing = slugs.filter((s) => !found.some((d) => d.slug === s));
    if (missing.length) throw new Error(`District(s) not found: ${missing.join(", ")}`);
    const districts = slugs.map((s) => found.find((d) => d.slug === s)!);

    const rows = (await prisma.leader.findMany({
      where: { districtId: { in: districts.map((d) => d.id) } },
      select: {
        id: true, districtId: true, name: true, role: true, roleLocal: true, tier: true, party: true,
        constituency: true, since: true, source: true, active: true, lastVerifiedAt: true, roleDescription: true,
      },
    })) as LeaderRow[];

    const { writes, warnings, unchanged } = computeWrites(plan, districts, rows);

    console.log(`Leaders fix, Sept 2026 — ${CONFIRM ? "APPLYING" : "DRY RUN"}${only ? ` (only: ${[...only].join(", ")})` : ""}\n`);
    for (const line of formatWrites(writes, districts, rows)) console.log(line);
    const count = (pred: (w: Write) => boolean) => writes.filter(pred).length;
    console.log(`\nTotal: ${count((w) => w.action === "create")} add · ${count((w) => w.action === "update" && w.data.active === false)} deactivate · ` +
      `${count((w) => w.action === "update" && w.data.active !== false)} update · ${unchanged} already done`);
    if (warnings.length) console.log(`\nWarnings (${warnings.length}):\n  ` + warnings.join("\n  "));

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    if (writes.length === 0) { console.log("\nNothing to write."); return; }

    const byId = new Map(rows.map((r) => [r.id, r]));
    const districtName = new Map(districts.map((d) => [d.id, d.name]));
    await prisma.$transaction(async (tx) => {
      for (const w of writes) {
        const sources = w.op.sources.map((k) => SOURCES[k].url);
        const common = {
          source: "api", actorLabel: "scripts/fix-leaders-2026-09", tableName: "Leader", districtId: w.districtId,
          districtName: districtName.get(w.districtId) ?? null, moduleName: "leadership", recordCount: 1, details: { sources },
        };
        if (w.action === "create") {
          const created = await tx.leader.create({ data: w.data as Parameters<typeof tx.leader.create>[0]["data"] });
          await tx.updateLog.create({
            data: { ...common, recordId: created.id, action: "create", description: `Add ${created.name} as ${created.role}: ${w.op.reason}`, newValue: JSON.stringify(w.data) },
          });
        } else {
          await tx.leader.update({ where: { id: w.id }, data: w.data });
          const row = byId.get(w.id)!;
          await tx.updateLog.create({
            data: {
              ...common, recordId: w.id, action: "update",
              description: `${w.data.active === false ? "Deactivate" : "Update"} ${row.name} (${row.role}): ${w.op.reason}`,
              oldValue: JSON.stringify(w.before), newValue: JSON.stringify(w.data),
            },
          });
        }
      }
    }, { timeout: 300_000, maxWait: 30_000 });
    console.log(`\nDone: ${writes.length} write(s) applied. Clear the Redis caches (admin → Cache) so pages show this at once.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && /fix-leaders-2026-09\.ts$/.test(process.argv[1])) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
