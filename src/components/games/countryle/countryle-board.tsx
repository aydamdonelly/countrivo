"use client";

import { useReducer, useState, useCallback, useMemo, useRef } from "react";
import {
  createCountryle,
  submitGuess,
  getEligibleCountries,
} from "@/lib/game-logic/countryle/engine";
import {
  COUNTRYLE_CATEGORIES,
  type CountryleState,
  type CountryleCategoryResult,
  type CountryleGuessRow,
} from "@/lib/game-logic/countryle/types";
import { countries } from "@/lib/data/loader";
import { getDailyRng, getTodayDateKey } from "@/lib/daily-seed";
import { mulberry32 } from "@/lib/seeded-random";
import { GameOverScreen } from "@/components/game/game-over-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { submitGameRun } from "@/app/actions/game-runs";
import { setDailyLockout } from "@/lib/storage";
import type { ServerGameRun } from "@/types/server";
import type { Country } from "@/types/country";

interface CountryleBoardProps {
  mode: "daily" | "practice";
}

function init(mode: "daily" | "practice"): CountryleState {
  const dateKey = getTodayDateKey();
  const rng = mode === "daily" ? getDailyRng(dateKey) : mulberry32(Date.now());
  return createCountryle(rng, mode === "daily" ? dateKey : undefined);
}

type Action =
  | { type: "GUESS"; country: Country }
  | { type: "RESET" };

function reducer(state: CountryleState, action: Action): CountryleState {
  switch (action.type) {
    case "GUESS":
      return submitGuess(state, action.country);
    case "RESET":
      return init("practice");
    default:
      return state;
  }
}

