# Auth + Social Layer Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix auth flicker, enforce daily-once for all users, build friends activity feed, fix challenges, add friends leaderboard tab, enhance profiles with username editing and head-to-head.

**Architecture:** Social layer overhaul keeping game engines untouched. Auth provider rewritten for single-load. localStorage as instant cache for daily lockout (guests) and optimistic UI (all users). Friends data layer expanded from single-game to all-games. Challenge system gains expiration + winner tracking. Leaderboard gets friends tab. Profile gets username editing + today's dailies + head-to-head.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript strict, Supabase (auth + DB), Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-04-08-auth-social-overhaul-design.md`

---

## File Map

### Modified Files
| File | Changes |
|------|---------|
| `src/components/auth/auth-provider.tsx` | Rewrite: single init, loading covers profile, callback waits for completion |
| `src/components/auth/auth-modal.tsx` | Double-click protection, loading state during callback |
| `src/lib/storage.ts` | Add daily lockout read/write functions |
| `src/components/game/played-today-banner.tsx` | localStorage-first optimistic check |
| `src/app/actions/game-runs.ts` | Add `getUserTodayRuns()` for activity feed |
| `src/app/actions/friends.ts` | Rewrite `getFriends()` for all games + add `getFriendsActivity()` |
| `src/app/actions/challenges.ts` | Add expiration filter, winner calc, result card data |
| `src/app/actions/profile.ts` | Add `updateUsername()` with uniqueness check |
| `src/app/friends/page.tsx` | Update data fetching for activity feed |
| `src/components/friends/friends-client.tsx` | Rewrite: activity feed cards with auto head-to-head |
| `src/components/friends/challenge-friend-picker.tsx` | Add debounce, show all game scores |
| `src/app/games/[slug]/leaderboard/page.tsx` | Add Global/Friends tab |
| `src/app/profile/page.tsx` | Add username editing, today's dailies section |
| `src/app/profile/[username]/page.tsx` | Add today's dailies, head-to-head section |
| `src/components/profile/profile-edit-form.tsx` | Add username field with validation |
| `src/components/layout/header.tsx` | Fix pending request timing |
| `src/hooks/use-daily-challenge.ts` | Enhance: also set localStorage lockout key |
| All 11 daily game board components | Add `saveDailyResult` call on game completion |
| All 11 daily game play pages | Add localStorage guard for unauth users |

### New Files
| File | Purpose |
|------|---------|
| `src/components/game/daily-lockout-guard.tsx` | Client component: checks localStorage before rendering board for unauth users |

---

## Task 1: Auth Provider Rewrite

**Files:**
- Modify: `src/components/auth/auth-provider.tsx`

- [ ] **Step 1: Rewrite the AuthProvider init sequence**

Replace the current init (lines 72-107) that sets `loading=false` before profile loads. New behavior: `loading` stays `true` until both user and profile are resolved.

```tsx
// src/components/auth/auth-provider.tsx — full rewrite
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/server";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  authModalOpen: boolean;
  openAuthModal: (onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  authModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    countryCode: data.country_code,
    streakCurrent: data.streak_current ?? 0,
    streakLongest: data.streak_longest ?? 0,
    lastDailyDate: data.last_daily_date,
    createdAt: data.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const callbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Single init: get user, then profile, then set loading=false
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        const p = await fetchProfile(u.id);
        setProfile(p);
      }
      setLoading(false);
    });

    // Listen for auth changes (OAuth callback, magic link, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        const p = await fetchProfile(u.id);
        setProfile(p);

        // Fire pending callback after profile is loaded
        if (callbackRef.current) {
          try {
            await callbackRef.current();
          } catch {
            // Callback failed — don't block modal close
          }
          callbackRef.current = null;
        }
        setAuthModalOpen(false);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const openAuthModal = useCallback((onSuccess?: () => void) => {
    callbackRef.current = onSuccess ?? null;
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    callbackRef.current = null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext value={{
      user,
      profile,
      loading,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      signOut,
    }}>
      {children}
    </AuthContext>
  );
}
```

