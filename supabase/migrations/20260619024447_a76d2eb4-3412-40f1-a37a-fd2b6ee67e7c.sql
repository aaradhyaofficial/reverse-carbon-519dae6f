
-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'partner', 'user');
CREATE TYPE public.action_type AS ENUM ('bike', 'walk', 'transit', 'utility_saving', 'food_waste');
CREATE TYPE public.txn_kind AS ENUM ('earn', 'redeem', 'adjust');
CREATE TYPE public.redemption_status AS ENUM ('pending', 'used', 'expired', 'cancelled');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  region_code TEXT NOT NULL DEFAULT 'US-CA',
  total_carbon_kg NUMERIC NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_action_date DATE,
  anonymous_on_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

-- ===== user_roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Now create signup trigger (depends on user_roles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== partners =====
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  description TEXT,
  logo_url TEXT,
  approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_select_approved" ON public.partners FOR SELECT TO authenticated USING (approved OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "partners_insert_self" ON public.partners FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "partners_update_owner" ON public.partners FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "partners_delete_owner" ON public.partners FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== rewards =====
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  location TEXT,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  image_url TEXT,
  stock INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT ALL ON public.rewards TO service_role;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rewards_select_active" ON public.rewards FOR SELECT TO authenticated USING (
  active OR EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "rewards_partner_write" ON public.rewards FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND (p.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE TRIGGER rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ===== green_actions =====
CREATE TABLE public.green_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type public.action_type NOT NULL,
  distance_km NUMERIC NOT NULL DEFAULT 0,
  duration_min NUMERIC NOT NULL DEFAULT 0,
  region_code TEXT NOT NULL DEFAULT 'US-CA',
  carbon_kg_saved NUMERIC NOT NULL DEFAULT 0,
  points_earned INTEGER NOT NULL DEFAULT 0,
  device_fingerprint TEXT,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.green_actions TO authenticated;
GRANT ALL ON public.green_actions TO service_role;
ALTER TABLE public.green_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "actions_own_select" ON public.green_actions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "actions_own_insert" ON public.green_actions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ===== wallet_transactions =====
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta_points INTEGER NOT NULL,
  kind public.txn_kind NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "txn_own_select" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- ===== redemptions =====
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  code_expires_at TIMESTAMPTZ NOT NULL,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  cost_points INTEGER NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redemptions TO authenticated;
GRANT ALL ON public.redemptions TO service_role;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions_own_select" ON public.redemptions FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.rewards r JOIN public.partners p ON p.id = r.partner_id WHERE r.id = reward_id AND p.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);

-- ===== daily_action_limits =====
CREATE TABLE public.daily_action_limits (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type public.action_type NOT NULL,
  day DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, action_type, day)
);
GRANT SELECT, INSERT, UPDATE ON public.daily_action_limits TO authenticated;
GRANT ALL ON public.daily_action_limits TO service_role;
ALTER TABLE public.daily_action_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dal_own" ON public.daily_action_limits FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ===== Seed demo partners + rewards =====
INSERT INTO public.partners (id, business_name, category, location, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Verdant Coffee', 'Cafe', 'Mission, San Francisco', 'Specialty coffee roasted with renewables.'),
  ('22222222-2222-2222-2222-222222222222', 'GreenWheels Bike Co.', 'Cycling', 'Berkeley, CA', 'Locally-owned bike shop & repair.'),
  ('33333333-3333-3333-3333-333333333333', 'OneTree Project', 'Climate', 'Global', 'Reforestation NGO planting native trees.');

INSERT INTO public.rewards (partner_id, title, description, category, location, cost_points, stock) VALUES
  ('11111111-1111-1111-1111-111111111111', '$3 off any pour-over', 'Show the QR at checkout. One per visit.', 'Discount', 'San Francisco', 150, 500),
  ('11111111-1111-1111-1111-111111111111', 'Free oat milk upgrade', 'Stack with any drink. Today only.', 'Discount', 'San Francisco', 60, 1000),
  ('22222222-2222-2222-2222-222222222222', '15% off bike tune-up', 'Includes brake adjust + lube.', 'Service', 'Berkeley', 400, 100),
  ('22222222-2222-2222-2222-222222222222', 'Free helmet rental (1 day)', 'For commuter trial days.', 'Service', 'Berkeley', 220, 50),
  ('33333333-3333-3333-3333-333333333333', 'Plant 1 native tree', 'Verified planting in restoration zones.', 'Impact', 'Global', 500, NULL),
  ('33333333-3333-3333-3333-333333333333', 'Plant 5 native trees', 'Bundle. Best impact per point.', 'Impact', 'Global', 2200, NULL);
