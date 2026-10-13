"use server";

import { randomInt } from "node:crypto";
import { readRunTicket } from "@/server/anonymous-identity";
import { draftSessionModule } from "@/server/draft-module";
import { type DraftCommitAction } from "@/games/country-draft/module";
import { draftReviewView } from "@/lib/game-logic/country-draft/public-view";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getEdition } from "@/server/edition";
import { commitGameSession, prepareGameSession } from "@/server/game-sessions";

export async function commitDraftSession(input: { sessionToken: string; revision: number; action: DraftCommitAction }) {
  const ticket=readRunTicket(input.sessionToken);
  if(!ticket)throw new Error("Invalid session");
  return commitGameSession(await draftSessionModule(ticket.mode,ticket.dateKey,ticket.edition,ticket.practiceCountry), (state) => draftReviewView(state, {mode:ticket.mode,dateKey:ticket.dateKey,today:getTodayDateKey()}), input);
}

export async function startDraftPractice() {
  const dateKey=getTodayDateKey(),edition=await getEdition();
  return prepareGameSession(await draftSessionModule("practice",dateKey,edition), (state) => draftReviewView(state,{mode:"practice",dateKey,today:getTodayDateKey()}), { slug: "country-draft", mode: "practice", dateKey: getTodayDateKey(),
    edition: await getEdition(), seed: randomInt(0, 2147483647), startedAt: new Date().toISOString() });
}
