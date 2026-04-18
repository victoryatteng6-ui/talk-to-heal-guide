ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS premium_status boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_since timestamptz;

ALTER TABLE public.premium_purchases
  ADD COLUMN IF NOT EXISTS paystack_reference text UNIQUE;