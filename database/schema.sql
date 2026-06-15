-- ============================================================
--  Second Sync — Complete Database Schema
--  Run this ONCE in Supabase SQL Editor:
--  https://supabase.com/dashboard/project/swxrdjijzvzsrqrrvbdr/sql/new
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 0. CLEAN SLATE  (safe to re-run — drops everything first)
-- ─────────────────────────────────────────────────────────────
drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

drop table if exists public.contact_messages cascade;
drop table if exists public.activity_logs    cascade;
drop table if exists public.listings         cascade;
drop table if exists public.profiles         cascade;


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  email        text,
  full_name    text,
  avatar_url   text,
  phone        text,
  location     text,
  is_banned    boolean     not null default false,
  is_admin     boolean     not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select"
  on public.profiles for select using (true);

create policy "profiles_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 2. LISTINGS
-- ─────────────────────────────────────────────────────────────
create table public.listings (
  id             uuid        primary key default gen_random_uuid(),
  title          text        not null,
  title_np       text,
  category       text        not null,
  price          numeric     not null check (price > 0),
  original_price numeric     check (original_price is null or original_price > 0),
  condition      text        not null,
  location       text        not null,
  phone          text,
  description    text,
  images         text[]      not null default '{}',
  seller_id      uuid        references public.profiles(id) on delete cascade,
  seller_name    text,
  seller_email   text,
  is_active      boolean     not null default true,
  posted_at      timestamptz not null default now()
);

alter table public.listings enable row level security;

create policy "listings_select"
  on public.listings for select
  using (is_active = true);

create policy "listings_insert"
  on public.listings for insert
  with check (
    auth.uid() is not null
    and auth.uid() = seller_id
  );

create policy "listings_update_own"
  on public.listings for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "listings_delete_own"
  on public.listings for delete
  using (auth.uid() = seller_id);

create policy "listings_all_admin"
  on public.listings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 3. ACTIVITY LOGS
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
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "logs_insert"
  on public.activity_logs for insert
  with check (auth.uid() is not null);


-- ─────────────────────────────────────────────────────────────
-- 4. CONTACT MESSAGES
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

create policy "contact_select_admin"
  on public.contact_messages for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "contact_update_admin"
  on public.contact_messages for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );


-- ─────────────────────────────────────────────────────────────
-- 5. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, is_banned, is_admin)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    false,
    false
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
-- 6. INDEXES
-- ─────────────────────────────────────────────────────────────
create index listings_category_idx    on public.listings (category);
create index listings_posted_at_idx   on public.listings (posted_at desc);
create index listings_seller_id_idx   on public.listings (seller_id);
create index listings_is_active_idx   on public.listings (is_active);
create index logs_created_at_idx      on public.activity_logs (created_at desc);
create index logs_user_id_idx         on public.activity_logs (user_id);
create index messages_created_at_idx  on public.contact_messages (created_at desc);
create index messages_is_read_idx     on public.contact_messages (is_read);


-- ─────────────────────────────────────────────────────────────
-- 7. GRANTS
-- ─────────────────────────────────────────────────────────────
grant usage  on schema public to anon, authenticated;
grant select on public.listings      to anon;
grant select on public.profiles      to anon, authenticated;
grant insert, update, delete         on public.listings      to authenticated;
grant insert, update                 on public.profiles      to authenticated;
grant insert                         on public.activity_logs to authenticated;
grant select                         on public.activity_logs to authenticated;
grant insert                         on public.contact_messages to anon, authenticated;
grant select, update                 on public.contact_messages to authenticated;


-- ─────────────────────────────────────────────────────────────
-- DONE ✓
-- Tables: profiles, listings, activity_logs, contact_messages
-- Trigger: auto-creates profile on signup
-- RLS: enabled on all tables with proper policies
-- Indexes: added for performance
-- ─────────────────────────────────────────────────────────────
