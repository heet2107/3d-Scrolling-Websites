import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

export * from './schema'

/**
 * Server-only database client. DATABASE_URL carries the service credentials and
 * must never be imported from client components — Phase 1 adds a lint guard.
 */
export function createDb(connectionString: string | undefined = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set — copy .env.example to .env and fill it in')
  }
  const client = postgres(connectionString, { prepare: false })
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>
