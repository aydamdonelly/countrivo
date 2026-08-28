-- Bug fix #5: stop deriving usernames from the email local-part (a PII leak —
-- a real name ended up on public leaderboards and in /friends/add URLs).
-- New signups get a geography-themed random handle, and existing email-derived
-- handles are scrubbed.

-- Reusable unique-handle generator (e.g. "clever-meridian-482").
CREATE OR REPLACE FUNCTION public.gen_geo_handle()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  adjectives text[] := array['swift','brave','calm','bright','keen','bold','wise','lucky','noble','quick','sunny','clever','daring','mighty','jolly','witty','grand','breezy','royal','merry','amber','cosmic','polar','golden'];
  nouns text[] := array['atlas','nomad','compass','voyager','summit','harbor','tundra','delta','glacier','fjord','mesa','oasis','canyon','lagoon','isle','peak','reef','valley','cape','dune','ridge','coast','meridian','pioneer'];
  candidate text;
  attempt int := 0;
BEGIN
  LOOP
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '-' || nouns[1 + floor(random() * array_length(nouns, 1))::int]
      || '-' || (100 + floor(random() * 900))::int::text;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate);
    attempt := attempt + 1;
    EXIT WHEN attempt > 50;
  END LOOP;
  RETURN candidate;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  candidate text;
BEGIN
  candidate := public.gen_geo_handle();
  -- Guarantee uniqueness even if the generator gave up after 50 tries.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate) THEN
    candidate := candidate || '-' || substr(NEW.id::text, 1, 6);
  END IF;

  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (NEW.id, candidate, candidate, now(), now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END $$;

-- One-time scrub: regenerate handles that still match the user's email local-part.
DO $$
DECLARE
  r record;
  new_handle text;
BEGIN
  FOR r IN
    SELECT p.id, p.username, p.display_name,
           lower(regexp_replace(split_part(u.email, '@', 1), '[^a-z0-9_]', '', 'g')) AS local_part
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
  LOOP
    IF r.username = r.local_part OR r.username = substring(r.local_part, 1, 20) THEN
      new_handle := public.gen_geo_handle();
      UPDATE public.profiles
      SET username = new_handle,
          display_name = CASE WHEN display_name = r.username THEN new_handle ELSE display_name END,
          updated_at = now()
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;
