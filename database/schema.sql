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
--  (We handle verification ourselves via Gmail SMTP + 6-digit codes.
--   Keeping Supabase's own confirmation ON will cause rate limit errors.)
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONS
--    pgcrypto is required for crypt() and gen_salt() used in
--    password hashing. Safe to run if already enabled.
-- ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto with schema extensions;


-- ─────────────────────────────────────────────────────────────
-- 1. CLEAN SLATE
--    Drop everything in reverse dependency order.
--    Safe to re-run on an existing database.
-- ─────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created             on auth.users;
drop function if exists public.handle_new_user()         cascade;
drop function if exists public.create_user_account(text, text, text, text) cascade;
drop function if exists public.store_verification_code(text, text)         cascade;
drop function if exists public.verify_email_code(text, text)               cascade;

drop table if exists public.contact_messages   cascade;
drop table if exists public.activity_logs      cascade;
drop table if exists public.listings           cascade;
drop table if exists public.verification_codes cascade;
drop table if exists public.profiles           cascade;


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per auth.users entry.
--    is_verified  → set to true by verify_email_code()
--    is_admin     → manually set to true for admin accounts
--    is_banned    → set by admin to block access
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

-- Anyone can read profiles (needed for seller cards, admin panel)
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- Allow user inserts (own row) AND system/trigger inserts (auth.uid() is null)
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id OR auth.uid() IS NULL);

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any profile (ban/unban, promote)
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Admins can delete profiles
create policy "profiles_delete_admin"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 2. VERIFICATION CODES
--    Stores 6-digit email OTPs. All access is via
--    SECURITY DEFINER functions — no direct client reads/writes.
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

-- Block all direct client access; only SECURITY DEFINER functions can touch this table
create policy "verification_codes_no_direct_access"
  on public.verification_codes
  using (false);


-- ─────────────────────────────────────────────────────────────
-- 3. LISTINGS
--    is_active = false  → soft-deleted (hidden from public)
--    is_sold   = true   → shown with SOLD overlay, still visible
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

-- Public can read active listings
create policy "listings_select_active"
  on public.listings for select
  using (is_active = true);

-- Authenticated sellers can post listings
create policy "listings_insert_own"
  on public.listings for insert
  with check (
    auth.uid() is not null
    and auth.uid() = seller_id
  );

-- Sellers can update / soft-delete their own listings
create policy "listings_update_own"
  on public.listings for update
  using  (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = seller_id);

-- Admins have full access to all listings
create policy "listings_all_admin"
  on public.listings for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 4. ACTIVITY LOGS
--    Records user actions for the admin audit trail.
-- ─────────────────────────────────────────────────────────────
create table public.activity_logs (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references public.profiles(id) on delete set null,
  action     text        not null,
  detail     text,
  created_at timestamptz not null default now()
);

alter table public.activity_logs enable row level security;

-- Only admins can read logs
create policy "logs_select_admin"
  on public.activity_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Any authenticated user can write a log entry
create policy "logs_insert_authenticated"
  on public.activity_logs for insert
  with check (auth.uid() is not null);


-- ─────────────────────────────────────────────────────────────
-- 5. CONTACT MESSAGES
--    Submitted via the public /contact page.
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

-- Anyone (even unauthenticated) can submit a contact message
create policy "contact_insert_public"
  on public.contact_messages for insert
  with check (true);

-- Only admins can read / mark as read
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
-- 6. FUNCTION: create_user_account
--    Called from the server-side registerUser() fn in the app.
--    Inserts directly into auth.users using bcrypt so we never
--    touch Supabase's rate-limited signup HTTP endpoint.
--    Idempotent: silently does nothing if the email already exists.
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
  -- If user already exists, return their id (allows re-sending verification)
  select id into v_id from auth.users where email = p_email;

  if v_id is null then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      now(),                                    -- pre-confirm so GoTrue allows login (we gate on profiles.is_verified)
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
      now(),
      now()
    )
    returning id into v_id;

    -- Profile row is also created by the trigger below,
    -- but we insert here as well to avoid any race condition.
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

