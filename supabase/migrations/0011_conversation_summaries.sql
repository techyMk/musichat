-- 0011_conversation_summaries.sql
-- Chat list data: last message, time, unread count, live session. Run after 0010.
--
-- One call instead of N+1: the list needs four facts per conversation, and
-- fetching them per row would be four queries per friend.

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
    where s.status = 'active'
  )
  select
    mine.id,
    mine.partner,
    p.username,
    p.display_name,
    p.avatar_url,
    -- A deleted message still occupies the slot; showing its old text would
    -- undo the deletion in the one place people actually look.
    case
      when last_msg.kind = 'track' then coalesce(last_msg.track_ref ->> 'title', 'a song')
      else last_msg.body
    end,
    last_msg.kind,
    last_msg.sender_id,
    last_msg.created_at,
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
