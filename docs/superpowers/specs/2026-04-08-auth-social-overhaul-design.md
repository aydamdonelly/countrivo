# Auth + Social Layer Overhaul

Complete redesign of authentication flow, daily challenge lockout, leaderboards, friends system, challenges, and player profiles.

## Context

### Problems
- Auth-Provider makes two sequential calls (`getUser()` then `fetchProfile()`), sets `loading=false` before profile loads, causing UI flicker everywhere
- Unauthenticated users can replay daily challenges infinitely (only protection is DB unique constraint which requires a user_id)
- Friends page only shows Country Draft scores (hardcoded flagship game)
- `getFriendsLeaderboard()` exists in code but is never wired to UI
- Challenges never expire, no winner tracking, no result display
- No profile page despite profiles existing in DB
- Delay between page load and "already played" status on landing pages

### Decisions
- **Daily lockout**: Hybrid -- DB constraint for auth users, localStorage for guests
- **Friends page**: Activity feed (all games today) + Friends tab on game leaderboards
- **Challenges**: Manual (fixed) + automatic head-to-heads
- **Auth prompt**: Gentle, only on game-over screen after first daily
- **Profile**: Mini-profile at `/profile/[username]` with username/display name editing
- **Approach**: Full social layer overhaul (not incremental patches)
- **Scope**: Game engines and game logic untouched

## 1. Auth System

### Auth-Provider Rewrite

Current: two sequential calls, `loading=false` before profile ready.

New behavior:
- Single init sequence: `getUser()` first, then `fetchProfile()` if user exists, `loading=false` only when both complete
- No intermediate state where `user` is set but `profile` is null (except on error)
- `onAuthStateChange`: fetch profile before firing any pending callback
- If profile fetch fails: user is set, profile stays null, explicit error state available via context
- Callback from auth modal executes after profile is loaded, modal closes after callback completes (not fire-and-forget)

### Auth Modal

- Google + Apple OAuth (one tap) + magic link fallback -- unchanged
- Double-click protection on all buttons
- Modal closes only after pending callback (e.g., score submission) resolves
- Loading spinner in modal during callback execution

### First Sign-In Onboarding

- Username auto-generated from OAuth display name: lowercase, strip non-alphanumeric except hyphens, 3-20 chars
- If username taken: append incrementing suffix (`adam`, `adam2`, `adam3`)
- No extra onboarding screen -- user continues immediately
- Can edit username + display name later in profile

### Auth Prompt Strategy

- During gameplay: zero interruption, no auth hints
- Game-over screen (daily, unauthenticated): prominent "Sign in to save your score" button with subtext about leaderboards + friends
- Only shown once per session (not on every daily game-over)
- Everywhere else: auth prompts only on explicit interaction (clicking Friends, Leaderboard position, Profile)

## 2. Daily Challenge Lockout

### Authenticated Users

- DB unique constraint on `(user_id, game_slug, daily_date, mode)` where mode='daily' -- exists, keep
- Play page (server component): `checkDailyStatus()` runs server-side, renders `DailyAlreadyPlayed` if found
- This is instant, no client-side delay

### Unauthenticated Users

- localStorage key: `daily:{slug}:{dateKey}` storing `{ score, scoreDisplay, timestamp }`
- Before rendering game board: client checks localStorage for matching key
- If found: render Already-Played screen with stored score (no server call needed)
- Key auto-expires: date check on read, old keys ignored
- Easily bypassed (incognito, clear storage) -- acceptable tradeoff for guest UX

### Merge After Auth

- Unauth user plays daily -> result stored in `pendingPayload` + localStorage
- User signs in on game-over screen -> `pendingPayload` submitted to server via callback
- If user somehow played twice (cleared localStorage): DB constraint catches duplicate, first submission stands
- Edge case: if user played unauth, navigates away, comes back later and signs in -- localStorage still has the payload, but pendingPayload in React state is gone. This is accepted: the localStorage record prevents replay, but score isn't retroactively saved. User would need to sign in during the game-over screen.

### Already-Played Screen

Shows:
- Score (from server if auth, from localStorage if guest)
- Rank + percentile (auth only)
- Countdown timer to midnight Berlin (next reset)
- "Practice mode" link
- "View leaderboard" link

