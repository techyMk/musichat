-- 0001_profiles.sql
-- M1.1 — user profiles, with row level security written alongside the table.
--
-- Run this in the Supabase SQL editor. It is kept in the repo so the schema
-- is version controlled even though we are not using the Supabase CLI yet.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
-- There is deliberately NO trigger creating a profile when an auth user is
-- created. The row is inserted when the user claims their username, which
-- makes "has this person finished onboarding?" answerable as "does a profile
-- row exist?" -- rather than needing a placeholder username nobody chose.

create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  username            text not null unique,
  display_name        text,
  avatar_url          text,
  bio                 text,
  genres              text[] not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- FR-P1: immutable after a 7 day grace period.
  username_changed_at timestamptz,

  constraint username_format
    check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint display_name_length
    check (display_name is null or char_length(display_name) between 1 and 40),
  constraint bio_length
    check (bio is null or char_length(bio) <= 150),
  constraint genres_count
    check (cardinality(genres) <= 10)
);

-- Prefix search for the M2 friend finder: username like 'pri%'
create index if not exists profiles_username_prefix
  on public.profiles (username text_pattern_ops);

-- ---------------------------------------------------------------------------
-- Keep updated_at honest
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- SEC-3: authorization lives in the database, so a client asking for someone
-- else's data is refused by Postgres itself rather than by API code that
-- might be missing a check.
--
-- Read access is OWN PROFILE ONLY for now. This is deliberately stricter than
-- the first draft of ARCHITECTURE.md §4, which allowed any authenticated user
-- to read every profile. That would have let anyone enumerate the entire user
-- table, which contradicts the PRD's "no stranger discovery" principle.
-- M2 adds a second policy allowing reads of accepted friends' profiles.

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "create own profile" on public.profiles;
create policy "create own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "delete own profile" on public.profiles;
create policy "delete own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Username availability
-- ---------------------------------------------------------------------------
-- Because reads are restricted to your own row, the signup screen cannot
-- check availability with a plain select. This function answers the single
-- yes/no question without exposing anything else about the table.

create or replace function public.is_username_available(candidate text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    candidate ~ '^[a-z0-9_]{3,20}$'
    and not exists (
      select 1 from public.profiles where username = candidate
    );
$$;

revoke all on function public.is_username_available(text) from public, anon;
grant execute on function public.is_username_available(text) to authenticated;
