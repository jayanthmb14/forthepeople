/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Data fixes for the "people & services" findings of the September 2026
 * content audit (population, overview / compare, schools, health, exams,
 * famous people, transport, village councils, budget). Rule: verified or
 * hidden. A new value is written only when a named source backs it
 * (district NIC portals, census2011.co.in's reproduction of the Census
 * PCA, newsonair.gov.in, Wikipedia for biographies); a value that could
 * not be confirmed is hidden — the field set to null, the row set
 * active=false where the table has that flag, or the row deleted when the
 * whole row is unfounded. The code fixes that stop these values coming
 * back are in the same branch (src/lib/census-2011.ts, src/lib/data-filters.ts
 * "People & services" block, src/lib/health-score.ts …).
 *
 * DRY RUN by default: prints every change (table, id, field, current → new,
 * source) and exits. --confirm applies everything in ONE transaction.
 *
 *   npx tsx scripts/fix-audit-2026-09-people-services.ts            # dry run
 *   npx tsx scripts/fix-audit-2026-09-people-services.ts --confirm  # apply
 *
 * Rows are matched by id. A row already gone, or a field already holding
 * the new value, is skipped. If a field now holds neither the value seen on
 * the check date (`was`) nor the new one, that whole fix is skipped and
 * flagged "CHANGED SINCE CHECK" — look at it by hand. Deletes and the
 * transport hides run as one statement per table; the whole run rolls
 * back if any of them touches a different number of rows than planned.
 */
import "./_env";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRM = process.argv.includes("--confirm");
const CHECKED = "2026-09-28";

type Table =
  | "DemographicProfile"
  | "District"
  | "DepartmentStaffing"
  | "GovernmentExam"
  | "School"
  | "FamousPersonality"
  | "TrainSchedule"
  | "BusRoute"
  | "BudgetEntry";

type Value = string | number | boolean | null | Record<string, number>;

interface Fix {
  /** Audit finding index (people-services.json) this fix answers. */
  finding: number;
  table: Table;
  id: string;
  /** update = new verified values; hide = null / active=false (value not confirmable); delete = whole row unfounded. */
  op: "update" | "hide" | "delete";
  set?: Record<string, Value>;
  was?: Record<string, Value>;
  label: string;
  why: string;
  source: string;
}

/** DateTime columns: "YYYY-MM-DD" values are stored as IST midnight (as the seeds did). */
const DATE_FIELDS = new Set(["examDate", "resultDate"]);

// ─────────────────────────────────────────────────────────────────────
//  Sources
// ─────────────────────────────────────────────────────────────────────
const C2011 = (n: string) => `https://www.census2011.co.in/census/district/${n}.html (Census of India 2011 PCA)`;
const SRC = {
  mandya: C2011("262-mandya"),
  mysuru: C2011("263-mysore"),
  bengaluru: C2011("242-bangalore"),
  newDelhi: C2011("172-new-delhi"),
  kolkata: C2011("16-kolkata"),
  mysuruNic: "https://mysore.nic.in/en/about-district/ and https://mysore.nic.in/en/subdivision-blocks/",
  hyderabadGov: "https://hyderabad.telangana.gov.in/about-district/ (Census 2011: 39,43,323)",
  lucknowNic: "https://lucknow.nic.in/tehsil/ (five tehsils)",
  chennaiNic: "https://chennai.nic.in/revenue-administration/ (3 divisions, 16+ taluks)",
  history: "the district's checked PopulationHistory Census 2011 row (scripts/fix-records-2026-09/population.ts)",
};

// ─────────────────────────────────────────────────────────────────────
//  Long values (exact text on the check date, and the replacement)
// ─────────────────────────────────────────────────────────────────────
const PUTTARAJU_BIO_OLD = "Former MP from Mandya constituency who served in the 16th Lok Sabha (2014–19). Known for his grassroots connection with the Vokkaliga farming community and advocacy for the Cauvery river water rights.";
const PUTTARAJU_BIO_NEW = "Former MP from Mandya constituency who served in the 16th Lok Sabha (2014–18). Known for his grassroots connection with the Vokkaliga farming community and advocacy for the Cauvery river water rights.";
const VISHNUVARDHAN_BIO_OLD = "Iconic Kannada film actor known as 'Action King', celebrated for his action roles across 200+ films over four decades. Born in Mysuru, he became one of the most beloved stars in Kannada cinema history.";
const VISHNUVARDHAN_BIO_NEW = "Iconic Kannada film actor known as 'Sahasa Simha', who acted in 200+ films over four decades. Born in Mysuru, he became one of the most beloved stars in Kannada cinema history.";
const MANJUNATH_BIO_OLD = "Internationally acclaimed violinist and Carnatic musician from Mysore who has performed in over 40 countries. A disciple of M.S. Gopalakrishnan, he won the Padma Shri in 2016.";
const MANJUNATH_BIO_NEW = "Carnatic violinist from Mysore, the son and disciple of violinist Vidwan S. Mahadevappa. His honours include the Sangeet Natak Akademi Award and Karnataka's Rajyotsava Award.";

/** Every TrainSchedule row of the live districts except 22436 and 12050 (checked correct). */
const TRAIN_ROWS: Array<[string, string]> = [
  ["cmmvn6rdm0072muxn34aldk6h", "bengaluru-urban · 12028"],
  ["cmmvn6rdm0075muxncx0ofkeo", "bengaluru-urban · 12079"],
  ["cmmvn6rdm0073muxnrrn7jl95", "bengaluru-urban · 12614"],
  ["cmmvn6rdm0070muxncdo3joq1", "bengaluru-urban · 12627"],
  ["cmmvn6rdm0071muxni0hptkbz", "bengaluru-urban · 12627"],
  ["cmmvn6rdm0074muxnsqfbykgd", "bengaluru-urban · 56902"],
  ["cmnfm3tna004w51xnuzdpjnyx", "chennai · 12615"],
  ["cmnfm3tna004x51xnjnhd7czk", "chennai · 12621"],
  ["cmnfm3tna005051xn5pfcklwz", "chennai · 12637"],
  ["cmnfm3tna004z51xnmdtwodmx", "chennai · 12657"],
  ["cmnfm3tna005151xnohjorok6", "chennai · 12695"],
  ["cmnfm3tna004y51xnfgnjmjg7", "chennai · 12839"],
  ["cmnfm3tna004s51xnapq77uzq", "chennai · METRO-L1"],
  ["cmnfm3tna004t51xnxt5am3rk", "chennai · METRO-L2"],
  ["cmnfm3tna004u51xnc0r0adq4", "chennai · MRTS"],
  ["cmnfm3tna004v51xnd4f5rlsd", "chennai · SUBURBAN"],
  ["cmnrsyex3003gyaxn9wqutfns", "hyderabad · 12608"],
  ["cmnrsyex3003dyaxn24njx1jn", "hyderabad · 12702"],
  ["cmnrsyex3003cyaxn6l3nrntc", "hyderabad · 12723"],
  ["cmnrsyex3003eyaxncsp20xdg", "hyderabad · 12728"],
  ["cmnrsyex3003fyaxn6az27vmg", "hyderabad · 12760"],
  ["cmnrsyex3003hyaxn5v1xsh2o", "hyderabad · 12786"],
  ["cmnfm3pnn004l4exngw9uguxv", "kolkata · 12301"],
  ["cmnfm3pnn004o4exn2dcma2x2", "kolkata · 12345"],
  ["cmnfm3pnn004p4exn8xci1myt", "kolkata · 12381"],
  ["cmnfm3pnn004m4exnk5pb9jqq", "kolkata · 12839"],
  ["cmnfm3pnn004q4exnck2wrndk", "kolkata · 12841"],
  ["cmnfm3pnn004n4exn06ucx6ev", "kolkata · 12859"],
  ["cmnfm3pnn004k4exnxebdbdmh", "kolkata · HOWRAH-LOCAL"],
  ["cmnfm3pnn004i4exnof1hpx1j", "kolkata · METRO-EW"],
  ["cmnfm3pnn004h4exnvib7hmsa", "kolkata · METRO-L1"],
  ["cmnfm3pnn004j4exnl7exf55y", "kolkata · SEALDAH-LOCAL"],
  ["cmntdquy40031lnxnjxh370il", "lucknow · 12003"],
  ["cmntdquy50032lnxnhz2mdkwx", "lucknow · 12004"],
  ["cmntdquy50036lnxnpc2vfi57", "lucknow · 12035"],
  ["cmntdquy4002zlnxnzkydx7qx", "lucknow · 12229"],
  ["cmntdquy50035lnxnxxkrge91", "lucknow · 12237"],
  ["cmntdquy40030lnxn4itdyi46", "lucknow · 12533"],
  ["cmntdquy50034lnxn92rrjgs6", "lucknow · 14235"],
  ["cmntdquy50033lnxn5jb4fn66", "lucknow · 14853"],
  ["cmmv9negu005uubxnqitynrca", "mandya · 12613"],
  ["cmmv9negu005tubxn01to9nrb", "mandya · 12614"],
  ["cmmv9negu005rubxnylffvl4p", "mandya · 16571"],
  ["cmmv9negu005subxn431xnay4", "mandya · 16572"],
  ["cmnfm3huz005c3rxn037ujn2d", "mumbai · 11007"],
  ["cmnfm3huz005a3rxnu2dx607v", "mumbai · 12127"],
  ["cmnfm3huz005d3rxnvkeiww4q", "mumbai · 12133"],
  ["cmnfm3huz005e3rxnujzm5y9b", "mumbai · 12809"],
  ["cmnfm3huz005b3rxngmqaf35z", "mumbai · 12859"],
  ["cmnfm3huz00593rxnynpretgq", "mumbai · 12951"],
  ["cmnfm3huz00563rxnzrc1dwly", "mumbai · CR-LOCAL"],
  ["cmnfm3huz00573rxna6xjr3dl", "mumbai · HARBOUR"],
  ["cmnfm3huz00583rxn4q7x43df", "mumbai · WR-AC-LOCAL"],
  ["cmnfm3huz00553rxnptnru6v0", "mumbai · WR-LOCAL"],
  ["cmmvn77z500q3muxntdfzn0n4", "mysuru · 12007"],
  ["cmmvn77z500q4muxnvpokss64", "mysuru · 12008"],
  ["cmmvn77z500q6muxn7k8gs42y", "mysuru · 16210"],
  ["cmmvn77z500q8muxnofyjlpun", "mysuru · 17301"],
  ["cmmvn77z500q5muxnh2xjxcor", "mysuru · 22681"],
  ["cmmvn77z500q7muxntx36zpko", "mysuru · 56274"],
  ["cmnf0n7w1003p1dxn4h1vuzl7", "new-delhi · 12002"],
  ["cmnf0n7w1003q1dxnwl46wbva", "new-delhi · 12046"],
  ["cmnf0n7w1003n1dxn2638q7b6", "new-delhi · 12302"],
  ["cmnf0n7w1003t1dxntw5h81da", "new-delhi · 12424"],
  ["cmnf0n7w1003o1dxnx6p3lrvt", "new-delhi · 12622"],
  ["cmnf0n7w1003m1dxnrafpepd6", "new-delhi · 12952"],
  ["cmod2sojf000dz2xne7b4o4dh", "pune · 12025"],
  ["cmod2so050008z2xn3izkmxxs", "pune · 12123"],
  ["cmod2so670009z2xngpzpf4an", "pune · 12124"],
  ["cmod2so9d000az2xnr3jwoho0", "pune · 12125"],
  ["cmod2soch000bz2xngrls1vzh", "pune · 12127"],
  ["cmod2sofh000cz2xnpxh9zls5", "pune · 22105"],
];

