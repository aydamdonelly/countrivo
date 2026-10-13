import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getTodayDateKey } from "../src/lib/daily-seed";
import { simulatedRivals } from "../src/lib/leaderboard-bots";

async function main():Promise<void> {
const local=Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)];}));
const db=createClient(local.NEXT_PUBLIC_SUPABASE_URL,local.COUNTRIVO_SUPABASE_SERVICE_KEY,{auth:{persistSession:false}});
const day=getTodayDateKey();
const slugs=['country-draft','geo-wordle','pinpoint','flag-quiz','higher-or-lower','stat-guesser'];
const rows=slugs.flatMap(slug=>simulatedRivals(slug,day).map(r=>({game_slug:slug,date_key:day,display_name:r.name,score_display:r.score,score_sort_value:r.sort,is_bot:true})));
const {error}=await db.from('countrivo_bot_runs').upsert(rows,{onConflict:'game_slug,date_key,display_name',ignoreDuplicates:true});
if(error)throw new Error('Bot seeding failed');
console.log(`${rows.length} explicitly labelled bots saved for ${day}; human runs untouched.`);

}
void main().catch(()=>{console.error("Bot seeding failed");process.exitCode=1;});
