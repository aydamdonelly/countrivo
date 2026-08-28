"use client";
import { CountryFlag } from "@/components/ui/country-flag";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createRiskZone,
  guess,
  bank,
  push,
  nextChain,
  riskMultiplier,
  RISK_CHAIN_COUNT,
  RISK_MAX_SCORE,
  type RiskZoneState,
} from "@/lib/game-logic/risk-zone/engine";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { cn, formatStat } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import type { Country } from "@/types/country";
import type { ServerGameRun } from "@/types/server";

interface RiskBoardProps {
  mode: "daily" | "practice";
  edition: string;
}

function init(mode: "daily" | "practice", edition: string): RiskZoneState {
  const rng = mode === "daily" ? getDailyRng(getTodayDateKey(), edition) : mulberry32(Date.now());
  return createRiskZone(rng);
}

type Action =
  | { type: "GUESS"; choice: "higher" | "lower" }
  | { type: "BANK" }
  | { type: "PUSH" }
  | { type: "NEXT" }
  | { type: "RESET" };

function reducer(state: RiskZoneState, action: Action): RiskZoneState {
  switch (action.type) {
    case "GUESS":
      return guess(state, action.choice);
    case "BANK":
      return bank(state);
    case "PUSH":
      return push(state);
    case "NEXT":
      return nextChain(state);
    case "RESET":
      return init("practice", "");
    default:
      return state;
  }
}

function CountryCard({
  country,
  value,
  label,
  unit,
  tone = "neutral",
}: {
  country: Country;
  value: number | null; // null → hidden "???"
  label: string;
  unit: string;
  tone?: "neutral" | "correct" | "wrong";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border-2 p-4",
        tone === "correct" && "border-correct/40 bg-correct/5",
        tone === "wrong" && "border-incorrect/40 bg-incorrect/5",
        tone === "neutral" && "border-border bg-surface",
      )}
    >
      <CountryFlag iso2={country.iso2} width={56} />
      <span className="font-bold text-base text-center">{country.displayName}</span>
      <span className="text-xxs text-cream-muted uppercase tracking-wide">{label}</span>
      <span className="font-mono font-extrabold text-lg tabular-nums">
        {value === null ? "? ? ?" : formatStat(value, unit)}
      </span>
    </div>
  );
}