Key changes:
- `loading=false` only after profile fetch completes (or user is null)
- `authModalCallback` replaced with `callbackRef` (no stale closure issues)
- `onAuthStateChange` awaits profile + callback before closing modal
- Removed `authModalCallback` from context (was internal state, shouldn't be exposed)
- Uses `AuthContext` value prop (React 19) instead of `AuthContext.Provider`

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected: build succeeds. If anything imports `authModalCallback` from the context, find and remove those references.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/auth-provider.tsx
git commit -m "Rewrite auth provider: single init, loading covers profile, ref-based callback"
```

---

## Task 2: Auth Modal Double-Click Protection

**Files:**
- Modify: `src/components/auth/auth-modal.tsx`

- [ ] **Step 1: Add submitting state and disable buttons during auth**

Read the current file and add:
1. A `submitting` state that's true while OAuth redirect or magic link send is in progress
2. Disable all auth buttons when `submitting` is true

Find each `signInWithOAuth` and `signInWithOtp` call. Wrap each in:
```tsx
const [submitting, setSubmitting] = useState(false);

// Before each auth call:
setSubmitting(true);
// In catch/finally:
setSubmitting(false);
```

Add `disabled={submitting}` to the Google button, Apple button, and magic link submit button.

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/auth-modal.tsx
git commit -m "Auth modal: double-click protection on all auth buttons"
```

---

## Task 3: Daily Lockout System (localStorage)

**Files:**
- Modify: `src/lib/storage.ts`
- Create: `src/components/game/daily-lockout-guard.tsx`
- Modify: `src/components/game/played-today-banner.tsx`

- [ ] **Step 1: Add lockout storage helpers**

Append to `src/lib/storage.ts`:

```ts
// ─── Daily Lockout (for guest users) ─────────────────────────────────

export interface DailyLockoutEntry {
  score: string;
  scoreDisplay: string;
  timestamp: number;
}

export function getDailyLockout(gameSlug: string, dateKey: string): DailyLockoutEntry | null {
  return getStorageItem<DailyLockoutEntry | null>(`lockout_${gameSlug}_${dateKey}`, null);
}

export function setDailyLockout(gameSlug: string, dateKey: string, entry: DailyLockoutEntry): void {
  setStorageItem(`lockout_${gameSlug}_${dateKey}`, entry);
}
```

- [ ] **Step 2: Create DailyLockoutGuard component**

This client component wraps the game board. For unauthenticated users, it checks localStorage before rendering. If locked out, it shows a simplified already-played screen.

```tsx
// src/components/game/daily-lockout-guard.tsx
"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { getDailyLockout } from "@/lib/storage";
import { getTodayDateKey, msUntilReset } from "@/lib/daily-seed";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DailyLockoutGuardProps {
  gameSlug: string;
  gameEmoji: string;
  gameTitle: string;
  children: React.ReactNode;
}

function formatTimeUntilReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function DailyLockoutGuard({ gameSlug, gameEmoji, gameTitle, children }: DailyLockoutGuardProps) {
  const { user, loading } = useAuth();
  const [locked, setLocked] = useState(false);
  const [lockoutData, setLockoutData] = useState<{ score: string; scoreDisplay: string } | null>(null);

  useEffect(() => {
    // Only apply lockout for unauthenticated users
    // Authenticated users are handled server-side in the play page
    if (loading || user) return;
    const entry = getDailyLockout(gameSlug, getTodayDateKey());
    if (entry) {
      setLocked(true);
      setLockoutData({ score: entry.score, scoreDisplay: entry.scoreDisplay });
    }
  }, [loading, user, gameSlug]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>;
  }

  if (locked && lockoutData) {
    const timeLeft = formatTimeUntilReset(msUntilReset());
    return (
      <div className="flex flex-col items-center gap-6 py-12 sm:py-16 text-center max-w-md mx-auto">
        <div className="text-5xl">{gameEmoji}</div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Already played today</h2>
          <p className="text-sm text-cream-muted mt-1.5">
            You completed today&apos;s {gameTitle} daily challenge.
          </p>
        </div>
        <div className="px-5 py-3 rounded-xl bg-surface-elevated text-center">
          <div className="text-[10px] text-cream-muted font-medium uppercase tracking-wide">Score</div>
          <div className="text-2xl font-extrabold font-mono text-gold">{lockoutData.scoreDisplay}</div>
        </div>
        <p className="text-sm text-cream-muted">
          Next daily challenge in <span className="font-bold text-cream">{timeLeft}</span>
        </p>
        <p className="text-xs text-cream-muted">Sign in to save your score and see your rank.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link href={`/games/${gameSlug}/play?mode=practice`} className="cta-primary flex-1">Practice unlimited</Link>
          <Link href={`/games/${gameSlug}/leaderboard`} className="cta-secondary flex-1">View leaderboard</Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 3: Make PlayedTodayBanner optimistic with localStorage**

Rewrite `src/components/game/played-today-banner.tsx` to check localStorage first for instant feedback, then confirm with server:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { checkDailyStatus } from "@/app/actions/game-runs";
import { getTodayDateKey } from "@/lib/daily-seed";
import { getDailyLockout } from "@/lib/storage";
import type { ServerGameRun } from "@/types/server";

interface PlayedTodayBannerProps {
  gameSlug: string;
  playHref: string;
}

export function PlayedTodayBanner({ gameSlug, playHref }: PlayedTodayBannerProps) {
  const { user, loading } = useAuth();
  const [run, setRun] = useState<ServerGameRun | null>(null);
  const [localScore, setLocalScore] = useState<string | null>(null);

  // Instant localStorage check (works for guests and auth users)
  useEffect(() => {
    const entry = getDailyLockout(gameSlug, getTodayDateKey());
    if (entry) setLocalScore(entry.scoreDisplay);
  }, [gameSlug]);

  // Server confirmation for authenticated users
  useEffect(() => {
    if (loading || !user) return;
    checkDailyStatus(gameSlug, getTodayDateKey()).then((result) => {
      if (result.played && result.run) setRun(result.run);
    });
  }, [user, loading, gameSlug]);

  // Show nothing if neither local nor server says played
  if (!run && !localScore) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-gold-dim border border-gold/20 mb-4 animate-in">
      <span className="text-sm font-bold text-gold">Played today</span>
      <span className="text-sm text-cream">
        {run?.scoreDisplay ?? localScore}
      </span>
      {run?.rankDaily != null && (
        <span className="text-sm text-cream-muted">
          Rank <span className="font-bold text-cream">#{run.rankDaily}</span>
        </span>
      )}
      {run?.percentile != null && (
        <span className="text-sm text-cream-muted">
          Better than <span className="font-bold text-cream">{Math.round(run.percentile)}%</span>
        </span>
      )}
      <Link
        href={`${playHref}?mode=practice`}
        className="ml-auto text-xs font-bold text-gold hover:underline"
      >
        Practice →
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/components/game/daily-lockout-guard.tsx src/components/game/played-today-banner.tsx
git commit -m "Daily lockout system: localStorage guard for guests, optimistic banner"
```

---

## Task 4: Wire Lockout into Game Boards and Play Pages

**Files:**
- Modify: All 11 daily game board components (add `setDailyLockout` call on completion)
- Modify: All 11 daily game play pages (wrap board in `DailyLockoutGuard` for unauth users)

- [ ] **Step 1: Update all game boards to save lockout on daily completion**

In every board component that has a daily mode, after the game ends and the result is computed, add a `setDailyLockout` call alongside the existing `saveDailyResult` call. This applies to these 11 boards:

```
src/components/games/flag-quiz/flag-quiz-board.tsx
src/components/games/country-draft/draft-board.tsx
src/components/games/country-streak/streak-board.tsx
src/components/games/higher-or-lower/hol-board.tsx
src/components/games/capital-match/capital-board.tsx
src/components/games/odd-one-out/odd-board.tsx
src/components/games/population-sort/sort-board.tsx
src/components/games/stat-guesser/guesser-board.tsx
src/components/games/border-buddies/border-board.tsx
src/components/games/continent-sprint/sprint-board.tsx
src/components/games/speed-flags/speed-board.tsx
```

For each board, find the block where the game ends (typically `if (state.phase === "results" && !submitted)` or equivalent), and add after `setSubmitted(true)`:

```tsx
import { setDailyLockout } from "@/lib/storage";
import { getTodayDateKey } from "@/lib/daily-seed";

// In the game-over effect, after setSubmitted(true):
if (mode === "daily") {
  setDailyLockout(GAME_SLUG, getTodayDateKey(), {
    score: String(scoreRaw),
    scoreDisplay: scoreDisplayString,
    timestamp: Date.now(),
  });
}
```

The exact `GAME_SLUG`, `scoreRaw`, and `scoreDisplayString` vary per board — use the values already computed in each board's submission payload.

- [ ] **Step 2: Wrap daily boards in DailyLockoutGuard on play pages**

For each of the 11 daily game play pages, import `DailyLockoutGuard` and wrap the board component when `gameMode === "daily"`. The server-side `checkDailyStatus` already handles auth users; the guard handles guests.

Pattern for each play page (example: `src/app/games/flag-quiz/play/page.tsx`):

```tsx
import { DailyLockoutGuard } from "@/components/game/daily-lockout-guard";

// In the return, wrap the board:
return (
  <GameShell title="Flag Quiz" backHref="/games/flag-quiz" mode={gameMode}>
    {gameMode === "daily" ? (
      <DailyLockoutGuard gameSlug="flag-quiz" gameEmoji="🏁" gameTitle="Flag Quiz">
        <FlagQuizBoard mode={gameMode} />
      </DailyLockoutGuard>
    ) : (
      <FlagQuizBoard mode={gameMode} />
    )}
  </GameShell>
);
```

Apply this pattern to all 11 daily play pages. The `gameEmoji` and `gameTitle` should match what's already used in each page's `DailyAlreadyPlayed` component.

Games and their emojis (from game-registry.json):
- flag-quiz: 🏁 Flag Quiz
- country-draft: 🎯 Country Draft
- higher-or-lower: ⬆️ Higher or Lower
- country-streak: ⚡ Country Streak
- capital-match: 📍 Capital Match
- odd-one-out: 🔍 Odd One Out
- population-sort: 📊 Population Sort
- stat-guesser: #️⃣ Stat Guesser
- border-buddies: 🔗 Border Buddies
- continent-sprint: 🌍 Continent Sprint
- speed-flags: ⏱️ Speed Flags

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/games/ src/app/games/
git commit -m "Wire daily lockout: boards save to localStorage, play pages guard guests"
```

---

## Task 5: Friends Data Layer — All Games Activity

**Files:**
- Modify: `src/app/actions/friends.ts`
- Modify: `src/app/actions/game-runs.ts`

- [ ] **Step 1: Add `getUserTodayRuns` to game-runs.ts**

Append to `src/app/actions/game-runs.ts`:

```ts
// ─── Get User's Today Daily Runs ──────────────────────────────────

export interface TodayRun {
  gameSlug: string;
  scoreRaw: number;
  scoreMax: number;
  scoreDisplay: string;
  scoreSortValue: number;
  rankDaily: number | null;
  percentile: number | null;
}

export async function getUserTodayRuns(userId: string): Promise<TodayRun[]> {
  const supabase = await createClient();
  const dateKey = getTodayDateKey();

  const { data } = await supabase
    .from("game_runs")
    .select("game_slug, score_raw, score_max, score_display, score_sort_value, rank_daily, percentile")
    .eq("user_id", userId)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .order("game_slug");

  return (data ?? []).map((r) => ({
    gameSlug: r.game_slug as string,
    scoreRaw: r.score_raw as number,
    scoreMax: r.score_max as number,
    scoreDisplay: r.score_display as string,
    scoreSortValue: Number(r.score_sort_value ?? 0),
    rankDaily: r.rank_daily as number | null,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  }));
}
```

- [ ] **Step 2: Rewrite `getFriends()` and add `getFriendsActivity()`**

Replace `getFriends()` in `src/app/actions/friends.ts` and add a new `getFriendsActivity()` that fetches all daily runs for today per friend.

Update the `FriendEntry` interface and `getFriends()`:

```ts
import { getTodayDateKey } from "@/lib/daily-seed";
import type { Profile, LeaderboardEntry } from "@/types/server";

export interface FriendTodayRun {
  gameSlug: string;
  scoreDisplay: string;
  scoreSortValue: number;
  rankDaily: number | null;
}

export interface FriendEntry {
  friendshipId: number;
  profile: Profile;
  todayRuns: FriendTodayRun[];
}
```

Rewrite `getFriends()`:

```ts
export async function getFriends(): Promise<FriendEntry[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: friendships } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  if (!friendships?.length) return [];

  const friendIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id
  );

  const todayKey = getTodayDateKey();
  const [{ data: profiles }, { data: todayRuns }] = await Promise.all([
    supabase.from("profiles").select("*").in("id", friendIds),
    supabase
      .from("game_runs")
      .select("user_id, game_slug, score_display, score_sort_value, rank_daily")
      .in("user_id", friendIds)
      .eq("daily_date", todayKey)
      .eq("mode", "daily"),
  ]);

  const runsByUserId = new Map<string, FriendTodayRun[]>();
  for (const r of todayRuns ?? []) {
    const userId = r.user_id as string;
    if (!runsByUserId.has(userId)) runsByUserId.set(userId, []);
    runsByUserId.get(userId)!.push({
      gameSlug: r.game_slug as string,
      scoreDisplay: r.score_display as string,
      scoreSortValue: Number(r.score_sort_value ?? 0),
      rankDaily: r.rank_daily as number | null,
    });
  }

  return (profiles ?? [])
    .map((p) => {
      const friendship = friendships.find(
        (f) => f.requester_id === p.id || f.addressee_id === p.id
      )!;
      return {
        friendshipId: friendship.id,
        profile: mapProfile(p),
        todayRuns: runsByUserId.get(p.id) ?? [],
      };
    })
    .sort((a, b) => {
      // Most active first, then by streak
      if (b.todayRuns.length !== a.todayRuns.length) return b.todayRuns.length - a.todayRuns.length;
      return b.profile.streakCurrent - a.profile.streakCurrent;
    });
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expect build errors in `friends-client.tsx` because `FriendEntry.todayScore` is now `FriendEntry.todayRuns`. This is expected — we fix the UI in the next task.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/game-runs.ts src/app/actions/friends.ts
git commit -m "Friends data layer: fetch all daily runs per friend, add getUserTodayRuns"
```

---

## Task 6: Friends Activity Feed UI

**Files:**
- Modify: `src/components/friends/friends-client.tsx`
- Modify: `src/app/friends/page.tsx`

- [ ] **Step 1: Rewrite friends-client.tsx with activity feed**

Complete rewrite of `src/components/friends/friends-client.tsx`. The new version shows:
- Pending requests at top
- Pending challenges
- Activity feed (per friend: avatar, name, streak, game icons with scores, auto head-to-head)
- Friend search + invite link at bottom

```tsx
"use client";

