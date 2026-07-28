-- 0003_triggers.sql
--
-- Auth integration, database-enforced invariants and the organisation
-- creation RPC. Requires 0001 (helpers) and 0002 (policies).

-- ── profiles ↔ auth.users ───────────────────────────────────────────────────

-- The FK lives here rather than in the Drizzle schema because the auth schema
-- is owned by Supabase and stays outside Drizzle's management.
alter table public.profiles
  add constraint profiles_id_auth_users_fkey
  foreign key (id) references auth.users (id) on delete cascade;

-- Populate a profile row automatically on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end
$$;

create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── organisation hierarchy invariants ───────────────────────────────────────

-- One level only: agency -> client. A parent must be an agency and must not
-- itself have a parent.
create or replace function public.enforce_organisation_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.parent_organisation_id is not null then
    if new.parent_organisation_id = new.id then
      raise exception 'organisation cannot be its own parent';
    end if;
    if not exists (
      select 1 from public.organisations p
      where p.id = new.parent_organisation_id
        and p.type = 'agency'
        and p.parent_organisation_id is null
    ) then
      raise exception 'parent organisation must be a top-level agency';
    end if;
  end if;
  return new;
end
$$;

create trigger organisations_enforce_hierarchy
  before insert or update of parent_organisation_id on public.organisations
  for each row execute function public.enforce_organisation_hierarchy();

-- ── membership owner invariants ─────────────────────────────────────────────

-- Two rules the UI alone must never be trusted with:
--   1. Only owners grant, revoke or modify owner memberships (admins manage
--      other members; the RLS policy alone cannot express this distinction).
--   2. The last owner of an organisation cannot be removed or demoted.
-- auth.uid() is null for service-role connections, which skip rule 1 but are
-- still bound by rule 2. Organisation cascade deletes skip both (the parent
-- organisation row is already gone inside the same transaction).
create or replace function public.enforce_membership_owner_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_org uuid := coalesce(old.organisation_id, new.organisation_id);
  v_other_owners integer;
begin
  if not exists (select 1 from public.organisations o where o.id = v_org) then
    return coalesce(new, old);
  end if;

  if v_actor is not null and (
    (tg_op = 'INSERT' and new.role = 'owner')
    or (tg_op = 'UPDATE' and old.role is distinct from new.role
        and (old.role = 'owner' or new.role = 'owner'))
    or (tg_op = 'DELETE' and old.role = 'owner')
  ) then
    if not exists (
      select 1 from public.memberships m
      where m.organisation_id = v_org
        and m.user_id = v_actor
        and m.role = 'owner'
    ) then
      raise exception 'only owners can modify owner memberships';
    end if;
  end if;

  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner') then
    select count(*) into v_other_owners
    from public.memberships m
    where m.organisation_id = old.organisation_id
      and m.role = 'owner'
      and m.id <> old.id;
    if v_other_owners = 0 then
      raise exception 'cannot remove or demote the last owner of an organisation';
    end if;
  end if;

  return coalesce(new, old);
end
$$;

create trigger memberships_enforce_owner_rules
  before insert or update or delete on public.memberships
  for each row execute function public.enforce_membership_owner_rules();

-- ── audit_log immutability ──────────────────────────────────────────────────

-- Insert-only for everyone, including the service role. RLS already denies
-- update/delete for API roles; this closes the gap for privileged connections.
create or replace function public.audit_log_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log rows cannot be modified or deleted';
end
$$;

create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();

-- ── organisation creation RPC ───────────────────────────────────────────────

-- The only way to create an organisation from the API. Atomically inserts the
-- organisation, the creator's owner membership and the audit entry. SECURITY
-- DEFINER because the creator has no membership yet, so no RLS policy could
-- authorise the inserts.
create or replace function public.create_organisation(p_name text, p_slug text)
returns public.organisations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_org public.organisations;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_name is null or length(trim(p_name)) < 2 or length(trim(p_name)) > 80 then
    raise exception 'organisation name must be between 2 and 80 characters';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$' or length(p_slug) > 48 then
    raise exception 'invalid slug';
  end if;

  insert into public.organisations (name, slug)
  values (trim(p_name), p_slug)
  returning * into v_org;

  insert into public.memberships (user_id, organisation_id, role)
  values (v_uid, v_org.id, 'owner');

  insert into public.audit_log
    (organisation_id, actor_user_id, action, resource_type, resource_id, after)
  values
    (v_org.id, v_uid, 'organisation.created', 'organisation', v_org.id::text, to_jsonb(v_org));

  return v_org;
end
$$;

revoke all on function public.create_organisation(text, text) from public, anon;
grant execute on function public.create_organisation(text, text) to authenticated;
