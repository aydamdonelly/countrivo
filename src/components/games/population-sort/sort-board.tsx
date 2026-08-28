"use client";
import { StatIcon } from "@/components/ui/stat-icon";
import { CountryFlag } from "@/components/ui/country-flag";

import { useCallback, useMemo, useState, useEffect } from "react";
import {
  createSortGame,
  moveItem,
  submitSort,
  type SortGameState,
} from "@/lib/game-logic/population-sort/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { ServerGameRun } from "@/types/server";
import statsData from "@/data/stats.json";

const stats: Record<string, Record<string, number | null>> = statsData;

interface SortBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

function init(mode: "daily" | "practice", edition: string): SortGameState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createSortGame(rng);
}

type Action =
  | { type: "MOVE"; from: number; to: number }
  | { type: "SUBMIT" }
  | { type: "RESET" };

function reducer(state: SortGameState, action: Action): SortGameState {
  switch (action.type) {
    case "MOVE": return moveItem(state, action.from, action.to);
    case "SUBMIT": return submitSort(state);
    case "RESET": return init("practice", "");
    default: return state;
  }
}

export function SortBoard({ mode, edition }: SortBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("population-sort", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);  const { user, openAuthModal } = useAuth();

  const handleMoveUp = useCallback((idx: number) => {
    if (idx > 0) {
      juice.select();
      dispatch({ type: "MOVE", from: idx, to: idx - 1 });
    }
  }, []);

  const handleMoveDown = useCallback((idx: number) => {
    if (idx < state.userOrder.length - 1) {
      juice.select();
      dispatch({ type: "MOVE", from: idx, to: idx + 1 });
    }
  }, [state.userOrder.length]);

  const handleSubmit = useCallback(() => {
    if (state.phase !== "playing") return;
    // Verdict feel: land sound + haptic on the same frame the results reveal.
    let score = 0;
    for (let i = 0; i < state.userOrder.length; i++) {
      if (state.userOrder[i] === state.correctOrder[i]) score++;
    }
    if (score === state.userOrder.length) juice.correct();
    else juice.wrong();
    dispatch({ type: "SUBMIT" });
  }, [state.phase, state.userOrder, state.correctOrder]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    map["ArrowUp"] = () => setSelectedIdx((i) => Math.max(0, i - 1));
    map["ArrowDown"] = () =>
      setSelectedIdx((i) => Math.min(state.userOrder.length - 1, i + 1));
    map[" "] = () => {
      if (selectedIdx > 0) {
        juice.select();
        dispatch({ type: "MOVE", from: selectedIdx, to: selectedIdx - 1 });
        setSelectedIdx((i) => i - 1);
      }
    };
    map["Enter"] = () => handleSubmit();
    return map;
  }, [state.userOrder.length, selectedIdx, handleSubmit]);

  useGameKeys(keymap, state.phase !== "results");

  // Gentle completion flourish when the run ends.
  useEffect(() => {
    if (state.phase === "results") juice.celebrate();
  }, [state.phase]);

  // Submit to server when game ends
  useEffect(() => {
    if (state.phase !== "results") return;

    if (mode === "daily") {
      setDailyLockout("population-sort", getTodayDateKey(), {
        score: String(state.score),
        scoreDisplay: `${state.score} / ${state.countries.length}`,
        timestamp: Date.now(),
      }, edition);
    }

    const payload = {
      gameSlug: "population-sort",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.score,
      scoreMax: state.countries.length,
      scoreSortValue: state.score,
      scoreDisplay: `${state.score} / ${state.countries.length}`,
      resultJson: {
        score: state.score,
        total: state.countries.length,
        category: state.category.slug,
        userOrder: state.userOrder,
        correctOrder: state.correctOrder,
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
  }, [state.phase, state.score, state.countries.length, state.category.slug, state.userOrder, state.correctOrder, mode, user]);

  if (state.phase === "results") {
    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <div className="flex flex-col gap-6">
        <GameOverScreen
          title="Sort Complete!"
          score={`${state.score} / ${state.countries.length}`}
          subtitle={`Sorted by ${state.category.label}`}
          onPlayAgain={mode === "practice" ? () => { setServerData(null); setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
          onSaveScore={handleSaveScore}
          numericScore={state.score}
          maxScore={state.countries.length}
          gameSlug="population-sort"
          serverData={serverData ? {
            rankToday: serverData.rankDaily,
            percentile: serverData.percentile,
            totalPlayersToday: 0,
            isPersonalBest: serverData.isPersonalBest,
            runId: serverData.id,
            dailyDate: serverData.dailyDate ?? undefined,
          } : undefined}
        >
          <div className="w-full max-w-xl space-y-3">
            {state.correctOrder.map((countryIdx, rank) => {
              const country = state.countries[countryIdx];
              const userRank = state.userOrder.indexOf(countryIdx);
              const isCorrect = userRank === rank;
              const value = stats[country.iso3]?.[state.category.slug];

              return (
                <div
                  key={country.iso3}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2",
                    isCorrect ? "border-correct/30 bg-correct/5" : "border-incorrect/30 bg-incorrect/5"
                  )}
                >
                  <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-lg shrink-0">
                    {rank + 1}
                  </span>
                  <CountryFlag iso2={country.iso2} width={36} />
                  <span className="font-bold text-lg flex-1">{country.displayName}</span>
                  <span className="text-base font-mono text-cream-muted">
                    {value ? formatStat(value, state.category.unit) : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
        </GameOverScreen>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Sorted"
        scoreValue={`${selectedIdx + 1}/5`}
        progressCurrent={0}
        progressTotal={5}
      />
      <div className="text-center">
        <p className="text-lg text-cream-muted">
          Sort by <span className="font-bold text-cream text-xl"><StatIcon slug={state.category.slug} size={20} className="mr-1" />{state.category.label}</span> — highest first
        </p>
      </div>

      <div className="space-y-3">
        {state.userOrder.map((countryIdx, position) => {
          const country = state.countries[countryIdx];
          return (
            <div
              key={country.iso3}
              className={cn(
                "flex items-center gap-3 p-5 rounded-xl border-2 bg-surface",
                selectedIdx === position
                  ? "border-cream ring-2 ring-cream/30"
                  : "border-border"
              )}
            >
              <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-lg shrink-0">
                {position + 1}
              </span>
              <CountryFlag iso2={country.iso2} width={36} />
              <span className="font-bold text-lg flex-1">{country.displayName}</span>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleMoveUp(position)}
                  disabled={position === 0}
                  className="p-2 text-lg rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition-colors leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(position)}
                  disabled={position === state.userOrder.length - 1}
                  className="p-2 text-lg rounded-lg border border-border hover:bg-surface disabled:opacity-30 transition-colors leading-none"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-12 py-5 bg-cream text-bg font-bold text-xl rounded-xl hover:opacity-90 transition-colors"
        >
          Submit Order
        </button>
      </div>
    </div>
  );
}
