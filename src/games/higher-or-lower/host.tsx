"use client";

import { GameHost } from "@/features/play/game-host";
import type { HostProps } from "@/games/types";
import { gameModule } from "./module";
import { Board } from "./board";
import { Result } from "./result";

/** The client entry the registry maps to `higher-or-lower` (blueprint 8.2). */
export function HigherOrLowerHost(p: HostProps) {
  return <GameHost module={gameModule} Board={Board} Result={Result} {...p} />;
}
