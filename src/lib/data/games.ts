// Re-export the registry accessors from the lightweight module so server
// importers keep working unchanged while client components can import from
// "@/lib/data/registry" directly to avoid pulling in countries/categories JSON.
export {
  gameRegistry,
  getAllGames,
  getGameBySlug,
  getFlagshipGame,
  getMainGames,
  getDrillGames,
} from "./registry";
