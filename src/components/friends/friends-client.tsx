"use client";

import { useState, useCallback, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import {
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  removeFriend,
  type FriendEntry,
  type FriendTodayRun,
  type PendingRequest,
} from "@/app/actions/friends";
import type { FriendChallenge } from "@/app/actions/challenges";
import type { TodayRun } from "@/app/actions/game-runs";
import type { Profile } from "@/types/server";
import { GAME_COLORS } from "@/lib/game-colors";

interface FriendsClientProps {
  initialFriends: FriendEntry[];
  initialPendingRequests: PendingRequest[];
  initialPendingChallenges: FriendChallenge[];
  currentUserId: string;
  currentUsername: string;
  myTodayRuns: TodayRun[];
}

export function FriendsClient({
  initialFriends,
  initialPendingRequests,
  initialPendingChallenges,
  currentUserId,
  currentUsername,
  myTodayRuns,
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

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/friends/add/${currentUsername}`;
  }, [currentUsername]);

  // Build slug -> myRun map for head-to-head comparisons
  const myRunsBySlug = useMemo(() => {
    const map = new Map<string, TodayRun>();
    for (const run of myTodayRuns) {
      map.set(run.gameSlug, run);
    }
    return map;
  }, [myTodayRuns]);

  // Split friends: active (played today) vs inactive
  const { activeFriends, inactiveFriends } = useMemo(() => {
    const active: FriendEntry[] = [];
    const inactive: FriendEntry[] = [];
    for (const f of friends) {
      if (f.todayRuns.length > 0) active.push(f);
      else inactive.push(f);
    }
    return { activeFriends: active, inactiveFriends: inactive };
  }, [friends]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(q);
      setSearchResults(results);
      setSearching(false);
    }, 300);
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

      {/* ── Activity Feed ── */}
      <section>
        <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">
          Today&apos;s activity
          {friends.length > 0 && (
            <span className="text-gold ml-1">
              ({activeFriends.length}/{friends.length} played)
            </span>
          )}
        </h2>
        {friends.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-bold">No friends yet</p>
            <p className="text-sm text-cream-muted mt-1">Search for players below to add them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active friends with full activity cards */}
            {activeFriends.map((f) => (
              <FriendActivityCard
                key={f.friendshipId}
                friend={f}
                myRunsBySlug={myRunsBySlug}
                isPending={isPending}
                onRemove={handleRemove}
              />
            ))}

            {/* Inactive friends — compact rows */}
            {inactiveFriends.length > 0 && (
              <div className="space-y-1 pt-1">
                {activeFriends.length > 0 && (
                  <p className="text-xs text-cream-muted uppercase tracking-wide font-semibold px-1 pt-1 pb-0.5">
                    Not played today
                  </p>
                )}
                {inactiveFriends.map((f) => (
                  <div key={f.friendshipId} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-elevated border border-border hover:border-gold/30 transition-colors opacity-60">
                    <Link href={`/profile/${f.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={f.profile.displayName ?? f.profile.username} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{f.profile.displayName ?? f.profile.username}</p>
                        <div className="flex items-center gap-2 text-xs text-cream-muted">
                          <span>@{f.profile.username}</span>
                          {f.profile.streakCurrent > 0 && <span>🔥 {f.profile.streakCurrent}</span>}
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
          </div>
        )}
      </section>

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

    </div>
  );
}

// ─── Friend Activity Card ──────────────────────────────────────────────────

interface FriendActivityCardProps {
  friend: FriendEntry;
  myRunsBySlug: Map<string, TodayRun>;
  isPending: boolean;
  onRemove: (friendshipId: number) => void;
}

function FriendActivityCard({ friend, myRunsBySlug, isPending, onRemove }: FriendActivityCardProps) {
  const { profile, todayRuns, friendshipId } = friend;
  const displayName = profile.displayName ?? profile.username;

  return (
    <div className="rounded-xl bg-surface-elevated border border-border hover:border-gold/30 transition-colors">
      {/* Header row */}
      <div className="flex items-center gap-3 px-3 pt-3 pb-2">
        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={displayName} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-cream-muted">
              <span>@{profile.username}</span>
              {profile.streakCurrent > 0 && <span>🔥 {profile.streakCurrent}</span>}
              <span className="text-correct font-medium">{todayRuns.length} played today</span>
            </div>
          </div>
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(friendshipId); }}
          disabled={isPending}
          className="text-xs text-cream-muted hover:text-incorrect transition-colors disabled:opacity-50 shrink-0"
          aria-label={`Remove ${displayName} from friends`}
          title="Remove friend"
        >
          ✕
        </button>
      </div>

      {/* Game pills */}
      <div className="flex flex-wrap gap-2 px-3 pb-3">
        {todayRuns.map((run) => (
          <GamePill key={run.gameSlug} run={run} myRunsBySlug={myRunsBySlug} />
        ))}
      </div>
    </div>
  );
}

// ─── Game Pill ─────────────────────────────────────────────────────────────

interface GamePillProps {
  run: FriendTodayRun;
  myRunsBySlug: Map<string, TodayRun>;
}

function GamePill({ run, myRunsBySlug }: GamePillProps) {
  const colors = GAME_COLORS[run.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
  const gameName = run.gameSlug.split("-")[0] ?? run.gameSlug;
  const label = gameName.charAt(0).toUpperCase() + gameName.slice(1);

  const myRun = myRunsBySlug.get(run.gameSlug);
  const isH2H = !!myRun;
  const iWon = isH2H && myRun.scoreSortValue > run.scoreSortValue;
  const theyWon = isH2H && run.scoreSortValue > myRun.scoreSortValue;
  const isDraw = isH2H && myRun.scoreSortValue === run.scoreSortValue;

  let h2hBorderColor = "transparent";
  let h2hLabel: string | null = null;
  let h2hBg = "transparent";
  if (iWon) {
    h2hBorderColor = "#16a34a";
    h2hLabel = "W";
    h2hBg = "#16a34a";
  } else if (theyWon) {
    h2hBorderColor = "#dc2626";
    h2hLabel = "L";
    h2hBg = "#dc2626";
  } else if (isDraw) {
    h2hBorderColor = "#b8860b";
    h2hLabel = "D";
    h2hBg = "#b8860b";
  }

  return (
    <Link
      href={`/games/${run.gameSlug}?tab=friends`}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        border: isH2H ? `2px solid ${h2hBorderColor}` : "2px solid transparent",
      }}
      title={`${run.gameSlug}: ${run.scoreDisplay}${isH2H ? ` · You: ${myRun!.scoreDisplay}` : ""}`}
    >
      <span>{label}</span>
      <span className="opacity-70">{run.scoreDisplay}</span>
      {isH2H && h2hLabel && (
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white font-bold text-[10px] leading-none"
          style={{ backgroundColor: h2hBg }}
        >
          {h2hLabel}
        </span>
      )}
    </Link>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gold-dim flex items-center justify-center text-sm font-bold text-gold shrink-0">
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