export function RiskBoard({ mode, edition }: RiskBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("risk-zone", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const submittedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const { user, openAuthModal } = useAuth();

  const chain = state.chains[state.chainIndex];

  const handleGuess = useCallback(
    (choice: "higher" | "lower") => {
      if (state.phase !== "guess") return;
      const step = chain.steps[state.stepIndex];
      const correct = choice === step.answer;
      if (correct) {
        juice.correct();
        setFeedbackType("good");
        setFeedbackMessage("Correct");
      } else {
        juice.wrong();
        setFeedbackType("bad");
        setFeedbackMessage("Busted");
      }
      setFeedbackKey((k) => k + 1);
      dispatch({ type: "GUESS", choice });
    },
    [state.phase, state.stepIndex, chain, dispatch],
  );

  const handleBank = useCallback(() => {
    if (state.phase !== "decide") return;
    juice.celebrate();
    setFeedbackType("good");
    setFeedbackMessage(`Banked +${state.pendingPot}`);
    setFeedbackKey((k) => k + 1);
    dispatch({ type: "BANK" });
  }, [state.phase, state.pendingPot, dispatch]);

  const handlePush = useCallback(() => {
    if (state.phase !== "decide") return;
    dispatch({ type: "PUSH" });
  }, [state.phase, dispatch]);

  const handleNext = useCallback(() => {
    dispatch({ type: "NEXT" });
  }, [dispatch]);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (state.phase === "guess") {
      map["ArrowUp"] = () => handleGuess("higher");
      map["h"] = () => handleGuess("higher");
      map["ArrowDown"] = () => handleGuess("lower");
      map["l"] = () => handleGuess("lower");
    } else if (state.phase === "decide") {
      map["b"] = () => handleBank();
      map["p"] = () => handlePush();
    } else if (state.phase === "wiped" || state.phase === "banked") {
      map["Enter"] = () => handleNext();
    }
    return map;
  }, [state.phase, handleGuess, handleBank, handlePush, handleNext]);
  useGameKeys(keymap, state.phase !== "results");

  // Submit once when all chains are done.
  useEffect(() => {
    if (state.phase !== "results" || submittedRef.current) return;
    submittedRef.current = true;
    if (mode === "daily") {
      setDailyLockout(
        "risk-zone",
        getTodayDateKey(),
        { score: String(state.bankedTotal), scoreDisplay: `${state.bankedTotal} pts`, timestamp: Date.now() },
        edition,
      );
    }
    const payload = {
      gameSlug: "risk-zone",
      mode,
      dateKey: getTodayDateKey(),
      scoreRaw: state.bankedTotal,
      scoreMax: RISK_MAX_SCORE,
      scoreSortValue: state.bankedTotal,
      scoreDisplay: `${state.bankedTotal} pts`,
      resultJson: {
        score: state.bankedTotal,
        chains: state.log.map((l) => ({ outcome: l.outcome, bankedAt: l.bankedAt, points: l.points })),
      },
      startedAt: startedAtRef.current,
    };
    if (user) {
      submitGameRun(payload).then((res) => {
        if (res.success && res.run) setServerData(res.run);
      });
    } else {
      setPendingPayload(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === "results") juice.celebrate();
  }, [state.phase]);

  if (mode === "practice" && !mounted) {
    return (
      <div className="flex flex-col gap-5">
        <GameSessionTopBar
          mode={mode}
          scoreLabel="Banked"
          scoreValue="0"
          progressCurrent={0}
          progressTotal={RISK_CHAIN_COUNT}
        />
        <div className="h-64 rounded-2xl border-2 border-border bg-surface opacity-50" aria-hidden />
      </div>
    );
  }

  if (state.phase === "results") {
    const glyphs = state.log
      .map((l) => (l.outcome === "wiped" ? "💥" : l.bankedAt >= 3 ? "🎲" : "🏦"))
      .join("");
    const handleSaveScore = pendingPayload
      ? () => {
          openAuthModal(async () => {
            const res = await submitGameRun(pendingPayload);
            if (res.success && res.run) setServerData(res.run);
            setPendingPayload(null);
          });
        }
      : undefined;
    return (
      <GameOverScreen
        title={`${state.bankedTotal} pts`}
        score={`${state.bankedTotal}`}
        subtitle={
          state.bankedTotal >= 2000
            ? "Ice cold. Banked it all."
            : state.bankedTotal >= 1000
              ? "Sharp instincts."
              : state.bankedTotal >= 400
                ? "You played it safe."
                : "The Risk Zone won this time."
        }
        onPlayAgain={
          mode === "practice"
            ? () => {
                submittedRef.current = false;
                setServerData(null);
                setPendingPayload(null);
                dispatch({ type: "RESET" });
              }
            : undefined
        }
        onSaveScore={handleSaveScore}
        numericScore={state.bankedTotal}
        maxScore={RISK_MAX_SCORE}
        gameSlug="risk-zone"
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
        <div className="w-full max-w-md space-y-3">
          <p className="text-center text-2xl tracking-widest" aria-hidden>{glyphs}</p>
          {state.log.map((l, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl border",
                l.outcome === "banked" ? "border-correct/30 bg-correct/5" : "border-incorrect/30 bg-incorrect/5",
              )}
            >
              <span className="text-xl">{l.outcome === "banked" ? "🏦" : "💥"}</span>
              <span className="font-medium text-sm">{l.category}</span>
              <span className="ml-auto font-mono font-bold text-sm tabular-nums">
                {l.outcome === "banked" ? `+${l.points} (x${riskMultiplier(l.bankedAt)})` : "wiped"}
              </span>
            </div>
          ))}
        </div>
      </GameOverScreen>
    );
  }

  const cat = chain.category;
  const anchorCountry = state.correctInChain === 0 ? chain.base : chain.steps[state.stepIndex - 1].challenger;
  const challengerStep = chain.steps[state.stepIndex];
  const decided = state.phase === "decide";
  const revealed = state.lastReveal;

  return (
    <div className="flex flex-col gap-5">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Banked"
        scoreValue={String(state.bankedTotal)}
        progressCurrent={state.chainIndex}
        progressTotal={RISK_CHAIN_COUNT}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />

      <div className="text-center">
        <p className="text-sm font-semibold inline-flex items-center gap-1.5">
          <span aria-hidden>{cat.emoji}</span>
          {cat.label}
        </p>
        <p className="text-xs text-cream-muted mt-0.5">
          Chain {state.chainIndex + 1} of {RISK_CHAIN_COUNT}
          <span className="text-gold mx-1.5">·</span>
          <span className="font-bold text-gold">x{riskMultiplier(state.correctInChain)}</span> · pot {state.pendingPot}
        </p>
      </div>

      {state.phase === "guess" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <CountryCard country={anchorCountry} value={state.anchorValue} label={cat.shortLabel} unit={cat.unit} />
            <CountryCard country={challengerStep.challenger} value={null} label={cat.shortLabel} unit={cat.unit} />
          </div>
          <p className="text-center text-sm text-cream-muted">
            Is {challengerStep.challenger.displayName} higher or lower?
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
            <button
              onClick={() => handleGuess("higher")}
              className="min-h-[52px] rounded-xl border-2 border-border bg-surface font-bold text-lg hover:border-gold active:scale-[0.97] transition-all"
            >
              ↑ Higher
            </button>
            <button
              onClick={() => handleGuess("lower")}
              className="min-h-[52px] rounded-xl border-2 border-border bg-surface font-bold text-lg hover:border-gold active:scale-[0.97] transition-all"
            >
              ↓ Lower
            </button>
          </div>
        </>
      )}

      {decided && revealed && (
        <>
          <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto w-full">
            <CountryCard
              country={revealed.challenger}
              value={revealed.challengerValue}
              label={cat.shortLabel}
              unit={cat.unit}
              tone="correct"
            />
          </div>
          <div className="text-center">
            <p className="font-bold text-correct">Correct! Pot is {state.pendingPot} pts.</p>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto w-full">
            <button
              onClick={handleBank}
              className="min-h-[52px] rounded-xl bg-gold text-bg font-bold text-lg active:scale-[0.97] transition-all"
            >
              Bank {state.pendingPot} pts
            </button>
            <button
              onClick={handlePush}
              className="min-h-[52px] rounded-xl border-2 border-incorrect/40 text-cream font-bold text-base active:scale-[0.97] transition-all"
            >
              Push to x{riskMultiplier(state.correctInChain + 1)}
              <span className="block text-xxs font-normal text-cream-muted mt-0.5">
                one wrong wipes {state.pendingPot}
              </span>
            </button>
          </div>
        </>
      )}

      {state.phase === "wiped" && revealed && (
        <>
          <div className="max-w-xs mx-auto w-full">
            <CountryCard
              country={revealed.challenger}
              value={revealed.challengerValue}
              label={cat.shortLabel}
              unit={cat.unit}
              tone="wrong"
            />
          </div>
          <p className="text-center font-bold text-incorrect">Busted. The chain is wiped.</p>
          <button
            onClick={handleNext}
            className="min-h-[52px] max-w-xs mx-auto w-full rounded-xl bg-gold text-bg font-bold text-lg active:scale-[0.97] transition-all"
          >
            {state.chainIndex + 1 >= RISK_CHAIN_COUNT ? "See results" : "Next chain"}
          </button>
        </>
      )}

      {state.phase === "banked" && (
        <>
          <p className="text-center font-bold text-correct text-lg">Banked {state.pendingPot} pts.</p>
          <button
            onClick={handleNext}
            className="min-h-[52px] max-w-xs mx-auto w-full rounded-xl bg-gold text-bg font-bold text-lg active:scale-[0.97] transition-all"
          >
            {state.chainIndex + 1 >= RISK_CHAIN_COUNT ? "See results" : "Next chain"}
          </button>
        </>
      )}
    </div>
  );
}
