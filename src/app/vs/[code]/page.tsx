"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoomByCode } from "@/lib/supabase/rooms";
import { useMultiplayer } from "@/hooks/use-multiplayer";

export default function VsJoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<{
    game_type: string;
    seed: number;
    code: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { connected, opponentJoined } = useMultiplayer(room?.code ?? null);

  useEffect(() => {
    getRoomByCode(params.code)
      .then((r) => {
        if (r) setRoom(r);
        else setError("Room not found");
      })
      .catch(() => setError("Room not found"));
  }, [params.code]);

  useEffect(() => {
    if (opponentJoined && room) {
      router.push(
        `/games/${room.game_type}/play?mode=versus&room=${room.code}`
      );
    }
  }, [opponentJoined, room, router]);

  if (error) {
    return (
      <div className="relative z-1 max-w-[430px] mx-auto px-5 py-20 text-center">
        <p className="text-cream-muted text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative z-1 max-w-[430px] mx-auto px-5 py-20 text-center">
      <div className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulse_2.5s_ease-out_infinite] mx-auto mb-4" />
      <p className="font-bold text-2xl text-cream mb-2">
        Waiting for opponent
      </p>
      <p className="text-cream-muted text-sm mb-6">
        Share this code:{" "}
        <span className="font-bold text-gold tracking-widest">
          {params.code.toUpperCase()}
        </span>
      </p>
      <p className="text-xs text-cream-ghost">
        {connected ? "Connected" : "Connecting..."}
      </p>

      {/* Shareable link */}
      {room && (
        <div className="mt-6 bg-surface rounded-xl p-4 border border-border max-w-md mx-auto">
          <p className="text-sm text-cream-muted mb-2">Share this link with your friend:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-bg px-3 py-2 rounded text-sm text-gold break-all">
              countrivo.com/vs/{room.code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://countrivo.com/vs/${room.code}`);
              }}
              className="shrink-0 px-3 py-2 text-sm font-semibold text-gold border border-gold-dim rounded-md hover:bg-gold-dim/20 transition-colors"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-cream-muted mt-2">Or share the code: <span className="font-mono text-cream font-bold tracking-wider">{room.code}</span></p>
        </div>
      )}
    </div>
  );
}
