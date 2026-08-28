-- Streak freeze: a single missed day no longer hard-resets a streak.
-- updateStreak() (src/app/actions/game-runs.ts) spends one freeze to bridge a
-- one-day gap inside a live streak. 2 is the retention sweet spot (Duolingo's
-- own A/B: 2 beats 1, 3 is no better than 2). streak_frozen_dates records which
-- gaps were already bridged, so a re-submit never double-charges a freeze.
--
-- Optional (do later): a weekly pg_cron job can refill freezes up to 2:
--   update public.profiles set streak_freezes = least(2, streak_freezes + 1);
alter table public.profiles
  add column if not exists streak_freezes smallint not null default 2,
  add column if not exists streak_frozen_dates date[] not null default '{}';
