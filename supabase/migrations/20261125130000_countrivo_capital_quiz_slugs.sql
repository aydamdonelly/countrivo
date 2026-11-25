begin;

-- Capital Quiz (practice only) joins the game slugs the first-party usage events and the
-- game-scoped feedback accept. Practice runs need nothing here: countrivo_runs.game_slug has
-- no check constraint, and the run usage trigger already swallows its own errors.
-- Idempotent: each constraint is dropped if present and recreated with the full list.
-- After applying, add "capital-quiz" to RECORDED_GAME_SLUGS in src/ui/types.ts.

alter table public.countrivo_usage_events drop constraint if exists countrivo_usage_events_game_check;
alter table public.countrivo_usage_events add constraint countrivo_usage_events_game_check
  check (game in ('country-draft','blind-pick','higher-or-lower','pinpoint','geo-wordle','stat-guesser','flag-quiz','speed-flags','capital-quiz'));

alter table public.countrivo_usage_events drop constraint if exists countrivo_usage_events_target_game_check;
alter table public.countrivo_usage_events add constraint countrivo_usage_events_target_game_check
  check (target_game in ('country-draft','blind-pick','higher-or-lower','pinpoint','geo-wordle','stat-guesser','flag-quiz','speed-flags','capital-quiz'));

alter table public.countrivo_site_feedback drop constraint if exists countrivo_site_feedback_game_slug_check;
alter table public.countrivo_site_feedback add constraint countrivo_site_feedback_game_slug_check
  check (game_slug in ('country-draft','blind-pick','higher-or-lower','pinpoint','geo-wordle','stat-guesser','flag-quiz','speed-flags','capital-quiz'));

commit;