/** Every BusRoute row of the live districts. */
const BUS_ROWS: Array<[string, string]> = [
  ["cmmvn6ucj00e6muxncf4ljzo6", "bengaluru-urban · 150T · Kempegowda Bus Stand → Banashankari"],
  ["cmmvn6ucj00eomuxnop3unkcm", "bengaluru-urban · 193G · Kempegowda Bus Stand → Silk Board Via Gavipuram"],
  ["cmmvn6r6m006xmuxnr1isolqd", "bengaluru-urban · 201 · Shivajinagar → Yelahanka"],
  ["cmmvn6ucj00esmuxng48jpvmj", "bengaluru-urban · 201MJ · Marathahalli → Jayanagar 4th Block"],
  ["cmmvn6ucj00dwmuxn5vzc4tj8", "bengaluru-urban · 201R · Kempegowda Bus Stand → Rajajinagar"],
  ["cmmvn6ucj00dzmuxnn9cfcsop", "bengaluru-urban · 216E · Kempegowda Bus Stand → Indiranagar"],
  ["cmmvn6ucj00ewmuxn12iqybia", "bengaluru-urban · 216WF · Indiranagar → Whitefield"],
  ["cmmvn6ucj00e5muxngbsv3jmf", "bengaluru-urban · 218E · Shivajinagar → Koramangala"],
  ["cmmvn6ucj00ekmuxnk22cn66t", "bengaluru-urban · 219M · Shivajinagar → Mahadevapura"],
  ["cmmvn6ucj00e8muxn4eem00ut", "bengaluru-urban · 225C · Kempegowda Bus Stand → BTM Layout"],
  ["cmmvn6ucj00e1muxn35lq71ks", "bengaluru-urban · 255F · Kempegowda Bus Stand → HSR Layout"],
  ["cmmvn6uck00f0muxnpzew4mmp", "bengaluru-urban · 273A · Kempegowda Bus Stand → Adugodi"],
  ["cmmvn6ucj00dvmuxngwold4r1", "bengaluru-urban · 273F · Shivajinagar → Marathahalli"],
  ["cmmvn6ucj00evmuxne17zoxtm", "bengaluru-urban · 273KR · KR Puram → Koramangala"],
  ["cmmvn6ucj00e3muxn8whoav0w", "bengaluru-urban · 300A · Kempegowda Bus Stand → Bannerghatta Road"],
  ["cmmvn6ucj00e7muxnjovfq4nb", "bengaluru-urban · 315S · Kempegowda Bus Stand → Jayanagar 9th Block"],
  ["cmmvn6r6m006zmuxn27tfk79f", "bengaluru-urban · 318D · Kempegowda Bus Stand → Sarjapur Road (Attibele)"],
  ["cmmvn6ucj00e0muxna4vczesm", "bengaluru-urban · 333M · Shivajinagar → Malleshwaram"],
  ["cmmvn6r6m006wmuxn6wb95c4f", "bengaluru-urban · 335E · Kempegowda Bus Stand → Whitefield ITPB"],
  ["cmmvn6ucj00dsmuxn3jn11rln", "bengaluru-urban · 335E · Shivajinagar → Whitefield ITPL"],
  ["cmmvn6ucj00dxmuxnk42jgaeq", "bengaluru-urban · 347G · Kempegowda Bus Stand → Yelahanka"],
  ["cmmvn6ucj00dymuxn6zmdogiw", "bengaluru-urban · 365 · Shivajinagar → Devanahalli"],
  ["cmmvn6uck00f1muxnk520it28", "bengaluru-urban · 366A · Kempegowda Bus Stand → Kanakapura Town"],
  ["cmmvn6ucj00enmuxnqx0ros9c", "bengaluru-urban · 388W · Shivajinagar → Whitefield Via ITPL"],
  ["cmmvn6ucj00eumuxn660czul3", "bengaluru-urban · 400BW · Yeshwanthpur → Bannerghatta"],
  ["cmmvn6ucj00ejmuxneeu2w2uq", "bengaluru-urban · 400J · Yeshwanthpur → Jalahalli"],
  ["cmmvn6r6m006ymuxnd4oiiewv", "bengaluru-urban · 401 · Kempegowda Bus Stand → Mysuru (Satellite)"],
  ["cmmvn6ucj00dumuxnb1m426kk", "bengaluru-urban · 401H · Kempegowda Bus Stand → Hesaraghatta"],
  ["cmmvn6ucj00eamuxn8y9890xk", "bengaluru-urban · 401J · Kempegowda Bus Stand → JP Nagar 6th Phase"],
  ["cmmvn6ucj00eymuxnc8ydocvb", "bengaluru-urban · 401M · Kempegowda Bus Stand → Malleswaram"],
  ["cmmvn6ucj00epmuxngrsbklya", "bengaluru-urban · 401N · Kempegowda Bus Stand → Nagarbhavi"],
  ["cmmvn6ucj00e4muxng7e4var2", "bengaluru-urban · 410V · Kempegowda Bus Stand → Vidyaranyapura"],
  ["cmmvn6r6m006vmuxnjdn0v9if", "bengaluru-urban · 500C · Kempegowda Bus Stand → Electronic City Phase 1"],
  ["cmmvn6ucj00dpmuxnog6h9jnj", "bengaluru-urban · 500C · Kempegowda Bus Stand → Silk Board"],
  ["cmmvn6ucj00dqmuxn1uwyusoo", "bengaluru-urban · 500D · Jayanagar 4th Block → Hebbal"],
  ["cmmvn6ucj00eqmuxnn9g0pl6b", "bengaluru-urban · 500T · Kempegowda Bus Stand → Tumkur Road Satellite"],
  ["cmmvn6ucj00drmuxndez4kbml", "bengaluru-urban · 501 · Kempegowda Bus Stand → Electronic City"],
  ["cmmvn6ucj00e2muxnvwjiofp9", "bengaluru-urban · 502 · Kempegowda Bus Stand → Sarjapur Road"],
  ["cmmvn6ucj00etmuxn7xay6b72", "bengaluru-urban · 510S · Silk Board → Sarjapur Attibele"],
  ["cmmvn6ucj00ermuxn4ycr587x", "bengaluru-urban · 600BY · Kempegowda Bus Stand → Byatarayanapura"],
  ["cmmvn6ucj00e9muxnmbagffup", "bengaluru-urban · 600D · Kempegowda Bus Stand → Doddaballapur"],
  ["cmmvn6ucj00elmuxnj59snlru", "bengaluru-urban · 600H · Kempegowda Bus Stand → Hebbal Lake"],
  ["cmmvn6ucj00dtmuxnf2t2s36s", "bengaluru-urban · 600K · Kempegowda Bus Stand → KR Puram"],
  ["cmmvn6uck00f2muxnq1mlamzr", "bengaluru-urban · 600P · Kempegowda Bus Stand → Peenya Industrial Area"],
  ["cmmvn6ucj00emmuxnp3fhzwcv", "bengaluru-urban · 600RT · Kempegowda Bus Stand → RT Nagar"],
  ["cmmvn6ucj00exmuxnce1pauwc", "bengaluru-urban · 601V · Kempegowda Bus Stand → Vijayanagar"],
  ["cmmvn6ucj00ezmuxna60l5zjg", "bengaluru-urban · 6E · Shivajinagar → Banaswadi"],
  ["cmmvn6ucj00ebmuxn4ggmxs5v", "bengaluru-urban · 700A · Kempegowda Bus Stand → Anekal"],
  ["cmmvn6ucj00ecmuxnnydolacs", "bengaluru-urban · 700B · Kempegowda Bus Stand → Chandapura"],
  ["cmmvn6ucj00edmuxni7r9kqiv", "bengaluru-urban · 700E · Silk Board → Electronic City Ph-2"],
  ["cmmvn6r6m006umuxnre4xa5ek", "bengaluru-urban · KIA-1 · Kempegowda Bus Stand (Majestic) → Kempegowda International Airport"],
  ["cmmvn6ucj00eemuxn359pn5gw", "bengaluru-urban · KIA-1 · Kempegowda Bus Stand → Kempegowda Int. Airport"],
  ["cmmvn6ucj00efmuxn8fp4z30m", "bengaluru-urban · KIA-3 · Domlur → Kempegowda Int. Airport"],
  ["cmmvn6ucj00egmuxnyhyx487h", "bengaluru-urban · KIA-5 · Shivajinagar → Kempegowda Int. Airport"],
  ["cmmvn6ucj00ehmuxn75ywaq3k", "bengaluru-urban · KIA-7 · Silk Board → Kempegowda Int. Airport"],
  ["cmmvn6ucj00eimuxn8lahnqch", "bengaluru-urban · KIA-8 · Koramangala → Kempegowda Int. Airport"],
  ["cmnfm3tgm004k51xn58ahajq9", "chennai · 1 · Broadway → T Nagar"],
  ["cmnfm3tgm004r51xn9pjolpd6", "chennai · 21H · Broadway → Avadi"],
  ["cmnfm3tgm004m51xnmlx122nl", "chennai · 27C · Broadway → Thiruvanmiyur"],
  ["cmnfm3tgm004l51xn89912lrx", "chennai · 5C · Broadway → Tambaram"],
  ["cmnfm3tgm004p51xnrdkg2afg", "chennai · AC-1 · CMBT → Mahabalipuram"],
  ["cmnfm3tgm004q51xnqs8kav91", "chennai · E-15 · Broadway → Anna Nagar"],
  ["cmnfm3tgm004n51xn7092vird", "chennai · M70 · T Nagar → Adyar"],
  ["cmnfm3tgm004o51xnusstzn9j", "chennai · S70 · CMBT → OMR Siruseri"],
  ["cmnrsyeql0037yaxnys3oop7x", "hyderabad · 10H · Secunderabad (JBS) → Mehdipatnam"],
  ["cmnrsyeql0039yaxnq8ln6e4t", "hyderabad · 127 · MGBS → Miyapur"],
  ["cmnrsyeql003ayaxnxivnbkvk", "hyderabad · 290 · MGBS → Shamshabad Airport"],
  ["cmnrsyeql0036yaxn1d7q4ubo", "hyderabad · 5K · Secunderabad (JBS) → Charminar"],
  ["cmnrsyeql0038yaxndfjxx0mg", "hyderabad · 65 · MGBS → Dilsukhnagar"],
  ["cmnrsyeql003byaxnmrr6shfo", "hyderabad · 86 · Secunderabad → Gachibowli"],
  ["cmnfm3phi004d4exnoykyw675", "kolkata · 230 · Tollygunge Metro → New Town Eco Park"],
  ["cmnfm3phi004b4exnfqm09vf7", "kolkata · AC-20 · Howrah Station → NSC Bose Airport"],
  ["cmnfm3phi004c4exngex40a1x", "kolkata · DN-9 · Dum Dum → BBD Bagh"],
  ["cmnfm3phi004f4exnsmcpfvv2", "kolkata · E-32 · Sealdah Station → Salt Lake Sector V"],
  ["cmnfm3phi004g4exnrwptih5q", "kolkata · MINI-12 · Jadavpur 8B → Esplanade"],
  ["cmnfm3phi00494exnnacpm75o", "kolkata · S-12 · Howrah Station → Salt Lake Sector V"],
  ["cmnfm3phi004a4exnl2856sqt", "kolkata · S-32 · Esplanade → Garia Station"],
  ["cmnfm3phi004e4exniloyp88m", "kolkata · TRAM-25 · Esplanade → Shyambazar"],
  ["cmntdqus6002wlnxncrb2pzyc", "lucknow · City-1 · Alambagh → Amausi Airport"],
  ["cmntdqus6002ylnxn6tln6oci", "lucknow · City-12 · Alambagh → Jankipuram"],
  ["cmntdqus6002xlnxnq9jjx6ud", "lucknow · City-7 · Charbagh → Gomti Nagar"],
  ["cmntdqus6002tlnxnk5tbx8n4", "lucknow · LKO-AGR · Lucknow (Alambagh) → Agra"],
  ["cmntdqus6002ulnxnu4v8akok", "lucknow · LKO-DEL · Lucknow (Alambagh) → Delhi (ISBT Anand Vihar)"],
  ["cmntdqus6002rlnxnjkbsv1yl", "lucknow · LKO-KNP · Lucknow (Alambagh) → Kanpur"],
  ["cmntdqus6002vlnxnr3rr26vo", "lucknow · LKO-PYG · Lucknow (Charbagh) → Prayagraj"],
  ["cmntdqus6002slnxnozw884e6", "lucknow · LKO-VNS · Lucknow (Charbagh) → Varanasi"],
  ["cmmv9nec3005mubxnjjrf1nbh", "mandya · MND-001 · Mandya → Bengaluru (Kempegowda Bus Stand)"],
  ["cmmv9nec3005nubxngsjp0jc9", "mandya · MND-002 · Mandya → Mysuru (KSRTC Stand)"],
  ["cmmv9nec3005oubxn80p0fu9k", "mandya · MND-003 · Mandya → Maddur"],
  ["cmmv9nec3005pubxnssuksrao", "mandya · MND-004 · Mandya → Hassan"],
  ["cmmv9nec3005qubxn2ulxmojx", "mandya · MND-005 · Mandya → Channapatna"],
  ["cmnfm3hor004x3rxnofrnqocj", "mumbai · 1 · Colaba Bus Depot → Agarkar Chowk"],
  ["cmnfm3hor00513rxn3kkqp09q", "mumbai · 203 · Kurla Station → Andheri Station"],
  ["cmnfm3hor00503rxnzuhgptdd", "mumbai · 332 · Bandra Station West → BKC"],
  ["cmnfm3hor00523rxnjb3dlhue", "mumbai · 500 · CSMT → Borivali Station"],
  ["cmnfm3hor00543rxnvg124ixy", "mumbai · 79 · CSMT → Mulund Check Naka"],
  ["cmnfm3hor004y3rxn2lwckjrz", "mumbai · 83 · Colaba → Andheri Station East"],
  ["cmnfm3hor004z3rxny6bqj1sn", "mumbai · 84 · Colaba → Goregaon Depot"],
  ["cmnfm3hor00533rxn1ga8dfhl", "mumbai · A-37 · Mantralaya → Haji Ali"],
  ["cmmvn77ss00pzmuxnkjb9rf0k", "mysuru · CTB-1 · Mysuru Palace → Hebbal"],
  ["cmmvn77ss00q0muxn89ssf34q", "mysuru · CTB-2 · KRS Dam → Mysuru City"],
  ["cmmvn77ss00pomuxnelhjqz1o", "mysuru · MYS-1 · Mysuru City Bus Stand → Bengaluru KPTCL"],
  ["cmmvn77ss00pxmuxn8sd4kg80", "mysuru · MYS-10 · Mysuru City Bus Stand → Brindavan Gardens"],
  ["cmmvn77ss00pymuxneiclk4cc", "mysuru · MYS-11 · Mysuru City Bus Stand → Mysuru Airport"],
  ["cmmvn77ss00q1muxn7xsssitx", "mysuru · MYS-12 · Mysuru City Bus Stand → Gundlupet"],
  ["cmmvn77ss00q2muxnt8p7pqa9", "mysuru · MYS-13 · Mysuru City Bus Stand → Madikeri (Coorg)"],
  ["cmmvn77ss00ppmuxnoyzhcls5", "mysuru · MYS-2 · Mysuru City Bus Stand → Bengaluru Majestic"],
  ["cmmvn77ss00pqmuxnhpqdcvql", "mysuru · MYS-3 · Mysuru City Bus Stand → Nanjangud"],
  ["cmmvn77ss00prmuxnk7ryvq1n", "mysuru · MYS-4 · Mysuru City Bus Stand → Hunsur"],
  ["cmmvn77ss00psmuxnkgof8iij", "mysuru · MYS-5 · Mysuru City Bus Stand → H.D. Kote"],
  ["cmmvn77ss00ptmuxnw1tddthx", "mysuru · MYS-6 · Mysuru City Bus Stand → T. Narasipur"],
  ["cmmvn77ss00pumuxnfv6njesz", "mysuru · MYS-7 · Mysuru City Bus Stand → K.R. Nagar"],
  ["cmmvn77ss00pvmuxnh8fi1azr", "mysuru · MYS-8 · Mysuru City Bus Stand → Periyapatna"],
  ["cmmvn77ss00pwmuxntcjtegbw", "mysuru · MYS-9 · Mysuru City Bus Stand → Chamundi Hills"],
  ["cmnf0n7p6003k1dxn5porq7es", "new-delhi · 429 · Kendriya Terminal (ISBT) → Connaught Place"],
  ["cmnf0n7p6003i1dxnd5deq6w8", "new-delhi · 522 · ISBT Kashmere Gate → Saket"],
  ["cmnf0n7p6003h1dxnj2ouy733", "new-delhi · 604 · ISBT Kashmere Gate → Mehrauli"],
  ["cmnf0n7p6003j1dxngcn0sgld", "new-delhi · 764 · Minto Road → IGI Airport Terminal 3"],
  ["cmnf0n7p6003l1dxnuc0hembv", "new-delhi · 990 · Anand Vihar ISBT → Connaught Place"],
  ["cmod2snkl0003z2xnynp0aou0", "pune · 105 · Swargate → Hadapsar Gadital"],
  ["cmod2sne50001z2xng1p7bsmv", "pune · 158 · Shivajinagar → Hinjawadi Phase 3"],
  ["cmod2snnp0004z2xnj9x9mz98", "pune · 200 · Pune Station → Pimpri"],
  ["cmod2snar0000z2xndlorrz5x", "pune · 4 · Pune Station → Katraj"],
  ["cmod2snh80002z2xn5dc8glfg", "pune · 57 · Pune Station → Kothrud Depot"],
  ["cmod2snwv0007z2xn7wj79rpx", "pune · Ashwamedh · Swargate → Kolhapur"],
  ["cmod2snqt0005z2xn667urdmt", "pune · PMP-AC-1 · Pune Airport → Swargate"],
  ["cmod2sntw0006z2xnb39le8c3", "pune · Shivneri · Swargate → Mumbai (Dadar)"],
];

