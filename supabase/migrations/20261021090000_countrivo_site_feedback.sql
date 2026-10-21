begin;

create table if not exists public.countrivo_site_feedback (
  id bigint generated always as identity primary key,
  device_id uuid not null,
  submission_id uuid not null,
  scope text not null check (scope in ('game', 'site')),
  context text not null check (context in ('result', 'game', 'site')),
  game_slug text check (game_slug in ('country-draft', 'blind-pick', 'higher-or-lower', 'pinpoint', 'geo-wordle', 'stat-guesser', 'flag-quiz', 'speed-flags')),
  message text not null check (char_length(btrim(message)) between 5 and 1500),
  created_at timestamptz not null default now(),
  unique (device_id, submission_id),
  check ((scope = 'game' and game_slug is not null) or (scope = 'site' and game_slug is null))
);
create index if not exists countrivo_site_feedback_device_created on public.countrivo_site_feedback (device_id, created_at desc);
alter table public.countrivo_site_feedback enable row level security;
revoke all on public.countrivo_site_feedback from public, anon, authenticated;
grant select, insert on public.countrivo_site_feedback to service_role;
revoke all on sequence public.countrivo_site_feedback_id_seq from public, anon, authenticated;
grant usage, select on sequence public.countrivo_site_feedback_id_seq to service_role;

create or replace function public.countrivo_submit_feedback(p_device uuid, p_submission uuid, p_scope text, p_context text, p_game text, p_message text)
returns void language plpgsql security invoker set search_path = public as $$
declare recent_count integer;
begin
  if p_device is null or p_submission is null then raise exception 'feedback_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback|' || p_device::text, 0));
  -- A response lost in transit must be retryable without consuming another slot.
  if exists (select 1 from public.countrivo_site_feedback where device_id = p_device and submission_id = p_submission) then return; end if;
  select count(*) into recent_count from public.countrivo_site_feedback where device_id = p_device and created_at > now() - interval '1 hour';
  if recent_count >= 3 then raise exception 'feedback_rate_limited'; end if;
  if exists (select 1 from public.countrivo_site_feedback where device_id = p_device and created_at > now() - interval '1 minute') then raise exception 'feedback_too_soon'; end if;
  insert into public.countrivo_site_feedback(device_id, submission_id, scope, context, game_slug, message)
    values (p_device, p_submission, p_scope, p_context, p_game, btrim(p_message));
end;
$$;
revoke all on function public.countrivo_submit_feedback(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.countrivo_submit_feedback(uuid, uuid, text, text, text, text) to service_role;

comment on table public.countrivo_site_feedback is 'Private player feedback. Existing pseudonymous device ID only; no IP address or public reader policy.';

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.countrivo_site_feedback where device_id=p_device_id;
  delete from public.countrivo_publisher_blocks where viewer_id=p_device_id or publisher_id=p_device_id;
  delete from public.countrivo_name_events where device_id=p_device_id;
  delete from public.countrivo_name_reports where device_id=p_device_id or run_id in (select id from public.countrivo_runs where device_id=p_device_id);
  delete from public.countrivo_runs where device_id=p_device_id;
  -- A moderation ban remains so clearing public results cannot re-enable the same device.
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public, anon, authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;

notify pgrst, 'reload schema';

commit;
