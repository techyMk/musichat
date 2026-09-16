-- 0012_settings.sql
-- Privacy settings. Run after 0011.

create table if not exists public.user_settings (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  show_presence  boolean not null default true,
  show_vibing    boolean not null default true,
  read_receipts  boolean not null default true,
  request_policy text not null default 'anyone',
  updated_at     timestamptz not null default now(),

  constraint valid_request_policy check (request_policy in ('anyone', 'link_only'))
);

alter table public.user_settings enable row level security;

drop policy if exists "own settings" on public.user_settings;
create policy "own settings"
  on public.user_settings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

/**
 * Settings with defaults applied.
 *
 * A row is only written when something is changed, so most accounts have none.
 * Returning defaults here means no caller has to know that.
 */
create or replace function public.my_settings()
returns table (
  show_presence boolean,
  show_vibing boolean,
  read_receipts boolean,
  request_policy text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(s.show_presence, true),
    coalesce(s.show_vibing, true),
    coalesce(s.read_receipts, true),
    coalesce(s.request_policy, 'anyone')
  from (select auth.uid() as uid) me
  left join public.user_settings s on s.user_id = me.uid;
$$;

grant execute on function public.my_settings() to authenticated;

create or replace function public.save_settings(
  p_show_presence  boolean,
  p_show_vibing    boolean,
  p_read_receipts  boolean,
  p_request_policy text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_request_policy not in ('anyone', 'link_only') then
    raise exception 'invalid request policy';
  end if;

  insert into public.user_settings (
    user_id, show_presence, show_vibing, read_receipts, request_policy, updated_at
  )
  values (me, p_show_presence, p_show_vibing, p_read_receipts, p_request_policy, now())
  on conflict (user_id) do update
    set show_presence = excluded.show_presence,
        show_vibing = excluded.show_vibing,
        read_receipts = excluded.read_receipts,
        request_policy = excluded.request_policy,
        updated_at = now();
end;
$$;

revoke all on function public.save_settings(boolean, boolean, boolean, text) from public, anon;
grant execute on function public.save_settings(boolean, boolean, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- "Only people with my link can add me"
-- ---------------------------------------------------------------------------
-- Username search now honours the setting. The invite path deliberately still
-- works — the point of link_only is that YOU choose who gets the link, not
-- that nobody can ever reach you.
create or replace function public.find_profile_by_username(candidate text)
returns table (id uuid, username text, display_name text, avatar_url text, bio text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.bio
  from public.profiles p
  left join public.user_settings s on s.user_id = p.id
  where p.username = lower(trim(candidate))
    and p.id <> auth.uid()
    and not public.is_blocked_pair(auth.uid(), p.id)
    and coalesce(s.request_policy, 'anyone') = 'anyone'
  limit 1;
$$;

revoke all on function public.find_profile_by_username(text) from public, anon;
grant execute on function public.find_profile_by_username(text) to authenticated;

-- Vibing visibility, honoured by the chat list.
create or replace function public.conversation_summaries()
returns table (
  friendship_id     uuid,
  partner_id        uuid,
  username          text,
  display_name      text,
  avatar_url        text,
  last_body         text,
  last_kind         text,
  last_sender_id    uuid,
  last_at           timestamptz,
  unread_count      integer,
  is_vibing         boolean,
  vibing_track      text
)
language sql
security definer
set search_path = public
stable
as $$
  with mine as (
    select f.id,
           case when f.user_a = auth.uid() then f.user_b else f.user_a end as partner
    from public.friendships f
    where auth.uid() in (f.user_a, f.user_b)
      and f.status = 'accepted'
      and not public.is_blocked_pair(f.user_a, f.user_b)
  ),
  last_msg as (
    select distinct on (m.friendship_id)
           m.friendship_id, m.body, m.kind, m.sender_id, m.created_at, m.track_ref
    from public.messages m
    join mine on mine.id = m.friendship_id
    order by m.friendship_id, m.created_at desc
  ),
  my_read as (
    select r.friendship_id, r.last_read_at
    from public.friendship_reads r
    where r.user_id = auth.uid()
  ),
  unread as (
    select m.friendship_id, count(*)::integer as n
    from public.messages m
    join mine on mine.id = m.friendship_id
    left join my_read on my_read.friendship_id = m.friendship_id
    where m.sender_id <> auth.uid()
      and m.deleted_at is null
      and m.created_at > coalesce(my_read.last_read_at, 'epoch')
    group by m.friendship_id
  ),
  live as (
    select s.friendship_id, s.track_ref ->> 'title' as title
    from public.sessions s
    join mine on mine.id = s.friendship_id
    left join public.user_settings ps on ps.user_id = mine.partner
    where s.status = 'active'
      -- Their setting, not ours: hiding your vibing status should hide it
      -- from the people looking at you.
      and coalesce(ps.show_vibing, true)
  )
  select
    mine.id, mine.partner, p.username, p.display_name, p.avatar_url,
    case
      when last_msg.kind = 'track' then coalesce(last_msg.track_ref ->> 'title', 'a song')
      else last_msg.body
    end,
    last_msg.kind, last_msg.sender_id, last_msg.created_at,
    coalesce(unread.n, 0),
    live.friendship_id is not null,
    live.title
  from mine
  join public.profiles p on p.id = mine.partner
  left join last_msg on last_msg.friendship_id = mine.id
  left join unread   on unread.friendship_id = mine.id
  left join live     on live.friendship_id = mine.id
  order by coalesce(last_msg.created_at, 'epoch') desc;
$$;

revoke all on function public.conversation_summaries() from public, anon;
grant execute on function public.conversation_summaries() to authenticated;
