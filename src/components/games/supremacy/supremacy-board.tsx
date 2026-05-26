"use client";

import { useReducer, useCallback, useMemo, useEffect, useRef } from "react";
import {
  createSupremacy,
  pickStat,
  reveal,
  advanceRound,
  aiPickStat,
  type SupremacyState,
} from "@/lib/game-logic/supremacy/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";

/* ── Props ─────────────────────────────────────────────────────────── */

interface SupremacyBoardProps {
  mode: "practice";
  dailyKey?: string | null;
}

/* ── Reducer ───────────────────────────────────────────────────────── */

type Action =
  | { type: "PICK_STAT"; slug: string }
  | { type: "REVEAL" }
  | { type: "ADVANCE" }
  | { type: "RESET"; mode: "practice" | "daily" };

function initState(args: { mode: string; dailyKey?: string | null }): SupremacyState {
  const rng =
    args.mode === "daily" && args.dailyKey
      ? getDailyRng(args.dailyKey)
      : mulberry32(Date.now());
  return createSupremacy(rng);
}

function reducer(state: SupremacyState, action: Action): SupremacyState {
  switch (action.type) {
    case "PICK_STAT":
      return pickStat(state, action.slug);
    case "REVEAL":
      return reveal(state);
    case "ADVANCE":
      return advanceRound(state);
    case "RESET":
      return initState({ mode: action.mode });
    default:
      return state;
  }
}

/* ── Board ─────────────────────────────────────────────────────────── */

