"use client";

import { useReducer, useState, useCallback, useRef, useMemo, useEffect } from "react";
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
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout } from "@/lib/storage";
import type { ServerGameRun } from "@/types/server";

interface StreakBoardProps {
  mode: "daily" | "practice";
}

type Action =
  | { type: "ANSWER"; optionIndex: number; rng: () => number }
  | { type: "RESET"; state: StreakState };

function initStreak(mode: "daily" | "practice"): StreakState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now());
  return createStreak(rng);
}

function reducer(state: StreakState, action: Action): StreakState {
  switch (action.type) {
    case "ANSWER":
      return answerStreak(state, action.optionIndex, action.rng);
    case "RESET":
      return action.state;
    default:
      return state;
  }
}

export function StreakBoard({ mode }: StreakBoardProps) {
  // Lazy state init keeps Date.now() out of render and is exempt from purity rule.
  const [rng, setRng] = useState<() => number>(() =>
    mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now())
  );
  const [state, dispatch] = useReducer(reducer, mode, initStreak);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const currentCountry = state.queue[state.currentIndex];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    const isCorrect = idx === state.correctIndex;
    setFeedbackType(isCorrect ? "good" : "bad");
    setFeedbackMessage(isCorrect ? "Correct!" : "Wrong!");
    setFeedbackKey((k) => k + 1);
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", optionIndex: idx, rng });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 800);
  }, [showFeedback, state.correctIndex, rng]);

  const handleReset = useCallback(() => {
    const fresh = mulberry32(Date.now());
    setRng(() => fresh);
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
      });
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
    } else if (mode === "daily") {
      setPendingPayload(payload);
    }
  }, [state.phase, state.streak, state.bestStreak, mode, user]);

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
        title="Streak Over!"
        score={`🔥 ${state.streak}`}
        subtitle={state.streak === 0 ? "Better luck next time!" : `Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? handleReset : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.streak}
        maxScore={20}
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
        <span className="text-3xl">🔥</span>
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
        <span className="text-[7rem] leading-none block">{currentCountry.flagEmoji}</span>
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
                !showFeedback && "border-black/10 hover:border-black/20 hover:bg-black/3 active:scale-[0.98]",
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
