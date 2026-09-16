-- 0008_sessions.sql
-- M5 — shared listening sessions. Run after 0007.

-- ---------------------------------------------------------------------------
-- One clock
-- ---------------------------------------------------------------------------
-- Every device measures its offset against this, and every session anchor is
-- stamped with it. Using the database clock for the anchor but a web server's
-- clock for the handshake would introduce a drift nobody could see or debug.
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now() $$;

grant execute on function public.server_now() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
-- position_ms + position_updated_at is an ANCHOR, not a running counter. Where
-- the song should be right now is computed from the two (ARCHITECTURE.md §6.2).
-- That is what makes rejoining after a tunnel a calculation rather than an
-- event replay.

create table if not exists public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  friendship_id       uuid not null references public.friendships (id) on delete cascade,
  started_by          uuid not null references auth.users (id) on delete cascade,
  status              text not null default 'active',
  track_ref           jsonb,
  duration_ms         integer not null default 0,
  is_playing          boolean not null default false,
  position_ms         integer not null default 0,
  position_updated_at timestamptz not null default now(),
  -- Monotonic. Higher always wins, which is how two controllers resolve.
  seq                 bigint not null default 1,
  last_action_by      uuid references auth.users (id) on delete set null,
  last_action         text,
  created_at          timestamptz not null default now(),
  ended_at            timestamptz,

  constraint valid_status check (status in ('active', 'ended'))
);

-- At most one live session per conversation.
create unique index if not exists sessions_one_active_per_friendship
  on public.sessions (friendship_id)
  where status = 'active';

create index if not exists sessions_friendship
  on public.sessions (friendship_id, created_at desc);

alter table public.sessions enable row level security;

drop policy if exists "read sessions in own conversations" on public.sessions;
create policy "read sessions in own conversations"
  on public.sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.id = sessions.friendship_id
        and auth.uid() in (f.user_a, f.user_b)
        and f.status = 'accepted'
        and not public.is_blocked_pair(f.user_a, f.user_b)
    )
  );

-- Writes go through session_command() only. It is the single place that
-- computes the anchor and bumps seq; direct updates would let a client invent
-- a position.
revoke insert, update, delete on public.sessions from authenticated;

-- ---------------------------------------------------------------------------
-- Commands
-- ---------------------------------------------------------------------------
/**
 * Applies a playback command and returns the new state.
 *
 * Both participants have equal control (decision D3), so this is the conflict
 * resolution point: the anchor is recomputed from the CURRENT state at the
 * moment the command lands, and seq increments. A client holding older state
 * cannot overwrite newer — it simply loses.
 */
create or replace function public.session_command(
  target_friendship uuid,
  action            text,
  track             jsonb default null,
  seek_to_ms        integer default null
)
returns public.sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  me       uuid := auth.uid();
  s        public.sessions;
  at       timestamptz := now();
  elapsed  integer;
  current_pos integer;
begin
  if me is null then raise exception 'not authenticated'; end if;

  if not exists (
    select 1 from public.friendships f
    where f.id = target_friendship
      and me in (f.user_a, f.user_b)
      and f.status = 'accepted'
      and not public.is_blocked_pair(f.user_a, f.user_b)
  ) then
    raise exception 'not a participant';
  end if;

  select * into s from public.sessions
   where friendship_id = target_friendship and status = 'active'
   for update;

  -- Starting: close any other session this user has open first. One at a
  -- time, per PRD assumption A2.
  if not found then
    if action <> 'start' then raise exception 'no active session'; end if;

    update public.sessions
       set status = 'ended', ended_at = at
     where status = 'active'
       and friendship_id in (
         select f.id from public.friendships f
         where me in (f.user_a, f.user_b)
       );

    insert into public.sessions (
      friendship_id, started_by, track_ref, duration_ms,
      is_playing, position_ms, position_updated_at,
      last_action_by, last_action
    )
    values (
      target_friendship, me, track, coalesce((track->>'durationMs')::integer, 0),
      true, 0, at, me, 'start'
    )
    returning * into s;

    return s;
  end if;

  -- Where the song actually is at this instant, from the anchor.
  if s.is_playing then
    elapsed := greatest(0, (extract(epoch from (at - s.position_updated_at)) * 1000)::integer);
  else
    elapsed := 0;
  end if;
  current_pos := s.position_ms + elapsed;

  if s.duration_ms > 0 then
    current_pos := least(current_pos, s.duration_ms);
  end if;

  if action = 'play' then
    s.is_playing := true;
    s.position_ms := current_pos;

  elsif action = 'pause' then
    s.is_playing := false;
    s.position_ms := current_pos;

  elsif action = 'seek' then
    s.position_ms := greatest(0, coalesce(seek_to_ms, current_pos));
    if s.duration_ms > 0 then
      s.position_ms := least(s.position_ms, s.duration_ms);
    end if;

  elsif action = 'track' then
    if track is null then raise exception 'track required'; end if;
    s.track_ref := track;
    s.duration_ms := coalesce((track->>'durationMs')::integer, 0);
    s.position_ms := 0;
    s.is_playing := true;

  elsif action = 'end' then
    update public.sessions
       set status = 'ended', ended_at = at, is_playing = false,
           seq = sessions.seq + 1, last_action_by = me, last_action = 'end'
     where id = s.id
     returning * into s;
    return s;

  else
    raise exception 'unknown action %', action;
  end if;

  update public.sessions
     set track_ref = s.track_ref,
         duration_ms = s.duration_ms,
         is_playing = s.is_playing,
         position_ms = s.position_ms,
         position_updated_at = at,
         seq = sessions.seq + 1,
         last_action_by = me,
         last_action = action
   where id = s.id
   returning * into s;

  return s;
end;
$$;

revoke all on function public.session_command(uuid, text, jsonb, integer) from public, anon;
grant execute on function public.session_command(uuid, text, jsonb, integer) to authenticated;

-- Live session state for the other participant.
do $$
begin
  alter publication supabase_realtime add table public.sessions;
exception
  when duplicate_object then null;
end
$$;
