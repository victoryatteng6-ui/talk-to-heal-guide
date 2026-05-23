
-- 1. partner_labs: hide contact_email from public reads
DROP POLICY IF EXISTS "Allow public read access" ON public.partner_labs;

CREATE POLICY "Public can read non-sensitive lab info"
ON public.partner_labs FOR SELECT
TO anon
USING (true);

CREATE POLICY "Authenticated can read lab info"
ON public.partner_labs FOR SELECT
TO authenticated
USING (true);

-- Create a safe public view excluding contact_email
CREATE OR REPLACE VIEW public.partner_labs_public AS
SELECT id, name, reg_number, address, latitude, longitude, is_active, created_at
FROM public.partner_labs
WHERE is_active IS TRUE;

GRANT SELECT ON public.partner_labs_public TO anon, authenticated;

-- Revoke direct column-level select on contact_email for anon/auth; only admins via a separate path
REVOKE SELECT ON public.partner_labs FROM anon, authenticated;
GRANT SELECT (id, name, reg_number, address, latitude, longitude, is_active, created_at)
  ON public.partner_labs TO anon, authenticated;
-- contact_email column remains readable only via service role / admin

-- 2. premium_purchases: remove client-side INSERT; only edge function (service role) inserts
DROP POLICY IF EXISTS "Users insert own purchases" ON public.premium_purchases;

-- 3. user_roles: explicit restrictive policy so only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Restrict has_role() execution to authenticated users only (not anon)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
