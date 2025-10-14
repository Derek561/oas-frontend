import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;

  // Allow unauthenticated access only to login page
  if (!data.session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Prevent logged-in users from visiting /login
  if (data.session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
