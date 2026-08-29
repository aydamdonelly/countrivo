"use client";

import { GameHost } from "@/features/play/game-host";
import type { HostProps } from "@/games/types";
import { gameModule } from "./module";
import { Board } from "./board";
import { Result } from "./result";

/** The six-line host every game folder ends with (blueprint 8.2). */
export function ExampleHost(p: HostProps) {
  return <GameHost module={gameModule} Board={Board} Result={Result} {...p} />;
}