export function SupremacyBoard({ mode, dailyKey }: SupremacyBoardProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { mode: dailyKey ? "daily" : mode, dailyKey },
    initState,
  );

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = state.rounds[state.currentRound];
  const showReveal = state.phase === "reveal" && round?.winner !== null;

  /* ── AI logic: pick when it's AI's turn, then reveal ────────────── */

  useEffect(() => {
    if (state.phase === "picking" && !state.isPlayerTurn) {
      const aiCard = state.aiHand[state.currentRound];
      if (!aiCard) return;

      aiTimerRef.current = setTimeout(() => {
        const chosenStat = aiPickStat(aiCard, state.categories);
        dispatch({ type: "PICK_STAT", slug: chosenStat });
        dispatch({ type: "REVEAL" });
      }, 800);

      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }

    /* After player picks: reveal immediately on next tick */
    if (state.phase === "reveal" && round?.winner === null) {
      aiTimerRef.current = setTimeout(() => {
        dispatch({ type: "REVEAL" });
      }, 200);

      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }
  }, [state.phase, state.isPlayerTurn, state.currentRound, state.aiHand, state.categories, round?.winner]);

  /* Auto-advance after reveal */
  useEffect(() => {
    if (state.phase === "reveal" && round?.winner) {
      const timer = setTimeout(() => {
        dispatch({ type: "ADVANCE" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, round?.winner]);

  /* ── Handle player stat pick ────────────────────────────────────── */

  const handlePickStat = useCallback(
    (slug: string) => {
      if (state.phase !== "picking" || !state.isPlayerTurn) return;
      dispatch({ type: "PICK_STAT", slug });
    },
    [state.phase, state.isPlayerTurn],
  );

  /* ── Keyboard shortcuts (1-5 for categories) ────────────────────── */

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (state.phase === "picking" && state.isPlayerTurn) {
      state.categories.forEach((cat, i) => {
        map[String(i + 1)] = () => handlePickStat(cat.slug);
      });
    }
    return map;
  }, [state.phase, state.isPlayerTurn, state.categories, handlePickStat]);

  useGameKeys(keymap, state.phase === "picking" && state.isPlayerTurn);

  /* ── Results screen ─────────────────────────────────────────────── */

  if (state.phase === "results") {
    const won = state.playerScore > state.aiScore;
    const tied = state.playerScore === state.aiScore;
    const title = tied ? "Draw!" : won ? "You Win!" : "You Lose!";

    return (
      <GameOverScreen
        title={title}
        score={`${state.playerScore} - ${state.aiScore}`}
        subtitle={`${state.rounds.filter((r) => r.winner === "player").length} rounds won`}
        onPlayAgain={
          mode === "practice" ? () => dispatch({ type: "RESET", mode: "practice" }) : undefined
        }
        numericScore={state.playerScore}
        maxScore={state.rounds.length}
        gameSlug="supremacy"
      >
        {/* Round summary */}
        <div className="w-full max-w-md space-y-2">
          {state.rounds.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-4 py-2 rounded-lg border text-sm",
                r.winner === "player" && "border-correct/30 bg-correct/5",
                r.winner === "ai" && "border-incorrect/30 bg-incorrect/5",
                r.winner === "draw" && "border-border bg-surface",
              )}
            >
              <span className="font-medium">
                {r.playerCard.country.flagEmoji} {r.playerCard.country.displayName}
              </span>
              <span className="text-cream-muted text-xs">vs</span>
              <span className="font-medium">
                {r.aiCard.country.flagEmoji} {r.aiCard.country.displayName}
              </span>
            </div>
          ))}
        </div>
      </GameOverScreen>
    );
  }

  if (!round) return null;

  /* ── Game UI ─────────────────────────────────────────────────────── */

  const playerCard = round.playerCard;
  const aiCard = round.aiCard;
  const roundWinner = round.winner;
  const chosenStat = round.chosenStat;

  return (
    <div className="flex flex-col gap-6">
      {/* Round counter + scores */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-cream-muted uppercase tracking-wide">
          Round {state.currentRound + 1} / 5
        </span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-2xl font-extrabold font-mono",
              state.playerScore > state.aiScore ? "text-gold" : "text-cream",
            )}
          >
            {state.playerScore}
          </span>
          <span className="text-cream-muted text-sm">--</span>
          <span
            className={cn(
              "text-2xl font-extrabold font-mono",
              state.aiScore > state.playerScore ? "text-gold" : "text-cream",
            )}
          >
            {state.aiScore}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-bold uppercase tracking-wide",
            state.isPlayerTurn ? "text-gold" : "text-cream-muted",
          )}
        >
          {state.isPlayerTurn ? "Your pick" : "AI's pick"}
        </span>
      </div>

      {/* Cards area */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Player card (always face up) */}
        <div
          className={cn(
            "flex flex-col items-center p-5 sm:p-8 rounded-xl border-2 transition-all",
            showReveal && roundWinner === "player" && "border-correct/50 bg-correct/5",
            showReveal && roundWinner === "ai" && "border-incorrect/50 bg-incorrect/5",
            showReveal && roundWinner === "draw" && "border-gold/50 bg-gold-dim",
            !showReveal && "border-border bg-surface",
          )}
        >
          <span className="text-6xl sm:text-7xl mb-2">{playerCard.country.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">
            {playerCard.country.displayName}
          </span>
          {chosenStat && (
            <span
              className={cn(
                "text-xl sm:text-2xl font-mono font-extrabold mt-3 transition-all",
                showReveal && roundWinner === "player" && "text-correct",
                showReveal && roundWinner === "ai" && "text-incorrect",
                showReveal && roundWinner === "draw" && "text-gold",
                !showReveal && "text-cream",
              )}
            >
              {playerCard.stats[chosenStat] !== null
                ? formatStat(
                    playerCard.stats[chosenStat]!,
                    state.categories.find((c) => c.slug === chosenStat)?.unit ?? "",
                  )
                : "N/A"}
            </span>
          )}
          <span className="text-xs text-cream-muted mt-1 uppercase tracking-wide">You</span>
        </div>

        {/* AI card (face down until revealed) */}
        <div
          className={cn(
            "flex flex-col items-center p-5 sm:p-8 rounded-xl border-2 transition-all",
            showReveal && roundWinner === "ai" && "border-correct/50 bg-correct/5",
            showReveal && roundWinner === "player" && "border-incorrect/50 bg-incorrect/5",
            showReveal && roundWinner === "draw" && "border-gold/50 bg-gold-dim",
            !showReveal && "border-border bg-gold-dim",
          )}
        >
          {showReveal ? (
            <>
              <span className="text-6xl sm:text-7xl mb-2">{aiCard.country.flagEmoji}</span>
              <span className="font-bold text-base sm:text-lg text-center">
                {aiCard.country.displayName}
              </span>
              {chosenStat && (
                <span
                  className={cn(
                    "text-xl sm:text-2xl font-mono font-extrabold mt-3",
                    roundWinner === "ai" && "text-correct",
                    roundWinner === "player" && "text-incorrect",
                    roundWinner === "draw" && "text-gold",
                  )}
                >
                  {aiCard.stats[chosenStat] !== null
                    ? formatStat(
                        aiCard.stats[chosenStat]!,
                        state.categories.find((c) => c.slug === chosenStat)?.unit ?? "",
                      )
                    : "N/A"}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-6xl sm:text-7xl mb-2 opacity-30">?</span>
              <span className="font-bold text-lg text-cream-muted">Hidden</span>
            </>
          )}
          <span className="text-xs text-cream-muted mt-1 uppercase tracking-wide">AI</span>
        </div>
      </div>

      {/* Stat picker — only shown when it's player's turn in picking phase */}
      {state.phase === "picking" && state.isPlayerTurn && (
        <div className="space-y-2">
          <p className="text-center text-sm text-cream-muted uppercase tracking-wide font-medium mb-3">
            Choose a stat to compare
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {state.categories.map((cat, i) => {
              const val = playerCard.stats[cat.slug];
              return (
                <button
                  key={cat.slug}
                  onClick={() => handlePickStat(cat.slug)}
                  className={cn(
                    "flex flex-col items-center px-3 py-3 rounded-lg border-2",
                    "border-border bg-surface hover:border-gold hover:bg-gold-dim",
                    "transition-all text-center",
                  )}
                >
                  <span className="text-lg mb-0.5">{cat.emoji}</span>
                  <span className="text-xs font-bold text-cream uppercase tracking-wide">
                    {cat.shortLabel}
                  </span>
                  <span className="text-sm font-mono font-extrabold text-gold mt-1">
                    {val !== null ? formatStat(val, cat.unit) : "N/A"}
                  </span>
                  <span className="text-xxs text-cream-muted mt-0.5">
                    Press {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Waiting for AI pick */}
      {state.phase === "picking" && !state.isPlayerTurn && (
        <div className="text-center py-6">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite] mx-auto mb-3" />
          <p className="text-cream-muted text-sm">AI is thinking...</p>
        </div>
      )}

      {/* Reveal phase message */}
      {showReveal && roundWinner && (
        <div
          className={cn(
            "text-center py-4 rounded-xl border-2 font-bold text-lg",
            roundWinner === "player" && "border-correct/30 bg-correct/5 text-correct",
            roundWinner === "ai" && "border-incorrect/30 bg-incorrect/5 text-incorrect",
            roundWinner === "draw" && "border-gold/30 bg-gold-dim text-gold",
          )}
        >
          {roundWinner === "player" && "You win this round!"}
          {roundWinner === "ai" && "AI wins this round!"}
          {roundWinner === "draw" && "Draw!"}
        </div>
      )}

      {/* Remaining hand (small previews) */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {state.playerHand.map((card, i) => {
          const isCurrentCard = i === state.currentRound;
          const isPlayed = i < state.currentRound;
          return (
            <div
              key={card.country.iso3}
              className={cn(
                "flex flex-col items-center px-2 py-1.5 rounded-lg border text-center transition-all",
                isCurrentCard && "border-gold bg-gold-dim",
                isPlayed && "border-border bg-surface opacity-40",
                !isCurrentCard && !isPlayed && "border-border bg-surface",
              )}
            >
              <span className="text-xl">{card.country.flagEmoji}</span>
              <span className="text-xxs font-medium text-cream-muted leading-tight mt-0.5 max-w-[60px] truncate">
                {card.country.displayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
