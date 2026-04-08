"use client";

import { useState, useEffect } from "react";
import { getFriends } from "@/app/actions/friends";
import { createChallenge } from "@/app/actions/challenges";
import type { FriendEntry } from "@/app/actions/friends";

interface ChallengeFriendPickerProps {
  gameSlug: string;
  dailyDate: string;
  runId: number;
  onClose: () => void;
}

export function ChallengeFriendPicker({ gameSlug, dailyDate, runId, onClose }: ChallengeFriendPickerProps) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFriends().then((f) => { setFriends(f); setLoading(false); });
  }, []);

  const handleChallenge = async (challengedId: string) => {
    const res = await createChallenge(challengedId, gameSlug, dailyDate, runId);
    if (res.success) setSentTo((prev) => new Set([...prev, challengedId]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-lg">Challenge a friend</h3>
          <button onClick={onClose} className="text-cream-muted hover:text-cream text-xl leading-none">✕</button>
        </div>

        {loading && <p className="text-sm text-cream-muted py-4 text-center">Loading friends...</p>}

        {!loading && friends.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-sm text-cream-muted">You have no friends yet.</p>
            <a href="/friends" className="text-sm text-gold font-medium mt-2 block">Add friends →</a>
          </div>
        )}

        {!loading && friends.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {friends.map((f) => {
              const name = f.profile.displayName ?? f.profile.username;
              const sent = sentTo.has(f.profile.id);
              return (
                <div key={f.friendshipId} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-elevated">
                  <div className="w-8 h-8 rounded-full bg-gold-dim flex items-center justify-center text-sm font-bold text-gold shrink-0">
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {f.todayRuns.some((r) => r.gameSlug === gameSlug) && (
                      <p className="text-xs text-cream-muted">Already played: {f.todayRuns.find((r) => r.gameSlug === gameSlug)?.scoreDisplay}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleChallenge(f.profile.id)}
                    disabled={sent}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-white disabled:opacity-50"
                  >
                    {sent ? "Sent!" : "Challenge"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
