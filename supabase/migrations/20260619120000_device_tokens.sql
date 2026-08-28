-- APNs device tokens for native push (one row per device token, owned by a user).
create table if not exists public.device_tokens (
  token        text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  platform     text not null default 'ios',
  environment  text not null default 'production', -- 'sandbox' for Xcode debug builds; 'production' for TestFlight/App Store
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists device_tokens_user_id_idx on public.device_tokens(user_id);

alter table public.device_tokens enable row level security;

-- A user can only see/write their own device tokens. The send-push Edge Function
-- uses the service-role key and bypasses RLS to read tokens for any recipient.
create policy "own tokens" on public.device_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
