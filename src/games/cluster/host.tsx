"use client";

import { GameHost } from "@/features/play/game-host";
import type { HostProps } from "@/games/types";
import { module } from "./module";
import { Board } from "./board";
import { Result } from "./result";

export function ClusterHost(p: HostProps) {
  return <GameHost module={module} Board={Board} Result={Result} {...p} />;
}
