"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinCodeInput() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 4) {
      router.push(`/vs/${trimmed}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div className="flex items-center gap-2.5 mt-4">
      <label className="text-[13px] font-bold text-cream uppercase tracking-wide shrink-0">
        Code
      </label>
      <input
        type="text"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="_ _ _ _"
        autoComplete="off"
        autoCapitalize="characters"
        className="flex-1 bg-surface/70 border border-border rounded-md px-3 py-2 text-sm text-cream tracking-[6px] placeholder:text-cream-muted/40 focus:outline-none focus:border-gold/60 transition-colors text-center"
      />
      <button
        type="button"
        onClick={handleJoin}
        disabled={code.trim().length !== 4}
        className="shrink-0 px-4 py-2 text-sm font-semibold text-gold border border-gold-dim rounded-md hover:bg-gold-dim/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Join
      </button>
    </div>
  );
}
