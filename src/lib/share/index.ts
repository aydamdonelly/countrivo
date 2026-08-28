/**
 * Clipboard share builders (moved from src/components/share, output byte-identical).
 * These strings carry the coloured squares for the clipboard and are never rendered
 * on screen; the only emoji in the code base live here.
 */
export { buildShareGrid, gameShareUrl, formatBrandDate, dailyNumber, ordinal } from "./share-utils";
export { buildCountryDraftShareText, type CountryDraftShareInput } from "./country-draft";
export { buildGeoWordleShareText, type GeoWordleShareInput } from "./geo-wordle";
export { buildStatGuesserShareText, type StatGuesserShareInput } from "./stat-guesser";
