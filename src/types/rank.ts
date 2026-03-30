// ranks[iso3][categorySlug] = rank number (1 = highest value)
export type RankMap = Record<string, Record<string, number>>;

// stats[iso3][categorySlug] = raw numeric value
export type StatMap = Record<string, Record<string, number | null>>;
