/**
 * ForThePeople.in — One-line role descriptions for the leadership page.
 *
 * Adding a new role anywhere in the system only needs an entry here.
 * Lookup is exact-string first, then a normalized contains-match
 * (e.g. "MLA, Mandya" → "Member of Legislative Assembly"). Unknown
 * roles get a calm generic fallback so the card never looks broken.
 */

const ROLE_DESCRIPTIONS: Record<string, string> = {
  "President of India":
    "Constitutional head of state. Appoints the PM, Governors, and judges. Commander-in-chief of armed forces.",
  "Prime Minister":
    "Head of government. Leads the Union Cabinet, sets national policy and represents India globally.",
  "Governor":
    "Constitutional head of the state. Appoints CM, can dissolve state assembly, gives assent to state bills.",
  "Lieutenant Governor":
    "Centre-appointed administrator of a Union Territory. Acts as the constitutional head and approves UT laws.",
  "Chief Minister":
    "Head of state government. Leads the state cabinet, controls state budgets and policy implementation.",
  "Deputy Chief Minister":
    "Second-in-command of the state cabinet. Often holds key portfolios alongside the CM.",
  "Member of Parliament (Lok Sabha)":
    "Elected representative in the lower house. Votes on national laws, budgets and holds the government accountable.",
  "Member of Parliament":
    "Elected representative in Parliament. Votes on national laws, budgets and holds the government accountable.",
  "Member of Legislative Assembly":
    "Elected state representative. Votes on state laws, raises district issues in the assembly and oversees local governance.",
  "MLA":
    "Elected state representative. Votes on state laws, raises district issues in the assembly and oversees local governance.",
  "Union Minister":
    "Member of the central cabinet. Heads a ministry and makes national policy in their portfolio.",
  "Union Minister of State":
    "Junior central minister. Assists a Cabinet Minister in running a national ministry.",
  "Cabinet Minister":
    "State or Union cabinet member. Heads a department/ministry and makes policy within that portfolio.",
  "District Collector":
    "Senior-most bureaucrat in the district. Handles land revenue, law and order, disaster relief and coordinates all government departments.",
  "Deputy Commissioner":
    "Senior-most IAS officer managing district administration. Equivalent to District Collector in many states.",
  "District Magistrate":
    "Senior IAS officer with magisterial powers. Handles land revenue, public order and coordinates district departments.",
  "Superintendent of Police":
    "Head of district police. Responsible for law enforcement, crime prevention and maintaining public order.",
  "Commissioner of Police":
    "Head of city police in commissionerate cities. Same responsibilities as SP but for metropolitan areas.",
  "Deputy Commissioner of Police":
    "Senior IPS officer in charge of a city police zone. Reports to the Commissioner of Police.",
  "CEO, Zilla Panchayat":
    "Chief executive of the district's rural local government. Manages MGNREGA, rural roads, water supply and village development.",
  "Municipal Commissioner":
    "Head of city municipal corporation. Manages civic infrastructure, water, sanitation, roads and urban planning.",
  "Mayor":
    "Elected head of the municipal corporation. Chairs council meetings and represents the city.",
  "Chief Justice":
    "Senior-most judge of the High Court. Heads the state's judiciary and assigns benches.",
  "Chief Secretary":
    "Senior-most IAS officer in the state. Heads the state civil service and coordinates all departments.",
  "Managing Director":
    "Head of a state public-sector undertaking or development authority. Runs day-to-day operations.",
  "Chairman":
    "Top governing officer of a board, authority or commission. Sets strategic direction.",
  "Tahsildar":
    "Sub-district revenue officer. Handles land records, mutations and revenue collection at the taluk level.",
};

const FALLBACK = "Government official serving the district.";

// For partial / decorated roles like "MLA, Mandya" or "Union Minister
// for Heavy Industries & Steel; MP, Mandya" — try the longest matching
// key after splitting on , ; and (
function bestKeyMatch(role: string): string | null {
  const head = role.split(/[,;(]/)[0].trim();
  if (ROLE_DESCRIPTIONS[head]) return head;
  const lower = head.toLowerCase();
  for (const k of Object.keys(ROLE_DESCRIPTIONS)) {
    if (lower.startsWith(k.toLowerCase())) return k;
  }
  for (const k of Object.keys(ROLE_DESCRIPTIONS)) {
    if (lower.includes(k.toLowerCase())) return k;
  }
  // "Union Minister …; MP, Mandya" → MP / Member of Parliament
  if (/\bmp\b|\bunion minister\b/i.test(role)) return "Member of Parliament";
  if (/\bmla\b|\bmember of legislative\b/i.test(role)) return "Member of Legislative Assembly";
  return null;
}

export function getRoleDescription(role: string | null | undefined): string {
  if (!role) return FALLBACK;
  if (ROLE_DESCRIPTIONS[role]) return ROLE_DESCRIPTIONS[role];
  const key = bestKeyMatch(role);
  return key ? ROLE_DESCRIPTIONS[key] : FALLBACK;
}

/**
 * Message id of the matched description, for translated pages:
 * "CEO, Zilla Panchayat" → "ceo-zilla-panchayat" (the leadership page reads
 * `roles.<id>` from its messages). Null when only the fallback applies.
 */
export function getRoleDescriptionId(role: string | null | undefined): string | null {
  if (!role) return null;
  const key = ROLE_DESCRIPTIONS[role] ? role : bestKeyMatch(role);
  return key ? roleKeyToId(key) : null;
}

/**
 * Message id for a description that was copied onto a Leader row from this
 * table (the seed stores the English text), so it can still be translated.
 * Null when the stored text is custom.
 */
export function getRoleDescriptionIdForText(text: string | null | undefined): string | null {
  const wanted = text?.trim();
  if (!wanted) return null;
  const key = Object.keys(ROLE_DESCRIPTIONS).find((k) => ROLE_DESCRIPTIONS[k] === wanted);
  return key ? roleKeyToId(key) : null;
}

function roleKeyToId(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export { ROLE_DESCRIPTIONS };
