"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  createCluster,
  toggleSelect,
  clearSelection,
  shuffleRemaining,
  submitGroup,
} from "@/lib/game-logic/cluster/engine";
import { clusterScore } from "@/lib/game-logic/cluster/scoring";
import type { ClusterPuzzle, ClusterState } from "@/lib/game-logic/cluster/types";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ClusterGrid } from "./cluster-grid";
import { SolvedRow } from "./cluster-results";
import { ClusterShareCard } from "./cluster-share-card";
import type { ServerGameRun } from "@/types/server";

interface ClusterBoardProps {
  puzzle: ClusterPuzzle;
  dateKey: string;
  mode: "daily" | "practice";
}

type Action =
  | { type: "TOGGLE_SELECT"; iso3: string }
  | { type: "CLEAR" }
  | { type: "SHUFFLE"; rng: () => number }
  | { type: "SUBMIT" };

function makeInitialState(puzzle: ClusterPuzzle, dateKey: string, mode: "daily" | "practice"): ClusterState {
  const rng = mode === "daily" ? getDailyRng(dateKey) : mulberry32(Date.now());
  return createCluster(rng, puzzle);
}

function reducer(state: ClusterState, action: Action): ClusterState {
  switch (action.type) {
    case "TOGGLE_SELECT":
      return toggleSelect(state, action.iso3);
    case "CLEAR":
      return clearSelection(state);
    case "SHUFFLE":
      return shuffleRemaining(action.rng, state);
    case "SUBMIT":
      return submitGroup(state);
    default:
      return state;
  }
}

