import "server-only";

import { gameModule as blindPick } from "@/games/blind-pick/module";
import { gameModule as countryDraft } from "@/games/country-draft/module";
import { gameModule as higherOrLower } from "@/games/higher-or-lower/module";
import { gameModule as geoWordle } from "@/games/geo-wordle/module";
import { gameModule as statGuesser } from "@/games/stat-guesser/module";
import { gameModule as flagQuiz } from "@/games/flag-quiz/module";
import { gameModule as speedFlags, type SpeedAction } from "@/games/speed-flags/module";
import { replay } from "@/features/play/replay";
import type { Action, GameModule, SubmitGameRunInput } from "@/games/types";
import type { RunTicket } from "./anonymous-identity";
import { storeBoardSnapshot } from "./board-snapshots";

function replayModule<S, A extends Action>(module: GameModule<S, A>, ticket: RunTicket, log: string): SubmitGameRunInput {
  module.codec.dec(log);
  const { state } = replay(module, ticket.seed, ticket.mode, ticket.dateKey, log);
  if (!module.done(state)) throw new Error("incomplete_run");
  return module.payload(state, { mode: ticket.mode, dateKey: ticket.dateKey, startedAt: ticket.startedAt });
}

function timedAction(a: unknown): SpeedAction {
  if (!a || typeof a !== "object" || !("t" in a)) throw new Error("invalid_action");
  if (a.t === "next") return { t: "next" };
  if (a.t === "unlock") return { t: "unlock", ui: true };
  if (!("now" in a) || typeof a.now !== "number" || !Number.isFinite(a.now)) throw new Error("invalid_action");
  if (a.t === "start") return { t: "start", now: a.now };
  if (a.t === "tick") return { t: "tick", now: a.now, ui: true };
  if (a.t === "answer" && "i" in a && typeof a.i === "number" && (a.i === 0 || a.i === 1)) return { t: "answer", i: a.i, now: a.now };
  throw new Error("invalid_action");
}

export function replaySubmission(ticket: RunTicket, log: string, timed: unknown[] = []): SubmitGameRunInput {
  if (log.length > 16000 || timed.length > 1200) throw new Error("invalid_log");
  switch (ticket.slug) {
    case "blind-pick": return replayModule(blindPick, ticket, log);
    case "country-draft": return replayModule(countryDraft, ticket, log);
    case "higher-or-lower": return replayModule(higherOrLower, ticket, log);
    case "geo-wordle": return replayModule(geoWordle, ticket, log);
    case "stat-guesser": return replayModule(statGuesser, ticket, log);
    case "flag-quiz": return replayModule(flagQuiz, ticket, log);
    case "speed-flags": {
      let state = speedFlags.create(ticket.seed, ticket.mode, ticket.dateKey);
      let lastTime = 0;
      for (const value of timed) {
        const a = timedAction(value);
        if ("now" in a) {
          if (a.now < lastTime || a.now > Date.now() + 10000 || a.now < Date.parse(ticket.startedAt) - 10000) throw new Error("invalid_clock");
          lastTime = a.now;
        }
        state = speedFlags.reduce(state, a);
      }
      if (!speedFlags.done(state)) throw new Error("incomplete_run");
      return speedFlags.payload(state, { mode: ticket.mode, dateKey: ticket.dateKey, startedAt: ticket.startedAt });
    }
    default: throw new Error("unsupported_game");
  }
}

export async function preserveGenericBoard(ticket: RunTicket): Promise<void> {
  if (ticket.mode !== "daily") return;
  let state: unknown;
  switch (ticket.slug) {
    case "blind-pick": state = blindPick.create(ticket.seed, ticket.mode, ticket.dateKey); break;
    case "higher-or-lower": state = higherOrLower.create(ticket.seed, ticket.mode, ticket.dateKey); break;
    case "stat-guesser": state = statGuesser.create(ticket.seed, ticket.mode, ticket.dateKey); break;
    case "flag-quiz": state = flagQuiz.create(ticket.seed, ticket.mode, ticket.dateKey); break;
    default: return;
  }
  await storeBoardSnapshot({slug:ticket.slug,dateKey:ticket.dateKey,edition:ticket.edition,seed:ticket.seed,
    publicBoard:{gameSlug:ticket.slug,dateKey:ticket.dateKey},solution:state});
}
