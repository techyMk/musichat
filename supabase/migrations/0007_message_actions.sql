-- 0007_message_actions.sql
-- Replies, edits, and delivered/read state. Run after 0006.

-- ---------------------------------------------------------------------------
-- Replies and edits
-- ---------------------------------------------------------------------------
alter table public.messages
  add column if not exists reply_to_id uuid
    references public.messages (id) on delete set null,
  add column if not exists edited_at timestamptz;

-- on delete set null, not cascade: deleting a message must not take every
-- reply to it with it. The reply survives and loses its quote.

create index if not exists messages_reply_to
  on public.messages (reply_to_id)
  where reply_to_id is not null;

-- The existing "soft delete own messages" UPDATE policy already scopes writes
-- to sender_id = auth.uid(), which covers editing the body as well as setting
-- deleted_at. No new policy needed.

-- ---------------------------------------------------------------------------
-- Delivered and read
-- ---------------------------------------------------------------------------
-- Two timestamps per person per conversation rather than a row per message.
-- Per-message receipts would mean one write per participant per message —
-- for a two-person chat the same information fits in a watermark, and a
-- message is delivered/read when the partner's watermark passes its timestamp.
--
--   delivered — their device has the message, even unfocused
--   read      — the thread was actually open and in front of them

create table if not exists public.friendship_reads (
  friendship_id    uuid not null references public.friendships (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  last_delivered_at timestamptz not null default 'epoch',
  last_read_at     timestamptz not null default 'epoch',
  updated_at       timestamptz not null default now(),
  primary key (friendship_id, user_id)
);

alter table public.friendship_reads enable row level security;

-- Both participants can read the watermarks: seeing the partner's is the
-- entire point of a receipt.
drop policy if exists "read watermarks in own conversations" on public.friendship_reads;
create policy "read watermarks in own conversations"
  on public.friendship_reads for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.id = friendship_reads.friendship_id
        and auth.uid() in (f.user_a, f.user_b)
        and f.status = 'accepted'
    )
  );

-- But only your own may be written, or receipts could be forged.
drop policy if exists "write own watermark" on public.friendship_reads;
create policy "write own watermark"
  on public.friendship_reads for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own watermark" on public.friendship_reads;
create policy "update own watermark"
  on public.friendship_reads for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

/**
 * Moves a watermark forward. Never backward — a stale client returning from
 * the background must not un-read messages the user has already seen.
 */
create or replace function public.mark_conversation(
  target_friendship uuid,
  delivered boolean default true,
  read boolean default false
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

  if not exists (
    select 1 from public.friendships f
    where f.id = target_friendship
      and me in (f.user_a, f.user_b)
      and f.status = 'accepted'
  ) then
    raise exception 'not a participant';
  end if;

  insert into public.friendship_reads (friendship_id, user_id, last_delivered_at, last_read_at)
  values (
    target_friendship,
    me,
    case when delivered then now() else 'epoch' end,
    case when read then now() else 'epoch' end
  )
  on conflict (friendship_id, user_id) do update
    set last_delivered_at = greatest(
          public.friendship_reads.last_delivered_at,
          case when delivered then now() else 'epoch' end
        ),
        last_read_at = greatest(
          public.friendship_reads.last_read_at,
          case when read then now() else 'epoch' end
        ),
        updated_at = now();
end;
$$;

revoke all on function public.mark_conversation(uuid, boolean, boolean) from public, anon;
grant execute on function public.mark_conversation(uuid, boolean, boolean) to authenticated;

-- Live receipt updates.
do $$
begin
  alter publication supabase_realtime add table public.friendship_reads;
exception
  when duplicate_object then null;
end
$$;