## 3. Leaderboard System

### Global Daily Leaderboard (per game)

- Exists via `getDailyLeaderboard()` RPC -- keep
- Fix empty state: "Be the first to play today!" instead of blank
- User's own entry highlighted (gold background / border)
- Click on any entry -> link to `/profile/[username]`
- Daily summary header: player count, average score, top score

### Friends Leaderboard Tab

- `getFriendsLeaderboard(gameSlug, dateKey)` exists in `friends.ts` -- wire to UI
- Tab switch on leaderboard page: "Global" | "Friends"
- Shows user + friends only, ranked by score_sort_value
- Empty state: "Challenge a friend!" with link to friends page
- Same click-to-profile behavior as global leaderboard

### Performance

- Leaderboard page server-side rendered -- no client fetch delay
- Friends leaderboard: server-side fetch with auth check

## 4. Friends Page -- Activity Feed

### Route: `/friends`

### Layout (top to bottom)

1. **Pending friend requests** (if any): badge count + expandable list with accept/decline
2. **Activity feed**: main content, daily activity per friend
3. **Friend search**: search bar at bottom to find + add new friends

### Activity Feed Cards

Per friend, one card showing:
- Avatar + display name + username
- Streak flame + count
- Row of game icons for each daily played today, with score underneath each
- If both you and friend played the same game: inline head-to-head indicator (your score vs theirs, winner highlighted)
- Click game icon: if you played it too -> expand to head-to-head detail. If not -> "Play now" link

Sorting:
- Most active friends first (most dailies played today)
- Then by streak length
- Friends with no activity today: compact row at bottom ("No games today")

Click friend name/avatar -> `/profile/[username]`

### Data

`getFriends()` rewritten:
- Fetch all accepted friendships
- For each friend: fetch all `game_runs` where `mode='daily'` and `daily_date = today`
- Also fetch current user's daily runs for head-to-head comparison
- Return structured: `{ friend: Profile, todayRuns: GameRun[], streak: number }`

### Friend Search Fix

- Add 300ms debounce (currently fires on every keystroke)
- Prevent duplicate friend requests (check existing before sending)

## 5. Challenge System

### Manual Challenges (Fixed)

Existing flow kept but fixed:

- After daily game-over: "Challenge a friend" button -> friend picker modal
- Creates `friend_challenges` record with `challenger_run_id`
- **Expiration**: challenges are considered expired if `daily_date < today` (Berlin time). No cron needed -- just filter on read
- **Completion**: when challenged friend plays the same daily, `completeChallenge()` sets `challenged_run_id` + status = "completed"
- **Validation**: `completeChallenge()` now verifies game_slug + daily_date match between challenger's run and challenged's run
- **Winner calculation**: compare `score_sort_value` of both runs. Higher = winner. Equal = draw. Store `winner_id` on challenge record

### Challenge Result Card

Shown on friends page and in notifications:
- Both players' avatars + names
- Both scores side by side
- Winner highlighted (gold border/glow)
- "Draw" state if equal
- Game icon + date

### Automatic Head-to-Heads

- No DB records needed
- Computed on-the-fly: when loading friends activity feed, compare your daily runs with each friend's daily runs for the same games
- Displayed inline on friend cards in activity feed
- Click to expand: shows score comparison, rank comparison, who played first

### Challenge History on Profile

- When viewing a friend's profile: show last 10 head-to-head results (from both manual challenges and auto-computed)
- Win/Loss/Draw tally for the friendship
- Manual challenges show the explicit challenge context; auto head-to-heads show the game + date

## 6. Profile System

### Route: `/profile/[username]`

### Profile Header

- Avatar (from OAuth provider)
- Display name (large)
- @username (smaller, muted)
- Current streak + longest streak
- "Edit profile" button (only on own profile)

### Edit Profile

- Server action: `updateProfile({ username?, displayName? })`
- Username validation: lowercase, alphanumeric + hyphens, 3-20 chars, unique (server-side check)
- Display name validation: 1-30 chars, any characters
- Inline error messages for validation failures
- Optimistic update on success

### Stats Section

