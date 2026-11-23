import { NextResponse, type NextRequest } from 'next/server'

// UX gate only (no auth cookie → /login). Real authorisation happens in the API on every call.
export function proxy(req: NextRequest) {
  if (!req.cookies.has('purchasing_at') && !req.cookies.has('purchasing_rt')) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
}
// everything except public pages, the API, and static assets
export const config = { matcher: ['/((?!login|portal/register|forgot-password|api|_next|favicon.ico|.*\\.).*)'] }
