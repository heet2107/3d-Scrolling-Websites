import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/**
 * Tenancy model, fixed from day one (see docs/architecture):
 *  - direct      an organisation owning one or more sites
 *  - agency      a parent organisation owning client sub-organisations
 *  - enterprise  an organisation with SSO and custom terms
 *
 * Every tenant-scoped table carries organisation_id and is protected by row
 * level security. The policies live in packages/db/migrations — raw SQL, applied
 * after `db:push`, because Drizzle does not model RLS.
 */

export const organisationType = pgEnum('organisation_type', ['direct', 'agency', 'enterprise'])

export const planType = pgEnum('plan_type', ['free', 'starter', 'growth', 'agency', 'enterprise'])

export const membershipRole = pgEnum('membership_role', ['owner', 'admin', 'editor', 'viewer'])

export const organisations = pgTable(
  'organisations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    type: organisationType('type').notNull().default('direct'),
    parentOrganisationId: uuid('parent_organisation_id').references(
      (): AnyPgColumn => organisations.id,
      { onDelete: 'set null' },
    ),
    plan: planType('plan').notNull().default('free'),
    branding: jsonb('branding').notNull().default({}),
    customDomain: text('custom_domain'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('organisations_slug_idx').on(table.slug),
    uniqueIndex('organisations_custom_domain_idx').on(table.customDomain),
    index('organisations_parent_idx').on(table.parentOrganisationId),
  ],
)

/**
 * Mirrors auth.users. The FK to auth.users and the trigger that populates a row
 * on signup are added in migrations/0003_triggers.sql, because the auth schema
 * is owned by Supabase and stays outside Drizzle's management.
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  notificationPreferences: jsonb('notification_preferences').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    role: membershipRole('role').notNull().default('viewer'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('memberships_user_organisation_idx').on(table.userId, table.organisationId),
    index('memberships_organisation_idx').on(table.organisationId),
  ],
)

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: membershipRole('role').notNull().default('viewer'),
    token: text('token').notNull(),
    invitedBy: uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('invitations_token_idx').on(table.token),
    index('invitations_organisation_email_idx').on(table.organisationId, table.email),
  ],
)

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_log_organisation_created_idx').on(table.organisationId, table.createdAt),
  ],
)
