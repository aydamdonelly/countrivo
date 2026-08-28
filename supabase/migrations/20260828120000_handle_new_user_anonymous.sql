-- Anonymous (guest) users have no email. The old trigger derived the username
-- from the email local-part, ended up with NULL and failed the insert, which
-- surfaced as "Database error creating anonymous user" on the guest join flow.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  base_username text;
  candidate text;
  attempt int := 0;
begin
  base_username := lower(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[^a-z0-9_]', '', 'g'));
  if base_username is null or length(base_username) = 0 then
    base_username := case when coalesce(new.is_anonymous, false) then 'guest' else 'user' end;
  end if;
  if length(base_username) > 20 then
    base_username := substring(base_username, 1, 20);
  end if;

  candidate := base_username;
  while exists (select 1 from public.profiles where username = candidate) loop
    attempt := attempt + 1;
    candidate := base_username || attempt::text;
    if attempt > 9999 then
      candidate := base_username || '_' || substr(new.id::text, 1, 8);
      exit;
    end if;
  end loop;

  insert into public.profiles (id, username, display_name, created_at, updated_at)
  values (new.id, candidate, candidate, now(), now())
  on conflict (id) do nothing;

  return new;
end $function$;
