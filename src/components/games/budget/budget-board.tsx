"use client";

import { useCallback, useEffect, useState } from "react";
import { createBudget, adjust, submitBudget, tokensLeft } from "@/lib/game-logic/budget/engine";
import { budgetResult } from "@/lib/game-logic/budget/scoring";
import type { BudgetState } from "@/lib/game-logic/budget/types";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { countries } from "@/lib/data/loader";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import { Button } from "@/components/ui/button";
import type { ServerGameRun } from "@/types/server";

interface BudgetBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

const countryByIso3 = new Map(countries.map((c) => [c.iso3, c]));

function init(mode: "daily" | "practice", edition: string): BudgetState {
  const dateKey = getTodayDateKey();
  const rng = mode === "daily" ? getDailyRng(dateKey, edition) : mulberry32(Date.now());
  return createBudget(rng, mode, dateKey);
}

type Action =
  | { type: "ADJUST"; idx: number; delta: number }
  | { type: "SUBMIT" }
  | { type: "RESET"; edition: string };

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "ADJUST":
      return adjust(state, action.idx, action.delta);
    case "SUBMIT":
      return submitBudget(state);
    case "RESET":
      return init("practice", action.edition);
    default:
      return state;
  }
}

export function BudgetBoard({ mode, edition }: BudgetBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("budget", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const { user, openAuthModal } = useAuth();

  const { config } = state;

  useEffect(() => {
    if (state.phase !== "results") return;
    const r = budgetResult(state);

    if (mode === "daily") {
      setDailyLockout("budget", getTodayDateKey(), {
        score: String(r.accuracy),
        scoreDisplay: `${r.accuracy}% accurate`,
        timestamp: Date.now(),
      }, edition);
    }

    const payload = {
      gameSlug: "budget",
      mode,
      dateKey: getTodayDateKey(),
      scoreRaw: r.accuracy,
      scoreMax: 100,
      scoreSortValue: r.accuracy,
      scoreDisplay: `${r.accuracy}% accurate`,
      resultJson: {
        allocation: r.allocation,
        trueShares: r.trueShares,
        accuracy: r.accuracy,
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

  const handleAdjust = useCallback(
    (idx: number, delta: number) => dispatch({ type: "ADJUST", idx, delta }),
    [dispatch],
  );

  if (state.phase === "results") {
    const r = budgetResult(state);
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
        title={r.accuracy >= 90 ? "Sharp split!" : "Budget revealed"}
        score={`${r.accuracy}%`}
        subtitle={`${formatStat(config.total, config.unit)} ${config.metricLabel} across 5 countries`}
        numericScore={r.accuracy}
        maxScore={100}
        gameSlug="budget"
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
          {config.countries.map((c, i) => {
            const country = countryByIso3.get(c.iso3);
            const guess = r.allocation[i];
            const diff = guess - c.trueShare;
            return (
              <div key={c.iso3} className="flex items-center gap-3 px-4 py-2 rounded-lg border border-border bg-surface">
                <span className="text-2xl">{country?.flagEmoji}</span>
                <span className="font-medium flex-1 truncate">{country?.displayName}</span>
                <span className="text-sm text-cream-muted">you {guess}%</span>
                <span className="text-sm font-bold font-mono w-12 text-right">{c.trueShare}%</span>
                <span className={cn("text-xs font-mono w-10 text-right", Math.abs(diff) <= 3 ? "text-correct" : "text-cream-muted")}>
                  {diff > 0 ? `+${diff}` : diff}
                </span>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  const left = tokensLeft(state);

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Tokens left"
        scoreValue={String(left)}
        progressCurrent={config.tokens - left}
        progressTotal={config.tokens}
        extraInfo={left === 0 ? "ready" : `${left} to place`}
      />

      <div className="text-center">
        <p className="text-sm text-cream-muted">Each country&apos;s share of</p>
        <p className="text-xl font-extrabold">{formatStat(config.total, config.unit)} {config.metricLabel}</p>
        <p className="text-xs text-cream-muted">Spend all 100 tokens — more tokens = bigger share</p>
      </div>

      <div className="space-y-2.5">
        {config.countries.map((c, i) => {
          const country = countryByIso3.get(c.iso3);
          const tokens = state.allocation[i];
          return (
            <div key={c.iso3} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface">
              <span className="text-2xl">{country?.flagEmoji}</span>
              <span className="font-medium flex-1 truncate text-sm">{country?.displayName}</span>
              <Button onClick={() => handleAdjust(i, -5)} variant="secondary" size="sm" type="button" disabled={tokens === 0}>−5</Button>
              <Button onClick={() => handleAdjust(i, -1)} variant="secondary" size="sm" type="button" disabled={tokens === 0}>−</Button>
              <span className="w-10 text-center font-extrabold font-mono tabular-nums">{tokens}</span>
              <Button onClick={() => handleAdjust(i, 1)} variant="secondary" size="sm" type="button" disabled={left === 0}>+</Button>
              <Button onClick={() => handleAdjust(i, 5)} variant="secondary" size="sm" type="button" disabled={left === 0}>+5</Button>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => dispatch({ type: "SUBMIT" })}
        variant="primary"
        size="lg"
        type="button"
        disabled={left !== 0}
      >
        {left === 0 ? "Lock in the split" : `Place ${left} more token${left === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
