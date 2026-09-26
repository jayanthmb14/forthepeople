/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

// ═══════════════════════════════════════════════════════════
// Dam-to-District Mapping — Which reservoirs serve which districts
// Data from India-WRIS, CWC, and state water resource departments
// maxStorage in TMC (Thousand Million Cubic feet) or MCM as noted
// ═══════════════════════════════════════════════════════════

export interface DamConfig {
  name: string;
  nameLocal?: string;
  maxLevel: number; // Full Reservoir Level in feet
  maxStorage: number; // MCM (Million Cubic Metres)
  river?: string;
}

export interface DistrictDamConfig {
  dams: DamConfig[];
  source: string;
  statePortalUrl?: string;
}

export const DISTRICT_DAM_MAP: Record<string, DistrictDamConfig> = {
  // ── Karnataka ──────────────────────────────────────────
  mandya: {
    dams: [
      { name: "KRS (Krishna Raja Sagara)", nameLocal: "ಕೃಷ್ಣರಾಜ ಸಾಗರ", maxLevel: 124.80, maxStorage: 1400, river: "Cauvery" },
      { name: "Hemavathy Dam", nameLocal: "ಹೇಮಾವತಿ ಜಲಾಶಯ", maxLevel: 2922, maxStorage: 1048, river: "Hemavathy" },
    ],
    source: "Karnataka Water Resources Department / India-WRIS",
    statePortalUrl: "https://waterresources.karnataka.gov.in",
  },
  mysuru: {
    dams: [
      { name: "KRS (Krishna Raja Sagara)", maxLevel: 124.80, maxStorage: 1400, river: "Cauvery" },
      { name: "Kabini Dam", nameLocal: "ಕಬಿನಿ ಜಲಾಶಯ", maxLevel: 2284, maxStorage: 553, river: "Kabini" },
    ],
    source: "Karnataka Water Resources Department / India-WRIS",
    statePortalUrl: "https://waterresources.karnataka.gov.in",
  },
  "bengaluru-urban": {
    dams: [
      { name: "KRS (Krishna Raja Sagara)", maxLevel: 124.80, maxStorage: 1400, river: "Cauvery" },
      { name: "TG Halli Reservoir", maxLevel: 0, maxStorage: 90, river: "Arkavathy" },
    ],
    source: "Karnataka Water Resources Department / BWSSB",
    statePortalUrl: "https://waterresources.karnataka.gov.in",
  },

  // ── Telangana ──────────────────────────────────────────
  hyderabad: {
    dams: [
      { name: "Osmansagar", nameLocal: "ఉస్మాన్ సాగర్", maxLevel: 1790, maxStorage: 110, river: "Musi" },
      { name: "Himayatsagar", nameLocal: "హిమాయత్ సాగర్", maxLevel: 1763, maxStorage: 85, river: "Esi" },
      { name: "Nagarjunasagar", nameLocal: "నాగార్జున సాగర్", maxLevel: 590, maxStorage: 11560, river: "Krishna" },
    ],
    source: "Telangana Irrigation Department / India-WRIS",
    statePortalUrl: "https://irrigation.telangana.gov.in",
  },

  // ── Maharashtra ────────────────────────────────────────
  mumbai: {
    dams: [
      { name: "Upper Vaitarna Dam", maxLevel: 0, maxStorage: 220, river: "Vaitarna" },
      { name: "Bhatsa Dam", maxLevel: 0, maxStorage: 290, river: "Bhatsa" },
      { name: "Tansa Dam", maxLevel: 0, maxStorage: 144, river: "Tansa" },
      { name: "Middle Vaitarna Dam", maxLevel: 0, maxStorage: 190, river: "Vaitarna" },
      { name: "Modak Sagar Dam", maxLevel: 0, maxStorage: 130, river: "Barvi" },
      { name: "Tulsi Lake", maxLevel: 0, maxStorage: 34, river: "Tulsi" },
      { name: "Vihar Lake", maxLevel: 0, maxStorage: 28, river: "Vihar" },
    ],
    source: "MCGM Hydraulic Department / India-WRIS",
  },

  // ── Delhi ──────────────────────────────────────────────
  "new-delhi": {
    dams: [],
    source: "Delhi Jal Board — water sourced from Yamuna river, Bhakra storage, and Upper Ganga Canal. No reservoirs within district.",
  },

  // ── West Bengal ────────────────────────────────────────
  kolkata: {
    dams: [],
    source: "KMC Water Supply — water sourced from Hooghly river (tributary of Ganges). No reservoirs within district.",
  },

  // ── Tamil Nadu ─────────────────────────────────────────
  chennai: {
    dams: [
      { name: "Poondi Reservoir", maxLevel: 0, maxStorage: 99, river: "Kosasthalaiyar" },
      { name: "Cholavaram Tank", maxLevel: 0, maxStorage: 30, river: "Korattalaiyar" },
      { name: "Red Hills Lake", maxLevel: 0, maxStorage: 94, river: "Korattalaiyar" },
      { name: "Chembarambakkam Lake", maxLevel: 0, maxStorage: 103, river: "Adyar" },
    ],
    source: "Chennai Metropolitan Water Supply / India-WRIS",
  },
};

// Get dam config for a district. Returns null if no dams configured.
export function getDamConfig(districtSlug: string): DistrictDamConfig | null {
  return DISTRICT_DAM_MAP[districtSlug] ?? null;
}
