-- Security hardening: enforce database-level access controls.
-- Apply this migration in Supabase before deploying the hardened frontend.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.premium_purchases enable row level security;
alter table public.vital_signs enable row level security;
alter table public.water_logs enable row level security;
alter table public.lab_events enable row level security;
alter table public.share_events enable row level security;
alter table public.referrals enable row level security;
alter table public.partner_labs enable row level security;

-- Admins can read operational data; normal users can only access their own records.
create policy "admins_read_profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_read_own_profile" on public.profiles for select using (auth.uid() = user_id);
create policy "users_update_own_profile" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admins_read_user_roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_read_own_role" on public.user_roles for select using (auth.uid() = user_id);

create policy "admins_read_purchases" on public.premium_purchases for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_read_own_purchases" on public.premium_purchases for select using (auth.uid() = user_id);

create policy "admins_read_vitals" on public.vital_signs for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_manage_own_vitals" on public.vital_signs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admins_read_water" on public.water_logs for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_manage_own_water" on public.water_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admins_read_lab_events" on public.lab_events for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_insert_own_lab_events" on public.lab_events for insert with check (auth.uid() = user_id);
create policy "users_read_own_lab_events" on public.lab_events for select using (auth.uid() = user_id);

create policy "admins_read_share_events" on public.share_events for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_insert_own_share_events" on public.share_events for insert with check (auth.uid() = user_id or user_id is null);
create policy "users_read_own_share_events" on public.share_events for select using (auth.uid() = user_id);

create policy "admins_read_referrals" on public.referrals for select using (public.has_role(auth.uid(), 'admin'));
create policy "users_insert_referrals" on public.referrals for insert with check (user_id is null or auth.uid() = user_id);
create policy "users_read_own_referrals" on public.referrals for select using (auth.uid() = user_id);

create policy "public_read_active_partner_labs" on public.partner_labs for select using (is_active = true);
create policy "admins_manage_partner_labs" on public.partner_labs for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- A Paystack reference must never be claimed by two users.
create unique index if not exists premium_purchases_paystack_reference_unique
  on public.premium_purchases (paystack_reference)
  where paystack_reference is not null;
