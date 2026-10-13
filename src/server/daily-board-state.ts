import 'server-only';
import type {Action,GameModule} from '@/games/types';
import {frozenBoardSnapshot,storeBoardSnapshot} from './board-snapshots';
import {createDailyWithRotation} from './geography-rotation';

/** Daily visits and practice isolation both resolve the same write-once initial state. */
export async function resolveDailyBoard<S,A extends Action,V>(module:GameModule<S,A>,view:(state:S)=>V,input:{slug:string;dateKey:string;edition:string;seed:number}):Promise<{seed:number;state:S}> {
  const existing=await frozenBoardSnapshot<S>(input.slug,input.dateKey,input.edition);
  if(existing)return {seed:existing.seed,state:existing.solution};
  const candidate=await createDailyWithRotation(module,input);
  await storeBoardSnapshot({slug:input.slug,dateKey:input.dateKey,edition:input.edition,seed:candidate.seed,publicBoard:view(candidate.state),solution:candidate.state});
  const preserved=await frozenBoardSnapshot<S>(input.slug,input.dateKey,input.edition);
  if(!preserved)throw new Error('Could not preserve the daily board');
  return {seed:preserved.seed,state:preserved.solution};
}