export function ClusterBoard({ puzzle, dateKey, mode }: ClusterBoardProps) {
  const [state, dispatch] = useReducer(
    reducer,
    undefined,
    () => makeInitialState(puzzle, dateKey, mode),
  );
  const [shakeKey, setShakeKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const lastAttemptCount = useRef(0);
  const { user, openAuthModal } = useAuth();

  // Render-phase: react to new failed attempts (shake + toast). Mirrors the
  // existing trace-board/flag-quiz-board pattern of guarded synchronous setters.
  if (state.attempts.length > lastAttemptCount.current) {
    const last = state.attempts[state.attempts.length - 1];
    lastAttemptCount.current = state.attempts.length;
    if (!last.correct) {
      const message = last.nearMiss ? "One away" : "Not this group";
      setShakeKey((n) => n + 1);
      setToast(message);
    }
  }

  // Toast auto-dismiss timer
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1400);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Render-phase: submit to server when game ends (single-shot via `submitted`).
  if (state.phase === "finished" && !submitted) {
    setSubmitted(true);

    const { scoreRaw, scoreMax, scoreDisplay } = clusterScore(state);
    const allIso3s = puzzle.groups.flatMap((g) => g.countryIso3s);

    if (mode === "daily") {
      setDailyLockout("cluster", dateKey, {
        score: String(scoreRaw),
        scoreDisplay,
        timestamp: Date.now(),
      });
    }

    const payload = {
      gameSlug: "cluster",
      mode,
      dateKey,
      scoreRaw,
      scoreMax,
      scoreSortValue: scoreRaw,
      scoreDisplay,
      resultJson: {
        won: state.won,
        attempts: state.attempts,
        attemptsUsed: state.attempts.length,
        groups: puzzle.groups,
        countryIso3s: allIso3s,
        solvedGroupThemes: state.solvedGroups.map((g) => g.theme),
      },
      startedAt: startedAtRef.current,
    };

    if (user) {
      submitGameRun(payload).then((res) => {
        if (res.success && res.run) setServerData(res.run);
      });
    } else if (mode === "daily") {
      setPendingPayload(payload);
    }
  }

  const solvedIso3s = useMemo(
    () => new Set(state.solvedGroups.flatMap((g) => g.countryIso3s)),
    [state.solvedGroups],
  );

  const handleToggle = useCallback((iso3: string) => {
    dispatch({ type: "TOGGLE_SELECT", iso3 });
  }, []);

  const handleShuffle = useCallback(() => {
    dispatch({ type: "SHUFFLE", rng: mulberry32(Date.now()) });
  }, []);

  const handleClear = useCallback(() => dispatch({ type: "CLEAR" }), []);
  const handleSubmit = useCallback(() => dispatch({ type: "SUBMIT" }), []);

  if (state.phase === "finished") {
    const { scoreRaw, scoreMax, scoreDisplay } = clusterScore(state);
    const unsolved = puzzle.groups.filter(
      (g) => !state.solvedGroups.some((s) => s.theme === g.theme),
    );

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
        title={state.won ? "All four groups solved" : "Out of attempts"}
        score={scoreDisplay}
        subtitle={
          state.won
            ? `Cracked it in ${state.attempts.length} attempt${state.attempts.length === 1 ? "" : "s"}.`
            : `You found ${state.solvedGroups.length} of ${puzzle.groups.length} groups.`
        }
        numericScore={scoreRaw}
        maxScore={scoreMax}
        gameSlug="cluster"
        onPlayAgain={
          mode === "practice"
            ? () => {
                setSubmitted(false);
                setServerData(null);
                setPendingPayload(null);
                lastAttemptCount.current = 0;
                window.location.reload();
              }
            : undefined
        }
        onSaveScore={handleSaveScore}
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
        <div className="space-y-2.5">
          {state.solvedGroups.map((g) => (
            <SolvedRow key={g.theme} group={g} />
          ))}
          {unsolved.map((g) => (
            <SolvedRow key={g.theme} group={g} faded />
          ))}
        </div>

        {puzzle.editorial && (
          <p className="mt-5 text-sm text-cream-muted italic max-w-md mx-auto text-center">
            “{puzzle.editorial}”
          </p>
        )}

        <div className="mt-6">
          <ClusterShareCard
            groups={puzzle.groups}
            solvedGroups={state.solvedGroups}
            attempts={state.attempts}
            won={state.won}
            dateKey={dateKey}
          />
        </div>
      </GameOverScreen>
    );
  }

  const canSubmit = state.selected.length === 4 && state.phase === "playing";

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Solved"
        scoreValue={`${state.solvedGroups.length}/${puzzle.groups.length}`}
        progressCurrent={state.solvedGroups.length}
        progressTotal={puzzle.groups.length}
        extraInfo={`Attempts left: ${state.attemptsLeft}/4`}
      />

      {/* Solved-groups stack */}
      {state.solvedGroups.length > 0 && (
        <div className="space-y-2.5">
          {state.solvedGroups.map((g) => (
            <SolvedRow key={g.theme} group={g} />
          ))}
        </div>
      )}

      {/* Live grid */}
      <div className="relative">
        <ClusterGrid
          cells={state.shuffledCells}
          selected={state.selected}
          solvedIso3s={solvedIso3s}
          onToggle={handleToggle}
          shakeKey={shakeKey}
          nearMiss={state.attempts.at(-1)?.nearMiss}
        />

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center"
          >
            <span className="px-3 py-1 rounded-full bg-bg text-bg text-xs font-bold uppercase tracking-wide shadow-md animate-scale-in">
              {toast}
            </span>
          </div>
        )}
      </div>

      {/* Status + controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-cream-muted text-center sm:text-left">
          <span className="font-bold text-cream">{state.selected.length}</span>
          /4 selected
          <span className="mx-2 opacity-50">·</span>
          <span className="font-bold text-cream">{state.attemptsLeft}</span>
          /4 attempts left
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <Button onClick={handleShuffle} variant="secondary" size="md" type="button">
            Shuffle
          </Button>
          <Button
            onClick={handleClear}
            variant="secondary"
            size="md"
            type="button"
            disabled={state.selected.length === 0}
          >
            Deselect
          </Button>
          <Button onClick={handleSubmit} variant="primary" size="md" type="button" disabled={!canSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
