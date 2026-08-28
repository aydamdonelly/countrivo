"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  createGame,
  getCurrentCountry,
  assignCategory,
  isComplete,
  canUndo,
  undoLastAssignment,
} from "@/lib/game-logic/country-draft/engine";
import { computeResult } from "@/lib/game-logic/country-draft/scoring";
import type { DraftGameState, DraftResult } from "@/lib/game-logic/country-draft/types";
import { CategorySlot } from "./category-slot";
import { CountryReveal } from "./country-reveal";
import { OptimalComparison } from "./optimal-comparison";
import { ShareCard } from "@/components/share/share-card";
import { useGameKeys } from "@/hooks/use-game-keys";
import { juice } from "@/hooks/use-juice";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { setDailyLockout, dailyProgressKey } from "@/lib/storage";
import { useDailyProgress } from "@/hooks/use-daily-progress";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { EndgameRamp } from "@/components/game/endgame-ramp";
import type { ServerGameRun } from "@/types/server";

type Action =
  | { type: "ASSIGN"; categoryIdx: number }
  | { type: "UNDO" }
  | { type: "RESET"; mode: "daily" | "practice" };

/**
 * After the 8th pick the board stays up so you can actually read the rank you
 * just landed — the run only resolves to the result screen when this window
 * closes (or you tap "See result"). Nothing is submitted until then, so the
 * one free undo still works on the final pick.
 */
const RESULT_REVEAL_MS = 60_000;

function init(mode: "daily" | "practice", edition: string): DraftGameState {
  const dateKey = mode === "daily" ? getTodayDateKey() : `practice-${Date.now()}`;
  const rng = mode === "daily" ? getDailyRng(dateKey, edition) : mulberry32(Date.now());
  return createGame(rng, mode, dateKey);
}

function reducer(state: DraftGameState, action: Action): DraftGameState {
  switch (action.type) {
    case "ASSIGN":
      return assignCategory(state, action.categoryIdx);
    case "UNDO":
      return undoLastAssignment(state);
    case "RESET":
      return init(action.mode, "");
    default:
      return state;
  }
}

interface DraftBoardProps {
  mode: "daily" | "practice";
  edition: string;
  onComplete?: (result: DraftResult) => void;
}

const GRADE_CONFIG: Record<string, { color: string; bg: string; message: string }> = {
  perfect: { color: "text-gold", bg: "bg-gold-dim", message: "Flawless. Optimal solution found." },
  excellent: { color: "text-correct", bg: "bg-correct-light", message: "Nearly perfect play." },
  great: { color: "text-accent", bg: "bg-accent/10", message: "Strong strategic thinking." },
  good: { color: "text-gold", bg: "bg-gold-dim", message: "Solid run. Room at the top." },
  okay: { color: "text-cream-muted", bg: "bg-surface", message: "Close. Better picks next time." },
  poor: { color: "text-cream-muted", bg: "bg-surface", message: "Brutal draw. Run it back." },
};

