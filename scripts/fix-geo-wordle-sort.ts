// One-off, idempotent: re-sort saved GeoWordle wins on the 7 - n scale (25 November 2026).
// Before, a win in six (6/6) and a miss (X/6) both sorted at 0 and shared a place.
// Run: node --env-file=.env.local --import tsx scripts/fix-geo-wordle-sort.ts [--apply]
import { createClient } from "@supabase/supabase-js";

const PROJECT = "iktrrzeewcgrhdzkhlvl";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.COUNTRIVO_SUPABASE_SERVICE_KEY ?? "";
if (!url.includes(PROJECT)) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not the Countrivo project");
if (!key) throw new Error("COUNTRIVO_SUPABASE_SERVICE_KEY is missing");
const ref = (() => { try { return JSON.parse(Buffer.from(key.split(".")[1] ?? "", "base64url").toString()).ref as unknown; } catch { return null; } })();
if (ref !== null && ref !== PROJECT) throw new Error(`The service key belongs to project ${String(ref)}`);
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes("--apply");
async function main(): Promise<void> {
let total = 0;
for (let used = 1; used <= 6; used++) {
  const query = () => db.from("countrivo_runs").select("id", { count: "exact", head: true })
    .eq("game_slug", "geo-wordle").eq("score_raw", used).eq("score_display", `${used}/6`).eq("score_sort_value", 6 - used);
  const { count, error } = await query();
  if (error) throw new Error(error.message);
  console.log(`${used}/6: ${count ?? 0} rows on the old scale (${6 - used} -> ${7 - used})`);
  total += count ?? 0;
  if (apply && count) {
    const { error: updateError } = await db.from("countrivo_runs").update({ score_sort_value: 7 - used })
      .eq("game_slug", "geo-wordle").eq("score_raw", used).eq("score_display", `${used}/6`).eq("score_sort_value", 6 - used);
    if (updateError) throw new Error(updateError.message);
  }
}
console.log(`${apply ? "Updated" : "Would update"} ${total} rows. Misses (X/6) stay at 0.`);
}
void main();
