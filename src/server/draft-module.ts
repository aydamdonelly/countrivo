import "server-only";

import { gameModule } from "@/games/country-draft/module";
import { createGame } from "@/lib/game-logic/country-draft/engine";
import { dailyBoardSeed } from "./anonymous-identity";
import type { Mode } from "@/ui/types";
import type { DraftState } from "@/lib/game-logic/country-draft/types";
import { frozenBoardState } from "./board-snapshots";

export async function draftSessionModule(mode:Mode,dateKey:string,edition:string,practiceCountry?:string) {
  if(mode==='daily')return gameModule;
  const today=await frozenBoardState<DraftState>('country-draft',dateKey,edition)??createGame(dailyBoardSeed('country-draft',dateKey,edition));
  const excluded=today.board.rounds.flatMap(r=>r.countries.map(c=>c.iso3));
  return {...gameModule,create:(seed:number)=>createGame(seed,{excludeCountries:excluded,firstCountry:practiceCountry})};
}

export async function draftCountryUnavailable(country:string,dateKey:string,edition:string):Promise<boolean> {
  const today=await frozenBoardState<DraftState>('country-draft',dateKey,edition)??createGame(dailyBoardSeed('country-draft',dateKey,edition));
  return today.board.rounds.some(r=>r.countries.some(c=>c.iso3===country));
}
