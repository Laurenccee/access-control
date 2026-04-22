'use server';

import { logActivity } from '@/lib/helper/auth';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function sendOTPToEmailAction(email: string) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  try {
    // Find profile for logging and verification
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return { success: false, message: 'No account found for this email.' };
    }

    // Send OTP
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
      },
    });

    // Log the event
    await logActivity(supabaseAdmin, {
      userId: profile.id,
      username: profile.username,
      event: `SEND_OTP`,
      status: otpError ? 'FAILURE' : 'SUCCESS',
    });

    if (otpError) {
      return { success: false, message: otpError.message };
    }

    revalidatePath('/', 'layout');
    return { success: true, message: `OTP sent to ${email}.` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Unexpected error.' };
  }
}

export async function resendOTPAction(email: string) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // Find profile by email
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, username')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    return { success: false, message: 'User not found.' };
  }

  // Send OTP (with options for code-based OTP)
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  // Log the event
  await logActivity(supabaseAdmin, {
    userId: profile.id,
    username: profile.username,
    event: `RESEND_OTP`,
    status: otpError ? 'FAILURE' : 'SUCCESS',
  });

  if (otpError) {
    return { success: false, message: otpError.message };
  }

  return { success: true, message: 'OTP resent.' };
}

export async function signInWithOTPAction(email: string, otp: string) {
  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();
  const cookieStore = await cookies();

  try {
    // Get profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return { success: false, message: 'User not found.' };
    }

    // Get email from auth
    const { data: authUser, error: adminError } =
      await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (adminError || !authUser.user?.email) {
      return { success: false, message: 'Email not found.' };
    }

    // Verify OTP
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: authUser.user.email,
      token: otp,
      type: 'email',
    });

    // Log the event
    await logActivity(supabaseAdmin, {
      userId: profile.id,
      username: email,
      event: `SIGN_IN_OTP`,
      status: otpError ? 'FAILURE' : 'SUCCESS',
    });

    if (otpError) {
      return { success: false, message: otpError.message };
    }

    // Set role cookie if needed
    cookieStore.set('user-role', profile.role_id.toString(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });
    revalidatePath('/', 'layout');

    return { success: true, message: 'OTP verified.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Unexpected error.' };
  }
}
