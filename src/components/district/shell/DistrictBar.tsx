/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 */

// ═══════════════════════════════════════════════════════════════════════
//  DistrictBar — the ONE bar under the site header on every district page
// ═══════════════════════════════════════════════════════════════════════
//
//   PC     [ Karnataka ▾ › Mandya ▾ › All taluks ▾ ]        3 of 5 live feeds up to date →
//   Phone  [ Karnataka ▾ › Mandya ▾ › All taluks ▾ ]  [ Topics / Weather & rain ▾ ]
//
//  • 48 px, sticky right under the 56 px header on every width.
//  • Left: state › district › taluk switchers (DistrictBreadcrumb, bar
//    variant). Phones and tablets switch in a bottom sheet, PCs in a
//    dropdown. On a phone the crumbs scroll sideways inside the bar.
//  • Right, below 1024 px (no sidebar): one button that shows the page you
//    are on and opens the topics drawer (MobileDistrictDrawer).
//  • Right, from 1024 px: a quiet link to the verification section at the
//    bottom of the page (#verify), with how many fast feeds are current.
//
//  Replaces (v5): the ticking clock / "Data behind" status strip, the
//  phone breadcrumb strip, the module bar that also showed on PCs, and the
//  breadcrumb inside the site header.
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ShieldCheck } from "lucide-react";
import DistrictBreadcrumb from "@/components/district/DistrictBreadcrumb";
import { MobileDistrictDrawer } from "@/components/district/MobileDistrictDrawer";
import { INDIA_STATES, getDistrict, getState } from "@/lib/constants/districts";
import { getStateConfig } from "@/lib/constants/state-config";
import { placeName } from "@/i18n/place-name";
import { useModuleText, usePlaceText } from "@/i18n/client";
import { useFreshness } from "@/hooks/useFreshness";
import { districtRoute } from "./path";

/** Window event other entry points can fire to open the topics drawer. */
export const OPEN_MODULES_EVENT = "ftp:open-modules-drawer";

interface Props {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Module-scope builders (plain functions, no hooks).
function peerStates() {
  return INDIA_STATES.map((s) => ({
    slug: s.slug,
    name: s.name,
    nameLocal: s.nameLocal,
    isLive: s.districts.some((d) => d.active),
  })).sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
}

function peerDistricts(stateSlug: string) {
  return (getState(stateSlug)?.districts ?? [])
    .map((d) => ({ slug: d.slug, name: d.name, nameLocal: d.nameLocal, isLive: d.active === true }))
    .sort((a, b) => (a.isLive !== b.isLive ? (a.isLive ? -1 : 1) : a.name.localeCompare(b.name)));
}

export default function DistrictBar({ locale, stateSlug, districtSlug }: Props) {
  const t = useTranslations("page_shell");
  const tu = useTranslations("subUnits");
  const mt = useModuleText();
  const place = usePlaceText();
  const lang = useLocale();
  const pathname = usePathname();
  const route = districtRoute(pathname);
  const fresh = useFreshness(stateSlug, districtSlug);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Other components can still open the drawer with a window event.
  useEffect(() => {
    const onOpen = () => setDrawerOpen(true);
    window.addEventListener(OPEN_MODULES_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MODULES_EVENT, onOpen);
  }, []);

  const stateData = getState(stateSlug);
  const districtData = getDistrict(stateSlug, districtSlug);
  if (!stateData || !districtData) return null;

  const districtLabel = placeName(districtData, lang);
  const config = getStateConfig(stateSlug);
  const unitsEn = config?.subDistrictUnitPlural ?? "Taluks";
  // Lower-casing is a no-op for Indic scripts and gives "All taluks" in English.
  const units = (tu.has(unitsEn) ? tu(unitsEn) : unitsEn).toLocaleLowerCase(lang);
  const taluk = route.taluk ? districtData.taluks.find((x) => x.slug === route.taluk) : undefined;
  const taluks = districtData.taluks.map((x) => ({ slug: x.slug, name: placeName(x, lang), nameLocal: x.nameLocal }));
  const pageName = taluk ? placeName(taluk, lang) : mt.label(route.module ?? "overview");

  const live = fresh.live;

  return (
    <>
      <div className="ftp-dbar" role="region" aria-label={t("bar.aria")}>
        <div className="ftp-dbar-inner">
          <div className="ftp-dbar-crumbs">
            <DistrictBreadcrumb
              variant="bar"
              locale={locale}
              stateSlug={stateSlug}
              stateName={place.state(stateSlug, stateData.name)}
              districtSlug={districtSlug}
              districtName={districtLabel}
              peerLiveStates={peerStates()}
              peerLiveDistricts={peerDistricts(stateSlug)}
              taluks={taluks}
              currentTalukSlug={taluk?.slug}
              currentTalukName={taluk ? placeName(taluk, lang) : undefined}
              subdivisionLabel={config?.subDistrictUnit ?? "Sub-district"}
              allSubLabel={t("bar.allSub", { units })}
            />
          </div>

          {/* Phones and tablets: the page you are on + the topics drawer. */}
          <button
            type="button"
            className="ftp-dbar-topics"
            onClick={() => setDrawerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-label={t("bar.openTopics", { page: pageName })}
          >
            <span className="ftp-dbar-topics-text">
              <span className="ftp-dbar-topics-label">{t("bar.topics")}</span>
              <span className="ftp-dbar-topics-page">{pageName}</span>
            </span>
            <ChevronDown size={16} aria-hidden />
          </button>

          {/* Laptops and PCs: a quiet link to the verification section. */}
          <a href="#verify" className="ftp-dbar-fresh" data-late={live && live.current < live.total ? "true" : undefined}>
            <ShieldCheck size={14} aria-hidden />
            <span>
              {live && live.total > 0
                ? live.current === live.total
                  ? t("bar.liveFeedsAll", { total: live.total })
                  : t("bar.liveFeeds", { current: live.current, total: live.total })
                : t("bar.howFresh")}
            </span>
          </a>
        </div>
      </div>

      <MobileDistrictDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        locale={locale}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
        districtName={districtLabel}
        activeSlug={route.module ?? undefined}
      />
    </>
  );
}
