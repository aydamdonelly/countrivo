-- handle_new_user: derive username from the email local-part (sanitized to
-- a-z0-9_, max 20 chars), append a numeric discriminator on collisions, and
-- fall back to a UUID-based name if 9999 collisions occur.
--
-- Replaces the previous trigger that always wrote `player_<uuid>` usernames
-- (unreadable, broke on every UNIQUE collision). Designed for the email +
-- password signup flow now that magic-link and OAuth are removed.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_username text;
  candidate text;
  attempt int := 0;
BEGIN
  -- Strip email local-part, sanitize to a-z0-9_, max 20 chars
  base_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9_]', '', 'g'));
  IF length(base_username) = 0 THEN
    base_username := 'user';
  END IF;
  IF length(base_username) > 20 THEN
    base_username := substring(base_username, 1, 20);
  END IF;

  candidate := base_username;

  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) LOOP
    attempt := attempt + 1;
    candidate := base_username || attempt::text;
    IF attempt > 9999 THEN
      candidate := base_username || '_' || substr(NEW.id::text, 1, 8);
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (NEW.id, candidate, candidate, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END $$;
