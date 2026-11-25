export interface Country {
  iso2: string;
  iso3: string;
  name: string;
  displayName: string;
  slug: string;
  region: string;
  subregion: string;
  continent: string;
  flagSvgPath: string;
  capital: string;
  borders: string[];
}

export type CountryMap = Record<string, Country>;

/** A sovereign country a player may show next to a published name. */
export interface FlagPlace {
  iso3: string;
  iso2: string;
  name: string;
}
