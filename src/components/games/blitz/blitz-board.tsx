"use client";

import {
  useReducer,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  createBlitz,
  submitAnswer,
  nextRound,
  opponentScored,
  type BlitzState,
} from "@/lib/game-logic/blitz/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useGameKeys } from "@/hooks/use-game-keys";
import { useMultiplayer } from "@/hooks/use-multiplayer";

/* ── Props ─────────────────────────────────────────────────────────── */

interface BlitzBoardProps {
  mode: "practice" | "versus";
  roomCode?: string | null;
  dailyKey?: string | null;
}

/* ── Reducer ───────────────────────────────────────────────────────── */

type Action =
  | { type: "SUBMIT"; input: string }
  | { type: "NEXT_ROUND" }
  | { type: "OPPONENT_SCORED" }
  | { type: "RESET"; mode: "practice" | "daily" };

function initState(args: {
  mode: string;
  dailyKey?: string | null;
}): BlitzState {
  const rng =
    args.mode === "daily" && args.dailyKey
      ? getDailyRng(args.dailyKey)
      : mulberry32(Date.now());
  return createBlitz(rng);
}

function reducer(state: BlitzState, action: Action): BlitzState {
  switch (action.type) {
    case "SUBMIT":
      return submitAnswer(state, action.input);
    case "NEXT_ROUND":
      return nextRound(state);
    case "OPPONENT_SCORED":
      return opponentScored(state);
    case "RESET":
      return initState({ mode: action.mode });
    default:
      return state;
  }
}

/* ── Board ─────────────────────────────────────────────────────────── */

