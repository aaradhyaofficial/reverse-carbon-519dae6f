
-- profiles: restrict SELECT to owner only
DROP POLICY IF EXISTS profiles_select_all_authed ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- user_roles: only admins may write
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- wallet_transactions: own-insert; no client update; own-delete (for privacy wipe)
CREATE POLICY txn_own_insert ON public.wallet_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY txn_own_delete ON public.wallet_transactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- redemptions: own-insert; admin/partner update; own-delete
CREATE POLICY redemptions_own_insert ON public.redemptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY redemptions_partner_update ON public.redemptions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.rewards r
      JOIN public.partners p ON p.id = r.partner_id
      WHERE r.id = redemptions.reward_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.rewards r
      JOIN public.partners p ON p.id = r.partner_id
      WHERE r.id = redemptions.reward_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY redemptions_own_delete ON public.redemptions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- daily_action_limits: own-insert/update/delete
CREATE POLICY dal_own_insert ON public.daily_action_limits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY dal_own_update ON public.daily_action_limits
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY dal_own_delete ON public.daily_action_limits
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- green_actions: admins can update/delete; users can delete own (for privacy wipe); no user update
CREATE POLICY actions_admin_update ON public.green_actions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY actions_own_delete ON public.green_actions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Safe leaderboard function (returns only anonymized public fields)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  handle text,
  carbon_kg numeric,
  points integer,
  streak integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN anonymous_on_leaderboard
         THEN 'Anon-' || substring(id::text, 1, 4)
         ELSE COALESCE(display_name, 'Member')
    END AS handle,
    total_carbon_kg AS carbon_kg,
    total_points AS points,
    current_streak AS streak
  FROM public.profiles
  ORDER BY total_carbon_kg DESC
  LIMIT 50
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
