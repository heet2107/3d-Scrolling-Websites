import { z } from 'zod'

import { INVITABLE_ROLES, ROLES } from '../roles'
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '../slug'

export const organisationTypeSchema = z.enum(['direct', 'agency', 'enterprise'])
export type OrganisationType = z.infer<typeof organisationTypeSchema>

export const planSchema = z.enum(['free', 'starter', 'growth', 'agency', 'enterprise'])
export type Plan = z.infer<typeof planSchema>

export const roleSchema = z.enum(ROLES)

export const slugSchema = z
  .string()
  .min(2)
  .max(SLUG_MAX_LENGTH)
  .regex(SLUG_PATTERN, 'Slug may only contain lowercase letters, numbers and hyphens')

export const createOrganisationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema,
})
export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>

export const inviteMemberSchema = z.object({
  email: z.email(),
  role: z.enum(INVITABLE_ROLES),
})
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
