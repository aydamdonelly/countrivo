"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  createStreak,
  answerStreak,
  type StreakState,
} from "@/lib/game-logic/country-streak/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { IconFlame } from "@/components/icons";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { ServerGameRun } from "@/types/server";

interface StreakBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

type Action =
  | { type: "ANSWER"; optionIndex: number }
  | { type: "RESET"; state: StreakState };

function initStreak(mode: "daily" | "practice", edition: string): StreakState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createStreak(rng);
}

function reducer(state: StreakState, action: Action): StreakState {
  switch (action.type) {
    case "ANSWER":
      return answerStreak(state, action.optionIndex);
    case "RESET":
      return action.state;
    default:
      return state;
  }
}

export function StreakBoard({ mode, edition }: StreakBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => initStreak(mode, edition), {
    storageKey: dailyProgressKey("country-streak", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);  const { user, openAuthModal } = useAuth();

  const currentCountry = state.queue[state.currentIndex];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    const isCorrect = idx === state.correctIndex;
    // Verdict feel: fire haptic + sound on the SAME frame the visual feedback starts.
    if (isCorrect) {
      const nextStreak = state.streak + 1;
      // Streak milestone every 5 takes precedence over the plain correct chime.
      if (nextStreak % 5 === 0) juice.milestone();
      else juice.correct();
    } else {
      juice.wrong();
    }
    setFeedbackType(isCorrect ? "good" : "bad");
    setFeedbackMessage(isCorrect ? "Correct!" : "Wrong!");
    setFeedbackKey((k) => k + 1);
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", optionIndex: idx });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 800);
  }, [showFeedback, state.correctIndex, state.streak]);

  const handleReset = useCallback(() => {
    const fresh = mulberry32(Date.now());
    dispatch({ type: "RESET", state: createStreak(fresh) });
    setServerData(null);
    setPendingPayload(null);
  }, []);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (!showFeedback) {
      map["1"] = () => handleAnswer(0);
      map["2"] = () => handleAnswer(1);
      map["3"] = () => handleAnswer(2);
      map["4"] = () => handleAnswer(3);
    }
    return map;
  }, [showFeedback, handleAnswer]);

  useGameKeys(keymap, state.phase !== "gameover");

  // Submit to server when game ends. Effect, not render-time side-effects.
  useEffect(() => {
    if (state.phase !== "gameover") return;

    if (mode === "daily") {
      setDailyLockout("country-streak", getTodayDateKey(), {
        score: String(state.streak),
        scoreDisplay: `${state.streak}`,
        timestamp: Date.now(),
      }, edition);
    }

    const payload = {
      gameSlug: "country-streak",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.streak,
      scoreMax: 243,
      scoreSortValue: state.streak,
      scoreDisplay: `Streak: ${state.streak}`,
      resultJson: {
        streak: state.streak,
        bestStreak: state.bestStreak,
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
  }, [state.phase, state.streak, state.bestStreak, mode, user]);

  // Gentle completion flourish when the run ends.
  useEffect(() => {
    if (state.phase === "gameover") juice.celebrate();
  }, [state.phase]);

  if (state.phase === "gameover") {
    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <GameOverScreen
        title={`${state.streak} in a row`}
        score={`${state.streak}`}
        subtitle={state.streak === 0 ? "First answer is the hardest." : `Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? handleReset : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.streak}
        gameSlug="country-streak"
        serverData={serverData ? {
          rankToday: serverData.rankDaily,
          percentile: serverData.percentile,
          totalPlayersToday: 0,
          isPersonalBest: serverData.isPersonalBest,
          runId: serverData.id,
          dailyDate: serverData.dailyDate ?? undefined,
        } : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Streak"
        scoreValue={String(state.streak)}
        progressCurrent={state.streak}
        progressTotal={20}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Streak counter */}
      <div className="flex items-center justify-center gap-3">
        <IconFlame className="w-8 h-8 text-amber-500" aria-hidden="true" />
        <span
          key={state.streak}
          className={cn(
            "font-extrabold font-mono transition-all animate-count-up",
            state.streak > 0 ? "text-6xl text-gold" : "text-4xl text-cream-muted"
          )}
        >
          {state.streak}
        </span>
      </div>

      {/* Flag */}
      <div className="text-center py-4">
        <img src={currentCountry.flagSvgPath} alt="Flag to identify" className="mx-auto h-28 w-auto rounded-md shadow-[var(--shadow-sm)]" />
        <p className="text-cream-muted text-lg mt-6 font-medium">Which country is this?</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {state.options.map((option, idx) => {
          const isCorrect = idx === state.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={`${state.currentIndex}-${option.iso3}`}
              onClick={() => handleAnswer(idx)}
              disabled={showFeedback}
              className={cn(
                "p-5 min-h-13 rounded-xl border-2 text-left text-lg font-medium transition-all w-full",
                !showFeedback && "border-black/15 hover:border-black/25 hover:bg-black/3 active:scale-[0.97]",
                showFeedback && isCorrect && "border-correct bg-correct/10",
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              <span>{option.displayName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
