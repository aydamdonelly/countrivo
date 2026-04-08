"use client";

import { useReducer, useCallback, useMemo, useState, useRef } from "react";
import {
  createOddOneOut,
  answerRound,
  nextRound,
  type OddOneOutState,
} from "@/lib/game-logic/odd-one-out/engine";
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

interface OddBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): OddOneOutState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey()) : mulberry32(Date.now());
  return createOddOneOut(rng);
}

type Action =
  | { type: "ANSWER"; index: number }
  | { type: "NEXT" }
  | { type: "RESET" };

function reducer(state: OddOneOutState, action: Action): OddOneOutState {
  switch (action.type) {
    case "ANSWER": return answerRound(state, action.index);
    case "NEXT": return nextRound(state);
    case "RESET": return init("practice");
    default: return state;
  }
}

export function OddBoard({ mode }: OddBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const round = state.rounds[state.currentRound];

  const handlePick = useCallback((idx: number) => {
    if (state.phase !== "playing") return;
    const isCorrect = idx === round.oddIndex;
    setFeedbackType(isCorrect ? "good" : "bad");
    setFeedbackMessage(isCorrect ? "Correct!" : "Wrong!");
    setFeedbackKey((k) => k + 1);
    dispatch({ type: "ANSWER", index: idx });
  }, [state.phase, round]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (state.phase === "playing") {
      map["1"] = () => handlePick(0);
      map["2"] = () => handlePick(1);
      map["3"] = () => handlePick(2);
      map["4"] = () => handlePick(3);
    } else if (state.phase === "feedback") {
      map["Enter"] = () => dispatch({ type: "NEXT" });
    }
    return map;
  }, [state.phase, handlePick]);

  useGameKeys(keymap, state.phase !== "results");

  // Submit to server when game ends
  if (state.phase === "results" && !submitted) {
    setSubmitted(true);

    if (mode === "daily") {
      setDailyLockout("odd-one-out", getTodayDateKey(), {
        score: String(state.score),
        scoreDisplay: `${state.score} / ${state.rounds.length}`,
        timestamp: Date.now(),
      });
    }

    const payload = {
      gameSlug: "odd-one-out",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.score,
      scoreMax: state.rounds.length,
      scoreSortValue: state.score,
      scoreDisplay: `${state.score} / ${state.rounds.length}`,
      resultJson: {
        score: state.score,
        total: state.rounds.length,
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
    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <GameOverScreen
        title="Odd One Out Complete!"
        score={`${state.score} / ${state.rounds.length}`}
        subtitle={state.score === state.rounds.length ? "Perfect!" : "Keep practicing!"}
        onPlayAgain={mode === "practice" ? () => { setSubmitted(false); setServerData(null); setPendingPayload(null); dispatch({ type: "RESET" }); } : undefined}
        onSaveScore={handleSaveScore}
        numericScore={state.score}
        maxScore={state.rounds.length}
        gameSlug="odd-one-out"
        serverData={serverData ? {
          rankToday: serverData.rankDaily,
          percentile: serverData.percentile,
          totalPlayersToday: 0,
          isPersonalBest: serverData.isPersonalBest,
          runId: serverData.id,
          dailyDate: serverData.dailyDate ?? undefined,
        } : undefined}
      >
        <div className="w-full max-w-md space-y-3">
          {state.rounds.map((r, i) => {
            const chosen = state.answers[i];
            const isCorrect = chosen === r.oddIndex;
            return (
              <div
                key={i}
                className={cn(
                  "p-3 rounded-lg border",
                  isCorrect
                    ? "border-correct/30 bg-correct/5"
                    : "border-incorrect/30 bg-incorrect/5"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{isCorrect ? "✓" : "✗"}</span>
                  <div className="flex gap-1">
                    {r.countries.map((c, ci) => (
                      <span
                        key={c.iso3}
                        className={cn(
                          "text-lg",
                          ci === r.oddIndex && "underline"
                        )}
                      >
                        {c.flagEmoji}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-cream-muted">{r.traitDescription}</p>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  if (!round) return null;

  const isFeedback = state.phase === "feedback";
  const chosen = state.answers[state.currentRound];

  return (
    <div className="flex flex-col gap-6">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Correct"
        scoreValue={String(state.score)}
        progressCurrent={state.score}
        progressTotal={state.rounds.length}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-cream-muted">
        <span>
          Round <span className="font-bold text-cream">{state.currentRound + 1}</span> of{" "}
          {state.rounds.length}
        </span>
        <span>Score: <span className="font-bold text-cream">{state.score}</span></span>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold">Which one doesn&apos;t belong?</h2>
        <p className="text-sm text-cream-muted mt-1">
          Three share a trait. Pick the odd one out.
        </p>
      </div>

      {/* Country cards */}
      <div className="grid grid-cols-2 gap-3">
        {round.countries.map((country, idx) => {
          const isOdd = idx === round.oddIndex;
          const isChosen = chosen === idx;

          return (
            <button
              key={country.iso3}
              onClick={() => handlePick(idx)}
              disabled={isFeedback}
              className={cn(
                "flex flex-col items-center p-5 rounded-xl border-2 transition-all",
                !isFeedback && "border-border hover:border-border-hover hover:bg-surface",
                isFeedback && isOdd && "border-correct bg-correct/10",
                isFeedback && isChosen && !isOdd && "border-incorrect bg-incorrect/10",
                isFeedback && !isOdd && !isChosen && "border-border opacity-50"
              )}
            >
              <span className="text-4xl mb-2">{country.flagEmoji}</span>
              <span className="font-medium text-sm text-center">{country.displayName}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isFeedback && (
        <div className="space-y-4">
          <div className={cn(
            "text-center p-4 rounded-xl border",
            chosen === round.oddIndex
              ? "border-correct/30 bg-correct/5"
              : "border-incorrect/30 bg-incorrect/5"
          )}>
            <p className="font-bold mb-1">
              {chosen === round.oddIndex ? "Correct!" : "Wrong!"}
            </p>
            <p className="text-sm text-cream-muted">
              {round.traitDescription}
            </p>
          </div>

          <EndgameRamp picksRemaining={state.rounds.length - state.currentRound - 1} totalPicks={state.rounds.length} />

          <button
            onClick={() => dispatch({ type: "NEXT" })}
            className="mx-auto block px-8 py-3 bg-gold text-bg font-semibold rounded-xl hover:opacity-90 transition-colors"
          >
            {state.currentRound + 1 >= state.rounds.length ? "See Results" : "Next Round"}
          </button>
        </div>
      )}
    </div>
  );
}
