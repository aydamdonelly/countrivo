import type { Country } from "@/types/country";

interface CountryRevealProps {
  country: Country;
  step: number;
}

export function CountryReveal({ country, step }: CountryRevealProps) {
  return (
    <div
      key={`${country.iso3}-${step}`}
      className="flex flex-col items-center py-10 sm:py-14 animate-in"
    >
      <span className="text-[6rem] sm:text-[8rem] lg:text-[10rem] leading-none mb-4">{country.flagEmoji}</span>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text">
        {country.displayName}
      </h2>
      <p className="text-base sm:text-lg text-text-muted mt-2">
        {country.continent} &middot; {country.subregion}
      </p>
    </div>
  );
}
