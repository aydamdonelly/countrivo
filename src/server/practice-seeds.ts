import "server-only";

import { randomInt } from "node:crypto";
import { gameModule as geo } from "@/games/geo-wordle/module";
import { gameModule as pinpoint } from "@/games/pinpoint/module";
import { gameModule as stat } from "@/games/stat-guesser/module";
import { flagRemote } from "./quick-sessions";
import { dailyBoardSeed } from "./anonymous-identity";
import { frozenBoardState } from "./board-snapshots";
import {resolveDailyBoard} from './daily-board-state';
import {geoWordleView} from '@/lib/game-logic/geo-wordle/engine';
import {pinpointView} from '@/lib/game-logic/pinpoint/engine';
import type { QuizState } from "@/games/flag-quiz/module";
import type { StatGuesserState } from "@/lib/game-logic/stat-guesser/engine";

export async function practiceSeedFor(slug:string,dateKey:string,edition:string,region?:string):Promise<number> {
  // The regional factory already excludes today's answers before drawing from its pool.
  if(slug==='flag-quiz'&&region==='europe')return randomInt(0,2147483647);
  const seed=dailyBoardSeed(slug,dateKey,edition);
  const forbiddenGeo=slug==='geo-wordle'?(await resolveDailyBoard(geo,geoWordleView,{slug,dateKey,edition,seed})).state.answerIso3:null;
  const forbiddenPin=slug==='pinpoint'?new Set((await resolveDailyBoard(pinpoint,pinpointView,{slug,dateKey,edition,seed})).state.countries.map(c=>c.iso3)):null;
  const forbiddenFlag=slug==='flag-quiz'?new Set((await frozenBoardState<QuizState>(slug,dateKey,edition)??flagRemote.create(seed,'daily',dateKey)).g.questions.map(q=>q.country.iso3)):null;
  const forbiddenStat=slug==='stat-guesser'?new Set((await frozenBoardState<StatGuesserState>(slug,dateKey,edition)??stat.create(seed,'daily',dateKey)).rounds.map(r=>`${r.country.iso3}|${r.stat}`)):null;
  for(let attempt=0;attempt<500;attempt+=1){
    const practice=randomInt(0,2147483647);
    if(forbiddenGeo&&geo.create(practice,'practice',dateKey).answerIso3===forbiddenGeo)continue;
    if(forbiddenPin&&pinpoint.create(practice,'practice',dateKey).countries.some(c=>forbiddenPin.has(c.iso3)))continue;
    if(forbiddenFlag&&flagRemote.create(practice,'practice',dateKey).g.questions.some(q=>forbiddenFlag.has(q.country.iso3)))continue;
    if(forbiddenStat&&stat.create(practice,'practice',dateKey).rounds.some(r=>forbiddenStat.has(`${r.country.iso3}|${r.stat}`)))continue;
    return practice;
  }
  throw new Error('Could not find a fresh practice board');
}
