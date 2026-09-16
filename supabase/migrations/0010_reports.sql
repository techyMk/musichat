-- 0010_reports.sql
-- Reporting and account deletion. Run after 0009.
--
-- Required before user uploads can go public: an intermediary needs a route
-- for someone to say "that shouldn't be there" and a record that it was said.

create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  reporter_id    uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid references auth.users (id) on delete set null,
  message_id     uuid references public.messages (id) on delete set null,
  upload_id      uuid references public.uploads (id) on delete set null,
  reason         text not null,
  detail         text,
  status         text not null default 'open',
  created_at     timestamptz not null default now(),

  constraint valid_reason check (
    reason in ('spam', 'harassment', 'sexual', 'copyright', 'other')
  ),
  constraint valid_status check (status in ('open', 'reviewing', 'closed')),
  constraint detail_length check (detail is null or char_length(detail) <= 1000)
);

create index if not exists reports_status on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- Insert-only for users. Nobody can read the queue — not even their own
-- reports — because a reporter seeing status changes would leak moderation
-- activity about other people.
drop policy if exists "file reports" on public.reports;
create policy "file reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Blocking, as one call
-- ---------------------------------------------------------------------------
/**
 * Blocks someone and tears down everything connecting you: the friendship, and
 * any live session. SEC-10 requires blocking to take effect immediately and in
 * both directions — leaving a session running would keep audio flowing between
 * two people who just stopped being connected.
 */
create or replace function public.block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if me = target then raise exception 'cannot block yourself'; end if;

  insert into public.blocks (blocker_id, blocked_id)
  values (me, target)
  on conflict do nothing;

  update public.sessions
     set status = 'ended', ended_at = now()
   where status = 'active'
     and friendship_id in (
       select f.id from public.friendships f
       where f.user_a = least(me, target) and f.user_b = greatest(me, target)
     );

  delete from public.friendships
   where user_a = least(me, target) and user_b = greatest(me, target);
end;
$$;

revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

/** The blocked list, with enough profile to recognise who it is. */
create or replace function public.my_blocks()
returns table (blocked_id uuid, username text, display_name text, avatar_url text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select b.blocked_id, p.username, p.display_name, p.avatar_url, b.created_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc;
$$;

revoke all on function public.my_blocks() from public, anon;
grant execute on function public.my_blocks() to authenticated;

/** Unblocking restores nothing — the friendship stays deleted, deliberately. */
create or replace function public.unblock_user(target uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.blocks
   where blocker_id = auth.uid() and blocked_id = target;
$$;

revoke all on function public.unblock_user(uuid) from public, anon;
grant execute on function public.unblock_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Account deletion
-- ---------------------------------------------------------------------------
/**
 * Erases everything this account owns (SEC-7).
 *
 * Cascades from auth.users would handle most of it, but deleting an auth user
 * requires service-role privileges the browser does not have. This clears the
 * user's own data immediately so the account is functionally gone the moment
 * they confirm; the auth row is removed by the API route afterwards.
 */
create or replace function public.delete_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;

  update public.sessions
     set status = 'ended', ended_at = now()
   where status = 'active'
     and friendship_id in (
       select f.id from public.friendships f where me in (f.user_a, f.user_b)
     );

  delete from public.messages where sender_id = me;
  delete from public.friendships where me in (user_a, user_b);
  delete from public.blocks where blocker_id = me or blocked_id = me;
  delete from public.invites where inviter_id = me;
  delete from public.uploads where owner_id = me;
  delete from public.profiles where id = me;
end;
$$;

revoke all on function public.delete_my_data() from public, anon;
grant execute on function public.delete_my_data() to authenticated;
