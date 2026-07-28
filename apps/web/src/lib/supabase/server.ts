import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Server component / route handler Supabase client, cookie-bound to the
 * current request. Still uses the anon key — RLS is the enforcement layer.
 * The service role key must only ever be used in isolated server-only admin
 * helpers, never in anything importable from client code.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set — see .env.example',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component — safe to ignore when middleware
          // refreshes sessions (the phase-1 middleware TODO).
        }
      },
    },
  })
}