import { useState, useCallback, useTransition, useMemo, useRef } from "react";
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
import type { TodayRun } from "@/app/actions/game-runs";
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const myRunsBySlug = useMemo(() => {
    const map = new Map<string, TodayRun>();
    for (const r of myTodayRuns) map.set(r.gameSlug, r);
    return map;
  }, [myTodayRuns]);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/friends/add/${currentUsername}`;
  }, [currentUsername]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
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

  const handleRespond = useCallback((friendshipId: number, accept: boolean) => {
    startTransition(async () => {
      await respondToFriendRequest(friendshipId, accept);
      setPendingRequests((prev) => prev.filter((r) => r.friendshipId !== friendshipId));
    });
  }, []);

  const handleRemove = useCallback((friendshipId: number) => {
    startTransition(async () => {
      await removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    });
  }, []);

  const activeFriends = friends.filter((f) => f.todayRuns.length > 0);
  const inactiveFriends = friends.filter((f) => f.todayRuns.length === 0);

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
                <button onClick={() => handleRespond(req.friendshipId, true)} disabled={isPending} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-white disabled:opacity-50">Accept</button>
                <button onClick={() => handleRespond(req.friendshipId, false)} disabled={isPending} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-cream-muted disabled:opacity-50">Decline</button>
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
                  <Link href={`/games/${c.gameSlug}/play?mode=daily`} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/80 transition-opacity" style={{ color: colors.text }}>
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
          Today&apos;s activity {friends.length > 0 && `(${friends.length} friends)`}
        </h2>
        {friends.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-bold">No friends yet</p>
            <p className="text-sm text-cream-muted mt-1">Search for players below to add them.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeFriends.map((f) => (
              <FriendActivityCard key={f.friendshipId} friend={f} myRunsBySlug={myRunsBySlug} onRemove={handleRemove} isPending={isPending} />
            ))}
            {inactiveFriends.length > 0 && activeFriends.length > 0 && (
              <p className="text-xs text-cream-muted pt-2">No games today</p>
            )}
            {inactiveFriends.map((f) => (
              <div key={f.friendshipId} className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border opacity-60">
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
                <button onClick={() => handleRemove(f.friendshipId)} disabled={isPending} className="text-xs text-cream-muted hover:text-incorrect transition-colors" title="Remove friend">✕</button>
              </div>
            ))}
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
                <button onClick={() => handleSendRequest(p.id)} disabled={sentTo.has(p.id)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gold text-white disabled:opacity-50 transition-opacity">
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
            onClick={() => { navigator.clipboard.writeText(inviteUrl); setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000); }}
            className="shrink-0 px-3 py-2 text-sm font-bold text-gold border border-gold/30 rounded-lg hover:bg-gold-dim transition-colors"
          >
            {inviteCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>
    </div>
  );
}

/* ─── Friend Activity Card ─── */

function FriendActivityCard({
  friend, myRunsBySlug, onRemove, isPending,
}: {
  friend: FriendEntry;
  myRunsBySlug: Map<string, TodayRun>;
  onRemove: (id: number) => void;
  isPending: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-surface-elevated border border-border hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${friend.profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar name={friend.profile.displayName ?? friend.profile.username} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{friend.profile.displayName ?? friend.profile.username}</p>
            <div className="flex items-center gap-2 text-xs text-cream-muted">
              <span>@{friend.profile.username}</span>
              {friend.profile.streakCurrent > 0 && <span>🔥 {friend.profile.streakCurrent}</span>}
            </div>
          </div>
        </Link>
        <button onClick={() => onRemove(friend.friendshipId)} disabled={isPending} className="text-xs text-cream-muted hover:text-incorrect transition-colors" title="Remove friend">✕</button>
      </div>

      {/* Game scores row */}
      <div className="flex flex-wrap gap-2 mt-3 pl-12">
        {friend.todayRuns.map((run) => {
          const colors = GAME_COLORS[run.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
          const myRun = myRunsBySlug.get(run.gameSlug);
          const isH2H = !!myRun;
          const iWon = isH2H && myRun.scoreSortValue > run.scoreSortValue;
          const theyWon = isH2H && run.scoreSortValue > myRun.scoreSortValue;

          return (
            <Link
              key={run.gameSlug}
              href={`/games/${run.gameSlug}/leaderboard`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors"
              style={{ backgroundColor: colors.bg, color: colors.text, borderColor: isH2H ? (iWon ? "var(--color-correct)" : theyWon ? "var(--color-incorrect)" : "var(--color-gold)") : "transparent" }}
              title={isH2H ? `You: ${myRun.scoreDisplay} vs ${run.scoreDisplay}` : run.gameSlug.replace(/-/g, " ")}
            >
              <span className="capitalize">{run.gameSlug.replace(/-/g, " ").split(" ")[0]}</span>
              <span className="opacity-70">{run.scoreDisplay}</span>
              {isH2H && (
                <span className={`ml-0.5 ${iWon ? "text-correct" : theyWon ? "text-incorrect" : "text-gold"}`}>
                  {iWon ? "W" : theyWon ? "L" : "D"}
                </span>
              )}
            </Link>
          );
        })}
      </div>
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
```