export function DraftBoard({ mode, edition, onComplete }: DraftBoardProps) {
  const { state, dispatch, startedAtRef } = useDailyProgress(reducer, () => init(mode, edition), {
    storageKey: dailyProgressKey("country-draft", getTodayDateKey(), edition),
    enabled: mode === "daily",
  });
  const [mounted, setMounted] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);  const { user, openAuthModal } = useAuth();

  // Pick feedback state
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "neutral" | "bad">("neutral");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackDelta, setFeedbackDelta] = useState<string | undefined>(undefined);

  const currentCountry = getCurrentCountry(state);
  const gameComplete = isComplete(state);

  // Running score across every pick made so far. Looping the whole board (not
  // just < currentStep) keeps the 8th pick counted during the reveal window.
  const runningScore = useMemo(() => {
    let total = 0;
    for (let i = 0; i < state.assignments.length; i++) {
      const catIdx = state.assignments[i];
      if (catIdx != null) {
        total += state.config.costMatrix[i][catIdx];
      }
    }
    return total;
  }, [state.assignments, state.config.costMatrix]);

  useEffect(() => { setMounted(true); }, []);

  // Hold the finished board on screen after the final pick so its rank is
  // readable, then resolve into the result screen.
  useEffect(() => {
    if (!gameComplete) return;
    const t = setTimeout(() => setRevealDone(true), RESULT_REVEAL_MS);
    return () => clearTimeout(t);
  }, [gameComplete]);

  useEffect(() => {
    if (gameComplete && revealDone && !result) {
      const r = computeResult(state);
      setResult(r);
      onComplete?.(r);

      if (mode === "daily") {
        setDailyLockout("country-draft", getTodayDateKey(), {
          score: String(r.playerScore),
          scoreDisplay: `${r.playerScore}`,
          timestamp: Date.now(),
        }, edition);
      }

      // Submit to server
      const doSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        // Max possible score: sum of worst ranks (243 per country × 8 countries)
        const MAX_POSSIBLE = 8 * 243;

        const payload = {
          gameSlug: "country-draft",
          mode: mode as "daily" | "practice",
          dateKey: getTodayDateKey(),
          scoreRaw: r.playerScore,
          scoreMax: MAX_POSSIBLE,
          scoreSortValue: MAX_POSSIBLE - r.playerScore, // lower score = better → invert
          scoreDisplay: `Score: ${r.playerScore} (Gap: ${r.gap})`,
          resultJson: {
            playerScore: r.playerScore,
            optimalScore: r.optimalScore,
            gap: r.gap,
            grade: r.grade,
            stars: r.stars,
            assignments: r.assignments,
            optimalAssignments: r.optimalAssignments,
            // ISO3 codes of the run's countries — used by the run-detail replay
            // and the server-side daily validator (country-draft/server-validate.ts).
            countryIso3s: state.config.countries.map((c) => c.iso3),
          },
          startedAt: startedAtRef.current,
        };

        if (user) {
          const res = await submitGameRun(payload);
          if (res.success && res.run) {
            setServerData(res.run);
          }
        } else {
          setPendingPayload(payload);
        }
        setSubmitting(false);
      };
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameComplete, revealDone]);

  // Gentle completion flourish when the run resolves to a result.
  useEffect(() => {
    if (result) juice.celebrate();
  }, [result]);

  const handleAssign = useCallback(
    (categoryIdx: number) => {
      if (gameComplete) return;

      // Compute feedback before dispatch changes state
      const countryIdx = state.currentStep;
      const rank = state.config.costMatrix[countryIdx][categoryIdx];

      // Fire haptic + sound the moment the pick quality is known, so it lands
      // together with the visual feedback below.
      if (rank <= 5) {
        juice.correct();
        setFeedbackType("good");
        setFeedbackMsg(`Great pick! Rank #${rank}`);
      } else if (rank <= 30) {
        juice.select();
        setFeedbackType("neutral");
        setFeedbackMsg(`Solid. Rank #${rank}`);
      } else {
        juice.wrong();
        setFeedbackType("bad");
        setFeedbackMsg(`Costly. Rank #${rank}`);
      }
      setFeedbackDelta(`+${rank} points`);
      setFeedbackKey((k) => k + 1);

      dispatch({ type: "ASSIGN", categoryIdx });
    },
    [gameComplete, state.currentStep, state.config.costMatrix]
  );

  // One free undo per run — also available on the final pick, because nothing
  // is submitted until the reveal window closes.
  const undoAvailable = canUndo(state);

  const handleUndo = useCallback(() => {
    if (!canUndo(state)) return;
    juice.select();
    setRevealDone(false);
    dispatch({ type: "UNDO" });
  }, [state]);

  const handlePlayAgain = useCallback(() => {
    setResult(null);
    setRevealDone(false);
    setPendingPayload(null);
    dispatch({ type: "RESET", mode: "practice" });
  }, []);

  const keymap = useMemo(() => {
    const map: Record<string, () => void> = {};
    if (currentCountry && !gameComplete) {
      state.config.categories.forEach((_, idx) => {
        if (!state.usedCategories.has(idx)) {
          map[String(idx + 1)] = () => handleAssign(idx);
        }
      });
    }
    return map;
  }, [currentCountry, gameComplete, state.config.categories, state.usedCategories, handleAssign]);

  useGameKeys(keymap, !gameComplete && !!currentCountry);

  // Prevent hydration mismatch — don't render game content until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 rounded-xl bg-surface-elevated" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-elevated" />
          ))}
        </div>
        <div className="h-6 rounded-lg bg-surface-elevated max-w-xs mx-auto" />
      </div>
    );
  }

  // ─── Results Phase ────────────────────────────────────────────────
  if (result) {
    const grade = GRADE_CONFIG[result.grade] || GRADE_CONFIG.poor;

    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <div className="flex flex-col gap-8">
        {/* Score hero */}
        <div className={`text-center p-8 sm:p-12 rounded-2xl ${grade.bg}`}>
          <div className="text-6xl sm:text-7xl mb-4 animate-scale-in">
            {"⭐".repeat(result.stars)}
          </div>
          <h2 className={`text-4xl sm:text-5xl font-extrabold capitalize ${grade.color} animate-count-up`}>
            {result.grade}!
          </h2>
          <p className="text-lg text-cream-muted mt-3">{grade.message}</p>

          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-8 flex-wrap">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.playerScore}</div>
              <div className="text-base text-cream-muted mt-1">Your Score</div>
            </div>
            <div className="w-px h-14 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.optimalScore}</div>
              <div className="text-base text-cream-muted mt-1">Optimal</div>
            </div>
            <div className="w-px h-14 bg-border hidden sm:block" />
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-extrabold font-mono">{result.gap}</div>
              <div className="text-base text-cream-muted mt-1">Gap</div>
            </div>
            {serverData?.rankDaily != null && (
              <>
                <div className="w-px h-14 bg-border hidden sm:block" />
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-gold">#{serverData.rankDaily}</div>
                  <div className="text-base text-cream-muted mt-1">Rank today</div>
                </div>
              </>
            )}
            {serverData?.percentile != null && (
              <>
                <div className="w-px h-14 bg-border hidden sm:block" />
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono">{Math.round(serverData.percentile)}%</div>
                  <div className="text-base text-cream-muted mt-1">Better than</div>
                </div>
              </>
            )}
          </div>
          {serverData?.isPersonalBest && (
            <div className="mt-4 px-4 py-2 bg-gold-dim text-gold text-sm font-bold rounded-full animate-scale-in">
              New personal best!
            </div>
          )}
        </div>

        {/* Comparison table */}
        <OptimalComparison
          config={state.config}
          playerAssignments={result.assignments}
          optimalAssignments={result.optimalAssignments}
        />

        {/* Share — spoiler-safe emoji grid (never the country answers) */}
        <ShareCard
          game="country-draft"
          result={{
            assignments: result.assignments,
            optimalAssignments: result.optimalAssignments,
            playerScore: result.playerScore,
          }}
          dateKey={state.config.dateKey}
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {handleSaveScore && (
            <button
              onClick={handleSaveScore}
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.97] transition-colors"
            >
              Save my score
            </button>
          )}
          {mode === "practice" && (
            <button
              onClick={handlePlayAgain}
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.97] transition-colors"
            >
              Play again
            </button>
          )}
          {mode === "daily" && (
            <Link
              href="/games/country-draft/play?mode=practice"
              className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.97] transition-colors text-center"
            >
              Practice unlimited
            </Link>
          )}
        </div>

        {/* Discovery: play another game */}
        <div className="border-t border-border pt-8">
          <p className="text-base font-bold text-cream-muted uppercase tracking-wide mb-4">Try another game</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link href="/games/higher-or-lower" className="game-card p-5 border border-black/5 bg-surface shadow-sm text-center">
              <span className="text-3xl block mb-2">⬆️</span>
              <span className="text-base font-bold">Higher or Lower</span>
            </Link>
            <Link href="/games/flag-quiz" className="game-card p-5 border border-black/5 bg-surface shadow-sm text-center">
              <span className="text-3xl block mb-2">🏁</span>
              <span className="text-base font-bold">Flag Quiz</span>
            </Link>
            <Link href="/games/population-sort" className="game-card p-5 border border-black/5 bg-surface shadow-sm text-center">
              <span className="text-3xl block mb-2">📊</span>
              <span className="text-base font-bold">Population Sort</span>
            </Link>
            <Link href="/games/capital-match" className="game-card p-5 border border-black/5 bg-surface shadow-sm text-center">
              <span className="text-3xl block mb-2">🏛️</span>
              <span className="text-base font-bold">Capital Match</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Final reveal ─────────────────────────────────────────────────
  // The 8th pick used to jump straight to the result screen, so you never got
  // to see what that last placement actually scored. Hold the finished board
  // here instead — nothing is submitted yet, so the free undo still applies.
  if (gameComplete) {
    return (
      <div className="flex flex-col gap-6">
        <GameSessionTopBar
          mode={mode}
          scoreLabel="Score"
          scoreValue={String(runningScore)}
          progressCurrent={state.config.countries.length}
          progressTotal={state.config.countries.length}
          extraInfo="All picks in"
        />

        <div className="text-center py-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Final pick locked in</h2>
          <p className="text-base text-cream-muted mt-1">
            Your board finished on{" "}
            <span className="font-mono font-bold text-cream">{runningScore}</span>. Take a
            look, then see how close to optimal you got.
          </p>
        </div>

        {/* The completed board — every country with the rank it scored */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {state.config.categories.map((cat, idx) => {
            const assignedStep = state.assignments.indexOf(idx);
            const assignedCountry =
              assignedStep !== -1 ? state.config.countries[assignedStep] : null;
            const rank =
              assignedStep !== -1 ? state.config.costMatrix[assignedStep][idx] : null;

            return (
              <CategorySlot
                key={cat.slug}
                category={cat}
                isAvailable={false}
                assignedCountry={assignedCountry}
                rank={rank}
                onClick={() => {}}
              />
            );
          })}
        </div>

        <PickFeedback
          type={feedbackType}
          message={feedbackMsg}
          delta={feedbackDelta}
          triggerKey={feedbackKey}
        />

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {undoAvailable && (
            <button
              onClick={handleUndo}
              className="px-6 py-3 rounded-xl border border-border font-bold text-cream-muted hover:text-cream hover:border-border-hover transition-colors active:scale-[0.97]"
            >
              ↩ Undo last pick
            </button>
          )}
          <button
            onClick={() => setRevealDone(true)}
            className="px-8 py-4 bg-gold text-bg font-bold text-lg rounded-xl hover:opacity-90 active:scale-[0.97] transition-colors"
          >
            See result →
          </button>
        </div>
      </div>
    );
  }

  // ─── Playing Phase ────────────────────────────────────────────────
  const picksRemaining = state.config.countries.length - state.currentStep;

  return (
    <div className="flex flex-col gap-6">
      {/* Session top bar */}
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Score"
        scoreValue={String(runningScore)}
        progressCurrent={state.currentStep}
        progressTotal={state.config.countries.length}
        extraInfo={`${picksRemaining} pick${picksRemaining !== 1 ? "s" : ""} left`}
      />

      {/* Endgame ramp warning */}
      <EndgameRamp
        picksRemaining={picksRemaining}
        totalPicks={state.config.countries.length}
      />

      {/* Current country */}
      {currentCountry && (
        <CountryReveal country={currentCountry} step={state.currentStep} />
      )}

      {/* Category slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {state.config.categories.map((cat, idx) => {
          const assignedStep = state.assignments.indexOf(idx);
          const assignedCountry =
            assignedStep !== -1 ? state.config.countries[assignedStep] : null;
          const rank =
            assignedStep !== -1 ? state.config.costMatrix[assignedStep][idx] : null;

          return (
            <CategorySlot
              key={cat.slug}
              category={cat}
              isAvailable={!state.usedCategories.has(idx)}
              assignedCountry={assignedCountry}
              rank={rank}
              onClick={() => handleAssign(idx)}
            />
          );
        })}
      </div>

      {/* Pick feedback */}
      <PickFeedback
        type={feedbackType}
        message={feedbackMsg}
        delta={feedbackDelta}
        triggerKey={feedbackKey}
      />

      {/* One free undo per run */}
      {undoAvailable && (
        <div className="flex justify-center">
          <button
            onClick={handleUndo}
            className="px-4 py-2 rounded-xl border border-border text-sm font-bold text-cream-muted hover:text-cream hover:border-border-hover transition-colors active:scale-[0.97]"
          >
            ↩ Undo last pick &middot; 1 left
          </button>
        </div>
      )}

      {/* Hint */}
      <p className="text-center text-lg text-cream-muted">
        Which category should{" "}
        <span className="font-bold text-cream">{currentCountry?.displayName}</span>{" "}
        go in?
      </p>
    </div>
  );
}
