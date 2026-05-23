
-- Drop the view (caused SECURITY DEFINER view warning; column-level grants already protect contact_email)
DROP VIEW IF EXISTS public.partner_labs_public;

-- Restrict trigger/definer functions from public execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
