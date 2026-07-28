import { createBrowserClient } from '@supabase/ssr'

/** Browser Supabase client. Uses only the publishable URL and anon key. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set — see .env.example',
    )
  }
  return createBrowserClient(url, anonKey)
}
