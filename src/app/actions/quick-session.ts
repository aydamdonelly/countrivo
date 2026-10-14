"use server";

import { practiceSeedFor } from "@/server/practice-seeds";
import type { QuickAction, QuickSlug } from "@/games/quick-views";
import { getTodayDateKey } from "@/lib/daily-seed";
import { readRunTicket } from "@/server/anonymous-identity";
import { getEdition } from "@/server/edition";
import { commitGameSession, prepareGameSession } from "@/server/game-sessions";
import { flagRemote, flagView, higherRemote, higherView, statRemote, statView, quickProject, statSessionModule, higherSessionModule } from "@/server/quick-sessions";

export async function commitQuickSession(input:{sessionToken:string;revision:number;action:QuickAction}) {
  const ticket=readRunTicket(input.sessionToken);
  if(!ticket)throw new Error('Invalid session');
  if(ticket.slug==='higher-or-lower')return commitGameSession(await higherSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceStat),quickProject(higherView,ticket.mode,ticket.dateKey),input);
  if(ticket.slug==='flag-quiz')return commitGameSession(flagRemote,quickProject(flagView,ticket.mode,ticket.dateKey),input);
  if(ticket.slug==='stat-guesser')return commitGameSession(await statSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceCountry,ticket.practiceStat),quickProject(statView,ticket.mode,ticket.dateKey),input);
  throw new Error('Unknown game');
}

export async function startQuickPractice(slug:QuickSlug) {
  const dateKey=getTodayDateKey(),edition=await getEdition();
  const input={slug,mode:'practice' as const,dateKey,edition,seed:await practiceSeedFor(slug,dateKey,edition),startedAt:new Date().toISOString()};
  if(slug==='higher-or-lower')return prepareGameSession(higherRemote,quickProject(higherView,input.mode,input.dateKey),input);
  if(slug==='flag-quiz')return prepareGameSession(flagRemote,quickProject(flagView,input.mode,input.dateKey),input);
  return prepareGameSession(statRemote,quickProject(statView,input.mode,input.dateKey),input);
}
