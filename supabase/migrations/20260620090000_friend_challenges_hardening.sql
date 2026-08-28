-- Harden friend_challenges (bug fix #3): prevent duplicate challenges + lock
-- writes to the caller's own identity. The createChallenge server action already
-- verifies friendship + looks up the caller's own run; this is defense in depth.

-- One challenge per (challenger, challenged, game, day).
do $$ begin
  alter table public.friend_challenges
    add constraint friend_challenges_unique_per_day
    unique (challenger_id, challenged_id, game_slug, daily_date);
exception
  when duplicate_object then null;
  when duplicate_table then null;
end $$;

alter table public.friend_challenges enable row level security;

-- A user may only INSERT a challenge as themselves.
drop policy if exists "insert own challenge" on public.friend_challenges;
create policy "insert own challenge" on public.friend_challenges
  for insert to authenticated with check (auth.uid() = challenger_id);

-- Participants may read their own challenges.
drop policy if exists "read own challenges" on public.friend_challenges;
create policy "read own challenges" on public.friend_challenges
  for select to authenticated
  using (auth.uid() = challenger_id or auth.uid() = challenged_id);

-- Only the challenged user may complete (update) a challenge.
drop policy if exists "update as challenged" on public.friend_challenges;
create policy "update as challenged" on public.friend_challenges
  for update to authenticated
  using (auth.uid() = challenged_id) with check (auth.uid() = challenged_id);
