import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from './server';
import { ROUTES } from '../constant/routes';

export function isRoute(pathname: string, route: string) {
  if (route.includes('[')) {
    // e.g., route = '/user/[id]'
    const base = route.split('[')[0];
    return pathname.startsWith(base);
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

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
  const { pathname } = request.nextUrl;

  const isSignInPage = isRoute(pathname, ROUTES.SIGN_IN);
  const isResetPage = isRoute(pathname, ROUTES.RESET_PASSWORD);
  const isSetupPage = isRoute(pathname, ROUTES.PROFILE_SETUP);
  const isVerifyPage = isRoute(pathname, ROUTES.VERIFICATION);
  const isRootPage = pathname === ROUTES.ROOT;
  const isAdminConsolePage = isRoute(pathname, ROUTES.ADMIN_CONSOLE);
  const isOTPVerificationPage = isRoute(pathname, ROUTES.OTP_CERIFICATION);
  const isForgetPasswordPage = isRoute(pathname, ROUTES.FORGET_PASSWORD);

  // This requires service role privileges!

  if (isOTPVerificationPage) {
    const email =
      request.nextUrl.searchParams.get('code') ||
      request.nextUrl.searchParams.get('token') ||
      request.nextUrl.searchParams.get('email');
    if (!email) {
      // Redirect to sign-in if no email param
      return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
    }
  }

  if (isResetPage) {
    const token =
      request.nextUrl.searchParams.get('code') ||
      request.nextUrl.searchParams.get('token');
    if (!token) {
      // No token, redirect to sign-in
      return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
    }
    // Optionally: verify token validity here
  }

  // GATE 1: Authentication
  if (!user) {
    if (
      !isSignInPage &&
      !isOTPVerificationPage &&
      !isForgetPasswordPage &&
      !isResetPage
    ) {
      return NextResponse.redirect(new URL(ROUTES.SIGN_IN, request.url));
    }
    return supabaseResponse;
  }

  const supabaseAdmin = await createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_setup_complete, role_id')
    .eq('id', user.sub)
    .single();

  // If setup is NOT complete, force them to the setup page

  // GATE 2: Setup Completion
  if (profile && !profile.is_setup_complete && !isSetupPage && !isSignInPage) {
    return NextResponse.redirect(new URL(ROUTES.PROFILE_SETUP, request.url));
  }
  if (profile && !profile.is_setup_complete) {
    return supabaseResponse;
  }

  const is2faVerified = request.cookies.get('2fa-verified')?.value === 'true';

  if (profile?.is_setup_complete && isSetupPage) {
    const dashboard =
      profile.role_id === 0 ? ROUTES.ADMIN_CONSOLE : ROUTES.USER_DASHBOARD;
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  if (!is2faVerified && !isVerifyPage) {
    return NextResponse.redirect(new URL(ROUTES.VERIFICATION, request.url));
  }
  if (!is2faVerified) {
    return supabaseResponse;
  }

  // GATE 4: Final Routing & RBAC
  if (isSignInPage || isSetupPage || isVerifyPage || isRootPage) {
    const dashboard =
      profile?.role_id === 0 ? ROUTES.ADMIN_CONSOLE : ROUTES.USER_DASHBOARD;
    return NextResponse.redirect(new URL(dashboard, request.url));
  }
  // 8. RBAC: non-admins can't access admin-console
  if (isAdminConsolePage && profile?.role_id !== 0) {
    return NextResponse.redirect(new URL(ROUTES.USER_DASHBOARD, request.url));
  }

  // Update Activity Heartbeat
  if (user) {
    await supabaseAdmin
      .from('profiles')
      .update({
        last_seen: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', user.sub);
    if (error) console.error('Heartbeat update failed:', error);
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

  return supabaseResponse;
}
