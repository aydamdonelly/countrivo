"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinCodeInput() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const isValid = code.trim().length === 4;

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 4) {
      setError(false);
      router.push(`/vs/${trimmed}`);
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          maxLength={4}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="ABCD"
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="Game room code"
          aria-invalid={error}
          className={`w-24 bg-white border rounded-lg px-3 py-2 text-sm text-center font-mono tracking-[3px] placeholder:tracking-normal placeholder:text-black/25 placeholder:font-sans focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-incorrect/50 focus:ring-incorrect/20"
              : "border-black/10 focus:border-gold/50 focus:ring-gold/10"
          }`}
        />
        <button
          type="button"
          onClick={handleJoin}
          disabled={!isValid}
          className="shrink-0 px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Join
        </button>
      </div>
      {error && (
        <p className="text-xs text-incorrect mt-1.5 pick-feedback-enter" role="alert">
          Enter a 4-letter room code
        </p>
      )}
    </div>
  );
}