- [ ] **Step 2: Update friends page to pass myTodayRuns**

```tsx
// src/app/friends/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFriends, getPendingRequests } from "@/app/actions/friends";
import { getPendingChallenges } from "@/app/actions/challenges";
import { getUserTodayRuns } from "@/app/actions/game-runs";
import { FriendsClient } from "@/components/friends/friends-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends | Countrivo",
  description: "Challenge friends, track their scores, and climb the leaderboard together.",
};

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const [friends, pendingRequests, pendingChallenges, profileData, myTodayRuns] = await Promise.all([
    getFriends(),
    getPendingRequests(),
    getPendingChallenges(),
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    getUserTodayRuns(user.id),
  ]);

  const username = profileData.data?.username ?? "";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold mb-6">Friends</h1>
      <FriendsClient
        initialFriends={friends}
        initialPendingRequests={pendingRequests}
        initialPendingChallenges={pendingChallenges}
        currentUserId={user.id}
        currentUsername={username}
        myTodayRuns={myTodayRuns}
      />
    </div>
  );
}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/friends/friends-client.tsx src/app/friends/page.tsx
git commit -m "Friends activity feed: all daily scores per friend, auto head-to-head indicators"
```

---

## Task 7: Challenge System Fix — Expiration + Winners

**Files:**
- Modify: `src/app/actions/challenges.ts`

