"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import {
  createSpeedFlags,
  startGame,
  answer,
  tick,
  type SpeedFlagsState,
} from "@/lib/game-logic/speed-flags/engine";
import { mulberry32 } from "@/lib/seeded-random";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
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

interface SpeedBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

function init(mode: "daily" | "practice", edition: string = ""): SpeedFlagsState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createSpeedFlags(rng);
}

type Action =
  | { type: "START"; now: number }
  | { type: "ANSWER"; idx: number }
  | { type: "TICK"; now: number }
  | { type: "RESET" };

function makeReducer(mode: "daily" | "practice") {
  return function reducer(state: SpeedFlagsState, action: Action): SpeedFlagsState {
    switch (action.type) {
      case "START": return startGame(state, action.now);
      case "ANSWER": return answer(state, action.idx);
      case "TICK": return tick(state, action.now);
      case "RESET": return init(mode);
      default: return state;
    }
  };
}

export function SpeedBoard({ mode, edition }: SpeedBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(makeReducer(mode), () => init(mode, edition), {
    storageKey: dailyProgressKey("speed-flags", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("✓");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const { user, openAuthModal } = useAuth();

  // Timer
  useEffect(() => {
    if (state.phase !== "playing") return;
    const interval = setInterval(() => dispatch({ type: "TICK", now: Date.now() }), 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  const handleAnswer = useCallback((idx: number) => {
    const question = state.queue[state.currentIdx];
    if (question) {
      const isCorrect = idx === question.correctIdx;
      // Verdict feel: fire haptic + sound the moment correctness is known, before feedback state.
      if (isCorrect) juice.correct();
      else juice.wrong();
      setFeedbackType(isCorrect ? "good" : "bad");
      setFeedbackMessage(isCorrect ? "✓" : "✗");
      setFeedbackKey((k) => k + 1);
    }
    dispatch({ type: "ANSWER", idx });
  }, [state.queue, state.currentIdx]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    map["1"] = () => handleAnswer(0);
    map["2"] = () => handleAnswer(1);
    return map;
  }, [handleAnswer]);

  useGameKeys(keymap, state.phase === "playing");

  // Submit to server when game ends
  const isGameOver = state.phase === "results" || (state.phase === "playing" && !state.queue[state.currentIdx]);
  useEffect(() => {
    if (!isGameOver) return;

    if (mode === "daily") {
      setDailyLockout("speed-flags", getTodayDateKey(), {
        score: String(state.correct),
        scoreDisplay: `${state.correct} flags`,
        timestamp: Date.now(),
      }, edition);
    }

    const payload = {
      gameSlug: "speed-flags",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.correct,
      scoreMax: 100,
      scoreSortValue: state.correct,
      scoreDisplay: `${state.correct} flags`,
      resultJson: {
        correct: state.correct,
        total: state.total,
        accuracy: state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0,
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
  }, [isGameOver, state.correct, state.total, mode, user]);

  // Gentle completion flourish when the run ends.
  useEffect(() => {
    if (isGameOver) juice.celebrate();
  }, [isGameOver]);

  const handleSaveScore = pendingPayload ? () => {
    openAuthModal(async () => {
      const res = await submitGameRun(pendingPayload);
      if (res.success && res.run) setServerData(res.run);
      setPendingPayload(null);
    });
  } : undefined;

  // Ready screen
  if (state.phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 py-12">
        <span className="text-6xl">⚡</span>
        <h2 className="text-2xl font-bold">Ready?</h2>
        <p className="text-cream-muted text-center">
          Identify as many flags as possible in 20 seconds.<br />
          Each flag has 2 options. Be fast!
        </p>
        <button
          onClick={() => dispatch({ type: "START", now: Date.now() })}
          className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.97] transition-colors"
        >
          Start
        </button>
      </div>
    );
  }

  // Results
  if (state.phase === "results") {
    const accuracy = state.total > 0 ? Math.round((state.correct / state.total) * 100) : 0;
    return (
      <GameOverScreen
        title={`${state.correct} flags named`}
        score={`${accuracy}% accuracy`}
        subtitle={`${state.total} attempts in 20 seconds`}
        onPlayAgain={mode === "practice" ? () => { setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.correct}
        maxScore={state.total}
        gameSlug="speed-flags"
        serverData={serverData ? { rankToday: serverData.rankDaily, percentile: serverData.percentile, totalPlayersToday: 0, isPersonalBest: serverData.isPersonalBest, runId: serverData.id, dailyDate: serverData.dailyDate ?? undefined } : undefined}
      />
    );
  }

  // Playing
  const question = state.queue[state.currentIdx];
  if (!question) {
    return (
      <GameOverScreen
        title="All Done!"
        score={`${state.correct} correct`}
        subtitle={`Out of ${state.total} attempts`}
        onPlayAgain={mode === "practice" ? () => { setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.correct}
        maxScore={state.total}
        gameSlug="speed-flags"
        serverData={serverData ? { rankToday: serverData.rankDaily, percentile: serverData.percentile, totalPlayersToday: 0, isPersonalBest: serverData.isPersonalBest, runId: serverData.id, dailyDate: serverData.dailyDate ?? undefined } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Score"
        scoreValue={String(state.correct)}
        progressCurrent={state.correct}
        progressTotal={100}
        extraInfo={`${state.timeLeft}s`}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Timer and score bar */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "font-mono text-2xl font-bold",
            state.timeLeft <= 3 && "text-incorrect animate-pulse",
            state.timeLeft > 3 && state.timeLeft <= 5 && "text-incorrect",
            state.timeLeft > 5 && "text-cream"
          )}
        >
          {state.timeLeft}s
        </div>
        <div className="text-sm text-cream-muted">
          Score: <span className="font-bold text-cream">{state.correct}</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full origin-left transition-[transform] duration-[480ms] ease-out",
            state.timeLeft <= 10 ? "bg-incorrect" : "bg-gold"
          )}
          style={{ transform: `scaleX(${state.timeLeft / 20})` }}
        />
      </div>

      {/* Flag */}
      <div className="text-center py-8">
        <img src={question.country.flagSvgPath} alt="Flag to identify" className="mx-auto h-24 w-auto rounded-md shadow-[var(--shadow-md,0_2px_8px_rgb(0,0,0,0.10))]" />
      </div>

      {/* Two options */}
      <div className="grid grid-cols-2 gap-4">
        {question.options.map((option, idx) => (
          <button
            key={option.iso3}
            onClick={() => handleAnswer(idx)}
            className="p-5 rounded-xl border-2 border-border hover:border-border-hover hover:bg-surface font-bold text-sm transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            {option.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
