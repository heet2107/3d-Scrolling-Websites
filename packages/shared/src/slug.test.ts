import { describe, expect, it } from 'vitest'

import { SLUG_MAX_LENGTH, SLUG_PATTERN, slugWithSuffix, slugify } from './slug'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Acme Web Studio')).toBe('acme-web-studio')
  })

  it('strips diacritics', () => {
    expect(slugify('Café Ærlig — Über Agentur')).toBe('cafe-rlig-uber-agentur')
  })

  it('collapses repeated separators and trims edges', () => {
    expect(slugify('  --Hello,,, World!--  ')).toBe('hello-world')
  })

  it('caps length and never ends with a hyphen', () => {
    const slug = slugify('a'.repeat(30) + ' ' + 'b'.repeat(30))
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('produces slugs matching the shared pattern', () => {
    for (const input of ['Acme', 'D Barot Law', 'ContextQA  2', '3d Scrolling Websites']) {
      expect(slugify(input)).toMatch(SLUG_PATTERN)
    }
  })
})

describe('slugWithSuffix', () => {
  it('returns the base on attempt 0', () => {
    expect(slugWithSuffix('acme', 0)).toBe('acme')
  })

  it('appends incrementing suffixes starting at 2', () => {
    expect(slugWithSuffix('acme', 1)).toBe('acme-2')
    expect(slugWithSuffix('acme', 2)).toBe('acme-3')
  })

  it('respects the length cap when suffixing', () => {
    const base = 'a'.repeat(SLUG_MAX_LENGTH)
    const suffixed = slugWithSuffix(base, 9)
    expect(suffixed.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH)
    expect(suffixed.endsWith('-10')).toBe(true)
  })
})
