import { describe, expect, it } from 'vitest'

import { INVITABLE_ROLES, ROLES, roleAtLeast } from './roles'

describe('roleAtLeast', () => {
  it('owner outranks every role', () => {
    for (const role of ROLES) {
      expect(roleAtLeast('owner', role)).toBe(true)
    }
  })

  it('viewer only satisfies viewer', () => {
    expect(roleAtLeast('viewer', 'viewer')).toBe(true)
    expect(roleAtLeast('viewer', 'editor')).toBe(false)
    expect(roleAtLeast('viewer', 'admin')).toBe(false)
    expect(roleAtLeast('viewer', 'owner')).toBe(false)
  })

  it('admin manages members but is not owner', () => {
    expect(roleAtLeast('admin', 'editor')).toBe(true)
    expect(roleAtLeast('admin', 'owner')).toBe(false)
  })
})

describe('INVITABLE_ROLES', () => {
  it('never includes owner — ownership is transferred, not invited', () => {
    expect(INVITABLE_ROLES).not.toContain('owner')
  })
})
