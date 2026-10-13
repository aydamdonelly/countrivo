import 'server-only';
import type {Action,GameModule} from '@/games/types';
import {GEO_WORDLE_MIN_GAP_DAYS,PINPOINT_MIN_GAP_DAYS,isGeographyGame,rotationAnswers,rotationWindowStart,selectRotationCandidate} from '@/lib/game-logic/geography-rotation';
import {dailyBoardSeed,gameDatabase} from './anonymous-identity';

interface HistorySnapshot {date_key:string;solution:unknown}
export async function createDailyWithRotation<S,A extends Action>(module:GameModule<S,A>,input:{slug:string;dateKey:string;edition:string;seed:number}):Promise<{seed:number;state:S}> {
  const slug=input.slug;
  if(!isGeographyGame(slug))return {seed:input.seed,state:module.create(input.seed,'daily',input.dateKey)};
  const floor=rotationWindowStart(input.dateKey,slug==='geo-wordle'?GEO_WORDLE_MIN_GAP_DAYS:PINPOINT_MIN_GAP_DAYS);
  const {data,error}=await gameDatabase().from('countrivo_boards').select('date_key,solution').eq('game_slug',slug)
    .gte('date_key',floor).lt('date_key',input.dateKey).returns<HistorySnapshot[]>();
  if(error)throw new Error('Could not read geography board history');
  const history=(data??[]).map(snapshot=>({dateKey:snapshot.date_key,answers:rotationAnswers(slug,snapshot.solution)}));
  return selectRotationCandidate(slug,input.dateKey,history,seed=>module.create(seed,'daily',input.dateKey),
    attempt=>attempt===0?input.seed:dailyBoardSeed(`${slug}|rotation|${attempt}`,input.dateKey,input.edition));
}
