-- 0002_rls_policies.sql
--
-- Row level security on every tenant-scoped table. RLS is default-deny: any
-- operation without a matching policy is rejected, so the absence of a policy
-- is itself an access rule (called out below wherever it is intentional).
--
-- Role hierarchy enforced here and in 0003 triggers:
--   owner  — everything, including organisation deletion and ownership changes
--   admin  — manage members, invitations and settings; cannot delete the org
--   editor — content resources only (none exist yet in Phase 1)
--   viewer — read only
--
-- Requires the helper functions from 0001_rls_helpers.sql.

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_log enable row level security;

-- ── organisations ───────────────────────────────────────────────────────────

-- Members read their organisations; agency parents also read their children.
create policy organisations_select on public.organisations
  for select to authenticated
  using (id in (select public.accessible_organisation_ids()));

-- No INSERT policy on purpose: organisations are created only through the
-- create_organisation() SECURITY DEFINER function (0003), which atomically
-- inserts the organisation, the creator's owner membership and an audit entry.

create policy organisations_update on public.organisations
  for update to authenticated
  using (public.user_has_role(id, array['owner','admin']::public.membership_role[]))
  with check (public.user_has_role(id, array['owner','admin']::public.membership_role[]));

-- Only the owner may delete an organisation. Admins cannot.
create policy organisations_delete on public.organisations
  for delete to authenticated
  using (public.user_has_role(id, array['owner']::public.membership_role[]));

-- ── profiles ────────────────────────────────────────────────────────────────

-- Your own profile, plus profiles of people you share an organisation with
-- (needed for the members page).
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_organisation_with(id));

-- Signup normally creates the profile via trigger (0003); this policy only
-- allows a user to (re)create their own row, never someone else's.
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No DELETE policy: profile rows leave only via the auth.users cascade.

-- ── memberships ─────────────────────────────────────────────────────────────

create policy memberships_select on public.memberships
  for select to authenticated
  using (organisation_id in (select public.accessible_organisation_ids()));

-- Owners and admins manage members. The 0003 trigger additionally enforces
-- that only owners touch owner rows and that the last owner is untouchable.
create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  );

create policy memberships_update on public.memberships
  for update to authenticated
  using (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  )
  with check (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  );

-- Owners/admins remove members; anyone may remove themselves (leave).
create policy memberships_delete on public.memberships
  for delete to authenticated
  using (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
    or user_id = (select auth.uid())
  );

-- ── invitations ─────────────────────────────────────────────────────────────

-- Invitation management is owner/admin only. The accept flow runs server-side
-- with the service role (token lookup), so no visitor-facing policy is needed.
create policy invitations_select on public.invitations
  for select to authenticated
  using (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  );

create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
    and invited_by = (select auth.uid())
  );

create policy invitations_update on public.invitations
  for update to authenticated
  using (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  )
  with check (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  );

create policy invitations_delete on public.invitations
  for delete to authenticated
  using (
    public.user_has_role(organisation_id, array['owner','admin']::public.membership_role[])
  );

-- ── audit_log ───────────────────────────────────────────────────────────────

-- Members read their own organisation's entries.
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (organisation_id in (select public.user_organisation_ids()));

-- Insert-only, and only into organisations the actor belongs to, as themselves.
create policy audit_log_insert on public.audit_log
  for insert to authenticated
  with check (
    organisation_id in (select public.user_organisation_ids())
    and (actor_user_id is null or actor_user_id = (select auth.uid()))
  );

-- No UPDATE or DELETE policies on purpose; the 0003 trigger additionally makes
-- the table immutable even for the service role.
