"use client";

import { useReducer, useState, useCallback, useMemo, useRef } from "react";
import {
  createFlagQuiz,
  answerQuestion,
  type FlagQuizState,
} from "@/lib/game-logic/flag-quiz/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import type { ServerGameRun } from "@/types/server";

interface FlagQuizBoardProps {
  mode: "daily" | "practice";
}

type Action =
  | { type: "ANSWER"; optionIndex: number }
  | { type: "RESET" };

function init(mode: "daily" | "practice"): FlagQuizState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now());
  return createFlagQuiz(rng);
}

function reducer(state: FlagQuizState, action: Action): FlagQuizState {
  switch (action.type) {
    case "ANSWER":
      return answerQuestion(state, action.optionIndex);
    case "RESET":
      return init("practice");
    default:
      return state;
  }
}

export function FlagQuizBoard({ mode }: FlagQuizBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const currentQ = state.questions[state.currentQuestion];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", optionIndex: idx });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 1200);
  }, [showFeedback]);

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

  useGameKeys(keymap, state.phase !== "results");

  // Submit to server when game ends
  if (state.phase === "results" && !submitted) {
    setSubmitted(true);

    const payload = {
      gameSlug: "flag-quiz",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.score,
      scoreMax: state.questions.length,
      scoreSortValue: state.score,
      scoreDisplay: `${state.score} / ${state.questions.length}`,
      resultJson: {
        score: state.score,
        total: state.questions.length,
        answers: state.answers,
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

  if (state.phase === "results") {
    const pct = Math.round((state.score / state.questions.length) * 100);

    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <GameOverScreen
        title="Flag Quiz Complete!"
        score={`${state.score} / ${state.questions.length}`}
        subtitle={
          state.score === state.questions.length
            ? "Perfect score!"
            : `${pct}% — ${pct >= 70 ? "Great job!" : "Keep practicing!"}`
        }
        onPlayAgain={mode === "practice" ? () => { setSubmitted(false); setServerData(null); setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.score}
        maxScore={state.questions.length}
        gameSlug="flag-quiz"
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
    <div className="flex flex-col gap-6">
      {/* Session top bar */}
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Correct"
        scoreValue={`${state.score}/${state.questions.length}`}
        progressCurrent={state.currentQuestion}
        progressTotal={state.questions.length}
        extraInfo={`Q${state.currentQuestion + 1}`}
      />

      {/* Flag */}
      <div className="text-center py-6">
        <span className="text-[7rem] leading-none block">{currentQ.country.flagEmoji}</span>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          const isCorrect = idx === currentQ.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={option.iso3}
              onClick={() => handleAnswer(idx)}
              disabled={showFeedback}
              className={cn(
                "p-5 min-h-13 rounded-xl border-2 text-left text-lg font-medium transition-all w-full",
                !showFeedback && "border-black/10 hover:border-black/20 hover:bg-black/3 active:scale-[0.98]",
                showFeedback && isCorrect && "border-correct bg-correct/10" + (isSelected ? " animate-scale-in" : ""),
                showFeedback && isSelected && !isCorrect && "border-incorrect bg-incorrect/10 animate-[shake_0.4s_ease]",
                showFeedback && !isCorrect && !isSelected && "border-border opacity-50"
              )}
            >
              <span>{option.displayName}</span>
              {/* Show correct answer label when user got it wrong */}
              {showFeedback && isCorrect && selectedIdx !== idx && (
                <span className="block text-sm text-correct font-bold mt-1">
                  Correct answer
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
