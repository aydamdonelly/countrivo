import { createElement } from "react";
import type { GlyphProps } from "../glyph";
import { HashIcon } from "../hash";
import { PopulationIcon } from "./population";
import { AreaIcon } from "./area-km2";
import { GdpPerCapitaIcon } from "./gdp-per-capita";
import { GdpIcon } from "./gdp";
import { LifeExpectancyIcon } from "./life-expectancy";
import { UrbanIcon } from "./urban-population-pct";
import { InternetIcon } from "./internet-users-pct";
import { FertilityIcon } from "./fertility-rate";
import { TourismIcon } from "./tourism-arrivals";
import { ForestIcon } from "./forest-coverage-pct";
import { UnemploymentIcon } from "./unemployment-rate";
import { MilitaryIcon } from "./military-spending-pct";
import { RenewableIcon } from "./renewable-energy-pct";
import { InflationIcon } from "./inflation-rate";
import { BeerIcon } from "./beer-consumption-per-capita";
import { CoffeeIcon } from "./coffee-consumption-per-capita";
import { WineIcon } from "./wine-consumption-per-capita";
import { EducationIcon } from "./education-spending-pct";
import { HealthIcon } from "./health-spending-pct";
import { ArableIcon } from "./arable-land-pct";
import { FdiIcon } from "./fdi-inflow";

/** One drawn icon per statistic category (blueprint 4.5), keyed by category slug. */
export const STAT_ICONS = {
  population: PopulationIcon,
  "area-km2": AreaIcon,
  "gdp-per-capita": GdpPerCapitaIcon,
  gdp: GdpIcon,
  "life-expectancy": LifeExpectancyIcon,
  "urban-population-pct": UrbanIcon,
  "internet-users-pct": InternetIcon,
  "fertility-rate": FertilityIcon,
  "tourism-arrivals": TourismIcon,
  "forest-coverage-pct": ForestIcon,
  "unemployment-rate": UnemploymentIcon,
  "military-spending-pct": MilitaryIcon,
  "renewable-energy-pct": RenewableIcon,
  "inflation-rate": InflationIcon,
  "beer-consumption-per-capita": BeerIcon,
  "coffee-consumption-per-capita": CoffeeIcon,
  "wine-consumption-per-capita": WineIcon,
  "education-spending-pct": EducationIcon,
  "health-spending-pct": HealthIcon,
  "arable-land-pct": ArableIcon,
  "fdi-inflow": FdiIcon,
} as const;

export type StatSlug = keyof typeof STAT_ICONS;

export const STAT_SLUGS = Object.keys(STAT_ICONS) as StatSlug[];

export interface StatIconProps extends GlyphProps {
  /** A category slug; an unknown slug draws the hash (the number sign). */
  slug: string;
}

/** `<StatIcon slug size=20 />` (blueprint 4.5). */
export function StatIcon({ slug, size = 20, ...rest }: StatIconProps) {
  const C = (STAT_ICONS as Record<string, typeof HashIcon>)[slug] ?? HashIcon;
  return createElement(C, { size, ...rest });
}
