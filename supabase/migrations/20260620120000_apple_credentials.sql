-- Stores the Sign in with Apple refresh token so account deletion can revoke it
-- (Apple Guideline 5.1.1(v)). Written by the apple-exchange edge function right
-- after sign-in; read + revoked by the delete-account function.
-- RLS is enabled with NO policies, so only the service-role key (edge functions)
-- can read or write it — the client never touches the token.
create table if not exists public.apple_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.apple_credentials enable row level security;
