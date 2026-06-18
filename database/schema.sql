-- ============================================================
--  Second Sync — Complete Database Setup
--  Project: https://swxrdjijzvzsrqrrvbdr.supabase.co
--
--  HOW TO RUN:
--  1. Go to: https://supabase.com/dashboard/project/swxrdjijzvzsrqrrvbdr/sql/new
--  2. Paste this entire file and click "Run"
--  3. Safe to re-run — drops everything cleanly first
--
--  IMPORTANT — do this in the Supabase dashboard BEFORE running:
--  Authentication → Providers → Email → turn OFF "Confirm email"
--  (We handle verification ourselves via Gmail SMTP + 6-digit codes.)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions;


-- ─────────────────────────────────────────────────────────────
-- 1. CLEAN SLATE
--    Drop everything in reverse dependency order.
-- ─────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created                       on auth.users;
drop function if exists public.handle_new_user()                   cascade;
drop function if exists public.create_user_account(text,text,text,text) cascade;
drop function if exists public.store_verification_code(text, text) cascade;
drop function if exists public.verify_email_code(text, text)       cascade;
drop function if exists public.confirm_order_payment(uuid, uuid)          cascade;
drop function if exists public.cancel_order_payment(uuid, uuid)           cascade;
drop function if exists public.confirm_and_prepare_delivery(uuid, uuid, text) cascade;
drop function if exists public.verify_delivery_otp(uuid, uuid, text)     cascade;

drop table if exists public.contact_messages   cascade;
drop table if exists public.activity_logs      cascade;
drop table if exists public.orders             cascade;
drop table if exists public.listings           cascade;
drop table if exists public.verification_codes cascade;
drop table if exists public.profiles           cascade;


-- ─────────────────────────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        unique,
  full_name   text,
  avatar_url  text,
  phone       text,
  location    text,
  is_verified boolean     not null default false,
  is_admin    boolean     not null default false,
  is_banned   boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id OR auth.uid() IS NULL);

create policy "profiles_update_own"
  on public.profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "profiles_delete_admin"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. VERIFICATION CODES
