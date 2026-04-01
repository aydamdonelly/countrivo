"use client";

import { useReducer, useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  createSupremacy,
  pickStat,
  revealCards,
  advanceRound,
  aiPickStat,
  type SupremacyState,
  type SupremacyCard,
} from "@/lib/game-logic/supremacy/engine";
import { getDailyRng } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useGameKeys } from "@/hooks/use-game-keys";
import { useMultiplayer } from "@/hooks/use-multiplayer";

/* ── Props ─────────────────────────────────────────────────────────── */

interface SupremacyBoardProps {
  mode: "practice" | "versus";
  roomCode?: string | null;
  dailyKey?: string | null;
}

/* ── Reducer ───────────────────────────────────────────────────────── */

type Action =
  | { type: "PICK_STAT"; slug: string }
  | { type: "REVEAL"; opponentCard: SupremacyCard; chosenStat: string }
  | { type: "ADVANCE" }
  | { type: "RESET"; mode: "practice" | "daily" };

function initState(args: { mode: string; dailyKey?: string | null }): SupremacyState {
  const rng =
    args.mode === "daily" && args.dailyKey
      ? getDailyRng(args.dailyKey)
      : mulberry32(Date.now());
  return createSupremacy(rng, true);
}

function reducer(state: SupremacyState, action: Action): SupremacyState {
  switch (action.type) {
    case "PICK_STAT":
      return pickStat(state, action.slug);
    case "REVEAL":
      return revealCards(state, action.opponentCard, action.chosenStat);
    case "ADVANCE":
      return advanceRound(state);
    case "RESET":
      return initState({ mode: action.mode });
    default:
      return state;
  }
}

/* ── Board ─────────────────────────────────────────────────────────── */

