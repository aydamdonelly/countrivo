begin;

create or replace function public.countrivo_submit_feedback(p_device uuid, p_submission uuid, p_scope text, p_context text, p_game text, p_message text)
returns void language plpgsql security invoker set search_path = public as $$
declare recent_count integer;
begin
  if p_device is null or p_submission is null then raise exception 'feedback_invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback|' || p_device::text, 0));
  -- A committed submission remains retryable even when the device's limit is full.
  if exists (select 1 from public.countrivo_site_feedback where device_id = p_device and submission_id = p_submission) then return; end if;
  select count(*) into recent_count from public.countrivo_site_feedback where device_id = p_device and created_at > now() - interval '1 hour';
  if recent_count >= 20 then raise exception 'feedback_rate_limited'; end if;
  if exists (select 1 from public.countrivo_site_feedback where device_id = p_device and created_at > now() - interval '5 seconds') then raise exception 'feedback_too_soon'; end if;
  insert into public.countrivo_site_feedback(device_id, submission_id, scope, context, game_slug, message)
    values (p_device, p_submission, p_scope, p_context, p_game, btrim(p_message));
end;
$$;

commit;