// ─────────────────────────────────────────────────────────────────────
//  The reviewed list
// ─────────────────────────────────────────────────────────────────────
const FIXES: Fix[] = [
  // ── #0 #1 #2 #3 #4  DemographicProfile "Census 2011" rows ──────────
  {
    finding: 0, table: "DemographicProfile", id: "cmo8ytsg5000jjnxnw8nlg3ql", op: "update",
    label: "Mandya · Census 2011 profile (core numbers + religion)",
    set: {
      sexRatio: 995, literacyTotal: 70.4, urbanPct: 17.08, density: 364,
      religion: { Hindu: 94.85, Muslim: 4.31, Christian: 0.47, Sikh: 0.02, Buddhist: 0.02, Jain: 0.2, Other: 0.01, NotStated: 0.13 },
    },
    was: {
      sexRatio: 985, literacyTotal: 70.14, urbanPct: 16.08, density: 365,
      religion: { Jain: 0.18, Sikh: 0, Hindu: 94.95, Other: 0, Muslim: 4.58, Buddhist: 0.01, Christian: 0.2, NotStated: 0.08 },
    },
    why: "Seeded profile mixed provisional and mistyped figures; Census 2011 final PCA: sex ratio 995, literacy 70.40 %, urban 17.08 %, density 364; religion (C-01) Hindu 94.85, Muslim 4.31, Christian 0.47, Jain 0.20 … (findings #0, #1).",
    source: SRC.mandya,
  },
  {
    finding: 2, table: "DemographicProfile", id: "cmo8ytsko000kjnxnehzxuray", op: "update",
    label: "Mysuru · Census 2011 profile (sex ratio, urban share, religion)",
    set: {
      sexRatio: 985, urbanPct: 41.5,
      religion: { Hindu: 87.7, Muslim: 9.68, Christian: 1.31, Sikh: 0.04, Buddhist: 0.54, Jain: 0.48, Other: 0.02, NotStated: 0.23 },
    },
    was: {
      sexRatio: 982, urbanPct: 41.39,
      religion: { Jain: 0.15, Sikh: 0.04, Hindu: 87.53, Other: 0.04, Muslim: 10.84, Buddhist: 0.27, Christian: 0.98, NotStated: 0.15 },
    },
    why: "982 is the provisional sex ratio; Census 2011 final: 985, urban 41.50 %; religion Hindu 87.70, Muslim 9.68, Christian 1.31, Jain 0.48 ….",
    source: SRC.mysuru,
  },
  {
    finding: 3, table: "DemographicProfile", id: "cmoabkuq90002v7xn51bhc395", op: "update",
    label: "New Delhi · Census 2011 profile (area, density)",
    set: { areaSqKm: 35, density: 4057 }, was: { areaSqKm: 22, density: 6454 },
    why: "Seed used a wrong area (22 km²) and derived the density from it; Census 2011: 35 km², 4,057 per km² (1,42,004 / 35).",
    source: SRC.newDelhi,
  },
  {
    finding: 4, table: "DemographicProfile", id: "cmo8ytkxs0000j0xn3wso9x2p", op: "update",
    label: "Bengaluru Urban · Census 2011 profile (density)",
    set: { density: 4381 }, was: { density: 4378 },
    why: "4,378 is the provisional density; Census 2011 final: 96,21,551 / 2,196 km² = 4,381.",
    source: SRC.bengaluru,
  },

  // ── #5 #6 #11  District rows (overview, compare, report card) ───────
  {
    finding: 6, table: "District", id: "cmmv9n6cq0001ubxntuw11cty", op: "update",
    label: "Mandya · District people figures",
    set: { population: 1805769, literacy: 70.4, sexRatio: 995, density: 364 },
    was: { population: 1940428, literacy: 72.8, sexRatio: 982, density: 391.2 },
    why: "Typed constants (19,40,428 is no Census figure; 72.8 is Mysuru's literacy). Census 2011: 18,05,769 / 70.40 % / 995 / 364.",
    source: `${SRC.mandya}; ${SRC.history}`,
  },
  {
    finding: 6, table: "District", id: "cmmvn6gei0001muxnh3x1pz7s", op: "update",
    label: "Bengaluru Urban · District people figures",
    set: { population: 9621551, area: 2196, literacy: 87.67, density: 4381 },
    was: { population: 12765000, area: 741, literacy: 88.48, density: 17230 },
    why: "12,765,000 was a deleted '2021 projection' and 741 km² the BBMP area, not the district. Census 2011: 96,21,551 / 2,196 km² / 87.67 % / 4,381.",
    source: `${SRC.bengaluru}; ${SRC.history}`,
  },
  {
    finding: 6, table: "District", id: "cmmvn6wsa00j4muxn0644c207", op: "update",
    label: "Mysuru · District people figures + taluk count",
    set: { population: 3001127, area: 6307, literacy: 72.79, sexRatio: 985, density: 476, talukCount: 9 },
    was: { population: 3248000, area: 6854, literacy: 72.64, sexRatio: 984, density: 461, talukCount: 7 },
    why: "Census 2011: 30,01,127 on 6,307 km², literacy 72.79 %, sex ratio 985, density 476. The district has 9 taluks incl. Saligrama and Sargur (finding #11).",
    source: `${SRC.mysuru}; ${SRC.mysuruNic}`,
  },
  {
    finding: 5, table: "District", id: "cmnf0i70h0005xlxn23f7ddt5", op: "update",
    label: "New Delhi · District people figures (Census 2011, same boundary as its 35 km² area)",
    set: { population: 142004, literacy: 88.34, sexRatio: 822 },
    was: { population: 1173902, literacy: 89.38, sexRatio: 824 },
    why: "The row paired the present-day district's 11,73,902 (DM site) with the 2011 district's 35 km² / 4,057 per km², and an unsourced literacy 89.4 %. Now all Census 2011 for one boundary, as the population page shows: 1,42,004 / 88.34 % / 822.",
    source: `${SRC.newDelhi}; ${SRC.history}`,
  },
  {
    finding: 6, table: "District", id: "cmnfhentm000hl6xntaak7dxo", op: "update",
    label: "Mumbai · District sex ratio; literacy hidden; taluk count hidden",
    set: { sexRatio: 853, literacy: null, talukCount: null },
    was: { sexRatio: 832, literacy: 89.73, talukCount: 5 },
    why: "832 is Mumbai City alone; Mumbai (City + Suburban) Census 2011 sex ratio is 853. Literacy has no checked combined figure (the population history leaves it empty) → hidden. The 5 'talukas' were zones → count hidden (finding #11).",
    source: `${SRC.history}; https://www.census2011.co.in/census/district/359-mumbai-city.html`,
  },
  {
    finding: 6, table: "District", id: "cmnfheqze0016l6xncib8jxq4", op: "update",
    label: "Chennai · District people figures; taluk count hidden",
    set: { population: 4646732, area: 175, literacy: 90.18, density: 26553, talukCount: null },
    was: { population: 7088000, area: 426, literacy: 90.33, density: 10908, talukCount: 4 },
    why: "70,88,000 on 426 km² (expanded city) contradicted its own density (46.46 lakh / 426). Census 2011 district: 46,46,732 / 175 km² / 90.18 % / 26,553. The 4 'taluks' are not the 16+ revenue taluks → count hidden (finding #11).",
    source: `${SRC.history}; ${SRC.chennaiNic}`,
  },
  {
    finding: 6, table: "District", id: "cmnfheppj000vl6xn5v7abegx", op: "update",
    label: "Kolkata · District area, literacy, density; taluk count hidden",
    set: { area: 185, literacy: 86.31, density: 24306, talukCount: null },
    was: { area: 205, literacy: 87.14, density: 24252, talukCount: 4 },
    why: "Census 2011: 185 km², literacy 86.31 %, density 24,306. Kolkata has no CD blocks; the 4 'blocks' were invented → count hidden (finding #11).",
    source: SRC.kolkata,
  },
  {
    finding: 6, table: "District", id: "cmnsx65is001w5vxngq0z9ujl", op: "update",
    label: "Lucknow · District literacy, density, tehsil count",
    set: { literacy: 77.29, density: 1816, talukCount: 5 },
    was: { literacy: 79.33, density: null, talukCount: 4 },
    why: "79.33 % is the provisional literacy; Census 2011 final 77.29 %, density 1,816. Lucknow has 5 tehsils (finding #11).",
    source: `${SRC.history}; ${SRC.lucknowNic}`,
  },
  {
    finding: 6, table: "District", id: "cmnrsy1qv000zx8xnphxfw5mf", op: "update",
    label: "Hyderabad · District population",
    set: { population: 3943323 }, was: { population: 4500000 },
    why: "45,00,000 was a round invented figure; Census 2011: 39,43,323 (official district site).",
    source: SRC.hyderabadGov,
  },

  // ── #18 #19  DepartmentStaffing — every row came from a news story ──
  ...([
    ["cmotnirmi002s04l5cveu6n9n", "Mysuru · Primary Health Centre doctors 10 / 8", 18],
    ["cmo9na5id000h04kytccp5uc7", "Kolkata · CAPF personnel 2,73,000 / 0", 19],
    ["cms8jgrp9000x04kyfmumfllj", "Hyderabad · Police officers 19,000 / 0", 19],
    ["cmol2sp50000s04l7y5wequem", "Hyderabad · District Collector 1 / 0", 19],
    ["cmru90jou000r04l56obj0he6", "Hyderabad · Seasonal Monitoring special officer 10 / 10", 19],
    ["cmos83uh5001s04jpir58kezy", "Lucknow · Auditors 500 / 0", 19],
    ["cmos83k3a001n04jpvzo7owj4", "Lucknow · District Magistrate 1 / 1", 19],
    ["cmol2t8kg001904l7rp8xitl1", "Lucknow · Anganwadi workers 198 / 0", 19],
    ["cmo9nbye1002204kyhqf1tv67", "New Delhi · IAS officers 400 / 300", 19],
    ["cmpdnqu56001k04jr95rb1ks6", "Chennai · IAS officers 17 / 17", 19],
    ["cmpusw2ve000l04kzbborbdsg", "Chennai · District Collector 5 / 5", 19],
    ["cmphy054o000q04l88n52uy4n", "Chennai · Corporation Commissioner 1 / 1", 19],
    ["cmo5arsmi0lyj10mvzrvm1u70", "Mumbai · GST Joint Commissioner 1 / 1", 19],
    ["cmqj3g1p5002504joiw5j1e7p", "Mumbai · IAS officer 12 / 12", 19],
  ] as const).map(([id, label, finding]): Fix => ({
    finding, table: "DepartmentStaffing", id, op: "delete", label,
    why: "Numbers lifted from a Google News story (national or state news, or a single office), shown as the district's sanctioned vs working posts and labelled 'Official data'. Not a district figure; whole row unfounded.",
    source: "none — sourceUrl is a news.google.com/rss link",
  })),

  // ── #20 #21  GovernmentExam — old-cycle post counts and dates on "2026" rows ──
  ...([
    ["cmnfml9mz000dk0xnga0gqusw", "IBPS Clerk 2026", 6128, "2026-08-20", "RESULT_PENDING", "6,128 = CRP Clerk-XIV (2024); 2026 cycle (CSA-XVI) is 11,403 and prelims are in October"],
    ["cmnfml9mz000ck0xnfb1jax3h", "IBPS PO 2026", 4455, "2026-10-10", "UNVERIFIED", "4,455 = IBPS PO-XIV (2024)"],
    ["cmnfml9mz000fk0xnv9qd3cbt", "IBPS RRB 2026", 9995, "2026-08-01", "RESULT_PENDING", "9,995 = IBPS RRB-XIII (2024)"],
    ["cmnfml9mz000ak0xnm0t5ccsf", "RRB ALP 2026", 5696, "2026-09-20", "RESULT_PENDING", "5,696 = RRB ALP CEN 01/2024"],
    ["cmnfml9mz000bk0xn8xpt19ws", "RRB JE 2026", 7951, "2026-10-15", "UNVERIFIED", "7,951 = RRB JE CEN 03/2024"],
    ["cmnfml9mz0008k0xn69ylum76", "RRB NTPC 2026", 11558, "2026-08-15", "RESULT_PENDING", "11,558 = RRB NTPC 2024"],
    ["cmnfml9mz000gk0xnv6hmcdve", "SBI PO 2026", 2000, "2026-06-15", "RESULT_PENDING", "2,000 = SBI PO 2023"],
    ["cmnfml9mz0002k0xn9j1pqs0p", "UPSC CDS 2026 (II)", 459, "2026-09-06", "RESULT_PENDING", "459 not confirmed against the 2026 (II) notice"],
    ["cmnfmla6c0016k0xnki79jpt5", "TNPSC Group II & IIA 2026", 5529, "2026-06-15", "RESULT_PENDING", "5,529 = TNPSC Group 2/2A 2022"],
    ["cmnfmla6c001bk0xnv5qcioet", "TN Police Constable 2026", 6244, "2026-09-01", "RESULT_PENDING", "6,244 = TNPSC Group 4 2024, not TN Police"],
    ["cmnfml9mz0009k0xn9pw5241w", "RRB Group D 2026", 32898, "2026-11-01", "UNVERIFIED", "32,898 not confirmed against a 2026 notice"],
    ["cmnfml9wp000tk0xnmtz2z44j", "Maharashtra Police Constable 2026", 18331, "2026-09-01", "RESULT_PENDING", "18,331 not confirmed against a 2026 notice"],
  ] as const).map(([id, label, vacancies, examDate, status, note]): Fix => ({
    finding: 20, table: "GovernmentExam", id, op: "hide", label: `${label} · post count, exam date, status`,
    set: { vacancies: null, examDate: null, status: "UNVERIFIED" },
    was: { vacancies, examDate, status },
    why: `Hidden: the exam seed copied an earlier cycle's figures into a '2026' row (${note}); the exam date and the status derived from it were invented. Kept as a tracked exam with no numbers until an official notice is checked.`,
    source: "https://www.careerpower.in/blog/ibps-clerk-vacancy-2026-out (IBPS Clerk 2026: 11,403); https://scroll.in/announcements/1062952 (TNPSC Group 4 2024: 6,244)",
  })),
  {
    finding: 21, table: "GovernmentExam", id: "cmnfmla6c001ak0xna7uepo2w", op: "hide",
    label: "TN TET 2026 · post count", set: { vacancies: null }, was: { vacancies: 15000 },
    why: "A Teacher Eligibility Test has no posts; recruitment is separate (TN TRB).",
    source: "https://ctet.nic.in/ (qualifying a TET does not confer a right to recruitment)",
  },
  {
    finding: 21, table: "GovernmentExam", id: "cmnfmla1m0011k0xndmmkbxny", op: "hide",
    label: "WB TET 2026 · post count", set: { vacancies: null }, was: { vacancies: 11000 },
    why: "A Teacher Eligibility Test has no posts; recruitment is separate (WBBPE).",
    source: "https://ctet.nic.in/ (qualifying a TET does not confer a right to recruitment)",
  },
  {
    finding: 22, table: "GovernmentExam", id: "cmnk82xwi096810qsvihmmglc", op: "update",
    label: "NEET UG 2026 · status and dates",
    set: { status: "RESULT_OUT", examDate: "2026-06-21", resultDate: "2026-07-16" },
    was: { status: "RESULT_PENDING", examDate: "2026-05-03", resultDate: null },
    why: "The 3 May 2026 exam was cancelled; NTA held the re-exam on 21 June 2026 and declared the result on 16 July 2026. The row still said 'result pending' for 3 May. (The duplicate 'NBE' / 'Unknown' NEET rows are already gone.)",
    source: "https://newsonair.gov.in/nta-announces-neet-ug-2026-re-exam-results/ ; dates: https://testbook.com/news/neet-ug-result-2026-live/",
  },
  {
    finding: 23, table: "GovernmentExam", id: "cmoci70ua001804laih3psnnr", op: "update",
    label: "SSLC Examination 2026 · conducting body",
    set: { organizingBody: "KSEAB", department: "Karnataka School Examination and Assessment Board (KSEAB)" },
    was: { organizingBody: "KPSC", department: "KPSC" },
    why: "Karnataka SSLC is conducted by KSEAB, not the Karnataka Public Service Commission. (The two other SSLC copies are already gone.)",
    source: "https://kseab.karnataka.gov.in/",
  },

  // ── #15 #16  School rows in the wrong district / not found / wrong type ──
  ...([
    ["cmmvn6uuj00fcmuxnmcbizmyu", 15, "Bengaluru Urban · Government High School Devanahalli", "Devanahalli is a taluk of Bengaluru Rural district, not Bengaluru Urban.", "https://bengalururural.nic.in/en/ (Devanahalli taluk)"],
    ["cmmvn6uuj00fbmuxntytbo1gv", 15, "Bengaluru Urban · Government High School Doddaballapur", "Doddaballapura is a taluk of Bengaluru Rural district, not Bengaluru Urban.", "https://bengalururural.nic.in/en/ (Doddaballapura taluk)"],
    ["cmnrsycz6001uyaxnhvkgz248", 15, "Hyderabad · University of Hyderabad", "Gachibowli (Serilingampally mandal) is in Ranga Reddy district, not Hyderabad.", "https://rangareddy.telangana.gov.in/public-utility-category/universities/"],
    ["cmnrsycz6001vyaxni6lowfej", 15, "Hyderabad · IIIT Hyderabad", "Gachibowli is in Ranga Reddy district, not Hyderabad.", "https://rangareddy.telangana.gov.in/public-utility-category/universities/"],
    ["cmnrsycz6001wyaxn7ew3k0oa", 15, "Hyderabad · Indian School of Business (ISB)", "Gachibowli is in Ranga Reddy district, not Hyderabad.", "https://rangareddy.telangana.gov.in/public-utility-category/universities/"],
    ["cmnrsycz6001xyaxnjme5a2d5", 15, "Hyderabad · NALSAR University of Law", "Shameerpet is in Medchal–Malkajgiri district, not Hyderabad.", "https://en.wikipedia.org/wiki/NALSAR_University_of_Law"],
    ["cmnfm3s13002t51xn5pbxwc4g", 15, "Chennai · Velammal Vidyalaya (Mel Ayanambakkam)", "Ayanambakkam (PIN 600095) is in Poonamallee taluk, Tiruvallur district, not Chennai.", "https://en.wikipedia.org/wiki/Ayanambakkam ; https://tiruvallur.nic.in/directory/poonamallee-taluk/"],
    ["cmmvn6v6700gsmuxn766vvwmq", 16, "Bengaluru Urban · 'Kendriya Vidyalaya DRDL Whitefield'", "No such school: Bengaluru's DRDO-linked KV is KV DRDO (C.V. Raman Nagar); DRDL is a Hyderabad lab.", "https://drdobangalore.kvs.ac.in/"],
    ["cmntdqtmb001glnxn53pocb1i", 16, "Lucknow · 'Nizam College (Govt Inter College), Kaiserbagh'", "No such college found in Lucknow; Nizam College is in Hyderabad (and listed there).", "none — not found"],
    ["cmntdqtmb001hlnxn2iykt23a", 16, "Lucknow · Rani Laxmi Bai Memorial School typed 'Government'", "Management type not confirmable (listed as Government); the table has no active flag, so the row is removed until checked on UDISE+.", "none — not confirmable"],
    ["cmmvn6v0a00fsmuxnvcpakcf1", 16, "Bengaluru Urban · Bishop Cotton Boys' School typed 'Government Aided'", "Management type not confirmable (listed as Government Aided); the table has no active flag, so the row is removed until checked on UDISE+.", "none — not confirmable"],
  ] as const).map(([id, finding, label, why, source]): Fix => ({
    finding, table: "School", id, op: "delete", label, why: `Hidden (row removed): ${why}`, source,
  })),

  // ── #17  Pune school addresses holding notes ────────────────────────
  ...([
    // [id, address only, address as stored on the check date]
    ["cmobql4x50000ppxnv9dlmxn6", "ZP Pune, Shivaji Road",
      "ZP Pune, Shivaji Road | 3,546 primary schools (Classes 1-7) across 14 talukas. 238,395 students. Mid-day meal + free textbooks + free uniforms."],
    ["cmobql50m0001ppxnos94rgal", "ZP Pune, Shivaji Road",
      "ZP Pune, Shivaji Road | Manages govt-approved secondary schools: aided, unaided, permanently unaided, self-financed. Standards 5-12, multiple mediums."],
    ["cmobql53n0002ppxnwxqcdwex", "PMC HQ, Shivajinagar, Pune 411005",
      "PMC HQ, Shivajinagar, Pune 411005 | Operates primary and secondary schools across 15 ward offices. CBSE syllabus adoption announced."],
    ["cmobql56s0003ppxnmhvbef9v", "Ganeshkhind, Pune 411007",
      "Ganeshkhind, Pune 411007 | Founded 1949. State public research university. ~475 affiliated colleges across Pune and 4 neighbouring districts."],
    ["cmobql59u0004ppxn3t1uh2v7", "Fergusson College Road, Shivajinagar, Pune 411004",
      "Fergusson College Road, Shivajinagar, Pune 411004 | Founded 1885. Autonomous (Deccan Education Society). Arts & Science. Alumni: Tilak, Gokhale, Savarkar."],
    ["cmobql5d00005ppxnowzr4rn7", "Wellesley Road, Shivajinagar, Pune 411005",
      "Wellesley Road, Shivajinagar, Pune 411005 | Founded 1854. Autonomous technological university. ~3,500 students. One of India's oldest engineering colleges."],
    ["cmobql5g20006ppxndjpt88bq", "Law College Road, Pune 411004",
      "Law College Road, Pune 411004 | Founded 1960. Government of India film & TV training institute. ~100 students per year."],
    ["cmobql5j50007ppxn63lt4rnx", "Khadakwasla, Pune 411023",
      "Khadakwasla, Pune 411023 | Founded 1954. Tri-service Armed Forces training academy. ~1,800 cadets in 3-year inter-service course."],
    ["cmod2wuzl00005ixnsv4878na", "Gram Lavale, Taluka Mulshi, Pune — 412115.",
      "Gram Lavale, Taluka Mulshi, Pune — 412115 (main Lavale campus; additional campuses at Viman Nagar, Kirkee, Hinjawadi). // Private deemed-to-be-university established 2002. 40+ constituent institutes across law, management, liberal arts, health sciences, design, and telecom management. // Primary source: Symbiosis International Official | https://www.siu.edu.in/ // Secondary source: Wikipedia | https://en.wikipedia.org/wiki/Symbiosis_International_University // Disclaimer: Private deemed university under UGC / MHRD recognition. Admissions via SET / SNAP / SLAT national entrance tests."],
    ["cmod2wv3100015ixnhxpum5cm", "Gram Lavale, Taluka Mulshi, Pune — 412115.",
      "Gram Lavale, Taluka Mulshi, Pune — 412115. // Constituent institute of Symbiosis International University; established 1978. Full-time MBA programme; routinely ranked among India's top 25 B-schools by NIRF. // Primary source: SIBM Pune Official | https://www.sibm.edu/ // Secondary source: NIRF Management Rankings | https://www.nirfindia.org/Rankings/2024/ManagementRanking.html // Disclaimer: Admissions via SNAP test. Part of SIU. Flagship MBA batch ~180 students."],
    ["cmod2wv6000025ixnkvm6a9b0", "Survey No. 124, Paud Road, Kothrud, Pune — 411038.",
      "Survey No. 124, Paud Road, Kothrud, Pune — 411038. // Private university founded 2017 under MIT Group of Institutions (founded 1983 by Prof. Vishwanath D. Karad). Schools of Engineering, Management, Economics, Government, Liberal Arts, Science, Media, Law. // Primary source: MIT-WPU Official | https://mitwpu.edu.in/ // Secondary source: Wikipedia | https://en.wikipedia.org/wiki/MIT_World_Peace_University // Disclaimer: Private university under Maharashtra State Private Universities Act. Not to be confused with MIT USA."],
    ["cmod2wv8t00035ixnmiac5kn5", "Gat No. 1270, Lavale, Off Pune Bangalore Highway, Pune — 412115.",
      "Gat No. 1270, Lavale, Off Pune Bangalore Highway, Pune — 412115. // Private liberal-education university established 2015. Undergraduate programmes in liberal arts + liberal education model (majors + minors + discover); postgraduate in business, communication, applied psychology. // Primary source: FLAME University Official | https://www.flame.edu.in/ // Secondary source: Wikipedia | https://en.wikipedia.org/wiki/FLAME_University // Disclaimer: Private university under Maharashtra State Private Universities Act. Admissions via FEAT entrance + interview."],
  ] as Array<[string, string, string]>).map(([id, clean, stored]): Fix => ({
    finding: 17, table: "School", id, op: "update", label: `Pune · school address`,
    set: { address: clean }, was: { address: stored },
    why: "The Pune seed packed a description, source links and a disclaimer into the address; only the address is kept (the unverified notes are dropped).",
    source: "the row's own address text (before ' // ' or ' | ')",
  })),

  // ── #28–#37  FamousPersonality ─────────────────────────────────────
  {
    finding: 28, table: "FamousPersonality", id: "cmmv9ng9i007mubxnkv01x64y", op: "update",
    label: "Mandya · C. M. Ibrahim — not born in Mandya",
    set: { bornInDistrict: false, birthPlace: "Airani, Karnataka", birthYear: 1948 },
    was: { bornInDistrict: true, birthPlace: "Mandya, Mandya district, Karnataka", birthYear: 1938 },
    why: "Born 14 Aug 1948 in Airani, not Mandya (and not 1938). Not born in the district → no longer listed (born-here rule).",
    source: "https://en.wikipedia.org/wiki/C._M._Ibrahim",
  },
  {
    finding: 28, table: "FamousPersonality", id: "cmmv9ng9i007kubxnuxuvkc7l", op: "update",
    label: "Mandya · G. S. Shivarudrappa — not born in Mandya; no Jnanpith",
    set: { bornInDistrict: false, birthPlace: "Issur, Shikaripura taluk, Shivamogga district, Karnataka", notable: null },
    was: { bornInDistrict: true, birthPlace: "Devaragudda, Mandya district, Karnataka", notable: "Jnanpith Award 2006" },
    why: "Born 7 Feb 1926 in Issur, Shivamogga district. He never received the Jnanpith (named Rashtrakavi in 2006) → false 'notable' removed (finding #29).",
    source: "https://en.wikipedia.org/wiki/G._S._Shivarudrappa",
  },
  {
    finding: 28, table: "FamousPersonality", id: "cmmv9ng9i007lubxnr1labcuq", op: "update",
    label: "Mandya · K. S. Nissar Ahmed — not born in Mandya",
    set: { bornInDistrict: false, birthPlace: "Devanahalli, Karnataka" },
    was: { bornInDistrict: true, birthPlace: "Shivapur, Nagamangala, Mandya district, Karnataka" },
    why: "Born 5 Feb 1936 in Devanahalli.",
    source: "https://en.wikipedia.org/wiki/K._S._Nissar_Ahmed",
  },
  {
    finding: 28, table: "FamousPersonality", id: "cmmv9ng9i007hubxnr4axot5j", op: "update",
    label: "Mandya · Nikhil Kumaraswamy — not born in Mandya; never an MP",
    set: { bornInDistrict: false, birthPlace: "Bengaluru, Karnataka", notable: "Film actor" },
    was: { bornInDistrict: true, birthPlace: "Mandya, Mandya district, Karnataka", notable: "MP Mandya (2024) · Film Actor" },
    why: "Born 22 Jan 1988 in Bangalore. He lost Mandya in 2019 and has never been an MP (Mandya's 2024 MP is H. D. Kumaraswamy) — finding #29.",
    source: "https://en.wikipedia.org/wiki/Nikhil_Kumaraswamy",
  },
  {
    finding: 30, table: "FamousPersonality", id: "cmmv9ng9i007oubxnidiru6hs", op: "delete",
    label: "Mandya · 'N. Cheluvarayaswamy (1890–1960), social reformer'",
    why: "No record of such a person; the source 'District Gazetteer' cannot be traced. The only well-known N. Chaluvarayaswamy was born in 1960 and is a sitting minister. Whole row unfounded.",
    source: "https://en.wikipedia.org/wiki/N._Chaluvaraya_Swamy",
  },
  {
    finding: 30, table: "FamousPersonality", id: "cmmv9ng9i007nubxny6nyd2tr", op: "update",
    label: "Mandya · C. S. Puttaraju — birth year, birthplace, term",
    set: {
      birthYear: 1964, birthPlace: "Chinakurali, Mandya district, Karnataka", notable: "MP Mandya (2014–2018)",
      bio: PUTTARAJU_BIO_NEW,
    },
    was: { birthYear: 1952, birthPlace: "Mandya, Mandya district, Karnataka", notable: "MP Mandya (2014–19)", bio: PUTTARAJU_BIO_OLD },
    why: "Born 1964 in Chinakurali; MP for Mandya 16 May 2014 – 21 May 2018 (not 1952, not 2014–19).",
    source: "https://en.wikipedia.org/wiki/C._S._Puttaraju",
  },
  {
    finding: 31, table: "FamousPersonality", id: "cmmvn75da00lzmuxndewm9wvy", op: "delete",
    label: "Mysuru · 'Mysore Palace' listed as a person",
    why: "A palace is not a personality ('born 1912' was counted as born here). Whole row unfounded.",
    source: "none — not a person",
  },
  {
    finding: 31, table: "FamousPersonality", id: "cmmvn75da00lemuxnbu81bf68", op: "update",
    label: "Mysuru · Yaduveer Wadiyar — born in Bengaluru",
    set: { bornInDistrict: false, birthPlace: "Bengaluru, Karnataka" },
    was: { bornInDistrict: true, birthPlace: "Mysuru, Karnataka" },
    why: "Born 24 March 1992 in Bengaluru.",
    source: "https://en.wikipedia.org/wiki/Yaduveer_Krishnadatta_Chamaraja_Wadiyar",
  },
  {
    finding: 31, table: "FamousPersonality", id: "cmmvn75da00lqmuxns8hkkbb9", op: "hide",
    label: "Mysuru · 'K. Badarinath, national badminton champion; 1992 Olympics'",
    set: { active: false }, was: { active: true },
    why: "Hidden: India's 1992 Olympic badminton players were Deepankar Bhattacharya, Vimal Kumar and Madhumita Bisht; no record of this person's claims could be found.",
    source: "https://en.wikipedia.org/wiki/India_at_the_1992_Summer_Olympics",
  },
  {
    finding: 31, table: "FamousPersonality", id: "cmmvn75da00lvmuxn9wa0f9ye", op: "update",
    label: "Mysuru · Vishnuvardhan — 'Sahasa Simha', not 'Action King'",
    set: { notable: "Known as 'Sahasa Simha'; 200+ films", bio: VISHNUVARDHAN_BIO_NEW },
    was: { notable: "Action King of Kannada cinema; 200+ films", bio: VISHNUVARDHAN_BIO_OLD },
    why: "His titles were Sahasa Simha / Angry Young Man / Dada; 'Action King' is Arjun Sarja.",
    source: "https://en.wikipedia.org/wiki/Vishnuvardhan_(actor)",
  },
  {
    finding: 31, table: "FamousPersonality", id: "cmmvn75da00lmmuxnvhl5it6x", op: "update",
    label: "Mysuru · Mysore Manjunath — no Padma Shri; birth year not confirmed",
    set: { notable: "Carnatic violinist", birthYear: null, bio: MANJUNATH_BIO_NEW },
    was: { notable: "Padma Shri 2016; Carnatic violinist", birthYear: 1951, bio: MANJUNATH_BIO_OLD },
    why: "No Padma Shri on record; he is the son and disciple of violinist S. Mahadevappa (not M.S. Gopalakrishnan). Birth year 1951 not confirmable → hidden.",
    source: "https://en.wikipedia.org/wiki/Mysore_Manjunath",
  },
  {
    finding: 32, table: "FamousPersonality", id: "cmmvn6lm2002rmuxnxzv2m9x0", op: "update",
    label: "Bengaluru Urban · Jayamala — born in Mangaluru; not a Rajya Sabha MP",
    set: { bornInDistrict: false, birthPlace: "Mangaluru, Karnataka", birthYear: 1959, notable: null },
    was: { bornInDistrict: true, birthPlace: "Bengaluru, Karnataka", birthYear: 1958, notable: "200+ Kannada films · Rajya Sabha MP · Rajyotsava Award" },
    why: "Born 28 Feb 1959 in Mangalore; she was a Member of the Karnataka Legislative Council, never a Rajya Sabha MP → false 'notable' removed.",
    source: "https://en.wikipedia.org/wiki/Jayamala",
  },
  {
    finding: 33, table: "FamousPersonality", id: "cmntdquge002glnxncxewfpgd", op: "update",
    label: "Lucknow · Begum Hazrat Mahal — born in Faizabad",
    set: { bornInDistrict: false, birthPlace: "Faizabad" }, was: { bornInDistrict: true, birthPlace: null },
    why: "Born c. 1820 at Faizabad, not Lucknow district.",
    source: "https://en.wikipedia.org/wiki/Begum_Hazrat_Mahal",
  },
  {
    finding: 33, table: "FamousPersonality", id: "cmntdqugf002jlnxnsb16z9qv", op: "update",
    label: "Lucknow · Majaz Lakhnawi — born in Rudauli",
    set: { bornInDistrict: false, birthPlace: "Rudauli" }, was: { bornInDistrict: true, birthPlace: null },
    why: "Born 19 Oct 1911 at Rudauli, not Lucknow district.",
    source: "https://en.wikipedia.org/wiki/Majaz",
  },
  {
    finding: 34, table: "FamousPersonality", id: "cmnfm3t3q004451xn4n003gv8", op: "update",
    label: "Chennai · A. R. Rahman — born in Madras",
    set: { bornInDistrict: true, birthPlace: "Madras (now Chennai)" }, was: { bornInDistrict: false, birthPlace: null },
    why: "Born 6 January 1967 in Madras; the flag said not born here while his bio said he was.",
    source: "https://en.wikipedia.org/wiki/A._R._Rahman",
  },
  {
    finding: 34, table: "FamousPersonality", id: "cmnfm3t3q004551xnfo8yisti", op: "update",
    label: "Chennai · Viswanathan Anand — born in Mayiladuthurai",
    set: { birthPlace: "Mayiladuthurai, Tamil Nadu", bio: "Five-time World Chess Champion. Padma Vibhushan." },
    was: { birthPlace: null, bio: "Five-time World Chess Champion. Born in Chennai — India's chess capital. Padma Vibhushan." },
    why: "Born 11 Dec 1969 in Mayiladuthurai; the bio's 'Born in Chennai' is removed.",
    source: "https://en.wikipedia.org/wiki/Viswanathan_Anand",
  },
  {
    finding: 35, table: "FamousPersonality", id: "cmnfm3hc1004i3rxn089mio87", op: "delete",
    label: "Mumbai · 'Tata Family (Jamsetji to Ratan)', 1839–2024",
    why: "A family is not a person; 1839 (Jamsetji's birth, in Navsari) and 2024 (Ratan's death) belong to different people. Whole row unfounded.",
    source: "none — not a person",
  },
  {
    finding: 36, table: "FamousPersonality", id: "cmnf0n7c100351dxn55hmwplj", op: "update",
    label: "New Delhi · Bahadur Shah Zafar — born in Shahjahanabad (Old Delhi)",
    set: { bornInDistrict: false, birthPlace: "Shahjahanabad (Old Delhi)" }, was: { bornInDistrict: true, birthPlace: null },
    why: "Born 24 Oct 1775 in Shahjahanabad, which is outside New Delhi district (Chanakyapuri, Delhi Cantonment, Vasant Vihar).",
    source: "https://en.wikipedia.org/wiki/Bahadur_Shah_Zafar",
  },
  {
    finding: 37, table: "FamousPersonality", id: "cmod02llj0001k5xn08arxwy3", op: "update",
    label: "Pune · Gopal Krishna Gokhale — birthplace district",
    set: { birthPlace: "Kotluk, Guhagar taluka, Ratnagiri district" }, was: { birthPlace: "Kotluk, Kolhapur district" },
    why: "Kotluk is in Guhagar taluka, Ratnagiri district. (Not born in Pune, so not listed under the born-here rule.)",
    source: "https://en.wikipedia.org/wiki/Gopal_Krishna_Gokhale",
  },

  // ── #42  BudgetEntry — Delhi state-level round figures on New Delhi district ──
  ...([
    ["cmnf0n51k000m1dxnm5erdd86", "Education 16,000 cr"],
    ["cmnf0n51l000x1dxnt9tezzmy", "Environment & Forest 1,200 cr"],
    ["cmnf0n51l000n1dxns8os06p7", "Health & Hospitals 9,000 cr"],
    ["cmnf0n51l000v1dxnorlqla76", "Housing 2,500 cr"],
    ["cmnf0n51l000p1dxn4fsck8yj", "Police & Home (Central) 8,500 cr"],
    ["cmnf0n51l000t1dxnkq2pp1gq", "Power Subsidy 3,000 cr"],
    ["cmnf0n51l000u1dxnk182ndfw", "Public Works 3,000 cr"],
    ["cmnf0n51l000w1dxnbjk0ea5k", "Revenue & General Admin 1,500 cr"],
    ["cmnf0n51l000s1dxnnxumauo4", "Social Welfare 3,500 cr"],
    ["cmnf0n51l000o1dxnqnoks7jp", "Transport (DMRC+DTC+Roads) 8,000 cr"],
    ["cmnf0n51l000r1dxnpw79m1q9", "Urban Development 4,000 cr"],
    ["cmnf0n51l000q1dxn1lifxg8u", "Water & Sewerage (DJB) 5,000 cr"],
  ] as const).map(([id, label]): Fix => ({
    finding: 42, table: "BudgetEntry", id, op: "delete", label: `New Delhi · FY 2025-26 · ${label}`,
    why: "Round state-level Delhi figures with invented 'spent' amounts, attached to one district and shown as 'Budget given ₹65,200 crore'. Not a district budget, and they do not match the Delhi Budget 2025-26 (education ₹19,291 cr, health ₹12,893 cr). Whole row unfounded.",
    source: "https://www.tribuneindia.com/news/delhi/education-sector-gets-lions-share-in-delhis-budget-rs-19291-crore-allocated",
  })),

  // ── #38 #39  Transport — every seeded row unchecked → hidden (active=false) ──
  ...TRAIN_ROWS.map(([id, label]): Fix => ({
    finding: 38, table: "TrainSchedule", id, op: "hide", label: `train ${label}`,
    set: { active: false }, was: { active: true },
    why: "Hidden: hand/AI-seeded, never checked against NTES/IRCTC; the rows checked were mostly wrong (12608 Lalbagh from Secunderabad, 16571 'Kaveri', 14853 'Gomti', 12859 in the wrong direction …). Re-activate a row once checked. (22436 and 12050, found correct, stay shown.)",
    source: "https://en.wikipedia.org/wiki/Lalbagh_Express ; https://en.wikipedia.org/wiki/Kaveri_Express ; https://en.wikipedia.org/wiki/Gomti_Express ; https://en.wikipedia.org/wiki/Gitanjali_Express",
  })),
  ...BUS_ROWS.map(([id, label]): Fix => ({
    finding: 39, table: "BusRoute", id, op: "hide", label: `bus ${label}`,
    set: { active: false }, was: { active: true },
    why: "Hidden: seeded with invented route codes (MND-001…, MYS-1…), impossible routings (Mandya → Hassan via Sakleshpur) and conflicting fares; no KSRTC/BMTC/state feed. Re-activate a row once checked.",
    source: "none — no operator source for the seeded rows",
  })),
];

