"use server";

import { practiceSeedFor } from "@/server/practice-seeds";
import type { QuickAction, QuickSlug } from "@/games/quick-views";
import { getTodayDateKey } from "@/lib/daily-seed";
import { readRunTicket } from "@/server/anonymous-identity";
import { getEdition } from "@/server/edition";
import { commitGameSession, prepareGameSession } from "@/server/game-sessions";
import { higherView, statView, quickProject, statSessionModule, higherSessionModule, commitFlagSession, prepareFlagSession } from "@/server/quick-sessions";

export async function commitQuickSession(input:{sessionToken:string;revision:number;action:QuickAction}) {
  // The Flag Quiz sprint clock: the receipt time, taken before any other work.
  const receivedAt=Date.now();
  const ticket=readRunTicket(input.sessionToken);
  if(!ticket)throw new Error('Invalid session');
  if(ticket.slug==='higher-or-lower')return commitGameSession(await higherSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceStat),quickProject(higherView,ticket.mode,ticket.dateKey),input);
  if(ticket.slug==='flag-quiz')return commitFlagSession(ticket,input,receivedAt);
  if(ticket.slug==='stat-guesser')return commitGameSession(await statSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceCountry,ticket.practiceStat),quickProject(statView,ticket.mode,ticket.dateKey),input);
  throw new Error('Unknown game');
}

export async function startQuickPractice(slug:QuickSlug,priorSessionToken?:string) {
  const dateKey=getTodayDateKey(),edition=await getEdition();
  const prior=priorSessionToken?readRunTicket(priorSessionToken):null;
  const context=prior?.slug===slug&&prior.mode==='practice'&&!prior.archived?{practiceCountry:prior.practiceCountry,practiceStat:prior.practiceStat,practiceRegion:prior.practiceRegion}:{};
  const input={slug,mode:'practice' as const,dateKey,edition,seed:await practiceSeedFor(slug,dateKey,edition),startedAt:new Date().toISOString(),...context};
  if(slug==='higher-or-lower')return prepareGameSession(await higherSessionModule(input.mode,dateKey,edition,input.practiceStat),quickProject(higherView,input.mode,input.dateKey),input);
  if(slug==='flag-quiz')return prepareFlagSession(input);
  return prepareGameSession(await statSessionModule(input.mode,dateKey,edition,input.practiceCountry,input.practiceStat),quickProject(statView,input.mode,input.dateKey),input);
}
