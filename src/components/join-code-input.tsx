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
    <div className="flex items-center gap-2.5 mt-6 max-w-sm">
      <input
        type="text"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={handleKeyDown}
        placeholder="Game code"
        autoComplete="off"
        autoCapitalize="characters"
        className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-center tracking-[4px] placeholder:tracking-normal placeholder:text-black/30 focus:outline-none focus:border-black/25 transition-colors"
      />
      <button
        type="button"
        onClick={handleJoin}
        disabled={code.trim().length !== 4}
        className="shrink-0 px-5 py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Join
      </button>
    </div>
  );
}