// ─────────────────────────────────────────────────────────────────────
//  Engine
// ─────────────────────────────────────────────────────────────────────
const delegateName = (table: string) => table[0].toLowerCase() + table.slice(1);
const istDay = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
const istMidnight = (d: string) => new Date(`${d}T00:00:00+05:30`);

function toDb(field: string, v: Value): unknown {
  if (typeof v === "string" && DATE_FIELDS.has(field) && /^\d{4}-\d{2}-\d{2}$/.test(v)) return istMidnight(v);
  return v;
}

/** Stable JSON for comparing JSON columns (key order and number spelling ignored). */
function canon(o: unknown): string {
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const r = o as Record<string, unknown>;
    return `{${Object.keys(r).sort().map((k) => `${JSON.stringify(k)}:${canon(r[k])}`).join(",")}}`;
  }
  if (typeof o === "number") return String(Number(o));
  return JSON.stringify(o);
}

function same(field: string, current: unknown, planned: Value): boolean {
  if (current === null || current === undefined) return planned === null;
  if (planned === null) return false;
  if (current instanceof Date) {
    if (typeof planned === "string" && /^\d{4}-\d{2}-\d{2}$/.test(planned)) return istDay(current) === planned;
    return false;
  }
  if (typeof planned === "object") return canon(current) === canon(planned);
  if (typeof planned === "number") return Math.abs(Number(current) - planned) < 1e-6;
  if (typeof planned === "boolean") return current === planned;
  return String(current) === String(planned);
}

