-- 0004_pending_profiles.sql
-- Fixes a gap in 0003. Run after it.
--
-- 0003 let you read a profile only once a friendship was ACCEPTED. But the
-- requests screen has to show who is asking before you decide — and under
-- that policy an incoming request rendered with no name and no face, which
-- makes it impossible to answer sensibly.
--
-- Widening this to any existing friendship row (pending or accepted) is safe.
-- Someone can only create that row by sending you a request, which requires
-- knowing your exact username, and the only profile it exposes is their own —
-- which is precisely what they intended by asking.
--
-- Blocking still wins: is_blocked_pair is checked, so a blocked user's row
-- grants nothing.

create or replace function public.has_friendship_row(a uuid, b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.friendships
    where user_a = least(a, b)
      and user_b = greatest(a, b)
  ) and not public.is_blocked_pair(a, b);
$$;

drop policy if exists "read friends profiles" on public.profiles;
drop policy if exists "read connected profiles" on public.profiles;

create policy "read connected profiles"
  on public.profiles for select
  to authenticated
  using (public.has_friendship_row(auth.uid(), id));