- [ ] **Step 1: Filter expired challenges and add winner calculation**

Update `getPendingChallenges()` to filter out challenges where `daily_date < today`:

In `getPendingChallenges()`, add a filter after the query:

```ts
import { getTodayDateKey } from "@/lib/daily-seed";
```

In the query, add `.gte("daily_date", getTodayDateKey())` to only return challenges for today (challenges from previous days are expired).

Add a `getChallengeResults()` function for completed challenges with winner:

```ts
export interface ChallengeResult {
  id: number;
  gameSlug: string;
  dailyDate: string;
  challengerProfile: { username: string; displayName: string | null };
  challengedProfile: { username: string; displayName: string | null };
  challengerScore: string | null;
  challengedScore: string | null;
  challengerSortValue: number;
  challengedSortValue: number;
  winnerId: string | null; // null = draw
}

export async function getRecentChallengeResults(limit: number = 10): Promise<ChallengeResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("friend_challenges")
    .select(`
      *,
      challenger:profiles!friend_challenges_challenger_id_fkey(username, display_name),
      challenged:profiles!friend_challenges_challenged_id_fkey(username, display_name),
      challenger_run:game_runs!friend_challenges_challenger_run_id_fkey(score_display, score_sort_value),
      challenged_run:game_runs!friend_challenges_challenged_run_id_fkey(score_display, score_sort_value)
    `)
    .eq("status", "completed")
    .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const cSort = Number(row.challenger_run?.score_sort_value ?? 0);
    const dSort = Number(row.challenged_run?.score_sort_value ?? 0);
    let winnerId: string | null = null;
    if (cSort > dSort) winnerId = row.challenger_id;
    else if (dSort > cSort) winnerId = row.challenged_id;

    return {
      id: row.id,
      gameSlug: row.game_slug,
      dailyDate: row.daily_date,
      challengerProfile: row.challenger ? { username: row.challenger.username, displayName: row.challenger.display_name } : { username: "?", displayName: null },
      challengedProfile: row.challenged ? { username: row.challenged.username, displayName: row.challenged.display_name } : { username: "?", displayName: null },
      challengerScore: row.challenger_run?.score_display ?? null,
      challengedScore: row.challenged_run?.score_display ?? null,
      challengerSortValue: cSort,
      challengedSortValue: dSort,
      winnerId,
    };
  });
}
```

Also add `completeChallenge` validation — verify the game_slug and daily_date match:

In `completeChallenge()`, before the update, add:

