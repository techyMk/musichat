-- 0002_avatars.sql
-- M1.10 — avatar storage bucket and its policies.
-- Run this in the Supabase SQL editor after 0001.

-- Public read: avatars are shown to friends, and a URL contains an
-- unguessable user UUID. Served from Supabase's storage origin, which keeps
-- user uploads off the app's own origin (SEC-6).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,                                     -- 2 MB ceiling, server enforced
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Writes are scoped to a folder named after the user's own id, so nobody can
-- overwrite or delete somebody else's picture. The client cannot be trusted
-- to pick an honest path (SEC-3).

drop policy if exists "avatars are readable" on storage.objects;
create policy "avatars are readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "replace own avatar" on storage.objects;
create policy "replace own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own avatar" on storage.objects;
create policy "delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
