import { NextResponse, type NextRequest } from 'next/server'

/**
 * TODO(phase-1, first implementation task): Supabase session refresh.
 *
 * Use createServerClient from @supabase/ssr here to refresh the auth session
 * cookie on every matched request, call supabase.auth.getUser() (never
 * getSession() in middleware — it does not validate the JWT server-side), and
 * redirect unauthenticated users to /sign-in?next=<original-path>.
 */
export function middleware(request: NextRequest) {
  void request
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