```ts
// Verify challenge is for the right game/date
const { data: challenge } = await supabase
  .from("friend_challenges")
  .select("game_slug, daily_date")
  .eq("id", challengeId)
  .eq("challenged_id", user.id)
  .single();

if (!challenge) return { success: false, error: "challenge_not_found" };
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/challenges.ts
git commit -m "Challenge system: expiration filter, winner calculation, result cards"
```

---

## Task 8: Leaderboard Friends Tab

**Files:**
- Modify: `src/app/games/[slug]/leaderboard/page.tsx`

- [ ] **Step 1: Add friends tab to leaderboard page**

The `getFriendsLeaderboard()` function already exists in `src/app/actions/friends.ts`. Wire it into the leaderboard page with a tab switch.

Since this is a server component, use searchParams for the tab. Add `?tab=friends` support:

Update the Props interface:

```ts
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string; tab?: string }>;
}
```

In the function body, extract `tab`:

```ts
const { date, tab } = await searchParams;
const activeTab = tab === "friends" ? "friends" : "global";
```

Fetch friends leaderboard in parallel when tab is friends:

```ts
import { getFriendsLeaderboard } from "@/app/actions/friends";

// In the Promise.all:
const [leaderboard, friendsLeaderboard, summary] = await Promise.all([
  getDailyLeaderboard(slug, dateKey, 50),
  activeTab === "friends" ? getFriendsLeaderboard(slug, dateKey) : Promise.resolve([]),
  getDailySummary(slug, dateKey),
]);

const displayLeaderboard = activeTab === "friends" ? friendsLeaderboard : leaderboard;
```

Add tab buttons above the leaderboard table, after the date navigation:

```tsx
{/* Tab switch */}
<div className="flex items-center gap-1 mb-4 p-1 rounded-xl bg-surface-elevated border border-border w-fit">
  <Link
    href={`/games/${slug}/leaderboard${date ? `?date=${date}` : ""}`}
    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
      activeTab === "global" ? "bg-gold text-white" : "text-cream-muted hover:text-cream"
    }`}
  >
    Global
  </Link>
  <Link
    href={`/games/${slug}/leaderboard?${date ? `date=${date}&` : ""}tab=friends`}
    className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
      activeTab === "friends" ? "bg-gold text-white" : "text-cream-muted hover:text-cream"
    }`}
  >
    Friends
  </Link>
</div>
```

Update the empty state for friends tab:

```tsx
{displayLeaderboard.length === 0 ? (
  <div className="text-center py-16">
    <div className="text-4xl mb-3">{activeTab === "friends" ? "👥" : game.emoji}</div>
    <p className="text-lg font-bold">
      {activeTab === "friends" ? "No friends have played yet" : "No one has played yet"}
    </p>
    <p className="text-sm text-cream-muted mt-1">
      {activeTab === "friends"
        ? "Challenge a friend to get started!"
        : isToday ? "Be the first to set a score today." : "No players on this date."}
    </p>
    {activeTab === "friends" ? (
      <Link href="/friends" className="cta-primary mt-4 text-sm">Find friends</Link>
    ) : isToday ? (
      <Link href={`/games/${slug}/play?mode=daily`} className="cta-primary mt-4 text-sm">Play now</Link>
    ) : null}
  </div>
) : (
  // ... existing leaderboard table using displayLeaderboard instead of leaderboard
)}
```

Replace all references to `leaderboard` in the table rendering with `displayLeaderboard`.

Also add profile links — wrap the name in each leaderboard entry with a Link:

In the leaderboard entry rendering, wrap the name:

```tsx
<Link href={`/profile/${entry.username}`} className="flex-1 min-w-0">
  <p className={`text-sm font-medium truncate ${isMe ? "text-gold font-bold" : ""}`}>
    {entry.displayName ?? entry.username}
    {isMe && <span className="text-[10px] text-gold ml-1.5">(you)</span>}
  </p>
</Link>
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/games/[slug]/leaderboard/page.tsx
git commit -m "Leaderboard: add Global/Friends tab, wire getFriendsLeaderboard, profile links"
```

---

## Task 9: Profile Enhancement — Username Editing

**Files:**
- Modify: `src/app/actions/profile.ts`
- Modify: `src/components/profile/profile-edit-form.tsx`
- Modify: `src/app/profile/page.tsx`

- [ ] **Step 1: Add updateUsername server action**

Append to `src/app/actions/profile.ts`:

```ts
// ─── Update Username ────────────────────────────────────────────────

interface UpdateUsernameResult {
  success: boolean;
  error?: string;
}

export async function updateUsername(newUsername: string): Promise<UpdateUsernameResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_authenticated" };

  // Validate format
  const cleaned = newUsername.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/.test(cleaned)) {
    return { success: false, error: "Username must be 3-20 characters, lowercase alphanumeric and hyphens, cannot start or end with hyphen" };
  }

  // Check uniqueness
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", cleaned)
    .neq("id", user.id)
    .single();

  if (existing) {
    return { success: false, error: "Username already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: cleaned, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

- [ ] **Step 2: Add username field to ProfileEditForm**

Update `src/components/profile/profile-edit-form.tsx` to include a username field:

Add to the props interface:

```ts
interface ProfileEditFormProps {
  initialUsername: string;
  initialDisplayName: string;
  initialCountryCode: string;
}
```

Add username state and handler:

```tsx
const [username, setUsername] = useState(initialUsername);
```

Add a separate username update handler (username changes are separate from display name):

```tsx
import { updateProfile, updateUsername } from "@/app/actions/profile";