export function BlitzBoard({ mode, roomCode, dailyKey }: BlitzBoardProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { mode: dailyKey ? "daily" : mode, dailyKey },
    initState,
  );

  const [inputValue, setInputValue] = useState("");
  const [shaking, setShaking] = useState(false);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Correct!");
  const inputRef = useRef<HTMLInputElement>(null);
  const betweenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVersus = mode === "versus";
  const round = state.rounds[state.currentRound];

  /* Multiplayer hook (only active in versus mode) */
  const { connected, opponentJoined, lastMessage, send } = useMultiplayer(
    isVersus ? roomCode ?? null : null,
  );

  /* ── Auto-focus input ──────────────────────────────────────────── */

  useEffect(() => {
    if (state.phase === "playing") {
      inputRef.current?.focus();
    }
  }, [state.phase, state.currentRound]);

  /* ── Auto-advance after between phase ──────────────────────────── */

  useEffect(() => {
    if (state.phase === "between") {
      betweenTimerRef.current = setTimeout(() => {
        dispatch({ type: "NEXT_ROUND" });
        setFlashCorrect(false);
      }, 1500);
      return () => {
        if (betweenTimerRef.current) clearTimeout(betweenTimerRef.current);
      };
    }
  }, [state.phase, state.currentRound]);

  /* ── Versus: handle incoming messages ──────────────────────────── */

  useEffect(() => {
    if (!isVersus || !lastMessage) return;

    if (
      lastMessage.type === "blitz:scored" &&
      (lastMessage.round as number) === state.currentRound
    ) {
      dispatch({ type: "OPPONENT_SCORED" });
    }
  }, [lastMessage, isVersus, state.currentRound]);

  /* ── Submit answer ─────────────────────────────────────────────── */

  const handleSubmit = useCallback(() => {
    if (state.phase !== "playing" || !inputValue.trim() || !round) return;

    /* Peek ahead to check if correct */
    const result = submitAnswer(state, inputValue);
    const wasCorrect =
      result.rounds[state.currentRound].correct;

    if (wasCorrect) {
      setFeedbackType("good");
      setFeedbackMessage("Correct!");
      setFeedbackKey((k) => k + 1);
      setFlashCorrect(true);
      setInputValue("");

      if (isVersus) {
        send({ type: "blitz:scored", round: state.currentRound });
      }
    } else {
      /* Shake animation on wrong answer */
      setFeedbackType("bad");
      setFeedbackMessage("Wrong!");
      setFeedbackKey((k) => k + 1);
      setShaking(true);
      setInputValue("");
      setTimeout(() => setShaking(false), 500);
    }

    dispatch({ type: "SUBMIT", input: inputValue });
  }, [state, inputValue, round, isVersus, send]);

  /* ── Keyboard handling ─────────────────────────────────────────── */

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  /* useGameKeys — empty map, we handle Enter in the input */
  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    return map;
  }, []);

  useGameKeys(keymap, state.phase === "playing");

  /* ── Results screen ─────────────────────────────────────────────── */

  if (state.phase === "results") {
    const correctRounds = state.rounds.filter((r) => r.correct);
    const avgTime =
      correctRounds.length > 0
        ? Math.round(
            correctRounds.reduce((sum, r) => sum + (r.timeMs ?? 0), 0) /
              correctRounds.length,
          )
        : 0;

    let title: string;
    let scoreText: string;
    let subtitle: string;

    if (isVersus) {
      const won = state.myScore > state.opponentScore;
      const tied = state.myScore === state.opponentScore;
      title = tied ? "Draw!" : won ? "You Won!" : "They Won!";
      scoreText = `${state.myScore} - ${state.opponentScore}`;
      subtitle = `${correctRounds.length} correct answers`;
    } else {
      title = state.myScore >= 7 ? "Great Job!" : state.myScore >= 4 ? "Not Bad!" : "Keep Practicing!";
      scoreText = `${state.myScore} / ${state.totalRounds}`;
      subtitle = avgTime > 0 ? `Average time: ${(avgTime / 1000).toFixed(1)}s` : "No correct answers";
    }

    return (
      <GameOverScreen
        title={title}
        score={scoreText}
        subtitle={subtitle}
        onPlayAgain={
          mode === "practice"
            ? () => dispatch({ type: "RESET", mode: "practice" })
            : undefined
        }
        numericScore={state.myScore}
        maxScore={state.totalRounds}
        gameSlug="blitz"
      >
        {/* Round summary */}
        <div className="w-full max-w-md space-y-2">
          {state.rounds.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-4 py-2 rounded-lg border text-sm",
                r.correct && "border-correct/30 bg-correct/5",
                !r.correct && r.answered && "border-incorrect/30 bg-incorrect/5",
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">{r.country.flagEmoji}</span>
                <span className="font-medium">
                  {r.country.displayName}
                </span>
              </span>
              <span className="text-cream-muted text-xs">
                {r.correct && r.timeMs
                  ? `${(r.timeMs / 1000).toFixed(1)}s`
                  : r.correct
                    ? "Correct"
                    : "Missed"}
              </span>
            </div>
          ))}
        </div>
      </GameOverScreen>
    );
  }

  if (!round) return null;

  /* ── Versus waiting for opponent ────────────────────────────────── */

  if (isVersus && !opponentJoined) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite]" />
        <p className="font-bold text-2xl text-cream">
          Waiting for opponent...
        </p>
        <p className="text-sm text-cream-muted">
          {connected ? "Connected" : "Connecting..."}
        </p>
      </div>
    );
  }

  /* ── Game UI ─────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-6">
      <GameSessionTopBar
        mode={mode === "versus" ? "practice" : mode}
        scoreLabel="Score"
        scoreValue={`${state.myScore}/${state.totalRounds}`}
        progressCurrent={state.myScore}
        progressTotal={state.totalRounds}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Round counter + scores */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cream-muted uppercase tracking-wide">
          Round {state.currentRound + 1} / {state.totalRounds}
        </span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-2xl font-extrabold font-mono",
              !isVersus || state.myScore >= state.opponentScore
                ? "text-gold"
                : "text-cream",
            )}
          >
            {state.myScore}
          </span>
          {isVersus ? (
            <>
              <span className="text-cream-muted text-sm">--</span>
              <span
                className={cn(
                  "text-2xl font-extrabold font-mono",
                  state.opponentScore > state.myScore
                    ? "text-gold"
                    : "text-cream",
                )}
              >
                {state.opponentScore}
              </span>
            </>
          ) : (
            <span className="text-cream-muted text-sm">
              / {state.totalRounds}
            </span>
          )}
        </div>
        {isVersus && (
          <span className="text-sm font-bold uppercase tracking-wide text-cream-muted">
            Speed wins
          </span>
        )}
      </div>

      {/* Big flag */}
      <div className="flex flex-col items-center py-8">
        <span
          className={cn(
            "text-8xl sm:text-9xl transition-all",
            flashCorrect && "scale-110",
          )}
        >
          {round.country.flagEmoji}
        </span>

        {/* Between rounds: show correct country name */}
        {state.phase === "between" && (
          <div className="mt-4 text-center animate-in">
            <span className="font-bold text-2xl sm:text-3xl text-gold">
              {round.country.displayName}
            </span>
            <div className="mt-2">
              {round.correct ? (
                <span className="text-correct font-bold text-sm uppercase tracking-wide">
                  Correct!
                </span>
              ) : (
                <span className="text-incorrect font-bold text-sm uppercase tracking-wide">
                  {isVersus ? "Opponent got it!" : "Missed"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Text input (only shown during playing phase) */}
      {state.phase === "playing" && (
        <div className="max-w-md mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type the country name..."
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              "w-full px-4 py-3 rounded-xl border-2 bg-surface text-cream text-lg",
              "placeholder:text-cream-muted/50 focus:outline-none focus:border-gold",
              "transition-all",
              shaking && "animate-[shake_0.5s_ease-in-out] border-incorrect",
              !shaking && "border-border",
            )}
          />
          <p className="text-xs text-cream-muted text-center mt-2">
            Press Enter to submit
          </p>
        </div>
      )}

      {/* Round dots */}
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {state.rounds.map((r, i) => {
          const isCurrent = i === state.currentRound;
          const isPlayed = i < state.currentRound || (i === state.currentRound && r.answered);
          return (
            <div
              key={i}
              className={cn(
                "w-3 h-3 rounded-full border-2 transition-all",
                isCurrent && !isPlayed && "border-gold bg-gold-dim scale-125",
                isPlayed && r.correct && "border-correct bg-correct",
                isPlayed && !r.correct && "border-incorrect bg-incorrect",
                !isCurrent && !isPlayed && "border-border bg-surface",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
