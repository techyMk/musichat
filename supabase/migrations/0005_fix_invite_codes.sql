-- 0005_fix_invite_codes.sql
-- Fixes a broken function in 0003. Run after it.
--
-- get_or_create_invite() raised on every call, so the invite screen rendered
-- a link ending in /invite/null. Two faults:
--
--   1. encode(bytea, 'base32') does not exist. Postgres encode() supports
--      base64, hex and escape only.
--   2. gen_random_bytes() lives in pgcrypto, which on Supabase is installed
--      in the `extensions` schema — and the function pins
--      `search_path = public`, so it was out of reach anyway.
--
-- gen_random_uuid() is core Postgres since 13, needs no extension, and is
-- backed by a strong RNG. Deriving the code from it avoids both problems.

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
  attempts int := 0;
begin
  if me is null then raise exception 'not authenticated'; end if;

  select code into found_code
    from public.invites
   where inviter_id = me and revoked_at is null
   order by created_at desc
   limit 1;

  if found_code is not null then return found_code; end if;

  loop
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'could not allocate an invite code';
    end if;

    -- UUID hex is 0-9a-f. Mapping 0 and 1 to w and x removes the characters
    -- most often misread as O and l when a code is typed off a screenshot.
    candidate := substr(
      translate(replace(gen_random_uuid()::text, '-', ''), '01', 'wx'),
      1, 10
    );

    exit when not exists (select 1 from public.invites where code = candidate);
  end loop;

  insert into public.invites (code, inviter_id) values (candidate, me);
  return candidate;
end;
$$;

revoke all on function public.get_or_create_invite() from public, anon;
grant execute on function public.get_or_create_invite() to authenticated;
