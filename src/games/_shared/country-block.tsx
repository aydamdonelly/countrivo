import { Subject } from "@/ui/subject";
import type { Country } from "@/types/country";
import { countryMeta } from "./format";

export interface CountryBlockProps {
  country: Country;
  /** Replaces the `Americas · South America` line. */
  meta?: string;
  /** Plays the reveal on mount (the host re-keys the block on change). */
  animate?: boolean;
  /** The country name when it is information; "" when naming it would leak an answer. */
  alt?: string;
}

/** The default Subject for a country: Flag l, the name in Erode 30, the region line (blueprint 3.20). */
export function CountryBlock({ country, meta, animate, alt }: CountryBlockProps) {
  return <Subject iso2={country.iso2} name={country.displayName} meta={meta ?? countryMeta(country)} animate={animate} alt={alt ?? ""} />;
}
