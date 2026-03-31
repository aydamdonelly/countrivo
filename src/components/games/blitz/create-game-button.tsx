"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRoom } from "@/lib/supabase/rooms";

export function CreateGameButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (loading) return;
    setLoading(true);
    try {
      const room = await createRoom("blitz");
      router.push(`/vs/${room.code}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="block w-full py-5 px-8 rounded-xl border-2 border-border bg-gold-dim hover:border-gold hover:bg-gold-dim transition-all text-center disabled:opacity-60"
    >
      <div className="text-3xl mb-2">⚔️</div>
      <h2 className="text-xl font-bold">Create Game</h2>
      <p className="text-base text-cream-muted mt-1">
        {loading ? "Creating room..." : "Challenge a friend to a flag speed battle."}
      </p>
    </button>
  );
}