**Today**:
- List of dailies played today with scores + ranks
- Games not yet played shown as "Not played" (with "Play now" link if it's your own profile)

**All-Time**:
- Total games played
- Favorite game (most runs)
- Average percentile across all daily games
- Personal best per game (score + date)

### Head-to-Head Section (friends only)

- Shown when viewing a friend's profile
- Win/Loss/Draw record
- Last 10 comparisons with scores
- Not shown on own profile or non-friend profiles

### Linking

Every username/avatar in the app links to profile:
- Leaderboard entries
- Friend cards in activity feed
- Challenge result cards
- Header user menu -> "My profile"

## 7. UX & Performance

### No Flicker

- Auth-Provider `loading` covers both user + profile fetch
- Components that depend on auth show skeleton states during loading, not empty states that flash and then fill
- No partial state (user without profile)

### Optimistic Daily Status

- Landing page: `PlayedTodayBanner` checks localStorage first (instant), then confirms with server in background
- If localStorage says played but server says not (cleared storage, different device): server wins, banner disappears
- If localStorage says not played but server says played: server wins, banner appears

### Server-Side Rendering

- Leaderboard pages: fully server-rendered, no client fetch
- Profile pages: server-rendered with auth-dependent sections
- Friends page: server-rendered activity feed (requires auth)

### Skeleton States

- Replace all flash-of-empty patterns with proper skeletons
- Leaderboard: skeleton rows
- Friends: skeleton cards
- Profile: skeleton header + stats

## 8. Requirements Checklist

### Auth & Security
1. Auth-Provider: single init, no intermediate state
2. Double-click protection on auth + submit buttons
3. Auth modal callback waits for completion
4. Username auto-generated on first sign-in
5. Username uniqueness validated server-side
6. OAuth redirect validation (exists, keep)

### Daily Integrity
7. localStorage lock with date key (auto-expire)
8. localStorage stores score + timestamp for offline display
9. Server enforces Berlin datekey (exists, keep)
10. Minimum 3s game duration (exists, keep)
11. Per-game score validation (exists, keep)
12. Merge: unauth daily -> auth -> submit pendingPayload
13. Double-submit prevented by DB constraint + client flag
14. Already-played shows countdown to reset
15. Already-played shows score + rank + percentile
16. Practice mode unchanged, unlimited

### Leaderboard
17. Empty leaderboards: "Be the first!" instead of blank
18. Own position highlighted
19. Click entry -> profile
20. Friends tab on every game leaderboard page
21. Friends leaderboard empty state: "Challenge a friend!"
22. Server-side rendered, no spinner
23. Daily summary header (player count, avg, top score)

### Friends & Social
24. Activity feed: all dailies per friend per day
25. Sorted: most active first, then by streak
26. Inactive friends compact at bottom
27. Game icons with scores inline
28. Auto head-to-head inline when both played
29. Click game icon -> detail or "Play now"
30. Friend request badge in header (fix timing)
31. Friend search: 300ms debounce
32. Pending requests prominent at top
33. Friend removal with confirmation
34. Duplicate requests prevented

### Challenges
35. Expiration: challenges older than today's date are expired
36. Winner calculation server-side via score_sort_value
37. Result card with both scores + winner
38. Win/loss/draw tally per friendship
39. Challenge notification on friends page
40. "Play now" link in challenge card
41. Expired challenges shown as "Missed"
42. Auto head-to-heads computed on-the-fly (no DB record)
43. Head-to-head detail expandable
44. Challenge history on profile (last 10)

### Profile
45. Mini-profile page at `/profile/[username]`
46. Username editing (unique, 3-20 chars, alphanumeric + hyphens)
47. Display name editing (1-30 chars)
48. Streak display (current + longest)
49. Today's dailies with scores
50. All-time stats (total games, favorite game, avg percentile)
51. Personal bests per game
52. Head-to-head record (for friends viewing each other)
53. Linked from everywhere (leaderboard, friends, challenges)

### Performance & UX
54. Skeleton states instead of flash-of-empty
55. localStorage as instant cache, server confirms
56. Optimistic daily status on landing pages
57. Server-side rendering for leaderboards
58. No spinner on friends page (server prefetch)
59. Auth loading covers everything, no partial state
60. Auth prompt only on game-over screen (daily, unauth, once per session)
