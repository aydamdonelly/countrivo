"use server";

import { practiceSeedFor } from "@/server/practice-seeds";
import { gameModule as geoWordle, type GeoCommitAction } from "@/games/geo-wordle/module";
import { gameModule as pinpoint, type PinpointAction } from "@/games/pinpoint/module";
import { geoWordleView } from "@/lib/game-logic/geo-wordle/engine";
import { pinpointView } from "@/lib/game-logic/pinpoint/engine";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getEdition } from "@/server/edition";
import { commitGameSession, prepareGameSession } from "@/server/game-sessions";

export async function commitGeoWordleSession(input: { sessionToken: string; revision: number; action: GeoCommitAction }) {
  return commitGameSession(geoWordle, geoWordleView, input);
}

export async function commitPinpointSession(input: { sessionToken: string; revision: number; action: PinpointAction }) {
  return commitGameSession(pinpoint, pinpointView, input);
}

export async function startGeoWordlePractice() {
  const dateKey=getTodayDateKey(),edition=await getEdition();
  return prepareGameSession(geoWordle, geoWordleView, { slug: "geo-wordle", mode: "practice", dateKey: getTodayDateKey(),
    edition: await getEdition(), seed: await practiceSeedFor("geo-wordle",dateKey,edition), startedAt: new Date().toISOString() });
}

export async function startPinpointPractice() {
  const dateKey=getTodayDateKey(),edition=await getEdition();
  return prepareGameSession(pinpoint, pinpointView, { slug: "pinpoint", mode: "practice", dateKey: getTodayDateKey(),
    edition: await getEdition(), seed: await practiceSeedFor("pinpoint",dateKey,edition), startedAt: new Date().toISOString() });
}
