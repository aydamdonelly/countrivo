"use client";
import { CountryFlag } from "@/components/ui/country-flag";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createCluster,
  toggleTile,
  submitGuess,
  matchedGroup,
  isOneAway,
  isTileSolved,
  CLUSTER_MAX_MISTAKES,
  CLUSTER_GROUP_COUNT,
  CLUSTER_GROUP_SIZE,
  type ClusterState,
} from "@/lib/game-logic/cluster/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { ServerGameRun } from "@/types/server";

interface ClusterBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

function init(mode: "daily" | "practice", edition: string): ClusterState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createCluster(rng);
}

type Action =
  | { type: "TOGGLE"; iso3: string }
  | { type: "SUBMIT" }
  | { type: "DESELECT_ALL" }
  | { type: "RESET" };

function reducer(state: ClusterState, action: Action): ClusterState {
  switch (action.type) {
    case "TOGGLE":
      return toggleTile(state, action.iso3);
    case "SUBMIT":
      return submitGuess(state);
    case "DESELECT_ALL":
      return { ...state, selected: [] };
    case "RESET":
      return init("practice", "");
    default:
      return state;
  }
}

function groupColor(id: number): string {
  return `var(--color-cluster-${id + 1})`;
}

export function ClusterBoard({ mode, edition }: ClusterBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("cluster", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const submittedRef = useRef(false);
  const { user, openAuthModal } = useAuth();
  // Practice seeds with Date.now() (a fresh puzzle each session), which differs
  // between the server and the first client render. Gate the random board behind
  // mount so SSR + first client render show an identical skeleton (no hydration
  // mismatch). Daily mode is deterministic and renders immediately.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const finished = state.phase !== "playing";
  const solved = state.solvedGroupIds.length;
  const tileByIso = useMemo(() => new Map(state.tiles.map((t) => [t.iso3, t])), [state.tiles]);

  const handleSubmit = useCallback(() => {
    if (state.phase !== "playing" || state.selected.length !== CLUSTER_GROUP_SIZE) return;
    const match = matchedGroup(state);
    if (match) {
      juice.correct();
      setFeedbackType("good");
      setFeedbackMessage(match.trait);
    } else {
      juice.wrong();
      setFeedbackType("bad");
      setFeedbackMessage(
        isOneAway(state)
          ? "One away"
          : state.mistakes >= CLUSTER_MAX_MISTAKES - 1
            ? "One mistake left"
            : "Not a group",
      );
    }
    setFeedbackKey((k) => k + 1);
    dispatch({ type: "SUBMIT" });
  }, [state, dispatch]);

  const keymap = useMemo(
    () => ({
      Enter: () => handleSubmit(),
      Backspace: () => dispatch({ type: "DESELECT_ALL" }),
      Escape: () => dispatch({ type: "DESELECT_ALL" }),
    }),
    [handleSubmit, dispatch],
  );
  useGameKeys(keymap, state.phase === "playing");

  // Win flourish.
  useEffect(() => {
    if (state.phase === "won") juice.celebrate();
  }, [state.phase]);

  // Submit the run once when the game ends.
  useEffect(() => {
    if (state.phase === "playing" || submittedRef.current) return;
    submittedRef.current = true;
    const scoreDisplay = `${solved}/${CLUSTER_GROUP_COUNT}`;
    if (mode === "daily") {
      setDailyLockout(
        "cluster",
        getTodayDateKey(),
        { score: String(solved), scoreDisplay: `${scoreDisplay} · ${state.mistakes} off`, timestamp: Date.now() },
        edition,
      );
    }
    const payload = {
      gameSlug: "cluster",
      mode,
      dateKey: getTodayDateKey(),
      scoreRaw: solved,
      scoreMax: CLUSTER_GROUP_COUNT,
      scoreSortValue: solved,
      scoreDisplay,
      resultJson: {
        solved,
        mistakes: state.mistakes,
        groups: state.groups.map((g) => g.members),
        guesses: state.guesses,
      },
      startedAt: startedAtRef.current,
    };
    if (user) {
      submitGameRun(payload).then((res) => {
        if (res.success && res.run) setServerData(res.run);
      });
    } else {
      setPendingPayload(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  if (mode === "practice" && !mounted) {
    return (
      <div className="flex flex-col gap-5">
        <GameSessionTopBar
          mode={mode}
          scoreLabel="Groups"
          scoreValue="0"
          progressCurrent={0}
          progressTotal={CLUSTER_GROUP_COUNT}
        />
        <div className="grid grid-cols-4 gap-2" aria-hidden>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="min-h-[68px] rounded-xl border-2 border-border bg-surface opacity-50" />
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    const won = state.phase === "won";
    const handleSaveScore = pendingPayload
      ? () => {
          openAuthModal(async () => {
            const res = await submitGameRun(pendingPayload);
            if (res.success && res.run) setServerData(res.run);
            setPendingPayload(null);
          });
        }
      : undefined;

    return (
      <GameOverScreen
        title={won ? "Solved!" : `${solved}/${CLUSTER_GROUP_COUNT} groups`}
        score={`${solved}/${CLUSTER_GROUP_COUNT}`}
        subtitle={
          won
            ? state.mistakes === 0
              ? "Flawless. All four clusters."
              : `Cracked it with ${state.mistakes} mistake${state.mistakes > 1 ? "s" : ""}.`
            : "The connections eluded you today."
        }
        onPlayAgain={
          mode === "practice"
            ? () => {
                submittedRef.current = false;
                setServerData(null);
                setPendingPayload(null);
                dispatch({ type: "RESET" });
              }
            : undefined
        }
        onSaveScore={handleSaveScore}
        numericScore={solved}
        maxScore={CLUSTER_GROUP_COUNT}
        gameSlug="cluster"
        serverData={
          serverData
            ? {
                rankToday: serverData.rankDaily,
                percentile: serverData.percentile,
                totalPlayersToday: 0,
                isPersonalBest: serverData.isPersonalBest,
                runId: serverData.id,
                dailyDate: serverData.dailyDate ?? undefined,
              }
            : undefined
        }
      >
        <div className="w-full max-w-md space-y-2">
          {state.groups.map((g) => {
            const playerSolved = state.solvedGroupIds.includes(g.id);
            return (
              <div key={g.id} style={{ backgroundColor: groupColor(g.id) }} className="rounded-xl p-3 text-white">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-sm">{g.trait}</span>
                  <span className="ml-auto text-xxs font-bold opacity-90">
                    {playerSolved ? "Solved" : "Missed"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {g.members.map((iso) => {
                    const t = tileByIso.get(iso);
                    return (
                      <span key={iso} className="inline-flex items-center gap-1 text-xs font-medium">
                        {t ? <CountryFlag iso2={t.iso2} width={22} /> : null}
                        {t?.displayName}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Groups"
        scoreValue={String(solved)}
        progressCurrent={solved}
        progressTotal={CLUSTER_GROUP_COUNT}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />

      <div className="text-center">
        <h2 className="text-lg font-bold">Find the four groups</h2>
        <p className="text-sm text-cream-muted mt-1">Tap four countries that share a connection.</p>
      </div>

      {/* Mistake dots */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xxs text-cream-muted font-medium">Mistakes</span>
        <div className="flex gap-1.5">
          {Array.from({ length: CLUSTER_MAX_MISTAKES }).map((_, i) => (
            <span
              key={i}
              className={cn("w-2.5 h-2.5 rounded-full", i < state.mistakes ? "bg-incorrect" : "bg-cream-ghost")}
            />
          ))}
        </div>
      </div>

      {/* 4x4 tile grid */}
      <div className="grid grid-cols-4 gap-2">
        {state.tiles.map((tile) => {
          const solvedId = isTileSolved(state, tile.iso3);
          const isSel = state.selected.includes(tile.iso3);
          return (
            <button
              key={tile.iso3}
              onClick={() => dispatch({ type: "TOGGLE", iso3: tile.iso3 })}
              disabled={solvedId !== null}
              style={solvedId !== null ? { backgroundColor: groupColor(solvedId) } : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-1.5 min-h-[68px] rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/50",
                solvedId !== null
                  ? "border-transparent"
                  : isSel
                    ? "border-cream bg-surface-sunken scale-[0.97]"
                    : "border-border bg-surface hover:border-border-hover active:scale-[0.97]",
              )}
            >
              <CountryFlag iso2={tile.iso2} width={30} />
              <span
                className={cn(
                  "text-xxs font-medium text-center leading-tight line-clamp-2",
                  solvedId !== null ? "text-white" : "text-cream",
                )}
              >
                {tile.displayName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => dispatch({ type: "DESELECT_ALL" })}
          disabled={state.selected.length === 0}
          className="px-5 py-3 min-h-[44px] rounded-xl border border-border font-semibold text-sm text-cream-muted hover:text-cream disabled:opacity-40 active:scale-[0.97] transition-all"
        >
          Deselect
        </button>
        <button
          onClick={handleSubmit}
          disabled={state.selected.length !== CLUSTER_GROUP_SIZE}
          className="px-6 py-3 min-h-[44px] rounded-xl bg-cream text-bg font-bold text-sm disabled:opacity-40 active:scale-[0.97] transition-all"
        >
          Submit ({state.selected.length}/{CLUSTER_GROUP_SIZE})
        </button>
      </div>
    </div>
  );
}
