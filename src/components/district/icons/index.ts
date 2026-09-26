/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Session 19 Phase D — district slug → icon registry.
 *
 * Each active district gets a small SVG icon evocative of its identity.
 * Used by the homepage HeroSection district rows + (optionally) by
 * DistrictHeroIllustration on each district overview page.
 */

import type React from "react";
import { SugarCaneIcon, type DistrictIconProps } from "./SugarCaneIcon";
import { CharminarIcon } from "./CharminarIcon";
import { IndiaGateIcon } from "./IndiaGateIcon";
import { GatewayOfIndiaIcon } from "./GatewayOfIndiaIcon";
import { HowrahBridgeIcon } from "./HowrahBridgeIcon";
import { CircuitIcon } from "./CircuitIcon";
import { MysorePalaceIcon } from "./MysorePalaceIcon";
import { ImambaraIcon } from "./ImambaraIcon";
import { ShaniwarWadaIcon } from "./ShaniwarWadaIcon";
import { MarinaTempleIcon } from "./MarinaTempleIcon";

export type { DistrictIconProps };

type DistrictIcon = React.FC<DistrictIconProps>;

export const DISTRICT_ICONS: Record<string, DistrictIcon> = {
  "mandya": SugarCaneIcon,
  "hyderabad": CharminarIcon,
  "new-delhi": IndiaGateIcon,
  "mumbai": GatewayOfIndiaIcon,
  "kolkata": HowrahBridgeIcon,
  "bengaluru-urban": CircuitIcon,
  "mysuru": MysorePalaceIcon,
  "lucknow": ImambaraIcon,
  "pune": ShaniwarWadaIcon,
  "chennai": MarinaTempleIcon,
};

export function getDistrictIcon(slug: string): DistrictIcon | null {
  return DISTRICT_ICONS[slug] ?? null;
}

export {
  SugarCaneIcon,
  CharminarIcon,
  IndiaGateIcon,
  GatewayOfIndiaIcon,
  HowrahBridgeIcon,
  CircuitIcon,
  MysorePalaceIcon,
  ImambaraIcon,
  ShaniwarWadaIcon,
  MarinaTempleIcon,
};
