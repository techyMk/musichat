-- 0003_friends.sql
-- M2 — friendships, blocks, invite codes, and the profile reads they unlock.
-- Run in the Supabase SQL editor after 0002.

-- ---------------------------------------------------------------------------
-- Blocks (defined first: friendship policies depend on it)
-- ---------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint no_self_block check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

drop policy if exists "read own blocks" on public.blocks;
create policy "read own blocks"
  on public.blocks for select to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "create own blocks" on public.blocks;
create policy "create own blocks"
  on public.blocks for insert to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "remove own blocks" on public.blocks;
create policy "remove own blocks"
  on public.blocks for delete to authenticated
  using (auth.uid() = blocker_id);

-- True if either person has blocked the other. SEC-10 requires blocking to be
-- bidirectional: a blocked user must not be able to reach you either.
create or replace function public.is_blocked_pair(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
-- user_a < user_b is enforced, so a pair can only ever have ONE row. Without
-- it, (arun, priya) and (priya, arun) could both exist and every query would
-- have to check both directions forever.

create table if not exists public.friendships (
  id           uuid primary key default gen_random_uuid(),
  user_a       uuid not null references auth.users (id) on delete cascade,
  user_b       uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending',
  requested_by uuid not null references auth.users (id) on delete cascade,
  note         text,
  created_at   timestamptz not null default now(),
  accepted_at  timestamptz,

  constraint canonical_order check (user_a < user_b),
  constraint unique_pair unique (user_a, user_b),
  constraint valid_status check (status in ('pending', 'accepted')),
  constraint note_length check (note is null or char_length(note) <= 140)
);

create index if not exists friendships_user_a on public.friendships (user_a);
create index if not exists friendships_user_b on public.friendships (user_b);

alter table public.friendships enable row level security;

drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- Requests go through request_friendship() below, which handles the canonical
-- ordering and the block check. Direct inserts are still policy-guarded.
drop policy if exists "create own friendships" on public.friendships;
create policy "create own friendships"
  on public.friendships for insert to authenticated
  with check (
    auth.uid() in (user_a, user_b)
    and auth.uid() = requested_by
    and status = 'pending'
    and not public.is_blocked_pair(user_a, user_b)
  );

-- Only the RECIPIENT can accept. Without this check the sender could accept
-- their own request and add themselves to anyone's friend list.
drop policy if exists "accept incoming friendships" on public.friendships;
create policy "accept incoming friendships"
  on public.friendships for update to authenticated
  using (auth.uid() in (user_a, user_b) and auth.uid() <> requested_by)
  with check (auth.uid() in (user_a, user_b) and status = 'accepted');

drop policy if exists "remove own friendships" on public.friendships;
create policy "remove own friendships"
  on public.friendships for delete to authenticated
  using (auth.uid() in (user_a, user_b));

/** True when these two are accepted friends and neither has blocked. */
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and user_a = least(a, b)
      and user_b = greatest(a, b)
  ) and not public.is_blocked_pair(a, b);
$$;

-- ---------------------------------------------------------------------------
-- Profiles: friends can now read each other
-- ---------------------------------------------------------------------------
-- Migration 0001 restricted reads to your own row. A chat header needs the
-- other person's name and photo, so accepted friends get a second policy.
-- Still no blanket read: the user table stays un-enumerable.

drop policy if exists "read friends profiles" on public.profiles;
create policy "read friends profiles"
  on public.profiles for select to authenticated
  using (public.are_friends(auth.uid(), id));

-- ---------------------------------------------------------------------------
-- Finding people
-- ---------------------------------------------------------------------------
-- Exact username only. Prefix search would let someone walk the whole table
-- one letter at a time, which is the enumeration we just closed.