const CATEGORY_LABELS: Record<string, { label: string; format: (v: number | null) => string }> = {
  "population": {
    label: "Pop.",
    format: (v) => v == null ? "N/A" : v >= 1e9 ? `${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v),
  },
  "area-km2": {
    label: "Area",
    format: (v) => v == null ? "N/A" : v >= 1e6 ? `${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : `${v}`,
  },
  "gdp-per-capita": {
    label: "GDP/cap",
    format: (v) => v == null ? "N/A" : v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K` : `$${Math.round(v)}`,
  },
  "life-expectancy": {
    label: "Life",
    format: (v) => v == null ? "N/A" : `${v.toFixed(1)} yr`,
  },
  "internet-users-pct": {
    label: "Internet",
    format: (v) => v == null ? "N/A" : `${v.toFixed(1)}%`,
  },
  "fertility-rate": {
    label: "Fertility",
    format: (v) => v == null ? "N/A" : v.toFixed(2),
  },
};

const ARROW: Record<string, string> = {
  higher: "↑",
  lower: "↓",
  match: "✓",
  unknown: "?",
};

const eligible = new Set(getEligibleCountries().map((c) => c.iso3));

function StatCell({ result, correct }: { result: CountryleCategoryResult; correct: boolean }) {
  const meta = CATEGORY_LABELS[result.category];
  const formatted = meta.format(result.guessedValue);
  const arrow = ARROW[result.direction];

  let bg = "bg-surface-elevated";
  if (correct) {
    bg = "bg-emerald-100";
  } else if (result.direction === "match") {
    bg = "bg-emerald-100";
  } else if (result.direction === "higher" || result.direction === "lower") {
    bg = "bg-amber-50";
  }

  return (
    <div className={`${bg} rounded-lg p-1.5 sm:p-2 text-center transition-colors`}>
      <div className="text-[9px] sm:text-xxs text-cream-muted font-medium uppercase tracking-wide leading-tight">
        {meta.label}
      </div>
      <div className="text-xxs sm:text-xs font-bold font-mono tabular-nums mt-0.5">
        {formatted}
      </div>
      <div className={`text-sm sm:text-base font-bold ${
        correct || result.direction === "match"
          ? "text-emerald-600"
          : result.direction === "unknown"
            ? "text-cream-muted"
            : "text-gold"
      }`}>
        {arrow}
      </div>
    </div>
  );
}

function GuessRow({ row }: { row: CountryleGuessRow }) {
  return (
    <div className={`rounded-xl p-2 sm:p-3 ${row.isCorrect ? "bg-emerald-50 ring-2 ring-emerald-400" : "bg-surface"} transition-all`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{row.country.flagEmoji}</span>
        <span className="font-bold text-sm sm:text-base truncate">{row.country.displayName}</span>
        <span className={`text-xxs sm:text-xs font-medium px-1.5 py-0.5 rounded ${
          row.continentMatch ? "bg-emerald-100 text-emerald-700" : "bg-black/5 text-cream-muted"
        }`}>
          {row.country.continent}
        </span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {row.comparisons.map((comp) => (
          <StatCell key={comp.category} result={comp} correct={row.isCorrect} />
        ))}
      </div>
    </div>
  );
}

function EmptyRow({ index }: { index: number }) {
  return (
    <div className="rounded-xl p-2 sm:p-3 border-2 border-dashed border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg opacity-20">🌍</span>
        <span className="text-sm text-cream-muted/40 font-medium">Guess {index + 1}</span>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {COUNTRYLE_CATEGORIES.map((cat) => (
          <div key={cat} className="bg-black/3 rounded-lg p-1.5 sm:p-2 text-center">
            <div className="text-[9px] sm:text-xxs text-cream-muted/40 font-medium uppercase tracking-wide leading-tight">
              {CATEGORY_LABELS[cat].label}
            </div>
            <div className="text-xxs sm:text-xs font-bold text-transparent">—</div>
            <div className="text-sm sm:text-base text-transparent">—</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CountryleBoard({ mode }: CountryleBoardProps) {
  const [state, dispatch] = useReducer(reducer, mode, init);
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [serverData, setServerData] = useState<ServerGameRun | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<Parameters<typeof submitGameRun>[0] | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const { user, openAuthModal } = useAuth();

  const guessedIso3s = useMemo(
    () => new Set(state.guesses.map((g) => g.country.iso3)),
    [state.guesses]
  );

  const suggestions = useMemo(() => {
    if (input.length < 1) return [];
    const query = input.toLowerCase();
    return countries
      .filter(
        (c) =>
          (c.displayName.toLowerCase().includes(query) || c.name.toLowerCase().includes(query)) &&
          !guessedIso3s.has(c.iso3) &&
          eligible.has(c.iso3)
      )
      .slice(0, 6);
  }, [input, guessedIso3s]);

  const handleSelect = useCallback(
    (c: Country) => {
      dispatch({ type: "GUESS", country: c });
      setInput("");
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    []
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && suggestions.length > 0) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      }
    },
    [suggestions, handleSelect]
  );

  // Submit to server when game ends
  if ((state.phase === "won" || state.phase === "lost") && !submitted) {
    setSubmitted(true);

    const won = state.phase === "won";
    const guessCount = won ? state.guesses.length : 7;
    const scoreDisplay = won ? `${state.guesses.length}/6` : "X/6";

    if (mode === "daily") {
      setDailyLockout("countryle", getTodayDateKey(), {
        score: String(guessCount),
        scoreDisplay,
        timestamp: Date.now(),
      });
    }

    const payload = {
      gameSlug: "countryle",
      mode: mode as "daily" | "practice",
      dateKey: getTodayDateKey(),
      scoreRaw: guessCount,
      scoreMax: 6,
      scoreSortValue: 7 - guessCount,
      scoreDisplay,
      resultJson: {
        target: state.target.iso3,
        guesses: state.guesses.map((g) => g.country.iso3),
        won,
        guessCount,
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

  if (state.phase === "won" || state.phase === "lost") {
    const won = state.phase === "won";
    const guessCount = won ? state.guesses.length : 7;
    const numericScore = won ? Math.round((1 - (state.guesses.length - 1) / 6) * 100) : 0;

    const handleSaveScore = pendingPayload ? () => {
      openAuthModal(async () => {
        const res = await submitGameRun(pendingPayload);
        if (res.success && res.run) setServerData(res.run);
        setPendingPayload(null);
      });
    } : undefined;

    return (
      <GameOverScreen
        title={won ? "Correct!" : "Not this time"}
        score={won ? `${state.guesses.length}/6` : "X/6"}
        subtitle={won
          ? state.guesses.length === 1 ? "Incredible — first try!" : `Found in ${state.guesses.length} guesses`
          : `The answer was ${state.target.flagEmoji} ${state.target.displayName}`
        }
        numericScore={numericScore}
        maxScore={100}
        gameSlug="countryle"
        onPlayAgain={mode === "practice" ? () => {
          setSubmitted(false);
          setServerData(null);
          setPendingPayload(null);
          dispatch({ type: "RESET" });
        } : undefined}
        onSaveScore={handleSaveScore}
        serverData={serverData ? {
          rankToday: serverData.rankDaily,
          percentile: serverData.percentile,
          totalPlayersToday: 0,
          isPersonalBest: serverData.isPersonalBest,
          runId: serverData.id,
        } : undefined}
      >
        <div className="space-y-2 mt-4">
          {state.guesses.map((row, i) => (
            <GuessRow key={i} row={row} />
          ))}
        </div>
      </GameOverScreen>
    );
  }

  const emptyRows = Array.from({ length: state.maxGuesses - state.guesses.length }, (_, i) => i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-cream-muted">
        <span>
          Guess <span className="font-bold text-cream">{state.guesses.length + 1}</span> / {state.maxGuesses}
        </span>
        <span className="text-xxs sm:text-xs uppercase tracking-wider font-medium">
          Pop. · Area · GDP/cap · Life · Internet · Fertility
        </span>
      </div>

      {/* Input with autocomplete */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => input.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Type a country name..."
          autoFocus
          className="w-full p-4 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
        />
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border-2 border-border rounded-xl shadow-lg z-10 overflow-hidden max-h-64 overflow-y-auto">
            {suggestions.map((c) => (
              <button
                key={c.iso3}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-3 hover:bg-surface-elevated transition-colors flex items-center gap-3"
              >
                <span className="text-xl">{c.flagEmoji}</span>
                <span className="font-medium">{c.displayName}</span>
                <span className="text-xs text-cream-muted ml-auto">{c.continent}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Guess grid */}
      <div className="space-y-2">
        {state.guesses.map((row, i) => (
          <GuessRow key={i} row={row} />
        ))}
        {emptyRows.map((_, i) => (
          <EmptyRow key={`empty-${i}`} index={state.guesses.length + i} />
        ))}
      </div>
    </div>
  );
}
