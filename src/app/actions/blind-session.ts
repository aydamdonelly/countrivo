"use server";

import { randomInt } from "node:crypto";
import type { BlindPickAction } from "@/games/blind-pick/module";
import { blindRemote, blindView } from "@/server/blind-session";
import { commitGameSession, prepareGameSession } from "@/server/game-sessions";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getEdition } from "@/server/edition";

export async function commitBlindSession(input:{sessionToken:string;revision:number;action:BlindPickAction}) {
  return commitGameSession(blindRemote,blindView,input);
}

export async function startBlindPractice() {
  return prepareGameSession(blindRemote,blindView,{slug:'blind-pick',mode:'practice',dateKey:getTodayDateKey(),edition:await getEdition(),seed:randomInt(0,2147483647),startedAt:new Date().toISOString()});
}
