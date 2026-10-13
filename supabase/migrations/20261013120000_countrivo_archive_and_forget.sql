alter table public.countrivo_runs add column if not exists archived boolean not null default false;

create or replace function public.countrivo_forget_device(p_device_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.countrivo_name_reports where device_id = p_device_id or run_id in (select id from public.countrivo_runs where device_id = p_device_id);
  delete from public.countrivo_runs where device_id = p_device_id;
end;
$$;
revoke all on function public.countrivo_forget_device(uuid) from public, anon, authenticated;
grant execute on function public.countrivo_forget_device(uuid) to service_role;
