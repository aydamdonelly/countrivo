-- Fire an HTTP POST to the send-challenge-email edge function whenever a new
-- friend_challenge is inserted. The edge function looks up the recipient's
-- email + sends through Resend (if RESEND_API_KEY is configured); otherwise it
-- logs a no-op.
--
-- Activation requires two dashboard settings; see docs/notifications-setup.md:
--   - Edge Functions secret RESEND_API_KEY
--   - Database custom config app.settings.service_role_key

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_friend_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
DECLARE
  v_url text := 'https://reqvdyfzwkrtlvgapnyq.supabase.co/functions/v1/send-challenge-email';
  v_service_key text := current_setting('app.settings.service_role_key', true);
BEGIN
  -- Fire-and-forget. Failures here must not block the INSERT.
  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_service_key, '')
      ),
      body := jsonb_build_object('challenge_id', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_friend_challenge http_post failed: %', SQLERRM;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_friend_challenge ON public.friend_challenges;
CREATE TRIGGER trg_notify_friend_challenge
  AFTER INSERT ON public.friend_challenges
  FOR EACH ROW EXECUTE FUNCTION public.notify_friend_challenge();
