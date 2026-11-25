import "server-only";

import { simulatedRivals, type SimulatedRival } from "@/lib/leaderboard-bots";
import { gameDatabase } from "./anonymous-identity";
import { flagFormat } from "./quick-sessions";

export async function seedRivalsForGame(slug:string,dateKey:string):Promise<void> {
  const {count}=await gameDatabase().from('countrivo_bot_runs').select('*',{count:'exact',head:true}).eq('game_slug',slug).eq('date_key',dateKey);
  if(count&&count>0)return;
  const rows=simulatedRivals(slug,dateKey).map(r=>({game_slug:slug,date_key:dateKey,display_name:r.name,score_display:r.score,score_sort_value:r.sort,is_bot:true}));
  const {error}=await gameDatabase().from('countrivo_bot_runs').upsert(rows,{onConflict:'game_slug,date_key,display_name',ignoreDuplicates:true});
  if(error)throw new Error('Could not save simulated rivals');
}

/** Simulations are deterministic illustrations, so reading a database adds no value. */
export async function getSimulatedRivals(slug:string,dateKey:string,edition?:string):Promise<SimulatedRival[]> {
  // A Flag Quiz day frozen under the ten-flag quiz keeps rivals in its own points.
  if(slug==='flag-quiz'&&edition!==undefined)return simulatedRivals(slug,dateKey,await flagFormat('daily',dateKey,edition));
  return simulatedRivals(slug,dateKey);
}
