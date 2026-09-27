/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

// ═══════════════════════════════════════════════════════════
//  NoDataCard — the honest "no data yet" block for a module page.
//  Design v3: renders the kit <EmptyState> (one honest sentence as the
//  title, what is being done about it as the body). No amber box, no
//  stripe. The per-module wording below is unchanged from v2.
// ═══════════════════════════════════════════════════════════

import { EmptyState } from "@/components/district/ui";
import { getStateConfig } from "@/lib/constants/state-config";
import type { StateConfig } from "@/lib/constants/state-config";

interface NoDataCardProps {
  module: string;
  district: string;
  state: string;
  isUrban?: boolean;
  customMessage?: string;
}

function getNoDataMessage(
  module: string,
  district: string,
  state: string,
  stateConfig: StateConfig | null,
  isUrban: boolean
): { title: string; body: string } {
  const discom = stateConfig?.discomFullName ?? "the local electricity provider";
  const waterPortal = stateConfig?.waterPortalName ?? "the state water resources department";
  const transport = stateConfig?.stateTransportFullName ?? "the state transport corporation";
  const districtName = district.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const messages: Record<string, { title: string; body: string }> = {
    water: {
      title: "Dam & reservoir data being prepared",
      body: `Water supply data for ${districtName} is being collected from ${waterPortal} and India-WRIS. Dam levels, inflow/outflow, and canal release data will appear here once integration is complete.`,
    },
    crops: isUrban
      ? {
          title: "No agricultural markets in this district",
          body: `${districtName} is a fully urban district with no registered APMC (Agricultural Produce Market Committee) mandis. Crop price data is not applicable here.`,
        }
      : {
          title: "Crop price data being collected",
          body: `Daily mandi prices from AGMARKNET for ${districtName} are being integrated. Prices for major crops will appear here once data collection begins.`,
        },
    power: {
      title: "Power outage tracking being integrated",
      body: `Scheduled power outage data from ${discom} is being integrated. For current outage information, visit the official portal${stateConfig?.discomPortalUrl ? ` at ${stateConfig.discomPortalUrl}` : ""}.`,
    },
    farm: isUrban
      ? {
          title: "Not applicable for urban districts",
          body: `${districtName} is a fully urban district. Soil health cards, crop advisories, and KVK agricultural data are relevant for rural and semi-rural districts.`,
        }
      : {
          title: "Farm advisory data being collected",
          body: `Soil health records and crop advisories from the local KVK (Krishi Vigyan Kendra) and ICAR network are being collected for ${districtName}.`,
        },
    "gram-panchayat": isUrban
      ? {
          title: "Not applicable for urban districts",
          body: `${districtName} is a fully urban district governed by a Municipal Corporation. Gram Panchayat and MGNREGA data applies only to rural areas.`,
        }
      : {
          title: "Panchayat data being collected",
          body: `Village-level MGNREGA works and fund utilisation data from eGramSwaraj is being collected for ${districtName}.`,
        },
    jjm: isUrban
      ? {
          title: "Not applicable for urban districts",
          body: `Jal Jeevan Mission provides tap water connections to rural households. ${districtName} is urban — its water supply is managed by the municipal water board.`,
        }
      : {
          title: "JJM coverage data being collected",
          body: `Tap water connection data from the Jal Jeevan Mission national dashboard (eJalShakti) is being collected for ${districtName}.`,
        },
    police: {
      title: "Crime statistics being collected",
      body: `Crime data from NCRB (National Crime Records Bureau) and traffic revenue data for ${districtName} are being collected. NCRB publishes district-level data annually.`,
    },
    transport: {
      title: "Transport data being collected",
      body: `Bus routes from ${transport} and train schedules from IRCTC for ${districtName} are being integrated.`,
    },
    finance: {
      title: "Budget expenditure data being collected",
      body: `Detailed budget allocation and expenditure data from PFMS and the state treasury for ${districtName} is being collected.`,
    },
    housing: {
      title: "Housing scheme data being collected",
      body: `PMAY (Pradhan Mantri Awas Yojana) housing data from AwaasSoft for ${districtName} is being collected.`,
    },
    schools: {
      title: "School data being collected",
      body: `School directory and board exam pass rate data from UDISE+ for ${districtName} is being collected.`,
    },
    courts: {
      title: "Court statistics being collected",
      body: `Case pendency and disposal data from the National Judicial Data Grid (NJDG) for ${districtName} is being collected.`,
    },
    rti: {
      title: "RTI filing data being collected",
      body: `RTI filing statistics and department-wise response data for ${districtName} are being collected from official RTI portals.`,
    },
    elections: {
      title: "Election data being collected",
      body: `Election results and voter data from the Election Commission of India for ${districtName} constituencies are being collected.`,
    },
    health: {
      title: "Health facility data being collected",
      body: `Hospital directory, bed counts, and doctor-patient ratios from the National Health Mission for ${districtName} are being collected.`,
    },
    industries: {
      title: "Industry data being collected",
      body: `Major employers, industrial clusters, and economic data for ${districtName} are being collected from the District Industries Centre.`,
    },
    infrastructure: {
      title: "Infrastructure project data being collected",
      body: `Ongoing government infrastructure projects (roads, bridges, buildings) from PMGSY and state PWD for ${districtName} are being collected.`,
    },
    news: {
      title: "Local news being collected",
      body: `News articles from regional media sources for ${districtName} are collected via Google News RSS. Articles will appear here once the news pipeline starts covering this district.`,
    },
    schemes: {
      title: "Government scheme data being collected",
      body: `Central and state government scheme data from MyScheme.gov.in and state portals for ${districtName} is being collected.`,
    },
    "famous-personalities": {
      title: "Notable personalities being added",
      body: `Information about notable people from ${districtName} is being compiled from verified sources including Wikipedia (CC-BY-SA licensed).`,
    },
    offices: {
      title: "Government office directory being compiled",
      body: `Contact details and addresses for government offices in ${districtName} are being compiled from official state portals.`,
    },
    "citizen-corner": {
      title: "Citizen tips being generated",
      body: `AI-powered civic tips and citizen advisories for ${districtName} will appear here once enough district data has been collected.`,
    },
    alerts: {
      title: "No active alerts",
      body: `There are currently no weather warnings, civic alerts, or emergency advisories for ${districtName}. Alerts are collected from IMD, NDMA, and district administration sources.`,
    },
    exams: {
      title: "Government exam notifications being collected",
      body: `Exam notifications from UPSC, SSC, state PSC, and recruitment boards relevant to ${districtName} are being collected.`,
    },
    weather: {
      title: "Weather data being collected",
      body: `Live weather readings from India Meteorological Department (IMD) and OpenWeatherMap for ${districtName} are being integrated.`,
    },
    population: {
      title: "Population data being compiled",
      body: `Census 2011 population data and 2026 estimates for ${districtName} are being compiled. Census 2027 is under way; its figures will be added after the official release.`,
    },
  };

  return (
    messages[module] ?? {
      title: "Data being collected",
      body: `Data for this module is being collected from official government portals for ${districtName}. It will appear here once available.`,
    }
  );
}

export default function NoDataCard({ module, district, state, isUrban = false, customMessage }: NoDataCardProps) {
  const stateConfig = getStateConfig(state);
  const { title, body } = customMessage
    ? { title: "Data being collected", body: customMessage }
    : getNoDataMessage(module, district, state, stateConfig, isUrban);

  return (
    <div style={{ marginBottom: 20 }}>
      <EmptyState
        title={title}
        body={body}
        action={
          <p style={{ fontSize: 11, lineHeight: "16px", color: "var(--ftp-text-2)", margin: 0 }}>
            Data is sourced from official government portals under India&apos;s Open Data Policy (NDSAP).
          </p>
        }
      />
    </div>
  );
}
