"use client";

import { useReducer, useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  createSprint,
  pickContinent,
  guessCountry,
  finishSprint,
  CONTINENTS,
  type SprintState,
  type Continent,
} from "@/lib/game-logic/continent-sprint/engine";
import { countries } from "@/lib/data/loader";
import { cn } from "@/lib/utils";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { GameSessionTopBar } from "@/components/game/game-session-top-bar";
import { PickFeedback } from "@/components/game/pick-feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import type { ServerGameRun } from "@/types/server";

interface SprintBoardProps {
  mode: "daily" | "practice";
}

type Action =
  | { type: "PICK_CONTINENT"; continent: Continent }
  | { type: "GUESS"; iso3: string }
  | { type: "FINISH" }
  | { type: "TICK" }
  | { type: "RESET" };

function reducer(state: SprintState, action: Action): SprintState {
  switch (action.type) {
    case "PICK_CONTINENT": return pickContinent(state, action.continent);
    case "GUESS": return guessCountry(state, action.iso3);
    case "FINISH": return finishSprint(state);
    case "TICK": {
      if (state.phase !== "playing") return state;
      return { ...state, elapsed: Date.now() - state.startTime };
    }
    case "RESET": return createSprint();
    default: return state;
  }
}

const CONTINENT_EMOJIS: Record<Continent, string> = {
  Africa: "🌍",
  Americas: "🌎",
  Asia: "🌏",
  Europe: "🏰",
  Oceania: "🏝️",
  Antarctica: "🧊",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function SprintBoard({ mode }: SprintBoardProps) {
  const [state, dispatch] = useReducer(reducer, undefined, createSprint);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const [feedbackType, setFeedbackType] = useState<"good" | "bad">("good");
  const [feedbackMessage, setFeedbackMessage] = useState("Found!");
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user } = useAuth();

  // Timer tick
  useEffect(() => {
    if (state.phase !== "playing") return;
    const interval = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(interval);
  }, [state.phase]);

  const suggestions = useMemo(() => {
    if (input.length < 1 || state.phase !== "playing") return [];
    const query = input.toLowerCase();
    return countries
      .filter(
        (c) =>
          c.displayName.toLowerCase().includes(query) &&
          !state.found.includes(c.iso3)
      )
      .slice(0, 6);
  }, [input, state.found, state.phase]);

  const handleSelect = useCallback(
    (iso3: string) => {
      const isNew = !state.found.includes(iso3) && state.allCountries.some((c) => c.iso3 === iso3);
      if (isNew) {
        setFeedbackType("good");
        setFeedbackMessage("Found!");
        setFeedbackKey((k) => k + 1);
      }
      dispatch({ type: "GUESS", iso3 });
      setInput("");
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [state.found, state.allCountries]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  }, []);

  // Continent picker
  if (state.phase === "picking") {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">Pick a Continent</h2>
          <p className="text-sm text-cream-muted mt-1">
            Name as many countries as you can
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CONTINENTS.filter((c) => c !== "Antarctica").map((continent) => {
            const count = countries.filter((c) => c.continent === continent).length;
            return (
              <button
                key={continent}
                onClick={() => dispatch({ type: "PICK_CONTINENT", continent })}
                className="flex flex-col items-center p-6 rounded-xl border-2 border-border hover:border-border-hover hover:bg-surface transition-all"
              >
                <span className="text-3xl mb-2">{CONTINENT_EMOJIS[continent]}</span>
                <span className="font-bold">{continent}</span>
                <span className="text-xs text-cream-muted mt-1">{count} countries</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Submit to server when game ends
  if (state.phase === "results" && !submitted) {
    setSubmitted(true);
    const payload = {
      gameSlug: "continent-sprint",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: state.found.length,
      scoreMax: state.allCountries.length,
      scoreSortValue: state.found.length,
      scoreDisplay: `${state.found.length} / ${state.allCountries.length}`,
      resultJson: {
        found: state.found.length,
        total: state.allCountries.length,
        continent: state.continent,
        elapsed: state.elapsed,
      },
      startedAt: startedAtRef.current,
    };
    if (user) {
      submitGameRun(payload).then((res) => {
        if (res.success && res.run) setServerData(res.run);
      });
    }
  }

  if (state.phase === "results") {
    return (
      <GameOverScreen
        title="Sprint Complete!"
        score={`${state.found.length} / ${state.allCountries.length}`}
        subtitle={`${state.continent} in ${formatTime(state.elapsed)}`}
        onPlayAgain={() => { setSubmitted(false); setServerData(null); dispatch({ type: "RESET" }); }}
        numericScore={state.found.length}
        maxScore={state.allCountries.length}
        gameSlug="continent-sprint"
        serverData={serverData ? { rankToday: serverData.rankDaily, percentile: serverData.percentile, totalPlayersToday: 0, isPersonalBest: serverData.isPersonalBest, runId: serverData.id, dailyDate: serverData.dailyDate ?? undefined } : undefined}
      >
        <div className="w-full max-w-md space-y-2 max-h-64 overflow-y-auto">
          {state.allCountries.map((c) => {
            const wasFound = state.found.includes(c.iso3);
            return (
              <div
                key={c.iso3}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg border",
                  wasFound
                    ? "border-correct/30 bg-correct/5"
                    : "border-incorrect/30 bg-incorrect/5"
                )}
              >
                <span className="text-lg">{c.flagEmoji}</span>
                <span className="text-sm font-medium flex-1">{c.displayName}</span>
                <span className="text-xs">
                  {wasFound ? "✓" : "✗"}
                </span>
              </div>
            );
          })}
        </div>
      </GameOverScreen>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <GameSessionTopBar
        mode={mode}
        scoreLabel="Named"
        scoreValue={String(state.found.length)}
        progressCurrent={state.found.length}
        progressTotal={state.allCountries.length}
        extraInfo={formatTime(state.elapsed)}
      />
      <PickFeedback type={feedbackType} message={feedbackMessage} triggerKey={feedbackKey} />
      {/* Header stats */}
      <div className="flex items-center justify-between text-sm text-cream-muted">
        <span>
          {CONTINENT_EMOJIS[state.continent!]} <span className="font-bold text-cream">{state.continent}</span>
        </span>
        <span className="font-mono font-bold text-cream">{formatTime(state.elapsed)}</span>
      </div>

      <div className="text-center">
        <span className="text-3xl font-bold font-mono">
          {state.found.length}
        </span>
        <span className="text-cream-muted"> / {state.allCountries.length}</span>
      </div>

      {/* Input with autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => input.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Type a country name..."
          autoFocus
          className="w-full p-4 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
        />
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border-2 border-border rounded-xl shadow-lg z-10 overflow-hidden">
            {suggestions.map((c) => (
              <button
                key={c.iso3}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c.iso3)}
                className="w-full text-left px-4 py-3 hover:bg-surface transition-colors flex items-center gap-3"
              >
                <span className="text-xl">{c.flagEmoji}</span>
                <span className="font-medium">{c.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Found countries list */}
      {state.found.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {[...state.found].reverse().map((iso3) => {
            const c = countries.find((co) => co.iso3 === iso3);
            if (!c) return null;
            return (
              <div
                key={iso3}
                className="flex items-center gap-2 p-2 rounded-lg border border-correct/30 bg-correct/5"
              >
                <span className="text-lg">{c.flagEmoji}</span>
                <span className="text-sm font-medium">{c.displayName}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Give Up button */}
      <button
        onClick={() => dispatch({ type: "FINISH" })}
        className="mx-auto px-6 py-3 text-sm text-cream-muted border border-border rounded-xl hover:bg-surface transition-colors"
      >
        Finish
      </button>
    </div>
  );
}
