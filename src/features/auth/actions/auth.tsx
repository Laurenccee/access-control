'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SignInData, SignInSchema } from '../schemas/auth';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/helper/auth';

export async function signInAction(values: SignInData) {
  const validatedFields = SignInSchema.safeParse(values);
  if (!validatedFields.success) {
    return { success: false, message: 'Invalid payload.' };
  }

  const { username, password } = validatedFields.data;
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // 1. Get the Profile (Use Admin to ensure we can see it regardless of RLS)
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, failed_attempts, lockout_until, role_id')
    .eq('username', username)
    .single();

  if (profileError || !profile) {
    console.error('Profile not found for username:', username);
    return { success: false, message: 'Invalid credentials.' };
  }

  // 2. Check Lockout
  if (profile.lockout_until && new Date(profile.lockout_until) > new Date()) {
    const waitTime = Math.ceil(
      (new Date(profile.lockout_until).getTime() - Date.now()) / 1000,
    );
    return { success: false, message: `System locked. Retry in ${waitTime}s.` };
  }

  // 3. Get Email from Auth (Private Schema)
  const { data: authUser, error: adminError } =
    await supabaseAdmin.auth.admin.getUserById(profile.id);

  if (adminError || !authUser.user?.email) {
    console.error('Auth user not found for ID:', profile.id);
    return { success: false, message: 'Identity error.' };
  }

  // 4. Authenticate
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: authUser.user.email,
      password: password,
    });

  if (authError) {
    if (authError.code === 'email_not_confirmed') {
      // Log the specific event
      await supabaseAdmin.from('activity_logs').insert({
        user_id: profile.id,
        username,
        event_type: 'SIGN_IN_UNVERIFIED',
        status: 'FAILURE',
      });

      return {
        success: false,
        message: 'Please verify your email address before logging in.',
      };
    }

    const newAttempts = (profile.failed_attempts || 0) + 1;
    let lockoutUntil = null;
    let responseMessage = `Invalid credentials. Attempt ${newAttempts}/3.`;

    if (newAttempts >= 3) {
      lockoutUntil = new Date(Date.now() + 30 * 1000).toISOString();
      responseMessage = 'Too many failed attempts. System locked for 30s.';
    }

    await Promise.all([
      supabaseAdmin
        .from('profiles')
        .update({ failed_attempts: newAttempts, lockout_until: lockoutUntil })
        .eq('id', profile.id),
      supabaseAdmin
        .from('activity_logs')
        .insert({ username, event_type: 'SIGN_IN', status: 'FAILURE' }),
    ]);

    return { success: false, message: responseMessage };
  }

  // 5. Success Flow (Clear attempts)
  await Promise.all([
    supabaseAdmin
      .from('profiles')
      .update({ failed_attempts: 0, lockout_until: null })
      .eq('id', profile.id),
    supabaseAdmin.from('activity_logs').insert({
      user_id: authData.user.id,
      username,
      event_type: 'SIGN_IN',
      status: 'SUCCESS',
    }),
    supabase.auth.updateUser({ data: { role: profile.role_id } }),
  ]);

  const cookieStore = await cookies();

  // Set the role cookie so the proxy can see it immediately
  cookieStore.set('user-role', profile.role_id.toString(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  const cookieStore = await cookies();

  // Get current user info for logging
  // 1. Get user info BEFORE signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const username = user.user_metadata?.username || 'Unknown';

    await logActivity(supabaseAdmin, {
      userId: user.id,
      username: username || 'Admin',
      event: `SIGN_OUT`,
      status: 'SUCCESS',
    });
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, message: error.message };
  }

  cookieStore.delete('2fa-verified');
  cookieStore.delete('user-role');

  revalidatePath('/', 'layout');
  return { success: true };
}
