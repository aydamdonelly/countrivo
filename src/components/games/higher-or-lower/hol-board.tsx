"use client";

import { useReducer, useState, useCallback, useMemo, useRef } from "react";
import {
  createHoL,
  guess,
  type HoLState,
} from "@/lib/game-logic/higher-or-lower/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useGameKeys } from "@/hooks/use-game-keys";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import type { ServerGameRun } from "@/types/server";

interface HoLBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): HoLState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now());
  return createHoL(rng);
}

type Action = { type: "GUESS"; choice: "higher" | "lower" } | { type: "RESET" };

function reducer(state: HoLState, action: Action): HoLState {
  switch (action.type) {
    case "GUESS": return guess(state, action.choice);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function HoLBoard({ mode }: HoLBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showReveal, setShowReveal] = useState(false);
  const [lastChoice, setLastChoice] = useState<"higher" | "lower" | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const round = state.rounds[state.currentRound];

  const handleGuess = useCallback((choice: "higher" | "lower") => {
    if (showReveal) return;
    const isCorrect = choice === round.answer;
    setFeedbackType(isCorrect ? "good" : "bad");
    setFeedbackMessage(isCorrect ? "Correct!" : "Wrong — streak ends");
    setFeedbackKey((k) => k + 1);
    setLastChoice(choice);
    setShowReveal(true);
    setTimeout(() => {
      dispatch({ type: "GUESS", choice });
      setShowReveal(false);
      setLastChoice(null);
    }, 1500);
  }, [showReveal, round]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (!showReveal) {
      map["ArrowUp"] = () => handleGuess("higher");
      map["ArrowDown"] = () => handleGuess("lower");
    }
    return map;
  }, [showReveal, handleGuess]);

  // Swipe support for mobile
  const touchStart = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === null || showReveal) return;
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) {
      // Swipe up = higher, swipe down = lower
      handleGuess(diff > 0 ? "higher" : "lower");
    }
    touchStart.current = null;
  }, [showReveal, handleGuess]);

  useGameKeys(keymap, state.phase !== "gameover" && !showReveal);

  // Submit to server when game ends
  if (state.phase === "gameover" && !submitted) {
    setSubmitted(true);

    const payload = {
      gameSlug: "higher-or-lower",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.streak,
      scoreMax: state.streak,
      scoreSortValue: state.streak,
      scoreDisplay: `Streak: ${state.streak}`,
      resultJson: {
        streak: state.streak,
        bestStreak: state.bestStreak,
        totalRounds: state.rounds.length,
        lastAnswer: state.lastAnswer,
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
        title="Game Over!"
        score={`${state.streak} streak`}
        subtitle={`Best: ${state.bestStreak}`}
        onPlayAgain={mode === "practice" ? () => { setSubmitted(false); setServerData(null); setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.streak}
        maxScore={state.streak}
        gameSlug="higher-or-lower"
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

  if (!round) return null;

  const isCorrectGuess = lastChoice === round.answer;

  return (
    <div className="flex flex-col gap-8" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Streak"
        scoreValue={String(state.streak)}
        progressCurrent={state.streak}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Streak counter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className={cn(
            "font-extrabold font-mono transition-all",
            state.streak > 0 ? "text-4xl text-gold" : "text-3xl text-cream-muted"
          )}>
            {state.streak}
          </span>
        </div>
        <span className="text-base text-cream-muted font-medium">
          {round.category.emoji} {round.category.label}
        </span>
      </div>

      {/* Country cards */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Left country - value shown */}
        <div className={cn(
          "flex flex-col items-center p-6 sm:p-8 rounded-xl border-2 transition-all",
          showReveal && isCorrectGuess ? "border-correct/50 bg-correct/5" : "border-border bg-surface",
          showReveal && !isCorrectGuess ? "border-incorrect/50 bg-incorrect/5" : ""
        )}>
          <span className="text-7xl sm:text-8xl mb-3">{round.left.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">{round.left.displayName}</span>
          <span className="text-2xl sm:text-3xl font-mono font-extrabold mt-3 text-cream">
            {formatStat(round.leftValue, round.category.unit)}
          </span>
        </div>

        {/* Right country - value hidden until reveal */}
        <div className={cn(
          "flex flex-col items-center p-6 sm:p-8 rounded-xl border-2 transition-all",
          !showReveal && "border-border bg-gold-dim",
          showReveal && isCorrectGuess && "border-correct bg-correct/10",
          showReveal && !isCorrectGuess && "border-incorrect bg-incorrect/10"
        )}>
          <span className="text-7xl sm:text-8xl mb-3">{round.right.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">{round.right.displayName}</span>
          {showReveal ? (
            <span className={cn(
              "text-2xl sm:text-3xl font-mono font-extrabold mt-3",
              isCorrectGuess ? "text-correct" : "text-incorrect"
            )}>
              {formatStat(round.rightValue, round.category.unit)}
            </span>
          ) : (
            <span className="text-3xl font-bold mt-3 text-gold">?</span>
          )}
        </div>
      </div>

      <p className="text-center text-lg text-cream-muted">
        Is <span className="font-bold text-cream">{round.right.displayName}</span>&apos;s{" "}
        <span className="font-bold text-cream">{round.category.label.toLowerCase()}</span> higher or lower?
      </p>

      {/* Higher / Lower buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleGuess("higher")}
          disabled={showReveal}
          className="py-6 px-4 rounded-xl border-2 border-correct/30 bg-correct/5 hover:border-correct hover:bg-correct/10 font-bold text-xl transition-all w-full disabled:opacity-60"
        >
          <span className="block text-2xl mb-1">⬆️</span>
          Higher
        </button>
        <button
          onClick={() => handleGuess("lower")}
          disabled={showReveal}
          className="py-6 px-4 rounded-xl border-2 border-incorrect/30 bg-incorrect/5 hover:border-incorrect hover:bg-incorrect/10 font-bold text-xl transition-all w-full disabled:opacity-60"
        >
          <span className="block text-2xl mb-1">⬇️</span>
          Lower
        </button>
      </div>

      <p className="text-center text-xs text-cream-muted mt-2 sm:hidden">
        Swipe up for Higher, down for Lower
      </p>
    </div>
  );
}