export function SupremacyBoard({ mode, roomCode, dailyKey }: SupremacyBoardProps) {
  const [state, dispatch] = useReducer(
    reducer,
    { mode: dailyKey ? "daily" : mode, dailyKey },
    initState,
  );

  const [showReveal, setShowReveal] = useState(false);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Multiplayer hook (only active in versus mode) */
  const { connected, opponentJoined, lastMessage, send } = useMultiplayer(
    mode === "versus" ? roomCode ?? null : null,
  );

  const round = state.rounds[state.currentRound];
  const isVersus = mode === "versus";

  /* ── Practice AI logic ──────────────────────────────────────────── */

  useEffect(() => {
    if (isVersus) return;

    /* When it's the opponent's turn ("waiting"), AI picks after 1s */
    if (state.phase === "waiting" && !state.isMyTurn) {
      const oppCard = state.opponentHand[state.currentRound];
      if (!oppCard) return;

      aiTimerRef.current = setTimeout(() => {
        const chosenStat = aiPickStat(oppCard, state.categories);
        /* First set the chosen stat on our round, then reveal */
        dispatch({ type: "PICK_STAT", slug: chosenStat });
      }, 800);

      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }

    /* When phase is "reveal" but opponent card not shown yet (after AI pick or after my pick) */
    if (state.phase === "reveal" && !round?.opponentCard && round?.chosenStat) {
      const oppCard = state.opponentHand[state.currentRound];
      if (!oppCard) return;

      aiTimerRef.current = setTimeout(() => {
        dispatch({
          type: "REVEAL",
          opponentCard: oppCard,
          chosenStat: round.chosenStat!,
        });
        setShowReveal(true);
      }, 200);

      return () => {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
      };
    }
  }, [state.phase, state.isMyTurn, state.currentRound, state.opponentHand, state.categories, round?.opponentCard, round?.chosenStat, isVersus]);

  /* Auto-advance after reveal */
  useEffect(() => {
    if (showReveal && state.phase === "reveal" && round?.opponentCard) {
      const timer = setTimeout(() => {
        dispatch({ type: "ADVANCE" });
        setShowReveal(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showReveal, state.phase, round?.opponentCard]);

  /* ── Versus: handle incoming messages ───────────────────────────── */

  useEffect(() => {
    if (!isVersus || !lastMessage) return;

    if (lastMessage.type === "stat:pick" && !state.isMyTurn) {
      const slug = lastMessage.slug as string;
      /* Opponent picked a stat — set it and reveal */
      dispatch({ type: "PICK_STAT", slug });
    }

    if (lastMessage.type === "card:reveal") {
      const card = lastMessage.card as SupremacyCard;
      const stat = lastMessage.chosenStat as string;
      dispatch({ type: "REVEAL", opponentCard: card, chosenStat: stat });
      setShowReveal(true);
    }
  }, [lastMessage, isVersus, state.isMyTurn]);

  /* ── Handle my stat pick ────────────────────────────────────────── */

  const handlePickStat = useCallback(
    (slug: string) => {
      if (state.phase !== "picking" || !state.isMyTurn || showReveal) return;

      dispatch({ type: "PICK_STAT", slug });

      if (isVersus) {
        /* Send pick to opponent */
        send({ type: "stat:pick", slug });
        /* Also send my card for this round so opponent can reveal */
        send({
          type: "card:reveal",
          card: round.myCard,
          chosenStat: slug,
        });
      }
    },
    [state.phase, state.isMyTurn, showReveal, isVersus, send, round],
  );

  /* ── Keyboard shortcuts (1-5 for categories) ────────────────────── */

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (state.phase === "picking" && state.isMyTurn && !showReveal) {
      state.categories.forEach((cat, i) => {
        map[String(i + 1)] = () => handlePickStat(cat.slug);
      });
    }
    return map;
  }, [state.phase, state.isMyTurn, showReveal, state.categories, handlePickStat]);

  useGameKeys(keymap, state.phase === "picking" && state.isMyTurn && !showReveal);

  /* ── Results screen ─────────────────────────────────────────────── */

  if (state.phase === "results") {
    const won = state.myScore > state.opponentScore;
    const tied = state.myScore === state.opponentScore;
    const title = tied ? "Draw!" : won ? "You Win!" : "You Lose!";

    return (
      <GameOverScreen
        title={title}
        score={`${state.myScore} - ${state.opponentScore}`}
        subtitle={`${state.rounds.filter((r) => r.winner === "me").length} rounds won`}
        onPlayAgain={
          mode === "practice" ? () => dispatch({ type: "RESET", mode: "practice" }) : undefined
        }
      >
        {/* Round summary */}
        <div className="w-full max-w-md space-y-2">
          {state.rounds.map((r, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between px-4 py-2 rounded-lg border text-sm",
                r.winner === "me" && "border-correct/30 bg-correct/5",
                r.winner === "opponent" && "border-incorrect/30 bg-incorrect/5",
                r.winner === "draw" && "border-border bg-surface",
              )}
            >
              <span className="font-medium">
                {r.myCard.country.flagEmoji} {r.myCard.country.displayName}
              </span>
              <span className="text-cream-muted text-xs">vs</span>
              <span className="font-medium">
                {r.opponentCard?.country.flagEmoji} {r.opponentCard?.country.displayName}
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
        <p className="font-bold text-2xl text-cream">Waiting for opponent...</p>
        <p className="text-sm text-cream-muted">
          {connected ? "Connected" : "Connecting..."}
        </p>
      </div>
    );
  }

  /* ── Game UI ─────────────────────────────────────────────────────── */

  const myCard = round.myCard;
  const oppCard = round.opponentCard;
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
              state.myScore > state.opponentScore ? "text-gold" : "text-cream",
            )}
          >
            {state.myScore}
          </span>
          <span className="text-cream-muted text-sm">--</span>
          <span
            className={cn(
              "text-2xl font-extrabold font-mono",
              state.opponentScore > state.myScore ? "text-gold" : "text-cream",
            )}
          >
            {state.opponentScore}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-bold uppercase tracking-wide",
            state.isMyTurn ? "text-gold" : "text-cream-muted",
          )}
        >
          {state.isMyTurn ? "Your pick" : "Their pick"}
        </span>
      </div>

      {/* Cards area */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* My card (always face up) */}
        <div
          className={cn(
            "flex flex-col items-center p-5 sm:p-8 rounded-xl border-2 transition-all",
            showReveal && roundWinner === "me" && "border-correct/50 bg-correct/5",
            showReveal && roundWinner === "opponent" && "border-incorrect/50 bg-incorrect/5",
            showReveal && roundWinner === "draw" && "border-gold/50 bg-gold-dim",
            !showReveal && "border-border bg-surface",
          )}
        >
          <span className="text-6xl sm:text-7xl mb-2">{myCard.country.flagEmoji}</span>
          <span className="font-bold text-base sm:text-lg text-center">
            {myCard.country.displayName}
          </span>
          {chosenStat && (
            <span
              className={cn(
                "text-xl sm:text-2xl font-mono font-extrabold mt-3 transition-all",
                showReveal && roundWinner === "me" && "text-correct",
                showReveal && roundWinner === "opponent" && "text-incorrect",
                showReveal && roundWinner === "draw" && "text-gold",
                !showReveal && "text-cream",
              )}
            >
              {myCard.stats[chosenStat] !== null
                ? formatStat(
                    myCard.stats[chosenStat]!,
                    state.categories.find((c) => c.slug === chosenStat)?.unit ?? "",
                  )
                : "N/A"}
            </span>
          )}
          <span className="text-xs text-cream-muted mt-1 uppercase tracking-wide">You</span>
        </div>

        {/* Opponent card (face down until revealed) */}
        <div
          className={cn(
            "flex flex-col items-center p-5 sm:p-8 rounded-xl border-2 transition-all",
            showReveal && oppCard && roundWinner === "opponent" && "border-correct/50 bg-correct/5",
            showReveal && oppCard && roundWinner === "me" && "border-incorrect/50 bg-incorrect/5",
            showReveal && oppCard && roundWinner === "draw" && "border-gold/50 bg-gold-dim",
            !showReveal && "border-border bg-gold-dim",
          )}
        >
          {oppCard ? (
            <>
              <span className="text-6xl sm:text-7xl mb-2">{oppCard.country.flagEmoji}</span>
              <span className="font-bold text-base sm:text-lg text-center">
                {oppCard.country.displayName}
              </span>
              {chosenStat && (
                <span
                  className={cn(
                    "text-xl sm:text-2xl font-mono font-extrabold mt-3",
                    roundWinner === "opponent" && "text-correct",
                    roundWinner === "me" && "text-incorrect",
                    roundWinner === "draw" && "text-gold",
                  )}
                >
                  {oppCard.stats[chosenStat] !== null
                    ? formatStat(
                        oppCard.stats[chosenStat]!,
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
          <span className="text-xs text-cream-muted mt-1 uppercase tracking-wide">
            {isVersus ? "Opponent" : "AI"}
          </span>
        </div>
      </div>

      {/* Stat picker — only shown when it's my turn in picking phase */}
      {state.phase === "picking" && state.isMyTurn && (
        <div className="space-y-2">
          <p className="text-center text-sm text-cream-muted uppercase tracking-wide font-medium mb-3">
            Choose a stat to compare
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {state.categories.map((cat, i) => {
              const val = myCard.stats[cat.slug];
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
                  <span className="text-[10px] text-cream-muted mt-0.5">
                    Press {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Waiting for opponent pick */}
      {state.phase === "waiting" && !state.isMyTurn && (
        <div className="text-center py-6">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite] mx-auto mb-3" />
          <p className="text-cream-muted text-sm">
            {isVersus ? "Opponent is picking a stat..." : "AI is thinking..."}
          </p>
        </div>
      )}

      {/* Reveal phase message */}
      {showReveal && roundWinner && (
        <div
          className={cn(
            "text-center py-4 rounded-xl border-2 font-bold text-lg",
            roundWinner === "me" && "border-correct/30 bg-correct/5 text-correct",
            roundWinner === "opponent" && "border-incorrect/30 bg-incorrect/5 text-incorrect",
            roundWinner === "draw" && "border-gold/30 bg-gold-dim text-gold",
          )}
        >
          {roundWinner === "me" && "You win this round!"}
          {roundWinner === "opponent" && "They win this round!"}
          {roundWinner === "draw" && "Draw!"}
        </div>
      )}

      {/* Remaining hand (small previews) */}
      <div className="flex items-center justify-center gap-2 pt-2">
        {state.hand.map((card, i) => {
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
              <span className="text-[10px] font-medium text-cream-muted leading-tight mt-0.5 max-w-[60px] truncate">
                {card.country.displayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