-- Callable with the anon key (needed during signup before user is authenticated)
grant execute on function public.create_user_account(text, text, text, text) to anon;


-- ─────────────────────────────────────────────────────────────
-- 7. FUNCTION + TRIGGER: handle_new_user
--    Auto-creates a profile row whenever any user is inserted
--    into auth.users (covers social logins, admin-created users, etc.)
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
--    Deletes any existing code for the email and inserts a fresh one.
--    Called server-side every time a verification email is sent.
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
  -- Replace any previous code for this email
  delete from public.verification_codes where email = p_email;

  insert into public.verification_codes (email, code, expires_at)
  values (p_email, p_code, now() + interval '15 minutes');
end;
$$;

grant execute on function public.store_verification_code(text, text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 9. FUNCTION: verify_email_code
--    Validates the OTP, marks the profile as verified, and
--    sets auth.users.email_confirmed_at so Supabase login works.
--    Returns true on success, false on wrong/expired code.
-- ─────────────────────────────────────────────────────────────
create or replace function public.verify_email_code(
  p_email text,
  p_code  text
)
returns boolean
language plpgsql
security definer
set search_path = public
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

  -- Confirm in auth.users so supabase.auth.signInWithPassword() works
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
  where email = p_email;

  return true;
end;
$$;

grant execute on function public.verify_email_code(text, text) to anon, authenticated;


-- ─────────────────────────────────────────────────────────────
-- 10. INDEXES
--     Speeds up the most common queries in the app.
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
--     RLS handles row-level access; these grants control which
--     Postgres roles can even attempt to touch the tables.
-- ─────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select                 on public.listings         to anon;
grant select                 on public.profiles         to anon;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update on public.profiles         to authenticated;
grant insert                 on public.activity_logs    to authenticated;
grant select                 on public.activity_logs    to authenticated;
grant insert                 on public.contact_messages to anon, authenticated;
grant select, update         on public.contact_messages to authenticated;


-- ─────────────────────────────────────────────────────────────
-- 12. ADMIN ACCOUNT
--     Creates the admin user directly in auth.users (same approach
--     as create_user_account) and marks their profile as admin.
--     Email:    teamkalpantrix@gmail.com
--     Password: MegaDilasha9090
-- ─────────────────────────────────────────────────────────────
do $$
declare
  v_admin_id uuid;
begin
  -- Only insert if admin doesn't already exist
  select id into v_admin_id
  from auth.users
  where email = 'teamkalpantrix@gmail.com';

  if v_admin_id is null then
    insert into auth.users (
      instance_id, id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'teamkalpantrix@gmail.com',
      crypt('MegaDilasha9090', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Second Sync Admin"}',
      now(), now()
    )
    returning id into v_admin_id;
  end if;

  -- Upsert profile with admin + verified flags
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
-- 13. FIX EXISTING USERS
--     Any user already created with email_confirmed_at = null
--     won't be able to log in. Set it for all existing users.
-- ─────────────────────────────────────────────────────────────
update auth.users
set email_confirmed_at = now()
where email_confirmed_at is null
  and email is not null
  and email != '';


-- ============================================================
-- SETUP COMPLETE
-- ─────────────────────────────────────────────────────────────
-- Tables created:
--   profiles           — user accounts + admin/verified flags
--   verification_codes — 6-digit OTPs (15 min TTL)
--   listings           — marketplace items (is_active / is_sold)
--   activity_logs      — admin audit trail
--   contact_messages   — public contact form submissions
--
-- Functions created:
--   create_user_account()     — bypasses Supabase auth rate limit
--   handle_new_user()         — trigger: auto-creates profile
--   store_verification_code() — stores/replaces OTP
--   verify_email_code()       — validates OTP, confirms user
--
-- Admin account:
--   Email:    teamkalpantrix@gmail.com
--   Password: MegaDilasha9090
--   Route:    /admin
-- ============================================================
