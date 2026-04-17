-- =========================================================
-- Phase 2: Auth-backed data model with RLS + roles
-- =========================================================

-- Roles enum + table (separate from profiles to prevent privilege escalation)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer role check (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Profiles
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  INSERT INTO public.profiles (user_id, display_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    new_code
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- Water logs
-- =========================================================
CREATE TABLE public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ml INTEGER NOT NULL CHECK (ml > 0 AND ml <= 5000),
  log_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_water_logs_user_date ON public.water_logs(user_id, log_date);

CREATE POLICY "Users manage own water logs"
  ON public.water_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all water logs"
  ON public.water_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Vital signs
-- =========================================================
CREATE TABLE public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature_c NUMERIC(4,1) CHECK (temperature_c IS NULL OR (temperature_c >= 25 AND temperature_c <= 45)),
  systolic INTEGER CHECK (systolic IS NULL OR (systolic >= 50 AND systolic <= 260)),
  diastolic INTEGER CHECK (diastolic IS NULL OR (diastolic >= 30 AND diastolic <= 200)),
  pulse INTEGER CHECK (pulse IS NULL OR (pulse >= 20 AND pulse <= 250)),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_vital_signs_user_time ON public.vital_signs(user_id, recorded_at DESC);

CREATE POLICY "Users manage own vital signs"
  ON public.vital_signs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all vital signs"
  ON public.vital_signs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Referrals (anonymous landing tracking)
-- =========================================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  landed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

CREATE POLICY "Anyone can record a referral landing"
  ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view their referral landings"
  ON public.referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.referral_code = referrals.referral_code AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "Admins can read all referrals"
  ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Premium purchases
-- =========================================================
CREATE TABLE public.premium_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (length(currency) = 3),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.premium_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases"
  ON public.premium_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own purchases"
  ON public.premium_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all purchases"
  ON public.premium_purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Share & lab events
-- =========================================================
CREATE TABLE public.share_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (length(channel) <= 40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a share"
  ON public.share_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read all shares"
  ON public.share_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lab_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('lab_booking','specialist_consult')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a lab event"
  ON public.lab_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read all lab events"
  ON public.lab_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
