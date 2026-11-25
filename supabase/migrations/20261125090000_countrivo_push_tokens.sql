begin;

-- Daily reminder tokens from the iOS app. One row per APNs device token; the device id ties
-- it to the same signed device cookie as game results, so Forget this device removes it.
create table if not exists public.countrivo_push_tokens (
  token text primary key check (token ~ '^[0-9a-f]{64,200}$'),
  device_id uuid not null,
  timezone text not null default 'Europe/Berlin' check (char_length(timezone) between 1 and 64),
  enabled boolean not null default true,
  last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists countrivo_push_tokens_device on public.countrivo_push_tokens(device_id);
create index if not exists countrivo_push_tokens_enabled on public.countrivo_push_tokens(enabled) where enabled;
alter table public.countrivo_push_tokens enable row level security;
revoke all on public.countrivo_push_tokens from public, anon, authenticated;
grant select, insert, update, delete on public.countrivo_push_tokens to service_role;
comment on table public.countrivo_push_tokens is 'Opt-in daily reminder tokens from the iOS app: APNs token, device id, IANA time zone, last local send date. No names or game data.';

commit;
