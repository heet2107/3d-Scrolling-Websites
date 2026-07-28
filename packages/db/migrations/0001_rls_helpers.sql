-- 0001_rls_helpers.sql
--
-- SECURITY DEFINER helper functions used by every row level security policy.
--
-- Why SECURITY DEFINER is load-bearing and must not be "simplified":
-- a policy on memberships that queries memberships re-triggers its own policy
-- and recurses infinitely in Postgres. Routing the lookup through a definer
-- function evaluates the query with the function owner's privileges, outside
-- policy evaluation, which breaks the cycle.
--
-- All functions pin an empty search_path and schema-qualify every reference,
-- the standard hardening for definer functions.

-- Organisations the current user is a member of.
create or replace function public.user_organisation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organisation_id
  from public.memberships m
  where m.user_id = (select auth.uid())
$$;

-- Member organisations plus their agency children. Agency parents can read
-- (not write) their child organisations; the policy exists from day one even
-- though the agency UI ships much later.
create or replace function public.accessible_organisation_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.organisation_id
  from public.memberships m
  where m.user_id = (select auth.uid())
  union
  select o.id
  from public.organisations o
  join public.memberships m
    on m.organisation_id = o.parent_organisation_id
   and m.user_id = (select auth.uid())
$$;

-- The current user's role in one organisation, null when not a member.
create or replace function public.user_role_in(p_organisation_id uuid)
returns public.membership_role
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.memberships m
  where m.user_id = (select auth.uid())
    and m.organisation_id = p_organisation_id
$$;

-- True when the current user holds one of the given roles in the organisation.
create or replace function public.user_has_role(
  p_organisation_id uuid,
  p_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.user_id = (select auth.uid())
      and m.organisation_id = p_organisation_id
      and m.role = any (p_roles)
  )
$$;

-- True when the current user shares at least one organisation with the target
-- user. Used by the profiles policy so members can see co-member profiles.
create or replace function public.shares_organisation_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs
      on mine.organisation_id = theirs.organisation_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  )
$$;

-- Helper functions are callable by signed-in users only.
revoke all on function public.user_organisation_ids() from public, anon;
revoke all on function public.accessible_organisation_ids() from public, anon;
revoke all on function public.user_role_in(uuid) from public, anon;
revoke all on function public.user_has_role(uuid, public.membership_role[]) from public, anon;
revoke all on function public.shares_organisation_with(uuid) from public, anon;

grant execute on function public.user_organisation_ids() to authenticated;
grant execute on function public.accessible_organisation_ids() to authenticated;
grant execute on function public.user_role_in(uuid) to authenticated;
grant execute on function public.user_has_role(uuid, public.membership_role[]) to authenticated;
grant execute on function public.shares_organisation_with(uuid) to authenticated;
