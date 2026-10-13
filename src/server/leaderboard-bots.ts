import "server-only";

import { createClient } from "@supabase/supabase-js";
import { simulatedRivals, type SimulatedRival } from "@/lib/leaderboard-bots";
import { gameDatabase } from "./anonymous-identity";

export async function seedRivalsForGame(slug:string,dateKey:string):Promise<void> {
  const {count}=await gameDatabase().from('countrivo_bot_runs').select('*',{count:'exact',head:true}).eq('game_slug',slug).eq('date_key',dateKey);
  if(count&&count>0)return;
  const rows=simulatedRivals(slug,dateKey).map(r=>({game_slug:slug,date_key:dateKey,display_name:r.name,score_display:r.score,score_sort_value:r.sort,is_bot:true}));
  const {error}=await gameDatabase().from('countrivo_bot_runs').upsert(rows,{onConflict:'game_slug,date_key,display_name',ignoreDuplicates:true});
  if(error)throw new Error('Could not save simulated rivals');
}

export async function getSimulatedRivals(slug:string,dateKey:string):Promise<SimulatedRival[]> {
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false}});
  const {data}=await db.from('countrivo_bot_runs').select('display_name,score_display,score_sort_value').eq('game_slug',slug).eq('date_key',dateKey)
    .order('score_sort_value',{ascending:false}).returns<{display_name:string;score_display:string;score_sort_value:number}[]>();
  return (data??[]).map(r=>({name:r.display_name,score:r.score_display,sort:Number(r.score_sort_value),isBot:true}));
}
