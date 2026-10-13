alter table public.countrivo_runs add column if not exists moderation_hidden boolean not null default false;
alter table public.countrivo_runs add column if not exists place_country_code text;

create or replace view public.countrivo_leaderboard with (security_barrier = true) as
select id, game_slug, date_key, edition, display_name, score_raw, score_max,
       score_sort_value, score_display, completed_at, place_country_code
from public.countrivo_runs
where mode = 'daily' and status = 'complete' and display_name is not null and moderation_hidden = false;
grant select on public.countrivo_leaderboard to anon, authenticated;

create table if not exists public.countrivo_bot_runs (
  game_slug text not null,
  date_key date not null,
  display_name text not null,
  score_display text not null,
  score_sort_value numeric not null,
  is_bot boolean not null default true check (is_bot = true),
  primary key (game_slug, date_key, display_name)
);
alter table public.countrivo_bot_runs enable row level security;
create policy "Clearly labelled Countrivo bots" on public.countrivo_bot_runs for select to anon, authenticated using (is_bot = true);
grant select on public.countrivo_bot_runs to anon, authenticated;
grant all on public.countrivo_bot_runs to service_role;
