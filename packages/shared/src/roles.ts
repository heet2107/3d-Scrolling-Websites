/**
 * Role hierarchy for organisation memberships.
 *
 * owner  — everything, including deleting the organisation and transferring ownership
 * admin  — manage members and settings, but cannot delete the organisation
 * editor — modify content resources, but not members or billing
 * viewer — read only
 *
 * The database enforces this hierarchy through row level security policies and
 * triggers (see packages/db/migrations). This module is the single client/server
 * source of truth for role names and ordering.
 */
export const ROLES = ['owner', 'admin', 'editor', 'viewer'] as const

export type Role = (typeof ROLES)[number]

const ROLE_WEIGHT: Record<Role, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
}

/** True when `role` grants at least the privileges of `minimum`. */
export function roleAtLeast(role: Role, minimum: Role): boolean {
  return ROLE_WEIGHT[role] >= ROLE_WEIGHT[minimum]
}

/** Roles that can be assigned through an invitation. Ownership is transferred, never invited. */
export const INVITABLE_ROLES = ['admin', 'editor', 'viewer'] as const satisfies readonly Role[]
