"use client";

import { useCallback, useEffect, useState } from "react";
import { createCaravan, buyItem, canBuy, goldLeft } from "@/lib/game-logic/caravan/engine";
import { caravanResult } from "@/lib/game-logic/caravan/scoring";
import type { CaravanState } from "@/lib/game-logic/caravan/types";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { countries } from "@/lib/data/loader";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { ServerGameRun } from "@/types/server";

interface CaravanBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

const countryByIso3 = new Map(countries.map((c) => [c.iso3, c]));

function init(mode: "daily" | "practice", edition: string): CaravanState {
  const dateKey = getTodayDateKey();
  const rng = mode === "daily" ? getDailyRng(dateKey, edition) : mulberry32(Date.now());
  return createCaravan(rng, mode, dateKey);
}

type Action = { type: "BUY"; idx: number } | { type: "RESET"; edition: string };

function reducer(state: CaravanState, action: Action): CaravanState {
  switch (action.type) {
    case "BUY":
      return buyItem(state, action.idx);
    case "RESET":
      return init("practice", action.edition);
    default:
      return state;
  }
}

export function CaravanBoard({ mode, edition }: CaravanBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("caravan", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const { user, openAuthModal } = useAuth();

  const { config } = state;

  useEffect(() => {
    if (state.phase !== "results") return;
    const r = caravanResult(state);

    if (mode === "daily") {
      setDailyLockout("caravan", getTodayDateKey(), {
        score: String(r.efficiency),
        scoreDisplay: `${r.efficiency}% of optimal`,
        timestamp: Date.now(),
      }, edition);
    }

    const payload = {
      gameSlug: "caravan",
      mode,
      dateKey: getTodayDateKey(),
      scoreRaw: r.efficiency,
      scoreMax: 100,
      scoreSortValue: r.efficiency,
      scoreDisplay: `${r.efficiency}% of optimal`,
      resultJson: {
        bought: r.bought,
        playerValue: r.playerValue,
        optimalValue: r.optimalValue,
        efficiency: r.efficiency,
        goldSpent: r.goldSpent,
        budget: r.budget,
        metric: config.metricLabel,
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
  }, [state, mode, user, config.metricLabel]);

  const handleBuy = useCallback((idx: number) => dispatch({ type: "BUY", idx }), [dispatch]);

  if (state.phase === "results") {
    const r = caravanResult(state);
    const optimalSet = new Set(config.optimalBasket);
    const handleSaveScore = pendingPayload
      ? () =>
          openAuthModal(async () => {
            const res = await submitGameRun(pendingPayload);
            if (res.success && res.run) setServerData(res.run);
            setPendingPayload(null);
          })
      : undefined;

    return (
      <GameOverScreen
        title={r.grade === "perfect" ? "Optimal caravan!" : "Caravan loaded"}
        score={`${r.efficiency}%`}
        subtitle={`${r.playerValue} of ${r.optimalValue} best value · ${r.goldSpent}/${r.budget} gold`}
        numericScore={r.efficiency}
        maxScore={100}
        gameSlug="caravan"
        onPlayAgain={
          mode === "practice"
            ? () => {
                setServerData(null);
                setPendingPayload(null);
                dispatch({ type: "RESET", edition });
              }
            : undefined
        }
        onSaveScore={handleSaveScore}
        serverData={
          serverData
            ? {
                rankToday: serverData.rankDaily,
                percentile: serverData.percentile,
                totalPlayersToday: 0,
                isPersonalBest: serverData.isPersonalBest,
                runId: serverData.id,
                dailyDate: serverData.dailyDate ?? undefined,
              }
            : undefined
        }
      >
        <div className="w-full max-w-md mx-auto space-y-2">
          <p className="text-xs uppercase tracking-wide text-cream-muted font-medium text-center">
            Your caravan · {config.metricLabel}
          </p>
          {state.bought.map((i) => {
            const it = config.items[i];
            const c = countryByIso3.get(it.iso3);
            return (
              <div
                key={it.iso3}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg border",
                  optimalSet.has(i) ? "border-correct/30 bg-correct/5" : "border-border bg-surface",
                )}
              >
                <span className="text-2xl">{c?.flagEmoji}</span>
                <span className="font-medium flex-1">{c?.displayName}</span>
                <span className="text-sm font-mono text-cream-muted">{it.value} pts · {it.price}g</span>
                {optimalSet.has(i) && <span className="text-correct font-bold">✓</span>}
              </div>
            );
          })}
          {r.efficiency < 100 && (
            <>
              <p className="text-xs uppercase tracking-wide text-cream-muted font-medium text-center pt-3">
                Optimal caravan ({config.optimalValue} pts)
              </p>
              {config.optimalBasket.map((i) => {
                const it = config.items[i];
                const c = countryByIso3.get(it.iso3);
                return (
                  <div key={it.iso3} className="flex items-center gap-3 px-4 py-2 rounded-lg border border-gold/30 bg-gold-dim">
                    <span className="text-2xl">{c?.flagEmoji}</span>
                    <span className="font-medium flex-1">{c?.displayName}</span>
                    <span className="text-sm font-mono text-cream-muted">{it.value} pts · {it.price}g</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </GameOverScreen>
    );
  }

  const gold = goldLeft(state);
  const caravanValue = state.bought.reduce((s, i) => s + config.items[i].value, 0);
  const slotsLeft = config.buyCount - state.bought.length;

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Value"
        scoreValue={String(caravanValue)}
        progressCurrent={state.bought.length}
        progressTotal={config.buyCount}
        extraInfo={`${gold}g left`}
      />

      <div className="text-center">
        <p className="text-sm text-cream-muted">Buy 5 — build the most valuable caravan by</p>
        <p className="text-xl font-extrabold">{config.metricLabel}</p>
        {config.metricClarifier && <p className="text-xs text-cream-muted">{config.metricClarifier}</p>}
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="px-4 py-2 rounded-xl bg-surface-elevated text-center min-w-20">
          <div className="text-xxs text-cream-muted font-medium uppercase tracking-wide">Gold left</div>
          <div className="text-lg font-extrabold font-mono text-gold">{gold}</div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-surface-elevated text-center min-w-20">
          <div className="text-xxs text-cream-muted font-medium uppercase tracking-wide">Slots</div>
          <div className="text-lg font-extrabold font-mono">{slotsLeft}</div>
        </div>
        <div className="px-4 py-2 rounded-xl bg-surface-elevated text-center min-w-20">
          <div className="text-xxs text-cream-muted font-medium uppercase tracking-wide">Value</div>
          <div className="text-lg font-extrabold font-mono">{caravanValue}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {config.items.map((it, i) => {
          const c = countryByIso3.get(it.iso3);
          const owned = state.bought.includes(i);
          const buyable = canBuy(state, i);
          return (
            <button
              key={it.iso3}
              onClick={() => handleBuy(i)}
              disabled={owned || !buyable}
              type="button"
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                owned && "border-correct/40 bg-correct/5 cursor-default",
                !owned && buyable && "border-border hover:border-gold hover:bg-gold-dim active:scale-[0.97] cursor-pointer",
                !owned && !buyable && "border-border bg-surface opacity-40 cursor-not-allowed",
              )}
            >
              <span className="text-3xl">{c?.flagEmoji}</span>
              <span className="text-xs font-bold text-center leading-tight truncate max-w-full">{c?.displayName}</span>
              <span className="text-xs font-mono text-cream-muted">{it.value} pts</span>
              <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded", owned ? "text-correct" : "text-gold")}>
                {owned ? "✓ owned" : `${it.price}g`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
