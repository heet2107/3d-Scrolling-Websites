import type { ReactNode } from 'react'

/**
 * Shared component library.
 *
 * Deliberately near-empty at scaffold time: the headless primitive library is
 * chosen and justified during Phase 1 implementation, and components land here
 * so the marketing site and dashboard share one design system.
 */

export function Prose({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-2xl leading-relaxed">{children}</div>
}
