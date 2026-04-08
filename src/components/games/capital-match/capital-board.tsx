"use client";

import { useReducer, useState, useCallback, useMemo, useRef } from "react";
import {
  createCapitalMatch,
  answerCapital,
  type CapitalMatchState,
} from "@/lib/game-logic/capital-match/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { EndgameRamp } from "@/components/game/endgame-ramp";
import { useGameKeys } from "@/hooks/use-game-keys";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout } from "@/lib/storage";
import type { ServerGameRun } from "@/types/server";

interface CapitalBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): CapitalMatchState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now());
  return createCapitalMatch(rng);
}

type Action = { type: "ANSWER"; idx: number } | { type: "RESET" };

function reducer(state: CapitalMatchState, action: Action): CapitalMatchState {
  switch (action.type) {
    case "ANSWER": return answerCapital(state, action.idx);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function CapitalBoard({ mode }: CapitalBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const currentQ = state.questions[state.currentQuestion];

  const handleAnswer = useCallback((idx: number) => {
    if (showFeedback) return;
    const isCorrect = idx === currentQ.correctIndex;
    setFeedbackType(isCorrect ? "good" : "bad");
    setFeedbackMessage(isCorrect ? "Correct!" : "Wrong answer");
    setFeedbackKey((k) => k + 1);
    setSelectedIdx(idx);
    setShowFeedback(true);
    setTimeout(() => {
      dispatch({ type: "ANSWER", idx });
      setShowFeedback(false);
      setSelectedIdx(null);
    }, 1200);
  }, [showFeedback, currentQ]);

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

    if (mode === "daily") {
      setDailyLockout("capital-match", getTodayDateKey(), {
        score: String(state.score),
        scoreDisplay: `${state.score} / ${state.questions.length}`,
        timestamp: Date.now(),
      });
    }

    const payload = {
      gameSlug: "capital-match",
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
        title="Capital Match Complete!"
        score={`${state.score} / ${state.questions.length}`}
        subtitle={`${pct}% — ${pct >= 70 ? "Great job!" : "Keep practicing!"}`}
        onPlayAgain={mode === "practice" ? () => { setSubmitted(false); setServerData(null); setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.score}
        maxScore={state.questions.length}
        gameSlug="capital-match"
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

  const progress = ((state.currentQuestion) / state.questions.length) * 100;

  return (
    <div className="flex flex-col gap-8">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Correct"
        scoreValue={`${state.score}/10`}
        progressCurrent={state.score}
        progressTotal={10}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-base text-cream-muted">
          <span>
            Question <span className="font-bold text-cream text-lg">{state.currentQuestion + 1}</span> of {state.questions.length}
          </span>
          <span className="text-lg">
            Score: <span className="font-bold text-gold">{state.score}</span>
          </span>
        </div>
        <div className="w-full h-3 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Country display */}
      <div className="text-center py-6">
        <span className="text-[10rem] leading-none mb-4 block">{currentQ.country.flagEmoji}</span>
        <h2 className="text-3xl font-bold">{currentQ.country.displayName}</h2>
        <p className="text-cream-muted text-base mt-2">{currentQ.country.continent}</p>
        <p className="text-cream-muted text-lg mt-3 font-medium">What is the capital?</p>
      </div>

      <EndgameRamp picksRemaining={10 - state.currentQuestion} totalPicks={10} />

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {currentQ.options.map((option, idx) => {
          const isCorrect = idx === currentQ.correctIndex;
          const isSelected = selectedIdx === idx;

          return (
            <button
              key={idx}
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
              {option}
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
