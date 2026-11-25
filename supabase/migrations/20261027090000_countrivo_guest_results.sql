begin;

-- New completed runs receive a public pseudonym atomically with their score.
-- Historical private results keep their original visibility.
create or replace function public.countrivo_default_run_name()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status='complete' then
    perform pg_advisory_xact_lock(hashtextextended('publisher|'||new.device_id::text,0));
    if new.display_name is null and (tg_op='INSERT' or old.status<>'complete') then
      new.display_name := 'guest-' || substr(md5(new.device_id::text),1,8);
    end if;
    if new.mode='daily' and new.display_name is not null then new.published_at := coalesce(new.published_at,now()); end if;
    if exists(select 1 from public.countrivo_publisher_bans where device_id=new.device_id) then
      new.moderation_hidden := true;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.countrivo_default_run_name() from public,anon,authenticated;
drop trigger if exists countrivo_default_run_name on public.countrivo_runs;
create trigger countrivo_default_run_name before insert or update on public.countrivo_runs
for each row execute function public.countrivo_default_run_name();

create or replace function public.countrivo_publish_name(p_run_id bigint,p_device uuid,p_ip text,p_day date,p_edition text,p_name text,p_place text)
returns setof public.countrivo_runs language plpgsql security definer set search_path = public as $$
declare chosen public.countrivo_runs;
begin
  perform pg_advisory_xact_lock(hashtextextended('publisher|'||p_device::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_ip||p_day::text,0));
  if exists(select 1 from public.countrivo_publisher_bans where device_id=p_device) then raise exception 'publisher_banned'; end if;
  select * into chosen from public.countrivo_runs where id=p_run_id and device_id=p_device and status='complete' for update;
  if not found or (chosen.mode='daily' and (chosen.date_key<>p_day or chosen.edition<>p_edition)) then raise exception 'board_closed'; end if;
  if char_length(p_name)<2 or char_length(p_name)>20 then raise exception 'invalid_name'; end if;
  if (select count(*) from public.countrivo_name_events where device_id=p_device and created_at>now()-interval '1 hour')>=10 then raise exception 'name_throttled'; end if;
  if not exists(select 1 from public.countrivo_name_events where device_id=p_device and ip_hash=p_ip and date_key=p_day)
    and (select count(distinct device_id) from public.countrivo_name_events where ip_hash=p_ip and date_key=p_day)>=10 then raise exception 'network_throttled'; end if;
  insert into public.countrivo_name_events(device_id,ip_hash,date_key) values(p_device,p_ip,p_day);
  return query update public.countrivo_runs set display_name=p_name,place_country_code=p_place,published_at=now() where id=p_run_id and device_id=p_device returning *;
end;
$$;
revoke all on function public.countrivo_publish_name(bigint,uuid,text,date,text,text,text) from public,anon,authenticated;
grant execute on function public.countrivo_publish_name(bigint,uuid,text,date,text,text,text) to service_role;


commit;