const [usernameFeedback, setUsernameFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

const handleUsernameSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  startTransition(async () => {
    const res = await updateUsername(username);
    if (res.success) {
      setUsernameFeedback({ type: "success", message: "Username updated!" });
    } else {
      setUsernameFeedback({ type: "error", message: res.error ?? "Something went wrong" });
    }
    setTimeout(() => setUsernameFeedback(null), 3000);
  });
};
```

Add the username field to the form, above the display name field:

```tsx
<div>
  <label htmlFor="username" className="block text-sm font-medium mb-1">
    Username
  </label>
  <div className="flex gap-2">
    <input
      id="username"
      type="text"
      value={username}
      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
      maxLength={20}
      className="flex-1 p-3 rounded-xl border-2 border-border bg-surface text-cream placeholder:text-cream-muted focus:border-gold focus:outline-none transition-colors font-mono"
      placeholder="your-username"
    />
    <button
      type="button"
      onClick={handleUsernameSubmit}
      disabled={isPending || username === initialUsername || username.length < 3}
      className="px-4 py-3 bg-gold text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
    >
      {isPending ? "..." : "Save"}
    </button>
  </div>
  {usernameFeedback && (
    <p className={`text-sm font-medium mt-1 ${usernameFeedback.type === "success" ? "text-correct" : "text-incorrect"}`}>
      {usernameFeedback.message}
    </p>
  )}
</div>
```

- [ ] **Step 3: Pass username to the form in profile page**

In `src/app/profile/page.tsx`, update the `ProfileEditForm` usage:

```tsx
<ProfileEditForm
  initialUsername={profile.username}
  initialDisplayName={profile.displayName ?? ""}
  initialCountryCode={profile.countryCode ?? ""}
/>
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/profile.ts src/components/profile/profile-edit-form.tsx src/app/profile/page.tsx
git commit -m "Profile: add username editing with uniqueness validation"
```

---

## Task 10: Profile Enhancement — Today's Dailies + Head-to-Head

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/profile/[username]/page.tsx`
- Modify: `src/app/actions/profile.ts`

- [ ] **Step 1: Add getTodayDailyRuns to profile.ts**

Add a function to get a user's today runs for display on profile:

```ts
import { getTodayDateKey } from "@/lib/daily-seed";

export async function getProfileTodayRuns(userId: string): Promise<{
  gameSlug: string;
  scoreDisplay: string;
  rankDaily: number | null;
  percentile: number | null;
}[]> {
  const supabase = await createClient();
  const dateKey = getTodayDateKey();
  const { data } = await supabase
    .from("game_runs")
    .select("game_slug, score_display, rank_daily, percentile")
    .eq("user_id", userId)
    .eq("daily_date", dateKey)
    .eq("mode", "daily")
    .order("game_slug");

  return (data ?? []).map((r) => ({
    gameSlug: r.game_slug as string,
    scoreDisplay: r.score_display as string,
    rankDaily: r.rank_daily as number | null,
    percentile: r.percentile != null ? Number(r.percentile) : null,
  }));
}
```

Add a function to get head-to-head between two users:

```ts
export async function getHeadToHead(userId: string, friendId: string): Promise<{
  wins: number;
  losses: number;
  draws: number;
  recent: { gameSlug: string; dailyDate: string; myScore: string; theirScore: string; mySort: number; theirSort: number }[];
}> {
  const supabase = await createClient();

  // Get last 30 days of both users' daily runs that overlap
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sinceDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const [{ data: myRuns }, { data: theirRuns }] = await Promise.all([
    supabase
      .from("game_runs")
      .select("game_slug, daily_date, score_display, score_sort_value")
      .eq("user_id", userId)
      .eq("mode", "daily")
      .gte("daily_date", sinceDate),
    supabase
      .from("game_runs")
      .select("game_slug, daily_date, score_display, score_sort_value")
      .eq("user_id", friendId)
      .eq("mode", "daily")
      .gte("daily_date", sinceDate),
  ]);

  // Build map of their runs: "gameSlug:date" -> run
  const theirRunMap = new Map<string, { scoreDisplay: string; scoreSortValue: number }>();
  for (const r of theirRuns ?? []) {
    theirRunMap.set(`${r.game_slug}:${r.daily_date}`, {
      scoreDisplay: r.score_display as string,
      scoreSortValue: Number(r.score_sort_value ?? 0),
    });
  }

  let wins = 0, losses = 0, draws = 0;
  const recent: { gameSlug: string; dailyDate: string; myScore: string; theirScore: string; mySort: number; theirSort: number }[] = [];

  for (const r of myRuns ?? []) {
    const key = `${r.game_slug}:${r.daily_date}`;
    const theirs = theirRunMap.get(key);
    if (!theirs) continue;

    const mySort = Number(r.score_sort_value ?? 0);
    if (mySort > theirs.scoreSortValue) wins++;
    else if (mySort < theirs.scoreSortValue) losses++;
    else draws++;

    recent.push({
      gameSlug: r.game_slug as string,
      dailyDate: r.daily_date as string,
      myScore: r.score_display as string,
      theirScore: theirs.scoreDisplay,
      mySort,
      theirSort: theirs.scoreSortValue,
    });
  }

  // Sort by date desc, limit to 10
  recent.sort((a, b) => b.dailyDate.localeCompare(a.dailyDate) || a.gameSlug.localeCompare(b.gameSlug));

  return { wins, losses, draws, recent: recent.slice(0, 10) };
}
```

- [ ] **Step 2: Add today's dailies section to both profile pages**

In `src/app/profile/page.tsx`, after fetching profile data, also fetch today's runs:

```ts
import { getPublicProfile, getProfileTodayRuns } from "@/app/actions/profile";

// In the function:
const [data, todayRuns] = await Promise.all([
  getPublicProfile(rawProfile.username),
  getProfileTodayRuns(user.id),
]);
```

Add a "Today" section between the Edit form and Stats section:

