"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  type FriendEntry,
  type PendingRequest,
} from "@/app/actions/friends";
import type { FriendChallenge } from "@/app/actions/challenges";
import type { Profile } from "@/types/server";
import { GAME_COLORS } from "@/lib/game-colors";

interface FriendsClientProps {
  initialFriends: FriendEntry[];
  initialPendingRequests: PendingRequest[];
  initialPendingChallenges: FriendChallenge[];
  currentUserId: string;
  currentUsername: string;
}

export function FriendsClient({
  initialFriends,
  initialPendingRequests,
  initialPendingChallenges,
  currentUserId,
  currentUsername,
}: FriendsClientProps) {
  const [friends, setFriends] = useState(initialFriends);
  const [pendingRequests, setPendingRequests] = useState(initialPendingRequests);
  const pendingChallenges = initialPendingChallenges;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [inviteCopied, setInviteCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/friends/add/${currentUsername}`;
  }, [currentUsername]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    const results = await searchUsers(q);
    setSearchResults(results);
    setSearching(false);
  }, []);

  const handleSendRequest = useCallback(async (addresseeId: string) => {
    const res = await sendFriendRequest(addresseeId);
    if (res.success) setSentTo((prev) => new Set([...prev, addresseeId]));
  }, []);

  const handleRespond = useCallback(async (friendshipId: number, accept: boolean) => {
    startTransition(async () => {
      await respondToFriendRequest(friendshipId, accept);
      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    });
  }, []);

  const handleRemove = useCallback(async (friendshipId: number) => {
    startTransition(async () => {
      await removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    });
  }, []);

  return (
    <div className="space-y-8">

      {/* ── Search ── */}
      <section>
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Find players</h2>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by username..."
          aria-label="Search players by username"
          className="w-full p-3 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors"
        />
        {searching && <p className="text-sm text-cream-muted mt-2">Searching...</p>}
        {searchResults.length > 0 && (
          <div className="mt-2 space-y-2">
            {searchResults.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                <Avatar name={p.displayName ?? p.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.displayName ?? p.username}</p>
                  <p className="text-xs text-cream-muted">@{p.username}</p>
                </div>
                <button
                  onClick={() => handleSendRequest(p.id)}
                  disabled={sentTo.has(p.id)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-white disabled:opacity-50 transition-opacity"
                >
                  {sentTo.has(p.id) ? "Sent!" : "Add"}
                </button>
              </div>
            ))}
          </div>
        )}
        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p className="text-sm text-cream-muted mt-2">No players found.</p>
        )}
      </section>

      {/* ── Invite Link ── */}
      <section>
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Invite a friend</h2>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-elevated border border-border">
          <code className="flex-1 text-sm text-gold font-mono break-all truncate">
            {inviteUrl || `countrivo.com/friends/add/${currentUsername}`}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              setInviteCopied(true);
              setTimeout(() => setInviteCopied(false), 2000);
            }}
            className="shrink-0 px-3 py-2 text-sm font-bold text-gold border border-gold/30 rounded-lg hover:bg-gold-dim transition-colors"
          >
            {inviteCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>

      {/* ── Pending Requests ── */}
      {pendingRequests.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">
            Friend requests <span className="text-gold">({pendingRequests.length})</span>
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.friendshipId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border">
                <Avatar name={req.profile.displayName ?? req.profile.username} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{req.profile.displayName ?? req.profile.username}</p>
                  <p className="text-xs text-cream-muted">@{req.profile.username}</p>
                </div>
                <button
                  onClick={() => handleRespond(req.friendshipId, true)}
                  disabled={isPending}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-white disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRespond(req.friendshipId, false)}
                  disabled={isPending}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-cream-muted disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pending Challenges ── */}
      {pendingChallenges.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">
            Challenges <span className="text-gold">({pendingChallenges.length})</span>
          </h2>
          <div className="space-y-2">
            {pendingChallenges.map((c) => {
              const colors = GAME_COLORS[c.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-border" style={{ backgroundColor: colors.bg }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm" style={{ color: colors.text }}>
                      {c.challengerProfile?.displayName ?? c.challengerProfile?.username ?? "Someone"} challenged you
                    </p>
                    <p className="text-xs opacity-70" style={{ color: colors.text }}>
                      {c.gameSlug.replace(/-/g, " ")}{c.challengerScore ? ` · Beat their ${c.challengerScore}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/games/${c.gameSlug}/play?mode=daily`}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 transition-opacity"
                    style={{ color: colors.text }}
                  >
                    Play now →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Friends List ── */}
      <section>
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">
          Friends {friends.length > 0 && `(${friends.length})`}
        </h2>
        {friends.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-bold">No friends yet</p>
            <p className="text-sm text-cream-muted mt-1">Search for players above to add them.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.friendshipId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border hover:border-gold/30 transition-colors">
                <Link href={`/profile/${f.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={f.profile.displayName ?? f.profile.username} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{f.profile.displayName ?? f.profile.username}</p>
                    <div className="flex items-center gap-2 text-xs text-cream-muted mt-0.5">
                      <span>@{f.profile.username}</span>
                      {f.profile.streakCurrent > 0 && (
                        <span>🔥 {f.profile.streakCurrent}</span>
                      )}
                      {f.todayRuns.length > 0 && (
                        <span className="text-correct font-medium">✓ {f.todayRuns.length} played</span>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(f.friendshipId); }}
                  disabled={isPending}
                  className="text-xs text-cream-muted hover:text-incorrect transition-colors disabled:opacity-50"
                  aria-label={`Remove ${f.profile.displayName ?? f.profile.username} from friends`}
                  title="Remove friend"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gold-dim flex items-center justify-center text-sm font-bold text-gold shrink-0">
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
