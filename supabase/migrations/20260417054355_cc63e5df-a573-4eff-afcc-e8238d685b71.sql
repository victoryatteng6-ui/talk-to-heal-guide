-- Tighten the three anonymous-insert policies so signed-in users
-- cannot attribute events to someone else's user_id.
DROP POLICY IF EXISTS "Anyone can record a referral landing" ON public.referrals;
CREATE POLICY "Anyone can record a referral landing"
  ON public.referrals FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can log a share" ON public.share_events;
CREATE POLICY "Anyone can log a share"
  ON public.share_events FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can log a lab event" ON public.lab_events;
CREATE POLICY "Anyone can log a lab event"
  ON public.lab_events FOR INSERT
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