```tsx
{todayRuns.length > 0 && (
  <section className="mb-8">
    <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Today</h2>
    <div className="flex flex-wrap gap-2">
      {todayRuns.map((r) => {
        const colors = GAME_COLORS[r.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
        return (
          <Link
            key={r.gameSlug}
            href={`/games/${r.gameSlug}/leaderboard`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-transparent hover:border-gold/30 transition-colors"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            <span className="capitalize">{r.gameSlug.replace(/-/g, " ")}</span>
            <span className="opacity-70">{r.scoreDisplay}</span>
            {r.rankDaily != null && <span className="opacity-50">#{r.rankDaily}</span>}
          </Link>
        );
      })}
    </div>
  </section>
)}
```

- [ ] **Step 3: Add head-to-head to public profile page**

In `src/app/profile/[username]/page.tsx`, check if viewer is a friend and show head-to-head:

```ts
import { getPublicProfile, getProfileTodayRuns, getHeadToHead } from "@/app/actions/profile";

// After getting user and verifying it's not own profile:
const [data, todayRuns, h2h] = await Promise.all([
  getPublicProfile(username),
  getProfileTodayRuns(/* need profile id, get from data */),
  user ? getHeadToHead(user.id, /* friend id */).catch(() => null) : Promise.resolve(null),
]);
```

Since we need the profile ID first, restructure the fetching:

```ts
const data = await getPublicProfile(username);
if (!data) notFound();

const { profile, gameStats, totalRuns, totalDailyRuns } = data;

const [todayRuns, h2h] = await Promise.all([
  getProfileTodayRuns(profile.id),
  user ? getHeadToHead(user.id, profile.id) : Promise.resolve(null),
]);
```

Add head-to-head section before the "Add as friend" link:

```tsx
{/* Today's games */}
{todayRuns.length > 0 && (
  <section className="mb-8">
    <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Today</h2>
    <div className="flex flex-wrap gap-2">
      {todayRuns.map((r) => {
        const colors = GAME_COLORS[r.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
        return (
          <div key={r.gameSlug} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: colors.bg, color: colors.text }}>
            <span className="capitalize">{r.gameSlug.replace(/-/g, " ")}</span>
            <span className="opacity-70">{r.scoreDisplay}</span>
          </div>
        );
      })}
    </div>
  </section>
)}

{/* Head-to-head */}
{h2h && (h2h.wins + h2h.losses + h2h.draws) > 0 && (
  <section className="mb-8">
    <h2 className="text-sm font-bold text-cream-muted uppercase tracking-wide mb-3">Head-to-head (30 days)</h2>
    <div className="grid grid-cols-3 gap-3 mb-4">
      <div className="p-4 rounded-xl bg-correct/10 border border-correct/20 text-center">
        <p className="text-xl font-extrabold font-mono text-correct">{h2h.wins}</p>
        <p className="text-xs text-cream-muted mt-1">Wins</p>
      </div>
      <div className="p-4 rounded-xl bg-gold-dim border border-gold/20 text-center">
        <p className="text-xl font-extrabold font-mono text-gold">{h2h.draws}</p>
        <p className="text-xs text-cream-muted mt-1">Draws</p>
      </div>
      <div className="p-4 rounded-xl bg-incorrect/10 border border-incorrect/20 text-center">
        <p className="text-xl font-extrabold font-mono text-incorrect">{h2h.losses}</p>
        <p className="text-xs text-cream-muted mt-1">Losses</p>
      </div>
    </div>
    {h2h.recent.length > 0 && (
      <div className="space-y-1.5">
        {h2h.recent.map((r, i) => {
          const colors = GAME_COLORS[r.gameSlug] ?? { bg: "#f3f4f6", text: "#374151" };
          const won = r.mySort > r.theirSort;
          const lost = r.mySort < r.theirSort;
          return (
            <div key={`${r.gameSlug}-${r.dailyDate}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-surface-elevated text-sm">
              <span className="w-20 text-cream-muted text-xs">{r.dailyDate.slice(5)}</span>
              <span className="capitalize font-medium" style={{ color: colors.text }}>{r.gameSlug.replace(/-/g, " ")}</span>
              <span className="ml-auto font-mono font-bold">
                <span className={won ? "text-correct" : lost ? "text-incorrect" : ""}>{r.myScore}</span>
                <span className="text-cream-muted mx-1">vs</span>
                <span>{r.theirScore}</span>
              </span>
            </div>
          );
        })}
      </div>
    )}
  </section>
)}
```

- [ ] **Step 4: Run build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/profile.ts src/app/profile/page.tsx src/app/profile/[username]/page.tsx
git commit -m "Profile: today's dailies, head-to-head comparison for friends"
```

---

## Task 11: Header Fix — Pending Request Timing

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Fix pending request count timing**

The current code fetches `getPendingRequestCount()` when `user` changes, but `user` is set before `profile` is loaded (in the old auth provider). With the new auth provider, `loading=false` means both user and profile are ready. But the header should still wait for `loading` to be false.

Update the useEffect that fetches pending count:

```tsx
useEffect(() => {
  if (loading || !user) return;
  getPendingRequestCount().then(setPendingFriendCount);
}, [user, loading]);
```

This ensures the fetch only happens after auth is fully initialized.

- [ ] **Step 2: Run build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "Header: fix pending request count timing to wait for auth init"
```

---

## Task 12: Final Build Verification + Integration Test

- [ ] **Step 1: Full build**

```bash
npm run build
```

Fix any type errors.

- [ ] **Step 2: Lint check**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Type check**

```bash
npx tsc --noEmit
```

Fix any remaining type errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "Auth + Social Layer Overhaul: auth fix, daily lockout, activity feed, challenges, profiles"
```