-- ─────────────────────────────────────────────────────────────
create table public.verification_codes (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  code       text        not null,
  expires_at timestamptz not null,
  used       boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.verification_codes enable row level security;

create policy "verification_codes_no_direct_access"
  on public.verification_codes
  using (false);


-- ─────────────────────────────────────────────────────────────
-- 4. LISTINGS
-- ─────────────────────────────────────────────────────────────
create table public.listings (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  title_np       text,
  category       text        not null,
  price          numeric     not null check (price > 0),
  original_price numeric              check (original_price is null or original_price > 0),
  condition      text        not null,
  location       text        not null,
  phone          text,
  description    text,
  images         text[]      not null default '{}',
  seller_id      uuid        references public.profiles(id) on delete cascade,
  seller_name    text,
  seller_email   text,
  is_active      boolean     not null default true,
  is_sold        boolean     not null default false,
  posted_at      timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "listings_select_active"
  on public.listings for select
  using (is_active = true);

create policy "listings_insert_own"
  on public.listings for insert
  with check (auth.uid() is not null and auth.uid() = seller_id);

create policy "listings_update_own"
  on public.listings for update
  using  (auth.uid() = seller_id);

create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = seller_id);

create policy "listings_all_admin"
  on public.listings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 5. ACTIVITY LOGS
-- ─────────────────────────────────────────────────────────────
create table public.activity_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.profiles(id) on delete set null,
  action     text        not null,
  detail     text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

create policy "logs_select_admin"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "logs_insert_authenticated"
  on public.activity_logs for insert
  with check (auth.uid() is not null);


-- ─────────────────────────────────────────────────────────────
-- 6. CONTACT MESSAGES
-- ─────────────────────────────────────────────────────────────
create table public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  subject    text,
  message    text        not null,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_insert_public"
  on public.contact_messages for insert
  with check (true);

-- Buyers can read their own orders (matched by email)
create policy "contact_select_own"
  on public.contact_messages for select
  using (email = (select email from public.profiles where id = auth.uid()));

create policy "contact_select_admin"
  on public.contact_messages for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

create policy "contact_update_admin"
  on public.contact_messages for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 6b. ORDERS TABLE (dedicated — replaces contact_messages for orders)
-- ─────────────────────────────────────────────────────────────
create table public.orders (
  id             uuid        primary key default gen_random_uuid(),
  listing_id     uuid        references public.listings(id) on delete set null,
  buyer_id       uuid        references public.profiles(id) on delete set null,
  seller_id      uuid        references public.profiles(id) on delete set null,
  buyer_name     text        not null,
  buyer_phone    text        not null,
  buyer_email    text        not null,
  listing_title  text        not null,
  listing_price  numeric     not null,
  delivery       text        not null default 'pickup',
  delivery_cost  numeric     not null default 0,
  delivery_address text,
  payment        text        not null default 'cash',
  note           text,
  total          numeric     not null,
  status         text        not null default 'pending',
  -- pending → confirmed → completed | cancelled
  seller_notified boolean    not null default false,
  delivery_otp   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Buyers can insert orders
create policy "orders_insert_buyer"
  on public.orders for insert
  with check (auth.uid() is not null and auth.uid() = buyer_id);

-- Buyers can read their own orders
create policy "orders_select_buyer"
  on public.orders for select
  using (auth.uid() = buyer_id);

-- Sellers can read orders for their listings
create policy "orders_select_seller"
  on public.orders for select
  using (auth.uid() = seller_id);

-- Admins have full access
create policy "orders_all_admin"
  on public.orders for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Buyers can cancel their own pending orders
create policy "orders_update_buyer_cancel"
  on public.orders for update
  using  (auth.uid() = buyer_id and status = 'pending')
  with check (status = 'cancelled');

grant select, insert, update on public.orders to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 6c. PAYMENT RPCs (security definer — run as postgres, bypass RLS)
-- ─────────────────────────────────────────────────────────────

-- confirm_order_payment: marks order as 'confirmed' and listing as sold.
-- Called from the payment-success callback page after gateway verification.
-- Idempotent: calling it on an already-confirmed order is a no-op.
create or replace function public.confirm_order_payment(
  p_order_id  uuid,
  p_buyer_id  uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_status     text;
begin
  select listing_id, status
  into   v_listing_id, v_status
  from   orders
  where  id = p_order_id and buyer_id = p_buyer_id;

  if not found then
    raise exception 'Order not found';
  end if;

  -- Already confirmed / completed — idempotent, no error
  if v_status in ('confirmed', 'completed') then
    return;
  end if;

  if v_status != 'pending' then
    raise exception 'Order cannot be confirmed (status: %)', v_status;
  end if;

  update orders  set status = 'confirmed', updated_at = now() where id = p_order_id;

  if v_listing_id is not null then
    update listings set is_sold = true where id = v_listing_id;
  end if;
end;
$$;

-- cancel_order_payment: marks a pending order as 'cancelled'.
-- Called when the buyer aborts the payment gateway flow.
create or replace function public.cancel_order_payment(
  p_order_id uuid,
  p_buyer_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set    status = 'cancelled', updated_at = now()
  where  id = p_order_id
    and  buyer_id = p_buyer_id
    and  status   = 'pending';
end;
$$;

grant execute on function public.confirm_order_payment(uuid, uuid) to authenticated;
grant execute on function public.cancel_order_payment(uuid, uuid)  to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 6d. DELIVERY OTP RPCs
-- ─────────────────────────────────────────────────────────────

-- confirm_and_prepare_delivery: stores the delivery OTP on a confirmed order
-- and returns seller + order info for the notification email.
-- Called from a server function using the anon key, so granted to anon.
create or replace function public.confirm_and_prepare_delivery(
  p_order_id uuid,
  p_buyer_id uuid,
  p_otp      text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order  record;
  v_seller record;
begin
  select * into v_order
  from orders
  where id = p_order_id and buyer_id = p_buyer_id and status = 'confirmed';

  if not found then
    raise exception 'Order not found or not yet confirmed';
  end if;

  update orders
  set delivery_otp = p_otp, updated_at = now()
  where id = p_order_id;

  select email, full_name into v_seller
  from profiles where id = v_order.seller_id;

  return jsonb_build_object(
    'seller_email',     v_seller.email,
    'seller_name',      v_seller.full_name,
    'buyer_name',       v_order.buyer_name,
    'buyer_phone',      v_order.buyer_phone,
    'buyer_email',      v_order.buyer_email,
    'listing_title',    v_order.listing_title,
    'total',            v_order.total,
    'delivery',         v_order.delivery,
    'delivery_address', v_order.delivery_address,
    'payment',          v_order.payment,
    'note',             v_order.note
  );
end;
$$;

-- verify_delivery_otp: called by the seller to confirm delivery.
-- Validates OTP, marks order 'completed', removes the listing from browse.
create or replace function public.verify_delivery_otp(
  p_order_id  uuid,
  p_seller_id uuid,
  p_otp       text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
begin
  if not exists (
    select 1 from orders
    where id           = p_order_id
      and seller_id    = p_seller_id
      and status       = 'confirmed'
      and delivery_otp = p_otp
  ) then
    raise exception 'Invalid delivery code or order not eligible';
  end if;

  select listing_id into v_listing_id from orders where id = p_order_id;

  update orders
  set status = 'completed', delivery_otp = null, updated_at = now()
  where id = p_order_id;

  if v_listing_id is not null then
    update listings set is_sold = true, is_active = false where id = v_listing_id;
  end if;
end;
$$;

grant execute on function public.confirm_and_prepare_delivery(uuid, uuid, text) to anon, authenticated;
grant execute on function public.verify_delivery_otp(uuid, uuid, text)          to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 7. FUNCTION: create_user_account
--    Inserts directly into auth.users with ALL fields GoTrue
--    requires so signInWithPassword() never returns a 500.
--    Completely bypasses Supabase HTTP signup — no rate limits,
--    no "Confirm email" setting conflicts.
--    Idempotent: if email already exists, just returns their id.
-- ─────────────────────────────────────────────────────────────
create or replace function public.create_user_account(
  p_email     text,
  p_password  text,
  p_full_name text,
  p_phone     text
)
returns uuid
language plpgsql
security definer
set search_path = extensions, public, auth
as $$
declare
  v_id uuid;
begin
  -- If user already exists, return their id (resend OTP path)
  select id into v_id from auth.users where email = p_email;

  if v_id is null then
    v_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      -- These fields must be non-null strings or GoTrue returns 500 on login
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      -- Metadata
      raw_app_meta_data,
      raw_user_meta_data,
      -- SSO flag required by newer GoTrue versions
      is_sso_user,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_id,
      'authenticated',
      'authenticated',
      p_email,
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(),          -- pre-confirmed; we gate access via profiles.is_verified
      '',             -- confirmation_token
      '',             -- recovery_token
      '',             -- email_change_token_new
      '',             -- email_change
      '',             -- phone_change
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
      false,          -- is_sso_user
      now(),
      now()
    );

    -- Profile row (trigger also does this, belt-and-suspenders)
    insert into public.profiles (
      id, email, full_name, phone,
      is_verified, is_admin, is_banned
    )
    values (
      v_id, p_email, p_full_name, p_phone,
      false, false, false
    )
    on conflict (id) do nothing;
  end if;

  return v_id;
end;
$$;

grant execute on function public.create_user_account(text, text, text, text) to anon;


-- ─────────────────────────────────────────────────────────────
-- 8. FUNCTION + TRIGGER: handle_new_user
--    Auto-creates a profile row for every new auth.users insert.
--    This fires for supabase.auth.signUp() calls from the app.
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, phone,
    is_verified, is_admin, is_banned
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'phone',
    false, false, false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 8. FUNCTION: store_verification_code
--    Replaces any existing OTP for the email with a fresh one.
-- ─────────────────────────────────────────────────────────────
create or replace function public.store_verification_code(
  p_email text,
  p_code  text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.verification_codes where email = p_email;
  insert into public.verification_codes (email, code, expires_at)
  values (p_email, p_code, now() + interval '15 minutes');
end;
$$;

grant execute on function public.store_verification_code(text, text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 9. FUNCTION: verify_email_code
--    Validates OTP, marks profile as verified, confirms auth.users
--    so supabase.auth.signInWithPassword() works immediately.
-- ─────────────────────────────────────────────────────────────
create or replace function public.verify_email_code(
  p_email text,
  p_code  text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_rec record;
begin
  select * into v_rec
  from public.verification_codes
  where email      = p_email
    and code       = p_code
    and used       = false
    and expires_at > now()
  limit 1;

  if not found then
    return false;
  end if;

  -- Mark code as used (one-time)
  update public.verification_codes
  set used = true
  where id = v_rec.id;

  -- Mark our own is_verified flag
  update public.profiles
  set is_verified = true
  where email = p_email;

  -- Confirm in auth.users so signInWithPassword works right away
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    -- Fill in missing fields that GoTrue requires (fixes 500 on login for
    -- users created via the old SQL RPC path)
    confirmation_token  = coalesce(confirmation_token, ''),
    recovery_token      = coalesce(recovery_token, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    is_sso_user         = coalesce(is_sso_user, false),
    updated_at          = now()
  where email = p_email;

  return true;
end;
$$;

grant execute on function public.verify_email_code(text, text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 10. INDEXES
-- ─────────────────────────────────────────────────────────────
create index listings_category_idx       on public.listings (category);
create index listings_posted_at_idx      on public.listings (posted_at desc);
create index listings_seller_id_idx      on public.listings (seller_id);
create index listings_is_active_idx      on public.listings (is_active);
create index listings_is_sold_idx        on public.listings (is_sold);
create index profiles_email_idx          on public.profiles (email);
create index logs_created_at_idx         on public.activity_logs (created_at desc);
create index logs_user_id_idx            on public.activity_logs (user_id);
create index messages_created_at_idx     on public.contact_messages (created_at desc);
create index messages_is_read_idx        on public.contact_messages (is_read);
create index ver_codes_email_idx         on public.verification_codes (email);
create index ver_codes_expires_used_idx  on public.verification_codes (email, used, expires_at);


-- ─────────────────────────────────────────────────────────────
-- 11. TABLE-LEVEL GRANTS
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select                              on public.listings         to anon;
grant select                              on public.profiles         to anon;
grant select, insert, update, delete      on public.listings         to authenticated;
grant select, insert, update              on public.profiles         to authenticated;
grant insert                              on public.activity_logs    to authenticated;
grant select                              on public.activity_logs    to authenticated;
grant insert                              on public.contact_messages to anon, authenticated;
grant select, update                      on public.contact_messages to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 12. ADMIN ACCOUNT
--     Email:    teamkalpantrix@gmail.com
--     Password: MegaDilasha9090
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id
  from auth.users
  where email = 'teamkalpantrix@gmail.com';

  if v_admin_id is null then
    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new,
      is_sso_user,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'teamkalpantrix@gmail.com',
      extensions.crypt('MegaDilasha9090', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Second Sync Admin"}',
      '', '', '', false,
      now(), now()
    )
    returning id into v_admin_id;
  end if;

  insert into public.profiles (
    id, email, full_name,
    is_verified, is_admin, is_banned
  )
  values (
    v_admin_id,
    'teamkalpantrix@gmail.com',
    'Second Sync Admin',
    true, true, false
  )
  on conflict (id) do update
    set is_admin    = true,
        is_verified = true,
        is_banned   = false,
        full_name   = 'Second Sync Admin';
end;
$$;


-- ─────────────────────────────────────────────────────────────
-- 13. FIX EXISTING BROKEN USERS
--     Users created via the old SQL RPC may be missing required
--     GoTrue fields, causing 500 errors on login. This patches
--     all existing users in one shot.
-- ─────────────────────────────────────────────────────────────
update auth.users
set
  email_confirmed_at     = coalesce(email_confirmed_at, now()),
  confirmation_token     = coalesce(confirmation_token, ''),
  recovery_token         = coalesce(recovery_token, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  is_sso_user            = coalesce(is_sso_user, false),
  updated_at             = now()
where email is not null
  and email != '';


-- ============================================================
-- SETUP COMPLETE
-- ─────────────────────────────────────────────────────────────
-- Tables:     profiles, verification_codes, listings,
--             activity_logs, contact_messages
--
-- Functions:  handle_new_user()         — trigger on auth.users insert
--             store_verification_code() — stores/replaces OTP
--             verify_email_code()       — validates OTP, confirms user
--
-- NOTE: create_user_account() has been REMOVED.
--       Registration now uses supabase.auth.signUp() which creates
--       proper GoTrue-compatible records. The old SQL-direct approach
--       was causing 500 errors on login due to missing GoTrue fields.
--
-- Admin account:
--   Email:    teamkalpantrix@gmail.com
--   Password: MegaDilasha9090
--   Route:    /admin
-- ============================================================
