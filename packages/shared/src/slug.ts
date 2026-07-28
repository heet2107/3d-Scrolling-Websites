export const SLUG_MAX_LENGTH = 48

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/**
 * Derive a URL-safe organisation slug from a display name.
 * Lowercases, strips diacritics, collapses everything else to single hyphens.
 */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, '')
  return slug
}

/**
 * Collision handling: attempt 0 returns the base slug, attempt N appends `-N-1`
 * style suffixes (base, base-2, base-3, …) while respecting the length cap.
 * The caller retries on unique-constraint violations.
 */
export function slugWithSuffix(base: string, attempt: number): string {
  if (attempt <= 0) return base
  const suffix = `-${attempt + 1}`
  return `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`
}
