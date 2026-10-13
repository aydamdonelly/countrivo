-- New device-based games leave all historical accounts and scores intact.
create table if not exists public.countrivo_runs (
  id bigint generated always as identity primary key,
  session_id uuid not null unique,
  device_id uuid not null,
  game_slug text not null,
  mode text not null check (mode in ('daily', 'practice')),
  date_key date not null,
  edition text not null default '',
  seed bigint not null,
  status text not null default 'open' check (status in ('open', 'complete')),
  action_log text not null default '',
  state_json jsonb,
  revision integer not null default 0,
  score_raw numeric,
  score_max numeric,
  score_sort_value numeric,
  score_display text,
  result_json jsonb,
  display_name text check (display_name is null or char_length(display_name) between 2 and 24),
  published_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create unique index if not exists countrivo_one_daily on public.countrivo_runs(device_id, game_slug, date_key, edition) where mode = 'daily';
create index if not exists countrivo_daily_board on public.countrivo_runs(game_slug, date_key, score_sort_value desc) where status = 'complete' and display_name is not null;
alter table public.countrivo_runs enable row level security;
revoke all on public.countrivo_runs from anon, authenticated;
grant all on public.countrivo_runs to service_role;
grant usage, select on sequence public.countrivo_runs_id_seq to service_role;

-- A public board contains names and scores, never device IDs, action logs or answers.
create or replace view public.countrivo_leaderboard with (security_barrier = true) as
select id, game_slug, date_key, edition, display_name, score_raw, score_max,
       score_sort_value, score_display, completed_at
from public.countrivo_runs
where mode = 'daily' and status = 'complete' and display_name is not null;
grant select on public.countrivo_leaderboard to anon, authenticated;

create table if not exists public.countrivo_boards (
  game_slug text not null,
  date_key date not null,
  edition text not null,
  engine_version text not null,
  seed bigint not null,
  public_board jsonb not null,
  solution jsonb not null,
  created_at timestamptz not null default now(),
  primary key (game_slug, date_key, edition)
);
alter table public.countrivo_boards enable row level security;
revoke all on public.countrivo_boards from anon, authenticated;
grant all on public.countrivo_boards to service_role;

create table if not exists public.countrivo_name_reports (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.countrivo_runs(id),
  device_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 120),
  created_at timestamptz not null default now(),
  unique(run_id, device_id)
);
alter table public.countrivo_name_reports enable row level security;
revoke all on public.countrivo_name_reports from anon, authenticated;
grant all on public.countrivo_name_reports to service_role;
grant usage, select on sequence public.countrivo_name_reports_id_seq to service_role;

create table if not exists public.countrivo_config (key text primary key, value text not null);
insert into public.countrivo_config(key, value) values ('daily_edition', 'october-relaunch-1') on conflict (key) do nothing;
alter table public.countrivo_config enable row level security;
create policy "Countrivo public configuration" on public.countrivo_config for select to anon, authenticated using (true);
grant select on public.countrivo_config to anon, authenticated;
grant all on public.countrivo_config to service_role;
