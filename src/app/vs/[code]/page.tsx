"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoomByCode } from "@/lib/supabase/rooms";
import { useMultiplayer } from "@/hooks/use-multiplayer";
import { useAuth } from "@/components/auth/auth-provider";

export default function VsJoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [room, setRoom] = useState<{
    game_type: string;
    seed: number;
    code: string;
    player_count?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Host = first player in room (player_count === 1 when we loaded)
  const isHost = room?.player_count === 1;

  const {
    connected,
    opponentJoined,
    opponentDisconnected,
    myReady,
    opponentReady,
    countdown,
    sendReady,
  } = useMultiplayer(room?.code ?? null, isHost);

  useEffect(() => {
    getRoomByCode(params.code)
      .then((r) => {
        if (r) setRoom(r);
        else setError("Room not found");
      })
      .catch(() => setError("Room not found"));
  }, [params.code]);

  // Navigate to game when countdown finishes
  useEffect(() => {
    if (countdown === 0 && room) {
      const timer = setTimeout(() => {
        router.push(`/games/${room.game_type}/play?mode=versus&room=${room.code}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [countdown, room, router]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`https://countrivo.com/vs/${params.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [params.code]);

  if (error) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-lg font-bold">Room not found</p>
        <p className="text-sm text-cream-muted mt-1">This room may have expired.</p>
      </div>
    );
  }

  // Countdown overlay
  if (countdown !== null && countdown > 0) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="text-8xl font-extrabold font-mono text-gold animate-scale-in" key={countdown}>
          {countdown}
        </div>
        <p className="text-cream-muted mt-4 text-sm font-medium">Game starting...</p>
      </div>
    );
  }

  const myName = profile?.displayName ?? profile?.username ?? "You";

  return (
    <div className="max-w-md mx-auto px-5 py-12">
      {/* Room header */}
      <div className="text-center mb-8">
        <p className="text-4xl mb-3">⚔️</p>
        <h1 className="text-2xl font-extrabold">
          {room ? room.game_type.replace(/-/g, " ") : "Loading..."}
        </h1>
        <p className="text-sm text-cream-muted mt-1">
          Room <span className="font-mono font-bold text-gold tracking-widest">{params.code.toUpperCase()}</span>
        </p>
      </div>

      {/* Players */}
      <div className="space-y-3 mb-8">
        <PlayerRow
          name={myName}
          isReady={myReady}
          isYou
        />
        <PlayerRow
          name={opponentJoined ? "Opponent" : "Waiting..."}
          isReady={opponentReady}
          isWaiting={!opponentJoined}
        />
      </div>

      {/* Ready / Waiting */}
      {opponentJoined ? (
        <div className="text-center">
          {!myReady ? (
            <button
              onClick={sendReady}
              className="px-8 py-4 bg-gold text-white font-bold text-lg rounded-xl hover:brightness-110 transition-all active:scale-[0.97] w-full"
            >
              Ready!
            </button>
          ) : !opponentReady ? (
            <p className="text-sm text-cream-muted animate-pulse">Waiting for opponent to ready up...</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm text-cream-muted">
            Share this link to invite a friend:
          </p>
          <div className="flex items-center gap-2 bg-surface-elevated rounded-xl p-3 border border-border">
            <code className="flex-1 text-sm text-gold font-mono break-all">
              countrivo.com/vs/{params.code}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 px-3 py-2 text-sm font-bold text-gold border border-gold/30 rounded-lg hover:bg-gold-dim transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Connection status */}
      {opponentDisconnected && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-incorrect/8 border border-incorrect/20 text-center">
          <p className="text-sm font-medium text-incorrect">Opponent disconnected</p>
          <p className="text-xs text-cream-muted mt-1">Waiting for reconnection...</p>
        </div>
      )}
      <p className="text-center text-[11px] text-cream-muted mt-6">
        {connected ? "Connected" : "Connecting..."}
      </p>
    </div>
  );
}

function PlayerRow({ name, isReady, isYou, isWaiting }: {
  name: string;
  isReady: boolean;
  isYou?: boolean;
  isWaiting?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
      isReady
        ? "border-correct/40 bg-correct/5"
        : isWaiting
          ? "border-border border-dashed bg-surface-elevated opacity-50"
          : "border-border bg-surface-elevated"
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        isYou ? "bg-gold text-white" : "bg-black/5 text-cream-muted"
      }`}>
        {isWaiting ? "?" : name[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">
          {name}
          {isYou && <span className="text-gold text-xs ml-1">(you)</span>}
        </p>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
        isReady
          ? "bg-correct/10 text-correct"
          : isWaiting
            ? "text-cream-muted"
            : "text-cream-muted"
      }`}>
        {isReady ? "Ready ✓" : isWaiting ? "Empty" : "Not ready"}
      </span>
    </div>
  );
}