create or replace function public.find_profile_by_username(candidate text)
returns table (id uuid, username text, display_name text, avatar_url text, bio text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.bio
  from public.profiles p
  where p.username = lower(trim(candidate))
    and p.id <> auth.uid()
    and not public.is_blocked_pair(auth.uid(), p.id)
  limit 1;
$$;

revoke all on function public.find_profile_by_username(text) from public, anon;
grant execute on function public.find_profile_by_username(text) to authenticated;

/** Sends a request in either direction without the caller worrying about
    canonical ordering. Returns the friendship id. */
create or replace function public.request_friendship(target uuid, message text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  existing public.friendships;
  new_id uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if me = target then raise exception 'cannot add yourself'; end if;
  if public.is_blocked_pair(me, target) then raise exception 'unavailable'; end if;

  select * into existing from public.friendships
   where user_a = least(me, target) and user_b = greatest(me, target);

  if found then
    -- They already asked us: treat this as acceptance rather than a duplicate.
    if existing.status = 'pending' and existing.requested_by = target then
      update public.friendships
         set status = 'accepted', accepted_at = now()
       where id = existing.id;
    end if;
    return existing.id;
  end if;

  insert into public.friendships (user_a, user_b, requested_by, note)
  values (least(me, target), greatest(me, target), me, message)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.request_friendship(uuid, text) from public, anon;
grant execute on function public.request_friendship(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Invite codes
-- ---------------------------------------------------------------------------
create table if not exists public.invites (
  code       text primary key,
  inviter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  uses       integer not null default 0
);

create index if not exists invites_inviter on public.invites (inviter_id);

alter table public.invites enable row level security;

drop policy if exists "read own invites" on public.invites;
create policy "read own invites"
  on public.invites for select to authenticated
  using (auth.uid() = inviter_id);

drop policy if exists "revoke own invites" on public.invites;
create policy "revoke own invites"
  on public.invites for update to authenticated
  using (auth.uid() = inviter_id);

/** The invite code a user shares, created on first request and reused after.
    One durable code per person, so a link already sitting in someone's
    WhatsApp history keeps working. */
create or replace function public.get_or_create_invite()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  found_code text;
  candidate text;
begin
  if me is null then raise exception 'not authenticated'; end if;

  select code into found_code from public.invites
   where inviter_id = me and revoked_at is null
   order by created_at desc limit 1;

  if found_code is not null then return found_code; end if;

  -- Base32-ish alphabet without look-alikes, so a code read aloud or typed
  -- from a screenshot does not turn into a different one.
  loop
    candidate := lower(
      translate(
        encode(gen_random_bytes(8), 'base32'),
        '018ILO=', 'abcdefg'
      )
    );
    candidate := substr(candidate, 1, 10);
    exit when not exists (select 1 from public.invites where code = candidate);
  end loop;

  insert into public.invites (code, inviter_id) values (candidate, me);
  return candidate;
end;
$$;

revoke all on function public.get_or_create_invite() from public, anon;
grant execute on function public.get_or_create_invite() to authenticated;

/** Public lookup for the invite landing page. Signed-out visitors need the
    inviter's name and face to decide whether to join, and nothing else. */
create or replace function public.peek_invite(invite_code text)
returns table (inviter_id uuid, username text, display_name text, avatar_url text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.display_name, p.avatar_url
  from public.invites i
  join public.profiles p on p.id = i.inviter_id
  where i.code = lower(trim(invite_code))
    and i.revoked_at is null
  limit 1;
$$;

revoke all on function public.peek_invite(text) from public;
grant execute on function public.peek_invite(text) to anon, authenticated;

/** Redeems a code: befriends the inviter, pre-accepted since they issued the
    invitation. The invitee should never land in a chat they cannot use. */
create or replace function public.redeem_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  inviter uuid;
  friendship_id uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;

  select inviter_id into inviter from public.invites
   where code = lower(trim(invite_code)) and revoked_at is null;

  if inviter is null then raise exception 'invalid invite'; end if;
  if inviter = me then raise exception 'cannot invite yourself'; end if;
  if public.is_blocked_pair(me, inviter) then raise exception 'unavailable'; end if;

  insert into public.friendships (user_a, user_b, requested_by, status, accepted_at)
  values (least(me, inviter), greatest(me, inviter), inviter, 'accepted', now())
  on conflict (user_a, user_b) do update
    set status = 'accepted',
        accepted_at = coalesce(public.friendships.accepted_at, now())
  returning id into friendship_id;

  update public.invites set uses = uses + 1 where code = lower(trim(invite_code));

  return friendship_id;
end;
$$;

revoke all on function public.redeem_invite(text) from public, anon;
grant execute on function public.redeem_invite(text) to authenticated;