function show(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (v instanceof Date) return istDay(v);
  if (typeof v === "string") return JSON.stringify(v.length > 90 ? v.slice(0, 87) + "…" : v);
  if (typeof v === "object") return canon(v);
  return String(v);
}

type Planned = { fix: Fix; data?: Record<string, unknown> };

async function main() {
  const seen = new Set<string>();
  for (const f of FIXES) {
    const key = `${f.table}:${f.id}`;
    if (seen.has(key)) throw new Error(`Duplicate fix for ${key}`);
    seen.add(key);
    if (f.op !== "delete" && (!f.set || Object.keys(f.set).length === 0)) throw new Error(`No fields for ${key}`);
  }

  const p = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const plan: Planned[] = [];
  const counts: Record<string, Record<"update" | "hide" | "delete" | "done" | "gone" | "drift", number>> = {};
  const tally = (t: string) => (counts[t] ??= { update: 0, hide: 0, delete: 0, done: 0, gone: 0, drift: 0 });

  try {
    let currentTable = "";
    for (const f of FIXES) {
      if (f.table !== currentTable) {
        currentTable = f.table;
        console.log(`\n══ ${f.table} ══`);
      }
      const rows = (await p.$queryRawUnsafe(`SELECT * FROM "${f.table}" WHERE id = $1`, f.id)) as Array<Record<string, unknown>>;
      const row = rows[0];
      console.log(`\n• ${f.op.toUpperCase()} ${f.table} ${f.id} — ${f.label}  [finding #${f.finding}]`);
      console.log(`  why:    ${f.why}`);
      console.log(`  source: ${f.source} (checked ${CHECKED})`);
      if (!row) {
        console.log("  → row not found (already deleted?) — skipped");
        tally(f.table).gone++;
        continue;
      }
      if (f.op === "delete") {
        console.log(`  → delete row (${show(row.name ?? row.sector ?? row.roleName ?? row.title ?? "")})`);
        plan.push({ fix: f });
        tally(f.table).delete++;
        continue;
      }
      const data: Record<string, unknown> = {};
      let drift = false;
      for (const [field, planned] of Object.entries(f.set!)) {
        if (!(field in row)) throw new Error(`${f.table}.${field} does not exist (fix ${f.id})`);
        const current = row[field];
        if (same(field, current, planned)) {
          console.log(`    ${field}: ${show(current)} (already ${show(planned)})`);
          continue;
        }
        if (f.was && field in f.was && !same(field, current, f.was[field])) {
          console.log(`    ${field}: now ${show(current)}, was ${show(f.was[field])} on ${CHECKED} — CHANGED SINCE CHECK`);
          drift = true;
          continue;
        }
        console.log(`    ${field}: ${show(current)} → ${show(planned)}${f.op === "hide" ? "  (hidden)" : ""}`);
        data[field] = toDb(field, planned);
      }
      if (drift) {
        console.log("  → a field changed since the check — whole fix skipped; review by hand");
        tally(f.table).drift++;
        continue;
      }
      if (Object.keys(data).length === 0) {
        console.log("  → already applied — skipped");
        tally(f.table).done++;
        continue;
      }
      plan.push({ fix: f, data });
      tally(f.table)[f.op]++;
    }

    console.log("\n══ Summary ══");
    for (const [t, c] of Object.entries(counts)) {
      console.log(
        `${t.padEnd(19)} update ${String(c.update).padStart(3)}   hide ${String(c.hide).padStart(3)}   delete ${String(c.delete).padStart(3)}   already done ${String(c.done).padStart(3)}   not found ${String(c.gone).padStart(3)}   changed-since-check ${String(c.drift).padStart(3)}`,
      );
    }
    console.log(`Total changes to apply: ${plan.length}`);
    console.log("hide = field set to null / row set active=false (value could not be confirmed); delete = whole row unfounded.");

    if (!CONFIRM) {
      console.log("\nDry run only. Re-run with --confirm to apply.");
      return;
    }
    if (plan.length === 0) {
      console.log("Nothing to do.");
      return;
    }

    type Delegate = {
      update: (a: unknown) => Promise<unknown>;
      updateMany: (a: unknown) => Promise<{ count: number }>;
      deleteMany: (a: unknown) => Promise<{ count: number }>;
    };
    const deletes = new Map<string, string[]>();
    const deactivations = new Map<string, string[]>();
    const updates: Planned[] = [];
    for (const item of plan) {
      const { fix, data } = item;
      if (fix.op === "delete") deletes.set(fix.table, [...(deletes.get(fix.table) ?? []), fix.id]);
      else if ((fix.table === "TrainSchedule" || fix.table === "BusRoute") && data && Object.keys(data).join() === "active" && data.active === false)
        deactivations.set(fix.table, [...(deactivations.get(fix.table) ?? []), fix.id]);
      else updates.push(item);
    }
    await p.$transaction(
      async (tx) => {
        const model = (table: string) => (tx as unknown as Record<string, Delegate>)[delegateName(table)];
        for (const { fix, data } of updates) await model(fix.table).update({ where: { id: fix.id }, data });
        for (const [table, ids] of deactivations) {
          const { count } = await model(table).updateMany({ where: { id: { in: ids }, active: true }, data: { active: false } });
          if (count !== ids.length) throw new Error(`${table}: expected to hide ${ids.length} rows, hid ${count} — rolled back`);
        }
        for (const [table, ids] of deletes) {
          const { count } = await model(table).deleteMany({ where: { id: { in: ids } } });
          if (count !== ids.length) throw new Error(`${table}: expected to delete ${ids.length} rows, deleted ${count} — rolled back`);
        }
      },
      { timeout: 600_000, maxWait: 30_000 },
    );
    console.log(`\nDone: applied ${plan.length} changes in one transaction.`);
    console.log("Then clear the Redis caches (admin → Cache) and re-run the health-score job so the report card uses the new inputs.");
  } finally {
    await p.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
