import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from './server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.

  // Use getClaims for high-performance local JWT verification (User Session)
  const { data, error } = await supabase.auth.getClaims();
  const user = data?.claims;
  // CUSTOM: Check for our security question completion flag
  const is2faVerified = request.cookies.get('2fa-verified')?.value === 'true';
  const { pathname } = request.nextUrl;

  const userRole = user?.user_metadata?.role;
  // GATE 1: No user session exists
  if (!user) {
    // Redirect if they aren't on the sign-in or public auth routes
    if (!pathname.startsWith('/sign-in') && !pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return supabaseResponse;
  }

  // GATE 2: User is logged in but hasn't passed the Security Question
  // We exclude the verification page and auth callback routes to avoid loops
  if (
    !is2faVerified &&
    !pathname.startsWith('/verification') &&
    !pathname.startsWith('/auth')
  ) {
    return NextResponse.redirect(new URL('/verification', request.url));
  }

  // GATE 3: User is fully verified, prevent them from going back to login/verify
  if (is2faVerified) {
    // If they try to go to Login or Verification, send them to their dashboard
    if (
      pathname === '/' ||
      pathname === '/sign-in' ||
      pathname === '/verification'
    ) {
      const dashboard = userRole === 0 ? '/admin-console' : '/user';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }

    // GATE 4: Role-Based Access Control (Admin only zones)
    if (pathname.startsWith('/admin-console') && userRole !== 0) {
      return NextResponse.redirect(new URL('/user', request.url));
    }
  }

  const isProfileWithId = pathname.startsWith('/user') && pathname !== '/user';

  if (isProfileWithId && userRole !== 0) {
    return NextResponse.redirect(new URL('/user', request.url));
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  if (user) {
    // We use createAdminClient here because standard users shouldn't
    // have permission to update their own 'last_seen' via RLS usually.
    const supabaseAdmin = await createAdminClient();

    // OPTIONAL: Only update once every 60 seconds to save database performance
    // You can skip this if your project is small/for school.
    await supabaseAdmin
      .from('profiles')
      .update({
        last_seen: new Date().toISOString(),
        is_active: true, // Ensure they aren't marked as inactive if they are moving around
      })
      .eq('id', user.sub); // user.sub is the ID in JWT claims
  }
  return supabaseResponse;
}
