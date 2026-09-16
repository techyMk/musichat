-- 0009_uploads.sql
-- Your own tracks. Run after 0008.
--
-- This is the feature that turns MusiChat into an intermediary hosting user
-- content, so the constraints are deliberate:
--
--   * the bucket is PRIVATE — playback uses short-lived signed URLs, so a
--     leaked path is useless minutes later
--   * no search, no browse, no discovery. Only the owner and people they are
--     already friends with can reach a file.
--   * a per-user quota, enforced in the database rather than trusted to the UI
--   * removed_at gives a takedown a single switch that hides a file from
--     everyone without destroying the record of it

create table if not exists public.uploads (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  storage_path  text not null unique,
  title         text not null,
  artist        text,
  duration_ms   integer not null default 0,
  size_bytes    bigint not null default 0,
  mime_type     text,
  created_at    timestamptz not null default now(),
  removed_at    timestamptz,

  constraint title_length check (char_length(title) between 1 and 200),
  constraint artist_length check (artist is null or char_length(artist) <= 200)
);

create index if not exists uploads_owner on public.uploads (owner_id, created_at desc);

alter table public.uploads enable row level security;

-- Owner, or someone already an accepted friend. There is no stranger
-- discovery in this product, so "friends" is a set the owner built by hand.
drop policy if exists "read own and friends uploads" on public.uploads;
create policy "read own and friends uploads"
  on public.uploads for select
  to authenticated
  using (
    removed_at is null
    and (owner_id = auth.uid() or public.are_friends(auth.uid(), owner_id))
  );

drop policy if exists "create own uploads" on public.uploads;
create policy "create own uploads"
  on public.uploads for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "delete own uploads" on public.uploads;
create policy "delete own uploads"
  on public.uploads for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Quota
-- ---------------------------------------------------------------------------
-- Enforced here rather than in the client, which cannot be trusted to count.
create or replace function public.my_upload_usage()
returns table (file_count integer, total_bytes bigint)
language sql
security definer
set search_path = public
stable
as $$
  select count(*)::integer, coalesce(sum(size_bytes), 0)::bigint
  from public.uploads
  where owner_id = auth.uid() and removed_at is null;
$$;

grant execute on function public.my_upload_usage() to authenticated;

create or replace function public.enforce_upload_quota()
returns trigger
language plpgsql
as $$
declare
  files integer;
  bytes bigint;
begin
  select count(*), coalesce(sum(size_bytes), 0)
    into files, bytes
    from public.uploads
   where owner_id = new.owner_id and removed_at is null;

  if files >= 25 then
    raise exception 'upload limit reached: 25 tracks';
  end if;

  if bytes + new.size_bytes > 200 * 1024 * 1024 then
    raise exception 'storage limit reached: 200 MB';
  end if;

  return new;
end;
$$;

drop trigger if exists uploads_quota on public.uploads;
create trigger uploads_quota
  before insert on public.uploads
  for each row execute function public.enforce_upload_quota();

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tracks',
  'tracks',
  false,                                   -- private: signed URLs only
  20971520,                                -- 20 MB per file
  array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/x-m4a']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Paths are {owner_id}/{filename}, and the insert policy enforces that, so the
-- folder can be trusted as an owner id everywhere below.

drop policy if exists "read own or friends tracks" on storage.objects;
create policy "read own or friends tracks"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'tracks'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.are_friends(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  );

drop policy if exists "upload own tracks" on storage.objects;
create policy "upload own tracks"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own tracks" on storage.objects;
create policy "delete own tracks"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tracks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
