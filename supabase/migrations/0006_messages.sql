-- 0006_messages.sql
-- M3 — conversation messages. Run after 0005.

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  friendship_id uuid not null references public.friendships (id) on delete cascade,
  sender_id     uuid not null references auth.users (id) on delete cascade,
  kind          text not null default 'text',
  body          text,
  -- A snapshot of the track rather than a foreign key. Providers change and
  -- remove things; a song card in a year-old conversation should still render
  -- (ARCHITECTURE.md §4).
  track_ref     jsonb,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  constraint valid_kind check (kind in ('text', 'system', 'track')),
  constraint body_length check (body is null or char_length(body) <= 4000),
  constraint text_needs_body check (kind <> 'text' or coalesce(body, '') <> '')
);

-- Newest-first paging within one conversation.
create index if not exists messages_thread
  on public.messages (friendship_id, created_at desc);

alter table public.messages enable row level security;

-- SEC-4: membership of an ACCEPTED friendship is re-checked per request, and
-- a block in either direction removes access immediately. are_friends() covers
-- both, so a blocked user's insert is refused by Postgres rather than by UI.

drop policy if exists "read messages in own conversations" on public.messages;
create policy "read messages in own conversations"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.id = messages.friendship_id
        and auth.uid() in (f.user_a, f.user_b)
        and f.status = 'accepted'
        and not public.is_blocked_pair(f.user_a, f.user_b)
    )
  );

-- You may only send as yourself, and only into a conversation you are in.
drop policy if exists "send messages as self" on public.messages;
create policy "send messages as self"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.friendships f
      where f.id = messages.friendship_id
        and auth.uid() in (f.user_a, f.user_b)
        and f.status = 'accepted'
        and not public.is_blocked_pair(f.user_a, f.user_b)
    )
  );

-- Deleting is a tombstone, so the other side sees that something was removed
-- rather than history silently changing (FR-C9). Only your own messages.
drop policy if exists "soft delete own messages" on public.messages;
create policy "soft delete own messages"
  on public.messages for update
  to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Realtime delivery. Without this the table produces no change events and the
-- thread only updates on refresh.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end
$$;
