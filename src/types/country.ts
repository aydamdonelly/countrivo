export interface Country {
  iso2: string;
  iso3: string;
  name: string;
  displayName: string;
  slug: string;
  region: string;
  subregion: string;
  continent: string;
  flagEmoji: string;
  flagSvgPath: string;
  capital: string;
  borders: string[];
}

export type CountryMap = Record<string, Country>;
