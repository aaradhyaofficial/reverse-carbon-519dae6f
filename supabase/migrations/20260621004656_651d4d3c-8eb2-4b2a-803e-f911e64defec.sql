
-- Wallet transactions: remove client INSERT/DELETE; reads stay
DROP POLICY IF EXISTS "txn_own_insert" ON public.wallet_transactions;
DROP POLICY IF EXISTS "txn_own_delete" ON public.wallet_transactions;
REVOKE INSERT, UPDATE, DELETE ON public.wallet_transactions FROM authenticated;

-- Green actions: remove client INSERT/DELETE; server handles writes
DROP POLICY IF EXISTS "actions_own_insert" ON public.green_actions;
DROP POLICY IF EXISTS "actions_own_delete" ON public.green_actions;
REVOKE INSERT, UPDATE, DELETE ON public.green_actions FROM authenticated;

-- Daily action limits: server-only writes
DROP POLICY IF EXISTS "dal_own_insert" ON public.daily_action_limits;
DROP POLICY IF EXISTS "dal_own_update" ON public.daily_action_limits;
DROP POLICY IF EXISTS "dal_own_delete" ON public.daily_action_limits;
REVOKE INSERT, UPDATE, DELETE ON public.daily_action_limits FROM authenticated;

-- Lock down SECURITY DEFINER helper/trigger functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
-- has_role is still usable inside RLS policies (evaluated as definer) and from service_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
