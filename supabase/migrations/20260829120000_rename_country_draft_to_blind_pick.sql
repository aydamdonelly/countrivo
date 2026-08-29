-- Rename the game slug 'country-draft' to 'blind-pick'.
--
-- Why: the URL /games/country-draft is the one that ranks, and what people mean when they
-- google "country draft" is the cabinet draft (draft five people, take the world). That
-- game moves onto the ranking URL and keeps the name Country Draft. The eight-stat game
-- that used to live there (eight categories on the board, countries arriving one at a
-- time, each put on the stat where it ranks highest) is renamed Blind Pick and moves to
-- /games/blind-pick. Its history has to move with it, or every past run, personal best,
-- streak stat and daily puzzle would silently attach to the new game instead.
--
-- Safe to re-run: every statement is scoped to rows that still carry the old slug, and no
-- 'blind-pick' rows existed before this migration, so the (user_id, game_slug) and
-- (game_slug, daily_date) uniques cannot collide.

BEGIN;

UPDATE public.game_runs         SET game_slug = 'blind-pick' WHERE game_slug = 'country-draft';
UPDATE public.user_game_stats   SET game_slug = 'blind-pick' WHERE game_slug = 'country-draft';
UPDATE public.daily_puzzles     SET game_slug = 'blind-pick' WHERE game_slug = 'country-draft';
UPDATE public.friend_challenges SET game_slug = 'blind-pick' WHERE game_slug = 'country-draft';

-- atlas_stickers is a relic of the removed album page (no app code reads it any more), but
-- trg_stamp_atlas on game_runs still writes to it, so its stored slug moves too.
DO $$
BEGIN
  IF to_regclass('public.atlas_stickers') IS NOT NULL THEN
    UPDATE public.atlas_stickers SET first_game_slug = 'blind-pick' WHERE first_game_slug = 'country-draft';
  END IF;
END $$;

-- extract_countries() keys its country-stamping branches off the slug. Only the label
-- changes; every branch body is byte-identical to the deployed function.
CREATE OR REPLACE FUNCTION public.extract_countries(slug text, result jsonb)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  out_array text[] := ARRAY[]::text[];
  v text;
BEGIN
  IF result IS NULL THEN RETURN out_array; END IF;

  CASE slug
    WHEN 'trace' THEN
      -- renamed from 'countryle' 2026-05-26. Stamp target ISO3 only if the run was won.
      IF (result->>'won')::boolean IS TRUE THEN
        v := result->>'target';
        IF v IS NOT NULL AND length(v) = 3 THEN
          out_array := ARRAY[upper(v)];
        END IF;
      END IF;
    WHEN 'blind-pick' THEN
      -- renamed from 'country-draft' 2026-08-29.
      IF jsonb_typeof(result->'countryIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(val))
          INTO out_array
          FROM jsonb_array_elements_text(result->'countryIso3s') AS val
         WHERE val IS NOT NULL AND length(val) = 3;
      END IF;
    WHEN 'stat-guesser' THEN
      -- Shape currently does not embed ISO3. Future: embed targetIso3s array.
      IF jsonb_typeof(result->'targetIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(val))
          INTO out_array
          FROM jsonb_array_elements_text(result->'targetIso3s') AS val
         WHERE val IS NOT NULL AND length(val) = 3;
      ELSIF result->>'targetIso3' IS NOT NULL THEN
        v := result->>'targetIso3';
        IF length(v) = 3 THEN
          out_array := ARRAY[upper(v)];
        END IF;
      END IF;
    WHEN 'cluster' THEN
      -- Not yet shipped. Placeholder for future: expects { won: bool, countryIso3s: [...] }
      IF (result->>'won')::boolean IS TRUE AND jsonb_typeof(result->'countryIso3s') = 'array' THEN
        SELECT array_agg(DISTINCT upper(val))
          INTO out_array
          FROM jsonb_array_elements_text(result->'countryIso3s') AS val
         WHERE val IS NOT NULL AND length(val) = 3;
      END IF;
    ELSE
      out_array := ARRAY[]::text[];
  END CASE;

  RETURN COALESCE(out_array, ARRAY[]::text[]);
END $function$;

COMMIT;
