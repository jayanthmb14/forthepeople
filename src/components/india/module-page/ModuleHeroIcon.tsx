/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License.
 *
 * Per-module Lucide icon used in the hero tile when no heroImage is set.
 * Replaces the Phase 2.5d hand-drawn SVG library — those tigers looked
 * like cartoon dogs and the fisheries SVG was the same shape recoloured
 * green. The fix is to stop trying.
 *
 * To upgrade a module to a real photograph, set heroImage on the
 * IndiaModuleDef registry entry — ModuleHero.tsx prefers heroImage when
 * set and ignores this icon.
 */

"use client";

import {
  AlertTriangle,
  Atom,
  BadgeCheck,
  Banknote,
  BarChart3,
  Beef,
  Briefcase,
  Building,
  Building2,
  CarFront,
  Castle,
  Factory,
  Fish,
  Flag,
  Fuel,
  Globe,
  GraduationCap,
  Heart,
  IndianRupee,
  KeyRound,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  MapPin,
  Medal,
  Mountain,
  Package,
  PawPrint,
  Plane,
  Radio,
  Receipt,
  Rocket,
  Scale,
  School,
  Shield,
  Ship,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Sun,
  Syringe,
  Tag,
  Train,
  TreeDeciduous,
  TrendingUp,
  Trophy,
  Users,
  Vote,
  Wheat,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_BY_SLUG: Record<string, LucideIcon> = {
  "wildlife-tigers": PawPrint,
  "wildlife-forests": TreeDeciduous,
  "wildlife-protected-areas": Mountain,
  "livestock-census": Beef,
  "livestock-fisheries": Fish,
  "agriculture-production": Wheat,
  "agriculture-pmkisan": IndianRupee,
  "agriculture-plantation": Leaf,
  "demographics-population": Users,
  "economy-gdp": TrendingUp,
  "economy-inflation": ShoppingCart,
  "economy-employment": Briefcase,
  "budget-union": Landmark,
  "budget-gst": Receipt,
  "infra-roads": CarFront,
  "infra-railways": Train,
  "infra-aviation": Plane,
  "infra-ports": Ship,
  "infra-telecom": Radio,
  "infra-smart-cities": Building2,
  "energy-power": Zap,
  "energy-renewables": Sun,
  "energy-fuels": Fuel,
  "energy-coal": Mountain,
  "health-overview": Stethoscope,
  "health-pmjay": Heart,
  "health-immunisation": Syringe,
  "education-schools": School,
  "education-higher": GraduationCap,
  "education-skills": Wrench,
  "defence-budget": Shield,
  "defence-exports": Package,
  "defence-dpsu": Factory,
  "justice-pendency": Scale,
  "justice-crime": AlertTriangle,
  "justice-police": BadgeCheck,
  "justice-prisons": KeyRound,
  "elections-loksabha": Vote,
  "elections-rajyasabha": Building,
  "elections-turnout": BarChart3,
  "science-isro": Rocket,
  "science-rd": Atom,
  "science-startups": Lightbulb,
  "science-digital": Smartphone,
  "trade-overview": Globe,
  "trade-fdi": Banknote,
  "trade-diaspora": Plane,
  "tourism-overview": MapPin,
  "tourism-heritage": Castle,
  "tourism-gi-tags": Tag,
  "sports-olympics": Medal,
  "sports-khelo-india": Trophy,
  "national-snapshot": Flag,
};

export default function ModuleHeroIcon({
  slug,
  accent,
  size = 96,
}: {
  slug: string;
  accent: string;
  size?: number;
}) {
  const Icon = ICON_BY_SLUG[slug] ?? Layers;
  return <Icon size={size} color={accent} strokeWidth={1.5} aria-hidden="true" />;
}
